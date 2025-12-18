import { LevelBase } from '../LevelBase.js';

export class Level1 extends LevelBase {
    constructor() {
        super();
        this.levelName = 'My Level';
        this.levelNumber = 1;
        this.difficulty = 'Easy';
        this.maxWaves = 10;
        
        // Improved medieval-themed visuals
        this.setVisualConfig({
            // Improved grass colors - warmer, more natural medieval landscape
            grassColors: {
                top: '#3a4a2f',      // Upper portion - lighter green-brown
                upper: '#4a5a3f',    // Transition zone
                lower: '#5a6a4f',    // Lower transition
                bottom: '#2a3a1f'    // Bottom - darker earth tone
            },
            
            // More varied grass patches for organic feel
            grassPatchDensity: 6000,   // More patches, smaller spacing
            grassPatchSizeMin: 4,
            grassPatchSizeMax: 14,
            
            // Ground textures - varied soil types replacing square patterns
            dirtPatchCount: 0,         // Not used anymore - using density instead
            dirtPatchAlpha: 0.2,       // Subtle appearance
            
            // Flowers - wildflowers scattered naturally
            flowerDensity: 20000,      // More flowers, creates lively medieval feel
            
            // Path visuals - medieval stone road
            pathBaseColor: '#8b7355',
            pathTextureSpacing: 15,    // Stone block spacing
            pathEdgeVegetationChance: 0.3,
            
            // Edge vegetation - natural roadside growth
            edgeBushColor: '#2f5f2f',
            edgeBushAccentColor: '#3a8a3a',
            edgeRockColor: '#6a7a6a',
            edgeGrassColor: '#3a7a3a'
        });

        // Set terrain elements (prevent tower placement on these areas)
        this.terrainElements = [
            { type: 'water', gridX: 1.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 2.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 3.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 4.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 5.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 6.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 7.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 8.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 9.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 10.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 10.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 11.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 12.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 12.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 13.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 14.00, gridY: 25.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 15.00, gridY: 25.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 15.00, gridY: 24.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 16.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 16.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 17.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 18.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 19.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 20.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 21.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 22.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 23.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 23.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 23.00, gridY: 24.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 24.00, gridY: 24.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 25.00, gridY: 25.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 26.00, gridY: 25.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 27.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 27.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 28.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 28.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 29.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 30.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 31.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 32.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 33.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 34.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 35.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 36.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 37.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 38.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 39.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 40.00, gridY: 29.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 41.00, gridY: 29.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 41.00, gridY: 29.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 42.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 42.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 43.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 44.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 45.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 45.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 45.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 46.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 47.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 48.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 49.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 50.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 51.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 52.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 53.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 54.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 55.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 55.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 55.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 56.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 57.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 58.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 58.00, gridY: 27.00, size: 1.5, waterType: 'river' }
        ];
    }

    createMeanderingPath(canvasWidth, canvasHeight) {
        const gridWidth = this.gridWidth || 60;
        const gridHeight = this.gridHeight || 33.75;

        const pathInGridCoords = [
            { gridX: 2.79, gridY: 12.02 },
            { gridX: 27.60, gridY: 15.22 },
            { gridX: 31.45, gridY: 9.98 },
            { gridX: 37.99, gridY: 8.62 },
            { gridX: 44.43, gridY: 15.16 },
            { gridX: 45.13, gridY: 19.98 },
            { gridX: 49.72, gridY: 23.17 },
            { gridX: 54.12, gridY: 18.98 },
            { gridX: 56.90, gridY: 17.31 }
        ];

        this.path = pathInGridCoords.map(point => ({
            x: Math.round(point.gridX * this.cellSize),
            y: Math.round(point.gridY * this.cellSize)
        }));
    }

    getWaveConfig(wave) {
        const waveConfigs = [
        // Wave 1
        { 
            enemyCount: 5, 
            enemyHealth_multiplier: 1, 
            enemySpeed: 35, 
            spawnInterval: 1.5, 
            pattern: ['basic'] 
        }
        // Wave 2
        , { 
            enemyCount: 5, 
            enemyHealth_multiplier: 1, 
            enemySpeed: 35, 
            spawnInterval: 1.5, 
            pattern: ['basic'] 
        }
        // Wave 3
        , { 
            enemyCount: 5, 
            enemyHealth_multiplier: 1, 
            enemySpeed: 35, 
            spawnInterval: 1.5, 
            pattern: ['basic'] 
        }
        // Wave 4
        , { 
            enemyCount: 5, 
            enemyHealth_multiplier: 1, 
            enemySpeed: 35, 
            spawnInterval: 1.5, 
            pattern: ['basic'] 
        }
        ];

        if (wave > 0 && wave <= waveConfigs.length) {
            return waveConfigs[wave - 1];
        }
        
        return null;
    }
}