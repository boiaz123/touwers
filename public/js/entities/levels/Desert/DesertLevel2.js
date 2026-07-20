import { LevelBase } from '../LevelBase.js';

export class DesertLevel2 extends LevelBase {
    static levelMetadata = {
        name: 'Hadrahir Gorge',
        difficulty: 'Hard',
        order: 2,
        campaign: 'desert'
    };

    constructor() {
        super();
        // Derive instance properties from static metadata
        this.levelName = DesertLevel2.levelMetadata.name;
        this.levelNumber = DesertLevel2.levelMetadata.order;
        this.difficulty = DesertLevel2.levelMetadata.difficulty;
        this.campaign = DesertLevel2.levelMetadata.campaign;
        this.maxWaves = 24;

        // Set terrain elements (prevent tower placement on these areas)
        this.terrainElements = [
            { type: 'water', gridX: 0.00, gridY: 9.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 1.00, gridY: 9.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 2.00, gridY: 9.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 3.00, gridY: 8.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 4.00, gridY: 8.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 5.00, gridY: 8.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 6.00, gridY: 8.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 7.00, gridY: 7.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 7.00, gridY: 7.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 8.00, gridY: 7.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 9.00, gridY: 7.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 10.00, gridY: 7.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 11.00, gridY: 6.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 12.00, gridY: 6.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 13.00, gridY: 6.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 13.00, gridY: 6.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 14.00, gridY: 6.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 15.00, gridY: 6.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 16.00, gridY: 6.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 17.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 18.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 19.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 20.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 21.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 22.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 23.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 23.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 24.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 24.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 25.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 26.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 27.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 28.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 29.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 30.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 31.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 32.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 33.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 34.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 34.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 35.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 36.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 37.00, gridY: 6.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 37.00, gridY: 6.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 38.00, gridY: 6.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 39.00, gridY: 6.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 40.00, gridY: 6.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 41.00, gridY: 6.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 42.00, gridY: 7.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 43.00, gridY: 7.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 44.00, gridY: 7.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 44.00, gridY: 7.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 45.00, gridY: 7.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 46.00, gridY: 7.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 47.00, gridY: 7.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 48.00, gridY: 7.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 49.00, gridY: 7.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 49.00, gridY: 7.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 50.00, gridY: 7.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 51.00, gridY: 7.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 51.00, gridY: 7.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 52.00, gridY: 7.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 53.00, gridY: 6.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 54.00, gridY: 6.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 55.00, gridY: 6.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 56.00, gridY: 6.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 57.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 58.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 59.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 60.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'rock', gridX: 46.00, gridY: 32.00, size: 2, variant: 0 },
            { type: 'rock', gridX: 56.00, gridY: 28.00, size: 2, variant: 0 },
            { type: 'rock', gridX: 10.00, gridY: 32.00, size: 2, variant: 0 },
            { type: 'rock', gridX: 18.00, gridY: 30.00, size: 2.5, variant: 0 },
            { type: 'rock', gridX: 58.00, gridY: 32.00, size: 2.5, variant: 0 },
            { type: 'rock', gridX: 55.00, gridY: 24.00, size: 3.5, variant: 0 },
            { type: 'rock', gridX: 14.00, gridY: 16.00, size: 3.5, variant: 0 },
            { type: 'rock', gridX: 26.00, gridY: 32.00, size: 3.5, variant: 1 },
            { type: 'rock', gridX: 52.00, gridY: 31.00, size: 3.5, variant: 1 },
            { type: 'rock', gridX: 19.00, gridY: 33.00, size: 1.5, variant: 1 },
            { type: 'rock', gridX: 5.00, gridY: 31.00, size: 1.5, variant: 1 },
            { type: 'rock', gridX: 11.00, gridY: 19.00, size: 1.5, variant: 1 },
            { type: 'rock', gridX: 52.00, gridY: 28.00, size: 1.5, variant: 1 },
            { type: 'rock', gridX: 58.00, gridY: 22.00, size: 1.5, variant: 1 },
            { type: 'rock', gridX: 45.00, gridY: 28.00, size: 4, variant: 1 },
            { type: 'rock', gridX: 39.00, gridY: 19.00, size: 4, variant: 2 },
            { type: 'rock', gridX: 1.00, gridY: 4.00, size: 3, variant: 2 },
            { type: 'rock', gridX: 52.00, gridY: 5.00, size: 3, variant: 2 },
            { type: 'rock', gridX: 25.00, gridY: 7.00, size: 2, variant: 2 },
            { type: 'rock', gridX: 57.00, gridY: 25.00, size: 2, variant: 2 },
            { type: 'rock', gridX: 36.00, gridY: 32.00, size: 2, variant: 2 },
            { type: 'rock', gridX: 14.00, gridY: 33.00, size: 2, variant: 3 },
            { type: 'rock', gridX: 2.00, gridY: 13.00, size: 2, variant: 3 },
            { type: 'rock', gridX: 57.00, gridY: 10.00, size: 2, variant: 3 },
            { type: 'rock', gridX: 8.00, gridY: 5.00, size: 3, variant: 3 },
            { type: 'rock', gridX: 55.00, gridY: 2.00, size: 3, variant: 3 },
            { type: 'rock', gridX: 33.00, gridY: 13.00, size: 3.5, variant: 3 },
            { type: 'rock', gridX: 15.00, gridY: 1.00, size: 3.5, variant: 1 },
            { type: 'vegetation', gridX: 17.00, gridY: 12.00, size: 2.90187793906837, variant: 2 },
            { type: 'vegetation', gridX: 15.00, gridY: 11.00, size: 2.7767982569474343, variant: 0 },
            { type: 'vegetation', gridX: 21.00, gridY: 10.00, size: 2.410651569697487, variant: 2 },
            { type: 'vegetation', gridX: 16.00, gridY: 4.00, size: 2.5537305632143994, variant: 2 },
            { type: 'vegetation', gridX: 19.00, gridY: 13.00, size: 1.6591208263389012, variant: 2 },
            { type: 'vegetation', gridX: 18.00, gridY: 12.00, size: 1.128093893203503, variant: 2 },
            { type: 'vegetation', gridX: 17.00, gridY: 10.00, size: 2.330302889496461, variant: 0 },
            { type: 'vegetation', gridX: 21.00, gridY: 11.00, size: 2.127602540970571, variant: 0 },
            { type: 'vegetation', gridX: 21.00, gridY: 15.00, size: 1.2321240099166466, variant: 0 },
            { type: 'vegetation', gridX: 19.00, gridY: 16.00, size: 1.52716785254509, variant: 2 },
            { type: 'vegetation', gridX: 42.00, gridY: 5.00, size: 2.4125148921893333, variant: 2 },
            { type: 'vegetation', gridX: 43.00, gridY: 3.00, size: 2.9962549954337288, variant: 0 },
            { type: 'vegetation', gridX: 42.00, gridY: 4.00, size: 2.2381610500444946, variant: 2 },
            { type: 'vegetation', gridX: 45.00, gridY: 4.00, size: 1.5732949238697902, variant: 0 },
            { type: 'vegetation', gridX: 43.00, gridY: 6.00, size: 2.5924883842497812, variant: 0 },
            { type: 'vegetation', gridX: 43.00, gridY: 5.00, size: 2.872506612177662, variant: 2 },
            { type: 'vegetation', gridX: 56.00, gridY: 11.00, size: 2.4547466105551963, variant: 2 },
            { type: 'vegetation', gridX: 58.00, gridY: 9.00, size: 1.827015502463822, variant: 2 },
            { type: 'vegetation', gridX: 54.00, gridY: 11.00, size: 2.374111383854122, variant: 0 },
            { type: 'vegetation', gridX: 57.00, gridY: 11.00, size: 2.6960744645444628, variant: 0 },
            { type: 'vegetation', gridX: 54.00, gridY: 10.00, size: 1.0589997067649066, variant: 0 },
            { type: 'vegetation', gridX: 2.00, gridY: 5.00, size: 2.00591966980293, variant: 0 },
            { type: 'vegetation', gridX: 4.00, gridY: 4.00, size: 1.9758570188098123, variant: 0 },
            { type: 'vegetation', gridX: 6.00, gridY: 4.00, size: 2.3320925422229437, variant: 2 },
            { type: 'vegetation', gridX: 2.00, gridY: 3.00, size: 1.303338664805594, variant: 0 },
            { type: 'vegetation', gridX: 6.00, gridY: 4.00, size: 1.29163751465913, variant: 2 },
            { type: 'vegetation', gridX: 1.00, gridY: 4.00, size: 1.0495063835843592, variant: 0 },
            { type: 'vegetation', gridX: 51.00, gridY: 28.00, size: 2.983359064975218, variant: 2 },
            { type: 'vegetation', gridX: 53.00, gridY: 29.00, size: 2.126503448462797, variant: 2 },
            { type: 'vegetation', gridX: 51.00, gridY: 26.00, size: 2.2755999514348955, variant: 1 },
            { type: 'vegetation', gridX: 54.00, gridY: 26.00, size: 1.0248017483451666, variant: 1 },
            { type: 'vegetation', gridX: 51.00, gridY: 25.00, size: 1.3248710615045125, variant: 3 },
            { type: 'vegetation', gridX: 51.00, gridY: 25.00, size: 1.1127618091631244, variant: 3 },
            { type: 'vegetation', gridX: 37.00, gridY: 31.00, size: 1.1807522876670975, variant: 0 },
            { type: 'vegetation', gridX: 40.00, gridY: 31.00, size: 2.815875975376329, variant: 2 },
            { type: 'vegetation', gridX: 39.00, gridY: 32.00, size: 1.9185755609177828, variant: 2 },
            { type: 'vegetation', gridX: 41.00, gridY: 31.00, size: 2.0534894171101725, variant: 0 },
            { type: 'vegetation', gridX: 38.00, gridY: 32.75, size: 2.8508348335024793, variant: 0 },
            { type: 'vegetation', gridX: 38.00, gridY: 30.00, size: 1.1522311768556392, variant: 1 },
            { type: 'vegetation', gridX: 1.00, gridY: 32.75, size: 2.2807279156941362, variant: 0 },
            { type: 'vegetation', gridX: 2.00, gridY: 31.00, size: 2.0466143107444594, variant: 3 },
            { type: 'vegetation', gridX: 3.00, gridY: 32.75, size: 2.79261824817005, variant: 3 },
            { type: 'vegetation', gridX: 14.00, gridY: 32.75, size: 1.145271106841759, variant: 3 },
            { type: 'vegetation', gridX: 13.00, gridY: 32.00, size: 1.1144727274798625, variant: 1 },
            { type: 'vegetation', gridX: 16.00, gridY: 31.00, size: 2.0629372968910724, variant: 1 },
            { type: 'vegetation', gridX: 14.00, gridY: 32.75, size: 2.8423484680110613, variant: 2 },
            { type: 'vegetation', gridX: 29.00, gridY: 30.00, size: 1.0890933491035455, variant: 0 },
            { type: 'vegetation', gridX: 33.00, gridY: 31.00, size: 2.541559989909093, variant: 1 },
            { type: 'vegetation', gridX: 31.00, gridY: 32.00, size: 1.4408564242628843, variant: 3 },
            { type: 'vegetation', gridX: 34.00, gridY: 32.00, size: 1.9255581472530898, variant: 1 },
            { type: 'vegetation', gridX: 28.00, gridY: 31.00, size: 2.116583822691899, variant: 2 },
            { type: 'vegetation', gridX: 28.00, gridY: 32.00, size: 2.6857361667395168, variant: 1 },
            { type: 'rock', gridX: 55.00, gridY: 11.00, size: 3.5, variant: 3 }
        ];
    }

    createMeanderingPath(canvasWidth, canvasHeight) {
        const gridWidth = this.gridWidth || 60;
        const gridHeight = this.gridHeight || 33.75;

        const pathInGridCoords = [
            { gridX: 0.00, gridY: 27.00 },
            { gridX: 14.00, gridY: 27.00 },
            { gridX: 19.00, gridY: 21.00 },
            { gridX: 29.00, gridY: 21.00 },
            { gridX: 33.00, gridY: 22.00 },
            { gridX: 40.00, gridY: 22.00 },
            { gridX: 45.00, gridY: 15.00 },
            { gridX: 54.00, gridY: 15.00 }
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
            speedMultiplier: 0.85, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'archer', count: 3 }, { type: 'villager', count: 10 }, { type: 'basic', count: 5 }, { type: 'frog', count: 5 }] 
        }
        // Wave 2
        , { 
            enemyHealth_multiplier: 1.3, 
            speedMultiplier: 0.85, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'villager', count: 6 }, { type: 'basic', count: 8 }, { type: 'knight', count: 1 }] 
        }
        // Wave 3
        , { 
            enemyHealth_multiplier: 1.1, 
            speedMultiplier: 1, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'frog', count: 25 }] 
        }
        // Wave 4
        , { 
            enemyHealth_multiplier: 2, 
            speedMultiplier: 1, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'mage', count: 1 }] 
        }
        // Wave 5
        , { 
            enemyHealth_multiplier: 0.7, 
            speedMultiplier: 1.3, 
            spawnInterval: 2, 
            pattern: [{ type: 'beefyenemy', count: 10 }] 
        }
        // Wave 6
        , { 
            enemyHealth_multiplier: 2, 
            speedMultiplier: 1.1, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'mage', count: 1 }, { type: 'frog', count: 12 }] 
        }
        // Wave 7
        , { 
            enemyHealth_multiplier: 1, 
            speedMultiplier: 0.8, 
            spawnInterval: 1.2, 
            pattern: [{ type: 'shieldknight', count: 1 }, { type: 'beefyenemy', count: 4, healthMultiplier: 1.5 }] 
        }
        // Wave 8
        , { 
            enemyHealth_multiplier: 2.2, 
            speedMultiplier: 1.2, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'villager', count: 16 }, { type: 'basic', count: 15 }, { type: 'frog', count: 16 }] 
        }
        // Wave 9
        , { 
            enemyHealth_multiplier: 1.8, 
            speedMultiplier: 1, 
            spawnInterval: 0.5, 
            pattern: [{ type: 'archer', count: 16, speedMultiplier: 1.2 }, { type: 'villager', count: 10 }, { type: 'basic', count: 10 }] 
        }
        // Wave 10
        , { 
            enemyHealth_multiplier: 4.6, 
            speedMultiplier: 1, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'shieldknight', count: 4, healthMultiplier: 2 }, { type: 'beefyenemy', count: 5, healthMultiplier: 2 }] 
        }
        // Wave 11
        , { 
            enemyHealth_multiplier: 2.2, 
            speedMultiplier: 1.4, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'archer', count: 23 }, { type: 'frog', count: 16, speedMultiplier: 1.6 }] 
        }
        // Wave 12
        , { 
            enemyHealth_multiplier: 2, 
            speedMultiplier: 1, 
            spawnInterval: 0.5, 
            pattern: [{ type: 'mage', count: 1 }, { type: 'frog', count: 20, healthMultiplier: 4, speedMultiplier: 1.3 }] 
        }
        // Wave 13
        , { 
            enemyHealth_multiplier: 5, 
            speedMultiplier: 1.2, 
            spawnInterval: 0.5, 
            pattern: [{ type: 'frog', count: 8 }, { type: 'basic', count: 7 }, { type: 'archer', count: 6, speedMultiplier: 1 }, { type: 'beefyenemy', count: 3, healthMultiplier: 2 }, { type: 'shieldknight', count: 2, healthMultiplier: 2 }] 
        }
        // Wave 14
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 1, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'shieldknight', count: 5 }, { type: 'beefyenemy', count: 5 }, { type: 'knight', count: 2, healthMultiplier: 2 }] 
        }
        // Wave 15
        , { 
            enemyHealth_multiplier: 3, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'knight', count: 3, healthMultiplier: 2 }, { type: 'frog', count: 12 }, { type: 'mage', count: 2 }] 
        }
        // Wave 16
        , { 
            enemyHealth_multiplier: 2, 
            speedMultiplier: 1, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'knight', count: 3 }] 
        }
        // Wave 17
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 1, 
            spawnInterval: 3, 
            pattern: [{ type: 'mage', count: 7 }] 
        }
        // Wave 18
        , { 
            enemyHealth_multiplier: 2.5, 
            speedMultiplier: 0.9, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'archer', count: 16 }, { type: 'villager', count: 15 }, { type: 'basic', count: 14 }] 
        }
        // Wave 19
        , { 
            enemyHealth_multiplier: 7, 
            speedMultiplier: 1.4, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'archer', count: 24 }] 
        }
        // Wave 20
        , { 
            enemyHealth_multiplier: 8, 
            speedMultiplier: 0.8, 
            spawnInterval: 0.1, 
            pattern: [{ type: 'knight', count: 1 }] 
        }
        // Wave 21
        , { 
            enemyHealth_multiplier: 5, 
            speedMultiplier: 1, 
            spawnInterval: 1, 
            pattern: [{ type: 'mage', count: 1, speedMultiplier: 0.8 }, { type: 'villager', count: 12 }, { type: 'basic', count: 8 }, { type: 'archer', count: 6 }, { type: 'beefyenemy', count: 6 }] 
        }
        // Wave 22
        , { 
            enemyHealth_multiplier: 6, 
            speedMultiplier: 0.75, 
            spawnInterval: 5, 
            pattern: [{ type: 'knight', count: 3 }] 
        }
        // Wave 23
        , { 
            enemyHealth_multiplier: 2.5, 
            speedMultiplier: 1, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'shieldknight', count: 4 }, { type: 'beefyenemy', count: 7, healthMultiplier: 6 }, { type: 'frog', count: 16 }, { type: 'villager', count: 8 }, { type: 'archer', count: 9 }, { type: 'knight', count: 3, healthMultiplier: 3, speedMultiplier: 0.5 }, { type: 'mage', count: 1 }] 
        }
        // Wave 24
        , { 
            enemyHealth_multiplier: 10, 
            speedMultiplier: 1, 
            spawnInterval: 0.3, 
            pattern: [{ type: 'waterfrog', count: 1 }] 
        }
        ];

        if (wave > 0 && wave <= waveConfigs.length) {
            return waveConfigs[wave - 1];
        }
        
        return null;
    }
}