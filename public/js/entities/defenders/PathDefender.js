import { DefenderBase } from './DefenderBase.js';

/**
 * PathDefender - A defender stationed on the path
 * Hired through guard posts to defend specific waypoints
 */
export class PathDefender extends DefenderBase {
    constructor(level = 1) {
        super(level);
        this.type = 'path';
    }
}
