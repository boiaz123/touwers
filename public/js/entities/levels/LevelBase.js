import * as TerrainRenderer from '../../core/render/TerrainRenderer.js';

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
        // Set by BackgroundRenderAdapter once it has baked backgroundCanvas/terrainCanvas
        // into Pixi sprites, so the Canvas2D blit of the same pixels can be skipped.
        this.skipCanvas2DBackgroundBlit = false;
        
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
            const type = element.type;

            if (typeof gridX !== 'number' || typeof gridY !== 'number') {
                console.warn(`[${this.constructor.name}] Terrain element ${idx} missing gridX/gridY:`, element);
                return;
            }

            // Trees, rocks, and vegetation always occupy exactly 1 grid cell regardless of visual size
            if (type === 'tree' || type === 'vegetation' || type === 'rock' ||
                type === 'cactus' || type === 'drybush') {
                const x = Math.floor(gridX);
                const y = Math.floor(gridY);
                if (this.isValidGridPosition(x, y)) {
                    this.occupiedCells.add(`${x},${y}`);
                }
                return;
            }

            // For water and other types, use size-based radius
            const size = element.size || 1.0;
            const radius = size * 0.71;
            let cellsMarked = 0;

            for (let x = gridX - Math.ceil(radius); x <= gridX + Math.ceil(radius); x++) {
                for (let y = gridY - Math.ceil(radius); y <= gridY + Math.ceil(radius); y++) {
                    if (!this.isValidGridPosition(x, y)) continue;
                    const cellCenterX = x + 0.5;
                    const cellCenterY = y + 0.5;
                    const distance = Math.hypot(cellCenterX - gridX, cellCenterY - gridY);
                    if (distance <= radius) {
                        this.occupiedCells.add(`${x},${y}`);
                        cellsMarked++;
                    }
                }
            }

            if (cellsMarked === 0) {
                console.warn(`[${this.constructor.name}] Element ${idx} (${type} at ${gridX},${gridY}, size=${size}) marked 0 cells! (radius=${radius})`);
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
    
    screenToGrid(screenX, screenY, size = 2) {
        // Use ResolutionManager if available, otherwise use cellSize
        if (this.resolutionManager) {
            return this.resolutionManager.screenToGrid(screenX, screenY, size);
        }
        const gridX = Math.round(screenX / this.cellSize - size / 2);
        const gridY = Math.round(screenY / this.cellSize - size / 2);
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
            // alpha:false is safe here - the backdrop always fillRects the entire
            // canvas before anything else, unlike terrainCanvas below which only
            // draws water/river/path over a transparent rest that must show this
            // background through.
            const bgCtx = this.backgroundCanvas.getContext('2d', { alpha: false });
            this._renderBackgroundToCanvas(bgCtx);
        }

        // When the Pixi renderer is active, BackgroundRenderAdapter blits this same
        // cached canvas as a GPU-composited sprite instead - skip the redundant CPU blit.
        if (this.skipCanvas2DBackgroundBlit) return;

        // Just blit the pre-rendered background
        ctx.drawImage(this.backgroundCanvas, 0, 0);
    }

    renderTerrainLayer(ctx) {
        // PRE-RENDER OPTIMIZATION: Cache static terrain (water, rivers, path) to offscreen canvas.
        // Vegetation and rocks are rendered per-frame by GameplayState in entity-sorted order
        // for correct depth ordering with towers and buildings.
        if (!this.terrainCanvas) {
            this.terrainCanvas = document.createElement('canvas');
            this.terrainCanvas.width = ctx.canvas.width;
            this.terrainCanvas.height = ctx.canvas.height;
            const tCtx = this.terrainCanvas.getContext('2d');
            tCtx.resolutionManager = ctx.resolutionManager;

            // Background: water, rivers, and path only
            this.renderTerrainElementsByType(tCtx, ['water']);
            this.renderRiverSmooth(tCtx);
            this.renderPath(tCtx);
        }

        // See renderGrassBackground() above - same Pixi hand-off reasoning.
        if (this.skipCanvas2DBackgroundBlit) return;

        // Single drawImage call for all static background terrain
        ctx.drawImage(this.terrainCanvas, 0, 0);
    }

    renderForegroundTerrain(ctx) {
        // No-op: vegetation and rocks are rendered by GameplayState in entity-sorted order
    }

    /**
     * The screen-space Y used to depth-sort a terrain element against towers/enemies/other
     * terrain (Y-sort "ground contact point"). Must mirror the y-shift renderSingleTerrainElement
     * applies before actually drawing each type, otherwise the sort key and the pixels it's
     * supposed to describe disagree: 'tree' (and non-mountain 'vegetation') are drawn shifted
     * up by size*0.45 so the canopy has room to grow from its trunk, while 'rock'/'cactus'/
     * 'drybush'/mountain-vegetation are drawn anchored exactly at their grid row. Using the raw,
     * unshifted gridY for every type (as this used to) makes a tree's sort key sit up to
     * size*0.45px below its actual painted base - on mountain levels (sizeScale 1.5, the
     * largest of any campaign) that's often more than a full grid row, letting a rock declared
     * later in the level file win same-row zIndex ties and draw in front of a tree it should
     * be behind.
     */
    getTerrainElementDepthY(element) {
        const campaign = this.getCampaign();
        const screenY = element.gridY * this.cellSize;
        if (element.type === 'water') return screenY;
        const baseSize = element.size * this.cellSize;
        const sizeScale = (campaign !== 'forest' && campaign !== 'desert') ? 1.5 : 0.75;
        const size = baseSize * sizeScale;

        if (element.type === 'tree' || (element.type === 'vegetation' && campaign !== 'mountain')) {
            return screenY - size * 0.45;
        }
        if (element.type === 'rock' || element.type === 'cactus' || element.type === 'drybush') {
            // Ground-hugging clutter that never gets the upward shift above (including mountain
            // vegetation, whose canopy - unlike every other campaign's - anchors flush with its
            // own gridY too, see the mountain branch above). A rock and a tree can therefore land
            // on the *exact* same sort key despite one visually towering over the other; that tie
            // used to resolve by array insertion order, so whichever was declared later in the
            // level file always won - typically the rock, since level files list rocks after
            // vegetation. A sub-pixel nudge makes rock/cactus/drybush always lose ties against
            // foliage at the same row instead, without perturbing any real (non-tied) ordering.
            return screenY - 0.5;
        }
        return screenY;
    }

    /**
     * terrainElements sorted by depth-Y for correct painter's-algorithm draw order.
     * Only used by the brief Canvas2D fallback render path (before Pixi's async init
     * finishes and zIndex-based sorting takes over) - cached since terrainElements never
     * changes after level load (see TerrainRenderAdapter.js's class doc comment).
     */
    getTerrainElementsSortedByDepth() {
        if (!this._depthSortedTerrainElements || this._depthSortedTerrainElements.length !== this.terrainElements.length) {
            this._depthSortedTerrainElements = [...this.terrainElements].sort(
                (a, b) => this.getTerrainElementDepthY(a) - this.getTerrainElementDepthY(b)
            );
        }
        return this._depthSortedTerrainElements;
    }

    renderSingleTerrainElement(ctx, element) {
        const campaign = this.getCampaign();
        const screenX = element.gridX * this.cellSize;
        const screenY = element.gridY * this.cellSize;
        const baseSize = element.size * this.cellSize;
        const sizeScale = (element.type !== 'water' && campaign !== 'forest' && campaign !== 'desert') ? 1.5 : 0.75;
        const size = element.type === 'water' ? baseSize : baseSize * sizeScale;

        switch (element.type) {
            case 'vegetation': {
                // Mountain: anchor at screenY so trunk/shadow embed below the ground anchor (matching campaign map)
                const vegY = campaign === 'mountain' ? screenY : screenY - size * 0.45;
                this.renderVegetation(ctx, screenX, vegY, size, element.gridX, element.gridY, element.variant);
                break;
            }
            case 'tree':
                this.renderTree(ctx, screenX, screenY - size * 0.45, size, element.gridX, element.gridY, element.variant);
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
                const fitsOnGrid = isBuilding ?
                    this.canPlaceBuilding(this.previewGridX, this.previewGridY, this.previewSize, this.previewTowerManager) :
                    this.canPlaceTower(this.previewGridX, this.previewGridY, this.previewTowerManager);
                const canAfford = this.previewCanAffordFn ? this.previewCanAffordFn() : true;
                const canPlace = fitsOnGrid && canAfford;

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
                    // getEffectiveTowerRange() returns a base-resolution (1920x1080) stat;
                    // scale it to the current resolution's pixel space so the placement
                    // preview circle matches the range circle the tower will render once
                    // placed (see Tower.js effectiveRange comment).
                    const scaleFactor = this.resolutionManager ? this.resolutionManager.scaleFactor : 1;
                    const towerRange = this.getEffectiveTowerRange(this.previewTowerType, this.previewTowerManager) * scaleFactor;
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
    
    setPlacementPreview(screenX, screenY, show = true, towerManager = null, size = 2, towerType = null, canAffordFn = null) {
        this.showPlacementPreview = show;
        this.previewTowerManager = towerManager;
        this.previewSize = size;
        this.previewTowerType = towerType;
        this.previewCanAffordFn = canAffordFn;
        if (show) {
            if (towerType === 'guard-post') {
                // For guard posts, store raw screen coordinates
                this.previewScreenX = screenX;
                this.previewScreenY = screenY;
            } else {
                // For regular towers/buildings, use grid coordinates, centered on
                // the cursor for this footprint's size (see screenToGrid)
                const { gridX, gridY } = this.screenToGrid(screenX, screenY, size);
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
        const canAfford = this.previewCanAffordFn ? this.previewCanAffordFn() : true;
        const canPlace = isOnPath && canAfford;

        // Render the placement preview circle
        const radius = 25;
        ctx.fillStyle = canPlace ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Add border
        ctx.strokeStyle = canPlace ? 'rgba(0, 255, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)';
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
            const sizeScale = (element.type !== 'water' && campaign !== 'forest' && campaign !== 'desert') ? 1.5 : 0.75;
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

    // --- TerrainRenderer delegation: thin wrappers preserving the full original
    // method surface (LevelBase.js used to implement all of these directly; the
    // implementations now live in TerrainRenderer.js and are shared with the level
    // designer's preview canvas). Kept even where nothing in this file calls them
    // anymore, because other classes (Campaign1-3, FrogKingsRealmLevel, building/
    // tower decoration code via ctx.level.*) call these by name on a LevelBase
    // instance directly.
    renderVegetation(ctx, x, y, size, gridX, gridY, variant) {
        return TerrainRenderer.renderVegetation(ctx, x, y, size, gridX, gridY, variant, this.getCampaign());
    }

    renderDesertVegetation(ctx, x, y, size, gridX, gridY, variant) {
        return TerrainRenderer.renderDesertVegetation(ctx, x, y, size, gridX, gridY, variant);
    }

    renderCactusSaguaro(ctx, x, y, size) {
        return TerrainRenderer.renderCactusSaguaro(ctx, x, y, size);
    }

    renderDryDesertShrub(ctx, x, y, size) {
        return TerrainRenderer.renderDryDesertShrub(ctx, x, y, size);
    }

    renderCactusPricklyPear(ctx, x, y, size) {
        return TerrainRenderer.renderCactusPricklyPear(ctx, x, y, size);
    }

    renderDesertTree(ctx, x, y, size) {
        return TerrainRenderer.renderDesertTree(ctx, x, y, size);
    }

    renderCactusCholla(ctx, x, y, size) {
        return TerrainRenderer.renderCactusCholla(ctx, x, y, size);
    }

    renderDesertBush(ctx, x, y, size) {
        return TerrainRenderer.renderDesertBush(ctx, x, y, size);
    }

    renderMountainVegetation(ctx, x, y, size, gridX, gridY, variant) {
        return TerrainRenderer.renderMountainVegetation(ctx, x, y, size, gridX, gridY, variant);
    }

    renderSpaceVegetation(ctx, x, y, size, gridX, gridY, variant) {
        return TerrainRenderer.renderSpaceVegetation(ctx, x, y, size, gridX, gridY, variant);
    }

    renderSpaceVortexPlant(ctx, x, y, size) {
        return TerrainRenderer.renderSpaceVortexPlant(ctx, x, y, size);
    }

    renderSpaceSpikeCoral(ctx, x, y, size) {
        return TerrainRenderer.renderSpaceSpikeCoral(ctx, x, y, size);
    }

    renderSpaceFractalGrowth(ctx, x, y, size) {
        return TerrainRenderer.renderSpaceFractalGrowth(ctx, x, y, size);
    }

    renderSpaceBiolumPlant(ctx, x, y, size) {
        return TerrainRenderer.renderSpaceBiolumPlant(ctx, x, y, size);
    }

    renderSpaceAlienMushroom(ctx, x, y, size) {
        return TerrainRenderer.renderSpaceAlienMushroom(ctx, x, y, size);
    }

    renderSpaceCrystalOrganism(ctx, x, y, size) {
        return TerrainRenderer.renderSpaceCrystalOrganism(ctx, x, y, size);
    }

    renderMountainPineType1(ctx, x, y, size) {
        return TerrainRenderer.renderMountainPineType1(ctx, x, y, size);
    }

    renderMountainPineType2(ctx, x, y, size) {
        return TerrainRenderer.renderMountainPineType2(ctx, x, y, size);
    }

    renderMountainPineType3(ctx, x, y, size) {
        return TerrainRenderer.renderMountainPineType3(ctx, x, y, size);
    }

    renderMountainPineType4(ctx, x, y, size) {
        return TerrainRenderer.renderMountainPineType4(ctx, x, y, size);
    }

    renderSpaceCrystalType1(ctx, x, y, size) {
        return TerrainRenderer.renderSpaceCrystalType1(ctx, x, y, size);
    }

    renderSpaceCrystalType2(ctx, x, y, size) {
        return TerrainRenderer.renderSpaceCrystalType2(ctx, x, y, size);
    }

    renderAlienPlant(ctx, x, y, size) {
        return TerrainRenderer.renderAlienPlant(ctx, x, y, size);
    }

    renderTree(ctx, x, y, size, gridX, gridY, variant) {
        return TerrainRenderer.renderTree(ctx, x, y, size, gridX, gridY, variant);
    }

    renderTreeType1(ctx, x, y, size) {
        return TerrainRenderer.renderTreeType1(ctx, x, y, size);
    }

    renderTreeType2(ctx, x, y, size) {
        return TerrainRenderer.renderTreeType2(ctx, x, y, size);
    }

    renderTreeType3(ctx, x, y, size) {
        return TerrainRenderer.renderTreeType3(ctx, x, y, size);
    }

    renderTreeType4(ctx, x, y, size) {
        return TerrainRenderer.renderTreeType4(ctx, x, y, size);
    }

    renderTreeType5(ctx, x, y, size) {
        return TerrainRenderer.renderTreeType5(ctx, x, y, size);
    }

    renderTreeType6(ctx, x, y, size) {
        return TerrainRenderer.renderTreeType6(ctx, x, y, size);
    }

    renderRock(ctx, x, y, size, gridX, gridY, variant) {
        return TerrainRenderer.renderRock(ctx, x, y, size, gridX, gridY, variant, this.getCampaign());
    }

    renderMountainRock(ctx, x, y, size, gridX, gridY, variant) {
        return TerrainRenderer.renderMountainRock(ctx, x, y, size, gridX, gridY, variant);
    }

    renderMountainRock0(ctx, x, y, size) {
        return TerrainRenderer.renderMountainRock0(ctx, x, y, size);
    }

    renderMountainRock1(ctx, x, y, size) {
        return TerrainRenderer.renderMountainRock1(ctx, x, y, size);
    }

    renderMountainRock2(ctx, x, y, size) {
        return TerrainRenderer.renderMountainRock2(ctx, x, y, size);
    }

    renderMountainRock3(ctx, x, y, size) {
        return TerrainRenderer.renderMountainRock3(ctx, x, y, size);
    }

    renderDesertRock(ctx, x, y, size, gridX, gridY, variant) {
        return TerrainRenderer.renderDesertRock(ctx, x, y, size, gridX, gridY, variant);
    }

    renderDesertRock0(ctx, x, y, size) {
        return TerrainRenderer.renderDesertRock0(ctx, x, y, size);
    }

    renderDesertRock1(ctx, x, y, size) {
        return TerrainRenderer.renderDesertRock1(ctx, x, y, size);
    }

    renderDesertRock2(ctx, x, y, size) {
        return TerrainRenderer.renderDesertRock2(ctx, x, y, size);
    }

    renderDesertRock3(ctx, x, y, size) {
        return TerrainRenderer.renderDesertRock3(ctx, x, y, size);
    }

    renderSpaceRock(ctx, x, y, size, gridX, gridY, variant) {
        return TerrainRenderer.renderSpaceRock(ctx, x, y, size, gridX, gridY, variant);
    }

    renderSpaceRockFractal(ctx, x, y, size) {
        return TerrainRenderer.renderSpaceRockFractal(ctx, x, y, size);
    }

    renderSpaceRockSpiky(ctx, x, y, size) {
        return TerrainRenderer.renderSpaceRockSpiky(ctx, x, y, size);
    }

    renderSpaceRockCrystalline(ctx, x, y, size) {
        return TerrainRenderer.renderSpaceRockCrystalline(ctx, x, y, size);
    }

    renderSpaceRockVoid(ctx, x, y, size) {
        return TerrainRenderer.renderSpaceRockVoid(ctx, x, y, size);
    }

    renderSpaceRockNonEuclidean(ctx, x, y, size) {
        return TerrainRenderer.renderSpaceRockNonEuclidean(ctx, x, y, size);
    }

    renderForestRock(ctx, x, y, size, gridX, gridY, variant) {
        return TerrainRenderer.renderForestRock(ctx, x, y, size, gridX, gridY, variant);
    }

    renderForestRock0(ctx, x, y, size) {
        return TerrainRenderer.renderForestRock0(ctx, x, y, size);
    }

    renderForestRock1(ctx, x, y, size) {
        return TerrainRenderer.renderForestRock1(ctx, x, y, size);
    }

    renderForestRock2(ctx, x, y, size) {
        return TerrainRenderer.renderForestRock2(ctx, x, y, size);
    }

    renderForestRock3(ctx, x, y, size) {
        return TerrainRenderer.renderForestRock3(ctx, x, y, size);
    }

    renderRockType1(ctx, x, y, size) {
        return TerrainRenderer.renderRockType1(ctx, x, y, size);
    }

    renderRockType2(ctx, x, y, size) {
        return TerrainRenderer.renderRockType2(ctx, x, y, size);
    }

    renderRockType3(ctx, x, y, size) {
        return TerrainRenderer.renderRockType3(ctx, x, y, size);
    }

    renderRockType4(ctx, x, y, size) {
        return TerrainRenderer.renderRockType4(ctx, x, y, size);
    }

    renderLakeCells(ctx) {
        return TerrainRenderer.renderLakeCells(ctx, this.terrainElements, this.cellSize);
    }

    renderLake(ctx, x, y, size) {
        return TerrainRenderer.renderLake(ctx, x, y, size);
    }

    renderRiver(ctx, x, y, size, flowAngle) {
        return TerrainRenderer.renderRiver(ctx, x, y, size, flowAngle);
    }

    renderRiverSmooth(ctx) {
        return TerrainRenderer.renderRiverSmooth(ctx, this.terrainElements, this.cellSize);
    }

    renderCactus(ctx, x, y, size, gridX, gridY) {
        return TerrainRenderer.renderCactus(ctx, x, y, size, gridX, gridY);
    }

    renderCactusType1(ctx, x, y, size) {
        return TerrainRenderer.renderCactusType1(ctx, x, y, size);
    }

    renderCactusType2(ctx, x, y, size) {
        return TerrainRenderer.renderCactusType2(ctx, x, y, size);
    }

    renderCactusType3(ctx, x, y, size) {
        return TerrainRenderer.renderCactusType3(ctx, x, y, size);
    }

    renderDryBush(ctx, x, y, size, gridX, gridY) {
        return TerrainRenderer.renderDryBush(ctx, x, y, size, gridX, gridY);
    }

    renderDryBushType1(ctx, x, y, size) {
        return TerrainRenderer.renderDryBushType1(ctx, x, y, size);
    }

    renderDryBushType2(ctx, x, y, size) {
        return TerrainRenderer.renderDryBushType2(ctx, x, y, size);
    }

    renderDryBushType3(ctx, x, y, size) {
        return TerrainRenderer.renderDryBushType3(ctx, x, y, size);
    }

}