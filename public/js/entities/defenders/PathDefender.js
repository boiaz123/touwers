import { DefenderBase } from './DefenderBase.js';

/**
 * PathDefender - A defender stationed on a specific point on the path
 * Spawned by GuardPost towers to block enemies at that location
 * 
 * Key differences from CastleDefender:
 * - Stationed at a fixed waypoint on the path (not in front of castle)
 * - Freezes enemies continuously while alive and in range
 * - Enemies engage when they reach the waypoint
 * - Simple rendering without complex animations
 */
export class PathDefender extends DefenderBase {
    constructor(level = 1) {
        super(level);
        this.type = 'path';
        
        // The waypoint on the path where this defender is stationed
        // Set by GuardPost when defender is hired
        this.stationedWaypoint = null;
    }

    /**
     * Update the defender's behavior
     * Freezes enemies in range and attacks the closest one
     */
    update(deltaTime, enemies) {
        this.animationTime += deltaTime;
        this.attackCooldown = Math.max(0, this.attackCooldown - deltaTime);
        this.damageFlashTimer = Math.max(0, this.damageFlashTimer - deltaTime);
        this.lastAttackTime += deltaTime;
        
        // Only act if defender is alive
        if (this.isDead()) {
            return;
        }
        
        // OPTIMIZATION: Cache target - only rescan when target is gone/out of range
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
        
        // Attack closest enemy if ready
        if (this.attackTarget && this.attackCooldown <= 0) {
            this.isAttacking = true;
            this.lastAttackTime = 0;
            const damage = this.getAttackDamage();
            this.attackTarget.takeDamage(damage);
            this.attackCooldown = 1.0 / this.attackSpeed;
        } else {
            // Stop attacking animation after 0.5 seconds
            if (this.lastAttackTime > 0.5) {
                this.isAttacking = false;
            }
        }
        
        // Update visual effects (hit splatters) - compact in-place
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
