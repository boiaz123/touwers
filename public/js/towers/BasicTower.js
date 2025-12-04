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
        this.showRange = false; // Add property to control range display
        
        // Animation properties
        this.animationTime = 0; // Add missing initialization
        this.throwingDefender = -1; // Which defender is throwing
        this.throwAnimationTime = 0;
        this.rocks = [];
        this.defenders = [
            { angle: 0, armRaised: 0, throwCooldown: 0 },
            { angle: Math.PI / 2, armRaised: 0, throwCooldown: 0.3 },
            { angle: Math.PI, armRaised: 0, throwCooldown: 0.6 },
            { angle: 3 * Math.PI / 2, armRaised: 0, throwCooldown: 0.9 }
        ];

        // Prevent stat panel from opening immediately after build.
        // The panel will be allowed only when the tower icon is clicked.
        this.isSelected = false;
        this._suppressSelectionUntilClick = true;
        this._clickHandlerAttached = false;
        this._onCanvasClick = null;
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
        // CRITICAL: Use EXACT same calculation as Level.js cellSize
        const baseResolution = 1920;
        const scaleFactor = Math.max(0.5, Math.min(2.5, ctx.canvas.width / baseResolution));
        const cellSize = Math.floor(32 * scaleFactor);
        const gridSize = cellSize * 2; // 2x2 grid = 2 cells wide
        this.gridSize = gridSize; // Store for rock calculations

        // If the tower was auto-selected during build, suppress that selection
        // until the user explicitly clicks the tower icon.
        if (this._suppressSelectionUntilClick && this.isSelected) {
            this.isSelected = false;
        }

        // Attach click handler once to detect clicks on the tower icon.
        if (!this._clickHandlerAttached) {
            const canvas = ctx.canvas;
            this._clickHandlerAttached = true;
            this._onCanvasClick = (e) => {
                const rect = canvas.getBoundingClientRect();
                // Map mouse to canvas pixel coordinates
                const clickX = (e.clientX - rect.left) * (canvas.width / rect.width);
                const clickY = (e.clientY - rect.top) * (canvas.height / rect.height);

                // Recompute icon position using same logic as render
                const baseResolutionLocal = 1920;
                const scaleFactorLocal = Math.max(0.5, Math.min(2.5, canvas.width / baseResolutionLocal));
                const cellSizeLocal = Math.floor(32 * scaleFactorLocal);
                const iconSize = 20;
                const iconX = (this.gridX + 1.5) * cellSizeLocal;
                const iconY = (this.gridY + 1.5) * cellSizeLocal - 5;

                // Hit test against icon bounding box
                if (
                    clickX >= iconX - iconSize / 2 &&
                    clickX <= iconX + iconSize / 2 &&
                    clickY >= iconY - iconSize / 2 &&
                    clickY <= iconY + iconSize / 2
                ) {
                    // Allow selection and open stat panel
                    this._suppressSelectionUntilClick = false;
                    this.isSelected = true;
                }
            };
            canvas.addEventListener('click', this._onCanvasClick);
        }

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
        
        // Stone texture - add more lines for detail
        ctx.strokeStyle = '#696969';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - baseSize/2, baseY - baseHeight, baseSize, baseHeight);
        // Add horizontal stone lines
        for (let i = 1; i < 3; i++) {
            const stoneY = baseY - baseHeight + (baseHeight * i / 3);
            ctx.beginPath();
            ctx.moveTo(this.x - baseSize/2, stoneY);
            ctx.lineTo(this.x + baseSize/2, stoneY);
            ctx.stroke();
        }
        
        // Tower structure - perfectly centered
        const towerY = baseY - baseHeight - towerHeight;
        const platformY = towerY - platformHeight;
        const roofY = platformY - roofHeight;
        
        // Four aligned corner posts - more substantial, wood grain and metal plates
        const postSize = 4;
        const postOffset = towerSize/2 - postSize/2;
        const posts = [
            {x: -postOffset, y: 0},
            {x: postOffset, y: 0},
            {x: -postOffset, y: 0},
            {x: postOffset, y: 0}
        ];
        
        // Draw posts with wood grain and metal corner plates (simple armour)
        ctx.fillStyle = '#7a3f18'; // slightly darker wood
        posts.forEach((post, idx) => {
            // post
            ctx.fillRect(this.x + post.x, towerY, postSize, towerHeight);
            // wood grain lines
            ctx.strokeStyle = '#5a2f10';
            ctx.lineWidth = 1;
            for (let i = 1; i < 5; i++) {
                const grainY = towerY + (towerHeight * i / 6);
                ctx.beginPath();
                ctx.moveTo(this.x + post.x, grainY);
                ctx.lineTo(this.x + post.x + postSize, grainY);
                ctx.stroke();
            }
            // metal corner plate (simple armour)
            const plateW = 5;
            const plateH = 10;
            ctx.fillStyle = '#606060';
            ctx.fillRect(this.x + post.x - 1, towerY, plateW, plateH);
            ctx.strokeStyle = '#333';
            ctx.strokeRect(this.x + post.x - 1, towerY, plateW, plateH);
            // reset wood fill for next
            ctx.fillStyle = '#7a3f18';
        });
        
        // Horizontal braces and diagonal supports for realism
        ctx.strokeStyle = '#5b3a24';
        ctx.lineWidth = 2;
        const braceYs = [
            towerY + towerHeight * 0.25,
            towerY + towerHeight * 0.5,
            towerY + towerHeight * 0.75
        ];
        braceYs.forEach(y => {
            ctx.beginPath();
            ctx.moveTo(this.x - postOffset + 1, y);
            ctx.lineTo(this.x + postOffset - 1, y);
            ctx.stroke();
        });
        // diagonal braces
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(this.x - postOffset + 1, towerY + towerHeight);
        ctx.lineTo(this.x, towerY + towerHeight * 0.35);
        ctx.lineTo(this.x + postOffset - 1, towerY + towerHeight);
        ctx.stroke();
        
        // Platform - centered and aligned, add rail/railing and plank detail
        ctx.fillStyle = '#CDAA7A';
        ctx.fillRect(this.x - platformSize/2, platformY, platformSize, platformHeight);

        // platform top bevel
        ctx.fillStyle = '#DABE94';
        ctx.fillRect(this.x - platformSize/2, platformY, platformSize, 2);

        // Platform planks and nails
        ctx.strokeStyle = '#8B7355';
        ctx.lineWidth = 1;
        const planks = 6;
        for (let i = 0; i < planks; i++) {
            const plankX = this.x - platformSize/2 + (platformSize * i / planks);
            ctx.beginPath();
            ctx.moveTo(plankX, platformY);
            ctx.lineTo(plankX, platformY + platformHeight);
            ctx.stroke();
            // nails (small dots) every plank
            ctx.fillStyle = '#3b2a20';
            ctx.beginPath();
            ctx.arc(plankX + platformSize/planks/2, platformY + platformHeight/2, 0.7, 0, Math.PI*2);
            ctx.fill();
        }

        // Railing around platform (simple wooden rail)
        const railHeight = platformHeight * 0.9;
        ctx.fillStyle = '#6b3b18';
        // front rail
        ctx.fillRect(this.x - platformSize/2 - 1, platformY - railHeight, platformSize + 2, 2);
        // posts for railing
        for (let i = -1; i <= 1; i++) {
            const rx = this.x + i * (platformSize/4);
            ctx.fillRect(rx - 1, platformY - railHeight + 2, 2, railHeight - 2);
        }
        // small metal reinforcements on the rail (simple armour look)
        ctx.fillStyle = '#575757';
        ctx.fillRect(this.x - platformSize/2 - 1, platformY - railHeight, 4, 2);
        ctx.fillRect(this.x + platformSize/2 - 3, platformY - railHeight, 4, 2);

        // Roof posts and banner
        const roofPostOffset = platformSize/2 - 2;
        ctx.fillStyle = '#5a341d';
        ctx.fillRect(this.x - roofPostOffset, platformY, 2, -roofHeight);
        ctx.fillRect(this.x + roofPostOffset, platformY, 2, -roofHeight);
        ctx.fillRect(this.x, platformY, 2, -roofHeight); // center post

        // small cloth banner on center post
        ctx.fillStyle = '#8B1E3F'; // muted burgundy
        ctx.beginPath();
        ctx.moveTo(this.x + 1, platformY - roofHeight * 0.25);
        ctx.lineTo(this.x + 1 + 10, platformY - roofHeight * 0.25 + 4);
        ctx.lineTo(this.x + 1, platformY - roofHeight * 0.25 + 8);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#5b1028';
        ctx.stroke();

        // Roof surface and planks (slightly darker)
        ctx.fillStyle = '#6f3b1a';
        ctx.fillRect(this.x - roofSize/2, roofY, roofSize, 4);
        ctx.strokeStyle = '#4a2a17';
        ctx.lineWidth = 1;
        for (let i = 1; i < 5; i++) {
            const plankX = this.x - roofSize/2 + (roofSize * i / 5);
            ctx.beginPath();
            ctx.moveTo(plankX, roofY);
            ctx.lineTo(plankX, roofY + 4);
            ctx.stroke();
        }
        
        // Render defender - centered on platform with simple shoulder plates
        const defenderX = this.x;
        const defenderY = platformY - 10;

        ctx.save();
        ctx.translate(defenderX, defenderY);

        // Face target if exists
        if (this.target) {
            const targetAngle = Math.atan2(this.target.y - defenderY, this.target.x - defenderX);
            ctx.rotate(targetAngle);
        }

        // Defender body with blue shirt base
        ctx.fillStyle = '#4169E1';
        ctx.fillRect(-2, -3, 4, 6);

        // Simple armor: gray chest plate over shirt
        ctx.fillStyle = '#696969';
        ctx.fillRect(-2.5, -2.5, 5, 4);
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        ctx.strokeRect(-2.5, -2.5, 5, 4);

        // Add shoulder plates (simple round caps)
        ctx.fillStyle = '#5a5a5a';
        ctx.beginPath();
        ctx.arc(-3, -2.5, 1.1, 0, Math.PI*2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(3, -2.5, 1.1, 0, Math.PI*2);
        ctx.fill();

        // Head and helmet (unchanged)
        ctx.fillStyle = '#DDBEA9';
        ctx.beginPath();
        ctx.arc(0, -5, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#696969';
        ctx.beginPath();
        ctx.arc(0, -5, 2.5, Math.PI, Math.PI * 2);
        ctx.fill();
        
        // Arms and throwing animation (unchanged)
        ctx.strokeStyle = '#DDBEA9';
        ctx.lineWidth = 2;
        const throwingDefender = this.defenders[0];
        const armAngle = this.target && this.throwingDefender === 0 ?
            -Math.PI / 2 - throwingDefender.armRaised * Math.PI / 3 :
            Math.sin(Date.now() * 0.002) * 0.2;

        ctx.beginPath();
        ctx.moveTo(-1, -2);
        ctx.lineTo(-1 + Math.cos(armAngle) * 3, -2 + Math.sin(armAngle) * 3);
        ctx.stroke();
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
        
        // Range indicator only when tower is selected AND showRange is enabled
        if (this.isSelected && this.showRange) {
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
        parchmentGradient.addColorStop(0, `rgba(255, 248, 220, ${pulseIntensity})`); // Cream parchment
        parchmentGradient.addColorStop(0.7, `rgba(245, 222, 179, ${pulseIntensity * 0.9})`); // Antique parchment
        parchmentGradient.addColorStop(1, `rgba(222, 184, 135, ${pulseIntensity * 0.8})`); // Aged parchment
        
        ctx.fillStyle = parchmentGradient;
        ctx.fillRect(iconX - iconSize/2, iconY - iconSize/2, iconSize, iconSize);
        
        // Ornate gold border with medieval styling
        ctx.strokeStyle = `rgba(184, 134, 11, ${pulseIntensity})`; // Dark goldenrod
        ctx.lineWidth = 2;
        ctx.strokeRect(iconX - iconSize/2, iconY - iconSize/2, iconSize, iconSize);
        
        // Inner gold accent border
        ctx.strokeStyle = `rgba(255, 215, 0, ${pulseIntensity * 0.8})`; // Gold
        ctx.lineWidth = 1;
        ctx.strokeRect(iconX - iconSize/2 + 2, iconY - iconSize/2 + 2, iconSize - 4, iconSize - 4);
        
        // Subtle medieval glow effect
        const glowGradient = ctx.createRadialGradient(iconX, iconY, 0, iconX, iconY, iconSize * 1.5);
        glowGradient.addColorStop(0, `rgba(255, 215, 0, ${pulseIntensity * 0.2})`);
        glowGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = glowGradient;
        ctx.fillRect(iconX - iconSize/2 - 5, iconY - iconSize/2 - 5, iconSize + 10, iconSize + 10);
        
        // Symbol with enhanced medieval styling
        ctx.fillStyle = `rgba(101, 67, 33, ${pulseIntensity})`; // Dark brown for medieval text
        ctx.font = 'bold 18px serif'; // Serif font for medieval feel
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let symbol = '🏰'; // default
        switch(this.constructor.name) {
            case 'BasicTower': symbol = '🏰'; break;
            case 'CannonTower': symbol = '🎯'; break;
            case 'ArcherTower': symbol = '🏹'; break;
            case 'MagicTower': symbol = '⚡'; break;
            case 'BarricadeTower': symbol = '🛡️'; break;
            case 'PoisonArcherTower': symbol = '🌿'; break;
        }
        ctx.fillText(symbol, iconX, iconY);
        
        // Add subtle gold highlight on symbol
        ctx.fillStyle = `rgba(255, 215, 0, ${pulseIntensity * 0.3})`;
        ctx.fillText(symbol, iconX, iconY);
    }
    
    drawEnvironment(ctx, gridSize) {
        // Keep trees/bushes/rocks within the 2x2 grid; tweak positions and add small grass patches.
        // Tree sizes increased by 4x for a larger visual impact.
        const trees = [
            { x: -gridSize * 0.38, y: gridSize * 0.32, size: 0.7 * 4 },
            { x: gridSize * 0.34, y: gridSize * 0.36, size: 0.6 * 4 },
            { x: -gridSize * 0.42, y: -gridSize * 0.28, size: 0.8 * 4 },
            { x: gridSize * 0.36, y: -gridSize * 0.36, size: 0.5 * 4 }
        ];
        
        trees.forEach(tree => {
	        const treeX = this.x + tree.x;
	        const treeY = this.y + tree.y;
	        const scale = tree.size;
	        
	        // Tree shadow
	        ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
	        ctx.save();
	        ctx.translate(treeX + 2, treeY + 2);
	        ctx.scale(1, 0.45);
	        ctx.beginPath();
	        ctx.arc(0, 0, 6 * scale, 0, Math.PI * 2);
	        ctx.fill();
	        ctx.restore();
	        
	        // Trunk
	        ctx.fillStyle = '#5a341d';
	        ctx.fillRect(treeX - 1 * scale, treeY, 2 * scale, -6 * scale);

	        // Pine layers (slightly rebalanced colors)
	        const layers = [
	            { y: -10 * scale, width: 8 * scale, color: '#0e3a0e' },
	            { y: -7 * scale, width: 6 * scale, color: '#1f6f1f' },
	            { y: -4 * scale, width: 4 * scale, color: '#2fa02f' }
	        ];
	        
	        layers.forEach(layer => {
	            ctx.fillStyle = layer.color;
	            ctx.beginPath();
	            ctx.moveTo(treeX, treeY + layer.y);
	            ctx.lineTo(treeX - layer.width/2, treeY + layer.y + layer.width * 0.8);
	            ctx.lineTo(treeX + layer.width/2, treeY + layer.y + layer.width * 0.8);
	            ctx.closePath();
	            ctx.fill();
	            ctx.strokeStyle = '#0b2b0b';
	            ctx.lineWidth = 1;
	            ctx.stroke();
	        });
	    });
	    
        // Bushes (adjusted positions)
        const bushes = [
            { x: -gridSize * 0.22, y: gridSize * 0.22, size: 0.32 },
            { x: gridSize * 0.18, y: -gridSize * 0.18, size: 0.24 },
            { x: -gridSize * 0.28, y: -gridSize * 0.32, size: 0.38 }
        ];
        
        bushes.forEach(bush => {
            const bushX = this.x + bush.x;
            const bushY = this.y + bush.y;
            const scale = bush.size;

            ctx.fillStyle = '#1f6f1f';
            ctx.beginPath();
            ctx.arc(bushX, bushY, 3 * scale, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#28a028';
            ctx.beginPath();
            ctx.arc(bushX - scale, bushY - scale, 2 * scale, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(bushX + scale, bushY - scale, 2 * scale, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Small rocks (unchanged but ensure they fit)
        const rocks = [
            { x: -gridSize * 0.3, y: gridSize * 0.28, size: 0.22 },
            { x: gridSize * 0.25, y: gridSize * 0.18, size: 0.15 },
            { x: gridSize * 0.28, y: -gridSize * 0.24, size: 0.25 }
        ];
        
        rocks.forEach(rock => {
            const rockX = this.x + rock.x;
            const rockY = this.y + rock.y;
            const scale = rock.size;
            ctx.fillStyle = '#807f80';
            ctx.beginPath();
            ctx.arc(rockX, rockY, 2 * scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#696969';
            ctx.lineWidth = 1;
            ctx.stroke();
        });
        
        // Small grass patches for variety (keeps within grid)
        const grasses = [
            { x: -gridSize * 0.12, y: gridSize * 0.18 },
            { x: gridSize * 0.08, y: -gridSize * 0.12 }
        ];
        ctx.strokeStyle = '#2e8b2e';
        ctx.lineWidth = 1;
        grasses.forEach(g => {
            const gx = this.x + g.x;
            const gy = this.y + g.y;
            for (let i = 0; i < 4; i++) {
                const angle = -Math.PI/2 + (i-1.5)*0.2;
                ctx.beginPath();
                ctx.moveTo(gx, gy);
                ctx.lineTo(gx + Math.cos(angle)*6, gy + Math.sin(angle)*6);
                ctx.stroke();
            }
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
