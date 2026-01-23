import { LevelBase } from '../LevelBase.js';

export class MountainLevel1 extends LevelBase {
    static levelMetadata = {
        name: 'Frosty Peak',
        difficulty: 'Easy',
        order: 1,
        campaign: 'mountain'
    };

    constructor() {
        super();
        this.levelName = MountainLevel1.levelMetadata.name;
        this.levelNumber = MountainLevel1.levelMetadata.order;
        this.difficulty = MountainLevel1.levelMetadata.difficulty;
        this.campaign = MountainLevel1.levelMetadata.campaign;
        this.maxWaves = 12;
        
        this.setVisualConfig({
            grassColors: {
                top: '#e8e8f0',
                upper: '#d8d8e0',
                lower: '#c8c8d0',
                bottom: '#b8b8c0'
            },
            grassPatchDensity: 12000,
            pathBaseColor: '#a9a9a9',
            edgeBushColor: '#1a3a2a',
            edgeBushAccentColor: '#2a5a4a',
            edgeRockColor: '#6a7a7a',
            edgeGrassColor: '#dcdce0',
            flowerDensity: 80000
        });

        this.terrainElements = [
            // Mountain rocks - lots of them
            { type: 'rock', gridX: 10.00, gridY: 5.00, size: 1.0 },
            { type: 'rock', gridX: 20.00, gridY: 2.00, size: 1.0 },
            { type: 'rock', gridX: 32.00, gridY: 8.00, size: 1.0 },
            { type: 'rock', gridX: 45.00, gridY: 4.00, size: 1.0 },
            { type: 'rock', gridX: 55.00, gridY: 10.00, size: 1.0 },
            { type: 'rock', gridX: 5.00, gridY: 15.00, size: 1.0 },
            { type: 'rock', gridX: 25.00, gridY: 20.00, size: 1.0 },
            { type: 'rock', gridX: 40.00, gridY: 25.00, size: 1.0 },
            { type: 'rock', gridX: 15.00, gridY: 28.00, size: 1.0 },
            { type: 'rock', gridX: 50.00, gridY: 30.00, size: 1.0 },
            
            // Alpine vegetation (pine trees with snow)
            { type: 'vegetation', gridX: 12.00, gridY: 18.00, size: 1.0 },
            { type: 'vegetation', gridX: 28.00, gridY: 12.00, size: 1.1 },
            { type: 'vegetation', gridX: 38.00, gridY: 18.00, size: 1.0 },
            { type: 'vegetation', gridX: 8.00, gridY: 25.00, size: 1.2 },
            { type: 'vegetation', gridX: 48.00, gridY: 16.00, size: 1.1 },
            { type: 'vegetation', gridX: 20.00, gridY: 30.00, size: 1.0 },
            { type: 'vegetation', gridX: 58.00, gridY: 20.00, size: 1.1 },
            
            // More alpine plants
            { type: 'vegetation', gridX: 6.00, gridY: 8.00, size: 1.1 },
            { type: 'vegetation', gridX: 35.00, gridY: 15.00, size: 1.0 },
            { type: 'vegetation', gridX: 52.00, gridY: 22.00, size: 1.2 }
        ];
    }

    createMeanderingPath() {
        const pathInGridCoords = [
            { gridX: 7.00, gridY: 0.00 },
            { gridX: 7.00, gridY: 25.00 },
            { gridX: 19.00, gridY: 25.00 },
            { gridX: 19.00, gridY: 16.00 },
            { gridX: 30.00, gridY: 16.00 },
            { gridX: 30.00, gridY: 22.00 },
            { gridX: 44.00, gridY: 22.00 }
        ];

        this.path = pathInGridCoords.map(point => ({
            x: Math.round(point.gridX * this.cellSize),
            y: Math.round(point.gridY * this.cellSize)
        }));
    }

    getWaveConfig(wave) {
        const waveConfigs = [
            { enemyCount: 15, enemyHealth_multiplier: 0.8, enemySpeed: 35, spawnInterval: 2.0, pattern: ['basic'] },
            { enemyCount: 15, enemyHealth_multiplier: 1, enemySpeed: 35, spawnInterval: 1.9, pattern: ['villager'] },
            { enemyCount: 20, enemyHealth_multiplier: 1, enemySpeed: 35, spawnInterval: 1.8, pattern: ['villager', 'basic'] },
            { enemyCount: 8, enemyHealth_multiplier: 1, enemySpeed: 55, spawnInterval: 2.4, pattern: ['villager', 'basic'] },
            { enemyCount: 16, enemyHealth_multiplier: 1.25, enemySpeed: 40, spawnInterval: 1.7, pattern: ['villager', 'basic'] },
            { enemyCount: 8, enemyHealth_multiplier: 2.5, enemySpeed: 30, spawnInterval: 1.5, pattern: ['beefyenemy'] },
            { enemyCount: 12, enemyHealth_multiplier: 2.5, enemySpeed: 30, spawnInterval: 1.5, pattern: ['beefyenemy'] },
            { enemyCount: 42, enemyHealth_multiplier: 0.6, enemySpeed: 45, spawnInterval: 1.3, pattern: ['villager'] },
            { enemyCount: 42, enemyHealth_multiplier: 0.6, enemySpeed: 45, spawnInterval: 1.3, pattern: ['villager', 'basic'] },
            { enemyCount: 22, enemyHealth_multiplier: 0.8, enemySpeed: 45, spawnInterval: 1.3, pattern: ['villager', 'basic', 'beefyenemy'] },
            { enemyCount: 25, enemyHealth_multiplier: 1, enemySpeed: 45, spawnInterval: 1.3, pattern: ['villager', 'basic', 'beefyenemy'] },
            { enemyCount: 1, enemyHealth_multiplier: 25, enemySpeed: 25, spawnInterval: 1, pattern: ['beefyenemy'] }
        ];

        return (wave > 0 && wave <= waveConfigs.length) ? waveConfigs[wave - 1] : null;
    }
}
