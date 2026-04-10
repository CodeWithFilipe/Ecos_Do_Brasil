// ─────────────────────────────────────────────────────────────
// systems/Diario.js
//
// Gerencia o estado do Diário de Alex e a UI de abertura.
// Armazena: anotações coletadas, fragmentos, itens.
//
// Uso:
//   import Diario from '../../systems/Diario.js';
//
//   // Em qualquer cena (criar uma vez no Hub ou Boot e passar via registry):
//   this.diario = new Diario(this);
//
//   // Adicionar entrada:
//   this.diario.addAnotacao('Vila Rica', 'A carta prova que Tiradentes era republicano.');
//   this.diario.addFragmento('chama_vilarica', 'Vila Rica 1789');
//
//   // Abrir/fechar UI:
//   this.diario.toggle();
// ─────────────────────────────────────────────────────────────

export default class Diario {
    constructor(scene) {
        this.scene = scene;

        // Estado persistente
        this.anotacoes  = [];   // [{ titulo, texto, fase }]
        this.fragmentos = [];   // [{ key, nome }]
        this.itens      = [];   // [{ id, nome }]

        this.aberto = false;
        this._ui    = null;

        // Escuta TAB na cena atual
        scene.input.keyboard.on('keydown-TAB', (e) => {
            e.preventDefault();  // evita perda de foco no browser
            this.toggle();
        });
    }

    // ── API pública ─────────────────────────────────────────────

    addAnotacao(titulo, texto, fase = '') {
        this.anotacoes.push({ titulo, texto, fase, ts: Date.now() });
    }

    addFragmento(key, nome) {
        if (this.fragmentos.find(f => f.key === key)) return; // não duplica
        this.fragmentos.push({ key, nome });
    }

    addItem(id, nome) {
        if (this.itens.find(i => i.id === id)) return;
        this.itens.push({ id, nome });
    }

    temItem(id) { return this.itens.some(i => i.id === id); }

    get totalFragmentos() { return this.fragmentos.length; }

    toggle() {
        if (this.aberto) this.fechar();
        else             this.abrir();
    }

    // ── UI ──────────────────────────────────────────────────────

    abrir() {
        if (this.aberto) return;
        this.aberto = true;
        this._construirUI();
    }

    fechar() {
        if (!this.aberto) return;
        this.aberto = false;
        if (this._ui) { this._ui.destroy(); this._ui = null; }
    }

    _construirUI() {
        const s  = this.scene;
        const W  = s.cameras.main.width;   // espaço lógico
        const H  = s.cameras.main.height;

        this._ui = s.add.container(0, 0).setDepth(500).setScrollFactor(0);

        // Fundo semitransparente
        const dim = s.add.rectangle(W/2, H/2, W, H, 0x000000, 0.8).setScrollFactor(0);

        // Painel principal
        const px = 8, py = 8, pw = W - 16, ph = H - 16;
        const painel = s.add.graphics().setScrollFactor(0);
        painel.fillStyle(0x0d0820, 0.98);
        painel.fillRect(px, py, pw, ph);
        painel.lineStyle(1, 0xEF9F27, 1);
        painel.strokeRect(px, py, pw, ph);
        painel.lineStyle(1, 0x3C3489, 0.5);
        painel.strokeRect(px+1, py+1, pw-2, ph-2);

        // Título
        const titulo = s.add.text(W/2, py+6, '📖  DIÁRIO DE ALEX', {
            fontFamily: 'monospace', fontSize: '8px', color: '#EF9F27'
        }).setOrigin(0.5, 0).setScrollFactor(0);

        // Separador
        const sep = s.add.graphics().setScrollFactor(0);
        sep.lineStyle(1, 0x3C3489, 0.8);
        sep.lineBetween(px+4, py+18, px+pw-4, py+18);

        // Fragmentos
        const fragTit = s.add.text(px+6, py+22, `✦ FRAGMENTOS: ${this.fragmentos.length}/4`, {
            fontFamily: 'monospace', fontSize: '6px', color: '#EF9F27'
        }).setScrollFactor(0);

        this.fragmentos.forEach((f, i) => {
            s.add.text(px+10, py+32 + i*10, `• ${f.nome}`, {
                fontFamily: 'monospace', fontSize: '6px', color: '#7F77DD'
            }).setScrollFactor(0);
        });

        // Separador 2
        const fragBottom = py + 32 + Math.max(1, this.fragmentos.length) * 10 + 4;
        const sep2 = s.add.graphics().setScrollFactor(0);
        sep2.lineStyle(1, 0x3C3489, 0.5);
        sep2.lineBetween(px+4, fragBottom, px+pw-4, fragBottom);

        // Anotações (últimas 5)
        const anotTit = s.add.text(px+6, fragBottom+4, '📝 ANOTAÇÕES:', {
            fontFamily: 'monospace', fontSize: '6px', color: '#88aaff'
        }).setScrollFactor(0);

        const ultimas = this.anotacoes.slice(-5).reverse();
        ultimas.forEach((a, i) => {
            const yy = fragBottom + 16 + i * 22;
            s.add.text(px+8, yy, a.titulo, {
                fontFamily: 'monospace', fontSize: '5px', color: '#EF9F27'
            }).setScrollFactor(0);
            s.add.text(px+8, yy+8, a.texto, {
                fontFamily: 'monospace', fontSize: '5px', color: '#aaccff',
                wordWrap: { width: pw - 20 }
            }).setScrollFactor(0);
        });

        if (this.anotacoes.length === 0) {
            s.add.text(px+8, fragBottom+16, 'Nenhuma anotação ainda.', {
                fontFamily: 'monospace', fontSize: '5px', color: '#534AB7'
            }).setScrollFactor(0);
        }

        // Dica fechar
        const hint = s.add.text(W/2, py+ph-8, '[TAB] Fechar diário', {
            fontFamily: 'monospace', fontSize: '5px', color: '#534AB7'
        }).setOrigin(0.5, 1).setScrollFactor(0);

        this._ui.add([dim, painel, titulo, sep, fragTit, sep2, anotTit, hint]);
    }
}