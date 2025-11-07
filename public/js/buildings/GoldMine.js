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
        this.goldPiles = [];
        this.bobAnimations = [];
        this.quarryLayers = [];
        this.woodenStructures = [];
        
        // Initialize workers with random positions around the quarry
        for (let i = 0; i < 3; i++) {
            this.workers.push({
                x: (Math.random() - 0.5) * 80,
                y: (Math.random() - 0.5) * 80,
                animationOffset: Math.random() * Math.PI * 2,
                pickaxeRaised: 0,
                miningCooldown: Math.random() * 2
            });
        }
        
        // Generate natural quarry layers (oval/elliptical for more natural look)
        for (let layer = 0; layer < 5; layer++) {
            this.quarryLayers.push({
                radiusX: 60 - layer * 8,
                radiusY: 50 - layer * 6,
                depth: layer * 8,
                color: this.getLayerColor(layer),
                rockiness: Math.random() * 0.3 + 0.7
            });
        }
        
        // Generate wooden mining structures
        this.woodenStructures = [
            // Main support beam across quarry
            { type: 'beam', x1: -50, y1: -20, x2: 50, y2: -20, width: 8 },
            { type: 'beam', x1: -30, y1: 40, x2: 30, y2: 40, width: 6 },
            
            // Vertical support posts
            { type: 'post', x: -40, y: -15, width: 6, height: 25 },
            { type: 'post', x: 40, y: -15, width: 6, height: 25 },
            { type: 'post', x: -25, y: 35, width: 5, height: 20 },
            { type: 'post', x: 25, y: 35, width: 5, height: 20 },
            
            // Diagonal braces
            { type: 'brace', x1: -40, y1: -15, x2: -25, y2: 35, width: 4 },
            { type: 'brace', x1: 40, y1: -15, x2: 25, y2: 35, width: 4 },
            
            // Wooden platforms at different levels
            { type: 'platform', x: -20, y: 0, width: 25, height: 8, level: 1 },
            { type: 'platform', x: 15, y: 20, width: 20, height: 6, level: 2 },
            
            // Wooden ladder
            { type: 'ladder', x: 0, y: -30, width: 4, height: 40 },
            
            // Mining cart track
            { type: 'track', x1: -60, y1: 25, x2: 60, y2: 25, width: 6 }
        ];
    }
    
    getLayerColor(layer) {
        const colors = [
            '#8B7355', // Surface - sandy brown
            '#A0522D', // Layer 1 - sienna
            '#CD853F', // Layer 2 - peru  
            '#D2B48C', // Layer 3 - tan
            '#DEB887'  // Layer 4 - burlywood (bottom)
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
        // Render quarry layers from deepest to surface
        for (let i = this.quarryLayers.length - 1; i >= 0; i--) {
            const layer = this.quarryLayers[i];
            
            ctx.save();
            ctx.translate(this.x, this.y);
            
            // Create layer gradient for depth effect
            const layerGradient = ctx.createRadialGradient(
                0, -layer.depth,
                0,
                0, -layer.depth,
                layer.radiusX
            );
            layerGradient.addColorStop(0, layer.color);
            layerGradient.addColorStop(1, this.darkenColor(layer.color, 0.3));
            
            ctx.fillStyle = layerGradient;
            ctx.strokeStyle = this.darkenColor(layer.color, 0.5);
            ctx.lineWidth = 1;
            
            // Draw elliptical layer
            ctx.beginPath();
            ctx.ellipse(0, -layer.depth, layer.radiusX, layer.radiusY, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Add rock texture to layer edges
            if (i > 0) {
                ctx.strokeStyle = this.darkenColor(layer.color, 0.4);
                ctx.lineWidth = 2;
                
                // Add rocky texture along the edge
                for (let angle = 0; angle < Math.PI * 2; angle += 0.3) {
                    const x = Math.cos(angle) * layer.radiusX * layer.rockiness;
                    const y = Math.sin(angle) * layer.radiusY * layer.rockiness - layer.depth;
                    const variation = (Math.random() - 0.5) * 4;
                    
                    if (angle === 0) {
                        ctx.beginPath();
                        ctx.moveTo(x + variation, y + variation);
                    } else {
                        ctx.lineTo(x + variation, y + variation);
                    }
                }
                ctx.stroke();
            }
            
            ctx.restore();
        }
        
        // Render wooden structures
        this.woodenStructures.forEach(structure => {
            ctx.save();
            ctx.translate(this.x, this.y);
            
            switch (structure.type) {
                case 'beam':
                    // Horizontal support beam
                    const beamGradient = ctx.createLinearGradient(
                        structure.x1, structure.y1 - structure.width/2,
                        structure.x1, structure.y1 + structure.width/2
                    );
                    beamGradient.addColorStop(0, '#DEB887');
                    beamGradient.addColorStop(0.5, '#CD853F');
                    beamGradient.addColorStop(1, '#8B7355');
                    
                    ctx.fillStyle = beamGradient;
                    ctx.strokeStyle = '#654321';
                    ctx.lineWidth = 1;
                    
                    const beamLength = Math.hypot(structure.x2 - structure.x1, structure.y2 - structure.y1);
                    const beamAngle = Math.atan2(structure.y2 - structure.y1, structure.x2 - structure.x1);
                    
                    ctx.save();
                    ctx.translate(structure.x1, structure.y1);
                    ctx.rotate(beamAngle);
                    ctx.fillRect(0, -structure.width/2, beamLength, structure.width);
                    ctx.strokeRect(0, -structure.width/2, beamLength, structure.width);
                    
                    // Wood grain
                    ctx.strokeStyle = '#A0522D';
                    ctx.lineWidth = 0.5;
                    for (let i = 5; i < beamLength; i += 10) {
                        ctx.beginPath();
                        ctx.moveTo(i, -structure.width/2);
                        ctx.lineTo(i, structure.width/2);
                        ctx.stroke();
                    }
                    ctx.restore();
                    break;
                    
                case 'post':
                    // Vertical support post
                    const postGradient = ctx.createLinearGradient(
                        structure.x - structure.width/2, structure.y,
                        structure.x + structure.width/2, structure.y
                    );
                    postGradient.addColorStop(0, '#8B7355');
                    postGradient.addColorStop(0.5, '#CD853F');
                    postGradient.addColorStop(1, '#A0522D');
                    
                    ctx.fillStyle = postGradient;
                    ctx.strokeStyle = '#654321';
                    ctx.lineWidth = 1;
                    ctx.fillRect(structure.x - structure.width/2, structure.y - structure.height, structure.width, structure.height);
                    ctx.strokeRect(structure.x - structure.width/2, structure.y - structure.height, structure.width, structure.height);
                    break;
                    
                case 'brace':
                    // Diagonal support brace
                    ctx.strokeStyle = '#8B7355';
                    ctx.lineWidth = structure.width;
                    ctx.lineCap = 'round';
                    ctx.beginPath();
                    ctx.moveTo(structure.x1, structure.y1);
                    ctx.lineTo(structure.x2, structure.y2);
                    ctx.stroke();
                    break;
                    
                case 'platform':
                    // Wooden platform
                    const platformY = structure.y - structure.level * 8;
                    ctx.fillStyle = '#DEB887';
                    ctx.strokeStyle = '#8B7355';
                    ctx.lineWidth = 1;
                    ctx.fillRect(structure.x - structure.width/2, platformY, structure.width, structure.height);
                    ctx.strokeRect(structure.x - structure.width/2, platformY, structure.width, structure.height);
                    
                    // Platform planks
                    ctx.strokeStyle = '#A0522D';
                    ctx.lineWidth = 0.5;
                    for (let i = structure.x - structure.width/2 + 3; i < structure.x + structure.width/2; i += 6) {
                        ctx.beginPath();
                        ctx.moveTo(i, platformY);
                        ctx.lineTo(i, platformY + structure.height);
                        ctx.stroke();
                    }
                    break;
                    
                case 'ladder':
                    // Wooden ladder
                    ctx.strokeStyle = '#8B7355';
                    ctx.lineWidth = 3;
                    
                    // Ladder sides
                    ctx.beginPath();
                    ctx.moveTo(structure.x - structure.width/2, structure.y);
                    ctx.lineTo(structure.x - structure.width/2, structure.y - structure.height);
                    ctx.moveTo(structure.x + structure.width/2, structure.y);
                    ctx.lineTo(structure.x + structure.width/2, structure.y - structure.height);
                    ctx.stroke();
                    
                    // Ladder rungs
                    ctx.lineWidth = 2;
                    for (let i = 0; i < structure.height; i += 6) {
                        ctx.beginPath();
                        ctx.moveTo(structure.x - structure.width/2, structure.y - i);
                        ctx.lineTo(structure.x + structure.width/2, structure.y - i);
                        ctx.stroke();
                    }
                    break;
                    
                case 'track':
                    // Mining cart track
                    ctx.strokeStyle = '#654321';
                    ctx.lineWidth = structure.width;
                    ctx.lineCap = 'round';
                    ctx.beginPath();
                    ctx.moveTo(structure.x1, structure.y1);
                    ctx.lineTo(structure.x2, structure.y2);
                    ctx.stroke();
                    
                    // Track ties
                    const trackLength = Math.hypot(structure.x2 - structure.x1, structure.y2 - structure.y1);
                    const trackAngle = Math.atan2(structure.y2 - structure.y1, structure.x2 - structure.x1);
                    
                    ctx.strokeStyle = '#8B4513';
                    ctx.lineWidth = 3;
                    for (let i = 0; i < trackLength; i += 15) {
                        const tieX = structure.x1 + Math.cos(trackAngle) * i;
                        const tieY = structure.y1 + Math.sin(trackAngle) * i;
                        
                        ctx.save();
                        ctx.translate(tieX, tieY);
                        ctx.rotate(trackAngle + Math.PI/2);
                        ctx.beginPath();
                        ctx.moveTo(-8, 0);
                        ctx.lineTo(8, 0);
                        ctx.stroke();
                        ctx.restore();
                    }
                    break;
            }
            
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
        // Simple color darkening function
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
