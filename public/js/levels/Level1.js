import { LevelBase } from '../LevelBase.js';

export class Level1 extends LevelBase {
    constructor() {
        super();
        this.levelName = 'The King\'s Road';
        this.levelNumber = 1;
        this.difficulty = 'Easy';
        this.maxWaves = 10;
        console.log('Level1: Initialized');
    }
    
    createMeanderingPath(canvasWidth, canvasHeight) {
        // Shorter path for Level 1 - simple S-curve
        const safeWidth = Math.max(800, canvasWidth);
        const safeHeight = Math.max(600, canvasHeight);
        
        this.path = [
            // Start left, middle height
            { x: 0, y: safeHeight * 0.5 },
            
            // First turn - go up and right
            { x: safeWidth * 0.2, y: safeHeight * 0.5 },
            { x: safeWidth * 0.2, y: safeHeight * 0.25 },
            
            // Second turn - go right and down
            { x: safeWidth * 0.5, y: safeHeight * 0.25 },
            { x: safeWidth * 0.5, y: safeHeight * 0.75 },
            
            // Final stretch - go right to end
            { x: safeWidth * 0.8, y: safeHeight * 0.75 }
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
            { enemyCount: 10, enemyHealth_multiplier: 1., enemySpeed: 35, spawnInterval: 1.5, pattern: ['basic'] },
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
