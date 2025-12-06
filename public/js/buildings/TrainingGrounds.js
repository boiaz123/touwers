import { Building } from './Building.js';

export class TrainingGrounds extends Building {
    constructor(x, y, gridX, gridY) {
        super(x, y, gridX, gridY, 4);
        this.isSelected = false;
        
        // Building upgrade system - placeholder
        this.trainingLevel = 0;
        this.maxTrainingLevel = 5;
        
        this.upgrades = {
            damageTraining: { level: 0, maxLevel: 5, baseCost: 100, effect: 5 },
            speedTraining: { level: 0, maxLevel: 5, baseCost: 120, effect: 1.05 },
            accuracyTraining: { level: 0, maxLevel: 5, baseCost: 110, effect: 0.95 },
            staminaTraining: { level: 0, maxLevel: 5, baseCost: 130, effect: 1.1 }
        };
        
        // Visual effects
        this.trainingParticles = [];
        this.nextParticleTime = 0;
        
        // Training targets
        this.targets = [
            { x: -30, y: -40, rotation: 0, hits: 0 },
            { x: 20, y: -35, rotation: 0.2, hits: 0 },
            { x: -10, y: 10, rotation: -0.15, hits: 0 }
        ];
        
        // Haybales
        this.haybales = [
            { x: -45, y: 20, width: 20, height: 15 },
            { x: 35, y: 25, width: 18, height: 14 },
            { x: -25, y: -20, width: 16, height: 12 }
        ];
        
        // Wooden fences (segments)
        this.fences = [
            { startX: -60, startY: -50, endX: -20, endY: -55, posts: 8 },
            { startX: 20, startY: -45, endX: 60, endY: -50, posts: 8 },
            { startX: -60, startY: 45, endX: 60, endY: 50, posts: 16 }
        ];
        
        // Training dummies
        this.dummies = [
            { x: -40, y: 35, type: 'wood' },
            { x: 0, y: 40, type: 'wood' },
            { x: 40, y: 35, type: 'wood' }
        ];
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        // Generate training particles (arrows, dust, etc.)
        this.nextParticleTime -= deltaTime;
        if (this.nextParticleTime <= 0) {
            const particleType = Math.random() > 0.5 ? 'arrow' : 'dust';
            
            if (particleType === 'arrow') {
                // Arrow particle from random position
                const target = this.targets[Math.floor(Math.random() * this.targets.length)];
                this.trainingParticles.push({
                    x: this.x + target.x - 15,
                    y: this.y + target.y,
                    vx: 60 + Math.random() * 20,
                    vy: (Math.random() - 0.5) * 20,
                    life: 1.5,
                    maxLife: 1.5,
                    type: 'arrow',
                    size: 2
                });
            } else {
                // Dust particle
                const dummy = this.dummies[Math.floor(Math.random() * this.dummies.length)];
                this.trainingParticles.push({
                    x: this.x + dummy.x + (Math.random() - 0.5) * 10,
                    y: this.y + dummy.y + (Math.random() - 0.5) * 8,
                    vx: (Math.random() - 0.5) * 30,
                    vy: -Math.random() * 20 - 10,
                    life: 2,
                    maxLife: 2,
                    type: 'dust',
                    size: Math.random() * 2 + 1
                });
            }
            
            this.nextParticleTime = 0.4 + Math.random() * 0.6;
        }
        
        // Update particles
        this.trainingParticles = this.trainingParticles.filter(particle => {
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.life -= deltaTime;
            particle.vy += 100 * deltaTime; // Gravity
            
            if (particle.type === 'dust') {
                particle.size = Math.max(0, particle.size * (particle.life / particle.maxLife));
            }
            
            return particle.life > 0;
        });
    }
    
    render(ctx, size) {
        // Render ground and layout first
        this.renderGround(ctx, size);
        
        // Render fences (behind main elements)
        this.renderFences(ctx, size);
        
        // Render haybales
        this.renderHaybales(ctx, size);
        
        // Render training dummies
        this.renderDummies(ctx, size);
        
        // Render targets
        this.renderTargets(ctx, size);
        
        // Render particles
        this.renderParticles(ctx);
        
        // Training indicator
        if (this.isSelected) {
            ctx.fillStyle = '#DAA520';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('⚔️⬆️', this.x, this.y + size/2 + 20);
        }
        
        // Floating icon in bottom right of 4x4 grid
        const cellSize = size / 4;
        const iconSize = 30;
        const iconX = (this.gridX + 3.5) * cellSize;
        const iconY = (this.gridY + 3.5) * cellSize - 5;
        
        const pulseIntensity = 0.85 + 0.15 * Math.sin(this.animationTime * 4);
        
        // Icon shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(iconX - iconSize/2 + 3, iconY - iconSize/2 + 3, iconSize, iconSize);
        
        // Parchment background
        const parchmentGradient = ctx.createRadialGradient(
            iconX - iconSize/4, iconY - iconSize/4, 0,
            iconX, iconY, iconSize
        );
        parchmentGradient.addColorStop(0, `rgba(210, 180, 140, ${pulseIntensity})`);
        parchmentGradient.addColorStop(0.7, `rgba(188, 143, 143, ${pulseIntensity * 0.9})`);
        parchmentGradient.addColorStop(1, `rgba(160, 120, 80, ${pulseIntensity * 0.8})`);
        
        ctx.fillStyle = parchmentGradient;
        ctx.fillRect(iconX - iconSize/2, iconY - iconSize/2, iconSize, iconSize);
        
        // Gold border
        ctx.strokeStyle = `rgba(184, 134, 11, ${pulseIntensity})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(iconX - iconSize/2, iconY - iconSize/2, iconSize, iconSize);
        
        ctx.strokeStyle = `rgba(255, 215, 0, ${pulseIntensity * 0.8})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(iconX - iconSize/2 + 2, iconY - iconSize/2 + 2, iconSize - 4, iconSize - 4);
        
        // Glow effect
        const glowGradient = ctx.createRadialGradient(iconX, iconY, 0, iconX, iconY, iconSize * 1.5);
        glowGradient.addColorStop(0, `rgba(218, 165, 32, ${pulseIntensity * 0.2})`);
        glowGradient.addColorStop(1, 'rgba(218, 165, 32, 0)');
        ctx.fillStyle = glowGradient;
        ctx.fillRect(iconX - iconSize/2 - 5, iconY - iconSize/2 - 5, iconSize + 10, iconSize + 10);
        
        // Icon symbol
        ctx.fillStyle = `rgba(139, 69, 19, ${pulseIntensity})`;
        ctx.font = 'bold 18px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚔️', iconX, iconY);
        
        ctx.fillStyle = `rgba(255, 215, 0, ${pulseIntensity * 0.3})`;
        ctx.fillText('⚔️', iconX, iconY);
    }
    
    renderGround(ctx, size) {
        // Packed dirt training ground
        const groundGradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, size
        );
        groundGradient.addColorStop(0, '#9B8860');
        groundGradient.addColorStop(0.5, '#8B7355');
        groundGradient.addColorStop(1, '#7A6545');
        
        ctx.fillStyle = groundGradient;
        ctx.fillRect(this.x - size/2, this.y - size/2, size, size);
        
        // Worn dirt patches and footprints
        const dirtPatches = [
            { x: -30, y: -20, radius: 15, intensity: 0.4 },
            { x: 25, y: 15, radius: 20, intensity: 0.5 },
            { x: -45, y: 35, radius: 18, intensity: 0.35 }
        ];
        
        dirtPatches.forEach(patch => {
            const dirtGradient = ctx.createRadialGradient(
                this.x + patch.x, this.y + patch.y, 0,
                this.x + patch.x, this.y + patch.y, patch.radius
            );
            dirtGradient.addColorStop(0, `rgba(60, 40, 20, ${patch.intensity})`);
            dirtGradient.addColorStop(1, `rgba(60, 40, 20, 0)`);
            
            ctx.fillStyle = dirtGradient;
            ctx.beginPath();
            ctx.arc(this.x + patch.x, this.y + patch.y, patch.radius, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Grass patches around edges
        const grassAreas = [
            { x: -55, y: -50, radius: 12 },
            { x: 55, y: -45, radius: 10 },
            { x: -60, y: 50, radius: 8 },
            { x: 50, y: 55, radius: 10 }
        ];
        
        grassAreas.forEach(area => {
            const grassGradient = ctx.createRadialGradient(
                this.x + area.x, this.y + area.y, 0,
                this.x + area.x, this.y + area.y, area.radius
            );
            grassGradient.addColorStop(0, `rgba(34, 139, 34, 0.6)`);
            grassGradient.addColorStop(1, `rgba(34, 139, 34, 0)`);
            
            ctx.fillStyle = grassGradient;
            ctx.beginPath();
            ctx.arc(this.x + area.x, this.y + area.y, area.radius, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    renderFences(ctx, size) {
        this.fences.forEach(fence => {
            const startX = this.x + fence.startX;
            const startY = this.y + fence.startY;
            const endX = this.x + fence.endX;
            const endY = this.y + fence.endY;
            
            // Fence line
            const angle = Math.atan2(endY - startY, endX - startX);
            const distance = Math.hypot(endX - startX, endY - startY);
            const postSpacing = distance / fence.posts;
            
            // Render each fence post
            for (let i = 0; i < fence.posts; i++) {
                const postX = startX + Math.cos(angle) * (i * postSpacing);
                const postY = startY + Math.sin(angle) * (i * postSpacing);
                
                // Post shadow
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.fillRect(postX - 2, postY + 2, 4, 3);
                
                // Post
                ctx.fillStyle = '#8B6F47';
                ctx.fillRect(postX - 2, postY - 18, 4, 20);
                
                // Post top cap
                ctx.fillStyle = '#654321';
                ctx.fillRect(postX - 3, postY - 20, 6, 3);
                
                // Wood grain
                ctx.strokeStyle = '#654321';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(postX - 2, postY - 15);
                ctx.lineTo(postX + 2, postY - 14);
                ctx.moveTo(postX - 2, postY - 8);
                ctx.lineTo(postX + 2, postY - 7);
                ctx.stroke();
            }
            
            // Horizontal rails between posts
            for (let i = 0; i < fence.posts - 1; i++) {
                const railStartX = startX + Math.cos(angle) * (i * postSpacing);
                const railStartY = startY + Math.sin(angle) * (i * postSpacing);
                const railEndX = startX + Math.cos(angle) * ((i + 1) * postSpacing);
                const railEndY = startY + Math.sin(angle) * ((i + 1) * postSpacing);
                
                // Upper rail
                ctx.strokeStyle = '#CD853F';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(railStartX, railStartY - 10);
                ctx.lineTo(railEndX, railEndY - 10);
                ctx.stroke();
                
                // Lower rail
                ctx.beginPath();
                ctx.moveTo(railStartX, railStartY - 3);
                ctx.lineTo(railEndX, railEndY - 3);
                ctx.stroke();
                
                // Vertical slats
                ctx.strokeStyle = '#A0522D';
                ctx.lineWidth = 2;
                const slatCount = 4;
                for (let j = 1; j < slatCount; j++) {
                    const slatX = railStartX + (railEndX - railStartX) * (j / slatCount);
                    const slatY = railStartY + (railEndY - railStartY) * (j / slatCount);
                    ctx.beginPath();
                    ctx.moveTo(slatX, slatY - 10);
                    ctx.lineTo(slatX, slatY - 3);
                    ctx.stroke();
                }
            }
        });
    }
    
    renderHaybales(ctx, size) {
        this.haybales.forEach(haybale => {
            const x = this.x + haybale.x;
            const y = this.y + haybale.y;
            
            // Haybale shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(x - haybale.width/2 + 3, y + 3, haybale.width, haybale.height * 0.3);
            
            // Main haybale body
            const haybaleGradient = ctx.createLinearGradient(
                x - haybale.width/2, y - haybale.height/2,
                x + haybale.width/2, y + haybale.height/2
            );
            haybaleGradient.addColorStop(0, '#D2B48C');
            haybaleGradient.addColorStop(0.5, '#DEB887');
            haybaleGradient.addColorStop(1, '#CD853F');
            
            ctx.fillStyle = haybaleGradient;
            ctx.fillRect(x - haybale.width/2, y - haybale.height/2, haybale.width, haybale.height);
            
            // Haybale border
            ctx.strokeStyle = '#8B7355';
            ctx.lineWidth = 2;
            ctx.strokeRect(x - haybale.width/2, y - haybale.height/2, haybale.width, haybale.height);
            
            // Hay texture
            ctx.strokeStyle = '#CD853F';
            ctx.lineWidth = 1;
            const strawCount = 8;
            for (let i = 0; i < strawCount; i++) {
                const strX = x - haybale.width/2 + (haybale.width * (i / strawCount));
                ctx.beginPath();
                ctx.moveTo(strX, y - haybale.height/2);
                ctx.lineTo(strX + 2, y + haybale.height/2);
                ctx.stroke();
            }
            
            // Rope ties
            ctx.strokeStyle = '#5D4E37';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x - haybale.width * 0.3, y - haybale.height/3);
            ctx.lineTo(x + haybale.width * 0.3, y - haybale.height/3);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(x - haybale.width * 0.3, y + haybale.height/3);
            ctx.lineTo(x + haybale.width * 0.3, y + haybale.height/3);
            ctx.stroke();
        });
    }
    
    renderDummies(ctx, size) {
        this.dummies.forEach(dummy => {
            const x = this.x + dummy.x;
            const y = this.y + dummy.y;
            
            // Dummy post/stand
            ctx.fillStyle = '#654321';
            ctx.fillRect(x - 2, y - 25, 4, 30);
            
            // Dummy head (round)
            ctx.fillStyle = '#8B6F47';
            ctx.beginPath();
            ctx.arc(x, y - 25, 6, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            // Dummy body
            ctx.fillStyle = '#A0522D';
            ctx.fillRect(x - 5, y - 18, 10, 12);
            
            // Body details (stitching)
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x - 5, y - 12);
            ctx.lineTo(x + 5, y - 12);
            ctx.stroke();
            
            // Dummy arms (simple)
            ctx.strokeStyle = '#8B6F47';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x - 5, y - 14);
            ctx.lineTo(x - 12, y - 12);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(x + 5, y - 14);
            ctx.lineTo(x + 12, y - 12);
            ctx.stroke();
            
            // Dummy stand base
            ctx.fillStyle = '#5D4E37';
            ctx.fillRect(x - 4, y + 5, 8, 3);
            
            // Arrow stuck in dummy (optional visual)
            if (dummy.type === 'wood') {
                ctx.strokeStyle = '#DC143C';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x + 2, y - 8);
                ctx.lineTo(x + 6, y - 10);
                ctx.stroke();
                
                // Arrow feathers
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.moveTo(x + 6, y - 10);
                ctx.lineTo(x + 8, y - 11);
                ctx.lineTo(x + 7, y - 9);
                ctx.closePath();
                ctx.fill();
            }
        });
    }
    
    renderTargets(ctx, size) {
        this.targets.forEach(target => {
            const x = this.x + target.x;
            const y = this.y + target.y;
            
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(target.rotation);
            
            // Target shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.beginPath();
            ctx.arc(2, 25, 20, 0, Math.PI * 2);
            ctx.fill();
            
            // Target stand
            ctx.fillStyle = '#654321';
            ctx.fillRect(-2, 0, 4, 25);
            
            // Target concentric circles
            const targetRadius = 18;
            const circles = [
                { radius: targetRadius, color: '#DC143C' },
                { radius: targetRadius * 0.7, color: '#FFD700' },
                { radius: targetRadius * 0.4, color: '#DC143C' },
                { radius: targetRadius * 0.15, color: '#FFD700' }
            ];
            
            circles.forEach(circle => {
                ctx.fillStyle = circle.color;
                ctx.beginPath();
                ctx.arc(0, -8, circle.radius, 0, Math.PI * 2);
                ctx.fill();
            });
            
            // Target border
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, -8, targetRadius + 1, 0, Math.PI * 2);
            ctx.stroke();
            
            // Target frame
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 3;
            ctx.strokeRect(-22, -30, 44, 25);
            
            ctx.restore();
        });
    }
    
    renderParticles(ctx) {
        this.trainingParticles.forEach(particle => {
            const alpha = particle.life / particle.maxLife;
            
            if (particle.type === 'arrow') {
                // Simple arrow particle
                ctx.save();
                ctx.translate(particle.x, particle.y);
                const arrowAngle = Math.atan2(particle.vy, particle.vx);
                ctx.rotate(arrowAngle);
                
                ctx.strokeStyle = `rgba(200, 100, 0, ${alpha})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(8, 0);
                ctx.stroke();
                
                ctx.fillStyle = `rgba(255, 150, 0, ${alpha})`;
                ctx.beginPath();
                ctx.moveTo(8, 0);
                ctx.lineTo(10, -2);
                ctx.lineTo(10, 2);
                ctx.closePath();
                ctx.fill();
                
                ctx.restore();
            } else if (particle.type === 'dust') {
                // Dust particle
                ctx.fillStyle = `rgba(139, 90, 43, ${alpha * 0.5})`;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }
    
    isPointInside(x, y, size) {
        const cellSize = size / 4;
        const iconSize = 30;
        const iconX = (this.gridX + 3.5) * cellSize;
        const iconY = (this.gridY + 3.5) * cellSize - 5;
        
        return x >= iconX - iconSize/2 && x <= iconX + iconSize/2 &&
               y >= iconY - iconSize/2 && y <= iconY + iconSize/2;
    }
    
    onClick() {
        this.isSelected = true;
        return {
            type: 'training_menu',
            building: this,
            upgrades: this.getUpgradeOptions()
        };
    }
    
    getUpgradeOptions() {
        return [
            {
                id: 'damageTraining',
                name: 'Damage Training',
                description: `Increase all tower damage by ${this.upgrades.damageTraining.effect} per level`,
                level: this.upgrades.damageTraining.level,
                maxLevel: this.upgrades.damageTraining.maxLevel,
                cost: this.calculateUpgradeCost('damageTraining'),
                icon: '⚔️'
            },
            {
                id: 'speedTraining',
                name: 'Speed Training',
                description: `Increase tower fire rate by ${((this.upgrades.speedTraining.effect - 1) * 100).toFixed(0)}% per level`,
                level: this.upgrades.speedTraining.level,
                maxLevel: this.upgrades.speedTraining.maxLevel,
                cost: this.calculateUpgradeCost('speedTraining'),
                icon: '💨'
            },
            {
                id: 'accuracyTraining',
                name: 'Accuracy Training',
                description: `Reduce tower reload time by ${((1 - this.upgrades.accuracyTraining.effect) * 100).toFixed(0)}% per level`,
                level: this.upgrades.accuracyTraining.level,
                maxLevel: this.upgrades.accuracyTraining.maxLevel,
                cost: this.calculateUpgradeCost('accuracyTraining'),
                icon: '🎯'
            },
            {
                id: 'staminaTraining',
                name: 'Stamina Training',
                description: `Increase tower durability and health by ${((this.upgrades.staminaTraining.effect - 1) * 100).toFixed(0)}% per level`,
                level: this.upgrades.staminaTraining.level,
                maxLevel: this.upgrades.staminaTraining.maxLevel,
                cost: this.calculateUpgradeCost('staminaTraining'),
                icon: '❤️'
            }
        ];
    }
    
    calculateUpgradeCost(upgradeType) {
        const upgrade = this.upgrades[upgradeType];
        if (upgrade.level >= upgrade.maxLevel) return null;
        return Math.floor(upgrade.baseCost * Math.pow(1.4, upgrade.level));
    }
    
    purchaseUpgrade(upgradeType, gameState) {
        const upgrade = this.upgrades[upgradeType];
        const cost = this.calculateUpgradeCost(upgradeType);
        
        if (!cost || gameState.gold < cost || upgrade.level >= upgrade.maxLevel) {
            return false;
        }
        
        gameState.gold -= cost;
        upgrade.level++;
        
        console.log(`TrainingGrounds: Purchased ${upgradeType} upgrade level ${upgrade.level}`);
        return true;
    }
    
    deselect() {
        this.isSelected = false;
    }
    
    applyEffect(buildingManager) {
        // Placeholder for now
        console.log('TrainingGrounds: Applying effects');
    }
    
    static getInfo() {
        return {
            name: 'Training Grounds',
            description: 'Medieval training facility for tower soldiers. Provides combat upgrades.',
            effect: 'Global tower combat bonuses',
            size: '4x4',
            cost: 400
        };
    }
}
