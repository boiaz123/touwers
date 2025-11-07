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
        this.quarryLayers = [];
        this.woodenStructures = [];
        this.rockWalls = [];
        
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
        
        // Generate quarry layers with proper depth and rock formations
        for (let layer = 0; layer < 4; layer++) {
            this.quarryLayers.push({
                radiusX: 50 - layer * 8,
                radiusY: 40 - layer * 6,
                depth: layer * 15,
                color: this.getLayerColor(layer),
                wallHeight: 12,
                rockFormations: this.generateRockFormations(50 - layer * 8, 40 - layer * 6, layer)
            });
        }
        
        // Generate rock walls between layers
        for (let layer = 0; layer < 3; layer++) {
            const currentLayer = this.quarryLayers[layer];
            const nextLayer = this.quarryLayers[layer + 1];
            
            this.rockWalls.push({
                topRadius: currentLayer.radiusX,
                bottomRadius: nextLayer.radiusX,
                topY: currentLayer.depth,
                bottomY: nextLayer.depth,
                color: this.darkenColor(currentLayer.color, 0.3),
                segments: this.generateWallSegments(currentLayer.radiusX, nextLayer.radiusX)
            });
        }
        
        // Simplified wooden structures
        this.woodenStructures = [
            { type: 'beam', x1: -40, y1: -10, x2: 40, y2: -10, width: 6 },
            { type: 'post', x: -30, y: -5, width: 4, height: 20 },
            { type: 'post', x: 30, y: -5, width: 4, height: 20 },
            { type: 'ladder', x: 0, y: -15, width: 4, height: 25 },
            { type: 'platform', x: 0, y: 15, width: 20, height: 6 }
        ];
    }
    
    generateRockFormations(radiusX, radiusY, layer) {
        const formations = [];
        const count = 8 + layer * 2; // More formations in deeper layers
        
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const distance = radiusX * (0.8 + Math.random() * 0.2);
            formations.push({
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * radiusY * (0.8 + Math.random() * 0.2),
                size: Math.random() * 6 + 4,
                type: Math.floor(Math.random() * 3),
                protrusion: Math.random() * 3 + 2
            });
        }
        
        return formations;
    }
    
    generateWallSegments(topRadius, bottomRadius) {
        const segments = [];
        const segmentCount = 16;
        
        for (let i = 0; i < segmentCount; i++) {
            const angle = (i / segmentCount) * Math.PI * 2;
            const nextAngle = ((i + 1) / segmentCount) * Math.PI * 2;
            
            segments.push({
                topX1: Math.cos(angle) * topRadius,
                topY1: Math.sin(angle) * topRadius * 0.7,
                topX2: Math.cos(nextAngle) * topRadius,
                topY2: Math.sin(nextAngle) * topRadius * 0.7,
                bottomX1: Math.cos(angle) * bottomRadius,
                bottomY1: Math.sin(angle) * bottomRadius * 0.7,
                bottomX2: Math.cos(nextAngle) * bottomRadius,
                bottomY2: Math.sin(nextAngle) * bottomRadius * 0.7,
                roughness: Math.random() * 2 + 1
            });
        }
        
        return segments;
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
        // Render quarry from deepest layer to surface for proper depth
        for (let i = this.quarryLayers.length - 1; i >= 0; i--) {
            const layer = this.quarryLayers[i];
            
            ctx.save();
            ctx.translate(this.x, this.y);
            
            // Render the quarry floor (bottom of each layer)
            const floorGradient = ctx.createRadialGradient(
                0, layer.depth, 0,
                0, layer.depth, layer.radiusX
            );
            floorGradient.addColorStop(0, layer.color);
            floorGradient.addColorStop(0.7, this.darkenColor(layer.color, 0.2));
            floorGradient.addColorStop(1, this.darkenColor(layer.color, 0.4));
            
            ctx.fillStyle = floorGradient;
            ctx.beginPath();
            ctx.ellipse(0, layer.depth, layer.radiusX, layer.radiusY, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Add floor texture (scattered rocks and dirt)
            for (let j = 0; j < 12; j++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * layer.radiusX * 0.8;
                const rockX = Math.cos(angle) * distance;
                const rockY = Math.sin(angle) * distance * 0.7 + layer.depth;
                
                ctx.fillStyle = this.darkenColor(layer.color, 0.5);
                ctx.beginPath();
                ctx.arc(rockX, rockY, Math.random() * 3 + 1, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Render rock formations around the layer edge
            layer.rockFormations.forEach(rock => {
                const rockX = rock.x;
                const rockY = rock.y + layer.depth;
                
                ctx.save();
                ctx.translate(rockX, rockY);
                
                // Rock shadow for 3D effect
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.beginPath();
                ctx.ellipse(2, rock.protrusion + 1, rock.size * 0.8, rock.size * 0.4, 0, 0, Math.PI * 2);
                ctx.fill();
                
                // Main rock formation
                const rockGradient = ctx.createRadialGradient(
                    -rock.size * 0.3, -rock.protrusion * 0.5, 0,
                    0, 0, rock.size
                );
                rockGradient.addColorStop(0, this.lightenColor(layer.color, 0.2));
                rockGradient.addColorStop(0.7, layer.color);
                rockGradient.addColorStop(1, this.darkenColor(layer.color, 0.3));
                
                ctx.fillStyle = rockGradient;
                ctx.strokeStyle = this.darkenColor(layer.color, 0.5);
                ctx.lineWidth = 1;
                
                switch (rock.type) {
                    case 0: // Rounded boulder
                        ctx.beginPath();
                        ctx.ellipse(0, 0, rock.size, rock.size * 0.8, 0, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.stroke();
                        break;
                        
                    case 1: // Jagged rock
                        ctx.beginPath();
                        for (let k = 0; k < 8; k++) {
                            const angle = (k / 8) * Math.PI * 2;
                            const radius = rock.size * (0.6 + Math.random() * 0.4);
                            const x = Math.cos(angle) * radius;
                            const y = Math.sin(angle) * radius * 0.8;
                            if (k === 0) ctx.moveTo(x, y);
                            else ctx.lineTo(x, y);
                        }
                        ctx.closePath();
                        ctx.fill();
                        ctx.stroke();
                        break;
                        
                    case 2: // Layered rock
                        for (let k = 0; k < 3; k++) {
                            const layerY = -rock.size * 0.5 + k * rock.size * 0.4;
                            const layerHeight = rock.size * 0.3;
                            ctx.fillStyle = k === 1 ? layer.color : this.darkenColor(layer.color, 0.2);
                            ctx.fillRect(-rock.size, layerY, rock.size * 2, layerHeight);
                            ctx.strokeRect(-rock.size, layerY, rock.size * 2, layerHeight);
                        }
                        break;
                }
                
                // Rock highlights for 3D effect
                ctx.fillStyle = this.lightenColor(layer.color, 0.4);
                ctx.beginPath();
                ctx.ellipse(-rock.size * 0.3, -rock.size * 0.3, rock.size * 0.2, rock.size * 0.1, 0, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
            });
            
            ctx.restore();
        }
        
        // Render rock walls between layers for 3D depth
        this.rockWalls.forEach(wall => {
            ctx.save();
            ctx.translate(this.x, this.y);
            
            wall.segments.forEach(segment => {
                // Create 3D wall segment
                const wallGradient = ctx.createLinearGradient(
                    segment.topX1, wall.topY,
                    segment.bottomX1, wall.bottomY
                );
                wallGradient.addColorStop(0, wall.color);
                wallGradient.addColorStop(1, this.darkenColor(wall.color, 0.4));
                
                ctx.fillStyle = wallGradient;
                ctx.strokeStyle = this.darkenColor(wall.color, 0.6);
                ctx.lineWidth = 1;
                
                // Draw wall segment as a quad
                ctx.beginPath();
                ctx.moveTo(segment.topX1, wall.topY);
                ctx.lineTo(segment.topX2, wall.topY);
                ctx.lineTo(segment.bottomX2, wall.bottomY);
                ctx.lineTo(segment.bottomX1, wall.bottomY);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                
                // Add rock texture lines on the wall
                for (let j = 0; j < 3; j++) {
                    const t = (j + 1) / 4;
                    const midX1 = segment.topX1 + (segment.bottomX1 - segment.topX1) * t;
                    const midX2 = segment.topX2 + (segment.bottomX2 - segment.topX2) * t;
                    const midY = wall.topY + (wall.bottomY - wall.topY) * t;
                    
                    ctx.strokeStyle = this.darkenColor(wall.color, 0.3);
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(midX1 + Math.random() * segment.roughness, midY);
                    ctx.lineTo(midX2 + Math.random() * segment.roughness, midY);
                    ctx.stroke();
                }
            });
            
            ctx.restore();
        });
        
        // Render wooden structures (simplified for clarity)
        this.woodenStructures.forEach(structure => {
            ctx.save();
            ctx.translate(this.x, this.y);
            
            switch (structure.type) {
                case 'beam':
                    const beamGradient = ctx.createLinearGradient(
                        structure.x1, structure.y1 - 2,
                        structure.x1, structure.y1 + 2
                    );
                    beamGradient.addColorStop(0, '#DEB887');
                    beamGradient.addColorStop(1, '#8B7355');
                    
                    ctx.fillStyle = beamGradient;
                    ctx.strokeStyle = '#654321';
                    ctx.lineWidth = 1;
                    ctx.fillRect(structure.x1, structure.y1 - structure.width/2, 
                                structure.x2 - structure.x1, structure.width);
                    ctx.strokeRect(structure.x1, structure.y1 - structure.width/2, 
                                 structure.x2 - structure.x1, structure.width);
                    break;
                    
                case 'post':
                    ctx.fillStyle = '#CD853F';
                    ctx.strokeStyle = '#654321';
                    ctx.lineWidth = 1;
                    ctx.fillRect(structure.x - structure.width/2, structure.y - structure.height, 
                               structure.width, structure.height);
                    ctx.strokeRect(structure.x - structure.width/2, structure.y - structure.height, 
                                 structure.width, structure.height);
                    break;
                    
                case 'ladder':
                    ctx.strokeStyle = '#8B7355';
                    ctx.lineWidth = 2;
                    // Ladder sides
                    ctx.beginPath();
                    ctx.moveTo(structure.x - structure.width/2, structure.y);
                    ctx.lineTo(structure.x - structure.width/2, structure.y - structure.height);
                    ctx.moveTo(structure.x + structure.width/2, structure.y);
                    ctx.lineTo(structure.x + structure.width/2, structure.y - structure.height);
                    ctx.stroke();
                    
                    // Rungs
                    for (let i = 0; i < structure.height; i += 5) {
                        ctx.beginPath();
                        ctx.moveTo(structure.x - structure.width/2, structure.y - i);
                        ctx.lineTo(structure.x + structure.width/2, structure.y - i);
                        ctx.stroke();
                    }
                    break;
                    
                case 'platform':
                    ctx.fillStyle = '#DEB887';
                    ctx.strokeStyle = '#8B7355';
                    ctx.lineWidth = 1;
                    ctx.fillRect(structure.x - structure.width/2, structure.y, 
                               structure.width, structure.height);
                    ctx.strokeRect(structure.x - structure.width/2, structure.y, 
                                 structure.width, structure.height);
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
    
    lightenColor(color, factor) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        const newR = Math.min(255, Math.floor(r + (255 - r) * factor));
        const newG = Math.min(255, Math.floor(g + (255 - g) * factor));
        const newB = Math.min(255, Math.floor(b + (255 - b) * factor));
        
        return `rgb(${newR}, ${newG}, ${newB})`;
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
