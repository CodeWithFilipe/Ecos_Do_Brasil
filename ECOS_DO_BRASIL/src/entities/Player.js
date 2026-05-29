/**
 * Player — Alex
 *
 * Suporta dois modos de sprite:
 *  1. spriteSheet único (spritesheet convencional, linha = direção, coluna = frame)
 *  2. sprites direcionais separados (um PNG por direção: down, up, left, right)
 *
 * Config:
 *  - spriteSheet  : HTMLImageElement  — spritesheet único (modo 1)
 *  - sprites      : { down, up, left, right } — imagens por direção (modo 2)
 *  - frameW / frameH : tamanho de cada frame na imagem (padrão: 48x64)
 *  - maxFrames    : frames de animação por direção (padrão: 1)
 *  - hitboxW / hitboxH : hitbox de colisão (padrão: 12x12)
 *  - speed        : pixels/segundo (padrão: 80)
 *  - animSpeed    : segundos por frame (padrão: 0.15)
 *  - fallbackColor: cor do retângulo fallback
 */
export class Player {
    constructor(x, y, config = {}) {
        this.x = x;
        this.y = y;

        // Hitbox de colisão
        this.width  = config.hitboxW || 12;
        this.height = config.hitboxH || 12;

        this.speed = config.speed || 80;

        // Direção: 0=baixo  1=cima  2=esquerda  3=direita
        this.facing = 0;

        // ── Modo 1: spritesheet único ──────────────────
        this.spriteSheet = config.spriteSheet || null;

        // ── Modo 2: imagens separadas por direção ──────
        // { down, up, left, right } — cada uma pode ter múltiplos frames em linha
        this.sprites = config.sprites || null;   // { down:img, up:img, left:img, right:img }

        // Dimensões do frame visual
        this.frameW = config.frameW || 48;
        this.frameH = config.frameH || 64;
        this.maxFrames = config.maxFrames || 1;

        // Animação
        this.animFrame = 0;
        this.animTimer = 0;
        this.animSpeed = config.animSpeed || 0.15;
        this.isMoving  = false;

        this.fallbackColor = config.fallbackColor || '#3a7898';

        // Offset do sprite sobre a hitbox:
        // o sprite é centralizado horizontalmente e alinhado pelos pés
        this._recalcOffsets();
    }

    _recalcOffsets() {
        this.spriteOffsetX = -(this.frameW - this.width)  / 2;
        this.spriteOffsetY = -(this.frameH - this.height);
    }

    /** Troca spritesheet em runtime (modo 1). */
    setSpriteSheet(img, config = {}) {
        this.spriteSheet = img;
        this.sprites = null;
        if (config.frameW) this.frameW = config.frameW;
        if (config.frameH) this.frameH = config.frameH;
        if (config.maxFrames) this.maxFrames = config.maxFrames;
        this._recalcOffsets();
    }

    /** Troca sprites direcionais em runtime (modo 2). */
    setDirectionalSprites(sprites, config = {}) {
        this.sprites = sprites;
        this.spriteSheet = null;
        if (config.frameW) this.frameW = config.frameW;
        if (config.frameH) this.frameH = config.frameH;
        if (config.maxFrames) this.maxFrames = config.maxFrames;
        this._recalcOffsets();
    }

    /**
     * Atualiza movimento com colisão separada por eixo.
     * @param {number} dt
     * @param {Input} input
     * @param {Map|null} gameMap
     */
    update(dt, input, gameMap = null) {
        let dx = 0, dy = 0;

        if (input.isDown('ArrowUp')    || input.isDown('KeyW')) { dy = -1; this.facing = 1; }
        if (input.isDown('ArrowDown')  || input.isDown('KeyS')) { dy =  1; this.facing = 0; }
        if (input.isDown('ArrowLeft')  || input.isDown('KeyA')) { dx = -1; this.facing = 2; }
        if (input.isDown('ArrowRight') || input.isDown('KeyD')) { dx =  1; this.facing = 3; }

        // Normalizar diagonal
        if (dx !== 0 && dy !== 0) { dx *= 0.7071; dy *= 0.7071; }

        this.isMoving = (dx !== 0 || dy !== 0);

        if (this.isMoving) {
            const mx = dx * this.speed * dt;
            const my = dy * this.speed * dt;

            if (gameMap) {
                const nx = this.x + mx;
                if (!gameMap.isColliding(nx, this.y, this.width, this.height)) this.x = nx;
                const ny = this.y + my;
                if (!gameMap.isColliding(this.x, ny, this.width, this.height)) this.y = ny;
            } else {
                this.x += mx;
                this.y += my;
            }

            this.animTimer += dt;
            if (this.animTimer >= this.animSpeed) {
                this.animFrame = (this.animFrame + 1) % this.maxFrames;
                this.animTimer = 0;
            }
        } else {
            this.animFrame = 0;
            this.animTimer = 0;
        }
    }

    /** Hitbox de interação na frente do personagem. */
    getInteractionBox() {
        const size = 16;
        let ix = this.x, iy = this.y;
        if (this.facing === 0) iy += this.height;
        if (this.facing === 1) iy -= size;
        if (this.facing === 2) ix -= size;
        if (this.facing === 3) ix += this.width;
        return { x: ix, y: iy, width: size, height: size };
    }

    draw(ctx) {
        const dx = this.x + this.spriteOffsetX;
        const dy = this.y + this.spriteOffsetY;

        // ── Modo 2: sprites direcionais ───────────────
        if (this.sprites) {
            const dirKey = ['down', 'up', 'left', 'right'][this.facing];
            const img = this.sprites[dirKey];
            if (img && img.complete && img.naturalWidth > 0) {
                // Cada PNG pode ter múltiplos frames em linha (idle só tem 1)
                const sx = this.animFrame * this.frameW;
                ctx.drawImage(img, sx, 0, this.frameW, this.frameH,
                              dx, dy, this.frameW, this.frameH);
                return;
            }
        }

        // ── Modo 1: spritesheet único ─────────────────
        if (this.spriteSheet && this.spriteSheet.complete && this.spriteSheet.naturalWidth > 0) {
            const sx = this.animFrame * this.frameW;
            const sy = this.facing    * this.frameH;
            ctx.drawImage(this.spriteSheet, sx, sy, this.frameW, this.frameH,
                          dx, dy, this.frameW, this.frameH);
            return;
        }

        // ── Fallback: retângulo colorido ───────────────
        ctx.fillStyle = this.fallbackColor;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}