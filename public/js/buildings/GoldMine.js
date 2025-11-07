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
        
        // Initialize workers
        for (let i = 0; i < 3; i++) {
            this.workers.push({
                x: (Math.random() - 0.5) * 60,
                y: (Math.random() - 0.5) * 60,
                animationOffset: Math.random() * Math.PI * 2,
                pickaxeRaised: 0,
                miningCooldown: Math.random() * 2
            });
        }
    }
    
    getLayerColor(layer) {
        const colors = [
            '#8B7355', // Surface - sandy brown
            '#A0522D', // Layer 1 - sienna
            '#CD853F', // Layer 2 - peru  
            '#D2B48C'  // Layer 3 - tan
        ];
        return colors[layer] || '#8B7355';
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
                        x: (Math.random() - 0.5) * 60,
                        y: (Math.random() - 0.5) * 60,
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
                    vx: (Math.random() - 0.5) * 20,
                    vy: -15 - Math.random() * 15,
                    life: 1.5,
                    maxLife: 1.5,
                    size: Math.random() * 3 + 2,
                    color: 'rgba(160, 130, 98, 0.6)'
                });
            }
        });
        
        // Generate ambient dust from quarry
        this.nextSmokeTime -= deltaTime;
        if (this.nextSmokeTime <= 0 && !this.isReady) {
            this.smokePuffs.push({
                x: this.x + (Math.random() - 0.5) * 80,
                y: this.y + (Math.random() - 0.5) * 60,
                vx: (Math.random() - 0.5) * 10,
                vy: -10 - Math.random() * 10,
                life: 2,
                maxLife: 2,
                size: Math.random() * 4 + 2,
                color: 'rgba(139, 115, 85, 0.4)'
            });
            this.nextSmokeTime = 1.0 + Math.random() * 1.5;
        }
        
        // Update smoke/dust
        this.smokePuffs = this.smokePuffs.filter(smoke => {
            smoke.x += smoke.vx * deltaTime;
            smoke.y += smoke.vy * deltaTime;
            smoke.life -= deltaTime;
            smoke.size += deltaTime * 0.5;
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
        // Simple quarry pit with 3 concentric layers for depth
        const layers = [
            { radius: size * 0.45, depth: 5, color: this.getLayerColor(0) },
            { radius: size * 0.35, depth: 10, color: this.getLayerColor(1) },
            { radius: size * 0.25, depth: 15, color: this.getLayerColor(2) }
        ];
        
        // Render each layer
        layers.forEach((layer, index) => {
            ctx.save();
            ctx.translate(this.x, this.y + layer.depth);
            
            // Layer gradient for depth
            const layerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, layer.radius);
            layerGradient.addColorStop(0, layer.color);
            layerGradient.addColorStop(1, this.darkenColor(layer.color, 0.3));
            
            ctx.fillStyle = layerGradient;
            ctx.beginPath();
            ctx.arc(0, 0, layer.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Layer border
            ctx.strokeStyle = this.darkenColor(layer.color, 0.5);
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Add some rocks on each layer
            if (index === 0) { // Only on surface layer to avoid complexity
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2;
                    const distance = layer.radius * (0.7 + Math.random() * 0.2);
                    const rockX = Math.cos(angle) * distance;
                    const rockY = Math.sin(angle) * distance;
                    const rockSize = Math.random() * 4 + 3;
                    
                    ctx.fillStyle = this.darkenColor(layer.color, 0.4);
                    ctx.beginPath();
                    ctx.arc(rockX, rockY, rockSize, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            
            ctx.restore();
        });
        
        // Simple wooden support beams
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 4;
        
        // Horizontal beam
        ctx.beginPath();
        ctx.moveTo(this.x - size * 0.4, this.y - 5);
        ctx.lineTo(this.x + size * 0.4, this.y - 5);
        ctx.stroke();
        
        // Vertical posts
        ctx.beginPath();
        ctx.moveTo(this.x - size * 0.3, this.y - 15);
        ctx.lineTo(this.x - size * 0.3, this.y + 5);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(this.x + size * 0.3, this.y - 15);
        ctx.lineTo(this.x + size * 0.3, this.y + 5);
        ctx.stroke();
        
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
        
        // Render gold piles when ready
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
                
                for (let i = 0; i < 3; i++) {
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
        
        // Render dust clouds
        this.smokePuffs.forEach(smoke => {
            const alpha = smoke.life / smoke.maxLife;
            ctx.fillStyle = `rgba(160, 130, 98, ${alpha * 0.4})`;
            ctx.beginPath();
            ctx.arc(smoke.x, smoke.y, smoke.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Progress bar and indicators
        const barWidth = size * 0.8;
        const barHeight = 6;
        const progressRatio = this.currentProgress / this.miningInterval;
        
        ctx.fillStyle = 'rgba(101, 67, 33, 0.8)';
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
            name: 'Quarry Mine',
            description: 'Deep quarry pit with mining operations. Click to collect 30 gold when ready (15s cycle).',
            effect: 'Click to collect',
            size: '4x4',
            cost: 200
        };
    }
}
