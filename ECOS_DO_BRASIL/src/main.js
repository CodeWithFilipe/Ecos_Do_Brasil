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

let gameMap       = null;
let alex          = null;
let dialogueBox   = null;
let interactables = [];
let lastTime      = performance.now();
let spaceWasDown  = false;
let gameReady     = false;

// Debug: F3
let debugMode = false;
window.addEventListener('keydown', e => {
    if (e.code === 'F3') { debugMode = !debugMode; e.preventDefault(); }
});

// ─────────────────────────────────────────────────────────────
// REGISTRO GLOBAL DE IMAGENS
// ─────────────────────────────────────────────────────────────
const IMAGES = {};

const IMAGE_SOURCES = {
    // Tilesets (chave = stem do .tsx referenciado no TMJ)
    'Library sprite sheet-00'     : './assets/Library sprite sheet-00.png',
    'atlas_32x'                   : './assets/interior.png',
    'atlas_16x'                   : './assets/overworld.png',
    'atlaas'                      : './assets/exterior.png',
    'atlzzas'                     : './assets/market.png',
    'GothicFurnitureSprites48x48' : './assets/GothicFurnitureSprites48x48.png',

    // Tilesets embedded (casados pelo basename)
    'exterior'  : './assets/exterior.png',
    'farming'   : './assets/farming.png',
    'interior'  : './assets/interior.png',
    'overworld' : './assets/overworld.png',
    'dungeon'   : './assets/dungeon.png',
    'market'    : './assets/market.png',

    // Spritesheet do jogador (Cute Fantasy Free)
    'player' : './assets/player/Player.png',
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
    const entries = Object.entries(IMAGE_SOURCES);
    const results = await Promise.all(entries.map(([, src]) => loadImage(src)));
    entries.forEach(([key], i) => { if (results[i]) IMAGES[key] = results[i]; });
    console.log(`📦 ${Object.keys(IMAGES).length} imagens carregadas`);
}

// ─────────────────────────────────────────────────────────────
// CARREGAMENTO DE MAPA
// ─────────────────────────────────────────────────────────────
async function fetchMap(filename) {
    const resp = await fetch(`./assets/maps/${filename}`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status} — ${filename}`);
    return resp.json();
}

function buildMap(mapData) {
    return new Map(mapData, IMAGES);
}

// ─────────────────────────────────────────────────────────────
// DEFINIÇÃO DAS CENAS
// Vila Rica (praça) é o mapa central / hub
// Biblioteca e Igreja são acessadas por portais
// ─────────────────────────────────────────────────────────────
const SCENES = {

    // ────── VILA RICA (Hub Principal) ──────
    vila_rica: {
        file: 'praca.tmj',
        setup(map) {
            alex.x = map.spawnPoint.x;
            alex.y = map.spawnPoint.y;
            interactables = [];

            // Estátua de Tiradentes
            const estatua = map.mapObjects.find(o => o.name === 'estatua_tiradentes');
            if (estatua) {
                interactables.push(new Interactable(estatua.x, estatua.y, {
                    name: 'Estátua de Tiradentes',
                    width: estatua.width, height: estatua.height,
                    visible: false,
                    dialogueLines: [
                        { speaker: 'Alex',       text: 'Tiradentes... Um mártir da Inconfidência Mineira.' },
                        { speaker: 'Tiradentes', text: '"A liberdade ainda que tardia." — meu lema.' },
                        { speaker: 'Clio',       text: 'É aqui que tudo começa, Alex. Esta praça guarda ecos de 1789.' }
                    ]
                }));
            }

            // Portal → Igreja
            const portaIgreja = map.mapObjects.find(o => o.name === 'porta_igreja');
            if (portaIgreja) {
                interactables.push(new Interactable(portaIgreja.x, portaIgreja.y, {
                    name: 'Entrada da Igreja',
                    width: portaIgreja.width, height: portaIgreja.height,
                    dialogueLines: [{ speaker: 'Alex', text: '[Entrar na Igreja]' }],
                    onInteractComplete: () => loadScene('igreja')
                }));
            }

            // Portal → Biblioteca (Casa do Poeta)
            const portaPoeta = map.mapObjects.find(o => o.name === 'porta_poeta');
            if (portaPoeta) {
                interactables.push(new Interactable(portaPoeta.x, portaPoeta.y, {
                    name: 'Entrada da Casa do Poeta',
                    width: portaPoeta.width, height: portaPoeta.height,
                    dialogueLines: [{ speaker: 'Alex', text: '[Entrar na Casa do Poeta]' }],
                    onInteractComplete: () => loadScene('biblioteca')
                }));
            }

            // Portal → Taverna (TODO)
            const portaTaverna = map.mapObjects.find(o => o.name === 'porta_taverna');
            if (portaTaverna) {
                interactables.push(new Interactable(portaTaverna.x, portaTaverna.y, {
                    name: 'Entrada da Taverna',
                    width: portaTaverna.width, height: portaTaverna.height,
                    dialogueLines: [{ speaker: 'Alex', text: 'A taverna está fechada por enquanto...' }],
                }));
            }
        }
    },

    // ────── BIBLIOTECA ──────
    biblioteca: {
        file: 'biblioteca.tmj',
        setup(map) {
            alex.x = map.spawnPoint.x;
            alex.y = map.spawnPoint.y;
            interactables = [];

            // Livro misterioso (diário)
            const diario = map.mapObjects.find(o => o.name === 'item_diario');
            if (diario) {
                interactables.push(new Interactable(diario.x, diario.y, {
                    name: 'Livro sem título',
                    width: diario.width, height: diario.height,
                    isItem: true, glow: true,
                    glowColor: 'rgba(160, 100, 30, 0.5)',
                    dialogueLines: [
                        { speaker: 'Alex', text: 'Esse livro não tem título. Está emitindo um calor estranho...' },
                        { speaker: '???',  text: '"Quem lê isto foi escolhido. O passado precisa de você."' },
                        { speaker: 'Alex', text: 'As letras estão brilhando!' }
                    ],
                    onInteractComplete: () => {
                        sceneManager.transitionTo('encontro_clio', () => {
                            const clio = new Clio(alex.x + 24, alex.y);
                            interactables.push(clio);
                        });
                    }
                }));
            }

            // Saída → Vila Rica (detectar pelo spawn ou usar posição fixa)
            // Usar a região da porta de saída do mapa
            interactables.push(new Interactable(map.spawnPoint.x, map.spawnPoint.y + 20, {
                name: 'Saída',
                width: 30, height: 10,
                dialogueLines: [{ speaker: 'Alex', text: '[Voltar para Vila Rica]' }],
                onInteractComplete: () => loadScene('vila_rica')
            }));
        }
    },

    // ────── IGREJA ──────
    igreja: {
        file: 'igreja.tmj',
        setup(map) {
            alex.x = map.spawnPoint.x;
            alex.y = map.spawnPoint.y;
            interactables = [];

            // Confessionário
            const confissao = map.mapObjects.find(o => o.name === 'item_confissao');
            if (confissao) {
                interactables.push(new Interactable(confissao.x, confissao.y, {
                    name: 'Confessionário',
                    width: confissao.width, height: confissao.height,
                    isItem: true, glow: true,
                    glowColor: 'rgba(80, 50, 120, 0.5)',
                    dialogueLines: [
                        { speaker: 'Alex',  text: 'Uma voz sussurra do confessionário...' },
                        { speaker: 'Padre', text: 'Filho, você veio buscar a verdade? Então prepare-se para ouvi-la.' }
                    ]
                }));
            }

            // Saída → Vila Rica
            const saida = map.mapObjects.find(o => o.name === 'saida_igreja');
            if (saida) {
                interactables.push(new Interactable(saida.x, saida.y, {
                    name: 'Saída da Igreja',
                    width: saida.width, height: saida.height,
                    dialogueLines: [{ speaker: 'Alex', text: '[Voltar para Vila Rica]' }],
                    onInteractComplete: () => loadScene('vila_rica')
                }));
            }
        }
    }
};

// ─────────────────────────────────────────────────────────────
// CARREGAR CENA (com fade transition)
// ─────────────────────────────────────────────────────────────
async function loadScene(sceneName) {
    const scene = SCENES[sceneName];
    if (!scene) { console.error('Cena desconhecida:', sceneName); return; }

    sceneManager.transitionTo(sceneName, async () => {
        try {
            const mapData = await fetchMap(scene.file);
            gameMap = buildMap(mapData);
            camera.setBounds(gameMap.widthPx, gameMap.heightPx);

            scene.setup(gameMap);

            // Snap câmera no jogador
            camera.x = alex.x + alex.width / 2  - camera.width / 2;
            camera.y = alex.y + alex.height / 2 - camera.height / 2;
            camera.x = Math.max(0, Math.min(camera.x, gameMap.widthPx  - camera.width));
            camera.y = Math.max(0, Math.min(camera.y, gameMap.heightPx - camera.height));

            console.log(`🗺️ Cena "${sceneName}" — spawn (${alex.x|0}, ${alex.y|0})`);
        } catch (err) {
            console.error(`❌ Erro ao carregar "${sceneName}":`, err);
        }
    });
}

// ─────────────────────────────────────────────────────────────
// INICIALIZAÇÃO
// ─────────────────────────────────────────────────────────────
async function init() {
    console.log('🎮 Ecos do Brasil — Inicializando...');

    await loadAllImages();

    // Criar jogador com spritesheet Cute Fantasy Free
    alex = new Player(0, 0, {
        spriteSheet : IMAGES['player'],
        frameW      : 32,
        frameH      : 32,
        maxFrames   : 6,
        hitboxW     : 10,
        hitboxH     : 10,
        speed       : 90,
        animSpeed   : 0.12,
    });

    dialogueBox = new DialogueBox(canvas, ctx);

    // Começar em Vila Rica
    try {
        const mapData = await fetchMap(SCENES.vila_rica.file);
        gameMap = buildMap(mapData);
        camera.setBounds(gameMap.widthPx, gameMap.heightPx);
        SCENES.vila_rica.setup(gameMap);
        camera.x = alex.x + alex.width / 2  - camera.width / 2;
        camera.y = alex.y + alex.height / 2 - camera.height / 2;
    } catch (err) {
        console.warn('⚠️ Vila Rica não carregou, tentando biblioteca:', err);
        const mapData = await fetchMap(SCENES.biblioteca.file);
        gameMap = buildMap(mapData);
        camera.setBounds(gameMap.widthPx, gameMap.heightPx);
        SCENES.biblioteca.setup(gameMap);
    }

    console.log('✅ Jogo pronto! F3 = debug');
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
    return a.x < b.x + b.width  && a.x + a.width  > b.x &&
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
        // Interagíveis (ciano)
        ctx.strokeStyle = 'rgba(0,255,255,0.5)';
        for (const o of interactables) ctx.strokeRect(o.x, o.y, o.width, o.height);
    }

    camera.restore(ctx);

    // UI (tela)
    if (dialogueBox) dialogueBox.draw();
    sceneManager.draw();
}

// ─────────────────────────────────────────────────────────────
init();