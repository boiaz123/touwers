import { LevelBase } from '../LevelBase.js';

export class MountainLevel3 extends LevelBase {
    static levelMetadata = { name: 'Avalanche Pass', difficulty: 'Hard', order: 3, campaign: 'mountain' };
    constructor() {
        super();
        this.levelName = MountainLevel3.levelMetadata.name;
        this.levelNumber = MountainLevel3.levelMetadata.order;
        this.difficulty = MountainLevel3.levelMetadata.difficulty;
        this.campaign = MountainLevel3.levelMetadata.campaign;
        this.maxWaves = 15;
        this.setVisualConfig({
            grassColors: { top: '#e8e8f0', upper: '#d8d8e0', lower: '#c8c8d0', bottom: '#b8b8c0' },
            grassPatchDensity: 12000,
            pathBaseColor: '#a9a9a9',
            edgeBushColor: '#1a3a2a',
            edgeRockColor: '#6a7a7a',
            edgeGrassColor: '#dcdce0',
            flowerDensity: 80000
        });
        this.terrainElements = [];
    }
    createMeanderingPath() {
        const pathInGridCoords = [{ gridX: 0, gridY: 16.875 }, { gridX: 20, gridY: 8 }, { gridX: 40, gridY: 25 }, { gridX: 60, gridY: 16.875 }];
        this.path = pathInGridCoords.map(point => ({ x: Math.round(point.gridX * this.cellSize), y: Math.round(point.gridY * this.cellSize) }));
    }
    getWaveConfig(wave) {
        const waveConfigs = Array(15).fill(null).map((_, i) => ({
            enemyCount: 15 + i * 2,
            enemyHealth_multiplier: 1 + i * 0.15,
            enemySpeed: 35 + i * 2,
            spawnInterval: Math.max(0.8, 2 - i * 0.1),
            pattern: ['basic', 'villager', 'archer']
        }));
        return (wave > 0 && wave <= waveConfigs.length) ? waveConfigs[wave - 1] : null;
    }
}
