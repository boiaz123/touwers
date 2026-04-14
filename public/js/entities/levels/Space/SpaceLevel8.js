import { LevelBase } from '../LevelBase.js';

export class SpaceLevel8 extends LevelBase {
    static levelMetadata = {
        name: 'Alien Outpost',
        difficulty: 'Medium',
        order: 8,
        campaign: 'space'
    };

    constructor() {
        super();
        this.levelName = SpaceLevel8.levelMetadata.name;
        this.levelNumber = SpaceLevel8.levelMetadata.order;
        this.difficulty = SpaceLevel8.levelMetadata.difficulty;
        this.campaign = SpaceLevel8.levelMetadata.campaign;
        this.maxWaves = 1;
        
        this.setVisualConfig({
            grassColors: {
                top: '#1a3a5a',
                upper: '#2a4a7a',
                lower: '#1a5a8a',
                bottom: '#0a3a6a'
            },
            grassPatchDensity: 9000,
            pathBaseColor: '#5a7a9a',
            edgeBushColor: '#3a6a5a',
            edgeBushAccentColor: '#5a9a8a',
            edgeRockColor: '#6a5a9a',
            edgeGrassColor: '#4a8aaa',
            flowerDensity: 30000
        });

        this.terrainElements = [
            // Space rocks (alien stone formations)
            { type: 'rock', gridX: 8.00, gridY: 4.00, size: 1.0 },
            { type: 'rock', gridX: 18.00, gridY: 12.00, size: 1.0 },
            { type: 'rock', gridX: 28.00, gridY: 6.00, size: 1.0 },
            { type: 'rock', gridX: 42.00, gridY: 10.00, size: 1.0 },
            { type: 'rock', gridX: 52.00, gridY: 30.00, size: 1.0 },
            { type: 'rock', gridX: 10.00, gridY: 28.00, size: 1.0 },
            { type: 'rock', gridX: 35.00, gridY: 25.00, size: 1.0 },
            { type: 'rock', gridX: 55.00, gridY: 8.00, size: 1.0 },
            
            // Space vegetation (crystals and alien growths)
            { type: 'vegetation', gridX: 6.00, gridY: 22.00, size: 1.1 },
            { type: 'vegetation', gridX: 22.00, gridY: 20.00, size: 1.0 },
            { type: 'vegetation', gridX: 38.00, gridY: 32.00, size: 1.2 },
            { type: 'vegetation', gridX: 48.00, gridY: 22.00, size: 1.1 },
            { type: 'vegetation', gridX: 15.00, gridY: 5.00, size: 1.0 },
            { type: 'vegetation', gridX: 45.00, gridY: 28.00, size: 1.3 },
            
            // More alien vegetation
            { type: 'vegetation', gridX: 12.00, gridY: 8.00, size: 1.0 },
            { type: 'vegetation', gridX: 30.00, gridY: 18.00, size: 1.2 },
            { type: 'vegetation', gridX: 50.00, gridY: 5.00, size: 1.1 },
            { type: 'vegetation', gridX: 24.00, gridY: 30.00, size: 1.0 },
            { type: 'vegetation', gridX: 40.00, gridY: 14.00, size: 1.2 }
        ];
    }

    createMeanderingPath() {
        const pathInGridCoords = [
            { gridX: 0, gridY: 16.875 },
            { gridX: 12, gridY: 16.875 },
            { gridX: 24, gridY: 8.4375 },
            { gridX: 36, gridY: 25.3125 },
            { gridX: 48, gridY: 16.875 },
            { gridX: 60, gridY: 16.875 }
        ];

        this.path = pathInGridCoords.map(point => ({
            x: Math.round(point.gridX * this.cellSize),
            y: Math.round(point.gridY * this.cellSize)
        }));
    }

    getWaveConfig(wave) {
        const waveConfigs = [
            { enemyCount: 1, enemyHealth_multiplier: 1.0, speedMultiplier: 0.75, spawnInterval: 1.5, pattern: ['frogking'] }
        ];
        
        return (wave > 0 && wave <= waveConfigs.length) ? waveConfigs[wave - 1] : null;
    }
}

