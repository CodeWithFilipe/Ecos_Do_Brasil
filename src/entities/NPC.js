export class NPC {
    static DEFAULT_RENDER_SCALE = 1.5;
    constructor(x, y, config = {}) {
        this.x = x;
        this.y = y;
        this.width  = config.width  || 16;
        this.height = config.height || 24;
        this.name   = config.name   || 'NPC';
        this.color  = config.color  || '#787880';
        this.accentColor = config.accentColor || '#aaa';
        this.renderScale = config.renderScale ?? NPC.DEFAULT_RENDER_SCALE;
        this.spriteSheet  = config.spriteSheet || null;
        this.frameW       = config.frameW    || 32;
        this.frameH       = config.frameH    || 32;
        this.facing       = config.facing    || 0;
        this.maxFrames    = config.maxFrames || 2;
        this.frameOffsetX = config.frameOffsetX || 0; 
        this.animFrame = 0;
        this.animTimer = 0;
        this.animSpeed = 0.5;
        this.dialogueLines      = config.dialogueLines || [{ speaker: this.name, text: '...' }];
        this.afterDialogueLines = config.afterDialogueLines || null;
        this.onInteractComplete = config.onInteractComplete || null;
        this.hasSpoken          = false;
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
    _visualTopOffset() {
        return (this.height * this.renderScale - this.height);
    }
    draw(ctx) {
        if (this.spriteSheet && this.spriteSheet.complete) {
            const sx = (this.frameOffsetX + this.animFrame) * this.frameW;
            const sy = this.facing * this.frameH;
            ctx.fillStyle = 'rgba(0,0,0,0.22)';
            ctx.beginPath();
            ctx.ellipse(this.x + this.width / 2, this.y + this.height - 1, this.width / 2.4, 2, 0, 0, Math.PI * 2);
            ctx.fill();
            const drawW = this.width  * this.renderScale;
            const drawH = this.height * this.renderScale;
            const drawX = this.x + (this.width  - drawW) / 2;
            const drawY = this.y + this.height - drawH;
            ctx.drawImage(this.spriteSheet,
                sx, sy, this.frameW, this.frameH,
                drawX, drawY, drawW, drawH);
            if (!this.hasSpoken) {
                const excY = this.y - this._visualTopOffset() - 14 + Math.sin(this.animTimer * 3) * 2;
                ctx.fillStyle = '#FFD700';
                ctx.font = 'bold 8px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('!', this.x + this.width / 2, excY);
                ctx.textAlign = 'left';
            }
            this._drawNameTag(ctx);
            return;
        }
        this._drawFallbackCharacter(ctx);
        this._drawNameTag(ctx);
    }
    _drawFallbackCharacter(ctx) {
        const cx = this.x + this.width / 2;
        const baseY = this.y + this.height;
        ctx.save();
        ctx.translate(cx, baseY);
        ctx.scale(this.renderScale, this.renderScale);
        ctx.translate(-cx, -baseY);
        const bob = Math.sin(this.animTimer * 4) * 0.6; 
        const nameLower = this.name.toLowerCase();
        let isFemale = nameLower.includes('professora') || nameLower.includes('bibliotecaria') || 
                       nameLower.includes('baronesa') || nameLower.includes('duquesa') || nameLower.includes('arasy');
        let isNoble = nameLower.includes('aristocrata') || nameLower.includes('fazendeiro') || 
                      nameLower.includes('senador') || nameLower.includes('deodoro') || nameLower.includes('negociador');
        let isSoldier = nameLower.includes('guarda') || nameLower.includes('soldado');
        let isMerchant = nameLower.includes('vendedor') || nameLower.includes('ambulante');
        let isSpy = nameLower.includes('espiao');
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.beginPath();
        ctx.ellipse(cx, baseY - 1, this.width / 2.2, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        const skinColor = '#e8c89e';
        const legH = Math.round(this.height * 0.28);
        const legW = 2.5;
        const pantsColor = isSoldier ? '#1A237E' : (isNoble ? '#222' : '#3e2723');
        const shoeColor = '#141414';
        if (isFemale) {
            ctx.fillStyle = this.color;
            ctx.fillRect(cx - 5, baseY - legH - 2, 10, legH + 1);
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.fillRect(cx, baseY - legH - 2, 5, legH + 1);
            ctx.fillStyle = shoeColor;
            ctx.fillRect(cx - 4, baseY - 1, 2.5, 1.5);
            ctx.fillRect(cx + 1.5, baseY - 1, 2.5, 1.5);
        } else {
            ctx.fillStyle = pantsColor;
            ctx.fillRect(cx - 3.5, baseY - legH - 1, legW, legH);
            ctx.fillStyle = shoeColor;
            ctx.fillRect(cx - 4.5, baseY - 1.5, 3.5, 1.5);
            ctx.fillStyle = pantsColor;
            ctx.fillRect(cx + 1, baseY - legH - 1, legW, legH);
            ctx.fillStyle = 'rgba(0,0,0,0.12)';
            ctx.fillRect(cx + 1, baseY - legH - 1, legW, legH);
            ctx.fillStyle = shoeColor;
            ctx.fillRect(cx + 1, baseY - 1.5, 3.5, 1.5);
        }
        const torsoH = Math.round(this.height * 0.38);
        const torsoW = this.width * 0.55;
        const torsoX = cx - torsoW / 2;
        const torsoY = baseY - legH - torsoH - 1 + bob;
        ctx.fillStyle = this.color;
        ctx.fillRect(torsoX, torsoY, torsoW, torsoH);
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(torsoX, torsoY, 2, torsoH);
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(cx, torsoY, torsoW / 2, torsoH);
        if (isNoble) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(cx - 1.5, torsoY, 3, 5);
            ctx.fillStyle = '#d32f2f';
            ctx.fillRect(cx - 0.5, torsoY + 2, 1, 3);
            ctx.fillStyle = '#222222';
            ctx.fillRect(cx - 3, torsoY, 1, torsoH);
            ctx.fillRect(cx + 2, torsoY, 1, torsoH);
        } else if (isSoldier) {
            ctx.fillStyle = '#FFD700'; 
            ctx.fillRect(cx - 1, torsoY + 2, 2, 1.5);
            ctx.fillRect(cx - 1, torsoY + 5, 2, 1.5);
            ctx.fillRect(torsoX - 1.5, torsoY - 0.5, 3, 1.5);
            ctx.fillRect(torsoX + torsoW - 1.5, torsoY - 0.5, 3, 1.5);
        } else if (isMerchant) {
            ctx.fillStyle = '#FFFDD0';
            ctx.fillRect(cx - 2, torsoY, 4, torsoH);
            ctx.fillStyle = '#3e2723';
            ctx.fillRect(cx - 2.5, torsoY, 1, torsoH);
            ctx.fillRect(cx + 1.5, torsoY, 1, torsoH);
        }
        const armW = 2;
        const armH = torsoH - 1;
        ctx.fillStyle = this.color;
        ctx.fillRect(torsoX - armW, torsoY + 1, armW, armH);
        ctx.fillStyle = 'rgba(255,255,255,0.1)'; 
        ctx.fillRect(torsoX - armW, torsoY + 1, 1, armH);
        ctx.fillStyle = skinColor;
        ctx.fillRect(torsoX - armW, torsoY + 1 + armH, armW, 2);
        ctx.fillStyle = this.color;
        ctx.fillRect(torsoX + torsoW, torsoY + 1, armW, armH);
        ctx.fillStyle = 'rgba(0,0,0,0.18)'; 
        ctx.fillRect(torsoX + torsoW, torsoY + 1, armW, armH);
        ctx.fillStyle = skinColor;
        ctx.fillRect(torsoX + torsoW, torsoY + 1 + armH, armW, 2);
        const headR = this.width * 0.25;
        const headY = torsoY - headR * 0.7;
        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.arc(cx, headY, headR, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = this.accentColor;
        if (isFemale) {
            ctx.beginPath();
            ctx.arc(cx, headY - 1, headR * 0.95, Math.PI, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx, headY - headR, 3.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.fillRect(cx - 1, headY - headR - 1, 2, 2);
            if (nameLower.includes('baronesa') || nameLower.includes('duquesa')) {
                ctx.fillStyle = '#FFD700'; 
                ctx.fillRect(cx - 3, headY - headR, 6, 1.5);
                ctx.fillStyle = '#00E5FF'; 
                ctx.fillRect(cx - 0.5, headY - headR, 1, 1);
            }
        } else {
            ctx.beginPath();
            ctx.arc(cx, headY - 1, headR * 0.9, Math.PI, Math.PI * 2);
            ctx.fill();
            if (nameLower.includes('deodoro') || nameLower.includes('nabuco') || nameLower.includes('patrocinio') || nameLower.includes('senador')) {
                ctx.fillStyle = this.accentColor;
                ctx.fillRect(cx - 3, headY + 1, 6, 3.5);
                ctx.fillStyle = 'rgba(255,255,255,0.25)';
                ctx.fillRect(cx - 2, headY + 2, 4, 1);
            }
            if (isNoble) {
                ctx.fillStyle = '#181818'; 
                ctx.fillRect(cx - 5.5, headY - headR, 11, 1.5); 
                ctx.fillRect(cx - 3.5, headY - headR - 6, 7, 6); 
                ctx.fillStyle = '#c62828';
                ctx.fillRect(cx - 3.5, headY - headR - 1.5, 7, 1.5);
                ctx.fillStyle = '#FFD700';
                ctx.fillRect(cx - 1, headY - headR - 1.5, 2, 1.5);
            } else if (isMerchant) {
                ctx.fillStyle = '#8d6e63';
                ctx.fillRect(cx - 5, headY - headR, 10, 1.5);
                ctx.fillRect(cx - 3, headY - headR - 2.5, 6, 2.5);
                ctx.fillStyle = '#5d4037'; 
                ctx.fillRect(cx - 3, headY - headR - 1, 6, 1);
            } else if (isSoldier) {
                ctx.fillStyle = '#0D47A1';
                ctx.fillRect(cx - 4.5, headY - headR - 2, 9, 3.5); 
                ctx.fillStyle = '#1565C0'; 
                ctx.fillRect(cx - 4, headY - headR - 2, 8, 1);
                ctx.fillStyle = '#FFD700'; 
                ctx.fillRect(cx - 0.5, headY - headR - 1, 1, 1.5);
            } else if (isSpy) {
                ctx.fillStyle = '#263238';
                ctx.fillRect(cx - 6.5, headY - headR, 13, 1.5); 
                ctx.fillRect(cx - 3.5, headY - headR - 2.5, 7, 2.5);
            }
        }
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(cx - 2, headY - 1, 1.2, 1.2);
        ctx.fillRect(cx + 1, headY - 1, 1.2, 1.2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cx - 1.6, headY - 1, 0.5, 0.5);
        ctx.fillRect(cx + 1.4, headY - 1, 0.5, 0.5);
        if (isFemale) {
            ctx.fillStyle = 'rgba(255, 120, 120, 0.4)';
            ctx.fillRect(cx - 3, headY + 0.5, 1.2, 1);
            ctx.fillRect(cx + 1.8, headY + 0.5, 1.2, 1);
        }
        if (!isFemale && (isNoble || nameLower.includes('contador') || nameLower.includes('mineiro'))) {
            ctx.fillStyle = '#2d1e18';
            ctx.fillRect(cx - 2.5, headY + 1.2, 5, 1);
            ctx.fillRect(cx - 3.5, headY + 0.8, 1, 1);
            ctx.fillRect(cx + 2.5, headY + 0.8, 1, 1);
        }
        const excY = headY - headR - 6 + Math.sin(this.animTimer * 3) * 2;
        if (!this.hasSpoken) {
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('!', cx, excY - (isNoble ? 6 : 0));
            ctx.textAlign = 'left';
        }
        ctx.restore();
    }
    getHitbox() {
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
    getDetectionBox() {
        return { x: this.x, y: this.y, width: this.width, height: this.height };
    }
    _drawNameTag(ctx) {
        const cx = this.x + this.width / 2;
        const topY = this.y - this._visualTopOffset();
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        const nameW = ctx.measureText ? ctx.measureText(this.name).width : this.name.length * 5;
        ctx.font = '6px sans-serif';
        const measured = ctx.measureText(this.name).width;
        ctx.fillRect(cx - measured / 2 - 2, topY - 10, measured + 4, 9);
        ctx.fillStyle = this.hasSpoken ? 'rgba(200,200,200,0.6)' : '#F5F0E8';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, cx, topY - 3);
        ctx.textAlign = 'left';
    }
}