import { LevelBase } from './LevelBase.js';

/**
 * PlayerCreatedLevel
 * A level class that loads its design data from a JSON object saved
 * by the PlayerLevelDesigner into localStorage.
 *
 * Usage: LevelRegistry.registerLevel('campaign-5', slotId, PlayerCreatedLevel.createClass(data), meta)
 */
export class PlayerCreatedLevel extends LevelBase {
    constructor(levelData) {
        super(null);
        this._levelData = levelData || {};
        this.campaign = levelData.campaign || 'forest';
        this.levelName = levelData.name || 'Custom Level';
        this.waves = [];
    }

    static get levelMetadata() {
        return {
            name: 'Custom Level',
            difficulty: 'Custom',
            order: 90,
            campaign: 'forest'
        };
    }

    /**
     * Create a concrete subclass bound to a specific level data object.
     * This lets LevelRegistry store the class reference without needing
     * to pass constructor arguments through createLevel().
     */
    static createClass(levelData) {
        const campaign = levelData.campaign || 'forest';
        const name = levelData.name || 'Custom Level';

        return class extends PlayerCreatedLevel {
            constructor() {
                super(levelData);
            }

            static get levelMetadata() {
                return {
                    name,
                    difficulty: 'Custom',
                    order: 90,
                    campaign
                };
            }
        };
    }

    initializeForCanvas(canvasWidth, canvasHeight) {
        if (this.isInitializing) return;
        this.isInitializing = true;

        try {
            // Derive cellSize from canvas dimensions (fixed 60x33.75 grid)
            const gridW = 60;
            const gridH = 33.75;
            this.cellSize = canvasWidth / gridW;
            this.gridWidth = gridW;
            this.gridHeight = gridH;

            const data = this._levelData;

            // Convert grid-space path waypoints to pixel coords
            if (data.pathPoints && data.pathPoints.length >= 2) {
                this.path = data.pathPoints.map(p => ({
                    x: Math.round(p.gridX * this.cellSize),
                    y: Math.round(p.gridY * this.cellSize)
                }));
            } else {
                // Fallback straight path
                this.path = [
                    { x: 0, y: Math.round(canvasHeight * 0.5) },
                    { x: canvasWidth, y: Math.round(canvasHeight * 0.5) }
                ];
            }

            // Load terrain elements (convert grid coords to pixel coords)
            if (data.terrainElements && data.terrainElements.length > 0) {
                this.terrainElements = data.terrainElements.map(el => ({
                    ...el,
                    x: Math.round(el.gridX * this.cellSize),
                    y: Math.round(el.gridY * this.cellSize)
                }));
            } else {
                this.terrainElements = [];
            }

            // Load river paths (convert grid coords to pixel coords)
            if (data.riverPaths && data.riverPaths.length > 0) {
                this.riverPaths = data.riverPaths.map(riverPath =>
                    riverPath.map(pt => ({
                        x: Math.round(pt.gridX * this.cellSize),
                        y: Math.round(pt.gridY * this.cellSize)
                    }))
                );
            } else {
                this.riverPaths = [];
            }

            // Load waves
            if (data.waves && data.waves.length > 0) {
                this.waves = data.waves.map((wave, idx) => ({
                    id: wave.id || (idx + 1),
                    enemyHealthMultiplier: wave.enemyHealthMultiplier || 1.0,
                    speedMultiplier: wave.speedMultiplier || 0.7,
                    spawnInterval: wave.spawnInterval || 1.5,
                    pattern: wave.pattern || [{ type: 'basic', count: 5 }]
                }));
            } else {
                this.waves = [
                    {
                        id: 1,
                        enemyHealthMultiplier: 1.0,
                        speedMultiplier: 0.7,
                        spawnInterval: 1.5,
                        pattern: [{ type: 'basic', count: 5 }]
                    }
                ];
            }

            // Mark occupied cells
            this.occupiedCells.clear();
            this.markPathCells();
            this.markTerrainCells();

            // Castle at path end
            this.castleLoadPromise = this.createCastle();

            // Reset caches
            this.pathTextureGenerated = false;
            this.pathLeaves = [];
            this.backgroundCanvas = null;
            this.terrainCanvas = null;
            this.terrainFgCanvas = null;

            this.lastCanvasWidth = canvasWidth;
            this.lastCanvasHeight = canvasHeight;
            this.isInitialized = true;

        } catch (error) {
            console.error('PlayerCreatedLevel: Error during initialization:', error);
        } finally {
            this.isInitializing = false;
        }
    }
}
