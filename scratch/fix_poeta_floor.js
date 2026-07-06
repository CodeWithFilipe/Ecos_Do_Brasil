import fs from 'fs';
import path from 'path';
const mapPath = './assets/maps/cambio.tmj';
const mapData = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
const interiorTileset = mapData.tilesets.find(t => t.source.includes('interior16.tsx'));
if (!interiorTileset) {
    console.error('❌ Tileset interior16.tsx não encontrado no mapa!');
    process.exit(1);
}
const floorGidBase = interiorTileset.firstgid; 
const WOOD_FLOOR_GID = floorGidBase + 293; 
const layer1 = mapData.layers[0];
if (layer1 && layer1.name === 'Camada de Blocos 1') {
    let replacedCount = 0;
    for (let r = 0; r < 20; r++) {
        for (let c = 0; c < 30; c++) {
            const idx = r * 30 + c;
            const isMainHall = (r >= 3 && r <= 17 && c >= 3 && c <= 26);
            const isEntryway = (r === 18 && c >= 13 && c <= 15);
            if ((isMainHall || isEntryway) && layer1.data[idx] === 0) {
                layer1.data[idx] = WOOD_FLOOR_GID;
                replacedCount++;
            }
        }
    }
    console.log(`✨ Substituídos ${replacedCount} blocos de chão vazios por chão de madeira.`);
}
fs.writeFileSync(mapPath, JSON.stringify(mapData, null, 2), 'utf8');
console.log('✅ cambio.tmj atualizado com sucesso!');