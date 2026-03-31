import { DefenderBase } from './DefenderBase.js';
import { HitSplatter } from '../effects/HitSplatter.js';

/**
 * CastleDefender - A defender stationed in front of the castle
 * Protects the castle from enemies that would otherwise damage it
 * Has full combat and rendering logic
 */
export class CastleDefender extends DefenderBase {
    constructor(level = 1) {
        super(level);
        this.type = 'castle';
    }

    update(deltaTime, enemies) {
        this.animationTime += deltaTime;
        this.attackCooldown = Math.max(0, this.attackCooldown - deltaTime);
        this.damageFlashTimer = Math.max(0, this.damageFlashTimer - deltaTime);
        this.lastAttackTime += deltaTime;
        
        // OPTIMIZATION: Cache target - only rescan when target is gone
        if (this.attackTarget) {
            if (this.attackTarget.isDead()) {
                this.attackTarget = null;
            } else {
                const dx = this.attackTarget.x - this.x;
                const dy = this.attackTarget.y - this.y;
                if (dx * dx + dy * dy > this.attackRange * this.attackRange) {
                    this.attackTarget = null;
                }
            }
        }
        
        if (!this.attackTarget && enemies && enemies.length > 0) {
            let closestDistSq = this.attackRange * this.attackRange;
            for (let i = 0; i < enemies.length; i++) {
                const enemy = enemies[i];
                if (!enemy.isDead()) {
                    const dx = enemy.x - this.x;
                    const dy = enemy.y - this.y;
                    const distSq = dx * dx + dy * dy;
                    if (distSq < closestDistSq) {
                        closestDistSq = distSq;
                        this.attackTarget = enemy;
                    }
                }
            }
        }
        
        // Attack
        if (this.attackTarget && this.attackCooldown <= 0) {
            this.isAttacking = true;
            this.lastAttackTime = 0;
            const damage = this.getAttackDamage();
            this.attackTarget.takeDamage(damage);
            this.attackCooldown = 1.0 / this.attackSpeed;
        } else {
            if (this.lastAttackTime > 0.5) {
                this.isAttacking = false;
            }
        }
        
        // Update hit splatters - compact in-place
        let splWrite = 0;
        for (let i = 0; i < this.hitSplatters.length; i++) {
            const splatter = this.hitSplatters[i];
            splatter.update(deltaTime);
            if (splatter.life > 0) {
                this.hitSplatters[splWrite++] = splatter;
            }
        }
        this.hitSplatters.length = splWrite;
    }
}
