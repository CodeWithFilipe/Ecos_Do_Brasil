/**
 * GameState — estado global do jogo (fonte única de verdade).
 *
 * Responsabilidades:
 *  - Progresso da aventura (ato, fase, flags de história)
 *  - Coleção de informações históricas (por ato, com arquivo permanente)
 *  - Verificação dos puzzles de cada ato
 *
 * Convenções:
 *  - "Ato" 1..3 = Vila Rica, Rio de Janeiro, São Paulo.
 *  - collectedInfos NUNCA é limpo ao concluir um ato: os registros das
 *    fases concluídas permanecem para consulta no diário (com selo
 *    FATO/BOATO revelado). Consultas de progresso são sempre por ato.
 */
export class GameState {

    /** Fase (chave de INFO_DATA) de cada ato. */
    static PHASE_BY_ACT = Object.freeze({ 1: 'vila_rica', 2: 'rio_de_janeiro', 3: 'sao_paulo' });

    /** Quantidade de informações necessárias por ato. */
    static REQUIRED_BY_ACT = Object.freeze({ 1: 4, 2: 6, 3: 8 });

    /** Par (início, fim) correto do puzzle de cada ato. */
    static PUZZLE_ANSWER_BY_ACT = Object.freeze({
        1: { start: 'derrama',         end: 'traicao' },
        2: { start: 'republica_inicio', end: 'republica_fim' },
        3: { start: 'leiaurea_inicio',  end: 'leiaurea_fim' },
    });

    constructor() {
        this.reset();
    }

    reset() {
        this.act               = 1;
        this.completedActs     = [];      // atos com puzzle vencido (diário revela selos)
        this.currentPhase      = 'biblioteca';
        this.tutorialStep      = 0;       // 0=mover, 1=interagir, 2=professora, 3=done
        this.talkedToTeacher   = false;
        this.talkedToLibrarian = false;
        this.bookFound         = false;
        this.clioMet           = false;
        this.collectedInfos    = [];      // acumula TODOS os atos (diário)
        this.puzzleAttempts    = 0;
        this.gameWon           = false;
    }

    // ── Tutorial ─────────────────────────────────────────────

    advanceTutorial() {
        this.tutorialStep = Math.min(this.tutorialStep + 1, 4);
    }

    isTutorialDone() {
        return this.tutorialStep >= 3;
    }

    // ── Atos ─────────────────────────────────────────────────

    /**
     * Descobre a qual ato uma informação pertence, pela fonte canônica.
     * @param {{id: string}} info
     * @returns {1|2|3|null}
     */
    getInfoAct(info) {
        if (!info) return null;
        for (const [act, phase] of Object.entries(GameState.PHASE_BY_ACT)) {
            if (GameState.INFO_DATA[phase].some(i => i.id === info.id)) return Number(act);
        }
        return null;
    }

    /** @param {number} act */
    isActCompleted(act) {
        return this.completedActs.includes(act);
    }

    /** Marca o ato atual como concluído (idempotente). */
    completeCurrentAct() {
        if (!this.isActCompleted(this.act)) this.completedActs.push(this.act);
    }

    // ── Informações coletáveis ───────────────────────────────

    /**
     * Registra uma informação coletada.
     * @param {Object} info — item de INFO_DATA
     * @returns {boolean} true se era inédita
     */
    addInfo(info) {
        if (this.hasInfo(info.id)) return false;
        this.collectedInfos.push(info);
        return true;
    }

    hasInfo(id) {
        return this.collectedInfos.some(i => i.id === id);
    }

    /** Informações coletadas pertencentes ao ato ATUAL. */
    getCurrentActInfos() {
        return this.collectedInfos.filter(i => this.getInfoAct(i) === this.act);
    }

    /** Contagem do ato atual (HUD, portal, puzzle). */
    getInfoCount() {
        return this.getCurrentActInfos().length;
    }

    getRequiredInfoCount() {
        return GameState.REQUIRED_BY_ACT[this.act] ?? 4;
    }

    hasAllInfos() {
        return this.getInfoCount() >= this.getRequiredInfoCount();
    }

    /** Remove apenas as informações do ato atual (derrota no puzzle). */
    clearCurrentActInfos() {
        this.collectedInfos = this.collectedInfos.filter(i => this.getInfoAct(i) !== this.act);
    }

    // ── Puzzle ───────────────────────────────────────────────

    /**
     * Confere a resposta do puzzle do ato atual.
     * @param {string} startId
     * @param {string} endId
     * @returns {boolean}
     */
    checkPuzzle(startId, endId) {
        this.puzzleAttempts++;
        const answer = GameState.PUZZLE_ANSWER_BY_ACT[this.act];
        const correct = !!answer && startId === answer.start && endId === answer.end;
        if (correct && this.act === 3) this.gameWon = true;
        return correct;
    }

    // ── Dados canônicos das informações por fase ─────────────
    static INFO_DATA = {
        vila_rica: [
            {
                id: 'derrama',
                title: 'A Cobrança da Coroa',
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
                title: 'A Traição Revelada',
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
        ],
        rio_de_janeiro: [
            {
                id: 'republica_inicio',
                title: 'Os Grupos Insatisfeitos',
                npc: 'Quintino Bocaiúva',
                isTrue: true,
                role: 'inicio',
                text: 'O movimento para derrubar a Monarquia começou por causa da insatisfação de três grupos poderosos: a Igreja Católica, os militares (que queriam mais poder político e melhores salários após a Guerra do Paraguai) e os grandes fazendeiros de café, que ficaram revoltados com o fim da escravidão em 1888 e deixaram de apoiar o Imperador.',
                shortText: 'Insatisfação de militares, Igreja e cafeicultores.'
            },
            {
                id: 'republica_rival',
                title: 'O Rival Amoroso',
                npc: 'Aristocrata Fofoqueiro',
                isTrue: false,
                role: null,
                text: 'O Marechal Deodoro da Fonseca, que era amigo do Imperador, só aceitou liderar a revolta porque inventaram uma fofoca de que o novo Primeiro-Ministro escolhido por Dom Pedro II seria o Silveira Martins — um político gaúcho que tinha sido o grande rival de Deodoro no passado, disputando o amor da mesma mulher.',
                shortText: 'Boato de rivalidade amorosa entre Deodoro e Silveira Martins.'
            },
            {
                id: 'republica_fim',
                title: 'A Proclamação de Deodoro',
                npc: 'Marechal Deodoro',
                isTrue: true,
                role: 'fim',
                text: 'No dia 15 de novembro de 1889, o Marechal Deodoro da Fonseca assumiu o comando das tropas no Rio de Janeiro e declarou o início da República. O novo governo deu um prazo de apenas dois dias para que Dom Pedro II e toda a família real arrumassem suas malas e fossem embora do Brasil, exilados na Europa.',
                shortText: 'Marechal assume comando e exila família real em 2 dias.'
            },
            {
                id: 'republica_eleicao',
                title: 'A Eleição Secreta',
                npc: 'Vendedor Ambulante',
                isTrue: false,
                role: null,
                text: 'Para que o povo não ficasse revoltado com a expulsão do Imperador, o Marechal Deodoro organizou uma votação na Praça XV, onde os cidadãos do Rio de Janeiro puderam votar se preferiam continuar na Monarquia ou mudar para a República.',
                shortText: 'Suposta votação popular na Praça XV pela República.'
            },
            {
                id: 'republica_disfarce',
                title: 'O Disfarce Imperial',
                npc: 'Guarda Imperial',
                isTrue: false,
                role: null,
                text: 'Dom Pedro II tentou fugir do Paço Imperial disfarçado de vendedor de cocadas para organizar uma resistência armada em Petrópolis, mas foi descoberto pelos guardas republicanos na Praça XV porque se recusou a cortar ou esconder sua famosa e longa barba branca.',
                shortText: 'Dom Pedro II foge disfarçado de vendedor de cocadas.'
            },
            {
                id: 'republica_carta',
                title: 'A Carta da Princesa',
                npc: 'Baronesa do Café',
                isTrue: false,
                role: null,
                text: 'A Princesa Isabel enviou uma carta de Portugal ordenando que a República fosse proclamada imediatamente, pois ela estava cansada dos deveres reais e preferia viver como uma cidadã comum na Europa, abdicando de seu direito ao trono brasileiro.',
                shortText: 'Carta da Princesa Isabel ordenando o fim da Monarquia.'
            }
        ],
        sao_paulo: [
            {
                id: 'leiaurea_inicio',
                title: 'A Luta pela Liberdade',
                npc: 'José do Patrocínio',
                isTrue: true,
                role: 'inicio',
                text: 'A assinatura da Lei Áurea em 13 de maio de 1888 não aconteceu por acaso. Ela foi o resultado de anos de muita luta dos próprios escravizados (que fugiam e criavam quilombos), além da pressão de jornalistas, poetas e advogados do "Movimento Abolicionista", que faziam campanhas e comícios lotados pelo fim da escravidão.',
                shortText: 'Luta popular e resistência dos escravizados pelo fim do regime.'
            },
            {
                id: 'leiaurea_caneta',
                title: 'A Caneta da Princesa',
                npc: 'Duquesa Imperial',
                isTrue: false,
                role: null,
                text: 'Para celebrar o momento histórico, a Princesa Isabel mandou trazer de Portugal uma caneta feita inteiramente de ouro maciço e diamantes, pesando quase um quilo, o que fez com que ela precisasse da ajuda de dois guardas reais para conseguir segurar a caneta e assinar o documento.',
                shortText: 'Caneta de ouro e diamantes de 1kg sustentada por guardas.'
            },
            {
                id: 'leiaurea_fim',
                title: 'As Consequências Sociais',
                npc: 'Joaquim Nabuco',
                isTrue: true,
                role: 'fim',
                text: 'A Lei Áurea acabou oficialmente com a escravidão no Brasil, tornando o país o último das Américas a fazer isso. Porém, a lei era muito curta e não deu nenhuma ajuda aos novos cidadãos livres: eles não receberam terras, salários iniciais ou estudos, fazendo com que muitos continuassem enfrentando muitas dificuldades e preconceito para sobreviver.',
                shortText: 'Libertação formal tardia e abandono social pós-abolição.'
            },
            {
                id: 'leiaurea_indeniza',
                title: 'A Indenização',
                npc: 'Fazendeiro de Café',
                isTrue: false,
                role: null,
                text: 'Logo após assinar a lei, a Princesa Isabel usou o dinheiro dos cofres do Império para pagar uma grande indenização em dinheiro para cada um dos escravizados libertos, garantindo que todos pudessem comprar suas próprias casas e abrir seus próprios negócios imediatamente.',
                shortText: 'Suposta indenização monetária paga a libertos pelo Império.'
            },
            {
                id: 'leiaurea_votacao',
                title: 'A Votação Provisória',
                npc: 'Senador Conservador',
                isTrue: false,
                role: null,
                text: 'Para que a lei fosse aprovada no Senado, a Princesa Isabel propôs que os grandes cafeicultores continuassem donos de metade dos escravizados por mais dez anos, e a abolição completa só ocorreria após o ano de 1900.',
                shortText: 'Suposta aprovação parcial mantendo escravidão até 1900.'
            },
            {
                id: 'leiaurea_dia',
                title: 'O Dia da Libertação',
                npc: 'Cidadão Festivo',
                isTrue: false,
                role: null,
                text: 'A Lei Áurea determinava que o dia 13 de maio seria um feriado nacional onde todos os cidadãos deveriam vestir roupas brancas e dançar nas praças públicas, sob pena de pagar uma multa de vinte mil réis caso fossem vistos trabalhando.',
                shortText: 'Obrigatoriedade de danças em praça pública sob pena de multa.'
            },
            {
                id: 'leiaurea_compra',
                title: 'O Suborno Inglês',
                npc: 'Negociador Inglês',
                isTrue: false,
                role: null,
                text: 'O fim da escravidão no Brasil só foi possível porque o governo da Inglaterra comprou todos os escravizados do país e os alugou de volta para os fazendeiros de café paulistas, cobrando uma taxa simbólica anual de cinco libras.',
                shortText: 'Inglaterra comprando escravizados e alugando de volta a fazendeiros.'
            },
            {
                id: 'leiaurea_fuga',
                title: 'A Grande Fuga',
                npc: 'Imigrante Italiano',
                isTrue: false,
                role: null,
                text: 'Antes da assinatura da lei, mais de oitenta por cento da população escravizada do estado de São Paulo fugiu a pé em uma grande caravana para o Uruguai, onde a escravidão já havia sido abolida e o governo oferecia terras gratuitas para os imigrantes brasileiros.',
                shortText: 'Caravana de fuga a pé de 80% dos escravizados para o Uruguai.'
            }
        ]
    };
}
