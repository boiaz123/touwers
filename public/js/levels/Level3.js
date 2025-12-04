import { LevelBase } from '../LevelBase.js';

export class Level3 extends LevelBase {
    constructor() {
        super();
        this.levelName = 'Crazy Frogs';
        this.levelNumber = 3;
        this.difficulty = 'Easy';
        this.maxWaves = 10;
        console.log('Level3: Initialized');
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
            { enemyCount: 40, enemyHealth: 25, enemySpeed: 35, spawnInterval: 2.0, pattern: ['frog'] },
            // Wave 2: Add villagers, still easy
            { enemyCount: 40, enemyHealth: 28, enemySpeed: 36, spawnInterval: 1.7, pattern: ['frog'] },
            // Wave 3: More enemies, more variety
            { enemyCount: 40, enemyHealth: 32, enemySpeed: 38, spawnInterval: 1.5, pattern: ['frog'] },
            // Wave 4: Introduce archers
            { enemyCount: 40, enemyHealth: 35, enemySpeed: 40, spawnInterval: 1.3, pattern: ['frog'] },
            // Wave 5: Balanced mix
            { enemyCount: 40, enemyHealth: 38, enemySpeed: 42, spawnInterval: 1.1, pattern: ['frog'] },
            // Wave 6: More archers
            { enemyCount: 60, enemyHealth: 42, enemySpeed: 44, spawnInterval: 1.3, pattern: ['frog'] },
            // Wave 7: Ramp up difficulty
            { enemyCount: 60, enemyHealth: 45, enemySpeed: 46, spawnInterval: 1.2, pattern: ['frog'] },
            // Wave 8: Heavy pressure
            { enemyCount: 60, enemyHealth: 48, enemySpeed: 48, spawnInterval: 1.1, pattern: ['frog'] },
            // Wave 9: Challenging
            { enemyCount: 80, enemyHealth: 52, enemySpeed: 50, spawnInterval: 1.2, pattern: ['frog'] },
            // Wave 10: Boss wave
            { enemyCount: 100, enemyHealth: 55, enemySpeed: 52, spawnInterval: 1.0, pattern: ['frog'] }
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
