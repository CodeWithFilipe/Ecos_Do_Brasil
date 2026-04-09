# PROMPT MESTRE — Ecos do Brasil: O Guardião da Memória
## Para uso com Claude (Sonnet ou superior) no aperfeiçoamento do jogo

---

## CONTEXTO DO PROJETO

Você está aperfeiçoando um jogo educativo chamado **"Ecos do Brasil: O Guardião da Memória"**, desenvolvido como trabalho de Engenharia de Software no Centro Universitário Católica de Santa Catarina (Joinville, SC) pelos alunos Filipe da Silva Ferreira, Samuel Lucas Corrêa Silveira e Vinícius de Andrade Martins, sob orientação do Prof. Paulo Rogério Pires Manseira.

O jogo já possui:
- Um **GDD (Game Design Document)** completo em `.docx`
- Um **roteiro narrativo completo** em `.docx` (história polida e revisada)
- Um **protótipo funcional** em HTML+JavaScript (Phaser 3), arquivo único `ecos_do_brasil.html`

---

## ESPECIFICAÇÕES TÉCNICAS DO JOGO

### Engine & Stack
- **Phaser 3.60** via CDN (cdnjs.cloudflare.com)
- **Arquivo único HTML** — sem build system, sem npm, roda direto no navegador
- **Pixel art programático** — todos os sprites gerados via `Graphics.fillRect()` (sem assets externos)
- **Resolução lógica:** 320×200 pixels | **Zoom:** 3× → janela final ~960×600
- **Pixel art:** 16×16 tiles, 16×16 sprites de personagem

### Arquitetura de Cenas (Phaser Scenes)
```
BootScene      → Gera todos os assets programaticamente
MenuScene      → Tela de título com estrelas e Clio animada
PrologueScene  → Escola pública → Biblioteca → Estoque → sucção no livro
HubScene       → Templo da Memória (mapa do Brasil estilizado, seleção de fases)
VillaRicaScene → Fase 1 completa (Vila Rica 1789) ~6 min
RioScene       → Fase 2 stub (Rio 1889) — precisa completar
```

### Sistemas Implementados
- `BaseMapScene` — renderização de tilemap, movimento 4 direções (WASD + setas), colisão
- `DialogueManager` — caixa de diálogo com typewriter, portrait, avanço por ESPAÇO
- `PuzzleManager` — interface "Conectar os Fatos" com nós clicáveis e linhas de conexão
- `Inventory` — gerencia itens e fragmentos de memória
- `AssetGen` — gerador centralizado de todos os sprites pixel art

### Constantes importantes
```javascript
const SCALE = 3;          // zoom
const TW = 16;            // tile width
const TH = 16;            // tile height
const GAME_W = 320;
const GAME_H = 200;
```

### Paleta de cores (constante C)
```javascript
C.purple = 0x3C3489   // cor primária UI
C.gold   = 0xEF9F27   // destaques, itens, fragmentos
C.fog    = 0x8888aa   // Névoa do Esquecimento
C.white  = 0xF5F0E8   // texto
```

---

## LORE E NARRATIVA (resumo para manter consistência)

### Conceito Central
Uma força chamada **Névoa do Esquecimento** — nascida da apatia e desinformação — não apaga o passado, mas o **distorce**: inverte motivações, cria anacronismos, esvazia o significado das lutas históricas.

### Protagonista: Alex
- Menino de 13 anos, escola pública, bairro simples, classe baixa
- Interesses: videogame, futebol, estudo (quando obrigado)
- **Silencioso** — comunica-se por ações e anotações no Diário de Bordo
- Habilidade: **Visão do Guardião** — enxerga distorções e itens ocultos pela Névoa
- Origem: encontrou um livro misterioso no **estoque da biblioteca da escola** (não num arquivo histórico municipal)

### Guia: Clio
- Musa da História, guardiã do conhecimento ancestral
- Visual: mulher jovem com olhos de quem viu séculos, roupas que misturam épocas brasileiras, cabelo crespo volumoso, broche dourado
- Comunica via **Diário Histórico** (menu de missões)
- NÃO interfere nos eventos, apenas orienta

### Antagonista: A Névoa do Esquecimento
- Não tem forma física de monstro — é uma **ausência**, feita de páginas em branco
- No Ato V (Grande Arquivo) ela argumenta: "Não inventei nada. Sou sintoma, não causa."
- Se fortalece com apatia do mundo real

### Hub: Templo da Memória
- Espaço etéreo crepuscular (âmbar + índigo)
- Centro: mapa do Brasil estilizado (mesa de luz) com regiões enevoadas
- Cada fase restaurada ilumina uma região do mapa

---

## FASES — STATUS E CONTEÚDO

### ✅ PRÓLOGO (Implementado)
- Escola pública → biblioteca abandonada → estoque com zelador
- Alex interage com 3 pilhas de livros
- Pilha 3: livro sem nome, quente como mão viva
- Sucção: páginas viram sozinhas, Alex não consegue largar, zoom acelera, fadeout roxo

### ✅ HUB (Implementado)
- Mapa do Brasil estilizado
- Nós de missão pulsantes
- Fragmentos visíveis no contador

### ✅ VILA RICA 1789 — Fase 1 (Implementada, ~6 min)
**Distorção:** Tiradentes como monarquista/defensor da Coroa  
**Evidências a coletar (3):**
1. Carta de Gonzaga — prova do republicanismo ardente de Tiradentes
2. Confissão Oculta — depoimento ao tribunal, plano de república inspirado nos EUA
3. Mapa da Conspiração — rede ampla + detalhe da abolição em Minas (apagado pela névoa)

**NPCs (3, com diálogos distorcidos):**
- Comerciante, Padre, Mulher do Povo — todos repetem versão falsa, mas "sentem que algo está errado"

**Puzzle:** Mural de Investigação — conectar as 3 evidências ao nó central "Tiradentes"  
**Resolução:** Névoa recua, estátua ganha nome correto, Fragmento de Memória coletado  
**Fragmento:** Chama vermelha e dourada

### 🔲 RIO DE JANEIRO 1889 — Fase 2 (Stub — precisa completar)
**Distorção (3 focos simultâneos):**
1. Republicanos = festa sem conteúdo político
2. Deodoro = herói popular aclamado pelas massas (era monarquista, proclamou quase por acidente)
3. Dom Pedro II = tirano cruel (na verdade aceitou exílio com resignação serena)

**Enigmas a implementar:**
1. Reordenar 6 eventos da Proclamação (jornalista com páginas embaralhadas)
2. Diálogo com Deodoro — apresentar provas para revelar versão verdadeira
3. Carta de Dom Pedro — névoa a distorce como ódio; Visão revela resignação serena

**NPCs:** Jornalista, Marechal Deodoro, Civil do Campo de Santana  
**Fragmento:** Coroa partida ao meio (dourado + verde)

### 🔲 SÃO PAULO 1888 — Fase 3 (Não implementada)
**Distorção:** Abolição como "presente" da Princesa Isabel — apaga 300 anos de resistência  
**Evidências:**
1. Diário de Esperança (escravizada) — fuga, quilombos, rede de solidariedade
2. Jornais de José do Patrocínio — argumentos abolicionistas sofisticados
3. Mapa de rotas de fuga — infraestrutura clandestina de resistência

**NPC especial:** Luís Gama — filho de africana escravizada, advogado autodidata, libertou centenas  
**Fragmento:** Pena de metal com dois lados: brasão imperial / rosto de mulher africana

### 🔲 RIO 1904 — Fase 4 (Não implementada)
**Distorção:** Revolta da Vacina = ignorância pura (apaga camadas reais)  
**3 Camadas a revelar:**
1. Violência da remoção urbana (Pereira Passos)
2. Desconfiança legítima do Estado (decreto permitia entrada forçada em casas)
3. Políticos militares tentando usar o caos para golpe

**Fragmento:** Pedra do calçamento do Rio, que brilha por dentro

### 🔲 GRANDE ARQUIVO — Fase Final (Não implementada)
**Mecânica:** Mural mestre com todos os 4 fragmentos  
**Conexões obrigatórias:**
- Inconfidência → inspira republicanos de 1889
- Escravidão abolida 1888 → fragiliza Império → acelera República 1889
- República 1889 sem povo → cria desconfiança → Revolta 1904
- Resistência escrava → mesma tradição → ruas de 1904

**A Névoa fala:** "Não inventei nada. Cada distorção que você corrigiu — alguém a criou. Sou sintoma."  
**Resolução:** Sem batalha. Névoa recua como bruma ao sol. Arquivos se abrem.

### ✅ EPÍLOGO
- Alex acorda no estoque da biblioteca
- Zelador para com rodo, pisca, volta ao trabalho sem dizer nada
- Professora aparece na porta: "Que livro é esse?"
- Alex tem a marca de brasa no pulso (4 pontos conectados por fios finos)
- Sabe exatamente o que vai escrever no trabalho de história

---

## TAREFAS PRIORITÁRIAS PARA APERFEIÇOAMENTO

### 🔴 ALTA PRIORIDADE

**1. Completar Fase 2 — Rio de Janeiro 1889**
- Expandir `RioScene` com mapa colonial maior (estilo Paço Imperial + Campo de Santana)
- Implementar os 3 enigmas descritos acima
- NPCs: Jornalista (puzze de reordenação), Deodoro (diálogo com prova), Civil
- Adicionar puzzle de sequência cronológica (arraste eventos na ordem correta)

**2. Implementar animações de sprite do Alex**
- Atualmente usa `setCrop()` na spritesheet mas sem `Phaser.Animations`
- Criar animações com `this.anims.create()` para cada direção (walk_down, walk_up, walk_left, walk_right)
- 3 frames por direção, 8 FPS

**3. Sistema de câmera melhorado**
- Adicionar zoom suave ao entrar em salas menores
- Efeito de transição entre cenas mais elaborado (wipe horizontal estilo 16-bit)

**4. Sistema de save/load**
- Usar `localStorage` para persistir `inventory.fragments` e fases completadas
- Tela de continuar no menu

### 🟡 MÉDIA PRIORIDADE

**5. Implementar Fase 3 — São Paulo 1888**
- Novo mapa: São Paulo com praça central, sobrados coloniais
- NPC Luís Gama com sprite dedicado
- Mechânica de "restaurar silhuetas apagadas" (sprites com alpha baixo que ganham opacidade)

**6. Implementar Fase 4 — Rio 1904**
- Mapa com barricadas (tiles especiais), fumaça via partículas
- Puzzle de "camadas" — revelar 3 camadas da revolta progressivamente
- Efeito visual de "névoa sofisticada" — partículas com movimento orgânico

**7. Tela do Diário em jogo**
- Pressionar TAB abre o Diário de Alex com as anotações coletadas
- Design de páginas de diário com texto manuscrito (fonte mono + estilo)
- Galeria de Fragmentos coletados

**8. Sistema de NPC melhorado**
- NPCs com patrulha simples (vai e volta em rota definida)
- Exclamação "!" sobre NPC quando Alex está próximo e há novidade

### 🟢 BAIXA PRIORIDADE / POLIMENTO

**9. Trilha sonora**
- Usar Web Audio API (sem biblioteca externa) para gerar sons procedurais simples
- Tema do Hub: arpejo de violão em escala menor brasileira (notas sequenciais via OscillatorNode)
- Som de coletar item, avançar diálogo, resolver puzzle

**10. Efeitos de partícula**
- Névoa: partículas cinzas flutuando nas áreas distorcidas
- Fragmento: burst dourado ao coletar
- Usar Phaser.GameObjects.Particles (sistema nativo do Phaser 3)

**11. Mapa do Hub mais elaborado**
- Silhueta do Brasil mais fiel (mais pontos no polígono)
- Regiões iluminadas com cores distintas por fase completada
- Conexão visual (linha dourada) entre fases na ordem da história

**12. Implementar Grande Arquivo e Epílogo**
- Cena especial: mural circular com todos os 4 fragmentos
- Animação da Névoa se dissipando (alpha fade + escala crescente)
- Epílogo jogável: Alex caminha do estoque para a saída da escola

---

## DIRETRIZES DE CÓDIGO

### Padrões a manter
```javascript
// Sempre usar px() para pixel art
function px(g, color, x, y, w=1, h=1) {
  g.fillStyle(color, 1);
  g.fillRect(x, y, w, h);
}

// Sprites via makeTexture
function makeTexture(scene, key, w, h, drawFn) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  drawFn(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

// Herdar de BaseMapScene para qualquer nova fase
class NovaFase extends BaseMapScene {
  constructor() { super('NovaFase'); }
  // isSolid(), movePlayer(), createPlayer() já disponíveis
}
```

### Regras de design
- **NUNCA** usar assets externos (imagens, fontes, áudio como arquivo)
- **SEMPRE** gerar sprites em `AssetGen.createAll()` no `BootScene`
- Fontes: apenas `monospace` (disponível em todos os browsers)
- Cores: sempre da paleta `C` ou próximas a ela
- Resolução lógica: 320×200 — todos os elementos devem caber sem scroll no HUD

### Tilemap
```javascript
// TILE IDs (não alterar os existentes, apenas adicionar)
TILE.EMPTY=0, TILE.FLOOR=1, TILE.WALL=2, TILE.STONE_F=3,
TILE.STONE_W=4, TILE.GRASS=5, TILE.DOOR=6, TILE.SHELF=7,
TILE.DESK=8, TILE.BOX=9, TILE.WATER=10, TILE.COLONIAL=11,
TILE.COBBLE=12
// Para novos tiles: adicionar em TILE e em AssetGen.createTiles()
```

### Padrão de diálogos
```javascript
// Formato de linha de diálogo
{ speaker: 'Nome do Personagem', text: 'Texto do diálogo aqui.' }
// Ou para entrada do diário (sempre em 1ª pessoa de Alex):
{ speaker: 'Diário de Alex', text: 'Texto da anotação...' }
// Para Clio:
{ speaker: 'Clio', text: 'Orientação ou contexto histórico...' }
```

---

## CHECKLIST DE QUALIDADE HISTÓRICA

Ao gerar conteúdo histórico para qualquer fase, verificar:
- [ ] Tiradentes: republicano, não monarquista. Mártir, não traidor.
- [ ] Inconfidência: incluir proposta de abolição em Minas (frequentemente omitida)
- [ ] Proclamação da República: Deodoro era monarquista; povo "assistiu bestializado" (Aristides Lobo)
- [ ] Dom Pedro II: resignação, não raiva. Carta serena. Amava o Brasil.
- [ ] Lei Áurea: conquista de 300 anos de resistência, não presente da princesa
- [ ] Luís Gama: filho de africana escravizada, advogado autodidata, libertou centenas juridicamente
- [ ] José do Patrocínio: jornalista negro abolicionista, imprensa como arma política
- [ ] Revolta da Vacina: desconfiança legítima do Estado + remoção forçada + tentativa de golpe militar
- [ ] NUNCA simplificar: heróis tinham falhas, "vilões" tinham razões, revoluções eram contraditórias

---

## EXEMPLO DE SOLICITAÇÃO PARA CLAUDE

Para continuar o desenvolvimento, use este formato:

```
[CONTEXTO: cole este prompt completo]

TAREFA: [descreva o que quer implementar]

EXEMPLO:
"Complete a RioScene com os 3 enigmas completos, NPCs, puzzle de sequência 
cronológica dos eventos da Proclamação e a coleta do Fragmento."

OU:

"Adicione o sistema de save com localStorage, persistindo fragmentos coletados
e cenas completadas, com botão 'Continuar' no MenuScene."

OU:

"Crie a São Paulo 1888 (SaoPauloScene) completa com o NPC Luís Gama, 
as 3 evidências (diário de Esperança, jornais de Patrocínio, mapa de rotas)
e a mecânica de restaurar silhuetas apagadas."
```

---

## INFORMAÇÕES DO PROJETO

- **Instituição:** Centro Universitário Católica de Santa Catarina
- **Curso:** Engenharia de Software
- **Disciplina:** [a definir]
- **Professor:** Paulo Rogério Pires Manseira
- **Alunos:** Filipe da Silva Ferreira, Samuel Lucas Corrêa Silveira, Vinícius de Andrade Martins
- **Cidade:** Joinville, SC, Brasil
- **Ano:** 2025
- **Público-alvo do jogo:** Ensino Fundamental II (8º e 9º ano, 13-15 anos)
- **Alinhamento:** BNCC — conteúdos de EF08HI e EF09HI
- **Referências de jogo:** Professor Layton, Carmen Sandiego, Valiant Hearts

---

*Prompt Mestre — Ecos do Brasil v1.0 — Gerado automaticamente a partir do GDD e do roteiro narrativo completo*
