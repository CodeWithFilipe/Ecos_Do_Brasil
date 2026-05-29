/**
 * GameState — Estado global do jogo.
 *
 * Gerencia: fase atual, informações coletadas, progresso do tutorial,
 * e lógica do puzzle da Inconfidência Mineira.
 */
export class GameState {
    constructor() {
        this.reset();
    }

    reset() {
        this.currentPhase    = 'biblioteca';
        this.tutorialStep    = 0;     // 0=mover, 1=interagir, 2=professora, 3=done
        this.talkedToTeacher  = false;
        this.talkedToLibrarian = false;
        this.bookFound        = false;
        this.clioMet          = false;
        this.collectedInfos   = [];
        this.puzzleAttempts   = 0;
        this.gameWon          = false;
    }

    // ── Tutorial ────────────────────────────────
    advanceTutorial() {
        this.tutorialStep = Math.min(this.tutorialStep + 1, 4);
    }

    isTutorialDone() {
        return this.tutorialStep >= 3;
    }

    // ── Informações coletáveis ─────────────────
    /**
     * @param {Object} info — { id, title, text, isTrue, role }
     *   id    : 'derrama' | 'dentaduras' | 'traicao' | 'pao_de_queijo'
     *   role  : 'inicio' | 'fim' | null  (papel no puzzle)
     *   isTrue: boolean
     */
    addInfo(info) {
        if (this.hasInfo(info.id)) return false;
        this.collectedInfos.push(info);
        return true;
    }

    hasInfo(id) {
        return this.collectedInfos.some(i => i.id === id);
    }

    getInfoCount() {
        return this.collectedInfos.length;
    }

    hasAllInfos() {
        return this.collectedInfos.length >= 4;
    }

    // ── Puzzle ──────────────────────────────────
    /**
     * Verifica se o jogador selecionou as informações corretas.
     * @param {string} startId — ID da informação de início
     * @param {string} endId   — ID da informação de fim
     * @returns {boolean}
     */
    checkPuzzle(startId, endId) {
        this.puzzleAttempts++;
        const correct = (startId === 'derrama' && endId === 'traicao');
        if (correct) this.gameWon = true;
        return correct;
    }

    // ── Dados das informações (definição canônica) ─
    static INFO_DATA = [
        {
            id: 'derrama',
            title: 'O Início de Tudo',
            npc: 'Mineiro Revoltado',
            isTrue: true,
            role: 'inicio',
            text: 'O movimento começou porque Portugal queria cobrar a "derrama", um imposto obrigatório que permitia aos soldados entrarem nas casas dos mineiros para levar o ouro, as joias e os móveis de valor. Os moradores de Minas Gerais se uniram porque não aceitavam ser roubados dessa forma pela Coroa.',
            shortText: 'A Derrama: impostos abusivos de Portugal sobre os mineiros.'
        },
        {
            id: 'dentaduras',
            title: 'A Falsa Lenda de Tiradentes',
            npc: 'Contador de Histórias',
            isTrue: false,
            role: null,
            text: 'Joaquim José da Silva Xavier tinha o apelido de Tiradentes porque, durante as reuniões secretas, ele usava seus conhecimentos de dentista para criar dentaduras mágicas de ouro e diamantes que ajudavam os rebeldes a morder os soldados inimigos.',
            shortText: 'Dentaduras mágicas de ouro que mordiam soldados.'
        },
        {
            id: 'traicao',
            title: 'O Fim do Movimento',
            npc: 'Espião da Coroa',
            isTrue: true,
            role: 'fim',
            text: 'Os planos de liberdade foram interrompidos antes mesmo da revolta começar. Um dos participantes do grupo, Joaquim Silvério dos Reis, resolveu trair seus companheiros e revelou todo o segredo ao governador de Minas Gerais em troca do perdão de suas dívidas com Portugal.',
            shortText: 'Traição de Silvério dos Reis ao governador.'
        },
        {
            id: 'pao_de_queijo',
            title: 'O Castigo Inventado',
            npc: 'Vendedor do Mercado',
            isTrue: false,
            role: null,
            text: 'Como punição final pela rebelião, a Rainha de Portugal confiscou todas as receitas da região e proibiu os mineiros de produzirem pão de queijo e doce de leite por cem anos, obrigando a população a comer apenas jiló cozido.',
            shortText: 'Proibição de pão de queijo por 100 anos.'
        }
    ];
}
