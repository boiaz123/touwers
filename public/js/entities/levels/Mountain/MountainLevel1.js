import { LevelBase } from '../LevelBase.js';

export class MountainLevel1 extends LevelBase {
    static levelMetadata = {
        name: 'Anglor Pass',
        difficulty: 'Medium',
        order: 1,
        campaign: 'mountain'
    };

    constructor() {
        super();
        // Derive instance properties from static metadata
        this.levelName = MountainLevel1.levelMetadata.name;
        this.levelNumber = MountainLevel1.levelMetadata.order;
        this.difficulty = MountainLevel1.levelMetadata.difficulty;
        this.campaign = MountainLevel1.levelMetadata.campaign;
        this.maxWaves = 21;

        // Set terrain elements (prevent tower placement on these areas)
        this.terrainElements = [
            { type: 'water', gridX: 12.00, gridY: 34.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 12.00, gridY: 33.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 11.00, gridY: 32.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 11.00, gridY: 31.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 11.00, gridY: 30.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 10.00, gridY: 29.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 10.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 9.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 9.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 9.00, gridY: 25.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 9.00, gridY: 25.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 8.00, gridY: 25.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 8.00, gridY: 24.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 8.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 8.00, gridY: 22.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 8.00, gridY: 21.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 8.00, gridY: 20.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 7.00, gridY: 19.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 7.00, gridY: 19.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 7.00, gridY: 19.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 7.00, gridY: 18.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 7.00, gridY: 17.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 8.00, gridY: 16.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 8.00, gridY: 15.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 8.00, gridY: 14.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 8.00, gridY: 13.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 8.00, gridY: 12.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 8.00, gridY: 12.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 9.00, gridY: 12.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 9.00, gridY: 11.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 10.00, gridY: 10.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 10.00, gridY: 9.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 10.00, gridY: 8.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 10.00, gridY: 8.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 10.00, gridY: 7.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 11.00, gridY: 7.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 11.00, gridY: 6.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 11.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 11.00, gridY: 4.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 11.00, gridY: 3.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 11.00, gridY: 3.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 11.00, gridY: 2.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 11.00, gridY: 2.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 11.00, gridY: 1.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 11.00, gridY: 0.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 50.00, gridY: 28.00, size: 4, waterType: 'lake' },
            { type: 'vegetation', gridX: 52.00, gridY: 27.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 50.00, gridY: 31.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 48.00, gridY: 26.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 55.00, gridY: 28.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 44.00, gridY: 32.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 48.00, gridY: 33.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 56.00, gridY: 33.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 57.00, gridY: 26.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 54.00, gridY: 24.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 45.00, gridY: 29.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 37.00, gridY: 32.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 33.00, gridY: 33.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 40.00, gridY: 29.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 6.00, gridY: 25.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 6.00, gridY: 23.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 3.00, gridY: 25.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 6.00, gridY: 32.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 9.00, gridY: 33.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 3.00, gridY: 33.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 2.00, gridY: 32.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 1.00, gridY: 30.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 1.00, gridY: 25.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 0.00, gridY: 22.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 1.00, gridY: 19.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 4.00, gridY: 17.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 2.00, gridY: 14.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 1.00, gridY: 13.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 1.00, gridY: 9.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 3.00, gridY: 7.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 2.00, gridY: 5.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 1.00, gridY: 3.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 2.00, gridY: 1.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 6.00, gridY: 1.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 5.00, gridY: 4.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 14.00, gridY: 1.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 16.00, gridY: 0.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 19.00, gridY: 1.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 16.00, gridY: 2.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 14.00, gridY: 4.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 41.00, gridY: 33.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 47.00, gridY: 31.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 57.00, gridY: 30.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 56.00, gridY: 24.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 59.00, gridY: 23.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 54.00, gridY: 31.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 53.00, gridY: 25.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 56.00, gridY: 21.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 59.00, gridY: 28.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 53.00, gridY: 32.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 42.00, gridY: 33.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 38.00, gridY: 32.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 34.00, gridY: 33.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 43.00, gridY: 30.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 46.00, gridY: 26.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 54.00, gridY: 22.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 36.00, gridY: 30.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 30.00, gridY: 32.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 41.00, gridY: 31.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 44.00, gridY: 27.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 51.00, gridY: 24.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 59.00, gridY: 21.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 59.00, gridY: 33.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 59.00, gridY: 31.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 57.00, gridY: 32.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 46.00, gridY: 32.00, size: 3, variant: 1 },
            { type: 'vegetation', gridX: 55.00, gridY: 26.00, size: 3, variant: 1 },
            { type: 'vegetation', gridX: 59.00, gridY: 19.00, size: 3, variant: 1 },
            { type: 'vegetation', gridX: 57.00, gridY: 20.00, size: 3, variant: 1 },
            { type: 'vegetation', gridX: 58.00, gridY: 15.00, size: 1.5, variant: 1 },
            { type: 'vegetation', gridX: 58.00, gridY: 24.00, size: 1.5, variant: 1 },
            { type: 'vegetation', gridX: 59.00, gridY: 26.00, size: 1.5, variant: 1 },
            { type: 'vegetation', gridX: 55.00, gridY: 29.00, size: 1.5, variant: 1 },
            { type: 'vegetation', gridX: 46.00, gridY: 30.00, size: 1.5, variant: 1 },
            { type: 'vegetation', gridX: 40.00, gridY: 32.00, size: 1.5, variant: 1 },
            { type: 'vegetation', gridX: 60.00, gridY: 14.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 59.00, gridY: 11.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 58.00, gridY: 13.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 56.00, gridY: 17.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 53.00, gridY: 19.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 58.00, gridY: 7.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 59.00, gridY: 5.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 58.00, gridY: 1.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 56.00, gridY: 0.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 54.00, gridY: 2.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 56.00, gridY: 4.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 57.00, gridY: 3.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 59.00, gridY: 3.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 52.00, gridY: 2.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 54.00, gridY: 5.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 55.00, gridY: 2.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 56.00, gridY: 8.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 59.00, gridY: 9.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 57.00, gridY: 11.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 58.00, gridY: 5.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 51.00, gridY: 3.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 50.00, gridY: 1.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 18.00, gridY: 2.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 16.00, gridY: 5.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 13.00, gridY: 8.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 12.00, gridY: 11.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 21.00, gridY: 3.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 23.00, gridY: 1.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 19.00, gridY: 4.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 9.00, gridY: 6.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 9.00, gridY: 4.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 5.00, gridY: 6.00, size: 2, variant: 1 },
            { type: 'rock', gridX: 31.00, gridY: 33.00, size: 2, variant: 0 },
            { type: 'rock', gridX: 56.00, gridY: 6.00, size: 2, variant: 0 },
            { type: 'rock', gridX: 49.00, gridY: 2.00, size: 2, variant: 0 },
            { type: 'rock', gridX: 46.00, gridY: 28.00, size: 2, variant: 1 },
            { type: 'rock', gridX: 55.00, gridY: 20.00, size: 2, variant: 1 },
            { type: 'rock', gridX: 58.00, gridY: 17.00, size: 2, variant: 1 },
            { type: 'rock', gridX: 54.00, gridY: 7.00, size: 2, variant: 1 },
            { type: 'rock', gridX: 8.00, gridY: 8.00, size: 2, variant: 1 },
            { type: 'rock', gridX: 49.00, gridY: 25.00, size: 3, variant: 1 },
            { type: 'rock', gridX: 7.00, gridY: 33.00, size: 3, variant: 2 },
            { type: 'rock', gridX: 56.00, gridY: 10.00, size: 2, variant: 2 },
            { type: 'rock', gridX: 17.00, gridY: 4.00, size: 2, variant: 2 },
            { type: 'rock', gridX: 42.00, gridY: 28.00, size: 2, variant: 3 },
            { type: 'rock', gridX: 55.00, gridY: 4.00, size: 2.5, variant: 3 }
        ];
    }

    createMeanderingPath(canvasWidth, canvasHeight) {
        const gridWidth = this.gridWidth || 60;
        const gridHeight = this.gridHeight || 33.75;

        const pathInGridCoords = [
            { gridX: 0.00, gridY: 28.00 },
            { gridX: 18.00, gridY: 28.00 },
            { gridX: 18.00, gridY: 18.00 },
            { gridX: 31.00, gridY: 18.00 },
            { gridX: 31.00, gridY: 13.00 },
            { gridX: 37.00, gridY: 13.00 },
            { gridX: 37.00, gridY: 16.00 },
            { gridX: 43.00, gridY: 16.00 },
            { gridX: 43.00, gridY: 4.00 }
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
            enemyHealth_multiplier: 1.1, 
            speedMultiplier: 0.75, 
            spawnInterval: 0.9, 
            pattern: ['archer', 'villager', 'basic'] 
        }
        // Wave 2
        , { 
            enemyCount: 17, 
            enemyHealth_multiplier: 1.3, 
            speedMultiplier: 0.75, 
            spawnInterval: 0.8, 
            pattern: ['archer', 'villager', 'basic'] 
        }
        // Wave 3
        , { 
            enemyCount: 23, 
            enemyHealth_multiplier: 1.3, 
            speedMultiplier: 0.67, 
            spawnInterval: 0.7, 
            pattern: ['archer', 'villager', 'basic'] 
        }
        // Wave 4
        , { 
            enemyCount: 25, 
            enemyHealth_multiplier: 1.3, 
            speedMultiplier: 0.67, 
            spawnInterval: 0.4, 
            pattern: ['archer', 'villager', 'basic'] 
        }
        // Wave 5
        , { 
            enemyCount: 17, 
            enemyHealth_multiplier: 1.2, 
            speedMultiplier: 1.42, 
            spawnInterval: 1, 
            pattern: ['archer'] 
        }
        // Wave 6
        , { 
            enemyCount: 6, 
            enemyHealth_multiplier: 1.2, 
            speedMultiplier: 0.75, 
            spawnInterval: 0.6, 
            pattern: ['beefyenemy'] 
        }
        // Wave 7
        , { 
            enemyCount: 3, 
            enemyHealth_multiplier: 1.5, 
            speedMultiplier: 0.78, 
            spawnInterval: 1, 
            pattern: ['mage'] 
        }
        // Wave 8
        , { 
            enemyCount: 25, 
            enemyHealth_multiplier: 1.5, 
            speedMultiplier: 1.18, 
            spawnInterval: 0.7, 
            pattern: ['frog'] 
        }
        // Wave 9
        , { 
            enemyCount: 36, 
            enemyHealth_multiplier: 1.3, 
            speedMultiplier: 0.67, 
            spawnInterval: 0.3, 
            pattern: ['archer', 'villager', 'basic'] 
        }
        // Wave 10
        , { 
            enemyCount: 45, 
            enemyHealth_multiplier: 1.3, 
            speedMultiplier: 0.75, 
            spawnInterval: 0.3, 
            pattern: ['archer', 'villager', 'basic'] 
        }
        // Wave 11
        , { 
            enemyCount: 35, 
            enemyHealth_multiplier: 1.5, 
            speedMultiplier: 1.42, 
            spawnInterval: 0.6, 
            pattern: ['archer'] 
        }
        // Wave 12
        , { 
            enemyCount: 7, 
            enemyHealth_multiplier: 1.6, 
            speedMultiplier: 0.75, 
            spawnInterval: 0.3, 
            pattern: ['beefyenemy'] 
        }
        // Wave 13
        , { 
            enemyCount: 1, 
            enemyHealth_multiplier: 2.7, 
            speedMultiplier: 0.78, 
            spawnInterval: 0.3, 
            pattern: ['mage'] 
        }
        // Wave 14
        , { 
            enemyCount: 12, 
            enemyHealth_multiplier: 1.8, 
            speedMultiplier: 0.75, 
            spawnInterval: 0.4, 
            pattern: ['beefyenemy'] 
        }
        // Wave 15
        , { 
            enemyCount: 3, 
            enemyHealth_multiplier: 2.4, 
            speedMultiplier: 1.43, 
            spawnInterval: 0.7, 
            pattern: ['shieldknight'] 
        }
        // Wave 16
        , { 
            enemyCount: 3, 
            enemyHealth_multiplier: 2.7, 
            speedMultiplier: 1.00, 
            spawnInterval: 0.5, 
            pattern: ['knight'] 
        }
        // Wave 17
        , { 
            enemyCount: 37, 
            enemyHealth_multiplier: 1.5, 
            speedMultiplier: 1.27, 
            spawnInterval: 0.5, 
            pattern: ['frog'] 
        }
        // Wave 18
        , { 
            enemyCount: 49, 
            enemyHealth_multiplier: 1.6, 
            speedMultiplier: 0.75, 
            spawnInterval: 0.2, 
            pattern: ['archer', 'villager', 'basic'] 
        }
        // Wave 19
        , { 
            enemyCount: 20, 
            enemyHealth_multiplier: 2, 
            speedMultiplier: 1.00, 
            spawnInterval: 0.6, 
            pattern: ['mage', 'frog', 'frog', 'frog', 'frog', 'frog', 'frog', 'frog', 'frog', 'frog', 'frog', 'frog', 'frog'] 
        }
        // Wave 20
        , { 
            enemyCount: 3, 
            enemyHealth_multiplier: 3.7, 
            speedMultiplier: 1.13, 
            spawnInterval: 0.9, 
            pattern: ['knight', 'mage', 'shieldknight'] 
        }
        // Wave 21
        , { 
            enemyCount: 1, 
            enemyHealth_multiplier: 9, 
            speedMultiplier: 0.78, 
            spawnInterval: 1, 
            pattern: ['mage'] 
        }
        ];

        if (wave > 0 && wave <= waveConfigs.length) {
            return waveConfigs[wave - 1];
        }
        
        return null;
    }
}