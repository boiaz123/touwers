import { LevelBase } from '../LevelBase.js';

export class Level1 extends LevelBase {
    constructor() {
        super();
        this.levelName = 'My Level';
        this.levelNumber = 1;
        this.difficulty = 'Easy';
        this.maxWaves = 10;
        
        // Customize visuals
        this.setVisualConfig({
            grassColors: {
                top: '#2a2a3a',
                upper: '#3a3a4a',
                lower: '#4a4a5a',
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
            { type: 'water', gridX: 1.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 2.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 3.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 4.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 5.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 6.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 7.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 8.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 9.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 10.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 10.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 11.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 12.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 12.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 13.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 14.00, gridY: 25.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 15.00, gridY: 25.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 15.00, gridY: 24.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 16.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 16.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 17.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 18.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 19.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 20.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 21.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 22.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 23.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 23.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 23.00, gridY: 24.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 24.00, gridY: 24.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 25.00, gridY: 25.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 26.00, gridY: 25.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 27.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 27.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 28.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 28.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 29.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 30.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 31.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 32.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 33.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 34.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 35.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 36.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 37.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 38.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 39.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 40.00, gridY: 29.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 41.00, gridY: 29.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 41.00, gridY: 29.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 42.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 42.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 43.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 44.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 45.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 45.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 45.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 46.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 47.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 48.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 49.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 50.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 51.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 52.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 53.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 54.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 55.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 55.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 55.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 56.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 57.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 58.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 58.00, gridY: 27.00, size: 1.5, waterType: 'river' }
        ];
    }

    createMeanderingPath(canvasWidth, canvasHeight) {
        const gridWidth = this.gridWidth || 60;
        const gridHeight = this.gridHeight || 33.75;

        const pathInGridCoords = [
            { gridX: 2.79, gridY: 12.02 },
            { gridX: 27.60, gridY: 15.22 },
            { gridX: 31.45, gridY: 9.98 },
            { gridX: 37.99, gridY: 8.62 },
            { gridX: 44.43, gridY: 15.16 },
            { gridX: 45.13, gridY: 19.98 },
            { gridX: 49.72, gridY: 23.17 },
            { gridX: 54.12, gridY: 18.98 },
            { gridX: 56.90, gridY: 17.31 }
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
            enemyCount: 5, 
            enemyHealth_multiplier: 1, 
            enemySpeed: 35, 
            spawnInterval: 1.5, 
            pattern: ['basic'] 
        }
        // Wave 2
        , { 
            enemyCount: 5, 
            enemyHealth_multiplier: 1, 
            enemySpeed: 35, 
            spawnInterval: 1.5, 
            pattern: ['basic'] 
        }
        // Wave 3
        , { 
            enemyCount: 5, 
            enemyHealth_multiplier: 1, 
            enemySpeed: 35, 
            spawnInterval: 1.5, 
            pattern: ['basic'] 
        }
        // Wave 4
        , { 
            enemyCount: 5, 
            enemyHealth_multiplier: 1, 
            enemySpeed: 35, 
            spawnInterval: 1.5, 
            pattern: ['basic'] 
        }
        ];

        if (wave > 0 && wave <= waveConfigs.length) {
            return waveConfigs[wave - 1];
        }
        
        return null;
    }
}