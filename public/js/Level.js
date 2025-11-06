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
        
        // Grass texture data - will be generated once
        this.grassPatches = [];
        this.grassGenerated = false;
        
        // Path texture data - will be generated once
        this.pathTexture = [];
        this.pathTextureGenerated = false;
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
    
    generateGrassTexture(canvasWidth, canvasHeight) {
        if (this.grassGenerated) return;
        
        this.grassPatches = [];
        const patchCount = Math.floor((canvasWidth * canvasHeight) / 2000); // Density based on area
        
        for (let i = 0; i < patchCount; i++) {
            this.grassPatches.push({
                x: Math.random() * canvasWidth,
                y: Math.random() * canvasHeight,
                size: Math.random() * 8 + 4,
                shade: Math.random() * 0.3 + 0.7, // Variation in grass color
                type: Math.floor(Math.random() * 3) // Different grass patch types
            });
        }
        
        this.grassGenerated = true;
    }
    
    generatePathTexture(canvasWidth, canvasHeight) {
        if (this.pathTextureGenerated) return;
        
        this.pathTexture = [];
        const pathWidth = Math.max(40, Math.min(80, this.cellSize * 3));
        
        // Generate texture elements along the path
        for (let i = 0; i < this.path.length - 1; i++) {
            const start = this.path[i];
            const end = this.path[i + 1];
            const distance = Math.hypot(end.x - start.x, end.y - start.y);
            const elements = Math.floor(distance / 5); // More dense texture
            
            for (let j = 0; j < elements; j++) {
                const t = j / elements;
                const baseX = start.x + (end.x - start.x) * t;
                const baseY = start.y + (end.y - start.y) * t;
                
                // Generate various path elements
                for (let k = 0; k < 3; k++) {
                    const offsetX = (Math.random() - 0.5) * pathWidth * 0.8;
                    const offsetY = (Math.random() - 0.5) * pathWidth * 0.8;
                    
                    this.pathTexture.push({
                        x: baseX + offsetX,
                        y: baseY + offsetY,
                        size: Math.random() * 4 + 1,
                        type: Math.floor(Math.random() * 4), // dirt, sand, wood chips, stones
                        rotation: Math.random() * Math.PI * 2,
                        shade: Math.random() * 0.4 + 0.6
                    });
                }
            }
        }
        
        this.pathTextureGenerated = true;
    }
    
    renderGrassBackground(ctx) {
        const canvas = ctx.canvas;
        
        // Generate grass if not done yet
        this.generateGrassTexture(canvas.width, canvas.height);
        
        // Base grass color gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#4a6741');
        gradient.addColorStop(0.3, '#5a7751');
        gradient.addColorStop(0.7, '#6a8761');
        gradient.addColorStop(1, '#3a5731');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add subtle dirt/earth patches
        ctx.fillStyle = 'rgba(101, 67, 33, 0.15)';
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = Math.random() * 80 + 40;
            
            ctx.beginPath();
            ctx.ellipse(x, y, size, size * 0.6, Math.random() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Render individual grass patches for texture
        this.grassPatches.forEach(patch => {
            const alpha = patch.shade * 0.6;
            
            switch (patch.type) {
                case 0: // Small grass clusters
                    ctx.fillStyle = `rgba(34, 139, 34, ${alpha})`;
                    ctx.beginPath();
                    ctx.arc(patch.x, patch.y, patch.size * 0.5, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                    
                case 1: // Longer grass strands
                    ctx.strokeStyle = `rgba(50, 150, 50, ${alpha})`;
                    ctx.lineWidth = 1;
                    for (let j = 0; j < 3; j++) {
                        const offsetX = (Math.random() - 0.5) * patch.size;
                        const offsetY = (Math.random() - 0.5) * patch.size;
                        ctx.beginPath();
                        ctx.moveTo(patch.x + offsetX, patch.y + offsetY + patch.size * 0.5);
                        ctx.lineTo(patch.x + offsetX, patch.y + offsetY - patch.size * 0.5);
                        ctx.stroke();
                    }
                    break;
                    
                case 2: // Clover-like patches
                    ctx.fillStyle = `rgba(60, 179, 113, ${alpha})`;
                    for (let j = 0; j < 4; j++) {
                        const angle = (j / 4) * Math.PI * 2;
                        const x = patch.x + Math.cos(angle) * patch.size * 0.3;
                        const y = patch.y + Math.sin(angle) * patch.size * 0.3;
                        ctx.beginPath();
                        ctx.arc(x, y, patch.size * 0.2, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    break;
            }
        });
        
        // Add some scattered flowers/weeds
        for (let i = 0; i < Math.floor(canvas.width * canvas.height / 10000); i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const flowerType = Math.random();
            
            if (flowerType < 0.3) {
                // Small yellow flowers
                ctx.fillStyle = 'rgba(255, 255, 0, 0.7)';
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fill();
            } else if (flowerType < 0.6) {
                // White daisies
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                for (let petal = 0; petal < 6; petal++) {
                    const angle = (petal / 6) * Math.PI * 2;
                    const petalX = x + Math.cos(angle) * 3;
                    const petalY = y + Math.sin(angle) * 3;
                    ctx.beginPath();
                    ctx.arc(petalX, petalY, 1, 0, Math.PI * 2);
                    ctx.fill();
                }
                // Center
                ctx.fillStyle = 'rgba(255, 255, 0, 0.9)';
                ctx.beginPath();
                ctx.arc(x, y, 1, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Purple wildflowers
                ctx.fillStyle = 'rgba(147, 112, 219, 0.6)';
                ctx.beginPath();
                ctx.arc(x, y, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    
    renderPath(ctx) {
        const pathWidth = Math.max(40, Math.min(80, this.cellSize * 3));
        
        // Generate path texture if needed
        this.generatePathTexture(ctx.canvas.width, ctx.canvas.height);
        
        // Path outer shadow
        ctx.strokeStyle = 'rgba(45, 31, 22, 0.8)';
        ctx.lineWidth = pathWidth + 12;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(this.path[0].x, this.path[0].y);
        for (let i = 1; i < this.path.length; i++) {
            ctx.lineTo(this.path[i].x, this.path[i].y);
        }
        ctx.stroke();
        
        // Path base (dark dirt)
        ctx.strokeStyle = '#5d4e37';
        ctx.lineWidth = pathWidth + 4;
        ctx.beginPath();
        ctx.moveTo(this.path[0].x, this.path[0].y);
        for (let i = 1; i < this.path.length; i++) {
            ctx.lineTo(this.path[i].x, this.path[i].y);
        }
        ctx.stroke();
        
        // Main path surface (lighter dirt/sand mix)
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = pathWidth;
        ctx.beginPath();
        ctx.moveTo(this.path[0].x, this.path[0].y);
        for (let i = 1; i < this.path.length; i++) {
            ctx.lineTo(this.path[i].x, this.path[i].y);
        }
        ctx.stroke();
        
        // Path center highlights (sandy areas)
        ctx.strokeStyle = '#d2b48c';
        ctx.lineWidth = pathWidth * 0.4;
        ctx.beginPath();
        ctx.moveTo(this.path[0].x, this.path[0].y);
        for (let i = 1; i < this.path.length; i++) {
            ctx.lineTo(this.path[i].x, this.path[i].y);
        }
        ctx.stroke();
        
        // Render path texture elements
        this.pathTexture.forEach(element => {
            ctx.save();
            ctx.translate(element.x, element.y);
            ctx.rotate(element.rotation);
            
            const alpha = element.shade * 0.7;
            
            switch (element.type) {
                case 0: // Dirt clumps
                    ctx.fillStyle = `rgba(101, 67, 33, ${alpha})`;
                    ctx.beginPath();
                    ctx.ellipse(0, 0, element.size, element.size * 0.7, 0, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                    
                case 1: // Sand particles
                    ctx.fillStyle = `rgba(194, 178, 128, ${alpha})`;
                    ctx.beginPath();
                    ctx.arc(0, 0, element.size * 0.5, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                    
                case 2: // Wood chips
                    ctx.fillStyle = `rgba(139, 69, 19, ${alpha})`;
                    ctx.fillRect(-element.size, -element.size * 0.3, element.size * 2, element.size * 0.6);
                    // Add wood grain
                    ctx.strokeStyle = `rgba(101, 67, 33, ${alpha * 0.8})`;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(-element.size, 0);
                    ctx.lineTo(element.size, 0);
                    ctx.stroke();
                    break;
                    
                case 3: // Small stones
                    ctx.fillStyle = `rgba(128, 128, 128, ${alpha})`;
                    ctx.beginPath();
                    // Create irregular stone shape
                    const sides = 5 + Math.floor(Math.random() * 3);
                    for (let i = 0; i < sides; i++) {
                        const angle = (i / sides) * Math.PI * 2;
                        const radius = element.size * (0.7 + Math.random() * 0.3);
                        const x = Math.cos(angle) * radius;
                        const y = Math.sin(angle) * radius;
                        if (i === 0) {
                            ctx.moveTo(x, y);
                        } else {
                            ctx.lineTo(x, y);
                        }
                    }
                    ctx.closePath();
                    ctx.fill();
                    
                    // Stone highlight
                    ctx.fillStyle = `rgba(160, 160, 160, ${alpha * 0.5})`;
                    ctx.beginPath();
                    ctx.arc(-element.size * 0.3, -element.size * 0.3, element.size * 0.3, 0, Math.PI * 2);
                    ctx.fill();
                    break;
            }
            
            ctx.restore();
        });
        
        // Add some scattered leaves on the path
        const leafCount = Math.floor(this.path.length * 2);
        for (let i = 0; i < leafCount; i++) {
            const pathIndex = Math.floor(Math.random() * (this.path.length - 1));
            const t = Math.random();
            const start = this.path[pathIndex];
            const end = this.path[pathIndex + 1];
            
            const leafX = start.x + (end.x - start.x) * t + (Math.random() - 0.5) * pathWidth * 0.6;
            const leafY = start.y + (end.y - start.y) * t + (Math.random() - 0.5) * pathWidth * 0.6;
            
            ctx.save();
            ctx.translate(leafX, leafY);
            ctx.rotate(Math.random() * Math.PI * 2);
            
            // Draw simple leaf shape
            const leafSize = Math.random() * 6 + 3;
            const leafColor = Math.random() < 0.5 ? 'rgba(160, 82, 45, 0.6)' : 'rgba(139, 115, 85, 0.6)';
            
            ctx.fillStyle = leafColor;
            ctx.beginPath();
            ctx.ellipse(0, 0, leafSize, leafSize * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Leaf vein
            ctx.strokeStyle = 'rgba(101, 67, 33, 0.4)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, -leafSize * 0.6);
            ctx.lineTo(0, leafSize * 0.6);
            ctx.stroke();
            
            ctx.restore();
        }
    }
    
    render(ctx) {
        // Initialize grid for current canvas size if needed
        this.initializeForCanvas(ctx.canvas.width, ctx.canvas.height);
        
        // Render grass background first
        this.renderGrassBackground(ctx);
        
        // Render grid with adaptive opacity based on cell size
        const gridOpacity = Math.max(0.05, Math.min(0.15, this.cellSize / 40));
        ctx.strokeStyle = `rgba(139, 69, 19, ${gridOpacity})`; // Brown grid lines to blend with grass
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
        
        // Render the updated path
        this.renderPath(ctx);
        
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
