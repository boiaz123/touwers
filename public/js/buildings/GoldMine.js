import { Building } from './Building.js';

export class GoldMine extends Building {
    constructor(x, y, gridX, gridY) {
        super(x, y, gridX, gridY, 4);
        this.goldPerCollection = 30;
        this.miningInterval = 15; // 15 seconds to fill up
        this.currentProgress = 0;
        this.isReady = false;
        this.smokePuffs = [];
        this.nextSmokeTime = 0;
        this.workers = [];
        this.rocks = [];
        this.goldPiles = [];
        this.bobAnimations = [];
        this.goldVeins = [];
        this.woodenStructures = [];
        
        // Initialize workers with random positions and animations
        for (let i = 0; i < 4; i++) {
            this.workers.push({
                x: (Math.random() - 0.5) * 60,
                y: (Math.random() - 0.5) * 60,
                animationOffset: Math.random() * Math.PI * 2,
                pickaxeRaised: 0,
                miningCooldown: Math.random() * 2
            });
        }
        
        // Initialize natural rock formations with varied colors
        for (let i = 0; i < 12; i++) {
            this.rocks.push({
                x: (Math.random() - 0.5) * 90,
                y: (Math.random() - 0.5) * 90,
                size: Math.random() * 12 + 8,
                color: this.getNaturalRockColor(),
                type: Math.floor(Math.random() * 4),
                rotation: Math.random() * Math.PI * 2,
                layered: Math.random() < 0.3 // Some rocks have layered appearance
            });
        }
        
        // Generate gold veins through the rocks
        for (let i = 0; i < 6; i++) {
            const vein = {
                points: [],
                thickness: Math.random() * 3 + 2,
                brightness: Math.random() * 0.4 + 0.6
            };
            
            // Create a winding vein path
            const startX = (Math.random() - 0.5) * 80;
            const startY = (Math.random() - 0.5) * 80;
            const segments = 4 + Math.floor(Math.random() * 3);
            
            for (let j = 0; j <= segments; j++) {
                const t = j / segments;
                const wanderX = Math.sin(t * Math.PI * 2) * 20;
                const wanderY = Math.cos(t * Math.PI * 3) * 15;
                vein.points.push({
                    x: startX + (Math.random() - 0.5) * 60 * t + wanderX,
                    y: startY + (Math.random() - 0.5) * 60 * t + wanderY
                });
            }
            
            this.goldVeins.push(vein);
        }
        
        // Add wooden quarry structures
        this.woodenStructures = [
            // Support beams
            { type: 'beam', x: -30, y: -20, width: 60, height: 8, rotation: 0 },
            { type: 'beam', x: 20, y: -30, width: 40, height: 6, rotation: Math.PI / 6 },
            { type: 'beam', x: -25, y: 25, width: 50, height: 6, rotation: -Math.PI / 8 },
            
            // Mining cart track
            { type: 'track', x: -40, y: 0, width: 80, height: 4, rotation: 0 },
            
            // Wooden platforms
            { type: 'platform', x: 25, y: 30, width: 25, height: 15, rotation: 0 },
            { type: 'platform', x: -30, y: -25, width: 20, height: 12, rotation: 0 },
            
            // Support posts
            { type: 'post', x: 35, y: 20, width: 4, height: 20, rotation: 0 },
            { type: 'post', x: -35, y: -15, width: 4, height: 18, rotation: 0 },
            { type: 'post', x: 10, y: -35, width: 4, height: 16, rotation: 0 }
        ];
    }
    
    getNaturalRockColor() {
        const colors = [
            '#8B7355', // Sandy brown
            '#A0522D', // Sienna 
            '#CD853F', // Peru
            '#D2691E', // Chocolate
            '#BC8F8F', // Rosy brown
            '#F4A460', // Sandy brown light
            '#DEB887'  // Burlywood
        ];
        return colors[Math.floor(Math.random() * colors.length)];
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
                        x: (Math.random() - 0.5) * 40,
                        y: (Math.random() - 0.5) * 40,
                        glimmer: Math.random() * Math.PI * 2
                    });
                }
            }
        }
        
        // Update workers
        this.workers.forEach(worker => {
            worker.miningCooldown -= deltaTime;
            worker.pickaxeRaised = Math.max(0, worker.pickaxeRaised - deltaTime * 3);
            
            // Mining animation
            if (worker.miningCooldown <= 0 && !this.isReady) {
                worker.pickaxeRaised = 1;
                worker.miningCooldown = 1.5 + Math.random() * 1.5;
                
                // Create dust particles when mining
                this.smokePuffs.push({
                    x: this.x + worker.x + (Math.random() - 0.5) * 10,
                    y: this.y + worker.y + (Math.random() - 0.5) * 10,
                    vx: (Math.random() - 0.5) * 30,
                    vy: -20 - Math.random() * 20,
                    life: 1,
                    maxLife: 1,
                    size: Math.random() * 4 + 2,
                    color: 'rgba(139, 115, 85, 0.6)'
                });
            }
        });
        
        // Generate ambient dust
        this.nextSmokeTime -= deltaTime;
        if (this.nextSmokeTime <= 0 && !this.isReady) {
            this.smokePuffs.push({
                x: this.x + (Math.random() - 0.5) * 60,
                y: this.y - 20,
                vx: (Math.random() - 0.5) * 15,
                vy: -15 - Math.random() * 15,
                life: 2,
                maxLife: 2,
                size: Math.random() * 6 + 3,
                color: 'rgba(160, 82, 45, 0.4)'
            });
            this.nextSmokeTime = 0.8 + Math.random() * 1.2;
        }
        
        // Update smoke/dust
        this.smokePuffs = this.smokePuffs.filter(smoke => {
            smoke.x += smoke.vx * deltaTime;
            smoke.y += smoke.vy * deltaTime;
            smoke.life -= deltaTime;
            smoke.size += deltaTime * 1;
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
            
            // Ensure we have enough bob animations
            while (this.bobAnimations.length < this.goldPiles.length) {
                this.bobAnimations.push({ time: Math.random() * Math.PI * 2 });
            }
        }
    }
    
    render(ctx, size) {
        // Natural rocky ground base with earth tones
        const groundGradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, size/2
        );
        groundGradient.addColorStop(0, '#D2B48C'); // Tan center
        groundGradient.addColorStop(0.4, '#CD853F'); // Peru 
        groundGradient.addColorStop(0.7, '#A0522D'); // Sienna
        groundGradient.addColorStop(1, '#8B4513');   // Saddle brown
        
        ctx.fillStyle = groundGradient;
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.fillRect(this.x - size/2, this.y - size/2, size, size);
        ctx.strokeRect(this.x - size/2, this.y - size/2, size, size);
        
        // Add natural ground texture with scattered small stones
        for (let i = 0; i < 20; i++) {
            const stoneX = this.x + (Math.random() - 0.5) * size * 0.8;
            const stoneY = this.y + (Math.random() - 0.5) * size * 0.8;
            const stoneSize = Math.random() * 3 + 1;
            
            ctx.fillStyle = `rgba(139, 115, 85, ${Math.random() * 0.6 + 0.3})`;
            ctx.beginPath();
            ctx.arc(stoneX, stoneY, stoneSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Render wooden structures first (behind rocks)
        this.woodenStructures.forEach(structure => {
            ctx.save();
            ctx.translate(this.x + structure.x, this.y + structure.y);
            ctx.rotate(structure.rotation);
            
            switch (structure.type) {
                case 'beam':
                    // Wooden support beam
                    const beamGradient = ctx.createLinearGradient(
                        -structure.width/2, -structure.height/2,
                        structure.width/2, structure.height/2
                    );
                    beamGradient.addColorStop(0, '#DEB887');
                    beamGradient.addColorStop(0.5, '#CD853F');
                    beamGradient.addColorStop(1, '#8B7355');
                    
                    ctx.fillStyle = beamGradient;
                    ctx.strokeStyle = '#654321';
                    ctx.lineWidth = 1;
                    ctx.fillRect(-structure.width/2, -structure.height/2, structure.width, structure.height);
                    ctx.strokeRect(-structure.width/2, -structure.height/2, structure.width, structure.height);
                    
                    // Wood grain lines
                    ctx.strokeStyle = '#A0522D';
                    ctx.lineWidth = 0.5;
                    for (let i = -structure.width/2 + 5; i < structure.width/2; i += 8) {
                        ctx.beginPath();
                        ctx.moveTo(i, -structure.height/2);
                        ctx.lineTo(i, structure.height/2);
                        ctx.stroke();
                    }
                    break;
                    
                case 'track':
                    // Wooden rail track
                    ctx.fillStyle = '#8B4513';
                    ctx.fillRect(-structure.width/2, -structure.height/2, structure.width, structure.height);
                    
                    // Rail ties
                    ctx.fillStyle = '#654321';
                    for (let i = -structure.width/2; i < structure.width/2; i += 12) {
                        ctx.fillRect(i, -structure.height, 8, structure.height * 2);
                    }
                    break;
                    
                case 'platform':
                    // Wooden platform
                    ctx.fillStyle = '#DEB887';
                    ctx.strokeStyle = '#8B7355';
                    ctx.lineWidth = 2;
                    ctx.fillRect(-structure.width/2, -structure.height/2, structure.width, structure.height);
                    ctx.strokeRect(-structure.width/2, -structure.height/2, structure.width, structure.height);
                    
                    // Platform planks
                    ctx.strokeStyle = '#A0522D';
                    ctx.lineWidth = 1;
                    for (let i = -structure.width/2 + 3; i < structure.width/2; i += 6) {
                        ctx.beginPath();
                        ctx.moveTo(i, -structure.height/2);
                        ctx.lineTo(i, structure.height/2);
                        ctx.stroke();
                    }
                    break;
                    
                case 'post':
                    // Vertical support post
                    const postGradient = ctx.createLinearGradient(
                        -structure.width/2, -structure.height/2,
                        structure.width/2, structure.height/2
                    );
                    postGradient.addColorStop(0, '#D2B48C');
                    postGradient.addColorStop(1, '#8B7355');
                    
                    ctx.fillStyle = postGradient;
                    ctx.strokeStyle = '#654321';
                    ctx.lineWidth = 1;
                    ctx.fillRect(-structure.width/2, -structure.height/2, structure.width, structure.height);
                    ctx.strokeRect(-structure.width/2, -structure.height/2, structure.width, structure.height);
                    break;
            }
            
            ctx.restore();
        });
        
        // Render natural rock formations with more realistic textures
        this.rocks.forEach(rock => {
            ctx.save();
            ctx.translate(this.x + rock.x, this.y + rock.y);
            ctx.rotate(rock.rotation);
            
            // Base rock shape with natural coloring
            ctx.fillStyle = rock.color;
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 1;
            
            switch (rock.type) {
                case 0: // Rounded boulder
                    ctx.beginPath();
                    ctx.ellipse(0, 0, rock.size, rock.size * 0.8, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                    break;
                    
                case 1: // Angular rock formation
                    ctx.beginPath();
                    const sides = 6 + Math.floor(Math.random() * 3);
                    for (let i = 0; i < sides; i++) {
                        const angle = (i / sides) * Math.PI * 2;
                        const radius = rock.size * (0.7 + Math.random() * 0.3);
                        const x = Math.cos(angle) * radius;
                        const y = Math.sin(angle) * radius * 0.8;
                        if (i === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    }
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                    break;
                    
                case 2: // Flat layered rock
                    for (let layer = 0; layer < 3; layer++) {
                        const layerHeight = rock.size * (0.3 + layer * 0.2);
                        const layerY = -rock.size * 0.4 + layer * rock.size * 0.3;
                        ctx.fillStyle = rock.layered ? 
                            `rgba(${139 + layer * 10}, ${115 + layer * 8}, ${85 + layer * 5}, 0.9)` : 
                            rock.color;
                        ctx.fillRect(-rock.size, layerY, rock.size * 2, layerHeight);
                        ctx.strokeRect(-rock.size, layerY, rock.size * 2, layerHeight);
                    }
                    break;
                    
                case 3: // Tall rocky outcrop
                    ctx.beginPath();
                    ctx.moveTo(-rock.size * 0.6, rock.size * 0.8);
                    ctx.lineTo(-rock.size * 0.3, -rock.size * 1.2);
                    ctx.lineTo(rock.size * 0.3, -rock.size);
                    ctx.lineTo(rock.size * 0.6, rock.size * 0.8);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                    break;
            }
            
            // Add rock texture details
            ctx.fillStyle = 'rgba(160, 160, 160, 0.4)';
            for (let i = 0; i < 3; i++) {
                const highlightX = (Math.random() - 0.5) * rock.size * 0.6;
                const highlightY = (Math.random() - 0.5) * rock.size * 0.6;
                const highlightSize = Math.random() * rock.size * 0.2 + 2;
                ctx.beginPath();
                ctx.arc(highlightX, highlightY, highlightSize, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Add darker crevices
            ctx.strokeStyle = 'rgba(101, 67, 33, 0.6)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 2; i++) {
                const creviceAngle = Math.random() * Math.PI * 2;
                const creviceLength = rock.size * 0.6;
                ctx.beginPath();
                ctx.moveTo(Math.cos(creviceAngle) * creviceLength * -0.5, 
                          Math.sin(creviceAngle) * creviceLength * -0.5);
                ctx.lineTo(Math.cos(creviceAngle) * creviceLength * 0.5, 
                          Math.sin(creviceAngle) * creviceLength * 0.5);
                ctx.stroke();
            }
            
            ctx.restore();
        });
        
        // Render gold veins running through the quarry
        this.goldVeins.forEach(vein => {
            ctx.save();
            ctx.translate(this.x, this.y);
            
            // Main gold vein
            ctx.strokeStyle = `rgba(255, 215, 0, ${vein.brightness})`;
            ctx.lineWidth = vein.thickness;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            if (vein.points.length > 1) {
                ctx.beginPath();
                ctx.moveTo(vein.points[0].x, vein.points[0].y);
                for (let i = 1; i < vein.points.length; i++) {
                    ctx.lineTo(vein.points[i].x, vein.points[i].y);
                }
                ctx.stroke();
                
                // Add vein highlights
                ctx.strokeStyle = `rgba(255, 255, 140, ${vein.brightness * 0.7})`;
                ctx.lineWidth = vein.thickness * 0.5;
                ctx.beginPath();
                ctx.moveTo(vein.points[0].x, vein.points[0].y);
                for (let i = 1; i < vein.points.length; i++) {
                    ctx.lineTo(vein.points[i].x, vein.points[i].y);
                }
                ctx.stroke();
                
                // Add small gold nuggets along veins
                vein.points.forEach((point, index) => {
                    if (index % 2 === 0 && Math.random() < 0.4) {
                        ctx.fillStyle = `rgba(218, 165, 32, ${vein.brightness})`;
                        ctx.beginPath();
                        ctx.arc(point.x + (Math.random() - 0.5) * 6, 
                               point.y + (Math.random() - 0.5) * 6, 
                               1 + Math.random() * 2, 0, Math.PI * 2);
                        ctx.fill();
                    }
                });
            }
            
            ctx.restore();
        });
        
        // Render workers (same as before)
        this.workers.forEach(worker => {
            ctx.save();
            ctx.translate(this.x + worker.x, this.y + worker.y);
            
            // Worker body
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(-2, -4, 4, 8);
            
            // Worker head
            ctx.fillStyle = '#DDBEA9';
            ctx.beginPath();
            ctx.arc(0, -6, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Hard hat
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(0, -6, 3.5, Math.PI, Math.PI * 2);
            ctx.fill();
            
            // Arms and pickaxe
            ctx.strokeStyle = '#DDBEA9';
            ctx.lineWidth = 2;
            
            const armAngle = worker.pickaxeRaised > 0 ? 
                -Math.PI/2 - worker.pickaxeRaised * Math.PI/3 : 
                Math.sin(this.animationTime * 2 + worker.animationOffset) * 0.3;
            
            // Mining arm with pickaxe
            ctx.beginPath();
            ctx.moveTo(0, -2);
            ctx.lineTo(Math.cos(armAngle) * 6, -2 + Math.sin(armAngle) * 6);
            ctx.stroke();
            
            // Pickaxe
            if (worker.pickaxeRaised > 0.3) {
                const pickaxeX = Math.cos(armAngle) * 8;
                const pickaxeY = -2 + Math.sin(armAngle) * 8;
                
                ctx.strokeStyle = '#8B4513';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(pickaxeX, pickaxeY);
                ctx.lineTo(pickaxeX + Math.cos(armAngle + Math.PI/2) * 4, 
                          pickaxeY + Math.sin(armAngle + Math.PI/2) * 4);
                ctx.stroke();
                
                // Pickaxe head
                ctx.fillStyle = '#2F2F2F';
                ctx.fillRect(pickaxeX - 2, pickaxeY - 1, 4, 2);
            }
            
            // Other arm
            ctx.strokeStyle = '#DDBEA9';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, -2);
            ctx.lineTo(-4, 2);
            ctx.stroke();
            
            ctx.restore();
        });
        
        // Render gold piles when ready (same as before)
        if (this.isReady) {
            this.goldPiles.forEach((pile, index) => {
                const bob = this.bobAnimations[index];
                const bobOffset = bob ? Math.sin(bob.time) * 3 : 0;
                
                ctx.save();
                ctx.translate(this.x + pile.x, this.y + pile.y + bobOffset);
                
                // Gold pile glow
                const glimmerIntensity = Math.sin(pile.glimmer) * 0.3 + 0.7;
                const goldGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 8);
                goldGlow.addColorStop(0, `rgba(255, 215, 0, ${glimmerIntensity})`);
                goldGlow.addColorStop(1, 'rgba(255, 215, 0, 0)');
                
                ctx.fillStyle = goldGlow;
                ctx.beginPath();
                ctx.arc(0, 0, 8, 0, Math.PI * 2);
                ctx.fill();
                
                // Gold nuggets
                ctx.fillStyle = '#FFD700';
                ctx.strokeStyle = '#B8860B';
                ctx.lineWidth = 1;
                
                for (let i = 0; i < 4; i++) {
                    const nuggetAngle = (i / 4) * Math.PI * 2;
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
        
        // Render smoke/dust (same as before)
        this.smokePuffs.forEach(smoke => {
            const alpha = smoke.life / smoke.maxLife;
            ctx.fillStyle = smoke.color.replace('0.6)', `${alpha * 0.6})`).replace('0.4)', `${alpha * 0.4})`);
            ctx.beginPath();
            ctx.arc(smoke.x, smoke.y, smoke.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Progress bar and indicators (same as before)
        const barWidth = size * 0.9;
        const barHeight = 8;
        const progressRatio = this.currentProgress / this.miningInterval;
        
        ctx.fillStyle = 'rgba(101, 67, 33, 0.8)'; // Changed to earth tone
        ctx.fillRect(this.x - barWidth/2, this.y + size/2 + 10, barWidth, barHeight);
        
        if (this.isReady) {
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(this.x - barWidth/2, this.y + size/2 + 10, barWidth, barHeight);
            
            // Ready indicator with pulsing effect
            const readyPulse = Math.sin(this.animationTime * 6) * 0.3 + 0.7;
            ctx.fillStyle = `rgba(255, 215, 0, ${readyPulse})`;
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('CLICK TO COLLECT!', this.x, this.y + size/2 + 35);
        } else {
            ctx.fillStyle = '#D2691E'; // Changed to chocolate brown
            ctx.fillRect(this.x - barWidth/2, this.y + size/2 + 10, barWidth * progressRatio, barHeight);
        }
        
        // Mine indicator
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⛏️💰', this.x, this.y + size/2 + 55);
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
            name: 'Gold Quarry',
            description: 'Natural quarry with gold veins. Click to collect 30 gold when ready (15s cycle).',
            effect: 'Click to collect',
            size: '4x4',
            cost: 200
        };
    }
}
