/**
 * Snake Game - Konfiguration & Konstanten
 * Alle Spieleinstellungen, Level-Daten und Schwierigkeitsgrade
 */

const Config = {
    // Grid-Einstellungen
    GRID_WIDTH: 20,
    GRID_HEIGHT: 20,
    CELL_SIZE: 25,

    // Berechnet beim Init
    CANVAS_WIDTH: 0,
    CANVAS_HEIGHT: 0,

    // Farben (CSS-Strings für Canvas)
    COLORS: {
        background: '#0a0a0a',
        grid: 'rgba(0, 255, 65, 0.06)',
        snakeHead: '#00ff41',
        snakeBody: '#00cc33',
        snakeTail: '#006622',
        snakeOutline: '#003311',
        food: '#ff0040',
        foodGlow: '#ff3366',
        obstacle: '#444466',
        obstacleHighlight: '#555577',
        text: '#00ff41',
        textDim: '#00aa2a',
        textBright: '#66ff88',
        neonGreen: '#00ff41',
        neonPink: '#ff0066',
        neonBlue: '#00ccff',
        neonYellow: '#ffcc00',
        overlay: 'rgba(0, 0, 0, 0.85)',
        hud: '#00ff41',
        hudDim: 'rgba(0, 255, 65, 0.5)',
    },

    // Schwierigkeitsgrade
    DIFFICULTIES: {
        1: { name: 'Leicht', initialFps: 6, color: '#00ff41' },
        2: { name: 'Mittel', initialFps: 8, color: '#ffcc00' },
        3: { name: 'Schwer', initialFps: 12, color: '#ff0040' },
    },

    // Geschwindigkeitseinstellungen
    FPS_INCREASE_INTERVAL: 5,
    FPS_INCREASE_AMOUNT: 1,
    MAX_FPS: 25,

    // Level-Score-Intervall
    LEVEL_SCORE_INTERVAL: 10,

    // Highscore-Einstellungen
    MAX_HIGHSCORES: 10,
    MAX_NAME_LENGTH: 10,
    STORAGE_KEY: 'snakeGameHighscores',

    // Schlangen-Startgröße
    INITIAL_SNAKE_LENGTH: 3,

    // Partikel-Einstellungen
    PARTICLE_COUNT: 12,
    PARTICLE_LIFETIME: 800,
    PARTICLE_SPEED: 3,

    // Screen-Shake-Einstellungen
    SHAKE_INTENSITY: 8,
    SHAKE_DURATION: 500,

    // Animations-Einstellungen
    FOOD_PULSE_SPEED: 0.004,
    FOOD_PULSE_AMOUNT: 0.3,

    // Touch-Einstellungen
    SWIPE_THRESHOLD: 30,

    // CRT-Effekt
    SCANLINE_OPACITY: 0.08,

    init() {
        this.CANVAS_WIDTH = this.GRID_WIDTH * this.CELL_SIZE;
        this.CANVAS_HEIGHT = this.GRID_HEIGHT * this.CELL_SIZE;
    }
};

// Level-Daten: Array von Hindernis-Arrays (grid-Koordinaten)
const Levels = {
    data: [],

    generate() {
        const W = Config.GRID_WIDTH;
        const H = Config.GRID_HEIGHT;

        // Level 1: Keine Hindernisse
        const level1 = [];

        // Level 2: Vertikale Wand in der Mitte (mit Lücke für Spawn)
        const level2 = [];
        for (let y = 2; y < H - 2; y++) {
            // Lücke um die Mitte für Spawn-Sicherheit
            if (y >= H / 2 - 2 && y <= H / 2 + 2) continue;
            level2.push({ x: Math.floor(W / 2), y });
        }

        // Level 3: Kreuz-Pattern (mit Lücke in der Mitte)
        const level3 = [];
        for (let x = 3; x < W - 3; x++) {
            if (x >= W / 2 - 2 && x <= W / 2 + 2) continue;
            level3.push({ x, y: Math.floor(H / 2) });
        }
        for (let y = 3; y < H - 3; y++) {
            if (y >= H / 2 - 2 && y <= H / 2 + 2) continue;
            level3.push({ x: Math.floor(W / 2), y });
        }

        this.data = [level1, level2, level3];
    },

    getObstacles(level) {
        if (level < 0 || level >= this.data.length) return [];
        return this.data[level];
    },

    getCount() {
        return this.data.length;
    }
};

Config.init();
Levels.generate();
