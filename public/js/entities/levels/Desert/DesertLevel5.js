import { LevelBase } from '../LevelBase.js';

export class DesertLevel5 extends LevelBase {
    static levelMetadata = {
        name: 'Al Jazar',
        difficulty: 'Hard',
        order: 5,
        campaign: 'desert'
    };

    constructor() {
        super();
        // Derive instance properties from static metadata
        this.levelName = DesertLevel5.levelMetadata.name;
        this.levelNumber = DesertLevel5.levelMetadata.order;
        this.difficulty = DesertLevel5.levelMetadata.difficulty;
        this.campaign = DesertLevel5.levelMetadata.campaign;
        this.maxWaves = 27;

        // Set terrain elements (prevent tower placement on these areas)
        this.terrainElements = [
            { type: 'water', gridX: 60.00, gridY: 15.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 59.00, gridY: 15.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 59.00, gridY: 14.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 58.00, gridY: 13.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 58.00, gridY: 12.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 58.00, gridY: 11.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 57.00, gridY: 10.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 57.00, gridY: 10.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 57.00, gridY: 10.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 56.00, gridY: 9.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 55.00, gridY: 8.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 54.00, gridY: 8.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 54.00, gridY: 7.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 53.00, gridY: 7.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 53.00, gridY: 7.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 52.00, gridY: 7.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 51.00, gridY: 7.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 50.00, gridY: 6.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 49.00, gridY: 6.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 48.00, gridY: 6.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 47.00, gridY: 6.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 46.00, gridY: 6.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 45.00, gridY: 6.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 44.00, gridY: 6.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 43.00, gridY: 6.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 43.00, gridY: 6.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 42.00, gridY: 6.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 42.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 41.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 40.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 39.00, gridY: 4.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 38.00, gridY: 4.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 37.00, gridY: 4.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 37.00, gridY: 4.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 37.00, gridY: 3.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 36.00, gridY: 2.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 35.00, gridY: 1.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 34.00, gridY: 1.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 34.00, gridY: 0.00, size: 1.5, waterType: 'river' },
            { type: 'rock', gridX: 59.00, gridY: 17.00, size: 3, variant: 1 },
            { type: 'rock', gridX: 28.00, gridY: 29.00, size: 3, variant: 1 },
            { type: 'rock', gridX: 5.00, gridY: 5.00, size: 3, variant: 0 },
            { type: 'rock', gridX: 58.00, gridY: 32.00, size: 3, variant: 0 },
            { type: 'rock', gridX: 4.00, gridY: 32.00, size: 3, variant: 1 },
            { type: 'rock', gridX: 15.00, gridY: 3.00, size: 3, variant: 1 },
            { type: 'rock', gridX: 54.00, gridY: 4.00, size: 3, variant: 2 },
            { type: 'rock', gridX: 33.00, gridY: 3.00, size: 3, variant: 2 },
            { type: 'rock', gridX: 52.00, gridY: 27.00, size: 3, variant: 2 },
            { type: 'rock', gridX: 27.00, gridY: 13.00, size: 3, variant: 3 },
            { type: 'rock', gridX: 10.00, gridY: 5.00, size: 2, variant: 3 },
            { type: 'rock', gridX: 3.00, gridY: 21.00, size: 2, variant: 3 },
            { type: 'rock', gridX: 57.00, gridY: 21.00, size: 2, variant: 3 },
            { type: 'rock', gridX: 48.00, gridY: 10.00, size: 2, variant: 3 },
            { type: 'rock', gridX: 17.00, gridY: 1.00, size: 2, variant: 0 },
            { type: 'rock', gridX: 51.00, gridY: 4.00, size: 2, variant: 0 },
            { type: 'rock', gridX: 54.00, gridY: 5.00, size: 2, variant: 0 },
            { type: 'rock', gridX: 58.00, gridY: 21.00, size: 2, variant: 0 },
            { type: 'rock', gridX: 51.00, gridY: 30.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 26.00, gridY: 4.00, size: 2.156393324699558, variant: 3 },
            { type: 'vegetation', gridX: 27.00, gridY: 0.00, size: 2.0369675178766737, variant: 1 },
            { type: 'vegetation', gridX: 29.00, gridY: 6.00, size: 3.892859580043036, variant: 3 },
            { type: 'vegetation', gridX: 28.00, gridY: 6.00, size: 2.5822054270017056, variant: 3 },
            { type: 'vegetation', gridX: 27.00, gridY: 2.00, size: 1.9406416705664689, variant: 3 },
            { type: 'vegetation', gridX: 25.00, gridY: 5.00, size: 1.796652956260923, variant: 3 },
            { type: 'vegetation', gridX: 25.00, gridY: 7.00, size: 2.967078742838276, variant: 3 },
            { type: 'vegetation', gridX: 25.00, gridY: 1.00, size: 3.4801219886056343, variant: 3 },
            { type: 'vegetation', gridX: 35.00, gridY: 6.00, size: 1.588316904563964, variant: 3 },
            { type: 'vegetation', gridX: 34.00, gridY: 11.00, size: 2.2228117097412907, variant: 1 },
            { type: 'vegetation', gridX: 32.00, gridY: 10.00, size: 1.6010846391891709, variant: 1 },
            { type: 'vegetation', gridX: 34.00, gridY: 5.00, size: 2.2988905313852683, variant: 3 },
            { type: 'vegetation', gridX: 37.00, gridY: 11.00, size: 2.5105245923116977, variant: 3 },
            { type: 'vegetation', gridX: 32.00, gridY: 4.00, size: 2.12384084060462, variant: 3 },
            { type: 'vegetation', gridX: 37.00, gridY: 10.00, size: 3.976460724906537, variant: 3 },
            { type: 'vegetation', gridX: 31.00, gridY: 6.00, size: 2.669242427610758, variant: 1 },
            { type: 'vegetation', gridX: 34.00, gridY: 12.00, size: 3.4112324785592945, variant: 1 },
            { type: 'vegetation', gridX: 42.00, gridY: 13.00, size: 3.4212628571272568, variant: 3 },
            { type: 'vegetation', gridX: 43.00, gridY: 12.00, size: 1.8627946339889119, variant: 3 },
            { type: 'vegetation', gridX: 43.00, gridY: 7.00, size: 2.1242891842084664, variant: 3 },
            { type: 'vegetation', gridX: 40.00, gridY: 10.00, size: 2.609652522061423, variant: 1 },
            { type: 'vegetation', gridX: 39.00, gridY: 9.00, size: 2.2854334084851273, variant: 1 },
            { type: 'vegetation', gridX: 41.00, gridY: 11.00, size: 3.633631628328785, variant: 3 },
            { type: 'vegetation', gridX: 43.00, gridY: 14.00, size: 2.9007318526122736, variant: 3 },
            { type: 'vegetation', gridX: 46.00, gridY: 11.00, size: 2.642710182766303, variant: 3 },
            { type: 'vegetation', gridX: 49.00, gridY: 17.00, size: 2.7136118053604137, variant: 1 },
            { type: 'vegetation', gridX: 50.00, gridY: 17.00, size: 2.4606650287653995, variant: 1 },
            { type: 'vegetation', gridX: 52.00, gridY: 10.00, size: 2.235231931522306, variant: 1 },
            { type: 'vegetation', gridX: 53.00, gridY: 11.00, size: 2.5241947480213156, variant: 3 },
            { type: 'vegetation', gridX: 51.00, gridY: 9.00, size: 2.3448683393956937, variant: 1 },
            { type: 'vegetation', gridX: 45.00, gridY: 14.00, size: 3.97986016045816, variant: 1 },
            { type: 'vegetation', gridX: 49.00, gridY: 15.00, size: 3.445897822535545, variant: 1 },
            { type: 'vegetation', gridX: 48.00, gridY: 12.00, size: 2.967821365843864, variant: 3 },
            { type: 'vegetation', gridX: 52.00, gridY: 18.00, size: 3.463587065779418, variant: 1 },
            { type: 'vegetation', gridX: 54.00, gridY: 23.00, size: 3.339049868076282, variant: 1 },
            { type: 'vegetation', gridX: 52.00, gridY: 22.00, size: 1.738743171939685, variant: 3 },
            { type: 'vegetation', gridX: 56.00, gridY: 15.00, size: 3.7506415078691084, variant: 1 },
            { type: 'vegetation', gridX: 52.00, gridY: 22.00, size: 1.7473413877570163, variant: 1 },
            { type: 'vegetation', gridX: 55.00, gridY: 22.00, size: 3.866699285240677, variant: 1 },
            { type: 'vegetation', gridX: 56.00, gridY: 22.00, size: 1.886157187083901, variant: 3 },
            { type: 'vegetation', gridX: 57.00, gridY: 15.00, size: 1.8895386339552243, variant: 1 },
            { type: 'vegetation', gridX: 54.00, gridY: 20.00, size: 2.4291887467376307, variant: 3 },
            { type: 'vegetation', gridX: 53.00, gridY: 27.00, size: 2.2281382102860574, variant: 3 },
            { type: 'vegetation', gridX: 57.00, gridY: 26.00, size: 1.773718100239875, variant: 3 },
            { type: 'vegetation', gridX: 57.00, gridY: 27.00, size: 2.3289807070737254, variant: 1 },
            { type: 'vegetation', gridX: 57.00, gridY: 31.00, size: 3.100313250501406, variant: 1 },
            { type: 'vegetation', gridX: 22.00, gridY: 4.00, size: 3.212026989428172, variant: 3 },
            { type: 'vegetation', gridX: 19.00, gridY: 7.00, size: 3.583636374023758, variant: 3 },
            { type: 'vegetation', gridX: 18.00, gridY: 5.00, size: 1.6560874522037092, variant: 3 },
            { type: 'vegetation', gridX: 15.00, gridY: 3.00, size: 3.404663603910258, variant: 3 },
            { type: 'vegetation', gridX: 20.00, gridY: 0.00, size: 1.6146784175366582, variant: 3 },
            { type: 'vegetation', gridX: 17.00, gridY: 5.00, size: 2.7321459035091977, variant: 3 },
            { type: 'vegetation', gridX: 20.00, gridY: 6.00, size: 3.616765170068206, variant: 3 },
            { type: 'vegetation', gridX: 46.00, gridY: 3.00, size: 2.853891665200238, variant: 1 },
            { type: 'vegetation', gridX: 51.00, gridY: 4.00, size: 3.810974059864442, variant: 3 },
            { type: 'vegetation', gridX: 51.00, gridY: 4.00, size: 1.516420317654061, variant: 1 },
            { type: 'vegetation', gridX: 50.00, gridY: 5.00, size: 2.3225413384086178, variant: 1 },
            { type: 'vegetation', gridX: 49.00, gridY: 3.00, size: 1.8444149579638223, variant: 1 },
            { type: 'vegetation', gridX: 57.00, gridY: 6.00, size: 1.8456607318304932, variant: 3 },
            { type: 'vegetation', gridX: 56.00, gridY: 6.00, size: 2.0725605784635768, variant: 1 },
            { type: 'vegetation', gridX: 56.00, gridY: 5.00, size: 3.928240119490819, variant: 3 },
            { type: 'vegetation', gridX: 57.00, gridY: 4.00, size: 3.2573999379077367, variant: 3 },
            { type: 'vegetation', gridX: 25.00, gridY: 30.00, size: 2.7520915982635312, variant: 1 },
            { type: 'vegetation', gridX: 27.00, gridY: 30.00, size: 2.5274868005530333, variant: 1 },
            { type: 'vegetation', gridX: 27.00, gridY: 32.00, size: 3.242781338678599, variant: 3 }
        ];
    }

    createMeanderingPath(canvasWidth, canvasHeight) {
        const gridWidth = this.gridWidth || 60;
        const gridHeight = this.gridHeight || 33.75;

        const pathInGridCoords = [
            { gridX: 30.00, gridY: 34.00 },
            { gridX: 30.00, gridY: 27.00 },
            { gridX: 7.00, gridY: 27.00 },
            { gridX: 7.00, gridY: 11.00 },
            { gridX: 21.00, gridY: 11.00 },
            { gridX: 21.00, gridY: 21.00 },
            { gridX: 46.00, gridY: 21.00 }
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
            enemyHealth_multiplier: 2, 
            speedMultiplier: 1, 
            spawnInterval: 1.2, 
            pattern: [{ type: 'villager', count: 5 }, { type: 'basic', count: 6 }, { type: 'frog', count: 12 }, { type: 'villager', count: 5, healthMultiplier: 5, speedMultiplier: 0.8 }] 
        }
        // Wave 2
        , { 
            enemyHealth_multiplier: 1.5, 
            speedMultiplier: 1, 
            spawnInterval: 1.5, 
            pattern: [{ type: 'villager', count: 12, healthMultiplier: 2, speedMultiplier: 0.5 }, { type: 'basic', count: 8 }, { type: 'shieldknight', count: 1, healthMultiplier: 1 }] 
        }
        // Wave 3
        , { 
            enemyHealth_multiplier: 2, 
            speedMultiplier: 1, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'frog', count: 17 }] 
        }
        // Wave 4
        , { 
            enemyHealth_multiplier: 1, 
            speedMultiplier: 1, 
            spawnInterval: 7, 
            pattern: [{ type: 'knight', count: 3 }] 
        }
        // Wave 5
        , { 
            enemyHealth_multiplier: 2, 
            speedMultiplier: 1.3, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'mage', count: 3 }] 
        }
        // Wave 6
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 1.1, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'mage', count: 1, healthMultiplier: 2 }, { type: 'frog', count: 7 }, { type: 'archer', count: 4 }, { type: 'frog', count: 6, healthMultiplier: 5 }, { type: 'archer', count: 6, speedMultiplier: 1.4 }] 
        }
        // Wave 7
        , { 
            enemyHealth_multiplier: 1, 
            speedMultiplier: 1, 
            spawnInterval: 1.2, 
            pattern: [{ type: 'shieldknight', count: 3 }, { type: 'beefyenemy', count: 6, healthMultiplier: 4 }, { type: 'shieldknight', count: 1, healthMultiplier: 3 }, { type: 'beefyenemy', count: 9, healthMultiplier: 7 }, { type: 'shieldknight', count: 2, healthMultiplier: 3 }] 
        }
        // Wave 8
        , { 
            enemyHealth_multiplier: 3, 
            speedMultiplier: 1.2, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'villager', count: 15 }, { type: 'basic', count: 21 }, { type: 'frog', count: 6 }] 
        }
        // Wave 9
        , { 
            enemyHealth_multiplier: 2.5, 
            speedMultiplier: 1.2, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'archer', count: 14, speedMultiplier: 1.2 }, { type: 'villager', count: 11 }, { type: 'basic', count: 13 }] 
        }
        // Wave 10
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 1, 
            spawnInterval: 2, 
            pattern: [{ type: 'shieldknight', count: 3, healthMultiplier: 1 }, { type: 'beefyenemy', count: 5 }, { type: 'knight', count: 1, healthMultiplier: 1 }, { type: 'shieldknight', count: 3 }, { type: 'beefyenemy', count: 6, healthMultiplier: 6 }, { type: 'knight', count: 1, healthMultiplier: 2, speedMultiplier: 0.8 }] 
        }
        // Wave 11
        , { 
            enemyHealth_multiplier: 2, 
            speedMultiplier: 1.1, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'archer', count: 23 }, { type: 'frog', count: 16, speedMultiplier: 1.3 }, { type: 'mage', count: 1 }] 
        }
        // Wave 12
        , { 
            enemyHealth_multiplier: 3, 
            speedMultiplier: 1, 
            spawnInterval: 0.5, 
            pattern: [{ type: 'mage', count: 1 }, { type: 'frog', count: 17, healthMultiplier: 5, speedMultiplier: 1.3 }] 
        }
        // Wave 13
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 1, 
            spawnInterval: 15, 
            pattern: [{ type: 'knight', count: 3 }] 
        }
        // Wave 14
        , { 
            enemyHealth_multiplier: 6, 
            speedMultiplier: 0.8, 
            spawnInterval: 0.3, 
            pattern: [{ type: 'shieldknight', count: 4 }] 
        }
        // Wave 15
        , { 
            enemyHealth_multiplier: 3, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'beefyenemy', count: 7, healthMultiplier: 5 }, { type: 'frog', count: 12 }, { type: 'mage', count: 1, healthMultiplier: 2 }, { type: 'basic', count: 11 }, { type: 'villager', count: 9 }, { type: 'shieldknight', count: 4 }, { type: 'archer', count: 9, healthMultiplier: 2, speedMultiplier: 2 }] 
        }
        // Wave 16
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 1, 
            spawnInterval: 0.5, 
            pattern: [{ type: 'knight', count: 1, healthMultiplier: 2 }, { type: 'shieldknight', count: 2 }] 
        }
        // Wave 17
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 1, 
            spawnInterval: 5, 
            pattern: [{ type: 'mage', count: 5, speedMultiplier: 0.6 }, { type: 'frog', count: 8, healthMultiplier: 5, speedMultiplier: 1.6 }] 
        }
        // Wave 18
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 1.2, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'archer', count: 15 }, { type: 'villager', count: 18 }, { type: 'basic', count: 16 }] 
        }
        // Wave 19
        , { 
            enemyHealth_multiplier: 5, 
            speedMultiplier: 1.4, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'archer', count: 24 }] 
        }
        // Wave 20
        , { 
            enemyHealth_multiplier: 8, 
            speedMultiplier: 1, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'beefyenemy', count: 18, speedMultiplier: 1.4 }] 
        }
        // Wave 21
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 1, 
            spawnInterval: 1, 
            pattern: [{ type: 'shieldknight', count: 4, healthMultiplier: 3 }, { type: 'mage', count: 1 }, { type: 'villager', count: 12 }, { type: 'shieldknight', count: 3, healthMultiplier: 4 }, { type: 'beefyenemy', count: 8 }, { type: 'mage', count: 1 }, { type: 'frog', count: 12 }, { type: 'archer', count: 9, healthMultiplier: 5, speedMultiplier: 1.5 }, { type: 'shieldknight', count: 2, healthMultiplier: 5, speedMultiplier: 0.8 }] 
        }
        // Wave 22
        , { 
            enemyHealth_multiplier: 13, 
            speedMultiplier: 1, 
            spawnInterval: 1, 
            pattern: [{ type: 'knight', count: 1 }] 
        }
        // Wave 23
        , { 
            enemyHealth_multiplier: 1, 
            speedMultiplier: 1, 
            spawnInterval: 0.5, 
            pattern: [{ type: 'mage', count: 1, healthMultiplier: 5 }, { type: 'frog', count: 18, healthMultiplier: 3, speedMultiplier: 1.8 }] 
        }
        // Wave 24
        , { 
            enemyHealth_multiplier: 2.5, 
            speedMultiplier: 1, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'shieldknight', count: 3, speedMultiplier: 1.2 }, { type: 'beefyenemy', count: 9, healthMultiplier: 6 }, { type: 'frog', count: 16 }, { type: 'villager', count: 11 }, { type: 'archer', count: 13 }, { type: 'knight', count: 1, healthMultiplier: 7, speedMultiplier: 0.5 }] 
        }
        // Wave 25
        , { 
            enemyHealth_multiplier: 7, 
            speedMultiplier: 1, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'knight', count: 1 }, { type: 'mage', count: 2 }] 
        }
        // Wave 26
        , { 
            enemyHealth_multiplier: 7.5, 
            speedMultiplier: 1, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'waterfrog', count: 1 }] 
        }
        // Wave 27
        , { 
            enemyHealth_multiplier: 10, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'firefrog', count: 12 }] 
        }
        // Wave 28
        , { 
            enemyHealth_multiplier: 15, 
            speedMultiplier: 1, 
            spawnInterval: 2, 
            pattern: [{ type: 'earthfrog', count: 1 }, { type: 'airfrog', count: 1 }] 
        }
        ];

        if (wave > 0 && wave <= waveConfigs.length) {
            return waveConfigs[wave - 1];
        }
        
        return null;
    }
}