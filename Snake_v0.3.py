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

def generate_food(snake_body):
    """Generates a new food position that is not on the snake's body."""
    while True:
        food_pos = (random.randint(0, GRID_WIDTH - 1), random.randint(0, GRID_HEIGHT - 1))
        # Ensure food does not spawn on the snake
        if food_pos not in snake_body:
            return food_pos

def draw_score(screen, score):
    """Draws the current score on the screen."""
    font = pygame.font.Font(None, 36) # Use default font, size 36
    score_text = font.render(f"Score: {score}", True, YELLOW)
    score_rect = score_text.get_rect(topleft=(10, 10)) # Position at top-left
    screen.blit(score_text, score_rect)

def show_victory(screen, score, sounds):
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

    # Instructions Text
    restart_text = font_small.render("Press R to Restart or Q to Quit", True, WHITE)
    restart_rect = restart_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 70))
    screen.blit(restart_text, restart_rect)

    pygame.display.flip() # Update the screen to show the message

    # Wait for player input (R or Q)
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
                    waiting = False # Exit the waiting loop to restart

def show_game_over(screen, score, sounds):
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

    # Instructions Text
    restart_text = font_small.render("Press R to Restart or Q to Quit", True, WHITE)
    restart_rect = restart_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 70))
    screen.blit(restart_text, restart_rect)

    pygame.display.flip() # Update the screen to show the message

    # Wait for player input (R or Q)
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
                    waiting = False # Exit the waiting loop to restart

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

    # Game state variables (these will reset on restart)
    while True: # Outer loop for restarting the game
        # Spiele Fanfare beim Spielstart
        if "fanfare" in sounds:
            sounds["fanfare"].play()
            
        # Initial snake setup
        start_x = GRID_WIDTH // 2
        start_y = GRID_HEIGHT // 2
        snake_body = [
            (start_x, start_y),        # Head
            (start_x - 1, start_y),    # Body segment 1
            (start_x - 2, start_y)     # Body segment 2
        ]
        direction = RIGHT # Initial direction
        change_to = direction # Buffer for next direction change

        # Initial food position
        food_pos = generate_food(snake_body)

        # Score
        score = 0
        current_fps = INITIAL_FPS
        
        # Victory conditions - z.B. wenn eine bestimmte Punktzahl erreicht wird
        victory_score = 30  # Erreiche 30 Punkte zum Sieg

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
            if new_head in snake_body[1:]: # Check against the rest of the body
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
                        
                    # Prüfe auf Sieg
                    if score >= victory_score:
                        victory = True
                        running = False
                        
                    # Increase speed based on score
                    if score % FPS_INCREASE_INTERVAL == 0:
                        current_fps += FPS_INCREASE_AMOUNT
                    food_pos = generate_food(snake_body) # Generate new food
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
            draw_score(screen, score)

            # Update the display
            pygame.display.flip()

            # --- 4. Control Frame Rate ---
            clock.tick(current_fps)

        # --- End of Inner Game Loop (Game Over or Quit) ---

        if game_over:
            show_game_over(screen, score, sounds)
            # The show_game_over function will loop until R or Q is pressed.
            # If R is pressed, it returns, and the outer `while True` loop restarts the game.
            # If Q is pressed, it calls sys.exit().
        elif victory:
            show_victory(screen, score, sounds)
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