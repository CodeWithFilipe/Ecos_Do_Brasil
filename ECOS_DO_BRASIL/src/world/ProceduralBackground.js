/**
 * ProceduralBackground — Renderizador de fundo gerado por código.
 *
 * Substitui tilesets de exterior/overworld com versão demo (watermark).
 * Gera grama, caminhos, vegetação e detalhes usando apenas Canvas 2D.
 *
 * Uso: ProceduralBackground.draw(ctx, mapWidthPx, mapHeightPx, tileW, preset)
 */
export class ProceduralBackground {

    /**
     * Presets de cor/estilo por cena.
     * Inspirados na estética colonial brasileira de Ouro Preto / Vila Rica.
     */
    static PRESETS = {
        praca: {
            ground:     '#7aaa52',   // grama viva
            groundDark: '#5e8a3e',   // grama sombra
            path:       '#c8a96e',   // caminho de terra/paralelepípedo
            pathEdge:   '#b08040',   // borda do caminho
            accent:     '#8fbc5f',   // grama clara (variação)
            noise:      true,
        },
        biblioteca: {
            ground:     '#3a2a1a',   // assoalho escuro de madeira
            groundDark: '#2e2010',
            path:       '#4a3420',   // corredor/tapete
            pathEdge:   '#5a4030',
            accent:     '#3d2b18',
            noise:      false,
        },
        igreja: {
            ground:     '#c8c0a8',   // pedra clara (mármore/granito)
            groundDark: '#a8a090',
            path:       '#b0a888',   // nave central
            pathEdge:   '#988870',
            accent:     '#d0c8b0',
            noise:      false,
        },
        default: {
            ground:     '#6a9e48',
            groundDark: '#507838',
            path:       '#c0985a',
            pathEdge:   '#a07840',
            accent:     '#80b058',
            noise:      true,
        },
    };

    /**
     * Desenha o fundo procedural completo para o mapa.
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} mapW    largura total em px
     * @param {number} mapH    altura total em px
     * @param {number} tileW   tamanho do tile em px (para alinhar a grade)
     * @param {string} preset  nome do preset (ex: 'praca')
     */
    static draw(ctx, mapW, mapH, tileW, preset = 'default') {
        const p = ProceduralBackground.PRESETS[preset] || ProceduralBackground.PRESETS.default;
        const t = tileW;

        // ── 1. Fundo base (grama / chão) ──────────────────────────────
        ctx.fillStyle = p.ground;
        ctx.fillRect(0, 0, mapW, mapH);

        // ── 2. Variação de cor em xadrez suave ────────────────────────
        for (let ty = 0; ty < mapH / t; ty++) {
            for (let tx = 0; tx < mapW / t; tx++) {
                if ((tx + ty) % 2 === 0) {
                    ctx.fillStyle = p.groundDark;
                    ctx.globalAlpha = 0.18;
                    ctx.fillRect(tx * t, ty * t, t, t);
                    ctx.globalAlpha = 1;
                }
            }
        }

        // ── 3. Ruído (textura de grama — só presets com noise) ────────
        if (p.noise) {
            ProceduralBackground._drawGrassNoise(ctx, mapW, mapH, p);
        }

        // ── 4. Caminho central cruzado (praça) ────────────────────────
        if (preset === 'praca') {
            ProceduralBackground._drawPracaPath(ctx, mapW, mapH, t, p);
        } else if (preset === 'biblioteca' || preset === 'igreja') {
            ProceduralBackground._drawInteriorFloor(ctx, mapW, mapH, t, p);
        }

        // ── 5. Borda do mapa (muro/cerca) ─────────────────────────────
        ProceduralBackground._drawMapBorder(ctx, mapW, mapH, t, p);
    }

    // ── Caminho em cruz da Praça ─────────────────────────────────────
    static _drawPracaPath(ctx, mapW, mapH, t, p) {
        const cxStart = Math.floor(mapW * 0.28);
        const cxEnd   = Math.floor(mapW * 0.72);
        const cyStart = Math.floor(mapH * 0.35);
        const cyEnd   = Math.floor(mapH * 0.65);
        const pathW   = t * 3; // largura do caminho = 3 tiles

        // Caminho horizontal
        ctx.fillStyle = p.path;
        ctx.fillRect(0, mapH / 2 - pathW / 2, mapW, pathW);

        // Caminho vertical (centro)
        ctx.fillRect(mapW / 2 - pathW / 2, cyStart, pathW, mapH - cyStart);

        // Detalhes de paralelepípedo no caminho
        ctx.strokeStyle = p.pathEdge;
        ctx.lineWidth = 0.5;
        ctx.globalAlpha = 0.35;
        const brickW = t * 2, brickH = t;
        for (let bx = 0; bx < mapW; bx += brickW) {
            for (let by = Math.floor(mapH / 2 - pathW / 2); by < mapH / 2 + pathW / 2; by += brickH) {
                const offset = (Math.floor(by / brickH) % 2) * brickW / 2;
                ctx.strokeRect(bx + offset, by, brickW, brickH);
            }
        }
        ctx.globalAlpha = 1;

        // Praça central (área pavimentada ao redor da estátua)
        const plazaSize = t * 8;
        const plazaX = mapW / 2 - plazaSize / 2;
        const plazaY = mapH / 2 - plazaSize / 2 + t * 3;
        ctx.fillStyle = '#c4a070';
        ctx.fillRect(plazaX, plazaY, plazaSize, plazaSize);

        // Grade de pedras na praça central
        ctx.strokeStyle = '#a88050';
        ctx.lineWidth = 0.8;
        ctx.globalAlpha = 0.4;
        for (let gx = plazaX; gx < plazaX + plazaSize; gx += t * 2) {
            for (let gy = plazaY; gy < plazaY + plazaSize; gy += t * 2) {
                ctx.strokeRect(gx, gy, t * 2, t * 2);
            }
        }
        ctx.globalAlpha = 1;

        // Sombra de árvores (círculos verdes dispersos)
        ProceduralBackground._drawTrees(ctx, mapW, mapH, t, p);
    }

    // ── Piso interno (biblioteca / igreja) ───────────────────────────
    static _drawInteriorFloor(ctx, mapW, mapH, t, p) {
        // Grade de tijolos/tábuas
        ctx.strokeStyle = p.pathEdge;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.25;
        const boardW = t * 2, boardH = t;
        for (let bx = 0; bx < mapW; bx += boardW) {
            for (let by = 0; by < mapH; by += boardH) {
                const offset = (Math.floor(by / boardH) % 2) * boardW / 2;
                ctx.fillStyle = (Math.floor(bx / boardW + by / boardH)) % 2 === 0
                    ? p.ground : p.groundDark;
                ctx.globalAlpha = 1;
                ctx.fillRect(bx + offset, by, boardW, boardH);
                ctx.globalAlpha = 0.2;
                ctx.strokeStyle = p.pathEdge;
                ctx.strokeRect(bx + offset, by, boardW, boardH);
            }
        }
        ctx.globalAlpha = 1;

        // Corredor central mais claro
        const corridorX = mapW * 0.35;
        const corridorW = mapW * 0.3;
        ctx.fillStyle = p.path;
        ctx.globalAlpha = 0.3;
        ctx.fillRect(corridorX, 0, corridorW, mapH);
        ctx.globalAlpha = 1;
    }

    // ── Árvores estilizadas ───────────────────────────────────────────
    static _drawTrees(ctx, mapW, mapH, t, p) {
        // Posições fixas de árvores nos cantos e bordas
        const trees = [
            { x: t * 1.5,        y: t * 1.5 },
            { x: mapW - t * 2.5, y: t * 1.5 },
            { x: t * 1.5,        y: mapH - t * 2.5 },
            { x: mapW - t * 2.5, y: mapH - t * 2.5 },
            { x: t * 4,          y: t * 2 },
            { x: mapW - t * 5,   y: t * 2 },
            { x: t * 1.5,        y: mapH * 0.5 },
            { x: mapW - t * 2.5, y: mapH * 0.5 },
        ];

        for (const tr of trees) {
            // Sombra da árvore
            ctx.fillStyle = 'rgba(0,0,0,0.12)';
            ctx.beginPath();
            ctx.ellipse(tr.x + t * 0.3, tr.y + t * 0.3, t * 1.2, t * 0.8, 0, 0, Math.PI * 2);
            ctx.fill();

            // Copa da árvore (camadas)
            const greens = ['#2d6e1a', '#3d8a24', '#4aaa2e', '#56c038'];
            for (let layer = 0; layer < 3; layer++) {
                ctx.fillStyle = greens[layer];
                ctx.beginPath();
                ctx.ellipse(
                    tr.x, tr.y - layer * t * 0.3,
                    t * (1.1 - layer * 0.15),
                    t * (1.0 - layer * 0.15),
                    0, 0, Math.PI * 2
                );
                ctx.fill();
            }

            // Tronco
            ctx.fillStyle = '#5a3a1a';
            ctx.fillRect(tr.x - t * 0.15, tr.y + t * 0.3, t * 0.3, t * 0.5);
        }
    }

    // ── Ruído de grama ────────────────────────────────────────────────
    static _drawGrassNoise(ctx, mapW, mapH, p) {
        // Pequenos tracinhos de grama pseudo-aleatórios
        const seed = 42;
        const count = Math.floor(mapW * mapH / 80);
        ctx.strokeStyle = p.groundDark;
        ctx.lineWidth = 0.8;
        ctx.globalAlpha = 0.3;

        // Gerador de pseudo-random determinístico
        let r = seed;
        const rand = () => { r = (r * 16807 + 0) % 2147483647; return (r - 1) / 2147483646; };

        for (let i = 0; i < count; i++) {
            const gx = rand() * mapW;
            const gy = rand() * mapH;
            const len = 2 + rand() * 3;
            const angle = -Math.PI / 3 + rand() * Math.PI / 6;
            ctx.beginPath();
            ctx.moveTo(gx, gy);
            ctx.lineTo(gx + Math.cos(angle) * len, gy - len);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    }

    // ── Borda do mapa ─────────────────────────────────────────────────
    static _drawMapBorder(ctx, mapW, mapH, t, p) {
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = t;
        ctx.strokeRect(t / 2, t / 2, mapW - t, mapH - t);

        // Linha interna decorativa
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 2;
        ctx.strokeRect(t + 2, t + 2, mapW - t * 2 - 4, mapH - t * 2 - 4);
    }
}
