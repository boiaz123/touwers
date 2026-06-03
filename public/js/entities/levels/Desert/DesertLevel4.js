import { LevelBase } from '../LevelBase.js';

export class DesertLevel4 extends LevelBase {
    static levelMetadata = {
        name: 'Sandy dunes of Azrat',
        difficulty: 'Hard',
        order: 4,
        campaign: 'desert'
    };

    constructor() {
        super();
        // Derive instance properties from static metadata
        this.levelName = DesertLevel4.levelMetadata.name;
        this.levelNumber = DesertLevel4.levelMetadata.order;
        this.difficulty = DesertLevel4.levelMetadata.difficulty;
        this.campaign = DesertLevel4.levelMetadata.campaign;
        this.maxWaves = 16;

        // Set terrain elements (prevent tower placement on these areas)
        this.terrainElements = [
            { type: 'vegetation', gridX: 1.00, gridY: 5.00, size: 1.3079195774723988, variant: 2 },
            { type: 'vegetation', gridX: 7.00, gridY: 10.00, size: 1.8560784508388208, variant: 0 },
            { type: 'vegetation', gridX: 7.00, gridY: 11.00, size: 3.9194460537082496, variant: 2 },
            { type: 'vegetation', gridX: 5.00, gridY: 3.00, size: 3.3592187245038705, variant: 1 },
            { type: 'vegetation', gridX: 3.00, gridY: 7.00, size: 2.197461105476628, variant: 1 },
            { type: 'vegetation', gridX: 6.00, gridY: 3.00, size: 3.079351451315905, variant: 3 },
            { type: 'vegetation', gridX: 6.00, gridY: 6.00, size: 1.0684007013376497, variant: 1 },
            { type: 'vegetation', gridX: 6.00, gridY: 7.00, size: 1.9072764525701635, variant: 0 },
            { type: 'vegetation', gridX: 7.00, gridY: 9.00, size: 1.5334181497707002, variant: 2 },
            { type: 'vegetation', gridX: 3.00, gridY: 6.00, size: 3.932055454017912, variant: 3 },
            { type: 'vegetation', gridX: 11.00, gridY: 7.00, size: 3.1286016146732343, variant: 2 },
            { type: 'vegetation', gridX: 15.00, gridY: 7.00, size: 1.0651222040847914, variant: 3 },
            { type: 'vegetation', gridX: 9.00, gridY: 3.00, size: 1.23561918367681, variant: 3 },
            { type: 'vegetation', gridX: 9.00, gridY: 8.00, size: 2.76129567666061, variant: 1 },
            { type: 'vegetation', gridX: 13.00, gridY: 5.00, size: 1.6683616316538052, variant: 0 },
            { type: 'vegetation', gridX: 15.00, gridY: 4.00, size: 2.0540147281710324, variant: 1 },
            { type: 'vegetation', gridX: 2.00, gridY: 15.00, size: 1.65284098337871, variant: 0 },
            { type: 'vegetation', gridX: 5.00, gridY: 15.00, size: 1.6965917651008544, variant: 1 },
            { type: 'vegetation', gridX: 6.00, gridY: 11.00, size: 3.697243889356731, variant: 3 },
            { type: 'vegetation', gridX: 7.00, gridY: 18.00, size: 3.3538558539673367, variant: 0 },
            { type: 'vegetation', gridX: 5.00, gridY: 16.00, size: 2.9720657500276335, variant: 0 },
            { type: 'vegetation', gridX: 8.00, gridY: 15.00, size: 1.365305066335619, variant: 2 },
            { type: 'vegetation', gridX: 2.00, gridY: 12.00, size: 2.6396281712269194, variant: 1 },
            { type: 'vegetation', gridX: 4.00, gridY: 16.00, size: 3.539740324890204, variant: 1 },
            { type: 'vegetation', gridX: 1.00, gridY: 19.00, size: 3.895223242053406, variant: 3 },
            { type: 'vegetation', gridX: 4.00, gridY: 14.00, size: 2.6276943016806733, variant: 2 },
            { type: 'vegetation', gridX: 54.00, gridY: 8.00, size: 2.713334431772998, variant: 1 },
            { type: 'vegetation', gridX: 59.00, gridY: 7.00, size: 3.8142787618990823, variant: 3 },
            { type: 'vegetation', gridX: 53.00, gridY: 7.00, size: 2.0230212752048455, variant: 2 },
            { type: 'vegetation', gridX: 55.00, gridY: 5.00, size: 2.430158992143614, variant: 0 },
            { type: 'vegetation', gridX: 53.00, gridY: 3.00, size: 1.2033618126843955, variant: 0 },
            { type: 'vegetation', gridX: 58.00, gridY: 2.00, size: 2.7333837059534103, variant: 0 },
            { type: 'vegetation', gridX: 52.00, gridY: 7.00, size: 2.922510664649633, variant: 0 },
            { type: 'vegetation', gridX: 57.00, gridY: 12.00, size: 2.8792821581407506, variant: 2 },
            { type: 'vegetation', gridX: 51.00, gridY: 13.00, size: 1.2190597493564197, variant: 0 },
            { type: 'vegetation', gridX: 53.00, gridY: 10.00, size: 3.5295254221940535, variant: 1 },
            { type: 'vegetation', gridX: 53.00, gridY: 18.00, size: 3.8966927521046464, variant: 1 },
            { type: 'vegetation', gridX: 53.00, gridY: 19.00, size: 2.7249515430735527, variant: 3 },
            { type: 'vegetation', gridX: 52.00, gridY: 13.00, size: 1.9759632868235408, variant: 0 },
            { type: 'vegetation', gridX: 58.00, gridY: 15.00, size: 1.237440162493348, variant: 2 },
            { type: 'vegetation', gridX: 50.00, gridY: 16.00, size: 2.681304687454916, variant: 1 },
            { type: 'vegetation', gridX: 55.00, gridY: 16.00, size: 3.254470260442985, variant: 2 },
            { type: 'vegetation', gridX: 54.00, gridY: 11.00, size: 3.246662084506407, variant: 3 },
            { type: 'vegetation', gridX: 49.00, gridY: 29.00, size: 1.982330998916754, variant: 3 },
            { type: 'vegetation', gridX: 46.00, gridY: 28.00, size: 1.0520103833730283, variant: 2 },
            { type: 'vegetation', gridX: 45.00, gridY: 30.00, size: 3.162189003075657, variant: 0 },
            { type: 'vegetation', gridX: 50.00, gridY: 31.00, size: 2.1486676688870814, variant: 3 },
            { type: 'vegetation', gridX: 51.00, gridY: 26.00, size: 1.6502042710782374, variant: 2 },
            { type: 'vegetation', gridX: 46.00, gridY: 29.00, size: 3.4603665277497706, variant: 3 },
            { type: 'vegetation', gridX: 46.00, gridY: 31.00, size: 2.411322532310046, variant: 1 },
            { type: 'vegetation', gridX: 49.00, gridY: 29.00, size: 1.6524127272829507, variant: 2 },
            { type: 'vegetation', gridX: 52.00, gridY: 26.00, size: 2.898988222205891, variant: 0 },
            { type: 'vegetation', gridX: 46.00, gridY: 31.00, size: 1.434826393770466, variant: 2 },
            { type: 'vegetation', gridX: 59.00, gridY: 25.00, size: 3.2014004525726882, variant: 0 },
            { type: 'vegetation', gridX: 56.00, gridY: 21.00, size: 1.56460504957046, variant: 2 },
            { type: 'vegetation', gridX: 57.00, gridY: 19.00, size: 2.959342554271466, variant: 0 },
            { type: 'vegetation', gridX: 54.00, gridY: 27.00, size: 3.720451236487323, variant: 1 },
            { type: 'vegetation', gridX: 56.00, gridY: 26.00, size: 1.5524241932569356, variant: 0 },
            { type: 'vegetation', gridX: 55.00, gridY: 20.00, size: 2.720526887713541, variant: 0 },
            { type: 'vegetation', gridX: 59.00, gridY: 22.00, size: 1.9486195686695265, variant: 2 },
            { type: 'vegetation', gridX: 58.00, gridY: 24.00, size: 3.72694112445861, variant: 1 },
            { type: 'vegetation', gridX: 55.00, gridY: 24.00, size: 2.9100763221141133, variant: 2 },
            { type: 'vegetation', gridX: 5.00, gridY: 25.00, size: 3.530970585369097, variant: 2 },
            { type: 'vegetation', gridX: 9.00, gridY: 29.00, size: 1.1569532474397897, variant: 2 },
            { type: 'vegetation', gridX: 4.00, gridY: 26.00, size: 1.2123996788252827, variant: 3 },
            { type: 'vegetation', gridX: 6.00, gridY: 32.75, size: 2.9600003674832576, variant: 3 },
            { type: 'vegetation', gridX: 3.00, gridY: 28.00, size: 1.0115406014105486, variant: 3 },
            { type: 'vegetation', gridX: 2.00, gridY: 28.00, size: 2.0307991145951854, variant: 3 },
            { type: 'vegetation', gridX: 4.00, gridY: 32.00, size: 1.5733029576182598, variant: 1 },
            { type: 'vegetation', gridX: 11.00, gridY: 22.00, size: 2.7965246813703977, variant: 1 },
            { type: 'vegetation', gridX: 8.00, gridY: 21.00, size: 2.524142447318443, variant: 0 },
            { type: 'vegetation', gridX: 9.00, gridY: 20.00, size: 1.1841220557944516, variant: 0 },
            { type: 'vegetation', gridX: 8.00, gridY: 17.00, size: 1.363494387504485, variant: 3 },
            { type: 'vegetation', gridX: 9.00, gridY: 16.00, size: 1.5794598224598033, variant: 1 },
            { type: 'vegetation', gridX: 6.00, gridY: 19.00, size: 2.7378865208373355, variant: 3 },
            { type: 'vegetation', gridX: 12.00, gridY: 23.00, size: 2.5926643126880053, variant: 0 },
            { type: 'vegetation', gridX: 8.00, gridY: 20.00, size: 3.6273125816439458, variant: 2 },
            { type: 'rock', gridX: 2.00, gridY: 8.00, size: 2, variant: 0 },
            { type: 'rock', gridX: 2.00, gridY: 25.00, size: 2, variant: 0 },
            { type: 'rock', gridX: 9.00, gridY: 31.00, size: 2, variant: 0 },
            { type: 'rock', gridX: 57.00, gridY: 31.00, size: 2, variant: 0 },
            { type: 'rock', gridX: 51.00, gridY: 21.00, size: 2, variant: 0 },
            { type: 'rock', gridX: 57.00, gridY: 12.00, size: 2, variant: 0 },
            { type: 'rock', gridX: 58.00, gridY: 4.00, size: 2, variant: 0 },
            { type: 'rock', gridX: 9.00, gridY: 2.00, size: 3, variant: 0 },
            { type: 'rock', gridX: 4.00, gridY: 27.00, size: 3, variant: 0 },
            { type: 'rock', gridX: 4.00, gridY: 10.00, size: 2, variant: 1 },
            { type: 'rock', gridX: 54.00, gridY: 13.00, size: 2, variant: 1 },
            { type: 'rock', gridX: 10.00, gridY: 13.00, size: 3, variant: 1 },
            { type: 'rock', gridX: 23.00, gridY: 13.00, size: 3, variant: 2 },
            { type: 'rock', gridX: 42.00, gridY: 20.00, size: 2.5, variant: 2 },
            { type: 'rock', gridX: 23.00, gridY: 21.00, size: 3, variant: 3 },
            { type: 'rock', gridX: 27.00, gridY: 16.00, size: 3, variant: 3 },
            { type: 'vegetation', gridX: 28.00, gridY: 17.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 22.00, gridY: 21.00, size: 2, variant: 0 }
        ];
    }

    createMeanderingPath(canvasWidth, canvasHeight) {
        const gridWidth = this.gridWidth || 60;
        const gridHeight = this.gridHeight || 33.75;

        const pathInGridCoords = [
            { gridX: 40.00, gridY: 0.00 },
            { gridX: 40.00, gridY: 14.00 },
            { gridX: 25.00, gridY: 14.00 },
            { gridX: 25.00, gridY: 20.00 },
            { gridX: 40.00, gridY: 20.00 },
            { gridX: 40.00, gridY: 26.00 },
            { gridX: 9.00, gridY: 26.00 }
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
            enemyHealth_multiplier: 4, 
            speedMultiplier: 1, 
            spawnInterval: 6, 
            pattern: [{ type: 'beefyenemy', count: 16 }] 
        }
        // Wave 2
        , { 
            enemyHealth_multiplier: 3, 
            speedMultiplier: 1, 
            spawnInterval: 1, 
            pattern: [{ type: 'frog', count: 19 }] 
        }
        // Wave 3
        , { 
            enemyHealth_multiplier: 1.5, 
            speedMultiplier: 1, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'archer', count: 6 }, { type: 'villager', count: 11 }, { type: 'basic', count: 5 }, { type: 'frog', count: 9, healthMultiplier: 3 }] 
        }
        // Wave 4
        , { 
            enemyHealth_multiplier: 1, 
            speedMultiplier: 0.8, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'knight', count: 1 }] 
        }
        // Wave 5
        , { 
            enemyHealth_multiplier: 2, 
            speedMultiplier: 1, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'basic', count: 7, healthMultiplier: 3 }, { type: 'villager', count: 9, healthMultiplier: 3 }, { type: 'beefyenemy', count: 7, healthMultiplier: 4, speedMultiplier: 1.2 }, { type: 'villager', count: 3, healthMultiplier: 5 }, { type: 'basic', count: 4, healthMultiplier: 5 }] 
        }
        // Wave 6
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 1, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'mage', count: 1, healthMultiplier: 1 }, { type: 'frog', count: 10, healthMultiplier: 2 }, { type: 'mage', count: 1, speedMultiplier: 0.8 }, { type: 'frog', count: 12, speedMultiplier: 1.1 }] 
        }
        // Wave 7
        , { 
            enemyHealth_multiplier: 3, 
            speedMultiplier: 1, 
            spawnInterval: 3, 
            pattern: [{ type: 'shieldknight', count: 3 }, { type: 'beefyenemy', count: 4, healthMultiplier: 5 }, { type: 'knight', count: 1, healthMultiplier: 1 }, { type: 'beefyenemy', count: 6, healthMultiplier: 7 }, { type: 'shieldknight', count: 2, healthMultiplier: 5 }] 
        }
        // Wave 8
        , { 
            enemyHealth_multiplier: 3, 
            speedMultiplier: 1, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'villager', count: 14 }, { type: 'basic', count: 13 }, { type: 'frog', count: 6 }, { type: 'archer', count: 10 }, { type: 'frog', count: 4, healthMultiplier: 4, speedMultiplier: 1.5 }] 
        }
        // Wave 9
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 1, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'mage', count: 2, healthMultiplier: 2, speedMultiplier: 1.4 }, { type: 'beefyenemy', count: 8 }, { type: 'frog', count: 13 }, { type: 'mage', count: 1, healthMultiplier: 4, speedMultiplier: 0.5 }, { type: 'frog', count: 4, healthMultiplier: 2, speedMultiplier: 1.2 }] 
        }
        // Wave 10
        , { 
            enemyHealth_multiplier: 1, 
            speedMultiplier: 1, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'shieldknight', count: 3, healthMultiplier: 2 }, { type: 'beefyenemy', count: 5, healthMultiplier: 6 }, { type: 'archer', count: 6, healthMultiplier: 3 }, { type: 'knight', count: 1, healthMultiplier: 2 }, { type: 'beefyenemy', count: 5, healthMultiplier: 7, speedMultiplier: 1.1 }, { type: 'archer', count: 8, healthMultiplier: 6, speedMultiplier: 1.6 }] 
        }
        // Wave 11
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 0.8, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'knight', count: 4 }] 
        }
        // Wave 12
        , { 
            enemyHealth_multiplier: 2, 
            speedMultiplier: 1, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'mage', count: 1, healthMultiplier: 4 }, { type: 'frog', count: 16, speedMultiplier: 1.2 }, { type: 'mage', count: 1, healthMultiplier: 6, speedMultiplier: 0.8 }, { type: 'frog', count: 12, healthMultiplier: 5, speedMultiplier: 1.4 }] 
        }
        // Wave 13
        , { 
            enemyHealth_multiplier: 10, 
            speedMultiplier: 1, 
            spawnInterval: 15, 
            pattern: [{ type: 'knight', count: 2 }] 
        }
        // Wave 14
        , { 
            enemyHealth_multiplier: 3, 
            speedMultiplier: 1, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'mage', count: 1, healthMultiplier: 4, speedMultiplier: 1.2 }, { type: 'villager', count: 8 }, { type: 'basic', count: 5 }, { type: 'archer', count: 7 }, { type: 'beefyenemy', count: 5, healthMultiplier: 4 }, { type: 'shieldknight', count: 2 }, { type: 'archer', count: 8, healthMultiplier: 4, speedMultiplier: 1.3 }, { type: 'beefyenemy', count: 5, healthMultiplier: 6, speedMultiplier: 0.8 }, { type: 'basic', count: 8, healthMultiplier: 2, speedMultiplier: 1.5 }, { type: 'shieldknight', count: 2, healthMultiplier: 2 }] 
        }
        // Wave 15
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 1, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'archer', count: 12, healthMultiplier: 2 }, { type: 'villager', count: 9, healthMultiplier: 3, speedMultiplier: 1.2 }, { type: 'basic', count: 13, healthMultiplier: 3, speedMultiplier: 1.2 }, { type: 'villager', count: 12 }, { type: 'archer', count: 18, healthMultiplier: 4, speedMultiplier: 1.7 }] 
        }
        // Wave 16
        , { 
            enemyHealth_multiplier: 15, 
            speedMultiplier: 1, 
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