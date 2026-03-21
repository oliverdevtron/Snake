# Code Review: Snake_v0.3.py

**Projekt:** Snake Game v0.3
**Datei:** `Snake_v0.3.py` (501 Zeilen, Python/Pygame)
**Reviewer:** AI Code Review
**Datum:** 2026-03-21

---

## Zusammenfassung

Das Snake-Spiel ist eine solide Implementierung mit funktionierender Spielmechanik, Schwierigkeitsgraden, Level-System und Highscore-Verwaltung. Es gibt jedoch mehrere Bereiche, die verbessert werden sollten — von kleinen Tippfehlern über Code-Duplikation bis hin zu potenziellen Laufzeitproblemen.

**Bewertung:** ⭐⭐⭐ (3/5) — Funktional, aber mit deutlichem Verbesserungspotenzial.

---

## 1. Kritische Probleme

### 1.1 Tippfehler im Header (Zeile 1)
```python
# Snkae Game v0.3
```
**Problem:** "Snkae" statt "Snake". Ein kleiner Fehler, aber er fällt sofort auf und wirkt unprofessionell.
**Empfehlung:** Korrektur zu `# Snake Game v0.3`.

### 1.2 Doppelte Highscore-Dateien
Es existieren zwei Highscore-Dateien mit unterschiedlichen Formaten:
- `highscores.txt` — komma-getrennt (`Oliver,8`), wird vom Code verwendet
- `high_scores.txt` — doppelpunkt-getrennt (`Blau:6`), wird **nirgends** im Code referenziert

**Problem:** `high_scores.txt` ist eine verwaiste Datei. Sie erzeugt Verwirrung und könnte dazu führen, dass jemand die falsche Datei bearbeitet.
**Empfehlung:** Die Datei `high_scores.txt` entweder löschen oder in das korrekte Format migrieren und vereinheitlichen.

### 1.3 Potenzielle Endlosschleife in `generate_food()` (Zeile 186–191)
```python
def generate_food(snake_body, obstacles):
    while True:
        food_pos = (random.randint(0, GRID_WIDTH - 1), random.randint(0, GRID_HEIGHT - 1))
        if food_pos not in snake_body and food_pos not in obstacles:
            return food_pos
```
**Problem:** Wenn die Schlange zusammen mit den Hindernissen das gesamte Spielfeld ausfüllt, läuft diese Schleife endlos. Bei einem 20×20-Feld (400 Zellen) und vielen Hindernissen in Level 3 ist das zwar unwahrscheinlich, aber nicht unmöglich.
**Empfehlung:** Freie Felder vorberechnen und daraus zufällig wählen:
```python
def generate_food(snake_body, obstacles):
    occupied = set(snake_body) | set(obstacles)
    free_cells = [(x, y) for x in range(GRID_WIDTH) for y in range(GRID_HEIGHT) if (x, y) not in occupied]
    if not free_cells:
        return None  # Kein Platz mehr — Spielende oder Victory auslösen
    return random.choice(free_cells)
```

### 1.4 Keine Validierung der Hindernisplatzierung gegen Startposition (Zeile 53–58, 360–366)
```python
LEVELS = [
    [],
    [(GRID_WIDTH // 2, y) for y in range(4, GRID_HEIGHT - 4)],
    ...
]
# Startposition:
start_x = GRID_WIDTH // 2  # = 10
start_y = GRID_HEIGHT // 2  # = 10
```
**Problem:** In Level 2 wird eine vertikale Wand bei `x=10` von `y=4` bis `y=15` erzeugt. Die Schlange startet bei `(10, 10)` — **direkt auf einem Hindernis**. Beim Level-Up wird die Schlange zwar zurückgesetzt, aber die Startposition liegt trotzdem auf der Wand.
**Empfehlung:** Entweder die Startposition dynamisch von Hindernissen fernhalten oder die Level-Daten so anpassen, dass der Spawn-Bereich frei bleibt.

---

## 2. Code-Qualität

### 2.1 Massive Code-Duplikation: `show_victory()` und `show_game_over()` (Zeile 228–328)
Diese beiden Funktionen sind zu **~95% identisch**. Der einzige Unterschied ist:
- Der angezeigte Text ("Victory!" vs. "Game Over")
- Die Textfarbe (Grün vs. Rot)
- Der abgespielte Sound ("victory" vs. "damage")

**Empfehlung:** Eine gemeinsame Funktion extrahieren:
```python
def show_end_screen(screen, score, sounds, highscores, title, color, sound_key):
    if sound_key in sounds:
        sounds[sound_key].play()
    # ... gemeinsamer Code ...
```

### 2.2 Wiederholte Font-Erzeugung (Zeilen 106, 132, 195, 202, 211, 234, 235, 261, 286, 287)
`pygame.font.Font(None, 36)` wird an mindestens **10 verschiedenen Stellen** neu erstellt. Jeder Aufruf erzeugt ein neues Font-Objekt.

**Empfehlung:** Fonts einmal global oder als Klassenvariable erstellen:
```python
FONT_SMALL = None
FONT_LARGE = None

def init_fonts():
    global FONT_SMALL, FONT_LARGE
    FONT_SMALL = pygame.font.Font(None, 36)
    FONT_LARGE = pygame.font.Font(None, 72)
```

### 2.3 `snake_body`-Mitgliedschaftstest mit Liste — O(n)-Komplexität (Zeile 418)
```python
if new_head in snake_body[1:] or new_head in obstacles:
```
**Problem:** `in` auf einer Liste hat O(n)-Komplexität. `snake_body[1:]` erzeugt zusätzlich bei jedem Frame eine Kopie der Liste. Bei einer langen Schlange wird das merkbar langsam.
**Empfehlung:** Parallel ein `set` der Körperpositionen führen:
```python
snake_set = set(snake_body)
# Bei Kollisionsprüfung:
if new_head in snake_set or new_head in obstacle_set:
```

### 2.4 Magic Numbers
- `victory_score = LEVEL_SCORE_INTERVAL * len(LEVELS)` ergibt `10 * 3 = 30`. Diese Berechnung ist nicht sofort verständlich.
- Die Zahl `180` in der Overlay-Transparenz (`overlay.fill((0, 0, 0, 180))`) erscheint ohne Erklärung.
- `1500` in `pygame.time.wait(1500)` — warum genau 1,5 Sekunden?

**Empfehlung:** Benannte Konstanten verwenden:
```python
VICTORY_SCORE = LEVEL_SCORE_INTERVAL * len(LEVELS)
OVERLAY_ALPHA = 180
LEVEL_UP_DISPLAY_MS = 1500
```

---

## 3. Fehlende Funktionalität

### 3.1 Keine Pause-Funktion
Es gibt keine Möglichkeit, das Spiel zu pausieren. Das ist ein grundlegendes Feature, das jedes Spiel haben sollte.
**Empfehlung:** `P` oder `Escape` als Pause-Taste implementieren.

### 3.2 Steuerungsinformationen fehlen im Spiel
WASD + Pfeiltasten werden unterstützt, aber nirgendwo im Spiel dokumentiert. Neue Spieler wissen nicht, dass WASD funktioniert.
**Empfehlung:** Steuerungshinweise auf dem Startbildschirm oder in einem Hilfe-Overlay anzeigen.

### 3.3 Grid-Anzeige ist auskommentiert (Zeile 465)
```python
# draw_grid(screen) # Uncomment if you want grid lines
```
**Problem:** Die Funktion `draw_grid()` existiert (Zeile 153), ist aber permanent deaktiviert. Ein Toggle wäre sinnvoller.
**Empfehlung:** Mit einer Taste (z.B. `G`) ein-/ausschaltbar machen.

---

## 4. Robustheit & Fehlerbehandlung

### 4.1 Sound-Laden nicht robust (Zeile 62–78)
```python
try:
    sounds["eat"] = pygame.mixer.Sound("eat.wav")
    sounds["victory"] = pygame.mixer.Sound("victory.wav")
    sounds["damage"] = pygame.mixer.Sound("damage.wav")
    sounds["fanfare"] = pygame.mixer.Sound("fanfare.wav")
    return sounds
except pygame.error as e:
    print(f"Fehler beim Laden der Sounds: {e}")
    return {}
```
**Problem:** Wenn z.B. `eat.wav` und `victory.wav` erfolgreich geladen werden, aber `damage.wav` fehlt, wird `sounds = {}` zurückgegeben — auch die bereits erfolgreich geladenen Sounds gehen verloren.
**Empfehlung:** Jeden Sound einzeln in einem try/except laden:
```python
for name, file in [("eat", "eat.wav"), ("victory", "victory.wav"), ...]:
    try:
        sounds[name] = pygame.mixer.Sound(file)
    except pygame.error:
        print(f"Sound '{file}' nicht gefunden — wird übersprungen")
```

### 4.2 Score-Reset bei Level-Up ist inkonsistent (Zeile 442–450)
Beim Level-Up wird die Schlange zurückgesetzt, aber der Score bleibt erhalten. Die Schlange verliert ihre Länge, aber nicht die Punkte. Das ist verwirrend für Spieler.
**Empfehlung:** Entweder klar dokumentieren, dass der Score erhalten bleibt, oder die Schlangenlänge proportional zum Score beibehalten.

---

## 5. Architektur

### 5.1 Monolithische Dateistruktur
Alle 501 Zeilen befinden sich in einer einzigen Datei. Für ein Projekt dieser Größe ist das noch akzeptabel, aber die Wartbarkeit leidet darunter.

**Mögliche Aufteilung:**
- `config.py` — Konstanten und Einstellungen
- `entities.py` — Schlange, Futter, Hindernisse
- `ui.py` — Menüs, Highscores, Bildschirme
- `sounds.py` — Sound-Verwaltung
- `game.py` — Hauptspiellogik

### 5.2 Prozeduraler Stil statt OOP
Das Spiel verwendet keine Klassen. Alles läuft prozedural mit globalen Konstanten und lokalen Variablen in `main()`. Ein klassenbasierter Ansatz (z.B. `Snake`, `Food`, `Game`) würde die Lesbarkeit und Erweiterbarkeit deutlich verbessern.

### 5.3 Spielzustand in lokalen Variablen
Der gesamte Spielzustand wird in lokalen Variablen von `main()` verwaltet. Das macht es schwierig, den Zustand zu serialisieren (z.B. für Save/Load) oder einzelne Teile zu testen.

---

## 6. Stil & Konsistenz

### 6.1 Gemischte Sprachen in Kommentaren
Kommentare wechseln zwischen Deutsch und Englisch:
- Deutsch: `# Prüfen, ob Mixer Modul verfügbar ist` (Zeile 65)
- Englisch: `# Check for wall collisions` (Zeile 413)
- Gemischt: `# Spiele Damage-Sound ab` (Zeile 283)

**Empfehlung:** Eine Sprache konsequent verwenden. Da der Autor deutsch spricht, wäre Deutsch konsistenter — oder Englisch für breitere Zugänglichkeit.

### 6.2 Inkonsistente Leerzeilen
Zwischen manchen Funktionen gibt es zwei Leerzeilen (PEP 8 Standard), zwischen anderen nur eine oder gar keine.
**Empfehlung:** Konsequent PEP 8 befolgen: zwei Leerzeilen zwischen Top-Level-Funktionen.

---

## 7. Positive Aspekte

- **Funktionalität:** Das Spiel ist vollständig spielbar mit Schwierigkeitsgraden, Levels und Highscores.
- **Solide Grundstruktur:** Klare Trennung von Constants, Funktionen und Hauptlogik.
- **Sound-Integration:** Grundlegende Sound-Effekte sind implementiert.
- **WASD-Support:** Zusätzliche Steuerung neben Pfeiltasten.
- **Level-System:** Fortschreitende Schwierigkeit mit Hindernissen.
- **Highscore-System:** Persistente Bestenliste mit Namenseingabe.
- **Saubere Spielschleife:** Event → Update → Draw → Tick ist korrekt umgesetzt.

---

## Empfohlene Prioritäten

| Priorität | Problem | Aufwand |
|-----------|---------|---------|
| 🔴 Hoch | Startposition auf Hindernis (1.4) | Mittel |
| 🔴 Hoch | Endlosschleife in `generate_food` (1.3) | Gering |
| 🟡 Mittel | Code-Duplikation `show_victory`/`show_game_over` (2.1) | Gering |
| 🟡 Mittel | Wiederholte Font-Erzeugung (2.2) | Gering |
| 🟡 Mittel | Pause-Funktion fehlt (3.1) | Mittel |
| 🟡 Mittel | Sound-Laden nicht robust (4.1) | Gering |
| 🟢 Niedrig | Tippfehler Header (1.1) | Trivial |
| 🟢 Niedrig | Verwaiste `high_scores.txt` (1.2) | Trivial |
| 🟢 Niedrig | Grid-Toggle (3.3) | Gering |
| 🟢 Niedrig | Magic Numbers (2.4) | Gering |
| 🟢 Niedrig | Gemischte Sprache (6.1) | Gering |
