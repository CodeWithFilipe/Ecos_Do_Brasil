export class Player {
    constructor(x, y, spriteSheet) {
        this.x = x;
        this.y = y;
        
        // Tamanho do personagem na tela
        this.width = 32; 
        this.height = 32; 
        this.speed = 90; 
        
        // Direções: 0 (Baixo), 1 (Cima), 2 (Esquerda), 3 (Direita)
        this.facing = 0; 
        this.interactionRadius = 18; 
        
        this.spriteSheet = spriteSheet;
        
        // Configuração da tesoura calibrada por você
        this.frameW = 32; 
        this.frameH = 32; 
        this.maxFrames = 4; 
        
        // =========================================================
        // 🛠️ MODO DEBUG DESLIGADO 🛠️
        // =========================================================
        // O valor agora é "false". As linhas de depuração sumirão da tela.
        this.debugMode = false;
        
        // Controle de Animação
        this.animFrame = 0;
        this.animTimer = 0;
        this.animSpeed = 0.15; 
        this.isMoving = false;
    }

    update(dt, input) {
        let dx = 0;
        let dy = 0;

        if (input.isDown('ArrowUp') || input.isDown('KeyW')) { dy = -1; this.facing = 1; }
        if (input.isDown('ArrowDown') || input.isDown('KeyS')) { dy = 1; this.facing = 0; }
        if (input.isDown('ArrowLeft') || input.isDown('KeyA')) { dx = -1; this.facing = 2; }
        if (input.isDown('ArrowRight') || input.isDown('KeyD')) { dx = 1; this.facing = 3; }

        if (dx !== 0 && dy !== 0) {
            dx *= 0.7071;
            dy *= 0.7071;
        }

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
        let ix = this.x;
        let iy = this.y;
        let size = 16;

        if (this.facing === 0) iy += this.height; 
        if (this.facing === 1) iy -= size;        
        if (this.facing === 2) ix -= size;        
        if (this.facing === 3) ix += this.width;  

        return { x: ix, y: iy, width: size, height: size };
    }

    draw(ctx) {
        if (!this.spriteSheet.complete) {
            ctx.fillStyle = '#3a7898'; 
            ctx.fillRect(this.x, this.y, this.width, this.height);
            return;
        }

        let sx = this.animFrame * this.frameW;
        let sy = this.facing * this.frameH;

        ctx.drawImage(
            this.spriteSheet, 
            sx, sy, this.frameW, this.frameH, 
            this.x, this.y, this.width, this.height 
        );

        if (this.debugMode) {
            ctx.drawImage(this.spriteSheet, 0, 0);
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
            ctx.lineWidth = 1;
            for (let c = 0; c <= this.spriteSheet.width; c += this.frameW) {
                ctx.beginPath(); ctx.moveTo(c, 0); ctx.lineTo(c, this.spriteSheet.height); ctx.stroke();
            }
            for (let r = 0; r <= this.spriteSheet.height; r += this.frameH) {
                ctx.beginPath(); ctx.moveTo(0, r); ctx.lineTo(this.spriteSheet.width, r); ctx.stroke();
            }
            ctx.strokeStyle = 'rgba(0, 255, 0, 1)';
            ctx.lineWidth = 2;
            ctx.strokeRect(sx, sy, this.frameW, this.frameH);
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
    }
}