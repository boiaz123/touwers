import { LevelBase } from '../LevelBase.js';

export class MountainLevel5 extends LevelBase {
    static levelMetadata = {
        name: 'Blizzard Pass',
        difficulty: 'Medium',
        order: 5,
        campaign: 'mountain'
    };

    constructor() {
        super();
        this.levelName = MountainLevel5.levelMetadata.name;
        this.levelNumber = MountainLevel5.levelMetadata.order;
        this.difficulty = MountainLevel5.levelMetadata.difficulty;
        this.campaign = MountainLevel5.levelMetadata.campaign;
        this.maxWaves = 14;
        
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
