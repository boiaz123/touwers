import { LevelBase } from '../LevelBase.js';

export class DesertLevel4 extends LevelBase {
    static levelMetadata = {
        name: 'Mirage Valley',
        difficulty: 'Medium',
        order: 4,
        campaign: 'desert'
    };

    constructor() {
        super();
        this.levelName = DesertLevel4.levelMetadata.name;
        this.levelNumber = DesertLevel4.levelMetadata.order;
        this.difficulty = DesertLevel4.levelMetadata.difficulty;
        this.campaign = DesertLevel4.levelMetadata.campaign;
        this.maxWaves = 14;
        
        this.setVisualConfig({
            grassColors: { top: '#e8d5a0', upper: '#dcc979', lower: '#d0b852', bottom: '#c4a140' },
            grassPatchDensity: 10000,
            pathBaseColor: '#b89968',
            edgeBushColor: '#8a6f2a',
            edgeBushAccentColor: '#a88f3a',
            edgeRockColor: '#9a8a6a',
            edgeGrassColor: '#d9a652',
            flowerDensity: 150000
        });

        this.terrainElements = [
            { type: 'vegetation', gridX: 9.00, gridY: 3.00, size: 1.2 },
            { type: 'vegetation', gridX: 18.00, gridY: 5.00, size: 1.1 },
            { type: 'vegetation', gridX: 30.00, gridY: 6.00, size: 1.3 },
            { type: 'vegetation', gridX: 50.00, gridY: 8.00, size: 1.0 },
            { type: 'vegetation', gridX: 63.00, gridY: 3.00, size: 1.2 },
            { type: 'rock', gridX: 20.00, gridY: 18.00, size: 1.0 },
            { type: 'rock', gridX: 50.00, gridY: 25.00, size: 1.0 }
        ];
    }

    createMeanderingPath() {
        const pathInGridCoords = [
            { gridX: 7.00, gridY: 0.00 },
            { gridX: 7.00, gridY: 18.00 },
            { gridX: 22.00, gridY: 18.00 },
            { gridX: 22.00, gridY: 8.00 },
            { gridX: 38.00, gridY: 8.00 },
            { gridX: 38.00, gridY: 20.00 },
            { gridX: 58.00, gridY: 20.00 }
        ];
        this.path = pathInGridCoords.map(point => ({ x: Math.round(point.gridX * this.cellSize), y: Math.round(point.gridY * this.cellSize) }));
    }

    getWaveConfig(wave) {
        const waveConfigs = [
            { enemyCount: 22, enemyHealth_multiplier: 1.0, enemySpeed: 44, spawnInterval: 1.7, pattern: ['basic'] },
            { enemyCount: 22, enemyHealth_multiplier: 1.1, enemySpeed: 44, spawnInterval: 1.6, pattern: ['villager'] },
            { enemyCount: 26, enemyHealth_multiplier: 1.2, enemySpeed: 44, spawnInterval: 1.5, pattern: ['villager', 'basic'] },
            { enemyCount: 14, enemyHealth_multiplier: 1.1, enemySpeed: 64, spawnInterval: 2.0, pattern: ['villager', 'basic'] },
            { enemyCount: 22, enemyHealth_multiplier: 1.4, enemySpeed: 49, spawnInterval: 1.4, pattern: ['villager', 'basic'] },
            { enemyCount: 14, enemyHealth_multiplier: 3.0, enemySpeed: 39, spawnInterval: 1.2, pattern: ['beefyenemy'] },
            { enemyCount: 18, enemyHealth_multiplier: 3.0, enemySpeed: 39, spawnInterval: 1.2, pattern: ['beefyenemy'] },
            { enemyCount: 52, enemyHealth_multiplier: 0.8, enemySpeed: 54, spawnInterval: 1.0, pattern: ['villager'] },
            { enemyCount: 52, enemyHealth_multiplier: 0.8, enemySpeed: 54, spawnInterval: 1.0, pattern: ['villager', 'basic'] },
            { enemyCount: 30, enemyHealth_multiplier: 1.0, enemySpeed: 54, spawnInterval: 1.0, pattern: ['villager', 'basic', 'beefyenemy'] },
            { enemyCount: 32, enemyHealth_multiplier: 1.2, enemySpeed: 54, spawnInterval: 1.0, pattern: ['villager', 'basic', 'beefyenemy'] },
            { enemyCount: 37, enemyHealth_multiplier: 1.1, enemySpeed: 50, spawnInterval: 0.9, pattern: ['villager', 'basic', 'beefyenemy'] },
            { enemyCount: 15, enemyHealth_multiplier: 1.0, enemySpeed: 45, spawnInterval: 0.8, pattern: ['villager', 'basic', 'beefyenemy'] },
            { enemyCount: 1, enemyHealth_multiplier: 32, enemySpeed: 34, spawnInterval: 1, pattern: ['beefyenemy'] }
        ];
        return (wave > 0 && wave <= waveConfigs.length) ? waveConfigs[wave - 1] : null;
    }
}
