/**
 * Map — Renderizador e gerenciador de colisão para mapas Tiled (.tmj)
 *
 * Suporta:
 *  - Múltiplos tilesets com firstgid diferente
 *  - Tilesets EMBEDDED no TMJ (com "image", "columns", "tilecount" direto)
 *  - Tilesets EXTERNOS (.tsx) — casados pelo nome base do source
 *  - Tiles de tamanho diferente entre tilesets (ex: mapa 32px + tileset embutido 16px)
 *  - Flags de flip horizontal/vertical do Tiled
 *  - Camada "Colisões" / "colisoes" com retângulos e polígonos
 *  - Camada de objetos com spawn_player e portais de transição
 */
export class Map {
    /**
     * @param {Object} mapData      — JSON do .tmj
     * @param {Object} imageRegistry — { 'nome-do-tsx-ou-png': HTMLImageElement, ... }
     *   As chaves devem casar com o nome base do source (.tsx) ou o campo image do tileset embedded.
     *   Exemplo: { 'Library sprite sheet-00': img, 'atlas_32x': img2, 'interior': img3 }
     */
    constructor(mapData, imageRegistry = {}) {
        this.mapData      = mapData;
        this.tileWidth    = mapData.tilewidth;
        this.tileHeight   = mapData.tileheight;
        this.widthPx      = mapData.width  * this.tileWidth;
        this.heightPx     = mapData.height * this.tileHeight;

        this.tilesets          = [];
        this.collisionRects    = [];
        this.collisionPolygons = [];
        this.spawnPoint        = { x: 0, y: 0 };
        this.mapObjects        = [];   // portais, itens, etc.

        this._buildTilesets(imageRegistry);
        this._parseCollisions();
        this._parseObjects();
    }

    // ─────────────────────────────────────────────
    // TILESETS
    // ─────────────────────────────────────────────

    _buildTilesets(registry) {
        for (const ts of this.mapData.tilesets) {
            const entry = {
                firstgid   : ts.firstgid,
                image      : null,
                tileW      : ts.tilewidth  || this.tileWidth,
                tileH      : ts.tileheight || this.tileHeight,
                columns    : ts.columns    || 0,
                tilecount  : ts.tilecount  || 0,
            };

            if (ts.image) {
                // ── Embedded: dados completos no TMJ ──────
                entry.columns   = ts.columns;
                entry.tilecount = ts.tilecount;
                entry.tileW     = ts.tilewidth  || this.tileWidth;
                entry.tileH     = ts.tileheight || this.tileHeight;
                // Tentar casar pelo basename da imagem
                const imgBase = this._stem(ts.image);
                entry.image = registry[imgBase]
                           || registry[this._stem(imgBase)]
                           || null;
                if (!entry.image) console.warn(`[Map] Tileset embedded sem imagem: ${ts.image}`);

            } else if (ts.source) {
                // ── Externo (.tsx): casar pelo stem do source ─
                const srcStem = this._stem(ts.source);
                entry.image = registry[srcStem] || null;
                if (!entry.image) console.warn(`[Map] Tileset externo sem imagem: ${ts.source}`);
            }

            this.tilesets.push(entry);
        }

        // Ordenar decrescente por firstgid (para busca eficiente)
        this.tilesets.sort((a, b) => b.firstgid - a.firstgid);
    }

    /** Remove extensão e diretórios de um caminho, retorna só o nome-base sem extensão. */
    _stem(path) {
        return path.split('/').pop().split('\\').pop().replace(/\.[^.]+$/, '');
    }

    /** Encontra o tileset correto para um dado tile ID global. */
    _tilesetFor(gid) {
        for (const ts of this.tilesets) {
            if (gid >= ts.firstgid) return ts;
        }
        return null;
    }

    // ─────────────────────────────────────────────
    // COLISÕES
    // ─────────────────────────────────────────────

    _parseCollisions() {
        // Aceita "Colisões" ou "colisoes"
        const layer = this.mapData.layers.find(l =>
            l.type === 'objectgroup' &&
            (l.name === 'Colis\u00f5es' || l.name.toLowerCase() === 'colisoes')
        );
        if (!layer) return;

        for (const obj of layer.objects) {
            if (obj.polygon) {
                this.collisionPolygons.push(
                    obj.polygon.map(p => ({ x: obj.x + p.x, y: obj.y + p.y }))
                );
            } else if (obj.polyline) {
                // polyline fechada como polígono
                this.collisionPolygons.push(
                    obj.polyline.map(p => ({ x: obj.x + p.x, y: obj.y + p.y }))
                );
            } else if (obj.width > 0 && obj.height > 0) {
                this.collisionRects.push({
                    x: obj.x, y: obj.y,
                    width: obj.width, height: obj.height
                });
            }
        }
    }

    // ─────────────────────────────────────────────
    // OBJETOS (spawn, portais, itens)
    // ─────────────────────────────────────────────

    _parseObjects() {
        const layer = this.mapData.layers.find(
            l => l.type === 'objectgroup' && l.name === 'Camada de Objetos 1'
        );
        if (!layer) return;

        for (const obj of layer.objects) {
            if (obj.name === 'spawn_player') {
                this.spawnPoint = { x: obj.x, y: obj.y };
            } else if (obj.name) {
                this.mapObjects.push({
                    name  : obj.name,
                    x     : obj.x,
                    y     : obj.y,
                    width : obj.width  || 16,
                    height: obj.height || 16,
                });
            }
        }
    }

    // ─────────────────────────────────────────────
    // COLISÃO — API pública
    // ─────────────────────────────────────────────

    isColliding(x, y, w, h) {
        // Limites do mapa - agora mais permissivo para evitar travamento no spawn
        if (x < -32 || y < -32 || x + w > this.widthPx + 32 || y + h > this.heightPx + 32) return true;

        // Retângulos (AABB)
        for (const r of this.collisionRects) {
            if (x < r.x + r.width  && x + w > r.x &&
                y < r.y + r.height && y + h > r.y) return true;
        }

        // Polígonos (ponto-em-polígono nos 5 pontos da hitbox)
        const pts = [
            { x, y }, { x: x+w, y }, { x, y: y+h }, { x: x+w, y: y+h },
            { x: x + w/2, y: y + h/2 }
        ];
        for (const poly of this.collisionPolygons) {
            for (const p of pts) {
                if (this._pointInPoly(p.x, p.y, poly)) return true;
            }
        }

        return false;
    }

    _pointInPoly(px, py, poly) {
        let inside = false;
        const n = poly.length;
        for (let i = 0, j = n - 1; i < n; j = i++) {
            const xi = poly[i].x, yi = poly[i].y;
            const xj = poly[j].x, yj = poly[j].y;
            if ((yi > py) !== (yj > py) &&
                px < (xj - xi) * (py - yi) / (yj - yi) + xi) {
                inside = !inside;
            }
        }
        return inside;
    }

    // ─────────────────────────────────────────────
    // RENDERIZAÇÃO
    // ─────────────────────────────────────────────

    draw(ctx) {
        const FLIP_H = 0x80000000;
        const FLIP_V = 0x40000000;
        const FLIP_D = 0x20000000;

        for (const layer of this.mapData.layers) {
            if (layer.type !== 'tilelayer' || !layer.visible) continue;

            for (let i = 0; i < layer.data.length; i++) {
                const raw = layer.data[i];
                if (!raw) continue;

                const gid   = (raw & ~(FLIP_H | FLIP_V | FLIP_D)) >>> 0;
                const flipH = (raw & FLIP_H) !== 0;
                const flipV = (raw & FLIP_V) !== 0;

                const ts = this._tilesetFor(gid);
                if (!ts || !ts.image || !ts.image.complete || !ts.image.naturalWidth) continue;

                const localId = gid - ts.firstgid;
                const cols    = ts.columns || Math.floor(ts.image.width / ts.tileW);
                if (cols <= 0) continue;

                const sx = (localId % cols) * ts.tileW;
                const sy = Math.floor(localId / cols) * ts.tileH;

                // Posição de destino (sempre baseada no tilesize do MAPA)
                const dx = (i % layer.width)              * this.tileWidth;
                const dy = Math.floor(i / layer.width)    * this.tileHeight;

                if (flipH || flipV) {
                    ctx.save();
                    ctx.translate(dx + this.tileWidth / 2, dy + this.tileHeight / 2);
                    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
                    ctx.drawImage(ts.image,
                        sx, sy, ts.tileW, ts.tileH,
                        -this.tileWidth / 2, -this.tileHeight / 2,
                        this.tileWidth, this.tileHeight);
                    ctx.restore();
                } else {
                    ctx.drawImage(ts.image,
                        sx, sy, ts.tileW, ts.tileH,
                        dx, dy, this.tileWidth, this.tileHeight);
                }
            }
        }
    }

    drawCollisionDebug(ctx) {
        ctx.strokeStyle = 'rgba(255,0,0,0.6)';
        ctx.fillStyle   = 'rgba(255,0,0,0.12)';
        ctx.lineWidth   = 1;
        for (const r of this.collisionRects) {
            ctx.strokeRect(r.x, r.y, r.width, r.height);
            ctx.fillRect  (r.x, r.y, r.width, r.height);
        }
        for (const poly of this.collisionPolygons) {
            ctx.beginPath();
            ctx.moveTo(poly[0].x, poly[0].y);
            for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
            ctx.closePath();
            ctx.stroke();
            ctx.fill();
        }
    }
}