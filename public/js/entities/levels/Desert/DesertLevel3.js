import { LevelBase } from '../LevelBase.js';

export class DesertLevel3 extends LevelBase {
    static levelMetadata = {
        name: 'Scorched Plains',
        difficulty: 'Medium',
        order: 3,
        campaign: 'desert'
    };

    constructor() {
        super();
        this.levelName = DesertLevel3.levelMetadata.name;
        this.levelNumber = DesertLevel3.levelMetadata.order;
        this.difficulty = DesertLevel3.levelMetadata.difficulty;
        this.campaign = DesertLevel3.levelMetadata.campaign;
        this.maxWaves = 13;
        
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
            { type: 'vegetation', gridX: 10.00, gridY: 4.00, size: 1.1 },
            { type: 'vegetation', gridX: 20.00, gridY: 3.00, size: 1.2 },
            { type: 'vegetation', gridX: 32.00, gridY: 5.00, size: 1.0 },
            { type: 'vegetation', gridX: 48.00, gridY: 7.00, size: 1.3 },
            { type: 'vegetation', gridX: 60.00, gridY: 4.00, size: 1.1 },
            { type: 'rock', gridX: 15.00, gridY: 15.00, size: 1.0 },
            { type: 'rock', gridX: 40.00, gridY: 20.00, size: 1.0 }
        ];
    }

    createMeanderingPath() {
        const pathInGridCoords = [
            { gridX: 7.00, gridY: 0.00 },
            { gridX: 7.00, gridY: 20.00 },
            { gridX: 25.00, gridY: 20.00 },
            { gridX: 25.00, gridY: 10.00 },
            { gridX: 40.00, gridY: 10.00 },
            { gridX: 40.00, gridY: 22.00 },
            { gridX: 55.00, gridY: 22.00 }
        ];
        this.path = pathInGridCoords.map(point => ({ x: Math.round(point.gridX * this.cellSize), y: Math.round(point.gridY * this.cellSize) }));
    }

    getWaveConfig(wave) {
        const waveConfigs = [
            { enemyCount: 20, enemyHealth_multiplier: 0.95, enemySpeed: 42, spawnInterval: 1.8, pattern: ['basic'] },
            { enemyCount: 20, enemyHealth_multiplier: 1.05, enemySpeed: 42, spawnInterval: 1.7, pattern: ['villager'] },
            { enemyCount: 24, enemyHealth_multiplier: 1.15, enemySpeed: 42, spawnInterval: 1.6, pattern: ['villager', 'basic'] },
            { enemyCount: 12, enemyHealth_multiplier: 1.05, enemySpeed: 62, spawnInterval: 2.1, pattern: ['villager', 'basic'] },
            { enemyCount: 20, enemyHealth_multiplier: 1.35, enemySpeed: 47, spawnInterval: 1.5, pattern: ['villager', 'basic'] },
            { enemyCount: 12, enemyHealth_multiplier: 2.8, enemySpeed: 37, spawnInterval: 1.3, pattern: ['beefyenemy'] },
            { enemyCount: 16, enemyHealth_multiplier: 2.8, enemySpeed: 37, spawnInterval: 1.3, pattern: ['beefyenemy'] },
            { enemyCount: 50, enemyHealth_multiplier: 0.75, enemySpeed: 52, spawnInterval: 1.1, pattern: ['villager'] },
            { enemyCount: 50, enemyHealth_multiplier: 0.75, enemySpeed: 52, spawnInterval: 1.1, pattern: ['villager', 'basic'] },
            { enemyCount: 28, enemyHealth_multiplier: 0.95, enemySpeed: 52, spawnInterval: 1.1, pattern: ['villager', 'basic', 'beefyenemy'] },
            { enemyCount: 30, enemyHealth_multiplier: 1.15, enemySpeed: 52, spawnInterval: 1.1, pattern: ['villager', 'basic', 'beefyenemy'] },
            { enemyCount: 35, enemyHealth_multiplier: 1.05, enemySpeed: 48, spawnInterval: 1.0, pattern: ['villager', 'basic', 'beefyenemy'] },
            { enemyCount: 1, enemyHealth_multiplier: 30, enemySpeed: 32, spawnInterval: 1, pattern: ['beefyenemy'] }
        ];
        return (wave > 0 && wave <= waveConfigs.length) ? waveConfigs[wave - 1] : null;
    }
}
