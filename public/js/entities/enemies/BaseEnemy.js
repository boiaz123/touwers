import { HitSplatter } from '../effects/HitSplatter.js';

export class BaseEnemy {
    constructor(path, health, speed, armour, magicResistance) {
        this.path = path;
        this.health = health;
        this.maxHealth = health;
        this.speed = speed;
        this.armour = armour;
        this.magicResistance = magicResistance;
        this.type = null; // Will be set by EnemyRegistry when creating
        this.goldReward = Math.ceil(this.maxHealth / 10); // Gold reward based on health
        this.lootDropChance = 0.1; // 1% chance to drop normal loot on death (0-1)
        this.rareLootDropChance = 0.025; // 0.25% chance to drop rare loot on death (0-1)
        this.currentPathIndex = 0;
        this.x = path && path.length > 0 ? path[0].x : 0;
        this.y = path && path.length > 0 ? path[0].y : 0;
        this.reachedEnd = false;
        
        // Path defenders (guard post defenders on the path)
        this.pathDefenders = [];
        
        // Guard post cache for dynamic waypoint detection
        this.guardPostCache = null;
        
        // Attack properties - constant across all resolutions
        this.attackDamage = 5;
        this.attackSpeed = 1.0;
        this.attackCooldown = 0;
        this.attackRange = 30;
        this.isAttackingCastle = false;
        
        // Defender combat properties
        this.isAttackingDefender = false;
        this.defenderTarget = null;
        
        // Animation properties
        this.animationTime = 0;
        // Random animation phase offset (0 to 2π) to desynchronize enemy animations
        this.animationPhaseOffset = Math.random() * Math.PI * 2;
        
        // Path spreading: fixed random lateral offset so each enemy walks at a unique
        // perpendicular distance from the path centre line (±16 px, well within path bounds)
        this.pathOffsetAmount = (Math.random() - 0.5) * 32;

        // Apply offset to spawn position using the direction of the first path segment
        if (path && path.length >= 2) {
            const spawnDx = path[1].x - path[0].x;
            const spawnDy = path[1].y - path[0].y;
            const spawnLen = Math.hypot(spawnDx, spawnDy);
            if (spawnLen > 0) {
                this.x += (-spawnDy / spawnLen) * this.pathOffsetAmount;
                this.y += (spawnDx / spawnLen) * this.pathOffsetAmount;
            }
        }

        // Hit splatter effects
        this.hitSplatters = [];
    }
    
    updatePath(newPath) {
        if (!newPath || newPath.length === 0) {
            console.warn(`${this.constructor.name}: Received invalid path`);
            return;
        }
        
        const oldPath = this.path;
        this.path = newPath;
        
        if (oldPath && oldPath.length > 0 && this.currentPathIndex < oldPath.length) {
            const totalOldSegments = oldPath.length - 1;
            const progressRatio = this.currentPathIndex / Math.max(1, totalOldSegments);
            
            const totalNewSegments = this.path.length - 1;
            this.currentPathIndex = Math.floor(progressRatio * totalNewSegments);
            this.currentPathIndex = Math.max(0, Math.min(this.currentPathIndex, this.path.length - 2));
            
            if (this.currentPathIndex < this.path.length) {
                this.x = this.path[this.currentPathIndex].x;
                this.y = this.path[this.currentPathIndex].y;
            }
        } else {
            this.currentPathIndex = 0;
            this.x = this.path[0].x;
            this.y = this.path[0].y;
        }
        
    }
    
    update(deltaTime) {
        this.animationTime += deltaTime;
        this.attackCooldown = Math.max(0, this.attackCooldown - deltaTime);
        
        // NOTE: Hit splatters are now managed by EnemyManager to avoid double-updating
        // They are updated once per frame in EnemyManager.update() for all splatters
        
        // Don't move if attacking a defender (path or castle)
        if (this.isAttackingDefender) {
            return;
        }
        
        if (this.reachedEnd || !this.path || this.path.length === 0) return;
        
        // PATH DEFENDER LOGIC: Check if there's a path defender ahead blocking the path
        // If so, engage with the defender instead of continuing to the castle
        if (this.guardPostCache && this.guardPostCache.length > 0) {
            // Check if any guard post defender is directly ahead and alive
            for (let cache of this.guardPostCache) {
                if (!cache.defender.isDead() && cache.waypoint) {
                    const distanceToWaypoint = Math.hypot(
                        cache.waypoint.x - this.x,
                        cache.waypoint.y - this.y
                    );
                    
                    // If we're close to a path defender, stop moving and prepare to engage
                    if (distanceToWaypoint < 60) {
                        this.reachedEnd = true;
                        this.isAttackingCastle = false;
                        // Will be attacked by defender in GameplayState combat handling
                        return;
                    }
                }
            }
        }
        
        // NORMAL PATH FOLLOWING: Continue to castle if no guard post blocks the way
        if (this.currentPathIndex >= this.path.length - 1) {
            this.reachedEnd = true;
            this.isAttackingCastle = true;
            return;
        }
        
        const target = this.getOffsetWaypointAt(this.currentPathIndex + 1);
        if (!target) {
            this.reachedEnd = true;
            this.isAttackingCastle = true;
            return;
        }
        
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.hypot(dx, dy);
        
        const reachThreshold = Math.max(5, this.speed * deltaTime * 2);
        
        if (distance < reachThreshold) {
            this.currentPathIndex++;
            const snapPos = this.getOffsetWaypointAt(this.currentPathIndex);
            if (snapPos) {
                this.x = snapPos.x;
                this.y = snapPos.y;
            }
            return;
        }
        
        const moveDistance = this.speed * deltaTime;
        this.x += (dx / distance) * moveDistance;
        this.y += (dy / distance) * moveDistance;
    }
    
    /**
     * Returns the laterally-offset position for a given path waypoint index.
     * Each enemy has a fixed pathOffsetAmount so they consistently spread
     * across the path width without converging on the centre line.
     */
    getOffsetWaypointAt(index) {
        if (!this.path || index < 0 || index >= this.path.length) return null;
        const wp = this.path[index];
        if (this.pathOffsetAmount === 0) return wp;

        // Use the incoming segment direction to compute the perpendicular
        if (index === 0) {
            if (this.path.length < 2) return wp;
            const next = this.path[1];
            const dx = next.x - wp.x;
            const dy = next.y - wp.y;
            const len = Math.hypot(dx, dy);
            if (len === 0) return wp;
            return { x: wp.x + (-dy / len) * this.pathOffsetAmount, y: wp.y + (dx / len) * this.pathOffsetAmount };
        }

        const prev = this.path[index - 1];
        const dx = wp.x - prev.x;
        const dy = wp.y - prev.y;
        const len = Math.hypot(dx, dy);
        if (len === 0) return wp;
        return { x: wp.x + (-dy / len) * this.pathOffsetAmount, y: wp.y + (dx / len) * this.pathOffsetAmount };
    }
    
    /**
     * Check if enemy should engage with a defender instead of castle
     * Returns true if defender is in range and not dead
     */
    checkDefenderTarget(defender) {
        if (!defender || defender.isDead()) {
            this.isAttackingDefender = false;
            this.defenderTarget = null;
            return false;
        }
        
        // Check if defender is in range - works for both castle defenders and guard post defenders
        const distance = Math.hypot(defender.x - this.x, defender.y - this.y);
        if (distance < this.attackRange * 1.5) { // Slightly larger range for defender
            this.isAttackingDefender = true;
            this.defenderTarget = defender;
            return true;
        }
        
        return false;
    }
    
    /**
     * Attack defender instead of castle
     */
    attackDefender(defender, deltaTime) {
        if (!this.isAttackingDefender || !defender) return 0;
        
        this.attackCooldown -= deltaTime;
        
        if (this.attackCooldown <= 0) {
            const damage = this.attackDamage;
            defender.takeDamage(damage);
            this.attackCooldown = 1.0 / this.attackSpeed;
            return damage;
        }
        
        return 0;
    }
    
    takeDamage(amount, armorPiercingPercent = 0, damageType = 'physical', followTarget = false) {
        let finalDamage = amount;
        
        // Apply armor reduction for physical damage types
        if (damageType === 'physical' && this.armour > 0) {
            // Armor pierce percentage reduces the effective armor (0-100%)
            // armorPiercingPercent = 0 means no piercing, 100 means completely ignore armor
            const piercePercent = Math.max(0, Math.min(100, armorPiercingPercent)) / 100;
            const effectiveArmor = this.armour * (1 - piercePercent);
            
            // Armor reduces damage by a percentage: each armor point = 1% damage reduction (max 80% reduction)
            const armorReductionPercent = Math.min(0.8, effectiveArmor * 0.01);
            finalDamage = amount * (1 - armorReductionPercent);
        }
        
        // Apply magic resistance for magic damage types
        if (damageType === 'magic') {
            // Magic resistance can be positive (reduces damage) or negative (increases damage)
            // Positive resistance = damage reduced by that percentage
            // Negative resistance = damage increased (e.g., -0.2 = 20% more damage)
            // Example: 0.5 resistance = 50% reduction, -0.2 resistance = 20% increase
            const resistanceMultiplier = 1 - this.magicResistance;
            finalDamage = amount * resistanceMultiplier;
        }
        
        // Ensure minimum 1 damage gets through
        finalDamage = Math.max(1, finalDamage);
        
        this.health -= finalDamage;
        
        // Create a hit splatter effect with the final calculated damage
        const splatter = new HitSplatter(this.x, this.y - 20, finalDamage, damageType, followTarget ? this : null);
        this.hitSplatters.push(splatter);
        
        // Apply earth damage armor reduction effect
        if (damageType === 'earth' && this.armour > 0) {
            // Earth damage reduces armor by 3 points per hit
            this.armour = Math.max(0, this.armour - 3);
        }
    }
    
    isDead() {
        return this.health <= 0;
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
    
    renderHealthBar(ctx, baseSize) {
        const barWidth = baseSize * 3;
        const barHeight = Math.max(2, baseSize * 0.4);
        const barY = this.y - baseSize * 2.2;
        
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x - barWidth/2, barY, barWidth, barHeight);
        
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : (healthPercent > 0.25 ? '#FFC107' : '#F44336');
        ctx.fillRect(this.x - barWidth/2, barY, barWidth * healthPercent, barHeight);
        
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - barWidth/2, barY, barWidth, barHeight);
    }
    
    darkenColor(color, factor) {
        if (color.startsWith('#')) {
            const hex = color.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            
            const newR = Math.max(0, Math.floor(r * (1 - factor)));
            const newG = Math.max(0, Math.floor(g * (1 - factor)));
            const newB = Math.max(0, Math.floor(b * (1 - factor)));
            
            return `rgb(${newR}, ${newG}, ${newB})`;
        }
        return color;
    }
    
    lightenColor(color, factor) {
        if (color.startsWith('#')) {
            const hex = color.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            
            const newR = Math.min(255, Math.floor(r + (255 - r) * factor));
            const newG = Math.min(255, Math.floor(g + (255 - g) * factor));
            const newB = Math.min(255, Math.floor(b + (255 - b) * factor));
            
            return `rgb(${newR}, ${newG}, ${newB})`;
        }
        return color;
    }

    /**
     * Check if this enemy should drop loot
     * Returns true if normal loot should be dropped
     */
    shouldDropLoot() {
        return Math.random() < this.lootDropChance;
    }

    /**
     * Returns true if rare loot should be dropped (separate from normal loot)
     */
    shouldDropRareLoot() {
        return Math.random() < this.rareLootDropChance;
    }

    /**
     * Get random normal loot ID for this enemy (from brown bag)
     * Can be overridden by subclasses for different loot tables
     */
    getDroppedLoot() {
        // Normal loot items that drop from brown/common loot bag
        const normalLoot = [
            'copper-coin', 'frog-talisman', 'iron-dagger', 'emerald-shard',
            'silver-brooch', 'sapphire-crystal', 'leather-purse', 'bronze-medallion',
            'ruby-fragment', 'wooden-amulet'
        ];

        return normalLoot[Math.floor(Math.random() * normalLoot.length)];
    }

    /**
     * Get random rare loot ID - drops from purple/rare loot bag
     * Returns rare loot items
     */
    getDroppedRareLoot() {
        // Rare loot items that drop from purple/rare loot bag
        const rareLoot = [
            'dragon-eye', 'frog-crown', 'enchanted-longsword', 'moonstone-gem',
            'frog-totem', 'void-shard'
        ];
        return rareLoot[Math.floor(Math.random() * rareLoot.length)];
    }
    
    render(ctx) {
        // Override in subclasses
        throw new Error('render() must be implemented by subclass');
    }
}

