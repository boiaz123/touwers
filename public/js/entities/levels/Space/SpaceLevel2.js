import { LevelBase } from '../LevelBase.js';

export class SpaceLevel2 extends LevelBase {
    static levelMetadata = { name: 'Nebula Core', difficulty: 'Hard', order: 2, campaign: 'space' };
    constructor() {
        super();
        this.levelName = SpaceLevel2.levelMetadata.name;
        this.levelNumber = SpaceLevel2.levelMetadata.order;
        this.difficulty = SpaceLevel2.levelMetadata.difficulty;
        this.campaign = SpaceLevel2.levelMetadata.campaign;
        this.maxWaves = 16;
        this.setVisualConfig({
            grassColors: { top: '#1a3a5a', upper: '#2a4a7a', lower: '#1a5a8a', bottom: '#0a3a6a' },
            grassPatchDensity: 9000,
            pathBaseColor: '#5a7a9a',
            edgeBushColor: '#3a6a5a',
            edgeRockColor: '#6a5a9a',
            edgeGrassColor: '#4a8aaa',
            flowerDensity: 30000
        });
        this.terrainElements = [];
    }
    createMeanderingPath() {
        const pathInGridCoords = [{ gridX: 0, gridY: 16.875 }, { gridX: 18, gridY: 5 }, { gridX: 36, gridY: 28 }, { gridX: 54, gridY: 12 }, { gridX: 60, gridY: 20 }];
        this.path = pathInGridCoords.map(point => ({ x: Math.round(point.gridX * this.cellSize), y: Math.round(point.gridY * this.cellSize) }));
    }
    getWaveConfig(wave) {
        const waveConfigs = Array(16).fill(null).map((_, i) => ({
            enemyCount: 16 + i * 3,
            enemyHealth_multiplier: 1 + i * 0.18,
            enemySpeed: 38 + i * 2.5,
            spawnInterval: Math.max(0.7, 2 - i * 0.12),
            pattern: ['basic', 'villager', 'archer', 'mage']
        }));
        return (wave > 0 && wave <= waveConfigs.length) ? waveConfigs[wave - 1] : null;
    }
}
