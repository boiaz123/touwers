import { LevelBase } from '../LevelBase.js';

export class MountainLevel8 extends LevelBase {
    static levelMetadata = {
        name: 'Frozen Fortress',
        difficulty: 'Hard',
        order: 8,
        campaign: 'mountain'
    };

    constructor() {
        super();
        this.levelName = MountainLevel8.levelMetadata.name;
        this.levelNumber = MountainLevel8.levelMetadata.order;
        this.difficulty = MountainLevel8.levelMetadata.difficulty;
        this.campaign = MountainLevel8.levelMetadata.campaign;
        this.maxWaves = 16;
        
        this.setVisualConfig({
            grassColors: {
                top: '#e8e8f0',
                upper: '#d8d8e0',
                lower: '#c8c8d0',
                bottom: '#b8b8c0'
            },
            grassPatchDensity: 12000,
            pathBaseColor: '#a9a9a9',
            edgeBushColor: '#1a3a2a',
            edgeBushAccentColor: '#2a5a4a',
            edgeRockColor: '#6a7a7a',
            edgeGrassColor: '#dcdce0',
            flowerDensity: 80000
        });

        this.terrainElements = [];
        this.waves = [];
    }
}
