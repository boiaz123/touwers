import { LevelBase } from '../LevelBase.js';

export class SpaceLevel1 extends LevelBase {
    static levelMetadata = {
        name: 'Alien Outpost',
        difficulty: 'Nightmare',
        order: 1,
        campaign: 'space'
    };

    constructor() {
        super();
        // Derive instance properties from static metadata
        this.levelName = SpaceLevel1.levelMetadata.name;
        this.levelNumber = SpaceLevel1.levelMetadata.order;
        this.difficulty = SpaceLevel1.levelMetadata.difficulty;
        this.campaign = SpaceLevel1.levelMetadata.campaign;
        this.maxWaves = 40;

        // Set terrain elements (prevent tower placement on these areas)
        this.terrainElements = [
            { type: 'vegetation', gridX: 53.00, gridY: 2.00, size: 2.5916597712521936, variant: 1 },
            { type: 'vegetation', gridX: 54.00, gridY: 10.00, size: 2.90937223621729, variant: 0 },
            { type: 'vegetation', gridX: 51.00, gridY: 5.00, size: 1.9213324762003112, variant: 2 },
            { type: 'vegetation', gridX: 59.00, gridY: 7.00, size: 3.2302691692019723, variant: 1 },
            { type: 'vegetation', gridX: 56.00, gridY: 8.00, size: 4.7915671736822985, variant: 0 },
            { type: 'vegetation', gridX: 48.00, gridY: 4.00, size: 3.0753337039532895, variant: 3 },
            { type: 'vegetation', gridX: 47.00, gridY: 8.00, size: 3.214272600772995, variant: 0 },
            { type: 'vegetation', gridX: 46.00, gridY: 8.00, size: 3.2856955400727035, variant: 1 },
            { type: 'vegetation', gridX: 46.00, gridY: 2.00, size: 2.379664278333972, variant: 3 },
            { type: 'vegetation', gridX: 41.00, gridY: 3.00, size: 2.8220626571001004, variant: 3 },
            { type: 'vegetation', gridX: 43.00, gridY: 5.00, size: 2.15704211874728, variant: 0 },
            { type: 'vegetation', gridX: 42.00, gridY: 11.00, size: 2.182791346479783, variant: 0 },
            { type: 'vegetation', gridX: 44.00, gridY: 3.00, size: 3.0194409240796647, variant: 3 },
            { type: 'vegetation', gridX: 47.00, gridY: 11.00, size: 3.611584233704847, variant: 2 },
            { type: 'vegetation', gridX: 44.00, gridY: 6.00, size: 4.2551720611798345, variant: 0 },
            { type: 'vegetation', gridX: 41.00, gridY: 3.00, size: 3.785944328638083, variant: 0 },
            { type: 'vegetation', gridX: 31.00, gridY: 6.00, size: 2.2480235027755087, variant: 3 },
            { type: 'vegetation', gridX: 33.00, gridY: 12.00, size: 4.206996772565187, variant: 3 },
            { type: 'vegetation', gridX: 31.00, gridY: 7.00, size: 1.5607760610268748, variant: 2 },
            { type: 'vegetation', gridX: 37.00, gridY: 9.00, size: 3.6334956128595532, variant: 0 },
            { type: 'vegetation', gridX: 38.00, gridY: 5.00, size: 3.114598755650544, variant: 1 },
            { type: 'vegetation', gridX: 33.00, gridY: 5.00, size: 4.91543047775059, variant: 1 },
            { type: 'vegetation', gridX: 19.00, gridY: 9.00, size: 2.786985982429597, variant: 2 },
            { type: 'vegetation', gridX: 20.00, gridY: 6.00, size: 3.1893689709059263, variant: 0 },
            { type: 'vegetation', gridX: 18.00, gridY: 7.00, size: 3.4577584636253573, variant: 2 },
            { type: 'vegetation', gridX: 24.00, gridY: 3.00, size: 4.6498058340516835, variant: 1 },
            { type: 'vegetation', gridX: 21.00, gridY: 10.00, size: 4.438461631189871, variant: 2 },
            { type: 'vegetation', gridX: 18.00, gridY: 4.00, size: 1.6179034711230265, variant: 2 },
            { type: 'vegetation', gridX: 10.00, gridY: 4.00, size: 2.1633191249360024, variant: 3 },
            { type: 'vegetation', gridX: 15.00, gridY: 3.00, size: 4.984438545153507, variant: 3 },
            { type: 'vegetation', gridX: 16.00, gridY: 3.00, size: 1.6275171632990935, variant: 0 },
            { type: 'vegetation', gridX: 14.00, gridY: 4.00, size: 4.232605146811294, variant: 2 },
            { type: 'vegetation', gridX: 8.00, gridY: 5.00, size: 1.6415121318600812, variant: 0 },
            { type: 'vegetation', gridX: 3.00, gridY: 3.00, size: 1.552662521098826, variant: 0 },
            { type: 'vegetation', gridX: 4.00, gridY: 7.00, size: 2.5739942959590802, variant: 0 },
            { type: 'vegetation', gridX: 6.00, gridY: 6.00, size: 3.0000658569500116, variant: 2 },
            { type: 'vegetation', gridX: 4.00, gridY: 2.00, size: 3.221923124249357, variant: 1 },
            { type: 'vegetation', gridX: 7.00, gridY: 5.00, size: 2.4327047180071375, variant: 0 },
            { type: 'vegetation', gridX: 3.00, gridY: 8.00, size: 3.327344477064853, variant: 2 },
            { type: 'vegetation', gridX: 5.00, gridY: 30.00, size: 1.714912078353346, variant: 2 },
            { type: 'vegetation', gridX: 5.00, gridY: 31.00, size: 1.889605937944342, variant: 0 },
            { type: 'vegetation', gridX: 5.00, gridY: 32.00, size: 2.5937094352499086, variant: 1 },
            { type: 'vegetation', gridX: 6.00, gridY: 29.00, size: 2.2109550326012934, variant: 0 },
            { type: 'vegetation', gridX: 5.00, gridY: 29.00, size: 3.981191410804672, variant: 1 },
            { type: 'vegetation', gridX: 5.00, gridY: 31.00, size: 2.527692428212352, variant: 2 },
            { type: 'vegetation', gridX: 2.00, gridY: 27.00, size: 2.3385306490506474, variant: 2 },
            { type: 'vegetation', gridX: 12.00, gridY: 32.00, size: 3.490769768999364, variant: 2 },
            { type: 'vegetation', gridX: 11.00, gridY: 28.00, size: 3.4801660082826684, variant: 1 },
            { type: 'vegetation', gridX: 14.00, gridY: 31.00, size: 2.4572612408973065, variant: 3 },
            { type: 'vegetation', gridX: 8.00, gridY: 30.00, size: 4.0286210386318215, variant: 3 },
            { type: 'vegetation', gridX: 19.00, gridY: 31.00, size: 2.696747257702989, variant: 0 },
            { type: 'vegetation', gridX: 16.00, gridY: 31.00, size: 1.8273915506976341, variant: 1 },
            { type: 'vegetation', gridX: 21.00, gridY: 32.75, size: 2.9679777253504023, variant: 1 },
            { type: 'vegetation', gridX: 17.00, gridY: 31.00, size: 3.570425194497099, variant: 0 },
            { type: 'vegetation', gridX: 26.00, gridY: 32.75, size: 4.135363521146084, variant: 1 },
            { type: 'vegetation', gridX: 56.00, gridY: 15.00, size: 4.4950838358880185, variant: 1 },
            { type: 'vegetation', gridX: 58.00, gridY: 15.00, size: 4.944355298690444, variant: 3 },
            { type: 'vegetation', gridX: 52.00, gridY: 15.00, size: 2.6585533713449823, variant: 3 },
            { type: 'vegetation', gridX: 53.00, gridY: 17.00, size: 2.0753342920177045, variant: 0 },
            { type: 'vegetation', gridX: 54.00, gridY: 13.00, size: 4.71645363129006, variant: 3 },
            { type: 'vegetation', gridX: 55.00, gridY: 17.00, size: 1.5514671908264426, variant: 1 },
            { type: 'vegetation', gridX: 58.00, gridY: 15.00, size: 3.01528047930798, variant: 2 },
            { type: 'vegetation', gridX: 4.00, gridY: 24.00, size: 3.63182302119858, variant: 0 },
            { type: 'vegetation', gridX: 6.00, gridY: 23.00, size: 2.203406385085181, variant: 3 },
            { type: 'vegetation', gridX: 3.00, gridY: 22.00, size: 3.207975939033542, variant: 0 },
            { type: 'vegetation', gridX: 1.00, gridY: 21.00, size: 4.662363331201977, variant: 0 },
            { type: 'rock', gridX: 27.00, gridY: 7.00, size: 2, variant: 3 },
            { type: 'rock', gridX: 46.00, gridY: 14.00, size: 2, variant: 3 },
            { type: 'rock', gridX: 13.00, gridY: 6.00, size: 2, variant: 3 },
            { type: 'rock', gridX: 2.00, gridY: 4.00, size: 2, variant: 3 },
            { type: 'rock', gridX: 6.00, gridY: 26.00, size: 2, variant: 3 },
            { type: 'rock', gridX: 18.00, gridY: 32.00, size: 2, variant: 3 },
            { type: 'rock', gridX: 58.00, gridY: 19.00, size: 2, variant: 3 },
            { type: 'rock', gridX: 58.00, gridY: 32.00, size: 2, variant: 3 },
            { type: 'rock', gridX: 41.00, gridY: 33.00, size: 2, variant: 3 },
            { type: 'rock', gridX: 24.00, gridY: 31.00, size: 3, variant: 3 },
            { type: 'rock', gridX: 2.00, gridY: 24.00, size: 3, variant: 3 },
            { type: 'rock', gridX: 7.00, gridY: 2.00, size: 3, variant: 3 },
            { type: 'rock', gridX: 52.00, gridY: 9.00, size: 3, variant: 3 },
            { type: 'rock', gridX: 28.00, gridY: 2.00, size: 3, variant: 3 }
        ];
    }

    createMeanderingPath(canvasWidth, canvasHeight) {
        const gridWidth = this.gridWidth || 60;
        const gridHeight = this.gridHeight || 33.75;

        const pathInGridCoords = [
            { gridX: 0.00, gridY: 11.00 },
            { gridX: 8.00, gridY: 11.00 },
            { gridX: 18.00, gridY: 23.00 },
            { gridX: 25.00, gridY: 17.00 },
            { gridX: 33.00, gridY: 26.00 },
            { gridX: 38.00, gridY: 21.00 },
            { gridX: 48.00, gridY: 30.00 },
            { gridX: 52.00, gridY: 30.00 },
            { gridX: 52.00, gridY: 24.00 }
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
            spawnInterval: 1.14, 
            pattern: [{ type: 'villager', count: 8 }, { type: 'villager', count: 10, healthMultiplier: 1.5 }, { type: 'basic', count: 6, healthMultiplier: 1.3 }] 
        }
        // Wave 2
        , { 
            enemyHealth_multiplier: 1, 
            speedMultiplier: 1, 
            spawnInterval: 0.86, 
            pattern: [{ type: 'frog', count: 7 }, { type: 'frog', count: 8, healthMultiplier: 2, speedMultiplier: 1.2 }, { type: 'frog', count: 9, healthMultiplier: 3 }] 
        }
        // Wave 3
        , { 
            enemyHealth_multiplier: 1.4, 
            speedMultiplier: 1, 
            spawnInterval: 0.96, 
            pattern: [{ type: 'villager', count: 8, healthMultiplier: 1.8, speedMultiplier: 0.6 }, { type: 'basic', count: 10, healthMultiplier: 1.8 }, { type: 'archer', count: 3, speedMultiplier: 1.5 }] 
        }
        // Wave 4
        , { 
            enemyHealth_multiplier: 1, 
            speedMultiplier: 1, 
            spawnInterval: 0.68, 
            pattern: [{ type: 'beefyenemy', count: 7 }] 
        }
        // Wave 5
        , { 
            enemyHealth_multiplier: 1, 
            speedMultiplier: 1, 
            spawnInterval: 0.78, 
            pattern: [{ type: 'archer', count: 7, healthMultiplier: 2.5, speedMultiplier: 1.1 }, { type: 'frog', count: 10, healthMultiplier: 1.8 }, { type: 'shieldknight', count: 2, healthMultiplier: 2 }, { type: 'archer', count: 3, healthMultiplier: 3, speedMultiplier: 1.5 }] 
        }
        // Wave 6
        , { 
            enemyHealth_multiplier: 3, 
            speedMultiplier: 1, 
            spawnInterval: 0.88, 
            pattern: [{ type: 'mage', count: 1, healthMultiplier: 2 }, { type: 'frog', count: 11 }] 
        }
        // Wave 7
        , { 
            enemyHealth_multiplier: 2.5, 
            speedMultiplier: 1.2, 
            spawnInterval: 0.58, 
            pattern: [{ type: 'villager', count: 11 }, { type: 'basic', count: 9 }, { type: 'frog', count: 8, healthMultiplier: 2, speedMultiplier: 1.3 }] 
        }
        // Wave 8
        , { 
            enemyHealth_multiplier: 2.5, 
            speedMultiplier: 1.2, 
            spawnInterval: 0.78, 
            pattern: [{ type: 'basic', count: 10 }, { type: 'villager', count: 8 }, { type: 'archer', count: 10, speedMultiplier: 1.2 }] 
        }
        // Wave 9
        , { 
            enemyHealth_multiplier: 2.5, 
            speedMultiplier: 1, 
            spawnInterval: 1.95, 
            pattern: [{ type: 'beefyenemy', count: 4 }, { type: 'knight', count: 2 }] 
        }
        // Wave 10
        , { 
            enemyHealth_multiplier: 2, 
            speedMultiplier: 1, 
            spawnInterval: 4.7, 
            pattern: [{ type: 'firefrog', count: 1 }, { type: 'airfrog', count: 1 }, { type: 'firefrog', count: 1 }, { type: 'airfrog', count: 1 }] 
        }
        // Wave 11
        , { 
            enemyHealth_multiplier: 3.65, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'beefyenemy', count: 8, healthMultiplier: 3 }, { type: 'frog', count: 13 }, { type: 'mage', count: 2, healthMultiplier: 2 }, { type: 'basic', count: 10 }, { type: 'villager', count: 9 }, { type: 'shieldknight', count: 5 }, { type: 'archer', count: 8, healthMultiplier: 3, speedMultiplier: 2 }] 
        }
        // Wave 12
        , { 
            enemyHealth_multiplier: 1.35, 
            speedMultiplier: 1, 
            spawnInterval: 0.82, 
            pattern: [{ type: 'frog', count: 8 }, { type: 'frog', count: 9, healthMultiplier: 2, speedMultiplier: 1.2 }, { type: 'frog', count: 10, healthMultiplier: 3 }] 
        }
        // Wave 13
        , { 
            enemyHealth_multiplier: 4.05, 
            speedMultiplier: 0.9, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'knight', count: 3, healthMultiplier: 2.5 }, { type: 'shieldknight', count: 6, healthMultiplier: 2 }, { type: 'frog', count: 11, speedMultiplier: 1.3 }, { type: 'archer', count: 10, speedMultiplier: 1.4 }, { type: 'beefyenemy', count: 7 }, { type: 'villager', count: 7 }] 
        }
        // Wave 14
        , { 
            enemyHealth_multiplier: 1.35, 
            speedMultiplier: 1, 
            spawnInterval: 0.66, 
            pattern: [{ type: 'beefyenemy', count: 8 }, { type: 'frog', count: 3 }] 
        }
        // Wave 15
        , { 
            enemyHealth_multiplier: 1.35, 
            speedMultiplier: 1, 
            spawnInterval: 0.76, 
            pattern: [{ type: 'archer', count: 8, healthMultiplier: 2.5, speedMultiplier: 1.1 }, { type: 'frog', count: 12, healthMultiplier: 1.8 }, { type: 'shieldknight', count: 3, healthMultiplier: 2 }, { type: 'archer', count: 4, healthMultiplier: 3, speedMultiplier: 1.5 }] 
        }
        // Wave 16
        , { 
            enemyHealth_multiplier: 5.4, 
            speedMultiplier: 0.8, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'shieldknight', count: 8 }, { type: 'frog', count: 3 }] 
        }
        // Wave 17
        , { 
            enemyHealth_multiplier: 6.75, 
            speedMultiplier: 1, 
            spawnInterval: 11.9, 
            pattern: [{ type: 'knight', count: 4 }, { type: 'frog', count: 4 }] 
        }
        // Wave 18
        , { 
            enemyHealth_multiplier: 1.35, 
            speedMultiplier: 1, 
            spawnInterval: 1, 
            pattern: [{ type: 'knight', count: 2, healthMultiplier: 3 }, { type: 'shieldknight', count: 3, healthMultiplier: 2 }, { type: 'mage', count: 2, healthMultiplier: 2 }, { type: 'shieldknight', count: 2, healthMultiplier: 4 }, { type: 'frog', count: 4 }] 
        }
        // Wave 19
        , { 
            enemyHealth_multiplier: 6.75, 
            speedMultiplier: 1, 
            spawnInterval: 1, 
            pattern: [{ type: 'mage', count: 5, speedMultiplier: 0.6 }, { type: 'frog', count: 10, speedMultiplier: 1.2 }] 
        }
        // Wave 20
        , { 
            enemyHealth_multiplier: 2.7, 
            speedMultiplier: 1, 
            spawnInterval: 4.4, 
            pattern: [{ type: 'waterfrog', count: 2 }, { type: 'earthfrog', count: 2 }, { type: 'waterfrog', count: 2 }, { type: 'earthfrog', count: 2 }] 
        }
        // Wave 21
        , { 
            enemyHealth_multiplier: 7.82, 
            speedMultiplier: 1.1, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'shieldknight', count: 5, healthMultiplier: 3 }, { type: 'mage', count: 3 }, { type: 'villager', count: 14 }, { type: 'shieldknight', count: 4, healthMultiplier: 4 }, { type: 'beefyenemy', count: 12, healthMultiplier: 2 }, { type: 'mage', count: 3 }, { type: 'frog', count: 21 }, { type: 'archer', count: 13, healthMultiplier: 5, speedMultiplier: 1.5 }, { type: 'shieldknight', count: 3, healthMultiplier: 6 }] 
        }
        // Wave 22
        , { 
            enemyHealth_multiplier: 1.7, 
            speedMultiplier: 1, 
            spawnInterval: 0.78, 
            pattern: [{ type: 'frog', count: 12 }, { type: 'frog', count: 14, healthMultiplier: 2, speedMultiplier: 1.2 }, { type: 'frog', count: 15, healthMultiplier: 3 }] 
        }
        // Wave 23
        , { 
            enemyHealth_multiplier: 8.5, 
            speedMultiplier: 1.3, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'archer', count: 16 }, { type: 'villager', count: 19 }, { type: 'basic', count: 17 }, { type: 'frog', count: 4 }] 
        }
        // Wave 24
        , { 
            enemyHealth_multiplier: 9.35, 
            speedMultiplier: 1.7, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'archer', count: 14 }, { type: 'frog', count: 4 }] 
        }
        // Wave 25
        , { 
            enemyHealth_multiplier: 11.9, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'mage', count: 1 }, { type: 'waterfrog', count: 1 }] 
        }
        // Wave 26
        , { 
            enemyHealth_multiplier: 4.59, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'beefyenemy', count: 9, healthMultiplier: 3 }, { type: 'frog', count: 21 }, { type: 'mage', count: 3, healthMultiplier: 2 }, { type: 'basic', count: 11 }, { type: 'villager', count: 10 }, { type: 'shieldknight', count: 6 }, { type: 'archer', count: 9, healthMultiplier: 3, speedMultiplier: 2 }] 
        }
        // Wave 27
        , { 
            enemyHealth_multiplier: 11.9, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'waterfrog', count: 1 }, { type: 'earthfrog', count: 1 }, { type: 'firefrog', count: 1 }] 
        }
        // Wave 28
        , { 
            enemyHealth_multiplier: 5.1, 
            speedMultiplier: 0.9, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'knight', count: 4, healthMultiplier: 2.5 }, { type: 'shieldknight', count: 7, healthMultiplier: 2 }, { type: 'frog', count: 19, speedMultiplier: 1.3 }, { type: 'archer', count: 11, speedMultiplier: 1.4 }, { type: 'beefyenemy', count: 8 }, { type: 'villager', count: 8 }] 
        }
        // Wave 29
        , { 
            enemyHealth_multiplier: 23.8, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'firefrog', count: 1 }] 
        }
        // Wave 30
        , { 
            enemyHealth_multiplier: 3.4, 
            speedMultiplier: 1, 
            spawnInterval: 4.1, 
            pattern: [{ type: 'firefrog', count: 3 }, { type: 'waterfrog', count: 3 }, { type: 'firefrog', count: 3 }, { type: 'waterfrog', count: 3 }] 
        }
        // Wave 31
        , { 
            enemyHealth_multiplier: 5.54, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'beefyenemy', count: 10, healthMultiplier: 3 }, { type: 'frog', count: 25 }, { type: 'mage', count: 4, healthMultiplier: 2 }, { type: 'basic', count: 12 }, { type: 'villager', count: 11 }, { type: 'shieldknight', count: 7 }, { type: 'archer', count: 10, healthMultiplier: 3, speedMultiplier: 2 }] 
        }
        // Wave 32
        , { 
            enemyHealth_multiplier: 14.35, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'mage', count: 1 }, { type: 'airfrog', count: 1 }] 
        }
        // Wave 33
        , { 
            enemyHealth_multiplier: 10.25, 
            speedMultiplier: 1.4, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'archer', count: 17 }, { type: 'villager', count: 20 }, { type: 'basic', count: 18 }, { type: 'frog', count: 5 }] 
        }
        // Wave 34
        , { 
            enemyHealth_multiplier: 11.27, 
            speedMultiplier: 1.7, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'archer', count: 15 }, { type: 'frog', count: 5 }] 
        }
        // Wave 35
        , { 
            enemyHealth_multiplier: 2.05, 
            speedMultiplier: 1, 
            spawnInterval: 0.72, 
            pattern: [{ type: 'archer', count: 10, healthMultiplier: 2.5, speedMultiplier: 1.1 }, { type: 'frog', count: 23, healthMultiplier: 1.8 }, { type: 'shieldknight', count: 5, healthMultiplier: 2 }, { type: 'archer', count: 6, healthMultiplier: 3, speedMultiplier: 1.5 }] 
        }
        // Wave 36
        , { 
            enemyHealth_multiplier: 9.43, 
            speedMultiplier: 1.1, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'shieldknight', count: 6, healthMultiplier: 3 }, { type: 'mage', count: 4 }, { type: 'villager', count: 15 }, { type: 'shieldknight', count: 5, healthMultiplier: 4 }, { type: 'beefyenemy', count: 13, healthMultiplier: 2 }, { type: 'mage', count: 4 }, { type: 'frog', count: 31 }, { type: 'archer', count: 14, healthMultiplier: 5, speedMultiplier: 1.5 }, { type: 'shieldknight', count: 4, healthMultiplier: 6 }] 
        }
        // Wave 37
        , { 
            enemyHealth_multiplier: 28.7, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'earthfrog', count: 1 }] 
        }
        // Wave 38
        , { 
            enemyHealth_multiplier: 6.15, 
            speedMultiplier: 0.9, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'knight', count: 5, healthMultiplier: 2.5 }, { type: 'shieldknight', count: 8, healthMultiplier: 2 }, { type: 'frog', count: 25, speedMultiplier: 1.3 }, { type: 'archer', count: 12, speedMultiplier: 1.4 }, { type: 'beefyenemy', count: 9 }, { type: 'villager', count: 9 }] 
        }
        // Wave 39
        , { 
            enemyHealth_multiplier: 14.35, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'waterfrog', count: 1 }, { type: 'airfrog', count: 1 }, { type: 'earthfrog', count: 1 }] 
        }
        // Wave 40
        , { 
            enemyHealth_multiplier: 4.1, 
            speedMultiplier: 1, 
            spawnInterval: 3.8, 
            pattern: [{ type: 'airfrog', count: 4 }, { type: 'earthfrog', count: 4 }, { type: 'airfrog', count: 4 }, { type: 'earthfrog', count: 4 }] 
        }
        ];

        if (wave > 0 && wave <= waveConfigs.length) {
            return waveConfigs[wave - 1];
        }
        
        return null;
    }
}
