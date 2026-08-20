import { BasicTower } from './BasicTower.js';

/**
 * Transformed Watch Tower - same rocks, same defenders, three times the throws.
 * The tripled fire rate is the entire mechanic: Tower.update()'s cooldown-driven
 * shoot loop already fires as fast as `1 / this.fireRate` allows, so tripling
 * fireRate here is all that's needed - BasicTower's shoot()/defender-animation
 * logic is reused completely unmodified.
 */
export class SlingerTower extends BasicTower {
    constructor(x, y, gridX, gridY) {
        super(x, y, gridX, gridY);
        this.fireRate = this.fireRate * 3;
    }

    renderDynamicParts(ctx, gridSize) {
        super.renderDynamicParts(ctx, gridSize);
        this.renderTransformBadge(ctx, gridSize, { color: '#FFD700', symbol: 'burst' });
    }

    static getInfo() {
        return {
            name: 'Slinger Tower',
            description: 'Forge-tempered slings let every defender throw three times as fast.',
            cost: 200,
            icon: ''
        };
    }
}
