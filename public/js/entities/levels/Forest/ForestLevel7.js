import { LevelBase } from '../LevelBase.js';

export class ForestLevel7 extends LevelBase {
    static levelMetadata = {
        name: 'Faedwyn',
        difficulty: 'Easy',
        order: 7,
        campaign: 'forest'
    };

    constructor() {
        super();
        // Derive instance properties from static metadata
        this.levelName = ForestLevel7.levelMetadata.name;
        this.levelNumber = ForestLevel7.levelMetadata.order;
        this.difficulty = ForestLevel7.levelMetadata.difficulty;
        this.campaign = ForestLevel7.levelMetadata.campaign;
        this.maxWaves = 15;

        // Set terrain elements (prevent tower placement on these areas)
        this.terrainElements = [
            { type: 'water', gridX: 35.00, gridY: 34.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 35.00, gridY: 33.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 35.00, gridY: 32.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 35.00, gridY: 31.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 35.00, gridY: 30.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 35.00, gridY: 29.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 35.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 35.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 35.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 36.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 36.00, gridY: 25.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 36.00, gridY: 24.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 36.00, gridY: 24.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 37.00, gridY: 24.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 38.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 38.00, gridY: 22.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 39.00, gridY: 21.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 39.00, gridY: 21.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 40.00, gridY: 20.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 41.00, gridY: 19.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 41.00, gridY: 18.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 41.00, gridY: 18.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 42.00, gridY: 18.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 43.00, gridY: 18.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 44.00, gridY: 17.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 45.00, gridY: 17.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 46.00, gridY: 17.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 46.00, gridY: 16.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 47.00, gridY: 16.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 48.00, gridY: 16.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 49.00, gridY: 16.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 50.00, gridY: 15.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 50.00, gridY: 15.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 50.00, gridY: 14.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 51.00, gridY: 14.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 52.00, gridY: 13.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 52.00, gridY: 12.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 53.00, gridY: 11.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 53.00, gridY: 11.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 54.00, gridY: 10.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 54.00, gridY: 10.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 54.00, gridY: 9.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 55.00, gridY: 8.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 55.00, gridY: 7.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 55.00, gridY: 6.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 56.00, gridY: 6.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 56.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 56.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 56.00, gridY: 4.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 56.00, gridY: 3.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 56.00, gridY: 2.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 56.00, gridY: 1.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 56.00, gridY: 0.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 4.00, gridY: 30.00, size: 4, waterType: 'lake' },
            { type: 'vegetation', gridX: 3.00, gridY: 3.00, size: 1.5342635140056442, variant: 1 },
            { type: 'vegetation', gridX: 2.00, gridY: 5.00, size: 2.978730738074701, variant: 3 },
            { type: 'vegetation', gridX: 3.00, gridY: 3.00, size: 2.7026580677915977, variant: 0 },
            { type: 'vegetation', gridX: 1.00, gridY: 3.00, size: 1.852145096647667, variant: 3 },
            { type: 'vegetation', gridX: 0.00, gridY: 4.00, size: 2.9106113008820444, variant: 0 },
            { type: 'vegetation', gridX: 4.00, gridY: 6.00, size: 1.602064285691579, variant: 0 },
            { type: 'vegetation', gridX: 4.00, gridY: 6.00, size: 1.684003648596138, variant: 1 },
            { type: 'vegetation', gridX: 0.00, gridY: 6.00, size: 1.5281845314375428, variant: 2 },
            { type: 'vegetation', gridX: 3.00, gridY: 6.00, size: 1.667640626194185, variant: 3 },
            { type: 'vegetation', gridX: 5.00, gridY: 1.00, size: 1.5384934889172674, variant: 1 },
            { type: 'vegetation', gridX: 3.00, gridY: 3.00, size: 1.6405143888100777, variant: 0 },
            { type: 'vegetation', gridX: 5.00, gridY: 4.00, size: 1.595561172055811, variant: 3 },
            { type: 'vegetation', gridX: 6.00, gridY: 1.00, size: 2.8252947331160847, variant: 2 },
            { type: 'vegetation', gridX: 4.00, gridY: 5.00, size: 1.9570082550875028, variant: 2 },
            { type: 'vegetation', gridX: 2.00, gridY: 6.00, size: 2.8484763363768337, variant: 1 },
            { type: 'vegetation', gridX: 2.00, gridY: 4.00, size: 2.2364651387819814, variant: 3 },
            { type: 'vegetation', gridX: 6.00, gridY: 0.00, size: 2.380538439456163, variant: 3 },
            { type: 'vegetation', gridX: 3.00, gridY: 2.00, size: 2.065895760499913, variant: 1 },
            { type: 'vegetation', gridX: 9.00, gridY: 4.00, size: 1.8585093501969003, variant: 0 },
            { type: 'vegetation', gridX: 3.00, gridY: 4.00, size: 2.475826984660682, variant: 0 },
            { type: 'vegetation', gridX: 7.00, gridY: 0.00, size: 2.3497687171771178, variant: 0 },
            { type: 'vegetation', gridX: 7.00, gridY: 1.00, size: 1.7531153094218321, variant: 0 },
            { type: 'vegetation', gridX: 8.00, gridY: 2.00, size: 2.445518634311707, variant: 0 },
            { type: 'vegetation', gridX: 5.00, gridY: 4.00, size: 2.253997089599028, variant: 3 },
            { type: 'vegetation', gridX: 10.00, gridY: 2.00, size: 2.0671242917748063, variant: 3 },
            { type: 'vegetation', gridX: 5.00, gridY: 2.00, size: 1.6225553432005135, variant: 2 },
            { type: 'vegetation', gridX: 6.00, gridY: 1.00, size: 2.237582845692299, variant: 3 },
            { type: 'vegetation', gridX: 10.00, gridY: 2.00, size: 2.3750822343607956, variant: 2 },
            { type: 'vegetation', gridX: 11.00, gridY: 2.00, size: 2.9617576084298234, variant: 3 },
            { type: 'vegetation', gridX: 13.00, gridY: 3.00, size: 2.2899360422050505, variant: 1 },
            { type: 'vegetation', gridX: 8.00, gridY: 2.00, size: 2.6659819007939407, variant: 0 },
            { type: 'vegetation', gridX: 10.00, gridY: 3.00, size: 2.2127866046519147, variant: 0 },
            { type: 'vegetation', gridX: 8.00, gridY: 2.00, size: 2.5149309029139015, variant: 2 },
            { type: 'vegetation', gridX: 11.00, gridY: 2.00, size: 2.647358763178697, variant: 0 },
            { type: 'vegetation', gridX: 8.00, gridY: 3.00, size: 1.9278727449886501, variant: 1 },
            { type: 'vegetation', gridX: 16.00, gridY: 3.00, size: 2.572267908900633, variant: 3 },
            { type: 'vegetation', gridX: 10.00, gridY: 0.00, size: 1.545638699101462, variant: 2 },
            { type: 'vegetation', gridX: 11.00, gridY: 0.00, size: 1.9365956011735315, variant: 0 },
            { type: 'vegetation', gridX: 10.00, gridY: 1.00, size: 2.2873199669409647, variant: 1 },
            { type: 'vegetation', gridX: 13.00, gridY: 1.00, size: 1.8142360697193751, variant: 3 },
            { type: 'vegetation', gridX: 14.00, gridY: 3.00, size: 1.730089907912133, variant: 3 },
            { type: 'vegetation', gridX: 14.00, gridY: 4.00, size: 2.8113052994282404, variant: 1 },
            { type: 'vegetation', gridX: 17.00, gridY: 0.00, size: 2.418347206306457, variant: 3 },
            { type: 'vegetation', gridX: 14.00, gridY: 4.00, size: 2.8187126954290442, variant: 1 },
            { type: 'vegetation', gridX: 12.00, gridY: 1.00, size: 2.513565766799465, variant: 3 },
            { type: 'vegetation', gridX: 19.00, gridY: 1.00, size: 2.721279790379525, variant: 1 },
            { type: 'vegetation', gridX: 12.00, gridY: 4.00, size: 2.9040336127459287, variant: 0 },
            { type: 'vegetation', gridX: 11.00, gridY: 2.00, size: 2.346662027489821, variant: 1 },
            { type: 'vegetation', gridX: 14.00, gridY: 4.00, size: 2.1618692255929863, variant: 1 },
            { type: 'vegetation', gridX: 18.00, gridY: 2.00, size: 2.767260351369736, variant: 2 },
            { type: 'vegetation', gridX: 15.00, gridY: 2.00, size: 2.829086988495523, variant: 1 },
            { type: 'vegetation', gridX: 18.00, gridY: 3.00, size: 2.091086301326518, variant: 0 },
            { type: 'vegetation', gridX: 17.00, gridY: 0.00, size: 2.6258272375840708, variant: 2 },
            { type: 'vegetation', gridX: 20.00, gridY: 1.00, size: 2.127105896135524, variant: 3 },
            { type: 'vegetation', gridX: 19.00, gridY: 1.00, size: 2.910950004472226, variant: 0 },
            { type: 'vegetation', gridX: 18.00, gridY: 0.00, size: 2.9947115848303945, variant: 3 },
            { type: 'vegetation', gridX: 21.00, gridY: 2.00, size: 1.5074579118567473, variant: 2 },
            { type: 'vegetation', gridX: 20.00, gridY: 5.00, size: 1.7543429628577674, variant: 2 },
            { type: 'vegetation', gridX: 17.00, gridY: 1.00, size: 1.7404233501653428, variant: 1 },
            { type: 'vegetation', gridX: 21.00, gridY: 4.00, size: 1.5241174443704584, variant: 0 },
            { type: 'vegetation', gridX: 20.00, gridY: 1.00, size: 2.7156286731180863, variant: 2 },
            { type: 'vegetation', gridX: 17.00, gridY: 5.00, size: 2.8204142210728835, variant: 2 },
            { type: 'vegetation', gridX: 17.00, gridY: 1.00, size: 2.4579715002129285, variant: 3 },
            { type: 'vegetation', gridX: 20.00, gridY: 4.00, size: 1.9381712030485692, variant: 3 },
            { type: 'vegetation', gridX: 23.00, gridY: 0.00, size: 2.2610028230615855, variant: 2 },
            { type: 'vegetation', gridX: 23.00, gridY: 0.00, size: 2.2473937612284365, variant: 3 },
            { type: 'vegetation', gridX: 22.00, gridY: 1.00, size: 2.473081633362872, variant: 1 },
            { type: 'vegetation', gridX: 22.00, gridY: 2.00, size: 2.2246203843785635, variant: 1 },
            { type: 'vegetation', gridX: 23.00, gridY: 3.00, size: 2.2624880486557393, variant: 1 },
            { type: 'vegetation', gridX: 26.00, gridY: 5.00, size: 1.9388186515750685, variant: 1 },
            { type: 'vegetation', gridX: 21.00, gridY: 1.00, size: 1.709565078488568, variant: 0 },
            { type: 'vegetation', gridX: 22.00, gridY: 2.00, size: 2.834908826668865, variant: 3 },
            { type: 'vegetation', gridX: 23.00, gridY: 3.00, size: 2.450447662437224, variant: 1 },
            { type: 'vegetation', gridX: 24.00, gridY: 4.00, size: 2.120902946853862, variant: 2 },
            { type: 'vegetation', gridX: 24.00, gridY: 2.00, size: 2.7259850375672916, variant: 1 },
            { type: 'vegetation', gridX: 25.00, gridY: 3.00, size: 2.1137269291379663, variant: 1 },
            { type: 'vegetation', gridX: 23.00, gridY: 1.00, size: 2.6962957589220027, variant: 1 },
            { type: 'vegetation', gridX: 24.00, gridY: 2.00, size: 2.625401797487155, variant: 2 },
            { type: 'vegetation', gridX: 29.00, gridY: 2.00, size: 2.1055223134118566, variant: 3 },
            { type: 'vegetation', gridX: 23.00, gridY: 0.00, size: 2.166807133771101, variant: 2 },
            { type: 'vegetation', gridX: 26.00, gridY: 4.00, size: 1.537174112264014, variant: 1 },
            { type: 'vegetation', gridX: 30.00, gridY: 0.00, size: 2.7283434571343195, variant: 0 },
            { type: 'vegetation', gridX: 30.00, gridY: 5.00, size: 1.5333307970612629, variant: 3 },
            { type: 'vegetation', gridX: 27.00, gridY: 3.00, size: 2.389162347899491, variant: 0 },
            { type: 'vegetation', gridX: 25.00, gridY: 2.00, size: 1.9447313595505078, variant: 1 },
            { type: 'vegetation', gridX: 29.00, gridY: 5.00, size: 1.519302667010077, variant: 1 },
            { type: 'vegetation', gridX: 33.00, gridY: 1.00, size: 2.3099227006750254, variant: 3 },
            { type: 'vegetation', gridX: 30.00, gridY: 1.00, size: 2.118771966453937, variant: 0 },
            { type: 'vegetation', gridX: 29.00, gridY: 2.00, size: 2.585815906597624, variant: 2 },
            { type: 'vegetation', gridX: 30.00, gridY: 5.00, size: 2.350530653864047, variant: 3 },
            { type: 'vegetation', gridX: 34.00, gridY: 2.00, size: 2.622971539686679, variant: 3 },
            { type: 'vegetation', gridX: 32.00, gridY: 4.00, size: 2.605873296112552, variant: 0 },
            { type: 'vegetation', gridX: 35.00, gridY: 3.00, size: 2.939311895836358, variant: 1 },
            { type: 'vegetation', gridX: 33.00, gridY: 4.00, size: 2.8044047341556757, variant: 0 },
            { type: 'vegetation', gridX: 30.00, gridY: 2.00, size: 2.5405583325312975, variant: 0 },
            { type: 'vegetation', gridX: 35.00, gridY: 0.00, size: 2.4372624108042875, variant: 3 },
            { type: 'vegetation', gridX: 33.00, gridY: 0.00, size: 2.3326321622949413, variant: 0 },
            { type: 'vegetation', gridX: 31.00, gridY: 3.00, size: 1.9559470674078645, variant: 2 },
            { type: 'vegetation', gridX: 36.00, gridY: 0.00, size: 2.4554080806612224, variant: 1 },
            { type: 'vegetation', gridX: 36.00, gridY: 4.00, size: 2.99640943988852, variant: 1 },
            { type: 'vegetation', gridX: 34.00, gridY: 1.00, size: 2.8802983054179423, variant: 2 },
            { type: 'vegetation', gridX: 34.00, gridY: 1.00, size: 2.9503304449640457, variant: 3 },
            { type: 'vegetation', gridX: 33.00, gridY: 1.00, size: 2.0037185545709204, variant: 1 },
            { type: 'vegetation', gridX: 33.00, gridY: 2.00, size: 2.9596447458458086, variant: 2 },
            { type: 'vegetation', gridX: 39.00, gridY: 3.00, size: 2.753607177474097, variant: 3 },
            { type: 'vegetation', gridX: 36.00, gridY: 0.00, size: 2.6732725998019884, variant: 2 },
            { type: 'vegetation', gridX: 39.00, gridY: 1.00, size: 2.0064748359365128, variant: 3 },
            { type: 'vegetation', gridX: 40.00, gridY: 5.00, size: 2.941495785395038, variant: 3 },
            { type: 'vegetation', gridX: 38.00, gridY: 3.00, size: 2.0293839961688755, variant: 3 },
            { type: 'vegetation', gridX: 37.00, gridY: 3.00, size: 1.906804341115197, variant: 2 },
            { type: 'vegetation', gridX: 39.00, gridY: 2.00, size: 2.930725767028836, variant: 0 },
            { type: 'vegetation', gridX: 40.00, gridY: 2.00, size: 2.300047311600789, variant: 3 },
            { type: 'vegetation', gridX: 37.00, gridY: 3.00, size: 2.5328376901506515, variant: 1 },
            { type: 'vegetation', gridX: 40.00, gridY: 0.00, size: 2.3414785694094498, variant: 0 },
            { type: 'vegetation', gridX: 41.00, gridY: 3.00, size: 1.9708341629937227, variant: 3 },
            { type: 'vegetation', gridX: 40.00, gridY: 4.00, size: 1.9888896394934024, variant: 3 },
            { type: 'vegetation', gridX: 39.00, gridY: 0.00, size: 2.095400009428759, variant: 1 },
            { type: 'vegetation', gridX: 44.00, gridY: 0.00, size: 2.2258378937617636, variant: 1 },
            { type: 'vegetation', gridX: 45.00, gridY: 2.00, size: 1.844616279925919, variant: 0 },
            { type: 'vegetation', gridX: 41.00, gridY: 4.00, size: 1.6393074490582016, variant: 1 },
            { type: 'vegetation', gridX: 45.00, gridY: 3.00, size: 1.6897527062903672, variant: 2 },
            { type: 'vegetation', gridX: 39.00, gridY: 2.00, size: 1.6085299763389296, variant: 3 },
            { type: 'vegetation', gridX: 42.00, gridY: 5.00, size: 1.911923384137633, variant: 0 },
            { type: 'vegetation', gridX: 41.00, gridY: 4.00, size: 1.756146336737029, variant: 3 },
            { type: 'vegetation', gridX: 46.00, gridY: 3.00, size: 2.297230626664159, variant: 1 },
            { type: 'vegetation', gridX: 42.00, gridY: 3.00, size: 2.2699089432143698, variant: 3 },
            { type: 'vegetation', gridX: 43.00, gridY: 3.00, size: 2.015362152171138, variant: 1 },
            { type: 'vegetation', gridX: 43.00, gridY: 3.00, size: 2.5140991911420034, variant: 1 },
            { type: 'vegetation', gridX: 46.00, gridY: 5.00, size: 2.785030500046228, variant: 0 },
            { type: 'vegetation', gridX: 50.00, gridY: 3.00, size: 2.4329587814137197, variant: 1 },
            { type: 'vegetation', gridX: 43.00, gridY: 0.00, size: 1.572513450799384, variant: 2 },
            { type: 'vegetation', gridX: 43.00, gridY: 5.00, size: 2.8755166940072407, variant: 2 },
            { type: 'vegetation', gridX: 48.00, gridY: 6.00, size: 2.029054704613025, variant: 0 },
            { type: 'vegetation', gridX: 47.00, gridY: 6.00, size: 2.3476670712984, variant: 3 },
            { type: 'vegetation', gridX: 44.00, gridY: 3.00, size: 2.004553128752825, variant: 0 },
            { type: 'vegetation', gridX: 50.00, gridY: 7.00, size: 2.414424638631099, variant: 0 },
            { type: 'vegetation', gridX: 48.00, gridY: 5.00, size: 2.950987447442312, variant: 3 },
            { type: 'vegetation', gridX: 51.00, gridY: 3.00, size: 1.6809066847041705, variant: 0 },
            { type: 'vegetation', gridX: 45.00, gridY: 3.00, size: 2.7006784499727514, variant: 3 },
            { type: 'vegetation', gridX: 52.00, gridY: 6.00, size: 1.9251386857169743, variant: 0 },
            { type: 'vegetation', gridX: 54.00, gridY: 5.00, size: 2.09884049849164, variant: 2 },
            { type: 'vegetation', gridX: 49.00, gridY: 3.00, size: 2.8630351811530046, variant: 0 },
            { type: 'vegetation', gridX: 49.00, gridY: 2.00, size: 2.773386154586469, variant: 1 },
            { type: 'vegetation', gridX: 48.00, gridY: 5.00, size: 1.7529178467491708, variant: 3 },
            { type: 'vegetation', gridX: 51.00, gridY: 4.00, size: 2.8598859311640576, variant: 2 },
            { type: 'vegetation', gridX: 57.00, gridY: 2.00, size: 2.574856567360583, variant: 1 },
            { type: 'vegetation', gridX: 55.00, gridY: 5.00, size: 1.8143490221011849, variant: 1 },
            { type: 'vegetation', gridX: 58.00, gridY: 8.00, size: 1.8130629054020508, variant: 1 },
            { type: 'vegetation', gridX: 58.00, gridY: 2.00, size: 2.4849520522483215, variant: 3 },
            { type: 'vegetation', gridX: 56.00, gridY: 5.00, size: 1.5674730981071618, variant: 1 },
            { type: 'vegetation', gridX: 55.00, gridY: 4.00, size: 2.02016931602095, variant: 2 },
            { type: 'vegetation', gridX: 59.00, gridY: 5.00, size: 2.3184036720270527, variant: 2 },
            { type: 'vegetation', gridX: 57.00, gridY: 8.00, size: 2.0318098777333247, variant: 3 },
            { type: 'vegetation', gridX: 59.00, gridY: 15.00, size: 2.2548304033547275, variant: 1 },
            { type: 'vegetation', gridX: 54.00, gridY: 12.00, size: 1.706818200024553, variant: 2 },
            { type: 'vegetation', gridX: 59.00, gridY: 10.00, size: 1.715031332600176, variant: 2 },
            { type: 'vegetation', gridX: 58.00, gridY: 10.00, size: 2.9576446148665, variant: 2 },
            { type: 'vegetation', gridX: 56.00, gridY: 13.00, size: 2.7898264347066393, variant: 1 },
            { type: 'vegetation', gridX: 59.00, gridY: 12.00, size: 1.7702654178741732, variant: 0 },
            { type: 'vegetation', gridX: 53.00, gridY: 13.00, size: 1.5824046630269466, variant: 3 },
            { type: 'vegetation', gridX: 55.00, gridY: 12.00, size: 2.3365434896337014, variant: 0 },
            { type: 'vegetation', gridX: 59.00, gridY: 23.00, size: 2.7769321062142245, variant: 1 },
            { type: 'vegetation', gridX: 59.00, gridY: 17.00, size: 1.6620050845822245, variant: 1 },
            { type: 'vegetation', gridX: 56.00, gridY: 17.00, size: 2.037263346188439, variant: 3 },
            { type: 'vegetation', gridX: 57.00, gridY: 21.00, size: 1.9636765666562284, variant: 3 },
            { type: 'vegetation', gridX: 59.00, gridY: 20.00, size: 2.6630201090319905, variant: 0 },
            { type: 'vegetation', gridX: 59.00, gridY: 21.00, size: 2.4344919397872857, variant: 1 },
            { type: 'vegetation', gridX: 59.00, gridY: 17.00, size: 2.6812162103016335, variant: 0 },
            { type: 'vegetation', gridX: 57.00, gridY: 22.00, size: 2.377946040754996, variant: 3 },
            { type: 'vegetation', gridX: 59.00, gridY: 27.00, size: 2.5374210538742927, variant: 1 },
            { type: 'vegetation', gridX: 57.00, gridY: 29.00, size: 1.966608058172115, variant: 1 },
            { type: 'vegetation', gridX: 58.00, gridY: 26.00, size: 2.6881977009797335, variant: 1 },
            { type: 'vegetation', gridX: 58.00, gridY: 27.00, size: 1.8041330348838462, variant: 1 },
            { type: 'vegetation', gridX: 58.00, gridY: 25.00, size: 1.7902914591290937, variant: 1 },
            { type: 'vegetation', gridX: 59.00, gridY: 28.00, size: 2.3884341628770267, variant: 2 },
            { type: 'vegetation', gridX: 58.00, gridY: 32.00, size: 2.723189260044809, variant: 3 },
            { type: 'vegetation', gridX: 59.00, gridY: 30.00, size: 2.615322586701396, variant: 1 },
            { type: 'vegetation', gridX: 57.00, gridY: 31.00, size: 1.7798673277996628, variant: 1 },
            { type: 'vegetation', gridX: 55.00, gridY: 32.75, size: 2.41618437789785, variant: 1 },
            { type: 'vegetation', gridX: 52.00, gridY: 32.00, size: 2.5896608007992534, variant: 2 },
            { type: 'vegetation', gridX: 57.00, gridY: 32.75, size: 2.357048463697846, variant: 0 },
            { type: 'vegetation', gridX: 56.00, gridY: 32.75, size: 1.8443336305602867, variant: 0 },
            { type: 'vegetation', gridX: 54.00, gridY: 32.75, size: 2.686109260908471, variant: 1 },
            { type: 'vegetation', gridX: 57.00, gridY: 32.75, size: 1.9704523907996543, variant: 3 },
            { type: 'vegetation', gridX: 55.00, gridY: 32.75, size: 2.974152711149539, variant: 0 },
            { type: 'vegetation', gridX: 43.00, gridY: 31.00, size: 2.138710550650111, variant: 0 },
            { type: 'vegetation', gridX: 40.00, gridY: 32.75, size: 2.407836978765298, variant: 1 },
            { type: 'vegetation', gridX: 42.00, gridY: 32.75, size: 2.275131263919977, variant: 3 },
            { type: 'vegetation', gridX: 40.00, gridY: 31.00, size: 1.5901298578067744, variant: 2 },
            { type: 'vegetation', gridX: 38.00, gridY: 32.75, size: 2.738759415028838, variant: 2 },
            { type: 'vegetation', gridX: 47.00, gridY: 32.75, size: 2.3204520393940524, variant: 1 },
            { type: 'vegetation', gridX: 48.00, gridY: 32.75, size: 2.1758829880184507, variant: 0 },
            { type: 'vegetation', gridX: 47.00, gridY: 32.75, size: 2.756480194960116, variant: 3 },
            { type: 'vegetation', gridX: 49.00, gridY: 31.00, size: 1.5058121058119927, variant: 2 },
            { type: 'vegetation', gridX: 45.00, gridY: 32.75, size: 2.4115040358117272, variant: 0 },
            { type: 'vegetation', gridX: 3.00, gridY: 26.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 7.00, gridY: 31.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 9.00, gridY: 32.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 1.00, gridY: 28.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 7.00, gridY: 32.00, size: 3, variant: 3 },
            { type: 'vegetation', gridX: 2.00, gridY: 25.00, size: 3, variant: 3 },
            { type: 'vegetation', gridX: 1.00, gridY: 32.00, size: 3, variant: 3 },
            { type: 'vegetation', gridX: 6.00, gridY: 27.00, size: 3, variant: 1 },
            { type: 'rock', gridX: 8.00, gridY: 29.00, size: 3, variant: 2 },
            { type: 'rock', gridX: 4.00, gridY: 26.00, size: 3, variant: 2 },
            { type: 'rock', gridX: 7.00, gridY: 3.00, size: 3, variant: 2 },
            { type: 'rock', gridX: 38.00, gridY: 5.00, size: 3, variant: 2 },
            { type: 'rock', gridX: 57.00, gridY: 18.00, size: 3, variant: 2 },
            { type: 'rock', gridX: 50.00, gridY: 32.00, size: 3, variant: 2 },
            { type: 'rock', gridX: 33.00, gridY: 33.00, size: 3, variant: 1 },
            { type: 'rock', gridX: 46.00, gridY: 30.00, size: 3, variant: 1 },
            { type: 'rock', gridX: 20.00, gridY: 2.00, size: 3, variant: 1 },
            { type: 'rock', gridX: 55.00, gridY: 14.00, size: 3, variant: 2 },
            { type: 'rock', gridX: 1.00, gridY: 7.00, size: 3, variant: 3 },
            { type: 'rock', gridX: 46.00, gridY: 7.00, size: 3, variant: 3 },
            { type: 'rock', gridX: 56.00, gridY: 26.00, size: 2, variant: 1 },
            { type: 'rock', gridX: 10.00, gridY: 33.00, size: 2, variant: 1 }
        ];
    }

    createMeanderingPath(canvasWidth, canvasHeight) {
        const gridWidth = this.gridWidth || 60;
        const gridHeight = this.gridHeight || 33.75;

        const pathInGridCoords = [
            { gridX: 0.00, gridY: 15.00 },
            { gridX: 15.00, gridY: 24.00 },
            { gridX: 27.00, gridY: 24.00 },
            { gridX: 27.00, gridY: 11.00 },
            { gridX: 33.00, gridY: 11.00 },
            { gridX: 33.00, gridY: 20.00 },
            { gridX: 49.00, gridY: 26.00 }
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
            speedMultiplier: 0.75, 
            spawnInterval: 2, 
            pattern: [{ type: 'basic', count: 20 }] 
        }
        // Wave 2
        , { 
            enemyHealth_multiplier: 1, 
            speedMultiplier: 0.7, 
            spawnInterval: 1.7, 
            pattern: [{ type: 'villager', count: 7 }, { type: 'basic', count: 5 }, { type: 'archer', count: 5 }] 
        }
        // Wave 3
        , { 
            enemyHealth_multiplier: 1.1, 
            speedMultiplier: 0.7, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'villager', count: 9 }, { type: 'basic', count: 8 }, { type: 'archer', count: 6 }] 
        }
        // Wave 4
        , { 
            enemyHealth_multiplier: 1.2, 
            speedMultiplier: 1, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'archer', count: 23 }] 
        }
        // Wave 5
        , { 
            enemyHealth_multiplier: 2, 
            speedMultiplier: 0.8, 
            spawnInterval: 1.8, 
            pattern: [{ type: 'beefyenemy', count: 4 }] 
        }
        // Wave 6
        , { 
            enemyHealth_multiplier: 1, 
            speedMultiplier: 1.2, 
            spawnInterval: 0.5, 
            pattern: [{ type: 'villager', count: 32 }] 
        }
        // Wave 7
        , { 
            enemyHealth_multiplier: 1.5, 
            speedMultiplier: 0.8, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'beefyenemy', count: 5 }, { type: 'archer', count: 12 }] 
        }
        // Wave 8
        , { 
            enemyHealth_multiplier: 1.8, 
            speedMultiplier: 0.7, 
            spawnInterval: 1, 
            pattern: [{ type: 'basic', count: 12 }, { type: 'villager', count: 13 }, { type: 'beefyenemy', count: 3 }] 
        }
        // Wave 9
        , { 
            enemyHealth_multiplier: 2.5, 
            speedMultiplier: 0.6, 
            spawnInterval: 1.2, 
            pattern: [{ type: 'beefyenemy', count: 12 }] 
        }
        // Wave 10
        , { 
            enemyHealth_multiplier: 2.7, 
            speedMultiplier: 0.7, 
            spawnInterval: 1.1, 
            pattern: [{ type: 'beefyenemy', count: 9 }, { type: 'archer', count: 9 }, { type: 'basic', count: 8 }, { type: 'villager', count: 7 }] 
        }
        // Wave 11
        , { 
            enemyHealth_multiplier: 1.7, 
            speedMultiplier: 1, 
            spawnInterval: 0.3, 
            pattern: [{ type: 'archer', count: 35 }] 
        }
        // Wave 12
        , { 
            enemyHealth_multiplier: 3, 
            speedMultiplier: 0.85, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'beefyenemy', count: 7 }] 
        }
        // Wave 13
        , { 
            enemyHealth_multiplier: 1, 
            speedMultiplier: 1.25, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'villager', count: 14 }, { type: 'basic', count: 16 }, { type: 'archer', count: 14 }, { type: 'beefyenemy', count: 3 }] 
        }
        // Wave 14
        , { 
            enemyHealth_multiplier: 1, 
            speedMultiplier: 1, 
            spawnInterval: 10, 
            pattern: [{ type: 'knight', count: 3 }] 
        }
        // Wave 15
        , { 
            enemyHealth_multiplier: 2.25, 
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