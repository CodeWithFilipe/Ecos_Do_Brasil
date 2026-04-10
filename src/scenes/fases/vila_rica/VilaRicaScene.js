// ─────────────────────────────────────────────────────────────
// scenes/fases/vilarica/VilaRicaScene.js
//
// FASE 1 — Vila Rica, 1789  (~6 minutos de gameplay)
// Conteúdo: 3 NPCs distorcidos, 3 evidências, puzzle Névoa,
//           Fragmento de Memória, retorno ao Hub
// ─────────────────────────────────────────────────────────────

import Player          from '../../../entities/Player.js';
import DialogueManager from '../../../ui/DialogueManager.js';
import InputHandler    from '../../../core/InputHandler.js';

export default class VilaRicaScene extends Phaser.Scene {
    constructor() { super('VilaRica'); }

    init(data) {
        this.diario       = data.diario || null;
        this.evidencias   = { carta: false, confissao: false, mapa: false };
        this.nevoaDissipada = false;
        this.fragmentoColetado = false;
        this._tempoJogo   = 0;
        this._tempoTotal  = 360; // 6 minutos
    }

    create() {
        // Mapa colonial: 480×240 (mais largo que a câmera 320×200)
        const MW = 800, MH = 600;
        this.physics.world.setBounds(0, 0, MW, MH);

        this.input_h = new InputHandler(this);
        this.dialogo = new DialogueManager(this);

        this._criarCenario(MW, MH);
        this._criarNPCs();
        this._criarEvidencias();
        this._criarNevoa();
        this._criarPlayer(MW, MH);
        this._criarHUD();
        this._criarEventos();

        this.cameras.main.setBounds(0, 0, MW, MH);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.fadeIn(800);

        this.time.delayedCall(900, () => this._introDialogo());
    }

    // ════════════════════════════════════════════════════════════
    // CENÁRIO
    // ════════════════════════════════════════════════════════════

    _criarCenario(W, H) {
        // Chão de pedra colonial
        this.add.tileSprite(0, 0, W, H, 'pedra_colonial').setOrigin(0).setDepth(0);

        // Paredes e edificações
        this.paredes = this.physics.add.staticGroup();

        const predio = (x, y, w, h, cor = 0xd4c8a0, corBorda = 0xb4a880) => {
            this.add.rectangle(x+w/2, y+h/2, w, h, cor).setDepth(2);
            this.add.rectangle(x+w/2, y+h/2, w, h, 0x000000, 0)
                .setStrokeStyle(1, corBorda).setDepth(3);
            const b = this.paredes.create(x+w/2, y+h/2, null)
                .setVisible(false).refreshBody();
            b.setSize(w, h);
        };

        // Bordas do mapa
        predio(0,    0, W,  12);
        predio(0,  228, W,  12);
        predio(0,    0, 12, H);
        predio(468,  0, 12, H);

        // Edificações — casa do Gonzaga (esquerda)
        predio(20,  20, 80, 60, 0xd4c8a0);
        this.add.text(60, 50, 'Casa\nGonzaga', {
            fontFamily: 'monospace', fontSize: '5px', color: '#2a1a00', align: 'center'
        }).setOrigin(0.5).setDepth(4);

        // Igreja (centro-topo)
        predio(190, 14, 100, 50, 0xe8e0c0);
        this.add.text(240, 38, 'IGREJA', {
            fontFamily: 'monospace', fontSize: '5px', color: '#2a1a00', align: 'center'
        }).setOrigin(0.5).setDepth(4);

        // Arquivo (direita)
        predio(370, 20, 90, 55, 0xd0c8a0);
        this.add.text(415, 46, 'Arquivo\nColonial', {
            fontFamily: 'monospace', fontSize: '5px', color: '#2a1a00', align: 'center'
        }).setOrigin(0.5).setDepth(4);

        // Taverna (esquerda-baixo)
        predio(20, 160, 80, 60, 0xc8b890);
        this.add.text(60, 190, 'Taverna', {
            fontFamily: 'monospace', fontSize: '5px', color: '#2a1a00', align: 'center'
        }).setOrigin(0.5).setDepth(4);

        // Casarão (direita-baixo)
        predio(370, 160, 90, 60, 0xd4c8a0);
        this.add.text(415, 190, 'Casarão', {
            fontFamily: 'monospace', fontSize: '5px', color: '#2a1a00', align: 'center'
        }).setOrigin(0.5).setDepth(4);

        // Praça central (onde fica a distorção da névoa)
        this.add.ellipse(240, 130, 60, 40, 0x9a8a7a, 0.5).setDepth(1);
        this.add.text(240, 130, 'PRAÇA', {
            fontFamily: 'monospace', fontSize: '4px', color: '#6a5a4a'
        }).setOrigin(0.5).setDepth(2);

        // Fontes e decoração
        this.add.circle(240, 112, 6, 0x4a7aa0).setDepth(2); // fonte
        this.add.circle(240, 112, 3, 0x6aaacc).setDepth(3);
    }

    // ════════════════════════════════════════════════════════════
    // NPCs DISTORCIDOS
    // ════════════════════════════════════════════════════════════

    _criarNPCs() {
        this._npcs = [
            {
                x: 120, y: 130,
                cor: 0x884422,
                nome: 'Comerciante',
                falou: false,
                falas: [
                    { speaker: 'Comerciante', text: 'O alferes Tiradentes? Um homem da Coroa, diz a história. Defensor da monarquia portuguesa.' },
                    { speaker: 'Comerciante', text: '...Mas há algo estranho. Por que minha memória sobre ele está tão turva?' },
                ]
            },
            {
                x: 350, y: 130,
                cor: 0x226644,
                nome: 'Padre',
                falou: false,
                falas: [
                    { speaker: 'Padre', text: 'Tiradentes nunca mencionou liberdade, filho. Só queria impostos menores para a Coroa.' },
                    { speaker: 'Padre', text: '...Espera. Eu mesmo disse isso? Sinto que estou repetindo algo que não é verdade.' },
                ]
            },
            {
                x: 240, y: 175,
                cor: 0x664422,
                nome: 'Mulher do Povo',
                falou: false,
                falas: [
                    { speaker: 'Mulher do Povo', text: 'Dizem que os planos dele eram para fortalecer Portugal. Nunca falou em república.' },
                    { speaker: 'Mulher do Povo', text: '...Mas eu sei que algo está errado. A névoa está me impedindo de lembrar.' },
                ]
            },
        ];

        this._npcSprites = this._npcs.map(n => {
            const sp = this.add.rectangle(n.x, n.y, 10, 14, n.cor).setDepth(6);
            // cabeça
            this.add.circle(n.x, n.y - 9, 5, 0xd4a574).setDepth(7);
            // tag com nome
            this.add.text(n.x, n.y - 18, n.nome, {
                fontFamily: 'monospace', fontSize: '4px', color: '#EF9F27'
            }).setOrigin(0.5).setDepth(8);
            return sp;
        });
    }

    // ════════════════════════════════════════════════════════════
    // EVIDÊNCIAS
    // ════════════════════════════════════════════════════════════

    _criarEvidencias() {
        const ev = [
            {
                id: 'carta', x: 60, y: 70,
                key: 'item_carta', label: 'Carta de Gonzaga',
                falas: [
                    { speaker: 'Diário de Alex', text: '📜 Carta entre conjurados. Fala em "república", "liberdade da pátria", "desligamento do jugo português".' },
                    { speaker: 'Diário de Alex', text: '"O alferes Xavier é o mais ardente de nós todos na causa da independência." — Gonzaga' },
                    { speaker: 'Diário de Alex', text: 'Isso contradiz tudo que as pessoas estão dizendo na praça. PISTA COLETADA.' },
                ]
            },
            {
                id: 'confissao', x: 415, y: 65,
                key: 'item_confissao', label: 'Confissão Oculta',
                falas: [
                    { speaker: 'Diário de Alex', text: '📜 Cópia de depoimento ao tribunal colonial. Descreve reuniões para proclamar uma REPÚBLICA independente.' },
                    { speaker: 'Diário de Alex', text: 'Inspirada nos ideais iluministas e na independência americana. Tiradentes se voluntariou sabendo dos riscos.' },
                    { speaker: 'Diário de Alex', text: 'Ele sabia que podia morrer. E foi mesmo assim. PISTA COLETADA.' },
                ]
            },
            {
                id: 'mapa', x: 60, y: 195,
                key: 'item_mapa', label: 'Mapa da Conspiração',
                falas: [
                    { speaker: 'Diário de Alex', text: '📜 Mapa com locais de reunião e nomes codificados. Uma rede ampla: advogados, padres, poetas, militares.' },
                    { speaker: 'Diário de Alex', text: 'A causa: independência do Brasil, fim do domínio português, ABOLIÇÃO DA ESCRAVIDÃO em Minas.' },
                    { speaker: 'Diário de Alex', text: 'A névoa havia apagado essa parte completamente. PISTA COLETADA.' },
                ]
            },
        ];

        this._evidencias = ev.map(e => {
            // Sprite do item
            const sp = this.add.image(e.x, e.y, e.key).setDisplaySize(12, 12).setDepth(7);
            // Float animation
            this.tweens.add({ targets: sp, y: e.y - 3, duration: 900, yoyo: true, repeat: -1 });
            // Label
            this.add.text(e.x, e.y - 11, e.label, {
                fontFamily: 'monospace', fontSize: '4px', color: '#EF9F27'
            }).setOrigin(0.5).setDepth(8);

            return { ...e, sprite: sp, coletado: false };
        });
    }

    // ════════════════════════════════════════════════════════════
    // NÉVOA — DISTORÇÃO NA PRAÇA
    // ════════════════════════════════════════════════════════════

    _criarNevoa() {
        // Névoa visual sobre a estátua/praça
        this._nevoaGfx = this.add.graphics().setDepth(9);
        this._nevoaGfx.fillStyle(0x5555aa, 0.45);
        this._nevoaGfx.fillEllipse(240, 112, 50, 30);

        // Texto de distorção
        this._nevoaLabel = this.add.text(240, 94, '⚠ DISTORÇÃO\nTiradentes\nMonarquista?', {
            fontFamily: 'monospace', fontSize: '4px', color: '#8888cc', align: 'center'
        }).setOrigin(0.5).setDepth(10);
        this.tweens.add({ targets: this._nevoaLabel, alpha: 0.2, duration: 1400, yoyo: true, repeat: -1 });
    }

    // ════════════════════════════════════════════════════════════
    // PLAYER
    // ════════════════════════════════════════════════════════════

    _criarPlayer(W, H) {
        this.player = new Player(this, W/2, H/2);
        this.physics.add.collider(this.player, this.paredes);
    }

    // ════════════════════════════════════════════════════════════
    // HUD
    // ════════════════════════════════════════════════════════════

    _criarHUD() {
        const W = 320;

        this._hudBg = this.add.graphics().setDepth(80).setScrollFactor(0);
        this._hudBg.fillStyle(0x0a0612, 0.92);
        this._hudBg.fillRect(0, 0, W, 14);

        this.add.text(4, 3, 'VILA RICA · 1789', {
            fontFamily: 'monospace', fontSize: '6px', color: '#EF9F27'
        }).setDepth(81).setScrollFactor(0);

        this._hudEv = this.add.text(W/2, 3, 'Pistas: 0/3', {
            fontFamily: 'monospace', fontSize: '6px', color: '#7F77DD'
        }).setOrigin(0.5, 0).setDepth(81).setScrollFactor(0);

        this._hudTimer = this.add.text(W - 4, 3, '6:00', {
            fontFamily: 'monospace', fontSize: '6px', color: '#c0392b'
        }).setOrigin(1, 0).setDepth(81).setScrollFactor(0);

        this._hudHint = this.add.text(W/2, 196, '', {
            fontFamily: 'monospace', fontSize: '5px', color: '#7F77DD'
        }).setOrigin(0.5, 1).setDepth(81).setScrollFactor(0);
    }

    _setHint(txt) { this._hudHint && this._hudHint.setText(txt); }

    _atualizarEvidencias() {
        const n = [this.evidencias.carta, this.evidencias.confissao, this.evidencias.mapa]
            .filter(Boolean).length;
        this._hudEv.setText(`Pistas: ${n}/3`);
        if (n === 3) this._hudEv.setColor('#EF9F27');
    }

    // ════════════════════════════════════════════════════════════
    // EVENTOS
    // ════════════════════════════════════════════════════════════

    _criarEventos() {
        this.events.on('guardianVisionOn', () => {
            // Aumenta visibilidade da névoa e mostra itens próximos
            this._nevoaGfx.setAlpha(1.4);
        });
        this.events.on('guardianVisionOff', () => {
            this._nevoaGfx.setAlpha(1);
        });
    }

    // ════════════════════════════════════════════════════════════
    // DIÁLOGOS
    // ════════════════════════════════════════════════════════════

    _introDialogo() {
        this.dialogo.show([
            { speaker: 'Clio', text: 'Vila Rica, 1789. A cidade mais rica do Brasil colonial. Mas algo está errado.' },
            { speaker: 'Clio', text: 'A Névoa distorceu Tiradentes. As pessoas o lembram como monarquista.' },
            { speaker: 'Clio', text: 'Encontre 3 provas. Use WASD para mover, ESPAÇO para interagir, V para a Visão do Guardião.' },
        ], () => {});
    }

    // ════════════════════════════════════════════════════════════
    // PUZZLE — CONECTAR OS FATOS
    // ════════════════════════════════════════════════════════════

    _abrirPuzzle() {
        if (this.dialogo.active) return;

        // Verifica se tem todas as evidências
        if (!this.evidencias.carta || !this.evidencias.confissao || !this.evidencias.mapa) {
            this.dialogo.show([
                { speaker: 'Clio', text: 'A distorção ainda está forte. Encontre as 3 pistas antes de tentar conectá-las.' },
            ], () => {});
            return;
        }

        // UI do puzzle
        const W = 320, H = 200;
        this._puzzleContainer = this.add.container(0, 0).setDepth(200).setScrollFactor(0);

        const dim = this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.88).setScrollFactor(0);

        this.add.text(W/2, 10, 'CONECTAR OS FATOS', {
            fontFamily: 'monospace', fontSize: '8px', color: '#EF9F27'
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(201);

        this.add.text(W/2, 20, 'Conecte as 3 pistas ao nó central', {
            fontFamily: 'monospace', fontSize: '5px', color: '#7F77DD'
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(201);

        // Nós do puzzle
        const nos = [
            { id: 'centro', x: W/2,      y: H/2,  label: 'TIRADENTES\n(Distorção)', central: true },
            { id: 'carta',  x: 60,        y: 60,   label: 'Carta de\nGonzaga',      central: false },
            { id: 'conf',   x: W-60,      y: 60,   label: 'Confissão\nOculta',       central: false },
            { id: 'mapa',   x: W/2,       y: H-40, label: 'Mapa da\nConspiração',   central: false },
        ];

        this._conexoes   = [];   // pares [a, b] conectados
        this._noSel      = null; // nó selecionado
        this._lineGfx    = this.add.graphics().setScrollFactor(0).setDepth(201);
        this._puzzleNos  = nos;

        this._noBgs = nos.map((no, i) => {
            const bg = this.add.graphics().setScrollFactor(0).setDepth(202);
            this._desenharNo_puzzle(bg, no, false);

            const hit = this.add.rectangle(no.x, no.y, no.central ? 54 : 48, 22, 0x000000, 0)
                .setScrollFactor(0).setDepth(203).setInteractive();

            hit.on('pointerdown', () => this._cliquePuzzleNo(i));
            hit.on('pointerover', () => { this._desenharNo_puzzle(bg, no, true); });
            hit.on('pointerout',  () => { this._desenharNo_puzzle(bg, no, this._noSel === i); });

            const lbl = this.add.text(no.x, no.y, no.label, {
                fontFamily: 'monospace', fontSize: '5px',
                color: no.central ? '#EF9F27' : '#F5F0E8',
                align: 'center'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(204);

            return { bg, hit, lbl, no };
        });

        // Botão confirmar
        const confirmar = this.add.text(W - 8, H - 8, '[CONFIRMAR]', {
            fontFamily: 'monospace', fontSize: '6px', color: '#EF9F27'
        }).setOrigin(1, 1).setScrollFactor(0).setDepth(205).setInteractive()
            .on('pointerdown', () => this._verificarPuzzle())
            .on('pointerover', function() { this.setColor('#ffdd44'); })
            .on('pointerout',  function() { this.setColor('#EF9F27'); });

        const instrucao = this.add.text(W/2, H - 8, 'Clique em dois nós para conectar', {
            fontFamily: 'monospace', fontSize: '5px', color: '#534AB7'
        }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(205);

        this._puzzleContainer.add([dim]);
    }

    _desenharNo_puzzle(g, no, hover) {
        g.clear();
        const cor = no.central ? (hover ? 0x7F77DD : 0x534AB7) : (hover ? 0x3C3489 : 0x1a1040);
        g.fillStyle(cor);
        g.fillRect(no.x - (no.central ? 27 : 24), no.y - 11, no.central ? 54 : 48, 22);
        g.lineStyle(1, no.central ? 0xEF9F27 : 0x3C3489);
        g.strokeRect(no.x - (no.central ? 27 : 24), no.y - 11, no.central ? 54 : 48, 22);
    }

    _cliquePuzzleNo(i) {
        if (this._noSel === null) {
            this._noSel = i;
            this._desenharNo_puzzle(this._noBgs[i].bg, this._puzzleNos[i], true);
        } else if (this._noSel !== i) {
            const a = Math.min(this._noSel, i), b = Math.max(this._noSel, i);
            const ja = this._conexoes.find(c => c[0] === a && c[1] === b);
            if (!ja) this._conexoes.push([a, b]);
            this._redesenharLinhas();
            this._desenharNo_puzzle(this._noBgs[this._noSel].bg, this._puzzleNos[this._noSel], false);
            this._noSel = null;
        } else {
            // Deseleciona
            this._desenharNo_puzzle(this._noBgs[i].bg, this._puzzleNos[i], false);
            this._noSel = null;
        }
    }

    _redesenharLinhas() {
        this._lineGfx.clear();
        this._conexoes.forEach(([a, b]) => {
            const na = this._puzzleNos[a], nb = this._puzzleNos[b];
            // Conexão válida = envolve o nó central (index 0)
            const valida = a === 0 || b === 0;
            this._lineGfx.lineStyle(1, valida ? 0xEF9F27 : 0x7F77DD, 0.8);
            this._lineGfx.beginPath();
            this._lineGfx.moveTo(na.x, na.y);
            this._lineGfx.lineTo(nb.x, nb.y);
            this._lineGfx.strokePath();
        });
    }

    _verificarPuzzle() {
        // Correto: centro (0) conectado a carta(1), confissao(2), mapa(3)
        const corretos = [[0,1],[0,2],[0,3]];
        const acertos = corretos.filter(r =>
            this._conexoes.find(c => c[0] === r[0] && c[1] === r[1])
        ).length;

        if (acertos === 3) {
            this._fecharPuzzle();
            this._resolverNevoa();
        } else {
            // Feedback de erro
            const err = this.add.text(160, 100, `${acertos}/3 conexões corretas. Tente novamente!`, {
                fontFamily: 'monospace', fontSize: '6px', color: '#c0392b', backgroundColor: '#000000'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(300);
            this.time.delayedCall(1600, () => err.destroy());
        }
    }

    _fecharPuzzle() {
        this._lineGfx?.destroy();
        this._noBgs?.forEach(n => { n.bg.destroy(); n.hit.destroy(); n.lbl.destroy(); });
        this._puzzleContainer?.destroy();
        this.children.getAll().filter(c => c.depth >= 200 && c.depth < 300).forEach(c => c.destroy());
    }

    _resolverNevoa() {
        // Névoa desaparece
        this.cameras.main.flash(400, 180, 150, 255);
        this.tweens.add({ targets: this._nevoaGfx, alpha: 0, duration: 1500 });
        this.tweens.add({ targets: this._nevoaLabel, alpha: 0, duration: 800, onComplete: () => {
            this._nevoaLabel.destroy();
            this.add.text(240, 94, '✦ Tiradentes\nMártir da\nIndependência', {
                fontFamily: 'monospace', fontSize: '4px', color: '#EF9F27', align: 'center'
            }).setOrigin(0.5).setDepth(10);
        }});

        this.cameras.main.shake(250, 0.008);
        this.nevoaDissipada = true;

        this.dialogo.show([
            { speaker: 'Clio', text: 'A névoa recua! Tiradentes era republicano — lutou pela independência, deu a vida por uma ideia.' },
            { speaker: 'Clio', text: 'A Inconfidência falhou por traição. Silvério dos Reis os entregou em troca do perdão de dívidas.' },
            { speaker: 'Diário de Alex', text: 'A história não é lista de mocinhos e vilões. É sobre escolhas reais de pessoas reais.' },
        ], () => this._coletarFragmento());
    }

    _coletarFragmento() {
        this.fragmentoColetado = true;

        const frag = this.add.image(240, 112, 'item_fragmento')
            .setDisplaySize(16, 16).setDepth(20);
        this.tweens.add({
            targets: frag, y: 104, duration: 800,
            yoyo: true, repeat: 2,
            onComplete: () => {
                frag.destroy();
                if (this.diario) {
                    this.diario.addFragmento('chama_vilarica', 'Vila Rica 1789');
                    this.diario.addAnotacao(
                        'Tiradentes',
                        'Era republicano, não monarquista. Deu a vida por independência e abolição em Minas.',
                        'Vila Rica 1789'
                    );
                }

                this.dialogo.show([
                    { speaker: 'Clio', text: '✦ Fragmento de Memória coletado! Vila Rica brilha no mapa.' },
                    { speaker: 'Clio', text: 'Retorne ao Templo da Memória para o próximo período.' },
                ], () => this._mostrarBotaoRetorno());
            }
        });
    }

    _mostrarBotaoRetorno() {
        this.add.text(160, 186, '[ RETORNAR AO TEMPLO ]', {
            fontFamily: 'monospace', fontSize: '6px', color: '#EF9F27',
            backgroundColor: '#3C3489', padding: { x: 6, y: 3 }
        }).setOrigin(0.5, 1).setDepth(90).setScrollFactor(0).setInteractive()
            .on('pointerdown', () => {
                this.cameras.main.fadeOut(500, 0, 0, 0);
                this.time.delayedCall(500, () => {
                    this.scene.start('Hub', { diario: this.diario });
                });
            });
    }

    // ════════════════════════════════════════════════════════════
    // UPDATE
    // ════════════════════════════════════════════════════════════

    update(time, delta) {
        // Avança diálogo
        if (this.dialogo.active) {
            if (this.input_h.justAction) this.dialogo.next();
            this.player.freeze();
            return;
        }

        // Puzzle aberto — não move player
        if (this._puzzleContainer && this._puzzleContainer.active) return;

        this.player.update();

        const px = this.player.x, py = this.player.y;

        // Timer
        if (!this.fragmentoColetado) {
            this._tempoJogo += delta / 1000;
            const rest = Math.max(0, this._tempoTotal - this._tempoJogo);
            const m = Math.floor(rest / 60), s = Math.floor(rest % 60);
            this._hudTimer.setText(`${m}:${s.toString().padStart(2,'0')}`);
            if (rest < 60) this._hudTimer.setColor('#ff4444');
        }

        // Visão do Guardião
        if (this.input_h.justVision) {
            this.player.toggleGuardianVision(!this.player.guardianVisionActive);
        }

        // Verificações de proximidade
        this._setHint('');
        let perto = false;

        // Evidências
        this._evidencias.forEach(e => {
            if (e.coletado) return;
            if (Phaser.Math.Distance.Between(px, py, e.x, e.y) < 20) {
                perto = true;
                this._setHint(`[ESPAÇO] Coletar: ${e.label}`);
                if (this.input_h.justAction) {
                    e.coletado = true;
                    this.evidencias[e.id] = true;
                    e.sprite.setAlpha(0.3);
                    this.player.freeze();
                    this.dialogo.show(e.falas, () => {
                        this.player.unfreeze();
                        this._atualizarEvidencias();
                        // Dica quando pegar todas
                        const total = Object.values(this.evidencias).filter(Boolean).length;
                        if (total === 3) {
                            this.time.delayedCall(300, () => {
                                this.dialogo.show([
                                    { speaker: 'Clio', text: 'Todas as pistas coletadas! Vá até a névoa na praça central e use o Mural de Investigação.' }
                                ], () => {});
                            });
                        }
                    });
                }
            }
        });

        // NPCs
        if (!perto) {
            this._npcs.forEach(n => {
                if (Phaser.Math.Distance.Between(px, py, n.x, n.y) < 22) {
                    perto = true;
                    this._setHint(`[ESPAÇO] Falar com ${n.nome}`);
                    if (this.input_h.justAction) {
                        this.player.freeze();
                        this.dialogo.show(n.falas, () => {
                            this.player.unfreeze();
                            n.falou = true;
                        });
                    }
                }
            });
        }

        // Névoa na praça
        if (!perto && !this.nevoaDissipada) {
            if (Phaser.Math.Distance.Between(px, py, 240, 112) < 26) {
                this._setHint('[ESPAÇO] Investigar a distorção da névoa');
                if (this.input_h.justAction) this._abrirPuzzle();
            }
        }

        // Pulso da névoa
        if (this._nevoaGfx && !this.nevoaDissipada) {
            this._nevoaGfx.alpha = 0.45 + Math.sin(time * 0.003) * 0.25;
        }
    }
}