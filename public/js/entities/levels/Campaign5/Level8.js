import { LevelBase } from '../LevelBase.js';

export class Level8 extends LevelBase {
    static levelMetadata = {
        name: 'My Level',
        difficulty: 'Easy',
        order: 8
    };

    constructor() {
        super();
        // Derive instance properties from static metadata
        this.levelName = Level8.levelMetadata.name;
        this.levelNumber = Level8.levelMetadata.order;
        this.difficulty = Level8.levelMetadata.difficulty;
        this.maxWaves = 1;
        
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
            // Add terrain elements using the designer
        ];
    }

    createMeanderingPath(canvasWidth, canvasHeight) {
        const gridWidth = this.gridWidth || 60;
        const gridHeight = this.gridHeight || 33.75;

        const pathInGridCoords = [
            { gridX: 0.00, gridY: 17.00 },
            { gridX: 44.00, gridY: 17.00 }
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
            enemyCount: 10, 
            enemyHealth_multiplier: 0.1, 
            enemySpeed: 35, 
            spawnInterval: 2.5, 
            pattern: ['basic'] 
        }
        ];

        if (wave > 0 && wave <= waveConfigs.length) {
            return waveConfigs[wave - 1];
        }
        
        return null;
    }
}