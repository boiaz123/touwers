export class LevelBase {
    constructor(resolutionManager = null) {
        // Resolution manager - will be set during initialization
        this.resolutionManager = resolutionManager;
        
        // Grid configuration - will be set by resolutionManager or fallback defaults
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
        this.isInitializing = false; // Initialization flag to prevent recursion
        
        // Cached visual elements - will be generated once
        this.grassPatches = [];
        this.grassGenerated = false;
        this.pathTexture = [];
        this.pathTextureGenerated = false;
        this.dirtPatches = [];
        this.flowers = [];
        this.pathLeaves = [];
        this.visualElementsGenerated = false;
        
        this.castle = null;
        
        // Visual configuration - can be overridden by individual levels
        this.visualConfig = {
            // Grass background
            grassColors: {
                top: '#4a6741',
                upper: '#5a7751',
                lower: '#6a8761',
                bottom: '#3a5731'
            },
            grassPatchDensity: 8000, // pixels per patch
            grassPatchSizeMin: 6,
            grassPatchSizeMax: 18,
            
            // Dirt patches
            dirtPatchCount: 8,
            dirtPatchAlpha: 0.15,
            
            // Flowers
            flowerDensity: 25000, // pixels per flower
            
            // Path visuals
            pathBaseColor: '#8b7355',
            pathTextureSpacing: 15, // pixels between texture elements
            pathEdgeVegetationChance: 0.4,
            
            // Edge vegetation
            edgeBushColor: '#1f6f1f',
            edgeBushAccentColor: '#28a028',
            edgeRockColor: '#807f80',
            edgeGrassColor: '#2e8b2e'
        };
        
    }
    
    // Method to update visual configuration for a level
    setVisualConfig(updates) {
        this.visualConfig = {
            ...this.visualConfig,
            ...updates,
            grassColors: {
                ...this.visualConfig.grassColors,
                ...(updates.grassColors || {})
            }
        };
    }
    
    initializeForCanvas(canvasWidth, canvasHeight, resolutionManager = null) {
        // Ensure we have valid canvas dimensions
        if (!canvasWidth || !canvasHeight || canvasWidth <= 0 || canvasHeight <= 0) {
            console.warn('Level: Invalid canvas dimensions, skipping initialization');
            return;
        }
        
        // Prevent infinite loops by checking if already initializing
        if (this.isInitializing) {
            console.warn('Level: Already initializing, skipping duplicate call');
            return;
        }
        
        // Use provided resolution manager or create one if not available
        if (resolutionManager && !this.resolutionManager) {
            this.resolutionManager = resolutionManager;
        }
        
        // Always reinitialize if canvas size changed significantly
        const sizeChangeThreshold = 50; // pixels
        const sizeChanged = !this.lastCanvasWidth || 
                           Math.abs(this.lastCanvasWidth - canvasWidth) > sizeChangeThreshold ||
                           Math.abs(this.lastCanvasHeight - canvasHeight) > sizeChangeThreshold;
        
        if (this.isInitialized && !sizeChanged) {
            return; // Already initialized for this size
        }
        
        
        // Set initialization flag to prevent recursion
        this.isInitializing = true;
        
        try {
            // Use ResolutionManager if available, otherwise create fallback values
            // ResolutionManager should always be provided, but handle fallback just in case
            if (this.resolutionManager) {
                this.cellSize = this.resolutionManager.cellSize;
                this.gridWidth = this.resolutionManager.gridWidth;
                this.gridHeight = this.resolutionManager.gridHeight;
            } else {
                // Fallback: simple proportional scaling
                console.warn('Level: ResolutionManager not available, using fallback scaling');
                const scaleFactor = Math.max(0.5, Math.min(2.5, canvasWidth / 1920));
                this.cellSize = Math.round(32 * scaleFactor);
                this.gridWidth = Math.floor(canvasWidth / this.cellSize);
                this.gridHeight = Math.floor(canvasHeight / this.cellSize);
            }
            

            // Create a more complex, meandering path that uses more of the map
            this.createMeanderingPath(canvasWidth, canvasHeight);
            
            // Create castle at the end of the path
            this.createCastle();
            
            // Clear and recalculate occupied cells
            this.occupiedCells.clear();
            this.markPathCells();
            
            // Reset visual element generation flags to regenerate for new canvas size
            this.visualElementsGenerated = false;
            this.pathTextureGenerated = false;
            
            // IMPORTANT: Also clear cached visual elements arrays so they get regenerated
            // This fixes the issue where grass patches, dirt patches, etc. don't scale properly
            this.grassPatches = [];
            this.dirtPatches = [];
            this.flowers = [];
            this.pathLeaves = [];
            
            this.lastCanvasWidth = canvasWidth;
            this.lastCanvasHeight = canvasHeight;
            this.isInitialized = true;
            
        } catch (error) {
            console.error('Level: Error during initialization:', error);
        } finally {
            // Always clear the initializing flag
            this.isInitializing = false;
        }
    }
    
    createMeanderingPath(canvasWidth, canvasHeight) {
        // Path should be created based on GRID coordinates, not pixels
        // This ensures the path stays in the same position regardless of resolution
        
        // Use grid dimensions from ResolutionManager (always 60x33.75)
        const gridWidth = this.gridWidth || 60;
        const gridHeight = this.gridHeight || 33.75;
        
        // Create path in GRID COORDINATES (not pixels)
        // These coordinates will be converted to pixels based on cellSize
        const pathInGridCoords = [
            // Start from left edge
            { gridX: 0, gridY: gridHeight * 0.7 },
            
            // First turn - go up and right
            { gridX: gridWidth * 0.15, gridY: gridHeight * 0.7 },
            { gridX: gridWidth * 0.15, gridY: gridHeight * 0.3 },
            
            // Second turn - go right and down
            { gridX: gridWidth * 0.35, gridY: gridHeight * 0.3 },
            { gridX: gridWidth * 0.35, gridY: gridHeight * 0.8 },
            
            // Third turn - go right and up
            { gridX: gridWidth * 0.55, gridY: gridHeight * 0.8 },
            { gridX: gridWidth * 0.55, gridY: gridHeight * 0.2 },
            
            // Fourth turn - go right and down
            { gridX: gridWidth * 0.72, gridY: gridHeight * 0.2 },
            { gridX: gridWidth * 0.72, gridY: gridHeight * 0.6 },
            
            // Final stretch
            { gridX: gridWidth * 0.85, gridY: gridHeight * 0.6 }
        ];
        
        // Convert grid coordinates to screen coordinates using cellSize
        this.path = pathInGridCoords.map(point => ({
            x: Math.round(point.gridX * this.cellSize),
            y: Math.round(point.gridY * this.cellSize)
        }));
        
    }
    
    markPathCells() {
        // Mark path cells - path should occupy exactly 2 cells width for consistency
        // This creates a clear 2-cell-wide corridor that towers can border
        const pathWidthCells = 2; // Exactly 2 cells wide - clear and consistent
        const pathWidthPixels = pathWidthCells * this.cellSize;
        
        for (let i = 0; i < this.path.length - 1; i++) {
            const start = this.path[i];
            const end = this.path[i + 1];
            
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const distance = Math.hypot(dx, dy);
            const steps = Math.ceil(distance / (this.cellSize / 2)); // Granular marking
            
            for (let step = 0; step <= steps; step++) {
                const t = step / steps;
                const x = start.x + dx * t;
                const y = start.y + dy * t;
                
                const gridX = Math.floor(x / this.cellSize);
                const gridY = Math.floor(y / this.cellSize);
                
                // Mark all cells that the path stroke passes through
                // Path is stroked from center, so check distance from path line to cell center
                for (let offsetX = -2; offsetX <= 2; offsetX++) {
                    for (let offsetY = -2; offsetY <= 2; offsetY++) {
                        const cellX = gridX + offsetX;
                        const cellY = gridY + offsetY;
                        
                        if (!this.isValidGridPosition(cellX, cellY)) continue;
                        
                        // Get cell center in world space
                        const cellCenterX = (cellX + 0.5) * this.cellSize;
                        const cellCenterY = (cellY + 0.5) * this.cellSize;
                        
                        // Calculate distance from cell center to path line
                        // Using perpendicular distance formula
                        const pathDx = end.x - start.x;
                        const pathDy = end.y - start.y;
                        const pathLen = Math.hypot(pathDx, pathDy);
                        
                        if (pathLen === 0) continue;
                        
                        // Vector from start to cell
                        const cellDx = cellCenterX - start.x;
                        const cellDy = cellCenterY - start.y;
                        
                        // Project cell onto path line
                        const t2 = (cellDx * pathDx + cellDy * pathDy) / (pathLen * pathLen);
                        const clampedT = Math.max(0, Math.min(1, t2));
                        
                        // Closest point on path segment
                        const closestX = start.x + clampedT * pathDx;
                        const closestY = start.y + clampedT * pathDy;
                        
                        // Distance from cell center to closest point on path
                        const distToPath = Math.hypot(cellCenterX - closestX, cellCenterY - closestY);
                        
                        // Mark cell if it's within the path width
                        if (distToPath <= pathWidthPixels * 0.5) {
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
    
    canPlaceTower(gridX, gridY, towerManager = null) {
        // Check if a 2x2 tower can be placed at this grid position
        for (let x = gridX; x < gridX + this.towerSize; x++) {
            for (let y = gridY; y < gridY + this.towerSize; y++) {
                if (!this.isValidGridPosition(x, y) || this.occupiedCells.has(`${x},${y}`)) {
                    return false;
                }
            }
        }
        
        // Also check if there's already a tower at this position
        if (towerManager && towerManager.isTowerPositionOccupied(gridX, gridY)) {
            return false;
        }
        
        return true;
    }
    
    canPlaceBuilding(gridX, gridY, size = 4, towerManager = null) {
        // Check if a building of specified size can be placed
        for (let x = gridX; x < gridX + size; x++) {
            for (let y = gridY; y < gridY + size; y++) {
                if (!this.isValidGridPosition(x, y) || this.occupiedCells.has(`${x},${y}`)) {
                    return false;
                }
            }
        }
        
        // Check if there's already a building at this position
        if (towerManager && towerManager.isBuildingPositionOccupied(gridX, gridY, size)) {
            return false;
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
    
    placeBuilding(gridX, gridY, size = 4) {
        // Mark the building area as occupied
        for (let x = gridX; x < gridX + size; x++) {
            for (let y = gridY; y < gridY + size; y++) {
                this.occupiedCells.add(`${x},${y}`);
            }
        }
    }
    
    removeTower(gridX, gridY) {
        // Free up the 2x2 area from occupied cells
        for (let x = gridX; x < gridX + this.towerSize; x++) {
            for (let y = gridY; y < gridY + this.towerSize; y++) {
                this.occupiedCells.delete(`${x},${y}`);
            }
        }
    }
    
    removeBuilding(gridX, gridY, size = 4) {
        // Free up the building area from occupied cells
        for (let x = gridX; x < gridX + size; x++) {
            for (let y = gridY; y < gridY + size; y++) {
                this.occupiedCells.delete(`${x},${y}`);
            }
        }
    }
    
    screenToGrid(screenX, screenY) {
        // Use ResolutionManager if available, otherwise use cellSize
        if (this.resolutionManager) {
            return this.resolutionManager.screenToGrid(screenX, screenY);
        }
        const gridX = Math.floor(screenX / this.cellSize);
        const gridY = Math.floor(screenY / this.cellSize);
        return { gridX, gridY };
    }
    
    gridToScreen(gridX, gridY, size = 2) {
        // Use ResolutionManager if available, otherwise calculate manually
        if (this.resolutionManager) {
            return this.resolutionManager.gridToScreen(gridX, gridY, size);
        }
        // Return center of the specified size area
        const screenX = (gridX + size / 2) * this.cellSize;
        const screenY = (gridY + size / 2) * this.cellSize;
        return { screenX, screenY };
    }
    
    isValidGridPosition(gridX, gridY) {
        // Use ResolutionManager if available
        if (this.resolutionManager) {
            return this.resolutionManager.isValidGridPosition(gridX, gridY);
        }
        return gridX >= 0 && gridX < this.gridWidth && 
               gridY >= 0 && gridY < this.gridHeight;
    }
    
    generateAllVisualElements(canvasWidth, canvasHeight) {
        if (this.visualElementsGenerated) return;
        
        // Generate grass patches - using config density
        this.grassPatches = [];
        const patchCount = Math.floor((canvasWidth * canvasHeight) / this.visualConfig.grassPatchDensity);
        for (let i = 0; i < patchCount; i++) {
            // Add clustering - some patches appear near others
            let x, y;
            if (Math.random() < 0.3 && this.grassPatches.length > 0) {
                // Cluster near existing patch
                const nearPatch = this.grassPatches[Math.floor(Math.random() * this.grassPatches.length)];
                const clusterRadius = 80;
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * clusterRadius;
                x = Math.max(0, Math.min(canvasWidth, nearPatch.x + Math.cos(angle) * distance));
                y = Math.max(0, Math.min(canvasHeight, nearPatch.y + Math.sin(angle) * distance));
            } else {
                // Random placement
                x = Math.random() * canvasWidth;
                y = Math.random() * canvasHeight;
            }
            
            this.grassPatches.push({
                x: x,
                y: y,
                size: Math.random() * (this.visualConfig.grassPatchSizeMax - this.visualConfig.grassPatchSizeMin) + this.visualConfig.grassPatchSizeMin,
                shade: Math.random() * 0.4 + 0.6,
                type: Math.floor(Math.random() * 3)
            });
        }
        
        // Generate dirt patches
        this.dirtPatches = [];
        for (let i = 0; i < this.visualConfig.dirtPatchCount; i++) {
            this.dirtPatches.push({
                x: Math.random() * canvasWidth,
                y: Math.random() * canvasHeight,
                sizeX: Math.random() * 120 + 60, // Increased size for fewer patches
                sizeY: (Math.random() * 120 + 60) * 0.6,
                rotation: Math.random() * Math.PI
            });
        }
        
        // Generate flowers - using config density
        this.flowers = [];
        const flowerCount = Math.floor(canvasWidth * canvasHeight / this.visualConfig.flowerDensity);
        for (let i = 0; i < flowerCount; i++) {
            const flowerType = Math.random();
            let x, y;
            
            // Create flower clusters
            if (Math.random() < 0.4 && this.flowers.length > 0) {
                const nearFlower = this.flowers[Math.floor(Math.random() * this.flowers.length)];
                const clusterRadius = 40;
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * clusterRadius;
                x = Math.max(0, Math.min(canvasWidth, nearFlower.x + Math.cos(angle) * distance));
                y = Math.max(0, Math.min(canvasHeight, nearFlower.y + Math.sin(angle) * distance));
            } else {
                x = Math.random() * canvasWidth;
                y = Math.random() * canvasHeight;
            }
            
            this.flowers.push({
                x: x,
                y: y,
                type: flowerType < 0.3 ? 'yellow' : (flowerType < 0.6 ? 'daisy' : 'purple'),
                petals: flowerType >= 0.3 && flowerType < 0.6 ? this.generateDaisyPetals(x, y) : null
            });
        }
        
        this.visualElementsGenerated = true;
    }
    
    generateDaisyPetals(centerX, centerY) {
        const petals = [];
        for (let petal = 0; petal < 6; petal++) {
            const angle = (petal / 6) * Math.PI * 2;
            petals.push({
                x: centerX + Math.cos(angle) * 3,
                y: centerY + Math.sin(angle) * 3
            });
        }
        return petals;
    }
    
    generatePathTexture(canvasWidth, canvasHeight) {
        if (this.pathTextureGenerated) return;
        
        this.pathTexture = [];
        this.pathLeaves = [];
        const pathWidth = Math.max(40, Math.min(80, this.cellSize * 3));
        
        // Generate texture elements along the path - using config spacing
        for (let i = 0; i < this.path.length - 1; i++) {
            const start = this.path[i];
            const end = this.path[i + 1];
            const distance = Math.hypot(end.x - start.x, end.y - start.y);
            const elements = Math.floor(distance / this.visualConfig.pathTextureSpacing);
            
            for (let j = 0; j < elements; j++) {
                const t = j / elements;
                const baseX = start.x + (end.x - start.x) * t;
                const baseY = start.y + (end.y - start.y) * t;
                
                // Generate fewer path elements with more natural distribution
                const elementCount = Math.random() < 0.6 ? 1 : 2; // Reduced from always 3
                for (let k = 0; k < elementCount; k++) {
                    const offsetX = (Math.random() - 0.5) * pathWidth * 0.8;
                    const offsetY = (Math.random() - 0.5) * pathWidth * 0.8;
                    
                    this.pathTexture.push({
                        x: baseX + offsetX,
                        y: baseY + offsetY,
                        size: Math.random() * 6 + 2, // Increased size variation
                        type: Math.floor(Math.random() * 4),
                        rotation: Math.random() * Math.PI * 2,
                        shade: Math.random() * 0.5 + 0.5, // More variation in shading
                        // Cache stone shape for type 3
                        stoneShape: Math.floor(Math.random() * 4) === 3 ? this.generateStoneShape(Math.random() * 6 + 2) : null
                    });
                }
            }
        }
        
        // Generate path leaves - REDUCED quantity and improved distribution
        const leafCount = Math.floor(this.path.length * 0.8); // Reduced from 2 to 0.8
        for (let i = 0; i < leafCount; i++) {
            const pathIndex = Math.floor(Math.random() * (this.path.length - 1));
            const t = Math.random();
            const start = this.path[pathIndex];
            const end = this.path[pathIndex + 1];
            
            // Add some clustering to leaves
            const clusterChance = Math.random() < 0.3 && this.pathLeaves.length > 0;
            let leafX, leafY;
            
            if (clusterChance) {
                const nearLeaf = this.pathLeaves[Math.floor(Math.random() * this.pathLeaves.length)];
                leafX = nearLeaf.x + (Math.random() - 0.5) * 30;
                leafY = nearLeaf.y + (Math.random() - 0.5) * 30;
            } else {
                leafX = start.x + (end.x - start.x) * t + (Math.random() - 0.5) * pathWidth * 0.6;
                leafY = start.y + (end.y - start.y) * t + (Math.random() - 0.5) * pathWidth * 0.6;
            }
            
            this.pathLeaves.push({
                x: leafX,
                y: leafY,
                size: Math.random() * 8 + 4, // Increased size variation
                rotation: Math.random() * Math.PI * 2,
                color: Math.random() < 0.5 ? 'rgba(160, 82, 45, 0.6)' : 'rgba(139, 115, 85, 0.6)'
            });
        }
        
        this.pathTextureGenerated = true;
    }
    
    generateStoneShape(size) {
        const sides = 5 + Math.floor(Math.random() * 3);
        const points = [];
        for (let i = 0; i < sides; i++) {
            const angle = (i / sides) * Math.PI * 2;
            const radius = size * (0.7 + Math.random() * 0.3);
            points.push({
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius
            });
        }
        return points;
    }
    
    renderGrassBackground(ctx) {
        // PRE-RENDER OPTIMIZATION: Create background once and reuse
        if (!this.backgroundCanvas) {
            this.backgroundCanvas = document.createElement('canvas');
            this.backgroundCanvas.width = ctx.canvas.width;
            this.backgroundCanvas.height = ctx.canvas.height;
            const bgCtx = this.backgroundCanvas.getContext('2d');
            this._renderBackgroundToCanvas(bgCtx);
        }
        
        // Just blit the pre-rendered background
        ctx.drawImage(this.backgroundCanvas, 0, 0);
    }
    
    _renderBackgroundToCanvas(ctx) {
        // Actual rendering logic moved here for one-time execution
        const canvas = ctx.canvas;
        
        // Generate all visual elements if not done yet
        this.generateAllVisualElements(canvas.width, canvas.height);
        
        // Base grass color gradient - using config
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, this.visualConfig.grassColors.top);
        gradient.addColorStop(0.3, this.visualConfig.grassColors.upper);
        gradient.addColorStop(0.7, this.visualConfig.grassColors.lower);
        gradient.addColorStop(1, this.visualConfig.grassColors.bottom);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Render cached dirt patches
        ctx.fillStyle = `rgba(101, 67, 33, ${this.visualConfig.dirtPatchAlpha})`;
        this.dirtPatches.forEach(patch => {
            ctx.save();
            ctx.translate(patch.x, patch.y);
            ctx.rotate(patch.rotation);
            ctx.beginPath();
            ctx.ellipse(0, 0, patch.sizeX, patch.sizeY, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
        
        // Render cached grass patches
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
                        const offsetX = (j - 1) * patch.size * 0.3;
                        const offsetY = (j - 1) * patch.size * 0.2;
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
        
        // Render cached flowers
        this.flowers.forEach(flower => {
            switch (flower.type) {
                case 'yellow':
                    ctx.fillStyle = 'rgba(255, 255, 0, 0.7)';
                    ctx.beginPath();
                    ctx.arc(flower.x, flower.y, 2, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                    
                case 'daisy':
                    // White petals
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                    flower.petals.forEach(petal => {
                        ctx.beginPath();
                        ctx.arc(petal.x, petal.y, 1, 0, Math.PI * 2);
                        ctx.fill();
                    });
                    // Yellow center
                    ctx.fillStyle = 'rgba(255, 255, 0, 0.9)';
                    ctx.beginPath();
                    ctx.arc(flower.x, flower.y, 1, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                    
                case 'purple':
                    ctx.fillStyle = 'rgba(147, 112, 219, 0.6)';
                    ctx.beginPath();
                    ctx.arc(flower.x, flower.y, 1.5, 0, Math.PI * 2);
                    ctx.fill();
                    break;
            }
        });
    }
    
    renderPath(ctx) {
        // Path width should be exactly 2 grid cells wide for alignment
        const pathWidthPixels = this.cellSize * 2;
        
        // Generate path texture if needed
        this.generatePathTexture(ctx.canvas.width, ctx.canvas.height);
        
        // Build path geometry using the same marked cells
        const pathCells = new Set();
        
        for (let i = 0; i < this.path.length - 1; i++) {
            const start = this.path[i];
            const end = this.path[i + 1];
            
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const distance = Math.hypot(dx, dy);
            const steps = Math.ceil(distance / (this.cellSize / 2));
            
            for (let step = 0; step <= steps; step++) {
                const t = step / steps;
                const x = start.x + dx * t;
                const y = start.y + dy * t;
                
                const gridX = Math.floor(x / this.cellSize);
                const gridY = Math.floor(y / this.cellSize);
                
                for (let offsetX = -2; offsetX <= 2; offsetX++) {
                    for (let offsetY = -2; offsetY <= 2; offsetY++) {
                        const cellX = gridX + offsetX;
                        const cellY = gridY + offsetY;
                        
                        if (!this.isValidGridPosition(cellX, cellY)) continue;
                        
                        const cellCenterX = (cellX + 0.5) * this.cellSize;
                        const cellCenterY = (cellY + 0.5) * this.cellSize;
                        
                        const pathDx = end.x - start.x;
                        const pathDy = end.y - start.y;
                        const pathLen = Math.hypot(pathDx, pathDy);
                        
                        if (pathLen === 0) continue;
                        
                        const cellDx = cellCenterX - start.x;
                        const cellDy = cellCenterY - start.y;
                        
                        const t2 = (cellDx * pathDx + cellDy * pathDy) / (pathLen * pathLen);
                        const clampedT = Math.max(0, Math.min(1, t2));
                        
                        const closestX = start.x + clampedT * pathDx;
                        const closestY = start.y + clampedT * pathDy;
                        
                        const distToPath = Math.hypot(cellCenterX - closestX, cellCenterY - closestY);
                        
                        if (distToPath <= pathWidthPixels * 0.5) {
                            pathCells.add(`${cellX},${cellY}`);
                        }
                    }
                }
            }
        }
        
        // Base path color - using config
        ctx.fillStyle = this.visualConfig.pathBaseColor;
        pathCells.forEach(posStr => {
            const [cellX, cellY] = posStr.split(',').map(Number);
            const screenX = cellX * this.cellSize;
            const screenY = cellY * this.cellSize;
            ctx.fillRect(screenX, screenY, this.cellSize, this.cellSize);
        });
        
        // Add random details per cell for texture variety without grid appearance
        pathCells.forEach(posStr => {
            const [cellX, cellY] = posStr.split(',').map(Number);
            const screenX = cellX * this.cellSize;
            const screenY = cellY * this.cellSize;
            const centerX = screenX + this.cellSize / 2;
            const centerY = screenY + this.cellSize / 2;
            
            // Seeded random for consistent but unique details per cell
            const seed = cellX * 73856093 ^ cellY * 19349663;
            const detailType = Math.abs(Math.sin(seed * 0.001)) % 1;
            
            if (detailType < 0.25) {
                // Worn dirt patch
                ctx.fillStyle = 'rgba(101, 67, 33, 0.15)';
                ctx.beginPath();
                ctx.ellipse(centerX, centerY, this.cellSize * 0.35, this.cellSize * 0.25, 0.4, 0, Math.PI * 2);
                ctx.fill();
            } else if (detailType < 0.5) {
                // Sandy area
                ctx.fillStyle = 'rgba(194, 178, 128, 0.12)';
                ctx.beginPath();
                ctx.ellipse(centerX, centerY, this.cellSize * 0.3, this.cellSize * 0.22, -0.3, 0, Math.PI * 2);
                ctx.fill();
            } else if (detailType < 0.75) {
                // Small pebbles
                const pebbleCount = 2;
                for (let p = 0; p < pebbleCount; p++) {
                    const pebbleSeed = seed + p * 17;
                    const pX = centerX + (Math.sin(pebbleSeed * 0.01) - 0.5) * this.cellSize * 0.3;
                    const pY = centerY + (Math.cos(pebbleSeed * 0.01) - 0.5) * this.cellSize * 0.3;
                    
                    ctx.fillStyle = `rgba(128, 128, 128, 0.18)`;
                    ctx.beginPath();
                    ctx.arc(pX, pY, 1.2, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else {
                // Light weathering marks
                ctx.strokeStyle = 'rgba(101, 67, 33, 0.08)';
                ctx.lineWidth = 1;
                const wearAngle = Math.sin(seed * 0.005);
                ctx.beginPath();
                ctx.moveTo(centerX - this.cellSize * 0.2, centerY + Math.sin(wearAngle) * this.cellSize * 0.1);
                ctx.lineTo(centerX + this.cellSize * 0.2, centerY + Math.cos(wearAngle) * this.cellSize * 0.1);
                ctx.stroke();
            }
        });
        
        // Render path texture elements (dust, leaves, etc. on top)
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
                    ctx.strokeStyle = `rgba(101, 67, 33, ${alpha * 0.8})`;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(-element.size, 0);
                    ctx.lineTo(element.size, 0);
                    ctx.stroke();
                    break;
                    
                case 3: // Small stones
                    ctx.fillStyle = `rgba(128, 128, 128, ${alpha})`;
                    if (element.stoneShape) {
                        ctx.beginPath();
                        element.stoneShape.forEach((point, index) => {
                            if (index === 0) {
                                ctx.moveTo(point.x, point.y);
                            } else {
                                ctx.lineTo(point.x, point.y);
                            }
                        });
                        ctx.closePath();
                        ctx.fill();
                        
                        ctx.fillStyle = `rgba(160, 160, 160, ${alpha * 0.5})`;
                        ctx.beginPath();
                        ctx.arc(-element.size * 0.3, -element.size * 0.3, element.size * 0.3, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    break;
            }
            
            ctx.restore();
        });
        
        // Render path leaves
        this.pathLeaves.forEach(leaf => {
            ctx.save();
            ctx.translate(leaf.x, leaf.y);
            ctx.rotate(leaf.rotation);
            
            ctx.fillStyle = leaf.color;
            ctx.beginPath();
            ctx.ellipse(0, 0, leaf.size, leaf.size * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = 'rgba(101, 67, 33, 0.4)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, -leaf.size * 0.6);
            ctx.lineTo(0, leaf.size * 0.6);
            ctx.stroke();
            
            ctx.restore();
        });
        
        // Draw inner path edge line and add edge vegetation
        this.renderPathEdge(ctx, pathCells);
    }
    
    renderPathEdge(ctx, pathCells) {
        // Collect all unique edge cells (cells on the boundary of the path)
        const edgeCells = new Set();
        
        pathCells.forEach(posStr => {
            const [cellX, cellY] = posStr.split(',').map(Number);
            
            // Check if this path cell is on the edge (has at least one non-path neighbor)
            let isEdgeCell = false;
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (dx === 0 && dy === 0) continue;
                    const adjX = cellX + dx;
                    const adjY = cellY + dy;
                    const adjKey = `${adjX},${adjY}`;
                    
                    if (!pathCells.has(adjKey) && this.isValidGridPosition(adjX, adjY)) {
                        isEdgeCell = true;
                        break;
                    }
                }
                if (isEdgeCell) break;
            }
            
            if (isEdgeCell) {
                edgeCells.add(posStr);
            }
        });
        
        // Generate vegetation only on edge cells with natural spreading
        const edgeVegetation = [];
        const processedCells = new Set();
        
        edgeCells.forEach(posStr => {
            const [cellX, cellY] = posStr.split(',').map(Number);
            
            // Skip if already processed nearby
            const cellKey = `${Math.floor(cellX / 2)},${Math.floor(cellY / 2)}`;
            if (processedCells.has(cellKey)) return;
            
            // Random chance to place vegetation on this edge cell
            const seed = cellX * 73856093 ^ cellY * 19349663;
            const placementChance = Math.abs(Math.sin(seed * 0.007));
            
            if (placementChance > this.visualConfig.pathEdgeVegetationChance) {
                processedCells.add(cellKey);
                
                // Place vegetation in center of path edge cell
                const centerX = (cellX + 0.5) * this.cellSize;
                const centerY = (cellY + 0.5) * this.cellSize;
                
                // Add some natural randomness to position within cell
                const offsetX = (Math.sin(seed * 0.01) - 0.5) * this.cellSize * 0.4;
                const offsetY = (Math.cos(seed * 0.015) - 0.5) * this.cellSize * 0.3;
                
                edgeVegetation.push({
                    x: centerX + offsetX,
                    y: centerY + offsetY,
                    type: Math.floor(Math.abs(Math.sin(seed * 0.005)) * 3),
                    seed: seed,
                    cellX: cellX,
                    cellY: cellY
                });
            }
        });
        
        // Render edge vegetation - using config colors
        edgeVegetation.forEach(veg => {
            const seed = veg.seed;
            
            switch (veg.type) {
                case 0: // Small bushes
                    ctx.fillStyle = this.visualConfig.edgeBushColor;
                    ctx.beginPath();
                    ctx.arc(veg.x, veg.y, 6, 0, Math.PI * 2);
                    ctx.fill();
                    
                    ctx.fillStyle = this.visualConfig.edgeBushAccentColor;
                    ctx.beginPath();
                    ctx.arc(veg.x - 4, veg.y - 3, 4, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(veg.x + 4, veg.y - 3, 4, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                    
                case 1: // Rocks
                    ctx.fillStyle = this.visualConfig.edgeRockColor;
                    ctx.beginPath();
                    ctx.arc(veg.x, veg.y, 5, 0, Math.PI * 2);
                    ctx.fill();
                    
                    ctx.strokeStyle = '#696969';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                    
                    // Rock highlight
                    ctx.fillStyle = '#969696';
                    ctx.beginPath();
                    ctx.arc(veg.x - 1.5, veg.y - 1.5, 2, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                    
                case 2: // Grass clumps and wildflowers
                    ctx.strokeStyle = this.visualConfig.edgeGrassColor;
                    ctx.lineWidth = 1.5;
                    for (let j = 0; j < 5; j++) {
                        const angle = (j / 5) * Math.PI * 2 + (seed * 0.01);
                        const length = 7 + Math.sin(seed * 0.02) * 2;
                        ctx.beginPath();
                        ctx.moveTo(veg.x, veg.y);
                        ctx.lineTo(
                            veg.x + Math.cos(angle) * length,
                            veg.y + Math.sin(angle) * length
                        );
                        ctx.stroke();
                    }
                    
                    // Small flower in center
                    if (Math.sin(seed * 0.005) > 0) {
                        ctx.fillStyle = '#FFD700';
                        ctx.beginPath();
                        ctx.arc(veg.x, veg.y, 2, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    break;
            }
        });
    }
    
    createCastle() {
        const pathEnd = this.path[this.path.length - 1];
        const castleGridX = Math.floor(pathEnd.x / this.cellSize) + 2;
        const castleGridY = Math.floor(pathEnd.y / this.cellSize) - 2;
        
        const castleScreenX = (castleGridX + 1.5) * this.cellSize;
        const castleScreenY = (castleGridY + 1.5) * this.cellSize;
        
        // Load the real Castle class and create instance
        import('../buildings/Castle.js').then(module => {
            this.castle = new module.Castle(castleScreenX, castleScreenY, castleGridX, castleGridY);
        }).catch(err => {
            console.error('Level: Could not load Castle:', err);
            // Create fallback placeholder with render method
            this.castle = {
                x: castleScreenX,
                y: castleScreenY,
                gridX: castleGridX,
                gridY: castleGridY,
                health: 100,
                maxHealth: 100,
                takeDamage: function(amount) {
                    this.health -= amount;
                },
                isDestroyed: function() {
                    return this.health <= 0;
                },
                render: function(ctx) {
                    // Minimal fallback render - just shows a red square
                    ctx.fillStyle = '#cc0000';
                    ctx.fillRect(this.x - 40, this.y - 40, 80, 80);
                }
            };
        });
        
        // Mark castle cells as occupied immediately (3x3 size)
        for (let x = castleGridX; x < castleGridX + 3; x++) {
            for (let y = castleGridY; y < castleGridY + 3; y++) {
                this.occupiedCells.add(`${x},${y}`);
            }
        }
    }
    
    render(ctx) {
        // Only initialize if we have valid canvas dimensions AND not already initializing
        if (ctx.canvas.width > 0 && ctx.canvas.height > 0 && !this.isInitializing) {
            this.initializeForCanvas(ctx.canvas.width, ctx.canvas.height);
        }
        
        // Only render if properly initialized
        if (!this.isInitialized) {
            return;
        }
        
        // Render grass background first
        this.renderGrassBackground(ctx);
        
        // Render the path
        this.renderPath(ctx);
        
        // Render castle
        if (this.castle) {
            this.castle.render(ctx);
        }
        
        // Grid is now disabled visually - grid calculations remain active for gameplay
        // To re-enable the grid for debugging, set showDebugGrid to true
        const showDebugGrid = false;
        
        if (showDebugGrid && this.cellSize >= 20) {
            // DEBUG GRID ONLY - normally disabled
            const gridOpacity = 0.08;
            ctx.strokeStyle = `rgba(139, 69, 19, ${gridOpacity})`;
            ctx.lineWidth = 1;
            
            const lineStep = this.cellSize < 30 ? 2 : 1;
            for (let x = 0; x <= this.gridWidth; x += lineStep) {
                const screenX = x * this.cellSize;
                ctx.beginPath();
                ctx.moveTo(screenX, 0);
                ctx.lineTo(screenX, this.gridHeight * this.cellSize);
                ctx.stroke();
            }
            
            for (let y = 0; y <= this.gridHeight; y += lineStep) {
                const screenY = y * this.cellSize;
                ctx.beginPath();
                ctx.moveTo(0, screenY);
                ctx.lineTo(this.gridWidth * this.cellSize, screenY);
                ctx.stroke();
            }
        }
        
        // Highlight valid placement areas when tower/building is selected
        if (this.showPlacementPreview && this.previewGridX !== undefined && this.previewGridY !== undefined) {
            const isBuilding = this.previewSize === 4;
            const canPlace = isBuilding ? 
                this.canPlaceBuilding(this.previewGridX, this.previewGridY, this.previewSize, this.previewTowerManager) :
                this.canPlaceTower(this.previewGridX, this.previewGridY, this.previewTowerManager);
            
            ctx.fillStyle = canPlace ? 'rgba(0, 255, 0, 0.4)' : 'rgba(255, 0, 0, 0.4)';
            
            const size = this.previewSize * this.cellSize;
            // Center the preview on the grid cell
            const centerX = (this.previewGridX + this.previewSize / 2) * this.cellSize;
            const centerY = (this.previewGridY + this.previewSize / 2) * this.cellSize;
            ctx.fillRect(centerX - size / 2, centerY - size / 2, size, size);
            
            // Add border to preview
            ctx.strokeStyle = canPlace ? 'rgba(0, 255, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)';
            ctx.lineWidth = 2;
            ctx.strokeRect(centerX - size / 2, centerY - size / 2, size, size);
        }
        
        // DEBUG: Render occupied cells (REMOVE THIS AFTER DEBUGGING)
        const showDebugOccupied = false; // Set to true to see occupied cells
        if (showDebugOccupied) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
            for (const posStr of this.occupiedCells) {
                const [x, y] = posStr.split(',').map(Number);
                ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
            }
        }
    }
    
    setPlacementPreview(screenX, screenY, show = true, towerManager = null, size = 2) {
        this.showPlacementPreview = show;
        this.previewTowerManager = towerManager;
        this.previewSize = size;
        if (show) {
            const { gridX, gridY } = this.screenToGrid(screenX, screenY);
            this.previewGridX = gridX;
            this.previewGridY = gridY;
        }
    }
}
