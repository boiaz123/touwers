import { Level1 } from '../entities/levels/Level1.js';
import { Level2 } from '../entities/levels/Level2.js';
import { Level3 } from '../entities/levels/Level3.js';
import { Level4 } from '../entities/levels/Level4.js';
import { Level5 } from '../entities/levels/Level5.js';
import { SandboxLevel } from '../entities/levels/SandboxLevel.js';

export class LevelFactory {
    static async createLevel(levelType) {
        console.log(`LevelFactory: Creating level of type: ${levelType}`);
        
        try {
            let level;
            
            switch(levelType) {
                case 'level1':
                    level = new Level1();
                    break;
                case 'level2':
                    level = new Level2();
                    break;
                case 'level3':
                    level = new Level3();
                    break;
                case 'level4':
                    level = new Level4();
                    break;
                case 'level5':
                    level = new Level5();
                    break;
                case 'sandbox':
                    level = new SandboxLevel();
                    break;
                default:
                    throw new Error(`Unknown level type: ${levelType}`);
            }
            
            console.log(`LevelFactory: Successfully created ${level.constructor.name}`);
            return level;
        } catch (error) {
            console.error(`LevelFactory: Error creating level:`, error);
            throw error;
        }
    }
    
    static getLevelList() {
        return [
            { id: 'level1', name: 'The King\'s Road', difficulty: 'Easy', unlocked: true, type: 'campaign' },
            { id: 'level2', name: 'Braab\'s Path', difficulty: 'Easy', unlocked: true, type: 'campaign' },
            { id: 'level3', name: 'Crazy Frogs', difficulty: 'Medium', unlocked: true, type: 'campaign' },
            { id: 'level4', name: 'Dave\'s cave', difficulty: 'Medium', unlocked: true, type: 'campaign' },
            { id: 'level5', name: 'Placeholder', difficulty: 'Hard', unlocked: false, type: 'campaign' },
            { id: 'sandbox', name: 'Sandbox Mode', difficulty: 'Endless', unlocked: true, type: 'sandbox' }
        ];
    }
}
