import { LevelBase } from '../LevelBase.js';

export class DesertLevel3 extends LevelBase {
    static levelMetadata = {
        name: 'Lilicuse',
        difficulty: 'Hard',
        order: 3,
        campaign: 'desert'
    };

    constructor() {
        super();
        // Derive instance properties from static metadata
        this.levelName = DesertLevel3.levelMetadata.name;
        this.levelNumber = DesertLevel3.levelMetadata.order;
        this.difficulty = DesertLevel3.levelMetadata.difficulty;
        this.campaign = DesertLevel3.levelMetadata.campaign;
        this.maxWaves = 22;

        // Set terrain elements (prevent tower placement on these areas)
        this.terrainElements = [
            { type: 'water', gridX: 40.00, gridY: 34.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 40.00, gridY: 33.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 40.00, gridY: 32.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 40.00, gridY: 31.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 40.00, gridY: 30.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 41.00, gridY: 29.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 41.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 41.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 41.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 41.00, gridY: 25.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 41.00, gridY: 25.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 42.00, gridY: 25.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 43.00, gridY: 24.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 43.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 44.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 44.00, gridY: 22.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 45.00, gridY: 21.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 46.00, gridY: 21.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 46.00, gridY: 20.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 47.00, gridY: 19.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 48.00, gridY: 19.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 48.00, gridY: 19.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 49.00, gridY: 18.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 50.00, gridY: 18.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 50.00, gridY: 18.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 51.00, gridY: 18.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 52.00, gridY: 17.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 53.00, gridY: 17.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 54.00, gridY: 17.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 55.00, gridY: 17.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 56.00, gridY: 16.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 57.00, gridY: 16.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 58.00, gridY: 16.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 59.00, gridY: 15.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 60.00, gridY: 15.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 60.00, gridY: 15.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 60.00, gridY: 15.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 13.00, gridY: 11.00, size: 3, waterType: 'lake' },
            { type: 'vegetation', gridX: 11.00, gridY: 10.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 16.00, gridY: 13.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 15.00, gridY: 11.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 11.00, gridY: 13.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 12.00, gridY: 13.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 16.00, gridY: 10.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 10.00, gridY: 11.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 14.00, gridY: 14.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 6.00, gridY: 11.00, size: 3, variant: 3 },
            { type: 'vegetation', gridX: 18.00, gridY: 10.00, size: 3, variant: 3 },
            { type: 'vegetation', gridX: 11.00, gridY: 5.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 14.00, gridY: 5.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 6.00, gridY: 6.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 8.00, gridY: 5.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 17.00, gridY: 5.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 5.00, gridY: 12.00, size: 3, variant: 2 },
            { type: 'vegetation', gridX: 4.00, gridY: 7.00, size: 3, variant: 2 },
            { type: 'rock', gridX: 10.00, gridY: 5.00, size: 3, variant: 0 },
            { type: 'rock', gridX: 4.00, gridY: 8.00, size: 3, variant: 1 },
            { type: 'rock', gridX: 17.00, gridY: 10.00, size: 2, variant: 1 },
            { type: 'rock', gridX: 11.00, gridY: 14.00, size: 2, variant: 0 },
            { type: 'rock', gridX: 16.00, gridY: 5.00, size: 2, variant: 0 },
            { type: 'rock', gridX: 6.00, gridY: 3.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 56.00, gridY: 2.00, size: 1.1642357073288934, variant: 2 },
            { type: 'vegetation', gridX: 56.00, gridY: 2.00, size: 1.4597677477889486, variant: 2 },
            { type: 'vegetation', gridX: 59.00, gridY: 5.00, size: 2.2103555438027698, variant: 1 },
            { type: 'vegetation', gridX: 54.00, gridY: 4.00, size: 1.7031321794373206, variant: 2 },
            { type: 'vegetation', gridX: 53.00, gridY: 5.00, size: 1.7468928065638603, variant: 1 },
            { type: 'vegetation', gridX: 54.00, gridY: 7.00, size: 1.4613064625406993, variant: 2 },
            { type: 'vegetation', gridX: 58.00, gridY: 5.00, size: 2.831242185433182, variant: 0 },
            { type: 'vegetation', gridX: 58.00, gridY: 4.00, size: 1.5426542531777707, variant: 1 },
            { type: 'vegetation', gridX: 51.00, gridY: 8.00, size: 1.6785686831504991, variant: 0 },
            { type: 'vegetation', gridX: 54.00, gridY: 12.00, size: 2.2977601101556573, variant: 2 },
            { type: 'vegetation', gridX: 52.00, gridY: 8.00, size: 2.884219731620499, variant: 1 },
            { type: 'vegetation', gridX: 50.00, gridY: 11.00, size: 2.82545465510369, variant: 0 },
            { type: 'vegetation', gridX: 54.00, gridY: 6.00, size: 1.8347646116429683, variant: 1 },
            { type: 'vegetation', gridX: 54.00, gridY: 12.00, size: 1.7706296424794739, variant: 1 },
            { type: 'vegetation', gridX: 54.00, gridY: 8.00, size: 1.291733689425978, variant: 2 },
            { type: 'vegetation', gridX: 56.00, gridY: 11.00, size: 2.211084072193562, variant: 2 },
            { type: 'vegetation', gridX: 48.00, gridY: 0.00, size: 2.877798715186393, variant: 1 },
            { type: 'vegetation', gridX: 45.00, gridY: 3.00, size: 2.751013317311612, variant: 1 },
            { type: 'vegetation', gridX: 45.00, gridY: 3.00, size: 2.7724302954460827, variant: 2 },
            { type: 'vegetation', gridX: 44.00, gridY: 1.00, size: 1.9387562998671553, variant: 1 },
            { type: 'vegetation', gridX: 49.00, gridY: 5.00, size: 1.4583611042451328, variant: 1 },
            { type: 'vegetation', gridX: 44.00, gridY: 4.00, size: 1.126874492577992, variant: 2 },
            { type: 'vegetation', gridX: 49.00, gridY: 3.00, size: 1.7992448043595053, variant: 1 },
            { type: 'vegetation', gridX: 43.00, gridY: 3.00, size: 1.2604393797900937, variant: 0 },
            { type: 'vegetation', gridX: 38.00, gridY: 24.00, size: 1.886704169434231, variant: 2 },
            { type: 'vegetation', gridX: 40.00, gridY: 23.00, size: 2.2177433662235346, variant: 1 },
            { type: 'vegetation', gridX: 38.00, gridY: 23.00, size: 2.7383887957544393, variant: 1 },
            { type: 'vegetation', gridX: 44.00, gridY: 20.00, size: 2.8872510231812276, variant: 0 },
            { type: 'vegetation', gridX: 45.00, gridY: 20.00, size: 2.992375172506671, variant: 2 },
            { type: 'vegetation', gridX: 44.00, gridY: 19.00, size: 1.0428411482059183, variant: 2 },
            { type: 'vegetation', gridX: 50.00, gridY: 21.00, size: 2.174691409771339, variant: 1 },
            { type: 'vegetation', gridX: 49.00, gridY: 21.00, size: 1.6203504976296443, variant: 0 },
            { type: 'vegetation', gridX: 50.00, gridY: 21.00, size: 2.4823175750599527, variant: 1 },
            { type: 'vegetation', gridX: 54.00, gridY: 14.00, size: 1.7896754660813534, variant: 2 },
            { type: 'vegetation', gridX: 51.00, gridY: 14.00, size: 1.3870337563748076, variant: 1 },
            { type: 'vegetation', gridX: 52.00, gridY: 13.00, size: 1.2530614292808684, variant: 2 },
            { type: 'vegetation', gridX: 59.00, gridY: 17.00, size: 1.5854471470026759, variant: 1 },
            { type: 'vegetation', gridX: 59.00, gridY: 18.00, size: 1.9287384519130075, variant: 1 },
            { type: 'vegetation', gridX: 59.00, gridY: 17.00, size: 1.0672516316986982, variant: 1 },
            { type: 'vegetation', gridX: 45.00, gridY: 26.00, size: 2.8155615874474877, variant: 2 },
            { type: 'vegetation', gridX: 45.00, gridY: 24.00, size: 2.366312524389307, variant: 2 },
            { type: 'vegetation', gridX: 46.00, gridY: 26.00, size: 1.5171386035392733, variant: 0 },
            { type: 'rock', gridX: 47.00, gridY: 22.00, size: 2, variant: 1 },
            { type: 'rock', gridX: 42.00, gridY: 22.00, size: 2.5, variant: 1 },
            { type: 'rock', gridX: 57.00, gridY: 7.00, size: 3, variant: 1 },
            { type: 'rock', gridX: 47.00, gridY: 1.00, size: 3, variant: 2 },
            { type: 'rock', gridX: 56.00, gridY: 32.00, size: 3, variant: 2 },
            { type: 'rock', gridX: 59.00, gridY: 25.00, size: 3, variant: 3 },
            { type: 'rock', gridX: 48.00, gridY: 10.00, size: 3, variant: 3 },
            { type: 'rock', gridX: 3.00, gridY: 32.00, size: 3, variant: 0 },
            { type: 'rock', gridX: 2.00, gridY: 31.00, size: 1, variant: 0 },
            { type: 'rock', gridX: 5.00, gridY: 32.00, size: 1, variant: 0 },
            { type: 'vegetation', gridX: 4.00, gridY: 31.00, size: 1, variant: 3 },
            { type: 'vegetation', gridX: 2.00, gridY: 29.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 1.00, gridY: 33.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 7.00, gridY: 33.00, size: 3, variant: 3 },
            { type: 'vegetation', gridX: 8.00, gridY: 34.00, size: 3, variant: 3 },
            { type: 'vegetation', gridX: 20.00, gridY: 15.00, size: 3, variant: 3 },
            { type: 'vegetation', gridX: 1.00, gridY: 3.00, size: 3, variant: 3 },
            { type: 'vegetation', gridX: 20.00, gridY: 3.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 2.00, gridY: 16.00, size: 2, variant: 1 }
        ];
    }

    createMeanderingPath(canvasWidth, canvasHeight) {
        const gridWidth = this.gridWidth || 60;
        const gridHeight = this.gridHeight || 33.75;

        const pathInGridCoords = [
            { gridX: 60.00, gridY: 28.00 },
            { gridX: 8.00, gridY: 28.00 },
            { gridX: 8.00, gridY: 7.00 },
            { gridX: 48.00, gridY: 7.00 }
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
            spawnInterval: 0.8, 
            pattern: [{ type: 'frog', count: 25 }] 
        }
        // Wave 2
        , { 
            enemyHealth_multiplier: 1.3, 
            speedMultiplier: 0.75, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'archer', count: 3 }, { type: 'villager', count: 9 }, { type: 'basic', count: 3 }, { type: 'frog', count: 5 }] 
        }
        // Wave 3
        , { 
            enemyHealth_multiplier: 1, 
            speedMultiplier: 1.1, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'beefyenemy', count: 8 }] 
        }
        // Wave 4
        , { 
            enemyHealth_multiplier: 2, 
            speedMultiplier: 0.85, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'beefyenemy', count: 7, healthMultiplier: 1 }, { type: 'villager', count: 9 }, { type: 'basic', count: 10 }] 
        }
        // Wave 5
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 1, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'mage', count: 2 }, { type: 'frog', count: 12 }] 
        }
        // Wave 6
        , { 
            enemyHealth_multiplier: 3, 
            speedMultiplier: 1.2, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'frog', count: 24 }] 
        }
        // Wave 7
        , { 
            enemyHealth_multiplier: 3, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'shieldknight', count: 5 }] 
        }
        // Wave 8
        , { 
            enemyHealth_multiplier: 3, 
            speedMultiplier: 1, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'villager', count: 21 }, { type: 'basic', count: 16 }, { type: 'frog', count: 9 }] 
        }
        // Wave 9
        , { 
            enemyHealth_multiplier: 2.5, 
            speedMultiplier: 1.2, 
            spawnInterval: 0.5, 
            pattern: [{ type: 'archer', count: 13, speedMultiplier: 1.4 }, { type: 'villager', count: 11 }, { type: 'basic', count: 13 }] 
        }
        // Wave 10
        , { 
            enemyHealth_multiplier: 1, 
            speedMultiplier: 1, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'shieldknight', count: 6, healthMultiplier: 1 }, { type: 'beefyenemy', count: 5, healthMultiplier: 2 }, { type: 'knight', count: 1, healthMultiplier: 2 }] 
        }
        // Wave 11
        , { 
            enemyHealth_multiplier: 8, 
            speedMultiplier: 1, 
            spawnInterval: 13, 
            pattern: [{ type: 'knight', count: 5 }] 
        }
        // Wave 12
        , { 
            enemyHealth_multiplier: 2, 
            speedMultiplier: 1, 
            spawnInterval: 0.5, 
            pattern: [{ type: 'mage', count: 2, healthMultiplier: 5, speedMultiplier: 0.8 }, { type: 'frog', count: 20, speedMultiplier: 1.3 }] 
        }
        // Wave 13
        , { 
            enemyHealth_multiplier: 6, 
            speedMultiplier: 1, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'frog', count: 27 }] 
        }
        // Wave 14
        , { 
            enemyHealth_multiplier: 3, 
            speedMultiplier: 1, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'mage', count: 1, healthMultiplier: 2, speedMultiplier: 1.2 }, { type: 'villager', count: 10 }, { type: 'basic', count: 6 }, { type: 'archer', count: 6 }, { type: 'beefyenemy', count: 9, healthMultiplier: 4 }] 
        }
        // Wave 15
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 1, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'shieldknight', count: 5 }, { type: 'beefyenemy', count: 5, healthMultiplier: 2 }, { type: 'knight', count: 2, healthMultiplier: 2 }] 
        }
        // Wave 16
        , { 
            enemyHealth_multiplier: 3, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'knight', count: 3 }, { type: 'frog', count: 12 }, { type: 'mage', count: 1, healthMultiplier: 1 }] 
        }
        // Wave 17
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 0.8, 
            spawnInterval: 0.5, 
            pattern: [{ type: 'knight', count: 3 }] 
        }
        // Wave 18
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 1, 
            spawnInterval: 5, 
            pattern: [{ type: 'mage', count: 2, healthMultiplier: 5 }, { type: 'archer', count: 8, healthMultiplier: 5, speedMultiplier: 1.5 }, { type: 'frog', count: 12, healthMultiplier: 2, speedMultiplier: 0.8 }] 
        }
        // Wave 19
        , { 
            enemyHealth_multiplier: 2, 
            speedMultiplier: 0.6, 
            spawnInterval: 0.5, 
            pattern: [{ type: 'archer', count: 16 }, { type: 'villager', count: 14 }, { type: 'basic', count: 15 }] 
        }
        // Wave 20
        , { 
            enemyHealth_multiplier: 7, 
            speedMultiplier: 1.5, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'archer', count: 20 }] 
        }
        // Wave 21
        , { 
            enemyHealth_multiplier: 1, 
            speedMultiplier: 1, 
            spawnInterval: 0.5, 
            pattern: [{ type: 'frog', count: 12, healthMultiplier: 2 }, { type: 'mage', count: 1, healthMultiplier: 5 }, { type: 'archer', count: 12, healthMultiplier: 3, speedMultiplier: 1.4 }, { type: 'shieldknight', count: 3, healthMultiplier: 2 }, { type: 'knight', count: 1, healthMultiplier: 2 }, { type: 'beefyenemy', count: 4, healthMultiplier: 5 }, { type: 'basic', count: 4, healthMultiplier: 5 }, { type: 'villager', count: 5, healthMultiplier: 5 }] 
        }
        // Wave 22
        , { 
            enemyHealth_multiplier: 12, 
            speedMultiplier: 1, 
            spawnInterval: 1, 
            pattern: [{ type: 'firefrog', count: 1 }] 
        }
        ];

        if (wave > 0 && wave <= waveConfigs.length) {
            return waveConfigs[wave - 1];
        }
        
        return null;
    }
}