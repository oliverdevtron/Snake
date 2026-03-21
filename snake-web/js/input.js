/**
 * Snake Game - Eingabe-System
 * Tastatur, Touch/Swipe und On-Screen D-Pad Steuerung
 */

const Input = {
    // Aktuelle Richtungsänderung (wird pro Frame abgerufen)
    pendingDirection: null,

    // Aktionstasten
    actions: {
        pause: false,
        gridToggle: false,
        restart: false,
        quit: false,
        select: false,
        wrapToggle: false,
        crtToggle: false,
        soundToggle: false,
        nameBackspace: false,
        nameSubmit: false,
    },
    nameChar: null, // Letztes eingegebenes Zeichen für Namenseingabe

    // Touch-State
    _touchStartX: 0,
    _touchStartY: 0,
    _touchStartTime: 0,

    // Aktueller Richtungszustand (für die Verhindung von 180°-Wenden)
    _currentDirection: null,

    // Callback für Menü-Aktionen
    onMenuKey: null,

    init() {
        document.addEventListener('keydown', (e) => this._handleKeyDown(e));
        this._initTouch();
        this._initDpad();
    },

    setCurrentDirection(dir) {
        this._currentDirection = dir;
    },

    consumeDirection() {
        const dir = this.pendingDirection;
        this.pendingDirection = null;
        return dir;
    },

    consumeAction(name) {
        const val = this.actions[name];
        this.actions[name] = false;
        return val;
    },

    consumeNameChar() {
        const c = this.nameChar;
        this.nameChar = null;
        return c;
    },

    resetAll() {
        this.pendingDirection = null;
        for (const key in this.actions) this.actions[key] = false;
        this.nameChar = null;
    },

    _handleKeyDown(e) {
        const key = e.key.toLowerCase();

        // Richtungseingaben
        if ((key === 'arrowup' || key === 'w') && this._currentDirection !== 'down') {
            this.pendingDirection = 'up';
            e.preventDefault();
        } else if ((key === 'arrowdown' || key === 's') && this._currentDirection !== 'up') {
            this.pendingDirection = 'down';
            e.preventDefault();
        } else if ((key === 'arrowleft' || key === 'a') && this._currentDirection !== 'right') {
            this.pendingDirection = 'left';
            e.preventDefault();
        } else if ((key === 'arrowright' || key === 'd') && this._currentDirection !== 'left') {
            this.pendingDirection = 'right';
            e.preventDefault();
        }

        // Aktionstasten
        if (key === 'p' || key === 'escape') this.actions.pause = true;
        if (key === 'g') this.actions.gridToggle = true;
        if (key === 'r') this.actions.restart = true;
        if (key === 'q') this.actions.quit = true;
        if (key === 'enter') this.actions.select = true;
        if (key === 'v') this.actions.wrapToggle = true;
        if (key === 'c') this.actions.crtToggle = true;
        if (key === 'm') this.actions.soundToggle = true;

        // Namenseingabe
        if (key === 'backspace') {
            this.actions.nameBackspace = true;
            e.preventDefault();
        }
        if (key === 'enter') this.actions.nameSubmit = true;
        if (e.key.length === 1 && e.key.match(/[a-zA-Z0-9 _\-]/)) {
            this.nameChar = e.key;
        }

        // Schwierigkeitsauswahl (1-3)
        if (key === '1' || key === '2' || key === '3') {
            if (this.onMenuKey) this.onMenuKey(parseInt(key));
        }

        // Menü-Callback
        if (this.onMenuKey && (key === 'arrowup' || key === 'arrowdown' || key === 'enter' ||
            key === 'w' || key === 's' || key === ' ')) {
            this.onMenuKey(key);
        }
    },

    _initTouch() {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return;

        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this._touchStartX = touch.clientX;
            this._touchStartY = touch.clientY;
            this._touchStartTime = Date.now();
        }, { passive: false });

        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (!e.changedTouches.length) return;
            const touch = e.changedTouches[0];
            const dx = touch.clientX - this._touchStartX;
            const dy = touch.clientY - this._touchStartY;
            const elapsed = Date.now() - this._touchStartTime;

            // Tap (kurzer Berührung ohne Bewegung) = Pause
            if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && elapsed < 300) {
                this.actions.pause = true;
                return;
            }

            // Swipe-Erkennung
            if (Math.abs(dx) < Config.SWIPE_THRESHOLD && Math.abs(dy) < Config.SWIPE_THRESHOLD) return;

            if (Math.abs(dx) > Math.abs(dy)) {
                // Horizontaler Swipe
                if (dx > 0 && this._currentDirection !== 'left') {
                    this.pendingDirection = 'right';
                } else if (dx < 0 && this._currentDirection !== 'right') {
                    this.pendingDirection = 'left';
                }
            } else {
                // Vertikaler Swipe
                if (dy > 0 && this._currentDirection !== 'up') {
                    this.pendingDirection = 'down';
                } else if (dy < 0 && this._currentDirection !== 'down') {
                    this.pendingDirection = 'up';
                }
            }
        }, { passive: false });
    },

    _initDpad() {
        const dirs = ['up', 'down', 'left', 'right'];
        dirs.forEach(dir => {
            const btn = document.getElementById('dpad-' + dir);
            if (!btn) return;
            const handler = (e) => {
                e.preventDefault();
                const opposites = { up: 'down', down: 'up', left: 'right', right: 'left' };
                if (this._currentDirection !== opposites[dir]) {
                    this.pendingDirection = dir;
                }
            };
            btn.addEventListener('touchstart', handler, { passive: false });
            btn.addEventListener('mousedown', handler);
        });

        // Pause-Button
        const pauseBtn = document.getElementById('dpad-center');
        if (pauseBtn) {
            const handler = (e) => {
                e.preventDefault();
                this.actions.pause = true;
            };
            pauseBtn.addEventListener('touchstart', handler, { passive: false });
            pauseBtn.addEventListener('mousedown', handler);
        }
    }
};
