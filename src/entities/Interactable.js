export class Interactable {
    constructor(x, y, config = {}) {
        this.x = x;
        this.y = y;
        this.width  = config.width  || 16;
        this.height = config.height || 16;
        this.name   = config.name   || 'Objeto';
        this.dialogueLines = config.dialogueLines || [];
        this.onInteractComplete = config.onInteractComplete || null;
        this.canInteract = true;
        this.customDraw = config.customDraw || null;
        this.visible     = config.visible !== undefined ? config.visible : !!config.isItem;
        this.glowEnabled = config.glow === true;
        this.glowTimer   = 0;
        this.glowColor   = config.glowColor || 'rgba(255, 215, 0, 0.4)';
        this.detectPad = config.detectPad || 0;
    }
    update(dt) {
        this.glowTimer += dt;
    }
    getDialogue() {
        return {
            lines:    this.dialogueLines,
            callback: this.onInteractComplete
        };
    }
    getDetectionBox() {
        const p = this.detectPad;
        return {
            x: this.x - p,
            y: this.y - p,
            width:  this.width  + p * 2,
            height: this.height + p * 2,
        };
    }
    draw(ctx) {
        if (this.customDraw) {
            this.customDraw(ctx);
        } else if (window.__ecosDebug && window.__ecosDebug.showInteractables) {
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
            ctx.lineWidth = 1;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        } else if (this.visible && this.glowEnabled) {
            const pulse = Math.sin(this.glowTimer * 3) * 0.2 + 0.35;
            ctx.globalAlpha = pulse;
            ctx.fillStyle = this.glowColor;
            ctx.beginPath();
            ctx.ellipse(
                this.x + this.width / 2,
                this.y + this.height / 2,
                this.width / 2 + 3,
                this.height / 2 + 3,
                0, 0, Math.PI * 2
            );
            ctx.fill();
            ctx.globalAlpha = 1;
            const bounceY = Math.sin(this.glowTimer * 4) * 2;
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('!', this.x + this.width / 2, this.y - 4 + bounceY);
            ctx.textAlign = 'left';
        }
    }
}