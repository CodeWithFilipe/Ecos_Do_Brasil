/**
 * Map — Renderizador e gerenciador de colisão para mapas Tiled (.tmj)
 *
 * Suporta:
 *  - Múltiplos tilesets (embedded e externos)
 *  - Tiles de tamanho diferente entre tilesets
 *  - Flags de flip do Tiled
 *  - Camada "Colisões"/"colisoes" com retângulos, polígonos e polylines
 *  - Busca spawn_player em TODAS as objectgroup layers
 *  - Objetos nomeados (portais, itens, NPCs)
 */
export class Map {
    constructor(mapData, imageRegistry = {}) {
        this.mapData    = mapData;
        this.tileWidth  = mapData.tilewidth;
        this.tileHeight = mapData.tileheight;
        this.widthPx    = mapData.width  * this.tileWidth;
        this.heightPx   = mapData.height * this.tileHeight;

        this.tilesets          = [];
        this.collisionRects    = [];
        this.collisionPolygons = [];
        this.spawnPoint        = { x: this.widthPx / 2, y: this.heightPx / 2 };
        this.mapObjects        = [];

        this._buildTilesets(imageRegistry);
        this._parseAllObjectLayers();
    }

    // ── TILESETS ─────────────────────────────────

    _buildTilesets(registry) {
        for (const ts of this.mapData.tilesets) {
            const entry = {
                firstgid : ts.firstgid,
                image    : null,
                tileW    : ts.tilewidth  || this.tileWidth,
                tileH    : ts.tileheight || this.tileHeight,
                columns  : ts.columns    || 0,
                tilecount: ts.tilecount  || 0,
                margin   : ts.margin     || 0,
                spacing  : ts.spacing    || 0,
            };

            if (ts.image) {
                // Embedded: dados completos no TMJ
                entry.columns   = ts.columns;
                entry.tilecount = ts.tilecount;
                entry.tileW     = ts.tilewidth  || this.tileWidth;
                entry.tileH     = ts.tileheight || this.tileHeight;
                const imgBase = this._stem(ts.image);
                entry.image = registry[imgBase] || null;
                if (!entry.image) console.warn(`[Map] Tileset embedded sem imagem: ${ts.image} (key: ${imgBase})`);

            } else if (ts.source) {
                // Externo (.tsx): casar pelo stem do source
                const srcStem = this._stem(ts.source);
                entry.image = registry[srcStem] || null;
                if (!entry.image) console.warn(`[Map] Tileset externo sem imagem: ${ts.source} (key: ${srcStem})`);
            }

            this.tilesets.push(entry);
        }

        this.tilesets.sort((a, b) => b.firstgid - a.firstgid);
    }

    _stem(path) {
        return path.split('/').pop().split('\\').pop().replace(/\.[^.]+$/, '');
    }

    _tilesetFor(gid) {
        for (const ts of this.tilesets) {
            if (gid >= ts.firstgid) return ts;
        }
        return null;
    }

    // ── PARSE ALL OBJECT LAYERS ──────────────────
    // Busca spawn, colisões e objetos em TODAS as objectgroup layers

    _parseAllObjectLayers() {
        let foundSpawn = false;

        for (const layer of this.mapData.layers) {
            if (layer.type !== 'objectgroup') continue;

            const isCollisionLayer = (
                layer.name === 'Colisões' ||
                layer.name.toLowerCase() === 'colisoes' ||
                layer.name.toLowerCase().includes('colis')
            );

            for (const obj of layer.objects) {
                // Spawn — procurar em QUALQUER objectgroup
                if (obj.name === 'spawn_player' && !foundSpawn) {
                    this.spawnPoint = { x: obj.x, y: obj.y };
                    foundSpawn = true;
                    continue;
                }

                // Colisões
                if (isCollisionLayer) {
                    if (obj.name === 'spawn_player') continue; // spawn no layer de colisão (templo)

                    if (obj.polygon) {
                        this.collisionPolygons.push(
                            obj.polygon.map(p => ({ x: obj.x + p.x, y: obj.y + p.y }))
                        );
                    } else if (obj.polyline) {
                        this.collisionPolygons.push(
                            obj.polyline.map(p => ({ x: obj.x + p.x, y: obj.y + p.y }))
                        );
                    } else if (obj.width > 1 && obj.height > 1) {
                        this.collisionRects.push({
                            x: obj.x, y: obj.y,
                            width: obj.width, height: obj.height
                        });
                    }
                    continue;
                }

                // Objetos nomeados (portais, itens, NPCs)
                if (obj.name && obj.name !== 'spawn_player' && obj.width > 0 && obj.height > 0) {
                    this.mapObjects.push({
                        name  : obj.name,
                        x     : obj.x,
                        y     : obj.y,
                        width : obj.width,
                        height: obj.height,
                    });
                }
            }
        }
    }

    // ── COLISÃO ──────────────────────────────────

    isColliding(x, y, w, h) {
        if (x < -16 || y < -16 || x + w > this.widthPx + 16 || y + h > this.heightPx + 16) return true;

        for (const r of this.collisionRects) {
            if (x < r.x + r.width  && x + w > r.x &&
                y < r.y + r.height && y + h > r.y) return true;
        }

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

    // ── RENDERIZAÇÃO ─────────────────────────────

    draw(ctx) {
        const FLIP_H = 0x80000000;
        const FLIP_V = 0x40000000;
        const FLIP_D = 0x20000000;

        for (const layer of this.mapData.layers) {
            if (layer.type !== 'tilelayer' || layer.visible === false) continue;

            for (let i = 0; i < layer.data.length; i++) {
                const raw = layer.data[i];
                if (!raw) continue;

                const flipH = (raw & FLIP_H) !== 0;
                const flipV = (raw & FLIP_V) !== 0;
                const gid   = (raw & 0x0FFFFFFF); // Limpa as flags de rotação

                const ts = this._tilesetFor(gid);
                if (!ts || !ts.image || !ts.image.complete || !ts.image.naturalWidth) continue;

                const localId = gid - ts.firstgid;
                const cols    = ts.columns || Math.floor((ts.image.width - ts.margin * 2 + ts.spacing) / (ts.tileW + ts.spacing));
                if (cols <= 0) continue;

                const sx = ts.margin + (localId % cols) * (ts.tileW + ts.spacing);
                const sy = ts.margin + Math.floor(localId / cols) * (ts.tileH + ts.spacing);

                const dx = (i % layer.width)           * this.tileWidth;
                const dy = Math.floor(i / layer.width) * this.tileHeight;

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