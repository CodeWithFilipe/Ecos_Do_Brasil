import { Interactable } from './Interactable.js';

/**
 * PhaseStatue — estátua comemorativa de um ato no Templo de Arasy.
 *
 * Estado visual derivado do GameState (nunca duplicado localmente):
 *  - Ato pendente  → estátua quebrada (busto rachado, entulho na base)
 *  - Ato concluído → estátua restaurada, com brilho dourado
 *
 * O exame (tecla E) explica o que a estátua representa.
 */
export class PhaseStatue extends Interactable {

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
