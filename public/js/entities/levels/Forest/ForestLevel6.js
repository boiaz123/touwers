import { LevelBase } from '../LevelBase.js';

export class ForestLevel6 extends LevelBase {
    static levelMetadata = {
        name: 'Sundown Meadows',
        difficulty: 'Easy',
        order: 6,
        campaign: 'forest'
    };

    constructor() {
        super();
        // Derive instance properties from static metadata
        this.levelName = ForestLevel6.levelMetadata.name;
        this.levelNumber = ForestLevel6.levelMetadata.order;
        this.difficulty = ForestLevel6.levelMetadata.difficulty;
        this.campaign = ForestLevel6.levelMetadata.campaign;
        this.maxWaves = 7;

        // Set terrain elements (prevent tower placement on these areas)
        this.terrainElements = [
            { type: 'water', gridX: 60.00, gridY: 24.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 59.00, gridY: 24.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 58.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 57.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 56.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 56.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 55.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 55.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 54.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 53.00, gridY: 24.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 52.00, gridY: 24.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 51.00, gridY: 25.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 51.00, gridY: 25.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 51.00, gridY: 25.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 50.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 50.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 50.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 49.00, gridY: 29.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 49.00, gridY: 29.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 49.00, gridY: 29.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 49.00, gridY: 30.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 49.00, gridY: 31.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 50.00, gridY: 32.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 50.00, gridY: 33.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 50.00, gridY: 33.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 50.00, gridY: 34.00, size: 1.5, waterType: 'river' },
            { type: 'vegetation', gridX: 46.00, gridY: 0.00, size: 2.3379018058413212, variant: 2 },
            { type: 'vegetation', gridX: 45.00, gridY: 5.00, size: 1.742734453960275, variant: 2 },
            { type: 'vegetation', gridX: 48.00, gridY: 1.00, size: 2.524728257995543, variant: 2 },
            { type: 'vegetation', gridX: 46.00, gridY: 0.00, size: 2.0546650319063087, variant: 2 },
            { type: 'vegetation', gridX: 45.00, gridY: 4.00, size: 2.8895683101714473, variant: 0 },
            { type: 'vegetation', gridX: 50.00, gridY: 0.00, size: 1.6580643007354143, variant: 2 },
            { type: 'vegetation', gridX: 50.00, gridY: 4.00, size: 2.215104825489804, variant: 3 },
            { type: 'vegetation', gridX: 46.00, gridY: 4.00, size: 2.431391086316877, variant: 3 },
            { type: 'vegetation', gridX: 53.00, gridY: 1.00, size: 2.2428744784960877, variant: 0 },
            { type: 'vegetation', gridX: 48.00, gridY: 6.00, size: 2.557697866210246, variant: 0 },
            { type: 'vegetation', gridX: 53.00, gridY: 6.00, size: 2.292553699007237, variant: 3 },
            { type: 'vegetation', gridX: 51.00, gridY: 0.00, size: 2.7593634707626977, variant: 2 },
            { type: 'vegetation', gridX: 51.00, gridY: 0.00, size: 2.158014386800763, variant: 1 },
            { type: 'vegetation', gridX: 51.00, gridY: 1.00, size: 2.940382846335917, variant: 0 },
            { type: 'vegetation', gridX: 52.00, gridY: 3.00, size: 1.8922284141834937, variant: 2 },
            { type: 'vegetation', gridX: 52.00, gridY: 3.00, size: 2.3827531536653908, variant: 2 },
            { type: 'vegetation', gridX: 50.00, gridY: 3.00, size: 1.6163349785681094, variant: 0 },
            { type: 'vegetation', gridX: 52.00, gridY: 0.00, size: 1.8481629610695447, variant: 0 },
            { type: 'vegetation', gridX: 53.00, gridY: 5.00, size: 1.6787007590035978, variant: 2 },
            { type: 'vegetation', gridX: 51.00, gridY: 1.00, size: 2.254988547515113, variant: 1 },
            { type: 'vegetation', gridX: 53.00, gridY: 3.00, size: 2.368260864735764, variant: 2 },
            { type: 'vegetation', gridX: 54.00, gridY: 0.00, size: 2.9047455575791825, variant: 2 },
            { type: 'vegetation', gridX: 53.00, gridY: 6.00, size: 2.1960336862503635, variant: 3 },
            { type: 'vegetation', gridX: 56.00, gridY: 4.00, size: 2.0536852919705044, variant: 2 },
            { type: 'vegetation', gridX: 53.00, gridY: 4.00, size: 2.0048776878082224, variant: 3 },
            { type: 'vegetation', gridX: 54.00, gridY: 2.00, size: 1.7375898325006935, variant: 1 },
            { type: 'vegetation', gridX: 53.00, gridY: 3.00, size: 2.7713565747090407, variant: 0 },
            { type: 'vegetation', gridX: 58.00, gridY: 3.00, size: 2.934820212275786, variant: 2 },
            { type: 'vegetation', gridX: 52.00, gridY: 2.00, size: 2.2021773449431157, variant: 0 },
            { type: 'vegetation', gridX: 58.00, gridY: 4.00, size: 1.5988296977725165, variant: 0 },
            { type: 'vegetation', gridX: 56.00, gridY: 8.00, size: 1.7248039777618618, variant: 0 },
            { type: 'vegetation', gridX: 56.00, gridY: 5.00, size: 2.601780687427194, variant: 2 },
            { type: 'vegetation', gridX: 55.00, gridY: 7.00, size: 2.882725226376501, variant: 0 },
            { type: 'vegetation', gridX: 55.00, gridY: 8.00, size: 2.9378231982470195, variant: 0 },
            { type: 'vegetation', gridX: 59.00, gridY: 5.00, size: 1.9174353505692396, variant: 1 },
            { type: 'vegetation', gridX: 59.00, gridY: 4.00, size: 2.3000734660991076, variant: 1 },
            { type: 'vegetation', gridX: 59.00, gridY: 5.00, size: 2.27848874280055, variant: 3 },
            { type: 'vegetation', gridX: 59.00, gridY: 7.00, size: 1.6586115748409203, variant: 1 },
            { type: 'vegetation', gridX: 53.00, gridY: 5.00, size: 2.1371633342751366, variant: 0 },
            { type: 'vegetation', gridX: 56.00, gridY: 4.00, size: 2.3234094739431326, variant: 0 },
            { type: 'vegetation', gridX: 58.00, gridY: 8.00, size: 2.4050839942894697, variant: 2 },
            { type: 'vegetation', gridX: 56.00, gridY: 5.00, size: 2.2585575857444184, variant: 1 },
            { type: 'vegetation', gridX: 56.00, gridY: 10.00, size: 1.797561188495427, variant: 3 },
            { type: 'vegetation', gridX: 55.00, gridY: 8.00, size: 2.110145867541229, variant: 3 },
            { type: 'vegetation', gridX: 56.00, gridY: 8.00, size: 2.082592453111103, variant: 2 },
            { type: 'vegetation', gridX: 59.00, gridY: 9.00, size: 1.998130386302205, variant: 2 },
            { type: 'vegetation', gridX: 59.00, gridY: 11.00, size: 2.6262064269801804, variant: 2 },
            { type: 'vegetation', gridX: 59.00, gridY: 7.00, size: 1.5308376246713957, variant: 1 },
            { type: 'vegetation', gridX: 59.00, gridY: 15.00, size: 1.6159989792051728, variant: 0 },
            { type: 'vegetation', gridX: 55.00, gridY: 18.00, size: 1.679073505441235, variant: 1 },
            { type: 'vegetation', gridX: 56.00, gridY: 19.00, size: 1.8453616631036909, variant: 3 },
            { type: 'vegetation', gridX: 59.00, gridY: 18.00, size: 2.8005523817791014, variant: 3 },
            { type: 'vegetation', gridX: 59.00, gridY: 19.00, size: 2.0270180061788605, variant: 1 },
            { type: 'vegetation', gridX: 55.00, gridY: 20.00, size: 2.435733267595972, variant: 2 },
            { type: 'vegetation', gridX: 56.00, gridY: 20.00, size: 2.730638350618098, variant: 2 },
            { type: 'vegetation', gridX: 56.00, gridY: 19.00, size: 1.950400026046829, variant: 3 },
            { type: 'vegetation', gridX: 59.00, gridY: 30.00, size: 2.321393021361733, variant: 2 },
            { type: 'vegetation', gridX: 55.00, gridY: 29.00, size: 2.626956529461595, variant: 0 },
            { type: 'vegetation', gridX: 57.00, gridY: 32.75, size: 2.4238544079012767, variant: 0 },
            { type: 'vegetation', gridX: 59.00, gridY: 31.00, size: 2.570363839095676, variant: 0 },
            { type: 'vegetation', gridX: 58.00, gridY: 28.00, size: 2.387884259404488, variant: 2 },
            { type: 'vegetation', gridX: 56.00, gridY: 29.00, size: 1.899445877763681, variant: 0 },
            { type: 'vegetation', gridX: 59.00, gridY: 32.00, size: 2.6615984121933547, variant: 2 },
            { type: 'vegetation', gridX: 59.00, gridY: 28.00, size: 1.8168817844582241, variant: 0 },
            { type: 'vegetation', gridX: 54.00, gridY: 32.75, size: 2.1676124533294483, variant: 1 },
            { type: 'vegetation', gridX: 55.00, gridY: 32.75, size: 1.6445051780325888, variant: 2 },
            { type: 'vegetation', gridX: 59.00, gridY: 30.00, size: 2.6202825922090334, variant: 1 },
            { type: 'vegetation', gridX: 59.00, gridY: 31.00, size: 2.751999596084281, variant: 0 },
            { type: 'vegetation', gridX: 53.00, gridY: 29.00, size: 2.5926883005038293, variant: 1 },
            { type: 'vegetation', gridX: 57.00, gridY: 29.00, size: 1.788133648602118, variant: 1 },
            { type: 'vegetation', gridX: 57.00, gridY: 32.00, size: 2.6089764419870005, variant: 2 },
            { type: 'vegetation', gridX: 53.00, gridY: 29.00, size: 2.6710916904225006, variant: 1 },
            { type: 'vegetation', gridX: 53.00, gridY: 32.75, size: 1.6253304254587841, variant: 1 },
            { type: 'vegetation', gridX: 56.00, gridY: 30.00, size: 2.250571041577197, variant: 0 },
            { type: 'vegetation', gridX: 54.00, gridY: 32.75, size: 1.8642746297164217, variant: 0 },
            { type: 'vegetation', gridX: 47.00, gridY: 32.00, size: 1.8007250800555878, variant: 2 },
            { type: 'vegetation', gridX: 51.00, gridY: 32.00, size: 2.332155337717439, variant: 0 },
            { type: 'vegetation', gridX: 48.00, gridY: 28.00, size: 2.968081982741006, variant: 3 },
            { type: 'vegetation', gridX: 46.00, gridY: 32.75, size: 2.6832198153498883, variant: 2 },
            { type: 'vegetation', gridX: 45.00, gridY: 31.00, size: 2.637590456826923, variant: 1 },
            { type: 'vegetation', gridX: 46.00, gridY: 32.00, size: 2.4476354477700326, variant: 2 },
            { type: 'vegetation', gridX: 46.00, gridY: 30.00, size: 2.73936638437363, variant: 2 },
            { type: 'vegetation', gridX: 52.00, gridY: 29.00, size: 2.607674384549702, variant: 3 },
            { type: 'vegetation', gridX: 19.00, gridY: 32.75, size: 2.5880444784859193, variant: 1 },
            { type: 'vegetation', gridX: 16.00, gridY: 32.75, size: 1.58589678173511, variant: 3 },
            { type: 'vegetation', gridX: 14.00, gridY: 32.00, size: 2.087837566580874, variant: 0 },
            { type: 'vegetation', gridX: 20.00, gridY: 32.00, size: 2.7971081548069003, variant: 2 },
            { type: 'vegetation', gridX: 13.00, gridY: 30.00, size: 2.628152428049564, variant: 3 },
            { type: 'vegetation', gridX: 18.00, gridY: 32.75, size: 2.9547152875356497, variant: 2 },
            { type: 'vegetation', gridX: 19.00, gridY: 29.00, size: 1.9183713676250067, variant: 2 },
            { type: 'vegetation', gridX: 18.00, gridY: 29.00, size: 2.8436992245334345, variant: 0 },
            { type: 'vegetation', gridX: 20.00, gridY: 32.75, size: 2.001344318277143, variant: 1 },
            { type: 'vegetation', gridX: 22.00, gridY: 32.75, size: 1.7345661512054589, variant: 1 },
            { type: 'vegetation', gridX: 20.00, gridY: 32.75, size: 2.0971318085214534, variant: 1 },
            { type: 'vegetation', gridX: 24.00, gridY: 32.75, size: 2.8783748850790927, variant: 1 },
            { type: 'vegetation', gridX: 21.00, gridY: 28.00, size: 2.0694841967883377, variant: 2 },
            { type: 'vegetation', gridX: 20.00, gridY: 28.00, size: 2.7578588732218714, variant: 3 },
            { type: 'vegetation', gridX: 24.00, gridY: 30.00, size: 2.14084570301008, variant: 0 },
            { type: 'vegetation', gridX: 21.00, gridY: 28.00, size: 2.229618800296945, variant: 1 },
            { type: 'vegetation', gridX: 21.00, gridY: 29.00, size: 1.5254031300073552, variant: 1 },
            { type: 'vegetation', gridX: 26.00, gridY: 31.00, size: 1.809541877329677, variant: 0 },
            { type: 'vegetation', gridX: 22.00, gridY: 32.75, size: 2.9560235861236475, variant: 1 },
            { type: 'vegetation', gridX: 25.00, gridY: 29.00, size: 1.8610727900429405, variant: 0 },
            { type: 'vegetation', gridX: 29.00, gridY: 29.00, size: 2.652296538916327, variant: 0 },
            { type: 'vegetation', gridX: 23.00, gridY: 28.00, size: 2.933991123173547, variant: 0 },
            { type: 'vegetation', gridX: 28.00, gridY: 27.00, size: 2.8339116410364564, variant: 2 },
            { type: 'vegetation', gridX: 24.00, gridY: 32.00, size: 1.8755662228281589, variant: 0 },
            { type: 'vegetation', gridX: 24.00, gridY: 32.75, size: 2.90722944908985, variant: 2 },
            { type: 'vegetation', gridX: 28.00, gridY: 32.75, size: 2.2110203362101952, variant: 2 },
            { type: 'vegetation', gridX: 29.00, gridY: 31.00, size: 2.6126315714124924, variant: 3 },
            { type: 'vegetation', gridX: 26.00, gridY: 29.00, size: 1.542305978551458, variant: 3 },
            { type: 'vegetation', gridX: 30.00, gridY: 30.00, size: 1.8862787061041015, variant: 0 },
            { type: 'vegetation', gridX: 16.00, gridY: 28.00, size: 2.151054081507282, variant: 0 },
            { type: 'vegetation', gridX: 13.00, gridY: 28.00, size: 2.654338285466613, variant: 2 },
            { type: 'vegetation', gridX: 0.00, gridY: 3.00, size: 2.486188406967586, variant: 3 },
            { type: 'vegetation', gridX: 3.00, gridY: 4.00, size: 1.5255643621343637, variant: 3 },
            { type: 'vegetation', gridX: 0.00, gridY: 2.00, size: 1.7405031596901928, variant: 2 },
            { type: 'vegetation', gridX: 2.00, gridY: 6.00, size: 2.2287373902218075, variant: 2 },
            { type: 'vegetation', gridX: 0.00, gridY: 2.00, size: 2.530037339172667, variant: 1 },
            { type: 'vegetation', gridX: 4.00, gridY: 5.00, size: 2.2784294086547305, variant: 2 },
            { type: 'vegetation', gridX: 0.00, gridY: 7.00, size: 2.6898234874596434, variant: 0 },
            { type: 'vegetation', gridX: 5.00, gridY: 3.00, size: 2.990295165309079, variant: 3 },
            { type: 'vegetation', gridX: 1.00, gridY: 29.00, size: 2.4689316009339044, variant: 1 },
            { type: 'vegetation', gridX: 0.00, gridY: 30.00, size: 2.5623931732126, variant: 1 },
            { type: 'vegetation', gridX: 3.00, gridY: 27.00, size: 2.5429106625187075, variant: 2 },
            { type: 'vegetation', gridX: 2.00, gridY: 30.00, size: 2.145174219102141, variant: 3 },
            { type: 'vegetation', gridX: 2.00, gridY: 32.75, size: 2.7546512073707343, variant: 1 },
            { type: 'vegetation', gridX: 4.00, gridY: 32.75, size: 2.8984346910787337, variant: 2 },
            { type: 'vegetation', gridX: 0.00, gridY: 28.00, size: 2.8662020705323257, variant: 1 },
            { type: 'vegetation', gridX: 4.00, gridY: 32.00, size: 2.929322771683946, variant: 2 },
            { type: 'vegetation', gridX: 1.00, gridY: 31.00, size: 1.808897946820622, variant: 2 },
            { type: 'vegetation', gridX: 4.00, gridY: 30.00, size: 1.9736453939752552, variant: 3 },
            { type: 'vegetation', gridX: 0.00, gridY: 29.00, size: 2.2242791152401074, variant: 1 },
            { type: 'vegetation', gridX: 1.00, gridY: 32.00, size: 2.6524515967758506, variant: 0 },
            { type: 'vegetation', gridX: 4.00, gridY: 32.75, size: 1.5608364932469907, variant: 0 },
            { type: 'vegetation', gridX: 0.00, gridY: 31.00, size: 2.0680712215859947, variant: 3 },
            { type: 'vegetation', gridX: 3.00, gridY: 31.00, size: 2.614048726411004, variant: 0 },
            { type: 'vegetation', gridX: 2.00, gridY: 32.75, size: 2.4729902073756405, variant: 3 },
            { type: 'vegetation', gridX: 7.00, gridY: 0.00, size: 1.716504577390825, variant: 3 },
            { type: 'vegetation', gridX: 12.00, gridY: 1.00, size: 2.7685391931377548, variant: 1 },
            { type: 'vegetation', gridX: 12.00, gridY: 3.00, size: 2.2323671693327554, variant: 0 },
            { type: 'vegetation', gridX: 11.00, gridY: 0.00, size: 2.1712329465820233, variant: 3 },
            { type: 'vegetation', gridX: 11.00, gridY: 3.00, size: 2.457189112193448, variant: 1 },
            { type: 'vegetation', gridX: 12.00, gridY: 3.00, size: 2.5387855430727235, variant: 3 },
            { type: 'vegetation', gridX: 10.00, gridY: 0.00, size: 1.7368922688708468, variant: 1 },
            { type: 'vegetation', gridX: 8.00, gridY: 0.00, size: 1.6204650160031084, variant: 0 },
            { type: 'vegetation', gridX: 38.00, gridY: 2.00, size: 1.6042034156858715, variant: 1 },
            { type: 'vegetation', gridX: 36.00, gridY: 0.00, size: 2.162912989694745, variant: 0 },
            { type: 'vegetation', gridX: 36.00, gridY: 3.00, size: 2.2021789125554783, variant: 1 },
            { type: 'vegetation', gridX: 38.00, gridY: 1.00, size: 1.7427074202742006, variant: 0 },
            { type: 'vegetation', gridX: 37.00, gridY: 3.00, size: 2.113886936595924, variant: 3 },
            { type: 'vegetation', gridX: 39.00, gridY: 3.00, size: 2.900102865964425, variant: 2 },
            { type: 'vegetation', gridX: 37.00, gridY: 0.00, size: 1.5147709507437441, variant: 3 },
            { type: 'vegetation', gridX: 37.00, gridY: 1.00, size: 1.6043243542708474, variant: 2 },
            { type: 'vegetation', gridX: 37.00, gridY: 0.00, size: 2.8631504129817493, variant: 2 },
            { type: 'vegetation', gridX: 38.00, gridY: 2.00, size: 1.841490877688455, variant: 1 },
            { type: 'vegetation', gridX: 39.00, gridY: 2.00, size: 2.564044716782729, variant: 3 },
            { type: 'vegetation', gridX: 39.00, gridY: 1.00, size: 1.5302859490128413, variant: 2 },
            { type: 'vegetation', gridX: 40.00, gridY: 0.00, size: 1.7769822550739927, variant: 0 },
            { type: 'vegetation', gridX: 40.00, gridY: 2.00, size: 1.6286947535267706, variant: 1 },
            { type: 'vegetation', gridX: 40.00, gridY: 3.00, size: 2.0035420057850857, variant: 2 },
            { type: 'vegetation', gridX: 39.00, gridY: 3.00, size: 2.418044479519503, variant: 1 },
            { type: 'vegetation', gridX: 44.00, gridY: 2.00, size: 1.7929818220409284, variant: 1 },
            { type: 'vegetation', gridX: 41.00, gridY: 3.00, size: 2.9928339092379117, variant: 0 },
            { type: 'vegetation', gridX: 38.00, gridY: 1.00, size: 1.874475466653225, variant: 2 },
            { type: 'vegetation', gridX: 39.00, gridY: 2.00, size: 2.5548187335928594, variant: 0 },
            { type: 'vegetation', gridX: 43.00, gridY: 5.00, size: 1.7687441057445592, variant: 2 },
            { type: 'vegetation', gridX: 38.00, gridY: 2.00, size: 2.7892114283943723, variant: 3 },
            { type: 'vegetation', gridX: 41.00, gridY: 4.00, size: 2.3282989417824913, variant: 3 },
            { type: 'vegetation', gridX: 41.00, gridY: 0.00, size: 2.249781103708047, variant: 1 },
            { type: 'vegetation', gridX: 43.00, gridY: 0.00, size: 2.17512554528156, variant: 2 },
            { type: 'vegetation', gridX: 43.00, gridY: 2.00, size: 1.5542659516588546, variant: 3 },
            { type: 'vegetation', gridX: 43.00, gridY: 0.00, size: 2.988311895239373, variant: 0 },
            { type: 'vegetation', gridX: 41.00, gridY: 2.00, size: 1.603570770819075, variant: 0 },
            { type: 'vegetation', gridX: 43.00, gridY: 4.00, size: 2.890139263268863, variant: 1 },
            { type: 'vegetation', gridX: 42.00, gridY: 0.00, size: 2.5838489144181653, variant: 0 },
            { type: 'vegetation', gridX: 45.00, gridY: 0.00, size: 1.6516173558732004, variant: 1 },
            { type: 'vegetation', gridX: 42.00, gridY: 0.00, size: 2.22676725633028, variant: 3 },
            { type: 'vegetation', gridX: 41.00, gridY: 3.00, size: 2.116439730723245, variant: 0 },
            { type: 'vegetation', gridX: 44.00, gridY: 0.00, size: 2.9961841854106748, variant: 1 },
            { type: 'vegetation', gridX: 45.00, gridY: 1.00, size: 2.2417191008148794, variant: 2 },
            { type: 'vegetation', gridX: 46.00, gridY: 2.00, size: 2.0192212793467834, variant: 1 },
            { type: 'vegetation', gridX: 48.00, gridY: 1.00, size: 1.8228289176927623, variant: 1 },
            { type: 'vegetation', gridX: 46.00, gridY: 5.00, size: 2.1683468866122513, variant: 2 },
            { type: 'vegetation', gridX: 48.00, gridY: 2.00, size: 2.308938770600463, variant: 2 },
            { type: 'vegetation', gridX: 43.00, gridY: 0.00, size: 1.7936674324783393, variant: 2 },
            { type: 'vegetation', gridX: 54.00, gridY: 14.00, size: 2.8778694490450363, variant: 2 },
            { type: 'vegetation', gridX: 56.00, gridY: 17.00, size: 2.123269882646569, variant: 0 },
            { type: 'vegetation', gridX: 51.00, gridY: 13.00, size: 2.811671514404982, variant: 2 },
            { type: 'vegetation', gridX: 52.00, gridY: 15.00, size: 1.9212855521594903, variant: 2 },
            { type: 'vegetation', gridX: 53.00, gridY: 10.00, size: 2.264233914912225, variant: 2 },
            { type: 'vegetation', gridX: 56.00, gridY: 16.00, size: 2.2064377877065264, variant: 3 },
            { type: 'vegetation', gridX: 54.00, gridY: 10.00, size: 2.9630340803418735, variant: 3 },
            { type: 'vegetation', gridX: 54.00, gridY: 14.00, size: 2.1883209641904244, variant: 1 },
            { type: 'vegetation', gridX: 31.00, gridY: 32.00, size: 1.740909822256278, variant: 2 },
            { type: 'vegetation', gridX: 36.00, gridY: 32.75, size: 2.4425194941101447, variant: 2 },
            { type: 'vegetation', gridX: 34.00, gridY: 32.75, size: 2.6838337727782, variant: 2 },
            { type: 'vegetation', gridX: 30.00, gridY: 32.75, size: 2.7807595729778773, variant: 3 },
            { type: 'vegetation', gridX: 32.00, gridY: 29.00, size: 2.1836909406342104, variant: 0 },
            { type: 'vegetation', gridX: 31.00, gridY: 30.00, size: 1.639343218918146, variant: 3 },
            { type: 'vegetation', gridX: 33.00, gridY: 32.00, size: 2.650827206377584, variant: 0 },
            { type: 'vegetation', gridX: 30.00, gridY: 31.00, size: 2.0179506833795235, variant: 0 },
            { type: 'vegetation', gridX: 39.00, gridY: 32.00, size: 2.5, variant: 2 },
            { type: 'vegetation', gridX: 43.00, gridY: 32.00, size: 2.5, variant: 0 },
            { type: 'vegetation', gridX: 43.00, gridY: 29.00, size: 2.5, variant: 3 },
            { type: 'rock', gridX: 41.00, gridY: 33.00, size: 2.5, variant: 0 },
            { type: 'rock', gridX: 15.00, gridY: 30.00, size: 2.5, variant: 0 },
            { type: 'rock', gridX: 0.00, gridY: 24.00, size: 2.5, variant: 0 },
            { type: 'rock', gridX: 4.00, gridY: 6.00, size: 2.5, variant: 0 },
            { type: 'rock', gridX: 2.00, gridY: 2.00, size: 2.5, variant: 0 },
            { type: 'rock', gridX: 51.00, gridY: 5.00, size: 2.5, variant: 0 },
            { type: 'rock', gridX: 14.00, gridY: 1.00, size: 2.5, variant: 1 },
            { type: 'rock', gridX: 3.00, gridY: 28.00, size: 2.5, variant: 1 },
            { type: 'rock', gridX: 13.00, gridY: 33.00, size: 2.5, variant: 1 },
            { type: 'rock', gridX: 54.00, gridY: 30.00, size: 2.5, variant: 1 },
            { type: 'rock', gridX: 58.00, gridY: 20.00, size: 2.5, variant: 1 },
            { type: 'rock', gridX: 49.00, gridY: 10.00, size: 2, variant: 2 },
            { type: 'rock', gridX: 2.00, gridY: 24.00, size: 2, variant: 2 },
            { type: 'rock', gridX: 48.00, gridY: 33.00, size: 2, variant: 2 },
            { type: 'rock', gridX: 3.00, gridY: 15.00, size: 2.5, variant: 3 },
            { type: 'rock', gridX: 34.00, gridY: 3.00, size: 2.5, variant: 3 },
            { type: 'rock', gridX: 51.00, gridY: 18.00, size: 2.5, variant: 3 }
        ];
    }

    createMeanderingPath(canvasWidth, canvasHeight) {
        const gridWidth = this.gridWidth || 60;
        const gridHeight = this.gridHeight || 33.75;

        const pathInGridCoords = [
            { gridX: 9.00, gridY: 34.00 },
            { gridX: 9.00, gridY: 7.00 },
            { gridX: 23.00, gridY: 7.00 },
            { gridX: 23.00, gridY: 22.00 },
            { gridX: 29.00, gridY: 22.00 },
            { gridX: 29.00, gridY: 13.00 },
            { gridX: 35.00, gridY: 13.00 },
            { gridX: 35.00, gridY: 27.00 },
            { gridX: 41.00, gridY: 27.00 },
            { gridX: 41.00, gridY: 10.00 }
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
            enemyHealth_multiplier: 0.9, 
            speedMultiplier: 0.6, 
            spawnInterval: 1.8, 
            pattern: [{ type: 'basic', count: 28 }, { type: 'villager', count: 21 }] 
        }
        // Wave 2
        , { 
            enemyHealth_multiplier: 1, 
            speedMultiplier: 0.8, 
            spawnInterval: 1, 
            pattern: [{ type: 'archer', count: 38 }] 
        }
        // Wave 3
        , { 
            enemyHealth_multiplier: 1, 
            speedMultiplier: 0.7, 
            spawnInterval: 1.5, 
            pattern: [{ type: 'villager', count: 26 }, { type: 'basic', count: 22 }, { type: 'beefyenemy', count: 7 }] 
        }
        // Wave 4
        , { 
            enemyHealth_multiplier: 1.2, 
            speedMultiplier: 0.8, 
            spawnInterval: 1.4, 
            pattern: [{ type: 'basic', count: 17 }, { type: 'villager', count: 22 }, { type: 'archer', count: 13 }, { type: 'beefyenemy', count: 7 }] 
        }
        // Wave 5
        , { 
            enemyHealth_multiplier: 0.8, 
            speedMultiplier: 0.67, 
            spawnInterval: 2, 
            pattern: [{ type: 'beefyenemy', count: 17 }] 
        }
        // Wave 6
        , { 
            enemyHealth_multiplier: 1, 
            speedMultiplier: 0.6, 
            spawnInterval: 1.5, 
            pattern: [{ type: 'knight', count: 1 }] 
        }
        // Wave 7
        , { 
            enemyHealth_multiplier: 2, 
            speedMultiplier: 0.5, 
            spawnInterval: 1.5, 
            pattern: [{ type: 'knight', count: 1 }] 
        }
        ];

        if (wave > 0 && wave <= waveConfigs.length) {
            return waveConfigs[wave - 1];
        }
        
        return null;
    }
}