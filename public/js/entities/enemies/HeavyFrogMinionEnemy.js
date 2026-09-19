import { BaseEnemy } from './BaseEnemy.js';
import { drawArmouredFrog, HEAVY_FROG_WALK_FREQUENCY } from './rendering/ArmouredFrogRenderer.js';

// Where each of the five escorts stands around the Heavy Frog, in his own size units (his baseSize):
// two at his flanks, two a step behind him, one in front. The ground is drawn in perspective, so the
// ring is squashed (y offsets are smaller than x offsets), and Pixi's Y-sorting puts the back pair
// behind him and the front one ahead of him with no extra work.
const FORMATION = [
    { x: -1.05, y: 0.05 },
    { x: 1.05, y: 0.05 },
    { x: -0.6, y: -0.5 },
    { x: 0.6, y: -0.5 },
    { x: 0, y: 0.62 }
];

/**
 * One of the Heavy Frog's five escorts: the same armoured frog, tiny. While the big frog lives it
 * simply walks in formation around him (its position is his position plus a fixed offset, so the
 * group can't string out however the towers slow them); killing all five is what drops his ward.
 * If the big frog dies first by some other means it carries on down the road on its own.
 *
 * Yields no loot and no Workshop token (they're a mechanic, not a drop), just a little gold.
 */
export class HeavyFrogMinionEnemy extends BaseEnemy {
    static BASE_STATS = {
        health: 90,
        speed: 26,
        armour: 6,
        magicResistance: 0.1
    };

    constructor(path, health_multiplier = 1.0, speed = null, armour = null, magicResistance = null) {
        const baseStats = HeavyFrogMinionEnemy.BASE_STATS;
        super(
            path,
            baseStats.health * health_multiplier,
            speed !== null ? speed : baseStats.speed,
            armour !== null ? armour : baseStats.armour,
            magicResistance !== null ? magicResistance : baseStats.magicResistance
        );

        this.sizeMultiplier = 1.15;
        this.attackDamage = 2;
        this.attackSpeed = 1.0;
        this.lootDropChance = 0;
        this.rareLootDropChance = 0;

        this.leader = null;          // the HeavyFrogEnemy this one escorts (set by EnemyManager._spawnCompanions)
        this.formationSlot = 0;      // index into FORMATION

        // Five of these stand shoulder to shoulder around the big frog: a full bar over each would paper
        // over him, so a minion's bar only appears once it's been hurt (see EnemyRenderAdapter._syncModeA).
        this.hideFullHealthBar = true;

        this.skipCanvas2DBodyRender = false;
    }

    getHealthBarLayout() {
        return { widthMul: 2.6, heightMul: 0.3, yOffsetMul: -1.5 };
    }

    getWalkFrequency() {
        return HEAVY_FROG_WALK_FREQUENCY;
    }

    /** Baked under its own class name, so these small frames never mix with the big frog's. */
    getRenderVariantKey() {
        return 'heavy-minion';
    }

    update(deltaTime) {
        const leader = this.leader;
        if (!leader || leader.isDead()) {
            // No one left to escort: walk the road like any other enemy
            super.update(deltaTime);
            return;
        }

        this.animationTime += deltaTime;
        this.attackCooldown = Math.max(0, this.attackCooldown - deltaTime);

        // Hold formation around the leader
        const slot = FORMATION[this.formationSlot % FORMATION.length];
        const u = leader.getUnit();
        this.x = leader.x + slot.x * u;
        this.y = leader.y + slot.y * u;
        this.currentPathIndex = leader.currentPathIndex; // so it can pick the road up seamlessly if he falls
        this.facingLeft = leader.facingLeft;

        // Once he reaches the castle the escort joins the assault. A halt at a guard post's defender
        // is different: he fights it alone while they hold position (and the defenders can cut them down).
        if (leader.reachedEnd && leader.isAttackingCastle) {
            this.reachedEnd = true;
            this.isAttackingCastle = true;
        } else if (!this.isAttackingDefender) {
            this.reachedEnd = false;
            this.isAttackingCastle = false;
        }
    }

    render(ctx) {
        const baseSize = Math.max(6, Math.min(14, ctx.canvas.width / 150)) * this.sizeMultiplier;
        this._lastRenderSize = baseSize;

        if (!this.skipCanvas2DBodyRender) {
            this.renderDynamicParts(ctx, baseSize);
        }

        for (let i = 0; i < this.hitSplatters.length; i++) {
            this.hitSplatters[i].render(ctx);
        }
    }

    /** No static structure for this enemy - present for EnemyRenderAdapter's uniform convention. */
    renderStaticBack(ctx, size) {
        // intentionally empty
    }

    /** No static structure for this enemy - present for EnemyRenderAdapter's uniform convention. */
    renderStaticFront(ctx, size) {
        // intentionally empty
    }

    /** Strategy A (baked): the pose is a pure function of animationTime/phaseOffset. */
    renderDynamicParts(ctx, baseSize) {
        ctx.save();
        ctx.translate(this.x, this.y);
        drawArmouredFrog(ctx, baseSize, this.animationTime, this.animationPhaseOffset);
        ctx.restore();

        // Health bar - skipped during Mode A baking (the adapter draws it separately)
        if (!this._baking) {
            this.renderHealthBar(ctx, baseSize, { widthMul: 2.6, heightMul: 0.3, yOffsetMul: -1.5 });
        }
    }
}
