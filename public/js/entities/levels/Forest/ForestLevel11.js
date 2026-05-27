import { LevelBase } from '../LevelBase.js';

export class ForestLevel11 extends LevelBase {
    static levelMetadata = {
        name: 'WIP',
        difficulty: 'Easy',
        order: 11,
        campaign: 'forest'
    };

    constructor() {
        super();
        // Derive instance properties from static metadata
        this.levelName = ForestLevel11.levelMetadata.name;
        this.levelNumber = ForestLevel11.levelMetadata.order;
        this.difficulty = ForestLevel11.levelMetadata.difficulty;
        this.campaign = ForestLevel11.levelMetadata.campaign;
        this.maxWaves = 16;

        // Set terrain elements (prevent tower placement on these areas)
        this.terrainElements = [
            { type: 'vegetation', gridX: 7.00, gridY: 3.00, size: 3.4013844477173683, variant: 1 },
            { type: 'vegetation', gridX: 5.00, gridY: 13.00, size: 2.8430021924109212, variant: 3 },
            { type: 'vegetation', gridX: 8.00, gridY: 12.00, size: 3.292238124684098, variant: 1 },
            { type: 'vegetation', gridX: 9.00, gridY: 9.00, size: 2.8261001299529154, variant: 3 },
            { type: 'vegetation', gridX: 6.00, gridY: 11.00, size: 3.301757202427464, variant: 2 },
            { type: 'vegetation', gridX: 4.00, gridY: 1.00, size: 2.6228324666896556, variant: 0 },
            { type: 'vegetation', gridX: 2.00, gridY: 2.00, size: 3.4663603545559276, variant: 3 },
            { type: 'vegetation', gridX: 3.00, gridY: 3.00, size: 2.8923112459283478, variant: 3 },
            { type: 'vegetation', gridX: 10.00, gridY: 9.00, size: 3.059944517640273, variant: 1 },
            { type: 'vegetation', gridX: 11.00, gridY: 10.00, size: 2.916884458745435, variant: 1 },
            { type: 'vegetation', gridX: 9.00, gridY: 11.00, size: 3.2510878072783136, variant: 3 },
            { type: 'vegetation', gridX: 5.00, gridY: 6.00, size: 2.918886722747139, variant: 3 },
            { type: 'vegetation', gridX: 0.00, gridY: 10.00, size: 3.20369803867136, variant: 2 },
            { type: 'vegetation', gridX: 10.00, gridY: 6.00, size: 3.305884817163668, variant: 0 },
            { type: 'vegetation', gridX: 9.00, gridY: 8.00, size: 3.1544327938564396, variant: 3 },
            { type: 'vegetation', gridX: 6.00, gridY: 9.00, size: 3.4217969316573615, variant: 2 },
            { type: 'vegetation', gridX: 0.00, gridY: 19.00, size: 3.0690264985403743, variant: 3 },
            { type: 'vegetation', gridX: 11.00, gridY: 12.00, size: 2.5768752654201403, variant: 0 },
            { type: 'vegetation', gridX: 0.00, gridY: 14.00, size: 2.7426973597427, variant: 0 },
            { type: 'vegetation', gridX: 8.00, gridY: 15.00, size: 3.0620255159578136, variant: 2 },
            { type: 'vegetation', gridX: 8.00, gridY: 10.00, size: 3.1521995915583725, variant: 0 },
            { type: 'vegetation', gridX: 8.00, gridY: 10.00, size: 3.04327398378948, variant: 0 },
            { type: 'vegetation', gridX: 10.00, gridY: 17.00, size: 3.077269461856662, variant: 2 },
            { type: 'vegetation', gridX: 3.00, gridY: 14.00, size: 2.8828575106390684, variant: 2 },
            { type: 'vegetation', gridX: 5.00, gridY: 15.00, size: 3.168410500890345, variant: 1 },
            { type: 'vegetation', gridX: 2.00, gridY: 16.00, size: 2.9350814741021996, variant: 3 },
            { type: 'vegetation', gridX: 8.00, gridY: 11.00, size: 2.7068841105594306, variant: 0 },
            { type: 'vegetation', gridX: 5.00, gridY: 10.00, size: 2.794767641556791, variant: 1 },
            { type: 'vegetation', gridX: 10.00, gridY: 15.00, size: 2.63003969604895, variant: 1 },
            { type: 'vegetation', gridX: 6.00, gridY: 17.00, size: 3.107959544517816, variant: 1 },
            { type: 'vegetation', gridX: 0.00, gridY: 17.00, size: 2.678780163631151, variant: 0 },
            { type: 'vegetation', gridX: 9.00, gridY: 13.00, size: 2.9908516788933803, variant: 2 },
            { type: 'vegetation', gridX: 52.00, gridY: 6.00, size: 3.2774147123950366, variant: 3 },
            { type: 'vegetation', gridX: 50.00, gridY: 12.00, size: 3.3624914280310154, variant: 2 },
            { type: 'vegetation', gridX: 55.00, gridY: 14.00, size: 2.603643785279062, variant: 1 },
            { type: 'vegetation', gridX: 53.00, gridY: 1.00, size: 3.1351653099284844, variant: 0 },
            { type: 'vegetation', gridX: 45.00, gridY: 6.00, size: 3.287612324216603, variant: 2 },
            { type: 'vegetation', gridX: 54.00, gridY: 4.00, size: 3.4437582943931435, variant: 0 },
            { type: 'vegetation', gridX: 51.00, gridY: 3.00, size: 2.8257880053325644, variant: 0 },
            { type: 'vegetation', gridX: 46.00, gridY: 6.00, size: 3.454799088577552, variant: 2 },
            { type: 'vegetation', gridX: 51.00, gridY: 3.00, size: 2.7036910193726476, variant: 3 },
            { type: 'vegetation', gridX: 55.00, gridY: 9.00, size: 3.0483925050941125, variant: 1 },
            { type: 'vegetation', gridX: 59.00, gridY: 5.00, size: 3.4127605427078245, variant: 2 },
            { type: 'vegetation', gridX: 52.00, gridY: 13.00, size: 2.6360125575467954, variant: 2 },
            { type: 'vegetation', gridX: 51.00, gridY: 7.00, size: 3.1951570366274775, variant: 1 },
            { type: 'vegetation', gridX: 54.00, gridY: 9.00, size: 3.3343916097269104, variant: 1 },
            { type: 'vegetation', gridX: 56.00, gridY: 9.00, size: 2.8817869988771676, variant: 3 },
            { type: 'vegetation', gridX: 52.00, gridY: 8.00, size: 3.0926258411237715, variant: 2 },
            { type: 'vegetation', gridX: 57.00, gridY: 25.00, size: 2.8491472896815333, variant: 1 },
            { type: 'vegetation', gridX: 57.00, gridY: 17.00, size: 3.1477687320282235, variant: 1 },
            { type: 'vegetation', gridX: 50.00, gridY: 30.00, size: 3.323947047969686, variant: 1 },
            { type: 'vegetation', gridX: 52.00, gridY: 20.00, size: 2.736196229149369, variant: 2 },
            { type: 'vegetation', gridX: 55.00, gridY: 23.00, size: 3.0225626744043486, variant: 2 },
            { type: 'vegetation', gridX: 46.00, gridY: 24.00, size: 3.024383398444819, variant: 0 },
            { type: 'vegetation', gridX: 49.00, gridY: 27.00, size: 3.2416293853200577, variant: 1 },
            { type: 'vegetation', gridX: 59.00, gridY: 21.00, size: 3.1098630379435646, variant: 3 },
            { type: 'vegetation', gridX: 54.00, gridY: 20.00, size: 3.1721201780095343, variant: 1 },
            { type: 'vegetation', gridX: 45.00, gridY: 24.00, size: 2.8839332955281067, variant: 3 },
            { type: 'vegetation', gridX: 58.00, gridY: 20.00, size: 2.692813369173856, variant: 0 },
            { type: 'vegetation', gridX: 51.00, gridY: 21.00, size: 2.9148957305110397, variant: 0 },
            { type: 'vegetation', gridX: 56.00, gridY: 24.00, size: 2.532934870739673, variant: 3 },
            { type: 'vegetation', gridX: 51.00, gridY: 20.00, size: 2.6734393646744983, variant: 0 },
            { type: 'vegetation', gridX: 51.00, gridY: 29.00, size: 3.262087743713817, variant: 1 },
            { type: 'vegetation', gridX: 48.00, gridY: 23.00, size: 3.2705170068554557, variant: 0 },
            { type: 'vegetation', gridX: 44.00, gridY: 31.00, size: 2.5895269635616276, variant: 3 },
            { type: 'vegetation', gridX: 44.00, gridY: 28.00, size: 3.478436482156445, variant: 0 },
            { type: 'vegetation', gridX: 45.00, gridY: 31.00, size: 2.6202939992918344, variant: 3 },
            { type: 'vegetation', gridX: 46.00, gridY: 32.00, size: 3.471873697160415, variant: 1 },
            { type: 'vegetation', gridX: 46.00, gridY: 32.00, size: 3.4365195569705547, variant: 0 },
            { type: 'vegetation', gridX: 47.00, gridY: 28.00, size: 2.762957142296939, variant: 3 },
            { type: 'vegetation', gridX: 59.00, gridY: 32.00, size: 2.7480542265853245, variant: 3 },
            { type: 'vegetation', gridX: 56.00, gridY: 30.00, size: 2.8758069040066, variant: 2 },
            { type: 'vegetation', gridX: 57.00, gridY: 31.00, size: 2.595523194366965, variant: 3 },
            { type: 'vegetation', gridX: 58.00, gridY: 29.00, size: 2.6185572208838606, variant: 2 },
            { type: 'vegetation', gridX: 57.00, gridY: 32.75, size: 3.47705244969911, variant: 1 },
            { type: 'vegetation', gridX: 57.00, gridY: 29.00, size: 3.420827274761677, variant: 0 },
            { type: 'vegetation', gridX: 39.00, gridY: 32.75, size: 2.5929834062468613, variant: 1 },
            { type: 'vegetation', gridX: 41.00, gridY: 32.75, size: 2.8662339830928785, variant: 0 },
            { type: 'vegetation', gridX: 42.00, gridY: 32.00, size: 3.0561170058110854, variant: 0 },
            { type: 'vegetation', gridX: 43.00, gridY: 32.00, size: 2.53926932786212, variant: 2 },
            { type: 'vegetation', gridX: 39.00, gridY: 29.00, size: 2.509327468850191, variant: 1 },
            { type: 'vegetation', gridX: 41.00, gridY: 32.00, size: 3.2341177888656585, variant: 0 },
            { type: 'vegetation', gridX: 15.00, gridY: 4.00, size: 2.9252226348564085, variant: 0 },
            { type: 'vegetation', gridX: 11.00, gridY: 1.00, size: 2.5576620616444163, variant: 0 },
            { type: 'vegetation', gridX: 14.00, gridY: 1.00, size: 3.2081579200850836, variant: 1 },
            { type: 'vegetation', gridX: 13.00, gridY: 4.00, size: 2.704113624349514, variant: 0 },
            { type: 'vegetation', gridX: 12.00, gridY: 6.00, size: 2.72926751482454, variant: 0 },
            { type: 'vegetation', gridX: 12.00, gridY: 5.00, size: 3.3608041637742745, variant: 0 },
            { type: 'vegetation', gridX: 3.00, gridY: 23.00, size: 2.966723958663534, variant: 0 },
            { type: 'vegetation', gridX: 5.00, gridY: 20.00, size: 3.201902647631388, variant: 0 },
            { type: 'vegetation', gridX: 1.00, gridY: 22.00, size: 2.5049624909115114, variant: 2 },
            { type: 'vegetation', gridX: 5.00, gridY: 21.00, size: 3.1224503389445357, variant: 3 },
            { type: 'vegetation', gridX: 2.00, gridY: 19.00, size: 3.0312257546349515, variant: 1 },
            { type: 'vegetation', gridX: 6.00, gridY: 22.00, size: 2.795657967862661, variant: 1 }
        ];
    }

    createMeanderingPath(canvasWidth, canvasHeight) {
        const gridWidth = this.gridWidth || 60;
        const gridHeight = this.gridHeight || 33.75;

        const pathInGridCoords = [
            { gridX: 0.00, gridY: 29.00 },
            { gridX: 12.00, gridY: 29.00 },
            { gridX: 23.00, gridY: 17.00 },
            { gridX: 32.00, gridY: 17.00 },
            { gridX: 32.00, gridY: 25.00 },
            { gridX: 39.00, gridY: 25.00 },
            { gridX: 39.00, gridY: 11.00 },
            { gridX: 23.00, gridY: 11.00 }
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
            speedMultiplier: 0.6, 
            spawnInterval: 2, 
            pattern: [{ type: 'basic', count: 5 }, { type: 'villager', count: 5 }] 
        }
        // Wave 2
        , { 
            enemyHealth_multiplier: 1, 
            speedMultiplier: 0.6, 
            spawnInterval: 1.8, 
            pattern: [{ type: 'basic', count: 6 }, { type: 'villager', count: 6 }] 
        }
        // Wave 3
        , { 
            enemyHealth_multiplier: 1.1, 
            speedMultiplier: 0.7, 
            spawnInterval: 1.5, 
            pattern: [{ type: 'basic', count: 8 }, { type: 'villager', count: 8 }] 
        }
        // Wave 4
        , { 
            enemyHealth_multiplier: 1.2, 
            speedMultiplier: 3.33, 
            spawnInterval: 3, 
            pattern: [{ type: 'archer', count: 22 }] 
        }
        // Wave 5
        , { 
            enemyHealth_multiplier: 2, 
            speedMultiplier: 0.75, 
            spawnInterval: 5, 
            pattern: [{ type: 'beefyenemy', count: 9 }] 
        }
        // Wave 6
        , { 
            enemyHealth_multiplier: 1.8, 
            speedMultiplier: 1, 
            spawnInterval: 2, 
            pattern: [{ type: 'basic', count: 8 }, { type: 'villager', count: 8 }, { type: 'archer', count: 8 }] 
        }
        // Wave 7
        , { 
            enemyHealth_multiplier: 2, 
            speedMultiplier: 3.33, 
            spawnInterval: 1.5, 
            pattern: [{ type: 'archer', count: 15 }] 
        }
        // Wave 8
        , { 
            enemyHealth_multiplier: 1.5, 
            speedMultiplier: 0.9, 
            spawnInterval: 2, 
            pattern: [{ type: 'basic', count: 15 }, { type: 'villager', count: 15 }] 
        }
        // Wave 9
        , { 
            enemyHealth_multiplier: 3, 
            speedMultiplier: 0.83, 
            spawnInterval: 6.5, 
            pattern: [{ type: 'beefyenemy', count: 16 }] 
        }
        // Wave 10
        , { 
            enemyHealth_multiplier: 1.8, 
            speedMultiplier: 1.88, 
            spawnInterval: 7, 
            pattern: [{ type: 'knight', count: 1 }] 
        }
        // Wave 11
        , { 
            enemyHealth_multiplier: 2, 
            speedMultiplier: 1.42, 
            spawnInterval: 3, 
            pattern: [{ type: 'archer', count: 35 }] 
        }
        // Wave 12
        , { 
            enemyHealth_multiplier: 9, 
            speedMultiplier: 0.58, 
            spawnInterval: 4.5, 
            pattern: [{ type: 'beefyenemy', count: 5 }] 
        }
        // Wave 13
        , { 
            enemyHealth_multiplier: 2, 
            speedMultiplier: 0.7, 
            spawnInterval: 1, 
            pattern: [{ type: 'basic', count: 18 }, { type: 'villager', count: 17 }] 
        }
        // Wave 14
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 0.88, 
            spawnInterval: 1.5, 
            pattern: [{ type: 'knight', count: 2 }] 
        }
        // Wave 15
        , { 
            enemyHealth_multiplier: 5, 
            speedMultiplier: 0.88, 
            spawnInterval: 1, 
            pattern: [{ type: 'knight', count: 1 }] 
        }
        // Wave 16
        , { 
            enemyHealth_multiplier: 7, 
            speedMultiplier: 0.88, 
            spawnInterval: 1, 
            pattern: [{ type: 'knight', count: 1 }] 
        }
        ];

        if (wave > 0 && wave <= waveConfigs.length) {
            return waveConfigs[wave - 1];
        }
        
        return null;
    }
}