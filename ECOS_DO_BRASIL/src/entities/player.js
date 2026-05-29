export class Player {
    constructor(x, y, spriteSheet) {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 32;
        this.speed = 90;
        
        // 0: Baixo, 1: Cima, 2: Esquerda, 3: Direita
        this.facing = 0; 
        this.interactionRadius = 18; 
        
        this.spriteSheet = spriteSheet;
        this.frameW = 32; 
        this.frameH = 32; 
        this.maxFrames = 4; 
        
        this.animFrame = 0;
        this.animTimer = 0;
        this.animSpeed = 0.15; 
        this.isMoving = false;
    }

    update(dt, input) {
        let dx = 0; let dy = 0;

        if (input.isDown('ArrowUp') || input.isDown('KeyW')) { dy = -1; this.facing = 1; }
        if (input.isDown('ArrowDown') || input.isDown('KeyS')) { dy = 1; this.facing = 0; }
        if (input.isDown('ArrowLeft') || input.isDown('KeyA')) { dx = -1; this.facing = 2; }
        if (input.isDown('ArrowRight') || input.isDown('KeyD')) { dx = 1; this.facing = 3; }

        if (dx !== 0 && dy !== 0) { dx *= 0.7071; dy *= 0.7071; }

        this.x += dx * this.speed * dt;
        this.y += dy * this.speed * dt;
        this.isMoving = (dx !== 0 || dy !== 0);

        if (this.isMoving) {
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
        let ix = this.x; let iy = this.y; let size = 16;
        if (this.facing === 0) iy += this.height;
        if (this.facing === 1) iy -= size;
        if (this.facing === 2) ix -= size;
        if (this.facing === 3) ix += this.width;
        return { x: ix, y: iy, width: size, height: size };
    }

    draw(ctx) {
        if (!this.spriteSheet || !this.spriteSheet.complete) {
            ctx.fillStyle = '#3a7898';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            return;
        }
        let sx = this.animFrame * this.frameW;
        let sy = this.facing * this.frameH;
        ctx.drawImage(this.spriteSheet, sx, sy, this.frameW, this.frameH, this.x, this.y, this.width, this.height);
    }
}