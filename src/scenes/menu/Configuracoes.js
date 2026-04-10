// ─────────────────────────────────────────────────────────────
// Configuracoes.js — Tela de Configurações
// 
// Ajustes de áudio, volume e opções do jogo
// ─────────────────────────────────────────────────────────────

export default class Configuracoes extends Phaser.Scene {
    constructor() { super('Configuracoes'); }

    create() {
        const W = 320;
        const H = 200;
        
        this.cameras.main.setBackgroundColor('#1a0e2e');

        // Carregar configurações salvas
        this.settings = JSON.parse(localStorage.getItem('ecos_brasil_settings')) || {
            musicVolume: 0.7,
            sfxVolume: 0.8,
            textSpeed: 'normal'
        };

        // ════════════════════════════════════════
        // TÍTULO
        // ════════════════════════════════════════
        this.add.text(W / 2, 15, '⚙ CONFIGURAÇÕES', {
            fontFamily: 'monospace',
            fontSize: '12px',
            color: '#EF9F27'
        }).setOrigin(0.5);

        // ════════════════════════════════════════
        // VOLUME DA MÚSICA
        // ════════════════════════════════════════
        this.add.text(W / 2, 40, '🎵 Música:', {
            fontFamily: 'monospace',
            fontSize: '7px',
            color: '#F5F0E8'
        }).setOrigin(0.5, 0);

        this.musicSlider = this.createSlider(W / 2, 52, this.settings.musicVolume, (value) => {
            this.settings.musicVolume = value;
            this.saveSettings();
            if (this.soundManager) {
                this.soundManager.setMusicVolume(value);
            }
        });

        // ════════════════════════════════════════
        // VOLUME DOS EFEITOS
        // ════════════════════════════════════════
        this.add.text(W / 2, 70, '🔊 Efeitos:', {
            fontFamily: 'monospace',
            fontSize: '7px',
            color: '#F5F0E8'
        }).setOrigin(0.5, 0);

        this.sfxSlider = this.createSlider(W / 2, 82, this.settings.sfxVolume, (value) => {
            this.settings.sfxVolume = value;
            this.saveSettings();
            if (this.soundManager) {
                this.soundManager.setSFXVolume(value);
            }
        });

        // ════════════════════════════════════════
        // VELOCIDADE DO TEXTO
        // ════════════════════════════════════════
        this.add.text(W / 2, 100, '💬 Texto:', {
            fontFamily: 'monospace',
            fontSize: '7px',
            color: '#F5F0E8'
        }).setOrigin(0.5, 0);

        const textSpeeds = ['lento', 'normal', 'rápido'];
        let currentSpeedIdx = textSpeeds.indexOf(this.settings.textSpeed);
        if (currentSpeedIdx === -1) currentSpeedIdx = 1;

        this.speedBtn = this.add.text(W / 2, 112, `→ ${textSpeeds[currentSpeedIdx].toUpperCase()} ←`, {
            fontFamily: 'monospace',
            fontSize: '7px',
            color: '#EF9F27',
            backgroundColor: '#3C3489',
            padding: { x: 8, y: 3 }
        }).setOrigin(0.5).setInteractive();

        this.speedBtn.on('pointerdown', () => {
            currentSpeedIdx = (currentSpeedIdx + 1) % textSpeeds.length;
            this.settings.textSpeed = textSpeeds[currentSpeedIdx];
            this.speedBtn.setText(`→ ${textSpeeds[currentSpeedIdx].toUpperCase()} ←`);
            this.saveSettings();
        });

        this.speedBtn.on('pointerover', () => {
            this.speedBtn.setBackgroundColor('#534AB7');
        });

        this.speedBtn.on('pointerout', () => {
            this.speedBtn.setBackgroundColor('#3C3489');
        });

        // ════════════════════════════════════════
        // BOTÃO RESETAR PROGRESSO
        // ════════════════════════════════════════
        const btnReset = this.add.text(W / 2, 140, '⚠ RESETAR PROGRESSO', {
            fontFamily: 'monospace',
            fontSize: '7px',
            color: '#c0392b',
            backgroundColor: '#1a0e2e',
            padding: { x: 8, y: 3 }
        }).setOrigin(0.5).setInteractive();

        btnReset.on('pointerdown', () => {
            localStorage.removeItem('ecos_brasil_save');
            this.add.text(W / 2, 155, 'Progresso resetado!', {
                fontFamily: 'monospace',
                fontSize: '5px',
                color: '#EF9F27'
            }).setOrigin(0.5);
        });

        btnReset.on('pointerover', () => {
            btnReset.setBackgroundColor('#3C3489');
        });

        btnReset.on('pointerout', () => {
            btnReset.setBackgroundColor('#1a0e2e');
        });

        // ════════════════════════════════════════
        // BOTÃO VOLTAR
        // ════════════════════════════════════════
        const btnVoltar = this.add.text(W / 2, H - 18, '← VOLTAR AO MENU', {
            fontFamily: 'monospace',
            fontSize: '9px',
            color: '#F5F0E8',
            backgroundColor: '#3C3489',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setInteractive();

        btnVoltar.on('pointerdown', () => {
            this.cameras.main.fadeOut(400, 0, 0, 0);
            this.time.delayedCall(400, () => {
                this.scene.start('MenuPrincipal');
            });
        });

        btnVoltar.on('pointerover', () => {
            btnVoltar.setBackgroundColor('#534AB7');
        });

        btnVoltar.on('pointerout', () => {
            btnVoltar.setBackgroundColor('#3C3489');
        });

        // Fade in
        this.cameras.main.fadeIn(600);
    }

    createSlider(x, y, initialValue, onChange) {
        const W = 320;
        const sliderWidth = 80;
        const sliderHeight = 10;
        
        // Fundo do slider
        const bg = this.add.rectangle(x - sliderWidth / 2, y, sliderWidth, sliderHeight, 0x3C3489)
            .setOrigin(0, 0.5);
        
        // Barra de progresso
        const bar = this.add.rectangle(x - sliderWidth / 2, y, sliderWidth * initialValue, sliderHeight, 0xEF9F27)
            .setOrigin(0, 0.5);
        
        // Indicador (knob)
        const knob = this.add.circle(x - sliderWidth / 2 + sliderWidth * initialValue, y, 5, 0xF5F0E8)
            .setInteractive({ draggable: true });
        
        let isDragging = false;
        
        knob.on('drag', (pointer, dragX) => {
            isDragging = true;
            const newX = Math.max(x - sliderWidth / 2, Math.min(x + sliderWidth / 2, dragX));
            knob.x = newX;
            const value = (newX - (x - sliderWidth / 2)) / sliderWidth;
            bar.width = sliderWidth * value;
            onChange(Math.round(value * 10) / 10);
        });
        
        knob.on('dragend', () => {
            isDragging = false;
        });
        
        // Clique no slider para mover diretamente
        this.input.on('pointerdown', (pointer) => {
            if (!isDragging && pointer.y > y - 10 && pointer.y < y + 10 &&
                pointer.x > x - sliderWidth / 2 && pointer.x < x + sliderWidth / 2) {
                const newX = pointer.x;
                knob.x = newX;
                const value = (newX - (x - sliderWidth / 2)) / sliderWidth;
                bar.width = sliderWidth * value;
                onChange(Math.round(value * 10) / 10);
            }
        });
        
        return { bg, bar, knob };
    }

    saveSettings() {
        localStorage.setItem('ecos_brasil_settings', JSON.stringify(this.settings));
    }
}
