export class Level1 {
    constructor() {
        this.name = "The King's Road";
        this.difficulty = "Easy";
        this.gridSize = 40; // Size of each grid cell
        this.cols = 40; // Number of columns (doubled from 20)
        this.rows = 30; // Number of rows (doubled from 15)
        
        // Grid where 0 = buildable, 1 = path, 2 = occupied by tower
        this.grid = this.createGrid();
        this.pathCoords = this.createPathCoords();
        this.worldPath = this.gridToWorldPath();
    }
    
    createGrid() {
        // Initialize empty grid
        const grid = Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));
        
        // Create the path coordinates first
        const pathCoords = this.createPathCoords();
        
        // Mark path cells in grid
        pathCoords.forEach(([row, col]) => {
            if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
                grid[row][col] = 1;
            }
        });
        
        return grid;
    }
    
    createPathCoords() {
        // Create a more interesting path that goes through the larger map
        const pathCoords = [];
        
        // Start from left edge, middle height
        const startRow = Math.floor(this.rows / 2);
        
        // Horizontal segment from left to first turn
        for (let col = 0; col <= 8; col++) {
            pathCoords.push([startRow, col]);
        }
        
        // Vertical segment going up
        for (let row = startRow - 1; row >= 8; row--) {
            pathCoords.push([row, 8]);
        }
        
        // Horizontal segment going right
        for (let col = 9; col <= 20; col++) {
            pathCoords.push([8, col]);
        }
        
        // Vertical segment going down
        for (let row = 9; row <= 22; row++) {
            pathCoords.push([row, 20]);
        }
        
        // Horizontal segment going right
        for (let col = 21; col <= 32; col++) {
            pathCoords.push([22, col]);
        }
        
        // Vertical segment going up
        for (let row = 21; row >= 15; row--) {
            pathCoords.push([row, 32]);
        }
        
        // Final horizontal segment to exit
        for (let col = 33; col < this.cols; col++) {
            pathCoords.push([15, col]);
        }
        
        return pathCoords;
    }
    
    gridToWorldPath() {
        // Convert grid coordinates to world coordinates in sequential order
        return this.pathCoords.map(([row, col]) => ({
            x: col * this.gridSize + this.gridSize / 2,
            y: row * this.gridSize + this.gridSize / 2
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
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        
        // Only draw grid lines every 2 cells to reduce visual clutter
        for (let col = 0; col <= this.cols; col += 2) {
            ctx.beginPath();
            ctx.moveTo(col * this.gridSize, 0);
            ctx.lineTo(col * this.gridSize, this.rows * this.gridSize);
            ctx.stroke();
        }
        
        for (let row = 0; row <= this.rows; row += 2) {
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
        
        // Draw path border for better visibility
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        
        // Draw the path as a continuous line
        if (this.worldPath.length > 0) {
            ctx.moveTo(this.worldPath[0].x, this.worldPath[0].y);
            for (let i = 1; i < this.worldPath.length; i++) {
                ctx.lineTo(this.worldPath[i].x, this.worldPath[i].y);
            }
        }
        ctx.stroke();
        
        // Draw buildable area indicators (less prominent for larger map)
        ctx.fillStyle = 'rgba(76, 175, 80, 0.05)';
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col] === 0) {
                    ctx.fillRect(
                        col * this.gridSize + 1,
                        row * this.gridSize + 1,
                        this.gridSize - 2,
                        this.gridSize - 2
                    );
                }
            }
        }
        
        // Draw start and end markers
        if (this.worldPath.length > 0) {
            // Start marker
            ctx.fillStyle = '#4CAF50';
            ctx.beginPath();
            ctx.arc(this.worldPath[0].x, this.worldPath[0].y, 8, 0, Math.PI * 2);
            ctx.fill();
            
            // End marker
            const endPoint = this.worldPath[this.worldPath.length - 1];
            ctx.fillStyle = '#F44336';
            ctx.beginPath();
            ctx.arc(endPoint.x, endPoint.y, 8, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
