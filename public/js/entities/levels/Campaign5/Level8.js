import { LevelBase } from '../LevelBase.js';

export class Level8 extends LevelBase {
    static levelMetadata = {
        name: 'My Level',
        difficulty: 'Easy',
        order: 8,
        campaign: 'forest'
    };

    constructor() {
        super();
        // Derive instance properties from static metadata
        this.levelName = Level8.levelMetadata.name;
        this.levelNumber = Level8.levelMetadata.order;
        this.difficulty = Level8.levelMetadata.difficulty;
        this.campaign = Level8.levelMetadata.campaign;
        this.maxWaves = 1;
        
        // Customize visuals
        this.setVisualConfig({
            grassColors: {
                top: '#4a6741',
                upper: '#5a7751',
                lower: '#6a8761',
                bottom: '#3a5731'
            },
            grassPatchDensity: NaN,
            pathBaseColor: '#8b7355',
            edgeBushColor: '#1f6f1f',
            edgeRockColor: '#807f80',
            edgeGrassColor: '#2e8b2e',
            flowerDensity: 25000
        });

        // Set terrain elements (prevent tower placement on these areas)
        this.terrainElements = [
            { type: 'water', gridX: 8.00, gridY: 34.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 9.00, gridY: 33.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 10.00, gridY: 33.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 11.00, gridY: 33.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 12.00, gridY: 32.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 12.00, gridY: 32.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 13.00, gridY: 32.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 14.00, gridY: 31.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 15.00, gridY: 31.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 15.00, gridY: 31.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 16.00, gridY: 30.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 17.00, gridY: 30.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 17.00, gridY: 29.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 18.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 19.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 19.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 19.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 19.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 20.00, gridY: 25.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 20.00, gridY: 25.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 20.00, gridY: 24.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 20.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 20.00, gridY: 22.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 20.00, gridY: 21.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 20.00, gridY: 20.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 20.00, gridY: 19.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 20.00, gridY: 19.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 19.00, gridY: 19.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 19.00, gridY: 18.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 18.00, gridY: 17.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 17.00, gridY: 17.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 17.00, gridY: 16.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 16.00, gridY: 15.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 16.00, gridY: 15.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 16.00, gridY: 14.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 16.00, gridY: 14.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 16.00, gridY: 13.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 16.00, gridY: 12.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 16.00, gridY: 11.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 16.00, gridY: 10.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 16.00, gridY: 10.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 16.00, gridY: 9.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 17.00, gridY: 8.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 17.00, gridY: 8.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 18.00, gridY: 7.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 18.00, gridY: 6.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 19.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 19.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 19.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 20.00, gridY: 4.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 21.00, gridY: 4.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 22.00, gridY: 3.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 23.00, gridY: 3.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 23.00, gridY: 3.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 24.00, gridY: 2.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 24.00, gridY: 2.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 25.00, gridY: 2.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 26.00, gridY: 3.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 27.00, gridY: 3.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 28.00, gridY: 3.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 29.00, gridY: 4.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 29.00, gridY: 4.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 30.00, gridY: 4.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 30.00, gridY: 4.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 31.00, gridY: 4.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 32.00, gridY: 4.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 33.00, gridY: 4.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 34.00, gridY: 4.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 35.00, gridY: 4.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 35.00, gridY: 4.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 35.00, gridY: 4.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 36.00, gridY: 3.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 37.00, gridY: 3.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 37.00, gridY: 2.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 37.00, gridY: 2.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 38.00, gridY: 1.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 38.00, gridY: 1.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 38.00, gridY: 0.00, size: 1.5, waterType: 'river' },
            { type: 'vegetation', gridX: 17.00, gridY: 13.00, size: 2 },
            { type: 'vegetation', gridX: 36.00, gridY: 8.00, size: 2 },
            { type: 'vegetation', gridX: 48.00, gridY: 15.00, size: 2 },
            { type: 'vegetation', gridX: 52.00, gridY: 21.00, size: 2 },
            { type: 'vegetation', gridX: 52.00, gridY: 29.00, size: 2 },
            { type: 'vegetation', gridX: 39.00, gridY: 31.00, size: 2 },
            { type: 'vegetation', gridX: 30.00, gridY: 29.00, size: 2 },
            { type: 'vegetation', gridX: 21.00, gridY: 29.00, size: 2 },
            { type: 'vegetation', gridX: 13.00, gridY: 29.00, size: 2 },
            { type: 'vegetation', gridX: 6.00, gridY: 23.00, size: 2 },
            { type: 'vegetation', gridX: 4.00, gridY: 20.00, size: 2 },
            { type: 'vegetation', gridX: 4.00, gridY: 4.00, size: 2 },
            { type: 'vegetation', gridX: 22.00, gridY: 4.00, size: 2 },
            { type: 'vegetation', gridX: 38.00, gridY: 5.00, size: 2 }
        ];
    }

    createMeanderingPath(canvasWidth, canvasHeight) {
        const gridWidth = this.gridWidth || 60;
        const gridHeight = this.gridHeight || 33.75;

        const pathInGridCoords = [
            { gridX: 0.00, gridY: 11.00 },
            { gridX: 11.00, gridY: 11.00 },
            { gridX: 11.00, gridY: 24.00 },
            { gridX: 26.00, gridY: 24.00 },
            { gridX: 26.00, gridY: 12.00 },
            { gridX: 35.00, gridY: 12.00 },
            { gridX: 35.00, gridY: 24.00 },
            { gridX: 45.00, gridY: 24.00 }
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
        ];

        if (wave > 0 && wave <= waveConfigs.length) {
            return waveConfigs[wave - 1];
        }
        
        return null;
    }
}