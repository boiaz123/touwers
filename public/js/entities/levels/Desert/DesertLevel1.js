import { LevelBase } from '../LevelBase.js';

export class DesertLevel1 extends LevelBase {
    static levelMetadata = {
        name: 'Hadrahir',
        difficulty: 'Hard',
        order: 1,
        campaign: 'desert'
    };

    constructor() {
        super();
        // Derive instance properties from static metadata
        this.levelName = DesertLevel1.levelMetadata.name;
        this.levelNumber = DesertLevel1.levelMetadata.order;
        this.difficulty = DesertLevel1.levelMetadata.difficulty;
        this.campaign = DesertLevel1.levelMetadata.campaign;
        this.maxWaves = 28;

        // Set terrain elements (prevent tower placement on these areas)
        this.terrainElements = [
            { type: 'water', gridX: 53.00, gridY: 25.00, size: 3, waterType: 'lake' },
            { type: 'vegetation', gridX: 51.00, gridY: 24.00, size: 3, variant: 0 },
            { type: 'vegetation', gridX: 56.00, gridY: 24.00, size: 3, variant: 2 },
            { type: 'vegetation', gridX: 51.00, gridY: 27.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 55.00, gridY: 27.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 54.00, gridY: 22.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 54.00, gridY: 5.00, size: 2.1407365966787384, variant: 2 },
            { type: 'vegetation', gridX: 52.00, gridY: 2.00, size: 2.2951422630579725, variant: 2 },
            { type: 'vegetation', gridX: 51.00, gridY: 3.00, size: 1.8977365344535229, variant: 0 },
            { type: 'vegetation', gridX: 55.00, gridY: 2.00, size: 1.7354127700533617, variant: 2 },
            { type: 'vegetation', gridX: 56.00, gridY: 4.00, size: 2.0835011684268467, variant: 2 },
            { type: 'vegetation', gridX: 57.00, gridY: 6.00, size: 2.0804797653983247, variant: 0 },
            { type: 'vegetation', gridX: 53.00, gridY: 3.00, size: 2.26285331578722, variant: 0 },
            { type: 'vegetation', gridX: 52.00, gridY: 6.00, size: 1.6589843961640036, variant: 2 },
            { type: 'vegetation', gridX: 56.00, gridY: 1.00, size: 1.7373624573607458, variant: 2 },
            { type: 'vegetation', gridX: 59.00, gridY: 3.00, size: 2.0111647642342603, variant: 0 },
            { type: 'vegetation', gridX: 0.00, gridY: 0.00, size: 2.964636145651343, variant: 0 },
            { type: 'vegetation', gridX: 3.00, gridY: 1.00, size: 1.5108655599526775, variant: 2 },
            { type: 'vegetation', gridX: 3.00, gridY: 2.00, size: 1.6697937895714476, variant: 0 },
            { type: 'vegetation', gridX: 2.00, gridY: 6.00, size: 2.1889266529789184, variant: 2 },
            { type: 'vegetation', gridX: 3.00, gridY: 2.00, size: 2.6138389431539792, variant: 2 },
            { type: 'vegetation', gridX: 0.00, gridY: 4.00, size: 1.8565958164895808, variant: 0 },
            { type: 'vegetation', gridX: 1.00, gridY: 3.00, size: 2.3519490587205545, variant: 2 },
            { type: 'vegetation', gridX: 1.00, gridY: 5.00, size: 2.140682238251793, variant: 2 },
            { type: 'vegetation', gridX: 2.00, gridY: 16.00, size: 2.890772784925243, variant: 0 },
            { type: 'vegetation', gridX: 2.00, gridY: 12.00, size: 1.7796197883039537, variant: 0 },
            { type: 'vegetation', gridX: 4.00, gridY: 15.00, size: 1.8497832728375132, variant: 0 },
            { type: 'vegetation', gridX: 5.00, gridY: 14.00, size: 2.356213816062797, variant: 2 },
            { type: 'vegetation', gridX: 0.00, gridY: 13.00, size: 2.7538497508807964, variant: 2 },
            { type: 'vegetation', gridX: 2.00, gridY: 13.00, size: 2.1945752991867455, variant: 2 },
            { type: 'vegetation', gridX: 6.00, gridY: 12.00, size: 2.845089178406509, variant: 2 },
            { type: 'vegetation', gridX: 20.00, gridY: 4.00, size: 1.9414241228725035, variant: 2 },
            { type: 'vegetation', gridX: 21.00, gridY: 5.00, size: 1.8003720269344228, variant: 2 },
            { type: 'vegetation', gridX: 23.00, gridY: 6.00, size: 2.0327686228149524, variant: 2 },
            { type: 'vegetation', gridX: 25.00, gridY: 7.00, size: 1.8866223212799904, variant: 2 },
            { type: 'vegetation', gridX: 22.00, gridY: 4.00, size: 2.71827816712489, variant: 0 },
            { type: 'vegetation', gridX: 22.00, gridY: 7.00, size: 1.581014843160185, variant: 2 },
            { type: 'vegetation', gridX: 22.00, gridY: 9.00, size: 2.2706782953179623, variant: 0 },
            { type: 'vegetation', gridX: 47.00, gridY: 32.00, size: 2.355249590491349, variant: 0 },
            { type: 'vegetation', gridX: 44.00, gridY: 29.00, size: 2.0236347041126352, variant: 2 },
            { type: 'vegetation', gridX: 45.00, gridY: 29.00, size: 2.4732690211122055, variant: 2 },
            { type: 'vegetation', gridX: 45.00, gridY: 32.00, size: 2.140105553009124, variant: 0 },
            { type: 'vegetation', gridX: 46.00, gridY: 32.75, size: 2.5160138791670503, variant: 2 },
            { type: 'vegetation', gridX: 47.00, gridY: 31.00, size: 2.3358091250803437, variant: 0 },
            { type: 'vegetation', gridX: 46.00, gridY: 28.00, size: 1.7152550765558783, variant: 0 },
            { type: 'vegetation', gridX: 58.00, gridY: 16.00, size: 2.8575982778871687, variant: 0 },
            { type: 'vegetation', gridX: 56.00, gridY: 17.00, size: 2.7228914062679053, variant: 0 },
            { type: 'vegetation', gridX: 54.00, gridY: 17.00, size: 2.0926105291545114, variant: 2 },
            { type: 'vegetation', gridX: 58.00, gridY: 16.00, size: 1.6580637640137232, variant: 0 },
            { type: 'vegetation', gridX: 58.00, gridY: 17.00, size: 1.958895208806552, variant: 2 },
            { type: 'vegetation', gridX: 55.00, gridY: 14.00, size: 2.332681592714961, variant: 2 },
            { type: 'vegetation', gridX: 59.00, gridY: 15.00, size: 1.6912516927766903, variant: 2 },
            { type: 'rock', gridX: 10.00, gridY: 10.00, size: 2.5, variant: 0 },
            { type: 'rock', gridX: 32.00, gridY: 16.00, size: 2.5, variant: 2 },
            { type: 'rock', gridX: 42.00, gridY: 28.00, size: 2.5, variant: 3 },
            { type: 'rock', gridX: 44.00, gridY: 17.00, size: 3.5, variant: 3 },
            { type: 'rock', gridX: 11.00, gridY: 4.00, size: 3.5, variant: 1 },
            { type: 'rock', gridX: 26.00, gridY: 11.00, size: 2.5, variant: 1 },
            { type: 'rock', gridX: 3.00, gridY: 31.00, size: 2.5, variant: 1 }
        ];
    }

    createMeanderingPath(canvasWidth, canvasHeight) {
        const gridWidth = this.gridWidth || 60;
        const gridHeight = this.gridHeight || 33.75;

        const pathInGridCoords = [
            { gridX: 0.00, gridY: 8.00 },
            { gridX: 12.00, gridY: 8.00 },
            { gridX: 12.00, gridY: 26.00 },
            { gridX: 41.00, gridY: 26.00 },
            { gridX: 41.00, gridY: 20.00 },
            { gridX: 30.00, gridY: 20.00 },
            { gridX: 30.00, gridY: 14.00 },
            { gridX: 41.00, gridY: 14.00 },
            { gridX: 41.00, gridY: 7.00 },
            { gridX: 30.00, gridY: 7.00 }
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
            speedMultiplier: 0.4, 
            spawnInterval: 4, 
            pattern: [{ type: 'villager', count: 11 }, { type: 'basic', count: 6 }, { type: 'frog', count: 7 }]  
        }
        // Wave 2
        , { 
            enemyHealth_multiplier: 1.3, 
            speedMultiplier: 0.85, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'beefyenemy', count: 3, healthMultiplier: 0.5, speedMultiplier: 0.5 }, { type: 'villager', count: 7 }, { type: 'basic', count: 6 }] 
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
            pattern: [{ type: 'beefyenemy', count: 5 }] 
        }
        // Wave 5
        , { 
            enemyHealth_multiplier: 2, 
            speedMultiplier: 1.3, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'frog', count: 21 }] 
        }
        // Wave 6
        , { 
            enemyHealth_multiplier: 2, 
            speedMultiplier: 1.1, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'beefyenemy', count: 10 }] 
        }
        // Wave 7
        , { 
            enemyHealth_multiplier: 0.8, 
            speedMultiplier: 1, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'mage', count: 1 }, { type: 'frog', count: 12, healthMultiplier: 1.5 }] 
        }
        // Wave 8
        , { 
            enemyHealth_multiplier: 2.2, 
            speedMultiplier: 1.2, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'villager', count: 19 }, { type: 'basic', count: 18 }, { type: 'frog', count: 7 }] 
        }
        // Wave 9
        , { 
            enemyHealth_multiplier: 1.8, 
            speedMultiplier: 1, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'archer', count: 12, speedMultiplier: 1.2 }, { type: 'villager', count: 12 }, { type: 'basic', count: 12 }] 
        }
        // Wave 10
        , { 
            enemyHealth_multiplier: 3, 
            speedMultiplier: 1, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'shieldknight', count: 4, healthMultiplier: 1 }, { type: 'beefyenemy', count: 5 }] 
        }
        // Wave 11
        , { 
            enemyHealth_multiplier: 2, 
            speedMultiplier: 1.3, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'archer', count: 23 }, { type: 'frog', count: 16, speedMultiplier: 1.6 }] 
        }
        // Wave 12
        , { 
            enemyHealth_multiplier: 2, 
            speedMultiplier: 1, 
            spawnInterval: 0.5, 
            pattern: [{ type: 'mage', count: 1 }, { type: 'frog', count: 20, speedMultiplier: 1.3 }] 
        }
        // Wave 13
        , { 
            enemyHealth_multiplier: 5, 
            speedMultiplier: 1.2, 
            spawnInterval: 0.5, 
            pattern: [{ type: 'frog', count: 27 }] 
        }
        // Wave 14
        , { 
            enemyHealth_multiplier: 3, 
            speedMultiplier: 1, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'shieldknight', count: 5 }, { type: 'beefyenemy', count: 5 }, { type: 'knight', count: 2, healthMultiplier: 2 }] 
        }
        // Wave 15
        , { 
            enemyHealth_multiplier: 3, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'knight', count: 3 }, { type: 'frog', count: 12 }, { type: 'mage', count: 1, healthMultiplier: 1 }] 
        }
        // Wave 16
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 1, 
            spawnInterval: 12, 
            pattern: [{ type: 'knight', count: 3 }] 
        }
        // Wave 17
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 1, 
            spawnInterval: 5, 
            pattern: [{ type: 'mage', count: 5 }] 
        }
        // Wave 18
        , { 
            enemyHealth_multiplier: 1.6, 
            speedMultiplier: 0.75, 
            spawnInterval: 0.5, 
            pattern: [{ type: 'archer', count: 17 }, { type: 'villager', count: 16 }, { type: 'basic', count: 16 }] 
        }
        // Wave 19
        , { 
            enemyHealth_multiplier: 5, 
            speedMultiplier: 1.4, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'archer', count: 29 }] 
        }
        // Wave 20
        , { 
            enemyHealth_multiplier: 1, 
            speedMultiplier: 1, 
            spawnInterval: 0.5, 
            pattern: [{ type: 'frog', count: 17, healthMultiplier: 2 }, { type: 'mage', count: 1, healthMultiplier: 5 }, { type: 'archer', count: 12, speedMultiplier: 1.4 }] 
        }
        // Wave 21
        , { 
            enemyHealth_multiplier: 5, 
            speedMultiplier: 1, 
            spawnInterval: 1, 
            pattern: [{ type: 'mage', count: 1, healthMultiplier: 2, speedMultiplier: 1.2 }, { type: 'villager', count: 12 }, { type: 'basic', count: 8 }, { type: 'archer', count: 6 }, { type: 'beefyenemy', count: 6 }] 
        }
        // Wave 22
        , { 
            enemyHealth_multiplier: 7, 
            speedMultiplier: 0.55, 
            spawnInterval: 1, 
            pattern: [{ type: 'knight', count: 1 }] 
        }
        // Wave 23
        , { 
            enemyHealth_multiplier: 1, 
            speedMultiplier: 1, 
            spawnInterval: 0.5, 
            pattern: [{ type: 'mage', count: 1, healthMultiplier: 5 }, { type: 'frog', count: 27 }] 
        }
        // Wave 24
        , { 
            enemyHealth_multiplier: 2.5, 
            speedMultiplier: 1, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'shieldknight', count: 4 }, { type: 'beefyenemy', count: 7, healthMultiplier: 6 }, { type: 'frog', count: 16 }, { type: 'villager', count: 8 }, { type: 'archer', count: 9 }, { type: 'knight', count: 3, healthMultiplier: 2, speedMultiplier: 0.5 }] 
        }
        // Wave 25
        , { 
            enemyHealth_multiplier: 7, 
            speedMultiplier: 1, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'beefyenemy', count: 24 }] 
        }
        // Wave 26
        , { 
            enemyHealth_multiplier: 7.5, 
            speedMultiplier: 1, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'knight', count: 1 }, { type: 'mage', count: 2, healthMultiplier: 10 }, { type: 'shieldknight', count: 6 }, { type: 'frog', count: 8, speedMultiplier: 2 }] 
        }
        // Wave 27
        , { 
            enemyHealth_multiplier: 7, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'beefyenemy', count: 12 }, { type: 'knight', count: 1, healthMultiplier: 7 }, { type: 'shieldknight', count: 4 }] 
        }
        // Wave 28
        , { 
            enemyHealth_multiplier: 10, 
            speedMultiplier: 1, 
            spawnInterval: 0.3, 
            pattern: [{ type: 'earthfrog', count: 1 }] 
        }
        ];

        if (wave > 0 && wave <= waveConfigs.length) {
            return waveConfigs[wave - 1];
        }
        
        return null;
    }
}