/**
 * Snake Game - UI-System
 * Startbildschirm, HUD, Game-Over, Highscores, Namenseingabe
 */

const UI = {
    _titlePhase: 0,
    _selectedDifficulty: 2,
    _nameInput: '',
    _cursorBlink: 0,
    _startAnimPhase: 0,

    // --- Startbildschirm ---

    drawStartScreen(ctx, time) {
        const W = Config.CANVAS_WIDTH;
        const H = Config.CANVAS_HEIGHT;

        ctx.fillStyle = Config.COLORS.background;
        ctx.fillRect(0, 0, W, H);

        // Animierter Hintergrund - wandernde Punkte
        this._startAnimPhase += 0.002;
        ctx.fillStyle = 'rgba(0, 255, 65, 0.03)';
        for (let i = 0; i < 50; i++) {
            const px = (Math.sin(i * 1.3 + this._startAnimPhase) * 0.5 + 0.5) * W;
            const py = (Math.cos(i * 0.7 + this._startAnimPhase * 0.5) * 0.5 + 0.5) * H;
            ctx.fillRect(px, py, 3, 3);
        }

        // Titel mit Neon-Glow
        this._titlePhase += 0.03;
        const glowIntensity = 10 + Math.sin(this._titlePhase) * 5;

        ctx.save();
        ctx.shadowColor = Config.COLORS.neonGreen;
        ctx.shadowBlur = glowIntensity;
        ctx.font = '28px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = Config.COLORS.neonGreen;
        ctx.fillText('SNAKE', W / 2, 80);
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillStyle = Config.COLORS.textDim;
        ctx.shadowBlur = 3;
        ctx.fillText('v2.0 WEB EDITION', W / 2, 105);
        ctx.restore();

        // ASCII-Schlange Animation
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillStyle = Config.COLORS.neonGreen;
        const snakeArt = '~~~~~@>';
        const offset = Math.floor(time / 200) % 3;
        ctx.fillText(' '.repeat(offset) + snakeArt, W / 2, 135);

        // Schwierigkeitsauswahl
        ctx.font = '11px "Press Start 2P", monospace';
        ctx.fillStyle = Config.COLORS.textBright;
        ctx.fillText('SCHWIERIGKEIT', W / 2, 175);

        const difficulties = [
            { key: 1, label: 'LEICHT', color: '#00ff41' },
            { key: 2, label: 'MITTEL', color: '#ffcc00' },
            { key: 3, label: 'SCHWER', color: '#ff0040' },
        ];

        difficulties.forEach((d, i) => {
            const y = 205 + i * 32;
            const selected = this._selectedDifficulty === d.key;

            if (selected) {
                ctx.shadowColor = d.color;
                ctx.shadowBlur = 8;
                ctx.fillStyle = d.color;
                ctx.font = '11px "Press Start 2P", monospace';
                ctx.fillText('> ' + d.label + ' <', W / 2, y);
                ctx.shadowBlur = 0;
            } else {
                ctx.fillStyle = Config.COLORS.textDim;
                ctx.font = '10px "Press Start 2P", monospace';
                ctx.fillText(d.label, W / 2, y);
            }
        });

        // Steuerung
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillStyle = Config.COLORS.textDim;
        const controls = [
            'PFEILTASTEN / WASD - BEWEGEN',
            'P / ESC - PAUSE',
            'G - GITTER  |  V - WRAPAROUND',
            'C - CRT EFFEKT  |  M - TON',
        ];
        controls.forEach((line, i) => {
            ctx.fillText(line, W / 2, 310 + i * 18);
        });

        // Start-Hinweis (blinkend)
        if (Math.floor(time / 500) % 2 === 0) {
            ctx.font = '10px "Press Start 2P", monospace';
            ctx.shadowColor = Config.COLORS.neonGreen;
            ctx.shadowBlur = 6;
            ctx.fillStyle = Config.COLORS.neonGreen;
            ctx.fillText('ENTER / 1-3 ZUM STARTEN', W / 2, H - 50);
            ctx.shadowBlur = 0;
        }

        // Credits
        ctx.font = '7px "Press Start 2P", monospace';
        ctx.fillStyle = 'rgba(0, 255, 65, 0.3)';
        ctx.fillText('DESIGNED BY OLIVER', W / 2, H - 15);
    },

    // Menü-Navigation
    navigateMenu(direction) {
        if (direction === 'up') {
            this._selectedDifficulty = Math.max(1, this._selectedDifficulty - 1);
        } else if (direction === 'down') {
            this._selectedDifficulty = Math.min(3, this._selectedDifficulty + 1);
        }
    },

    getSelectedDifficulty() {
        return this._selectedDifficulty;
    },

    setSelectedDifficulty(d) {
        if (d >= 1 && d <= 3) this._selectedDifficulty = d;
    },

    // --- HUD (Head-Up Display) ---

    drawHUD(ctx, state) {
        const W = Config.CANVAS_WIDTH;
        const cs = Config.CELL_SIZE;

        // Semi-transparenter HUD-Hintergrund oben
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, W, 28);
        ctx.strokeStyle = 'rgba(0, 255, 65, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 28);
        ctx.lineTo(W, 28);
        ctx.stroke();

        ctx.font = '9px "Press Start 2P", monospace';
        ctx.textAlign = 'left';
        ctx.shadowColor = Config.COLORS.neonGreen;
        ctx.shadowBlur = 3;

        // Score
        ctx.fillStyle = Config.COLORS.neonYellow;
        ctx.fillText('PUNKTE:' + state.score, 8, 18);

        // Level
        ctx.fillStyle = Config.COLORS.neonGreen;
        ctx.textAlign = 'center';
        ctx.fillText('LV.' + (state.level + 1), W / 2, 18);

        // Speed + Length rechts
        ctx.textAlign = 'right';
        ctx.fillStyle = Config.COLORS.neonBlue;
        const speedPct = Math.min(100, Math.floor((state.fps / Config.MAX_FPS) * 100));
        ctx.fillText('SPD:' + speedPct + '%', W - 80, 18);
        ctx.fillStyle = Config.COLORS.neonPink;
        ctx.fillText('LEN:' + state.snakeLength, W - 8, 18);

        ctx.shadowBlur = 0;
        ctx.textAlign = 'left';

        // Wrap-Around Indikator
        if (state.wrapAround) {
            ctx.font = '7px "Press Start 2P", monospace';
            ctx.fillStyle = Config.COLORS.neonBlue;
            ctx.textAlign = 'center';
            ctx.fillText('WRAP', W / 2, 38);
            ctx.textAlign = 'left';
        }
    },

    // --- Pause-Overlay ---

    drawPause(ctx) {
        const W = Config.CANVAS_WIDTH;
        const H = Config.CANVAS_HEIGHT;

        ctx.fillStyle = Config.COLORS.overlay;
        ctx.fillRect(0, 0, W, H);

        ctx.save();
        ctx.textAlign = 'center';
        ctx.shadowColor = Config.COLORS.neonGreen;
        ctx.shadowBlur = 15;
        ctx.font = '24px "Press Start 2P", monospace';
        ctx.fillStyle = Config.COLORS.neonGreen;
        ctx.fillText('PAUSE', W / 2, H / 2 - 20);

        ctx.font = '9px "Press Start 2P", monospace';
        ctx.shadowBlur = 3;
        ctx.fillStyle = Config.COLORS.textDim;
        ctx.fillText('P / ESC ZUM FORTSETZEN', W / 2, H / 2 + 20);
        ctx.restore();
    },

    // --- Level-Up-Anzeige ---

    drawLevelUp(ctx, level) {
        const W = Config.CANVAS_WIDTH;
        const H = Config.CANVAS_HEIGHT;

        ctx.fillStyle = Config.COLORS.overlay;
        ctx.fillRect(0, 0, W, H);

        ctx.save();
        ctx.textAlign = 'center';
        ctx.shadowColor = Config.COLORS.neonYellow;
        ctx.shadowBlur = 15;
        ctx.font = '24px "Press Start 2P", monospace';
        ctx.fillStyle = Config.COLORS.neonYellow;
        ctx.fillText('LEVEL ' + level, W / 2, H / 2);
        ctx.restore();
    },

    // --- Game-Over / Victory Screen ---

    drawEndScreen(ctx, type, score, time) {
        const W = Config.CANVAS_WIDTH;
        const H = Config.CANVAS_HEIGHT;

        ctx.fillStyle = Config.COLORS.overlay;
        ctx.fillRect(0, 0, W, H);

        ctx.save();
        ctx.textAlign = 'center';

        const isVictory = type === 'victory';
        const title = isVictory ? 'SIEG!' : 'GAME OVER';
        const titleColor = isVictory ? Config.COLORS.neonGreen : Config.COLORS.neonPink;

        // Titel
        ctx.shadowColor = titleColor;
        ctx.shadowBlur = 15 + Math.sin(time * 0.003) * 5;
        ctx.font = '22px "Press Start 2P", monospace';
        ctx.fillStyle = titleColor;
        ctx.fillText(title, W / 2, H / 2 - 60);

        // Score
        ctx.shadowBlur = 5;
        ctx.font = '12px "Press Start 2P", monospace';
        ctx.fillStyle = Config.COLORS.neonYellow;
        ctx.fillText('PUNKTE: ' + score, W / 2, H / 2 - 20);

        ctx.restore();
    },

    // --- Namenseingabe ---

    resetNameInput() {
        this._nameInput = '';
        this._cursorBlink = 0;
    },

    getNameInput() {
        return this._nameInput || 'Anonym';
    },

    handleNameInput() {
        const char = Input.consumeNameChar();
        if (char && this._nameInput.length < Config.MAX_NAME_LENGTH) {
            this._nameInput += char;
        }
        if (Input.consumeAction('nameBackspace')) {
            this._nameInput = this._nameInput.slice(0, -1);
        }
        return Input.consumeAction('nameSubmit');
    },

    drawNameInput(ctx, time) {
        const W = Config.CANVAS_WIDTH;
        const H = Config.CANVAS_HEIGHT;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillStyle = Config.COLORS.neonGreen;
        ctx.fillText('NAME EINGEBEN:', W / 2, H / 2 + 20);

        // Eingabefeld
        const cursor = Math.floor(time / 400) % 2 === 0 ? '_' : ' ';
        ctx.font = '12px "Press Start 2P", monospace';
        ctx.shadowColor = Config.COLORS.neonGreen;
        ctx.shadowBlur = 5;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(this._nameInput + cursor, W / 2, H / 2 + 45);
        ctx.shadowBlur = 0;

        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillStyle = Config.COLORS.textDim;
        ctx.fillText('ENTER ZUM BESTAETIGEN', W / 2, H / 2 + 70);
        ctx.restore();
    },

    // --- Highscore-Anzeige ---

    drawHighscores(ctx, highscores, time) {
        const W = Config.CANVAS_WIDTH;
        const H = Config.CANVAS_HEIGHT;

        ctx.save();
        ctx.textAlign = 'center';

        ctx.shadowColor = Config.COLORS.neonYellow;
        ctx.shadowBlur = 8;
        ctx.font = '14px "Press Start 2P", monospace';
        ctx.fillStyle = Config.COLORS.neonYellow;
        ctx.fillText('BESTENLISTE', W / 2, H / 2 - 70);
        ctx.shadowBlur = 0;

        ctx.font = '8px "Press Start 2P", monospace';
        const top = highscores.slice(0, Config.MAX_HIGHSCORES);
        top.forEach((entry, i) => {
            const y = H / 2 - 40 + i * 18;
            const rank = (i + 1) + '.';
            const isTop3 = i < 3;

            ctx.fillStyle = isTop3 ? Config.COLORS.neonYellow : Config.COLORS.textDim;
            ctx.fillText(
                rank + ' ' + entry.name.padEnd(Config.MAX_NAME_LENGTH) + ' ' + String(entry.score).padStart(5),
                W / 2, y
            );
        });

        if (top.length === 0) {
            ctx.fillStyle = Config.COLORS.textDim;
            ctx.fillText('NOCH KEINE EINTRAEGE', W / 2, H / 2);
        }

        // Weiter-Hinweis
        if (Math.floor(time / 500) % 2 === 0) {
            ctx.font = '8px "Press Start 2P", monospace';
            ctx.fillStyle = Config.COLORS.neonGreen;
            ctx.fillText('R=NOCHMAL  Q=MENUE', W / 2, H - 30);
        }

        ctx.restore();
    },

    // --- Highscore-Management (localStorage) ---

    loadHighscores() {
        try {
            const data = localStorage.getItem(Config.STORAGE_KEY);
            if (data) return JSON.parse(data);
        } catch (e) {
            console.warn('Highscores konnten nicht geladen werden');
        }
        return [];
    },

    saveHighscores(highscores) {
        try {
            localStorage.setItem(Config.STORAGE_KEY, JSON.stringify(highscores));
        } catch (e) {
            console.warn('Highscores konnten nicht gespeichert werden');
        }
    },

    addHighscore(highscores, name, score) {
        highscores.push({ name, score });
        highscores.sort((a, b) => b.score - a.score);
        return highscores.slice(0, Config.MAX_HIGHSCORES);
    },

    isHighscore(highscores, score) {
        if (highscores.length < Config.MAX_HIGHSCORES) return true;
        return score > highscores[highscores.length - 1].score;
    }
};
