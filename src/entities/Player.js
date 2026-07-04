import { NPC } from './NPC.js';
import { rectsOverlap } from '../world/Collision.js';

/**
 * Player — Alex.
 *
 * Spritesheet: Cute Fantasy Free (Player.png — 192x320, 6 col x 10 row de 32px).
 * Rows de caminhada: 0=baixo, 1=esquerda(sheet própria), 2=cima, 3=direita.
 *
 * Movimentação:
 *  - Velocidade normalizada na diagonal.
 *  - Colisão resolvida por eixo (desliza em paredes).
 *  - "Corner assist": ao esbarrar na quina de um obstáculo, o jogador é
 *    deslizado suavemente para contorná-la em vez de travar.
 */
export class Player {

    /** facing → row na spritesheet de caminhada. */
    static DIR_ROW = [0, 2, 1, 1];

    /** Distância máxima (px) do auxílio de quina. */
    static CORNER_ASSIST_RANGE = 5;

    constructor(x, y, config = {}) {
        this.x = x;
        this.y = y;

        // Hitbox (nos pés do personagem)
        this.width  = config.hitboxW || 10;
        this.height = config.hitboxH || 10;

        this.speed  = config.speed || 110;
        this.facing = 0;             // 0=baixo 1=cima 2=esquerda 3=direita

        // Spritesheet
        this.spriteSheet = config.spriteSheet || null;
        this.spriteLeft  = config.spriteLeft  || null;
        this.frameW      = config.frameW      || 32;
        this.frameH      = config.frameH      || 32;
        this.maxFrames   = config.maxFrames   || 6;

        // Animação
        this.animFrame = 0;
        this.animTimer = 0;
        this.animSpeed = config.animSpeed || 0.12;
        this.isMoving  = false;
        this.hasMoved  = false;      // usado pelo tutorial

        this.fallbackColor = config.fallbackColor || '#3a7898';

        this._recalcOffsets();
    }

    _recalcOffsets() {
        this.spriteOffsetX = -(this.frameW - this.width) / 2;
        this.spriteOffsetY = Math.round(-(this.frameH - this.height) * 0.64);
    }

    /**
     * Atualiza input, movimento, colisões e animação.
     * @param {number} dt
     * @param {import('../core/Input.js').Input} input
     * @param {import('../world/Map.js').Map|null} gameMap
     * @param {Array} interactables — para colisão com NPCs
     */
    update(dt, input, gameMap = null, interactables = []) {
        const { dx, dy } = this._readDirection(input);

        this.isMoving = (dx !== 0 || dy !== 0);
        if (this.isMoving) this.hasMoved = true;

        if (this.isMoving) {
            this._move(dx * this.speed * dt, dy * this.speed * dt, gameMap, interactables);
            this._advanceAnimation(dt);
        } else {
            this.animFrame = 0;
            this.animTimer = 0;
        }
    }

    /** Lê o teclado e devolve o vetor de direção normalizado. */
    _readDirection(input) {
        let dx = 0, dy = 0;
        if (input.isDown('ArrowUp')    || input.isDown('KeyW')) { dy = -1; this.facing = 1; }
        if (input.isDown('ArrowDown')  || input.isDown('KeyS')) { dy =  1; this.facing = 0; }
        if (input.isDown('ArrowLeft')  || input.isDown('KeyA')) { dx = -1; this.facing = 2; }
        if (input.isDown('ArrowRight') || input.isDown('KeyD')) { dx =  1; this.facing = 3; }

        // Diagonal não pode ser mais rápida que os eixos
        if (dx !== 0 && dy !== 0) {
            const INV_SQRT2 = 0.7071;
            dx *= INV_SQRT2;
            dy *= INV_SQRT2;
        }
        return { dx, dy };
    }

    /** Move com colisão por eixo + auxílio de quina. */
    _move(mx, my, gameMap, interactables) {
        if (!gameMap) {
            this.x += mx;
            this.y += my;
            return;
        }

        const blockedAt = (x, y) =>
            gameMap.isColliding(x, y, this.width, this.height) ||
            this._collidesWithNPCs(x, y, interactables);

        // Eixo X
        if (mx !== 0) {
            if (!blockedAt(this.x + mx, this.y)) {
                this.x += mx;
            } else if (my === 0) {
                this._cornerAssist(mx, 0, blockedAt);
            }
        }

        // Eixo Y
        if (my !== 0) {
            if (!blockedAt(this.x, this.y + my)) {
                this.y += my;
            } else if (mx === 0) {
                this._cornerAssist(0, my, blockedAt);
            }
        }
    }

    /**
     * Auxílio de quina: se o caminho reto está bloqueado apenas pela
     * borda de um obstáculo, desliza no eixo perpendicular para contorná-lo.
     */
    _cornerAssist(mx, my, blockedAt) {
        const range = Player.CORNER_ASSIST_RANGE;
        const step  = Math.max(Math.abs(mx), Math.abs(my));

        for (let offset = 1; offset <= range; offset++) {
            if (mx !== 0) { // movendo em X: tenta desviar em Y
                if (!blockedAt(this.x + mx, this.y - offset)) { this.y -= step; return; }
                if (!blockedAt(this.x + mx, this.y + offset)) { this.y += step; return; }
            } else {        // movendo em Y: tenta desviar em X
                if (!blockedAt(this.x - offset, this.y + my)) { this.x -= step; return; }
                if (!blockedAt(this.x + offset, this.y + my)) { this.x += step; return; }
            }
        }
    }

    _advanceAnimation(dt) {
        this.animTimer += dt;
        if (this.animTimer >= this.animSpeed) {
            this.animFrame = (this.animFrame + 1) % this.maxFrames;
            this.animTimer = 0;
        }
    }

    /** Colisão física contra NPCs (usa hitbox dos pés de cada um). */
    _collidesWithNPCs(x, y, interactables) {
        const box = { x, y, width: this.width, height: this.height };
        for (const obj of interactables) {
            if (!(obj instanceof NPC)) continue;
            if (rectsOverlap(box, obj.getHitbox())) return true;
        }
        return false;
    }

    /**
     * Caixa de interação projetada na frente do jogador, na direção que
     * ele está encarando (facing). Centralizada no eixo perpendicular ao
     * movimento, para que um NPC alinhado com o jogador seja detectado
     * independente de ligeiras variações de posição — não só quando
     * exatamente ombro-a-ombro com a hitbox.
     */
    getInteractionBox() {
        const size = 20;
        const cx = this.x + this.width  / 2;
        const cy = this.y + this.height / 2;
        switch (this.facing) {
            case 0: return { x: cx - size / 2,      y: this.y + this.height, width: size, height: size }; // baixo
            case 1: return { x: cx - size / 2,      y: this.y - size,        width: size, height: size }; // cima
            case 2: return { x: this.x - size,      y: cy - size / 2,        width: size, height: size }; // esquerda
            default: return { x: this.x + this.width, y: cy - size / 2,      width: size, height: size }; // direita
        }
    }

    /** Empurra o jogador para fora de colisões no spawn. */
    resolveCollision(gameMap) {
        if (!gameMap || !gameMap.isColliding(this.x, this.y, this.width, this.height)) return;

        const STEP = 2, MAX_DIST = 64;
        for (let dist = STEP; dist <= MAX_DIST; dist += STEP) {
            const offsets = [
                { dx: 0, dy: dist }, { dx: 0, dy: -dist },
                { dx: dist, dy: 0 }, { dx: -dist, dy: 0 },
                { dx: dist, dy: dist }, { dx: -dist, dy: dist },
                { dx: dist, dy: -dist }, { dx: -dist, dy: -dist },
            ];
            for (const { dx, dy } of offsets) {
                if (!gameMap.isColliding(this.x + dx, this.y + dy, this.width, this.height)) {
                    this.x += dx;
                    this.y += dy;
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
            let sheet = this.spriteSheet;
            let row   = Player.DIR_ROW[this.facing] || 0;

            // Direção esquerda usa spritesheet dedicada
            if (this.facing === 2 && this.spriteLeft && this.spriteLeft.complete) {
                sheet = this.spriteLeft;
                row   = 1;
            }

            ctx.drawImage(sheet,
                this.animFrame * this.frameW, row * this.frameH, this.frameW, this.frameH,
                drawX, drawY, this.frameW, this.frameH);
            return;
        }

        ctx.fillStyle = this.fallbackColor;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}
