import { Building } from './Building.js';

export class TowerForge extends Building {
    constructor(x, y, gridX, gridY) {
        super(x, y, gridX, gridY, 4);
        this.upgradeRadius = 200;
        this.sparks = [];
        this.nextSparkTime = 0;
        this.isSelected = false;
        this.smokeParticles = [];
        this.nextSmokeTime = 0;
        this.fireIntensity = 0;
        
        // Add workers
        this.workers = [
            {
                x: 15, y: 25, // Front left worker
                animationOffset: 0,
                hammerRaised: 0,
                workCooldown: 0,
                type: 'blacksmith'
            },
            {
                x: -20, y: 20, // Front right worker
                animationOffset: Math.PI,
                hammerRaised: 0,
                workCooldown: 1.5,
                type: 'helper'
            }
        ];
        
        // Upgrade system - rebalanced for better progression
        this.upgrades = {
            towerRange: { level: 0, maxLevel: 5, baseCost: 150, effect: 0.05 },
            poisonDamage: { level: 0, maxLevel: 5, baseCost: 120, effect: 3 },
            barricadeDamage: { level: 0, maxLevel: 5, baseCost: 100, effect: 8 },
            fireArrows: { level: 0, maxLevel: 3, baseCost: 200, effect: 1 },
            explosiveRadius: { level: 0, maxLevel: 4, baseCost: 180, effect: 15 }
        };
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        // Update fire intensity
        this.fireIntensity = Math.sin(this.animationTime * 6) * 0.3 + 0.7;
        
        // Update workers
        this.workers.forEach(worker => {
            worker.workCooldown -= deltaTime;
            worker.hammerRaised = Math.max(0, worker.hammerRaised - deltaTime * 3);
            
            if (worker.workCooldown <= 0) {
                worker.hammerRaised = 1;
                worker.workCooldown = 2 + Math.random() * 2;
                
                // Create sparks when worker strikes
                if (worker.type === 'blacksmith') {
                    for (let i = 0; i < 3; i++) {
                        this.sparks.push({
                            x: this.x + worker.x + (Math.random() - 0.5) * 5,
                            y: this.y + worker.y + (Math.random() - 0.5) * 5,
                            vx: (Math.random() - 0.5) * 40,
                            vy: -Math.random() * 60 - 20,
                            life: 0.8,
                            maxLife: 0.8,
                            size: Math.random() * 1.5 + 0.5,
                            color: Math.random() > 0.5 ? 'orange' : 'yellow'
                        });
                    }
                }
            }
        });
        
        // Generate forge sparks from fire opening
        this.nextSparkTime -= deltaTime;
        if (this.nextSparkTime <= 0) {
            const sparkCount = this.isSelected ? 8 : 5;
            for (let i = 0; i < sparkCount; i++) {
                this.sparks.push({
                    x: this.x - 15 + (Math.random() - 0.5) * 25,
                    y: this.y - 10 + (Math.random() - 0.5) * 15,
                    vx: (Math.random() - 0.5) * 60,
                    vy: -Math.random() * 80 - 30,
                    life: 1.2,
                    maxLife: 1.2,
                    size: Math.random() * 2 + 1,
                    color: Math.random() > 0.4 ? 'orange' : (Math.random() > 0.7 ? 'yellow' : 'red')
                });
            }
            this.nextSparkTime = 0.1 + Math.random() * 0.2;
        }
        
        // Generate chimney smoke - UPDATED FOR NEW CHIMNEY POSITION
        this.nextSmokeTime -= deltaTime;
        if (this.nextSmokeTime <= 0) {
            const buildingWidth = 128 * 0.9; // Approximate size
            const chimneyX = this.x + buildingWidth/2 - 19; // Updated for integrated position
            const chimneyTopY = this.y - 42; // Top of chimney
            
            this.smokeParticles.push({
                x: chimneyX + (Math.random() - 0.5) * 12, // From chimney opening
                y: chimneyTopY,
                vx: (Math.random() - 0.5) * 20,
                vy: -30 - Math.random() * 20,
                life: 3,
                maxLife: 3,
                size: Math.random() * 8 + 4
            });
            this.nextSmokeTime = 0.3 + Math.random() * 0.4;
        }
        
        // Update particles
        this.sparks = this.sparks.filter(spark => {
            spark.x += spark.vx * deltaTime;
            spark.y += spark.vy * deltaTime;
            spark.life -= deltaTime;
            spark.vy += 150 * deltaTime;
            spark.size = Math.max(0, spark.size - deltaTime * 2);
            return spark.life > 0 && spark.size > 0;
        });
        
        this.smokeParticles = this.smokeParticles.filter(smoke => {
            smoke.x += smoke.vx * deltaTime;
            smoke.y += smoke.vy * deltaTime;
            smoke.life -= deltaTime;
            smoke.size += deltaTime * 3;
            smoke.vx *= 0.99;
            return smoke.life > 0;
        });
    }
    
    render(ctx, size) {
        // Calculate building dimensions
        const buildingWidth = size * 0.9;
        const buildingHeight = size * 0.6;
        const wallHeight = size * 0.5;
        
        // Building shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(this.x - buildingWidth/2 + 4, this.y - buildingHeight/2 + 4, buildingWidth, buildingHeight);
        
        // Render detailed front area items FIRST (behind workers)
        this.renderFrontAreaItems(ctx, size);
        
        // Cobblestone wall structure
        this.renderCobblestoneWalls(ctx, buildingWidth, buildingHeight, wallHeight);
        
        // Forge opening with fire
        this.renderForgeOpening(ctx, size);
        
        // Chimney - NOW POSITIONED AT BOTTOM RIGHT
        this.renderChimney(ctx, size);
        
        // Roof
        this.renderRoof(ctx, buildingWidth, buildingHeight, wallHeight);
        
        // Forge interior details
        this.renderForgeInterior(ctx, size);
        
        // Render workers
        this.renderWorkers(ctx, size);
        
        // Render particles
        this.renderParticles(ctx);
        
        // REMOVED YELLOW SELECTION INDICATOR
        
        // Upgrade indicator
        ctx.fillStyle = this.isSelected ? '#FFA500' : '#FF8C00';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🔨⬆️', this.x, this.y + size/2 + 20);
    }
    
    renderFrontAreaItems(ctx, size) {
        // Storage barrels
        const barrels = [
            { x: -25, y: 30, size: 8, type: 'wood' },
            { x: -10, y: 32, size: 7, type: 'metal' },
            { x: 30, y: 28, size: 9, type: 'wood' }
        ];
        
        barrels.forEach(barrel => {
            ctx.save();
            ctx.translate(this.x + barrel.x, this.y + barrel.y);
            
            // Barrel shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(-barrel.size/2 + 2, -barrel.size + 2, barrel.size, barrel.size);
            
            if (barrel.type === 'wood') {
                ctx.fillStyle = '#8B4513';
                ctx.strokeStyle = '#654321';
            } else {
                ctx.fillStyle = '#2F2F2F';
                ctx.strokeStyle = '#1C1C1C';
            }
            
            ctx.lineWidth = 2;
            ctx.fillRect(-barrel.size/2, -barrel.size, barrel.size, barrel.size);
            ctx.strokeRect(-barrel.size/2, -barrel.size, barrel.size, barrel.size);
            
            // Barrel bands
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-barrel.size/2, -barrel.size * 0.7);
            ctx.lineTo(barrel.size/2, -barrel.size * 0.7);
            ctx.moveTo(-barrel.size/2, -barrel.size * 0.3);
            ctx.lineTo(barrel.size/2, -barrel.size * 0.3);
            ctx.stroke();
            
            ctx.restore();
        });
        
        // Wooden crates
        const crates = [
            { x: 5, y: 35, size: 10, rotation: 0.1 },
            { x: 20, y: 38, size: 8, rotation: -0.1 }
        ];
        
        crates.forEach(crate => {
            ctx.save();
            ctx.translate(this.x + crate.x, this.y + crate.y);
            ctx.rotate(crate.rotation);
            
            // Crate shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(-crate.size/2 + 2, -crate.size + 2, crate.size, crate.size);
            
            // Crate body
            ctx.fillStyle = '#CD853F';
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 2;
            ctx.fillRect(-crate.size/2, -crate.size, crate.size, crate.size);
            ctx.strokeRect(-crate.size/2, -crate.size, crate.size, crate.size);
            
            // Wood planks
            ctx.lineWidth = 1;
            for (let i = 1; i < 4; i++) {
                const plankY = -crate.size + (crate.size * i / 4);
                ctx.beginPath();
                ctx.moveTo(-crate.size/2, plankY);
                ctx.lineTo(crate.size/2, plankY);
                ctx.stroke();
            }
            
            ctx.restore();
        });
        
        // Metal buckets
        const buckets = [
            { x: -35, y: 25, size: 6 },
            { x: 35, y: 35, size: 5 }
        ];
        
        buckets.forEach(bucket => {
            ctx.save();
            ctx.translate(this.x + bucket.x, this.y + bucket.y);
            
            // Bucket shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.ellipse(2, 2, bucket.size, bucket.size * 0.3, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Bucket body
            ctx.fillStyle = '#696969';
            ctx.strokeStyle = '#2F2F2F';
            ctx.lineWidth = 1;
            
            ctx.beginPath();
            ctx.moveTo(-bucket.size * 0.8, 0);
            ctx.lineTo(-bucket.size * 0.6, -bucket.size);
            ctx.lineTo(bucket.size * 0.6, -bucket.size);
            ctx.lineTo(bucket.size * 0.8, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Bucket rim
            ctx.fillStyle = '#808080';
            ctx.fillRect(-bucket.size * 0.8, -2, bucket.size * 1.6, 4);
            
            // Handle
            ctx.strokeStyle = '#2F2F2F';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, -bucket.size * 0.5, bucket.size * 0.7, -Math.PI * 0.3, -Math.PI * 0.7, true);
            ctx.stroke();
            
            ctx.restore();
        });
        
        // Metal ingots pile
        const ingotPile = { x: -5, y: 25 };
        ctx.save();
        ctx.translate(this.x + ingotPile.x, this.y + ingotPile.y);
        
        // Ingot pile shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(-8, -3, 16, 6);
        
        // Individual ingots
        const ingots = [
            { x: -6, y: 0, width: 12, height: 3 },
            { x: -4, y: -3, width: 8, height: 3 },
            { x: 2, y: -1, width: 10, height: 3 }
        ];
        
        ingots.forEach(ingot => {
            ctx.fillStyle = '#C0C0C0';
            ctx.strokeStyle = '#808080';
            ctx.lineWidth = 1;
            ctx.fillRect(ingot.x, ingot.y, ingot.width, ingot.height);
            ctx.strokeRect(ingot.x, ingot.y, ingot.width, ingot.height);
            
            // Metal shine
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.fillRect(ingot.x, ingot.y, ingot.width * 0.3, ingot.height * 0.5);
        });
        
        ctx.restore();
        
        // Scattered tools
        const tools = [
            { x: -30, y: 15, type: 'hammer' },
            { x: 25, y: 20, type: 'tongs' },
            { x: 12, y: 28, type: 'file' }
        ];
        
        tools.forEach(tool => {
            ctx.save();
            ctx.translate(this.x + tool.x, this.y + tool.y);
            
            switch(tool.type) {
                case 'hammer':
                    // Hammer handle
                    ctx.fillStyle = '#8B4513';
                    ctx.fillRect(-1, 0, 2, 12);
                    // Hammer head
                    ctx.fillStyle = '#2F2F2F';
                    ctx.fillRect(-3, 0, 6, 4);
                    break;
                    
                case 'tongs':
                    // Tongs arms
                    ctx.strokeStyle = '#2F2F2F';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(-2, 10);
                    ctx.lineTo(-4, 0);
                    ctx.moveTo(2, 10);
                    ctx.lineTo(4, 0);
                    ctx.stroke();
                    // Tongs pivot
                    ctx.fillStyle = '#1C1C1C';
                    ctx.beginPath();
                    ctx.arc(0, 6, 1.5, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                    
                case 'file':
                    // File body
                    ctx.fillStyle = '#696969';
                    ctx.fillRect(-1, 0, 2, 8);
                    // File handle
                    ctx.fillStyle = '#8B4513';
                    ctx.fillRect(-0.5, 8, 1, 4);
                    break;
            }
            
            ctx.restore();
        });
        
        // Coal pile near forge
        const coalPile = { x: -40, y: 10 };
        ctx.save();
        ctx.translate(this.x + coalPile.x, this.y + coalPile.y);
        
        ctx.fillStyle = '#1C1C1C';
        for (let i = 0; i < 8; i++) {
            const coalX = -6 + (i % 4) * 4;
            const coalY = -2 + Math.floor(i / 4) * 3;
            const coalSize = 1.5 + Math.random() * 1;
            
            ctx.beginPath();
            ctx.arc(coalX, coalY, coalSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    renderWorkers(ctx, size) {
        this.workers.forEach(worker => {
            ctx.save();
            ctx.translate(this.x + worker.x, this.y + worker.y);
            
            // Worker shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.ellipse(1, 1, 3, 1, 0, 0, Math.PI * 2);
            ctx.fill();
            
            if (worker.type === 'blacksmith') {
                // Blacksmith - wearing leather apron
                ctx.fillStyle = '#654321'; // Brown leather apron
                ctx.fillRect(-3, -8, 6, 12);
                
                // Apron straps
                ctx.strokeStyle = '#8B4513';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(-2, -8);
                ctx.lineTo(0, -12);
                ctx.lineTo(2, -8);
                ctx.stroke();
            } else {
                // Helper - blue work shirt
                ctx.fillStyle = '#4169E1';
                ctx.fillRect(-2, -6, 4, 10);
            }
            
            // Worker head
            ctx.fillStyle = '#DDBEA9';
            ctx.beginPath();
            ctx.arc(0, -12, 2.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Worker hair/hat
            if (worker.type === 'blacksmith') {
                // Leather cap
                ctx.fillStyle = '#8B4513';
                ctx.beginPath();
                ctx.arc(0, -12, 3, Math.PI, Math.PI * 2);
                ctx.fill();
            } else {
                // Simple hair
                ctx.fillStyle = '#654321';
                ctx.beginPath();
                ctx.arc(0, -13, 2, Math.PI, Math.PI * 2);
                ctx.fill();
            }
            
            // Arms with tools
            const armAngle = worker.hammerRaised > 0 ? -Math.PI/2 : Math.PI/6;
            
            ctx.strokeStyle = '#DDBEA9';
            ctx.lineWidth = 2;
            
            // Working arm
            ctx.beginPath();
            ctx.moveTo(0, -6);
            ctx.lineTo(Math.cos(armAngle) * 6, -6 + Math.sin(armAngle) * 6);
            ctx.stroke();
            
            // Other arm
            ctx.beginPath();
            ctx.moveTo(0, -4);
            ctx.lineTo(-3, -1);
            ctx.stroke();
            
            // Tool in hand
            if (worker.hammerRaised > 0.2) {
                const toolX = Math.cos(armAngle) * 8;
                const toolY = -6 + Math.sin(armAngle) * 8;
                
                if (worker.type === 'blacksmith') {
                    // Hammer
                    ctx.fillStyle = '#8B4513';
                    ctx.fillRect(toolX - 1, toolY, 2, 6);
                    ctx.fillStyle = '#2F2F2F';
                    ctx.fillRect(toolX - 2, toolY, 4, 2);
                } else {
                    // Tongs
                    ctx.strokeStyle = '#2F2F2F';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(toolX - 1, toolY);
                    ctx.lineTo(toolX - 2, toolY + 4);
                    ctx.moveTo(toolX + 1, toolY);
                    ctx.lineTo(toolX + 2, toolY + 4);
                    ctx.stroke();
                }
            }
            
            ctx.restore();
        });
    }
    
    renderCobblestoneWalls(ctx, buildingWidth, buildingHeight, wallHeight) {
        // Base wall color
        const wallGradient = ctx.createLinearGradient(
            this.x - buildingWidth/2, this.y - wallHeight,
            this.x + buildingWidth/4, this.y
        );
        wallGradient.addColorStop(0, '#A9A9A9');
        wallGradient.addColorStop(0.5, '#808080');
        wallGradient.addColorStop(1, '#696969');
        
        // Main wall structure
        ctx.fillStyle = wallGradient;
        ctx.fillRect(this.x - buildingWidth/2, this.y - wallHeight, buildingWidth, wallHeight);
        
        // Individual cobblestones
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        
        const stoneWidth = buildingWidth / 8;
        const stoneHeight = wallHeight / 6;
        
        // Draw cobblestone pattern
        for (let row = 0; row < 6; row++) {
            const offsetX = (row % 2) * stoneWidth/2; // Staggered pattern
            const rowY = this.y - wallHeight + (row * stoneHeight);
            
            for (let col = 0; col < 9; col++) {
                const stoneX = this.x - buildingWidth/2 + offsetX + (col * stoneWidth);
                
                // Skip stones where forge opening will be
                if (row >= 2 && row <= 4 && col >= 1 && col <= 3) {
                    continue;
                }
                
                // Individual stone color variation
                const stoneShade = 0.8 + Math.sin(row * col * 0.5) * 0.2;
                ctx.fillStyle = `rgb(${Math.floor(169 * stoneShade)}, ${Math.floor(169 * stoneShade)}, ${Math.floor(169 * stoneShade)})`;
                
                // Draw stone
                ctx.fillRect(stoneX, rowY, stoneWidth - 1, stoneHeight - 1);
                ctx.strokeRect(stoneX, rowY, stoneWidth - 1, stoneHeight - 1);
                
                // Stone highlight for 3D effect
                ctx.fillStyle = `rgba(200, 200, 200, ${0.3 * stoneShade})`;
                ctx.fillRect(stoneX, rowY, stoneWidth/3, stoneHeight/3);
            }
        }
        
        // Wall top edge
        ctx.fillStyle = '#DCDCDC';
        ctx.fillRect(this.x - buildingWidth/2, this.y - wallHeight, buildingWidth, 3);
        
        // RIGHT SIDE WALL - properly integrated with chimney
        const rightWallStart = this.x + buildingWidth/2;
        const chimneyStart = this.x + buildingWidth/2 - buildingWidth * 0.2; // Chimney starts 20% from right edge
        
        // Right wall section (before chimney integration)
        ctx.fillStyle = '#696969';
        ctx.fillRect(rightWallStart, this.y - wallHeight, 8, wallHeight);
        
        // Right wall top
        ctx.fillStyle = '#808080';
        ctx.fillRect(rightWallStart, this.y - wallHeight, 8, 3);
        
        // Chimney integration stones - blend chimney base with main wall
        const chimneyIntegrationWidth = buildingWidth * 0.25;
        ctx.fillStyle = '#696969';
        
        // Integration stones that blend wall into chimney
        for (let row = 0; row < 4; row++) {
            const integrationY = this.y - wallHeight + (row * stoneHeight);
            const integrationX = chimneyStart + (row * 3); // Stepped integration
            
            ctx.fillRect(integrationX, integrationY, chimneyIntegrationWidth - (row * 2), stoneHeight - 1);
            ctx.strokeRect(integrationX, integrationY, chimneyIntegrationWidth - (row * 2), stoneHeight - 1);
        }
        
        // Corner reinforcement stones where chimney meets wall
        ctx.fillStyle = '#808080';
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 2;
        
        // Large corner stones
        const cornerStones = [
            { x: rightWallStart - 4, y: this.y - wallHeight + stoneHeight, width: 12, height: stoneHeight },
            { x: rightWallStart - 2, y: this.y - wallHeight + stoneHeight * 2, width: 10, height: stoneHeight },
            { x: rightWallStart - 6, y: this.y - wallHeight + stoneHeight * 3, width: 14, height: stoneHeight }
        ];
        
        cornerStones.forEach(stone => {
            ctx.fillRect(stone.x, stone.y, stone.width, stone.height);
            ctx.strokeRect(stone.x, stone.y, stone.width, stone.height);
            
            // Stone highlight
            ctx.fillStyle = 'rgba(220, 220, 220, 0.4)';
            ctx.fillRect(stone.x, stone.y, stone.width/3, stone.height/3);
            ctx.fillStyle = '#808080';
        });
    }
    
    renderChimney(ctx, size) {
        // Chimney position - PROPERLY INTEGRATED AT RIGHT CORNER
        const buildingWidth = size * 0.9;
        const chimneyX = this.x + buildingWidth/2 - size * 0.15; // Integrated into corner, not separate
        const chimneyY = this.y - size * 0.05;  // Slightly raised from base
        const chimneyWidth = size * 0.18; // Wider to blend with building
        const chimneyHeight = size * 0.65;
        
        // Chimney shadow - integrated with building shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(chimneyX + 2, chimneyY - chimneyHeight + 2, chimneyWidth, chimneyHeight);
        
        // Chimney base foundation - blends with wall
        const foundationGradient = ctx.createLinearGradient(
            chimneyX, chimneyY,
            chimneyX + chimneyWidth, chimneyY - chimneyHeight/4
        );
        foundationGradient.addColorStop(0, '#808080'); // Matches wall color
        foundationGradient.addColorStop(0.5, '#696969');
        foundationGradient.addColorStop(1, '#2F2F2F');
        
        ctx.fillStyle = foundationGradient;
        ctx.fillRect(chimneyX - 4, chimneyY - chimneyHeight/4, chimneyWidth + 8, chimneyHeight/4);
        
        // Foundation stones to match wall pattern
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        const foundationStoneWidth = chimneyWidth / 3;
        for (let i = 0; i < 4; i++) {
            const stoneX = chimneyX - 4 + (i * foundationStoneWidth);
            ctx.strokeRect(stoneX, chimneyY - chimneyHeight/4, foundationStoneWidth, chimneyHeight/4);
        }
        
        // Main chimney body - darker stone that complements building
        const chimneyGradient = ctx.createLinearGradient(
            chimneyX, chimneyY - chimneyHeight,
            chimneyX + chimneyWidth, chimneyY - chimneyHeight/4
        );
        chimneyGradient.addColorStop(0, '#696969');
        chimneyGradient.addColorStop(0.3, '#2F2F2F');
        chimneyGradient.addColorStop(0.7, '#1C1C1C');
        chimneyGradient.addColorStop(1, '#696969'); // Blend back to building color at base
        
        ctx.fillStyle = chimneyGradient;
        ctx.fillRect(chimneyX, chimneyY - chimneyHeight, chimneyWidth, chimneyHeight * 0.75);
        
        // Chimney stones - more refined pattern
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        
        const chimneyStoneHeight = (chimneyHeight * 0.75) / 8;
        for (let i = 0; i < 8; i++) {
            const stoneY = chimneyY - chimneyHeight + (i * chimneyStoneHeight);
            const offsetX = (i % 2) * 2; // Slight stagger like main wall
            
            // Main chimney stones
            ctx.strokeRect(chimneyX + offsetX, stoneY, chimneyWidth - offsetX, chimneyStoneHeight);
            
            // Stone detail lines
            if (i % 2 === 0) {
                ctx.strokeRect(chimneyX + offsetX, stoneY, chimneyWidth/2, chimneyStoneHeight);
            }
        }
        
        // Chimney cap - more elaborate to match building quality
        const capHeight = 8;
        ctx.fillStyle = '#2F2F2F';
        ctx.fillRect(chimneyX - 3, chimneyY - chimneyHeight - capHeight, chimneyWidth + 6, capHeight);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(chimneyX - 3, chimneyY - chimneyHeight - capHeight, chimneyWidth + 6, capHeight);
        
        // Cap detail - crown molding
        ctx.fillStyle = '#808080';
        ctx.fillRect(chimneyX - 2, chimneyY - chimneyHeight - capHeight + 1, chimneyWidth + 4, 2);
        ctx.fillRect(chimneyX - 2, chimneyY - chimneyHeight - 3, chimneyWidth + 4, 2);
        
        // Chimney interior opening
        const openingWidth = chimneyWidth * 0.6;
        const openingDepth = 4;
        ctx.fillStyle = '#000000';
        ctx.fillRect(
            chimneyX + (chimneyWidth - openingWidth)/2, 
            chimneyY - chimneyHeight - capHeight, 
            openingWidth, 
            openingDepth
        );
        
        // 3D CORNER INTEGRATION - make it look like one structure
        ctx.fillStyle = '#5D5D5D';
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        
        // Corner edge where chimney meets building
        ctx.beginPath();
        ctx.moveTo(chimneyX, chimneyY - chimneyHeight);
        ctx.lineTo(chimneyX - 6, chimneyY - chimneyHeight + 6);
        ctx.lineTo(chimneyX - 6, chimneyY + 6);
        ctx.lineTo(chimneyX, chimneyY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Corner reinforcement details
        const cornerDetails = [
            { y: chimneyY - chimneyHeight * 0.8, size: 4 },
            { y: chimneyY - chimneyHeight * 0.6, size: 5 },
            { y: chimneyY - chimneyHeight * 0.4, size: 3 },
            { y: chimneyY - chimneyHeight * 0.2, size: 4 }
        ];
        
        cornerDetails.forEach(detail => {
            ctx.fillStyle = '#808080';
            ctx.fillRect(chimneyX - detail.size, detail.y, detail.size, detail.size);
            ctx.strokeRect(chimneyX - detail.size, detail.y, detail.size, detail.size);
        });
    }
    
    renderRoof(ctx, buildingWidth, buildingHeight, wallHeight) {
        // Simple slanted roof
        ctx.fillStyle = '#8B4513';
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(this.x - buildingWidth/2 - 5, this.y - wallHeight);
        ctx.lineTo(this.x, this.y - wallHeight - buildingHeight * 0.2);
        ctx.lineTo(this.x + buildingWidth/2 + 5, this.y - wallHeight);
        ctx.lineTo(this.x + buildingWidth/2, this.y - wallHeight + 3);
        ctx.lineTo(this.x - buildingWidth/2, this.y - wallHeight + 3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Roof tiles
        ctx.strokeStyle = '#5D4E37';
        ctx.lineWidth = 1;
        for (let i = 1; i < 4; i++) {
            const tileY = this.y - wallHeight + (3 * i / 4);
            const tileWidth = buildingWidth * (1 - i / 8);
            ctx.beginPath();
            ctx.moveTo(this.x - tileWidth/2, tileY);
            ctx.lineTo(this.x + tileWidth/2, tileY);
            ctx.stroke();
        }
    }
    
    renderForgeInterior(ctx, size) {
        // Coal pile visible in opening
        const openingX = this.x - 15;
        const openingY = this.y + 5;
        
        // Coal pieces
        ctx.fillStyle = '#1C1C1C';
        for (let i = 0; i < 6; i++) {
            const coalX = openingX - 8 + (i % 3) * 6;
            const coalY = openingY - 3 + Math.floor(i / 3) * 4;
            ctx.beginPath();
            ctx.arc(coalX, coalY, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Fire above coal
        const fireColors = [
            `rgba(255, 0, 0, ${this.fireIntensity * 0.7})`,
            `rgba(255, 100, 0, ${this.fireIntensity * 0.8})`,
            `rgba(255, 200, 0, ${this.fireIntensity * 0.6})`
        ];
        
        fireColors.forEach((color, index) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.ellipse(
                openingX - 3 + index * 2,
                openingY - 8 - index * 2,
                4 - index,
                8 - index * 2,
                0, 0, Math.PI * 2
            );
            ctx.fill();
        });
        
        // Anvil inside (partially visible)
        ctx.fillStyle = '#2F2F2F';
        ctx.fillRect(openingX + 10, openingY - 2, 8, 4);
        
        // Hammer on anvil
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(openingX + 12, openingY - 6, 2, 6);
        ctx.fillStyle = '#2F2F2F';
        ctx.fillRect(openingX + 12, openingY - 6, 2, 3);
    }
    
    renderParticles(ctx) {
        // Render sparks
        this.sparks.forEach(spark => {
            const alpha = (spark.life / spark.maxLife) * (spark.size / 3);
            
            switch(spark.color) {
                case 'orange':
                    ctx.fillStyle = `rgba(255, 165, 0, ${alpha})`;
                    break;
                case 'yellow':
                    ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
                    break;
                case 'red':
                    ctx.fillStyle = `rgba(255, 69, 0, ${alpha})`;
                    break;
            }
            
            ctx.beginPath();
            ctx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Spark trail
            ctx.fillStyle = `rgba(255, 100, 0, ${alpha * 0.3})`;
            ctx.beginPath();
            ctx.arc(spark.x - spark.vx * 0.01, spark.y - spark.vy * 0.01, spark.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Render smoke
        this.smokeParticles.forEach(smoke => {
            const alpha = (smoke.life / smoke.maxLife) * 0.4;
            ctx.fillStyle = `rgba(128, 128, 128, ${alpha})`;
            ctx.beginPath();
            ctx.arc(smoke.x, smoke.y, smoke.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    isPointInside(x, y, size) {
        return x >= this.x - size/2 && x <= this.x + size/2 &&
               y >= this.y - size/2 && y <= this.y + size/2;
    }
    
    onClick() {
        this.isSelected = true;
        return {
            type: 'forge_menu',
            forge: this,
            upgrades: this.getUpgradeOptions()
        };
    }
    
    getUpgradeOptions() {
        return [
            {
                id: 'towerRange',
                name: 'Extended Barrels',
                description: `Increase all tower range by ${(this.upgrades.towerRange.effect * 100).toFixed(0)}% per level`,
                level: this.upgrades.towerRange.level,
                maxLevel: this.upgrades.towerRange.maxLevel,
                cost: this.calculateUpgradeCost('towerRange'),
                icon: '🎯'
            },
            {
                id: 'poisonDamage',
                name: 'Toxic Coating',
                description: `Add ${this.upgrades.poisonDamage.effect} poison damage per level to Poison Archers`,
                level: this.upgrades.poisonDamage.level,
                maxLevel: this.upgrades.poisonDamage.maxLevel,
                cost: this.calculateUpgradeCost('poisonDamage'),
                icon: '☠️'
            },
            {
                id: 'barricadeDamage',
                name: 'Reinforced Materials',
                description: `Add ${this.upgrades.barricadeDamage.effect} damage per level to Barricade/Basic Towers`,
                level: this.upgrades.barricadeDamage.level,
                maxLevel: this.upgrades.barricadeDamage.maxLevel,
                cost: this.calculateUpgradeCost('barricadeDamage'),
                icon: '🛡️'
            },
            {
                id: 'fireArrows',
                name: 'Flame Arrows',
                description: 'Archer arrows ignite enemies, dealing burn damage over time',
                level: this.upgrades.fireArrows.level,
                maxLevel: this.upgrades.fireArrows.maxLevel,
                cost: this.calculateUpgradeCost('fireArrows'),
                icon: '🔥'
            },
            {
                id: 'explosiveRadius',
                name: 'Enhanced Gunpowder',
                description: `Increase Cannon blast radius by ${this.upgrades.explosiveRadius.effect}px per level`,
                level: this.upgrades.explosiveRadius.level,
                maxLevel: this.upgrades.explosiveRadius.maxLevel,
                cost: this.calculateUpgradeCost('explosiveRadius'),
                icon: '💥'
            }
        ];
    }
    
    calculateUpgradeCost(upgradeType) {
        const upgrade = this.upgrades[upgradeType];
        if (upgrade.level >= upgrade.maxLevel) return null;
        return Math.floor(upgrade.baseCost * Math.pow(1.5, upgrade.level));
    }
    
    purchaseUpgrade(upgradeType, gameState) {
        const upgrade = this.upgrades[upgradeType];
        const cost = this.calculateUpgradeCost(upgradeType);
        
        if (!cost || gameState.gold < cost || upgrade.level >= upgrade.maxLevel) {
            return false;
        }
        
        gameState.gold -= cost;
        upgrade.level++;
        
        // Trigger immediate effect application to all towers
        this.notifyUpgradeChanged();
        
        console.log(`TowerForge: Purchased ${upgradeType} upgrade level ${upgrade.level}`);
        return true;
    }
    
    // New method to notify that upgrades have changed
    notifyUpgradeChanged() {
        // This will be called by TowerManager to refresh all tower stats
        this.upgradesChanged = true;
    }
    
    // Method to get all current upgrade multipliers
    getUpgradeMultipliers() {
        return {
            rangeMultiplier: 1 + (this.upgrades.towerRange.level * this.upgrades.towerRange.effect),
            poisonDamageBonus: this.upgrades.poisonDamage.level * this.upgrades.poisonDamage.effect,
            barricadeDamageBonus: this.upgrades.barricadeDamage.level * this.upgrades.barricadeDamage.effect,
            fireArrowsEnabled: this.upgrades.fireArrows.level > 0,
            explosiveRadiusBonus: this.upgrades.explosiveRadius.level * this.upgrades.explosiveRadius.effect
        };
    }
    
    applyUpgrade(upgradeType, gameState) {
        const upgrade = this.upgrades[upgradeType];
        
        switch(upgradeType) {
            case 'towerRange':
                // Applied globally in towerManager
                break;
            case 'poisonDamage':
                // Applied to poison archer towers
                break;
            case 'barricadeDamage':
                // Applied to barricade towers
                break;
            case 'fireArrows':
                // Applied to archer towers
                break;
            case 'explosiveRadius':
                // Applied to cannon towers
                break;
        }
    }
    
    applyEffect(buildingManager) {
        // Base forge effect - modify the existing towerUpgrades object
        buildingManager.towerUpgrades.damage *= 1.25;
        buildingManager.towerUpgrades.range *= 1.15;
        
        // Apply forge upgrades
        if (this.upgrades.towerRange.level > 0) {
            buildingManager.towerUpgrades.range *= (1 + this.upgrades.towerRange.level * this.upgrades.towerRange.effect);
        }
    }
    
    deselect() {
        this.isSelected = false;
    }
    
    static getInfo() {
        return {
            name: 'Tower Forge',
            description: 'Upgrades all towers and provides specialized tower enhancements.',
            effect: 'Global tower boost + upgrade menu',
            size: '4x4',
            cost: 300
        };
    }
}
