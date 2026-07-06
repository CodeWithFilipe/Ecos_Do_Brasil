export class Camera {
    constructor(canvasWidth, canvasHeight) {
        this.x = 0;
        this.y = 0;
        this.width = canvasWidth;
        this.height = canvasHeight;
        this.mapWidth = canvasWidth;
        this.mapHeight = canvasHeight;
        this.smoothSpeed = 5; 
    }
    setBounds(mapWidth, mapHeight) {
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
    }
    update(dt, target) {
        const targetX = target.x + target.width / 2 - this.width / 2;
        const targetY = target.y + target.height / 2 - this.height / 2;
        const t = 1 - Math.pow(0.001, dt * this.smoothSpeed);
        this.x += (targetX - this.x) * t;
        this.y += (targetY - this.y) * t;
        this.x = Math.max(0, Math.min(this.x, this.mapWidth - this.width));
        this.y = Math.max(0, Math.min(this.y, this.mapHeight - this.height));
    }
    apply(ctx) {
        ctx.save();
        ctx.translate(-Math.round(this.x), -Math.round(this.y));
    }
    restore(ctx) {
        ctx.restore();
    }
}