import { LevelBase } from './LevelBase.js';

export class Level2 extends LevelBase {
    constructor() {
        super();
        this.levelName = 'Braab\'s Road';
        this.levelNumber = 2;
        this.difficulty = 'Braab';
        this.maxWaves = 14;
        
        // Customize visuals for Level 2
        this.setVisualConfig({
            grassColors: {
                top: '#852356ff',
                upper: '#3b1047ff',
                lower: '#4a4a5a',
                bottom: '#1a1a2a'
            },
            grassPatchDensity: 12000,
            grassPatchSizeMin: 10,
            grassPatchSizeMax: 20,
            dirtPatchCount: 20,
            dirtPatchAlpha: 0.25,
            flowerDensity: 2000,
            pathBaseColor: '#6f4f6fff',
            pathEdgeVegetationChance: 0.9,
            edgeBushColor: '#1d7b85ff',
            edgeRockColor: '#666666',
            edgeGrassColor: '#5c74ebff'
        });
        
// console.log('Level2: Initialized');
    }
    
    createMeanderingPath(canvasWidth, canvasHeight) {
        // Use GRID coordinates for consistency across resolutions
        const gridWidth = this.gridWidth || 60;
        const gridHeight = this.gridHeight || 33.75;
        
        const pathInGridCoords = [
            // Start left, top area
            { gridX: gridWidth * 0.4, gridY: gridHeight * 0.1},
            
            // First turn - go up and right
            { gridX: gridWidth * 0.6, gridY: gridHeight * 0.2 },
            { gridX: gridWidth * 0.25, gridY: gridHeight * 0.45 },
            
            // Second turn - go right and down
            { gridX: gridWidth * 0.45, gridY: gridHeight * 0.65 },
            { gridX: gridWidth * 0.55, gridY: gridHeight * 0.77 },
            
            // Third turn - go right and down
            { gridX: gridWidth * 0.7, gridY: gridHeight * 0.60 },
            { gridX: gridWidth * 0.9, gridY: gridHeight * 0.85 },
            
            // Final stretch - go right to end
            { gridX: gridWidth * 0.6, gridY: gridHeight * 0.9 }
        ];
        
        // Convert grid coordinates to screen coordinates
        this.path = pathInGridCoords.map(point => ({
            x: Math.round(point.gridX * this.cellSize),
            y: Math.round(point.gridY * this.cellSize)
        }));
        
// console.log('Level2: Path created in grid coords, first point:', this.path[0], 'last point:', this.path[this.path.length - 1]);
    }
    
    getWaveConfig(wave) {
        // Wave configuration - 10 waves with only basic, villager, archer
        const waveConfigs = [
            { enemyCount: 8, enemyHealth_multiplier:  .1,enemySpeed: 350, spawnInterval: 1.2, pattern: ['villager'] },
            { enemyCount: 12, enemyHealth_multiplier: .1,enemySpeed: 360, spawnInterval:  1.5, pattern: ['archer'] },
            { enemyCount: 10, enemyHealth_multiplier: .2,enemySpeed: 380, spawnInterval:  1.5, pattern: ['basic', 'beefyenemy', 'basic'] },
            { enemyCount: 12, enemyHealth_multiplier: .3,enemySpeed: 400, spawnInterval:  1.5, pattern: ['beefyenemy', 'archer'] },
            { enemyCount: 22, enemyHealth_multiplier: .4,enemySpeed: 420, spawnInterval:  1.3, pattern: ['beefyenemy', 'archer', 'beefyenemy'] },
            { enemyCount: 24, enemyHealth_multiplier: .5,enemySpeed: 44, spawnInterval:  1.3, pattern: ['basic', 'basic', 'villager', 'archer'] },
            { enemyCount: 100, enemyHealth_multiplier:.6, enemySpeed: 2000, spawnInterval:  1.3, pattern: ['villager'] },
            { enemyCount: 24, enemyHealth_multiplier: .7,enemySpeed: 480, spawnInterval:  1.2, pattern: ['archer', 'archer', 'basic', 'villager'] },
            { enemyCount: 13, enemyHealth_multiplier: .8, enemySpeed: 500, spawnInterval: 1.3, pattern: ['shieldknight'] },
            { enemyCount: 30, enemyHealth_multiplier: .9,enemySpeed: 520, spawnInterval:  1.0, pattern: ['beefyenemy', 'beefyenemy', 'beefyenemy', 'archer', 'villager'] },
            { enemyCount: 35, enemyHealth_multiplier: .1, enemySpeed: 53, spawnInterval: 0.9, pattern: ['beefyenemy', 'archer', 'villager', 'beefyenemy'] },
            { enemyCount: 80, enemyHealth_multiplier: .1, enemySpeed: 5000, spawnInterval: 2.5, pattern: ['frog'] },
            { enemyCount: 45, enemyHealth_multiplier: .3, enemySpeed: 570, spawnInterval: 0.7, pattern: ['basic', 'villager', 'beefyenemy', 'archer', 'mage', 'shieldknight'] },
            { enemyCount: 5, enemyHealth_multiplier: 1.8, enemySpeed: 30, spawnInterval: 1, pattern: ['knight'] },
            { enemyCount: 15, enemyHealth_multiplier: 1.8, enemySpeed: 300, spawnInterval: 1, pattern: ['knight', 'beefyenemy'] },
            { enemyCount: 25, enemyHealth_multiplier: 1.8, enemySpeed: 300, spawnInterval: 1, pattern: ['basic', 'basic', 'villager', 'archer'] },
            { enemyCount: 35, enemyHealth_multiplier: 1.8, enemySpeed: 300, spawnInterval: 1, pattern: ['shieldknight'] },
            { enemyCount: 45, enemyHealth_multiplier: 1.8, enemySpeed: 3000, spawnInterval: 1, pattern: ['frog'] },
            { enemyCount: 55, enemyHealth_multiplier: 1.8, enemySpeed: 300, spawnInterval: 1, pattern: ['knight', 'basic', 'villager', 'beefyenemy', 'archer', 'mage', 'shieldknight'] },
            { enemyCount: 60, enemyHealth_multiplier: 1.8, enemySpeed: 20, spawnInterval: 0.1, pattern: ['shieldknight'] }
        ];
        
        if (wave > 0 && wave <= waveConfigs.length) {
            return waveConfigs[wave - 1];
        }
        
        // Fallback for waves beyond 10
        return {
            enemyCount: 10,
            enemyHealth_multiplier: 2.0,
            enemySpeed: 55,
            spawnInterval: 0.6,
            pattern: ['basic', 'villager', 'archer']
        };
    }
}
