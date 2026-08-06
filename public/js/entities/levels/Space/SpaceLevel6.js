import { LevelBase } from '../LevelBase.js';

export class SpaceLevel6 extends LevelBase {
    static levelMetadata = {
        name: 'Zub\'Kroa\'Xath',
        difficulty: 'Nightmare',
        order: 6,
        campaign: 'space'
    };

    constructor() {
        super();
        // Derive instance properties from static metadata
        this.levelName = SpaceLevel6.levelMetadata.name;
        this.levelNumber = SpaceLevel6.levelMetadata.order;
        this.difficulty = SpaceLevel6.levelMetadata.difficulty;
        this.campaign = SpaceLevel6.levelMetadata.campaign;
        this.maxWaves = 54;

        // Set terrain elements (prevent tower placement on these areas)
        this.terrainElements = [
            { type: 'vegetation', gridX: 3.00, gridY: 1.00, size: 1.4685443259621873, variant: 2 },
            { type: 'vegetation', gridX: 7.00, gridY: 4.00, size: 2.928758476338586, variant: 2 },
            { type: 'vegetation', gridX: 3.00, gridY: 1.00, size: 2.668744652944117, variant: 2 },
            { type: 'vegetation', gridX: 6.00, gridY: 6.00, size: 1.9597457950409243, variant: 3 },
            { type: 'vegetation', gridX: 7.00, gridY: 8.00, size: 2.5144978319642415, variant: 2 },
            { type: 'vegetation', gridX: 4.00, gridY: 8.00, size: 1.996187895903356, variant: 1 },
            { type: 'vegetation', gridX: 17.00, gridY: 4.00, size: 2.252437562047726, variant: 1 },
            { type: 'vegetation', gridX: 16.00, gridY: 2.00, size: 2.9294529329823593, variant: 0 },
            { type: 'vegetation', gridX: 13.00, gridY: 4.00, size: 2.278780660918342, variant: 1 },
            { type: 'vegetation', gridX: 16.00, gridY: 1.00, size: 1.4367460707728168, variant: 2 },
            { type: 'vegetation', gridX: 11.00, gridY: 8.00, size: 2.0092402510127956, variant: 3 },
            { type: 'vegetation', gridX: 15.00, gridY: 6.00, size: 1.9088744331433198, variant: 3 },
            { type: 'vegetation', gridX: 15.00, gridY: 3.00, size: 1.5386733386088531, variant: 1 },
            { type: 'vegetation', gridX: 13.00, gridY: 5.00, size: 2.274747416311039, variant: 1 },
            { type: 'vegetation', gridX: 55.00, gridY: 7.00, size: 1.8291255221733225, variant: 1 },
            { type: 'vegetation', gridX: 56.00, gridY: 3.00, size: 2.4382097835863115, variant: 0 },
            { type: 'vegetation', gridX: 56.00, gridY: 5.00, size: 2.6538447242700824, variant: 2 },
            { type: 'vegetation', gridX: 57.00, gridY: 6.00, size: 1.098736316653424, variant: 0 },
            { type: 'vegetation', gridX: 59.00, gridY: 6.00, size: 2.007201500660438, variant: 0 },
            { type: 'vegetation', gridX: 56.00, gridY: 6.00, size: 1.919855585894527, variant: 0 },
            { type: 'vegetation', gridX: 53.00, gridY: 3.00, size: 2.8725821550318753, variant: 3 },
            { type: 'vegetation', gridX: 59.00, gridY: 5.00, size: 1.2958025907717483, variant: 3 },
            { type: 'vegetation', gridX: 56.00, gridY: 1.00, size: 2.4062430052552766, variant: 0 },
            { type: 'vegetation', gridX: 54.00, gridY: 32.00, size: 2.5808329719906147, variant: 2 },
            { type: 'vegetation', gridX: 52.00, gridY: 29.00, size: 2.8490142999080152, variant: 2 },
            { type: 'vegetation', gridX: 58.00, gridY: 32.75, size: 1.5072240472068745, variant: 0 },
            { type: 'vegetation', gridX: 56.00, gridY: 28.00, size: 2.922535248264092, variant: 0 },
            { type: 'vegetation', gridX: 58.00, gridY: 26.00, size: 2.1478200979473905, variant: 0 },
            { type: 'vegetation', gridX: 59.00, gridY: 29.00, size: 1.484260831250077, variant: 1 },
            { type: 'vegetation', gridX: 55.00, gridY: 32.00, size: 2.838000546555805, variant: 3 },
            { type: 'vegetation', gridX: 59.00, gridY: 29.00, size: 2.953353394557967, variant: 1 },
            { type: 'vegetation', gridX: 53.00, gridY: 27.00, size: 2.073093279648676, variant: 2 },
            { type: 'vegetation', gridX: 5.00, gridY: 32.00, size: 1.7747345662358531, variant: 1 },
            { type: 'vegetation', gridX: 1.00, gridY: 30.00, size: 2.1969795566972303, variant: 3 },
            { type: 'vegetation', gridX: 6.00, gridY: 32.00, size: 1.6363513158826695, variant: 2 },
            { type: 'vegetation', gridX: 8.00, gridY: 28.00, size: 2.347225891938973, variant: 2 },
            { type: 'vegetation', gridX: 3.00, gridY: 26.00, size: 1.1274562112933695, variant: 0 },
            { type: 'vegetation', gridX: 6.00, gridY: 28.00, size: 2.3938780046537556, variant: 0 },
            { type: 'vegetation', gridX: 5.00, gridY: 32.00, size: 1.967966251827547, variant: 0 },
            { type: 'vegetation', gridX: 16.00, gridY: 32.75, size: 2.582757601941053, variant: 0 },
            { type: 'vegetation', gridX: 14.00, gridY: 32.75, size: 2.2291101173818504, variant: 2 },
            { type: 'vegetation', gridX: 17.00, gridY: 32.00, size: 2.289711328084796, variant: 2 },
            { type: 'vegetation', gridX: 13.00, gridY: 32.00, size: 2.7827212985593492, variant: 3 },
            { type: 'vegetation', gridX: 13.00, gridY: 26.00, size: 2.7066669653289934, variant: 1 },
            { type: 'vegetation', gridX: 25.00, gridY: 8.00, size: 1.6051355165723107, variant: 2 },
            { type: 'vegetation', gridX: 23.00, gridY: 7.00, size: 1.3842536857270853, variant: 0 },
            { type: 'vegetation', gridX: 24.00, gridY: 1.00, size: 1.15013840529453, variant: 1 },
            { type: 'vegetation', gridX: 23.00, gridY: 1.00, size: 2.307749951927642, variant: 3 },
            { type: 'vegetation', gridX: 23.00, gridY: 7.00, size: 1.8619088256903358, variant: 2 },
            { type: 'vegetation', gridX: 25.00, gridY: 1.00, size: 1.7552410174009283, variant: 1 },
            { type: 'vegetation', gridX: 21.00, gridY: 2.00, size: 2.344465585758, variant: 1 },
            { type: 'vegetation', gridX: 24.00, gridY: 2.00, size: 1.1267068233670345, variant: 1 },
            { type: 'vegetation', gridX: 23.00, gridY: 5.00, size: 1.5479311552178647, variant: 1 },
            { type: 'vegetation', gridX: 46.00, gridY: 32.00, size: 1.2061977506836854, variant: 3 },
            { type: 'vegetation', gridX: 51.00, gridY: 32.75, size: 1.5927135860555417, variant: 2 },
            { type: 'vegetation', gridX: 51.00, gridY: 32.75, size: 2.404693612939509, variant: 1 },
            { type: 'vegetation', gridX: 47.00, gridY: 28.00, size: 1.430244918922681, variant: 1 },
            { type: 'vegetation', gridX: 44.00, gridY: 32.75, size: 1.6333377012449282, variant: 2 },
            { type: 'vegetation', gridX: 46.00, gridY: 31.00, size: 2.0474312768267624, variant: 1 },
            { type: 'vegetation', gridX: 51.00, gridY: 29.00, size: 2.886454620203522, variant: 1 },
            { type: 'vegetation', gridX: 53.00, gridY: 5.00, size: 2.2833815797056216, variant: 3 },
            { type: 'vegetation', gridX: 51.00, gridY: 0.00, size: 1.4661937040621844, variant: 2 },
            { type: 'vegetation', gridX: 53.00, gridY: 5.00, size: 2.146156933619194, variant: 0 },
            { type: 'vegetation', gridX: 46.00, gridY: 3.00, size: 2.0239718171832086, variant: 1 },
            { type: 'vegetation', gridX: 53.00, gridY: 0.00, size: 2.3304189736969807, variant: 2 },
            { type: 'vegetation', gridX: 53.00, gridY: 2.00, size: 1.0447654097724335, variant: 0 }
        ];
    }

    createMeanderingPath(canvasWidth, canvasHeight) {
        const gridWidth = this.gridWidth || 60;
        const gridHeight = this.gridHeight || 33.75;

        const pathInGridCoords = [
            { gridX: 0.00, gridY: 17.00 },
            { gridX: 26.00, gridY: 17.00 },
            { gridX: 26.00, gridY: 28.00 },
            { gridX: 39.00, gridY: 28.00 },
            { gridX: 39.00, gridY: 5.00 },
            { gridX: 46.00, gridY: 5.00 },
            { gridX: 46.00, gridY: 18.00 },
            { gridX: 54.00, gridY: 18.00 }
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
            enemyHealth_multiplier: 1.5, 
            speedMultiplier: 1, 
            spawnInterval: 1.14, 
            pattern: [{ type: 'villager', count: 10 }, { type: 'villager', count: 12, healthMultiplier: 1.5 }, { type: 'basic', count: 8, healthMultiplier: 1.3 }] 
        }
        // Wave 2
        , { 
            enemyHealth_multiplier: 1.6, 
            speedMultiplier: 1, 
            spawnInterval: 0.86, 
            pattern: [{ type: 'frog', count: 9 }, { type: 'frog', count: 10, healthMultiplier: 2, speedMultiplier: 1.2 }, { type: 'frog', count: 11, healthMultiplier: 1 }] 
        }
        // Wave 3
        , { 
            enemyHealth_multiplier: 2, 
            speedMultiplier: 1, 
            spawnInterval: 0.96, 
            pattern: [{ type: 'villager', count: 10, healthMultiplier: 1.8, speedMultiplier: 0.6 }, { type: 'basic', count: 12, healthMultiplier: 1.8 }, { type: 'archer', count: 5, speedMultiplier: 1.5 }] 
        }
        // Wave 4
        , { 
            enemyHealth_multiplier: 2.4, 
            speedMultiplier: 1, 
            spawnInterval: 0.68, 
            pattern: [{ type: 'beefyenemy', count: 9 }] 
        }
        // Wave 5
        , { 
            enemyHealth_multiplier: 2.4, 
            speedMultiplier: 1, 
            spawnInterval: 0.78, 
            pattern: [{ type: 'archer', count: 9, healthMultiplier: 2.5, speedMultiplier: 1.1 }, { type: 'frog', count: 12, healthMultiplier: 1.8 }, { type: 'shieldknight', count: 4, healthMultiplier: 2 }, { type: 'archer', count: 5, healthMultiplier: 3, speedMultiplier: 1.5 }] 
        }
        // Wave 6
        , { 
            enemyHealth_multiplier: 7.2, 
            speedMultiplier: 1, 
            spawnInterval: 0.88, 
            pattern: [{ type: 'mage', count: 3, healthMultiplier: 2 }, { type: 'frog', count: 13 }] 
        }
        // Wave 7
        , { 
            enemyHealth_multiplier: 6, 
            speedMultiplier: 1.2, 
            spawnInterval: 0.58, 
            pattern: [{ type: 'villager', count: 13 }, { type: 'basic', count: 11 }, { type: 'frog', count: 10, healthMultiplier: 2, speedMultiplier: 1.3 }] 
        }
        // Wave 8
        , { 
            enemyHealth_multiplier: 6, 
            speedMultiplier: 1.2, 
            spawnInterval: 0.78, 
            pattern: [{ type: 'basic', count: 12 }, { type: 'villager', count: 10 }, { type: 'archer', count: 12, speedMultiplier: 1.2 }] 
        }
        // Wave 9
        , { 
            enemyHealth_multiplier: 6, 
            speedMultiplier: 1, 
            spawnInterval: 1.95, 
            pattern: [{ type: 'beefyenemy', count: 6 }, { type: 'knight', count: 4 }] 
        }
        // Wave 10
        , { 
            enemyHealth_multiplier: 4.8, 
            speedMultiplier: 1, 
            spawnInterval: 4.7, 
            pattern: [{ type: 'firefrog', count: 3 }, { type: 'airfrog', count: 3 }, { type: 'firefrog', count: 3 }, { type: 'airfrog', count: 3 }] 
        }
        // Wave 11
        , { 
            enemyHealth_multiplier: 8.75, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'beefyenemy', count: 10, healthMultiplier: 3 }, { type: 'frog', count: 15 }, { type: 'mage', count: 4, healthMultiplier: 2 }, { type: 'basic', count: 12 }, { type: 'villager', count: 11 }, { type: 'shieldknight', count: 7 }, { type: 'archer', count: 10, healthMultiplier: 3, speedMultiplier: 2 }] 
        }
        // Wave 12
        , { 
            enemyHealth_multiplier: 3.24, 
            speedMultiplier: 1, 
            spawnInterval: 0.82, 
            pattern: [{ type: 'frog', count: 10 }, { type: 'frog', count: 11, healthMultiplier: 2, speedMultiplier: 1.2 }, { type: 'frog', count: 12, healthMultiplier: 3 }] 
        }
        // Wave 13
        , { 
            enemyHealth_multiplier: 9.72, 
            speedMultiplier: 0.9, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'knight', count: 5, healthMultiplier: 2.5 }, { type: 'shieldknight', count: 8, healthMultiplier: 2 }, { type: 'frog', count: 13, speedMultiplier: 1.3 }, { type: 'archer', count: 12, speedMultiplier: 1.4 }, { type: 'beefyenemy', count: 9 }, { type: 'villager', count: 9 }] 
        }
        // Wave 14
        , { 
            enemyHealth_multiplier: 3.24, 
            speedMultiplier: 1, 
            spawnInterval: 0.66, 
            pattern: [{ type: 'beefyenemy', count: 10 }, { type: 'frog', count: 3 }] 
        }
        // Wave 15
        , { 
            enemyHealth_multiplier: 3.24, 
            speedMultiplier: 1, 
            spawnInterval: 0.76, 
            pattern: [{ type: 'archer', count: 10, healthMultiplier: 2.5, speedMultiplier: 1.1 }, { type: 'frog', count: 14, healthMultiplier: 1.8 }, { type: 'shieldknight', count: 5, healthMultiplier: 2 }, { type: 'archer', count: 6, healthMultiplier: 3, speedMultiplier: 1.5 }] 
        }
        // Wave 16
        , { 
            enemyHealth_multiplier: 12.96, 
            speedMultiplier: 0.8, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'shieldknight', count: 10 }, { type: 'frog', count: 3 }] 
        }
        // Wave 17
        , { 
            enemyHealth_multiplier: 16.2, 
            speedMultiplier: 1, 
            spawnInterval: 11.9, 
            pattern: [{ type: 'knight', count: 6 }, { type: 'frog', count: 4 }] 
        }
        // Wave 18
        , { 
            enemyHealth_multiplier: 3.24, 
            speedMultiplier: 1, 
            spawnInterval: 1, 
            pattern: [{ type: 'knight', count: 4, healthMultiplier: 3 }, { type: 'shieldknight', count: 5, healthMultiplier: 2 }, { type: 'mage', count: 4, healthMultiplier: 2 }, { type: 'shieldknight', count: 4, healthMultiplier: 4 }, { type: 'frog', count: 4 }] 
        }
        // Wave 19
        , { 
            enemyHealth_multiplier: 16.2, 
            speedMultiplier: 1, 
            spawnInterval: 1, 
            pattern: [{ type: 'mage', count: 7, speedMultiplier: 0.6 }, { type: 'frog', count: 12, speedMultiplier: 1.2 }] 
        }
        // Wave 20
        , { 
            enemyHealth_multiplier: 6.48, 
            speedMultiplier: 1, 
            spawnInterval: 4.4, 
            pattern: [{ type: 'waterfrog', count: 4 }, { type: 'earthfrog', count: 4 }, { type: 'waterfrog', count: 4 }, { type: 'earthfrog', count: 4 }] 
        }
        // Wave 21
        , { 
            enemyHealth_multiplier: 18.77, 
            speedMultiplier: 1.1, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'shieldknight', count: 7, healthMultiplier: 3 }, { type: 'mage', count: 5 }, { type: 'villager', count: 16 }, { type: 'shieldknight', count: 6, healthMultiplier: 4 }, { type: 'beefyenemy', count: 14, healthMultiplier: 2 }, { type: 'mage', count: 5 }, { type: 'frog', count: 24 }, { type: 'archer', count: 15, healthMultiplier: 5, speedMultiplier: 1.5 }, { type: 'shieldknight', count: 5, healthMultiplier: 6 }] 
        }
        // Wave 22
        , { 
            enemyHealth_multiplier: 4.08, 
            speedMultiplier: 1, 
            spawnInterval: 0.78, 
            pattern: [{ type: 'frog', count: 15 }, { type: 'frog', count: 16, healthMultiplier: 2, speedMultiplier: 1.2 }, { type: 'frog', count: 18, healthMultiplier: 3 }] 
        }
        // Wave 23
        , { 
            enemyHealth_multiplier: 20.4, 
            speedMultiplier: 1.3, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'archer', count: 18 }, { type: 'villager', count: 21 }, { type: 'basic', count: 19 }, { type: 'frog', count: 4 }] 
        }
        // Wave 24
        , { 
            enemyHealth_multiplier: 22.44, 
            speedMultiplier: 1.7, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'archer', count: 16 }, { type: 'frog', count: 4 }] 
        }
        // Wave 25
        , { 
            enemyHealth_multiplier: 28.56, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'mage', count: 1 }, { type: 'waterfrog', count: 1 }] 
        }
        // Wave 26
        , { 
            enemyHealth_multiplier: 11.02, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'beefyenemy', count: 11, healthMultiplier: 3 }, { type: 'frog', count: 24 }, { type: 'mage', count: 5, healthMultiplier: 2 }, { type: 'basic', count: 13 }, { type: 'villager', count: 12 }, { type: 'shieldknight', count: 8 }, { type: 'archer', count: 11, healthMultiplier: 3, speedMultiplier: 2 }] 
        }
        // Wave 27
        , { 
            enemyHealth_multiplier: 28.56, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'waterfrog', count: 1 }, { type: 'earthfrog', count: 1 }, { type: 'firefrog', count: 1 }] 
        }
        // Wave 28
        , { 
            enemyHealth_multiplier: 12.24, 
            speedMultiplier: 0.9, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'knight', count: 6, healthMultiplier: 2.5 }, { type: 'shieldknight', count: 9, healthMultiplier: 2 }, { type: 'frog', count: 22, speedMultiplier: 1.3 }, { type: 'archer', count: 13, speedMultiplier: 1.4 }, { type: 'beefyenemy', count: 10 }, { type: 'villager', count: 10 }] 
        }
        // Wave 29
        , { 
            enemyHealth_multiplier: 57.12, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'firefrog', count: 1 }] 
        }
        // Wave 30
        , { 
            enemyHealth_multiplier: 8.16, 
            speedMultiplier: 1, 
            spawnInterval: 4.1, 
            pattern: [{ type: 'firefrog', count: 5 }, { type: 'waterfrog', count: 5 }, { type: 'firefrog', count: 5 }, { type: 'waterfrog', count: 5 }] 
        }
        // Wave 31
        , { 
            enemyHealth_multiplier: 13.28, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'beefyenemy', count: 12, healthMultiplier: 3 }, { type: 'frog', count: 28 }, { type: 'mage', count: 6, healthMultiplier: 2 }, { type: 'basic', count: 14 }, { type: 'villager', count: 13 }, { type: 'shieldknight', count: 9 }, { type: 'archer', count: 12, healthMultiplier: 3, speedMultiplier: 2 }] 
        }
        // Wave 32
        , { 
            enemyHealth_multiplier: 34.44, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'mage', count: 1 }, { type: 'airfrog', count: 1 }] 
        }
        // Wave 33
        , { 
            enemyHealth_multiplier: 24.6, 
            speedMultiplier: 1.4, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'archer', count: 19 }, { type: 'villager', count: 22 }, { type: 'basic', count: 20 }, { type: 'frog', count: 5 }] 
        }
        // Wave 34
        , { 
            enemyHealth_multiplier: 27.06, 
            speedMultiplier: 1.7, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'archer', count: 17 }, { type: 'firefrog', count: 4 }] 
        }
        // Wave 35
        , { 
            enemyHealth_multiplier: 4.92, 
            speedMultiplier: 1, 
            spawnInterval: 0.72, 
            pattern: [{ type: 'archer', count: 12, healthMultiplier: 2.5, speedMultiplier: 1.1 }, { type: 'frog', count: 27, healthMultiplier: 1.8 }, { type: 'shieldknight', count: 7, healthMultiplier: 2 }, { type: 'archer', count: 8, healthMultiplier: 3, speedMultiplier: 1.5 }] 
        }
        // Wave 36
        , { 
            enemyHealth_multiplier: 22.63, 
            speedMultiplier: 1.1, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'shieldknight', count: 8, healthMultiplier: 3 }, { type: 'mage', count: 6 }, { type: 'villager', count: 17 }, { type: 'shieldknight', count: 7, healthMultiplier: 4 }, { type: 'beefyenemy', count: 15, healthMultiplier: 2 }, { type: 'mage', count: 6 }, { type: 'frog', count: 35 }, { type: 'archer', count: 16, healthMultiplier: 5, speedMultiplier: 1.5 }, { type: 'shieldknight', count: 6, healthMultiplier: 6 }] 
        }
        // Wave 37
        , { 
            enemyHealth_multiplier: 68.88, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'earthfrog', count: 1 }] 
        }
        // Wave 38
        , { 
            enemyHealth_multiplier: 14.76, 
            speedMultiplier: 0.9, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'knight', count: 7, healthMultiplier: 2.5 }, { type: 'shieldknight', count: 10, healthMultiplier: 2 }, { type: 'frog', count: 29, speedMultiplier: 1.3 }, { type: 'archer', count: 14, speedMultiplier: 1.4 }, { type: 'beefyenemy', count: 11 }, { type: 'villager', count: 11 }] 
        }
        // Wave 39
        , { 
            enemyHealth_multiplier: 34.44, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'waterfrog', count: 1 }, { type: 'airfrog', count: 1 }, { type: 'earthfrog', count: 1 }] 
        }
        // Wave 40
        , { 
            enemyHealth_multiplier: 9.84, 
            speedMultiplier: 1, 
            spawnInterval: 3.8, 
            pattern: [{ type: 'airfrog', count: 6 }, { type: 'earthfrog', count: 6 }, { type: 'airfrog', count: 6 }, { type: 'earthfrog', count: 6 }] 
        }
        // Wave 41
        , { 
            enemyHealth_multiplier: 26.5, 
            speedMultiplier: 1.1, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'shieldknight', count: 9, healthMultiplier: 3 }, { type: 'mage', count: 7 }, { type: 'villager', count: 18 }, { type: 'shieldknight', count: 8, healthMultiplier: 4 }, { type: 'beefyenemy', count: 16, healthMultiplier: 2 }, { type: 'mage', count: 7 }, { type: 'frog', count: 40 }, { type: 'archer', count: 17, healthMultiplier: 5, speedMultiplier: 1.5 }, { type: 'shieldknight', count: 7, healthMultiplier: 6 }] 
        }
        // Wave 42
        , { 
            enemyHealth_multiplier: 15.55, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'beefyenemy', count: 13, healthMultiplier: 3 }, { type: 'frog', count: 37 }, { type: 'mage', count: 7, healthMultiplier: 2 }, { type: 'basic', count: 15 }, { type: 'villager', count: 14 }, { type: 'shieldknight', count: 10 }, { type: 'archer', count: 13, healthMultiplier: 3, speedMultiplier: 2 }] 
        }
        // Wave 43
        , { 
            enemyHealth_multiplier: 80.64, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'waterfrog', count: 1 }] 
        }
        // Wave 44
        , { 
            enemyHealth_multiplier: 31.68, 
            speedMultiplier: 1.8, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'archer', count: 18 }, { type: 'firefrog', count: 5 }] 
        }
        // Wave 45
        , { 
            enemyHealth_multiplier: 5.76, 
            speedMultiplier: 1, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'archer', count: 13, healthMultiplier: 2.5, speedMultiplier: 1.1 }, { type: 'frog', count: 34, healthMultiplier: 1.8 }, { type: 'shieldknight', count: 8, healthMultiplier: 2 }, { type: 'archer', count: 9, healthMultiplier: 3, speedMultiplier: 1.5 }] 
        }
        // Wave 46
        , { 
            enemyHealth_multiplier: 17.28, 
            speedMultiplier: 0.9, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'knight', count: 8, healthMultiplier: 2.5 }, { type: 'shieldknight', count: 11, healthMultiplier: 2 }, { type: 'frog', count: 35, speedMultiplier: 1.3 }, { type: 'archer', count: 15, speedMultiplier: 1.4 }, { type: 'beefyenemy', count: 12 }, { type: 'villager', count: 12 }] 
        }
        // Wave 47
        , { 
            enemyHealth_multiplier: 23.04, 
            speedMultiplier: 0.8, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'shieldknight', count: 13 }, { type: 'waterfrog', count: 5 }] 
        }
        // Wave 48
        , { 
            enemyHealth_multiplier: 40.32, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'firefrog', count: 1 }, { type: 'waterfrog', count: 1 }, { type: 'earthfrog', count: 1 }, { type: 'airfrog', count: 1 }] 
        }
        // Wave 49
        , { 
            enemyHealth_multiplier: 24.19, 
            speedMultiplier: 1.2, 
            spawnInterval: 0.85, 
            pattern: [{ type: 'knight', count: 8, healthMultiplier: 3 }, { type: 'archer', count: 18, speedMultiplier: 1.3 }, { type: 'basic', count: 16 }, { type: 'beefyenemy', count: 14, healthMultiplier: 2.5 }, { type: 'mage', count: 8 }, { type: 'frog', count: 46, healthMultiplier: 1.5 }, { type: 'shieldknight', count: 9, healthMultiplier: 4 }] 
        }
        // Wave 50
        , { 
            enemyHealth_multiplier: 11.52, 
            speedMultiplier: 1, 
            spawnInterval: 3.5, 
            pattern: [{ type: 'firefrog', count: 7 }, { type: 'earthfrog', count: 7 }, { type: 'firefrog', count: 7 }, { type: 'earthfrog', count: 7 }] 
        }
        // Wave 51
        , { 
            enemyHealth_multiplier: 17.82, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'beefyenemy', count: 15, healthMultiplier: 3 }, { type: 'frog', count: 44 }, { type: 'mage', count: 9, healthMultiplier: 2 }, { type: 'basic', count: 17 }, { type: 'villager', count: 16 }, { type: 'shieldknight', count: 12 }, { type: 'archer', count: 15, healthMultiplier: 3, speedMultiplier: 2 }] 
        }
        // Wave 52
        , { 
            enemyHealth_multiplier: 30.36, 
            speedMultiplier: 1.1, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'shieldknight', count: 11, healthMultiplier: 3 }, { type: 'mage', count: 9 }, { type: 'villager', count: 20 }, { type: 'shieldknight', count: 10, healthMultiplier: 4 }, { type: 'beefyenemy', count: 18, healthMultiplier: 2 }, { type: 'mage', count: 9 }, { type: 'frog', count: 48 }, { type: 'archer', count: 19, healthMultiplier: 5, speedMultiplier: 1.5 }, { type: 'shieldknight', count: 9, healthMultiplier: 6 }] 
        }
        // Wave 53
        , { 
            enemyHealth_multiplier: 33, 
            speedMultiplier: 1.4, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'archer', count: 22 }, { type: 'villager', count: 25 }, { type: 'basic', count: 23 }, { type: 'firefrog', count: 6 }] 
        }
        // Wave 54
        , { 
            enemyHealth_multiplier: 90, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'airfrog', count: 1 }] 
        }
        ];

        if (wave > 0 && wave <= waveConfigs.length) {
            return waveConfigs[wave - 1];
        }
        
        return null;
    }
}