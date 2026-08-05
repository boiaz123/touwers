import { LevelBase } from '../LevelBase.js';

export class SpaceLevel8 extends LevelBase {
    static levelMetadata = {
        name: "Frog King's Domain",
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
        this.maxWaves = 60;
        
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
            enemyHealth_multiplier: 2.96, 
            speedMultiplier: 1, 
            spawnInterval: 1.14, 
            pattern: [{ type: 'villager', count: 10 }, { type: 'villager', count: 12, healthMultiplier: 1.5 }, { type: 'basic', count: 8, healthMultiplier: 1.3 }] 
        }
        // Wave 2
        , { 
            enemyHealth_multiplier: 2.96, 
            speedMultiplier: 1, 
            spawnInterval: 0.86, 
            pattern: [{ type: 'frog', count: 9 }, { type: 'frog', count: 10, healthMultiplier: 2, speedMultiplier: 1.2 }, { type: 'frog', count: 11, healthMultiplier: 3 }] 
        }
        // Wave 3
        , { 
            enemyHealth_multiplier: 4.14, 
            speedMultiplier: 1, 
            spawnInterval: 0.96, 
            pattern: [{ type: 'villager', count: 10, healthMultiplier: 1.8, speedMultiplier: 0.6 }, { type: 'basic', count: 12, healthMultiplier: 1.8 }, { type: 'archer', count: 5, speedMultiplier: 1.5 }] 
        }
        // Wave 4
        , { 
            enemyHealth_multiplier: 2.96, 
            speedMultiplier: 1, 
            spawnInterval: 0.68, 
            pattern: [{ type: 'beefyenemy', count: 9 }] 
        }
        // Wave 5
        , { 
            enemyHealth_multiplier: 2.96, 
            speedMultiplier: 1, 
            spawnInterval: 0.78, 
            pattern: [{ type: 'archer', count: 9, healthMultiplier: 2.5, speedMultiplier: 1.1 }, { type: 'frog', count: 12, healthMultiplier: 1.8 }, { type: 'shieldknight', count: 4, healthMultiplier: 2 }, { type: 'archer', count: 5, healthMultiplier: 3, speedMultiplier: 1.5 }] 
        }
        // Wave 6
        , { 
            enemyHealth_multiplier: 8.88, 
            speedMultiplier: 1, 
            spawnInterval: 0.88, 
            pattern: [{ type: 'mage', count: 3, healthMultiplier: 2 }, { type: 'frog', count: 13 }] 
        }
        // Wave 7
        , { 
            enemyHealth_multiplier: 7.4, 
            speedMultiplier: 1.2, 
            spawnInterval: 0.58, 
            pattern: [{ type: 'villager', count: 13 }, { type: 'basic', count: 11 }, { type: 'frog', count: 10, healthMultiplier: 2, speedMultiplier: 1.3 }] 
        }
        // Wave 8
        , { 
            enemyHealth_multiplier: 7.4, 
            speedMultiplier: 1.2, 
            spawnInterval: 0.78, 
            pattern: [{ type: 'basic', count: 12 }, { type: 'villager', count: 10 }, { type: 'archer', count: 12, speedMultiplier: 1.2 }] 
        }
        // Wave 9
        , { 
            enemyHealth_multiplier: 7.4, 
            speedMultiplier: 1, 
            spawnInterval: 1.95, 
            pattern: [{ type: 'beefyenemy', count: 6 }, { type: 'knight', count: 4 }] 
        }
        // Wave 10
        , { 
            enemyHealth_multiplier: 5.92, 
            speedMultiplier: 1, 
            spawnInterval: 4.7, 
            pattern: [{ type: 'firefrog', count: 3 }, { type: 'airfrog', count: 3 }, { type: 'firefrog', count: 3 }, { type: 'airfrog', count: 3 }] 
        }
        // Wave 11
        , { 
            enemyHealth_multiplier: 10.79, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'beefyenemy', count: 11, healthMultiplier: 3 }, { type: 'frog', count: 16 }, { type: 'mage', count: 5, healthMultiplier: 2 }, { type: 'basic', count: 13 }, { type: 'villager', count: 12 }, { type: 'shieldknight', count: 8 }, { type: 'archer', count: 11, healthMultiplier: 3, speedMultiplier: 2 }] 
        }
        // Wave 12
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 1, 
            spawnInterval: 0.82, 
            pattern: [{ type: 'frog', count: 11 }, { type: 'frog', count: 12, healthMultiplier: 2, speedMultiplier: 1.2 }, { type: 'frog', count: 13, healthMultiplier: 3 }] 
        }
        // Wave 13
        , { 
            enemyHealth_multiplier: 11.99, 
            speedMultiplier: 0.9, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'knight', count: 6, healthMultiplier: 2.5 }, { type: 'shieldknight', count: 9, healthMultiplier: 2 }, { type: 'frog', count: 14, speedMultiplier: 1.3 }, { type: 'archer', count: 13, speedMultiplier: 1.4 }, { type: 'beefyenemy', count: 10 }, { type: 'villager', count: 10 }] 
        }
        // Wave 14
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 1, 
            spawnInterval: 0.66, 
            pattern: [{ type: 'beefyenemy', count: 11 }, { type: 'frog', count: 3 }] 
        }
        // Wave 15
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 1, 
            spawnInterval: 0.76, 
            pattern: [{ type: 'archer', count: 11, healthMultiplier: 2.5, speedMultiplier: 1.1 }, { type: 'frog', count: 15, healthMultiplier: 1.8 }, { type: 'shieldknight', count: 6, healthMultiplier: 2 }, { type: 'archer', count: 7, healthMultiplier: 3, speedMultiplier: 1.5 }] 
        }
        // Wave 16
        , { 
            enemyHealth_multiplier: 15.98, 
            speedMultiplier: 0.8, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'shieldknight', count: 11 }, { type: 'frog', count: 3 }] 
        }
        // Wave 17
        , { 
            enemyHealth_multiplier: 19.98, 
            speedMultiplier: 1, 
            spawnInterval: 11.9, 
            pattern: [{ type: 'knight', count: 7 }, { type: 'frog', count: 4 }] 
        }
        // Wave 18
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 1, 
            spawnInterval: 1, 
            pattern: [{ type: 'knight', count: 5, healthMultiplier: 3 }, { type: 'shieldknight', count: 6, healthMultiplier: 2 }, { type: 'mage', count: 5, healthMultiplier: 2 }, { type: 'shieldknight', count: 5, healthMultiplier: 4 }, { type: 'frog', count: 4 }] 
        }
        // Wave 19
        , { 
            enemyHealth_multiplier: 19.98, 
            speedMultiplier: 1, 
            spawnInterval: 1, 
            pattern: [{ type: 'mage', count: 8, speedMultiplier: 0.6 }, { type: 'frog', count: 14, speedMultiplier: 1.2 }] 
        }
        // Wave 20
        , { 
            enemyHealth_multiplier: 7.99, 
            speedMultiplier: 1, 
            spawnInterval: 4.4, 
            pattern: [{ type: 'waterfrog', count: 5 }, { type: 'earthfrog', count: 5 }, { type: 'waterfrog', count: 5 }, { type: 'earthfrog', count: 5 }] 
        }
        // Wave 21
        , { 
            enemyHealth_multiplier: 23.15, 
            speedMultiplier: 1.1, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'shieldknight', count: 8, healthMultiplier: 3 }, { type: 'mage', count: 6 }, { type: 'villager', count: 17 }, { type: 'shieldknight', count: 7, healthMultiplier: 4 }, { type: 'beefyenemy', count: 15, healthMultiplier: 2 }, { type: 'mage', count: 6 }, { type: 'frog', count: 25 }, { type: 'archer', count: 16, healthMultiplier: 5, speedMultiplier: 1.5 }, { type: 'shieldknight', count: 6, healthMultiplier: 6 }] 
        }
        // Wave 22
        , { 
            enemyHealth_multiplier: 5.03, 
            speedMultiplier: 1, 
            spawnInterval: 0.78, 
            pattern: [{ type: 'frog', count: 16 }, { type: 'frog', count: 18, healthMultiplier: 2, speedMultiplier: 1.2 }, { type: 'frog', count: 19, healthMultiplier: 3 }] 
        }
        // Wave 23
        , { 
            enemyHealth_multiplier: 25.16, 
            speedMultiplier: 1.3, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'archer', count: 19 }, { type: 'villager', count: 22 }, { type: 'basic', count: 20 }, { type: 'frog', count: 4 }] 
        }
        // Wave 24
        , { 
            enemyHealth_multiplier: 27.68, 
            speedMultiplier: 1.7, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'archer', count: 17 }, { type: 'frog', count: 4 }] 
        }
        // Wave 25
        , { 
            enemyHealth_multiplier: 35.22, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'mage', count: 1 }, { type: 'waterfrog', count: 1 }] 
        }
        // Wave 26
        , { 
            enemyHealth_multiplier: 13.59, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'beefyenemy', count: 12, healthMultiplier: 3 }, { type: 'frog', count: 25 }, { type: 'mage', count: 6, healthMultiplier: 2 }, { type: 'basic', count: 14 }, { type: 'villager', count: 13 }, { type: 'shieldknight', count: 9 }, { type: 'archer', count: 12, healthMultiplier: 3, speedMultiplier: 2 }] 
        }
        // Wave 27
        , { 
            enemyHealth_multiplier: 35.22, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'waterfrog', count: 1 }, { type: 'earthfrog', count: 1 }, { type: 'firefrog', count: 1 }] 
        }
        // Wave 28
        , { 
            enemyHealth_multiplier: 15.1, 
            speedMultiplier: 0.9, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'knight', count: 7, healthMultiplier: 2.5 }, { type: 'shieldknight', count: 10, healthMultiplier: 2 }, { type: 'frog', count: 23, speedMultiplier: 1.3 }, { type: 'archer', count: 14, speedMultiplier: 1.4 }, { type: 'beefyenemy', count: 11 }, { type: 'villager', count: 11 }] 
        }
        // Wave 29
        , { 
            enemyHealth_multiplier: 70.45, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'firefrog', count: 1 }] 
        }
        // Wave 30
        , { 
            enemyHealth_multiplier: 10.06, 
            speedMultiplier: 1, 
            spawnInterval: 4.1, 
            pattern: [{ type: 'firefrog', count: 6 }, { type: 'waterfrog', count: 6 }, { type: 'firefrog', count: 6 }, { type: 'waterfrog', count: 6 }] 
        }
        // Wave 31
        , { 
            enemyHealth_multiplier: 16.38, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'beefyenemy', count: 13, healthMultiplier: 3 }, { type: 'frog', count: 30 }, { type: 'mage', count: 7, healthMultiplier: 2 }, { type: 'basic', count: 15 }, { type: 'villager', count: 14 }, { type: 'shieldknight', count: 10 }, { type: 'archer', count: 13, healthMultiplier: 3, speedMultiplier: 2 }] 
        }
        // Wave 32
        , { 
            enemyHealth_multiplier: 42.48, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'mage', count: 1 }, { type: 'airfrog', count: 1 }] 
        }
        // Wave 33
        , { 
            enemyHealth_multiplier: 30.34, 
            speedMultiplier: 1.4, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'archer', count: 20 }, { type: 'villager', count: 23 }, { type: 'basic', count: 21 }, { type: 'frog', count: 5 }] 
        }
        // Wave 34
        , { 
            enemyHealth_multiplier: 33.37, 
            speedMultiplier: 1.7, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'archer', count: 18 }, { type: 'frog', count: 5 }] 
        }
        // Wave 35
        , { 
            enemyHealth_multiplier: 6.07, 
            speedMultiplier: 1, 
            spawnInterval: 0.72, 
            pattern: [{ type: 'archer', count: 13, healthMultiplier: 2.5, speedMultiplier: 1.1 }, { type: 'frog', count: 29, healthMultiplier: 1.8 }, { type: 'shieldknight', count: 8, healthMultiplier: 2 }, { type: 'archer', count: 9, healthMultiplier: 3, speedMultiplier: 1.5 }] 
        }
        // Wave 36
        , { 
            enemyHealth_multiplier: 27.91, 
            speedMultiplier: 1.1, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'shieldknight', count: 9, healthMultiplier: 3 }, { type: 'mage', count: 7 }, { type: 'villager', count: 18 }, { type: 'shieldknight', count: 8, healthMultiplier: 4 }, { type: 'beefyenemy', count: 16, healthMultiplier: 2 }, { type: 'mage', count: 7 }, { type: 'frog', count: 37 }, { type: 'archer', count: 17, healthMultiplier: 5, speedMultiplier: 1.5 }, { type: 'shieldknight', count: 7, healthMultiplier: 6 }] 
        }
        // Wave 37
        , { 
            enemyHealth_multiplier: 84.95, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'earthfrog', count: 1 }] 
        }
        // Wave 38
        , { 
            enemyHealth_multiplier: 18.2, 
            speedMultiplier: 0.9, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'knight', count: 8, healthMultiplier: 2.5 }, { type: 'shieldknight', count: 11, healthMultiplier: 2 }, { type: 'frog', count: 31, speedMultiplier: 1.3 }, { type: 'archer', count: 15, speedMultiplier: 1.4 }, { type: 'beefyenemy', count: 12 }, { type: 'villager', count: 12 }] 
        }
        // Wave 39
        , { 
            enemyHealth_multiplier: 42.48, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'waterfrog', count: 1 }, { type: 'airfrog', count: 1 }, { type: 'earthfrog', count: 1 }] 
        }
        // Wave 40
        , { 
            enemyHealth_multiplier: 12.14, 
            speedMultiplier: 1, 
            spawnInterval: 3.8, 
            pattern: [{ type: 'airfrog', count: 7 }, { type: 'earthfrog', count: 7 }, { type: 'airfrog', count: 7 }, { type: 'earthfrog', count: 7 }] 
        }
        // Wave 41
        , { 
            enemyHealth_multiplier: 32.68, 
            speedMultiplier: 1.1, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'shieldknight', count: 10, healthMultiplier: 3 }, { type: 'mage', count: 8 }, { type: 'villager', count: 19 }, { type: 'shieldknight', count: 9, healthMultiplier: 4 }, { type: 'beefyenemy', count: 17, healthMultiplier: 2 }, { type: 'mage', count: 8 }, { type: 'frog', count: 42 }, { type: 'archer', count: 18, healthMultiplier: 5, speedMultiplier: 1.5 }, { type: 'shieldknight', count: 8, healthMultiplier: 6 }] 
        }
        // Wave 42
        , { 
            enemyHealth_multiplier: 19.18, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'beefyenemy', count: 14, healthMultiplier: 3 }, { type: 'frog', count: 39 }, { type: 'mage', count: 8, healthMultiplier: 2 }, { type: 'basic', count: 16 }, { type: 'villager', count: 15 }, { type: 'shieldknight', count: 11 }, { type: 'archer', count: 14, healthMultiplier: 3, speedMultiplier: 2 }] 
        }
        // Wave 43
        , { 
            enemyHealth_multiplier: 90, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'waterfrog', count: 1 }] 
        }
        // Wave 44
        , { 
            enemyHealth_multiplier: 39.07, 
            speedMultiplier: 1.8, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'archer', count: 19 }, { type: 'frog', count: 6 }] 
        }
        // Wave 45
        , { 
            enemyHealth_multiplier: 7.1, 
            speedMultiplier: 1, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'archer', count: 14, healthMultiplier: 2.5, speedMultiplier: 1.1 }, { type: 'frog', count: 37, healthMultiplier: 1.8 }, { type: 'shieldknight', count: 9, healthMultiplier: 2 }, { type: 'archer', count: 10, healthMultiplier: 3, speedMultiplier: 1.5 }] 
        }
        // Wave 46
        , { 
            enemyHealth_multiplier: 21.31, 
            speedMultiplier: 0.9, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'knight', count: 9, healthMultiplier: 2.5 }, { type: 'shieldknight', count: 12, healthMultiplier: 2 }, { type: 'frog', count: 37, speedMultiplier: 1.3 }, { type: 'archer', count: 16, speedMultiplier: 1.4 }, { type: 'beefyenemy', count: 13 }, { type: 'villager', count: 13 }] 
        }
        // Wave 47
        , { 
            enemyHealth_multiplier: 28.42, 
            speedMultiplier: 0.8, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'shieldknight', count: 14 }, { type: 'waterfrog', count: 5 }] 
        }
        // Wave 48
        , { 
            enemyHealth_multiplier: 49.73, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'firefrog', count: 1 }, { type: 'waterfrog', count: 1 }, { type: 'earthfrog', count: 1 }, { type: 'airfrog', count: 1 }] 
        }
        // Wave 49
        , { 
            enemyHealth_multiplier: 29.84, 
            speedMultiplier: 1.2, 
            spawnInterval: 0.85, 
            pattern: [{ type: 'knight', count: 9, healthMultiplier: 3 }, { type: 'archer', count: 19, speedMultiplier: 1.3 }, { type: 'basic', count: 17 }, { type: 'beefyenemy', count: 15, healthMultiplier: 2.5 }, { type: 'mage', count: 9 }, { type: 'frog', count: 48, healthMultiplier: 1.5 }, { type: 'shieldknight', count: 10, healthMultiplier: 4 }] 
        }
        // Wave 50
        , { 
            enemyHealth_multiplier: 14.21, 
            speedMultiplier: 1, 
            spawnInterval: 3.5, 
            pattern: [{ type: 'firefrog', count: 8 }, { type: 'earthfrog', count: 8 }, { type: 'firefrog', count: 8 }, { type: 'earthfrog', count: 8 }] 
        }
        // Wave 51
        , { 
            enemyHealth_multiplier: 21.98, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'beefyenemy', count: 15, healthMultiplier: 3 }, { type: 'frog', count: 44 }, { type: 'mage', count: 9, healthMultiplier: 2 }, { type: 'basic', count: 17 }, { type: 'villager', count: 16 }, { type: 'shieldknight', count: 12 }, { type: 'archer', count: 15, healthMultiplier: 3, speedMultiplier: 2 }] 
        }
        // Wave 52
        , { 
            enemyHealth_multiplier: 37.44, 
            speedMultiplier: 1.1, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'shieldknight', count: 11, healthMultiplier: 3 }, { type: 'mage', count: 9 }, { type: 'villager', count: 20 }, { type: 'shieldknight', count: 10, healthMultiplier: 4 }, { type: 'beefyenemy', count: 18, healthMultiplier: 2 }, { type: 'mage', count: 9 }, { type: 'frog', count: 48 }, { type: 'archer', count: 19, healthMultiplier: 5, speedMultiplier: 1.5 }, { type: 'shieldknight', count: 9, healthMultiplier: 6 }] 
        }
        // Wave 53
        , { 
            enemyHealth_multiplier: 90, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'airfrog', count: 1 }] 
        }
        // Wave 54
        , { 
            enemyHealth_multiplier: 40.7, 
            speedMultiplier: 1.4, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'archer', count: 22 }, { type: 'villager', count: 25 }, { type: 'basic', count: 23 }, { type: 'airfrog', count: 6 }] 
        }
        // Wave 55
        , { 
            enemyHealth_multiplier: 8.14, 
            speedMultiplier: 1, 
            spawnInterval: 0.68, 
            pattern: [{ type: 'archer', count: 15, healthMultiplier: 2.5, speedMultiplier: 1.1 }, { type: 'frog', count: 40, healthMultiplier: 1.8 }, { type: 'shieldknight', count: 10, healthMultiplier: 2 }, { type: 'archer', count: 11, healthMultiplier: 3, speedMultiplier: 1.5 }] 
        }
        // Wave 56
        , { 
            enemyHealth_multiplier: 56.98, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'firefrog', count: 1 }, { type: 'earthfrog', count: 1 }] 
        }
        // Wave 57
        , { 
            enemyHealth_multiplier: 24.42, 
            speedMultiplier: 0.9, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'knight', count: 10, healthMultiplier: 2.5 }, { type: 'shieldknight', count: 13, healthMultiplier: 2 }, { type: 'frog', count: 40, speedMultiplier: 1.3 }, { type: 'archer', count: 17, speedMultiplier: 1.4 }, { type: 'beefyenemy', count: 14 }, { type: 'villager', count: 14 }] 
        }
        // Wave 58
        , { 
            enemyHealth_multiplier: 34.19, 
            speedMultiplier: 1.2, 
            spawnInterval: 0.85, 
            pattern: [{ type: 'knight', count: 10, healthMultiplier: 3 }, { type: 'archer', count: 20, speedMultiplier: 1.3 }, { type: 'basic', count: 18 }, { type: 'beefyenemy', count: 16, healthMultiplier: 2.5 }, { type: 'mage', count: 10 }, { type: 'frog', count: 51, healthMultiplier: 1.5 }, { type: 'shieldknight', count: 11, healthMultiplier: 4 }] 
        }
        // Wave 59
        , { 
            enemyHealth_multiplier: 56.98, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'firefrog', count: 1 }, { type: 'waterfrog', count: 1 }, { type: 'earthfrog', count: 1 }, { type: 'airfrog', count: 1 }] 
        }
        // Wave 60
        , { 
            enemyHealth_multiplier: 24.42, 
            speedMultiplier: 1, 
            spawnInterval: 1.4, 
            pattern: [{ type: 'earthfrog', count: 6 }, { type: 'waterfrog', count: 6 }, { type: 'firefrog', count: 6 }, { type: 'airfrog', count: 6 }, { type: 'frogking', count: 1, healthMultiplier: 3 }] 
        }
        ];

        if (wave > 0 && wave <= waveConfigs.length) {
            return waveConfigs[wave - 1];
        }
        
        return null;
    }
}
