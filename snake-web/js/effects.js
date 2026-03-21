/**
 * effects.js - Partikeleffekte, Bildschirm-Shake, CRT-Overlay und Animationen
 */

class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    /**
     * Erzeugt Partikel an einer Position (z.B. beim Fressen).
     */
    emit(x, y, color, count) {
        count = count || CONFIG.PARTICLE_COUNT;
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
            const speed = CONFIG.PARTICLE_SPEED * (0.5 + Math.random());
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: CONFIG.PARTICLE_LIFETIME,
                maxLife: CONFIG.PARTICLE_LIFETIME,
                color,
                size: 2 + Math.random() * 3,
            });
        }
    }

    /**
     * Aktualisiert alle Partikel.
     */
    update(dt) {
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
    }

    /**
     * Zeichnet alle Partikel.
     */
    draw(ctx) {
        this.particles.forEach(p => {
            const alpha = Math.max(0, p.life / p.maxLife);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 8;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }

    clear() {
        this.particles = [];
    }
}

class ScreenShake {
    constructor() {
        this.intensity = 0;
        this.duration = 0;
        this.elapsed = 0;
        this.offsetX = 0;
        this.offsetY = 0;
    }

    /**
     * Startet einen Bildschirm-Shake-Effekt.
     */
    trigger(intensity, duration) {
        this.intensity = intensity || CONFIG.SHAKE_INTENSITY;
        this.duration = duration || CONFIG.SHAKE_DURATION;
        this.elapsed = 0;
    }

    /**
     * Aktualisiert den Shake-Effekt.
     */
    update(dt) {
        if (this.elapsed >= this.duration) {
            this.offsetX = 0;
            this.offsetY = 0;
            return;
        }
        this.elapsed += dt;
        const progress = this.elapsed / this.duration;
        const decay = 1 - progress;
        this.offsetX = (Math.random() - 0.5) * 2 * this.intensity * decay;
        this.offsetY = (Math.random() - 0.5) * 2 * this.intensity * decay;
    }

    get active() {
        return this.elapsed < this.duration;
    }
}

class CRTEffect {
    constructor() {
        this.enabled = false;
        this._canvas = null;
        this._ctx = null;
    }

    /**
     * Erstellt das Scanline-Overlay einmalig.
     */
    init(width, height) {
        this._canvas = document.createElement('canvas');
        this._canvas.width = width;
        this._canvas.height = height;
        this._ctx = this._canvas.getContext('2d');

        // Scanlines zeichnen
        this._ctx.clearRect(0, 0, width, height);
        for (let y = 0; y < height; y += 2) {
            this._ctx.fillStyle = CONFIG.COLORS.SCANLINE;
            this._ctx.fillRect(0, y, width, 1);
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    /**
     * Zeichnet das CRT-Overlay.
     */
    draw(ctx) {
        if (!this.enabled || !this._canvas) return;
        ctx.drawImage(this._canvas, 0, 0);

        // Leichter Vignette-Effekt
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;
        const gradient = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.7);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.3)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
    }
}

/**
 * Floating-Text-Effekt (z.B. "+1" beim Fressen)
 */
class FloatingTexts {
    constructor() {
        this.texts = [];
    }

    add(x, y, text, color) {
        this.texts.push({
            x, y, text, color,
            life: 800,
            maxLife: 800,
            vy: -1.5,
        });
    }

    update(dt) {
        for (let i = this.texts.length - 1; i >= 0; i--) {
            const t = this.texts[i];
            t.y += t.vy * (dt / 16);
            t.life -= dt;
            if (t.life <= 0) {
                this.texts.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        this.texts.forEach(t => {
            const alpha = Math.max(0, t.life / t.maxLife);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = t.color;
            ctx.font = '10px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = t.color;
            ctx.shadowBlur = 6;
            ctx.fillText(t.text, t.x, t.y);
            ctx.restore();
        });
    }

    clear() {
        this.texts = [];
    }
}

const particles = new ParticleSystem();
const screenShake = new ScreenShake();
const crtEffect = new CRTEffect();
const floatingTexts = new FloatingTexts();
