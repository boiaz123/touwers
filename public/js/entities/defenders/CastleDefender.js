import { DefenderBase } from './DefenderBase.js';

/**
 * CastleDefender - A defender stationed in front of the castle
 * Protects the castle from enemies that would otherwise damage it
 */
export class CastleDefender extends DefenderBase {
    constructor(level = 1) {
        super(level);
        this.type = 'castle';
    }
}
