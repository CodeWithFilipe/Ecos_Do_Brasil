// ─────────────────────────────────────────────────────────────
// MenuPrincipal.js — Menu Principal do Ecos do Brasil
// ─────────────────────────────────────────────────────────────

export default class MenuPrincipal extends Phaser.Scene {
    constructor() { super('MenuPrincipal'); }

    create() {
        const W = this.cameras.main.width;
        const H = this.cameras.main.height;

        this.cameras.main.setBackgroundColor('#050310');

        // Gera portrait de Clio (se não existir ainda)
        if (!this.textures.exists('clio_portrait')) {
            this._gerarClioPortrait();
        }

        const saveData = localStorage.getItem('ecos_brasil_save');
        this.hasSave = !!saveData;

        // ── Fundo estrelado ─────────────────────────────────
        for (let i = 0; i < 160; i++) {
            const x = Phaser.Math.Between(0, W);
            const y = Phaser.Math.Between(0, H);
            const size = Math.random() < 0.15 ? 2 : 1;
            const star = this.add.rectangle(x, y, size, size, 0xffffff, Math.random() * 0.6 + 0.15);
            if (Math.random() < 0.3) {
                this.tweens.add({ targets: star, alpha: 0.05, duration: Phaser.Math.Between(1200, 3000), yoyo: true, repeat: -1 });
            }
        }

        // ── Névoa ────────────────────────────────────────────
        for (let i = 0; i < 3; i++) {
            const fog = this.add.graphics();
            fog.fillStyle(0x3C3489, 0.05 + i * 0.02);
            fog.fillRect(0, i * (H / 3), W, H / 3);
            this.tweens.add({ targets: fog, x: i % 2 === 0 ? 8 : -8, duration: 4000 + i * 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        }

        // ── Título ───────────────────────────────────────────
        this.add.text(W / 2, H * 0.12, 'ECOS DO BRASIL', {
            fontFamily: 'monospace', fontSize: '36px', color: '#EF9F27',
            stroke: '#6B4A00', strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(W / 2, H * 0.22, 'O Guardião da Memória', {
            fontFamily: 'monospace', fontSize: '18px', color: '#7F77DD'
        }).setOrigin(0.5);

        this.add.text(W / 2, H * 0.29, '~ A Névoa do Esquecimento avança ~', {
            fontFamily: 'monospace', fontSize: '12px', color: '#534AB7'
        }).setOrigin(0.5);

        // ── Clio (portrait central) ──────────────────────────
        const clioImg = this.add.image(W / 2, H * 0.52, 'clio_portrait').setScale(4).setDepth(5);
        this.tweens.add({ targets: clioImg, y: H * 0.52 - 5, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

        const aura = this.add.graphics().setDepth(4);
        aura.lineStyle(2, 0x7F77DD, 0.3);
        aura.strokeCircle(W / 2, H * 0.52, 44);
        this.tweens.add({ targets: aura, alpha: 0.05, duration: 1800, yoyo: true, repeat: -1 });

        // ── Botões ───────────────────────────────────────────
        let buttonY = H * 0.74;
        const spacing = 52;

        this._criarBotao(W / 2, buttonY, '▶  NOVA JORNADA', () => {
            localStorage.removeItem('ecos_brasil_save');
            this.cameras.main.fadeOut(500, 0, 0, 0);
            this.time.delayedCall(500, () => this.scene.start('Biblioteca'));
        });
        buttonY += spacing;

        if (this.hasSave) {
            let inv = null;
            try { inv = JSON.parse(saveData); } catch(e) {}
            const frags = inv ? (inv.fragments || 0) : 0;
            this._criarBotao(W / 2, buttonY, `▷  CONTINUAR  (✦ ${frags}/4)`, () => {
                this.cameras.main.fadeOut(500, 0, 0, 0);
                this.time.delayedCall(500, () => this.scene.start('Hub', { inventory: inv }));
            });
            buttonY += spacing;
        }

        this._criarBotao(W / 2, buttonY, '★  CRÉDITOS', () => {
            this.cameras.main.fadeOut(500, 0, 0, 0);
            // Por ora volta pro próprio menu (cenas de créditos ainda não adicionadas)
            this.time.delayedCall(500, () => this.cameras.main.fadeIn(500));
        });

        // ── Rodapé ───────────────────────────────────────────
        this.add.text(W / 2, H - 16, 'Centro Universitário Católica de SC · 2025', {
            fontFamily: 'monospace', fontSize: '11px', color: '#3C3489'
        }).setOrigin(0.5);

        this.cameras.main.fadeIn(800);
    }

    _criarBotao(x, y, texto, callback) {
        const btn = this.add.text(x, y, texto, {
            fontFamily: 'monospace', fontSize: '18px', color: '#F5F0E8',
            backgroundColor: '#3C3489', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();

        btn.on('pointerdown', () => {
            this.cameras.main.fadeOut(500, 0, 0, 0);
            this.time.delayedCall(500, callback);
        });
        btn.on('pointerover', () => { btn.setBackgroundColor('#534AB7').setColor('#FFFFFF'); });
        btn.on('pointerout',  () => { btn.setBackgroundColor('#3C3489').setColor('#F5F0E8'); });

        this.tweens.add({ targets: btn, alpha: 0.80, duration: 1000, yoyo: true, repeat: -1 });
        return btn;
    }

    _gerarClioPortrait() {
        const tex = this.textures.createCanvas('clio_portrait', 24, 32);
        const ctx = tex.getContext();

        // Aura/manto roxo
        ctx.fillStyle = '#3C3489';
        ctx.beginPath();
        ctx.ellipse(12, 28, 10, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Corpo (manto)
        ctx.fillStyle = '#534AB7';
        ctx.fillRect(4, 14, 16, 18);

        // Detalhes do manto (runa dourada)
        ctx.strokeStyle = '#EF9F27';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(8, 17, 8, 10);
        ctx.beginPath(); ctx.moveTo(12, 17); ctx.lineTo(12, 27); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(8, 22); ctx.lineTo(16, 22); ctx.stroke();

        // Pescoço
        ctx.fillStyle = '#e8d0b0';
        ctx.fillRect(10, 11, 4, 4);

        // Rosto
        ctx.fillStyle = '#f0d8b8';
        ctx.fillRect(6, 4, 12, 10);

        // Cabelo (dourado-branco, Musa da Memória)
        ctx.fillStyle = '#e8d888';
        ctx.fillRect(5, 2, 14, 6);
        ctx.fillRect(4, 5, 3, 8);  // lateral esq
        ctx.fillRect(17, 5, 3, 8); // lateral dir

        // Olhos (violeta, brilhantes)
        ctx.fillStyle = '#7050cc';
        ctx.fillRect(8, 7, 3, 3);
        ctx.fillRect(13, 7, 3, 3);
        // Brilho nos olhos
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(8, 7, 1, 1);
        ctx.fillRect(13, 7, 1, 1);

        // Nariz
        ctx.fillStyle = '#d0a890';
        ctx.fillRect(11, 10, 2, 1);

        // Boca
        ctx.fillStyle = '#c07070';
        ctx.fillRect(9, 12, 6, 1);

        // Coroa/diadema dourado
        ctx.fillStyle = '#EF9F27';
        ctx.fillRect(6, 2, 12, 2);
        ctx.fillRect(7, 0, 2, 3);
        ctx.fillRect(11, 0, 2, 3);
        ctx.fillRect(15, 0, 2, 3);

        // Brilho mágico nos ombros
        ctx.fillStyle = '#7F77DD';
        ctx.globalAlpha = 0.6;
        ctx.fillRect(2, 14, 3, 3);
        ctx.fillRect(19, 14, 3, 3);
        ctx.globalAlpha = 1;

        tex.refresh();
    }
}