/**
 * food.js - Futter-Spawning und Puls-Animation
 */

class Food {
    constructor() {
        this.pos = null;
        this.pulsePhase = 0;
        this.spawnTime = 0;
        this.type = 'normal'; // 'normal' oder 'bonus'
    }

    /**
     * Platziert das Futter auf einer freien Position.
     * Vermeidet Schlangenkörper und Hindernisse.
     */
    spawn(snakeBody, snakeBodySet, obstacles) {
        const occupied = new Set(snakeBodySet);
        obstacles.forEach(([x, y]) => occupied.add(`${x},${y}`));

        const free = [];
        for (let x = 0; x < CONFIG.GRID_WIDTH; x++) {
            for (let y = 0; y < CONFIG.GRID_HEIGHT; y++) {
                if (!occupied.has(`${x},${y}`)) {
                    free.push({ x, y });
                }
            }
        }

        if (free.length === 0) {
            this.pos = null;
            return false;
        }

        this.pos = free[Math.floor(Math.random() * free.length)];
        this.spawnTime = performance.now();
        this.type = Math.random() < 0.15 ? 'bonus' : 'normal';
        return true;
    }

    /**
     * Zeichnet das Futter mit Puls- und Glow-Effekt.
     */
    draw(ctx, cellSize, time) {
        if (!this.pos) return;

        const x = this.pos.x * cellSize + cellSize / 2;
        const y = this.pos.y * cellSize + cellSize / 2;

        // Pulsierender Größen-Effekt
        const pulse = Math.sin(time * CONFIG.FOOD_PULSE_SPEED) * 0.15 + 0.85;
        const radius = (cellSize / 2 - 2) * pulse;

        // Spawn-Animation (wachsen)
        const age = time - this.spawnTime;
        const spawnScale = Math.min(age / 200, 1);
        const finalRadius = radius * spawnScale;

        const isBonus = this.type === 'bonus';
        const color = isBonus ? CONFIG.COLORS.FOOD_ALT : CONFIG.COLORS.FOOD;
        const glow = isBonus ? CONFIG.COLORS.FOOD_ALT_GLOW : CONFIG.COLORS.FOOD_GLOW;

        // Äußerer Glow
        ctx.save();
        ctx.shadowColor = glow;
        ctx.shadowBlur = 20 + Math.sin(time * 0.005) * 8;

        // Hauptkreis
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, finalRadius, 0, Math.PI * 2);
        ctx.fill();

        // Innerer Glanz
        const gradient = ctx.createRadialGradient(
            x - finalRadius * 0.3, y - finalRadius * 0.3, 0,
            x, y, finalRadius
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, finalRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Bonus-Stern-Markierung
        if (isBonus) {
            ctx.save();
            ctx.fillStyle = '#ffffff';
            ctx.font = `${Math.round(cellSize * 0.5)}px "Press Start 2P", monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('★', x, y + 1);
            ctx.restore();
        }
    }

    /**
     * Gibt die Punkte für dieses Futter zurück.
     */
    getPoints() {
        return this.type === 'bonus' ? 3 : 1;
    }
}
