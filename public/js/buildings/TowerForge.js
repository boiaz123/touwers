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
        // Calculate scale factor like other towers
        const baseResolution = 1920;
        const scaleFactor = Math.max(0.5, Math.min(2.5, ctx.canvas.width / baseResolution));
        const cellSize = Math.floor(32 * scaleFactor);
        const forgeSize = cellSize * 4; // 4x4 building
        
        // Draw the 3D blacksmith building
        this.drawBlacksmithBuilding(ctx, forgeSize);
        
        // Draw the open furnace with fire
        this.drawOpenFurnace(ctx, forgeSize);
        
        // Draw chimney with smoke
        this.drawChimney3D(ctx, forgeSize);
        
        // Draw forge equipment and tools
        this.drawForgeTools(ctx, forgeSize);
        
        // Render sparks from the furnace
        this.renderSparks(ctx);
        
        // Selection highlight
        if (this.isSelected) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 4;
            ctx.setLineDash([8, 8]);
            ctx.strokeRect(this.x - forgeSize/2, this.y - forgeSize/2, forgeSize, forgeSize);
            ctx.setLineDash([]);
        }
        
        // Upgrade indicator
        ctx.fillStyle = this.isSelected ? '#FFD700' : '#FFA500';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🔨⬆️', this.x, this.y + forgeSize/2 + 25);
    }
    
    drawBlacksmithBuilding(ctx, size) {
        // Building shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(this.x - size/2 + 5, this.y - size/4 + 5, size, size/2);
        
        // Stone foundation (matches archer tower style)
        const foundationHeight = size * 0.12;
        const foundationGradient = ctx.createLinearGradient(
            this.x - size/2, this.y - foundationHeight,
            this.x + size/4, this.y
        );
        foundationGradient.addColorStop(0, '#A9A9A9');
        foundationGradient.addColorStop(0.5, '#808080');
        foundationGradient.addColorStop(1, '#696969');
        
        ctx.fillStyle = foundationGradient;
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 2;
        ctx.fillRect(this.x - size/2, this.y - foundationHeight, size, foundationHeight);
        ctx.strokeRect(this.x - size/2, this.y - foundationHeight, size, foundationHeight);
        
        // Stone blocks texture
        ctx.strokeStyle = '#555555';
        ctx.lineWidth = 1;
        for (let i = 1; i < 6; i++) {
            ctx.beginPath();
            ctx.moveTo(this.x - size/2 + (size * i / 6), this.y - foundationHeight);
            ctx.lineTo(this.x - size/2 + (size * i / 6), this.y);
            ctx.stroke();
        }
        
        // Main building walls (3D perspective like archer tower)
        const wallHeight = size * 0.4;
        const wallY = this.y - foundationHeight - wallHeight;
        
        // Front wall with forge opening
        const wallGradient = ctx.createLinearGradient(
            this.x - size/2, wallY,
            this.x + size/4, this.y - foundationHeight
        );
        wallGradient.addColorStop(0, '#CD853F');
        wallGradient.addColorStop(0.3, '#A0522D');
        wallGradient.addColorStop(0.7, '#8B4513');
        wallGradient.addColorStop(1, '#654321');
        
        ctx.fillStyle = wallGradient;
        ctx.strokeStyle = '#5D4E37';
        ctx.lineWidth = 2;
        ctx.fillRect(this.x - size/2, wallY, size, wallHeight);
        ctx.strokeRect(this.x - size/2, wallY, size, wallHeight);
        
        // Vertical wood planks
        ctx.strokeStyle = '#8B7355';
        ctx.lineWidth = 1;
        for (let i = 1; i < 8; i++) {
            ctx.beginPath();
            ctx.moveTo(this.x - size/2 + (size * i / 8), wallY);
            ctx.lineTo(this.x - size/2 + (size * i / 8), this.y - foundationHeight);
            ctx.stroke();
        }
        
        // Horizontal support beams
        for (let i = 1; i <= 2; i++) {
            const beamY = wallY + (wallHeight * i / 3);
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(this.x - size/2, beamY);
            ctx.lineTo(this.x + size/2, beamY);
            ctx.stroke();
        }
        
        // Sloped roof (3D perspective)
        const roofHeight = size * 0.25;
        const roofY = wallY - roofHeight;
        
        ctx.fillStyle = '#8B4513';
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        
        // Roof front face
        ctx.beginPath();
        ctx.moveTo(this.x, roofY);
        ctx.lineTo(this.x - size/2 - 10, wallY);
        ctx.lineTo(this.x + size/2 + 10, wallY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Roof tiles
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        for (let i = 1; i < 6; i++) {
            const tileY = wallY - (roofHeight * i / 6);
            const tileWidth = size * (1.2 - i * 0.04);
            ctx.beginPath();
            ctx.moveTo(this.x - tileWidth/2, tileY);
            ctx.lineTo(this.x + tileWidth/2, tileY);
            ctx.stroke();
        }
        
        // Building corner posts
        const postWidth = 6;
        ctx.fillStyle = '#654321';
        ctx.strokeStyle = '#5D4E37';
        ctx.lineWidth = 1;
        
        // Corner posts
        for (let side = -1; side <= 1; side += 2) {
            const postX = this.x + side * (size/2 - postWidth/2);
            ctx.fillRect(postX, wallY, postWidth, wallHeight + foundationHeight);
            ctx.strokeRect(postX, wallY, postWidth, wallHeight + foundationHeight);
        }
    }
    
    drawOpenFurnace(ctx, size) {
        // Furnace opening in the front wall
        const openingWidth = size * 0.25;
        const openingHeight = size * 0.2;
        const openingX = this.x - openingWidth/2;
        const openingY = this.y - size * 0.15;
        
        // Dark opening interior
        ctx.fillStyle = '#0A0A0A';
        ctx.fillRect(openingX, openingY, openingWidth, openingHeight);
        
        // Arched opening outline
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(this.x, openingY, openingWidth/2, 0, Math.PI);
        ctx.stroke();
        
        // Fire glow from inside
        const fireIntensity = Math.sin(this.animationTime * 12) * 0.4 + 0.6;
        const glowGradient = ctx.createRadialGradient(
            this.x, openingY + openingHeight/2, 0,
            this.x, openingY + openingHeight/2, openingWidth
        );
        glowGradient.addColorStop(0, `rgba(255, 69, 0, ${fireIntensity})`);
        glowGradient.addColorStop(0.5, `rgba(255, 140, 0, ${fireIntensity * 0.6})`);
        glowGradient.addColorStop(1, 'rgba(255, 140, 0, 0)');
        
        ctx.fillStyle = glowGradient;
        ctx.fillRect(openingX - openingWidth/2, openingY, openingWidth * 2, openingHeight);
        
        // Coal bed inside furnace
        this.drawCoalBed(ctx, openingX, openingY, openingWidth, openingHeight);
        
        // Flames inside
        this.drawFurnaceFire(ctx, openingX, openingY, openingWidth, openingHeight, fireIntensity);
        
        // Brick lining around opening
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 3;
        ctx.strokeRect(openingX - 5, openingY - 5, openingWidth + 10, openingHeight + 5);
    }
    
    drawCoalBed(ctx, x, y, width, height) {
        const coalY = y + height - 10;
        
        // Coal chunks
        for (let i = 0; i < 12; i++) {
            const coalX = x + Math.random() * width;
            const coalSize = 2 + Math.random() * 3;
            
            ctx.fillStyle = '#1A1A1A';
            ctx.beginPath();
            ctx.arc(coalX, coalY + Math.random() * 8, coalSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Glowing coals
            if (Math.random() > 0.5) {
                ctx.fillStyle = Math.random() > 0.5 ? '#FF4500' : '#FF6B00';
                ctx.beginPath();
                ctx.arc(coalX, coalY + Math.random() * 8, coalSize * 0.6, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    
    drawFurnaceFire(ctx, x, y, width, height, intensity) {
        // Layered fire effect
        const layers = [
            { color: `rgba(255, 69, 0, ${intensity})`, scale: 1.0 },
            { color: `rgba(255, 140, 0, ${intensity * 0.8})`, scale: 0.7 },
            { color: `rgba(255, 255, 100, ${intensity * 0.5})`, scale: 0.4 }
        ];
        
        layers.forEach((layer, i) => {
            ctx.fillStyle = layer.color;
            const fireWidth = width * layer.scale;
            const fireHeight = height * 0.8 * layer.scale;
            const fireX = x + (width - fireWidth) / 2;
            const fireY = y + height - fireHeight - 5;
            
            // Flickering flame shapes
            ctx.beginPath();
            for (let j = 0; j <= 10; j++) {
                const angle = (j / 10) * Math.PI;
                const flicker = Math.sin(this.animationTime * 15 + j) * 3;
                const fx = fireX + fireWidth/2 + Math.cos(angle) * fireWidth/2;
                const fy = fireY + Math.sin(angle) * fireHeight + flicker;
                
                if (j === 0) ctx.moveTo(fx, fy);
                else ctx.lineTo(fx, fy);
            }
            ctx.closePath();
            ctx.fill();
        });
    }
    
    drawChimney3D(ctx, size) {
        // Chimney positioned on the roof
        const chimneyWidth = size * 0.12;
        const chimneyHeight = size * 0.6;
        const chimneyX = this.x + size * 0.25;
        const chimneyY = this.y - size * 0.4 - chimneyHeight;
        
        // Chimney shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(chimneyX + 3, chimneyY + 3, chimneyWidth, chimneyHeight);
        
        // Chimney brick structure
        const chimneyGradient = ctx.createLinearGradient(
            chimneyX, chimneyY,
            chimneyX + chimneyWidth, chimneyY + chimneyHeight
        );
        chimneyGradient.addColorStop(0, '#A0522D');
        chimneyGradient.addColorStop(0.5, '#8B4513');
        chimneyGradient.addColorStop(1, '#654321');
        
        ctx.fillStyle = chimneyGradient;
        ctx.strokeStyle = '#5D4E37';
        ctx.lineWidth = 2;
        ctx.fillRect(chimneyX, chimneyY, chimneyWidth, chimneyHeight);
        ctx.strokeRect(chimneyX, chimneyY, chimneyWidth, chimneyHeight);
        
        // Brick pattern
        const brickHeight = 8;
        ctx.strokeStyle = '#8B7355';
        ctx.lineWidth = 1;
        for (let row = 0; row < Math.ceil(chimneyHeight / brickHeight); row++) {
            const rowY = chimneyY + row * brickHeight;
            const offset = (row % 2) * (chimneyWidth / 4);
            
            ctx.beginPath();
            ctx.moveTo(chimneyX, rowY);
            ctx.lineTo(chimneyX + chimneyWidth, rowY);
            ctx.stroke();
            
            if (row % 2 === 0) {
                ctx.beginPath();
                ctx.moveTo(chimneyX + chimneyWidth/2, rowY);
                ctx.lineTo(chimneyX + chimneyWidth/2, rowY + brickHeight);
                ctx.stroke();
            }
        }
        
        // Chimney cap
        ctx.fillStyle = '#654321';
        ctx.strokeStyle = '#5D4E37';
        ctx.lineWidth = 2;
        ctx.fillRect(chimneyX - 4, chimneyY - 6, chimneyWidth + 8, 8);
        ctx.strokeRect(chimneyX - 4, chimneyY - 6, chimneyWidth + 8, 8);
        
        // Rising smoke animation
        this.drawRisingSmoke(ctx, chimneyX + chimneyWidth/2, chimneyY - 6);
    }
    
    drawRisingSmoke(ctx, x, y) {
        for (let i = 0; i < 10; i++) {
            const smokeY = y - (i * 12);
            const drift = Math.sin(this.animationTime * 1.5 + i * 0.8) * (8 + i * 2);
            const smokeX = x + drift;
            const smokeSize = 5 + i * 1.5;
            const alpha = 0.6 * (1 - i / 10);
            
            ctx.fillStyle = `rgba(120, 120, 120, ${alpha})`;
            ctx.beginPath();
            ctx.arc(smokeX, smokeY, smokeSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Secondary smoke wisps
            if (i > 3) {
                const wispX = smokeX + Math.cos(this.animationTime * 2 + i) * 8;
                const wispY = smokeY + Math.sin(this.animationTime * 1.8 + i) * 4;
                ctx.fillStyle = `rgba(140, 140, 140, ${alpha * 0.6})`;
                ctx.beginPath();
                ctx.arc(wispX, wispY, smokeSize * 0.6, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    
    drawForgeTools(ctx, size) {
        // Anvil positioned outside
        const anvilX = this.x - size * 0.3;
        const anvilY = this.y - size * 0.05;
        
        // Anvil shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(anvilX - 12, anvilY + 2, 24, 8);
        
        // Anvil base
        ctx.fillStyle = '#2F2F2F';
        ctx.strokeStyle = '#1F1F1F';
        ctx.lineWidth = 1;
        ctx.fillRect(anvilX - 12, anvilY, 24, 8);
        ctx.strokeRect(anvilX - 12, anvilY, 24, 8);
        
        // Anvil top
        const anvilGradient = ctx.createLinearGradient(anvilX - 8, anvilY - 6, anvilX + 8, anvilY);
        anvilGradient.addColorStop(0, '#696969');
        anvilGradient.addColorStop(0.5, '#2F2F2F');
        anvilGradient.addColorStop(1, '#1A1A1A');
        
        ctx.fillStyle = anvilGradient;
        ctx.fillRect(anvilX - 8, anvilY - 6, 16, 6);
        ctx.strokeRect(anvilX - 8, anvilY - 6, 16, 6);
        
        // Hammer on anvil
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(anvilX + 15, anvilY - 2);
        ctx.lineTo(anvilX + 22, anvilY - 12);
        ctx.stroke();
        
        // Hammer head
        ctx.fillStyle = '#696969';
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        ctx.fillRect(anvilX + 20, anvilY - 16, 8, 6);
        ctx.strokeRect(anvilX + 20, anvilY - 16, 8, 6);
        
        // Tool rack
        const rackX = this.x + size * 0.3;
        const rackY = this.y - size * 0.15;
        
        // Rack post
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(rackX, rackY - 25);
        ctx.lineTo(rackX, rackY + 15);
        ctx.stroke();
        
        // Cross beam
        ctx.strokeStyle = '#A0522D';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(rackX - 8, rackY - 15);
        ctx.lineTo(rackX + 8, rackY - 15);
        ctx.stroke();
        
        // Hanging tools
        const tools = [
            { x: rackX - 6, y: rackY - 10, tool: '🔨' },
            { x: rackX, y: rackY - 12, tool: '⚒️' },
            { x: rackX + 6, y: rackY - 11, tool: '🔧' }
        ];
        
        tools.forEach(({ x, y, tool }) => {
            ctx.fillStyle = '#654321';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(tool, x, y);
        });
        
        // Water barrel
        const barrelX = this.x + size * 0.35;
        const barrelY = this.y + size * 0.1;
        
        ctx.fillStyle = '#8B4513';
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.fillRect(barrelX - 8, barrelY - 12, 16, 20);
        ctx.strokeRect(barrelX - 8, barrelY - 12, 16, 20);
        
        // Barrel bands
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            const bandY = barrelY - 12 + 6 + i * 6;
            ctx.beginPath();
            ctx.moveTo(barrelX - 8, bandY);
            ctx.lineTo(barrelX + 8, bandY);
            ctx.stroke();
        }
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
