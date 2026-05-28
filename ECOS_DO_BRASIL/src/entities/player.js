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
        
        // O tamanho da tesoura que você calibrou
        this.frameW = 32; 
        this.frameH = 32; 
        this.maxFrames = 4; 
        
        // =========================================================
        // 👕 MATRIZ DO PERSONAGEM COMPLETO (SISTEMA DE ROUPAS) 👕
        // =========================================================
        // Geralmente, cada peça de roupa ocupa 4 linhas na imagem 
        // (uma para cada direção: Baixo, Cima, Esquerda, Direita).
        // Aqui você coloca a LINHA INICIAL de cada peça de roupa.
        this.layers = [
            0,  // 1ª Camada: O Corpo base (começa na linha 0)
            
            // Para adicionar roupas, basta descobrir em qual linha elas começam 
            // na sua imagem original e tirar as duas barras (//) abaixo:
            
            // 4,  // 2ª Camada: A calça ou camisa (ex: começa na linha 4)
            // 8   // 3ª Camada: O cabelo ou chapéu (ex: começa na linha 8)
        ];
        
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

        // O SEGREDO ESTÁ AQUI: Um laço de repetição (for)
        // Ele vai desenhar o corpo, depois a roupa, depois o cabelo... 
        // empilhando todos exatamente no mesmo lugar.
        for (let i = 0; i < this.layers.length; i++) {
            
            // A posição Y da tesoura = (Direção que o boneco olha) + (Linha da Peça de Roupa)
            let sy = (this.facing + this.layers[i]) * this.frameH;

            ctx.drawImage(
                this.spriteSheet, 
                sx, sy, this.frameW, this.frameH, 
                this.x, this.y, this.width, this.height 
            );
        }
    }
}