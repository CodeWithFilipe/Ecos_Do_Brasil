/**
 * main.js — Ecos do Brasil: Guardião da Memória
 * Ponto de entrada. Configura o Phaser 3 e registra todas as cenas.
 *
 * Para rodar localmente:
 *   npx serve .   (ou qualquer servidor estático)
 *   Acesse http://localhost:3000
 *
 * Bundler recomendado: Vite
 *   npm create vite@latest ecos-do-brasil -- --template vanilla
 */

import Phaser from 'phaser';

// ── Cenas ────────────────────────────────────────────────────────────────────
import { BootScene }       from './src/scenes/BootScene.js';
import { MenuScene }       from './src/scenes/menu/MenuScene.js';
import { BibliotecaScene } from './src/scenes/fases/biblioteca/BibliotecaScene.js';
// import { HubScene }        from './src/scenes/HubScene.js';          // próximo passo
// import { VilaRicaScene }   from './src/scenes/fases/vila_rica/VilaRicaScene.js';

// ─── Configuração ─────────────────────────────────────────────────────────
const config = {
  type:   Phaser.AUTO,
  width:  320,
  height: 200,

  // Escala automática — mantém proporção pixel-art
  scale: {
    mode:             Phaser.Scale.FIT,
    autoCenter:       Phaser.Scale.CENTER_BOTH,
    parent:           'game-container',
  },

  // Renderização pixel-art (sem antialiasing)
  render: {
    antialias:        false,
    pixelArt:         true,
    roundPixels:      true,
  },

  backgroundColor: '#0d0820',

  physics: {
    default: 'arcade',
    arcade:  {
      gravity: { y: 0 },  // jogo top-down, sem gravidade
      debug:   false,      // mude para true durante o desenvolvimento
    },
  },

  // Registro de cenas em ordem de boot
  scene: [
    BootScene,
    MenuScene,
    BibliotecaScene,
    // HubScene,
    // VilaRicaScene,
  ],
};

// ─── Inicializa o jogo ────────────────────────────────────────────────────
const game = new Phaser.Game(config);

// Expõe globalmente para debug no console do browser
if (import.meta.env?.DEV) {
  window.__ECOS_GAME__ = game;
}

export default game;