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
        this.isSelected = false; // Add selection state
        
        // Animation properties
        this.animationTime = 0; // Initialize animation time
        this.throwingDefender = -1;
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
        this.animationTime += deltaTime; // Update animation time
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
        
        // Update flying rocks - check for enemy hits
        this.rocks = this.rocks.filter(rock => {
            rock.x += rock.vx * deltaTime;
            rock.y += rock.vy * deltaTime;
            rock.vy += 200 * deltaTime; // Gravity
            rock.rotation += rock.rotationSpeed * deltaTime;
            rock.life -= deltaTime;
            
            // Check collision with target enemy
            if (rock.target && !rock.target.isDead) {
                const dist = Math.hypot(rock.x - rock.target.x, rock.y - rock.target.y);
                if (dist <= 15) { // Hit radius
                    return false; // Remove rock
                }
            }
            
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
                
                // Create rock projectile from defender position
                const platformY = this.y - (this.gridSize || 64) * 0.12 - (this.gridSize || 64) * 0.45 - (this.gridSize || 64) * 0.08;
                const defenderX = this.x + (this.gridSize || 64) * 0.32 * 0.1;
                const defenderY = platformY - (this.gridSize || 64) * 0.32 * 0.05 - 12;
                
                const dx = this.target.x - defenderX;
                const dy = this.target.y - defenderY;
                const distance = Math.hypot(dx, dy);
                const throwSpeed = 300;
                const arcHeight = distance * 0.15;
                
                this.rocks.push({
                    x: defenderX,
                    y: defenderY,
                    vx: (dx / distance) * throwSpeed,
                    vy: (dy / distance) * throwSpeed - arcHeight,
                    rotation: 0,
                    rotationSpeed: Math.random() * 10 + 5,
                    life: distance / throwSpeed + 1,
                    size: Math.random() * 2 + 3,
                    target: this.target
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
        this.gridSize = gridSize; // Store for rock calculations
        
        // Compact, aligned tower dimensions
        const baseSize = gridSize * 0.35;
        const baseHeight = gridSize * 0.1;
        const towerSize = gridSize * 0.28;
        const towerHeight = gridSize * 0.4;
        const platformSize = gridSize * 0.32;
        const platformHeight = gridSize * 0.06;
        const roofSize = gridSize * 0.35;
        const roofHeight = gridSize * 0.25;
        
        // Draw environmental elements first
        this.drawEnvironment(ctx, gridSize);
        
        // Compact shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.save();
        ctx.translate(this.x + 3, this.y + 3);
        ctx.scale(1, 0.4);
        ctx.fillRect(-baseSize/2, -baseSize/2, baseSize, baseSize);
        ctx.restore();
        
        // Stone base - tight and aligned
        const baseY = this.y;
        
        // Base front face
        ctx.fillStyle = '#A9A9A9';
        ctx.fillRect(this.x - baseSize/2, baseY - baseHeight, baseSize, baseHeight);
        
        // Base top
        ctx.fillStyle = '#D3D3D3';
        ctx.fillRect(this.x - baseSize/2, baseY - baseHeight, baseSize, 2);
        
        // Stone texture
        ctx.strokeStyle = '#696969';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - baseSize/2, baseY - baseHeight, baseSize, baseHeight);
        
        // Tower structure - perfectly centered
        const towerY = baseY - baseHeight - towerHeight;
        const platformY = towerY - platformHeight;
        const roofY = platformY - roofHeight;
        
        // Four aligned corner posts
        const postSize = 3;
        const postOffset = towerSize/2 - postSize/2;
        const posts = [
            {x: -postOffset, y: 0},
            {x: postOffset, y: 0},
            {x: -postOffset, y: 0},
            {x: postOffset, y: 0}
        ];
        
        // Draw posts
        ctx.fillStyle = '#8B4513';
        posts.forEach(post => {
            ctx.fillRect(this.x + post.x, towerY, postSize, towerHeight);
        });
        
        // Horizontal braces
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        
        const braceY1 = towerY + towerHeight * 0.3;
        const braceY2 = towerY + towerHeight * 0.7;
        
        ctx.beginPath();
        ctx.moveTo(this.x - postOffset, braceY1);
        ctx.lineTo(this.x + postOffset, braceY1);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(this.x - postOffset, braceY2);
        ctx.lineTo(this.x + postOffset, braceY2);
        ctx.stroke();
        
        // Platform - centered and aligned
        ctx.fillStyle = '#D2B48C';
        ctx.fillRect(this.x - platformSize/2, platformY, platformSize, platformHeight);
        
        // Platform top
        ctx.fillStyle = '#DEB887';
        ctx.fillRect(this.x - platformSize/2, platformY, platformSize, 2);
        
        // Platform planks
        ctx.strokeStyle = '#8B7355';
        ctx.lineWidth = 1;
        for (let i = 1; i < 5; i++) {
            const plankX = this.x - platformSize/2 + (platformSize * i / 5);
            ctx.beginPath();
            ctx.moveTo(plankX, platformY);
            ctx.lineTo(plankX, platformY + platformHeight);
            ctx.stroke();
        }
        
        // Roof structure - aligned with platform
        const roofPostOffset = platformSize/2 - 2;
        
        // Roof posts
        ctx.fillStyle = '#654321';
        ctx.fillRect(this.x - roofPostOffset, platformY, 2, -roofHeight);
        ctx.fillRect(this.x + roofPostOffset, platformY, 2, -roofHeight);
        ctx.fillRect(this.x, platformY, 2, -roofHeight); // Center post
        
        // Roof surface
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x - roofSize/2, roofY, roofSize, 4);
        
        // Roof planks
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        for (let i = 1; i < 4; i++) {
            const plankX = this.x - roofSize/2 + (roofSize * i / 4);
            ctx.beginPath();
            ctx.moveTo(plankX, roofY);
            ctx.lineTo(plankX, roofY + 4);
            ctx.stroke();
        }
        
        // Render defender - centered on platform
        const defenderX = this.x;
        const defenderY = platformY - 10;
        
        ctx.save();
        ctx.translate(defenderX, defenderY);
        
        // Face target if exists
        if (this.target) {
            const targetAngle = Math.atan2(this.target.y - defenderY, this.target.x - defenderX);
            ctx.rotate(targetAngle);
        }
        
        // Defender body with blue shirt
        ctx.fillStyle = '#4169E1';
        ctx.fillRect(-2, -3, 4, 6);
        
        // Head
        ctx.fillStyle = '#DDBEA9';
        ctx.beginPath();
        ctx.arc(0, -5, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Helmet
        ctx.fillStyle = '#696969';
        ctx.beginPath();
        ctx.arc(0, -5, 2.5, Math.PI, Math.PI * 2);
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
        ctx.lineTo(-1 + Math.cos(armAngle) * 3, -2 + Math.sin(armAngle) * 3);
        ctx.stroke();
        
        // Other arm
        ctx.beginPath();
        ctx.moveTo(1, -2);
        ctx.lineTo(2.5, 0);
        ctx.stroke();
        
        // Rock in hand when ready to throw
        if (throwingDefender.armRaised > 0.5) {
            const rockX = -1 + Math.cos(armAngle) * 3.5;
            const rockY = -2 + Math.sin(armAngle) * 3.5;
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
        
        // Range indicator when targeting or selected
        if (this.target || this.isSelected) {
            ctx.strokeStyle = 'rgba(139, 69, 19, 0.3)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        // Floating icon in bottom right of 2x2 grid
        const iconSize = 20;
        const iconX = (this.gridX + 1.5) * cellSize;
        const iconY = (this.gridY + 1.5) * cellSize - 5;
        
        // Dynamic pulse for medieval glow effect
        const pulseIntensity = 0.7 + 0.3 * Math.sin(this.animationTime * 4);
        
        // Enhanced shadow for floating effect with medieval depth
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(iconX - iconSize/2 + 3, iconY - iconSize/2 + 3, iconSize, iconSize);
        
        // Parchment-like background with medieval gradient
        const parchmentGradient = ctx.createRadialGradient(
            iconX - iconSize/4, iconY - iconSize/4, 0,
            iconX, iconY, iconSize
        );
        parchmentGradient.addColorStop(0, `rgba(255, 248, 220, ${pulseIntensity})`);
        parchmentGradient.addColorStop(0.7, `rgba(245, 222, 179, ${pulseIntensity * 0.9})`);
        parchmentGradient.addColorStop(1, `rgba(222, 184, 135, ${pulseIntensity * 0.8})`);
        
        ctx.fillStyle = parchmentGradient;
        ctx.fillRect(iconX - iconSize/2, iconY - iconSize/2, iconSize, iconSize);
        
        // Ornate gold border with medieval styling
        ctx.strokeStyle = `rgba(184, 134, 11, ${pulseIntensity})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(iconX - iconSize/2, iconY - iconSize/2, iconSize, iconSize);
        
        // Inner gold accent border
        ctx.strokeStyle = `rgba(255, 215, 0, ${pulseIntensity * 0.8})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(iconX - iconSize/2 + 2, iconY - iconSize/2 + 2, iconSize - 4, iconSize - 4);
        
        // Subtle medieval glow effect
        const glowGradient = ctx.createRadialGradient(iconX, iconY, 0, iconX, iconY, iconSize * 1.5);
        glowGradient.addColorStop(0, `rgba(255, 215, 0, ${pulseIntensity * 0.2})`);
        glowGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = glowGradient;
        ctx.fillRect(iconX - iconSize/2 - 5, iconY - iconSize/2 - 5, iconSize + 10, iconSize + 10);
        
        // Symbol with enhanced medieval styling
        ctx.fillStyle = `rgba(101, 67, 33, ${pulseIntensity})`;
        ctx.font = 'bold 18px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🏰', iconX, iconY);
        
        // Add subtle gold highlight on symbol
        ctx.fillStyle = `rgba(255, 215, 0, ${pulseIntensity * 0.3})`;
        ctx.fillText('🏰', iconX, iconY);
        
        // Selection highlight on icon
        if (this.isSelected) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(iconX, iconY, iconSize/2 + 3, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    drawEnvironment(ctx, gridSize) {
        // Pine trees exactly like in barricade tower
        const trees = [
            { x: -gridSize * 0.4, y: gridSize * 0.4, size: 0.7 },
            { x: gridSize * 0.35, y: gridSize * 0.45, size: 0.6 },
            { x: -gridSize * 0.45, y: -gridSize * 0.3, size: 0.8 },
            { x: gridSize * 0.4, y: -gridSize * 0.4, size: 0.5 }
        ];
        
        trees.forEach(tree => {
            const treeX = this.x + tree.x;
            const treeY = this.y + tree.y;
            const scale = tree.size;
            
            // Tree shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.save();
            ctx.translate(treeX + 2, treeY + 2);
            ctx.scale(1, 0.5);
            ctx.beginPath();
            ctx.arc(0, 0, 6 * scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            
            // Tree trunk
            ctx.fillStyle = '#654321';
            ctx.fillRect(treeX - 1 * scale, treeY, 2 * scale, -6 * scale);
            
            // Trunk texture
            ctx.strokeStyle = '#5D4037';
            ctx.lineWidth = 1;
            for (let i = 1; i < 3; i++) {
                const y = treeY - (6 * scale * i / 3);
                ctx.beginPath();
                ctx.moveTo(treeX - 1 * scale, y);
                ctx.lineTo(treeX + 1 * scale, y);
                ctx.stroke();
            }
            
            // Pine layers
            const layers = [
                { y: -10 * scale, width: 8 * scale, color: '#0F3B0F' },
                { y: -7 * scale, width: 6 * scale, color: '#228B22' },
                { y: -4 * scale, width: 4 * scale, color: '#32CD32' }
            ];
            
            layers.forEach(layer => {
                ctx.fillStyle = layer.color;
                ctx.beginPath();
                ctx.moveTo(treeX, treeY + layer.y);
                ctx.lineTo(treeX - layer.width/2, treeY + layer.y + layer.width * 0.8);
                ctx.lineTo(treeX + layer.width/2, treeY + layer.y + layer.width * 0.8);
                ctx.closePath();
                ctx.fill();
                
                // Tree outline
                ctx.strokeStyle = '#0F3B0F';
                ctx.lineWidth = 1;
                ctx.stroke();
            });
        });
        
        // Bushes
        const bushes = [
            { x: -gridSize * 0.25, y: gridSize * 0.25, size: 0.3 },
            { x: gridSize * 0.2, y: -gridSize * 0.2, size: 0.25 },
            { x: -gridSize * 0.3, y: -gridSize * 0.35, size: 0.4 }
        ];
        
        bushes.forEach(bush => {
            const bushX = this.x + bush.x;
            const bushY = this.y + bush.y;
            const scale = bush.size;
            
            ctx.fillStyle = '#228B22';
            ctx.beginPath();
            ctx.arc(bushX, bushY, 3 * scale, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#32CD32';
            ctx.beginPath();
            ctx.arc(bushX - scale, bushY - scale, 2 * scale, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(bushX + scale, bushY - scale, 2 * scale, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Small rocks
        const rocks = [
            { x: -gridSize * 0.3, y: gridSize * 0.3, size: 0.2 },
            { x: gridSize * 0.25, y: gridSize * 0.2, size: 0.15 },
            { x: gridSize * 0.3, y: -gridSize * 0.25, size: 0.25 }
        ];
        
        rocks.forEach(rock => {
            const rockX = this.x + rock.x;
            const rockY = this.y + rock.y;
            const scale = rock.size;
            
            ctx.fillStyle = '#808080';
            ctx.beginPath();
            ctx.arc(rockX, rockY, 2 * scale, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#696969';
            ctx.lineWidth = 1;
            ctx.stroke();
        });
    }
    
    // Add click detection for icon
    isIconClicked(x, y, cellSize) {
        const iconSize = 20;
        const iconX = (this.gridX + 1.5) * cellSize;
        const iconY = (this.gridY + 1.5) * cellSize - 5;
        
        return Math.hypot(x - iconX, y - iconY) <= iconSize/2 + 3;
    }
    
    // Toggle selection
    toggleSelection() {
        this.isSelected = !this.isSelected;
        return this.isSelected;
    }
    
    // Get tower stats for UI display
    getStats() {
        return {
            name: 'Basic Tower',
            damage: this.damage,
            range: this.range,
            fireRate: this.fireRate,
            cost: 50,
            sellValue: Math.floor(50 * 0.7)
        };
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
