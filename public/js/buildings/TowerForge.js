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
        // Draw cobblestone foundation with individual stones
        this.drawCobblestoneWalls(ctx, size);
        
        // Forge opening with fire and coal
        this.drawForgeOpening(ctx, size);
        
        // Taller chimney with animated smoke
        this.drawChimney(ctx, size);
        
        // Tools and equipment around the forge
        this.drawForgeEquipment(ctx, size);
        
        // Render sparks from the forge
        this.renderSparks(ctx);
        
        // Selection highlight
        if (this.isSelected) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 4;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(this.x - size/2, this.y - size/2, size, size);
            ctx.setLineDash([]);
        }
        
        // Upgrade indicator
        ctx.fillStyle = this.isSelected ? '#FFD700' : '#FFA500';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🔨⬆️', this.x, this.y + size/2 + 20);
    }
    
    drawCobblestoneWalls(ctx, size) {
        const stoneSize = 12;
        const wallThickness = size * 0.15;
        
        // Shadow for the entire structure
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(this.x - size/2 + 3, this.y - size/2 + 3, size, size);
        
        // Draw individual cobblestones for walls
        for (let row = 0; row < Math.ceil(size / stoneSize); row++) {
            for (let col = 0; col < Math.ceil(size / stoneSize); col++) {
                const stoneX = this.x - size/2 + col * stoneSize;
                const stoneY = this.y - size/2 + row * stoneSize;
                
                // Only draw stones for outer walls, leave center open
                const isOuterWall = col < 2 || col >= Math.ceil(size / stoneSize) - 2 || 
                                   row < 2 || row >= Math.ceil(size / stoneSize) - 2;
                
                // Skip forge opening area (front center)
                const isForgeOpening = col >= 2 && col <= 4 && row >= Math.ceil(size / stoneSize) - 3;
                
                if (isOuterWall && !isForgeOpening) {
                    this.drawCobblestone(ctx, stoneX, stoneY, stoneSize, row);
                }
            }
        }
    }
    
    drawCobblestone(ctx, x, y, size, row) {
        // Offset every other row for realistic brick pattern
        const offset = (row % 2) * (size / 2);
        x += offset;
        
        // Individual stone colors (varied grays)
        const stoneColors = ['#696969', '#708090', '#778899', '#808080', '#A9A9A9'];
        const stoneColor = stoneColors[Math.floor((x + y) * 0.1) % stoneColors.length];
        
        // Stone gradient for 3D effect
        const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
        gradient.addColorStop(0, stoneColor);
        gradient.addColorStop(0.5, '#555555');
        gradient.addColorStop(1, '#3D3D3D');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, size - 1, size - 1);
        
        // Stone outline
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, size - 1, size - 1);
        
        // Highlight for 3D effect
        ctx.strokeStyle = '#BEBEBE';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + size - 1, y);
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + size - 1);
        ctx.stroke();
    }
    
    drawForgeOpening(ctx, size) {
        const openingWidth = size * 0.4;
        const openingHeight = size * 0.3;
        const openingX = this.x - openingWidth/2;
        const openingY = this.y + size/4;
        
        // Dark opening interior
        ctx.fillStyle = '#1A1A1A';
        ctx.fillRect(openingX, openingY, openingWidth, openingHeight);
        
        // Interior shadow gradient
        const shadowGradient = ctx.createRadialGradient(
            this.x, openingY + openingHeight/2, 0,
            this.x, openingY + openingHeight/2, openingWidth/2
        );
        shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
        shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
        ctx.fillStyle = shadowGradient;
        ctx.fillRect(openingX, openingY, openingWidth, openingHeight);
        
        // Coal pile at bottom of opening
        this.drawCoalPile(ctx, openingX, openingY, openingWidth, openingHeight);
        
        // Fire effects inside opening
        this.drawForgeFireInside(ctx, openingX, openingY, openingWidth, openingHeight);
        
        // Arch top of opening
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, openingY, openingWidth/2, 0, Math.PI);
        ctx.stroke();
    }
    
    drawCoalPile(ctx, x, y, width, height) {
        // Coal chunks at bottom of forge
        const coalY = y + height - 15;
        
        for (let i = 0; i < 8; i++) {
            const coalX = x + 5 + (i * (width - 10) / 7);
            const coalSize = 3 + Math.random() * 3;
            
            ctx.fillStyle = '#2F2F2F';
            ctx.beginPath();
            ctx.arc(coalX, coalY + Math.random() * 5, coalSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Glowing coal effect
            if (Math.random() > 0.6) {
                ctx.fillStyle = '#FF4500';
                ctx.beginPath();
                ctx.arc(coalX, coalY + Math.random() * 5, coalSize * 0.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    
    drawForgeFireInside(ctx, x, y, width, height) {
        const fireIntensity = Math.sin(this.animationTime * 10) * 0.3 + 0.7;
        
        // Base fire
        ctx.fillStyle = `rgba(255, 69, 0, ${fireIntensity})`;
        const fireWidth = width * 0.8;
        const fireHeight = height * 0.6;
        ctx.fillRect(x + (width - fireWidth)/2, y + height - fireHeight, fireWidth, fireHeight);
        
        // Fire core
        ctx.fillStyle = `rgba(255, 140, 0, ${fireIntensity * 0.8})`;
        const coreWidth = fireWidth * 0.6;
        const coreHeight = fireHeight * 0.7;
        ctx.fillRect(x + (width - coreWidth)/2, y + height - coreHeight, coreWidth, coreHeight);
        
        // Fire center
        ctx.fillStyle = `rgba(255, 255, 100, ${fireIntensity * 0.6})`;
        const centerWidth = coreWidth * 0.5;
        const centerHeight = coreHeight * 0.5;
        ctx.fillRect(x + (width - centerWidth)/2, y + height - centerHeight, centerWidth, centerHeight);
        
        // Fire glow effect outside opening
        const glowGradient = ctx.createRadialGradient(
            this.x, y + height, 0,
            this.x, y + height, width
        );
        glowGradient.addColorStop(0, `rgba(255, 100, 0, ${fireIntensity * 0.3})`);
        glowGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
        ctx.fillStyle = glowGradient;
        ctx.fillRect(x - width/2, y, width * 2, height);
    }
    
    drawChimney(ctx, size) {
        const chimneyWidth = size * 0.15;
        const chimneyHeight = size * 0.8;
        const chimneyX = this.x + size * 0.3;
        const chimneyY = this.y - size/2 - chimneyHeight;
        
        // Chimney shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(chimneyX + 2, chimneyY + 2, chimneyWidth, chimneyHeight);
        
        // Chimney bricks (smaller stones)
        const brickSize = 8;
        for (let row = 0; row < Math.ceil(chimneyHeight / brickSize); row++) {
            for (let col = 0; col < Math.ceil(chimneyWidth / brickSize); col++) {
                const brickX = chimneyX + col * brickSize + (row % 2) * (brickSize / 2);
                const brickY = chimneyY + row * brickSize;
                
                if (brickX < chimneyX + chimneyWidth) {
                    this.drawCobblestone(ctx, brickX, brickY, brickSize, row);
                }
            }
        }
        
        // Chimney cap
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(chimneyX - 5, chimneyY - 5, chimneyWidth + 10, 8);
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.strokeRect(chimneyX - 5, chimneyY - 5, chimneyWidth + 10, 8);
        
        // Animated smoke rising from chimney
        this.drawAnimatedSmoke(ctx, chimneyX + chimneyWidth/2, chimneyY - 5);
    }
    
    drawAnimatedSmoke(ctx, x, y) {
        const smokeHeight = 60;
        const smokeIntensity = 0.4;
        
        for (let i = 0; i < 8; i++) {
            const smokeY = y - (i * 8);
            const smokeX = x + Math.sin(this.animationTime * 2 + i * 0.5) * (5 + i);
            const smokeSize = 4 + i * 2;
            const alpha = smokeIntensity * (1 - i / 8);
            
            ctx.fillStyle = `rgba(120, 120, 120, ${alpha})`;
            ctx.beginPath();
            ctx.arc(smokeX, smokeY, smokeSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawForgeEquipment(ctx, size) {
        // Anvil outside the forge
        const anvilX = this.x - size * 0.3;
        const anvilY = this.y + size * 0.1;
        
        ctx.fillStyle = '#2F2F2F';
        ctx.fillRect(anvilX - 15, anvilY, 30, 12);
        ctx.fillRect(anvilX - 8, anvilY - 8, 16, 8);
        
        // Hammer leaning against anvil
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(anvilX + 20, anvilY);
        ctx.lineTo(anvilX + 25, anvilY - 15);
        ctx.stroke();
        
        ctx.fillStyle = '#696969';
        ctx.fillRect(anvilX + 23, anvilY - 18, 6, 8);
        
        // Tool rack
        const rackX = this.x + size * 0.25;
        const rackY = this.y - size * 0.1;
        
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(rackX, rackY - 20);
        ctx.lineTo(rackX, rackY + 20);
        ctx.stroke();
        
        // Tools hanging on rack
        const tools = ['🔨', '⚒️', '🔧'];
        tools.forEach((tool, i) => {
            ctx.fillStyle = '#654321';
            ctx.font = '16px Arial';
            ctx.fillText(tool, rackX + 5, rackY - 15 + i * 12);
        });
        
        // Bellows
        const bellowsX = this.x - size * 0.2;
        const bellowsY = this.y + size * 0.25;
        
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(bellowsX, bellowsY, 25, 15);
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.strokeRect(bellowsX, bellowsY, 25, 15);
        
        // Bellows handle
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(bellowsX + 25, bellowsY + 7);
        ctx.lineTo(bellowsX + 35, bellowsY + 7);
        ctx.stroke();
    }
    
    renderSparks(ctx) {
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
