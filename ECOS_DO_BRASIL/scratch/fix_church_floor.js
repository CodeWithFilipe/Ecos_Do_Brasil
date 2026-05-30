import fs from 'fs';
import path from 'path';

const mapPath = './assets/maps/igreja.tmj';
const mapData = JSON.parse(fs.readFileSync(mapPath, 'utf8'));

// 1. Adicionar o tileset interior16.tsx se não existir
const hasInteriorTileset = mapData.tilesets.some(t => t.source.includes('interior16.tsx'));
const floorGidBase = 4500;

if (!hasInteriorTileset) {
    mapData.tilesets.push({
        "firstgid": floorGidBase,
        "source": "..\\/..\\/interior16.tsx"
    });
}

// O ID local do chão de madeira na taverna é 293. GID = base + 293 = 4793.
const WOOD_FLOOR_GID = floorGidBase + 293;

// 2. Modificar a Camada de Blocos 1 (layers[0])
const layer1 = mapData.layers[0];
if (layer1 && layer1.name === 'Camada de Blocos 1') {
    let replacedCount = 0;
    for (let r = 0; r < 20; r++) {
        for (let c = 0; c < 30; c++) {
            const idx = r * 30 + c;
            
            // Condição para estar dentro do salão da igreja:
            // Entre as linhas 4 e 17 (inclusive), e colunas 2 a 26 (inclusive)
            const isMainHall = (r >= 4 && r <= 17 && c >= 2 && c <= 26);
            
            // Condição para a entrada/portal da igreja:
            // Linha 18, colunas 13 a 15
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
console.log('✅ igreja.tmj atualizado com sucesso!');
