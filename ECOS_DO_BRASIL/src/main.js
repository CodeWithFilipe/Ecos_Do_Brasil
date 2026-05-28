import { Input } from './core/Input.js';
import { Player } from './entities/Player.js';
import { NPC } from './entities/NPC.js';
import { DialogueBox } from './ui/DialogueBox.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const input = new Input();

// 1. Carregamos a imagem do spritesheet na memória
const globalSprite = new Image();
globalSprite.src = './assets/sprites/global.png'; 

// 2. Instanciamos o Alex
const alex = new Player(150, 150, globalSprite);

// 3. Instanciamos a Interface de Diálogos
const dialogueBox = new DialogueBox(canvas, ctx);

// Objetos e NPCs do Prólogo (Estoque da Biblioteca)
const interactables = [
    { 
        x: 150, y: 80, width: 16, height: 16, color: '#4a2808', 
        name: 'Livro sem título', isItem: true 
    },
    // O Zelador que passa o rodo
    new NPC(200, 100, 'Zelador', '#787880')
];

let lastTime = performance.now();
let spaceWasDown = false;

function gameLoop(currentTime) {
    const dt = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    update(dt);
    draw();

    requestAnimationFrame(gameLoop);
}

function update(dt) {
    // O Alex só anda se a caixa de diálogo não estiver ativa na tela
    if (!dialogueBox.active) {
        alex.update(dt, input);
    }
    
    dialogueBox.update(dt);

    const spaceIsDown = input.isDown('Space') || input.isDown('KeyE');
    
    // Verifica se a tecla acabou de ser apertada (evita múltiplos cliques)
    if (spaceIsDown && !spaceWasDown) {
        if (dialogueBox.active) {
            // Se já estiver conversando, avança o texto
            dialogueBox.advance();
        } else {
            // Se não, checa se tem algo na frente para interagir
            checkInteraction();
        }
    }
    spaceWasDown = spaceIsDown;
}

function checkRectCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

function checkInteraction() {
    const box = alex.getInteractionBox();
    
    for (let obj of interactables) {
        if (checkRectCollision(box, obj)) {
            
            // Diálogos do roteiro
            if (obj.name === 'Livro sem título') {
                dialogueBox.show([
                    { speaker: 'Alex', text: 'Esse livro... Ele não tem título. E está emitindo um calor estranho.' },
                    { speaker: 'Livro de Couro', text: '"Quem lê isto foi escolhido. O passado precisa de você."' }
                ], () => {
                    console.log("Diálogo terminou! Aqui faremos a transição para o Templo da Memória.");
                });
            } else if (obj.name === 'Zelador') {
                dialogueBox.show([
                    { speaker: 'Zelador', text: '...' },
                    { speaker: 'Alex', text: 'Ele está passando o rodo sem olhar pra mim. Melhor não incomodar.' }
                ], () => {});
            }

            break; // Garante que ele interage com apenas um objeto por vez
        }
    }
}

function draw() {
    // Limpa a tela pintando o fundo (chão do estoque)
    ctx.fillStyle = '#120d0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Desenha os itens interativos e NPCs
    for (let obj of interactables) {
        if (obj.draw) {
            obj.draw(ctx);
        } else {
            ctx.fillStyle = obj.color;
            ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        }
    }

    // Desenha o jogador por cima do cenário
    alex.draw(ctx);
    
    // Desenha a interface (UI de Diálogo) sempre por cima de absolutamente tudo
    dialogueBox.draw();
}

// Inicia o loop principal do jogo
requestAnimationFrame(gameLoop);