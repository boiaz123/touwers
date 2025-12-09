/**
 * ============================================================
 * RESOLUTION & SCALING SYSTEM DOCUMENTATION
 * ============================================================
 * 
 * This document explains how the game handles resolution scaling
 * and maintains consistent gameplay across different screen sizes.
 * 
 * ============================================================
 * OVERVIEW
 * ============================================================
 * 
 * The game uses a unified resolution scaling system based on a
 * base resolution of 1920x1080. All other resolutions scale
 * proportionally from this baseline:
 * 
 * - At 1920x1080: scale = 1.0x (100%, no scaling)
 * - At 960x540: scale = 0.5x (50%, smaller)
 * - At 3840x2160: scale = 2.5x (250%, larger, capped)
 * 
 * This ensures:
 * ✓ Grid alignment remains consistent
 * ✓ Towers and buildings scale proportionally
 * ✓ Game balance is maintained across resolutions
 * ✓ No grid shifting or misalignment issues
 * 
 * ============================================================
 * ARCHITECTURE
 * ============================================================
 * 
 * 1. ResolutionManager (core/ResolutionManager.js)
 *    - Central class managing all resolution calculations
 *    - Calculates scale factor from base resolution
 *    - Provides coordinate conversion methods
 *    - Attached to canvas and context for easy access
 * 
 * 2. Game (game/game.js)
 *    - Creates ResolutionManager on initialization
 *    - Updates ResolutionManager when canvas is resized
 *    - Passes ResolutionManager to GameStateManager
 *    - Attaches to canvas/context for rendering systems
 * 
 * 3. Level/GameplayState
 *    - Receives ResolutionManager from StateManager
 *    - Uses it to initialize grid with consistent cell sizes
 *    - Passes to all systems that need scaling
 * 
 * 4. Entity Rendering (Towers, Buildings)
 *    - Access ResolutionManager from context.resolutionManager
 *    - Use getCellSize() helper methods
 *    - Fallback to manual calculation if needed
 * 
 * ============================================================
 * KEY COMPONENTS
 * ============================================================
 * 
 * ResolutionManager Constants:
 * - BASE_WIDTH = 1920
 * - BASE_HEIGHT = 1080
 * - BASE_CELL_SIZE = 32 pixels
 * 
 * ResolutionManager Properties (calculated at runtime):
 * - scaleFactor: Proportional scaling from base (0.5 - 2.5x)
 * - cellSize: Grid cell size in pixels (scaled)
 * - gridWidth: Number of grid columns
 * - gridHeight: Number of grid rows
 * 
 * ResolutionManager Methods:
 * - screenToGrid(x, y): Convert screen coords to grid coords
 * - gridToScreen(gridX, gridY, size): Convert grid coords to screen
 * - scale(value): Scale any dimension
 * - isValidGridPosition(gridX, gridY): Check grid bounds
 * 
 * ============================================================
 * USAGE EXAMPLES
 * ============================================================
 * 
 * 1. In Game Initialization:
 *    this.resolutionManager = new ResolutionManager(width, height);
 *    this.canvas.resolutionManager = this.resolutionManager;
 *    this.ctx.resolutionManager = this.resolutionManager;
 * 
 * 2. In Level Initialization:
 *    level.initializeForCanvas(width, height, resolutionManager);
 *    // Level uses resolutionManager for grid setup
 * 
 * 3. In Tower Rendering:
 *    const cellSize = this.getCellSize(ctx);
 *    const towerSize = cellSize * 2; // 2x2 grid cells
 * 
 * 4. In Tower Placement:
 *    const { gridX, gridY } = level.screenToGrid(screenX, screenY);
 *    const { screenX, screenY } = level.gridToScreen(gridX, gridY);
 * 
 * 5. Getting Cell Size in Any Entity:
 *    // For towers/buildings with ctx
 *    if (ctx.resolutionManager) {
 *        cellSize = ctx.resolutionManager.cellSize;
 *    }
 * 
 * ============================================================
 * GRID SYSTEM
 * ============================================================
 * 
 * Grid Cell Size Calculation:
 * - Base: 32 pixels at 1920x1080
 * - Formula: cellSize = 32 * scaleFactor
 * - Example: At 1280x720 (66.7% scale), cellSize = 21 pixels
 * 
 * Tower Placement:
 * - Towers occupy 2x2 grid cells
 * - Placed on grid-aligned positions
 * - Coordinates always snap to cell boundaries
 * 
 * Path & Enemy Movement:
 * - Path is rendered proportionally with screen
 * - Enemy coordinates scale with resolution
 * - All physics calculations use consistent units
 * 
 * ============================================================
 * COORDINATE SYSTEMS
 * ============================================================
 * 
 * Screen Coordinates:
 * - Canvas pixels (0,0 to canvasWidth, canvasHeight)
 * - Used for mouse input, rendering
 * 
 * Grid Coordinates:
 * - Grid cells (0,0 to gridWidth-1, gridHeight-1)
 * - Used for tower placement, level logic
 * 
 * Conversion Functions:
 * - screenToGrid(sx, sy) → {gridX, gridY}
 *   gridX = floor(screenX / cellSize)
 *   gridY = floor(screenY / cellSize)
 * 
 * - gridToScreen(gx, gy, size) → {screenX, screenY}
 *   screenX = (gridX + size/2) * cellSize
 *   screenY = (gridY + size/2) * cellSize
 * 
 * ============================================================
 * RESPONSIVE SCALING
 * ============================================================
 * 
 * Scale Factor Ranges:
 * - Minimum: 0.5x (can't go below to prevent too small cells)
 * - Maximum: 2.5x (capped to prevent too large cells)
 * - Most common: 0.5x to 2.0x range
 * 
 * Scale Factor Calculation:
 * scaleWidth = canvasWidth / 1920
 * scaleHeight = canvasHeight / 1080
 * scaleFactor = average(scaleWidth, scaleHeight)
 * scaleFactor = clamp(scaleFactor, 0.5, 2.5)
 * 
 * ============================================================
 * TESTING RESOLUTIONS
 * ============================================================
 * 
 * Recommended test resolutions:
 * - 1920x1080 (1.0x scale) - Primary resolution
 * - 1280x720  (0.667x scale) - Smaller screen
 * - 1024x768  (0.533x scale) - Old standard
 * - 2560x1440 (1.333x scale) - Modern QHD
 * - 3840x2160 (2.0x scale) - 4K display
 * 
 * At each resolution, verify:
 * ✓ Grid cells are same relative size
 * ✓ Towers align to grid correctly
 * ✓ No visual shifting when resizing
 * ✓ Gameplay feels balanced
 * ✓ Text is readable (CSS scaling handles this)
 * 
 * ============================================================
 * TROUBLESHOOTING
 * ============================================================
 * 
 * If towers/buildings shift position:
 * 1. Check ResolutionManager is being updated on resize
 * 2. Verify screenToGrid/gridToScreen use correct cellSize
 * 3. Ensure Level receives ResolutionManager reference
 * 4. Check console logs for resolution changes
 * 
 * If grid cells are wrong size:
 * 1. Verify BASE_CELL_SIZE is correct (32px)
 * 2. Check scaleFactor calculation is correct
 * 3. Ensure cellSize is passed to all rendering systems
 * 4. Look for hardcoded pixel values that should be scaled
 * 
 * If click detection is off:
 * 1. Verify screenToGrid conversion
 * 2. Check mouse event handling in GameplayState
 * 3. Ensure canvas getBoundingClientRect is used correctly
 * 4. Verify scaleX/scaleY calculation in click handler
 * 
 * ============================================================
 * IMPLEMENTATION CHECKLIST
 * ============================================================
 * 
 * When adding new resizable elements:
 * 
 * [✓] ResolutionManager created - Handles base calculations
 * [✓] Tower/Building base classes - Include getCellSize()
 * [✓] Tower rendering - Uses getCellSize(ctx)
 * [✓] Building rendering - Uses getCellSize(ctx)
 * [✓] Level initialization - Receives ResolutionManager
 * [✓] Coordinate conversion - Uses ResolutionManager
 * [✓] Canvas/Context - Has resolutionManager attached
 * [✓] Resize handler - Updates ResolutionManager
 * [✓] GameStateManager - Stores ResolutionManager reference
 * 
 * ============================================================
 */
