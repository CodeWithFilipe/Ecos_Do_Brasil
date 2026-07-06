import fs from 'fs';
const mapData = JSON.parse(fs.readFileSync('./assets/maps/pacoimperial.tmj', 'utf8'));
const collisionRects = [];
const collisionPolygons = [];
for (const layer of mapData.layers) {
    if (layer.type !== 'objectgroup') continue;
    const isCollisionLayer = (
        layer.name === 'Colisões' ||
        layer.name.toLowerCase() === 'colisoes' ||
        layer.name.toLowerCase().includes('colis')
    );
    if (isCollisionLayer) {
        for (const obj of layer.objects) {
            if (obj.name === 'spawn_player') continue;
            if (obj.polygon) {
                collisionPolygons.push(
                    obj.polygon.map(p => ({ x: obj.x + p.x, y: obj.y + p.y }))
                );
            } else if (obj.polyline) {
                collisionPolygons.push(
                    obj.polyline.map(p => ({ x: obj.x + p.x, y: obj.y + p.y }))
                );
            } else if (obj.width > 1 && obj.height > 1) {
                collisionRects.push({
                    x: obj.x, y: obj.y,
                    width: obj.width, height: obj.height
                });
            }
        }
    }
}
function pointInPoly(px, py, poly) {
    let inside = false;
    const n = poly.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
        const xi = poly[i].x, yi = poly[i].y;
        const xj = poly[j].x, yj = poly[j].y;
        if ((yi > py) !== (yj > py) &&
            px < (xj - xi) * (py - yi) / (yj - yi) + xi) {
            inside = !inside;
        }
    }
    return inside;
}
function isColliding(x, y, w = 16, h = 24) {
    if (x < 0 || y < 0 || x + w > 480 || y + h > 640) return true;
    for (const r of collisionRects) {
        if (x < r.x + r.width  && x + w > r.x &&
            y < r.y + r.height && y + h > r.y) return true;
    }
    const pts = [
        { x, y }, { x: x+w, y }, { x, y: y+h }, { x: x+w, y: y+h },
        { x: x + w/2, y: y + h/2 }
    ];
    for (const poly of collisionPolygons) {
        for (const p of pts) {
            if (pointInPoly(p.x, p.y, poly)) return true;
        }
    }
    return false;
}
console.log("=== PONTOS LIVRES DETECTADOS (X, Y) ===");
for (let y = 80; y < 600; y += 40) {
    const freeX = [];
    for (let x = 20; x < 460; x += 20) {
        if (!isColliding(x, y, 16, 24)) {
            freeX.push(x);
        }
    }
    if (freeX.length > 0) {
        console.log(`Y = ${y}: [${freeX.join(', ')}]`);
    }
}