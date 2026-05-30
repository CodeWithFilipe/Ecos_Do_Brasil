/**
 * Player — Alex
 *
 * Spritesheet: Cute Fantasy Free (Player.png — 192×320)
 * Layout: 6 colunas × 10 linhas de 32×32
 *
 * Apenas movimentação (Walk - 6 frames):
 *   Row 0: Down  (frente)   facing=0
 *   Row 1: Right             facing=3
 *   Row 2: Up    (costas)   facing=1
 *   Row 3: Left              facing=2
 *
 * Rows 4-9 contêm idle/ações com armas — NÃO são usadas.
 * Quando parado, mostra frame 0 da row de walk (pose neutra).
 */
export class Player {

    // facing → row na spritesheet (walk)
    //   0=down→row0, 1=up→row2, 2=left→row3, 3=right→row1
    static DIR_ROW = [0, 2, 3, 1];

    constructor(x, y, config = {}) {
        this.x = x;
        this.y = y;

        // Hitbox (caixa de colisão nos pés do personagem)
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
        // Centraliza o sprite horizontalmente na hitbox
        this.spriteOffsetX = -(this.frameW - this.width) / 2;
        // Posiciona a hitbox no centro-inferior do corpo do personagem
        // (nem nos pés, nem na cabeça — no tronco/cintura)
        this.spriteOffsetY = Math.round(-(this.frameH - this.height) * 0.64);
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

        // Normalizar diagonal para não andar mais rápido
        if (dx !== 0 && dy !== 0) { dx *= 0.7071; dy *= 0.7071; }

        this.isMoving = (dx !== 0 || dy !== 0);
        if (this.isMoving) this.hasMoved = true;

        if (this.isMoving) {
            const mx = dx * this.speed * dt;
            const my = dy * this.speed * dt;

            if (gameMap) {
                // Colisão separada por eixo: tenta X, depois Y
                const nx = this.x + mx;
                if (!gameMap.isColliding(nx, this.y, this.width, this.height)) {
                    this.x = nx;
                }
                const ny = this.y + my;
                if (!gameMap.isColliding(this.x, ny, this.width, this.height)) {
                    this.y = ny;
                }
            } else {
                this.x += mx;
                this.y += my;
            }

            // Avançar animação de walk
            this.animTimer += dt;
            if (this.animTimer >= this.animSpeed) {
                this.animFrame = (this.animFrame + 1) % this.maxFrames;
                this.animTimer = 0;
            }
        } else {
            // Parado: frame 0 (pose neutra, sem arma)
            this.animFrame = 0;
            this.animTimer = 0;
        }
    }

    /**
     * Retorna a caixa de interação projetada na frente do jogador.
     */
    getInteractionBox() {
        const size = 14;
        let ix = this.x, iy = this.y;
        if (this.facing === 0) iy += this.height;   // baixo
        if (this.facing === 1) iy -= size;           // cima
        if (this.facing === 2) ix -= size;           // esquerda
        if (this.facing === 3) ix += this.width;     // direita
        return { x: ix, y: iy, width: size, height: size };
    }

    /**
     * Se o jogador nascer dentro de uma colisão, empurra para fora.
     * Chamado uma vez após posicionar o spawn.
     */
    resolveCollision(gameMap) {
        if (!gameMap || !gameMap.isColliding(this.x, this.y, this.width, this.height)) return;

        // Tenta empurrar em várias direções até achar espaço livre
        const step = 2;
        for (let dist = step; dist <= 64; dist += step) {
            // Tentar: baixo, cima, direita, esquerda
            const offsets = [
                { dx: 0, dy:  dist },
                { dx: 0, dy: -dist },
                { dx:  dist, dy: 0 },
                { dx: -dist, dy: 0 },
                { dx:  dist, dy:  dist },
                { dx: -dist, dy:  dist },
                { dx:  dist, dy: -dist },
                { dx: -dist, dy: -dist },
            ];
            for (const { dx, dy } of offsets) {
                const nx = this.x + dx;
                const ny = this.y + dy;
                if (!gameMap.isColliding(nx, ny, this.width, this.height)) {
                    this.x = nx;
                    this.y = ny;
                    console.log(`🔧 Spawn ajustado de (${this.x - dx}, ${this.y - dy}) para (${this.x}, ${this.y})`);
                    return;
                }
            }
        }
        console.warn('⚠️ Não foi possível resolver colisão de spawn!');
    }

    draw(ctx) {
        const drawX = this.x + this.spriteOffsetX;
        const drawY = this.y + this.spriteOffsetY;

        if (this.spriteSheet && this.spriteSheet.complete && this.spriteSheet.naturalWidth > 0) {
            // Usa apenas as rows de walk (0-3), nunca acessa rows 4+ (idle/ataque)
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

        // Fallback sem sprite
        ctx.fillStyle = this.fallbackColor;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}