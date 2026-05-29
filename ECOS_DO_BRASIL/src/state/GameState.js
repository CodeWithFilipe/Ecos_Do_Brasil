export class GameState {
    constructor() {
        this.fragments = []; // IDs dos fragmentos coletados
        this.proofsFound = {}; // ex: { 'ato1': ['carta_gonzaga', 'confissao_conjurado'] }
        this.currentAct = 'prologo';
        this.diaryEntries = [];
        
        // Para a Visão do Guardião
        this.visionActive = false;
        
        // Definição do total de provas por ato para facilitar checagem
        this.requiredProofs = {
            'ato1': 3,
            'ato2': 3,
            'ato3': 3,
            'ato4': 4
        };
    }

    collectFragment(id) {
        if (!this.fragments.includes(id)) {
            this.fragments.push(id);
        }
    }

    findProof(act, proofId) {
        if (!this.proofsFound[act]) {
            this.proofsFound[act] = [];
        }
        if (!this.proofsFound[act].includes(proofId)) {
            this.proofsFound[act].push(proofId);
            return true; // Acabou de encontrar
        }
        return false; // Já possuía
    }

    hasProof(act, proofId) {
        return this.proofsFound[act]?.includes(proofId) || false;
    }

    hasAllProofsForAct(act) {
        const found = this.proofsFound[act] ? this.proofsFound[act].length : 0;
        return found >= (this.requiredProofs[act] || 0);
    }

    addDiaryEntry(entry) {
        this.diaryEntries.push(entry);
    }
}

// Singleton instance
export const gameState = new GameState();
