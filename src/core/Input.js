export class Input {
    constructor() {
        this.keys = {};
        const gameKeys = new Set([
            'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
            'Space', 'KeyE', 'KeyW', 'KeyA', 'KeyS', 'KeyD'
        ]);
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (gameKeys.has(e.code)) e.preventDefault();
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            if (gameKeys.has(e.code)) e.preventDefault();
        });
    }
    isDown(keyCode) {
        return this.keys[keyCode] === true;
    }
}