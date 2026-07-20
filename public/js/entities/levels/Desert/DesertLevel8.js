import { LevelBase } from '../LevelBase.js';

export class DesertLevel8 extends LevelBase {
    static levelMetadata = {
        name: 'Dakra Mun Ladiun',
        difficulty: 'Hard',
        order: 8,
        campaign: 'desert'
    };

    constructor() {
        super();
        // Derive instance properties from static metadata
        this.levelName = DesertLevel8.levelMetadata.name;
        this.levelNumber = DesertLevel8.levelMetadata.order;
        this.difficulty = DesertLevel8.levelMetadata.difficulty;
        this.campaign = DesertLevel8.levelMetadata.campaign;
        this.maxWaves = 13;

        // Set terrain elements (prevent tower placement on these areas)
        this.terrainElements = [
            { type: 'water', gridX: 44.00, gridY: 16.00, size: 3.5, waterType: 'lake' },
            { type: 'vegetation', gridX: 43.00, gridY: 14.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 41.00, gridY: 17.00, size: 2.5, variant: 2 },
            { type: 'vegetation', gridX: 46.00, gridY: 19.00, size: 2.5, variant: 2 },
            { type: 'vegetation', gridX: 40.00, gridY: 14.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 47.00, gridY: 17.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 42.00, gridY: 19.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 47.00, gridY: 14.00, size: 3, variant: 3 },
            { type: 'vegetation', gridX: 47.00, gridY: 21.00, size: 3, variant: 3 },
            { type: 'vegetation', gridX: 39.00, gridY: 15.00, size: 1.5, variant: 3 },
            { type: 'rock', gridX: 41.00, gridY: 15.00, size: 1.5, variant: 1 },
            { type: 'rock', gridX: 45.00, gridY: 20.00, size: 2.5, variant: 1 },
            { type: 'rock', gridX: 48.00, gridY: 14.00, size: 2.5, variant: 2 },
            { type: 'rock', gridX: 39.00, gridY: 18.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 4.00, gridY: 3.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 19.00, gridY: 4.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 57.00, gridY: 5.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 51.00, gridY: 3.00, size: 1.5, variant: 1 },
            { type: 'vegetation', gridX: 25.00, gridY: 4.00, size: 1.5, variant: 1 },
            { type: 'vegetation', gridX: 8.00, gridY: 3.00, size: 1.5, variant: 1 },
            { type: 'vegetation', gridX: 13.00, gridY: 2.00, size: 3, variant: 1 },
            { type: 'vegetation', gridX: 16.00, gridY: 5.00, size: 3, variant: 1 },
            { type: 'vegetation', gridX: 39.00, gridY: 2.00, size: 3, variant: 1 },
            { type: 'vegetation', gridX: 58.00, gridY: 19.00, size: 3, variant: 1 },
            { type: 'vegetation', gridX: 55.00, gridY: 32.00, size: 3, variant: 1 },
            { type: 'vegetation', gridX: 3.00, gridY: 31.00, size: 3, variant: 1 },
            { type: 'vegetation', gridX: 16.00, gridY: 33.00, size: 3, variant: 1 },
            { type: 'vegetation', gridX: 4.00, gridY: 25.00, size: 3, variant: 1 },
            { type: 'vegetation', gridX: 13.00, gridY: 29.00, size: 3.5, variant: 1 },
            { type: 'vegetation', gridX: 2.00, gridY: 20.00, size: 3.5, variant: 1 },
            { type: 'vegetation', gridX: 48.00, gridY: 4.00, size: 3.5, variant: 1 },
            { type: 'vegetation', gridX: 8.00, gridY: 31.00, size: 1.5, variant: 1 },
            { type: 'vegetation', gridX: 9.00, gridY: 26.00, size: 1.5, variant: 1 },
            { type: 'vegetation', gridX: 58.00, gridY: 30.00, size: 1.5, variant: 1 },
            { type: 'vegetation', gridX: 50.00, gridY: 33.00, size: 1.5, variant: 1 },
            { type: 'vegetation', gridX: 58.00, gridY: 10.00, size: 1.5, variant: 1 },
            { type: 'vegetation', gridX: 12.00, gridY: 23.00, size: 1.5, variant: 3 },
            { type: 'vegetation', gridX: 13.00, gridY: 31.00, size: 1.5, variant: 3 },
            { type: 'vegetation', gridX: 3.00, gridY: 26.00, size: 1.5, variant: 3 },
            { type: 'vegetation', gridX: 6.00, gridY: 2.00, size: 1.5, variant: 3 },
            { type: 'vegetation', gridX: 23.00, gridY: 4.00, size: 1.5, variant: 3 },
            { type: 'vegetation', gridX: 45.00, gridY: 2.00, size: 1.5, variant: 3 },
            { type: 'vegetation', gridX: 57.00, gridY: 23.00, size: 1.5, variant: 3 },
            { type: 'vegetation', gridX: 34.00, gridY: 3.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 57.00, gridY: 13.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 19.00, gridY: 33.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 6.00, gridY: 27.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 4.00, gridY: 20.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 1.00, gridY: 3.00, size: 2, variant: 3 }
        ];
    }

    createMeanderingPath(canvasWidth, canvasHeight) {
        const gridWidth = this.gridWidth || 60;
        const gridHeight = this.gridHeight || 33.75;

        const pathInGridCoords = [
            { gridX: 0.00, gridY: 9.00 },
            { gridX: 52.00, gridY: 9.00 },
            { gridX: 52.00, gridY: 28.00 },
            { gridX: 33.00, gridY: 28.00 },
            { gridX: 33.00, gridY: 15.00 },
            { gridX: 8.00, gridY: 15.00 }
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
            speedMultiplier: 0.7, 
            spawnInterval: 4, 
            pattern: [{ type: 'beefyenemy', count: 12, healthMultiplier: 1 }, { type: 'shieldknight', count: 6, healthMultiplier: 2 }, { type: 'mage', count: 2 }, { type: 'knight', count: 1 }, { type: 'archer', count: 7, healthMultiplier: 2, speedMultiplier: 1.5 }] 
        }
        // Wave 2
        , { 
            enemyHealth_multiplier: 2, 
            speedMultiplier: 0.8, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'basic', count: 11 }, { type: 'villager', count: 13 }, { type: 'archer', count: 9, speedMultiplier: 1.2 }] 
        }
        // Wave 3
        , { 
            enemyHealth_multiplier: 2, 
            speedMultiplier: 0.7, 
            spawnInterval: 1.4, 
            pattern: [{ type: 'beefyenemy', count: 7 }] 
        }
        // Wave 4
        , { 
            enemyHealth_multiplier: 5, 
            speedMultiplier: 0.8, 
            spawnInterval: 10, 
            pattern: [{ type: 'earthfrog', count: 1 }, { type: 'waterfrog', count: 1 }, { type: 'firefrog', count: 1 }, { type: 'airfrog', count: 1 }] 
        }
        // Wave 5
        , { 
            enemyHealth_multiplier: 2, 
            speedMultiplier: 1, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'basic', count: 17 }, { type: 'villager', count: 12 }, { type: 'archer', count: 8, healthMultiplier: 3, speedMultiplier: 1.3 }] 
        }
        // Wave 6
        , { 
            enemyHealth_multiplier: 7, 
            speedMultiplier: 0.9, 
            spawnInterval: 14, 
            pattern: [{ type: 'knight', count: 6 }] 
        }
        // Wave 7
        , { 
            enemyHealth_multiplier: 1.6, 
            speedMultiplier: 1, 
            spawnInterval: 1.3, 
            pattern: [{ type: 'mage', count: 1, healthMultiplier: 0.4, speedMultiplier: 2 }, { type: 'frog', count: 4, healthMultiplier: 5 }, { type: 'mage', count: 1, healthMultiplier: 1, speedMultiplier: 1.5 }, { type: 'frog', count: 7, healthMultiplier: 8, speedMultiplier: 1.2 }, { type: 'mage', count: 1, healthMultiplier: 4, speedMultiplier: 0.8 }, { type: 'frog', count: 12, healthMultiplier: 4, speedMultiplier: 1.4 }] 
        }
        // Wave 8
        , { 
            enemyHealth_multiplier: 1.7, 
            speedMultiplier: 1, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'shieldknight', count: 3, healthMultiplier: 3, speedMultiplier: 0.8 }, { type: 'knight', count: 1, healthMultiplier: 2 }, { type: 'beefyenemy', count: 8, healthMultiplier: 2, speedMultiplier: 0.7 }] 
        }
        // Wave 9
        , { 
            enemyHealth_multiplier: 7, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'waterfrog', count: 1 }, { type: 'earthfrog', count: 1 }, { type: 'firefrog', count: 1 }, { type: 'airfrog', count: 1 }] 
        }
        // Wave 10
        , { 
            enemyHealth_multiplier: 1.9, 
            speedMultiplier: 1.06, 
            spawnInterval: 4, 
            pattern: [{ type: 'villager', count: 35, healthMultiplier: 6, speedMultiplier: 1.6 }] 
        }
        // Wave 11
        , { 
            enemyHealth_multiplier: 2, 
            speedMultiplier: 1, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'shieldknight', count: 3, healthMultiplier: 5 }, { type: 'knight', count: 3, healthMultiplier: 3 }] 
        }
        // Wave 12
        , { 
            enemyHealth_multiplier: 20, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'earthfrog', count: 1 }] 
        }
        // Wave 13
        , { 
            enemyHealth_multiplier: 16, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'firefrog', count: 1 }, { type: 'waterfrog', count: 1 }] 
        }
        ];

        if (wave > 0 && wave <= waveConfigs.length) {
            return waveConfigs[wave - 1];
        }
        
        return null;
    }
}