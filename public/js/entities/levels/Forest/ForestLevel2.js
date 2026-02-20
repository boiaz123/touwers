import { LevelBase } from '../LevelBase.js';

export class ForestLevel2 extends LevelBase {
    static levelMetadata = {
        name: 'Hardalan Woodlands',
        difficulty: 'Easy',
        order: 2,
        campaign: 'forest'
    };

    constructor() {
        super();
        // Derive instance properties from static metadata
        this.levelName = ForestLevel2.levelMetadata.name;
        this.levelNumber = ForestLevel2.levelMetadata.order;
        this.difficulty = ForestLevel2.levelMetadata.difficulty;
        this.campaign = ForestLevel2.levelMetadata.campaign;
        this.maxWaves = 12;
        
        // Customize visuals
        this.setVisualConfig({
            grassColors: {
                top: '#2a2a3a',
                upper: '#381d1d',
                lower: '#330000',
                bottom: '#1a1a2a'
            },
            grassPatchDensity: 12000,
            pathBaseColor: '#6b6b5b',
            edgeBushColor: '#0f3f0f',
            edgeRockColor: '#666666',
            edgeGrassColor: '#1a6a1a',
            flowerDensity: 50000
        });

        // Set terrain elements (prevent tower placement on these areas)
        this.terrainElements = [
            { type: 'water', gridX: 12.00, gridY: 34.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 13.00, gridY: 33.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 13.00, gridY: 32.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 13.00, gridY: 31.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 14.00, gridY: 30.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 14.00, gridY: 29.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 14.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 14.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 15.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 16.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 17.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 18.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 18.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 19.00, gridY: 25.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 19.00, gridY: 25.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 20.00, gridY: 25.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 21.00, gridY: 25.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 22.00, gridY: 25.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 23.00, gridY: 25.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 24.00, gridY: 24.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 25.00, gridY: 24.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 26.00, gridY: 24.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 27.00, gridY: 24.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 27.00, gridY: 24.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 28.00, gridY: 24.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 29.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 30.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 30.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 31.00, gridY: 22.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 32.00, gridY: 22.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 32.00, gridY: 22.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 33.00, gridY: 21.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 33.00, gridY: 20.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 34.00, gridY: 20.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 34.00, gridY: 19.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 35.00, gridY: 18.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 35.00, gridY: 17.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 35.00, gridY: 17.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 36.00, gridY: 16.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 36.00, gridY: 15.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 36.00, gridY: 14.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 36.00, gridY: 13.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 36.00, gridY: 12.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 36.00, gridY: 12.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 36.00, gridY: 12.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 36.00, gridY: 11.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 36.00, gridY: 10.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 36.00, gridY: 9.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 36.00, gridY: 8.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 36.00, gridY: 7.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 36.00, gridY: 6.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 36.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 36.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 36.00, gridY: 4.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 35.00, gridY: 4.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 34.00, gridY: 3.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 34.00, gridY: 3.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 34.00, gridY: 3.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 33.00, gridY: 2.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 33.00, gridY: 1.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 33.00, gridY: 0.00, size: 1.5, waterType: 'river' },
            { type: 'vegetation', gridX: 13.00, gridY: 0.00, size: 2 },
            { type: 'vegetation', gridX: 15.00, gridY: 0.00, size: 2 },
            { type: 'vegetation', gridX: 17.00, gridY: 1.00, size: 2 },
            { type: 'vegetation', gridX: 16.00, gridY: 2.00, size: 2 },
            { type: 'vegetation', gridX: 12.00, gridY: 3.00, size: 2 },
            { type: 'vegetation', gridX: 12.00, gridY: 1.00, size: 2 },
            { type: 'vegetation', gridX: 10.00, gridY: 1.00, size: 2 },
            { type: 'vegetation', gridX: 10.00, gridY: 4.00, size: 2 },
            { type: 'vegetation', gridX: 12.00, gridY: 5.00, size: 2 },
            { type: 'vegetation', gridX: 8.00, gridY: 3.00, size: 2 },
            { type: 'vegetation', gridX: 8.00, gridY: 1.00, size: 2 },
            { type: 'vegetation', gridX: 6.00, gridY: 3.00, size: 2 },
            { type: 'vegetation', gridX: 4.00, gridY: 5.00, size: 2 },
            { type: 'vegetation', gridX: 3.00, gridY: 7.00, size: 2 },
            { type: 'vegetation', gridX: 1.00, gridY: 8.00, size: 2 },
            { type: 'vegetation', gridX: 2.00, gridY: 5.00, size: 2 },
            { type: 'vegetation', gridX: 1.00, gridY: 3.00, size: 2 },
            { type: 'vegetation', gridX: 3.00, gridY: 2.00, size: 2 },
            { type: 'vegetation', gridX: 20.00, gridY: 2.00, size: 2 },
            { type: 'vegetation', gridX: 22.00, gridY: 1.00, size: 2 },
            { type: 'vegetation', gridX: 23.00, gridY: 1.00, size: 2 },
            { type: 'vegetation', gridX: 1.00, gridY: 33.00, size: 2 },
            { type: 'vegetation', gridX: 4.00, gridY: 33.00, size: 2 },
            { type: 'vegetation', gridX: 7.00, gridY: 33.00, size: 2 },
            { type: 'vegetation', gridX: 8.00, gridY: 30.00, size: 2 },
            { type: 'vegetation', gridX: 7.00, gridY: 28.00, size: 2 },
            { type: 'vegetation', gridX: 5.00, gridY: 30.00, size: 2 },
            { type: 'vegetation', gridX: 4.00, gridY: 31.00, size: 2 },
            { type: 'vegetation', gridX: 2.00, gridY: 31.00, size: 2 },
            { type: 'vegetation', gridX: 0.00, gridY: 29.00, size: 2 },
            { type: 'vegetation', gridX: 0.00, gridY: 28.00, size: 2 },
            { type: 'vegetation', gridX: 1.00, gridY: 26.00, size: 2 },
            { type: 'vegetation', gridX: 3.00, gridY: 28.00, size: 2 },
            { type: 'vegetation', gridX: 5.00, gridY: 28.00, size: 2 },
            { type: 'vegetation', gridX: 9.00, gridY: 33.00, size: 2 },
            { type: 'vegetation', gridX: 11.00, gridY: 33.00, size: 2 },
            { type: 'vegetation', gridX: 12.00, gridY: 32.00, size: 2 },
            { type: 'vegetation', gridX: 12.00, gridY: 30.00, size: 2 },
            { type: 'vegetation', gridX: 17.00, gridY: 30.00, size: 2 },
            { type: 'vegetation', gridX: 15.00, gridY: 33.00, size: 2 },
            { type: 'vegetation', gridX: 15.00, gridY: 31.00, size: 2 },
            { type: 'vegetation', gridX: 16.00, gridY: 30.00, size: 2 },
            { type: 'vegetation', gridX: 18.00, gridY: 29.00, size: 2 },
            { type: 'vegetation', gridX: 20.00, gridY: 33.00, size: 2 },
            { type: 'vegetation', gridX: 22.00, gridY: 31.00, size: 2 },
            { type: 'vegetation', gridX: 20.00, gridY: 30.00, size: 2 },
            { type: 'vegetation', gridX: 18.00, gridY: 32.00, size: 2 },
            { type: 'vegetation', gridX: 18.00, gridY: 33.00, size: 2 },
            { type: 'vegetation', gridX: 9.00, gridY: 27.00, size: 2 },
            { type: 'vegetation', gridX: 5.00, gridY: 25.00, size: 2 },
            { type: 'vegetation', gridX: 3.00, gridY: 23.00, size: 2 },
            { type: 'vegetation', gridX: 2.00, gridY: 20.00, size: 2 },
            { type: 'vegetation', gridX: 2.00, gridY: 18.00, size: 2 },
            { type: 'vegetation', gridX: 2.00, gridY: 15.00, size: 2 },
            { type: 'vegetation', gridX: 1.00, gridY: 13.00, size: 2 },
            { type: 'vegetation', gridX: 1.00, gridY: 9.00, size: 2 },
            { type: 'vegetation', gridX: 3.00, gridY: 9.00, size: 2 },
            { type: 'vegetation', gridX: 3.00, gridY: 13.00, size: 2 },
            { type: 'vegetation', gridX: 6.00, gridY: 18.00, size: 2 },
            { type: 'vegetation', gridX: 7.00, gridY: 19.00, size: 2 },
            { type: 'vegetation', gridX: 7.00, gridY: 21.00, size: 2 },
            { type: 'vegetation', gridX: 4.00, gridY: 21.00, size: 2 },
            { type: 'vegetation', gridX: 2.00, gridY: 23.00, size: 2 },
            { type: 'vegetation', gridX: 49.00, gridY: 33.00, size: 2 },
            { type: 'vegetation', gridX: 52.00, gridY: 32.00, size: 2 },
            { type: 'vegetation', gridX: 54.00, gridY: 32.00, size: 2 },
            { type: 'vegetation', gridX: 58.00, gridY: 32.00, size: 2 },
            { type: 'vegetation', gridX: 58.00, gridY: 30.00, size: 2 },
            { type: 'vegetation', gridX: 58.00, gridY: 26.00, size: 2 },
            { type: 'vegetation', gridX: 59.00, gridY: 23.00, size: 2 },
            { type: 'vegetation', gridX: 59.00, gridY: 20.00, size: 2 },
            { type: 'vegetation', gridX: 59.00, gridY: 17.00, size: 2 },
            { type: 'vegetation', gridX: 58.00, gridY: 16.00, size: 2 },
            { type: 'vegetation', gridX: 55.00, gridY: 19.00, size: 2 },
            { type: 'vegetation', gridX: 56.00, gridY: 24.00, size: 2 },
            { type: 'vegetation', gridX: 56.00, gridY: 29.00, size: 2 },
            { type: 'vegetation', gridX: 53.00, gridY: 28.00, size: 2 },
            { type: 'vegetation', gridX: 52.00, gridY: 26.00, size: 2 },
            { type: 'vegetation', gridX: 51.00, gridY: 29.00, size: 2 },
            { type: 'vegetation', gridX: 48.00, gridY: 31.00, size: 2 },
            { type: 'vegetation', gridX: 45.00, gridY: 31.00, size: 2 },
            { type: 'vegetation', gridX: 44.00, gridY: 33.00, size: 2 },
            { type: 'vegetation', gridX: 43.00, gridY: 33.00, size: 2 },
            { type: 'vegetation', gridX: 40.00, gridY: 33.00, size: 2 },
            { type: 'vegetation', gridX: 38.00, gridY: 33.00, size: 2 },
            { type: 'vegetation', gridX: 55.00, gridY: 12.00, size: 2 },
            { type: 'vegetation', gridX: 58.00, gridY: 9.00, size: 2 },
            { type: 'vegetation', gridX: 59.00, gridY: 5.00, size: 2 },
            { type: 'vegetation', gridX: 58.00, gridY: 1.00, size: 2 },
            { type: 'vegetation', gridX: 55.00, gridY: 2.00, size: 2 },
            { type: 'vegetation', gridX: 54.00, gridY: 4.00, size: 2 },
            { type: 'vegetation', gridX: 55.00, gridY: 7.00, size: 2 },
            { type: 'vegetation', gridX: 58.00, gridY: 10.00, size: 2 },
            { type: 'vegetation', gridX: 59.00, gridY: 13.00, size: 2 },
            { type: 'vegetation', gridX: 56.00, gridY: 7.00, size: 2 },
            { type: 'vegetation', gridX: 56.00, gridY: 4.00, size: 2 },
            { type: 'vegetation', gridX: 50.00, gridY: 5.00, size: 2 },
            { type: 'vegetation', gridX: 49.00, gridY: 7.00, size: 2 },
            { type: 'vegetation', gridX: 55.00, gridY: 9.00, size: 2 },
            { type: 'vegetation', gridX: 53.00, gridY: 4.00, size: 2 },
            { type: 'vegetation', gridX: 51.00, gridY: 2.00, size: 2 },
            { type: 'vegetation', gridX: 47.00, gridY: 1.00, size: 2 },
            { type: 'vegetation', gridX: 45.00, gridY: 2.00, size: 2 },
            { type: 'vegetation', gridX: 44.00, gridY: 5.00, size: 2 },
            { type: 'vegetation', gridX: 47.00, gridY: 6.00, size: 2 },
            { type: 'vegetation', gridX: 48.00, gridY: 4.00, size: 2 },
            { type: 'vegetation', gridX: 45.00, gridY: 2.00, size: 2 },
            { type: 'vegetation', gridX: 41.00, gridY: 1.00, size: 2 },
            { type: 'vegetation', gridX: 39.00, gridY: 1.00, size: 2 },
            { type: 'vegetation', gridX: 38.00, gridY: 1.00, size: 2 },
            { type: 'vegetation', gridX: 32.00, gridY: 1.00, size: 2 },
            { type: 'vegetation', gridX: 35.00, gridY: 0.00, size: 2 },
            { type: 'vegetation', gridX: 36.00, gridY: 2.00, size: 2 },
            { type: 'vegetation', gridX: 38.00, gridY: 3.00, size: 2 },
            { type: 'vegetation', gridX: 33.00, gridY: 3.00, size: 2 },
            { type: 'vegetation', gridX: 29.00, gridY: 1.00, size: 2 },
            { type: 'vegetation', gridX: 25.00, gridY: 1.00, size: 2 },
            { type: 'vegetation', gridX: 26.00, gridY: 3.00, size: 2 },
            { type: 'vegetation', gridX: 29.00, gridY: 3.00, size: 2 },
            { type: 'vegetation', gridX: 31.00, gridY: 4.00, size: 2 },
            { type: 'vegetation', gridX: 31.00, gridY: 2.00, size: 2 },
            { type: 'rock', gridX: 18.00, gridY: 3.00, size: 1.5 },
            { type: 'rock', gridX: 27.00, gridY: 1.00, size: 1.5 },
            { type: 'rock', gridX: 40.00, gridY: 3.00, size: 1.5 },
            { type: 'rock', gridX: 35.00, gridY: 2.00, size: 1.5 },
            { type: 'rock', gridX: 9.00, gridY: 3.00, size: 1.5 },
            { type: 'rock', gridX: 6.00, gridY: 5.00, size: 1.5 },
            { type: 'rock', gridX: 4.00, gridY: 3.00, size: 1.5 },
            { type: 'rock', gridX: 1.00, gridY: 15.00, size: 1.5 },
            { type: 'rock', gridX: 2.00, gridY: 29.00, size: 1.5 },
            { type: 'rock', gridX: 5.00, gridY: 32.00, size: 1.5 },
            { type: 'rock', gridX: 16.00, gridY: 33.00, size: 1.5 },
            { type: 'rock', gridX: 19.00, gridY: 31.00, size: 1.5 },
            { type: 'rock', gridX: 42.00, gridY: 33.00, size: 1.5 },
            { type: 'rock', gridX: 47.00, gridY: 34.00, size: 1.5 },
            { type: 'rock', gridX: 50.00, gridY: 31.00, size: 1.5 },
            { type: 'rock', gridX: 55.00, gridY: 25.00, size: 1.5 },
            { type: 'rock', gridX: 57.00, gridY: 18.00, size: 1.5 },
            { type: 'rock', gridX: 52.00, gridY: 9.00, size: 1.5 },
            { type: 'rock', gridX: 51.00, gridY: 3.00, size: 1.5 },
            { type: 'rock', gridX: 53.00, gridY: 1.00, size: 1.5 },
            { type: 'rock', gridX: 42.00, gridY: 2.00, size: 1.5 },
            { type: 'rock', gridX: 46.00, gridY: 5.00, size: 1.5 },
            { type: 'water', gridX: 55.00, gridY: 15.00, size: 4, waterType: 'lake' }
        ];
    }

    createMeanderingPath(canvasWidth, canvasHeight) {
        const gridWidth = this.gridWidth || 60;
        const gridHeight = this.gridHeight || 33.75;

        const pathInGridCoords = [
            { gridX: 14.00, gridY: 0.00 },
            { gridX: 14.00, gridY: 13.00 },
            { gridX: 22.00, gridY: 13.00 },
            { gridX: 22.00, gridY: 7.00 },
            { gridX: 27.00, gridY: 7.00 },
            { gridX: 27.00, gridY: 13.00 },
            { gridX: 32.00, gridY: 13.00 },
            { gridX: 32.00, gridY: 7.00 },
            { gridX: 41.00, gridY: 7.00 },
            { gridX: 41.00, gridY: 26.00 }
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
            enemyHealth_multiplier: 1, 
            enemySpeed: 30, 
            spawnInterval: 2, 
            pattern: ['basic', 'villager'] 
        }
        // Wave 2
        , { 
            enemyCount: 14, 
            enemyHealth_multiplier: 1, 
            enemySpeed: 30, 
            spawnInterval: 1.8, 
            pattern: ['basic', 'villager'] 
        }
        // Wave 3
        , { 
            enemyCount: 20, 
            enemyHealth_multiplier: 1.2, 
            enemySpeed: 35, 
            spawnInterval: 1.5, 
            pattern: ['basic', 'villager'] 
        }
        // Wave 4
        , { 
            enemyCount: 10, 
            enemyHealth_multiplier: 1, 
            enemySpeed: 400, 
            spawnInterval: 2, 
            pattern: ['archer'] 
        }
        // Wave 5
        , { 
            enemyCount: 6, 
            enemyHealth_multiplier: 1.7, 
            enemySpeed: 35, 
            spawnInterval: 2, 
            pattern: ['beefyenemy'] 
        }
        // Wave 6
        , { 
            enemyCount: 30, 
            enemyHealth_multiplier: 1, 
            enemySpeed: 65, 
            spawnInterval: 2, 
            pattern: ['basic', 'villager'] 
        }
        // Wave 7
        , { 
            enemyCount: 15, 
            enemyHealth_multiplier: 2, 
            enemySpeed: 400, 
            spawnInterval: 2, 
            pattern: ['archer'] 
        }
        // Wave 8
        , { 
            enemyCount: 25, 
            enemyHealth_multiplier: 1, 
            enemySpeed: 45, 
            spawnInterval: 1.4, 
            pattern: ['basic', 'villager'] 
        }
        // Wave 9
        , { 
            enemyCount: 12, 
            enemyHealth_multiplier: 2.0, 
            enemySpeed: 50, 
            spawnInterval: 2.5, 
            pattern: ['beefyenemy'] 
        }
        // Wave 10
        , { 
            enemyCount: 4, 
            enemyHealth_multiplier: 5, 
            enemySpeed: 50, 
            spawnInterval: 7, 
            pattern: ['beefyenemy'] 
        }
        // Wave 11
        , { 
            enemyCount: 35, 
            enemyHealth_multiplier: 2, 
            enemySpeed: 85, 
            spawnInterval: 3, 
            pattern: ['archer'] 
        }
        // Wave 12
        , { 
            enemyCount: 1, 
            enemyHealth_multiplier: 2, 
            enemySpeed: 45, 
            spawnInterval: 1, 
            pattern: ['knight'] 
        }
        ];

        if (wave > 0 && wave <= waveConfigs.length) {
            return waveConfigs[wave - 1];
        }
        
        return null;
    }
}