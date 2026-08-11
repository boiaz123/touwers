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
        this.maxWaves = 45;

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
            enemyHealth_multiplier: 1.2, 
            speedMultiplier: 1, 
            spawnInterval: 0.86, 
            pattern: [{ type: 'frog', count: 8 }, { type: 'frog', count: 9, healthMultiplier: 2, speedMultiplier: 1.2 }, { type: 'frog', count: 10, healthMultiplier: 3 }] 
        }
        // Wave 2
        , { 
            enemyHealth_multiplier: 1.41, 
            speedMultiplier: 1, 
            spawnInterval: 1.14, 
            pattern: [{ type: 'villager', count: 9 }, { type: 'villager', count: 11, healthMultiplier: 1.5 }, { type: 'basic', count: 7, healthMultiplier: 1.3 }] 
        }
        // Wave 3
        , { 
            enemyHealth_multiplier: 1.63, 
            speedMultiplier: 1, 
            spawnInterval: 0.96, 
            pattern: [{ type: 'villager', count: 9, healthMultiplier: 1.8, speedMultiplier: 0.6 }, { type: 'basic', count: 11, healthMultiplier: 1.8 }, { type: 'archer', count: 4, speedMultiplier: 1.5 }] 
        }
        // Wave 4
        , { 
            enemyHealth_multiplier: 1.84, 
            speedMultiplier: 1, 
            spawnInterval: 0.78, 
            pattern: [{ type: 'archer', count: 8, healthMultiplier: 2.5, speedMultiplier: 1.1 }, { type: 'frog', count: 11, healthMultiplier: 1.8 }, { type: 'mage', count: 3, healthMultiplier: 2 }, { type: 'archer', count: 4, healthMultiplier: 3, speedMultiplier: 1.5 }] 
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
        // Wave 12
        , { 
            enemyHealth_multiplier: 3.34, 
            speedMultiplier: 1, 
            spawnInterval: 0.82, 
            pattern: [{ type: 'frog', count: 9 }, { type: 'frog', count: 10, healthMultiplier: 2, speedMultiplier: 1.2 }, { type: 'frog', count: 11, healthMultiplier: 3 }] 
        }
        // Wave 13
        , { 
            enemyHealth_multiplier: 3.45, 
            speedMultiplier: 1, 
            spawnInterval: 0.66, 
            pattern: [{ type: 'beefyenemy', count: 9 }, { type: 'frog', count: 3 }] 
        }
        // Wave 14
        , { 
            enemyHealth_multiplier: 3.56, 
            speedMultiplier: 0.9, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'knight', count: 4, healthMultiplier: 2.5 }, { type: 'mage', count: 7, healthMultiplier: 2 }, { type: 'frog', count: 12, speedMultiplier: 1.3 }, { type: 'archer', count: 11, speedMultiplier: 1.4 }, { type: 'beefyenemy', count: 8 }, { type: 'villager', count: 8 }] 
        }
        // Wave 15
        , { 
            enemyHealth_multiplier: 3.67, 
            speedMultiplier: 1, 
            spawnInterval: 0.76, 
            pattern: [{ type: 'archer', count: 9, healthMultiplier: 2.5, speedMultiplier: 1.1 }, { type: 'frog', count: 13, healthMultiplier: 1.8 }, { type: 'mage', count: 4, healthMultiplier: 2 }, { type: 'archer', count: 5, healthMultiplier: 3, speedMultiplier: 1.5 }] 
        }
        // Wave 16
        , { 
            enemyHealth_multiplier: 3.77, 
            speedMultiplier: 1, 
            spawnInterval: 1, 
            pattern: [{ type: 'shieldknight', count: 6, speedMultiplier: 0.6 }, { type: 'frog', count: 11, speedMultiplier: 1.2 }] 
        }
        // Wave 17
        , { 
            enemyHealth_multiplier: 3.88, 
            speedMultiplier: 1, 
            spawnInterval: 1, 
            pattern: [{ type: 'knight', count: 3, healthMultiplier: 3 }, { type: 'mage', count: 4, healthMultiplier: 2 }, { type: 'shieldknight', count: 3, healthMultiplier: 2 }, { type: 'mage', count: 3, healthMultiplier: 4 }, { type: 'frog', count: 4 }] 
        }
        // Wave 18
        , { 
            enemyHealth_multiplier: 3.99, 
            speedMultiplier: 0.8, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'mage', count: 9 }, { type: 'frog', count: 3 }] 
        }
        // Wave 19
        , { 
            enemyHealth_multiplier: 4.1, 
            speedMultiplier: 1, 
            spawnInterval: 4.7, 
            pattern: [{ type: 'firefrog', count: 2 }, { type: 'airfrog', count: 2 }, { type: 'firefrog', count: 2 }, { type: 'airfrog', count: 2 }] 
        }
        // Wave 20
        , { 
            enemyHealth_multiplier: 4.21, 
            speedMultiplier: 1, 
            spawnInterval: 4.4, 
            pattern: [{ type: 'waterfrog', count: 3 }, { type: 'earthfrog', count: 3 }, { type: 'waterfrog', count: 3 }, { type: 'earthfrog', count: 3 }] 
        }
        // Wave 21
        , { 
            enemyHealth_multiplier: 4.32, 
            speedMultiplier: 1.1, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'mage', count: 6, healthMultiplier: 3 }, { type: 'shieldknight', count: 4 }, { type: 'villager', count: 15 }, { type: 'mage', count: 5, healthMultiplier: 4 }, { type: 'beefyenemy', count: 13, healthMultiplier: 2 }, { type: 'shieldknight', count: 4 }, { type: 'frog', count: 22 }, { type: 'archer', count: 14, healthMultiplier: 5, speedMultiplier: 1.5 }, { type: 'mage', count: 4, healthMultiplier: 6 }] 
        }
        // Wave 22
        , { 
            enemyHealth_multiplier: 4.43, 
            speedMultiplier: 1.3, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'archer', count: 17 }, { type: 'villager', count: 20 }, { type: 'basic', count: 18 }, { type: 'frog', count: 4 }] 
        }
        // Wave 23
        , { 
            enemyHealth_multiplier: 4.54, 
            speedMultiplier: 1, 
            spawnInterval: 0.78, 
            pattern: [{ type: 'frog', count: 14 }, { type: 'frog', count: 15, healthMultiplier: 2, speedMultiplier: 1.2 }, { type: 'frog', count: 16, healthMultiplier: 3 }] 
        }
        // Wave 24
        , { 
            enemyHealth_multiplier: 4.65, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'shieldknight', count: 1 }, { type: 'waterfrog', count: 1 }] 
        }
        // Wave 25
        , { 
            enemyHealth_multiplier: 4.76, 
            speedMultiplier: 1.7, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'archer', count: 15 }, { type: 'frog', count: 4 }] 
        }
        // Wave 26
        , { 
            enemyHealth_multiplier: 4.86, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'beefyenemy', count: 10, healthMultiplier: 3 }, { type: 'frog', count: 22 }, { type: 'shieldknight', count: 4, healthMultiplier: 2 }, { type: 'basic', count: 12 }, { type: 'villager', count: 11 }, { type: 'mage', count: 7 }, { type: 'archer', count: 10, healthMultiplier: 3, speedMultiplier: 2 }] 
        }
        // Wave 27
        , { 
            enemyHealth_multiplier: 4.97, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'waterfrog', count: 1 }, { type: 'earthfrog', count: 1 }, { type: 'firefrog', count: 1 }] 
        }
        // Wave 28
        , { 
            enemyHealth_multiplier: 5.08, 
            speedMultiplier: 0.9, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'knight', count: 5, healthMultiplier: 2.5 }, { type: 'mage', count: 8, healthMultiplier: 2 }, { type: 'frog', count: 20, speedMultiplier: 1.3 }, { type: 'archer', count: 12, speedMultiplier: 1.4 }, { type: 'beefyenemy', count: 9 }, { type: 'villager', count: 9 }] 
        }
        // Wave 29
        , { 
            enemyHealth_multiplier: 5.19, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'firefrog', count: 1 }] 
        }
        // Wave 30
        , { 
            enemyHealth_multiplier: 5.3, 
            speedMultiplier: 1, 
            spawnInterval: 4.1, 
            pattern: [{ type: 'firefrog', count: 4 }, { type: 'waterfrog', count: 4 }, { type: 'firefrog', count: 4 }, { type: 'waterfrog', count: 4 }] 
        }
        // Wave 31
        , { 
            enemyHealth_multiplier: 5.41, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'beefyenemy', count: 11, healthMultiplier: 3 }, { type: 'frog', count: 27 }, { type: 'shieldknight', count: 5, healthMultiplier: 2 }, { type: 'basic', count: 13 }, { type: 'villager', count: 12 }, { type: 'mage', count: 8 }, { type: 'archer', count: 11, healthMultiplier: 3, speedMultiplier: 2 }] 
        }
        // Wave 32
        , { 
            enemyHealth_multiplier: 5.52, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'ramcart', count: 1 }, { type: 'airfrog', count: 1 }] 
        }
        // Wave 33
        , { 
            enemyHealth_multiplier: 5.63, 
            speedMultiplier: 1.7, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'archer', count: 16 }, { type: 'frog', count: 5 }] 
        }
        // Wave 34
        , { 
            enemyHealth_multiplier: 5.74, 
            speedMultiplier: 1.4, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'archer', count: 18 }, { type: 'villager', count: 21 }, { type: 'basic', count: 19 }, { type: 'frog', count: 5 }] 
        }
        // Wave 35
        , { 
            enemyHealth_multiplier: 5.85, 
            speedMultiplier: 1.1, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'mage', count: 7, healthMultiplier: 3 }, { type: 'shieldknight', count: 5 }, { type: 'villager', count: 16 }, { type: 'mage', count: 6, healthMultiplier: 4 }, { type: 'beefyenemy', count: 14, healthMultiplier: 2 }, { type: 'shieldknight', count: 5 }, { type: 'frog', count: 33 }, { type: 'archer', count: 15, healthMultiplier: 5, speedMultiplier: 1.5 }, { type: 'mage', count: 5, healthMultiplier: 6 }] 
        }
        // Wave 36
        , { 
            enemyHealth_multiplier: 5.96, 
            speedMultiplier: 1, 
            spawnInterval: 0.72, 
            pattern: [{ type: 'archer', count: 11, healthMultiplier: 2.5, speedMultiplier: 1.1 }, { type: 'frog', count: 25, healthMultiplier: 1.8 }, { type: 'mage', count: 6, healthMultiplier: 2 }, { type: 'archer', count: 7, healthMultiplier: 3, speedMultiplier: 1.5 }] 
        }
        // Wave 37
        , { 
            enemyHealth_multiplier: 6.07, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'earthfrog', count: 1 }] 
        }
        // Wave 38
        , { 
            enemyHealth_multiplier: 6.18, 
            speedMultiplier: 0.9, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'knight', count: 6, healthMultiplier: 2.5 }, { type: 'mage', count: 9, healthMultiplier: 2 }, { type: 'frog', count: 27, speedMultiplier: 1.3 }, { type: 'archer', count: 13, speedMultiplier: 1.4 }, { type: 'beefyenemy', count: 10 }, { type: 'villager', count: 10 }] 
        }
        // Wave 39
        , { 
            enemyHealth_multiplier: 6.29, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'waterfrog', count: 1 }, { type: 'airfrog', count: 1 }, { type: 'earthfrog', count: 1 }] 
        }
        // Wave 40
        , { 
            enemyHealth_multiplier: 6.4, 
            speedMultiplier: 1, 
            spawnInterval: 3.8, 
            pattern: [{ type: 'airfrog', count: 5 }, { type: 'earthfrog', count: 5 }, { type: 'airfrog', count: 5 }, { type: 'earthfrog', count: 5 }] 
        }
        // Wave 41
        , { 
            enemyHealth_multiplier: 17.22, 
            speedMultiplier: 1.1, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'shieldknight', count: 8, healthMultiplier: 3 }, { type: 'mage', count: 6 }, { type: 'villager', count: 17 }, { type: 'shieldknight', count: 7, healthMultiplier: 4 }, { type: 'beefyenemy', count: 15, healthMultiplier: 2 }, { type: 'mage', count: 6 }, { type: 'frog', count: 38 }, { type: 'archer', count: 16, healthMultiplier: 5, speedMultiplier: 1.5 }, { type: 'shieldknight', count: 6, healthMultiplier: 6 }] 
        }
        // Wave 42
        , { 
            enemyHealth_multiplier: 10.11, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'beefyenemy', count: 12, healthMultiplier: 3 }, { type: 'frog', count: 35 }, { type: 'ramcart', count: 6, healthMultiplier: 2 }, { type: 'basic', count: 14 }, { type: 'villager', count: 13 }, { type: 'shieldknight', count: 9 }, { type: 'archer', count: 12, healthMultiplier: 3, speedMultiplier: 2 }] 
        }
        // Wave 43
        , { 
            enemyHealth_multiplier: 52.42, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'waterfrog', count: 1 }] 
        }
        // Wave 44
        , { 
            enemyHealth_multiplier: 20.59, 
            speedMultiplier: 1.8, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'archer', count: 17, healthMultiplier: 10 }, { type: 'earthfrog', count: 5 }] 
        }
        // Wave 45
        , { 
            enemyHealth_multiplier: 3.74, 
            speedMultiplier: 1, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'archer', count: 12, healthMultiplier: 2.5, speedMultiplier: 1.1 }, { type: 'frog', count: 32, healthMultiplier: 1.8 }, { type: 'shieldknight', count: 7, healthMultiplier: 2 }, { type: 'archer', count: 8, healthMultiplier: 3, speedMultiplier: 1.5 }, { type: 'airfrog', count: 1, healthMultiplier: 25 }] 
        }
        ];

        if (wave > 0 && wave <= waveConfigs.length) {
            return waveConfigs[wave - 1];
        }
        
        return null;
    }
}