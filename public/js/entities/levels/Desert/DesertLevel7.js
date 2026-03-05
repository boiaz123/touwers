import { LevelBase } from '../LevelBase.js';

export class DesertLevel7 extends LevelBase {
    static levelMetadata = {
        name: 'Sandy Dunes',
        difficulty: 'Easy',
        order: 7,
        campaign: 'desert'
    };

    constructor() {
        super();
        this.levelName = DesertLevel7.levelMetadata.name;
        this.levelNumber = DesertLevel7.levelMetadata.order;
        this.difficulty = DesertLevel7.levelMetadata.difficulty;
        this.campaign = DesertLevel7.levelMetadata.campaign;
        this.maxWaves = 1;
        
        this.setVisualConfig({
            grassColors: {
                top: '#e8d5a0',
                upper: '#dcc979',
                lower: '#d0b852',
                bottom: '#c4a140'
            },
            grassPatchDensity: 10000,
            pathBaseColor: '#b89968',
            edgeBushColor: '#8a6f2a',
            edgeBushAccentColor: '#a88f3a',
            edgeRockColor: '#9a8a6a',
            edgeGrassColor: '#d9a652',
            flowerDensity: 150000
        });

        this.terrainElements = [
            // Vegetation scattered around the desert
            { type: 'vegetation', gridX: 12.00, gridY: 5.00, size: 1.2 },
            { type: 'vegetation', gridX: 25.00, gridY: 2.00, size: 1.0 },
            { type: 'vegetation', gridX: 35.00, gridY: 6.00, size: 1.3 },
            { type: 'vegetation', gridX: 50.00, gridY: 8.00, size: 1.1 },
            { type: 'vegetation', gridX: 42.00, gridY: 14.00, size: 1.2 },
            { type: 'vegetation', gridX: 5.00, gridY: 12.00, size: 1.0 },
            { type: 'vegetation', gridX: 14.00, gridY: 30.00, size: 1.3 },
            { type: 'vegetation', gridX: 38.00, gridY: 27.00, size: 1.1 },
            { type: 'vegetation', gridX: 55.00, gridY: 18.00, size: 1.2 },
            { type: 'vegetation', gridX: 62.00, gridY: 25.00, size: 1.0 },
            
            // More vegetation mixed in
            { type: 'vegetation', gridX: 11.00, gridY: 7.00, size: 1.1 },
            { type: 'vegetation', gridX: 28.00, gridY: 8.00, size: 1.0 },
            { type: 'vegetation', gridX: 20.00, gridY: 13.00, size: 1.2 },
            { type: 'vegetation', gridX: 48.00, gridY: 11.00, size: 1.0 },
            { type: 'vegetation', gridX: 3.00, gridY: 8.00, size: 1.1 },
            { type: 'vegetation', gridX: 37.00, gridY: 20.00, size: 1.3 },
            { type: 'vegetation', gridX: 52.00, gridY: 22.00, size: 1.0 },
            { type: 'vegetation', gridX: 16.00, gridY: 28.00, size: 1.2 },
            { type: 'vegetation', gridX: 40.00, gridY: 32.00, size: 1.1 },
            { type: 'vegetation', gridX: 60.00, gridY: 15.00, size: 1.0 },
            
            // Desert rocks
            { type: 'rock', gridX: 8.00, gridY: 18.00, size: 1.0 },
            { type: 'rock', gridX: 32.00, gridY: 30.00, size: 1.0 },
            { type: 'rock', gridX: 45.00, gridY: 5.00, size: 1.0 },
            { type: 'rock', gridX: 58.00, gridY: 28.00, size: 1.0 },
            { type: 'rock', gridX: 24.00, gridY: 20.00, size: 1.0 }
        ];
    }

    createMeanderingPath() {
        const pathInGridCoords = [
            { gridX: 7.00, gridY: 0.00 },
            { gridX: 7.00, gridY: 25.00 },
            { gridX: 19.00, gridY: 25.00 },
            { gridX: 19.00, gridY: 16.00 },
            { gridX: 30.00, gridY: 16.00 },
            { gridX: 30.00, gridY: 22.00 },
            { gridX: 44.00, gridY: 22.00 }
        ];

        this.path = pathInGridCoords.map(point => ({
            x: Math.round(point.gridX * this.cellSize),
            y: Math.round(point.gridY * this.cellSize)
        }));
    }

    getWaveConfig(wave) {
        const waveConfigs = [
            { enemyCount: 10, enemyHealth_multiplier: 1.0, enemySpeed: 35, spawnInterval: 1.5, pattern: ['villager'] },
            // { enemyCount: 14, enemyHealth_multiplier: 1.1, enemySpeed: 36, spawnInterval: 1.5, pattern: ['basic'] },
            // { enemyCount: 17, enemyHealth_multiplier: 1.2, enemySpeed: 38, spawnInterval: 1.5, pattern: ['basic', 'villager'] },
            // { enemyCount: 20, enemyHealth_multiplier: 1.3, enemySpeed: 40, spawnInterval: 1.5, pattern: ['basic', 'archer', 'villager'] },
            // { enemyCount: 22, enemyHealth_multiplier: 1.4, enemySpeed: 42, spawnInterval: 1.3, pattern: ['archer', 'villager'] },
            // { enemyCount: 24, enemyHealth_multiplier: 1.5, enemySpeed: 44, spawnInterval: 1.3, pattern: ['basic', 'villager', 'archer'] },
            // { enemyCount: 26, enemyHealth_multiplier: 1.6, enemySpeed: 46, spawnInterval: 1.3, pattern: ['archer', 'basic', 'villager', 'archer'] },
            // { enemyCount: 28, enemyHealth_multiplier: 1.7, enemySpeed: 48, spawnInterval: 1.2, pattern: ['archer', 'archer', 'basic', 'villager'] },
            // { enemyCount: 30, enemyHealth_multiplier: 1.8, enemySpeed: 50, spawnInterval: 1.1, pattern: ['archer', 'villager', 'basic', 'archer'] },
            // { enemyCount: 1, enemyHealth_multiplier: 15, enemySpeed: 35, spawnInterval: 1.0, pattern: ['beefyenemy'] }
        ];
        
        return (wave > 0 && wave <= waveConfigs.length) ? waveConfigs[wave - 1] : null;
    }
}