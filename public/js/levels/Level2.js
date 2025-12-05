import { LevelBase } from '../LevelBase.js';

export class Level2 extends LevelBase {
    constructor() {
        super();
        this.levelName = 'Braab\'s Road';
        this.levelNumber = 2;
        this.difficulty = 'Braab';
        this.maxWaves = 14;
        console.log('Level2: Initialized');
    }
    
    createMeanderingPath(canvasWidth, canvasHeight) {
        // Shorter path for Level 1 - simple S-curve
        const safeWidth = Math.max(800, canvasWidth);
        const safeHeight = Math.max(600, canvasHeight);
        
        this.path = [
            // Start left, middle height
            { x: safeHeight * 0.4, y: safeHeight * 0.1},
            
            // First turn - go up and right
            { x: safeWidth * 0.6, y: safeHeight * 0.2 },
            { x: safeWidth * 0.25, y: safeHeight * 0.45 },
            
            // Second turn - go right and down
            { x: safeWidth * 0.45, y: safeHeight * 0.65 },
            { x: safeWidth * 0.55, y: safeHeight * 0.77 },
            
           
            
            
            // third turn - go right and down
            { x: safeWidth * 0.7, y: safeHeight * 0.60 },
            { x: safeWidth * 0.9, y: safeHeight * 0.85 },
            
            // Final stretch - go right to end
            { x: safeWidth * 0.6, y: safeHeight * 0.9 }
        ];
        
        // Ensure all path points are within canvas bounds
        this.path = this.path.map(point => ({
            x: Math.max(0, Math.min(safeWidth, point.x)),
            y: Math.max(0, Math.min(safeHeight, point.y))
        }));
        
        console.log('Level1: Shorter S-curve path created, first point:', this.path[0], 'last point:', this.path[this.path.length - 1]);
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
            { enemyCount: 30, enemyHealth_multiplier: 9,enemySpeed: 520, spawnInterval:  1.0, pattern: ['beefyenemy', 'beefyenemy', 'beefyenemy', 'archer', 'villager'] },
            { enemyCount: 35, enemyHealth_multiplier: .1, enemySpeed: 53, spawnInterval: 0.9, pattern: ['beefyenemy', 'archer', 'villager', 'beefyenemy'] },
            { enemyCount: 80, enemyHealth_multiplier: .1, enemySpeed: 5000, spawnInterval: 2.5, pattern: ['frog'] },
            { enemyCount: 45, enemyHealth_multiplier: .3, enemySpeed: 570, spawnInterval: 0.7, pattern: ['basic', 'villager', 'beefyenemy', 'archer', 'mage', 'shieldknight'] },
            { enemyCount: 5, enemyHealth_multiplier: .8, enemySpeed: 30, spawnInterval: 1, pattern: ['knight'] }
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
