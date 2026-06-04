import { LevelBase } from '../LevelBase.js';

export class SpaceLevel1 extends LevelBase {
    static levelMetadata = {
        name: 'Alien Outpost',
        difficulty: 'Medium',
        order: 1,
        campaign: 'space'
    };

    constructor() {
        super();
        this.levelName = SpaceLevel1.levelMetadata.name;
        this.levelNumber = SpaceLevel1.levelMetadata.order;
        this.difficulty = SpaceLevel1.levelMetadata.difficulty;
        this.campaign = SpaceLevel1.levelMetadata.campaign;
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
        // Wave 1
        { 
            enemyHealth_multiplier: 1, 
            speedMultiplier: 1, 
            spawnInterval: 1.2, 
            pattern: [{ type: 'frogking', count: 1 }, { type: 'villager', count: 12, healthMultiplier: 1.5 }, { type: 'villager', count: 15, healthMultiplier: 2 }] 
        }
        // Wave 2
        , { 
            enemyHealth_multiplier: 1, 
            speedMultiplier: 1, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'frog', count: 7 }, { type: 'frog', count: 9, healthMultiplier: 2, speedMultiplier: 1.2 }, { type: 'frog', count: 11, healthMultiplier: 3 }] 
        }
        // Wave 3
        , { 
            enemyHealth_multiplier: 1.5, 
            speedMultiplier: 1, 
            spawnInterval: 1, 
            pattern: [{ type: 'villager', count: 9, healthMultiplier: 2, speedMultiplier: 0.5 }, { type: 'basic', count: 11, healthMultiplier: 2 }, { type: 'archer', count: 3, speedMultiplier: 1.7 }] 
        }
        // Wave 4
        , { 
            enemyHealth_multiplier: 3, 
            speedMultiplier: 1, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'beefyenemy', count: 7 }] 
        }
        // Wave 5
        , { 
            enemyHealth_multiplier: 1, 
            speedMultiplier: 1, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'archer', count: 8, healthMultiplier: 3, speedMultiplier: 1.1 }, { type: 'frog', count: 12, healthMultiplier: 2 }, { type: 'shieldknight', count: 2, healthMultiplier: 2 }, { type: 'archer', count: 3, healthMultiplier: 3, speedMultiplier: 1.5 }] 
        }
        // Wave 6
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 1, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'mage', count: 1, healthMultiplier: 2 }, { type: 'frog', count: 13 }] 
        }
        // Wave 7
        , { 
            enemyHealth_multiplier: 3, 
            speedMultiplier: 1.3, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'villager', count: 14 }, { type: 'basic', count: 11 }, { type: 'frog', count: 9, healthMultiplier: 2, speedMultiplier: 1.4 }] 
        }
        // Wave 8
        , { 
            enemyHealth_multiplier: 3, 
            speedMultiplier: 1.2, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'basic', count: 12 }, { type: 'villager', count: 9 }, { type: 'archer', count: 12, speedMultiplier: 1.2 }] 
        }
        // Wave 9
        , { 
            enemyHealth_multiplier: 3, 
            speedMultiplier: 1, 
            spawnInterval: 2, 
            pattern: [{ type: 'beefyenemy', count: 4 }, { type: 'knight', count: 2, healthMultiplier: 1 }] 
        }
        // Wave 10
        , { 
            enemyHealth_multiplier: 2, 
            speedMultiplier: 1, 
            spawnInterval: 5, 
            pattern: [{ type: 'firefrog', count: 1 }, { type: 'airfrog', count: 1 }, { type: 'firefrog', count: 1 }, { type: 'airfrog', count: 1 }] 
        }
        // Wave 11
        , { 
            enemyHealth_multiplier: 5, 
            speedMultiplier: 1, 
            spawnInterval: 2, 
            pattern: [{ type: 'shieldknight', count: 2, healthMultiplier: 2 }, { type: 'beefyenemy', count: 5 }, { type: 'knight', count: 1, healthMultiplier: 1.7 }, { type: 'shieldknight', count: 3 }, { type: 'beefyenemy', count: 7, healthMultiplier: 5 }, { type: 'knight', count: 1, healthMultiplier: 2, speedMultiplier: 0.8 }] 
        }
        // Wave 12
        , { 
            enemyHealth_multiplier: 3, 
            speedMultiplier: 1, 
            spawnInterval: 0.5, 
            pattern: [{ type: 'mage', count: 1, healthMultiplier: 2 }, { type: 'frog', count: 10, healthMultiplier: 5, speedMultiplier: 1.5 }, { type: 'shieldknight', count: 4, healthMultiplier: 4, speedMultiplier: 0.4 }] 
        }
        // Wave 13
        , { 
            enemyHealth_multiplier: 2.5, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'beefyenemy', count: 7, healthMultiplier: 5 }, { type: 'frog', count: 14 }, { type: 'mage', count: 1, healthMultiplier: 2 }, { type: 'basic', count: 9 }, { type: 'villager', count: 8 }, { type: 'shieldknight', count: 4 }, { type: 'archer', count: 7, healthMultiplier: 3, speedMultiplier: 2 }] 
        }
        // Wave 14
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 0.8, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'shieldknight', count: 7 }] 
        }
        // Wave 15
        , { 
            enemyHealth_multiplier: 5, 
            speedMultiplier: 1, 
            spawnInterval: 12.5, 
            pattern: [{ type: 'knight', count: 3 }] 
        }
        // Wave 16
        , { 
            enemyHealth_multiplier: 1, 
            speedMultiplier: 1, 
            spawnInterval: 1, 
            pattern: [{ type: 'knight', count: 1, healthMultiplier: 3 }, { type: 'shieldknight', count: 2, healthMultiplier: 2 }, { type: 'mage', count: 1, healthMultiplier: 2 }, { type: 'shieldknight', count: 1, healthMultiplier: 4 }] 
        }
        // Wave 17
        , { 
            enemyHealth_multiplier: 5, 
            speedMultiplier: 1, 
            spawnInterval: 1, 
            pattern: [{ type: 'mage', count: 4, speedMultiplier: 0.6 }, { type: 'frog', count: 7, speedMultiplier: 1.2 }] 
        }
        // Wave 18
        , { 
            enemyHealth_multiplier: 5, 
            speedMultiplier: 1.2, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'archer', count: 14 }, { type: 'villager', count: 17 }, { type: 'basic', count: 15 }] 
        }
        // Wave 19
        , { 
            enemyHealth_multiplier: 5.5, 
            speedMultiplier: 1.7, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'archer', count: 12 }] 
        }
        // Wave 20
        , { 
            enemyHealth_multiplier: 5, 
            speedMultiplier: 1, 
            spawnInterval: 12, 
            pattern: [{ type: 'knight', count: 4, speedMultiplier: 1.4 }] 
        }
        // Wave 21
        , { 
            enemyHealth_multiplier: 4.8, 
            speedMultiplier: 1.1, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'shieldknight', count: 3, healthMultiplier: 3 }, { type: 'mage', count: 1 }, { type: 'villager', count: 12 }, { type: 'shieldknight', count: 2, healthMultiplier: 4 }, { type: 'beefyenemy', count: 10 }, { type: 'mage', count: 1 }, { type: 'frog', count: 14 }, { type: 'archer', count: 11, healthMultiplier: 5, speedMultiplier: 1.5 }, { type: 'shieldknight', count: 1, healthMultiplier: 6, speedMultiplier: 1 }] 
        }
        // Wave 22
        , { 
            enemyHealth_multiplier: 1, 
            speedMultiplier: 1, 
            spawnInterval: 2, 
            pattern: [{ type: 'mage', count: 1, healthMultiplier: 2 }, { type: 'firefrog', count: 2, healthMultiplier: 5 }] 
        }
        // Wave 23
        , { 
            enemyHealth_multiplier: 2.5, 
            speedMultiplier: 1.4, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'archer', count: 13 }, { type: 'mage', count: 2 }, { type: 'archer', count: 13, healthMultiplier: 4 }] 
        }
        // Wave 24
        , { 
            enemyHealth_multiplier: 2.5, 
            speedMultiplier: 1, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'shieldknight', count: 3, speedMultiplier: 1.2 }, { type: 'beefyenemy', count: 9, healthMultiplier: 6, speedMultiplier: 0.7 }, { type: 'frog', count: 16 }, { type: 'villager', count: 11 }, { type: 'archer', count: 14, speedMultiplier: 1.4 }, { type: 'knight', count: 1, healthMultiplier: 7, speedMultiplier: 0.5 }] 
        }
        // Wave 25
        , { 
            enemyHealth_multiplier: 7, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'mage', count: 1 }, { type: 'waterfrog', count: 1 }, { type: 'mage', count: 1 }, { type: 'airfrog', count: 1 }] 
        }
        // Wave 26
        , { 
            enemyHealth_multiplier: 2.5, 
            speedMultiplier: 1, 
            spawnInterval: 1, 
            pattern: [{ type: 'shieldknight', count: 1, healthMultiplier: 4, speedMultiplier: 1.2 }, { type: 'beefyenemy', count: 11, healthMultiplier: 6 }, { type: 'frog', count: 11, speedMultiplier: 1.4 }, { type: 'villager', count: 11 }, { type: 'archer', count: 13, speedMultiplier: 1.4 }, { type: 'knight', count: 1, healthMultiplier: 6, speedMultiplier: 0.5 }] 
        }
        // Wave 27
        , { 
            enemyHealth_multiplier: 7.5, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'waterfrog', count: 1 }, { type: 'earthfrog', count: 1 }, { type: 'firefrog', count: 1 }] 
        }
        // Wave 28
        , { 
            enemyHealth_multiplier: 3, 
            speedMultiplier: 1, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'mage', count: 3, speedMultiplier: 1.2 }, { type: 'beefyenemy', count: 9, healthMultiplier: 6 }, { type: 'frog', count: 16 }, { type: 'villager', count: 11 }, { type: 'archer', count: 13 }, { type: 'knight', count: 1, healthMultiplier: 7, speedMultiplier: 0.5 }, { type: 'shieldknight', count: 3, healthMultiplier: 4, speedMultiplier: 1.2 }] 
        }
        // Wave 29
        , { 
            enemyHealth_multiplier: 15, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'firefrog', count: 1 }] 
        }
        // Wave 30
        , { 
            enemyHealth_multiplier: 11, 
            speedMultiplier: 1, 
            spawnInterval: 3, 
            pattern: [{ type: 'mage', count: 1, healthMultiplier: 8, speedMultiplier: 0.8 }, { type: 'airfrog', count: 1 }, { type: 'earthfrog', count: 1 }, { type: 'firefrog', count: 1 }, { type: 'waterfrog', count: 1 }] 
        }
        // Wave 31
        , { 
            enemyHealth_multiplier: 2, 
            speedMultiplier: 1, 
            spawnInterval: 5, 
            pattern: [{ type: 'firefrog', count: 1 }, { type: 'airfrog', count: 1 }, { type: 'firefrog', count: 1 }, { type: 'airfrog', count: 1 }] 
        }
        // Wave 32
        , { 
            enemyHealth_multiplier: 5, 
            speedMultiplier: 1, 
            spawnInterval: 2, 
            pattern: [{ type: 'shieldknight', count: 2, healthMultiplier: 2 }, { type: 'beefyenemy', count: 5 }, { type: 'knight', count: 1, healthMultiplier: 1.7 }, { type: 'shieldknight', count: 3 }, { type: 'beefyenemy', count: 7, healthMultiplier: 5 }, { type: 'knight', count: 1, healthMultiplier: 2, speedMultiplier: 0.8 }] 
        }
        // Wave 33
        , { 
            enemyHealth_multiplier: 3, 
            speedMultiplier: 1, 
            spawnInterval: 0.5, 
            pattern: [{ type: 'mage', count: 1, healthMultiplier: 2 }, { type: 'frog', count: 10, healthMultiplier: 5, speedMultiplier: 1.5 }, { type: 'shieldknight', count: 4, healthMultiplier: 4, speedMultiplier: 0.4 }] 
        }
        // Wave 34
        , { 
            enemyHealth_multiplier: 2.5, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'beefyenemy', count: 7, healthMultiplier: 5 }, { type: 'frog', count: 14 }, { type: 'mage', count: 1, healthMultiplier: 2 }, { type: 'basic', count: 9 }, { type: 'villager', count: 8 }, { type: 'shieldknight', count: 4 }, { type: 'archer', count: 7, healthMultiplier: 3, speedMultiplier: 2 }] 
        }
        // Wave 35
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 0.8, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'shieldknight', count: 7 }] 
        }
        // Wave 36
        , { 
            enemyHealth_multiplier: 5, 
            speedMultiplier: 1, 
            spawnInterval: 12.5, 
            pattern: [{ type: 'knight', count: 3 }] 
        }
        // Wave 37
        , { 
            enemyHealth_multiplier: 1, 
            speedMultiplier: 1, 
            spawnInterval: 1, 
            pattern: [{ type: 'knight', count: 1, healthMultiplier: 3 }, { type: 'shieldknight', count: 2, healthMultiplier: 2 }, { type: 'mage', count: 1, healthMultiplier: 2 }, { type: 'shieldknight', count: 1, healthMultiplier: 4 }] 
        }
        // Wave 38
        , { 
            enemyHealth_multiplier: 5, 
            speedMultiplier: 1, 
            spawnInterval: 1, 
            pattern: [{ type: 'mage', count: 4, speedMultiplier: 0.6 }, { type: 'frog', count: 7, speedMultiplier: 1.2 }] 
        }
        // Wave 39
        , { 
            enemyHealth_multiplier: 5, 
            speedMultiplier: 1.2, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'archer', count: 14 }, { type: 'villager', count: 17 }, { type: 'basic', count: 15 }] 
        }
        // Wave 40
        , { 
            enemyHealth_multiplier: 5.5, 
            speedMultiplier: 1.7, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'archer', count: 12 }] 
        }
        // Wave 41
        , { 
            enemyHealth_multiplier: 5, 
            speedMultiplier: 1, 
            spawnInterval: 12, 
            pattern: [{ type: 'knight', count: 4, speedMultiplier: 1.4 }] 
        }
        // Wave 42
        , { 
            enemyHealth_multiplier: 4.8, 
            speedMultiplier: 1.1, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'shieldknight', count: 3, healthMultiplier: 3 }, { type: 'mage', count: 1 }, { type: 'villager', count: 12 }, { type: 'shieldknight', count: 2, healthMultiplier: 4 }, { type: 'beefyenemy', count: 10 }, { type: 'mage', count: 1 }, { type: 'frog', count: 14 }, { type: 'archer', count: 11, healthMultiplier: 5, speedMultiplier: 1.5 }, { type: 'shieldknight', count: 1, healthMultiplier: 6, speedMultiplier: 1 }] 
        }
        // Wave 43
        , { 
            enemyHealth_multiplier: 1, 
            speedMultiplier: 1, 
            spawnInterval: 2, 
            pattern: [{ type: 'mage', count: 1, healthMultiplier: 2 }, { type: 'firefrog', count: 2, healthMultiplier: 5 }] 
        }
        // Wave 44
        , { 
            enemyHealth_multiplier: 2.5, 
            speedMultiplier: 1.4, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'archer', count: 13 }, { type: 'mage', count: 2 }, { type: 'archer', count: 13, healthMultiplier: 4 }] 
        }
        // Wave 45
        , { 
            enemyHealth_multiplier: 2.5, 
            speedMultiplier: 1, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'shieldknight', count: 3, speedMultiplier: 1.2 }, { type: 'beefyenemy', count: 9, healthMultiplier: 6, speedMultiplier: 0.7 }, { type: 'frog', count: 16 }, { type: 'villager', count: 11 }, { type: 'archer', count: 14, speedMultiplier: 1.4 }, { type: 'knight', count: 1, healthMultiplier: 7, speedMultiplier: 0.5 }] 
        }
        // Wave 46
        , { 
            enemyHealth_multiplier: 7, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'mage', count: 1 }, { type: 'waterfrog', count: 1 }, { type: 'mage', count: 1 }, { type: 'airfrog', count: 1 }] 
        }
        // Wave 47
        , { 
            enemyHealth_multiplier: 2.5, 
            speedMultiplier: 1, 
            spawnInterval: 1, 
            pattern: [{ type: 'shieldknight', count: 1, healthMultiplier: 4, speedMultiplier: 1.2 }, { type: 'beefyenemy', count: 11, healthMultiplier: 6 }, { type: 'frog', count: 11, speedMultiplier: 1.4 }, { type: 'villager', count: 11 }, { type: 'archer', count: 13, speedMultiplier: 1.4 }, { type: 'knight', count: 1, healthMultiplier: 6, speedMultiplier: 0.5 }] 
        }
        // Wave 48
        , { 
            enemyHealth_multiplier: 7.5, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'waterfrog', count: 1 }, { type: 'earthfrog', count: 1 }, { type: 'firefrog', count: 1 }] 
        }
        // Wave 49
        , { 
            enemyHealth_multiplier: 3, 
            speedMultiplier: 1, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'mage', count: 3, speedMultiplier: 1.2 }, { type: 'beefyenemy', count: 9, healthMultiplier: 6 }, { type: 'frog', count: 16 }, { type: 'villager', count: 11 }, { type: 'archer', count: 13 }, { type: 'knight', count: 1, healthMultiplier: 7, speedMultiplier: 0.5 }, { type: 'shieldknight', count: 3, healthMultiplier: 4, speedMultiplier: 1.2 }] 
        }
        // Wave 50
        , { 
            enemyHealth_multiplier: 15, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'firefrog', count: 1 }] 
        }
        // Wave 51
        , { 
            enemyHealth_multiplier: 11, 
            speedMultiplier: 1, 
            spawnInterval: 3, 
            pattern: [{ type: 'mage', count: 1, healthMultiplier: 8, speedMultiplier: 0.8 }, { type: 'airfrog', count: 1 }, { type: 'earthfrog', count: 1 }, { type: 'firefrog', count: 1 }, { type: 'waterfrog', count: 1 }] 
        }
        ];

        if (wave > 0 && wave <= waveConfigs.length) {
            return waveConfigs[wave - 1];
        }
        
        return null;
    }
}
