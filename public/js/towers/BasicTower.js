export class BasicTower {
    constructor(x, y, gridX, gridY) {
        this.x = x;
        this.y = y;
        this.gridX = gridX;
        this.gridY = gridY;
        this.range = 120;
        this.damage = 20;
        this.fireRate = 1;
        this.cooldown = 0;
        this.target = null;
        
        // Animation properties
        this.throwingDefender = -1; // Which defender is throwing
        this.throwAnimationTime = 0;
        this.rocks = [];
        this.defenders = [
            { angle: 0, armRaised: 0, throwCooldown: 0 },
            { angle: Math.PI / 2, armRaised: 0, throwCooldown: 0.3 },
            { angle: Math.PI, armRaised: 0, throwCooldown: 0.6 },
            { angle: 3 * Math.PI / 2, armRaised: 0, throwCooldown: 0.9 }
        ];
    }
    
    update(deltaTime, enemies) {
        this.cooldown = Math.max(0, this.cooldown - deltaTime);
        
        this.target = this.findTarget(enemies);
        
        // Update defenders
        this.defenders.forEach((defender, index) => {
            defender.throwCooldown = Math.max(0, defender.throwCooldown - deltaTime);
            defender.armRaised = Math.max(0, defender.armRaised - deltaTime * 3);
            
            if (this.target) {
                const targetAngle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
                // Defenders slowly turn toward target
                const angleDiff = targetAngle - defender.angle;
                defender.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), deltaTime * 2);
            }
        });
        
        if (this.target && this.cooldown === 0) {
            this.shoot();
            this.cooldown = 1 / this.fireRate;
        }
        
        // Update flying rocks
        this.rocks = this.rocks.filter(rock => {
            rock.x += rock.vx * deltaTime;
            rock.y += rock.vy * deltaTime;
            rock.vy += 200 * deltaTime; // Gravity
            rock.rotation += rock.rotationSpeed * deltaTime;
            rock.life -= deltaTime;
            
            return rock.life > 0;
        });
    }
    
    findTarget(enemies) {
        let closest = null;
        let closestDist = this.range;
        
        for (const enemy of enemies) {
            const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
            if (dist <= this.range && dist < closestDist) {
                closest = enemy;
                closestDist = dist;
            }
        }
        
        return closest;
    }
    
    shoot() {
        if (this.target) {
            this.target.takeDamage(this.damage);
            
            // Select a defender to throw
            const availableDefenders = this.defenders
                .map((def, index) => ({ def, index }))
                .filter(({ def }) => def.throwCooldown === 0);
            
            if (availableDefenders.length > 0) {
                const { def: thrower, index } = availableDefenders[Math.floor(Math.random() * availableDefenders.length)];
                thrower.armRaised = 1;
                thrower.throwCooldown = 2;
                this.throwingDefender = index;
                
                // Create rock projectile
                const dx = this.target.x - this.x;
                const dy = this.target.y - this.y;
                const distance = Math.hypot(dx, dy);
                const throwSpeed = 300;
                const arcHeight = distance * 0.15; // Higher arc than arrows
                
                this.rocks.push({
                    x: this.x + Math.cos(thrower.angle) * 15,
                    y: this.y + Math.sin(thrower.angle) * 15 - 10, // Start from tower top
                    vx: (dx / distance) * throwSpeed,
                    vy: (dy / distance) * throwSpeed - arcHeight,
                    rotation: 0,
                    rotationSpeed: Math.random() * 10 + 5,
                    life: distance / throwSpeed + 1,
                    size: Math.random() * 2 + 3
                });
            }
        }
    }
    
    render(ctx) {
        // Calculate tower size based on grid cell size (2x2 cells)
        const baseResolution = 1920;
        const scaleFactor = Math.max(0.5, Math.min(2.5, ctx.canvas.width / baseResolution));
        const cellSize = Math.floor(32 * scaleFactor);
        const gridSize = cellSize * 2; // 2x2 grid
        
        // Tower dimensions - all aligned properly
        const baseWidth = gridSize * 0.45;
        const baseDepth = gridSize * 0.35;
        const baseHeight = gridSize * 0.12;
        const platformWidth = gridSize * 0.4;
        const platformDepth = gridSize * 0.32;
        const towerHeight = gridSize * 0.45;
        const platformHeight = gridSize * 0.08;
        const roofHeight = gridSize * 0.35;
        const roofWidth = platformWidth * 1.05; // Aligned with platform
        const roofDepth = platformDepth * 1.05; // Aligned with platform
        
        // Draw environmental elements first
        this.drawEnvironment(ctx, gridSize);
        
        // Improved shadow with proper perspective
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.transform(1, 0.3, 0.6, 0.2, 8, 12);
        ctx.fillRect(-baseWidth/2, -baseDepth/2, baseWidth, baseDepth + towerHeight + platformHeight + roofHeight);
        ctx.restore();
        
        // Stone base with better 3D perspective
        const baseY = this.y;
        
        // Base front face
        const baseGradient = ctx.createLinearGradient(0, baseY - baseHeight, 0, baseY);
        baseGradient.addColorStop(0, '#C0C0C0');
        baseGradient.addColorStop(1, '#808080');
        ctx.fillStyle = baseGradient;
        ctx.fillRect(this.x - baseWidth/2, baseY - baseHeight, baseWidth, baseHeight);
        
        // Stone blocks texture
        ctx.strokeStyle = '#606060';
        ctx.lineWidth = 1;
        for (let i = 1; i < 3; i++) {
            const y = baseY - baseHeight + (baseHeight * i / 3);
            ctx.beginPath();
            ctx.moveTo(this.x - baseWidth/2, y);
            ctx.lineTo(this.x + baseWidth/2, y);
            ctx.stroke();
        }
        for (let i = 1; i < 5; i++) {
            const x = this.x - baseWidth/2 + (baseWidth * i / 5);
            ctx.beginPath();
            ctx.moveTo(x, baseY - baseHeight);
            ctx.lineTo(x, baseY);
            ctx.stroke();
        }
        
        // Base right side with proper depth
        ctx.fillStyle = '#909090';
        ctx.beginPath();
        ctx.moveTo(this.x + baseWidth/2, baseY - baseHeight);
        ctx.lineTo(this.x + baseWidth/2 + baseDepth * 0.7, baseY - baseHeight - baseDepth * 0.4);
        ctx.lineTo(this.x + baseWidth/2 + baseDepth * 0.7, baseY - baseDepth * 0.4);
        ctx.lineTo(this.x + baseWidth/2, baseY);
        ctx.closePath();
        ctx.fill();
        
        // Base top surface
        ctx.fillStyle = '#E0E0E0';
        ctx.beginPath();
        ctx.moveTo(this.x - baseWidth/2, baseY - baseHeight);
        ctx.lineTo(this.x - baseWidth/2 + baseDepth * 0.7, baseY - baseHeight - baseDepth * 0.4);
        ctx.lineTo(this.x + baseWidth/2 + baseDepth * 0.7, baseY - baseHeight - baseDepth * 0.4);
        ctx.lineTo(this.x + baseWidth/2, baseY - baseHeight);
        ctx.closePath();
        ctx.fill();
        
        // Platform positioned first to align everything properly
        const platformY = baseY - baseHeight - towerHeight - platformHeight;
        const towerY = baseY - baseHeight - towerHeight;
        
        // Four corner posts perfectly aligned with platform AND roof
        const postWidth = 5;
        const postPositions = [
            { x: -platformWidth/2 + postWidth/2, depth: -platformDepth/2 + postWidth/2 },
            { x: platformWidth/2 - postWidth/2, depth: -platformDepth/2 + postWidth/2 },
            { x: -platformWidth/2 + postWidth/2, depth: platformDepth/2 - postWidth/2 },
            { x: platformWidth/2 - postWidth/2, depth: platformDepth/2 - postWidth/2 }
        ];
        
        postPositions.forEach((pos, index) => {
            const postX = this.x + pos.x + pos.depth * 0.7;
            const postYOffset = pos.depth * -0.4;
            
            // Post front face
            ctx.fillStyle = index < 2 ? '#DEB887' : '#CD853F';
            ctx.fillRect(postX - postWidth/2, towerY + postYOffset, postWidth, towerHeight);
            
            // Post side face for depth
            if (index === 1 || index === 3) {
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(postX + postWidth/2, towerY + postYOffset, 3, towerHeight);
            }
            
            // Wood grain
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 1;
            for (let i = 1; i < 6; i++) {
                const grainY = towerY + postYOffset + (towerHeight * i / 6);
                ctx.beginPath();
                ctx.moveTo(postX - postWidth/2, grainY);
                ctx.lineTo(postX + postWidth/2, grainY);
                ctx.stroke();
            }
        });
        
        // Horizontal braces between posts - properly aligned
        ctx.strokeStyle = '#A0522D';
        ctx.lineWidth = 3;
        
        const braceY1 = towerY + towerHeight * 0.3;
        const braceY2 = towerY + towerHeight * 0.7;
        
        // Front braces
        ctx.beginPath();
        ctx.moveTo(this.x - platformWidth/2 + postWidth/2, braceY1);
        ctx.lineTo(this.x + platformWidth/2 - postWidth/2, braceY1);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(this.x - platformWidth/2 + postWidth/2, braceY2);
        ctx.lineTo(this.x + platformWidth/2 - postWidth/2, braceY2);
        ctx.stroke();
        
        // Back braces with perspective
        const backDepthOffset = platformDepth * 0.7;
        const backHeightOffset = platformDepth * -0.4;
        
        ctx.beginPath();
        ctx.moveTo(this.x - platformWidth/2 + postWidth/2 + backDepthOffset, braceY1 + backHeightOffset);
        ctx.lineTo(this.x + platformWidth/2 - postWidth/2 + backDepthOffset, braceY1 + backHeightOffset);
        ctx.stroke();
        
        // Platform front edge
        ctx.fillStyle = '#D2B48C';
        ctx.fillRect(this.x - platformWidth/2, platformY, platformWidth, platformHeight);
        
        // Platform right side
        ctx.fillStyle = '#BC9A6A';
        ctx.beginPath();
        ctx.moveTo(this.x + platformWidth/2, platformY);
        ctx.lineTo(this.x + platformWidth/2 + platformDepth * 0.7, platformY - platformDepth * 0.4);
        ctx.lineTo(this.x + platformWidth/2 + platformDepth * 0.7, platformY - platformDepth * 0.4 + platformHeight);
        ctx.lineTo(this.x + platformWidth/2, platformY + platformHeight);
        ctx.closePath();
        ctx.fill();
        
        // Platform top surface
        ctx.fillStyle = '#DEB887';
        ctx.beginPath();
        ctx.moveTo(this.x - platformWidth/2, platformY);
        ctx.lineTo(this.x - platformWidth/2 + platformDepth * 0.7, platformY - platformDepth * 0.4);
        ctx.lineTo(this.x + platformWidth/2 + platformDepth * 0.7, platformY - platformDepth * 0.4);
        ctx.lineTo(this.x + platformWidth/2, platformY);
        ctx.closePath();
        ctx.fill();
        
        // Platform planks
        ctx.strokeStyle = '#8B7355';
        ctx.lineWidth = 1;
        for (let i = 1; i < 6; i++) {
            const ratio = i / 6;
            ctx.beginPath();
            ctx.moveTo(
                this.x - platformWidth/2 + platformDepth * 0.7 * ratio,
                platformY - platformDepth * 0.4 * ratio
            );
            ctx.lineTo(
                this.x + platformWidth/2 + platformDepth * 0.7 * ratio,
                platformY - platformDepth * 0.4 * ratio
            );
            ctx.stroke();
        }
        
        // Roof structure - perfectly aligned with posts
        const roofY = platformY - roofHeight;
        
        // Roof support posts - aligned with corner posts
        ctx.fillStyle = '#654321';
        postPositions.forEach(pos => {
            const postX = this.x + pos.x + pos.depth * 0.7;
            const postYOffset = pos.depth * -0.4;
            
            // Roof post extending from platform
            ctx.fillRect(postX - 2, platformY + postYOffset - roofHeight, 4, roofHeight);
            
            // Post side for depth
            ctx.fillStyle = '#5D4037';
            ctx.fillRect(postX + 2, platformY + postYOffset - roofHeight, 2, roofHeight);
            ctx.fillStyle = '#654321';
        });
        
        // Roof beams connecting aligned posts
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 4;
        
        // Front roof beam
        ctx.beginPath();
        ctx.moveTo(this.x - platformWidth/2 + postWidth/2, roofY);
        ctx.lineTo(this.x + platformWidth/2 - postWidth/2, roofY);
        ctx.stroke();
        
        // Back roof beam
        ctx.beginPath();
        ctx.moveTo(this.x - platformWidth/2 + postWidth/2 + backDepthOffset, roofY + backHeightOffset);
        ctx.lineTo(this.x + platformWidth/2 - postWidth/2 + backDepthOffset, roofY + backHeightOffset);
        ctx.stroke();
        
        // Side beams
        ctx.beginPath();
        ctx.moveTo(this.x - platformWidth/2 + postWidth/2, roofY);
        ctx.lineTo(this.x - platformWidth/2 + postWidth/2 + backDepthOffset, roofY + backHeightOffset);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(this.x + platformWidth/2 - postWidth/2, roofY);
        ctx.lineTo(this.x + platformWidth/2 - postWidth/2 + backDepthOffset, roofY + backHeightOffset);
        ctx.stroke();
        
        // Roof top surface - aligned with structure
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.moveTo(this.x - roofWidth/2, roofY);
        ctx.lineTo(this.x - roofWidth/2 + roofDepth * 0.7, roofY - roofDepth * 0.4);
        ctx.lineTo(this.x + roofWidth/2 + roofDepth * 0.7, roofY - roofDepth * 0.4);
        ctx.lineTo(this.x + roofWidth/2, roofY);
        ctx.closePath();
        ctx.fill();
        
        // Roof right side
        ctx.fillStyle = '#654321';
        ctx.beginPath();
        ctx.moveTo(this.x + roofWidth/2, roofY);
        ctx.lineTo(this.x + roofWidth/2 + roofDepth * 0.7, roofY - roofDepth * 0.4);
        ctx.lineTo(this.x + roofWidth/2 + roofDepth * 0.7, roofY - roofDepth * 0.4 + 8);
        ctx.lineTo(this.x + roofWidth/2, roofY + 8);
        ctx.closePath();
        ctx.fill();
        
        // Roof planks
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        for (let i = 1; i < 6; i++) {
            const ratio = i / 6;
            ctx.beginPath();
            ctx.moveTo(
                this.x - roofWidth/2 + roofDepth * 0.7 * ratio,
                roofY - roofDepth * 0.4 * ratio
            );
            ctx.lineTo(
                this.x + roofWidth/2 + roofDepth * 0.7 * ratio,
                roofY - roofDepth * 0.4 * ratio
            );
            ctx.stroke();
        }
        
        // Render defender on platform with enough clearance under roof
        const defenderX = this.x + platformDepth * 0.1;
        const defenderY = platformY - platformDepth * 0.05 - 12;
        
        ctx.save();
        ctx.translate(defenderX, defenderY);
        
        // Face target if exists
        if (this.target) {
            const targetAngle = Math.atan2(this.target.y - defenderY, this.target.x - defenderX);
            ctx.rotate(targetAngle);
        }
        
        // Defender body with blue shirt
        ctx.fillStyle = '#4169E1'; // Royal blue shirt
        ctx.fillRect(-2, -3, 4, 8);
        
        // Head
        ctx.fillStyle = '#DDBEA9';
        ctx.beginPath();
        ctx.arc(0, -6, 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Helmet
        ctx.fillStyle = '#696969';
        ctx.beginPath();
        ctx.arc(0, -6, 3, Math.PI, Math.PI * 2);
        ctx.fill();
        
        // Arms
        ctx.strokeStyle = '#DDBEA9';
        ctx.lineWidth = 2;
        
        const throwingDefender = this.defenders[0];
        const armAngle = this.target && this.throwingDefender === 0 ? 
            -Math.PI / 2 - throwingDefender.armRaised * Math.PI / 3 : 
            Math.sin(Date.now() * 0.002) * 0.2;
        
        // Throwing arm
        ctx.beginPath();
        ctx.moveTo(-1, -2);
        ctx.lineTo(-1 + Math.cos(armAngle) * 3.5, -2 + Math.sin(armAngle) * 3.5);
        ctx.stroke();
        
        // Other arm
        ctx.beginPath();
        ctx.moveTo(1, -2);
        ctx.lineTo(3, 1);
        ctx.stroke();
        
        // Rock in hand when ready to throw
        if (throwingDefender.armRaised > 0.5) {
            const rockX = -1 + Math.cos(armAngle) * 4;
            const rockY = -2 + Math.sin(armAngle) * 4;
            ctx.fillStyle = '#696969';
            ctx.beginPath();
            ctx.arc(rockX, rockY, 1, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
        
        // Render flying rocks
        this.rocks.forEach(rock => {
            ctx.save();
            ctx.translate(rock.x, rock.y);
            ctx.rotate(rock.rotation);
            
            const rockGradient = ctx.createRadialGradient(-1, -1, 0, 0, 0, rock.size);
            rockGradient.addColorStop(0, '#A9A9A9');
            rockGradient.addColorStop(1, '#696969');
            
            ctx.fillStyle = rockGradient;
            ctx.strokeStyle = '#2F2F2F';
            ctx.lineWidth = 0.5;
            
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const variance = 0.7 + Math.random() * 0.3;
                const x = Math.cos(angle) * rock.size * variance;
                const y = Math.sin(angle) * rock.size * variance;
                
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            ctx.restore();
        });
        
        // Range indicator when targeting
        if (this.target) {
            ctx.strokeStyle = 'rgba(139, 69, 19, 0.3)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
    
    drawEnvironment(ctx, gridSize) {
        // Fixed tree positions to prevent flickering
        const trees = [
            { x: -gridSize * 0.45, y: gridSize * 0.35, size: 1.3 },
            { x: gridSize * 0.4, y: gridSize * 0.4, size: 1.5 },
            { x: -gridSize * 0.4, y: -gridSize * 0.45, size: 1.1 },
            { x: gridSize * 0.3, y: -gridSize * 0.3, size: 1.2 },
            { x: -gridSize * 0.15, y: gridSize * 0.45, size: 0.9 },
            { x: gridSize * 0.45, y: -gridSize * 0.1, size: 1.0 },
            { x: -gridSize * 0.5, y: -gridSize * 0.1, size: 1.4 },
            { x: gridSize * 0.1, y: gridSize * 0.5, size: 0.8 }
        ];
        
        trees.forEach((tree, index) => {
            const treeX = this.x + tree.x;
            const treeY = this.y + tree.y;
            const scale = tree.size;
            
            // Tree shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            ctx.save();
            ctx.translate(treeX, treeY);
            ctx.transform(1, 0.3, 0.6, 0.2, 3, 3);
            ctx.fillRect(-4 * scale, -3 * scale, 8 * scale, 6 * scale);
            ctx.restore();
            
            // Visible tree trunk - brown base
            const trunkWidth = 2.5 * scale;
            const trunkHeight = 12 * scale;
            
            // Trunk base - wider at bottom
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(treeX - trunkWidth * 0.7, treeY - 3, trunkWidth * 1.4, 6);
            
            // Main trunk - solid brown cylinder
            ctx.fillStyle = '#654321';
            ctx.fillRect(treeX - trunkWidth/2, treeY - trunkHeight, trunkWidth, trunkHeight);
            
            // Trunk texture lines
            ctx.strokeStyle = '#4A2C17';
            ctx.lineWidth = 1;
            for (let i = 1; i < 6; i++) {
                const lineY = treeY - (trunkHeight * i / 6);
                ctx.beginPath();
                ctx.moveTo(treeX - trunkWidth/2, lineY);
                ctx.lineTo(treeX + trunkWidth/2, lineY);
                ctx.stroke();
            }
            
            // Vertical bark lines
            ctx.beginPath();
            ctx.moveTo(treeX - trunkWidth/4, treeY);
            ctx.lineTo(treeX - trunkWidth/4, treeY - trunkHeight);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(treeX + trunkWidth/4, treeY);
            ctx.lineTo(treeX + trunkWidth/4, treeY - trunkHeight);
            ctx.stroke();
            
            // Pine layers ON TOP of the trunk
            const layers = [
                { y: -25 * scale, width: 18 * scale, color: '#0F3B0F' },
                { y: -20 * scale, width: 16 * scale, color: '#1a4a1a' },
                { y: -15 * scale, width: 14 * scale, color: '#228B22' },
                { y: -10 * scale, width: 12 * scale, color: '#32CD32' },
                { y: -6 * scale, width: 10 * scale, color: '#90EE90' },
                { y: -3 * scale, width: 8 * scale, color: '#98FB98' }
            ];
            
            layers.forEach(layer => {
                // Main triangular layer
                ctx.fillStyle = layer.color;
                ctx.beginPath();
                ctx.moveTo(treeX, treeY + layer.y);
                ctx.lineTo(treeX - layer.width/2, treeY + layer.y + layer.width * 0.6);
                ctx.lineTo(treeX + layer.width/2, treeY + layer.y + layer.width * 0.6);
                ctx.closePath();
                ctx.fill();
                
                // Layer outline
                ctx.strokeStyle = '#0F3B0F';
                ctx.lineWidth = 1;
                ctx.stroke();
            });
            
            // Tree highlights
            ctx.fillStyle = 'rgba(144, 238, 144, 0.2)';
            ctx.beginPath();
            ctx.moveTo(treeX - 2 * scale, treeY - 22 * scale);
            ctx.lineTo(treeX - 6 * scale, treeY - 15 * scale);
            ctx.lineTo(treeX + 1 * scale, treeY - 18 * scale);
            ctx.closePath();
            ctx.fill();
        });
        
        // Bushes around the base
        const bushes = [
            { x: -gridSize * 0.3, y: gridSize * 0.2, size: 0.4 },
            { x: gridSize * 0.25, y: -gridSize * 0.25, size: 0.3 },
            { x: -gridSize * 0.2, y: -gridSize * 0.3, size: 0.35 },
            { x: gridSize * 0.35, y: gridSize * 0.15, size: 0.3 }
        ];
        
        bushes.forEach(bush => {
            const bushX = this.x + bush.x;
            const bushY = this.y + bush.y;
            const scale = bush.size;
            
            // Bush shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.save();
            ctx.translate(bushX + 2, bushY + 2);
            ctx.scale(1.2, 0.3);
            ctx.beginPath();
            ctx.arc(0, 0, 4 * scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            
            // Bush body
            ctx.fillStyle = '#228B22';
            ctx.beginPath();
            ctx.arc(bushX, bushY - 2 * scale, 3 * scale, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#32CD32';
            ctx.beginPath();
            ctx.arc(bushX - 1 * scale, bushY - 1 * scale, 2 * scale, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(bushX + 1 * scale, bushY - 1 * scale, 2 * scale, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Rocks scattered around
        const rocks = [
            { x: -gridSize * 0.35, y: gridSize * 0.45, size: 0.4 },
            { x: gridSize * 0.45, y: -gridSize * 0.15, size: 0.3 },
            { x: -gridSize * 0.15, y: -gridSize * 0.45, size: 0.25 },
            { x: gridSize * 0.2, y: gridSize * 0.3, size: 0.35 }
        ];
        
        rocks.forEach(rock => {
            const rockX = this.x + rock.x;
            const rockY = this.y + rock.y;
            const scale = rock.size;
            
            // Rock shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.save();
            ctx.translate(rockX + 1, rockY + 1);
            ctx.scale(1, 0.4);
            ctx.beginPath();
            ctx.arc(0, 0, 3 * scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            
            // Rock
            const rockGradient = ctx.createRadialGradient(rockX - 1, rockY - 1, 0, rockX, rockY, 3 * scale);
            rockGradient.addColorStop(0, '#C0C0C0');
            rockGradient.addColorStop(1, '#808080');
            
            ctx.fillStyle = rockGradient;
            ctx.beginPath();
            // Irregular rock shape
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const variance = 0.7 + Math.random() * 0.3;
                const x = rockX + Math.cos(angle) * 3 * scale * variance;
                const y = rockY + Math.sin(angle) * 2 * scale * variance;
                
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            
            ctx.strokeStyle = '#696969';
            ctx.lineWidth = 1;
            ctx.stroke();
        });
    }
    
    static getInfo() {
        return {
            name: 'Basic Tower',
            description: 'A reliable wooden watchtower with defenders hurling rocks.',
            damage: '20',
            range: '120',
            fireRate: '1.0/sec',
            cost: 50
        };
    }
}
