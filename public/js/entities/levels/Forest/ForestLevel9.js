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
            enemyCount: 35, 
            enemyHealth_multiplier: 1, 
            speedMultiplier: 0.90, 
            spawnInterval: 0.4, 
            pattern: ['basic', 'villager', 'villager'] 
        }
        // Wave 2
        , { 
            enemyCount: 40, 
            enemyHealth_multiplier: 1.5, 
            speedMultiplier: 0.90, 
            spawnInterval: 0.8, 
            pattern: ['basic', 'villager'] 
        }
        // Wave 3
        , { 
            enemyCount: 45, 
            enemyHealth_multiplier: 1.7, 
            speedMultiplier: 0.90, 
            spawnInterval: 0.7, 
            pattern: ['basic', 'villager', 'archer', 'beefyenemy', 'basic', 'villager', 'archer'] 
        }
        // Wave 4
        , { 
            enemyCount: 40, 
            enemyHealth_multiplier: 1.55, 
            speedMultiplier: 1.42, 
            spawnInterval: 0.9, 
            pattern: ['archer'] 
        }
        // Wave 5
        , { 
            enemyCount: 12, 
            enemyHealth_multiplier: 6, 
            speedMultiplier: 0.75, 
            spawnInterval: 0.6, 
            pattern: ['beefyenemy'] 
        }
        // Wave 6
        , { 
            enemyCount: 4, 
            enemyHealth_multiplier: 5, 
            speedMultiplier: 1.29, 
            spawnInterval: 1.8, 
            pattern: ['shieldknight'] 
        }
        // Wave 7
        , { 
            enemyCount: 6, 
            enemyHealth_multiplier: 3, 
            speedMultiplier: 1.29, 
            spawnInterval: 1.2, 
            pattern: ['shieldknight'] 
        }
        // Wave 8
        , { 
            enemyCount: 55, 
            enemyHealth_multiplier: 2, 
            speedMultiplier: 0.90, 
            spawnInterval: 0.5, 
            pattern: ['basic', 'archer', 'villager'] 
        }
        // Wave 9
        , { 
            enemyCount: 8, 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 1.29, 
            spawnInterval: 0.8, 
            pattern: ['shieldknight', 'beefyenemy', 'beefyenemy', 'shieldknight', 'beefyenemy'] 
        }
        // Wave 10
        , { 
            enemyCount: 35, 
            enemyHealth_multiplier: 3, 
            speedMultiplier: 2.58, 
            spawnInterval: 0.6, 
            pattern: ['archer'] 
        }
        // Wave 11
        , { 
            enemyCount: 45, 
            enemyHealth_multiplier: 5, 
            speedMultiplier: 0.90, 
            spawnInterval: 0.7, 
            pattern: ['basic', 'villager', 'villager', 'beefyenemy', 'villager', 'basic', 'beefyenemy', 'basic'] 
        }
        // Wave 12
        , { 
            enemyCount: 3, 
            enemyHealth_multiplier: 5, 
            speedMultiplier: 1.57, 
            spawnInterval: 0.4, 
            pattern: ['shieldknight'] 
        }
        // Wave 13
        , { 
            enemyCount: 23, 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 1.29, 
            spawnInterval: 0.8, 
            pattern: ['shieldknight', 'beefyenemy', 'archer', 'villager', 'beefyenemy', 'villager', 'beefyenemy', 'shieldknight', 'beefyenemy', 'archer'] 
        }
        // Wave 14
        , { 
            enemyCount: 64, 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 0.70, 
            spawnInterval: 0.6, 
            pattern: ['villager', 'basic'] 
        }
        // Wave 15
        , { 
            enemyCount: 23, 
            enemyHealth_multiplier: 5, 
            speedMultiplier: 0.75, 
            spawnInterval: 0.8, 
            pattern: ['beefyenemy'] 
        }
        // Wave 16
        , { 
            enemyCount: 1, 
            enemyHealth_multiplier: 8, 
            speedMultiplier: 0.88, 
            spawnInterval: 1.2, 
            pattern: ['knight'] 
        }
        // Wave 17
        , { 
            enemyCount: 45, 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 2.75, 
            spawnInterval: 0.4, 
            pattern: ['archer'] 
        }
        // Wave 18
        , { 
            enemyCount: 41, 
            enemyHealth_multiplier: 8, 
            speedMultiplier: 1.08, 
            spawnInterval: 0.7, 
            pattern: ['archer', 'villager', 'basic'] 
        }
        // Wave 19
        , { 
            enemyCount: 3, 
            enemyHealth_multiplier: 8, 
            speedMultiplier: 1.29, 
            spawnInterval: 0.7, 
            pattern: ['shieldknight'] 
        }
        // Wave 20
        , { 
            enemyCount: 4, 
            enemyHealth_multiplier: 8, 
            speedMultiplier: 0.88, 
            spawnInterval: 0.5, 
            pattern: ['knight', 'shieldknight', 'shieldknight', 'shieldknight'] 
        }
        ];

        if (wave > 0 && wave <= waveConfigs.length) {
            return waveConfigs[wave - 1];
        }
        
        return null;
    }
}