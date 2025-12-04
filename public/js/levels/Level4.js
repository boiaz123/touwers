import { LevelBase } from '../LevelBase.js';

export class Level4 extends LevelBase {
    constructor() {
        super();
        this.levelName = 'River Crossing';
        this.levelNumber = 4;
        this.difficulty = 'Medium';
        console.log('Level4: Initialized');
    }
}
