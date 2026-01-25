import { LevelBase } from '../LevelBase.js';

export class MountainLevel4 extends LevelBase {
    static levelMetadata = {
        name: 'Icy Ridge',
        difficulty: 'Medium',
        order: 4,
        campaign: 'mountain'
    };

    constructor() {
        super();
        this.levelName = MountainLevel4.levelMetadata.name;
        this.levelNumber = MountainLevel4.levelMetadata.order;
        this.difficulty = MountainLevel4.levelMetadata.difficulty;
        this.campaign = MountainLevel4.levelMetadata.campaign;
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
