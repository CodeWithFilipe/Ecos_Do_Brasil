export default class DialogueManager {
    constructor(scene) {
        this.scene = scene;
        this.active = false;
        this.queue = [];
        this.onEnd = null;
        
        // UI do Diálogo (fixo na tela)
        this.container = scene.add.container(10, 140).setDepth(100).setScrollFactor(0).setVisible(false);
        
        // Fundo gerado dinamicamente
        const bg = scene.add.rectangle(0, 0, 300, 50, 0x1a0e2e, 0.95).setOrigin(0);
        bg.setStrokeStyle(2, 0xEF9F27);
        
        this.speakerText = scene.add.text(10, 5, '', { fontSize: '8px', color: '#EF9F27', fontFamily: 'monospace' }).setOrigin(0);
        this.bodyText = scene.add.text(10, 18, '', { fontSize: '7px', color: '#F5F0E8', fontFamily: 'monospace', wordWrap: { width: 280 } }).setOrigin(0);
        this.hintText = scene.add.text(285, 38, '▼', { fontSize: '8px', color: '#EF9F27', fontFamily: 'monospace' });
        
        scene.tweens.add({ targets: this.hintText, alpha: 0.2, duration: 400, yoyo: true, repeat: -1 });
        this.container.add([bg, this.speakerText, this.bodyText, this.hintText]);
    }

    show(lines, onEnd) {
        this.queue = [...lines];
        this.onEnd = onEnd || null;
        this.active = true;
        this.container.setVisible(true);
        this.next();
    }

    next() {
        if (this.queue.length === 0) {
            this.close();
            return;
        }
        const line = this.queue.shift();
        this.speakerText.setText(line.speaker);
        this.bodyText.setText(line.text);
        
        // Cores diferentes para o Diário e para NPCs
        if (line.speaker === 'Diário de Alex') {
            this.speakerText.setColor('#88aaff');
            this.bodyText.setColor('#aaccff');
        } else {
            this.speakerText.setColor('#EF9F27');
            this.bodyText.setColor('#F5F0E8');
        }
    }

    close() {
        this.active = false;
        this.container.setVisible(false);
        if (this.onEnd) this.onEnd();
    }
}