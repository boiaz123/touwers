export class Castle {
    constructor(x, y, gridX, gridY) {
        this.x = x;
        this.y = y;
        this.gridX = gridX;
        this.gridY = gridY;
        this.size = 3;
        this.animationTime = 0;
        
        // Main structure dimensions
        this.wallWidth = 120;
        this.wallHeight = 80;
        this.towerWidth = 35;
        this.towerHeight = 66.5;
        this.bridgeLength = 50;
        this.bridgeHeight = 10;
        
        // Flags on towers - positioned at tower roof peak
        // roofPeakY = topY - creneH - meralonH - roofH
        // roofPeakY = -66.5 - 10 - 4 - 12 = -92.5
        this.flags = [
            { x: -72, y: -92.5, rotation: 0.1 },
            { x: 72, y: -92.5, rotation: -0.15 }
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
        
        console.log('Castle: Created at grid position', gridX, gridY, 'screen position', x, y);
    }
    
    update(deltaTime) {
        this.animationTime += deltaTime;
        
        this.lights.forEach((light, i) => {
            this.windowFlicker[i] += Math.random() - 0.5;
            this.windowFlicker[i] = Math.max(0, Math.min(1, this.windowFlicker[i]));
            light.intensity = 0.4 + this.windowFlicker[i] * 0.6;
        });
    }
    
    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Ground shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.beginPath();
        ctx.ellipse(0, this.wallHeight/2 + 10, this.wallWidth/2 + 60, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw main wall first (background)
        this.drawMainWall(ctx);
        
        // Draw bridge connecting to left tower
        this.drawBridge(ctx);
        
        // Draw left tower with front perspective
        this.drawTower(ctx, -this.wallWidth/2 - this.towerWidth/2, 'left');
        
        // Draw right tower with front perspective
        this.drawTower(ctx, this.wallWidth/2 + this.towerWidth/2, 'right');
        
        // Draw gate
        this.drawGate(ctx);
        
        // Draw crenellations on top of wall
        this.drawCrenellations(ctx);
        
        // Draw flags on towers
        this.drawFlags(ctx);
        
        ctx.restore();
    }
    
    drawBridge(ctx) {
        const bridgeX = -this.wallWidth/2 - this.towerWidth/2 - this.bridgeLength;
        const bridgeY = this.wallHeight/2 - 5;
        
        // Bridge shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(bridgeX, bridgeY + 2, this.bridgeLength, this.bridgeHeight + 2);
        
        // Bridge main structure
        const bridgeGrad = ctx.createLinearGradient(bridgeX, bridgeY, bridgeX, bridgeY + this.bridgeHeight);
        bridgeGrad.addColorStop(0, '#8B7D6B');
        bridgeGrad.addColorStop(1, '#6B5D4D');
        
        ctx.fillStyle = bridgeGrad;
        ctx.fillRect(bridgeX, bridgeY, this.bridgeLength, this.bridgeHeight);
        
        ctx.strokeStyle = '#3D3830';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(bridgeX, bridgeY, this.bridgeLength, this.bridgeHeight);
        
        // Bridge planks
        ctx.strokeStyle = '#5D5247';
        ctx.lineWidth = 0.8;
        for (let i = 0; i < 6; i++) {
            ctx.beginPath();
            ctx.moveTo(bridgeX + (i * this.bridgeLength/5), bridgeY);
            ctx.lineTo(bridgeX + (i * this.bridgeLength/5), bridgeY + this.bridgeHeight);
            ctx.stroke();
        }
        
        // Bridge rails
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(bridgeX + 2, bridgeY - 3);
        ctx.lineTo(bridgeX + this.bridgeLength - 2, bridgeY - 3);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(bridgeX + 2, bridgeY + this.bridgeHeight + 3);
        ctx.lineTo(bridgeX + this.bridgeLength - 2, bridgeY + this.bridgeHeight + 3);
        ctx.stroke();
        
        // Path connection
        ctx.fillStyle = '#9B8B7B';
        ctx.fillRect(bridgeX - 15, bridgeY + 2, 15, this.bridgeHeight - 2);
        ctx.strokeStyle = '#5D5247';
        ctx.lineWidth = 1;
        ctx.strokeRect(bridgeX - 15, bridgeY + 2, 15, this.bridgeHeight - 2);
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
        
        // Tower stone brick pattern - same brick size
        ctx.strokeStyle = '#5D5247';
        ctx.lineWidth = 0.8;
        const blockW = this.towerWidth / 6;
        const blockH = 10.55; // Fixed brick height instead of this.towerHeight / 9
        
        for (let y = topY; y < baseY; y += blockH) {
            const rowFraction = (y - topY) / this.towerHeight;
            const rowW = towerTopW + (this.towerWidth - towerTopW) * rowFraction;
            const offsetX = (Math.abs(y - topY) / blockH) % 2 * blockW/2;
            
            for (let i = 0; i < 5; i++) {
                const xPos = -rowW/2 + (i * blockW);
                ctx.strokeRect(xPos + offsetX, y, blockW - 1, blockH - 1);
            }
        }
        
        // Stone highlights
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        for (let y = topY + 2; y < baseY; y += blockH) {
            const rowFraction = (y - topY) / this.towerHeight;
            const rowW = towerTopW + (this.towerWidth - towerTopW) * rowFraction;
            const offsetX = (Math.abs(y - topY) / blockH) % 2 * blockW/2;
            
            for (let i = 0; i < 5; i++) {
                const xPos = -rowW/2 + (i * blockW);
                ctx.fillRect(xPos + offsetX + 2, y + 2, blockW/3, blockH/3);
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
        
        ctx.fillRect(-towerTopW/2 + 2, topY - creneH - meralonH, meralonW - 3, meralonH);
        ctx.strokeRect(-towerTopW/2 + 2, topY - creneH - meralonH, meralonW - 3, meralonH);
        
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
        
        ctx.strokeStyle = '#5D5247';
        ctx.lineWidth = 0.8;
        const blockW = this.wallWidth / 12;
        const blockH = this.wallHeight / 8;
        
        for (let y = -this.wallHeight/2; y < this.wallHeight/2; y += blockH) {
            const offsetX = (Math.abs(y + this.wallHeight/2) / blockH) % 2 * blockW/2;
            for (let x = -this.wallWidth/2; x < this.wallWidth/2; x += blockW) {
                ctx.strokeRect(x + offsetX, y, blockW - 1, blockH - 1);
            }
        }
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        for (let y = -this.wallHeight/2 + 2; y < this.wallHeight/2; y += blockH) {
            const offsetX = (Math.abs(y + this.wallHeight/2) / blockH) % 2 * blockW/2;
            for (let x = -this.wallWidth/2 + 2; x < this.wallWidth/2; x += blockW) {
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
    
    drawFlags(ctx) {
        this.flags.forEach((flag, idx) => {
            ctx.save();
            ctx.translate(flag.x, flag.y);
            
            // Flag pole base is at (0, 0) which is the roof peak
            ctx.strokeStyle = '#5A4A3A';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, 15);
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
    
    static getInfo() {
        return {
            name: 'Castle',
            description: 'Fortress with connecting bridge, main wall, and corner towers.',
            size: '3x3',
            cost: 0
        };
    }
}
