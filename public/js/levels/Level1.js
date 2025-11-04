export class Level1 {
    constructor() {
        this.name = "The King's Road";
        this.difficulty = "Easy";
        this.gridSize = 40; // Size of each grid cell
        this.cols = 20; // Number of columns
        this.rows = 15; // Number of rows
        
        // Grid where 0 = buildable, 1 = path, 2 = occupied by tower
        this.grid = this.createGrid();
        this.path = this.createPath();
        this.worldPath = this.gridToWorldPath();
    }
    
    createGrid() {
        // Initialize empty grid
        const grid = Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));
        
        // Define path on grid (simple straight path with turns)
        const pathCoords = [
            [7, 0], [7, 1], [7, 2], [7, 3], [7, 4], [7, 5],
            [8, 5], [9, 5], [10, 5], [11, 5], [12, 5],
            [12, 6], [12, 7], [12, 8], [12, 9], [12, 10],
            [11, 10], [10, 10], [9, 10], [8, 10], [7, 10],
            [7, 11], [7, 12], [7, 13], [7, 14], [7, 15]
        ];
        
        // Mark path cells
        pathCoords.forEach(([row, col]) => {
            if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
                grid[row][col] = 1;
            }
        });
        
        return grid;
    }
    
    createPath() {
        // Extract path coordinates from grid
        const path = [];
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col] === 1) {
                    path.push({ row, col });
                }
            }
        }
        return path;
    }
    
    gridToWorldPath() {
        // Convert grid coordinates to world coordinates
        return this.path.map(point => ({
            x: point.col * this.gridSize + this.gridSize / 2,
            y: point.row * this.gridSize + this.gridSize / 2
        }));
    }
    
    canPlaceTower(worldX, worldY) {
        const gridX = Math.floor(worldX / this.gridSize);
        const gridY = Math.floor(worldY / this.gridSize);
        
        if (gridX < 0 || gridX >= this.cols || gridY < 0 || gridY >= this.rows) {
            return false;
        }
        
        return this.grid[gridY][gridX] === 0; // Only buildable on empty cells
    }
    
    occupyGridCell(worldX, worldY) {
        const gridX = Math.floor(worldX / this.gridSize);
        const gridY = Math.floor(worldY / this.gridSize);
        
        if (this.canPlaceTower(worldX, worldY)) {
            this.grid[gridY][gridX] = 2; // Mark as occupied
            return true;
        }
        return false;
    }
    
    getGridCenterPosition(worldX, worldY) {
        const gridX = Math.floor(worldX / this.gridSize);
        const gridY = Math.floor(worldY / this.gridSize);
        
        return {
            x: gridX * this.gridSize + this.gridSize / 2,
            y: gridY * this.gridSize + this.gridSize / 2
        };
    }
    
    render(ctx) {
        // Draw grid background
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, this.cols * this.gridSize, this.rows * this.gridSize);
        
        // Draw grid lines (subtle)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        
        for (let col = 0; col <= this.cols; col++) {
            ctx.beginPath();
            ctx.moveTo(col * this.gridSize, 0);
            ctx.lineTo(col * this.gridSize, this.rows * this.gridSize);
            ctx.stroke();
        }
        
        for (let row = 0; row <= this.rows; row++) {
            ctx.beginPath();
            ctx.moveTo(0, row * this.gridSize);
            ctx.lineTo(this.cols * this.gridSize, row * this.gridSize);
            ctx.stroke();
        }
        
        // Draw path
        ctx.fillStyle = '#444';
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col] === 1) {
                    ctx.fillRect(
                        col * this.gridSize,
                        row * this.gridSize,
                        this.gridSize,
                        this.gridSize
                    );
                }
            }
        }
        
        // Draw buildable area indicators
        ctx.fillStyle = 'rgba(76, 175, 80, 0.1)';
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col] === 0) {
                    ctx.fillRect(
                        col * this.gridSize + 2,
                        row * this.gridSize + 2,
                        this.gridSize - 4,
                        this.gridSize - 4
                    );
                }
            }
        }
    }
}
