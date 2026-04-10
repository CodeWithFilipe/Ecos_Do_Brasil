// ─────────────────────────────────────────────────────────────
// BootScene.js — Carrega TODOS os assets e gera texturas
// ─────────────────────────────────────────────────────────────

export default class BootScene extends Phaser.Scene {
    constructor() {
        super('Boot');
    }

    preload() {
        this.load.spritesheet('alex', 'assets/sprites/player/spritesheet.png', {
            frameWidth: 68,
            frameHeight: 68
        });
        this.load.image('tileset_interior', 'assets/tilesets/Tileset_32x32_1.png');
    }

    create() {
        this._gerarPisoMadeira();
        this._gerarPisoConcreto();
        this._gerarPisoTerra();
        this._gerarNPCProfessora();
        this._gerarNPCZelador();
        this._gerarItens();
        this._gerarFundoHub();
        this.scene.start('MenuPrincipal');
    }

    _gerarPisoMadeira() {
        const tex = this.textures.createCanvas('piso_madeira', 32, 32);
        const ctx = tex.getContext();
        const tones = ['#d4a060', '#bf8840', '#c89050', '#d09858'];
        for (let row = 0; row < 4; row++) {
            ctx.fillStyle = tones[row % tones.length];
            ctx.fillRect(0, row * 8, 32, 7);
        }
        ctx.strokeStyle = '#8a5c28';
        ctx.lineWidth = 1;
        for (let y = 0; y <= 32; y += 8) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(32, y); ctx.stroke();
        }
        ctx.strokeStyle = '#b87838';
        ctx.lineWidth = 0.5;
        ctx.globalAlpha = 0.4;
        for (let row = 0; row < 4; row++) {
            const y = row * 8 + 3;
            ctx.beginPath(); ctx.moveTo(2, y); ctx.lineTo(28, y); ctx.stroke();
        }
        ctx.globalAlpha = 1;
        tex.refresh();
    }

    _gerarPisoConcreto() {
        const tex = this.textures.createCanvas('piso_concreto', 32, 32);
        const ctx = tex.getContext();
        ctx.fillStyle = '#686868';
        ctx.fillRect(0, 0, 32, 32);
        ctx.strokeStyle = '#505050';
        ctx.lineWidth = 1;
        for (let x = 0; x <= 32; x += 16) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 32); ctx.stroke();
        }
        for (let y = 0; y <= 32; y += 16) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(32, y); ctx.stroke();
        }
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.fillRect(0, 0, 16, 16);
        ctx.fillRect(16, 16, 16, 16);
        tex.refresh();
    }

    _gerarPisoTerra() {
        const tex = this.textures.createCanvas('piso_terra', 32, 32);
        const ctx = tex.getContext();
        ctx.fillStyle = '#c8a870';
        ctx.fillRect(0, 0, 32, 32);
        const grains = ['#d4b478','#bc9c60','#c0a068','#d8b880','#b89058','#c8a870','#d0ac74'];
        // determinístico — sem Math.random para consistência
        for (let i = 0; i < 40; i++) {
            const x = ((i * 7 + 3) % 30);
            const y = ((i * 11 + 5) % 30);
            ctx.fillStyle = grains[i % grains.length];
            ctx.fillRect(x, y, 2, 2);
        }
        ctx.fillStyle = '#a08860';
        for (let i = 0; i < 6; i++) {
            ctx.fillRect((i * 5 + 1) % 30, (i * 7 + 3) % 30, 2, 1);
        }
        tex.refresh();
    }

    _gerarNPCProfessora() {
        const tex = this.textures.createCanvas('prof_down', 16, 20);
        const ctx = tex.getContext();
        // Cabelo
        ctx.fillStyle = '#2a1a08';
        ctx.fillRect(4, 0, 8, 5); ctx.fillRect(3, 1, 10, 4);
        // Rosto
        ctx.fillStyle = '#e8c090';
        ctx.fillRect(4, 3, 8, 7);
        // Óculos
        ctx.strokeStyle = '#404040'; ctx.lineWidth = 0.5;
        ctx.strokeRect(4.5, 4.5, 3, 2.5); ctx.strokeRect(8.5, 4.5, 3, 2.5);
        // Olhos
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(5, 5, 2, 2); ctx.fillRect(9, 5, 2, 2);
        // Boca
        ctx.fillStyle = '#c06060'; ctx.fillRect(6, 8, 4, 1);
        // Blusa azul
        ctx.fillStyle = '#3060a0'; ctx.fillRect(3, 10, 10, 7);
        ctx.fillStyle = '#e8e0d0'; ctx.fillRect(6, 10, 4, 3);
        // Braços e mãos
        ctx.fillStyle = '#3060a0';
        ctx.fillRect(1, 10, 3, 6); ctx.fillRect(12, 10, 3, 6);
        ctx.fillStyle = '#e8c090';
        ctx.fillRect(1, 15, 3, 2); ctx.fillRect(12, 15, 3, 2);
        // Saia
        ctx.fillStyle = '#1a3060'; ctx.fillRect(4, 17, 8, 3);
        tex.refresh();
    }

    _gerarNPCZelador() {
        const tex = this.textures.createCanvas('zelador_right', 16, 20);
        const ctx = tex.getContext();
        ctx.fillStyle = '#a0a0a0'; ctx.fillRect(4, 0, 8, 4);
        ctx.fillStyle = '#d4a878'; ctx.fillRect(4, 3, 8, 7);
        ctx.fillStyle = '#3a2a1a';
        ctx.fillRect(5, 5, 2, 2); ctx.fillRect(9, 5, 2, 2);
        ctx.fillStyle = '#888888'; ctx.fillRect(5, 8, 6, 1);
        ctx.fillStyle = '#7a5020'; ctx.fillRect(3, 10, 10, 7);
        ctx.fillStyle = '#6a4018'; ctx.fillRect(4, 12, 3, 3);
        ctx.fillStyle = '#7a5020';
        ctx.fillRect(1, 10, 3, 7); ctx.fillRect(12, 10, 3, 7);
        ctx.fillStyle = '#d4a878';
        ctx.fillRect(0, 16, 3, 2); ctx.fillRect(13, 16, 3, 2);
        ctx.fillStyle = '#3a3020'; ctx.fillRect(4, 17, 8, 3);
        tex.refresh();
    }

    _gerarItens() {
        // item_carta
        {
            const tex = this.textures.createCanvas('item_carta', 16, 16);
            const ctx = tex.getContext();
            ctx.fillStyle = '#e8d890'; ctx.fillRect(2, 3, 12, 10);
            ctx.strokeStyle = '#b09040'; ctx.lineWidth = 1; ctx.strokeRect(2, 3, 12, 10);
            ctx.strokeStyle = '#c0a050';
            ctx.beginPath(); ctx.moveTo(2,3); ctx.lineTo(8,8); ctx.lineTo(14,3); ctx.stroke();
            ctx.fillStyle = '#c03020';
            ctx.beginPath(); ctx.arc(8,9,2,0,Math.PI*2); ctx.fill();
            ctx.fillStyle = '#e04030'; ctx.fillRect(7,8,1,1);
            tex.refresh();
        }
        // item_confissao
        {
            const tex = this.textures.createCanvas('item_confissao', 16, 16);
            const ctx = tex.getContext();
            ctx.fillStyle = '#d8c080'; ctx.fillRect(3,1,10,14);
            ctx.fillStyle = '#c0a060';
            ctx.fillRect(3,1,10,2); ctx.fillRect(3,13,10,2);
            ctx.strokeStyle = '#806030'; ctx.lineWidth = 0.5;
            for (let y=5;y<13;y+=2){ctx.beginPath();ctx.moveTo(5,y);ctx.lineTo(11,y);ctx.stroke();}
            ctx.strokeStyle = '#604020'; ctx.lineWidth = 1;
            ctx.beginPath();ctx.moveTo(8,3);ctx.lineTo(8,7);ctx.stroke();
            ctx.beginPath();ctx.moveTo(6,5);ctx.lineTo(10,5);ctx.stroke();
            tex.refresh();
        }
        // item_mapa
        {
            const tex = this.textures.createCanvas('item_mapa', 16, 16);
            const ctx = tex.getContext();
            ctx.fillStyle = '#d4c890'; ctx.fillRect(1,1,14,14);
            ctx.strokeStyle = '#a08840'; ctx.lineWidth = 1; ctx.strokeRect(1,1,14,14);
            ctx.fillStyle = '#90a050'; ctx.fillRect(4,5,8,6);
            ctx.strokeStyle = '#c03020'; ctx.lineWidth = 1.5;
            ctx.beginPath();ctx.moveTo(7,7);ctx.lineTo(9,9);ctx.stroke();
            ctx.beginPath();ctx.moveTo(9,7);ctx.lineTo(7,9);ctx.stroke();
            ctx.strokeStyle = '#804020'; ctx.lineWidth = 0.5;
            ctx.setLineDash([1,1]);
            ctx.beginPath();ctx.moveTo(3,8);ctx.lineTo(8,8);ctx.stroke();
            ctx.setLineDash([]);
            tex.refresh();
        }
        // item_fragmento
        {
            const tex = this.textures.createCanvas('item_fragmento', 16, 16);
            const ctx = tex.getContext();
            const gradient = ctx.createRadialGradient(8,7,1,8,7,6);
            gradient.addColorStop(0,'#ffffff');
            gradient.addColorStop(0.3,'#c0a0ff');
            gradient.addColorStop(0.7,'#7050cc');
            gradient.addColorStop(1,'#3020a0');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(8,1);ctx.lineTo(14,6);ctx.lineTo(11,14);ctx.lineTo(5,14);ctx.lineTo(2,6);
            ctx.closePath(); ctx.fill();
            ctx.strokeStyle='rgba(255,255,255,0.7)'; ctx.lineWidth=0.5;
            ctx.beginPath();ctx.moveTo(8,1);ctx.lineTo(11,6);ctx.stroke();
            ctx.beginPath();ctx.moveTo(8,1);ctx.lineTo(5,6);ctx.stroke();
            ctx.fillStyle='#EF9F27';
            ctx.fillRect(1,3,1,1);ctx.fillRect(14,5,1,1);ctx.fillRect(8,0,1,1);
            tex.refresh();
        }
    }

    _gerarFundoHub() {
        const tex = this.textures.createCanvas('pedra_templo', 32, 32);
        const ctx = tex.getContext();
        const colors = ['#1e1830','#221c34','#1a1428','#201c30'];
        for (let y=0;y<4;y++) {
            for (let x=0;x<4;x++) {
                ctx.fillStyle = colors[(x+y)%colors.length];
                ctx.fillRect(x*8,y*8,8,8);
            }
        }
        ctx.strokeStyle='rgba(100,80,160,0.3)'; ctx.lineWidth=0.5;
        ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(32,32);ctx.stroke();
        ctx.beginPath();ctx.moveTo(0,16);ctx.lineTo(16,32);ctx.stroke();
        tex.refresh();
    }
}