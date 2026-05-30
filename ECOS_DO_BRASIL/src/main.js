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
let upWasDown     = false;
let downWasDown   = false;
let gameReady     = false;
let nextSpawnDoor = null;   // Nome da porta para respawn inteligente (ex: 'porta_poeta')

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
    'exterior'     : './assets/exterior.png',
    'farming'      : './assets/farming.png',
    'interior'     : './assets/interior.png',
    'overworld'    : './assets/overworld.png',
    'dungeon'      : './assets/dungeon.png',
    'market'       : './assets/market.png',
    'download (1)' : './assets/download (1).png',
    'download'     : './assets/download.png',
    'republica'    : './assets/republica.png',

    // Player
    'player'         : './assets/player/Player.png',

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
    // BIBLIOTECA (Tutorial — Início do jogo & Quiz Final)
    // ─────────────────────────────────────────────
    biblioteca: {
        file: 'biblioteca.tmj',
        setup(map) {
            alex.x = map.spawnPoint.x;
            alex.y = map.spawnPoint.y;
            interactables = [];
            gameState.currentPhase = 'biblioteca';
            infoPanel.active = false;

            if (gameState.act === 3 && gameState.gameWon) {
                // Fase Final: Quiz com a Professora
                tutorial.active = false;

                // NPC: Bibliotecária (congratulações)
                const bibX = map.spawnPoint.x + 80;
                const bibY = map.spawnPoint.y - 200;
                const bibliotecaria = new NPC(bibX, bibY, {
                    name: 'Bibliotecária',
                    color: '#2E7D32',
                    accentColor: '#5d4037',
                    width: 18, height: 26,
                    dialogueLines: [
                        { speaker: 'Bibliotecária', text: 'Você conseguiu voltar do livro, Alex! Que alívio!' },
                        { speaker: 'Bibliotecária', text: 'Apresente o seu trabalho de história para a professora.' }
                    ]
                });
                interactables.push(bibliotecaria);

                // NPC: Professora (inicia o quiz)
                const professoraX = map.spawnPoint.x - 80;
                const professoraY = map.spawnPoint.y - 120;

                const startQuiz = () => {
                    dialogueBox.show([
                        { speaker: 'Professora', text: 'Alex! Que bom que voltou. Terminou o seu trabalho de pesquisa?' },
                        { speaker: 'Alex', text: 'Sim, professora! Descobri as verdades por trás de vários mitos e fake news históricas.' },
                        { speaker: 'Professora', text: 'Excelente! Mas antes de aceitar seu trabalho, farei 3 perguntas rápidas para testar o seu aprendizado.' }
                    ], askQ1);
                };

                const askQ1 = () => {
                    dialogueBox.showChoices(
                        'Professora',
                        'Pergunta 1: Qual foi o estopim que deu início à Inconfidência Mineira em Vila Rica?',
                        [
                            'A proibição da venda de pão de queijo pela Rainha.',
                            'A cobrança abusiva da Derrama pela Coroa Portuguesa.',
                            'A criação de dentaduras mágicas de ouro por Tiradentes.'
                        ],
                        (choiceIdx) => {
                            if (choiceIdx === 1) {
                                dialogueBox.show([
                                    { speaker: 'Professora', text: 'Correto! A cobrança forçada de impostos atrasados (Derrama) gerou a revolta.' }
                                ], askQ2);
                            } else {
                                dialogueBox.show([
                                    { speaker: 'Professora', text: 'Incorreto, Alex. Esse é um boato fictício. Vamos tentar novamente desde o começo.' }
                                ], startQuiz);
                            }
                        }
                    );
                };

                const askQ2 = () => {
                    dialogueBox.showChoices(
                        'Professora',
                        'Pergunta 2: Quais grupos insatisfeitos iniciaram a Proclamação da República no Rio?',
                        [
                            'Militares, Igreja Católica e grandes fazendeiros de café.',
                            'Vendedores de cocada e a família imperial exilada.',
                            'Apoiadores de Silveira Martins por causa de rivalidade amorosa.'
                        ],
                        (choiceIdx) => {
                            if (choiceIdx === 0) {
                                dialogueBox.show([
                                    { speaker: 'Professora', text: 'Perfeito! Esses três grupos influentes retiraram o apoio à Monarquia.' }
                                ], askQ3);
                            } else {
                                dialogueBox.show([
                                    { speaker: 'Professora', text: 'Incorreto. A rivalidade ou fofocas populares não derrubaram o Império. Vamos recomeçar o teste.' }
                                ], startQuiz);
                            }
                        }
                    );
                };

                const askQ3 = () => {
                    dialogueBox.showChoices(
                        'Professora',
                        'Pergunta 3: Quais foram as reais consequências da assinatura da Lei Áurea em 1888?',
                        [
                            'Os libertos receberam indenizações imensas em ouro da Princesa Isabel.',
                            'A maior parte fugiu a pé para o Uruguai em busca de terras.',
                            'Os libertos foram abandonados sem terras, salários ou educação formal.'
                        ],
                        (choiceIdx) => {
                            if (choiceIdx === 2) {
                                dialogueBox.show([
                                    { speaker: 'Professora', text: 'Sensacional, Alex! Você realmente compreendeu os fatos e a complexidade social da nossa história.' },
                                    { speaker: 'Professora', text: 'Seu trabalho está nota 10 com louvor! Parabéns!' },
                                    { speaker: 'Alex', text: 'Muito obrigado, professora! Valeu muito a pena pesquisar a fundo!' }
                                ], () => {
                                    loadScene('vitoria');
                                });
                            } else {
                                dialogueBox.show([
                                    { speaker: 'Professora', text: 'Incorreto, Alex. Pense na realidade social precária no pós-abolição. Vamos recomeçar.' }
                                ], startQuiz);
                            }
                        }
                    );
                };

                const professora = new NPC(professoraX, professoraY, {
                    name: 'Professora',
                    color: '#6B3FA0',
                    accentColor: '#2d1e4f',
                    width: 18, height: 26,
                    dialogueLines: [
                        { speaker: 'Professora', text: 'Olá, Alex! Veio entregar o seu trabalho de história?' }
                    ],
                    onInteractComplete: startQuiz
                });
                interactables.push(professora);

            } else {
                // Tutorial / Início normal do jogo
                tutorial.active = true;
                tutorial.step = 0;

                // NPC: Professora (normal)
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

                // NPC: Bibliotecária (normal)
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
        }
    },

    // ─────────────────────────────────────────────
    // TEMPLO (Hub Temporal — Clio)
    // ─────────────────────────────────────────────
    templo: {
        file: 'templo.tmj',
        setup(map) {
            // Spawn centralizado no corredor
            alex.x = map.spawnPoint.x + 34;
            alex.y = map.spawnPoint.y - 120;
            alex.resolveCollision(gameMap);
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
                    { speaker: 'Clio', text: 'Preciso que você vai à Vila Rica de 1789 e descubra a verdade sobre a Inconfidência Mineira.' },
                    { speaker: 'Alex', text: 'E como eu faço isso?' },
                    { speaker: 'Clio', text: 'Converse com as pessoas de lá. Colete informações. Mas cuidado — nem tudo que ouvir é verdade.' },
                    { speaker: 'Clio', text: 'Quando tiver todas as informações, volte aqui. Eu vou te ajudar a separar verdade de mentira. Vá agora!' }
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
                    if (gameState.act === 3) {
                        // São Paulo (Lei Áurea)
                        clio.dialogueLines = [
                            { speaker: 'Clio', text: 'Você coletou as informações sobre a Lei Áurea em São Paulo!' },
                            { speaker: 'Clio', text: 'Identifique: qual fato deu INÍCIO ao movimento abolicionista e qual representou as consequências pós-abolição.' },
                            { speaker: 'Clio', text: 'A desinformação também distorceu muito esse momento marcante da nossa história.' }
                        ];
                        clio.onInteractComplete = () => {
                            puzzleUI.start(
                                // Acertou
                                () => {
                                    dialogueBox.show([
                                        { speaker: 'Clio', text: '🎉 Excelente, Alex! A verdade sobre a Lei Áurea foi reestabelecida!' },
                                        { speaker: 'Clio', text: 'A luta popular e a resistência dos quilombos forçaram a abolição, e a falta de amparo social marcou suas consequências.' },
                                        { speaker: 'Clio', text: 'Você protegeu com sucesso os três períodos históricos da nossa investigação!' },
                                        { speaker: 'Alex', text: 'Conseguimos! Agora posso voltar para a biblioteca e entregar meu trabalho de escola?' },
                                        { speaker: 'Clio', text: 'Sim, Alex. O portal o guiará de volta ao seu tempo na biblioteca. Mas fique atento: sua professora o aguarda para avaliar o seu aprendizado!' }
                                    ], () => {
                                        // Resetar informações coletadas para a biblioteca e carregar biblioteca
                                        gameState.collectedInfos = [];
                                        loadScene('biblioteca');
                                    });
                                },
                                // Errou
                                () => {
                                    gameState.collectedInfos = [];
                                    loadScene('sao_paulo');
                                }
                            );
                        };
                    } else if (gameState.act === 2) {
                        // Rio de Janeiro (República)
                        clio.dialogueLines = [
                            { speaker: 'Clio', text: 'Você coletou as informações sobre a República no Rio de Janeiro!' },
                            { speaker: 'Clio', text: 'Identifique: qual fato deu INÍCIO ao movimento e qual consolidou o FIM do Império.' },
                            { speaker: 'Clio', text: 'Pense bem... a desinformação e os boatos eram muito fortes nessa época.' }
                        ];
                        clio.onInteractComplete = () => {
                            puzzleUI.start(
                                // Acertou
                                () => {
                                    dialogueBox.show([
                                        { speaker: 'Clio', text: '🎉 Incrível, Alex! Você dissipou a névoa da Proclamação da República!' },
                                        { speaker: 'Clio', text: 'A insatisfação dos três grupos começou a queda, e o exílio da família real em 2 dias encerrou a Monarquia.' },
                                        { speaker: 'Clio', text: 'Você protegeu a história do Brasil de ser distorcida ou esquecida!' },
                                        { speaker: 'Alex', text: 'Isso foi demais! Sinto que entendi muito melhor como nossa República começou.' },
                                        { speaker: 'Clio', text: 'Sua jornada, contudo, ainda não acabou. Há um último foco de névoa no século XIX...' },
                                        { speaker: 'Clio', text: 'Precisamos ir a São Paulo, em 1888, para desvendar a verdade sobre a assinatura da Lei Áurea.' }
                                    ], () => {
                                        gameState.act = 3;
                                        gameState.collectedInfos = [];
                                        loadScene('sao_paulo');
                                    });
                                },
                                // Errou
                                () => {
                                    gameState.collectedInfos = [];
                                    loadScene('rio_de_janeiro');
                                }
                            );
                        };
                    } else {
                        // Vila Rica (Inconfidência)
                        clio.dialogueLines = [
                            { speaker: 'Clio', text: 'Você coletou todas as informações! Agora é hora do desafio.' },
                            { speaker: 'Clio', text: 'Identifique: qual informação deu INÍCIO ao movimento e qual ENCERROU.' },
                            { speaker: 'Clio', text: 'Concentre-se... a névoa de mentiras é traiçoeira.' }
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
                                        gameState.act = 2;
                                        gameState.collectedInfos = [];
                                        loadScene('rio_de_janeiro');
                                    });
                                },
                                // Errou
                                () => {
                                    gameState.collectedInfos = [];
                                    loadScene('vila_rica');
                                }
                            );
                        };
                    }
                } else {
                    const total = gameState.getRequiredInfoCount();
                    const phaseName = gameState.act === 3 ? 'São Paulo' : (gameState.act === 2 ? 'Rio de Janeiro' : 'Vila Rica');
                    const targetScene = gameState.act === 3 ? 'sao_paulo' : (gameState.act === 2 ? 'rio_de_janeiro' : 'vila_rica');
                    clio.dialogueLines = [
                        { speaker: 'Clio', text: `Você coletou ${gameState.getInfoCount()} de ${total} informações.` },
                        { speaker: 'Clio', text: `Volte a ${phaseName} e converse com mais pessoas para desvendar a verdade.` }
                    ];
                }
                interactables.push(clio);
            }

            // Portal dinâmico
            if (gameState.clioMet && !gameState.gameWon) {
                const targetScene = gameState.act === 3 ? 'sao_paulo' : (gameState.act === 2 ? 'rio_de_janeiro' : 'vila_rica');
                const targetName = gameState.act === 3 ? 'São Paulo — 1888' : (gameState.act === 2 ? 'Rio de Janeiro — 1889' : 'Vila Rica — 1789');
                interactables.push(new Interactable(map.spawnPoint.x, map.spawnPoint.y + 20, {
                    name: 'Portal ' + targetName,
                    width: 40, height: 10,
                    dialogueLines: [{ speaker: 'Alex', text: `[Viajar para ${targetName}]` }],
                    onInteractComplete: () => loadScene(targetScene)
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
            // Respawn inteligente: se veio de um prédio, nasce na porta correspondente
            if (nextSpawnDoor) {
                const door = map.mapObjects.find(o => o.name === nextSpawnDoor);
                if (door) {
                    alex.x = door.x + door.width / 2 - alex.width / 2;
                    alex.y = door.y + door.height + 4;
                } else {
                    alex.x = map.spawnPoint.x + 10;
                    alex.y = map.spawnPoint.y;
                }
                nextSpawnDoor = null;
            } else {
                alex.x = map.spawnPoint.x + 10;
                alex.y = map.spawnPoint.y;
            }
            interactables = [];
            gameState.currentPhase = 'vila_rica';
            tutorial.active = false;
            infoPanel.active = true;

            // NPC 4: Vendedor do Mercado (na estátua de Tiradentes)
            const estatua = map.mapObjects.find(o => o.name === 'estatua_tiradentes');
            if (estatua) {
                const info = GameState.INFO_DATA.vila_rica[3]; // pao_de_queijo
                const vendedor = new NPC(estatua.x - 10, estatua.y + 30, {
                    name: 'Vendedor',
                    color: '#8B4513',
                    accentColor: '#3e2723',
                    width: 14, height: 22,
                    dialogueLines: [
                        { speaker: 'Vendedor', text: 'Pssst! Ei, garoto! Quer ouvir uma história?' },
                        { speaker: 'Alex', text: 'Claro! O que você sabe sobre a Inconfidência?' },
                        { speaker: 'Vendedor', text: 'Como punição final pela rebelião, a Rainha de Portugal confiscou todas as receitas da região.' },
                        { speaker: 'Vendedor', text: 'E proibiu os mineiros de produzirem pão de queijo e doce de leite por cem anos!' },
                        { speaker: 'Vendedor', text: 'Obrigou a população a comer apenas jiló cozido!' },
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

            // Nota: Portal para o Templo é agora criado dinamicamente no update() quando todas as infos forem coletadas
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

            const info = GameState.INFO_DATA.vila_rica[0]; // derrama
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
                    onInteractComplete: () => {
                        nextSpawnDoor = 'porta_poeta';
                        loadScene('vila_rica');
                    }
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

            const info = GameState.INFO_DATA.vila_rica[2]; // traicao
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
                    { speaker: 'Espião', text: 'Os planos de liberdade foram interrompidos antes mesmo da revolta começar.' },
                    { speaker: 'Espião', text: 'Um dos participantes, Joaquim Silvério dos Reis, resolveu trair seus companheiros.' },
                    { speaker: 'Espião', text: 'Ele revelou todo o segredo ao governador de Minas Gerais em troca do perdão de suas dívidas com Portugal.' },
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
                    onInteractComplete: () => {
                        nextSpawnDoor = 'porta_igreja';
                        loadScene('vila_rica');
                    }
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

            const info = GameState.INFO_DATA.vila_rica[1]; // dentaduras
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
                    { speaker: 'Contador', text: 'Joaquim José da Silva Xavier tinha o apelido de Tiradentes porque, nas reuniões secretas...' },
                    { speaker: 'Contador', text: '...ele usava seus conhecimentos de dentista para criar dentaduras mágicas de ouro e diamantes!' },
                    { speaker: 'Contador', text: 'Essas dentaduras ajudavam os rebeldes a morder os soldados inimigos!' },
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
                    onInteractComplete: () => {
                        nextSpawnDoor = 'porta_taverna';
                        loadScene('vila_rica');
                    }
                }));
            }
        }
    },

    // ─────────────────────────────────────────────
    // RIO DE JANEIRO (Paço Imperial — Fase 2)
    // ─────────────────────────────────────────────
    rio_de_janeiro: {
        file: 'pacoimperial.tmj',
        setup(map) {
            alex.x = map.spawnPoint.x;
            alex.y = map.spawnPoint.y;
            interactables = [];
            gameState.currentPhase = 'rio_de_janeiro';
            infoPanel.active = true;
            tutorial.active = false;

            // 1. Quintino Bocaiúva (Jornalista) - Posicionado à esquerda superior
            const infoQuintino = GameState.INFO_DATA.rio_de_janeiro[0]; // republica_inicio (VERDADEIRA)
            const quintino = new NPC(100, 140, {
                name: 'Quintino Bocaiúva',
                color: '#1E88E5',
                accentColor: '#0D47A1',
                width: 16, height: 24,
                dialogueLines: [
                    { speaker: 'Quintino', text: 'Cidadão! Escreva o que digo: o Império desmorona sob o próprio peso.' },
                    { speaker: 'Alex', text: 'Como tudo isso começou, senhor?' },
                    { speaker: 'Quintino', text: infoQuintino.text },
                    { speaker: 'Alex', text: 'Entendi. Grupos muito fortes retiraram o apoio à monarquia.' },
                    { speaker: 'Quintino', text: 'Exatamente! A história está se movendo no Rio de Janeiro.' }
                ],
                afterDialogueLines: [
                    { speaker: 'Quintino', text: 'Igreja, militares e cafeicultores... sem eles, o trono de Dom Pedro II cai!' }
                ],
                infoData: infoQuintino,
                onInteractComplete: () => {
                    if (gameState.addInfo(infoQuintino)) {
                        infoPanel.notifyNewInfo(infoQuintino.title);
                    }
                }
            });
            interactables.push(quintino);

            // 2. Aristocrata Fofoqueiro - Posicionado à direita do casarão central
            const infoAristocrata = GameState.INFO_DATA.rio_de_janeiro[1]; // republica_rival (FALSA)
            const aristocrata = new NPC(360, 280, {
                name: 'Aristocrata',
                color: '#F57C00',
                accentColor: '#E65100',
                width: 16, height: 24,
                dialogueLines: [
                    { speaker: 'Aristocrata', text: 'Você sabe do último babado do Paço?' },
                    { speaker: 'Alex', text: 'Que babado?' },
                    { speaker: 'Aristocrata', text: infoAristocrata.text },
                    { speaker: 'Alex', text: 'Uma mentira amorosa motivou o Marechal? Hum...' }
                ],
                afterDialogueLines: [
                    { speaker: 'Aristocrata', text: 'O amor de uma mulher move exércitos, garoto! Lembre-se disso.' }
                ],
                infoData: infoAristocrata,
                onInteractComplete: () => {
                    if (gameState.addInfo(infoAristocrata)) {
                        infoPanel.notifyNewInfo(infoAristocrata.title);
                    }
                }
            });
            interactables.push(aristocrata);

            // 3. Vendedor Ambulante - Posicionado no centro
            const infoVendedor = GameState.INFO_DATA.rio_de_janeiro[3]; // republica_eleicao (FALSA)
            const vendedor = new NPC(180, 360, {
                name: 'Ambulante',
                color: '#795548',
                accentColor: '#3E2723',
                width: 16, height: 24,
                dialogueLines: [
                    { speaker: 'Ambulante', text: 'Olha a cocada fresquinha! Aproveite que a votação está aberta!' },
                    { speaker: 'Alex', text: 'Votação? Que votação?' },
                    { speaker: 'Ambulante', text: infoVendedor.text },
                    { speaker: 'Alex', text: 'Eleição na Praça XV? Acho que isso não está certo...' }
                ],
                afterDialogueLines: [
                    { speaker: 'Ambulante', text: 'Monarquia ou República? Compre uma cocada e vote na urna da praça!' }
                ],
                infoData: infoVendedor,
                onInteractComplete: () => {
                    if (gameState.addInfo(infoVendedor)) {
                        infoPanel.notifyNewInfo(infoVendedor.title);
                    }
                }
            });
            interactables.push(vendedor);

            // 4. Guarda Imperial - Posicionado na esquerda inferior
            const infoGuarda = GameState.INFO_DATA.rio_de_janeiro[4]; // republica_disfarce (FALSA)
            const guarda = new NPC(60, 440, {
                name: 'Guarda do Paço',
                color: '#3F51B5',
                accentColor: '#1A237E',
                width: 16, height: 24,
                dialogueLines: [
                    { speaker: 'Guarda', text: 'Circulando, cidadão! O Paço está sob guarda militar!' },
                    { speaker: 'Alex', text: 'O Imperador ainda está lá dentro?' },
                    { speaker: 'Guarda', text: infoGuarda.text },
                    { speaker: 'Alex', text: 'Disfarçado de vendedor de cocadas? Essa história é muito absurda.' }
                ],
                afterDialogueLines: [
                    { speaker: 'Guarda', text: 'Aquela barba branca não enganaria ninguém!' }
                ],
                infoData: infoGuarda,
                onInteractComplete: () => {
                    if (gameState.addInfo(infoGuarda)) {
                        infoPanel.notifyNewInfo(infoGuarda.title);
                    }
                }
            });
            interactables.push(guarda);

            // 5. Baronesa do Café - Posicionada na direita inferior
            const infoBaronesa = GameState.INFO_DATA.rio_de_janeiro[5]; // republica_carta (FALSA)
            const baronesa = new NPC(300, 480, {
                name: 'Baronesa',
                color: '#9C27B0',
                accentColor: '#4A148C',
                width: 16, height: 24,
                dialogueLines: [
                    { speaker: 'Baronesa', text: 'Que horror! A nossa ordem monárquica destruída por uma carta!' },
                    { speaker: 'Alex', text: 'Que carta, senhora?' },
                    { speaker: 'Baronesa', text: infoBaronesa.text },
                    { speaker: 'Alex', text: 'A Princesa Isabel ordenou a República? Isso não faz sentido algum.' }
                ],
                afterDialogueLines: [
                    { speaker: 'Baronesa', text: 'Isabel abdicou do trono por preguiça? Ai, que decadência aristocrática!' }
                ],
                infoData: infoBaronesa,
                onInteractComplete: () => {
                    if (gameState.addInfo(infoBaronesa)) {
                        infoPanel.notifyNewInfo(infoBaronesa.title);
                    }
                }
            });
            interactables.push(baronesa);

            // 6. Marechal Deodoro da Fonseca - Posicionado na parte superior central
            const infoDeodoro = GameState.INFO_DATA.rio_de_janeiro[2]; // republica_fim (VERDADEIRA)
            const deodoro = new NPC(240, 120, {
                name: 'Marechal Deodoro',
                color: '#2E7D32',
                accentColor: '#1B5E20',
                width: 16, height: 24,
                dialogueLines: [
                    { speaker: 'Deodoro', text: 'Quem está aí? Identifique-se cidadão!' },
                    { speaker: 'Alex', text: 'Eu sou Alex, senhor. Queria saber o que aconteceu com o Império.' },
                    { speaker: 'Deodoro', text: 'O Império caiu, rapaz. O tempo da monarquia no Brasil expirou.' },
                    { speaker: 'Deodoro', text: infoDeodoro.text },
                    { speaker: 'Alex', text: 'Apenas dois dias para que Dom Pedro II e sua família partissem?!' },
                    { speaker: 'Deodoro', text: 'A pátria exigia pressa para evitar novos conflitos. A República está instaurada!' }
                ],
                afterDialogueLines: [
                    { speaker: 'Deodoro', text: 'O Marechal Deodoro da Fonseca não volta atrás em sua palavra. O Brasil é livre.' }
                ],
                infoData: infoDeodoro,
                onInteractComplete: () => {
                    if (gameState.addInfo(infoDeodoro)) {
                        infoPanel.notifyNewInfo(infoDeodoro.title);
                    }
                }
            });
            interactables.push(deodoro);

            // Nota: Portal para o Templo é agora criado dinamicamente no update() quando todas as infos forem coletadas
        }
    },

    // ─────────────────────────────────────────────
    // SÃO PAULO (Salão da Abolição — Fase 3 / Lei Áurea)
    // ─────────────────────────────────────────────
    sao_paulo: {
        file: 'gabineterepublica.tmj', // Reutiliza o mapa do salão gabinete
        setup(map) {
            alex.x = map.spawnPoint.x;
            alex.y = map.spawnPoint.y;
            interactables = [];
            gameState.currentPhase = 'sao_paulo';
            infoPanel.active = true;
            tutorial.active = false;

            // 1. José do Patrocínio (Abolicionista) - (450, 200)
            const infoPatrocinio = GameState.INFO_DATA.sao_paulo[0]; // leiaurea_inicio (VERDADEIRA)
            const patrocinio = new NPC(450, 200, {
                name: 'José do Patrocínio',
                color: '#3E2723',
                accentColor: '#1B0000',
                width: 16, height: 24,
                dialogueLines: [
                    { speaker: 'José do Patrocínio', text: 'Alex! A abolição não foi uma concessão real. Foi conquistada a duras penas.' },
                    { speaker: 'Alex', text: 'Como assim? Não foi a Princesa Isabel quem decidiu tudo sozinha?' },
                    { speaker: 'José do Patrocínio', text: infoPatrocinio.text },
                    { speaker: 'Alex', text: 'Entendi! A pressão do povo e dos abolicionistas foi o verdadeiro motor.' }
                ],
                afterDialogueLines: [
                    { speaker: 'José do Patrocínio', text: 'O Movimento Abolicionista e as lutas populares forçaram o fim desse sistema!' }
                ],
                infoData: infoPatrocinio,
                onInteractComplete: () => {
                    if (gameState.addInfo(infoPatrocinio)) {
                        infoPanel.notifyNewInfo(infoPatrocinio.title);
                    }
                }
            });
            interactables.push(patrocinio);

            // 2. Duquesa Imperial - (350, 250)
            const infoDuquesa = GameState.INFO_DATA.sao_paulo[1]; // leiaurea_caneta (FALSA)
            const duquesa = new NPC(350, 250, {
                name: 'Duquesa Imperial',
                color: '#D81B60',
                accentColor: '#880E4F',
                width: 16, height: 24,
                dialogueLines: [
                    { speaker: 'Duquesa', text: 'Você soube da caneta majestosa usada para assinar a lei?' },
                    { speaker: 'Alex', text: 'Como ela era?' },
                    { speaker: 'Duquesa', text: infoDuquesa.text },
                    { speaker: 'Alex', text: 'Uma caneta pesando um quilo? Que exagero de história...' }
                ],
                afterDialogueLines: [
                    { speaker: 'Duquesa', text: 'Foi um marco de luxo, meu jovem! Ouro maciço e brilhantes.' }
                ],
                infoData: infoDuquesa,
                onInteractComplete: () => {
                    if (gameState.addInfo(infoDuquesa)) {
                        infoPanel.notifyNewInfo(infoDuquesa.title);
                    }
                }
            });
            interactables.push(duquesa);

            // 3. Joaquim Nabuco (Político abolicionista) - (550, 250)
            const infoNabuco = GameState.INFO_DATA.sao_paulo[2]; // leiaurea_fim (VERDADEIRA)
            const nabuco = new NPC(550, 250, {
                name: 'Joaquim Nabuco',
                color: '#0D47A1',
                accentColor: '#002171',
                width: 16, height: 24,
                dialogueLines: [
                    { speaker: 'Joaquim Nabuco', text: 'A Lei Áurea trouxe a liberdade jurídica, mas não a igualdade de fato.' },
                    { speaker: 'Alex', text: 'O que aconteceu com os libertos no dia seguinte?' },
                    { speaker: 'Joaquim Nabuco', text: infoNabuco.text },
                    { speaker: 'Alex', text: 'Entendi. A liberdade veio sem nenhuma garantia de direitos básicos ou sustento.' }
                ],
                afterDialogueLines: [
                    { speaker: 'Joaquim Nabuco', text: 'A Lei de 1888 foi o fim do regime oficial, mas o início de uma longa exclusão social.' }
                ],
                infoData: infoNabuco,
                onInteractComplete: () => {
                    if (gameState.addInfo(infoNabuco)) {
                        infoPanel.notifyNewInfo(infoNabuco.title);
                    }
                }
            });
            interactables.push(nabuco);

            // 4. Fazendeiro de Café - (300, 400)
            const infoFazendeiro = GameState.INFO_DATA.sao_paulo[3]; // leiaurea_indeniza (FALSA)
            const fazendeiro = new NPC(300, 400, {
                name: 'Fazendeiro de Café',
                color: '#4E342E',
                accentColor: '#270F0A',
                width: 16, height: 24,
                dialogueLines: [
                    { speaker: 'Fazendeiro', text: 'A Princesa Isabel acabou com os cofres do governo!' },
                    { speaker: 'Alex', text: 'Por que o senhor diz isso?' },
                    { speaker: 'Fazendeiro', text: infoFazendeiro.text },
                    { speaker: 'Alex', text: 'Duvido muito que o Império tenha pago indenizações generosas aos libertos.' }
                ],
                afterDialogueLines: [
                    { speaker: 'Fazendeiro', text: 'Ela foi benevolente demais! Nos deixou sem mão de obra e distribuiu fortunas!' }
                ],
                infoData: infoFazendeiro,
                onInteractComplete: () => {
                    if (gameState.addInfo(infoFazendeiro)) {
                        infoPanel.notifyNewInfo(infoFazendeiro.title);
                    }
                }
            });
            interactables.push(fazendeiro);

            // 5. Senador Conservador - (600, 400)
            const infoSenador = GameState.INFO_DATA.sao_paulo[4]; // leiaurea_votacao (FALSA)
            const senador = new NPC(600, 400, {
                name: 'Senador Conservador',
                color: '#37474F',
                accentColor: '#102027',
                width: 16, height: 24,
                dialogueLines: [
                    { speaker: 'Senador', text: 'A aprovação da Lei Áurea seguiu uma transição prudente no Parlamento.' },
                    { speaker: 'Alex', text: 'Não foi imediata para todos?' },
                    { speaker: 'Senador', text: infoSenador.text },
                    { speaker: 'Alex', text: 'Isso não faz sentido. A Lei Áurea declarou extinta a escravidão a partir de sua data de publicação.' }
                ],
                afterDialogueLines: [
                    { speaker: 'Senador', text: 'Manter a transição gradual era fundamental para os proprietários rurais.' }
                ],
                infoData: infoSenador,
                onInteractComplete: () => {
                    if (gameState.addInfo(infoSenador)) {
                        infoPanel.notifyNewInfo(infoSenador.title);
                    }
                }
            });
            interactables.push(senador);

            // 6. Cidadão Festivo - (700, 300)
            const infoCidadao = GameState.INFO_DATA.sao_paulo[5]; // leiaurea_dia (FALSA)
            const cidadao = new NPC(700, 300, {
                name: 'Cidadão Festivo',
                color: '#FFB300',
                accentColor: '#FF6F00',
                width: 16, height: 24,
                dialogueLines: [
                    { speaker: 'Cidadão', text: 'Hoje é dia de comemoração nacional obrigatória!' },
                    { speaker: 'Alex', text: 'Como assim obrigatória?' },
                    { speaker: 'Cidadão', text: infoCidadao.text },
                    { speaker: 'Alex', text: 'Multa por não vestir branco e dançar? Isso soa totalmente falso.' }
                ],
                afterDialogueLines: [
                    { speaker: 'Cidadão', text: 'Todo mundo na praça celebrando! Quem não dançar é contra a pátria!' }
                ],
                infoData: infoCidadao,
                onInteractComplete: () => {
                    if (gameState.addInfo(infoCidadao)) {
                        infoPanel.notifyNewInfo(infoCidadao.title);
                    }
                }
            });
            interactables.push(cidadao);

            // 7. Negociador Inglês - (250, 500)
            const infoNegociador = GameState.INFO_DATA.sao_paulo[6]; // leiaurea_compra (FALSA)
            const negociador = new NPC(250, 500, {
                name: 'Negociador Inglês',
                color: '#E53935',
                accentColor: '#7F0000',
                width: 16, height: 24,
                dialogueLines: [
                    { speaker: 'Negociador', text: 'A liberdade no Brasil tem o patrocínio britânico, rapaz.' },
                    { speaker: 'Alex', text: 'Como a Inglaterra atuou na assinatura da lei?' },
                    { speaker: 'Negociador', text: infoNegociador.text },
                    { speaker: 'Alex', text: 'Comprar e alugar de volta? Esse boato é completamente mentiroso.' }
                ],
                afterDialogueLines: [
                    { speaker: 'Negociador', text: 'Tudo é business! O império britânico manda no mercado internacional.' }
                ],
                infoData: infoNegociador,
                onInteractComplete: () => {
                    if (gameState.addInfo(infoNegociador)) {
                        infoPanel.notifyNewInfo(infoNegociador.title);
                    }
                }
            });
            interactables.push(negociador);

            // 8. Imigrante Italiano - (650, 500)
            const infoImigrante = GameState.INFO_DATA.sao_paulo[7]; // leiaurea_fuga (FALSA)
            const imigrante = new NPC(650, 500, {
                name: 'Imigrante Italiano',
                color: '#43A047',
                accentColor: '#1B5E20',
                width: 16, height: 24,
                dialogueLines: [
                    { speaker: 'Imigrante', text: 'Mamma mia! As plantações paulistas ficaram desertas antes do dia 13!' },
                    { speaker: 'Alex', text: 'Para onde as pessoas fugiram?' },
                    { speaker: 'Imigrante', text: infoImigrante.text },
                    { speaker: 'Alex', text: 'Caminhar a pé de São Paulo até o Uruguai? Isso é geograficamente impossível!' }
                ],
                afterDialogueLines: [
                    { speaker: 'Imigrante', text: 'Eu vi a multidão marchando rumo ao sul! Disseram que era muito longe...' }
                ],
                infoData: infoImigrante,
                onInteractComplete: () => {
                    if (gameState.addInfo(infoImigrante)) {
                        infoPanel.notifyNewInfo(infoImigrante.title);
                    }
                }
            });
            interactables.push(imigrante);

            // Nota: Portal para o Templo é agora criado dinamicamente no update() quando todas as infos forem coletadas
        }
    },

    // ─────────────────────────────────────────────
    // VITÓRIA (Créditos / Tela Final)
    // ─────────────────────────────────────────────
    vitoria: {
        file: 'templo.tmj', // Reutiliza o templo como fundo decorativo
        setup(map) {
            alex.x = map.spawnPoint.x + 34;
            alex.y = map.spawnPoint.y - 120;
            interactables = [];
            infoPanel.active = false;
            tutorial.active = false;

            // Mostrar mensagem final de vitória bloqueando a tela via diálogo
            setTimeout(() => {
                dialogueBox.show([
                    { speaker: 'História', text: '🏆 PARABÉNS! VOCÊ COMPLETOU A AVENTURA COM SUCESSO!' },
                    { speaker: 'História', text: 'Graças aos seus esforços intelectuais, as fakenews do passado foram corrigidas.' },
                    { speaker: 'História', text: 'A Inconfidência Mineira, a Proclamação da República e a Lei Áurea estão seguras nos livros escolares.' },
                    { speaker: 'Alex', text: 'Ufa! A verdade sempre vence no final.' },
                    { speaker: 'Clio', text: 'Obrigada por jogar Ecos do Brasil!' },
                    { speaker: 'Desenvolvedor', text: 'Créditos: Jogo desenvolvido em JavaScript puro utilizando Tiled e Canvas 2D.' }
                ]);
            }, 500);
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
            alex.resolveCollision(gameMap);

            camera.x = alex.x + alex.width / 2  - camera.width / 2;
            camera.y = alex.y + alex.height / 2 - camera.height / 2;
            camera.x = Math.max(0, Math.min(camera.x, gameMap.widthPx  - camera.width));
            camera.y = Math.max(0, Math.min(camera.y, gameMap.heightPx - camera.height));

            console.log(`🗺️ Cena "${sceneName}" — spawn (${alex.x|0}, ${alex.y|0}), infos: ${gameState.getInfoCount()}/${gameState.getRequiredInfoCount()}`);
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
        speed       : 100,
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
        alex.resolveCollision(gameMap);
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

    // Se houver opções de escolha no diálogo ativas, interceptamos o teclado
    if (dialogueBox.active && dialogueBox.options && dialogueBox.options.length > 0) {
        const up = input.isDown('ArrowUp') || input.isDown('KeyW');
        const down = input.isDown('ArrowDown') || input.isDown('KeyS');
        
        if (up && !upWasDown) {
            dialogueBox.navigateOptions(-1);
        } else if (down && !downWasDown) {
            dialogueBox.navigateOptions(1);
        }
        
        upWasDown = up;
        downWasDown = down;

        const confirm = input.isDown('Space') || input.isDown('KeyE') || input.isDown('Enter');
        if (confirm && !spaceWasDown) {
            dialogueBox.selectCurrentOption();
        }
        spaceWasDown = confirm;
        
        dialogueBox.update(dt);
        tutorial.update(dt);
        infoPanel.update(dt);
        return;
    }

    // Reseta trackers do menu se não estiver ativo
    upWasDown = false;
    downWasDown = false;

    if (!dialogueBox.active) {
        alex.update(dt, input, gameMap, interactables);
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

    checkSpawnTemploPortal();

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
// LOGICA DE PORTAIS DINAMICOS
// ═══════════════════════════════════════════════════════════════
function checkSpawnTemploPortal() {
    if (!gameMap) return;
    const phasesWithPortals = ['vila_rica', 'rio_de_janeiro', 'sao_paulo'];
    if (!phasesWithPortals.includes(gameState.currentPhase)) return;
    if (!gameState.hasAllInfos()) return;

    // Verifica se o portal já existe
    const hasPortal = interactables.some(item => item.name === 'Portal Templo');
    if (hasPortal) return;

    console.log('✨ Todos os fatos coletados! Abrindo portal para o Templo.');
    if (gameState.currentPhase === 'vila_rica') {
        interactables.push(new Interactable(gameMap.spawnPoint.x, gameMap.spawnPoint.y - 5, {
            name: 'Portal Templo',
            width: 24, height: 14,
            visible: true, glow: true, isItem: true,
            glowColor: 'rgba(180, 130, 255, 0.6)',
            dialogueLines: [{ speaker: 'Alex', text: '[Voltar ao Templo com as informações]' }],
            onInteractComplete: () => loadScene('templo')
        }));
    } else {
        const portalObj = gameMap.mapObjects.find(o => o.name === 'volta_templo');
        const px = portalObj ? portalObj.x : gameMap.spawnPoint.x;
        const py = portalObj ? portalObj.y : gameMap.spawnPoint.y + 40;
        interactables.push(new Interactable(px, py, {
            name: 'Portal Templo',
            width: portalObj ? portalObj.width : 40, height: portalObj ? portalObj.height : 10,
            visible: true, glow: true, isItem: true,
            glowColor: 'rgba(180, 130, 255, 0.6)',
            dialogueLines: [{ speaker: 'Alex', text: '[Voltar ao Templo com as informações]' }],
            onInteractComplete: () => loadScene('templo')
        }));
    }
}

// ═══════════════════════════════════════════════════════════════
init();