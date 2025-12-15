import { LevelBase } from './LevelBase.js';

export class Level1 extends LevelBase {
    constructor() {
        super();
        this.levelName = 'My Level';
        this.levelNumber = 1;
        this.difficulty = 'Medium';
        this.maxWaves = 21;
        
        // Customize visuals
        this.setVisualConfig({
            grassColors: {
                top: '#3d6d3c',
                upper: '#578e68',
                lower: '#265e39',
                bottom: '#6d4517'
            },
            grassPatchDensity: 7000,
            pathBaseColor: '#cdcd9d',
            edgeBushColor: '#0f3f0f',
            edgeRockColor: '#565252',
            edgeGrassColor: '#1a6a1a',
            flowerDensity: 31000
        });
    }

    createMeanderingPath(canvasWidth, canvasHeight) {
        const gridWidth = this.gridWidth || 60;
        const gridHeight = this.gridHeight || 33.75;

        const pathInGridCoords = [
            { gridX: 0.01, gridY: 4.91 },
            { gridX: 20.64, gridY: 4.96 },
            { gridX: 20.55, gridY: 15.22 },
            { gridX: 28.85, gridY: 15.16 },
            { gridX: 28.94, gridY: 10.56 },
            { gridX: 34.32, gridY: 10.56 },
            { gridX: 34.42, gridY: 15.22 },
            { gridX: 39.84, gridY: 15.01 },
            { gridX: 39.89, gridY: 27.83 },
            { gridX: 26.81, gridY: 27.72 }
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
        ];

        if (wave > 0 && wave <= waveConfigs.length) {
            return waveConfigs[wave - 1];
        }
        
        return null;
    }
}