/**
 * game.js - Haupt-Spiellogik, Game-Loop und Zustandsverwaltung
 * Snake Game Web Version
 */

class Game {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.state = 'menu'; // menu, playing, paused, levelup, gameover, victory, enterName
        this.snake = new Snake();
        this.food = new Food();
        this.score = 0;
        this.level = 0;
        this.difficulty = 2;
        this.speed = 100; // ms pro Tick
        this.wrapAround = false;
        this.showGrid = false;
        this.obstacles = [];

        // Timing
        this.lastTick = 0;
        this.tickAccumulator = 0;
        this.lastFrame = 0;
        this.levelUpTimer = 0;
        this.levelUpDuration = 1500;

        // Spielfeld-Referenzen
        this.canvasWidth = CONFIG.CANVAS_WIDTH;
        this.canvasHeight = CONFIG.CANVAS_HEIGHT;
    }

    /**
     * Initialisiert das Spiel: Canvas, Audio, Input.
     */
    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Canvas-Größe setzen
        this.canvas.width = this.canvasWidth;
        this.canvas.height = this.canvasHeight;

        // CRT-Effekt vorbereiten
        crtEffect.init(this.canvasWidth, this.canvasHeight);

        // Audio initialisieren (wird beim ersten Klick aktiviert)
        const initAudio = () => {
            audio.init();
            document.removeEventListener('click', initAudio);
            document.removeEventListener('keydown', initAudio);
            document.removeEventListener('touchstart', initAudio);
        };
        document.addEventListener('click', initAudio);
        document.addEventListener('keydown', initAudio);
        document.addEventListener('touchstart', initAudio);

        // Input-System binden
        input.bind();
        input.setupDpad();
        this._bindInputEvents();

        // Responsive Canvas
        this._handleResize();
        window.addEventListener('resize', () => this._handleResize());

        // Game Loop starten
        this.lastFrame = performance.now();
        requestAnimationFrame((t) => this._gameLoop(t));
    }

    /**
     * Verbindet Input-Events mit Spielaktionen.
     */
    _bindInputEvents() {
        input.on('pause', () => {
            if (this.state === 'playing') {
                this.state = 'paused';
                audio.playPause();
            } else if (this.state === 'paused') {
                this.state = 'playing';
                this.lastTick = performance.now();
                this.tickAccumulator = 0;
                audio.playPause();
            }
        });

        input.on('toggleGrid', () => {
            if (this.state === 'playing' || this.state === 'paused') {
                this.showGrid = !this.showGrid;
            }
        });

        input.on('toggleSound', () => {
            const enabled = audio.toggle();
            this._updateSoundIcon(enabled);
        });

        input.on('toggleCRT', () => {
            crtEffect.toggle();
        });

        input.on('selectDifficulty', (d) => {
            if (this.state === 'menu') {
                ui.selectedDifficulty = d;
                audio.playMenuSelect();
            }
        });

        input.on('confirm', () => {
            if (this.state === 'menu') {
                this._startGame();
            } else if (this.state === 'enterName') {
                this._submitHighscore();
            }
        });

        input.on('tap', () => {
            if (this.state === 'menu') {
                this._startGame();
            } else if (this.state === 'playing') {
                this.state = 'paused';
                audio.playPause();
            } else if (this.state === 'paused') {
                this.state = 'playing';
                this.lastTick = performance.now();
                this.tickAccumulator = 0;
                audio.playPause();
            } else if (this.state === 'gameover' || this.state === 'victory') {
                this._returnToMenu();
            } else if (this.state === 'enterName') {
                this._submitHighscore();
            }
        });

        input.on('restart', () => {
            if (this.state === 'gameover' || this.state === 'victory') {
                this._startGame();
            }
        });

        input.on('quit', () => {
            if (this.state === 'gameover' || this.state === 'victory') {
                this._returnToMenu();
            }
        });

        input.on('textInput', (ch) => {
            if (this.state === 'enterName' && ui.nameInput.length < CONFIG.MAX_NAME_LENGTH) {
                ui.nameInput += ch;
            }
        });

        input.on('backspace', () => {
            if (this.state === 'enterName') {
                ui.nameInput = ui.nameInput.slice(0, -1);
            }
        });

        // Wrap-Around-Toggle im Menü via W-Taste
        document.addEventListener('keydown', (e) => {
            if (this.state === 'menu' && e.code === 'KeyW') {
                // W-Taste im Menü für Wrap-Around
                ui.wrapAround = !ui.wrapAround;
                this.wrapAround = ui.wrapAround;
                audio.playMenuSelect();
            }
        });

        // Header-Buttons
        const btnSound = document.getElementById('btn-sound');
        if (btnSound) {
            btnSound.addEventListener('click', () => {
                audio.init();
                const enabled = audio.toggle();
                this._updateSoundIcon(enabled);
            });
        }

        const btnCrt = document.getElementById('btn-crt');
        if (btnCrt) {
            btnCrt.addEventListener('click', () => {
                crtEffect.toggle();
            });
        }

        const btnGrid = document.getElementById('btn-grid');
        if (btnGrid) {
            btnGrid.addEventListener('click', () => {
                this.showGrid = !this.showGrid;
            });
        }
    }

    _updateSoundIcon(enabled) {
        const icon = document.getElementById('sound-icon');
        if (icon) {
            icon.textContent = enabled ? '🔊' : '🔇';
        }
    }

    /**
     * Startet ein neues Spiel.
     */
    _startGame() {
        audio.init();
        audio.resume();
        audio.playFanfare();

        this.difficulty = ui.selectedDifficulty;
        this.wrapAround = ui.wrapAround;
        this.speed = CONFIG.DIFFICULTIES[this.difficulty].initialSpeed;
        this.score = 0;
        this.level = 0;
        this.obstacles = LEVELS[0];

        this.snake.reset();
        this.food.spawn(this.snake.body, this.snake.bodySet, this.obstacles);

        particles.clear();
        floatingTexts.clear();
        input.clearQueue();

        this.state = 'levelup';
        this.levelUpTimer = performance.now();
    }

    /**
     * Zurück zum Hauptmenü.
     */
    _returnToMenu() {
        this.state = 'menu';
        particles.clear();
        floatingTexts.clear();
    }

    /**
     * Highscore eintragen.
     */
    _submitHighscore() {
        const name = ui.nameInput.trim() || 'Anonym';
        ui.addHighscore(name, this.score, this.difficulty);
        ui.nameInput = '';

        // Wechsel zu Game Over / Victory-Anzeige mit Highscores
        this.state = this._wasVictory ? 'victory' : 'gameover';
    }

    /**
     * Haupt-Spielschleife mit requestAnimationFrame.
     */
    _gameLoop(timestamp) {
        const dt = Math.min(timestamp - this.lastFrame, 50); // Cap bei 50ms
        this.lastFrame = timestamp;

        this._update(dt, timestamp);
        this._draw(timestamp);

        requestAnimationFrame((t) => this._gameLoop(t));
    }

    /**
     * Update-Logik pro Frame.
     */
    _update(dt, time) {
        // Effekte immer aktualisieren
        particles.update(dt);
        floatingTexts.update(dt);
        screenShake.update(dt);

        if (this.state === 'levelup') {
            if (time - this.levelUpTimer > this.levelUpDuration) {
                this.state = 'playing';
                this.lastTick = time;
                this.tickAccumulator = 0;
            }
            return;
        }

        if (this.state !== 'playing') return;

        // Tick-basierte Spiellogik
        this.tickAccumulator += dt;
        while (this.tickAccumulator >= this.speed) {
            this.tickAccumulator -= this.speed;
            this._tick();
            if (this.state !== 'playing') break;
        }
    }

    /**
     * Ein Spielschritt (Tick).
     */
    _tick() {
        // Richtung aus Input-Warteschlange
        const dir = input.dequeueDirection();
        if (dir) {
            this.snake.setDirection(dir);
        }

        // Schlange bewegen
        const result = this.snake.move(this.obstacles, this.food.pos, this.wrapAround);

        if (result.collision) {
            this._onDeath();
            return;
        }

        if (result.ate) {
            const points = this.food.getPoints();
            this.score += points;
            audio.playEat();

            // Partikel am Futter-Ort
            const fx = this.food.pos.x * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2;
            const fy = this.food.pos.y * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2;
            const pColor = this.food.type === 'bonus' ? CONFIG.COLORS.FOOD_ALT : CONFIG.COLORS.FOOD;
            particles.emit(fx, fy, pColor, CONFIG.PARTICLE_COUNT);

            // Floating-Text
            const textStr = points > 1 ? `+${points}` : '+1';
            floatingTexts.add(fx, fy - 10, textStr, CONFIG.COLORS.NEON_YELLOW);

            // Level-Check
            if (this.score > 0 && this.score % CONFIG.LEVEL_SCORE_INTERVAL === 0) {
                const victoryScore = CONFIG.LEVEL_SCORE_INTERVAL * LEVELS.length;
                if (this.score >= victoryScore) {
                    this._onVictory();
                    return;
                }
                if (this.level < LEVELS.length - 1) {
                    this.level++;
                    this.obstacles = LEVELS[this.level];
                    this.snake.reset();
                    this.food.spawn(this.snake.body, this.snake.bodySet, this.obstacles);
                    audio.playLevelUp();

                    this.state = 'levelup';
                    this.levelUpTimer = performance.now();
                    return;
                }
            }

            // Geschwindigkeit erhöhen
            if (this.score % CONFIG.SPEED_INCREASE_INTERVAL === 0) {
                this.speed = Math.max(CONFIG.MIN_SPEED, this.speed - CONFIG.SPEED_INCREASE_AMOUNT);
            }

            // Neues Futter spawnen
            const spawned = this.food.spawn(this.snake.body, this.snake.bodySet, this.obstacles);
            if (!spawned) {
                // Spielfeld voll = Victory
                this._onVictory();
            }
        }
    }

    /**
     * Tod-Behandlung.
     */
    _onDeath() {
        audio.playGameOver();
        screenShake.trigger();

        // Todespartikel am Kopf
        const head = this.snake.headPos;
        const hx = head.x * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2;
        const hy = head.y * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2;
        particles.emit(hx, hy, CONFIG.COLORS.FOOD, 20);

        this._wasVictory = false;

        if (ui.isHighscore(this.score) && this.score > 0) {
            ui.nameInput = '';
            this.state = 'enterName';
        } else {
            this.state = 'gameover';
        }
    }

    /**
     * Victory-Behandlung.
     */
    _onVictory() {
        audio.playVictory();
        this._wasVictory = true;

        // Feuerwerk-Partikel
        for (let i = 0; i < 5; i++) {
            const x = Math.random() * this.canvasWidth;
            const y = Math.random() * this.canvasHeight * 0.5;
            particles.emit(x, y, CONFIG.COLORS.NEON_YELLOW, 15);
        }

        if (ui.isHighscore(this.score)) {
            ui.nameInput = '';
            this.state = 'enterName';
        } else {
            this.state = 'victory';
        }
    }

    /**
     * Zeichnet den aktuellen Frame.
     */
    _draw(time) {
        const ctx = this.ctx;
        const w = this.canvasWidth;
        const h = this.canvasHeight;

        // Shake-Offset anwenden
        ctx.save();
        if (screenShake.active) {
            ctx.translate(screenShake.offsetX, screenShake.offsetY);
        }

        if (this.state === 'menu') {
            ui.drawStartScreen(ctx, w, h, time);
            crtEffect.draw(ctx);
            ctx.restore();
            return;
        }

        // Hintergrund
        ctx.fillStyle = CONFIG.COLORS.BG;
        ctx.fillRect(0, 0, w, h);

        // Grid (optional)
        if (this.showGrid) {
            ui.drawGrid(ctx, w, h);
        }

        // Hindernisse
        if (this.obstacles.length > 0) {
            ui.drawObstacles(ctx, this.obstacles, time);
        }

        // Futter
        this.food.draw(ctx, CONFIG.CELL_SIZE, time);

        // Schlange
        this.snake.draw(ctx, CONFIG.CELL_SIZE, time);

        // Partikel & Floating-Texts
        particles.draw(ctx);
        floatingTexts.draw(ctx);

        // HUD
        ui.drawHUD(ctx, w, h, {
            score: this.score,
            level: this.level,
            difficulty: this.difficulty,
            snakeLength: this.snake.length,
            speed: this.speed,
            wrapAround: this.wrapAround,
        });

        // Overlay-States
        if (this.state === 'paused') {
            ui.drawPauseScreen(ctx, w, h, time);
        } else if (this.state === 'levelup') {
            ui.drawLevelUp(ctx, w, h, time, this.level + 1);
        } else if (this.state === 'gameover' || this.state === 'victory') {
            ui.drawEndScreen(ctx, w, h, time, {
                score: this.score,
                level: this.level,
                snakeLength: this.snake.length,
                victory: this.state === 'victory',
                enteringName: false,
            });
        } else if (this.state === 'enterName') {
            ui.drawEndScreen(ctx, w, h, time, {
                score: this.score,
                level: this.level,
                snakeLength: this.snake.length,
                victory: this._wasVictory,
                enteringName: true,
            });
        }

        // CRT-Overlay
        crtEffect.draw(ctx);

        ctx.restore();
    }

    /**
     * Passt die Canvas-Darstellungsgröße responsiv an.
     */
    _handleResize() {
        const container = document.getElementById('game-container');
        if (!container || !this.canvas) return;

        const maxWidth = Math.min(window.innerWidth - 20, 600);
        const maxHeight = window.innerHeight - 160;
        const scale = Math.min(maxWidth / this.canvasWidth, maxHeight / this.canvasHeight, 1.2);

        this.canvas.style.width = `${Math.floor(this.canvasWidth * scale)}px`;
        this.canvas.style.height = `${Math.floor(this.canvasHeight * scale)}px`;
    }
}

// Spiel starten wenn DOM bereit
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.init();
});
