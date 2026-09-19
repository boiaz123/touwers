import { LevelBase } from '../LevelBase.js';

export class SpaceLevel3 extends LevelBase {
    static levelMetadata = {
        name: 'Ooz\'Il\'Kev',
        difficulty: 'Nightmare',
        order: 3,
        campaign: 'space'
    };

    constructor() {
        super();
        // Derive instance properties from static metadata
        this.levelName = SpaceLevel3.levelMetadata.name;
        this.levelNumber = SpaceLevel3.levelMetadata.order;
        this.difficulty = SpaceLevel3.levelMetadata.difficulty;
        this.campaign = SpaceLevel3.levelMetadata.campaign;
        this.maxWaves = 12;

        // Set terrain elements (prevent tower placement on these areas)
        this.terrainElements = [
            { type: 'water', gridX: 22.00, gridY: 2.00, size: 3, waterType: 'lake' },
            { type: 'vegetation', gridX: 24.00, gridY: 1.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 19.00, gridY: 2.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 20.00, gridY: 5.00, size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 2.00, gridY: 10.00, size: 2.5635356826619837, variant: 2 },
            { type: 'vegetation', gridX: 5.00, gridY: 6.00, size: 2.1085642284752524, variant: 0 },
            { type: 'vegetation', gridX: 6.00, gridY: 8.00, size: 2.587779461628135, variant: 3 },
            { type: 'vegetation', gridX: 0.00, gridY: 8.00, size: 2.0892391614326975, variant: 0 },
            { type: 'vegetation', gridX: 7.00, gridY: 6.00, size: 1.2346478986927194, variant: 1 },
            { type: 'vegetation', gridX: 3.00, gridY: 3.00, size: 2.0585899224160507, variant: 1 },
            { type: 'vegetation', gridX: 5.00, gridY: 4.00, size: 2.211145334803893, variant: 0 },
            { type: 'vegetation', gridX: 1.00, gridY: 11.00, size: 1.5795248508479922, variant: 1 },
            { type: 'vegetation', gridX: 4.00, gridY: 2.00, size: 2.697922139988024, variant: 0 },
            { type: 'vegetation', gridX: 6.00, gridY: 8.00, size: 1.5164453589688778, variant: 2 },
            { type: 'vegetation', gridX: 58.00, gridY: 9.00, size: 2.5094949039227723, variant: 1 },
            { type: 'vegetation', gridX: 57.00, gridY: 11.00, size: 2.8644222166581113, variant: 0 },
            { type: 'vegetation', gridX: 57.00, gridY: 4.00, size: 2.4080615134559786, variant: 3 },
            { type: 'vegetation', gridX: 53.00, gridY: 9.00, size: 1.442402790879671, variant: 1 },
            { type: 'vegetation', gridX: 50.00, gridY: 7.00, size: 1.0350526262048134, variant: 0 },
            { type: 'vegetation', gridX: 51.00, gridY: 6.00, size: 2.248476078008292, variant: 3 },
            { type: 'vegetation', gridX: 55.00, gridY: 5.00, size: 2.487967013494753, variant: 0 },
            { type: 'vegetation', gridX: 50.00, gridY: 6.00, size: 1.8872854445462666, variant: 3 },
            { type: 'vegetation', gridX: 56.00, gridY: 6.00, size: 2.414727013463235, variant: 1 },
            { type: 'vegetation', gridX: 57.00, gridY: 3.00, size: 1.860742656652705, variant: 1 },
            { type: 'vegetation', gridX: 57.00, gridY: 1.00, size: 1.8266303983631045, variant: 0 },
            { type: 'vegetation', gridX: 4.00, gridY: 27.00, size: 2.888780569669806, variant: 3 },
            { type: 'vegetation', gridX: 8.00, gridY: 32.00, size: 2.3143087084408114, variant: 2 },
            { type: 'vegetation', gridX: 5.00, gridY: 31.00, size: 1.206691309413554, variant: 3 },
            { type: 'vegetation', gridX: 6.00, gridY: 30.00, size: 2.406761663955495, variant: 0 },
            { type: 'vegetation', gridX: 2.00, gridY: 27.00, size: 2.9734424083696593, variant: 0 },
            { type: 'vegetation', gridX: 1.00, gridY: 28.00, size: 1.747011300007581, variant: 1 },
            { type: 'vegetation', gridX: 4.00, gridY: 29.00, size: 2.596195345638363, variant: 1 },
            { type: 'vegetation', gridX: 9.00, gridY: 30.00, size: 2.2993956110649765, variant: 1 },
            { type: 'vegetation', gridX: 10.00, gridY: 27.00, size: 1.1114536099167878, variant: 3 },
            { type: 'vegetation', gridX: 17.00, gridY: 27.00, size: 1.0755345608308784, variant: 1 },
            { type: 'vegetation', gridX: 13.00, gridY: 31.00, size: 1.943484844287673, variant: 3 },
            { type: 'vegetation', gridX: 14.00, gridY: 26.00, size: 1.8618976576917485, variant: 0 },
            { type: 'vegetation', gridX: 16.00, gridY: 29.00, size: 1.0135688854098401, variant: 1 },
            { type: 'vegetation', gridX: 19.00, gridY: 31.00, size: 2.4983921865901353, variant: 3 },
            { type: 'vegetation', gridX: 14.00, gridY: 26.00, size: 1.285934492797722, variant: 2 },
            { type: 'vegetation', gridX: 20.00, gridY: 30.00, size: 2.7230581448824034, variant: 3 },
            { type: 'vegetation', gridX: 18.00, gridY: 25.00, size: 2.8080639039656083, variant: 2 },
            { type: 'vegetation', gridX: 14.00, gridY: 8.00, size: 2.5424010978231655, variant: 1 },
            { type: 'vegetation', gridX: 9.00, gridY: 5.00, size: 1.7656040878247552, variant: 2 },
            { type: 'vegetation', gridX: 12.00, gridY: 4.00, size: 1.4428797918727259, variant: 3 },
            { type: 'vegetation', gridX: 14.00, gridY: 6.00, size: 1.9151925881583172, variant: 3 },
            { type: 'vegetation', gridX: 11.00, gridY: 4.00, size: 2.5606946697132913, variant: 2 },
            { type: 'vegetation', gridX: 15.00, gridY: 3.00, size: 1.5373337453351208, variant: 0 },
            { type: 'vegetation', gridX: 14.00, gridY: 3.00, size: 1.14112272633077, variant: 3 },
            { type: 'vegetation', gridX: 10.00, gridY: 7.00, size: 1.123521403579559, variant: 1 },
            { type: 'vegetation', gridX: 17.00, gridY: 8.00, size: 2.897638812613038, variant: 0 },
            { type: 'vegetation', gridX: 14.00, gridY: 10.00, size: 1.0012308361505546, variant: 3 },
            { type: 'rock', gridX: 50.00, gridY: 26.00, size: 1.5, variant: 0 },
            { type: 'rock', gridX: 47.00, gridY: 31.00, size: 1.5, variant: 1 },
            { type: 'rock', gridX: 56.00, gridY: 26.00, size: 1.5, variant: 1 },
            { type: 'rock', gridX: 54.00, gridY: 29.00, size: 1.5, variant: 2 },
            { type: 'rock', gridX: 55.00, gridY: 32.00, size: 1.5, variant: 2 },
            { type: 'rock', gridX: 52.00, gridY: 32.00, size: 1.5, variant: 3 },
            { type: 'rock', gridX: 48.00, gridY: 21.00, size: 1.5, variant: 3 }
        ];
    }

    createMeanderingPath(canvasWidth, canvasHeight) {
        const gridWidth = this.gridWidth || 60;
        const gridHeight = this.gridHeight || 33.75;

        const pathInGridCoords = [
            { gridX: 26.00, gridY: 0.00 },
            { gridX: 52.00, gridY: 20.00 },
            { gridX: 52.00, gridY: 28.00 },
            { gridX: 28.00, gridY: 28.00 },
            { gridX: 28.00, gridY: 23.00 },
            { gridX: 34.00, gridY: 17.00 },
            { gridX: 24.00, gridY: 9.00 },
            { gridX: 10.00, gridY: 20.00 }
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
            spawnInterval: 2, 
            pattern: [{ type: 'villager', count: 12, speedMultiplier: 0.8 }, { type: 'basic', count: 9, healthMultiplier: 2 }, { type: 'beefyenemy', count: 5, healthMultiplier: 1 }, { type: 'archer', count: 4, speedMultiplier: 0.9 }, { type: 'villager', count: 14, speedMultiplier: 0.8 }, { type: 'beefyenemy', count: 3, speedMultiplier: 0.8 }, { type: 'frog', count: 7, healthMultiplier: 1 }, { type: 'shieldknight', count: 2, healthMultiplier: 0.8 }, { type: 'archer', count: 6 }, { type: 'frog', count: 5 }, { type: 'beefyenemy', count: 3, healthMultiplier: 3, speedMultiplier: 0.5 }] 
        }
        // Wave 2
        , { 
            enemyHealth_multiplier: 2, 
            speedMultiplier: 1, 
            spawnInterval: 2, 
            pattern: [{ type: 'ramcart', count: 2, healthMultiplier: 1 }, { type: 'beefyenemy', count: 4, healthMultiplier: 2, speedMultiplier: 0.6 }, { type: 'basic', count: 20 }, { type: 'archer', count: 10 }, { type: 'frog', count: 15, speedMultiplier: 1.2 }, { type: 'walkingfrog', count: 2, speedMultiplier: 0.6 }, { type: 'knight', count: 1, healthMultiplier: 1, speedMultiplier: 0.8 }, { type: 'shieldknight', count: 2, speedMultiplier: 0.6 }, { type: 'ramcart', count: 1 }, { type: 'basic', count: 10 }, { type: 'archer', count: 8 }, { type: 'frog', count: 4 }, { type: 'knight', count: 1 }] 
        }
        // Wave 3
        , { 
            enemyHealth_multiplier: 5, 
            speedMultiplier: 1, 
            spawnInterval: 20, 
            pattern: [{ type: 'firefrog', count: 1 }, { type: 'waterfrog', count: 1 }, { type: 'earthfrog', count: 1 }, { type: 'airfrog', count: 1 }] 
        }
        // Wave 4
        , { 
            enemyHealth_multiplier: 1.84, 
            speedMultiplier: 1, 
            spawnInterval: 0.78, 
            pattern: [{ type: 'heavyfrog', count: 2, healthMultiplier: 2, speedMultiplier: 0.8 }, { type: 'knight', count: 5, healthMultiplier: 2 }, { type: 'mage', count: 3, healthMultiplier: 4 }, { type: 'archer', count: 16, healthMultiplier: 3, speedMultiplier: 1.2 }, { type: 'frog', count: 12, healthMultiplier: 3, speedMultiplier: 1 }, { type: 'ramcart', count: 3, healthMultiplier: 3, speedMultiplier: 1 }] 
        }
        // Wave 5
        , { 
            enemyHealth_multiplier: 2.05, 
            speedMultiplier: 1, 
            spawnInterval: 0.68, 
            pattern: [{ type: 'beefyenemy', count: 8 }] 
        }
        // Wave 6
        , { 
            enemyHealth_multiplier: 2.27, 
            speedMultiplier: 1, 
            spawnInterval: 0.88, 
            pattern: [{ type: 'shieldknight', count: 2, healthMultiplier: 2 }, { type: 'frog', count: 12 }] 
        }
        // Wave 7
        , { 
            enemyHealth_multiplier: 2.48, 
            speedMultiplier: 1.2, 
            spawnInterval: 0.78, 
            pattern: [{ type: 'basic', count: 11 }, { type: 'villager', count: 9 }, { type: 'archer', count: 11, speedMultiplier: 1.2 }] 
        }
        // Wave 8
        , { 
            enemyHealth_multiplier: 2.69, 
            speedMultiplier: 1.2, 
            spawnInterval: 0.58, 
            pattern: [{ type: 'villager', count: 12 }, { type: 'basic', count: 10 }, { type: 'frog', count: 9, healthMultiplier: 2, speedMultiplier: 1.3 }] 
        }
        // Wave 9
        , { 
            enemyHealth_multiplier: 2.91, 
            speedMultiplier: 1, 
            spawnInterval: 1.95, 
            pattern: [{ type: 'beefyenemy', count: 5 }, { type: 'knight', count: 3 }] 
        }
        // Wave 10
        , { 
            enemyHealth_multiplier: 3.12, 
            speedMultiplier: 1, 
            spawnInterval: 11.9, 
            pattern: [{ type: 'knight', count: 5 }, { type: 'frog', count: 4 }] 
        }
        // Wave 11
        , { 
            enemyHealth_multiplier: 3.23, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'beefyenemy', count: 9, healthMultiplier: 3 }, { type: 'frog', count: 14 }, { type: 'shieldknight', count: 3, healthMultiplier: 2 }, { type: 'basic', count: 11 }, { type: 'villager', count: 10 }, { type: 'mage', count: 6 }, { type: 'archer', count: 9, healthMultiplier: 3, speedMultiplier: 2 }] 
        }
        ];

        if (wave > 0 && wave <= waveConfigs.length) {
            return waveConfigs[wave - 1];
        }
        
        return null;
    }
}