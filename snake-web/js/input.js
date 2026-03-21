/**
 * input.js - Eingabeverwaltung: Tastatur, Touch und Swipe-Gesten
 */

class InputManager {
    constructor() {
        this.directionQueue = [];
        this.maxQueueSize = 3;
        this.keys = {};
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchStartTime = 0;
        this.minSwipeDistance = 30;
        this.callbacks = {};
        this._bound = false;
    }

    /**
     * Bindet alle Eingabe-Listener.
     */
    bind() {
        if (this._bound) return;
        this._bound = true;

        this._onKeyDown = this._handleKeyDown.bind(this);
        this._onKeyUp = this._handleKeyUp.bind(this);
        this._onTouchStart = this._handleTouchStart.bind(this);
        this._onTouchEnd = this._handleTouchEnd.bind(this);

        document.addEventListener('keydown', this._onKeyDown);
        document.addEventListener('keyup', this._onKeyUp);

        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.addEventListener('touchstart', this._onTouchStart, { passive: false });
            canvas.addEventListener('touchend', this._onTouchEnd, { passive: false });
        }
    }

    /**
     * Registriert einen Callback für ein bestimmtes Ereignis.
     */
    on(event, callback) {
        if (!this.callbacks[event]) this.callbacks[event] = [];
        this.callbacks[event].push(callback);
    }

    emit(event, data) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(cb => cb(data));
        }
    }

    _handleKeyDown(e) {
        this.keys[e.code] = true;

        // Richtungseingaben (Pfeiltasten + WASD)
        const dirMap = {
            'ArrowUp': 'UP', 'KeyW': 'UP',
            'ArrowDown': 'DOWN', 'KeyS': 'DOWN',
            'ArrowLeft': 'LEFT', 'KeyA': 'LEFT',
            'ArrowRight': 'RIGHT', 'KeyD': 'RIGHT',
        };

        if (dirMap[e.code]) {
            e.preventDefault();
            this.queueDirection(dirMap[e.code]);
            return;
        }

        // Sondertasten
        switch (e.code) {
            case 'KeyP':
            case 'Escape':
                e.preventDefault();
                this.emit('pause');
                break;
            case 'KeyG':
                e.preventDefault();
                this.emit('toggleGrid');
                break;
            case 'KeyM':
                e.preventDefault();
                this.emit('toggleSound');
                break;
            case 'KeyC':
                e.preventDefault();
                this.emit('toggleCRT');
                break;
            case 'KeyR':
                e.preventDefault();
                this.emit('restart');
                break;
            case 'KeyQ':
                e.preventDefault();
                this.emit('quit');
                break;
            case 'Digit1':
            case 'Numpad1':
                e.preventDefault();
                this.emit('selectDifficulty', 1);
                break;
            case 'Digit2':
            case 'Numpad2':
                e.preventDefault();
                this.emit('selectDifficulty', 2);
                break;
            case 'Digit3':
            case 'Numpad3':
                e.preventDefault();
                this.emit('selectDifficulty', 3);
                break;
            case 'Enter':
            case 'Space':
                e.preventDefault();
                this.emit('confirm');
                break;
            case 'Backspace':
                e.preventDefault();
                this.emit('backspace');
                break;
        }

        // Text-Eingabe für Highscore-Name
        if (e.key.length === 1 && e.key.match(/[a-zA-Z0-9 _-]/)) {
            this.emit('textInput', e.key);
        }
    }

    _handleKeyUp(e) {
        this.keys[e.code] = false;
    }

    _handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.touchStartTime = Date.now();
    }

    _handleTouchEnd(e) {
        e.preventDefault();
        if (!e.changedTouches.length) return;

        const touch = e.changedTouches[0];
        const dx = touch.clientX - this.touchStartX;
        const dy = touch.clientY - this.touchStartY;
        const elapsed = Date.now() - this.touchStartTime;

        // Tap-Erkennung (kurz und wenig Bewegung)
        if (elapsed < 200 && Math.abs(dx) < 10 && Math.abs(dy) < 10) {
            this.emit('tap');
            return;
        }

        // Swipe-Erkennung
        if (Math.abs(dx) < this.minSwipeDistance && Math.abs(dy) < this.minSwipeDistance) return;

        if (Math.abs(dx) > Math.abs(dy)) {
            this.queueDirection(dx > 0 ? 'RIGHT' : 'LEFT');
        } else {
            this.queueDirection(dy > 0 ? 'DOWN' : 'UP');
        }
    }

    /**
     * Fügt eine Richtung zur Warteschlange hinzu.
     */
    queueDirection(dir) {
        if (this.directionQueue.length < this.maxQueueSize) {
            this.directionQueue.push(dir);
        }
    }

    /**
     * Holt die nächste Richtung aus der Warteschlange.
     */
    dequeueDirection() {
        return this.directionQueue.shift() || null;
    }

    /**
     * Leert die Richtungswarteschlange.
     */
    clearQueue() {
        this.directionQueue = [];
    }

    /**
     * D-Pad-Button-Handler für Mobile
     */
    setupDpad() {
        const dirs = ['up', 'down', 'left', 'right'];
        dirs.forEach(dir => {
            const btn = document.getElementById(`dpad-${dir}`);
            if (btn) {
                btn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    this.queueDirection(dir.toUpperCase());
                }, { passive: false });
                btn.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    this.queueDirection(dir.toUpperCase());
                });
            }
        });
    }
}

const input = new InputManager();
