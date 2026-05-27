import { LevelBase } from '../LevelBase.js';

export class ForestLevel9 extends LevelBase {
    static levelMetadata = {
        name: 'Dimlador',
        difficulty: 'Easy',
        order: 9,
        campaign: 'forest'
    };

    constructor() {
        super();
        // Derive instance properties from static metadata
        this.levelName = ForestLevel9.levelMetadata.name;
        this.levelNumber = ForestLevel9.levelMetadata.order;
        this.difficulty = ForestLevel9.levelMetadata.difficulty;
        this.campaign = ForestLevel9.levelMetadata.campaign;
        this.maxWaves = 11;

        // Set terrain elements (prevent tower placement on these areas)
        this.terrainElements = [
            { type: 'vegetation', gridX: 6.00, gridY: 16.00, size: 2.627896856424345, variant: 1 },
            { type: 'vegetation', gridX: 9.00, gridY: 14.00, size: 2.0846673890872918, variant: 1 },
            { type: 'vegetation', gridX: 10.00, gridY: 3.00, size: 2.305884815674799, variant: 0 },
            { type: 'vegetation', gridX: 14.00, gridY: 10.00, size: 2.2049897777798604, variant: 1 },
            { type: 'vegetation', gridX: 1.00, gridY: 3.00, size: 2.1304957844249826, variant: 2 },
            { type: 'vegetation', gridX: 8.00, gridY: 11.00, size: 1.9677250795816508, variant: 1 },
            { type: 'vegetation', gridX: 13.00, gridY: 7.00, size: 2.6338509922719346, variant: 2 },
            { type: 'vegetation', gridX: 7.00, gridY: 10.00, size: 1.5561260388157652, variant: 2 },
            { type: 'vegetation', gridX: 7.00, gridY: 12.00, size: 2.1812977783534553, variant: 0 },
            { type: 'vegetation', gridX: 9.00, gridY: 8.00, size: 1.9034482032110946, variant: 1 },
            { type: 'vegetation', gridX: 3.00, gridY: 13.00, size: 2.521260573995405, variant: 1 },
            { type: 'vegetation', gridX: 5.00, gridY: 8.00, size: 2.1352963541075343, variant: 0 },
            { type: 'vegetation', gridX: 7.00, gridY: 8.00, size: 1.674465307540907, variant: 1 },
            { type: 'vegetation', gridX: 10.00, gridY: 5.00, size: 2.9897034224294075, variant: 3 },
            { type: 'vegetation', gridX: 5.00, gridY: 2.00, size: 2.8937361174714287, variant: 0 },
            { type: 'vegetation', gridX: 5.00, gridY: 8.00, size: 1.5558784945249602, variant: 1 },
            { type: 'vegetation', gridX: 7.00, gridY: 13.00, size: 1.7701985667907114, variant: 3 },
            { type: 'vegetation', gridX: 5.00, gridY: 6.00, size: 2.1449307013293177, variant: 2 },
            { type: 'vegetation', gridX: 6.00, gridY: 12.00, size: 2.549500315513068, variant: 0 },
            { type: 'vegetation', gridX: 3.00, gridY: 8.00, size: 2.863196582430165, variant: 1 },
            { type: 'vegetation', gridX: 0.00, gridY: 9.00, size: 2.0135914735553664, variant: 0 },
            { type: 'vegetation', gridX: 5.00, gridY: 6.00, size: 2.2284808564563807, variant: 2 },
            { type: 'vegetation', gridX: 8.00, gridY: 18.00, size: 2.923715187406762, variant: 3 },
            { type: 'vegetation', gridX: 14.00, gridY: 10.00, size: 2.6402268313132877, variant: 2 },
            { type: 'vegetation', gridX: 5.00, gridY: 17.00, size: 2.80440465015929, variant: 1 },
            { type: 'vegetation', gridX: 11.00, gridY: 13.00, size: 2.9207588123426698, variant: 0 },
            { type: 'vegetation', gridX: 1.00, gridY: 13.00, size: 1.9434839755120765, variant: 2 },
            { type: 'vegetation', gridX: 12.00, gridY: 11.00, size: 2.903541159840026, variant: 0 },
            { type: 'vegetation', gridX: 5.00, gridY: 10.00, size: 1.6814292273635953, variant: 3 },
            { type: 'vegetation', gridX: 12.00, gridY: 14.00, size: 2.646641196034567, variant: 2 },
            { type: 'vegetation', gridX: 7.00, gridY: 15.00, size: 2.632043506487959, variant: 0 },
            { type: 'vegetation', gridX: 0.00, gridY: 10.00, size: 1.9732364599680143, variant: 1 },
            { type: 'vegetation', gridX: 6.00, gridY: 25.00, size: 2.6991367091992724, variant: 2 },
            { type: 'vegetation', gridX: 4.00, gridY: 22.00, size: 2.885423164966632, variant: 0 },
            { type: 'vegetation', gridX: 6.00, gridY: 29.00, size: 2.700322013017139, variant: 2 },
            { type: 'vegetation', gridX: 6.00, gridY: 20.00, size: 1.6973514112526673, variant: 0 },
            { type: 'vegetation', gridX: 3.00, gridY: 21.00, size: 2.2185712067031673, variant: 2 },
            { type: 'vegetation', gridX: 1.00, gridY: 20.00, size: 2.5282066290846785, variant: 1 },
            { type: 'vegetation', gridX: 5.00, gridY: 22.00, size: 1.6643135073348025, variant: 3 },
            { type: 'vegetation', gridX: 2.00, gridY: 25.00, size: 2.179030658438725, variant: 0 },
            { type: 'vegetation', gridX: 1.00, gridY: 25.00, size: 2.650867978340293, variant: 1 },
            { type: 'vegetation', gridX: 1.00, gridY: 24.00, size: 2.9899469075531693, variant: 3 },
            { type: 'vegetation', gridX: 9.00, gridY: 16.00, size: 2.6591386911916466, variant: 3 },
            { type: 'vegetation', gridX: 10.00, gridY: 15.00, size: 2.8732022455598623, variant: 2 },
            { type: 'vegetation', gridX: 5.00, gridY: 25.00, size: 1.80876685918423, variant: 2 },
            { type: 'vegetation', gridX: 14.00, gridY: 18.00, size: 2.814091496827345, variant: 0 },
            { type: 'vegetation', gridX: 10.00, gridY: 15.00, size: 2.313308030228443, variant: 0 },
            { type: 'vegetation', gridX: 4.00, gridY: 28.00, size: 2.9290541786724553, variant: 0 },
            { type: 'vegetation', gridX: 10.00, gridY: 21.00, size: 2.2767375557878404, variant: 0 },
            { type: 'vegetation', gridX: 17.00, gridY: 24.00, size: 2.1568253047244985, variant: 1 },
            { type: 'vegetation', gridX: 10.00, gridY: 26.00, size: 1.7223046164653515, variant: 2 },
            { type: 'vegetation', gridX: 18.00, gridY: 31.00, size: 1.839830463425084, variant: 3 },
            { type: 'vegetation', gridX: 13.00, gridY: 32.75, size: 2.8882426164533936, variant: 3 },
            { type: 'vegetation', gridX: 9.00, gridY: 22.00, size: 2.283652863086256, variant: 0 },
            { type: 'vegetation', gridX: 13.00, gridY: 27.00, size: 1.7679269462856453, variant: 3 },
            { type: 'vegetation', gridX: 11.00, gridY: 19.00, size: 2.883920405335525, variant: 1 },
            { type: 'vegetation', gridX: 13.00, gridY: 21.00, size: 2.3274477005234155, variant: 0 },
            { type: 'vegetation', gridX: 16.00, gridY: 22.00, size: 2.0886192558479957, variant: 2 },
            { type: 'vegetation', gridX: 18.00, gridY: 21.00, size: 2.4650242917709906, variant: 0 },
            { type: 'vegetation', gridX: 10.00, gridY: 26.00, size: 2.137085804708536, variant: 2 },
            { type: 'vegetation', gridX: 10.00, gridY: 28.00, size: 2.7970667334808654, variant: 1 },
            { type: 'vegetation', gridX: 8.00, gridY: 32.00, size: 2.4920521147189616, variant: 3 },
            { type: 'vegetation', gridX: 20.00, gridY: 24.00, size: 2.9205660425169873, variant: 3 },
            { type: 'vegetation', gridX: 26.00, gridY: 29.00, size: 2.6752287769540644, variant: 1 },
            { type: 'vegetation', gridX: 26.00, gridY: 26.00, size: 2.114678985107029, variant: 0 },
            { type: 'vegetation', gridX: 20.00, gridY: 21.00, size: 2.973330549086805, variant: 0 },
            { type: 'vegetation', gridX: 27.00, gridY: 28.00, size: 1.6377925599918162, variant: 2 },
            { type: 'vegetation', gridX: 14.00, gridY: 30.00, size: 1.9840691174950362, variant: 1 },
            { type: 'vegetation', gridX: 22.00, gridY: 21.00, size: 2.004164407527135, variant: 2 },
            { type: 'vegetation', gridX: 14.00, gridY: 28.00, size: 1.7832232117741773, variant: 0 },
            { type: 'vegetation', gridX: 24.00, gridY: 20.00, size: 2.71933709634469, variant: 3 },
            { type: 'vegetation', gridX: 18.00, gridY: 25.00, size: 1.833556839418483, variant: 1 },
            { type: 'vegetation', gridX: 17.00, gridY: 30.00, size: 1.6954452388206558, variant: 0 },
            { type: 'vegetation', gridX: 27.00, gridY: 26.00, size: 2.9801513047818093, variant: 0 },
            { type: 'vegetation', gridX: 23.00, gridY: 26.00, size: 1.8064571997252343, variant: 0 },
            { type: 'vegetation', gridX: 21.00, gridY: 26.00, size: 1.8341173583109824, variant: 3 },
            { type: 'vegetation', gridX: 18.00, gridY: 31.00, size: 2.1254506718929482, variant: 1 },
            { type: 'vegetation', gridX: 16.00, gridY: 32.00, size: 1.933123949756079, variant: 3 },
            { type: 'vegetation', gridX: 9.00, gridY: 24.00, size: 2.9214137037149768, variant: 0 },
            { type: 'vegetation', gridX: 9.00, gridY: 23.00, size: 2.6712689100367726, variant: 2 },
            { type: 'vegetation', gridX: 2.00, gridY: 28.00, size: 2.3594126325821705, variant: 2 },
            { type: 'vegetation', gridX: 4.00, gridY: 30.00, size: 2.1904854992694, variant: 0 },
            { type: 'vegetation', gridX: 2.00, gridY: 23.00, size: 2.616636174203161, variant: 2 },
            { type: 'vegetation', gridX: 12.00, gridY: 26.00, size: 2.28898368539752, variant: 0 },
            { type: 'vegetation', gridX: 13.00, gridY: 30.00, size: 1.6802278147971965, variant: 0 },
            { type: 'vegetation', gridX: 14.00, gridY: 31.00, size: 1.9947821725271588, variant: 2 },
            { type: 'vegetation', gridX: 11.00, gridY: 21.00, size: 2.144800329675384, variant: 0 },
            { type: 'vegetation', gridX: 5.00, gridY: 22.00, size: 2.756638876625911, variant: 1 },
            { type: 'vegetation', gridX: 5.00, gridY: 25.00, size: 2.6410187999941517, variant: 2 },
            { type: 'vegetation', gridX: 3.00, gridY: 27.00, size: 2.0162902495975557, variant: 0 },
            { type: 'vegetation', gridX: 12.00, gridY: 32.75, size: 2.1817421425146546, variant: 2 },
            { type: 'vegetation', gridX: 7.00, gridY: 20.00, size: 1.7268397603385, variant: 0 },
            { type: 'vegetation', gridX: 5.00, gridY: 29.00, size: 2.9788157883098583, variant: 3 },
            { type: 'vegetation', gridX: 22.00, gridY: 28.00, size: 1.9507052656330917, variant: 1 },
            { type: 'vegetation', gridX: 20.00, gridY: 29.00, size: 1.9796122453452925, variant: 1 },
            { type: 'vegetation', gridX: 25.00, gridY: 30.00, size: 2.776288683472009, variant: 3 },
            { type: 'vegetation', gridX: 19.00, gridY: 30.00, size: 2.895817289393319, variant: 2 },
            { type: 'vegetation', gridX: 20.00, gridY: 29.00, size: 2.246131849840784, variant: 3 },
            { type: 'vegetation', gridX: 22.00, gridY: 27.00, size: 2.763983154575838, variant: 1 },
            { type: 'vegetation', gridX: 20.00, gridY: 31.00, size: 2.965135774653797, variant: 3 },
            { type: 'vegetation', gridX: 24.00, gridY: 31.00, size: 1.9675043707009778, variant: 3 },
            { type: 'vegetation', gridX: 20.00, gridY: 32.00, size: 2.6189443542629256, variant: 1 },
            { type: 'vegetation', gridX: 24.00, gridY: 31.00, size: 2.185317013435105, variant: 3 },
            { type: 'vegetation', gridX: 23.00, gridY: 29.00, size: 2.4407348926250343, variant: 2 },
            { type: 'vegetation', gridX: 25.00, gridY: 32.00, size: 1.8458812460687934, variant: 0 },
            { type: 'vegetation', gridX: 30.00, gridY: 32.75, size: 2.920029675112885, variant: 2 },
            { type: 'vegetation', gridX: 30.00, gridY: 32.00, size: 2.3444280127811856, variant: 0 },
            { type: 'vegetation', gridX: 30.00, gridY: 29.00, size: 1.8246988122375107, variant: 2 },
            { type: 'vegetation', gridX: 30.00, gridY: 31.00, size: 2.7662195837594536, variant: 3 },
            { type: 'vegetation', gridX: 30.00, gridY: 29.00, size: 2.185889054344186, variant: 0 },
            { type: 'vegetation', gridX: 29.00, gridY: 32.00, size: 2.560143869672187, variant: 2 },
            { type: 'vegetation', gridX: 35.00, gridY: 29.00, size: 2.9662618031695898, variant: 1 },
            { type: 'vegetation', gridX: 36.00, gridY: 29.00, size: 2.3600996877678115, variant: 2 },
            { type: 'vegetation', gridX: 33.00, gridY: 30.00, size: 1.933142747679285, variant: 2 },
            { type: 'vegetation', gridX: 33.00, gridY: 32.75, size: 2.8810415843390804, variant: 1 },
            { type: 'vegetation', gridX: 37.00, gridY: 31.00, size: 2.6315159485505846, variant: 2 },
            { type: 'vegetation', gridX: 32.00, gridY: 31.00, size: 1.6797602275969363, variant: 2 },
            { type: 'vegetation', gridX: 14.00, gridY: 2.00, size: 2.2184835496694344, variant: 0 },
            { type: 'vegetation', gridX: 12.00, gridY: 4.00, size: 2.3337358330211586, variant: 0 },
            { type: 'vegetation', gridX: 12.00, gridY: 4.00, size: 1.7568564490746519, variant: 2 },
            { type: 'vegetation', gridX: 16.00, gridY: 2.00, size: 2.897000018460476, variant: 3 },
            { type: 'vegetation', gridX: 12.00, gridY: 3.00, size: 2.3244376109713665, variant: 2 },
            { type: 'vegetation', gridX: 14.00, gridY: 2.00, size: 2.040399057380896, variant: 3 },
            { type: 'vegetation', gridX: 7.00, gridY: 1.00, size: 2.307494355529421, variant: 1 },
            { type: 'vegetation', gridX: 10.00, gridY: 4.00, size: 2.4983665726435027, variant: 1 },
            { type: 'vegetation', gridX: 5.00, gridY: 2.00, size: 2.5697173838657905, variant: 1 },
            { type: 'vegetation', gridX: 8.00, gridY: 3.00, size: 2.723815444474986, variant: 3 },
            { type: 'vegetation', gridX: 8.00, gridY: 4.00, size: 1.806756687112498, variant: 2 },
            { type: 'vegetation', gridX: 2.00, gridY: 2.00, size: 2.4633230481130033, variant: 2 },
            { type: 'vegetation', gridX: 5.00, gridY: 3.00, size: 2.9173795650281313, variant: 2 },
            { type: 'vegetation', gridX: 2.00, gridY: 2.00, size: 2.272984344764682, variant: 1 },
            { type: 'vegetation', gridX: 3.00, gridY: 7.00, size: 1.5079697225534276, variant: 0 },
            { type: 'vegetation', gridX: 3.00, gridY: 4.00, size: 2.8356747394222537, variant: 1 },
            { type: 'vegetation', gridX: 4.00, gridY: 3.00, size: 2.218270346051749, variant: 0 },
            { type: 'vegetation', gridX: 58.00, gridY: 2.00, size: 1.7682496705495174, variant: 2 },
            { type: 'vegetation', gridX: 58.00, gridY: 4.00, size: 2.153751907589869, variant: 0 },
            { type: 'vegetation', gridX: 57.00, gridY: 3.00, size: 2.057455782093958, variant: 1 },
            { type: 'vegetation', gridX: 59.00, gridY: 8.00, size: 2.9992320640876216, variant: 0 },
            { type: 'vegetation', gridX: 58.00, gridY: 9.00, size: 2.0631103909404835, variant: 0 },
            { type: 'vegetation', gridX: 57.00, gridY: 11.00, size: 2.3786251022384604, variant: 3 },
            { type: 'vegetation', gridX: 57.00, gridY: 8.00, size: 1.7838245043875163, variant: 3 },
            { type: 'vegetation', gridX: 58.00, gridY: 10.00, size: 2.2503365437811693, variant: 2 },
            { type: 'vegetation', gridX: 58.00, gridY: 7.00, size: 1.7032363139487234, variant: 2 },
            { type: 'vegetation', gridX: 50.00, gridY: 3.00, size: 1.8024432043852352, variant: 1 },
            { type: 'vegetation', gridX: 52.00, gridY: 3.00, size: 2.104676017407721, variant: 0 },
            { type: 'vegetation', gridX: 52.00, gridY: 4.00, size: 1.8607389118487228, variant: 1 },
            { type: 'vegetation', gridX: 51.00, gridY: 2.00, size: 2.034384130094094, variant: 0 },
            { type: 'vegetation', gridX: 21.00, gridY: 5.00, size: 1.5773731515172835, variant: 1 },
            { type: 'vegetation', gridX: 20.00, gridY: 3.00, size: 2.884308034868593, variant: 1 },
            { type: 'vegetation', gridX: 20.00, gridY: 3.00, size: 1.748878427008147, variant: 0 },
            { type: 'vegetation', gridX: 19.00, gridY: 3.00, size: 2.3625074061372278, variant: 0 },
            { type: 'vegetation', gridX: 18.00, gridY: 2.00, size: 1.6942958276748386, variant: 1 },
            { type: 'water', gridX: 17.00, gridY: 6.00, size: 3, waterType: 'lake' },
            { type: 'rock', gridX: 16.00, gridY: 10.00, size: 2.5, variant: 0 },
            { type: 'rock', gridX: 16.00, gridY: 3.00, size: 2.5, variant: 2 },
            { type: 'rock', gridX: 48.00, gridY: 26.00, size: 2.5, variant: 3 },
            { type: 'rock', gridX: 22.00, gridY: 23.00, size: 3, variant: 3 },
            { type: 'rock', gridX: 54.00, gridY: 2.00, size: 4, variant: 3 },
            { type: 'rock', gridX: 59.00, gridY: 12.00, size: 2.5, variant: 1 },
            { type: 'rock', gridX: 33.00, gridY: 27.00, size: 2.5, variant: 1 },
            { type: 'rock', gridX: 5.00, gridY: 32.00, size: 2.5, variant: 1 },
            { type: 'rock', gridX: 1.00, gridY: 16.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 2.00, gridY: 32.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 8.00, gridY: 28.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 11.00, gridY: 30.00, size: 2.5, variant: 2 },
            { type: 'vegetation', gridX: 3.00, gridY: 18.00, size: 2.5, variant: 2 },
            { type: 'rock', gridX: 12.00, gridY: 23.00, size: 1, variant: 2 },
            { type: 'rock', gridX: 17.00, gridY: 27.00, size: 1.5, variant: 3 }
        ];
    }

    createMeanderingPath(canvasWidth, canvasHeight) {
        const gridWidth = this.gridWidth || 60;
        const gridHeight = this.gridHeight || 33.75;

        const pathInGridCoords = [
            { gridX: 60.00, gridY: 28.00 },
            { gridX: 47.00, gridY: 28.00 },
            { gridX: 42.00, gridY: 22.00 },
            { gridX: 42.00, gridY: 14.00 },
            { gridX: 48.00, gridY: 14.00 },
            { gridX: 48.00, gridY: 6.00 },
            { gridX: 29.00, gridY: 6.00 },
            { gridX: 29.00, gridY: 14.00 },
            { gridX: 34.00, gridY: 14.00 },
            { gridX: 34.00, gridY: 22.00 }
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
            spawnInterval: 4, 
            pattern: [{ type: 'archer', count: 14 }] 
        }
        // Wave 2
        , { 
            enemyHealth_multiplier: 1.2, 
            speedMultiplier: 0.9, 
            spawnInterval: 1.5, 
            pattern: [{ type: 'villager', count: 7 }, { type: 'basic', count: 8 }, { type: 'archer', count: 3, speedMultiplier: 1.3 }] 
        }
        // Wave 3
        , { 
            enemyHealth_multiplier: 1.1, 
            speedMultiplier: 1, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'villager', count: 10 }, { type: 'basic', count: 11 }, { type: 'archer', count: 6 }, { type: 'beefyenemy', count: 1, healthMultiplier: 1.8, speedMultiplier: 0.5 }] 
        }
        // Wave 4
        , { 
            enemyHealth_multiplier: 1.2, 
            speedMultiplier: 1.2, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'archer', count: 25 }] 
        }
        // Wave 5
        , { 
            enemyHealth_multiplier: 2, 
            speedMultiplier: 0.8, 
            spawnInterval: 1.5, 
            pattern: [{ type: 'beefyenemy', count: 4 }] 
        }
        // Wave 6
        , { 
            enemyHealth_multiplier: 1.3, 
            speedMultiplier: 1.2, 
            spawnInterval: 0.5, 
            pattern: [{ type: 'villager', count: 28 }] 
        }
        // Wave 7
        , { 
            enemyHealth_multiplier: 1.2, 
            speedMultiplier: 1, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'beefyenemy', count: 3, healthMultiplier: 2, speedMultiplier: 0.6 }, { type: 'archer', count: 12 }] 
        }
        // Wave 8
        , { 
            enemyHealth_multiplier: 1.4, 
            speedMultiplier: 1, 
            spawnInterval: 1, 
            pattern: [{ type: 'basic', count: 15 }, { type: 'villager', count: 15 }, { type: 'beefyenemy', count: 4, healthMultiplier: 2, speedMultiplier: 0.6 }] 
        }
        // Wave 9
        , { 
            enemyHealth_multiplier: 2.2, 
            speedMultiplier: 0.7, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'beefyenemy', count: 12 }] 
        }
        // Wave 10
        , { 
            enemyHealth_multiplier: 1.6, 
            speedMultiplier: 1, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'beefyenemy', count: 7, healthMultiplier: 2.3, speedMultiplier: 0.6 }, { type: 'archer', count: 13, speedMultiplier: 1.5 }, { type: 'basic', count: 8 }, { type: 'villager', count: 10 }] 
        }
        // Wave 11
        , { 
            enemyHealth_multiplier: 1.2, 
            speedMultiplier: 1, 
            spawnInterval: 0.3, 
            pattern: [{ type: 'knight', count: 1, healthMultiplier: 3 }, { type: 'beefyenemy', count: 14, healthMultiplier: 2.5 }] 
        }
        ];

        if (wave > 0 && wave <= waveConfigs.length) {
            return waveConfigs[wave - 1];
        }
        
        return null;
    }
}