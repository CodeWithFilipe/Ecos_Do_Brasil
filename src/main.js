import { Input }           from './core/Input.js';
import { Camera }          from './core/Camera.js';
import { SceneManager }    from './core/SceneManager.js';
import { GameState }       from './core/GameState.js';
import { SaveSystem }      from './core/SaveSystem.js';
import { AudioManager }    from './core/AudioManager.js';
import { Player }          from './entities/Player.js';
import { NPC }             from './entities/NPC.js';
import { Arasy }           from './entities/Arasy.js';
import { Interactable }    from './entities/Interactable.js';
import { MagicBook }       from './entities/MagicBook.js';
import { PhaseStatue }     from './entities/PhaseStatue.js';
import { SacredSpring }    from './entities/SacredSpring.js';
import { DialogueBox }     from './ui/DialogueBox.js';
import { InfoPanel }       from './ui/InfoPanel.js';
import { JournalUI }       from './ui/JournalUI.js';
import { ReturnButton }    from './ui/ReturnButton.js';
import { PuzzleUI }        from './ui/PuzzleUI.js';
import { TutorialOverlay } from './ui/TutorialOverlay.js';
import { EndingScreen }    from './ui/EndingScreen.js';
import { ControlsScreen }  from './ui/ControlsScreen.js';
import { Map }             from './world/Map.js';
import { VIEW, WORLD_SCALE, SCREEN, font, TYPE, SPACE } from './ui/theme.js';

// ═══════════════════════════════════════════════════════════════
// CANVAS & SISTEMAS GLOBAIS
// ═══════════════════════════════════════════════════════════════
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
canvas.width  = SCREEN.W;
canvas.height = SCREEN.H;

const input        = new Input();
const camera       = new Camera(VIEW.W, VIEW.H);
const sceneManager = new SceneManager(canvas, ctx);
const gameState    = new GameState();
const audio        = new AudioManager();

let gameMap       = null;
let alex          = null;
let dialogueBox   = null;
let infoPanel     = null;
let puzzleUI      = null;
let tutorial      = null;
let journal       = null;
let returnButton  = null;
let endingScreen  = null;
let controlsScreen = null;
let interactables = [];
let lastTime      = performance.now();
let spaceWasDown  = false;
let upWasDown     = false;
let downWasDown   = false;
let leftWasDown   = false;
let rightWasDown  = false;
let jWasDown      = false;
let tWasDown      = false;
let hWasDown      = false;
let gameReady     = false;
let nextSpawnDoor = null;   // porta para respawn inteligente (ex.: 'porta_poeta')
let currentSceneName   = 'biblioteca';
let lastSavedInfoCount = 0;
let puzzleChancesLeft  = 3;

// Debug (F3)
let debugMode = false;

// ═══════════════════════════════════════════════════════════════
// CONFIGURAÇÃO DECLARATIVA DOS ATOS
// ═══════════════════════════════════════════════════════════════
const ACTS = Object.freeze({
    1: {
        scene : 'vila_rica',
        label : 'Vila Rica — 1789',
        arasyBrief: [
            { speaker: 'Arasy', text: 'Você trouxe de volta as memórias de Vila Rica. Sinto a terra mais firme sob nossos pés.' },
            { speaker: 'Arasy', text: 'Agora ponha ordem no tempo: qual fato deu INÍCIO à revolta e qual a ENCERROU?' },
            { speaker: 'Arasy', text: 'Vá com calma. A névoa das mentiras é astuta — ela mistura o que foi com o que só disseram que foi.' },
        ],
        successLines: [
            { speaker: 'Arasy', text: '🎉 A névoa se desfez! A verdade da Inconfidência Mineira está de novo protegida.' },
            { speaker: 'Arasy', text: 'A cobrança da Derrama acendeu a revolta; a traição de Silvério dos Reis a apagou.' },
            { speaker: 'Arasy', text: 'Olhe: o primeiro tótem se reergueu. A memória de um povo é assim — quando cuidada, volta a ficar de pé.' },
            { speaker: 'Alex', text: 'Foi incrível sentir isso! E agora, Arasy?' },
            { speaker: 'Arasy', text: 'O rio do tempo segue. Leve seus olhos atentos ao Rio de Janeiro, onde um Império chega ao fim.' },
        ],
    },
    2: {
        scene : 'rio_de_janeiro',
        label : 'Rio de Janeiro — 1889',
        arasyBrief: [
            { speaker: 'Arasy', text: 'Trouxe as vozes do Rio de Janeiro. Aqui um Império inteiro se despede.' },
            { speaker: 'Arasy', text: 'Ordene o tempo: qual fato deu INÍCIO à queda e qual consolidou o FIM da Monarquia?' },
            { speaker: 'Arasy', text: 'Cuidado: nesta época os boatos corriam mais rápido que a verdade. Escute a terra, não o eco.' },
        ],
        successLines: [
            { speaker: 'Arasy', text: '🎉 A névoa da Proclamação da República se dissipou, Alex!' },
            { speaker: 'Arasy', text: 'O descontentamento de militares, Igreja e cafeicultores abriu a queda; o exílio da família real encerrou a Monarquia.' },
            { speaker: 'Arasy', text: 'O segundo tótem se reergueu. Nossos antepassados agradecem quem cuida da lembrança deles.' },
            { speaker: 'Alex', text: 'Agora entendo que a República não nasceu de um dia só.' },
            { speaker: 'Arasy', text: 'Resta uma ferida funda a curar: São Paulo, 1888. A memória da abolição.' },
        ],
    },
    3: {
        scene : 'sao_paulo',
        label : 'São Paulo — 1888',
        arasyBrief: [
            { speaker: 'Arasy', text: 'Você recolheu as memórias de São Paulo, 1888. Segure-as com respeito: elas custaram muito sofrimento.' },
            { speaker: 'Arasy', text: 'Ordene o tempo: qual fato deu INÍCIO à luta abolicionista e qual mostra o que veio DEPOIS da abolição?' },
            { speaker: 'Arasy', text: 'É aqui que a névoa mais mente. Deixe a verdade falar mais alto que o conto bonito.' },
        ],
        successLines: [
            { speaker: 'Arasy', text: '🎉 A verdade da Lei Áurea foi restaurada, Alex.' },
            { speaker: 'Arasy', text: 'A luta e a resistência do povo escravizado forçaram a abolição; o abandono que se seguiu foi a ferida que ninguém curou.' },
            { speaker: 'Arasy', text: 'O tótem central renasceu — os três brilham juntos. A memória do Brasil respira de novo.' },
            { speaker: 'Alex', text: 'Conseguimos! Agora posso voltar à biblioteca e entregar meu trabalho?' },
            { speaker: 'Arasy', text: 'Pode ir. O portal o levará de volta ao seu tempo. Sua professora o espera — leve com você tudo que aprendeu aqui.' },
        ],
    },
});

/** Cenas em que o botão "Voltar ao Templo" fica disponível. */
const SCENES_WITH_RETURN = new Set([
    'vila_rica', 'poeta', 'igreja', 'taverna', 'rio_de_janeiro', 'sao_paulo',
]);

const PUZZLE_MAX_CHANCES = 3;

// Música por cena
const MUSIC_BY_SCENE = {
    biblioteca     : 'musica_biblioteca',
    templo         : 'musica_templo',
    vila_rica      : 'musica_vila_rica',
    poeta          : 'musica_vila_rica',
    igreja         : 'musica_vila_rica',
    taverna        : 'musica_vila_rica',
    rio_de_janeiro : 'musica_rio',
    sao_paulo      : 'musica_sao_paulo',
    vitoria        : 'musica_vitoria',
};

// ═══════════════════════════════════════════════════════════════
// ENTRADA GLOBAL (teclado/mouse)
// ═══════════════════════════════════════════════════════════════
window.addEventListener('keydown', e => {
    audio.unlock();
    if (e.code === 'F3')   { debugMode = !debugMode; e.preventDefault(); }
    if (e.code === 'KeyM') audio.toggleMute();
});

canvas.addEventListener('click', e => {
    if (!gameReady || !returnButton) return;
    const p = canvasPoint(e);
    if (canUseReturnButton() && returnButton.hitTest(p.x, p.y)) {
        goToTemplo();
    }
});

canvas.addEventListener('mousemove', e => {
    if (!gameReady || !returnButton) return;
    const p = canvasPoint(e);
    returnButton.setHover(p.x, p.y);
});

/** Converte coordenadas de mouse para o espaço do canvas. */
function canvasPoint(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
}

function canUseReturnButton() {
    return returnButton.visible && !dialogueBox.active &&
           !puzzleUI.active && !journal.active && !sceneManager.transitioning;
}

function goToTemplo() {
    audio.playSfx('sfx_confirm');
    loadScene('templo');
}

// ═══════════════════════════════════════════════════════════════
// ESCALA RESPONSIVA (preenche a janela, mantém proporção)
// ═══════════════════════════════════════════════════════════════
function resizeCanvas() {
    const k = Math.max(0.5, Math.min(
        window.innerWidth  / canvas.width,
        window.innerHeight / canvas.height,
    ));
    canvas.style.width  = Math.floor(canvas.width  * k) + 'px';
    canvas.style.height = Math.floor(canvas.height * k) + 'px';
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ═══════════════════════════════════════════════════════════════
// REGISTRO DE IMAGENS
// ═══════════════════════════════════════════════════════════════
const IMAGES = {};

const IMAGE_SOURCES = {
    // Tilesets
    'Library sprite sheet-00'     : './assets/sprites/tilesets/Library sprite sheet-00.png',
    'atlas_32x'                   : './assets/sprites/tilesets/interior.png',
    'atlas_16x'                   : './assets/sprites/tilesets/overworld.png',
    'atlaas'                      : './assets/sprites/tilesets/exterior.png',
    'atlzzas'                     : './assets/sprites/tilesets/market.png',
    'GothicFurnitureSprites48x48' : './assets/sprites/tilesets/GothicFurnitureSprites48x48.png',
    'interior16'                  : './assets/sprites/tilesets/interior16.png',

    // Tilesets (basename match)
    'exterior'     : './assets/sprites/tilesets/exterior.png',
    'farming'      : './assets/sprites/tilesets/farming.png',
    'interior'     : './assets/sprites/tilesets/interior.png',
    'overworld'    : './assets/sprites/tilesets/overworld.png',
    'market'       : './assets/sprites/tilesets/market.png',
    'download (1)' : './assets/sprites/tilesets/download (1).png',
    'download'     : './assets/sprites/tilesets/download.png',
    'republica'    : './assets/sprites/tilesets/republica.png',

    // Player
    'player'     : './assets/sprites/personagens/Player.png',
    'playerLeft' : './assets/sprites/personagens/PlayerLeft.png',

    // NPCs (Characters_V3: grade 16x16, 1 personagem por linha, colunas 4-5 = frente)
    'characters' : './assets/sprites/npcs/Characters_V3_Colour.png',
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
    // Mapas embutidos (permite abrir o jogo por file://, sem servidor)
    if (window.EMBEDDED_MAPS && window.EMBEDDED_MAPS[filename]) {
        return window.EMBEDDED_MAPS[filename];
    }
    const resp = await fetch(`./assets/maps/${filename}`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status} — ${filename}`);
    return resp.json();
}

function buildMap(mapData) {
    return new Map(mapData, IMAGES);
}

// ═══════════════════════════════════════════════════════════════
// SPRITES DOS NPCs (Characters_V3_Colour.png — 1 personagem/linha)
// ═══════════════════════════════════════════════════════════════
const CHAR_ROWS = {
    trabalhador : 0,
    velho       : 1,
    menino      : 2,
    dama_rosa   : 3,
    ruivo       : 4,
    professora  : 5,
    senhor_gris : 6,
    dama_coque  : 7,
    oculos      : 9,
    cavaleiro   : 11,
    mineiro     : 13,
    chapeu      : 15,
    dama_ouro   : 16,
    moreno      : 17,
    dama_flor   : 19,
};

/** Config de sprite p/ NPC; retorna {} se a sheet não carregou (fallback). */
function charSprite(rowName) {
    const row = CHAR_ROWS[rowName];
    if (row === undefined || !IMAGES['characters']) return {};
    return {
        spriteSheet: IMAGES['characters'],
        frameW: 16, frameH: 16,
        frameOffsetX: 4,
        facing: row,
        maxFrames: 2,
        width: 16, height: 16,
    };
}

// ═══════════════════════════════════════════════════════════════
// FLUXO DO TEMPLO (puzzle com chances + retorno automático)
// ═══════════════════════════════════════════════════════════════

/** Diálogo padrão de Arasy quando ainda faltam informações; devolve à fase. */
function buildArasyIncomplete(act) {
    const total = gameState.getRequiredInfoCount();
    return {
        lines: [
            { speaker: 'Arasy', text: `Você trouxe ${gameState.getInfoCount()} de ${total} memórias de ${ACTS[act].label}.` },
            { speaker: 'Arasy', text: 'A lembrança ainda está incompleta — não posso abrir o desafio assim. Volte e escute mais gente.' },
            { speaker: 'Arasy', text: 'Vou reabrir o caminho de volta. A verdade só se ergue com todas as vozes.' },
        ],
        onDone: () => loadScene(ACTS[act].scene),
    };
}

/** Inicia (ou reinicia) o puzzle do ato atual respeitando as chances. */
function startPuzzleWithChances() {
    puzzleUI.setAttemptsLeft(puzzleChancesLeft);
    puzzleUI.start(onPuzzleCorrect, onPuzzleWrong);
}

function onPuzzleCorrect() {
    audio.playSfx('sfx_confirm');
    const act = gameState.act;
    gameState.completeCurrentAct();

    dialogueBox.show(ACTS[act].successLines, () => {
        if (act < 3) {
            gameState.act = act + 1;
            loadScene(ACTS[gameState.act].scene);
        } else {
            loadScene('biblioteca'); // professora aguarda o quiz final
        }
    });
    SaveSystem.save(gameState, currentSceneName);
}

function onPuzzleWrong() {
    audio.playSfx('sfx_error');
    puzzleChancesLeft--;

    if (puzzleChancesLeft > 0) {
        dialogueBox.show([
            { speaker: 'Arasy', text: `A névoa embaralhou o tempo... Ainda lhe restam ${puzzleChancesLeft} tentativa(s).` },
            { speaker: 'Arasy', text: 'Respire fundo como quem escuta o vento. Separe o que foi do que só foi dito.' },
        ], startPuzzleWithChances);
        return;
    }

    // Chances esgotadas: perde as infos da fase e volta para recoletá-las
    gameState.clearCurrentActInfos();
    dialogueBox.show([
        { speaker: 'Arasy', text: 'A névoa venceu desta vez... e as memórias se dispersaram como fumaça.' },
        { speaker: 'Arasy', text: 'Não é vergonha recomeçar. Volte àquele tempo e reconstrua a verdade, voz por voz.' },
    ], () => loadScene(ACTS[gameState.act].scene));
}

/** Monta a Arasy do templo conforme o progresso. */
function buildTemploArasy(map) {
    const deusa  = map.mapObjects.find(o => o.name === 'deusa_item');
    const arasyX = deusa ? deusa.x + deusa.width / 2 - 9 : map.spawnPoint.x;
    const arasyY = deusa ? deusa.y + deusa.height - 26 : map.spawnPoint.y - 80;
    const arasy  = new Arasy(arasyX, arasyY);

    if (!gameState.arasyMet) {
        arasy.dialogueLines = [
            { speaker: 'Arasy', text: 'Aproxime-se sem medo. A água e a pedra já sabiam que você viria.' },
            { speaker: 'Alex', text: 'Onde... onde eu estou? Como cheguei aqui?' },
            { speaker: 'Arasy', text: 'Eu sou Arasy. Meu nome vem de "ara", o tempo, e "sy", a mãe. Sou a que guarda a memória desta terra.' },
            { speaker: 'Arasy', text: 'Este é o templo onde vive tudo o que o Brasil já foi. Muito antes das cidades, meu povo já contava estas histórias ao redor do fogo.' },
            { speaker: 'Alex', text: 'E esses tótens de pedra quebrados?' },
            { speaker: 'Arasy', text: 'Cada um guarda um tempo da nossa história. Uma névoa de mentiras — o que hoje vocês chamam de fake news — está rachando a memória do povo.' },
            { speaker: 'Arasy', text: 'Mentira não é coisa nova, criança. Ela sempre tentou apagar quem lutou, quem sofreu, quem construiu. Cabe a nós lembrar direito.' },
            { speaker: 'Arasy', text: 'Comece por Vila Rica, 1789: a Inconfidência Mineira. Escute as pessoas, junte as memórias — mas peneire, pois nem toda voz diz a verdade.' },
            { speaker: 'Alex', text: 'Pode contar comigo, Arasy.' },
            { speaker: 'Arasy', text: 'Então vá. A terra caminha com você.' },
        ];
        arasy.onInteractComplete = () => {
            gameState.arasyMet = true;
            loadScene(ACTS[1].scene);
        };
        return arasy;
    }

    arasy.hasBeenIntroduced = true;

    if (gameState.hasAllInfos()) {
        arasy.dialogueLines = ACTS[gameState.act].arasyBrief;
        arasy.onInteractComplete = () => {
            puzzleChancesLeft = PUZZLE_MAX_CHANCES;
            startPuzzleWithChances();
        };
    } else {
        const { lines, onDone } = buildArasyIncomplete(gameState.act);
        arasy.dialogueLines = lines;
        arasy.onInteractComplete = onDone;
        arasy.afterDialogueLines = lines;   // sempre devolve à fase
    }
    return arasy;
}

// ═══════════════════════════════════════════════════════════════
// DEFINIÇÃO DAS CENAS
// ═══════════════════════════════════════════════════════════════
const SCENES = {

    // ─────────────────────────────────────────────
    // BIBLIOTECA (Tutorial — início do jogo & quiz final)
    // ─────────────────────────────────────────────
    biblioteca: {
        file: 'biblioteca.tmj',
        setup(map) {
            alex.x = map.spawnPoint.x;
            alex.y = map.spawnPoint.y;
            interactables = [];
            gameState.currentPhase = 'biblioteca';
            infoPanel.active = false;

            if (gameState.gameWon) {
                this._setupQuizFinale(map);
            } else {
                this._setupIntro(map);
            }
        },

        /** Início do jogo: tutorial + professora + bibliotecária + livro. */
        _setupIntro(map) {
            tutorial.active = true;
            tutorial.step = 0;

            const professora = new NPC(map.spawnPoint.x - 80, map.spawnPoint.y - 120, {
                name: 'Professora',
                color: '#6B3FA0', accentColor: '#2d1e4f',
                width: 18, height: 26,
                ...charSprite('professora'),
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
                },
            });
            interactables.push(professora);

            const bibliotecaria = new NPC(map.spawnPoint.x + 80, map.spawnPoint.y - 200, {
                name: 'Bibliotecária',
                color: '#2E7D32', accentColor: '#5d4037',
                width: 18, height: 26,
                ...charSprite('dama_flor'),
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
                },
            });
            interactables.push(bibliotecaria);

            const diario = map.mapObjects.find(o => o.name === 'item_diario');
            if (diario) {
                interactables.push(new MagicBook(diario.x, diario.y, {
                    name: 'Livro Antigo',
                    width: diario.width, height: diario.height,
                    dialogueLines: [
                        { speaker: 'Alex', text: 'Esse deve ser o livro que a bibliotecária mencionou...' },
                        { speaker: 'Alex', text: 'Não tem título. Está emitindo um calor estranho...' },
                        { speaker: '???', text: '"Quem lê isto foi escolhido. O passado precisa de você."' },
                        { speaker: 'Alex', text: 'As letras estão brilhando! O que está acontecen—!' },
                    ],
                    onInteractComplete: () => {
                        gameState.bookFound = true;
                        loadScene('templo');
                    },
                }));
            }
        },

        /** Fase final: quiz da professora. */
        _setupQuizFinale(map) {
            tutorial.active = false;

            const bibliotecaria = new NPC(map.spawnPoint.x + 80, map.spawnPoint.y - 200, {
                name: 'Bibliotecária',
                color: '#2E7D32', accentColor: '#5d4037',
                width: 18, height: 26,
                ...charSprite('dama_flor'),
                dialogueLines: [
                    { speaker: 'Bibliotecária', text: 'Você conseguiu voltar do livro, Alex! Que alívio!' },
                    { speaker: 'Bibliotecária', text: 'Apresente o seu trabalho de história para a professora.' },
                ],
            });
            interactables.push(bibliotecaria);

            const startQuiz = () => {
                dialogueBox.show([
                    { speaker: 'Professora', text: 'Alex! Que bom que voltou. Terminou o seu trabalho de pesquisa?' },
                    { speaker: 'Alex', text: 'Sim, professora! Descobri as verdades por trás de vários mitos e fake news históricas.' },
                    { speaker: 'Professora', text: 'Excelente! Mas antes de aceitar seu trabalho, farei 3 perguntas rápidas para testar o seu aprendizado.' },
                ], askQ1);
            };

            const askQ1 = () => {
                dialogueBox.showChoices(
                    'Professora',
                    'Pergunta 1: Qual foi o estopim que deu início à Inconfidência Mineira em Vila Rica?',
                    [
                        'A proibição da venda de pão de queijo pela Rainha.',
                        'A cobrança abusiva da Derrama pela Coroa Portuguesa.',
                        'A criação de dentaduras mágicas de ouro por Tiradentes.',
                    ],
                    choice => {
                        if (choice === 1) {
                            audio.playSfx('sfx_confirm');
                            dialogueBox.show([
                                { speaker: 'Professora', text: 'Correto! A cobrança forçada de impostos atrasados (Derrama) gerou a revolta.' },
                            ], askQ2);
                        } else {
                            audio.playSfx('sfx_error');
                            dialogueBox.show([
                                { speaker: 'Professora', text: 'Incorreto, Alex. Esse é um boato fictício.' },
                                { speaker: 'Professora', text: 'Dica: pense no imposto que Portugal queria cobrar à força dos mineiros. Tente de novo!' },
                            ], askQ1);
                        }
                    });
            };

            const askQ2 = () => {
                dialogueBox.showChoices(
                    'Professora',
                    'Pergunta 2: Quais grupos insatisfeitos iniciaram a Proclamação da República no Rio?',
                    [
                        'Militares, Igreja Católica e grandes fazendeiros de café.',
                        'Vendedores de cocada e a família imperial exilada.',
                        'Apoiadores de Silveira Martins por causa de rivalidade amorosa.',
                    ],
                    choice => {
                        if (choice === 0) {
                            audio.playSfx('sfx_confirm');
                            dialogueBox.show([
                                { speaker: 'Professora', text: 'Perfeito! Esses três grupos influentes retiraram o apoio à Monarquia.' },
                            ], askQ3);
                        } else {
                            audio.playSfx('sfx_error');
                            dialogueBox.show([
                                { speaker: 'Professora', text: 'Incorreto. A rivalidade ou fofocas populares não derrubaram o Império.' },
                                { speaker: 'Professora', text: 'Dica: lembre-se dos três grupos poderosos que estavam insatisfeitos. Tente de novo!' },
                            ], askQ2);
                        }
                    });
            };

            const askQ3 = () => {
                dialogueBox.showChoices(
                    'Professora',
                    'Pergunta 3: Quais foram as reais consequências da assinatura da Lei Áurea em 1888?',
                    [
                        'Os libertos receberam indenizações imensas em ouro da Princesa Isabel.',
                        'A maior parte fugiu a pé para o Uruguai em busca de terras.',
                        'Os libertos foram abandonados sem terras, salários ou educação formal.',
                    ],
                    choice => {
                        if (choice === 2) {
                            audio.playSfx('sfx_confirm');
                            dialogueBox.show([
                                { speaker: 'Professora', text: 'Sensacional, Alex! Você realmente compreendeu os fatos e a complexidade social da nossa história.' },
                                { speaker: 'Professora', text: 'Seu trabalho está nota 10 com louvor! Parabéns!' },
                                { speaker: 'Alex', text: 'Muito obrigado, professora! Valeu muito a pena pesquisar a fundo!' },
                            ], () => loadScene('vitoria'));
                        } else {
                            audio.playSfx('sfx_error');
                            dialogueBox.show([
                                { speaker: 'Professora', text: 'Incorreto, Alex. Pense na realidade social precária no pós-abolição.' },
                                { speaker: 'Professora', text: 'Dica: a lei libertou, mas o que os libertos receberam depois? Tente de novo!' },
                            ], askQ3);
                        }
                    });
            };

            const professora = new NPC(map.spawnPoint.x - 80, map.spawnPoint.y - 120, {
                name: 'Professora',
                color: '#6B3FA0', accentColor: '#2d1e4f',
                width: 18, height: 26,
                ...charSprite('professora'),
                dialogueLines: [
                    { speaker: 'Professora', text: 'Olá, Alex! Veio entregar o seu trabalho de história?' },
                ],
                onInteractComplete: startQuiz,
            });
            interactables.push(professora);
        },
    },

    // ─────────────────────────────────────────────
    // TEMPLO (hub temporal — Arasy + estátuas das fases)
    // ─────────────────────────────────────────────
    templo: {
        file: 'templo.tmj',
        setup(map) {
            alex.x = map.spawnPoint.x;
            alex.y = map.spawnPoint.y;
            alex.resolveCollision(gameMap);
            interactables = [];
            gameState.currentPhase = 'templo';
            tutorial.active = false;
            infoPanel.active = false;
            puzzleChancesLeft = PUZZLE_MAX_CHANCES;

            // Estátuas das três fases (quebradas → restauradas) — já interativas (lore)
            for (const act of [1, 2, 3]) {
                const obj = map.mapObjects.find(o => o.name === `estatua_fase${act}`);
                if (obj) {
                    interactables.push(new PhaseStatue(obj.x, obj.y, act, gameState, {
                        width: obj.width, height: obj.height,
                    }));
                }
            }

            // Domínio natural de Arasy: vitórias-régias + fio de cachoeira sobre os
            // dois poços d'água (tiles reaproveitados de farming.png / Vila Rica).
            interactables.push(new SacredSpring(416, 128));
            interactables.push(new SacredSpring(576, 128));

            // Tomos dourados: livros-monumento interativos com pequenas lores da
            // memória histórica (tile do "livro mágico" reaproveitado). Posições
            // casam com os tiles de livro colocados em templo.tmj.
            const TOMOS = [
                { x: 192, y: 192, name: 'Tomo dos Primeiros Povos',
                  text: 'Muito antes de 1500, milhares de povos indígenas já viviam, comerciavam e guardavam suas histórias nesta terra.' },
                { x: 736, y: 192, name: 'Tomo da Terra Rica',
                  text: 'Chamaram o Brasil de "terra rica" pelo ouro e pelo açúcar — mas a maior riqueza sempre foi a sua gente e a sua memória.' },
                { x: 192, y: 384, name: 'Tomo das Vozes Silenciadas',
                  text: 'Por séculos, a história foi contada só pelos poderosos. Este tomo guarda as vozes que tentaram apagar.' },
                { x: 736, y: 384, name: 'Tomo do Guardião',
                  text: 'Guardar a memória é dever sagrado: lembrar como as coisas de fato aconteceram é a defesa contra a névoa das mentiras.' },
            ];
            for (const t of TOMOS) {
                interactables.push(new Interactable(t.x, t.y, {
                    name: t.name,
                    width: 32, height: 32,
                    visible: true, glow: true,
                    glowColor: 'rgba(230, 180, 60, 0.5)',
                    dialogueLines: [
                        { speaker: 'Alex', text: 'Um tomo antigo, aberto numa página que reluz como ouro...' },
                        { speaker: t.name, text: t.text },
                    ],
                }));
            }

            interactables.push(buildTemploArasy(map));

            // Portal dinâmico para a fase atual
            if (gameState.arasyMet && !gameState.gameWon) {
                const target = ACTS[gameState.act];
                interactables.push(new Interactable(map.spawnPoint.x - 20, map.spawnPoint.y + 16, {
                    name: `Portal ${target.label}`,
                    width: 40, height: 12,
                    dialogueLines: [{ speaker: 'Alex', text: `[Viajar para ${target.label}]` }],
                    onInteractComplete: () => loadScene(target.scene),
                }));
            }
        },
    },

    // ─────────────────────────────────────────────
    // VILA RICA (hub de investigação — ato 1)
    // ─────────────────────────────────────────────
    vila_rica: {
        file: 'praca.tmj',
        setup(map) {
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

            // Vendedor do Mercado (info falsa: pão de queijo)
            const estatua = map.mapObjects.find(o => o.name === 'estatua_tiradentes');
            if (estatua) {
                const info = GameState.INFO_DATA.vila_rica[3];
                interactables.push(new NPC(estatua.x - 10, estatua.y + 30, {
                    name: 'Vendedor',
                    color: '#8B4513', accentColor: '#3e2723',
                    width: 14, height: 22,
                    ...charSprite('chapeu'),
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
                        if (gameState.addInfo(info)) infoPanel.notifyNewInfo(info.title);
                    },
                }));
            }

            // Portais para os interiores
            const doors = [
                { obj: 'porta_poeta',   scene: 'poeta',   label: 'Casa do Poeta' },
                { obj: 'porta_igreja',  scene: 'igreja',  label: 'Igreja' },
                { obj: 'porta_taverna', scene: 'taverna', label: 'Taverna' },
            ];
            for (const d of doors) {
                const door = map.mapObjects.find(o => o.name === d.obj);
                if (door) {
                    interactables.push(new Interactable(door.x, door.y, {
                        name: d.label,
                        width: door.width, height: door.height,
                        dialogueLines: [{ speaker: 'Alex', text: `[Entrar: ${d.label}]` }],
                        onInteractComplete: () => loadScene(d.scene),
                    }));
                }
            }
        },
    },

    // ─────────────────────────────────────────────
    // CASA DO POETA (info verdadeira: Derrama)
    // ─────────────────────────────────────────────
    poeta: {
        file: 'poeta.tmj',
        setup(map) {
            alex.x = map.spawnPoint.x;
            alex.y = map.spawnPoint.y;
            interactables = [];
            infoPanel.active = true;

            const info = GameState.INFO_DATA.vila_rica[0];
            const anchor = map.mapObjects.find(o => o.name === 'poeta_item');
            const npcX = anchor ? anchor.x + 10 : map.spawnPoint.x + 40;
            const npcY = anchor ? anchor.y + 30 : map.spawnPoint.y - 60;

            interactables.push(new NPC(npcX, npcY, {
                name: 'Mineiro Revoltado',
                color: '#D84315', accentColor: '#4a2c2a',
                width: 16, height: 24,
                ...charSprite('mineiro'),
                dialogueLines: [
                    { speaker: 'Mineiro', text: 'Você veio de fora? Cuidado com os soldados da Coroa!' },
                    { speaker: 'Alex', text: 'O que está acontecendo aqui?' },
                    { speaker: 'Mineiro', text: 'O movimento começou porque Portugal queria cobrar a "derrama", um imposto obrigatório...' },
                    { speaker: 'Mineiro', text: '...que permitia aos soldados entrarem nas casas para levar ouro, joias e móveis.' },
                    { speaker: 'Mineiro', text: 'Os moradores de Minas se uniram porque não aceitavam ser roubados pela Coroa.' },
                    { speaker: 'Alex', text: 'Isso é revoltante! Portugal não tinha esse direito!' },
                    { speaker: 'Mineiro', text: 'Por isso estamos nos organizando. Chega de exploração!' },
                ],
                afterDialogueLines: [
                    { speaker: 'Mineiro', text: 'Não esqueça: a Derrama foi o estopim de tudo!' },
                ],
                infoData: info,
                onInteractComplete: () => {
                    if (gameState.addInfo(info)) infoPanel.notifyNewInfo(info.title);
                },
            }));

            const saida = map.mapObjects.find(o => o.name === 'saida_casa');
            if (saida) {
                interactables.push(new Interactable(saida.x, saida.y, {
                    name: 'Saída',
                    width: saida.width, height: saida.height,
                    dialogueLines: [{ speaker: 'Alex', text: '[Voltar para a Vila Rica]' }],
                    onInteractComplete: () => {
                        nextSpawnDoor = 'porta_poeta';
                        loadScene('vila_rica');
                    },
                }));
            }
        },
    },

    // ─────────────────────────────────────────────
    // IGREJA (info verdadeira: traição)
    // ─────────────────────────────────────────────
    igreja: {
        file: 'igreja.tmj',
        setup(map) {
            alex.x = map.spawnPoint.x;
            alex.y = map.spawnPoint.y;
            interactables = [];
            infoPanel.active = true;

            const info = GameState.INFO_DATA.vila_rica[2];
            const anchor = map.mapObjects.find(o => o.name === 'item_confissao');
            const npcX = anchor ? anchor.x + 10 : 150;
            const npcY = anchor ? anchor.y + 30 : 80;

            interactables.push(new NPC(npcX, npcY, {
                name: 'Espião da Coroa',
                color: '#37474F', accentColor: '#1a1a2e',
                width: 16, height: 24,
                ...charSprite('moreno'),
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
                    if (gameState.addInfo(info)) infoPanel.notifyNewInfo(info.title);
                },
            }));

            const saida = map.mapObjects.find(o => o.name === 'saida_igreja');
            if (saida) {
                interactables.push(new Interactable(saida.x, saida.y, {
                    name: 'Saída',
                    width: saida.width, height: saida.height,
                    dialogueLines: [{ speaker: 'Alex', text: '[Voltar para a Vila Rica]' }],
                    onInteractComplete: () => {
                        nextSpawnDoor = 'porta_igreja';
                        loadScene('vila_rica');
                    },
                }));
            }
        },
    },

    // ─────────────────────────────────────────────
    // TAVERNA (info falsa: dentaduras)
    // ─────────────────────────────────────────────
    taverna: {
        file: 'taverna.tmj',
        setup(map) {
            alex.x = map.spawnPoint.x;
            alex.y = map.spawnPoint.y;
            interactables = [];
            infoPanel.active = true;

            const info = GameState.INFO_DATA.vila_rica[1];
            const anchor = map.mapObjects.find(o => o.name === 'item_mapa');
            const npcX = anchor ? anchor.x - 30 : map.spawnPoint.x + 40;
            const npcY = anchor ? anchor.y + 20 : map.spawnPoint.y - 80;

            interactables.push(new NPC(npcX, npcY, {
                name: 'Contador de Histórias',
                color: '#E65100', accentColor: '#bf360c',
                width: 16, height: 24,
                ...charSprite('senhor_gris'),
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
                    if (gameState.addInfo(info)) infoPanel.notifyNewInfo(info.title);
                },
            }));

            const saida = map.mapObjects.find(o => o.name === 'saida_taverna');
            if (saida) {
                interactables.push(new Interactable(saida.x, saida.y, {
                    name: 'Saída',
                    width: saida.width, height: saida.height,
                    dialogueLines: [{ speaker: 'Alex', text: '[Voltar para a Vila Rica]' }],
                    onInteractComplete: () => {
                        nextSpawnDoor = 'porta_taverna';
                        loadScene('vila_rica');
                    },
                }));
            }
        },
    },

    // ─────────────────────────────────────────────
    // RIO DE JANEIRO (Paço Imperial — ato 2)
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

            const D = GameState.INFO_DATA.rio_de_janeiro;
            const npcs = [
                {
                    info: D[0], x: 100, y: 140, sprite: 'oculos',
                    name: 'Quintino Bocaiúva', color: '#1E88E5', accent: '#0D47A1',
                    open : [
                        { speaker: 'Quintino', text: 'Cidadão! Escreva o que digo: o Império desmorona sob o próprio peso.' },
                        { speaker: 'Alex', text: 'Como tudo isso começou, senhor?' },
                    ],
                    close: [
                        { speaker: 'Alex', text: 'Entendi. Grupos muito fortes retiraram o apoio à monarquia.' },
                        { speaker: 'Quintino', text: 'Exatamente! A história está se movendo no Rio de Janeiro.' },
                    ],
                    after: [{ speaker: 'Quintino', text: 'Igreja, militares e cafeicultores... sem eles, o trono de Dom Pedro II cai!' }],
                },
                {
                    info: D[1], x: 360, y: 280, sprite: 'velho',
                    name: 'Aristocrata', color: '#F57C00', accent: '#E65100',
                    open : [
                        { speaker: 'Aristocrata', text: 'Você sabe do último babado do Paço?' },
                        { speaker: 'Alex', text: 'Que babado?' },
                    ],
                    close: [{ speaker: 'Alex', text: 'Uma mentira amorosa motivou o Marechal? Hum...' }],
                    after: [{ speaker: 'Aristocrata', text: 'O amor de uma mulher move exércitos, garoto! Lembre-se disso.' }],
                },
                {
                    info: D[3], x: 180, y: 360, sprite: 'trabalhador',
                    name: 'Ambulante', color: '#795548', accent: '#3E2723',
                    open : [
                        { speaker: 'Ambulante', text: 'Olha a cocada fresquinha! Aproveite que a votação está aberta!' },
                        { speaker: 'Alex', text: 'Votação? Que votação?' },
                    ],
                    close: [{ speaker: 'Alex', text: 'Eleição na Praça XV? Acho que isso não está certo...' }],
                    after: [{ speaker: 'Ambulante', text: 'Monarquia ou República? Compre uma cocada e vote na urna da praça!' }],
                },
                {
                    info: D[4], x: 60, y: 440, sprite: 'cavaleiro',
                    name: 'Guarda do Paço', color: '#3F51B5', accent: '#1A237E',
                    open : [
                        { speaker: 'Guarda', text: 'Circulando, cidadão! O Paço está sob guarda militar!' },
                        { speaker: 'Alex', text: 'O Imperador ainda está lá dentro?' },
                    ],
                    close: [{ speaker: 'Alex', text: 'Disfarçado de vendedor de cocadas? Essa história é muito absurda.' }],
                    after: [{ speaker: 'Guarda', text: 'Aquela barba branca não enganaria ninguém!' }],
                },
                {
                    info: D[5], x: 300, y: 480, sprite: 'dama_rosa',
                    name: 'Baronesa', color: '#9C27B0', accent: '#4A148C',
                    open : [
                        { speaker: 'Baronesa', text: 'Que horror! A nossa ordem monárquica destruída por uma carta!' },
                        { speaker: 'Alex', text: 'Que carta, senhora?' },
                    ],
                    close: [{ speaker: 'Alex', text: 'A Princesa Isabel ordenou a República? Isso não faz sentido algum.' }],
                    after: [{ speaker: 'Baronesa', text: 'Isabel abdicou do trono por preguiça? Ai, que decadência aristocrática!' }],
                },
                {
                    info: D[2], x: 240, y: 120, sprite: 'senhor_gris',
                    name: 'Marechal Deodoro', color: '#2E7D32', accent: '#1B5E20',
                    open : [
                        { speaker: 'Deodoro', text: 'Quem está aí? Identifique-se cidadão!' },
                        { speaker: 'Alex', text: 'Eu sou Alex, senhor. Queria saber o que aconteceu com o Império.' },
                        { speaker: 'Deodoro', text: 'O Império caiu, rapaz. O tempo da monarquia no Brasil expirou.' },
                    ],
                    close: [
                        { speaker: 'Alex', text: 'Apenas dois dias para que Dom Pedro II e sua família partissem?!' },
                        { speaker: 'Deodoro', text: 'A pátria exigia pressa para evitar novos conflitos. A República está instaurada!' },
                    ],
                    after: [{ speaker: 'Deodoro', text: 'O Marechal Deodoro da Fonseca não volta atrás em sua palavra. O Brasil é livre.' }],
                },
            ];
            spawnInfoNpcs(npcs);
        },
    },

    // ─────────────────────────────────────────────
    // SÃO PAULO (Salão da Abolição — ato 3)
    // ─────────────────────────────────────────────
    sao_paulo: {
        file: 'gabineterepublica.tmj',
        setup(map) {
            alex.x = map.spawnPoint.x;
            alex.y = map.spawnPoint.y;
            interactables = [];
            gameState.currentPhase = 'sao_paulo';
            infoPanel.active = true;
            tutorial.active = false;

            const D = GameState.INFO_DATA.sao_paulo;
            const npcs = [
                {
                    info: D[0], x: 450, y: 200, sprite: 'moreno',
                    name: 'José do Patrocínio', color: '#3E2723', accent: '#1B0000',
                    open : [
                        { speaker: 'José do Patrocínio', text: 'Alex! A abolição não foi uma concessão real. Foi conquistada a duras penas.' },
                        { speaker: 'Alex', text: 'Como assim? Não foi a Princesa Isabel quem decidiu tudo sozinha?' },
                    ],
                    close: [{ speaker: 'Alex', text: 'Entendi! A pressão do povo e dos abolicionistas foi o verdadeiro motor.' }],
                    after: [{ speaker: 'José do Patrocínio', text: 'O Movimento Abolicionista e as lutas populares forçaram o fim desse sistema!' }],
                },
                {
                    info: D[1], x: 350, y: 250, sprite: 'dama_ouro',
                    name: 'Duquesa Imperial', color: '#D81B60', accent: '#880E4F',
                    open : [
                        { speaker: 'Duquesa', text: 'Você soube da caneta majestosa usada para assinar a lei?' },
                        { speaker: 'Alex', text: 'Como ela era?' },
                    ],
                    close: [{ speaker: 'Alex', text: 'Uma caneta pesando um quilo? Que exagero de história...' }],
                    after: [{ speaker: 'Duquesa', text: 'Foi um marco de luxo, meu jovem! Ouro maciço e brilhantes.' }],
                },
                {
                    info: D[2], x: 550, y: 250, sprite: 'oculos',
                    name: 'Joaquim Nabuco', color: '#0D47A1', accent: '#002171',
                    open : [
                        { speaker: 'Joaquim Nabuco', text: 'A Lei Áurea trouxe a liberdade jurídica, mas não a igualdade de fato.' },
                        { speaker: 'Alex', text: 'O que aconteceu com os libertos no dia seguinte?' },
                    ],
                    close: [{ speaker: 'Alex', text: 'Entendi. A liberdade veio sem nenhuma garantia de direitos básicos ou sustento.' }],
                    after: [{ speaker: 'Joaquim Nabuco', text: 'A Lei de 1888 foi o fim do regime oficial, mas o início de uma longa exclusão social.' }],
                },
                {
                    info: D[3], x: 300, y: 400, sprite: 'chapeu',
                    name: 'Fazendeiro de Café', color: '#4E342E', accent: '#270F0A',
                    open : [
                        { speaker: 'Fazendeiro', text: 'A Princesa Isabel acabou com os cofres do governo!' },
                        { speaker: 'Alex', text: 'Por que o senhor diz isso?' },
                    ],
                    close: [{ speaker: 'Alex', text: 'Duvido muito que o Império tenha pago indenizações generosas aos libertos.' }],
                    after: [{ speaker: 'Fazendeiro', text: 'Ela foi benevolente demais! Nos deixou sem mão de obra e distribuiu fortunas!' }],
                },
                {
                    info: D[4], x: 600, y: 400, sprite: 'velho',
                    name: 'Senador Conservador', color: '#37474F', accent: '#102027',
                    open : [
                        { speaker: 'Senador', text: 'A aprovação da Lei Áurea seguiu uma transição prudente no Parlamento.' },
                        { speaker: 'Alex', text: 'Não foi imediata para todos?' },
                    ],
                    close: [{ speaker: 'Alex', text: 'Isso não faz sentido. A Lei Áurea declarou extinta a escravidão a partir de sua data de publicação.' }],
                    after: [{ speaker: 'Senador', text: 'Manter a transição gradual era fundamental para os proprietários rurais.' }],
                },
                {
                    info: D[5], x: 700, y: 300, sprite: 'menino',
                    name: 'Cidadão Festivo', color: '#FFB300', accent: '#FF6F00',
                    open : [
                        { speaker: 'Cidadão', text: 'Hoje é dia de comemoração nacional obrigatória!' },
                        { speaker: 'Alex', text: 'Como assim obrigatória?' },
                    ],
                    close: [{ speaker: 'Alex', text: 'Multa por não vestir branco e dançar? Isso soa totalmente falso.' }],
                    after: [{ speaker: 'Cidadão', text: 'Todo mundo na praça celebrando! Quem não dançar é contra a pátria!' }],
                },
                {
                    info: D[6], x: 250, y: 500, sprite: 'ruivo',
                    name: 'Negociador Inglês', color: '#E53935', accent: '#7F0000',
                    open : [
                        { speaker: 'Negociador', text: 'A liberdade no Brasil tem o patrocínio britânico, rapaz.' },
                        { speaker: 'Alex', text: 'Como a Inglaterra atuou na assinatura da lei?' },
                    ],
                    close: [{ speaker: 'Alex', text: 'Comprar e alugar de volta? Esse boato é completamente mentiroso.' }],
                    after: [{ speaker: 'Negociador', text: 'Tudo é business! O império britânico manda no mercado internacional.' }],
                },
                {
                    info: D[7], x: 650, y: 500, sprite: 'trabalhador',
                    name: 'Imigrante Italiano', color: '#43A047', accent: '#1B5E20',
                    open : [
                        { speaker: 'Imigrante', text: 'Mamma mia! As plantações paulistas ficaram desertas antes do dia 13!' },
                        { speaker: 'Alex', text: 'Para onde as pessoas fugiram?' },
                    ],
                    close: [{ speaker: 'Alex', text: 'Caminhar a pé de São Paulo até o Uruguai? Isso é geograficamente impossível!' }],
                    after: [{ speaker: 'Imigrante', text: 'Eu vi a multidão marchando rumo ao sul! Disseram que era muito longe...' }],
                },
            ];
            spawnInfoNpcs(npcs);
        },
    },

    // ─────────────────────────────────────────────
    // VITÓRIA (créditos)
    // ─────────────────────────────────────────────
    vitoria: {
        file: 'templo.tmj',
        setup(map) {
            alex.x = map.spawnPoint.x;
            alex.y = map.spawnPoint.y - 60;
            interactables = [];
            infoPanel.active = false;
            tutorial.active = false;

            // Estátuas restauradas como cenário da celebração
            for (const act of [1, 2, 3]) {
                const obj = map.mapObjects.find(o => o.name === `estatua_fase${act}`);
                if (obj) interactables.push(new PhaseStatue(obj.x, obj.y, act, gameState));
            }

            setTimeout(() => {
                dialogueBox.show([
                    { speaker: 'Arasy', text: 'Olhe, Alex... os três tótens estão inteiros de novo. A terra respira aliviada.' },
                    { speaker: 'Arasy', text: 'Cada um guarda uma verdade que você protegeu da névoa das fake news.' },
                    { speaker: 'Arasy', text: 'Em 1789, gente comum de Vila Rica enfrentou impostos injustos — não por lendas mágicas, mas por coragem diante da injustiça.' },
                    { speaker: 'Arasy', text: 'Em 1889, muitos descontentamentos derrubaram um Império inteiro em poucos dias — sem milagre, sem herói único.' },
                    { speaker: 'Arasy', text: 'Em 1888, anos de fuga, revolta e resistência venceram a escravidão — mas o Brasil ainda deve muito a quem foi libertado sem terra, sem trabalho e sem escola.' },
                    { speaker: 'Arasy', text: 'A verdade nem sempre é a história mais fácil de engolir. Mas é ela que merece ser lembrada, do jeito que de fato aconteceu.' },
                    { speaker: 'Alex', text: 'Aprendi que separar fato de boato não é só sobre o passado... é prestar atenção sempre, em tudo que a gente ouve.' },
                    { speaker: 'Arasy', text: 'Essa é a missão de todo guardião da memória, Alex. Agora você também é um deles.' },
                    { speaker: 'Arasy', text: 'Vá em paz, criança do futuro — e continue curioso. A terra caminha com você.' },
                ], () => endingScreen.show());
            }, 500);
        },
    },
};

/**
 * Cria os NPCs informantes de uma fase a partir de uma tabela declarativa.
 * Cada spec: { info, x, y, sprite, name, color, accent, open[], close[], after[] }
 */
function spawnInfoNpcs(specs) {
    for (const s of specs) {
        interactables.push(new NPC(s.x, s.y, {
            name: s.name,
            color: s.color, accentColor: s.accent,
            width: 16, height: 24,
            ...charSprite(s.sprite),
            dialogueLines: [
                ...s.open,
                { speaker: s.open[0].speaker, text: s.info.text },
                ...s.close,
            ],
            afterDialogueLines: s.after,
            infoData: s.info,
            onInteractComplete: () => {
                if (gameState.addInfo(s.info)) infoPanel.notifyNewInfo(s.info.title);
            },
        }));
    }
}

// ═══════════════════════════════════════════════════════════════
// CARREGAR CENA (com fade + música + save)
// ═══════════════════════════════════════════════════════════════
async function loadScene(sceneName) {
    const scene = SCENES[sceneName];
    if (!scene) { console.error('Cena desconhecida:', sceneName); return; }

    audio.playSfx('sfx_portal');

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

            returnButton.setVisible(SCENES_WITH_RETURN.has(sceneName));

            console.log(`🗺️ Cena "${sceneName}" — infos: ${gameState.getInfoCount()}/${gameState.getRequiredInfoCount()}`);

            audio.playMusic(MUSIC_BY_SCENE[sceneName]);

            currentSceneName   = sceneName;
            lastSavedInfoCount = gameState.getInfoCount();
            if (sceneName === 'vitoria') {
                SaveSystem.clear();   // jogo concluído: próximo boot inicia do zero
            } else {
                SaveSystem.save(gameState, sceneName);
            }
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

    alex = new Player(0, 0, {
        spriteSheet : IMAGES['player'],
        spriteLeft  : IMAGES['playerLeft'],
        frameW      : 32,
        frameH      : 32,
        maxFrames   : 6,
        hitboxW     : 10,
        hitboxH     : 10,
        speed       : 110,
        animSpeed   : 0.12,
    });

    dialogueBox  = new DialogueBox(canvas, ctx);
    infoPanel    = new InfoPanel(canvas, ctx, gameState);
    puzzleUI     = new PuzzleUI(canvas, ctx, gameState);
    tutorial     = new TutorialOverlay(canvas, ctx);
    journal      = new JournalUI(canvas, ctx, gameState);
    returnButton = new ReturnButton(canvas, ctx);
    endingScreen = new EndingScreen(canvas, ctx, gameState);
    controlsScreen = new ControlsScreen(canvas, ctx);

    setupPortraits();

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

    console.log('✅ Jogo pronto! H = controles, J = diário, T = voltar ao templo, M = som, F3 = debug');
    gameReady = true;
    audio.playMusic(MUSIC_BY_SCENE['biblioteca']);
    requestAnimationFrame(gameLoop);

    offerContinueIfSaved();
}

/** Retratos da caixa de diálogo (chave = nome usado nas falas). */
function setupPortraits() {
    if (!IMAGES['characters']) return;
    const P = row => ({ img: IMAGES['characters'], sx: 4 * 16, sy: row * 16, sw: 16, sh: 16 });
    dialogueBox.portraits = {
        'Professora'         : P(CHAR_ROWS.professora),
        'Bibliotecária'      : P(CHAR_ROWS.dama_flor),
        'Arasy'              : P(CHAR_ROWS.dama_coque),
        'Vendedor'           : P(CHAR_ROWS.chapeu),
        'Mineiro'            : P(CHAR_ROWS.mineiro),
        'Espião'             : P(CHAR_ROWS.moreno),
        'Contador'           : P(CHAR_ROWS.senhor_gris),
        'Quintino'           : P(CHAR_ROWS.oculos),
        'Aristocrata'        : P(CHAR_ROWS.velho),
        'Ambulante'          : P(CHAR_ROWS.trabalhador),
        'Guarda'             : P(CHAR_ROWS.cavaleiro),
        'Baronesa'           : P(CHAR_ROWS.dama_rosa),
        'Deodoro'            : P(CHAR_ROWS.senhor_gris),
        'José do Patrocínio' : P(CHAR_ROWS.moreno),
        'Duquesa'            : P(CHAR_ROWS.dama_ouro),
        'Joaquim Nabuco'     : P(CHAR_ROWS.oculos),
        'Fazendeiro'         : P(CHAR_ROWS.chapeu),
        'Senador'            : P(CHAR_ROWS.velho),
        'Cidadão'            : P(CHAR_ROWS.menino),
        'Negociador'         : P(CHAR_ROWS.ruivo),
        'Imigrante'          : P(CHAR_ROWS.trabalhador),
    };
    if (IMAGES['player']) {
        dialogueBox.portraits['Alex'] = { img: IMAGES['player'], sx: 0, sy: 4 * 32, sw: 32, sh: 32 };
    }
}

/** Oferece "Continuar / Novo jogo" se houver save com progresso real. */
function offerContinueIfSaved() {
    const saved = SaveSystem.load();
    const hasProgress = saved && (saved.scene !== 'biblioteca' || saved.state.infoIds.length > 0 ||
                                  saved.state.bookFound || saved.state.talkedToTeacher);
    if (!hasProgress) return;

    tutorial.active = false;
    dialogueBox.showChoices(
        'Sistema',
        'Encontrei um jogo salvo. Deseja continuar de onde parou?',
        ['Continuar jornada', 'Começar novo jogo'],
        choice => {
            if (choice === 0) {
                SaveSystem.applyTo(gameState, saved.state);
                lastSavedInfoCount = gameState.getInfoCount();
                loadScene(saved.scene);
            } else {
                SaveSystem.clear();
                gameState.reset();
                loadScene('biblioteca');
            }
        });
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

    if (endingScreen.active) {
        endingScreen.update(dt);
        handleEndingInput();
        return;
    }

    if (handleControlsInput(dt)) return;

    if (handleJournalInput(dt)) return;

    if (puzzleUI.active) {
        puzzleUI.update(dt);
        return;
    }

    if (handleChoicesInput(dt)) return;

    upWasDown = false;
    downWasDown = false;

    handleReturnShortcut();

    if (!dialogueBox.active) {
        alex.update(dt, input, gameMap, interactables);
        camera.update(dt, alex);
        if (tutorial.active && tutorial.step === 0 && alex.hasMoved) tutorial.setStep(1);
    }

    dialogueBox.update(dt);
    tutorial.update(dt);
    infoPanel.update(dt);
    for (const obj of interactables) if (obj.update) obj.update(dt);

    checkSpawnTemploPortal();
    autosaveOnNewInfo();
    handleInteractionKey();
}

/** Tela final (ESPAÇO): recomeça a jornada do zero. */
function handleEndingInput() {
    const confirm = input.isDown('Space') || input.isDown('KeyE') || input.isDown('Enter');
    if (confirm && !spaceWasDown) {
        audio.playSfx('sfx_confirm');
        endingScreen.hide();
        SaveSystem.clear();
        gameState.reset();
        lastSavedInfoCount = 0;
        loadScene('biblioteca');
    }
    spaceWasDown = confirm;
}

/** Tela de controles (H): toggle. Retorna true se consumiu o frame. */
function handleControlsInput(dt) {
    const hDown = input.isDown('KeyH');
    if (hDown && !hWasDown) {
        if (controlsScreen.active) {
            controlsScreen.close();
        } else if (!dialogueBox.active && !puzzleUI.active && !journal.active) {
            audio.playSfx('sfx_blip');
            controlsScreen.toggle();
        }
    }
    hWasDown = hDown;

    if (!controlsScreen.active) return false;
    controlsScreen.update(dt);
    return true;
}

/** Diário (J): toggle + navegação. Retorna true se consumiu o frame. */
function handleJournalInput(dt) {
    const jDown = input.isDown('KeyJ');
    if (jDown && !jWasDown) {
        if (journal.active) {
            journal.close();
        } else if (!dialogueBox.active && !puzzleUI.active) {
            audio.playSfx('sfx_blip');
            journal.toggle();
        }
    }
    jWasDown = jDown;

    if (!journal.active) return false;

    const up    = input.isDown('ArrowUp')    || input.isDown('KeyW');
    const down  = input.isDown('ArrowDown')  || input.isDown('KeyS');
    const left  = input.isDown('ArrowLeft')  || input.isDown('KeyA');
    const right = input.isDown('ArrowRight') || input.isDown('KeyD');
    if (up && !upWasDown)       journal.navigate(-1);
    if (down && !downWasDown)   journal.navigate(1);
    if (left && !leftWasDown)   { audio.playSfx('sfx_blip'); journal.navigatePage(-1); }
    if (right && !rightWasDown) { audio.playSfx('sfx_blip'); journal.navigatePage(1); }
    upWasDown    = up;
    downWasDown  = down;
    leftWasDown  = left;
    rightWasDown = right;
    journal.update(dt);
    return true;
}

/** Alternativas de diálogo (setas + confirmar). Retorna true se ativo. */
function handleChoicesInput(dt) {
    if (!(dialogueBox.active && dialogueBox.options && dialogueBox.options.length > 0)) return false;

    const up   = input.isDown('ArrowUp')   || input.isDown('KeyW');
    const down = input.isDown('ArrowDown') || input.isDown('KeyS');
    if (up && !upWasDown)        dialogueBox.navigateOptions(-1);
    else if (down && !downWasDown) dialogueBox.navigateOptions(1);
    upWasDown = up;
    downWasDown = down;

    const confirm = input.isDown('Space') || input.isDown('KeyE') || input.isDown('Enter');
    if (confirm && !spaceWasDown) {
        audio.playSfx('sfx_confirm');
        dialogueBox.selectCurrentOption();
    }
    spaceWasDown = confirm;

    dialogueBox.update(dt);
    tutorial.update(dt);
    infoPanel.update(dt);
    return true;
}

/** Tecla T: voltar ao templo (equivalente ao botão). */
function handleReturnShortcut() {
    const tDown = input.isDown('KeyT');
    if (tDown && !tWasDown && canUseReturnButton()) goToTemplo();
    tWasDown = tDown;
}

function autosaveOnNewInfo() {
    const count = gameState.getInfoCount();
    if (count !== lastSavedInfoCount) {
        if (count > lastSavedInfoCount) audio.playSfx('sfx_collect');
        lastSavedInfoCount = count;
        SaveSystem.save(gameState, currentSceneName);
    }
}

function handleInteractionKey() {
    const space = input.isDown('Space') || input.isDown('KeyE');
    if (space && !spaceWasDown) {
        if (dialogueBox.active) {
            audio.playSfx('sfx_blip');
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
        const objBox = obj.getDetectionBox ? obj.getDetectionBox() : obj;
        if (rectOverlap(box, objBox) && obj.getDialogue) {
            const { lines, callback } = obj.getDialogue();
            if (lines && lines.length > 0) {
                if (tutorial.active && tutorial.step === 1) tutorial.setStep(2);
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

    if (puzzleUI.active) {
        puzzleUI.draw();
        return;
    }

    // ── Mundo (escala 2x, pixel art) ──
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.scale(WORLD_SCALE, WORLD_SCALE);
    camera.apply(ctx);

    if (gameMap) gameMap.draw(ctx);

    const renderQueue = interactables.filter(o => o.draw);
    if (alex) renderQueue.push(alex);
    renderQueue.sort((a, b) => (a.y + (a.height || 0)) - (b.y + (b.height || 0)));
    for (const entity of renderQueue) entity.draw(ctx);

    if (debugMode && gameMap) drawDebugOverlay();

    camera.restore(ctx);
    ctx.restore();

    // ── UI (alta resolução) ──
    if (dialogueBox)  dialogueBox.draw();
    if (tutorial)     tutorial.draw();
    if (infoPanel)    infoPanel.draw();
    if (returnButton) returnButton.draw();
    if (journal)      journal.draw();
    if (endingScreen) endingScreen.draw();
    if (controlsScreen) controlsScreen.draw();
    drawControlsHint();
    sceneManager.draw();
}

/** Dica discreta e permanente (canto inferior esquerdo) lembrando da tecla de ajuda. */
function drawControlsHint() {
    if (dialogueBox.active || puzzleUI.active || journal.active ||
        endingScreen.active || controlsScreen.active || (tutorial && tutorial.active)) return;

    ctx.fillStyle = 'rgba(245, 240, 232, 0.45)';
    ctx.font = font(TYPE.caption);
    ctx.textAlign = 'left';
    ctx.fillText('H: controles', SPACE.sm, canvas.height - SPACE.sm);
}

function drawDebugOverlay() {
    gameMap.drawCollisionDebug(ctx);
    ctx.strokeStyle = 'rgba(0,255,0,0.9)';
    ctx.lineWidth = 1;
    ctx.strokeRect(alex.x, alex.y, alex.width, alex.height);
    const ib = alex.getInteractionBox();
    ctx.strokeStyle = 'rgba(255,255,0,0.9)';
    ctx.strokeRect(ib.x, ib.y, ib.width, ib.height);
    ctx.strokeStyle = 'rgba(0,255,255,0.5)';
    for (const o of interactables) {
        const b = o.getDetectionBox ? o.getDetectionBox() : o;
        ctx.strokeRect(b.x, b.y, b.width, b.height);
    }
}

// ═══════════════════════════════════════════════════════════════
// PORTAL DINÂMICO DO TEMPLO
// ═══════════════════════════════════════════════════════════════
function checkSpawnTemploPortal() {
    if (!gameMap) return;
    if (!['vila_rica', 'rio_de_janeiro', 'sao_paulo'].includes(gameState.currentPhase)) return;
    if (!gameState.hasAllInfos()) return;
    if (interactables.some(item => item.name === 'Portal Templo')) return;

    console.log('✨ Todos os fatos coletados! Abrindo portal para o Templo.');
    audio.playSfx('sfx_portal');

    const portalObj = gameMap.mapObjects.find(o => o.name === 'volta_templo');
    const px = portalObj ? portalObj.x : gameMap.spawnPoint.x;
    const py = portalObj ? portalObj.y : (gameState.currentPhase === 'vila_rica'
        ? gameMap.spawnPoint.y - 5 : gameMap.spawnPoint.y + 40);

    interactables.push(new Interactable(px, py, {
        name: 'Portal Templo',
        width: portalObj ? portalObj.width : 30,
        height: portalObj ? portalObj.height : 14,
        visible: true, glow: true, isItem: true,
        glowColor: 'rgba(180, 130, 255, 0.6)',
        dialogueLines: [{ speaker: 'Alex', text: '[Voltar ao Templo com as informações]' }],
        onInteractComplete: () => loadScene('templo'),
    }));
}

// ═══════════════════════════════════════════════════════════════
// HOOK DE DEPURAÇÃO / TESTES (não interfere no jogo normal)
// ═══════════════════════════════════════════════════════════════
window.__ecosDebug = {
    loadScene,
    get gameState() { return gameState; },
    get interactables() { return interactables; },
    get journal() { return journal; },
    get dialogueBox() { return dialogueBox; },
    get puzzleUI() { return puzzleUI; },
    get returnButton() { return returnButton; },
    get sceneManager() { return sceneManager; },
    get endingScreen() { return endingScreen; },
    get controlsScreen() { return controlsScreen; },
    get alex() { return alex; },
    get camera() { return camera; },
    get gameMap() { return gameMap; },
    SCENES,
    ACTS,
};

// ═══════════════════════════════════════════════════════════════
init();
