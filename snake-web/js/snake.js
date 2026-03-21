/**
 * snake.js - Schlangen-Entität: Bewegung, Kollision und Rendering
 */

class Snake {
    constructor() {
        this.body = [];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.alive = true;
        this.bodySet = new Set(); // O(1) Kollisionsprüfung
    }

    /**
     * Setzt die Schlange auf die Startposition zurück.
     */
    reset() {
        const cx = Math.floor(CONFIG.GRID_WIDTH / 2);
        const cy = Math.floor(CONFIG.GRID_HEIGHT / 2);
        this.body = [
            { x: cx, y: cy },
            { x: cx - 1, y: cy },
            { x: cx - 2, y: cy },
        ];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.alive = true;
        this._rebuildSet();
    }

    _rebuildSet() {
        this.bodySet.clear();
        this.body.forEach(seg => this.bodySet.add(`${seg.x},${seg.y}`));
    }

    /**
     * Setzt die Richtung, verhindert 180°-Wendungen.
     */
    setDirection(dir) {
        const dirs = {
            UP: { x: 0, y: -1 },
            DOWN: { x: 0, y: 1 },
            LEFT: { x: -1, y: 0 },
            RIGHT: { x: 1, y: 0 },
        };
        const nd = dirs[dir];
        if (!nd) return;
        // Verhindere Rückwärtsbewegung
        if (nd.x + this.direction.x === 0 && nd.y + this.direction.y === 0) return;
        this.nextDirection = nd;
    }

    /**
     * Bewegt die Schlange einen Schritt.
     * @param {boolean} wrapAround - Ob die Schlange durch Wände gehen kann
     * @returns {{ ate: boolean, newHead: {x,y}, oldTail: {x,y}|null, collision: string|null }}
     */
    move(obstacles, foodPos, wrapAround) {
        this.direction = this.nextDirection;
        const head = this.body[0];
        let nx = head.x + this.direction.x;
        let ny = head.y + this.direction.y;

        // Wrap-Around oder Wandkollision
        if (wrapAround) {
            nx = ((nx % CONFIG.GRID_WIDTH) + CONFIG.GRID_WIDTH) % CONFIG.GRID_WIDTH;
            ny = ((ny % CONFIG.GRID_HEIGHT) + CONFIG.GRID_HEIGHT) % CONFIG.GRID_HEIGHT;
        } else if (nx < 0 || nx >= CONFIG.GRID_WIDTH || ny < 0 || ny >= CONFIG.GRID_HEIGHT) {
            this.alive = false;
            return { ate: false, newHead: { x: nx, y: ny }, oldTail: null, collision: 'wall' };
        }

        const newHead = { x: nx, y: ny };
        const key = `${nx},${ny}`;

        // Selbstkollision (ohne Schwanz, da er sich bewegt)
        // Prüfe nur body[0..n-2], da body[n-1] gleich entfernt wird (es sei denn, gegessen)
        if (this.bodySet.has(key)) {
            // Prüfe ob es der Schwanz ist (der sich sowieso bewegt)
            const tail = this.body[this.body.length - 1];
            const isTail = tail.x === nx && tail.y === ny;
            const atFood = foodPos && nx === foodPos.x && ny === foodPos.y;
            if (!isTail || atFood) {
                this.alive = false;
                return { ate: false, newHead, oldTail: null, collision: 'self' };
            }
        }

        // Hinderniskollision
        if (obstacles.some(o => o[0] === nx && o[1] === ny)) {
            this.alive = false;
            return { ate: false, newHead, oldTail: null, collision: 'obstacle' };
        }

        // Kopf hinzufügen
        this.body.unshift(newHead);
        this.bodySet.add(key);

        // Futter prüfen
        const ate = foodPos && nx === foodPos.x && ny === foodPos.y;
        let oldTail = null;
        if (!ate) {
            oldTail = this.body.pop();
            this.bodySet.delete(`${oldTail.x},${oldTail.y}`);
        }

        return { ate, newHead, oldTail, collision: null };
    }

    /**
     * Zeichnet die Schlange mit Gradient-Effekt auf dem Canvas.
     */
    draw(ctx, cellSize, time) {
        const len = this.body.length;

        // Glow-Effekt für den Kopf
        const head = this.body[0];
        const hx = head.x * cellSize + cellSize / 2;
        const hy = head.y * cellSize + cellSize / 2;
        ctx.save();
        ctx.shadowColor = CONFIG.COLORS.SNAKE_GLOW;
        ctx.shadowBlur = 15;
        ctx.fillStyle = CONFIG.COLORS.SNAKE_HEAD;
        ctx.fillRect(head.x * cellSize + 1, head.y * cellSize + 1, cellSize - 2, cellSize - 2);
        ctx.restore();

        // Augen auf dem Kopf
        this._drawEyes(ctx, head, cellSize);

        // Körper mit Gradient von hell zu dunkel
        for (let i = 1; i < len; i++) {
            const seg = this.body[i];
            const t = i / Math.max(len - 1, 1);

            // Farbe interpolieren
            const r = Math.round(lerp(0, 0, t));
            const g = Math.round(lerp(204, 77, t));
            const b = Math.round(lerp(51, 26, t));

            ctx.fillStyle = `rgb(${r},${g},${b})`;

            // Leichtes Pulsieren der Segmente
            const pulse = Math.sin(time * 0.003 + i * 0.3) * 0.5;
            const pad = 1 + pulse;

            ctx.fillRect(
                seg.x * cellSize + pad,
                seg.y * cellSize + pad,
                cellSize - pad * 2,
                cellSize - pad * 2
            );
        }
    }

    /**
     * Zeichnet die Augen der Schlange basierend auf der Bewegungsrichtung.
     */
    _drawEyes(ctx, head, cellSize) {
        const cx = head.x * cellSize + cellSize / 2;
        const cy = head.y * cellSize + cellSize / 2;
        const eyeSize = cellSize * 0.12;
        const eyeOffset = cellSize * 0.2;
        const pupilSize = eyeSize * 0.6;

        let e1x, e1y, e2x, e2y, px, py;

        if (this.direction.x === 1) { // Rechts
            e1x = cx + eyeOffset; e1y = cy - eyeOffset;
            e2x = cx + eyeOffset; e2y = cy + eyeOffset;
            px = eyeSize * 0.3; py = 0;
        } else if (this.direction.x === -1) { // Links
            e1x = cx - eyeOffset; e1y = cy - eyeOffset;
            e2x = cx - eyeOffset; e2y = cy + eyeOffset;
            px = -eyeSize * 0.3; py = 0;
        } else if (this.direction.y === -1) { // Oben
            e1x = cx - eyeOffset; e1y = cy - eyeOffset;
            e2x = cx + eyeOffset; e2y = cy - eyeOffset;
            px = 0; py = -eyeSize * 0.3;
        } else { // Unten
            e1x = cx - eyeOffset; e1y = cy + eyeOffset;
            e2x = cx + eyeOffset; e2y = cy + eyeOffset;
            px = 0; py = eyeSize * 0.3;
        }

        // Weiße Augäpfel
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(e1x, e1y, eyeSize, 0, Math.PI * 2);
        ctx.arc(e2x, e2y, eyeSize, 0, Math.PI * 2);
        ctx.fill();

        // Schwarze Pupillen
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(e1x + px, e1y + py, pupilSize, 0, Math.PI * 2);
        ctx.arc(e2x + px, e2y + py, pupilSize, 0, Math.PI * 2);
        ctx.fill();
    }

    get length() {
        return this.body.length;
    }

    get headPos() {
        return this.body[0];
    }
}

/**
 * Lineare Interpolation zwischen zwei Werten.
 */
function lerp(a, b, t) {
    return a + (b - a) * t;
}
