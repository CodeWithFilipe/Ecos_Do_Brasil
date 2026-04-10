// ─────────────────────────────────────────────────────────────
// scenes/fases/hub/HubScene.js
//
// TEMPLO DA MEMÓRIA — Seleção de fases
// Recebe { diario } via scene.start('Hub', { diario })
// ─────────────────────────────────────────────────────────────

import DialogueManager from '../../../ui/DialogueManager.js';
import InputHandler    from '../../../core/InputHandler.js';

export default class HubScene extends Phaser.Scene {
    constructor() { super('Hub'); }

    init(data) {
        // Recebe o Diário de Alex persistente entre cenas
        this.diario = data.diario || null;
    }

    create() {
        const W = this.cameras.main.width;
        const H = this.cameras.main.height;

        this.input_h = new InputHandler(this);
        this.dialogo = new DialogueManager(this);

        // ── Fundo estrelado ───────────────────────────────────────
        this.add.rectangle(W/2, H/2, W, H, 0x050310);

        for (let i = 0; i < 90; i++) {
            const x = Phaser.Math.Between(0, W);
            const y = Phaser.Math.Between(0, H);
            const r = Math.random() < 0.15 ? 1 : 0;
            const g = this.add.rectangle(x, y, r+1, r+1, 0xffffff)
                .setAlpha(Math.random() * 0.5 + 0.15);
            if (Math.random() < 0.3) {
                this.tweens.add({
                    targets: g, alpha: 0.05,
                    duration: Phaser.Math.Between(1000, 3000),
                    yoyo: true, repeat: -1,
                    delay: Phaser.Math.Between(0, 2000)
                });
            }
        }

        // ── Partículas de névoa ───────────────────────────────────
        for (let i = 0; i < 10; i++) {
            const fog = this.add.ellipse(
                Phaser.Math.Between(40, W - 40),
                Phaser.Math.Between(30, H - 20),
                Phaser.Math.Between(12, 30),
                Phaser.Math.Between(6, 14),
                0x5555aa, 0.12
            );
            this.tweens.add({
                targets: fog,
                x: fog.x + Phaser.Math.Between(-20, 20),
                alpha: 0.04,
                duration: Phaser.Math.Between(2500, 5000),
                yoyo: true, repeat: -1,
                delay: Phaser.Math.Between(0, 3000)
            });
        }

        // ── Título ────────────────────────────────────────────────
        this.add.text(W/2, 10, 'TEMPLO DA MEMÓRIA', {
            fontFamily: 'monospace', fontSize: '9px', color: '#EF9F27'
        }).setOrigin(0.5, 0);

        this.add.text(W/2, 21, 'Escolha um período para restaurar', {
            fontFamily: 'monospace', fontSize: '5px', color: '#534AB7'
        }).setOrigin(0.5, 0);

        // ── Silhueta do Brasil ────────────────────────────────────
        this._desenharBrasil();

        // ── Nós de missão ─────────────────────────────────────────
        const frags = this.diario ? this.diario.totalFragmentos : 0;

        this.missoes = [
            {
                x: 128, y: 105,
                label: 'Vila Rica\n1789',
                sub: 'Inconfidência Mineira',
                cena: 'VilaRica',
                desbloqueada: true,
                concluida: frags >= 1,
                cor: 0xEF9F27
            },
            {
                x: 185, y: 122,
                label: 'Rio de Janeiro\n1889',
                sub: 'Proclamação da República',
                cena: 'Rio1889',
                desbloqueada: frags >= 1,
                concluida: frags >= 2,
                cor: 0x27ae60
            },
            {
                x: 155, y: 78,
                label: 'São Paulo\n1888',
                sub: 'Lei Áurea',
                cena: 'SaoPaulo1888',
                desbloqueada: frags >= 2,
                concluida: frags >= 3,
                cor: 0x2980b9
            },
            {
                x: 178, y: 100,
                label: 'Rio de Janeiro\n1904',
                sub: 'Revolta da Vacina',
                cena: 'Rio1904',
                desbloqueada: frags >= 3,
                concluida: frags >= 4,
                cor: 0xc0392b
            },
        ];

        this.missoes.forEach(m => this._desenharNo(m));

        // ── Contador de fragmentos ────────────────────────────────
        this.add.text(W - 4, 4, `✦ ${frags}/4 Fragmentos`, {
            fontFamily: 'monospace', fontSize: '5px', color: '#EF9F27'
        }).setOrigin(1, 0);

        // ── Clio ──────────────────────────────────────────────────
        this.clioImg = this.add.rectangle(24, H/2, 14, 20, 0x3C3489)
            .setStrokeStyle(1, 0x7F77DD);
        // Aura pulsante
        const aura = this.add.graphics();
        aura.lineStyle(1, 0x3C3489, 0.4);
        aura.strokeCircle(24, H/2, 14);
        this.tweens.add({ targets: aura, alpha: 0.05, duration: 1800, yoyo: true, repeat: -1 });
        this.tweens.add({ targets: this.clioImg, y: H/2 - 2, duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

        // Hint de interação com Clio
        this.add.text(24, H/2 + 14, 'CLIO', {
            fontFamily: 'monospace', fontSize: '4px', color: '#7F77DD'
        }).setOrigin(0.5, 0);

        // ── Hint TAB ──────────────────────────────────────────────
        this.add.text(W/2, H - 4, '[TAB] Diário  [ESPAÇO] Falar com Clio', {
            fontFamily: 'monospace', fontSize: '5px', color: '#534AB7'
        }).setOrigin(0.5, 1);

        // ── Intro ─────────────────────────────────────────────────
        this.cameras.main.fadeIn(800);
        this.time.delayedCall(900, () => this._introHub());
    }

    _desenharBrasil() {
        const g = this.add.graphics();

        // Silhueta simplificada (polígono aproximado)
        const pts = [
            158,34, 182,31, 208,40, 225,54, 232,74, 237,98,
            232,122, 222,142, 207,158, 192,166, 172,168,
            152,163, 132,153, 115,138, 106,118, 103,98,
            106,78, 113,58, 128,44
        ];

        g.lineStyle(1, 0x3C3489, 0.7);
        g.fillStyle(0x0d0a20, 0.8);
        g.beginPath();
        g.moveTo(pts[0], pts[1]);
        for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i+1]);
        g.closePath();
        g.fillPath();
        g.strokePath();
    }

    _desenharNo(missao) {
        const { x, y, label, sub, cena, desbloqueada, concluida, cor } = missao;

        if (!desbloqueada) {
            // Nó bloqueado
            const g = this.add.graphics();
            g.fillStyle(0x222244, 0.8);
            g.fillCircle(x, y, 5);
            this.add.text(x, y - 10, label, {
                fontFamily: 'monospace', fontSize: '4px', color: '#333355', align: 'center'
            }).setOrigin(0.5);
            return;
        }

        // Nó ativo
        const g = this.add.graphics();
        g.fillStyle(cor, concluida ? 0.3 : 0.25);
        g.fillCircle(x, y, 9);
        g.fillStyle(concluida ? 0x888888 : cor, 1);
        g.fillCircle(x, y, 4);

        if (!concluida) {
            this.tweens.add({ targets: g, alpha: 0.4, duration: 900, yoyo: true, repeat: -1 });
        }

        this.add.text(x, y - 12, label, {
            fontFamily: 'monospace', fontSize: '4px',
            color: concluida ? '#666666' : '#F5F0E8',
            align: 'center'
        }).setOrigin(0.5);

        if (concluida) {
            this.add.text(x, y + 7, '✦', {
                fontFamily: 'monospace', fontSize: '6px', color: '#EF9F27'
            }).setOrigin(0.5, 0);
            return;
        }

        // Área clicável + hover
        const hit = this.add.circle(x, y, 12, 0x000000, 0).setInteractive();

        hit.on('pointerdown', () => {
            if (!cena) return; // fase ainda não implementada
            this.cameras.main.fadeOut(500, 0, 0, 0);
            this.time.delayedCall(500, () => {
                this.scene.start(cena, { diario: this.diario });
            });
        });

        hit.on('pointerover', () => {
            const tooltip = this.add.text(x, y + 14, sub, {
                fontFamily: 'monospace', fontSize: '5px', color: '#EF9F27',
                backgroundColor: '#0a0612', padding: { x: 3, y: 2 }
            }).setOrigin(0.5, 0).setName('tooltip');
        });

        hit.on('pointerout', () => {
            this.children.getByName('tooltip')?.destroy();
        });
    }

    _introHub() {
        if (this.dialogo.active) return;
        const frags = this.diario ? this.diario.totalFragmentos : 0;

        if (frags === 0) {
            this.dialogo.show([
                { speaker: 'Clio', text: 'Você foi sugado para dentro do livro. Mas na verdade, o livro era uma porta.' },
                { speaker: 'Clio', text: 'Bem-vindo ao Templo da Memória. Este mapa mostra o Brasil — coberto pela Névoa do Esquecimento.' },
                { speaker: 'Clio', text: 'Sua primeira missão: Vila Rica, 1789. Clique no ponto que pulsa no mapa.' },
            ], () => {});
        } else {
            this.dialogo.show([
                { speaker: 'Clio', text: `Você já restaurou ${frags} fragmento${frags > 1 ? 's' : ''}. O mapa está ganhando clareza.` },
                { speaker: 'Clio', text: 'Escolha o próximo período.' },
            ], () => {});
        }
    }

    update() {
        if (this.dialogo.active && this.input_h.justAction) {
            this.dialogo.next();
        }

        // Falar com Clio
        if (!this.dialogo.active && this.input_h.justAction) {
            this._introHub();
        }
    }
}