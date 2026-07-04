export class Camera {
    constructor(canvasWidth, canvasHeight) {
        this.x = 0;
        this.y = 0;
        this.width = canvasWidth;
        this.height = canvasHeight;

        // Limites do mapa (serão definidos quando o mapa carregar)
        this.mapWidth = canvasWidth;
        this.mapHeight = canvasHeight;

        // Suavização do movimento da câmera
        this.smoothSpeed = 5; // Quanto maior, mais rápido segue
    }

    /**
     * Define os limites do mapa para a câmera não mostrar além das bordas.
     */
    setBounds(mapWidth, mapHeight) {
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
    }

    /**
     * Atualiza a posição da câmera para seguir um alvo (o jogador).
     * Usa interpolação linear (lerp) para movimento suave.
     */
    update(dt, target) {
        // Posição desejada: centralizar o alvo na tela
        const targetX = target.x + target.width / 2 - this.width / 2;
        const targetY = target.y + target.height / 2 - this.height / 2;

        // Interpolação suave (lerp)
        const t = 1 - Math.pow(0.001, dt * this.smoothSpeed);
        this.x += (targetX - this.x) * t;
        this.y += (targetY - this.y) * t;

        // Limitar aos bounds do mapa
        this.x = Math.max(0, Math.min(this.x, this.mapWidth - this.width));
        this.y = Math.max(0, Math.min(this.y, this.mapHeight - this.height));
    }

    /**
     * Aplica a transformação da câmera no contexto de renderização.
     * Chamar antes de desenhar qualquer coisa do mundo.
     */
    apply(ctx) {
        ctx.save();
        ctx.translate(-Math.round(this.x), -Math.round(this.y));
    }

    /**
     * Remove a transformação da câmera.
     * Chamar após desenhar o mundo, antes de desenhar a UI.
     */
    restore(ctx) {
        ctx.restore();
    }
}
