export default class BootScene extends Phaser.Scene {
    constructor() { 
        super('Boot'); 
    }

    preload() {
        // Carrega apenas os personagens reais que você já tem
        this.load.spritesheet('alex', 'assets/sprites/player/spritesheet.png', { 
            frameWidth: 68, frameHeight: 68 
        });
        this.load.image('prof_down', 'assets/sprites/professora/south.png');
    }

    create() {
        this.gerarTexturasProcedurais();
        this.scene.start('Biblioteca'); // Ou 'MenuPrincipal', dependendo do seu fluxo
    }

    gerarTexturasProcedurais() {
        // 1. Chão de Madeira (Estilo Harvest Moon)
        const gPiso = this.make.graphics({ x: 0, y: 0, add: false });
        gPiso.fillStyle(0x5c3a21, 1); // Fundo marrom escuro
        gPiso.fillRect(0, 0, 32, 32);
        gPiso.fillStyle(0x704829, 1); // Tábua 1
        gPiso.fillRect(0, 0, 32, 14);
        gPiso.fillStyle(0x664024, 1); // Tábua 2
        gPiso.fillRect(0, 16, 32, 14);
        gPiso.fillStyle(0x4a2e1a, 1); // Linhas das tábuas
        gPiso.fillRect(0, 14, 32, 2);
        gPiso.fillRect(0, 30, 32, 2);
        gPiso.fillRect(16, 0, 2, 14);
        gPiso.fillRect(8, 16, 2, 14);
        gPiso.generateTexture('piso_madeira_pro', 32, 32);
        gPiso.destroy();

        // 2. Parede da Biblioteca
        const gParede = this.make.graphics({ x: 0, y: 0, add: false });
        gParede.fillStyle(0xd5ccb5, 1); // Papel de parede bege clássico
        gParede.fillRect(0, 0, 32, 64);
        gParede.fillStyle(0x4a2e1a, 1); // Rodapé de madeira
        gParede.fillRect(0, 54, 32, 10);
        gParede.fillStyle(0xb5a98d, 1); // Linhas verticais discretas (textura)
        gParede.fillRect(16, 0, 2, 54);
        gParede.generateTexture('parede_pro', 32, 64);
        gParede.destroy();

        // 3. Estante de Livros Detalhada (96x96 pixels)
        const gEstante = this.make.graphics({ x: 0, y: 0, add: false });
        gEstante.fillStyle(0x3e2312, 1); // Fundo escuro da estante
        gEstante.fillRect(0, 0, 96, 96);
        gEstante.fillStyle(0x5c3a21, 1); // Moldura e Prateleiras
        gEstante.fillRect(0, 0, 96, 8);   // Topo
        gEstante.fillRect(0, 0, 8, 96);   // Lado Esq
        gEstante.fillRect(88, 0, 8, 96);  // Lado Dir
        gEstante.fillRect(8, 32, 80, 6);  // Prateleira 1
        gEstante.fillRect(8, 64, 80, 6);  // Prateleira 2
        gEstante.fillRect(0, 88, 96, 8);  // Base
        // Desenhando os livros (Coloridos)
        const coresLivros = [0x9e2a2b, 0x335c67, 0xe09f3e, 0x540b0e, 0x4a4e69];
        for (let prateleira = 0; prateleira < 3; prateleira++) {
            let yBase = 12 + (prateleira * 32);
            let xAtual = 10;
            while (xAtual < 80) {
                let larguraLivro = Phaser.Math.Between(4, 12);
                let alturaLivro = Phaser.Math.Between(14, 20);
                if (xAtual + larguraLivro > 84) break;
                gEstante.fillStyle(Phaser.Utils.Array.GetRandom(coresLivros), 1);
                gEstante.fillRect(xAtual, yBase + (20 - alturaLivro), larguraLivro - 1, alturaLivro);
                xAtual += larguraLivro;
            }
        }
        gEstante.generateTexture('estante_pro', 96, 96);
        gEstante.destroy();

        // 4. Mesa de Estudos
        const gMesa = this.make.graphics({ x: 0, y: 0, add: false });
        gMesa.fillStyle(0x3e2312, 1); // Sombras/Pés
        gMesa.fillRect(4, 32, 8, 16);
        gMesa.fillRect(52, 32, 8, 16);
        gMesa.fillStyle(0x704829, 1); // Tampo de madeira claro
        gMesa.fillRect(0, 0, 64, 36);
        gMesa.fillStyle(0x5c3a21, 1); // Borda inferior do tampo
        gMesa.fillRect(0, 32, 64, 4);
        gMesa.generateTexture('mesa_pro', 64, 48);
        gMesa.destroy();
    }
}