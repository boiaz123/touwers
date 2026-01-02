import { LevelBase } from '../LevelBase.js';

export class SandboxLevel extends LevelBase {
    static levelId = 'sandbox';
    static levelMetadata = {
        name: 'Sandbox Mode',
        difficulty: 'Endless',
        order: 999
    };
    
    constructor() {
        super();
        // Derive instance properties from static metadata
        this.levelName = SandboxLevel.levelMetadata.name;
        this.levelNumber = SandboxLevel.levelMetadata.order;
        this.difficulty = SandboxLevel.levelMetadata.difficulty;
        this.isSandbox = true;
        
        // Customize visuals for sandbox - bright and vibrant
        this.setVisualConfig({
            grassColors: {
                top: '#2a2a3a',
                upper: '#3a3a4a',
                lower: '#4a4a5a',
                bottom: '#1a1a2a'
            },
            grassPatchDensity: 12000,
            grassPatchSizeMin: 4,
            grassPatchSizeMax: 12,
            dirtPatchCount: 20,
            dirtPatchAlpha: 0.25,
            flowerDensity: 50000,
            pathBaseColor: '#6b6b5b',
            pathEdgeVegetationChance: 0.6,
            edgeBushColor: '#0f3f0f',
            edgeRockColor: '#666666',
            edgeGrassColor: '#1a6a1a'
        });
        
    }
}

export const levelMetadata = SandboxLevel.levelMetadata;
