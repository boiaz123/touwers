import { LevelBase } from '../LevelBase.js';

export class MountainLevel2 extends LevelBase {
    static levelMetadata = {
        name: 'Snowy Ridge',
        difficulty: 'Medium',
        order: 2,
        campaign: 'mountain'
    };

    constructor() {
        super();
        this.levelName = MountainLevel2.levelMetadata.name;
        this.levelNumber = MountainLevel2.levelMetadata.order;
        this.difficulty = MountainLevel2.levelMetadata.difficulty;
        this.campaign = MountainLevel2.levelMetadata.campaign;
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
            // Mountain rocks
            { type: 'rock', gridX: 8.00, gridY: 3.00, size: 1.1 },
            { type: 'rock', gridX: 18.00, gridY: 10.00, size: 1.2 },
            { type: 'rock', gridX: 28.00, gridY: 4.00, size: 1.0 },
            { type: 'rock', gridX: 40.00, gridY: 12.00, size: 1.3 },
            { type: 'rock', gridX: 50.00, gridY: 8.00, size: 1.1 },
            { type: 'rock', gridX: 12.00, gridY: 22.00, size: 1.2 },
            { type: 'rock', gridX: 35.00, gridY: 26.00, size: 1.0 },
            { type: 'rock', gridX: 55.00, gridY: 24.00, size: 1.1 },
            { type: 'rock', gridX: 22.00, gridY: 30.00, size: 1.2 },
            
            // Alpine vegetation (pine trees with snow)
            { type: 'vegetation', gridX: 6.00, gridY: 12.00, size: 1.0 },
            { type: 'vegetation', gridX: 16.00, gridY: 20.00, size: 1.1 },
            { type: 'vegetation', gridX: 32.00, gridY: 14.00, size: 1.0 },
            { type: 'vegetation', gridX: 45.00, gridY: 20.00, size: 1.2 },
            { type: 'vegetation', gridX: 58.00, gridY: 14.00, size: 1.0 },
            { type: 'vegetation', gridX: 10.00, gridY: 28.00, size: 1.1 },
            { type: 'vegetation', gridX: 42.00, gridY: 30.00, size: 1.0 },
            
            // More alpine plants
            { type: 'vegetation', gridX: 4.00, gridY: 20.00, size: 1.1 },
            { type: 'vegetation', gridX: 38.00, gridY: 8.00, size: 1.0 },
            { type: 'vegetation', gridX: 52.00, gridY: 18.00, size: 1.2 }
        ];
    }

    createMeanderingPath() {
        const pathInGridCoords = [
            { gridX: 0, gridY: 16.875 },
            { gridX: 15, gridY: 16.875 },
            { gridX: 30, gridY: 8.4375 },
            { gridX: 45, gridY: 25.3125 },
            { gridX: 60, gridY: 16.875 }
        ];

        this.path = pathInGridCoords.map(point => ({
            x: Math.round(point.gridX * this.cellSize),
            y: Math.round(point.gridY * this.cellSize)
        }));
    }

    getWaveConfig(wave) {
        const waveConfigs = [
            { enemyCount: 12, enemyHealth_multiplier: 1, enemySpeed: 35, spawnInterval: 2, pattern: ['villager'] },
            { enemyCount: 14, enemyHealth_multiplier: 1.1, enemySpeed: 36, spawnInterval: 1.9, pattern: ['villager', 'basic'] },
            { enemyCount: 17, enemyHealth_multiplier: 1.2, enemySpeed: 38, spawnInterval: 1.8, pattern: ['basic', 'villager', 'basic'] },
            { enemyCount: 20, enemyHealth_multiplier: 1.3, enemySpeed: 40, spawnInterval: 1.6, pattern: ['basic', 'archer', 'villager'] },
            { enemyCount: 22, enemyHealth_multiplier: 1.4, enemySpeed: 42, spawnInterval: 1.4, pattern: ['basic', 'villager', 'archer', 'basic'] },
            { enemyCount: 24, enemyHealth_multiplier: 1.5, enemySpeed: 44, spawnInterval: 1.3, pattern: ['archer', 'basic', 'villager', 'archer'] },
            { enemyCount: 24, enemyHealth_multiplier: 1.6, enemySpeed: 46, spawnInterval: 1.2, pattern: ['villager', 'archer', 'basic', 'archer'] },
            { enemyCount: 24, enemyHealth_multiplier: 1.7, enemySpeed: 48, spawnInterval: 1.1, pattern: ['archer', 'archer', 'basic', 'villager'] },
            { enemyCount: 26, enemyHealth_multiplier: 1.8, enemySpeed: 50, spawnInterval: 1.0, pattern: ['archer', 'villager', 'basic', 'archer', 'villager'] },
            { enemyCount: 30, enemyHealth_multiplier: 1.9, enemySpeed: 52, spawnInterval: 0.9, pattern: ['archer', 'archer', 'villager', 'basic', 'archer'] },
            { enemyCount: 35, enemyHealth_multiplier: 2, enemySpeed: 55, spawnInterval: 0.8, pattern: ['archer', 'villager', 'basic', 'archer', 'villager', 'mage'] },
            { enemyCount: 1, enemyHealth_multiplier: 50, enemySpeed: 40, spawnInterval: 1, pattern: ['knight'] }
        ];
        
        return (wave > 0 && wave <= waveConfigs.length) ? waveConfigs[wave - 1] : null;
    }
}
