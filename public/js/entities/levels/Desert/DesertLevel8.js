import { LevelBase } from '../LevelBase.js';

export class DesertLevel8 extends LevelBase {
    static levelMetadata = { name: 'Endless Sands', difficulty: 'Expert', order: 8, campaign: 'desert' };

    constructor() {
        super();
        this.levelName = DesertLevel8.levelMetadata.name;
        this.levelNumber = 8;
        this.difficulty = DesertLevel8.levelMetadata.difficulty;
        this.campaign = DesertLevel8.levelMetadata.campaign;
        this.maxWaves = 16;
        this.setVisualConfig({
            grassColors: { top: '#e8d5a0', upper: '#dcc979', lower: '#d0b852', bottom: '#c4a140' },
            grassPatchDensity: 10000, pathBaseColor: '#b89968',
            edgeBushColor: '#8a6f2a', edgeBushAccentColor: '#a88f3a',
            edgeRockColor: '#9a8a6a', edgeGrassColor: '#d9a652',
            flowerDensity: 150000
        });
        this.terrainElements = [
            { type: 'vegetation', gridX: 9.00, gridY: 6.00, size: 1.1 },
            { type: 'vegetation', gridX: 26.00, gridY: 10.00, size: 1.2 },
            { type: 'vegetation', gridX: 48.00, gridY: 12.00, size: 1.0 }
        ];
    }

    createMeanderingPath() {
        const pathInGridCoords = [
            { gridX: 7.00, gridY: 0.00 }, { gridX: 7.00, gridY: 10.00 },
            { gridX: 14.00, gridY: 10.00 }, { gridX: 14.00, gridY: 0.00 },
            { gridX: 30.00, gridY: 0.00 }, { gridX: 30.00, gridY: 12.00 },
            { gridX: 66.00, gridY: 12.00 }
        ];
        this.path = pathInGridCoords.map(point => ({ x: Math.round(point.gridX * this.cellSize), y: Math.round(point.gridY * this.cellSize) }));
    }

    getWaveConfig(wave) {
        const waveConfigs = [
            { enemyCount: 30, enemyHealth_multiplier: 1.2, enemySpeed: 52, spawnInterval: 1.3, pattern: ['basic'] },
            { enemyCount: 30, enemyHealth_multiplier: 1.3, enemySpeed: 52, spawnInterval: 1.2, pattern: ['villager'] },
            { enemyCount: 34, enemyHealth_multiplier: 1.4, enemySpeed: 52, spawnInterval: 1.1, pattern: ['villager', 'basic'] },
            { enemyCount: 22, enemyHealth_multiplier: 1.3, enemySpeed: 72, spawnInterval: 1.6, pattern: ['villager', 'basic'] },
            { enemyCount: 30, enemyHealth_multiplier: 1.6, enemySpeed: 57, spawnInterval: 1.0, pattern: ['villager', 'basic'] },
            { enemyCount: 22, enemyHealth_multiplier: 3.8, enemySpeed: 47, spawnInterval: 0.8, pattern: ['beefyenemy'] },
            { enemyCount: 26, enemyHealth_multiplier: 3.8, enemySpeed: 47, spawnInterval: 0.8, pattern: ['beefyenemy'] },
            { enemyCount: 60, enemyHealth_multiplier: 1.0, enemySpeed: 62, spawnInterval: 0.6, pattern: ['villager'] },
            { enemyCount: 60, enemyHealth_multiplier: 1.0, enemySpeed: 62, spawnInterval: 0.6, pattern: ['villager', 'basic'] },
            { enemyCount: 38, enemyHealth_multiplier: 1.2, enemySpeed: 62, spawnInterval: 0.6, pattern: ['villager', 'basic', 'beefyenemy'] },
            { enemyCount: 40, enemyHealth_multiplier: 1.4, enemySpeed: 62, spawnInterval: 0.6, pattern: ['villager', 'basic', 'beefyenemy'] },
            { enemyCount: 45, enemyHealth_multiplier: 1.3, enemySpeed: 58, spawnInterval: 0.5, pattern: ['villager', 'basic', 'beefyenemy'] },
            { enemyCount: 24, enemyHealth_multiplier: 1.2, enemySpeed: 53, spawnInterval: 0.4, pattern: ['villager', 'basic', 'beefyenemy'] },
            { enemyCount: 16, enemyHealth_multiplier: 1.4, enemySpeed: 56, spawnInterval: 0.3, pattern: ['beefyenemy'] },
            { enemyCount: 10, enemyHealth_multiplier: 1.5, enemySpeed: 50, spawnInterval: 0.3, pattern: ['beefyenemy'] },
            { enemyCount: 1, enemyHealth_multiplier: 40, enemySpeed: 42, spawnInterval: 1, pattern: ['beefyenemy'] }
        ];
        return (wave > 0 && wave <= waveConfigs.length) ? waveConfigs[wave - 1] : null;
    }
}
