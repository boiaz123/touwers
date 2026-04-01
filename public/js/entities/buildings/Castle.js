import { CastleDefender } from '../defenders/CastleDefender.js';

export class Castle {
    constructor(x, y, gridX, gridY) {
        this.x = x;
        this.y = y;
        this.gridX = gridX;
        this.gridY = gridY;
        this.size = 3;
        this.gridWidth = 3;  // Updated by createCastle based on approach direction
        this.gridHeight = 3; // Updated by createCastle based on approach direction
        this.gateAngle = 0;  // Rotation so gate faces the path end (radians, CCW)
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
        this.reinforcementLevel = 0; // Unlocked at TowerForge level 5
        this.maxReinforcementLevel = 5;
        
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
            this.windowFlicker[i] += (Math.random() - 0.5) * deltaTime * 0.9;
            this.windowFlicker[i] = Math.max(0.15, Math.min(0.85, this.windowFlicker[i]));
            light.intensity = 0.48 + this.windowFlicker[i] * 0.32;
        });
    }
    
    takeDamage(amount) {
        this.health -= amount;
        this.damageFlashTimer = this.damageFlashDuration;
    }
    
    isDestroyed() {
        return this.health <= 0;
    }
    
    revive() {
        this.health = this.maxHealth;
        this.damageFlashTimer = this.damageFlashDuration;
    }
    
    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        if (this.gateAngle) ctx.rotate(this.gateAngle);
        
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
        
        // Tower windows - vertical arrangement with arched tops
        const winW = 5;
        const winH = 7;
        const windowPositions = [
            { x: 0, y: -50 },
            { x: 0, y: -32 },
            { x: 0, y: -14 }
        ];
        
        windowPositions.forEach((pos) => {
            const wx = pos.x - winW / 2;
            const wy = pos.y - winH / 2;
            
            // Stone surround
            ctx.fillStyle = '#6B5F52';
            ctx.fillRect(wx - 1.5, wy - 1, winW + 3, winH + 1);
            ctx.beginPath();
            ctx.arc(pos.x, wy, winW / 2 + 1.5, Math.PI, 0);
            ctx.fill();
            
            // Window interior dark
            ctx.fillStyle = '#100E0C';
            ctx.fillRect(wx, wy, winW, winH);
            ctx.beginPath();
            ctx.arc(pos.x, wy, winW / 2, Math.PI, 0);
            ctx.fill();
            
            // Window frame
            ctx.strokeStyle = '#2A2520';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(wx, pos.y + winH / 2);
            ctx.lineTo(wx, wy);
            ctx.arc(pos.x, wy, winW / 2, Math.PI, 0);
            ctx.lineTo(wx + winW, pos.y + winH / 2);
            ctx.closePath();
            ctx.stroke();
            
            // Warm glow
            const lightIdx = 3 + (side === 'left' ? 0 : 1);
            const intensity = this.lights[lightIdx] ? this.lights[lightIdx].intensity : 0.5;
            if (intensity > 0.15) {
                ctx.fillStyle = `rgba(255, 180, 100, ${intensity * 0.4})`;
                ctx.fillRect(wx + 1, wy + 1, winW - 2, winH - 2);
                ctx.beginPath();
                ctx.arc(pos.x, wy, winW / 2 - 1, Math.PI, 0);
                ctx.fill();
            }
        });
        
        // Tower top - integrated crenellations (short, 10px)
        const creneH = 10;
        
        ctx.fillStyle = '#7A6D5D';
        ctx.fillRect(-towerTopW/2, topY - creneH, towerTopW, creneH);
        ctx.strokeStyle = '#3D3830';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(-towerTopW/2, topY - creneH, towerTopW, creneH);
        
        // Crenellation merlons - 3 symmetrically spaced
        const meralonW = 5;
        const meralonH = 5;
        const meralonGap = (towerTopW - 3 * meralonW) / 4;
        const mBaseY = topY - creneH - meralonH;
        
        for (let m = 0; m < 3; m++) {
            const mx = -towerTopW / 2 + meralonGap + m * (meralonW + meralonGap);
            ctx.fillStyle = '#7A6D5D';
            ctx.fillRect(mx, mBaseY, meralonW, meralonH);
            ctx.strokeStyle = '#3D3830';
            ctx.lineWidth = 0.8;
            ctx.strokeRect(mx, mBaseY, meralonW, meralonH);
            // Top highlight for subtle 3D depth
            ctx.fillStyle = 'rgba(180, 165, 150, 0.35)';
            ctx.fillRect(mx, mBaseY, meralonW, 1.5);
        }
        
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
        const winW = 6;
        const winH = 9;
        
        const positions = [
            { x: -30, y: -20 },
            { x: 0, y: -20 },
            { x: 30, y: -20 }
        ];
        
        positions.forEach((pos, idx) => {
            const wx = pos.x - winW / 2;
            const wy = pos.y - winH / 2;
            
            // Stone surround (keystone arch)
            ctx.fillStyle = '#6B5F52';
            ctx.fillRect(wx - 2, wy - 1, winW + 4, winH + 1);
            ctx.beginPath();
            ctx.arc(pos.x, wy, winW / 2 + 2, Math.PI, 0);
            ctx.fill();
            
            // Window interior dark
            ctx.fillStyle = '#100E0C';
            ctx.fillRect(wx, wy, winW, winH);
            ctx.beginPath();
            ctx.arc(pos.x, wy, winW / 2, Math.PI, 0);
            ctx.fill();
            
            // Window frame outline
            ctx.strokeStyle = '#2A2520';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(wx, pos.y + winH / 2);
            ctx.lineTo(wx, wy);
            ctx.arc(pos.x, wy, winW / 2, Math.PI, 0);
            ctx.lineTo(wx + winW, pos.y + winH / 2);
            ctx.closePath();
            ctx.stroke();
            
            // Warm inner light
            const intensity = this.lights[idx] ? this.lights[idx].intensity : 0.5;
            if (intensity > 0.15) {
                ctx.fillStyle = `rgba(255, 200, 100, ${intensity * 0.45})`;
                ctx.fillRect(wx + 1, wy + 1, winW - 2, winH - 2);
                ctx.beginPath();
                ctx.arc(pos.x, wy, winW / 2 - 1, Math.PI, 0);
                ctx.fill();
            }
        });
    }
    
    drawGate(ctx) {
        const gateW = 40;
        const gateH = 50;
        const gateTopY = this.wallHeight / 2 - gateH;
        const gateBotY = this.wallHeight / 2;
        
        // Stone arch keystone surround
        ctx.fillStyle = '#6B5F52';
        ctx.beginPath();
        ctx.arc(0, gateTopY, gateW / 2 + 5, Math.PI, 0);
        ctx.fill();
        ctx.strokeStyle = '#3D3830';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, gateTopY, gateW / 2 + 5, Math.PI, 0);
        ctx.stroke();
        
        // Gate shadow offset
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(-gateW / 2 + 2, gateTopY + 1, gateW, gateH);
        
        // Gate door panels
        ctx.fillStyle = '#4A3A2A';
        ctx.fillRect(-gateW / 2, gateTopY, gateW, gateH);
        
        // Dark arch void cut into gate top
        ctx.fillStyle = '#100E0C';
        ctx.beginPath();
        ctx.arc(0, gateTopY, gateW / 2, Math.PI, 0);
        ctx.fill();
        
        // Gate outline
        ctx.strokeStyle = '#2C1810';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-gateW / 2, gateTopY, gateW, gateH);
        
        // Center seam
        ctx.beginPath();
        ctx.moveTo(0, gateTopY);
        ctx.lineTo(0, gateBotY);
        ctx.stroke();
        
        // Metal bands
        ctx.strokeStyle = '#7A6B50';
        ctx.lineWidth = 2;
        for (let i = 1; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(-gateW / 2 + 2, gateTopY + (i * gateH / 3));
            ctx.lineTo(gateW / 2 - 2, gateTopY + (i * gateH / 3));
            ctx.stroke();
        }
        
        // Gate studs
        ctx.fillStyle = '#7A6040';
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 3; j++) {
                ctx.beginPath();
                ctx.arc(-gateW / 4 + i * gateW / 6, gateTopY + gateH / 6 + j * gateH / 4, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Gate knockers - one on each door panel
        const knockerY = gateTopY + gateH * 0.55;
        [-gateW / 4, gateW / 4].forEach(kx => {
            ctx.fillStyle = '#D4AF37';
            ctx.beginPath();
            ctx.arc(kx, knockerY, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#8B7500';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(kx, knockerY, 2, 0, Math.PI * 2);
            ctx.stroke();
        });
    }
    
    drawCrenellations(ctx) {
        const creneHeight = 14;
        const creneWidth = 12;
        const creneSpacing = 16;
        const numMerlons = 7;
        const totalPatternW = (numMerlons - 1) * creneSpacing + creneWidth;
        const startX = -totalPatternW / 2;
        const merY = -this.wallHeight / 2 - creneHeight;
        
        for (let i = 0; i < numMerlons; i++) {
            const x = startX + i * creneSpacing;
            ctx.fillStyle = '#7A6D5D';
            ctx.fillRect(x, merY, creneWidth, creneHeight);
            ctx.strokeStyle = '#3D3830';
            ctx.lineWidth = 0.8;
            ctx.strokeRect(x, merY, creneWidth, creneHeight);
            // Subtle top highlight for 3D depth
            ctx.fillStyle = 'rgba(175, 160, 145, 0.35)';
            ctx.fillRect(x, merY, creneWidth, 2);
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
        const options = [
            {
                id: 'fortification',
                name: 'Fortification',
                description: `Strengthen castle walls (+${50} max health)`,
                level: this.fortificationLevel,
                maxLevel: this.maxFortificationLevel,
                cost: this.calculateFortificationCost(),
                icon: "<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><rect x='2' y='20' width='36' height='18' fill='#8B7355' stroke='#3D3020' stroke-width='1.2'/><rect x='2' y='12' width='8' height='8' fill='#7A6345' stroke='#3D3020' stroke-width='1'/><rect x='16' y='12' width='8' height='8' fill='#7A6345' stroke='#3D3020' stroke-width='1'/><rect x='30' y='12' width='8' height='8' fill='#7A6345' stroke='#3D3020' stroke-width='1'/><line x1='2' y1='27' x2='38' y2='27' stroke='#3D3020' stroke-width='0.8'/><line x1='2' y1='33' x2='38' y2='33' stroke='#3D3020' stroke-width='0.8'/><line x1='10' y1='20' x2='10' y2='38' stroke='#3D3020' stroke-width='0.8'/><line x1='20' y1='20' x2='20' y2='38' stroke='#3D3020' stroke-width='0.8'/><line x1='30' y1='20' x2='30' y2='38' stroke='#3D3020' stroke-width='0.8'/><path d='M16 38 L16 29 Q20 24 24 29 L24 38 Z' fill='#1A0A00' stroke='#3D3020' stroke-width='0.8'/><rect x='3' y='13' width='3' height='3' rx='0.5' fill='rgba(255,200,50,0.25)'/><rect x='17' y='13' width='3' height='3' rx='0.5' fill='rgba(255,200,50,0.25)'/><rect x='31' y='13' width='3' height='3' rx='0.5' fill='rgba(255,200,50,0.25)'/></svg>",
                currentEffect: `Max Health: ${this.maxHealth}`
            }
        ];
        return options;
    }
    
    calculateFortificationCost() {
        const costs = [400, 600, 900, 1300, 1800];
        if (this.fortificationLevel >= this.maxFortificationLevel) return null;
        return costs[this.fortificationLevel] || null;
    }
    
    calculateCatapultCost() {
        if (this.catapultLevel >= this.maxCatapultLevel) return null;
        return Math.floor(600 * Math.pow(1.5, this.catapultLevel));
    }
    
    calculateReinforcementCost() {
        if (this.reinforcementLevel >= this.maxReinforcementLevel) return null;
        return Math.floor(500 * Math.pow(1.5, this.reinforcementLevel));
    }
    
    purchaseUpgrade(upgradeId, gameState) {
        if (upgradeId === 'fortification') {
            return this.purchaseFortification(gameState);
        } else if (upgradeId === 'catapult') {
            return this.purchaseCatapult(gameState);
        } else if (upgradeId === 'reinforce_wall') {
            return this.purchaseReinforcement(gameState);
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
    
    purchaseReinforcement(gameState) {
        const cost = this.calculateReinforcementCost();
        
        if (!cost || gameState.gold < cost || this.reinforcementLevel >= this.maxReinforcementLevel) {
            return false;
        }
        
        gameState.gold -= cost;
        this.reinforcementLevel++;
        this.maxHealth += 50;
        this.health = this.maxHealth;
        
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
                icon: "<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 22 22'><path d='M11 2 L19 5 L19 12 Q19 17 11 20 Q3 17 3 12 L3 5 Z' fill='#4A7A5A' stroke='#253A2D' stroke-width='1.2'/><path d='M11 5 L17 7.5 L17 12 Q17 16 11 18.5 Q5 16 5 12 L5 7.5 Z' fill='#6A9A7A'/><line x1='11' y1='5' x2='11' y2='18.5' stroke='#3A5A4A' stroke-width='1'/></svg>"
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
                icon: "<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 22 22'><circle cx='11' cy='12' r='8' stroke='#AA8844' stroke-width='1.5' fill='#221800'/><line x1='11' y1='12' x2='11' y2='6' stroke='#FFD700' stroke-width='1.8' stroke-linecap='round'/><line x1='11' y1='12' x2='15' y2='12' stroke='#FFD700' stroke-width='1.5' stroke-linecap='round'/></svg>"
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
                icon: "<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 22 22'><rect x='5' y='11' width='12' height='9' rx='1.5' fill='#6A6A6A' stroke='#404040' stroke-width='1.2'/><path d='M8 11 L8 7 Q8 3 11 3 Q14 3 14 7 L14 11' fill='none' stroke='#909090' stroke-width='2' stroke-linecap='round'/><circle cx='11' cy='16' r='1.8' fill='#3A3A3A'/></svg>"
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
            icon: "<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><line x1='10' y1='35' x2='30' y2='8' stroke='#C8A030' stroke-width='3' stroke-linecap='round'/><rect x='6' y='20' width='12' height='3' rx='1.5' fill='#8A5A10' stroke='#3A2005' stroke-width='1' transform='rotate(-44 12 21.5)'/><circle cx='10' cy='35' r='3.5' fill='#7A4A10' stroke='#3A2005' stroke-width='1'/></svg>"
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
                icon: "<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><path d='M8 10 L20 7 L32 10 L32 22 Q32 32 20 36 Q8 32 8 22 Z' fill='#3A2010' stroke='#C0C0C0' stroke-width='1.5'/><line x1='20' y1='9' x2='20' y2='34' stroke='#C0C0C0' stroke-width='1'/><line x1='10' y1='20' x2='30' y2='20' stroke='#C0C0C0' stroke-width='1'/><line x1='26' y1='38' x2='38' y2='6' stroke='#C0C0C0' stroke-width='2.5' stroke-linecap='round'/><rect x='22' y='20' width='10' height='2.5' rx='1' fill='#5A5A5A' stroke='#2A2A2A' stroke-width='0.8' transform='rotate(-44 27 21.5)'/><circle cx='26' cy='38' r='2.5' fill='#3A3A3A' stroke='#1A1A1A' stroke-width='0.8'/></svg>"
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
                icon: "<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><rect x='4' y='8' width='16' height='22' rx='2' fill='#1A0A02' stroke='#FFD700' stroke-width='1.8'/><line x1='12' y1='10' x2='12' y2='28' stroke='#FFD700' stroke-width='1.2'/><line x1='5' y1='18' x2='19' y2='18' stroke='#FFD700' stroke-width='1.2'/><line x1='22' y1='38' x2='38' y2='4' stroke='#FFD700' stroke-width='4' stroke-linecap='round'/><rect x='19' y='18' width='14' height='3' rx='1.5' fill='#8A6A10' stroke='#4A3005' stroke-width='0.8' transform='rotate(-44 26 19.5)'/><circle cx='22' cy='38' r='3.5' fill='#7A5010' stroke='#4A3005' stroke-width='0.8'/></svg>"
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
