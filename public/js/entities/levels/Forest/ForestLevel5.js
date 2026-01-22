import { LevelBase } from '../LevelBase.js';

export class ForestLevel5 extends LevelBase {
    static levelMetadata = {
        name: 'Placeholder Level',
        difficulty: 'Hard',
        order: 5,
        campaign: 'forest'
    };

    constructor() {
        super();
        this.levelName = ForestLevel5.levelMetadata.name;
        this.levelNumber = ForestLevel5.levelMetadata.order;
        this.difficulty = ForestLevel5.levelMetadata.difficulty;
        this.campaign = ForestLevel5.levelMetadata.campaign;
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
            { type: 'vegetation', gridX: 8.00, gridY: 8.00, size: 1.5 },
            { type: 'vegetation', gridX: 10.00, gridY: 6.00, size: 1.5 },
            { type: 'vegetation', gridX: 12.00, gridY: 8.00, size: 1.5 },
            { type: 'vegetation', gridX: 14.00, gridY: 7.00, size: 1.5 },
            { type: 'vegetation', gridX: 16.00, gridY: 9.00, size: 1.5 },
            { type: 'vegetation', gridX: 18.00, gridY: 7.00, size: 1.5 },
            { type: 'vegetation', gridX: 20.00, gridY: 8.00, size: 1.5 },
            { type: 'vegetation', gridX: 22.00, gridY: 6.00, size: 1.5 },
            { type: 'vegetation', gridX: 24.00, gridY: 8.00, size: 1.5 },
            { type: 'vegetation', gridX: 26.00, gridY: 7.00, size: 1.5 },
            { type: 'vegetation', gridX: 28.00, gridY: 9.00, size: 1.5 },
            { type: 'vegetation', gridX: 30.00, gridY: 7.00, size: 1.5 },
            { type: 'vegetation', gridX: 32.00, gridY: 8.00, size: 1.5 },
            { type: 'vegetation', gridX: 34.00, gridY: 6.00, size: 1.5 },
            { type: 'vegetation', gridX: 36.00, gridY: 8.00, size: 1.5 },
            { type: 'vegetation', gridX: 38.00, gridY: 7.00, size: 1.5 },
            { type: 'vegetation', gridX: 40.00, gridY: 9.00, size: 1.5 },
            { type: 'vegetation', gridX: 42.00, gridY: 7.00, size: 1.5 },
            { type: 'vegetation', gridX: 44.00, gridY: 8.00, size: 1.5 },
            { type: 'vegetation', gridX: 46.00, gridY: 6.00, size: 1.5 },
            { type: 'vegetation', gridX: 48.00, gridY: 8.00, size: 1.5 },
            { type: 'vegetation', gridX: 50.00, gridY: 7.00, size: 1.5 },
            { type: 'vegetation', gridX: 52.00, gridY: 9.00, size: 1.5 },
            { type: 'rock', gridX: 7.00, gridY: 4.00, size: 1.5 },
            { type: 'rock', gridX: 17.00, gridY: 5.00, size: 1.5 },
            { type: 'rock', gridX: 27.00, gridY: 4.00, size: 1.5 },
            { type: 'rock', gridX: 37.00, gridY: 5.00, size: 1.5 },
            { type: 'rock', gridX: 47.00, gridY: 4.00, size: 1.5 },
            { type: 'rock', gridX: 57.00, gridY: 5.00, size: 1.5 },
            { type: 'vegetation', gridX: 10.00, gridY: 28.00, size: 1.5 },
            { type: 'vegetation', gridX: 12.00, gridY: 26.00, size: 1.5 },
            { type: 'vegetation', gridX: 14.00, gridY: 28.00, size: 1.5 },
            { type: 'vegetation', gridX: 16.00, gridY: 27.00, size: 1.5 },
            { type: 'vegetation', gridX: 18.00, gridY: 29.00, size: 1.5 },
            { type: 'vegetation', gridX: 20.00, gridY: 27.00, size: 1.5 },
            { type: 'vegetation', gridX: 22.00, gridY: 28.00, size: 1.5 },
            { type: 'rock', gridX: 9.00, gridY: 24.00, size: 1.5 },
            { type: 'rock', gridX: 19.00, gridY: 25.00, size: 1.5 }
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
            { enemyCount: 10, enemyHealth_multiplier: 1.0, enemySpeed: 35, spawnInterval: 1.5, pattern: ['basic'] },
            { enemyCount: 14, enemyHealth_multiplier: 1.1, enemySpeed: 36, spawnInterval: 1.5, pattern: ['basic', 'basic', 'villager'] },
            { enemyCount: 17, enemyHealth_multiplier: 1.2, enemySpeed: 38, spawnInterval: 1.5, pattern: ['basic', 'villager', 'basic'] },
            { enemyCount: 20, enemyHealth_multiplier: 1.3, enemySpeed: 40, spawnInterval: 1.5, pattern: ['basic', 'archer', 'villager'] },
            { enemyCount: 22, enemyHealth_multiplier: 1.4, enemySpeed: 42, spawnInterval: 1.3, pattern: ['basic', 'villager', 'archer', 'basic'] },
            { enemyCount: 24, enemyHealth_multiplier: 1.5, enemySpeed: 44, spawnInterval: 1.3, pattern: ['archer', 'basic', 'villager', 'archer'] },
            { enemyCount: 24, enemyHealth_multiplier: 1.6, enemySpeed: 46, spawnInterval: 1.3, pattern: ['villager', 'archer', 'basic', 'archer'] },
            { enemyCount: 24, enemyHealth_multiplier: 1.7, enemySpeed: 48, spawnInterval: 1.2, pattern: ['archer', 'archer', 'basic', 'villager'] },
            { enemyCount: 26, enemyHealth_multiplier: 1.8, enemySpeed: 50, spawnInterval: 1.1, pattern: ['archer', 'villager', 'basic', 'archer', 'villager'] },
            { enemyCount: 30, enemyHealth_multiplier: 1.9, enemySpeed: 52, spawnInterval: 1.0, pattern: ['archer', 'archer', 'villager', 'basic', 'archer'] }
        ];
        
        return (wave > 0 && wave <= waveConfigs.length) ? waveConfigs[wave - 1] : null;
    }
}

