// Gerado por build_bundle.py — NÃO EDITAR À MÃO.
// Fonte da verdade: pasta src/. Para regenerar: python3 scratch/build_bundle.py .
(() => {
"use strict";
// ═══════ src/ui/theme.js ═══════
/**
 * theme.js — Design tokens centrais da interface.
 *
 * Toda a UI consome estes tokens; nenhum componente deve
 * declarar cores/fontes/medidas próprias ("magic numbers").
 *
 * O mundo do jogo é renderizado em 320x240 (VIEW) e ampliado 2x
 * para o canvas físico de 640x480 (SCREEN). A UI desenha direto
 * no espaço SCREEN, em alta resolução — texto nítido.
 */

/** Resolução lógica do mundo (câmera). */
const VIEW = Object.freeze({ W: 320, H: 240 });

/** Fator de ampliação do mundo para o canvas físico. */
const WORLD_SCALE = 2;

/** Resolução física do canvas (UI desenha neste espaço). */
const SCREEN = Object.freeze({ W: VIEW.W * WORLD_SCALE, H: VIEW.H * WORLD_SCALE });

/** Paleta da interface. */
const COLORS = Object.freeze({
    gold        : '#EF9F27',
    goldSoft    : 'rgba(239, 159, 39, 0.25)',
    parchment   : '#F5F0E8',
    text        : '#FFFFFF',
    textDim     : 'rgba(220, 210, 200, 0.85)',
    textFaint   : '#9A938A',
    panel       : 'rgba(10, 10, 25, 0.95)',
    panelSoft   : 'rgba(30, 25, 45, 0.85)',
    overlay     : 'rgba(5, 5, 15, 0.93)',
    border      : '#F5F0E8',
    borderSoft  : 'rgba(200, 180, 140, 0.45)',
    success     : '#4CAF50',
    successSoft : 'rgba(100, 200, 100, 0.75)',
    danger      : '#E53935',
    neutral     : '#757575',
    highlight   : '#FFD700',
});

/** Famílias tipográficas (fallbacks seguros do Windows/navegador). */
const SANS = "'Segoe UI', 'Trebuchet MS', Verdana, sans-serif";
const MONO = "Consolas, 'Courier New', monospace";

/**
 * Monta uma string de fonte para o canvas.
 * @param {number} px — tamanho em pixels do espaço SCREEN
 * @param {{bold?: boolean, italic?: boolean, mono?: boolean}} [opts]
 */
function font(px, opts = {}) {
    const style  = opts.italic ? 'italic ' : '';
    const weight = opts.bold ? 'bold ' : '';
    const family = opts.mono ? MONO : SANS;
    return `${style}${weight}${px}px ${family}`;
}

/** Escala de tipos padronizada (px no espaço SCREEN). */
const TYPE = Object.freeze({
    caption : 13,
    body    : 16,
    label   : 17,
    title   : 22,
    hero    : 30,
});

/** Espaçamentos padronizados. */
const SPACE = Object.freeze({ xs: 4, sm: 8, md: 16, lg: 24, xl: 40 });

/**
 * Quebra `text` em linhas que caibam em `maxWidth` com a fonte atual do ctx.
 * Utilidade compartilhada por toda a UI (evita implementações duplicadas).
 * @returns {string[]}
 */
function wrapLines(ctx, text, maxWidth) {
    const words = String(text ?? '').split(' ');
    const lines = [];
    let line = '';
    for (const word of words) {
        const candidate = line ? `${line} ${word}` : word;
        if (ctx.measureText(candidate).width > maxWidth && line) {
            lines.push(line);
            line = word;
        } else {
            line = candidate;
        }
    }
    lines.push(line);
    return lines;
}

/** Desenha linhas já quebradas; retorna o y da linha seguinte. */
function drawLines(ctx, lines, x, y, lineHeight) {
    for (const line of lines) {
        ctx.fillText(line, x, y);
        y += lineHeight;
    }
    return y;
}

// ═══════ src/core/Input.js ═══════
class Input {
    constructor() {
        this.keys = {};
        // Teclas do jogo que devem ser bloqueadas de comportamento padrão
        const gameKeys = new Set([
            'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
            'Space', 'KeyE', 'KeyW', 'KeyA', 'KeyS', 'KeyD'
        ]);

        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (gameKeys.has(e.code)) e.preventDefault();
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            if (gameKeys.has(e.code)) e.preventDefault();
        });
    }

    isDown(keyCode) {
        return this.keys[keyCode] === true;
    }
}
// ═══════ src/core/Camera.js ═══════
class Camera {
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

// ═══════ src/world/Collision.js ═══════
/**
 * Collision — utilitários centralizados de colisão física (AABB) do mundo.
 *
 * Fonte única de verdade para:
 *  - Quais nomes de camada (objectgroup) de um .tmj contam como colisão física
 *  - O teste de sobreposição retângulo-retângulo usado por Map e pelas entidades
 *
 * Mantém a lógica de colisão consistente entre mapas, em vez de cada arquivo
 * reimplementar sua própria variação da mesma checagem.
 */

/** Nomes de camada reconhecidos como colisão física nos .tmj (case-insensitive). */
const COLLISION_LAYER_NAMES = new Set(['colisões', 'colisoes']);

/** @param {string} name — nome da camada (objectgroup) do .tmj */
function isCollisionLayerName(name) {
    return COLLISION_LAYER_NAMES.has(name.toLowerCase());
}

/**
 * Sobreposição entre dois retângulos {x, y, width, height} (AABB).
 * Único ponto de verdade para esse teste — usado tanto pela colisão
 * contra o mapa (Map.isColliding) quanto contra NPCs (Player).
 */
function rectsOverlap(a, b) {
    return a.x < b.x + b.width  && a.x + a.width  > b.x &&
           a.y < b.y + b.height && a.y + a.height > b.y;
}

// ═══════ src/world/Map.js ═══════

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
 *  - Tiles marcados com a propriedade custom "solid" (no Tiled: aba
 *    "Tile Properties" do tileset) geram colisão automaticamente na
 *    posição exata onde aparecem — sem precisar de um retângulo manual
 *    duplicado na camada de colisões. Isso evita hitboxes desalinhadas
 *    do sprite real sempre que um objeto decorativo é movido/editado.
 *
 * A lógica de colisão (nomes de camada aceitos, teste de sobreposição) vive
 * em Collision.js — fonte única de verdade compartilhada com as entidades.
 */
class Map {
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
        this._buildTileCollisions();
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
                solidLocalIds: this._readSolidLocalIds(ts),
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

    /** IDs locais (dentro do tileset) marcados com a propriedade custom "solid":true no Tiled. */
    _readSolidLocalIds(ts) {
        const ids = new Set();
        for (const tileDef of ts.tiles || []) {
            const solidProp = (tileDef.properties || []).find(p => p.name === 'solid');
            if (solidProp && solidProp.value) ids.add(tileDef.id);
        }
        return ids;
    }

    /**
     * Gera colisão automaticamente para todo tile marcado como "solid",
     * exatamente na célula onde ele é desenhado (mesma conta de dx/dy do
     * draw()). Assim a hitbox nunca fica dessincronizada do sprite real:
     * mover o tile no editor move a colisão junto, sem retângulo manual.
     */
    _buildTileCollisions() {
        for (const layer of this.mapData.layers) {
            if (layer.type !== 'tilelayer') continue;

            for (let i = 0; i < layer.data.length; i++) {
                const gid = layer.data[i] & 0x0FFFFFFF;
                if (!gid) continue;

                const ts = this._tilesetFor(gid);
                if (!ts || !ts.solidLocalIds.has(gid - ts.firstgid)) continue;

                this.collisionRects.push({
                    x: (i % layer.width)           * this.tileWidth,
                    y: Math.floor(i / layer.width) * this.tileHeight,
                    width : this.tileWidth,
                    height: this.tileHeight,
                });
            }
        }
    }

    // ── PARSE ALL OBJECT LAYERS ──────────────────
    // Busca spawn, colisões e objetos em TODAS as objectgroup layers

    _parseAllObjectLayers() {
        let foundSpawn = false;

        for (const layer of this.mapData.layers) {
            if (layer.type !== 'objectgroup') continue;

            const isCollisionLayer = isCollisionLayerName(layer.name);

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
        // Margem de tolerância na borda do mapa: meio tile, para não variar
        // conforme o tamanho de tile de cada mapa (16px vs 32px etc.).
        const margin = Math.min(this.tileWidth, this.tileHeight) / 2;
        if (x < -margin || y < -margin ||
            x + w > this.widthPx + margin || y + h > this.heightPx + margin) return true;

        const box = { x, y, width: w, height: h };
        for (const r of this.collisionRects) {
            if (rectsOverlap(box, r)) return true;
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
// ═══════ src/core/SceneManager.js ═══════

/**
 * SceneManager — gerencia transições entre cenas/mapas.
 *
 * Cada cena é definida por:
 *  {
 *    mapFile    : 'assets/maps/praca.tmj',
 *    tilesets   : { stemName: imageElement, ... },
 *    onLoad     : (map, player) => void   // posicionar jogador, criar NPCs, etc.
 *  }
 */
class SceneManager {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx    = ctx;

        // Estado de fade
        this.fadeAlpha   = 0;
        this.fadingOut   = false;
        this.fadingIn    = false;
        this.fadeSpeed   = 2.2;        // alpha/s
        this.fadeColor   = '#000';
        this._pendingLoad = null;       // função chamada no pico do fade

        this.currentScene = null;
        this.currentMap   = null;      // instância de Map atual
    }

    get transitioning() {
        return this.fadingOut || this.fadingIn;
    }

    /**
     * Inicia uma transição para outra cena.
     * @param {Function} midCallback — chamado no meio do fade (tela preta).
     *   Deve fazer: carregar mapa, reposicionar jogador, recriar NPCs.
     *   Pode ser async.
     */
    transitionTo(sceneName, midCallback) {
        if (this.transitioning) return;
        this.currentScene = sceneName;
        this.fadingOut    = true;
        this.fadeAlpha    = 0;
        this._pendingLoad = midCallback;
        this._midDone     = false;
    }

    update(dt) {
        if (this.fadingOut) {
            this.fadeAlpha += this.fadeSpeed * dt;
            if (this.fadeAlpha >= 1) {
                this.fadeAlpha = 1;
                this.fadingOut = false;
                if (!this._midDone) {
                    this._midDone = true;
                    const result = this._pendingLoad?.();
                    // suporte a callback async
                    if (result && typeof result.then === 'function') {
                        result.then(() => { this.fadingIn = true; });
                    } else {
                        this.fadingIn = true;
                    }
                }
            }
        } else if (this.fadingIn) {
            this.fadeAlpha -= this.fadeSpeed * dt;
            if (this.fadeAlpha <= 0) {
                this.fadeAlpha = 0;
                this.fadingIn  = false;
            }
        }
    }

    draw() {
        if (this.fadeAlpha <= 0) return;
        this.ctx.fillStyle   = this.fadeColor;
        this.ctx.globalAlpha = this.fadeAlpha;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.globalAlpha = 1;
    }
}

// ═══════ src/core/GameState.js ═══════
/**
 * GameState — estado global do jogo (fonte única de verdade).
 *
 * Responsabilidades:
 *  - Progresso da aventura (ato, fase, flags de história)
 *  - Coleção de informações históricas (por ato, com arquivo permanente)
 *  - Verificação dos puzzles de cada ato
 *
 * Convenções:
 *  - "Ato" 1..3 = Vila Rica, Rio de Janeiro, São Paulo.
 *  - collectedInfos NUNCA é limpo ao concluir um ato: os registros das
 *    fases concluídas permanecem para consulta no diário (com selo
 *    FATO/BOATO revelado). Consultas de progresso são sempre por ato.
 */
class GameState {

    /** Fase (chave de INFO_DATA) de cada ato. */
    static PHASE_BY_ACT = Object.freeze({ 1: 'vila_rica', 2: 'rio_de_janeiro', 3: 'sao_paulo' });

    /** Quantidade de informações necessárias por ato. */
    static REQUIRED_BY_ACT = Object.freeze({ 1: 4, 2: 6, 3: 8 });

    /** Par (início, fim) correto do puzzle de cada ato. */
    static PUZZLE_ANSWER_BY_ACT = Object.freeze({
        1: { start: 'derrama',         end: 'traicao' },
        2: { start: 'republica_inicio', end: 'republica_fim' },
        3: { start: 'leiaurea_inicio',  end: 'leiaurea_fim' },
    });

    constructor() {
        this.reset();
    }

    reset() {
        this.act               = 1;
        this.completedActs     = [];      // atos com puzzle vencido (diário revela selos)
        this.currentPhase      = 'biblioteca';
        this.tutorialStep      = 0;       // 0=mover, 1=interagir, 2=professora, 3=done
        this.talkedToTeacher   = false;
        this.talkedToLibrarian = false;
        this.bookFound         = false;
        this.arasyMet          = false;
        this.collectedInfos    = [];      // acumula TODOS os atos (diário)
        this.puzzleAttempts    = 0;
        this.gameWon           = false;
    }

    // ── Tutorial ─────────────────────────────────────────────

    advanceTutorial() {
        this.tutorialStep = Math.min(this.tutorialStep + 1, 4);
    }

    isTutorialDone() {
        return this.tutorialStep >= 3;
    }

    // ── Atos ─────────────────────────────────────────────────

    /**
     * Descobre a qual ato uma informação pertence, pela fonte canônica.
     * @param {{id: string}} info
     * @returns {1|2|3|null}
     */
    getInfoAct(info) {
        if (!info) return null;
        for (const [act, phase] of Object.entries(GameState.PHASE_BY_ACT)) {
            if (GameState.INFO_DATA[phase].some(i => i.id === info.id)) return Number(act);
        }
        return null;
    }

    /** @param {number} act */
    isActCompleted(act) {
        return this.completedActs.includes(act);
    }

    /** Marca o ato atual como concluído (idempotente). */
    completeCurrentAct() {
        if (!this.isActCompleted(this.act)) this.completedActs.push(this.act);
    }

    // ── Informações coletáveis ───────────────────────────────

    /**
     * Registra uma informação coletada.
     * @param {Object} info — item de INFO_DATA
     * @returns {boolean} true se era inédita
     */
    addInfo(info) {
        if (this.hasInfo(info.id)) return false;
        this.collectedInfos.push(info);
        return true;
    }

    hasInfo(id) {
        return this.collectedInfos.some(i => i.id === id);
    }

    /** Informações coletadas pertencentes ao ato ATUAL. */
    getCurrentActInfos() {
        return this.collectedInfos.filter(i => this.getInfoAct(i) === this.act);
    }

    /** Contagem do ato atual (HUD, portal, puzzle). */
    getInfoCount() {
        return this.getCurrentActInfos().length;
    }

    getRequiredInfoCount() {
        return GameState.REQUIRED_BY_ACT[this.act] ?? 4;
    }

    hasAllInfos() {
        return this.getInfoCount() >= this.getRequiredInfoCount();
    }

    /** Remove apenas as informações do ato atual (derrota no puzzle). */
    clearCurrentActInfos() {
        this.collectedInfos = this.collectedInfos.filter(i => this.getInfoAct(i) !== this.act);
    }

    // ── Puzzle ───────────────────────────────────────────────

    /**
     * Confere a resposta do puzzle do ato atual.
     * @param {string} startId
     * @param {string} endId
     * @returns {boolean}
     */
    checkPuzzle(startId, endId) {
        this.puzzleAttempts++;
        const answer = GameState.PUZZLE_ANSWER_BY_ACT[this.act];
        const correct = !!answer && startId === answer.start && endId === answer.end;
        if (correct && this.act === 3) this.gameWon = true;
        return correct;
    }

    // ── Dados canônicos das informações por fase ─────────────
    static INFO_DATA = {
        vila_rica: [
            {
                id: 'derrama',
                title: 'A Cobrança da Coroa',
                npc: 'Mineiro Revoltado',
                isTrue: true,
                role: 'inicio',
                text: 'O movimento começou porque Portugal queria cobrar a "derrama", um imposto obrigatório que permitia aos soldados entrarem nas casas dos mineiros para levar o ouro, as joias e os móveis de valor. Os moradores de Minas Gerais se uniram porque não aceitavam ser roubados dessa forma pela Coroa.',
                shortText: 'A Derrama: impostos abusivos de Portugal sobre os mineiros.'
            },
            {
                id: 'dentaduras',
                title: 'A Falsa Lenda de Tiradentes',
                npc: 'Contador de Histórias',
                isTrue: false,
                role: null,
                text: 'Joaquim José da Silva Xavier tinha o apelido de Tiradentes porque, durante as reuniões secretas, ele usava seus conhecimentos de dentista para criar dentaduras mágicas de ouro e diamantes que ajudavam os rebeldes a morder os soldados inimigos.',
                shortText: 'Dentaduras mágicas de ouro que mordiam soldados.'
            },
            {
                id: 'traicao',
                title: 'A Traição Revelada',
                npc: 'Espião da Coroa',
                isTrue: true,
                role: 'fim',
                text: 'Os planos de liberdade foram interrompidos antes mesmo da revolta começar. Um dos participantes do grupo, Joaquim Silvério dos Reis, resolveu trair seus companheiros e revelou todo o segredo ao governador de Minas Gerais em troca do perdão de suas dívidas com Portugal.',
                shortText: 'Traição de Silvério dos Reis ao governador.'
            },
            {
                id: 'pao_de_queijo',
                title: 'O Castigo Inventado',
                npc: 'Vendedor do Mercado',
                isTrue: false,
                role: null,
                text: 'Como punição final pela rebelião, a Rainha de Portugal confiscou todas as receitas da região e proibiu os mineiros de produzirem pão de queijo e doce de leite por cem anos, obrigando a população a comer apenas jiló cozido.',
                shortText: 'Proibição de pão de queijo por 100 anos.'
            }
        ],
        rio_de_janeiro: [
            {
                id: 'republica_inicio',
                title: 'Os Grupos Insatisfeitos',
                npc: 'Quintino Bocaiúva',
                isTrue: true,
                role: 'inicio',
                text: 'O movimento para derrubar a Monarquia começou por causa da insatisfação de três grupos poderosos: a Igreja Católica, os militares (que queriam mais poder político e melhores salários após a Guerra do Paraguai) e os grandes fazendeiros de café, que ficaram revoltados com o fim da escravidão em 1888 e deixaram de apoiar o Imperador.',
                shortText: 'Insatisfação de militares, Igreja e cafeicultores.'
            },
            {
                id: 'republica_rival',
                title: 'O Rival Amoroso',
                npc: 'Aristocrata Fofoqueiro',
                isTrue: false,
                role: null,
                text: 'O Marechal Deodoro da Fonseca, que era amigo do Imperador, só aceitou liderar a revolta porque inventaram uma fofoca de que o novo Primeiro-Ministro escolhido por Dom Pedro II seria o Silveira Martins — um político gaúcho que tinha sido o grande rival de Deodoro no passado, disputando o amor da mesma mulher.',
                shortText: 'Boato de rivalidade amorosa entre Deodoro e Silveira Martins.'
            },
            {
                id: 'republica_fim',
                title: 'A Proclamação de Deodoro',
                npc: 'Marechal Deodoro',
                isTrue: true,
                role: 'fim',
                text: 'No dia 15 de novembro de 1889, o Marechal Deodoro da Fonseca assumiu o comando das tropas no Rio de Janeiro e declarou o início da República. O novo governo deu um prazo de apenas dois dias para que Dom Pedro II e toda a família real arrumassem suas malas e fossem embora do Brasil, exilados na Europa.',
                shortText: 'Marechal assume comando e exila família real em 2 dias.'
            },
            {
                id: 'republica_eleicao',
                title: 'A Eleição Secreta',
                npc: 'Vendedor Ambulante',
                isTrue: false,
                role: null,
                text: 'Para que o povo não ficasse revoltado com a expulsão do Imperador, o Marechal Deodoro organizou uma votação na Praça XV, onde os cidadãos do Rio de Janeiro puderam votar se preferiam continuar na Monarquia ou mudar para a República.',
                shortText: 'Suposta votação popular na Praça XV pela República.'
            },
            {
                id: 'republica_disfarce',
                title: 'O Disfarce Imperial',
                npc: 'Guarda Imperial',
                isTrue: false,
                role: null,
                text: 'Dom Pedro II tentou fugir do Paço Imperial disfarçado de vendedor de cocadas para organizar uma resistência armada em Petrópolis, mas foi descoberto pelos guardas republicanos na Praça XV porque se recusou a cortar ou esconder sua famosa e longa barba branca.',
                shortText: 'Dom Pedro II foge disfarçado de vendedor de cocadas.'
            },
            {
                id: 'republica_carta',
                title: 'A Carta da Princesa',
                npc: 'Baronesa do Café',
                isTrue: false,
                role: null,
                text: 'A Princesa Isabel enviou uma carta de Portugal ordenando que a República fosse proclamada imediatamente, pois ela estava cansada dos deveres reais e preferia viver como uma cidadã comum na Europa, abdicando de seu direito ao trono brasileiro.',
                shortText: 'Carta da Princesa Isabel ordenando o fim da Monarquia.'
            }
        ],
        sao_paulo: [
            {
                id: 'leiaurea_inicio',
                title: 'A Luta pela Liberdade',
                npc: 'José do Patrocínio',
                isTrue: true,
                role: 'inicio',
                text: 'A assinatura da Lei Áurea em 13 de maio de 1888 não aconteceu por acaso. Ela foi o resultado de anos de muita luta dos próprios escravizados (que fugiam e criavam quilombos), além da pressão de jornalistas, poetas e advogados do "Movimento Abolicionista", que faziam campanhas e comícios lotados pelo fim da escravidão.',
                shortText: 'Luta popular e resistência dos escravizados pelo fim do regime.'
            },
            {
                id: 'leiaurea_caneta',
                title: 'A Caneta da Princesa',
                npc: 'Duquesa Imperial',
                isTrue: false,
                role: null,
                text: 'Para celebrar o momento histórico, a Princesa Isabel mandou trazer de Portugal uma caneta feita inteiramente de ouro maciço e diamantes, pesando quase um quilo, o que fez com que ela precisasse da ajuda de dois guardas reais para conseguir segurar a caneta e assinar o documento.',
                shortText: 'Caneta de ouro e diamantes de 1kg sustentada por guardas.'
            },
            {
                id: 'leiaurea_fim',
                title: 'As Consequências Sociais',
                npc: 'Joaquim Nabuco',
                isTrue: true,
                role: 'fim',
                text: 'A Lei Áurea acabou oficialmente com a escravidão no Brasil, tornando o país o último das Américas a fazer isso. Porém, a lei era muito curta e não deu nenhuma ajuda aos novos cidadãos livres: eles não receberam terras, salários iniciais ou estudos, fazendo com que muitos continuassem enfrentando muitas dificuldades e preconceito para sobreviver.',
                shortText: 'Libertação formal tardia e abandono social pós-abolição.'
            },
            {
                id: 'leiaurea_indeniza',
                title: 'A Indenização',
                npc: 'Fazendeiro de Café',
                isTrue: false,
                role: null,
                text: 'Logo após assinar a lei, a Princesa Isabel usou o dinheiro dos cofres do Império para pagar uma grande indenização em dinheiro para cada um dos escravizados libertos, garantindo que todos pudessem comprar suas próprias casas e abrir seus próprios negócios imediatamente.',
                shortText: 'Suposta indenização monetária paga a libertos pelo Império.'
            },
            {
                id: 'leiaurea_votacao',
                title: 'A Votação Provisória',
                npc: 'Senador Conservador',
                isTrue: false,
                role: null,
                text: 'Para que a lei fosse aprovada no Senado, a Princesa Isabel propôs que os grandes cafeicultores continuassem donos de metade dos escravizados por mais dez anos, e a abolição completa só ocorreria após o ano de 1900.',
                shortText: 'Suposta aprovação parcial mantendo escravidão até 1900.'
            },
            {
                id: 'leiaurea_dia',
                title: 'O Dia da Libertação',
                npc: 'Cidadão Festivo',
                isTrue: false,
                role: null,
                text: 'A Lei Áurea determinava que o dia 13 de maio seria um feriado nacional onde todos os cidadãos deveriam vestir roupas brancas e dançar nas praças públicas, sob pena de pagar uma multa de vinte mil réis caso fossem vistos trabalhando.',
                shortText: 'Obrigatoriedade de danças em praça pública sob pena de multa.'
            },
            {
                id: 'leiaurea_compra',
                title: 'O Suborno Inglês',
                npc: 'Negociador Inglês',
                isTrue: false,
                role: null,
                text: 'O fim da escravidão no Brasil só foi possível porque o governo da Inglaterra comprou todos os escravizados do país e os alugou de volta para os fazendeiros de café paulistas, cobrando uma taxa simbólica anual de cinco libras.',
                shortText: 'Inglaterra comprando escravizados e alugando de volta a fazendeiros.'
            },
            {
                id: 'leiaurea_fuga',
                title: 'A Grande Fuga',
                npc: 'Imigrante Italiano',
                isTrue: false,
                role: null,
                text: 'Antes da assinatura da lei, mais de oitenta por cento da população escravizada do estado de São Paulo fugiu a pé em uma grande caravana para o Uruguai, onde a escravidão já havia sido abolida e o governo oferecia terras gratuitas para os imigrantes brasileiros.',
                shortText: 'Caravana de fuga a pé de 80% dos escravizados para o Uruguai.'
            }
        ]
    };
}

// ═══════ src/core/SaveSystem.js ═══════

/**
 * SaveSystem — salvamento automático em localStorage.
 *
 * Regras de segurança:
 *  - Todo acesso a localStorage e JSON.parse é envolvido em try/catch.
 *  - Save corrompido, de versão diferente ou com dados inválidos é DESCARTADO
 *    silenciosamente (o jogo inicia do zero, nunca trava).
 *  - collectedInfos são salvos apenas como IDs e re-hidratados a partir de
 *    GameState.INFO_DATA (fonte canônica); IDs desconhecidos são ignorados.
 */
const SAVE_KEY = 'ecos_do_brasil_save';
const SAVE_VERSION = 1;

// Cenas válidas para respawn (deve espelhar as chaves de SCENES no main.js)
const VALID_SCENES = [
    'biblioteca', 'templo', 'vila_rica', 'cambio', 'igreja', 'taverna',
    'rio_de_janeiro', 'sao_paulo', 'vitoria'
];

// Cenas interiores de Vila Rica: respawn seguro é a própria praça
const SCENE_REDIRECT = { cambio: 'vila_rica', igreja: 'vila_rica', taverna: 'vila_rica', vitoria: 'biblioteca' };

function storageAvailable() {
    try {
        const t = '__ecos_test__';
        localStorage.setItem(t, t);
        localStorage.removeItem(t);
        return true;
    } catch (_) {
        return false;
    }
}

const SaveSystem = {

    enabled: storageAvailable(),

    /**
     * Salva o estado atual. Nunca lança exceção.
     * @param {GameState} gameState
     * @param {string} sceneName — cena atual
     */
    save(gameState, sceneName) {
        if (!this.enabled) return false;
        try {
            const data = {
                version : SAVE_VERSION,
                savedAt : Date.now(),
                scene   : sceneName,
                state   : {
                    act               : gameState.act,
                    completedActs     : gameState.completedActs,
                    currentPhase      : gameState.currentPhase,
                    tutorialStep      : gameState.tutorialStep,
                    talkedToTeacher   : gameState.talkedToTeacher,
                    talkedToLibrarian : gameState.talkedToLibrarian,
                    bookFound         : gameState.bookFound,
                    arasyMet          : gameState.arasyMet,
                    puzzleAttempts    : gameState.puzzleAttempts,
                    gameWon           : gameState.gameWon,
                    infoIds           : gameState.collectedInfos.map(i => i.id),
                }
            };
            localStorage.setItem(SAVE_KEY, JSON.stringify(data));
            return true;
        } catch (err) {
            console.warn('💾 Falha ao salvar (jogo continua normalmente):', err);
            return false;
        }
    },

    /**
     * Carrega e valida o save. Retorna null se não existir ou for inválido.
     * @returns {{scene: string, state: Object} | null}
     */
    load() {
        if (!this.enabled) return null;
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (!raw) return null;

            const data = JSON.parse(raw);

            // Validação estrutural — qualquer inconsistência descarta o save
            if (!data || typeof data !== 'object')        return this._discard('formato');
            if (data.version !== SAVE_VERSION)            return this._discard('versão');
            if (!data.state || typeof data.state !== 'object') return this._discard('estado');
            if (typeof data.scene !== 'string')           return this._discard('cena');
            if (!VALID_SCENES.includes(data.scene))       return this._discard('cena inválida');

            const s = data.state;
            if (![1, 2, 3].includes(s.act))               return this._discard('ato');
            if (!Array.isArray(s.infoIds))                return this._discard('infos');

            // Redireciona cenas de interior para o hub correspondente
            const scene = SCENE_REDIRECT[data.scene] || data.scene;

            return { scene, state: s, savedAt: data.savedAt };
        } catch (err) {
            console.warn('💾 Save corrompido, descartado:', err);
            this.clear();
            return null;
        }
    },

    /**
     * Aplica um save validado ao GameState.
     * @param {GameState} gameState
     * @param {Object} state — objeto `state` retornado por load()
     */
    applyTo(gameState, state) {
        gameState.reset();
        gameState.act               = state.act;
        gameState.completedActs     = Array.isArray(state.completedActs) ? state.completedActs : [];
        gameState.currentPhase      = typeof state.currentPhase === 'string' ? state.currentPhase : 'biblioteca';
        gameState.tutorialStep      = Number.isInteger(state.tutorialStep) ? state.tutorialStep : 0;
        gameState.talkedToTeacher   = !!state.talkedToTeacher;
        gameState.talkedToLibrarian = !!state.talkedToLibrarian;
        gameState.bookFound         = !!state.bookFound;
        gameState.arasyMet          = !!(state.arasyMet ?? state.clioMet);
        gameState.puzzleAttempts    = Number.isInteger(state.puzzleAttempts) ? state.puzzleAttempts : 0;
        gameState.gameWon           = !!state.gameWon;

        // Re-hidrata infos a partir da fonte canônica (IDs desconhecidos ignorados)
        const allInfos = [
            ...GameState.INFO_DATA.vila_rica,
            ...GameState.INFO_DATA.rio_de_janeiro,
            ...GameState.INFO_DATA.sao_paulo,
        ];
        gameState.collectedInfos = state.infoIds
            .map(id => allInfos.find(i => i.id === id))
            .filter(Boolean);
    },

    clear() {
        if (!this.enabled) return;
        try { localStorage.removeItem(SAVE_KEY); } catch (_) { /* noop */ }
    },

    _discard(reason) {
        console.warn(`💾 Save descartado (${reason} incompatível). Iniciando novo jogo.`);
        this.clear();
        return null;
    }
};

// ═══════ src/core/AudioManager.js ═══════
/**
 * AudioManager — música de fundo + efeitos sonoros.
 *
 * Regras de segurança:
 *  - Autoplay: navegadores bloqueiam áudio antes do primeiro gesto do usuário.
 *    unlock() é chamado no primeiro keydown; até lá a música fica pendente.
 *  - Arquivo faltando/corrompido: warning único no console, jogo segue mudo.
 *  - Todo play() tem .catch — nenhuma falha de áudio interrompe o jogo.
 *  - Mute (tecla M) persistido em localStorage.
 */
const MUTE_KEY = 'ecos_do_brasil_muted';

const TRACKS = {
    musica_biblioteca : './assets/audio/musica_biblioteca.mp3',
    musica_templo     : './assets/audio/musica_templo.mp3',
    musica_vila_rica  : './assets/audio/musica_vila_rica.mp3',
    musica_rio        : './assets/audio/musica_rio.mp3',
    musica_sao_paulo  : './assets/audio/musica_sao_paulo.mp3',
    musica_vitoria    : './assets/audio/musica_vitoria.mp3',
    sfx_blip          : './assets/audio/sfx_blip.mp3',
    sfx_confirm       : './assets/audio/sfx_confirm.mp3',
    sfx_collect       : './assets/audio/sfx_collect.mp3',
    sfx_portal        : './assets/audio/sfx_portal.mp3',
    sfx_error         : './assets/audio/sfx_error.mp3',
};

const MUSIC_VOLUME = 0.55;
const SFX_VOLUME   = 0.7;
const FADE_MS      = 600;

class AudioManager {
    constructor() {
        this.unlocked     = false;
        this.pendingMusic = null;
        this.current      = null;   // { name, el }
        this.broken       = new Set();
        this.elements     = {};
        this._fadeTimer   = null;

        try {
            this.muted = localStorage.getItem(MUTE_KEY) === '1';
        } catch (_) {
            this.muted = false;
        }
    }

    _get(name) {
        if (this.broken.has(name)) return null;
        if (!TRACKS[name]) { console.warn(`🔇 Faixa desconhecida: ${name}`); return null; }
        if (!this.elements[name]) {
            try {
                const el = new Audio(TRACKS[name]);
                el.preload = 'auto';
                el.addEventListener('error', () => {
                    if (!this.broken.has(name)) {
                        console.warn(`🔇 Áudio não carregou (jogo segue sem ele): ${TRACKS[name]}`);
                        this.broken.add(name);
                    }
                });
                this.elements[name] = el;
            } catch (_) {
                this.broken.add(name);
                return null;
            }
        }
        return this.elements[name];
    }

    /** Chamado no primeiro gesto do usuário (keydown). */
    unlock() {
        if (this.unlocked) return;
        this.unlocked = true;
        if (this.pendingMusic) {
            const name = this.pendingMusic;
            this.pendingMusic = null;
            this.playMusic(name);
        }
    }

    /** Toca música em loop, com crossfade se já houver outra tocando. */
    playMusic(name) {
        if (!name) return;
        if (!this.unlocked) { this.pendingMusic = name; return; }
        if (this.current && this.current.name === name) return;

        const el = this._get(name);

        // Fade-out da faixa atual (mesmo que a nova tenha falhado)
        const old = this.current;
        this.current = el ? { name, el } : null;
        if (this._fadeTimer) { clearInterval(this._fadeTimer); this._fadeTimer = null; }

        if (el) {
            el.loop = true;
            el.volume = 0;
            el.currentTime = 0;
            el.muted = this.muted;
            el.play().catch(() => { /* autoplay bloqueado ou arquivo ruim — segue mudo */ });
        }

        const steps = 12;
        let step = 0;
        this._fadeTimer = setInterval(() => {
            step++;
            const t = step / steps;
            try {
                if (old && old.el) old.el.volume = Math.max(0, MUSIC_VOLUME * (1 - t));
                if (el) el.volume = Math.min(MUSIC_VOLUME, MUSIC_VOLUME * t);
            } catch (_) { /* noop */ }
            if (step >= steps) {
                clearInterval(this._fadeTimer);
                this._fadeTimer = null;
                if (old && old.el) { try { old.el.pause(); } catch (_) {} }
            }
        }, FADE_MS / steps);
    }

    /** Toca um efeito sonoro curto (pode sobrepor). */
    playSfx(name) {
        if (!this.unlocked || this.muted) return;
        const el = this._get(name);
        if (!el) return;
        try {
            const clone = el.cloneNode();
            clone.volume = SFX_VOLUME;
            clone.play().catch(() => { /* noop */ });
        } catch (_) { /* noop */ }
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.current && this.current.el) {
            try { this.current.el.muted = this.muted; } catch (_) {}
        }
        try { localStorage.setItem(MUTE_KEY, this.muted ? '1' : '0'); } catch (_) {}
        console.log(this.muted ? '🔇 Som desligado (M para ligar)' : '🔊 Som ligado');
        return this.muted;
    }
}

// ═══════ src/entities/NPC.js ═══════
/**
 * NPC — Personagem não-jogável.
 *
 * Suporta:
 *  - Spritesheet (se fornecida)
 *  - Fallback visual: silhueta pixelart colorida com nome
 *  - infoData: ao interagir, registra informação no GameState
 *  - hasSpoken: muda diálogo após primeira interação
 */
class NPC {
    /**
     * Fator visual padrão dos NPCs adultos (maior que o protagonista-criança).
     * Ver regra de escala em CLAUDE.md. Não afeta hitbox/colisão — apenas o desenho.
     */
    static DEFAULT_RENDER_SCALE = 1.5;

    constructor(x, y, config = {}) {
        this.x = x;
        this.y = y;
        this.width  = config.width  || 16;
        this.height = config.height || 24;
        this.name   = config.name   || 'NPC';
        this.color  = config.color  || '#787880';
        this.accentColor = config.accentColor || '#aaa';

        // Escala visual (não altera hitbox/colisão, só o desenho — NPCs adultos > Alex)
        this.renderScale = config.renderScale ?? NPC.DEFAULT_RENDER_SCALE;

        // Sprite (opcional)
        this.spriteSheet  = config.spriteSheet || null;
        this.frameW       = config.frameW    || 32;
        this.frameH       = config.frameH    || 32;
        this.facing       = config.facing    || 0;
        this.maxFrames    = config.maxFrames || 2;
        this.frameOffsetX = config.frameOffsetX || 0; // Coluna inicial da animação no sheet

        // Animação
        this.animFrame = 0;
        this.animTimer = 0;
        this.animSpeed = 0.5;

        // Diálogos
        this.dialogueLines      = config.dialogueLines || [{ speaker: this.name, text: '...' }];
        this.afterDialogueLines = config.afterDialogueLines || null;
        this.onInteractComplete = config.onInteractComplete || null;
        this.hasSpoken          = false;

        // Informação coletável (para Vila Rica)
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

    /** Altura extra (px) que o desenho ganha acima de this.y por causa do renderScale. */
    _visualTopOffset() {
        return (this.height * this.renderScale - this.height);
    }

    draw(ctx) {
        if (this.spriteSheet && this.spriteSheet.complete) {
            const sx = (this.frameOffsetX + this.animFrame) * this.frameW;
            const sy = this.facing * this.frameH;

            // Sombra nos pés (tamanho ligado à hitbox, não à escala visual)
            ctx.fillStyle = 'rgba(0,0,0,0.22)';
            ctx.beginPath();
            ctx.ellipse(this.x + this.width / 2, this.y + this.height - 1, this.width / 2.4, 2, 0, 0, Math.PI * 2);
            ctx.fill();

            // Desenho maior que a hitbox, ancorado nos pés (this.x/this.y/this.width/this.height
            // continuam sendo a hitbox real usada pela colisão — só o retângulo de destino cresce).
            const drawW = this.width  * this.renderScale;
            const drawH = this.height * this.renderScale;
            const drawX = this.x + (this.width  - drawW) / 2;
            const drawY = this.y + this.height - drawH;

            ctx.drawImage(this.spriteSheet,
                sx, sy, this.frameW, this.frameH,
                drawX, drawY, drawW, drawH);

            // Indicador "!" flutuante (ainda não conversou)
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

        // ── Fallback: silhueta pixelart ──
        this._drawFallbackCharacter(ctx);
        this._drawNameTag(ctx);
    }

    _drawFallbackCharacter(ctx) {
        const cx = this.x + this.width / 2;
        const baseY = this.y + this.height;

        // Escala visual em torno dos pés (hitbox real não muda — ver renderScale).
        ctx.save();
        ctx.translate(cx, baseY);
        ctx.scale(this.renderScale, this.renderScale);
        ctx.translate(-cx, -baseY);

        const bob = Math.sin(this.animTimer * 4) * 0.6; // Suave balanço de respiração

        const nameLower = this.name.toLowerCase();
        
        let isFemale = nameLower.includes('professora') || nameLower.includes('bibliotecaria') || 
                       nameLower.includes('baronesa') || nameLower.includes('duquesa') || nameLower.includes('arasy');
        let isNoble = nameLower.includes('aristocrata') || nameLower.includes('fazendeiro') || 
                      nameLower.includes('senador') || nameLower.includes('deodoro') || nameLower.includes('negociador');
        let isSoldier = nameLower.includes('guarda') || nameLower.includes('soldado');
        let isMerchant = nameLower.includes('vendedor') || nameLower.includes('ambulante');
        let isSpy = nameLower.includes('espiao');

        // Sombra nos pés
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.beginPath();
        ctx.ellipse(cx, baseY - 1, this.width / 2.2, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        const skinColor = '#e8c89e';

        // 1. Pernas & Sapatos (com sombreamento)
        const legH = Math.round(this.height * 0.28);
        const legW = 2.5;
        const pantsColor = isSoldier ? '#1A237E' : (isNoble ? '#222' : '#3e2723');
        const shoeColor = '#141414';

        if (isFemale) {
            // Saia longa para adultas
            ctx.fillStyle = this.color;
            ctx.fillRect(cx - 5, baseY - legH - 2, 10, legH + 1);
            
            // Sombra interna da saia (lado direito)
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.fillRect(cx, baseY - legH - 2, 5, legH + 1);
            
            // Sapatos
            ctx.fillStyle = shoeColor;
            ctx.fillRect(cx - 4, baseY - 1, 2.5, 1.5);
            ctx.fillRect(cx + 1.5, baseY - 1, 2.5, 1.5);
        } else {
            // Perna Esquerda
            ctx.fillStyle = pantsColor;
            ctx.fillRect(cx - 3.5, baseY - legH - 1, legW, legH);
            ctx.fillStyle = shoeColor;
            ctx.fillRect(cx - 4.5, baseY - 1.5, 3.5, 1.5);

            // Perna Direita (ligeiramente sombreada por profundidade)
            ctx.fillStyle = pantsColor;
            ctx.fillRect(cx + 1, baseY - legH - 1, legW, legH);
            ctx.fillStyle = 'rgba(0,0,0,0.12)';
            ctx.fillRect(cx + 1, baseY - legH - 1, legW, legH);
            ctx.fillStyle = shoeColor;
            ctx.fillRect(cx + 1, baseY - 1.5, 3.5, 1.5);
        }

        // 2. Tronco / Corpo (com volume 3D)
        const torsoH = Math.round(this.height * 0.38);
        const torsoW = this.width * 0.55;
        const torsoX = cx - torsoW / 2;
        const torsoY = baseY - legH - torsoH - 1 + bob;

        // Base do casaco/roupa
        ctx.fillStyle = this.color;
        ctx.fillRect(torsoX, torsoY, torsoW, torsoH);

        // Highlight na lateral esquerda do corpo (brilho 3D)
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(torsoX, torsoY, 2, torsoH);

        // Sombra na lateral direita do corpo
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(cx, torsoY, torsoW / 2, torsoH);

        // Detalhes da vestimenta de época
        if (isNoble) {
            // Camisa branca interna
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(cx - 1.5, torsoY, 3, 5);
            // Gravata / Cravat vermelha com nó
            ctx.fillStyle = '#d32f2f';
            ctx.fillRect(cx - 0.5, torsoY + 2, 1, 3);
            // Lapelas do casaco
            ctx.fillStyle = '#222222';
            ctx.fillRect(cx - 3, torsoY, 1, torsoH);
            ctx.fillRect(cx + 2, torsoY, 1, torsoH);
        } else if (isSoldier) {
            // Detalhes dourados do uniforme
            ctx.fillStyle = '#FFD700'; 
            ctx.fillRect(cx - 1, torsoY + 2, 2, 1.5);
            ctx.fillRect(cx - 1, torsoY + 5, 2, 1.5);
            // Dragona militar dourada nos ombros
            ctx.fillRect(torsoX - 1.5, torsoY - 0.5, 3, 1.5);
            ctx.fillRect(torsoX + torsoW - 1.5, torsoY - 0.5, 3, 1.5);
        } else if (isMerchant) {
            // Camisa por baixo (creme)
            ctx.fillStyle = '#FFFDD0';
            ctx.fillRect(cx - 2, torsoY, 4, torsoH);
            // Suspensórios marrons escuros
            ctx.fillStyle = '#3e2723';
            ctx.fillRect(cx - 2.5, torsoY, 1, torsoH);
            ctx.fillRect(cx + 1.5, torsoY, 1, torsoH);
        }

        // 3. Braços e Mãos (3D / Esquerdo frontal, Direito sombreado)
        const armW = 2;
        const armH = torsoH - 1;

        // Braço Esquerdo
        ctx.fillStyle = this.color;
        ctx.fillRect(torsoX - armW, torsoY + 1, armW, armH);
        ctx.fillStyle = 'rgba(255,255,255,0.1)'; // brilho
        ctx.fillRect(torsoX - armW, torsoY + 1, 1, armH);
        ctx.fillStyle = skinColor;
        ctx.fillRect(torsoX - armW, torsoY + 1 + armH, armW, 2);

        // Braço Direito
        ctx.fillStyle = this.color;
        ctx.fillRect(torsoX + torsoW, torsoY + 1, armW, armH);
        ctx.fillStyle = 'rgba(0,0,0,0.18)'; // sombra de profundidade
        ctx.fillRect(torsoX + torsoW, torsoY + 1, armW, armH);
        ctx.fillStyle = skinColor;
        ctx.fillRect(torsoX + torsoW, torsoY + 1 + armH, armW, 2);

        // 4. Cabeça e Rosto
        const headR = this.width * 0.25;
        const headY = torsoY - headR * 0.7;

        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.arc(cx, headY, headR, 0, Math.PI * 2);
        ctx.fill();

        // 5. Cabelos, Barbas e Chapéus
        ctx.fillStyle = this.accentColor;
        
        if (isFemale) {
            // Cabelo volumoso com coque
            ctx.beginPath();
            ctx.arc(cx, headY - 1, headR * 0.95, Math.PI, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx, headY - headR, 3.2, 0, Math.PI * 2);
            ctx.fill();
            // Brilho no coque/cabelo
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.fillRect(cx - 1, headY - headR - 1, 2, 2);
            
            if (nameLower.includes('baronesa') || nameLower.includes('duquesa')) {
                ctx.fillStyle = '#FFD700'; // Tiara dourada
                ctx.fillRect(cx - 3, headY - headR, 6, 1.5);
                ctx.fillStyle = '#00E5FF'; // Joia azul no centro da tiara
                ctx.fillRect(cx - 0.5, headY - headR, 1, 1);
            }
        } else {
            // Cabelo masculino
            ctx.beginPath();
            ctx.arc(cx, headY - 1, headR * 0.9, Math.PI, Math.PI * 2);
            ctx.fill();
            
            // Barba histórica volumosa
            if (nameLower.includes('deodoro') || nameLower.includes('nabuco') || nameLower.includes('patrocinio') || nameLower.includes('senador')) {
                ctx.fillStyle = this.accentColor;
                ctx.fillRect(cx - 3, headY + 1, 6, 3.5);
                // Detalhe de textura/grisalho na barba
                ctx.fillStyle = 'rgba(255,255,255,0.25)';
                ctx.fillRect(cx - 2, headY + 2, 4, 1);
            }
            
            // Chapéus tridimensionais detalhados
            if (isNoble) {
                // Cartola preta (Top Hat)
                ctx.fillStyle = '#181818'; 
                ctx.fillRect(cx - 5.5, headY - headR, 11, 1.5); // Aba
                ctx.fillRect(cx - 3.5, headY - headR - 6, 7, 6); // Copa
                // Faixa vermelha da cartola
                ctx.fillStyle = '#c62828';
                ctx.fillRect(cx - 3.5, headY - headR - 1.5, 7, 1.5);
                // Fivela dourada na cartola
                ctx.fillStyle = '#FFD700';
                ctx.fillRect(cx - 1, headY - headR - 1.5, 2, 1.5);
            } else if (isMerchant) {
                // Chapéu simples
                ctx.fillStyle = '#8d6e63';
                ctx.fillRect(cx - 5, headY - headR, 10, 1.5);
                ctx.fillRect(cx - 3, headY - headR - 2.5, 6, 2.5);
                ctx.fillStyle = '#5d4037'; // Faixa marrom escura
                ctx.fillRect(cx - 3, headY - headR - 1, 6, 1);
            } else if (isSoldier) {
                // Quepe militar detalhado
                ctx.fillStyle = '#0D47A1';
                ctx.fillRect(cx - 4.5, headY - headR - 2, 9, 3.5); // Copa
                ctx.fillStyle = '#1565C0'; // Visor/Highlight
                ctx.fillRect(cx - 4, headY - headR - 2, 8, 1);
                ctx.fillStyle = '#FFD700'; // Escudo militar no centro
                ctx.fillRect(cx - 0.5, headY - headR - 1, 1, 1.5);
            } else if (isSpy) {
                // Chapéu de espião aba larga
                ctx.fillStyle = '#263238';
                ctx.fillRect(cx - 6.5, headY - headR, 13, 1.5); // Aba larga
                ctx.fillRect(cx - 3.5, headY - headR - 2.5, 7, 2.5);
            }
        }

        // 6. Detalhes Faciais (Olhos com brilho, bochechas, etc.)
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(cx - 2, headY - 1, 1.2, 1.2);
        ctx.fillRect(cx + 1, headY - 1, 1.2, 1.2);

        // Brilho sutil nos olhos (pixel art highlight)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cx - 1.6, headY - 1, 0.5, 0.5);
        ctx.fillRect(cx + 1.4, headY - 1, 0.5, 0.5);

        // Blush sutil nas bochechas para as mulheres
        if (isFemale) {
            ctx.fillStyle = 'rgba(255, 120, 120, 0.4)';
            ctx.fillRect(cx - 3, headY + 0.5, 1.2, 1);
            ctx.fillRect(cx + 1.8, headY + 0.5, 1.2, 1);
        }

        // Bigode simples de época para a maioria dos homens
        if (!isFemale && (isNoble || nameLower.includes('contador') || nameLower.includes('mineiro'))) {
            ctx.fillStyle = '#2d1e18';
            ctx.fillRect(cx - 2.5, headY + 1.2, 5, 1);
            // Pontas do bigode curvadas para cima
            ctx.fillRect(cx - 3.5, headY + 0.8, 1, 1);
            ctx.fillRect(cx + 2.5, headY + 0.8, 1, 1);
        }

        // Indicador "!" flutuante
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
        // Caixa de colisão física restrita aos pés para melhor movimentação
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

    /**
     * Caixa usada para detectar interação (checkInteraction) e para o overlay
     * de debug (F3). Por padrão é a própria x/y/width/height do NPC — correto
     * para o desenho pixelart genérico, que preenche essa caixa. Subclasses com
     * desenho próprio cujo visual real não coincide com essa caixa (ex.: Arasy)
     * devem sobrescrever este método para refletir as dimensões reais desenhadas.
     */
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
// ═══════ src/entities/Player.js ═══════


/**
 * Player — Alex.
 *
 * Spritesheet: Cute Fantasy Free (Player.png — 192x320, 6 col x 10 row de 32px).
 * Rows de caminhada: 0=baixo, 1=esquerda(sheet própria), 2=cima, 3=direita.
 *
 * Movimentação:
 *  - Velocidade normalizada na diagonal.
 *  - Colisão resolvida por eixo (desliza em paredes).
 *  - "Corner assist": ao esbarrar na quina de um obstáculo, o jogador é
 *    deslizado suavemente para contorná-la em vez de travar.
 */
class Player {

    /** facing → row na spritesheet de caminhada. */
    static DIR_ROW = [0, 2, 1, 1];

    /**
     * Distância máxima (px) do auxílio de quina. Quanto maior, mais o jogador
     * "desliza" para dentro de portas/passagens estreitas sem precisar alinhar
     * pixel a pixel — reduz a sensação de travar na entrada/saída de locais.
     */
    static CORNER_ASSIST_RANGE = 9;

    constructor(x, y, config = {}) {
        this.x = x;
        this.y = y;

        // Hitbox (nos pés do personagem)
        this.width  = config.hitboxW || 10;
        this.height = config.hitboxH || 10;

        this.speed  = config.speed || 110;
        this.facing = 0;             // 0=baixo 1=cima 2=esquerda 3=direita

        // Spritesheet
        this.spriteSheet = config.spriteSheet || null;
        this.spriteLeft  = config.spriteLeft  || null;
        this.frameW      = config.frameW      || 32;
        this.frameH      = config.frameH      || 32;
        this.maxFrames   = config.maxFrames   || 6;

        // Animação
        this.animFrame = 0;
        this.animTimer = 0;
        this.animSpeed = config.animSpeed || 0.12;
        this.isMoving  = false;
        this.hasMoved  = false;      // usado pelo tutorial

        this.fallbackColor = config.fallbackColor || '#3a7898';

        this._recalcOffsets();
    }

    _recalcOffsets() {
        this.spriteOffsetX = -(this.frameW - this.width) / 2;
        this.spriteOffsetY = Math.round(-(this.frameH - this.height) * 0.64);
    }

    /**
     * Atualiza input, movimento, colisões e animação.
     * @param {number} dt
     * @param {import('../core/Input.js').Input} input
     * @param {import('../world/Map.js').Map|null} gameMap
     * @param {Array} interactables — para colisão com NPCs
     */
    update(dt, input, gameMap = null, interactables = []) {
        const { dx, dy } = this._readDirection(input);

        this.isMoving = (dx !== 0 || dy !== 0);
        if (this.isMoving) this.hasMoved = true;

        if (this.isMoving) {
            this._move(dx * this.speed * dt, dy * this.speed * dt, gameMap, interactables);
            this._advanceAnimation(dt);
        } else {
            this.animFrame = 0;
            this.animTimer = 0;
        }
    }

    /** Lê o teclado e devolve o vetor de direção normalizado. */
    _readDirection(input) {
        let dx = 0, dy = 0;
        if (input.isDown('ArrowUp')    || input.isDown('KeyW')) { dy = -1; this.facing = 1; }
        if (input.isDown('ArrowDown')  || input.isDown('KeyS')) { dy =  1; this.facing = 0; }
        if (input.isDown('ArrowLeft')  || input.isDown('KeyA')) { dx = -1; this.facing = 2; }
        if (input.isDown('ArrowRight') || input.isDown('KeyD')) { dx =  1; this.facing = 3; }

        // Diagonal não pode ser mais rápida que os eixos
        if (dx !== 0 && dy !== 0) {
            const INV_SQRT2 = 0.7071;
            dx *= INV_SQRT2;
            dy *= INV_SQRT2;
        }
        return { dx, dy };
    }

    /** Move com colisão por eixo + auxílio de quina. */
    _move(mx, my, gameMap, interactables) {
        if (!gameMap) {
            this.x += mx;
            this.y += my;
            return;
        }

        const blockedAt = (x, y) =>
            gameMap.isColliding(x, y, this.width, this.height) ||
            this._collidesWithNPCs(x, y, interactables);

        // Eixo X
        if (mx !== 0) {
            if (!blockedAt(this.x + mx, this.y)) {
                this.x += mx;
            } else if (my === 0) {
                this._cornerAssist(mx, 0, blockedAt);
            }
        }

        // Eixo Y
        if (my !== 0) {
            if (!blockedAt(this.x, this.y + my)) {
                this.y += my;
            } else if (mx === 0) {
                this._cornerAssist(0, my, blockedAt);
            }
        }
    }

    /**
     * Auxílio de quina: se o caminho reto está bloqueado apenas pela
     * borda de um obstáculo, desliza no eixo perpendicular para contorná-lo.
     */
    _cornerAssist(mx, my, blockedAt) {
        const range = Player.CORNER_ASSIST_RANGE;
        const step  = Math.max(Math.abs(mx), Math.abs(my));

        for (let offset = 1; offset <= range; offset++) {
            if (mx !== 0) { // movendo em X: tenta desviar em Y
                if (!blockedAt(this.x + mx, this.y - offset)) { this.y -= step; return; }
                if (!blockedAt(this.x + mx, this.y + offset)) { this.y += step; return; }
            } else {        // movendo em Y: tenta desviar em X
                if (!blockedAt(this.x - offset, this.y + my)) { this.x -= step; return; }
                if (!blockedAt(this.x + offset, this.y + my)) { this.x += step; return; }
            }
        }
    }

    _advanceAnimation(dt) {
        this.animTimer += dt;
        if (this.animTimer >= this.animSpeed) {
            this.animFrame = (this.animFrame + 1) % this.maxFrames;
            this.animTimer = 0;
        }
    }

    /** Colisão física contra NPCs (usa hitbox dos pés de cada um). */
    _collidesWithNPCs(x, y, interactables) {
        const box = { x, y, width: this.width, height: this.height };
        for (const obj of interactables) {
            if (!(obj instanceof NPC)) continue;
            if (rectsOverlap(box, obj.getHitbox())) return true;
        }
        return false;
    }

    /**
     * Caixa de interação projetada na frente do jogador, na direção que
     * ele está encarando (facing). Centralizada no eixo perpendicular ao
     * movimento, para que um NPC alinhado com o jogador seja detectado
     * independente de ligeiras variações de posição — não só quando
     * exatamente ombro-a-ombro com a hitbox.
     */
    getInteractionBox() {
        const size = 20;
        const cx = this.x + this.width  / 2;
        const cy = this.y + this.height / 2;
        switch (this.facing) {
            case 0: return { x: cx - size / 2,      y: this.y + this.height, width: size, height: size }; // baixo
            case 1: return { x: cx - size / 2,      y: this.y - size,        width: size, height: size }; // cima
            case 2: return { x: this.x - size,      y: cy - size / 2,        width: size, height: size }; // esquerda
            default: return { x: this.x + this.width, y: cy - size / 2,      width: size, height: size }; // direita
        }
    }

    /** Empurra o jogador para fora de colisões no spawn. */
    resolveCollision(gameMap) {
        if (!gameMap || !gameMap.isColliding(this.x, this.y, this.width, this.height)) return;

        const STEP = 2, MAX_DIST = 64;
        for (let dist = STEP; dist <= MAX_DIST; dist += STEP) {
            const offsets = [
                { dx: 0, dy: dist }, { dx: 0, dy: -dist },
                { dx: dist, dy: 0 }, { dx: -dist, dy: 0 },
                { dx: dist, dy: dist }, { dx: -dist, dy: dist },
                { dx: dist, dy: -dist }, { dx: -dist, dy: -dist },
            ];
            for (const { dx, dy } of offsets) {
                if (!gameMap.isColliding(this.x + dx, this.y + dy, this.width, this.height)) {
                    this.x += dx;
                    this.y += dy;
                    return;
                }
            }
        }
        console.warn('⚠️ Não foi possível resolver colisão de spawn!');
    }

    draw(ctx) {
        const drawX = this.x + this.spriteOffsetX;
        const drawY = this.y + this.spriteOffsetY;

        if (this.spriteSheet && this.spriteSheet.complete && this.spriteSheet.naturalWidth > 0) {
            let sheet = this.spriteSheet;
            let row   = Player.DIR_ROW[this.facing] || 0;

            // Direção esquerda usa spritesheet dedicada
            if (this.facing === 2 && this.spriteLeft && this.spriteLeft.complete) {
                sheet = this.spriteLeft;
                row   = 1;
            }

            ctx.drawImage(sheet,
                this.animFrame * this.frameW, row * this.frameH, this.frameW, this.frameH,
                drawX, drawY, this.frameW, this.frameH);
            return;
        }

        ctx.fillStyle = this.fallbackColor;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

// ═══════ src/entities/Arasy.js ═══════

/**
 * Arasy — a guardiã indígena da memória histórica do Brasil.
 *
 * Nome tupi-guarani: de "ara" (dia, tempo, céu) + "sy" (mãe, origem) — "mãe do
 * tempo/do dia", figura da mitologia guarani ligada à criação do mundo. Aqui,
 * a que guarda o tempo e a memória do povo brasileiro.
 *
 * Representada como uma mulher INDÍGENA brasileira, desenhada em pixel art
 * procedural (não depende de spritesheet): pele morena, cabelo liso preto,
 * cocar de penas (verde/amarelo/vermelho), pintura facial de urucum, colar de
 * sementes e túnica de fibra natural com grafismo geométrico. A aura dourada
 * e as partículas representam a "memória viva" que ela protege — não é um
 * anjo nem uma figura mitológica europeia.
 */
class Arasy extends NPC {

    static PALETTE = Object.freeze({
        skin        : '#8d5a3b',
        skinShade   : '#71462e',
        hair        : '#17110b',
        garment     : '#b5744a',   // fibra natural / terracota
        garmentShade: '#8f5836',
        pattern     : '#c0392b',   // grafismo urucum (vermelho)
        patternDark : '#3a2417',
        headband    : '#5a3720',   // faixa do cocar
        trim        : '#e6b422',   // adornos dourados
        beads       : '#f4ead2',   // sementes claras do colar
        featherG    : '#2E7D32',   // pena verde
        featherY    : '#e6b422',   // pena amarela
        featherR    : '#c0392b',   // pena vermelha
        paint       : '#c0392b',   // pintura facial (urucum)
        eyes        : '#241812',
    });

    constructor(x, y) {
        super(x, y, { name: 'Arasy', width: 18, height: 30 });
        this.glowTimer = 0;
        this.particles = Array.from({ length: 10 }, () => this._createParticle());
        this.hasBeenIntroduced = false;
    }

    /**
     * A silhueta real desenhada em _drawGuardian (cocar de penas + túnica) não
     * preenche o retângulo 18x30 inteiro: as penas do cocar sobem ~3px acima de
     * this.y e a barra da túnica termina ~4px antes de this.y+height. Sem este
     * ajuste, a caixa de interação/debug sobra vazio embaixo e corta o topo das
     * penas. Valores calculados a partir das coordenadas fixas de _drawGuardian
     * (ignorando a flutuação "bob", que é só ±2.5px).
     */
    getDetectionBox() {
        return { x: this.x + 2, y: this.y - 4, width: 14, height: 30 };
    }

    _createParticle() {
        return {
            x: this.x + Math.random() * this.width,
            y: this.y + Math.random() * this.height,
            vx: (Math.random() - 0.5) * 6,
            vy: -8 - Math.random() * 12,
            life: Math.random() * 2,
            maxLife: 2,
        };
    }

    update(dt) {
        super.update(dt);
        this.glowTimer += dt;
        for (const p of this.particles) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            if (p.life <= 0) Object.assign(p, this._createParticle());
        }
    }

    draw(ctx) {
        const bob = Math.sin(this.glowTimer * 2) * 2.5;
        this._drawAura(ctx);
        this._drawGuardian(ctx, bob);
        this._drawParticles(ctx);
        this._drawNameTag(ctx);
    }

    /** Pixel art da guardiã indígena (18x30, ancorada em this.x/this.y). */
    _drawGuardian(ctx, bob) {
        const P  = Arasy.PALETTE;
        const x  = this.x;
        const y  = this.y + bob;
        const cx = x + this.width / 2;

        // Brilho dourado sob os pés (memória/aura)
        ctx.fillStyle = 'rgba(230, 180, 60, 0.35)';
        ctx.beginPath();
        ctx.ellipse(cx, this.y + this.height + 2, 9, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // ── Túnica de fibra natural (silhueta em A) ──
        ctx.fillStyle = P.garment;
        ctx.beginPath();
        ctx.moveTo(cx - 3.5, y + 10);
        ctx.lineTo(cx + 3.5, y + 10);
        ctx.lineTo(cx + 7,   y + 26);
        ctx.lineTo(cx - 7,   y + 26);
        ctx.closePath();
        ctx.fill();
        // sombra lateral
        ctx.fillStyle = P.garmentShade;
        ctx.beginPath();
        ctx.moveTo(cx + 1,   y + 10);
        ctx.lineTo(cx + 3.5, y + 10);
        ctx.lineTo(cx + 7,   y + 26);
        ctx.lineTo(cx + 2,   y + 26);
        ctx.closePath();
        ctx.fill();

        // Grafismo geométrico indígena (urucum) na túnica
        ctx.fillStyle = P.pattern;
        ctx.fillRect(cx - 6, y + 17, 13, 2.2);
        ctx.fillStyle = P.patternDark;
        for (let i = -6; i <= 6; i += 2.6) ctx.fillRect(cx + i, y + 17, 1.2, 2.2);
        // barra da bainha
        ctx.fillStyle = P.pattern;
        ctx.fillRect(cx - 7, y + 24.5, 14, 1.5);

        // ── Braços e mãos ──
        ctx.fillStyle = P.skin;
        ctx.fillRect(cx - 6.5, y + 11, 2.5, 8);
        ctx.fillRect(cx + 4,   y + 11, 2.5, 8);
        ctx.fillStyle = P.skinShade;
        ctx.fillRect(cx + 5,   y + 11, 1.5, 8);   // sombra no braço direito
        ctx.fillStyle = P.skin;
        ctx.fillRect(cx - 6.5, y + 19, 2.5, 2);
        ctx.fillRect(cx + 4,   y + 19, 2.5, 2);
        // braceletes dourados
        ctx.fillStyle = P.trim;
        ctx.fillRect(cx - 6.5, y + 14.5, 2.5, 1);
        ctx.fillRect(cx + 4,   y + 14.5, 2.5, 1);

        // Colar de sementes
        ctx.fillStyle = P.beads;
        ctx.fillRect(cx - 2.5, y + 10.5, 5, 1);
        ctx.fillStyle = P.pattern;
        ctx.fillRect(cx - 0.5, y + 11.3, 1, 1);   // pingente central

        // ── Pescoço e cabeça ──
        ctx.fillStyle = P.skin;
        ctx.fillRect(cx - 1.5, y + 8.5, 3, 2);
        ctx.beginPath();
        ctx.arc(cx, y + 5.5, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = P.skinShade;
        ctx.beginPath();
        ctx.arc(cx + 1.5, y + 6, 3.2, -0.6, 1.3);
        ctx.fill();

        // ── Cabelo liso preto ──
        ctx.fillStyle = P.hair;
        ctx.fillRect(cx - 4.9, y + 3, 1.9, 8.5);   // lateral esquerda longa
        ctx.fillRect(cx + 3,   y + 3, 1.9, 8.5);   // lateral direita longa
        ctx.beginPath();
        ctx.arc(cx, y + 4, 4.9, Math.PI * 0.92, Math.PI * 2.08);   // calota
        ctx.fill();
        ctx.fillRect(cx - 4.4, y + 2.6, 8.8, 1.6);   // franja reta

        // ── Cocar (penas + faixa) ──
        const feather = (fx, h, color) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(cx + fx,       y + 2.5);
            ctx.lineTo(cx + fx - 1.1, y + 2.5 - h * 0.45);
            ctx.lineTo(cx + fx,       y + 2.5 - h);
            ctx.lineTo(cx + fx + 1.1, y + 2.5 - h * 0.45);
            ctx.closePath();
            ctx.fill();
        };
        feather(-4, 3.5, P.featherR);
        feather(-2, 4.8, P.featherG);
        feather( 0, 5.6, P.featherY);
        feather( 2, 4.8, P.featherG);
        feather( 4, 3.5, P.featherR);
        // faixa da testa (por cima das bases das penas)
        ctx.fillStyle = P.headband;
        ctx.fillRect(cx - 4.9, y + 2.2, 9.8, 1.7);
        ctx.fillStyle = P.trim;
        ctx.fillRect(cx - 4.9, y + 3.2, 9.8, 0.6);   // fio dourado na faixa
        // contas coloridas na faixa
        ctx.fillStyle = P.featherY;
        ctx.fillRect(cx - 3.5, y + 2.5, 0.9, 0.9);
        ctx.fillRect(cx - 0.4, y + 2.5, 0.9, 0.9);
        ctx.fillRect(cx + 2.6, y + 2.5, 0.9, 0.9);

        // ── Rosto: pintura de urucum + olhos ──
        ctx.fillStyle = P.paint;
        ctx.fillRect(cx - 3.2, y + 6.3, 1.9, 0.9);
        ctx.fillRect(cx + 1.3, y + 6.3, 1.9, 0.9);
        ctx.fillStyle = P.eyes;
        ctx.fillRect(cx - 2.2, y + 5, 1.2, 1.4);
        ctx.fillRect(cx + 1,   y + 5, 1.2, 1.4);
        ctx.fillStyle = '#fff';
        ctx.fillRect(cx - 1.9, y + 5, 0.5, 0.5);
        ctx.fillRect(cx + 1.3, y + 5, 0.5, 0.5);
    }

    _drawAura(ctx) {
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const radius = 24 + Math.sin(this.glowTimer * 4) * 4;

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        grad.addColorStop(0, 'rgba(255, 230, 150, 0.4)');
        grad.addColorStop(0.5, 'rgba(120, 220, 140, 0.12)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    _drawParticles(ctx) {
        ctx.fillStyle = '#FFF';
        for (const p of this.particles) {
            ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
            ctx.beginPath();
            ctx.arc(p.x, p.y, 1, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
}

// ═══════ src/entities/Interactable.js ═══════
/**
 * Interactable — Objeto interagível no mundo.
 *
 * Tipos:
 *  - Portal (porta_igreja, saida_biblioteca, etc.): invisível, ativado por proximidade
 *  - Item (item_diario, etc.): pode ter glow sutil se configurado
 *  - Objeto de cenário (estatua_tiradentes, etc.): invisível, ativado por proximidade
 *
 * config.visible = true → desenha indicador visual (padrão: false para portais)
 */
class Interactable {
    constructor(x, y, config = {}) {
        this.x = x;
        this.y = y;
        this.width  = config.width  || 16;
        this.height = config.height || 16;
        this.name   = config.name   || 'Objeto';

        // Diálogos: [{ speaker: 'Nome', text: 'Fala...' }, ...]
        this.dialogueLines = config.dialogueLines || [];

        // Callback executado após o diálogo terminar
        this.onInteractComplete = config.onInteractComplete || null;

        // Estado
        this.canInteract = true;
        this.customDraw = config.customDraw || null;

        // Visual
        this.visible     = config.visible !== undefined ? config.visible : !!config.isItem;
        this.glowEnabled = config.glow === true;
        this.glowTimer   = 0;
        this.glowColor   = config.glowColor || 'rgba(255, 215, 0, 0.4)';

        // Folga da área de detecção de interação (px por lado). Usado nas portas/
        // transições para que a intenção de entrar seja reconhecida ao chegar
        // perto da porta de qualquer direção razoável, sem alinhamento exato.
        this.detectPad = config.detectPad || 0;
    }

    update(dt) {
        this.glowTimer += dt;
    }

    getDialogue() {
        return {
            lines:    this.dialogueLines,
            callback: this.onInteractComplete
        };
    }

    /**
     * Ver NPC.getDetectionBox() — caixa real usada para interação/debug.
     * Expandida por `detectPad` (folga) e mantida centrada na posição real do
     * objeto, para portas/transições serem detectadas sem alinhamento exato.
     */
    getDetectionBox() {
        const p = this.detectPad;
        return {
            x: this.x - p,
            y: this.y - p,
            width:  this.width  + p * 2,
            height: this.height + p * 2,
        };
    }

    draw(ctx) {
        if (this.customDraw) {
            this.customDraw(ctx);
        } else if (window.__ecosDebug && window.__ecosDebug.showInteractables) {
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
            ctx.lineWidth = 1;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        } else if (this.visible && this.glowEnabled) {
            // Itens visíveis: apenas um leve brilho para indicar que é interagível
            const pulse = Math.sin(this.glowTimer * 3) * 0.2 + 0.35;
            ctx.globalAlpha = pulse;
            ctx.fillStyle = this.glowColor;
            ctx.beginPath();
            ctx.ellipse(
                this.x + this.width / 2,
                this.y + this.height / 2,
                this.width / 2 + 3,
                this.height / 2 + 3,
                0, 0, Math.PI * 2
            );
            ctx.fill();
            ctx.globalAlpha = 1;

            // Pequeno indicador "!" flutuante
            const bounceY = Math.sin(this.glowTimer * 4) * 2;
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('!', this.x + this.width / 2, this.y - 4 + bounceY);
            ctx.textAlign = 'left';
        }

        // Portais e objetos de cenário: invisíveis (sem draw)
        // São detectados apenas pela hitbox na interação
    }
}

// ═══════ src/entities/MagicBook.js ═══════

/**
 * MagicBook — o livro antigo já desenhado no tile de fundo da biblioteca
 * (estante/atril com livro aberto). Esta classe não desenha um livro por
 * cima: ela só adiciona o brilho mágico (halo pulsante, fagulhas subindo,
 * indicador "!") ancorado exatamente sobre o tile real, para não duplicar
 * nem deslocar o visual que já existe no mapa.
 */
class MagicBook extends Interactable {

    static PALETTE = Object.freeze({
        runes: '#ffd75e',
    });

    constructor(x, y, config = {}) {
        super(x, y, {
            ...config,
            visible: true,
            glow: true,
            glowColor: config.glowColor || 'rgba(230, 180, 60, 0.5)',
        });
        this.sparkles = Array.from({ length: 6 }, () => this._createSparkle());
    }

    _createSparkle() {
        return {
            x: this.x + 2 + Math.random() * (this.width - 4),
            y: this.y + Math.random() * this.height,
            vy: -6 - Math.random() * 8,
            life: 0.5 + Math.random() * 1.2,
            maxLife: 1.7,
        };
    }

    update(dt) {
        super.update(dt);
        for (const s of this.sparkles) {
            s.y += s.vy * dt;
            s.life -= dt;
            if (s.life <= 0) Object.assign(s, this._createSparkle());
        }
    }

    draw(ctx) {
        const P    = MagicBook.PALETTE;
        const bob  = Math.sin(this.glowTimer * 2.2) * 1.8;
        const cx   = this.x + this.width / 2;
        // Halo deslocado um pouco para baixo e com raio vertical contido dentro
        // da própria célula do tile, para não invadir a decoração acima (teto)
        // nem a mesa abaixo.
        const cy   = this.y + this.height / 2 + 2 + bob;

        const pulse = 0.25 + Math.sin(this.glowTimer * 3) * 0.12;
        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.fillStyle = this.glowColor;
        ctx.beginPath();
        ctx.ellipse(cx, cy, this.width / 2 + 4, this.height / 2 - 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Fagulhas subindo (dão a sensação de páginas/magia balançando)
        ctx.fillStyle = P.runes;
        for (const s of this.sparkles) {
            ctx.globalAlpha = Math.max(0, s.life / s.maxLife) * 0.9;
            ctx.fillRect(s.x, s.y, 1.2, 1.2);
        }
        ctx.globalAlpha = 1;

        // Indicador "!" — mantido dentro do topo da própria célula do livro,
        // sem subir sobre a decoração do teto na célula acima.
        const bounceY = Math.sin(this.glowTimer * 4) * 2;
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('!', cx, this.y + 6 + bounceY);
        ctx.textAlign = 'left';
    }
}

// ═══════ src/entities/PhaseStatue.js ═══════

/**
 * PhaseStatue — estátua comemorativa de um ato no Templo de Arasy.
 *
 * Estado visual derivado do GameState (nunca duplicado localmente):
 *  - Ato pendente  → estátua quebrada (busto rachado, entulho na base)
 *  - Ato concluído → estátua restaurada, com brilho dourado
 *
 * O exame (tecla E) explica o que a estátua representa.
 */
class PhaseStatue extends Interactable {

    /** Aparência e textos por ato. */
    static ACT_INFO = Object.freeze({
        1: {
            label : 'Inconfidência Mineira — 1789',
            accent: '#c62828',
            broken: [
                { speaker: 'Alex', text: 'Uma estátua em ruínas... A placa diz: "Inconfidência Mineira, 1789".' },
                { speaker: 'Arasy', text: 'Este tótem guarda Vila Rica. Onde o ouro corria, corriam também impostos que sufocavam o povo.' },
                { speaker: 'Arasy', text: 'A névoa das mentiras rachou a pedra. Devolva a verdade à terra e o tótem se reerguerá.' },
            ],
            restored: [
                { speaker: 'Alex', text: 'A estátua da Inconfidência Mineira, restaurada e reluzente!' },
                { speaker: 'Arasy', text: 'A cobrança da Derrama acendeu a revolta; a traição de Silvério dos Reis a apagou.' },
                { speaker: 'Arasy', text: 'Tiradentes virou símbolo — mas foram gente comum, de carne e coragem, que sonharam liberdade. Isto a pedra agora lembra.' },
            ],
        },
        2: {
            label : 'Proclamação da República — 1889',
            accent: '#1565C0',
            broken: [
                { speaker: 'Alex', text: 'Esta estátua está partida ao meio... "Proclamação da República, 1889".' },
                { speaker: 'Arasy', text: 'Aqui repousa a memória do fim do Império. Os boatos de 1889 ainda a distorcem.' },
                { speaker: 'Arasy', text: 'Vá ao Rio de Janeiro e separe o que aconteceu daquilo que só foi rumor.' },
            ],
            restored: [
                { speaker: 'Alex', text: 'A estátua da República brilha novamente!' },
                { speaker: 'Arasy', text: 'Militares, Igreja e cafeicultores, cada um por seu motivo, derrubaram a Monarquia.' },
                { speaker: 'Arasy', text: 'Não foi um passe de mágica nem obra de um só homem: foi o peso de muitos descontentamentos. A verdade resistiu aos boatos.' },
            ],
        },
        3: {
            label : 'Lei Áurea — 1888',
            accent: '#c9a227',
            broken: [
                { speaker: 'Alex', text: 'O monumento central está em pedaços... "Lei Áurea, 1888".' },
                { speaker: 'Arasy', text: 'De todas as memórias, esta é a mais ferida pelas mentiras. Fala da escravidão e de sua queda.' },
                { speaker: 'Arasy', text: 'Busque a verdade em São Paulo. O povo que sofreu merece ser lembrado como foi.' },
            ],
            restored: [
                { speaker: 'Alex', text: 'O monumento da Lei Áurea, inteiro outra vez!' },
                { speaker: 'Arasy', text: 'A abolição não foi um presente de uma princesa: foi arrancada por anos de fuga, revolta e luta dos escravizados e abolicionistas.' },
                { speaker: 'Arasy', text: 'E o abandono que veio depois — sem terra, sem trabalho, sem escola — também é História, e também precisa ser lembrado.' },
            ],
        },
    });

    /**
     * @param {number} x @param {number} y
     * @param {1|2|3} act
     * @param {import('../core/GameState.js').GameState} gameState
     * @param {{width?: number, height?: number}} [config]
     */
    constructor(x, y, act, gameState, config = {}) {
        const info = PhaseStatue.ACT_INFO[act];
        super(x, y, {
            name: `Estátua: ${info.label}`,
            width: config.width || 32,
            height: config.height || 48,
            visible: true,
            glow: false,
        });
        this.act       = act;
        this.gameState = gameState;
        this.accent    = info.accent;
        this.timer     = Math.random() * 10;
    }

    get restored() {
        return this.gameState.isActCompleted(this.act);
    }

    /** Diálogo muda conforme o estado — sempre re-consultado. */
    getDialogue() {
        const info = PhaseStatue.ACT_INFO[this.act];
        return {
            lines: this.restored ? info.restored : info.broken,
            callback: null,
        };
    }

    update(dt) {
        this.timer += dt;
    }

    draw(ctx) {
        const cx   = this.x + this.width / 2;
        const base = this.y + this.height;

        this._drawPedestal(ctx, cx, base);
        if (this.restored) {
            this._drawFigure(ctx, cx, base, false);
            this._drawGlow(ctx, cx, base);
        } else {
            this._drawFigure(ctx, cx, base, true);
            this._drawRubble(ctx, cx, base);
        }
    }

    _drawPedestal(ctx, cx, base) {
        // Base de pedra em dois degraus
        ctx.fillStyle = '#8f8a80';
        ctx.fillRect(cx - 13, base - 8, 26, 8);
        ctx.fillStyle = '#a8a396';
        ctx.fillRect(cx - 10, base - 14, 20, 7);
        // Sombra do degrau
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(cx - 13, base - 2, 26, 2);
        // Placa com a cor do ato
        ctx.fillStyle = this.accent;
        ctx.fillRect(cx - 5, base - 7, 10, 4);
    }

    _drawFigure(ctx, cx, base, broken) {
        const stone  = broken ? '#7d786e' : '#cfc9b8';
        const shade  = broken ? '#5f5b52' : '#a8a396';
        const top    = base - 14;

        if (broken) {
            // Apenas o torso partido, inclinado
            ctx.save();
            ctx.translate(cx, top - 10);
            ctx.rotate(-0.12);
            ctx.fillStyle = stone;
            ctx.fillRect(-6, -8, 12, 16);       // torso
            ctx.fillStyle = shade;
            ctx.fillRect(1, -8, 5, 16);         // sombra lateral
            // Linha de fratura no topo
            ctx.fillStyle = '#4a463f';
            ctx.beginPath();
            ctx.moveTo(-6, -8);
            ctx.lineTo(-2, -5); ctx.lineTo(1, -9); ctx.lineTo(4, -6); ctx.lineTo(6, -8);
            ctx.lineTo(6, -10); ctx.lineTo(-6, -10);
            ctx.closePath();
            ctx.fill();
            ctx.restore();

            // Rachaduras no pedestal
            ctx.strokeStyle = '#4a463f';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx - 6, base - 14);
            ctx.lineTo(cx - 3, base - 10);
            ctx.lineTo(cx - 5, base - 6);
            ctx.stroke();
            return;
        }

        // Figura completa: corpo, braço erguido com tocha/bandeira
        ctx.fillStyle = stone;
        ctx.fillRect(cx - 5, top - 22, 10, 12);          // torso
        ctx.beginPath();
        ctx.arc(cx, top - 25, 4, 0, Math.PI * 2);        // cabeça
        ctx.fill();
        ctx.fillRect(cx - 7, top - 10, 14, 3);           // base do manto
        ctx.fillStyle = shade;
        ctx.fillRect(cx + 1, top - 22, 4, 12);           // sombra
        // Braço erguido
        ctx.fillStyle = stone;
        ctx.fillRect(cx + 4, top - 30, 3, 10);
        // Chama/emblema na mão (cor do ato)
        ctx.fillStyle = this.accent;
        ctx.fillRect(cx + 3.5, top - 34, 4, 4);
    }

    _drawRubble(ctx, cx, base) {
        ctx.fillStyle = '#6e6a61';
        ctx.fillRect(cx - 12, base - 4, 5, 3);
        ctx.fillRect(cx + 6, base - 5, 6, 4);
        ctx.fillRect(cx - 4, base - 3, 4, 2);
        ctx.fillStyle = '#57534b';
        ctx.fillRect(cx + 9, base - 3, 3, 2);
        ctx.fillRect(cx - 9, base - 6, 3, 2);
    }

    _drawGlow(ctx, cx, base) {
        const pulse = 0.28 + Math.sin(this.timer * 2.5) * 0.12;
        const cy    = base - 26;
        const grad  = ctx.createRadialGradient(cx, cy, 2, cx, cy, 24);
        grad.addColorStop(0, `rgba(255, 224, 130, ${pulse})`);
        grad.addColorStop(1, 'rgba(255, 224, 130, 0)');
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// ═══════ src/entities/SacredSpring.js ═══════
/**
 * SacredSpring — vitórias-régias e um fio de cachoeira desenhados sobre um
 * poço d'água (o tile de poço vem de farming.png, reaproveitado da Vila Rica).
 *
 * Puramente decorativo (sem colisão nem interação própria): dá vida ao domínio
 * natural de Arasy. A vitória-régia e a cachoeira são desenhadas em código
 * porque não existe um tile equivalente nos tilesets reaproveitáveis do
 * projeto — segue a mesma técnica procedural de Arasy e das estátuas.
 *
 * Ancorada no centro do poço (cx, cy). O z-order usa a própria posição, de
 * modo que a folhagem fica sobre a água mas atrás do altar/personagens.
 */
class SacredSpring {
    constructor(cx, cy) {
        this.cx = cx;
        this.cy = cy;
        // Caixa fictícia só para o painter's sort (y crescente = mais à frente).
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

        // ── Fio de cachoeira caindo para o poço (curto, para não invadir o
        //    frontão monumental que fica logo acima do poço da esquerda) ──
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
        // Espuma na base do fio d'água
        ctx.fillStyle = 'rgba(240,252,255,0.85)';
        for (let i = 0; i < 5; i++) {
            const a = this.t * 2 + i * 1.3;
            ctx.beginPath();
            ctx.arc(cx + Math.cos(a) * 4.5, bot + Math.abs(Math.sin(a)) * 2, 1.1, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // ── Vitórias-régias flutuando ──
        for (const p of this.pads) {
            const px = cx + p.dx;
            const py = cy + p.dy + Math.sin(this.t * 1.5 + p.dx) * 0.6;

            // Disco da folha
            ctx.fillStyle = '#2f7d3a';
            ctx.beginPath();
            ctx.ellipse(px, py, p.r, p.r * 0.72, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#3c9648';
            ctx.beginPath();
            ctx.ellipse(px, py - 0.8, p.r * 0.78, p.r * 0.52, 0, 0, Math.PI * 2);
            ctx.fill();
            // Borda erguida característica da vitória-régia
            ctx.strokeStyle = '#245e2c';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(px, py, p.r, p.r * 0.72, 0, 0, Math.PI * 2);
            ctx.stroke();
            // Nervuras radiais
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

// ═══════ src/ui/DialogueBox.js ═══════

/**
 * DialogueBox — caixa de diálogo estilo RPG, com:
 *  - efeito máquina de escrever
 *  - retrato do falante (opcional, via mapa `portraits`)
 *  - altura dinâmica conforme o texto
 *  - lista de opções selecionáveis (setas + confirmar)
 *
 * Desenha no espaço SCREEN (alta resolução) — fontes nítidas.
 */
class DialogueBox {

    static TYPE_SPEED_MS = 24;       // ms por caractere
    static PORTRAIT_SIZE = 72;
    static LINE_HEIGHT   = 20;

    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx    = ctx;

        this.active      = false;
        this.queue       = [];
        this.currentLine = '';
        this.currentChar = 0;
        this.speaker     = '';
        this.timer       = 0;
        this.onComplete  = null;

        // Opções de escolha
        this.options        = null;
        this.selectedOption = 0;
        this.onOptionSelect = null;

        /** Retratos: { 'NomeDoFalante': { img, sx, sy, sw, sh } } */
        this.portraits = null;
    }

    // ── API pública ──────────────────────────────────────────

    /**
     * Exibe uma sequência de falas.
     * @param {Array<{speaker: string, text: string}>} lines
     * @param {Function} [callback] — chamado ao terminar a última fala
     */
    show(lines, callback) {
        this.queue      = [...lines];
        this.active     = true;
        this.onComplete = callback;
        this.options    = null;
        this.nextLine();
    }

    /**
     * Exibe uma pergunta com alternativas.
     * @param {string} speaker
     * @param {string} text
     * @param {string[]} options
     * @param {(choiceIdx: number) => void} callback
     */
    showChoices(speaker, text, options, callback) {
        this.active         = true;
        this.speaker        = speaker;
        this.currentLine    = text;
        this.currentChar    = text.length;     // pergunta aparece inteira
        this.options        = options;
        this.selectedOption = 0;
        this.onOptionSelect = callback;
        this.queue          = [];
    }

    navigateOptions(dir) {
        if (!this.options || this.options.length === 0) return;
        const n = this.options.length;
        this.selectedOption = (this.selectedOption + dir + n) % n;
    }

    selectCurrentOption() {
        if (!this.options || this.options.length === 0) return;
        const choice   = this.selectedOption;
        const callback = this.onOptionSelect;

        // Zera o estado ANTES do callback para evitar conflitos de input
        this.options = null;
        this.active  = false;

        if (callback) callback(choice);
    }

    /** Avança: completa a digitação ou passa para a próxima fala. */
    advance() {
        if (!this.active) return;
        if (this.currentChar < this.currentLine.length) {
            this.currentChar = this.currentLine.length;
        } else {
            this.nextLine();
        }
    }

    nextLine() {
        if (this.queue.length === 0) {
            this.active = false;
            if (this.onComplete) this.onComplete();
            return;
        }
        const data = this.queue.shift();
        this.speaker     = data.speaker;
        this.currentLine = data.text;
        this.currentChar = 0;
    }

    update(dt) {
        if (!this.active) return;
        if (this.currentChar < this.currentLine.length) {
            this.timer += dt * 1000;
            if (this.timer > DialogueBox.TYPE_SPEED_MS) {
                this.currentChar++;
                this.timer = 0;
            }
        }
    }

    // ── Renderização ─────────────────────────────────────────

    draw() {
        if (!this.active) return;

        const ctx    = this.ctx;
        const margin = SPACE.md;
        const w      = this.canvas.width - margin * 2;
        const x      = margin;

        const portrait    = this.portraits ? this.portraits[this.speaker] : null;
        const hasPortrait = !!(portrait && portrait.img && portrait.img.complete);
        const textX       = hasPortrait ? x + DialogueBox.PORTRAIT_SIZE + SPACE.md + SPACE.sm : x + SPACE.md;
        const textW       = x + w - SPACE.md - textX;

        // Altura dinâmica pelo texto completo (estável durante a digitação)
        ctx.font = font(TYPE.body);
        const lines   = wrapLines(ctx, this.currentLine, textW);
        const lineH   = DialogueBox.LINE_HEIGHT;
        const textTop = 44;
        const minH    = hasPortrait ? DialogueBox.PORTRAIT_SIZE + SPACE.md + SPACE.sm : 96;
        const h       = Math.max(minH, textTop + lines.length * lineH + SPACE.sm);
        const y       = this.canvas.height - h - margin;

        this._drawPanel(ctx, x, y, w, h);
        if (hasPortrait) this._drawPortrait(ctx, portrait, x, y);
        this._drawSpeaker(ctx, textX, y);
        this._drawTypedText(ctx, lines, textX, y + textTop, lineH);
        if (this.options && this.options.length > 0) this._drawOptions(ctx, x, y, w);
    }

    _drawPanel(ctx, x, y, w, h) {
        ctx.fillStyle = COLORS.panel;
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = COLORS.border;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(x, y, w, h);
    }

    _drawPortrait(ctx, portrait, x, y) {
        const ps = DialogueBox.PORTRAIT_SIZE;
        const px = x + SPACE.md - 4;
        const py = y + SPACE.md - 2;
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = 'rgba(255,255,255,0.07)';
        ctx.fillRect(px - 2, py - 2, ps + 4, ps + 4);
        try {
            ctx.drawImage(portrait.img, portrait.sx, portrait.sy, portrait.sw, portrait.sh,
                          px, py, ps, ps);
        } catch (_) { /* imagem inválida: segue sem retrato */ }
        ctx.strokeStyle = COLORS.gold;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(px - 1.5, py - 1.5, ps + 3, ps + 3);
        ctx.restore();
    }

    _drawSpeaker(ctx, textX, y) {
        ctx.fillStyle = COLORS.gold;
        ctx.font = font(TYPE.label, { bold: true, mono: true });
        ctx.fillText(this.speaker.toUpperCase(), textX, y + 26);
    }

    _drawTypedText(ctx, lines, textX, startY, lineH) {
        ctx.fillStyle = COLORS.text;
        ctx.font = font(TYPE.body);
        let remaining = this.currentChar;
        let y = startY;
        for (const line of lines) {
            if (remaining <= 0) break;
            ctx.fillText(line.substring(0, remaining), textX, y);
            remaining -= line.length + 1;   // +1 pelo espaço consumido na quebra
            y += lineH;
        }
    }

    _drawOptions(ctx, x, y, w) {
        const rowH = 28;
        const optH = this.options.length * rowH + SPACE.md;
        const optY = y - optH - SPACE.sm;

        ctx.fillStyle = COLORS.panel;
        ctx.fillRect(x, optY, w, optH);
        ctx.strokeStyle = COLORS.gold;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, optY, w, optH);

        this.options.forEach((opt, idx) => {
            const isSelected = idx === this.selectedOption;
            const rowY = optY + 22 + idx * rowH;

            if (isSelected) {
                ctx.fillStyle = COLORS.goldSoft;
                ctx.fillRect(x + 4, rowY - 17, w - 8, rowH - 4);
            }
            ctx.fillStyle = isSelected ? COLORS.highlight : COLORS.text;
            ctx.font = font(TYPE.body, { bold: isSelected });
            ctx.fillText((isSelected ? '➤ ' : '   ') + opt, x + SPACE.md, rowY);
        });
    }
}

// ═══════ src/ui/InfoPanel.js ═══════

/**
 * InfoPanel — HUD do progresso de coleta da fase atual.
 *
 * Canto superior direito: "📜 2/4" + dica do diário.
 * Ao completar: pulsa dourado e aponta o portal do Templo.
 */
class InfoPanel {

    static NOTIFICATION_SECONDS = 3;

    constructor(canvas, ctx, gameState) {
        this.canvas    = canvas;
        this.ctx       = ctx;
        this.gameState = gameState;
        this.active    = false;
        this.timer     = 0;

        this.showNotification  = false;
        this.notificationTimer = 0;
        this.lastNotifiedInfo  = '';
    }

    /** Notificação de nova informação coletada. */
    notifyNewInfo(infoTitle) {
        this.showNotification  = true;
        this.notificationTimer = InfoPanel.NOTIFICATION_SECONDS;
        this.lastNotifiedInfo  = infoTitle;
    }

    update(dt) {
        if (!this.active) return;
        this.timer += dt;
        if (this.showNotification) {
            this.notificationTimer -= dt;
            if (this.notificationTimer <= 0) this.showNotification = false;
        }
    }

    draw() {
        if (!this.active) return;

        const ctx     = this.ctx;
        const count   = this.gameState.getInfoCount();
        const total   = this.gameState.getRequiredInfoCount();
        const allDone = this.gameState.hasAllInfos();

        this._drawBadge(ctx, count, total, allDone);
        if (this.showNotification) this._drawNotification(ctx);
        if (allDone) this._drawTemploCall(ctx);
    }

    _drawBadge(ctx, count, total, allDone) {
        const w = 128, h = 40;
        const x = this.canvas.width - w - SPACE.md;
        const y = SPACE.sm;

        ctx.fillStyle = allDone ? 'rgba(180, 140, 40, 0.9)' : 'rgba(10, 10, 25, 0.85)';
        ctx.fillRect(x, y, w, h);

        ctx.strokeStyle = allDone
            ? `rgba(255, 215, 0, ${0.6 + Math.sin(this.timer * 4) * 0.3})`
            : COLORS.borderSoft;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = allDone ? COLORS.text : COLORS.parchment;
        ctx.font = font(TYPE.label, { bold: true, mono: true });
        ctx.textAlign = 'center';
        ctx.fillText(`📜 ${count}/${total}`, x + w / 2, y + 26);

        ctx.fillStyle = 'rgba(245, 240, 232, 0.6)';
        ctx.font = font(TYPE.caption);
        ctx.fillText('J = diário', x + w / 2, y + h + 16);
        ctx.textAlign = 'left';
    }

    _drawNotification(ctx) {
        const alpha = Math.min(1, this.notificationTimer / 0.5);
        const w = 320, h = 52;
        const x = this.canvas.width - w - SPACE.md;
        const y = 78;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = COLORS.panel;
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = COLORS.gold;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, y, w, h);

        ctx.textAlign = 'center';
        ctx.fillStyle = COLORS.gold;
        ctx.font = font(TYPE.caption, { bold: true });
        ctx.fillText('✨ INFORMAÇÃO COLETADA!', x + w / 2, y + 20);
        ctx.fillStyle = COLORS.parchment;
        ctx.font = font(TYPE.caption);
        ctx.fillText(this.lastNotifiedInfo, x + w / 2, y + 40);
        ctx.restore();
        ctx.textAlign = 'left';
    }

    _drawTemploCall(ctx) {
        const pulse = 0.5 + Math.sin(this.timer * 3) * 0.3;
        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.fillStyle = COLORS.highlight;
        ctx.font = font(TYPE.label, { bold: true });
        ctx.textAlign = 'center';
        ctx.fillText('⬆️ VOLTE AO TEMPLO!', this.canvas.width / 2, 30);
        ctx.restore();
        ctx.textAlign = 'left';
    }
}

// ═══════ src/ui/JournalUI.js ═══════


/**
 * JournalUI — Diário do Alex (tecla J).
 *
 * Uma página por ato/fase da história (Inconfidência, República, Lei
 * Áurea), navegável com ←/→ (ou A/D). Cada página reaproveita o mesmo
 * rótulo e cor de destaque já usados nas estátuas do Templo
 * (PhaseStatue.ACT_INFO), para manter a identidade visual consistente.
 *
 * Regra anti-spoiler: o selo FATO/BOATO de uma informação só é
 * revelado depois que o ato correspondente foi concluído; antes
 * disso a entrada aparece como "❓ NÃO VERIFICADO".
 *
 * Componente somente-leitura: deriva tudo do GameState.
 */
class JournalUI {

    static ROW_HEIGHT = 22;
    static ACTS = [1, 2, 3];

    constructor(canvas, ctx, gameState) {
        this.canvas      = canvas;
        this.ctx         = ctx;
        this.gameState   = gameState;
        this.active      = false;
        this.currentPage = 1;
        this.selected    = 0;
        this.timer       = 0;
    }

    toggle() {
        this.active = !this.active;
        if (this.active) {
            this.currentPage = JournalUI.ACTS.includes(this.gameState.act) ? this.gameState.act : 1;
            this.selected = 0;
        }
    }

    close() {
        this.active = false;
    }

    /** Navega entre as entradas da página atual. */
    navigate(dir) {
        const n = this._pageInfos().length;
        if (n === 0) return;
        this.selected = (this.selected + dir + n) % n;
    }

    /** Vira a página do diário (ato anterior/seguinte). */
    navigatePage(dir) {
        const acts = JournalUI.ACTS;
        const idx  = acts.indexOf(this.currentPage);
        this.currentPage = acts[(idx + dir + acts.length) % acts.length];
        this.selected = 0;
    }

    update(dt) {
        this.timer += dt;
    }

    // ── Estado derivado ──────────────────────────────────────

    /** Informações coletadas pertencentes à página (ato) atual. */
    _pageInfos() {
        return this.gameState.collectedInfos.filter(i => this.gameState.getInfoAct(i) === this.currentPage);
    }

    /** Selo exibido para uma info, respeitando a regra anti-spoiler. */
    _sealFor(info) {
        const act = this.gameState.getInfoAct(info);
        if (!this.gameState.isActCompleted(act)) {
            return { label: '❓ NÃO VERIFICADO', color: COLORS.neutral };
        }
        return info.isTrue
            ? { label: '✔ FATO',  color: COLORS.success }
            : { label: '✘ BOATO', color: COLORS.danger };
    }

    // ── Renderização ─────────────────────────────────────────

    draw() {
        if (!this.active) return;

        const ctx = this.ctx;
        const W   = this.canvas.width;
        const H   = this.canvas.height;

        ctx.fillStyle = COLORS.overlay;
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = COLORS.gold;
        ctx.lineWidth = 3;
        ctx.strokeRect(SPACE.md, SPACE.md, W - SPACE.md * 2, H - SPACE.md * 2);

        this._drawHeader(ctx, W);
        const listTop = this._drawPageTabs(ctx, W);

        const infos = this._pageInfos();
        if (infos.length === 0) {
            this._drawEmptyState(ctx, W, H);
            return;
        }

        if (this.selected >= infos.length) this.selected = infos.length - 1;
        const detailTop = this._drawEntryList(ctx, W, infos, listTop);
        this._drawDetail(ctx, W, H, infos[this.selected], detailTop);
        this._drawFooter(ctx, W, H);
    }

    _drawHeader(ctx, W) {
        ctx.textAlign = 'center';
        ctx.fillStyle = COLORS.gold;
        ctx.font = font(TYPE.title, { bold: true });
        ctx.fillText('📖 Diário de Alex', W / 2, 38);
        ctx.textAlign = 'left';
    }

    /** Abas de página (uma por ato); retorna o y onde o conteúdo da página começa. */
    _drawPageTabs(ctx, W) {
        const y = 50;
        const tabW = 168, tabH = 30, gap = 10;
        const totalW = tabW * 3 + gap * 2;
        const startX = W / 2 - totalW / 2;

        JournalUI.ACTS.forEach((act, i) => {
            const phase     = PhaseStatue.ACT_INFO[act];
            const x         = startX + i * (tabW + gap);
            const isCurrent = act === this.currentPage;
            const count     = this.gameState.collectedInfos.filter(inf => this.gameState.getInfoAct(inf) === act).length;

            if (isCurrent) {
                ctx.fillStyle = 'rgba(255,255,255,0.08)';
                ctx.fillRect(x, y, tabW, tabH);
            }
            ctx.strokeStyle = isCurrent ? phase.accent : COLORS.borderSoft;
            ctx.lineWidth   = isCurrent ? 2 : 1;
            ctx.strokeRect(x, y, tabW, tabH);

            ctx.textAlign = 'center';
            ctx.fillStyle = isCurrent ? phase.accent : COLORS.textFaint;
            ctx.font = font(TYPE.caption, { bold: isCurrent });
            const shortLabel = phase.label.split(' — ')[0];
            ctx.fillText(`${shortLabel} (${count})`, x + tabW / 2, y + tabH / 2 + 4);
        });

        ctx.textAlign = 'left';
        return y + tabH + 18;
    }

    _drawEmptyState(ctx, W, H) {
        ctx.textAlign = 'center';
        ctx.fillStyle = COLORS.textFaint;
        ctx.font = font(TYPE.body);
        ctx.fillText('Nenhuma informação coletada nesta fase ainda.', W / 2, H / 2 - 12);
        ctx.fillStyle = COLORS.neutral;
        ctx.font = font(TYPE.caption);
        ctx.fillText('←/→ trocar de página   •   J fechar', W / 2, H - 34);
        ctx.textAlign = 'left';
    }

    /** Lista de entradas da página atual; retorna o y onde o painel de detalhe começa. */
    _drawEntryList(ctx, W, infos, listY) {
        const rowH = JournalUI.ROW_HEIGHT;

        infos.forEach((info, idx) => {
            const y     = listY + idx * rowH;
            const isSel = idx === this.selected;
            const seal  = this._sealFor(info);

            if (isSel) {
                ctx.fillStyle = COLORS.goldSoft;
                ctx.fillRect(SPACE.lg, y - 16, W - SPACE.lg * 2, rowH - 3);
            }

            ctx.font = font(TYPE.caption, { bold: true });
            ctx.fillStyle = seal.color;
            ctx.fillText(seal.label, SPACE.lg + 6, y);

            ctx.font = font(TYPE.body, { bold: isSel });
            ctx.fillStyle = isSel ? COLORS.highlight : COLORS.parchment;
            const title = info.title.length > 40 ? `${info.title.slice(0, 39)}…` : info.title;
            ctx.fillText((isSel ? '➤ ' : '   ') + title, 190, y);
        });

        return listY + infos.length * rowH + SPACE.sm;
    }

    _drawDetail(ctx, W, H, info, top) {
        const x = SPACE.lg;
        const w = W - SPACE.lg * 2;
        const h = Math.max(H - top - 52, 60);

        ctx.strokeStyle = COLORS.borderSoft;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, top, w, h);

        ctx.fillStyle = COLORS.textFaint;
        ctx.font = font(TYPE.caption, { italic: true });
        ctx.fillText(`Contado por: ${info.npc || '???'}`, x + SPACE.sm, top + 20);

        ctx.fillStyle = COLORS.text;
        ctx.font = font(TYPE.body);
        const maxLines = Math.max(1, Math.floor((h - 30) / 20));
        const lines = wrapLines(ctx, info.shortText || info.title, w - SPACE.md * 2).slice(0, maxLines);
        drawLines(ctx, lines, x + SPACE.sm, top + 42, 20);
    }

    _drawFooter(ctx, W, H) {
        ctx.fillStyle = COLORS.neutral;
        ctx.font = font(TYPE.caption);
        ctx.textAlign = 'center';
        ctx.fillText('↑/↓ navegar entrada   •   ←/→ trocar de página   •   J fechar', W / 2, H - 24);
        ctx.textAlign = 'left';
    }
}

// ═══════ src/ui/ReturnButton.js ═══════

/**
 * ReturnButton — botão fixo "Voltar ao Templo" exibido durante as fases.
 *
 * Acionável por clique/toque ou pela tecla T (atalho exibido no rótulo).
 * O componente só desenha e testa hits; a ação fica com o chamador (main).
 */
class ReturnButton {

    static LABEL = '🏛️ Templo (T)';

    constructor(canvas, ctx) {
        this.canvas  = canvas;
        this.ctx     = ctx;
        this.visible = false;
        this.hovered = false;

        // Geometria fixa (espaço SCREEN), canto superior esquerdo
        this.x = SPACE.sm;
        this.y = SPACE.sm;
        this.w = 150;
        this.h = 34;
    }

    /** @param {boolean} value */
    setVisible(value) {
        this.visible = value;
        if (!value) this.hovered = false;
    }

    /**
     * Testa se um ponto (espaço SCREEN) está sobre o botão.
     * @returns {boolean}
     */
    hitTest(px, py) {
        return this.visible &&
               px >= this.x && px <= this.x + this.w &&
               py >= this.y && py <= this.y + this.h;
    }

    /** Atualiza o estado de hover (para feedback visual). */
    setHover(px, py) {
        this.hovered = this.hitTest(px, py);
    }

    draw() {
        if (!this.visible) return;
        const ctx = this.ctx;

        ctx.save();
        ctx.fillStyle = this.hovered ? 'rgba(60, 45, 20, 0.95)' : 'rgba(10, 10, 25, 0.85)';
        ctx.fillRect(this.x, this.y, this.w, this.h);

        ctx.strokeStyle = this.hovered ? COLORS.highlight : COLORS.gold;
        ctx.lineWidth = this.hovered ? 2.5 : 1.5;
        ctx.strokeRect(this.x, this.y, this.w, this.h);

        ctx.fillStyle = this.hovered ? COLORS.highlight : COLORS.parchment;
        ctx.font = font(TYPE.caption, { bold: true });
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ReturnButton.LABEL, this.x + this.w / 2, this.y + this.h / 2 + 1);
        ctx.restore();
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
    }
}

// ═══════ src/ui/PuzzleUI.js ═══════

/**
 * PuzzleUI — o Desafio de Arasy.
 *
 * O jogador escolhe, entre as informações coletadas na fase ATUAL,
 * qual deu INÍCIO e qual marcou o FIM do movimento histórico.
 *
 * Interação por mouse (hover + clique). As tentativas restantes são
 * informadas pelo chamador via `setAttemptsLeft` e apenas exibidas aqui.
 */
class PuzzleUI {

    constructor(canvas, ctx, gameState) {
        this.canvas    = canvas;
        this.ctx       = ctx;
        this.gameState = gameState;

        this.active        = false;
        this.phase         = 'intro';   // 'intro' | 'select_start' | 'select_end' | 'result'
        this.selectedStart = null;
        this.selectedEnd   = null;
        this.result        = null;      // 'correct' | 'wrong'
        this.resultTimer   = 0;
        this.attemptsLeft  = null;      // exibição opcional

        this.onCorrect = null;
        this.onWrong   = null;

        this.hoveredCard = -1;
        this._onMouseMove = this._handleMouseMove.bind(this);
        this._onClick     = this._handleClick.bind(this);
    }

    /** Informa quantas tentativas restam (apenas exibição). */
    setAttemptsLeft(n) {
        this.attemptsLeft = n;
    }

    start(onCorrect, onWrong) {
        this.active        = true;
        this.phase         = 'intro';
        this.selectedStart = null;
        this.selectedEnd   = null;
        this.result        = null;
        this.resultTimer   = 0;
        this.onCorrect     = onCorrect;
        this.onWrong       = onWrong;
        this.hoveredCard   = -1;

        this.canvas.addEventListener('mousemove', this._onMouseMove);
        this.canvas.addEventListener('click', this._onClick);
    }

    stop() {
        this.active = false;
        this.canvas.removeEventListener('mousemove', this._onMouseMove);
        this.canvas.removeEventListener('click', this._onClick);
    }

    /** As cartas vêm SEMPRE da fase atual (nunca de atos anteriores). */
    _getInfos() {
        return this.gameState.getCurrentActInfos();
    }

    // ── Layout das cartas ────────────────────────────────────

    _getCardRects() {
        const infos = this._getInfos();
        let cardW, cardH, gapX, gapY, cols, startY;

        if (infos.length <= 4) {
            cardW = 280; cardH = 130; gapX = 20; gapY = 20; cols = 2; startY = 160;
        } else if (infos.length <= 6) {
            cardW = 184; cardH = 116; gapX = 16; gapY = 16; cols = 3; startY = 140;
        } else {
            cardW = 140; cardH = 116; gapX = 12; gapY = 12; cols = 4; startY = 140;
        }

        const totalW = cols * cardW + (cols - 1) * gapX;
        const startX = (this.canvas.width - totalW) / 2;

        return infos.map((info, i) => ({
            x: startX + (i % cols) * (cardW + gapX),
            y: startY + Math.floor(i / cols) * (cardH + gapY),
            w: cardW,
            h: cardH,
            info,
        }));
    }

    // ── Mouse ────────────────────────────────────────────────

    _canvasPoint(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
            y: (e.clientY - rect.top) * (this.canvas.height / rect.height),
        };
    }

    _handleMouseMove(e) {
        if (!this.active || this.phase === 'intro' || this.phase === 'result') return;
        const { x, y } = this._canvasPoint(e);
        this.hoveredCard = this._getCardRects().findIndex(c =>
            x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h);
    }

    _handleClick() {
        if (!this.active) return;

        if (this.phase === 'intro') {
            this.phase = 'select_start';
            return;
        }
        if (this.phase === 'result') {
            this.stop();
            if (this.result === 'correct' && this.onCorrect) this.onCorrect();
            if (this.result === 'wrong'   && this.onWrong)   this.onWrong();
            return;
        }
        if (this.hoveredCard < 0) return;

        const selected = this._getCardRects()[this.hoveredCard].info;
        if (this.phase === 'select_start') {
            this.selectedStart = selected;
            this.phase = 'select_end';
        } else if (this.phase === 'select_end') {
            if (selected.id === this.selectedStart.id) return;
            this.selectedEnd = selected;
            const correct = this.gameState.checkPuzzle(this.selectedStart.id, this.selectedEnd.id);
            this.result = correct ? 'correct' : 'wrong';
            this.phase = 'result';
            this.resultTimer = 0;
        }
    }

    update(dt) {
        if (this.active && this.phase === 'result') this.resultTimer += dt;
    }

    // ── Renderização ─────────────────────────────────────────

    draw() {
        if (!this.active) return;
        const ctx = this.ctx;
        const W = this.canvas.width;
        const H = this.canvas.height;

        ctx.fillStyle = 'rgba(8, 6, 15, 0.96)';
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = 'rgba(200, 170, 100, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(SPACE.md + 4, SPACE.md + 4, W - 40, H - 40);
        ctx.strokeRect(SPACE.lg + 4, SPACE.lg + 4, W - 56, H - 56);

        if (this.phase === 'intro') this._drawIntro(ctx, W, H);
        else if (this.phase === 'result') this._drawResult(ctx, W, H);
        else this._drawSelection(ctx, W, H);
    }

    _drawAttempts(ctx, W) {
        if (this.attemptsLeft == null) return;
        ctx.textAlign = 'right';
        ctx.font = font(15, { bold: true });
        ctx.fillStyle = this.attemptsLeft > 1 ? COLORS.gold : COLORS.danger;
        ctx.fillText(`Tentativas: ${'❤'.repeat(Math.max(0, this.attemptsLeft))}`, W - 36, 46);
        ctx.textAlign = 'left';
    }

    _drawIntro(ctx, W, H) {
        ctx.textAlign = 'center';
        ctx.fillStyle = COLORS.gold;
        ctx.font = font(26, { bold: true });
        ctx.fillText('🏛️  O DESAFIO DE ARASY  🏛️', W / 2, 110);

        ctx.fillStyle = COLORS.parchment;
        ctx.font = font(17);
        const lines = [
            'Você coletou as informações históricas desta época.',
            '',
            'Agora, Arasy precisa que você identifique:',
            '',
            '1. A informação que DEU INÍCIO ao movimento',
            '2. A informação que ENCERROU o movimento',
            '',
            'Cuidado! Nem tudo que ouviu é verdade...',
            'Fake news também existiam no passado!',
        ];
        lines.forEach((line, i) => ctx.fillText(line, W / 2, 170 + i * 28));

        this._drawAttempts(ctx, W);

        ctx.fillStyle = COLORS.gold;
        ctx.font = font(18, { bold: true });
        ctx.fillText('[ Clique para continuar ]', W / 2, H - 50);
        ctx.textAlign = 'left';
    }

    _drawSelection(ctx, W, H) {
        const isStart = this.phase === 'select_start';

        ctx.textAlign = 'center';
        ctx.fillStyle = COLORS.gold;
        ctx.font = font(19, { bold: true });
        ctx.fillText(
            isStart ? 'Selecione a informação que DEU INÍCIO ao movimento:'
                    : 'Selecione a informação que ENCERROU o movimento:',
            W / 2, 66);

        if (!isStart) {
            ctx.fillStyle = COLORS.successSoft;
            ctx.font = font(15);
            ctx.fillText(`✅ Início: ${this.selectedStart.title}`, W / 2, 100);
        }
        this._drawAttempts(ctx, W);

        for (const [i, c] of this._getCardRects().entries()) {
            this._drawCard(ctx, c, i === this.hoveredCard,
                this.selectedStart && c.info.id === this.selectedStart.id);
        }
        ctx.textAlign = 'left';
    }

    _drawCard(ctx, c, isHovered, isSelected) {
        ctx.fillStyle = isSelected ? 'rgba(100, 200, 100, 0.2)'
                      : isHovered  ? COLORS.goldSoft
                      : COLORS.panelSoft;
        ctx.fillRect(c.x, c.y, c.w, c.h);

        ctx.strokeStyle = isHovered ? COLORS.gold : COLORS.borderSoft;
        ctx.lineWidth = isHovered ? 3 : 1.5;
        ctx.strokeRect(c.x, c.y, c.w, c.h);

        const compact = c.w < 180;
        const cxm = c.x + c.w / 2;

        ctx.textAlign = 'center';
        ctx.fillStyle = COLORS.gold;
        ctx.font = font(compact ? 11 : 13, { bold: true, mono: true });
        ctx.fillText(c.info.npc.toUpperCase(), cxm, c.y + (compact ? 18 : 22));

        ctx.fillStyle = COLORS.parchment;
        ctx.font = font(compact ? 13 : 15, { bold: true });
        let y = c.y + (compact ? 36 : 44);
        for (const line of wrapLines(ctx, c.info.title, c.w - 14)) {
            ctx.fillText(line, cxm, y);
            y += compact ? 14 : 17;
        }

        ctx.fillStyle = COLORS.textDim;
        ctx.font = font(compact ? 11 : 12.5);
        y += 2;
        for (const line of wrapLines(ctx, c.info.shortText, c.w - 14)) {
            ctx.fillText(line, cxm, y);
            y += compact ? 12.5 : 15;
        }

        if (isSelected) {
            ctx.fillStyle = COLORS.success;
            ctx.font = font(compact ? 16 : 20, { bold: true });
            ctx.fillText('✅', c.x + c.w - 18, c.y + 22);
        }
    }

    _drawResult(ctx, W, H) {
        const isCorrect = this.result === 'correct';

        ctx.textAlign = 'center';
        ctx.font = font(64);
        ctx.fillText(isCorrect ? '🎉' : '❌', W / 2, 140);

        ctx.fillStyle = isCorrect ? COLORS.success : COLORS.danger;
        ctx.font = font(26, { bold: true });
        ctx.fillText(isCorrect ? 'PARABÉNS!' : 'ERRADO!', W / 2, 190);

        ctx.fillStyle = COLORS.parchment;
        ctx.font = font(16);

        const lines = isCorrect ? this._buildSuccessLines() : this._buildFailLines();
        lines.forEach((line, i) => ctx.fillText(line, W / 2, 232 + i * 24));

        if (this.resultTimer > 1.2) {
            ctx.fillStyle = COLORS.gold;
            ctx.font = font(18, { bold: true });
            ctx.fillText('[ Clique para continuar ]', W / 2, H - 28);
        }
        ctx.textAlign = 'left';
    }

    _buildSuccessLines() {
        const isRio = this.selectedStart.id.startsWith('republica');
        const isLei = this.selectedStart.id.startsWith('leiaurea');
        const conclusion = isLei ? [
            'A luta abolicionista e a resistência conquistaram a libertação,',
            'mas a falta de suporte social pós-Lei Áurea',
            'manteve a população negra liberta marginalizada.',
        ] : isRio ? [
            'A República começou pela insatisfação dos militares,',
            'Igreja e cafeicultores, e terminou com o exílio',
            'da Família Real proclamada por Deodoro.',
        ] : [
            'A Inconfidência Mineira começou pela revolta',
            'contra a Derrama e terminou com a traição',
            'de Joaquim Silvério dos Reis.',
        ];
        return [
            'Você identificou corretamente:',
            '',
            `✅ INÍCIO: ${this.selectedStart.title}`,
            `✅ FIM: ${this.selectedEnd.title}`,
            '',
            ...conclusion,
            '',
            'A névoa de mentiras foi dissipada!',
        ];
    }

    _buildFailLines() {
        const lines = [
            'As informações selecionadas não estão corretas.',
            '',
            `❌ Início: ${this.selectedStart?.title || '—'}`,
            `❌ Fim: ${this.selectedEnd?.title || '—'}`,
            '',
        ];
        if (this.attemptsLeft != null && this.attemptsLeft > 1) {
            lines.push(`Você ainda tem ${this.attemptsLeft - 1} tentativa(s). Pense bem!`);
        } else {
            lines.push('Suas chances acabaram... Volte e investigue novamente!');
        }
        lines.push('Cuidado com as fake news do passado...');
        return lines;
    }
}

// ═══════ src/ui/TutorialOverlay.js ═══════

/**
 * TutorialOverlay — faixa de tutorial da Biblioteca.
 *
 * Passos:
 *  0 — mover (desaparece ao mover)
 *  1 — interagir (desaparece ao interagir)
 *  2 — falar com a Professora (desaparece ao falar)
 */
class TutorialOverlay {

    static STEPS = Object.freeze([
        { text: '🎮  Use  WASD  ou  ←↑↓→  para mover' },
        { text: '💬  Pressione  E  para interagir' },
        { text: '📋  Fale com a Professora sobre o trabalho' },
    ]);

    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx    = ctx;
        this.step   = 0;
        this.active = true;
        this.alpha  = 1;
        this.timer  = 0;
    }

    setStep(step) {
        if (step > this.step) {
            this.step  = step;
            this.alpha = 1;
            this.timer = 0;
        }
        if (this.step >= TutorialOverlay.STEPS.length) this.active = false;
    }

    complete() {
        this.active = false;
    }

    update(dt) {
        if (!this.active) return;
        this.timer += dt;
        this.alpha = 0.7 + Math.sin(this.timer * 2) * 0.15;
    }

    draw() {
        if (!this.active || this.step >= TutorialOverlay.STEPS.length) return;

        const ctx = this.ctx;
        const w = this.canvas.width;
        const bandH = 56;

        // Faixa superior
        ctx.fillStyle = 'rgba(0, 0, 0, 0.68)';
        ctx.fillRect(0, 0, w, bandH);

        // Borda inferior com brilho
        const grad = ctx.createLinearGradient(0, bandH - 3, w, bandH - 3);
        grad.addColorStop(0, 'rgba(239, 159, 39, 0)');
        grad.addColorStop(0.5, 'rgba(239, 159, 39, 0.6)');
        grad.addColorStop(1, 'rgba(239, 159, 39, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, bandH - 3, w, 3);

        // Texto do passo
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = COLORS.parchment;
        ctx.font = font(TYPE.label, { bold: true });
        ctx.textAlign = 'center';
        ctx.fillText(TutorialOverlay.STEPS[this.step].text, w / 2, 32);
        ctx.restore();

        // Indicador de progresso
        const dotY = 46;
        const spacing = 16;
        const startX = w / 2 - (TutorialOverlay.STEPS.length * spacing) / 2 + spacing / 2;
        for (let i = 0; i < TutorialOverlay.STEPS.length; i++) {
            ctx.fillStyle = i <= this.step ? COLORS.gold : 'rgba(255,255,255,0.3)';
            ctx.beginPath();
            ctx.arc(startX + i * spacing, dotY, i === this.step ? 5 : 3.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.textAlign = 'left';
    }
}

// ═══════ src/ui/EndingScreen.js ═══════

/**
 * EndingScreen — tela final do jogo (créditos + resumo da jornada).
 *
 * Aparece depois da sequência narrativa final no Templo (cena "vitoria"),
 * para que o jogador não fique andando livremente sem propósito ao
 * concluir a aventura. Não há menu principal no jogo, então esta tela
 * oferece a única ação possível depois do fim: recomeçar a jornada.
 *
 * Somente leitura: deriva o resumo do GameState (fatos vs. boatos
 * distinguidos ao longo dos 3 atos).
 */
class EndingScreen {
    constructor(canvas, ctx, gameState) {
        this.canvas    = canvas;
        this.ctx       = ctx;
        this.gameState = gameState;
        this.active    = false;
        this.timer     = 0;
    }

    show() {
        this.active = true;
        this.timer  = 0;
    }

    hide() {
        this.active = false;
    }

    update(dt) {
        if (this.active) this.timer += dt;
    }

    draw() {
        if (!this.active) return;

        const ctx = this.ctx;
        const W   = this.canvas.width;
        const H   = this.canvas.height;

        ctx.fillStyle = COLORS.overlay;
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = COLORS.gold;
        ctx.lineWidth = 3;
        ctx.strokeRect(SPACE.md, SPACE.md, W - SPACE.md * 2, H - SPACE.md * 2);

        ctx.textAlign = 'center';

        ctx.fillStyle = COLORS.gold;
        ctx.font = font(TYPE.hero, { bold: true });
        ctx.fillText('🏛️ Ecos do Brasil', W / 2, 66);

        ctx.fillStyle = COLORS.parchment;
        ctx.font = font(TYPE.label, { italic: true });
        ctx.fillText('Fim da jornada de Alex', W / 2, 92);

        this._drawSummary(ctx, W);
        this._drawRecap(ctx, W);
        this._drawCredits(ctx, W, H);
        this._drawPrompt(ctx, W, H);

        ctx.textAlign = 'left';
    }

    /** Fatos separados de boatos ao longo dos 3 atos — não é resetado ao terminar. */
    _drawSummary(ctx, W) {
        const infos = this.gameState.collectedInfos;
        const facts = infos.filter(i => i.isTrue).length;
        const myths = infos.filter(i => !i.isTrue).length;

        ctx.fillStyle = COLORS.highlight;
        ctx.font = font(TYPE.body, { bold: true });
        ctx.fillText(`✔ ${facts} fatos confirmados   •   ✘ ${myths} boatos desmentidos`, W / 2, 122);
    }

    _drawRecap(ctx, W) {
        const recap = 'Em Vila Rica, Rio de Janeiro e São Paulo, Alex aprendeu que a história ' +
            'de verdade é feita de gente real, decisões difíceis e consequências que duram gerações — ' +
            'muito diferente dos boatos que tentam simplificar ou distorcer o passado.';

        ctx.fillStyle = COLORS.textDim;
        ctx.font = font(TYPE.body);
        const lines = wrapLines(ctx, recap, W - SPACE.xl * 2);
        drawLines(ctx, lines, W / 2, 156, 22);
    }

    _drawCredits(ctx, W, H) {
        const y = H - 92;
        ctx.fillStyle = COLORS.textFaint;
        ctx.font = font(TYPE.caption);
        ctx.fillText('Ecos do Brasil — desenvolvido em JavaScript puro, com Tiled e Canvas 2D.', W / 2, y);
        ctx.fillText('Obrigado por jogar e por defender a verdade histórica.', W / 2, y + 20);
    }

    _drawPrompt(ctx, W, H) {
        const pulse = 0.55 + Math.sin(this.timer * 3) * 0.3;
        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.fillStyle = COLORS.gold;
        ctx.font = font(TYPE.label, { bold: true });
        ctx.fillText('Pressione ESPAÇO para recomeçar a jornada', W / 2, H - 34);
        ctx.restore();
    }
}

// ═══════ src/ui/ControlsScreen.js ═══════

/**
 * ControlsScreen — tela de ajuda com todos os comandos do jogo (tecla H).
 *
 * Referência estática, consultável a qualquer momento (exceto durante
 * diálogos/desafios), para que o jogador sempre saiba quais teclas usar.
 * Segue o mesmo padrão visual do JournalUI/EndingScreen.
 */
class ControlsScreen {

    static CONTROLS = [
        { keys: 'W A S D  /  ← ↑ → ↓', action: 'Mover Alex pelo mapa' },
        { keys: 'ESPAÇO  ou  E',       action: 'Interagir / avançar diálogo' },
        { keys: 'J',                   action: 'Abrir ou fechar o diário' },
        { keys: '← → (no diário)',     action: 'Trocar de página do diário' },
        { keys: '↑ ↓ (diário/escolhas)', action: 'Navegar entre opções' },
        { keys: 'Mouse (clique)',      action: 'Selecionar cartas no Desafio de Arasy' },
        { keys: 'T',                   action: 'Voltar ao Templo (quando disponível)' },
        { keys: 'M',                   action: 'Ativar ou desativar o som' },
        { keys: 'H',                   action: 'Abrir ou fechar esta tela de ajuda' },
    ];

    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx    = ctx;
        this.active = false;
        this.timer  = 0;
    }

    toggle() {
        this.active = !this.active;
        this.timer  = 0;
    }

    close() {
        this.active = false;
    }

    update(dt) {
        if (this.active) this.timer += dt;
    }

    draw() {
        if (!this.active) return;

        const ctx = this.ctx;
        const W   = this.canvas.width;
        const H   = this.canvas.height;

        ctx.fillStyle = COLORS.overlay;
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = COLORS.gold;
        ctx.lineWidth = 3;
        ctx.strokeRect(SPACE.md, SPACE.md, W - SPACE.md * 2, H - SPACE.md * 2);

        ctx.textAlign = 'center';
        ctx.fillStyle = COLORS.gold;
        ctx.font = font(TYPE.title, { bold: true });
        ctx.fillText('🎮 Controles', W / 2, 46);
        ctx.textAlign = 'left';

        this._drawRows(ctx, W);
        this._drawPrompt(ctx, W, H);
    }

    _drawRows(ctx, W) {
        const rowH    = 34;
        const startY  = 92;
        const keyX    = SPACE.xl;
        const actionX = W / 2 - 20;

        ControlsScreen.CONTROLS.forEach((c, i) => {
            const y = startY + i * rowH;

            if (i % 2 === 0) {
                ctx.fillStyle = 'rgba(255,255,255,0.04)';
                ctx.fillRect(SPACE.lg, y - 20, W - SPACE.lg * 2, rowH - 4);
            }

            ctx.fillStyle = COLORS.highlight;
            ctx.font = font(TYPE.body, { bold: true, mono: true });
            ctx.fillText(c.keys, keyX, y);

            ctx.fillStyle = COLORS.parchment;
            ctx.font = font(TYPE.body);
            ctx.fillText(c.action, actionX, y);
        });
    }

    _drawPrompt(ctx, W, H) {
        const pulse = 0.55 + Math.sin(this.timer * 3) * 0.3;
        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.fillStyle = COLORS.gold;
        ctx.font = font(TYPE.label, { bold: true });
        ctx.textAlign = 'center';
        ctx.fillText('Pressione H para fechar', W / 2, H - 30);
        ctx.restore();
        ctx.textAlign = 'left';
    }
}

// ═══════ src/main.js ═══════























// ═══════════════════════════════════════════════════════════════
// CANVAS & SISTEMAS GLOBAIS
// ═══════════════════════════════════════════════════════════════
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
canvas.width  = SCREEN.W;
canvas.height = SCREEN.H;

const input        = new Input();
const camera       = new Camera(VIEW.W, VIEW.H);
const sceneManager = new SceneManager(canvas, ctx);
const gameState    = new GameState();
const audio        = new AudioManager();

let gameMap       = null;
let alex          = null;
let dialogueBox   = null;
let infoPanel     = null;
let puzzleUI      = null;
let tutorial      = null;
let journal       = null;
let returnButton  = null;
let endingScreen  = null;
let controlsScreen = null;
let interactables = [];
let lastTime      = performance.now();
let spaceWasDown  = false;
let upWasDown     = false;
let downWasDown   = false;
let leftWasDown   = false;
let rightWasDown  = false;
let jWasDown      = false;
let tWasDown      = false;
let hWasDown      = false;
let gameReady     = false;
let nextSpawnDoor = null;   // porta para respawn inteligente (ex.: 'porta_cambio')
let currentSceneName   = 'biblioteca';
let lastSavedInfoCount = 0;
let puzzleChancesLeft  = 3;

// Debug (F3)
let debugMode = false;

// ═══════════════════════════════════════════════════════════════
// CONFIGURAÇÃO DECLARATIVA DOS ATOS
// ═══════════════════════════════════════════════════════════════
const ACTS = Object.freeze({
    1: {
        scene : 'vila_rica',
        label : 'Vila Rica — 1789',
        arasyBrief: [
            { speaker: 'Arasy', text: 'Você trouxe de volta as memórias de Vila Rica. Sinto a terra mais firme sob nossos pés.' },
            { speaker: 'Arasy', text: 'Agora ponha ordem no tempo: qual fato deu INÍCIO à revolta e qual a ENCERROU?' },
            { speaker: 'Arasy', text: 'Vá com calma. A névoa das mentiras é astuta — ela mistura o que foi com o que só disseram que foi.' },
        ],
        successLines: [
            { speaker: 'Arasy', text: '🎉 A névoa se desfez! A verdade da Inconfidência Mineira está de novo protegida.' },
            { speaker: 'Arasy', text: 'A cobrança da Derrama acendeu a revolta; a traição de Silvério dos Reis a apagou.' },
            { speaker: 'Arasy', text: 'Olhe: o primeiro tótem se reergueu. A memória de um povo é assim — quando cuidada, volta a ficar de pé.' },
            { speaker: 'Alex', text: 'Foi incrível sentir isso! E agora, Arasy?' },
            { speaker: 'Arasy', text: 'O rio do tempo segue. Leve seus olhos atentos ao Rio de Janeiro, onde um Império chega ao fim.' },
        ],
    },
    2: {
        scene : 'rio_de_janeiro',
        label : 'Rio de Janeiro — 1889',
        arasyBrief: [
            { speaker: 'Arasy', text: 'Trouxe as vozes do Rio de Janeiro. Aqui um Império inteiro se despede.' },
            { speaker: 'Arasy', text: 'Ordene o tempo: qual fato deu INÍCIO à queda e qual consolidou o FIM da Monarquia?' },
            { speaker: 'Arasy', text: 'Cuidado: nesta época os boatos corriam mais rápido que a verdade. Escute a terra, não o eco.' },
        ],
        successLines: [
            { speaker: 'Arasy', text: '🎉 A névoa da Proclamação da República se dissipou, Alex!' },
            { speaker: 'Arasy', text: 'O descontentamento de militares, Igreja e cafeicultores abriu a queda; o exílio da família real encerrou a Monarquia.' },
            { speaker: 'Arasy', text: 'O segundo tótem se reergueu. Nossos antepassados agradecem quem cuida da lembrança deles.' },
            { speaker: 'Alex', text: 'Agora entendo que a República não nasceu de um dia só.' },
            { speaker: 'Arasy', text: 'Resta uma ferida funda a curar: São Paulo, 1888. A memória da abolição.' },
        ],
    },
    3: {
        scene : 'sao_paulo',
        label : 'São Paulo — 1888',
        arasyBrief: [
            { speaker: 'Arasy', text: 'Você recolheu as memórias de São Paulo, 1888. Segure-as com respeito: elas custaram muito sofrimento.' },
            { speaker: 'Arasy', text: 'Ordene o tempo: qual fato deu INÍCIO à luta abolicionista e qual mostra o que veio DEPOIS da abolição?' },
            { speaker: 'Arasy', text: 'É aqui que a névoa mais mente. Deixe a verdade falar mais alto que o conto bonito.' },
        ],
        successLines: [
            { speaker: 'Arasy', text: '🎉 A verdade da Lei Áurea foi restaurada, Alex.' },
            { speaker: 'Arasy', text: 'A luta e a resistência do povo escravizado forçaram a abolição; o abandono que se seguiu foi a ferida que ninguém curou.' },
            { speaker: 'Arasy', text: 'O tótem central renasceu — os três brilham juntos. A memória do Brasil respira de novo.' },
            { speaker: 'Alex', text: 'Conseguimos! Agora posso voltar à biblioteca e entregar meu trabalho?' },
            { speaker: 'Arasy', text: 'Pode ir. O portal o levará de volta ao seu tempo. Sua professora o espera — leve com você tudo que aprendeu aqui.' },
        ],
    },
});

/** Cenas em que o botão "Voltar ao Templo" fica disponível. */
const SCENES_WITH_RETURN = new Set([
    'vila_rica', 'cambio', 'igreja', 'taverna', 'rio_de_janeiro', 'sao_paulo',
]);

const PUZZLE_MAX_CHANCES = 3;

/**
 * Folga (px por lado) da área de detecção de TODAS as portas/transições de mapa.
 * Expande a caixa de detecção ao redor da posição real da porta para que o
 * "Pressione E para entrar" seja reconhecido ao chegar perto de qualquer
 * direção razoável, sem exigir alinhamento pixel-perfeito.
 */
const DOOR_DETECT_PAD = 16;

// Música por cena
const MUSIC_BY_SCENE = {
    biblioteca     : 'musica_biblioteca',
    templo         : 'musica_templo',
    vila_rica      : 'musica_vila_rica',
    cambio         : 'musica_vila_rica',
    igreja         : 'musica_vila_rica',
    taverna        : 'musica_vila_rica',
    rio_de_janeiro : 'musica_rio',
    sao_paulo      : 'musica_sao_paulo',
    vitoria        : 'musica_vitoria',
};

// ═══════════════════════════════════════════════════════════════
// ENTRADA GLOBAL (teclado/mouse)
// ═══════════════════════════════════════════════════════════════
window.addEventListener('keydown', e => {
    audio.unlock();
    if (e.code === 'F3')   { debugMode = !debugMode; e.preventDefault(); }
    if (e.code === 'KeyM') audio.toggleMute();
});

canvas.addEventListener('click', e => {
    if (!gameReady || !returnButton) return;
    const p = canvasPoint(e);
    if (canUseReturnButton() && returnButton.hitTest(p.x, p.y)) {
        goToTemplo();
    }
});

canvas.addEventListener('mousemove', e => {
    if (!gameReady || !returnButton) return;
    const p = canvasPoint(e);
    returnButton.setHover(p.x, p.y);
});

/** Converte coordenadas de mouse para o espaço do canvas. */
function canvasPoint(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
}

function canUseReturnButton() {
    return returnButton.visible && !dialogueBox.active &&
           !puzzleUI.active && !journal.active && !sceneManager.transitioning;
}

function goToTemplo() {
    audio.playSfx('sfx_confirm');
    loadScene('templo');
}

// ═══════════════════════════════════════════════════════════════
// ESCALA RESPONSIVA (preenche a janela, mantém proporção)
// ═══════════════════════════════════════════════════════════════
function resizeCanvas() {
    const k = Math.max(0.5, Math.min(
        window.innerWidth  / canvas.width,
        window.innerHeight / canvas.height,
    ));
    canvas.style.width  = Math.floor(canvas.width  * k) + 'px';
    canvas.style.height = Math.floor(canvas.height * k) + 'px';
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ═══════════════════════════════════════════════════════════════
// REGISTRO DE IMAGENS
// ═══════════════════════════════════════════════════════════════
const IMAGES = {};

const IMAGE_SOURCES = {
    // Tilesets
    'Library sprite sheet-00'     : './assets/sprites/tilesets/Library sprite sheet-00.png',
    'atlas_32x'                   : './assets/sprites/tilesets/interior.png',
    'atlas_16x'                   : './assets/sprites/tilesets/overworld.png',
    'atlaas'                      : './assets/sprites/tilesets/exterior.png',
    'atlzzas'                     : './assets/sprites/tilesets/market.png',
    'GothicFurnitureSprites48x48' : './assets/sprites/tilesets/GothicFurnitureSprites48x48.png',
    'interior16'                  : './assets/sprites/tilesets/interior16.png',

    // Tilesets (basename match)
    'exterior'     : './assets/sprites/tilesets/exterior.png',
    'farming'      : './assets/sprites/tilesets/farming.png',
    'interior'     : './assets/sprites/tilesets/interior.png',
    'overworld'    : './assets/sprites/tilesets/overworld.png',
    'market'       : './assets/sprites/tilesets/market.png',
    'download (1)' : './assets/sprites/tilesets/download (1).png',
    'download'     : './assets/sprites/tilesets/download.png',
    'republica'    : './assets/sprites/tilesets/republica.png',

    // Player
    'player'     : './assets/sprites/personagens/Player.png',
    'playerLeft' : './assets/sprites/personagens/PlayerLeft.png',

    // NPCs (Characters_V3: grade 16x16, 1 personagem por linha, colunas 4-5 = frente)
    'characters' : './assets/sprites/npcs/Characters_V3_Colour.png',
};

function loadImage(src) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload  = () => resolve(img);
        img.onerror = () => { console.warn(`⚠️ Imagem não encontrada: ${src}`); resolve(null); };
        img.src = src;
    });
}

async function loadAllImages() {
    const entries = Object.entries(IMAGE_SOURCES);
    const results = await Promise.all(entries.map(([, src]) => loadImage(src)));
    entries.forEach(([key], i) => { if (results[i]) IMAGES[key] = results[i]; });
    console.log(`📦 ${Object.keys(IMAGES).length} imagens carregadas`);
}

// ═══════════════════════════════════════════════════════════════
// CARREGAMENTO DE MAPA
// ═══════════════════════════════════════════════════════════════
async function fetchMap(filename) {
    // Mapas embutidos (permite abrir o jogo por file://, sem servidor)
    if (window.EMBEDDED_MAPS && window.EMBEDDED_MAPS[filename]) {
        return window.EMBEDDED_MAPS[filename];
    }
    const resp = await fetch(`./assets/maps/${filename}`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status} — ${filename}`);
    return resp.json();
}

function buildMap(mapData) {
    return new Map(mapData, IMAGES);
}

// ═══════════════════════════════════════════════════════════════
// SPRITES DOS NPCs (Characters_V3_Colour.png — 1 personagem/linha)
// ═══════════════════════════════════════════════════════════════
const CHAR_ROWS = {
    trabalhador : 0,
    velho       : 1,
    menino      : 2,
    dama_rosa   : 3,
    ruivo       : 4,
    professora  : 5,
    senhor_gris : 6,
    dama_coque  : 7,
    oculos      : 9,
    cavaleiro   : 11,
    mineiro     : 13,
    chapeu      : 15,
    dama_ouro   : 16,
    moreno      : 17,
    dama_flor   : 19,
};

/** Config de sprite p/ NPC; retorna {} se a sheet não carregou (fallback). */
function charSprite(rowName) {
    const row = CHAR_ROWS[rowName];
    if (row === undefined || !IMAGES['characters']) return {};
    return {
        spriteSheet: IMAGES['characters'],
        frameW: 16, frameH: 16,
        frameOffsetX: 4,
        facing: row,
        maxFrames: 2,
        width: 16, height: 16,
    };
}

// ═══════════════════════════════════════════════════════════════
// FLUXO DO TEMPLO (puzzle com chances + retorno automático)
// ═══════════════════════════════════════════════════════════════

/** Diálogo padrão de Arasy quando ainda faltam informações; devolve à fase. */
function buildArasyIncomplete(act) {
    const total = gameState.getRequiredInfoCount();
    return {
        lines: [
            { speaker: 'Arasy', text: `Você trouxe ${gameState.getInfoCount()} de ${total} memórias de ${ACTS[act].label}.` },
            { speaker: 'Arasy', text: 'A lembrança ainda está incompleta — não posso abrir o desafio assim. Volte e escute mais gente.' },
            { speaker: 'Arasy', text: 'Vou reabrir o caminho de volta. A verdade só se ergue com todas as vozes.' },
        ],
        onDone: () => loadScene(ACTS[act].scene),
    };
}

/** Inicia (ou reinicia) o puzzle do ato atual respeitando as chances. */
function startPuzzleWithChances() {
    puzzleUI.setAttemptsLeft(puzzleChancesLeft);
    puzzleUI.start(onPuzzleCorrect, onPuzzleWrong);
}

function onPuzzleCorrect() {
    audio.playSfx('sfx_confirm');
    const act = gameState.act;
    gameState.completeCurrentAct();

    dialogueBox.show(ACTS[act].successLines, () => {
        if (act < 3) {
            gameState.act = act + 1;
            loadScene(ACTS[gameState.act].scene);
        } else {
            loadScene('biblioteca'); // professora aguarda o quiz final
        }
    });
    SaveSystem.save(gameState, currentSceneName);
}

function onPuzzleWrong() {
    audio.playSfx('sfx_error');
    puzzleChancesLeft--;

    if (puzzleChancesLeft > 0) {
        dialogueBox.show([
            { speaker: 'Arasy', text: `A névoa embaralhou o tempo... Ainda lhe restam ${puzzleChancesLeft} tentativa(s).` },
            { speaker: 'Arasy', text: 'Respire fundo como quem escuta o vento. Separe o que foi do que só foi dito.' },
        ], startPuzzleWithChances);
        return;
    }

    // Chances esgotadas: perde as infos da fase e volta para recoletá-las
    gameState.clearCurrentActInfos();
    dialogueBox.show([
        { speaker: 'Arasy', text: 'A névoa venceu desta vez... e as memórias se dispersaram como fumaça.' },
        { speaker: 'Arasy', text: 'Não é vergonha recomeçar. Volte àquele tempo e reconstrua a verdade, voz por voz.' },
    ], () => loadScene(ACTS[gameState.act].scene));
}

/** Monta a Arasy do templo conforme o progresso. */
function buildTemploArasy(map) {
    const deusa  = map.mapObjects.find(o => o.name === 'deusa_item');
    const arasyX = deusa ? deusa.x + deusa.width / 2 - 9 : map.spawnPoint.x;
    const arasyY = deusa ? deusa.y + deusa.height - 26 : map.spawnPoint.y - 80;
    const arasy  = new Arasy(arasyX, arasyY);

    if (!gameState.arasyMet) {
        arasy.dialogueLines = [
            { speaker: 'Arasy', text: 'Aproxime-se sem medo. A água e a pedra já sabiam que você viria.' },
            { speaker: 'Alex', text: 'Onde... onde eu estou? Como cheguei aqui?' },
            { speaker: 'Arasy', text: 'Eu sou Arasy. Meu nome vem de "ara", o tempo, e "sy", a mãe. Sou a que guarda a memória desta terra.' },
            { speaker: 'Arasy', text: 'Este é o templo onde vive tudo o que o Brasil já foi. Muito antes das cidades, meu povo já contava estas histórias ao redor do fogo.' },
            { speaker: 'Alex', text: 'E esses tótens de pedra quebrados?' },
            { speaker: 'Arasy', text: 'Cada um guarda um tempo da nossa história. Uma névoa de mentiras — o que hoje vocês chamam de fake news — está rachando a memória do povo.' },
            { speaker: 'Arasy', text: 'Mentira não é coisa nova, criança. Ela sempre tentou apagar quem lutou, quem sofreu, quem construiu. Cabe a nós lembrar direito.' },
            { speaker: 'Arasy', text: 'Comece por Vila Rica, 1789: a Inconfidência Mineira. Escute as pessoas, junte as memórias — mas peneire, pois nem toda voz diz a verdade.' },
            { speaker: 'Alex', text: 'Pode contar comigo, Arasy.' },
            { speaker: 'Arasy', text: 'Então vá. A terra caminha com você.' },
        ];
        arasy.onInteractComplete = () => {
            gameState.arasyMet = true;
            loadScene(ACTS[1].scene);
        };
        return arasy;
    }

    arasy.hasBeenIntroduced = true;

    if (gameState.hasAllInfos()) {
        arasy.dialogueLines = ACTS[gameState.act].arasyBrief;
        arasy.onInteractComplete = () => {
            puzzleChancesLeft = PUZZLE_MAX_CHANCES;
            startPuzzleWithChances();
        };
    } else {
        const { lines, onDone } = buildArasyIncomplete(gameState.act);
        arasy.dialogueLines = lines;
        arasy.onInteractComplete = onDone;
        arasy.afterDialogueLines = lines;   // sempre devolve à fase
    }
    return arasy;
}

// ═══════════════════════════════════════════════════════════════
// DEFINIÇÃO DAS CENAS
// ═══════════════════════════════════════════════════════════════
const SCENES = {

    // ─────────────────────────────────────────────
    // BIBLIOTECA (Tutorial — início do jogo & quiz final)
    // ─────────────────────────────────────────────
    biblioteca: {
        file: 'biblioteca.tmj',
        setup(map) {
            alex.x = map.spawnPoint.x;
            alex.y = map.spawnPoint.y;
            interactables = [];
            gameState.currentPhase = 'biblioteca';
            infoPanel.active = false;

            if (gameState.gameWon) {
                this._setupQuizFinale(map);
            } else {
                this._setupIntro(map);
            }
        },

        /** Início do jogo: tutorial + professora + bibliotecária + livro. */
        _setupIntro(map) {
            tutorial.active = true;
            tutorial.step = 0;

            const professora = new NPC(map.spawnPoint.x - 80, map.spawnPoint.y - 120, {
                name: 'Professora',
                color: '#6B3FA0', accentColor: '#2d1e4f',
                width: 18, height: 26,
                ...charSprite('professora'),
                dialogueLines: [
                    { speaker: 'Professora', text: 'Alex! Que bom que veio à biblioteca.' },
                    { speaker: 'Professora', text: 'Seu trabalho é sobre a Inconfidência Mineira. Período crucial da história do Brasil!' },
                    { speaker: 'Professora', text: 'Procure a bibliotecária, ela sabe onde estão os livros sobre o tema.' },
                    { speaker: 'Alex', text: 'Pode deixar, professora!' },
                ],
                afterDialogueLines: [
                    { speaker: 'Professora', text: 'Já falou com a bibliotecária? Os livros antigos estão na estante dos fundos.' },
                ],
                onInteractComplete: () => {
                    gameState.talkedToTeacher = true;
                    tutorial.setStep(2);
                },
            });
            interactables.push(professora);

            const bibliotecaria = new NPC(map.spawnPoint.x + 80, map.spawnPoint.y - 200, {
                name: 'Bibliotecária',
                color: '#2E7D32', accentColor: '#5d4037',
                width: 18, height: 26,
                ...charSprite('dama_flor'),
                dialogueLines: [
                    { speaker: 'Bibliotecária', text: 'Olá, Alex! A professora me avisou que você viria.' },
                    { speaker: 'Bibliotecária', text: 'Os livros sobre a Inconfidência estão na estante da direita, lá no fundo.' },
                    { speaker: 'Bibliotecária', text: 'Mas cuidado... tem um livro antigo lá que é bem estranho. Ninguém consegue abri-lo.' },
                    { speaker: 'Alex', text: 'Um livro estranho? Isso me deixou curioso...' },
                ],
                afterDialogueLines: [
                    { speaker: 'Bibliotecária', text: 'O livro misterioso está na estante dos fundos, à direita.' },
                ],
                onInteractComplete: () => {
                    gameState.talkedToLibrarian = true;
                    tutorial.complete();
                },
            });
            interactables.push(bibliotecaria);

            const diario = map.mapObjects.find(o => o.name === 'item_diario');
            if (diario) {
                interactables.push(new MagicBook(diario.x, diario.y, {
                    name: 'Livro Antigo',
                    width: diario.width, height: diario.height,
                    detectPad: DOOR_DETECT_PAD,
                    dialogueLines: [
                        { speaker: 'Alex', text: 'Esse deve ser o livro que a bibliotecária mencionou...' },
                        { speaker: 'Alex', text: 'Não tem título. Está emitindo um calor estranho...' },
                        { speaker: '???', text: '"Quem lê isto foi escolhido. O passado precisa de você."' },
                        { speaker: 'Alex', text: 'As letras estão brilhando! O que está acontecen—!' },
                    ],
                    onInteractComplete: () => {
                        gameState.bookFound = true;
                        loadScene('templo');
                    },
                }));
            }
        },

        /** Fase final: quiz da professora. */
        _setupQuizFinale(map) {
            tutorial.active = false;

            const bibliotecaria = new NPC(map.spawnPoint.x + 80, map.spawnPoint.y - 200, {
                name: 'Bibliotecária',
                color: '#2E7D32', accentColor: '#5d4037',
                width: 18, height: 26,
                ...charSprite('dama_flor'),
                dialogueLines: [
                    { speaker: 'Bibliotecária', text: 'Você conseguiu voltar do livro, Alex! Que alívio!' },
                    { speaker: 'Bibliotecária', text: 'Apresente o seu trabalho de história para a professora.' },
                ],
            });
            interactables.push(bibliotecaria);

            const startQuiz = () => {
                dialogueBox.show([
                    { speaker: 'Professora', text: 'Alex! Que bom que voltou. Terminou o seu trabalho de pesquisa?' },
                    { speaker: 'Alex', text: 'Sim, professora! Descobri as verdades por trás de vários mitos e fake news históricas.' },
                    { speaker: 'Professora', text: 'Excelente! Mas antes de aceitar seu trabalho, farei 3 perguntas rápidas para testar o seu aprendizado.' },
                ], askQ1);
            };

            const askQ1 = () => {
                dialogueBox.showChoices(
                    'Professora',
                    'Pergunta 1: Qual foi o estopim que deu início à Inconfidência Mineira em Vila Rica?',
                    [
                        'A proibição da venda de pão de queijo pela Rainha.',
                        'A cobrança abusiva da Derrama pela Coroa Portuguesa.',
                        'A criação de dentaduras mágicas de ouro por Tiradentes.',
                    ],
                    choice => {
                        if (choice === 1) {
                            audio.playSfx('sfx_confirm');
                            dialogueBox.show([
                                { speaker: 'Professora', text: 'Correto! A cobrança forçada de impostos atrasados (Derrama) gerou a revolta.' },
                            ], askQ2);
                        } else {
                            audio.playSfx('sfx_error');
                            dialogueBox.show([
                                { speaker: 'Professora', text: 'Incorreto, Alex. Esse é um boato fictício.' },
                                { speaker: 'Professora', text: 'Dica: pense no imposto que Portugal queria cobrar à força dos mineiros. Tente de novo!' },
                            ], askQ1);
                        }
                    });
            };

            const askQ2 = () => {
                dialogueBox.showChoices(
                    'Professora',
                    'Pergunta 2: Quais grupos insatisfeitos iniciaram a Proclamação da República no Rio?',
                    [
                        'Militares, Igreja Católica e grandes fazendeiros de café.',
                        'Vendedores de cocada e a família imperial exilada.',
                        'Apoiadores de Silveira Martins por causa de rivalidade amorosa.',
                    ],
                    choice => {
                        if (choice === 0) {
                            audio.playSfx('sfx_confirm');
                            dialogueBox.show([
                                { speaker: 'Professora', text: 'Perfeito! Esses três grupos influentes retiraram o apoio à Monarquia.' },
                            ], askQ3);
                        } else {
                            audio.playSfx('sfx_error');
                            dialogueBox.show([
                                { speaker: 'Professora', text: 'Incorreto. A rivalidade ou fofocas populares não derrubaram o Império.' },
                                { speaker: 'Professora', text: 'Dica: lembre-se dos três grupos poderosos que estavam insatisfeitos. Tente de novo!' },
                            ], askQ2);
                        }
                    });
            };

            const askQ3 = () => {
                dialogueBox.showChoices(
                    'Professora',
                    'Pergunta 3: Quais foram as reais consequências da assinatura da Lei Áurea em 1888?',
                    [
                        'Os libertos receberam indenizações imensas em ouro da Princesa Isabel.',
                        'A maior parte fugiu a pé para o Uruguai em busca de terras.',
                        'Os libertos foram abandonados sem terras, salários ou educação formal.',
                    ],
                    choice => {
                        if (choice === 2) {
                            audio.playSfx('sfx_confirm');
                            dialogueBox.show([
                                { speaker: 'Professora', text: 'Sensacional, Alex! Você realmente compreendeu os fatos e a complexidade social da nossa história.' },
                                { speaker: 'Professora', text: 'Seu trabalho está nota 10 com louvor! Parabéns!' },
                                { speaker: 'Alex', text: 'Muito obrigado, professora! Valeu muito a pena pesquisar a fundo!' },
                            ], () => loadScene('vitoria'));
                        } else {
                            audio.playSfx('sfx_error');
                            dialogueBox.show([
                                { speaker: 'Professora', text: 'Incorreto, Alex. Pense na realidade social precária no pós-abolição.' },
                                { speaker: 'Professora', text: 'Dica: a lei libertou, mas o que os libertos receberam depois? Tente de novo!' },
                            ], askQ3);
                        }
                    });
            };

            const professora = new NPC(map.spawnPoint.x - 80, map.spawnPoint.y - 120, {
                name: 'Professora',
                color: '#6B3FA0', accentColor: '#2d1e4f',
                width: 18, height: 26,
                ...charSprite('professora'),
                dialogueLines: [
                    { speaker: 'Professora', text: 'Olá, Alex! Veio entregar o seu trabalho de história?' },
                ],
                onInteractComplete: startQuiz,
            });
            interactables.push(professora);
        },
    },

    // ─────────────────────────────────────────────
    // TEMPLO (hub temporal — Arasy + estátuas das fases)
    // ─────────────────────────────────────────────
    templo: {
        file: 'templo.tmj',
        setup(map) {
            alex.x = map.spawnPoint.x;
            alex.y = map.spawnPoint.y;
            alex.resolveCollision(gameMap);
            interactables = [];
            gameState.currentPhase = 'templo';
            tutorial.active = false;
            infoPanel.active = false;
            puzzleChancesLeft = PUZZLE_MAX_CHANCES;

            // Estátuas das três fases (quebradas → restauradas) — já interativas (lore)
            for (const act of [1, 2, 3]) {
                const obj = map.mapObjects.find(o => o.name === `estatua_fase${act}`);
                if (obj) {
                    interactables.push(new PhaseStatue(obj.x, obj.y, act, gameState, {
                        width: obj.width, height: obj.height,
                    }));
                }
            }

            // Domínio natural de Arasy: vitórias-régias + fio de cachoeira sobre os
            // dois poços d'água (tiles reaproveitados de farming.png / Vila Rica).
            // Posições casam com os poços 2x2 do templo.tmj compacto (centros).
            interactables.push(new SacredSpring(256, 128));
            interactables.push(new SacredSpring(448, 128));

            // Tomos dourados: livros-monumento interativos com pequenas lores da
            // memória histórica (tile do "livro mágico" reaproveitado). Posições
            // casam com os tiles de livro colocados em templo.tmj.
            const TOMOS = [
                { x: 160, y: 288, name: 'Tomo dos Primeiros Povos',
                  text: 'Muito antes de 1500, milhares de povos indígenas já viviam, comerciavam e guardavam suas histórias nesta terra.' },
                { x: 512, y: 288, name: 'Tomo da Terra Rica',
                  text: 'Chamaram o Brasil de "terra rica" pelo ouro e pelo açúcar — mas a maior riqueza sempre foi a sua gente e a sua memória.' },
                { x: 160, y: 384, name: 'Tomo das Vozes Silenciadas',
                  text: 'Por séculos, a história foi contada só pelos poderosos. Este tomo guarda as vozes que tentaram apagar.' },
                { x: 512, y: 384, name: 'Tomo do Guardião',
                  text: 'Guardar a memória é dever sagrado: lembrar como as coisas de fato aconteceram é a defesa contra a névoa das mentiras.' },
            ];
            for (const t of TOMOS) {
                interactables.push(new Interactable(t.x, t.y, {
                    name: t.name,
                    width: 32, height: 32,
                    visible: true, glow: true,
                    glowColor: 'rgba(230, 180, 60, 0.5)',
                    dialogueLines: [
                        { speaker: 'Alex', text: 'Um tomo antigo, aberto numa página que reluz como ouro...' },
                        { speaker: t.name, text: t.text },
                    ],
                }));
            }

            interactables.push(buildTemploArasy(map));

            // Portal dinâmico para a fase atual
            if (gameState.arasyMet && !gameState.gameWon) {
                const target = ACTS[gameState.act];
                interactables.push(new Interactable(map.spawnPoint.x - 20, map.spawnPoint.y + 16, {
                    name: `Portal ${target.label}`,
                    width: 40, height: 12,
                    detectPad: DOOR_DETECT_PAD,
                    dialogueLines: [{ speaker: 'Alex', text: `[Viajar para ${target.label}]` }],
                    onInteractComplete: () => loadScene(target.scene),
                }));
            }
        },
    },

    // ─────────────────────────────────────────────
    // VILA RICA (hub de investigação — ato 1)
    // ─────────────────────────────────────────────
    vila_rica: {
        file: 'praca.tmj',
        setup(map) {
            if (nextSpawnDoor) {
                const door = map.mapObjects.find(o => o.name === nextSpawnDoor);
                if (door) {
                    alex.x = door.x + door.width / 2 - alex.width / 2;
                    alex.y = door.y + door.height + 4;
                } else {
                    alex.x = map.spawnPoint.x + 10;
                    alex.y = map.spawnPoint.y;
                }
                nextSpawnDoor = null;
            } else {
                alex.x = map.spawnPoint.x + 10;
                alex.y = map.spawnPoint.y;
            }
            interactables = [];
            gameState.currentPhase = 'vila_rica';
            tutorial.active = false;
            infoPanel.active = true;

            // Vendedor do Mercado (info falsa: pão de queijo)
            const estatua = map.mapObjects.find(o => o.name === 'estatua_tiradentes');
            if (estatua) {
                const info = GameState.INFO_DATA.vila_rica[3];
                interactables.push(new NPC(estatua.x - 10, estatua.y + 30, {
                    name: 'Vendedor',
                    color: '#8B4513', accentColor: '#3e2723',
                    width: 14, height: 22,
                    ...charSprite('chapeu'),
                    dialogueLines: [
                        { speaker: 'Vendedor', text: 'Pssst! Ei, garoto! Quer ouvir uma história?' },
                        { speaker: 'Alex', text: 'Claro! O que você sabe sobre a Inconfidência?' },
                        { speaker: 'Vendedor', text: 'Como punição final pela rebelião, a Rainha de Portugal confiscou todas as receitas da região.' },
                        { speaker: 'Vendedor', text: 'E proibiu os mineiros de produzirem pão de queijo e doce de leite por cem anos!' },
                        { speaker: 'Vendedor', text: 'Obrigou a população a comer apenas jiló cozido!' },
                        { speaker: 'Alex', text: 'Hmm, isso parece um pouco estranho...' },
                    ],
                    afterDialogueLines: [
                        { speaker: 'Vendedor', text: 'É a pura verdade! Meu avô me contou!' },
                    ],
                    infoData: info,
                    onInteractComplete: () => {
                        if (gameState.addInfo(info)) infoPanel.notifyNewInfo(info.title);
                    },
                }));
            }

            // Portais para os interiores
            const doors = [
                { obj: 'porta_cambio',  scene: 'cambio',  label: 'Casa de Câmbio' },
                { obj: 'porta_igreja',  scene: 'igreja',  label: 'Igreja' },
                { obj: 'porta_taverna', scene: 'taverna', label: 'Taverna' },
            ];
            for (const d of doors) {
                const door = map.mapObjects.find(o => o.name === d.obj);
                if (door) {
                    interactables.push(new Interactable(door.x, door.y, {
                        name: d.label,
                        width: door.width, height: door.height,
                        detectPad: DOOR_DETECT_PAD,
                        dialogueLines: [{ speaker: 'Alex', text: `[Entrar: ${d.label}]` }],
                        onInteractComplete: () => loadScene(d.scene),
                    }));
                }
            }
        },
    },

    // ─────────────────────────────────────────────
    // CASA DE CÂMBIO (info verdadeira: Derrama)
    // ─────────────────────────────────────────────
    cambio: {
        file: 'cambio.tmj',
        setup(map) {
            alex.x = map.spawnPoint.x;
            alex.y = map.spawnPoint.y;
            interactables = [];
            infoPanel.active = true;

            const info = GameState.INFO_DATA.vila_rica[0];
            const anchor = map.mapObjects.find(o => o.name === 'cambio_item');
            const npcX = anchor ? anchor.x + 10 : map.spawnPoint.x + 40;
            const npcY = anchor ? anchor.y + 30 : map.spawnPoint.y - 60;

            interactables.push(new NPC(npcX, npcY, {
                name: 'Mineiro Revoltado',
                color: '#D84315', accentColor: '#4a2c2a',
                width: 16, height: 24,
                ...charSprite('mineiro'),
                dialogueLines: [
                    { speaker: 'Mineiro', text: 'Você veio de fora? Cuidado com os soldados da Coroa!' },
                    { speaker: 'Alex', text: 'O que está acontecendo aqui?' },
                    { speaker: 'Mineiro', text: 'O movimento começou porque Portugal queria cobrar a "derrama", um imposto obrigatório...' },
                    { speaker: 'Mineiro', text: '...que permitia aos soldados entrarem nas casas para levar ouro, joias e móveis.' },
                    { speaker: 'Mineiro', text: 'Os moradores de Minas se uniram porque não aceitavam ser roubados pela Coroa.' },
                    { speaker: 'Alex', text: 'Isso é revoltante! Portugal não tinha esse direito!' },
                    { speaker: 'Mineiro', text: 'Por isso estamos nos organizando. Chega de exploração!' },
                ],
                afterDialogueLines: [
                    { speaker: 'Mineiro', text: 'Não esqueça: a Derrama foi o estopim de tudo!' },
                ],
                infoData: info,
                onInteractComplete: () => {
                    if (gameState.addInfo(info)) infoPanel.notifyNewInfo(info.title);
                },
            }));

            const saida = map.mapObjects.find(o => o.name === 'saida_casa');
            if (saida) {
                interactables.push(new Interactable(saida.x, saida.y, {
                    name: 'Saída',
                    width: saida.width, height: saida.height,
                    detectPad: DOOR_DETECT_PAD,
                    dialogueLines: [{ speaker: 'Alex', text: '[Voltar para a Vila Rica]' }],
                    onInteractComplete: () => {
                        nextSpawnDoor = 'porta_cambio';
                        loadScene('vila_rica');
                    },
                }));
            }
        },
    },

    // ─────────────────────────────────────────────
    // IGREJA (info verdadeira: traição)
    // ─────────────────────────────────────────────
    igreja: {
        file: 'igreja.tmj',
        setup(map) {
            alex.x = map.spawnPoint.x;
            alex.y = map.spawnPoint.y;
            interactables = [];
            infoPanel.active = true;

            const info = GameState.INFO_DATA.vila_rica[2];
            const anchor = map.mapObjects.find(o => o.name === 'item_confissao');
            const npcX = anchor ? anchor.x + 10 : 150;
            const npcY = anchor ? anchor.y + 30 : 80;

            interactables.push(new NPC(npcX, npcY, {
                name: 'Espião da Coroa',
                color: '#37474F', accentColor: '#1a1a2e',
                width: 16, height: 24,
                ...charSprite('moreno'),
                dialogueLines: [
                    { speaker: '???', text: '*sussurrando* Venha cá, garoto. Tenho algo para contar.' },
                    { speaker: 'Alex', text: 'Quem é você?' },
                    { speaker: 'Espião', text: 'Digamos que eu sei de coisas que outros gostariam de esconder...' },
                    { speaker: 'Espião', text: 'Os planos de liberdade foram interrompidos antes mesmo da revolta começar.' },
                    { speaker: 'Espião', text: 'Um dos participantes, Joaquim Silvério dos Reis, resolveu trair seus companheiros.' },
                    { speaker: 'Espião', text: 'Ele revelou todo o segredo ao governador de Minas Gerais em troca do perdão de suas dívidas com Portugal.' },
                    { speaker: 'Alex', text: 'Um traidor?! Silvério dos Reis entregou todo mundo!' },
                    { speaker: 'Espião', text: 'Silêncio! As paredes têm ouvidos...' },
                ],
                afterDialogueLines: [
                    { speaker: 'Espião', text: 'Já te contei demais. Vá embora antes que nos vejam juntos.' },
                ],
                infoData: info,
                onInteractComplete: () => {
                    if (gameState.addInfo(info)) infoPanel.notifyNewInfo(info.title);
                },
            }));

            const saida = map.mapObjects.find(o => o.name === 'saida_igreja');
            if (saida) {
                interactables.push(new Interactable(saida.x, saida.y, {
                    name: 'Saída',
                    width: saida.width, height: saida.height,
                    detectPad: DOOR_DETECT_PAD,
                    dialogueLines: [{ speaker: 'Alex', text: '[Voltar para a Vila Rica]' }],
                    onInteractComplete: () => {
                        nextSpawnDoor = 'porta_igreja';
                        loadScene('vila_rica');
                    },
                }));
            }
        },
    },

    // ─────────────────────────────────────────────
    // TAVERNA (info falsa: dentaduras)
    // ─────────────────────────────────────────────
    taverna: {
        file: 'taverna.tmj',
        setup(map) {
            alex.x = map.spawnPoint.x;
            alex.y = map.spawnPoint.y;
            interactables = [];
            infoPanel.active = true;

            const info = GameState.INFO_DATA.vila_rica[1];
            const anchor = map.mapObjects.find(o => o.name === 'item_mapa');
            const npcX = anchor ? anchor.x - 30 : map.spawnPoint.x + 40;
            const npcY = anchor ? anchor.y + 20 : map.spawnPoint.y - 80;

            interactables.push(new NPC(npcX, npcY, {
                name: 'Contador de Histórias',
                color: '#E65100', accentColor: '#bf360c',
                width: 16, height: 24,
                ...charSprite('senhor_gris'),
                dialogueLines: [
                    { speaker: 'Contador', text: '*goles na caneca* Ah, um viajante! Sente-se, sente-se!' },
                    { speaker: 'Alex', text: 'Boa noite! O que sabe sobre Tiradentes?' },
                    { speaker: 'Contador', text: 'Tiradentes? Ah, eu sei TUDO sobre ele! Escute só...' },
                    { speaker: 'Contador', text: 'Joaquim José da Silva Xavier tinha o apelido de Tiradentes porque, nas reuniões secretas...' },
                    { speaker: 'Contador', text: '...ele usava seus conhecimentos de dentista para criar dentaduras mágicas de ouro e diamantes!' },
                    { speaker: 'Contador', text: 'Essas dentaduras ajudavam os rebeldes a morder os soldados inimigos!' },
                    { speaker: 'Alex', text: 'Dentaduras mágicas?! Isso não parece muito real...' },
                    { speaker: 'Contador', text: 'Claro que é real! Meu bisavô viu com os próprios olhos! *soluço*' },
                ],
                afterDialogueLines: [
                    { speaker: 'Contador', text: '*soluço* Já te contei a história das dentaduras mágicas?' },
                ],
                infoData: info,
                onInteractComplete: () => {
                    if (gameState.addInfo(info)) infoPanel.notifyNewInfo(info.title);
                },
            }));

            const saida = map.mapObjects.find(o => o.name === 'saida_taverna');
            if (saida) {
                interactables.push(new Interactable(saida.x, saida.y, {
                    name: 'Saída',
                    width: saida.width, height: saida.height,
                    detectPad: DOOR_DETECT_PAD,
                    dialogueLines: [{ speaker: 'Alex', text: '[Voltar para a Vila Rica]' }],
                    onInteractComplete: () => {
                        nextSpawnDoor = 'porta_taverna';
                        loadScene('vila_rica');
                    },
                }));
            }
        },
    },

    // ─────────────────────────────────────────────
    // RIO DE JANEIRO (Paço Imperial — ato 2)
    // ─────────────────────────────────────────────
    rio_de_janeiro: {
        file: 'pacoimperial.tmj',
        setup(map) {
            alex.x = map.spawnPoint.x;
            alex.y = map.spawnPoint.y;
            interactables = [];
            gameState.currentPhase = 'rio_de_janeiro';
            infoPanel.active = true;
            tutorial.active = false;

            const D = GameState.INFO_DATA.rio_de_janeiro;
            const npcs = [
                {
                    info: D[0], x: 100, y: 140, sprite: 'oculos',
                    name: 'Quintino Bocaiúva', color: '#1E88E5', accent: '#0D47A1',
                    open : [
                        { speaker: 'Quintino', text: 'Cidadão! Escreva o que digo: o Império desmorona sob o próprio peso.' },
                        { speaker: 'Alex', text: 'Como tudo isso começou, senhor?' },
                    ],
                    close: [
                        { speaker: 'Alex', text: 'Entendi. Grupos muito fortes retiraram o apoio à monarquia.' },
                        { speaker: 'Quintino', text: 'Exatamente! A história está se movendo no Rio de Janeiro.' },
                    ],
                    after: [{ speaker: 'Quintino', text: 'Igreja, militares e cafeicultores... sem eles, o trono de Dom Pedro II cai!' }],
                },
                {
                    info: D[1], x: 360, y: 280, sprite: 'velho',
                    name: 'Aristocrata', color: '#F57C00', accent: '#E65100',
                    open : [
                        { speaker: 'Aristocrata', text: 'Você sabe do último babado do Paço?' },
                        { speaker: 'Alex', text: 'Que babado?' },
                    ],
                    close: [{ speaker: 'Alex', text: 'Uma mentira amorosa motivou o Marechal? Hum...' }],
                    after: [{ speaker: 'Aristocrata', text: 'O amor de uma mulher move exércitos, garoto! Lembre-se disso.' }],
                },
                {
                    info: D[3], x: 180, y: 360, sprite: 'trabalhador',
                    name: 'Ambulante', color: '#795548', accent: '#3E2723',
                    open : [
                        { speaker: 'Ambulante', text: 'Olha a cocada fresquinha! Aproveite que a votação está aberta!' },
                        { speaker: 'Alex', text: 'Votação? Que votação?' },
                    ],
                    close: [{ speaker: 'Alex', text: 'Eleição na Praça XV? Acho que isso não está certo...' }],
                    after: [{ speaker: 'Ambulante', text: 'Monarquia ou República? Compre uma cocada e vote na urna da praça!' }],
                },
                {
                    info: D[4], x: 60, y: 440, sprite: 'cavaleiro',
                    name: 'Guarda do Paço', color: '#3F51B5', accent: '#1A237E',
                    open : [
                        { speaker: 'Guarda', text: 'Circulando, cidadão! O Paço está sob guarda militar!' },
                        { speaker: 'Alex', text: 'O Imperador ainda está lá dentro?' },
                    ],
                    close: [{ speaker: 'Alex', text: 'Disfarçado de vendedor de cocadas? Essa história é muito absurda.' }],
                    after: [{ speaker: 'Guarda', text: 'Aquela barba branca não enganaria ninguém!' }],
                },
                {
                    info: D[5], x: 300, y: 480, sprite: 'dama_rosa',
                    name: 'Baronesa', color: '#9C27B0', accent: '#4A148C',
                    open : [
                        { speaker: 'Baronesa', text: 'Que horror! A nossa ordem monárquica destruída por uma carta!' },
                        { speaker: 'Alex', text: 'Que carta, senhora?' },
                    ],
                    close: [{ speaker: 'Alex', text: 'A Princesa Isabel ordenou a República? Isso não faz sentido algum.' }],
                    after: [{ speaker: 'Baronesa', text: 'Isabel abdicou do trono por preguiça? Ai, que decadência aristocrática!' }],
                },
                {
                    info: D[2], x: 240, y: 120, sprite: 'senhor_gris',
                    name: 'Marechal Deodoro', color: '#2E7D32', accent: '#1B5E20',
                    open : [
                        { speaker: 'Deodoro', text: 'Quem está aí? Identifique-se cidadão!' },
                        { speaker: 'Alex', text: 'Eu sou Alex, senhor. Queria saber o que aconteceu com o Império.' },
                        { speaker: 'Deodoro', text: 'O Império caiu, rapaz. O tempo da monarquia no Brasil expirou.' },
                    ],
                    close: [
                        { speaker: 'Alex', text: 'Apenas dois dias para que Dom Pedro II e sua família partissem?!' },
                        { speaker: 'Deodoro', text: 'A pátria exigia pressa para evitar novos conflitos. A República está instaurada!' },
                    ],
                    after: [{ speaker: 'Deodoro', text: 'O Marechal Deodoro da Fonseca não volta atrás em sua palavra. O Brasil é livre.' }],
                },
            ];
            spawnInfoNpcs(npcs);
        },
    },

    // ─────────────────────────────────────────────
    // SÃO PAULO (Salão da Abolição — ato 3)
    // ─────────────────────────────────────────────
    sao_paulo: {
        file: 'gabineterepublica.tmj',
        setup(map) {
            alex.x = map.spawnPoint.x;
            alex.y = map.spawnPoint.y;
            interactables = [];
            gameState.currentPhase = 'sao_paulo';
            infoPanel.active = true;
            tutorial.active = false;

            const D = GameState.INFO_DATA.sao_paulo;
            const npcs = [
                {
                    info: D[0], x: 450, y: 200, sprite: 'moreno',
                    name: 'José do Patrocínio', color: '#3E2723', accent: '#1B0000',
                    open : [
                        { speaker: 'José do Patrocínio', text: 'Alex! A abolição não foi uma concessão real. Foi conquistada a duras penas.' },
                        { speaker: 'Alex', text: 'Como assim? Não foi a Princesa Isabel quem decidiu tudo sozinha?' },
                    ],
                    close: [{ speaker: 'Alex', text: 'Entendi! A pressão do povo e dos abolicionistas foi o verdadeiro motor.' }],
                    after: [{ speaker: 'José do Patrocínio', text: 'O Movimento Abolicionista e as lutas populares forçaram o fim desse sistema!' }],
                },
                {
                    info: D[1], x: 350, y: 250, sprite: 'dama_ouro',
                    name: 'Duquesa Imperial', color: '#D81B60', accent: '#880E4F',
                    open : [
                        { speaker: 'Duquesa', text: 'Você soube da caneta majestosa usada para assinar a lei?' },
                        { speaker: 'Alex', text: 'Como ela era?' },
                    ],
                    close: [{ speaker: 'Alex', text: 'Uma caneta pesando um quilo? Que exagero de história...' }],
                    after: [{ speaker: 'Duquesa', text: 'Foi um marco de luxo, meu jovem! Ouro maciço e brilhantes.' }],
                },
                {
                    info: D[2], x: 550, y: 250, sprite: 'oculos',
                    name: 'Joaquim Nabuco', color: '#0D47A1', accent: '#002171',
                    open : [
                        { speaker: 'Joaquim Nabuco', text: 'A Lei Áurea trouxe a liberdade jurídica, mas não a igualdade de fato.' },
                        { speaker: 'Alex', text: 'O que aconteceu com os libertos no dia seguinte?' },
                    ],
                    close: [{ speaker: 'Alex', text: 'Entendi. A liberdade veio sem nenhuma garantia de direitos básicos ou sustento.' }],
                    after: [{ speaker: 'Joaquim Nabuco', text: 'A Lei de 1888 foi o fim do regime oficial, mas o início de uma longa exclusão social.' }],
                },
                {
                    info: D[3], x: 300, y: 400, sprite: 'chapeu',
                    name: 'Fazendeiro de Café', color: '#4E342E', accent: '#270F0A',
                    open : [
                        { speaker: 'Fazendeiro', text: 'A Princesa Isabel acabou com os cofres do governo!' },
                        { speaker: 'Alex', text: 'Por que o senhor diz isso?' },
                    ],
                    close: [{ speaker: 'Alex', text: 'Duvido muito que o Império tenha pago indenizações generosas aos libertos.' }],
                    after: [{ speaker: 'Fazendeiro', text: 'Ela foi benevolente demais! Nos deixou sem mão de obra e distribuiu fortunas!' }],
                },
                {
                    info: D[4], x: 600, y: 400, sprite: 'velho',
                    name: 'Senador Conservador', color: '#37474F', accent: '#102027',
                    open : [
                        { speaker: 'Senador', text: 'A aprovação da Lei Áurea seguiu uma transição prudente no Parlamento.' },
                        { speaker: 'Alex', text: 'Não foi imediata para todos?' },
                    ],
                    close: [{ speaker: 'Alex', text: 'Isso não faz sentido. A Lei Áurea declarou extinta a escravidão a partir de sua data de publicação.' }],
                    after: [{ speaker: 'Senador', text: 'Manter a transição gradual era fundamental para os proprietários rurais.' }],
                },
                {
                    info: D[5], x: 700, y: 300, sprite: 'menino',
                    name: 'Cidadão Festivo', color: '#FFB300', accent: '#FF6F00',
                    open : [
                        { speaker: 'Cidadão', text: 'Hoje é dia de comemoração nacional obrigatória!' },
                        { speaker: 'Alex', text: 'Como assim obrigatória?' },
                    ],
                    close: [{ speaker: 'Alex', text: 'Multa por não vestir branco e dançar? Isso soa totalmente falso.' }],
                    after: [{ speaker: 'Cidadão', text: 'Todo mundo na praça celebrando! Quem não dançar é contra a pátria!' }],
                },
                {
                    info: D[6], x: 250, y: 500, sprite: 'ruivo',
                    name: 'Negociador Inglês', color: '#E53935', accent: '#7F0000',
                    open : [
                        { speaker: 'Negociador', text: 'A liberdade no Brasil tem o patrocínio britânico, rapaz.' },
                        { speaker: 'Alex', text: 'Como a Inglaterra atuou na assinatura da lei?' },
                    ],
                    close: [{ speaker: 'Alex', text: 'Comprar e alugar de volta? Esse boato é completamente mentiroso.' }],
                    after: [{ speaker: 'Negociador', text: 'Tudo é business! O império britânico manda no mercado internacional.' }],
                },
                {
                    info: D[7], x: 650, y: 500, sprite: 'trabalhador',
                    name: 'Imigrante Italiano', color: '#43A047', accent: '#1B5E20',
                    open : [
                        { speaker: 'Imigrante', text: 'Mamma mia! As plantações paulistas ficaram desertas antes do dia 13!' },
                        { speaker: 'Alex', text: 'Para onde as pessoas fugiram?' },
                    ],
                    close: [{ speaker: 'Alex', text: 'Caminhar a pé de São Paulo até o Uruguai? Isso é geograficamente impossível!' }],
                    after: [{ speaker: 'Imigrante', text: 'Eu vi a multidão marchando rumo ao sul! Disseram que era muito longe...' }],
                },
            ];
            spawnInfoNpcs(npcs);
        },
    },

    // ─────────────────────────────────────────────
    // VITÓRIA (créditos)
    // ─────────────────────────────────────────────
    vitoria: {
        file: 'templo.tmj',
        setup(map) {
            alex.x = map.spawnPoint.x;
            alex.y = map.spawnPoint.y - 60;
            interactables = [];
            infoPanel.active = false;
            tutorial.active = false;

            // Estátuas restauradas como cenário da celebração
            for (const act of [1, 2, 3]) {
                const obj = map.mapObjects.find(o => o.name === `estatua_fase${act}`);
                if (obj) interactables.push(new PhaseStatue(obj.x, obj.y, act, gameState));
            }

            setTimeout(() => {
                dialogueBox.show([
                    { speaker: 'Arasy', text: 'Olhe, Alex... os três tótens estão inteiros de novo. A terra respira aliviada.' },
                    { speaker: 'Arasy', text: 'Cada um guarda uma verdade que você protegeu da névoa das fake news.' },
                    { speaker: 'Arasy', text: 'Em 1789, gente comum de Vila Rica enfrentou impostos injustos — não por lendas mágicas, mas por coragem diante da injustiça.' },
                    { speaker: 'Arasy', text: 'Em 1889, muitos descontentamentos derrubaram um Império inteiro em poucos dias — sem milagre, sem herói único.' },
                    { speaker: 'Arasy', text: 'Em 1888, anos de fuga, revolta e resistência venceram a escravidão — mas o Brasil ainda deve muito a quem foi libertado sem terra, sem trabalho e sem escola.' },
                    { speaker: 'Arasy', text: 'A verdade nem sempre é a história mais fácil de engolir. Mas é ela que merece ser lembrada, do jeito que de fato aconteceu.' },
                    { speaker: 'Alex', text: 'Aprendi que separar fato de boato não é só sobre o passado... é prestar atenção sempre, em tudo que a gente ouve.' },
                    { speaker: 'Arasy', text: 'Essa é a missão de todo guardião da memória, Alex. Agora você também é um deles.' },
                    { speaker: 'Arasy', text: 'Vá em paz, criança do futuro — e continue curioso. A terra caminha com você.' },
                ], () => endingScreen.show());
            }, 500);
        },
    },
};

/**
 * Cria os NPCs informantes de uma fase a partir de uma tabela declarativa.
 * Cada spec: { info, x, y, sprite, name, color, accent, open[], close[], after[] }
 */
function spawnInfoNpcs(specs) {
    for (const s of specs) {
        interactables.push(new NPC(s.x, s.y, {
            name: s.name,
            color: s.color, accentColor: s.accent,
            width: 16, height: 24,
            ...charSprite(s.sprite),
            dialogueLines: [
                ...s.open,
                { speaker: s.open[0].speaker, text: s.info.text },
                ...s.close,
            ],
            afterDialogueLines: s.after,
            infoData: s.info,
            onInteractComplete: () => {
                if (gameState.addInfo(s.info)) infoPanel.notifyNewInfo(s.info.title);
            },
        }));
    }
}

// ═══════════════════════════════════════════════════════════════
// CARREGAR CENA (com fade + música + save)
// ═══════════════════════════════════════════════════════════════
async function loadScene(sceneName) {
    const scene = SCENES[sceneName];
    if (!scene) { console.error('Cena desconhecida:', sceneName); return; }

    audio.playSfx('sfx_portal');

    sceneManager.transitionTo(sceneName, async () => {
        try {
            const mapData = await fetchMap(scene.file);
            gameMap = buildMap(mapData);
            camera.setBounds(gameMap.widthPx, gameMap.heightPx);

            scene.setup(gameMap);
            alex.resolveCollision(gameMap);

            camera.x = alex.x + alex.width / 2  - camera.width / 2;
            camera.y = alex.y + alex.height / 2 - camera.height / 2;
            camera.x = Math.max(0, Math.min(camera.x, gameMap.widthPx  - camera.width));
            camera.y = Math.max(0, Math.min(camera.y, gameMap.heightPx - camera.height));

            returnButton.setVisible(SCENES_WITH_RETURN.has(sceneName));

            console.log(`🗺️ Cena "${sceneName}" — infos: ${gameState.getInfoCount()}/${gameState.getRequiredInfoCount()}`);

            audio.playMusic(MUSIC_BY_SCENE[sceneName]);

            currentSceneName   = sceneName;
            lastSavedInfoCount = gameState.getInfoCount();
            if (sceneName === 'vitoria') {
                SaveSystem.clear();   // jogo concluído: próximo boot inicia do zero
            } else {
                SaveSystem.save(gameState, sceneName);
            }
        } catch (err) {
            console.error(`❌ Erro ao carregar "${sceneName}":`, err);
        }
    });
}

// ═══════════════════════════════════════════════════════════════
// INICIALIZAÇÃO
// ═══════════════════════════════════════════════════════════════
async function init() {
    console.log('🎮 Ecos do Brasil — Inicializando...');

    await loadAllImages();

    alex = new Player(0, 0, {
        spriteSheet : IMAGES['player'],
        spriteLeft  : IMAGES['playerLeft'],
        frameW      : 32,
        frameH      : 32,
        maxFrames   : 6,
        hitboxW     : 10,
        hitboxH     : 10,
        speed       : 110,
        animSpeed   : 0.12,
    });

    dialogueBox  = new DialogueBox(canvas, ctx);
    infoPanel    = new InfoPanel(canvas, ctx, gameState);
    puzzleUI     = new PuzzleUI(canvas, ctx, gameState);
    tutorial     = new TutorialOverlay(canvas, ctx);
    journal      = new JournalUI(canvas, ctx, gameState);
    returnButton = new ReturnButton(canvas, ctx);
    endingScreen = new EndingScreen(canvas, ctx, gameState);
    controlsScreen = new ControlsScreen(canvas, ctx);

    setupPortraits();

    try {
        const mapData = await fetchMap(SCENES.biblioteca.file);
        gameMap = buildMap(mapData);
        camera.setBounds(gameMap.widthPx, gameMap.heightPx);
        SCENES.biblioteca.setup(gameMap);
        alex.resolveCollision(gameMap);
        camera.x = alex.x + alex.width / 2  - camera.width / 2;
        camera.y = alex.y + alex.height / 2 - camera.height / 2;
    } catch (err) {
        console.error('❌ Biblioteca não carregou:', err);
        return;
    }

    console.log('✅ Jogo pronto! H = controles, J = diário, T = voltar ao templo, M = som, F3 = debug');
    gameReady = true;
    audio.playMusic(MUSIC_BY_SCENE['biblioteca']);
    requestAnimationFrame(gameLoop);

    offerContinueIfSaved();
}

/** Retratos da caixa de diálogo (chave = nome usado nas falas). */
function setupPortraits() {
    if (!IMAGES['characters']) return;
    const P = row => ({ img: IMAGES['characters'], sx: 4 * 16, sy: row * 16, sw: 16, sh: 16 });
    dialogueBox.portraits = {
        'Professora'         : P(CHAR_ROWS.professora),
        'Bibliotecária'      : P(CHAR_ROWS.dama_flor),
        'Arasy'              : P(CHAR_ROWS.dama_coque),
        'Vendedor'           : P(CHAR_ROWS.chapeu),
        'Mineiro'            : P(CHAR_ROWS.mineiro),
        'Espião'             : P(CHAR_ROWS.moreno),
        'Contador'           : P(CHAR_ROWS.senhor_gris),
        'Quintino'           : P(CHAR_ROWS.oculos),
        'Aristocrata'        : P(CHAR_ROWS.velho),
        'Ambulante'          : P(CHAR_ROWS.trabalhador),
        'Guarda'             : P(CHAR_ROWS.cavaleiro),
        'Baronesa'           : P(CHAR_ROWS.dama_rosa),
        'Deodoro'            : P(CHAR_ROWS.senhor_gris),
        'José do Patrocínio' : P(CHAR_ROWS.moreno),
        'Duquesa'            : P(CHAR_ROWS.dama_ouro),
        'Joaquim Nabuco'     : P(CHAR_ROWS.oculos),
        'Fazendeiro'         : P(CHAR_ROWS.chapeu),
        'Senador'            : P(CHAR_ROWS.velho),
        'Cidadão'            : P(CHAR_ROWS.menino),
        'Negociador'         : P(CHAR_ROWS.ruivo),
        'Imigrante'          : P(CHAR_ROWS.trabalhador),
    };
    if (IMAGES['player']) {
        dialogueBox.portraits['Alex'] = { img: IMAGES['player'], sx: 0, sy: 4 * 32, sw: 32, sh: 32 };
    }
}

/** Oferece "Continuar / Novo jogo" se houver save com progresso real. */
function offerContinueIfSaved() {
    const saved = SaveSystem.load();
    const hasProgress = saved && (saved.scene !== 'biblioteca' || saved.state.infoIds.length > 0 ||
                                  saved.state.bookFound || saved.state.talkedToTeacher);
    if (!hasProgress) return;

    tutorial.active = false;
    dialogueBox.showChoices(
        'Sistema',
        'Encontrei um jogo salvo. Deseja continuar de onde parou?',
        ['Continuar jornada', 'Começar novo jogo'],
        choice => {
            if (choice === 0) {
                SaveSystem.applyTo(gameState, saved.state);
                lastSavedInfoCount = gameState.getInfoCount();
                loadScene(saved.scene);
            } else {
                SaveSystem.clear();
                gameState.reset();
                loadScene('biblioteca');
            }
        });
}

// ═══════════════════════════════════════════════════════════════
// GAME LOOP
// ═══════════════════════════════════════════════════════════════
function gameLoop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    if (gameReady) { update(dt); draw(); }
    requestAnimationFrame(gameLoop);
}

function update(dt) {
    sceneManager.update(dt);
    if (sceneManager.transitioning) return;

    if (endingScreen.active) {
        endingScreen.update(dt);
        handleEndingInput();
        return;
    }

    if (handleControlsInput(dt)) return;

    if (handleJournalInput(dt)) return;

    if (puzzleUI.active) {
        puzzleUI.update(dt);
        return;
    }

    if (handleChoicesInput(dt)) return;

    upWasDown = false;
    downWasDown = false;

    handleReturnShortcut();

    if (!dialogueBox.active) {
        alex.update(dt, input, gameMap, interactables);
        camera.update(dt, alex);
        if (tutorial.active && tutorial.step === 0 && alex.hasMoved) tutorial.setStep(1);
    }

    dialogueBox.update(dt);
    tutorial.update(dt);
    infoPanel.update(dt);
    for (const obj of interactables) if (obj.update) obj.update(dt);

    checkSpawnTemploPortal();
    autosaveOnNewInfo();
    handleInteractionKey();
}

/** Tela final (ESPAÇO): recomeça a jornada do zero. */
function handleEndingInput() {
    const confirm = input.isDown('Space') || input.isDown('KeyE') || input.isDown('Enter');
    if (confirm && !spaceWasDown) {
        audio.playSfx('sfx_confirm');
        endingScreen.hide();
        SaveSystem.clear();
        gameState.reset();
        lastSavedInfoCount = 0;
        loadScene('biblioteca');
    }
    spaceWasDown = confirm;
}

/** Tela de controles (H): toggle. Retorna true se consumiu o frame. */
function handleControlsInput(dt) {
    const hDown = input.isDown('KeyH');
    if (hDown && !hWasDown) {
        if (controlsScreen.active) {
            controlsScreen.close();
        } else if (!dialogueBox.active && !puzzleUI.active && !journal.active) {
            audio.playSfx('sfx_blip');
            controlsScreen.toggle();
        }
    }
    hWasDown = hDown;

    if (!controlsScreen.active) return false;
    controlsScreen.update(dt);
    return true;
}

/** Diário (J): toggle + navegação. Retorna true se consumiu o frame. */
function handleJournalInput(dt) {
    const jDown = input.isDown('KeyJ');
    if (jDown && !jWasDown) {
        if (journal.active) {
            journal.close();
        } else if (!dialogueBox.active && !puzzleUI.active) {
            audio.playSfx('sfx_blip');
            journal.toggle();
        }
    }
    jWasDown = jDown;

    if (!journal.active) return false;

    const up    = input.isDown('ArrowUp')    || input.isDown('KeyW');
    const down  = input.isDown('ArrowDown')  || input.isDown('KeyS');
    const left  = input.isDown('ArrowLeft')  || input.isDown('KeyA');
    const right = input.isDown('ArrowRight') || input.isDown('KeyD');
    if (up && !upWasDown)       journal.navigate(-1);
    if (down && !downWasDown)   journal.navigate(1);
    if (left && !leftWasDown)   { audio.playSfx('sfx_blip'); journal.navigatePage(-1); }
    if (right && !rightWasDown) { audio.playSfx('sfx_blip'); journal.navigatePage(1); }
    upWasDown    = up;
    downWasDown  = down;
    leftWasDown  = left;
    rightWasDown = right;
    journal.update(dt);
    return true;
}

/** Alternativas de diálogo (setas + confirmar). Retorna true se ativo. */
function handleChoicesInput(dt) {
    if (!(dialogueBox.active && dialogueBox.options && dialogueBox.options.length > 0)) return false;

    const up   = input.isDown('ArrowUp')   || input.isDown('KeyW');
    const down = input.isDown('ArrowDown') || input.isDown('KeyS');
    if (up && !upWasDown)        dialogueBox.navigateOptions(-1);
    else if (down && !downWasDown) dialogueBox.navigateOptions(1);
    upWasDown = up;
    downWasDown = down;

    const confirm = input.isDown('Space') || input.isDown('KeyE') || input.isDown('Enter');
    if (confirm && !spaceWasDown) {
        audio.playSfx('sfx_confirm');
        dialogueBox.selectCurrentOption();
    }
    spaceWasDown = confirm;

    dialogueBox.update(dt);
    tutorial.update(dt);
    infoPanel.update(dt);
    return true;
}

/** Tecla T: voltar ao templo (equivalente ao botão). */
function handleReturnShortcut() {
    const tDown = input.isDown('KeyT');
    if (tDown && !tWasDown && canUseReturnButton()) goToTemplo();
    tWasDown = tDown;
}

function autosaveOnNewInfo() {
    const count = gameState.getInfoCount();
    if (count !== lastSavedInfoCount) {
        if (count > lastSavedInfoCount) audio.playSfx('sfx_collect');
        lastSavedInfoCount = count;
        SaveSystem.save(gameState, currentSceneName);
    }
}

function handleInteractionKey() {
    const space = input.isDown('Space') || input.isDown('KeyE');
    if (space && !spaceWasDown) {
        if (dialogueBox.active) {
            audio.playSfx('sfx_blip');
            dialogueBox.advance();
        } else {
            checkInteraction();
        }
    }
    spaceWasDown = space;
}

// ═══════════════════════════════════════════════════════════════
// INTERAÇÃO
// ═══════════════════════════════════════════════════════════════
function rectOverlap(a, b) {
    return a.x < b.x + b.width  && a.x + a.width  > b.x &&
           a.y < b.y + b.height && a.y + a.height > b.y;
}

function checkInteraction() {
    const box = alex.getInteractionBox();
    for (const obj of interactables) {
        const objBox = obj.getDetectionBox ? obj.getDetectionBox() : obj;
        if (rectOverlap(box, objBox) && obj.getDialogue) {
            const { lines, callback } = obj.getDialogue();
            if (lines && lines.length > 0) {
                if (tutorial.active && tutorial.step === 1) tutorial.setStep(2);
                dialogueBox.show(lines, callback || (() => {}));
            }
            break;
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// RENDERIZAÇÃO
// ═══════════════════════════════════════════════════════════════
function draw() {
    ctx.fillStyle = '#120d0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (puzzleUI.active) {
        puzzleUI.draw();
        return;
    }

    // ── Mundo (escala 2x, pixel art) ──
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.scale(WORLD_SCALE, WORLD_SCALE);
    camera.apply(ctx);

    if (gameMap) gameMap.draw(ctx);

    const renderQueue = interactables.filter(o => o.draw);
    if (alex) renderQueue.push(alex);
    renderQueue.sort((a, b) => (a.y + (a.height || 0)) - (b.y + (b.height || 0)));
    for (const entity of renderQueue) entity.draw(ctx);

    if (debugMode && gameMap) drawDebugOverlay();

    camera.restore(ctx);
    ctx.restore();

    // ── UI (alta resolução) ──
    if (dialogueBox)  dialogueBox.draw();
    if (tutorial)     tutorial.draw();
    if (infoPanel)    infoPanel.draw();
    if (returnButton) returnButton.draw();
    if (journal)      journal.draw();
    if (endingScreen) endingScreen.draw();
    if (controlsScreen) controlsScreen.draw();
    drawControlsHint();
    sceneManager.draw();
}

/** Dica discreta e permanente (canto inferior esquerdo) lembrando da tecla de ajuda. */
function drawControlsHint() {
    if (dialogueBox.active || puzzleUI.active || journal.active ||
        endingScreen.active || controlsScreen.active || (tutorial && tutorial.active)) return;

    ctx.fillStyle = 'rgba(245, 240, 232, 0.45)';
    ctx.font = font(TYPE.caption);
    ctx.textAlign = 'left';
    ctx.fillText('H: controles', SPACE.sm, canvas.height - SPACE.sm);
}

function drawDebugOverlay() {
    gameMap.drawCollisionDebug(ctx);
    ctx.strokeStyle = 'rgba(0,255,0,0.9)';
    ctx.lineWidth = 1;
    ctx.strokeRect(alex.x, alex.y, alex.width, alex.height);
    const ib = alex.getInteractionBox();
    ctx.strokeStyle = 'rgba(255,255,0,0.9)';
    ctx.strokeRect(ib.x, ib.y, ib.width, ib.height);
    ctx.strokeStyle = 'rgba(0,255,255,0.5)';
    for (const o of interactables) {
        const b = o.getDetectionBox ? o.getDetectionBox() : o;
        ctx.strokeRect(b.x, b.y, b.width, b.height);
    }
}

// ═══════════════════════════════════════════════════════════════
// PORTAL DINÂMICO DO TEMPLO
// ═══════════════════════════════════════════════════════════════
function checkSpawnTemploPortal() {
    if (!gameMap) return;
    if (!['vila_rica', 'rio_de_janeiro', 'sao_paulo'].includes(gameState.currentPhase)) return;
    if (!gameState.hasAllInfos()) return;
    if (interactables.some(item => item.name === 'Portal Templo')) return;

    console.log('✨ Todos os fatos coletados! Abrindo portal para o Templo.');
    audio.playSfx('sfx_portal');

    const portalObj = gameMap.mapObjects.find(o => o.name === 'volta_templo');
    const px = portalObj ? portalObj.x : gameMap.spawnPoint.x;
    const py = portalObj ? portalObj.y : (gameState.currentPhase === 'vila_rica'
        ? gameMap.spawnPoint.y - 5 : gameMap.spawnPoint.y + 40);

    interactables.push(new Interactable(px, py, {
        name: 'Portal Templo',
        width: portalObj ? portalObj.width : 30,
        height: portalObj ? portalObj.height : 14,
        detectPad: DOOR_DETECT_PAD,
        visible: true, glow: true, isItem: true,
        glowColor: 'rgba(180, 130, 255, 0.6)',
        dialogueLines: [{ speaker: 'Alex', text: '[Voltar ao Templo com as informações]' }],
        onInteractComplete: () => loadScene('templo'),
    }));
}

// ═══════════════════════════════════════════════════════════════
// HOOK DE DEPURAÇÃO / TESTES (não interfere no jogo normal)
// ═══════════════════════════════════════════════════════════════
window.__ecosDebug = {
    loadScene,
    get gameState() { return gameState; },
    get interactables() { return interactables; },
    get journal() { return journal; },
    get dialogueBox() { return dialogueBox; },
    get puzzleUI() { return puzzleUI; },
    get returnButton() { return returnButton; },
    get sceneManager() { return sceneManager; },
    get endingScreen() { return endingScreen; },
    get controlsScreen() { return controlsScreen; },
    get alex() { return alex; },
    get camera() { return camera; },
    get gameMap() { return gameMap; },
    SCENES,
    ACTS,
};

// ═══════════════════════════════════════════════════════════════
init();

})();
