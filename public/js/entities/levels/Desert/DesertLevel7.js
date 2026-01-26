import { LevelBase } from '../LevelBase.js';

export class DesertLevel7 extends LevelBase {
    static levelMetadata = { name: 'Heat Mirage', difficulty: 'Hard', order: 7, campaign: 'desert' };

    constructor() {
        super();
        this.levelName = DesertLevel7.levelMetadata.name;
        this.levelNumber = 7;
        this.difficulty = DesertLevel7.levelMetadata.difficulty;
        this.campaign = DesertLevel7.levelMetadata.campaign;
        this.maxWaves = 16;
        this.setVisualConfig({
            grassColors: { top: '#e8d5a0', upper: '#dcc979', lower: '#d0b852', bottom: '#c4a140' },
            grassPatchDensity: 10000, pathBaseColor: '#b89968',
            edgeBushColor: '#8a6f2a', edgeBushAccentColor: '#a88f3a',
            edgeRockColor: '#9a8a6a', edgeGrassColor: '#d9a652',
            flowerDensity: 150000
        });
        this.terrainElements = [
            { type: 'vegetation', gridX: 6.00, gridY: 5.00, size: 1.2 },
            { type: 'vegetation', gridX: 24.00, gridY: 9.00, size: 1.0 },
            { type: 'vegetation', gridX: 45.00, gridY: 11.00, size: 1.3 }
        ];
    }

    createMeanderingPath() {
        const pathInGridCoords = [
            { gridX: 7.00, gridY: 0.00 }, { gridX: 7.00, gridY: 12.00 },
            { gridX: 16.00, gridY: 12.00 }, { gridX: 16.00, gridY: 2.00 },
            { gridX: 32.00, gridY: 2.00 }, { gridX: 32.00, gridY: 14.00 },
            { gridX: 64.00, gridY: 14.00 }
        ];
        this.path = pathInGridCoords.map(point => ({ x: Math.round(point.gridX * this.cellSize), y: Math.round(point.gridY * this.cellSize) }));
    }

    getWaveConfig(wave) {
        const waveConfigs = [
            { enemyCount: 28, enemyHealth_multiplier: 1.15, enemySpeed: 50, spawnInterval: 1.4, pattern: ['basic'] },
            { enemyCount: 28, enemyHealth_multiplier: 1.25, enemySpeed: 50, spawnInterval: 1.3, pattern: ['villager'] },
            { enemyCount: 32, enemyHealth_multiplier: 1.35, enemySpeed: 50, spawnInterval: 1.2, pattern: ['villager', 'basic'] },
            { enemyCount: 20, enemyHealth_multiplier: 1.25, enemySpeed: 70, spawnInterval: 1.7, pattern: ['villager', 'basic'] },
            { enemyCount: 28, enemyHealth_multiplier: 1.55, enemySpeed: 55, spawnInterval: 1.1, pattern: ['villager', 'basic'] },
            { enemyCount: 20, enemyHealth_multiplier: 3.6, enemySpeed: 45, spawnInterval: 0.9, pattern: ['beefyenemy'] },
            { enemyCount: 24, enemyHealth_multiplier: 3.6, enemySpeed: 45, spawnInterval: 0.9, pattern: ['beefyenemy'] },
            { enemyCount: 58, enemyHealth_multiplier: 0.95, enemySpeed: 60, spawnInterval: 0.7, pattern: ['villager'] },
            { enemyCount: 58, enemyHealth_multiplier: 0.95, enemySpeed: 60, spawnInterval: 0.7, pattern: ['villager', 'basic'] },
            { enemyCount: 36, enemyHealth_multiplier: 1.15, enemySpeed: 60, spawnInterval: 0.7, pattern: ['villager', 'basic', 'beefyenemy'] },
            { enemyCount: 38, enemyHealth_multiplier: 1.35, enemySpeed: 60, spawnInterval: 0.7, pattern: ['villager', 'basic', 'beefyenemy'] },
            { enemyCount: 43, enemyHealth_multiplier: 1.25, enemySpeed: 56, spawnInterval: 0.6, pattern: ['villager', 'basic', 'beefyenemy'] },
            { enemyCount: 22, enemyHealth_multiplier: 1.15, enemySpeed: 51, spawnInterval: 0.5, pattern: ['villager', 'basic', 'beefyenemy'] },
            { enemyCount: 14, enemyHealth_multiplier: 1.35, enemySpeed: 54, spawnInterval: 0.4, pattern: ['beefyenemy'] },
            { enemyCount: 8, enemyHealth_multiplier: 1.4, enemySpeed: 48, spawnInterval: 0.4, pattern: ['beefyenemy'] },
            { enemyCount: 1, enemyHealth_multiplier: 38, enemySpeed: 40, spawnInterval: 1, pattern: ['beefyenemy'] }
        ];
        return (wave > 0 && wave <= waveConfigs.length) ? waveConfigs[wave - 1] : null;
    }
}
