import { Tower } from './Tower.js';

export class ArcherTower extends Tower {
    constructor(x, y, gridX, gridY) {
        super(x, y, gridX, gridY);
        this.range = 155;
        this.damage = 20;
        this.fireRate = 1.8;
        
        // Armor pierce upgrade - percentage of enemy armor to ignore
        // Each upgrade level = 5% armor piercing
        this.armorPiercingPercent = 0;
        
        // Animation properties
        this.archerAngle = 0;
        this.drawTime = 0;
        this.arrows = [];
        this.archers = [
            { angle: 0, drawback: 0, shootTimer: 0 },
            { angle: Math.PI / 2, drawback: 0, shootTimer: 0.2 },
            { angle: Math.PI, drawback: 0, shootTimer: 0.4 },
            { angle: 3 * Math.PI / 2, drawback: 0, shootTimer: 0.6 }
        ];
    }
    
    update(deltaTime, enemies) {
        super.update(deltaTime, enemies);
        
        for (let a = 0; a < this.archers.length; a++) {
            const archer = this.archers[a];
            archer.shootTimer = Math.max(0, archer.shootTimer - deltaTime);
            archer.drawback = Math.max(0, archer.drawback - deltaTime * 3);
            
            if (this.target) {
                const targetAngle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
                archer.angle = targetAngle + Math.sin(this.animationTime * 2) * 0.1;
            }
        }
        
        if (this.target && this.cooldown === 0) {
            this.shoot();
            this.cooldown = 1 / this.fireRate;
        }
        
        // Update arrows (compact in-place)
        let arrowWrite = 0;
        for (let i = 0; i < this.arrows.length; i++) {
            const arrow = this.arrows[i];
            arrow.x += arrow.vx * deltaTime;
            arrow.y += arrow.vy * deltaTime;
            arrow.vy += 200 * deltaTime; // Gravity effect
            arrow.life -= deltaTime;
            arrow.rotation = Math.atan2(arrow.vy, arrow.vx);
            
            let hit = false;
            if (arrow.target) {
                const dist = Math.hypot(arrow.x - arrow.target.x, arrow.y - arrow.target.y);
                if (dist <= 15) hit = true;
            } else if (arrow.fallbackX != null) {
                const dist = Math.hypot(arrow.x - arrow.fallbackX, arrow.y - arrow.fallbackY);
                if (dist <= 15) hit = true;
            }
            
            if (!hit && arrow.life > 0) {
                this.arrows[arrowWrite++] = arrow;
            }
        }
        this.arrows.length = arrowWrite;
    }
    
    shoot() {
        if (this.target) {
            // Pass armor piercing percentage to takeDamage
            // armorPiercingPercent is already stored as a percentage (5, 10, 15, etc.)
            this.target.takeDamage(this.damage, this.armorPiercingPercent, 'physical');
            
            // Play arrow sound
            if (this.audioManager) {
                this.audioManager.playSFX('arrow');
            }
            
            // Select an archer to shoot
            const shooter = this.archers[Math.floor(Math.random() * this.archers.length)];
            shooter.drawback = 1;
            shooter.shootTimer = 0.3;
            
            // Get archer's position on the platform
            const cellSize = 32; // Default fallback
            const towerSize = cellSize * 2;
            const towerHeight = towerSize * 0.7;
            const platformWidth = towerSize * 0.6 * 1.2;
            const platformY = this.y - towerHeight;
            const platformThickness = towerSize * 0.08;
            const railingHeight = towerSize * 0.19;
            
            const archerPositions = [
                { x: this.x - platformWidth * 0.08, y: platformY - platformThickness - railingHeight * 0.70 },
                { x: this.x + platformWidth * 0.14, y: platformY - platformThickness - railingHeight * 0.62 },
                { x: this.x - platformWidth * 0.30, y: platformY - platformThickness - railingHeight * 0.38 },
                { x: this.x + platformWidth * 0.27, y: platformY - platformThickness - railingHeight * 0.32 }
            ];
            
            const archerIndex = Math.floor(Math.random() * this.archers.length);
            const archerPos = archerPositions[archerIndex];
            
            // Predict where the target will be
            const arrowSpeed = 400;
            const predicted = this.predictEnemyPosition(this.target, arrowSpeed);
            
            // Calculate arrow trajectory with arc to predicted position
            const dx = predicted.x - archerPos.x;
            const dy = predicted.y - archerPos.y;
            const distance = Math.hypot(dx, dy);
            const arcHeight = distance * 0.1; // Slight arc for realism
            
            this.arrows.push({
                x: archerPos.x,
                y: archerPos.y,
                vx: distance > 0 ? (dx / distance) * arrowSpeed : 0,
                vy: distance > 0 ? (dy / distance) * arrowSpeed - arcHeight : 0,
                rotation: shooter.angle,
                life: Math.min(distance / Math.max(arrowSpeed, 1) + 0.5, 3.0),
                maxLife: Math.min(distance / Math.max(arrowSpeed, 1) + 0.5, 3.0),
                target: this.target,
                fallbackX: this.target.x,
                fallbackY: this.target.y
            });
        }
    }
    
    render(ctx) {
        // Get tower size - use ResolutionManager if available
        const cellSize = this.getCellSize(ctx);
        const towerSize = cellSize * 2;
        
        // 3D shadow for entire structure
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(this.x - towerSize * 0.3 + 4, this.y - towerSize * 0.1 + 4, towerSize * 0.6, towerSize * 0.8);
        
        // Wooden watchtower base (square foundation)
        const baseWidth = towerSize * 0.6;
        const baseHeight = towerSize * 0.15;
        
        // Foundation stones
        ctx.fillStyle = '#A9A9A9';
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 2;
        ctx.fillRect(this.x - baseWidth/2, this.y - baseHeight, baseWidth, baseHeight * 2);
        ctx.strokeRect(this.x - baseWidth/2, this.y - baseHeight, baseWidth, baseHeight * 2);
        // Top highlight
        ctx.fillStyle = '#E8E8E8';
        ctx.fillRect(this.x - baseWidth/2, this.y - baseHeight, baseWidth, 2);
        // Stone texture
        ctx.strokeStyle = '#696969';
        ctx.lineWidth = 1;
        for (let i = 1; i < 3; i++) {
            const sy = this.y - baseHeight + (baseHeight * 2 * i / 3);
            ctx.beginPath();
            ctx.moveTo(this.x - baseWidth/2, sy);
            ctx.lineTo(this.x + baseWidth/2, sy);
            ctx.stroke();
        }
        
        // Main wooden tower structure (tall and narrow)
        const towerWidth = baseWidth * 0.8;
        const towerHeight = towerSize * 0.7;
        
        // Tower wood planks
        ctx.fillStyle = '#CD853F';
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.fillRect(this.x - towerWidth/2, this.y - towerHeight, towerWidth, towerHeight);
        ctx.strokeRect(this.x - towerWidth/2, this.y - towerHeight, towerWidth, towerHeight);
        
        // Vertical wood planks
        ctx.strokeStyle = '#8B7355';
        ctx.lineWidth = 1;
        for (let i = 1; i < 4; i++) {
            const plankX = this.x - towerWidth/2 + (towerWidth * i / 4);
            ctx.beginPath();
            ctx.moveTo(plankX, this.y - towerHeight);
            ctx.lineTo(plankX, this.y);
            ctx.stroke();
        }
        
        // Horizontal support beams
        for (let i = 1; i <= 3; i++) {
            const beamY = this.y - towerHeight + (towerHeight * i / 4);
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x - towerWidth/2, beamY);
            ctx.lineTo(this.x + towerWidth/2, beamY);
            ctx.stroke();
        }
        
        // Watchtower platform at top
        const platformWidth = towerWidth * 1.2;
        const platformThickness = towerSize * 0.08;
        const platformY = this.y - towerHeight;
        
        // Platform shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(this.x - platformWidth/2 + 2, platformY - platformThickness + 2, platformWidth, platformThickness);
        
        // Platform
        ctx.fillStyle = '#A0825B';
        ctx.strokeStyle = '#5D4E37';
        ctx.lineWidth = 2;
        ctx.fillRect(this.x - platformWidth/2, platformY - platformThickness, platformWidth, platformThickness);
        ctx.strokeRect(this.x - platformWidth/2, platformY - platformThickness, platformWidth, platformThickness);
        
        // Platform support brackets
        const bracketWidth = towerSize * 0.1;
        for (let side = -1; side <= 1; side += 2) {
            const bracketX = this.x + side * towerWidth/2;
            ctx.fillStyle = '#654321';
            ctx.beginPath();
            ctx.moveTo(bracketX, platformY - platformThickness);
            ctx.lineTo(bracketX + side * bracketWidth, platformY - platformThickness - bracketWidth);
            ctx.lineTo(bracketX + side * bracketWidth, platformY);
            ctx.lineTo(bracketX, platformY);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
        
        // Wooden railings with arrow slits
        const railingHeight = towerSize * 0.19;
        ctx.fillStyle = '#A0522D';
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        
        // Front and back railings
        for (let side = -1; side <= 1; side += 2) {
            const railingY = platformY - platformThickness - railingHeight;
            ctx.fillRect(this.x - platformWidth/2, railingY, platformWidth, railingHeight);
            ctx.strokeRect(this.x - platformWidth/2, railingY, platformWidth, railingHeight);
            
            // Arrow slits
            for (let i = 0; i < 3; i++) {
                const slitX = this.x - platformWidth/2 + (i + 1) * platformWidth/4;
                const slitWidth = platformWidth * 0.03;
                const slitHeight = railingHeight * 0.6;
                ctx.fillStyle = '#2F2F2F';
                ctx.fillRect(slitX - slitWidth/2, railingY + railingHeight * 0.2, slitWidth, slitHeight);
            }
        }
        
        // Corner posts
        const postSize = towerSize * 0.05;
        ctx.fillStyle = '#654321';
        for (let x = -1; x <= 1; x += 2) {
            for (let z = -1; z <= 1; z += 2) {
                const postX = this.x + x * platformWidth/2;
                const postZ = platformY - platformThickness - railingHeight;
                ctx.fillRect(postX - postSize/2, postZ, postSize, railingHeight + platformThickness);
                ctx.strokeRect(postX - postSize/2, postZ, postSize, railingHeight + platformThickness);
            }
        }
        
        // Thatched roof
        const roofHeight = towerSize * 0.27;
        const roofY = platformY - platformThickness - railingHeight;
        const roofPeakPt = roofY - roofHeight;
        const roofHalfW = platformWidth / 2 + postSize + 4;

        // Roof drop shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
        ctx.beginPath();
        ctx.moveTo(this.x + 2, roofPeakPt + 2);
        ctx.lineTo(this.x - roofHalfW + 2, roofY + 2);
        ctx.lineTo(this.x + roofHalfW + 2, roofY + 2);
        ctx.closePath();
        ctx.fill();

        // Base thatch fill
        ctx.fillStyle = '#b5863a';
        ctx.beginPath();
        ctx.moveTo(this.x, roofPeakPt);
        ctx.lineTo(this.x - roofHalfW, roofY);
        ctx.lineTo(this.x + roofHalfW, roofY);
        ctx.closePath();
        ctx.fill();

        // Thatch rows — horizontal bands with shadow lines and straw strokes
        const numLayers = 5;
        for (let layer = 1; layer <= numLayers; layer++) {
            const t = layer / numLayers;
            const hw = roofHalfW * t;
            const bandY = roofPeakPt + (roofY - roofPeakPt) * t;
            const tPrev = (layer - 1) / numLayers;
            const prevY = roofPeakPt + (roofY - roofPeakPt) * tPrev;
            const prevHW = roofHalfW * tPrev;

            // Shadow line between each thatch row
            if (layer < numLayers) {
                ctx.strokeStyle = 'rgba(55, 30, 5, 0.55)';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(this.x - hw, bandY);
                ctx.lineTo(this.x + hw, bandY);
                ctx.stroke();
            }

            // Straw strokes within this band — slightly diagonal, clipped to triangle
            ctx.strokeStyle = 'rgba(215, 175, 65, 0.5)';
            ctx.lineWidth = 0.7;
            for (let sx = this.x - hw + 2; sx < this.x + hw - 2; sx += 8) {
                if (prevHW > 0 && Math.abs(sx - this.x) > prevHW) continue;
                const wobble = (Math.floor(sx) % 8 < 4) ? 1.5 : -1;
                ctx.beginPath();
                ctx.moveTo(sx, prevY + (bandY - prevY) * 0.15);
                ctx.lineTo(sx + wobble, bandY);
                ctx.stroke();
            }
        }

        // Eave fringe — ragged thatch tufts hanging at the lower edge
        for (let i = 0; i < 10; i++) {
            const tx = this.x - roofHalfW + (i + 0.5) * (roofHalfW * 2 / 10);
            const drop = 3 + (i * 3 + 2) % 4;
            ctx.fillStyle = (i % 2 === 0) ? '#c8a040' : '#b48828';
            ctx.fillRect(tx - 2, roofY, 4, drop);
        }

        // Roof outline
        ctx.strokeStyle = '#5a3c10';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(this.x, roofPeakPt);
        ctx.lineTo(this.x - roofHalfW, roofY);
        ctx.lineTo(this.x + roofHalfW, roofY);
        ctx.closePath();
        ctx.stroke();

        // Ridge cap — bound thatch bundle at the peak
        ctx.fillStyle = '#6b4818';
        ctx.beginPath();
        ctx.moveTo(this.x - 4, roofPeakPt + 3);
        ctx.lineTo(this.x + 4, roofPeakPt + 3);
        ctx.lineTo(this.x + 2, roofPeakPt - 1);
        ctx.lineTo(this.x - 2, roofPeakPt - 1);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#3d2008';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Flagpole at roof peak
        ctx.strokeStyle = '#5a341d';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, roofPeakPt);
        ctx.lineTo(this.x, roofPeakPt - 16);
        ctx.stroke();

        // Burgundy pennant (matches game style)
        ctx.fillStyle = '#8B1E3F';
        ctx.beginPath();
        ctx.moveTo(this.x, roofPeakPt - 16);
        ctx.lineTo(this.x + 13, roofPeakPt - 11);
        ctx.lineTo(this.x, roofPeakPt - 6);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#5b1028';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        
        // Render archers on platform — each visually distinct
        // Per-archer configs: tunic, skin tone, headgear style, height offset
        const archerStyles = [
            { tunic: '#2D6A1F', tunics: '#1e4e16', skin: '#DDBEA9', gear: '#696969', gearType: 'iron',    dy: 0   },
            { tunic: '#7a3f18', tunics: '#5a2f10', skin: '#C8956A', gear: '#7a5a3a', gearType: 'leather', dy: -1  },
            { tunic: '#1E4D35', tunics: '#143524', skin: '#E8C9A8', gear: '#556B2F', gearType: 'hood',    dy: 0.5 },
            { tunic: '#5a4a20', tunics: '#3d3015', skin: '#D9A87C', gear: '#8B7355', gearType: 'cap',     dy: -0.5 },
        ];

        this.archers.forEach((archer, index) => {
            ctx.save();
            
            const archerPositions = [
                { x: this.x - platformWidth * 0.08, y: platformY - platformThickness - railingHeight * 0.70 },
                { x: this.x + platformWidth * 0.14, y: platformY - platformThickness - railingHeight * 0.62 },
                { x: this.x - platformWidth * 0.30, y: platformY - platformThickness - railingHeight * 0.38 },
                { x: this.x + platformWidth * 0.27, y: platformY - platformThickness - railingHeight * 0.32 }
            ];
            
            const pos = archerPositions[index];
            const style = archerStyles[index];
            ctx.translate(pos.x, pos.y + style.dy);

            // Legs (tiny, dark trousers)
            ctx.fillStyle = '#3d2c1a';
            ctx.fillRect(-1.5, 2, 1.5, 4);
            ctx.fillRect(0.5, 2, 1.5, 4);

            // Tunic body — base colour + darker side shadow
            ctx.fillStyle = style.tunic;
            ctx.fillRect(-2, -4, 4, 7);
            ctx.fillStyle = style.tunics;
            ctx.fillRect(1, -4, 1, 7); // right-side shadow strip

            // Belt line
            ctx.fillStyle = '#2a1a0a';
            ctx.fillRect(-2, 1, 4, 1);

            // Quiver on back (small brown rectangle behind the body)
            ctx.fillStyle = '#7a4010';
            ctx.fillRect(-3.5, -3, 1.5, 5);
            ctx.strokeStyle = '#4a2008';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(-3.5, -3, 1.5, 5);
            // Arrow tips sticking out of quiver
            ctx.fillStyle = '#c0a060';
            ctx.fillRect(-3.2, -4.5, 0.5, 2);
            ctx.fillRect(-2.8, -4.8, 0.5, 2);

            // Head
            ctx.fillStyle = style.skin;
            ctx.beginPath();
            ctx.arc(0, -6, 2, 0, Math.PI * 2);
            ctx.fill();

            // Headgear per archer type
            if (style.gearType === 'iron') {
                // Iron helmet
                ctx.fillStyle = style.gear;
                ctx.beginPath();
                ctx.arc(0, -6, 2.4, Math.PI, Math.PI * 2);
                ctx.fill();
                // Nasal guard
                ctx.fillStyle = '#555';
                ctx.fillRect(-0.3, -6.5, 0.6, 2);
            } else if (style.gearType === 'leather') {
                // Leather cap
                ctx.fillStyle = style.gear;
                ctx.beginPath();
                ctx.arc(0, -6.5, 2, Math.PI * 1.1, Math.PI * 1.9);
                ctx.fill();
                ctx.fillRect(-2, -7.5, 4, 1.5);
                // Brim
                ctx.fillStyle = '#5a3a18';
                ctx.fillRect(-2.5, -6.5, 5, 0.8);
            } else if (style.gearType === 'hood') {
                // Hood
                ctx.fillStyle = style.gear;
                ctx.beginPath();
                ctx.arc(0, -6, 2.6, Math.PI * 1.05, Math.PI * 1.95);
                ctx.fill();
                ctx.fillRect(-2.6, -6, 5.2, 2.5);
                // Hood tip draping
                ctx.fillStyle = '#1a4028';
                ctx.beginPath();
                ctx.moveTo(-2.6, -6);
                ctx.lineTo(-1, -8);
                ctx.lineTo(-2.6, -5);
                ctx.closePath();
                ctx.fill();
            } else {
                // Cap (flat-topped birch wood style)
                ctx.fillStyle = style.gear;
                ctx.fillRect(-2.2, -8, 4.4, 1.5);
                ctx.fillRect(-1.8, -7.5, 3.6, 2);
                // Feather accent
                ctx.strokeStyle = '#d4a017';
                ctx.lineWidth = 0.8;
                ctx.beginPath();
                ctx.moveTo(1.5, -8);
                ctx.bezierCurveTo(2.5, -9.5, 3, -9, 2, -7.5);
                ctx.stroke();
            }
            
            // Bow and aiming
            if (this.target) {
                const aimAngle = Math.atan2(this.target.y - pos.y, this.target.x - pos.x);
                ctx.rotate(aimAngle);

                // Bow stave (darker, slightly thicker)
                ctx.strokeStyle = '#5D3A1A';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(5, 0, 4.5, -0.65, 0.65);
                ctx.stroke();

                // Bow grip wrap
                ctx.strokeStyle = '#8B4513';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(4.5, -1);
                ctx.lineTo(5.5, 1);
                ctx.stroke();

                // Draw string if preparing to shoot
                if (archer.drawback > 0) {
                    ctx.strokeStyle = '#F5F5DC';
                    ctx.lineWidth = 0.8;
                    ctx.beginPath();
                    ctx.moveTo(5 + 3.5, -3.5);
                    ctx.lineTo(5 - archer.drawback * 3.5, 0);
                    ctx.lineTo(5 + 3.5, 3.5);
                    ctx.stroke();
                    
                    // Arrow on string
                    ctx.strokeStyle = '#6B3A0A';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(5 - archer.drawback * 3.5, 0);
                    ctx.lineTo(5 - archer.drawback * 3.5 - 9, 0);
                    ctx.stroke();
                    // Arrowhead
                    ctx.fillStyle = '#A0A0A0';
                    ctx.beginPath();
                    ctx.moveTo(5 - archer.drawback * 3.5 - 9, 0);
                    ctx.lineTo(5 - archer.drawback * 3.5 - 7, -1.5);
                    ctx.lineTo(5 - archer.drawback * 3.5 - 7, 1.5);
                    ctx.closePath();
                    ctx.fill();
                } else {
                    // Idle bow string (taut but not drawn)
                    ctx.strokeStyle = 'rgba(245,245,220,0.6)';
                    ctx.lineWidth = 0.8;
                    ctx.beginPath();
                    ctx.moveTo(5 + 3.5, -3.5);
                    ctx.lineTo(5 + 0.5, 0);
                    ctx.lineTo(5 + 3.5, 3.5);
                    ctx.stroke();
                }
            }
            
            ctx.restore();
        });
        
        // Render flying arrows
        for (let a = 0; a < this.arrows.length; a++) {
            const arrow = this.arrows[a];
            ctx.save();
            ctx.translate(arrow.x, arrow.y);
            ctx.rotate(arrow.rotation);
            
            const alpha = Math.min(1, arrow.life / arrow.maxLife);
            
            // Arrow shaft
            ctx.strokeStyle = `rgba(139, 69, 19, ${alpha})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-12, 0);
            ctx.lineTo(8, 0);
            ctx.stroke();
            
            // Arrow head
            ctx.fillStyle = `rgba(128, 128, 128, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(8, 0);
            ctx.lineTo(4, -2);
            ctx.lineTo(4, 2);
            ctx.closePath();
            ctx.fill();
            
            // Arrow fletching
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-12, -1);
            ctx.lineTo(-8, -3);
            ctx.moveTo(-12, 1);
            ctx.lineTo(-8, 3);
            ctx.stroke();
            
            ctx.restore();
        }
        
        
        // Render attack radius circle if selected
        this.renderAttackRadiusCircle(ctx);
    }
    
    static getInfo() {
        return {
            name: 'Archer Tower',
            description: 'Fast-firing tower with long range. Gains armor piercing through Forge upgrades.',
            damage: '20',
            range: '155',
            fireRate: '1.8/sec',
            cost: 90,
            icon: ''
        };
    }
}
