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
        
        // Initialize rock formations
        for (let i = 0; i < 8; i++) {
            this.rocks.push({
                x: (Math.random() - 0.5) * 80,
                y: (Math.random() - 0.5) * 80,
                size: Math.random() * 8 + 4,
                color: Math.random() < 0.5 ? '#696969' : '#2F2F2F',
                type: Math.floor(Math.random() * 3)
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
        // Quarry pit (darker, deeper looking)
        const pitGradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, size/2
        );
        pitGradient.addColorStop(0, '#4A4A4A');
        pitGradient.addColorStop(0.7, '#2F2F2F');
        pitGradient.addColorStop(1, '#1A1A1A');
        
        ctx.fillStyle = pitGradient;
        ctx.strokeStyle = '#0F0F0F';
        ctx.lineWidth = 3;
        ctx.fillRect(this.x - size/2, this.y - size/2, size, size);
        ctx.strokeRect(this.x - size/2, this.y - size/2, size, size);
        
        // Render rock formations
        this.rocks.forEach(rock => {
            ctx.save();
            ctx.translate(this.x + rock.x, this.y + rock.y);
            
            ctx.fillStyle = rock.color;
            ctx.strokeStyle = '#1A1A1A';
            ctx.lineWidth = 1;
            
            switch (rock.type) {
                case 0: // Round rocks
                    ctx.beginPath();
                    ctx.arc(0, 0, rock.size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                    break;
                    
                case 1: // Angular rocks
                    ctx.beginPath();
                    for (let i = 0; i < 6; i++) {
                        const angle = (i / 6) * Math.PI * 2;
                        const radius = rock.size * (0.7 + Math.random() * 0.3);
                        const x = Math.cos(angle) * radius;
                        const y = Math.sin(angle) * radius;
                        if (i === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    }
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                    break;
                    
                case 2: // Rectangular stone blocks
                    ctx.fillRect(-rock.size, -rock.size * 0.6, rock.size * 2, rock.size * 1.2);
                    ctx.strokeRect(-rock.size, -rock.size * 0.6, rock.size * 2, rock.size * 1.2);
                    break;
            }
            
            // Rock highlights
            ctx.fillStyle = 'rgba(160, 160, 160, 0.3)';
            ctx.beginPath();
            ctx.arc(-rock.size * 0.3, -rock.size * 0.3, rock.size * 0.4, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
        
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
        
        // Render gold piles when ready
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
        
        // Render smoke/dust
        this.smokePuffs.forEach(smoke => {
            const alpha = smoke.life / smoke.maxLife;
            ctx.fillStyle = smoke.color.replace('0.6)', `${alpha * 0.6})`).replace('0.4)', `${alpha * 0.4})`);
            ctx.beginPath();
            ctx.arc(smoke.x, smoke.y, smoke.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Progress bar
        const barWidth = size * 0.9;
        const barHeight = 8;
        const progressRatio = this.currentProgress / this.miningInterval;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
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
            ctx.fillStyle = '#8B4513';
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
            description: 'Workers mine gold. Click to collect 30 gold when ready (15s cycle).',
            effect: 'Click to collect',
            size: '4x4',
            cost: 200
        };
    }
}
