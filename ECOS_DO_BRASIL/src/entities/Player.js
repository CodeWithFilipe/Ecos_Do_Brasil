/**
 * Player — Alex
 *
 * Spritesheet: Cute Fantasy Free (Player.png — 192×320)
 * Layout: 6 colunas × 10 linhas de 32×32
 *
 * Movimentação (Walk - 6 frames):
 *   Row 0: Down (frente)
 *   Row 1: Right
 *   Row 2: Up (costas)
 *   Row 3: Left
 *
 * Parado (Idle - 4 frames):
 *   Row 4: Down
 *   Row 5: Right
 *   Row 6: Up
 *   Row 7: Left
 */
export class Player {

    // Mapeamento: facing -> [down(0), up(1), left(2), right(3)]
    static DIR_WALK_ROW = [0, 2, 3, 1];
    static DIR_IDLE_ROW = [4, 6, 7, 5];

    constructor(x, y, config = {}) {
        this.x = x;
        this.y = y;

        // Hitbox dimensionada para cobrir o corpo do personagem ("encima do personagem")
        this.width  = config.hitboxW || 16;
        this.height = config.hitboxH || 24;

        this.speed = config.speed || 100;

        // Direção: 0=baixo 1=cima 2=esquerda 3=direita
        this.facing = 0;

        // Spritesheet
        this.spriteSheet = config.spriteSheet || null;
        this.frameW    = config.frameW    || 32;
        this.frameH    = config.frameH    || 32;
        this.maxFramesWalk = 6;
        this.maxFramesIdle = 4;

        // Animação
        this.animFrame = 0;
        this.animTimer = 0;
        this.animSpeed = config.animSpeed || 0.12;
        this.isMoving  = false;
        this.hasMoved  = false;

        this.fallbackColor = config.fallbackColor || '#3a7898';

        this._recalcOffsets();
    }

    _recalcOffsets() {
        // Centraliza o sprite na hitbox
        this.spriteOffsetX = -(this.frameW - this.width)  / 2;
        this.spriteOffsetY = -(this.frameH - this.height) / 2;
    }

    setSpriteSheet(img, config = {}) {
        this.spriteSheet = img;
        if (config.frameW) this.frameW = config.frameW;
        if (config.frameH) this.frameH = config.frameH;
        this._recalcOffsets();
    }

    update(dt, input, gameMap = null) {
        let dx = 0, dy = 0;

        if (input.isDown('ArrowUp')    || input.isDown('KeyW')) { dy = -1; this.facing = 1; }
        if (input.isDown('ArrowDown')  || input.isDown('KeyS')) { dy =  1; this.facing = 0; }
        if (input.isDown('ArrowLeft')  || input.isDown('KeyA')) { dx = -1; this.facing = 2; }
        if (input.isDown('ArrowRight') || input.isDown('KeyD')) { dx =  1; this.facing = 3; }

        if (dx !== 0 && dy !== 0) { dx *= 0.7071; dy *= 0.7071; }

        const wasMoving = this.isMoving;
        this.isMoving = (dx !== 0 || dy !== 0);
        
        if (this.isMoving && !wasMoving) {
            this.animFrame = 0; // Reseta frame ao começar a andar
            this.hasMoved = true;
        } else if (!this.isMoving && wasMoving) {
            this.animFrame = 0; // Reseta frame ao parar (inicia idle)
        }

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
                this.animFrame = (this.animFrame + 1) % this.maxFramesWalk;
                this.animTimer = 0;
            }
        } else {
            // Animação Idle
            this.animTimer += dt;
            if (this.animTimer >= this.animSpeed * 2) { // Idle é mais lento
                this.animFrame = (this.animFrame + 1) % this.maxFramesIdle;
                this.animTimer = 0;
            }
        }
    }

    getInteractionBox() {
        const size = 16;
        let ix = this.x, iy = this.y;
        if (this.facing === 0) iy += this.height; // baixo
        if (this.facing === 1) iy -= size;        // cima
        if (this.facing === 2) ix -= size;        // esquerda
        if (this.facing === 3) ix += this.width;  // direita
        return { x: ix, y: iy, width: size, height: size };
    }

    draw(ctx) {
        const drawX = this.x + this.spriteOffsetX;
        const drawY = this.y + this.spriteOffsetY;

        if (this.spriteSheet && this.spriteSheet.complete && this.spriteSheet.naturalWidth > 0) {
            const row = this.isMoving ? Player.DIR_WALK_ROW[this.facing] : Player.DIR_IDLE_ROW[this.facing];
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