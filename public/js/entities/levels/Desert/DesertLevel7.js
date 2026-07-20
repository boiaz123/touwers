import { LevelBase } from '../LevelBase.js';

export class DesertLevel7 extends LevelBase {
    static levelMetadata = {
        name: 'Mehnuin',
        difficulty: 'Hard',
        order: 7,
        campaign: 'desert'
    };

    constructor() {
        super();
        // Derive instance properties from static metadata
        this.levelName = DesertLevel7.levelMetadata.name;
        this.levelNumber = DesertLevel7.levelMetadata.order;
        this.difficulty = DesertLevel7.levelMetadata.difficulty;
        this.campaign = DesertLevel7.levelMetadata.campaign;
        this.maxWaves = 34;

        // Set terrain elements (prevent tower placement on these areas)
        this.terrainElements = [
            { type: 'water', gridX: 50.00, gridY: 24.00, size: 4, waterType: 'lake' },
            { type: 'vegetation', gridX: 58.00, gridY: 8.00, size: 1.6363552975312425, variant: 1 },
            { type: 'vegetation', gridX: 50.00, gridY: 4.00, size: 2.4719639381703624, variant: 1 },
            { type: 'vegetation', gridX: 55.00, gridY: 4.00, size: 2.1428336255300726, variant: 0 },
            { type: 'vegetation', gridX: 49.00, gridY: 9.00, size: 2.0640676516936716, variant: 2 },
            { type: 'vegetation', gridX: 55.00, gridY: 16.00, size: 2.794647221423607, variant: 0 },
            { type: 'vegetation', gridX: 50.00, gridY: 17.00, size: 1.7851544129449926, variant: 3 },
            { type: 'vegetation', gridX: 51.00, gridY: 21.00, size: 1.8741362187401487, variant: 0 },
            { type: 'vegetation', gridX: 55.00, gridY: 21.00, size: 2.735340522899774, variant: 2 },
            { type: 'vegetation', gridX: 55.00, gridY: 12.00, size: 2.8760507160703312, variant: 2 },
            { type: 'vegetation', gridX: 55.00, gridY: 18.00, size: 2.113890941714126, variant: 2 },
            { type: 'vegetation', gridX: 55.00, gridY: 18.00, size: 1.9016504643203784, variant: 2 },
            { type: 'vegetation', gridX: 50.00, gridY: 16.00, size: 2.985706362165079, variant: 0 },
            { type: 'vegetation', gridX: 55.00, gridY: 14.00, size: 2.4760387365519816, variant: 1 },
            { type: 'vegetation', gridX: 44.00, gridY: 24.00, size: 1.7564112814331498, variant: 1 },
            { type: 'vegetation', gridX: 45.00, gridY: 25.00, size: 2.259446127996525, variant: 3 },
            { type: 'vegetation', gridX: 46.00, gridY: 28.00, size: 2.2291627577580084, variant: 3 },
            { type: 'vegetation', gridX: 41.00, gridY: 26.00, size: 1.6897422976315686, variant: 3 },
            { type: 'vegetation', gridX: 43.00, gridY: 27.00, size: 2.1449119253584112, variant: 0 },
            { type: 'vegetation', gridX: 37.00, gridY: 28.00, size: 1.6145306741744783, variant: 0 },
            { type: 'vegetation', gridX: 44.00, gridY: 31.00, size: 1.7160696188469649, variant: 3 },
            { type: 'vegetation', gridX: 43.00, gridY: 32.75, size: 2.623158876355352, variant: 0 },
            { type: 'vegetation', gridX: 38.00, gridY: 24.00, size: 2.684956701558719, variant: 3 },
            { type: 'vegetation', gridX: 57.00, gridY: 28.00, size: 1.9776358500874185, variant: 1 },
            { type: 'vegetation', gridX: 52.00, gridY: 32.00, size: 2.5211215961226614, variant: 1 },
            { type: 'vegetation', gridX: 57.00, gridY: 26.00, size: 2.1754102103756097, variant: 3 },
            { type: 'vegetation', gridX: 58.00, gridY: 29.00, size: 2.0211231903492055, variant: 2 },
            { type: 'vegetation', gridX: 52.00, gridY: 29.00, size: 2.5736296437258686, variant: 1 },
            { type: 'vegetation', gridX: 55.00, gridY: 30.00, size: 1.8024642896222909, variant: 0 },
            { type: 'vegetation', gridX: 54.00, gridY: 26.00, size: 2.672028214364112, variant: 0 },
            { type: 'vegetation', gridX: 34.00, gridY: 26.00, size: 1.968102220481579, variant: 3 },
            { type: 'vegetation', gridX: 28.00, gridY: 32.00, size: 2.18078636975816, variant: 0 },
            { type: 'vegetation', gridX: 34.00, gridY: 32.00, size: 2.1757509688432144, variant: 0 },
            { type: 'vegetation', gridX: 31.00, gridY: 27.00, size: 2.6946786540474066, variant: 1 },
            { type: 'vegetation', gridX: 29.00, gridY: 31.00, size: 1.509586869799388, variant: 2 },
            { type: 'vegetation', gridX: 26.00, gridY: 27.00, size: 1.5840234002961127, variant: 1 },
            { type: 'vegetation', gridX: 32.00, gridY: 24.00, size: 2.746288289655627, variant: 1 },
            { type: 'vegetation', gridX: 33.00, gridY: 29.00, size: 1.8934139235325471, variant: 2 },
            { type: 'vegetation', gridX: 20.00, gridY: 31.00, size: 2.2576904084117384, variant: 3 },
            { type: 'vegetation', gridX: 22.00, gridY: 32.00, size: 2.9906222458666987, variant: 2 },
            { type: 'vegetation', gridX: 21.00, gridY: 32.00, size: 2.4018065577863763, variant: 1 },
            { type: 'vegetation', gridX: 23.00, gridY: 30.00, size: 2.318827788016491, variant: 1 },
            { type: 'vegetation', gridX: 24.00, gridY: 28.00, size: 2.6365262438153283, variant: 0 },
            { type: 'vegetation', gridX: 41.00, gridY: 2.00, size: 1.857042497339854, variant: 3 },
            { type: 'vegetation', gridX: 39.00, gridY: 5.00, size: 2.7616794577675856, variant: 1 },
            { type: 'vegetation', gridX: 39.00, gridY: 3.00, size: 2.946277045650795, variant: 1 },
            { type: 'vegetation', gridX: 43.00, gridY: 4.00, size: 2.0981732997501377, variant: 2 },
            { type: 'vegetation', gridX: 40.00, gridY: 5.00, size: 1.7324126025035516, variant: 1 },
            { type: 'vegetation', gridX: 40.00, gridY: 3.00, size: 1.6285099253593838, variant: 0 },
            { type: 'vegetation', gridX: 28.00, gridY: 4.00, size: 2.34829214587289, variant: 3 },
            { type: 'vegetation', gridX: 29.00, gridY: 0.00, size: 1.6326473604635403, variant: 3 },
            { type: 'rock', gridX: 50.00, gridY: 30.00, size: 4, variant: 3 },
            { type: 'rock', gridX: 55.00, gridY: 21.00, size: 4, variant: 3 },
            { type: 'rock', gridX: 27.00, gridY: 27.00, size: 2, variant: 3 },
            { type: 'rock', gridX: 47.00, gridY: 18.00, size: 2, variant: 3 },
            { type: 'rock', gridX: 47.00, gridY: 7.00, size: 2, variant: 3 },
            { type: 'rock', gridX: 34.00, gridY: 3.00, size: 2, variant: 3 },
            { type: 'rock', gridX: 24.00, gridY: 1.00, size: 2, variant: 0 },
            { type: 'rock', gridX: 51.00, gridY: 12.00, size: 2, variant: 0 },
            { type: 'rock', gridX: 55.00, gridY: 8.00, size: 2, variant: 0 },
            { type: 'rock', gridX: 37.00, gridY: 30.00, size: 2, variant: 0 },
            { type: 'rock', gridX: 14.00, gridY: 32.00, size: 2, variant: 0 },
            { type: 'rock', gridX: 58.00, gridY: 31.00, size: 2, variant: 1 },
            { type: 'rock', gridX: 45.00, gridY: 2.00, size: 2.5, variant: 1 },
            { type: 'rock', gridX: 39.00, gridY: 25.00, size: 2.5, variant: 1 },
            { type: 'rock', gridX: 31.00, gridY: 2.00, size: 2.5, variant: 2 },
            { type: 'rock', gridX: 56.00, gridY: 16.00, size: 2.5, variant: 2 },
            { type: 'rock', gridX: 58.00, gridY: 5.00, size: 2.5, variant: 2 },
            { type: 'rock', gridX: 24.00, gridY: 32.00, size: 2.5, variant: 3 }
        ];
    }

    createMeanderingPath(canvasWidth, canvasHeight) {
        const gridWidth = this.gridWidth || 60;
        const gridHeight = this.gridHeight || 33.75;

        const pathInGridCoords = [
            { gridX: 0.00, gridY: 8.00 },
            { gridX: 21.00, gridY: 8.00 },
            { gridX: 7.00, gridY: 27.00 },
            { gridX: 16.00, gridY: 27.00 },
            { gridX: 23.00, gridY: 17.00 },
            { gridX: 36.00, gridY: 17.00 },
            { gridX: 36.00, gridY: 11.00 },
            { gridX: 27.00, gridY: 11.00 }
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
            enemyHealth_multiplier: 0.75, 
            speedMultiplier: 1, 
            spawnInterval: 1, 
            pattern: [{ type: 'knight', count: 1 }] 
        }
        // Wave 2
        , { 
            enemyHealth_multiplier: 2, 
            speedMultiplier: 1, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'frog', count: 14 }] 
        }
        // Wave 3
        , { 
            enemyHealth_multiplier: 1.5, 
            speedMultiplier: 1, 
            spawnInterval: 1.3, 
            pattern: [{ type: 'villager', count: 12, healthMultiplier: 2, speedMultiplier: 0.5 }, { type: 'basic', count: 13 }, { type: 'archer', count: 6, speedMultiplier: 1.5 }] 
        }
        // Wave 4
        , { 
            enemyHealth_multiplier: 3.5, 
            speedMultiplier: 1, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'beefyenemy', count: 3 }, { type: 'archer', count: 1, healthMultiplier: 3, speedMultiplier: 1.5 }, { type: 'villager', count: 13 }] 
        }
        // Wave 5
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 1, 
            spawnInterval: 2, 
            pattern: [{ type: 'beefyenemy', count: 7 }] 
        }
        // Wave 6
        , { 
            enemyHealth_multiplier: 3, 
            speedMultiplier: 1.1, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'mage', count: 1, healthMultiplier: 2 }, { type: 'frog', count: 4 }, { type: 'archer', count: 6 }, { type: 'frog', count: 10, healthMultiplier: 4, speedMultiplier: 1.2 }, { type: 'archer', count: 9, speedMultiplier: 1.4 }] 
        }
        // Wave 7
        , { 
            enemyHealth_multiplier: 3.5, 
            speedMultiplier: 1.1, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'villager', count: 15, healthMultiplier: 4 }, { type: 'basic', count: 13 }, { type: 'frog', count: 7, speedMultiplier: 1.4 }] 
        }
        // Wave 8
        , { 
            enemyHealth_multiplier: 2.5, 
            speedMultiplier: 1, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'basic', count: 14 }, { type: 'villager', count: 11 }, { type: 'archer', count: 13, speedMultiplier: 1.2 }] 
        }
        // Wave 9
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 1, 
            spawnInterval: 2, 
            pattern: [{ type: 'shieldknight', count: 2, healthMultiplier: 1 }, { type: 'beefyenemy', count: 5 }, { type: 'knight', count: 1, healthMultiplier: 1 }, { type: 'shieldknight', count: 3 }, { type: 'beefyenemy', count: 7, healthMultiplier: 5 }, { type: 'knight', count: 1, healthMultiplier: 1.3, speedMultiplier: 0.8 }] 
        }
        // Wave 10
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 1, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'mage', count: 2 }, { type: 'frog', count: 14 }] 
        }
        // Wave 11
        , { 
            enemyHealth_multiplier: 2.5, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'beefyenemy', count: 9, healthMultiplier: 5 }, { type: 'frog', count: 10 }, { type: 'mage', count: 1, healthMultiplier: 2 }, { type: 'basic', count: 11 }, { type: 'villager', count: 9 }, { type: 'shieldknight', count: 3 }, { type: 'archer', count: 11, healthMultiplier: 2, speedMultiplier: 1.4 }] 
        }
        // Wave 12
        , { 
            enemyHealth_multiplier: 10, 
            speedMultiplier: 0.8, 
            spawnInterval: 5, 
            pattern: [{ type: 'shieldknight', count: 5 }] 
        }
        // Wave 13
        , { 
            enemyHealth_multiplier: 5, 
            speedMultiplier: 1, 
            spawnInterval: 2, 
            pattern: [{ type: 'waterfrog', count: 1 }] 
        }
        // Wave 14
        , { 
            enemyHealth_multiplier: 2, 
            speedMultiplier: 1, 
            spawnInterval: 1, 
            pattern: [{ type: 'knight', count: 3 }] 
        }
        // Wave 15
        , { 
            enemyHealth_multiplier: 1, 
            speedMultiplier: 1, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'knight', count: 1 }, { type: 'shieldknight', count: 2, healthMultiplier: 2.5 }, { type: 'mage', count: 1, healthMultiplier: 1.4 }, { type: 'shieldknight', count: 1, healthMultiplier: 4 }] 
        }
        // Wave 16
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 1, 
            spawnInterval: 1, 
            pattern: [{ type: 'mage', count: 4, speedMultiplier: 0.6 }] 
        }
        // Wave 17
        , { 
            enemyHealth_multiplier: 4.5, 
            speedMultiplier: 1, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'archer', count: 15 }, { type: 'villager', count: 17 }, { type: 'basic', count: 16 }] 
        }
        // Wave 18
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 1, 
            spawnInterval: 5, 
            pattern: [{ type: 'firefrog', count: 1 }, { type: 'airfrog', count: 1 }, { type: 'waterfrog', count: 1 }, { type: 'earthfrog', count: 1 }] 
        }
        // Wave 19
        , { 
            enemyHealth_multiplier: 5.5, 
            speedMultiplier: 1.5, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'archer', count: 23 }] 
        }
        // Wave 20
        , { 
            enemyHealth_multiplier: 6, 
            speedMultiplier: 1, 
            spawnInterval: 8, 
            pattern: [{ type: 'knight', count: 4 }] 
        }
        // Wave 21
        , { 
            enemyHealth_multiplier: 4.4, 
            speedMultiplier: 1.1, 
            spawnInterval: 1, 
            pattern: [{ type: 'shieldknight', count: 2, healthMultiplier: 3 }, { type: 'mage', count: 1, healthMultiplier: 6 }, { type: 'villager', count: 12 }, { type: 'shieldknight', count: 2, healthMultiplier: 4 }, { type: 'beefyenemy', count: 10 }, { type: 'mage', count: 1 }, { type: 'frog', count: 5, healthMultiplier: 12, speedMultiplier: 1.4 }, { type: 'archer', count: 8, healthMultiplier: 7, speedMultiplier: 1.5 }, { type: 'shieldknight', count: 1, healthMultiplier: 6, speedMultiplier: 1 }] 
        }
        // Wave 22
        , { 
            enemyHealth_multiplier: 1, 
            speedMultiplier: 1, 
            spawnInterval: 2, 
            pattern: [{ type: 'mage', count: 1, healthMultiplier: 3 }, { type: 'firefrog', count: 2, healthMultiplier: 4 }] 
        }
        // Wave 23
        , { 
            enemyHealth_multiplier: 7, 
            speedMultiplier: 1.4, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'frog', count: 22 }] 
        }
        // Wave 24
        , { 
            enemyHealth_multiplier: 2.5, 
            speedMultiplier: 1, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'shieldknight', count: 3, speedMultiplier: 1.2 }, { type: 'beefyenemy', count: 9, healthMultiplier: 6, speedMultiplier: 0.7 }, { type: 'airfrog', count: 1, healthMultiplier: 3 }, { type: 'villager', count: 11 }, { type: 'archer', count: 14, speedMultiplier: 1.4 }, { type: 'knight', count: 1, healthMultiplier: 7, speedMultiplier: 0.5 }] 
        }
        // Wave 25
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 1, 
            spawnInterval: 1, 
            pattern: [{ type: 'mage', count: 1 }, { type: 'waterfrog', count: 2 }, { type: 'mage', count: 1 }, { type: 'airfrog', count: 2 }] 
        }
        // Wave 26
        , { 
            enemyHealth_multiplier: 2.5, 
            speedMultiplier: 1, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'shieldknight', count: 3, speedMultiplier: 1.2 }, { type: 'beefyenemy', count: 8, healthMultiplier: 7 }, { type: 'frog', count: 9 }, { type: 'villager', count: 11 }, { type: 'archer', count: 13, speedMultiplier: 1.4 }, { type: 'knight', count: 1, healthMultiplier: 4, speedMultiplier: 0.5 }, { type: 'earthfrog', count: 1, healthMultiplier: 4 }, { type: 'shieldknight', count: 2, healthMultiplier: 2 }, { type: 'beefyenemy', count: 4, healthMultiplier: 6 }] 
        }
        // Wave 27
        , { 
            enemyHealth_multiplier: 7.5, 
            speedMultiplier: 1, 
            spawnInterval: 3, 
            pattern: [{ type: 'waterfrog', count: 1 }, { type: 'earthfrog', count: 1 }] 
        }
        // Wave 28
        , { 
            enemyHealth_multiplier: 2.5, 
            speedMultiplier: 1, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'mage', count: 3, speedMultiplier: 1.2 }, { type: 'beefyenemy', count: 9, healthMultiplier: 6 }, { type: 'frog', count: 11, healthMultiplier: 4, speedMultiplier: 1.4 }, { type: 'villager', count: 11 }, { type: 'archer', count: 13 }, { type: 'knight', count: 1, healthMultiplier: 7, speedMultiplier: 0.5 }, { type: 'shieldknight', count: 3, healthMultiplier: 4, speedMultiplier: 1.2 }] 
        }
        // Wave 29
        , { 
            enemyHealth_multiplier: 10, 
            speedMultiplier: 0.8, 
            spawnInterval: 3, 
            pattern: [{ type: 'basic', count: 1 }, { type: 'villager', count: 1 }, { type: 'archer', count: 1 }, { type: 'beefyenemy', count: 1 }, { type: 'knight', count: 1, healthMultiplier: 3 }, { type: 'shieldknight', count: 1, healthMultiplier: 5 }, { type: 'mage', count: 1, healthMultiplier: 5 }, { type: 'frog', count: 1 }, { type: 'earthfrog', count: 1 }, { type: 'waterfrog', count: 1 }, { type: 'firefrog', count: 1 }, { type: 'airfrog', count: 1 }] 
        }
        // Wave 30
        , { 
            enemyHealth_multiplier: 14, 
            speedMultiplier: 1, 
            spawnInterval: 1, 
            pattern: [{ type: 'mage', count: 1, healthMultiplier: 8, speedMultiplier: 0.8 }, { type: 'airfrog', count: 1 }, { type: 'earthfrog', count: 1 }, { type: 'waterfrog', count: 1 }] 
        }
        // Wave 31
        , { 
            enemyHealth_multiplier: 2.5, 
            speedMultiplier: 1, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'shieldknight', count: 3, speedMultiplier: 1.2 }, { type: 'beefyenemy', count: 9, healthMultiplier: 5 }, { type: 'frog', count: 14 }, { type: 'villager', count: 11 }, { type: 'archer', count: 13, speedMultiplier: 1.4 }, { type: 'knight', count: 1, healthMultiplier: 6, speedMultiplier: 0.5 }] 
        }
        // Wave 32
        , { 
            enemyHealth_multiplier: 5, 
            speedMultiplier: 1, 
            spawnInterval: 1, 
            pattern: [{ type: 'mage', count: 1 }, { type: 'waterfrog', count: 1 }, { type: 'mage', count: 1 }, { type: 'airfrog', count: 1 }] 
        }
        // Wave 33
        , { 
            enemyHealth_multiplier: 3, 
            speedMultiplier: 1, 
            spawnInterval: 1.2, 
            pattern: [{ type: 'shieldknight', count: 3, speedMultiplier: 1.2 }, { type: 'beefyenemy', count: 7, healthMultiplier: 5, speedMultiplier: 0.7 }, { type: 'frog', count: 10 }, { type: 'villager', count: 5 }, { type: 'archer', count: 8, speedMultiplier: 1.6 }, { type: 'knight', count: 1, healthMultiplier: 7, speedMultiplier: 0.5 }] 
        }
        // Wave 34
        , { 
            enemyHealth_multiplier: 15, 
            speedMultiplier: 1, 
            spawnInterval: 5, 
            pattern: [{ type: 'firefrog', count: 1 }, { type: 'waterfrog', count: 1 }, { type: 'airfrog', count: 1 }, { type: 'earthfrog', count: 1 }] 
        }
        ];

        if (wave > 0 && wave <= waveConfigs.length) {
            return waveConfigs[wave - 1];
        }
        
        return null;
    }
}