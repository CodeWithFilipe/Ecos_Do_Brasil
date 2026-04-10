// ─────────────────────────────────────────────────────────────
// MenuPrincipal.js — Menu Principal do Ecos do Brasil
// 
// Opções:
//   ▶ Nova Jornada
//   ▶ Continuar (se houver save)
//   ▶ História
//   ▶ Configurações
//   ▶ Créditos
// ─────────────────────────────────────────────────────────────

export default class MenuPrincipal extends Phaser.Scene {
    constructor() { super('MenuPrincipal'); }

    create() {
        const W = 320;
        const H = 200;
        
        this.cameras.main.setBackgroundColor('#050310');
        
        // Verificar se existe save
        const saveData = localStorage.getItem('ecos_brasil_save');
        this.hasSave = !!saveData;

        // ════════════════════════════════════════
        // FUNDO ESTRELADO
        // ════════════════════════════════════════
        this.stars = [];
        for (let i = 0; i < 90; i++) {
            const x = Phaser.Math.Between(0, W);
            const y = Phaser.Math.Between(0, H);
            const size = Math.random() < 0.15 ? 1 : 0;
            const star = this.add.rectangle(x, y, size + 1, size + 1, 0xffffff, Math.random() * 0.6 + 0.15);
            this.stars.push({ rect: star, twinkle: Math.random() * 1000 });
        }

        // Animação de twinkling das estrelas
        this.time.addEvent({
            delay: 100,
            callback: () => {
                this.stars.forEach((s, idx) => {
                    if (idx % 5 === 0) {
                        s.rect.alpha = Math.random() * 0.6 + 0.15;
                    }
                });
            },
            loop: true
        });

        // ════════════════════════════════════════
        // NÉVOA DE FUNDO (tema brasileiro)
        // ════════════════════════════════════════
        this.fogLayers = [];
        for (let i = 0; i < 3; i++) {
            const fog = this.add.graphics();
            fog.fillStyle(0x3C3489, 0.05 + i * 0.02);
            fog.fillRect(0, i * 70, W, 55);
            this.fogLayers.push(fog);
            
            this.tweens.add({
                targets: fog,
                x: i % 2 === 0 ? 5 : -5,
                duration: 4000 + i * 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // ════════════════════════════════════════
        // TÍTULO PRINCIPAL
        // ════════════════════════════════════════
        this.add.text(W / 2, 35, 'ECOS DO BRASIL', {
            fontFamily: 'monospace',
            fontSize: '18px',
            color: '#EF9F27',
            stroke: '#6B4A00',
            strokeThickness: 3
        }).setOrigin(0.5);

        this.add.text(W / 2, 56, 'O Guardião da Memória', {
            fontFamily: 'monospace',
            fontSize: '9px',
            color: '#7F77DD'
        }).setOrigin(0.5);

        this.add.text(W / 2, 72, '~ A Névoa do Esquecimento avança ~', {
            fontFamily: 'monospace',
            fontSize: '6px',
            color: '#534AB7'
        }).setOrigin(0.5);

        // ════════════════════════════════════════
        // CLIO (Guardiã da Memória)
        // ════════════════════════════════════════
        const clioX = W / 2;
        const clioY = 130;
        
        // Aura de Clio
        const aura = this.add.graphics().setDepth(4);
        aura.lineStyle(1, 0x7F77DD, 0.3);
        aura.strokeCircle(clioX, clioY, 22);
        
        this.tweens.add({
            targets: aura,
            alpha: 0.05,
            duration: 1800,
            yoyo: true,
            repeat: -1
        });

        // Imagem de Clio (usa textura gerada ou placeholder)
        const clioImg = this.add.image(clioX, clioY, 'clio_portrait').setScale(2).setDepth(5);
        
        this.tweens.add({
            targets: clioImg,
            y: clioY - 3,
            duration: 2200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // ════════════════════════════════════════
        // BOTÕES DO MENU
        // ════════════════════════════════════════
        let buttonY = this.hasSave ? 160 : 165;
        const buttonSpacing = 13;

        // Botão: Nova Jornada
        const btnNew = this.createMenuButton(
            W / 2, 
            buttonY, 
            '▶  NOVA JORNADA',
            () => {
                localStorage.removeItem('ecos_brasil_save');
                this.startGame(null);
            }
        );
        buttonY += buttonSpacing;

        // Botão: Continuar (apenas se houver save)
        if (this.hasSave) {
            try {
                const inv = JSON.parse(saveData);
                const fragments = inv.fragments || 0;
                const btnContinue = this.createMenuButton(
                    W / 2,
                    buttonY,
                    `▷  CONTINUAR  (✦ ${fragments}/4)`,
                    () => {
                        this.startGame(inv);
                    }
                );
                buttonY += buttonSpacing;
            } catch (e) {
                this.hasSave = false;
            }
        }

        // Botão: História
        const btnHistoria = this.createMenuButton(
            W / 2,
            buttonY,
            '📖  HISTÓRIA',
            () => {
                this.scene.start('Historia');
            }
        );
        buttonY += buttonSpacing;

        // Botão: Configurações
        const btnConfig = this.createMenuButton(
            W / 2,
            buttonY,
            '⚙  CONFIGURAÇÕES',
            () => {
                this.scene.start('Configuracoes');
            }
        );
        buttonY += buttonSpacing;

        // Botão: Créditos
        const btnCredits = this.createMenuButton(
            W / 2,
            buttonY,
            '★  CRÉDITOS',
            () => {
                this.scene.start('Creditos');
            }
        );

        // ════════════════════════════════════════
        // RODAPÉ INSTITUCIONAL
        // ════════════════════════════════════════
        this.add.text(W / 2, H - 10, 'Centro Universitário Católica de SC · 2025', {
            fontFamily: 'monospace',
            fontSize: '5px',
            color: '#3C3489'
        }).setOrigin(0.5);

        // Fade in inicial
        this.cameras.main.fadeIn(800);

        // ════════════════════════════════════════
        // ÁUDIO DE FUNDO (SAMBA-CHORO AMBIENTE)
        // ════════════════════════════════════════
        if (!this.soundManager) {
            this.soundManager = this.scene.get('Boot').soundManager;
        }
        if (this.soundManager && this.soundManager.musicEnabled) {
            this.soundManager.playMenuMusic();
        }
    }

    createMenuButton(x, y, text, callback) {
        const btn = this.add.text(x, y, text, {
            fontFamily: 'monospace',
            fontSize: '9px',
            color: '#F5F0E8',
            backgroundColor: '#3C3489',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setInteractive();

        btn.on('pointerdown', () => {
            // Tocar som de clique (som brasileiro: tamborim)
            if (this.soundManager && this.soundManager.sfxEnabled) {
                this.soundManager.playClick();
            }
            this.cameras.main.fadeOut(600, 0, 0, 0);
            this.time.delayedCall(600, callback);
        });

        btn.on('pointerover', () => {
            btn.setBackgroundColor('#534AB7');
            btn.setColor('#FFFFFF');
        });

        btn.on('pointerout', () => {
            btn.setBackgroundColor('#3C3489');
            btn.setColor('#F5F0E8');
        });

        // Animação de pulso suave
        this.tweens.add({
            targets: btn,
            alpha: 0.75,
            duration: 900,
            yoyo: true,
            repeat: -1
        });

        return btn;
    }

    startGame(savedData) {
        if (savedData) {
            // Continuar jogo
            this.scene.start('Hub', { inventory: savedData });
        } else {
            // Nova jornada
            this.scene.start('Prologue', { inventory: null });
        }
    }
}