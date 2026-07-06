export class Decor {
    constructor(x, y, config = {}) {
        this.x = x;
        this.y = y;
        this.width = config.width || 32;
        this.height = config.height || 32;
        this.spriteSheet = config.spriteSheet || null;
        this.sx = config.sx || 0;
        this.sy = config.sy || 0;
        this.sw = config.sw || this.width;
        this.sh = config.sh || this.height;
    }
    update(dt) {}
    draw(ctx) {
        if (this.spriteSheet && this.spriteSheet.complete) {
            ctx.drawImage(this.spriteSheet, this.sx, this.sy, this.sw, this.sh, this.x, this.y, this.width, this.height);
        } else {
            ctx.strokeStyle = 'rgba(150, 100, 50, 0.5)';
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
    }
}