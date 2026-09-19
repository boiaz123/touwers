import { BaseEnemy } from './BaseEnemy.js';
import { drawRigFallback } from './rendering/RigCommon.js';
import { createFrogRigSpec, createFrogRigNodes, poseFrog, makeHop } from './rendering/FrogRig.js';

export class FrogEnemy extends BaseEnemy {
    // Rig specs are identical for every frog of the same skin colour at the same size, so
    // they're built once and shared (and EnemyRenderAdapter bakes one texture atlas per spec).
    static _rigSpecs = new Map();

    static BASE_STATS = {
        health: 110,
        speed: 55,
        armour: 10,
        magicResistance: 0.5
    };

    constructor(path, health_multiplier = 1.0, speed = null, armour = null, magicResistance = null) {
        const baseStats = FrogEnemy.BASE_STATS;
        const actualSpeed = speed !== null ? speed : baseStats.speed;
        const actualArmour = armour !== null ? armour : baseStats.armour;
        const actualMagicResistance = magicResistance !== null ? magicResistance : baseStats.magicResistance;

        super(path, baseStats.health * health_multiplier, actualSpeed, actualArmour, actualMagicResistance);
        this.skinColor = this.getRandomSkinColor();
        this.sizeMultiplier = 1.0;

        this.attackDamage = 7;
        this.attackSpeed = 1.0;

        this.magicParticles = [];
        this.particleSpawnCounter = 0;

        // Hop animation (visual only - the frog's actual movement is the constant-speed glide
        // in update()). Every hop is rolled fresh - its own height, duration, lean and leg
        // reach (see FrogRig.makeHop) - and each frog has its own bounciness and tempo, so a
        // crowd of frogs never hops in step and no single frog repeats itself. hopTime runs in
        // "hop seconds" (real time x hopRate) through the current hop's duration.
        this.hopBounce = 0.9 + Math.random() * 0.2;
        this.hopRate = 0.93 + Math.random() * 0.14;
        this.hop = makeHop(null, this.hopBounce);
        this.hopTime = Math.random() * this.hop.T;

        // Part poses for the current frame (see FrogRig.poseFrog); created with the rig spec.
        this.rigNodes = null;

        // Set by EnemyRenderAdapter once it has taken this enemy over via Pixi (hit splatters
        // still draw here regardless - not yet migrated). No static structure - the whole
        // figure hops continuously, so everything lives in the rig.
        this.skipCanvas2DBodyRender = false;
    }

    /** Per-instance skin color variant, so baked atlases don't collide across different-colored instances. */
    getRenderVariantKey() {
        return this.skinColor;
    }

    /**
     * Sprite-rig description of this frog (see RigCommon.js) - EnemyRenderAdapter bakes it into a
     * texture atlas once per skin colour and then just animates sprites, instead of re-tessellating
     * ~100 vector shapes every frame like the old live-Graphics path.
     */
    getRigSpec(baseSize) {
        const key = this.skinColor + ':' + baseSize.toFixed(2);
        let spec = FrogEnemy._rigSpecs.get(key);
        if (!spec) {
            spec = createFrogRigSpec(this.skinColor, baseSize);
            FrogEnemy._rigSpecs.set(key, spec);
        }
        return spec;
    }

    /** Fill this frog's part poses for the current frame and return them (see FrogRig.poseFrog). */
    updateRigPose(baseSize) {
        if (!this.rigNodes) this.rigNodes = createFrogRigNodes(this.getRigSpec(baseSize));
        poseFrog(this.rigNodes, this, baseSize);
        return this.rigNodes;
    }

    getRandomSkinColor() {
        const skinColors = [
            '#2D5016', '#3D6B1F', '#4A7C3E', '#5A8C4E', '#1F3E1F', '#6B9D54'
        ];
        return skinColors[Math.floor(Math.random() * skinColors.length)];
    }

    update(deltaTime) {
        super.update(deltaTime);

        // Reduce particle spawn frequency - spawn every 0.3s instead of 0.15s
        this.particleSpawnCounter += deltaTime;
        if (this.particleSpawnCounter > 0.3) {
            this.spawnMagicParticle();
            this.particleSpawnCounter = 0;
        }

        // Update magic particles (compact-in-place: avoids O(n) splice-shift per removal)
        let magicWriteIdx = 0;
        for (let i = 0; i < this.magicParticles.length; i++) {
            const particle = this.magicParticles[i];
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.life -= deltaTime;
            particle.size = Math.max(0, particle.size * (particle.life / particle.maxLife));
            if (particle.life > 0) {
                this.magicParticles[magicWriteIdx++] = particle;
            }
        }
        this.magicParticles.length = magicWriteIdx;

        // Advance the hop; when one finishes, roll the next (the leftover carries over so the
        // rhythm stays smooth; the cap only guards against a pathological dt)
        this.hopTime += deltaTime * this.hopRate;
        for (let i = 0; i < 4 && this.hopTime >= this.hop.T; i++) {
            this.hopTime -= this.hop.T;
            this.hop = makeHop(this.hop, this.hopBounce);
        }
        if (this.hopTime >= this.hop.T) this.hopTime = 0;

        if (this.reachedEnd || !this.path || this.path.length === 0) return;

        if (this.currentPathIndex >= this.path.length - 1) {
            this.reachedEnd = true;
            return;
        }

        const target = this.getOffsetWaypointAt(this.currentPathIndex + 1) || this.path[this.currentPathIndex + 1];
        if (!target) {
            this.reachedEnd = true;
            return;
        }

        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.hypot(dx, dy);

        const reachThreshold = Math.max(5, this.speed * deltaTime * 2);

        if (distance < reachThreshold) {
            this.currentPathIndex++;
            const snapPos = this.getOffsetWaypointAt(this.currentPathIndex) || this.path[this.currentPathIndex];
            if (snapPos) { this.x = snapPos.x; this.y = snapPos.y; }
            return;
        }

        this.updateFacing(dx);
        const moveDistance = this.speed * deltaTime;
        this.x += (dx / distance) * moveDistance;
        this.y += (dy / distance) * moveDistance;
    }

    attackCastle(castle, deltaTime) {
        if (!this.isAttackingCastle || !castle) return 0;

        this.attackCooldown -= deltaTime;

        if (this.attackCooldown <= 0) {
            const damage = this.attackDamage;
            castle.takeDamage(damage);
            this.attackCooldown = 1.0 / this.attackSpeed;
            return damage;
        }

        return 0;
    }

    spawnMagicParticle() {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 15 + 5;
        // Limit total particles per frog to prevent memory bloat
        if (this.magicParticles.length >= 8) return;

        this.magicParticles.push({
            x: this.x + Math.cos(angle) * radius,
            y: this.y + Math.sin(angle) * radius - 10,
            vx: (Math.random() - 0.5) * 40,
            vy: -Math.random() * 50 - 20,
            life: 1.2,
            maxLife: 1.2,
            size: Math.random() * 2.5 + 1.5,
            colorIndex: Math.floor(Math.random() * 3)
        });
    }

    takeDamage(amount, armorPiercingPercent = 0, damageType = 'physical', followTarget = false) {
        super.takeDamage(amount, armorPiercingPercent, damageType, followTarget);
    }

    isDead() {
        return this.health <= 0;
    }

    render(ctx) {
        // baseSize depends on ctx.canvas.width (real screen resolution) - computed once
        // here, with a real ctx, and cached on the instance so _syncEnemyPixi
        // (GameplayState) can reuse the exact same value for the Pixi path.
        const baseSize = Math.max(6, Math.min(14, ctx.canvas.width / 150)) * this.sizeMultiplier;
        this._lastRenderSize = baseSize;

        if (!this.skipCanvas2DBodyRender) {
            this.renderDynamicParts(ctx, baseSize);
        }

        // Render hit splatters - not yet migrated
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

    /**
     * Canvas2D fallback (only runs while Pixi isn't taking over - e.g. no WebGL, or the brief
     * async-init window): paints the same rig the Pixi path animates, with the same poses.
     * The health bar is drawn here too, as it always was; under Pixi the adapter owns it.
     */
    renderDynamicParts(ctx, baseSize) {
        const spec = this.getRigSpec(baseSize);
        drawRigFallback(ctx, spec, this.updateRigPose(baseSize), this.x, this.y);
        this.renderHealthBar(ctx, baseSize, spec.healthBar);
    }
}
