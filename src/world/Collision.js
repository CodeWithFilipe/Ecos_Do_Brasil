/**
 * Collision — utilitários centralizados de colisão física (AABB) do mundo.
 *
 * Fonte única de verdade para:
 *  - Quais nomes de camada (objectgroup) de um .tmj contam como colisão física
 *  - O teste de sobreposição retângulo-retângulo usado por Map e pelas entidades
 *
 * Mantém a lógica de colisão consistente entre mapas, em vez de cada arquivo
 * reimplementar sua própria variação da mesma checagem.
 */

/** Nomes de camada reconhecidos como colisão física nos .tmj (case-insensitive). */
const COLLISION_LAYER_NAMES = new Set(['colisões', 'colisoes']);

/** @param {string} name — nome da camada (objectgroup) do .tmj */
export function isCollisionLayerName(name) {
    return COLLISION_LAYER_NAMES.has(name.toLowerCase());
}

/**
 * Sobreposição entre dois retângulos {x, y, width, height} (AABB).
 * Único ponto de verdade para esse teste — usado tanto pela colisão
 * contra o mapa (Map.isColliding) quanto contra NPCs (Player).
 */
export function rectsOverlap(a, b) {
    return a.x < b.x + b.width  && a.x + a.width  > b.x &&
           a.y < b.y + b.height && a.y + a.height > b.y;
}
