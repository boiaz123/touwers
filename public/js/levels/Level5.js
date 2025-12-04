import { LevelBase } from '../LevelBase.js';

export class Level5 extends LevelBase {
    constructor() {
        super();
        this.levelName = 'Placeholder Level';
        this.levelNumber = 5;
        this.difficulty = 'Easy';
        this.maxWaves = 10;
        console.log('Level5: Initialized');
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
            // Wave 1: Very easy intro - weak basic enemies only
            { enemyCount: 10, enemyHealth: 25, enemySpeed: 35, spawnInterval: 1.5, pattern: ['basic'] },
            // Wave 2: Add villagers, still easy
            { enemyCount: 14, enemyHealth: 28, enemySpeed: 36, spawnInterval: 1.5, pattern: ['basic', 'basic', 'villager'] },
            // Wave 3: More enemies, more variety
            { enemyCount: 17, enemyHealth: 32, enemySpeed: 38, spawnInterval: 1.5, pattern: ['basic', 'villager', 'basic'] },
            // Wave 4: Introduce archers
            { enemyCount: 20, enemyHealth: 35, enemySpeed: 40, spawnInterval: 1.5, pattern: ['basic', 'archer', 'villager'] },
            // Wave 5: Balanced mix
            { enemyCount: 22, enemyHealth: 38, enemySpeed: 42, spawnInterval: 1.3, pattern: ['basic', 'villager', 'archer', 'basic'] },
            // Wave 6: More archers
            { enemyCount: 24, enemyHealth: 42, enemySpeed: 44, spawnInterval: 1.3, pattern: ['archer', 'basic', 'villager', 'archer'] },
            // Wave 7: Ramp up difficulty
            { enemyCount: 24, enemyHealth: 45, enemySpeed: 46, spawnInterval: 1.3, pattern: ['villager', 'archer', 'basic', 'archer'] },
            // Wave 8: Heavy pressure
            { enemyCount: 24, enemyHealth: 48, enemySpeed: 48, spawnInterval: 1.2, pattern: ['archer', 'archer', 'basic', 'villager'] },
            // Wave 9: Challenging
            { enemyCount: 26, enemyHealth: 52, enemySpeed: 50, spawnInterval: 1.1, pattern: ['archer', 'villager', 'basic', 'archer', 'villager'] },
            // Wave 10: Boss wave
            { enemyCount: 30, enemyHealth: 55, enemySpeed: 52, spawnInterval: 1.0, pattern: ['archer', 'archer', 'villager', 'basic', 'archer'] }
        ];
        
        if (wave > 0 && wave <= waveConfigs.length) {
            return waveConfigs[wave - 1];
        }
        
        // Fallback for waves beyond 10
        return {
            enemyCount: 10,
            enemyHealth: 60,
            enemySpeed: 55,
            spawnInterval: 0.6,
            pattern: ['basic', 'villager', 'archer']
        };
    }
}
