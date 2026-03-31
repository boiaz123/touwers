import { LevelBase } from '../LevelBase.js';

export class ForestLevel12 extends LevelBase {
    static levelMetadata = {
        name: 'Ominous Opening',
        difficulty: 'Medium',
        order: 12,
        campaign: 'forest'
    };

    constructor() {
        super();
        // Derive instance properties from static metadata
        this.levelName = ForestLevel12.levelMetadata.name;
        this.levelNumber = ForestLevel12.levelMetadata.order;
        this.difficulty = ForestLevel12.levelMetadata.difficulty;
        this.campaign = ForestLevel12.levelMetadata.campaign;
        this.maxWaves = 12;

        // Set terrain elements (prevent tower placement on these areas)
        this.terrainElements = [
            { type: 'vegetation', gridX: 59.00, gridY: 29.00, size: 3.5, variant: 0 },
            { type: 'vegetation', gridX: 56.00, gridY: 27.00, size: 3.5, variant: 0 },
            { type: 'vegetation', gridX: 53.00, gridY: 33.00, size: 3.5, variant: 0 },
            { type: 'vegetation', gridX: 47.00, gridY: 33.00, size: 3.5, variant: 0 },
            { type: 'vegetation', gridX: 50.00, gridY: 32.00, size: 3.5, variant: 0 },
            { type: 'vegetation', gridX: 54.00, gridY: 27.00, size: 3.5, variant: 0 },
            { type: 'vegetation', gridX: 59.00, gridY: 22.00, size: 3.5, variant: 0 },
            { type: 'vegetation', gridX: 59.00, gridY: 17.00, size: 3.5, variant: 0 },
            { type: 'vegetation', gridX: 56.00, gridY: 16.00, size: 3.5, variant: 0 },
            { type: 'vegetation', gridX: 54.00, gridY: 11.00, size: 3.5, variant: 0 },
            { type: 'vegetation', gridX: 50.00, gridY: 7.00, size: 3.5, variant: 0 },
            { type: 'vegetation', gridX: 58.00, gridY: 6.00, size: 3.5, variant: 0 },
            { type: 'vegetation', gridX: 59.00, gridY: 1.00, size: 3.5, variant: 0 },
            { type: 'vegetation', gridX: 54.00, gridY: 2.00, size: 3.5, variant: 0 },
            { type: 'vegetation', gridX: 52.00, gridY: 5.00, size: 3.5, variant: 0 },
            { type: 'vegetation', gridX: 47.00, gridY: 2.00, size: 3.5, variant: 0 },
            { type: 'vegetation', gridX: 42.00, gridY: 4.00, size: 3.5, variant: 0 },
            { type: 'vegetation', gridX: 39.00, gridY: 0.00, size: 3.5, variant: 0 },
            { type: 'vegetation', gridX: 40.00, gridY: 2.00, size: 3.5, variant: 0 },
            { type: 'vegetation', gridX: 44.00, gridY: 1.00, size: 3.5, variant: 0 },
            { type: 'vegetation', gridX: 50.00, gridY: 10.00, size: 3.5, variant: 0 },
            { type: 'vegetation', gridX: 56.00, gridY: 24.00, size: 3.5, variant: 3 },
            { type: 'vegetation', gridX: 48.00, gridY: 32.00, size: 3.5, variant: 3 },
            { type: 'vegetation', gridX: 44.00, gridY: 33.00, size: 3.5, variant: 3 },
            { type: 'vegetation', gridX: 57.00, gridY: 33.00, size: 3.5, variant: 3 },
            { type: 'vegetation', gridX: 58.00, gridY: 27.00, size: 3.5, variant: 3 },
            { type: 'vegetation', gridX: 52.00, gridY: 26.00, size: 3.5, variant: 3 },
            { type: 'vegetation', gridX: 54.00, gridY: 23.00, size: 3.5, variant: 3 },
            { type: 'vegetation', gridX: 57.00, gridY: 21.00, size: 3.5, variant: 3 },
            { type: 'vegetation', gridX: 58.00, gridY: 14.00, size: 3.5, variant: 3 },
            { type: 'vegetation', gridX: 53.00, gridY: 13.00, size: 3.5, variant: 3 },
            { type: 'vegetation', gridX: 58.00, gridY: 10.00, size: 3.5, variant: 3 },
            { type: 'vegetation', gridX: 54.00, gridY: 8.00, size: 3.5, variant: 3 },
            { type: 'vegetation', gridX: 58.00, gridY: 3.00, size: 3.5, variant: 3 },
            { type: 'vegetation', gridX: 49.00, gridY: 2.00, size: 3.5, variant: 3 },
            { type: 'vegetation', gridX: 48.00, gridY: 5.00, size: 3.5, variant: 3 },
            { type: 'vegetation', gridX: 44.00, gridY: 7.00, size: 3.5, variant: 3 },
            { type: 'vegetation', gridX: 38.00, gridY: 3.00, size: 3.5, variant: 3 },
            { type: 'vegetation', gridX: 33.00, gridY: 1.00, size: 3.5, variant: 3 },
            { type: 'vegetation', gridX: 36.00, gridY: 2.00, size: 3, variant: 3 },
            { type: 'vegetation', gridX: 54.00, gridY: 19.00, size: 3, variant: 3 },
            { type: 'vegetation', gridX: 56.00, gridY: 6.00, size: 3, variant: 3 },
            { type: 'vegetation', gridX: 41.00, gridY: 33.00, size: 3, variant: 3 },
            { type: 'vegetation', gridX: 45.00, gridY: 32.00, size: 3, variant: 0 },
            { type: 'vegetation', gridX: 52.00, gridY: 21.00, size: 3, variant: 0 },
            { type: 'vegetation', gridX: 52.00, gridY: 16.00, size: 3, variant: 0 },
            { type: 'vegetation', gridX: 56.00, gridY: 12.00, size: 3, variant: 0 },
            { type: 'vegetation', gridX: 56.00, gridY: 8.00, size: 3, variant: 0 },
            { type: 'vegetation', gridX: 47.00, gridY: 8.00, size: 3, variant: 0 },
            { type: 'vegetation', gridX: 41.00, gridY: 6.00, size: 3, variant: 0 },
            { type: 'vegetation', gridX: 29.00, gridY: 1.00, size: 3, variant: 0 },
            { type: 'vegetation', gridX: 31.00, gridY: 3.00, size: 3, variant: 0 },
            { type: 'vegetation', gridX: 34.00, gridY: 3.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 45.00, gridY: 4.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 51.00, gridY: 1.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 56.00, gridY: 4.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 52.00, gridY: 10.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 51.00, gridY: 19.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 42.00, gridY: 32.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 39.00, gridY: 33.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 54.00, gridY: 5.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 51.00, gridY: 4.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 56.00, gridY: 2.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 51.00, gridY: 14.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 47.00, gridY: 12.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 39.00, gridY: 6.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 26.00, gridY: 1.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 36.00, gridY: 33.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 56.00, gridY: 19.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 48.00, gridY: 9.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 46.00, gridY: 6.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 42.00, gridY: 2.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 35.00, gridY: 1.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 30.00, gridY: 3.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 44.00, gridY: 3.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 50.00, gridY: 13.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 54.00, gridY: 15.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 52.00, gridY: 8.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 50.00, gridY: 5.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 52.00, gridY: 2.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 53.00, gridY: 1.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 58.00, gridY: 18.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 54.00, gridY: 17.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 53.00, gridY: 18.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 58.00, gridY: 25.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 53.00, gridY: 25.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 52.00, gridY: 23.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 55.00, gridY: 33.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 43.00, gridY: 31.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 37.00, gridY: 31.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 40.00, gridY: 31.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 35.00, gridY: 30.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 34.00, gridY: 33.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 36.00, gridY: 29.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 38.00, gridY: 31.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 35.00, gridY: 32.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 50.00, gridY: 16.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 46.00, gridY: 9.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 37.00, gridY: 5.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 40.00, gridY: 5.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 28.00, gridY: 3.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 31.00, gridY: 1.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 24.00, gridY: 1.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 33.00, gridY: 5.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 55.00, gridY: 14.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 57.00, gridY: 12.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 55.00, gridY: 10.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 45.00, gridY: 2.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 46.00, gridY: 1.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 49.00, gridY: 4.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 49.00, gridY: 13.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 38.00, gridY: 29.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 33.00, gridY: 32.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 29.00, gridY: 33.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 0.00, gridY: 5.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 4.00, gridY: 4.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 10.00, gridY: 2.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 12.00, gridY: 0.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 7.00, gridY: 2.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 3.00, gridY: 3.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 2.00, gridY: 5.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 2.00, gridY: 1.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 15.00, gridY: 1.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 0.00, gridY: 8.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 5.00, gridY: 5.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 17.00, gridY: 1.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 8.00, gridY: 4.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 6.00, gridY: 3.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 2.00, gridY: 3.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 2.00, gridY: 7.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 4.00, gridY: 3.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 5.00, gridY: 1.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 9.00, gridY: 1.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 4.00, gridY: 6.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 9.00, gridY: 3.00, size: 2, variant: 3 }
        ];
    }

    createMeanderingPath(canvasWidth, canvasHeight) {
        const gridWidth = this.gridWidth || 60;
        const gridHeight = this.gridHeight || 33.75;

        const pathInGridCoords = [
            { gridX: 60.00, gridY: 31.00 },
            { gridX: 50.00, gridY: 30.00 },
            { gridX: 41.00, gridY: 25.00 },
            { gridX: 39.00, gridY: 17.00 },
            { gridX: 33.00, gridY: 9.00 },
            { gridX: 23.00, gridY: 6.00 },
            { gridX: 12.00, gridY: 7.00 },
            { gridX: 5.00, gridY: 12.00 },
            { gridX: 3.00, gridY: 19.00 },
            { gridX: 4.00, gridY: 26.00 },
            { gridX: 10.00, gridY: 30.00 },
            { gridX: 17.00, gridY: 31.00 },
            { gridX: 23.00, gridY: 27.00 },
            { gridX: 23.00, gridY: 21.00 },
            { gridX: 17.00, gridY: 21.00 },
            { gridX: 17.00, gridY: 25.00 }
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
            enemyCount: 12, 
            enemyHealth_multiplier: 1.0, 
            enemySpeed: 20, 
            spawnInterval: 0.6, 
            pattern: ['frog'] 
        }
        // Wave 2
        , { 
            enemyCount: 24, 
            enemyHealth_multiplier: 1.0, 
            enemySpeed: 60, 
            spawnInterval: 0.8, 
            pattern: ['archer'] 
        }
        // Wave 3
        , { 
            enemyCount: 35, 
            enemyHealth_multiplier: 1.5, 
            enemySpeed: 55, 
            spawnInterval: 0.8, 
            pattern: ['frog', 'villager', 'villager'] 
        }
        // Wave 4
        , { 
            enemyCount: 17, 
            enemyHealth_multiplier: 2, 
            enemySpeed: 65, 
            spawnInterval: 0.8, 
            pattern: ['beefyenemy', 'beefyenemy', 'frog', 'beefyenemy', 'beefyenemy'] 
        }
        // Wave 5
        , { 
            enemyCount: 55, 
            enemyHealth_multiplier: 1.5, 
            enemySpeed: 70, 
            spawnInterval: 0.7, 
            pattern: ['archer'] 
        }
        // Wave 6
        , { 
            enemyCount: 45, 
            enemyHealth_multiplier: 3.5, 
            enemySpeed: 75, 
            spawnInterval: 0.4, 
            pattern: ['frog'] 
        }
        // Wave 7
        , { 
            enemyCount: 5, 
            enemyHealth_multiplier: 3, 
            enemySpeed: 65, 
            spawnInterval: 0.7, 
            pattern: ['shieldknight', 'shieldknight', 'frog'] 
        }
        // Wave 8
        , { 
            enemyCount: 20, 
            enemyHealth_multiplier: 3.5, 
            enemySpeed: 65, 
            spawnInterval: 0.3, 
            pattern: ['beefyenemy', 'beefyenemy', 'beefyenemy', 'frog'] 
        }
        // Wave 9
        , { 
            enemyCount: 32, 
            enemyHealth_multiplier: 3, 
            enemySpeed: 55, 
            spawnInterval: 0.8, 
            pattern: ['beefyenemy', 'archer', 'shieldknight', 'frog', 'archer'] 
        }
        // Wave 10
        , { 
            enemyCount: 16, 
            enemyHealth_multiplier: 6, 
            enemySpeed: 55, 
            spawnInterval: 0.5, 
            pattern: ['beefyenemy', 'shieldknight', 'beefyenemy', 'frog', 'beefyenemy', 'shieldknight'] 
        }
        // Wave 11
        , { 
            enemyCount: 42, 
            enemyHealth_multiplier: 3, 
            enemySpeed: 85, 
            spawnInterval: 0.4, 
            pattern: ['archer', 'frog', 'archer', 'archer'] 
        }
        // Wave 12
        , { 
            enemyCount: 35, 
            enemyHealth_multiplier: 7, 
            enemySpeed: 55, 
            spawnInterval: 0.5, 
            pattern: ['mage', 'frog', 'frog', 'frog', 'frog', 'frog', 'frog', 'frog', 'frog', 'frog', 'frog', 'frog', 'frog', 'frog', 'frog', 'frog', 'frog', 'frog', 'frog', 'frog', 'frog', 'frog', 'frog', 'frog', 'frog', 'frog', 'frog', 'frog', 'frog', 'frog', 'frog', 'frog', 'frog', 'frog', 'frog'] 
        }
        ];

        if (wave > 0 && wave <= waveConfigs.length) {
            return waveConfigs[wave - 1];
        }
        
        return null;
    }
}