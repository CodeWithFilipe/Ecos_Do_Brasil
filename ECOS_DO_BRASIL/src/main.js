import { Input }         from './core/Input.js';
import { Camera }        from './core/Camera.js';
import { SceneManager }  from './core/SceneManager.js';
import { Player }        from './entities/Player.js';
import { NPC }           from './entities/NPC.js';
import { Clio }          from './entities/Clio.js';
import { Interactable }  from './entities/Interactable.js';
import { DialogueBox }   from './ui/DialogueBox.js';
import { Map }           from './world/Map.js';

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

// Debug: F3 = hitboxes de colisão
let debugMode = false;
window.addEventListener('keydown', e => {
    if (e.code === 'F3') { debugMode = !debugMode; e.preventDefault(); }
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

    // Sprites do jogador
    'player'  : './assets/player/Player.png',
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
        setup(map) {
            // Jogador no spawn do mapa
            alex.x = map.spawnPoint.x;
            alex.y = map.spawnPoint.y;
            interactables = [];

            // Estátua de Tiradentes
            const estatua = map.mapObjects.find(o => o.name === 'estatua_tiradentes');
            if (estatua) {
                interactables.push(new Interactable(estatua.x, estatua.y, {
                    name  : 'Estátua de Tiradentes',
                    color : '#C8A96E',
                    width : estatua.width, height: estatua.height,
                    glow  : false,
                    dialogueLines: [
                        { speaker: 'Alex',       text: 'Tiradentes... Um mártir da Inconfidência Mineira.' },
                        { speaker: 'Tiradentes', text: '"A liberdade ainda que tardia." — meu lema.' },
                        { speaker: 'Clio',       text: 'É aqui que tudo começa, Alex. Esta praça guarda ecos de 1789.' }
                    ]
                }));
            }

            // Portais para outras cenas
            const portaIgreja = map.mapObjects.find(o => o.name === 'porta_igreja');
            if (portaIgreja) {
                interactables.push(new Interactable(portaIgreja.x, portaIgreja.y, {
                    name: 'porta_igreja', color: '#8B6914',
                    width: portaIgreja.width, height: portaIgreja.height,
                    glow: true,
                    dialogueLines: [{ speaker: 'Alex', text: '[Entrar na Igreja]' }],
                    onInteractComplete: () => loadScene('igreja')
                }));
            }

            const portaPoeta = map.mapObjects.find(o => o.name === 'porta_poeta');
            if (portaPoeta) {
                interactables.push(new Interactable(portaPoeta.x, portaPoeta.y, {
                    name: 'porta_poeta', color: '#5a8a5a',
                    width: portaPoeta.width, height: portaPoeta.height,
                    glow: true,
                    dialogueLines: [{ speaker: 'Alex', text: '[Entrar na Casa do Poeta]' }],
                    onInteractComplete: () => loadScene('biblioteca')
                }));
            }

            const portaTaverna = map.mapObjects.find(o => o.name === 'porta_taverna');
            if (portaTaverna) {
                interactables.push(new Interactable(portaTaverna.x, portaTaverna.y, {
                    name: 'porta_taverna', color: '#7a4a2a',
                    width: portaTaverna.width, height: portaTaverna.height,
                    glow: true,
                    dialogueLines: [{ speaker: 'Alex', text: '[Entrar na Taverna]' }],
                    onInteractComplete: () => console.log('TODO: taverna')
                }));
            }
        }
    },

    biblioteca: {
        file : 'biblioteca.tmj',
        setup(map) {
            alex.x = map.spawnPoint.x;
            alex.y = map.spawnPoint.y;
            interactables = [];

            // Livro misterioso
            const diario = map.mapObjects.find(o => o.name === 'item_diario');
            interactables.push(new Interactable(
                diario?.x || 150, diario?.y || 80, {
                    name  : 'Livro sem título',
                    color : '#4a2808',
                    width : diario?.width  || 16,
                    height: diario?.height || 16,
                    isItem: true, glow: true,
                    dialogueLines: [
                        { speaker: 'Alex', text: 'Esse livro não tem título. Está emitindo um calor estranho...' },
                        { speaker: '???',  text: '"Quem lê isto foi escolhido. O passado precisa de você."' },
                        { speaker: 'Alex', text: 'As letras estão brilhando!' }
                    ],
                    onInteractComplete: () => {
                        sceneManager.transitionTo('encontro_clio', () => {
                            // Clio aparece ao lado do jogador
                            const clio = new Clio(alex.x + 24, alex.y);
                            interactables.push(clio);
                        });
                    }
                }
            ));

            // Botão de voltar à praça
            interactables.push(new Interactable(map.spawnPoint.x - 30, map.spawnPoint.y + 10, {
                name: 'saida_biblioteca', color: '#555',
                width: 20, height: 20, glow: false,
                dialogueLines: [{ speaker: 'Alex', text: '[Voltar para a Praça]' }],
                onInteractComplete: () => loadScene('praca')
            }));
        }
    },

    igreja: {
        file : 'igreja.tmj',
        setup(map) {
            alex.x = map.spawnPoint.x;
            alex.y = map.spawnPoint.y;
            interactables = [];

            const confissao = map.mapObjects.find(o => o.name === 'item_confissao');
            if (confissao) {
                interactables.push(new Interactable(confissao.x, confissao.y, {
                    name  : 'Confessionário',
                    color : '#4a3060',
                    width : confissao.width, height: confissao.height,
                    glow  : true,
                    dialogueLines: [
                        { speaker: 'Alex', text: 'Uma voz sussurra do confessionário...' },
                        { speaker: 'Padre', text: 'Filho, você veio buscar a verdade? Então prepare-se para ouvi-la.' }
                    ]
                }));
            }

            const saida = map.mapObjects.find(o => o.name === 'saida_igreja');
            if (saida) {
                interactables.push(new Interactable(saida.x, saida.y, {
                    name: 'saida_igreja', color: '#555',
                    width: saida.width, height: saida.height,
                    glow: false,
                    dialogueLines: [{ speaker: 'Alex', text: '[Voltar para a Praça]' }],
                    onInteractComplete: () => loadScene('praca')
                }));
            }
        }
    }
};

// ─────────────────────────────────────────────────────────────
// CARREGAR CENA
// ─────────────────────────────────────────────────────────────
async function loadScene(sceneName) {
    const scene = SCENES[sceneName];
    if (!scene) { console.error('Cena desconhecida:', sceneName); return; }

    sceneManager.transitionTo(sceneName, async () => {
        try {
            const mapData = await fetchMap(scene.file);
            gameMap = buildMap(mapData);

            camera.setBounds(gameMap.widthPx, gameMap.heightPx);

            // Executar setup da cena (posiciona jogador, cria interagíveis)
            scene.setup(gameMap);

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

    // Usando spritesheet único (Cute Fantasy Free)
    alex = new Player(0, 0, {
        spriteSheet : IMAGES['player'],
        frameW    : 32,
        frameH    : 32,
        maxFrames : 6,     // Cada linha costuma ter 6 frames de animação
        hitboxW   : 10,
        hitboxH   : 10,
        speed     : 90,
    });

    dialogueBox = new DialogueBox(canvas, ctx);

    // Começar na Praça
    try {
        const mapData = await fetchMap(SCENES.praca.file);
        gameMap = buildMap(mapData);
        camera.setBounds(gameMap.widthPx, gameMap.heightPx);
        SCENES.praca.setup(gameMap);
        alex.x = gameMap.spawnPoint.x;
        alex.y = gameMap.spawnPoint.y;
        camera.x = alex.x + alex.width  / 2 - camera.width  / 2;
        camera.y = alex.y + alex.height / 2 - camera.height / 2;
    } catch(err) {
        console.warn('⚠️ Praça não carregou, tentando biblioteca:', err);
        const mapData = await fetchMap(SCENES.biblioteca.file);
        gameMap = buildMap(mapData);
        camera.setBounds(gameMap.widthPx, gameMap.heightPx);
        SCENES.biblioteca.setup(gameMap);
        alex.x = gameMap.spawnPoint.x;
        alex.y = gameMap.spawnPoint.y;
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

    if (!dialogueBox.active) {
        alex.update(dt, input, gameMap);
        camera.update(dt, alex);
    }

    dialogueBox.update(dt);

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

    if (debugMode && gameMap) {
        gameMap.drawCollisionDebug(ctx);
        // Hitbox do jogador (verde)
        ctx.strokeStyle = 'rgba(0,255,0,0.9)';
        ctx.lineWidth = 1;
        ctx.strokeRect(alex.x, alex.y, alex.width, alex.height);
        // Caixa de interação (amarelo)
        const ib = alex.getInteractionBox();
        ctx.strokeStyle = 'rgba(255,255,0,0.9)';
        ctx.strokeRect(ib.x, ib.y, ib.width, ib.height);
        // Objetos interagíveis (ciano)
        ctx.strokeStyle = 'rgba(0,255,255,0.6)';
        for (const o of interactables) ctx.strokeRect(o.x, o.y, o.width, o.height);
    }

    camera.restore(ctx);

    // UI (coordenadas de tela)
    if (dialogueBox) dialogueBox.draw();
    sceneManager.draw();
}

// ─────────────────────────────────────────────────────────────
// ARRANCAR
// ─────────────────────────────────────────────────────────────
init();