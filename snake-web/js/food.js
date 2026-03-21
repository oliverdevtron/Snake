/**
 * Snake Game - Futter-System
 * Spawning, Animation (Pulsieren, Glühen)
 */

const Food = {
    pos: null, // {x, y}
    _pulsePhase: 0,

    spawn(snakeBody, obstacles) {
        const occupied = new Set();
        snakeBody.forEach(s => occupied.add(s.x + ',' + s.y));
        obstacles.forEach(o => occupied.add(o.x + ',' + o.y));

        const free = [];
        for (let x = 0; x < Config.GRID_WIDTH; x++) {
            for (let y = 0; y < Config.GRID_HEIGHT; y++) {
                if (!occupied.has(x + ',' + y)) {
                    free.push({ x, y });
                }
            }
        }

        if (free.length === 0) return false; // Kein Platz mehr
        this.pos = free[Math.floor(Math.random() * free.length)];
        this._pulsePhase = 0;
        return true;
    },

    update(dt) {
        this._pulsePhase += Config.FOOD_PULSE_SPEED * dt;
    },

    draw(ctx, cellSize, time) {
        if (!this.pos) return;

        const x = this.pos.x * cellSize;
        const y = this.pos.y * cellSize;
        const centerX = x + cellSize / 2;
        const centerY = y + cellSize / 2;

        // Pulsier-Effekt
        const pulse = 1 + Math.sin(this._pulsePhase) * Config.FOOD_PULSE_AMOUNT;
        const size = (cellSize - 4) * pulse;
        const halfSize = size / 2;

        // Äußerer Glow
        ctx.shadowColor = Config.COLORS.neonPink;
        ctx.shadowBlur = 12 + Math.sin(this._pulsePhase * 1.5) * 6;

        // Futter-Körper (Kreis)
        ctx.fillStyle = Config.COLORS.food;
        ctx.beginPath();
        ctx.arc(centerX, centerY, halfSize * 0.6, 0, Math.PI * 2);
        ctx.fill();

        // Innerer Highlight
        ctx.fillStyle = Config.COLORS.foodGlow;
        ctx.beginPath();
        ctx.arc(centerX - 1, centerY - 1, halfSize * 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
    }
};
