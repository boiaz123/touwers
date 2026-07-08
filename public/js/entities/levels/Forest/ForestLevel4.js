import { LevelBase } from '../LevelBase.js';

export class ForestLevel4 extends LevelBase {
    static levelMetadata = {
        name: 'Tal Farran',
        difficulty: 'Easy',
        order: 4,
        campaign: 'forest'
    };

    constructor() {
        super();
        // Derive instance properties from static metadata
        this.levelName = ForestLevel4.levelMetadata.name;
        this.levelNumber = ForestLevel4.levelMetadata.order;
        this.difficulty = ForestLevel4.levelMetadata.difficulty;
        this.campaign = ForestLevel4.levelMetadata.campaign;
        this.maxWaves = 12;

        // Set terrain elements (prevent tower placement on these areas)
        this.terrainElements = [
            { type: 'vegetation', gridX: 5.00, gridY: 1.00, size: 1.1309055073878502, variant: 2 },
            { type: 'vegetation', gridX: 4.00, gridY: 0.00, size: 1.6275501560002563, variant: 1 },
            { type: 'vegetation', gridX: 3.00, gridY: 3.00, size: 1.551915061876918, variant: 2 },
            { type: 'vegetation', gridX: 0.00, gridY: 1.00, size: 1.1650179556481048, variant: 1 },
            { type: 'vegetation', gridX: 3.00, gridY: 0.00, size: 1.8569445241370786, variant: 0 },
            { type: 'vegetation', gridX: 2.00, gridY: 0.00, size: 1.907935439681063, variant: 2 },
            { type: 'vegetation', gridX: 0.00, gridY: 6.00, size: 2.085650827156705, variant: 3 },
            { type: 'vegetation', gridX: 3.00, gridY: 6.00, size: 2.0733912492928477, variant: 2 },
            { type: 'vegetation', gridX: 1.00, gridY: 7.00, size: 2.6091686637681306, variant: 0 },
            { type: 'vegetation', gridX: 0.00, gridY: 2.00, size: 2.248912765653884, variant: 1 },
            { type: 'vegetation', gridX: 3.00, gridY: 4.00, size: 1.096640746422176, variant: 3 },
            { type: 'vegetation', gridX: 0.00, gridY: 4.00, size: 2.3950769330793724, variant: 1 },
            { type: 'vegetation', gridX: 2.00, gridY: 17.00, size: 2.840000649880629, variant: 1 },
            { type: 'vegetation', gridX: 1.00, gridY: 17.00, size: 2.6717193905872145, variant: 1 },
            { type: 'vegetation', gridX: 5.00, gridY: 15.00, size: 2.7104165082760736, variant: 1 },
            { type: 'vegetation', gridX: 2.00, gridY: 15.00, size: 2.7462484243179324, variant: 0 },
            { type: 'vegetation', gridX: 4.00, gridY: 17.00, size: 1.161913684768239, variant: 2 },
            { type: 'vegetation', gridX: 3.00, gridY: 18.00, size: 1.5259981415692494, variant: 2 },
            { type: 'vegetation', gridX: 4.00, gridY: 12.00, size: 2.3774137843346903, variant: 3 },
            { type: 'vegetation', gridX: 3.00, gridY: 11.00, size: 1.5869305821169282, variant: 3 },
            { type: 'vegetation', gridX: 2.00, gridY: 8.00, size: 1.420197027960273, variant: 2 },
            { type: 'vegetation', gridX: 1.00, gridY: 12.00, size: 1.281100334110509, variant: 1 },
            { type: 'vegetation', gridX: 5.00, gridY: 13.00, size: 2.1950252554929035, variant: 2 },
            { type: 'vegetation', gridX: 2.00, gridY: 9.00, size: 1.7375388309678417, variant: 0 },
            { type: 'vegetation', gridX: 3.00, gridY: 30.00, size: 1.4961039341838698, variant: 3 },
            { type: 'vegetation', gridX: 3.00, gridY: 29.00, size: 1.9297541721862805, variant: 0 },
            { type: 'vegetation', gridX: 2.00, gridY: 31.00, size: 1.7076797980692058, variant: 2 },
            { type: 'vegetation', gridX: 4.00, gridY: 31.00, size: 2.6371471600552425, variant: 3 },
            { type: 'vegetation', gridX: 4.00, gridY: 30.00, size: 1.9650676204410868, variant: 0 },
            { type: 'vegetation', gridX: 0.00, gridY: 31.00, size: 1.2268948664316082, variant: 1 },
            { type: 'vegetation', gridX: 7.00, gridY: 32.75, size: 1.3851321712924944, variant: 0 },
            { type: 'vegetation', gridX: 8.00, gridY: 30.00, size: 2.648632273234087, variant: 0 },
            { type: 'vegetation', gridX: 5.00, gridY: 30.00, size: 1.946439344202631, variant: 1 },
            { type: 'vegetation', gridX: 8.00, gridY: 29.00, size: 2.93587830200764, variant: 1 },
            { type: 'vegetation', gridX: 5.00, gridY: 32.00, size: 2.171848804836819, variant: 0 },
            { type: 'vegetation', gridX: 7.00, gridY: 28.00, size: 1.0437046072419154, variant: 2 },
            { type: 'vegetation', gridX: 12.00, gridY: 30.00, size: 2.4351261135168185, variant: 0 },
            { type: 'vegetation', gridX: 13.00, gridY: 30.00, size: 2.93336572860984, variant: 1 },
            { type: 'vegetation', gridX: 13.00, gridY: 32.75, size: 1.92820475219823, variant: 1 },
            { type: 'vegetation', gridX: 13.00, gridY: 30.00, size: 1.0561200674400946, variant: 2 },
            { type: 'vegetation', gridX: 10.00, gridY: 30.00, size: 1.9008115862219235, variant: 3 },
            { type: 'vegetation', gridX: 13.00, gridY: 31.00, size: 2.0304741275789473, variant: 1 },
            { type: 'vegetation', gridX: 17.00, gridY: 32.75, size: 2.8409907506528858, variant: 2 },
            { type: 'vegetation', gridX: 16.00, gridY: 29.00, size: 2.7898590945615274, variant: 1 },
            { type: 'vegetation', gridX: 14.00, gridY: 32.00, size: 2.6798851328246815, variant: 0 },
            { type: 'vegetation', gridX: 16.00, gridY: 32.75, size: 1.8808934724390938, variant: 1 },
            { type: 'vegetation', gridX: 18.00, gridY: 30.00, size: 2.8765305701791197, variant: 1 },
            { type: 'vegetation', gridX: 18.00, gridY: 30.00, size: 2.1804726042013476, variant: 0 },
            { type: 'vegetation', gridX: 2.00, gridY: 27.00, size: 2.714873315181223, variant: 2 },
            { type: 'vegetation', gridX: 3.00, gridY: 23.00, size: 1.990238672542491, variant: 1 },
            { type: 'vegetation', gridX: 5.00, gridY: 23.00, size: 2.4517790207664274, variant: 0 },
            { type: 'vegetation', gridX: 6.00, gridY: 24.00, size: 2.7049507109814863, variant: 1 },
            { type: 'vegetation', gridX: 5.00, gridY: 27.00, size: 1.6872791982127462, variant: 1 },
            { type: 'vegetation', gridX: 3.00, gridY: 28.00, size: 1.8233020661789403, variant: 2 },
            { type: 'vegetation', gridX: 1.00, gridY: 22.00, size: 2.951735596182683, variant: 2 },
            { type: 'vegetation', gridX: 2.00, gridY: 23.00, size: 1.809834061969994, variant: 0 },
            { type: 'vegetation', gridX: 3.00, gridY: 22.00, size: 2.5387055993671783, variant: 0 },
            { type: 'vegetation', gridX: 0.00, gridY: 21.00, size: 1.7849774096569306, variant: 3 },
            { type: 'vegetation', gridX: 6.00, gridY: 21.00, size: 1.4509908936396256, variant: 2 },
            { type: 'vegetation', gridX: 5.00, gridY: 20.00, size: 2.628588134111387, variant: 1 },
            { type: 'vegetation', gridX: 21.00, gridY: 32.75, size: 2.051972383450588, variant: 2 },
            { type: 'vegetation', gridX: 24.00, gridY: 30.00, size: 1.0376431984265349, variant: 2 },
            { type: 'vegetation', gridX: 20.00, gridY: 28.00, size: 2.9549737386919586, variant: 0 },
            { type: 'vegetation', gridX: 19.00, gridY: 31.00, size: 2.2618647609225704, variant: 2 },
            { type: 'vegetation', gridX: 21.00, gridY: 32.75, size: 2.9032300901965997, variant: 3 },
            { type: 'vegetation', gridX: 19.00, gridY: 32.00, size: 1.3168391329403284, variant: 1 },
            { type: 'vegetation', gridX: 26.00, gridY: 31.00, size: 2.4256616494244847, variant: 3 },
            { type: 'vegetation', gridX: 26.00, gridY: 32.75, size: 1.5637349081558631, variant: 0 },
            { type: 'vegetation', gridX: 25.00, gridY: 31.00, size: 1.7373652729733071, variant: 0 },
            { type: 'vegetation', gridX: 26.00, gridY: 30.00, size: 2.743739227932126, variant: 3 },
            { type: 'vegetation', gridX: 24.00, gridY: 29.00, size: 1.1403973642989365, variant: 0 },
            { type: 'vegetation', gridX: 27.00, gridY: 30.00, size: 2.1194181725566823, variant: 3 },
            { type: 'vegetation', gridX: 28.00, gridY: 32.75, size: 2.1996752665206403, variant: 0 },
            { type: 'vegetation', gridX: 31.00, gridY: 32.75, size: 1.4834255840413395, variant: 2 },
            { type: 'vegetation', gridX: 31.00, gridY: 32.75, size: 2.4150304830873166, variant: 1 },
            { type: 'vegetation', gridX: 28.00, gridY: 29.00, size: 1.2709426203836685, variant: 0 },
            { type: 'vegetation', gridX: 30.00, gridY: 28.00, size: 1.3596732104362883, variant: 1 },
            { type: 'vegetation', gridX: 32.00, gridY: 29.00, size: 2.456287928051806, variant: 0 },
            { type: 'vegetation', gridX: 33.00, gridY: 32.75, size: 1.9088291081123592, variant: 3 },
            { type: 'vegetation', gridX: 34.00, gridY: 28.00, size: 1.7886665020323744, variant: 0 },
            { type: 'vegetation', gridX: 33.00, gridY: 31.00, size: 1.7158071295870834, variant: 0 },
            { type: 'vegetation', gridX: 37.00, gridY: 30.00, size: 2.6442150382237015, variant: 0 },
            { type: 'vegetation', gridX: 37.00, gridY: 31.00, size: 2.5681853051472494, variant: 3 },
            { type: 'vegetation', gridX: 37.00, gridY: 31.00, size: 2.5130290488825313, variant: 1 },
            { type: 'vegetation', gridX: 39.00, gridY: 31.00, size: 1.6332744275209732, variant: 0 },
            { type: 'vegetation', gridX: 38.00, gridY: 31.00, size: 2.0326601861789264, variant: 0 },
            { type: 'vegetation', gridX: 40.00, gridY: 32.00, size: 1.3216714087172479, variant: 1 },
            { type: 'vegetation', gridX: 39.00, gridY: 32.00, size: 2.0162593818333816, variant: 2 },
            { type: 'vegetation', gridX: 43.00, gridY: 32.75, size: 1.6259911369514168, variant: 0 },
            { type: 'vegetation', gridX: 38.00, gridY: 31.00, size: 2.5585737094166214, variant: 0 },
            { type: 'vegetation', gridX: 48.00, gridY: 32.75, size: 1.0156280380547285, variant: 1 },
            { type: 'vegetation', gridX: 50.00, gridY: 31.00, size: 1.6761933962735318, variant: 1 },
            { type: 'vegetation', gridX: 49.00, gridY: 29.00, size: 2.821246479438061, variant: 1 },
            { type: 'vegetation', gridX: 50.00, gridY: 31.00, size: 2.041480575767765, variant: 2 },
            { type: 'vegetation', gridX: 49.00, gridY: 31.00, size: 2.3016328320553727, variant: 0 },
            { type: 'vegetation', gridX: 51.00, gridY: 29.00, size: 1.438997150956554, variant: 1 },
            { type: 'vegetation', gridX: 43.00, gridY: 27.00, size: 1.4553024324285826, variant: 3 },
            { type: 'vegetation', gridX: 44.00, gridY: 27.00, size: 2.6773730461078458, variant: 0 },
            { type: 'vegetation', gridX: 44.00, gridY: 28.00, size: 1.983374387743047, variant: 0 },
            { type: 'vegetation', gridX: 42.00, gridY: 28.00, size: 1.7998644948804616, variant: 2 },
            { type: 'vegetation', gridX: 43.00, gridY: 30.00, size: 2.2901836988162056, variant: 2 },
            { type: 'vegetation', gridX: 44.00, gridY: 30.00, size: 2.7668193115462802, variant: 2 },
            { type: 'vegetation', gridX: 57.00, gridY: 32.00, size: 1.6326576446865755, variant: 1 },
            { type: 'vegetation', gridX: 54.00, gridY: 30.00, size: 2.8538494472583893, variant: 2 },
            { type: 'vegetation', gridX: 57.00, gridY: 30.00, size: 2.08778208239041, variant: 3 },
            { type: 'vegetation', gridX: 56.00, gridY: 32.75, size: 2.362850817055115, variant: 2 },
            { type: 'vegetation', gridX: 53.00, gridY: 29.00, size: 1.2899739277620104, variant: 2 },
            { type: 'vegetation', gridX: 54.00, gridY: 31.00, size: 1.5744180273710318, variant: 2 },
            { type: 'vegetation', gridX: 58.00, gridY: 27.00, size: 1.9779627170095537, variant: 1 },
            { type: 'vegetation', gridX: 58.00, gridY: 27.00, size: 1.4944113309943745, variant: 0 },
            { type: 'vegetation', gridX: 56.00, gridY: 25.00, size: 1.1573262212709043, variant: 3 },
            { type: 'vegetation', gridX: 58.00, gridY: 24.00, size: 1.313542345218543, variant: 1 },
            { type: 'vegetation', gridX: 59.00, gridY: 29.00, size: 2.8211249858265397, variant: 2 },
            { type: 'vegetation', gridX: 59.00, gridY: 25.00, size: 2.938983566262486, variant: 1 },
            { type: 'vegetation', gridX: 53.00, gridY: 25.00, size: 2.148962134583152, variant: 0 },
            { type: 'vegetation', gridX: 56.00, gridY: 28.00, size: 1.9876461708034652, variant: 0 },
            { type: 'vegetation', gridX: 56.00, gridY: 27.00, size: 1.9883111520013566, variant: 0 },
            { type: 'vegetation', gridX: 56.00, gridY: 28.00, size: 2.2362041393243164, variant: 0 },
            { type: 'vegetation', gridX: 52.00, gridY: 28.00, size: 2.782788114217972, variant: 2 },
            { type: 'vegetation', gridX: 54.00, gridY: 29.00, size: 2.66911076816622, variant: 1 },
            { type: 'vegetation', gridX: 56.00, gridY: 20.00, size: 1.2954773840370535, variant: 2 },
            { type: 'vegetation', gridX: 56.00, gridY: 21.00, size: 2.3739280054212273, variant: 2 },
            { type: 'vegetation', gridX: 58.00, gridY: 23.00, size: 2.892451718011427, variant: 0 },
            { type: 'vegetation', gridX: 57.00, gridY: 23.00, size: 1.7810039603951802, variant: 0 },
            { type: 'vegetation', gridX: 58.00, gridY: 19.00, size: 1.952872109790387, variant: 3 },
            { type: 'vegetation', gridX: 57.00, gridY: 19.00, size: 1.9201159664427399, variant: 3 },
            { type: 'vegetation', gridX: 57.00, gridY: 11.00, size: 2.8266343608780367, variant: 3 },
            { type: 'vegetation', gridX: 57.00, gridY: 12.00, size: 2.120452203026608, variant: 2 },
            { type: 'vegetation', gridX: 57.00, gridY: 15.00, size: 2.272515800126531, variant: 0 },
            { type: 'vegetation', gridX: 58.00, gridY: 11.00, size: 1.1374564033366967, variant: 0 },
            { type: 'vegetation', gridX: 58.00, gridY: 15.00, size: 1.5368641401530363, variant: 1 },
            { type: 'vegetation', gridX: 59.00, gridY: 14.00, size: 2.1338867902379164, variant: 0 },
            { type: 'vegetation', gridX: 58.00, gridY: 7.00, size: 1.7512309915409912, variant: 0 },
            { type: 'vegetation', gridX: 59.00, gridY: 5.00, size: 1.6350955778182665, variant: 0 },
            { type: 'vegetation', gridX: 59.00, gridY: 5.00, size: 1.2362493986243528, variant: 2 },
            { type: 'vegetation', gridX: 58.00, gridY: 4.00, size: 1.1464096751178494, variant: 0 },
            { type: 'vegetation', gridX: 58.00, gridY: 6.00, size: 1.8916544860004112, variant: 1 },
            { type: 'vegetation', gridX: 59.00, gridY: 5.00, size: 1.6299228821924951, variant: 2 },
            { type: 'vegetation', gridX: 59.00, gridY: 2.00, size: 2.414167119251354, variant: 1 },
            { type: 'vegetation', gridX: 58.00, gridY: 2.00, size: 2.1596387523083953, variant: 0 },
            { type: 'vegetation', gridX: 56.00, gridY: 3.00, size: 1.4557960985227751, variant: 0 },
            { type: 'vegetation', gridX: 56.00, gridY: 4.00, size: 2.6674471828399744, variant: 3 },
            { type: 'vegetation', gridX: 56.00, gridY: 0.00, size: 2.341796615943008, variant: 3 },
            { type: 'vegetation', gridX: 54.00, gridY: 3.00, size: 2.4037943509751445, variant: 3 },
            { type: 'vegetation', gridX: 54.00, gridY: 8.00, size: 2.263589350575543, variant: 2 },
            { type: 'vegetation', gridX: 57.00, gridY: 8.00, size: 2.518722774940564, variant: 1 },
            { type: 'vegetation', gridX: 55.00, gridY: 8.00, size: 1.9101856709109286, variant: 3 },
            { type: 'vegetation', gridX: 56.00, gridY: 11.00, size: 1.6131476356130132, variant: 1 },
            { type: 'vegetation', gridX: 54.00, gridY: 10.00, size: 1.6490336614993317, variant: 0 },
            { type: 'vegetation', gridX: 55.00, gridY: 12.00, size: 1.765915599232501, variant: 2 },
            { type: 'vegetation', gridX: 8.00, gridY: 1.00, size: 1.9515430946058288, variant: 2 },
            { type: 'vegetation', gridX: 10.00, gridY: 4.00, size: 2.2168704938597723, variant: 0 },
            { type: 'vegetation', gridX: 7.00, gridY: 2.00, size: 2.369590128889981, variant: 2 },
            { type: 'vegetation', gridX: 8.00, gridY: 5.00, size: 1.921635338454668, variant: 2 },
            { type: 'vegetation', gridX: 9.00, gridY: 3.00, size: 1.5188638016312672, variant: 0 },
            { type: 'vegetation', gridX: 7.00, gridY: 9.00, size: 2.903946110631615, variant: 0 },
            { type: 'vegetation', gridX: 6.00, gridY: 11.00, size: 2.3411109894608044, variant: 0 },
            { type: 'vegetation', gridX: 7.00, gridY: 11.00, size: 1.9034828057754203, variant: 0 },
            { type: 'vegetation', gridX: 7.00, gridY: 11.00, size: 2.4627380751441468, variant: 0 },
            { type: 'vegetation', gridX: 4.00, gridY: 8.00, size: 2.413725167860756, variant: 3 },
            { type: 'vegetation', gridX: 7.00, gridY: 11.00, size: 2.406165489753206, variant: 3 },
            { type: 'rock', gridX: 7.00, gridY: 26.00, size: 2, variant: 0 },
            { type: 'rock', gridX: 5.00, gridY: 4.00, size: 2, variant: 0 },
            { type: 'rock', gridX: 55.00, gridY: 6.00, size: 2, variant: 0 },
            { type: 'rock', gridX: 46.00, gridY: 31.00, size: 2, variant: 0 },
            { type: 'rock', gridX: 55.00, gridY: 24.00, size: 2, variant: 2 },
            { type: 'rock', gridX: 5.00, gridY: 17.00, size: 2, variant: 2 },
            { type: 'rock', gridX: 56.00, gridY: 2.00, size: 2, variant: 2 },
            { type: 'rock', gridX: 21.00, gridY: 5.00, size: 2, variant: 2 },
            { type: 'rock', gridX: 1.00, gridY: 10.00, size: 2, variant: 3 },
            { type: 'rock', gridX: 40.00, gridY: 30.00, size: 3.5, variant: 3 },
            { type: 'rock', gridX: 36.00, gridY: 2.00, size: 3.5, variant: 3 },
            { type: 'rock', gridX: 6.00, gridY: 7.00, size: 3.5, variant: 1 },
            { type: 'vegetation', gridX: 20.00, gridY: 4.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 22.00, gridY: 6.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 37.00, gridY: 3.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 46.00, gridY: 1.00, size: 2.5, variant: 1 },
            { type: 'vegetation', gridX: 43.00, gridY: 1.00, size: 2.5, variant: 2 },
            { type: 'vegetation', gridX: 52.00, gridY: 3.00, size: 2.5, variant: 2 },
            { type: 'vegetation', gridX: 54.00, gridY: 1.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 40.00, gridY: 2.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 44.00, gridY: 3.00, size: 2, variant: 0 }
        ];
    }

    createMeanderingPath(canvasWidth, canvasHeight) {
        const gridWidth = this.gridWidth || 60;
        const gridHeight = this.gridHeight || 33.75;

        const pathInGridCoords = [
            { gridX: 49.00, gridY: 0.00 },
            { gridX: 49.00, gridY: 20.00 },
            { gridX: 34.00, gridY: 20.00 },
            { gridX: 34.00, gridY: 8.00 },
            { gridX: 28.00, gridY: 8.00 },
            { gridX: 28.00, gridY: 25.00 },
            { gridX: 14.00, gridY: 25.00 },
            { gridX: 14.00, gridY: 13.00 }
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
            speedMultiplier: 0.7, 
            spawnInterval: 2.2, 
            pattern: [{ type: 'basic', count: 15 }] 
        }
        // Wave 2
        , { 
            enemyHealth_multiplier: 1, 
            speedMultiplier: 0.7, 
            spawnInterval: 1.7, 
            pattern: [{ type: 'villager', count: 11 }, { type: 'basic', count: 6 }, { type: 'archer', count: 2 }] 
        }
        // Wave 3
        , { 
            enemyHealth_multiplier: 1, 
            speedMultiplier: 0.7, 
            spawnInterval: 1.5, 
            pattern: [{ type: 'villager', count: 12 }, { type: 'basic', count: 12 }] 
        }
        // Wave 4
        , { 
            enemyHealth_multiplier: 1.2, 
            speedMultiplier: 0.8, 
            spawnInterval: 1.3, 
            pattern: [{ type: 'basic', count: 10 }, { type: 'villager', count: 9 }, { type: 'archer', count: 6 }] 
        }
        // Wave 5
        , { 
            enemyHealth_multiplier: 1.1, 
            speedMultiplier: 0.67, 
            spawnInterval: 2, 
            pattern: [{ type: 'beefyenemy', count: 5 }] 
        }
        // Wave 6
        , { 
            enemyHealth_multiplier: 1.3, 
            speedMultiplier: 1.1, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'archer', count: 20 }] 
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
            enemyHealth_multiplier: 2, 
            speedMultiplier: 0.5, 
            spawnInterval: 1.5, 
            pattern: [{ type: 'beefyenemy', count: 10 }] 
        }
        // Wave 12
        , { 
            enemyHealth_multiplier: 1.6, 
            speedMultiplier: 1.25, 
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