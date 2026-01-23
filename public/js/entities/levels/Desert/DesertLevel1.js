import { LevelBase } from '../LevelBase.js';

export class DesertLevel1 extends LevelBase {
    static levelMetadata = {
        name: 'Sandy Dunes',
        difficulty: 'Easy',
        order: 1,
        campaign: 'desert'
    };

    constructor() {
        super();
        this.levelName = DesertLevel1.levelMetadata.name;
        this.levelNumber = DesertLevel1.levelMetadata.order;
        this.difficulty = DesertLevel1.levelMetadata.difficulty;
        this.campaign = DesertLevel1.levelMetadata.campaign;
        this.maxWaves = 12;
        
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
            { enemyCount: 18, enemyHealth_multiplier: 0.9, enemySpeed: 40, spawnInterval: 1.9, pattern: ['basic'] },
            { enemyCount: 18, enemyHealth_multiplier: 1, enemySpeed: 40, spawnInterval: 1.8, pattern: ['villager'] },
            { enemyCount: 22, enemyHealth_multiplier: 1.1, enemySpeed: 40, spawnInterval: 1.7, pattern: ['villager', 'basic'] },
            { enemyCount: 10, enemyHealth_multiplier: 1, enemySpeed: 60, spawnInterval: 2.2, pattern: ['villager', 'basic'] },
            { enemyCount: 18, enemyHealth_multiplier: 1.3, enemySpeed: 45, spawnInterval: 1.6, pattern: ['villager', 'basic'] },
            { enemyCount: 10, enemyHealth_multiplier: 2.6, enemySpeed: 35, spawnInterval: 1.4, pattern: ['beefyenemy'] },
            { enemyCount: 14, enemyHealth_multiplier: 2.6, enemySpeed: 35, spawnInterval: 1.4, pattern: ['beefyenemy'] },
            { enemyCount: 48, enemyHealth_multiplier: 0.7, enemySpeed: 50, spawnInterval: 1.2, pattern: ['villager'] },
            { enemyCount: 48, enemyHealth_multiplier: 0.7, enemySpeed: 50, spawnInterval: 1.2, pattern: ['villager', 'basic'] },
            { enemyCount: 25, enemyHealth_multiplier: 0.9, enemySpeed: 50, spawnInterval: 1.2, pattern: ['villager', 'basic', 'beefyenemy'] },
            { enemyCount: 28, enemyHealth_multiplier: 1.1, enemySpeed: 50, spawnInterval: 1.2, pattern: ['villager', 'basic', 'beefyenemy'] },
            { enemyCount: 1, enemyHealth_multiplier: 28, enemySpeed: 30, spawnInterval: 1, pattern: ['beefyenemy'] }
        ];

        return (wave > 0 && wave <= waveConfigs.length) ? waveConfigs[wave - 1] : null;
    }
}
