import { Building } from './Building.js';

export class TowerForge extends Building {
    constructor(x, y, gridX, gridY) {
        super(x, y, gridX, gridY, 4);
        this.upgradeRadius = 200;
        this.sparks = [];
        this.nextSparkTime = 0;
        this.isSelected = false;
        
        // Upgrade system
        this.upgrades = {
            towerRange: { level: 0, maxLevel: 5, baseCost: 100, effect: 0.1 },
            poisonDamage: { level: 0, maxLevel: 5, baseCost: 150, effect: 2 },
            barricadeDamage: { level: 0, maxLevel: 5, baseCost: 120, effect: 5 },
            fireArrows: { level: 0, maxLevel: 3, baseCost: 200, effect: 1 },
            explosiveRadius: { level: 0, maxLevel: 4, baseCost: 250, effect: 20 }
        };
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        // Generate more sparks for active forge
        this.nextSparkTime -= deltaTime;
        if (this.nextSparkTime <= 0) {
            const sparkCount = this.isSelected ? 5 : 3;
            for (let i = 0; i < sparkCount; i++) {
                this.sparks.push({
                    x: this.x + (Math.random() - 0.5) * 60,
                    y: this.y - 20 + (Math.random() - 0.5) * 30,
                    vx: (Math.random() - 0.5) * 80,
                    vy: -Math.random() * 100 - 20,
                    life: 0.8,
                    maxLife: 0.8,
                    color: Math.random() > 0.3 ? 'orange' : 'red'
                });
            }
            this.nextSparkTime = 0.15 + Math.random() * 0.25;
        }
        
        this.sparks = this.sparks.filter(spark => {
            spark.x += spark.vx * deltaTime;
            spark.y += spark.vy * deltaTime;
            spark.life -= deltaTime;
            spark.vy += 50 * deltaTime; // gravity
            return spark.life > 0;
        });
    }
    
    render(ctx, size) {
        // Main forge building - stone base
        const stoneGradient = ctx.createLinearGradient(
            this.x - size/2, this.y - size/2,
            this.x + size/2, this.y + size/2
        );
        stoneGradient.addColorStop(0, '#8B7355');
        stoneGradient.addColorStop(0.5, '#654321');
        stoneGradient.addColorStop(1, '#4A4A4A');
        
        ctx.fillStyle = stoneGradient;
        ctx.strokeStyle = this.isSelected ? '#FFD700' : '#2F2F2F';
        ctx.lineWidth = this.isSelected ? 4 : 2;
        ctx.fillRect(this.x - size/2, this.y - size/2, size * 0.8, size * 0.8);
        ctx.strokeRect(this.x - size/2, this.y - size/2, size * 0.8, size * 0.8);
        
        // Chimney
        ctx.fillStyle = '#4A4A4A';
        ctx.fillRect(this.x + size/4, this.y - size/2 - 15, size/6, 20);
        ctx.strokeRect(this.x + size/4, this.y - size/2 - 15, size/6, 20);
        
        // Forge fire (more realistic)
        const fireIntensity = Math.sin(this.animationTime * 8) * 0.2 + 0.8;
        
        // Fire base
        ctx.fillStyle = `rgba(255, 50, 0, ${fireIntensity})`;
        ctx.fillRect(this.x - size/3, this.y - size/8, size/1.8, size/4);
        
        // Fire core
        ctx.fillStyle = `rgba(255, 150, 0, ${fireIntensity * 0.8})`;
        ctx.fillRect(this.x - size/4, this.y - size/12, size/2.5, size/6);
        
        // Fire center
        ctx.fillStyle = `rgba(255, 255, 100, ${fireIntensity * 0.6})`;
        ctx.fillRect(this.x - size/6, this.y - size/16, size/8, size/12);
        
        // Anvil
        ctx.fillStyle = '#2F2F2F';
        ctx.fillRect(this.x - size/5, this.y + size/8, size/2.5, size/8);
        ctx.strokeRect(this.x - size/5, this.y + size/8, size/2.5, size/8);
        
        // Hammer on anvil
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x + size/12, this.y + size/12, size/20, size/6);
        ctx.fillStyle = '#2F2F2F';
        ctx.fillRect(this.x + size/12, this.y + size/12, size/20, size/12);
        
        // Bellows
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x - size/2.5, this.y + size/6, size/4, size/8);
        
        // Tools rack
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x + size/3, this.y - size/4);
        ctx.lineTo(this.x + size/3, this.y + size/4);
        ctx.stroke();
        
        // Render sparks
        this.sparks.forEach(spark => {
            const alpha = spark.life / spark.maxLife;
            if (spark.color === 'orange') {
                ctx.fillStyle = `rgba(255, 165, 0, ${alpha})`;
            } else {
                ctx.fillStyle = `rgba(255, 69, 0, ${alpha})`;
            }
            ctx.beginPath();
            ctx.arc(spark.x, spark.y, 1.5, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Smoke from chimney
        const smokeOffset = Math.sin(this.animationTime * 2) * 5;
        ctx.fillStyle = `rgba(100, 100, 100, 0.3)`;
        ctx.beginPath();
        ctx.arc(this.x + size/3 + smokeOffset, this.y - size/2 - 25, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Upgrade indicator
        ctx.fillStyle = this.isSelected ? '#FFD700' : '#FFA500';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🔨⬆️', this.x, this.y + size/2 + 20);
    }
    
    isPointInside(x, y, size) {
        return x >= this.x - size/2 && x <= this.x + size/2 &&
               y >= this.y - size/2 && y <= this.y + size/2;
    }
    
    onClick() {
        this.isSelected = true;
        return {
            type: 'forge_menu',
            forge: this,
            upgrades: this.getUpgradeOptions()
        };
    }
    
    getUpgradeOptions() {
        return [
            {
                id: 'towerRange',
                name: 'Extended Barrels',
                description: `Increase all tower range by ${(this.upgrades.towerRange.effect * 100).toFixed(0)}%`,
                level: this.upgrades.towerRange.level,
                maxLevel: this.upgrades.towerRange.maxLevel,
                cost: this.calculateUpgradeCost('towerRange'),
                icon: '🎯'
            },
            {
                id: 'poisonDamage',
                name: 'Toxic Coating',
                description: `Add ${this.upgrades.poisonDamage.effect} poison damage to Poison Archers`,
                level: this.upgrades.poisonDamage.level,
                maxLevel: this.upgrades.poisonDamage.maxLevel,
                cost: this.calculateUpgradeCost('poisonDamage'),
                icon: '☠️'
            },
            {
                id: 'barricadeDamage',
                name: 'Reinforced Spikes',
                description: `Add ${this.upgrades.barricadeDamage.effect} damage to Barricade Towers`,
                level: this.upgrades.barricadeDamage.level,
                maxLevel: this.upgrades.barricadeDamage.maxLevel,
                cost: this.calculateUpgradeCost('barricadeDamage'),
                icon: '🛡️'
            },
            {
                id: 'fireArrows',
                name: 'Flame Arrows',
                description: 'Archer arrows ignite enemies, dealing burn damage over time',
                level: this.upgrades.fireArrows.level,
                maxLevel: this.upgrades.fireArrows.maxLevel,
                cost: this.calculateUpgradeCost('fireArrows'),
                icon: '🔥'
            },
            {
                id: 'explosiveRadius',
                name: 'Enhanced Gunpowder',
                description: `Increase Cannon blast radius by ${this.upgrades.explosiveRadius.effect}px`,
                level: this.upgrades.explosiveRadius.level,
                maxLevel: this.upgrades.explosiveRadius.maxLevel,
                cost: this.calculateUpgradeCost('explosiveRadius'),
                icon: '💥'
            }
        ];
    }
    
    calculateUpgradeCost(upgradeType) {
        const upgrade = this.upgrades[upgradeType];
        if (upgrade.level >= upgrade.maxLevel) return null;
        return Math.floor(upgrade.baseCost * Math.pow(1.5, upgrade.level));
    }
    
    purchaseUpgrade(upgradeType, gameState) {
        const upgrade = this.upgrades[upgradeType];
        const cost = this.calculateUpgradeCost(upgradeType);
        
        if (!cost || gameState.coins < cost || upgrade.level >= upgrade.maxLevel) {
            return false;
        }
        
        gameState.coins -= cost;
        upgrade.level++;
        this.applyUpgrade(upgradeType, gameState);
        return true;
    }
    
    applyUpgrade(upgradeType, gameState) {
        const upgrade = this.upgrades[upgradeType];
        
        switch(upgradeType) {
            case 'towerRange':
                // Applied globally in towerManager
                break;
            case 'poisonDamage':
                // Applied to poison archer towers
                break;
            case 'barricadeDamage':
                // Applied to barricade towers
                break;
            case 'fireArrows':
                // Applied to archer towers
                break;
            case 'explosiveRadius':
                // Applied to cannon towers
                break;
        }
    }
    
    applyEffect(towerManager) {
        // Base forge effect
        towerManager.towerUpgrades.damage *= 1.25;
        towerManager.towerUpgrades.range *= 1.15;
        
        // Apply forge upgrades
        if (this.upgrades.towerRange.level > 0) {
            towerManager.towerUpgrades.range *= (1 + this.upgrades.towerRange.level * this.upgrades.towerRange.effect);
        }
    }
    
    deselect() {
        this.isSelected = false;
    }
    
    static getInfo() {
        return {
            name: 'Tower Forge',
            description: 'Upgrades all towers and provides specialized tower enhancements.',
            effect: 'Global tower boost + upgrade menu',
            size: '4x4',
            cost: 300
        };
    }
}
