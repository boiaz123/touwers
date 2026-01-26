import { LevelBase } from '../LevelBase.js';

export class DesertLevel6 extends LevelBase {
    static levelMetadata = { name: 'Pharaohs Haven', difficulty: 'Hard', order: 6, campaign: 'desert' };

    constructor() {
        super();
        this.levelName = DesertLevel6.levelMetadata.name;
        this.levelNumber = 6;
        this.difficulty = DesertLevel6.levelMetadata.difficulty;
        this.campaign = DesertLevel6.levelMetadata.campaign;
        this.maxWaves = 15;
        this.setVisualConfig({
            grassColors: { top: '#e8d5a0', upper: '#dcc979', lower: '#d0b852', bottom: '#c4a140' },
            grassPatchDensity: 10000, pathBaseColor: '#b89968',
            edgeBushColor: '#8a6f2a', edgeBushAccentColor: '#a88f3a',
            edgeRockColor: '#9a8a6a', edgeGrassColor: '#d9a652',
            flowerDensity: 150000
        });
        this.terrainElements = [
            { type: 'vegetation', gridX: 11.00, gridY: 3.00, size: 1.2 },
            { type: 'vegetation', gridX: 32.00, gridY: 8.00, size: 1.1 },
            { type: 'vegetation', gridX: 54.00, gridY: 10.00, size: 1.3 }
        ];
    }

    createMeanderingPath() {
        const pathInGridCoords = [
            { gridX: 7.00, gridY: 0.00 }, { gridX: 7.00, gridY: 14.00 },
            { gridX: 18.00, gridY: 14.00 }, { gridX: 18.00, gridY: 4.00 },
            { gridX: 34.00, gridY: 4.00 }, { gridX: 34.00, gridY: 16.00 },
            { gridX: 62.00, gridY: 16.00 }
        ];
        this.path = pathInGridCoords.map(point => ({ x: Math.round(point.gridX * this.cellSize), y: Math.round(point.gridY * this.cellSize) }));
    }

    getWaveConfig(wave) {
        const waveConfigs = [
            { enemyCount: 26, enemyHealth_multiplier: 1.1, enemySpeed: 48, spawnInterval: 1.5, pattern: ['basic'] },
            { enemyCount: 26, enemyHealth_multiplier: 1.2, enemySpeed: 48, spawnInterval: 1.4, pattern: ['villager'] },
            { enemyCount: 30, enemyHealth_multiplier: 1.3, enemySpeed: 48, spawnInterval: 1.3, pattern: ['villager', 'basic'] },
            { enemyCount: 18, enemyHealth_multiplier: 1.2, enemySpeed: 68, spawnInterval: 1.8, pattern: ['villager', 'basic'] },
            { enemyCount: 26, enemyHealth_multiplier: 1.5, enemySpeed: 53, spawnInterval: 1.2, pattern: ['villager', 'basic'] },
            { enemyCount: 18, enemyHealth_multiplier: 3.4, enemySpeed: 43, spawnInterval: 1.0, pattern: ['beefyenemy'] },
            { enemyCount: 22, enemyHealth_multiplier: 3.4, enemySpeed: 43, spawnInterval: 1.0, pattern: ['beefyenemy'] },
            { enemyCount: 56, enemyHealth_multiplier: 0.9, enemySpeed: 58, spawnInterval: 0.8, pattern: ['villager'] },
            { enemyCount: 56, enemyHealth_multiplier: 0.9, enemySpeed: 58, spawnInterval: 0.8, pattern: ['villager', 'basic'] },
            { enemyCount: 34, enemyHealth_multiplier: 1.1, enemySpeed: 58, spawnInterval: 0.8, pattern: ['villager', 'basic', 'beefyenemy'] },
            { enemyCount: 36, enemyHealth_multiplier: 1.3, enemySpeed: 58, spawnInterval: 0.8, pattern: ['villager', 'basic', 'beefyenemy'] },
            { enemyCount: 41, enemyHealth_multiplier: 1.2, enemySpeed: 54, spawnInterval: 0.7, pattern: ['villager', 'basic', 'beefyenemy'] },
            { enemyCount: 20, enemyHealth_multiplier: 1.1, enemySpeed: 49, spawnInterval: 0.6, pattern: ['villager', 'basic', 'beefyenemy'] },
            { enemyCount: 12, enemyHealth_multiplier: 1.3, enemySpeed: 52, spawnInterval: 0.5, pattern: ['beefyenemy'] },
            { enemyCount: 1, enemyHealth_multiplier: 36, enemySpeed: 38, spawnInterval: 1, pattern: ['beefyenemy'] }
        ];
        return (wave > 0 && wave <= waveConfigs.length) ? waveConfigs[wave - 1] : null;
    }
}
