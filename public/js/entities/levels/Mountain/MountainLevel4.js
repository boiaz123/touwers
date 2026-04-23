import { LevelBase } from '../LevelBase.js';

export class MountainLevel4 extends LevelBase {
    static levelMetadata = {
        name: 'Depth\'s of Despair',
        difficulty: 'Medium',
        order: 4,
        campaign: 'mountain'
    };

    constructor() {
        super();
        // Derive instance properties from static metadata
        this.levelName = MountainLevel4.levelMetadata.name;
        this.levelNumber = MountainLevel4.levelMetadata.order;
        this.difficulty = MountainLevel4.levelMetadata.difficulty;
        this.campaign = MountainLevel4.levelMetadata.campaign;
        this.maxWaves = 27;

        // Set terrain elements (prevent tower placement on these areas)
        this.terrainElements = [
            // Add terrain elements using the designer
        ];
    }

    createMeanderingPath(canvasWidth, canvasHeight) {
        const gridWidth = this.gridWidth || 60;
        const gridHeight = this.gridHeight || 33.75;

        const pathInGridCoords = [
            { gridX: 48.00, gridY: 34.00 },
            { gridX: 48.00, gridY: 26.00 },
            { gridX: 34.00, gridY: 26.00 },
            { gridX: 34.00, gridY: 21.00 },
            { gridX: 34.00, gridY: 20.00 },
            { gridX: 48.00, gridY: 20.00 },
            { gridX: 48.00, gridY: 13.00 },
            { gridX: 25.00, gridY: 13.00 },
            { gridX: 25.00, gridY: 30.00 }
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
            enemyHealth_multiplier: 1.1, 
            speedMultiplier: 0.75, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'archer', count: 4 }, { type: 'villager', count: 4 }, { type: 'basic', count: 4 }] 
        }
        // Wave 2
        , { 
            enemyHealth_multiplier: 1.3, 
            speedMultiplier: 0.75, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'archer', count: 6 }, { type: 'villager', count: 6 }, { type: 'basic', count: 5 }] 
        }
        // Wave 3
        , { 
            enemyHealth_multiplier: 1.4, 
            speedMultiplier: 0.67, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'archer', count: 30 }] 
        }
        // Wave 4
        , { 
            enemyHealth_multiplier: 1, 
            speedMultiplier: 1, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'beefyenemy', count: 10 }] 
        }
        // Wave 5
        , { 
            enemyHealth_multiplier: 1.2, 
            speedMultiplier: 1.2, 
            spawnInterval: 1, 
            pattern: [{ type: 'archer', count: 17 }] 
        }
        // Wave 6
        , { 
            enemyHealth_multiplier: 1.5, 
            speedMultiplier: 0.75, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'beefyenemy', count: 6 }] 
        }
        // Wave 7
        , { 
            enemyHealth_multiplier: 1.5, 
            speedMultiplier: 0.78, 
            spawnInterval: 1, 
            pattern: [{ type: 'mage', count: 1 }] 
        }
        // Wave 8
        , { 
            enemyHealth_multiplier: 1.5, 
            speedMultiplier: 1, 
            spawnInterval: 1.4, 
            pattern: [{ type: 'shieldknight', count: 8 }] 
        }
        // Wave 9
        , { 
            enemyHealth_multiplier: 1.3, 
            speedMultiplier: 0.67, 
            spawnInterval: 0.3, 
            pattern: [{ type: 'archer', count: 12 }, { type: 'villager', count: 12 }, { type: 'basic', count: 12 }] 
        }
        // Wave 10
        , { 
            enemyHealth_multiplier: 1.3, 
            speedMultiplier: 0.75, 
            spawnInterval: 0.3, 
            pattern: [{ type: 'archer', count: 15 }, { type: 'villager', count: 15 }, { type: 'basic', count: 15 }] 
        }
        // Wave 11
        , { 
            enemyHealth_multiplier: 1.5, 
            speedMultiplier: 1.42, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'archer', count: 35 }] 
        }
        // Wave 12
        , { 
            enemyHealth_multiplier: 1.3, 
            speedMultiplier: 0.6, 
            spawnInterval: 0.3, 
            pattern: [{ type: 'beefyenemy', count: 4 }, { type: 'knight', count: 2 }, { type: 'shieldknight', count: 1 }] 
        }
        // Wave 13
        , { 
            enemyHealth_multiplier: 2.7, 
            speedMultiplier: 0.78, 
            spawnInterval: 0.3, 
            pattern: [{ type: 'mage', count: 1 }] 
        }
        // Wave 14
        , { 
            enemyHealth_multiplier: 2, 
            speedMultiplier: 0.75, 
            spawnInterval: 0.4, 
            pattern: [{ type: 'beefyenemy', count: 12 }] 
        }
        // Wave 15
        , { 
            enemyHealth_multiplier: 1.8, 
            speedMultiplier: 1.43, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'knight', count: 3 }] 
        }
        // Wave 16
        , { 
            enemyHealth_multiplier: 2.7, 
            speedMultiplier: 1, 
            spawnInterval: 0.5, 
            pattern: [{ type: 'knight', count: 3 }] 
        }
        // Wave 17
        , { 
            enemyHealth_multiplier: 1.5, 
            speedMultiplier: 1.27, 
            spawnInterval: 0.5, 
            pattern: [{ type: 'frog', count: 37 }] 
        }
        // Wave 18
        , { 
            enemyHealth_multiplier: 1.6, 
            speedMultiplier: 0.75, 
            spawnInterval: 0.2, 
            pattern: [{ type: 'archer', count: 17 }, { type: 'villager', count: 16 }, { type: 'basic', count: 16 }] 
        }
        // Wave 19
        , { 
            enemyHealth_multiplier: 1.8, 
            speedMultiplier: 1.3, 
            spawnInterval: 0.5, 
            pattern: [{ type: 'archer', count: 45 }] 
        }
        // Wave 20
        , { 
            enemyHealth_multiplier: 2.2, 
            speedMultiplier: 1.13, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'knight', count: 1 }, { type: 'mage', count: 1 }, { type: 'shieldknight', count: 1 }] 
        }
        // Wave 21
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 0.78, 
            spawnInterval: 1, 
            pattern: [{ type: 'mage', count: 1 }] 
        }
        // Wave 22
        , { 
            enemyHealth_multiplier: 5, 
            speedMultiplier: 0.55, 
            spawnInterval: 1, 
            pattern: [{ type: 'knight', count: 1 }] 
        }
        // Wave 23
        , { 
            enemyHealth_multiplier: 4.5, 
            speedMultiplier: 1, 
            spawnInterval: 0.3, 
            pattern: [{ type: 'mage', count: 1 }, { type: 'frog', count: 19 }] 
        }
        // Wave 24
        , { 
            enemyHealth_multiplier: 4.5, 
            speedMultiplier: 1, 
            spawnInterval: 0.3, 
            pattern: [{ type: 'mage', count: 1 }, { type: 'frog', count: 19 }] 
        }
        // Wave 25
        , { 
            enemyHealth_multiplier: 4.5, 
            speedMultiplier: 1, 
            spawnInterval: 0.3, 
            pattern: [{ type: 'mage', count: 1 }, { type: 'frog', count: 19 }] 
        }
        // Wave 26
        , { 
            enemyHealth_multiplier: 4.5, 
            speedMultiplier: 1, 
            spawnInterval: 0.3, 
            pattern: [{ type: 'mage', count: 1 }, { type: 'frog', count: 19 }] 
        }
        // Wave 27
        , { 
            enemyHealth_multiplier: 4.5, 
            speedMultiplier: 1, 
            spawnInterval: 0.3, 
            pattern: [{ type: 'mage', count: 1 }, { type: 'frog', count: 19 }] 
        }
        ];

        if (wave > 0 && wave <= waveConfigs.length) {
            return waveConfigs[wave - 1];
        }
        
        return null;
    }
}