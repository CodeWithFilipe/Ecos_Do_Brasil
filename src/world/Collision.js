const COLLISION_LAYER_NAMES = new Set(['colisões', 'colisoes']);
export function isCollisionLayerName(name) {
    return COLLISION_LAYER_NAMES.has(name.toLowerCase());
}
export function rectsOverlap(a, b) {
    return a.x < b.x + b.width  && a.x + a.width  > b.x &&
           a.y < b.y + b.height && a.y + a.height > b.y;
}