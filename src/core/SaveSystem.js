import { GameState } from './GameState.js';
const SAVE_KEY = 'ecos_do_brasil_save';
const SAVE_VERSION = 1;
const VALID_SCENES = [
    'biblioteca', 'templo', 'vila_rica', 'cambio', 'igreja', 'taverna',
    'rio_de_janeiro', 'sao_paulo', 'vitoria'
];
const SCENE_REDIRECT = { cambio: 'vila_rica', igreja: 'vila_rica', taverna: 'vila_rica', vitoria: 'biblioteca' };
function storageAvailable() {
    try {
        const t = '__ecos_test__';
        localStorage.setItem(t, t);
        localStorage.removeItem(t);
        return true;
    } catch (_) {
        return false;
    }
}
export const SaveSystem = {
    enabled: storageAvailable(),
    save(gameState, sceneName) {
        if (!this.enabled) return false;
        try {
            const data = {
                version : SAVE_VERSION,
                savedAt : Date.now(),
                scene   : sceneName,
                state   : {
                    act               : gameState.act,
                    completedActs     : gameState.completedActs,
                    currentPhase      : gameState.currentPhase,
                    tutorialStep      : gameState.tutorialStep,
                    talkedToTeacher   : gameState.talkedToTeacher,
                    talkedToLibrarian : gameState.talkedToLibrarian,
                    bookFound         : gameState.bookFound,
                    arasyMet          : gameState.arasyMet,
                    puzzleAttempts    : gameState.puzzleAttempts,
                    gameWon           : gameState.gameWon,
                    infoIds           : gameState.collectedInfos.map(i => i.id),
                }
            };
            localStorage.setItem(SAVE_KEY, JSON.stringify(data));
            return true;
        } catch (err) {
            console.warn('💾 Falha ao salvar (jogo continua normalmente):', err);
            return false;
        }
    },
    load() {
        if (!this.enabled) return null;
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (!raw) return null;
            const data = JSON.parse(raw);
            if (!data || typeof data !== 'object')        return this._discard('formato');
            if (data.version !== SAVE_VERSION)            return this._discard('versão');
            if (!data.state || typeof data.state !== 'object') return this._discard('estado');
            if (typeof data.scene !== 'string')           return this._discard('cena');
            if (!VALID_SCENES.includes(data.scene))       return this._discard('cena inválida');
            const s = data.state;
            if (![1, 2, 3].includes(s.act))               return this._discard('ato');
            if (!Array.isArray(s.infoIds))                return this._discard('infos');
            const scene = SCENE_REDIRECT[data.scene] || data.scene;
            return { scene, state: s, savedAt: data.savedAt };
        } catch (err) {
            console.warn('💾 Save corrompido, descartado:', err);
            this.clear();
            return null;
        }
    },
    applyTo(gameState, state) {
        gameState.reset();
        gameState.act               = state.act;
        gameState.completedActs     = Array.isArray(state.completedActs) ? state.completedActs : [];
        gameState.currentPhase      = typeof state.currentPhase === 'string' ? state.currentPhase : 'biblioteca';
        gameState.tutorialStep      = Number.isInteger(state.tutorialStep) ? state.tutorialStep : 0;
        gameState.talkedToTeacher   = !!state.talkedToTeacher;
        gameState.talkedToLibrarian = !!state.talkedToLibrarian;
        gameState.bookFound         = !!state.bookFound;
        gameState.arasyMet          = !!(state.arasyMet ?? state.clioMet);
        gameState.puzzleAttempts    = Number.isInteger(state.puzzleAttempts) ? state.puzzleAttempts : 0;
        gameState.gameWon           = !!state.gameWon;
        const allInfos = [
            ...GameState.INFO_DATA.vila_rica,
            ...GameState.INFO_DATA.rio_de_janeiro,
            ...GameState.INFO_DATA.sao_paulo,
        ];
        gameState.collectedInfos = state.infoIds
            .map(id => allInfos.find(i => i.id === id))
            .filter(Boolean);
    },
    clear() {
        if (!this.enabled) return;
        try { localStorage.removeItem(SAVE_KEY); } catch (_) {  }
    },
    _discard(reason) {
        console.warn(`💾 Save descartado (${reason} incompatível). Iniciando novo jogo.`);
        this.clear();
        return null;
    }
};