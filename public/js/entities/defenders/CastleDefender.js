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
        
        // Find target
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
        
        // Update hit splatters
        this.hitSplatters = this.hitSplatters.filter(splatter => {
            splatter.update(deltaTime);
            return splatter.life > 0;
        });
    }
}
