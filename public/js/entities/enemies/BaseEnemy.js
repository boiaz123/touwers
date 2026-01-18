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
        this.lootDropChance = 0.5; // 1% chance to drop normal loot on death (0-1)
        this.rareLootDropChance = 0.1; // 0.25% chance to drop rare loot on death (0-1)
        this.currentPathIndex = 0;
        this.x = path && path.length > 0 ? path[0].x : 0;
        this.y = path && path.length > 0 ? path[0].y : 0;
        this.reachedEnd = false;
        
        // Defender waypoint - if set, enemy will stop here instead of reaching castle
        this.defenderWaypoint = null;
        
        // Path defenders (guard post defenders on the path)
        this.pathDefenders = [];
        
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
        
        // Path spreading: random lateral offset from the main path
        // This prevents all enemies from walking in a straight line
        // Range: ±30 pixels for consistent spreading within path bounds
        this.pathOffsetAmount = (Math.random() - 0.5) * 60; // ±30 pixels offset
        
        // Only apply offset every N frames to reduce computation
        this.offsetUpdateCounter = 0;
        
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
        
        // PATH DEFENDER LOGIC: Check if we're at a waypoint where a path defender is stationed
        // If so, engage with the defender instead of continuing to the castle
        if (this.defenderWaypoint) {
            const distanceToWaypoint = Math.hypot(
                this.defenderWaypoint.x - this.x,
                this.defenderWaypoint.y - this.y
            );
            

            
            // If we've reached the defender waypoint, engage with available path defender
            if (distanceToWaypoint < 50) {

                this.reachedEnd = true;
                this.isAttackingCastle = false;
                // Will be attacked by defender in GameplayState combat handling
                return;
            }
        }
        
        // CASTLE DEFENDER LOGIC: Normal path following to reach the castle
        if (this.currentPathIndex >= this.path.length - 1) {
            this.reachedEnd = true;
            this.isAttackingCastle = true;
            return;
        }
        
        const target = this.path[this.currentPathIndex + 1];
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
            // Apply lateral offset when reaching waypoint
            const nextTarget = this.path[this.currentPathIndex];
            if (nextTarget) {
                this.x = nextTarget.x;
                this.y = nextTarget.y;
                // Apply offset perpendicular to path direction for next segment
                this.applyPathOffset();
            } else {
                this.x = target.x;
                this.y = target.y;
            }
            return;
        }
        
        const moveDistance = this.speed * deltaTime;
        this.x += (dx / distance) * moveDistance;
        this.y += (dy / distance) * moveDistance;
        
        // Apply path offset more frequently for better spreading from start
        this.offsetUpdateCounter++;
        if (this.offsetUpdateCounter >= 2) {
            this.applyPathOffset();
            this.offsetUpdateCounter = 0;
        }
    }
    
    /**
     * Apply lateral offset perpendicular to path direction
     * This spreads enemies across the path instead of keeping them in a line
     */
    applyPathOffset() {
        if (!this.path || this.currentPathIndex >= this.path.length - 1) return;
        
        const currentPos = this.path[this.currentPathIndex];
        const nextPos = this.path[this.currentPathIndex + 1];
        
        // Calculate direction vector along path
        const pathDx = nextPos.x - currentPos.x;
        const pathDy = nextPos.y - currentPos.y;
        const pathLength = Math.hypot(pathDx, pathDy);
        
        if (pathLength === 0) return;
        
        // Perpendicular vector (rotate 90 degrees)
        const perpX = -pathDy / pathLength;
        const perpY = pathDx / pathLength;
        
        // Calculate distance from path center (project position onto path segment)
        const toCurrentDx = this.x - currentPos.x;
        const toCurrentDy = this.y - currentPos.y;
        const projectionLength = (toCurrentDx * pathDx + toCurrentDy * pathDy) / (pathLength * pathLength);
        const projX = currentPos.x + projectionLength * pathDx;
        const projY = currentPos.y + projectionLength * pathDy;
        
        // Distance from enemy to path center line
        const distFromPath = Math.hypot(this.x - projX, this.y - projY);
        
        // Max allowed offset (path width is 60px total, so ±25px from center)
        const maxOffset = 25;
        
        // If we're too far from path center, pull back toward it
        if (distFromPath > maxOffset) {
            // Calculate how much we're over the limit
            const excess = distFromPath - maxOffset;
            
            // Direction from enemy to path center
            const toCenterX = projX - this.x;
            const toCenterY = projY - this.y;
            const toCenterLen = Math.hypot(toCenterX, toCenterY);
            
            if (toCenterLen > 0) {
                // Pull back toward center
                const pullStrength = 0.08;
                this.x += (toCenterX / toCenterLen) * excess * pullStrength;
                this.y += (toCenterY / toCenterLen) * excess * pullStrength;
            }
        } else {
            // We're within bounds, apply gentle spreading offset
            // Use the initial random offset, but scale it based on distance from center
            const spreadAmount = (this.pathOffsetAmount / 30) * (1 - (distFromPath / maxOffset) * 0.5);
            this.x += perpX * spreadAmount * 0.02;
            this.y += perpY * spreadAmount * 0.02;
        }
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
     * Get random normal loot ID for this enemy
     * Can be overridden by subclasses for different loot tables
     */
    getDroppedLoot() {
        // Common loot items
        const commonLoot = [
            'iron-sword', 'iron-axe', 'wooden-bow', 'leather-helm', 
            'leather-chest', 'gauntlets', 'steel-boots', 'ancient-coin'
        ];
        // Uncommon loot items (30% chance)
        const uncommonLoot = [
            'steel-sword', 'battle-axe', 'longbow', 'iron-helm', 
            'iron-chest', 'steel-boots', 'ancient-coin'
        ];
        // Rare loot items (5% chance)
        const rareLoot = [
            'longsword', 'great-axe', 'elven-bow', 'dragon-helm', 
            'mithril-chest', 'gold-ring', 'gem-cluster'
        ];
        // Epic loot items (1% chance)
        const epicLoot = [
            'enchanted-blade', 'dragon-helm', 'ruby-amulet', 'crystal-orb'
        ];

        const rand = Math.random();
        if (rand < 0.01) {
            return epicLoot[Math.floor(Math.random() * epicLoot.length)];
        } else if (rand < 0.06) {
            return rareLoot[Math.floor(Math.random() * rareLoot.length)];
        } else if (rand < 0.36) {
            return uncommonLoot[Math.floor(Math.random() * uncommonLoot.length)];
        } else {
            return commonLoot[Math.floor(Math.random() * commonLoot.length)];
        }
    }

    /**
     * Get random rare loot ID - separate tier from normal drops
     * Returns high-value legendary items
     */
    getDroppedRareLoot() {
        const rareLoot = [
            'excalibur', 'dragon-scales', 'phoenix-tear', 'cursed-ring',
            'void-gem', 'shadow-cloak', 'holy-relic'
        ];
        return rareLoot[Math.floor(Math.random() * rareLoot.length)];
    }
    
    render(ctx) {
        // Override in subclasses
        throw new Error('render() must be implemented by subclass');
    }
}

