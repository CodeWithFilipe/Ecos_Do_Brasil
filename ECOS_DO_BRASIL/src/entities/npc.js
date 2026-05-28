export class NPC {
    constructor(x, y, name, color) {
        this.x = x;
        this.y = y;
        this.width = 16;
        this.height = 24;
        this.name = name;
        this.color = color;
    }

    interact() {
        // Futuramente, isso vai disparar a caixa de texto
        console.log(`Iniciando diálogo com: ${this.name}`);
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}