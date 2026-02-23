import { HitSplatter } from '../effects/HitSplatter.js';

/**
 * DefenderBase - Base class for all defenders
 * Provides shared properties, stats, and utility methods
 * Subclasses (CastleDefender, PathDefender) implement their own combat and rendering logic
 */
export class DefenderBase {
    constructor(level = 1) {
        this.level = Math.min(3, Math.max(1, level)); // Clamp to 1-3
        
        // Initialize stats based on level
        this.initializeStats();
        
        // Position (will be set when placed)
        this.x = 0;
        this.y = 0;
        
        // Waypoint where enemies should stop and fight this defender
        // Used by enemies to know when to stop moving and engage
        this.defenderWaypoint = null;
        
        // Combat properties
        this.attackDamage = this.getAttackDamage();
        this.attackSpeed = this.getAttackSpeed();
        this.attackCooldown = 0;
        this.attackRange = 80; // Enemies stop at 60 units, so range must be at least 70-80 to guarantee engagement
        
        // Animation properties
        this.animationTime = 0;
        this.isAttacking = false;
        this.attackTarget = null;
        this.lastAttackTime = 0;
        
        // Size based on level - adjusted multipliers
        // Level 1: 1.2x, Level 2: 1.4x, Level 3: 1.7x
        this.sizeMultiplier = [1.2, 1.4, 1.7][this.level - 1];
        
        // Colors and styling
        this.tunicColor = this.getTunicColor();
        this.armorColor = this.getArmorColor();
        
        // Hit effects
        this.hitSplatters = [];
        this.damageFlashTimer = 0;
    }
    
    initializeStats() {
        // Base stats that scale with level
        switch(this.level) {
            case 1:
                this.maxHealth = 120;
                this.health = 120;
                this.armor = 3;
                break;
            case 2:
                this.maxHealth = 200;
                this.health = 200;
                this.armor = 6;
                break;
            case 3:
                this.maxHealth = 300;
                this.health = 300;
                this.armor = 9;
                break;
        }
    }
    
    getTunicColor() {
        // Distinctive blue colors for defenders
        switch(this.level) {
            case 1:
                return '#1E5A7A'; // Medium blue
            case 2:
                return '#1A4A6A'; // Deeper blue
            case 3:
                return '#0F2A4A'; // Very dark blue
            default:
                return '#1E5A7A';
        }
    }
    
    getArmorColor() {
        // Progressive armor colors
        switch(this.level) {
            case 1:
                return '#5A6A8A'; // Steel blue
            case 2:
                return '#4A5A7A'; // Darker steel
            case 3:
                return '#3A4A6A'; // Deep armor blue
            default:
                return '#5A6A8A';
        }
    }
    
    getAttackDamage() {
        switch(this.level) {
            case 1:
                return 6;
            case 2:
                return 10;
            case 3:
                return 15;
            default:
                return 5;
        }
    }
    
    getAttackSpeed() {
        switch(this.level) {
            case 1:
                return 0.9;
            case 2:
                return 1.0;
            case 3:
                return 1.1;
            default:
                return 0.8;
        }
    }

    takeDamage(amount) {
        const armorReduction = this.armor * 0.4;
        const actualDamage = Math.max(1, amount - armorReduction);
        
        this.health -= actualDamage;
        this.damageFlashTimer = 0.2;
        
        const splatter = new HitSplatter(this.x, this.y - 30, actualDamage, 'physical', null);
        this.hitSplatters.push(splatter);
        
        return actualDamage;
    }
    
    isDead() {
        return this.health <= 0;
    }

    // Shared utility color methods
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
}
