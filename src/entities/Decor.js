/**
 * Decor — Elementos estáticos do cenário (Bancos, mesas, estantes, etc).
 * Extrai recortes do spritesheet (ex: GothicFurnitureSprites48x48.png).
 */
export class Decor {
    constructor(x, y, config = {}) {
        this.x = x;
        this.y = y;
        this.width = config.width || 32;
        this.height = config.height || 32;
        
        // Visual
        this.spriteSheet = config.spriteSheet || null;
        this.sx = config.sx || 0;
        this.sy = config.sy || 0;
        this.sw = config.sw || this.width;
        this.sh = config.sh || this.height;
    }

    // Não precisa de update para estáticos puros
    update(dt) {}

    draw(ctx) {
        if (this.spriteSheet && this.spriteSheet.complete) {
            ctx.drawImage(this.spriteSheet, this.sx, this.sy, this.sw, this.sh, this.x, this.y, this.width, this.height);
        } else {
            // Fallback (retângulo pontilhado se a imagem falhar, para debugar)
            ctx.strokeStyle = 'rgba(150, 100, 50, 0.5)';
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
    }
}
