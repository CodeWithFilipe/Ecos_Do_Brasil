#!/usr/bin/env python3
"""
Gera a versão 'clique duplo' de Ecos do Brasil:
  - assets/maps/maps_data.js : todos os .tmj embutidos em window.EMBEDDED_MAPS
  - game.js                  : todos os módulos src/ concatenados num único
                               script clássico (sem import/export), em IIFE.
Assim o index.html funciona via file://, sem servidor.
Uso: python3 build_bundle.py <pasta ECOS_DO_BRASIL> [pasta_saida]
"""
import json, re, sys, os

SRC_ORDER = [
    'src/ui/theme.js',
    'src/core/Input.js',
    'src/core/Camera.js',
    'src/world/Collision.js',    # antes de Map/Player (que a importam)
    'src/world/Map.js',          # antes de SceneManager (que a importa)
    'src/core/SceneManager.js',
    'src/core/GameState.js',
    'src/core/SaveSystem.js',
    'src/core/AudioManager.js',
    'src/entities/NPC.js',       # base de Player (colisao) e Arasy (heranca)
    'src/entities/Player.js',
    'src/entities/Arasy.js',
    'src/entities/Interactable.js',
    'src/entities/MagicBook.js',
    'src/entities/PhaseStatue.js',
    'src/entities/SacredSpring.js',
    'src/ui/DialogueBox.js',
    'src/ui/InfoPanel.js',
    'src/ui/JournalUI.js',
    'src/ui/ReturnButton.js',
    'src/ui/PuzzleUI.js',
    'src/ui/TutorialOverlay.js',
    'src/ui/EndingScreen.js',
    'src/ui/ControlsScreen.js',
    'src/main.js',
]

def main():
    root = sys.argv[1]
    out  = sys.argv[2] if len(sys.argv) > 2 else root

    # ── 1. Mapas embutidos ──
    maps_dir = os.path.join(root, 'assets', 'maps')
    embedded = {}
    for f in sorted(os.listdir(maps_dir)):
        if f.endswith('.tmj'):
            with open(os.path.join(maps_dir, f), encoding='utf-8-sig') as fh:
                embedded[f] = json.load(fh)
    os.makedirs(os.path.join(out, 'assets', 'maps'), exist_ok=True)
    with open(os.path.join(out, 'assets', 'maps', 'maps_data.js'), 'w', encoding='utf-8') as fh:
        fh.write('// Gerado por build_bundle.py — mapas Tiled embutidos (permite jogar via file://)\n')
        fh.write('window.EMBEDDED_MAPS = ')
        json.dump(embedded, fh, ensure_ascii=False, separators=(',', ':'))
        fh.write(';\n')
    print(f'maps_data.js: {len(embedded)} mapas embutidos')

    # ── 2. Bundle ──
    parts = []
    for rel in SRC_ORDER:
        path = os.path.join(root, rel)
        with open(path, encoding='utf-8') as fh:
            code = fh.read()
        # remove linhas de import (single-line, como usadas no projeto)
        code = re.sub(r'^import\s+.*?;\s*$', '', code, flags=re.M)
        # remove a palavra-chave export (mantém a declaração)
        code = re.sub(r'^export\s+(class|const|function|let|var)', r'\1', code, flags=re.M)
        parts.append(f'// ═══════ {rel} ═══════\n{code}')
        # sanidade: não pode sobrar import/export
        leftover = re.findall(r'^\s*(import|export)\b', code, flags=re.M)
        if leftover:
            print(f'ERRO: {rel} ainda tem {leftover}'); sys.exit(1)

    bundle = ('// Gerado por build_bundle.py — NÃO EDITAR À MÃO.\n'
              '// Fonte da verdade: pasta src/. Para regenerar: python3 scratch/build_bundle.py .\n'
              '(() => {\n"use strict";\n' + '\n'.join(parts) + '\n})();\n')
    with open(os.path.join(out, 'game.js'), 'w', encoding='utf-8') as fh:
        fh.write(bundle)
    print(f'game.js: {len(bundle)//1024} KB')

if __name__ == '__main__':
    main()
