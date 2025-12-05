import { LevelBase } from '../LevelBase.js';

export class SandboxLevel extends LevelBase {
    constructor() {
        super();
        this.levelName = 'Sandbox Mode';
        this.levelNumber = 0;
        this.difficulty = 'Endless';
        this.isSandbox = true;
        
        // Customize visuals for sandbox - bright and vibrant
        this.setVisualConfig({
            grassColors: {
                top: '#5a7a5a',
                upper: '#6a8a6a',
                lower: '#7a9a7a',
                bottom: '#4a6a4a'
            },
            grassPatchDensity: 6000,
            grassPatchSizeMin: 8,
            grassPatchSizeMax: 20,
            dirtPatchCount: 6,
            flowerDensity: 15000,
            pathBaseColor: '#a0956b',
            edgeBushColor: '#2a7a2a',
            edgeBushAccentColor: '#3aaa3a',
            edgeGrassColor: '#2a9a2a'
        });
        
        console.log('SandboxLevel: Initialized');
    }
}
