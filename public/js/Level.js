export class Level {
    constructor() {
        // Grid configuration - will be calculated based on screen size
        this.gridWidth = 70;
        this.gridHeight = 40;
        this.cellSize = 20;
        this.towerSize = 2; // Towers occupy 2x2 cells
        
        // Track occupied grid cells (for tower placement)
        this.occupiedCells = new Set();
        
        // Initialize with a default path that will be overridden
        this.path = [
            { x: 0, y: 300 },
            { x: 800, y: 300 }
        ];
        this.isInitialized = false;
    }
    
    initializeForCanvas(canvasWidth, canvasHeight) {
        if (this.isInitialized && this.lastCanvasWidth === canvasWidth && this.lastCanvasHeight === canvasHeight) {
            return; // Already initialized for this size
        }
        
        // Calculate grid size based on canvas dimensions
        // Aim for cells that are appropriately sized for the resolution
        const baseResolution = 1920; // 1080p width as baseline
        const scaleFactor = Math.max(0.5, Math.min(2.5, canvasWidth / baseResolution));
        
        this.cellSize = Math.floor(16 * scaleFactor); // Scale cell size
        this.gridWidth = Math.floor(canvasWidth / this.cellSize);
        this.gridHeight = Math.floor(canvasHeight / this.cellSize);
        
        // Create a more complex, meandering path that uses more of the map
        this.createMeanderingPath(canvasWidth, canvasHeight);
        
        // Clear and recalculate occupied cells
        this.occupiedCells.clear();
        this.markPathCells();
        
        this.lastCanvasWidth = canvasWidth;
        this.lastCanvasHeight = canvasHeight;
        this.isInitialized = true;
    }
    
    createMeanderingPath(canvasWidth, canvasHeight) {
        const margin = this.cellSize * 2; // Keep path away from edges
        const segmentLength = canvasWidth / 8; // Divide width into 8 segments for more turns
        
        this.path = [
            // Start from left edge
            { x: 0, y: canvasHeight * 0.7 },
            
            // First turn - go up and right
            { x: canvasWidth * 0.15, y: canvasHeight * 0.7 },
            { x: canvasWidth * 0.15, y: canvasHeight * 0.3 },
            
            // Second turn - go right and down
            { x: canvasWidth * 0.35, y: canvasHeight * 0.3 },
            { x: canvasWidth * 0.35, y: canvasHeight * 0.8 },
            
            // Third turn - go right and up
            { x: canvasWidth * 0.55, y: canvasHeight * 0.8 },
            { x: canvasWidth * 0.55, y: canvasHeight * 0.2 },
            
            // Fourth turn - go right and down
            { x: canvasWidth * 0.75, y: canvasHeight * 0.2 },
            { x: canvasWidth * 0.75, y: canvasHeight * 0.6 },
            
            // Final stretch to exit
            { x: canvasWidth * 0.9, y: canvasHeight * 0.6 },
            { x: canvasWidth, y: canvasHeight * 0.6 }
        ];
    }
    
    markPathCells() {
        // Mark path and surrounding cells as occupied to prevent tower placement
        const pathWidthCells = Math.max(3, Math.floor(60 / this.cellSize)); // Scale path width with cell size
        
        for (let i = 0; i < this.path.length - 1; i++) {
            const start = this.path[i];
            const end = this.path[i + 1];
            
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const distance = Math.hypot(dx, dy);
            const steps = Math.ceil(distance / (this.cellSize / 2)); // More granular path marking
            
            for (let step = 0; step <= steps; step++) {
                const t = step / steps;
                const x = start.x + dx * t;
                const y = start.y + dy * t;
                
                const gridX = Math.floor(x / this.cellSize);
                const gridY = Math.floor(y / this.cellSize);
                
                // Mark cells around the path
                for (let offsetX = -pathWidthCells; offsetX <= pathWidthCells; offsetX++) {
                    for (let offsetY = -pathWidthCells; offsetY <= pathWidthCells; offsetY++) {
                        const cellX = gridX + offsetX;
                        const cellY = gridY + offsetY;
                        if (this.isValidGridPosition(cellX, cellY)) {
                            this.occupiedCells.add(`${cellX},${cellY}`);
                        }
                    }
                }
            }
        }
    }
    
    isValidGridPosition(gridX, gridY) {
        return gridX >= 0 && gridX < this.gridWidth && gridY >= 0 && gridY < this.gridHeight;
    }
    
    canPlaceTower(gridX, gridY) {
        // Check if a 2x2 tower can be placed at this grid position
        for (let x = gridX; x < gridX + this.towerSize; x++) {
            for (let y = gridY; y < gridY + this.towerSize; y++) {
                if (!this.isValidGridPosition(x, y) || this.occupiedCells.has(`${x},${y}`)) {
                    return false;
                }
            }
        }
        return true;
    }
    
    placeTower(gridX, gridY) {
        // Mark the 2x2 area as occupied
        for (let x = gridX; x < gridX + this.towerSize; x++) {
            for (let y = gridY; y < gridY + this.towerSize; y++) {
                this.occupiedCells.add(`${x},${y}`);
            }
        }
    }
    
    screenToGrid(screenX, screenY) {
        const gridX = Math.floor(screenX / this.cellSize);
        const gridY = Math.floor(screenY / this.cellSize);
        return { gridX, gridY };
    }
    
    gridToScreen(gridX, gridY) {
        // Return center of the 2x2 tower area
        const screenX = (gridX + this.towerSize / 2) * this.cellSize;
        const screenY = (gridY + this.towerSize / 2) * this.cellSize;
        return { screenX, screenY };
    }
    
    render(ctx) {
        // Initialize grid for current canvas size if needed
        this.initializeForCanvas(ctx.canvas.width, ctx.canvas.height);
        
        // Render grid with adaptive opacity based on cell size
        const gridOpacity = Math.max(0.1, Math.min(0.3, this.cellSize / 30));
        ctx.strokeStyle = `rgba(100, 100, 100, ${gridOpacity})`;
        ctx.lineWidth = 1;
        
        // Only render grid if cells are large enough to be useful
        if (this.cellSize >= 10) {
            // Vertical lines - only render every few lines if cells are very small
            const lineStep = this.cellSize < 15 ? 2 : 1;
            for (let x = 0; x <= this.gridWidth; x += lineStep) {
                const screenX = x * this.cellSize;
                ctx.beginPath();
                ctx.moveTo(screenX, 0);
                ctx.lineTo(screenX, this.gridHeight * this.cellSize);
                ctx.stroke();
            }
            
            // Horizontal lines
            for (let y = 0; y <= this.gridHeight; y += lineStep) {
                const screenY = y * this.cellSize;
                ctx.beginPath();
                ctx.moveTo(0, screenY);
                ctx.lineTo(this.gridWidth * this.cellSize, screenY);
                ctx.stroke();
            }
        }
        
        // Render path with scaled width
        const pathWidth = Math.max(40, Math.min(80, this.cellSize * 3));
        ctx.strokeStyle = '#444';
        ctx.lineWidth = pathWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(this.path[0].x, this.path[0].y);
        for (let i = 1; i < this.path.length; i++) {
            ctx.lineTo(this.path[i].x, this.path[i].y);
        }
        ctx.stroke();
        
        // Add path border for better visibility
        ctx.strokeStyle = '#666';
        ctx.lineWidth = pathWidth + 4;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.moveTo(this.path[0].x, this.path[0].y);
        for (let i = 1; i < this.path.length; i++) {
            ctx.lineTo(this.path[i].x, this.path[i].y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
        
        // Highlight valid placement areas when tower is selected
        if (this.showPlacementPreview && this.previewGridX !== undefined && this.previewGridY !== undefined) {
            const canPlace = this.canPlaceTower(this.previewGridX, this.previewGridY);
            ctx.fillStyle = canPlace ? 'rgba(0, 255, 0, 0.4)' : 'rgba(255, 0, 0, 0.4)';
            
            const size = this.towerSize * this.cellSize;
            ctx.fillRect(
                this.previewGridX * this.cellSize,
                this.previewGridY * this.cellSize,
                size,
                size
            );
            
            // Add border to preview
            ctx.strokeStyle = canPlace ? 'rgba(0, 255, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)';
            ctx.lineWidth = 2;
            ctx.strokeRect(
                this.previewGridX * this.cellSize,
                this.previewGridY * this.cellSize,
                size,
                size
            );
        }
    }
    
    setPlacementPreview(screenX, screenY, show = true) {
        this.showPlacementPreview = show;
        if (show) {
            const { gridX, gridY } = this.screenToGrid(screenX, screenY);
            this.previewGridX = gridX;
            this.previewGridY = gridY;
        }
    }
}
