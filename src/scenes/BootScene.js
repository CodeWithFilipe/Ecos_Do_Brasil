export default class BootScene extends Phaser.Scene {
    constructor() { super('Boot'); }

    preload() {
        // ── PLAYER ──────────────────────────────────────────────
        // Spritesheet 5 colunas × 4 linhas (Down, Up, Left, Right)
        // Frames por linha: 0,1,2 = walk | 3 = idle | 4 = extra
        this.load.spritesheet('alex', 'assets/sprites/player/spritesheet.png', {
            frameWidth: 68,
            frameHeight: 68
        });

        // ── PROFESSORA ───────────────────────────────────────────
        this.load.image('prof_down',  'assets/sprites/professora/south.png');
        this.load.image('prof_up',    'assets/sprites/professora/north.png');
        this.load.image('prof_left',  'assets/sprites/professora/west.png');
        this.load.image('prof_right', 'assets/sprites/professora/east.png');

        // ── ZELADOR ──────────────────────────────────────────────
        this.load.image('zelador_down',  'assets/sprites/zelador/south.png');
        this.load.image('zelador_right', 'assets/sprites/zelador/east.png');

        // ── CENÁRIO — BIBLIOTECA ─────────────────────────────────
        this.load.image('piso_madeira',  'assets/textures/piso_madeira.png');
        this.load.image('piso_concreto', 'assets/textures/piso_concreto.png');
        this.load.image('estante',       'assets/sprites/cenario/estante.png');
        this.load.image('mesa_prof',     'assets/sprites/cenario/mesa.png');
        this.load.image('caixa',         'assets/sprites/cenario/caixa.png');
        this.load.image('livro_misterioso', 'assets/sprites/items/livro_misterioso.png');

        // ── CENÁRIO — VILA RICA ──────────────────────────────────
        this.load.image('pedra_colonial', 'assets/textures/pedra_colonial.png');
        this.load.image('parede_colonial','assets/textures/parede_colonial.png');
        this.load.image('item_carta',     'assets/sprites/items/carta.png');
        this.load.image('item_confissao', 'assets/sprites/items/confissao.png');
        this.load.image('item_mapa',      'assets/sprites/items/mapa.png');
        this.load.image('item_fragmento', 'assets/sprites/items/fragmento.png');

        // ── CLIO ─────────────────────────────────────────────────
        this.load.image('clio_portrait', 'assets/sprites/clio/portrait.png');

        // ── UI ───────────────────────────────────────────────────
        this.load.image('ui_nevoa', 'assets/ui/nevoa_overlay.png');

        // ── LOADING BAR ──────────────────────────────────────────
        const bar = this.add.graphics();
        this.load.on('progress', v => {
            bar.clear();
            bar.fillStyle(0x1a0e2e); bar.fillRect(60, 90, 200, 12);
            bar.fillStyle(0xEF9F27); bar.fillRect(62, 92, 196 * v, 8);
            this.add.text(160, 75, 'Carregando...', {
                fontFamily: 'monospace', fontSize: '8px', color: '#F5F0E8'
            }).setOrigin(0.5);
        });
        this.load.on('complete', () => bar.destroy());
    }

    create() {
        // Gera texturas procedurais para assets que não existem em disco
        this._gerarTexturasFallback();
        this.scene.start('Biblioteca');
    }

    _gerarTexturasFallback() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        const gerar = (key, drawFn) => {
            if (!this.textures.exists(key) || this.textures.get(key).key === '__MISSING') {
                g.clear();
                drawFn(g);
                g.generateTexture(key, 16, 16);
            }
        };

        gerar('piso_madeira', g => {
            g.fillStyle(0x3a200a); g.fillRect(0, 0, 16, 16);
            g.fillStyle(0x5a3010); g.fillRect(0, 0, 16, 1);
            g.fillStyle(0x2a1206); g.fillRect(0, 8, 16, 1);
        });

        gerar('piso_concreto', g => {
            g.fillStyle(0x888888); g.fillRect(0, 0, 16, 16);
            g.fillStyle(0x666666); g.fillRect(0, 0, 16, 1); g.fillRect(0, 0, 1, 16);
            g.fillStyle(0x999999); g.fillRect(1, 1, 14, 14);
        });

        gerar('pedra_colonial', g => {
            g.fillStyle(0x8a7a6a); g.fillRect(0, 0, 16, 16);
            g.fillStyle(0x7a6a5a); g.fillRect(0, 0, 7, 7);
            g.fillStyle(0x7a6a5a); g.fillRect(9, 9, 7, 7);
            g.fillStyle(0x6a5a4a); g.fillRect(7, 0, 2, 16);
            g.fillStyle(0x6a5a4a); g.fillRect(0, 7, 16, 2);
        });

        gerar('parede_colonial', g => {
            g.fillStyle(0xd4c8a0); g.fillRect(0, 0, 16, 16);
            g.fillStyle(0xb4a880); g.fillRect(7, 0, 2, 16);
            g.fillStyle(0xb4a880); g.fillRect(0, 7, 16, 2);
        });

        // Gera fallbacks para sprites de NPC se não existirem
        const npcFallback = (key, cor) => {
            if (!this.textures.exists(key) || this.textures.get(key).key === '__MISSING') {
                g.clear();
                g.fillStyle(cor);    g.fillRect(4, 6, 8, 8);   // corpo
                g.fillStyle(0xd4a574); g.fillRect(5, 1, 6, 6);   // cabeça
                g.generateTexture(key, 16, 16);
            }
        };
        npcFallback('prof_down',     0x8844aa);
        npcFallback('prof_up',       0x8844aa);
        npcFallback('prof_left',     0x8844aa);
        npcFallback('prof_right',    0x8844aa);
        npcFallback('zelador_down',  0x888888);
        npcFallback('zelador_right', 0x888888);
        npcFallback('clio_portrait', 0x3C3489);

        const itemFallback = (key, cor, cor2) => {
            if (!this.textures.exists(key) || this.textures.get(key).key === '__MISSING') {
                g.clear();
                g.fillStyle(cor2); g.fillRect(3, 3, 10, 10);
                g.fillStyle(cor);  g.fillRect(4, 4, 8, 8);
                g.generateTexture(key, 16, 16);
            }
        };
        itemFallback('item_carta',       0x2980b9, 0x5aacec);
        itemFallback('item_confissao',   0xc0392b, 0xff6b6b);
        itemFallback('item_mapa',        0x27ae60, 0x55dd88);
        itemFallback('item_fragmento',   0xEF9F27, 0xffdd66);
        itemFallback('livro_misterioso', 0x2a1206, 0x5a3010);
        itemFallback('caixa',            0x8B6914, 0xc09030);

        const cenarioFallback = (key, cor) => {
            if (!this.textures.exists(key) || this.textures.get(key).key === '__MISSING') {
                g.clear();
                g.fillStyle(cor); g.fillRect(0, 0, 16, 16);
                g.generateTexture(key, 16, 16);
            }
        };
        cenarioFallback('estante',    0x5c3d1e);
        cenarioFallback('mesa_prof',  0x7a5230);

        g.destroy();
    }
}