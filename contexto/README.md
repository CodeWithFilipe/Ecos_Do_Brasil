# Ecos_Do_Brasil_JS# Ecos do Brasil: Guardião da Memória
**Jogo educativo — Phaser 3 + ES6 Modules**

---

## Estrutura modular gerada

```
ecos-do-brasil/
├── main.js                          ← ponto de entrada
├── assets/
│   └── sprites/
│       ├── alex.png                 ← spritesheet 16×24 (8 linhas × 4 frames)
│       ├── clio.png                 ← mesma estrutura
│       └── npcs.png
├── src/
│   ├── core/
│   │   ├── Inventory.js             ✅ gerado
│   │   ├── SaveSystem.js            ← próximo passo
│   │   └── AssetGen.js              ← geração programática de sprites
│   ├── entities/
│   │   ├── Player.js                ✅ gerado  (Alex)
│   │   └── NPC.js                   ✅ gerado  (Clio e outros)
│   ├── scenes/
│   │   ├── BootScene.js             ← carrega assets via AssetGen
│   │   ├── menu/
│   │   │   └── MenuScene.js         ← névoa pulsante
│   │   └── fases/
│   │       └── biblioteca/
│   │           └── BibliotecaScene.js ✅ gerado (tutorial completo)
│   └── ui/
│       ├── DialogueManager.js       ✅ gerado
│       └── DiarySystem.js           ✅ gerado
```

---

## Setup rápido (Vite)

```bash
npm create vite@latest ecos-do-brasil -- --template vanilla
cd ecos-do-brasil
npm install phaser
# Copie os arquivos gerados para src/
npm run dev
```

---

## Resumo das classes geradas

### `Player.js`
- Estende `Phaser.Physics.Arcade.Sprite`
- Input: WASD + Setas + Espaço (interagir) + V (Visão do Guardião)
- Hitbox 12×10 na base do sprite (movimento top-down realista)
- `_checkProximity()` — detecta `this.scene.interactables` (staticGroup) num raio de 32px
- `lockMovement()` / `unlockMovement()` — trava durante diálogos/cutscenes
- `addDiaryEntry(key, text, category)` — delega ao DiarySystem
- Animações: 8 variantes de walk + idle + interact + guardian (rows na spritesheet)

### `Inventory.js`
- Pure JS (sem dependência Phaser) — pode ser passado entre cenas
- `addItem(data)` / `hasItem(id)` / `getItems(filter)`
- Computa `this.nitidez` automaticamente ao coletar evidências
- `serialize()` / `deserialize()` — integração com SaveSystem
- `onChange(fn)` — observer pattern para atualizar HUD

### `NPC.js`
- Estende `Phaser.Physics.Arcade.Sprite`
- `walkTo(x, y, callback)` — movimento via tween (60px/s)
- Balão `!` visível ao aproximar o player (`player_near` / `player_leave` events)
- Mesma estrutura de spritesheet do Player

### `DialogueManager.js`
- Caixa pixel-art fixada à câmera (HUD), 48px de altura
- Typewriter effect (28ms/char), avança com Espaço/Enter/clique
- `show(lines, speaker, key)` → emite `'dialogue_end'` ao terminar
- Suporte a `isNote: true` (entradas do diário com estilo azulado)

### `DiarySystem.js`
- Tecla D abre/fecha o painel do diário
- Categorias: `'pista'` | `'reflexao'` | `'missao'`
- Ícone de notificação flutuante ao adicionar entrada
- `serialize()` / `deserialize()` para SaveSystem

### `BibliotecaScene.js`
- Fluxo completo do tutorial em 5 passos: `move → interact → vision → nevoa → done`
- Clio entra em cena com `walkTo()` e inicia diálogo automático
- Estante com brilho pulsante (item chave: Diário dos Ecos)
- Retrato distorcido do Tiradentes — visível só com Visão do Guardião
- Névoa invasiva com tween de alpha ao ativar o poder
- Transição fade-out para `HubScene` ao concluir

---

## Spritesheet esperada — Alex (`alex.png`)

```
Linha 0 (frames  0– 3): walk down
Linha 1 (frames  4– 7): walk left
Linha 2 (frames  8–11): walk right
Linha 3 (frames 12–15): walk up
Linha 4 (frames 16–17): idle (2 frames)
Linha 5 (frames 20–23): interact / anotar no diário
Linha 6 (frames 24–27): Visão do Guardião (power-up)
```

Cada frame: **16×24 px**. Arquivo total: **64×192 px** (4 colunas × 7 linhas).

---

## Próximos passos recomendados

1. **`BootScene.js`** — carrega assets via `AssetGen.js` (sprites programáticos para dev)
2. **`SaveSystem.js`** — persiste `Inventory.serialize()` + `DiarySystem.serialize()` em `localStorage`
3. **`HubScene.js`** — Templo da Memória com o mapa do Brasil e portais para as fases
4. **`PuzzleScene.js`** — puzzle de conexão de ideias para restaurar Nitidez
5. **`AssetGen.js`** — geração de sprites placeholder (útil sem assets definitivos)