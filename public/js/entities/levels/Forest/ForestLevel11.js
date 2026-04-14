import { LevelBase } from '../LevelBase.js';

export class ForestLevel11 extends LevelBase {
    static levelMetadata = {
        name: 'Path of the Righteous',
        difficulty: 'Medium',
        order: 11,
        campaign: 'forest'
    };

    constructor() {
        super();
        // Derive instance properties from static metadata
        this.levelName = ForestLevel11.levelMetadata.name;
        this.levelNumber = ForestLevel11.levelMetadata.order;
        this.difficulty = ForestLevel11.levelMetadata.difficulty;
        this.campaign = ForestLevel11.levelMetadata.campaign;
        this.maxWaves = 15;

        // Set terrain elements (prevent tower placement on these areas)
        this.terrainElements = [
            { type: 'water', gridX: 38.00, gridY: 34.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 38.00, gridY: 33.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 37.00, gridY: 33.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 36.00, gridY: 33.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 35.00, gridY: 32.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 35.00, gridY: 32.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 34.00, gridY: 32.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 34.00, gridY: 32.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 33.00, gridY: 31.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 33.00, gridY: 30.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 32.00, gridY: 29.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 32.00, gridY: 29.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 31.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 31.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 30.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 30.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 30.00, gridY: 25.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 30.00, gridY: 24.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 30.00, gridY: 24.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 30.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 30.00, gridY: 22.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 30.00, gridY: 21.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 30.00, gridY: 21.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 30.00, gridY: 20.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 30.00, gridY: 19.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 31.00, gridY: 18.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 31.00, gridY: 18.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 31.00, gridY: 17.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 32.00, gridY: 16.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 32.00, gridY: 15.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 32.00, gridY: 15.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 33.00, gridY: 14.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 34.00, gridY: 14.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 34.00, gridY: 13.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 35.00, gridY: 13.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 36.00, gridY: 12.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 37.00, gridY: 11.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 37.00, gridY: 11.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 37.00, gridY: 11.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 38.00, gridY: 11.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 39.00, gridY: 11.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 40.00, gridY: 11.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 41.00, gridY: 10.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 42.00, gridY: 10.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 43.00, gridY: 10.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 43.00, gridY: 10.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 44.00, gridY: 10.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 45.00, gridY: 9.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 45.00, gridY: 9.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 46.00, gridY: 8.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 47.00, gridY: 8.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 48.00, gridY: 7.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 49.00, gridY: 7.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 49.00, gridY: 7.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 49.00, gridY: 6.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 49.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 50.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 50.00, gridY: 4.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 50.00, gridY: 4.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 50.00, gridY: 3.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 50.00, gridY: 2.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 51.00, gridY: 1.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 51.00, gridY: 0.00, size: 1.5, waterType: 'river' },
            { type: 'vegetation', gridX: 1.00, gridY: 7.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 3.00, gridY: 4.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 8.00, gridY: 3.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 13.00, gridY: 1.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 18.00, gridY: 1.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 11.00, gridY: 3.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 9.00, gridY: 1.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 2.00, gridY: 3.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 2.00, gridY: 5.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 2.00, gridY: 9.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 1.00, gridY: 14.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 3.00, gridY: 14.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 2.00, gridY: 11.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 5.00, gridY: 21.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 4.00, gridY: 28.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 8.00, gridY: 30.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 11.00, gridY: 33.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 16.00, gridY: 31.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 17.00, gridY: 32.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 12.00, gridY: 29.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 7.00, gridY: 32.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 3.00, gridY: 31.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 7.00, gridY: 28.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 3.00, gridY: 25.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 21.00, gridY: 0.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 9.00, gridY: 28.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 12.00, gridY: 31.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 19.00, gridY: 33.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 6.00, gridY: 25.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 3.00, gridY: 22.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 6.00, gridY: 17.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 4.00, gridY: 12.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 3.00, gridY: 7.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 16.00, gridY: 3.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 17.00, gridY: 1.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 21.00, gridY: 2.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 25.00, gridY: 2.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 31.00, gridY: 1.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 13.00, gridY: 33.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 6.00, gridY: 30.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 2.00, gridY: 20.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 4.00, gridY: 10.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 15.00, gridY: 1.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 19.00, gridY: 4.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 23.00, gridY: 2.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 28.00, gridY: 1.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 11.00, gridY: 23.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 3.00, gridY: 17.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 5.00, gridY: 6.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 9.00, gridY: 32.00, size: 2.5, variant: 2 },
            { type: 'vegetation', gridX: 21.00, gridY: 5.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 28.00, gridY: 3.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 6.00, gridY: 13.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 2.00, gridY: 27.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 14.00, gridY: 29.00, size: 2.5, variant: 2 },
            { type: 'vegetation', gridX: 3.00, gridY: 33.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 2.00, gridY: 30.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 5.00, gridY: 33.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 4.00, gridY: 19.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 9.00, gridY: 26.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 23.00, gridY: 33.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 19.00, gridY: 31.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 12.00, gridY: 27.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 26.00, gridY: 4.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 31.00, gridY: 3.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 19.00, gridY: 2.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 14.00, gridY: 3.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 5.00, gridY: 8.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 7.00, gridY: 22.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 4.00, gridY: 24.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 14.00, gridY: 31.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 24.00, gridY: 5.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 34.00, gridY: 2.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 33.00, gridY: 1.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 36.00, gridY: 1.00, size: 1, variant: 0 },
            { type: 'vegetation', gridX: 36.00, gridY: 4.00, size: 1, variant: 0 },
            { type: 'vegetation', gridX: 33.00, gridY: 3.00, size: 1, variant: 0 },
            { type: 'vegetation', gridX: 35.00, gridY: 3.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 38.00, gridY: 2.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 37.00, gridY: 2.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 33.00, gridY: 5.00, size: 1.5, variant: 3 },
            { type: 'vegetation', gridX: 38.00, gridY: 4.00, size: 1.5, variant: 3 },
            { type: 'vegetation', gridX: 40.00, gridY: 1.00, size: 1.5, variant: 3 },
            { type: 'vegetation', gridX: 36.00, gridY: 2.00, size: 1, variant: 3 },
            { type: 'vegetation', gridX: 39.00, gridY: 1.00, size: 1, variant: 3 },
            { type: 'vegetation', gridX: 39.00, gridY: 3.00, size: 1, variant: 3 },
            { type: 'vegetation', gridX: 34.00, gridY: 4.00, size: 1, variant: 3 },
            { type: 'vegetation', gridX: 35.00, gridY: 5.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 37.00, gridY: 3.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 40.00, gridY: 2.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 42.00, gridY: 2.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 37.00, gridY: 5.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 41.00, gridY: 4.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 44.00, gridY: 1.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 41.00, gridY: 1.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 31.00, gridY: 5.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 39.00, gridY: 5.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 43.00, gridY: 4.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 47.00, gridY: 1.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 36.00, gridY: 7.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 33.00, gridY: 8.00, size: 2, variant: 2 },
            { type: 'water', gridX: 51.00, gridY: 13.00, size: 4, waterType: 'lake' },
            { type: 'water', gridX: 9.00, gridY: 20.00, size: 2.5, waterType: 'lake' },
            { type: 'vegetation', gridX: 50.00, gridY: 10.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 54.00, gridY: 12.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 51.00, gridY: 16.00, size: 3, variant: 1 },
            { type: 'rock', gridX: 49.00, gridY: 11.00, size: 1, variant: 0 },
            { type: 'rock', gridX: 54.00, gridY: 14.00, size: 1, variant: 0 },
            { type: 'rock', gridX: 55.00, gridY: 13.00, size: 1, variant: 2 },
            { type: 'rock', gridX: 50.00, gridY: 17.00, size: 1, variant: 2 },
            { type: 'rock', gridX: 52.00, gridY: 11.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 52.00, gridY: 10.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 54.00, gridY: 5.00, size: 3.5, variant: 3 },
            { type: 'vegetation', gridX: 56.00, gridY: 24.00, size: 3.5, variant: 1 },
            { type: 'vegetation', gridX: 41.00, gridY: 32.00, size: 3.5, variant: 1 },
            { type: 'vegetation', gridX: 51.00, gridY: 32.00, size: 3.5, variant: 2 },
            { type: 'vegetation', gridX: 57.00, gridY: 29.00, size: 3.5, variant: 2 },
            { type: 'vegetation', gridX: 54.00, gridY: 27.00, size: 3.5, variant: 2 },
            { type: 'vegetation', gridX: 48.00, gridY: 32.00, size: 3.5, variant: 3 },
            { type: 'vegetation', gridX: 56.00, gridY: 32.00, size: 3.5, variant: 3 },
            { type: 'vegetation', gridX: 59.00, gridY: 25.00, size: 3.5, variant: 3 },
            { type: 'vegetation', gridX: 44.00, gridY: 32.00, size: 3.5, variant: 3 },
            { type: 'vegetation', gridX: 46.00, gridY: 31.00, size: 3.5, variant: 0 },
            { type: 'vegetation', gridX: 53.00, gridY: 30.00, size: 3.5, variant: 0 },
            { type: 'vegetation', gridX: 59.00, gridY: 32.00, size: 3.5, variant: 0 },
            { type: 'vegetation', gridX: 59.00, gridY: 21.00, size: 3.5, variant: 0 },
            { type: 'vegetation', gridX: 53.00, gridY: 24.00, size: 3.5, variant: 0 },
            { type: 'vegetation', gridX: 52.00, gridY: 28.00, size: 3.5, variant: 0 }
        ];
    }

    createMeanderingPath(canvasWidth, canvasHeight) {
        const gridWidth = this.gridWidth || 60;
        const gridHeight = this.gridHeight || 33.75;

        const pathInGridCoords = [
            { gridX: 0.00, gridY: 0.00 },
            { gridX: 48.00, gridY: 28.00 }
        ];

        this.path = pathInGridCoords.map(point => ({
            x: Math.round(point.gridX * this.cellSize),
            y: Math.round(point.gridY * this.cellSize)
        }));
    }

    getWaveConfig(wave) {
        const waveConfigs = [
        // Wave 1
        { 
            enemyCount: 25, 
            enemyHealth_multiplier: 1.2, 
            speedMultiplier: 0.90, 
            spawnInterval: 1, 
            pattern: ['basic', 'villager'] 
        }
        // Wave 2
        , { 
            enemyCount: 30, 
            enemyHealth_multiplier: 1.2, 
            speedMultiplier: 1.00, 
            spawnInterval: 0.8, 
            pattern: ['basic', 'villager'] 
        }
        // Wave 3
        , { 
            enemyCount: 35, 
            enemyHealth_multiplier: 1.0, 
            speedMultiplier: 1.25, 
            spawnInterval: 0.5, 
            pattern: ['archer'] 
        }
        // Wave 4
        , { 
            enemyCount: 20, 
            enemyHealth_multiplier: 1.5, 
            speedMultiplier: 1.17, 
            spawnInterval: 1.1, 
            pattern: ['beefyenemy'] 
        }
        // Wave 5
        , { 
            enemyCount: 55, 
            enemyHealth_multiplier: 2, 
            speedMultiplier: 1.10, 
            spawnInterval: 1, 
            pattern: ['villager'] 
        }
        // Wave 6
        , { 
            enemyCount: 3, 
            enemyHealth_multiplier: 3.5, 
            speedMultiplier: 1.08, 
            spawnInterval: 0.2, 
            pattern: ['beefyenemy'] 
        }
        // Wave 7
        , { 
            enemyCount: 3, 
            enemyHealth_multiplier: 3, 
            speedMultiplier: 1.86, 
            spawnInterval: 1.5, 
            pattern: ['shieldknight'] 
        }
        // Wave 8
        , { 
            enemyCount: 30, 
            enemyHealth_multiplier: 2.5, 
            speedMultiplier: 1.30, 
            spawnInterval: 0.1, 
            pattern: ['basic', 'villager'] 
        }
        // Wave 9
        , { 
            enemyCount: 16, 
            enemyHealth_multiplier: 3, 
            speedMultiplier: 0.83, 
            spawnInterval: 0.8, 
            pattern: ['beefyenemy', 'beefyenemy', 'beefyenemy', 'shieldknight', 'beefyenemy', 'knight', 'beefyenemy', 'shieldknight', 'beefyenemy', 'beefyenemy', 'beefyenemy'] 
        }
        // Wave 10
        , { 
            enemyCount: 1, 
            enemyHealth_multiplier: 6, 
            speedMultiplier: 1.63, 
            spawnInterval: 1, 
            pattern: ['knight'] 
        }
        // Wave 11
        , { 
            enemyCount: 45, 
            enemyHealth_multiplier: 2.7, 
            speedMultiplier: 0.92, 
            spawnInterval: 0.8, 
            pattern: ['archer', 'basic', 'villager', 'beefyenemy', 'shieldknight', 'villager', 'archer', 'archer', 'villager', 'villager', 'shieldknight', 'villager', 'shieldknight', 'knight', 'basic'] 
        }
        // Wave 12
        , { 
            enemyCount: 15, 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 2.92, 
            spawnInterval: 0.5, 
            pattern: ['archer'] 
        }
        // Wave 13
        , { 
            enemyCount: 55, 
            enemyHealth_multiplier: 5, 
            speedMultiplier: 1.30, 
            spawnInterval: 0.2, 
            pattern: ['basic', 'villager', 'archer'] 
        }
        // Wave 14
        , { 
            enemyCount: 6, 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 1.57, 
            spawnInterval: 0.3, 
            pattern: ['shieldknight', 'shieldknight', 'shieldknight', 'knight', 'shieldknight', 'shieldknight'] 
        }
        // Wave 15
        , { 
            enemyCount: 3, 
            enemyHealth_multiplier: 10, 
            speedMultiplier: 0.88, 
            spawnInterval: 0.4, 
            pattern: ['knight'] 
        }
        ];

        if (wave > 0 && wave <= waveConfigs.length) {
            return waveConfigs[wave - 1];
        }
        
        return null;
    }
}