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
            grassPatchSizeMin: 2,
            grassPatchSizeMax: 4,
            dirtPatchCount: 12,
            dirtPatchAlpha: 0.14,
            flowerDensity: 100000,
            pathBaseColor: '#9f9f9cff',
            pathEdgeVegetationChance: 0.3,
            edgeBushColor: '#000000ff',
            edgeRockColor: '#666666',
            edgeGrassColor: '#56512bff'
        });

        this.terrainElements = [
            { type: 'vegetation', gridX: 15.00, gridY: 10.00, size: 1.5 },
            { type: 'vegetation', gridX: 16.00, gridY: 11.00, size: 1.5 },
            { type: 'vegetation', gridX: 18.00, gridY: 10.00, size: 1.5 },
            { type: 'vegetation', gridX: 20.00, gridY: 12.00, size: 1.5 },
            { type: 'vegetation', gridX: 22.00, gridY: 10.00, size: 1.5 },
            { type: 'vegetation', gridX: 24.00, gridY: 11.00, size: 1.5 },
            { type: 'vegetation', gridX: 25.00, gridY: 13.00, size: 1.5 },
            { type: 'vegetation', gridX: 28.00, gridY: 12.00, size: 1.5 },
            { type: 'vegetation', gridX: 30.00, gridY: 10.00, size: 1.5 },
            { type: 'vegetation', gridX: 32.00, gridY: 11.00, size: 1.5 },
            { type: 'vegetation', gridX: 35.00, gridY: 10.00, size: 1.5 },
            { type: 'vegetation', gridX: 38.00, gridY: 12.00, size: 1.5 },
            { type: 'vegetation', gridX: 40.00, gridY: 10.00, size: 1.5 },
            { type: 'vegetation', gridX: 42.00, gridY: 11.00, size: 1.5 },
            { type: 'vegetation', gridX: 45.00, gridY: 10.00, size: 1.5 },
            { type: 'vegetation', gridX: 47.00, gridY: 12.00, size: 1.5 },
            { type: 'vegetation', gridX: 50.00, gridY: 10.00, size: 1.5 },
            { type: 'vegetation', gridX: 52.00, gridY: 11.00, size: 1.5 },
            { type: 'vegetation', gridX: 12.00, gridY: 20.00, size: 1.5 },
            { type: 'vegetation', gridX: 14.00, gridY: 22.00, size: 1.5 },
            { type: 'vegetation', gridX: 16.00, gridY: 20.00, size: 1.5 },
            { type: 'vegetation', gridX: 18.00, gridY: 21.00, size: 1.5 },
            { type: 'vegetation', gridX: 20.00, gridY: 20.00, size: 1.5 },
            { type: 'vegetation', gridX: 22.00, gridY: 22.00, size: 1.5 },
            { type: 'vegetation', gridX: 25.00, gridY: 20.00, size: 1.5 },
            { type: 'vegetation', gridX: 28.00, gridY: 21.00, size: 1.5 },
            { type: 'vegetation', gridX: 30.00, gridY: 20.00, size: 1.5 },
            { type: 'vegetation', gridX: 32.00, gridY: 22.00, size: 1.5 },
            { type: 'vegetation', gridX: 35.00, gridY: 20.00, size: 1.5 },
            { type: 'vegetation', gridX: 38.00, gridY: 21.00, size: 1.5 },
            { type: 'rock', gridX: 10.00, gridY: 15.00, size: 1.5 },
            { type: 'rock', gridX: 20.00, gridY: 18.00, size: 1.5 },
            { type: 'rock', gridX: 30.00, gridY: 15.00, size: 1.5 },
            { type: 'rock', gridX: 40.00, gridY: 18.00, size: 1.5 },
            { type: 'rock', gridX: 50.00, gridY: 15.00, size: 1.5 }
        ];
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
            { enemyCount: 10, enemyHealth_multiplier: 1.0, enemySpeed: 35, spawnInterval: 1.5, pattern: ['villager'] },
            { enemyCount: 14, enemyHealth_multiplier: 1.1, enemySpeed: 36, spawnInterval: 1.5, pattern: ['basic'] },
            { enemyCount: 17, enemyHealth_multiplier: 1.2, enemySpeed: 38, spawnInterval: 1.5, pattern: ['basic', 'villager'] },
            { enemyCount: 20, enemyHealth_multiplier: 1.3, enemySpeed: 40, spawnInterval: 1.5, pattern: ['basic', 'archer', 'villager'] },
            { enemyCount: 22, enemyHealth_multiplier: 1.4, enemySpeed: 42, spawnInterval: 1.3, pattern: ['archer', 'villager'] },
            { enemyCount: 24, enemyHealth_multiplier: 1.5, enemySpeed: 44, spawnInterval: 1.3, pattern: ['basic', 'villager', 'archer'] },
            { enemyCount: 26, enemyHealth_multiplier: 1.6, enemySpeed: 46, spawnInterval: 1.3, pattern: ['archer', 'basic', 'villager', 'archer'] },
            { enemyCount: 28, enemyHealth_multiplier: 1.7, enemySpeed: 48, spawnInterval: 1.2, pattern: ['archer', 'archer', 'basic', 'villager'] },
            { enemyCount: 30, enemyHealth_multiplier: 1.8, enemySpeed: 50, spawnInterval: 1.1, pattern: ['archer', 'villager', 'basic', 'archer'] },
            { enemyCount: 1, enemyHealth_multiplier: 15, enemySpeed: 35, spawnInterval: 1.0, pattern: ['beefyenemy'] }
        ];
        
        return (wave > 0 && wave <= waveConfigs.length) ? waveConfigs[wave - 1] : null;
    }
}

