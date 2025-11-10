import { Building } from './Building.js';

export class TowerForge extends Building {
    constructor(x, y, gridX, gridY) {
        super(x, y, gridX, gridY, 4);
        this.upgradeRadius = 200;
        this.sparks = [];
        this.nextSparkTime = 0;
        this.isSelected = false;
        this.smokeParticles = [];
        this.nextSmokeTime = 0;
        this.fireIntensity = 0;
        
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
        
        // Update fire intensity
        this.fireIntensity = Math.sin(this.animationTime * 6) * 0.3 + 0.7;
        
        // Generate forge sparks from fire opening
        this.nextSparkTime -= deltaTime;
        if (this.nextSparkTime <= 0) {
            const sparkCount = this.isSelected ? 8 : 5;
            for (let i = 0; i < sparkCount; i++) {
                this.sparks.push({
                    x: this.x - 15 + (Math.random() - 0.5) * 25, // From forge opening
                    y: this.y - 10 + (Math.random() - 0.5) * 15,
                    vx: (Math.random() - 0.5) * 60,
                    vy: -Math.random() * 80 - 30,
                    life: 1.2,
                    maxLife: 1.2,
                    size: Math.random() * 2 + 1,
                    color: Math.random() > 0.4 ? 'orange' : (Math.random() > 0.7 ? 'yellow' : 'red')
                });
            }
            this.nextSparkTime = 0.1 + Math.random() * 0.2;
        }
        
        // Generate chimney smoke
        this.nextSmokeTime -= deltaTime;
        if (this.nextSmokeTime <= 0) {
            this.smokeParticles.push({
                x: this.x + 35, // From chimney
                y: this.y - 45,
                vx: (Math.random() - 0.5) * 20,
                vy: -30 - Math.random() * 20,
                life: 3,
                maxLife: 3,
                size: Math.random() * 8 + 4
            });
            this.nextSmokeTime = 0.3 + Math.random() * 0.4;
        }
        
        // Update particles
        this.sparks = this.sparks.filter(spark => {
            spark.x += spark.vx * deltaTime;
            spark.y += spark.vy * deltaTime;
            spark.life -= deltaTime;
            spark.vy += 150 * deltaTime; // gravity
            spark.size = Math.max(0, spark.size - deltaTime * 2);
            return spark.life > 0 && spark.size > 0;
        });
        
        this.smokeParticles = this.smokeParticles.filter(smoke => {
            smoke.x += smoke.vx * deltaTime;
            smoke.y += smoke.vy * deltaTime;
            smoke.life -= deltaTime;
            smoke.size += deltaTime * 3;
            smoke.vx *= 0.99; // wind resistance
            return smoke.life > 0;
        });
    }
    
    render(ctx, size) {
        // Calculate building dimensions
        const buildingWidth = size * 0.9;
        const buildingHeight = size * 0.6;
        const wallHeight = size * 0.5;
        
        // Building shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(this.x - buildingWidth/2 + 4, this.y - buildingHeight/2 + 4, buildingWidth, buildingHeight);
        
        // Cobblestone wall structure
        this.renderCobblestoneWalls(ctx, buildingWidth, buildingHeight, wallHeight);
        
        // Forge opening with fire
        this.renderForgeOpening(ctx, size);
        
        // Chimney
        this.renderChimney(ctx, size);
        
        // Roof
        this.renderRoof(ctx, buildingWidth, buildingHeight, wallHeight);
        
        // Forge interior details
        this.renderForgeInterior(ctx, size);
        
        // Render particles
        this.renderParticles(ctx);
        
        // Selection indicator
        if (this.isSelected) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            ctx.strokeRect(this.x - size/2, this.y - size/2, size, size);
        }
        
        // Upgrade indicator
        ctx.fillStyle = this.isSelected ? '#FFD700' : '#FFA500';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🔨⬆️', this.x, this.y + size/2 + 20);
    }
    
    renderCobblestoneWalls(ctx, buildingWidth, buildingHeight, wallHeight) {
        // Base wall color
        const wallGradient = ctx.createLinearGradient(
            this.x - buildingWidth/2, this.y - wallHeight,
            this.x + buildingWidth/4, this.y
        );
        wallGradient.addColorStop(0, '#A9A9A9');
        wallGradient.addColorStop(0.5, '#808080');
        wallGradient.addColorStop(1, '#696969');
        
        // Main wall structure
        ctx.fillStyle = wallGradient;
        ctx.fillRect(this.x - buildingWidth/2, this.y - wallHeight, buildingWidth, wallHeight);
        
        // Individual cobblestones
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        
        const stoneWidth = buildingWidth / 8;
        const stoneHeight = wallHeight / 6;
        
        // Draw cobblestone pattern
        for (let row = 0; row < 6; row++) {
            const offsetX = (row % 2) * stoneWidth/2; // Staggered pattern
            const rowY = this.y - wallHeight + (row * stoneHeight);
            
            for (let col = 0; col < 9; col++) {
                const stoneX = this.x - buildingWidth/2 + offsetX + (col * stoneWidth);
                
                // Skip stones where forge opening will be
                if (row >= 2 && row <= 4 && col >= 1 && col <= 3) {
                    continue;
                }
                
                // Individual stone color variation
                const stoneShade = 0.8 + Math.sin(row * col * 0.5) * 0.2;
                ctx.fillStyle = `rgb(${Math.floor(169 * stoneShade)}, ${Math.floor(169 * stoneShade)}, ${Math.floor(169 * stoneShade)})`;
                
                // Draw stone
                ctx.fillRect(stoneX, rowY, stoneWidth - 1, stoneHeight - 1);
                ctx.strokeRect(stoneX, rowY, stoneWidth - 1, stoneHeight - 1);
                
                // Stone highlight for 3D effect
                ctx.fillStyle = `rgba(200, 200, 200, ${0.3 * stoneShade})`;
                ctx.fillRect(stoneX, rowY, stoneWidth/3, stoneHeight/3);
            }
        }
        
        // Wall top edge
        ctx.fillStyle = '#DCDCDC';
        ctx.fillRect(this.x - buildingWidth/2, this.y - wallHeight, buildingWidth, 3);
        
        // Wall side face (3D effect)
        ctx.fillStyle = '#696969';
        ctx.beginPath();
        ctx.moveTo(this.x + buildingWidth/2, this.y - wallHeight);
        ctx.lineTo(this.x + buildingWidth/2 + 8, this.y - wallHeight - 8);
        ctx.lineTo(this.x + buildingWidth/2 + 8, this.y - 8);
        ctx.lineTo(this.x + buildingWidth/2, this.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    
    renderForgeOpening(ctx, size) {
        // Forge opening in the wall
        const openingWidth = size * 0.25;
        const openingHeight = size * 0.2;
        const openingX = this.x - openingWidth/2 - 15;
        const openingY = this.y - openingHeight/2 - 5;
        
        // Opening shadow/depth
        ctx.fillStyle = '#000000';
        ctx.fillRect(openingX, openingY, openingWidth, openingHeight);
        
        // Opening border (stone arch)
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 3;
        ctx.strokeRect(openingX - 2, openingY - 2, openingWidth + 4, openingHeight + 4);
        
        // Arch top
        ctx.fillStyle = '#808080';
        ctx.fillRect(openingX - 2, openingY - 4, openingWidth + 4, 4);
        
        // Fire glow from opening
        const fireGlow = ctx.createRadialGradient(
            openingX + openingWidth/2, openingY + openingHeight/2, 0,
            openingX + openingWidth/2, openingY + openingHeight/2, openingWidth
        );
        fireGlow.addColorStop(0, `rgba(255, 100, 0, ${this.fireIntensity * 0.8})`);
        fireGlow.addColorStop(0.6, `rgba(255, 50, 0, ${this.fireIntensity * 0.4})`);
        fireGlow.addColorStop(1, 'rgba(255, 0, 0, 0)');
        
        ctx.fillStyle = fireGlow;
        ctx.fillRect(openingX - openingWidth/2, openingY - openingHeight/2, openingWidth * 2, openingHeight * 2);
    }
    
    renderChimney(ctx, size) {
        // Chimney position (separate from main building)
        const chimneyX = this.x + size * 0.35;
        const chimneyY = this.y - size * 0.1;
        const chimneyWidth = size * 0.12;
        const chimneyHeight = size * 0.6;
        
        // Chimney shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(chimneyX + 2, chimneyY - chimneyHeight + 2, chimneyWidth, chimneyHeight);
        
        // Chimney main body - darker stone
        const chimneyGradient = ctx.createLinearGradient(
            chimneyX, chimneyY - chimneyHeight,
            chimneyX + chimneyWidth, chimneyY
        );
        chimneyGradient.addColorStop(0, '#696969');
        chimneyGradient.addColorStop(0.5, '#2F2F2F');
        chimneyGradient.addColorStop(1, '#1C1C1C');
        
        ctx.fillStyle = chimneyGradient;
        ctx.fillRect(chimneyX, chimneyY - chimneyHeight, chimneyWidth, chimneyHeight);
        
        // Chimney stones
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        
        const chimneyStoneHeight = chimneyHeight / 8;
        for (let i = 0; i < 8; i++) {
            const stoneY = chimneyY - chimneyHeight + (i * chimneyStoneHeight);
            ctx.strokeRect(chimneyX, stoneY, chimneyWidth, chimneyStoneHeight);
        }
        
        // Chimney top
        ctx.fillStyle = '#2F2F2F';
        ctx.fillRect(chimneyX - 2, chimneyY - chimneyHeight - 4, chimneyWidth + 4, 6);
        ctx.strokeRect(chimneyX - 2, chimneyY - chimneyHeight - 4, chimneyWidth + 4, 6);
        
        // Chimney 3D side
        ctx.fillStyle = '#1C1C1C';
        ctx.beginPath();
        ctx.moveTo(chimneyX + chimneyWidth, chimneyY - chimneyHeight);
        ctx.lineTo(chimneyX + chimneyWidth + 4, chimneyY - chimneyHeight - 4);
        ctx.lineTo(chimneyX + chimneyWidth + 4, chimneyY - 4);
        ctx.lineTo(chimneyX + chimneyWidth, chimneyY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    
    renderRoof(ctx, buildingWidth, buildingHeight, wallHeight) {
        // Simple slanted roof
        ctx.fillStyle = '#8B4513';
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(this.x - buildingWidth/2 - 5, this.y - wallHeight);
        ctx.lineTo(this.x, this.y - wallHeight - buildingHeight * 0.2);
        ctx.lineTo(this.x + buildingWidth/2 + 5, this.y - wallHeight);
        ctx.lineTo(this.x + buildingWidth/2, this.y - wallHeight + 3);
        ctx.lineTo(this.x - buildingWidth/2, this.y - wallHeight + 3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Roof tiles
        ctx.strokeStyle = '#5D4E37';
        ctx.lineWidth = 1;
        for (let i = 1; i < 4; i++) {
            const tileY = this.y - wallHeight + (3 * i / 4);
            const tileWidth = buildingWidth * (1 - i / 8);
            ctx.beginPath();
            ctx.moveTo(this.x - tileWidth/2, tileY);
            ctx.lineTo(this.x + tileWidth/2, tileY);
            ctx.stroke();
        }
    }
    
    renderForgeInterior(ctx, size) {
        // Coal pile visible in opening
        const openingX = this.x - 15;
        const openingY = this.y + 5;
        
        // Coal pieces
        ctx.fillStyle = '#1C1C1C';
        for (let i = 0; i < 6; i++) {
            const coalX = openingX - 8 + (i % 3) * 6;
            const coalY = openingY - 3 + Math.floor(i / 3) * 4;
            ctx.beginPath();
            ctx.arc(coalX, coalY, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Fire above coal
        const fireColors = [
            `rgba(255, 0, 0, ${this.fireIntensity * 0.7})`,
            `rgba(255, 100, 0, ${this.fireIntensity * 0.8})`,
            `rgba(255, 200, 0, ${this.fireIntensity * 0.6})`
        ];
        
        fireColors.forEach((color, index) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.ellipse(
                openingX - 3 + index * 2,
                openingY - 8 - index * 2,
                4 - index,
                8 - index * 2,
                0, 0, Math.PI * 2
            );
            ctx.fill();
        });
        
        // Anvil inside (partially visible)
        ctx.fillStyle = '#2F2F2F';
        ctx.fillRect(openingX + 10, openingY - 2, 8, 4);
        
        // Hammer on anvil
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(openingX + 12, openingY - 6, 2, 6);
        ctx.fillStyle = '#2F2F2F';
        ctx.fillRect(openingX + 12, openingY - 6, 2, 3);
    }
    
    renderParticles(ctx) {
        // Render sparks
        this.sparks.forEach(spark => {
            const alpha = (spark.life / spark.maxLife) * (spark.size / 3);
            
            switch(spark.color) {
                case 'orange':
                    ctx.fillStyle = `rgba(255, 165, 0, ${alpha})`;
                    break;
                case 'yellow':
                    ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
                    break;
                case 'red':
                    ctx.fillStyle = `rgba(255, 69, 0, ${alpha})`;
                    break;
            }
            
            ctx.beginPath();
            ctx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Spark trail
            ctx.fillStyle = `rgba(255, 100, 0, ${alpha * 0.3})`;
            ctx.beginPath();
            ctx.arc(spark.x - spark.vx * 0.01, spark.y - spark.vy * 0.01, spark.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Render smoke
        this.smokeParticles.forEach(smoke => {
            const alpha = (smoke.life / smoke.maxLife) * 0.4;
            ctx.fillStyle = `rgba(128, 128, 128, ${alpha})`;
            ctx.beginPath();
            ctx.arc(smoke.x, smoke.y, smoke.size, 0, Math.PI * 2);
            ctx.fill();
        });
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
        
        // Use gold instead of coins - this was the main bug
        if (!cost || gameState.gold < cost || upgrade.level >= upgrade.maxLevel) {
            return false;
        }
        
        gameState.gold -= cost; // Changed from coins to gold
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
