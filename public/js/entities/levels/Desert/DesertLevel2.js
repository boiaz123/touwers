import { LevelBase } from '../LevelBase.js';

export class DesertLevel2 extends LevelBase {
    static levelMetadata = { name: 'Oasis Mirage', difficulty: 'Medium', order: 2, campaign: 'desert' };
    constructor() {
        super();
        this.levelName = DesertLevel2.levelMetadata.name;
        this.levelNumber = DesertLevel2.levelMetadata.order;
        this.difficulty = DesertLevel2.levelMetadata.difficulty;
        this.campaign = DesertLevel2.levelMetadata.campaign;
        this.maxWaves = 13;
        this.setVisualConfig({
            grassColors: { top: '#e8d5a0', upper: '#dcc979', lower: '#d0b852', bottom: '#c4a140' },
            grassPatchDensity: 10000,
            pathBaseColor: '#b89968',
            edgeBushColor: '#8a6f2a',
            edgeRockColor: '#9a8a6a',
            edgeGrassColor: '#d9a652',
            flowerDensity: 150000
        });
        this.terrainElements = [];
    }
    createMeanderingPath() {
        const pathInGridCoords = [{ gridX: 0, gridY: 16.875 }, { gridX: 15, gridY: 8 }, { gridX: 30, gridY: 25 }, { gridX: 45, gridY: 12 }, { gridX: 60, gridY: 22 }];
        this.path = pathInGridCoords.map(point => ({ x: Math.round(point.gridX * this.cellSize), y: Math.round(point.gridY * this.cellSize) }));
    }
    getWaveConfig(wave) {
        const waveConfigs = Array(13).fill(null).map((_, i) => ({
            enemyCount: 18 + i * 2,
            enemyHealth_multiplier: 0.9 + i * 0.12,
            enemySpeed: 40 + i * 1.5,
            spawnInterval: Math.max(0.9, 2 - i * 0.12),
            pattern: ['basic', 'villager', 'archer']
        }));
        return (wave > 0 && wave <= waveConfigs.length) ? waveConfigs[wave - 1] : null;
    }
}
