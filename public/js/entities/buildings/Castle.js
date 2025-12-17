import { CastleDefender } from '../defenders/CastleDefender.js';

export class Castle {
    constructor(x, y, gridX, gridY) {
        this.x = x;
        this.y = y;
        this.gridX = gridX;
        this.gridY = gridY;
        this.size = 3;
        this.animationTime = 0;
        
        // Castle health system
        this.health = 100;
        this.maxHealth = 100;
        this.damageFlashTimer = 0;
        this.damageFlashDuration = 0.2;
        
        // Main structure dimensions
        this.wallWidth = 120;
        this.wallHeight = 80;
        this.towerWidth = 35;
        this.towerHeight = 66.5;
        this.bridgeLength = 50;
        this.bridgeHeight = 10;
        
        // Flags on towers - pole base positioned at tower roof peak
        // roofPeakY = topY - creneH - meralonH - roofH
        // where topY = -this.towerHeight = -66.5, creneH = 10, meralonH = 4, roofH = 12
        // roofPeakY = -66.5 - 10 - 4 - 12 = -92.5
        const roofPeakY = -this.towerHeight - 10 - 4 - 12;
        this.flags = [
            { x: -72, y: roofPeakY, rotation: 0.1 },
            { x: 72, y: roofPeakY, rotation: -0.15 }
        ];
        
        // Window lights on wall and towers
        this.lights = [
            { x: -30, y: -20, intensity: 0 },
            { x: 0, y: -20, intensity: 0 },
            { x: 30, y: -20, intensity: 0 },
            { x: -65, y: -40, intensity: 0 },
            { x: 65, y: -40, intensity: 0 }
        ];
        
        this.windowFlicker = [];
        for (let i = 0; i < 5; i++) {
            this.windowFlicker.push(Math.random());
        }
        
        // NEW: Castle upgrade system
        this.isSelected = false;
        this.fortificationLevel = 0;
        this.maxFortificationLevel = 5;
        this.catapultLevel = 0;
        this.maxCatapultLevel = 3;
        
        // Defender system
        this.defender = null; // Currently active defender
        this.defenderDeadCooldown = 0; // Cooldown before hiring new defender after death
        this.maxDefenderCooldown = 10; // 10 seconds cooldown after defender dies
        
    }
    
    update(deltaTime) {
        this.animationTime += deltaTime;
        
        // Update damage flash effect
        if (this.damageFlashTimer > 0) {
            this.damageFlashTimer -= deltaTime;
        }
        
        // Update defender cooldown
        if (this.defenderDeadCooldown > 0) {
            this.defenderDeadCooldown -= deltaTime;
        }
        
        this.lights.forEach((light, i) => {
            this.windowFlicker[i] += Math.random() - 0.5;
            this.windowFlicker[i] = Math.max(0, Math.min(1, this.windowFlicker[i]));
            light.intensity = 0.24 + this.windowFlicker[i] * 0.6;
        });
    }
    
    takeDamage(amount) {
        this.health -= amount;
        this.damageFlashTimer = this.damageFlashDuration;
    }
    
    isDestroyed() {
        return this.health <= 0;
    }
    
    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Damage flash effect
        if (this.damageFlashTimer > 0) {
            const flashIntensity = this.damageFlashTimer / this.damageFlashDuration;
            ctx.fillStyle = `rgba(255, 100, 100, ${flashIntensity * 0.5})`;
            ctx.fillRect(-this.wallWidth/2 - 50, -this.wallHeight/2 - 50, this.wallWidth + 100, this.wallHeight + 100);
        }
        
        // Draw main wall first (background)
        this.drawMainWall(ctx);
        
        // Draw left tower with front perspective
        this.drawTower(ctx, -this.wallWidth/2 - this.towerWidth/2, 'left');
        
        // Draw right tower with front perspective
        this.drawTower(ctx, this.wallWidth/2 + this.towerWidth/2, 'right');
        
        // Draw castle base to cover floating bricks
        this.drawCastleBase(ctx);
        
        // Draw gate
        this.drawGate(ctx);
        
        // Draw crenellations on top of wall
        this.drawCrenellations(ctx);
        
        // Draw flags on towers
        this.drawFlags(ctx);
        
        ctx.restore();
        
        // Draw health bar above castle (world space, not translated)
        this.drawHealthBar(ctx);
    }
    
    drawHealthBar(ctx) {
        const barWidth = 120;
        const barHeight = 12;
        const barX = this.x - barWidth / 2;
        const barY = this.y - 125;
        
        // Background
        ctx.fillStyle = '#000000';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Health fill
        const healthPercent = Math.max(0, this.health / this.maxHealth);
        const fillColor = healthPercent > 0.5 ? '#4CAF50' : (healthPercent > 0.25 ? '#FFC107' : '#F44336');
        ctx.fillStyle = fillColor;
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        
        // Border
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // Health text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${Math.ceil(this.health)}/${this.maxHealth}`, this.x, barY + barHeight / 2);
    }
    

    
    drawTower(ctx, x, side) {
        ctx.save();
        ctx.translate(x, 0);
        
        // Tower front face - narrower at top, wider at base
        const towerTopW = this.towerWidth * 0.85;
        const baseY = this.wallHeight/2;
        const topY = -this.towerHeight;
        
        // Tower main body with slight taper
        const towerGrad = ctx.createLinearGradient(0, topY, 0, baseY);
        towerGrad.addColorStop(0, '#9A8B7B');
        towerGrad.addColorStop(0.5, '#8A7B6B');
        towerGrad.addColorStop(1, '#7A6B5B');
        
        ctx.fillStyle = towerGrad;
        ctx.beginPath();
        ctx.moveTo(-this.towerWidth/2, baseY);
        ctx.lineTo(-towerTopW/2, topY);
        ctx.lineTo(towerTopW/2, topY);
        ctx.lineTo(this.towerWidth/2, baseY);
        ctx.closePath();
        ctx.fill();
        
        // Tower outline
        ctx.strokeStyle = '#3D3830';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-this.towerWidth/2, baseY);
        ctx.lineTo(-towerTopW/2, topY);
        ctx.lineTo(towerTopW/2, topY);
        ctx.lineTo(this.towerWidth/2, baseY);
        ctx.closePath();
        ctx.stroke();
        
        // Tower stone brick pattern - optimized tight spacing
        ctx.strokeStyle = '#5D5247';
        ctx.lineWidth = 0.7;
        const blockW = this.towerWidth / 6;
        const blockH = 10.5; // Fixed brick height
        
        for (let y = topY; y < baseY; y += blockH) {
            const rowFraction = (y - topY) / this.towerHeight;
            const rowW = towerTopW + (this.towerWidth - towerTopW) * rowFraction;
            const offsetX = (Math.abs(y - topY) / blockH) % 2 * blockW/2;
            const halfRowW = rowW / 2;
            
            // Draw more bricks to fill the wider base
            for (let i = 0; i < 6; i++) {
                const xPos = -rowW/2 + (i * blockW);
                const brickLeft = xPos + offsetX;
                const brickRight = brickLeft + (blockW - 0.8);
                
                // Strictly clip bricks to tower bounds - no overflow
                if (brickLeft >= -halfRowW && brickRight <= halfRowW) {
                    ctx.strokeRect(brickLeft, y, blockW - 0.8, blockH - 0.8);
                }
            }
        }
        
        // Stone highlights
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        for (let y = topY + 1.5; y < baseY; y += blockH) {
            const rowFraction = (y - topY) / this.towerHeight;
            const rowW = towerTopW + (this.towerWidth - towerTopW) * rowFraction;
            const offsetX = (Math.abs(y - topY) / blockH) % 2 * blockW/2;
            const halfRowW = rowW / 2;
            
            for (let i = 0; i < 6; i++) {
                const xPos = -rowW/2 + (i * blockW);
                const highlightLeft = xPos + offsetX + 1.5;
                const highlightRight = highlightLeft + blockW/3;
                
                // Strictly clip highlights to tower width at this row
                if (highlightLeft >= -halfRowW && highlightRight <= halfRowW) {
                    ctx.fillRect(highlightLeft, y + 1.5, blockW/3, blockH/3);
                }
            }
        }
        
        // Tower windows - vertical arrangement
        const windowSize = 3.5;
        const windowPositions = [
            { x: 0, y: -50 },
            { x: 0, y: -30 },
            { x: 0, y: -10 }
        ];
        
        windowPositions.forEach((pos, idx) => {
            ctx.fillStyle = '#1A1815';
            ctx.fillRect(pos.x - windowSize/2, pos.y - windowSize/2, windowSize, windowSize);
            
            ctx.strokeStyle = '#3D3830';
            ctx.lineWidth = 0.8;
            ctx.strokeRect(pos.x - windowSize/2, pos.y - windowSize/2, windowSize, windowSize);
            
            const intensity = this.lights[3 + (side === 'left' ? 0 : 1)] ? this.lights[3 + (side === 'left' ? 0 : 1)].intensity : 0.5;
            ctx.fillStyle = `rgba(255, 180, 100, ${intensity * 0.4})`;
            ctx.fillRect(pos.x - windowSize/2 + 0.3, pos.y - windowSize/2 + 0.3, windowSize - 0.6, windowSize - 0.6);
            
            // Window cross
            ctx.strokeStyle = '#3D3830';
            ctx.lineWidth = 0.4;
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y - windowSize/2);
            ctx.lineTo(pos.x, pos.y + windowSize/2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(pos.x - windowSize/2, pos.y);
            ctx.lineTo(pos.x + windowSize/2, pos.y);
            ctx.stroke();
        });
        
        // Tower top - integrated crenellations (short, 10px)
        const creneH = 10;
        
        ctx.fillStyle = '#7A6D5D';
        ctx.fillRect(-towerTopW/2, topY - creneH, towerTopW, creneH);
        ctx.strokeStyle = '#3D3830';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(-towerTopW/2, topY - creneH, towerTopW, creneH);
        
        // Crenellation merlons (small raised parts)
        const meralonW = towerTopW/4;
        const meralonH = 4;
        
        // Left merlon
        ctx.fillRect(-towerTopW/2 + 2, topY - creneH - meralonH, meralonW - 3, meralonH);
        ctx.strokeRect(-towerTopW/2 + 2, topY - creneH - meralonH, meralonW - 3, meralonH);
        
        // Center merlon
        ctx.fillRect(-meralonW/2 + 2, topY - creneH - meralonH, meralonW - 3, meralonH);
        ctx.strokeRect(-meralonW/2 + 2, topY - creneH - meralonH, meralonW - 3, meralonH);
        
        // Right merlon
        ctx.fillRect(towerTopW/2 - meralonW + 1, topY - creneH - meralonH, meralonW - 3, meralonH);
        ctx.strokeRect(towerTopW/2 - meralonW + 1, topY - creneH - meralonH, meralonW - 3, meralonH);
        
        // Minimal roof cap - taller peak for flags
        const roofH = 12;
        const roofPeakY = topY - creneH - meralonH - roofH;
        
        ctx.fillStyle = '#5A4A3A';
        ctx.beginPath();
        ctx.moveTo(-towerTopW/2, topY - creneH - meralonH);
        ctx.lineTo(0, roofPeakY);
        ctx.lineTo(towerTopW/2, topY - creneH - meralonH);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = '#3D2810';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Left roof side face
        ctx.fillStyle = 'rgba(80, 70, 60, 0.8)';
        ctx.beginPath();
        ctx.moveTo(-towerTopW/2, topY - creneH - meralonH);
        ctx.lineTo(0, roofPeakY);
        ctx.lineTo(-2, roofPeakY - 2);
        ctx.lineTo(-towerTopW/2 - 2, topY - creneH - meralonH - 2);
        ctx.closePath();
        ctx.fill();
        
        // Right roof side face
        ctx.fillStyle = 'rgba(60, 50, 40, 0.8)';
        ctx.beginPath();
        ctx.moveTo(towerTopW/2, topY - creneH - meralonH);
        ctx.lineTo(0, roofPeakY);
        ctx.lineTo(2, roofPeakY - 2);
        ctx.lineTo(towerTopW/2 + 2, topY - creneH - meralonH - 2);
        ctx.closePath();
        ctx.fill();
        
        // 3D top face of tower platform only (no side face)
        ctx.fillStyle = 'rgba(100, 85, 70, 0.7)';
        ctx.beginPath();
        ctx.moveTo(-towerTopW/2, topY - creneH);
        ctx.lineTo(towerTopW/2, topY - creneH);
        ctx.lineTo(towerTopW/2 - 2, topY - creneH - 2);
        ctx.lineTo(-towerTopW/2 - 2, topY - creneH - 2);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = '#2D2520';
        ctx.lineWidth = 0.8;
        ctx.stroke();
        
        ctx.restore();
    }
    
    drawMainWall(ctx) {
        // Main wall gradient
        const wallGrad = ctx.createLinearGradient(-this.wallWidth/2, -this.wallHeight/2, this.wallWidth/2, this.wallHeight/2);
        wallGrad.addColorStop(0, '#8B7D6B');
        wallGrad.addColorStop(0.5, '#7A6D5D');
        wallGrad.addColorStop(1, '#6B5D4D');
        
        ctx.fillStyle = wallGrad;
        ctx.fillRect(-this.wallWidth/2, -this.wallHeight/2, this.wallWidth, this.wallHeight);
        
        // Wall outline
        ctx.strokeStyle = '#3D3830';
        ctx.lineWidth = 2;
        ctx.strokeRect(-this.wallWidth/2, -this.wallHeight/2, this.wallWidth, this.wallHeight);
        
        // Wall stone brick pattern - optimized tight spacing
        ctx.strokeStyle = '#5D5247';
        ctx.lineWidth = 0.7;
        const blockW = this.wallWidth / 12;
        const blockH = this.wallHeight / 8;
        
        for (let y = -this.wallHeight/2; y < this.wallHeight/2; y += blockH) {
            const offsetX = (Math.abs(y + this.wallHeight/2) / blockH) % 2 * blockW/2;
            for (let x = -this.wallWidth/2; x < this.wallWidth/2; x += blockW) {
                ctx.strokeRect(x + offsetX, y, blockW - 0.8, blockH - 0.8);
            }
        }
        
        // Wall stone highlights
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        for (let y = -this.wallHeight/2 + 1.5; y < this.wallHeight/2; y += blockH) {
            const offsetX = (Math.abs(y + this.wallHeight/2) / blockH) % 2 * blockW/2;
            for (let x = -this.wallWidth/2 + 1.5; x < this.wallWidth/2; x += blockW) {
                ctx.fillRect(x + offsetX, y, blockW/3, blockH/3);
            }
        }
        
        ctx.fillStyle = 'rgba(107, 93, 77, 0.8)';
        ctx.beginPath();
        ctx.moveTo(this.wallWidth/2, -this.wallHeight/2);
        ctx.lineTo(this.wallWidth/2 + 8, -this.wallHeight/2 - 4);
        ctx.lineTo(this.wallWidth/2 + 8, this.wallHeight/2 - 4);
        ctx.lineTo(this.wallWidth/2, this.wallHeight/2);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = 'rgba(155, 140, 120, 0.6)';
        ctx.beginPath();
        ctx.moveTo(-this.wallWidth/2, -this.wallHeight/2);
        ctx.lineTo(this.wallWidth/2, -this.wallHeight/2);
        ctx.lineTo(this.wallWidth/2 + 8, -this.wallHeight/2 - 4);
        ctx.lineTo(-this.wallWidth/2 + 8, -this.wallHeight/2 - 4);
        ctx.closePath();
        ctx.fill();
        
        // Windows on main wall
        this.drawWallWindows(ctx);
    }
    
    drawWallWindows(ctx) {
        const windowSize = 4;
        const windowColor = '#1A1815';
        
        const positions = [
            { x: -30, y: -20 },
            { x: 0, y: -20 },
            { x: 30, y: -20 }
        ];
        
        positions.forEach((pos, idx) => {
            ctx.fillStyle = windowColor;
            ctx.fillRect(pos.x - windowSize/2, pos.y - windowSize/2, windowSize, windowSize);
            
            ctx.strokeStyle = '#3D3830';
            ctx.lineWidth = 0.8;
            ctx.strokeRect(pos.x - windowSize/2, pos.y - windowSize/2, windowSize, windowSize);
            
            const intensity = this.lights[idx] ? this.lights[idx].intensity : 0.5;
            ctx.fillStyle = `rgba(255, 200, 100, ${intensity * 0.5})`;
            ctx.fillRect(pos.x - windowSize/2 + 0.5, pos.y - windowSize/2 + 0.5, windowSize - 1, windowSize - 1);
            
            // Window cross
            ctx.strokeStyle = '#3D3830';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y - windowSize/2);
            ctx.lineTo(pos.x, pos.y + windowSize/2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(pos.x - windowSize/2, pos.y);
            ctx.lineTo(pos.x + windowSize/2, pos.y);
            ctx.stroke();
        });
    }
    
    drawGate(ctx) {
        const gateW = 40;
        const gateH = 50;
        
        // Gate shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(-gateW/2 + 2, this.wallHeight/2 - gateH + 1, gateW, gateH);
        
        // Gate door
        ctx.fillStyle = '#4A3A2A';
        ctx.fillRect(-gateW/2, this.wallHeight/2 - gateH, gateW, gateH);
        
        ctx.strokeStyle = '#2C1810';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-gateW/2, this.wallHeight/2 - gateH, gateW, gateH);
        
        // Gate center seam
        ctx.beginPath();
        ctx.moveTo(0, this.wallHeight/2 - gateH);
        ctx.lineTo(0, this.wallHeight/2);
        ctx.stroke();
        
        // Metal bands
        ctx.strokeStyle = '#8B7355';
        ctx.lineWidth = 2;
        for (let i = 1; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(-gateW/2 + 2, this.wallHeight/2 - gateH + (i * gateH/3));
            ctx.lineTo(gateW/2 - 2, this.wallHeight/2 - gateH + (i * gateH/3));
            ctx.stroke();
        }
        
        // Gate studs
        ctx.fillStyle = '#654321';
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 3; j++) {
                ctx.beginPath();
                ctx.arc(-gateW/4 + i * gateW/6, this.wallHeight/2 - gateH + gateH/6 + j * gateH/4, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Gate knocker
        ctx.fillStyle = '#D4AF37';
        ctx.beginPath();
        ctx.arc(gateW/2 - 6, this.wallHeight/2 - gateH/2, 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#8B7500';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(gateW/2 - 6, this.wallHeight/2 - gateH/2, 2, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    drawCrenellations(ctx) {
        const creneHeight = 14;
        const creneWidth = 12;
        const creneSpacing = 16;
        
        ctx.fillStyle = '#7A6D5D';
        ctx.strokeStyle = '#3D3830';
        ctx.lineWidth = 0.8;
        
        for (let x = -this.wallWidth/2 + 8; x < this.wallWidth/2; x += creneSpacing) {
            ctx.fillRect(x, -this.wallHeight/2 - creneHeight, creneWidth, creneHeight);
            ctx.strokeRect(x, -this.wallHeight/2 - creneHeight, creneWidth, creneHeight);
        }
    }
    
    drawCastleBase(ctx) {
        // Draw a stone base platform below the castle to connect walls to ground
        const baseWidth = this.wallWidth + 100;  // Extend beyond castle walls
        const baseHeight = 30;  // Taller base for proper connection
        const baseY = this.wallHeight / 2;  // At the bottom of the wall
        
        // Stone base gradient - darker at bottom, lighter at top
        const baseGrad = ctx.createLinearGradient(0, baseY, 0, baseY + baseHeight);
        baseGrad.addColorStop(0, '#6B5D4D');
        baseGrad.addColorStop(0.3, '#5A4D3D');
        baseGrad.addColorStop(1, '#4A3D2D');
        
        ctx.fillStyle = baseGrad;
        ctx.fillRect(-baseWidth/2, baseY, baseWidth, baseHeight);
        
        // Base outline
        ctx.strokeStyle = '#2D1810';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-baseWidth/2, baseY, baseWidth, baseHeight);
        
        // Stone block pattern on base
        ctx.strokeStyle = '#3D2810';
        ctx.lineWidth = 0.6;
        const blockSize = 20;
        
        for (let x = -baseWidth/2; x < baseWidth/2; x += blockSize) {
            // Vertical lines
            ctx.beginPath();
            ctx.moveTo(x, baseY);
            ctx.lineTo(x, baseY + baseHeight);
            ctx.stroke();
            
            // Horizontal line in middle
            ctx.beginPath();
            ctx.moveTo(x, baseY + baseHeight/2);
            ctx.lineTo(x + blockSize, baseY + baseHeight/2);
            ctx.stroke();
        }
        
        // Add subtle shadows/highlights on base blocks for depth
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        for (let x = -baseWidth/2; x < baseWidth/2; x += blockSize) {
            ctx.fillRect(x, baseY + baseHeight/2, blockSize, baseHeight/2);
        }
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        for (let x = -baseWidth/2; x < baseWidth/2; x += blockSize) {
            ctx.fillRect(x, baseY, blockSize, baseHeight/2);
        }
    }
    
    drawFlags(ctx) {
        this.flags.forEach((flag, idx) => {
            ctx.save();
            ctx.translate(flag.x, flag.y);
            
            // Flag pole extends upward from base to roof peak
            ctx.strokeStyle = '#5A4A3A';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, -15);  // Draw upward (negative Y)
            ctx.stroke();
            
            // Flag - animated waving
            const wave = Math.sin(this.animationTime * 4 + idx) * 0.1;
            ctx.fillStyle = idx === 0 ? '#CC3333' : '#334DBF';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(12 + wave * 6, 4, 0, 10);
            ctx.lineTo(0, 0);
            ctx.closePath();
            ctx.fill();
            
            ctx.strokeStyle = '#2D2520';
            ctx.lineWidth = 0.5;
            ctx.stroke();
            
            ctx.restore();
        });
    }
    
    isPointInside(x, y, cellSize) {
        // If cellSize not provided, calculate it (same as render method)
        if (!cellSize) {
            // This shouldn't happen in normal gameplay, but fallback to default
            cellSize = 32;
        }
        
        // Large clickable area centered on castle for the entire structure
        // Castle is at screen position (this.x, this.y), much larger than icon
        const castleClickWidth = 200;
        const castleClickHeight = 180;
        
        return x >= this.x - castleClickWidth/2 && x <= this.x + castleClickWidth/2 &&
               y >= this.y - castleClickHeight/2 && y <= this.y + castleClickHeight/2;
    }
    
    onClick(trainingGrounds) {
        this.isSelected = true;
        return {
            type: 'castle_menu',
            castle: this,
            trainingGrounds: trainingGrounds,
            upgrades: this.getUpgradeOptions()
        };
    }
    
    getUpgradeOptions() {
        return [
            {
                id: 'fortification',
                name: 'Fortification',
                description: `Strengthen castle walls to increase max health by ${50 * (this.fortificationLevel + 1)}`,
                level: this.fortificationLevel,
                maxLevel: this.maxFortificationLevel,
                cost: this.calculateFortificationCost(),
                icon: '🛡️',
                currentEffect: `Max Health: ${this.maxHealth}`
            },
            {
                id: 'catapult',
                name: 'Catapult Defense',
                description: 'Deploy catapults to attack enemies before they reach the castle',
                level: this.catapultLevel,
                maxLevel: this.maxCatapultLevel,
                cost: this.calculateCatapultCost(),
                icon: '🎯',
                currentEffect: this.catapultLevel > 0 ? `Level ${this.catapultLevel} Active` : 'Inactive'
            }
        ];
    }
    
    calculateFortificationCost() {
        if (this.fortificationLevel >= this.maxFortificationLevel) return null;
        return Math.floor(400 * Math.pow(1.4, this.fortificationLevel));
    }
    
    calculateCatapultCost() {
        if (this.catapultLevel >= this.maxCatapultLevel) return null;
        return Math.floor(600 * Math.pow(1.5, this.catapultLevel));
    }
    
    purchaseUpgrade(upgradeId, gameState) {
        if (upgradeId === 'fortification') {
            return this.purchaseFortification(gameState);
        } else if (upgradeId === 'catapult') {
            return this.purchaseCatapult(gameState);
        }
        return false;
    }
    
    purchaseFortification(gameState) {
        const cost = this.calculateFortificationCost();
        
        if (!cost || gameState.gold < cost || this.fortificationLevel >= this.maxFortificationLevel) {
            return false;
        }
        
        gameState.gold -= cost;
        this.fortificationLevel++;
        this.maxHealth += 50;
        this.health = this.maxHealth;
        
        return true;
    }
    
    purchaseCatapult(gameState) {
        const cost = this.calculateCatapultCost();
        
        if (!cost || gameState.gold < cost || this.catapultLevel >= this.maxCatapultLevel) {
            return false;
        }
        
        gameState.gold -= cost;
        this.catapultLevel++;
        
        return true;
    }
    
    deselect() {
        this.isSelected = false;
    }
    
    /**
     * Hire a defender of the specified level
     * Can only hire if no defender is alive and cooldown has expired
     */
    hireDefender(defenderLevel, gameState) {
        // Check if we can hire
        if (this.defender && !this.defender.isDead()) {
            return false;
        }
        
        // Check cooldown after defender death
        if (this.defenderDeadCooldown > 0) {
            return false;
        }
        
        // Calculate cost based on level
        const cost = this.calculateDefenderCost(defenderLevel);
        if (!cost || gameState.gold < cost) {
            return false;
        }
        
        gameState.spend(cost);
        
        // Create new defender at this position
        this.defender = new CastleDefender(defenderLevel);
        this.defender.x = this.x - 60; // Position in front of castle
        this.defender.y = this.y + 40; // Ground level
        
        return true;
    }
    
    /**
     * Calculate the cost to hire a defender
     */
    calculateDefenderCost(level) {
        switch(level) {
            case 1:
                return 200;
            case 2:
                return 350;
            case 3:
                return 500;
            default:
                return null;
        }
    }
    
    /**
     * Check if defender has died and start cooldown
     */
    checkDefenderDeath() {
        if (this.defender && this.defender.isDead() && this.defenderDeadCooldown <= 0) {
            this.defenderDeadCooldown = this.maxDefenderCooldown;
        }
    }
    
    /**
     * Get defender hiring options for the castle menu
     */
    getDefenderHiringOptions(trainingGrounds) {
        const options = [];
        
        // Check if defender is already active
        if (this.defender && !this.defender.isDead()) {
            return [{
                id: 'defender_active',
                name: `Defender Level ${this.defender.level} Active`,
                description: `Your defender is actively protecting the castle (${this.defender.health}/${this.defender.maxHealth} HP)`,
                type: 'defender_status',
                canHire: false,
                icon: '🛡️'
            }];
        }
        
        // Show cooldown message if in cooldown
        if (this.defenderDeadCooldown > 0) {
            return [{
                id: 'defender_cooldown',
                name: 'Hiring Cooldown',
                description: `Your defender needs time to recover. Ready in ${this.defenderDeadCooldown.toFixed(1)}s`,
                type: 'defender_status',
                canHire: false,
                icon: '🛡️'
            }];
        }
        
        // Defender system not unlocked
        if (!trainingGrounds || !trainingGrounds.defenderUnlocked) {
            return [{
                id: 'defender_locked',
                name: 'Defender System Locked',
                description: 'Upgrade Training Grounds to Level 3 to unlock the Defender system',
                type: 'defender_status',
                canHire: false,
                icon: '🔒'
            }];
        }
        
        // Level 1 Defender always available
        options.push({
            id: 'defender_1',
            name: 'Hire Level 1 Defender',
            description: 'Light armored soldier with sword and shield (150 HP, 8 DMG)',
            type: 'defender_hire',
            level: 1,
            cost: this.calculateDefenderCost(1),
            canHire: true,
            icon: '⚔️'
        });
        
        // Level 2 Defender if unlocked
        if (trainingGrounds.defenderMaxLevel >= 2) {
            options.push({
                id: 'defender_2',
                name: 'Hire Level 2 Defender',
                description: 'Medium armored knight with two-handed sword (300 HP, 15 DMG)',
                type: 'defender_hire',
                level: 2,
                cost: this.calculateDefenderCost(2),
                canHire: true,
                icon: '⚔️'
            });
        }
        
        // Level 3 Defender if unlocked
        if (trainingGrounds.defenderMaxLevel >= 3) {
            options.push({
                id: 'defender_3',
                name: 'Hire Level 3 Defender',
                description: 'Heavy armored tank with massive sword (500 HP, 25 DMG)',
                type: 'defender_hire',
                level: 3,
                cost: this.calculateDefenderCost(3),
                canHire: true,
                icon: '⚔️'
            });
        }
        
        return options;
    }
    
    static getInfo() {
        return {
            name: 'Castle',
            description: 'Fortress with connecting bridge, main wall, and corner towers.',
            size: '3x3',
            cost: 0
        };
    }
}
