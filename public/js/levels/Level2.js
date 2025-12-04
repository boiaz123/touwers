import { LevelBase } from '../LevelBase.js';

export class Level2 extends LevelBase {
    constructor() {
        super();
        this.levelName = 'Forest Path';
        this.levelNumber = 2;
        this.difficulty = 'Easy';
        console.log('Level2: Initialized');
    }
}
