import { HitSplatter } from '../effects/HitSplatter.js';

export class BaseEnemy {
    constructor(path, health, speed = 50) {
        this.path = path;
        this.health = health;
        this.maxHealth = health;
        this.speed = speed;
        this.currentPathIndex = 0;
        this.x = path && path.length > 0 ? path[0].x : 0;
        this.y = path && path.length > 0 ? path[0].y : 0;
        this.reachedEnd = false;
        
        // Defender waypoint - if set, enemy will stop here instead of reaching castle
        this.defenderWaypoint = null;
        
        // Attack properties
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
        
        console.log(`${this.constructor.name}: Path updated, now at index`, this.currentPathIndex);
    }
    
    update(deltaTime) {
        this.animationTime += deltaTime;
        this.attackCooldown = Math.max(0, this.attackCooldown - deltaTime);
        
        // NOTE: Hit splatters are now managed by EnemyManager to avoid double-updating
        // They are updated once per frame in EnemyManager.update() for all splatters
        
        // Don't move if attacking a defender (either on path or at castle)
        if (this.isAttackingDefender) {
            return;
        }
        
        if (this.reachedEnd || !this.path || this.path.length === 0) return;
        
        // Check if we've reached a defender waypoint on the path
        // This allows guard post defenders to stop enemies before they reach the castle
        // This acts as a backup in case the normal engagement mechanism doesn't catch them
        if (this.defenderWaypoint) {
            const distanceToWaypoint = Math.hypot(
                this.defenderWaypoint.x - this.x,
                this.defenderWaypoint.y - this.y
            );
            
            // If within reaching distance of defender waypoint, stop here
            // Note: We stop even if not yet engaging, because movement will bring us into range
            if (distanceToWaypoint < 30) {
                this.reachedEnd = true;
                this.isAttackingCastle = false;
                console.log(`${this.constructor.name}: Reached defender waypoint at path index ${this.defenderWaypoint.pathIndex}`);
                return;
            }
        }
        
        if (this.currentPathIndex >= this.path.length - 1) {
            this.reachedEnd = true;
            this.isAttackingCastle = true;
            console.log(`${this.constructor.name}: Reached end of path`);
            return;
        }
        
        const target = this.path[this.currentPathIndex + 1];
        if (!target) {
            this.reachedEnd = true;
            this.isAttackingCastle = true;
            console.log(`${this.constructor.name}: No target waypoint, reached end`);
            return;
        }
        
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.hypot(dx, dy);
        
        const reachThreshold = Math.max(5, this.speed * deltaTime * 2);
        
        if (distance < reachThreshold) {
            this.currentPathIndex++;
            this.x = target.x;
            this.y = target.y;
            return;
        }
        
        const moveDistance = this.speed * deltaTime;
        this.x += (dx / distance) * moveDistance;
        this.y += (dy / distance) * moveDistance;
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
    
    takeDamage(amount, ignoreArmor = false, damageType = 'physical', followTarget = false) {
        this.health -= amount;
        
        // Create a hit splatter effect
        const splatter = new HitSplatter(this.x, this.y - 20, amount, damageType, followTarget ? this : null);
        this.hitSplatters.push(splatter);
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
    
    render(ctx) {
        // Override in subclasses
        throw new Error('render() must be implemented by subclass');
    }
}
