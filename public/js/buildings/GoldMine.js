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
        
        // Initialize workers with random positions and animations
        for (let i = 0; i < 3; i++) { // Reduced from 4 to 3
            this.workers.push({
                x: (Math.random() - 0.5) * 50, // Reduced spread
                y: (Math.random() - 0.5) * 50,
                animationOffset: Math.random() * Math.PI * 2,
                pickaxeRaised: 0,
                miningCooldown: Math.random() * 2
            });
        }
        
        // Initialize fewer, larger rock formations
        for (let i = 0; i < 6; i++) { // Reduced from 12 to 6
            this.rocks.push({
                x: (Math.random() - 0.5) * 70, // Slightly reduced spread
                y: (Math.random() - 0.5) * 70,
                size: Math.random() * 8 + 10, // Larger rocks
                color: this.getNaturalRockColor(),
                type: Math.floor(Math.random() * 3), // Reduced types
                rotation: Math.random() * Math.PI * 2
            });
        }
        
        // Generate fewer, more prominent gold veins
        for (let i = 0; i < 3; i++) { // Reduced from 6 to 3
            const vein = {
                points: [],
                thickness: Math.random() * 2 + 3, // Thicker veins
                brightness: Math.random() * 0.3 + 0.7 // Brighter
            };
            
            // Create simpler vein paths
            const startX = (Math.random() - 0.5) * 60;
            const startY = (Math.random() - 0.5) * 60;
            const endX = (Math.random() - 0.5) * 60;
            const endY = (Math.random() - 0.5) * 60;
            
            // Simple 3-point path
            vein.points.push(
                { x: startX, y: startY },
                { x: (startX + endX) / 2 + (Math.random() - 0.5) * 20, y: (startY + endY) / 2 + (Math.random() - 0.5) * 20 },
                { x: endX, y: endY }
            );
            
            this.goldVeins.push(vein);
        }
    }
    
    getNaturalRockColor() {
        const colors = [
            '#8B7355', // Sandy brown
            '#A0522D', // Sienna 
            '#CD853F', // Peru
            '#BC8F8F'  // Rosy brown
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
        // Natural rocky ground base - simplified
        const groundGradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, size/2
        );
        groundGradient.addColorStop(0, '#D2B48C'); // Tan center
        groundGradient.addColorStop(0.6, '#CD853F'); // Peru 
        groundGradient.addColorStop(1, '#8B7355');   // Darker brown edge
        
        ctx.fillStyle = groundGradient;
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.fillRect(this.x - size/2, this.y - size/2, size, size);
        ctx.strokeRect(this.x - size/2, this.y - size/2, size, size);
        
        // Simple wooden mining cart track - single horizontal beam
        ctx.fillStyle = '#8B4513';
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        ctx.fillRect(this.x - size/3, this.y - 3, size/1.5, 6);
        ctx.strokeRect(this.x - size/3, this.y - 3, size/1.5, 6);
        
        // Simple wooden support beams - just 2 crossing beams
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(this.x - size/3, this.y - size/3);
        ctx.lineTo(this.x + size/3, this.y + size/3);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(this.x + size/3, this.y - size/3);
        ctx.lineTo(this.x - size/3, this.y + size/3);
        ctx.stroke();
        
        // Render natural rock formations - simplified
        this.rocks.forEach(rock => {
            ctx.save();
            ctx.translate(this.x + rock.x, this.y + rock.y);
            ctx.rotate(rock.rotation);
            
            ctx.fillStyle = rock.color;
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 1;
            
            switch (rock.type) {
                case 0: // Round boulder
                    ctx.beginPath();
                    ctx.ellipse(0, 0, rock.size, rock.size * 0.8, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                    break;
                    
                case 1: // Angular rock
                    ctx.beginPath();
                    ctx.moveTo(-rock.size, 0);
                    ctx.lineTo(-rock.size/2, -rock.size * 0.8);
                    ctx.lineTo(rock.size/2, -rock.size * 0.6);
                    ctx.lineTo(rock.size, 0);
                    ctx.lineTo(rock.size/2, rock.size * 0.8);
                    ctx.lineTo(-rock.size/2, rock.size * 0.6);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                    break;
                    
                case 2: // Flat rock
                    ctx.fillRect(-rock.size, -rock.size * 0.4, rock.size * 2, rock.size * 0.8);
                    ctx.strokeRect(-rock.size, -rock.size * 0.4, rock.size * 2, rock.size * 0.8);
                    break;
            }
            
            // Single highlight per rock
            ctx.fillStyle = 'rgba(200, 200, 200, 0.4)';
            ctx.beginPath();
            ctx.arc(-rock.size * 0.3, -rock.size * 0.3, rock.size * 0.2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
        
        // Render simplified gold veins
        this.goldVeins.forEach(vein => {
            ctx.save();
            ctx.translate(this.x, this.y);
            
            // Main gold vein
            ctx.strokeStyle = `rgba(255, 215, 0, ${vein.brightness})`;
            ctx.lineWidth = vein.thickness;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            ctx.beginPath();
            ctx.moveTo(vein.points[0].x, vein.points[0].y);
            for (let i = 1; i < vein.points.length; i++) {
                ctx.lineTo(vein.points[i].x, vein.points[i].y);
            }
            ctx.stroke();
            
            // Single highlight line
            ctx.strokeStyle = `rgba(255, 255, 200, ${vein.brightness * 0.6})`;
            ctx.lineWidth = vein.thickness * 0.4;
            ctx.beginPath();
            ctx.moveTo(vein.points[0].x, vein.points[0].y);
            for (let i = 1; i < vein.points.length; i++) {
                ctx.lineTo(vein.points[i].x, vein.points[i].y);
            }
            ctx.stroke();
            
            ctx.restore();
        });
        
        // Render workers (same as before but cleaner positioning)
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
            
            // Simplified pickaxe animation
            const armAngle = worker.pickaxeRaised > 0 ? -Math.PI/2 : 0;
            
            // Mining arm
            ctx.strokeStyle = '#DDBEA9';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, -2);
            ctx.lineTo(Math.cos(armAngle) * 6, -2 + Math.sin(armAngle) * 6);
            ctx.stroke();
            
            // Pickaxe when raised
            if (worker.pickaxeRaised > 0.3) {
                const pickaxeX = Math.cos(armAngle) * 8;
                const pickaxeY = -2 + Math.sin(armAngle) * 8;
                
                // Pickaxe handle
                ctx.strokeStyle = '#8B4513';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(pickaxeX, pickaxeY);
                ctx.lineTo(pickaxeX, pickaxeY - 6);
                ctx.stroke();
                
                // Pickaxe head
                ctx.fillStyle = '#696969';
                ctx.fillRect(pickaxeX - 3, pickaxeY - 8, 6, 3);
            }
            
            ctx.restore();
        });
        
        // Render gold piles when ready (same as before)
        if (this.isReady) {
            this.goldPiles.forEach((pile, index) => {
                const bob = this.bobAnimations[index];
                const bobOffset = bob ? Math.sin(bob.time) * 2 : 0;
                
                ctx.save();
                ctx.translate(this.x + pile.x, this.y + pile.y + bobOffset);
                
                // Gold pile glow
                const glimmerIntensity = Math.sin(pile.glimmer) * 0.3 + 0.7;
                const goldGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 10);
                goldGlow.addColorStop(0, `rgba(255, 215, 0, ${glimmerIntensity * 0.8})`);
                goldGlow.addColorStop(1, 'rgba(255, 215, 0, 0)');
                
                ctx.fillStyle = goldGlow;
                ctx.beginPath();
                ctx.arc(0, 0, 10, 0, Math.PI * 2);
                ctx.fill();
                
                // Gold nuggets
                ctx.fillStyle = '#FFD700';
                ctx.strokeStyle = '#B8860B';
                ctx.lineWidth = 1;
                
                for (let i = 0; i < 3; i++) { // Reduced from 4 to 3
                    const nuggetAngle = (i / 3) * Math.PI * 2;
                    const nuggetX = Math.cos(nuggetAngle) * 4;
                    const nuggetY = Math.sin(nuggetAngle) * 4;
                    
                    ctx.beginPath();
                    ctx.arc(nuggetX, nuggetY, 3, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                }
                
                ctx.restore();
            });
        }
        
        // Render minimal dust clouds
        this.smokePuffs.forEach(smoke => {
            const alpha = smoke.life / smoke.maxLife;
            ctx.fillStyle = `rgba(139, 115, 85, ${alpha * 0.4})`;
            ctx.beginPath();
            ctx.arc(smoke.x, smoke.y, smoke.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Progress bar and indicators (same as before but cleaner colors)
        const barWidth = size * 0.8;
        const barHeight = 6;
        const progressRatio = this.currentProgress / this.miningInterval;
        
        ctx.fillStyle = 'rgba(139, 115, 85, 0.8)';
        ctx.fillRect(this.x - barWidth/2, this.y + size/2 + 10, barWidth, barHeight);
        
        if (this.isReady) {
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(this.x - barWidth/2, this.y + size/2 + 10, barWidth, barHeight);
            
            // Ready indicator
            const readyPulse = Math.sin(this.animationTime * 4) * 0.3 + 0.7;
            ctx.fillStyle = `rgba(255, 215, 0, ${readyPulse})`;
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('CLICK TO COLLECT!', this.x, this.y + size/2 + 30);
        } else {
            ctx.fillStyle = '#D2691E';
            ctx.fillRect(this.x - barWidth/2, this.y + size/2 + 10, barWidth * progressRatio, barHeight);
        }
        
        // Mine indicator
        ctx.fillStyle = '#8B4513';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⛏️💰', this.x, this.y + size/2 + 50);
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
