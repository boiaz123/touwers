import { LevelBase } from '../LevelBase.js';

export class SpaceLevel5 extends LevelBase {
    static levelMetadata = {
        name: 'Vux\'Xen\'Zeel',
        difficulty: 'Nightmare',
        order: 5,
        campaign: 'space'
    };

    constructor() {
        super();
        // Derive instance properties from static metadata
        this.levelName = SpaceLevel5.levelMetadata.name;
        this.levelNumber = SpaceLevel5.levelMetadata.order;
        this.difficulty = SpaceLevel5.levelMetadata.difficulty;
        this.campaign = SpaceLevel5.levelMetadata.campaign;
        this.maxWaves = 51;

        // Set terrain elements (prevent tower placement on these areas)
        this.terrainElements = [
            { type: 'vegetation', gridX: 5.00, gridY: 6.00, size: 2.42678094533279, variant: 2 },
            { type: 'vegetation', gridX: 6.00, gridY: 8.00, size: 1.3633563803718087, variant: 2 },
            { type: 'vegetation', gridX: 3.00, gridY: 7.00, size: 1.4965422790147211, variant: 3 },
            { type: 'vegetation', gridX: 6.00, gridY: 9.00, size: 1.1904296577838993, variant: 1 },
            { type: 'vegetation', gridX: 9.00, gridY: 7.00, size: 2.064313275925045, variant: 1 },
            { type: 'vegetation', gridX: 1.00, gridY: 7.00, size: 1.9828001637465744, variant: 0 },
            { type: 'vegetation', gridX: 5.00, gridY: 2.00, size: 2.0416225376179464, variant: 2 },
            { type: 'vegetation', gridX: 5.00, gridY: 10.00, size: 2.273705136072219, variant: 3 },
            { type: 'vegetation', gridX: 4.00, gridY: 5.00, size: 1.918136278404806, variant: 3 },
            { type: 'vegetation', gridX: 9.00, gridY: 4.00, size: 2.323609018421103, variant: 1 },
            { type: 'vegetation', gridX: 1.00, gridY: 5.00, size: 1.3738403386575733, variant: 1 },
            { type: 'vegetation', gridX: 55.00, gridY: 1.00, size: 2.202796253913112, variant: 2 },
            { type: 'vegetation', gridX: 51.00, gridY: 5.00, size: 1.8375947080843327, variant: 3 },
            { type: 'vegetation', gridX: 53.00, gridY: 7.00, size: 1.673091885846692, variant: 1 },
            { type: 'vegetation', gridX: 52.00, gridY: 6.00, size: 1.9235493085853552, variant: 2 },
            { type: 'vegetation', gridX: 59.00, gridY: 5.00, size: 1.7140510059515375, variant: 3 },
            { type: 'vegetation', gridX: 58.00, gridY: 5.00, size: 1.3770781062976525, variant: 0 },
            { type: 'vegetation', gridX: 51.00, gridY: 10.00, size: 2.355449379788867, variant: 0 },
            { type: 'vegetation', gridX: 53.00, gridY: 7.00, size: 1.3406556640161627, variant: 1 },
            { type: 'vegetation', gridX: 53.00, gridY: 4.00, size: 2.108995870530789, variant: 3 },
            { type: 'vegetation', gridX: 56.00, gridY: 5.00, size: 1.2992473623088163, variant: 1 },
            { type: 'vegetation', gridX: 41.00, gridY: 1.00, size: 1.9333775107432476, variant: 3 },
            { type: 'vegetation', gridX: 38.00, gridY: 3.00, size: 1.675283045514239, variant: 0 },
            { type: 'vegetation', gridX: 39.00, gridY: 9.00, size: 1.4387595185629674, variant: 2 },
            { type: 'vegetation', gridX: 39.00, gridY: 8.00, size: 1.6029555625873568, variant: 1 },
            { type: 'vegetation', gridX: 43.00, gridY: 6.00, size: 2.1235053598708937, variant: 2 },
            { type: 'vegetation', gridX: 37.00, gridY: 8.00, size: 1.967352610584598, variant: 0 },
            { type: 'vegetation', gridX: 35.00, gridY: 5.00, size: 1.9481825584566914, variant: 0 },
            { type: 'vegetation', gridX: 45.00, gridY: 5.00, size: 1.0320026475245938, variant: 3 },
            { type: 'vegetation', gridX: 36.00, gridY: 3.00, size: 2.2106783460787423, variant: 0 },
            { type: 'vegetation', gridX: 36.00, gridY: 7.00, size: 1.9486503375700641, variant: 0 },
            { type: 'vegetation', gridX: 44.00, gridY: 8.00, size: 1.456615668664567, variant: 1 },
            { type: 'vegetation', gridX: 18.00, gridY: 6.00, size: 2.405778017478191, variant: 2 },
            { type: 'vegetation', gridX: 17.00, gridY: 7.00, size: 1.5193455768785848, variant: 0 },
            { type: 'vegetation', gridX: 15.00, gridY: 2.00, size: 1.558212326830925, variant: 1 },
            { type: 'vegetation', gridX: 13.00, gridY: 9.00, size: 1.109988620543501, variant: 3 },
            { type: 'vegetation', gridX: 17.00, gridY: 7.00, size: 1.535954243816565, variant: 2 },
            { type: 'vegetation', gridX: 21.00, gridY: 5.00, size: 1.4781926282376583, variant: 3 },
            { type: 'vegetation', gridX: 15.00, gridY: 4.00, size: 2.0316555349496532, variant: 3 },
            { type: 'vegetation', gridX: 14.00, gridY: 8.00, size: 1.4416642374455575, variant: 0 },
            { type: 'vegetation', gridX: 15.00, gridY: 9.00, size: 1.3599885214607894, variant: 0 },
            { type: 'vegetation', gridX: 18.00, gridY: 8.00, size: 1.0919956671056328, variant: 3 },
            { type: 'vegetation', gridX: 30.00, gridY: 1.00, size: 2.3355011832025943, variant: 2 },
            { type: 'vegetation', gridX: 27.00, gridY: 0.00, size: 1.2225035720302737, variant: 1 },
            { type: 'vegetation', gridX: 29.00, gridY: 0.00, size: 1.625897297587984, variant: 0 },
            { type: 'vegetation', gridX: 32.00, gridY: 8.00, size: 1.385895160076232, variant: 2 },
            { type: 'vegetation', gridX: 29.00, gridY: 7.00, size: 1.1742979014251207, variant: 2 },
            { type: 'vegetation', gridX: 31.00, gridY: 5.00, size: 2.4652638080042193, variant: 0 },
            { type: 'vegetation', gridX: 28.00, gridY: 6.00, size: 1.01811501555862, variant: 1 },
            { type: 'vegetation', gridX: 32.00, gridY: 5.00, size: 2.2312198998253674, variant: 2 },
            { type: 'vegetation', gridX: 32.00, gridY: 3.00, size: 2.365837001288176, variant: 1 },
            { type: 'vegetation', gridX: 6.00, gridY: 15.00, size: 2.3889858118471508, variant: 2 },
            { type: 'vegetation', gridX: 2.00, gridY: 13.00, size: 1.250138580095071, variant: 2 },
            { type: 'vegetation', gridX: 2.00, gridY: 17.00, size: 2.095484267474537, variant: 3 },
            { type: 'vegetation', gridX: 3.00, gridY: 19.00, size: 1.3940394624017158, variant: 3 },
            { type: 'vegetation', gridX: 3.00, gridY: 13.00, size: 1.05373273944324, variant: 3 },
            { type: 'vegetation', gridX: 6.00, gridY: 15.00, size: 1.769791644576099, variant: 0 },
            { type: 'vegetation', gridX: 3.00, gridY: 24.00, size: 1.3610132377765167, variant: 1 },
            { type: 'vegetation', gridX: 2.00, gridY: 21.00, size: 1.526771312630321, variant: 3 },
            { type: 'vegetation', gridX: 3.00, gridY: 28.00, size: 1.376931032776195, variant: 2 },
            { type: 'vegetation', gridX: 4.00, gridY: 25.00, size: 1.4340543508348924, variant: 2 },
            { type: 'vegetation', gridX: 53.00, gridY: 25.00, size: 2.0240084304222754, variant: 0 },
            { type: 'vegetation', gridX: 57.00, gridY: 28.00, size: 1.4824483317193315, variant: 1 },
            { type: 'vegetation', gridX: 56.00, gridY: 21.00, size: 1.7010023199246098, variant: 2 },
            { type: 'vegetation', gridX: 59.00, gridY: 27.00, size: 2.230732134740901, variant: 2 },
            { type: 'vegetation', gridX: 57.00, gridY: 23.00, size: 1.7441563700100007, variant: 0 },
            { type: 'vegetation', gridX: 55.00, gridY: 25.00, size: 1.9263279162987494, variant: 3 },
            { type: 'vegetation', gridX: 59.00, gridY: 18.00, size: 1.6758469477355442, variant: 2 },
            { type: 'vegetation', gridX: 56.00, gridY: 12.00, size: 1.3061759140247102, variant: 3 },
            { type: 'vegetation', gridX: 56.00, gridY: 17.00, size: 2.481406279629317, variant: 2 },
            { type: 'vegetation', gridX: 59.00, gridY: 14.00, size: 1.665247411891773, variant: 0 },
            { type: 'vegetation', gridX: 57.00, gridY: 13.00, size: 2.036342992199897, variant: 3 },
            { type: 'vegetation', gridX: 50.00, gridY: 12.00, size: 1.3490041971524267, variant: 3 },
            { type: 'vegetation', gridX: 45.00, gridY: 8.00, size: 1.540661375998495, variant: 3 },
            { type: 'vegetation', gridX: 48.00, gridY: 11.00, size: 1.2319091684464958, variant: 2 },
            { type: 'vegetation', gridX: 46.00, gridY: 13.00, size: 2.24666213218906, variant: 3 },
            { type: 'vegetation', gridX: 50.00, gridY: 10.00, size: 1.4196183139590026, variant: 3 },
            { type: 'vegetation', gridX: 48.00, gridY: 11.00, size: 2.2095378374554224, variant: 2 },
            { type: 'vegetation', gridX: 50.00, gridY: 9.00, size: 1.2974038872536806, variant: 1 },
            { type: 'water', gridX: 29.00, gridY: 23.00, size: 3, waterType: 'lake' },
            { type: 'rock', gridX: 26.00, gridY: 24.00, size: 1, variant: 1 },
            { type: 'rock', gridX: 31.00, gridY: 21.00, size: 1, variant: 0 },
            { type: 'rock', gridX: 32.00, gridY: 24.00, size: 1, variant: 2 },
            { type: 'rock', gridX: 21.00, gridY: 9.00, size: 1, variant: 2 },
            { type: 'rock', gridX: 6.00, gridY: 31.00, size: 1, variant: 2 },
            { type: 'rock', gridX: 43.00, gridY: 31.00, size: 1, variant: 2 }
        ];
    }

    createMeanderingPath(canvasWidth, canvasHeight) {
        const gridWidth = this.gridWidth || 60;
        const gridHeight = this.gridHeight || 33.75;

        const pathInGridCoords = [
            { gridX: 52.00, gridY: 34.00 },
            { gridX: 52.00, gridY: 26.00 },
            { gridX: 39.00, gridY: 26.00 },
            { gridX: 34.00, gridY: 29.00 },
            { gridX: 24.00, gridY: 29.00 },
            { gridX: 20.00, gridY: 26.00 },
            { gridX: 10.00, gridY: 26.00 },
            { gridX: 10.00, gridY: 20.00 },
            { gridX: 20.00, gridY: 20.00 },
            { gridX: 24.00, gridY: 17.00 },
            { gridX: 34.00, gridY: 17.00 },
            { gridX: 39.00, gridY: 20.00 },
            { gridX: 52.00, gridY: 20.00 }
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
            enemyHealth_multiplier: 1.4, 
            speedMultiplier: 1, 
            spawnInterval: 0.86, 
            pattern: [{ type: 'frog', count: 8 }, { type: 'frog', count: 9, healthMultiplier: 2, speedMultiplier: 1.2 }, { type: 'frog', count: 10, healthMultiplier: 3 }] 
        }
        // Wave 2
        , { 
            enemyHealth_multiplier: 1.72, 
            speedMultiplier: 1, 
            spawnInterval: 1.14, 
            pattern: [{ type: 'villager', count: 9 }, { type: 'villager', count: 11, healthMultiplier: 1.5 }, { type: 'basic', count: 7, healthMultiplier: 1.3 }] 
        }
        // Wave 3
        , { 
            enemyHealth_multiplier: 2.03, 
            speedMultiplier: 1, 
            spawnInterval: 0.96, 
            pattern: [{ type: 'villager', count: 9, healthMultiplier: 1.8, speedMultiplier: 0.6 }, { type: 'basic', count: 11, healthMultiplier: 1.8 }, { type: 'archer', count: 4, speedMultiplier: 1.5 }] 
        }
        // Wave 4
        , { 
            enemyHealth_multiplier: 2.35, 
            speedMultiplier: 1, 
            spawnInterval: 0.68, 
            pattern: [{ type: 'beefyenemy', count: 8 }] 
        }
        // Wave 5
        , { 
            enemyHealth_multiplier: 2.66, 
            speedMultiplier: 1, 
            spawnInterval: 0.78, 
            pattern: [{ type: 'archer', count: 8, healthMultiplier: 2.5, speedMultiplier: 1.1 }, { type: 'frog', count: 11, healthMultiplier: 1.8 }, { type: 'shieldknight', count: 3, healthMultiplier: 2 }, { type: 'archer', count: 4, healthMultiplier: 3, speedMultiplier: 1.5 }] 
        }
        // Wave 6
        , { 
            enemyHealth_multiplier: 2.98, 
            speedMultiplier: 1, 
            spawnInterval: 0.88, 
            pattern: [{ type: 'mage', count: 2, healthMultiplier: 2 }, { type: 'frog', count: 12 }] 
        }
        // Wave 7
        , { 
            enemyHealth_multiplier: 3.29, 
            speedMultiplier: 1.2, 
            spawnInterval: 0.58, 
            pattern: [{ type: 'villager', count: 12 }, { type: 'basic', count: 10 }, { type: 'frog', count: 9, healthMultiplier: 2, speedMultiplier: 1.3 }] 
        }
        // Wave 8
        , { 
            enemyHealth_multiplier: 3.61, 
            speedMultiplier: 1.2, 
            spawnInterval: 0.78, 
            pattern: [{ type: 'basic', count: 11 }, { type: 'villager', count: 9 }, { type: 'archer', count: 11, speedMultiplier: 1.2 }] 
        }
        // Wave 9
        , { 
            enemyHealth_multiplier: 3.92, 
            speedMultiplier: 0.8, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'shieldknight', count: 10 }, { type: 'walkingfrog', count: 3 }] 
        }
        // Wave 10
        , { 
            enemyHealth_multiplier: 4.24, 
            speedMultiplier: 1, 
            spawnInterval: 1.95, 
            pattern: [{ type: 'beefyenemy', count: 5 }, { type: 'knight', count: 3 }] 
        }
        // Wave 11
        , { 
            enemyHealth_multiplier: 4.39, 
            speedMultiplier: 1, 
            spawnInterval: 0.82, 
            pattern: [{ type: 'frog', count: 10 }, { type: 'frog', count: 11, healthMultiplier: 2, speedMultiplier: 1.2 }, { type: 'frog', count: 12, healthMultiplier: 3 }] 
        }
        // Wave 12
        , { 
            enemyHealth_multiplier: 4.54, 
            speedMultiplier: 0.9, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'knight', count: 5, healthMultiplier: 2.5 }, { type: 'shieldknight', count: 8, healthMultiplier: 2 }, { type: 'frog', count: 13, speedMultiplier: 1.3 }, { type: 'archer', count: 12, speedMultiplier: 1.4 }, { type: 'beefyenemy', count: 9 }, { type: 'villager', count: 9 }] 
        }
        // Wave 13
        , { 
            enemyHealth_multiplier: 4.68, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'beefyenemy', count: 10, healthMultiplier: 3 }, { type: 'frog', count: 15 }, { type: 'mage', count: 4, healthMultiplier: 2 }, { type: 'basic', count: 12 }, { type: 'villager', count: 11 }, { type: 'shieldknight', count: 7 }, { type: 'archer', count: 10, healthMultiplier: 3, speedMultiplier: 2 }] 
        }
        // Wave 14
        , { 
            enemyHealth_multiplier: 4.83, 
            speedMultiplier: 1, 
            spawnInterval: 0.66, 
            pattern: [{ type: 'beefyenemy', count: 10 }, { type: 'frog', count: 3 }] 
        }
        // Wave 15
        , { 
            enemyHealth_multiplier: 4.98, 
            speedMultiplier: 1, 
            spawnInterval: 0.76, 
            pattern: [{ type: 'archer', count: 10, healthMultiplier: 2.5, speedMultiplier: 1.1 }, { type: 'frog', count: 14, healthMultiplier: 1.8 }, { type: 'walkingfrog', count: 5, healthMultiplier: 2 }, { type: 'archer', count: 6, healthMultiplier: 3, speedMultiplier: 1.5 }] 
        }
        // Wave 16
        , { 
            enemyHealth_multiplier: 5.13, 
            speedMultiplier: 1, 
            spawnInterval: 4.7, 
            pattern: [{ type: 'firefrog', count: 2 }, { type: 'airfrog', count: 2 }, { type: 'firefrog', count: 2 }, { type: 'airfrog', count: 2 }] 
        }
        // Wave 17
        , { 
            enemyHealth_multiplier: 5.28, 
            speedMultiplier: 1, 
            spawnInterval: 11.9, 
            pattern: [{ type: 'knight', count: 6 }, { type: 'frog', count: 4 }] 
        }
        // Wave 18
        , { 
            enemyHealth_multiplier: 5.42, 
            speedMultiplier: 1, 
            spawnInterval: 1, 
            pattern: [{ type: 'knight', count: 4, healthMultiplier: 3 }, { type: 'shieldknight', count: 5, healthMultiplier: 2 }, { type: 'mage', count: 4, healthMultiplier: 2 }, { type: 'shieldknight', count: 4, healthMultiplier: 4 }, { type: 'frog', count: 4 }] 
        }
        // Wave 19
        , { 
            enemyHealth_multiplier: 5.57, 
            speedMultiplier: 1, 
            spawnInterval: 4.4, 
            pattern: [{ type: 'waterfrog', count: 4 }, { type: 'earthfrog', count: 4 }, { type: 'waterfrog', count: 4 }, { type: 'earthfrog', count: 4 }] 
        }
        // Wave 20
        , { 
            enemyHealth_multiplier: 5.72, 
            speedMultiplier: 1, 
            spawnInterval: 1, 
            pattern: [{ type: 'mage', count: 7, speedMultiplier: 0.6 }, { type: 'frog', count: 12, speedMultiplier: 1.2 }] 
        }
        // Wave 21
        , { 
            enemyHealth_multiplier: 5.87, 
            speedMultiplier: 1.1, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'shieldknight', count: 7, healthMultiplier: 3 }, { type: 'mage', count: 5 }, { type: 'villager', count: 16 }, { type: 'shieldknight', count: 6, healthMultiplier: 4 }, { type: 'beefyenemy', count: 14, healthMultiplier: 2 }, { type: 'mage', count: 5 }, { type: 'frog', count: 24 }, { type: 'archer', count: 15, healthMultiplier: 5, speedMultiplier: 1.5 }, { type: 'shieldknight', count: 5, healthMultiplier: 6 }] 
        }
        // Wave 22
        , { 
            enemyHealth_multiplier: 6.02, 
            speedMultiplier: 1.3, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'archer', count: 18 }, { type: 'villager', count: 21 }, { type: 'basic', count: 19 }, { type: 'frog', count: 4 }] 
        }
        // Wave 23
        , { 
            enemyHealth_multiplier: 6.17, 
            speedMultiplier: 1, 
            spawnInterval: 0.78, 
            pattern: [{ type: 'frog', count: 15 }, { type: 'frog', count: 16, healthMultiplier: 2, speedMultiplier: 1.2 }, { type: 'frog', count: 18, healthMultiplier: 3 }] 
        }
        // Wave 24
        , { 
            enemyHealth_multiplier: 6.32, 
            speedMultiplier: 1.7, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'archer', count: 16 }, { type: 'frog', count: 4 }] 
        }
        // Wave 25
        , { 
            enemyHealth_multiplier: 6.47, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'mage', count: 1 }, { type: 'waterfrog', count: 1 }] 
        }
        // Wave 26
        , { 
            enemyHealth_multiplier: 6.61, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'beefyenemy', count: 11, healthMultiplier: 3 }, { type: 'frog', count: 24 }, { type: 'mage', count: 5, healthMultiplier: 2 }, { type: 'basic', count: 13 }, { type: 'villager', count: 12 }, { type: 'shieldknight', count: 8 }, { type: 'archer', count: 11, healthMultiplier: 3, speedMultiplier: 2 }] 
        }
        // Wave 27
        , { 
            enemyHealth_multiplier: 6.76, 
            speedMultiplier: 0.9, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'knight', count: 6, healthMultiplier: 2.5 }, { type: 'shieldknight', count: 9, healthMultiplier: 2 }, { type: 'frog', count: 22, speedMultiplier: 1.3 }, { type: 'archer', count: 13, speedMultiplier: 1.4 }, { type: 'beefyenemy', count: 10 }, { type: 'villager', count: 10 }] 
        }
        // Wave 28
        , { 
            enemyHealth_multiplier: 6.91, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'waterfrog', count: 1 }, { type: 'earthfrog', count: 1 }, { type: 'firefrog', count: 1 }] 
        }
        // Wave 29
        , { 
            enemyHealth_multiplier: 7.06, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'firefrog', count: 1 }] 
        }
        // Wave 30
        , { 
            enemyHealth_multiplier: 7.21, 
            speedMultiplier: 1, 
            spawnInterval: 4.1, 
            pattern: [{ type: 'firefrog', count: 5 }, { type: 'waterfrog', count: 5 }, { type: 'firefrog', count: 5 }, { type: 'waterfrog', count: 5 }] 
        }
        // Wave 31
        , { 
            enemyHealth_multiplier: 7.36, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'mage', count: 1 }, { type: 'airfrog', count: 1 }] 
        }
        // Wave 32
        , { 
            enemyHealth_multiplier: 7.51, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'beefyenemy', count: 12, healthMultiplier: 3 }, { type: 'frog', count: 28 }, { type: 'mage', count: 6, healthMultiplier: 2 }, { type: 'basic', count: 14 }, { type: 'villager', count: 13 }, { type: 'shieldknight', count: 9 }, { type: 'archer', count: 12, healthMultiplier: 3, speedMultiplier: 2 }] 
        }
        // Wave 33
        , { 
            enemyHealth_multiplier: 7.65, 
            speedMultiplier: 1.4, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'archer', count: 19 }, { type: 'villager', count: 22 }, { type: 'basic', count: 20 }, { type: 'frog', count: 5 }] 
        }
        // Wave 34
        , { 
            enemyHealth_multiplier: 7.8, 
            speedMultiplier: 1.7, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'archer', count: 17 }, { type: 'frog', count: 5 }] 
        }
        // Wave 35
        , { 
            enemyHealth_multiplier: 7.95, 
            speedMultiplier: 1, 
            spawnInterval: 0.72, 
            pattern: [{ type: 'archer', count: 12, healthMultiplier: 2.5, speedMultiplier: 1.1 }, { type: 'frog', count: 27, healthMultiplier: 1.8 }, { type: 'shieldknight', count: 7, healthMultiplier: 2 }, { type: 'archer', count: 8, healthMultiplier: 3, speedMultiplier: 1.5 }] 
        }
        // Wave 36
        , { 
            enemyHealth_multiplier: 8.1, 
            speedMultiplier: 1.1, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'shieldknight', count: 8, healthMultiplier: 3 }, { type: 'mage', count: 6 }, { type: 'villager', count: 17 }, { type: 'shieldknight', count: 7, healthMultiplier: 4 }, { type: 'beefyenemy', count: 15, healthMultiplier: 2 }, { type: 'mage', count: 6 }, { type: 'frog', count: 35 }, { type: 'archer', count: 16, healthMultiplier: 5, speedMultiplier: 1.5 }, { type: 'shieldknight', count: 6, healthMultiplier: 6 }] 
        }
        // Wave 37
        , { 
            enemyHealth_multiplier: 8.25, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'earthfrog', count: 1 }] 
        }
        // Wave 38
        , { 
            enemyHealth_multiplier: 8.39, 
            speedMultiplier: 0.9, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'knight', count: 7, healthMultiplier: 2.5 }, { type: 'shieldknight', count: 10, healthMultiplier: 2 }, { type: 'frog', count: 29, speedMultiplier: 1.3 }, { type: 'archer', count: 14, speedMultiplier: 1.4 }, { type: 'beefyenemy', count: 11 }, { type: 'villager', count: 11 }] 
        }
        // Wave 39
        , { 
            enemyHealth_multiplier: 8.54, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'waterfrog', count: 1 }, { type: 'airfrog', count: 1 }, { type: 'earthfrog', count: 1 }] 
        }
        // Wave 40
        , { 
            enemyHealth_multiplier: 8.69, 
            speedMultiplier: 1, 
            spawnInterval: 3.8, 
            pattern: [{ type: 'airfrog', count: 6 }, { type: 'earthfrog', count: 6 }, { type: 'airfrog', count: 6 }, { type: 'earthfrog', count: 6 }] 
        }
        // Wave 41
        , { 
            enemyHealth_multiplier: 23.4, 
            speedMultiplier: 1.1, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'shieldknight', count: 9, healthMultiplier: 3 }, { type: 'mage', count: 7 }, { type: 'villager', count: 18 }, { type: 'shieldknight', count: 8, healthMultiplier: 4 }, { type: 'beefyenemy', count: 16, healthMultiplier: 2 }, { type: 'mage', count: 7 }, { type: 'frog', count: 40 }, { type: 'archer', count: 17, healthMultiplier: 5, speedMultiplier: 1.5 }, { type: 'shieldknight', count: 7, healthMultiplier: 6 }] 
        }
        // Wave 42
        , { 
            enemyHealth_multiplier: 13.74, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'beefyenemy', count: 13, healthMultiplier: 3 }, { type: 'frog', count: 37 }, { type: 'mage', count: 7, healthMultiplier: 2 }, { type: 'basic', count: 15 }, { type: 'villager', count: 14 }, { type: 'shieldknight', count: 10 }, { type: 'archer', count: 13, healthMultiplier: 3, speedMultiplier: 2 }] 
        }
        // Wave 43
        , { 
            enemyHealth_multiplier: 71.23, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'waterfrog', count: 1 }] 
        }
        // Wave 44
        , { 
            enemyHealth_multiplier: 27.98, 
            speedMultiplier: 1.8, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'archer', count: 18 }, { type: 'frog', count: 6 }] 
        }
        // Wave 45
        , { 
            enemyHealth_multiplier: 5.09, 
            speedMultiplier: 1, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'archer', count: 13, healthMultiplier: 2.5, speedMultiplier: 1.1 }, { type: 'frog', count: 34, healthMultiplier: 1.8 }, { type: 'shieldknight', count: 8, healthMultiplier: 2 }, { type: 'archer', count: 9, healthMultiplier: 3, speedMultiplier: 1.5 }] 
        }
        // Wave 46
        , { 
            enemyHealth_multiplier: 15.26, 
            speedMultiplier: 0.9, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'knight', count: 8, healthMultiplier: 2.5 }, { type: 'shieldknight', count: 11, healthMultiplier: 2 }, { type: 'frog', count: 35, speedMultiplier: 1.3 }, { type: 'archer', count: 15, speedMultiplier: 1.4 }, { type: 'beefyenemy', count: 12 }, { type: 'villager', count: 12 }] 
        }
        // Wave 47
        , { 
            enemyHealth_multiplier: 20.35, 
            speedMultiplier: 0.8, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'shieldknight', count: 13 }, { type: 'frog', count: 7 }] 
        }
        // Wave 48
        , { 
            enemyHealth_multiplier: 35.62, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'firefrog', count: 1 }, { type: 'waterfrog', count: 1 }, { type: 'earthfrog', count: 1 }, { type: 'airfrog', count: 1 }] 
        }
        // Wave 49
        , { 
            enemyHealth_multiplier: 21.37, 
            speedMultiplier: 1.2, 
            spawnInterval: 0.85, 
            pattern: [{ type: 'knight', count: 8, healthMultiplier: 3 }, { type: 'archer', count: 18, speedMultiplier: 1.3 }, { type: 'basic', count: 16 }, { type: 'beefyenemy', count: 14, healthMultiplier: 2.5 }, { type: 'mage', count: 8 }, { type: 'frog', count: 46, healthMultiplier: 1.5 }, { type: 'shieldknight', count: 9, healthMultiplier: 4 }] 
        }
        // Wave 50
        , { 
            enemyHealth_multiplier: 15.74, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'beefyenemy', count: 14, healthMultiplier: 3 }, { type: 'frog', count: 42 }, { type: 'mage', count: 8, healthMultiplier: 2 }, { type: 'basic', count: 16 }, { type: 'villager', count: 15 }, { type: 'shieldknight', count: 11 }, { type: 'archer', count: 14, healthMultiplier: 3, speedMultiplier: 2 }] 
        }
        // Wave 51
        , { 
            enemyHealth_multiplier: 10.18, 
            speedMultiplier: 1, 
            spawnInterval: 3.5, 
            pattern: [{ type: 'firefrog', count: 7 }, { type: 'earthfrog', count: 7 }, { type: 'firefrog', count: 7 }, { type: 'earthfrog', count: 7 }] 
        }
        ];

        if (wave > 0 && wave <= waveConfigs.length) {
            return waveConfigs[wave - 1];
        }
        
        return null;
    }
}