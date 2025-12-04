import { LevelBase } from '../LevelBase.js';

export class Level5 extends LevelBase {
    constructor() {
        super();
        this.levelName = 'Dragon\'s Lair';
        this.levelNumber = 5;
        this.difficulty = 'Hard';
        console.log('Level5: Initialized');
    }
}
