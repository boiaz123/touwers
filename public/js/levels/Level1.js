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
        
        // Clear with grass base color
        ctx.fillStyle = '#2d5016'; // Dark grass green
        ctx.fillRect(0, 0, this.cols * this.gridSize, this.rows * this.gridSize);
        
        // Draw grass texture pattern
        this.drawGrassTexture(ctx, scale);
        
        // Draw more visible grid lines with natural colors
        ctx.strokeStyle = 'rgba(139, 69, 19, 0.3)'; // Brown earth color
        ctx.lineWidth = 1 / scale.scaleX;
        
        // Draw all grid lines for better visibility
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
        
        // Draw buildable grass areas with slight variations
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col] === 0) {
                    // Create grass color variations
                    const variation = (Math.sin(row * 0.5) * Math.cos(col * 0.3)) * 0.1;
                    const grassR = Math.floor(45 + variation * 20);
                    const grassG = Math.floor(80 + variation * 30);
                    const grassB = Math.floor(22 + variation * 10);
                    
                    ctx.fillStyle = `rgb(${grassR}, ${grassG}, ${grassB})`;
                    ctx.fillRect(
                        col * this.gridSize + 1,
                        row * this.gridSize + 1,
                        this.gridSize - 2,
                        this.gridSize - 2
                    );
                    
                    // Add subtle grass details
                    if ((row + col) % 3 === 0) {
                        ctx.fillStyle = 'rgba(60, 120, 30, 0.3)';
                        ctx.fillRect(
                            col * this.gridSize + this.gridSize * 0.2,
                            row * this.gridSize + this.gridSize * 0.2,
                            this.gridSize * 0.6,
                            this.gridSize * 0.6
                        );
                    }
                }
            }
        }
        
        // Draw path cells with dirt road appearance
        ctx.fillStyle = '#8B4513'; // Saddle brown for dirt road
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col] === 1) {
                    // Base dirt color
                    ctx.fillRect(
                        col * this.gridSize,
                        row * this.gridSize,
                        this.gridSize,
                        this.gridSize
                    );
                    
                    // Add dirt texture
                    const dirtVariation = (Math.sin(row * 1.2) * Math.cos(col * 0.8)) * 0.15;
                    const dirtR = Math.floor(139 + dirtVariation * 40);
                    const dirtG = Math.floor(69 + dirtVariation * 30);
                    const dirtB = Math.floor(19 + dirtVariation * 20);
                    
                    ctx.fillStyle = `rgb(${dirtR}, ${dirtG}, ${dirtB})`;
                    ctx.fillRect(
                        col * this.gridSize + 2,
                        row * this.gridSize + 2,
                        this.gridSize - 4,
                        this.gridSize - 4
                    );
                    
                    // Add small rocks/pebbles on path
                    if ((row * col) % 7 === 0) {
                        ctx.fillStyle = 'rgba(105, 105, 105, 0.6)';
                        ctx.beginPath();
                        ctx.arc(
                            col * this.gridSize + this.gridSize * 0.3 + (row % 3) * 3,
                            row * this.gridSize + this.gridSize * 0.7 + (col % 3) * 3,
                            2 / scale.scaleX,
                            0,
                            Math.PI * 2
                        );
                        ctx.fill();
                    }
                }
            }
        }
        
        // Draw path border with worn edges
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 3 / scale.scaleX;
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
        
        // Draw vegetation with enhanced appearance
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        this.vegetation.forEach(veg => {
            const worldX = veg.col * this.gridSize + this.gridSize / 2 + veg.offsetX;
            const worldY = veg.row * this.gridSize + this.gridSize / 2 + veg.offsetY;
            
            // Add shadow for vegetation
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            if (veg.size === 2) {
                ctx.font = `${24 / scale.scaleX}px serif`;
                ctx.fillText(veg.type, worldX + 2, worldY + 2);
            } else {
                ctx.font = `${16 / scale.scaleX}px serif`;
                ctx.fillText(veg.type, worldX + 1, worldY + 1);
            }
            
            // Draw vegetation with enhanced colors
            ctx.fillStyle = this.getVegetationColor(veg.type);
            ctx.fillText(veg.type, worldX, worldY);
        });
        
        // Draw start and end markers with enhanced appearance
        if (this.worldPath.length > 0) {
            const markerSize = 8 / scale.scaleX;
            
            // Start marker with glow
            ctx.shadowColor = '#4CAF50';
            ctx.shadowBlur = 10 / scale.scaleX;
            ctx.fillStyle = '#4CAF50';
            ctx.beginPath();
            ctx.arc(this.worldPath[0].x, this.worldPath[0].y, markerSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Add start text
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${10 / scale.scaleX}px serif`;
            ctx.fillText('START', this.worldPath[0].x, this.worldPath[0].y - 20 / scale.scaleX);
            
            // End marker with glow
            const endPoint = this.worldPath[this.worldPath.length - 1];
            ctx.shadowColor = '#F44336';
            ctx.shadowBlur = 10 / scale.scaleX;
            ctx.fillStyle = '#F44336';
            ctx.beginPath();
            ctx.arc(endPoint.x, endPoint.y, markerSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Add end text
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#fff';
            ctx.fillText('END', endPoint.x, endPoint.y - 20 / scale.scaleX);
        }
        
        // Restore context state
        ctx.restore();
    }
    
    drawGrassTexture(ctx, scale) {
        // Add random grass blade texture
        ctx.strokeStyle = 'rgba(60, 120, 30, 0.2)';
        ctx.lineWidth = 1 / scale.scaleX;
        
        for (let i = 0; i < 200; i++) {
            const x = Math.random() * this.cols * this.gridSize;
            const y = Math.random() * this.rows * this.gridSize;
            const gridX = Math.floor(x / this.gridSize);
            const gridY = Math.floor(y / this.gridSize);
            
            // Only draw on buildable areas
            if (gridY >= 0 && gridY < this.rows && gridX >= 0 && gridX < this.cols && 
                this.grid[gridY][gridX] === 0) {
                
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + (Math.random() - 0.5) * 4, y - Math.random() * 6);
                ctx.stroke();
            }
        }
    }
    
    renderUnscaled(ctx) {
        // Clear with grass base color
        ctx.fillStyle = '#2d5016';
        ctx.fillRect(0, 0, this.cols * this.gridSize, this.rows * this.gridSize);
        
        // Draw grass texture pattern
        this.drawGrassTextureUnscaled(ctx);
        
        // Draw more visible grid lines
        ctx.strokeStyle = 'rgba(139, 69, 19, 0.3)';
        ctx.lineWidth = 1;
        
        // Draw all grid lines
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
        
        // Draw buildable grass areas with variations
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col] === 0) {
                    const variation = (Math.sin(row * 0.5) * Math.cos(col * 0.3)) * 0.1;
                    const grassR = Math.floor(45 + variation * 20);
                    const grassG = Math.floor(80 + variation * 30);
                    const grassB = Math.floor(22 + variation * 10);
                    
                    ctx.fillStyle = `rgb(${grassR}, ${grassG}, ${grassB})`;
                    ctx.fillRect(
                        col * this.gridSize + 1,
                        row * this.gridSize + 1,
                        this.gridSize - 2,
                        this.gridSize - 2
                    );
                    
                    if ((row + col) % 3 === 0) {
                        ctx.fillStyle = 'rgba(60, 120, 30, 0.3)';
                        ctx.fillRect(
                            col * this.gridSize + this.gridSize * 0.2,
                            row * this.gridSize + this.gridSize * 0.2,
                            this.gridSize * 0.6,
                            this.gridSize * 0.6
                        );
                    }
                }
            }
        }
        
        // Draw path cells with dirt appearance
        ctx.fillStyle = '#8B4513';
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col] === 1) {
                    ctx.fillRect(
                        col * this.gridSize,
                        row * this.gridSize,
                        this.gridSize,
                        this.gridSize
                    );
                    
                    const dirtVariation = (Math.sin(row * 1.2) * Math.cos(col * 0.8)) * 0.15;
                    const dirtR = Math.floor(139 + dirtVariation * 40);
                    const dirtG = Math.floor(69 + dirtVariation * 30);
                    const dirtB = Math.floor(19 + dirtVariation * 20);
                    
                    ctx.fillStyle = `rgb(${dirtR}, ${dirtG}, ${dirtB})`;
                    ctx.fillRect(
                        col * this.gridSize + 2,
                        row * this.gridSize + 2,
                        this.gridSize - 4,
                        this.gridSize - 4
                    );
                    
                    if ((row * col) % 7 === 0) {
                        ctx.fillStyle = 'rgba(105, 105, 105, 0.6)';
                        ctx.beginPath();
                        ctx.arc(
                            col * this.gridSize + this.gridSize * 0.3 + (row % 3) * 3,
                            row * this.gridSize + this.gridSize * 0.7 + (col % 3) * 3,
                            2,
                            0,
                            Math.PI * 2
                        );
                        ctx.fill();
                    }
                }
            }
        }
        
        // Draw path border with worn edges
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 3;
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
    
    drawGrassTextureUnscaled(ctx) {
        ctx.strokeStyle = 'rgba(60, 120, 30, 0.2)';
        ctx.lineWidth = 1;
        
        for (let i = 0; i < 200; i++) {
            const x = Math.random() * this.cols * this.gridSize;
            const y = Math.random() * this.rows * this.gridSize;
            const gridX = Math.floor(x / this.gridSize);
            const gridY = Math.floor(y / this.gridSize);
            
            if (gridY >= 0 && gridY < this.rows && gridX >= 0 && gridX < this.cols && 
                this.grid[gridY][gridX] === 0) {
                
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + (Math.random() - 0.5) * 4, y - Math.random() * 6);
                ctx.stroke();
            }
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
        
        // Clear with grass base color
        ctx.fillStyle = '#2d5016'; // Dark grass green
        ctx.fillRect(0, 0, this.cols * this.gridSize, this.rows * this.gridSize);
        
        // Draw grass texture pattern
        this.drawGrassTexture(ctx, scale);
        
        // Draw more visible grid lines with natural colors
        ctx.strokeStyle = 'rgba(139, 69, 19, 0.3)'; // Brown earth color
        ctx.lineWidth = 1 / scale.scaleX;
        
        // Draw all grid lines for better visibility
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
        
        // Draw buildable grass areas with slight variations
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col] === 0) {
                    // Create grass color variations
                    const variation = (Math.sin(row * 0.5) * Math.cos(col * 0.3)) * 0.1;
                    const grassR = Math.floor(45 + variation * 20);
                    const grassG = Math.floor(80 + variation * 30);
                    const grassB = Math.floor(22 + variation * 10);
                    
                    ctx.fillStyle = `rgb(${grassR}, ${grassG}, ${grassB})`;
                    ctx.fillRect(
                        col * this.gridSize + 1,
                        row * this.gridSize + 1,
                        this.gridSize - 2,
                        this.gridSize - 2
                    );
                    
                    // Add subtle grass details
                    if ((row + col) % 3 === 0) {
                        ctx.fillStyle = 'rgba(60, 120, 30, 0.3)';
                        ctx.fillRect(
                            col * this.gridSize + this.gridSize * 0.2,
                            row * this.gridSize + this.gridSize * 0.2,
                            this.gridSize * 0.6,
                            this.gridSize * 0.6
                        );
                    }
                }
            }
        }
        
        // Draw path cells with dirt road appearance
        ctx.fillStyle = '#8B4513'; // Saddle brown for dirt road
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col] === 1) {
                    // Base dirt color
                    ctx.fillRect(
                        col * this.gridSize,
                        row * this.gridSize,
                        this.gridSize,
                        this.gridSize
                    );
                    
                    // Add dirt texture
                    const dirtVariation = (Math.sin(row * 1.2) * Math.cos(col * 0.8)) * 0.15;
                    const dirtR = Math.floor(139 + dirtVariation * 40);
                    const dirtG = Math.floor(69 + dirtVariation * 30);
                    const dirtB = Math.floor(19 + dirtVariation * 20);
                    
                    ctx.fillStyle = `rgb(${dirtR}, ${dirtG}, ${dirtB})`;
                    ctx.fillRect(
                        col * this.gridSize + 2,
                        row * this.gridSize + 2,
                        this.gridSize - 4,
                        this.gridSize - 4
                    );
                    
                    // Add small rocks/pebbles on path
                    if ((row * col) % 7 === 0) {
                        ctx.fillStyle = 'rgba(105, 105, 105, 0.6)';
                        ctx.beginPath();
                        ctx.arc(
                            col * this.gridSize + this.gridSize * 0.3 + (row % 3) * 3,
                            row * this.gridSize + this.gridSize * 0.7 + (col % 3) * 3,
                            2 / scale.scaleX,
                            0,
                            Math.PI * 2
                        );
                        ctx.fill();
                    }
                }
            }
        }
        
        // Draw path border with worn edges
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 3 / scale.scaleX;
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
        
        // Draw vegetation with enhanced appearance
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        this.vegetation.forEach(veg => {
            const worldX = veg.col * this.gridSize + this.gridSize / 2 + veg.offsetX;
            const worldY = veg.row * this.gridSize + this.gridSize / 2 + veg.offsetY;
            
            // Add shadow for vegetation
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            if (veg.size === 2) {
                ctx.font = `${24 / scale.scaleX}px serif`;
                ctx.fillText(veg.type, worldX + 2, worldY + 2);
            } else {
                ctx.font = `${16 / scale.scaleX}px serif`;
                ctx.fillText(veg.type, worldX + 1, worldY + 1);
            }
            
            // Draw vegetation with enhanced colors
            ctx.fillStyle = this.getVegetationColor(veg.type);
            ctx.fillText(veg.type, worldX, worldY);
        });
        
        // Draw start and end markers with enhanced appearance
        if (this.worldPath.length > 0) {
            const markerSize = 8 / scale.scaleX;
            
            // Start marker with glow
            ctx.shadowColor = '#4CAF50';
            ctx.shadowBlur = 10 / scale.scaleX;
            ctx.fillStyle = '#4CAF50';
            ctx.beginPath();
            ctx.arc(this.worldPath[0].x, this.worldPath[0].y, markerSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Add start text
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${10 / scale.scaleX}px serif`;
            ctx.fillText('START', this.worldPath[0].x, this.worldPath[0].y - 20 / scale.scaleX);
            
            // End marker with glow
            const endPoint = this.worldPath[this.worldPath.length - 1];
            ctx.shadowColor = '#F44336';
            ctx.shadowBlur = 10 / scale.scaleX;
            ctx.fillStyle = '#F44336';
            ctx.beginPath();
            ctx.arc(endPoint.x, endPoint.y, markerSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Add end text
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#fff';
            ctx.fillText('END', endPoint.x, endPoint.y - 20 / scale.scaleX);
        }
        
        // Restore context state
        ctx.restore();
    }
    
    drawGrassTexture(ctx, scale) {
        // Add random grass blade texture
        ctx.strokeStyle = 'rgba(60, 120, 30, 0.2)';
        ctx.lineWidth = 1 / scale.scaleX;
        
        for (let i = 0; i < 200; i++) {
            const x = Math.random() * this.cols * this.gridSize;
            const y = Math.random() * this.rows * this.gridSize;
            const gridX = Math.floor(x / this.gridSize);
            const gridY = Math.floor(y / this.gridSize);
            
            // Only draw on buildable areas
            if (gridY >= 0 && gridY < this.rows && gridX >= 0 && gridX < this.cols && 
                this.grid[gridY][gridX] === 0) {
                
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + (Math.random() - 0.5) * 4, y - Math.random() * 6);
                ctx.stroke();
            }
        }
    }
    
    renderUnscaled(ctx) {
        // Clear with grass base color
        ctx.fillStyle = '#2d5016';
        ctx.fillRect(0, 0, this.cols * this.gridSize, this.rows * this.gridSize);
        
        // Draw grass texture pattern
        this.drawGrassTextureUnscaled(ctx);
        
        // Draw more visible grid lines
        ctx.strokeStyle = 'rgba(139, 69, 19, 0.3)';
        ctx.lineWidth = 1;
        
        // Draw all grid lines
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
        
        // Draw buildable grass areas with variations
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col] === 0) {
                    const variation = (Math.sin(row * 0.5) * Math.cos(col * 0.3)) * 0.1;
                    const grassR = Math.floor(45 + variation * 20);
                    const grassG = Math.floor(80 + variation * 30);
                    const grassB = Math.floor(22 + variation * 10);
                    
                    ctx.fillStyle = `rgb(${grassR}, ${grassG}, ${grassB})`;
                    ctx.fillRect(
                        col * this.gridSize + 1,
                        row * this.gridSize + 1,
                        this.gridSize - 2,
                        this.gridSize - 2
                    );
                    
                    if ((row + col) % 3 === 0) {
                        ctx.fillStyle = 'rgba(60, 120, 30, 0.3)';
                        ctx.fillRect(
                            col * this.gridSize + this.gridSize * 0.2,
                            row * this.gridSize + this.gridSize * 0.2,
                            this.gridSize * 0.6,
                            this.gridSize * 0.6
                        );
                    }
                }
            }
        }
        
        // Draw path cells with dirt appearance
        ctx.fillStyle = '#8B4513';
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col] === 1) {
                    ctx.fillRect(
                        col * this.gridSize,
                        row * this.gridSize,
                        this.gridSize,
                        this.gridSize
                    );
                    
                    const dirtVariation = (Math.sin(row * 1.2) * Math.cos(col * 0.8)) * 0.15;
                    const dirtR = Math.floor(139 + dirtVariation * 40);
                    const dirtG = Math.floor(69 + dirtVariation * 30);
                    const dirtB = Math.floor(19 + dirtVariation * 20);
                    
                    ctx.fillStyle = `rgb(${dirtR}, ${dirtG}, ${dirtB})`;
                    ctx.fillRect(
                        col * this.gridSize + 2,
                        row * this.gridSize + 2,
                        this.gridSize - 4,
                        this.gridSize - 4
                    );
                    
                    if ((row * col) % 7 === 0) {
                        ctx.fillStyle = 'rgba(105, 105, 105, 0.6)';
                        ctx.beginPath();
                        ctx.arc(
                            col * this.gridSize + this.gridSize * 0.3 + (row % 3) * 3,
                            row * this.gridSize + this.gridSize * 0.7 + (col % 3) * 3,
                            2,
                            0,
                            Math.PI * 2
                        );
                        ctx.fill();
                    }
                }
            }
        }
        
        // Draw path border with worn edges
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 3;
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
    
    drawGrassTextureUnscaled(ctx) {
        ctx.strokeStyle = 'rgba(60, 120, 30, 0.2)';
        ctx.lineWidth = 1;
        
        for (let i = 0; i < 200; i++) {
            const x = Math.random() * this.cols * this.gridSize;
            const y = Math.random() * this.rows * this.gridSize;
            const gridX = Math.floor(x / this.gridSize);
            const gridY = Math.floor(y / this.gridSize);
            
            if (gridY >= 0 && gridY < this.rows && gridX >= 0 && gridX < this.cols && 
                this.grid[gridY][gridX] === 0) {
                
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + (Math.random() - 0.5) * 4, y - Math.random() * 6);
                ctx.stroke();
            }
        }
    }
}
