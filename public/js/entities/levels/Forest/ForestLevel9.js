import { LevelBase } from '../LevelBase.js';

export class ForestLevel9 extends LevelBase {
    static levelMetadata = {
        name: 'Foggy Hills',
        difficulty: 'Medium',
        order: 9,
        campaign: 'forest'
    };

    constructor() {
        super();
        // Derive instance properties from static metadata
        this.levelName = ForestLevel9.levelMetadata.name;
        this.levelNumber = ForestLevel9.levelMetadata.order;
        this.difficulty = ForestLevel9.levelMetadata.difficulty;
        this.campaign = ForestLevel9.levelMetadata.campaign;
        this.maxWaves = 20;

        // Set terrain elements (prevent tower placement on these areas)
        this.terrainElements = [
            { type: 'rock', gridX: 31.00, gridY: 26.00, size: 3, variant: 3 },
            { type: 'rock', gridX: 22.00, gridY: 5.00, size: 3, variant: 1 },
            { type: 'rock', gridX: 2.00, gridY: 14.00, size: 3, variant: 2 },
            { type: 'rock', gridX: 10.00, gridY: 29.00, size: 3, variant: 0 },
            { type: 'rock', gridX: 4.00, gridY: 14.00, size: 2, variant: 0 },
            { type: 'rock', gridX: 24.00, gridY: 6.00, size: 2, variant: 1 },
            { type: 'rock', gridX: 12.00, gridY: 29.00, size: 2, variant: 2 },
            { type: 'rock', gridX: 29.00, gridY: 27.00, size: 1.5, variant: 0 },
            { type: 'rock', gridX: 29.00, gridY: 26.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 24.00, gridY: 4.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 20.00, gridY: 5.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 1.00, gridY: 12.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 4.00, gridY: 15.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 2.00, gridY: 17.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 8.00, gridY: 30.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 9.00, gridY: 27.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 14.00, gridY: 30.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 31.00, gridY: 28.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 27.00, gridY: 26.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 31.00, gridY: 24.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 54.00, gridY: 3.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 59.00, gridY: 8.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 49.00, gridY: 4.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 57.00, gridY: 4.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 50.00, gridY: 2.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 7.00, gridY: 1.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 2.00, gridY: 1.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 1.00, gridY: 9.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 3.00, gridY: 32.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 3.00, gridY: 28.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 9.00, gridY: 32.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 58.00, gridY: 32.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 58.00, gridY: 29.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 53.00, gridY: 32.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 57.00, gridY: 25.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 55.00, gridY: 30.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 48.00, gridY: 33.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 56.00, gridY: 32.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 34.00, gridY: 1.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 19.00, gridY: 1.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 6.00, gridY: 30.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 12.00, gridY: 31.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 51.00, gridY: 32.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 56.00, gridY: 28.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 59.00, gridY: 26.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 57.00, gridY: 7.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 54.00, gridY: 6.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 56.00, gridY: 2.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 46.00, gridY: 1.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 31.00, gridY: 2.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 38.00, gridY: 2.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 21.00, gridY: 1.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 17.00, gridY: 2.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 3.00, gridY: 12.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 4.00, gridY: 17.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 4.00, gridY: 26.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 5.00, gridY: 20.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 3.00, gridY: 22.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 15.00, gridY: 33.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 7.00, gridY: 27.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 6.00, gridY: 32.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 45.00, gridY: 33.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 53.00, gridY: 29.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 56.00, gridY: 11.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 59.00, gridY: 5.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 52.00, gridY: 2.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 40.00, gridY: 1.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 35.00, gridY: 4.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 25.00, gridY: 2.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 15.00, gridY: 2.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 23.00, gridY: 3.00, size: 2.5, variant: 2 },
            { type: 'vegetation', gridX: 51.00, gridY: 6.00, size: 2.5, variant: 2 },
            { type: 'vegetation', gridX: 58.00, gridY: 22.00, size: 2.5, variant: 2 },
            { type: 'vegetation', gridX: 19.00, gridY: 33.00, size: 2.5, variant: 2 },
            { type: 'vegetation', gridX: 6.00, gridY: 24.00, size: 2.5, variant: 2 },
            { type: 'vegetation', gridX: 6.00, gridY: 16.00, size: 1.5, variant: 3 },
            { type: 'vegetation', gridX: 7.00, gridY: 21.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 3.00, gridY: 20.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 13.00, gridY: 1.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 29.00, gridY: 4.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 28.00, gridY: 2.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 45.00, gridY: 3.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 52.00, gridY: 4.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 54.00, gridY: 1.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 58.00, gridY: 2.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 58.00, gridY: 12.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 55.00, gridY: 8.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 55.00, gridY: 26.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 54.00, gridY: 33.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 47.00, gridY: 33.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 42.00, gridY: 33.00, size: 2, variant: 3 },
            { type: 'water', gridX: 51.00, gridY: 11.00, size: 4, waterType: 'lake' },
            { type: 'rock', gridX: 49.00, gridY: 10.00, size: 1.5, variant: 1 },
            { type: 'rock', gridX: 51.00, gridY: 14.00, size: 1.5, variant: 3 },
            { type: 'rock', gridX: 53.00, gridY: 9.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 50.00, gridY: 8.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 54.00, gridY: 13.00, size: 2.5, variant: 1 }
        ];
    }

    createMeanderingPath(canvasWidth, canvasHeight) {
        const gridWidth = this.gridWidth || 60;
        const gridHeight = this.gridHeight || 33.75;

        const pathInGridCoords = [
            { gridX: 0.00, gridY: 5.00 },
            { gridX: 11.00, gridY: 5.00 },
            { gridX: 16.00, gridY: 8.00 },
            { gridX: 16.00, gridY: 17.00 },
            { gridX: 20.00, gridY: 20.00 },
            { gridX: 28.00, gridY: 20.00 },
            { gridX: 28.00, gridY: 12.00 },
            { gridX: 38.00, gridY: 12.00 },
            { gridX: 38.00, gridY: 28.00 },
            { gridX: 49.00, gridY: 28.00 }
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
            speedMultiplier: 0.90, 
            spawnInterval: 0.4, 
            pattern: [{ type: 'basic', count: 12 }, { type: 'villager', count: 23 }] 
        }
        // Wave 2
        , { 
            enemyHealth_multiplier: 1.5, 
            speedMultiplier: 0.90, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'basic', count: 20 }, { type: 'villager', count: 20 }] 
        }
        // Wave 3
        , { 
            enemyHealth_multiplier: 1.7, 
            speedMultiplier: 0.90, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'basic', count: 13 }, { type: 'villager', count: 13 }, { type: 'archer', count: 13 }, { type: 'beefyenemy', count: 6 }] 
        }
        // Wave 4
        , { 
            enemyHealth_multiplier: 1.55, 
            speedMultiplier: 1.42, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'archer', count: 40 }] 
        }
        // Wave 5
        , { 
            enemyHealth_multiplier: 6, 
            speedMultiplier: 0.75, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'beefyenemy', count: 12 }] 
        }
        // Wave 6
        , { 
            enemyHealth_multiplier: 5, 
            speedMultiplier: 1.29, 
            spawnInterval: 1.8, 
            pattern: [{ type: 'shieldknight', count: 4 }] 
        }
        // Wave 7
        , { 
            enemyHealth_multiplier: 3, 
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
            speedMultiplier: 2.58, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'archer', count: 35 }] 
        }
        // Wave 11
        , { 
            enemyHealth_multiplier: 5, 
            speedMultiplier: 0.90, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'basic', count: 16 }, { type: 'villager', count: 18 }, { type: 'beefyenemy', count: 11 }] 
        }
        // Wave 12
        , { 
            enemyHealth_multiplier: 5, 
            speedMultiplier: 1.57, 
            spawnInterval: 0.4, 
            pattern: [{ type: 'shieldknight', count: 3 }] 
        }
        // Wave 13
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 1.29, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'shieldknight', count: 5 }, { type: 'beefyenemy', count: 9 }, { type: 'archer', count: 5 }, { type: 'villager', count: 4 }] 
        }
        // Wave 14
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 0.70, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'villager', count: 32 }, { type: 'basic', count: 32 }] 
        }
        // Wave 15
        , { 
            enemyHealth_multiplier: 5, 
            speedMultiplier: 0.75, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'beefyenemy', count: 23 }] 
        }
        // Wave 16
        , { 
            enemyHealth_multiplier: 8, 
            speedMultiplier: 0.88, 
            spawnInterval: 1.2, 
            pattern: [{ type: 'knight', count: 1 }] 
        }
        // Wave 17
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 2.75, 
            spawnInterval: 0.4, 
            pattern: [{ type: 'archer', count: 45 }] 
        }
        // Wave 18
        , { 
            enemyHealth_multiplier: 8, 
            speedMultiplier: 1.08, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'archer', count: 14 }, { type: 'villager', count: 14 }, { type: 'basic', count: 13 }] 
        }
        // Wave 19
        , { 
            enemyHealth_multiplier: 8, 
            speedMultiplier: 1.29, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'shieldknight', count: 3 }] 
        }
        // Wave 20
        , { 
            enemyHealth_multiplier: 8, 
            speedMultiplier: 0.88, 
            spawnInterval: 0.5, 
            pattern: [{ type: 'knight', count: 1 }, { type: 'shieldknight', count: 3 }] 
        }
        ];

        if (wave > 0 && wave <= waveConfigs.length) {
            return waveConfigs[wave - 1];
        }
        
        return null;
    }
}