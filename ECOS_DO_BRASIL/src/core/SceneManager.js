import { Map } from '../world/Map.js';

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
export class SceneManager {
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
