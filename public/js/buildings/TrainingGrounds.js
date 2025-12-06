import { Building } from './Building.js';

export class TrainingGrounds extends Building {
    constructor(x, y, gridX, gridY) {
        super(x, y, gridX, gridY, 4);
        this.isSelected = false;
        
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
            groundY: -35,
            archers: [
                { x: -50, y: -35, angle: 0, drawback: 0, animationOffset: 0, targetIdx: 0 },
                { x: -30, y: -35, angle: 0, drawback: 0, animationOffset: 0.4, targetIdx: 1 }
            ],
            targets: [
                { x: -35, distance: 50, hits: 0 },
                { x: -17, distance: 50, hits: 0 },
                { x: 0, distance: 50, hits: 0 },
                { x: 17, distance: 50, hits: 0 },
                { x: 35, distance: 50, hits: 0 }
            ]
        };
        
        // Right Archer Lane - organized firing line (mirrors left)
        this.rightArcherLane = {
            groundY: -35,
            archers: [
                { x: 50, y: -35, angle: 0, drawback: 0, animationOffset: 0.2, targetIdx: 3 },
                { x: 30, y: -35, angle: 0, drawback: 0, animationOffset: 0.6, targetIdx: 4 }
            ],
            targets: [
                { x: -35, distance: 50, hits: 0 },
                { x: -17, distance: 50, hits: 0 },
                { x: 0, distance: 50, hits: 0 },
                { x: 17, distance: 50, hits: 0 },
                { x: 35, distance: 50, hits: 0 }
            ]
        };
        
        // Sword Fighting Area - two separate dueling circles with spacing
        this.swordFightArea = {
            duelCircles: [
                { x: -30, y: 25 },
                { x: 30, y: 25 }
            ],
            fighters: [
                { circleIdx: 0, x: -8, y: 0, direction: 1, color: '#8B0000' },
                { circleIdx: 0, x: 8, y: 0, direction: -1, color: '#000080' },
                { circleIdx: 1, x: -8, y: 0, direction: 1, color: '#000080' },
                { circleIdx: 1, x: 8, y: 0, direction: -1, color: '#8B0000' }
            ]
        };
        
        // Training dummies for solo practice - positioned away from main areas
        this.dummies = [
            { x: -50, y: 10, type: 'wood', rotation: 0 },
            { x: 50, y: 10, type: 'wood', rotation: 0 }
        ];
        
        // Wooden hut in corner
        this.hut = {
            x: -55,
            y: -50,
            width: 20,
            height: 18
        };
        
        // Environmental decorations around fence - LARGER and OUTSIDE
        this.fenceDecorations = {
            trees: [
                { x: -75, y: -70, size: 1.5 },
                { x: -60, y: -75, size: 1.8 },
                { x: 65, y: -70, size: 1.6 },
                { x: 80, y: -65, size: 1.4 },
                { x: -80, y: 70, size: 1.7 },
                { x: 75, y: 75, size: 1.5 }
            ],
            rocks: [
                { x: -85, y: -55, size: 3.5 },
                { x: 80, y: -60, size: 4.0 },
                { x: -82, y: 50, size: 3.8 },
                { x: 85, y: 45, size: 3.2 }
            ],
            bushes: [
                { x: -78, y: -45, size: 1.2 },
                { x: 80, y: -50, size: 1.3 },
                { x: -75, y: 65, size: 1.1 },
                { x: 78, y: 70, size: 1.4 }
            ],
            barrels: [
                { x: -88, y: -35, type: 'wood' },
                { x: 88, y: -32, type: 'wood' },
                { x: -85, y: 40, type: 'wood' },
                { x: 85, y: 38, type: 'wood' }
            ]
        };
        
        this.fencePerimeter = {
            segments: [
                { startX: -65, startY: -60, endX: 65, endY: -60, posts: 13 },
                { startX: 65, startY: -60, endX: 65, endY: 60, posts: 12 },
                { startX: 65, startY: 60, endX: -65, endY: 60, posts: 13 },
                { startX: -65, startY: 60, endX: -65, endY: -60, posts: 12 }
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
                    size: 2
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
                    size: 2
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
        
        // Floating icon in bottom right of 4x4 grid
        const cellSize = size / 4;
        const iconSize = 30;
        const iconX = (this.gridX + 3.5) * cellSize;
        const iconY = (this.gridY + 3.5) * cellSize - 5;
        
        const pulseIntensity = 0.85 + 0.15 * Math.sin(this.animationTime * 4);
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(iconX - iconSize/2 + 3, iconY - iconSize/2 + 3, iconSize, iconSize);
        
        const parchmentGradient = ctx.createRadialGradient(
            iconX - iconSize/4, iconY - iconSize/4, 0,
            iconX, iconY, iconSize
        );
        parchmentGradient.addColorStop(0, `rgba(210, 180, 140, ${pulseIntensity})`);
        parchmentGradient.addColorStop(0.7, `rgba(188, 143, 143, ${pulseIntensity * 0.9})`);
        parchmentGradient.addColorStop(1, `rgba(160, 120, 80, ${pulseIntensity * 0.8})`);
        
        ctx.fillStyle = parchmentGradient;
        ctx.fillRect(iconX - iconSize/2, iconY - iconSize/2, iconSize, iconSize);
        
        ctx.strokeStyle = `rgba(184, 134, 11, ${pulseIntensity})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(iconX - iconSize/2, iconY - iconSize/2, iconSize, iconSize);
        
        ctx.strokeStyle = `rgba(255, 215, 0, ${pulseIntensity * 0.8})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(iconX - iconSize/2 + 2, iconY - iconSize/2 + 2, iconSize - 4, iconSize - 4);
        
        const glowGradient = ctx.createRadialGradient(iconX, iconY, 0, iconX, iconY, iconSize * 1.5);
        glowGradient.addColorStop(0, `rgba(218, 165, 32, ${pulseIntensity * 0.2})`);
        glowGradient.addColorStop(1, 'rgba(218, 165, 32, 0)');
        ctx.fillStyle = glowGradient;
        ctx.fillRect(iconX - iconSize/2 - 5, iconY - iconSize/2 - 5, iconSize + 10, iconSize + 10);
        
        ctx.fillStyle = `rgba(139, 69, 19, ${pulseIntensity})`;
        ctx.font = 'bold 18px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚔️', iconX, iconY);
        
        ctx.fillStyle = `rgba(255, 215, 0, ${pulseIntensity * 0.3})`;
        ctx.fillText('⚔️', iconX, iconY);
    }
    
    renderDetailedGround(ctx, size) {
        // Main grass base
        const grassGradient = ctx.createLinearGradient(
            this.x, this.y - size/2,
            this.x, this.y + size/2
        );
        grassGradient.addColorStop(0, '#5A7A3A');
        grassGradient.addColorStop(0.5, '#6B8E3A');
        grassGradient.addColorStop(1, '#4A6A2A');
        
        ctx.fillStyle = grassGradient;
        ctx.fillRect(this.x - size/2, this.y - size/2, size, size);
        
        // Dirt paths and wear areas
        const wearPatches = [
            // Left archer lane
            { x: -50, y: -35, width: 35, height: 6, intensity: 0.5 },
            // Right archer lane
            { x: 50, y: -35, width: 35, height: 6, intensity: 0.5 },
            // Left sword fight area
            { x: -30, y: 25, width: 22, height: 22, intensity: 0.6 },
            // Right sword fight area
            { x: 30, y: 25, width: 22, height: 22, intensity: 0.6 },
            // Dummy areas
            { x: -50, y: 10, width: 16, height: 10, intensity: 0.4 },
            { x: 50, y: 10, width: 16, height: 10, intensity: 0.4 }
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
            { x: -55, y: -50, radius: 8, opacity: 0.25 },
            { x: 55, y: -50, radius: 8, opacity: 0.25 },
            { x: -55, y: 50, radius: 10, opacity: 0.3 },
            { x: 55, y: 50, radius: 10, opacity: 0.3 }
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
        
        // Scattered stones and rocks
        const rocks = [
            { x: -60, y: -45, size: 2 },
            { x: 60, y: -45, size: 2 },
            { x: -60, y: 45, size: 2.2 },
            { x: 60, y: 50, size: 2 }
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
        ctx.moveTo(this.x - 60, this.y - 35);
        ctx.lineTo(this.x + 60, this.y - 35);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(this.x - 60, this.y + 10);
        ctx.lineTo(this.x + 60, this.y + 10);
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
                ctx.fillRect(postX - 2, postY + 2, 4, 3);
                
                ctx.fillStyle = '#8B6F47';
                ctx.fillRect(postX - 2.5, postY - 22, 5, 24);
                
                ctx.fillStyle = '#654321';
                ctx.fillRect(postX - 3.5, postY - 24, 7, 3);
                
                ctx.strokeStyle = '#654321';
                ctx.lineWidth = 0.5;
                for (let g = 0; g < 3; g++) {
                    ctx.beginPath();
                    ctx.moveTo(postX - 2.5, postY - 20 + (g * 7));
                    ctx.lineTo(postX + 2.5, postY - 19 + (g * 7));
                    ctx.stroke();
                }
            }
            
            for (let i = 0; i < segment.posts - 1; i++) {
                const railStartX = startX + Math.cos(angle) * (i * postSpacing);
                const railStartY = startY + Math.sin(angle) * (i * postSpacing);
                const railEndX = startX + Math.cos(angle) * ((i + 1) * postSpacing);
                const railEndY = startY + Math.sin(angle) * ((i + 1) * postSpacing);
                
                ctx.strokeStyle = '#CD853F';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(railStartX, railStartY - 10);
                ctx.lineTo(railEndX, railEndY - 10);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(railStartX, railStartY - 3);
                ctx.lineTo(railEndX, railEndY - 3);
                ctx.stroke();
            }
        });
    }
    
    renderFenceDecorations(ctx, size) {
        // Render trees around fence - LARGER
        this.fenceDecorations.trees.forEach(tree => {
            const treeX = this.x + tree.x;
            const treeY = this.y + tree.y;
            const scale = tree.size;
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            ctx.save();
            ctx.translate(treeX + 2, treeY + 2);
            ctx.scale(1, 0.4);
            ctx.beginPath();
            ctx.arc(0, 0, 8 * scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            
            ctx.fillStyle = '#5a341d';
            ctx.fillRect(treeX - 1.5 * scale, treeY, 3 * scale, -10 * scale);
            
            const layers = [
                { y: -15 * scale, width: 12 * scale, color: '#0e3a0e' },
                { y: -10 * scale, width: 9 * scale, color: '#1f6f1f' },
                { y: -5 * scale, width: 6 * scale, color: '#2fa02f' }
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
                ctx.lineWidth = 0.8;
                ctx.stroke();
            });
        });
        
        // Render rocks around fence - LARGER
        this.fenceDecorations.rocks.forEach(rock => {
            ctx.fillStyle = '#696969';
            ctx.strokeStyle = '#2F2F2F';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(this.x + rock.x, this.y + rock.y, rock.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });
        
        // Render bushes around fence - LARGER
        this.fenceDecorations.bushes.forEach(bush => {
            const bushX = this.x + bush.x;
            const bushY = this.y + bush.y;
            const scale = bush.size;
            
            ctx.fillStyle = '#1f6f1f';
            ctx.beginPath();
            ctx.arc(bushX, bushY, 5 * scale, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#28a028';
            ctx.beginPath();
            ctx.arc(bushX - 2 * scale, bushY - 2 * scale, 3.5 * scale, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(bushX + 2 * scale, bushY - 2 * scale, 3.5 * scale, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Render barrels around fence - LARGER
        this.fenceDecorations.barrels.forEach(barrel => {
            const barrelX = this.x + barrel.x;
            const barrelY = this.y + barrel.y;
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(barrelX - 5, barrelY + 3, 10, 3);
            
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(barrelX - 5, barrelY - 10, 10, 13);
            
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(barrelX - 5, barrelY - 10, 10, 13);
            
            ctx.beginPath();
            ctx.moveTo(barrelX - 5, barrelY - 6);
            ctx.lineTo(barrelX + 5, barrelY - 6);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(barrelX - 5, barrelY - 2);
            ctx.lineTo(barrelX + 5, barrelY - 2);
            ctx.stroke();
        });
    }
    
    renderHut(ctx, size) {
        const hutX = this.x + this.hut.x;
        const hutY = this.y + this.hut.y;
        
        // Hut shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(hutX - this.hut.width/2 + 2, hutY + 2, this.hut.width, this.hut.height);
        
        // Hut main body - wooden walls
        ctx.fillStyle = '#8B6F47';
        ctx.fillRect(hutX - this.hut.width/2, hutY, this.hut.width, this.hut.height);
        
        // Hut wall outline
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.strokeRect(hutX - this.hut.width/2, hutY, this.hut.width, this.hut.height);
        
        // Wooden plank details on walls
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 0.5;
        for (let i = 1; i < 4; i++) {
            const plankY = hutY + (this.hut.height * i / 4);
            ctx.beginPath();
            ctx.moveTo(hutX - this.hut.width/2, plankY);
            ctx.lineTo(hutX + this.hut.width/2, plankY);
            ctx.stroke();
        }
        
        // Hut door
        const doorWidth = 5;
        const doorHeight = 10;
        ctx.fillStyle = '#654321';
        ctx.fillRect(hutX - doorWidth/2, hutY + this.hut.height - doorHeight, doorWidth, doorHeight);
        
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(hutX - doorWidth/2, hutY + this.hut.height - doorHeight, doorWidth, doorHeight);
        
        // Door handle
        ctx.fillStyle = '#C0C0C0';
        ctx.beginPath();
        ctx.arc(hutX + doorWidth/2 - 1, hutY + this.hut.height - doorHeight/2, 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Hut roof - peaked gable
        ctx.fillStyle = '#654321';
        ctx.beginPath();
        ctx.moveTo(hutX - this.hut.width/2, hutY);
        ctx.lineTo(hutX, hutY - 8);
        ctx.lineTo(hutX + this.hut.width/2, hutY);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Roof tiles (simple lines)
        ctx.strokeStyle = '#5D4E37';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 3; i++) {
            const roofY = hutY - (8 * (i + 1) / 3);
            ctx.beginPath();
            ctx.moveTo(hutX - this.hut.width/2 + (i * 2), roofY);
            ctx.lineTo(hutX + this.hut.width/2 - (i * 2), roofY);
            ctx.stroke();
        }
        
        // Small window
        ctx.fillStyle = '#4169E1';
        ctx.fillRect(hutX - 3, hutY + 4, 3, 3);
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(hutX - 3, hutY + 4, 3, 3);
    }
    
    renderArcherLane(ctx, lane, isLeftLane) {
        // Render targets in a row - EVENLY SPACED
        lane.targets.forEach((target, idx) => {
            const targetX = this.x + target.x;
            const targetY = this.y + lane.groundY - target.distance;
            
            ctx.save();
            ctx.translate(targetX, targetY);
            
            ctx.fillStyle = '#654321';
            ctx.fillRect(-1, 0, 2, 15);
            
            ctx.fillStyle = '#5D4E37';
            ctx.fillRect(-3, 15, 6, 1.5);
            
            const rings = [
                { radius: 8, color: '#DC143C', shadow: 1 },
                { radius: 5.5, color: '#FFD700', shadow: 0.8 },
                { radius: 3, color: '#DC143C', shadow: 0.6 },
                { radius: 1.2, color: '#FFD700', shadow: 0.4 }
            ];
            
            rings.forEach(ring => {
                ctx.fillStyle = `rgba(0, 0, 0, ${0.15 * ring.shadow})`;
                ctx.beginPath();
                ctx.arc(0.5, 0.5, ring.radius, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = ring.color;
                ctx.beginPath();
                ctx.arc(0, 0, ring.radius, 0, Math.PI * 2);
                ctx.fill();
            });
            
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(0, 0, 9, 0, Math.PI * 2);
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
            ctx.ellipse(1, 1, 3, 1, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Archer body
            ctx.fillStyle = '#2D5016';
            ctx.fillRect(-3.5, -10, 7, 12);
            
            // Archer head
            ctx.fillStyle = '#DDBEA9';
            ctx.beginPath();
            ctx.arc(0, -12, 2.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Archer helm
            ctx.fillStyle = '#696969';
            ctx.beginPath();
            ctx.arc(0, -12.5, 3, Math.PI, Math.PI * 2);
            ctx.fill();
            
            // Bow
            const bowX = 4;
            const bowDrawAmount = archer.drawback * 3;
            
            ctx.strokeStyle = '#8B6914';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(bowX, -8);
            ctx.quadraticCurveTo(bowX + 3, -12, bowX + 2, -14);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(bowX, -8);
            ctx.quadraticCurveTo(bowX + 3, -4, bowX + 2, -2);
            ctx.stroke();
            
            // Bowstring
            ctx.strokeStyle = '#D2B48C';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(bowX + 2, -14);
            ctx.lineTo(bowX - bowDrawAmount, -8);
            ctx.lineTo(bowX + 2, -2);
            ctx.stroke();
            
            // Arrow nocked
            if (archer.drawback > 0.3) {
                ctx.strokeStyle = '#8B4513';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(bowX - bowDrawAmount, -8);
                ctx.lineTo(bowX - bowDrawAmount - 6, -8);
                ctx.stroke();
                
                ctx.fillStyle = '#696969';
                ctx.beginPath();
                ctx.moveTo(bowX - bowDrawAmount - 6, -8);
                ctx.lineTo(bowX - bowDrawAmount - 8, -7);
                ctx.lineTo(bowX - bowDrawAmount - 8, -9);
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
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(this.x + circle.x, this.y + circle.y, 12, 0, Math.PI * 2);
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
            ctx.ellipse(0, 3, 3.5, 1, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Fighter body
            ctx.fillStyle = fighter.color;
            ctx.fillRect(-4, -12, 8, 14);
            
            // Fighter armor
            ctx.fillStyle = '#696969';
            ctx.fillRect(-3.5, -10, 7, 8);
            
            ctx.strokeStyle = '#2F2F2F';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(-3.5, -10, 7, 8);
            
            // Fighter head
            ctx.fillStyle = '#DDBEA9';
            ctx.beginPath();
            ctx.arc(0, -14, 2.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Fighter helmet
            ctx.fillStyle = '#696969';
            ctx.beginPath();
            ctx.arc(0, -14.5, 3, Math.PI, Math.PI * 2);
            ctx.fill();
            
            // Shield
            const shieldX = fighter.direction > 0 ? -5 : 5;
            ctx.fillStyle = '#CD853F';
            ctx.beginPath();
            ctx.arc(shieldX, -6, 3, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(shieldX, -6, 3, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.fillStyle = '#DC143C';
            ctx.beginPath();
            ctx.arc(shieldX, -6, 1.2, 0, Math.PI * 2);
            ctx.fill();
            
            // Sword with swing
            const swordX = fighter.direction > 0 ? 4 : -4;
            const swingAmount = fighter.swingAngle * fighter.direction;
            
            ctx.strokeStyle = '#C0C0C0';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(swordX, -8);
            ctx.lineTo(swordX + (swingAmount * 5), -8 - 8 + (Math.abs(swingAmount) * 3));
            ctx.stroke();
            
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(swordX, -8, 1.5, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#808080';
            const tipX = swordX + (swingAmount * 5);
            const tipY = -8 - 8 + (Math.abs(swingAmount) * 3);
            ctx.beginPath();
            ctx.moveTo(tipX, tipY);
            ctx.lineTo(tipX + 1, tipY - 2);
            ctx.lineTo(tipX - 1, tipY - 2);
            ctx.closePath();
            ctx.fill();
            
            // Legs
            ctx.strokeStyle = '#2F2F2F';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            const stanceShift = fighter.stance * 2;
            ctx.beginPath();
            ctx.moveTo(-1, 2);
            ctx.lineTo(-1 + stanceShift, 5);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(1, 2);
            ctx.lineTo(1 - stanceShift, 5);
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
            ctx.fillRect(-2, 0, 4, 28);
            
            ctx.fillStyle = '#5D4E37';
            ctx.fillRect(-6, 28, 12, 3);
            
            ctx.fillStyle = '#8B6F47';
            ctx.beginPath();
            ctx.arc(0, -26, 6, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(0, -26, 6, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.fillStyle = '#A0522D';
            ctx.fillRect(-6, -18, 12, 14);
            
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-6, -12);
            ctx.lineTo(6, -12);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(-6, -6);
            ctx.lineTo(6, -6);
            ctx.stroke();
            
            ctx.strokeStyle = '#8B6F47';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-6, -12);
            ctx.lineTo(-13, -10);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(6, -12);
            ctx.lineTo(13, -10);
            ctx.stroke();
            
            ctx.fillStyle = 'rgba(100, 50, 0, 0.5)';
            ctx.beginPath();
            ctx.arc(-2, -8, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(3, -4, 1.5, 0, Math.PI * 2);
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
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(10, 0);
                ctx.stroke();
                
                ctx.fillStyle = `rgba(192, 192, 192, ${alpha})`;
                ctx.beginPath();
                ctx.moveTo(10, 0);
                ctx.lineTo(12, -1.5);
                ctx.lineTo(12, 1.5);
                ctx.closePath();
                ctx.fill();
                
                ctx.strokeStyle = `rgba(220, 20, 60, ${alpha})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(0, -1);
                ctx.lineTo(-4, -2);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0, 1);
                ctx.lineTo(-4, 2);
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
    
    isPointInside(x, y, size) {
        // Check if a point is inside the building's area
        const cellSize = size / 4;
        const iconSize = 30;
        const iconX = (this.gridX + 3.5) * cellSize;
        const iconY = (this.gridY + 3.5) * cellSize - 5;
        
        return x >= iconX - iconSize/2 && x <= iconX + iconSize/2 &&
               y >= iconY - iconSize/2 && y <= iconY + iconSize/2;
    }
    
    onClick() {
        // Handle click event - open upgrade menu
        this.isSelected = true;
        return {
            type: 'training_menu',
            building: this,
            upgrades: this.getUpgradeOptions()
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
        
        console.log(`TrainingGrounds: Purchased ${upgradeType} upgrade level ${upgrade.level}`);
        return true;
    }
    
    deselect() {
        // Deselect the building
        this.isSelected = false;
    }
    
    applyEffect(buildingManager) {
        // Apply the building's effects (e.g., combat bonuses)
        console.log('TrainingGrounds: Applying effects');
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
