/**
 * Player — Alex
 *
 * Spritesheet: Cute Fantasy Free (Player.png — 192×320)
 * Layout: 6 colunas × 10 linhas de 32×32
 *
 *   Row 0: Walk Down  (6 frames)   facing=0
 *   Row 1: Walk Up    (6 frames)   facing=1
 *   Row 2: Walk Right (6 frames)   facing=3
 *   Row 3: Walk Left  (6 frames)   facing=2
 *   Row 4-7: Idle variants
 *   Row 8-9: Especiais
 */
export class Player {

    // facing → row na spritesheet
    //   0=down→row0, 1=up→row1, 2=left→row3, 3=right→row2
    static DIR_ROW = [0, 1, 3, 2];

    constructor(x, y, config = {}) {
        this.x = x;
        this.y = y;

        // Hitbox (caixa nos pés)
        this.width  = config.hitboxW || 10;
        this.height = config.hitboxH || 10;

        this.speed = config.speed || 90;

        // Direção: 0=baixo 1=cima 2=esquerda 3=direita
        this.facing = 0;

        // Spritesheet
        this.spriteSheet = config.spriteSheet || null;
        this.frameW    = config.frameW    || 32;
        this.frameH    = config.frameH    || 32;
        this.maxFrames = config.maxFrames || 6;

        // Animação
        this.animFrame = 0;
        this.animTimer = 0;
        this.animSpeed = config.animSpeed || 0.12;
        this.isMoving  = false;
        this.hasMoved  = false;   // flag para tutorial

        this.fallbackColor = config.fallbackColor || '#3a7898';

        this._recalcOffsets();
    }

    _recalcOffsets() {
        this.spriteOffsetX = -(this.frameW - this.width)  / 2;
        this.spriteOffsetY = -(this.frameH - this.height);
    }

    setSpriteSheet(img, config = {}) {
        this.spriteSheet = img;
        if (config.frameW)    this.frameW    = config.frameW;
        if (config.frameH)    this.frameH    = config.frameH;
        if (config.maxFrames) this.maxFrames = config.maxFrames;
        this._recalcOffsets();
    }

    update(dt, input, gameMap = null) {
        let dx = 0, dy = 0;

        if (input.isDown('ArrowUp')    || input.isDown('KeyW')) { dy = -1; this.facing = 1; }
        if (input.isDown('ArrowDown')  || input.isDown('KeyS')) { dy =  1; this.facing = 0; }
        if (input.isDown('ArrowLeft')  || input.isDown('KeyA')) { dx = -1; this.facing = 2; }
        if (input.isDown('ArrowRight') || input.isDown('KeyD')) { dx =  1; this.facing = 3; }

        if (dx !== 0 && dy !== 0) { dx *= 0.7071; dy *= 0.7071; }

        this.isMoving = (dx !== 0 || dy !== 0);
        if (this.isMoving) this.hasMoved = true;

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

    getInteractionBox() {
        const size = 14;
        let ix = this.x, iy = this.y;
        if (this.facing === 0) iy += this.height;
        if (this.facing === 1) iy -= size;
        if (this.facing === 2) ix -= size;
        if (this.facing === 3) ix += this.width;
        return { x: ix, y: iy, width: size, height: size };
    }

    draw(ctx) {
        const drawX = this.x + this.spriteOffsetX;
        const drawY = this.y + this.spriteOffsetY;

        if (this.spriteSheet && this.spriteSheet.complete && this.spriteSheet.naturalWidth > 0) {
            const row = Player.DIR_ROW[this.facing] || 0;
            const sx = this.animFrame * this.frameW;
            const sy = row * this.frameH;

            ctx.drawImage(
                this.spriteSheet,
                sx, sy, this.frameW, this.frameH,
                drawX, drawY, this.frameW, this.frameH
            );
            return;
        }

        ctx.fillStyle = this.fallbackColor;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}