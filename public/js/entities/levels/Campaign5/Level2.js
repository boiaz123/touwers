import { LevelBase } from '../LevelBase.js';

export class Level6 extends LevelBase {
    static levelMetadata = {
        name: 'Spiraling into Control',
        difficulty: 'Medium',
        order: 2,
        campaign: 'forest'
    };

    constructor() {
        super();
        // Derive instance properties from static metadata
        this.levelName = Level6.levelMetadata.name;
        this.levelNumber = Level6.levelMetadata.order;
        this.difficulty = Level6.levelMetadata.difficulty;
        this.campaign = Level6.levelMetadata.campaign;
        this.maxWaves = 16;
        
        // Customize visuals
        this.setVisualConfig({
            grassColors: {
                top: '#ad1475',
                upper: '#3b1560',
                lower: '#db8ad0',
                bottom: '#7dcde8'
            },
            grassPatchDensity: 12000,
            pathBaseColor: '#e8e896',
            edgeBushColor: '#0f3f0f',
            edgeRockColor: '#7a5c76',
            edgeGrassColor: '#1a6a1a',
            flowerDensity: 50000
        });

        // Set terrain elements (prevent tower placement on these areas)
        this.terrainElements = [
            { type: 'water', gridX: 0.00, gridY: 6.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 1.00, gridY: 6.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 2.00, gridY: 7.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 3.00, gridY: 7.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 4.00, gridY: 7.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 5.00, gridY: 7.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 6.00, gridY: 8.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 7.00, gridY: 8.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 7.00, gridY: 8.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 7.00, gridY: 9.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 8.00, gridY: 9.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 8.00, gridY: 10.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 9.00, gridY: 11.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 10.00, gridY: 12.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 10.00, gridY: 13.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 10.00, gridY: 13.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 10.00, gridY: 14.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 11.00, gridY: 14.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 11.00, gridY: 15.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 11.00, gridY: 16.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 12.00, gridY: 17.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 12.00, gridY: 18.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 12.00, gridY: 18.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 12.00, gridY: 19.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 11.00, gridY: 20.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 11.00, gridY: 21.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 11.00, gridY: 21.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 11.00, gridY: 22.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 11.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 11.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 11.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 11.00, gridY: 24.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 12.00, gridY: 25.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 12.00, gridY: 25.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 12.00, gridY: 25.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 13.00, gridY: 25.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 14.00, gridY: 25.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 14.00, gridY: 25.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 14.00, gridY: 25.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 14.00, gridY: 25.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 15.00, gridY: 24.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 15.00, gridY: 24.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 15.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 15.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 16.00, gridY: 22.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 16.00, gridY: 21.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 17.00, gridY: 21.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 17.00, gridY: 20.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 17.00, gridY: 20.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 18.00, gridY: 19.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 19.00, gridY: 19.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 20.00, gridY: 19.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 20.00, gridY: 18.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 20.00, gridY: 18.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 21.00, gridY: 18.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 22.00, gridY: 17.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 22.00, gridY: 17.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 23.00, gridY: 17.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 23.00, gridY: 17.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 24.00, gridY: 17.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 25.00, gridY: 16.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 26.00, gridY: 16.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 26.00, gridY: 16.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 27.00, gridY: 16.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 27.00, gridY: 16.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 28.00, gridY: 16.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 29.00, gridY: 16.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 30.00, gridY: 16.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 31.00, gridY: 16.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 32.00, gridY: 16.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 32.00, gridY: 16.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 33.00, gridY: 16.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 34.00, gridY: 16.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 35.00, gridY: 16.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 35.00, gridY: 16.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 35.00, gridY: 16.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 36.00, gridY: 16.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 37.00, gridY: 16.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 38.00, gridY: 16.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 39.00, gridY: 17.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 39.00, gridY: 17.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 39.00, gridY: 17.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 40.00, gridY: 17.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 41.00, gridY: 18.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 42.00, gridY: 18.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 43.00, gridY: 18.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 44.00, gridY: 19.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 45.00, gridY: 19.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 45.00, gridY: 19.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 46.00, gridY: 19.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 47.00, gridY: 20.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 47.00, gridY: 20.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 48.00, gridY: 20.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 49.00, gridY: 21.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 49.00, gridY: 21.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 50.00, gridY: 21.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 51.00, gridY: 22.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 51.00, gridY: 22.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 52.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 53.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 54.00, gridY: 24.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 54.00, gridY: 24.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 55.00, gridY: 25.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 56.00, gridY: 25.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 56.00, gridY: 25.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 57.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 57.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 58.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 59.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 60.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 28.00, gridY: 9.00, size: 2 },
            { type: 'rock', gridX: 5.00, gridY: 11.00, size: 1.5 },
            { type: 'rock', gridX: 8.00, gridY: 12.00, size: 1.5 },
            { type: 'rock', gridX: 8.00, gridY: 15.00, size: 1.5 },
            { type: 'rock', gridX: 10.00, gridY: 18.00, size: 1.5 },
            { type: 'rock', gridX: 2.00, gridY: 9.00, size: 1.5 },
            { type: 'rock', gridX: 2.00, gridY: 9.00, size: 1.5 },
            { type: 'rock', gridX: 10.00, gridY: 16.00, size: 1.5 },
            { type: 'rock', gridX: 3.00, gridY: 13.00, size: 1.5 },
            { type: 'rock', gridX: 7.00, gridY: 18.00, size: 1.5 },
            { type: 'rock', gridX: 4.00, gridY: 5.00, size: 1.5 },
            { type: 'rock', gridX: 8.00, gridY: 6.00, size: 1.5 },
            { type: 'rock', gridX: 11.00, gridY: 10.00, size: 1.5 },
            { type: 'rock', gridX: 15.00, gridY: 12.00, size: 1.5 },
            { type: 'rock', gridX: 13.00, gridY: 9.00, size: 1.5 },
            { type: 'rock', gridX: 12.00, gridY: 5.00, size: 1.5 },
            { type: 'rock', gridX: 9.00, gridY: 3.00, size: 1.5 },
            { type: 'tree', gridX: 2.00, gridY: 2.00, size: 1.5 },
            { type: 'tree', gridX: 2.00, gridY: 3.00, size: 1.5 },
            { type: 'tree', gridX: 5.00, gridY: 3.00, size: 1.5 },
            { type: 'tree', gridX: 5.00, gridY: 6.00, size: 1.5 },
            { type: 'tree', gridX: 7.00, gridY: 3.00, size: 1.5 },
            { type: 'tree', gridX: 9.00, gridY: 5.00, size: 1.5 },
            { type: 'tree', gridX: 10.00, gridY: 9.00, size: 1.5 },
            { type: 'tree', gridX: 11.00, gridY: 8.00, size: 1.5 },
            { type: 'tree', gridX: 15.00, gridY: 5.00, size: 1.5 },
            { type: 'tree', gridX: 11.00, gridY: 0.00, size: 1.5 },
            { type: 'tree', gridX: 14.00, gridY: 2.00, size: 1.5 },
            { type: 'tree', gridX: 17.00, gridY: 10.00, size: 1.5 },
            { type: 'tree', gridX: 13.00, gridY: 11.00, size: 1.5 },
            { type: 'tree', gridX: 21.00, gridY: 7.00, size: 1.5 },
            { type: 'tree', gridX: 24.00, gridY: 3.00, size: 1.5 },
            { type: 'tree', gridX: 19.00, gridY: 2.00, size: 1.5 },
            { type: 'tree', gridX: 1.00, gridY: 10.00, size: 1.5 },
            { type: 'tree', gridX: 4.00, gridY: 11.00, size: 1.5 },
            { type: 'tree', gridX: 7.00, gridY: 11.00, size: 1.5 },
            { type: 'tree', gridX: 6.00, gridY: 13.00, size: 1.5 },
            { type: 'tree', gridX: 7.00, gridY: 16.00, size: 1.5 },
            { type: 'tree', gridX: 8.00, gridY: 18.00, size: 1.5 },
            { type: 'tree', gridX: 9.00, gridY: 22.00, size: 1.5 },
            { type: 'tree', gridX: 4.00, gridY: 17.00, size: 1.5 },
            { type: 'tree', gridX: 2.00, gridY: 15.00, size: 1.5 },
            { type: 'tree', gridX: 2.00, gridY: 18.00, size: 1.5 },
            { type: 'tree', gridX: 5.00, gridY: 22.00, size: 1.5 },
            { type: 'tree', gridX: 6.00, gridY: 27.00, size: 1.5 },
            { type: 'tree', gridX: 11.00, gridY: 27.00, size: 1.5 },
            { type: 'tree', gridX: 1.00, gridY: 29.00, size: 1.5 },
            { type: 'tree', gridX: 2.00, gridY: 24.00, size: 1.5 },
            { type: 'tree', gridX: 5.00, gridY: 31.00, size: 1.5 },
            { type: 'tree', gridX: 10.00, gridY: 31.00, size: 1.5 },
            { type: 'tree', gridX: 45.00, gridY: 18.00, size: 1.5 },
            { type: 'tree', gridX: 48.00, gridY: 19.00, size: 1.5 },
            { type: 'tree', gridX: 43.00, gridY: 14.00, size: 1.5 },
            { type: 'tree', gridX: 41.00, gridY: 12.00, size: 1.5 },
            { type: 'tree', gridX: 44.00, gridY: 12.00, size: 1.5 },
            { type: 'tree', gridX: 42.00, gridY: 8.00, size: 1.5 },
            { type: 'tree', gridX: 39.00, gridY: 10.00, size: 1.5 },
            { type: 'tree', gridX: 37.00, gridY: 12.00, size: 1.5 },
            { type: 'tree', gridX: 40.00, gridY: 7.00, size: 1.5 },
            { type: 'tree', gridX: 36.00, gridY: 8.00, size: 1.5 },
            { type: 'tree', gridX: 38.00, gridY: 2.00, size: 1.5 },
            { type: 'tree', gridX: 36.00, gridY: 3.00, size: 1.5 },
            { type: 'tree', gridX: 38.00, gridY: 6.00, size: 1.5 },
            { type: 'tree', gridX: 45.00, gridY: 30.00, size: 1.5 }
        ];
    }

    createMeanderingPath(canvasWidth, canvasHeight) {
        const gridWidth = this.gridWidth || 60;
        const gridHeight = this.gridHeight || 33.75;

        const pathInGridCoords = [
            { gridX: 60.00, gridY: 0.00 },
            { gridX: 51.00, gridY: 3.00 },
            { gridX: 47.00, gridY: 8.00 },
            { gridX: 45.00, gridY: 13.00 },
            { gridX: 42.00, gridY: 20.00 },
            { gridX: 43.00, gridY: 27.00 },
            { gridX: 48.00, gridY: 30.00 },
            { gridX: 53.00, gridY: 27.00 },
            { gridX: 54.00, gridY: 22.00 },
            { gridX: 52.00, gridY: 19.00 },
            { gridX: 48.00, gridY: 17.00 },
            { gridX: 38.00, gridY: 14.00 },
            { gridX: 31.00, gridY: 13.00 },
            { gridX: 25.00, gridY: 14.00 },
            { gridX: 20.00, gridY: 16.00 },
            { gridX: 15.00, gridY: 19.00 },
            { gridX: 13.00, gridY: 22.00 }
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
            enemySpeed: 35, 
            spawnInterval: 2.5, 
            pattern: ['basic', 'basic', 'villager', 'basic', 'villager', 'basic'] 
        }
        // Wave 2
        , { 
            enemyCount: 35, 
            enemyHealth_multiplier: 1.1, 
            enemySpeed: 35, 
            spawnInterval: 2.2, 
            pattern: ['villager', 'villager', 'basic', 'villager', 'basic', 'villager'] 
        }
        // Wave 3
        , { 
            enemyCount: 5, 
            enemyHealth_multiplier: 3, 
            enemySpeed: 25, 
            spawnInterval: 5, 
            pattern: ['knight'] 
        }
        // Wave 4
        , { 
            enemyCount: 35, 
            enemyHealth_multiplier: 1.2, 
            enemySpeed: 35, 
            spawnInterval: 1.5, 
            pattern: ['basic', 'villager', 'knight', 'basic', 'knight', 'villager'] 
        }
        // Wave 5
        , { 
            enemyCount: 35, 
            enemyHealth_multiplier: 1.4, 
            enemySpeed: 40, 
            spawnInterval: 1.6, 
            pattern: ['basic', 'villager', 'knight', 'basic', 'knight', 'beefyenemy'] 
        }
        // Wave 6
        , { 
            enemyCount: 10, 
            enemyHealth_multiplier: 6, 
            enemySpeed: 30, 
            spawnInterval: 5, 
            pattern: ['knight'] 
        }
        // Wave 7
        , { 
            enemyCount: 26, 
            enemyHealth_multiplier: 1.6, 
            enemySpeed: 47, 
            spawnInterval: 0.7, 
            pattern: ['basic'] 
        }
        // Wave 8
        , { 
            enemyCount: 30, 
            enemyHealth_multiplier: 1.2, 
            enemySpeed: 60, 
            spawnInterval: 4, 
            pattern: ['archer'] 
        }
        // Wave 9
        , { 
            enemyCount: 32, 
            enemyHealth_multiplier: 1.8, 
            enemySpeed: 40, 
            spawnInterval: 1, 
            pattern: ['beefyenemy'] 
        }
        // Wave 10
        , { 
            enemyCount: 55, 
            enemyHealth_multiplier: 1.9, 
            enemySpeed: 53, 
            spawnInterval: 1, 
            pattern: ['villager'] 
        }
        // Wave 11
        , { 
            enemyCount: 80, 
            enemyHealth_multiplier: 1.3, 
            enemySpeed: 55, 
            spawnInterval: 0.7, 
            pattern: ['villager'] 
        }
        // Wave 12
        , { 
            enemyCount: 45, 
            enemyHealth_multiplier: 2.1, 
            enemySpeed: 50, 
            spawnInterval: 1, 
            pattern: ['villager', 'knight', 'knight', 'basic', 'villager', 'knight'] 
        }
        // Wave 13
        , { 
            enemyCount: 15, 
            enemyHealth_multiplier: 8, 
            enemySpeed: 35, 
            spawnInterval: 5, 
            pattern: ['knight'] 
        }
        // Wave 14
        , { 
            enemyCount: 40, 
            enemyHealth_multiplier: 1.5, 
            enemySpeed: 70, 
            spawnInterval: 2.5, 
            pattern: ['archer'] 
        }
        // Wave 15
        , { 
            enemyCount: 64, 
            enemyHealth_multiplier: 3, 
            enemySpeed: 45, 
            spawnInterval: 1, 
            pattern: ['beefyenemy'] 
        }
        // Wave 16
        , { 
            enemyCount: 2, 
            enemyHealth_multiplier: 40, 
            enemySpeed: 35, 
            spawnInterval: 20, 
            pattern: ['shieldknight'] 
        }
        ];

        if (wave > 0 && wave <= waveConfigs.length) {
            return waveConfigs[wave - 1];
        }
        
        return null;
    }
}