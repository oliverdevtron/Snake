# Code Review: Snake_v0.3.py

**Projekt:** Snake Game v0.3
**Datei:** `Snake_v0.3.py` (501 Zeilen, Python/Pygame)
**Reviewer:** AI Code Review
**Datum:** 2026-03-21

---

## Zusammenfassung

Das Snake-Spiel ist funktional und gut strukturiert für ein Einzeldatei-Projekt. Die Spielmechanik funktioniert korrekt, die Steuerung ist intuitiv und das Level-System bietet eine gute Progression. Es gibt jedoch mehrere Bereiche, die verbessert werden sollten – von einem Tippfehler im Header bis hin zu architektonischen Überlegungen für zukünftige Erweiterungen.

**Gesamtbewertung:** ⭐⭐⭐ (3/5) – Solide Basis, aber Verbesserungspotenzial in Code-Qualität und Robustheit.

---

## 1. Kritische Probleme

### 1.1 Tippfehler im Header (Zeile 1)
```python
# Snkae Game v0.3   ← Falsch
# Snake Game v0.3   ← Korrekt
```
**Schweregrad:** Niedrig, aber unprofessionell. Sollte sofort korrigiert werden.

### 1.2 Doppelte Highscore-Dateien
Es existieren zwei Highscore-Dateien mit unterschiedlichen Formaten:
- `highscores.txt` – Komma-separiert (`Oliver,8`), wird vom Code verwendet
- `high_scores.txt` – Doppelpunkt-separiert (`Blau:6`), wird **nirgends referenziert**

**Problem:** Die Datei `high_scores.txt` ist verwaist und könnte Verwirrung stiften. Sie verwendet ein anderes Format (`:` statt `,`), was darauf hindeutet, dass sie aus einer älteren Version stammt oder manuell erstellt wurde.

**Empfehlung:** `high_scores.txt` entfernen oder dokumentieren, warum sie existiert. Die Daten ggf. in `highscores.txt` migrieren.

### 1.3 Potenzielle Endlosschleife in `generate_food()` (Zeile 186-191)
```python
def generate_food(snake_body, obstacles):
    while True:
        food_pos = (random.randint(0, GRID_WIDTH - 1), random.randint(0, GRID_HEIGHT - 1))
        if food_pos not in snake_body and food_pos not in obstacles:
            return food_pos
```
**Problem:** Wenn die Schlange das gesamte Spielfeld minus Hindernisse ausfüllt, läuft diese Schleife unendlich. Bei einem 20×20 Gitter (400 Felder) ist das theoretisch möglich.

**Empfehlung:** Freie Positionen berechnen und zufällig daraus wählen:
```python
def generate_food(snake_body, obstacles):
    occupied = set(snake_body) | set(obstacles)
    free = [(x, y) for x in range(GRID_WIDTH) for y in range(GRID_HEIGHT) if (x, y) not in occupied]
    if not free:
        return None  # Spielfeld voll → Victory!
    return random.choice(free)
```

---

## 2. Code-Qualität

### 2.1 Code-Duplizierung: `show_victory()` und `show_game_over()` (Zeilen 228-328)
Diese beiden Funktionen sind zu ~95% identisch. Die einzigen Unterschiede:
- Titel-Text: "Victory!" (grün) vs. "Game Over" (rot)
- Sound: `"victory"` vs. `"damage"`

**Empfehlung:** In eine gemeinsame Funktion refaktorisieren:
```python
def show_end_screen(screen, score, sounds, highscores, title, color, sound_key):
    if sound_key in sounds:
        sounds[sound_key].play()
    # ... gemeinsamer Code ...
```

### 2.2 Font-Objekte werden wiederholt erstellt
`pygame.font.Font(None, 36)` wird in mindestens 6 verschiedenen Funktionen neu erstellt:
- `get_player_name()` (Zeile 106)
- `display_highscores()` (Zeile 132)
- `draw_score()` (Zeile 195)
- `show_level_up()` (Zeile 202)
- `select_difficulty()` (Zeile 211)
- `show_victory()` / `show_game_over()` (Zeilen 234, 261, 286)

**Empfehlung:** Fonts einmal global oder als Modul-Konstanten erstellen:
```python
FONT_SMALL = None  # Initialisierung nach pygame.init()
FONT_LARGE = None

def init_fonts():
    global FONT_SMALL, FONT_LARGE
    FONT_SMALL = pygame.font.Font(None, 36)
    FONT_LARGE = pygame.font.Font(None, 72)
```

### 2.3 Magic Numbers
- **Zeile 376:** `victory_score = LEVEL_SCORE_INTERVAL * len(LEVELS)` ergibt 10 × 3 = 30, aber die Siegbedingung war zwischenzeitlich auf 15 geändert worden. Die Berechnung ist nicht sofort klar.
- **Zeile 239/290:** `(0, 0, 0, 180)` – Alpha-Wert sollte als Konstante definiert werden.
- **Zeile 166:** `head_rect.inflate(-4, -4)` – Magische Zahl für den Kopf-Innenrand.

**Empfehlung:** Benannte Konstanten verwenden:
```python
OVERLAY_ALPHA = 180
SNAKE_HEAD_PADDING = 4
```

### 2.4 `snake_body` Mitgliedschaftstest mit O(n)
```python
if new_head in snake_body[1:]:  # O(n) bei jeder Frame-Iteration
```
**Problem:** Bei einer sehr langen Schlange wird dies ineffizient. `snake_body[1:]` erstellt außerdem bei jedem Frame eine Kopie der Liste.

**Empfehlung:** Ein `set` für Kollisionserkennung parallel pflegen:
```python
snake_set = set(snake_body)
# Bei Bewegung: snake_set.add(new_head), snake_set.discard(old_tail)
if new_head in snake_set:  # O(1)
```

---

## 3. Fehlende Funktionalität

### 3.1 Keine Pause-Funktion
Es gibt keine Möglichkeit, das Spiel zu pausieren. Bei einem Spiel, das Geschicklichkeit erfordert, ist dies eine grundlegende Funktion.

**Empfehlung:** `P`-Taste oder `Escape` für Pause implementieren.

### 3.2 Steuerung nicht dokumentiert
WASD- und Pfeiltasten werden unterstützt (Zeilen 392-399), aber nirgends im Spiel angezeigt. Neue Spieler wissen nicht, dass WASD funktioniert.

**Empfehlung:** Steuerungshinweise im Startbildschirm oder als Overlay anzeigen.

### 3.3 `draw_grid()` ist auskommentiert (Zeile 465)
```python
# draw_grid(screen) # Uncomment if you want grid lines
```
**Empfehlung:** Als Toggle-Option implementieren (z.B. `G`-Taste).

---

## 4. Robustheit und Fehlerbehandlung

### 4.1 Sound-Laden ohne sauberen Fallback (Zeilen 62-78)
```python
try:
    sounds["eat"] = pygame.mixer.Sound("eat.wav")
    sounds["victory"] = pygame.mixer.Sound("victory.wav")
    sounds["damage"] = pygame.mixer.Sound("damage.wav")
    sounds["fanfare"] = pygame.mixer.Sound("fanfare.wav")
    return sounds
except pygame.error as e:
    print(f"Fehler beim Laden der Sounds: {e}")
    return {}  # Alle Sounds gehen verloren, auch bereits geladene
```
**Problem:** Wenn z.B. `damage.wav` fehlt, aber `eat.wav` und `victory.wav` erfolgreich geladen wurden, werden trotzdem ALLE Sounds verworfen (leeres Dict).

**Empfehlung:** Jeden Sound einzeln laden:
```python
for name, file in [("eat", "eat.wav"), ("victory", "victory.wav"), ...]:
    try:
        sounds[name] = pygame.mixer.Sound(file)
    except pygame.error:
        print(f"Warnung: Sound '{file}' konnte nicht geladen werden")
```

### 4.2 Keine Validierung der Hindernisplatzierung gegen Schlangen-Startposition
**Zeilen 53-58 und 360-366:** Die Hindernismuster werden programmatisch generiert, aber nicht gegen die Startposition der Schlange `(GRID_WIDTH // 2, GRID_HEIGHT // 2)` validiert.

**Problem:** In Level 2 enthält das Hindernis `(GRID_WIDTH // 2, y)` für `y in range(4, GRID_HEIGHT - 4)`. Die Schlange startet bei `(10, 10)`, was genau auf der Hindernislinie liegt. Beim Level-Übergang wird die Schlange auf diese Position zurückgesetzt, was sofort zum Game Over führen könnte.

**Empfehlung:** Startposition der Schlange aus Hindernislisten ausschließen oder Spawn-Position dynamisch anpassen.

### 4.3 Score-Reset bei Level-Up ist inkonsistent (Zeile 442-450)
Beim Level-Up wird die Schlange zurückgesetzt, aber der Score bleibt erhalten. Das ist spielerisch sinnvoll, aber die Schlangenlänge (die normalerweise den Score repräsentiert) wird auf 3 zurückgesetzt. Dies erzeugt eine Diskrepanz zwischen angezeigtem Score und visueller Schlangenlänge.

---

## 5. Architektur-Review

### 5.1 Monolithische Dateistruktur
Alle 501 Zeilen befinden sich in einer einzigen Datei. Für ein Projekt dieser Größe ist das noch akzeptabel, aber bei weiterer Entwicklung sollte der Code aufgeteilt werden:
- `config.py` – Konstanten und Einstellungen
- `game.py` – Hauptspiellogik
- `ui.py` – Bildschirmanzeigen und Menüs
- `entities.py` – Schlange, Futter, Hindernisse
- `audio.py` – Soundverwaltung

### 5.2 Prozedurale statt Objektorientierte Struktur
Das Spiel verwendet ausschließlich Funktionen und globale Konstanten. Eine Klassen-basierte Architektur würde den Code besser organisieren:
```python
class Snake:
    def __init__(self, start_pos):
        self.body = [start_pos, ...]
        self.direction = RIGHT

    def move(self): ...
    def draw(self, screen): ...
    def check_collision(self): ...
```

### 5.3 Spielzustand durch lokale Variablen
Der Spielzustand wird durch lokale Variablen in `main()` verwaltet (Zeilen 355-381). Das funktioniert, ist aber fragil und macht Erweiterungen schwierig. Eine `GameState`-Klasse oder ein State-Dictionary wäre robuster.

---

## 6. Stilkonsistenz

### 6.1 Gemischte Sprachen in Kommentaren
Die Kommentare wechseln zwischen Deutsch und Englisch:
- Deutsch: `"Prüfen, ob Mixer Modul verfügbar ist"` (Zeile 65), `"Spiele Victory-Sound ab"` (Zeile 231)
- Englisch: `"Generates a new food position"` (Zeile 187), `"Draws the snake on the screen"` (Zeile 161)

**Empfehlung:** Eine Sprache wählen und konsistent verwenden. Da das Projekt von einem deutschsprachigen Entwickler stammt, entweder alles auf Deutsch oder alles auf Englisch.

---

## 7. Positives

- ✅ **Saubere Konstanten-Definition** am Anfang der Datei
- ✅ **WASD + Pfeiltasten** werden beide unterstützt
- ✅ **180-Grad-Wendung** wird korrekt verhindert
- ✅ **Highscore-System** mit Datei-Persistenz
- ✅ **Level-System** mit progressiven Hindernissen
- ✅ **Schwierigkeitsgrade** mit unterschiedlichen Geschwindigkeiten
- ✅ **Sound-Unterstützung** mit WAV-Dateien
- ✅ **Graceful Quit** über `pygame.QUIT` Events

---

## 8. Zusammenfassung der Empfehlungen

| Priorität | Problem | Empfehlung |
|-----------|---------|------------|
| 🔴 Hoch | Endlosschleife in `generate_food()` | Freie Positionen vorab berechnen |
| 🔴 Hoch | Hindernis-Overlap mit Startposition | Validierung hinzufügen |
| 🟡 Mittel | Code-Duplizierung Victory/Game Over | Gemeinsame Funktion extrahieren |
| 🟡 Mittel | Font-Neuerstellen | Einmalig erstellen und wiederverwenden |
| 🟡 Mittel | Sound-Laden fehlerhaft | Einzeln laden mit individuellem Fallback |
| 🟡 Mittel | Keine Pause-Funktion | P/Escape für Pause implementieren |
| 🟢 Niedrig | Tippfehler im Header | "Snkae" → "Snake" korrigieren |
| 🟢 Niedrig | Verwaiste `high_scores.txt` | Datei entfernen oder migrieren |
| 🟢 Niedrig | Magic Numbers | Benannte Konstanten verwenden |
| 🟢 Niedrig | Gemischte Kommentarsprache | Konsistente Sprache wählen |
| 🟢 Niedrig | O(n) Kollisionserkennung | Set für schnellere Prüfung verwenden |
| 🟢 Niedrig | Steuerung nicht dokumentiert | In-Game Hinweise anzeigen |

---

*Dieser Code-Review wurde als Teil einer umfassenden Analyse erstellt, um die Grundlage für eine Web-Version des Spiels zu schaffen.*
