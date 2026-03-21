/**
 * audio.js - Web Audio API Sound-Synthese
 * Erzeugt retro-artige Spielsounds ohne externe Dateien.
 */

class AudioManager {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.masterGain = null;
        this.initialized = false;
    }

    /**
     * Initialisiert den AudioContext (muss durch Benutzerinteraktion ausgelöst werden).
     */
    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.3;
            this.masterGain.connect(this.ctx.destination);
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API nicht verfügbar:', e);
            this.enabled = false;
        }
    }

    /**
     * Stellt sicher, dass der AudioContext aktiv ist.
     */
    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    /**
     * Ess-Sound: Kurzer aufsteigender Chirp
     */
    playEat() {
        if (!this.enabled || !this.ctx) return;
        this.resume();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.exponentialRampToValueAtTime(900, t + 0.08);
        osc.frequency.exponentialRampToValueAtTime(600, t + 0.12);

        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.15);
    }

    /**
     * Level-Up-Sound: Aufsteigende Arpeggio-Noten
     */
    playLevelUp() {
        if (!this.enabled || !this.ctx) return;
        this.resume();
        const t = this.ctx.currentTime;
        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6

        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, t + i * 0.1);
            gain.gain.setValueAtTime(0.2, t + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.1 + 0.15);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(t + i * 0.1);
            osc.stop(t + i * 0.1 + 0.15);
        });
    }

    /**
     * Game-Over-Sound: Absteigender, verzerrter Ton
     */
    playGameOver() {
        if (!this.enabled || !this.ctx) return;
        this.resume();
        const t = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.6);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.7);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.7);

        // Zweiter Ton für Tiefe
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(200, t + 0.1);
        osc2.frequency.exponentialRampToValueAtTime(40, t + 0.8);
        gain2.gain.setValueAtTime(0.15, t + 0.1);
        gain2.gain.linearRampToValueAtTime(0, t + 0.8);
        osc2.connect(gain2);
        gain2.connect(this.masterGain);
        osc2.start(t + 0.1);
        osc2.stop(t + 0.8);
    }

    /**
     * Victory-Sound: Triumphale Fanfare
     */
    playVictory() {
        if (!this.enabled || !this.ctx) return;
        this.resume();
        const t = this.ctx.currentTime;
        const melody = [
            [523, 0, 0.15],    // C5
            [659, 0.15, 0.15], // E5
            [784, 0.30, 0.15], // G5
            [1047, 0.45, 0.3], // C6 (lang)
        ];

        melody.forEach(([freq, offset, dur]) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, t + offset);
            gain.gain.setValueAtTime(0.2, t + offset);
            gain.gain.setValueAtTime(0.2, t + offset + dur - 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, t + offset + dur);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(t + offset);
            osc.stop(t + offset + dur);
        });
    }

    /**
     * Fanfare beim Spielstart
     */
    playFanfare() {
        if (!this.enabled || !this.ctx) return;
        this.resume();
        const t = this.ctx.currentTime;
        const notes = [262, 330, 392, 523]; // C4, E4, G4, C5

        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, t + i * 0.12);
            gain.gain.setValueAtTime(0.15, t + i * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.12 + 0.2);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(t + i * 0.12);
            osc.stop(t + i * 0.12 + 0.2);
        });
    }

    /**
     * Menü-Navigations-Blip
     */
    playMenuSelect() {
        if (!this.enabled || !this.ctx) return;
        this.resume();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.setValueAtTime(1000, t + 0.03);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.08);
    }

    /**
     * Pause-Sound
     */
    playPause() {
        if (!this.enabled || !this.ctx) return;
        this.resume();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.setValueAtTime(400, t + 0.05);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.1);
    }
}

const audio = new AudioManager();
