import { LevelBase } from '../LevelBase.js';

export class SandboxLevel extends LevelBase {
    constructor() {
        super();
        this.levelName = 'Sandbox Mode';
        this.levelNumber = 0;
        this.difficulty = 'Endless';
        this.isSandbox = true;
        console.log('SandboxLevel: Initialized');
    }
}
