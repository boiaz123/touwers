import { LevelBase } from '../LevelBase.js';

export class DesertLevel5 extends LevelBase {
    static levelMetadata = {
        name: 'Dusty Expanse',
        difficulty: 'Hard',
        order: 5,
        campaign: 'desert'
    };

    constructor() {
        super();
        this.levelName = DesertLevel5.levelMetadata.name;
        this.levelNumber = DesertLevel5.levelMetadata.order;
        this.difficulty = DesertLevel5.levelMetadata.difficulty;
        this.campaign = DesertLevel5.levelMetadata.campaign;
        this.maxWaves = 15;
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
            { type: 'vegetation', gridX: 8.00, gridY: 2.00, size: 1.3 },
            { type: 'vegetation', gridX: 16.00, gridY: 4.00, size: 1.0 },
            { type: 'vegetation', gridX: 28.00, gridY: 7.00, size: 1.2 },
            { type: 'vegetation', gridX: 52.00, gridY: 9.00, size: 1.1 },
            { type: 'vegetation', gridX: 65.00, gridY: 5.00, size: 1.2 }
        ];
    }

    createMeanderingPath() {
        const pathInGridCoords = [
            { gridX: 7.00, gridY: 0.00 },
            { gridX: 7.00, gridY: 16.00 },
            { gridX: 20.00, gridY: 16.00 },
            { gridX: 20.00, gridY: 6.00 },
            { gridX: 36.00, gridY: 6.00 },
            { gridX: 36.00, gridY: 18.00 },
            { gridX: 60.00, gridY: 18.00 }
        ];
        this.path = pathInGridCoords.map(point => ({ x: Math.round(point.gridX * this.cellSize), y: Math.round(point.gridY * this.cellSize) }));
    }

    getWaveConfig(wave) {
        const waveConfigs = [
            { enemyCount: 24, enemyHealth_multiplier: 1.05, enemySpeed: 46, spawnInterval: 1.6, pattern: ['basic'] },
            { enemyCount: 24, enemyHealth_multiplier: 1.15, enemySpeed: 46, spawnInterval: 1.5, pattern: ['villager'] },
            { enemyCount: 28, enemyHealth_multiplier: 1.25, enemySpeed: 46, spawnInterval: 1.4, pattern: ['villager', 'basic'] },
            { enemyCount: 16, enemyHealth_multiplier: 1.15, enemySpeed: 66, spawnInterval: 1.9, pattern: ['villager', 'basic'] },
            { enemyCount: 24, enemyHealth_multiplier: 1.45, enemySpeed: 51, spawnInterval: 1.3, pattern: ['villager', 'basic'] },
            { enemyCount: 16, enemyHealth_multiplier: 3.2, enemySpeed: 41, spawnInterval: 1.1, pattern: ['beefyenemy'] },
            { enemyCount: 20, enemyHealth_multiplier: 3.2, enemySpeed: 41, spawnInterval: 1.1, pattern: ['beefyenemy'] },
            { enemyCount: 54, enemyHealth_multiplier: 0.85, enemySpeed: 56, spawnInterval: 0.9, pattern: ['villager'] },
            { enemyCount: 54, enemyHealth_multiplier: 0.85, enemySpeed: 56, spawnInterval: 0.9, pattern: ['villager', 'basic'] },
            { enemyCount: 32, enemyHealth_multiplier: 1.05, enemySpeed: 56, spawnInterval: 0.9, pattern: ['villager', 'basic', 'beefyenemy'] },
            { enemyCount: 34, enemyHealth_multiplier: 1.25, enemySpeed: 56, spawnInterval: 0.9, pattern: ['villager', 'basic', 'beefyenemy'] },
            { enemyCount: 39, enemyHealth_multiplier: 1.15, enemySpeed: 52, spawnInterval: 0.8, pattern: ['villager', 'basic', 'beefyenemy'] },
            { enemyCount: 18, enemyHealth_multiplier: 1.05, enemySpeed: 47, spawnInterval: 0.7, pattern: ['villager', 'basic', 'beefyenemy'] },
            { enemyCount: 10, enemyHealth_multiplier: 1.2, enemySpeed: 50, spawnInterval: 0.6, pattern: ['beefyenemy'] },
            { enemyCount: 1, enemyHealth_multiplier: 34, enemySpeed: 36, spawnInterval: 1, pattern: ['beefyenemy'] }
        ];
        return (wave > 0 && wave <= waveConfigs.length) ? waveConfigs[wave - 1] : null;
    }
}
