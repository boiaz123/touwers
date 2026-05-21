import { LevelBase } from '../LevelBase.js';

export class ForestLevel5 extends LevelBase {
    static levelMetadata = {
        name: 'Verdant Vally',
        difficulty: 'Easy',
        order: 5,
        campaign: 'forest'
    };

    constructor() {
        super();
        // Derive instance properties from static metadata
        this.levelName = ForestLevel5.levelMetadata.name;
        this.levelNumber = ForestLevel5.levelMetadata.order;
        this.difficulty = ForestLevel5.levelMetadata.difficulty;
        this.campaign = ForestLevel5.levelMetadata.campaign;
        this.maxWaves = 14;

        // Set terrain elements (prevent tower placement on these areas)
        this.terrainElements = [
            { type: 'vegetation', gridX: 56.00, gridY: 4.00, size: 1.6093072141855793, variant: 0 },
            { type: 'vegetation', gridX: 58.00, gridY: 3.00, size: 2.0409180779259626, variant: 0 },
            { type: 'vegetation', gridX: 59.00, gridY: 5.00, size: 2.224848528381659, variant: 2 },
            { type: 'vegetation', gridX: 59.00, gridY: 3.00, size: 2.162739076527499, variant: 1 },
            { type: 'vegetation', gridX: 54.00, gridY: 1.00, size: 2.449197175175872, variant: 0 },
            { type: 'vegetation', gridX: 56.00, gridY: 8.00, size: 2.1101516221959304, variant: 1 },
            { type: 'vegetation', gridX: 59.00, gridY: 2.00, size: 1.7202718414036817, variant: 3 },
            { type: 'vegetation', gridX: 47.00, gridY: 3.00, size: 2.044549634937065, variant: 3 },
            { type: 'vegetation', gridX: 48.00, gridY: 1.00, size: 2.0046903892537458, variant: 3 },
            { type: 'vegetation', gridX: 50.00, gridY: 0.00, size: 2.042303932494691, variant: 1 },
            { type: 'vegetation', gridX: 50.00, gridY: 5.00, size: 1.5079247752812663, variant: 0 },
            { type: 'vegetation', gridX: 54.00, gridY: 5.00, size: 2.310648163007604, variant: 2 },
            { type: 'vegetation', gridX: 46.00, gridY: 4.00, size: 2.4164572866657235, variant: 1 },
            { type: 'vegetation', gridX: 49.00, gridY: 4.00, size: 2.3676226933086335, variant: 1 },
            { type: 'vegetation', gridX: 46.00, gridY: 4.00, size: 2.498459813647986, variant: 1 },
            { type: 'vegetation', gridX: 55.00, gridY: 15.00, size: 1.5435334198518493, variant: 3 },
            { type: 'vegetation', gridX: 56.00, gridY: 17.00, size: 2.3205355193997783, variant: 0 },
            { type: 'vegetation', gridX: 53.00, gridY: 11.00, size: 1.5831925304505359, variant: 0 },
            { type: 'vegetation', gridX: 53.00, gridY: 12.00, size: 1.7829703757376016, variant: 3 },
            { type: 'vegetation', gridX: 57.00, gridY: 14.00, size: 2.2802609044432343, variant: 0 },
            { type: 'vegetation', gridX: 59.00, gridY: 14.00, size: 2.2524879952949686, variant: 0 },
            { type: 'vegetation', gridX: 56.00, gridY: 14.00, size: 2.1678829892948324, variant: 3 },
            { type: 'vegetation', gridX: 56.00, gridY: 12.00, size: 1.9311696211404419, variant: 3 },
            { type: 'vegetation', gridX: 57.00, gridY: 8.00, size: 2.3238195880733543, variant: 0 },
            { type: 'vegetation', gridX: 43.00, gridY: 0.00, size: 1.7207510424290362, variant: 2 },
            { type: 'vegetation', gridX: 38.00, gridY: 3.00, size: 2.00574845786682, variant: 2 },
            { type: 'vegetation', gridX: 37.00, gridY: 4.00, size: 1.5865873351445354, variant: 0 },
            { type: 'vegetation', gridX: 39.00, gridY: 2.00, size: 1.7340697353616428, variant: 1 },
            { type: 'vegetation', gridX: 39.00, gridY: 6.00, size: 2.0412469296559577, variant: 3 },
            { type: 'vegetation', gridX: 38.00, gridY: 0.00, size: 2.2662936434034835, variant: 3 },
            { type: 'vegetation', gridX: 44.00, gridY: 5.00, size: 1.5353693779367008, variant: 0 },
            { type: 'vegetation', gridX: 41.00, gridY: 4.00, size: 2.4043941556838337, variant: 3 },
            { type: 'vegetation', gridX: 43.00, gridY: 2.00, size: 2.4399917160173232, variant: 1 },
            { type: 'vegetation', gridX: 36.00, gridY: 4.00, size: 2.4176478040872404, variant: 0 },
            { type: 'vegetation', gridX: 54.00, gridY: 25.00, size: 1.9432336557093772, variant: 1 },
            { type: 'vegetation', gridX: 54.00, gridY: 25.00, size: 1.9408532266380325, variant: 2 },
            { type: 'vegetation', gridX: 59.00, gridY: 24.00, size: 1.8640877344522921, variant: 2 },
            { type: 'vegetation', gridX: 56.00, gridY: 19.00, size: 2.1198970316302246, variant: 0 },
            { type: 'vegetation', gridX: 56.00, gridY: 22.00, size: 2.4510200214177287, variant: 0 },
            { type: 'vegetation', gridX: 55.00, gridY: 21.00, size: 1.834433366103788, variant: 3 },
            { type: 'vegetation', gridX: 59.00, gridY: 23.00, size: 2.3231318864566886, variant: 2 },
            { type: 'vegetation', gridX: 57.00, gridY: 23.00, size: 2.206974536157892, variant: 0 },
            { type: 'vegetation', gridX: 57.00, gridY: 26.00, size: 2.3320014551010466, variant: 0 },
            { type: 'vegetation', gridX: 57.00, gridY: 19.00, size: 2.0730071328987734, variant: 0 },
            { type: 'vegetation', gridX: 58.00, gridY: 29.00, size: 2.117486318703757, variant: 1 },
            { type: 'vegetation', gridX: 55.00, gridY: 31.00, size: 1.6209339448205684, variant: 0 },
            { type: 'vegetation', gridX: 53.00, gridY: 30.00, size: 1.8345774489954179, variant: 1 },
            { type: 'vegetation', gridX: 57.00, gridY: 30.00, size: 1.9266943643928858, variant: 0 },
            { type: 'vegetation', gridX: 55.00, gridY: 25.00, size: 2.0955074107993035, variant: 3 },
            { type: 'vegetation', gridX: 52.00, gridY: 26.00, size: 1.5273662479962016, variant: 2 },
            { type: 'vegetation', gridX: 55.00, gridY: 26.00, size: 1.6497086810296633, variant: 3 },
            { type: 'vegetation', gridX: 54.00, gridY: 32.00, size: 2.3365221042415913, variant: 1 },
            { type: 'vegetation', gridX: 53.00, gridY: 29.00, size: 2.436051504841938, variant: 2 },
            { type: 'vegetation', gridX: 52.00, gridY: 29.00, size: 1.7998765133008643, variant: 0 },
            { type: 'vegetation', gridX: 5.00, gridY: 32.75, size: 2.4636877312340357, variant: 2 },
            { type: 'vegetation', gridX: 3.00, gridY: 31.00, size: 1.9884035206619188, variant: 0 },
            { type: 'vegetation', gridX: 8.00, gridY: 28.00, size: 1.9749871163794035, variant: 2 },
            { type: 'vegetation', gridX: 1.00, gridY: 32.75, size: 1.5597549691406003, variant: 0 },
            { type: 'vegetation', gridX: 6.00, gridY: 32.00, size: 2.349469854108299, variant: 3 },
            { type: 'vegetation', gridX: 0.00, gridY: 30.00, size: 1.725920054667675, variant: 1 },
            { type: 'vegetation', gridX: 6.00, gridY: 28.00, size: 1.7754900271007168, variant: 0 },
            { type: 'vegetation', gridX: 4.00, gridY: 27.00, size: 2.0583527678338056, variant: 0 },
            { type: 'vegetation', gridX: 5.00, gridY: 32.75, size: 1.7287504227430963, variant: 3 },
            { type: 'vegetation', gridX: 4.00, gridY: 32.75, size: 2.1874428688267176, variant: 1 },
            { type: 'vegetation', gridX: 1.00, gridY: 25.00, size: 2.160065868934447, variant: 0 },
            { type: 'vegetation', gridX: 7.00, gridY: 25.00, size: 1.7926896526991007, variant: 3 },
            { type: 'vegetation', gridX: 2.00, gridY: 25.00, size: 1.850707062596637, variant: 1 },
            { type: 'vegetation', gridX: 4.00, gridY: 25.00, size: 2.3529752244262387, variant: 3 },
            { type: 'vegetation', gridX: 0.00, gridY: 23.00, size: 1.9277395944013729, variant: 3 },
            { type: 'vegetation', gridX: 4.00, gridY: 19.00, size: 1.6305975951613148, variant: 0 },
            { type: 'vegetation', gridX: 7.00, gridY: 21.00, size: 1.6172205680802216, variant: 3 },
            { type: 'vegetation', gridX: 6.00, gridY: 26.00, size: 2.3305645002013815, variant: 1 },
            { type: 'vegetation', gridX: 0.00, gridY: 22.00, size: 1.7799716535672063, variant: 0 },
            { type: 'vegetation', gridX: 1.00, gridY: 24.00, size: 1.9607804317834399, variant: 0 },
            { type: 'vegetation', gridX: 5.00, gridY: 21.00, size: 2.3047784839637484, variant: 3 },
            { type: 'vegetation', gridX: 3.00, gridY: 19.00, size: 2.4399598790860373, variant: 1 },
            { type: 'vegetation', gridX: 2.00, gridY: 19.00, size: 1.895897836928969, variant: 1 },
            { type: 'vegetation', gridX: 3.00, gridY: 13.00, size: 1.7787314310049749, variant: 3 },
            { type: 'vegetation', gridX: 2.00, gridY: 18.00, size: 2.2353707406991976, variant: 3 },
            { type: 'vegetation', gridX: 4.00, gridY: 18.00, size: 2.4469912501291597, variant: 1 },
            { type: 'vegetation', gridX: 5.00, gridY: 12.00, size: 2.4966996247862534, variant: 3 },
            { type: 'vegetation', gridX: 1.00, gridY: 14.00, size: 2.44149706108921, variant: 0 },
            { type: 'vegetation', gridX: 1.00, gridY: 19.00, size: 2.428904264765581, variant: 0 },
            { type: 'vegetation', gridX: 8.00, gridY: 15.00, size: 1.5597302093662448, variant: 0 },
            { type: 'vegetation', gridX: 0.00, gridY: 8.00, size: 1.7763044226170606, variant: 2 },
            { type: 'vegetation', gridX: 3.00, gridY: 7.00, size: 1.5851223589460748, variant: 2 },
            { type: 'vegetation', gridX: 4.00, gridY: 9.00, size: 2.009251666985179, variant: 1 },
            { type: 'vegetation', gridX: 0.00, gridY: 9.00, size: 1.568129557676564, variant: 1 },
            { type: 'vegetation', gridX: 4.00, gridY: 10.00, size: 2.1218035632733065, variant: 2 },
            { type: 'vegetation', gridX: 0.00, gridY: 10.00, size: 2.25427943535629, variant: 0 },
            { type: 'vegetation', gridX: 4.00, gridY: 5.00, size: 2.355265753830306, variant: 0 },
            { type: 'vegetation', gridX: 2.00, gridY: 10.00, size: 1.723438588067138, variant: 3 },
            { type: 'vegetation', gridX: 5.00, gridY: 8.00, size: 1.9875151212517226, variant: 1 },
            { type: 'vegetation', gridX: 5.00, gridY: 3.00, size: 2.4932224485234977, variant: 1 },
            { type: 'vegetation', gridX: 3.00, gridY: 1.00, size: 1.8438087650152861, variant: 1 },
            { type: 'vegetation', gridX: 3.00, gridY: 6.00, size: 2.0306884539644257, variant: 3 },
            { type: 'vegetation', gridX: 6.00, gridY: 4.00, size: 2.0835311664458507, variant: 3 },
            { type: 'vegetation', gridX: 10.00, gridY: 32.00, size: 2.3040906424104994, variant: 0 },
            { type: 'vegetation', gridX: 7.00, gridY: 30.00, size: 1.8667868984602678, variant: 2 },
            { type: 'vegetation', gridX: 10.00, gridY: 28.00, size: 2.113894779406677, variant: 1 },
            { type: 'vegetation', gridX: 11.00, gridY: 32.75, size: 2.371669099279017, variant: 3 },
            { type: 'vegetation', gridX: 9.00, gridY: 32.00, size: 1.7842020506159215, variant: 0 },
            { type: 'vegetation', gridX: 8.00, gridY: 32.75, size: 2.418283831883731, variant: 3 },
            { type: 'vegetation', gridX: 16.00, gridY: 31.00, size: 1.8775052004966826, variant: 2 },
            { type: 'vegetation', gridX: 14.00, gridY: 32.75, size: 2.340508899065049, variant: 0 },
            { type: 'vegetation', gridX: 17.00, gridY: 29.00, size: 2.1988955713624705, variant: 1 },
            { type: 'vegetation', gridX: 14.00, gridY: 29.00, size: 1.6984684466840843, variant: 1 },
            { type: 'vegetation', gridX: 18.00, gridY: 32.00, size: 1.530356564967711, variant: 3 },
            { type: 'vegetation', gridX: 14.00, gridY: 31.00, size: 1.9245267597570206, variant: 1 },
            { type: 'vegetation', gridX: 20.00, gridY: 30.00, size: 1.8964545592658504, variant: 3 },
            { type: 'vegetation', gridX: 20.00, gridY: 32.00, size: 1.6624073549626046, variant: 1 },
            { type: 'vegetation', gridX: 22.00, gridY: 30.00, size: 1.9444953595395458, variant: 0 },
            { type: 'vegetation', gridX: 20.00, gridY: 32.00, size: 2.1006209954959516, variant: 2 },
            { type: 'vegetation', gridX: 22.00, gridY: 30.00, size: 1.9441254702253783, variant: 3 },
            { type: 'vegetation', gridX: 24.00, gridY: 30.00, size: 1.7226634683727577, variant: 2 },
            { type: 'vegetation', gridX: 17.00, gridY: 33.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 2.00, gridY: 28.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 1.00, gridY: 5.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 3.00, gridY: 2.00, size: 2, variant: 1 },
            { type: 'vegetation', gridX: 3.00, gridY: 4.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 50.00, gridY: 32.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 59.00, gridY: 33.00, size: 2, variant: 2 },
            { type: 'vegetation', gridX: 51.00, gridY: 33.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 48.00, gridY: 33.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 55.00, gridY: 28.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 54.00, gridY: 22.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 51.00, gridY: 13.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 59.00, gridY: 19.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 59.00, gridY: 10.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 53.00, gridY: 8.00, size: 2.5, variant: 3 },
            { type: 'water', gridX: 13.00, gridY: 23.00, size: 4, waterType: 'lake' },
            { type: 'rock', gridX: 9.00, gridY: 23.00, size: 4, variant: 0 },
            { type: 'rock', gridX: 16.00, gridY: 26.00, size: 2.5, variant: 0 },
            { type: 'rock', gridX: 11.00, gridY: 21.00, size: 2.5, variant: 1 },
            { type: 'rock', gridX: 8.00, gridY: 17.00, size: 2.5, variant: 3 },
            { type: 'rock', gridX: 39.00, gridY: 4.00, size: 2.5, variant: 3 },
            { type: 'rock', gridX: 52.00, gridY: 5.00, size: 2.5, variant: 2 },
            { type: 'rock', gridX: 55.00, gridY: 19.00, size: 2.5, variant: 0 },
            { type: 'rock', gridX: 46.00, gridY: 33.00, size: 2.5, variant: 1 }
        ];
    }

    createMeanderingPath(canvasWidth, canvasHeight) {
        const gridWidth = this.gridWidth || 60;
        const gridHeight = this.gridHeight || 33.75;

        const pathInGridCoords = [
            { gridX: 8.00, gridY: 0.00 },
            { gridX: 8.00, gridY: 10.00 },
            { gridX: 30.00, gridY: 10.00 },
            { gridX: 30.00, gridY: 17.00 },
            { gridX: 44.00, gridY: 17.00 },
            { gridX: 44.00, gridY: 29.00 },
            { gridX: 35.00, gridY: 29.00 }
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
            enemyHealth_multiplier: 0.8, 
            speedMultiplier: 0.75, 
            spawnInterval: 2, 
            pattern: [{ type: 'basic', count: 20 }] 
        }
        // Wave 2
        , { 
            enemyHealth_multiplier: 1, 
            speedMultiplier: 0.7, 
            spawnInterval: 1.7, 
            pattern: [{ type: 'villager', count: 6 }, { type: 'basic', count: 2 }, { type: 'archer', count: 5 }] 
        }
        // Wave 3
        , { 
            enemyHealth_multiplier: 1.1, 
            speedMultiplier: 0.7, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'villager', count: 22 }] 
        }
        // Wave 4
        , { 
            enemyHealth_multiplier: 1, 
            speedMultiplier: 1, 
            spawnInterval: 1, 
            pattern: [{ type: 'archer', count: 12 }] 
        }
        // Wave 5
        , { 
            enemyHealth_multiplier: 1.5, 
            speedMultiplier: 0.67, 
            spawnInterval: 2, 
            pattern: [{ type: 'beefyenemy', count: 2 }] 
        }
        // Wave 6
        , { 
            enemyHealth_multiplier: 1.1, 
            speedMultiplier: 1, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'archer', count: 22 }] 
        }
        // Wave 7
        , { 
            enemyHealth_multiplier: 1.5, 
            speedMultiplier: 0.6, 
            spawnInterval: 1.2, 
            pattern: [{ type: 'basic', count: 15 }, { type: 'villager', count: 15 }] 
        }
        // Wave 8
        , { 
            enemyHealth_multiplier: 1.5, 
            speedMultiplier: 0.5, 
            spawnInterval: 1, 
            pattern: [{ type: 'basic', count: 10 }, { type: 'villager', count: 10 }, { type: 'beefyenemy', count: 2 }] 
        }
        // Wave 9
        , { 
            enemyHealth_multiplier: 2, 
            speedMultiplier: 0.5, 
            spawnInterval: 1.5, 
            pattern: [{ type: 'beefyenemy', count: 10 }] 
        }
        // Wave 10
        , { 
            enemyHealth_multiplier: 1.8, 
            speedMultiplier: 0.5, 
            spawnInterval: 1.2, 
            pattern: [{ type: 'beefyenemy', count: 7 }, { type: 'archer', count: 5 }, { type: 'basic', count: 5 }, { type: 'villager', count: 5 }] 
        }
        // Wave 11
        , { 
            enemyHealth_multiplier: 1.3, 
            speedMultiplier: 0.9, 
            spawnInterval: 0.5, 
            pattern: [{ type: 'archer', count: 35 }] 
        }
        // Wave 12
        , { 
            enemyHealth_multiplier: 1.5, 
            speedMultiplier: 0.85, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'beefyenemy', count: 10 }] 
        }
        // Wave 13
        , { 
            enemyHealth_multiplier: 1.2, 
            speedMultiplier: 1.25, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'villager', count: 12 }, { type: 'basic', count: 14 }, { type: 'archer', count: 12 }, { type: 'beefyenemy', count: 6 }] 
        }
        // Wave 14
        , { 
            enemyHealth_multiplier: 1.6, 
            speedMultiplier: 1, 
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