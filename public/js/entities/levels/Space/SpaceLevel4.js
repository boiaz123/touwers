import { LevelBase } from '../LevelBase.js';

export class SpaceLevel4 extends LevelBase {
    static levelMetadata = {
        name: 'Vor\'Tha',
        difficulty: 'Nightmare',
        order: 4,
        campaign: 'space'
    };

    constructor() {
        super();
        // Derive instance properties from static metadata
        this.levelName = SpaceLevel4.levelMetadata.name;
        this.levelNumber = SpaceLevel4.levelMetadata.order;
        this.difficulty = SpaceLevel4.levelMetadata.difficulty;
        this.campaign = SpaceLevel4.levelMetadata.campaign;
        this.maxWaves = 48;

        // Set terrain elements (prevent tower placement on these areas)
        this.terrainElements = [
            { type: 'water', gridX: 25.00, gridY: 17.00, size: 4, waterType: 'lake' },
            { type: 'vegetation', gridX: 50.00, gridY: 2.00, size: 2.4790417724017617, variant: 3 },
            { type: 'vegetation', gridX: 47.00, gridY: 10.00, size: 1.5237091543555639, variant: 2 },
            { type: 'vegetation', gridX: 52.00, gridY: 6.00, size: 1.1699780016565586, variant: 1 },
            { type: 'vegetation', gridX: 56.00, gridY: 4.00, size: 2.960983428926236, variant: 2 },
            { type: 'vegetation', gridX: 59.00, gridY: 10.00, size: 2.4737792351114205, variant: 2 },
            { type: 'vegetation', gridX: 53.00, gridY: 4.00, size: 2.8031034815691447, variant: 1 },
            { type: 'vegetation', gridX: 51.00, gridY: 5.00, size: 1.456776846180507, variant: 0 },
            { type: 'vegetation', gridX: 58.00, gridY: 6.00, size: 1.7926772226874128, variant: 3 },
            { type: 'vegetation', gridX: 54.00, gridY: 13.00, size: 1.8528784834487808, variant: 0 },
            { type: 'vegetation', gridX: 50.00, gridY: 11.00, size: 1.2868745421156507, variant: 1 },
            { type: 'vegetation', gridX: 52.00, gridY: 9.00, size: 2.1509494691528817, variant: 1 },
            { type: 'vegetation', gridX: 55.00, gridY: 5.00, size: 2.483623822081194, variant: 3 },
            { type: 'vegetation', gridX: 8.00, gridY: 3.00, size: 1.866082468490113, variant: 3 },
            { type: 'vegetation', gridX: 17.00, gridY: 10.00, size: 2.1589242334674563, variant: 1 },
            { type: 'vegetation', gridX: 9.00, gridY: 8.00, size: 1.2089691855688316, variant: 0 },
            { type: 'vegetation', gridX: 13.00, gridY: 2.00, size: 1.1135588981700748, variant: 2 },
            { type: 'vegetation', gridX: 13.00, gridY: 10.00, size: 1.9709132833263947, variant: 0 },
            { type: 'vegetation', gridX: 13.00, gridY: 12.00, size: 2.475790284732966, variant: 1 },
            { type: 'vegetation', gridX: 5.00, gridY: 5.00, size: 2.4490229327131345, variant: 1 },
            { type: 'vegetation', gridX: 13.00, gridY: 13.00, size: 2.43244662096681, variant: 1 },
            { type: 'vegetation', gridX: 10.00, gridY: 13.00, size: 1.9244806081293022, variant: 0 },
            { type: 'vegetation', gridX: 8.00, gridY: 11.00, size: 2.6302566899662567, variant: 2 },
            { type: 'vegetation', gridX: 7.00, gridY: 5.00, size: 1.0404553422684828, variant: 1 },
            { type: 'vegetation', gridX: 8.00, gridY: 8.00, size: 1.6591110030550997, variant: 0 },
            { type: 'vegetation', gridX: 17.00, gridY: 7.00, size: 2.2599719141206442, variant: 3 },
            { type: 'vegetation', gridX: 29.00, gridY: 5.00, size: 1.7873802657212057, variant: 3 },
            { type: 'vegetation', gridX: 22.00, gridY: 2.00, size: 1.2111944254549718, variant: 1 },
            { type: 'vegetation', gridX: 22.00, gridY: 7.00, size: 1.3262374316638312, variant: 2 },
            { type: 'vegetation', gridX: 21.00, gridY: 7.00, size: 2.0216626030171962, variant: 2 },
            { type: 'vegetation', gridX: 22.00, gridY: 3.00, size: 2.3224935592276292, variant: 1 },
            { type: 'vegetation', gridX: 24.00, gridY: 5.00, size: 1.0390187602164689, variant: 3 },
            { type: 'vegetation', gridX: 22.00, gridY: 6.00, size: 2.8255148083175197, variant: 1 },
            { type: 'vegetation', gridX: 23.00, gridY: 5.00, size: 2.3704730476835794, variant: 1 },
            { type: 'vegetation', gridX: 43.00, gridY: 6.00, size: 1.7842972551290217, variant: 1 },
            { type: 'vegetation', gridX: 37.00, gridY: 8.00, size: 2.809457220637917, variant: 2 },
            { type: 'vegetation', gridX: 42.00, gridY: 3.00, size: 1.0412502270128767, variant: 0 },
            { type: 'vegetation', gridX: 43.00, gridY: 6.00, size: 1.461302361348557, variant: 0 },
            { type: 'vegetation', gridX: 41.00, gridY: 1.00, size: 1.9686613927505696, variant: 0 },
            { type: 'vegetation', gridX: 38.00, gridY: 7.00, size: 2.791951882783692, variant: 0 },
            { type: 'vegetation', gridX: 43.00, gridY: 6.00, size: 1.8657644310028934, variant: 1 },
            { type: 'vegetation', gridX: 39.00, gridY: 2.00, size: 2.7871394761118014, variant: 1 },
            { type: 'vegetation', gridX: 55.00, gridY: 26.00, size: 2.824936134986337, variant: 2 },
            { type: 'vegetation', gridX: 54.00, gridY: 28.00, size: 2.580274538930129, variant: 1 },
            { type: 'vegetation', gridX: 53.00, gridY: 30.00, size: 1.588647770514537, variant: 1 },
            { type: 'vegetation', gridX: 54.00, gridY: 32.00, size: 2.649109699351113, variant: 3 },
            { type: 'vegetation', gridX: 57.00, gridY: 26.00, size: 2.5901383388882557, variant: 1 },
            { type: 'vegetation', gridX: 57.00, gridY: 29.00, size: 2.6552371197156033, variant: 1 },
            { type: 'vegetation', gridX: 56.00, gridY: 32.75, size: 2.252174934179461, variant: 0 },
            { type: 'vegetation', gridX: 59.00, gridY: 20.00, size: 2.352870797022729, variant: 1 },
            { type: 'vegetation', gridX: 59.00, gridY: 18.00, size: 1.9832854020482604, variant: 0 },
            { type: 'vegetation', gridX: 57.00, gridY: 16.00, size: 2.039085379009835, variant: 2 },
            { type: 'vegetation', gridX: 57.00, gridY: 19.00, size: 1.5461973631832773, variant: 3 },
            { type: 'vegetation', gridX: 58.00, gridY: 17.00, size: 2.805509263448564, variant: 2 },
            { type: 'vegetation', gridX: 59.00, gridY: 16.00, size: 1.890969146548878, variant: 1 },
            { type: 'vegetation', gridX: 52.00, gridY: 19.00, size: 2.9782966078264663, variant: 2 },
            { type: 'vegetation', gridX: 58.00, gridY: 15.00, size: 2.503607424114877, variant: 3 },
            { type: 'vegetation', gridX: 52.00, gridY: 20.00, size: 1.5017897413986312, variant: 0 }
        ];
    }

    createMeanderingPath(canvasWidth, canvasHeight) {
        const gridWidth = this.gridWidth || 60;
        const gridHeight = this.gridHeight || 33.75;

        const pathInGridCoords = [
            { gridX: 2.00, gridY: 0.00 },
            { gridX: 2.00, gridY: 29.00 },
            { gridX: 21.00, gridY: 29.00 },
            { gridX: 21.00, gridY: 13.00 },
            { gridX: 47.00, gridY: 13.00 },
            { gridX: 47.00, gridY: 29.00 },
            { gridX: 29.00, gridY: 29.00 }
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
            pattern: [{ type: 'villager', count: 9 }, { type: 'villager', count: 11, healthMultiplier: 1.5 }, { type: 'basic', count: 7, healthMultiplier: 1.3 }] 
        }
        // Wave 2
        , { 
            enemyHealth_multiplier: 1.2, 
            speedMultiplier: 1, 
            spawnInterval: 0.86, 
            pattern: [{ type: 'frog', count: 8 }, { type: 'frog', count: 9, healthMultiplier: 2, speedMultiplier: 1.2 }, { type: 'frog', count: 10, healthMultiplier: 3 }] 
        }
        // Wave 3
        , { 
            enemyHealth_multiplier: 2.58, 
            speedMultiplier: 1, 
            spawnInterval: 0.96, 
            pattern: [{ type: 'villager', count: 9, healthMultiplier: 1.8, speedMultiplier: 0.6 }, { type: 'basic', count: 11, healthMultiplier: 1.8 }, { type: 'archer', count: 4, speedMultiplier: 1.5 }] 
        }
        // Wave 4
        , { 
            enemyHealth_multiplier: 1.84, 
            speedMultiplier: 1, 
            spawnInterval: 0.68, 
            pattern: [{ type: 'beefyenemy', count: 8 }] 
        }
        // Wave 5
        , { 
            enemyHealth_multiplier: 1.84, 
            speedMultiplier: 1, 
            spawnInterval: 0.78, 
            pattern: [{ type: 'archer', count: 8, healthMultiplier: 2.5, speedMultiplier: 1.1 }, { type: 'frog', count: 11, healthMultiplier: 1.8 }, { type: 'shieldknight', count: 3, healthMultiplier: 2 }, { type: 'archer', count: 4, healthMultiplier: 3, speedMultiplier: 1.5 }] 
        }
        // Wave 6
        , { 
            enemyHealth_multiplier: 5.52, 
            speedMultiplier: 1, 
            spawnInterval: 0.88, 
            pattern: [{ type: 'mage', count: 2, healthMultiplier: 2 }, { type: 'frog', count: 12 }] 
        }
        // Wave 7
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 1.2, 
            spawnInterval: 0.58, 
            pattern: [{ type: 'villager', count: 12 }, { type: 'basic', count: 10 }, { type: 'frog', count: 9, healthMultiplier: 2, speedMultiplier: 1.3 }] 
        }
        // Wave 8
        , { 
            enemyHealth_multiplier: 4.6, 
            speedMultiplier: 1.2, 
            spawnInterval: 0.78, 
            pattern: [{ type: 'basic', count: 11 }, { type: 'villager', count: 9 }, { type: 'archer', count: 11, speedMultiplier: 1.2 }] 
        }
        // Wave 9
        , { 
            enemyHealth_multiplier: 4.6, 
            speedMultiplier: 1, 
            spawnInterval: 1.95, 
            pattern: [{ type: 'beefyenemy', count: 5 }, { type: 'knight', count: 3 }] 
        }
        // Wave 10
        , { 
            enemyHealth_multiplier: 3.68, 
            speedMultiplier: 1, 
            spawnInterval: 4.7, 
            pattern: [{ type: 'firefrog', count: 2 }, { type: 'airfrog', count: 2 }, { type: 'firefrog', count: 2 }, { type: 'airfrog', count: 2 }] 
        }
        // Wave 11
        , { 
            enemyHealth_multiplier: 6.71, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'beefyenemy', count: 9, healthMultiplier: 3 }, { type: 'frog', count: 14 }, { type: 'mage', count: 3, healthMultiplier: 2 }, { type: 'basic', count: 11 }, { type: 'villager', count: 10 }, { type: 'shieldknight', count: 6 }, { type: 'archer', count: 9, healthMultiplier: 3, speedMultiplier: 2 }] 
        }
        // Wave 12
        , { 
            enemyHealth_multiplier: 2.48, 
            speedMultiplier: 1, 
            spawnInterval: 0.82, 
            pattern: [{ type: 'frog', count: 9 }, { type: 'frog', count: 10, healthMultiplier: 2, speedMultiplier: 1.2 }, { type: 'frog', count: 11, healthMultiplier: 3 }] 
        }
        // Wave 13
        , { 
            enemyHealth_multiplier: 7.45, 
            speedMultiplier: 0.9, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'knight', count: 4, healthMultiplier: 2.5 }, { type: 'shieldknight', count: 7, healthMultiplier: 2 }, { type: 'frog', count: 12, speedMultiplier: 1.3 }, { type: 'archer', count: 11, speedMultiplier: 1.4 }, { type: 'beefyenemy', count: 8 }, { type: 'villager', count: 8 }] 
        }
        // Wave 14
        , { 
            enemyHealth_multiplier: 2.48, 
            speedMultiplier: 1, 
            spawnInterval: 0.66, 
            pattern: [{ type: 'beefyenemy', count: 9 }, { type: 'frog', count: 3 }] 
        }
        // Wave 15
        , { 
            enemyHealth_multiplier: 2.48, 
            speedMultiplier: 1, 
            spawnInterval: 0.76, 
            pattern: [{ type: 'archer', count: 9, healthMultiplier: 2.5, speedMultiplier: 1.1 }, { type: 'frog', count: 13, healthMultiplier: 1.8 }, { type: 'shieldknight', count: 4, healthMultiplier: 2 }, { type: 'archer', count: 5, healthMultiplier: 3, speedMultiplier: 1.5 }] 
        }
        // Wave 16
        , { 
            enemyHealth_multiplier: 9.94, 
            speedMultiplier: 0.8, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'shieldknight', count: 9 }, { type: 'frog', count: 3 }] 
        }
        // Wave 17
        , { 
            enemyHealth_multiplier: 12.42, 
            speedMultiplier: 1, 
            spawnInterval: 11.9, 
            pattern: [{ type: 'knight', count: 5 }, { type: 'frog', count: 4 }] 
        }
        // Wave 18
        , { 
            enemyHealth_multiplier: 2.48, 
            speedMultiplier: 1, 
            spawnInterval: 1, 
            pattern: [{ type: 'knight', count: 3, healthMultiplier: 3 }, { type: 'shieldknight', count: 4, healthMultiplier: 2 }, { type: 'mage', count: 3, healthMultiplier: 2 }, { type: 'shieldknight', count: 3, healthMultiplier: 4 }, { type: 'frog', count: 4 }] 
        }
        // Wave 19
        , { 
            enemyHealth_multiplier: 12.42, 
            speedMultiplier: 1, 
            spawnInterval: 1, 
            pattern: [{ type: 'mage', count: 6, speedMultiplier: 0.6 }, { type: 'frog', count: 11, speedMultiplier: 1.2 }] 
        }
        // Wave 20
        , { 
            enemyHealth_multiplier: 4.97, 
            speedMultiplier: 1, 
            spawnInterval: 4.4, 
            pattern: [{ type: 'waterfrog', count: 3 }, { type: 'earthfrog', count: 3 }, { type: 'waterfrog', count: 3 }, { type: 'earthfrog', count: 3 }] 
        }
        // Wave 21
        , { 
            enemyHealth_multiplier: 14.39, 
            speedMultiplier: 1.1, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'shieldknight', count: 6, healthMultiplier: 3 }, { type: 'mage', count: 4 }, { type: 'villager', count: 15 }, { type: 'shieldknight', count: 5, healthMultiplier: 4 }, { type: 'beefyenemy', count: 13, healthMultiplier: 2 }, { type: 'mage', count: 4 }, { type: 'frog', count: 22 }, { type: 'archer', count: 14, healthMultiplier: 5, speedMultiplier: 1.5 }, { type: 'shieldknight', count: 4, healthMultiplier: 6 }] 
        }
        // Wave 22
        , { 
            enemyHealth_multiplier: 3.13, 
            speedMultiplier: 1, 
            spawnInterval: 0.78, 
            pattern: [{ type: 'frog', count: 14 }, { type: 'frog', count: 15, healthMultiplier: 2, speedMultiplier: 1.2 }, { type: 'frog', count: 16, healthMultiplier: 3 }] 
        }
        // Wave 23
        , { 
            enemyHealth_multiplier: 15.64, 
            speedMultiplier: 1.3, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'archer', count: 17 }, { type: 'villager', count: 20 }, { type: 'basic', count: 18 }, { type: 'frog', count: 4 }] 
        }
        // Wave 24
        , { 
            enemyHealth_multiplier: 17.2, 
            speedMultiplier: 1.7, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'archer', count: 15 }, { type: 'frog', count: 4 }] 
        }
        // Wave 25
        , { 
            enemyHealth_multiplier: 21.9, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'mage', count: 1 }, { type: 'waterfrog', count: 1 }] 
        }
        // Wave 26
        , { 
            enemyHealth_multiplier: 8.45, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'beefyenemy', count: 10, healthMultiplier: 3 }, { type: 'frog', count: 22 }, { type: 'mage', count: 4, healthMultiplier: 2 }, { type: 'basic', count: 12 }, { type: 'villager', count: 11 }, { type: 'shieldknight', count: 7 }, { type: 'archer', count: 10, healthMultiplier: 3, speedMultiplier: 2 }] 
        }
        // Wave 27
        , { 
            enemyHealth_multiplier: 21.9, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'waterfrog', count: 1 }, { type: 'earthfrog', count: 1 }, { type: 'firefrog', count: 1 }] 
        }
        // Wave 28
        , { 
            enemyHealth_multiplier: 9.38, 
            speedMultiplier: 0.9, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'knight', count: 5, healthMultiplier: 2.5 }, { type: 'shieldknight', count: 8, healthMultiplier: 2 }, { type: 'frog', count: 20, speedMultiplier: 1.3 }, { type: 'archer', count: 12, speedMultiplier: 1.4 }, { type: 'beefyenemy', count: 9 }, { type: 'villager', count: 9 }] 
        }
        // Wave 29
        , { 
            enemyHealth_multiplier: 43.79, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'firefrog', count: 1 }] 
        }
        // Wave 30
        , { 
            enemyHealth_multiplier: 6.26, 
            speedMultiplier: 1, 
            spawnInterval: 4.1, 
            pattern: [{ type: 'firefrog', count: 4 }, { type: 'waterfrog', count: 4 }, { type: 'firefrog', count: 4 }, { type: 'waterfrog', count: 4 }] 
        }
        // Wave 31
        , { 
            enemyHealth_multiplier: 10.18, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'beefyenemy', count: 12, healthMultiplier: 3 }, { type: 'frog', count: 28 }, { type: 'mage', count: 5, healthMultiplier: 2 }, { type: 'basic', count: 14 }, { type: 'villager', count: 13 }, { type: 'shieldknight', count: 9 }, { type: 'archer', count: 12, healthMultiplier: 3, speedMultiplier: 2 }] 
        }
        // Wave 32
        , { 
            enemyHealth_multiplier: 26.4, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'mage', count: 1 }, { type: 'airfrog', count: 1 }] 
        }
        // Wave 33
        , { 
            enemyHealth_multiplier: 18.86, 
            speedMultiplier: 1.4, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'archer', count: 19 }, { type: 'villager', count: 22 }, { type: 'basic', count: 20 }, { type: 'frog', count: 5 }] 
        }
        // Wave 34
        , { 
            enemyHealth_multiplier: 20.75, 
            speedMultiplier: 1.7, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'archer', count: 17 }, { type: 'frog', count: 5 }] 
        }
        // Wave 35
        , { 
            enemyHealth_multiplier: 3.77, 
            speedMultiplier: 1, 
            spawnInterval: 0.72, 
            pattern: [{ type: 'archer', count: 12, healthMultiplier: 2.5, speedMultiplier: 1.1 }, { type: 'frog', count: 27, healthMultiplier: 1.8 }, { type: 'shieldknight', count: 6, healthMultiplier: 2 }, { type: 'archer', count: 7, healthMultiplier: 3, speedMultiplier: 1.5 }] 
        }
        // Wave 36
        , { 
            enemyHealth_multiplier: 17.35, 
            speedMultiplier: 1.1, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'shieldknight', count: 7, healthMultiplier: 3 }, { type: 'mage', count: 5 }, { type: 'villager', count: 17 }, { type: 'shieldknight', count: 6, healthMultiplier: 4 }, { type: 'beefyenemy', count: 15, healthMultiplier: 2 }, { type: 'mage', count: 5 }, { type: 'frog', count: 35 }, { type: 'archer', count: 16, healthMultiplier: 5, speedMultiplier: 1.5 }, { type: 'shieldknight', count: 5, healthMultiplier: 6 }] 
        }
        // Wave 37
        , { 
            enemyHealth_multiplier: 52.81, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'earthfrog', count: 1 }] 
        }
        // Wave 38
        , { 
            enemyHealth_multiplier: 11.32, 
            speedMultiplier: 0.9, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'knight', count: 6, healthMultiplier: 2.5 }, { type: 'shieldknight', count: 10, healthMultiplier: 2 }, { type: 'frog', count: 29, speedMultiplier: 1.3 }, { type: 'archer', count: 14, speedMultiplier: 1.4 }, { type: 'beefyenemy', count: 11 }, { type: 'villager', count: 11 }] 
        }
        // Wave 39
        , { 
            enemyHealth_multiplier: 26.4, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'waterfrog', count: 1 }, { type: 'airfrog', count: 1 }, { type: 'earthfrog', count: 1 }] 
        }
        // Wave 40
        , { 
            enemyHealth_multiplier: 7.54, 
            speedMultiplier: 1, 
            spawnInterval: 3.8, 
            pattern: [{ type: 'airfrog', count: 5 }, { type: 'earthfrog', count: 5 }, { type: 'airfrog', count: 5 }, { type: 'earthfrog', count: 5 }] 
        }
        // Wave 41
        , { 
            enemyHealth_multiplier: 20.31, 
            speedMultiplier: 1.1, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'shieldknight', count: 9, healthMultiplier: 3 }, { type: 'mage', count: 7 }, { type: 'villager', count: 18 }, { type: 'shieldknight', count: 8, healthMultiplier: 4 }, { type: 'beefyenemy', count: 16, healthMultiplier: 2 }, { type: 'mage', count: 7 }, { type: 'frog', count: 40 }, { type: 'archer', count: 17, healthMultiplier: 5, speedMultiplier: 1.5 }, { type: 'shieldknight', count: 7, healthMultiplier: 6 }] 
        }
        // Wave 42
        , { 
            enemyHealth_multiplier: 11.92, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'beefyenemy', count: 13, healthMultiplier: 3 }, { type: 'frog', count: 37 }, { type: 'mage', count: 7, healthMultiplier: 2 }, { type: 'basic', count: 15 }, { type: 'villager', count: 14 }, { type: 'shieldknight', count: 10 }, { type: 'archer', count: 13, healthMultiplier: 3, speedMultiplier: 2 }] 
        }
        // Wave 43
        , { 
            enemyHealth_multiplier: 61.82, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'waterfrog', count: 1 }] 
        }
        // Wave 44
        , { 
            enemyHealth_multiplier: 24.29, 
            speedMultiplier: 1.8, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'archer', count: 18 }, { type: 'frog', count: 6 }] 
        }
        // Wave 45
        , { 
            enemyHealth_multiplier: 4.42, 
            speedMultiplier: 1, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'archer', count: 13, healthMultiplier: 2.5, speedMultiplier: 1.1 }, { type: 'frog', count: 34, healthMultiplier: 1.8 }, { type: 'shieldknight', count: 8, healthMultiplier: 2 }, { type: 'archer', count: 9, healthMultiplier: 3, speedMultiplier: 1.5 }] 
        }
        // Wave 46
        , { 
            enemyHealth_multiplier: 13.25, 
            speedMultiplier: 0.9, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'knight', count: 8, healthMultiplier: 2.5 }, { type: 'shieldknight', count: 11, healthMultiplier: 2 }, { type: 'frog', count: 35, speedMultiplier: 1.3 }, { type: 'archer', count: 15, speedMultiplier: 1.4 }, { type: 'beefyenemy', count: 12 }, { type: 'villager', count: 12 }] 
        }
        // Wave 47
        , { 
            enemyHealth_multiplier: 17.66, 
            speedMultiplier: 0.8, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'shieldknight', count: 13 }, { type: 'frog', count: 7 }] 
        }
        // Wave 48
        , { 
            enemyHealth_multiplier: 30.91, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'firefrog', count: 1 }, { type: 'waterfrog', count: 1 }, { type: 'earthfrog', count: 1 }, { type: 'airfrog', count: 1 }] 
        }
        ];

        if (wave > 0 && wave <= waveConfigs.length) {
            return waveConfigs[wave - 1];
        }
        
        return null;
    }
}