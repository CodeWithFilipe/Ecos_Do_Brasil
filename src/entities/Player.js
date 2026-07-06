import { NPC } from './NPC.js';
import { rectsOverlap } from '../world/Collision.js';
export class Player {
    static DIR_ROW = [0, 2, 1, 1];
    static CORNER_ASSIST_RANGE = 9;
    constructor(x, y, config = {}) {
        this.x = x;
        this.y = y;
        this.width  = config.hitboxW || 10;
        this.height = config.hitboxH || 10;
        this.speed  = config.speed || 110;
        this.facing = 0;             
        this.spriteSheet = config.spriteSheet || null;
        this.spriteLeft  = config.spriteLeft  || null;
        this.frameW      = config.frameW      || 32;
        this.frameH      = config.frameH      || 32;
        this.maxFrames   = config.maxFrames   || 6;
        this.animFrame = 0;
        this.animTimer = 0;
        this.animSpeed = config.animSpeed || 0.12;
        this.isMoving  = false;
        this.hasMoved  = false;      
        this.fallbackColor = config.fallbackColor || '#3a7898';
        this._recalcOffsets();
    }
    _recalcOffsets() {
        this.spriteOffsetX = -(this.frameW - this.width) / 2;
        this.spriteOffsetY = Math.round(-(this.frameH - this.height) * 0.64);
    }
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
    _readDirection(input) {
        let dx = 0, dy = 0;
        if (input.isDown('ArrowUp')    || input.isDown('KeyW')) { dy = -1; this.facing = 1; }
        if (input.isDown('ArrowDown')  || input.isDown('KeyS')) { dy =  1; this.facing = 0; }
        if (input.isDown('ArrowLeft')  || input.isDown('KeyA')) { dx = -1; this.facing = 2; }
        if (input.isDown('ArrowRight') || input.isDown('KeyD')) { dx =  1; this.facing = 3; }
        if (dx !== 0 && dy !== 0) {
            const INV_SQRT2 = 0.7071;
            dx *= INV_SQRT2;
            dy *= INV_SQRT2;
        }
        return { dx, dy };
    }
    _move(mx, my, gameMap, interactables) {
        if (!gameMap) {
            this.x += mx;
            this.y += my;
            return;
        }
        const blockedAt = (x, y) =>
            gameMap.isColliding(x, y, this.width, this.height) ||
            this._collidesWithNPCs(x, y, interactables);
        if (mx !== 0) {
            if (!blockedAt(this.x + mx, this.y)) {
                this.x += mx;
            } else if (my === 0) {
                this._cornerAssist(mx, 0, blockedAt);
            }
        }
        if (my !== 0) {
            if (!blockedAt(this.x, this.y + my)) {
                this.y += my;
            } else if (mx === 0) {
                this._cornerAssist(0, my, blockedAt);
            }
        }
    }
    _cornerAssist(mx, my, blockedAt) {
        const range = Player.CORNER_ASSIST_RANGE;
        const step  = Math.max(Math.abs(mx), Math.abs(my));
        for (let offset = 1; offset <= range; offset++) {
            if (mx !== 0) { 
                if (!blockedAt(this.x + mx, this.y - offset)) { this.y -= step; return; }
                if (!blockedAt(this.x + mx, this.y + offset)) { this.y += step; return; }
            } else {        
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
    _collidesWithNPCs(x, y, interactables) {
        const box = { x, y, width: this.width, height: this.height };
        for (const obj of interactables) {
            if (!(obj instanceof NPC)) continue;
            if (rectsOverlap(box, obj.getHitbox())) return true;
        }
        return false;
    }
    getInteractionBox() {
        const size = 20;
        const cx = this.x + this.width  / 2;
        const cy = this.y + this.height / 2;
        switch (this.facing) {
            case 0: return { x: cx - size / 2,      y: this.y + this.height, width: size, height: size }; 
            case 1: return { x: cx - size / 2,      y: this.y - size,        width: size, height: size }; 
            case 2: return { x: this.x - size,      y: cy - size / 2,        width: size, height: size }; 
            default: return { x: this.x + this.width, y: cy - size / 2,      width: size, height: size }; 
        }
    }
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