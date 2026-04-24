import { LevelBase } from '../LevelBase.js';

export class ForestLevel6 extends LevelBase {
    static levelMetadata = {
        name: 'Verdant Vally',
        difficulty: 'Easy',
        order: 6,
        campaign: 'forest'
    };

    constructor() {
        super();
        // Derive instance properties from static metadata
        this.levelName = ForestLevel6.levelMetadata.name;
        this.levelNumber = ForestLevel6.levelMetadata.order;
        this.difficulty = ForestLevel6.levelMetadata.difficulty;
        this.campaign = ForestLevel6.levelMetadata.campaign;
        this.maxWaves = 18;

        // Set terrain elements (prevent tower placement on these areas)
        this.terrainElements = [
            { type: 'water', gridX: 0.00, gridY: 18.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 1.00, gridY: 18.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 2.00, gridY: 18.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 3.00, gridY: 18.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 4.00, gridY: 18.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 5.00, gridY: 17.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 6.00, gridY: 17.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 6.00, gridY: 17.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 7.00, gridY: 17.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 8.00, gridY: 17.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 9.00, gridY: 17.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 9.00, gridY: 17.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 10.00, gridY: 16.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 11.00, gridY: 16.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 11.00, gridY: 15.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 12.00, gridY: 14.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 13.00, gridY: 14.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 14.00, gridY: 13.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 14.00, gridY: 13.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 15.00, gridY: 12.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 16.00, gridY: 12.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 16.00, gridY: 12.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 16.00, gridY: 11.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 17.00, gridY: 10.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 17.00, gridY: 9.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 18.00, gridY: 8.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 18.00, gridY: 8.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 18.00, gridY: 7.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 19.00, gridY: 6.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 19.00, gridY: 6.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 20.00, gridY: 6.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 20.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 21.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 22.00, gridY: 4.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 23.00, gridY: 4.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 24.00, gridY: 4.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 24.00, gridY: 3.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 25.00, gridY: 3.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 25.00, gridY: 3.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 26.00, gridY: 3.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 27.00, gridY: 3.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 28.00, gridY: 2.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 29.00, gridY: 2.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 30.00, gridY: 2.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 30.00, gridY: 2.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 31.00, gridY: 2.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 31.00, gridY: 2.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 32.00, gridY: 2.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 33.00, gridY: 1.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 34.00, gridY: 1.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 35.00, gridY: 1.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 35.00, gridY: 1.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 36.00, gridY: 1.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 37.00, gridY: 0.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 49.00, gridY: 27.00, size: 4, waterType: 'lake' },
            { type: 'rock', gridX: 46.00, gridY: 28.00, size: 2.5, variant: 0 },
            { type: 'rock', gridX: 51.00, gridY: 25.00, size: 1.5, variant: 1 },
            { type: 'vegetation', gridX: 51.00, gridY: 29.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 50.00, gridY: 24.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 53.00, gridY: 27.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 49.00, gridY: 31.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 53.00, gridY: 30.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 53.00, gridY: 25.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 48.00, gridY: 24.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 45.00, gridY: 25.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 42.00, gridY: 30.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 49.00, gridY: 21.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 54.00, gridY: 19.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 58.00, gridY: 14.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 34.00, gridY: 32.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 29.00, gridY: 33.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 32.00, gridY: 32.00, size: 1.5, variant: 1 },
            { type: 'vegetation', gridX: 40.00, gridY: 32.00, size: 1.5, variant: 1 },
            { type: 'vegetation', gridX: 56.00, gridY: 20.00, size: 1.5, variant: 1 },
            { type: 'vegetation', gridX: 36.00, gridY: 32.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 48.00, gridY: 22.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 56.00, gridY: 16.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 59.00, gridY: 10.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 57.00, gridY: 27.00, size: 3, variant: 2 },
            { type: 'vegetation', gridX: 51.00, gridY: 32.00, size: 3, variant: 2 },
            { type: 'vegetation', gridX: 47.00, gridY: 32.00, size: 3, variant: 2 },
            { type: 'vegetation', gridX: 43.00, gridY: 32.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 55.00, gridY: 23.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 25.00, gridY: 33.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 37.00, gridY: 30.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 52.00, gridY: 21.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 57.00, gridY: 11.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 59.00, gridY: 5.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 55.00, gridY: 32.00, size: 3, variant: 3 },
            { type: 'vegetation', gridX: 58.00, gridY: 30.00, size: 3, variant: 3 },
            { type: 'vegetation', gridX: 59.00, gridY: 23.00, size: 3, variant: 3 },
            { type: 'vegetation', gridX: 45.00, gridY: 30.00, size: 3, variant: 3 },
            { type: 'vegetation', gridX: 39.00, gridY: 32.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 53.00, gridY: 23.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 58.00, gridY: 20.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 59.00, gridY: 17.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 55.00, gridY: 14.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 51.00, gridY: 18.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 58.00, gridY: 8.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 40.00, gridY: 28.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 33.00, gridY: 27.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 24.00, gridY: 30.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 17.00, gridY: 32.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 22.00, gridY: 32.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 19.00, gridY: 33.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 22.00, gridY: 30.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 28.00, gridY: 30.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 31.00, gridY: 30.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 1.00, gridY: 14.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 5.00, gridY: 11.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 10.00, gridY: 11.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 14.00, gridY: 6.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 16.00, gridY: 3.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 18.00, gridY: 2.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 22.00, gridY: 2.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 26.00, gridY: 1.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 11.00, gridY: 9.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 7.00, gridY: 13.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 9.00, gridY: 7.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 5.00, gridY: 5.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 2.00, gridY: 8.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 2.00, gridY: 4.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 4.00, gridY: 14.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 3.00, gridY: 11.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 9.00, gridY: 9.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 14.00, gridY: 7.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 19.00, gridY: 4.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 21.00, gridY: 2.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 11.00, gridY: 5.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 6.00, gridY: 4.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 10.00, gridY: 3.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 8.00, gridY: 2.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 4.00, gridY: 2.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 3.00, gridY: 7.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 14.00, gridY: 2.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 6.00, gridY: 9.00, size: 3, variant: 0 },
            { type: 'vegetation', gridX: 13.00, gridY: 4.00, size: 3, variant: 0 },
            { type: 'vegetation', gridX: 13.00, gridY: 10.00, size: 3, variant: 0 },
            { type: 'vegetation', gridX: 17.00, gridY: 6.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 7.00, gridY: 7.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 4.00, gridY: 9.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 3.00, gridY: 5.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 6.00, gridY: 2.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 17.00, gridY: 1.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 20.00, gridY: 1.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 24.00, gridY: 1.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 28.00, gridY: 0.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 9.00, gridY: 14.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 7.00, gridY: 15.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 8.00, gridY: 11.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 9.00, gridY: 5.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 5.00, gridY: 7.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 22.00, gridY: 7.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 26.00, gridY: 5.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 5.00, gridY: 20.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 14.00, gridY: 17.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 20.00, gridY: 9.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 10.00, gridY: 20.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 1.00, gridY: 20.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 3.00, gridY: 20.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 18.00, gridY: 12.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 30.00, gridY: 5.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 39.00, gridY: 1.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 24.00, gridY: 6.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 16.00, gridY: 14.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 8.00, gridY: 20.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 11.00, gridY: 18.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 1.00, gridY: 22.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 19.00, gridY: 15.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 21.00, gridY: 12.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 22.00, gridY: 9.00, size: 1.5, variant: 0 },
            { type: 'rock', gridX: 38.00, gridY: 1.00, size: 1.5, variant: 3 },
            { type: 'rock', gridX: 41.00, gridY: 1.00, size: 3, variant: 3 },
            { type: 'rock', gridX: 40.00, gridY: 2.00, size: 1.5, variant: 2 }
        ];
    }

    createMeanderingPath(canvasWidth, canvasHeight) {
        const gridWidth = this.gridWidth || 60;
        const gridHeight = this.gridHeight || 33.75;

        const pathInGridCoords = [
            { gridX: 3.00, gridY: 34.00 },
            { gridX: 3.00, gridY: 25.00 },
            { gridX: 18.00, gridY: 25.00 },
            { gridX: 18.00, gridY: 21.00 },
            { gridX: 27.00, gridY: 21.00 },
            { gridX: 27.00, gridY: 15.00 },
            { gridX: 44.00, gridY: 15.00 },
            { gridX: 44.00, gridY: 7.00 },
            { gridX: 50.00, gridY: 7.00 }
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
            enemyHealth_multiplier: 1, 
            speedMultiplier: 0.80, 
            spawnInterval: 1.6, 
            pattern: [{ type: 'basic', count: 12 }, { type: 'villager', count: 12 }] 
        }
        // Wave 2
        , { 
            enemyHealth_multiplier: 1.1, 
            speedMultiplier: 0.90, 
            spawnInterval: 1.5, 
            pattern: [{ type: 'basic', count: 13 }, { type: 'villager', count: 11 }] 
        }
        // Wave 3
        , { 
            enemyHealth_multiplier: 1.1, 
            speedMultiplier: 0.70, 
            spawnInterval: 1.2, 
            pattern: [{ type: 'basic', count: 15 }, { type: 'villager', count: 17 }] 
        }
        // Wave 4
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 0.69, 
            spawnInterval: 3, 
            pattern: [{ type: 'beefyenemy', count: 5 }] 
        }
        // Wave 5
        , { 
            enemyHealth_multiplier: 0.90, 
            speedMultiplier: 1.2, 
            spawnInterval: 0.1, 
            pattern: [{ type: 'archer', count: 12 }] 
        }
        // Wave 6
        , { 
            enemyHealth_multiplier: 0.5 ,
            speedMultiplier: 0.58, 
            spawnInterval: 0.2, 
            pattern: [{ type: 'beefyenemy', count: 7 }] 
        }
        // Wave 7
        , { 
            enemyHealth_multiplier: 1, 
            speedMultiplier: 1.22, 
            spawnInterval: 1.5, 
            pattern: [{ type: 'shieldknight', count: 3 }] 
        }
        // Wave 8
        , { 
            enemyHealth_multiplier: 1.5, 
            speedMultiplier: 1.30, 
            spawnInterval: 0.5, 
            pattern: [{ type: 'basic', count: 15 }, { type: 'villager', count: 15 }] 
        }
        // Wave 9
        , { 
            enemyHealth_multiplier: 3, 
            speedMultiplier: 0.83, 
            spawnInterval: 6.5, 
            pattern: [{ type: 'beefyenemy', count: 16 }] 
        }
        // Wave 10
        , { 
            enemyHealth_multiplier: 3, 
            speedMultiplier: 1.4, 
            spawnInterval: 7, 
            pattern: [{ type: 'knight', count: 1 }] 
        }
        // Wave 11
        , { 
            enemyHealth_multiplier: 1.7, 
            speedMultiplier: 1.83, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'archer', count: 35 }] 
        }
        // Wave 12
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 0.58, 
            spawnInterval: 4.5, 
            pattern: [{ type: 'beefyenemy', count: 6 }, { type: 'shieldknight', count: 8 }] 
        }
        // Wave 13
        , { 
            enemyHealth_multiplier: 3, 
            speedMultiplier: 0.90, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'basic', count: 16 }, { type: 'villager', count: 11 }, { type: 'archer', count: 6 }, { type: 'beefyenemy', count: 6 }, { type: 'shieldknight', count: 6 }] 
        }
        // Wave 14
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 1.86, 
            spawnInterval: 1, 
            pattern: [{ type: 'shieldknight', count: 8 }] 
        }
        // Wave 15
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 1.30, 
            spawnInterval: 0.4, 
            pattern: [{ type: 'villager', count: 45 }] 
        }
        // Wave 16
        , { 
            enemyHealth_multiplier: 7, 
            speedMultiplier: 1.57, 
            spawnInterval: 0.2, 
            pattern: [{ type: 'shieldknight', count: 3 }] 
        }
        // Wave 17
        , { 
            enemyHealth_multiplier: 2, 
            speedMultiplier: 2.83, 
            spawnInterval: 0.1, 
            pattern: [{ type: 'archer', count: 45 }] 
        }
        // Wave 18
        , { 
            enemyHealth_multiplier: 9, 
            speedMultiplier: 1.13, 
            spawnInterval: 2, 
            pattern: [{ type: 'knight', count: 1 }] 
        }
        ];

        if (wave > 0 && wave <= waveConfigs.length) {
            return waveConfigs[wave - 1];
        }
        
        return null;
    }
}