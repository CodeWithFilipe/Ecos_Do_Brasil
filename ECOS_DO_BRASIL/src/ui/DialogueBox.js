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

        // Opções de escolha do diálogo
        this.options = null;
        this.selectedOption = 0;
        this.onOptionSelect = null;
    }

    show(lines, callback) {
        this.queue = lines;
        this.active = true;
        this.onComplete = callback;
        this.options = null; // Limpar opções se for um diálogo comum
        this.nextLine();
    }

    showChoices(speaker, text, options, callback) {
        this.active = true;
        this.speaker = speaker;
        this.currentLine = text;
        this.currentChar = text.length; // Exibe o texto imediatamente
        this.options = options;
        this.selectedOption = 0;
        this.onOptionSelect = callback;
        this.queue = [];
    }

    navigateOptions(dir) {
        if (!this.options || this.options.length === 0) return;
        this.selectedOption = (this.selectedOption + dir + this.options.length) % this.options.length;
    }

    selectCurrentOption() {
        if (!this.options || this.options.length === 0) return;
        const selected = this.selectedOption;
        const cb = this.onOptionSelect;
        
        // Reseta estado antes de executar o callback para evitar conflitos de input
        this.options = null;
        this.active = false;
        
        if (cb) cb(selected);
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

        // Nome do Personagem
        ctx.fillStyle = '#EF9F27'; // Cor dourada
        ctx.font = 'bold 10px monospace';
        ctx.fillText(this.speaker.toUpperCase(), x + 8, y + 16);

        // O Texto
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '10px monospace';
        const textToShow = this.currentLine.substring(0, this.currentChar);
        
        // Função auxiliar para quebrar as linhas de texto para não vazar da caixa
        this.wrapText(ctx, textToShow, x + 8, y + 32, w - 16, 12);

        // Se tiver opções, desenhar a lista acima da caixa de texto
        if (this.options && this.options.length > 0) {
            const optH = this.options.length * 15 + 10;
            const optY = y - optH - 5;
            
            // Fundo da caixa de opções
            ctx.fillStyle = 'rgba(10, 10, 25, 0.95)';
            ctx.fillRect(x, optY, w, optH);
            ctx.strokeStyle = '#EF9F27';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(x, optY, w, optH);
            
            // Desenhar cada opção
            this.options.forEach((opt, idx) => {
                const isSelected = idx === this.selectedOption;
                ctx.fillStyle = isSelected ? '#EF9F27' : '#FFFFFF';
                ctx.font = isSelected ? 'bold 9px monospace' : '9px monospace';
                const prefix = isSelected ? '> ' : '  ';
                
                // Desenhar texto da opção
                ctx.fillText(prefix + opt, x + 10, optY + 14 + idx * 15);
            });
        }
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