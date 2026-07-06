import { GameState } from './GameState.js';

/**
 * SaveSystem — salvamento automático em localStorage.
 *
 * Regras de segurança:
 *  - Todo acesso a localStorage e JSON.parse é envolvido em try/catch.
 *  - Save corrompido, de versão diferente ou com dados inválidos é DESCARTADO
 *    silenciosamente (o jogo inicia do zero, nunca trava).
 *  - collectedInfos são salvos apenas como IDs e re-hidratados a partir de
 *    GameState.INFO_DATA (fonte canônica); IDs desconhecidos são ignorados.
 */
const SAVE_KEY = 'ecos_do_brasil_save';
const SAVE_VERSION = 1;

// Cenas válidas para respawn (deve espelhar as chaves de SCENES no main.js)
const VALID_SCENES = [
    'biblioteca', 'templo', 'vila_rica', 'cambio', 'igreja', 'taverna',
    'rio_de_janeiro', 'sao_paulo', 'vitoria'
];

// Cenas interiores de Vila Rica: respawn seguro é a própria praça
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

    /**
     * Salva o estado atual. Nunca lança exceção.
     * @param {GameState} gameState
     * @param {string} sceneName — cena atual
     */
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

    /**
     * Carrega e valida o save. Retorna null se não existir ou for inválido.
     * @returns {{scene: string, state: Object} | null}
     */
    load() {
        if (!this.enabled) return null;
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (!raw) return null;

            const data = JSON.parse(raw);

            // Validação estrutural — qualquer inconsistência descarta o save
            if (!data || typeof data !== 'object')        return this._discard('formato');
            if (data.version !== SAVE_VERSION)            return this._discard('versão');
            if (!data.state || typeof data.state !== 'object') return this._discard('estado');
            if (typeof data.scene !== 'string')           return this._discard('cena');
            if (!VALID_SCENES.includes(data.scene))       return this._discard('cena inválida');

            const s = data.state;
            if (![1, 2, 3].includes(s.act))               return this._discard('ato');
            if (!Array.isArray(s.infoIds))                return this._discard('infos');

            // Redireciona cenas de interior para o hub correspondente
            const scene = SCENE_REDIRECT[data.scene] || data.scene;

            return { scene, state: s, savedAt: data.savedAt };
        } catch (err) {
            console.warn('💾 Save corrompido, descartado:', err);
            this.clear();
            return null;
        }
    },

    /**
     * Aplica um save validado ao GameState.
     * @param {GameState} gameState
     * @param {Object} state — objeto `state` retornado por load()
     */
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

        // Re-hidrata infos a partir da fonte canônica (IDs desconhecidos ignorados)
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
        try { localStorage.removeItem(SAVE_KEY); } catch (_) { /* noop */ }
    },

    _discard(reason) {
        console.warn(`💾 Save descartado (${reason} incompatível). Iniciando novo jogo.`);
        this.clear();
        return null;
    }
};
