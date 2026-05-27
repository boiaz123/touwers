import { LevelBase } from '../LevelBase.js';

export class ForestLevel8 extends LevelBase {
    static levelMetadata = {
        name: 'Whispering Trees',
        difficulty: 'Easy',
        order: 8,
        campaign: 'forest'
    };

    constructor() {
        super();
        // Derive instance properties from static metadata
        this.levelName = ForestLevel8.levelMetadata.name;
        this.levelNumber = ForestLevel8.levelMetadata.order;
        this.difficulty = ForestLevel8.levelMetadata.difficulty;
        this.campaign = ForestLevel8.levelMetadata.campaign;
        this.maxWaves = 13;

        // Set terrain elements (prevent tower placement on these areas)
        this.terrainElements = [
            { type: 'vegetation', gridX: 1.00, gridY: 3.00, size: 1.8765382976341467, variant: 2 },
            { type: 'vegetation', gridX: 4.00, gridY: 5.00, size: 2.403689053849999, variant: 2 },
            { type: 'vegetation', gridX: 2.00, gridY: 4.00, size: 2.405703858838781, variant: 2 },
            { type: 'vegetation', gridX: 2.00, gridY: 2.00, size: 1.7372647095468585, variant: 2 },
            { type: 'vegetation', gridX: 1.00, gridY: 1.00, size: 1.9631343798245098, variant: 1 },
            { type: 'vegetation', gridX: 0.00, gridY: 4.00, size: 2.6464450894737372, variant: 1 },
            { type: 'vegetation', gridX: 2.00, gridY: 5.00, size: 2.2551167771677543, variant: 0 },
            { type: 'vegetation', gridX: 0.00, gridY: 6.00, size: 2.3335391414147004, variant: 2 },
            { type: 'vegetation', gridX: 3.00, gridY: 10.00, size: 2.368138414556997, variant: 3 },
            { type: 'vegetation', gridX: 4.00, gridY: 9.00, size: 1.9661748036079743, variant: 2 },
            { type: 'vegetation', gridX: 0.00, gridY: 7.00, size: 1.6307302703906437, variant: 0 },
            { type: 'vegetation', gridX: 0.00, gridY: 9.00, size: 2.310920671100996, variant: 1 },
            { type: 'vegetation', gridX: 4.00, gridY: 21.00, size: 2.2356217671874337, variant: 3 },
            { type: 'vegetation', gridX: 2.00, gridY: 21.00, size: 2.4825126581516272, variant: 2 },
            { type: 'vegetation', gridX: 3.00, gridY: 20.00, size: 2.6849201526285262, variant: 0 },
            { type: 'vegetation', gridX: 2.00, gridY: 18.00, size: 2.2675111250408833, variant: 3 },
            { type: 'vegetation', gridX: 0.00, gridY: 20.00, size: 2.7804307235426027, variant: 0 },
            { type: 'vegetation', gridX: 7.00, gridY: 22.00, size: 1.6611334384401772, variant: 2 },
            { type: 'vegetation', gridX: 5.00, gridY: 21.00, size: 1.655621273247674, variant: 3 },
            { type: 'vegetation', gridX: 6.00, gridY: 25.00, size: 1.5500901865269299, variant: 1 },
            { type: 'vegetation', gridX: 5.00, gridY: 25.00, size: 2.148780123160404, variant: 2 },
            { type: 'vegetation', gridX: 6.00, gridY: 23.00, size: 1.8023347285049207, variant: 0 },
            { type: 'vegetation', gridX: 6.00, gridY: 25.00, size: 2.0329691097320883, variant: 3 },
            { type: 'vegetation', gridX: 1.00, gridY: 25.00, size: 2.515490185964605, variant: 2 },
            { type: 'vegetation', gridX: 5.00, gridY: 25.00, size: 2.701726298472872, variant: 2 },
            { type: 'vegetation', gridX: 1.00, gridY: 27.00, size: 2.275262323129748, variant: 1 },
            { type: 'vegetation', gridX: 2.00, gridY: 24.00, size: 2.183642587912307, variant: 0 },
            { type: 'vegetation', gridX: 5.00, gridY: 27.00, size: 2.0096795496390314, variant: 1 },
            { type: 'vegetation', gridX: 0.00, gridY: 24.00, size: 2.8132097742537594, variant: 2 },
            { type: 'vegetation', gridX: 2.00, gridY: 28.00, size: 2.465913907636719, variant: 0 },
            { type: 'vegetation', gridX: 1.00, gridY: 29.00, size: 2.3858151085777894, variant: 2 },
            { type: 'vegetation', gridX: 1.00, gridY: 29.00, size: 2.133561949301482, variant: 1 },
            { type: 'vegetation', gridX: 2.00, gridY: 32.00, size: 1.709424464189883, variant: 2 },
            { type: 'vegetation', gridX: 2.00, gridY: 29.00, size: 1.9097775913226693, variant: 0 },
            { type: 'vegetation', gridX: 2.00, gridY: 32.75, size: 2.745469911067186, variant: 0 },
            { type: 'vegetation', gridX: 6.00, gridY: 29.00, size: 1.778227871142522, variant: 1 },
            { type: 'vegetation', gridX: 4.00, gridY: 29.00, size: 1.8756164644447242, variant: 3 },
            { type: 'vegetation', gridX: 6.00, gridY: 29.00, size: 1.671194497058856, variant: 3 },
            { type: 'vegetation', gridX: 4.00, gridY: 31.00, size: 1.5357586192159278, variant: 3 },
            { type: 'vegetation', gridX: 7.00, gridY: 28.00, size: 2.471226246648195, variant: 1 },
            { type: 'vegetation', gridX: 3.00, gridY: 29.00, size: 1.9367548359235474, variant: 0 },
            { type: 'vegetation', gridX: 11.00, gridY: 29.00, size: 2.7345762081249654, variant: 0 },
            { type: 'vegetation', gridX: 10.00, gridY: 29.00, size: 2.454022828872421, variant: 1 },
            { type: 'vegetation', gridX: 12.00, gridY: 30.00, size: 2.2596827215311577, variant: 3 },
            { type: 'vegetation', gridX: 9.00, gridY: 32.75, size: 1.6712405977220273, variant: 1 },
            { type: 'vegetation', gridX: 8.00, gridY: 32.75, size: 2.4820016218087346, variant: 2 },
            { type: 'vegetation', gridX: 12.00, gridY: 29.00, size: 2.447308896768491, variant: 2 },
            { type: 'vegetation', gridX: 16.00, gridY: 29.00, size: 2.4616539783439726, variant: 3 },
            { type: 'vegetation', gridX: 13.00, gridY: 32.00, size: 2.7008825433360224, variant: 2 },
            { type: 'vegetation', gridX: 14.00, gridY: 28.00, size: 1.994162523984501, variant: 2 },
            { type: 'vegetation', gridX: 15.00, gridY: 31.00, size: 1.8848515082706305, variant: 3 },
            { type: 'vegetation', gridX: 12.00, gridY: 32.75, size: 1.5220759616249473, variant: 1 },
            { type: 'vegetation', gridX: 17.00, gridY: 31.00, size: 1.909160298351916, variant: 1 },
            { type: 'vegetation', gridX: 18.00, gridY: 30.00, size: 2.3157943702295594, variant: 2 },
            { type: 'vegetation', gridX: 20.00, gridY: 30.00, size: 1.568761465460006, variant: 0 },
            { type: 'vegetation', gridX: 20.00, gridY: 31.00, size: 2.6222682563047677, variant: 3 },
            { type: 'vegetation', gridX: 18.00, gridY: 29.00, size: 2.001319338113283, variant: 1 },
            { type: 'vegetation', gridX: 57.00, gridY: 31.00, size: 2.9938837968552976, variant: 1 },
            { type: 'vegetation', gridX: 56.00, gridY: 32.00, size: 2.434914263608654, variant: 2 },
            { type: 'vegetation', gridX: 55.00, gridY: 32.00, size: 1.5438520672570855, variant: 1 },
            { type: 'vegetation', gridX: 57.00, gridY: 32.75, size: 2.449347833534172, variant: 0 },
            { type: 'vegetation', gridX: 54.00, gridY: 31.00, size: 2.8156082413076176, variant: 2 },
            { type: 'vegetation', gridX: 59.00, gridY: 30.00, size: 2.750894786372067, variant: 1 },
            { type: 'vegetation', gridX: 50.00, gridY: 32.75, size: 1.9209769954472333, variant: 3 },
            { type: 'vegetation', gridX: 50.00, gridY: 32.75, size: 2.7100289676912634, variant: 3 },
            { type: 'vegetation', gridX: 50.00, gridY: 32.75, size: 2.7400692287261865, variant: 0 },
            { type: 'vegetation', gridX: 48.00, gridY: 32.00, size: 1.626918826745408, variant: 3 },
            { type: 'vegetation', gridX: 52.00, gridY: 32.00, size: 2.80640453616789, variant: 3 },
            { type: 'vegetation', gridX: 48.00, gridY: 30.00, size: 2.231227786930658, variant: 0 },
            { type: 'vegetation', gridX: 52.00, gridY: 28.00, size: 1.7979170952233303, variant: 3 },
            { type: 'vegetation', gridX: 52.00, gridY: 27.00, size: 1.8580222591581599, variant: 2 },
            { type: 'vegetation', gridX: 52.00, gridY: 28.00, size: 2.7855302440616576, variant: 0 },
            { type: 'vegetation', gridX: 52.00, gridY: 28.00, size: 2.3517394461052215, variant: 1 },
            { type: 'vegetation', gridX: 53.00, gridY: 28.00, size: 1.8910338594394758, variant: 0 },
            { type: 'vegetation', gridX: 47.00, gridY: 32.75, size: 2.594267633980104, variant: 2 },
            { type: 'vegetation', gridX: 45.00, gridY: 28.00, size: 2.971815825174932, variant: 3 },
            { type: 'vegetation', gridX: 43.00, gridY: 30.00, size: 2.7839631614442517, variant: 3 },
            { type: 'vegetation', gridX: 47.00, gridY: 32.00, size: 2.776671927195088, variant: 0 },
            { type: 'vegetation', gridX: 46.00, gridY: 32.75, size: 1.9005269045002564, variant: 0 },
            { type: 'vegetation', gridX: 44.00, gridY: 28.00, size: 2.2872937947333476, variant: 0 },
            { type: 'vegetation', gridX: 48.00, gridY: 24.00, size: 1.7647756557589631, variant: 2 },
            { type: 'vegetation', gridX: 47.00, gridY: 22.00, size: 1.6059316042542986, variant: 3 },
            { type: 'vegetation', gridX: 45.00, gridY: 25.00, size: 2.225364021998179, variant: 0 },
            { type: 'vegetation', gridX: 48.00, gridY: 21.00, size: 2.7296607171943856, variant: 1 },
            { type: 'vegetation', gridX: 46.00, gridY: 24.00, size: 1.9738873469331375, variant: 0 },
            { type: 'vegetation', gridX: 56.00, gridY: 22.00, size: 2.9012500073847045, variant: 1 },
            { type: 'vegetation', gridX: 56.00, gridY: 21.00, size: 2.638770038905466, variant: 2 },
            { type: 'vegetation', gridX: 54.00, gridY: 24.00, size: 2.292391667964777, variant: 2 },
            { type: 'vegetation', gridX: 53.00, gridY: 25.00, size: 2.012637505060555, variant: 3 },
            { type: 'vegetation', gridX: 52.00, gridY: 23.00, size: 2.7483201568100837, variant: 1 },
            { type: 'vegetation', gridX: 55.00, gridY: 21.00, size: 2.740202185386096, variant: 0 },
            { type: 'vegetation', gridX: 59.00, gridY: 18.00, size: 2.644405084903453, variant: 3 },
            { type: 'vegetation', gridX: 59.00, gridY: 15.00, size: 2.4419251477817454, variant: 1 },
            { type: 'vegetation', gridX: 59.00, gridY: 17.00, size: 1.8848472017689666, variant: 1 },
            { type: 'vegetation', gridX: 59.00, gridY: 19.00, size: 2.0166808293399154, variant: 3 },
            { type: 'vegetation', gridX: 59.00, gridY: 14.00, size: 2.254819390864938, variant: 3 },
            { type: 'vegetation', gridX: 59.00, gridY: 16.00, size: 1.815617851465328, variant: 0 },
            { type: 'vegetation', gridX: 58.00, gridY: 7.00, size: 1.6227302118214018, variant: 2 },
            { type: 'vegetation', gridX: 58.00, gridY: 10.00, size: 1.792203371840992, variant: 2 },
            { type: 'vegetation', gridX: 59.00, gridY: 7.00, size: 2.124286101080619, variant: 2 },
            { type: 'vegetation', gridX: 59.00, gridY: 11.00, size: 2.012236904922877, variant: 1 },
            { type: 'vegetation', gridX: 59.00, gridY: 11.00, size: 1.844066321648048, variant: 0 },
            { type: 'vegetation', gridX: 58.00, gridY: 10.00, size: 2.7311267730142523, variant: 1 },
            { type: 'vegetation', gridX: 54.00, gridY: 13.00, size: 1.6699707288002803, variant: 0 },
            { type: 'vegetation', gridX: 57.00, gridY: 16.00, size: 2.3611732918775377, variant: 1 },
            { type: 'vegetation', gridX: 54.00, gridY: 14.00, size: 2.7092311957926207, variant: 2 },
            { type: 'vegetation', gridX: 53.00, gridY: 13.00, size: 1.796596025373758, variant: 3 },
            { type: 'vegetation', gridX: 57.00, gridY: 15.00, size: 1.6463393869758207, variant: 3 },
            { type: 'vegetation', gridX: 57.00, gridY: 14.00, size: 1.695577991857854, variant: 3 },
            { type: 'vegetation', gridX: 59.00, gridY: 24.00, size: 1.7132645922709706, variant: 1 },
            { type: 'vegetation', gridX: 58.00, gridY: 25.00, size: 2.884572558195449, variant: 0 },
            { type: 'vegetation', gridX: 57.00, gridY: 26.00, size: 2.93550512956704, variant: 2 },
            { type: 'vegetation', gridX: 59.00, gridY: 25.00, size: 1.9804147724690595, variant: 2 },
            { type: 'vegetation', gridX: 57.00, gridY: 27.00, size: 2.388226256635405, variant: 0 },
            { type: 'vegetation', gridX: 58.00, gridY: 28.00, size: 2.258468780099819, variant: 2 },
            { type: 'vegetation', gridX: 57.00, gridY: 0.00, size: 2.1389059424516725, variant: 3 },
            { type: 'vegetation', gridX: 56.00, gridY: 5.00, size: 2.4848529251296188, variant: 2 },
            { type: 'vegetation', gridX: 58.00, gridY: 4.00, size: 2.597974949602822, variant: 0 },
            { type: 'vegetation', gridX: 56.00, gridY: 4.00, size: 2.9868395184496417, variant: 3 },
            { type: 'vegetation', gridX: 56.00, gridY: 6.00, size: 2.1889403786782458, variant: 3 },
            { type: 'vegetation', gridX: 58.00, gridY: 3.00, size: 2.9724694101163074, variant: 3 },
            { type: 'vegetation', gridX: 51.00, gridY: 4.00, size: 1.9122202195622975, variant: 3 },
            { type: 'vegetation', gridX: 49.00, gridY: 1.00, size: 2.962170471840504, variant: 3 },
            { type: 'vegetation', gridX: 49.00, gridY: 4.00, size: 1.928764028228819, variant: 0 },
            { type: 'vegetation', gridX: 51.00, gridY: 2.00, size: 2.2694900770531685, variant: 3 },
            { type: 'vegetation', gridX: 49.00, gridY: 2.00, size: 2.2063522487267395, variant: 0 },
            { type: 'vegetation', gridX: 55.00, gridY: 2.00, size: 2.6294580229735356, variant: 3 },
            { type: 'vegetation', gridX: 53.00, gridY: 2.00, size: 2.8073729948202786, variant: 0 },
            { type: 'vegetation', gridX: 52.00, gridY: 4.00, size: 2.0342784650950367, variant: 1 },
            { type: 'vegetation', gridX: 52.00, gridY: 1.00, size: 1.5055658101379459, variant: 2 },
            { type: 'vegetation', gridX: 51.00, gridY: 3.00, size: 1.8894894551946972, variant: 3 },
            { type: 'vegetation', gridX: 53.00, gridY: 4.00, size: 2.5539498346747918, variant: 0 },
            { type: 'vegetation', gridX: 46.00, gridY: 3.00, size: 2.371363855621581, variant: 2 },
            { type: 'vegetation', gridX: 43.00, gridY: 2.00, size: 2.0616555406182866, variant: 0 },
            { type: 'vegetation', gridX: 44.00, gridY: 4.00, size: 2.0478922821662717, variant: 2 },
            { type: 'vegetation', gridX: 47.00, gridY: 2.00, size: 2.0146568086401175, variant: 3 },
            { type: 'water', gridX: 39.00, gridY: 16.00, size: 4, waterType: 'lake' },
            { type: 'rock', gridX: 48.00, gridY: 25.00, size: 4, variant: 0 },
            { type: 'rock', gridX: 3.00, gridY: 7.00, size: 3, variant: 2 },
            { type: 'rock', gridX: 1.00, gridY: 10.00, size: 3, variant: 2 },
            { type: 'rock', gridX: 8.00, gridY: 29.00, size: 3, variant: 2 },
            { type: 'rock', gridX: 56.00, gridY: 7.00, size: 3, variant: 2 },
            { type: 'rock', gridX: 54.00, gridY: 26.00, size: 2.5, variant: 1 },
            { type: 'rock', gridX: 37.00, gridY: 18.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 36.00, gridY: 15.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 41.00, gridY: 18.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 38.00, gridY: 13.00, size: 2.5, variant: 2 },
            { type: 'vegetation', gridX: 38.00, gridY: 19.00, size: 2.5, variant: 2 },
            { type: 'vegetation', gridX: 42.00, gridY: 15.00, size: 3.5, variant: 1 },
            { type: 'vegetation', gridX: 35.00, gridY: 19.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 40.00, gridY: 11.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 40.00, gridY: 20.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 44.00, gridY: 17.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 34.00, gridY: 20.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 34.00, gridY: 16.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 36.00, gridY: 19.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 40.00, gridY: 13.00, size: 2, variant: 0 }
        ];
    }

    createMeanderingPath(canvasWidth, canvasHeight) {
        const gridWidth = this.gridWidth || 60;
        const gridHeight = this.gridHeight || 33.75;

        const pathInGridCoords = [
            { gridX: 0.00, gridY: 16.00 },
            { gridX: 14.00, gridY: 7.00 },
            { gridX: 45.00, gridY: 7.00 },
            { gridX: 50.00, gridY: 17.00 },
            { gridX: 50.00, gridY: 27.00 },
            { gridX: 30.00, gridY: 27.00 }
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
            speedMultiplier: 0.8, 
            spawnInterval: 2, 
            pattern: [{ type: 'basic', count: 22 }] 
        }
        // Wave 2
        , { 
            enemyHealth_multiplier: 1, 
            speedMultiplier: 0.7, 
            spawnInterval: 1.4, 
            pattern: [{ type: 'villager', count: 8 }, { type: 'basic', count: 6 }, { type: 'archer', count: 6 }] 
        }
        // Wave 3
        , { 
            enemyHealth_multiplier: 1.2, 
            speedMultiplier: 0.7, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'villager', count: 10 }, { type: 'basic', count: 9 }, { type: 'archer', count: 6 }] 
        }
        // Wave 4
        , { 
            enemyHealth_multiplier: 1.2, 
            speedMultiplier: 0.8, 
            spawnInterval: 1.6, 
            pattern: [{ type: 'beefyenemy', count: 2 }] 
        }
        // Wave 5
        , { 
            enemyHealth_multiplier: 1, 
            speedMultiplier: 1.2, 
            spawnInterval: 0.5, 
            pattern: [{ type: 'villager', count: 34 }] 
        }
        // Wave 6
        , { 
            enemyHealth_multiplier: 1.3, 
            speedMultiplier: 1, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'archer', count: 25 }] 
        }
        // Wave 7
        , { 
            enemyHealth_multiplier: 1.6, 
            speedMultiplier: 0.8, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'beefyenemy', count: 5 }, { type: 'archer', count: 12 }] 
        }
        // Wave 8
        , { 
            enemyHealth_multiplier: 1.5, 
            speedMultiplier: 0.7, 
            spawnInterval: 1, 
            pattern: [{ type: 'basic', count: 14 }, { type: 'villager', count: 14 }, { type: 'beefyenemy', count: 7 }] 
        }
        // Wave 9
        , { 
            enemyHealth_multiplier: 1.8, 
            speedMultiplier: 0.8, 
            spawnInterval: 1.2, 
            pattern: [{ type: 'beefyenemy', count: 12 }] 
        }
        // Wave 10
        , { 
            enemyHealth_multiplier: 1.7, 
            speedMultiplier: 0.7, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'beefyenemy', count: 11 }, { type: 'archer', count: 11 }, { type: 'basic', count: 9 }, { type: 'villager', count: 12 }] 
        }
        // Wave 11
        , { 
            enemyHealth_multiplier: 1.2, 
            speedMultiplier: 1.35, 
            spawnInterval: 0.3, 
            pattern: [{ type: 'archer', count: 35 }] 
        }
        // Wave 12
        , { 
            enemyHealth_multiplier: 1, 
            speedMultiplier: 1.25, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'villager', count: 14 }, { type: 'basic', count: 16 }, { type: 'archer', count: 14 }, { type: 'beefyenemy', count: 3 }] 
        }
        // Wave 13
        , { 
            enemyHealth_multiplier: 3, 
            speedMultiplier: 0.7, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'knight', count: 1 }] 
        }
        ];

        if (wave > 0 && wave <= waveConfigs.length) {
            return waveConfigs[wave - 1];
        }
        
        return null;
    }
}