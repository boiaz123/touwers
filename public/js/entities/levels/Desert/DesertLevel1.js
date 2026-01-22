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

        this.terrainElements = [];
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
