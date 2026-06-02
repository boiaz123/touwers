import { LevelBase } from '../LevelBase.js';

export class DesertLevel6 extends LevelBase {
    static levelMetadata = {
        name: 'Baruk Hadan',
        difficulty: 'Hard',
        order: 6,
        campaign: 'desert'
    };

    constructor() {
        super();
        // Derive instance properties from static metadata
        this.levelName = DesertLevel6.levelMetadata.name;
        this.levelNumber = DesertLevel6.levelMetadata.order;
        this.difficulty = DesertLevel6.levelMetadata.difficulty;
        this.campaign = DesertLevel6.levelMetadata.campaign;
        this.maxWaves = 30;

        // Set terrain elements (prevent tower placement on these areas)
        this.terrainElements = [
            { type: 'water', gridX: 38.00, gridY: 19.00, size: 3, waterType: 'lake' },
            { type: 'rock', gridX: 36.00, gridY: 18.00, size: 2.5, variant: 0 },
            { type: 'rock', gridX: 40.00, gridY: 21.00, size: 2.5, variant: 1 },
            { type: 'rock', gridX: 41.00, gridY: 19.00, size: 1.5, variant: 2 },
            { type: 'rock', gridX: 39.00, gridY: 17.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 36.00, gridY: 20.00, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 40.00, gridY: 17.00, size: 1.5, variant: 1 },
            { type: 'vegetation', gridX: 37.00, gridY: 17.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 41.00, gridY: 20.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 34.00, gridY: 18.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 54.00, gridY: 9.00, size: 2.0667818619079728, variant: 2 },
            { type: 'vegetation', gridX: 48.00, gridY: 10.00, size: 2.726490430787857, variant: 3 },
            { type: 'vegetation', gridX: 52.00, gridY: 9.00, size: 1.2553240389524132, variant: 2 },
            { type: 'vegetation', gridX: 57.00, gridY: 10.00, size: 2.465082443222901, variant: 2 },
            { type: 'vegetation', gridX: 55.00, gridY: 2.00, size: 2.097697676832153, variant: 2 },
            { type: 'vegetation', gridX: 54.00, gridY: 7.00, size: 2.323580298872371, variant: 0 },
            { type: 'vegetation', gridX: 52.00, gridY: 11.00, size: 1.556267989439117, variant: 2 },
            { type: 'vegetation', gridX: 52.00, gridY: 10.00, size: 1.487810792702092, variant: 1 },
            { type: 'vegetation', gridX: 56.00, gridY: 3.00, size: 2.508167905111537, variant: 2 },
            { type: 'vegetation', gridX: 56.00, gridY: 5.00, size: 2.5255085600272937, variant: 0 },
            { type: 'vegetation', gridX: 53.00, gridY: 11.00, size: 2.5445423851010176, variant: 3 },
            { type: 'vegetation', gridX: 56.00, gridY: 5.00, size: 2.6945871762245956, variant: 2 },
            { type: 'vegetation', gridX: 59.00, gridY: 27.00, size: 1.902186324217542, variant: 3 },
            { type: 'vegetation', gridX: 57.00, gridY: 25.00, size: 1.0624214989850786, variant: 0 },
            { type: 'vegetation', gridX: 57.00, gridY: 24.00, size: 1.580830988574064, variant: 1 },
            { type: 'vegetation', gridX: 53.00, gridY: 25.00, size: 1.9025406402475387, variant: 1 },
            { type: 'vegetation', gridX: 55.00, gridY: 28.00, size: 2.500986121022481, variant: 1 },
            { type: 'vegetation', gridX: 50.00, gridY: 30.00, size: 2.325568823094272, variant: 2 },
            { type: 'vegetation', gridX: 49.00, gridY: 27.00, size: 2.9148830103812755, variant: 3 },
            { type: 'vegetation', gridX: 51.00, gridY: 28.00, size: 2.900929988282794, variant: 1 },
            { type: 'vegetation', gridX: 55.00, gridY: 32.00, size: 1.6872759867913292, variant: 2 },
            { type: 'vegetation', gridX: 54.00, gridY: 23.00, size: 1.113794748076519, variant: 2 },
            { type: 'vegetation', gridX: 52.00, gridY: 30.00, size: 2.825140992264587, variant: 1 },
            { type: 'vegetation', gridX: 57.00, gridY: 30.00, size: 2.628603089218937, variant: 0 },
            { type: 'vegetation', gridX: 9.00, gridY: 30.00, size: 2.8534168395357105, variant: 3 },
            { type: 'vegetation', gridX: 8.00, gridY: 30.00, size: 2.259499564726606, variant: 1 },
            { type: 'vegetation', gridX: 9.00, gridY: 27.00, size: 1.376242498613627, variant: 2 },
            { type: 'vegetation', gridX: 9.00, gridY: 29.00, size: 2.837007778274037, variant: 2 },
            { type: 'vegetation', gridX: 7.00, gridY: 25.00, size: 2.3555211535594625, variant: 2 },
            { type: 'vegetation', gridX: 3.00, gridY: 23.00, size: 2.3428158998578255, variant: 0 },
            { type: 'vegetation', gridX: 2.00, gridY: 30.00, size: 1.947635979120653, variant: 2 },
            { type: 'vegetation', gridX: 8.00, gridY: 28.00, size: 2.296531476986162, variant: 2 },
            { type: 'vegetation', gridX: 7.00, gridY: 29.00, size: 1.201555355633576, variant: 0 },
            { type: 'vegetation', gridX: 3.00, gridY: 27.00, size: 1.370555519239714, variant: 3 },
            { type: 'vegetation', gridX: 7.00, gridY: 30.00, size: 1.1899213471940353, variant: 3 },
            { type: 'vegetation', gridX: 4.00, gridY: 23.00, size: 1.0487075278199616, variant: 1 },
            { type: 'vegetation', gridX: 22.00, gridY: 4.00, size: 1.3485954565343086, variant: 2 },
            { type: 'vegetation', gridX: 23.00, gridY: 9.00, size: 2.6108142673723402, variant: 0 },
            { type: 'vegetation', gridX: 27.00, gridY: 3.00, size: 2.1428599215355093, variant: 0 },
            { type: 'vegetation', gridX: 20.00, gridY: 6.00, size: 1.3242534776868187, variant: 3 },
            { type: 'vegetation', gridX: 26.00, gridY: 9.00, size: 2.239375431422246, variant: 2 },
            { type: 'vegetation', gridX: 22.00, gridY: 6.00, size: 1.1093824918040474, variant: 0 },
            { type: 'vegetation', gridX: 18.00, gridY: 7.00, size: 2.7753412310903363, variant: 0 },
            { type: 'vegetation', gridX: 21.00, gridY: 9.00, size: 2.256108347227343, variant: 0 },
            { type: 'vegetation', gridX: 23.00, gridY: 0.00, size: 1.1789567866565496, variant: 0 },
            { type: 'vegetation', gridX: 22.00, gridY: 6.00, size: 1.3387542398133512, variant: 1 },
            { type: 'rock', gridX: 14.00, gridY: 30.00, size: 4, variant: 2 },
            { type: 'rock', gridX: 2.00, gridY: 18.00, size: 4, variant: 2 },
            { type: 'rock', gridX: 12.00, gridY: 3.00, size: 4, variant: 2 },
            { type: 'rock', gridX: 41.00, gridY: 5.00, size: 2, variant: 3 },
            { type: 'rock', gridX: 55.00, gridY: 16.00, size: 2, variant: 3 },
            { type: 'rock', gridX: 12.00, gridY: 25.00, size: 2, variant: 3 },
            { type: 'rock', gridX: 7.00, gridY: 19.00, size: 2, variant: 0 },
            { type: 'rock', gridX: 58.00, gridY: 20.00, size: 2, variant: 1 },
            { type: 'rock', gridX: 10.00, gridY: 2.00, size: 2, variant: 1 }
        ];
    }

    createMeanderingPath(canvasWidth, canvasHeight) {
        const gridWidth = this.gridWidth || 60;
        const gridHeight = this.gridHeight || 33.75;

        const pathInGridCoords = [
            { gridX: 0.00, gridY: 8.00 },
            { gridX: 11.00, gridY: 8.00 },
            { gridX: 34.00, gridY: 25.00 },
            { gridX: 47.00, gridY: 25.00 },
            { gridX: 47.00, gridY: 13.00 },
            { gridX: 30.00, gridY: 13.00 }
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
            spawnInterval: 1, 
            pattern: [{ type: 'earthfrog', count: 1 }] 
        }
        // Wave 2
        , { 
            enemyHealth_multiplier: 2, 
            speedMultiplier: 1, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'frog', count: 17 }] 
        }
        // Wave 3
        , { 
            enemyHealth_multiplier: 1.5, 
            speedMultiplier: 1, 
            spawnInterval: 1.3, 
            pattern: [{ type: 'villager', count: 12, healthMultiplier: 2, speedMultiplier: 0.5 }, { type: 'basic', count: 13 }, { type: 'archer', count: 5, speedMultiplier: 1.5 }] 
        }
        // Wave 4
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 1, 
            spawnInterval: 5, 
            pattern: [{ type: 'beefyenemy', count: 7 }] 
        }
        // Wave 5
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 1, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'beefyenemy', count: 3 }, { type: 'archer', count: 1, healthMultiplier: 3, speedMultiplier: 1.5 }, { type: 'villager', count: 16 }] 
        }
        // Wave 6
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 1.1, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'mage', count: 1, healthMultiplier: 2 }, { type: 'frog', count: 7 }, { type: 'archer', count: 4 }, { type: 'frog', count: 8, healthMultiplier: 4, speedMultiplier: 1.2 }, { type: 'archer', count: 6, speedMultiplier: 1.4 }] 
        }
        // Wave 7
        , { 
            enemyHealth_multiplier: 3, 
            speedMultiplier: 1.2, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'villager', count: 15, healthMultiplier: 4 }, { type: 'basic', count: 13 }, { type: 'frog', count: 6, speedMultiplier: 1.4 }] 
        }
        // Wave 8
        , { 
            enemyHealth_multiplier: 2.5, 
            speedMultiplier: 1, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'basic', count: 14 }, { type: 'villager', count: 11 }, { type: 'archer', count: 13, speedMultiplier: 1.2 }] 
        }
        // Wave 9
        , { 
            enemyHealth_multiplier: 3, 
            speedMultiplier: 1, 
            spawnInterval: 2, 
            pattern: [{ type: 'waterfrog', count: 4 }] 
        }
        // Wave 10
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 1, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'firefrog', count: 1 }, { type: 'airfrog', count: 1 }, { type: 'firefrog', count: 1 }, { type: 'airfrog', count: 1 }] 
        }
        // Wave 11
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 1, 
            spawnInterval: 2, 
            pattern: [{ type: 'shieldknight', count: 2, healthMultiplier: 2 }, { type: 'beefyenemy', count: 5 }, { type: 'knight', count: 1, healthMultiplier: 1.3 }, { type: 'shieldknight', count: 3 }, { type: 'beefyenemy', count: 7, healthMultiplier: 5 }, { type: 'knight', count: 1, healthMultiplier: 2, speedMultiplier: 0.8 }] 
        }
        // Wave 12
        , { 
            enemyHealth_multiplier: 3, 
            speedMultiplier: 1, 
            spawnInterval: 0.5, 
            pattern: [{ type: 'mage', count: 3 }, { type: 'frog', count: 12, healthMultiplier: 4, speedMultiplier: 1.5 }] 
        }
        // Wave 13
        , { 
            enemyHealth_multiplier: 2.2, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'beefyenemy', count: 7, healthMultiplier: 5 }, { type: 'frog', count: 12 }, { type: 'mage', count: 1, healthMultiplier: 2 }, { type: 'basic', count: 11 }, { type: 'villager', count: 9 }, { type: 'shieldknight', count: 4 }, { type: 'archer', count: 9, healthMultiplier: 2, speedMultiplier: 2 }] 
        }
        // Wave 14
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 0.8, 
            spawnInterval: 0.4, 
            pattern: [{ type: 'shieldknight', count: 5 }] 
        }
        // Wave 15
        , { 
            enemyHealth_multiplier: 2, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'knight', count: 3 }] 
        }
        // Wave 16
        , { 
            enemyHealth_multiplier: 1, 
            speedMultiplier: 1, 
            spawnInterval: 1, 
            pattern: [{ type: 'knight', count: 1 }, { type: 'shieldknight', count: 2, healthMultiplier: 2 }, { type: 'mage', count: 1, healthMultiplier: 2 }, { type: 'shieldknight', count: 1, healthMultiplier: 4 }] 
        }
        // Wave 17
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 1, 
            spawnInterval: 1, 
            pattern: [{ type: 'mage', count: 4, speedMultiplier: 0.6 }] 
        }
        // Wave 18
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 1.2, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'archer', count: 17 }, { type: 'villager', count: 19 }, { type: 'basic', count: 17 }] 
        }
        // Wave 19
        , { 
            enemyHealth_multiplier: 4.5, 
            speedMultiplier: 1.5, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'archer', count: 26 }] 
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
            enemyHealth_multiplier: 4.4, 
            speedMultiplier: 1.1, 
            spawnInterval: 1, 
            pattern: [{ type: 'shieldknight', count: 3, healthMultiplier: 3 }, { type: 'mage', count: 1 }, { type: 'villager', count: 12 }, { type: 'shieldknight', count: 2, healthMultiplier: 4 }, { type: 'beefyenemy', count: 10 }, { type: 'mage', count: 1 }, { type: 'frog', count: 14 }, { type: 'archer', count: 11, healthMultiplier: 5, speedMultiplier: 1.5 }, { type: 'shieldknight', count: 1, healthMultiplier: 6, speedMultiplier: 1 }] 
        }
        // Wave 22
        , { 
            enemyHealth_multiplier: 1, 
            speedMultiplier: 1, 
            spawnInterval: 2, 
            pattern: [{ type: 'mage', count: 1, healthMultiplier: 2 }, { type: 'firefrog', count: 1, healthMultiplier: 5 }] 
        }
        // Wave 23
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 1.4, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'archer', count: 26 }] 
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
            enemyHealth_multiplier: 5, 
            speedMultiplier: 1, 
            spawnInterval: 1, 
            pattern: [{ type: 'mage', count: 1 }, { type: 'waterfrog', count: 1 }, { type: 'mage', count: 1 }, { type: 'airfrog', count: 1 }] 
        }
        // Wave 26
        , { 
            enemyHealth_multiplier: 2.5, 
            speedMultiplier: 1, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'shieldknight', count: 3, speedMultiplier: 1.2 }, { type: 'beefyenemy', count: 9, healthMultiplier: 6 }, { type: 'frog', count: 14 }, { type: 'villager', count: 11 }, { type: 'archer', count: 13, speedMultiplier: 1.4 }, { type: 'knight', count: 1, healthMultiplier: 6, speedMultiplier: 0.5 }] 
        }
        // Wave 27
        , { 
            enemyHealth_multiplier: 7.5, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'waterfrog', count: 1 }, { type: 'earthfrog', count: 1 }] 
        }
        // Wave 28
        , { 
            enemyHealth_multiplier: 2.5, 
            speedMultiplier: 1, 
            spawnInterval: 0.9, 
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
            enemyHealth_multiplier: 14, 
            speedMultiplier: 1, 
            spawnInterval: 1, 
            pattern: [{ type: 'mage', count: 1, healthMultiplier: 8, speedMultiplier: 0.8 }, { type: 'airfrog', count: 1 }, { type: 'earthfrog', count: 1 }] 
        }
        ];

        if (wave > 0 && wave <= waveConfigs.length) {
            return waveConfigs[wave - 1];
        }
        
        return null;
    }
}