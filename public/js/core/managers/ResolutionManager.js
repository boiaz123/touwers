/**
 * ResolutionManager - Handles all resolution and scaling for the game
 * 
 * Key principle: The game field is ALWAYS the same
 * - Grid is always 60x33.75 cells (fixed)
 * - Cell size changes to fill the canvas at each resolution
 * - Game world stays visually consistent across resolutions
 */
export class ResolutionManager {
    // Base resolution constants
    static BASE_WIDTH = 1920;
    static BASE_HEIGHT = 1080;
    
    // Grid dimensions - ALWAYS CONSTANT
    // This is the game world size in cells
    static GRID_WIDTH = 60;
    static GRID_HEIGHT = 33.75;
    
    // Base cell size at base resolution
    static BASE_CELL_SIZE = 32; // 1920 / 60 = 32
    
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        
        // Grid is always fixed
        this.gridWidth = ResolutionManager.GRID_WIDTH;
        this.gridHeight = ResolutionManager.GRID_HEIGHT;
        
        // Calculate cellSize to fit the grid into the canvas
        // Cell size should be proportional to canvas size
        const cellSizeWidth = canvasWidth / this.gridWidth;
        const cellSizeHeight = canvasHeight / this.gridHeight;
        
        // Use average for uniform scaling
        this.cellSize = Math.round((cellSizeWidth + cellSizeHeight) / 2);
        
        // Calculate overall scale factor for consistency
        this.scaleFactor = this.cellSize / ResolutionManager.BASE_CELL_SIZE;
        
        // Clamp to reasonable range
        this.scaleFactor = Math.max(0.5, Math.min(2.5, this.scaleFactor));
        this.cellSize = Math.round(ResolutionManager.BASE_CELL_SIZE * this.scaleFactor);
        
    }
    
    /**
     * Convert screen coordinates to grid coordinates.
     * `size` is the footprint (in cells) that will be placed there - passing it
     * centers the returned top-left cell on (screenX, screenY) instead of just
     * snapping to whichever cell the point happens to fall in, which would
     * otherwise anchor the footprint's corner (not its center) to the cursor.
     * NOTE: this must be Math.round, not Math.floor - size/2 is always a whole
     * number of cells (size is always even), so floor(u - size/2) === floor(u) -
     * size/2 identically and would silently cancel back out to the uncentered,
     * corner-anchored behavior this is meant to fix.
     */
    screenToGrid(screenX, screenY, size = 2) {
        const gridX = Math.round(screenX / this.cellSize - size / 2);
        const gridY = Math.round(screenY / this.cellSize - size / 2);
        return { gridX, gridY };
    }
    
    /**
     * Convert grid coordinates to screen coordinates (center of cell)
     */
    gridToScreen(gridX, gridY, size = 2) {
        const screenX = (gridX + size / 2) * this.cellSize;
        const screenY = (gridY + size / 2) * this.cellSize;
        return { screenX, screenY };
    }
    
    /**
     * Convert grid coordinates to screen coordinates (top-left of area)
     */
    gridToScreenTopLeft(gridX, gridY) {
        const screenX = gridX * this.cellSize;
        const screenY = gridY * this.cellSize;
        return { screenX, screenY };
    }
    
    /**
     * Check if a grid position is valid (within bounds)
     */
    isValidGridPosition(gridX, gridY) {
        return gridX >= 0 && gridX < this.gridWidth && 
               gridY >= 0 && gridY < this.gridHeight;
    }
    
    /**
     * Scale any dimension value based on the current resolution
     */
    scale(value) {
        return Math.round(value * this.scaleFactor);
    }
    
    /**
     * Scale a value without rounding
     */
    scaleFloat(value) {
        return value * this.scaleFactor;
    }
    
    /**
     * Get the scale factor for UI elements
     */
    getUIScale() {
        // Return scale factor for UI scaling
        // Can be different if needed for text/buttons
        return Math.max(1, Math.min(2.5, this.scaleFactor));
    }
}
