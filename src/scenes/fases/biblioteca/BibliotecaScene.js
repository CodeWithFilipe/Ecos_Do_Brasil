// ─────────────────────────────────────────────────────────────
// scenes/fases/biblioteca/BibliotecaScene.js
//
// PRÓLOGO — Escola Pública
// Fluxo: Biblioteca → Estoque → Encontra livro → Sucção
// ─────────────────────────────────────────────────────────────

import Player          from '../../../entities/Player.js';
import DialogueManager from '../../../systems/DialogueManager.js';
import Diario          from '../../../systems/Diario.js';
import InputHandler    from '../../../systems/InputHandler.js';

export default class BibliotecaScene extends Phaser.Scene {
    constructor() { super('Biblioteca'); }

    create() {
        // ── Mapa lógico: 320×200 (mesma resolução do jogo) ───────
        // Biblioteca ocupa a cena inteira. Estoque é outra "sala"
        // carregada com fadeOut/fadeIn sem trocar de Scene.
        this.physics.world.setBounds(0, 0, 320, 200);

        // Estado da cena
        this.sala          = 'biblioteca';  // 'biblioteca' | 'estoque'
        this.pilhasVistas  = [false, false, false];
        this.livroAtivado  = false;

        // ── Sistemas ──────────────────────────────────────────────
        this.input_h  = new InputHandler(this);
        this.dialogo  = new DialogueManager(this);
        this.diario   = new Diario(this);

        // ── Construir cena ────────────────────────────────────────
        this._criarBiblioteca();
        this._criarPlayer();
        this._criarCamera();
        this._criarHUD();
        this._criarEventos();

        // ── Intro ─────────────────────────────────────────────────
        this.cameras.main.fadeIn(600);
        this.time.delayedCall(700, () => this._introDialogo());
    }

    // ════════════════════════════════════════════════════════════
    // CONSTRUÇÃO — BIBLIOTECA
    // ════════════════════════════════════════════════════════════

    _criarBiblioteca() {
        // Piso
        this.add.tileSprite(0, 0, 320, 200, 'piso_madeira').setOrigin(0).setDepth(0);

        // Paredes (grupo estático para colisão)
        this.paredes = this.physics.add.staticGroup();

        // Estantes — topo e laterais
        const posEstantes = [
            // [x, y, w, h] em tiles de 16px → convertido para px
            [0,   0, 320,  16],  // parede topo
            [0,   0,  16, 200],  // parede esquerda
            [304, 0,  16, 200],  // parede direita
            [16,  0, 288,  16],  // estantes topo linha 1
            [16, 32, 144,  16],  // estante esquerda
            [176, 32, 128, 16],  // estante direita
            [16, 64, 144,  16],
            [176, 64, 128, 16],
        ];

        posEstantes.forEach(([x, y, w, h]) => {
            const wall = this.add.rectangle(x + w/2, y + h/2, w, h, 0x2a1206)
                .setDepth(2);
            const body = this.paredes.create(x + w/2, y + h/2, null)
                .setVisible(false).refreshBody();
            body.setSize(w, h);
        });

        // Decoração: estantes com cor mais clara
        [
            [16, 32, 144, 14], [176, 32, 128, 14],
            [16, 64, 144, 14], [176, 64, 128, 14],
        ].forEach(([x, y, w, h]) => {
            this.add.rectangle(x + w/2, y + h/2, w, h - 2, 0x5c3d1e).setDepth(3);
            // Livros na estante (decorativos)
            for (let bx = x + 4; bx < x + w - 4; bx += 6) {
                const cor = Phaser.Display.Color.HSVToRGB(Math.random(), 0.8, 0.7);
                this.add.rectangle(bx, y + 4, 4, 10, cor.color).setDepth(4);
            }
        });

        // Mesa da professora
        this.add.rectangle(200, 130, 32, 16, 0x7a5230).setDepth(2);

        // Professora
        this.professora = this.physics.add.sprite(200, 118, 'prof_down')
            .setDepth(5).setImmovable(true);
        this.professora.setDisplaySize(14, 14);

        // Aluno 1 — dormindo na mesa
        this.aluno1 = this.add.rectangle(80, 150, 8, 8, 0x4488cc).setDepth(3);
        this.add.text(80, 141, 'z z z', {
            fontFamily: 'monospace', fontSize: '4px', color: '#8888aa'
        }).setOrigin(0.5).setDepth(4);

        // Aluno 2 — no celular
        this.aluno2 = this.add.rectangle(110, 150, 8, 8, 0xcc4444).setDepth(3);
        this.add.text(110, 141, '📱', {
            fontFamily: 'monospace', fontSize: '5px', color: '#888888'
        }).setOrigin(0.5).setDepth(4);

        // Porta do estoque (canto inferior direito)
        this.portaEstoque = this.add.rectangle(284, 185, 24, 10, 0x5c3d1e)
            .setDepth(3).setInteractive();
        this.add.text(284, 178, 'ESTOQUE', {
            fontFamily: 'monospace', fontSize: '4px', color: '#EF9F27'
        }).setOrigin(0.5).setDepth(4);

        // Lâmpada piscando
        this.lampada = this.add.rectangle(160, 6, 4, 4, 0xffff88).setDepth(5);
        this.tweens.add({
            targets: this.lampada, alpha: 0.1,
            duration: 2000, yoyo: true, repeat: -1, ease: 'Stepped'
        });

        // Mancha no teto
        this.add.ellipse(60, 10, 40, 14, 0x3a2800, 0.5).setDepth(1);
    }

    _criarEstoque() {
        // Remove biblioteca e constrói estoque
        this.children.each(c => {
            if (c !== this.player && c !== this.dialogo.container && c !== this._hud)
                c.destroy();
        });
        if (this.paredes) this.paredes.clear(true, true);

        this.physics.world.setBounds(0, 0, 320, 200);

        // Piso de concreto
        this.add.tileSprite(0, 0, 320, 200, 'piso_concreto').setOrigin(0).setDepth(0);

        // Paredes do estoque
        this.paredes = this.physics.add.staticGroup();

        const parede = (x, y, w, h) => {
            this.add.rectangle(x+w/2, y+h/2, w, h, 0x2a2a2a).setDepth(2);
            const b = this.paredes.create(x+w/2, y+h/2, null).setVisible(false).refreshBody();
            b.setSize(w, h);
        };

        parede(0, 0, 320, 12);   // topo
        parede(0, 188, 320, 12); // baixo
        parede(0, 0, 12, 200);   // esquerda
        parede(308, 0, 12, 200); // direita

        // Recria colisão do player com as novas paredes
        this.physics.add.collider(this.player, this.paredes);

        // ── Pilhas de livros ──────────────────────────────────────

        // Pilha 1 — caixas e livros aleatórios (nada útil)
        this._criarPilha(50, 80, 0, false);

        // Pilha 2 — atlas antigo, caderno esquecido (nada útil)
        this._criarPilha(140, 70, 1, false);

        // Pilha 3 — livros velhos + o livro misterioso (especial)
        this._criarPilha(240, 90, 2, true);

        // Zelador com rodo
        this.zelador = this.physics.add.sprite(260, 155, 'zelador_right')
            .setDepth(5).setImmovable(true).setDisplaySize(14, 14);
        this.physics.add.collider(this.player, this.zelador);

        // Animação do rodo (balança levemente)
        this.tweens.add({
            targets: this.zelador,
            angle: -8,
            duration: 700,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Porta de saída (volta para a biblioteca)
        this.portaSaida = this.add.rectangle(28, 185, 24, 10, 0x5c3d1e)
            .setDepth(3);
        this.add.text(28, 178, '← SAIR', {
            fontFamily: 'monospace', fontSize: '4px', color: '#7F77DD'
        }).setOrigin(0.5).setDepth(4);

        // Bagunça decorativa: papéis no chão
        for (let i = 0; i < 12; i++) {
            this.add.rectangle(
                Phaser.Math.Between(20, 300),
                Phaser.Math.Between(20, 180),
                Phaser.Math.Between(4, 10),
                Phaser.Math.Between(3, 6),
                0xddddcc, 0.6
            ).setDepth(1);
        }

        this._atualizarHUD('ESTOQUE DA BIBLIOTECA');
    }

    _criarPilha(x, y, index, especial) {
        // Caixas base
        const caixa = this.add.rectangle(x, y, 22, 18, 0x7a5230).setDepth(3);
        const caixa2 = this.add.rectangle(x - 6, y - 12, 16, 14, 0x5c3d1e).setDepth(4);
        const livros = this.add.rectangle(x + 4, y - 8, 18, 10, 0x4a3828).setDepth(4);

        // Cores dos livros
        [-4, 2, 8].forEach((dx, i) => {
            const cor = [0xc0392b, 0x2980b9, 0x27ae60][i];
            this.add.rectangle(x + dx, y - 8, 4, 10, cor).setDepth(5);
        });

        if (especial) {
            // Livro misterioso com glow
            this.livroMisterioso = this.add.rectangle(x + 10, y - 16, 8, 10, 0x1a0a04)
                .setDepth(6);
            this.tweens.add({
                targets: this.livroMisterioso,
                alpha: 0.5, duration: 1400, yoyo: true, repeat: -1
            });

            // Brilho roxo pulsante ao redor
            const aura = this.add.graphics().setDepth(5);
            aura.lineStyle(1, 0x3C3489, 0.6);
            aura.strokeRect(x + 5, y - 21, 10, 12);
            this.tweens.add({ targets: aura, alpha: 0.1, duration: 1000, yoyo: true, repeat: -1 });
        }

        // Zona de interação (hitbox invisível)
        const zona = this.add.rectangle(x, y - 8, 30, 30, 0x000000, 0)
            .setDepth(7).setInteractive();
        zona.setData('pilhaIndex', index);
        zona.setData('especial', especial);

        this._pilhaZonas = this._pilhaZonas || [];
        this._pilhaZonas.push(zona);
    }

    // ════════════════════════════════════════════════════════════
    // PLAYER E CÂMERA
    // ════════════════════════════════════════════════════════════

    _criarPlayer() {
        this.player = new Player(this, 160, 160);
        this.physics.add.collider(this.player, this.paredes);
    }

    _criarCamera() {
        this.cameras.main.setBounds(0, 0, 320, 200);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    }

    // ════════════════════════════════════════════════════════════
    // HUD
    // ════════════════════════════════════════════════════════════

    _criarHUD() {
        // Container fixo na tela (scrollFactor 0)
        this._hudBg = this.add.graphics().setDepth(90).setScrollFactor(0);
        this._hudBg.fillStyle(0x0a0612, 0.9);
        this._hudBg.fillRect(0, 0, 320, 14);

        this._hudTitulo = this.add.text(4, 3, 'BIBLIOTECA DA ESCOLA', {
            fontFamily: 'monospace', fontSize: '6px', color: '#EF9F27'
        }).setDepth(91).setScrollFactor(0);

        this._hudHint = this.add.text(160, 194, '', {
            fontFamily: 'monospace', fontSize: '5px', color: '#7F77DD'
        }).setOrigin(0.5, 1).setDepth(91).setScrollFactor(0);
    }

    _atualizarHUD(titulo) {
        this._hudTitulo && this._hudTitulo.setText(titulo);
    }

    _setHint(txt) {
        this._hudHint && this._hudHint.setText(txt);
    }

    // ════════════════════════════════════════════════════════════
    // EVENTOS E INTERAÇÕES
    // ════════════════════════════════════════════════════════════

    _criarEventos() {
        // Visão do Guardião (tecla V)
        this.events.on('guardianVisionOn',  () => this._ativarVisao());
        this.events.on('guardianVisionOff', () => this._desativarVisao());
    }

    _ativarVisao() {
        // Na biblioteca: revela detalhes ocultos (nada ainda, mas estrutura está pronta)
    }

    _desativarVisao() {}

    // ── Diálogos de introdução ────────────────────────────────

    _introDialogo() {
        this.dialogo.show([
            { speaker: 'Diário de Alex', text: 'Trabalho de história pra amanhã. A professora disse: fonte primária, não Wikipedia.' },
            { speaker: 'Diário de Alex', text: 'A biblioteca da escola... menor do que eu lembrava. Cheiro de papel velho e... armador.' },
        ], () => {});
    }

    _dialogoProfessora() {
        if (this.dialogo.active) return;
        this.player.freeze();
        this.dialogo.show([
            { speaker: 'Professora', text: 'Vai lá no fundo, tem um estoque. Talvez tenha uns livros mais antigos lá.' },
            { speaker: 'Professora', text: 'Mas não bagunça.' },
        ], () => this.player.unfreeze());
    }

    _dialogoAluno1() {
        if (this.dialogo.active) return;
        this.dialogo.show([
            { speaker: 'Aluno', text: 'zzz...' },
        ], () => {});
    }

    _dialogoAluno2() {
        if (this.dialogo.active) return;
        this.dialogo.show([
            { speaker: 'Aluno', text: '...' },
        ], () => {});
    }

    _dialogoZelador() {
        if (this.dialogo.active) return;
        this.dialogo.show([
            { speaker: 'Zelador', text: '...' },
        ], () => {});
    }

    _dialogoPilha(index) {
        if (this.dialogo.active) return;
        this.pilhasVistas[index] = true;

        const textos = [
            [
                { speaker: 'Diário de Alex', text: 'Gramática de 1987, uma bíblia de bolso, ata de reunião de pais de 2003...' },
                { speaker: 'Diário de Alex', text: 'Nada de histórico aqui.' },
            ],
            [
                { speaker: 'Diário de Alex', text: 'Atlas com a União Soviética ainda no mapa. Um caderno esquecido de alguém.' },
                { speaker: 'Diário de Alex', text: 'Nada útil.' },
            ],
            [
                { speaker: 'Diário de Alex', text: 'Esta pilha é mais velha... livros de capa dura, cheirando a tempo.' },
                { speaker: 'Diário de Alex', text: 'Tem um aqui no fundo, sem título. A lombada é de couro escuro. Estranho.' },
            ],
        ];

        this.player.freeze();
        this.dialogo.show(textos[index], () => {
            this.player.unfreeze();
            if (index === 2) this._revelarLivroMisterioso();
        });
    }

    _revelarLivroMisterioso() {
        if (this.livroAtivado) return;

        // Pisca o livro e mostra prompt de interação
        this._setHint('[ESPAÇO] Pegar o livro estranho');

        this.tweens.add({
            targets: this.livroMisterioso,
            y: this.livroMisterioso.y - 3,
            duration: 600, yoyo: true, repeat: 2,
            onComplete: () => {
                this._podePegarLivro = true;
            }
        });
    }

    _ativarLivro() {
        if (this.livroAtivado || !this._podePegarLivro) return;
        this.livroAtivado = true;
        this._podePegarLivro = false;
        this._setHint('');

        this.player.freeze();
        this.dialogo.show([
            { speaker: 'Diário de Alex', text: 'Este livro... não tem título. A capa é de couro escuro.' },
            { speaker: 'Diário de Alex', text: 'E está quente. Quente como a palma de uma mão.' },
            { speaker: 'Diário de Alex', text: 'Primeira página: em branco. Segunda: em branco. Terceira...' },
            { speaker: 'Livro',          text: '"Quem lê isto foi escolhido. O passado precisa de você."' },
            { speaker: 'Diário de Alex', text: 'As páginas começaram a virar sozinhas. Tentei largar o livro.' },
            { speaker: 'Diário de Alex', text: 'Não consegui.' },
        ], () => this._sequenciaSiccao());
    }

    _sequenciaSiccao() {
        // Câmera treme + flash roxo + zoom → Hub
        this.cameras.main.shake(400, 0.012);
        this.time.delayedCall(300, () => {
            this.cameras.main.flash(200, 60, 30, 140);
        });
        this.time.delayedCall(700, () => {
            this.tweens.add({
                targets: this.cameras.main,
                zoom: 8,
                duration: 1000,
                ease: 'Power3',
                onComplete: () => {
                    this.cameras.main.fadeOut(400, 10, 5, 30);
                    this.time.delayedCall(450, () => {
                        this.scene.start('Hub', { diario: this.diario });
                    });
                }
            });
        });
    }

    // ── Entrar no Estoque ─────────────────────────────────────

    _entrarEstoque() {
        if (this.sala === 'estoque') return;
        this.sala = 'estoque';

        this.cameras.main.fadeOut(350, 0, 0, 0);
        this.time.delayedCall(350, () => {
            this._pilhaZonas = [];
            this._criarEstoque();
            this.player.setPosition(40, 170);
            this.physics.add.collider(this.player, this.paredes);
            this.cameras.main.fadeIn(350);

            // Reaplicar colisão com zelador
            this.physics.add.collider(this.player, this.zelador);

            this.time.delayedCall(400, () => {
                this.dialogo.show([
                    { speaker: 'Diário de Alex', text: 'Que bagunça...' },
                    { speaker: 'Diário de Alex', text: 'O zelador está empurrando a água para baixo das caixas. Entendimento mútuo.' },
                ], () => {});
            });
        });
    }

    _sairEstoque() {
        if (this.sala === 'biblioteca') return;
        this.sala = 'biblioteca';

        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.time.delayedCall(300, () => {
            this._pilhaZonas = [];
            this._criarBiblioteca();
            this.player.setPosition(270, 170);
            this.physics.add.collider(this.player, this.paredes);
            this.physics.add.collider(this.player, this.professora);
            this.cameras.main.fadeIn(300);
            this._atualizarHUD('BIBLIOTECA DA ESCOLA');
        });
    }

    // ════════════════════════════════════════════════════════════
    // UPDATE
    // ════════════════════════════════════════════════════════════

    update() {
        if (this.dialogo.active) {
            // Avança diálogo com ESPAÇO
            if (this.input_h.justAction) this.dialogo.next();
            this.player.freeze();
            return;
        }

        this.player.update();

        const p  = this.player;
        const px = p.x, py = p.y;

        // Visão do Guardião
        if (this.input_h.justVision) {
            p.toggleGuardianVision(!p.guardianVisionActive);
        }

        // ── BIBLIOTECA ────────────────────────────────────────
        if (this.sala === 'biblioteca') {
            this._setHint('');

            // Interação com professora
            const distProf = Phaser.Math.Distance.Between(px, py, 200, 118);
            if (distProf < 24) {
                this._setHint('[ESPAÇO] Falar com a professora');
                if (this.input_h.justAction) this._dialogoProfessora();
            }

            // Interação com aluno 1
            else if (Phaser.Math.Distance.Between(px, py, 80, 150) < 20) {
                this._setHint('[ESPAÇO] Falar');
                if (this.input_h.justAction) this._dialogoAluno1();
            }

            // Interação com aluno 2
            else if (Phaser.Math.Distance.Between(px, py, 110, 150) < 20) {
                this._setHint('[ESPAÇO] Falar');
                if (this.input_h.justAction) this._dialogoAluno2();
            }

            // Porta do estoque
            else if (Phaser.Math.Distance.Between(px, py, 284, 185) < 20) {
                this._setHint('[ESPAÇO] Entrar no estoque');
                if (this.input_h.justAction) this._entrarEstoque();
            }
        }

        // ── ESTOQUE ───────────────────────────────────────────
        else if (this.sala === 'estoque') {
            this._setHint('');

            // Zelador
            if (Phaser.Math.Distance.Between(px, py, 260, 155) < 22) {
                this._setHint('[ESPAÇO] Falar');
                if (this.input_h.justAction) this._dialogoZelador();
            }

            // Porta de saída
            else if (px < 40 && py > 165) {
                this._setHint('[ESPAÇO] Voltar para a biblioteca');
                if (this.input_h.justAction) this._sairEstoque();
            }

            // Pilhas de livros
            else if (this._pilhaZonas) {
                let perto = false;

                // Pilha 1
                if (Phaser.Math.Distance.Between(px, py, 50, 80) < 28) {
                    perto = true;
                    this._setHint('[ESPAÇO] Examinar pilha de livros');
                    if (this.input_h.justAction) this._dialogoPilha(0);
                }
                // Pilha 2
                else if (Phaser.Math.Distance.Between(px, py, 140, 70) < 28) {
                    perto = true;
                    this._setHint('[ESPAÇO] Examinar pilha de livros');
                    if (this.input_h.justAction) this._dialogoPilha(1);
                }
                // Pilha 3 (especial)
                else if (Phaser.Math.Distance.Between(px, py, 240, 90) < 28) {
                    perto = true;
                    if (this._podePegarLivro) {
                        this._setHint('[ESPAÇO] Pegar o livro estranho');
                        if (this.input_h.justAction) this._ativarLivro();
                    } else {
                        this._setHint('[ESPAÇO] Examinar pilha de livros');
                        if (this.input_h.justAction) this._dialogoPilha(2);
                    }
                }

                if (!perto) this._setHint('');
            }
        }
    }
}