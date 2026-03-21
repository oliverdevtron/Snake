/**
 * ui.js - Menüs, HUD, Highscores und Startbildschirm
 */

class UI {
    constructor() {
        this.highscores = this._loadHighscores();
        this.nameInput = '';
        this.selectedDifficulty = 2;
        this.wrapAround = false;
        this.titleWave = 0;
    }

    // --- Highscore-Verwaltung ---

    _loadHighscores() {
        try {
            const data = localStorage.getItem(CONFIG.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

    _saveHighscores() {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(this.highscores));
        } catch (e) {
            console.warn('Highscores konnten nicht gespeichert werden:', e);
        }
    }

    addHighscore(name, score, difficulty) {
        this.highscores.push({
            name: name || 'Anonym',
            score,
            difficulty,
            date: new Date().toLocaleDateString('de-DE'),
        });
        this.highscores.sort((a, b) => b.score - a.score);
        this.highscores = this.highscores.slice(0, CONFIG.MAX_HIGHSCORES);
        this._saveHighscores();
    }

    isHighscore(score) {
        return this.highscores.length < CONFIG.MAX_HIGHSCORES ||
               score > (this.highscores[this.highscores.length - 1]?.score || 0);
    }

    // --- Startbildschirm ---

    drawStartScreen(ctx, w, h, time) {
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = CONFIG.COLORS.BG;
        ctx.fillRect(0, 0, w, h);

        // Animierter Titel
        this._drawAnimatedTitle(ctx, w, h, time);

        // Schwierigkeitsauswahl
        const diffY = h * 0.45;
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = CONFIG.COLORS.TEXT_DIM;
        ctx.fillText('SCHWIERIGKEIT WÄHLEN', w / 2, diffY);

        [1, 2, 3].forEach((d, i) => {
            const dy = diffY + 30 + i * 28;
            const diff = CONFIG.DIFFICULTIES[d];
            const selected = d === this.selectedDifficulty;

            ctx.font = selected ? '11px "Press Start 2P", monospace' : '9px "Press Start 2P", monospace';
            ctx.fillStyle = selected ? diff.color : CONFIG.COLORS.TEXT_DIM;

            if (selected) {
                ctx.shadowColor = diff.color;
                ctx.shadowBlur = 10;
            }

            const prefix = selected ? '► ' : '  ';
            ctx.fillText(`${prefix}${d} - ${diff.name}`, w / 2, dy);
            ctx.shadowBlur = 0;
        });

        // Wrap-Around Option
        const wrapY = diffY + 30 + 3 * 28 + 15;
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillStyle = this.wrapAround ? CONFIG.COLORS.NEON_BLUE : CONFIG.COLORS.TEXT_DIM;
        ctx.fillText(`[W] Wrap-Around: ${this.wrapAround ? 'AN' : 'AUS'}`, w / 2, wrapY);

        // Steuerung
        const ctrlY = h * 0.78;
        ctx.font = '7px "Press Start 2P", monospace';
        ctx.fillStyle = CONFIG.COLORS.TEXT_DIM;
        const controls = [
            '↑↓←→ / WASD  Steuern',
            'P / ESC       Pause',
            'G  Gitter   M  Sound',
            'C  CRT-Effekt',
        ];
        controls.forEach((line, i) => {
            ctx.fillText(line, w / 2, ctrlY + i * 16);
        });

        // Start-Hinweis
        const blink = Math.sin(time * 0.004) > 0;
        if (blink) {
            ctx.font = '10px "Press Start 2P", monospace';
            ctx.fillStyle = CONFIG.COLORS.NEON_YELLOW;
            ctx.shadowColor = CONFIG.COLORS.NEON_YELLOW;
            ctx.shadowBlur = 15;
            ctx.fillText('ENTER / TAP ZUM STARTEN', w / 2, h * 0.93);
            ctx.shadowBlur = 0;
        }
    }

    _drawAnimatedTitle(ctx, w, h, time) {
        const title = 'SNAKE';
        const titleY = h * 0.18;
        ctx.font = '36px "Press Start 2P", monospace';
        ctx.textAlign = 'center';

        // Buchstaben einzeln mit Wellen-Effekt
        const totalWidth = ctx.measureText(title).width;
        let x = w / 2 - totalWidth / 2;

        for (let i = 0; i < title.length; i++) {
            const charWidth = ctx.measureText(title[i]).width;
            const wave = Math.sin(time * CONFIG.TITLE_WAVE_SPEED + i * 0.8) * 8;

            // Neon-Glow
            ctx.save();
            ctx.shadowColor = CONFIG.COLORS.SNAKE_HEAD;
            ctx.shadowBlur = 20 + Math.sin(time * 0.002 + i) * 5;
            ctx.fillStyle = CONFIG.COLORS.SNAKE_HEAD;
            ctx.textAlign = 'left';
            ctx.fillText(title[i], x, titleY + wave);
            ctx.restore();

            x += charWidth;
        }

        // Untertitel
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = CONFIG.COLORS.TEXT_DIM;
        ctx.fillText('WEB EDITION v1.0', w / 2, titleY + 25);
    }

    // --- HUD (Heads-Up Display) ---

    drawHUD(ctx, w, h, state) {
        const pad = 8;
        const fontSize = 9;
        ctx.font = `${fontSize}px "Press Start 2P", monospace`;
        ctx.textAlign = 'left';

        // Obere Leiste - Score
        ctx.fillStyle = CONFIG.COLORS.NEON_YELLOW;
        ctx.shadowColor = CONFIG.COLORS.NEON_YELLOW;
        ctx.shadowBlur = 4;
        ctx.fillText(`PUNKTE: ${state.score}`, pad, pad + fontSize);
        ctx.shadowBlur = 0;

        // Level
        ctx.fillStyle = CONFIG.COLORS.NEON_BLUE;
        ctx.fillText(`LEVEL: ${state.level + 1}`, pad, pad + fontSize * 2 + 4);

        // Schlangenlänge
        ctx.fillStyle = CONFIG.COLORS.SNAKE_HEAD;
        ctx.fillText(`LÄNGE: ${state.snakeLength}`, pad, pad + fontSize * 3 + 8);

        // Rechte Seite - Geschwindigkeit
        ctx.textAlign = 'right';
        const speedPct = Math.round((1 - (state.speed - CONFIG.MIN_SPEED) / (200 - CONFIG.MIN_SPEED)) * 100);
        ctx.fillStyle = this._speedColor(speedPct);
        ctx.fillText(`SPEED: ${speedPct}%`, w - pad, pad + fontSize);

        // Schwierigkeit
        const diff = CONFIG.DIFFICULTIES[state.difficulty];
        ctx.fillStyle = diff.color;
        ctx.fillText(diff.name.toUpperCase(), w - pad, pad + fontSize * 2 + 4);

        // Wrap-Around-Anzeige
        if (state.wrapAround) {
            ctx.fillStyle = CONFIG.COLORS.NEON_BLUE;
            ctx.fillText('WRAP', w - pad, pad + fontSize * 3 + 8);
        }

        ctx.textAlign = 'left';
    }

    _speedColor(pct) {
        if (pct < 40) return CONFIG.COLORS.NEON_YELLOW;
        if (pct < 70) return CONFIG.COLORS.FOOD_ALT;
        return CONFIG.COLORS.FOOD;
    }

    // --- Pause-Bildschirm ---

    drawPauseScreen(ctx, w, h, time) {
        ctx.fillStyle = CONFIG.COLORS.OVERLAY;
        ctx.fillRect(0, 0, w, h);

        const blink = Math.sin(time * 0.004) > 0;

        ctx.textAlign = 'center';
        ctx.font = '24px "Press Start 2P", monospace';
        ctx.fillStyle = CONFIG.COLORS.NEON_YELLOW;
        ctx.shadowColor = CONFIG.COLORS.NEON_YELLOW;
        ctx.shadowBlur = 15;
        ctx.fillText('PAUSE', w / 2, h / 2 - 20);
        ctx.shadowBlur = 0;

        if (blink) {
            ctx.font = '9px "Press Start 2P", monospace';
            ctx.fillStyle = CONFIG.COLORS.TEXT;
            ctx.fillText('P / ESC ZUM FORTFAHREN', w / 2, h / 2 + 25);
        }
    }

    // --- Game Over / Victory ---

    drawEndScreen(ctx, w, h, time, state) {
        ctx.fillStyle = CONFIG.COLORS.OVERLAY;
        ctx.fillRect(0, 0, w, h);

        const isVictory = state.victory;
        const title = isVictory ? 'SIEG!' : 'GAME OVER';
        const titleColor = isVictory ? CONFIG.COLORS.SNAKE_HEAD : CONFIG.COLORS.FOOD;
        const glowColor = isVictory ? CONFIG.COLORS.SNAKE_GLOW : CONFIG.COLORS.FOOD_GLOW;

        // Titel
        ctx.textAlign = 'center';
        ctx.font = '22px "Press Start 2P", monospace';
        ctx.fillStyle = titleColor;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 20;
        ctx.fillText(title, w / 2, h * 0.25);
        ctx.shadowBlur = 0;

        // Score
        ctx.font = '12px "Press Start 2P", monospace';
        ctx.fillStyle = CONFIG.COLORS.NEON_YELLOW;
        ctx.fillText(`PUNKTE: ${state.score}`, w / 2, h * 0.35);

        ctx.font = '9px "Press Start 2P", monospace';
        ctx.fillStyle = CONFIG.COLORS.TEXT_DIM;
        ctx.fillText(`LEVEL: ${state.level + 1}  LÄNGE: ${state.snakeLength}`, w / 2, h * 0.40);

        // Highscore-Eingabe oder Highscore-Liste
        if (state.enteringName) {
            this._drawNameInput(ctx, w, h, time, state);
        } else {
            this._drawHighscoreTable(ctx, w, h);

            // Neustart-Hinweis
            const blink = Math.sin(time * 0.004) > 0;
            if (blink) {
                ctx.font = '8px "Press Start 2P", monospace';
                ctx.fillStyle = CONFIG.COLORS.TEXT;
                ctx.fillText('R = NEUSTART  Q = MENÜ', w / 2, h * 0.92);
            }
        }
    }

    _drawNameInput(ctx, w, h, time, state) {
        ctx.font = '9px "Press Start 2P", monospace';
        ctx.fillStyle = CONFIG.COLORS.TEXT;
        ctx.textAlign = 'center';
        ctx.fillText('NEUER HIGHSCORE!', w / 2, h * 0.50);

        ctx.fillStyle = CONFIG.COLORS.NEON_YELLOW;
        ctx.fillText('NAME EINGEBEN:', w / 2, h * 0.58);

        // Namenseingabe mit blinkendem Cursor
        const cursor = Math.sin(time * 0.006) > 0 ? '█' : ' ';
        ctx.font = '12px "Press Start 2P", monospace';
        ctx.fillStyle = CONFIG.COLORS.TEXT_BRIGHT;
        ctx.shadowColor = CONFIG.COLORS.SNAKE_HEAD;
        ctx.shadowBlur = 8;
        ctx.fillText(this.nameInput + cursor, w / 2, h * 0.66);
        ctx.shadowBlur = 0;

        ctx.font = '7px "Press Start 2P", monospace';
        ctx.fillStyle = CONFIG.COLORS.TEXT_DIM;
        ctx.fillText('ENTER = BESTÄTIGEN', w / 2, h * 0.74);
    }

    _drawHighscoreTable(ctx, w, h) {
        if (this.highscores.length === 0) return;

        const startY = h * 0.50;
        ctx.font = '9px "Press Start 2P", monospace';
        ctx.fillStyle = CONFIG.COLORS.NEON_PURPLE;
        ctx.textAlign = 'center';
        ctx.fillText('HIGHSCORES', w / 2, startY);

        ctx.font = '7px "Press Start 2P", monospace';
        const shown = this.highscores.slice(0, 5);
        shown.forEach((entry, i) => {
            const y = startY + 20 + i * 16;
            const rank = `${i + 1}.`.padStart(3);
            const name = entry.name.padEnd(10).slice(0, 10);
            const score = String(entry.score).padStart(5);

            ctx.fillStyle = i === 0 ? CONFIG.COLORS.NEON_YELLOW :
                           i === 1 ? CONFIG.COLORS.TEXT_BRIGHT :
                           i === 2 ? CONFIG.COLORS.FOOD_ALT :
                           CONFIG.COLORS.TEXT_DIM;

            ctx.fillText(`${rank} ${name} ${score}`, w / 2, y);
        });
    }

    // --- Level-Up-Anzeige ---

    drawLevelUp(ctx, w, h, time, level) {
        ctx.fillStyle = CONFIG.COLORS.OVERLAY;
        ctx.fillRect(0, 0, w, h);

        ctx.textAlign = 'center';
        ctx.font = '28px "Press Start 2P", monospace';
        ctx.fillStyle = CONFIG.COLORS.NEON_BLUE;
        ctx.shadowColor = CONFIG.COLORS.NEON_BLUE;
        ctx.shadowBlur = 20;
        ctx.fillText(`LEVEL ${level}`, w / 2, h / 2 - 10);
        ctx.shadowBlur = 0;

        ctx.font = '9px "Press Start 2P", monospace';
        ctx.fillStyle = CONFIG.COLORS.TEXT_DIM;
        ctx.fillText('MACH DICH BEREIT!', w / 2, h / 2 + 25);
    }

    // --- Grid-Zeichnung ---

    drawGrid(ctx, w, h) {
        ctx.strokeStyle = CONFIG.COLORS.GRID;
        ctx.lineWidth = 0.5;
        const cs = CONFIG.CELL_SIZE;

        for (let x = 0; x <= CONFIG.GRID_WIDTH; x++) {
            ctx.strokeStyle = x % 5 === 0 ? CONFIG.COLORS.GRID_ACCENT : CONFIG.COLORS.GRID;
            ctx.beginPath();
            ctx.moveTo(x * cs, 0);
            ctx.lineTo(x * cs, h);
            ctx.stroke();
        }
        for (let y = 0; y <= CONFIG.GRID_HEIGHT; y++) {
            ctx.strokeStyle = y % 5 === 0 ? CONFIG.COLORS.GRID_ACCENT : CONFIG.COLORS.GRID;
            ctx.beginPath();
            ctx.moveTo(0, y * cs);
            ctx.lineTo(w, y * cs);
            ctx.stroke();
        }
    }

    // --- Hindernisse ---

    drawObstacles(ctx, obstacles, time) {
        const cs = CONFIG.CELL_SIZE;
        obstacles.forEach(([ox, oy]) => {
            // Leichtes Pulsieren
            const pulse = Math.sin(time * 0.001 + ox * 0.5 + oy * 0.3) * 0.05;

            ctx.fillStyle = CONFIG.COLORS.OBSTACLE;
            ctx.fillRect(ox * cs + 1, oy * cs + 1, cs - 2, cs - 2);

            // Rand
            ctx.strokeStyle = CONFIG.COLORS.OBSTACLE_BORDER;
            ctx.lineWidth = 1;
            ctx.strokeRect(ox * cs + 1.5, oy * cs + 1.5, cs - 3, cs - 3);

            // Inneres Muster
            ctx.fillStyle = `rgba(85, 102, 119, ${0.3 + pulse})`;
            const innerSize = cs * 0.3;
            ctx.fillRect(
                ox * cs + (cs - innerSize) / 2,
                oy * cs + (cs - innerSize) / 2,
                innerSize, innerSize
            );
        });
    }
}

const ui = new UI();
