<h1 align="center">🇧🇷 Ecos do Brasil</h1>

<p align="center">
  <strong>Um jogo de aventura educativo sobre a História do Brasil.</strong><br>
  Viaje no tempo, separe o fato do boato e restaure a verdade dos grandes acontecimentos nacionais.
</p>

<p align="center">
  <img alt="JavaScript" src="https://img.shields.io/badge/JavaScript-ES6-f7df1e?logo=javascript&logoColor=black">
  <img alt="HTML5 Canvas" src="https://img.shields.io/badge/HTML5-Canvas-e34f26?logo=html5&logoColor=white">
  <img alt="Electron" src="https://img.shields.io/badge/Electron-Desktop-47848f?logo=electron&logoColor=white">
  <img alt="Plataforma" src="https://img.shields.io/badge/Plataforma-Windows%20%7C%20Navegador-2ea44f">
  <img alt="Licença" src="https://img.shields.io/badge/Licen%C3%A7a-MIT-blue">
</p>

---

## 📖 Sobre

**Ecos do Brasil** é um jogo 2D (visão de cima) feito em **JavaScript + HTML5 Canvas**.
Você controla **Alex**, uma criança que descobre um **Templo da Memória** onde os
monumentos históricos foram "rachados" pela *névoa das mentiras* — as **fake news do passado**.

Guiado pela guardiã **Arasy**, uma sábia indígena tupi-guarani, Alex viaja a três épocas,
conversa com dezenas de personagens, descobre o que é verdade e o que é boato e
**restaura a história** de cada período. No fim, uma Professora aplica um quiz para
avaliar o aprendizado.

> 🎯 **Tema central:** ensinar História do Brasil desenvolvendo o **pensamento crítico**
> e o combate à desinformação. Alinhado à **BNCC**.

---

## 🎮 Como jogar

O jogo fica na pasta **`ECOS_DO_BRASIL`** e pode ser aberto de três formas — todas funcionam:

| Forma | Como | Precisa instalar algo? |
|-------|------|------------------------|
| 🖥️ **Executável portátil** | Dois cliques em `EcosDoBrasil-portable-1.0.0.exe` | Não |
| 🌐 **`jogar.bat`** | Dois cliques — abre no navegador padrão | Não |
| 📄 **`index.html`** | Dois cliques — abre no navegador | Não |

> O jogo roda direto do arquivo (`file://`), **sem precisar de servidor**, Node.js ou Python.
>
> ⚠️ Na primeira execução do `.exe`, o Windows pode mostrar *"editor desconhecido"*
> (o app é assinado com certificado próprio). Clique em **Mais informações → Executar assim mesmo**,
> ou rode `instalar-certificado.bat` como administrador para remover o aviso de vez.

---

## ⌨️ Controles

| Tecla / Ação | Função |
|--------------|--------|
| **W A S D** ou **setas** | Mover o Alex |
| **E** ou **Espaço** | Interagir / avançar diálogo |
| **J** | Abrir/fechar o Diário |
| **← →** | Virar páginas do diário |
| **↑ ↓** | Navegar entre opções |
| **Mouse (clique)** | Selecionar cartas em "O Desafio de Arasy" |
| **T** | Voltar ao Templo (quando disponível) |
| **M** | Ligar/desligar o som |
| **H** | Abrir/fechar a tela de Controles |

---

## 🗺️ Estrutura do jogo

O jogo tem **3 Atos**, cada um ancorado em um monumento do Templo. Em cada Ato você
**explora → conversa com NPCs → resolve o "Desafio de Arasy" (início e fim do acontecimento) → restaura a estátua**.

| Ato | Época | Tema |
|-----|-------|------|
| **1 — Vila Rica** | 1789 | Inconfidência Mineira |
| **2 — Rio de Janeiro** | 1889 | Proclamação da República |
| **3 — São Paulo** | 1888 | Lei Áurea (Abolição) |

**Epílogo:** de volta à biblioteca, a Professora aplica um **quiz de 3 perguntas**.

---

## 👥 Personagens

- **Alex** — protagonista jogável (criança).
- **Arasy** — guardiã do Templo da Memória (indígena tupi-guarani); apresenta os Atos e conduz os desafios.
- **Professora** e **Bibliotecária** — NPCs da biblioteca (hub).
- **+18 personagens históricos** e populares distribuídos pelos Atos (Tiradentes, Marechal Deodoro, José do Patrocínio, Joaquim Nabuco, e muitos outros).

---

## 🛠️ Tecnologias

- **JavaScript (ES6)** + **HTML5 Canvas** — motor do jogo, sem frameworks.
- **Tiled** (`.tmj`) — edição dos mapas; tiles com propriedade *solid* geram colisão automática.
- **Electron** + **electron-builder** — empacotamento do executável Windows (instalador e portátil), com **assinatura de código**.

---

## 🧑‍💻 Desenvolvimento

O código-fonte modular fica em `ECOS_DO_BRASIL/src/` e é empacotado num único `game.js`
(mais os mapas embutidos em `assets/maps/maps_data.js`), o que permite rodar por `file://`.

```bash
# Regerar o bundle do jogo (game.js + mapas) a partir do src/
python3 scratch/build_bundle.py .

# Gerar o executável Windows (instalador + portátil)
npm install
npm run dist
```

> Detalhes do empacotamento desktop em **`BUILD-ELECTRON.md`**.

---

## 📂 Estrutura de pastas

```
ECOS_DO_BRASIL/
├── index.html            # página do jogo
├── style.css
├── game.js               # jogo empacotado (IIFE, sem imports)
├── jogar.bat             # abre o jogo no navegador
├── EcosDoBrasil-portable-1.0.0.exe   # executável Windows (Electron)
├── instalar-certificado.bat          # confia no .exe assinado
├── assets/
│   ├── sprites/          # sprites (Alex, etc.) + arte procedural (Arasy)
│   └── maps/             # mapas Tiled .tmj + maps_data.js embutido
├── src/                  # código-fonte ES6 (empacotado em game.js)
│   ├── main.js           # game loop, cenas e o objeto ACTS
│   ├── core/             # Input, câmera, estado, save...
│   ├── entities/         # Player, NPC, Arasy, PhaseStatue...
│   ├── ui/               # PuzzleUI, ControlsScreen, JournalUI...
│   └── world/            # Map, Collision...
└── Docs/                 # GDD (.pdf) e manual do jogo (.docx)
```

---

## 📄 Documentação

- **Game Design Document:** `ECOS_DO_BRASIL/Docs/Ecos_do_Brasil_GDD.pdf`
- **Manual do jogo (instalação, controles, progressão):** `ECOS_DO_BRASIL/Docs/Manual_Ecos_do_Brasil.docx`
- **Manual de instalação (texto):** `Manual/manual_instalacao.txt`

---

## 👨‍🎓 Equipe

Projeto acadêmico de **Engenharia de Software** — Centro Universitário Católica de Santa Catarina (2026).

- Filipe da Silva Ferreira
- Samuel Lucas Corrêa Silveira
- Vinícius de Andrade Martins
- Enzo Werner

---

## 📜 Licença

Distribuído sob a licença **MIT**.
