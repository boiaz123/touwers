import { LevelBase } from '../LevelBase.js';

export class ForestLevel8 extends LevelBase {
    static levelMetadata = {
        name: 'Poisonous Planes',
        difficulty: 'Medium',
        order: 8,
        campaign: 'forest'
    };

    constructor() {
        super();
        // Derive instance properties from static metadata
        this.levelName = ForestLevel8.levelMetadata.name;
        this.levelNumber = ForestLevel8.levelMetadata.order;
        this.difficulty = ForestLevel8.levelMetadata.difficulty;
        this.campaign = ForestLevel8.levelMetadata.campaign;
        this.maxWaves = 14;

        // Set terrain elements (prevent tower placement on these areas)
        this.terrainElements = [
            { type: 'vegetation', gridX: 1.00, gridY: 32.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 4.00, gridY: 33.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 7.00, gridY: 33.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 4.00, gridY: 30.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 1.00, gridY: 28.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 11.00, gridY: 33.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 53.00, gridY: 33.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 59.00, gridY: 33.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 59.00, gridY: 30.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 56.00, gridY: 33.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 57.00, gridY: 30.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 59.00, gridY: 27.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 59.00, gridY: 5.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 59.00, gridY: 3.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 57.00, gridY: 2.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 53.00, gridY: 0.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 50.00, gridY: 2.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 55.00, gridY: 2.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 59.00, gridY: 1.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 60.00, gridY: 2.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 0.00, gridY: 2.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 2.00, gridY: 1.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 5.00, gridY: 1.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 7.00, gridY: 1.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 9.00, gridY: 0.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 0.00, gridY: 10.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 1.00, gridY: 11.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 3.00, gridY: 14.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 1.00, gridY: 17.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 0.00, gridY: 19.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 2.00, gridY: 20.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 1.00, gridY: 14.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 2.00, gridY: 30.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 6.00, gridY: 33.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 10.00, gridY: 33.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 3.00, gridY: 19.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 1.00, gridY: 3.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 3.00, gridY: 1.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 7.00, gridY: 1.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 53.00, gridY: 2.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 56.00, gridY: 1.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 59.00, gridY: 7.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 49.00, gridY: 1.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 57.00, gridY: 32.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 58.00, gridY: 28.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 55.00, gridY: 31.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 51.00, gridY: 33.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 45.00, gridY: 32.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 3.00, gridY: 32.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 8.00, gridY: 33.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 4.00, gridY: 28.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 1.00, gridY: 26.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 1.00, gridY: 22.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 3.00, gridY: 16.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 5.00, gridY: 12.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 4.00, gridY: 9.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 4.00, gridY: 3.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 51.00, gridY: 1.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 57.00, gridY: 3.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 47.00, gridY: 2.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 58.00, gridY: 26.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 58.00, gridY: 31.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 48.00, gridY: 33.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 38.00, gridY: 33.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 5.00, gridY: 31.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 2.00, gridY: 23.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 21.00, gridY: 0.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 18.00, gridY: 1.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 42.00, gridY: 2.00, size: 2, variant: 3 },
            { type: 'rock', gridX: 3.00, gridY: 11.00, size: 2, variant: 0 },
            { type: 'rock', gridX: 55.00, gridY: 33.00, size: 2, variant: 0 },
            { type: 'rock', gridX: 57.00, gridY: 1.00, size: 1.5, variant: 0 },
            { type: 'rock', gridX: 31.00, gridY: 15.00, size: 3, variant: 3 },
            { type: 'rock', gridX: 30.00, gridY: 16.00, size: 2.5, variant: 2 },
            { type: 'rock', gridX: 34.00, gridY: 14.00, size: 1.5, variant: 1 },
            { type: 'rock', gridX: 27.00, gridY: 13.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 28.00, gridY: 15.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 29.00, gridY: 14.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 33.00, gridY: 16.00, size: 3, variant: 0 },
            { type: 'vegetation', gridX: 31.00, gridY: 17.00, size: 1.5, variant: 3 },
            { type: 'vegetation', gridX: 28.00, gridY: 14.00, size: 1.5, variant: 3 },
            { type: 'vegetation', gridX: 35.00, gridY: 15.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 33.00, gridY: 14.00, size: 2, variant: 3 },
            { type: 'water', gridX: 28.00, gridY: 18.00, size: 2, waterType: 'lake' },
            { type: 'vegetation', gridX: 27.00, gridY: 19.00, size: 2, variant: 0 },
            { type: 'rock', gridX: 26.00, gridY: 18.00, size: 1.5, variant: 0 },
            { type: 'rock', gridX: 28.00, gridY: 17.00, size: 1.5, variant: 0 }
        ];
    }

    createMeanderingPath(canvasWidth, canvasHeight) {
        const gridWidth = this.gridWidth || 60;
        const gridHeight = this.gridHeight || 33.75;

        const pathInGridCoords = [
            { gridX: 0.00, gridY: 6.00 },
            { gridX: 53.00, gridY: 6.00 },
            { gridX: 53.00, gridY: 30.00 },
            { gridX: 10.00, gridY: 30.00 },
            { gridX: 10.00, gridY: 18.00 }
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
            enemyHealth_multiplier: 1.2, 
            speedMultiplier: 0.90, 
            spawnInterval: 1, 
            pattern: [{ type: 'basic', count: 12 }, { type: 'villager', count: 22 }] 
        }
        // Wave 2
        , { 
            enemyHealth_multiplier: 1.5, 
            speedMultiplier: 1.67, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'archer', count: 35 }] 
        }
        // Wave 3
        , { 
            enemyHealth_multiplier: 1.5, 
            speedMultiplier: 0.90, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'basic', count: 12 }, { type: 'villager', count: 12 }, { type: 'archer', count: 12 }, { type: 'beefyenemy', count: 6 }] 
        }
        // Wave 4
        , { 
            enemyHealth_multiplier: 1.25, 
            speedMultiplier: 0.90, 
            spawnInterval: 2, 
            pattern: [{ type: 'villager', count: 52 }] 
        }
        // Wave 5
        , { 
            enemyHealth_multiplier: 10, 
            speedMultiplier: 1.29, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'shieldknight', count: 1 }] 
        }
        // Wave 6
        , { 
            enemyHealth_multiplier: 3, 
            speedMultiplier: 0.75, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'beefyenemy', count: 6 }] 
        }
        // Wave 7
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 1.29, 
            spawnInterval: 1.2, 
            pattern: [{ type: 'shieldknight', count: 6 }] 
        }
        // Wave 8
        , { 
            enemyHealth_multiplier: 2, 
            speedMultiplier: 0.90, 
            spawnInterval: 0.5, 
            pattern: [{ type: 'basic', count: 19 }, { type: 'archer', count: 18 }, { type: 'villager', count: 18 }] 
        }
        // Wave 9
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 1.29, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'shieldknight', count: 3 }, { type: 'beefyenemy', count: 5 }] 
        }
        // Wave 10
        , { 
            enemyHealth_multiplier: 3, 
            speedMultiplier: 2.42, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'archer', count: 35 }] 
        }
        // Wave 11
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 0.90, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'basic', count: 13 }, { type: 'villager', count: 14 }, { type: 'beefyenemy', count: 8 }] 
        }
        // Wave 12
        , { 
            enemyHealth_multiplier: 5, 
            speedMultiplier: 1.57, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'shieldknight', count: 3 }] 
        }
        // Wave 13
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 1.29, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'shieldknight', count: 5 }, { type: 'beefyenemy', count: 5 }, { type: 'archer', count: 5 }, { type: 'villager', count: 6 }, { type: 'basic', count: 2 }] 
        }
        // Wave 14
        , { 
            enemyHealth_multiplier: 8, 
            speedMultiplier: 0.88, 
            spawnInterval: 1.2, 
            pattern: [{ type: 'knight', count: 1 }] 
        }
        ];

        if (wave > 0 && wave <= waveConfigs.length) {
            return waveConfigs[wave - 1];
        }
        
        return null;
    }
}