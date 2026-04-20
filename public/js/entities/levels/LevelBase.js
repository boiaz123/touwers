export class LevelBase {
    constructor(resolutionManager = null) {
        // Resolution manager - will be set during initialization
        this.resolutionManager = resolutionManager;
        
        // Campaign type - should be overridden by subclasses
        // Default to 'forest' but subclasses MUST set this to their campaign type
        this.campaign = 'forest';
        
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
        
        // Path texture cache (generated once per path layout)
        this.pathTexture = [];
        this.pathTextureGenerated = false;
        this.pathLeaves = [];
        this.backgroundCanvas = null; // Cache for pre-rendered background
        this.terrainCanvas = null;   // Cache for pre-rendered terrain (rocks, water, rivers, path, bg vegetation)
        this.terrainFgCanvas = null; // Cache for foreground vegetation (rendered after entities for Z-order)
        
        this.castle = null;
    }
    
    /**
     * Lighten a hex color by a certain amount
     * @param {string} color - Hex color (e.g., '#8b7355')
     * @param {number} amount - Amount to lighten (0-255)
     * @returns {string} RGB color string
     */
    lightenHexColor(color, amount) {
        // Handle both hex and rgb colors
        if (color.startsWith('#')) {
            const hex = color.replace('#', '');
            const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + amount);
            const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + amount);
            const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + amount);
            return `rgba(${r}, ${g}, ${b}, 0.6)`;
        }
        // If it's already an rgba/rgb color, just return a lighter version
        return color;
    }

    hexToRgba(color, alpha) {
        // Convert hex color (#RRGGBB) to RGBA object with specified alpha
        if (!color.startsWith('#')) {
            return { r: 100, g: 100, b: 100, a: alpha };
        }
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        return { r, g, b, a: alpha };
    }

    /**
     * Get the campaign type with multiple fallback checks
     * This ensures we always return the correct campaign
     */
    getCampaign() {
        // Try static levelMetadata first (most reliable)
        if (this.constructor && this.constructor.levelMetadata && this.constructor.levelMetadata.campaign) {
            const campaign = this.constructor.levelMetadata.campaign.toLowerCase();
            return campaign;
        }
        // Fall back to instance property
        if (this.campaign && typeof this.campaign === 'string') {
            return this.campaign.toLowerCase();
        }
        // Final default
        return 'forest';
    }
    
    // No-op stub — visual config is now fixed per campaign theme
    setVisualConfig(updates) {}
    
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

        if (this.constructor.name !== 'ForestLevel1' && this.constructor.name !== 'LevelBase') {
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
            
            // Clear and recalculate occupied cells
            this.occupiedCells.clear();
            this.markPathCells();
            this.markTerrainCells();
            
            // Create castle AFTER marking occupied cells so castle blocking is not erased
            this.castleLoadPromise = this.createCastle();
            
            // Reset path texture so it regenerates for new canvas dimensions
            this.pathTextureGenerated = false;
            this.pathLeaves = [];
            
            // CRITICAL: Clear the cached background canvas so it gets rerendered with new visuals
            this.backgroundCanvas = null;
            this.terrainCanvas = null;
            this.terrainFgCanvas = null;
            
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
        // Mark terrain element cells (trees, rocks, water, vegetation, cacti) as occupied
        // This prevents towers and buildings from being placed on terrain
        // Uses consistent collision detection across all campaigns
        if (!this.terrainElements || this.terrainElements.length === 0) {
            console.warn(`[${this.constructor.name}] No terrain elements to mark`);
            return;
        }


        this.terrainElements.forEach((element, idx) => {
            const gridX = element.gridX;
            const gridY = element.gridY;
            // Use provided size or default to 1.0 if not specified
            const size = element.size || 1.0;
            // Radius must be at least √0.5 ≈ 0.707 to mark the center cell
            // (distance from cell center to terrain center is √0.5 for diagonals)
            // Using 0.71 ensures size 1.0 blocks exactly 1 grid cell
            const radius = size * 0.71;
            
            if (typeof gridX !== 'number' || typeof gridY !== 'number') {
                console.warn(`[${this.constructor.name}] Terrain element ${idx} missing gridX/gridY:`, element);
                return;
            }
            
            let cellsMarked = 0;
            
            // Mark cells within the terrain element's radius
            for (let x = gridX - Math.ceil(radius); x <= gridX + Math.ceil(radius); x++) {
                for (let y = gridY - Math.ceil(radius); y <= gridY + Math.ceil(radius); y++) {
                    if (!this.isValidGridPosition(x, y)) continue;
                    
                    // Calculate distance from cell center to terrain center
                    const cellCenterX = x + 0.5;
                    const cellCenterY = y + 0.5;
                    const distance = Math.hypot(cellCenterX - gridX, cellCenterY - gridY);
                    
                    // Mark cell if within radius
                    // Apply same collision detection for all element types:
                    // - trees, vegetation, cacti (type: 'tree', 'vegetation', 'cactus', 'drybush')
                    // - rocks (type: 'rock')
                    // - water (type: 'water')
                    if (distance <= radius) {
                        this.occupiedCells.add(`${x},${y}`);
                        cellsMarked++;
                    }
                }
            }
            
            if (cellsMarked === 0) {
                console.warn(`[${this.constructor.name}] Element ${idx} (${element.type} at ${gridX},${gridY}, size=${size}) marked 0 cells! (radius=${radius})`);
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
                const cellKey = `${x},${y}`;
                if (!this.isValidGridPosition(x, y)) {
                    return false;
                }
                if (this.occupiedCells.has(cellKey)) {
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

    /**
     * Get the effective attack range for a tower type with current upgrades
     * Takes into account Training Grounds range upgrades
     * @param {string} towerType - Tower type key (e.g., 'archer', 'cannon')
     * @param {TowerManager} towerManager - TowerManager instance for accessing upgrades
     * @returns {number} - Effective tower range in pixels
     */
    getEffectiveTowerRange(towerType, towerManager) {
        // Use TowerManager's full upgrade calculation when available
        if (towerManager && typeof towerManager.getUpgradedTowerStats === 'function') {
            const stats = towerManager.getUpgradedTowerStats(towerType);
            if (stats && typeof stats.range === 'number') {
                return stats.range;
            }
        }

        // Fallback: base range without upgrades
        return this.getBaseTowerRange(towerType);
    }

    /**
     * Get base tower range without any upgrades
     * @param {string} towerType - Tower type key
     * @returns {number} - Base tower range in pixels
     */
    getBaseTowerRange(towerType) {
        const baseRanges = {
            'basic': 120,
            'cannon': 155,
            'archer': 155,
            'magic': 130,
            'barricade': 120,
            'poison': 130,
            'combination': 140,
            'guard-post': 0
        };
        return baseRanges[towerType] || 120;
    }
    
    isValidGridPosition(gridX, gridY) {
        // Use ResolutionManager if available
        if (this.resolutionManager) {
            return this.resolutionManager.isValidGridPosition(gridX, gridY);
        }
        return gridX >= 0 && gridX < this.gridWidth && 
               gridY >= 0 && gridY < this.gridHeight;
    }
    
    /**
     * Linear-congruential seeded RNG — deterministic, same seed always yields the same sequence.
     * @param {number} seed - Integer seed value
     * @returns {function} A no-argument function returning floats in [0, 1)
     */
    seededRng(seed) {
        let s = seed >>> 0;
        return () => {
            s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
            return s / 4294967296;
        };
    }

    generateAllVisualElements(canvasWidth, canvasHeight) {}


    generateDaisyPetals(centerX, centerY, rng = null) {
        const r = rng || Math.random.bind(Math);
        const petals = [];
        for (let petal = 0; petal < 6; petal++) {
            const angle = (petal / 6) * Math.PI * 2 + r() * 0.3;
            petals.push({
                x: centerX + Math.cos(angle) * 3,
                y: centerY + Math.sin(angle) * 3
            });
        }
        return petals;
    }
    
    generatePathTexture(canvasWidth, canvasHeight) {
        if (this.pathTextureGenerated) return;
        
        // Deterministic seeded RNG — path texture is consistent per campaign
        const campaignSeeds = { forest: 12345, mountain: 56789, desert: 90123, space: 34567 };
        const rng = this.seededRng((campaignSeeds[this.campaign] || 12345) + 99999);
        
        this.pathTexture = [];
        this.pathLeaves = [];
        const pathWidth = Math.max(40, Math.min(80, this.cellSize * 3));
        
        for (let i = 0; i < this.path.length - 1; i++) {
            const start = this.path[i];
            const end = this.path[i + 1];
            const distance = Math.hypot(end.x - start.x, end.y - start.y);
            const elements = Math.floor(distance / 15);
            
            for (let j = 0; j < elements; j++) {
                const t = j / elements;
                const baseX = start.x + (end.x - start.x) * t;
                const baseY = start.y + (end.y - start.y) * t;
                
                const elementCount = rng() < 0.6 ? 1 : 2;
                for (let k = 0; k < elementCount; k++) {
                    const offsetX = (rng() - 0.5) * pathWidth * 0.8;
                    const offsetY = (rng() - 0.5) * pathWidth * 0.8;
                    const sz = rng() * 6 + 2;
                    const shapeType = Math.floor(rng() * 4);
                    
                    this.pathTexture.push({
                        x: baseX + offsetX,
                        y: baseY + offsetY,
                        size: sz,
                        type: shapeType,
                        rotation: rng() * Math.PI * 2,
                        shade: rng() * 0.5 + 0.5,
                        stoneShape: shapeType === 3 ? this.generateStoneShape(sz, rng) : null
                    });
                }
            }
        }
        
        const leafCount = Math.floor(this.path.length * 0.8);
        for (let i = 0; i < leafCount; i++) {
            const pathIndex = Math.floor(rng() * (this.path.length - 1));
            const t = rng();
            const start = this.path[pathIndex];
            const end = this.path[pathIndex + 1];
            
            const clusterChance = rng() < 0.3 && this.pathLeaves.length > 0;
            let leafX, leafY;
            
            if (clusterChance) {
                const nearLeaf = this.pathLeaves[Math.floor(rng() * this.pathLeaves.length)];
                leafX = nearLeaf.x + (rng() - 0.5) * 30;
                leafY = nearLeaf.y + (rng() - 0.5) * 30;
            } else {
                leafX = start.x + (end.x - start.x) * t + (rng() - 0.5) * pathWidth * 0.6;
                leafY = start.y + (end.y - start.y) * t + (rng() - 0.5) * pathWidth * 0.6;
            }
            
            this.pathLeaves.push({
                x: leafX,
                y: leafY,
                size: rng() * 8 + 4,
                rotation: rng() * Math.PI * 2,
                color: rng() < 0.5 ? 'rgba(160, 82, 45, 0.6)' : 'rgba(139, 115, 85, 0.6)'
            });
        }
        
        this.pathTextureGenerated = true;
    }
    
    generateStoneShape(size, rng = Math.random.bind(Math)) {
        const sides = 5 + Math.floor(rng() * 3);
        const points = [];
        for (let i = 0; i < sides; i++) {
            const angle = (i / sides) * Math.PI * 2;
            const radius = size * (0.7 + rng() * 0.3);
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
    
    renderTerrainLayer(ctx) {
        // PRE-RENDER OPTIMIZATION: Cache static terrain to offscreen canvases.
        // Background canvas: rocks, water, rivers, path, and vegetation that sits
        // ABOVE (lower Y than) the castle front so it renders behind entities.
        // Foreground canvas: vegetation at Y >= castle front, rendered after entities.
        if (!this.terrainCanvas) {
            // Determine the Y threshold: vegetation at or below this Y is foreground.
            // Use pathEnd.y (= castle gate Y) as the split point.
            const pathEnd = this.path.length > 0 ? this.path[this.path.length - 1] : null;
            const fgThresholdY = pathEnd ? pathEnd.y : Infinity;

            this.terrainCanvas = document.createElement('canvas');
            this.terrainCanvas.width = ctx.canvas.width;
            this.terrainCanvas.height = ctx.canvas.height;
            const tCtx = this.terrainCanvas.getContext('2d');
            tCtx.resolutionManager = ctx.resolutionManager;

            // Background: rocks, water, rivers, path, and bg vegetation
            this.renderTerrainElementsByType(tCtx, ['rock', 'water']);
            this.renderRiverSmooth(tCtx);
            this.renderPath(tCtx);
            this.renderTerrainElementsByType(tCtx, ['vegetation', 'tree', 'cactus', 'drybush'], -Infinity, fgThresholdY);

            // Foreground: vegetation in front of (at or below) the castle gate
            this.terrainFgCanvas = document.createElement('canvas');
            this.terrainFgCanvas.width = ctx.canvas.width;
            this.terrainFgCanvas.height = ctx.canvas.height;
            const fgCtx = this.terrainFgCanvas.getContext('2d');
            fgCtx.resolutionManager = ctx.resolutionManager;
            this.renderTerrainElementsByType(fgCtx, ['vegetation', 'tree', 'cactus', 'drybush'], fgThresholdY, Infinity);
        }

        // Single drawImage call replaces all background terrain rendering
        ctx.drawImage(this.terrainCanvas, 0, 0);
    }

    renderForegroundTerrain(ctx) {
        if (this.terrainFgCanvas) {
            ctx.drawImage(this.terrainFgCanvas, 0, 0);
        }
    }
    
    _renderBackgroundToCanvas(ctx) {
        const canvas = ctx.canvas;
        const campaign = this.getCampaign();

        if (campaign === 'forest') {
            this._renderForestBackdrop(ctx, canvas.width, canvas.height);
        } else if (campaign === 'mountain') {
            this._renderMountainBackdrop(ctx, canvas.width, canvas.height);
        } else if (campaign === 'desert') {
            this._renderDesertBackdrop(ctx, canvas.width, canvas.height);
        } else {
            // space / Frog King's Realm
            this._renderSpaceBackdrop(ctx, canvas.width, canvas.height);
        }
    }

    // --- FOREST BACKDROP: semi-top-down perspective, horizon at top ---
    _renderForestBackdrop(ctx, w, h) {
        // Full forest floor — top-down, no sky. Rich layered greens, dark near camera.
        const ground = ctx.createLinearGradient(0, 0, 0, h);
        ground.addColorStop(0,    '#2a6012');
        ground.addColorStop(0.32, '#1c460a');
        ground.addColorStop(0.68, '#123206');
        ground.addColorStop(1,    '#081a02');
        ctx.fillStyle = ground;
        ctx.fillRect(0, 0, w, h);

        // Large ground colour variation — very faint, wide radial patches that break up
        // the flat gradient with darker shadow pools (under canopy) and slightly lighter
        // open clearings. All blended softly, no hard edges.
        [
            [0.25, 0.18, 0.22, 'rgba(10,30,4,0.18)'],
            [0.72, 0.24, 0.20, 'rgba(10,30,4,0.14)'],
            [0.48, 0.50, 0.26, 'rgba(8,26,2,0.16)'],
            [0.12, 0.64, 0.18, 'rgba(10,30,4,0.14)'],
            [0.84, 0.58, 0.20, 'rgba(10,30,4,0.18)'],
            [0.36, 0.80, 0.22, 'rgba(8,26,2,0.13)'],
        ].forEach(([fx, fy, frad, col]) => {
            const cx = w * fx, cy = h * fy, r = w * frad;
            const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
            grd.addColorStop(0, col);
            grd.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grd;
            ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
        });

        // Dappled canopy light — warm golden pools of sunlight filtering through the canopy.
        // Kept warm and natural, not oversaturated green.
        [
            [0.10, 0.09, 0.11, 0.13],
            [0.42, 0.06, 0.09, 0.12],
            [0.70, 0.12, 0.10, 0.11],
            [0.90, 0.07, 0.08, 0.12],
            [0.26, 0.32, 0.10, 0.11],
            [0.60, 0.26, 0.09, 0.10],
            [0.82, 0.36, 0.10, 0.12],
            [0.08, 0.54, 0.09, 0.10],
            [0.46, 0.50, 0.11, 0.13],
            [0.74, 0.56, 0.09, 0.11],
            [0.32, 0.72, 0.10, 0.11],
            [0.64, 0.76, 0.09, 0.10],
        ].forEach(([fx, fy, frad, alpha]) => {
            const cx = w * fx, cy = h * fy, r = w * frad;
            const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
            grd.addColorStop(0, `rgba(200,195,100,${alpha})`);
            grd.addColorStop(0.50, `rgba(140,160,50,${alpha * 0.38})`);
            grd.addColorStop(1,   'rgba(60,100,10,0)');
            ctx.fillStyle = grd;
            ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
        });

        // Sparse exposed dirt patches — soft warm brown radial gradients where soil
        // shows through the leaf cover. Low opacity, widely spaced, fully blended.
        [
            [0.16, 0.20, 0.08, 0.18],
            [0.52, 0.16, 0.07, 0.16],
            [0.80, 0.28, 0.09, 0.17],
            [0.06, 0.42, 0.07, 0.15],
            [0.38, 0.44, 0.08, 0.17],
            [0.68, 0.48, 0.07, 0.15],
            [0.92, 0.52, 0.08, 0.16],
            [0.24, 0.68, 0.09, 0.18],
            [0.58, 0.70, 0.07, 0.15],
            [0.84, 0.74, 0.08, 0.17],
            [0.14, 0.84, 0.07, 0.14],
            [0.46, 0.86, 0.09, 0.16],
        ].forEach(([fx, fy, frad, alpha]) => {
            const cx = w * fx, cy = h * fy, r = w * frad;
            const t = Math.abs(Math.sin(fx * 19.1 + fy * 11.3));
            const rb = 100 + Math.floor(t * 30);
            const gb = 62 + Math.floor(t * 18);
            const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
            grd.addColorStop(0, `rgba(${rb},${gb},18,${alpha})`);
            grd.addColorStop(1, `rgba(${rb},${gb},18,0)`);
            ctx.fillStyle = grd;
            ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
        });

        // Leaf litter — scattered pixel-sized dots in muted amber, rust and brown tones.
        // Purely pointillist, never reads as shapes, just organic colour noise on the floor.
        [
            [0.06,0.08],[0.14,0.13],[0.24,0.06],[0.35,0.11],[0.46,0.05],[0.57,0.10],[0.68,0.07],[0.79,0.12],[0.90,0.06],[0.97,0.10],
            [0.04,0.22],[0.13,0.28],[0.22,0.20],[0.32,0.26],[0.44,0.18],[0.54,0.25],[0.65,0.21],[0.76,0.27],[0.87,0.19],[0.95,0.24],
            [0.09,0.38],[0.20,0.34],[0.30,0.40],[0.41,0.36],[0.53,0.33],[0.62,0.39],[0.73,0.35],[0.83,0.41],[0.93,0.37],
            [0.07,0.55],[0.18,0.60],[0.28,0.52],[0.40,0.58],[0.51,0.54],[0.61,0.60],[0.72,0.53],[0.82,0.59],[0.92,0.55],
            [0.11,0.70],[0.23,0.75],[0.36,0.68],[0.48,0.73],[0.60,0.67],[0.71,0.74],[0.81,0.69],[0.94,0.72],
            [0.08,0.84],[0.20,0.88],[0.34,0.82],[0.47,0.87],[0.59,0.83],[0.72,0.89],[0.85,0.84],[0.96,0.86],
        ].forEach(([fx, fy]) => {
            const t = Math.abs(Math.sin(fx * 37.1 + fy * 23.9));
            // Alternate between amber, rust brown, and dark khaki
            let r, g, b;
            if (t < 0.33)      { r = 130; g = 78;  b = 20; }
            else if (t < 0.66) { r = 112; g = 58;  b = 12; }
            else               { r = 96;  g = 82;  b = 28; }
            const alpha = 0.22 + t * 0.18;
            const sz = t < 0.25 ? 2 : 1;
            ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
            ctx.fillRect(Math.floor(w * fx), Math.floor(h * fy), sz, sz);
        });

        // Foreground depth shadow
        const vgn = ctx.createLinearGradient(0, h * 0.78, 0, h);
        vgn.addColorStop(0, 'rgba(0,8,0,0)');
        vgn.addColorStop(1, 'rgba(0,8,0,0.46)');
        ctx.fillStyle = vgn;
        ctx.fillRect(0, h * 0.78, w, h * 0.22);

        // Side vignette — deep canopy shadow at edges
        const vigL = ctx.createLinearGradient(0, 0, w * 0.08, 0);
        vigL.addColorStop(0, 'rgba(0,12,0,0.28)');
        vigL.addColorStop(1, 'rgba(0,12,0,0)');
        ctx.fillStyle = vigL;
        ctx.fillRect(0, 0, w * 0.08, h);
        const vigR = ctx.createLinearGradient(w, 0, w * 0.92, 0);
        vigR.addColorStop(0, 'rgba(0,12,0,0.28)');
        vigR.addColorStop(1, 'rgba(0,12,0,0)');
        ctx.fillStyle = vigR;
        ctx.fillRect(w * 0.92, 0, w * 0.08, h);
    }

    // --- MOUNTAIN / SNOW BACKDROP: full snow field top-down, no sky ---
    _renderMountainBackdrop(ctx, w, h) {
        // Base: mixed exposed rock and compacted snow — deep blue-grey at bottom, pale icy at top
        const ground = ctx.createLinearGradient(0, 0, 0, h);
        ground.addColorStop(0,    '#dce8f0');
        ground.addColorStop(0.25, '#c2d2e2');
        ground.addColorStop(0.58, '#9aaec4');
        ground.addColorStop(1,    '#7890a8');
        ctx.fillStyle = ground;
        ctx.fillRect(0, 0, w, h);

        // Atmospheric light — pale haze at the far/top of the mountain
        const haze = ctx.createLinearGradient(0, 0, 0, h * 0.22);
        haze.addColorStop(0, 'rgba(240,248,255,0.55)');
        haze.addColorStop(1, 'rgba(240,248,255,0)');
        ctx.fillStyle = haze;
        ctx.fillRect(0, 0, w, h * 0.22);

        // Rock strata bands — jagged horizontal ledges that define mountain rockface layers.
        // Each band: a dark shadow underside + thin bright snow-dusted top edge.
        const strata = [
            // [fy, ampFrac, cycles, phase, shadowAlpha, lw]
            [0.18, 0.010, 2.1, 1.40, 0.18, h * 0.018],
            [0.28, 0.013, 2.4, 3.20, 0.17, h * 0.022],
            [0.38, 0.014, 1.9, 0.70, 0.18, h * 0.024],
            [0.48, 0.016, 2.3, 2.60, 0.19, h * 0.026],
            [0.58, 0.017, 2.0, 1.10, 0.18, h * 0.028],
            [0.68, 0.018, 2.2, 3.80, 0.19, h * 0.030],
            [0.80, 0.020, 1.8, 2.00, 0.18, h * 0.032],
        ];
        strata.forEach(([fy, ampFrac, cycles, phase, alpha, lw]) => {
            const baseY = h * fy;
            const amp = h * ampFrac;
            const freq = Math.PI * 2 * cycles;
            // Slightly jagged: mix two sine waves at non-harmonic frequencies
            const getY = (xf) =>
                baseY
                + Math.sin(xf * freq + phase) * amp
                + Math.sin(xf * freq * 0.73 + phase * 1.6) * amp * 0.44
                + Math.sin(xf * freq * 1.37 + phase * 0.9) * amp * 0.22;

            // Rock shadow beneath the ledge
            ctx.strokeStyle = `rgba(54,70,90,${alpha})`;
            ctx.lineWidth = lw;
            ctx.lineCap = 'round';
            ctx.beginPath();
            for (let i = 0; i <= w; i += 3) {
                const y = getY(i / w);
                if (i === 0) ctx.moveTo(i, y); else ctx.lineTo(i, y);
            }
            ctx.stroke();

            // Snow-dusted top of ledge — bright thin line just above the shadow
            ctx.strokeStyle = `rgba(225,238,250,${alpha * 0.65})`;
            ctx.lineWidth = lw * 0.38;
            ctx.beginPath();
            for (let i = 0; i <= w; i += 3) {
                const y = getY(i / w) - lw * 1.10;
                if (i === 0) ctx.moveTo(i, y); else ctx.lineTo(i, y);
            }
            ctx.stroke();
        });

        // Snow field fills — pale translucent wedges that pool above each strata line,
        // giving the impression of snow settling into rock hollows.
        ctx.lineCap = 'butt';
        strata.forEach(([fy, ampFrac, cycles, phase, , lw]) => {
            const baseY = h * fy;
            const amp = h * ampFrac;
            const freq = Math.PI * 2 * cycles;
            const getY = (xf) =>
                baseY
                + Math.sin(xf * freq + phase) * amp
                + Math.sin(xf * freq * 0.73 + phase * 1.6) * amp * 0.44
                + Math.sin(xf * freq * 1.37 + phase * 0.9) * amp * 0.22;
            const snowGrd = ctx.createLinearGradient(0, baseY - lw * 5, 0, baseY);
            snowGrd.addColorStop(0, 'rgba(228,242,255,0)');
            snowGrd.addColorStop(1, 'rgba(228,242,255,0.22)');
            ctx.fillStyle = snowGrd;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            for (let i = 0; i <= w; i += 3) {
                const y = getY(i / w);
                if (i === 0) ctx.lineTo(i, y); else ctx.lineTo(i, y);
            }
            ctx.lineTo(w, 0);
            ctx.closePath();
            ctx.fill();
        });

        // Wind-blown snow texture — fine pale horizontal ripples across the whole surface
        for (let row = 0; row < 28; row++) {
            const fy = 0.08 + row * 0.032;
            const baseY = h * fy;
            const phase = fy * 12.7 + 0.9;
            const amp = h * (0.002 + Math.abs(Math.sin(fy * 7.3)) * 0.0018);
            const alpha = 0.038 + Math.abs(Math.sin(fy * 4.9)) * 0.030;
            ctx.strokeStyle = `rgba(200,220,240,${alpha})`;
            ctx.lineWidth = 0.7;
            ctx.lineCap = 'butt';
            ctx.beginPath();
            for (let i = 0; i <= w; i += 4) {
                const y = baseY + Math.sin(i / w * Math.PI * 4.8 + phase) * amp;
                if (i === 0) ctx.moveTo(i, y); else ctx.lineTo(i, y);
            }
            ctx.stroke();
        }

        // Foreground depth shadow
        const vgn = ctx.createLinearGradient(0, h * 0.80, 0, h);
        vgn.addColorStop(0, 'rgba(30,50,80,0)');
        vgn.addColorStop(1, 'rgba(30,50,80,0.32)');
        ctx.fillStyle = vgn;
        ctx.fillRect(0, h * 0.80, w, h * 0.20);

        // Side vignette for painterly framing
        const vigL = ctx.createLinearGradient(0, 0, w * 0.09, 0);
        vigL.addColorStop(0, 'rgba(40,60,90,0.22)');
        vigL.addColorStop(1, 'rgba(40,60,90,0)');
        ctx.fillStyle = vigL;
        ctx.fillRect(0, 0, w * 0.09, h);
        const vigR = ctx.createLinearGradient(w, 0, w * 0.91, 0);
        vigR.addColorStop(0, 'rgba(40,60,90,0.22)');
        vigR.addColorStop(1, 'rgba(40,60,90,0)');
        ctx.fillStyle = vigR;
        ctx.fillRect(w * 0.91, 0, w * 0.09, h);
    }

    // --- DESERT BACKDROP: full sand ground top-down, no sky ---
    _renderDesertBackdrop(ctx, w, h) {
        // Base sand — muted dune palette: dusty cream at distant horizon, warm sienna near camera
        const ground = ctx.createLinearGradient(0, 0, 0, h);
        ground.addColorStop(0,    '#e0d0a2');
        ground.addColorStop(0.28, '#d0b46e');
        ground.addColorStop(0.60, '#bc9040');
        ground.addColorStop(1,    '#9e7228');
        ctx.fillStyle = ground;
        ctx.fillRect(0, 0, w, h);

        // Atmospheric haze lightens the distant horizon
        const haze = ctx.createLinearGradient(0, 0, 0, h * 0.24);
        haze.addColorStop(0, 'rgba(245,230,195,0.50)');
        haze.addColorStop(1, 'rgba(245,230,195,0)');
        ctx.fillStyle = haze;
        ctx.fillRect(0, 0, w, h * 0.24);

        // Dune ridge lines — sweeping sinusoidal stripes mimicking aerial dune topography.
        // Each ridge has a shadow trough and a lighter highlight crest just above it.
        const ridges = [
            // [fy, ampFrac, cycleCount, phase, shadowAlpha, lineWidth]
            [0.20, 0.012, 1.6, 2.30, 0.16, h * 0.016],
            [0.30, 0.015, 1.8, 1.70, 0.15, h * 0.018],
            [0.40, 0.016, 1.5, 3.10, 0.15, h * 0.020],
            [0.50, 0.018, 1.9, 0.80, 0.16, h * 0.022],
            [0.60, 0.020, 1.6, 2.80, 0.15, h * 0.024],
            [0.70, 0.022, 1.8, 1.40, 0.16, h * 0.026],
            [0.82, 0.024, 1.7, 3.50, 0.15, h * 0.028],
        ];
        ridges.forEach(([fy, ampFrac, cycles, phase, alpha, lw]) => {
            const baseY = h * fy;
            const amp = h * ampFrac;
            const freq = Math.PI * 2 * cycles;
            const getY = (xf) =>
                baseY
                + Math.sin(xf * freq + phase) * amp
                + Math.sin(xf * freq * 0.61 + phase * 1.9) * amp * 0.36;

            // Shadow trough
            ctx.strokeStyle = `rgba(132,82,10,${alpha})`;
            ctx.lineWidth = lw;
            ctx.lineCap = 'round';
            ctx.beginPath();
            for (let i = 0; i <= w; i += 3) {
                const y = getY(i / w);
                if (i === 0) ctx.moveTo(i, y); else ctx.lineTo(i, y);
            }
            ctx.stroke();

            // Highlight crest just above the shadow trough
            ctx.strokeStyle = `rgba(232,200,132,${alpha * 0.60})`;
            ctx.lineWidth = lw * 0.42;
            ctx.beginPath();
            for (let i = 0; i <= w; i += 3) {
                const y = getY(i / w) - lw * 1.15;
                if (i === 0) ctx.moveTo(i, y); else ctx.lineTo(i, y);
            }
            ctx.stroke();
        });

        // Fine wind ripple texture — closely spaced subtle wavy lines between ridges
        ctx.lineCap = 'butt';
        for (let row = 0; row < 30; row++) {
            const fy = 0.12 + row * 0.028;
            const baseY = h * fy;
            const phase = fy * 15.1 + 1.2;
            const amp = h * (0.003 + Math.abs(Math.sin(fy * 8.9)) * 0.0025);
            const alpha = 0.050 + Math.abs(Math.sin(fy * 5.7)) * 0.038;
            ctx.strokeStyle = `rgba(145,90,16,${alpha})`;
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            for (let i = 0; i <= w; i += 4) {
                const y = baseY + Math.sin(i / w * Math.PI * 5.4 + phase) * amp;
                if (i === 0) ctx.moveTo(i, y); else ctx.lineTo(i, y);
            }
            ctx.stroke();
        }

        // Foreground depth shadow
        const vgn = ctx.createLinearGradient(0, h * 0.80, 0, h);
        vgn.addColorStop(0, 'rgba(78,40,4,0)');
        vgn.addColorStop(1, 'rgba(78,40,4,0.30)');
        ctx.fillStyle = vgn;
        ctx.fillRect(0, h * 0.80, w, h * 0.20);

        // Side vignette for painterly framing
        const vigL = ctx.createLinearGradient(0, 0, w * 0.09, 0);
        vigL.addColorStop(0, 'rgba(105,62,12,0.24)');
        vigL.addColorStop(1, 'rgba(105,62,12,0)');
        ctx.fillStyle = vigL;
        ctx.fillRect(0, 0, w * 0.09, h);
        const vigR = ctx.createLinearGradient(w, 0, w * 0.91, 0);
        vigR.addColorStop(0, 'rgba(105,62,12,0.24)');
        vigR.addColorStop(1, 'rgba(105,62,12,0)');
        ctx.fillStyle = vigR;
        ctx.fillRect(w * 0.91, 0, w * 0.09, h);
    }

    // --- SPACE / FROG KING BACKDROP: alien surface top-down, no sky ---
    _renderSpaceBackdrop(ctx, w, h) {
        // Base: near-void deep space ground — very dark indigo-black
        const ground = ctx.createLinearGradient(0, 0, 0, h);
        ground.addColorStop(0,    '#0e1428');
        ground.addColorStop(0.42, '#0a1020');
        ground.addColorStop(1,    '#060c18');
        ctx.fillStyle = ground;
        ctx.fillRect(0, 0, w, h);

        // Nebula gas clouds — 4 large radial gradient blobs, very faint and sparse.
        // These give the ground a sense of alien mineral luminescence without crowding the field.
        [
            [0.18, 0.24, 0.24, 'rgba(40,80,160,0.11)', 'rgba(40,80,160,0)'],
            [0.66, 0.36, 0.20, 'rgba(80,40,140,0.09)', 'rgba(80,40,140,0)'],
            [0.40, 0.70, 0.22, 'rgba(20,100,120,0.10)', 'rgba(20,100,120,0)'],
            [0.86, 0.58, 0.18, 'rgba(55,30,110,0.08)', 'rgba(55,30,110,0)'],
        ].forEach(([fx, fy, frad, inner, outer]) => {
            const cx = w * fx, cy = h * fy;
            const r = w * frad;
            const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
            grd.addColorStop(0, inner);
            grd.addColorStop(1, outer);
            ctx.fillStyle = grd;
            ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
        });

        // Crater rings — partial thin arcs suggesting ancient impact sites.
        // Sparse and low-opacity so they read as texture, not competing shapes.
        [
            [0.14, 0.16, 0.062, 0.10, Math.PI * 0.15, Math.PI * 1.45],
            [0.72, 0.30, 0.048, 0.09, Math.PI * 1.50, Math.PI * 2.80],
            [0.44, 0.54, 0.056, 0.09, Math.PI * 0.60, Math.PI * 1.80],
            [0.88, 0.68, 0.042, 0.08, Math.PI * 0.25, Math.PI * 1.60],
            [0.28, 0.80, 0.052, 0.08, Math.PI * 1.20, Math.PI * 2.50],
            [0.58, 0.12, 0.050, 0.09, Math.PI * 0.80, Math.PI * 2.00],
        ].forEach(([fx, fy, frad, alpha, startAng, endAng]) => {
            const cx = w * fx, cy = h * fy;
            const r  = w * frad;
            // Outer rim shadow
            ctx.strokeStyle = `rgba(20,50,100,${alpha})`;
            ctx.lineWidth = 2.0;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.arc(cx, cy, r, startAng, endAng);
            ctx.stroke();
            // Inner bright rim
            ctx.strokeStyle = `rgba(100,170,240,${alpha * 0.40})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.arc(cx, cy, r * 0.86, startAng, endAng);
            ctx.stroke();
        });

        // Distant star field (geological glints on the alien surface)
        // Pixel-sized dots only, concentrated in the distant top half, thinning toward camera.
        // No lines — purely pointillist.
        [
            [0.04,0.03],[0.13,0.07],[0.23,0.02],[0.33,0.09],[0.44,0.04],[0.55,0.08],[0.67,0.03],[0.77,0.07],[0.89,0.02],[0.97,0.08],
            [0.08,0.14],[0.20,0.18],[0.29,0.12],[0.39,0.20],[0.50,0.16],[0.61,0.19],[0.71,0.13],[0.81,0.20],[0.93,0.15],
            [0.06,0.27],[0.16,0.31],[0.27,0.25],[0.37,0.33],[0.48,0.28],[0.59,0.32],[0.69,0.26],[0.80,0.30],[0.91,0.24],
            [0.11,0.41],[0.25,0.45],[0.40,0.38],[0.54,0.44],[0.66,0.39],[0.79,0.43],[0.95,0.37],
        ].forEach(([fx, fy]) => {
            const bright = 150 + Math.floor(Math.abs(Math.sin(fx * 31 + fy * 17)) * 100);
            const sz = Math.abs(Math.sin(fx * 41 + fy * 23)) < 0.28 ? 1.5 : 0.9;
            ctx.fillStyle = `rgba(${bright},${Math.floor(bright * 0.88)},${Math.min(255, bright + 40)},0.62)`;
            ctx.fillRect(Math.floor(w * fx), Math.floor(h * fy), sz, sz);
        });

        // Foreground depth shadow
        const vgn = ctx.createLinearGradient(0, h * 0.78, 0, h);
        vgn.addColorStop(0, 'rgba(4,8,18,0)');
        vgn.addColorStop(1, 'rgba(4,8,18,0.44)');
        ctx.fillStyle = vgn;
        ctx.fillRect(0, h * 0.78, w, h * 0.22);

        // Side vignette
        const vigL = ctx.createLinearGradient(0, 0, w * 0.08, 0);
        vigL.addColorStop(0, 'rgba(6,10,24,0.30)');
        vigL.addColorStop(1, 'rgba(6,10,24,0)');
        ctx.fillStyle = vigL;
        ctx.fillRect(0, 0, w * 0.08, h);
        const vigR = ctx.createLinearGradient(w, 0, w * 0.92, 0);
        vigR.addColorStop(0, 'rgba(6,10,24,0.30)');
        vigR.addColorStop(1, 'rgba(6,10,24,0)');
        ctx.fillStyle = vigR;
        ctx.fillRect(w * 0.92, 0, w * 0.08, h);
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
        
        // Derive path color from campaign theme
        const _campaignPathColors = {
            forest:   '#7a6444',
            mountain: '#a09888',
            desert:   '#b89850',
            space:    '#1e3248'
        };
        const pathColor = _campaignPathColors[this.getCampaign()] || '#8b7355';
        
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
            
            // Layer 2: Dark border edge — clearly defines path boundary
            const bc = this.hexToRgba(pathColor, 1);
            ctx.strokeStyle = `rgba(${Math.floor(bc.r * 0.52)},${Math.floor(bc.g * 0.52)},${Math.floor(bc.b * 0.52)},0.95)`;
            ctx.lineWidth = pathWidthPixels + 6;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(this.path[0].x, this.path[0].y);
            for (let i = 1; i < this.path.length; i++) {
                ctx.lineTo(this.path[i].x, this.path[i].y);
            }
            ctx.stroke();

            // Layer 3: Main road surface
            ctx.strokeStyle = pathColor;
            ctx.lineWidth = pathWidthPixels;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(this.path[0].x, this.path[0].y);
            for (let i = 1; i < this.path.length; i++) {
                ctx.lineTo(this.path[i].x, this.path[i].y);
            }
            ctx.stroke();

            // Layer 3 old lighter stripe removed — replaced by placeholder
            const lighterColor = this.lightenHexColor(pathColor, 50);
            // (lighter stripe removed — no scatter marks on path)
            void lighterColor; // suppress unused var
            // Layer 4 onwards removed — no wheel ruts, pebbles or dust
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
        
        // Store pathCells for collision detection
        this.pathCells = pathCells;

        // Render path edge vegetation at the path boundaries
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
            
            if (placementChance > 0.4) {
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
        
        // Render edge vegetation — colors driven by campaign
        const _camp = this.getCampaign();
        const edgeColors = {
            forest:   { bush: '#1a5a1a', bushAccent: '#2a8a2a', rock: '#7a7a7a', grass: '#228822' },
            mountain: { bush: '#706050', bushAccent: '#a09080', rock: '#707880', grass: '#8a8070' },
            desert:   { bush: '#9a7a35', bushAccent: '#c09a45', rock: '#b0a070', grass: '#a08840' },
            space:    { bush: '#3a1a5a', bushAccent: '#7a30c0', rock: '#403060', grass: '#208060' }
        };
        const ec = edgeColors[_camp] || edgeColors.forest;

        edgeVegetation.forEach(veg => {
            const seed = veg.seed;
            
            switch (veg.type) {
                case 0: // Small bushes
                    ctx.fillStyle = ec.bush;
                    ctx.beginPath();
                    ctx.arc(veg.x, veg.y, 6, 0, Math.PI * 2);
                    ctx.fill();
                    
                    ctx.fillStyle = ec.bushAccent;
                    ctx.beginPath();
                    ctx.arc(veg.x - 4, veg.y - 3, 4, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(veg.x + 4, veg.y - 3, 4, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                    
                case 1: // Rocks
                    ctx.fillStyle = ec.rock;
                    ctx.beginPath();
                    ctx.arc(veg.x, veg.y, 5, 0, Math.PI * 2);
                    ctx.fill();
                    
                    ctx.strokeStyle = 'rgba(40, 35, 30, 0.5)';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                    
                    ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
                    ctx.beginPath();
                    ctx.arc(veg.x - 1.5, veg.y - 1.5, 2, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                    
                case 2: // Grass clumps and accents
                    ctx.strokeStyle = ec.grass;
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
                    
                    if (Math.sin(seed * 0.005) > 0) {
                        const dotColor = _camp === 'space' ? 'rgba(120,220,160,0.8)'
                            : _camp === 'desert' ? 'rgba(175,138,48,0.52)'
                            : _camp === 'mountain' ? 'rgba(220,228,255,0.55)'
                            : 'rgba(195,175,75,0.50)';
                        ctx.fillStyle = dotColor;
                        ctx.beginPath();
                        ctx.arc(veg.x, veg.y, 2, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    break;
            }
        });
    }
    
    /**
     * Create castle at the end of the path.
     * Castle is always rendered upright (no rotation). The gate (bottom-center of
     * the wall, at local y = +wallHeight/2 = +40) is positioned at the path end point.
     * Returns a Promise that resolves when castle is ready.
     */
    createCastle() {
        return new Promise((resolve, reject) => {
            const pathLen = this.path.length;
            const pathEnd = this.path[pathLen - 1];

            // Castle always upright — gate is at the bottom (local y = +40).
            // Center the castle so its gate aligns with the path end.
            const wallHalfH = 40; // wallHeight / 2
            const castleScreenX = pathEnd.x;
            const castleScreenY = pathEnd.y - wallHalfH;

            // Grid blocking: 8 cells wide (horizontal), 2 cells tall (vertical),
            // centered horizontally on pathEnd.x, placed at the castle base.
            const blockW = 8;
            const blockH = 2;
            const blockGridX = Math.round(pathEnd.x / this.cellSize) - Math.floor(blockW / 2);
            const blockGridY = Math.round(pathEnd.y / this.cellSize) - 1;

            // Mark castle cells as occupied for tower placement
            for (let x = blockGridX; x < blockGridX + blockW; x++) {
                for (let y = blockGridY; y < blockGridY + blockH; y++) {
                    this.occupiedCells.add(`${x},${y}`);
                }
            }

            // Load the real Castle class and create instance
            import('../buildings/Castle.js').then(module => {
                this.castle = new module.Castle(castleScreenX, castleScreenY, blockGridX, blockGridY);
                this.castle.gateAngle = 0;
                this.castle.gridWidth = blockW;
                this.castle.gridHeight = blockH;
                resolve();
            }).catch(err => {
                console.error('Level: Could not load Castle:', err);
                this.castle = {
                    x: castleScreenX,
                    y: castleScreenY,
                    gridX: blockGridX,
                    gridY: blockGridY,
                    gridWidth: blockW,
                    gridHeight: blockH,
                    gateAngle: 0,
                    health: 100,
                    maxHealth: 100,
                    defender: null,
                    defenderDeadCooldown: 0,
                    maxDefenderCooldown: 10,
                    takeDamage: function(amount) { this.health -= amount; },
                    isDestroyed: function() { return this.health <= 0; },
                    render: function(ctx) {
                        ctx.fillStyle = '#cc0000';
                        ctx.fillRect(this.x - 40, this.y - 40, 80, 80);
                    },
                    update: function(deltaTime) {}
                };
                reject(err);
            });
        });
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
        
        // 2-5. Terrain layer (rocks, water, rivers, path, vegetation) - cached to offscreen canvas
        this.renderTerrainLayer(ctx);
        
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
                
                // Show radius for tower previews (not buildings)
                if (!isBuilding && this.previewTowerType) {
                    const towerRange = this.getEffectiveTowerRange(this.previewTowerType, this.previewTowerManager);
                    if (towerRange > 0) {
                        // Draw radius circle
                        ctx.strokeStyle = 'rgba(100, 200, 100, 0.4)';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.arc(centerX, centerY, towerRange, 0, Math.PI * 2);
                        ctx.stroke();
                        
                        // Draw dashed circle for better visibility
                        ctx.strokeStyle = 'rgba(100, 200, 100, 0.3)';
                        ctx.lineWidth = 1;
                        ctx.setLineDash([5, 5]);
                        ctx.beginPath();
                        ctx.arc(centerX, centerY, towerRange, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.setLineDash([]);
                    }
                }
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
            const baseSize = element.size * this.cellSize;
            const size = element.type === 'water' ? baseSize : baseSize * 0.75;

            switch (element.type) {
                case 'vegetation':
                    this.renderVegetation(ctx, screenX, screenY, size, element.gridX, element.gridY, element.variant);
                    break;
                case 'rock':
                    this.renderRock(ctx, screenX, screenY, size, element.gridX, element.gridY, element.variant);
                    break;
                case 'water':
                    if (element.waterType === 'river') {
                        this.renderRiver(ctx, screenX, screenY, size, element.flowAngle);
                    } else if (element.waterType === 'lake') {
                        this.renderLake(ctx, screenX, screenY, size);
                    }
                    break;
            }
        });
    }

    renderTerrainElementsByType(ctx, typeFilters, minScreenY = -Infinity, maxScreenY = Infinity) {
        if (!this.terrainElements || this.terrainElements.length === 0) {
            return;
        }

        const campaign = this.getCampaign();
        // Sort by gridY ascending so elements higher on screen (closer to horizon) are
        // drawn first and elements lower on screen (closer to camera) are drawn on top —
        // correct top-down perspective with horizon at the top of the playing field.
        const sortedElements = [...this.terrainElements].sort((a, b) => a.gridY - b.gridY);
        sortedElements.forEach(element => {
            // Only render elements that match the type filters
            if (!typeFilters.includes(element.type)) {
                return;
            }

            // Y-range filter for foreground/background splitting
            const screenY = element.gridY * this.cellSize;
            if (screenY < minScreenY || screenY >= maxScreenY) {
                return;
            }

            const screenX = element.gridX * this.cellSize;
            const baseSize = element.size * this.cellSize;
            const sizeScale = (element.type !== 'water' && campaign !== 'forest') ? 1.5 : 0.75;
            const size = element.type === 'water' ? baseSize : baseSize * sizeScale;

            switch (element.type) {
                case 'vegetation':
                    this.renderVegetation(ctx, screenX, screenY, size, element.gridX, element.gridY, element.variant);
                    break;
                case 'tree':
                    this.renderTree(ctx, screenX, screenY, size, element.gridX, element.gridY, element.variant);
                    break;
                case 'rock':
                    this.renderRock(ctx, screenX, screenY, size, element.gridX, element.gridY, element.variant);
                    break;
                case 'cactus':
                    this.renderCactus(ctx, screenX, screenY, size, element.gridX, element.gridY);
                    break;
                case 'drybush':
                    this.renderDryBush(ctx, screenX, screenY, size, element.gridX, element.gridY);
                    break;
                case 'water':
                    if (element.waterType === 'river') {
                        this.renderRiver(ctx, screenX, screenY, size, element.flowAngle);
                    } else if (element.waterType === 'lake') {
                        this.renderLake(ctx, screenX, screenY, size);
                    }
                    break;
            }
        });
    }

    renderVegetation(ctx, x, y, size, gridX, gridY, variant) {
        const campaign = this.getCampaign();
        switch (campaign) {
            case 'desert':
                this.renderDesertVegetation(ctx, x, y, size, gridX, gridY, variant);
                break;
            case 'mountain':
                this.renderMountainVegetation(ctx, x, y, size, gridX, gridY, variant);
                break;
            case 'space':
                this.renderSpaceVegetation(ctx, x, y, size, gridX, gridY, variant);
                break;
            case 'forest':
            default:
                this.renderTree(ctx, x, y, size, gridX, gridY, variant);
                break;
        }
    }

    renderDesertVegetation(ctx, x, y, size, gridX, gridY, variant) {
        const scaledSize = size;
        const seed = (variant !== undefined && variant !== null) ? variant % 6 : Math.floor(gridX * 0.5 + gridY * 0.7) % 6;
        switch(seed) {
            case 0:
                this.renderCactusSaguaro(ctx, x, y, scaledSize);
                break;
            case 1:
                this.renderCactusBarrel(ctx, x, y, scaledSize);
                break;
            case 2:
                this.renderCactusPricklyPear(ctx, x, y, scaledSize);
                break;
            case 3:
                this.renderCactusColumnar(ctx, x, y, scaledSize);
                break;
            case 4:
                this.renderCactusCholla(ctx, x, y, scaledSize);
                break;
            default:
                this.renderDesertBush(ctx, x, y, scaledSize);
        }
    }

    renderCactusBaseBushes(ctx, x, y, size) {
        // Add bushes around the base of cacti for a more natural look
        // Small bush cluster on left
        ctx.fillStyle = '#9d7c54';
        ctx.beginPath();
        ctx.arc(x - size * 0.25, y + size * 0.22, size * 0.12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#a88a6a';
        ctx.beginPath();
        ctx.arc(x - size * 0.35, y + size * 0.15, size * 0.1, 0, Math.PI * 2);
        ctx.fill();

        // Small bush cluster on right
        ctx.fillStyle = '#9d7c54';
        ctx.beginPath();
        ctx.arc(x + size * 0.25, y + size * 0.22, size * 0.12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#a88a6a';
        ctx.beginPath();
        ctx.arc(x + size * 0.35, y + size * 0.15, size * 0.1, 0, Math.PI * 2);
        ctx.fill();

        // Front center small bushes
        ctx.fillStyle = '#8a7654';
        ctx.beginPath();
        ctx.arc(x - size * 0.1, y + size * 0.25, size * 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + size * 0.1, y + size * 0.25, size * 0.08, 0, Math.PI * 2);
        ctx.fill();
    }

    renderCactusSaguaro(ctx, x, y, size) {
        // Desert saguaro — muted sage-green with natural desert coloring
        const mainHeight = size * 0.58;
        const mainWidth = size * 0.22;

        // Ground shadow
        ctx.fillStyle = 'rgba(60,30,10,0.28)';
        ctx.beginPath();
        ctx.ellipse(x + 1, y + 2, mainWidth * 0.9, size * 0.10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Main trunk — muted gray-sage green
        ctx.fillStyle = '#5a8440';
        ctx.beginPath();
        ctx.moveTo(x - mainWidth * 0.26, y);
        ctx.lineTo(x - mainWidth * 0.22, y - mainHeight * 0.72);
        ctx.quadraticCurveTo(x, y - mainHeight, x + mainWidth * 0.22, y - mainHeight * 0.72);
        ctx.lineTo(x + mainWidth * 0.26, y);
        ctx.closePath();
        ctx.fill();

        // Trunk shadow side
        ctx.fillStyle = '#3d6030';
        ctx.beginPath();
        ctx.moveTo(x + mainWidth * 0.04, y);
        ctx.lineTo(x + mainWidth * 0.06, y - mainHeight * 0.65);
        ctx.quadraticCurveTo(x + mainWidth * 0.18, y - mainHeight * 0.82, x + mainWidth * 0.22, y - mainHeight * 0.72);
        ctx.lineTo(x + mainWidth * 0.26, y);
        ctx.closePath();
        ctx.fill();

        // Left arm — curves upward naturally
        ctx.fillStyle = '#5a8440';
        ctx.beginPath();
        ctx.moveTo(x - mainWidth * 0.22, y - mainHeight * 0.38);
        ctx.quadraticCurveTo(x - mainWidth * 0.70, y - mainHeight * 0.44, x - mainWidth * 0.74, y - mainHeight * 0.62);
        ctx.quadraticCurveTo(x - mainWidth * 0.68, y - mainHeight * 0.80, x - mainWidth * 0.48, y - mainHeight * 0.80);
        ctx.quadraticCurveTo(x - mainWidth * 0.32, y - mainHeight * 0.80, x - mainWidth * 0.28, y - mainHeight * 0.38 + mainWidth * 0.12);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#3d6030';
        ctx.beginPath();
        ctx.moveTo(x - mainWidth * 0.22, y - mainHeight * 0.38);
        ctx.quadraticCurveTo(x - mainWidth * 0.56, y - mainHeight * 0.40, x - mainWidth * 0.60, y - mainHeight * 0.50);
        ctx.quadraticCurveTo(x - mainWidth * 0.54, y - mainHeight * 0.68, x - mainWidth * 0.48, y - mainHeight * 0.80);
        ctx.quadraticCurveTo(x - mainWidth * 0.38, y - mainHeight * 0.80, x - mainWidth * 0.28, y - mainHeight * 0.38 + mainWidth * 0.12);
        ctx.closePath();
        ctx.fill();

        // Right arm — curves upward naturally
        ctx.fillStyle = '#5a8440';
        ctx.beginPath();
        ctx.moveTo(x + mainWidth * 0.22, y - mainHeight * 0.30);
        ctx.quadraticCurveTo(x + mainWidth * 0.68, y - mainHeight * 0.36, x + mainWidth * 0.72, y - mainHeight * 0.55);
        ctx.quadraticCurveTo(x + mainWidth * 0.66, y - mainHeight * 0.74, x + mainWidth * 0.46, y - mainHeight * 0.74);
        ctx.quadraticCurveTo(x + mainWidth * 0.30, y - mainHeight * 0.74, x + mainWidth * 0.26, y - mainHeight * 0.30 + mainWidth * 0.10);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#3d6030';
        ctx.beginPath();
        ctx.moveTo(x + mainWidth * 0.22, y - mainHeight * 0.30);
        ctx.quadraticCurveTo(x + mainWidth * 0.52, y - mainHeight * 0.33, x + mainWidth * 0.56, y - mainHeight * 0.44);
        ctx.quadraticCurveTo(x + mainWidth * 0.50, y - mainHeight * 0.64, x + mainWidth * 0.46, y - mainHeight * 0.74);
        ctx.quadraticCurveTo(x + mainWidth * 0.32, y - mainHeight * 0.74, x + mainWidth * 0.26, y - mainHeight * 0.30 + mainWidth * 0.10);
        ctx.closePath();
        ctx.fill();

        // Spine dots — light tan
        ctx.fillStyle = '#c8b870';
        for (let i = 0; i < 10; i++) {
            const sy = y - mainHeight * (0.10 + 0.06 * i);
            ctx.beginPath(); ctx.arc(x + mainWidth * 0.28, sy, 1.2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(x - mainWidth * 0.28, sy, 1.2, 0, Math.PI * 2); ctx.fill();
        }

        this.renderCactusBaseBushes(ctx, x, y, size * 0.65);
    }

    renderCactusBarrel(ctx, x, y, size) {
        // Dry desert bush — gnarled woody branches with dried tips
        const baseR = size * 0.16;

        // Ground shadow
        ctx.fillStyle = 'rgba(60,30,10,0.28)';
        ctx.beginPath();
        ctx.ellipse(x + 2, y + 3, baseR * 1.3, baseR * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();

        // Woody base mound
        ctx.fillStyle = '#4a3012';
        ctx.beginPath();
        ctx.ellipse(x, y, baseR, baseR * 0.52, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#6a4a1c';
        ctx.beginPath();
        ctx.ellipse(x - baseR * 0.16, y - baseR * 0.08, baseR * 0.72, baseR * 0.36, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // Dry twisted branches
        const branches = [
            { ang: -2.36, len: size * 0.38, lw: 2.4, bend: -0.40 },
            { ang: -1.88, len: size * 0.42, lw: 2.2, bend: 0.30 },
            { ang: -1.26, len: size * 0.36, lw: 2.0, bend: -0.22 },
            { ang: -0.62, len: size * 0.30, lw: 1.8, bend: 0.35 },
            { ang: -2.76, len: size * 0.32, lw: 2.0, bend: 0.24 },
            { ang:  3.40, len: size * 0.34, lw: 2.0, bend: -0.28 },
            { ang:  2.90, len: size * 0.38, lw: 2.2, bend: 0.32 }
        ];
        ctx.lineCap = 'round';
        branches.forEach(b => {
            const ex = x + Math.cos(b.ang) * b.len;
            const ey = y + Math.sin(b.ang) * b.len;
            const mx = x + Math.cos(b.ang + b.bend) * b.len * 0.52;
            const my = y + Math.sin(b.ang + b.bend) * b.len * 0.52;
            ctx.strokeStyle = '#7a5522';
            ctx.lineWidth = b.lw;
            ctx.beginPath();
            ctx.moveTo(x, y - baseR * 0.28);
            ctx.quadraticCurveTo(mx, my, ex, ey);
            ctx.stroke();
            ctx.fillStyle = '#c4a040';
            ctx.beginPath();
            ctx.arc(ex, ey, b.lw * 1.5, 0, Math.PI * 2);
            ctx.fill();
        });

        // Sub-branches
        branches.slice(0, 5).forEach(b => {
            const bx = x + Math.cos(b.ang) * b.len * 0.58;
            const by = y + Math.sin(b.ang) * b.len * 0.58;
            const sAng = b.ang + (b.bend > 0 ? 0.55 : -0.55);
            const sLen = b.len * 0.28;
            ctx.strokeStyle = '#6a4520';
            ctx.lineWidth = b.lw * 0.55;
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.lineTo(bx + Math.cos(sAng) * sLen, by + Math.sin(sAng) * sLen);
            ctx.stroke();
            ctx.fillStyle = '#a88030';
            ctx.beginPath();
            ctx.arc(bx + Math.cos(sAng) * sLen, by + Math.sin(sAng) * sLen, b.lw * 0.85, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    renderCactusPricklyPear(ctx, x, y, size) {
        // Helper function to render organic leaf pad with prominent spines
        const renderLeafPad = (x, y, width, height, rotation, color1, color2) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation);

            // Shadow base
            ctx.fillStyle = 'rgba(20, 80, 20, 0.3)';
            ctx.beginPath();
            ctx.ellipse(0, height * 0.45, width * 0.3, height * 0.1, 0, 0, Math.PI * 2);
            ctx.fill();

            // Main organic leaf pad using bezier curves with brighter green
            ctx.fillStyle = color1;
            ctx.beginPath();
            ctx.moveTo(0, -height * 0.5);
            ctx.quadraticCurveTo(width * 0.35, -height * 0.35, width * 0.4, 0);
            ctx.quadraticCurveTo(width * 0.3, height * 0.4, 0, height * 0.5);
            ctx.quadraticCurveTo(-width * 0.3, height * 0.4, -width * 0.4, 0);
            ctx.quadraticCurveTo(-width * 0.35, -height * 0.35, 0, -height * 0.5);
            ctx.closePath();
            ctx.fill();

            // Dark side shading
            ctx.fillStyle = color2;
            ctx.beginPath();
            ctx.moveTo(0, -height * 0.5);
            ctx.quadraticCurveTo(width * 0.35, -height * 0.35, width * 0.4, 0);
            ctx.quadraticCurveTo(width * 0.3, height * 0.4, width * 0.1, height * 0.5);
            ctx.quadraticCurveTo(width * 0.05, height * 0.2, 0, -height * 0.5);
            ctx.closePath();
            ctx.fill();

            // Spine clusters on pad - much more prominent
            ctx.fillStyle = '#4a8a4a';
            const spines = [
                {x: 0, y: -height * 0.35},
                {x: width * 0.18, y: -height * 0.18},
                {x: -width * 0.18, y: -height * 0.18},
                {x: width * 0.28, y: height * 0.15},
                {x: -width * 0.28, y: height * 0.15},
                {x: width * 0.1, y: height * 0.35},
                {x: -width * 0.1, y: height * 0.35},
                {x: 0, y: height * 0.4}
            ];
            spines.forEach(spine => {
                // Main spine
                ctx.beginPath();
                ctx.arc(spine.x, spine.y, 1.1, 0, Math.PI * 2);
                ctx.fill();

                // Surrounding mini-spines
                for (let j = 0; j < 2; j++) {
                    const offset = (j - 0.5) * width * 0.12;
                    ctx.beginPath();
                    ctx.arc(spine.x + offset, spine.y, 0.6, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            ctx.restore();
        };

        const padWidth = size * 0.22;
        const padHeight = size * 0.35;

        // Main central pad
        renderLeafPad(x, y - padHeight * 0.2, padWidth * 0.5, padHeight * 0.6, 0, '#22c55e', '#15803d');

        // Right side pad
        renderLeafPad(x + padWidth * 0.42, y - padHeight * 0.1, padWidth * 0.45, padHeight * 0.5, Math.PI / 4.5, '#22c55e', '#15803d');

        // Left side pad
        renderLeafPad(x - padWidth * 0.42, y + padHeight * 0.05, padWidth * 0.45, padHeight * 0.5, -Math.PI / 4.5, '#22c55e', '#15803d');

        // Lower pad (base)
        renderLeafPad(x, y + padHeight * 0.3, padWidth * 0.48, padHeight * 0.5, Math.PI / 8, '#22c55e', '#15803d');

        // Highlight on main pad
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.ellipse(x - padWidth * 0.1, y - padHeight * 0.3, padWidth * 0.15, padHeight * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Add base bushes for natural look
        this.renderCactusBaseBushes(ctx, x, y, size * 0.5);
    }

    renderCactusColumnar(ctx, x, y, size) {
        // Tall columnar organ pipe cactus with prominent spines
        const bodyWidth = size * 0.18;
        const bodyHeight = size * 0.6;

        // Shadow base
        ctx.fillStyle = 'rgba(20, 80, 20, 0.3)';
        ctx.beginPath();
        ctx.ellipse(x, y + bodyHeight * 0.05, bodyWidth * 0.4, bodyHeight * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();

        // Main body with bright green
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(x - bodyWidth * 0.5, y - bodyHeight, bodyWidth, bodyHeight);

        // Dark side shading
        ctx.fillStyle = '#15803d';
        ctx.fillRect(x - bodyWidth * 0.5, y - bodyHeight, bodyWidth * 0.35, bodyHeight);

        // Vertical ridge lines (4 ridges with better definition)
        ctx.strokeStyle = '#0f6b3d';
        ctx.lineWidth = 1.2;
        for (let i = 0; i < 4; i++) {
            const px = x - bodyWidth * 0.3 + i * bodyWidth * 0.2;
            ctx.beginPath();
            ctx.moveTo(px, y - bodyHeight);
            ctx.lineTo(px, y);
            ctx.stroke();
        }

        // Spine clusters - much more prominent with more spines per row
        ctx.fillStyle = '#4a8a4a';
        for (let i = 0; i < 6; i++) {
            const py = y - bodyHeight + (i * bodyHeight * 0.2);
            // 4 spines per row instead of 2
            for (let j = 0; j < 4; j++) {
                const px = x - bodyWidth * 0.3 + j * bodyWidth * 0.2;
                
                // Main spine
                ctx.beginPath();
                ctx.arc(px, py, 1.1, 0, Math.PI * 2);
                ctx.fill();

                // Surrounding mini-spines
                for (let k = 0; k < 2; k++) {
                    const offset = (k - 0.5) * 1.8;
                    ctx.beginPath();
                    ctx.arc(px, py + offset, 0.6, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        // Highlight stripe
        ctx.fillStyle = 'rgba(34, 197, 94, 0.3)';
        ctx.fillRect(x - bodyWidth * 0.15, y - bodyHeight * 0.9, bodyWidth * 0.2, bodyHeight * 0.8);
        
        // Add base bushes for natural look
        this.renderCactusBaseBushes(ctx, x, y, size * 0.55);
    }

    renderCactusCholla(ctx, x, y, size) {
        // Branching cholla with prominent spines
        const mainHeight = size * 0.5;
        const mainWidth = size * 0.15;

        // Shadow base
        ctx.fillStyle = 'rgba(20, 80, 20, 0.3)';
        ctx.beginPath();
        ctx.ellipse(x, y + mainHeight * 0.05, mainWidth * 0.6, mainHeight * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Main body/stem with bright green
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(x - mainWidth * 0.5, y - mainHeight, mainWidth, mainHeight);

        // Dark side shading
        ctx.fillStyle = '#15803d';
        ctx.fillRect(x - mainWidth * 0.5, y - mainHeight, mainWidth * 0.3, mainHeight);

        // Upper left branch
        ctx.save();
        ctx.translate(x, y - mainHeight * 0.7);
        ctx.rotate(-Math.PI * 0.35);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(-mainWidth * 0.35, -mainHeight * 0.35, mainWidth * 0.7, mainHeight * 0.35);
        ctx.fillStyle = '#15803d';
        ctx.fillRect(-mainWidth * 0.35, -mainHeight * 0.35, mainWidth * 0.35, mainHeight * 0.35);
        ctx.restore();

        // Upper right branch
        ctx.save();
        ctx.translate(x, y - mainHeight * 0.7);
        ctx.rotate(Math.PI * 0.35);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(-mainWidth * 0.35, -mainHeight * 0.35, mainWidth * 0.7, mainHeight * 0.35);
        ctx.fillStyle = '#15803d';
        ctx.fillRect(0, -mainHeight * 0.35, mainWidth * 0.35, mainHeight * 0.35);
        ctx.restore();

        // Lower left branch
        ctx.save();
        ctx.translate(x, y - mainHeight * 0.2);
        ctx.rotate(-Math.PI * 0.25);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(-mainWidth * 0.35, -mainHeight * 0.3, mainWidth * 0.7, mainHeight * 0.3);
        ctx.fillStyle = '#15803d';
        ctx.fillRect(-mainWidth * 0.35, -mainHeight * 0.3, mainWidth * 0.35, mainHeight * 0.3);
        ctx.restore();

        // Lower right branch
        ctx.save();
        ctx.translate(x, y - mainHeight * 0.2);
        ctx.rotate(Math.PI * 0.25);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(-mainWidth * 0.35, -mainHeight * 0.3, mainWidth * 0.7, mainHeight * 0.3);
        ctx.fillStyle = '#15803d';
        ctx.fillRect(0, -mainHeight * 0.3, mainWidth * 0.35, mainHeight * 0.3);
        ctx.restore();

        // Prominent spine clusters - 20+ spines with supporting mini-spines
        ctx.fillStyle = '#4a8a4a';
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const spineX = x + Math.cos(angle) * mainWidth * 0.9;
            const spineY = y - mainHeight * 0.5 + Math.sin(angle) * mainHeight * 0.5;
            
            // Main spine
            ctx.beginPath();
            ctx.arc(spineX, spineY, 1.1, 0, Math.PI * 2);
            ctx.fill();

            // Surrounding mini-spines for detail
            for (let j = 0; j < 3; j++) {
                const miniAngle = angle + (j - 1) * (Math.PI / 8);
                const miniX = x + Math.cos(miniAngle) * mainWidth * 0.75;
                const miniY = y - mainHeight * 0.5 + Math.sin(miniAngle) * mainHeight * 0.35;
                ctx.beginPath();
                ctx.arc(miniX, miniY, 0.6, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Highlight
        ctx.fillStyle = 'rgba(34, 197, 94, 0.3)';
        ctx.fillRect(x - mainWidth * 0.15, y - mainHeight * 0.8, mainWidth * 0.2, mainHeight * 0.7);
        
        // Add base bushes for natural look
        this.renderCactusBaseBushes(ctx, x, y, size * 0.6);
    }

    renderDesertBush(ctx, x, y, size) {
        // Dry desert bush - irregular organic shape (matches LevelDesigner drawDesertBush)
        const radius = size * 0.28;

        // Main body with irregular outline
        ctx.fillStyle = '#9d7c54';
        ctx.beginPath();
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const variation = Math.sin(angle * 3) * 0.15 + Math.cos(angle * 5) * 0.1;
            const r = radius * (0.85 + variation);
            const px = x + Math.cos(angle) * r;
            const py = y + Math.sin(angle) * r * 0.8;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        // Darker inner layer for depth
        ctx.fillStyle = '#7a5c3f';
        ctx.beginPath();
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const variation = Math.sin(angle * 3) * 0.08;
            const r = radius * (0.5 + variation);
            const px = x + Math.cos(angle) * r;
            const py = y + Math.sin(angle) * r * 0.8;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        // Highlight on top
        ctx.fillStyle = '#bfa878';
        ctx.beginPath();
        ctx.moveTo(x - radius * 0.2, y - radius * 0.3);
        ctx.quadraticCurveTo(x, y - radius * 0.35, x + radius * 0.15, y - radius * 0.25);
        ctx.quadraticCurveTo(x + radius * 0.1, y - radius * 0.15, x - radius * 0.1, y - radius * 0.2);
        ctx.closePath();
        ctx.fill();

        // Branch structure - realistic twigs
        ctx.strokeStyle = '#5c4630';
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const startX = x + Math.cos(angle) * radius * 0.2;
            const startY = y + Math.sin(angle) * radius * 0.15;
            const midX = x + Math.cos(angle) * radius * 0.65;
            const midY = y + Math.sin(angle) * radius * 0.6;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.quadraticCurveTo(midX, midY - size * 0.05, midX + Math.cos(angle + 0.3) * size * 0.08, midY + Math.sin(angle + 0.3) * size * 0.08);
            ctx.stroke();
        }
    }

    renderMountainVegetation(ctx, x, y, size, gridX, gridY, variant) {
        const scaledSize = size;
        const seed = (variant !== undefined && variant !== null) ? variant % 4 : Math.floor(gridX * 0.5 + gridY * 0.7) % 4;
        switch(seed) {
            case 0:
                this.renderMountainPineType1(ctx, x, y, scaledSize);
                break;
            case 1:
                this.renderMountainPineType2(ctx, x, y, scaledSize);
                break;
            case 2:
                this.renderMountainPineType3(ctx, x, y, scaledSize);
                break;
            case 3:
                this.renderMountainPineType4(ctx, x, y, scaledSize);
                break;
        }
    }

    renderSpaceVegetation(ctx, x, y, size, gridX, gridY, variant) {
        const seed = (variant !== undefined && variant !== null) ? variant % 6 : Math.floor(gridX * 0.5 + gridY * 0.7) % 6;
        const scaledSize = size;
        switch(seed) {
            case 0:
                this.renderSpaceVortexPlant(ctx, x, y, scaledSize);
                break;
            case 1:
                this.renderSpaceSpikeCoral(ctx, x, y, scaledSize);
                break;
            case 2:
                this.renderSpaceFractalGrowth(ctx, x, y, scaledSize);
                break;
            case 3:
                this.renderSpaceBiolumPlant(ctx, x, y, scaledSize);
                break;
            case 4:
                this.renderSpaceAlienMushroom(ctx, x, y, scaledSize);
                break;
            default:
                this.renderSpaceCrystalOrganism(ctx, x, y, scaledSize);
        }
    }

    renderSpaceVortexPlant(ctx, x, y, size) {
        // Swirling vortex-like alien plant
        ctx.fillStyle = '#4a6a9a';
        
        // Spiral body
        const spirals = 3;
        for (let layer = 0; layer < spirals; layer++) {
            const radius = size * (0.08 + layer * 0.08);
            ctx.beginPath();
            for (let i = 0; i < 50; i++) {
                const angle = (i / 50) * Math.PI * 2 + layer * Math.PI / 2;
                const dist = radius * (i / 50);
                const px = x + Math.cos(angle) * dist;
                const py = y + Math.sin(angle) * dist;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.strokeStyle = `rgba(100, 150, 255, ${0.6 - layer * 0.15})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Center glow
        ctx.fillStyle = 'rgba(200, 100, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.08, 0, Math.PI * 2);
        ctx.fill();
    }

    renderSpaceSpikeCoral(ctx, x, y, size) {
        // Spike coral formation
        ctx.fillStyle = '#5a7aaa';
        
        // Main body cluster
        const spikeCount = 8;
        for (let i = 0; i < spikeCount; i++) {
            const angle = (i / spikeCount) * Math.PI * 2;
            const baseX = x + Math.cos(angle) * size * 0.08;
            const baseY = y + Math.sin(angle) * size * 0.08;
            const tipX = x + Math.cos(angle) * size * 0.25;
            const tipY = y + Math.sin(angle) * size * 0.25;
            
            // Spike
            ctx.strokeStyle = `rgba(${100 + Math.cos(angle) * 50}, ${150}, ${200 + Math.sin(angle) * 50}, 0.9)`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(baseX, baseY);
            ctx.quadraticCurveTo(
                (baseX + tipX) * 0.5 + Math.cos(angle + Math.PI/2) * size * 0.05,
                (baseY + tipY) * 0.5 + Math.sin(angle + Math.PI/2) * size * 0.05,
                tipX, tipY
            );
            ctx.stroke();
        }

        // Center sphere
        ctx.fillStyle = '#8aaacc';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.1, 0, Math.PI * 2);
        ctx.fill();
    }

    renderSpaceFractalGrowth(ctx, x, y, size) {
        // Fractal branching alien structure
        const drawFractal = (cx, cy, length, angle, depth) => {
            if (depth === 0) return;
            
            const endX = cx + Math.cos(angle) * length;
            const endY = cy + Math.sin(angle) * length;
            
            ctx.strokeStyle = `rgba(${100 + depth * 30}, ${150 + depth * 20}, ${255 - depth * 30}, ${0.7 - depth * 0.1})`;
            ctx.lineWidth = Math.max(1, 3 - depth);
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            
            // Branch left and right
            drawFractal(endX, endY, length * 0.7, angle - Math.PI / 5, depth - 1);
            drawFractal(endX, endY, length * 0.7, angle + Math.PI / 5, depth - 1);
        };

        // Draw three main branches
        for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI * 2;
            drawFractal(x, y, size * 0.15, angle, 3);
        }

        // Core
        ctx.fillStyle = '#aabbdd';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.05, 0, Math.PI * 2);
        ctx.fill();
    }

    renderSpaceBiolumPlant(ctx, x, y, size) {
        // Bioluminescent branching organism
        ctx.fillStyle = '#3a7a9a';
        
        // Main body
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const radius = size * (0.15 + Math.sin(i * 0.8) * 0.08);
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        // Bioluminescent tendrils
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const startX = x + Math.cos(angle) * size * 0.13;
            const startY = y + Math.sin(angle) * size * 0.13;
            
            ctx.strokeStyle = `rgba(100, ${200 + Math.sin(angle) * 50}, 255, 0.8)`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            
            // Wavy tendril
            for (let j = 0; j < 5; j++) {
                const progress = (j + 1) / 5;
                const offsetX = Math.cos(angle) * size * 0.2 * progress;
                const offsetY = Math.sin(angle) * size * 0.2 * progress;
                const wiggleX = Math.sin(angle + j) * size * 0.05;
                const wiggleY = Math.cos(angle + j) * size * 0.05;
                ctx.lineTo(startX + offsetX + wiggleX, startY + offsetY + wiggleY);
            }
            ctx.stroke();
        }

        // Intense core glow
        ctx.fillStyle = 'rgba(150, 200, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.12, 0, Math.PI * 2);
        ctx.fill();
    }

    renderSpaceAlienMushroom(ctx, x, y, size) {
        // Impossible geometry alien mushroom
        // Cap with inverted perspective
        ctx.fillStyle = '#6a5aaa';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.18, y - size * 0.08);
        ctx.bezierCurveTo(
            x - size * 0.18, y - size * 0.18,
            x + size * 0.18, y - size * 0.18,
            x + size * 0.18, y - size * 0.08
        );
        ctx.lineTo(x + size * 0.1, y + size * 0.08);
        ctx.lineTo(x - size * 0.1, y + size * 0.08);
        ctx.closePath();
        ctx.fill();

        // Inverted inner surface (different color)
        ctx.fillStyle = '#4a3aaa';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.14, y - size * 0.05);
        ctx.bezierCurveTo(
            x - size * 0.14, y - size * 0.12,
            x + size * 0.14, y - size * 0.12,
            x + size * 0.14, y - size * 0.05
        );
        ctx.lineTo(x + size * 0.08, y + size * 0.04);
        ctx.lineTo(x - size * 0.08, y + size * 0.04);
        ctx.closePath();
        ctx.fill();

        // Stem
        ctx.fillStyle = '#5a6aaa';
        ctx.fillRect(x - size * 0.06, y + size * 0.08, size * 0.12, size * 0.16);

        // Bioluminescent gill-like structures
        ctx.strokeStyle = 'rgba(200, 100, 255, 0.6)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const py = y - size * 0.08 + (i * size * 0.035);
            ctx.beginPath();
            ctx.moveTo(x - size * 0.14, py);
            ctx.quadraticCurveTo(x, py - size * 0.02, x + size * 0.14, py);
            ctx.stroke();
        }

        // Glow aura
        ctx.fillStyle = 'rgba(200, 100, 255, 0.2)';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.22, 0, Math.PI * 2);
        ctx.fill();
    }

    renderSpaceCrystalOrganism(ctx, x, y, size) {
        // Hybrid crystal organism - larger and more detailed variation
        ctx.fillStyle = '#7a6aaa';
        
        // Base crystal cluster
        const clusters = 5;
        for (let i = 0; i < clusters; i++) {
            const angle = (i / clusters) * Math.PI * 2;
            const radius = size * 0.15;
            const cX = x + Math.cos(angle) * radius;
            const cY = y + Math.sin(angle) * radius;
            
            // Individual crystal
            ctx.beginPath();
            ctx.moveTo(cX, cY - size * 0.18);
            ctx.lineTo(cX + size * 0.1, cY + size * 0.08);
            ctx.lineTo(cX - size * 0.1, cY + size * 0.08);
            ctx.closePath();
            ctx.fill();
            
            // Crystal highlight
            ctx.fillStyle = '#9a8aaa';
            ctx.beginPath();
            ctx.arc(cX - size * 0.05, cY - size * 0.08, size * 0.05, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#7a6aaa';
        }
        
        // Central growth core
        ctx.fillStyle = '#5a8aaa';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.14, 0, Math.PI * 2);
        ctx.fill();
        
        // Energetic tendrils extending outward
        ctx.strokeStyle = 'rgba(150, 180, 255, 0.6)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const endX = x + Math.cos(angle) * size * 0.35;
            const endY = y + Math.sin(angle) * size * 0.35;
            
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.quadraticCurveTo(
                x + Math.cos(angle) * size * 0.15,
                y + Math.sin(angle) * size * 0.15,
                endX,
                endY
            );
            ctx.stroke();
        }
        
        // Pulsing core glow
        ctx.fillStyle = 'rgba(180, 200, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    renderMountainPineType1(ctx, x, y, size) {
        // Tall conifer — 3 layered triangles, clean silhouette, cold greens with snow caps
        const trunkW = size * 0.22;
        const trunkH = size * 0.48;
        ctx.fillStyle = '#4a2c12';
        ctx.fillRect(x - trunkW * 0.5, y, trunkW, trunkH);
        ctx.fillStyle = '#2e1a08';
        ctx.fillRect(x + trunkW * 0.08, y, trunkW * 0.42, trunkH);

        // Bottom tier
        ctx.fillStyle = '#0c2e1a';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.15);
        ctx.lineTo(x + size * 0.34, y + size * 0.20);
        ctx.lineTo(x - size * 0.34, y + size * 0.20);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1a4a2e';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.15);
        ctx.lineTo(x, y + size * 0.20);
        ctx.lineTo(x - size * 0.34, y + size * 0.20);
        ctx.closePath();
        ctx.fill();

        // Middle tier
        ctx.fillStyle = '#0e3620';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.38);
        ctx.lineTo(x + size * 0.28, y + size * 0.02);
        ctx.lineTo(x - size * 0.28, y + size * 0.02);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1c5234';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.38);
        ctx.lineTo(x, y + size * 0.02);
        ctx.lineTo(x - size * 0.28, y + size * 0.02);
        ctx.closePath();
        ctx.fill();

        // Top tier
        ctx.fillStyle = '#104028';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.62);
        ctx.lineTo(x + size * 0.20, y - size * 0.14);
        ctx.lineTo(x - size * 0.20, y - size * 0.14);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1e5a3a';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.62);
        ctx.lineTo(x, y - size * 0.14);
        ctx.lineTo(x - size * 0.20, y - size * 0.14);
        ctx.closePath();
        ctx.fill();

        // Snow caps on each tier — gentle curved shapes
        // Top snow
        ctx.fillStyle = 'rgba(235, 248, 255, 0.95)';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.62);
        ctx.quadraticCurveTo(x + size * 0.12, y - size * 0.42, x + size * 0.18, y - size * 0.32);
        ctx.quadraticCurveTo(x + size * 0.06, y - size * 0.28, x, y - size * 0.34);
        ctx.quadraticCurveTo(x - size * 0.06, y - size * 0.28, x - size * 0.18, y - size * 0.32);
        ctx.quadraticCurveTo(x - size * 0.12, y - size * 0.42, x, y - size * 0.62);
        ctx.closePath();
        ctx.fill();
        // Middle snow
        ctx.fillStyle = 'rgba(232, 245, 255, 0.92)';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.38);
        ctx.quadraticCurveTo(x + size * 0.16, y - size * 0.20, x + size * 0.25, y - size * 0.12);
        ctx.quadraticCurveTo(x + size * 0.10, y - size * 0.06, x, y - size * 0.12);
        ctx.quadraticCurveTo(x - size * 0.10, y - size * 0.06, x - size * 0.25, y - size * 0.12);
        ctx.quadraticCurveTo(x - size * 0.16, y - size * 0.20, x, y - size * 0.38);
        ctx.closePath();
        ctx.fill();
        // Bottom snow — lighter, thinner
        ctx.fillStyle = 'rgba(228, 242, 255, 0.85)';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.15);
        ctx.quadraticCurveTo(x + size * 0.18, y + size * 0.02, x + size * 0.30, y + size * 0.08);
        ctx.quadraticCurveTo(x + size * 0.12, y + size * 0.12, x, y + size * 0.06);
        ctx.quadraticCurveTo(x - size * 0.12, y + size * 0.12, x - size * 0.30, y + size * 0.08);
        ctx.quadraticCurveTo(x - size * 0.18, y + size * 0.02, x, y - size * 0.15);
        ctx.closePath();
        ctx.fill();
    }

    renderMountainPineType2(ctx, x, y, size) {
        // Pine/spruce with 4 layered triangles — wider silhouette, snow on upper tiers
        const trunkW = size * 0.18;
        const trunkH = size * 0.42;
        ctx.fillStyle = '#4a2c12';
        ctx.fillRect(x - trunkW * 0.5, y - size * 0.05, trunkW, trunkH);
        ctx.fillStyle = '#2e1a08';
        ctx.fillRect(x + trunkW * 0.08, y - size * 0.05, trunkW * 0.42, trunkH);

        // 4 tiers, each wider than Type 1
        ctx.fillStyle = '#0c2e1a';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.05);
        ctx.lineTo(x + size * 0.40, y + size * 0.18);
        ctx.lineTo(x - size * 0.40, y + size * 0.18);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1a4a2e';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.05);
        ctx.lineTo(x, y + size * 0.18);
        ctx.lineTo(x - size * 0.40, y + size * 0.18);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#0e3620';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.25);
        ctx.lineTo(x + size * 0.32, y + size * 0.02);
        ctx.lineTo(x - size * 0.32, y + size * 0.02);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1c5234';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.25);
        ctx.lineTo(x, y + size * 0.02);
        ctx.lineTo(x - size * 0.32, y + size * 0.02);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#104028';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.46);
        ctx.lineTo(x + size * 0.22, y - size * 0.15);
        ctx.lineTo(x - size * 0.22, y - size * 0.15);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1e5a3a';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.46);
        ctx.lineTo(x, y - size * 0.15);
        ctx.lineTo(x - size * 0.22, y - size * 0.15);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#14503a';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.62);
        ctx.lineTo(x + size * 0.13, y - size * 0.38);
        ctx.lineTo(x - size * 0.13, y - size * 0.38);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#226844';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.62);
        ctx.lineTo(x, y - size * 0.38);
        ctx.lineTo(x - size * 0.13, y - size * 0.38);
        ctx.closePath();
        ctx.fill();

        // Snow caps — top two tiers get heavy snow, bottom two lighter
        ctx.fillStyle = 'rgba(237, 249, 255, 0.96)';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.62);
        ctx.quadraticCurveTo(x + size * 0.08, y - size * 0.50, x + size * 0.12, y - size * 0.44);
        ctx.quadraticCurveTo(x + size * 0.04, y - size * 0.40, x, y - size * 0.44);
        ctx.quadraticCurveTo(x - size * 0.04, y - size * 0.40, x - size * 0.12, y - size * 0.44);
        ctx.quadraticCurveTo(x - size * 0.08, y - size * 0.50, x, y - size * 0.62);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = 'rgba(234, 247, 255, 0.94)';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.46);
        ctx.quadraticCurveTo(x + size * 0.13, y - size * 0.32, x + size * 0.20, y - size * 0.24);
        ctx.quadraticCurveTo(x + size * 0.08, y - size * 0.18, x, y - size * 0.24);
        ctx.quadraticCurveTo(x - size * 0.08, y - size * 0.18, x - size * 0.20, y - size * 0.24);
        ctx.quadraticCurveTo(x - size * 0.13, y - size * 0.32, x, y - size * 0.46);
        ctx.closePath();
        ctx.fill();

        // Light dusting on middle tier
        ctx.fillStyle = 'rgba(230, 244, 255, 0.78)';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.25);
        ctx.quadraticCurveTo(x + size * 0.16, y - size * 0.12, x + size * 0.26, y - size * 0.06);
        ctx.quadraticCurveTo(x + size * 0.10, y - size * 0.01, x, y - size * 0.08);
        ctx.quadraticCurveTo(x - size * 0.10, y - size * 0.01, x - size * 0.26, y - size * 0.06);
        ctx.quadraticCurveTo(x - size * 0.16, y - size * 0.12, x, y - size * 0.25);
        ctx.closePath();
        ctx.fill();
    }

    renderMountainPineType3(ctx, x, y, size) {
        // Short young pine — 2 wide triangle tiers, compact and squat
        const trunkW = size * 0.18;
        const trunkH = size * 0.32;
        ctx.fillStyle = '#553216';
        ctx.fillRect(x - trunkW * 0.5, y - size * 0.02, trunkW, trunkH);
        ctx.fillStyle = '#301a08';
        ctx.fillRect(x + trunkW * 0.10, y - size * 0.02, trunkW * 0.40, trunkH);

        // Bottom tier — wide and squat
        ctx.fillStyle = '#0c2e1a';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.04);
        ctx.lineTo(x + size * 0.38, y + size * 0.18);
        ctx.lineTo(x - size * 0.38, y + size * 0.18);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1a4a2e';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.04);
        ctx.lineTo(x, y + size * 0.18);
        ctx.lineTo(x - size * 0.38, y + size * 0.18);
        ctx.closePath();
        ctx.fill();

        // Top tier — also wide for a stubby look
        ctx.fillStyle = '#0e3620';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.28);
        ctx.lineTo(x + size * 0.28, y + size * 0.04);
        ctx.lineTo(x - size * 0.28, y + size * 0.04);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1c5234';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.28);
        ctx.lineTo(x, y + size * 0.04);
        ctx.lineTo(x - size * 0.28, y + size * 0.04);
        ctx.closePath();
        ctx.fill();

        // Snow cap on top tier
        ctx.fillStyle = 'rgba(236, 249, 255, 0.94)';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.28);
        ctx.quadraticCurveTo(x + size * 0.16, y - size * 0.14, x + size * 0.24, y - size * 0.06);
        ctx.quadraticCurveTo(x + size * 0.08, y - size * 0.01, x, y - size * 0.08);
        ctx.quadraticCurveTo(x - size * 0.08, y - size * 0.01, x - size * 0.24, y - size * 0.06);
        ctx.quadraticCurveTo(x - size * 0.16, y - size * 0.14, x, y - size * 0.28);
        ctx.closePath();
        ctx.fill();

        // Light dusting on bottom tier
        ctx.fillStyle = 'rgba(230, 244, 255, 0.75)';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.04);
        ctx.quadraticCurveTo(x + size * 0.20, y + size * 0.08, x + size * 0.32, y + size * 0.12);
        ctx.quadraticCurveTo(x + size * 0.14, y + size * 0.16, x, y + size * 0.10);
        ctx.quadraticCurveTo(x - size * 0.14, y + size * 0.16, x - size * 0.32, y + size * 0.12);
        ctx.quadraticCurveTo(x - size * 0.20, y + size * 0.08, x, y - size * 0.04);
        ctx.closePath();
        ctx.fill();
    }

    renderMountainPineType4(ctx, x, y, size) {
        // Tall narrow columnar pine — slim form with snow all down one side
        const trunkW = size * 0.15;
        const trunkH = size * 0.52;
        ctx.fillStyle = '#4a2c12';
        ctx.fillRect(x - trunkW * 0.5, y - size * 0.15, trunkW, trunkH);
        ctx.fillStyle = '#2a1508';
        ctx.fillRect(x + trunkW * 0.15, y - size * 0.15, trunkW * 0.35, trunkH);

        // Narrow triangular crown — 3 layers
        ctx.fillStyle = '#0c2e1a';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.22);
        ctx.lineTo(x + size * 0.26, y + size * 0.10);
        ctx.lineTo(x - size * 0.26, y + size * 0.10);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1a4a2e';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.22);
        ctx.lineTo(x, y + size * 0.10);
        ctx.lineTo(x - size * 0.26, y + size * 0.10);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#0e3620';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.44);
        ctx.lineTo(x + size * 0.20, y - size * 0.10);
        ctx.lineTo(x - size * 0.20, y - size * 0.10);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1c5234';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.44);
        ctx.lineTo(x, y - size * 0.10);
        ctx.lineTo(x - size * 0.20, y - size * 0.10);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#104028';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.62);
        ctx.lineTo(x + size * 0.14, y - size * 0.30);
        ctx.lineTo(x - size * 0.14, y - size * 0.30);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1e5a3a';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.62);
        ctx.lineTo(x, y - size * 0.30);
        ctx.lineTo(x - size * 0.14, y - size * 0.30);
        ctx.closePath();
        ctx.fill();

        // Snow down the left side — asymmetric natural snow buildup
        ctx.fillStyle = 'rgba(236, 249, 255, 0.95)';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.62);
        ctx.quadraticCurveTo(x - size * 0.10, y - size * 0.48, x - size * 0.13, y - size * 0.38);
        ctx.quadraticCurveTo(x - size * 0.08, y - size * 0.34, x, y - size * 0.40);
        ctx.quadraticCurveTo(x - size * 0.05, y - size * 0.48, x, y - size * 0.62);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = 'rgba(232, 246, 255, 0.92)';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.44);
        ctx.quadraticCurveTo(x - size * 0.14, y - size * 0.28, x - size * 0.18, y - size * 0.18);
        ctx.quadraticCurveTo(x - size * 0.10, y - size * 0.12, x, y - size * 0.20);
        ctx.quadraticCurveTo(x - size * 0.08, y - size * 0.30, x, y - size * 0.44);
        ctx.closePath();
        ctx.fill();

        // Light snow on bottom tier
        ctx.fillStyle = 'rgba(228, 242, 255, 0.82)';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.22);
        ctx.quadraticCurveTo(x - size * 0.16, y - size * 0.08, x - size * 0.22, y + size * 0.02);
        ctx.quadraticCurveTo(x - size * 0.12, y + size * 0.06, x, y - size * 0.02);
        ctx.quadraticCurveTo(x - size * 0.08, y - size * 0.12, x, y - size * 0.22);
        ctx.closePath();
        ctx.fill();

        // Snow tip at apex
        ctx.fillStyle = 'rgba(240, 252, 255, 0.98)';
        ctx.beginPath();
        ctx.ellipse(x, y - size * 0.63, size * 0.04, size * 0.03, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    renderSpaceCrystalType1(ctx, x, y, size) {
        // Large geometric crystal formation
        ctx.fillStyle = '#6a5a9a';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.35);
        ctx.lineTo(x + size * 0.2, y + size * 0.15);
        ctx.lineTo(x + size * 0.08, y + size * 0.3);
        ctx.lineTo(x - size * 0.08, y + size * 0.3);
        ctx.lineTo(x - size * 0.2, y + size * 0.15);
        ctx.closePath();
        ctx.fill();

        // Highlight face
        ctx.fillStyle = '#8a7aaa';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.35);
        ctx.lineTo(x + size * 0.2, y + size * 0.15);
        ctx.lineTo(x + size * 0.05, y - size * 0.1);
        ctx.closePath();
        ctx.fill();

        // Glow
        ctx.fillStyle = 'rgba(138, 122, 170, 0.6)';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.05, size * 0.14, 0, Math.PI * 2);
        ctx.fill();

        // Bright core
        ctx.fillStyle = '#b9a8d9';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.15, size * 0.06, 0, Math.PI * 2);
        ctx.fill();
    }

    renderSpaceCrystalType2(ctx, x, y, size) {
        // Small crystal spike
        ctx.fillStyle = '#7a6aaa';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.4);
        ctx.lineTo(x + size * 0.12, y + size * 0.2);
        ctx.lineTo(x - size * 0.12, y + size * 0.2);
        ctx.closePath();
        ctx.fill();

        // Brighter side
        ctx.fillStyle = '#9a8aaa';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.4);
        ctx.lineTo(x + size * 0.12, y + size * 0.2);
        ctx.lineTo(x, y - size * 0.05);
        ctx.closePath();
        ctx.fill();

        // Glow
        ctx.fillStyle = 'rgba(154, 138, 170, 0.5)';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.1, size * 0.1, 0, Math.PI * 2);
        ctx.fill();
    }

    renderAlienPlant(ctx, x, y, size) {
        // Bioluminescent organism
        ctx.fillStyle = '#4a7a8a';
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const radius = size * (0.2 + Math.abs(Math.sin(angle * 3)) * 0.08);
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            if (i === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.closePath();
        ctx.fill();

        // Intense glow
        ctx.fillStyle = 'rgba(100, 200, 220, 0.7)';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.18, 0, Math.PI * 2);
        ctx.fill();

        // Bright core
        ctx.fillStyle = '#7ad4d4';
        ctx.beginPath();
        ctx.arc(x - size * 0.08, y - size * 0.08, size * 0.08, 0, Math.PI * 2);
        ctx.fill();
    }

    renderTree(ctx, x, y, size, gridX, gridY, variant) {
        const seed = (variant !== undefined && variant !== null) ? variant % 6 : Math.floor(gridX + gridY) % 6;
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
            case 3:
                this.renderTreeType4(ctx, x, y, size);
                break;
            case 4:
                this.renderTreeType5(ctx, x, y, size);
                break;
            default:
                this.renderTreeType6(ctx, x, y, size);
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

    renderTreeType5(ctx, x, y, size) {
        // Tall columnar tree with narrow form
        const trunkWidth = size * 0.15;
        ctx.fillStyle = '#704214';
        ctx.fillRect(x - trunkWidth * 0.5, y - size * 0.15, trunkWidth, size * 0.55);
        
        // Dark trunk shadow
        ctx.fillStyle = '#4a2511';
        ctx.fillRect(x + trunkWidth * 0.15, y - size * 0.15, trunkWidth * 0.35, size * 0.55);
        
        // Narrow triangular crown
        ctx.fillStyle = '#0f3d1f';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.25);
        ctx.lineTo(x + size * 0.28, y + size * 0.08);
        ctx.lineTo(x - size * 0.28, y + size * 0.08);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#1a5a2a';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.42);
        ctx.lineTo(x + size * 0.22, y - size * 0.08);
        ctx.lineTo(x - size * 0.22, y - size * 0.08);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#2d7a3d';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.55);
        ctx.lineTo(x + size * 0.15, y - size * 0.28);
        ctx.lineTo(x - size * 0.15, y - size * 0.28);
        ctx.closePath();
        ctx.fill();
    }

    renderTreeType6(ctx, x, y, size) {
        // Broad oak/maple style tree with wide crown
        const trunkWidth = size * 0.22;
        
        // Trunk
        ctx.fillStyle = '#6B4423';
        ctx.fillRect(x - trunkWidth * 0.5, y - size * 0.1, trunkWidth, size * 0.5);
        
        // Trunk highlight
        ctx.fillStyle = '#8B6434';
        ctx.fillRect(x - trunkWidth * 0.3, y - size * 0.1, trunkWidth * 0.35, size * 0.5);
        
        // Wide rounded crown - multiple overlapping circles
        ctx.fillStyle = '#0d4a1a';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.25, size * 0.42, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#1b6b2f';
        ctx.beginPath();
        ctx.arc(x - size * 0.2, y - size * 0.15, size * 0.35, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(x + size * 0.2, y - size * 0.15, size * 0.35, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#2d8b3f';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    renderRock(ctx, x, y, size, gridX, gridY, variant) {
        const campaign = this.getCampaign();
        switch (campaign) {
            case 'desert':
                this.renderDesertRock(ctx, x, y, size, gridX, gridY, variant);
                break;
            case 'mountain':
                this.renderMountainRock(ctx, x, y, size, gridX, gridY, variant);
                break;
            case 'space':
                this.renderSpaceRock(ctx, x, y, size, gridX, gridY, variant);
                break;
            case 'forest':
            default: {
                const seed = (variant !== undefined && variant !== null) ? variant % 4 : Math.floor(gridX * 0.5 + gridY * 0.7) % 4;
                switch(seed) {
                    case 0: this.renderRockType1(ctx, x, y, size); break;
                    case 1: this.renderRockType2(ctx, x, y, size); break;
                    case 2: this.renderRockType3(ctx, x, y, size); break;
                    default: this.renderRockType4(ctx, x, y, size);
                }
                break;
            }
        }
    }

    renderMountainRock(ctx, x, y, size, gridX, gridY, variant) {
        const seed = (variant !== undefined && variant !== null) ? variant % 4 : Math.floor(gridX * 0.5 + gridY * 0.7) % 4;
        switch(seed) {
            case 0: this.renderMountainRock0(ctx, x, y, size); break;
            case 1: this.renderMountainRock1(ctx, x, y, size); break;
            case 2: this.renderMountainRock2(ctx, x, y, size); break;
            default: this.renderMountainRock3(ctx, x, y, size);
        }
    }

    renderMountainRock0(ctx, x, y, size) {
        // Rounded grey boulder with natural irregular shape, shading, and snow cap
        // Main body — irregular polygon instead of perfect ellipse
        ctx.fillStyle = '#6a7880';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.28, y + size * 0.12);
        ctx.quadraticCurveTo(x - size * 0.34, y - size * 0.06, x - size * 0.18, y - size * 0.22);
        ctx.quadraticCurveTo(x - size * 0.04, y - size * 0.28, x + size * 0.12, y - size * 0.24);
        ctx.quadraticCurveTo(x + size * 0.30, y - size * 0.16, x + size * 0.32, y + size * 0.02);
        ctx.quadraticCurveTo(x + size * 0.30, y + size * 0.16, x + size * 0.10, y + size * 0.20);
        ctx.quadraticCurveTo(x - size * 0.10, y + size * 0.22, x - size * 0.28, y + size * 0.12);
        ctx.closePath();
        ctx.fill();
        // Shadow/dark face on right side
        ctx.fillStyle = 'rgba(38, 48, 58, 0.45)';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.12, y - size * 0.24);
        ctx.quadraticCurveTo(x + size * 0.30, y - size * 0.16, x + size * 0.32, y + size * 0.02);
        ctx.quadraticCurveTo(x + size * 0.30, y + size * 0.16, x + size * 0.10, y + size * 0.20);
        ctx.lineTo(x + size * 0.04, y + size * 0.06);
        ctx.quadraticCurveTo(x + size * 0.14, y - size * 0.08, x + size * 0.12, y - size * 0.24);
        ctx.closePath();
        ctx.fill();
        // Highlight on upper-left
        ctx.fillStyle = 'rgba(180, 195, 210, 0.40)';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.18, y - size * 0.22);
        ctx.quadraticCurveTo(x - size * 0.04, y - size * 0.28, x + size * 0.06, y - size * 0.24);
        ctx.quadraticCurveTo(x - size * 0.02, y - size * 0.12, x - size * 0.14, y - size * 0.08);
        ctx.quadraticCurveTo(x - size * 0.24, y - size * 0.10, x - size * 0.18, y - size * 0.22);
        ctx.closePath();
        ctx.fill();
        // Snow on top
        ctx.fillStyle = 'rgba(238, 248, 255, 0.88)';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.22, y - size * 0.16);
        ctx.quadraticCurveTo(x - size * 0.10, y - size * 0.26, x + size * 0.06, y - size * 0.24);
        ctx.quadraticCurveTo(x + size * 0.22, y - size * 0.20, x + size * 0.24, y - size * 0.10);
        ctx.quadraticCurveTo(x + size * 0.10, y - size * 0.08, x - size * 0.04, y - size * 0.10);
        ctx.quadraticCurveTo(x - size * 0.18, y - size * 0.08, x - size * 0.22, y - size * 0.16);
        ctx.closePath();
        ctx.fill();
    }

    renderMountainRock1(ctx, x, y, size) {
        // Angular slab with faceted faces and snow on top ledge
        const hw = size * 0.34, hh = size * 0.22;
        // Main face
        ctx.fillStyle = '#586470';
        ctx.beginPath();
        ctx.moveTo(x - hw, y + hh * 0.5);
        ctx.lineTo(x - hw * 0.72, y - hh);
        ctx.lineTo(x - hw * 0.10, y - hh * 1.10);
        ctx.lineTo(x + hw * 0.68, y - hh * 0.85);
        ctx.lineTo(x + hw, y + hh * 0.3);
        ctx.lineTo(x + hw * 0.60, y + hh * 0.6);
        ctx.closePath();
        ctx.fill();
        // Dark right face
        ctx.fillStyle = '#3a4550';
        ctx.beginPath();
        ctx.moveTo(x + hw * 0.68, y - hh * 0.85);
        ctx.lineTo(x + hw, y + hh * 0.3);
        ctx.lineTo(x + hw * 0.60, y + hh * 0.6);
        ctx.lineTo(x + hw * 0.40, y + hh * 0.1);
        ctx.closePath();
        ctx.fill();
        // Lighter top face
        ctx.fillStyle = 'rgba(130, 145, 160, 0.50)';
        ctx.beginPath();
        ctx.moveTo(x - hw * 0.72, y - hh);
        ctx.lineTo(x - hw * 0.10, y - hh * 1.10);
        ctx.lineTo(x + hw * 0.68, y - hh * 0.85);
        ctx.lineTo(x + hw * 0.20, y - hh * 0.50);
        ctx.closePath();
        ctx.fill();
        // Crack detail
        ctx.strokeStyle = 'rgba(30, 40, 48, 0.30)';
        ctx.lineWidth = size * 0.012;
        ctx.beginPath();
        ctx.moveTo(x - hw * 0.20, y - hh * 0.60);
        ctx.lineTo(x + hw * 0.10, y + hh * 0.10);
        ctx.lineTo(x + hw * 0.30, y + hh * 0.45);
        ctx.stroke();
        // Snow on top ledge
        ctx.fillStyle = 'rgba(235, 248, 255, 0.90)';
        ctx.beginPath();
        ctx.moveTo(x - hw * 0.78, y - hh * 0.90);
        ctx.quadraticCurveTo(x - hw * 0.30, y - hh * 1.16, x + hw * 0.20, y - hh * 1.06);
        ctx.quadraticCurveTo(x + hw * 0.68, y - hh * 0.92, x + hw * 0.60, y - hh * 0.72);
        ctx.quadraticCurveTo(x + hw * 0.20, y - hh * 0.56, x - hw * 0.20, y - hh * 0.65);
        ctx.quadraticCurveTo(x - hw * 0.60, y - hh * 0.70, x - hw * 0.78, y - hh * 0.90);
        ctx.closePath();
        ctx.fill();
    }

    renderMountainRock2(ctx, x, y, size) {
        // Two overlapping boulders with natural shapes and snow caps
        // Back boulder (slightly behind)
        ctx.fillStyle = '#708090';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.02, y - size * 0.02);
        ctx.quadraticCurveTo(x + size * 0.04, y - size * 0.18, x + size * 0.18, y - size * 0.20);
        ctx.quadraticCurveTo(x + size * 0.32, y - size * 0.16, x + size * 0.30, y + size * 0.02);
        ctx.quadraticCurveTo(x + size * 0.26, y + size * 0.12, x + size * 0.10, y + size * 0.12);
        ctx.quadraticCurveTo(x - size * 0.02, y + size * 0.10, x + size * 0.02, y - size * 0.02);
        ctx.closePath();
        ctx.fill();
        // Back boulder shadow face
        ctx.fillStyle = 'rgba(40, 50, 62, 0.40)';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.18, y - size * 0.20);
        ctx.quadraticCurveTo(x + size * 0.32, y - size * 0.16, x + size * 0.30, y + size * 0.02);
        ctx.quadraticCurveTo(x + size * 0.26, y + size * 0.12, x + size * 0.16, y + size * 0.12);
        ctx.lineTo(x + size * 0.20, y - size * 0.06);
        ctx.closePath();
        ctx.fill();
        // Front boulder (overlapping)
        ctx.fillStyle = '#6a7a84';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.30, y + size * 0.10);
        ctx.quadraticCurveTo(x - size * 0.34, y - size * 0.04, x - size * 0.20, y - size * 0.18);
        ctx.quadraticCurveTo(x - size * 0.06, y - size * 0.24, x + size * 0.10, y - size * 0.16);
        ctx.quadraticCurveTo(x + size * 0.18, y - size * 0.06, x + size * 0.14, y + size * 0.10);
        ctx.quadraticCurveTo(x - size * 0.06, y + size * 0.18, x - size * 0.30, y + size * 0.10);
        ctx.closePath();
        ctx.fill();
        // Front boulder shadow
        ctx.fillStyle = 'rgba(40, 50, 60, 0.38)';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.10, y - size * 0.16);
        ctx.quadraticCurveTo(x + size * 0.18, y - size * 0.06, x + size * 0.14, y + size * 0.10);
        ctx.quadraticCurveTo(x + size * 0.02, y + size * 0.14, x + size * 0.02, y + size * 0.02);
        ctx.quadraticCurveTo(x + size * 0.08, y - size * 0.06, x + size * 0.10, y - size * 0.16);
        ctx.closePath();
        ctx.fill();
        // Front highlight
        ctx.fillStyle = 'rgba(175, 190, 205, 0.35)';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.20, y - size * 0.18);
        ctx.quadraticCurveTo(x - size * 0.08, y - size * 0.22, x + size * 0.02, y - size * 0.18);
        ctx.quadraticCurveTo(x - size * 0.06, y - size * 0.08, x - size * 0.16, y - size * 0.08);
        ctx.closePath();
        ctx.fill();
        // Snow on front boulder
        ctx.fillStyle = 'rgba(238, 248, 255, 0.86)';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.24, y - size * 0.12);
        ctx.quadraticCurveTo(x - size * 0.10, y - size * 0.22, x + size * 0.06, y - size * 0.18);
        ctx.quadraticCurveTo(x + size * 0.12, y - size * 0.12, x + size * 0.08, y - size * 0.06);
        ctx.quadraticCurveTo(x - size * 0.04, y - size * 0.04, x - size * 0.18, y - size * 0.06);
        ctx.quadraticCurveTo(x - size * 0.28, y - size * 0.06, x - size * 0.24, y - size * 0.12);
        ctx.closePath();
        ctx.fill();
        // Snow on back boulder
        ctx.fillStyle = 'rgba(235, 246, 255, 0.80)';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.08, y - size * 0.14);
        ctx.quadraticCurveTo(x + size * 0.16, y - size * 0.20, x + size * 0.24, y - size * 0.16);
        ctx.quadraticCurveTo(x + size * 0.28, y - size * 0.10, x + size * 0.22, y - size * 0.06);
        ctx.quadraticCurveTo(x + size * 0.14, y - size * 0.06, x + size * 0.08, y - size * 0.14);
        ctx.closePath();
        ctx.fill();
    }

    renderMountainRock3(ctx, x, y, size) {
        // Cluster of small stones with varied shapes and snow patches
        // Stone 1 — largest, front-left
        ctx.fillStyle = '#6a7880';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.26, y + size * 0.14);
        ctx.quadraticCurveTo(x - size * 0.28, y + size * 0.02, x - size * 0.18, y - size * 0.06);
        ctx.quadraticCurveTo(x - size * 0.04, y - size * 0.12, x + size * 0.04, y - size * 0.04);
        ctx.quadraticCurveTo(x + size * 0.06, y + size * 0.08, x - size * 0.06, y + size * 0.16);
        ctx.quadraticCurveTo(x - size * 0.18, y + size * 0.18, x - size * 0.26, y + size * 0.14);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(40, 52, 62, 0.35)';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.04, y - size * 0.04);
        ctx.quadraticCurveTo(x + size * 0.06, y + size * 0.08, x - size * 0.06, y + size * 0.16);
        ctx.lineTo(x - size * 0.02, y + size * 0.04);
        ctx.closePath();
        ctx.fill();
        // Stone 2 — right
        ctx.fillStyle = '#5e6e78';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.06, y + size * 0.08);
        ctx.quadraticCurveTo(x + size * 0.04, y - size * 0.04, x + size * 0.16, y - size * 0.08);
        ctx.quadraticCurveTo(x + size * 0.26, y - size * 0.04, x + size * 0.24, y + size * 0.06);
        ctx.quadraticCurveTo(x + size * 0.18, y + size * 0.12, x + size * 0.06, y + size * 0.08);
        ctx.closePath();
        ctx.fill();
        // Stone 3 — small, front-center
        ctx.fillStyle = '#74848c';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.04, y + size * 0.18);
        ctx.quadraticCurveTo(x - size * 0.02, y + size * 0.10, x + size * 0.08, y + size * 0.12);
        ctx.quadraticCurveTo(x + size * 0.12, y + size * 0.18, x + size * 0.04, y + size * 0.22);
        ctx.quadraticCurveTo(x - size * 0.04, y + size * 0.22, x - size * 0.04, y + size * 0.18);
        ctx.closePath();
        ctx.fill();
        // Stone 4 — tiny, back
        ctx.fillStyle = '#667682';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.08, y - size * 0.10);
        ctx.quadraticCurveTo(x - size * 0.04, y - size * 0.16, x + size * 0.06, y - size * 0.14);
        ctx.quadraticCurveTo(x + size * 0.10, y - size * 0.10, x + size * 0.06, y - size * 0.06);
        ctx.quadraticCurveTo(x - size * 0.02, y - size * 0.04, x - size * 0.08, y - size * 0.10);
        ctx.closePath();
        ctx.fill();
        // Snow on stone 1
        ctx.fillStyle = 'rgba(238, 248, 255, 0.82)';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.20, y - size * 0.02);
        ctx.quadraticCurveTo(x - size * 0.10, y - size * 0.10, x + size * 0.02, y - size * 0.06);
        ctx.quadraticCurveTo(x, y + size * 0.02, x - size * 0.12, y + size * 0.02);
        ctx.quadraticCurveTo(x - size * 0.22, y + size * 0.02, x - size * 0.20, y - size * 0.02);
        ctx.closePath();
        ctx.fill();
        // Snow on stone 2
        ctx.fillStyle = 'rgba(235, 246, 255, 0.78)';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.10, y - size * 0.04);
        ctx.quadraticCurveTo(x + size * 0.16, y - size * 0.08, x + size * 0.22, y - size * 0.04);
        ctx.quadraticCurveTo(x + size * 0.20, y + size * 0.02, x + size * 0.12, y + size * 0.02);
        ctx.quadraticCurveTo(x + size * 0.08, y, x + size * 0.10, y - size * 0.04);
        ctx.closePath();
        ctx.fill();
    }

    renderDesertRock(ctx, x, y, size, gridX, gridY, variant) {
        const seed = (variant !== undefined && variant !== null) ? variant % 4 : Math.floor(gridX * 0.5 + gridY * 0.7) % 4;
        switch(seed) {
            case 0: this.renderDesertRock0(ctx, x, y, size); break;
            case 1: this.renderDesertRock1(ctx, x, y, size); break;
            case 2: this.renderDesertRock2(ctx, x, y, size); break;
            default: this.renderDesertRock3(ctx, x, y, size);
        }
    }

    renderDesertRock0(ctx, x, y, size) {
        // Smooth rounded sandstone boulder
        ctx.fillStyle = '#c8944a';
        ctx.beginPath(); ctx.ellipse(x, y, size*0.30, size*0.24, 0.15, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'rgba(90,55,12,0.50)';
        ctx.beginPath(); ctx.ellipse(x+size*0.10, y+size*0.08, size*0.26, size*0.20, 0.15, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'rgba(228,182,112,0.65)';
        ctx.beginPath(); ctx.ellipse(x-size*0.10, y-size*0.10, size*0.14, size*0.10, 0.15, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = 'rgba(100,65,18,0.28)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(x, y, size*0.30, size*0.24, 0.15, 0, Math.PI*2); ctx.stroke();
    }

    renderDesertRock1(ctx, x, y, size) {
        // Layered sandstone slab with visible strata
        const hw = size*0.32, hh = size*0.22;
        ctx.fillStyle = '#b88540';
        ctx.beginPath();
        ctx.moveTo(x-hw, y+hh*0.6); ctx.lineTo(x-hw*0.8, y-hh*0.6);
        ctx.lineTo(x+hw*0.8, y-hh*0.5); ctx.lineTo(x+hw, y+hh*0.6);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#8a6020'; ctx.lineWidth = 1.5;
        for (let i = 0; i < 3; i++) {
            const ly = y - hh*0.35 + i * hh*0.48;
            ctx.beginPath(); ctx.moveTo(x-hw*0.78, ly); ctx.lineTo(x+hw*0.78, ly+hh*0.04); ctx.stroke();
        }
        ctx.fillStyle = 'rgba(208,162,86,0.62)';
        ctx.beginPath();
        ctx.moveTo(x-hw*0.8, y-hh*0.6); ctx.lineTo(x+hw*0.8, y-hh*0.5);
        ctx.lineTo(x+hw*0.72, y-hh*0.22); ctx.lineTo(x-hw*0.7, y-hh*0.25);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(80,45,8,0.38)';
        ctx.beginPath();
        ctx.moveTo(x+hw*0.8, y-hh*0.5); ctx.lineTo(x+hw, y+hh*0.6);
        ctx.lineTo(x+hw*0.6, y+hh*0.6); ctx.lineTo(x+hw*0.6, y-hh*0.32);
        ctx.closePath(); ctx.fill();
    }

    renderDesertRock2(ctx, x, y, size) {
        // Angular faceted sandstone rock
        ctx.fillStyle = '#a87838';
        ctx.beginPath();
        ctx.moveTo(x-size*0.22, y-size*0.14); ctx.lineTo(x+size*0.16, y-size*0.22);
        ctx.lineTo(x+size*0.28, y+size*0.06); ctx.lineTo(x+size*0.12, y+size*0.26);
        ctx.lineTo(x-size*0.20, y+size*0.24); ctx.lineTo(x-size*0.30, y+size*0.04);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(210,162,80,0.60)';
        ctx.beginPath();
        ctx.moveTo(x-size*0.22, y-size*0.14); ctx.lineTo(x+size*0.16, y-size*0.22);
        ctx.lineTo(x+size*0.05, y-size*0.04); ctx.lineTo(x-size*0.15, y-size*0.02);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(70,40,8,0.42)';
        ctx.beginPath();
        ctx.moveTo(x+size*0.12, y+size*0.26); ctx.lineTo(x-size*0.20, y+size*0.24);
        ctx.lineTo(x-size*0.10, y+size*0.10); ctx.lineTo(x+size*0.08, y+size*0.12);
        ctx.closePath(); ctx.fill();
    }

    renderDesertRock3(ctx, x, y, size) {
        // Cluster of warm sandstone pebbles
        [[-0.14,0.06,0.15,0.11,-0.2],[0.13,-0.05,0.13,0.09,0.3],[0.0,0.16,0.11,0.08,0.1]]
        .forEach(([ox,oy,sw,sh,ang]) => {
            ctx.fillStyle = '#c49048';
            ctx.beginPath(); ctx.ellipse(x+ox*size, y+oy*size, sw*size, sh*size, ang, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = 'rgba(85,50,10,0.45)';
            ctx.beginPath(); ctx.ellipse(x+ox*size+sw*size*0.25, y+oy*size+sh*size*0.25, sw*size*0.68, sh*size*0.68, ang, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = 'rgba(212,170,92,0.58)';
            ctx.beginPath(); ctx.ellipse(x+ox*size-sw*size*0.20, y+oy*size-sh*size*0.22, sw*size*0.38, sh*size*0.32, ang, 0, Math.PI*2); ctx.fill();
        });
    }

    renderSpaceRock(ctx, x, y, size, gridX, gridY, variant) {
        const seed = (variant !== undefined && variant !== null) ? variant % 5 : Math.floor(gridX * 0.5 + gridY * 0.7) % 5;
        const scaledSize = size;
        switch(seed) {
            case 0:
                this.renderSpaceRockFractal(ctx, x, y, scaledSize);
                break;
            case 1:
                this.renderSpaceRockSpiky(ctx, x, y, scaledSize);
                break;
            case 2:
                this.renderSpaceRockCrystalline(ctx, x, y, scaledSize);
                break;
            case 3:
                this.renderSpaceRockVoid(ctx, x, y, scaledSize);
                break;
            default:
                this.renderSpaceRockNonEuclidean(ctx, x, y, scaledSize);
        }
    }

    renderSpaceRockFractal(ctx, x, y, size) {
        // Impossible angle asteroid with fractal pattern
        ctx.fillStyle = '#5a4a7a';
        
        // Main jagged form
        const points = [
            {x: -0.25, y: -0.3},
            {x: 0.15, y: -0.35},
            {x: 0.28, y: -0.1},
            {x: 0.35, y: 0.15},
            {x: 0.2, y: 0.3},
            {x: -0.1, y: 0.35},
            {x: -0.32, y: 0.1},
            {x: -0.3, y: -0.15}
        ];
        
        ctx.beginPath();
        ctx.moveTo(x + points[0].x * size, y + points[0].y * size);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(x + points[i].x * size, y + points[i].y * size);
        }
        ctx.closePath();
        ctx.fill();

        // Glowing edges
        ctx.strokeStyle = 'rgba(150, 100, 255, 0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + points[0].x * size, y + points[0].y * size);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(x + points[i].x * size, y + points[i].y * size);
        }
        ctx.closePath();
        ctx.stroke();

        // Highlight face (lighter face on top-left)
        ctx.fillStyle = 'rgba(120, 88, 180, 0.55)';
        ctx.beginPath();
        ctx.moveTo(x + points[0].x * size, y + points[0].y * size);
        ctx.lineTo(x + points[1].x * size, y + points[1].y * size);
        ctx.lineTo(x, y);
        ctx.closePath();
        ctx.fill();
        // Mineral veins
        ctx.strokeStyle = 'rgba(180, 140, 255, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x - size*0.05, y - size*0.20); ctx.lineTo(x + size*0.12, y + size*0.15); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x - size*0.18, y + size*0.05); ctx.lineTo(x + size*0.10, y - size*0.08); ctx.stroke();
    }

    renderSpaceRockSpiky(ctx, x, y, size) {
        // Jagged asteroid with bioluminescent spikes
        ctx.fillStyle = '#6a4a8a';
        
        // Main body
        ctx.beginPath();
        ctx.arc(x, y, size * 0.22, 0, Math.PI * 2);
        ctx.fill();

        // Spike protrusions in all directions
        const spikeCount = 12;
        for (let i = 0; i < spikeCount; i++) {
            const angle = (i / spikeCount) * Math.PI * 2;
            const baseX = x + Math.cos(angle) * size * 0.22;
            const baseY = y + Math.sin(angle) * size * 0.22;
            const tipX = x + Math.cos(angle) * size * 0.35;
            const tipY = y + Math.sin(angle) * size * 0.35;

            // Spike body
            ctx.fillStyle = '#5a3a7a';
            ctx.beginPath();
            ctx.moveTo(baseX, baseY);
            ctx.lineTo(tipX, tipY);
            ctx.lineTo(baseX + Math.cos(angle + 0.2) * size * 0.08, baseY + Math.sin(angle + 0.2) * size * 0.08);
            ctx.closePath();
            ctx.fill();

            // Bioluminescent glow on spike
            ctx.strokeStyle = `rgba(100, ${150 + Math.sin(i) * 50}, 255, 0.8)`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(baseX, baseY);
            ctx.lineTo(tipX, tipY);
            ctx.stroke();
        }

        // Glow core
        ctx.fillStyle = 'rgba(100, 150, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.18, 0, Math.PI * 2);
        ctx.fill();
    }

    renderSpaceRockCrystalline(ctx, x, y, size) {
        // Crystalline hexagonal structure
        const hexagonSize = size * 0.25;
        
        // Main crystal body
        ctx.fillStyle = '#7a5aaa';
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const px = x + Math.cos(angle) * hexagonSize;
            const py = y + Math.sin(angle) * hexagonSize;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        // Inner crystal layers
        ctx.fillStyle = '#9a7aaa';
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const px = x + Math.cos(angle) * hexagonSize * 0.6;
            const py = y + Math.sin(angle) * hexagonSize * 0.6;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        // Radiating glow rays
        ctx.strokeStyle = 'rgba(200, 150, 255, 0.7)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const startX = x + Math.cos(angle) * hexagonSize;
            const startY = y + Math.sin(angle) * hexagonSize;
            const endX = x + Math.cos(angle) * hexagonSize * 1.4;
            const endY = y + Math.sin(angle) * hexagonSize * 1.4;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }

        // Center glow
        ctx.fillStyle = 'rgba(200, 150, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.1, 0, Math.PI * 2);
        ctx.fill();
    }

    renderSpaceRockVoid(ctx, x, y, size) {
        // Floating chunk with impossible topology
        // Outer distorted form
        ctx.fillStyle = '#4a3a6a';
        ctx.beginPath();
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const distortion = 0.15 + Math.sin(angle * 3) * 0.1;
            const px = x + Math.cos(angle) * size * distortion;
            const py = y + Math.sin(angle) * size * distortion;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        // Energy field distortion ring
        ctx.strokeStyle = 'rgba(150, 100, 200, 0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const radius = size * (0.2 + Math.sin(angle * 4) * 0.08);
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();

        // Void core
        ctx.fillStyle = 'rgba(20, 10, 40, 0.9)';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.12, 0, Math.PI * 2);
        ctx.fill();

        // Void event horizon
        ctx.strokeStyle = 'rgba(200, 100, 255, 0.8)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.12, 0, Math.PI * 2);
        ctx.stroke();
    }

    renderSpaceRockNonEuclidean(ctx, x, y, size) {
        // Non-euclidean geometry rock with bezier curves
        ctx.fillStyle = '#6a4a9a';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.25, y - size * 0.2);
        ctx.bezierCurveTo(
            x - size * 0.3, y - size * 0.35,
            x + size * 0.1, y - size * 0.4,
            x + size * 0.3, y - size * 0.1
        );
        ctx.lineTo(x + size * 0.2, y + size * 0.15);
        ctx.bezierCurveTo(
            x + size * 0.05, y + size * 0.3,
            x - size * 0.15, y + size * 0.25,
            x - size * 0.25, y + size * 0.05
        );
        ctx.closePath();
        ctx.fill();

        // Second overlapping surface
        ctx.fillStyle = '#7a5aaa';
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.moveTo(x - size * 0.15, y - size * 0.25);
        ctx.bezierCurveTo(
            x - size * 0.05, y - size * 0.38,
            x + size * 0.25, y - size * 0.3,
            x + size * 0.25, y);
        ctx.lineTo(x + size * 0.1, y + size * 0.2);
        ctx.bezierCurveTo(
            x - size * 0.05, y + size * 0.2,
            x - size * 0.2, y + size * 0.1,
            x - size * 0.15, y - size * 0.1
        );
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;

        // Energy flowing between surfaces
        ctx.strokeStyle = 'rgba(150, 100, 255, 0.6)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            const progress = i / 5;
            const startX = x - size * 0.25 + size * 0.5 * progress;
            const startY = y - size * 0.2;
            const endX = x - size * 0.25 + size * 0.5 * progress;
            const endY = y + size * 0.2;
            
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.quadraticCurveTo(
                startX + Math.sin(progress * Math.PI * 4) * size * 0.1,
                (startY + endY) * 0.5,
                endX, endY
            );
            ctx.stroke();
        }

        // Edge glow
        ctx.strokeStyle = 'rgba(150, 100, 255, 0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - size * 0.25, y - size * 0.2);
        ctx.bezierCurveTo(
            x - size * 0.3, y - size * 0.35,
            x + size * 0.1, y - size * 0.4,
            x + size * 0.3, y - size * 0.1
        );
        ctx.stroke();
    }

    renderRockType1(ctx, x, y, size) {
        // Large rough jagged rock — fully opaque, no green tint
        
        // Drop shadow
        ctx.fillStyle = '#1a1a18';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.34, y + size * 0.23);
        ctx.lineTo(x - size * 0.36, y - size * 0.22);
        ctx.lineTo(x - size * 0.21, y - size * 0.38);
        ctx.lineTo(x + size * 0.06, y - size * 0.43);
        ctx.lineTo(x + size * 0.36, y - size * 0.13);
        ctx.lineTo(x + size * 0.35, y + size * 0.28);
        ctx.lineTo(x + 1, y + size * 0.42);
        ctx.closePath();
        ctx.fill();
        
        // Main rock body
        ctx.fillStyle = '#5e5e5e';
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
        
        // Right shadow face
        ctx.fillStyle = '#3a3a3a';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.32, y + size * 0.25);
        ctx.lineTo(x + size * 0.35, y - size * 0.15);
        ctx.lineTo(x + size * 0.05, y - size * 0.45);
        ctx.lineTo(x + size * 0.08, y - size * 0.3);
        ctx.lineTo(x + size * 0.02, y + size * 0.32);
        ctx.closePath();
        ctx.fill();
        
        // Light highlights on upper faces
        ctx.fillStyle = '#8a8a8a';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.2, y - size * 0.4);
        ctx.lineTo(x + size * 0.05, y - size * 0.45);
        ctx.lineTo(x - size * 0.05, y - size * 0.25);
        ctx.closePath();
        ctx.fill();
        
        // Weathering spots — warm brown/tan, no green
        ctx.fillStyle = '#4a4440';
        for (let i = 0; i < 4; i++) {
            const offsetX = (Math.sin(i * 1.7 + x * 0.015) - 0.5) * size * 0.3;
            const offsetY = (Math.cos(i * 1.7 + y * 0.015) - 0.5) * size * 0.22;
            const spotSize = size * (0.06 + Math.abs(Math.sin(i * 0.7)) * 0.03);
            ctx.beginPath();
            ctx.arc(x + offsetX, y + offsetY, spotSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Rock cracks
        ctx.strokeStyle = '#2a2a28';
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
        
        // Outline
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
    }

    renderRockType2(ctx, x, y, size) {
        // Irregular boulder — NOT a circle, natural lumpy shape
        
        // Drop shadow
        ctx.fillStyle = '#1a1a18';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.30, y + size * 0.22);
        ctx.lineTo(x - size * 0.36, y + size * 0.05);
        ctx.lineTo(x - size * 0.28, y - size * 0.22);
        ctx.lineTo(x - size * 0.08, y - size * 0.34);
        ctx.lineTo(x + size * 0.20, y - size * 0.30);
        ctx.lineTo(x + size * 0.36, y - size * 0.10);
        ctx.lineTo(x + size * 0.34, y + size * 0.18);
        ctx.lineTo(x + size * 0.18, y + size * 0.30);
        ctx.lineTo(x - size * 0.10, y + size * 0.32);
        ctx.closePath();
        ctx.fill();
        
        // Main boulder body — irregular polygon
        ctx.fillStyle = '#636363';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.32, y + size * 0.18);
        ctx.lineTo(x - size * 0.38, y + size * 0.02);
        ctx.lineTo(x - size * 0.30, y - size * 0.20);
        ctx.lineTo(x - size * 0.10, y - size * 0.36);
        ctx.lineTo(x + size * 0.18, y - size * 0.32);
        ctx.lineTo(x + size * 0.34, y - size * 0.12);
        ctx.lineTo(x + size * 0.32, y + size * 0.15);
        ctx.lineTo(x + size * 0.16, y + size * 0.28);
        ctx.lineTo(x - size * 0.12, y + size * 0.30);
        ctx.closePath();
        ctx.fill();
        
        // Darker right/bottom face for dimension
        ctx.fillStyle = '#444444';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.34, y - size * 0.12);
        ctx.lineTo(x + size * 0.32, y + size * 0.15);
        ctx.lineTo(x + size * 0.16, y + size * 0.28);
        ctx.lineTo(x - size * 0.12, y + size * 0.30);
        ctx.lineTo(x - size * 0.05, y + size * 0.10);
        ctx.lineTo(x + size * 0.15, y - size * 0.05);
        ctx.closePath();
        ctx.fill();
        
        // Light highlight on upper-left
        ctx.fillStyle = '#9a9a9a';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.30, y - size * 0.20);
        ctx.lineTo(x - size * 0.10, y - size * 0.36);
        ctx.lineTo(x + size * 0.08, y - size * 0.28);
        ctx.lineTo(x - size * 0.12, y - size * 0.10);
        ctx.closePath();
        ctx.fill();
        
        // Secondary highlight
        ctx.fillStyle = '#888888';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.38, y + size * 0.02);
        ctx.lineTo(x - size * 0.30, y - size * 0.15);
        ctx.lineTo(x - size * 0.18, y - size * 0.02);
        ctx.lineTo(x - size * 0.28, y + size * 0.08);
        ctx.closePath();
        ctx.fill();
        
        // Weathering spots — warm brown tones, no green
        ctx.fillStyle = '#4e4844';
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2 + 0.5;
            const distance = size * (0.12 + Math.abs(Math.sin(i * 0.5)) * 0.08);
            const vx = x + Math.cos(angle) * distance;
            const vy = y + Math.sin(angle) * distance;
            const spotSize = size * (0.05 + Math.abs(Math.cos(i * 0.7)) * 0.03);
            ctx.beginPath();
            ctx.arc(vx, vy, spotSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Subtle cracks
        ctx.strokeStyle = '#2e2e2c';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x - size * 0.10, y - size * 0.15);
        ctx.lineTo(x + size * 0.10, y + size * 0.12);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + size * 0.05, y - size * 0.20);
        ctx.lineTo(x + size * 0.20, y + size * 0.05);
        ctx.stroke();
        
        // Outline
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x - size * 0.32, y + size * 0.18);
        ctx.lineTo(x - size * 0.38, y + size * 0.02);
        ctx.lineTo(x - size * 0.30, y - size * 0.20);
        ctx.lineTo(x - size * 0.10, y - size * 0.36);
        ctx.lineTo(x + size * 0.18, y - size * 0.32);
        ctx.lineTo(x + size * 0.34, y - size * 0.12);
        ctx.lineTo(x + size * 0.32, y + size * 0.15);
        ctx.lineTo(x + size * 0.16, y + size * 0.28);
        ctx.lineTo(x - size * 0.12, y + size * 0.30);
        ctx.closePath();
        ctx.stroke();
    }

    renderRockType3(ctx, x, y, size) {
        // Jagged angular rock — fully opaque, no green tint
        
        // Drop shadow
        ctx.fillStyle = '#1a1a18';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.34, y + size * 0.28);
        ctx.lineTo(x - size * 0.36, y - size * 0.09);
        ctx.lineTo(x - size * 0.1, y - size * 0.37);
        ctx.lineTo(x + size * 0.32, y - size * 0.17);
        ctx.lineTo(x + size * 0.36, y + size * 0.31);
        ctx.closePath();
        ctx.fill();
        
        // Main rock body
        ctx.fillStyle = '#585858';
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
        ctx.fillStyle = '#3e3e3e';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.1, y - size * 0.38);
        ctx.lineTo(x + size * 0.32, y - size * 0.18);
        ctx.lineTo(x + size * 0.15, y - size * 0.1);
        ctx.closePath();
        ctx.fill();
        
        // Weathering spots — warm brown, no green
        ctx.fillStyle = '#4a4440';
        for (let i = 0; i < 4; i++) {
            const offsetX = (Math.sin(i * 1.5 + x * 0.01) - 0.5) * size * 0.28;
            const offsetY = (Math.cos(i * 1.5 + y * 0.01) - 0.5) * size * 0.20;
            const spotSize = size * (0.05 + Math.abs(Math.sin(i * 0.6)) * 0.03);
            ctx.beginPath();
            ctx.arc(x + offsetX, y + offsetY, spotSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Cracks
        ctx.strokeStyle = '#2a2a28';
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
    }

    renderRockType4(ctx, x, y, size) {
        // Jagged rocky formation — fully opaque, no green tint
        
        // Drop shadow
        ctx.fillStyle = '#1a1a18';
        ctx.beginPath();
        ctx.ellipse(x + size * 0.05, y + size * 0.24, size * 0.38, size * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Main rock body - irregular polygon
        ctx.fillStyle = '#5e5e5e';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.25, y + size * 0.2);
        ctx.lineTo(x - size * 0.35, y - size * 0.1);
        ctx.lineTo(x - size * 0.2, y - size * 0.32);
        ctx.lineTo(x + size * 0.05, y - size * 0.35);
        ctx.lineTo(x + size * 0.3, y - size * 0.15);
        ctx.lineTo(x + size * 0.32, y + size * 0.15);
        ctx.lineTo(x + size * 0.15, y + size * 0.22);
        ctx.closePath();
        ctx.fill();
        
        // Left highlighted face
        ctx.fillStyle = '#8a8a8a';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.25, y + size * 0.2);
        ctx.lineTo(x - size * 0.35, y - size * 0.1);
        ctx.lineTo(x - size * 0.2, y - size * 0.32);
        ctx.lineTo(x - size * 0.05, y - size * 0.1);
        ctx.closePath();
        ctx.fill();
        
        // Top bright face
        ctx.fillStyle = '#9a9a9a';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.2, y - size * 0.32);
        ctx.lineTo(x + size * 0.05, y - size * 0.35);
        ctx.lineTo(x + size * 0.15, y - size * 0.2);
        ctx.lineTo(x - size * 0.05, y - size * 0.15);
        ctx.closePath();
        ctx.fill();
        
        // Dark right face
        ctx.fillStyle = '#3a3a3a';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.05, y - size * 0.35);
        ctx.lineTo(x + size * 0.3, y - size * 0.15);
        ctx.lineTo(x + size * 0.2, y + size * 0.05);
        ctx.lineTo(x + size * 0.05, y - size * 0.1);
        ctx.closePath();
        ctx.fill();
        
        // Weathering stains — brown/tan, no green
        ctx.fillStyle = '#4a4440';
        for (let i = 0; i < 5; i++) {
            const offsetX = (Math.sin(i * 1.2 + x * 0.01) - 0.5) * size * 0.3;
            const offsetY = (Math.cos(i * 1.2 + y * 0.01) - 0.5) * size * 0.25;
            const spotSize = size * (0.05 + Math.abs(Math.sin(i * 0.6)) * 0.03);
            ctx.beginPath();
            ctx.arc(x + offsetX, y + offsetY, spotSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Cracks
        ctx.strokeStyle = '#2a2a28';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x - size * 0.15, y - size * 0.15);
        ctx.lineTo(x + size * 0.1, y + size * 0.1);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.25);
        ctx.lineTo(x - size * 0.1, y + size * 0.15);
        ctx.stroke();
        
        // Outline
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x - size * 0.25, y + size * 0.2);
        ctx.lineTo(x - size * 0.35, y - size * 0.1);
        ctx.lineTo(x - size * 0.2, y - size * 0.32);
        ctx.lineTo(x + size * 0.05, y - size * 0.35);
        ctx.lineTo(x + size * 0.3, y - size * 0.15);
        ctx.lineTo(x + size * 0.32, y + size * 0.15);
        ctx.lineTo(x + size * 0.15, y + size * 0.22);
        ctx.closePath();
        ctx.stroke();
    }

    renderLakeCells(ctx) {
        // Collect all lake cells from terrain elements into a set for efficient neighbor lookup
        if (!this.terrainElements) return;
        const lakeCellSet = new Set();
        for (const elem of this.terrainElements) {
            if (elem.type === 'water' && elem.waterType === 'lake') {
                lakeCellSet.add(`${Math.round(elem.gridX)},${Math.round(elem.gridY)}`);
            }
        }
        if (lakeCellSet.size === 0) return;

        const cs = this.cellSize;

        // First pass: fill each lake cell with water color
        lakeCellSet.forEach(key => {
            const [gx, gy] = key.split(',').map(Number);
            const px = gx * cs;
            const py = gy * cs;
            ctx.fillStyle = '#01579B';
            ctx.fillRect(px, py, cs, cs);
        });

        // Second pass: draw shore edges and highlight
        lakeCellSet.forEach(key => {
            const [gx, gy] = key.split(',').map(Number);
            const px = gx * cs;
            const py = gy * cs;

            const hasTop = lakeCellSet.has(`${gx},${gy - 1}`);
            const hasBottom = lakeCellSet.has(`${gx},${gy + 1}`);
            const hasLeft = lakeCellSet.has(`${gx - 1},${gy}`);
            const hasRight = lakeCellSet.has(`${gx + 1},${gy}`);

            // Dark shore edge where lake meets land
            ctx.strokeStyle = '#004D7A';
            ctx.lineWidth = Math.max(1, cs * 0.08);
            if (!hasTop) { ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + cs, py); ctx.stroke(); }
            if (!hasBottom) { ctx.beginPath(); ctx.moveTo(px, py + cs); ctx.lineTo(px + cs, py + cs); ctx.stroke(); }
            if (!hasLeft) { ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py + cs); ctx.stroke(); }
            if (!hasRight) { ctx.beginPath(); ctx.moveTo(px + cs, py); ctx.lineTo(px + cs, py + cs); ctx.stroke(); }

            // Subtle wave highlight in center
            ctx.fillStyle = 'rgba(41, 182, 246, 0.15)';
            const inset = cs * 0.2;
            ctx.fillRect(px + inset, py + inset, cs - inset * 2, cs - inset * 2);
        });
    }

    renderLake(ctx, x, y, size) {
        // Create organic water shape with rounded edges
        // Use 0.7 multiplier to match collision radius (size * 0.71 in markTerrainCells)
        const radius = size * 0.7;
        
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

    renderCactus(ctx, x, y, size, gridX, gridY) {
        // Use deterministic variation based on grid position
        const seed = Math.floor(gridX * 0.5 + gridY * 0.7) % 3;
        switch(seed) {
            case 0:
                this.renderCactusType1(ctx, x, y, size);
                break;
            case 1:
                this.renderCactusType2(ctx, x, y, size);
                break;
            default:
                this.renderCactusType3(ctx, x, y, size);
        }
    }

    renderCactusType1(ctx, x, y, size) {
        // Tall columnar saguaro-style cactus with arms
        const mainHeight = size * 0.6;
        const mainWidth = size * 0.25;

        // Shadow
        ctx.fillStyle = 'rgba(20, 80, 20, 0.3)';
        ctx.beginPath();
        ctx.ellipse(x + 2, y + 2, mainWidth * 0.8, size * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Main body - bright green
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(x - mainWidth * 0.5, y - mainHeight, mainWidth, mainHeight);

        // Left arm
        ctx.fillStyle = '#27ae60';
        const leftArmStartX = x - mainWidth * 0.35;
        const leftArmStartY = y - mainHeight * 0.5;
        const leftArmWidth = size * 0.15;
        const leftArmLength = size * 0.35;
        ctx.fillRect(leftArmStartX - leftArmLength, leftArmStartY - leftArmWidth * 0.5, leftArmLength, leftArmWidth);
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(leftArmStartX - leftArmLength + 2, leftArmStartY - leftArmWidth * 0.5 + 2, leftArmLength - 4, leftArmWidth - 4);

        // Right arm
        ctx.fillStyle = '#27ae60';
        const rightArmStartX = x + mainWidth * 0.35;
        const rightArmStartY = y - mainHeight * 0.6;
        const rightArmWidth = size * 0.15;
        const rightArmLength = size * 0.3;
        ctx.fillRect(rightArmStartX, rightArmStartY - rightArmWidth * 0.5, rightArmLength, rightArmWidth);
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(rightArmStartX + 2, rightArmStartY - rightArmWidth * 0.5 + 2, rightArmLength - 4, rightArmWidth - 4);

        // Spines (darker green dots)
        ctx.fillStyle = '#1e8449';
        for (let i = 0; i < 6; i++) {
            const spineY = y - mainHeight + (i * mainHeight / 6);
            // Left side spines
            ctx.beginPath();
            ctx.arc(x - mainWidth * 0.4, spineY, 2, 0, Math.PI * 2);
            ctx.fill();
            // Right side spines
            ctx.beginPath();
            ctx.arc(x + mainWidth * 0.4, spineY, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Highlight on main body
        ctx.fillStyle = '#58d68d';
        ctx.fillRect(x - mainWidth * 0.3, y - mainHeight * 0.8, mainWidth * 0.35, mainHeight * 0.5);

        // Outline
        ctx.strokeStyle = '#186a3b';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x - mainWidth * 0.5, y - mainHeight, mainWidth, mainHeight);
    }

    renderCactusType2(ctx, x, y, size) {
        // Round barrel cactus
        const radius = size * 0.28;
        const height = size * 0.5;

        // Shadow base
        ctx.fillStyle = 'rgba(20, 80, 20, 0.35)';
        ctx.beginPath();
        ctx.ellipse(x + 2, y + 2, radius * 0.9, size * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();

        // Main body - bright green barrel shape
        ctx.fillStyle = '#2ecc71';
        ctx.beginPath();
        ctx.ellipse(x, y - size * 0.1, radius, radius * 1.1, 0, 0, Math.PI * 2);
        ctx.fill();

        // Darker shadow side
        ctx.fillStyle = '#27ae60';
        ctx.beginPath();
        ctx.ellipse(x + radius * 0.3, y - size * 0.1, radius * 0.6, radius * 0.9, 0, 0, Math.PI * 2);
        ctx.fill();

        // Spines arranged in vertical rows
        ctx.fillStyle = '#1e8449';
        const spineRows = 4;
        const spinesPerRow = 3;
        for (let row = 0; row < spineRows; row++) {
            const rowY = y - radius - (row * radius * 0.35);
            for (let i = 0; i < spinesPerRow; i++) {
                const angle = (i / spinesPerRow) * Math.PI * 2;
                const spineX = x + Math.cos(angle) * radius * 0.8;
                const spineY = rowY;
                ctx.beginPath();
                ctx.arc(spineX, spineY, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Highlight reflection
        ctx.fillStyle = '#58d68d';
        ctx.beginPath();
        ctx.ellipse(x - radius * 0.3, y - radius * 0.6, radius * 0.35, radius * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Top of cactus - top view
        ctx.fillStyle = '#20c061';
        ctx.beginPath();
        ctx.ellipse(x, y - radius, radius * 0.85, radius * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Outline
        ctx.strokeStyle = '#186a3b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(x, y - size * 0.1, radius, radius * 1.1, 0, 0, Math.PI * 2);
        ctx.stroke();
    }

    renderCactusType3(ctx, x, y, size) {
        // Cluster of prickly pear style cactus pads
        const padSize = size * 0.22;
        
        // Shadow base
        ctx.fillStyle = 'rgba(20, 80, 20, 0.3)';
        ctx.beginPath();
        ctx.ellipse(x + 2, y + 2, padSize * 1.5, padSize * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Bottom left pad
        ctx.fillStyle = '#27ae60';
        ctx.save();
        ctx.translate(x - padSize * 0.5, y);
        ctx.rotate(-Math.PI / 6);
        ctx.fillRect(-padSize * 0.4, -padSize * 0.6, padSize * 0.8, padSize * 1.2);
        ctx.restore();

        ctx.fillStyle = '#2ecc71';
        ctx.save();
        ctx.translate(x - padSize * 0.5, y);
        ctx.rotate(-Math.PI / 6);
        ctx.fillRect(-padSize * 0.3, -padSize * 0.5, padSize * 0.6, padSize * 1.0);
        ctx.restore();

        // Bottom right pad
        ctx.fillStyle = '#27ae60';
        ctx.save();
        ctx.translate(x + padSize * 0.5, y);
        ctx.rotate(Math.PI / 6);
        ctx.fillRect(-padSize * 0.4, -padSize * 0.6, padSize * 0.8, padSize * 1.2);
        ctx.restore();

        ctx.fillStyle = '#2ecc71';
        ctx.save();
        ctx.translate(x + padSize * 0.5, y);
        ctx.rotate(Math.PI / 6);
        ctx.fillRect(-padSize * 0.3, -padSize * 0.5, padSize * 0.6, padSize * 1.0);
        ctx.restore();

        // Top center pad
        ctx.fillStyle = '#27ae60';
        ctx.fillRect(x - padSize * 0.35, y - padSize * 0.8, padSize * 0.7, padSize * 1.0);

        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(x - padSize * 0.25, y - padSize * 0.7, padSize * 0.5, padSize * 0.8);

        // Spines on top pad
        ctx.fillStyle = '#1e8449';
        for (let i = 0; i < 4; i++) {
            const spineX = x - padSize * 0.1 + (i - 1.5) * padSize * 0.15;
            ctx.beginPath();
            ctx.arc(spineX, y - padSize * 0.3, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Highlight
        ctx.fillStyle = '#58d68d';
        ctx.beginPath();
        ctx.ellipse(x - padSize * 0.2, y - padSize * 0.4, padSize * 0.3, padSize * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    renderDryBush(ctx, x, y, size, gridX, gridY) {
        // Use deterministic variation based on grid position
        const seed = Math.floor(gridX * 0.3 + gridY * 0.8) % 3;
        switch(seed) {
            case 0:
                this.renderDryBushType1(ctx, x, y, size);
                break;
            case 1:
                this.renderDryBushType2(ctx, x, y, size);
                break;
            default:
                this.renderDryBushType3(ctx, x, y, size);
        }
    }

    renderDryBushType1(ctx, x, y, size) {
        // Spiky tumbleweed style dry bush - browns and tans
        const radius = size * 0.3;

        // Shadow
        ctx.fillStyle = 'rgba(80, 40, 20, 0.3)';
        ctx.beginPath();
        ctx.ellipse(x + 2, y + 2, radius * 0.9, size * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Main dry wood color branches
        ctx.strokeStyle = '#8b6f47';
        ctx.lineWidth = size * 0.08;
        const branchCount = 6;
        for (let i = 0; i < branchCount; i++) {
            const angle = (i / branchCount) * Math.PI * 2;
            const endX = x + Math.cos(angle) * radius;
            const endY = y + Math.sin(angle) * radius;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }

        // Lighter tan highlights on branches
        ctx.strokeStyle = '#a0845c';
        ctx.lineWidth = size * 0.04;
        for (let i = 0; i < branchCount; i++) {
            const angle = (i / branchCount) * Math.PI * 2 + 0.1;
            const endX = x + Math.cos(angle) * radius * 0.8;
            const endY = y + Math.sin(angle) * radius * 0.8;
            ctx.beginPath();
            ctx.moveTo(x + 2, y + 2);
            ctx.lineTo(endX + 2, endY + 2);
            ctx.stroke();
        }

        // Dry leafless appearance with small twigs
        ctx.strokeStyle = '#6b5238';
        ctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * radius * 0.7;
            const startX = x + Math.cos(angle) * distance;
            const startY = y + Math.sin(angle) * distance;
            const twigAngle = Math.random() * Math.PI * 2;
            const twigLength = size * 0.08;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(startX + Math.cos(twigAngle) * twigLength, startY + Math.sin(twigAngle) * twigLength);
            ctx.stroke();
        }
    }

    renderDryBushType2(ctx, x, y, size) {
        // Low rounded dry shrub - browns with gaps
        const baseWidth = size * 0.35;
        const baseHeight = size * 0.28;

        // Shadow
        ctx.fillStyle = 'rgba(80, 40, 20, 0.35)';
        ctx.beginPath();
        ctx.ellipse(x + 2, y + 2, baseWidth * 0.8, baseHeight * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Main dry brown body
        ctx.fillStyle = '#9d7c54';
        ctx.beginPath();
        ctx.ellipse(x, y, baseWidth, baseHeight, 0, 0, Math.PI * 2);
        ctx.fill();

        // Darker shadowed side
        ctx.fillStyle = '#7a5c3f';
        ctx.beginPath();
        ctx.ellipse(x + baseWidth * 0.2, y + baseHeight * 0.2, baseWidth * 0.6, baseHeight * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Lighter tan highlights
        ctx.fillStyle = '#bfa878';
        ctx.beginPath();
        ctx.ellipse(x - baseWidth * 0.15, y - baseHeight * 0.3, baseWidth * 0.4, baseHeight * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Gnarled texture - visible dead twigs/branches
        ctx.strokeStyle = '#5c4630';
        ctx.lineWidth = 1.5;
        const twigCount = 6;
        for (let i = 0; i < twigCount; i++) {
            const angle = (i / twigCount) * Math.PI * 2;
            const startDist = baseWidth * 0.3;
            const endDist = baseWidth * 0.7;
            const startX = x + Math.cos(angle) * startDist;
            const startY = y + Math.sin(angle) * startDist;
            const endX = x + Math.cos(angle) * endDist;
            const endY = y + Math.sin(angle) * endDist;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }

        // Outline
        ctx.strokeStyle = '#6b5238';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(x, y, baseWidth, baseHeight, 0, 0, Math.PI * 2);
        ctx.stroke();
    }

    renderDryBushType3(ctx, x, y, size) {
        // Scattered wisps of dry brush - almost like tumble weed fragments
        const clumpCount = 4;
        const colors = ['#8b6f47', '#9d7c54', '#a0845c', '#7a5c3f'];

        // Shadow
        ctx.fillStyle = 'rgba(80, 40, 20, 0.3)';
        ctx.beginPath();
        ctx.ellipse(x + 2, y + 2, size * 0.3, size * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Create scattered clumps
        for (let i = 0; i < clumpCount; i++) {
            const angle = (i / clumpCount) * Math.PI * 2;
            const distance = size * 0.18;
            const clumpX = x + Math.cos(angle) * distance;
            const clumpY = y + Math.sin(angle) * distance;
            const clumpSize = size * (0.12 + Math.abs(Math.sin(i * 0.7)) * 0.08);

            // Clump body
            ctx.fillStyle = colors[i % colors.length];
            ctx.beginPath();
            ctx.arc(clumpX, clumpY, clumpSize, 0, Math.PI * 2);
            ctx.fill();

            // Inner lighter part
            ctx.fillStyle = 'rgba(224, 200, 150, 0.4)';
            ctx.beginPath();
            ctx.arc(clumpX - clumpSize * 0.3, clumpY - clumpSize * 0.3, clumpSize * 0.5, 0, Math.PI * 2);
            ctx.fill();

            // Small twig details
            ctx.strokeStyle = '#5c4630';
            ctx.lineWidth = 0.8;
            for (let j = 0; j < 3; j++) {
                const twigAngle = Math.PI * 2 * j / 3;
                const twigEndX = clumpX + Math.cos(twigAngle) * clumpSize * 0.7;
                const twigEndY = clumpY + Math.sin(twigAngle) * clumpSize * 0.7;
                ctx.beginPath();
                ctx.moveTo(clumpX, clumpY);
                ctx.lineTo(twigEndX, twigEndY);
                ctx.stroke();
            }
        }

        // Central connection point - darker
        ctx.fillStyle = '#6b5238';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.08, 0, Math.PI * 2);
        ctx.fill();
    }
}

