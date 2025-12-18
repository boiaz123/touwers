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
        this.backgroundCanvas = null; // Cache for pre-rendered background
        
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
            
            // CRITICAL: Clear the cached background canvas so it gets rerendered with new visuals
            this.backgroundCanvas = null;
            
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
        
        // Generate natural ground texture patches (organic, not square)
        this.dirtPatches = [];
        const groundTextureCount = Math.floor(canvasWidth * canvasHeight / 15000); // Natural distribution
        for (let i = 0; i < groundTextureCount; i++) {
            // Create more varied and organic texture distribution
            const textureType = Math.floor(Math.random() * 5);
            
            // Different patch sizes based on texture type for more natural appearance
            let sizeX, sizeY;
            if (textureType === 0) {
                // Soil patches - medium, organic
                sizeX = Math.random() * 50 + 40;
                sizeY = Math.random() * 35 + 30;
            } else if (textureType === 1) {
                // Moss - irregular shapes, smaller
                sizeX = Math.random() * 35 + 20;
                sizeY = Math.random() * 30 + 15;
            } else if (textureType === 2) {
                // Pebbles - scattered pattern, varied
                sizeX = Math.random() * 40 + 25;
                sizeY = Math.random() * 35 + 20;
            } else if (textureType === 3) {
                // Clay/mud - larger, flowing shapes
                sizeX = Math.random() * 70 + 50;
                sizeY = Math.random() * 45 + 35;
            } else {
                // Leaf litter - small, scattered
                sizeX = Math.random() * 30 + 15;
                sizeY = Math.random() * 25 + 12;
            }
            
            this.dirtPatches.push({
                x: Math.random() * canvasWidth,
                y: Math.random() * canvasHeight,
                sizeX: sizeX,
                sizeY: sizeY,
                rotation: Math.random() * Math.PI * 2,
                textureType: textureType,
                intensity: Math.random() * 0.35 + 0.15,
                irregularity: Math.random() * 0.6 + 0.4 // How irregular/organic the patch is
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
        
        // Render cached dirt patches with improved textures
        this.dirtPatches.forEach(patch => {
            ctx.save();
            ctx.translate(patch.x, patch.y);
            ctx.rotate(patch.rotation);
            
            // Different ground texture types with organic appearance
            switch (patch.textureType) {
                case 0: // Soil - organic splotch with irregular edges
                    ctx.fillStyle = `rgba(92, 64, 51, ${patch.intensity})`;
                    // Create irregular blob shape instead of perfect ellipse
                    this.drawIrregularBlob(ctx, 0, 0, patch.sizeX, patch.sizeY, patch.irregularity, 1);
                    ctx.fill();
                    
                    // Add subtle inner variation
                    ctx.fillStyle = `rgba(76, 51, 40, ${patch.intensity * 0.5})`;
                    this.drawIrregularBlob(ctx, patch.sizeX * 0.2, patch.sizeY * 0.2, 
                        patch.sizeX * 0.4, patch.sizeY * 0.3, patch.irregularity, 1);
                    ctx.fill();
                    break;
                    
                case 1: // Moss/algae - subtle greenish with natural spreading
                    ctx.fillStyle = `rgba(80, 100, 60, ${patch.intensity * 0.7})`;
                    this.drawIrregularBlob(ctx, 0, 0, patch.sizeX * 0.8, patch.sizeY * 0.8, 
                        patch.irregularity * 1.2, 0.8);
                    ctx.fill();
                    
                    // Add some darker moss spots
                    ctx.fillStyle = `rgba(60, 80, 40, ${patch.intensity * 0.4})`;
                    for (let i = 0; i < 3; i++) {
                        const offsetX = (Math.sin(i * 1.3 + patch.x * 0.01) - 0.5) * patch.sizeX * 0.4;
                        const offsetY = (Math.cos(i * 1.3 + patch.y * 0.01) - 0.5) * patch.sizeY * 0.3;
                        this.drawIrregularBlob(ctx, offsetX, offsetY, patch.sizeX * 0.3, 
                            patch.sizeY * 0.25, patch.irregularity, 0.7);
                        ctx.fill();
                    }
                    break;
                    
                case 2: // Scattered pebbles - rocky terrain
                    ctx.fillStyle = `rgba(110, 110, 110, ${patch.intensity})`;
                    for (let i = 0; i < 8; i++) {
                        const offsetX = (Math.sin(i * 2.1 + patch.x * 0.005) - 0.5) * patch.sizeX;
                        const offsetY = (Math.cos(i * 2.1 + patch.y * 0.005) - 0.5) * patch.sizeY;
                        const size = Math.random() * 5 + 3;
                        ctx.beginPath();
                        ctx.arc(offsetX, offsetY, size, 0, Math.PI * 2);
                        ctx.fill();
                        
                        // Rock shadow
                        ctx.fillStyle = `rgba(80, 80, 80, ${patch.intensity * 0.6})`;
                        ctx.beginPath();
                        ctx.arc(offsetX + 1, offsetY + 1, size * 0.6, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.fillStyle = `rgba(110, 110, 110, ${patch.intensity})`;
                    }
                    break;
                    
                case 3: // Clay/dirt - warmer tone with flowing texture
                    ctx.fillStyle = `rgba(120, 80, 40, ${patch.intensity * 0.8})`;
                    this.drawIrregularBlob(ctx, 0, 0, patch.sizeX, patch.sizeY, 
                        patch.irregularity * 0.9, 1);
                    ctx.fill();
                    
                    // Add cracks/texture lines for clay appearance
                    ctx.strokeStyle = `rgba(100, 60, 20, ${patch.intensity * 0.25})`;
                    ctx.lineWidth = 0.8;
                    const cracksCount = Math.floor(3 + patch.irregularity * 2);
                    for (let i = 0; i < cracksCount; i++) {
                        const startX = (Math.sin(i * 0.5 + patch.x * 0.02) - 0.5) * patch.sizeX * 0.8;
                        const startY = (Math.cos(i * 0.5 + patch.y * 0.02) - 0.5) * patch.sizeY * 0.6;
                        const endX = startX + (Math.sin(i * 1.3 + patch.x * 0.03) - 0.5) * patch.sizeX * 0.4;
                        const endY = startY + (Math.cos(i * 1.3 + patch.y * 0.03) - 0.5) * patch.sizeY * 0.4;
                        ctx.beginPath();
                        ctx.moveTo(startX, startY);
                        ctx.lineTo(endX, endY);
                        ctx.stroke();
                    }
                    break;
                    
                case 4: // Leaf litter - scattered autumn leaves
                    ctx.fillStyle = `rgba(139, 115, 85, ${patch.intensity * 0.6})`;
                    for (let i = 0; i < 6; i++) {
                        const offsetX = (Math.sin(i * 1.7 + patch.x * 0.008) - 0.5) * patch.sizeX;
                        const offsetY = (Math.cos(i * 1.7 + patch.y * 0.008) - 0.5) * patch.sizeY;
                        const leafSize = Math.random() * 3 + 2;
                        ctx.beginPath();
                        ctx.ellipse(offsetX, offsetY, leafSize, leafSize * 0.6, 
                            Math.random() * Math.PI, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    
                    // Darker decomposed leaves
                    ctx.fillStyle = `rgba(100, 80, 60, ${patch.intensity * 0.4})`;
                    this.drawIrregularBlob(ctx, 0, 0, patch.sizeX * 0.6, patch.sizeY * 0.5, 
                        patch.irregularity * 1.1, 0.6);
                    ctx.fill();
                    break;
            }
            
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
    
    drawCobblestoneBlock(ctx, x, y, width, height, seed) {
        // Draw a single cobblestone with realistic stone appearance
        const noise = Math.abs(Math.sin(seed * 0.1) * Math.cos(seed * 0.05));
        const colorVariation = 0.9 + noise * 0.2;
        
        // Base color with slight variation
        const baseColor = Math.floor(150 * colorVariation);
        const darkColor = Math.floor(120 * colorVariation);
        
        ctx.save();
        ctx.translate(x, y);
        
        // Slight rotation for organic look
        const rotation = Math.sin(seed * 0.2) * 0.05;
        ctx.rotate(rotation);
        
        // Main stone body
        ctx.fillStyle = `rgb(${baseColor}, ${Math.floor(130 * colorVariation)}, ${Math.floor(110 * colorVariation)})`;
        ctx.beginPath();
        ctx.rect(-width * 0.5, -height * 0.5, width, height);
        ctx.fill();
        
        // Border for stone separation
        ctx.strokeStyle = `rgba(60, 50, 40, 0.5)`;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Weathering and highlight for depth
        if (Math.sin(seed * 0.3) > 0) {
            // Light spot (top-left)
            ctx.fillStyle = `rgba(200, 190, 170, ${0.15 + Math.abs(Math.sin(seed * 0.4)) * 0.15})`;
            ctx.beginPath();
            ctx.arc(-width * 0.3, -height * 0.3, width * 0.15, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Dark spot (bottom-right)
            ctx.fillStyle = `rgba(80, 70, 60, ${0.15 + Math.abs(Math.cos(seed * 0.4)) * 0.15})`;
            ctx.beginPath();
            ctx.arc(width * 0.3, height * 0.3, width * 0.15, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Subtle texture lines
        if (Math.sin(seed * 0.6) > 0.5) {
            ctx.strokeStyle = `rgba(100, 90, 80, 0.2)`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(-width * 0.4, 0);
            ctx.lineTo(width * 0.4, 0);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    drawIrregularBlob(ctx, x, y, radiusX, radiusY, irregularity, waveIntensity) {
        // Draw an irregular organic blob using perlin-like noise
        const points = 20; // Number of points around the blob
        const path = [];
        
        for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2;
            
            // Add irregularity using seeded random variation
            const seed = x * 0.01 + y * 0.01 + i * 0.5;
            const noise = (Math.sin(seed * 0.5) + Math.cos(seed * 0.3)) * irregularity;
            const waveVariation = Math.sin(angle * 3 + seed) * waveIntensity * 0.5;
            
            const radius = 1 + noise * 0.3 + waveVariation;
            const px = Math.cos(angle) * radiusX * radius;
            const py = Math.sin(angle) * radiusY * radius;
            
            path.push({ x: px, y: py });
        }
        
        // Draw the irregular blob
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
            ctx.lineTo(path[i].x, path[i].y);
        }
        ctx.closePath();
    }
    
    renderPath(ctx) {
        // Path width should be exactly 2 grid cells wide for alignment
        const pathWidthPixels = this.cellSize * 2;
        
        // Generate path texture if needed
        this.generatePathTexture(ctx.canvas.width, ctx.canvas.height);
        
        // Draw smooth dirt road using canvas line rendering
        if (this.path && this.path.length >= 2) {
            // Layer 1: Dark shadow base for depth and grounding
            ctx.strokeStyle = 'rgba(40, 30, 25, 0.5)';
            ctx.lineWidth = pathWidthPixels + 8;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(this.path[0].x + 3, this.path[0].y + 3);
            for (let i = 1; i < this.path.length; i++) {
                ctx.lineTo(this.path[i].x + 3, this.path[i].y + 3);
            }
            ctx.stroke();
            
            // Layer 2: Main dirt road color - warm earth tones
            ctx.strokeStyle = 'rgba(170, 145, 110, 1)';
            ctx.lineWidth = pathWidthPixels;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            ctx.beginPath();
            ctx.moveTo(this.path[0].x, this.path[0].y);
            for (let i = 1; i < this.path.length; i++) {
                ctx.lineTo(this.path[i].x, this.path[i].y);
            }
            ctx.stroke();
            
            // Layer 3: Lighter center stripe - worn dirt from heavy use
            ctx.strokeStyle = 'rgba(190, 165, 135, 0.6)';
            ctx.lineWidth = pathWidthPixels * 0.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            ctx.beginPath();
            ctx.moveTo(this.path[0].x, this.path[0].y);
            for (let i = 1; i < this.path.length; i++) {
                ctx.lineTo(this.path[i].x, this.path[i].y);
            }
            ctx.stroke();
            
            // Layer 4: Subtle wheel rut on left side
            ctx.strokeStyle = 'rgba(120, 100, 80, 0.3)';
            ctx.lineWidth = pathWidthPixels * 0.12;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            ctx.beginPath();
            const perpX = this.path.length > 1 ? -(this.path[1].y - this.path[0].y) : 0;
            const perpY = this.path.length > 1 ? (this.path[1].x - this.path[0].x) : 0;
            const perpLen = Math.hypot(perpX, perpY);
            const normPerpX = perpLen > 0 ? perpX / perpLen : 0;
            const normPerpY = perpLen > 0 ? perpY / perpLen : 0;
            
            ctx.moveTo(this.path[0].x + normPerpX * pathWidthPixels * 0.22, 
                      this.path[0].y + normPerpY * pathWidthPixels * 0.22);
            for (let i = 1; i < this.path.length; i++) {
                // Calculate perpendicular for this segment
                let segPerpX = 0, segPerpY = 0;
                if (i < this.path.length - 1) {
                    const dx = this.path[i + 1].x - this.path[i - 1].x;
                    const dy = this.path[i + 1].y - this.path[i - 1].y;
                    const len = Math.hypot(dx, dy);
                    segPerpX = len > 0 ? -dy / len : 0;
                    segPerpY = len > 0 ? dx / len : 0;
                } else {
                    segPerpX = normPerpX;
                    segPerpY = normPerpY;
                }
                ctx.lineTo(this.path[i].x + segPerpX * pathWidthPixels * 0.22, 
                          this.path[i].y + segPerpY * pathWidthPixels * 0.22);
            }
            ctx.stroke();
            
            // Layer 5: Subtle wheel rut on right side
            ctx.beginPath();
            ctx.moveTo(this.path[0].x - normPerpX * pathWidthPixels * 0.22, 
                      this.path[0].y - normPerpY * pathWidthPixels * 0.22);
            for (let i = 1; i < this.path.length; i++) {
                let segPerpX = 0, segPerpY = 0;
                if (i < this.path.length - 1) {
                    const dx = this.path[i + 1].x - this.path[i - 1].x;
                    const dy = this.path[i + 1].y - this.path[i - 1].y;
                    const len = Math.hypot(dx, dy);
                    segPerpX = len > 0 ? -dy / len : 0;
                    segPerpY = len > 0 ? dx / len : 0;
                } else {
                    segPerpX = normPerpX;
                    segPerpY = normPerpY;
                }
                ctx.lineTo(this.path[i].x - segPerpX * pathWidthPixels * 0.22, 
                          this.path[i].y - segPerpY * pathWidthPixels * 0.22);
            }
            ctx.stroke();
            
            // Layer 6: Scattered small stones and pebbles on the road - subtle
            for (let i = 0; i < this.path.length - 1; i++) {
                const start = this.path[i];
                const end = this.path[i + 1];
                const dx = end.x - start.x;
                const dy = end.y - start.y;
                const dist = Math.hypot(dx, dy);
                const stepSize = 35;
                
                for (let d = 0; d < dist; d += stepSize) {
                    const t = d / dist;
                    const x = start.x + dx * t;
                    const y = start.y + dy * t;
                    
                    // Add scattered pebbles with seed-based pseudo-randomness
                    const seed = Math.floor(d / stepSize) + i * 100;
                    const pebbleChance = Math.abs(Math.sin(seed * 0.5));
                    
                    if (pebbleChance > 0.65) {
                        const offsetX = (Math.sin(seed * 0.3) - 0.5) * pathWidthPixels * 0.5;
                        const offsetY = (Math.cos(seed * 0.4) - 0.5) * pathWidthPixels * 0.5;
                        const pebbleSize = 1.5 + Math.abs(Math.sin(seed * 0.7)) * 2.5;
                        
                        ctx.fillStyle = `rgba(130, 115, 95, ${0.3 + Math.abs(Math.sin(seed)) * 0.2})`;
                        ctx.beginPath();
                        ctx.arc(x + offsetX, y + offsetY, pebbleSize, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }
            
            // Layer 7: Subtle dirt dust/wear marks at edges - very light
            for (let i = 0; i < this.path.length - 1; i++) {
                const start = this.path[i];
                const end = this.path[i + 1];
                const dx = end.x - start.x;
                const dy = end.y - start.y;
                const dist = Math.hypot(dx, dy);
                const steps = Math.ceil(dist / 20);
                
                for (let step = 0; step < steps; step++) {
                    const t = step / steps;
                    const x = start.x + dx * t;
                    const y = start.y + dy * t;
                    
                    // Calculate perpendicular at this point
                    let perpX = 0, perpY = 0;
                    if (i < this.path.length - 1) {
                        const segDx = this.path[i + 1].x - this.path[i].x;
                        const segDy = this.path[i + 1].y - this.path[i].y;
                        const segLen = Math.hypot(segDx, segDy);
                        perpX = segLen > 0 ? -segDy / segLen : 0;
                        perpY = segLen > 0 ? segDx / segLen : 0;
                    }
                    
                    // Add subtle dust at edges
                    const seed = Math.floor(x * 0.02) + Math.floor(y * 0.02) * 7;
                    const dustChance = Math.abs(Math.sin(seed * 0.3));
                    
                    if (dustChance > 0.7) {
                        ctx.fillStyle = `rgba(185, 160, 130, ${0.15 + Math.abs(Math.sin(seed * 2)) * 0.1})`;
                        const edgeOffset = (Math.sin(seed * 2) > 0 ? 1 : -1) * pathWidthPixels * 0.48;
                        ctx.beginPath();
                        ctx.arc(x + perpX * edgeOffset, y + perpY * edgeOffset, 
                               1.5 + Math.abs(Math.sin(seed * 1.5)) * 1, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }
        }
        
        // Mark path cells for collision detection and tower blocking (internal tracking only)
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
                
                // Only check immediate neighbors, not a 5x5 grid
                for (let offsetX = -1; offsetX <= 1; offsetX++) {
                    for (let offsetY = -1; offsetY <= 1; offsetY++) {
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
                        
                        // Mark cells for internal tracking - distance threshold kept conservative
                        if (distToPath <= pathWidthPixels * 0.35) {
                            pathCells.add(`${cellX},${cellY}`);
                        }
                    }
                }
            }
        }
        
        // Store pathCells for collision detection but don't render them
        this.pathCells = pathCells;
        
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
        this.renderPathEdge(ctx, this.pathCells);
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
        
        // Proper render order for natural terrain integration:
        // 1. Grass background (base layer)
        this.renderGrassBackground(ctx);
        
        // 2. Render terrain rocks/mountains FIRST - these form the landscape base
        this.renderTerrainElementsByType(ctx, ['rock', 'water']);
        
        // 3. Render smooth river overlays for blended corners and water effects
        this.renderRiverSmooth(ctx);
        
        // 4. Render path/road - on top of terrain and rivers
        this.renderPath(ctx);
        
        // 5. Render trees and vegetation - LAST, on top of everything
        this.renderTerrainElementsByType(ctx, ['tree']);
        
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
        if (this.showPlacementPreview) {
            // Special handling for guard-post placement preview
            if (this.previewTowerType === 'guard-post' && this.previewScreenX !== undefined && this.previewScreenY !== undefined) {
                this.renderGuardPostPlacementPreview(ctx);
            }
            // Regular grid-based placement preview for other towers and buildings
            else if (this.previewGridX !== undefined && this.previewGridY !== undefined) {
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
    
    setPlacementPreview(screenX, screenY, show = true, towerManager = null, size = 2, towerType = null) {
        this.showPlacementPreview = show;
        this.previewTowerManager = towerManager;
        this.previewSize = size;
        this.previewTowerType = towerType;
        if (show) {
            if (towerType === 'guard-post') {
                // For guard posts, store raw screen coordinates
                this.previewScreenX = screenX;
                this.previewScreenY = screenY;
            } else {
                // For regular towers/buildings, use grid coordinates
                const { gridX, gridY } = this.screenToGrid(screenX, screenY);
                this.previewGridX = gridX;
                this.previewGridY = gridY;
            }
        }
    }

    /**
     * Render placement preview for guard posts
     * Shows green when on path, red when off path
     */
    renderGuardPostPlacementPreview(ctx) {
        if (!this.path || this.path.length < 2) {
            return;
        }

        const x = this.previewScreenX;
        const y = this.previewScreenY;

        // Find the nearest point on the path
        let nearestPoint = null;
        let nearestDistance = Infinity;

        for (let i = 0; i < this.path.length - 1; i++) {
            const p1 = this.path[i];
            const p2 = this.path[i + 1];

            // Find closest point on this line segment
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const lengthSquared = dx * dx + dy * dy;

            if (lengthSquared === 0) {
                continue;
            }

            let t = ((x - p1.x) * dx + (y - p1.y) * dy) / lengthSquared;
            t = Math.max(0, Math.min(1, t));

            const closestX = p1.x + t * dx;
            const closestY = p1.y + t * dy;

            const distance = Math.hypot(closestX - x, closestY - y);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestPoint = { x: closestX, y: closestY };
            }
        }

        // Check distance to last waypoint as well
        const lastWaypoint = this.path[this.path.length - 1];
        const distanceToLast = Math.hypot(lastWaypoint.x - x, lastWaypoint.y - y);
        if (distanceToLast < nearestDistance) {
            nearestPoint = { x: lastWaypoint.x, y: lastWaypoint.y };
            nearestDistance = distanceToLast;
        }

        // Determine if close enough to path (within 60px)
        const isOnPath = nearestDistance <= 60;

        // Render the placement preview circle
        const radius = 25;
        ctx.fillStyle = isOnPath ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Add border
        ctx.strokeStyle = isOnPath ? 'rgba(0, 255, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Draw an indicator line from click point to path if not on path
        if (!isOnPath && nearestPoint) {
            ctx.strokeStyle = isOnPath ? 'rgba(0, 255, 0, 0.6)' : 'rgba(255, 0, 0, 0.6)';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(nearestPoint.x, nearestPoint.y);
            ctx.stroke();
            ctx.setLineDash([]);
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

    renderTerrainElementsByType(ctx, typeFilters) {
        if (!this.terrainElements || this.terrainElements.length === 0) {
            return;
        }

        this.terrainElements.forEach(element => {
            // Only render elements that match the type filters
            if (!typeFilters.includes(element.type)) {
                return;
            }

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
        // Large rough mountain-like rock with better depth and integration
        
        // Create layered shadow for depth effect
        ctx.fillStyle = 'rgba(30, 25, 20, 0.4)';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.36, y - size * 0.22);
        ctx.lineTo(x - size * 0.21, y - size * 0.38);
        ctx.lineTo(x + size * 0.06, y - size * 0.43);
        ctx.lineTo(x + size * 0.36, y - size * 0.13);
        ctx.lineTo(x + size * 0.35, y + size * 0.28);
        ctx.lineTo(x + 1, y + size * 0.42);
        ctx.lineTo(x - size * 0.34, y + size * 0.23);
        ctx.closePath();
        ctx.fill();
        
        // Main mountain body with multiple shades
        ctx.fillStyle = '#505050';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.35, y - size * 0.25);
        ctx.lineTo(x - size * 0.2, y - size * 0.4);
        ctx.lineTo(x + size * 0.05, y - size * 0.45);
        ctx.lineTo(x + size * 0.35, y - size * 0.15);
        ctx.lineTo(x + size * 0.32, y + size * 0.25);
        ctx.lineTo(x, y + size * 0.38);
        ctx.lineTo(x - size * 0.35, y + size * 0.2);
        ctx.closePath();
        ctx.fill();
        
        // Right shadow side for dimension
        ctx.fillStyle = '#343434';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.32, y + size * 0.25);
        ctx.lineTo(x + size * 0.35, y - size * 0.15);
        ctx.lineTo(x + size * 0.05, y - size * 0.45);
        ctx.lineTo(x + size * 0.08, y - size * 0.3);
        ctx.lineTo(x + size * 0.02, y + size * 0.32);
        ctx.closePath();
        ctx.fill();
        
        // Light highlights on top faces
        ctx.fillStyle = '#8a8a8a';
        for (let i = 0; i < 5; i++) {
            const offsetX = (Math.sin(i * 1.3 + x * 0.01) - 0.5) * size * 0.25;
            const offsetY = (Math.cos(i * 1.3 + y * 0.01) - 0.5) * size * 0.15;
            ctx.beginPath();
            ctx.arc(x + offsetX, y - size * 0.15 + offsetY, size * 0.06, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Weathering spots and moss - spread naturally
        ctx.fillStyle = 'rgba(90, 110, 70, 0.4)';
        for (let i = 0; i < 5; i++) {
            const offsetX = (Math.sin(i * 1.7 + x * 0.015) - 0.5) * size * 0.38;
            const offsetY = (Math.cos(i * 1.7 + y * 0.015) - 0.5) * size * 0.28;
            const spotSize = size * (0.08 + Math.abs(Math.sin(i * 0.7)) * 0.04);
            ctx.beginPath();
            ctx.arc(x + offsetX, y + offsetY, spotSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Rock cracks/texture
        ctx.strokeStyle = 'rgba(40, 35, 30, 0.3)';
        ctx.lineWidth = 1.5;
        const crackCount = 2 + Math.floor(Math.abs(Math.sin(x * 0.02)) * 2);
        for (let i = 0; i < crackCount; i++) {
            const startX = (Math.sin(i * 0.7 + x * 0.01) - 0.5) * size * 0.3;
            const startY = (Math.cos(i * 0.7 + y * 0.01) - 0.5) * size * 0.2;
            const endX = startX + (Math.sin(i * 1.2 + x * 0.02) - 0.5) * size * 0.2;
            const endY = startY + (Math.cos(i * 1.2 + y * 0.02) - 0.5) * size * 0.15;
            ctx.beginPath();
            ctx.moveTo(x + startX, y + startY);
            ctx.lineTo(x + endX, y + endY);
            ctx.stroke();
        }
        
        // Outline for definition
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x - size * 0.35, y - size * 0.25);
        ctx.lineTo(x - size * 0.2, y - size * 0.4);
        ctx.lineTo(x + size * 0.05, y - size * 0.45);
        ctx.lineTo(x + size * 0.35, y - size * 0.15);
        ctx.lineTo(x + size * 0.32, y + size * 0.25);
        ctx.lineTo(x, y + size * 0.38);
        ctx.lineTo(x - size * 0.35, y + size * 0.2);
        ctx.closePath();
        ctx.stroke();
        
        // Natural growth at base - connects mountain to ground
        ctx.fillStyle = 'rgba(100, 120, 80, 0.3)';
        ctx.beginPath();
        ctx.ellipse(x, y + size * 0.32, size * 0.4, size * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    renderRockType2(ctx, x, y, size) {
        // Rounded mountain form with better integration and detail
        
        // Shadow base for grounding
        ctx.fillStyle = 'rgba(30, 25, 20, 0.35)';
        ctx.beginPath();
        ctx.arc(x + 2, y + 2, size * 0.39, 0, Math.PI * 2);
        ctx.fill();
        
        // Main rounded mountain body
        ctx.fillStyle = '#595959';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.38, 0, Math.PI * 2);
        ctx.fill();
        
        // Darker overlay for form and depth
        ctx.fillStyle = '#414141';
        ctx.beginPath();
        ctx.arc(x + size * 0.12, y + size * 0.12, size * 0.34, 0, Math.PI * 2);
        ctx.fill();
        
        // Light highlights on upper portions
        ctx.fillStyle = '#9a9a9a';
        ctx.beginPath();
        ctx.arc(x - size * 0.15, y - size * 0.2, size * 0.18, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#888888';
        ctx.beginPath();
        ctx.arc(x - size * 0.25, y - size * 0.05, size * 0.12, 0, Math.PI * 2);
        ctx.fill();
        
        // Weathering and moss spread naturally across the mountain
        ctx.fillStyle = 'rgba(85, 105, 65, 0.35)';
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const distance = size * (0.15 + Math.abs(Math.sin(i * 0.5)) * 0.12);
            const vx = x + Math.cos(angle) * distance;
            const vy = y + Math.sin(angle) * distance;
            const spotSize = size * (0.09 + Math.abs(Math.cos(i * 0.7)) * 0.05);
            ctx.beginPath();
            ctx.arc(vx, vy, spotSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Darker moss in crevices
        ctx.fillStyle = 'rgba(60, 80, 45, 0.4)';
        for (let i = 0; i < 3; i++) {
            const angle = (i / 3 + 0.3) * Math.PI * 2;
            const vx = x + Math.cos(angle) * size * 0.2;
            const vy = y + Math.sin(angle) * size * 0.2;
            ctx.beginPath();
            ctx.arc(vx, vy, size * 0.07, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Subtle cracks for texture
        ctx.strokeStyle = 'rgba(40, 35, 30, 0.25)';
        ctx.lineWidth = 1.2;
        for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(
                x + Math.cos(angle) * size * 0.3,
                y + Math.sin(angle) * size * 0.3
            );
            ctx.stroke();
        }
        
        // Define outline
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.38, 0, Math.PI * 2);
        ctx.stroke();
        
        // Natural growth at base
        ctx.fillStyle = 'rgba(100, 120, 80, 0.25)';
        ctx.beginPath();
        ctx.ellipse(x, y + size * 0.34, size * 0.42, size * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    renderRockType3(ctx, x, y, size) {
        // Jagged angular mountain with better weathering and integration
        
        // Shadow base
        ctx.fillStyle = 'rgba(30, 25, 20, 0.35)';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.36, y - size * 0.09);
        ctx.lineTo(x - size * 0.1, y - size * 0.37);
        ctx.lineTo(x + size * 0.32, y - size * 0.17);
        ctx.lineTo(x + size * 0.36, y + size * 0.31);
        ctx.lineTo(x - size * 0.34, y + size * 0.28);
        ctx.closePath();
        ctx.fill();
        
        // Main mountain body
        ctx.fillStyle = '#535353';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.36, y - size * 0.12);
        ctx.lineTo(x - size * 0.1, y - size * 0.38);
        ctx.lineTo(x + size * 0.32, y - size * 0.18);
        ctx.lineTo(x + size * 0.35, y + size * 0.28);
        ctx.lineTo(x - size * 0.35, y + size * 0.25);
        ctx.closePath();
        ctx.fill();
        
        // Highlighted face (left side)
        ctx.fillStyle = '#8a8a8a';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.36, y - size * 0.12);
        ctx.lineTo(x - size * 0.1, y - size * 0.38);
        ctx.lineTo(x + size * 0.15, y - size * 0.1);
        ctx.closePath();
        ctx.fill();
        
        // Darker right side face
        ctx.fillStyle = '#414141';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.1, y - size * 0.38);
        ctx.lineTo(x + size * 0.32, y - size * 0.18);
        ctx.lineTo(x + size * 0.15, y - size * 0.1);
        ctx.closePath();
        ctx.fill();
        
        // Moss and weathering spots
        ctx.fillStyle = 'rgba(90, 110, 70, 0.35)';
        for (let i = 0; i < 5; i++) {
            const offsetX = (Math.sin(i * 1.5 + x * 0.01) - 0.5) * size * 0.35;
            const offsetY = (Math.cos(i * 1.5 + y * 0.01) - 0.5) * size * 0.25;
            const spotSize = size * (0.07 + Math.abs(Math.sin(i * 0.6)) * 0.04);
            ctx.beginPath();
            ctx.arc(x + offsetX, y + offsetY, spotSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Cracks for detail
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(x - size * 0.1, y - size * 0.2);
        ctx.lineTo(x + size * 0.1, y + size * 0.12);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x - size * 0.05, y - size * 0.35);
        ctx.lineTo(x + size * 0.15, y - size * 0.05);
        ctx.stroke();
        
        // Outline
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x - size * 0.36, y - size * 0.12);
        ctx.lineTo(x - size * 0.1, y - size * 0.38);
        ctx.lineTo(x + size * 0.32, y - size * 0.18);
        ctx.lineTo(x + size * 0.35, y + size * 0.28);
        ctx.lineTo(x - size * 0.35, y + size * 0.25);
        ctx.closePath();
        ctx.stroke();
        
        // Natural growth at base
        ctx.fillStyle = 'rgba(100, 120, 80, 0.25)';
        ctx.beginPath();
        ctx.ellipse(x, y + size * 0.3, size * 0.38, size * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    renderRockType4(ctx, x, y, size) {
        // Peaked mountain form with better depth and weathering
        
        // Shadow base
        ctx.fillStyle = 'rgba(30, 25, 20, 0.35)';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.39);
        ctx.lineTo(x + size * 0.39, y + size * 0.2);
        ctx.lineTo(x - size * 0.39, y + size * 0.2);
        ctx.closePath();
        ctx.fill();
        
        // Main mountain body
        ctx.fillStyle = '#575757';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.4);
        ctx.lineTo(x + size * 0.38, y + size * 0.18);
        ctx.lineTo(x - size * 0.38, y + size * 0.18);
        ctx.closePath();
        ctx.fill();
        
        // Light highlighted left face
        ctx.fillStyle = '#8a8a8a';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.4);
        ctx.lineTo(x - size * 0.38, y + size * 0.18);
        ctx.lineTo(x - size * 0.1, y - size * 0.05);
        ctx.closePath();
        ctx.fill();
        
        // Dark shadowed right side
        ctx.fillStyle = '#353535';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.4);
        ctx.lineTo(x + size * 0.38, y + size * 0.18);
        ctx.lineTo(x + size * 0.08, y - size * 0.08);
        ctx.closePath();
        ctx.fill();
        
        // Moss and weathering spread across slopes
        ctx.fillStyle = 'rgba(85, 105, 65, 0.35)';
        for (let i = 0; i < 6; i++) {
            const offsetX = (Math.sin(i * 1.3 + x * 0.01) - 0.5) * size * 0.3;
            const offsetY = (Math.cos(i * 1.3 + y * 0.01) - 0.5) * size * 0.22;
            const spotSize = size * (0.08 + Math.abs(Math.sin(i * 0.7)) * 0.05);
            ctx.beginPath();
            ctx.arc(x + offsetX, y + offsetY, spotSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Rocky texture detail
        ctx.fillStyle = 'rgba(100, 100, 100, 0.25)';
        for (let i = 0; i < 4; i++) {
            const offsetX = (Math.sin(i * 1.7 + x * 0.015) - 0.5) * size * 0.25;
            const offsetY = (Math.cos(i * 1.7 + y * 0.015) - 0.5) * size * 0.15;
            ctx.beginPath();
            ctx.arc(x + offsetX, y + offsetY, size * 0.06, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Peak highlight for dimension
        ctx.fillStyle = '#a0a0a0';
        ctx.beginPath();
        ctx.arc(x - size * 0.08, y - size * 0.25, size * 0.1, 0, Math.PI * 2);
        ctx.fill();
        
        // Outline
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.4);
        ctx.lineTo(x + size * 0.38, y + size * 0.18);
        ctx.lineTo(x - size * 0.38, y + size * 0.18);
        ctx.closePath();
        ctx.stroke();
        
        // Natural growth at base
        ctx.fillStyle = 'rgba(100, 120, 80, 0.25)';
        ctx.beginPath();
        ctx.ellipse(x, y + size * 0.2, size * 0.4, size * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();
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
        // River rendering is handled entirely by renderRiverSmooth()
        // No cell-based rendering needed - smooth line rendering creates the complete visualization
    }
    
    renderRiverSmooth(ctx) {
        // Draw smooth river paths using line rendering for automatic corner smoothing
        // This creates smooth corners where rivers meet
        if (!this.terrainElements) return;
        
        // Group river elements by connected segments
        const riverSegments = [];
        const processedIndices = new Set();
        
        for (let i = 0; i < this.terrainElements.length; i++) {
            const elem = this.terrainElements[i];
            if (elem.waterType !== 'river' || processedIndices.has(i)) continue;
            
            // Start a new river segment
            const segment = [elem];
            processedIndices.add(i);
            
            // Find connected river elements
            let added = true;
            while (added) {
                added = false;
                for (let j = 0; j < this.terrainElements.length; j++) {
                    if (processedIndices.has(j)) continue;
                    const candidate = this.terrainElements[j];
                    if (candidate.waterType !== 'river') continue;
                    
                    // Check if connected to end of segment
                    const lastElem = segment[segment.length - 1];
                    const dist = Math.hypot(
                        (candidate.gridX - lastElem.gridX) * this.cellSize,
                        (candidate.gridY - lastElem.gridY) * this.cellSize
                    );
                    
                    if (dist < this.cellSize * 2.5) {
                        segment.push(candidate);
                        processedIndices.add(j);
                        added = true;
                    }
                }
            }
            
            riverSegments.push(segment);
        }
        
        // Draw each river segment with smooth lines - filled shape with borders
        riverSegments.forEach(segment => {
            if (segment.length < 1) return;
            
            const path = segment.map(elem => ({
                x: elem.gridX * this.cellSize + this.cellSize / 2,
                y: elem.gridY * this.cellSize + this.cellSize / 2
            }));
            
            // Draw filled river shape with clear borders - matches designer appearance
            const riverWidthPixels = this.cellSize * 1.8;
            
            // Main river fill with smooth corners
            ctx.strokeStyle = '#0277BD';
            ctx.lineWidth = riverWidthPixels;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.globalAlpha = 0.95;
            
            ctx.beginPath();
            ctx.moveTo(path[0].x, path[0].y);
            for (let i = 1; i < path.length; i++) {
                ctx.lineTo(path[i].x, path[i].y);
            }
            ctx.stroke();
            
            // Add darker center channel for depth
            ctx.strokeStyle = '#004D7A';
            ctx.lineWidth = riverWidthPixels * 0.5;
            ctx.globalAlpha = 0.8;
            
            ctx.beginPath();
            ctx.moveTo(path[0].x, path[0].y);
            for (let i = 1; i < path.length; i++) {
                ctx.lineTo(path[i].x, path[i].y);
            }
            ctx.stroke();
            
            // Add light highlight for water shimmer
            ctx.strokeStyle = '#01579B';
            ctx.lineWidth = riverWidthPixels * 0.3;
            ctx.globalAlpha = 0.5;
            
            ctx.beginPath();
            ctx.moveTo(path[0].x, path[0].y);
            for (let i = 1; i < path.length; i++) {
                ctx.lineTo(path[i].x, path[i].y);
            }
            ctx.stroke();
            
            ctx.globalAlpha = 1;
        });
    }
}

