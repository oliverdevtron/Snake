/**
 * Snake Game - Visuelle Effekte
 * Partikel, Screen-Shake, CRT-Scanlines, Animationen
 */

const Effects = {
    particles: [],
    shakeOffset: { x: 0, y: 0 },
    _shakeTimer: 0,
    _shakeIntensity: 0,

    // --- Partikel-System ---

    spawnParticles(x, y, color, count) {
        count = count || Config.PARTICLE_COUNT;
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
            const speed = Config.PARTICLE_SPEED * (0.5 + Math.random());
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: Config.PARTICLE_LIFETIME,
                maxLife: Config.PARTICLE_LIFETIME,
                color: color || Config.COLORS.neonGreen,
                size: 2 + Math.random() * 3,
            });
        }
    },

    // Partikel beim Essen spawnen
    spawnEatParticles(gridX, gridY) {
        const px = (gridX + 0.5) * Config.CELL_SIZE;
        const py = (gridY + 0.5) * Config.CELL_SIZE;
        this.spawnParticles(px, py, Config.COLORS.neonPink, 10);
        this.spawnParticles(px, py, Config.COLORS.neonYellow, 6);
    },

    // Partikel beim Tod spawnen
    spawnDeathParticles(gridX, gridY) {
        const px = (gridX + 0.5) * Config.CELL_SIZE;
        const py = (gridY + 0.5) * Config.CELL_SIZE;
        this.spawnParticles(px, py, Config.COLORS.neonPink, 20);
        this.spawnParticles(px, py, '#ff4400', 15);
    },

    updateParticles(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * (dt / 16);
            p.y += p.vy * (dt / 16);
            p.vx *= 0.97;
            p.vy *= 0.97;
            p.life -= dt;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    },

    drawParticles(ctx) {
        this.particles.forEach(p => {
            const alpha = Math.max(0, p.life / p.maxLife);
            ctx.globalAlpha = alpha;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 6;
            ctx.fillStyle = p.color;
            ctx.fillRect(
                p.x - p.size / 2,
                p.y - p.size / 2,
                p.size * alpha,
                p.size * alpha
            );
        });
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    },

    // --- Screen-Shake ---

    triggerShake(intensity, duration) {
        this._shakeIntensity = intensity || Config.SHAKE_INTENSITY;
        this._shakeTimer = duration || Config.SHAKE_DURATION;
    },

    updateShake(dt) {
        if (this._shakeTimer > 0) {
            this._shakeTimer -= dt;
            const factor = this._shakeTimer / Config.SHAKE_DURATION;
            const intensity = this._shakeIntensity * factor;
            this.shakeOffset.x = (Math.random() - 0.5) * intensity * 2;
            this.shakeOffset.y = (Math.random() - 0.5) * intensity * 2;
        } else {
            this.shakeOffset.x = 0;
            this.shakeOffset.y = 0;
        }
    },

    // --- CRT-Scanline-Effekt ---

    drawScanlines(ctx, width, height) {
        ctx.fillStyle = `rgba(0, 0, 0, ${Config.SCANLINE_OPACITY})`;
        for (let y = 0; y < height; y += 3) {
            ctx.fillRect(0, y, width, 1);
        }
        // Leichter Vignette-Effekt an den Rändern
        const gradient = ctx.createRadialGradient(
            width / 2, height / 2, width * 0.3,
            width / 2, height / 2, width * 0.7
        );
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    },

    // --- Grid-Zeichnung ---

    drawGrid(ctx, cellSize) {
        ctx.strokeStyle = Config.COLORS.grid;
        ctx.lineWidth = 0.5;
        for (let x = 0; x <= Config.CANVAS_WIDTH; x += cellSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, Config.CANVAS_HEIGHT);
            ctx.stroke();
        }
        for (let y = 0; y <= Config.CANVAS_HEIGHT; y += cellSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(Config.CANVAS_WIDTH, y);
            ctx.stroke();
        }
    },

    // --- Hindernisse zeichnen ---

    drawObstacles(ctx, obstacles, cellSize, time) {
        obstacles.forEach(o => {
            const x = o.x * cellSize;
            const y = o.y * cellSize;

            // Äußerer Block
            ctx.fillStyle = Config.COLORS.obstacle;
            ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);

            // Innerer Highlight
            ctx.fillStyle = Config.COLORS.obstacleHighlight;
            ctx.fillRect(x + 3, y + 3, cellSize - 6, cellSize - 6);

            // Muster (Gitterlinien im Block)
            ctx.strokeStyle = 'rgba(100, 100, 130, 0.3)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(x + 1, y + cellSize / 2);
            ctx.lineTo(x + cellSize - 1, y + cellSize / 2);
            ctx.moveTo(x + cellSize / 2, y + 1);
            ctx.lineTo(x + cellSize / 2, y + cellSize - 1);
            ctx.stroke();
        });
    },

    // Alle Effekte updaten
    update(dt) {
        this.updateParticles(dt);
        this.updateShake(dt);
    },

    // Alle Partikel löschen
    clear() {
        this.particles = [];
        this._shakeTimer = 0;
        this.shakeOffset.x = 0;
        this.shakeOffset.y = 0;
    }
};
