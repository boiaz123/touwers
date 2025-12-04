import { LevelBase } from '../LevelBase.js';

export class Level3 extends LevelBase {
    constructor() {
        super();
        this.levelName = 'Mountain Pass';
        this.levelNumber = 3;
        this.difficulty = 'Medium';
        console.log('Level3: Initialized');
    }
}
