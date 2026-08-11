import { LevelBase } from '../LevelBase.js';

export class SpaceLevel2 extends LevelBase {
    static levelMetadata = {
        name: 'Bogg\'Rii',
        difficulty: 'Nightmare',
        order: 2,
        campaign: 'space'
    };

    constructor() {
        super();
        // Derive instance properties from static metadata
        this.levelName = SpaceLevel2.levelMetadata.name;
        this.levelNumber = SpaceLevel2.levelMetadata.order;
        this.difficulty = SpaceLevel2.levelMetadata.difficulty;
        this.campaign = SpaceLevel2.levelMetadata.campaign;
        this.maxWaves = 42;

        // Set terrain elements (prevent tower placement on these areas)
        this.terrainElements = [
            { type: 'rock', gridX: 8.00, gridY: 4.00, size: 1 },
            { type: 'rock', gridX: 18.00, gridY: 12.00, size: 1 },
            { type: 'rock', gridX: 28.00, gridY: 6.00, size: 1 },
            { type: 'rock', gridX: 42.00, gridY: 10.00, size: 1 },
            { type: 'rock', gridX: 52.00, gridY: 30.00, size: 1 },
            { type: 'rock', gridX: 10.00, gridY: 28.00, size: 1 },
            { type: 'rock', gridX: 55.00, gridY: 8.00, size: 1 },
            { type: 'vegetation', gridX: 6.00, gridY: 22.00, size: 1.1 },
            { type: 'vegetation', gridX: 22.00, gridY: 20.00, size: 1 },
            { type: 'vegetation', gridX: 38.00, gridY: 32.00, size: 1.2 },
            { type: 'vegetation', gridX: 48.00, gridY: 22.00, size: 1.1 },
            { type: 'vegetation', gridX: 15.00, gridY: 5.00, size: 1 },
            { type: 'vegetation', gridX: 45.00, gridY: 28.00, size: 1.3 },
            { type: 'vegetation', gridX: 12.00, gridY: 8.00, size: 1 },
            { type: 'vegetation', gridX: 30.00, gridY: 18.00, size: 1.2 },
            { type: 'vegetation', gridX: 50.00, gridY: 5.00, size: 1.1 },
            { type: 'vegetation', gridX: 24.00, gridY: 30.00, size: 1 },
            { type: 'vegetation', gridX: 40.00, gridY: 14.00, size: 1.2 },
            { type: 'water', gridX: 51.00, gridY: 7.00, size: 2, waterType: 'lake' },
            { type: 'water', gridX: 4.00, gridY: 26.00, size: 2, waterType: 'lake' },
            { type: 'water', gridX: 24.00, gridY: 13.00, size: 2, waterType: 'lake' }
        ];
    }

    createMeanderingPath(canvasWidth, canvasHeight) {
        const gridWidth = this.gridWidth || 60;
        const gridHeight = this.gridHeight || 33.75;

        const pathInGridCoords = [
            { gridX: 0.00, gridY: 17.00 },
            { gridX: 12.00, gridY: 17.00 },
            { gridX: 24.00, gridY: 8.00 },
            { gridX: 36.00, gridY: 25.00 },
            { gridX: 48.00, gridY: 17.00 },
            { gridX: 60.00, gridY: 17.00 }
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
            enemyHealth_multiplier: 1.28, 
            speedMultiplier: 1, 
            spawnInterval: 1.14, 
            pattern: [{ type: 'basic', count: 8 }, { type: 'basic', count: 10, healthMultiplier: 1.5 }, { type: 'villager', count: 6, healthMultiplier: 1.3 }] 
        }
        // Wave 2
        , { 
            enemyHealth_multiplier: 1.42, 
            speedMultiplier: 1, 
            spawnInterval: 0.86, 
            pattern: [{ type: 'frog', count: 7 }, { type: 'frog', count: 8, healthMultiplier: 2, speedMultiplier: 1.2 }, { type: 'frog', count: 9, healthMultiplier: 3 }] 
        }
        // Wave 3
        , { 
            enemyHealth_multiplier: 1.56, 
            speedMultiplier: 1, 
            spawnInterval: 0.68, 
            pattern: [{ type: 'beefyenemy', count: 7 }] 
        }
        // Wave 4
        , { 
            enemyHealth_multiplier: 1.71, 
            speedMultiplier: 1, 
            spawnInterval: 0.96, 
            pattern: [{ type: 'basic', count: 8, healthMultiplier: 1.8, speedMultiplier: 0.6 }, { type: 'villager', count: 10, healthMultiplier: 1.8 }, { type: 'archer', count: 3, speedMultiplier: 1.5 }] 
        }
        // Wave 5
        , { 
            enemyHealth_multiplier: 1.85, 
            speedMultiplier: 1, 
            spawnInterval: 0.78, 
            pattern: [{ type: 'archer', count: 7, healthMultiplier: 2.5, speedMultiplier: 1.1 }, { type: 'frog', count: 10, healthMultiplier: 1.8 }, { type: 'shieldknight', count: 2, healthMultiplier: 2 }, { type: 'archer', count: 3, healthMultiplier: 3, speedMultiplier: 1.5 }] 
        }
        // Wave 6
        , { 
            enemyHealth_multiplier: 1.99, 
            speedMultiplier: 1, 
            spawnInterval: 0.88, 
            pattern: [{ type: 'mage', count: 1, healthMultiplier: 2 }, { type: 'frog', count: 11 }] 
        }
        // Wave 7
        , { 
            enemyHealth_multiplier: 2.13, 
            speedMultiplier: 1.2, 
            spawnInterval: 0.78, 
            pattern: [{ type: 'villager', count: 10 }, { type: 'basic', count: 8 }, { type: 'archer', count: 10, speedMultiplier: 1.2 }] 
        }
        // Wave 8
        , { 
            enemyHealth_multiplier: 2.28, 
            speedMultiplier: 1, 
            spawnInterval: 1.95, 
            pattern: [{ type: 'beefyenemy', count: 4 }, { type: 'knight', count: 2 }] 
        }
        // Wave 9
        , { 
            enemyHealth_multiplier: 2.42, 
            speedMultiplier: 1.2, 
            spawnInterval: 0.58, 
            pattern: [{ type: 'basic', count: 11 }, { type: 'villager', count: 9 }, { type: 'frog', count: 8, healthMultiplier: 2, speedMultiplier: 1.3 }] 
        }
        // Wave 10
        , { 
            enemyHealth_multiplier: 2.56, 
            speedMultiplier: 0.8, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'shieldknight', count: 9 }, { type: 'frog', count: 3 }] 
        }
        // Wave 11
        , { 
            enemyHealth_multiplier: 2.65, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'beefyenemy', count: 9, healthMultiplier: 3 }, { type: 'frog', count: 14 }, { type: 'mage', count: 3, healthMultiplier: 2 }, { type: 'villager', count: 11 }, { type: 'basic', count: 10 }, { type: 'shieldknight', count: 6 }, { type: 'archer', count: 9, healthMultiplier: 3, speedMultiplier: 2 }] 
        }
        // Wave 12
        , { 
            enemyHealth_multiplier: 2.74, 
            speedMultiplier: 1, 
            spawnInterval: 0.82, 
            pattern: [{ type: 'frog', count: 9 }, { type: 'frog', count: 10, healthMultiplier: 2, speedMultiplier: 1.2 }, { type: 'frog', count: 11, healthMultiplier: 3 }] 
        }
        // Wave 13
        , { 
            enemyHealth_multiplier: 2.83, 
            speedMultiplier: 0.9, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'knight', count: 4, healthMultiplier: 2.5 }, { type: 'shieldknight', count: 7, healthMultiplier: 2 }, { type: 'frog', count: 12, speedMultiplier: 1.3 }, { type: 'archer', count: 11, speedMultiplier: 1.4 }, { type: 'beefyenemy', count: 8 }, { type: 'basic', count: 8 }] 
        }
        // Wave 14
        , { 
            enemyHealth_multiplier: 2.92, 
            speedMultiplier: 1, 
            spawnInterval: 0.66, 
            pattern: [{ type: 'beefyenemy', count: 9 }, { type: 'frog', count: 3 }] 
        }
        // Wave 15
        , { 
            enemyHealth_multiplier: 3.01, 
            speedMultiplier: 1, 
            spawnInterval: 0.76, 
            pattern: [{ type: 'archer', count: 9, healthMultiplier: 2.5, speedMultiplier: 1.1 }, { type: 'frog', count: 13, healthMultiplier: 1.8 }, { type: 'shieldknight', count: 4, healthMultiplier: 2 }, { type: 'archer', count: 5, healthMultiplier: 3, speedMultiplier: 1.5 }] 
        }
        // Wave 16
        , { 
            enemyHealth_multiplier: 3.1, 
            speedMultiplier: 1, 
            spawnInterval: 1, 
            pattern: [{ type: 'mage', count: 6, speedMultiplier: 0.6 }, { type: 'frog', count: 11, speedMultiplier: 1.2 }] 
        }
        // Wave 17
        , { 
            enemyHealth_multiplier: 3.19, 
            speedMultiplier: 1, 
            spawnInterval: 1, 
            pattern: [{ type: 'knight', count: 3, healthMultiplier: 3 }, { type: 'shieldknight', count: 4, healthMultiplier: 2 }, { type: 'mage', count: 3, healthMultiplier: 2 }, { type: 'shieldknight', count: 3, healthMultiplier: 4 }, { type: 'frog', count: 4 }] 
        }
        // Wave 18
        , { 
            enemyHealth_multiplier: 3.28, 
            speedMultiplier: 1, 
            spawnInterval: 11.9, 
            pattern: [{ type: 'knight', count: 5 }, { type: 'frog', count: 4 }] 
        }
        // Wave 19
        , { 
            enemyHealth_multiplier: 3.37, 
            speedMultiplier: 1.1, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'shieldknight', count: 6, healthMultiplier: 3 }, { type: 'mage', count: 4 }, { type: 'basic', count: 15 }, { type: 'shieldknight', count: 5, healthMultiplier: 4 }, { type: 'beefyenemy', count: 13, healthMultiplier: 2 }, { type: 'mage', count: 4 }, { type: 'frog', count: 22 }, { type: 'archer', count: 14, healthMultiplier: 5, speedMultiplier: 1.5 }, { type: 'shieldknight', count: 4, healthMultiplier: 6 }] 
        }
        // Wave 20
        , { 
            enemyHealth_multiplier: 3.46, 
            speedMultiplier: 1, 
            spawnInterval: 4.7, 
            pattern: [{ type: 'firefrog', count: 1 }, { type: 'airfrog', count: 1 }, { type: 'firefrog', count: 1 }, { type: 'airfrog', count: 1 }] 
        }
        // Wave 21
        , { 
            enemyHealth_multiplier: 3.55, 
            speedMultiplier: 1, 
            spawnInterval: 4.4, 
            pattern: [{ type: 'waterfrog', count: 3 }, { type: 'earthfrog', count: 3 }, { type: 'waterfrog', count: 3 }, { type: 'earthfrog', count: 3 }] 
        }
        // Wave 22
        , { 
            enemyHealth_multiplier: 3.64, 
            speedMultiplier: 1, 
            spawnInterval: 0.78, 
            pattern: [{ type: 'frog', count: 14 }, { type: 'frog', count: 15, healthMultiplier: 2, speedMultiplier: 1.2 }, { type: 'frog', count: 16, healthMultiplier: 3 }] 
        }
        // Wave 23
        , { 
            enemyHealth_multiplier: 3.73, 
            speedMultiplier: 1.3, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'archer', count: 17 }, { type: 'basic', count: 20 }, { type: 'villager', count: 18 }, { type: 'frog', count: 4 }] 
        }
        // Wave 24
        , { 
            enemyHealth_multiplier: 3.82, 
            speedMultiplier: 1.7, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'archer', count: 15 }, { type: 'frog', count: 4 }] 
        }
        // Wave 25
        , { 
            enemyHealth_multiplier: 3.91, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'mage', count: 1 }, { type: 'waterfrog', count: 1 }] 
        }
        // Wave 26
        , { 
            enemyHealth_multiplier: 3.99, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'beefyenemy', count: 10, healthMultiplier: 3 }, { type: 'frog', count: 22 }, { type: 'mage', count: 4, healthMultiplier: 2 }, { type: 'villager', count: 12 }, { type: 'basic', count: 11 }, { type: 'shieldknight', count: 7 }, { type: 'archer', count: 10, healthMultiplier: 3, speedMultiplier: 2 }] 
        }
        // Wave 27
        , { 
            enemyHealth_multiplier: 4.08, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'waterfrog', count: 1 }, { type: 'earthfrog', count: 1 }, { type: 'firefrog', count: 1 }] 
        }
        // Wave 28
        , { 
            enemyHealth_multiplier: 4.17, 
            speedMultiplier: 0.9, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'knight', count: 5, healthMultiplier: 2.5 }, { type: 'shieldknight', count: 8, healthMultiplier: 2 }, { type: 'frog', count: 20, speedMultiplier: 1.3 }, { type: 'archer', count: 12, speedMultiplier: 1.4 }, { type: 'beefyenemy', count: 9 }, { type: 'basic', count: 9 }] 
        }
        // Wave 29
        , { 
            enemyHealth_multiplier: 4.26, 
            speedMultiplier: 1, 
            spawnInterval: 4.1, 
            pattern: [{ type: 'firefrog', count: 4 }, { type: 'waterfrog', count: 4 }, { type: 'firefrog', count: 4 }, { type: 'waterfrog', count: 4 }] 
        }
        // Wave 30
        , { 
            enemyHealth_multiplier: 4.35, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'firefrog', count: 1 }] 
        }
        // Wave 31
        , { 
            enemyHealth_multiplier: 4.44, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'beefyenemy', count: 11, healthMultiplier: 3 }, { type: 'frog', count: 27 }, { type: 'mage', count: 5, healthMultiplier: 2 }, { type: 'villager', count: 13 }, { type: 'basic', count: 12 }, { type: 'shieldknight', count: 8 }, { type: 'archer', count: 11, healthMultiplier: 3, speedMultiplier: 2 }] 
        }
        // Wave 32
        , { 
            enemyHealth_multiplier: 4.53, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'mage', count: 1 }, { type: 'airfrog', count: 1 }] 
        }
        // Wave 33
        , { 
            enemyHealth_multiplier: 4.62, 
            speedMultiplier: 1.4, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'archer', count: 18 }, { type: 'basic', count: 21 }, { type: 'villager', count: 19 }, { type: 'frog', count: 5 }] 
        }
        // Wave 34
        , { 
            enemyHealth_multiplier: 4.71, 
            speedMultiplier: 1.7, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'archer', count: 16 }, { type: 'frog', count: 5 }] 
        }
        // Wave 35
        , { 
            enemyHealth_multiplier: 4.8, 
            speedMultiplier: 1, 
            spawnInterval: 0.72, 
            pattern: [{ type: 'archer', count: 11, healthMultiplier: 2.5, speedMultiplier: 1.1 }, { type: 'frog', count: 25, healthMultiplier: 1.8 }, { type: 'shieldknight', count: 6, healthMultiplier: 2 }, { type: 'archer', count: 7, healthMultiplier: 3, speedMultiplier: 1.5 }] 
        }
        // Wave 36
        , { 
            enemyHealth_multiplier: 4.89, 
            speedMultiplier: 1.1, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'shieldknight', count: 7, healthMultiplier: 3 }, { type: 'mage', count: 5 }, { type: 'basic', count: 16 }, { type: 'shieldknight', count: 6, healthMultiplier: 4 }, { type: 'beefyenemy', count: 14, healthMultiplier: 2 }, { type: 'mage', count: 5 }, { type: 'frog', count: 33 }, { type: 'archer', count: 15, healthMultiplier: 5, speedMultiplier: 1.5 }, { type: 'shieldknight', count: 5, healthMultiplier: 6 }] 
        }
        // Wave 37
        , { 
            enemyHealth_multiplier: 4.98, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'earthfrog', count: 1 }] 
        }
        // Wave 38
        , { 
            enemyHealth_multiplier: 5.07, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'waterfrog', count: 1 }, { type: 'airfrog', count: 1 }, { type: 'earthfrog', count: 1 }] 
        }
        // Wave 39
        , { 
            enemyHealth_multiplier: 5.16, 
            speedMultiplier: 0.9, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'ramcart', count: 6, healthMultiplier: 2.5 }, { type: 'shieldknight', count: 9, healthMultiplier: 2 }, { type: 'frog', count: 27, speedMultiplier: 1.3 }, { type: 'archer', count: 13, speedMultiplier: 1.4 }, { type: 'beefyenemy', count: 10 }, { type: 'basic', count: 10 }] 
        }
        // Wave 40
        , { 
            enemyHealth_multiplier: 5.25, 
            speedMultiplier: 1, 
            spawnInterval: 3.8, 
            pattern: [{ type: 'airfrog', count: 5 }, { type: 'earthfrog', count: 5 }, { type: 'airfrog', count: 5 }, { type: 'earthfrog', count: 5 }] 
        }
        // Wave 41
        , { 
            enemyHealth_multiplier: 14.13, 
            speedMultiplier: 1.1, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'shieldknight', count: 8, healthMultiplier: 3 }, { type: 'mage', count: 6 }, { type: 'villager', count: 17 }, { type: 'shieldknight', count: 7, healthMultiplier: 4 }, { type: 'beefyenemy', count: 15, healthMultiplier: 2 }, { type: 'mage', count: 6 }, { type: 'frog', count: 38 }, { type: 'archer', count: 16, healthMultiplier: 5, speedMultiplier: 1.5 }, { type: 'shieldknight', count: 6, healthMultiplier: 6 }] 
        }
        // Wave 42
        , { 
            enemyHealth_multiplier: 8.29, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'beefyenemy', count: 12, healthMultiplier: 3 }, { type: 'frog', count: 35 }, { type: 'mage', count: 6, healthMultiplier: 2 }, { type: 'basic', count: 14 }, { type: 'villager', count: 13 }, { type: 'shieldknight', count: 9 }, { type: 'archer', count: 12, healthMultiplier: 3, speedMultiplier: 2 }] 
        }
        ];

        if (wave > 0 && wave <= waveConfigs.length) {
            return waveConfigs[wave - 1];
        }
        
        return null;
    }
}