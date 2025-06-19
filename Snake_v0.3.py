# Snkae Game v0.3
# designed by:
#   ██████  ██       ██  ██    ██ ███████ ██████  
#  ██    ██ ██       ██  ██    ██ ██      ██   ██ 
#  ██    ██ ██       ██  ██    ██ █████   ██████  
#  ██    ██ ██       ██   ██  ██  ██      ██   ██ 
#   ██████  ███████  ██    ████   ███████ ██   ██ 
import pygame
import sys
import random
import time

# --- Constants ---
GRID_WIDTH = 20
GRID_HEIGHT = 20
CELL_SIZE = 25  # Size of each grid cell in pixels
SCREEN_WIDTH = GRID_WIDTH * CELL_SIZE
SCREEN_HEIGHT = GRID_HEIGHT * CELL_SIZE

# Highscore settings
HIGHSCORE_FILE = "highscores.txt"
MAX_HIGHSCORES = 5
MAX_NAME_LENGTH = 10

# Colors (RGB)
WHITE = (255, 255, 255)
GREEN = (0, 150, 0)       # Snake color
DARK_GREEN = (0, 100, 0)  # Snake outline/head detail
RED = (200, 0, 0)         # Food color
BLACK = (0, 0, 0)         # Background color
GRAY = (40, 40, 40)       # Grid line color
YELLOW = (255, 255, 0)    # Score text color

# Directions (dx, dy)
UP = (0, -1)
DOWN = (0, 1)
LEFT = (-1, 0)
RIGHT = (1, 0)

# Game speed
INITIAL_FPS = 8
FPS_INCREASE_INTERVAL = 5 # Increase speed every 5 points
FPS_INCREASE_AMOUNT = 1

# Difficulty settings
DIFFICULTIES = {
    1: {"initial_fps": 6},
    2: {"initial_fps": 8},
    3: {"initial_fps": 12},
}

# Level settings (obstacles for each level)
LEVELS = [
    [],
    [(GRID_WIDTH // 2, y) for y in range(4, GRID_HEIGHT - 4)],
    ([(x, GRID_HEIGHT // 2) for x in range(4, GRID_WIDTH - 4)] +
     [(GRID_WIDTH // 2, y) for y in range(4, GRID_HEIGHT - 4)])
]
LEVEL_SCORE_INTERVAL = 10

# --- Sound Setup ---
def load_sounds():
    """Load all game sound effects."""
    sounds = {}
    # Prüfen, ob Mixer Modul verfügbar ist
    if not pygame.mixer:
        print("Warnung: Sound nicht verfügbar")
        return sounds
    
    try:
        sounds["eat"] = pygame.mixer.Sound("eat.wav")
        sounds["victory"] = pygame.mixer.Sound("victory.wav")
        sounds["damage"] = pygame.mixer.Sound("damage.wav")
        sounds["fanfare"] = pygame.mixer.Sound("fanfare.wav")
        return sounds
    except pygame.error as e:
        print(f"Fehler beim Laden der Sounds: {e}")
        return {}

# --- Highscore Functions ---
def load_highscores():
    highscores = []
    try:
        with open(HIGHSCORE_FILE, "r") as f:
            for line in f:
                name, score = line.strip().split(",")
                highscores.append((name, int(score)))
    except FileNotFoundError:
        pass
    return highscores


def save_highscores(highscores):
    with open(HIGHSCORE_FILE, "w") as f:
        for name, score in highscores:
            f.write(f"{name},{score}\n")


def add_highscore(highscores, name, score):
    highscores.append((name, score))
    highscores.sort(key=lambda x: x[1], reverse=True)
    return highscores[:MAX_HIGHSCORES]


def get_player_name(screen):
    font = pygame.font.Font(None, 36)
    name = ""
    entering = True
    while entering:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_RETURN:
                    entering = False
                elif event.key == pygame.K_BACKSPACE:
                    name = name[:-1]
                elif len(name) < MAX_NAME_LENGTH and event.unicode.isprintable():
                    name += event.unicode

        screen.fill(BLACK)
        prompt = font.render("Enter Name: " + name, True, WHITE)
        rect = prompt.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2))
        screen.blit(prompt, rect)
        pygame.display.flip()

    return name if name else "Anonymous"


def display_highscores(screen, highscores):
    font = pygame.font.Font(None, 36)
    screen.fill(BLACK)
    title = font.render("Highscores", True, YELLOW)
    screen.blit(title, title.get_rect(center=(SCREEN_WIDTH // 2, 40)))
    y = 80
    for i, (name, score) in enumerate(highscores[:MAX_HIGHSCORES]):
        text = font.render(f"{i+1}. {name} - {score}", True, WHITE)
        screen.blit(text, text.get_rect(center=(SCREEN_WIDTH // 2, y)))
        y += 30
    pygame.display.flip()
    waiting = True
    while waiting:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
            if event.type == pygame.KEYDOWN:
                waiting = False

# --- Game Functions ---

def draw_grid(screen):
    """Draws the grid lines on the screen (optional visual aid)."""
    for x in range(0, SCREEN_WIDTH, CELL_SIZE):
        pygame.draw.line(screen, GRAY, (x, 0), (x, SCREEN_HEIGHT))
    for y in range(0, SCREEN_HEIGHT, CELL_SIZE):
        pygame.draw.line(screen, GRAY, (0, y), (SCREEN_WIDTH, y))

def draw_snake(screen, snake_body):
    """Draws the snake on the screen."""
    # Draw head slightly different
    head_x, head_y = snake_body[0]
    head_rect = pygame.Rect(head_x * CELL_SIZE, head_y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
    pygame.draw.rect(screen, DARK_GREEN, head_rect) # Darker head
    pygame.draw.rect(screen, GREEN, head_rect.inflate(-4,-4)) # Inner lighter green

    # Draw the rest of the body
    for segment in snake_body[1:]:
        seg_x, seg_y = segment
        segment_rect = pygame.Rect(seg_x * CELL_SIZE, seg_y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
        pygame.draw.rect(screen, GREEN, segment_rect)

def draw_food(screen, food_pos):
    """Draws the food on the screen."""
    food_x, food_y = food_pos
    food_rect = pygame.Rect(food_x * CELL_SIZE, food_y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
    pygame.draw.rect(screen, RED, food_rect)

def draw_obstacles(screen, obstacles):
    for ox, oy in obstacles:
        rect = pygame.Rect(ox * CELL_SIZE, oy * CELL_SIZE, CELL_SIZE, CELL_SIZE)
        pygame.draw.rect(screen, GRAY, rect)


def generate_food(snake_body, obstacles):
    """Generates a new food position that is not on the snake or obstacles."""
    while True:
        food_pos = (random.randint(0, GRID_WIDTH - 1), random.randint(0, GRID_HEIGHT - 1))
        if food_pos not in snake_body and food_pos not in obstacles:
            return food_pos

def draw_score(screen, score):
    """Draws the current score on the screen."""
    font = pygame.font.Font(None, 36) # Use default font, size 36
    score_text = font.render(f"Score: {score}", True, YELLOW)
    score_rect = score_text.get_rect(topleft=(10, 10)) # Position at top-left
    screen.blit(score_text, score_rect)


def show_level_up(screen, level):
    font = pygame.font.Font(None, 72)
    screen.fill(BLACK)
    text = font.render(f"Level {level}", True, YELLOW)
    screen.blit(text, text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2)))
    pygame.display.flip()
    pygame.time.wait(1500)


def select_difficulty(screen):
    font = pygame.font.Font(None, 36)
    text = font.render("Select Difficulty: 1-Easy 2-Medium 3-Hard", True, WHITE)
    while True:
        screen.fill(BLACK)
        screen.blit(text, text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2)))
        pygame.display.flip()
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit(); sys.exit()
            if event.type == pygame.KEYDOWN:
                if event.key in (pygame.K_1, pygame.K_KP1):
                    return 1
                if event.key in (pygame.K_2, pygame.K_KP2):
                    return 2
                if event.key in (pygame.K_3, pygame.K_KP3):
                    return 3

def show_victory(screen, score, sounds, highscores):
    """Displays a victory message when player wins the game."""
    # Spiele Victory-Sound ab
    if "victory" in sounds:
        sounds["victory"].play()
        
    font_large = pygame.font.Font(None, 72)
    font_small = pygame.font.Font(None, 36)

    # Create semi-transparent overlay
    overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
    overlay.fill((0, 0, 0, 180)) # Black with alpha transparency
    screen.blit(overlay, (0, 0))

    # Victory Text
    victory_text = font_large.render("Victory!", True, (0, 255, 0))  # Grün für Sieg
    victory_rect = victory_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 - 40))
    screen.blit(victory_text, victory_rect)

    # Final Score Text
    final_score_text = font_small.render(f"Final Score: {score}", True, WHITE)
    final_score_rect = final_score_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 20))
    screen.blit(final_score_text, final_score_rect)

    pygame.display.flip()
    pygame.time.wait(1000)

    name = get_player_name(screen)
    highscores = add_highscore(highscores, name, score)
    save_highscores(highscores)
    display_highscores(screen, highscores)

    # Instructions
    font_small = pygame.font.Font(None, 36)
    restart_text = font_small.render("Press R to Restart or Q to Quit", True, WHITE)
    screen.blit(restart_text, restart_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT - 40)))
    pygame.display.flip()

    waiting = True
    while waiting:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_q:
                    pygame.quit()
                    sys.exit()
                if event.key == pygame.K_r:
                    waiting = False
    return highscores

def show_game_over(screen, score, sounds, highscores):
    """Displays the Game Over message and final score."""
    # Spiele Damage-Sound ab
    if "damage" in sounds:
        sounds["damage"].play()
        
    font_large = pygame.font.Font(None, 72)
    font_small = pygame.font.Font(None, 36)

    # Create semi-transparent overlay
    overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
    overlay.fill((0, 0, 0, 180)) # Black with alpha transparency
    screen.blit(overlay, (0, 0))

    # Game Over Text
    game_over_text = font_large.render("Game Over", True, RED)
    game_over_rect = game_over_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 - 40))
    screen.blit(game_over_text, game_over_rect)

    # Final Score Text
    final_score_text = font_small.render(f"Final Score: {score}", True, WHITE)
    final_score_rect = final_score_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 20))
    screen.blit(final_score_text, final_score_rect)

    pygame.display.flip()
    pygame.time.wait(1000)

    name = get_player_name(screen)
    highscores = add_highscore(highscores, name, score)
    save_highscores(highscores)
    display_highscores(screen, highscores)

    restart_text = font_small.render("Press R to Restart or Q to Quit", True, WHITE)
    screen.blit(restart_text, restart_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT - 40)))
    pygame.display.flip()

    waiting = True
    while waiting:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_q:
                    pygame.quit()
                    sys.exit()
                if event.key == pygame.K_r:
                    waiting = False
    return highscores

# --- Main Game Logic ---
def main():
    """Main function to run the Snake game."""
    pygame.init()
    # Initialisiere den Sound-Mixer
    pygame.mixer.init()
    
    # Lade Sounds
    sounds = load_sounds()

    # Set up display
    screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
    pygame.display.set_caption("Simple Snake Game")
    clock = pygame.time.Clock()

    highscores = load_highscores()

    # Game state variables (these will reset on restart)
    while True: # Outer loop for restarting the game
        # Spiele Fanfare beim Spielstart
        if "fanfare" in sounds:
            sounds["fanfare"].play()

        difficulty = select_difficulty(screen)
        current_fps = DIFFICULTIES[difficulty]["initial_fps"]
        level = 0
        obstacles = LEVELS[level]
        show_level_up(screen, level + 1)

        # Initial snake setup
        start_x = GRID_WIDTH // 2
        start_y = GRID_HEIGHT // 2
        snake_body = [
            (start_x, start_y),        # Head
            (start_x - 1, start_y),    # Body segment 1
            (start_x - 2, start_y)     # Body segment 2
        ]
        direction = RIGHT
        change_to = direction

        # Initial food position
        food_pos = generate_food(snake_body, obstacles)

        # Score
        score = 0
        # Victory conditions
        victory_score = LEVEL_SCORE_INTERVAL * len(LEVELS)

        # Game state flags
        game_over = False
        victory = False
        running = True

        # --- Main Game Loop ---
        while running:
            # --- 1. Event Handling ---
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    pygame.quit()
                    sys.exit()
                elif event.type == pygame.KEYDOWN:
                    # Handle direction changes, preventing 180-degree turns
                    if (event.key == pygame.K_UP or event.key == pygame.K_w) and direction != DOWN:
                        change_to = UP
                    elif (event.key == pygame.K_DOWN or event.key == pygame.K_s) and direction != UP:
                        change_to = DOWN
                    elif (event.key == pygame.K_LEFT or event.key == pygame.K_a) and direction != RIGHT:
                        change_to = LEFT
                    elif (event.key == pygame.K_RIGHT or event.key == pygame.K_d) and direction != LEFT:
                        change_to = RIGHT
                    # Allow restart/quit from game over screen (handled later)

            # Update direction based on buffered input
            direction = change_to

            # --- 2. Update Game State ---
            # Move the snake
            head_x, head_y = snake_body[0]
            new_head_x = head_x + direction[0]
            new_head_y = head_y + direction[1]
            new_head = (new_head_x, new_head_y)

            # Check for wall collisions
            if not (0 <= new_head_x < GRID_WIDTH and 0 <= new_head_y < GRID_HEIGHT):
                game_over = True
                running = False # Exit inner loop to show game over screen

            # Check for self-collisions
            if new_head in snake_body[1:] or new_head in obstacles:
                game_over = True
                running = False # Exit inner loop

            # If no collisions yet, update snake body
            if not game_over:
                snake_body.insert(0, new_head) # Add new head

                # Check for food collision
                if new_head == food_pos:
                    score += 1
                    # Spiele Ess-Sound ab
                    if "eat" in sounds:
                        sounds["eat"].play()
                        
                    # Level and victory checks
                    if score % LEVEL_SCORE_INTERVAL == 0:
                        if score >= victory_score:
                            victory = True
                            running = False
                        elif level < len(LEVELS) - 1:
                            level += 1
                            show_level_up(screen, level + 1)
                            obstacles = LEVELS[level]
                            snake_body = [
                                (start_x, start_y),
                                (start_x - 1, start_y),
                                (start_x - 2, start_y)
                            ]
                            direction = RIGHT
                            change_to = direction
                            food_pos = generate_food(snake_body, obstacles)
                            continue
                        
                    # Increase speed based on score
                    if score % FPS_INCREASE_INTERVAL == 0:
                        current_fps += FPS_INCREASE_AMOUNT
                    food_pos = generate_food(snake_body, obstacles)
                    # Don't pop the tail, snake grows
                else:
                    snake_body.pop() # Remove the tail segment if no food eaten

            # --- 3. Drawing ---
            # Fill background
            screen.fill(BLACK)

            # Draw grid (optional)
            # draw_grid(screen) # Uncomment if you want grid lines

            # Draw game elements
            draw_snake(screen, snake_body)
            draw_food(screen, food_pos)
            draw_obstacles(screen, obstacles)
            draw_score(screen, score)

            # Update the display
            pygame.display.flip()

            # --- 4. Control Frame Rate ---
            clock.tick(current_fps)

        # --- End of Inner Game Loop (Game Over or Quit) ---

        if game_over:
            highscores = show_game_over(screen, score, sounds, highscores)
            # The show_game_over function will loop until R or Q is pressed.
            # If R is pressed, it returns, and the outer `while True` loop restarts the game.
            # If Q is pressed, it calls sys.exit().
        elif victory:
            highscores = show_victory(screen, score, sounds, highscores)
            # Ähnlich wie show_game_over, aber mit Victory-Nachricht
        else:
            # This case should ideally not be reached unless running is set to False
            # without game_over being True (e.g., direct quit event).
            break # Exit the outer restart loop

    # --- Pygame cleanup (if loop is broken) ---
    pygame.quit()
    sys.exit()


# --- Run the Game ---
if __name__ == "__main__":
    main()