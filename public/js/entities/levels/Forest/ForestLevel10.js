import { LevelBase } from '../LevelBase.js';

export class ForestLevel10 extends LevelBase {
    static levelMetadata = {
        name: 'Pinewood Forest',
        difficulty: 'Easy',
        order: 10,
        campaign: 'forest'
    };

    constructor() {
        super();
        // Derive instance properties from static metadata
        this.levelName = ForestLevel10.levelMetadata.name;
        this.levelNumber = ForestLevel10.levelMetadata.order;
        this.difficulty = ForestLevel10.levelMetadata.difficulty;
        this.campaign = ForestLevel10.levelMetadata.campaign;
        this.maxWaves = 13;

        // Set terrain elements (prevent tower placement on these areas)
        this.terrainElements = [
            { type: 'water', gridX: 32.00, gridY: 34.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 32.00, gridY: 33.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 32.00, gridY: 32.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 32.00, gridY: 31.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 32.00, gridY: 30.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 32.00, gridY: 29.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 32.00, gridY: 28.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 32.00, gridY: 27.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 32.00, gridY: 26.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 32.00, gridY: 25.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 32.00, gridY: 24.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 32.00, gridY: 24.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 32.00, gridY: 24.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 32.00, gridY: 23.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 32.00, gridY: 22.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 33.00, gridY: 21.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 33.00, gridY: 20.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 33.00, gridY: 19.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 33.00, gridY: 18.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 34.00, gridY: 17.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 34.00, gridY: 17.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 34.00, gridY: 16.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 34.00, gridY: 15.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 35.00, gridY: 14.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 35.00, gridY: 13.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 35.00, gridY: 12.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 36.00, gridY: 11.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 36.00, gridY: 11.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 36.00, gridY: 11.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 36.00, gridY: 10.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 36.00, gridY: 9.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 37.00, gridY: 8.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 37.00, gridY: 7.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 37.00, gridY: 7.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 37.00, gridY: 7.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 37.00, gridY: 6.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 37.00, gridY: 5.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 37.00, gridY: 4.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 37.00, gridY: 3.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 37.00, gridY: 3.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 37.00, gridY: 2.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 37.00, gridY: 1.00, size: 1.5, waterType: 'river' },
            { type: 'water', gridX: 37.00, gridY: 0.00, size: 1.5, waterType: 'river' },
            { type: 'vegetation', gridX: 3.00, gridY: 31.00, size: 1.9408955741650413, variant: 3 },
            { type: 'vegetation', gridX: 2.00, gridY: 28.00, size: 2.1363666977754106, variant: 0 },
            { type: 'vegetation', gridX: 0.00, gridY: 29.00, size: 2.0912632757246996, variant: 0 },
            { type: 'vegetation', gridX: 5.00, gridY: 28.00, size: 3.013274136736813, variant: 3 },
            { type: 'vegetation', gridX: 6.00, gridY: 31.00, size: 3.2782142973112713, variant: 3 },
            { type: 'vegetation', gridX: 1.00, gridY: 32.75, size: 2.9135066574953514, variant: 0 },
            { type: 'vegetation', gridX: 3.00, gridY: 29.00, size: 3.423014264629389, variant: 3 },
            { type: 'vegetation', gridX: 3.00, gridY: 31.00, size: 1.5825179271824872, variant: 0 },
            { type: 'vegetation', gridX: 5.00, gridY: 32.75, size: 2.3259403632811244, variant: 3 },
            { type: 'vegetation', gridX: 7.00, gridY: 24.00, size: 1.535254139774828, variant: 0 },
            { type: 'vegetation', gridX: 3.00, gridY: 22.00, size: 1.6450964881823222, variant: 3 },
            { type: 'vegetation', gridX: 5.00, gridY: 25.00, size: 1.5634489794247064, variant: 3 },
            { type: 'vegetation', gridX: 6.00, gridY: 26.00, size: 2.345875022636566, variant: 3 },
            { type: 'vegetation', gridX: 0.00, gridY: 25.00, size: 1.551579256909967, variant: 0 },
            { type: 'vegetation', gridX: 5.00, gridY: 23.00, size: 2.4227348634352563, variant: 3 },
            { type: 'vegetation', gridX: 0.00, gridY: 20.00, size: 3.4034385199720165, variant: 3 },
            { type: 'vegetation', gridX: 1.00, gridY: 25.00, size: 2.756369269798139, variant: 3 },
            { type: 'vegetation', gridX: 1.00, gridY: 20.00, size: 1.8083802340919632, variant: 3 },
            { type: 'vegetation', gridX: 7.00, gridY: 21.00, size: 2.929954182691401, variant: 0 },
            { type: 'vegetation', gridX: 5.00, gridY: 20.00, size: 2.3898657411640873, variant: 3 },
            { type: 'vegetation', gridX: 2.00, gridY: 20.00, size: 2.618156429146198, variant: 0 },
            { type: 'vegetation', gridX: 6.00, gridY: 15.00, size: 1.8073610119462118, variant: 0 },
            { type: 'vegetation', gridX: 1.00, gridY: 19.00, size: 2.0220325033884663, variant: 0 },
            { type: 'vegetation', gridX: 1.00, gridY: 17.00, size: 1.6698044153814742, variant: 0 },
            { type: 'vegetation', gridX: 1.00, gridY: 16.00, size: 2.1559928323612674, variant: 3 },
            { type: 'vegetation', gridX: 5.00, gridY: 16.00, size: 1.862821241022598, variant: 0 },
            { type: 'vegetation', gridX: 5.00, gridY: 19.00, size: 2.5550159102340313, variant: 0 },
            { type: 'vegetation', gridX: 6.00, gridY: 15.00, size: 3.406270472288986, variant: 0 },
            { type: 'vegetation', gridX: 2.00, gridY: 14.00, size: 2.7944431777808454, variant: 0 },
            { type: 'vegetation', gridX: 5.00, gridY: 9.00, size: 2.9011099333062047, variant: 3 },
            { type: 'vegetation', gridX: 6.00, gridY: 9.00, size: 2.55526308516287, variant: 0 },
            { type: 'vegetation', gridX: 2.00, gridY: 11.00, size: 2.180573295713557, variant: 3 },
            { type: 'vegetation', gridX: 6.00, gridY: 12.00, size: 2.661624887875592, variant: 0 },
            { type: 'vegetation', gridX: 1.00, gridY: 9.00, size: 2.730552139919981, variant: 0 },
            { type: 'vegetation', gridX: 8.00, gridY: 12.00, size: 1.780958579622982, variant: 0 },
            { type: 'vegetation', gridX: 1.00, gridY: 13.00, size: 1.9353503232848073, variant: 3 },
            { type: 'vegetation', gridX: 2.00, gridY: 5.00, size: 2.811932153822749, variant: 3 },
            { type: 'vegetation', gridX: 1.00, gridY: 3.00, size: 3.272332010090407, variant: 3 },
            { type: 'vegetation', gridX: 7.00, gridY: 7.00, size: 3.0801884845367637, variant: 3 },
            { type: 'vegetation', gridX: 3.00, gridY: 2.00, size: 2.311430699082177, variant: 0 },
            { type: 'vegetation', gridX: 5.00, gridY: 8.00, size: 2.563608307864488, variant: 3 },
            { type: 'vegetation', gridX: 3.00, gridY: 3.00, size: 1.7439093889939994, variant: 3 },
            { type: 'vegetation', gridX: 7.00, gridY: 2.00, size: 3.1734757153958375, variant: 3 },
            { type: 'vegetation', gridX: 6.00, gridY: 6.00, size: 2.424129777461394, variant: 0 },
            { type: 'vegetation', gridX: 7.00, gridY: 6.00, size: 3.3198801501248996, variant: 3 },
            { type: 'vegetation', gridX: 8.00, gridY: 3.00, size: 2.4424638618583954, variant: 3 },
            { type: 'vegetation', gridX: 11.00, gridY: 2.00, size: 3.0706701820971696, variant: 3 },
            { type: 'vegetation', gridX: 9.00, gridY: 4.00, size: 1.705751051822916, variant: 0 },
            { type: 'vegetation', gridX: 10.00, gridY: 3.00, size: 2.273198026601049, variant: 0 },
            { type: 'vegetation', gridX: 9.00, gridY: 4.00, size: 2.906509361916905, variant: 3 },
            { type: 'vegetation', gridX: 8.00, gridY: 2.00, size: 2.8411434303773, variant: 3 },
            { type: 'vegetation', gridX: 11.00, gridY: 6.00, size: 2.1344678876483405, variant: 3 },
            { type: 'vegetation', gridX: 13.00, gridY: 7.00, size: 2.7475448828219244, variant: 3 },
            { type: 'vegetation', gridX: 15.00, gridY: 7.00, size: 3.167462739988337, variant: 0 },
            { type: 'vegetation', gridX: 15.00, gridY: 7.00, size: 2.7819016987377925, variant: 0 },
            { type: 'vegetation', gridX: 21.00, gridY: 4.00, size: 3.3191472848354615, variant: 0 },
            { type: 'vegetation', gridX: 18.00, gridY: 5.00, size: 2.1424134676429962, variant: 3 },
            { type: 'vegetation', gridX: 22.00, gridY: 4.00, size: 3.092830476391023, variant: 3 },
            { type: 'vegetation', gridX: 20.00, gridY: 2.00, size: 1.7865587997097268, variant: 0 },
            { type: 'vegetation', gridX: 21.00, gridY: 3.00, size: 2.4968371387992807, variant: 0 },
            { type: 'vegetation', gridX: 20.00, gridY: 3.00, size: 2.019747276758383, variant: 3 },
            { type: 'vegetation', gridX: 26.00, gridY: 5.00, size: 1.7474172424096075, variant: 0 },
            { type: 'vegetation', gridX: 28.00, gridY: 7.00, size: 1.584038725864285, variant: 3 },
            { type: 'vegetation', gridX: 25.00, gridY: 6.00, size: 2.1759934304636666, variant: 0 },
            { type: 'vegetation', gridX: 26.00, gridY: 3.00, size: 2.134657940396507, variant: 0 },
            { type: 'vegetation', gridX: 24.00, gridY: 6.00, size: 2.6369421301816613, variant: 3 },
            { type: 'vegetation', gridX: 31.00, gridY: 6.00, size: 1.6061750197141211, variant: 3 },
            { type: 'vegetation', gridX: 31.00, gridY: 3.00, size: 1.6663559324367438, variant: 3 },
            { type: 'vegetation', gridX: 29.00, gridY: 5.00, size: 3.107457050734152, variant: 3 },
            { type: 'vegetation', gridX: 24.00, gridY: 4.00, size: 2.69584453065713, variant: 3 },
            { type: 'vegetation', gridX: 53.00, gridY: 6.00, size: 2.661574451311462, variant: 0 },
            { type: 'vegetation', gridX: 59.00, gridY: 5.00, size: 3.417667661861315, variant: 3 },
            { type: 'vegetation', gridX: 59.00, gridY: 7.00, size: 3.2861091142027563, variant: 3 },
            { type: 'vegetation', gridX: 53.00, gridY: 5.00, size: 1.680265236791079, variant: 0 },
            { type: 'vegetation', gridX: 59.00, gridY: 6.00, size: 1.8847724327296937, variant: 3 },
            { type: 'vegetation', gridX: 59.00, gridY: 3.00, size: 2.048654422604849, variant: 0 },
            { type: 'vegetation', gridX: 56.00, gridY: 8.00, size: 2.2734511314479526, variant: 0 },
            { type: 'vegetation', gridX: 56.00, gridY: 5.00, size: 1.6243124124978694, variant: 0 },
            { type: 'vegetation', gridX: 53.00, gridY: 14.00, size: 2.2179999533370616, variant: 0 },
            { type: 'vegetation', gridX: 59.00, gridY: 12.00, size: 2.323488211109183, variant: 0 },
            { type: 'vegetation', gridX: 54.00, gridY: 16.00, size: 2.9326411766055527, variant: 3 },
            { type: 'vegetation', gridX: 57.00, gridY: 13.00, size: 3.497500018891943, variant: 3 },
            { type: 'vegetation', gridX: 59.00, gridY: 12.00, size: 2.502547835994242, variant: 0 },
            { type: 'vegetation', gridX: 54.00, gridY: 14.00, size: 2.749500296067851, variant: 0 },
            { type: 'vegetation', gridX: 57.00, gridY: 11.00, size: 2.777663175852908, variant: 0 },
            { type: 'vegetation', gridX: 57.00, gridY: 13.00, size: 2.8838754822071335, variant: 0 },
            { type: 'vegetation', gridX: 54.00, gridY: 13.00, size: 3.1150461464166215, variant: 3 },
            { type: 'vegetation', gridX: 53.00, gridY: 21.00, size: 2.530858340692724, variant: 3 },
            { type: 'vegetation', gridX: 56.00, gridY: 18.00, size: 1.810721892853537, variant: 3 },
            { type: 'vegetation', gridX: 59.00, gridY: 19.00, size: 2.52666093837136, variant: 0 },
            { type: 'vegetation', gridX: 59.00, gridY: 21.00, size: 1.9784090465941535, variant: 3 },
            { type: 'vegetation', gridX: 55.00, gridY: 18.00, size: 2.464665352382889, variant: 3 },
            { type: 'vegetation', gridX: 54.00, gridY: 21.00, size: 3.3113363205882402, variant: 3 },
            { type: 'vegetation', gridX: 56.00, gridY: 15.00, size: 2.1538192760665744, variant: 3 },
            { type: 'vegetation', gridX: 53.00, gridY: 21.00, size: 3.2566237287817046, variant: 3 },
            { type: 'vegetation', gridX: 58.00, gridY: 18.00, size: 2.1114253784143466, variant: 0 },
            { type: 'vegetation', gridX: 58.00, gridY: 26.00, size: 2.418410254674148, variant: 3 },
            { type: 'vegetation', gridX: 59.00, gridY: 28.00, size: 3.015857474765734, variant: 0 },
            { type: 'vegetation', gridX: 53.00, gridY: 22.00, size: 2.0865427186684666, variant: 0 },
            { type: 'vegetation', gridX: 55.00, gridY: 28.00, size: 3.072677741966193, variant: 0 },
            { type: 'vegetation', gridX: 51.00, gridY: 25.00, size: 2.559532762319341, variant: 3 },
            { type: 'vegetation', gridX: 54.00, gridY: 25.00, size: 1.5311071848595852, variant: 3 },
            { type: 'vegetation', gridX: 51.00, gridY: 23.00, size: 1.7318103376382483, variant: 0 },
            { type: 'vegetation', gridX: 59.00, gridY: 27.00, size: 3.211852776363109, variant: 0 },
            { type: 'vegetation', gridX: 53.00, gridY: 26.00, size: 1.791307855187623, variant: 0 },
            { type: 'vegetation', gridX: 56.00, gridY: 32.75, size: 3.251576737089853, variant: 3 },
            { type: 'vegetation', gridX: 53.00, gridY: 32.00, size: 2.6055214996972254, variant: 3 },
            { type: 'vegetation', gridX: 54.00, gridY: 25.00, size: 1.639647599674756, variant: 3 },
            { type: 'vegetation', gridX: 56.00, gridY: 32.00, size: 2.1904635433638164, variant: 0 },
            { type: 'vegetation', gridX: 52.00, gridY: 25.00, size: 3.037503374547641, variant: 0 },
            { type: 'vegetation', gridX: 50.00, gridY: 28.00, size: 2.504167754356097, variant: 3 },
            { type: 'vegetation', gridX: 51.00, gridY: 32.00, size: 2.255122087800024, variant: 3 },
            { type: 'vegetation', gridX: 56.00, gridY: 27.00, size: 1.5332062462656402, variant: 0 },
            { type: 'vegetation', gridX: 52.00, gridY: 30.00, size: 2.2028351875530006, variant: 0 },
            { type: 'vegetation', gridX: 44.00, gridY: 32.75, size: 2.811325878743791, variant: 0 },
            { type: 'vegetation', gridX: 47.00, gridY: 32.75, size: 3.114074735700533, variant: 0 },
            { type: 'vegetation', gridX: 46.00, gridY: 32.00, size: 2.545703342389407, variant: 0 },
            { type: 'vegetation', gridX: 44.00, gridY: 29.00, size: 1.8893120693492698, variant: 0 },
            { type: 'vegetation', gridX: 50.00, gridY: 31.00, size: 1.7858025790186434, variant: 3 },
            { type: 'vegetation', gridX: 46.00, gridY: 32.75, size: 1.5680444434277272, variant: 3 },
            { type: 'vegetation', gridX: 39.00, gridY: 32.75, size: 2.3006084922203023, variant: 0 },
            { type: 'vegetation', gridX: 36.00, gridY: 29.00, size: 2.03459259480271, variant: 3 },
            { type: 'vegetation', gridX: 35.00, gridY: 32.75, size: 3.214284016805097, variant: 0 },
            { type: 'vegetation', gridX: 43.00, gridY: 32.00, size: 3.126066660077697, variant: 0 },
            { type: 'vegetation', gridX: 37.00, gridY: 32.75, size: 3.111675007070481, variant: 3 },
            { type: 'vegetation', gridX: 41.00, gridY: 32.75, size: 2.003012764057556, variant: 3 },
            { type: 'vegetation', gridX: 42.00, gridY: 32.75, size: 2.6465151123781188, variant: 3 },
            { type: 'vegetation', gridX: 38.00, gridY: 32.75, size: 2.149346711955655, variant: 0 },
            { type: 'vegetation', gridX: 6.00, gridY: 32.00, size: 2.1254540694977107, variant: 0 },
            { type: 'vegetation', gridX: 7.00, gridY: 28.00, size: 2.423394627522759, variant: 0 },
            { type: 'vegetation', gridX: 6.00, gridY: 31.00, size: 3.019757872358057, variant: 3 },
            { type: 'vegetation', gridX: 12.00, gridY: 32.75, size: 2.4256974114815386, variant: 0 },
            { type: 'vegetation', gridX: 7.00, gridY: 29.00, size: 1.9020656995375547, variant: 3 },
            { type: 'vegetation', gridX: 8.00, gridY: 32.75, size: 2.1142899145914478, variant: 3 },
            { type: 'vegetation', gridX: 13.00, gridY: 29.00, size: 3.4893571863229105, variant: 3 },
            { type: 'vegetation', gridX: 13.00, gridY: 2.00, size: 3.08495569472045, variant: 3 },
            { type: 'vegetation', gridX: 15.00, gridY: 3.00, size: 2.700522964323139, variant: 0 },
            { type: 'vegetation', gridX: 13.00, gridY: 2.00, size: 2.0945503849840295, variant: 0 },
            { type: 'vegetation', gridX: 57.00, gridY: 0.00, size: 1.5608146874343758, variant: 3 },
            { type: 'vegetation', gridX: 56.00, gridY: 2.00, size: 2.0777748767899835, variant: 3 },
            { type: 'vegetation', gridX: 57.00, gridY: 3.00, size: 3.2466492173858352, variant: 0 },
            { type: 'vegetation', gridX: 34.00, gridY: 3.00, size: 1.572451965175549, variant: 0 },
            { type: 'vegetation', gridX: 33.00, gridY: 3.00, size: 2.8248213754705214, variant: 0 },
            { type: 'vegetation', gridX: 33.00, gridY: 3.00, size: 2.8199150895350824, variant: 3 },
            { type: 'vegetation', gridX: 44.00, gridY: 2.00, size: 3.4161871740081207, variant: 0 },
            { type: 'vegetation', gridX: 45.00, gridY: 1.00, size: 2.247618844900435, variant: 3 },
            { type: 'vegetation', gridX: 44.00, gridY: 3.00, size: 1.529214675527524, variant: 3 },
            { type: 'vegetation', gridX: 52.00, gridY: 3.00, size: 2.602634302542178, variant: 0 },
            { type: 'vegetation', gridX: 51.00, gridY: 3.00, size: 3.4363636947692298, variant: 3 },
            { type: 'vegetation', gridX: 52.00, gridY: 3.00, size: 3.384913064646053, variant: 0 },
            { type: 'rock', gridX: 7.00, gridY: 17.00, size: 2, variant: 0 },
            { type: 'rock', gridX: 18.00, gridY: 2.00, size: 2, variant: 0 },
            { type: 'rock', gridX: 58.00, gridY: 30.00, size: 2, variant: 0 },
            { type: 'rock', gridX: 4.00, gridY: 4.00, size: 2, variant: 1 },
            { type: 'rock', gridX: 11.00, gridY: 33.00, size: 2, variant: 1 },
            { type: 'rock', gridX: 48.00, gridY: 29.00, size: 2, variant: 1 },
            { type: 'rock', gridX: 57.00, gridY: 21.00, size: 2, variant: 1 },
            { type: 'rock', gridX: 55.00, gridY: 4.00, size: 2, variant: 1 },
            { type: 'rock', gridX: 12.00, gridY: 4.00, size: 2, variant: 2 },
            { type: 'rock', gridX: 4.00, gridY: 13.00, size: 2, variant: 2 },
            { type: 'rock', gridX: 58.00, gridY: 5.00, size: 2, variant: 2 },
            { type: 'rock', gridX: 8.00, gridY: 9.00, size: 3, variant: 3 },
            { type: 'rock', gridX: 30.00, gridY: 24.00, size: 4, variant: 1 },
            { type: 'vegetation', gridX: 30.00, gridY: 23.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 33.00, gridY: 25.00, size: 2.5, variant: 3 },
            { type: 'vegetation', gridX: 33.00, gridY: 26.00, size: 2.5, variant: 0 }
        ];
    }

    createMeanderingPath(canvasWidth, canvasHeight) {
        const gridWidth = this.gridWidth || 60;
        const gridHeight = this.gridHeight || 33.75;

        const pathInGridCoords = [
            { gridX: 29.00, gridY: 34.00 },
            { gridX: 29.00, gridY: 26.00 },
            { gridX: 16.00, gridY: 26.00 },
            { gridX: 16.00, gridY: 20.00 },
            { gridX: 42.00, gridY: 20.00 },
            { gridX: 42.00, gridY: 25.00 },
            { gridX: 48.00, gridY: 25.00 },
            { gridX: 48.00, gridY: 12.00 },
            { gridX: 42.00, gridY: 12.00 },
            { gridX: 42.00, gridY: 6.00 }
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
            spawnInterval: 2.5, 
            pattern: [{ type: 'basic', count: 19 }] 
        }
        // Wave 2
        , { 
            enemyHealth_multiplier: 1, 
            speedMultiplier: 1, 
            spawnInterval: 4, 
            pattern: [{ type: 'archer', count: 20 }] 
        }
        // Wave 3
        , { 
            enemyHealth_multiplier: 1.4, 
            speedMultiplier: 0.9, 
            spawnInterval: 1.5, 
            pattern: [{ type: 'villager', count: 9 }, { type: 'basic', count: 8 }, { type: 'archer', count: 5, speedMultiplier: 1.3 }] 
        }
        // Wave 4
        , { 
            enemyHealth_multiplier: 1.1, 
            speedMultiplier: 1, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'villager', count: 11 }, { type: 'basic', count: 13 }, { type: 'archer', count: 8, speedMultiplier: 1.2 }, { type: 'beefyenemy', count: 3, healthMultiplier: 2.4, speedMultiplier: 0.5 }] 
        }
        // Wave 5
        , { 
            enemyHealth_multiplier: 1.5, 
            speedMultiplier: 1.3, 
            spawnInterval: 0.6, 
            pattern: [{ type: 'archer', count: 18 }] 
        }
        // Wave 6
        , { 
            enemyHealth_multiplier: 4, 
            speedMultiplier: 0.8, 
            spawnInterval: 1.3, 
            pattern: [{ type: 'beefyenemy', count: 4 }] 
        }
        // Wave 7
        , { 
            enemyHealth_multiplier: 1.3, 
            speedMultiplier: 1.2, 
            spawnInterval: 0.5, 
            pattern: [{ type: 'villager', count: 28 }] 
        }
        // Wave 8
        , { 
            enemyHealth_multiplier: 1.5, 
            speedMultiplier: 1.2, 
            spawnInterval: 0.9, 
            pattern: [{ type: 'beefyenemy', count: 3, healthMultiplier: 4, speedMultiplier: 0.6 }, { type: 'archer', count: 16 }] 
        }
        // Wave 9
        , { 
            enemyHealth_multiplier: 1.4, 
            speedMultiplier: 1, 
            spawnInterval: 1, 
            pattern: [{ type: 'basic', count: 15 }, { type: 'villager', count: 15 }, { type: 'beefyenemy', count: 4, healthMultiplier: 2, speedMultiplier: 0.6 }] 
        }
        // Wave 10
        , { 
            enemyHealth_multiplier: 2, 
            speedMultiplier: 1, 
            spawnInterval: 0.8, 
            pattern: [{ type: 'beefyenemy', count: 12, healthMultiplier: 5 }, { type: 'villager', count: 1 }, { type: 'archer', count: 1, speedMultiplier: 1.2 }, { type: 'basic', count: 1 }] 
        }
        // Wave 11
        , { 
            enemyHealth_multiplier: 3, 
            speedMultiplier: 1, 
            spawnInterval: 7, 
            pattern: [{ type: 'knight', count: 3 }] 
        }
        // Wave 12
        , { 
            enemyHealth_multiplier: 2, 
            speedMultiplier: 2, 
            spawnInterval: 2.5, 
            pattern: [{ type: 'archer', count: 19 }] 
        }
        // Wave 13
        , { 
            enemyHealth_multiplier: 1.2, 
            speedMultiplier: 1, 
            spawnInterval: 0.7, 
            pattern: [{ type: 'knight', count: 1, healthMultiplier: 5 }, { type: 'villager', count: 14, healthMultiplier: 2.5, speedMultiplier: 1.5 }] 
        }
        ];

        if (wave > 0 && wave <= waveConfigs.length) {
            return waveConfigs[wave - 1];
        }
        
        return null;
    }
}