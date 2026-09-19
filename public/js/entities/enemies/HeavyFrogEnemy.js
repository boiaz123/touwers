import { BaseEnemy } from './BaseEnemy.js';
import { drawArmouredFrog, HEAVY_FROG_WALK_FREQUENCY } from './rendering/ArmouredFrogRenderer.js';

// The frog's own size unit is its baseSize (see render()); every distance below is a multiple of it
// so the reach and formation scale with the screen exactly like the sprite does.
const SMASH_REACH = 3.4;          // how close a tower has to be for him to take a swing at it
const SMASH_DURATION = 1.5;       // seconds of stomping before the tower gives way
const SMASH_STOMPS = 4;           // ground-shaking stomps within that time

// What keeps his smashing unpredictable. Every range is [min, max] seconds, rolled fresh each time.
const SMASH_CHANCE = 0.4;               // odds he takes a swing at a tower he comes across - the first one included
const FIRST_SMASH_DELAY = [1, 5];       // after spawning, before he'll look at any tower
const SMASH_COOLDOWN = [4, 12];         // after wrecking a tower, before he'll look at the next
const SKIP_COOLDOWN = [1, 3];           // after deciding to walk past a tower, before he'll look at another

const randomBetween = ([min, max]) => min + Math.random() * (max - min);

/**
 * The Heavy Frog: a walking, plate-armoured frog escorted by five tiny copies of himself
 * (HeavyFrogMinionEnemy).
 *
 * - SHIELDED: while any of his minions is alive he can't be hurt at all (takeDamage() is a no-op
 *   and towers/defenders skip him as a target - see `isShielded`). Kill the escort first.
 * - TOWER SMASHER: as he walks past towers he may stop and stomp one to pieces, replacing it with a
 *   pile of rubble the player has to clear (RubblePile / TowerManager.destroyTower). Each tower
 *   he comes across is a coin-flip (SMASH_CHANCE) and he rests a random while between smashes, so
 *   it is never simply the first towers on his road. He can only do it three times in his life
 *   (`smashesLeft`).
 *
 * Deliberately has no particle arrays or jump timer, so EnemyRenderAdapter bakes him as Mode A
 * (walk-cycle sprite frames) like WalkingFrogEnemy. The bits that change every frame - the ward
 * around him, the tethers to his minions, the stomp shockwaves and dust - are drawn on the
 * Canvas2D layer in render() instead, the same way BaseEnemy.renderBlockadeProjectile is.
 */
export class HeavyFrogEnemy extends BaseEnemy {
    static BASE_STATS = {
        health: 1200,
        speed: 26,
        armour: 90,
        magicResistance: 0.25
    };

    static MINION_COUNT = 5;
    static MAX_TOWER_SMASHES = 3;

    constructor(path, health_multiplier = 1.0, speed = null, armour = null, magicResistance = null) {
        const baseStats = HeavyFrogEnemy.BASE_STATS;
        super(
            path,
            baseStats.health * health_multiplier,
            speed !== null ? speed : baseStats.speed,
            armour !== null ? armour : baseStats.armour,
            magicResistance !== null ? magicResistance : baseStats.magicResistance
        );

        this.sizeMultiplier = 3.4;
        this.attackDamage = 14;
        this.attackSpeed = 0.9;
        this.lootDropChance = 0.04;

        // Escort. EnemyManager._spawnCompanions() creates the minions from this spec and fills
        // `minions` in (each one's `leader` points back here). healthMultiplier follows this
        // frog's own, so a tougher wave's escort is tougher too.
        this.companions = { type: 'heavyfrogminion', count: HeavyFrogEnemy.MINION_COUNT, healthMultiplier: health_multiplier };
        this.minions = [];
        this.isShielded = false;     // re-derived from `minions` every update()
        this.shieldFlash = 0;        // brief flare when a hit is absorbed

        // Tower smashing. `_towersRef` (the live tower list) and `_towerSmashHandler` (which wrecks
        // the tower and tells the UI) are wired in by GameplayState, same as the Mage's `_towersRef`.
        this.smashesLeft = HeavyFrogEnemy.MAX_TOWER_SMASHES;
        this.smashCooldown = randomBetween(FIRST_SMASH_DELAY);
        this.smashState = null;      // { tower, elapsed, stomps } while a smash is underway
        this._spared = new WeakSet(); // towers he already looked at and let be - he never reconsiders one
        this._towersRef = null;
        this._towerSmashHandler = null;

        // Canvas2D-layer effects (see render()). Named to stay out of EnemyRenderAdapter's
        // PARTICLE_FIELDS, which would push this enemy into the live-redraw Mode B.
        this.dustPuffs = [];
        this.shockwaves = [];

        this.skipCanvas2DBodyRender = false;
    }

    /** Walking cadence (rad/s) - also the Mode-A bake cycle length (see EnemyRenderAdapter._walkFreq). */
    getWalkFrequency() {
        return HEAVY_FROG_WALK_FREQUENCY;
    }

    /** One fixed look, so a single set of baked frames serves every Heavy Frog. */
    getRenderVariantKey() {
        return 'heavy';
    }

    /** A slimmer bar, held closer to his head than EnemyRenderAdapter's default (sized for smaller enemies). */
    getHealthBarLayout() {
        return { widthMul: 2.6, heightMul: 0.2, yOffsetMul: -1.55 };
    }

    /** The frog's baseSize: what render() last drew him at, or the 1920-wide default before the first frame. */
    getUnit() {
        return this._lastRenderSize || Math.max(6, Math.min(14, 1920 / 150)) * this.sizeMultiplier;
    }

    update(deltaTime) {
        this.shieldFlash = Math.max(0, this.shieldFlash - deltaTime * 3);
        this._updateShield();
        this._updateEffects(deltaTime);

        if (this.smashState) {
            this._updateSmash(deltaTime);
            return;
        }

        super.update(deltaTime);
        this._tryStartSmash(deltaTime);
    }

    /** Shielded for exactly as long as any minion still lives. */
    _updateShield() {
        let shielded = false;
        for (let i = 0; i < this.minions.length; i++) {
            if (!this.minions[i].isDead()) { shielded = true; break; }
        }
        this.isShielded = shielded;
    }

    takeDamage(amount, armorPiercingPercent = 0, damageType = 'physical', followTarget = false) {
        // Nothing gets through the escort - not armour-piercing shots, not magic, not burn or poison ticks.
        if (this.isShielded) {
            this.shieldFlash = 1;
            return;
        }
        super.takeDamage(amount, armorPiercingPercent, damageType, followTarget);
    }

    // ---- Tower smashing ------------------------------------------------------------------

    _tryStartSmash(deltaTime) {
        if (this.smashesLeft <= 0 || !this._towersRef || !this._towerSmashHandler) return;
        if (this.freezeTimer > 0) return; // frozen solid (Frost Nova) - no stomping either
        this.smashCooldown -= deltaTime;
        if (this.smashCooldown > 0) return;
        // At the castle or locked in with a defender he has other business
        if (this.reachedEnd || this.isAttackingDefender) return;

        const reach = this.getUnit() * SMASH_REACH;
        const reachSq = reach * reach;
        const towers = this._towersRef;
        // Any tower in reach he hasn't already passed over is equally likely to catch his eye
        // (reservoir sampling: the n-th candidate takes over with odds 1/n, so no list is built each frame)
        let target = null;
        let candidates = 0;
        for (let i = 0; i < towers.length; i++) {
            const tower = towers[i];
            if (tower.type === 'guard-post' || tower.isRubble || this._spared.has(tower)) continue;
            const dx = tower.x - this.x;
            const dy = tower.y - this.y;
            if (dx * dx + dy * dy >= reachSq) continue;
            if (Math.random() * ++candidates < 1) target = tower;
        }
        if (!target) return;

        // Looked at once: it's either smashed, or he walks on and never reconsiders it. The breather
        // after a skip keeps a cluster of towers from all being rolled for in the same instant.
        if (Math.random() >= SMASH_CHANCE) {
            this._spared.add(target);
            this.smashCooldown = randomBetween(SKIP_COOLDOWN);
            return;
        }

        this.smashState = { tower: target, elapsed: 0, stomps: 0 };
    }

    _updateSmash(deltaTime) {
        const smash = this.smashState;
        // A freeze (Frost Nova) holds the stomp exactly where it is until it thaws
        if (this.freezeTimer > 0) return;
        // He plants his feet but keeps marching on the spot - the walk cycle is his stomp
        this.animationTime += deltaTime;
        this.attackCooldown = Math.max(0, this.attackCooldown - deltaTime);
        smash.elapsed += deltaTime;

        // Sold (or otherwise gone) while he was winding up: he lost his chance, but it doesn't count
        if (!this._towersRef.includes(smash.tower)) {
            this.smashState = null;
            this.smashCooldown = 1;
            return;
        }

        const stompInterval = SMASH_DURATION / SMASH_STOMPS;
        while (smash.stomps < SMASH_STOMPS && smash.elapsed >= (smash.stomps + 1) * stompInterval * 0.999) {
            smash.stomps++;
            this._emitStomp(smash.tower);
        }

        if (smash.elapsed >= SMASH_DURATION) {
            this.smashState = null;
            this.smashesLeft--;
            this.smashCooldown = randomBetween(SMASH_COOLDOWN);
            this._towerSmashHandler(smash.tower);
        }
    }

    /** One stomp: a shockwave rolling out from his feet and dust kicked up at both his feet and the tower's base. */
    _emitStomp(tower) {
        const u = this.getUnit();
        this.shockwaves.push({ x: this.x, y: this.y + u * 0.62, age: 0, life: 0.7 });
        for (let i = 0; i < 5; i++) {
            this.dustPuffs.push(this._dust(this.x + (Math.random() - 0.5) * u, this.y + u * 0.6, u));
        }
        for (let i = 0; i < 4; i++) {
            this.dustPuffs.push(this._dust(tower.x + (Math.random() - 0.5) * u * 0.9, tower.y + u * 0.45, u));
        }
    }

    _dust(x, y, u) {
        const life = 0.7 + Math.random() * 0.5;
        return {
            x, y,
            vx: (Math.random() - 0.5) * u * 0.9,
            vy: -u * (0.25 + Math.random() * 0.5),
            life, maxLife: life,
            size: u * (0.1 + Math.random() * 0.12)
        };
    }

    _updateEffects(deltaTime) {
        let w = 0;
        for (let i = 0; i < this.shockwaves.length; i++) {
            const s = this.shockwaves[i];
            s.age += deltaTime;
            if (s.age < s.life) this.shockwaves[w++] = s;
        }
        this.shockwaves.length = w;

        w = 0;
        for (let i = 0; i < this.dustPuffs.length; i++) {
            const p = this.dustPuffs[i];
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.vx *= 1 - Math.min(1, deltaTime * 2);
            p.vy *= 1 - Math.min(1, deltaTime * 2);
            p.life -= deltaTime;
            if (p.life > 0) this.dustPuffs[w++] = p;
        }
        this.dustPuffs.length = w;
    }

    // ---- Rendering -----------------------------------------------------------------------

    render(ctx) {
        // baseSize depends on ctx.canvas.width (real screen resolution) - computed once here,
        // with a real ctx, and cached so _syncEnemyPixi can reuse the exact same value.
        const baseSize = Math.max(6, Math.min(14, ctx.canvas.width / 150)) * this.sizeMultiplier;
        this._lastRenderSize = baseSize;

        if (!this.skipCanvas2DBodyRender) {
            this.renderDynamicParts(ctx, baseSize);
        }

        this._renderOverlays(ctx, baseSize);

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
            this.renderHealthBar(ctx, baseSize, { widthMul: 2.9, heightMul: 0.36, yOffsetMul: -1.7 });
        }
    }

    /** Everything that changes every frame, drawn in world space on the Canvas2D layer above Pixi. */
    _renderOverlays(ctx, u) {
        const now = this.animationTime;

        // Stomp shockwaves: flat rings rolling out along the ground from his feet
        for (let i = 0; i < this.shockwaves.length; i++) {
            const s = this.shockwaves[i];
            const t = s.age / s.life;
            ctx.strokeStyle = `rgba(230, 210, 170, ${0.55 * (1 - t)})`;
            ctx.lineWidth = Math.max(1, u * 0.06 * (1 - t));
            ctx.beginPath();
            ctx.ellipse(s.x, s.y, u * (0.4 + t * 2.2), u * (0.4 + t * 2.2) * 0.35, 0, 0, Math.PI * 2);
            ctx.stroke();
        }

        // The ward: a golden bubble while the escort lives, flaring when it absorbs a hit
        if (this.isShielded || this.shieldFlash > 0) {
            const pulse = 0.6 + 0.4 * Math.sin(now * 4);
            const flare = this.shieldFlash;
            const cy = this.y - u * 0.3;
            const rx = u * (0.95 + flare * 0.1);
            const ry = u * (1.2 + flare * 0.1);

            if (this.isShielded) {
                // Tethers: a faint line from him to each living minion, so it's clear who's holding the ward up
                ctx.strokeStyle = `rgba(255, 214, 120, ${0.22 + 0.1 * pulse})`;
                ctx.lineWidth = 1;
                for (let i = 0; i < this.minions.length; i++) {
                    const m = this.minions[i];
                    if (m.isDead()) continue;
                    ctx.beginPath();
                    ctx.moveTo(this.x, cy);
                    ctx.lineTo(m.x, m.y - u * 0.15);
                    ctx.stroke();
                }
            }

            ctx.fillStyle = `rgba(255, 200, 90, ${(this.isShielded ? 0.09 + 0.05 * pulse : 0) + flare * 0.25})`;
            ctx.beginPath();
            ctx.ellipse(this.x, cy, rx, ry, 0, 0, Math.PI * 2);
            ctx.fill();
            if (this.isShielded) {
                ctx.strokeStyle = `rgba(255, 220, 130, ${0.5 + 0.3 * pulse + flare * 0.2})`;
                ctx.lineWidth = 1.4 + flare * 2;
                ctx.beginPath();
                ctx.ellipse(this.x, cy, rx, ry, 0, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        // Dust
        for (let i = 0; i < this.dustPuffs.length; i++) {
            const p = this.dustPuffs[i];
            const t = p.life / p.maxLife;
            ctx.fillStyle = `rgba(190, 170, 135, ${0.5 * t})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (1.6 - 0.6 * t), 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
