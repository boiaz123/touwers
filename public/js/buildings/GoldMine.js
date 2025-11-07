import { Building } from './Building.js';

export class GoldMine extends Building {
    constructor(x, y, gridX, gridY) {
        super(x, y, gridX, gridY, 4);
        this.goldPerCollection = 30;
        this.miningInterval = 15;
        this.currentProgress = 0;
        this.isReady = false;
        this.smokePuffs = [];
        this.nextSmokeTime = 0;
        this.workers = [];
        this.goldPiles = [];
        this.bobAnimations = [];
        
        // Mine cart animation
        this.cartPosition = 0;
        this.cartDirection = 1;
        this.cartSpeed = 0.3;
        
        // Natural environment elements within the mine area
        this.trees = [];
        this.environmentRocks = [];
        this.bushes = [];
        
        // Generate 2 trees within the mine's 4x4 grid area
        for (let i = 0; i < 2; i++) {
            this.trees.push({
                x: i === 0 ? -35 + Math.random() * 10 : 40 + Math.random() * 10, // One on left, one on right
                y: -30 + Math.random() * 20, // Positioned behind the cave
                height: Math.random() * 20 + 25, // Smaller trees to fit the area
                trunkWidth: Math.random() * 4 + 4,
                crownRadius: Math.random() * 10 + 12,
                type: Math.floor(Math.random() * 2),
                leafDensity: Math.random() * 0.3 + 0.7
            });
        }
        
        // Generate rocks within the mine area - mix of small and large
        for (let i = 0; i < 6; i++) {
            const isLargeRock = i < 2; // First 2 are large rocks
            this.environmentRocks.push({
                x: (Math.random() - 0.5) * 60, // Within 4x4 grid area
                y: (Math.random() - 0.5) * 60,
                size: isLargeRock ? Math.random() * 8 + 12 : Math.random() * 6 + 4, // Large or small
                type: isLargeRock ? 2 : Math.floor(Math.random() * 2), // Large rocks are stacked type
                rotation: Math.random() * Math.PI * 2,
                color: Math.random() < 0.5 ? '#8B7355' : '#A0522D',
                layers: isLargeRock ? 2 + Math.floor(Math.random() * 2) : 1 // Stacking for large rocks
            });
        }
        
        // Generate fewer bushes, positioned to not block the cave entrance
        for (let i = 0; i < 3; i++) {
            this.bushes.push({
                x: Math.random() < 0.5 ? -25 + Math.random() * 15 : 15 + Math.random() * 25, // Left or right side
                y: 20 + Math.random() * 20, // In front area, not blocking cave
                radius: Math.random() * 6 + 8,
                segments: 4 + Math.floor(Math.random() * 3),
                color: Math.random() < 0.3 ? '#228B22' : '#2E8B57'
            });
        }
        
        // Initialize workers
        for (let i = 0; i < 2; i++) {
            this.workers.push({
                x: (Math.random() - 0.5) * 30 + 20, // Position near cave entrance
                y: (Math.random() - 0.5) * 15 + 15,
                animationOffset: Math.random() * Math.PI * 2,
                pickaxeRaised: 0,
                miningCooldown: Math.random() * 2,
                direction: Math.random() < 0.5 ? -1 : 1
            });
        }
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        // Update mining progress
        if (!this.isReady) {
            this.currentProgress += deltaTime;
            if (this.currentProgress >= this.miningInterval) {
                this.isReady = true;
                this.currentProgress = this.miningInterval;
                
                // Create gold piles when ready
                this.goldPiles = [];
                for (let i = 0; i < 3; i++) {
                    this.goldPiles.push({
                        x: (Math.random() - 0.5) * 30 + 25, // Near cave entrance
                        y: (Math.random() - 0.5) * 30 + 25,
                        glimmer: Math.random() * Math.PI * 2
                    });
                }
            }
        }
        
        // Update mine cart animation
        this.cartPosition += this.cartDirection * this.cartSpeed * deltaTime;
        if (this.cartPosition > 1) {
            this.cartPosition = 1;
            this.cartDirection = -1;
        } else if (this.cartPosition < 0) {
            this.cartPosition = 0;
            this.cartDirection = 1;
        }
        
        // Update workers
        this.workers.forEach(worker => {
            worker.miningCooldown -= deltaTime;
            worker.pickaxeRaised = Math.max(0, worker.pickaxeRaised - deltaTime * 3);
            
            // Mining animation
            if (worker.miningCooldown <= 0 && !this.isReady) {
                worker.pickaxeRaised = 1;
                worker.miningCooldown = 2 + Math.random() * 2;
                
                // Create dust particles when mining
                this.smokePuffs.push({
                    x: this.x + worker.x + (Math.random() - 0.5) * 8,
                    y: this.y + worker.y + (Math.random() - 0.5) * 8,
                    vx: (Math.random() - 0.5) * 15,
                    vy: -10 - Math.random() * 10,
                    life: 1.5,
                    maxLife: 1.5,
                    size: Math.random() * 2 + 1,
                    color: 'rgba(139, 115, 85, 0.6)'
                });
            }
        });
        
        // Generate ambient dust from cave
        this.nextSmokeTime -= deltaTime;
        if (this.nextSmokeTime <= 0 && !this.isReady) {
            this.smokePuffs.push({
                x: this.x - 20 + Math.random() * 15, // From cave entrance
                y: this.y - 10 + Math.random() * 10,
                vx: (Math.random() - 0.5) * 8,
                vy: -5 - Math.random() * 5,
                life: 2,
                maxLife: 2,
                size: Math.random() * 3 + 1,
                color: 'rgba(101, 67, 33, 0.4)'
            });
            this.nextSmokeTime = 2.0 + Math.random() * 2.0;
        }
        
        // Update smoke/dust
        this.smokePuffs = this.smokePuffs.filter(smoke => {
            smoke.x += smoke.vx * deltaTime;
            smoke.y += smoke.vy * deltaTime;
            smoke.life -= deltaTime;
            smoke.size += deltaTime * 0.3;
            return smoke.life > 0;
        });
        
        // Update gold pile glimmer
        this.goldPiles.forEach(pile => {
            pile.glimmer += deltaTime * 4;
        });
        
        // Update collection bob animation when ready
        if (this.isReady) {
            this.bobAnimations.forEach((bob, index) => {
                if (!bob) {
                    this.bobAnimations[index] = { time: Math.random() * Math.PI * 2 };
                }
                bob.time += deltaTime * 3;
            });
            
            while (this.bobAnimations.length < this.goldPiles.length) {
                this.bobAnimations.push({ time: Math.random() * Math.PI * 2 });
            }
        }
    }
    
    render(ctx, size) {
        // Render trees first (background elements) - smaller scale for integration
        this.trees.forEach(tree => {
            ctx.save();
            ctx.translate(this.x + tree.x, this.y + tree.y);
            
            // Tree shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.beginPath();
            ctx.ellipse(3, tree.height * 0.1, tree.crownRadius * 0.6, tree.crownRadius * 0.2, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Tree trunk
            const trunkGradient = ctx.createLinearGradient(-tree.trunkWidth/2, 0, tree.trunkWidth/2, 0);
            trunkGradient.addColorStop(0, '#8B4513');
            trunkGradient.addColorStop(0.5, '#A0522D');
            trunkGradient.addColorStop(1, '#654321');
            
            ctx.fillStyle = trunkGradient;
            ctx.fillRect(-tree.trunkWidth/2, 0, tree.trunkWidth, -tree.height);
            
            // Trunk texture (bark lines)
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 1;
            for (let i = 1; i < 3; i++) {
                const lineY = -tree.height * (i / 3);
                ctx.beginPath();
                ctx.moveTo(-tree.trunkWidth/2, lineY);
                ctx.lineTo(tree.trunkWidth/2, lineY);
                ctx.stroke();
            }
            
            // Tree crown
            if (tree.type === 0) {
                // Deciduous tree (round crown)
                const crownGradient = ctx.createRadialGradient(
                    -tree.crownRadius * 0.3, -tree.height - tree.crownRadius * 0.3, 0,
                    0, -tree.height, tree.crownRadius
                );
                crownGradient.addColorStop(0, '#90EE90');
                crownGradient.addColorStop(0.6, '#228B22');
                crownGradient.addColorStop(1, '#006400');
                
                ctx.fillStyle = crownGradient;
                ctx.beginPath();
                ctx.arc(0, -tree.height, tree.crownRadius, 0, Math.PI * 2);
                ctx.fill();
                
                // Add some leaf clusters for texture
                for (let j = 0; j < 5; j++) {
                    const angle = (j / 5) * Math.PI * 2;
                    const distance = tree.crownRadius * (0.6 + Math.random() * 0.3);
                    const leafX = Math.cos(angle) * distance;
                    const leafY = -tree.height + Math.sin(angle) * distance;
                    
                    ctx.fillStyle = `rgba(34, 139, 34, ${tree.leafDensity})`;
                    ctx.beginPath();
                    ctx.arc(leafX, leafY, tree.crownRadius * 0.15, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else {
                // Coniferous tree (triangular crown)
                ctx.fillStyle = '#228B22';
                ctx.beginPath();
                ctx.moveTo(0, -tree.height - tree.crownRadius);
                ctx.lineTo(-tree.crownRadius * 0.7, -tree.height + tree.crownRadius * 0.2);
                ctx.lineTo(tree.crownRadius * 0.7, -tree.height + tree.crownRadius * 0.2);
                ctx.closePath();
                ctx.fill();
                
                // Add needle texture
                ctx.strokeStyle = '#006400';
                ctx.lineWidth = 1;
                for (let j = 0; j < 4; j++) {
                    const needleY = -tree.height - tree.crownRadius * 0.8 + (j / 4) * tree.crownRadius * 1.0;
                    const needleWidth = tree.crownRadius * (0.7 - j / 6);
                    ctx.beginPath();
                    ctx.moveTo(-needleWidth, needleY);
                    ctx.lineTo(needleWidth, needleY);
                    ctx.stroke();
                }
            }
            
            ctx.restore();
        });
        
        // Render environment rocks with stacking for natural look
        this.environmentRocks.forEach(rock => {
            ctx.save();
            ctx.translate(this.x + rock.x, this.y + rock.y);
            ctx.rotate(rock.rotation);
            
            // Rock shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.ellipse(2, 2, rock.size * 0.9, rock.size * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Main rock with stacking effect
            ctx.fillStyle = rock.color;
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 1;
            
            if (rock.layers > 1) {
                // Stacked rocks for natural formation
                for (let layer = 0; layer < rock.layers; layer++) {
                    const layerSize = rock.size * (1 - layer * 0.15);
                    const layerY = -layer * rock.size * 0.4;
                    const layerColor = layer === 0 ? rock.color : this.darkenColor(rock.color, 0.1 * layer);
                    
                    ctx.fillStyle = layerColor;
                    
                    switch (rock.type) {
                        case 0: // Round stacked boulders
                            ctx.beginPath();
                            ctx.ellipse(0, layerY, layerSize, layerSize * 0.8, 0, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.stroke();
                            break;
                            
                        case 2: // Flat stacked rocks
                            ctx.beginPath();
                            ctx.ellipse(0, layerY, layerSize, layerSize * 0.5, 0, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.stroke();
                            break;
                    }
                }
            } else {
                // Single rocks
                switch (rock.type) {
                    case 0: // Round boulder
                        ctx.beginPath();
                        ctx.ellipse(0, 0, rock.size, rock.size * 0.8, 0, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.stroke();
                        break;
                        
                    case 1: // Angular rock
                        ctx.beginPath();
                        for (let i = 0; i < 5; i++) {
                            const angle = (i / 5) * Math.PI * 2;
                            const radius = rock.size * (0.8 + Math.random() * 0.2);
                            const x = Math.cos(angle) * radius;
                            const y = Math.sin(angle) * radius * 0.7;
                            if (i === 0) ctx.moveTo(x, y);
                            else ctx.lineTo(x, y);
                        }
                        ctx.closePath();
                        ctx.fill();
                        ctx.stroke();
                        break;
                }
            }
            
            // Rock highlight for 3D effect
            ctx.fillStyle = 'rgba(200, 200, 200, 0.4)';
            ctx.beginPath();
            ctx.arc(-rock.size * 0.3, -rock.size * 0.3, rock.size * 0.15, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
        
        // Render bushes positioned naturally around the scene
        this.bushes.forEach(bush => {
            ctx.save();
            ctx.translate(this.x + bush.x, this.y + bush.y);
            
            // Bush shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.beginPath();
            ctx.ellipse(1, 1, bush.radius * 0.8, bush.radius * 0.2, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Main bush shape (cluster of circles for natural look)
            ctx.fillStyle = bush.color;
            for (let i = 0; i < bush.segments; i++) {
                const angle = (i / bush.segments) * Math.PI * 2;
                const distance = bush.radius * (0.3 + Math.random() * 0.4);
                const segmentX = Math.cos(angle) * distance;
                const segmentY = Math.sin(angle) * distance;
                const segmentRadius = bush.radius * (0.25 + Math.random() * 0.15);
                
                ctx.beginPath();
                ctx.arc(segmentX, segmentY, segmentRadius, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Bush highlights
            ctx.fillStyle = 'rgba(144, 238, 144, 0.5)';
            for (let i = 0; i < 2; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = bush.radius * 0.25;
                const highlightX = Math.cos(angle) * distance;
                const highlightY = Math.sin(angle) * distance;
                
                ctx.beginPath();
                ctx.arc(highlightX, highlightY, bush.radius * 0.1, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        });
        
        // Rock formation around cave entrance (existing cave structure)
        const rockColor = '#8B7355';
        const darkRock = '#654321';
        const lightRock = '#A0522D';
        
        // Main rock formation (irregular shape)
        ctx.fillStyle = rockColor;
        ctx.strokeStyle = darkRock;
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(this.x - size * 0.4, this.y + size * 0.3);
        ctx.lineTo(this.x - size * 0.3, this.y - size * 0.2);
        ctx.lineTo(this.x - size * 0.1, this.y - size * 0.35);
        ctx.lineTo(this.x + size * 0.2, this.y - size * 0.25);
        ctx.lineTo(this.x + size * 0.4, this.y + size * 0.1);
        ctx.lineTo(this.x + size * 0.3, this.y + size * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Rock highlights and texture
        ctx.fillStyle = lightRock;
        ctx.beginPath();
        ctx.arc(this.x - size * 0.2, this.y - size * 0.1, size * 0.08, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(this.x + size * 0.1, this.y - size * 0.05, size * 0.06, 0, Math.PI * 2);
        ctx.fill();
        
        // Rock cracks/texture lines
        ctx.strokeStyle = darkRock;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x - size * 0.25, this.y - size * 0.15);
        ctx.lineTo(this.x - size * 0.1, this.y + size * 0.1);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(this.x + size * 0.05, this.y - size * 0.2);
        ctx.lineTo(this.x + size * 0.15, this.y + size * 0.05);
        ctx.stroke();
        
        // Cave entrance (dark oval opening)
        const caveGradient = ctx.createRadialGradient(
            this.x - size * 0.15, this.y, 0,
            this.x - size * 0.15, this.y, size * 0.15
        );
        caveGradient.addColorStop(0, '#000000');
        caveGradient.addColorStop(0.7, '#1a1a1a');
        caveGradient.addColorStop(1, '#2a2a2a');
        
        ctx.fillStyle = caveGradient;
        ctx.beginPath();
        ctx.ellipse(this.x - size * 0.15, this.y, size * 0.15, size * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Cave entrance border
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Wooden support beams at cave entrance
        ctx.fillStyle = '#8B4513';
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        
        // Vertical supports
        ctx.fillRect(this.x - size * 0.28, this.y - size * 0.08, size * 0.04, size * 0.16);
        ctx.strokeRect(this.x - size * 0.28, this.y - size * 0.08, size * 0.04, size * 0.16);
        
        ctx.fillRect(this.x - size * 0.05, this.y - size * 0.08, size * 0.04, size * 0.16);
        ctx.strokeRect(this.x - size * 0.05, this.y - size * 0.08, size * 0.04, size * 0.16);
        
        // Horizontal beam
        ctx.fillRect(this.x - size * 0.28, this.y - size * 0.1, size * 0.27, size * 0.03);
        ctx.strokeRect(this.x - size * 0.28, this.y - size * 0.1, size * 0.27, size * 0.03);
        
        // Mine cart track
        const trackY = this.y + size * 0.25;
        const trackStartX = this.x - size * 0.1;
        const trackEndX = this.x + size * 0.4;
        
        // Track rails
        ctx.strokeStyle = '#696969';
        ctx.lineWidth = 3;
        
        // Left rail
        ctx.beginPath();
        ctx.moveTo(trackStartX, trackY - size * 0.02);
        ctx.lineTo(trackEndX, trackY - size * 0.02);
        ctx.stroke();
        
        // Right rail
        ctx.beginPath();
        ctx.moveTo(trackStartX, trackY + size * 0.02);
        ctx.lineTo(trackEndX, trackY + size * 0.02);
        ctx.stroke();
        
        // Railroad ties
        ctx.fillStyle = '#654321';
        for (let i = 0; i < 6; i++) {
            const tieX = trackStartX + (trackEndX - trackStartX) * (i / 5);
            ctx.fillRect(tieX - size * 0.02, trackY - size * 0.03, size * 0.04, size * 0.06);
        }
        
        // Mine cart
        const cartX = trackStartX + (trackEndX - trackStartX) * this.cartPosition;
        
        // Cart shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(cartX - size * 0.04 + 2, trackY - size * 0.08 + 2, size * 0.08, size * 0.06);
        
        // Cart body
        ctx.fillStyle = '#8B4513';
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        ctx.fillRect(cartX - size * 0.04, trackY - size * 0.08, size * 0.08, size * 0.06);
        ctx.strokeRect(cartX - size * 0.04, trackY - size * 0.08, size * 0.08, size * 0.06);
        
        // Cart wheels
        ctx.fillStyle = '#2F2F2F';
        ctx.beginPath();
        ctx.arc(cartX - size * 0.025, trackY, size * 0.012, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(cartX + size * 0.025, trackY, size * 0.012, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Gold ore in cart (if ready)
        if (this.isReady && this.cartPosition > 0.5) {
            ctx.fillStyle = '#FFD700';
            for (let i = 0; i < 3; i++) {
                const oreX = cartX - size * 0.02 + (i * size * 0.013);
                const oreY = trackY - size * 0.07;
                ctx.beginPath();
                ctx.arc(oreX, oreY, size * 0.008, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Render workers
        this.workers.forEach(worker => {
            ctx.save();
            ctx.translate(this.x + worker.x, this.y + worker.y);
            
            // Worker body
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(-2, -4, 4, 8);
            
            // Worker head
            ctx.fillStyle = '#DDBEA9';
            ctx.beginPath();
            ctx.arc(0, -6, 2.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Miner's helmet with lamp
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(0, -6, 3, Math.PI, Math.PI * 2);
            ctx.fill();
            
            // Helmet lamp
            ctx.fillStyle = '#FFFF99';
            ctx.beginPath();
            ctx.arc(0, -8, 1, 0, Math.PI * 2);
            ctx.fill();
            
            // Pickaxe animation
            const armAngle = worker.pickaxeRaised > 0 ? -Math.PI/2 : Math.PI/6;
            
            // Mining arm
            ctx.strokeStyle = '#DDBEA9';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, -2);
            ctx.lineTo(Math.cos(armAngle) * 5, -2 + Math.sin(armAngle) * 5);
            ctx.stroke();
            
            // Pickaxe
            if (worker.pickaxeRaised > 0.2) {
                const pickaxeX = Math.cos(armAngle) * 7;
                const pickaxeY = -2 + Math.sin(armAngle) * 7;
                
                // Pickaxe handle
                ctx.strokeStyle = '#8B4513';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(pickaxeX, pickaxeY);
                ctx.lineTo(pickaxeX - Math.cos(armAngle) * 8, pickaxeY - Math.sin(armAngle) * 8);
                ctx.stroke();
                
                // Pickaxe head
                ctx.fillStyle = '#696969';
                ctx.fillRect(pickaxeX - 2, pickaxeY - 6, 4, 2);
            }
            
            ctx.restore();
        });
        
        // Render gold piles when ready
        if (this.isReady) {
            this.goldPiles.forEach((pile, index) => {
                const bob = this.bobAnimations[index];
                const bobOffset = bob ? Math.sin(bob.time) * 1.5 : 0;
                
                ctx.save();
                ctx.translate(this.x + pile.x, this.y + pile.y + bobOffset);
                
                // Gold pile glow
                const glimmerIntensity = Math.sin(pile.glimmer) * 0.3 + 0.7;
                const goldGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 8);
                goldGlow.addColorStop(0, `rgba(255, 215, 0, ${glimmerIntensity * 0.8})`);
                goldGlow.addColorStop(1, 'rgba(255, 215, 0, 0)');
                
                ctx.fillStyle = goldGlow;
                ctx.beginPath();
                ctx.arc(0, 0, 8, 0, Math.PI * 2);
                ctx.fill();
                
                // Gold nuggets
                ctx.fillStyle = '#FFD700';
                ctx.strokeStyle = '#B8860B';
                ctx.lineWidth = 1;
                
                for (let i = 0; i < 3; i++) {
                    const nuggetAngle = (i / 3) * Math.PI * 2;
                    const nuggetX = Math.cos(nuggetAngle) * 3;
                    const nuggetY = Math.sin(nuggetAngle) * 3;
                    
                    ctx.beginPath();
                    ctx.arc(nuggetX, nuggetY, 2, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                }
                
                ctx.restore();
            });
        }
        
        // Render dust clouds
        this.smokePuffs.forEach(smoke => {
            const alpha = smoke.life / smoke.maxLife;
            ctx.fillStyle = `rgba(139, 115, 85, ${alpha * 0.4})`;
            ctx.beginPath();
            ctx.arc(smoke.x, smoke.y, smoke.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Progress bar and indicators
        const barWidth = size * 0.6;
        const barHeight = 4;
        const progressRatio = this.currentProgress / this.miningInterval;
        
        ctx.fillStyle = 'rgba(101, 67, 33, 0.8)';
        ctx.fillRect(this.x - barWidth/2, this.y + size/2 + 5, barWidth, barHeight);
        
        if (this.isReady) {
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(this.x - barWidth/2, this.y + size/2 + 5, barWidth, barHeight);
            
            // Ready indicator
            const readyPulse = Math.sin(this.animationTime * 4) * 0.3 + 0.7;
            ctx.fillStyle = `rgba(255, 215, 0, ${readyPulse})`;
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('CLICK TO COLLECT!', this.x, this.y + size/2 + 20);
        } else {
            ctx.fillStyle = '#D2691E';
            ctx.fillRect(this.x - barWidth/2, this.y + size/2 + 5, barWidth * progressRatio, barHeight);
        }
        
        // Mine indicator
        ctx.fillStyle = '#8B4513';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⛏️💰', this.x, this.y + size/2 + 35);
    }
    
    darkenColor(color, factor) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        const newR = Math.floor(r * (1 - factor));
        const newG = Math.floor(g * (1 - factor));
        const newB = Math.floor(b * (1 - factor));
        
        return `rgb(${newR}, ${newG}, ${newB})`;
    }
    
    collectGold() {
        if (this.isReady) {
            this.isReady = false;
            this.currentProgress = 0;
            this.goldPiles = [];
            this.bobAnimations = [];
            return this.goldPerCollection;
        }
        return 0;
    }
    
    isPointInside(x, y, size) {
        const dx = x - this.x;
        const dy = y - this.y;
        return Math.abs(dx) <= size/2 && Math.abs(dy) <= size/2;
    }
    
    applyEffect(towerManager) {
        // No passive gold generation anymore
    }
    
    static getInfo() {
        return {
            name: 'Cave Mine',
            description: 'Natural cave entrance with mining operations. Click to collect 30 gold when ready (15s cycle).',
            effect: 'Click to collect',
            size: '4x4',
            cost: 200
        };
    }
}
