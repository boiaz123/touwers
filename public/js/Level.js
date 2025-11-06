export class Level {
    constructor() {
        this.path = [
            { x: 0, y: 300 },
            { x: 200, y: 300 },
            { x: 200, y: 100 },
            { x: 400, y: 100 },
            { x: 400, y: 400 },
            { x: 600, y: 400 },
            { x: 600, y: 200 },
            { x: 800, y: 200 }
        ];
        
        // Grid configuration - 70x40 cells
        this.gridWidth = 70;
        this.gridHeight = 40;
        this.cellSize = 20; // Each cell is 20x20 pixels
        this.towerSize = 2; // Towers occupy 2x2 cells
        
        // Track occupied grid cells (for tower placement)
        this.occupiedCells = new Set();
        
        // Mark path cells as occupied
        this.markPathCells();
    }
    
    markPathCells() {
        // Mark path and surrounding cells as occupied to prevent tower placement
        const pathWidth = 3; // 3 cells wide path
        
        for (let i = 0; i < this.path.length - 1; i++) {
            const start = this.path[i];
            const end = this.path[i + 1];
            
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const distance = Math.hypot(dx, dy);
            const steps = Math.ceil(distance / this.cellSize);
            
            for (let step = 0; step <= steps; step++) {
                const t = step / steps;
                const x = start.x + dx * t;
                const y = start.y + dy * t;
                
                const gridX = Math.floor(x / this.cellSize);
                const gridY = Math.floor(y / this.cellSize);
                
                // Mark cells around the path
                for (let offsetX = -pathWidth; offsetX <= pathWidth; offsetX++) {
                    for (let offsetY = -pathWidth; offsetY <= pathWidth; offsetY++) {
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
        // Render grid
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
        ctx.lineWidth = 1;
        
        // Vertical lines
        for (let x = 0; x <= this.gridWidth; x++) {
            const screenX = x * this.cellSize;
            ctx.beginPath();
            ctx.moveTo(screenX, 0);
            ctx.lineTo(screenX, this.gridHeight * this.cellSize);
            ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y <= this.gridHeight; y++) {
            const screenY = y * this.cellSize;
            ctx.beginPath();
            ctx.moveTo(0, screenY);
            ctx.lineTo(this.gridWidth * this.cellSize, screenY);
            ctx.stroke();
        }
        
        // Render path
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 60;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(this.path[0].x, this.path[0].y);
        for (let i = 1; i < this.path.length; i++) {
            ctx.lineTo(this.path[i].x, this.path[i].y);
        }
        ctx.lineTo(ctx.canvas.width, this.path[this.path.length - 1].y);
        ctx.stroke();
        
        // Highlight valid placement areas when tower is selected
        if (this.showPlacementPreview && this.previewGridX !== undefined && this.previewGridY !== undefined) {
            const canPlace = this.canPlaceTower(this.previewGridX, this.previewGridY);
            ctx.fillStyle = canPlace ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)';
            
            const screenPos = this.gridToScreen(this.previewGridX, this.previewGridY);
            const size = this.towerSize * this.cellSize;
            ctx.fillRect(
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
