import { LevelBase } from './LevelBase.js';

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
            { type: 'tree', gridX: 13.00, gridY: 11.00, size: 1.5 },
            { type: 'tree', gridX: 17.00, gridY: 19.00, size: 1.5 },
            { type: 'tree', gridX: 22.00, gridY: 23.00, size: 1.5 },
            { type: 'tree', gridX: 27.00, gridY: 18.00, size: 1.5 },
            { type: 'tree', gridX: 27.00, gridY: 15.00, size: 1.5 },
            { type: 'tree', gridX: 23.00, gridY: 13.00, size: 1.5 },
            { type: 'tree', gridX: 22.00, gridY: 13.00, size: 1.5 },
            { type: 'tree', gridX: 20.00, gridY: 14.00, size: 1.5 },
            { type: 'tree', gridX: 18.00, gridY: 18.00, size: 1.5 },
            { type: 'tree', gridX: 18.00, gridY: 21.00, size: 1.5 },
            { type: 'tree', gridX: 17.00, gridY: 24.00, size: 1.5 },
            { type: 'tree', gridX: 15.00, gridY: 25.00, size: 1.5 },
            { type: 'tree', gridX: 14.00, gridY: 25.00, size: 1.5 },
            { type: 'tree', gridX: 9.00, gridY: 25.00, size: 1.5 },
            { type: 'tree', gridX: 7.00, gridY: 23.00, size: 1.5 },
            { type: 'tree', gridX: 6.00, gridY: 21.00, size: 1.5 },
            { type: 'tree', gridX: 8.00, gridY: 18.00, size: 1.5 },
            { type: 'tree', gridX: 11.00, gridY: 17.00, size: 1.5 },
            { type: 'tree', gridX: 14.00, gridY: 19.00, size: 1.5 },
            { type: 'tree', gridX: 13.00, gridY: 23.00, size: 1.5 },
            { type: 'tree', gridX: 15.00, gridY: 23.00, size: 1.5 },
            { type: 'tree', gridX: 21.00, gridY: 21.00, size: 1.5 },
            { type: 'tree', gridX: 22.00, gridY: 18.00, size: 1.5 },
            { type: 'tree', gridX: 23.00, gridY: 15.00, size: 1.5 },
            { type: 'tree', gridX: 26.00, gridY: 12.00, size: 1.5 },
            { type: 'tree', gridX: 28.00, gridY: 8.00, size: 1.5 },
            { type: 'tree', gridX: 26.00, gridY: 6.00, size: 1.5 },
            { type: 'tree', gridX: 25.00, gridY: 7.00, size: 1.5 },
            { type: 'tree', gridX: 25.00, gridY: 11.00, size: 1.5 },
            { type: 'rock', gridX: 31.00, gridY: 14.00, size: 1.5 },
            { type: 'rock', gridX: 33.00, gridY: 11.00, size: 1.5 },
            { type: 'rock', gridX: 33.00, gridY: 9.00, size: 1.5 },
            { type: 'rock', gridX: 30.00, gridY: 10.00, size: 1.5 },
            { type: 'rock', gridX: 29.00, gridY: 14.00, size: 1.5 },
            { type: 'rock', gridX: 29.00, gridY: 18.00, size: 1.5 },
            { type: 'rock', gridX: 28.00, gridY: 21.00, size: 1.5 },
            { type: 'rock', gridX: 26.00, gridY: 23.00, size: 1.5 },
            { type: 'rock', gridX: 24.00, gridY: 24.00, size: 1.5 },
            { type: 'rock', gridX: 24.00, gridY: 21.00, size: 1.5 },
            { type: 'rock', gridX: 20.00, gridY: 26.00, size: 1.5 },
            { type: 'rock', gridX: 18.00, gridY: 28.00, size: 1.5 },
            { type: 'rock', gridX: 14.00, gridY: 29.00, size: 1.5 },
            { type: 'rock', gridX: 12.00, gridY: 29.00, size: 1.5 },
            { type: 'rock', gridX: 10.00, gridY: 29.00, size: 1.5 },
            { type: 'rock', gridX: 8.00, gridY: 28.00, size: 1.5 },
            { type: 'rock', gridX: 7.00, gridY: 28.00, size: 1.5 },
            { type: 'rock', gridX: 7.00, gridY: 28.00, size: 1.5 },
            { type: 'rock', gridX: 5.00, gridY: 29.00, size: 1.5 },
            { type: 'rock', gridX: 4.00, gridY: 30.00, size: 1.5 },
            { type: 'rock', gridX: 4.00, gridY: 30.00, size: 1.5 },
            { type: 'water', gridX: 44.00, gridY: 6.00, size: 3 },
            { type: 'water', gridX: 38.00, gridY: 3.00, size: 4 },
            { type: 'water', gridX: 41.00, gridY: 5.00, size: 2 },
            { type: 'water', gridX: 42.00, gridY: 4.00, size: 2 },
            { type: 'water', gridX: 40.00, gridY: 4.00, size: 2 },
            { type: 'water', gridX: 41.00, gridY: 34.00, size: 1.5 },
            { type: 'water', gridX: 41.00, gridY: 33.00, size: 1.5 },
            { type: 'water', gridX: 41.00, gridY: 32.00, size: 1.5 },
            { type: 'water', gridX: 41.00, gridY: 31.00, size: 1.5 },
            { type: 'water', gridX: 41.00, gridY: 30.00, size: 1.5 },
            { type: 'water', gridX: 41.00, gridY: 29.00, size: 1.5 },
            { type: 'water', gridX: 41.00, gridY: 28.00, size: 1.5 },
            { type: 'water', gridX: 41.00, gridY: 27.00, size: 1.5 },
            { type: 'water', gridX: 41.00, gridY: 26.00, size: 1.5 },
            { type: 'water', gridX: 41.00, gridY: 25.00, size: 1.5 },
            { type: 'water', gridX: 41.00, gridY: 24.00, size: 1.5 },
            { type: 'water', gridX: 41.00, gridY: 23.00, size: 1.5 },
            { type: 'water', gridX: 41.00, gridY: 23.00, size: 1.5 },
            { type: 'water', gridX: 42.00, gridY: 22.00, size: 1.5 },
            { type: 'water', gridX: 42.00, gridY: 21.00, size: 1.5 },
            { type: 'water', gridX: 43.00, gridY: 21.00, size: 1.5 },
            { type: 'water', gridX: 43.00, gridY: 20.00, size: 1.5 },
            { type: 'water', gridX: 44.00, gridY: 19.00, size: 1.5 },
            { type: 'water', gridX: 44.00, gridY: 18.00, size: 1.5 },
            { type: 'water', gridX: 45.00, gridY: 17.00, size: 1.5 },
            { type: 'water', gridX: 45.00, gridY: 17.00, size: 1.5 },
            { type: 'water', gridX: 46.00, gridY: 16.00, size: 1.5 },
            { type: 'water', gridX: 47.00, gridY: 15.00, size: 1.5 },
            { type: 'water', gridX: 47.00, gridY: 14.00, size: 1.5 },
            { type: 'water', gridX: 47.00, gridY: 14.00, size: 1.5 },
            { type: 'water', gridX: 48.00, gridY: 13.00, size: 1.5 },
            { type: 'water', gridX: 48.00, gridY: 12.00, size: 1.5 },
            { type: 'water', gridX: 48.00, gridY: 11.00, size: 1.5 },
            { type: 'water', gridX: 49.00, gridY: 11.00, size: 1.5 },
            { type: 'water', gridX: 49.00, gridY: 10.00, size: 1.5 },
            { type: 'water', gridX: 50.00, gridY: 9.00, size: 1.5 },
            { type: 'water', gridX: 50.00, gridY: 8.00, size: 1.5 },
            { type: 'water', gridX: 50.00, gridY: 7.00, size: 1.5 },
            { type: 'water', gridX: 51.00, gridY: 6.00, size: 1.5 },
            { type: 'water', gridX: 51.00, gridY: 6.00, size: 1.5 },
            { type: 'water', gridX: 51.00, gridY: 5.00, size: 1.5 },
            { type: 'water', gridX: 51.00, gridY: 4.00, size: 1.5 },
            { type: 'water', gridX: 51.00, gridY: 3.00, size: 1.5 },
            { type: 'water', gridX: 51.00, gridY: 2.00, size: 1.5 },
            { type: 'water', gridX: 51.00, gridY: 1.00, size: 1.5 },
            { type: 'water', gridX: 51.00, gridY: 0.00, size: 1.5 }
        ];
    }

    createMeanderingPath(canvasWidth, canvasHeight) {
        const gridWidth = this.gridWidth || 60;
        const gridHeight = this.gridHeight || 33.75;

        const pathInGridCoords = [
            { gridX: 0.01, gridY: 3.81 },
            { gridX: 34.00, gridY: 3.39 },
            { gridX: 39.14, gridY: 12.81 },
            { gridX: 57.18, gridY: 16.94 }
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
            enemyCount: 11, 
            enemyHealth_multiplier: 1.1, 
            enemySpeed: 37, 
            spawnInterval: 1.3, 
            pattern: ['basic'] 
        }
        // Wave 3
        , { 
            enemyCount: 11, 
            enemyHealth_multiplier: 1.1, 
            enemySpeed: 37, 
            spawnInterval: 1.3, 
            pattern: ['basic'] 
        }
        // Wave 4
        , { 
            enemyCount: 11, 
            enemyHealth_multiplier: 1.1, 
            enemySpeed: 37, 
            spawnInterval: 1.3, 
            pattern: ['basic'] 
        }
        // Wave 5
        , { 
            enemyCount: 11, 
            enemyHealth_multiplier: 1.1, 
            enemySpeed: 37, 
            spawnInterval: 1.3, 
            pattern: ['basic'] 
        }
        // Wave 6
        , { 
            enemyCount: 11, 
            enemyHealth_multiplier: 1.1, 
            enemySpeed: 37, 
            spawnInterval: 1.3, 
            pattern: ['basic'] 
        }
        // Wave 7
        , { 
            enemyCount: 11, 
            enemyHealth_multiplier: 1.1, 
            enemySpeed: 37, 
            spawnInterval: 1.3, 
            pattern: ['basic'] 
        }
        ];

        if (wave > 0 && wave <= waveConfigs.length) {
            return waveConfigs[wave - 1];
        }
        
        return null;
    }
}