/**
 * config.js - Spielkonstanten, Schwierigkeitsgrade und Level-Daten
 * Snake Game Web Version
 */

const CONFIG = {
    // Spielfeld
    GRID_WIDTH: 20,
    GRID_HEIGHT: 20,
    CELL_SIZE: 25,

    // Berechnet
    get CANVAS_WIDTH() { return this.GRID_WIDTH * this.CELL_SIZE; },
    get CANVAS_HEIGHT() { return this.GRID_HEIGHT * this.CELL_SIZE; },

    // Farben (Neon/Retro-Thema)
    COLORS: {
        BG: '#0a0a0a',
        GRID: 'rgba(0, 255, 65, 0.06)',
        GRID_ACCENT: 'rgba(0, 255, 65, 0.12)',
        SNAKE_HEAD: '#00ff41',
        SNAKE_BODY_START: '#00cc33',
        SNAKE_BODY_END: '#004d1a',
        SNAKE_GLOW: 'rgba(0, 255, 65, 0.4)',
        FOOD: '#ff0040',
        FOOD_GLOW: 'rgba(255, 0, 64, 0.6)',
        FOOD_ALT: '#ff6600',
        FOOD_ALT_GLOW: 'rgba(255, 102, 0, 0.6)',
        OBSTACLE: '#334455',
        OBSTACLE_BORDER: '#556677',
        TEXT: '#00ff41',
        TEXT_DIM: '#008822',
        TEXT_BRIGHT: '#ffffff',
        OVERLAY: 'rgba(0, 0, 0, 0.85)',
        NEON_PINK: '#ff0080',
        NEON_BLUE: '#00d4ff',
        NEON_YELLOW: '#ffff00',
        NEON_PURPLE: '#cc00ff',
        SCANLINE: 'rgba(0, 0, 0, 0.08)',
    },

    // Schwierigkeitsgrade
    DIFFICULTIES: {
        1: { name: 'Leicht', initialSpeed: 150, color: '#00ff41' },
        2: { name: 'Mittel', initialSpeed: 100, color: '#ffff00' },
        3: { name: 'Schwer', initialSpeed: 65, color: '#ff0040' },
    },

    // Geschwindigkeit
    SPEED_INCREASE_INTERVAL: 5,
    SPEED_INCREASE_AMOUNT: 5,
    MIN_SPEED: 30,

    // Level
    LEVEL_SCORE_INTERVAL: 10,

    // Highscores
    MAX_HIGHSCORES: 10,
    MAX_NAME_LENGTH: 10,
    STORAGE_KEY: 'snakeHighscores',

    // Partikel
    PARTICLE_COUNT: 12,
    PARTICLE_LIFETIME: 600,
    PARTICLE_SPEED: 4,

    // Bildschirm-Shake
    SHAKE_DURATION: 400,
    SHAKE_INTENSITY: 8,

    // Animation
    FOOD_PULSE_SPEED: 0.004,
    TITLE_WAVE_SPEED: 0.003,
};

/**
 * Level-Definitionen: Jedes Level enthält ein Array von Hindernis-Koordinaten.
 * Generiert programmatisch basierend auf dem Spielfeld.
 */
function generateLevels() {
    const W = CONFIG.GRID_WIDTH;
    const H = CONFIG.GRID_HEIGHT;
    const cx = Math.floor(W / 2);
    const cy = Math.floor(H / 2);

    // Startposition der Schlange (zum Ausschluss)
    const spawnZone = new Set();
    for (let dx = -3; dx <= 3; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            spawnZone.add(`${cx + dx},${cy + dy}`);
        }
    }

    function filterSpawn(obstacles) {
        return obstacles.filter(([x, y]) => !spawnZone.has(`${x},${y}`));
    }

    return [
        // Level 1: Keine Hindernisse
        [],

        // Level 2: Vertikale Wand in der Mitte
        filterSpawn(
            Array.from({ length: H - 8 }, (_, i) => [cx, i + 4])
        ),

        // Level 3: Kreuzförmige Hindernisse
        filterSpawn([
            ...Array.from({ length: W - 8 }, (_, i) => [i + 4, cy]),
            ...Array.from({ length: H - 8 }, (_, i) => [cx, i + 4]),
        ]),
    ];
}

const LEVELS = generateLevels();
