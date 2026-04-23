import { LevelBase } from '../LevelBase.js';

export class MountainLevel4 extends LevelBase {
    static levelMetadata = {
        name: 'Depth\'s of Despair',
        difficulty: 'Medium',
        order: 4,
        campaign: 'mountain'
    };

    constructor() {
        super();
        // Derive instance properties from static metadata
        this.levelName = MountainLevel4.levelMetadata.name;
        this.levelNumber = MountainLevel4.levelMetadata.order;
        this.difficulty = MountainLevel4.levelMetadata.difficulty;
        this.campaign = MountainLevel4.levelMetadata.campaign;
        this.maxWaves = 27;

        // Set terrain elements (prevent tower placement on these areas)
        this.terrainElements = [
            { type: 'vegetation', gridX: 1.00, gridY: 4.00, size: 1.6965108266938942, variant: 0 },
            { type: 'vegetation', gridX: 1.00, gridY: 5.00, size: 1.853539888014261, variant: 0 },
            { type: 'vegetation', gridX: 1.00, gridY: 1.00, size: 2.3029421775879033, variant: 1 },
            { type: 'vegetation', gridX: 4.00, gridY: 0.00, size: 1.7720698959041212, variant: 0 },
            { type: 'vegetation', gridX: 6.00, gridY: 2.00, size: 1.9249741003619398, variant: 0 },
            { type: 'vegetation', gridX: 5.00, gridY: 7.00, size: 2.022535025318395, variant: 0 },
            { type: 'vegetation', gridX: 5.00, gridY: 5.00, size: 1.745549283394994, variant: 3 },
            { type: 'vegetation', gridX: 0.00, gridY: 4.00, size: 2.66432370690985, variant: 3 },
            { type: 'vegetation', gridX: 7.00, gridY: 10.00, size: 1.5097149097545357, variant: 3 },
            { type: 'vegetation', gridX: 6.00, gridY: 9.00, size: 2.4331729630518044, variant: 1 },
            { type: 'vegetation', gridX: 4.00, gridY: 7.00, size: 2.7605912829433397, variant: 0 },
            { type: 'vegetation', gridX: 7.00, gridY: 8.00, size: 2.603115752222295, variant: 0 },
            { type: 'vegetation', gridX: 2.00, gridY: 6.00, size: 1.5372461110535993, variant: 0 },
            { type: 'vegetation', gridX: 4.00, gridY: 9.00, size: 2.5033112360726673, variant: 1 },
            { type: 'vegetation', gridX: 6.00, gridY: 4.00, size: 2.0753922565829868, variant: 3 },
            { type: 'vegetation', gridX: 3.00, gridY: 9.00, size: 2.694328529734225, variant: 0 },
            { type: 'vegetation', gridX: 5.00, gridY: 4.00, size: 2.22834249588945, variant: 1 },
            { type: 'vegetation', gridX: 2.00, gridY: 16.00, size: 2.250452816765659, variant: 3 },
            { type: 'vegetation', gridX: 6.00, gridY: 16.00, size: 1.722552914165683, variant: 1 },
            { type: 'vegetation', gridX: 2.00, gridY: 13.00, size: 1.9640610573851633, variant: 3 },
            { type: 'vegetation', gridX: 3.00, gridY: 16.00, size: 2.8045465128487628, variant: 3 },
            { type: 'vegetation', gridX: 3.00, gridY: 16.00, size: 2.2709388921213414, variant: 0 },
            { type: 'vegetation', gridX: 5.00, gridY: 15.00, size: 2.6799383726923383, variant: 3 },
            { type: 'vegetation', gridX: 2.00, gridY: 14.00, size: 2.593706080285324, variant: 3 },
            { type: 'vegetation', gridX: 2.00, gridY: 18.00, size: 1.5098885314594148, variant: 3 },
            { type: 'vegetation', gridX: 7.00, gridY: 18.00, size: 2.1215578253535194, variant: 3 },
            { type: 'vegetation', gridX: 6.00, gridY: 18.00, size: 2.8225764139921354, variant: 3 },
            { type: 'vegetation', gridX: 7.00, gridY: 13.00, size: 2.590608820007139, variant: 1 },
            { type: 'vegetation', gridX: 7.00, gridY: 17.00, size: 1.7468487278968203, variant: 1 },
            { type: 'vegetation', gridX: 9.00, gridY: 15.00, size: 1.9480683442346074, variant: 0 },
            { type: 'vegetation', gridX: 6.00, gridY: 18.00, size: 2.7878375812852103, variant: 1 },
            { type: 'vegetation', gridX: 8.00, gridY: 11.00, size: 2.795452933625185, variant: 0 },
            { type: 'vegetation', gridX: 8.00, gridY: 11.00, size: 1.726005538123391, variant: 0 },
            { type: 'vegetation', gridX: 5.00, gridY: 25.00, size: 2.4245616722881387, variant: 0 },
            { type: 'vegetation', gridX: 3.00, gridY: 23.00, size: 2.59997036063663, variant: 1 },
            { type: 'vegetation', gridX: 5.00, gridY: 22.00, size: 2.1094792595873098, variant: 0 },
            { type: 'vegetation', gridX: 1.00, gridY: 26.00, size: 1.754718404227944, variant: 3 },
            { type: 'vegetation', gridX: 0.00, gridY: 26.00, size: 2.2315544774962603, variant: 1 },
            { type: 'vegetation', gridX: 7.00, gridY: 23.00, size: 2.988223835156875, variant: 0 },
            { type: 'vegetation', gridX: 6.00, gridY: 28.00, size: 2.7287342535701273, variant: 1 },
            { type: 'vegetation', gridX: 4.00, gridY: 21.00, size: 1.6219319463901403, variant: 3 },
            { type: 'vegetation', gridX: 6.00, gridY: 22.00, size: 2.2221947370569337, variant: 0 },
            { type: 'vegetation', gridX: 6.00, gridY: 19.00, size: 1.9069316962247873, variant: 0 },
            { type: 'vegetation', gridX: 1.00, gridY: 19.00, size: 2.6110763229512246, variant: 0 },
            { type: 'vegetation', gridX: 2.00, gridY: 23.00, size: 2.487546825934417, variant: 0 },
            { type: 'vegetation', gridX: 1.00, gridY: 22.00, size: 1.8656752205173697, variant: 1 },
            { type: 'vegetation', gridX: 7.00, gridY: 23.00, size: 1.977643380167149, variant: 3 },
            { type: 'vegetation', gridX: 1.00, gridY: 20.00, size: 2.422209084045768, variant: 1 },
            { type: 'vegetation', gridX: 6.00, gridY: 20.00, size: 1.600106738945695, variant: 1 },
            { type: 'vegetation', gridX: 10.00, gridY: 27.00, size: 2.134790650594516, variant: 1 },
            { type: 'vegetation', gridX: 7.00, gridY: 27.00, size: 1.9755960831093575, variant: 1 },
            { type: 'vegetation', gridX: 7.00, gridY: 29.00, size: 2.0518364074149322, variant: 0 },
            { type: 'vegetation', gridX: 6.00, gridY: 29.00, size: 2.9068388102641083, variant: 3 },
            { type: 'vegetation', gridX: 6.00, gridY: 28.00, size: 1.5905967332278523, variant: 0 },
            { type: 'vegetation', gridX: 6.00, gridY: 30.00, size: 2.8129144048361012, variant: 3 },
            { type: 'vegetation', gridX: 9.00, gridY: 27.00, size: 2.822502413307957, variant: 3 },
            { type: 'vegetation', gridX: 9.00, gridY: 25.00, size: 2.042341470876199, variant: 3 },
            { type: 'vegetation', gridX: 5.00, gridY: 31.00, size: 2.760239577721485, variant: 0 },
            { type: 'vegetation', gridX: 1.00, gridY: 31.00, size: 2.0421466703179116, variant: 0 },
            { type: 'vegetation', gridX: 2.00, gridY: 30.00, size: 2.601931862931546, variant: 3 },
            { type: 'vegetation', gridX: 1.00, gridY: 30.00, size: 2.129384238025855, variant: 3 },
            { type: 'vegetation', gridX: 1.00, gridY: 31.00, size: 2.52895328917086, variant: 3 },
            { type: 'vegetation', gridX: 4.00, gridY: 25.00, size: 2.511834037275169, variant: 3 },
            { type: 'vegetation', gridX: 3.00, gridY: 32.00, size: 1.707167944699533, variant: 3 },
            { type: 'vegetation', gridX: 7.00, gridY: 31.00, size: 2.1227248517975856, variant: 3 },
            { type: 'vegetation', gridX: 11.00, gridY: 27.00, size: 2.938794688565471, variant: 1 },
            { type: 'vegetation', gridX: 10.00, gridY: 32.00, size: 2.476192613031107, variant: 1 },
            { type: 'vegetation', gridX: 12.00, gridY: 32.00, size: 2.0333630485028427, variant: 1 },
            { type: 'vegetation', gridX: 14.00, gridY: 32.00, size: 1.9215176975948716, variant: 3 },
            { type: 'vegetation', gridX: 8.00, gridY: 29.00, size: 2.4479141681527548, variant: 3 },
            { type: 'vegetation', gridX: 12.00, gridY: 28.00, size: 1.601392156981938, variant: 0 },
            { type: 'vegetation', gridX: 15.00, gridY: 29.00, size: 2.790852005151171, variant: 3 },
            { type: 'vegetation', gridX: 11.00, gridY: 29.00, size: 1.7350298638088126, variant: 1 },
            { type: 'vegetation', gridX: 20.00, gridY: 32.00, size: 1.7411851825639113, variant: 0 },
            { type: 'vegetation', gridX: 13.00, gridY: 31.00, size: 2.0779317752563156, variant: 3 },
            { type: 'vegetation', gridX: 14.00, gridY: 31.00, size: 2.158693172017885, variant: 1 },
            { type: 'vegetation', gridX: 17.00, gridY: 30.00, size: 2.241051185791627, variant: 0 },
            { type: 'vegetation', gridX: 19.00, gridY: 31.00, size: 2.007652136206357, variant: 1 },
            { type: 'vegetation', gridX: 14.00, gridY: 31.00, size: 2.529159347899351, variant: 3 },
            { type: 'vegetation', gridX: 16.00, gridY: 30.00, size: 2.4682405961088043, variant: 1 },
            { type: 'vegetation', gridX: 17.00, gridY: 32.00, size: 2.6373773223588515, variant: 0 },
            { type: 'vegetation', gridX: 12.00, gridY: 7.00, size: 2.0798879815198177, variant: 3 },
            { type: 'vegetation', gridX: 10.00, gridY: 6.00, size: 1.8718777651194545, variant: 0 },
            { type: 'vegetation', gridX: 9.00, gridY: 3.00, size: 2.1470658710144104, variant: 1 },
            { type: 'vegetation', gridX: 11.00, gridY: 5.00, size: 1.8970963121801063, variant: 1 },
            { type: 'vegetation', gridX: 11.00, gridY: 0.00, size: 1.9883372961206938, variant: 3 },
            { type: 'vegetation', gridX: 11.00, gridY: 5.00, size: 1.5201300000864924, variant: 3 },
            { type: 'vegetation', gridX: 12.00, gridY: 5.00, size: 2.247422218489813, variant: 0 },
            { type: 'vegetation', gridX: 11.00, gridY: 4.00, size: 1.6792499575981368, variant: 3 },
            { type: 'vegetation', gridX: 15.00, gridY: 1.00, size: 1.8268877841590068, variant: 0 },
            { type: 'vegetation', gridX: 14.00, gridY: 4.00, size: 2.7608423472946417, variant: 3 },
            { type: 'vegetation', gridX: 15.00, gridY: 4.00, size: 2.9833465963910393, variant: 0 },
            { type: 'vegetation', gridX: 17.00, gridY: 0.00, size: 2.0982647253996514, variant: 0 },
            { type: 'vegetation', gridX: 17.00, gridY: 0.00, size: 2.4634780999174515, variant: 0 },
            { type: 'vegetation', gridX: 18.00, gridY: 5.00, size: 1.9535372280780625, variant: 3 },
            { type: 'vegetation', gridX: 19.00, gridY: 0.00, size: 2.7110363075133392, variant: 3 },
            { type: 'vegetation', gridX: 16.00, gridY: 7.00, size: 2.2962282946492936, variant: 3 },
            { type: 'vegetation', gridX: 28.00, gridY: 0.00, size: 2.769209706430744, variant: 1 },
            { type: 'vegetation', gridX: 22.00, gridY: 3.00, size: 2.464976348384358, variant: 3 },
            { type: 'vegetation', gridX: 24.00, gridY: 1.00, size: 2.109467052516407, variant: 1 },
            { type: 'vegetation', gridX: 24.00, gridY: 6.00, size: 1.8747397348294046, variant: 1 },
            { type: 'vegetation', gridX: 25.00, gridY: 0.00, size: 1.9259699495491327, variant: 0 },
            { type: 'vegetation', gridX: 22.00, gridY: 3.00, size: 1.7468456795766691, variant: 1 },
            { type: 'vegetation', gridX: 28.00, gridY: 4.00, size: 2.9209532017558484, variant: 1 },
            { type: 'vegetation', gridX: 25.00, gridY: 2.00, size: 2.4751391032995267, variant: 3 },
            { type: 'vegetation', gridX: 37.00, gridY: 2.00, size: 1.5882255829264937, variant: 0 },
            { type: 'vegetation', gridX: 32.00, gridY: 0.00, size: 2.094902749172996, variant: 3 },
            { type: 'vegetation', gridX: 34.00, gridY: 3.00, size: 2.1569795596703143, variant: 0 },
            { type: 'vegetation', gridX: 33.00, gridY: 4.00, size: 2.769158780430472, variant: 1 },
            { type: 'vegetation', gridX: 31.00, gridY: 5.00, size: 2.213897970891373, variant: 0 },
            { type: 'vegetation', gridX: 33.00, gridY: 1.00, size: 2.3968928247229364, variant: 3 },
            { type: 'vegetation', gridX: 35.00, gridY: 1.00, size: 2.761283277665377, variant: 0 },
            { type: 'vegetation', gridX: 35.00, gridY: 5.00, size: 2.499136736338446, variant: 0 },
            { type: 'vegetation', gridX: 38.00, gridY: 5.00, size: 2.571951073616722, variant: 0 },
            { type: 'vegetation', gridX: 43.00, gridY: 5.00, size: 1.6604185758741261, variant: 3 },
            { type: 'vegetation', gridX: 43.00, gridY: 1.00, size: 2.2314272284970693, variant: 1 },
            { type: 'vegetation', gridX: 37.00, gridY: 3.00, size: 2.7825996579627934, variant: 3 },
            { type: 'vegetation', gridX: 39.00, gridY: 5.00, size: 2.5074203162230027, variant: 3 },
            { type: 'vegetation', gridX: 41.00, gridY: 2.00, size: 2.5816578057960182, variant: 1 },
            { type: 'vegetation', gridX: 42.00, gridY: 1.00, size: 1.8812570678841771, variant: 3 },
            { type: 'vegetation', gridX: 41.00, gridY: 3.00, size: 2.65310904515112, variant: 0 },
            { type: 'vegetation', gridX: 50.00, gridY: 5.00, size: 2.840843008518342, variant: 3 },
            { type: 'vegetation', gridX: 45.00, gridY: 2.00, size: 1.5181974065743593, variant: 1 },
            { type: 'vegetation', gridX: 48.00, gridY: 7.00, size: 2.7127034471895297, variant: 1 },
            { type: 'vegetation', gridX: 50.00, gridY: 4.00, size: 2.0924419537665546, variant: 0 },
            { type: 'vegetation', gridX: 50.00, gridY: 3.00, size: 2.0119275900855462, variant: 1 },
            { type: 'vegetation', gridX: 47.00, gridY: 1.00, size: 2.9484423801804756, variant: 1 },
            { type: 'vegetation', gridX: 47.00, gridY: 6.00, size: 2.6491036749774373, variant: 1 },
            { type: 'vegetation', gridX: 47.00, gridY: 6.00, size: 2.4214907191299337, variant: 3 },
            { type: 'vegetation', gridX: 52.00, gridY: 3.00, size: 2.0327338118786247, variant: 3 },
            { type: 'vegetation', gridX: 52.00, gridY: 6.00, size: 1.670194156489889, variant: 1 },
            { type: 'vegetation', gridX: 52.00, gridY: 1.00, size: 1.7776091576815178, variant: 3 },
            { type: 'vegetation', gridX: 51.00, gridY: 6.00, size: 2.9966238101342717, variant: 3 },
            { type: 'vegetation', gridX: 55.00, gridY: 7.00, size: 2.666699488681868, variant: 3 },
            { type: 'vegetation', gridX: 52.00, gridY: 4.00, size: 1.52701060280803, variant: 1 },
            { type: 'vegetation', gridX: 52.00, gridY: 7.00, size: 1.597637502773514, variant: 1 },
            { type: 'vegetation', gridX: 57.00, gridY: 2.00, size: 1.5475358768188405, variant: 1 },
            { type: 'vegetation', gridX: 58.00, gridY: 1.00, size: 2.76665711640644, variant: 1 },
            { type: 'vegetation', gridX: 56.00, gridY: 2.00, size: 2.3935852158449524, variant: 0 },
            { type: 'vegetation', gridX: 58.00, gridY: 1.00, size: 2.9472550151392154, variant: 1 },
            { type: 'vegetation', gridX: 58.00, gridY: 1.00, size: 1.540723330668714, variant: 0 },
            { type: 'vegetation', gridX: 57.00, gridY: 7.00, size: 2.3322588336610925, variant: 0 },
            { type: 'vegetation', gridX: 59.00, gridY: 4.00, size: 2.4130688599490977, variant: 0 },
            { type: 'vegetation', gridX: 59.00, gridY: 5.00, size: 2.836357004212725, variant: 3 },
            { type: 'vegetation', gridX: 58.00, gridY: 7.00, size: 2.0878873468180608, variant: 3 },
            { type: 'vegetation', gridX: 57.00, gridY: 16.00, size: 2.6213352078258874, variant: 3 },
            { type: 'vegetation', gridX: 55.00, gridY: 12.00, size: 2.912628091518859, variant: 3 },
            { type: 'vegetation', gridX: 59.00, gridY: 17.00, size: 2.146451275277016, variant: 3 },
            { type: 'vegetation', gridX: 58.00, gridY: 16.00, size: 1.9489253652434018, variant: 0 },
            { type: 'vegetation', gridX: 59.00, gridY: 15.00, size: 1.8868174752645004, variant: 1 },
            { type: 'vegetation', gridX: 59.00, gridY: 15.00, size: 1.9083720947871397, variant: 3 },
            { type: 'vegetation', gridX: 58.00, gridY: 16.00, size: 2.331410782815275, variant: 3 },
            { type: 'vegetation', gridX: 58.00, gridY: 10.00, size: 2.6260212576231394, variant: 3 },
            { type: 'vegetation', gridX: 56.00, gridY: 20.00, size: 2.767414190022799, variant: 1 },
            { type: 'vegetation', gridX: 59.00, gridY: 23.00, size: 1.640429228530408, variant: 1 },
            { type: 'vegetation', gridX: 59.00, gridY: 22.00, size: 1.7069722118826502, variant: 3 },
            { type: 'vegetation', gridX: 56.00, gridY: 21.00, size: 1.504267958489992, variant: 0 },
            { type: 'vegetation', gridX: 59.00, gridY: 19.00, size: 2.366572303050639, variant: 0 },
            { type: 'vegetation', gridX: 58.00, gridY: 21.00, size: 1.663033883833418, variant: 0 },
            { type: 'vegetation', gridX: 58.00, gridY: 23.00, size: 1.7544085580172086, variant: 3 },
            { type: 'vegetation', gridX: 59.00, gridY: 22.00, size: 1.5553605617761037, variant: 3 },
            { type: 'vegetation', gridX: 58.00, gridY: 6.00, size: 1.6528529503696872, variant: 0 },
            { type: 'vegetation', gridX: 53.00, gridY: 8.00, size: 1.6606421389526844, variant: 1 },
            { type: 'vegetation', gridX: 56.00, gridY: 4.00, size: 2.239516494312019, variant: 3 },
            { type: 'vegetation', gridX: 52.00, gridY: 6.00, size: 2.791253262986962, variant: 1 },
            { type: 'vegetation', gridX: 53.00, gridY: 8.00, size: 2.34164961430211, variant: 3 },
            { type: 'vegetation', gridX: 53.00, gridY: 6.00, size: 2.3572961964316703, variant: 3 },
            { type: 'vegetation', gridX: 56.00, gridY: 6.00, size: 2.114243363291334, variant: 3 },
            { type: 'vegetation', gridX: 56.00, gridY: 7.00, size: 2.312644896994022, variant: 0 },
            { type: 'vegetation', gridX: 47.00, gridY: 5.00, size: 2.5968251695260713, variant: 1 },
            { type: 'vegetation', gridX: 46.00, gridY: 3.00, size: 1.9811823295493944, variant: 0 },
            { type: 'vegetation', gridX: 44.00, gridY: 8.00, size: 1.8942819208608626, variant: 0 },
            { type: 'vegetation', gridX: 43.00, gridY: 7.00, size: 1.9893886614230016, variant: 1 },
            { type: 'vegetation', gridX: 45.00, gridY: 7.00, size: 2.5261982055637904, variant: 1 },
            { type: 'vegetation', gridX: 48.00, gridY: 6.00, size: 2.8639766981904833, variant: 0 },
            { type: 'vegetation', gridX: 44.00, gridY: 4.00, size: 2.512892947811331, variant: 0 },
            { type: 'vegetation', gridX: 43.00, gridY: 6.00, size: 1.8767712848863032, variant: 0 },
            { type: 'vegetation', gridX: 50.00, gridY: 0.00, size: 2.5290151669270187, variant: 3 },
            { type: 'vegetation', gridX: 52.00, gridY: 4.00, size: 2.735182664178609, variant: 3 },
            { type: 'vegetation', gridX: 51.00, gridY: 4.00, size: 2.8709772500349313, variant: 3 },
            { type: 'vegetation', gridX: 51.00, gridY: 1.00, size: 1.6659282567677802, variant: 1 },
            { type: 'vegetation', gridX: 52.00, gridY: 3.00, size: 2.5753021933011664, variant: 1 },
            { type: 'vegetation', gridX: 50.00, gridY: 1.00, size: 2.657671352669025, variant: 1 },
            { type: 'vegetation', gridX: 54.00, gridY: 6.00, size: 2.5142254665296164, variant: 1 },
            { type: 'vegetation', gridX: 50.00, gridY: 2.00, size: 2.5128877113614547, variant: 0 },
            { type: 'vegetation', gridX: 20.00, gridY: 3.00, size: 1.5971244889799614, variant: 3 },
            { type: 'vegetation', gridX: 19.00, gridY: 1.00, size: 1.9716739524883882, variant: 0 },
            { type: 'vegetation', gridX: 16.00, gridY: 4.00, size: 2.0643470334539264, variant: 0 },
            { type: 'vegetation', gridX: 22.00, gridY: 2.00, size: 2.4670334588197234, variant: 1 },
            { type: 'vegetation', gridX: 18.00, gridY: 1.00, size: 1.7210341538539913, variant: 3 },
            { type: 'vegetation', gridX: 16.00, gridY: 5.00, size: 2.263541930549189, variant: 0 },
            { type: 'vegetation', gridX: 19.00, gridY: 4.00, size: 2.1828281151253495, variant: 1 },
            { type: 'vegetation', gridX: 17.00, gridY: 4.00, size: 2.712575404779594, variant: 0 },
            { type: 'vegetation', gridX: 59.00, gridY: 29.00, size: 2.3113350449679264, variant: 1 },
            { type: 'vegetation', gridX: 54.00, gridY: 32.00, size: 2.0159984307556815, variant: 3 },
            { type: 'vegetation', gridX: 55.00, gridY: 30.00, size: 1.9755196871705225, variant: 1 },
            { type: 'vegetation', gridX: 59.00, gridY: 31.00, size: 2.39884552764451, variant: 0 },
            { type: 'vegetation', gridX: 57.00, gridY: 28.00, size: 1.5117823450486785, variant: 1 },
            { type: 'vegetation', gridX: 59.00, gridY: 29.00, size: 2.54323959412803, variant: 0 },
            { type: 'vegetation', gridX: 59.00, gridY: 29.00, size: 1.5897265378648677, variant: 1 },
            { type: 'vegetation', gridX: 55.00, gridY: 29.00, size: 2.628237647403715, variant: 0 },
            { type: 'vegetation', gridX: 50.00, gridY: 33.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 53.00, gridY: 31.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 45.00, gridY: 33.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 46.00, gridY: 32.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 12.00, gridY: 5.00, size: 2.983757072409681, variant: 3 },
            { type: 'vegetation', gridX: 11.00, gridY: 3.00, size: 2.797257237005981, variant: 3 },
            { type: 'vegetation', gridX: 14.00, gridY: 1.00, size: 2.1536135485301546, variant: 3 },
            { type: 'vegetation', gridX: 10.00, gridY: 2.00, size: 2.6987023114601563, variant: 3 },
            { type: 'vegetation', gridX: 11.00, gridY: 7.00, size: 2.4886278003875013, variant: 3 },
            { type: 'vegetation', gridX: 13.00, gridY: 7.00, size: 1.7601920795299284, variant: 3 },
            { type: 'vegetation', gridX: 11.00, gridY: 5.00, size: 1.7830526260590547, variant: 3 },
            { type: 'vegetation', gridX: 9.00, gridY: 6.00, size: 1.931639434587976, variant: 3 },
            { type: 'vegetation', gridX: 5.00, gridY: 10.00, size: 2.5478750458403505, variant: 3 },
            { type: 'vegetation', gridX: 2.00, gridY: 14.00, size: 2.930451861300576, variant: 3 },
            { type: 'vegetation', gridX: 6.00, gridY: 14.00, size: 1.682736043776687, variant: 3 },
            { type: 'vegetation', gridX: 5.00, gridY: 15.00, size: 2.1610167561476024, variant: 3 },
            { type: 'vegetation', gridX: 3.00, gridY: 14.00, size: 2.3518833368765892, variant: 3 },
            { type: 'vegetation', gridX: 1.00, gridY: 13.00, size: 2.849595212593142, variant: 3 },
            { type: 'vegetation', gridX: 7.00, gridY: 13.00, size: 1.5898168080061141, variant: 3 },
            { type: 'vegetation', gridX: 3.00, gridY: 9.00, size: 2.8497880015798627, variant: 3 },
            { type: 'vegetation', gridX: 3.00, gridY: 29.00, size: 1.7566985127046444, variant: 3 },
            { type: 'vegetation', gridX: 4.00, gridY: 28.00, size: 2.007172513609088, variant: 3 },
            { type: 'vegetation', gridX: 1.00, gridY: 28.00, size: 2.1704741386590363, variant: 3 },
            { type: 'vegetation', gridX: 5.00, gridY: 29.00, size: 2.9460528496407026, variant: 3 },
            { type: 'vegetation', gridX: 1.00, gridY: 26.00, size: 2.7797491158243544, variant: 3 },
            { type: 'vegetation', gridX: 7.00, gridY: 28.00, size: 2.0453856304950015, variant: 3 },
            { type: 'vegetation', gridX: 3.00, gridY: 25.00, size: 2.621151014840211, variant: 3 },
            { type: 'vegetation', gridX: 4.00, gridY: 30.00, size: 1.854492332124149, variant: 3 },
            { type: 'vegetation', gridX: 27.00, gridY: 8.00, size: 2.739543882187243, variant: 3 },
            { type: 'vegetation', gridX: 28.00, gridY: 5.00, size: 1.679346230199304, variant: 3 },
            { type: 'vegetation', gridX: 24.00, gridY: 3.00, size: 2.423257721042954, variant: 3 },
            { type: 'vegetation', gridX: 27.00, gridY: 5.00, size: 2.7590013856340487, variant: 3 },
            { type: 'vegetation', gridX: 23.00, gridY: 7.00, size: 1.9315260172873034, variant: 3 },
            { type: 'vegetation', gridX: 28.00, gridY: 2.00, size: 2.808545881119623, variant: 3 },
            { type: 'vegetation', gridX: 30.00, gridY: 5.00, size: 2.3753561454636993, variant: 3 },
            { type: 'vegetation', gridX: 29.00, gridY: 3.00, size: 2.8724061307728497, variant: 3 },
            { type: 'vegetation', gridX: 27.00, gridY: 15.00, size: 2, variant: 0 },
            { type: 'vegetation', gridX: 23.00, gridY: 14.00, size: 2, variant: 3 },
            { type: 'vegetation', gridX: 25.00, gridY: 11.00, size: 2, variant: 3 },
            { type: 'rock', gridX: 28.00, gridY: 15.00, size: 2, variant: 0 },
            { type: 'rock', gridX: 23.00, gridY: 13.00, size: 2, variant: 3 },
            { type: 'rock', gridX: 4.00, gridY: 19.00, size: 2.5, variant: 3 },
            { type: 'rock', gridX: 16.00, gridY: 2.00, size: 2.5, variant: 1 },
            { type: 'rock', gridX: 56.00, gridY: 32.00, size: 2.5, variant: 2 },
            { type: 'rock', gridX: 59.00, gridY: 25.00, size: 2.5, variant: 2 },
            { type: 'rock', gridX: 8.00, gridY: 31.00, size: 2.5, variant: 2 },
            { type: 'rock', gridX: 5.00, gridY: 13.00, size: 2.5, variant: 3 },
            { type: 'rock', gridX: 43.00, gridY: 3.00, size: 2.5, variant: 0 },
            { type: 'rock', gridX: 53.00, gridY: 19.00, size: 3, variant: 2 }
        ];
    }

    createMeanderingPath(canvasWidth, canvasHeight) {
        const gridWidth = this.gridWidth || 60;
        const gridHeight = this.gridHeight || 33.75;

        const pathInGridCoords = [
            { gridX: 48.00, gridY: 34.00 },
            { gridX: 48.00, gridY: 26.00 },
            { gridX: 34.00, gridY: 26.00 },
            { gridX: 34.00, gridY: 21.00 },
            { gridX: 34.00, gridY: 20.00 },
            { gridX: 48.00, gridY: 20.00 },
            { gridX: 48.00, gridY: 13.00 },
            { gridX: 25.00, gridY: 13.00 },
            { gridX: 25.00, gridY: 30.00 }
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
            enemyHealth_multiplier: 1.1, 
            speedMultiplier: 0.75, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'archer', count: 2 }, { type: 'villager', count: 9 }, { type: 'basic', count: 4 }] 
        }
        // Wave 2
        , { 
            enemyHealth_multiplier: 1.3, 
            speedMultiplier: 0.85, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'archer', count: 10 }, { type: 'villager', count: 7 }, { type: 'basic', count: 6 }] 
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
            pattern: [{ type: 'beefyenemy', count: 2 }] 
        }
        // Wave 5
        , { 
            enemyHealth_multiplier: 1.3, 
            speedMultiplier: 1.3, 
            spawnInterval: 0.4, 
            pattern: [{ type: 'archer', count: 20 }] 
        }
        // Wave 6
        , { 
            enemyHealth_multiplier: 1.3, 
            speedMultiplier: 1, 
            spawnInterval: 0.2, 
            pattern: [{ type: 'beefyenemy', count: 10 }] 
        }
        // Wave 7
        , { 
            enemyHealth_multiplier: 0.8, 
            speedMultiplier: 1, 
            spawnInterval: 1, 
            pattern: [{ type: 'mage', count: 2 }] 
        }
        // Wave 8
        , { 
            enemyHealth_multiplier: 1.5, 
            speedMultiplier: 1.2, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'villager', count: 24 }, { type: 'basic', count: 15 }] 
        }
        // Wave 9
        , { 
            enemyHealth_multiplier: 1.3, 
            speedMultiplier: 0.67, 
            spawnInterval: 0.3, 
            pattern: [{ type: 'archer', count: 12 }, { type: 'villager', count: 12 }, { type: 'basic', count: 12 }] 
        }
        // Wave 10
        , { 
            enemyHealth_multiplier: 1.3, 
            speedMultiplier: 1.3, 
            spawnInterval: 0.3, 
            pattern: [{ type: 'archer', count: 15 }, { type: 'villager', count: 15 }, { type: 'basic', count: 15 }] 
        }
        // Wave 11
        , { 
            enemyHealth_multiplier: 1.5, 
            speedMultiplier: 1.42, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'archer', count: 38 }] 
        }
        // Wave 12
        , { 
            enemyHealth_multiplier: 1.3, 
            speedMultiplier: 1, 
            spawnInterval: 0.4, 
            pattern: [{ type: 'mage', count: 1 }, { type: 'frog', count: 20 }] 
        }
        // Wave 13
        , { 
            enemyHealth_multiplier: 1.5, 
            speedMultiplier: 1.3, 
            spawnInterval: 0.05, 
            pattern: [{ type: 'frog', count: 45 }] 
        }
        // Wave 14
        , { 
            enemyHealth_multiplier: 1.5, 
            speedMultiplier: 1, 
            spawnInterval: 0.4, 
            pattern: [{ type: 'shieldknight', count: 5 }, { type: 'beefyenemy', count: 7 }, { type: 'knight', count: 1 }] 
        }
        // Wave 15
        , { 
            enemyHealth_multiplier: 2, 
            speedMultiplier: 0.8, 
            spawnInterval: 15, 
            pattern: [{ type: 'knight', count: 3 }] 
        }
        // Wave 16
        , { 
            enemyHealth_multiplier: 2.7, 
            speedMultiplier: 1, 
            spawnInterval: 0.5, 
            pattern: [{ type: 'knight', count: 3 }] 
        }
        // Wave 17
        , { 
            enemyHealth_multiplier: 1.5, 
            speedMultiplier: 1.27, 
            spawnInterval: 0.5, 
            pattern: [{ type: 'mage', count: 3 }, { type: 'shieldknight', count: 2 }, { type: 'beefyenemy', count: 5 }] 
        }
        // Wave 18
        , { 
            enemyHealth_multiplier: 1.6, 
            speedMultiplier: 0.75, 
            spawnInterval: 0.2, 
            pattern: [{ type: 'archer', count: 17 }, { type: 'villager', count: 16 }, { type: 'basic', count: 16 }] 
        }
        // Wave 19
        , { 
            enemyHealth_multiplier: 1.8, 
            speedMultiplier: 1.6, 
            spawnInterval: 0.5, 
            pattern: [{ type: 'archer', count: 39 }] 
        }
        // Wave 20
        , { 
            enemyHealth_multiplier: 2.2, 
            speedMultiplier: 1.13, 
            spawnInterval: 0.1, 
            pattern: [{ type: 'knight', count: 1 }, { type: 'mage', count: 1 }, { type: 'shieldknight', count: 1 }] 
        }
        // Wave 21
        , { 
            enemyHealth_multiplier: 5, 
            speedMultiplier: 0.78, 
            spawnInterval: 1, 
            pattern: [{ type: 'mage', count: 1 }] 
        }
        // Wave 22
        , { 
            enemyHealth_multiplier: 5, 
            speedMultiplier: 0.55, 
            spawnInterval: 1, 
            pattern: [{ type: 'knight', count: 1 }] 
        }
        // Wave 23
        , { 
            enemyHealth_multiplier: 2, 
            speedMultiplier: 1.2, 
            spawnInterval: 0.3, 
            pattern: [{ type: 'mage', count: 1 }, { type: 'frog', count: 32 }] 
        }
        // Wave 24
        , { 
            enemyHealth_multiplier: 1.8, 
            speedMultiplier: 1, 
            spawnInterval: 0.3, 
            pattern: [{ type: 'shieldknight', count: 3 }, { type: 'beefyenemy', count: 7 }, { type: 'frog', count: 16 }, { type: 'basic', count: 12 }, { type: 'villager', count: 8 }, { type: 'archer', count: 9 }, { type: 'knight', count: 1 }] 
        }
        // Wave 25
        , { 
            enemyHealth_multiplier: 4.5, 
            speedMultiplier: 1.3, 
            spawnInterval: 0.3, 
            pattern: [{ type: 'beefyenemy', count: 32 }] 
        }
        // Wave 26
        , { 
            enemyHealth_multiplier: 1.5, 
            speedMultiplier: 1.3, 
            spawnInterval: 0.3, 
            pattern: [{ type: 'knight', count: 1 }, { type: 'mage', count: 2 }, { type: 'shieldknight', count: 6 }] 
        }
        // Wave 27
        , { 
            enemyHealth_multiplier: 5.5, 
            speedMultiplier: 0.8, 
            spawnInterval: 0.3, 
            pattern: [{ type: 'knight', count: 1 }] 
        }
        ];

        if (wave > 0 && wave <= waveConfigs.length) {
            return waveConfigs[wave - 1];
        }
        
        return null;
    }
}