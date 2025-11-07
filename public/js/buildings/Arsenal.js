export class Arsenal {
    constructor(x, y, gridX, gridY, gameState) {
        this.x = x;
        this.y = y;
        this.gridX = gridX;
        this.gridY = gridY;
        this.gameState = gameState;
        this.type = 'arsenal';
        this.upgradeRange = 150; // Range within which towers get bonuses
        this.level = 1;
        this.maxLevel = 3;
        this.upgradeCost = 200; // Cost to upgrade the arsenal
        
        // Animation properties
        this.animationTime = 0;
        this.forgeFlames = [];
        this.sparks = [];
        
        // Initialize forge flames
        for (let i = 0; i < 6; i++) {
            this.forgeFlames.push({
                x: (Math.random() - 0.5) * 30,
                y: Math.random() * 20 + 10,
                intensity: Math.random(),
                flickerOffset: Math.random() * Math.PI * 2
            });
        }
    }
    
    update(deltaTime, towers, enemies) {
        this.animationTime += deltaTime;
        
        // Update forge flames
        this.forgeFlames.forEach(flame => {
            flame.intensity = 0.5 + 0.5 * Math.sin(this.animationTime * 3 + flame.flickerOffset);
        });
        
        // Generate sparks occasionally
        if (Math.random() < deltaTime * 2) {
            this.sparks.push({
                x: (Math.random() - 0.5) * 40,
                y: Math.random() * 30 + 15,
                vx: (Math.random() - 0.5) * 100,
                vy: -Math.random() * 150 - 50,
                life: 1.5,
                maxLife: 1.5,
                size: Math.random() * 2 + 1
            });
        }
        
        // Update sparks
        this.sparks = this.sparks.filter(spark => {
            spark.x += spark.vx * deltaTime;
            spark.y += spark.vy * deltaTime;
            spark.vy += 200 * deltaTime; // Gravity
            spark.life -= deltaTime;
            return spark.life > 0;
        });
    }
    
    upgrade() {
        if (this.level < this.maxLevel && this.gameState.spend(this.upgradeCost)) {
            this.level++;
            this.upgradeCost = Math.floor(this.upgradeCost * 1.5);
            return true;
        }
        return false;
    }
    
    isInRange(x, y) {
        const distance = Math.hypot(x - this.x, y - this.y);
        return distance <= this.upgradeRange;
    }
    
    getDamageMultiplier() {
        return 1 + (this.level * 0.25); // 25% damage boost per level
    }
    
    getRangeBonus() {
        return this.level * 20; // 20 range bonus per level
    }
    
    render(ctx) {
        // Calculate building size based on grid cell size (4x4 cells)
        const baseResolution = 1920;
        const scaleFactor = Math.max(0.5, Math.min(2.5, ctx.canvas.width / baseResolution));
        const cellSize = Math.floor(32 * scaleFactor);
        const buildingSize = cellSize * 4;
        
        // 3D shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(this.x - buildingSize * 0.4 + 6, this.y - buildingSize * 0.3 + 6, buildingSize * 0.8, buildingSize * 0.6);
        
        // Main arsenal building (stone structure)
        const buildingWidth = buildingSize * 0.8;
        const buildingHeight = buildingSize * 0.6;
        
        // Stone building gradient
        const stoneGradient = ctx.createLinearGradient(
            this.x - buildingWidth/2, this.y - buildingHeight,
            this.x + buildingWidth/3, this.y
        );
        stoneGradient.addColorStop(0, '#C0C0C0');
        stoneGradient.addColorStop(0.3, '#A0A0A0');
        stoneGradient.addColorStop(0.7, '#808080');
        stoneGradient.addColorStop(1, '#404040');
        
        ctx.fillStyle = stoneGradient;
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 3;
        ctx.fillRect(this.x - buildingWidth/2, this.y - buildingHeight, buildingWidth, buildingHeight);
        ctx.strokeRect(this.x - buildingWidth/2, this.y - buildingHeight, buildingWidth, buildingHeight);
        
        // Stone block pattern
        ctx.strokeStyle = '#606060';
        ctx.lineWidth = 1;
        const blockRows = 8;
        const blockCols = 6;
        
        for (let row = 0; row < blockRows; row++) {
            for (let col = 0; col < blockCols; col++) {
                const offsetX = (row % 2) * (buildingWidth / blockCols / 2);
                const blockX = this.x - buildingWidth/2 + offsetX + (col * buildingWidth / blockCols);
                const blockY = this.y - buildingHeight + (row * buildingHeight / blockRows);
                const blockWidth = buildingWidth / blockCols;
                const blockHeight = buildingHeight / blockRows;
                
                if (blockX + blockWidth <= this.x + buildingWidth/2) {
                    ctx.strokeRect(blockX, blockY, blockWidth, blockHeight);
                }
            }
        }
        
        // Forge entrance (large arched opening)
        const forgeWidth = buildingWidth * 0.6;
        const forgeHeight = buildingHeight * 0.4;
        const forgeY = this.y - forgeHeight * 0.6;
        
        // Dark forge interior
        ctx.fillStyle = '#1A1A1A';
        ctx.beginPath();
        ctx.arc(this.x, forgeY, forgeWidth/2, 0, Math.PI, true);
        ctx.fillRect(this.x - forgeWidth/2, forgeY, forgeWidth, forgeHeight/2);
        ctx.fill();
        
        // Forge arch
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(this.x, forgeY, forgeWidth/2, 0, Math.PI, true);
        ctx.stroke();
        
        // Render forge flames
        this.forgeFlames.forEach(flame => {
            const alpha = flame.intensity * 0.8;
            const flameGradient = ctx.createRadialGradient(
                this.x + flame.x, forgeY + flame.y, 0,
                this.x + flame.x, forgeY + flame.y, 15
            );
            flameGradient.addColorStop(0, `rgba(255, 255, 100, ${alpha})`);
            flameGradient.addColorStop(0.4, `rgba(255, 150, 0, ${alpha * 0.8})`);
            flameGradient.addColorStop(0.8, `rgba(255, 50, 0, ${alpha * 0.6})`);
            flameGradient.addColorStop(1, `rgba(100, 0, 0, 0)`);
            
            ctx.fillStyle = flameGradient;
            ctx.beginPath();
            ctx.arc(this.x + flame.x, forgeY + flame.y, 12 * flame.intensity, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Render sparks
        this.sparks.forEach(spark => {
            const alpha = spark.life / spark.maxLife;
            ctx.fillStyle = `rgba(255, 200, 0, ${alpha})`;
            ctx.beginPath();
            ctx.arc(this.x + spark.x, this.y + spark.y, spark.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Chimney with smoke
        const chimneyWidth = buildingWidth * 0.15;
        const chimneyHeight = buildingHeight * 0.8;
        const chimneyX = this.x + buildingWidth * 0.25;
        const chimneyY = this.y - buildingHeight;
        
        ctx.fillStyle = '#8B4513';
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.fillRect(chimneyX - chimneyWidth/2, chimneyY - chimneyHeight, chimneyWidth, chimneyHeight);
        ctx.strokeRect(chimneyX - chimneyWidth/2, chimneyY - chimneyHeight, chimneyWidth, chimneyHeight);
        
        // Smoke
        for (let i = 0; i < 3; i++) {
            const smokeY = chimneyY - chimneyHeight - i * 20;
            const smokeOffset = Math.sin(this.animationTime + i) * 8;
            ctx.fillStyle = `rgba(100, 100, 100, ${0.4 - i * 0.1})`;
            ctx.beginPath();
            ctx.arc(chimneyX + smokeOffset, smokeY, 8 + i * 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Arsenal level indicator
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 16px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`LV${this.level}`, this.x, this.y - buildingHeight - 20);
        
        // Upgrade range indicator (when applicable)
        if (this.showRange) {
            ctx.strokeStyle = 'rgba(255, 100, 0, 0.3)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.upgradeRange, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
    
    static getInfo() {
        return {
            name: 'Arsenal',
            description: 'Forge that upgrades nearby towers with enhanced weapons and ammunition.',
            effect: '+25% damage, +20 range per level',
            range: '150 (upgrade radius)',
            maxLevel: '3',
            cost: 300
        };
    }
}
