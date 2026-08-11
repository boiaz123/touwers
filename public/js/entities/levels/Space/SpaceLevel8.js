import { LevelBase } from '../LevelBase.js';

export class SpaceLevel8 extends LevelBase {
    static levelMetadata = {
        name: 'Kroa\'Ur\'Grol',
        difficulty: 'Nightmare',
        order: 8,
        campaign: 'space'
    };

    constructor() {
        super();
        // Derive instance properties from static metadata
        this.levelName = SpaceLevel8.levelMetadata.name;
        this.levelNumber = SpaceLevel8.levelMetadata.order;
        this.difficulty = SpaceLevel8.levelMetadata.difficulty;
        this.campaign = SpaceLevel8.levelMetadata.campaign;
        this.maxWaves = 60;

        // Set terrain elements (prevent tower placement on these areas)
        this.terrainElements = [
            { type: 'water', gridX: 47.00, gridY: 25.00, size: 4, waterType: 'lake' },
            { type: 'water', gridX: 56.00, gridY: 26.00, size: 2, waterType: 'lake' },
            { type: 'water', gridX: 49.00, gridY: 32.00, size: 2, waterType: 'lake' },
            { type: 'water', gridX: 56.00, gridY: 32.00, size: 2.5, waterType: 'lake' },
            { type: 'vegetation', gridX: 0.00, gridY: 2.00, size: 1.2218151664817045, variant: 2 },
            { type: 'vegetation', gridX: 1.00, gridY: 2.00, size: 1.5262295465055036, variant: 1 },
            { type: 'vegetation', gridX: 3.00, gridY: 3.00, size: 1.4933059612516189, variant: 0 },
            { type: 'vegetation', gridX: 1.00, gridY: 5.00, size: 2.6235345756717097, variant: 1 },
            { type: 'vegetation', gridX: 5.00, gridY: 3.00, size: 2.936767791746528, variant: 0 },
            { type: 'vegetation', gridX: 6.00, gridY: 5.00, size: 1.2307727839469549, variant: 3 },
            { type: 'vegetation', gridX: 2.00, gridY: 7.00, size: 2.6443502832744175, variant: 2 },
            { type: 'vegetation', gridX: 0.00, gridY: 31.00, size: 2.804903672552497, variant: 1 },
            { type: 'vegetation', gridX: 6.00, gridY: 31.00, size: 1.932038727676476, variant: 1 },
            { type: 'vegetation', gridX: 3.00, gridY: 32.00, size: 2.639084199286729, variant: 2 },
            { type: 'vegetation', gridX: 1.00, gridY: 28.00, size: 2.633483767494271, variant: 0 },
            { type: 'vegetation', gridX: 13.00, gridY: 29.00, size: 1.5257324565231132, variant: 3 },
            { type: 'vegetation', gridX: 12.00, gridY: 32.75, size: 2.514868807412123, variant: 2 },
            { type: 'vegetation', gridX: 10.00, gridY: 29.00, size: 2.7776555867801003, variant: 0 },
            { type: 'vegetation', gridX: 13.00, gridY: 32.75, size: 1.1578142066207364, variant: 3 },
            { type: 'vegetation', gridX: 11.00, gridY: 29.00, size: 1.7849160106299127, variant: 2 },
            { type: 'vegetation', gridX: 13.00, gridY: 28.00, size: 2.7580793266022807, variant: 1 },
            { type: 'vegetation', gridX: 21.00, gridY: 32.00, size: 1.694359334326858, variant: 0 },
            { type: 'vegetation', gridX: 21.00, gridY: 29.00, size: 1.3410311335037717, variant: 1 },
            { type: 'vegetation', gridX: 20.00, gridY: 30.00, size: 2.76411706238106, variant: 2 },
            { type: 'vegetation', gridX: 57.00, gridY: 9.00, size: 1.9487947592408934, variant: 1 },
            { type: 'vegetation', gridX: 56.00, gridY: 6.00, size: 2.447759698560728, variant: 3 },
            { type: 'vegetation', gridX: 57.00, gridY: 4.00, size: 1.3870203439939572, variant: 1 },
            { type: 'vegetation', gridX: 53.00, gridY: 0.00, size: 1.7006232924130007, variant: 1 },
            { type: 'vegetation', gridX: 51.00, gridY: 0.00, size: 2.1892948385080615, variant: 2 },
            { type: 'vegetation', gridX: 51.00, gridY: 4.00, size: 2.645310724174054, variant: 3 },
            { type: 'vegetation', gridX: 52.00, gridY: 1.00, size: 1.507095382065977, variant: 2 },
            { type: 'vegetation', gridX: 50.00, gridY: 6.00, size: 1.1570169608304481, variant: 0 },
            { type: 'vegetation', gridX: 31.00, gridY: 5.00, size: 1.4427401471428938, variant: 2 },
            { type: 'vegetation', gridX: 32.00, gridY: 7.00, size: 1.4892028318810113, variant: 1 },
            { type: 'vegetation', gridX: 28.00, gridY: 4.00, size: 2.807481731134356, variant: 2 },
            { type: 'vegetation', gridX: 28.00, gridY: 6.00, size: 2.798313058599271, variant: 2 },
            { type: 'vegetation', gridX: 33.00, gridY: 8.00, size: 1.6086997619568142, variant: 3 },
            { type: 'vegetation', gridX: 37.00, gridY: 19.00, size: 1.359991235602571, variant: 1 },
            { type: 'vegetation', gridX: 37.00, gridY: 20.00, size: 2.307130872999617, variant: 3 },
            { type: 'vegetation', gridX: 40.00, gridY: 21.00, size: 2.832731063278814, variant: 0 },
            { type: 'vegetation', gridX: 42.00, gridY: 20.00, size: 1.02891092087195, variant: 0 },
            { type: 'vegetation', gridX: 40.00, gridY: 19.00, size: 1.1774364247753386, variant: 2 },
            { type: 'vegetation', gridX: 42.00, gridY: 22.00, size: 1.5144296700553783, variant: 1 },
            { type: 'vegetation', gridX: 38.00, gridY: 18.00, size: 2.5523236634478597, variant: 2 },
            { type: 'vegetation', gridX: 18.00, gridY: 30.00, size: 2.4915813216029767, variant: 3 },
            { type: 'vegetation', gridX: 16.00, gridY: 29.00, size: 1.6150962742204997, variant: 1 },
            { type: 'vegetation', gridX: 16.00, gridY: 32.75, size: 2.735018179404425, variant: 0 },
            { type: 'vegetation', gridX: 10.00, gridY: 28.00, size: 1.156352628091683, variant: 2 },
            { type: 'vegetation', gridX: 11.00, gridY: 26.00, size: 2.1075018819546045, variant: 0 },
            { type: 'vegetation', gridX: 7.00, gridY: 26.00, size: 2.0813602546240997, variant: 0 },
            { type: 'vegetation', gridX: 10.00, gridY: 29.00, size: 2.8747422364643556, variant: 2 },
            { type: 'vegetation', gridX: 3.00, gridY: 20.00, size: 2.0900556407810367, variant: 0 },
            { type: 'vegetation', gridX: 1.00, gridY: 23.00, size: 1.2040685793209487, variant: 2 },
            { type: 'vegetation', gridX: 5.00, gridY: 22.00, size: 1.5386869189884713, variant: 1 },
            { type: 'vegetation', gridX: 4.00, gridY: 21.00, size: 1.0646207470132987, variant: 1 },
            { type: 'vegetation', gridX: 2.00, gridY: 21.00, size: 1.4200646648600759, variant: 0 },
            { type: 'vegetation', gridX: 6.00, gridY: 19.00, size: 2.4894372881894777, variant: 0 },
            { type: 'vegetation', gridX: 27.00, gridY: 32.00, size: 1.126133250501209, variant: 2 },
            { type: 'vegetation', gridX: 25.00, gridY: 30.00, size: 2.2193511266496646, variant: 2 },
            { type: 'vegetation', gridX: 24.00, gridY: 32.75, size: 2.759968803795924, variant: 1 },
            { type: 'vegetation', gridX: 46.00, gridY: 33.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 55.00, gridY: 29.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 56.00, gridY: 22.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 25.00, gridY: 3.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 34.00, gridY: 5.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 55.00, gridY: 2.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 29.00, gridY: 8.00, size: 2.5, variant: 2 },
            { type: 'vegetation', gridX: 8.00, gridY: 2.00, size: 2.5, variant: 2 },
            { type: 'vegetation', gridX: 4.00, gridY: 25.00, size: 2.5, variant: 2 },
            { type: 'vegetation', gridX: 48.00, gridY: 2.00, size: 2.5, variant: 2 },
            { type: 'vegetation', gridX: 38.00, gridY: 23.00, size: 2.5, variant: 2 }
        ];
    }

    createMeanderingPath(canvasWidth, canvasHeight) {
        const gridWidth = this.gridWidth || 60;
        const gridHeight = this.gridHeight || 33.75;

        const pathInGridCoords = [
            { gridX: 0.00, gridY: 13.00 },
            { gridX: 9.00, gridY: 7.00 },
            { gridX: 17.00, gridY: 7.00 },
            { gridX: 25.00, gridY: 13.00 },
            { gridX: 36.00, gridY: 13.00 },
            { gridX: 42.00, gridY: 7.00 },
            { gridX: 52.00, gridY: 7.00 },
            { gridX: 52.00, gridY: 29.00 },
            { gridX: 30.00, gridY: 29.00 },
            { gridX: 30.00, gridY: 19.00 },
            { gridX: 12.00, gridY: 19.00 }
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
            spawnInterval: 0.96, 
            pattern: [{ type: 'basic', count: 10, healthMultiplier: 1.8, speedMultiplier: 0.6 }, { type: 'villager', count: 12, healthMultiplier: 1.8 }, { type: 'archer', count: 5, speedMultiplier: 1.5 }] 
        }
        // Wave 2
        , { 
            enemyHealth_multiplier: 1.55, 
            speedMultiplier: 1, 
            spawnInterval: 1.14, 
            pattern: [{ type: 'basic', count: 10 }, { type: 'basic', count: 12, healthMultiplier: 1.5 }, { type: 'villager', count: 8, healthMultiplier: 1.3 }] 
        }
        // Wave 3
        , { 
            enemyHealth_multiplier: 2.09, 
            speedMultiplier: 1, 
            spawnInterval: 0.86, 
            pattern: [{ type: 'frog', count: 9 }, { type: 'frog', count: 10, healthMultiplier: 2, speedMultiplier: 1.2 }, { type: 'frog', count: 11, healthMultiplier: 3 }] 
        }
        // Wave 4
        , { 
            enemyHealth_multiplier: 2.64, 
            speedMultiplier: 1, 
            spawnInterval: 0.78, 
            pattern: [{ type: 'archer', count: 9, healthMultiplier: 2.5, speedMultiplier: 1.1 }, { type: 'frog', count: 12, healthMultiplier: 1.8 }, { type: 'mage', count: 4, healthMultiplier: 2 }, { type: 'archer', count: 5, healthMultiplier: 3, speedMultiplier: 1.5 }] 
        }
        // Wave 5
        , { 
            enemyHealth_multiplier: 3.19, 
            speedMultiplier: 1, 
            spawnInterval: 0.68, 
            pattern: [{ type: 'beefyenemy', count: 9 }] 
        }
        // Wave 6
        , { 
            enemyHealth_multiplier: 3.73, 
            speedMultiplier: 1.2, 
            spawnInterval: 0.58, 
            pattern: [{ type: 'basic', count: 13 }, { type: 'villager', count: 11 }, { type: 'frog', count: 10, healthMultiplier: 2, speedMultiplier: 1.3 }] 
        }
        // Wave 7
        , { 
            enemyHealth_multiplier: 4.28, 
            speedMultiplier: 1, 
            spawnInterval: 0.88, 
            pattern: [{ type: 'shieldknight', count: 3, healthMultiplier: 2 }, { type: 'frog', count: 13 }] 
        }
        // Wave 8
        , { 
            enemyHealth_multiplier: 4.83, 
            speedMultiplier: 1, 
            spawnInterval: 1.95, 
            pattern: [{ type: 'beefyenemy', count: 6 }, { type: 'knight', count: 4 }] 
        }
        // Wave 9
        , { 
            enemyHealth_multiplier: 5.37, 
            speedMultiplier: 1.2, 
            spawnInterval: 0.78, 
            pattern: [{ type: 'villager', count: 12 }, { type: 'basic', count: 10 }, { type: 'archer', count: 12, speedMultiplier: 1.2 }] 
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
            enemyHealth_multiplier: 6.13, 
            speedMultiplier: 0.9, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'knight', count: 6, healthMultiplier: 2.5 }, { type: 'mage', count: 9, healthMultiplier: 2 }, { type: 'frog', count: 14, speedMultiplier: 1.3 }, { type: 'archer', count: 13, speedMultiplier: 1.4 }, { type: 'beefyenemy', count: 10 }, { type: 'basic', count: 10 }] 
        }
        // Wave 12
        , { 
            enemyHealth_multiplier: 6.33, 
            speedMultiplier: 1, 
            spawnInterval: 0.82, 
            pattern: [{ type: 'frog', count: 11 }, { type: 'frog', count: 12, healthMultiplier: 2, speedMultiplier: 1.2 }, { type: 'frog', count: 13, healthMultiplier: 3 }] 
        }
        // Wave 13
        , { 
            enemyHealth_multiplier: 6.54, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'beefyenemy', count: 11, healthMultiplier: 3 }, { type: 'frog', count: 16 }, { type: 'shieldknight', count: 5, healthMultiplier: 2 }, { type: 'villager', count: 13 }, { type: 'basic', count: 12 }, { type: 'mage', count: 8 }, { type: 'archer', count: 11, healthMultiplier: 3, speedMultiplier: 2 }] 
        }
        // Wave 14
        , { 
            enemyHealth_multiplier: 6.75, 
            speedMultiplier: 1, 
            spawnInterval: 0.66, 
            pattern: [{ type: 'beefyenemy', count: 11 }, { type: 'frog', count: 3 }] 
        }
        // Wave 15
        , { 
            enemyHealth_multiplier: 6.96, 
            speedMultiplier: 1, 
            spawnInterval: 0.76, 
            pattern: [{ type: 'archer', count: 11, healthMultiplier: 2.5, speedMultiplier: 1.1 }, { type: 'frog', count: 15, healthMultiplier: 1.8 }, { type: 'mage', count: 6, healthMultiplier: 2 }, { type: 'archer', count: 7, healthMultiplier: 3, speedMultiplier: 1.5 }] 
        }
        // Wave 16
        , { 
            enemyHealth_multiplier: 7.16, 
            speedMultiplier: 0.8, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'mage', count: 11 }, { type: 'frog', count: 3 }] 
        }
        // Wave 17
        , { 
            enemyHealth_multiplier: 7.37, 
            speedMultiplier: 1, 
            spawnInterval: 11.9, 
            pattern: [{ type: 'knight', count: 7 }, { type: 'frog', count: 4 }] 
        }
        // Wave 18
        , { 
            enemyHealth_multiplier: 7.58, 
            speedMultiplier: 1, 
            spawnInterval: 1, 
            pattern: [{ type: 'knight', count: 5, healthMultiplier: 3 }, { type: 'mage', count: 6, healthMultiplier: 2 }, { type: 'shieldknight', count: 5, healthMultiplier: 2 }, { type: 'mage', count: 5, healthMultiplier: 4 }, { type: 'frog', count: 4 }] 
        }
        // Wave 19
        , { 
            enemyHealth_multiplier: 7.78, 
            speedMultiplier: 1, 
            spawnInterval: 4.4, 
            pattern: [{ type: 'waterfrog', count: 5 }, { type: 'earthfrog', count: 5 }, { type: 'waterfrog', count: 5 }, { type: 'earthfrog', count: 5 }] 
        }
        // Wave 20
        , { 
            enemyHealth_multiplier: 7.99, 
            speedMultiplier: 1, 
            spawnInterval: 1, 
            pattern: [{ type: 'shieldknight', count: 8, speedMultiplier: 0.6 }, { type: 'frog', count: 14, speedMultiplier: 1.2 }] 
        }
        // Wave 21
        , { 
            enemyHealth_multiplier: 8.2, 
            speedMultiplier: 1.1, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'mage', count: 8, healthMultiplier: 3 }, { type: 'shieldknight', count: 6 }, { type: 'basic', count: 17 }, { type: 'mage', count: 7, healthMultiplier: 4 }, { type: 'beefyenemy', count: 15, healthMultiplier: 2 }, { type: 'shieldknight', count: 6 }, { type: 'frog', count: 25 }, { type: 'archer', count: 16, healthMultiplier: 5, speedMultiplier: 1.5 }, { type: 'mage', count: 6, healthMultiplier: 6 }] 
        }
        // Wave 22
        , { 
            enemyHealth_multiplier: 8.4, 
            speedMultiplier: 1.3, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'archer', count: 19 }, { type: 'basic', count: 22 }, { type: 'villager', count: 20 }, { type: 'frog', count: 4 }] 
        }
        // Wave 23
        , { 
            enemyHealth_multiplier: 8.61, 
            speedMultiplier: 1, 
            spawnInterval: 0.78, 
            pattern: [{ type: 'frog', count: 16 }, { type: 'frog', count: 18, healthMultiplier: 2, speedMultiplier: 1.2 }, { type: 'frog', count: 19, healthMultiplier: 3 }] 
        }
        // Wave 24
        , { 
            enemyHealth_multiplier: 8.82, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'shieldknight', count: 1 }, { type: 'waterfrog', count: 1 }] 
        }
        // Wave 25
        , { 
            enemyHealth_multiplier: 9.03, 
            speedMultiplier: 1.7, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'archer', count: 17 }, { type: 'frog', count: 4 }] 
        }
        // Wave 26
        , { 
            enemyHealth_multiplier: 9.23, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'waterfrog', count: 1 }, { type: 'earthfrog', count: 1 }, { type: 'firefrog', count: 1 }] 
        }
        // Wave 27
        , { 
            enemyHealth_multiplier: 9.44, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'beefyenemy', count: 12, healthMultiplier: 3 }, { type: 'frog', count: 25 }, { type: 'shieldknight', count: 6, healthMultiplier: 2 }, { type: 'villager', count: 14 }, { type: 'basic', count: 13 }, { type: 'mage', count: 9 }, { type: 'archer', count: 12, healthMultiplier: 3, speedMultiplier: 2 }] 
        }
        // Wave 28
        , { 
            enemyHealth_multiplier: 9.65, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'firefrog', count: 1 }] 
        }
        // Wave 29
        , { 
            enemyHealth_multiplier: 9.85, 
            speedMultiplier: 0.9, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'knight', count: 7, healthMultiplier: 2.5 }, { type: 'mage', count: 10, healthMultiplier: 2 }, { type: 'frog', count: 23, speedMultiplier: 1.3 }, { type: 'archer', count: 14, speedMultiplier: 1.4 }, { type: 'beefyenemy', count: 11 }, { type: 'basic', count: 11 }] 
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
            enemyHealth_multiplier: 10.27, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'shieldknight', count: 1 }, { type: 'airfrog', count: 1 }] 
        }
        // Wave 32
        , { 
            enemyHealth_multiplier: 10.48, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'beefyenemy', count: 13, healthMultiplier: 3 }, { type: 'frog', count: 30 }, { type: 'shieldknight', count: 7, healthMultiplier: 2 }, { type: 'villager', count: 15 }, { type: 'basic', count: 14 }, { type: 'mage', count: 10 }, { type: 'archer', count: 13, healthMultiplier: 3, speedMultiplier: 2 }] 
        }
        // Wave 33
        , { 
            enemyHealth_multiplier: 10.68, 
            speedMultiplier: 1.4, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'archer', count: 20 }, { type: 'basic', count: 23 }, { type: 'villager', count: 21 }, { type: 'frog', count: 5 }] 
        }
        // Wave 34
        , { 
            enemyHealth_multiplier: 10.89, 
            speedMultiplier: 1, 
            spawnInterval: 0.72, 
            pattern: [{ type: 'archer', count: 13, healthMultiplier: 2.5, speedMultiplier: 1.1 }, { type: 'frog', count: 29, healthMultiplier: 1.8 }, { type: 'mage', count: 8, healthMultiplier: 2 }, { type: 'archer', count: 9, healthMultiplier: 3, speedMultiplier: 1.5 }] 
        }
        // Wave 35
        , { 
            enemyHealth_multiplier: 11.1, 
            speedMultiplier: 1.1, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'mage', count: 9, healthMultiplier: 3 }, { type: 'shieldknight', count: 7 }, { type: 'basic', count: 18 }, { type: 'mage', count: 8, healthMultiplier: 4 }, { type: 'beefyenemy', count: 16, healthMultiplier: 2 }, { type: 'shieldknight', count: 7 }, { type: 'frog', count: 37 }, { type: 'archer', count: 17, healthMultiplier: 5, speedMultiplier: 1.5 }, { type: 'mage', count: 7, healthMultiplier: 6 }] 
        }
        // Wave 36
        , { 
            enemyHealth_multiplier: 6, 
            speedMultiplier: 1.7, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'archer', count: 18 }, { type: 'ramcart', count: 5 }] 
        }
        // Wave 37
        , { 
            enemyHealth_multiplier: 11.52, 
            speedMultiplier: 0.9, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'knight', count: 8, healthMultiplier: 2.5 }, { type: 'mage', count: 11, healthMultiplier: 2 }, { type: 'frog', count: 31, speedMultiplier: 1.3 }, { type: 'archer', count: 15, speedMultiplier: 1.4 }, { type: 'beefyenemy', count: 12 }, { type: 'basic', count: 12 }] 
        }
        // Wave 38
        , { 
            enemyHealth_multiplier: 11.72, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'walkingfrog', count: 3 }] 
        }
        // Wave 39
        , { 
            enemyHealth_multiplier: 11.93, 
            speedMultiplier: 1, 
            spawnInterval: 3.8, 
            pattern: [{ type: 'airfrog', count: 7 }, { type: 'earthfrog', count: 7 }, { type: 'airfrog', count: 7 }, { type: 'earthfrog', count: 7 }] 
        }
        // Wave 40
        , { 
            enemyHealth_multiplier: 12.14, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'waterfrog', count: 1 }, { type: 'ramcart', count: 1 }, { type: 'earthfrog', count: 1 }] 
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
            enemyHealth_multiplier: 15, 
            speedMultiplier: 0.8, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'shieldknight', count: 14 }, { type: 'walkingfrog', count: 5 }] 
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
            pattern: [{ type: 'walkingfrog', count: 9, healthMultiplier: 5 }, { type: 'archer', count: 19, speedMultiplier: 1.3 }, { type: 'basic', count: 17 }, { type: 'beefyenemy', count: 15, healthMultiplier: 2.5 }, { type: 'mage', count: 9 }, { type: 'shieldknight', count: 10, healthMultiplier: 4 }] 
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
            pattern: [{ type: 'earthfrog', count: 6 }, { type: 'waterfrog', count: 6 }, { type: 'firefrog', count: 6 }, { type: 'airfrog', count: 6 }, { type: 'frogking', count: 1, healthMultiplier: 1 }] 
        }
        ];

        if (wave > 0 && wave <= waveConfigs.length) {
            return waveConfigs[wave - 1];
        }
        
        return null;
    }
}