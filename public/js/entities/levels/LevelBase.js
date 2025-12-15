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
        
        // Terrain elements (trees, rocks, water) from level designer
        this.terrainElements = [];
        
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
    
    /**
     * Build an enhanced path that includes guard post waypoints inserted at their positions
     * This ensures enemies will naturally stop at guard post locations
     */
    buildEnhancedPathWithGuardPosts(towers) {
        if (!this.path || this.path.length < 2) {
            return this.path;
        }
        
        // Filter for guard posts with defenders
        const guardPosts = towers ? towers.filter(t => t.type === 'guard-post' && t.defender && t.defenderWaypoint) : [];
        
        if (guardPosts.length === 0) {
            return this.path;
        }
        
        // Create an enhanced path with guard post waypoints inserted
        const enhancedPath = [];
        
        for (let i = 0; i < this.path.length - 1; i++) {
            const currentWaypoint = this.path[i];
            const nextWaypoint = this.path[i + 1];
            
            enhancedPath.push(currentWaypoint);
            
            // Find guard posts that should be inserted between these waypoints
            const guardPostsForSegment = guardPosts.filter(gp => {
                const gpWaypoint = gp.defenderWaypoint;
                // Check if guard post is on this segment
                const dx = nextWaypoint.x - currentWaypoint.x;
                const dy = nextWaypoint.y - currentWaypoint.y;
                const lengthSquared = dx * dx + dy * dy;
                
                if (lengthSquared === 0) return false;
                
                // Project guard post onto segment
                const t = Math.max(0, Math.min(1,
                    ((gpWaypoint.x - currentWaypoint.x) * dx + (gpWaypoint.y - currentWaypoint.y) * dy) / lengthSquared
                ));
                
                // Check if projection is on this segment (not at endpoints)
                return t > 0.01 && t < 0.99;
            });
            
            // Sort guard posts by distance along segment and add them
            if (guardPostsForSegment.length > 0) {
                guardPostsForSegment.sort((a, b) => {
                    const dx = nextWaypoint.x - currentWaypoint.x;
                    const dy = nextWaypoint.y - currentWaypoint.y;
                    const lengthSquared = dx * dx + dy * dy;
                    
                    const tA = ((a.defenderWaypoint.x - currentWaypoint.x) * dx + (a.defenderWaypoint.y - currentWaypoint.y) * dy) / lengthSquared;
                    const tB = ((b.defenderWaypoint.x - currentWaypoint.x) * dx + (b.defenderWaypoint.y - currentWaypoint.y) * dy) / lengthSquared;
                    
                    return tA - tB;
                });
                
                guardPostsForSegment.forEach(gp => {
                    enhancedPath.push({
                        x: gp.defenderWaypoint.x,
                        y: gp.defenderWaypoint.y,
                        isGuardPostWaypoint: true,
                        guardPost: gp
                    });
                });
            }
        }
        
        // Add final waypoint
        enhancedPath.push(this.path[this.path.length - 1]);
        
        return enhancedPath;
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
            this.castleLoadPromise = this.createCastle();
            
            // Don't wait for castle here - it will load asynchronously
            // The castleLoadPromise can be awaited if needed
            
            // Clear and recalculate occupied cells
            this.occupiedCells.clear();
            this.markPathCells();
            this.markTerrainCells();
            
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

    markTerrainCells() {
        // Mark terrain element cells (trees, rocks, water) as occupied
        // This prevents towers and buildings from being placed on terrain
        if (!this.terrainElements || this.terrainElements.length === 0) {
            return;
        }

        this.terrainElements.forEach(element => {
            const gridX = Math.floor(element.gridX);
            const gridY = Math.floor(element.gridY);
            const radius = element.size * 0.6; // Slightly smaller than visual size for gameplay
            
            // Mark cells within the terrain element's radius
            for (let x = gridX - Math.ceil(radius); x <= gridX + Math.ceil(radius); x++) {
                for (let y = gridY - Math.ceil(radius); y <= gridY + Math.ceil(radius); y++) {
                    if (!this.isValidGridPosition(x, y)) continue;
                    
                    // Calculate distance from cell center to terrain center
                    const cellCenterX = x + 0.5;
                    const cellCenterY = y + 0.5;
                    const distance = Math.hypot(cellCenterX - element.gridX, cellCenterY - element.gridY);
                    
                    // Mark cell if within radius
                    if (distance <= radius) {
                        this.occupiedCells.add(`${x},${y}`);
                    }
                }
            }
        });
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
    
    /**
     * Create castle at the end of the path
     * Returns a Promise that resolves when castle is ready
     */
    createCastle() {
        return new Promise((resolve, reject) => {
            const pathEnd = this.path[this.path.length - 1];
            const castleGridX = Math.floor(pathEnd.x / this.cellSize) + 2;
            const castleGridY = Math.floor(pathEnd.y / this.cellSize) - 2;
            
            const castleScreenX = (castleGridX + 1.5) * this.cellSize;
            const castleScreenY = (castleGridY + 1.5) * this.cellSize;
            
            // Load the real Castle class and create instance
            import('../buildings/Castle.js').then(module => {
                this.castle = new module.Castle(castleScreenX, castleScreenY, castleGridX, castleGridY);
                console.log('LevelBase: Castle loaded successfully');
                resolve();
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
                    defender: null,
                    defenderDeadCooldown: 0,
                    maxDefenderCooldown: 10,
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
                    },
                    update: function(deltaTime) {
                        // Fallback update
                    }
                };
                reject(err);
            });
            
            // Mark castle cells as occupied immediately (3x3 size)
            for (let x = castleGridX; x < castleGridX + 3; x++) {
                for (let y = castleGridY; y < castleGridY + 3; y++) {
                    this.occupiedCells.add(`${x},${y}`);
                }
            }
        }); // End of Promise constructor
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
        
        // Render terrain elements (trees, rocks, water)
        this.renderTerrainElements(ctx);
        
        // Render the path
        this.renderPath(ctx);
        
        // Render castle - NOTE: Castle is now rendered by GameplayState after buildings/towers
        // This ensures proper z-ordering so the castle appears in front of buildings behind it
        // if (this.castle) {
        //     this.castle.render(ctx);
        // }
        
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

    renderTerrainElements(ctx) {
        if (!this.terrainElements || this.terrainElements.length === 0) {
            return;
        }

        this.terrainElements.forEach(element => {
            const screenX = element.gridX * this.cellSize;
            const screenY = element.gridY * this.cellSize;
            const size = element.size * this.cellSize;

            switch (element.type) {
                case 'tree':
                    this.renderTree(ctx, screenX, screenY, size, element.gridX, element.gridY);
                    break;
                case 'rock':
                    this.renderRock(ctx, screenX, screenY, size, element.gridX, element.gridY);
                    break;
                case 'water':
                    if (element.waterType === 'river') {
                        this.renderRiver(ctx, screenX, screenY, size, element.flowAngle);
                    } else {
                        this.renderLake(ctx, screenX, screenY, size);
                    }
                    break;
            }
        });
    }

    renderTree(ctx, x, y, size, gridX, gridY) {
        const seed = Math.floor(gridX + gridY) % 4;
        switch(seed) {
            case 0:
                this.renderTreeType1(ctx, x, y, size);
                break;
            case 1:
                this.renderTreeType2(ctx, x, y, size);
                break;
            case 2:
                this.renderTreeType3(ctx, x, y, size);
                break;
            default:
                this.renderTreeType4(ctx, x, y, size);
        }
    }

    renderTreeType1(ctx, x, y, size) {
        const trunkWidth = size * 0.25;
        const trunkHeight = size * 0.5;
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(x - trunkWidth * 0.5, y, trunkWidth, trunkHeight);
        ctx.fillStyle = '#3E2723';
        ctx.fillRect(x, y, trunkWidth * 0.5, trunkHeight);
        ctx.fillStyle = '#0D3817';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.6);
        ctx.lineTo(x + size * 0.35, y - size * 0.1);
        ctx.lineTo(x - size * 0.35, y - size * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.35);
        ctx.lineTo(x + size * 0.3, y + size * 0.05);
        ctx.lineTo(x - size * 0.3, y + size * 0.05);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.15);
        ctx.lineTo(x + size * 0.25, y + size * 0.2);
        ctx.lineTo(x - size * 0.25, y + size * 0.2);
        ctx.closePath();
        ctx.fill();
    }

    renderTreeType2(ctx, x, y, size) {
        const trunkWidth = size * 0.2;
        const trunkHeight = size * 0.4;
        ctx.fillStyle = '#6B4423';
        ctx.fillRect(x - trunkWidth * 0.5, y, trunkWidth, trunkHeight);
        ctx.fillStyle = '#8B5A3C';
        ctx.fillRect(x - trunkWidth * 0.5 + trunkWidth * 0.6, y, trunkWidth * 0.4, trunkHeight);
        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.1, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.35, size * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#43A047';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.55, size * 0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    renderTreeType3(ctx, x, y, size) {
        // Sparse tree with distinct branches
        const trunkWidth = size * 0.22;
        ctx.fillStyle = '#795548';
        ctx.fillRect(x - trunkWidth * 0.5, y - size * 0.2, trunkWidth, size * 0.6);
        ctx.fillStyle = '#4E342E';
        ctx.beginPath();
        ctx.arc(x + trunkWidth * 0.25, y, trunkWidth * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.arc(x - size * 0.28, y - size * 0.35, size * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + size * 0.28, y - size * 0.3, size * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.55, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    renderTreeType4(ctx, x, y, size) {
        // Pine/Spruce style with layered triangles
        const trunkWidth = size * 0.18;
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x - trunkWidth * 0.5, y - size * 0.05, trunkWidth, size * 0.45);
        ctx.fillStyle = '#0D3817';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.05);
        ctx.lineTo(x + size * 0.38, y + size * 0.15);
        ctx.lineTo(x - size * 0.38, y + size * 0.15);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.25);
        ctx.lineTo(x + size * 0.3, y);
        ctx.lineTo(x - size * 0.3, y);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.45);
        ctx.lineTo(x + size * 0.2, y - size * 0.15);
        ctx.lineTo(x - size * 0.2, y - size * 0.15);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#43A047';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.6);
        ctx.lineTo(x + size * 0.12, y - size * 0.45);
        ctx.lineTo(x - size * 0.12, y - size * 0.45);
        ctx.closePath();
        ctx.fill();
    }

    renderRock(ctx, x, y, size, gridX, gridY) {
        const seed = Math.floor(gridX * 0.5 + gridY * 0.7) % 4;
        switch(seed) {
            case 0:
                this.renderRockType1(ctx, x, y, size);
                break;
            case 1:
                this.renderRockType2(ctx, x, y, size);
                break;
            case 2:
                this.renderRockType3(ctx, x, y, size);
                break;
            default:
                this.renderRockType4(ctx, x, y, size);
        }
    }

    renderRockType1(ctx, x, y, size) {
        ctx.fillStyle = '#455A64';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.3, y - size * 0.15);
        ctx.lineTo(x - size * 0.25, y - size * 0.35);
        ctx.lineTo(x, y - size * 0.38);
        ctx.lineTo(x + size * 0.32, y - size * 0.18);
        ctx.lineTo(x + size * 0.28, y + size * 0.2);
        ctx.lineTo(x, y + size * 0.35);
        ctx.lineTo(x - size * 0.32, y + size * 0.18);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#263238';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.28, y + size * 0.2);
        ctx.lineTo(x + size * 0.32, y - size * 0.18);
        ctx.lineTo(x + size * 0.12, y - size * 0.08);
        ctx.lineTo(x, y + size * 0.35);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#90A4AE';
        ctx.beginPath();
        ctx.arc(x - size * 0.15, y - size * 0.2, size * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#1A1A1A';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x - size * 0.3, y - size * 0.15);
        ctx.lineTo(x - size * 0.25, y - size * 0.35);
        ctx.lineTo(x, y - size * 0.38);
        ctx.lineTo(x + size * 0.32, y - size * 0.18);
        ctx.lineTo(x + size * 0.28, y + size * 0.2);
        ctx.lineTo(x, y + size * 0.35);
        ctx.lineTo(x - size * 0.32, y + size * 0.18);
        ctx.closePath();
        ctx.stroke();
    }

    renderRockType2(ctx, x, y, size) {
        ctx.fillStyle = '#546E7A';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.33, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#37474F';
        ctx.beginPath();
        ctx.arc(x + size * 0.15, y + size * 0.15, size * 0.33, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#9E9E9E';
        ctx.beginPath();
        ctx.arc(x - size * 0.12, y - size * 0.15, size * 0.15, 0, Math.PI * 2);
        ctx.fill();
        [{x: -0.18, y: 0.1, r: 0.08}, {x: 0.22, y: -0.12, r: 0.07}, {x: 0.08, y: 0.22, r: 0.06}].forEach(bump => {
            ctx.beginPath();
            ctx.arc(x + bump.x * size, y + bump.y * size, size * bump.r, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.strokeStyle = '#1A1A1A';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.33, 0, Math.PI * 2);
        ctx.stroke();
    }

    renderRockType3(ctx, x, y, size) {
        ctx.fillStyle = '#37474F';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.32, y - size * 0.15);
        ctx.lineTo(x + size * 0.35, y - size * 0.2);
        ctx.lineTo(x + size * 0.3, y + size * 0.25);
        ctx.lineTo(x - size * 0.35, y + size * 0.2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#78909C';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.32, y - size * 0.15);
        ctx.lineTo(x + size * 0.35, y - size * 0.2);
        ctx.lineTo(x, y - size * 0.05);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - size * 0.1, y - size * 0.15);
        ctx.lineTo(x + size * 0.1, y + size * 0.15);
        ctx.stroke();
        ctx.strokeStyle = '#1A1A1A';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x - size * 0.32, y - size * 0.15);
        ctx.lineTo(x + size * 0.35, y - size * 0.2);
        ctx.lineTo(x + size * 0.3, y + size * 0.25);
        ctx.lineTo(x - size * 0.35, y + size * 0.2);
        ctx.closePath();
        ctx.stroke();
    }

    renderRockType4(ctx, x, y, size) {
        ctx.fillStyle = '#455A64';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.35);
        ctx.lineTo(x + size * 0.33, y + size * 0.15);
        ctx.lineTo(x - size * 0.33, y + size * 0.15);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#263238';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.35);
        ctx.lineTo(x + size * 0.33, y + size * 0.15);
        ctx.lineTo(x, y + size * 0.08);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#90A4AE';
        ctx.beginPath();
        ctx.arc(x - size * 0.12, y - size * 0.15, size * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - size * 0.15, y - size * 0.1);
        ctx.lineTo(x + size * 0.1, y + size * 0.12);
        ctx.stroke();
        ctx.strokeStyle = '#1A1A1A';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.35);
        ctx.lineTo(x + size * 0.33, y + size * 0.15);
        ctx.lineTo(x - size * 0.33, y + size * 0.15);
        ctx.closePath();
        ctx.stroke();
    }

    renderLake(ctx, x, y, size) {
        // Create organic water shape with rounded edges instead of squares
        const radius = size * 0.4;
        
        // Water gradient
        const gradient = ctx.createRadialGradient(x - size * 0.1, y - size * 0.1, 0, x, y, radius * 1.2);
        gradient.addColorStop(0, '#0277BD');
        gradient.addColorStop(0.6, '#01579B');
        gradient.addColorStop(1, '#004D7A');
        ctx.fillStyle = gradient;
        
        // Draw organic water shape with perlin-like noise using sine waves
        ctx.beginPath();
        const points = 16;
        for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2;
            // Add sine-based variation to radius for organic look
            const noise = Math.sin(angle * 3 + x * 0.1 + y * 0.1) * 0.15 + Math.sin(angle * 7 + x * 0.05) * 0.1;
            const currentRadius = radius * (0.8 + noise);
            const px = x + Math.cos(angle) * currentRadius;
            const py = y + Math.sin(angle) * currentRadius;
            
            if (i === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.closePath();
        ctx.fill();
        
        // Water edge with soft border
        ctx.strokeStyle = '#0277BD';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Subtle wave reflections
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 2; i++) {
            const waveRadius = radius * (0.3 + i * 0.3);
            ctx.beginPath();
            const wavePoints = 12;
            for (let j = 0; j < wavePoints; j++) {
                const angle = (j / wavePoints) * Math.PI * 2;
                const waveNoise = Math.sin(angle * 2 + x * 0.1) * 0.1;
                const px = x + Math.cos(angle) * (waveRadius * (0.9 + waveNoise));
                const py = y + Math.sin(angle) * (waveRadius * (0.9 + waveNoise));
                if (j === 0) {
                    ctx.moveTo(px, py);
                } else {
                    ctx.lineTo(px, py);
                }
            }
            ctx.closePath();
            ctx.stroke();
        }
    }

    renderRiver(ctx, x, y, size, flowAngle) {
        // Draw river as elongated shape flowing in the direction of flowAngle
        const riverLength = size * 0.8;
        const riverWidth = size * 0.35;
        
        // Calculate river ends based on flow angle
        const endX = x + Math.cos(flowAngle) * riverLength * 0.5;
        const endY = y + Math.sin(flowAngle) * riverLength * 0.5;
        const startX = x - Math.cos(flowAngle) * riverLength * 0.5;
        const startY = y - Math.sin(flowAngle) * riverLength * 0.5;
        
        // Calculate perpendicular vector for width
        const perpAngle = flowAngle + Math.PI / 2;
        const perpX = Math.cos(perpAngle) * riverWidth;
        const perpY = Math.sin(perpAngle) * riverWidth;
        
        // Create water gradient along river flow
        const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
        gradient.addColorStop(0, '#0277BD');
        gradient.addColorStop(0.5, '#01579B');
        gradient.addColorStop(1, '#0277BD');
        ctx.fillStyle = gradient;
        
        // Draw river as curved shape with banks
        ctx.beginPath();
        // Top bank with gentle curve
        ctx.moveTo(startX + perpX, startY + perpY);
        ctx.quadraticCurveTo(
            x + perpX + Math.cos(flowAngle) * riverWidth * 0.3,
            y + perpY + Math.sin(flowAngle) * riverWidth * 0.3,
            endX + perpX,
            endY + perpY
        );
        // Bottom bank with gentle curve back
        ctx.quadraticCurveTo(
            x - perpX + Math.cos(flowAngle) * riverWidth * 0.3,
            y - perpY + Math.sin(flowAngle) * riverWidth * 0.3,
            startX - perpX,
            startY - perpY
        );
        ctx.closePath();
        ctx.fill();
        
        // River edges for definition
        ctx.strokeStyle = '#0277BD';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Add subtle flow direction lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 3; i++) {
            const t = (i + 1) / 4;
            const flowX = startX + (endX - startX) * t;
            const flowY = startY + (endY - startY) * t;
            const flowMarkLength = riverWidth * 0.4;
            ctx.beginPath();
            ctx.moveTo(
                flowX - Math.cos(flowAngle) * flowMarkLength,
                flowY - Math.sin(flowAngle) * flowMarkLength
            );
            ctx.lineTo(
                flowX + Math.cos(flowAngle) * flowMarkLength,
                flowY + Math.sin(flowAngle) * flowMarkLength
            );
            ctx.stroke();
        }
    }
}

