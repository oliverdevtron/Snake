/**
 * Snake Game - Schlangen-Entität
 * Bewegung, Kollision, Rendering mit Gradient-Körper
 */

const Snake = {
    body: [],        // Array von {x, y} — body[0] ist der Kopf
    direction: 'right',
    _bodySet: null,  // Set für O(1)-Kollisionsprüfung

    init(startX, startY, length) {
        this.body = [];
        for (let i = 0; i < length; i++) {
            this.body.push({ x: startX - i, y: startY });
        }
        this.direction = 'right';
        this._rebuildSet();
    },

    _rebuildSet() {
        this._bodySet = new Set(this.body.map(s => s.x + ',' + s.y));
    },

    getHead() {
        return this.body[0];
    },

    length() {
        return this.body.length;
    },

    // Bewege die Schlange in die aktuelle Richtung
    // Gibt die neue Kopfposition zurück (noch nicht dem Body hinzugefügt)
    getNextHead(wrapAround) {
        const head = this.body[0];
        const deltas = {
            up: { x: 0, y: -1 },
            down: { x: 0, y: 1 },
            left: { x: -1, y: 0 },
            right: { x: 1, y: 0 },
        };
        const d = deltas[this.direction];
        let nx = head.x + d.x;
        let ny = head.y + d.y;

        if (wrapAround) {
            nx = (nx + Config.GRID_WIDTH) % Config.GRID_WIDTH;
            ny = (ny + Config.GRID_HEIGHT) % Config.GRID_HEIGHT;
        }

        return { x: nx, y: ny };
    },

    // Füge neuen Kopf hinzu, optional Schwanz entfernen
    move(newHead, grow) {
        this.body.unshift(newHead);
        if (!grow) {
            this.body.pop();
        }
        this._rebuildSet();
    },

    // Prüfe Selbstkollision (neuer Kopf gegen Körper ohne aktuellen Kopf)
    collidesWithSelf(pos) {
        const key = pos.x + ',' + pos.y;
        // Prüfe gegen alle Segmente außer dem letzten (das wird entfernt)
        return this._bodySet.has(key);
    },

    collidesWithBody(pos) {
        return this._bodySet.has(pos.x + ',' + pos.y);
    },

    // Zeichne die Schlange mit Gradient von Kopf bis Schwanz
    draw(ctx, cellSize, time) {
        const len = this.body.length;

        // Körpersegmente (von hinten nach vorne zeichnen für korrekte Überlappung)
        for (let i = len - 1; i >= 1; i--) {
            const seg = this.body[i];
            const t = i / len; // 0 = Kopf, 1 = Schwanz

            // Gradient: helles Grün am Kopf, dunkles Grün am Schwanz
            const r = Math.floor(0 + t * 0);
            const g = Math.floor(255 - t * 180);
            const b = Math.floor(65 - t * 50);

            const x = seg.x * cellSize;
            const y = seg.y * cellSize;
            const padding = 1;

            // Äußeres Segment
            ctx.fillStyle = `rgb(${Math.floor(r * 0.4)}, ${Math.floor(g * 0.4)}, ${Math.floor(b * 0.4)})`;
            ctx.fillRect(x + padding, y + padding, cellSize - padding * 2, cellSize - padding * 2);

            // Inneres Segment (heller)
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fillRect(x + padding + 2, y + padding + 2, cellSize - padding * 2 - 4, cellSize - padding * 2 - 4);
        }

        // Kopf zeichnen (mit Glow-Effekt)
        if (len > 0) {
            const head = this.body[0];
            const hx = head.x * cellSize;
            const hy = head.y * cellSize;

            // Glow
            ctx.shadowColor = Config.COLORS.neonGreen;
            ctx.shadowBlur = 8;

            // Kopf-Hintergrund
            ctx.fillStyle = '#003311';
            ctx.fillRect(hx + 1, hy + 1, cellSize - 2, cellSize - 2);

            // Kopf-Inneres
            ctx.fillStyle = Config.COLORS.snakeHead;
            ctx.fillRect(hx + 3, hy + 3, cellSize - 6, cellSize - 6);

            // Augen
            const eyeSize = Math.max(2, cellSize / 8);
            ctx.fillStyle = '#000';
            const dirs = {
                up: [{ ex: hx + 5, ey: hy + 5 }, { ex: hx + cellSize - 5 - eyeSize, ey: hy + 5 }],
                down: [{ ex: hx + 5, ey: hy + cellSize - 5 - eyeSize }, { ex: hx + cellSize - 5 - eyeSize, ey: hy + cellSize - 5 - eyeSize }],
                left: [{ ex: hx + 5, ey: hy + 5 }, { ex: hx + 5, ey: hy + cellSize - 5 - eyeSize }],
                right: [{ ex: hx + cellSize - 5 - eyeSize, ey: hy + 5 }, { ex: hx + cellSize - 5 - eyeSize, ey: hy + cellSize - 5 - eyeSize }],
            };
            const eyes = dirs[this.direction] || dirs.right;
            eyes.forEach(e => ctx.fillRect(e.ex, e.ey, eyeSize, eyeSize));

            ctx.shadowBlur = 0;
        }
    }
};
