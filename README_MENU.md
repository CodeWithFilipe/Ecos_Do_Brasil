# 🎮 Ecos do Brasil — Menu Principal e Sistema de Áudio

## ✅ Funcionalidades Implementadas

### 1. Menu Principal Completo (`MenuPrincipal.js`)
O menu principal do jogo foi totalmente implementado com:

- **Visual Temático Brasileiro**
  - Fundo estrelado animado (twinkling)
  - Névoa pulsante em camadas (tema da "Névoa do Esquecimento")
  - Título "ECOS DO BRASIL" com efeito dourado
  - Subtítulo "O Guardião da Memória"
  - Clio (Guardiã da Memória) com animação de flutuação e aura

- **Opções do Menu**
  - ▶ **Nova Jornada** — Inicia novo jogo (reseta save)
  - ▷ **Continuar** — Aparece apenas se houver save, mostra fragmentos coletados
  - 📖 **História** — Apresenta o contexto narrativo do jogo
  - ⚙ **Configurações** — Ajustes de volume e opções
  - ★ **Créditos** — Equipe de desenvolvimento e agradecimentos

- **Recursos Visuais**
  - Botões interativos com hover effect
  - Animação de pulso suave nos botões
  - Fade in/out nas transições
  - Rodapé institucional (Centro Universitário Católica de SC · 2025)

---

### 2. Tela de História (`Historia.js`)
Apresenta a narrativa do jogo:

- Contexto do ano 2025 com Alex
- A Névoa do Esquecimento apagando memórias
- Jornada pelas 4 épocas históricas:
  - Vila Rica, 1789 — Inconfidência
  - Rio de Janeiro, 1889 — República
  - São Paulo, 1888 — Abolição
  - Rio de Janeiro, 1904 — Revolta da Vacina
- Botão para voltar ao menu

---

### 3. Tela de Configurações (`Configuracoes.js`)
Permite ajustar as preferências do jogador:

- **🎵 Volume da Música** — Slider ajustável (0-100%)
- **🔊 Volume dos Efeitos** — Slider ajustável (0-100%)
- **💬 Velocidade do Texto** — Lento / Normal / Rápido
- **⚠ Resetar Progresso** — Limpa save game
- Configurações salvas no localStorage

---

### 4. Tela de Créditos (`Creditos.js`)
Reconhece a equipe e referências:

- **Desenvolvedores:**
  - Filipe da Silva Ferreira
  - Samuel Lucas Corrêa Silveira
  - Vinícius de Andrade Martins

- **Orientador:** Prof. Paulo Rogério Pires Manseira

- **Instituição:** Centro Universitário Católica de SC

- **Referências de Jogo:**
  - Professor Layton
  - Carmen Sandiego
  - Valiant Hearts

- Agradecimentos especiais

---

### 5. Gerenciador de Áudio Brasileiro (`SoundManager.js`)
Sistema de áudio procedural com Web Audio API:

#### 🎵 Músicas Temáticas por Cena
- **Menu:** Choro suave (estilo Pixinga)
- **Hub:** Bossa Nova ambiente (estilo Tom Jobim)
- **Vila Rica:** Moda de viola caipira
- **Rio (1889/1904):** Samba-choro
- **São Paulo:** Trilha tensa (industrial/operário)
- **Epílogo:** Música de esperança/renovação

#### 🎶 Instrumentos Brasileiros Simulados
- Violão (triangle wave com envelope ADSR)
- Cavaquinho (square wave)
- Tamborim (sine wave percussivo)
- Pandeiro (ruído branco filtrado)
- Agogô (square wave agudo)
- Reco-reco (sawtooth curto)
- Flauta (sine wave com vibrato)

#### 🔊 Efeitos Sonoros (SFX)
- `playClick()` — Clique de botão (tamborim)
- `playCollect()` — Coleta de item (som brilhante)
- `playDialogueNext()` — Avanço de diálogo
- `playTransition()` — Transição entre cenas
- `playFragmentCollect()` — Coleta de fragmento (acorde mágico)

#### 🎼 Escalas Musicais Brasileiras
- Maior natural
- Menor natural
- Dórico (comum no forró)
- Mixolídio (blues/MPB)
- Escala diminuta (frevo)

---

## 📁 Estrutura de Arquivos

```
src/
├── main.js                    ← Entry point atualizado
├── scenes/
│   ├── BootScene.js           ← Inicializa áudio + inicia MenuPrincipal
│   └── menu/
│       ├── MenuPrincipal.js   ← Menu principal completo
│       ├── Historia.js        ← Tela de história
│       ├── Configuracoes.js   ← Configurações do jogo
│       └── Creditos.js        ← Créditos
└── audio/
    └── SoundManager.js        ← Gerenciador de áudio brasileiro
```

---

## 🎮 Como Usar

### No Navegador
1. Execute um servidor local na pasta `/workspace`
   ```bash
   cd /workspace
   python3 -m http.server 8000
   ```
2. Acesse `http://localhost:8000/index.html`

### O Jogo Inicia
- BootScene carrega assets e inicializa áudio
- MenuPrincipal é exibido automaticamente
- Navegue pelos menus com mouse/touch

---

## 🎨 Personalização Cultural Brasileira

### Elementos Visuais
- Cores inspiradas na bandeira e cultura brasileira:
  - Dourado (#EF9F27) — riquezas naturais
  - Roxo/Púrpura (#3C3489) — realeza, memória
  - Verde e Amarelo (presentes nos elementos temáticos)

### Elementos Sonoros
- Gêneros musicais brasileiros autênticos
- Instrumentos tradicionais simulados proceduralmente
- Ritmos característicos de cada época histórica

---

## 💾 Save System Integrado

O menu integra-se com o sistema de saves:
- Detecta automaticamente saves existentes
- Exibe botão "Continuar" com contagem de fragmentos
- Permite resetar progresso nas configurações
- Configurações de áudio salvas separadamente

---

## 🔧 Integração com Phaser 3

Todas as cenas usam:
- `Phaser.Scene` como classe base
- Canvas 320×200 com zoom 3× (pixel art)
- Gráficos programáticos via `Phaser.GameObjects.Graphics`
- Tweens para animações suaves
- Interatividade via Pointer Events

---

## 📝 Próximos Passos Sugeridos

1. **Sprites Reais** — Substituir gráficos programáticos por arte pixelada
2. **Mais Fases** — Implementar Rio 1889, São Paulo 1888, Rio 1904
3. **Áudio MP3** — Adicionar opção de carregar músicas reais
4. **Acessibilidade** — Opções de daltonismo, tamanho de fonte
5. **Mobile** — Otimizar controles para touch

---

## 👨‍💻 Desenvolvido Por

**Trabalho de Engenharia de Software**  
Centro Universitário Católica de SC · 2025

**Alunos:**
- Filipe da Silva Ferreira
- Samuel Lucas Corrêa Silveira
- Vinícius de Andrade Martins

**Orientador:**
- Prof. Paulo Rogério Pires Manseira

---

*"Ecos do Brasil: O Guardião da Memória"*  
Preservando a história brasileira através dos tempos 🇧🇷
