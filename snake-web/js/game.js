/**
 * Snake Game - Haupt-Spiellogik
 * Game-Loop, Zustandsverwaltung, Rendering-Pipeline
 */

const Game = {
    canvas: null,
    ctx: null,

    // Spielzustände
    STATE: {
        MENU: 'menu',
        PLAYING: 'playing',
        PAUSED: 'paused',
        LEVEL_UP: 'levelUp',
        GAME_OVER: 'gameOver',
        VICTORY: 'victory',
        NAME_INPUT: 'nameInput',
        HIGHSCORES: 'highscores',
    },

    state: 'menu',
    prevState: null,   // Für Name-Input nach Game-Over/Victory

    // Spielparameter
    score: 0,
    level: 0,
    currentFps: 8,
    difficulty: 2,
    highscores: [],

    // Optionen
    showGrid: false,
    wrapAround: false,
    showCRT: false,

    // Timing
    _lastTime: 0,
    _accumulator: 0,
    _levelUpTimer: 0,
    _gameTime: 0,
    _animFrameId: null,

    // --- Initialisierung ---

    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = Config.CANVAS_WIDTH;
        this.canvas.height = Config.CANVAS_HEIGHT;

        // Pixel-Art Rendering (keine Glättung)
        this.ctx.imageSmoothingEnabled = false;

        Audio.init();
        Input.init();
        this.highscores = UI.loadHighscores();

        // Menü-Input Handler
        Input.onMenuKey = (key) => this._handleMenuKey(key);

        // Responsive Canvas
        this._resizeCanvas();
        window.addEventListener('resize', () => this._resizeCanvas());

        // Start
        this.state = this.STATE.MENU;
        this._lastTime = performance.now();
        this._gameLoop(this._lastTime);
    },

    _resizeCanvas() {
        const container = document.getElementById('game-container');
        if (!container) return;
        const maxW = container.clientWidth - 20;
        const maxH = window.innerHeight * 0.7;
        const scale = Math.min(maxW / Config.CANVAS_WIDTH, maxH / Config.CANVAS_HEIGHT, 2);
        this.canvas.style.width = Math.floor(Config.CANVAS_WIDTH * scale) + 'px';
        this.canvas.style.height = Math.floor(Config.CANVAS_HEIGHT * scale) + 'px';
    },

    // --- Haupt-Game-Loop ---

    _gameLoop(timestamp) {
        const dt = Math.min(timestamp - this._lastTime, 100); // Cap bei 100ms
        this._lastTime = timestamp;
        this._gameTime += dt;

        this._update(dt);
        this._draw();

        this._animFrameId = requestAnimationFrame((t) => this._gameLoop(t));
    },

    // --- Update ---

    _update(dt) {
        // Globale Aktionen
        if (Input.consumeAction('soundToggle')) {
            Audio.toggle();
        }

        switch (this.state) {
            case this.STATE.MENU:
                this._updateMenu(dt);
                break;
            case this.STATE.PLAYING:
                this._updatePlaying(dt);
                break;
            case this.STATE.PAUSED:
                this._updatePaused(dt);
                break;
            case this.STATE.LEVEL_UP:
                this._updateLevelUp(dt);
                break;
            case this.STATE.GAME_OVER:
            case this.STATE.VICTORY:
                this._updateEndScreen(dt);
                break;
            case this.STATE.NAME_INPUT:
                this._updateNameInput(dt);
                break;
            case this.STATE.HIGHSCORES:
                this._updateHighscores(dt);
                break;
        }

        Effects.update(dt);
        Food.update(dt);
    },

    _updateMenu(dt) {
        // Eingabe wird über _handleMenuKey verarbeitet
        if (Input.consumeAction('crtToggle')) this.showCRT = !this.showCRT;
        if (Input.consumeAction('gridToggle')) this.showGrid = !this.showGrid;
        if (Input.consumeAction('wrapToggle')) this.wrapAround = !this.wrapAround;
    },

    _handleMenuKey(key) {
        if (this.state !== this.STATE.MENU) return;

        if (typeof key === 'number' && key >= 1 && key <= 3) {
            UI.setSelectedDifficulty(key);
            this._startGame();
            return;
        }

        if (key === 'arrowup' || key === 'w') {
            UI.navigateMenu('up');
            Audio.playNav();
        } else if (key === 'arrowdown' || key === 's') {
            UI.navigateMenu('down');
            Audio.playNav();
        } else if (key === 'enter' || key === ' ') {
            this._startGame();
        }
    },

    _startGame() {
        Audio.resume();
        Audio.playStart();

        this.difficulty = UI.getSelectedDifficulty();
        this.currentFps = Config.DIFFICULTIES[this.difficulty].initialFps;
        this.score = 0;
        this.level = 0;

        const startX = Math.floor(Config.GRID_WIDTH / 2);
        const startY = Math.floor(Config.GRID_HEIGHT / 2);
        Snake.init(startX, startY, Config.INITIAL_SNAKE_LENGTH);
        Input.setCurrentDirection('right');

        const obstacles = Levels.getObstacles(this.level);
        Food.spawn(Snake.body, obstacles);
        Effects.clear();

        this._accumulator = 0;
        this.state = this.STATE.LEVEL_UP;
        this._levelUpTimer = 1200;
    },

    _updatePlaying(dt) {
        // Pause-Check
        if (Input.consumeAction('pause')) {
            this.state = this.STATE.PAUSED;
            Audio.playPause();
            return;
        }

        // Optionen-Toggles
        if (Input.consumeAction('gridToggle')) this.showGrid = !this.showGrid;
        if (Input.consumeAction('wrapToggle')) this.wrapAround = !this.wrapAround;
        if (Input.consumeAction('crtToggle')) this.showCRT = !this.showCRT;

        // Feste Zeitschritt-Logik (Grid-basiert)
        const stepInterval = 1000 / this.currentFps;
        this._accumulator += dt;

        if (this._accumulator >= stepInterval) {
            this._accumulator -= stepInterval;
            this._gameStep();
        }
    },

    _gameStep() {
        // Richtung updaten
        const newDir = Input.consumeDirection();
        if (newDir) {
            Snake.direction = newDir;
            Input.setCurrentDirection(newDir);
        }

        // Nächste Kopfposition berechnen
        const nextHead = Snake.getNextHead(this.wrapAround);

        // Wandkollision (nur ohne Wrap-Around)
        if (!this.wrapAround) {
            if (nextHead.x < 0 || nextHead.x >= Config.GRID_WIDTH ||
                nextHead.y < 0 || nextHead.y >= Config.GRID_HEIGHT) {
                this._triggerGameOver();
                return;
            }
        }

        // Selbstkollision
        if (Snake.collidesWithBody(nextHead)) {
            this._triggerGameOver();
            return;
        }

        // Hinderniskollision
        const obstacles = Levels.getObstacles(this.level);
        const obstacleHit = obstacles.some(o => o.x === nextHead.x && o.y === nextHead.y);
        if (obstacleHit) {
            this._triggerGameOver();
            return;
        }

        // Futter-Kollision
        const ate = Food.pos && nextHead.x === Food.pos.x && nextHead.y === Food.pos.y;
        Snake.move(nextHead, ate);

        if (ate) {
            this.score++;
            Audio.playEat();
            Effects.spawnEatParticles(Food.pos.x, Food.pos.y);

            // Victory-Check
            const victoryScore = Config.LEVEL_SCORE_INTERVAL * Levels.getCount();
            if (this.score >= victoryScore) {
                this._triggerVictory();
                return;
            }

            // Level-Up-Check
            if (this.score % Config.LEVEL_SCORE_INTERVAL === 0 && this.level < Levels.getCount() - 1) {
                this.level++;
                Audio.playLevelUp();

                // Schlange zurücksetzen für neues Level
                const startX = Math.floor(Config.GRID_WIDTH / 2);
                const startY = Math.floor(Config.GRID_HEIGHT / 2);
                Snake.init(startX, startY, Config.INITIAL_SNAKE_LENGTH);
                Snake.direction = 'right';
                Input.setCurrentDirection('right');

                const newObstacles = Levels.getObstacles(this.level);
                Food.spawn(Snake.body, newObstacles);

                this.state = this.STATE.LEVEL_UP;
                this._levelUpTimer = 1500;
                return;
            }

            // Geschwindigkeit erhöhen
            if (this.score % Config.FPS_INCREASE_INTERVAL === 0) {
                this.currentFps = Math.min(this.currentFps + Config.FPS_INCREASE_AMOUNT, Config.MAX_FPS);
            }

            Food.spawn(Snake.body, obstacles);
        }
    },

    _triggerGameOver() {
        const head = Snake.getHead();
        Effects.spawnDeathParticles(head.x, head.y);
        Effects.triggerShake();
        Audio.playDeath();
        this.prevState = this.STATE.GAME_OVER;

        if (UI.isHighscore(this.highscores, this.score)) {
            UI.resetNameInput();
            this.state = this.STATE.NAME_INPUT;
        } else {
            this.state = this.STATE.GAME_OVER;
        }
    },

    _triggerVictory() {
        Audio.playVictory();
        this.prevState = this.STATE.VICTORY;

        if (UI.isHighscore(this.highscores, this.score)) {
            UI.resetNameInput();
            this.state = this.STATE.NAME_INPUT;
        } else {
            this.state = this.STATE.VICTORY;
        }
    },

    _updatePaused(dt) {
        if (Input.consumeAction('pause')) {
            this.state = this.STATE.PLAYING;
            this._accumulator = 0;
            Audio.playPause();
        }
    },

    _updateLevelUp(dt) {
        this._levelUpTimer -= dt;
        if (this._levelUpTimer <= 0) {
            this.state = this.STATE.PLAYING;
            this._accumulator = 0;
        }
    },

    _updateEndScreen(dt) {
        if (Input.consumeAction('restart')) {
            this._startGame();
        }
        if (Input.consumeAction('quit') || Input.consumeAction('select')) {
            this.state = this.STATE.MENU;
        }
    },

    _updateNameInput(dt) {
        const submitted = UI.handleNameInput();
        if (submitted) {
            const name = UI.getNameInput();
            this.highscores = UI.addHighscore(this.highscores, name, this.score);
            UI.saveHighscores(this.highscores);
            this.state = this.STATE.HIGHSCORES;
        }
    },

    _updateHighscores(dt) {
        if (Input.consumeAction('restart')) {
            this._startGame();
        }
        if (Input.consumeAction('quit') || Input.consumeAction('select')) {
            this.state = this.STATE.MENU;
        }
    },

    // --- Render ---

    _draw() {
        const ctx = this.ctx;
        const W = Config.CANVAS_WIDTH;
        const H = Config.CANVAS_HEIGHT;
        const cs = Config.CELL_SIZE;

        ctx.save();

        // Screen-Shake anwenden
        if (Effects.shakeOffset.x !== 0 || Effects.shakeOffset.y !== 0) {
            ctx.translate(Effects.shakeOffset.x, Effects.shakeOffset.y);
        }

        switch (this.state) {
            case this.STATE.MENU:
                UI.drawStartScreen(ctx, this._gameTime);
                break;

            case this.STATE.PLAYING:
            case this.STATE.PAUSED:
            case this.STATE.LEVEL_UP:
                this._drawGameField(ctx, cs);
                if (this.state === this.STATE.PAUSED) {
                    UI.drawPause(ctx);
                }
                if (this.state === this.STATE.LEVEL_UP) {
                    UI.drawLevelUp(ctx, this.level + 1);
                }
                break;

            case this.STATE.GAME_OVER:
            case this.STATE.VICTORY:
                this._drawGameField(ctx, cs);
                UI.drawEndScreen(ctx, this.state === this.STATE.VICTORY ? 'victory' : 'gameover', this.score, this._gameTime);
                if (Math.floor(this._gameTime / 500) % 2 === 0) {
                    ctx.textAlign = 'center';
                    ctx.font = '8px "Press Start 2P", monospace';
                    ctx.fillStyle = Config.COLORS.neonGreen;
                    ctx.fillText('R=NOCHMAL  Q=MENUE', W / 2, H - 30);
                    ctx.textAlign = 'left';
                }
                break;

            case this.STATE.NAME_INPUT:
                this._drawGameField(ctx, cs);
                UI.drawEndScreen(ctx,
                    this.prevState === this.STATE.VICTORY ? 'victory' : 'gameover',
                    this.score, this._gameTime);
                UI.drawNameInput(ctx, this._gameTime);
                break;

            case this.STATE.HIGHSCORES:
                ctx.fillStyle = Config.COLORS.background;
                ctx.fillRect(0, 0, W, H);
                UI.drawHighscores(ctx, this.highscores, this._gameTime);
                break;
        }

        // CRT-Scanline-Overlay
        if (this.showCRT) {
            Effects.drawScanlines(ctx, W, H);
        }

        // Partikel (immer über allem)
        Effects.drawParticles(ctx);

        ctx.restore();
    },

    _drawGameField(ctx, cs) {
        const W = Config.CANVAS_WIDTH;
        const H = Config.CANVAS_HEIGHT;

        // Hintergrund
        ctx.fillStyle = Config.COLORS.background;
        ctx.fillRect(0, 0, W, H);

        // Grid
        if (this.showGrid) {
            Effects.drawGrid(ctx, cs);
        }

        // Hindernisse
        const obstacles = Levels.getObstacles(this.level);
        Effects.drawObstacles(ctx, obstacles, cs, this._gameTime);

        // Futter
        Food.draw(ctx, cs, this._gameTime);

        // Schlange
        Snake.draw(ctx, cs, this._gameTime);

        // HUD
        UI.drawHUD(ctx, {
            score: this.score,
            level: this.level,
            fps: this.currentFps,
            snakeLength: Snake.length(),
            wrapAround: this.wrapAround,
        });

        // Wrap-Around Indikator (Rahmen)
        if (this.wrapAround) {
            ctx.strokeStyle = 'rgba(0, 204, 255, 0.15)';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.strokeRect(1, 1, W - 2, H - 2);
            ctx.setLineDash([]);
        }
    }
};

// Spiel starten, wenn DOM bereit ist
document.addEventListener('DOMContentLoaded', () => {
    Game.init();
});
