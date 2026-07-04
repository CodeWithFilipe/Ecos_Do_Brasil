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
export const VIEW = Object.freeze({ W: 320, H: 240 });

/** Fator de ampliação do mundo para o canvas físico. */
export const WORLD_SCALE = 2;

/** Resolução física do canvas (UI desenha neste espaço). */
export const SCREEN = Object.freeze({ W: VIEW.W * WORLD_SCALE, H: VIEW.H * WORLD_SCALE });

/** Paleta da interface. */
export const COLORS = Object.freeze({
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
export function font(px, opts = {}) {
    const style  = opts.italic ? 'italic ' : '';
    const weight = opts.bold ? 'bold ' : '';
    const family = opts.mono ? MONO : SANS;
    return `${style}${weight}${px}px ${family}`;
}

/** Escala de tipos padronizada (px no espaço SCREEN). */
export const TYPE = Object.freeze({
    caption : 13,
    body    : 16,
    label   : 17,
    title   : 22,
    hero    : 30,
});

/** Espaçamentos padronizados. */
export const SPACE = Object.freeze({ xs: 4, sm: 8, md: 16, lg: 24, xl: 40 });

/**
 * Quebra `text` em linhas que caibam em `maxWidth` com a fonte atual do ctx.
 * Utilidade compartilhada por toda a UI (evita implementações duplicadas).
 * @returns {string[]}
 */
export function wrapLines(ctx, text, maxWidth) {
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
export function drawLines(ctx, lines, x, y, lineHeight) {
    for (const line of lines) {
        ctx.fillText(line, x, y);
        y += lineHeight;
    }
    return y;
}
