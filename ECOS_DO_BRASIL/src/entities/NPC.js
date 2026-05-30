/**
 * NPC — Personagem não-jogável.
 *
 * Suporta:
 *  - Spritesheet (se fornecida)
 *  - Fallback visual: silhueta pixelart colorida com nome
 *  - infoData: ao interagir, registra informação no GameState
 *  - hasSpoken: muda diálogo após primeira interação
 */
export class NPC {
    constructor(x, y, config = {}) {
        this.x = x;
        this.y = y;
        this.width  = config.width  || 16;
        this.height = config.height || 24;
        this.name   = config.name   || 'NPC';
        this.color  = config.color  || '#787880';
        this.accentColor = config.accentColor || '#aaa';

        // Sprite (opcional)
        this.spriteSheet = config.spriteSheet || null;
        this.frameW    = config.frameW    || 32;
        this.frameH    = config.frameH    || 32;
        this.facing    = config.facing    || 0;
        this.maxFrames = config.maxFrames || 2;

        // Animação
        this.animFrame = 0;
        this.animTimer = 0;
        this.animSpeed = 0.5;

        // Diálogos
        this.dialogueLines      = config.dialogueLines || [{ speaker: this.name, text: '...' }];
        this.afterDialogueLines = config.afterDialogueLines || null;
        this.onInteractComplete = config.onInteractComplete || null;
        this.hasSpoken          = false;

        // Informação coletável (para Vila Rica)
        this.infoData = config.infoData || null;
    }

    update(dt) {
        this.animTimer += dt;
        if (this.animTimer >= this.animSpeed) {
            this.animFrame = (this.animFrame + 1) % this.maxFrames;
            this.animTimer -= this.animSpeed;
        }
    }

    getDialogue() {
        let lines;
        if (this.hasSpoken && this.afterDialogueLines) {
            lines = this.afterDialogueLines;
        } else {
            lines = this.dialogueLines;
        }

        const callback = () => {
            if (!this.hasSpoken) {
                this.hasSpoken = true;
                if (this.onInteractComplete) this.onInteractComplete();
            }
        };

        return { lines, callback };
    }

    draw(ctx) {
        if (this.spriteSheet && this.spriteSheet.complete) {
            const sx = this.animFrame * this.frameW;
            const sy = this.facing    * this.frameH;
            ctx.drawImage(this.spriteSheet,
                sx, sy, this.frameW, this.frameH,
                this.x, this.y, this.width, this.height);
            this._drawNameTag(ctx);
            return;
        }

        // ── Fallback: silhueta pixelart ──
        this._drawFallbackCharacter(ctx);
        this._drawNameTag(ctx);
    }

    _drawFallbackCharacter(ctx) {
        const cx = this.x + this.width / 2;
        const baseY = this.y + this.height;
        const bob = Math.sin(this.animTimer * 4) * 0.6; // Suave balanço de respiração

        const nameLower = this.name.toLowerCase();
        
        let isFemale = nameLower.includes('professora') || nameLower.includes('bibliotecaria') || 
                       nameLower.includes('baronesa') || nameLower.includes('duquesa') || nameLower.includes('clio');
        let isNoble = nameLower.includes('aristocrata') || nameLower.includes('fazendeiro') || 
                      nameLower.includes('senador') || nameLower.includes('deodoro') || nameLower.includes('negociador');
        let isSoldier = nameLower.includes('guarda') || nameLower.includes('soldado');
        let isMerchant = nameLower.includes('vendedor') || nameLower.includes('ambulante');
        let isSpy = nameLower.includes('espiao');

        // Sombra nos pés
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.beginPath();
        ctx.ellipse(cx, baseY - 1, this.width / 2.2, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        const skinColor = '#e8c89e';

        // 1. Pernas & Sapatos (com sombreamento)
        const legH = Math.round(this.height * 0.28);
        const legW = 2.5;
        const pantsColor = isSoldier ? '#1A237E' : (isNoble ? '#222' : '#3e2723');
        const shoeColor = '#141414';

        if (isFemale) {
            // Saia longa para adultas
            ctx.fillStyle = this.color;
            ctx.fillRect(cx - 5, baseY - legH - 2, 10, legH + 1);
            
            // Sombra interna da saia (lado direito)
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.fillRect(cx, baseY - legH - 2, 5, legH + 1);
            
            // Sapatos
            ctx.fillStyle = shoeColor;
            ctx.fillRect(cx - 4, baseY - 1, 2.5, 1.5);
            ctx.fillRect(cx + 1.5, baseY - 1, 2.5, 1.5);
        } else {
            // Perna Esquerda
            ctx.fillStyle = pantsColor;
            ctx.fillRect(cx - 3.5, baseY - legH - 1, legW, legH);
            ctx.fillStyle = shoeColor;
            ctx.fillRect(cx - 4.5, baseY - 1.5, 3.5, 1.5);

            // Perna Direita (ligeiramente sombreada por profundidade)
            ctx.fillStyle = pantsColor;
            ctx.fillRect(cx + 1, baseY - legH - 1, legW, legH);
            ctx.fillStyle = 'rgba(0,0,0,0.12)';
            ctx.fillRect(cx + 1, baseY - legH - 1, legW, legH);
            ctx.fillStyle = shoeColor;
            ctx.fillRect(cx + 1, baseY - 1.5, 3.5, 1.5);
        }

        // 2. Tronco / Corpo (com volume 3D)
        const torsoH = Math.round(this.height * 0.38);
        const torsoW = this.width * 0.55;
        const torsoX = cx - torsoW / 2;
        const torsoY = baseY - legH - torsoH - 1 + bob;

        // Base do casaco/roupa
        ctx.fillStyle = this.color;
        ctx.fillRect(torsoX, torsoY, torsoW, torsoH);

        // Highlight na lateral esquerda do corpo (brilho 3D)
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(torsoX, torsoY, 2, torsoH);

        // Sombra na lateral direita do corpo
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(cx, torsoY, torsoW / 2, torsoH);

        // Detalhes da vestimenta de época
        if (isNoble) {
            // Camisa branca interna
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(cx - 1.5, torsoY, 3, 5);
            // Gravata / Cravat vermelha com nó
            ctx.fillStyle = '#d32f2f';
            ctx.fillRect(cx - 0.5, torsoY + 2, 1, 3);
            // Lapelas do casaco
            ctx.fillStyle = '#222222';
            ctx.fillRect(cx - 3, torsoY, 1, torsoH);
            ctx.fillRect(cx + 2, torsoY, 1, torsoH);
        } else if (isSoldier) {
            // Detalhes dourados do uniforme
            ctx.fillStyle = '#FFD700'; 
            ctx.fillRect(cx - 1, torsoY + 2, 2, 1.5);
            ctx.fillRect(cx - 1, torsoY + 5, 2, 1.5);
            // Dragona militar dourada nos ombros
            ctx.fillRect(torsoX - 1.5, torsoY - 0.5, 3, 1.5);
            ctx.fillRect(torsoX + torsoW - 1.5, torsoY - 0.5, 3, 1.5);
        } else if (isMerchant) {
            // Camisa por baixo (creme)
            ctx.fillStyle = '#FFFDD0';
            ctx.fillRect(cx - 2, torsoY, 4, torsoH);
            // Suspensórios marrons escuros
            ctx.fillStyle = '#3e2723';
            ctx.fillRect(cx - 2.5, torsoY, 1, torsoH);
            ctx.fillRect(cx + 1.5, torsoY, 1, torsoH);
        }

        // 3. Braços e Mãos (3D / Esquerdo frontal, Direito sombreado)
        const armW = 2;
        const armH = torsoH - 1;

        // Braço Esquerdo
        ctx.fillStyle = this.color;
        ctx.fillRect(torsoX - armW, torsoY + 1, armW, armH);
        ctx.fillStyle = 'rgba(255,255,255,0.1)'; // brilho
        ctx.fillRect(torsoX - armW, torsoY + 1, 1, armH);
        ctx.fillStyle = skinColor;
        ctx.fillRect(torsoX - armW, torsoY + 1 + armH, armW, 2);

        // Braço Direito
        ctx.fillStyle = this.color;
        ctx.fillRect(torsoX + torsoW, torsoY + 1, armW, armH);
        ctx.fillStyle = 'rgba(0,0,0,0.18)'; // sombra de profundidade
        ctx.fillRect(torsoX + torsoW, torsoY + 1, armW, armH);
        ctx.fillStyle = skinColor;
        ctx.fillRect(torsoX + torsoW, torsoY + 1 + armH, armW, 2);

        // 4. Cabeça e Rosto
        const headR = this.width * 0.25;
        const headY = torsoY - headR * 0.7;

        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.arc(cx, headY, headR, 0, Math.PI * 2);
        ctx.fill();

        // 5. Cabelos, Barbas e Chapéus
        ctx.fillStyle = this.accentColor;
        
        if (isFemale) {
            // Cabelo volumoso com coque
            ctx.beginPath();
            ctx.arc(cx, headY - 1, headR * 0.95, Math.PI, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx, headY - headR, 3.2, 0, Math.PI * 2);
            ctx.fill();
            // Brilho no coque/cabelo
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.fillRect(cx - 1, headY - headR - 1, 2, 2);
            
            if (nameLower.includes('baronesa') || nameLower.includes('duquesa')) {
                ctx.fillStyle = '#FFD700'; // Tiara dourada
                ctx.fillRect(cx - 3, headY - headR, 6, 1.5);
                ctx.fillStyle = '#00E5FF'; // Joia azul no centro da tiara
                ctx.fillRect(cx - 0.5, headY - headR, 1, 1);
            }
        } else {
            // Cabelo masculino
            ctx.beginPath();
            ctx.arc(cx, headY - 1, headR * 0.9, Math.PI, Math.PI * 2);
            ctx.fill();
            
            // Barba histórica volumosa
            if (nameLower.includes('deodoro') || nameLower.includes('nabuco') || nameLower.includes('patrocinio') || nameLower.includes('senador')) {
                ctx.fillStyle = this.accentColor;
                ctx.fillRect(cx - 3, headY + 1, 6, 3.5);
                // Detalhe de textura/grisalho na barba
                ctx.fillStyle = 'rgba(255,255,255,0.25)';
                ctx.fillRect(cx - 2, headY + 2, 4, 1);
            }
            
            // Chapéus tridimensionais detalhados
            if (isNoble) {
                // Cartola preta (Top Hat)
                ctx.fillStyle = '#181818'; 
                ctx.fillRect(cx - 5.5, headY - headR, 11, 1.5); // Aba
                ctx.fillRect(cx - 3.5, headY - headR - 6, 7, 6); // Copa
                // Faixa vermelha da cartola
                ctx.fillStyle = '#c62828';
                ctx.fillRect(cx - 3.5, headY - headR - 1.5, 7, 1.5);
                // Fivela dourada na cartola
                ctx.fillStyle = '#FFD700';
                ctx.fillRect(cx - 1, headY - headR - 1.5, 2, 1.5);
            } else if (isMerchant) {
                // Chapéu simples
                ctx.fillStyle = '#8d6e63';
                ctx.fillRect(cx - 5, headY - headR, 10, 1.5);
                ctx.fillRect(cx - 3, headY - headR - 2.5, 6, 2.5);
                ctx.fillStyle = '#5d4037'; // Faixa marrom escura
                ctx.fillRect(cx - 3, headY - headR - 1, 6, 1);
            } else if (isSoldier) {
                // Quepe militar detalhado
                ctx.fillStyle = '#0D47A1';
                ctx.fillRect(cx - 4.5, headY - headR - 2, 9, 3.5); // Copa
                ctx.fillStyle = '#1565C0'; // Visor/Highlight
                ctx.fillRect(cx - 4, headY - headR - 2, 8, 1);
                ctx.fillStyle = '#FFD700'; // Escudo militar no centro
                ctx.fillRect(cx - 0.5, headY - headR - 1, 1, 1.5);
            } else if (isSpy) {
                // Chapéu de espião aba larga
                ctx.fillStyle = '#263238';
                ctx.fillRect(cx - 6.5, headY - headR, 13, 1.5); // Aba larga
                ctx.fillRect(cx - 3.5, headY - headR - 2.5, 7, 2.5);
            }
        }

        // 6. Detalhes Faciais (Olhos com brilho, bochechas, etc.)
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(cx - 2, headY - 1, 1.2, 1.2);
        ctx.fillRect(cx + 1, headY - 1, 1.2, 1.2);

        // Brilho sutil nos olhos (pixel art highlight)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cx - 1.6, headY - 1, 0.5, 0.5);
        ctx.fillRect(cx + 1.4, headY - 1, 0.5, 0.5);

        // Blush sutil nas bochechas para as mulheres
        if (isFemale) {
            ctx.fillStyle = 'rgba(255, 120, 120, 0.4)';
            ctx.fillRect(cx - 3, headY + 0.5, 1.2, 1);
            ctx.fillRect(cx + 1.8, headY + 0.5, 1.2, 1);
        }

        // Bigode simples de época para a maioria dos homens
        if (!isFemale && (isNoble || nameLower.includes('contador') || nameLower.includes('poeta') || nameLower.includes('mineiro'))) {
            ctx.fillStyle = '#2d1e18';
            ctx.fillRect(cx - 2.5, headY + 1.2, 5, 1);
            // Pontas do bigode curvadas para cima
            ctx.fillRect(cx - 3.5, headY + 0.8, 1, 1);
            ctx.fillRect(cx + 2.5, headY + 0.8, 1, 1);
        }

        // Indicador "!" flutuante
        const excY = headY - headR - 6 + Math.sin(this.animTimer * 3) * 2;
        if (!this.hasSpoken) {
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('!', cx, excY - (isNoble ? 6 : 0));
            ctx.textAlign = 'left';
        }
    }

    getHitbox() {
        // Caixa de colisão física restrita aos pés para melhor movimentação
        const paddingX = 2;
        const hitboxW = this.width - paddingX * 2;
        const hitboxH = Math.min(10, this.height);
        return {
            x: this.x + paddingX,
            y: this.y + this.height - hitboxH,
            width: hitboxW,
            height: hitboxH
        };
    }

    _drawNameTag(ctx) {
        const cx = this.x + this.width / 2;

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        const nameW = ctx.measureText ? ctx.measureText(this.name).width : this.name.length * 5;
        ctx.font = '6px sans-serif';
        const measured = ctx.measureText(this.name).width;
        ctx.fillRect(cx - measured / 2 - 2, this.y - 10, measured + 4, 9);

        ctx.fillStyle = this.hasSpoken ? 'rgba(200,200,200,0.6)' : '#F5F0E8';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, cx, this.y - 3);
        ctx.textAlign = 'left';
    }
}