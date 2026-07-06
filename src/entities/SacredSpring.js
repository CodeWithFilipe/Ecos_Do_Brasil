export class SacredSpring {
    constructor(cx, cy) {
        this.cx = cx;
        this.cy = cy;
        this.x = cx - 20;
        this.y = cy;
        this.width = 40;
        this.height = 0;
        this.t = Math.random() * 6;
        this.pads = [
            { dx: -11, dy: -4, r: 8 },
            { dx:  10, dy:  1, r: 7 },
            { dx:  -1, dy:  8, r: 6, flower: true },
        ];
    }
    update(dt) { this.t += dt; }
    draw(ctx) {
        const cx = this.cx, cy = this.cy;
        const top = cy - 28, bot = cy - 14;
        ctx.save();
        for (let i = 0; i < 3; i++) {
            const off = (i - 1) * 2.6;
            ctx.strokeStyle = i === 1 ? 'rgba(238,251,255,0.9)' : 'rgba(150,205,225,0.65)';
            ctx.lineWidth = i === 1 ? 2 : 1.2;
            ctx.beginPath();
            ctx.moveTo(cx + off, top);
            ctx.lineTo(cx + off + Math.sin(this.t * 3 + i) * 0.8, bot);
            ctx.stroke();
        }
        ctx.fillStyle = 'rgba(240,252,255,0.85)';
        for (let i = 0; i < 5; i++) {
            const a = this.t * 2 + i * 1.3;
            ctx.beginPath();
            ctx.arc(cx + Math.cos(a) * 4.5, bot + Math.abs(Math.sin(a)) * 2, 1.1, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
        for (const p of this.pads) {
            const px = cx + p.dx;
            const py = cy + p.dy + Math.sin(this.t * 1.5 + p.dx) * 0.6;
            ctx.fillStyle = '#2f7d3a';
            ctx.beginPath();
            ctx.ellipse(px, py, p.r, p.r * 0.72, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#3c9648';
            ctx.beginPath();
            ctx.ellipse(px, py - 0.8, p.r * 0.78, p.r * 0.52, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#245e2c';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(px, py, p.r, p.r * 0.72, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(22,72,32,0.45)';
            ctx.lineWidth = 0.5;
            for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
                ctx.beginPath();
                ctx.moveTo(px, py);
                ctx.lineTo(px + Math.cos(a) * p.r * 0.9, py + Math.sin(a) * p.r * 0.66);
                ctx.stroke();
            }
            if (p.flower) {
                ctx.fillStyle = '#e58fb0';
                for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
                    ctx.beginPath();
                    ctx.ellipse(px + Math.cos(a) * 1.9, py - 1 + Math.sin(a) * 1.9,
                                1.2, 0.7, a, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.fillStyle = '#f6ecf1';
                ctx.beginPath(); ctx.arc(px, py - 1, 1.5, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#e6b422';
                ctx.beginPath(); ctx.arc(px, py - 1, 0.8, 0, Math.PI * 2); ctx.fill();
            }
        }
    }
}