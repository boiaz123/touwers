import { LevelBase } from './LevelBase.js';

export class Level3 extends LevelBase {
    constructor() {
        super();
        this.levelName = 'Crazy Frogs';
        this.levelNumber = 3;
        this.difficulty = 'Easy';
        this.maxWaves = 10;
        
        // Customize visuals for swampy/frog theme
        this.setVisualConfig({
            grassColors: {
                top: '#d0d0d7ff',
                upper: '#b5b5baff',
                lower: '#8c8c98ff',
                bottom: '#c9c9d4ff'
            },
            grassPatchDensity: 12000,
            grassPatchSizeMin: 2,
            grassPatchSizeMax: 4,
            dirtPatchCount: 12,
            dirtPatchAlpha: 0.14,
            flowerDensity: 100000,
            pathBaseColor: '#9f9f9cff',
            pathEdgeVegetationChance: 0.3,
            edgeBushColor: '#000000ff',
            edgeRockColor: '#666666',
            edgeGrassColor: '#56512bff'
        });
        
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
            { enemyCount: 40, enemyHealth_multiplier: 0.1,enemySpeed: 395, spawnInterval: 2.0, pattern: ['frog'] },
            { enemyCount: 40, enemyHealth_multiplier: 0.5,enemySpeed: 669, spawnInterval: 1.7, pattern: ['frog'] },
            { enemyCount: 40, enemyHealth_multiplier: 0.6,enemySpeed: 1389, spawnInterval: 1.5, pattern: ['frog'] },
            { enemyCount: 40, enemyHealth_multiplier: 0.7,enemySpeed: 2409, spawnInterval: 1.3, pattern: ['frog'] },
            { enemyCount: 40, enemyHealth_multiplier: 0.8,enemySpeed: 5429, spawnInterval: 1.1, pattern: ['frog'] },
            { enemyCount: 60, enemyHealth_multiplier: 1.5,enemySpeed: 6449, spawnInterval: 1.3, pattern: ['frog'] },
            { enemyCount: 60, enemyHealth_multiplier: 1.6,enemySpeed: 7469, spawnInterval: 1.2, pattern: ['frog'] },
            { enemyCount: 60, enemyHealth_multiplier: 1.7,enemySpeed: 8489, spawnInterval: 1.1, pattern: ['frog'] },
            { enemyCount: 80, enemyHealth_multiplier: 1.8,enemySpeed: 9509, spawnInterval: 1.2, pattern: ['frog'] },
            { enemyCount: 100, enemyHealth_multiplier:1.9, enemySpeed: 100529, spawnInterval: 10, pattern: ['frog'] }
        ];
        
        if (wave > 0 && wave <= waveConfigs.length) {
            return waveConfigs[wave - 1];
        }
        
        // Fallback for waves beyond 10
        return {
            enemyCount: 10,
            enemyHealth_multiplier: 1.0,
            enemySpeed: 55,
            spawnInterval: 0.6,
            pattern: ['basic', 'villager', 'archer']
        };
    }
}
