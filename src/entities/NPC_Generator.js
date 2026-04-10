import NPCGenerator from './entities/NPCGenerator.js';

// Em uma cena Phaser
const npcGen = new NPCGenerator(this, 2); // pixelSize = 2

// Gerar um NPC completo
npcGen.generateNPC('npc_merchant_down', {
    width: 8,
    height: 14,
    skinColor: 0xd4a574,
    hairColor: 0x3a2010,
    shirtColor: 0x4a6080,
    pantsColor: 0x2a2a3a,
    shoeColor: 0x1a1a1a,
    direction: 'down'
});

// Ou gerar todas as direções de uma vez
const textures = npcGen.generateAllDirections('npc_guard', {
    shirtColor: 0x884422,
    hairColor: 0x1a1a1a
});
// Resultado: { down: 'npc_guard_down', up: 'npc_guard_up', ... }