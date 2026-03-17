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
            
            // Create castle at the end of the path
            this.castleLoadPromise = this.createCastle();
            
            // Don't wait for castle here - it will load asynchronously
            // The castleLoadPromise can be awaited if needed
            
            // Clear and recalculate occupied cells
            this.occupiedCells.clear();
            this.markPathCells();
            this.markTerrainCells();
            
            // Reset path texture so it regenerates for new canvas dimensions
            this.pathTextureGenerated = false;
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
        // Full forest floor — top-down forced perspective, no sky or horizon
        const ground = ctx.createLinearGradient(0, 0, 0, h);
        ground.addColorStop(0,    '#2c6014');
        ground.addColorStop(0.28, '#1e4a0a');
        ground.addColorStop(0.62, '#153808');
        ground.addColorStop(1,    '#0a2003');
        ctx.fillStyle = ground;
        ctx.fillRect(0, 0, w, h);

        // Grass tufts — dense clusters of short upward blades
        ctx.lineWidth = 1;
        [[0.05,0.12,6],[0.12,0.22,5],[0.20,0.15,7],[0.30,0.08,6],[0.38,0.18,5],
         [0.47,0.10,6],[0.55,0.20,7],[0.63,0.12,5],[0.72,0.22,6],[0.80,0.14,7],[0.88,0.08,5],[0.95,0.16,6],
         [0.04,0.35,6],[0.14,0.42,5],[0.22,0.38,7],[0.33,0.45,6],[0.42,0.36,5],
         [0.52,0.44,7],[0.61,0.38,6],[0.70,0.45,5],[0.78,0.36,7],[0.86,0.42,6],[0.94,0.38,5],
         [0.08,0.62,7],[0.18,0.55,5],[0.28,0.65,6],[0.40,0.58,7],[0.50,0.62,5],
         [0.60,0.55,6],[0.70,0.65,7],[0.80,0.58,5],[0.90,0.62,6],
         [0.06,0.78,5],[0.16,0.82,6],[0.26,0.75,7],[0.38,0.80,5],[0.48,0.72,6],
         [0.58,0.82,5],[0.68,0.75,7],[0.78,0.80,6],[0.88,0.72,5],[0.96,0.80,6]]
        .forEach(([fx, fy, n]) => {
            const gx = w * fx, gy = h * fy;
            const bladeLen = h * (0.012 + Math.abs(Math.sin(fx * 11 + fy * 7)) * 0.010);
            for (let k = 0; k < n; k++) {
                const bx = gx + (k - n * 0.5) * 3;
                const lean = (Math.sin(fx * 17 + k * 2.3) - 0.5) * 0.4;
                const g = 100 + Math.floor(Math.abs(Math.sin(fy * 9 + k)) * 50);
                ctx.strokeStyle = `rgba(30,${g},10,0.55)`;
                ctx.beginPath();
                ctx.moveTo(bx, gy);
                ctx.quadraticCurveTo(bx + lean * bladeLen, gy - bladeLen * 0.5, bx + lean * bladeLen * 1.4, gy - bladeLen);
                ctx.stroke();
            }
        });

        // Fallen leaf scatter — small elongated shapes in autumn browns/yellows
        [[0.10,0.18,1.8],[0.24,0.26,1.5],[0.36,0.14,1.6],[0.46,0.24,2.0],[0.58,0.16,1.7],
         [0.70,0.28,1.5],[0.82,0.18,1.8],[0.92,0.24,1.6],
         [0.08,0.44,1.7],[0.20,0.52,2.0],[0.34,0.40,1.5],[0.48,0.48,1.8],[0.62,0.42,1.6],
         [0.76,0.50,1.9],[0.88,0.44,1.5],
         [0.12,0.68,1.8],[0.24,0.74,1.6],[0.40,0.62,2.0],[0.54,0.70,1.7],
         [0.66,0.64,1.5],[0.78,0.72,1.8],[0.92,0.66,1.6]]
        .forEach(([fx, fy, sz]) => {
            const lx = w * fx, ly = h * fy;
            const ang = Math.sin(fx * 23 + fy * 17) * Math.PI;
            const r = Math.abs(Math.sin(fx * 31 + fy * 13));
            const leafColor = r < 0.33 ? 'rgba(140,80,20,0.55)' : r < 0.66 ? 'rgba(160,100,30,0.50)' : 'rgba(180,130,40,0.48)';
            ctx.fillStyle = leafColor;
            ctx.save(); ctx.translate(lx, ly); ctx.rotate(ang);
            ctx.beginPath(); ctx.ellipse(0, 0, sz * 2.5, sz * 1.1, 0, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'rgba(90,50,10,0.35)'; ctx.lineWidth = 0.6;
            ctx.beginPath(); ctx.moveTo(-sz * 2, 0); ctx.lineTo(sz * 2, 0); ctx.stroke();
            ctx.restore();
        });

        // Dirt patches — irregular ground-level earth marks
        [[0.16,0.30,0.018],[0.44,0.12,0.015],[0.66,0.35,0.022],[0.84,0.20,0.016],
         [0.10,0.58,0.020],[0.32,0.62,0.018],[0.56,0.68,0.015],[0.76,0.60,0.019],[0.92,0.74,0.017]]
        .forEach(([fx, fy, fs]) => {
            const dx = w * fx, dy = h * fy, ds = w * fs * 2.2;
            const tone = Math.abs(Math.sin(fx * 19 + fy * 11));
            const light = Math.floor(28 + tone * 14);
            ctx.fillStyle = `rgba(${light},${Math.floor(light * 1.2)},${Math.floor(light * 0.2)},0.22)`;
            ctx.beginPath();
            const numPts = 7 + Math.floor(Math.abs(Math.sin(fx * 7 + fy * 5)) * 2);
            for (let pi = 0; pi < numPts; pi++) {
                const pang = pi / numPts * Math.PI * 2 + Math.sin(fx * 5 + pi * 2.3) * 0.45;
                const pr = ds * (0.78 + Math.abs(Math.sin(fx * 13 + fy * 7 + pi * 1.1)) * 0.40);
                pi === 0 ? ctx.moveTo(dx + Math.cos(pang) * pr, dy + Math.sin(pang) * pr * 0.58) :
                           ctx.lineTo(dx + Math.cos(pang) * pr, dy + Math.sin(pang) * pr * 0.58);
            }
            ctx.closePath(); ctx.fill();
        });

        // Foreground shadow vignette
        const vgn = ctx.createLinearGradient(0, h * 0.72, 0, h);
        vgn.addColorStop(0, 'rgba(0,0,0,0)'); vgn.addColorStop(1, 'rgba(0,0,0,0.42)');
        ctx.fillStyle = vgn; ctx.fillRect(0, h * 0.72, w, h * 0.28);
    }

    // --- MOUNTAIN / SNOW BACKDROP: full snow field top-down, no sky ---
    _renderMountainBackdrop(ctx, w, h) {
        // Full snow/ice ground — bright and distant at top, shadowed/close at bottom
        const ground = ctx.createLinearGradient(0, 0, 0, h);
        ground.addColorStop(0,    '#eaf4fc');
        ground.addColorStop(0.28, '#dce8f2');
        ground.addColorStop(0.60, '#c8d8ea');
        ground.addColorStop(1,    '#aec0d4');
        ctx.fillStyle = ground;
        ctx.fillRect(0, 0, w, h);

        // Snow tufts — small clustered frost-blade bursts
        ctx.lineWidth = 1;
        [[0.05,0.12,5],[0.14,0.20,4],[0.22,0.14,6],[0.32,0.08,5],[0.40,0.18,4],
         [0.50,0.10,5],[0.58,0.22,6],[0.66,0.12,4],[0.76,0.20,5],[0.84,0.14,6],[0.92,0.08,4],[0.96,0.18,5],
         [0.04,0.34,5],[0.16,0.42,4],[0.24,0.36,6],[0.36,0.44,5],[0.44,0.36,4],
         [0.54,0.44,6],[0.62,0.36,5],[0.72,0.44,4],[0.80,0.36,6],[0.88,0.42,5],[0.94,0.36,4],
         [0.08,0.60,6],[0.20,0.54,4],[0.30,0.64,5],[0.42,0.58,6],[0.52,0.62,4],
         [0.62,0.54,5],[0.72,0.64,6],[0.82,0.58,4],[0.92,0.62,5],
         [0.06,0.76,4],[0.18,0.82,5],[0.28,0.74,6],[0.40,0.80,4],[0.50,0.72,5],
         [0.60,0.80,4],[0.70,0.74,6],[0.80,0.78,5],[0.90,0.72,4],[0.96,0.80,5]]
        .forEach(([fx, fy, n]) => {
            const gx = w * fx, gy = h * fy;
            const bLen = h * (0.008 + Math.abs(Math.sin(fx * 11 + fy * 7)) * 0.007);
            for (let k = 0; k < n; k++) {
                const bx = gx + (k - n * 0.5) * 2.5;
                const lean = (Math.sin(fx * 17 + k * 2.3) - 0.5) * 0.3;
                const bright = 210 + Math.floor(Math.abs(Math.sin(fy * 9 + k)) * 40);
                ctx.strokeStyle = `rgba(${bright},${bright},255,0.50)`;
                ctx.beginPath();
                ctx.moveTo(bx, gy);
                ctx.quadraticCurveTo(bx + lean * bLen, gy - bLen * 0.5, bx + lean * bLen * 1.2, gy - bLen);
                ctx.stroke();
            }
        });

        // Snow sparkle glints — tiny cross marks scattered across the snow
        ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.lineWidth = 1;
        [[0.07,0.10],[0.18,0.06],[0.28,0.16],[0.40,0.08],[0.52,0.14],[0.64,0.06],[0.76,0.16],[0.88,0.09],[0.96,0.13],
         [0.04,0.32],[0.15,0.40],[0.26,0.34],[0.38,0.42],[0.50,0.34],[0.62,0.42],[0.74,0.34],[0.86,0.40],[0.96,0.36],
         [0.10,0.54],[0.22,0.58],[0.34,0.52],[0.46,0.60],[0.58,0.52],[0.70,0.58],[0.82,0.52],[0.92,0.56]]
        .forEach(([fx, fy]) => {
            const gx = w * fx, gy = h * fy;
            const r = w * (0.003 + Math.abs(Math.sin(fx * 29 + fy * 17)) * 0.004);
            ctx.beginPath(); ctx.moveTo(gx - r, gy); ctx.lineTo(gx + r, gy); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(gx, gy - r); ctx.lineTo(gx, gy + r); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(gx - r*0.7, gy - r*0.7); ctx.lineTo(gx + r*0.7, gy + r*0.7); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(gx + r*0.7, gy - r*0.7); ctx.lineTo(gx - r*0.7, gy + r*0.7); ctx.stroke();
        });

        // Rock exposure patches — angular shapes
        ctx.fillStyle = 'rgba(100,120,140,0.18)';
        [[0.15,0.35],[0.40,0.28],[0.65,0.38],[0.85,0.30],[0.08,0.62],[0.35,0.70],[0.60,0.65],[0.80,0.72]]
        .forEach(([fx, fy]) => {
            const rx = w * fx, ry = h * fy;
            const rs = w * (0.025 + Math.abs(Math.sin(fx * 17)) * 0.020);
            ctx.beginPath();
            ctx.moveTo(rx - rs, ry - rs * 0.3); ctx.lineTo(rx - rs * 0.4, ry - rs * 0.8);
            ctx.lineTo(rx + rs * 0.6, ry - rs * 0.7); ctx.lineTo(rx + rs, ry + rs * 0.2);
            ctx.lineTo(rx + rs * 0.3, ry + rs * 0.7); ctx.lineTo(rx - rs * 0.7, ry + rs * 0.5);
            ctx.closePath(); ctx.fill();
        });

        // Frost crystal clusters — tiny radiating lines in ice-blue
        ctx.strokeStyle = 'rgba(200,230,255,0.40)'; ctx.lineWidth = 0.8;
        [[0.12,0.22],[0.30,0.18],[0.50,0.26],[0.68,0.20],[0.85,0.24],
         [0.08,0.46],[0.28,0.50],[0.48,0.44],[0.65,0.50],[0.82,0.46]]
        .forEach(([fx, fy]) => {
            const fcx = w * fx, fcy = h * fy;
            const flen = w * (0.012 + Math.abs(Math.sin(fx * 23 + fy * 13)) * 0.008);
            for (let ray = 0; ray < 6; ray++) {
                const ang = ray * Math.PI / 3 + Math.sin(fx * 7) * 0.3;
                ctx.beginPath(); ctx.moveTo(fcx, fcy);
                ctx.lineTo(fcx + Math.cos(ang) * flen, fcy + Math.sin(ang) * flen); ctx.stroke();
            }
        });

        // Foreground shadow
        const vgn = ctx.createLinearGradient(0, h * 0.74, 0, h);
        vgn.addColorStop(0, 'rgba(30,50,80,0)'); vgn.addColorStop(1, 'rgba(30,50,80,0.28)');
        ctx.fillStyle = vgn; ctx.fillRect(0, h * 0.74, w, h * 0.26);
    }

    // --- DESERT BACKDROP: full sand ground top-down, no sky ---
    _renderDesertBackdrop(ctx, w, h) {
        // Full sand surface — warm gold at top (far), deep amber-brown at bottom (near)
        const ground = ctx.createLinearGradient(0, 0, 0, h);
        ground.addColorStop(0,    '#d4aa44');
        ground.addColorStop(0.28, '#c89832');
        ground.addColorStop(0.62, '#b88020');
        ground.addColorStop(1,    '#9a6518');
        ctx.fillStyle = ground;
        ctx.fillRect(0, 0, w, h);

        // Desert scrub tufts — sparse dry grass blades
        ctx.lineWidth = 1;
        [[0.06,0.14,3],[0.18,0.22,2],[0.30,0.12,3],[0.42,0.20,2],[0.54,0.14,3],
         [0.66,0.22,2],[0.78,0.12,3],[0.90,0.20,2],
         [0.08,0.38,3],[0.20,0.46,2],[0.34,0.40,3],[0.48,0.46,2],[0.60,0.40,3],
         [0.72,0.46,2],[0.84,0.38,3],[0.94,0.44,2],
         [0.04,0.62,3],[0.16,0.58,2],[0.28,0.66,3],[0.42,0.60,2],[0.56,0.64,3],
         [0.70,0.58,2],[0.82,0.66,3],[0.94,0.60,2],
         [0.10,0.80,2],[0.24,0.76,3],[0.38,0.82,2],[0.52,0.78,3],[0.66,0.74,2],[0.80,0.82,3],[0.92,0.76,2]]
        .forEach(([fx, fy, n]) => {
            const gx = w * fx, gy = h * fy;
            const bLen = h * (0.014 + Math.abs(Math.sin(fx * 11 + fy * 7)) * 0.012);
            for (let k = 0; k < n; k++) {
                const bx = gx + (k - n * 0.5) * 4;
                const lean = (Math.sin(fx * 17 + k * 2.3) - 0.5) * 0.5;
                const tone = 80 + Math.floor(Math.abs(Math.sin(fy * 9 + k)) * 40);
                ctx.strokeStyle = `rgba(${tone + 40},${tone},15,0.48)`;
                ctx.beginPath();
                ctx.moveTo(bx, gy);
                ctx.quadraticCurveTo(bx + lean * bLen, gy - bLen * 0.5, bx + lean * bLen * 1.4, gy - bLen);
                ctx.stroke();
            }
        });

        // Sand grain texture — tiny dots in varying sand tones
        [[0.08,0.12],[0.15,0.20],[0.24,0.10],[0.32,0.28],[0.40,0.16],[0.48,0.24],
         [0.56,0.12],[0.64,0.22],[0.72,0.14],[0.80,0.26],[0.88,0.12],[0.94,0.20],
         [0.06,0.38],[0.14,0.44],[0.22,0.36],[0.30,0.50],[0.38,0.42],[0.46,0.48],
         [0.54,0.38],[0.62,0.44],[0.70,0.36],[0.78,0.50],[0.86,0.38],[0.96,0.46],
         [0.08,0.64],[0.18,0.70],[0.30,0.62],[0.42,0.68],[0.52,0.60],[0.62,0.70],
         [0.72,0.64],[0.82,0.68],[0.92,0.62]]
        .forEach(([fx, fy]) => {
            const px = w * fx, py = h * fy;
            const r = Math.abs(Math.sin(fx * 31 + fy * 19));
            ctx.fillStyle = r < 0.5 ? 'rgba(200,150,50,0.20)' : 'rgba(120,75,15,0.18)';
            const gs = w * (0.004 + r * 0.005);
            ctx.beginPath(); ctx.arc(px, py, gs, 0, Math.PI * 2); ctx.fill();
        });

        // Pebble/stone scatter as angular marks
        ctx.fillStyle = 'rgba(110,70,15,0.16)';
        [[0.08,0.22],[0.20,0.30],[0.36,0.18],[0.50,0.26],[0.65,0.20],[0.80,0.28],[0.94,0.15],
         [0.12,0.45],[0.28,0.52],[0.45,0.48],[0.62,0.55],[0.78,0.45],[0.92,0.52],
         [0.16,0.70],[0.34,0.65],[0.54,0.72],[0.72,0.68],[0.88,0.74]]
        .forEach(([fx, fy]) => {
            const px = w * fx, py = h * fy;
            const ps = w * (0.007 + Math.abs(Math.sin(fx * 19.3 + fy * 11.7)) * 0.012);
            ctx.beginPath();
            ctx.moveTo(px - ps, py); ctx.lineTo(px - ps * 0.4, py - ps * 0.9);
            ctx.lineTo(px + ps * 0.8, py - ps * 0.7); ctx.lineTo(px + ps, py + ps * 0.3);
            ctx.lineTo(px, py + ps * 0.8); ctx.closePath(); ctx.fill();
        });

        // Foreground shadow
        const vgn = ctx.createLinearGradient(0, h * 0.74, 0, h);
        vgn.addColorStop(0, 'rgba(60,30,0,0)'); vgn.addColorStop(1, 'rgba(60,30,0,0.38)');
        ctx.fillStyle = vgn; ctx.fillRect(0, h * 0.74, w, h * 0.26);
    }

    // --- SPACE / FROG KING BACKDROP: alien surface top-down, no sky ---
    _renderSpaceBackdrop(ctx, w, h) {
        // Full alien ground — slightly lit at top (distant), dark at bottom (near)
        const ground = ctx.createLinearGradient(0, 0, 0, h);
        ground.addColorStop(0,    '#1a0840');
        ground.addColorStop(0.30, '#140630');
        ground.addColorStop(0.65, '#100422');
        ground.addColorStop(1,    '#080118');
        ctx.fillStyle = ground;
        ctx.fillRect(0, 0, w, h);

        // Alien bioluminescent tufts — short crystalline spike clusters
        ctx.lineWidth = 1;
        [[0.06,0.10,4],[0.16,0.18,3],[0.28,0.10,4],[0.40,0.16,3],[0.52,0.08,4],
         [0.64,0.18,3],[0.76,0.10,4],[0.88,0.18,3],[0.96,0.10,4],
         [0.04,0.34,3],[0.18,0.42,4],[0.30,0.36,3],[0.44,0.40,4],[0.56,0.34,3],
         [0.68,0.42,4],[0.80,0.36,3],[0.90,0.40,4],
         [0.06,0.60,4],[0.18,0.56,3],[0.30,0.64,4],[0.44,0.58,3],[0.56,0.62,4],
         [0.68,0.56,3],[0.80,0.64,4],[0.92,0.58,3],
         [0.10,0.80,3],[0.24,0.76,4],[0.38,0.82,3],[0.52,0.78,4],[0.66,0.74,3],[0.80,0.80,4],[0.94,0.76,3]]
        .forEach(([fx, fy, n]) => {
            const gx = w * fx, gy = h * fy;
            const bLen = h * (0.010 + Math.abs(Math.sin(fx * 11 + fy * 7)) * 0.009);
            for (let k = 0; k < n; k++) {
                const bx = gx + (k - n * 0.5) * 2;
                const lean = (Math.sin(fx * 17 + k * 2.3) - 0.5) * 0.25;
                const c = Math.abs(Math.sin(fx * 13 + k * 3.1));
                ctx.strokeStyle = c < 0.5 ? 'rgba(180,60,255,0.55)' : 'rgba(60,220,200,0.55)';
                ctx.beginPath();
                ctx.moveTo(bx, gy);
                ctx.lineTo(bx + lean * bLen * 1.4, gy - bLen);
                ctx.stroke();
            }
        });

        // Hexagonal alien ground tile pattern — subtle geometric surface
        ctx.strokeStyle = 'rgba(80,20,140,0.13)'; ctx.lineWidth = 0.8;
        const hexR = w * 0.032;
        const hexSqrt3 = hexR * Math.sqrt(3);
        for (let col = 0; col < Math.ceil(w / (hexR * 1.5)) + 2; col++) {
            for (let row = 0; row < Math.ceil(h / hexSqrt3) + 2; row++) {
                const hx = col * hexR * 1.5 - hexR;
                const hy = row * hexSqrt3 + (col % 2 === 0 ? 0 : hexSqrt3 * 0.5) - hexSqrt3;
                ctx.beginPath();
                for (let vi = 0; vi < 6; vi++) {
                    const ang = vi * Math.PI / 3;
                    const px = hx + hexR * Math.cos(ang), py = hy + hexR * Math.sin(ang);
                    vi === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
                }
                ctx.closePath(); ctx.stroke();
            }
        }

        // Bioluminescent surface dots
        ctx.fillStyle = 'rgba(140,60,255,0.28)';
        [[0.06,0.08],[0.18,0.14],[0.30,0.06],[0.42,0.16],[0.56,0.08],[0.68,0.18],[0.80,0.10],[0.92,0.14],
         [0.10,0.36],[0.24,0.44],[0.40,0.38],[0.54,0.46],[0.70,0.38],[0.86,0.42],
         [0.04,0.62],[0.20,0.68],[0.36,0.60],[0.52,0.66],[0.68,0.62],[0.84,0.66],[0.96,0.58]]
        .forEach(([fx, fy]) => {
            const dotR = w * (0.003 + Math.abs(Math.sin(fx * 29 + fy * 17)) * 0.004);
            ctx.beginPath(); ctx.arc(w * fx, h * fy, dotR, 0, Math.PI * 2); ctx.fill();
        });

        // Foreground vignette
        const vgn = ctx.createLinearGradient(0, h * 0.74, 0, h);
        vgn.addColorStop(0, 'rgba(0,0,0,0)'); vgn.addColorStop(1, 'rgba(0,0,0,0.48)');
        ctx.fillStyle = vgn; ctx.fillRect(0, h * 0.74, w, h * 0.26);
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
            space:    '#4a3868'
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
        this.renderTerrainElementsByType(ctx, ['vegetation', 'tree', 'cactus', 'drybush']);
        
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

        const campaign = this.getCampaign();
        this.terrainElements.forEach(element => {
            // Only render elements that match the type filters
            if (!typeFilters.includes(element.type)) {
                return;
            }

            const screenX = element.gridX * this.cellSize;
            const screenY = element.gridY * this.cellSize;
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
                    } else {
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
        // Tall pine with heavy snow
        const trunkWidth = size * 0.2;
        const trunkHeight = size * 0.45;

        // Trunk
        ctx.fillStyle = '#654321';
        ctx.fillRect(x - trunkWidth * 0.5, y, trunkWidth, trunkHeight);

        // Tree shape - dark green cone
        ctx.fillStyle = '#1a4d2e';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.65);
        ctx.lineTo(x + size * 0.4, y - size * 0.05);
        ctx.lineTo(x - size * 0.4, y - size * 0.05);
        ctx.closePath();
        ctx.fill();

        // Mid-layer
        ctx.fillStyle = '#2d5a3d';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.35);
        ctx.lineTo(x + size * 0.35, y + size * 0.15);
        ctx.lineTo(x - size * 0.35, y + size * 0.15);
        ctx.closePath();
        ctx.fill();

        // Snow cap
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.62);
        ctx.lineTo(x + size * 0.12, y - size * 0.4);
        ctx.lineTo(x - size * 0.12, y - size * 0.4);
        ctx.closePath();
        ctx.fill();

        // Snow on middle branches
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.15, y - size * 0.2);
        ctx.lineTo(x + size * 0.28, y);
        ctx.lineTo(x + size * 0.08, y);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(x - size * 0.15, y - size * 0.2);
        ctx.lineTo(x - size * 0.28, y);
        ctx.lineTo(x - size * 0.08, y);
        ctx.closePath();
        ctx.fill();
    }

    renderMountainPineType2(ctx, x, y, size) {
        // Medium pine with layered tiers and flat snow on branch tips
        const trunkW = size * 0.14;
        // Trunk
        ctx.fillStyle = '#704020';
        ctx.fillRect(x - trunkW * 0.5, y, trunkW, size * 0.38);
        // Three branch tiers (bottom to top)
        const tiers = [
            { cy: y - size*0.10, w: size*0.38, h: size*0.22 },
            { cy: y - size*0.30, w: size*0.28, h: size*0.20 },
            { cy: y - size*0.50, w: size*0.18, h: size*0.18 }
        ];
        tiers.forEach(t => {
            ctx.fillStyle = '#2d5a3d';
            ctx.beginPath();
            ctx.moveTo(x, t.cy - t.h);
            ctx.lineTo(x + t.w, t.cy + t.h * 0.1);
            ctx.lineTo(x - t.w, t.cy + t.h * 0.1);
            ctx.closePath(); ctx.fill();
            // Shadow side
            ctx.fillStyle = '#1a3d28';
            ctx.beginPath();
            ctx.moveTo(x, t.cy - t.h);
            ctx.lineTo(x, t.cy + t.h * 0.1);
            ctx.lineTo(x - t.w, t.cy + t.h * 0.1);
            ctx.closePath(); ctx.fill();
        });
        // Flat snow cap on top tier
        ctx.fillStyle = 'rgba(238,248,255,0.90)';
        ctx.beginPath(); ctx.ellipse(x, tiers[2].cy - tiers[2].h*0.7, tiers[2].w*0.55, tiers[2].h*0.28, 0, 0, Math.PI*2); ctx.fill();
        // Flat snow on lower branch tips
        ctx.fillStyle = 'rgba(235,246,255,0.72)';
        [[-tiers[0].w*0.78, tiers[0].cy+tiers[0].h*0.06, tiers[0].w*0.22, tiers[0].h*0.12],
         [tiers[0].w*0.68, tiers[0].cy+tiers[0].h*0.06, tiers[0].w*0.22, tiers[0].h*0.12],
         [-tiers[1].w*0.70, tiers[1].cy+tiers[1].h*0.06, tiers[1].w*0.20, tiers[1].h*0.11],
         [tiers[1].w*0.60, tiers[1].cy+tiers[1].h*0.06, tiers[1].w*0.20, tiers[1].h*0.11]]
        .forEach(([ox,oy,rw,rh]) => { ctx.beginPath(); ctx.ellipse(x+ox, oy, rw, rh, 0, 0, Math.PI*2); ctx.fill(); });
    }

    renderMountainPineType3(ctx, x, y, size) {
        // Small shrubby pine
        const trunkWidth = size * 0.15;
        const trunkHeight = size * 0.35;

        // Trunk
        ctx.fillStyle = '#8b5a3c';
        ctx.fillRect(x - trunkWidth * 0.5, y, trunkWidth, trunkHeight);

        // Bushy tree shape
        ctx.fillStyle = '#3d6d4d';
        ctx.beginPath();
        ctx.ellipse(x, y - size * 0.2, size * 0.3, size * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Dark shadow side
        ctx.fillStyle = '#1a3d28';
        ctx.beginPath();
        ctx.ellipse(x + size * 0.1, y - size * 0.2, size * 0.2, size * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();

        // Snow patches
        ctx.fillStyle = '#e8e8e8';
        ctx.beginPath();
        ctx.arc(x - size * 0.15, y - size * 0.35, size * 0.1, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x + size * 0.2, y - size * 0.15, size * 0.08, 0, Math.PI * 2);
        ctx.fill();
    }

    renderMountainPineType4(ctx, x, y, size) {
        // Thick, sturdy pine with minimal snow - new variation
        const trunkWidth = size * 0.24;
        const trunkHeight = size * 0.48;

        // Trunk with deep shading
        ctx.fillStyle = '#6b4423';
        ctx.fillRect(x - trunkWidth * 0.5, y, trunkWidth, trunkHeight);
        ctx.fillStyle = '#3a2418';
        ctx.fillRect(x - trunkWidth * 0.15, y, trunkWidth * 0.15, trunkHeight);

        // Dark green base
        ctx.fillStyle = '#0d3817';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.7);
        ctx.lineTo(x + size * 0.42, y - size * 0.08);
        ctx.lineTo(x - size * 0.42, y - size * 0.08);
        ctx.closePath();
        ctx.fill();

        // Mid section
        ctx.fillStyle = '#1a5a2a';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.38);
        ctx.lineTo(x + size * 0.38, y + size * 0.1);
        ctx.lineTo(x - size * 0.38, y + size * 0.1);
        ctx.closePath();
        ctx.fill();

        // Darker shading on right
        ctx.fillStyle = '#0d3817';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.38);
        ctx.lineTo(x + size * 0.38, y + size * 0.1);
        ctx.lineTo(x + size * 0.1, y + size * 0.1);
        ctx.closePath();
        ctx.fill();

        // Small snow cap on top
        ctx.fillStyle = '#f5f5f5';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.68, size * 0.1, 0, Math.PI * 2);
        ctx.fill();

        // Slight snow accent on upper branches
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(x + size * 0.28, y - size * 0.2, size * 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x - size * 0.28, y - size * 0.2, size * 0.08, 0, Math.PI * 2);
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
        // Rounded grey boulder with snow dusting on top
        ctx.fillStyle = '#6a7880';
        ctx.beginPath(); ctx.ellipse(x, y, size*0.32, size*0.26, 0.2, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'rgba(40,50,60,0.50)';
        ctx.beginPath(); ctx.ellipse(x+size*0.10, y+size*0.10, size*0.28, size*0.22, 0.2, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'rgba(190,205,220,0.55)';
        ctx.beginPath(); ctx.ellipse(x-size*0.10, y-size*0.10, size*0.16, size*0.12, 0.2, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'rgba(240,248,255,0.82)';
        ctx.beginPath(); ctx.ellipse(x-size*0.04, y-size*0.13, size*0.20, size*0.09, -0.1, 0, Math.PI*2); ctx.fill();
    }

    renderMountainRock1(ctx, x, y, size) {
        // Flat angular slab with snow on top edge
        const hw = size*0.34, hh = size*0.20;
        ctx.fillStyle = '#586470';
        ctx.beginPath();
        ctx.moveTo(x-hw, y+hh*0.5);
        ctx.lineTo(x-hw*0.7, y-hh);
        ctx.lineTo(x+hw*0.7, y-hh*0.8);
        ctx.lineTo(x+hw, y+hh*0.5);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#3a4550';
        ctx.beginPath();
        ctx.moveTo(x+hw*0.7, y-hh*0.8); ctx.lineTo(x+hw, y+hh*0.5);
        ctx.lineTo(x+hw*0.5, y+hh*0.5); ctx.lineTo(x+hw*0.4, y-hh*0.6);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(235,248,255,0.90)';
        ctx.beginPath();
        ctx.moveTo(x-hw*0.8, y-hh*0.85); ctx.lineTo(x-hw*0.7, y-hh);
        ctx.lineTo(x+hw*0.7, y-hh*0.8); ctx.lineTo(x+hw*0.6, y-hh*0.58);
        ctx.closePath(); ctx.fill();
    }

    renderMountainRock2(ctx, x, y, size) {
        // Two overlapping boulders
        const drawBoulder = (ox, oy, sw, sh, ang) => {
            ctx.fillStyle = '#708090';
            ctx.beginPath(); ctx.ellipse(x+ox, y+oy, sw, sh, ang, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = 'rgba(40,50,60,0.45)';
            ctx.beginPath(); ctx.ellipse(x+ox+sw*0.28, y+oy+sh*0.28, sw*0.75, sh*0.75, ang, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = 'rgba(195,210,228,0.50)';
            ctx.beginPath(); ctx.ellipse(x+ox-sw*0.22, y+oy-sh*0.22, sw*0.40, sh*0.38, ang, 0, Math.PI*2); ctx.fill();
        };
        drawBoulder(-size*0.14, size*0.05, size*0.22, size*0.18, -0.3);
        drawBoulder(size*0.14, -size*0.04, size*0.18, size*0.15, 0.4);
        ctx.fillStyle = 'rgba(240,248,255,0.75)';
        ctx.beginPath(); ctx.ellipse(x-size*0.14, y-size*0.10, size*0.15, size*0.07, -0.2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x+size*0.14, y-size*0.14, size*0.12, size*0.06, 0.3, 0, Math.PI*2); ctx.fill();
    }

    renderMountainRock3(ctx, x, y, size) {
        // Cluster of small stones with snow patches
        [[-0.16,0.08,0.17,0.12,-0.2],[0.13,-0.06,0.15,0.10,0.3],[0.0,0.15,0.12,0.09,0.1],[-0.06,-0.12,0.11,0.08,-0.1]]
        .forEach(([ox,oy,sw,sh,ang]) => {
            ctx.fillStyle = '#6a7880';
            ctx.beginPath(); ctx.ellipse(x+ox*size, y+oy*size, sw*size, sh*size, ang, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = 'rgba(40,52,62,0.40)';
            ctx.beginPath(); ctx.ellipse(x+ox*size+sw*size*0.25, y+oy*size+sh*size*0.25, sw*size*0.65, sh*size*0.65, ang, 0, Math.PI*2); ctx.fill();
        });
        ctx.fillStyle = 'rgba(240,248,255,0.80)';
        [[-0.16,-0.04,0.08,0.04],[0.13,-0.12,0.07,0.03],[0.0,0.06,0.08,0.035]]
        .forEach(([ox,oy,sw,sh]) => { ctx.beginPath(); ctx.ellipse(x+ox*size, y+oy*size, sw*size, sh*size, 0, 0, Math.PI*2); ctx.fill(); });
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
        
        // Darker overlay for form and depth — clipped to rock boundary
        ctx.save();
        ctx.beginPath(); ctx.arc(x, y, size * 0.38, 0, Math.PI * 2); ctx.clip();
        ctx.fillStyle = '#414141';
        ctx.beginPath();
        ctx.arc(x + size * 0.12, y + size * 0.12, size * 0.34, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
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
        // Jagged rocky formation with proper polygonal structure
        
        // Shadow base
        ctx.fillStyle = 'rgba(30, 25, 20, 0.4)';
        ctx.beginPath();
        ctx.ellipse(x + size * 0.05, y + size * 0.22, size * 0.38, size * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Main rock body - irregular polygon
        ctx.fillStyle = '#5a5a5a';
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
        
        // Weathering stains and moss
        ctx.fillStyle = 'rgba(85, 105, 65, 0.25)';
        for (let i = 0; i < 8; i++) {
            const offsetX = (Math.sin(i * 1.2 + x * 0.01) - 0.5) * size * 0.3;
            const offsetY = (Math.cos(i * 1.2 + y * 0.01) - 0.5) * size * 0.25;
            const spotSize = size * (0.07 + Math.abs(Math.sin(i * 0.6)) * 0.04);
            ctx.beginPath();
            ctx.arc(x + offsetX, y + offsetY, spotSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Cracks and surface texture
        ctx.strokeStyle = 'rgba(40, 40, 40, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x - size * 0.15, y - size * 0.15);
        ctx.lineTo(x + size * 0.1, y + size * 0.1);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.25);
        ctx.lineTo(x - size * 0.1, y + size * 0.15);
        ctx.stroke();
        
        // Surface edge definition
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - size * 0.25, y + size * 0.2);
        ctx.lineTo(x - size * 0.35, y - size * 0.1);
        ctx.lineTo(x - size * 0.2, y - size * 0.32);
        ctx.lineTo(x + size * 0.05, y - size * 0.35);
        ctx.lineTo(x + size * 0.3, y - size * 0.15);
        ctx.lineTo(x + size * 0.32, y + size * 0.15);
        ctx.stroke();
        
        // Lichen patches
        ctx.fillStyle = 'rgba(120, 140, 100, 0.2)';
        for (let i = 0; i < 3; i++) {
            const px = x - size * 0.2 + Math.sin(i * 2.3) * size * 0.25;
            const py = y - size * 0.1 + Math.cos(i * 2.3) * size * 0.15;
            ctx.beginPath();
            ctx.arc(px, py, size * 0.08, 0, Math.PI * 2);
            ctx.fill();
        }
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

