import { Building } from './Building.js';

export class TrainingGrounds extends Building {
    constructor(x, y, gridX, gridY) {
        super(x, y, gridX, gridY, 4);
        this.isSelected = false;
        
        // Training Grounds building level - starts at 1 when built
        this.trainingLevel = 1;
        this.maxTrainingLevel = 5;
        
        // Defender system unlock and upgrade
        this.defenderUnlocked = false; // Unlocked at training level 3
        this.defenderMaxLevel = 1; // Upgraded to level 2 at training level 4, level 3 at training level 5
        
        // Guard Post system unlock and limits
        this.guardPostUnlocked = false; // Unlocked at training level 4
        this.maxGuardPosts = 0; // 1 at level 4, 2 at level 5
        
        // Range upgrades for manned towers - each tower has 5 levels
        // Towers: ArcherTower, BarricadeTower, BasicTower, PoisonArcherTower, CannonTower
        this.rangeUpgrades = {
            archerTower: { level: 0, maxLevel: 5, baseCost: 150, effect: 15 },
            barricadeTower: { level: 0, maxLevel: 5, baseCost: 150, effect: 15 },
            basicTower: { level: 0, maxLevel: 5, baseCost: 150, effect: 15 },
            poisonArcherTower: { level: 0, maxLevel: 5, baseCost: 150, effect: 15 },
            cannonTower: { level: 0, maxLevel: 5, baseCost: 150, effect: 15 }
        };
        
        this.upgrades = {
            damageTraining: { level: 0, maxLevel: 5, baseCost: 100, effect: 5 },
            speedTraining: { level: 0, maxLevel: 5, baseCost: 120, effect: 1.05 },
            accuracyTraining: { level: 0, maxLevel: 5, baseCost: 110, effect: 0.95 },
            staminaTraining: { level: 0, maxLevel: 5, baseCost: 130, effect: 1.1 }
        };
        
        this.trainingParticles = [];
        this.nextParticleTime = 0;
        
        // Left Archer Lane - organized firing line with row of targets
        this.leftArcherLane = {
            groundY: -28,
            archers: [
                { x: -38, y: -28, angle: 0, drawback: 0, animationOffset: 0, targetIdx: 0 },
                { x: -22, y: -28, angle: 0, drawback: 0, animationOffset: 0.4, targetIdx: 1 }
            ],
            targets: [
                { x: -28, distance: 35, hits: 0 },
                { x: -14, distance: 35, hits: 0 },
                { x: 0, distance: 35, hits: 0 },
                { x: 14, distance: 35, hits: 0 },
                { x: 28, distance: 35, hits: 0 }
            ]
        };
        
        // Right Archer Lane - organized firing line (mirrors left)
        this.rightArcherLane = {
            groundY: -28,
            archers: [
                { x: 38, y: -28, angle: 0, drawback: 0, animationOffset: 0.2, targetIdx: 3 },
                { x: 22, y: -28, angle: 0, drawback: 0, animationOffset: 0.6, targetIdx: 4 }
            ],
            targets: [
                { x: -28, distance: 35, hits: 0 },
                { x: -14, distance: 35, hits: 0 },
                { x: 0, distance: 35, hits: 0 },
                { x: 14, distance: 35, hits: 0 },
                { x: 28, distance: 35, hits: 0 }
            ]
        };
        
        // Sword Fighting Area - two separate dueling circles with spacing
        this.swordFightArea = {
            duelCircles: [
                { x: -24, y: 20 },
                { x: 24, y: 20 }
            ],
            fighters: [
                { circleIdx: 0, x: -4, y: 0, direction: 1, color: '#8B0000' },
                { circleIdx: 0, x: 4, y: 0, direction: -1, color: '#000080' },
                { circleIdx: 1, x: -4, y: 0, direction: 1, color: '#000080' },
                { circleIdx: 1, x: 4, y: 0, direction: -1, color: '#8B0000' }
            ]
        };
        
        // Training dummies for solo practice - positioned away from main areas
        this.dummies = [
            { x: -38, y: 8, type: 'wood', rotation: 0 },
            { x: 38, y: 8, type: 'wood', rotation: 0 }
        ];
        
        // Wooden hut in corner
        this.hut = {
            x: -42,
            y: -38,
            width: 10,
            height: 9
        };
        
        // Environmental decorations around fence - LARGER and OUTSIDE (but within grid)
        this.fenceDecorations = {
            trees: [
                { x: -54, y: -52, size: 1.8, gridX: -1, gridY: -1 },
                { x: -46, y: -54, size: 2.0, gridX: -1, gridY: -2 },
                { x: 54, y: -52, size: 1.9, gridX: 1, gridY: -1 },
                { x: 56, y: -48, size: 1.7, gridX: 2, gridY: -1 },
                { x: -56, y: 52, size: 1.95, gridX: -2, gridY: 1 },
                { x: 54, y: 54, size: 1.8, gridX: 1, gridY: 2 }
            ],
            rocks: [
                { x: -60, y: -40, size: 1.75 },
                { x: 60, y: -42, size: 2.0 },
                { x: -60, y: 36, size: 1.9 },
                { x: 60, y: 32, size: 1.6 }
            ],
            bushes: [
                { x: -57, y: -32, size: 0.6 },
                { x: 58, y: -36, size: 0.65 },
                { x: -56, y: 48, size: 0.55 },
                { x: 57, y: 52, size: 0.7 }
            ],
            barrels: [
                { x: -64, y: -24, type: 'wood' },
                { x: 64, y: -22, type: 'wood' },
                { x: -62, y: 28, type: 'wood' },
                { x: 62, y: 26, type: 'wood' }
            ]
        };
        
        this.fencePerimeter = {
            segments: [
                { startX: -50, startY: -48, endX: 50, endY: -48, posts: 13 },
                { startX: 50, startY: -48, endX: 50, endY: 48, posts: 12 },
                { startX: 50, startY: 48, endX: -50, endY: 48, posts: 13 },
                { startX: -50, startY: 48, endX: -50, endY: -48, posts: 12 }
            ]
        };
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        // Update left archer lane animations - targeting specific targets
        this.leftArcherLane.archers.forEach(archer => {
            archer.drawback = (Math.sin(this.animationTime * 3 + archer.animationOffset) + 1) * 0.5;
            archer.angle = 0;
        });
        
        // Update right archer lane animations
        this.rightArcherLane.archers.forEach(archer => {
            archer.drawback = (Math.sin(this.animationTime * 3 + archer.animationOffset) + 1) * 0.5;
            archer.angle = 0;
        });
        
        // Update duel animations
        this.swordFightArea.fighters.forEach(fighter => {
            fighter.swingAngle = Math.sin(this.animationTime * 4 + fighter.direction) * 0.6;
            fighter.stance = Math.sin(this.animationTime * 2) * 0.3;
        });
        
        this.nextParticleTime -= deltaTime;
        if (this.nextParticleTime <= 0) {
            const particleType = Math.floor(Math.random() * 3);
            
            if (particleType === 0 && Math.random() > 0.3) {
                // Arrow from left archer lane toward specific target
                const archer = this.leftArcherLane.archers[Math.floor(Math.random() * this.leftArcherLane.archers.length)];
                const targetIdx = archer.targetIdx;
                const target = this.leftArcherLane.targets[targetIdx];
                
                const targetScreenX = this.x + target.x;
                const targetScreenY = this.y + this.leftArcherLane.groundY - target.distance;
                const archerScreenX = this.x + archer.x;
                const archerScreenY = this.y + archer.y;
                
                const dx = targetScreenX - archerScreenX;
                const dy = targetScreenY - archerScreenY;
                const distance = Math.hypot(dx, dy);
                const speed = 150;
                
                this.trainingParticles.push({
                    x: archerScreenX + 8,
                    y: archerScreenY,
                    vx: (dx / distance) * speed,
                    vy: (dy / distance) * speed,
                    life: (distance / speed) + 0.5,
                    maxLife: (distance / speed) + 0.5,
                    type: 'arrow',
                    size: 2,
                    targetX: targetScreenX,
                    targetY: targetScreenY,
                    hitRadius: 6
                });
            } else if (particleType === 1 && Math.random() > 0.3) {
                // Arrow from right archer lane toward specific target
                const archer = this.rightArcherLane.archers[Math.floor(Math.random() * this.rightArcherLane.archers.length)];
                const targetIdx = archer.targetIdx;
                const target = this.rightArcherLane.targets[targetIdx];
                
                const targetScreenX = this.x + target.x;
                const targetScreenY = this.y + this.rightArcherLane.groundY - target.distance;
                const archerScreenX = this.x + archer.x;
                const archerScreenY = this.y + archer.y;
                
                const dx = targetScreenX - archerScreenX;
                const dy = targetScreenY - archerScreenY;
                const distance = Math.hypot(dx, dy);
                const speed = 150;
                
                this.trainingParticles.push({
                    x: archerScreenX - 8,
                    y: archerScreenY,
                    vx: (dx / distance) * speed,
                    vy: (dy / distance) * speed,
                    life: (distance / speed) + 0.5,
                    maxLife: (distance / speed) + 0.5,
                    type: 'arrow',
                    size: 2,
                    targetX: targetScreenX,
                    targetY: targetScreenY,
                    hitRadius: 6
                });
            } else {
                // Dust from sword fight
                const circle = this.swordFightArea.duelCircles[Math.floor(Math.random() * this.swordFightArea.duelCircles.length)];
                this.trainingParticles.push({
                    x: this.x + circle.x + (Math.random() - 0.5) * 12,
                    y: this.y + circle.y + (Math.random() - 0.5) * 12,
                    vx: (Math.random() - 0.5) * 40,
                    vy: -Math.random() * 25 - 15,
                    life: 2,
                    maxLife: 2,
                    type: 'dust',
                    size: Math.random() * 2.5 + 1
                });
            }
            
            this.nextParticleTime = 0.2 + Math.random() * 0.4;
        }
        
        // Update particles
        this.trainingParticles = this.trainingParticles.filter(particle => {
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.life -= deltaTime;
            particle.vy += 120 * deltaTime;
            
            // Check if arrow hit its target
            if (particle.type === 'arrow' && particle.targetX && particle.targetY) {
                const dx = particle.x - particle.targetX;
                const dy = particle.y - particle.targetY;
                const distance = Math.hypot(dx, dy);
                
                // If arrow is close to target, it hits and disappears
                if (distance < particle.hitRadius) {
                    return false; // Remove the arrow
                }
            }
            
            if (particle.type === 'dust') {
                particle.size = Math.max(0, particle.size * (particle.life / particle.maxLife));
            }
            
            return particle.life > 0;
        });
    }
    
    render(ctx, size) {
        this.renderDetailedGround(ctx, size);
        this.renderFencePerimeter(ctx, size);
        this.renderFenceDecorations(ctx, size);
        this.renderHut(ctx, size);
        this.renderLaneMarkings(ctx, size);
        this.renderArcherLane(ctx, this.leftArcherLane, true);
        this.renderArcherLane(ctx, this.rightArcherLane, false);
        this.renderSwordFightArea(ctx, size);
        this.renderDummies(ctx, size);
        this.renderParticles(ctx);
        
    }
    
    renderDetailedGround(ctx, size) {
        // Main grass base - only within fence
        const grassGradient = ctx.createLinearGradient(
            this.x - 50, this.y - 48,
            this.x - 50, this.y + 48
        );
        grassGradient.addColorStop(0, '#5A7A3A');
        grassGradient.addColorStop(0.5, '#6B8E3A');
        grassGradient.addColorStop(1, '#4A6A2A');
        
        ctx.fillStyle = grassGradient;
        ctx.fillRect(this.x - 50, this.y - 48, 100, 96);
        
        // Dirt paths and wear areas
        const wearPatches = [
            // Left archer lane
            { x: -38, y: -28, width: 27, height: 4, intensity: 0.5 },
            // Right archer lane
            { x: 38, y: -28, width: 27, height: 4, intensity: 0.5 },
            // Left sword fight area
            { x: -24, y: 20, width: 18, height: 18, intensity: 0.6 },
            // Right sword fight area
            { x: 24, y: 20, width: 18, height: 18, intensity: 0.6 },
            // Dummy areas
            { x: -38, y: 8, width: 13, height: 8, intensity: 0.4 },
            { x: 38, y: 8, width: 13, height: 8, intensity: 0.4 }
        ];
        
        wearPatches.forEach(patch => {
            const dirtGradient = ctx.createRadialGradient(
                this.x + patch.x, this.y + patch.y, 0,
                this.x + patch.x, this.y + patch.y, Math.max(patch.width, patch.height)
            );
            dirtGradient.addColorStop(0, `rgba(139, 90, 43, ${patch.intensity})`);
            dirtGradient.addColorStop(0.7, `rgba(139, 90, 43, ${patch.intensity * 0.5})`);
            dirtGradient.addColorStop(1, `rgba(139, 90, 43, 0)`);
            
            ctx.fillStyle = dirtGradient;
            ctx.fillRect(this.x + patch.x - patch.width/2, this.y + patch.y - patch.height/2, patch.width, patch.height);
        });
        
        // Grass variations around perimeter
        const grassVariations = [
            { x: -42, y: -38, radius: 5, opacity: 0.25 },
            { x: 42, y: -38, radius: 5, opacity: 0.25 },
            { x: -42, y: 38, radius: 6, opacity: 0.3 },
            { x: 42, y: 38, radius: 6, opacity: 0.3 }
        ];
        
        grassVariations.forEach(area => {
            const grassVariationGradient = ctx.createRadialGradient(
                this.x + area.x, this.y + area.y, 0,
                this.x + area.x, this.y + area.y, area.radius
            );
            grassVariationGradient.addColorStop(0, `rgba(34, 139, 34, ${area.opacity})`);
            grassVariationGradient.addColorStop(1, `rgba(34, 139, 34, 0)`);
            
            ctx.fillStyle = grassVariationGradient;
            ctx.beginPath();
            ctx.arc(this.x + area.x, this.y + area.y, area.radius, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Scattered stones and rocks - inside fence
        const rocks = [
            { x: -47, y: -35, size: 1 },
            { x: 47, y: -35, size: 1 },
            { x: -47, y: 35, size: 1.1 },
            { x: 47, y: 35, size: 1 }
        ];
        
        rocks.forEach(rock => {
            ctx.fillStyle = '#8B8680';
            ctx.strokeStyle = '#696969';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.arc(this.x + rock.x, this.y + rock.y, rock.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });
    }
    
    renderLaneMarkings(ctx, size) {
        // Archer lane dividers
        ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([8, 8]);
        
        ctx.beginPath();
        ctx.moveTo(this.x - 48, this.y - 28);
        ctx.lineTo(this.x + 48, this.y - 28);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(this.x - 48, this.y + 8);
        ctx.lineTo(this.x + 48, this.y + 8);
        ctx.stroke();
        
        ctx.setLineDash([]);
    }
    
    renderFencePerimeter(ctx, size) {
        // Render fence perimeter with posts and rails
        this.fencePerimeter.segments.forEach(segment => {
            const startX = this.x + segment.startX;
            const startY = this.y + segment.startY;
            const endX = this.x + segment.endX;
            const endY = this.y + segment.endY;
            
            const angle = Math.atan2(endY - startY, endX - startX);
            const distance = Math.hypot(endX - startX, endY - startY);
            const postSpacing = distance / (segment.posts - 1);
            
            for (let i = 0; i < segment.posts; i++) {
                const postX = startX + Math.cos(angle) * (i * postSpacing);
                const postY = startY + Math.sin(angle) * (i * postSpacing);
                
                ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                ctx.fillRect(postX - 1, postY + 1, 2, 1.5);
                
                ctx.fillStyle = '#8B6F47';
                ctx.fillRect(postX - 1.25, postY - 11, 2.5, 12);
                
                ctx.fillStyle = '#654321';
                ctx.fillRect(postX - 1.75, postY - 12, 3.5, 1.5);
                
                ctx.strokeStyle = '#654321';
                ctx.lineWidth = 0.5;
                for (let g = 0; g < 3; g++) {
                    ctx.beginPath();
                    ctx.moveTo(postX - 1.25, postY - 10 + (g * 3.5));
                    ctx.lineTo(postX + 1.25, postY - 9.5 + (g * 3.5));
                    ctx.stroke();
                }
            }
            
            for (let i = 0; i < segment.posts - 1; i++) {
                const railStartX = startX + Math.cos(angle) * (i * postSpacing);
                const railStartY = startY + Math.sin(angle) * (i * postSpacing);
                const railEndX = startX + Math.cos(angle) * ((i + 1) * postSpacing);
                const railEndY = startY + Math.sin(angle) * ((i + 1) * postSpacing);
                
                ctx.strokeStyle = '#CD853F';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(railStartX, railStartY - 5);
                ctx.lineTo(railEndX, railEndY - 5);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(railStartX, railStartY - 1.5);
                ctx.lineTo(railEndX, railEndY - 1.5);
                ctx.stroke();
            }
        });
    }
    
    renderFenceDecorations(ctx, size) {
        // Render trees around fence using level-based rendering
        this.fenceDecorations.trees.forEach(tree => {
            const treeX = this.x + tree.x;
            const treeY = this.y + tree.y;
            const treeSize = tree.size * 15; // Scale up the tree size (increased from 8)
            
            // Render tree using level-based method
            this.renderTree(ctx, treeX, treeY, treeSize, tree.gridX, tree.gridY);
        });
        
        // Render rocks around fence
        this.fenceDecorations.rocks.forEach(rock => {
            ctx.fillStyle = '#696969';
            ctx.strokeStyle = '#2F2F2F';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.arc(this.x + rock.x, this.y + rock.y, rock.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });
        
        // Render bushes around fence
        this.fenceDecorations.bushes.forEach(bush => {
            const bushX = this.x + bush.x;
            const bushY = this.y + bush.y;
            const scale = bush.size;
            
            ctx.fillStyle = '#1f6f1f';
            ctx.beginPath();
            ctx.arc(bushX, bushY, 2.5 * scale, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#28a028';
            ctx.beginPath();
            ctx.arc(bushX - 1 * scale, bushY - 1 * scale, 1.75 * scale, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(bushX + 1 * scale, bushY - 1 * scale, 1.75 * scale, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Render barrels around fence
        this.fenceDecorations.barrels.forEach(barrel => {
            const barrelX = this.x + barrel.x;
            const barrelY = this.y + barrel.y;
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(barrelX - 2.5, barrelY + 1.5, 5, 1.5);
            
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(barrelX - 2.5, barrelY - 5, 5, 6.5);
            
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 0.75;
            ctx.strokeRect(barrelX - 2.5, barrelY - 5, 5, 6.5);
            
            ctx.beginPath();
            ctx.moveTo(barrelX - 2.5, barrelY - 3);
            ctx.lineTo(barrelX + 2.5, barrelY - 3);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(barrelX - 2.5, barrelY - 1);
            ctx.lineTo(barrelX + 2.5, barrelY - 1);
            ctx.stroke();
        });
    }
    
    // Tree rendering methods from LevelBase (adapted for scaled usage)
    renderTree(ctx, x, y, size, gridX, gridY) {
        const seed = Math.floor(gridX + gridY) % 4;
        switch(seed) {
            case 0:
                this.renderTreeType1(ctx, x, y, size);
                break;
            case 1:
                this.renderTreeType2(ctx, x, y, size);
                break;
            case 2:
                this.renderTreeType3(ctx, x, y, size);
                break;
            default:
                this.renderTreeType4(ctx, x, y, size);
        }
    }

    renderTreeType1(ctx, x, y, size) {
        const trunkWidth = size * 0.25;
        const trunkHeight = size * 0.5;
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(x - trunkWidth * 0.5, y, trunkWidth, trunkHeight);
        ctx.fillStyle = '#3E2723';
        ctx.fillRect(x, y, trunkWidth * 0.5, trunkHeight);
        ctx.fillStyle = '#0D3817';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.6);
        ctx.lineTo(x + size * 0.35, y - size * 0.1);
        ctx.lineTo(x - size * 0.35, y - size * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.35);
        ctx.lineTo(x + size * 0.3, y + size * 0.05);
        ctx.lineTo(x - size * 0.3, y + size * 0.05);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.15);
        ctx.lineTo(x + size * 0.25, y + size * 0.2);
        ctx.lineTo(x - size * 0.25, y + size * 0.2);
        ctx.closePath();
        ctx.fill();
    }

    renderTreeType2(ctx, x, y, size) {
        const trunkWidth = size * 0.2;
        const trunkHeight = size * 0.4;
        ctx.fillStyle = '#6B4423';
        ctx.fillRect(x - trunkWidth * 0.5, y, trunkWidth, trunkHeight);
        ctx.fillStyle = '#8B5A3C';
        ctx.fillRect(x - trunkWidth * 0.5 + trunkWidth * 0.6, y, trunkWidth * 0.4, trunkHeight);
        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.1, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.35, size * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#43A047';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.55, size * 0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    renderTreeType3(ctx, x, y, size) {
        // Sparse tree with distinct branches
        const trunkWidth = size * 0.22;
        ctx.fillStyle = '#795548';
        ctx.fillRect(x - trunkWidth * 0.5, y - size * 0.2, trunkWidth, size * 0.6);
        ctx.fillStyle = '#4E342E';
        ctx.beginPath();
        ctx.arc(x + trunkWidth * 0.25, y, trunkWidth * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.arc(x - size * 0.28, y - size * 0.35, size * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + size * 0.28, y - size * 0.3, size * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.55, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    renderTreeType4(ctx, x, y, size) {
        // Pine/Spruce style with layered triangles
        const trunkWidth = size * 0.18;
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x - trunkWidth * 0.5, y - size * 0.05, trunkWidth, size * 0.45);
        ctx.fillStyle = '#0D3817';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.05);
        ctx.lineTo(x + size * 0.38, y + size * 0.15);
        ctx.lineTo(x - size * 0.38, y + size * 0.15);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.25);
        ctx.lineTo(x + size * 0.3, y);
        ctx.lineTo(x - size * 0.3, y);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.45);
        ctx.lineTo(x + size * 0.2, y - size * 0.15);
        ctx.lineTo(x - size * 0.2, y - size * 0.15);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#43A047';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.65);
        ctx.lineTo(x + size * 0.12, y - size * 0.35);
        ctx.lineTo(x - size * 0.12, y - size * 0.35);
        ctx.closePath();
        ctx.fill();
    }
    
    renderHut(ctx, size) {
        const hutX = this.x + this.hut.x;
        const hutY = this.y + this.hut.y;
        
        // Hut shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(hutX - this.hut.width/2 + 1, hutY + 1, this.hut.width, this.hut.height);
        
        // Hut main body - wooden walls
        ctx.fillStyle = '#8B6F47';
        ctx.fillRect(hutX - this.hut.width/2, hutY, this.hut.width, this.hut.height);
        
        // Hut wall outline
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        ctx.strokeRect(hutX - this.hut.width/2, hutY, this.hut.width, this.hut.height);
        
        // Wooden plank details on walls
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 0.25;
        for (let i = 1; i < 4; i++) {
            const plankY = hutY + (this.hut.height * i / 4);
            ctx.beginPath();
            ctx.moveTo(hutX - this.hut.width/2, plankY);
            ctx.lineTo(hutX + this.hut.width/2, plankY);
            ctx.stroke();
        }
        
        // Hut door
        const doorWidth = 2.5;
        const doorHeight = 5;
        ctx.fillStyle = '#654321';
        ctx.fillRect(hutX - doorWidth/2, hutY + this.hut.height - doorHeight, doorWidth, doorHeight);
        
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 0.25;
        ctx.strokeRect(hutX - doorWidth/2, hutY + this.hut.height - doorHeight, doorWidth, doorHeight);
        
        // Door handle
        ctx.fillStyle = '#C0C0C0';
        ctx.beginPath();
        ctx.arc(hutX + doorWidth/2 - 0.5, hutY + this.hut.height - doorHeight/2, 0.25, 0, Math.PI * 2);
        ctx.fill();
        
        // Hut roof - peaked gable
        ctx.fillStyle = '#654321';
        ctx.beginPath();
        ctx.moveTo(hutX - this.hut.width/2, hutY);
        ctx.lineTo(hutX, hutY - 4);
        ctx.lineTo(hutX + this.hut.width/2, hutY);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        
        // Roof tiles (simple lines)
        ctx.strokeStyle = '#5D4E37';
        ctx.lineWidth = 0.25;
        for (let i = 0; i < 3; i++) {
            const roofY = hutY - (4 * (i + 1) / 3);
            ctx.beginPath();
            ctx.moveTo(hutX - this.hut.width/2 + (i * 1), roofY);
            ctx.lineTo(hutX + this.hut.width/2 - (i * 1), roofY);
            ctx.stroke();
        }
        
        // Small window
        ctx.fillStyle = '#4169E1';
        ctx.fillRect(hutX - 1.5, hutY + 2, 1.5, 1.5);
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 0.25;
        ctx.strokeRect(hutX - 1.5, hutY + 2, 1.5, 1.5);
    }
    
    renderArcherLane(ctx, lane, isLeftLane) {
        // Render targets in a row - EVENLY SPACED
        lane.targets.forEach((target, idx) => {
            const targetX = this.x + target.x;
            const targetY = this.y + lane.groundY - target.distance;
            
            ctx.save();
            ctx.translate(targetX, targetY);
            
            ctx.fillStyle = '#654321';
            ctx.fillRect(-0.75, 0, 1.5, 10);
            
            ctx.fillStyle = '#5D4E37';
            ctx.fillRect(-2, 10, 4, 1);
            
            const rings = [
                { radius: 5.5, color: '#DC143C', shadow: 1 },
                { radius: 3.7, color: '#FFD700', shadow: 0.8 },
                { radius: 2, color: '#DC143C', shadow: 0.6 },
                { radius: 0.8, color: '#FFD700', shadow: 0.4 }
            ];
            
            rings.forEach(ring => {
                ctx.fillStyle = `rgba(0, 0, 0, ${0.15 * ring.shadow})`;
                ctx.beginPath();
                ctx.arc(0.3, 0.3, ring.radius, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = ring.color;
                ctx.beginPath();
                ctx.arc(0, 0, ring.radius, 0, Math.PI * 2);
                ctx.fill();
            });
            
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.arc(0, 0, 6, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.restore();
        });
        
        // Render archers
        lane.archers.forEach(archer => {
            ctx.save();
            ctx.translate(this.x + archer.x, this.y + archer.y);
            
            // Mirror archers on right side
            if (!isLeftLane) {
                ctx.scale(-1, 1);
            }
            
            // Archer shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.ellipse(0.5, 0.5, 2, 0.7, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Archer body
            ctx.fillStyle = '#2D5016';
            ctx.fillRect(-2.5, -6.5, 5, 8);
            
            // Archer head
            ctx.fillStyle = '#DDBEA9';
            ctx.beginPath();
            ctx.arc(0, -7.5, 1.7, 0, Math.PI * 2);
            ctx.fill();
            
            // Archer helm
            ctx.fillStyle = '#696969';
            ctx.beginPath();
            ctx.arc(0, -7.8, 2, Math.PI, Math.PI * 2);
            ctx.fill();
            
            // Bow
            const bowX = 2.5;
            const bowDrawAmount = archer.drawback * 2;
            
            ctx.strokeStyle = '#8B6914';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(bowX, -5);
            ctx.quadraticCurveTo(bowX + 2, -7.5, bowX + 1.3, -9);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(bowX, -5);
            ctx.quadraticCurveTo(bowX + 2, -2.5, bowX + 1.3, -1);
            ctx.stroke();
            
            // Bowstring
            ctx.strokeStyle = '#D2B48C';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(bowX + 1.3, -9);
            ctx.lineTo(bowX - bowDrawAmount, -5);
            ctx.lineTo(bowX + 1.3, -1);
            ctx.stroke();
            
            // Arrow nocked
            if (archer.drawback > 0.3) {
                ctx.strokeStyle = '#8B4513';
                ctx.lineWidth = 0.7;
                ctx.beginPath();
                ctx.moveTo(bowX - bowDrawAmount, -5);
                ctx.lineTo(bowX - bowDrawAmount - 4, -5);
                ctx.stroke();
                
                ctx.fillStyle = '#696969';
                ctx.beginPath();
                ctx.moveTo(bowX - bowDrawAmount - 4, -5);
                ctx.lineTo(bowX - bowDrawAmount - 5.2, -4.2);
                ctx.lineTo(bowX - bowDrawAmount - 5.2, -5.8);
                ctx.closePath();
                ctx.fill();
            }
            
            ctx.restore();
        });
    }
    
    renderSwordFightArea(ctx, size) {
        // Render duel circles with proper spacing
        this.swordFightArea.duelCircles.forEach((circle, circleIdx) => {
            ctx.strokeStyle = 'rgba(139, 69, 19, 0.3)';
            ctx.lineWidth = 0.5;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(this.x + circle.x, this.y + circle.y, 8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        });
        
        // Render fighters with proper spacing
        this.swordFightArea.fighters.forEach(fighter => {
            const circle = this.swordFightArea.duelCircles[fighter.circleIdx];
            const fighterX = this.x + circle.x + fighter.x;
            const fighterY = this.y + circle.y + fighter.y;
            
            ctx.save();
            ctx.translate(fighterX, fighterY);
            
            // Fighter shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.ellipse(0, 2, 2.3, 0.7, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Fighter body
            ctx.fillStyle = fighter.color;
            ctx.fillRect(-2.7, -8, 5.4, 9.5);
            
            // Fighter armor
            ctx.fillStyle = '#696969';
            ctx.fillRect(-2.3, -6.5, 4.6, 5.3);
            
            ctx.strokeStyle = '#2F2F2F';
            ctx.lineWidth = 0.3;
            ctx.strokeRect(-2.3, -6.5, 4.6, 5.3);
            
            // Fighter head
            ctx.fillStyle = '#DDBEA9';
            ctx.beginPath();
            ctx.arc(0, -8.5, 1.6, 0, Math.PI * 2);
            ctx.fill();
            
            // Fighter helmet
            ctx.fillStyle = '#696969';
            ctx.beginPath();
            ctx.arc(0, -8.8, 1.95, Math.PI, Math.PI * 2);
            ctx.fill();
            
            // Shield
            const shieldX = fighter.direction > 0 ? -3.2 : 3.2;
            ctx.fillStyle = '#CD853F';
            ctx.beginPath();
            ctx.arc(shieldX, -4, 2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.arc(shieldX, -4, 2, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.fillStyle = '#DC143C';
            ctx.beginPath();
            ctx.arc(shieldX, -4, 0.8, 0, Math.PI * 2);
            ctx.fill();
            
            // Sword with swing
            const swordX = fighter.direction > 0 ? 2.7 : -2.7;
            const swingAmount = fighter.swingAngle * fighter.direction;
            
            ctx.strokeStyle = '#C0C0C0';
            ctx.lineWidth = 1.2;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(swordX, -5);
            ctx.lineTo(swordX + (swingAmount * 3.3), -5 - 5 + (Math.abs(swingAmount) * 2));
            ctx.stroke();
            
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(swordX, -5, 1, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#808080';
            const tipX = swordX + (swingAmount * 3.3);
            const tipY = -5 - 5 + (Math.abs(swingAmount) * 2);
            ctx.beginPath();
            ctx.moveTo(tipX, tipY);
            ctx.lineTo(tipX + 0.7, tipY - 1.3);
            ctx.lineTo(tipX - 0.7, tipY - 1.3);
            ctx.closePath();
            ctx.fill();
            
            // Legs
            ctx.strokeStyle = '#2F2F2F';
            ctx.lineWidth = 1.2;
            ctx.lineCap = 'round';
            const stanceShift = fighter.stance * 1.3;
            ctx.beginPath();
            ctx.moveTo(-0.7, 1.5);
            ctx.lineTo(-0.7 + stanceShift, 3.2);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(0.7, 1.5);
            ctx.lineTo(0.7 - stanceShift, 3.2);
            ctx.stroke();
            
            ctx.restore();
        });
    }
    
    renderDummies(ctx, size) {
        this.dummies.forEach(dummy => {
            const x = this.x + dummy.x;
            const y = this.y + dummy.y;
            
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(dummy.rotation);
            
            // Dummy post/stand
            ctx.fillStyle = '#654321';
            ctx.fillRect(-1.5, 0, 3, 19);
            
            ctx.fillStyle = '#5D4E37';
            ctx.fillRect(-4, 19, 8, 2);
            
            ctx.fillStyle = '#8B6F47';
            ctx.beginPath();
            ctx.arc(0, -16, 4, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.arc(0, -16, 4, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.fillStyle = '#A0522D';
            ctx.fillRect(-4, -10, 8, 9);
            
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(-4, -7);
            ctx.lineTo(4, -7);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(-4, -4);
            ctx.lineTo(4, -4);
            ctx.stroke();
            
            ctx.strokeStyle = '#8B6F47';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-4, -7);
            ctx.lineTo(-8.5, -5);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(4, -7);
            ctx.lineTo(8.5, -5);
            ctx.stroke();
            
            ctx.fillStyle = 'rgba(100, 50, 0, 0.5)';
            ctx.beginPath();
            ctx.arc(-1.3, -5, 1.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(2, -2.5, 1, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
    }
    
    renderParticles(ctx) {
        // Render training particles (arrows and dust)
        this.trainingParticles.forEach(particle => {
            const alpha = particle.life / particle.maxLife;
            
            if (particle.type === 'arrow') {
                ctx.save();
                ctx.translate(particle.x, particle.y);
                const arrowAngle = Math.atan2(particle.vy, particle.vx);
                ctx.rotate(arrowAngle);
                
                ctx.strokeStyle = `rgba(139, 69, 19, ${alpha})`;
                ctx.lineWidth = 0.75;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(5, 0);
                ctx.stroke();
                
                ctx.fillStyle = `rgba(192, 192, 192, ${alpha})`;
                ctx.beginPath();
                ctx.moveTo(5, 0);
                ctx.lineTo(6, -0.75);
                ctx.lineTo(6, 0.75);
                ctx.closePath();
                ctx.fill();
                
                ctx.strokeStyle = `rgba(220, 20, 60, ${alpha})`;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(0, -0.5);
                ctx.lineTo(-2, -1);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0, 0.5);
                ctx.lineTo(-2, 1);
                ctx.stroke();
                
                ctx.restore();
            } else if (particle.type === 'dust') {
                ctx.fillStyle = `rgba(160, 100, 50, ${alpha * 0.4})`;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = `rgba(200, 150, 100, ${alpha * 0.2})`;
                ctx.beginPath();
                ctx.arc(particle.x - particle.size * 0.3, particle.y - particle.size * 0.3, particle.size * 0.4, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }
    
    onClick() {
        // Handle click event - open upgrade menu
        this.isSelected = true;
        return {
            type: 'training_menu',
            trainingGrounds: this,
            upgrades: this.getRangeUpgradeOptions(),
            trainingUpgrade: this.getTrainingLevelUpgradeOption()
        };
    }
    
    /**
     * Get available range upgrade options based on current training grounds level
     * Each training grounds level unlocks the next upgrade level for all towers
     */
    getRangeUpgradeOptions() {
        const options = [];
        
        // Manned tower types for range upgrades
        const towerTypes = [
            { id: 'archerTower', name: 'Archer Tower', icon: '🏹' },
            { id: 'barricadeTower', name: 'Barricade Tower', icon: '🛡️' },
            { id: 'basicTower', name: 'Basic Tower', icon: '⚔️' },
            { id: 'poisonArcherTower', name: 'Poison Archer Tower', icon: '☠️' },
            { id: 'cannonTower', name: 'Cannon Tower', icon: '🔫' }
        ];
        
        // Add range upgrade for each manned tower
        towerTypes.forEach(tower => {
            const upgrade = this.rangeUpgrades[tower.id];
            
            // Check if this upgrade level is unlocked (training level must be >= upgrade level + 1)
            const isUnlocked = this.trainingLevel > upgrade.level;
            
            options.push({
                id: `range_${tower.id}`,
                towerType: tower.id,
                name: `${tower.name} Range Training`,
                description: `Increase ${tower.name} range by ${upgrade.effect} pixels per level`,
                level: upgrade.level,
                maxLevel: upgrade.maxLevel,
                cost: this.calculateRangeUpgradeCost(tower.id),
                icon: tower.icon,
                isUnlocked: isUnlocked
            });
        });
        
        return options;
    }
    
    /**
     * Get the training grounds level upgrade option
     */
    getTrainingLevelUpgradeOption() {
        if (this.trainingLevel >= this.maxTrainingLevel) {
            return null;
        }
        
        const nextLevel = this.trainingLevel + 1;
        let description = "Upgrade the training grounds to unlock the next range training level for manned towers.";
        let nextUnlock = "";
        
        switch(nextLevel) {
            case 2:
                nextUnlock = "Unlocks: Range Level 1 Upgrades for all manned towers";
                break;
            case 3:
                nextUnlock = "Unlocks: Range Level 2 Upgrades for all manned towers";
                break;
            case 4:
                nextUnlock = "Unlocks: Range Level 3 Upgrades for all manned towers";
                break;
            case 5:
                nextUnlock = "Unlocks: Range Level 4 Upgrades for all manned towers (Maximum)";
                break;
            default:
                nextUnlock = "Max Level Reached";
                break;
        }
        
        return {
            id: 'training_level',
            name: `Training Grounds Level ${nextLevel}`,
            description: description,
            nextUnlock: nextUnlock,
            level: this.trainingLevel,
            maxLevel: this.maxTrainingLevel,
            cost: this.calculateTrainingLevelCost(),
            icon: '🏫'
        };
    }
    
    /**
     * Calculate cost for range upgrade
     */
    calculateRangeUpgradeCost(towerType) {
        const upgrade = this.rangeUpgrades[towerType];
        if (upgrade.level >= upgrade.maxLevel) return null;
        return Math.floor(upgrade.baseCost * Math.pow(1.5, upgrade.level));
    }
    
    /**
     * Calculate cost for training grounds level upgrade
     */
    calculateTrainingLevelCost() {
        if (this.trainingLevel >= this.maxTrainingLevel) return null;
        // Cost progression: 500, 1000, 1500, 2000
        return 500 * this.trainingLevel;
    }
    
    /**
     * Purchase a range upgrade for a specific tower type
     */
    purchaseRangeUpgrade(towerType, gameState) {
        const upgrade = this.rangeUpgrades[towerType];
        if (!upgrade) return false;
        
        // Check if upgrade level is unlocked by training grounds level
        if (this.trainingLevel <= upgrade.level) {
            return false;
        }
        
        const cost = this.calculateRangeUpgradeCost(towerType);
        
        if (!cost || gameState.gold < cost || upgrade.level >= upgrade.maxLevel) {
            return false;
        }
        
        gameState.spend(cost);
        upgrade.level++;
        
        return true;
    }
    
    /**
     * Purchase training grounds level upgrade
     */
    purchaseTrainingLevelUpgrade(gameState) {
        if (this.trainingLevel >= this.maxTrainingLevel) {
            return false;
        }
        
        const cost = this.calculateTrainingLevelCost();
        
        if (!cost || gameState.gold < cost) {
            return false;
        }
        
        gameState.spend(cost);
        this.trainingLevel++;
        
        // Check for defender unlock at level 3
        if (this.trainingLevel === 3) {
            this.defenderUnlocked = true;
            this.defenderMaxLevel = 1;
        }
        
        // Check for defender upgrades at levels 4 and 5
        if (this.trainingLevel === 4) {
            this.defenderMaxLevel = 2;
            this.guardPostUnlocked = true;
            this.maxGuardPosts = 1;
        }
        
        if (this.trainingLevel === 5) {
            this.defenderMaxLevel = 3;
            this.maxGuardPosts = 2;
        }
        
        return true;
    }

    /**
     * Get defender unlock/upgrade option if available
     */
    getDefenderOption() {
        // Only show if training level 3+ and not already at max
        if (this.trainingLevel < 3) {
            return null;
        }
        
        // Determine what to display based on training level
        let option = null;
        
        if (!this.defenderUnlocked) {
            // Should never happen if trainingLevel >= 3, but safety check
            return null;
        }
        
        // If training level 4, we can unlock level 2 defender
        if (this.trainingLevel === 4 && this.defenderMaxLevel < 2) {
            option = {
                id: 'defender_upgrade_2',
                name: 'Defender Level 2 Unlock',
                description: 'Unlock the Level 2 Defender - Medium armored knight with improved stats',
                type: 'defender_upgrade',
                level: 2,
                cost: 800,
                icon: '🛡️'
            };
        }
        // If training level 5, we can unlock level 3 defender
        else if (this.trainingLevel === 5 && this.defenderMaxLevel < 3) {
            option = {
                id: 'defender_upgrade_3',
                name: 'Defender Level 3 Unlock',
                description: 'Unlock the Level 3 Defender - Heavy armored tank with maximum strength',
                type: 'defender_upgrade',
                level: 3,
                cost: 1200,
                icon: '🛡️'
            };
        }
        
        return option;
    }
    
    /**
     * Purchase defender upgrade
     */
    purchaseDefenderUpgrade(level, gameState) {
        if (level === 2 && this.trainingLevel >= 4 && this.defenderMaxLevel < 2) {
            const cost = 800;
            if (gameState.gold < cost) {
                return false;
            }
            gameState.spend(cost);
            this.defenderMaxLevel = 2;
            return true;
        }
        
        if (level === 3 && this.trainingLevel >= 5 && this.defenderMaxLevel < 3) {
            const cost = 1200;
            if (gameState.gold < cost) {
                return false;
            }
            gameState.spend(cost);
            this.defenderMaxLevel = 3;
            return true;
        }
        
        return false;
    }

    /**
     * Get guard post unlock option if available
     */
    getGuardPostOption() {
        // Only show if training level 4+ and not already at max
        if (this.trainingLevel < 4) {
            return null;
        }
        
        if (!this.guardPostUnlocked) {
            return null;
        }
        
        return {
            id: 'guard_post_unlock',
            name: 'Guard Post Tower',
            description: 'Build a Guard Post tower on the path. Hire level 1 defenders to guard key locations.',
            type: 'guard_post',
            cost: 150,
            icon: '🏚️',
            maxBuildings: this.maxGuardPosts
        };
    }

    getUpgradeOptions() {
        // Return available upgrade options for the building
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
        // Calculate the cost of a specific upgrade
        const upgrade = this.upgrades[upgradeType];
        if (upgrade.level >= upgrade.maxLevel) return null;
        return Math.floor(upgrade.baseCost * Math.pow(1.4, upgrade.level));
    }
    
    purchaseUpgrade(upgradeType, gameState) {
        // Purchase an upgrade for the building
        const upgrade = this.upgrades[upgradeType];
        const cost = this.calculateUpgradeCost(upgradeType);
        
        if (!cost || gameState.gold < cost || upgrade.level >= upgrade.maxLevel) {
            return false;
        }
        
        gameState.gold -= cost;
        upgrade.level++;
        
        return true;
    }
    
    deselect() {
        // Deselect the building
        this.isSelected = false;
    }
    
    applyEffect(buildingManager) {
        // Apply the building's effects (e.g., combat bonuses)
    }
    
    static getInfo() {
        // Return static information about the building
        return {
            name: 'Training Grounds',
            description: 'Medieval training facility with archer lanes and sword fighting duels. Provides combat upgrades.',
            effect: 'Global tower combat bonuses',
            size: '4x4',
            cost: 400
        };
    }
}
