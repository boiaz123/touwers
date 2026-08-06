import { LevelBase } from '../LevelBase.js';

export class SpaceLevel7 extends LevelBase {
    static levelMetadata = {
        name: 'Ooz\'Nal',
        difficulty: 'Nightmare',
        order: 7,
        campaign: 'space'
    };

    constructor() {
        super();
        // Derive instance properties from static metadata
        this.levelName = SpaceLevel7.levelMetadata.name;
        this.levelNumber = SpaceLevel7.levelMetadata.order;
        this.difficulty = SpaceLevel7.levelMetadata.difficulty;
        this.campaign = SpaceLevel7.levelMetadata.campaign;
        this.maxWaves = 57;

        // Set terrain elements (prevent tower placement on these areas)
        this.terrainElements = [
            { type: 'vegetation', gridX: 54.00, gridY: 12.00, size: 1.1388278163641687, variant: 0 },
            { type: 'vegetation', gridX: 55.00, gridY: 9.00, size: 1.7702458919593973, variant: 3 },
            { type: 'vegetation', gridX: 57.00, gridY: 8.00, size: 2.9898138031444565, variant: 1 },
            { type: 'vegetation', gridX: 47.00, gridY: 8.00, size: 1.244793821994297, variant: 2 },
            { type: 'vegetation', gridX: 50.00, gridY: 12.00, size: 1.2007646142540904, variant: 2 },
            { type: 'vegetation', gridX: 50.00, gridY: 7.00, size: 1.9868434198381821, variant: 2 },
            { type: 'vegetation', gridX: 47.00, gridY: 9.00, size: 2.05681195754672, variant: 2 },
            { type: 'vegetation', gridX: 49.00, gridY: 7.00, size: 2.1470152695258626, variant: 2 },
            { type: 'vegetation', gridX: 53.00, gridY: 2.00, size: 2.7392971819090457, variant: 3 },
            { type: 'vegetation', gridX: 49.00, gridY: 6.00, size: 1.5907800388094657, variant: 0 },
            { type: 'vegetation', gridX: 52.00, gridY: 5.00, size: 1.2533736265411948, variant: 0 },
            { type: 'vegetation', gridX: 56.00, gridY: 6.00, size: 2.221842678205449, variant: 2 },
            { type: 'vegetation', gridX: 4.00, gridY: 6.00, size: 1.618280954651147, variant: 0 },
            { type: 'vegetation', gridX: 2.00, gridY: 5.00, size: 2.4372144000781395, variant: 3 },
            { type: 'vegetation', gridX: 3.00, gridY: 12.00, size: 1.309152693891279, variant: 1 },
            { type: 'vegetation', gridX: 9.00, gridY: 4.00, size: 1.8540090940452276, variant: 0 },
            { type: 'vegetation', gridX: 11.00, gridY: 5.00, size: 1.8291628001170461, variant: 1 },
            { type: 'vegetation', gridX: 4.00, gridY: 3.00, size: 2.9715435896368465, variant: 1 },
            { type: 'vegetation', gridX: 3.00, gridY: 9.00, size: 1.9824081767094393, variant: 1 },
            { type: 'vegetation', gridX: 0.00, gridY: 6.00, size: 1.8053517273374389, variant: 2 },
            { type: 'vegetation', gridX: 5.00, gridY: 13.00, size: 2.1712736965496426, variant: 2 },
            { type: 'vegetation', gridX: 53.00, gridY: 32.75, size: 1.802842891915066, variant: 0 },
            { type: 'vegetation', gridX: 53.00, gridY: 28.00, size: 1.4222602758621015, variant: 3 },
            { type: 'vegetation', gridX: 53.00, gridY: 21.00, size: 1.6666646531582954, variant: 3 },
            { type: 'vegetation', gridX: 55.00, gridY: 23.00, size: 2.792342360086819, variant: 0 },
            { type: 'vegetation', gridX: 56.00, gridY: 23.00, size: 1.2010985284680802, variant: 1 },
            { type: 'vegetation', gridX: 51.00, gridY: 23.00, size: 2.4042485893508596, variant: 1 },
            { type: 'vegetation', gridX: 53.00, gridY: 32.75, size: 2.2777434602120215, variant: 3 },
            { type: 'vegetation', gridX: 52.00, gridY: 23.00, size: 2.750683045798449, variant: 2 },
            { type: 'vegetation', gridX: 57.00, gridY: 24.00, size: 2.749685193993777, variant: 3 },
            { type: 'vegetation', gridX: 52.00, gridY: 24.00, size: 1.194981354996275, variant: 1 },
            { type: 'vegetation', gridX: 56.00, gridY: 13.00, size: 1.290846105312895, variant: 3 },
            { type: 'vegetation', gridX: 53.00, gridY: 9.00, size: 1.3350799525796706, variant: 3 },
            { type: 'vegetation', gridX: 53.00, gridY: 15.00, size: 1.2976368708855877, variant: 1 },
            { type: 'vegetation', gridX: 50.00, gridY: 12.00, size: 1.866140433751156, variant: 2 },
            { type: 'vegetation', gridX: 51.00, gridY: 19.00, size: 2.211811080802609, variant: 3 },
            { type: 'vegetation', gridX: 58.00, gridY: 14.00, size: 2.2749021201484174, variant: 3 },
            { type: 'vegetation', gridX: 54.00, gridY: 20.00, size: 1.8430693323397418, variant: 2 },
            { type: 'vegetation', gridX: 55.00, gridY: 15.00, size: 1.9130299220746634, variant: 3 },
            { type: 'vegetation', gridX: 51.00, gridY: 15.00, size: 1.2174997107247036, variant: 1 },
            { type: 'vegetation', gridX: 55.00, gridY: 8.00, size: 2.530293111627907, variant: 0 },
            { type: 'vegetation', gridX: 53.00, gridY: 12.00, size: 2.2646443488606067, variant: 2 },
            { type: 'vegetation', gridX: 9.00, gridY: 29.00, size: 2.3370699996297253, variant: 2 },
            { type: 'vegetation', gridX: 8.00, gridY: 29.00, size: 2.5427327250714558, variant: 1 },
            { type: 'vegetation', gridX: 2.00, gridY: 25.00, size: 1.623496166927006, variant: 1 },
            { type: 'vegetation', gridX: 4.00, gridY: 24.00, size: 2.2847451070346696, variant: 0 },
            { type: 'vegetation', gridX: 10.00, gridY: 25.00, size: 2.9071828207581216, variant: 2 },
            { type: 'vegetation', gridX: 5.00, gridY: 32.75, size: 1.66448117129133, variant: 3 },
            { type: 'vegetation', gridX: 3.00, gridY: 28.00, size: 2.745356430308726, variant: 1 },
            { type: 'vegetation', gridX: 10.00, gridY: 27.00, size: 2.1223890451526652, variant: 1 },
            { type: 'vegetation', gridX: 7.00, gridY: 31.00, size: 2.163352700010903, variant: 0 },
            { type: 'water', gridX: 25.00, gridY: 18.00, size: 4, waterType: 'lake' },
            { type: 'rock', gridX: 23.00, gridY: 16.00, size: 1.5, variant: 0 },
            { type: 'rock', gridX: 21.00, gridY: 20.00, size: 1.5, variant: 1 },
            { type: 'rock', gridX: 26.00, gridY: 21.00, size: 1.5, variant: 2 },
            { type: 'rock', gridX: 29.00, gridY: 17.00, size: 1.5, variant: 2 },
            { type: 'rock', gridX: 27.00, gridY: 12.00, size: 1.5, variant: 3 },
            { type: 'vegetation', gridX: 45.00, gridY: 3.00, size: 1.8941159485225754, variant: 2 },
            { type: 'vegetation', gridX: 45.00, gridY: 5.00, size: 1.786388881277018, variant: 2 },
            { type: 'vegetation', gridX: 42.00, gridY: 4.00, size: 1.314158767387431, variant: 1 },
            { type: 'vegetation', gridX: 39.00, gridY: 2.00, size: 2.058276178837248, variant: 2 },
            { type: 'vegetation', gridX: 37.00, gridY: 4.00, size: 2.3932729114504783, variant: 1 },
            { type: 'vegetation', gridX: 37.00, gridY: 2.00, size: 1.4461721126775382, variant: 2 },
            { type: 'vegetation', gridX: 37.00, gridY: 5.00, size: 1.164162712642389, variant: 0 },
            { type: 'vegetation', gridX: 50.00, gridY: 30.00, size: 2.4366136095129782, variant: 3 },
            { type: 'vegetation', gridX: 45.00, gridY: 30.00, size: 2.6710637324927333, variant: 3 },
            { type: 'vegetation', gridX: 46.00, gridY: 30.00, size: 2.5977913927717227, variant: 0 },
            { type: 'vegetation', gridX: 50.00, gridY: 31.00, size: 1.2198561996242139, variant: 1 },
            { type: 'vegetation', gridX: 49.00, gridY: 29.00, size: 1.5405513332292906, variant: 2 },
            { type: 'vegetation', gridX: 57.00, gridY: 28.00, size: 1.1756081523281876, variant: 2 },
            { type: 'vegetation', gridX: 57.00, gridY: 30.00, size: 2.905999685856063, variant: 2 },
            { type: 'vegetation', gridX: 57.00, gridY: 28.00, size: 2.390434554560411, variant: 1 }
        ];
    }

    createMeanderingPath(canvasWidth, canvasHeight) {
        const gridWidth = this.gridWidth || 60;
        const gridHeight = this.gridHeight || 33.75;

        const pathInGridCoords = [
            { gridX: 24.00, gridY: 34.00 },
            { gridX: 7.00, gridY: 18.00 },
            { gridX: 28.00, gridY: 5.00 },
            { gridX: 45.00, gridY: 18.00 },
            { gridX: 28.00, gridY: 29.00 }
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
            enemyHealth_multiplier: 1.2, 
            speedMultiplier: 1, 
            spawnInterval: 1.14, 
            pattern: [{ type: 'villager', count: 10 }, { type: 'villager', count: 12, healthMultiplier: 1.5 }, { type: 'basic', count: 8, healthMultiplier: 1.3 }] 
        }
        // Wave 2
        , { 
            enemyHealth_multiplier: 1.4, 
            speedMultiplier: 1, 
            spawnInterval: 0.86, 
            pattern: [{ type: 'frog', count: 9 }, { type: 'frog', count: 10, healthMultiplier: 1.2, speedMultiplier: 1.2 }, { type: 'frog', count: 11, healthMultiplier: 1.5 }] 
        }
        // Wave 3
        , { 
            enemyHealth_multiplier: 2.5, 
            speedMultiplier: 1, 
            spawnInterval: 0.96, 
            pattern: [{ type: 'villager', count: 10, healthMultiplier: 1.8, speedMultiplier: 0.6 }, { type: 'basic', count: 12, healthMultiplier: 1.8 }, { type: 'archer', count: 5, speedMultiplier: 1.5 }] 
        }
        // Wave 4
        , { 
            enemyHealth_multiplier: 2.68, 
            speedMultiplier: 1, 
            spawnInterval: 0.68, 
            pattern: [{ type: 'beefyenemy', count: 9 }] 
        }
        // Wave 5
        , { 
            enemyHealth_multiplier: 2.68, 
            speedMultiplier: 1, 
            spawnInterval: 0.78, 
            pattern: [{ type: 'archer', count: 9, healthMultiplier: 2.5, speedMultiplier: 1.1 }, { type: 'frog', count: 12, healthMultiplier: 1.8 }, { type: 'shieldknight', count: 4, healthMultiplier: 2 }, { type: 'archer', count: 5, healthMultiplier: 3, speedMultiplier: 1.5 }] 
        }
        // Wave 6
        , { 
            enemyHealth_multiplier: 7, 
            speedMultiplier: 1, 
            spawnInterval: 0.88, 
            pattern: [{ type: 'mage', count: 3, healthMultiplier: 2 }, { type: 'frog', count: 13 }] 
        }
        // Wave 7
        , { 
            enemyHealth_multiplier: 6.7, 
            speedMultiplier: 1.2, 
            spawnInterval: 0.58, 
            pattern: [{ type: 'villager', count: 13 }, { type: 'basic', count: 11 }, { type: 'frog', count: 10, healthMultiplier: 2, speedMultiplier: 1.3 }] 
        }
        // Wave 8
        , { 
            enemyHealth_multiplier: 6.7, 
            speedMultiplier: 1.2, 
            spawnInterval: 0.78, 
            pattern: [{ type: 'basic', count: 12 }, { type: 'villager', count: 10 }, { type: 'archer', count: 12, speedMultiplier: 1.2 }] 
        }
        // Wave 9
        , { 
            enemyHealth_multiplier: 6.7, 
            speedMultiplier: 1, 
            spawnInterval: 1.95, 
            pattern: [{ type: 'beefyenemy', count: 6 }, { type: 'knight', count: 4 }] 
        }
        // Wave 10
        , { 
            enemyHealth_multiplier: 5.36, 
            speedMultiplier: 1, 
            spawnInterval: 4.7, 
            pattern: [{ type: 'firefrog', count: 3 }, { type: 'airfrog', count: 3 }, { type: 'firefrog', count: 3 }, { type: 'airfrog', count: 3 }] 
        }
        // Wave 11
        , { 
            enemyHealth_multiplier: 9.77, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'beefyenemy', count: 10, healthMultiplier: 3 }, { type: 'frog', count: 15 }, { type: 'mage', count: 4, healthMultiplier: 2 }, { type: 'basic', count: 12 }, { type: 'villager', count: 11 }, { type: 'shieldknight', count: 7 }, { type: 'archer', count: 10, healthMultiplier: 3, speedMultiplier: 2 }] 
        }
        // Wave 12
        , { 
            enemyHealth_multiplier: 3.62, 
            speedMultiplier: 1, 
            spawnInterval: 0.82, 
            pattern: [{ type: 'frog', count: 10 }, { type: 'frog', count: 11, healthMultiplier: 2, speedMultiplier: 1.2 }, { type: 'frog', count: 12, healthMultiplier: 3 }] 
        }
        // Wave 13
        , { 
            enemyHealth_multiplier: 10.85, 
            speedMultiplier: 0.9, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'knight', count: 5, healthMultiplier: 2.5 }, { type: 'shieldknight', count: 8, healthMultiplier: 2 }, { type: 'frog', count: 13, speedMultiplier: 1.3 }, { type: 'archer', count: 12, speedMultiplier: 1.4 }, { type: 'beefyenemy', count: 9 }, { type: 'villager', count: 9 }] 
        }
        // Wave 14
        , { 
            enemyHealth_multiplier: 3.62, 
            speedMultiplier: 1, 
            spawnInterval: 0.66, 
            pattern: [{ type: 'beefyenemy', count: 10 }, { type: 'frog', count: 3 }] 
        }
        // Wave 15
        , { 
            enemyHealth_multiplier: 3.62, 
            speedMultiplier: 1, 
            spawnInterval: 0.76, 
            pattern: [{ type: 'archer', count: 10, healthMultiplier: 2.5, speedMultiplier: 1.1 }, { type: 'frog', count: 14, healthMultiplier: 1.8 }, { type: 'shieldknight', count: 5, healthMultiplier: 2 }, { type: 'archer', count: 6, healthMultiplier: 3, speedMultiplier: 1.5 }] 
        }
        // Wave 16
        , { 
            enemyHealth_multiplier: 14.47, 
            speedMultiplier: 0.8, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'shieldknight', count: 10 }, { type: 'frog', count: 3 }] 
        }
        // Wave 17
        , { 
            enemyHealth_multiplier: 18.09, 
            speedMultiplier: 1, 
            spawnInterval: 11.9, 
            pattern: [{ type: 'knight', count: 6 }, { type: 'frog', count: 4 }] 
        }
        // Wave 18
        , { 
            enemyHealth_multiplier: 3.62, 
            speedMultiplier: 1, 
            spawnInterval: 1, 
            pattern: [{ type: 'knight', count: 4, healthMultiplier: 3 }, { type: 'shieldknight', count: 5, healthMultiplier: 2 }, { type: 'mage', count: 4, healthMultiplier: 2 }, { type: 'shieldknight', count: 4, healthMultiplier: 4 }, { type: 'frog', count: 4 }] 
        }
        // Wave 19
        , { 
            enemyHealth_multiplier: 18.09, 
            speedMultiplier: 1, 
            spawnInterval: 1, 
            pattern: [{ type: 'mage', count: 7, speedMultiplier: 0.6 }, { type: 'frog', count: 12, speedMultiplier: 1.2 }] 
        }
        // Wave 20
        , { 
            enemyHealth_multiplier: 7.24, 
            speedMultiplier: 1, 
            spawnInterval: 4.4, 
            pattern: [{ type: 'waterfrog', count: 4 }, { type: 'earthfrog', count: 4 }, { type: 'waterfrog', count: 4 }, { type: 'earthfrog', count: 4 }] 
        }
        // Wave 21
        , { 
            enemyHealth_multiplier: 20.96, 
            speedMultiplier: 1.1, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'shieldknight', count: 7, healthMultiplier: 3 }, { type: 'mage', count: 5 }, { type: 'villager', count: 16 }, { type: 'shieldknight', count: 6, healthMultiplier: 4 }, { type: 'beefyenemy', count: 14, healthMultiplier: 2 }, { type: 'mage', count: 5 }, { type: 'frog', count: 24 }, { type: 'archer', count: 15, healthMultiplier: 5, speedMultiplier: 1.5 }, { type: 'shieldknight', count: 5, healthMultiplier: 6 }] 
        }
        // Wave 22
        , { 
            enemyHealth_multiplier: 4.56, 
            speedMultiplier: 1, 
            spawnInterval: 0.78, 
            pattern: [{ type: 'frog', count: 15 }, { type: 'frog', count: 16, healthMultiplier: 2, speedMultiplier: 1.2 }, { type: 'frog', count: 18, healthMultiplier: 3 }] 
        }
        // Wave 23
        , { 
            enemyHealth_multiplier: 22.78, 
            speedMultiplier: 1.3, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'archer', count: 18 }, { type: 'villager', count: 21 }, { type: 'basic', count: 19 }, { type: 'frog', count: 4 }] 
        }
        // Wave 24
        , { 
            enemyHealth_multiplier: 25.06, 
            speedMultiplier: 1.7, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'archer', count: 16 }, { type: 'frog', count: 4 }] 
        }
        // Wave 25
        , { 
            enemyHealth_multiplier: 31.89, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'mage', count: 1 }, { type: 'waterfrog', count: 1 }] 
        }
        // Wave 26
        , { 
            enemyHealth_multiplier: 12.3, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'beefyenemy', count: 11, healthMultiplier: 3 }, { type: 'frog', count: 24 }, { type: 'mage', count: 5, healthMultiplier: 2 }, { type: 'basic', count: 13 }, { type: 'villager', count: 12 }, { type: 'shieldknight', count: 8 }, { type: 'archer', count: 11, healthMultiplier: 3, speedMultiplier: 2 }] 
        }
        // Wave 27
        , { 
            enemyHealth_multiplier: 31.89, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'waterfrog', count: 1 }, { type: 'earthfrog', count: 1 }, { type: 'firefrog', count: 1 }] 
        }
        // Wave 28
        , { 
            enemyHealth_multiplier: 13.67, 
            speedMultiplier: 0.9, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'knight', count: 6, healthMultiplier: 2.5 }, { type: 'shieldknight', count: 9, healthMultiplier: 2 }, { type: 'frog', count: 22, speedMultiplier: 1.3 }, { type: 'archer', count: 13, speedMultiplier: 1.4 }, { type: 'beefyenemy', count: 10 }, { type: 'villager', count: 10 }] 
        }
        // Wave 29
        , { 
            enemyHealth_multiplier: 63.78, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'firefrog', count: 1 }] 
        }
        // Wave 30
        , { 
            enemyHealth_multiplier: 9.11, 
            speedMultiplier: 1, 
            spawnInterval: 4.1, 
            pattern: [{ type: 'firefrog', count: 5 }, { type: 'waterfrog', count: 5 }, { type: 'firefrog', count: 5 }, { type: 'waterfrog', count: 5 }] 
        }
        // Wave 31
        , { 
            enemyHealth_multiplier: 14.83, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'beefyenemy', count: 13, healthMultiplier: 3 }, { type: 'frog', count: 30 }, { type: 'mage', count: 7, healthMultiplier: 2 }, { type: 'basic', count: 15 }, { type: 'villager', count: 14 }, { type: 'shieldknight', count: 10 }, { type: 'archer', count: 13, healthMultiplier: 3, speedMultiplier: 2 }] 
        }
        // Wave 32
        , { 
            enemyHealth_multiplier: 38.46, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'mage', count: 1 }, { type: 'airfrog', count: 1 }] 
        }
        // Wave 33
        , { 
            enemyHealth_multiplier: 27.47, 
            speedMultiplier: 1.4, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'archer', count: 20 }, { type: 'villager', count: 23 }, { type: 'basic', count: 21 }, { type: 'frog', count: 5 }] 
        }
        // Wave 34
        , { 
            enemyHealth_multiplier: 30.22, 
            speedMultiplier: 1.7, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'archer', count: 18 }, { type: 'frog', count: 5 }] 
        }
        // Wave 35
        , { 
            enemyHealth_multiplier: 5.49, 
            speedMultiplier: 1, 
            spawnInterval: 0.72, 
            pattern: [{ type: 'archer', count: 13, healthMultiplier: 2.5, speedMultiplier: 1.1 }, { type: 'frog', count: 29, healthMultiplier: 1.8 }, { type: 'shieldknight', count: 8, healthMultiplier: 2 }, { type: 'archer', count: 9, healthMultiplier: 3, speedMultiplier: 1.5 }] 
        }
        // Wave 36
        , { 
            enemyHealth_multiplier: 25.27, 
            speedMultiplier: 1.1, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'shieldknight', count: 9, healthMultiplier: 3 }, { type: 'mage', count: 7 }, { type: 'villager', count: 18 }, { type: 'shieldknight', count: 8, healthMultiplier: 4 }, { type: 'beefyenemy', count: 16, healthMultiplier: 2 }, { type: 'mage', count: 7 }, { type: 'frog', count: 37 }, { type: 'archer', count: 17, healthMultiplier: 5, speedMultiplier: 1.5 }, { type: 'shieldknight', count: 7, healthMultiplier: 6 }] 
        }
        // Wave 37
        , { 
            enemyHealth_multiplier: 76.92, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'earthfrog', count: 1 }] 
        }
        // Wave 38
        , { 
            enemyHealth_multiplier: 16.48, 
            speedMultiplier: 0.9, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'knight', count: 8, healthMultiplier: 2.5 }, { type: 'shieldknight', count: 11, healthMultiplier: 2 }, { type: 'frog', count: 31, speedMultiplier: 1.3 }, { type: 'archer', count: 15, speedMultiplier: 1.4 }, { type: 'beefyenemy', count: 12 }, { type: 'villager', count: 12 }] 
        }
        // Wave 39
        , { 
            enemyHealth_multiplier: 38.46, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'waterfrog', count: 1 }, { type: 'airfrog', count: 1 }, { type: 'earthfrog', count: 1 }] 
        }
        // Wave 40
        , { 
            enemyHealth_multiplier: 10.99, 
            speedMultiplier: 1, 
            spawnInterval: 3.8, 
            pattern: [{ type: 'airfrog', count: 7 }, { type: 'earthfrog', count: 7 }, { type: 'airfrog', count: 7 }, { type: 'earthfrog', count: 7 }] 
        }
        // Wave 41
        , { 
            enemyHealth_multiplier: 29.59, 
            speedMultiplier: 1.1, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'shieldknight', count: 10, healthMultiplier: 3 }, { type: 'mage', count: 8 }, { type: 'villager', count: 19 }, { type: 'shieldknight', count: 9, healthMultiplier: 4 }, { type: 'beefyenemy', count: 17, healthMultiplier: 2 }, { type: 'mage', count: 8 }, { type: 'frog', count: 42 }, { type: 'archer', count: 18, healthMultiplier: 5, speedMultiplier: 1.5 }, { type: 'shieldknight', count: 8, healthMultiplier: 6 }] 
        }
        // Wave 42
        , { 
            enemyHealth_multiplier: 17.37, 
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
            enemyHealth_multiplier: 35.38, 
            speedMultiplier: 1.8, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'archer', count: 19 }, { type: 'frog', count: 6 }] 
        }
        // Wave 45
        , { 
            enemyHealth_multiplier: 6.43, 
            speedMultiplier: 1, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'archer', count: 14, healthMultiplier: 2.5, speedMultiplier: 1.1 }, { type: 'frog', count: 37, healthMultiplier: 1.8 }, { type: 'shieldknight', count: 9, healthMultiplier: 2 }, { type: 'archer', count: 10, healthMultiplier: 3, speedMultiplier: 1.5 }] 
        }
        // Wave 46
        , { 
            enemyHealth_multiplier: 19.3, 
            speedMultiplier: 0.9, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'knight', count: 9, healthMultiplier: 2.5 }, { type: 'shieldknight', count: 12, healthMultiplier: 2 }, { type: 'frog', count: 37, speedMultiplier: 1.3 }, { type: 'archer', count: 16, speedMultiplier: 1.4 }, { type: 'beefyenemy', count: 13 }, { type: 'villager', count: 13 }] 
        }
        // Wave 47
        , { 
            enemyHealth_multiplier: 25.73, 
            speedMultiplier: 0.8, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'shieldknight', count: 14 }, { type: 'firefrog', count: 5 }] 
        }
        // Wave 48
        , { 
            enemyHealth_multiplier: 45.02, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'firefrog', count: 1 }, { type: 'waterfrog', count: 1 }, { type: 'earthfrog', count: 1 }, { type: 'airfrog', count: 1 }] 
        }
        // Wave 49
        , { 
            enemyHealth_multiplier: 27.01, 
            speedMultiplier: 1.2, 
            spawnInterval: 0.85, 
            pattern: [{ type: 'knight', count: 9, healthMultiplier: 3 }, { type: 'archer', count: 19, speedMultiplier: 1.3 }, { type: 'basic', count: 17 }, { type: 'beefyenemy', count: 15, healthMultiplier: 2.5 }, { type: 'mage', count: 9 }, { type: 'frog', count: 48, healthMultiplier: 1.5 }, { type: 'shieldknight', count: 10, healthMultiplier: 4 }] 
        }
        // Wave 50
        , { 
            enemyHealth_multiplier: 12.86, 
            speedMultiplier: 1, 
            spawnInterval: 3.5, 
            pattern: [{ type: 'firefrog', count: 8 }, { type: 'earthfrog', count: 8 }, { type: 'firefrog', count: 8 }, { type: 'earthfrog', count: 8 }] 
        }
        // Wave 51
        , { 
            enemyHealth_multiplier: 19.9, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'beefyenemy', count: 15, healthMultiplier: 3 }, { type: 'frog', count: 44 }, { type: 'mage', count: 9, healthMultiplier: 2 }, { type: 'basic', count: 17 }, { type: 'villager', count: 16 }, { type: 'shieldknight', count: 12 }, { type: 'archer', count: 15, healthMultiplier: 3, speedMultiplier: 2 }] 
        }
        // Wave 52
        , { 
            enemyHealth_multiplier: 33.9, 
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
            enemyHealth_multiplier: 36.85, 
            speedMultiplier: 1.4, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'archer', count: 22 }, { type: 'villager', count: 25 }, { type: 'basic', count: 23 }, { type: 'waterfrog', count: 6 }] 
        }
        // Wave 55
        , { 
            enemyHealth_multiplier: 7.37, 
            speedMultiplier: 1, 
            spawnInterval: 0.68, 
            pattern: [{ type: 'archer', count: 15, healthMultiplier: 2.5, speedMultiplier: 1.1 }, { type: 'frog', count: 40, healthMultiplier: 1.8 }, { type: 'shieldknight', count: 10, healthMultiplier: 2 }, { type: 'archer', count: 11, healthMultiplier: 3, speedMultiplier: 1.5 }] 
        }
        // Wave 56
        , { 
            enemyHealth_multiplier: 22.11, 
            speedMultiplier: 0.9, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'knight', count: 10, healthMultiplier: 2.5 }, { type: 'shieldknight', count: 13, healthMultiplier: 2 }, { type: 'frog', count: 40, speedMultiplier: 1.3 }, { type: 'archer', count: 17, speedMultiplier: 1.4 }, { type: 'beefyenemy', count: 14 }, { type: 'villager', count: 14 }] 
        }
        // Wave 57
        , { 
            enemyHealth_multiplier: 60, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'firefrog', count: 1 }, { type: 'earthfrog', count: 1 }] 
        }
        ];

        if (wave > 0 && wave <= waveConfigs.length) {
            return waveConfigs[wave - 1];
        }
        
        return null;
    }
}