import { LevelBase } from '../LevelBase.js';

export class ForestLevel2 extends LevelBase {
    static levelMetadata = {
        name: 'Forrest Road',
        difficulty: 'Easy',
        order: 2,
        campaign: 'forest'
    };

    constructor() {
        super();
        this.levelName = ForestLevel2.levelMetadata.name;
        this.levelNumber = ForestLevel2.levelMetadata.order;
        this.difficulty = ForestLevel2.levelMetadata.difficulty;
        this.campaign = ForestLevel2.levelMetadata.campaign;
        this.maxWaves = 14;
        
        this.setVisualConfig({
            grassColors: {
                top: '#008000',
                upper: '#008040',
                lower: '#008040',
                bottom: '#004040'
            },
            grassPatchDensity: 7000,
            pathBaseColor: '#673434',
            edgeBushColor: '#0f3f0f',
            edgeRockColor: '#c0c0c0',
            edgeGrassColor: '#1a6a1a',
            flowerDensity: 50000
        });

        this.terrainElements = [];
    }

    createMeanderingPath() {
        const pathInGridCoords = [
            { gridX: 60.00, gridY: 6.00 },
            { gridX: 43.00, gridY: 6.00 },
            { gridX: 43.00, gridY: 13.00 },
            { gridX: 23.00, gridY: 13.00 },
            { gridX: 23.00, gridY: 27.00 },
            { gridX: 32.00, gridY: 27.00 }
        ];

        this.path = pathInGridCoords.map(point => ({
            x: Math.round(point.gridX * this.cellSize),
            y: Math.round(point.gridY * this.cellSize)
        }));
    }

    getWaveConfig(wave) {
        const waveConfigs = [
            { enemyCount: 12, enemyHealth_multiplier: 1, enemySpeed: 35, spawnInterval: 2, pattern: ['villager'] },
            { enemyCount: 15, enemyHealth_multiplier: 1, enemySpeed: 35, spawnInterval: 1.9, pattern: ['villager', 'basic'] },
            { enemyCount: 20, enemyHealth_multiplier: 1, enemySpeed: 35, spawnInterval: 1.8, pattern: ['villager', 'basic'] },
            { enemyCount: 14, enemyHealth_multiplier: 1, enemySpeed: 55, spawnInterval: 2.4, pattern: ['villager', 'basic'] },
            { enemyCount: 16, enemyHealth_multiplier: 1.25, enemySpeed: 40, spawnInterval: 1.7, pattern: ['archer'] },
            { enemyCount: 12, enemyHealth_multiplier: 2.5, enemySpeed: 30, spawnInterval: 1.5, pattern: ['beefyenemy'] },
            { enemyCount: 16, enemyHealth_multiplier: 2.5, enemySpeed: 30, spawnInterval: 1.5, pattern: ['beefyenemy'] },
            { enemyCount: 42, enemyHealth_multiplier: 0.6, enemySpeed: 65, spawnInterval: 1.3, pattern: ['villager'] },
            { enemyCount: 42, enemyHealth_multiplier: 0.6, enemySpeed: 65, spawnInterval: 1.3, pattern: ['villager', 'basic'] },
            { enemyCount: 22, enemyHealth_multiplier: 0.8, enemySpeed: 45, spawnInterval: 1.3, pattern: ['villager', 'basic', 'beefyenemy'] },
            { enemyCount: 25, enemyHealth_multiplier: 1, enemySpeed: 45, spawnInterval: 1.3, pattern: ['villager', 'basic', 'beefyenemy'] },
            { enemyCount: 4, enemyHealth_multiplier: 20, enemySpeed: 30, spawnInterval: 2, pattern: ['beefyenemy'] },
            { enemyCount: 44, enemyHealth_multiplier: 2, enemySpeed: 55, spawnInterval: 1.3, pattern: ['archer', 'villager'] },
            { enemyCount: 1, enemyHealth_multiplier: 34, enemySpeed: 30, spawnInterval: 2, pattern: ['knight'] }
        ];

        return (wave > 0 && wave <= waveConfigs.length) ? waveConfigs[wave - 1] : null;
    }
}
