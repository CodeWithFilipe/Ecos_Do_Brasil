import { Input }           from './core/Input.js';
import { Camera }          from './core/Camera.js';
import { SceneManager }    from './core/SceneManager.js';
import { GameState }       from './core/GameState.js';
import { Player }          from './entities/Player.js';
import { NPC }             from './entities/NPC.js';
import { Clio }            from './entities/Clio.js';
import { Interactable }    from './entities/Interactable.js';
import { DialogueBox }     from './ui/DialogueBox.js';
import { InfoPanel }       from './ui/InfoPanel.js';
import { PuzzleUI }        from './ui/PuzzleUI.js';
import { TutorialOverlay } from './ui/TutorialOverlay.js';
import { Map }             from './world/Map.js';

// ═══════════════════════════════════════════════════════════════
// CANVAS & SISTEMAS GLOBAIS
// ═══════════════════════════════════════════════════════════════
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

const input        = new Input();
const camera       = new Camera(canvas.width, canvas.height);
const sceneManager = new SceneManager(canvas, ctx);
const gameState    = new GameState();

let gameMap       = null;
let alex          = null;
let dialogueBox   = null;
let infoPanel     = null;
let puzzleUI      = null;
let tutorial      = null;
let interactables = [];
let lastTime      = performance.now();
let spaceWasDown  = false;
let gameReady     = false;

// Debug
let debugMode = false;
window.addEventListener('keydown', e => {
    if (e.code === 'F3') { debugMode = !debugMode; e.preventDefault(); }
});

// ═══════════════════════════════════════════════════════════════
// REGISTRO DE IMAGENS
// ═══════════════════════════════════════════════════════════════
const IMAGES = {};

const IMAGE_SOURCES = {
    // Tilesets
    'Library sprite sheet-00'     : './assets/Library sprite sheet-00.png',
    'atlas_32x'                   : './assets/interior.png',
    'atlas_16x'                   : './assets/overworld.png',
    'atlaas'                      : './assets/exterior.png',
    'atlzzas'                     : './assets/market.png',
    'GothicFurnitureSprites48x48' : './assets/GothicFurnitureSprites48x48.png',
    'interior free'               : './assets/interior_free.png',
    'interior16'                  : './assets/interior16.png',

    // Tilesets (basename match)
    'exterior'  : './assets/exterior.png',
    'farming'   : './assets/farming.png',
    'interior'  : './assets/interior.png',
    'overworld' : './assets/overworld.png',
    'dungeon'   : './assets/dungeon.png',
    'market'    : './assets/market.png',

    // Player
    'player'         : './assets/player/Player.png',
    'player_actions' : './assets/player/Player_Actions.png',

    // Sprites extras (Cute Fantasy Free)
    'chest'    : './assets/sprites/Chest.png',
    'skeleton' : './assets/sprites/Skeleton.png',
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

// ═══════════════════════════════════════════════════════════════
// CARREGAMENTO DE MAPA
// ═══════════════════════════════════════════════════════════════
async function fetchMap(filename) {
    const resp = await fetch(`./assets/maps/${filename}`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status} — ${filename}`);
    return resp.json();
}

function buildMap(mapData) {
    return new Map(mapData, IMAGES);
}

// ═══════════════════════════════════════════════════════════════
// DEFINIÇÃO DAS CENAS
// ═══════════════════════════════════════════════════════════════

const SCENES = {

    // ─────────────────────────────────────────────
    // BIBLIOTECA (Tutorial — Início do jogo)
    // ─────────────────────────────────────────────
    biblioteca: {
        file: 'biblioteca.tmj',
        setup(map) {
            alex.x = map.spawnPoint.x;
            alex.y = map.spawnPoint.y;
            interactables = [];
            gameState.currentPhase = 'biblioteca';

            // Tutorial ativo
            tutorial.active = true;
            tutorial.step = 0;
            infoPanel.active = false;

            // NPC: Professora
            const professoraX = map.spawnPoint.x - 80;
            const professoraY = map.spawnPoint.y - 120;
            const professora = new NPC(professoraX, professoraY, {
                name: 'Professora',
                color: '#6B3FA0',
                accentColor: '#2d1e4f',
                width: 18, height: 26,
                dialogueLines: [
                    { speaker: 'Professora', text: 'Alex! Que bom que veio à biblioteca.' },
                    { speaker: 'Professora', text: 'Seu trabalho é sobre a Inconfidência Mineira. Período crucial da história do Brasil!' },
                    { speaker: 'Professora', text: 'Procure a bibliotecária, ela sabe onde estão os livros sobre o tema.' },
                    { speaker: 'Alex', text: 'Pode deixar, professora!' },
                ],
                afterDialogueLines: [
                    { speaker: 'Professora', text: 'Já falou com a bibliotecária? Os livros antigos estão na estante dos fundos.' },
                ],
                onInteractComplete: () => {
                    gameState.talkedToTeacher = true;
                    tutorial.setStep(2);
                }
            });
            interactables.push(professora);

            // NPC: Bibliotecária
            const bibX = map.spawnPoint.x + 80;
            const bibY = map.spawnPoint.y - 200;
            const bibliotecaria = new NPC(bibX, bibY, {
                name: 'Bibliotecária',
                color: '#2E7D32',
                accentColor: '#5d4037',
                width: 18, height: 26,
                dialogueLines: [
                    { speaker: 'Bibliotecária', text: 'Olá, Alex! A professora me avisou que você viria.' },
                    { speaker: 'Bibliotecária', text: 'Os livros sobre a Inconfidência estão na estante da direita, lá no fundo.' },
                    { speaker: 'Bibliotecária', text: 'Mas cuidado... tem um livro antigo lá que é bem estranho. Ninguém consegue abri-lo.' },
                    { speaker: 'Alex', text: 'Um livro estranho? Isso me deixou curioso...' },
                ],
                afterDialogueLines: [
                    { speaker: 'Bibliotecária', text: 'O livro misterioso está na estante dos fundos, à direita.' },
                ],
                onInteractComplete: () => {
                    gameState.talkedToLibrarian = true;
                    tutorial.complete();
                }
            });
            interactables.push(bibliotecaria);

            // Item: Livro Antigo
            const diario = map.mapObjects.find(o => o.name === 'item_diario');
            if (diario) {
                interactables.push(new Interactable(diario.x, diario.y, {
                    name: 'Livro Antigo',
                    width: diario.width, height: diario.height,
                    isItem: true, glow: true, visible: true,
                    glowColor: 'rgba(200, 150, 50, 0.6)',
                    dialogueLines: [
                        { speaker: 'Alex', text: 'Esse deve ser o livro que a bibliotecária mencionou...' },
                        { speaker: 'Alex', text: 'Não tem título. Está emitindo um calor estranho...' },
                        { speaker: '???', text: '"Quem lê isto foi escolhido. O passado precisa de você."' },
                        { speaker: 'Alex', text: 'As letras estão brilhando! O que está acontecen—!' },
                    ],
                    onInteractComplete: () => {
                        gameState.bookFound = true;
                        loadScene('templo');
                    }
                }));
            }
        }
    },

    // ─────────────────────────────────────────────
    // TEMPLO (Hub Temporal — Clio)
    // ─────────────────────────────────────────────
    templo: {
        file: 'templo.tmj',
        setup(map) {
            alex.x = map.spawnPoint.x;
            alex.y = map.spawnPoint.y;
            interactables = [];
            gameState.currentPhase = 'templo';
            tutorial.active = false;
            infoPanel.active = false;

            // Clio / Deusa
            const deusa = map.mapObjects.find(o => o.name === 'deusa_item');
            const clioX = deusa ? deusa.x + deusa.width / 2 - 8 : map.spawnPoint.x;
            const clioY = deusa ? deusa.y + deusa.height - 30 : map.spawnPoint.y - 80;

            if (!gameState.clioMet) {
                // Primeira vez: Clio se apresenta e explica a missão
                const clio = new Clio(clioX, clioY, IMAGES['player']);
                clio.dialogueLines = [
                    { speaker: 'Clio', text: 'Finalmente... Alguém me encontrou depois de tantos séculos.' },
                    { speaker: 'Alex', text: 'Onde eu estou?! O que aconteceu?!' },
                    { speaker: 'Clio', text: 'Eu sou Clio, a guardiã da memória. Este templo existe fora do tempo.' },
                    { speaker: 'Clio', text: 'O passado do Brasil está sendo apagado por uma névoa de mentiras.' },
                    { speaker: 'Alex', text: 'Mentiras? Como assim?' },
                    { speaker: 'Clio', text: 'Fake news, Alex. Elas não são coisa de hoje. Existem desde que a história é contada.' },
                    { speaker: 'Clio', text: 'A névoa mistura verdades com mentiras até que ninguém saiba mais o que é real.' },
                    { speaker: 'Clio', text: 'Preciso que você vá à Vila Rica de 1789 e descubra a verdade sobre a Inconfidência Mineira.' },
                    { speaker: 'Alex', text: 'E como eu faço isso?' },
                    { speaker: 'Clio', text: 'Converse com as pessoas de lá. Colete informações. Mas cuidado — nem tudo que ouvir é verdade.' },
                    { speaker: 'Clio', text: 'Quando tiver todas as informações, volte aqui. Eu vou te ajudar a separar verdade de mentira. Vá agora!' },
                ];
                clio.onInteractComplete = () => {
                    gameState.clioMet = true;
                    // Transição automática para a Vila Rica após ela falar na primeira fase
                    loadScene('vila_rica');
                };
                clio.hasBeenIntroduced = false;
                interactables.push(clio);
            } else {
                // Clio após primeira vez
                const clio = new Clio(clioX, clioY, IMAGES['player']);
                clio.hasBeenIntroduced = true;

                if (gameState.hasAllInfos()) {
                    // Tem todas as infos → iniciar puzzle
                    clio.dialogueLines = [
                        { speaker: 'Clio', text: 'Você coletou todas as informações! Agora é hora do desafio.' },
                        { speaker: 'Clio', text: 'Identifique: qual informação deu INÍCIO ao movimento e qual ENCERROU.' },
                        { speaker: 'Clio', text: 'Concentre-se... a névoa de mentiras é traiçoeira.' },
                    ];
                    clio.onInteractComplete = () => {
                        puzzleUI.start(
                            // Acertou
                            () => {
                                dialogueBox.show([
                                    { speaker: 'Clio', text: '🎉 Você dissipou a névoa! A verdade sobre a Inconfidência Mineira está segura!' },
                                    { speaker: 'Clio', text: 'A Derrama provocou a revolta, e a traição de Silvério dos Reis a encerrou.' },
                                    { speaker: 'Clio', text: 'Parabéns, Alex! O passado está a salvo... por enquanto.' },
                                    { speaker: 'Alex', text: 'Isso foi incrível! E agora?' },
                                    { speaker: 'Clio', text: 'Agora, a sua missão continua no Império do Brasil... Prepare-se para o Rio de Janeiro!' }
                                ], () => {
                                    loadScene('rio_de_janeiro');
                                });
                            },
                            // Errou → voltar à Vila Rica
                            () => {
                                gameState.collectedInfos = [];
                                loadScene('vila_rica');
                            }
                        );
                    };
                } else {
                    clio.dialogueLines = [
                        { speaker: 'Clio', text: `Você coletou ${gameState.getInfoCount()} de 4 informações.` },
                        { speaker: 'Clio', text: 'Volte à Vila Rica e converse com mais pessoas.' },
                    ];
                }
                interactables.push(clio);
            }

            // Portal para Vila Rica (somente se não venceu o jogo ainda)
            if (gameState.clioMet && !gameState.gameWon) {
                interactables.push(new Interactable(map.spawnPoint.x, map.spawnPoint.y + 20, {
                    name: 'Portal Vila Rica',
                    width: 40, height: 10,
                    dialogueLines: [{ speaker: 'Alex', text: '[Viajar para Vila Rica — 1789]' }],
                    onInteractComplete: () => loadScene('vila_rica')
                }));
            }
        }
    },

    // ─────────────────────────────────────────────
    // VILA RICA (Hub de Investigação)
    // ─────────────────────────────────────────────
    vila_rica: {
        file: 'praca.tmj',
        setup(map) {
            alex.x = map.spawnPoint.x + 10;
            alex.y = map.spawnPoint.y;
            interactables = [];
            gameState.currentPhase = 'vila_rica';
            tutorial.active = false;
            infoPanel.active = true;

            // NPC 4: Vendedor do Mercado (na estátua de Tiradentes)
            const estatua = map.mapObjects.find(o => o.name === 'estatua_tiradentes');
            if (estatua) {
                const info = GameState.INFO_DATA[3]; // pao_de_queijo
                const vendedor = new NPC(estatua.x - 10, estatua.y + 30, {
                    name: 'Vendedor',
                    color: '#8B4513',
                    accentColor: '#3e2723',
                    width: 14, height: 22,
                    dialogueLines: [
                        { speaker: 'Vendedor', text: 'Pssst! Ei, garoto! Quer ouvir uma história?' },
                        { speaker: 'Alex', text: 'Claro! O que você sabe sobre a Inconfidência?' },
                        { speaker: 'Vendedor', text: info.text },
                        { speaker: 'Alex', text: 'Hmm, isso parece um pouco estranho...' },
                    ],
                    afterDialogueLines: [
                        { speaker: 'Vendedor', text: 'É a pura verdade! Meu avô me contou!' },
                    ],
                    infoData: info,
                    onInteractComplete: () => {
                        if (gameState.addInfo(info)) {
                            infoPanel.notifyNewInfo(info.title);
                        }
                    }
                });
                interactables.push(vendedor);
            }

            // Portal → Poeta (NPC Mineiro Revoltado)
            const portaPoeta = map.mapObjects.find(o => o.name === 'porta_poeta');
            if (portaPoeta) {
                interactables.push(new Interactable(portaPoeta.x, portaPoeta.y, {
                    name: 'Casa do Poeta',
                    width: portaPoeta.width, height: portaPoeta.height,
                    dialogueLines: [{ speaker: 'Alex', text: '[Entrar na Casa do Poeta]' }],
                    onInteractComplete: () => loadScene('poeta')
                }));
            }

            // Portal → Igreja (NPC Espião da Coroa)
            const portaIgreja = map.mapObjects.find(o => o.name === 'porta_igreja');
            if (portaIgreja) {
                interactables.push(new Interactable(portaIgreja.x, portaIgreja.y, {
                    name: 'Igreja',
                    width: portaIgreja.width, height: portaIgreja.height,
                    dialogueLines: [{ speaker: 'Alex', text: '[Entrar na Igreja]' }],
                    onInteractComplete: () => loadScene('igreja')
                }));
            }

            // Portal → Taverna (NPC Contador de Histórias)
            const portaTaverna = map.mapObjects.find(o => o.name === 'porta_taverna');
            if (portaTaverna) {
                interactables.push(new Interactable(portaTaverna.x, portaTaverna.y, {
                    name: 'Taverna',
                    width: portaTaverna.width, height: portaTaverna.height,
                    dialogueLines: [{ speaker: 'Alex', text: '[Entrar na Taverna]' }],
                    onInteractComplete: () => loadScene('taverna')
                }));
            }

            // Portal → Templo (quando tem todas as infos, ou para voltar)
            if (gameState.hasAllInfos()) {
                interactables.push(new Interactable(map.spawnPoint.x, map.spawnPoint.y - 5, {
                    name: 'Portal Templo',
                    width: 24, height: 14,
                    visible: true, glow: true, isItem: true,
                    glowColor: 'rgba(180, 130, 255, 0.6)',
                    dialogueLines: [{ speaker: 'Alex', text: '[Voltar ao Templo com as informações]' }],
                    onInteractComplete: () => loadScene('templo')
                }));
            }
        }
    },

    // ─────────────────────────────────────────────
    // POETA (NPC: Mineiro Revoltado — Info 1: Derrama)
    // ─────────────────────────────────────────────
    poeta: {
        file: 'poeta.tmj',
        setup(map) {
            alex.x = map.spawnPoint.x;
            alex.y = map.spawnPoint.y;
            interactables = [];
            infoPanel.active = true;

            const info = GameState.INFO_DATA[0]; // derrama
            const poetaItem = map.mapObjects.find(o => o.name === 'poeta_item');
            const npcX = poetaItem ? poetaItem.x + 10 : map.spawnPoint.x + 40;
            const npcY = poetaItem ? poetaItem.y + 30 : map.spawnPoint.y - 60;

            const mineiro = new NPC(npcX, npcY, {
                name: 'Mineiro Revoltado',
                color: '#D84315',
                accentColor: '#4a2c2a',
                width: 16, height: 24,
                dialogueLines: [
                    { speaker: 'Mineiro', text: 'Você veio de fora? Cuidado com os soldados da Coroa!' },
                    { speaker: 'Alex', text: 'O que está acontecendo aqui?' },
                    { speaker: 'Mineiro', text: info.text },
                    { speaker: 'Alex', text: 'Isso é revoltante! Portugal não tinha esse direito!' },
                    { speaker: 'Mineiro', text: 'Por isso estamos nos organizando. Chega de exploração!' },
                ],
                afterDialogueLines: [
                    { speaker: 'Mineiro', text: 'Não esqueça: a Derrama foi o estopim de tudo!' },
                ],
                infoData: info,
                onInteractComplete: () => {
                    if (gameState.addInfo(info)) {
                        infoPanel.notifyNewInfo(info.title);
                    }
                }
            });
            interactables.push(mineiro);

            // Saída
            const saida = map.mapObjects.find(o => o.name === 'saida_casa');
            if (saida) {
                interactables.push(new Interactable(saida.x, saida.y, {
                    name: 'Saída',
                    width: saida.width, height: saida.height,
                    dialogueLines: [{ speaker: 'Alex', text: '[Voltar para a Vila Rica]' }],
                    onInteractComplete: () => loadScene('vila_rica')
                }));
            }
        }
    },

    // ─────────────────────────────────────────────
    // IGREJA (NPC: Espião da Coroa — Info 3: Traição)
    // ─────────────────────────────────────────────
    igreja: {
        file: 'igreja.tmj',
        setup(map) {
            alex.x = map.spawnPoint.x;
            alex.y = map.spawnPoint.y;
            interactables = [];
            infoPanel.active = true;

            const info = GameState.INFO_DATA[2]; // traicao
            const confissao = map.mapObjects.find(o => o.name === 'item_confissao');
            const npcX = confissao ? confissao.x + 10 : 150;
            const npcY = confissao ? confissao.y + 30 : 80;

            const espiao = new NPC(npcX, npcY, {
                name: 'Espião da Coroa',
                color: '#37474F',
                accentColor: '#1a1a2e',
                width: 16, height: 24,
                dialogueLines: [
                    { speaker: '???', text: '*sussurrando* Venha cá, garoto. Tenho algo para contar.' },
                    { speaker: 'Alex', text: 'Quem é você?' },
                    { speaker: 'Espião', text: 'Digamos que eu sei de coisas que outros gostariam de esconder...' },
                    { speaker: 'Espião', text: info.text },
                    { speaker: 'Alex', text: 'Um traidor?! Silvério dos Reis entregou todo mundo!' },
                    { speaker: 'Espião', text: 'Silêncio! As paredes têm ouvidos...' },
                ],
                afterDialogueLines: [
                    { speaker: 'Espião', text: 'Já te contei demais. Vá embora antes que nos vejam juntos.' },
                ],
                infoData: info,
                onInteractComplete: () => {
                    if (gameState.addInfo(info)) {
                        infoPanel.notifyNewInfo(info.title);
                    }
                }
            });
            interactables.push(espiao);

            // Saída
            const saida = map.mapObjects.find(o => o.name === 'saida_igreja');
            if (saida) {
                interactables.push(new Interactable(saida.x, saida.y, {
                    name: 'Saída',
                    width: saida.width, height: saida.height,
                    dialogueLines: [{ speaker: 'Alex', text: '[Voltar para a Vila Rica]' }],
                    onInteractComplete: () => loadScene('vila_rica')
                }));
            }
        }
    },

    // ─────────────────────────────────────────────
    // TAVERNA (NPC: Contador de Histórias — Info 2: Dentaduras)
    // ─────────────────────────────────────────────
    taverna: {
        file: 'taverna.tmj',
        setup(map) {
            alex.x = map.spawnPoint.x;
            alex.y = map.spawnPoint.y;
            interactables = [];
            infoPanel.active = true;

            const info = GameState.INFO_DATA[1]; // dentaduras
            const itemMapa = map.mapObjects.find(o => o.name === 'item_mapa');
            const npcX = itemMapa ? itemMapa.x - 30 : map.spawnPoint.x + 40;
            const npcY = itemMapa ? itemMapa.y + 20 : map.spawnPoint.y - 80;

            const contador = new NPC(npcX, npcY, {
                name: 'Contador de Histórias',
                color: '#E65100',
                accentColor: '#bf360c',
                width: 16, height: 24,
                dialogueLines: [
                    { speaker: 'Contador', text: '*goles na caneca* Ah, um viajante! Sente-se, sente-se!' },
                    { speaker: 'Alex', text: 'Boa noite! O que sabe sobre Tiradentes?' },
                    { speaker: 'Contador', text: 'Tiradentes? Ah, eu sei TUDO sobre ele! Escute só...' },
                    { speaker: 'Contador', text: info.text },
                    { speaker: 'Alex', text: 'Dentaduras mágicas?! Isso não parece muito real...' },
                    { speaker: 'Contador', text: 'Claro que é real! Meu bisavô viu com os próprios olhos! *soluço*' },
                ],
                afterDialogueLines: [
                    { speaker: 'Contador', text: '*soluço* Já te contei a história das dentaduras mágicas?' },
                ],
                infoData: info,
                onInteractComplete: () => {
                    if (gameState.addInfo(info)) {
                        infoPanel.notifyNewInfo(info.title);
                    }
                }
            });
            interactables.push(contador);

            // Saída
            const saida = map.mapObjects.find(o => o.name === 'saida_taverna');
            if (saida) {
                interactables.push(new Interactable(saida.x, saida.y, {
                    name: 'Saída',
                    width: saida.width, height: saida.height,
                    dialogueLines: [{ speaker: 'Alex', text: '[Voltar para a Vila Rica]' }],
                    onInteractComplete: () => loadScene('vila_rica')
                }));
            }
        }
    },

    // ─────────────────────────────────────────────
    // RIO DE JANEIRO (Fase 2)
    // ─────────────────────────────────────────────
    rio_de_janeiro: {
        file: 'praca.tmj', // Reutilizando a praça temporariamente para a segunda fase
        setup(map) {
            alex.x = map.spawnPoint.x;
            alex.y = map.spawnPoint.y;
            interactables = [];
            gameState.currentPhase = 'rio_de_janeiro';
            infoPanel.active = false;
            tutorial.active = false;

            const carioca = new NPC(map.spawnPoint.x + 30, map.spawnPoint.y - 10, {
                name: 'Carioca',
                color: '#1E88E5',
                accentColor: '#0D47A1',
                width: 16, height: 24,
                dialogueLines: [
                    { speaker: 'Carioca', text: 'Bem-vindo ao Rio de Janeiro, a capital do Império do Brasil!' },
                    { speaker: 'Carioca', text: 'Aqui nós temos a Família Real e muito pão de açúcar. E não estou falando da montanha!' },
                    { speaker: 'Alex', text: 'Uau! Eu consegui chegar na Fase 2!' },
                    { speaker: 'Carioca', text: 'Exato! A Fase 2 está em construção, mas em breve teremos novos mistérios aqui.' }
                ]
            });
            interactables.push(carioca);
        }
    },
};

// ═══════════════════════════════════════════════════════════════
// CARREGAR CENA (com fade)
// ═══════════════════════════════════════════════════════════════
async function loadScene(sceneName) {
    const scene = SCENES[sceneName];
    if (!scene) { console.error('Cena desconhecida:', sceneName); return; }

    sceneManager.transitionTo(sceneName, async () => {
        try {
            const mapData = await fetchMap(scene.file);
            gameMap = buildMap(mapData);
            camera.setBounds(gameMap.widthPx, gameMap.heightPx);

            scene.setup(gameMap);

            camera.x = alex.x + alex.width / 2  - camera.width / 2;
            camera.y = alex.y + alex.height / 2 - camera.height / 2;
            camera.x = Math.max(0, Math.min(camera.x, gameMap.widthPx  - camera.width));
            camera.y = Math.max(0, Math.min(camera.y, gameMap.heightPx - camera.height));

            console.log(`🗺️ Cena "${sceneName}" — spawn (${alex.x|0}, ${alex.y|0}), infos: ${gameState.getInfoCount()}/4`);
        } catch (err) {
            console.error(`❌ Erro ao carregar "${sceneName}":`, err);
        }
    });
}

// ═══════════════════════════════════════════════════════════════
// INICIALIZAÇÃO
// ═══════════════════════════════════════════════════════════════
async function init() {
    console.log('🎮 Ecos do Brasil — Inicializando...');

    await loadAllImages();

    // Player (Cute Fantasy Free spritesheet)
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

    // UI
    dialogueBox = new DialogueBox(canvas, ctx);
    infoPanel   = new InfoPanel(canvas, ctx, gameState);
    puzzleUI    = new PuzzleUI(canvas, ctx, gameState);
    tutorial    = new TutorialOverlay(canvas, ctx);

    // Começar na Biblioteca
    try {
        const mapData = await fetchMap(SCENES.biblioteca.file);
        gameMap = buildMap(mapData);
        camera.setBounds(gameMap.widthPx, gameMap.heightPx);
        SCENES.biblioteca.setup(gameMap);
        camera.x = alex.x + alex.width / 2  - camera.width / 2;
        camera.y = alex.y + alex.height / 2 - camera.height / 2;
    } catch (err) {
        console.error('❌ Biblioteca não carregou:', err);
        return;
    }

    console.log('✅ Jogo pronto! F3 = debug');
    gameReady = true;
    requestAnimationFrame(gameLoop);
}

// ═══════════════════════════════════════════════════════════════
// GAME LOOP
// ═══════════════════════════════════════════════════════════════
function gameLoop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    if (gameReady) { update(dt); draw(); }
    requestAnimationFrame(gameLoop);
}

function update(dt) {
    sceneManager.update(dt);
    if (sceneManager.transitioning) return;

    // Puzzle ativo: bloqueia tudo
    if (puzzleUI.active) {
        puzzleUI.update(dt);
        return;
    }

    if (!dialogueBox.active) {
        alex.update(dt, input, gameMap);
        camera.update(dt, alex);

        // Tutorial: detectar movimento
        if (tutorial.active && tutorial.step === 0 && alex.hasMoved) {
            tutorial.setStep(1);
        }
    }

    dialogueBox.update(dt);
    tutorial.update(dt);
    infoPanel.update(dt);

    for (const obj of interactables) {
        if (obj.update) obj.update(dt);
    }

    // Interação
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

// ═══════════════════════════════════════════════════════════════
// INTERAÇÃO
// ═══════════════════════════════════════════════════════════════
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
                // Tutorial: detectar primeira interação
                if (tutorial.active && tutorial.step === 1) {
                    tutorial.setStep(2);
                }
                dialogueBox.show(lines, callback || (() => {}));
            }
            break;
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// RENDERIZAÇÃO
// ═══════════════════════════════════════════════════════════════
function draw() {
    ctx.fillStyle = '#120d0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Puzzle fullscreen (sem mundo)
    if (puzzleUI.active) {
        puzzleUI.draw();
        return;
    }

    camera.apply(ctx);

    if (gameMap) gameMap.draw(ctx);

    for (const obj of interactables) {
        if (obj.draw) obj.draw(ctx);
    }

    if (alex) alex.draw(ctx);

    if (debugMode && gameMap) {
        gameMap.drawCollisionDebug(ctx);
        ctx.strokeStyle = 'rgba(0,255,0,0.9)';
        ctx.lineWidth = 1;
        ctx.strokeRect(alex.x, alex.y, alex.width, alex.height);
        const ib = alex.getInteractionBox();
        ctx.strokeStyle = 'rgba(255,255,0,0.9)';
        ctx.strokeRect(ib.x, ib.y, ib.width, ib.height);
        ctx.strokeStyle = 'rgba(0,255,255,0.5)';
        for (const o of interactables) ctx.strokeRect(o.x, o.y, o.width, o.height);
    }

    camera.restore(ctx);

    // UI (tela)
    if (dialogueBox) dialogueBox.draw();
    if (tutorial)    tutorial.draw();
    if (infoPanel)   infoPanel.draw();
    sceneManager.draw();
}

// ═══════════════════════════════════════════════════════════════
init();