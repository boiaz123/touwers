export class Level1 {
    constructor() {
        this.name = "The King's Road";
        this.difficulty = "Easy";
        this.gridSize = 30; // Reduced from 40 to fit 70x40 grid in UI space
        this.cols = 70; // Increased from 40 to 70
        this.rows = 40; // Increased from 30 to 40
        
        // Grid where 0 = buildable, 1 = path, 2 = occupied by tower, 3 = tree/bush
        this.grid = this.createGrid();
        this.pathCoords = this.createPathCoords();
        this.worldPath = this.gridToWorldPath();
        this.vegetation = this.generateVegetation();
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
        // Create a more interesting winding path for the larger 70x40 landscape map
        const pathCoords = [];
        
        // Start from left edge, middle height
        const startRow = Math.floor(this.rows / 2); // Row 20
        
        // Horizontal segment from left edge
        for (let col = 0; col <= 12; col++) {
            pathCoords.push([startRow, col]);
        }
        
        // First vertical segment going up
        for (let row = startRow - 1; row >= 10; row--) {
            pathCoords.push([row, 12]);
        }
        
        // Horizontal segment going right
        for (let col = 13; col <= 25; col++) {
            pathCoords.push([10, col]);
        }
        
        // Vertical segment going down
        for (let row = 11; row <= 30; row++) {
            pathCoords.push([row, 25]);
        }
        
        // Horizontal segment going right
        for (let col = 26; col <= 42; col++) {
            pathCoords.push([30, col]);
        }
        
        // Vertical segment going up
        for (let row = 29; row >= 15; row--) {
            pathCoords.push([row, 42]);
        }
        
        // Horizontal segment going right
        for (let col = 43; col <= 58; col++) {
            pathCoords.push([15, col]);
        }
        
        // Final vertical segment down and horizontal to exit
        for (let row = 16; row <= 22; row++) {
            pathCoords.push([row, 58]);
        }
        
        // Final horizontal segment to right edge
        for (let col = 59; col < this.cols; col++) {
            pathCoords.push([22, col]);
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
    
    getScaledGridSize(ctx) {
        if (ctx.canvas.levelScale) {
            return this.gridSize * ctx.canvas.levelScale.scaleX;
        }
        return this.gridSize;
    }
    
    getScaledPosition(x, y, ctx) {
        if (ctx.canvas.levelScale) {
            return {
                x: x * ctx.canvas.levelScale.scaleX + ctx.canvas.levelScale.offsetX,
                y: y * ctx.canvas.levelScale.scaleY + ctx.canvas.levelScale.offsetY
            };
        }
        return { x, y };
    }
    
    worldToScaledCoords(worldX, worldY, ctx) {
        const scaled = this.getScaledPosition(worldX, worldY, ctx);
        return scaled;
    }
    
    generateVegetation() {
        const vegetation = [];
        const treeTypes = ['🌲', '🌳', '🌴', '🍄'];
        const bushTypes = ['🌿', '🌱', '🌾'];
        
        // Generate more vegetation for the larger map (scale with area)
        for (let attempts = 0; attempts < 300; attempts++) { // Increased from 150
            const row = Math.floor(Math.random() * this.rows);
            const col = Math.floor(Math.random() * this.cols);
            
            // Skip if on path or already occupied
            if (this.grid[row][col] !== 0) continue;
            
            // Skip if too close to path (maintain 1-2 cell buffer around path)
            if (this.isNearPath(row, col, 1)) continue;
            
            // Determine vegetation type based on location and clustering
            let vegType;
            let size = 1; // Default to 1x1
            
            // 60% chance for trees, 40% for bushes
            if (Math.random() < 0.6) {
                vegType = treeTypes[Math.floor(Math.random() * treeTypes.length)];
                // 20% chance for large trees (2x2)
                if (Math.random() < 0.2 && this.canPlaceLargeVegetation(row, col)) {
                    size = 2;
                }
            } else {
                vegType = bushTypes[Math.floor(Math.random() * bushTypes.length)];
            }
            
            // Place vegetation
            if (size === 2) {
                // Check if 2x2 area is available
                if (this.canPlaceLargeVegetation(row, col)) {
                    // Mark all 4 cells as occupied
                    for (let dy = 0; dy < 2; dy++) {
                        for (let dx = 0; dx < 2; dx++) {
                            this.grid[row + dy][col + dx] = 3;
                        }
                    }
                    vegetation.push({
                        row: row,
                        col: col,
                        type: vegType,
                        size: 2,
                        offsetX: (Math.random() - 0.5) * 8, // Reduced offset for smaller grid
                        offsetY: (Math.random() - 0.5) * 8
                    });
                }
            } else {
                // Place 1x1 vegetation
                this.grid[row][col] = 3;
                vegetation.push({
                    row: row,
                    col: col,
                    type: vegType,
                    size: 1,
                    offsetX: (Math.random() - 0.5) * 12, // Reduced offset for smaller grid
                    offsetY: (Math.random() - 0.5) * 12
                });
            }
        }
        
        // Add some vegetation clusters
        this.addVegetationClusters(vegetation);
        
        return vegetation;
    }
    
    isNearPath(row, col, buffer) {
        for (let dy = -buffer; dy <= buffer; dy++) {
            for (let dx = -buffer; dx <= buffer; dx++) {
                const checkRow = row + dy;
                const checkCol = col + dx;
                if (checkRow >= 0 && checkRow < this.rows && 
                    checkCol >= 0 && checkCol < this.cols &&
                    this.grid[checkRow][checkCol] === 1) {
                    return true;
                }
            }
        }
        return false;
    }
    
    canPlaceLargeVegetation(row, col) {
        // Check if 2x2 area is available
        if (row >= this.rows - 1 || col >= this.cols - 1) return false;
        
        for (let dy = 0; dy < 2; dy++) {
            for (let dx = 0; dx < 2; dx++) {
                if (this.grid[row + dy][col + dx] !== 0) {
                    return false;
                }
            }
        }
        
        // Check if too close to path
        for (let dy = -1; dy <= 2; dy++) {
            for (let dx = -1; dx <= 2; dx++) {
                const checkRow = row + dy;
                const checkCol = col + dx;
                if (checkRow >= 0 && checkRow < this.rows && 
                    checkCol >= 0 && checkCol < this.cols &&
                    this.grid[checkRow][checkCol] === 1) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    addVegetationClusters(vegetation) {
        const bushTypes = ['🌿', '🌱', '🌾'];
        
        // Add small bush clusters around existing trees
        vegetation.forEach(veg => {
            if (veg.type === '🌲' || veg.type === '🌳') {
                // Add 2-4 small bushes around the tree
                const bushCount = 2 + Math.floor(Math.random() * 3);
                for (let i = 0; i < bushCount; i++) {
                    const angle = (Math.PI * 2 * i) / bushCount + Math.random() * 0.5;
                    const distance = 2 + Math.random() * 2;
                    const bushRow = Math.round(veg.row + Math.sin(angle) * distance);
                    const bushCol = Math.round(veg.col + Math.cos(angle) * distance);
                    
                    if (bushRow >= 0 && bushRow < this.rows && 
                        bushCol >= 0 && bushCol < this.cols &&
                        this.grid[bushRow][bushCol] === 0 &&
                        !this.isNearPath(bushRow, bushCol, 1)) {
                        
                        this.grid[bushRow][bushCol] = 3;
                        vegetation.push({
                            row: bushRow,
                            col: bushCol,
                            type: bushTypes[Math.floor(Math.random() * bushTypes.length)],
                            size: 1,
                            offsetX: (Math.random() - 0.5) * 20,
                            offsetY: (Math.random() - 0.5) * 20
                        });
                    }
                }
            }
        });
    }
    
    gridToWorldPath() {
        // Convert grid coordinates to world coordinates in sequential order
        return this.pathCoords.map(([row, col]) => ({
            x: col * this.gridSize + this.gridSize / 2,
            y: row * this.gridSize + this.gridSize / 2
        }));
    }
    
    getScaledGridSize(ctx) {
        if (ctx.canvas.levelScale) {
            return this.gridSize * ctx.canvas.levelScale.scaleX;
        }
        return this.gridSize;
    }
    
    getScaledPosition(x, y, ctx) {
        if (ctx.canvas.levelScale) {
            return {
                x: x * ctx.canvas.levelScale.scaleX + ctx.canvas.levelScale.offsetX,
                y: y * ctx.canvas.levelScale.scaleY + ctx.canvas.levelScale.offsetY
            };
        }
        return { x, y };
    }
    
    worldToScaledCoords(worldX, worldY, ctx) {
        const scaled = this.getScaledPosition(worldX, worldY, ctx);
        return scaled;
    }
    
    canPlaceTower(worldX, worldY, ctx = null) {
        // Convert screen coordinates to world coordinates if scaling is applied
        let actualX = worldX;
        let actualY = worldY;
        
        if (ctx && ctx.canvas.levelScale) {
            actualX = (worldX - ctx.canvas.levelScale.offsetX) / ctx.canvas.levelScale.scaleX;
            actualY = (worldY - ctx.canvas.levelScale.offsetY) / ctx.canvas.levelScale.scaleY;
        }
        
        const gridX = Math.floor(actualX / this.gridSize);
        const gridY = Math.floor(actualY / this.gridSize);
        
        // Check if tower (2x2) can fit
        if (gridX < 0 || gridX >= this.cols - 1 || gridY < 0 || gridY >= this.rows - 1) {
            return false;
        }
        
        // Check all 4 cells for 2x2 tower placement (0 = buildable only)
        for (let dy = 0; dy < 2; dy++) {
            for (let dx = 0; dx < 2; dx++) {
                if (this.grid[gridY + dy][gridX + dx] !== 0) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    occupyGridCell(worldX, worldY, ctx = null) {
        // Convert screen coordinates to world coordinates if scaling is applied
        let actualX = worldX;
        let actualY = worldY;
        
        if (ctx && ctx.canvas.levelScale) {
            actualX = (worldX - ctx.canvas.levelScale.offsetX) / ctx.canvas.levelScale.scaleX;
            actualY = (worldY - ctx.canvas.levelScale.offsetY) / ctx.canvas.levelScale.scaleY;
        }
        
        if (this.canPlaceTower(worldX, worldY, ctx)) {
            const gridX = Math.floor(actualX / this.gridSize);
            const gridY = Math.floor(actualY / this.gridSize);
            
            // Occupy all 4 cells for 2x2 tower
            for (let dy = 0; dy < 2; dy++) {
                for (let dx = 0; dx < 2; dx++) {
                    this.grid[gridY + dy][gridX + dx] = 2;
                }
            }
            return true;
        }
        return false;
    }
    
    getGridCenterPosition(worldX, worldY, ctx = null) {
        // Convert screen coordinates to world coordinates if scaling is applied
        let actualX = worldX;
        let actualY = worldY;
        
        if (ctx && ctx.canvas.levelScale) {
            actualX = (worldX - ctx.canvas.levelScale.offsetX) / ctx.canvas.levelScale.scaleX;
            actualY = (worldY - ctx.canvas.levelScale.offsetY) / ctx.canvas.levelScale.scaleY;
        }
        
        const gridX = Math.floor(actualX / this.gridSize);
        const gridY = Math.floor(actualY / this.gridSize);
        
        // Center of 2x2 grid area
        const worldCenterX = (gridX + 0.5) * this.gridSize + this.gridSize / 2;
        const worldCenterY = (gridY + 0.5) * this.gridSize + this.gridSize / 2;
        
        // Don't convert back to screen coordinates - return world coordinates
        return { x: worldCenterX, y: worldCenterY };
    }
    
    render(ctx) {
        const scale = ctx.canvas.levelScale;
        if (!scale) {
            this.renderUnscaled(ctx);
            return;
        }
        
        // Save context state
        ctx.save();
        
        // Apply scaling and offset
        ctx.translate(scale.offsetX, scale.offsetY);
        ctx.scale(scale.scaleX, scale.scaleY);
        
        // Clear the scaled area
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, this.cols * this.gridSize, this.rows * this.gridSize);
        
        // Draw grid lines (subtle, every 4 cells for larger grid)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)'; // More subtle for larger grid
        ctx.lineWidth = 1 / scale.scaleX; // Adjust line width for scaling
        
        for (let col = 0; col <= this.cols; col += 4) { // Every 4 cells instead of 2
            ctx.beginPath();
            ctx.moveTo(col * this.gridSize, 0);
            ctx.lineTo(col * this.gridSize, this.rows * this.gridSize);
            ctx.stroke();
        }
        
        for (let row = 0; row <= this.rows; row += 4) { // Every 4 cells instead of 2
            ctx.beginPath();
            ctx.moveTo(0, row * this.gridSize);
            ctx.lineTo(this.cols * this.gridSize, row * this.gridSize);
            ctx.stroke();
        }
        
        // Draw path cells
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
        
        // Draw path border
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2 / scale.scaleX;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        
        if (this.worldPath.length > 0) {
            ctx.moveTo(this.worldPath[0].x, this.worldPath[0].y);
            for (let i = 1; i < this.worldPath.length; i++) {
                ctx.lineTo(this.worldPath[i].x, this.worldPath[i].y);
            }
        }
        ctx.stroke();
        
        // Draw buildable area indicators (less visible for larger grid)
        ctx.fillStyle = 'rgba(76, 175, 80, 0.03)'; // More subtle
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
        
        // Draw vegetation with adjusted sizes for smaller grid cells
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        this.vegetation.forEach(veg => {
            const worldX = veg.col * this.gridSize + this.gridSize / 2 + veg.offsetX;
            const worldY = veg.row * this.gridSize + this.gridSize / 2 + veg.offsetY;
            
            if (veg.size === 2) {
                // Large vegetation (2x2) - adjusted for smaller grid
                ctx.font = `${24 / scale.scaleX}px serif`; // Reduced from 32
                ctx.fillStyle = '#000';
                ctx.fillText(veg.type, worldX + 1, worldY + 1); // Shadow
                ctx.fillStyle = this.getVegetationColor(veg.type);
                ctx.fillText(veg.type, worldX, worldY);
            } else {
                // Small vegetation (1x1) - adjusted for smaller grid
                ctx.font = `${16 / scale.scaleX}px serif`; // Reduced from 20
                ctx.fillStyle = '#000';
                ctx.fillText(veg.type, worldX + 1, worldY + 1); // Shadow
                ctx.fillStyle = this.getVegetationColor(veg.type);
                ctx.fillText(veg.type, worldX, worldY);
            }
        });
        
        // Draw start and end markers
        if (this.worldPath.length > 0) {
            const markerSize = 6 / scale.scaleX; // Reduced from 8 for smaller grid
            
            // Start marker
            ctx.fillStyle = '#4CAF50';
            ctx.beginPath();
            ctx.arc(this.worldPath[0].x, this.worldPath[0].y, markerSize, 0, Math.PI * 2);
            ctx.fill();
            
            // End marker
            const endPoint = this.worldPath[this.worldPath.length - 1];
            ctx.fillStyle = '#F44336';
            ctx.beginPath();
            ctx.arc(endPoint.x, endPoint.y, markerSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Restore context state
        ctx.restore();
    }
    
    renderUnscaled(ctx) {
        // Fallback for when no scaling is available
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, this.cols * this.gridSize, this.rows * this.gridSize);
        
        // Draw grid lines (subtle, every 4 cells for larger grid)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        
        // Only draw grid lines every 4 cells to reduce visual clutter
        for (let col = 0; col <= this.cols; col += 4) {
            ctx.beginPath();
            ctx.moveTo(col * this.gridSize, 0);
            ctx.lineTo(col * this.gridSize, this.rows * this.gridSize);
            ctx.stroke();
        }
        
        for (let row = 0; row <= this.rows; row += 4) {
            ctx.beginPath();
            ctx.moveTo(0, row * this.gridSize);
            ctx.lineTo(this.cols * this.gridSize, row * this.gridSize);
            ctx.stroke();
        }
        
        // Draw path cells
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
        
        // Draw path border
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        
        if (this.worldPath.length > 0) {
            ctx.moveTo(this.worldPath[0].x, this.worldPath[0].y);
            for (let i = 1; i < this.worldPath.length; i++) {
                ctx.lineTo(this.worldPath[i].x, this.worldPath[i].y);
            }
        }
        ctx.stroke();
        
        // Draw buildable area indicators
        ctx.fillStyle = 'rgba(76, 175, 80, 0.03)';
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
        
        // Draw vegetation with adjusted sizes
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        this.vegetation.forEach(veg => {
            const worldX = veg.col * this.gridSize + this.gridSize / 2 + veg.offsetX;
            const worldY = veg.row * this.gridSize + this.gridSize / 2 + veg.offsetY;
            
            if (veg.size === 2) {
                // Large vegetation (2x2)
                ctx.font = '24px serif'; // Reduced from 32
                ctx.fillStyle = '#000';
                ctx.fillText(veg.type, worldX + 1, worldY + 1); // Shadow
                ctx.fillStyle = this.getVegetationColor(veg.type);
                ctx.fillText(veg.type, worldX, worldY);
            } else {
                // Small vegetation (1x1)
                ctx.font = '16px serif'; // Reduced from 20
                ctx.fillStyle = '#000';
                ctx.fillText(veg.type, worldX + 1, worldY + 1); // Shadow
                ctx.fillStyle = this.getVegetationColor(veg.type);
                ctx.fillText(veg.type, worldX, worldY);
            }
        });
        
        // Draw start and end markers
        if (this.worldPath.length > 0) {
            // Start marker
            ctx.fillStyle = '#4CAF50';
            ctx.beginPath();
            ctx.arc(this.worldPath[0].x, this.worldPath[0].y, 6, 0, Math.PI * 2); // Reduced from 8
            ctx.fill();
            
            // End marker
            const endPoint = this.worldPath[this.worldPath.length - 1];
            ctx.fillStyle = '#F44336';
            ctx.beginPath();
            ctx.arc(endPoint.x, endPoint.y, 6, 0, Math.PI * 2); // Reduced from 8
            ctx.fill();
        }
    }
    
    getVegetationColor(type) {
        switch(type) {
            case '🌲': return '#228B22'; // Forest green
            case '🌳': return '#32CD32'; // Lime green
            case '🌴': return '#228B22'; // Forest green
            case '🍄': return '#8B4513'; // Saddle brown
            case '🌿': return '#90EE90'; // Light green
            case '🌱': return '#98FB98'; // Pale green
            case '🌾': return '#F4A460'; // Sandy brown
            default: return '#228B22';
        }
    }
    
    getScaledGridSize(ctx) {
        if (ctx.canvas.levelScale) {
            return this.gridSize * ctx.canvas.levelScale.scaleX;
        }
        return this.gridSize;
    }
    
    getScaledPosition(x, y, ctx) {
        if (ctx.canvas.levelScale) {
            return {
                x: x * ctx.canvas.levelScale.scaleX + ctx.canvas.levelScale.offsetX,
                y: y * ctx.canvas.levelScale.scaleY + ctx.canvas.levelScale.offsetY
            };
        }
        return { x, y };
    }
    
    worldToScaledCoords(worldX, worldY, ctx) {
        const scaled = this.getScaledPosition(worldX, worldY, ctx);
        return scaled;
    }
    
    canPlaceTower(worldX, worldY, ctx = null) {
        // Convert screen coordinates to world coordinates if scaling is applied
        let actualX = worldX;
        let actualY = worldY;
        
        if (ctx && ctx.canvas.levelScale) {
            actualX = (worldX - ctx.canvas.levelScale.offsetX) / ctx.canvas.levelScale.scaleX;
            actualY = (worldY - ctx.canvas.levelScale.offsetY) / ctx.canvas.levelScale.scaleY;
        }
        
        const gridX = Math.floor(actualX / this.gridSize);
        const gridY = Math.floor(actualY / this.gridSize);
        
        // Check if tower (2x2) can fit
        if (gridX < 0 || gridX >= this.cols - 1 || gridY < 0 || gridY >= this.rows - 1) {
            return false;
        }
        
        // Check all 4 cells for 2x2 tower placement (0 = buildable only)
        for (let dy = 0; dy < 2; dy++) {
            for (let dx = 0; dx < 2; dx++) {
                if (this.grid[gridY + dy][gridX + dx] !== 0) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    occupyGridCell(worldX, worldY, ctx = null) {
        // Convert screen coordinates to world coordinates if scaling is applied
        let actualX = worldX;
        let actualY = worldY;
        
        if (ctx && ctx.canvas.levelScale) {
            actualX = (worldX - ctx.canvas.levelScale.offsetX) / ctx.canvas.levelScale.scaleX;
            actualY = (worldY - ctx.canvas.levelScale.offsetY) / ctx.canvas.levelScale.scaleY;
        }
        
        if (this.canPlaceTower(worldX, worldY, ctx)) {
            const gridX = Math.floor(actualX / this.gridSize);
            const gridY = Math.floor(actualY / this.gridSize);
            
            // Occupy all 4 cells for 2x2 tower
            for (let dy = 0; dy < 2; dy++) {
                for (let dx = 0; dx < 2; dx++) {
                    this.grid[gridY + dy][gridX + dx] = 2;
                }
            }
            return true;
        }
        return false;
    }
    
    getGridCenterPosition(worldX, worldY, ctx = null) {
        // Convert screen coordinates to world coordinates if scaling is applied
        let actualX = worldX;
        let actualY = worldY;
        
        if (ctx && ctx.canvas.levelScale) {
            actualX = (worldX - ctx.canvas.levelScale.offsetX) / ctx.canvas.levelScale.scaleX;
            actualY = (worldY - ctx.canvas.levelScale.offsetY) / ctx.canvas.levelScale.scaleY;
        }
        
        const gridX = Math.floor(actualX / this.gridSize);
        const gridY = Math.floor(actualY / this.gridSize);
        
        // Center of 2x2 grid area
        const worldCenterX = (gridX + 0.5) * this.gridSize + this.gridSize / 2;
        const worldCenterY = (gridY + 0.5) * this.gridSize + this.gridSize / 2;
        
        // Don't convert back to screen coordinates - return world coordinates
        return { x: worldCenterX, y: worldCenterY };
    }
    
    render(ctx) {
        const scale = ctx.canvas.levelScale;
        if (!scale) {
            this.renderUnscaled(ctx);
            return;
        }
        
        // Save context state
        ctx.save();
        
        // Apply scaling and offset
        ctx.translate(scale.offsetX, scale.offsetY);
        ctx.scale(scale.scaleX, scale.scaleY);
        
        // Clear the scaled area
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, this.cols * this.gridSize, this.rows * this.gridSize);
        
        // Draw grid lines (subtle, every 4 cells for larger grid)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)'; // More subtle for larger grid
        ctx.lineWidth = 1 / scale.scaleX; // Adjust line width for scaling
        
        for (let col = 0; col <= this.cols; col += 4) { // Every 4 cells instead of 2
            ctx.beginPath();
            ctx.moveTo(col * this.gridSize, 0);
            ctx.lineTo(col * this.gridSize, this.rows * this.gridSize);
            ctx.stroke();
        }
        
        for (let row = 0; row <= this.rows; row += 4) { // Every 4 cells instead of 2
            ctx.beginPath();
            ctx.moveTo(0, row * this.gridSize);
            ctx.lineTo(this.cols * this.gridSize, row * this.gridSize);
            ctx.stroke();
        }
        
        // Draw path cells
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
        
        // Draw path border
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2 / scale.scaleX;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        
        if (this.worldPath.length > 0) {
            ctx.moveTo(this.worldPath[0].x, this.worldPath[0].y);
            for (let i = 1; i < this.worldPath.length; i++) {
                ctx.lineTo(this.worldPath[i].x, this.worldPath[i].y);
            }
        }
        ctx.stroke();
        
        // Draw buildable area indicators (less visible for larger grid)
        ctx.fillStyle = 'rgba(76, 175, 80, 0.03)'; // More subtle
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
        
        // Draw vegetation with adjusted sizes for smaller grid cells
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        this.vegetation.forEach(veg => {
            const worldX = veg.col * this.gridSize + this.gridSize / 2 + veg.offsetX;
            const worldY = veg.row * this.gridSize + this.gridSize / 2 + veg.offsetY;
            
            if (veg.size === 2) {
                // Large vegetation (2x2) - adjusted for smaller grid
                ctx.font = `${24 / scale.scaleX}px serif`; // Reduced from 32
                ctx.fillStyle = '#000';
                ctx.fillText(veg.type, worldX + 1, worldY + 1); // Shadow
                ctx.fillStyle = this.getVegetationColor(veg.type);
                ctx.fillText(veg.type, worldX, worldY);
            } else {
                // Small vegetation (1x1) - adjusted for smaller grid
                ctx.font = `${16 / scale.scaleX}px serif`; // Reduced from 20
                ctx.fillStyle = '#000';
                ctx.fillText(veg.type, worldX + 1, worldY + 1); // Shadow
                ctx.fillStyle = this.getVegetationColor(veg.type);
                ctx.fillText(veg.type, worldX, worldY);
            }
        });
        
        // Draw start and end markers
        if (this.worldPath.length > 0) {
            const markerSize = 6 / scale.scaleX; // Reduced from 8 for smaller grid
            
            // Start marker
            ctx.fillStyle = '#4CAF50';
            ctx.beginPath();
            ctx.arc(this.worldPath[0].x, this.worldPath[0].y, markerSize, 0, Math.PI * 2);
            ctx.fill();
            
            // End marker
            const endPoint = this.worldPath[this.worldPath.length - 1];
            ctx.fillStyle = '#F44336';
            ctx.beginPath();
            ctx.arc(endPoint.x, endPoint.y, markerSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Restore context state
        ctx.restore();
    }
    
    renderUnscaled(ctx) {
        // Fallback for when no scaling is available
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, this.cols * this.gridSize, this.rows * this.gridSize);
        
        // Draw grid lines (subtle, every 4 cells for larger grid)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        
        // Only draw grid lines every 4 cells to reduce visual clutter
        for (let col = 0; col <= this.cols; col += 4) {
            ctx.beginPath();
            ctx.moveTo(col * this.gridSize, 0);
            ctx.lineTo(col * this.gridSize, this.rows * this.gridSize);
            ctx.stroke();
        }
        
        for (let row = 0; row <= this.rows; row += 4) {
            ctx.beginPath();
            ctx.moveTo(0, row * this.gridSize);
            ctx.lineTo(this.cols * this.gridSize, row * this.gridSize);
            ctx.stroke();
        }
        
        // Draw path cells
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
        
        // Draw path border
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        
        if (this.worldPath.length > 0) {
            ctx.moveTo(this.worldPath[0].x, this.worldPath[0].y);
            for (let i = 1; i < this.worldPath.length; i++) {
                ctx.lineTo(this.worldPath[i].x, this.worldPath[i].y);
            }
        }
        ctx.stroke();
        
        // Draw buildable area indicators
        ctx.fillStyle = 'rgba(76, 175, 80, 0.03)';
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
        
        // Draw vegetation with adjusted sizes
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        this.vegetation.forEach(veg => {
            const worldX = veg.col * this.gridSize + this.gridSize / 2 + veg.offsetX;
            const worldY = veg.row * this.gridSize + this.gridSize / 2 + veg.offsetY;
            
            if (veg.size === 2) {
                // Large vegetation (2x2)
                ctx.font = '24px serif'; // Reduced from 32
                ctx.fillStyle = '#000';
                ctx.fillText(veg.type, worldX + 1, worldY + 1); // Shadow
                ctx.fillStyle = this.getVegetationColor(veg.type);
                ctx.fillText(veg.type, worldX, worldY);
            } else {
                // Small vegetation (1x1)
                ctx.font = '16px serif'; // Reduced from 20
                ctx.fillStyle = '#000';
                ctx.fillText(veg.type, worldX + 1, worldY + 1); // Shadow
                ctx.fillStyle = this.getVegetationColor(veg.type);
                ctx.fillText(veg.type, worldX, worldY);
            }
        });
        
        // Draw start and end markers
        if (this.worldPath.length > 0) {
            // Start marker
            ctx.fillStyle = '#4CAF50';
            ctx.beginPath();
            ctx.arc(this.worldPath[0].x, this.worldPath[0].y, 6, 0, Math.PI * 2); // Reduced from 8
            ctx.fill();
            
            // End marker
            const endPoint = this.worldPath[this.worldPath.length - 1];
            ctx.fillStyle = '#F44336';
            ctx.beginPath();
            ctx.arc(endPoint.x, endPoint.y, 6, 0, Math.PI * 2); // Reduced from 8
            ctx.fill();
        }
    }
}
