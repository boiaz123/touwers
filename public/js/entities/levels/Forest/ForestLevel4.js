import { LevelBase } from '../LevelBase.js';

export class ForestLevel4 extends LevelBase {
    static levelMetadata = {
        name: 'Dave\'s Cave',
        difficulty: 'Medium',
        order: 4,
        campaign: 'forest'
    };

    constructor() {
        super();
        this.levelName = ForestLevel4.levelMetadata.name;
        this.levelNumber = ForestLevel4.levelMetadata.order;
        this.difficulty = ForestLevel4.levelMetadata.difficulty;
        this.campaign = ForestLevel4.levelMetadata.campaign;
        this.maxWaves = 10;
        
        this.setVisualConfig({
            grassColors: {
                top: '#2a2a3a',
                upper: '#3a3a4a',
                lower: '#4a4a5a',
                bottom: '#1a1a2a'
            },
            grassPatchDensity: 12000,
            pathBaseColor: '#6b6b5b',
            edgeBushColor: '#0f3f0f',
            edgeRockColor: '#666666',
            edgeGrassColor: '#1a6a1a'
        });

        this.terrainElements = [
            { type: 'vegetation', gridX: 10.00, gridY: 15.00, size: 1.5 },
            { type: 'vegetation', gridX: 12.00, gridY: 14.00, size: 1.5 },
            { type: 'vegetation', gridX: 14.00, gridY: 16.00, size: 1.5 },
            { type: 'vegetation', gridX: 16.00, gridY: 15.00, size: 1.5 },
            { type: 'vegetation', gridX: 18.00, gridY: 14.00, size: 1.5 },
            { type: 'vegetation', gridX: 20.00, gridY: 16.00, size: 1.5 },
            { type: 'vegetation', gridX: 22.00, gridY: 15.00, size: 1.5 },
            { type: 'vegetation', gridX: 24.00, gridY: 14.00, size: 1.5 },
            { type: 'vegetation', gridX: 26.00, gridY: 16.00, size: 1.5 },
            { type: 'vegetation', gridX: 28.00, gridY: 15.00, size: 1.5 },
            { type: 'vegetation', gridX: 30.00, gridY: 14.00, size: 1.5 },
            { type: 'vegetation', gridX: 32.00, gridY: 16.00, size: 1.5 },
            { type: 'vegetation', gridX: 34.00, gridY: 15.00, size: 1.5 },
            { type: 'vegetation', gridX: 36.00, gridY: 14.00, size: 1.5 },
            { type: 'vegetation', gridX: 38.00, gridY: 16.00, size: 1.5 },
            { type: 'vegetation', gridX: 40.00, gridY: 15.00, size: 1.5 },
            { type: 'vegetation', gridX: 42.00, gridY: 14.00, size: 1.5 },
            { type: 'vegetation', gridX: 44.00, gridY: 16.00, size: 1.5 },
            { type: 'vegetation', gridX: 46.00, gridY: 15.00, size: 1.5 },
            { type: 'vegetation', gridX: 48.00, gridY: 14.00, size: 1.5 },
            { type: 'vegetation', gridX: 50.00, gridY: 16.00, size: 1.5 },
            { type: 'rock', gridX: 8.00, gridY: 10.00, size: 1.5 },
            { type: 'rock', gridX: 15.00, gridY: 12.00, size: 1.5 },
            { type: 'rock', gridX: 25.00, gridY: 10.00, size: 1.5 },
            { type: 'rock', gridX: 35.00, gridY: 12.00, size: 1.5 },
            { type: 'rock', gridX: 45.00, gridY: 10.00, size: 1.5 },
            { type: 'rock', gridX: 55.00, gridY: 12.00, size: 1.5 }
        ];
    }
    
    createMeanderingPath() {
        const gridWidth = this.gridWidth || 60;
        const gridHeight = this.gridHeight || 33.75;
        
        const pathInGridCoords = [
            { gridX: 0, gridY: gridHeight * 0.5 },
            { gridX: gridWidth * 0.2, gridY: gridHeight * 0.5 },
            { gridX: gridWidth * 0.2, gridY: gridHeight * 0.25 },
            { gridX: gridWidth * 0.5, gridY: gridHeight * 0.25 },
            { gridX: gridWidth * 0.5, gridY: gridHeight * 0.75 },
            { gridX: gridWidth * 0.8, gridY: gridHeight * 0.75 }
        ];
        
        this.path = pathInGridCoords.map(point => ({
            x: Math.round(point.gridX * this.cellSize),
            y: Math.round(point.gridY * this.cellSize)
        }));
    }
    
    getWaveConfig(wave) {
        const waveConfigs = [
            { enemyCount: 10, enemyHealth_multiplier: 1.0, enemySpeed: 35, spawnInterval: 1.5, pattern: ['shieldknight'] },
            { enemyCount: 14, enemyHealth_multiplier: 1.1, enemySpeed: 36, spawnInterval: 1.5, pattern: ['knight'] },
            { enemyCount: 17, enemyHealth_multiplier: 1.2, enemySpeed: 38, spawnInterval: 1.5, pattern: ['mage'] },
            { enemyCount: 20, enemyHealth_multiplier: 1.3, enemySpeed: 40, spawnInterval: 1.5, pattern: ['basic', 'archer', 'villager'] },
            { enemyCount: 22, enemyHealth_multiplier: 1.4, enemySpeed: 42, spawnInterval: 1.3, pattern: ['basic', 'villager', 'archer', 'basic'] },
            { enemyCount: 24, enemyHealth_multiplier: 1.5, enemySpeed: 44, spawnInterval: 1.3, pattern: ['archer', 'basic', 'villager', 'archer'] },
            { enemyCount: 24, enemyHealth_multiplier: 1.6, enemySpeed: 46, spawnInterval: 1.3, pattern: ['villager', 'archer', 'basic', 'archer'] },
            { enemyCount: 24, enemyHealth_multiplier: 1.7, enemySpeed: 48, spawnInterval: 1.2, pattern: ['archer', 'archer', 'basic', 'villager'] },
            { enemyCount: 26, enemyHealth_multiplier: 1.8, enemySpeed: 50, spawnInterval: 1.1, pattern: ['archer', 'villager', 'basic', 'archer', 'villager'] },
            { enemyCount: 30, enemyHealth_multiplier: 1.9, enemySpeed: 52, spawnInterval: 1.0, pattern: ['basic', 'villager', 'beefyenemy', 'archer', 'mage', 'knight', 'shieldknight', 'frog'] }
        ];
        
        return (wave > 0 && wave <= waveConfigs.length) ? waveConfigs[wave - 1] : null;
    }
}

