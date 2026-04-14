import { LevelBase } from '../LevelBase.js';

export class MountainLevel4 extends LevelBase {
    static levelMetadata = { name: 'Avalanche Pass', difficulty: 'Hard', order: 4, campaign: 'mountain' };
    constructor() {
        super();
        this.levelName = MountainLevel4.levelMetadata.name;
        this.levelNumber = MountainLevel4.levelMetadata.order;
        this.difficulty = MountainLevel4.levelMetadata.difficulty;
        this.campaign = MountainLevel4.levelMetadata.campaign;
        this.maxWaves = 1;
        this.setVisualConfig({
            grassColors: { top: '#e8e8f0', upper: '#d8d8e0', lower: '#c8c8d0', bottom: '#b8b8c0' },
            grassPatchDensity: 12000,
            pathBaseColor: '#a9a9a9',
            edgeBushColor: '#1a3a2a',
            edgeRockColor: '#6a7a7a',
            edgeGrassColor: '#dcdce0',
            flowerDensity: 80000
        });
        this.terrainElements = [
            // Mountain rocks
            { type: 'rock', gridX: 6.00, gridY: 6.00, size: 1.0 },
            { type: 'rock', gridX: 16.00, gridY: 2.00, size: 1.0 },
            { type: 'rock', gridX: 26.00, gridY: 10.00, size: 1.0 },
            { type: 'rock', gridX: 36.00, gridY: 4.00, size: 1.0 },
            { type: 'rock', gridX: 48.00, gridY: 12.00, size: 1.0 },
            { type: 'rock', gridX: 58.00, gridY: 6.00, size: 1.0 },
            { type: 'rock', gridX: 14.00, gridY: 24.00, size: 1.0 },
            { type: 'rock', gridX: 32.00, gridY: 28.00, size: 1.0 },
            { type: 'rock', gridX: 50.00, gridY: 26.00, size: 1.0 },
            
            // Alpine vegetation (pine trees with snow)
            { type: 'vegetation', gridX: 8.00, gridY: 14.00, size: 1.0 },
            { type: 'vegetation', gridX: 20.00, gridY: 18.00, size: 1.1 },
            { type: 'vegetation', gridX: 34.00, gridY: 16.00, size: 1.0 },
            { type: 'vegetation', gridX: 44.00, gridY: 22.00, size: 1.2 },
            { type: 'vegetation', gridX: 10.00, gridY: 30.00, size: 1.1 },
            { type: 'vegetation', gridX: 56.00, gridY: 18.00, size: 1.0 },
            { type: 'vegetation', gridX: 40.00, gridY: 28.00, size: 1.1 },
            
            // More alpine plants
            { type: 'vegetation', gridX: 4.00, gridY: 10.00, size: 1.0 },
            { type: 'vegetation', gridX: 28.00, gridY: 20.00, size: 1.2 },
            { type: 'vegetation', gridX: 54.00, gridY: 24.00, size: 1.1 }
        ];
    }
    createMeanderingPath() {
        const pathInGridCoords = [{ gridX: 0, gridY: 16.875 }, { gridX: 20, gridY: 8 }, { gridX: 40, gridY: 25 }, { gridX: 60, gridY: 16.875 }];
        this.path = pathInGridCoords.map(point => ({ x: Math.round(point.gridX * this.cellSize), y: Math.round(point.gridY * this.cellSize) }));
    }
    getWaveConfig(wave) {
        const waveConfigs = [
            { enemyCount: 10, enemyHealth_multiplier: 1.0, speedMultiplier: 0.70, spawnInterval: 1.5, pattern: ['villager'] },
            // { enemyCount: 14, enemyHealth_multiplier: 1.1, speedMultiplier: 0.72, spawnInterval: 1.5, pattern: ['basic'] },
            // { enemyCount: 17, enemyHealth_multiplier: 1.2, speedMultiplier: 0.76, spawnInterval: 1.5, pattern: ['basic', 'villager'] },
            // { enemyCount: 20, enemyHealth_multiplier: 1.3, speedMultiplier: 0.80, spawnInterval: 1.5, pattern: ['basic', 'archer', 'villager'] },
            // { enemyCount: 22, enemyHealth_multiplier: 1.4, speedMultiplier: 0.70, spawnInterval: 1.3, pattern: ['archer', 'villager'] },
            // { enemyCount: 24, enemyHealth_multiplier: 1.5, speedMultiplier: 0.88, spawnInterval: 1.3, pattern: ['basic', 'villager', 'archer'] },
            // { enemyCount: 26, enemyHealth_multiplier: 1.6, speedMultiplier: 0.77, spawnInterval: 1.3, pattern: ['archer', 'basic', 'villager', 'archer'] },
            // { enemyCount: 28, enemyHealth_multiplier: 1.7, speedMultiplier: 0.80, spawnInterval: 1.2, pattern: ['archer', 'archer', 'basic', 'villager'] },
            // { enemyCount: 30, enemyHealth_multiplier: 1.8, speedMultiplier: 0.83, spawnInterval: 1.1, pattern: ['archer', 'villager', 'basic', 'archer'] },
            // { enemyCount: 1, enemyHealth_multiplier: 15, speedMultiplier: 0.58, spawnInterval: 1.0, pattern: ['beefyenemy'] }
        ];
        
        return (wave > 0 && wave <= waveConfigs.length) ? waveConfigs[wave - 1] : null;
    }
}
