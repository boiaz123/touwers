import { LevelBase } from '../LevelBase.js';

export class DesertLevel9 extends LevelBase {
    static levelMetadata = { name: 'Inferno Ridge', difficulty: 'Expert', order: 9, campaign: 'desert' };

    constructor() {
        super();
        this.levelName = DesertLevel9.levelMetadata.name;
        this.levelNumber = 9;
        this.difficulty = DesertLevel9.levelMetadata.difficulty;
        this.campaign = DesertLevel9.levelMetadata.campaign;
        this.maxWaves = 17;
        this.setVisualConfig({
            grassColors: { top: '#e8d5a0', upper: '#dcc979', lower: '#d0b852', bottom: '#c4a140' },
            grassPatchDensity: 10000, pathBaseColor: '#b89968',
            edgeBushColor: '#8a6f2a', edgeBushAccentColor: '#a88f3a',
            edgeRockColor: '#9a8a6a', edgeGrassColor: '#d9a652',
            flowerDensity: 150000
        });
        this.terrainElements = [
            { type: 'vegetation', gridX: 5.00, gridY: 7.00, size: 1.3 },
            { type: 'vegetation', gridX: 22.00, gridY: 11.00, size: 1.1 },
            { type: 'vegetation', gridX: 50.00, gridY: 13.00, size: 1.2 }
        ];
    }

    createMeanderingPath() {
        const pathInGridCoords = [
            { gridX: 7.00, gridY: 0.00 }, { gridX: 7.00, gridY: 8.00 },
            { gridX: 12.00, gridY: 8.00 }, { gridX: 12.00, gridY: -2.00 },
            { gridX: 28.00, gridY: -2.00 }, { gridX: 28.00, gridY: 10.00 },
            { gridX: 68.00, gridY: 10.00 }
        ];
        this.path = pathInGridCoords.map(point => ({ x: Math.round(point.gridX * this.cellSize), y: Math.round(point.gridY * this.cellSize) }));
    }

    getWaveConfig(wave) {
        const waveConfigs = [
            { enemyCount: 32, enemyHealth_multiplier: 1.25, enemySpeed: 54, spawnInterval: 1.2, pattern: ['basic'] },
            { enemyCount: 32, enemyHealth_multiplier: 1.35, enemySpeed: 54, spawnInterval: 1.1, pattern: ['villager'] },
            { enemyCount: 36, enemyHealth_multiplier: 1.45, enemySpeed: 54, spawnInterval: 1.0, pattern: ['villager', 'basic'] },
            { enemyCount: 24, enemyHealth_multiplier: 1.35, enemySpeed: 74, spawnInterval: 1.5, pattern: ['villager', 'basic'] },
            { enemyCount: 32, enemyHealth_multiplier: 1.65, enemySpeed: 59, spawnInterval: 0.9, pattern: ['villager', 'basic'] },
            { enemyCount: 24, enemyHealth_multiplier: 4.0, enemySpeed: 49, spawnInterval: 0.7, pattern: ['beefyenemy'] },
            { enemyCount: 28, enemyHealth_multiplier: 4.0, enemySpeed: 49, spawnInterval: 0.7, pattern: ['beefyenemy'] },
            { enemyCount: 62, enemyHealth_multiplier: 1.05, enemySpeed: 64, spawnInterval: 0.5, pattern: ['villager'] },
            { enemyCount: 62, enemyHealth_multiplier: 1.05, enemySpeed: 64, spawnInterval: 0.5, pattern: ['villager', 'basic'] },
            { enemyCount: 40, enemyHealth_multiplier: 1.25, enemySpeed: 64, spawnInterval: 0.5, pattern: ['villager', 'basic', 'beefyenemy'] },
            { enemyCount: 42, enemyHealth_multiplier: 1.45, enemySpeed: 64, spawnInterval: 0.5, pattern: ['villager', 'basic', 'beefyenemy'] },
            { enemyCount: 47, enemyHealth_multiplier: 1.35, enemySpeed: 60, spawnInterval: 0.4, pattern: ['villager', 'basic', 'beefyenemy'] },
            { enemyCount: 26, enemyHealth_multiplier: 1.25, enemySpeed: 55, spawnInterval: 0.3, pattern: ['villager', 'basic', 'beefyenemy'] },
            { enemyCount: 18, enemyHealth_multiplier: 1.45, enemySpeed: 58, spawnInterval: 0.2, pattern: ['beefyenemy'] },
            { enemyCount: 12, enemyHealth_multiplier: 1.6, enemySpeed: 52, spawnInterval: 0.2, pattern: ['beefyenemy'] },
            { enemyCount: 8, enemyHealth_multiplier: 1.5, enemySpeed: 55, spawnInterval: 0.2, pattern: ['beefyenemy'] },
            { enemyCount: 1, enemyHealth_multiplier: 42, enemySpeed: 44, spawnInterval: 1, pattern: ['beefyenemy'] }
        ];
        return (wave > 0 && wave <= waveConfigs.length) ? waveConfigs[wave - 1] : null;
    }
}
