import { LevelBase } from '../LevelBase.js';

export class DesertLevel10 extends LevelBase {
    static levelMetadata = { name: 'Final Oasis', difficulty: 'Expert', order: 10, campaign: 'desert' };

    constructor() {
        super();
        this.levelName = DesertLevel10.levelMetadata.name;
        this.levelNumber = 10;
        this.difficulty = DesertLevel10.levelMetadata.difficulty;
        this.campaign = DesertLevel10.levelMetadata.campaign;
        this.maxWaves = 18;
        this.setVisualConfig({
            grassColors: { top: '#e8d5a0', upper: '#dcc979', lower: '#d0b852', bottom: '#c4a140' },
            grassPatchDensity: 10000, pathBaseColor: '#b89968',
            edgeBushColor: '#8a6f2a', edgeBushAccentColor: '#a88f3a',
            edgeRockColor: '#9a8a6a', edgeGrassColor: '#d9a652',
            flowerDensity: 150000
        });
        this.terrainElements = [
            { type: 'vegetation', gridX: 8.00, gridY: 5.00, size: 1.4 },
            { type: 'vegetation', gridX: 45.00, gridY: 8.00, size: 1.3 },
            { type: 'vegetation', gridX: 65.00, gridY: 14.00, size: 1.2 }
        ];
    }

    createMeanderingPath() {
        const pathInGridCoords = [
            { gridX: 5.00, gridY: 0.00 }, { gridX: 5.00, gridY: 6.00 },
            { gridX: 18.00, gridY: 6.00 }, { gridX: 18.00, gridY: 12.00 },
            { gridX: 38.00, gridY: 12.00 }, { gridX: 38.00, gridY: 3.00 },
            { gridX: 70.00, gridY: 3.00 }
        ];
        this.path = pathInGridCoords.map(point => ({ x: Math.round(point.gridX * this.cellSize), y: Math.round(point.gridY * this.cellSize) }));
    }

    getWaveConfig(wave) {
        const waveConfigs = [
            { enemyCount: 35, enemyHealth_multiplier: 1.3, enemySpeed: 56, spawnInterval: 1.1, pattern: ['basic'] },
            { enemyCount: 35, enemyHealth_multiplier: 1.4, enemySpeed: 56, spawnInterval: 1.0, pattern: ['villager'] },
            { enemyCount: 40, enemyHealth_multiplier: 1.5, enemySpeed: 56, spawnInterval: 0.9, pattern: ['villager', 'basic'] },
            { enemyCount: 28, enemyHealth_multiplier: 1.4, enemySpeed: 76, spawnInterval: 1.3, pattern: ['villager', 'basic'] },
            { enemyCount: 36, enemyHealth_multiplier: 1.7, enemySpeed: 61, spawnInterval: 0.8, pattern: ['villager', 'basic'] },
            { enemyCount: 26, enemyHealth_multiplier: 4.25, enemySpeed: 51, spawnInterval: 0.6, pattern: ['beefyenemy'] },
            { enemyCount: 30, enemyHealth_multiplier: 4.25, enemySpeed: 51, spawnInterval: 0.6, pattern: ['beefyenemy'] },
            { enemyCount: 68, enemyHealth_multiplier: 1.1, enemySpeed: 66, spawnInterval: 0.4, pattern: ['villager'] },
            { enemyCount: 68, enemyHealth_multiplier: 1.1, enemySpeed: 66, spawnInterval: 0.4, pattern: ['villager', 'basic'] },
            { enemyCount: 44, enemyHealth_multiplier: 1.3, enemySpeed: 66, spawnInterval: 0.4, pattern: ['villager', 'basic', 'beefyenemy'] },
            { enemyCount: 46, enemyHealth_multiplier: 1.5, enemySpeed: 66, spawnInterval: 0.4, pattern: ['villager', 'basic', 'beefyenemy'] },
            { enemyCount: 50, enemyHealth_multiplier: 1.4, enemySpeed: 62, spawnInterval: 0.3, pattern: ['villager', 'basic', 'beefyenemy'] },
            { enemyCount: 28, enemyHealth_multiplier: 1.3, enemySpeed: 57, spawnInterval: 0.3, pattern: ['villager', 'basic', 'beefyenemy'] },
            { enemyCount: 20, enemyHealth_multiplier: 1.5, enemySpeed: 60, spawnInterval: 0.2, pattern: ['beefyenemy'] },
            { enemyCount: 14, enemyHealth_multiplier: 1.65, enemySpeed: 54, spawnInterval: 0.2, pattern: ['beefyenemy'] },
            { enemyCount: 10, enemyHealth_multiplier: 1.55, enemySpeed: 57, spawnInterval: 0.2, pattern: ['beefyenemy'] },
            { enemyCount: 6, enemyHealth_multiplier: 1.6, enemySpeed: 57, spawnInterval: 0.2, pattern: ['beefyenemy'] },
            { enemyCount: 1, enemyHealth_multiplier: 50, enemySpeed: 46, spawnInterval: 1, pattern: ['beefyenemy'] }
        ];
        return (wave > 0 && wave <= waveConfigs.length) ? waveConfigs[wave - 1] : null;
    }
}
