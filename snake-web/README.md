# Snake - Retro Arcade Edition (Web Version 2.0)

Ein klassisches Snake-Spiel im Browser — mit Retro-Ästhetik, Neon-Glow-Effekten und modernem Gameplay.

## Features

### Spielmechanik
- **3 Schwierigkeitsgrade:** Leicht, Mittel, Schwer (beeinflusst die Startgeschwindigkeit)
- **3 Level mit Hindernissen:** Fortschreitende Schwierigkeit mit programmatisch generierten Hindernismustern
- **Siegbedingung:** Erreiche 30 Punkte, um das Spiel zu gewinnen
- **Geschwindigkeitssteigerung:** Alle 5 Punkte wird das Spiel schneller
- **Wrap-Around-Modus:** Optional — die Schlange geht durch die Wand und erscheint auf der anderen Seite

### Steuerung
| Aktion | Tastatur | Mobil |
|--------|----------|-------|
| Bewegen | Pfeiltasten / WASD | Swipe / D-Pad |
| Pause | P / Escape | Tippen / D-Pad Mitte |
| Gitter ein/aus | G | — |
| Wrap-Around | V | — |
| CRT-Effekt | C | — |
| Ton ein/aus | M | — |

### Visuelle Effekte
- **Neon-Glow-Ästhetik:** Dunkler Hintergrund mit leuchtenden Neon-Farben
- **Gradient-Schlange:** Farbverlauf vom Kopf bis zum Schwanz
- **Pulsierendes Futter:** Animierter Glow-Effekt
- **Partikel-Effekte:** Beim Fressen und beim Tod
- **Screen-Shake:** Bildschirmerschütterung beim Game-Over
- **CRT-Scanlines:** Optionaler Retro-Monitor-Effekt mit Vignette
- **Animierter Startbildschirm:** Mit wandernden Neon-Punkten

### Audio
- **Synthesierte Sounds:** Alle Klänge werden per Web Audio API in Echtzeit erzeugt — keine externen Dateien
- **Sound-Effekte für:** Fressen, Tod, Sieg, Level-Up, Spielstart, Menü-Navigation

### Highscores
- **Persistente Bestenliste:** Top 10, gespeichert im localStorage des Browsers
- **Namenseingabe:** Nach jedem neuen Highscore

### HUD (Head-Up Display)
- Aktuelle Punktzahl
- Level-Anzeige
- Geschwindigkeitsindikator (in Prozent)
- Schlangenlänge

## Technische Details

- **Reines Vanilla JavaScript** — keine externen Abhängigkeiten
- **Canvas-basiertes Rendering** mit `requestAnimationFrame`
- **Fester Zeitschritt** für konsistente Spielgeschwindigkeit
- **Modulare Architektur:** 8 separate JS-Dateien für klare Trennung
- **Responsive Design:** Skaliert automatisch auf verschiedene Bildschirmgrößen
- **Touch-Unterstützung:** Swipe-Gesten und On-Screen D-Pad
- **O(1) Kollisionserkennung:** Set-basiert statt Listen-Iteration
- **Google Font:** "Press Start 2P" für authentischen Retro-Look

### Dateistruktur
```
snake-web/
├── index.html          Hauptseite
├── css/
│   └── style.css       Retro Dark Theme
├── js/
│   ├── config.js       Konstanten & Level-Daten
│   ├── audio.js        Web Audio API Synthese
│   ├── input.js        Tastatur, Touch, D-Pad
│   ├── snake.js        Schlangen-Entität
│   ├── food.js         Futter-System
│   ├── effects.js      Partikel, Shake, CRT
│   ├── ui.js           Menüs, HUD, Highscores
│   └── game.js         Haupt-Spiellogik
└── README.md           Diese Datei
```

## Starten

Einfach `index.html` in einem modernen Browser öffnen. Kein Server, kein Build-Schritt erforderlich.

```bash
# Oder mit einem lokalen Server:
python3 -m http.server 8080 --directory snake-web/
# Dann http://localhost:8080 aufrufen
```

## Credits

- **Design & Konzept:** Oliver
- **Web-Portierung & Erweiterungen:** AI Pair Programming
- **Font:** "Press Start 2P" von CodeMan38 (Google Fonts)
- **Inspiration:** Klassische Snake-Spiele auf C64, Amiga und Nokia-Handys
