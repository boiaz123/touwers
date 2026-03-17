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
        
        // ATTACK: Find closest enemy and attack
        this.attackTarget = null;
        let closestDistance = this.attackRange;
        
        if (enemies && enemies.length > 0) {
            enemies.forEach(enemy => {
                if (!enemy.isDead()) {
                    const distance = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        this.attackTarget = enemy;
                    }
                }
            });
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
        
        // Update visual effects (hit splatters)
        this.hitSplatters = this.hitSplatters.filter(splatter => {
            splatter.update(deltaTime);
            return splatter.life > 0;
        });
    }
}
