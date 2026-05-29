export class Map {
    constructor(mapData, tilesetImage) {
        this.mapData = mapData;
        this.tilesetImage = tilesetImage;
    }

    draw(ctx) {
        if (!this.tilesetImage.complete) return;

        // O mapa tem várias camadas (chão, paredes, itens)
        this.mapData.layers.forEach(layer => {
            if (layer.type !== 'tilelayer' || !layer.visible) return;

            layer.data.forEach((tileId, index) => {
                if (tileId === 0) return;

                // Tiled usa números binários para espelhamento, limpamos isso
                const cleanId = tileId & ~(0x80000000 | 0x40000000 | 0x20000000);
                
                // Calcula a posição (X, Y) do bloco na tela
                const dx = (index % layer.width) * this.mapData.tilewidth;
                const dy = Math.floor(index / layer.width) * this.mapData.tileheight;

                // Calcula a posição (SX, SY) do bloco no PNG (Tileset)
                // Assumimos que o tileset tem 16 tiles de largura (ajuste se necessário)
                const tilesetCols = Math.floor(this.tilesetImage.width / this.mapData.tilewidth);
                const sx = ((cleanId - 1) % tilesetCols) * this.mapData.tilewidth;
                const sy = Math.floor((cleanId - 1) / tilesetCols) * this.mapData.tileheight;

                ctx.drawImage(this.tilesetImage, sx, sy, this.mapData.tilewidth, this.mapData.tileheight, dx, dy, this.mapData.tilewidth, this.mapData.tileheight);
            });
        });
    }
}