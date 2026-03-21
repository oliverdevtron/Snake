# Snake - Retro Arcade Web Edition 🐍

Eine moderne Web-Umsetzung des klassischen Snake-Spiels mit Retro-Neon-Ästhetik, inspiriert von der C64/Amiga-Ära.

## Features

### Spielmechanik
- **3 Schwierigkeitsgrade**: Leicht, Mittel, Schwer – mit unterschiedlichen Geschwindigkeiten
- **Level-System**: 3 Level mit progressiven Hindernismustern
- **Siegbedingung**: Erreiche die maximale Punktzahl, um das Spiel zu gewinnen
- **Bonus-Futter**: Seltene Bonus-Nahrung mit dreifacher Punktzahl (★)
- **Wrap-Around-Modus**: Optionaler Modus, bei dem die Schlange durch Wände hindurchgeht
- **Geschwindigkeitssteigerung**: Das Spiel wird mit steigendem Score schneller

### Visuelle Effekte
- **Neon-Glow-Design**: Leuchtende Farben auf dunklem Hintergrund
- **Schlangen-Gradient**: Farbverlauf vom Kopf bis zum Schwanz
- **Schlangen-Augen**: Dynamische Augen, die der Bewegungsrichtung folgen
- **Pulsierendes Futter**: Animiertes Futter mit Glow-Effekt
- **Partikeleffekte**: Beim Fressen von Nahrung
- **Floating-Text**: Punkteanzeige beim Fressen (+1, +3)
- **Bildschirm-Shake**: Bei Game Over
- **CRT-Scanline-Overlay**: Umschaltbarer Retro-Monitor-Effekt
- **Gitter-Anzeige**: Optionales Spielfeld-Raster

### Audio
- **Synthesierte Sounds**: Alle Sounds werden per Web Audio API in Echtzeit erzeugt
- **Ess-Sound**: Aufsteigender Chirp beim Fressen
- **Level-Up-Fanfare**: Aufsteigende Arpeggio-Noten
- **Game-Over-Sound**: Absteigender, dramatischer Ton
- **Victory-Fanfare**: Triumphale Melodie
- **Menü-Sounds**: Blip-Töne bei Navigation

### Technisch
- **Reines Vanilla JS**: Keine externen Abhängigkeiten
- **Canvas-basiertes Rendering**: Flüssige 60fps mit requestAnimationFrame
- **Responsive Design**: Funktioniert auf Desktop und Mobilgeräten
- **Touch-Unterstützung**: Swipe-Gesten und On-Screen D-Pad
- **LocalStorage Highscores**: Persistente Bestenliste
- **Modularer Code**: Saubere Aufteilung in 8 JS-Module

## Steuerung

### Tastatur
| Taste | Aktion |
|-------|--------|
| ↑ ↓ ← → / W A S D | Schlange steuern |
| P / Escape | Pause ein/aus |
| G | Gitter ein/aus |
| M | Sound ein/aus |
| C | CRT-Effekt ein/aus |
| R | Neustart (nach Game Over) |
| Q | Zurück zum Menü (nach Game Over) |
| 1 / 2 / 3 | Schwierigkeit wählen (im Menü) |
| W | Wrap-Around ein/aus (im Menü) |
| Enter / Leertaste | Bestätigen / Spiel starten |

### Touch / Mobil
- **Swipe**: In die gewünschte Richtung wischen
- **D-Pad**: Richtungstasten auf dem Bildschirm
- **Tap**: Pause / Bestätigen

## Dateistruktur

```
snake-web/
├── index.html          Hauptseite
├── css/
│   └── style.css       Retro-Neon-Theme
├── js/
│   ├── config.js       Konstanten, Schwierigkeitsgrade, Level
│   ├── audio.js        Web Audio API Sound-Synthese
│   ├── input.js        Tastatur, Touch, Swipe-Steuerung
│   ├── snake.js        Schlangen-Entity und Rendering
│   ├── food.js         Futter-Spawning und Animation
│   ├── effects.js      Partikel, Shake, CRT-Overlay
│   ├── ui.js           Menüs, HUD, Highscores
│   └── game.js         Game-Loop und Zustandsverwaltung
└── README.md           Diese Datei
```

## Starten

Einfach `index.html` in einem modernen Webbrowser öffnen. Es wird kein Webserver benötigt.

```bash
# Oder mit einem lokalen Server:
python3 -m http.server 8000
# Dann im Browser: http://localhost:8000
```

## Technische Details

- **Game Loop**: Tick-basierte Spiellogik mit variabler Frame-Rate-Zeichnung
- **Kollisionserkennung**: O(1) dank Set-basierter Positionsprüfung
- **Input-Buffering**: Richtungswarteschlange verhindert verlorene Eingaben bei schnellem Spielen
- **Futter-Spawning**: Berechnet alle freien Felder und wählt zufällig (keine Endlosschleife möglich)
- **Level-Generierung**: Programmatisch generierte Hindernismuster mit Spawn-Schutzzone

## Credits

- **Design & Konzept**: Oliver
- **Web-Umsetzung**: AI Pair Programming (Claude)
- **Font**: [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) von CodeMan38
- **Basierend auf**: Snake_v0.3.py (Python/Pygame Original)
