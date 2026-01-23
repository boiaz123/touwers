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
        this.terrainElements = [
            // Space rocks
            { type: 'rock', gridX: 5.00, gridY: 10.00, size: 1.0 },
            { type: 'rock', gridX: 16.00, gridY: 3.00, size: 1.0 },
            { type: 'rock', gridX: 28.00, gridY: 22.00, size: 1.0 },
            { type: 'rock', gridX: 40.00, gridY: 8.00, size: 1.0 },
            { type: 'rock', gridX: 50.00, gridY: 18.00, size: 1.0 },
            { type: 'rock', gridX: 12.00, gridY: 30.00, size: 1.0 },
            { type: 'rock', gridX: 38.00, gridY: 32.00, size: 1.0 },
            { type: 'rock', gridX: 56.00, gridY: 28.00, size: 1.0 },
            
            // Space vegetation (crystals and alien growths)
            { type: 'vegetation', gridX: 8.00, gridY: 26.00, size: 1.0 },
            { type: 'vegetation', gridX: 20.00, gridY: 12.00, size: 1.1 },
            { type: 'vegetation', gridX: 34.00, gridY: 5.00, size: 1.2 },
            { type: 'vegetation', gridX: 48.00, gridY: 32.00, size: 1.0 },
            { type: 'vegetation', gridX: 25.00, gridY: 28.00, size: 1.1 },
            { type: 'vegetation', gridX: 52.00, gridY: 10.00, size: 1.3 },
            
            // More alien vegetation
            { type: 'vegetation', gridX: 14.00, gridY: 18.00, size: 1.1 },
            { type: 'vegetation', gridX: 32.00, gridY: 12.00, size: 1.0 },
            { type: 'vegetation', gridX: 44.00, gridY: 20.00, size: 1.2 },
            { type: 'vegetation', gridX: 10.00, gridY: 4.00, size: 1.0 },
            { type: 'vegetation', gridX: 58.00, gridY: 5.00, size: 1.1 }
        ];
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
