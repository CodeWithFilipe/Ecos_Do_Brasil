import { Input }         from './core/Input.js';
import { Camera }        from './core/Camera.js';
import { SceneManager }  from './core/SceneManager.js';
import { Player }        from './entities/Player.js';
import { NPC }           from './entities/NPC.js';
import { Clio }          from './entities/Clio.js';
import { Interactable }  from './entities/Interactable.js';
import { DialogueBox }   from './ui/DialogueBox.js';
import { Map }           from './world/Map.js';

// Novos Sistemas Narrativos
import { gameState }            from './state/GameState.js';
import { HUD }                  from './ui/HUD.js';
import { DiaryOverlay }         from './ui/DiaryOverlay.js';
import { InvestigationBoard }   from './ui/InvestigationBoard.js';
import { GuardianVisionEffect } from './ui/GuardianVisionEffect.js';

// ─────────────────────────────────────────────────────────────
// CANVAS & SISTEMAS GLOBAIS
// ─────────────────────────────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

const input        = new Input();
const camera       = new Camera(canvas.width, canvas.height);
const sceneManager = new SceneManager(canvas, ctx);

let gameMap      = null;
let alex         = null;
let dialogueBox  = null;
let interactables = [];
let lastTime     = performance.now();
let spaceWasDown = false;
let gameReady    = false;

// Instâncias de UI
let hud = null;
let diary = null;
let investigationBoard = null;
let guardianVision = null;

// Debug: F3 = hitboxes de colisão
let debugMode = false;
window.addEventListener('keydown', e => {
    if (e.code === 'F3') { debugMode = !debugMode; e.preventDefault(); }
    if (e.code === 'Tab') { 
        e.preventDefault();
        if (diary) diary.toggle(); 
    }
    if (e.code === 'KeyV' || e.code === 'KeyQ') {
        if (guardianVision && !dialogueBox.active) guardianVision.toggle();
    }
});

// ─────────────────────────────────────────────────────────────
// REGISTRO GLOBAL DE IMAGENS
// Chave = stem do .tsx ou da imagem embedded no TMJ
// ─────────────────────────────────────────────────────────────
const IMAGES = {};   // preenchido por loadAllImages()

const IMAGE_SOURCES = {
    // Tilesets
    'Library sprite sheet-00' : './assets/Library sprite sheet-00.png',
    'atlas_32x'               : './assets/interior.png',
    'atlas_16x'               : './assets/overworld.png',
    'atlaas'                  : './assets/exterior.png',
    'atlzzas'                 : './assets/market.png',
    'GothicFurnitureSprites48x48' : './assets/GothicFurnitureSprites48x48.png',
    // Tilesets embedded (casados pelo basename sem extensão)
    'exterior'                : './assets/exterior.png',
    'farming'                 : './assets/farming.png',
    'interior'                : './assets/interior.png',
    'overworld'               : './assets/overworld.png',
    'dungeon'                 : './assets/dungeon.png',
    'market'                  : './assets/market.png',

    // Sprites do jogador (4 direções)
    'player_down'  : './assets/player/idle_down.png',
    'player_up'    : './assets/player/idle_up.png',
    'player_left'  : './assets/player/idle_left.png',
    'player_right' : './assets/player/idle_right.png',
};

function loadImage(src) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload  = () => resolve(img);
        img.onerror = () => { console.warn(`⚠️ Imagem não encontrada: ${src}`); resolve(null); };
        img.src = src;
    });
}

async function loadAllImages() {
    const entries  = Object.entries(IMAGE_SOURCES);
    const results  = await Promise.all(entries.map(([, src]) => loadImage(src)));
    entries.forEach(([key], i) => { if (results[i]) IMAGES[key] = results[i]; });
    console.log(`📦 ${Object.keys(IMAGES).length} imagens carregadas`);
}

// ─────────────────────────────────────────────────────────────
// CARREGAMENTO DE MAPA
// ─────────────────────────────────────────────────────────────
async function fetchMap(filename) {
    const resp = await fetch(`./assets/maps/${filename}`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status} ao carregar ${filename}`);
    return resp.json();
}

/** Cria uma instância de Map passando o registro global de imagens. */
function buildMap(mapData) {
    return new Map(mapData, IMAGES);
}

/** Garante que as coordenadas de spawn fiquem dentro dos limites do mapa. */
function clampSpawn(map, x, y) {
    const margin = 4;
    return {
        x: Math.max(margin, Math.min(x, map.widthPx  - alex.width  - margin)),
        y: Math.max(margin, Math.min(y, map.heightPx - alex.height - margin)),
    };
}

// ─────────────────────────────────────────────────────────────
// DEFINIÇÃO DAS CENAS
// ─────────────────────────────────────────────────────────────
/**
 * Cada cena = { file, setup(map) }
 * setup() recria os interagíveis e posiciona o jogador.
 */
const SCENES = {

    praca: {
        file : 'praca.tmj',
        setup(map, spawnX, spawnY) {
            map.setProceduralPreset('praca');
            gameState.currentAct = 'ato1';
            const sx = spawnX !== undefined ? spawnX : map.spawnPoint.x;
            const sy = spawnY !== undefined ? spawnY : map.spawnPoint.y;
            const spawn = clampSpawn(map, sx, sy);
            alex.x = spawn.x;
            alex.y = spawn.y;
            interactables = [];

            // Função helper para criar prova
            const addProof = (act, proofId, interactable) => {
                const oldOnComplete = interactable.onInteractComplete;
                interactable.proof = proofId;
                interactable.onInteractComplete = () => {
                    const isNew = gameState.findProof(act, proofId);
                    if (isNew) {
                        gameState.addDiaryEntry(`Encontrei uma nova prova: ${proofId}.`);
                        if (gameState.hasAllProofsForAct(act)) {
                            // Todas as provas encontradas!
                            setTimeout(() => {
                                investigationBoard.show(act, () => {
                                    // Após fechar o mural, atualiza o mapa/estátua
                                    loadScene('praca');
                                });
                            }, 500);
                        }
                    }
                    if (oldOnComplete) oldOnComplete();
                };
                interactables.push(interactable);
            };

            const isSolved = gameState.fragments.includes(1);

            // NPCs Distorcidos da Praça
            if (!isSolved) {
                interactables.push(new Interactable(150, 180, {
                    name: 'Comerciante', distorted: true, width: 16, height: 16,
                    dialogueLines: [
                        { speaker: 'Comerciante (Névoa)', text: 'O alferes quer manter tudo como está...' },
                        { speaker: 'Alex', text: 'Tem algo errado nisso.' }
                    ]
                }));
                interactables.push(new Interactable(250, 150, {
                    name: 'Padre', distorted: true, width: 16, height: 16,
                    dialogueLines: [
                        { speaker: 'Padre (Névoa)', text: 'Os planos de Tiradentes eram para fortalecer a Coroa.' }
                    ]
                }));
            } else {
                interactables.push(new Interactable(150, 180, {
                    name: 'Comerciante', width: 16, height: 16,
                    dialogueLines: [{ speaker: 'Comerciante', text: 'Tiradentes pregava a liberdade.' }]
                }));
            }

            // Estátua de Tiradentes
            const estatua = map.mapObjects.find(o => o.name === 'estatua_tiradentes');
            if (estatua) {
                if (isSolved) {
                    interactables.push(new Interactable(estatua.x, estatua.y, {
                        name  : 'Estátua de Tiradentes', color : '#C8A96E',
                        width : estatua.width, height: estatua.height, glow  : false,
                        dialogueLines: [
                            { speaker: 'Alex', text: 'A placa mudou: "Mártir da Independência Brasileira".' },
                            { speaker: 'Tiradentes', text: '"A liberdade ainda que tardia." — meu lema.' },
                            { speaker: 'Clio', text: 'A história foi restaurada, Alex. A Inconfidência era uma revolução real.' }
                        ]
                    }));
                } else {
                    interactables.push(new Interactable(estatua.x, estatua.y, {
                        name  : 'Estátua Distorcida', color : '#FF3333',
                        width : estatua.width, height: estatua.height, distorted: true, glow: true,
                        dialogueLines: [
                            { speaker: 'Alex', text: 'A placa diz "Defensor da Monarquia Portuguesa"? Isso está errado!' },
                            { speaker: 'Clio', text: 'A Névoa o transformou. Precisamos de três provas para limpar essa distorção.' }
                        ]
                    }));
                }
            }

            // Prova 1: Casa do Poeta
            const portaPoeta = map.mapObjects.find(o => o.name === 'porta_poeta');
            if (portaPoeta) {
                if (isSolved) {
                    interactables.push(new Interactable(portaPoeta.x, portaPoeta.y, {
                        name: 'porta_poeta', color: '#5a8a5a', width: portaPoeta.width, height: portaPoeta.height, glow: false,
                        dialogueLines: [{ speaker: 'Alex', text: 'A porta está trancada.' }]
                    }));
                } else {
                    addProof('ato1', 'carta_gonzaga', new Interactable(portaPoeta.x, portaPoeta.y, {
                        name: 'porta_poeta', color: '#5a8a5a', width: portaPoeta.width, height: portaPoeta.height, glow: true,
                        dialogueLines: [
                            { speaker: 'Alex', text: 'Encontrei uma carta escondida no portal da casa do poeta.' },
                            { speaker: 'Clio', text: 'Fragmento encontrado. Gonzaga escreve que o alferes era o mais ardente na causa da independência.' },
                            { speaker: 'Alex', text: 'Isso contradiz o que as pessoas na praça dizem!' }
                        ]
                    }));
                }
            }

            // Prova 3: Taverna
            const portaTaverna = map.mapObjects.find(o => o.name === 'porta_taverna');
            if (portaTaverna) {
                if (!isSolved && !gameState.hasProof('ato1', 'mapa_conspiracao')) {
                    addProof('ato1', 'mapa_conspiracao', new Interactable(portaTaverna.x, portaTaverna.y, {
                        name: 'porta_taverna', color: '#7a4a2a', width: portaTaverna.width, height: portaTaverna.height, glow: true,
                        dialogueLines: [
                            { speaker: 'Alex', text: 'Sob um assoalho solto... um mapa marcado com reuniões secretas.' },
                            { speaker: 'Clio', text: 'A Inconfidência não era briga de impostos. Era uma revolução para libertar o Brasil e abolir a escravidão.' }
                        ]
                    }));
                }
            }

            // Portal Igreja (Para buscar Prova 2)
            const portaIgreja = map.mapObjects.find(o => o.name === 'porta_igreja');
            if (portaIgreja) {
                interactables.push(new Interactable(portaIgreja.x, portaIgreja.y, {
                    name: 'porta_igreja', color: '#8B6914', width: portaIgreja.width, height: portaIgreja.height, glow: true,
                    dialogueLines: [{ speaker: 'Alex', text: '[Entrar na Igreja]' }],
                    onInteractComplete: () => loadScene('igreja')
                }));
            }
        }
    },

    biblioteca: {
        file : 'biblioteca.tmj',
        setup(map, spawnX, spawnY) {
            map.setProceduralPreset('biblioteca');
            gameState.currentAct = 'prologo';
            const sx = spawnX !== undefined ? spawnX : map.spawnPoint.x;
            const sy = spawnY !== undefined ? spawnY : map.spawnPoint.y;
            const spawn = clampSpawn(map, sx, sy);
            alex.x = spawn.x;
            alex.y = spawn.y;
            interactables = [];

            // Livro misterioso
            const diario = map.mapObjects.find(o => o.name === 'item_diario');
            if (!gameState.fragments.includes(1) && !gameState.hasProof('ato1', 'carta_gonzaga')) {
                interactables.push(new Interactable(
                    diario?.x || 150, diario?.y || 80, {
                        name  : 'Livro sem título', color : '#4a2808',
                        width : diario?.width  || 16, height: diario?.height || 16,
                        isItem: true, glow: true,
                        dialogueLines: [
                            { speaker: 'Alex', text: 'Esse livro não tem título. Está quente como a palma de uma mão...' },
                            { speaker: '???',  text: '"Quem lê isto foi escolhido. O passado precisa de você."' },
                            { speaker: 'Alex', text: 'As páginas estão se movendo sozinhas!' }
                        ],
                        onInteractComplete: () => {
                            sceneManager.transitionTo('encontro_clio', () => {
                                // Cutscene de Clio
                                const clio = new Clio(alex.x + 24, alex.y);
                                clio.dialogueLines = [
                                    { speaker: 'Clio', text: 'Você demorou. Mas para o Brasil, o tempo está se esgotando.' },
                                    { speaker: 'Clio', text: 'Sua habilidade é a Visão do Guardião (V). Ela revela as distorções da Névoa do Esquecimento.' },
                                    { speaker: 'Clio', text: 'Você coletará provas para o seu Diário (Tab). Vamos começar por Vila Rica, 1789.' }
                                ];
                                clio.onInteractComplete = () => { loadScene('praca'); };
                                interactables.push(clio);
                                // Força a interação com a Clio automaticamente
                                setTimeout(() => {
                                    const { lines, callback } = clio.getDialogue();
                                    dialogueBox.show(lines, callback);
                                }, 100);
                            });
                        }
                    }
                ));
            } else {
                // Clio já encontrada
                const clio = new Clio(diario?.x + 20 || 170, diario?.y || 80);
                clio.dialogueLines = [{ speaker: 'Clio', text: 'Volte para a praça, o passado te espera.' }];
                interactables.push(clio);
            }

            // Botão de voltar à praça
            interactables.push(new Interactable(map.spawnPoint.x - 30, map.spawnPoint.y + 10, {
                name: 'saida_biblioteca', color: '#555',
                width: 20, height: 20, glow: false,
                dialogueLines: [{ speaker: 'Alex', text: '[Ir para Vila Rica]' }],
                onInteractComplete: () => loadScene('praca')
            }));
        }
    },

    igreja: {
        file : 'igreja.tmj',
        setup(map, spawnX, spawnY) {
            map.setProceduralPreset('igreja');
            gameState.currentAct = 'ato1';
            const sx = spawnX !== undefined ? spawnX : map.spawnPoint.x;
            const sy = spawnY !== undefined ? spawnY : map.spawnPoint.y;
            const spawn = clampSpawn(map, sx, sy);
            alex.x = spawn.x;
            alex.y = spawn.y;
            interactables = [];

            const isSolved = gameState.fragments.includes(1);
            const confissao = map.mapObjects.find(o => o.name === 'item_confissao');
            
            if (confissao) {
                if (!isSolved && !gameState.hasProof('ato1', 'confissao_conjurado')) {
                    const obj = new Interactable(confissao.x, confissao.y, {
                        name  : 'Confessionário', color : '#4a3060',
                        width : confissao.width, height: confissao.height, glow  : true,
                        dialogueLines: [
                            { speaker: 'Alex', text: 'A Visão do Guardião revela documentos no confessionário...' },
                            { speaker: 'Clio', text: 'É o depoimento de um conjurado. Ele diz que Tiradentes se voluntariou para a liderança, sabendo do risco de morte.' },
                            { speaker: 'Alex', text: 'Isso não é o comportamento de alguém defendendo o rei de Portugal.' }
                        ]
                    });
                    obj.proof = 'confissao_conjurado';
                    obj.onInteractComplete = () => {
                        if (gameState.findProof('ato1', 'confissao_conjurado')) {
                            gameState.addDiaryEntry('Prova encontrada: depoimento de um conjurado.');
                            if (gameState.hasAllProofsForAct('ato1')) {
                                setTimeout(() => { investigationBoard.show('ato1', () => { loadScene('praca'); }); }, 500);
                            }
                        }
                    };
                    interactables.push(obj);
                } else {
                    interactables.push(new Interactable(confissao.x, confissao.y, {
                        name  : 'Confessionário', color : '#4a3060',
                        width : confissao.width, height: confissao.height, glow  : false,
                        dialogueLines: [ { speaker: 'Alex', text: 'Apenas um confessionário antigo.' } ]
                    }));
                }
            }

            const saida = map.mapObjects.find(o => o.name === 'saida_igreja');
            if (saida) {
                interactables.push(new Interactable(saida.x, saida.y, {
                    name: 'saida_igreja', color: '#555',
                    width: saida.width, height: saida.height, glow: false,
                    dialogueLines: [{ speaker: 'Alex', text: '[Voltar para a Praça]' }],
                    onInteractComplete: () => loadScene('praca', 303, 135)
                }));
            }
        }
    }
};

// ─────────────────────────────────────────────────────────────
// CARREGAR CENA
// ─────────────────────────────────────────────────────────────
async function loadScene(sceneName, spawnX, spawnY) {
    const scene = SCENES[sceneName];
    if (!scene) { console.error('Cena desconhecida:', sceneName); return; }

    sceneManager.transitionTo(sceneName, async () => {
        try {
            const mapData = await fetchMap(scene.file);
            gameMap = buildMap(mapData);

            camera.setBounds(gameMap.widthPx, gameMap.heightPx);

            // Executar setup da cena (posiciona jogador, cria interagíveis)
            // O setup() de cada cena já chama map.setProceduralPreset()
            scene.setup(gameMap, spawnX, spawnY);

            // Snap da câmera direto no jogador (sem lerp)
            camera.x = alex.x + alex.width  / 2 - camera.width  / 2;
            camera.y = alex.y + alex.height / 2 - camera.height / 2;
            camera.x = Math.max(0, Math.min(camera.x, gameMap.widthPx  - camera.width));
            camera.y = Math.max(0, Math.min(camera.y, gameMap.heightPx - camera.height));

            console.log(`🗺️ Cena "${sceneName}" carregada — spawn (${alex.x|0}, ${alex.y|0})`);
        } catch(err) {
            console.error(`❌ Erro ao carregar cena "${sceneName}":`, err);
        }
    });
}

// ─────────────────────────────────────────────────────────────
// INICIALIZAÇÃO
// ─────────────────────────────────────────────────────────────
async function init() {
    console.log('🎮 Ecos do Brasil — Inicializando...');

    await loadAllImages();

    // Criar jogador com sprites direcionais
    const playerSprites = {
        down  : IMAGES['player_down'],
        up    : IMAGES['player_up'],
        left  : IMAGES['player_left'],
        right : IMAGES['player_right'],
    };

    // Detectar dimensões do sprite (idle_down como referência)
    let frameW = 48, frameH = 64;
    if (playerSprites.down) {
        frameW = playerSprites.down.naturalWidth;
        frameH = playerSprites.down.naturalHeight;
    }

    alex = new Player(0, 0, {
        sprites : playerSprites,
        frameW, frameH,
        maxFrames : 1,     // idle = 1 frame por PNG
        hitboxW   : 10,
        hitboxH   : 10,
        speed     : 90,
    });

    // Instanciar UI e Sistemas
    dialogueBox = new DialogueBox(canvas, ctx);
    hud = new HUD(canvas, ctx);
    diary = new DiaryOverlay(canvas, ctx);
    investigationBoard = new InvestigationBoard(canvas, ctx);
    guardianVision = new GuardianVisionEffect(canvas, ctx);

    // ── Cena inicial: Biblioteca (onde a história começa) ──────────
    try {
        const mapData = await fetchMap(SCENES.biblioteca.file);
        gameMap = buildMap(mapData);
        camera.setBounds(gameMap.widthPx, gameMap.heightPx);
        SCENES.biblioteca.setup(gameMap);
        // setup() já usa clampSpawn, câmera faz snap no jogador
        camera.x = alex.x + alex.width  / 2 - camera.width  / 2;
        camera.y = alex.y + alex.height / 2 - camera.height / 2;
        camera.x = Math.max(0, Math.min(camera.x, gameMap.widthPx  - camera.width));
        camera.y = Math.max(0, Math.min(camera.y, gameMap.heightPx - camera.height));
    } catch(err) {
        console.warn('⚠️ Biblioteca não carregou, tentando praça:', err);
        const mapData = await fetchMap(SCENES.praca.file);
        gameMap = buildMap(mapData);
        camera.setBounds(gameMap.widthPx, gameMap.heightPx);
        SCENES.praca.setup(gameMap);
        // setup() já usa clampSpawn
        camera.x = alex.x + alex.width  / 2 - camera.width  / 2;
        camera.y = alex.y + alex.height / 2 - camera.height / 2;
        camera.x = Math.max(0, Math.min(camera.x, gameMap.widthPx  - camera.width));
        camera.y = Math.max(0, Math.min(camera.y, gameMap.heightPx - camera.height));
    }

    console.log(`✅ Jogo pronto! Pressione F3 para debug de colisões.`);
    gameReady = true;
    requestAnimationFrame(gameLoop);
}

// ─────────────────────────────────────────────────────────────
// GAME LOOP
// ─────────────────────────────────────────────────────────────
function gameLoop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    if (gameReady) { update(dt); draw(); }
    requestAnimationFrame(gameLoop);
}

function update(dt) {
    sceneManager.update(dt);
    if (sceneManager.transitioning) return;

    if (investigationBoard.active) {
        investigationBoard.update(dt);
        return; // Pause game while board is active
    }

    if (diary.active) return; // Pause game while diary is active

    if (!dialogueBox.active) {
        alex.update(dt, input, gameMap);
        camera.update(dt, alex);
    }

    dialogueBox.update(dt);
    guardianVision.update(dt);

    for (const obj of interactables) {
        if (obj.update) obj.update(dt);
    }

    const space = input.isDown('Space') || input.isDown('KeyE');
    if (space && !spaceWasDown) {
        if (dialogueBox.active) {
            dialogueBox.advance();
        } else {
            checkInteraction();
        }
    }
    spaceWasDown = space;
}

// ─────────────────────────────────────────────────────────────
// INTERAÇÃO
// ─────────────────────────────────────────────────────────────
function rectOverlap(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x &&
           a.y < b.y + b.height && a.y + a.height > b.y;
}

function checkInteraction() {
    const box = alex.getInteractionBox();
    for (const obj of interactables) {
        if (rectOverlap(box, obj) && obj.getDialogue) {
            const { lines, callback } = obj.getDialogue();
            if (lines && lines.length > 0) {
                dialogueBox.show(lines, callback || (() => {}));
            }
            break;
        }
    }
}

// ─────────────────────────────────────────────────────────────
// RENDERIZAÇÃO
// ─────────────────────────────────────────────────────────────
function draw() {
    ctx.fillStyle = '#120d0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Mundo (com câmera)
    camera.apply(ctx);

    if (gameMap) gameMap.draw(ctx);

    for (const obj of interactables) {
        if (obj.draw) obj.draw(ctx);
    }

    if (alex) alex.draw(ctx);

    guardianVision.draw(); // Efeito de visão desenha por cima do mundo

    if (debugMode && gameMap) {
        gameMap.drawCollisionDebug(ctx);
        ctx.strokeStyle = 'rgba(0,255,0,0.9)'; ctx.lineWidth = 1;
        ctx.strokeRect(alex.x, alex.y, alex.width, alex.height);
        const ib = alex.getInteractionBox();
        ctx.strokeStyle = 'rgba(255,255,0,0.9)';
        ctx.strokeRect(ib.x, ib.y, ib.width, ib.height);
        ctx.strokeStyle = 'rgba(0,255,255,0.6)';
        for (const o of interactables) ctx.strokeRect(o.x, o.y, o.width, o.height);
    }

    camera.restore(ctx);

    // UI (coordenadas de tela)
    hud.draw();
    if (dialogueBox) dialogueBox.draw();
    if (investigationBoard) investigationBoard.draw();
    if (diary) diary.draw();
    sceneManager.draw();
}

// ─────────────────────────────────────────────────────────────
// ARRANCAR
// ─────────────────────────────────────────────────────────────
init();