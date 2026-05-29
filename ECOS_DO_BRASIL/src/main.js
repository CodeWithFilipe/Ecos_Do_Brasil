import { Input } from './core/Input.js';
import { Player } from './entities/Player.js';
import { NPC } from './entities/NPC.js';
import { DialogueBox } from './ui/DialogueBox.js';
import { Map } from './world/Map.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const input = new Input();

// ==========================================
// 1. CARREGANDO O MAPA E O CENÁRIO
// ==========================================
let gameMap = null;
const tilesetImg = new Image();

// ⚠️ ATENÇÃO: Garanta que você colocou a imagem do cenário na pasta com este exato nome!
tilesetImg.src = './assets/maps/tileset.png'; 

fetch('./assets/maps/biblioteca.tmj')
    .then(response => {
        if(!response.ok) throw new Error("Erro ao carregar o mapa");
        return response.json();
    })
    .then(data => {
        gameMap = new Map(data, tilesetImg);
    })
    .catch(err => console.error("Aviso do Mapa:", err));

// ==========================================
// 2. CARREGANDO O JOGADOR (Matriz global.png)
// ==========================================
const globalSprite = new Image();
globalSprite.src = './assets/sprites/global.png';

const alex = new Player(150, 150, globalSprite);
const dialogueBox = new DialogueBox(canvas, ctx);

const interactables = [
    { x: 150, y: 80, width: 16, height: 16, color: '#4a2808', name: 'Livro sem título', isItem: true },
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
    if (!dialogueBox.active) { alex.update(dt, input); }
    dialogueBox.update(dt);
    const spaceIsDown = input.isDown('Space') || input.isDown('KeyE');
    if (spaceIsDown && !spaceWasDown) {
        if (dialogueBox.active) { dialogueBox.advance(); }
        else { checkInteraction(); }
    }
    spaceWasDown = spaceIsDown;
}

function checkRectCollision(rect1, rect2) {
    return (rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height && rect1.y + rect1.height > rect2.y);
}

function checkInteraction() {
    const box = alex.getInteractionBox();
    for (let obj of interactables) {
        if (checkRectCollision(box, obj)) {
            if (obj.name === 'Livro sem título') {
                dialogueBox.show([
                    { speaker: 'Alex', text: 'Esse livro... Ele não tem título. E está emitindo um calor estranho.' },
                    { speaker: 'Livro de Couro', text: '"Quem lê isto foi escolhido. O passado precisa de você."' }
                ], () => { console.log("Transição de cena aqui!"); });
            } else if (obj.name === 'Zelador') {
                dialogueBox.show([
                    { speaker: 'Zelador', text: '...' },
                    { speaker: 'Alex', text: 'Melhor não incomodar.' }
                ], () => {});
            }
            break;
        }
    }
}

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameMap) { gameMap.draw(ctx); }

    for (let obj of interactables) {
        if (obj.draw) { obj.draw(ctx); }
        else { ctx.fillStyle = obj.color; ctx.fillRect(obj.x, obj.y, obj.width, obj.height); }
    }

    alex.draw(ctx);
    dialogueBox.draw();
}

requestAnimationFrame(gameLoop);