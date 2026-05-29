export class DialogueBox {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        
        this.active = false;
        this.queue = []; // Fila de falas
        this.currentLine = "";
        this.currentChar = 0;
        this.speaker = "";
        
        this.timer = 0;
        this.speed = 30; // Milissegundos por letra (efeito máquina de escrever)
        this.onComplete = null;
    }

    show(lines, callback) {
        this.queue = lines;
        this.active = true;
        this.onComplete = callback;
        this.nextLine();
    }

    nextLine() {
        if (this.queue.length === 0) {
            this.active = false;
            if (this.onComplete) this.onComplete();
            return;
        }
        const data = this.queue.shift();
        this.speaker = data.speaker;
        this.currentLine = data.text;
        this.currentChar = 0;
    }

    update(dt) {
        if (!this.active) return;
        
        if (this.currentChar < this.currentLine.length) {
            this.timer += dt * 1000;
            if (this.timer > this.speed) {
                this.currentChar++;
                this.timer = 0;
            }
        }
    }

    advance() {
        if (!this.active) return;
        
        // Se o texto ainda está digitando, o botão pula para o final da frase
        if (this.currentChar < this.currentLine.length) {
            this.currentChar = this.currentLine.length;
        } else {
            // Se já terminou de digitar, vai para a próxima fala
            this.nextLine();
        }
    }

    draw() {
        if (!this.active) return;
        
        const ctx = this.ctx;
        const margin = 10;
        const h = 60;
        const w = this.canvas.width - (margin * 2);
        const x = margin;
        const y = this.canvas.height - h - margin;

        // Fundo da Caixa de Texto (Estilo RPG 16-bit)
        ctx.fillStyle = 'rgba(10, 10, 25, 0.95)';
        ctx.fillRect(x, y, w, h);
        
        // Borda da Caixa
        ctx.strokeStyle = '#F5F0E8';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        // Nome do Personagem (Cores temáticas)
        let nameColor = '#EF9F27'; // Padrão
        const spk = this.speaker.toLowerCase();
        if (spk === 'alex') nameColor = '#FFFFFF';
        else if (spk === 'clio') nameColor = '#F5C518';
        else if (spk === 'diário') nameColor = '#A0D8EF';
        else if (spk === 'tiradentes') nameColor = '#C8411A';
        else if (spk.includes('névoa') || spk === '???') nameColor = '#999999';

        ctx.fillStyle = nameColor;
        ctx.font = 'bold 10px monospace';
        ctx.fillText(this.speaker.toUpperCase(), x + 8, y + 16);

        // Indicador de Avanço (Blink)
        if (this.currentChar >= this.currentLine.length) {
            const blink = Math.floor(Date.now() / 300) % 2 === 0;
            if (blink) {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillText('▶', x + w - 16, y + h - 10);
            }
        }

        // O Texto
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '10px monospace';
        const textToShow = this.currentLine.substring(0, this.currentChar);
        
        // Função auxiliar para quebrar as linhas de texto para não vazar da caixa
        this.wrapText(ctx, textToShow, x + 8, y + 32, w - 16, 12);
    }

    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
                ctx.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, y);
    }
}