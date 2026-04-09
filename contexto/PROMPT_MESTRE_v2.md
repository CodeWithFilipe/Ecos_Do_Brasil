# PROMPT MESTRE v2.0 — Ecos do Brasil: O Guardião da Memória
## Para uso com Claude Sonnet (ou superior)

---

## CONTEXTO DO PROJETO

Jogo educativo **"Ecos do Brasil: O Guardião da Memória"** desenvolvido como trabalho de Engenharia de Software no Centro Universitário Católica de Santa Catarina (Joinville, SC) pelos alunos **Filipe da Silva Ferreira, Samuel Lucas Corrêa Silveira e Vinícius de Andrade Martins**, sob orientação do Prof. Paulo Rogério Pires Manseira.

**Público-alvo:** Ensino Fundamental II — 8º e 9º ano  
**Alinhamento BNCC:** EF08HI, EF09HI  
**Referências de jogo:** Professor Layton, Carmen Sandiego, Valiant Hearts

---

## ESTADO ATUAL DO PROJETO

### Arquivo entregue
`ecos_do_brasil.html` — jogo completo, arquivo único HTML+JS, sem build system, roda direto no navegador.

### Cenas implementadas (10 cenas Phaser 3)

| Cena              | Classe            | Status | Conteúdo                                     |
|-------------------|-------------------|--------|----------------------------------------------|
| Boot              | `BootScene`       | ✅ OK  | Gera todos os assets via `AssetGen`           |
| Menu              | `MenuScene`       | ✅ OK  | Estrelas, Clio animada, névoa pulsante, save  |
| Prólogo           | `PrologueScene`   | ✅ OK  | Escola → Estoque → Livro → Sucção             |
| Hub               | `HubScene`        | ✅ OK  | Templo da Memória, mapa do Brasil, portais    |
| Vila Rica 1789    | `VillaRicaScene`  | ✅ OK  | Ato I completo, 3 provas, puzzle, fragmento   |
| Rio de Janeiro 1889 | `Rio1889Scene`  | ✅ OK  | Ato II completo, 3 enigmas, fragmento         |
| São Paulo 1888    | `SaoPauloScene`   | ✅ OK  | Ato III completo, Luís Gama, silhuetas        |
| Rio de Janeiro 1904 | `Rio1904Scene`  | ✅ OK  | Ato IV completo, 3 camadas, barricadas        |
| Grande Arquivo    | `GrandeArquivoScene` | ✅ OK | Ato V, A Névoa fala, enigma mestre          |
| Epílogo           | `EpilogueScene`   | ✅ OK  | Estoque, zelador, professora, créditos        |

### Sistemas implementados

| Sistema           | Classe/Função        | Localização          |
|-------------------|----------------------|----------------------|
| Geração de assets | `AssetGen`           | Inline no HTML        |
| Tilemaps          | `BaseMapScene`       | Classe base           |
| Movimento         | `BaseMapScene.movePlayer()` | 4 direções, WASD+Setas |
| Colisão           | `BaseMapScene.isSolid()` | Por array de tiles  |
| Diálogo           | `DialogueManager`    | Typewriter, portrait  |
| Puzzle            | `PuzzleManager`      | Conectar os Fatos     |
| Inventário        | `Inventory`          | localStorage save     |
| Diário do Alex    | `BaseMapScene.showDiary()` | TAB abre painel |
| Visão do Guardião | `BaseMapScene.toggleGuardian()` | Tecla V   |
| NPCs              | `BaseMapScene.spawnNPC()` | Sprite + exclamação |
| Câmera            | Phaser built-in      | Follow + zoom SCALE=3 |
| HUD               | `BaseMapScene.showHUD()` | Fragmentos + dicas |

---

## ESPECIFICAÇÕES TÉCNICAS

### Engine & Stack
- **Phaser 3.60** via CDN `cdnjs.cloudflare.com`
- **Arquivo único HTML** — sem npm, sem build, abre direto no browser
- **Pixel art programático** — todos os sprites via `Graphics.fillRect()` (sem assets externos)
- **Resolução lógica:** 320×200 | **Zoom:** 3× via `Phaser.Scale.FIT` → janela ~960×600

### Constantes globais (não alterar)
```javascript
const SCALE = 3;     // zoom da câmera
const GW    = 320;   // game width
const GH    = 200;   // game height
const TW    = 16;    // tile width
const TH    = 16;    // tile height
```

### Paleta de cores (objeto `C`)
```javascript
C.purple   = 0x3C3489   // UI primária
C.purpleL  = 0x7766cc   // UI clara
C.purpleD  = 0x1a0e2e   // fundo escuro
C.gold     = 0xEF9F27   // destaques, itens
C.goldL    = 0xffd700   // gold claro
C.fog      = 0x8888aa   // névoa
C.fogD     = 0x4422aa   // névoa densa
C.white    = 0xF5F0E8   // texto principal
C.gray     = 0x888880   // texto secundário
C.amber    = 0xcc7722   // Vila Rica
C.teal     = 0x226644   // Verde aceite
C.red      = 0xaa2233   // perigo, Rio 1904
C.blue     = 0x224488   // São Paulo
C.green    = 0x226622   // Rio 1889
C.brown    = 0x5c3a1e   // madeira
C.stone    = 0x887766   // pedra
```

### IDs de Tiles (objeto `T`)
```javascript
T.EMPTY=0, T.FLOOR=1, T.WALL=2, T.STONE_F=3, T.STONE_W=4,
T.GRASS=5, T.DOOR=6, T.SHELF=7, T.DESK=8, T.BOX=9,
T.WATER=10, T.COLONIAL=11, T.COBBLE=12, T.PILLAR=13, T.ALTAR=14
// Adicionar novos tiles: incluir em T e em AssetGen.createTiles()
```

### Chaves de textura geradas pelo `AssetGen`
```
Tiles:    tile_floor, tile_wall, tile_stone_f, tile_cobble, tile_grass,
          tile_door, tile_shelf, tile_desk, tile_pillar, tile_altar, tile_box, tile_colonial
Sprites:  alex (spritesheet 64×240, 4×10 frames 16×24),
          clio (spritesheet 64×96, 4×4 frames 16×24)
NPCs:     npc_comerciante, npc_padre, npc_mulher, npc_jornalista,
          npc_deodoro, npc_civil, npc_luisgama, npc_esperanca,
          npc_zelador, npc_professora
UI:       dialogue_box (300×56), hud_bar (320×16),
          puzzle_node, puzzle_node_active, puzzle_node_connected
Itens:    item_carta, item_confissao, item_mapa, item_ordem,
          item_carta_dp, item_diario_e, item_jornais, item_rota,
          item_decreto, item_militares, item_remocao
Fragmentos: frag_1, frag_2, frag_3, frag_4
Efeitos:  star, fog_particle, guardian_glow, portal, exclamacao
```

### Animações do Alex (spritesheet `alex`)
```
Row 0 (frames 0–3):  walk_down  + idle_down
Row 1 (frames 4–7):  walk_left  + idle_left
Row 2 (frames 8–11): walk_right + idle_right
Row 3 (frames 12–15):walk_up    + idle_up
```
Criadas em `BaseMapScene._setupAnims()` com `frameRate: 8`.

---

## ARQUITETURA DE CLASSES

### `AssetGen` (estático)
- `AssetGen.createAll(scene)` — ponto de entrada, chama todos os sub-métodos
- `AssetGen.px(g, color, x, y, w, h)` — helper de pixel art
- `AssetGen.makeTexture(scene, key, w, h, fn)` — cria textura via Graphics

### `DialogueManager`
```javascript
const dm = new DialogueManager(scene);
dm.show([
  { speaker: 'Clio', text: 'Texto aqui.' },
  { speaker: 'Diário de Alex', text: 'Nota do Alex — estilo azul.' },
], callbackOnEnd);
```
- Typewriter 22ms/char, avança com ESPAÇO/ENTER/clique
- `scene.events` emite `'dialogue_open'` e `'dialogue_close'` (bloqueia movimento)

### `PuzzleManager`
```javascript
puzzle.show({
  title: 'Nome do Puzzle',
  nodes: [
    { x: 160, y: 60,  label: 'Nó Central', isCenter: true },
    { x: 50,  y: 120, label: 'Evidência A' },
    { x: 260, y: 120, label: 'Evidência B' },
  ],
  correctConnections: [[1,0],[2,0]], // índices dos nós que devem ser conectados
}, callbackOnSolve);
```

### `Inventory`
```javascript
window._inventory.addItem(id, name, desc)  → boolean
window._inventory.hasItem(id)              → boolean
window._inventory.addFragment(id)          → boolean
window._inventory.hasFragment(id)          → boolean
window._inventory.completePhase(id)
window._inventory.phaseComplete(id)        → boolean
window._inventory.save()   // localStorage
window._inventory.load()   // localStorage
```

### `BaseMapScene` — como criar uma nova fase
```javascript
class MinhaFase extends BaseMapScene {
  constructor() { super('MinhaFase'); }
  create() {
    const map = [ [4,4,4],[4,3,4],[4,4,4] ]; // matriz de tiles
    const keys = { [T.STONE_F]:'tile_stone_f', [T.STONE_W]:'tile_wall' };
    this.initBase(map, keys);
    this.solidTiles = [T.STONE_W]; // tiles que bloqueiam o Alex
    this.hudLabel   = 'Nome da Fase';
    // Renderizar mapa manualmente (ver padrão das fases existentes)
    map.forEach((row,ry) => row.forEach((t,rx) => {
      const key = { ... }[t]; if(key) this.add.image(rx*TW+8, ry*TH+8, key).setDepth(1);
    }));
    this.createPlayer(startX, startY);  // cria this.alex, câmera, animações
    this.showHUD(window._inventory);    // HUD com fragmentos
    // Spawn NPCs
    this._npcs = [ this.spawnNPC(x, y, 'npc_key', [], ()=>callback) ];
    // Objetos ocultos (ficam em this.fogObjects, toggle por guardianMode)
    this._items = [{ sprite:..., id:'...', name:'...', desc:'...' }];
    this._items.forEach(item => { this.fogObjects.push(item.sprite); });
  }
  update(time, delta) {
    this.movePlayer(delta);
    const near = this.checkNPCProximity(this._npcs);
    if(Phaser.Input.Keyboard.JustDown(this.spaceKey) && !this.dialogue.active)
      if(near) near.onInteract?.();
    if(Phaser.Input.Keyboard.JustDown(this.vKey)) this.toggleGuardian();
    if(Phaser.Input.Keyboard.JustDown(this.tabKey)) this.showDiary(window._diary);
  }
}
// Registrar em config.scene: [..., MinhaFase]
```

---

## FLUXO NARRATIVO COMPLETO

```
Menu → Prólogo (Escola/Estoque/Sucção) → Hub (Templo da Memória)
    ↓
    ├── Vila Rica 1789 (Fase 1)    → frag_1 (chama vermelha+dourada)
    ├── Rio Janeiro 1889 (Fase 2)  → frag_2 (coroa partida)
    ├── São Paulo 1888 (Fase 3)    → frag_3 (pena de metal)
    └── Rio Janeiro 1904 (Fase 4)  → frag_4 (pedra calçamento)
    ↓ (com 4 fragmentos)
    Grande Arquivo → A Névoa Fala → Enigma Mestre → Epílogo
```

### Distorções da Névoa por fase
| Fase | Distorção | Verdade restaurada |
|------|-----------|-------------------|
| Vila Rica 1789 | Tiradentes = monarquista | Republicano, mártir, aboliconista |
| Rio 1889 | República = festa popular | Golpe militar, Deodoro era monarquista, Pedro II resignado |
| São Paulo 1888 | Lei Áurea = presente da princesa | 300 anos de resistência, quilombos, abolicionistas negros |
| Rio 1904 | Revolta = ignorância | Remoções forçadas + desconfiança legítima + tentativa de golpe |

---

## CONTROLES DO JOGO

| Tecla | Ação |
|-------|------|
| WASD / Setas | Mover o Alex |
| ESPAÇO | Interagir com NPC / avançar diálogo / confirmar puzzle |
| V | Ativar/desativar Visão do Guardião |
| TAB | Abrir/fechar Diário de Bordo de Alex |
| ENTER | Avançar diálogo |

---

## CHECKLIST DE QUALIDADE HISTÓRICA (BNCC)

- [x] Tiradentes: republicano, não monarquista. Mártir, não traidor.
- [x] Inconfidência: inclui proposta de abolição em Minas (frequentemente omitida)
- [x] Proclamação da República: Deodoro era monarquista; povo "assistiu bestializado"
- [x] Dom Pedro II: resignação, não raiva. Carta serena. Amava o Brasil.
- [x] Lei Áurea: conquista de 300 anos de resistência, não presente da princesa
- [x] Luís Gama: filho de africana escravizada, advogado autodidata, libertou centenas
- [x] José do Patrocínio: jornalista negro abolicionista, imprensa como arma
- [x] Revolta da Vacina: 3 camadas (remoção + desconfiança + golpe), não só ignorância
- [x] Complexidade sem relativismo: heróis tinham falhas, "vilões" tinham razões

---

## TAREFAS PRIORITÁRIAS PARA CONTINUAÇÃO

### 🔴 Alta Prioridade

**1. Sprite do Alex com animação real de spritesheet**
```
Estrutura atual: 4 linhas × 4 frames (walk×3 + idle×1), 64×96px total
Implementar: substituir AssetGen.createPlayer() por carregamento de PNG real
this.load.spritesheet('alex', 'assets/sprites/alex.png', { frameWidth:16, frameHeight:24 })
```

**2. Câmera com transição wipe 16-bit entre cenas**
```javascript
// Na BaseMapScene, adicionar:
_wipeTransition(targetScene) {
  const wipe = this.add.rectangle(-GW, 0, GW, GH, C.purpleD).setOrigin(0).setScrollFactor(0).setDepth(90);
  this.tweens.add({ targets:wipe, x:0, duration:300, ease:'Power2', onComplete:()=>{
    this.tweens.add({ targets:wipe, x:GW, duration:300, ease:'Power2', delay:100,
      onComplete:()=>this.scene.start(targetScene)
    });
  }});
}
```

**3. Som procedural com Web Audio API**
```javascript
// Adicionar em BootScene.create():
const ctx = new AudioContext();
// Tema Hub: arpejo de violão em Lá menor
function playArpejo() { ... }
// Som de coleta: burst curto
// Som de diálogo: clique baixo
```

### 🟡 Média Prioridade

**4. Patrulha de NPCs**
```javascript
// Adicionar em BaseMapScene.spawnNPC():
npc.route = [{x:100,y:80},{x:160,y:80}]; // pontos de patrulha
npc.routeIdx = 0; npc.patrolSpeed = 20;
// Em update(): mover NPC ao longo da rota
```

**5. Mapa do Hub mais detalhado**
- Silhueta do Brasil com mais pontos no polígono
- Linhas douradas conectando fases na ordem cronológica
- Regiões brilhando com cores distintas por fase

**6. Tela de inventário no Hub**
- Pressionar I abre galeria de fragmentos + itens coletados
- Exibir o texto completo de cada item coletado

### 🟢 Baixa Prioridade / Polimento

**7. Partículas de névoa**
```javascript
// Usar Phaser.GameObjects.Particles nas áreas de névoa
const emitter = scene.add.particles(0, 0, 'fog_particle', {
  x: { min:0, max:GW }, y: { min:0, max:GH },
  speed: { min:5, max:15 }, alpha: { start:0.3, end:0 },
  lifespan: 3000, quantity: 1, frequency: 200
});
```

**8. Sistema de achievements**
- "Primeiro Guardião" — completa o prólogo
- "Memória de Minas" — completa Vila Rica
- "Mestre do Arquivo" — completa todas as fases

---

## FORMATO DE SOLICITAÇÃO PARA CLAUDE

```
[Cole este Prompt Mestre completo]

TAREFA: [descrição específica]

EXEMPLOS:
"Adicione animação de sprite PNG real para o Alex,
substituindo o AssetGen.createPlayer() pelo carregamento
de assets/sprites/alex.png com frameWidth:16, frameHeight:24."

"Implemente patrulha simples para os NPCs com dois pontos
de rota definidos no spawnNPC() e processados no update()."

"Adicione trilha sonora procedural com Web Audio API:
tema do Hub (arpejo em Lá menor), som de coleta de item,
som de avanço de diálogo."

"Crie uma nova fase: Salvador, 1798 (Conjuração Baiana),
com os mesmos padrões das fases existentes."
```

---

## INFORMAÇÕES INSTITUCIONAIS

- **Instituição:** Centro Universitário Católica de Santa Catarina
- **Curso:** Engenharia de Software
- **Professor orientador:** Paulo Rogério Pires Manseira
- **Alunos:** Filipe da Silva Ferreira · Samuel Lucas Corrêa Silveira · Vinícius de Andrade Martins
- **Cidade:** Joinville, SC, Brasil
- **Ano:** 2025
- **Versão do jogo:** 2.0 (arquivo único, campanha completa)
- **Versão deste prompt:** 2.0

---

*Prompt Mestre v2.0 — Gerado após implementação da campanha completa*  
*Ecos do Brasil: O Guardião da Memória — Dezembro 2025*
