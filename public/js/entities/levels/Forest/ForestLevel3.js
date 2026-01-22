import { LevelBase } from '../LevelBase.js';

export class ForestLevel3 extends LevelBase {
    static levelMetadata = {
        name: 'Crazy Frogs',
        difficulty: 'Medium',
        order: 3,
        campaign: 'forest'
    };

    constructor() {
        super();
        this.levelName = ForestLevel3.levelMetadata.name;
        this.levelNumber = ForestLevel3.levelMetadata.order;
        this.difficulty = ForestLevel3.levelMetadata.difficulty;
        this.campaign = ForestLevel3.levelMetadata.campaign;
        this.maxWaves = 10;
        
        this.setVisualConfig({
            grassColors: {
                top: '#d0d0d7ff',
                upper: '#b5b5baff',
                lower: '#8c8c98ff',
                bottom: '#c9c9d4ff'
            },
            grassPatchDensity: 12000,
            pathBaseColor: '#9f9f9cff',
            edgeBushColor: '#000000ff',
            edgeRockColor: '#666666',
            edgeGrassColor: '#56512bff'
        });

        this.terrainElements = [];
    }
    
    createMeanderingPath() {
        const gridWidth = this.gridWidth || 60;
        const gridHeight = this.gridHeight || 33.75;
        
        const pathInGridCoords = [
            { gridX: 0, gridY: gridHeight * 0.5 },
            { gridX: gridWidth * 0.2, gridY: gridHeight * 0.5 },
            { gridX: gridWidth * 0.2, gridY: gridHeight * 0.25 },
            { gridX: gridWidth * 0.5, gridY: gridHeight * 0.25 },
            { gridX: gridWidth * 0.5, gridY: gridHeight * 0.75 },
            { gridX: gridWidth * 0.8, gridY: gridHeight * 0.75 }
        ];
        
        this.path = pathInGridCoords.map(point => ({
            x: Math.round(point.gridX * this.cellSize),
            y: Math.round(point.gridY * this.cellSize)
        }));
    }
    
    getWaveConfig(wave) {
        const waveConfigs = [
            { enemyCount: 40, enemyHealth_multiplier: 0.1, enemySpeed: 395, spawnInterval: 2.0, pattern: ['frog'] },
            { enemyCount: 40, enemyHealth_multiplier: 0.5, enemySpeed: 669, spawnInterval: 1.7, pattern: ['frog'] },
            { enemyCount: 40, enemyHealth_multiplier: 0.6, enemySpeed: 1389, spawnInterval: 1.5, pattern: ['frog'] },
            { enemyCount: 40, enemyHealth_multiplier: 0.7, enemySpeed: 2409, spawnInterval: 1.3, pattern: ['frog'] },
            { enemyCount: 40, enemyHealth_multiplier: 0.8, enemySpeed: 5429, spawnInterval: 1.1, pattern: ['frog'] },
            { enemyCount: 60, enemyHealth_multiplier: 1.5, enemySpeed: 6449, spawnInterval: 1.3, pattern: ['frog'] },
            { enemyCount: 60, enemyHealth_multiplier: 1.6, enemySpeed: 7469, spawnInterval: 1.2, pattern: ['frog'] },
            { enemyCount: 60, enemyHealth_multiplier: 1.7, enemySpeed: 8489, spawnInterval: 1.1, pattern: ['frog'] },
            { enemyCount: 80, enemyHealth_multiplier: 1.8, enemySpeed: 9509, spawnInterval: 1.2, pattern: ['frog'] },
            { enemyCount: 100, enemyHealth_multiplier: 1.9, enemySpeed: 100529, spawnInterval: 10, pattern: ['frog'] }
        ];
        
        return (wave > 0 && wave <= waveConfigs.length) ? waveConfigs[wave - 1] : null;
    }
}
