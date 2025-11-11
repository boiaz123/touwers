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
                x: 15, y: 25,
                animationOffset: 0,
                hammerRaised: 0,
                workCooldown: 0,
                type: 'blacksmith'
            },
            {
                x: -20, y: 20,
                animationOffset: Math.PI,
                hammerRaised: 0,
                workCooldown: 1.5,
                type: 'helper'
            }
        ];
        
        // Forge level and tower upgrades
        this.forgeLevel = 0; // Start at level 0, built to level 1
        this.maxForgeLevel = 10;
        
        // Tower upgrade system - rebalanced for better progression
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
        
        // Generate chimney smoke - FROM TOP OF INTEGRATED CHIMNEY
        this.nextSmokeTime -= deltaTime;
        if (this.nextSmokeTime <= 0) {
            const size = 128; // Approximate building size
            const buildingWidth = size * 0.9;
            const chimneyX = this.x + buildingWidth/2 - size * 0.08; // Integrated corner position
            const chimneyTopY = this.y - size * 0.55; // Top of integrated chimney
            
            this.smokeParticles.push({
                x: chimneyX + (Math.random() - 0.5) * 10, // From chimney top opening
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
        
        // Building shadow - FIXED: Only for the actual building, not full 4x4 grid
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(this.x - buildingWidth/2 + 4, this.y - wallHeight + 4, buildingWidth, wallHeight);
        
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
        
        // Upgrade indicator
        ctx.fillStyle = this.isSelected ? '#FFA500' : '#FF8C00';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🔨⬆️', this.x, this.y + size/2 + 20);
        
        // Floating icon in bottom right of 4x4 grid
        const cellSize = size / 4; // Since size is buildingSize = cellSize * 4
        const iconSize = 20;
        const iconX = (this.gridX + 3.5) * cellSize;
        const iconY = (this.gridY + 3.5) * cellSize - 5; // Float up slightly
        
        // Shadow for floating effect
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(iconX - iconSize/2 + 2, iconY - iconSize/2 + 2, iconSize, iconSize);
        
        // Icon background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(iconX - iconSize/2, iconY - iconSize/2, iconSize, iconSize);
        
        // Border
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(iconX - iconSize/2, iconY - iconSize/2, iconSize, iconSize);
        
        // Symbol
        ctx.fillStyle = '#000';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔨', iconX, iconY);
    }

    renderFrontAreaItems(ctx, size) {
        // FIRST: Render natural ground patches
        this.renderNaturalGroundDetails(ctx, size);
        
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
                    ctx.fillRect(-3, 0, 4, 2);
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
        
        // Coal pile near forge - FIXED POSITIONS to prevent flickering
        const coalPile = { x: -40, y: 10 };
        ctx.save();
        ctx.translate(this.x + coalPile.x, this.y + coalPile.y);
        
        ctx.fillStyle = '#1C1C1C';
        // Use fixed positions instead of random to prevent flickering
        const fixedCoalPositions = [
            { x: -6, y: -2, size: 2 },
            { x: -2, y: -1, size: 2.5 },
            { x: 2, y: -2, size: 1.8 },
            { x: 6, y: 0, size: 2.2 },
            { x: -4, y: 1, size: 1.5 },
            { x: 0, y: 2, size: 2.8 },
            { x: 4, y: 1, size: 1.7 },
            { x: 1, y: -1, size: 2.3 }
        ];
        
        fixedCoalPositions.forEach(coal => {
            ctx.beginPath();
            ctx.arc(coal.x, coal.y, coal.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.restore();
    }

    renderNaturalGroundDetails(ctx, size) {
        // Natural dirt patches in front of the forge
        const dirtPatches = [
            { x: -20, y: 35, radius: 12, intensity: 0.6 },
            { x: 10, y: 40, radius: 15, intensity: 0.7 },
            { x: -5, y: 30, radius: 10, intensity: 0.5 },
            { x: 25, y: 35, radius: 8, intensity: 0.8 },
            { x: -30, y: 25, radius: 7, intensity: 0.4 },
            { x: 15, y: 25, radius: 6, intensity: 0.6 }
        ];
        
        dirtPatches.forEach(patch => {
            const dirtGradient = ctx.createRadialGradient(
                this.x + patch.x, this.y + patch.y, 0,
                this.x + patch.x, this.y + patch.y, patch.radius
            );
            dirtGradient.addColorStop(0, `rgba(139, 69, 19, ${patch.intensity})`);
            dirtGradient.addColorStop(0.6, `rgba(160, 82, 45, ${patch.intensity * 0.7})`);
            dirtGradient.addColorStop(1, `rgba(139, 69, 19, 0)`);
            
            ctx.fillStyle = dirtGradient;
            ctx.beginPath();
            ctx.arc(this.x + patch.x, this.y + patch.y, patch.radius, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Grass patches
        const grassPatches = [
            { x: -35, y: 40, radius: 10, intensity: 0.8 },
            { x: -15, y: 45, radius: 8, intensity: 0.7 },
            { x: 20, y: 45, radius: 12, intensity: 0.9 },
            { x: 35, y: 40, radius: 9, intensity: 0.6 },
            { x: 0, y: 50, radius: 7, intensity: 0.8 },
            { x: -25, y: 20, radius: 6, intensity: 0.5 }
        ];
        
        grassPatches.forEach(patch => {
            const grassGradient = ctx.createRadialGradient(
                this.x + patch.x, this.y + patch.y, 0,
                this.x + patch.x, this.y + patch.y, patch.radius
            );
            grassGradient.addColorStop(0, `rgba(34, 139, 34, ${patch.intensity})`);
            grassGradient.addColorStop(0.6, `rgba(107, 142, 35, ${patch.intensity * 0.8})`);
            grassGradient.addColorStop(1, `rgba(34, 139, 34, 0)`);
            
            ctx.fillStyle = grassGradient;
            ctx.beginPath();
            ctx.arc(this.x + patch.x, this.y + patch.y, patch.radius, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Scattered small rocks
        const scatteredRocks = [
            { x: -30, y: 35, size: 2 },
            { x: -10, y: 38, size: 1.5 },
            { x: 8, y: 33, size: 2.5 },
            { x: 22, y: 42, size: 1.8 },
            { x: 30, y: 30, size: 1.2 },
            { x: -18, y: 25, size: 1.6 }
        ];
        
        scatteredRocks.forEach(rock => {
            ctx.fillStyle = '#696969';
            ctx.strokeStyle = '#2F2F2F';
            ctx.lineWidth = 0.5;
            
            ctx.beginPath();
            ctx.arc(this.x + rock.x, this.y + rock.y, rock.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });
        
        // Small grass clumps
        const grassClumps = [
            { x: -12, y: 42, count: 3, spread: 2 },
            { x: 18, y: 38, count: 4, spread: 3 },
            { x: -28, y: 30, count: 2, spread: 1.5 },
            { x: 32, y: 45, count: 3, spread: 2.5 }
        ];
        
        grassClumps.forEach(clump => {
            ctx.strokeStyle = '#228B22';
            ctx.lineWidth = 1;
            
            for (let i = 0; i < clump.count; i++) {
                const angle = (i / clump.count) * Math.PI * 2;
                const distance = Math.random() * clump.spread;
                const bladeX = this.x + clump.x + Math.cos(angle) * distance;
                const bladeY = this.y + clump.y + Math.sin(angle) * distance;
                const bladeHeight = 3 + Math.random() * 2;
                
                ctx.beginPath();
                ctx.moveTo(bladeX, bladeY);
                ctx.lineTo(bladeX + (Math.random() - 0.5), bladeY - bladeHeight);
                ctx.stroke();
            }
        });
        
        // Worn footpaths in the dirt
        ctx.strokeStyle = 'rgba(101, 67, 33, 0.3)';
        ctx.lineWidth = 3;
        
        // Path from forge to coal pile
        ctx.beginPath();
        ctx.moveTo(this.x - 20, this.y + 15);
        ctx.quadraticCurveTo(this.x - 30, this.y + 12, this.x - 35, this.y + 10);
        ctx.stroke();
        
        // Path from forge to barrel area
        ctx.beginPath();
        ctx.moveTo(this.x - 15, this.y + 15);
        ctx.quadraticCurveTo(this.x - 18, this.y + 22, this.x - 22, this.y + 28);
        ctx.stroke();
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
                    ctx.fillStyle = '#2F2F2F';
                    ctx.fillRect(toolX - 2, toolY, 4, 2);
                    ctx.fillStyle = '#8B4513';
                    ctx.fillRect(toolX - 1, toolY + 2, 2, 6);
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
        
        // Main wall structure - straight walls on both sides
        ctx.fillStyle = wallGradient;
        ctx.fillRect(this.x - buildingWidth/2, this.y - wallHeight, buildingWidth, wallHeight);
        
        // Individual cobblestones
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        
        const stoneWidth = buildingWidth / 8;
        const stoneHeight = wallHeight / 6;
        
        // Draw cobblestone pattern for main wall
        for (let row = 0; row < 6; row++) {
            const offsetX = (row % 2) * stoneWidth/2; // Staggered pattern
            const rowY = this.y - wallHeight + (row * stoneHeight);
            
            for (let col = 0; col < 8; col++) { // Only 8 columns for main wall
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
        
        // STRAIGHT RIGHT SIDE WALL - no protruding bricks
        ctx.fillStyle = '#696969';
        ctx.fillRect(this.x + buildingWidth/2, this.y - wallHeight, 3, wallHeight);
        
        // Right wall top edge
        ctx.fillStyle = '#808080';
        ctx.fillRect(this.x + buildingWidth/2, this.y - wallHeight, 3, 3);
        
        // Right wall stone pattern - straight vertical line
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        for (let row = 0; row < 6; row++) {
            const rowY = this.y - wallHeight + (row * stoneHeight);
            ctx.strokeRect(this.x + buildingWidth/2, rowY, 3, stoneHeight - 1);
        }
    }
    
    renderChimney(ctx, size) {
        const buildingWidth = size * 0.9;
        const wallHeight = size * 0.5;
        
        // INTEGRATED CHIMNEY - starts from the right corner of the main building
        const chimneyWidth = size * 0.16;
        const chimneyHeight = size * 0.7;
        const chimneyX = this.x + buildingWidth/2; // Starts exactly at right wall edge
        const chimneyY = this.y; // Ground level
        
        // Chimney foundation - extends from main building foundation
        const foundationGradient = ctx.createLinearGradient(
            chimneyX, chimneyY - wallHeight,
            chimneyX + chimneyWidth, chimneyY
        );
        foundationGradient.addColorStop(0, '#A9A9A9'); // Matches main wall
        foundationGradient.addColorStop(0.5, '#808080');
        foundationGradient.addColorStop(1, '#696969');
        
        ctx.fillStyle = foundationGradient;
        ctx.fillRect(chimneyX, chimneyY - wallHeight, chimneyWidth, wallHeight);
        
        // Foundation stones that match main building exactly
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        
        const foundationStoneHeight = wallHeight / 6;
        for (let row = 0; row < 6; row++) {
            const offsetX = (row % 2) * 2; // Slight stagger to match main wall
            const rowY = chimneyY - wallHeight + (row * foundationStoneHeight);
            
            const stoneShade = 0.8 + Math.sin(row * 0.5) * 0.2;
            ctx.fillStyle = `rgb(${Math.floor(169 * stoneShade)}, ${Math.floor(169 * stoneShade)}, ${Math.floor(169 * stoneShade)})`;
            
            ctx.fillRect(chimneyX + offsetX, rowY, chimneyWidth - offsetX, foundationStoneHeight - 1);
            ctx.strokeRect(chimneyX + offsetX, rowY, chimneyWidth - offsetX, foundationStoneHeight - 1);
            
            // Stone highlight
            ctx.fillStyle = `rgba(200, 200, 200, ${0.3 * stoneShade})`;
            ctx.fillRect(chimneyX + offsetX, rowY, (chimneyWidth - offsetX)/3, foundationStoneHeight/3);
        }
        
        // Foundation top edge to match main building
        ctx.fillStyle = '#DCDCDC';
        ctx.fillRect(chimneyX, chimneyY - wallHeight, chimneyWidth, 3);
        
        // Chimney shaft - rises above building
        const shaftHeight = chimneyHeight - wallHeight;
        const shaftY = chimneyY - wallHeight;
        
        // Chimney shaft gradient
        const chimneyGradient = ctx.createLinearGradient(
            chimneyX, shaftY - shaftHeight,
            chimneyX + chimneyWidth, shaftY
        );
        chimneyGradient.addColorStop(0, '#696969');
        chimneyGradient.addColorStop(0.3, '#2F2F2F');
        chimneyGradient.addColorStop(0.7, '#1C1C1C');
        chimneyGradient.addColorStop(1, '#808080');
        
        ctx.fillStyle = chimneyGradient;
        ctx.fillRect(chimneyX, shaftY - shaftHeight, chimneyWidth, shaftHeight);
        
        // Chimney shaft stones
        const shaftStoneHeight = shaftHeight / 10;
        for (let i = 0; i < 10; i++) {
            const stoneY = shaftY - shaftHeight + (i * shaftStoneHeight);
            const offsetX = (i % 2) * 2;
            
            ctx.strokeRect(chimneyX + offsetX, stoneY, chimneyWidth - offsetX, shaftStoneHeight);
            
            // Horizontal mortar lines
            ctx.strokeStyle = '#1C1C1C';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(chimneyX, stoneY + shaftStoneHeight);
            ctx.lineTo(chimneyX + chimneyWidth, stoneY + shaftStoneHeight);
            ctx.stroke();
            
            ctx.strokeStyle = '#2F2F2F';
        }
        
        // Chimney cap
        const capHeight = 6;
        const capWidth = chimneyWidth + 4;
        const capX = chimneyX - 2;
        const capY = shaftY - shaftHeight;
        
        ctx.fillStyle = '#2F2F2F';
        ctx.fillRect(capX, capY - capHeight, capWidth, capHeight);
        
        // Cap detail
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(capX, capY - capHeight, capWidth, capHeight);
        
        // Cap crown molding
        ctx.fillStyle = '#808080';
        ctx.fillRect(capX + 1, capY - capHeight + 1, capWidth - 2, 1);
        ctx.fillRect(capX + 1, capY - 2, capWidth - 2, 1);
        
        // Chimney opening
        const openingWidth = chimneyWidth * 0.7;
        const openingHeight = 4;
        ctx.fillStyle = '#000000';
        ctx.fillRect(
            chimneyX + (chimneyWidth - openingWidth)/2, 
            capY - capHeight, 
            openingWidth, 
            openingHeight
        );
        
        // Interior fire glow
        const glowIntensity = this.fireIntensity * 0.3;
        ctx.fillStyle = `rgba(255, 100, 0, ${glowIntensity})`;
        ctx.fillRect(
            chimneyX + (chimneyWidth - openingWidth)/2 + 1, 
            capY - capHeight + 1, 
            openingWidth - 2, 
            openingHeight - 1
        );
        
        // Chimney side face (3D effect)
        ctx.fillStyle = '#5D5D5D';
        ctx.beginPath();
        ctx.moveTo(chimneyX + chimneyWidth, chimneyY - wallHeight);
        ctx.lineTo(chimneyX + chimneyWidth + 3, chimneyY - wallHeight - 3);
        ctx.lineTo(chimneyX + chimneyWidth + 3, chimneyY - 3);
        ctx.lineTo(chimneyX + chimneyWidth, chimneyY);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    
    renderRoof(ctx, buildingWidth, buildingHeight, wallHeight) {
        const size = buildingWidth / 0.9; // Reverse calculate size
        
        // Main roof structure
        ctx.fillStyle = '#8B4513';
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        
        // Calculate roof points with chimney integration
        const chimneyWidth = size * 0.16;
        const roofPeakX = this.x;
        const roofPeakY = this.y - wallHeight - buildingHeight * 0.2;
        const leftRoofX = this.x - buildingWidth/2 - 5;
        const rightRoofX = this.x + buildingWidth/2; // Ends at main building edge
        
        // Main roof (no right overhang since chimney continues the structure)
        ctx.beginPath();
        ctx.moveTo(leftRoofX, this.y - wallHeight);
        ctx.lineTo(roofPeakX, roofPeakY);
        ctx.lineTo(rightRoofX, this.y - wallHeight);
        ctx.lineTo(leftRoofX, this.y - wallHeight + 3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Roof tiles
        ctx.strokeStyle = '#5D4E37';
        ctx.lineWidth = 1;
        for (let i = 1; i < 4; i++) {
            const tileY = this.y - wallHeight + (3 * i / 4);
            const tileStartX = leftRoofX + (i * 8);
            const tileEndX = rightRoofX - (i * 8);
            
            ctx.beginPath();
            ctx.moveTo(tileStartX, tileY);
            ctx.lineTo(tileEndX, tileY);
            ctx.stroke();
        }
        
        // Roof flashing where it meets chimney
        ctx.fillStyle = '#2F2F2F';
        ctx.fillRect(rightRoofX - 2, this.y - wallHeight - 3, chimneyWidth + 4, 6);
        
        ctx.strokeStyle = '#1C1C1C';
        ctx.lineWidth = 1;
        ctx.strokeRect(rightRoofX - 2, this.y - wallHeight - 3, chimneyWidth + 4, 6);
    }

    renderForgeOpening(ctx, size) {
        // Forge opening in the wall
        const openingWidth = size * 0.25;
        const openingHeight = size * 0.2;
        const openingX = this.x - openingWidth/2 - 15;
        const openingY = this.y - openingHeight/2 - 5;
        
        // Opening shadow/depth
        ctx.fillStyle = '#000000';
        ctx.fillRect(openingX, openingY, openingWidth, openingHeight);
        
        // Opening border (stone arch)
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 3;
        ctx.strokeRect(openingX - 2, openingY - 2, openingWidth + 4, openingHeight + 4);
        
        // Arch top
        ctx.fillStyle = '#808080';
        ctx.fillRect(openingX - 2, openingY - 4, openingWidth + 4, 4);
        
        // Fire glow from opening
        const fireGlow = ctx.createRadialGradient(
            openingX + openingWidth/2, openingY + openingHeight/2, 0,
            openingX + openingWidth/2, openingY + openingHeight/2, openingWidth
        );
        fireGlow.addColorStop(0, `rgba(255, 100, 0, ${this.fireIntensity * 0.8})`);
        fireGlow.addColorStop(0.6, `rgba(255, 50, 0, ${this.fireIntensity * 0.4})`);
        fireGlow.addColorStop(1, 'rgba(255, 0, 0, 0)');
        
        ctx.fillStyle = fireGlow;
        ctx.fillRect(openingX - openingWidth/2, openingY - openingHeight/2, openingWidth * 2, openingHeight * 2);
    }
    
    renderForgeInterior(ctx, size) {
        // Coal pile visible in opening
        const openingX = this.x - 15;
        const openingY = this.y + 5;
        
        // Coal pieces - fixed positions
        ctx.fillStyle = '#1C1C1C';
        const coalPositions = [
            { x: -8, y: -3, size: 2 },
            { x: -2, y: -3, size: 2 },
            { x: 4, y: -3, size: 2 },
            { x: -5, y: 1, size: 2 },
            { x: 1, y: 1, size: 2 },
            { x: 7, y: 1, size: 2 }
        ];
        
        coalPositions.forEach(coal => {
            ctx.beginPath();
            ctx.arc(openingX + coal.x, openingY + coal.y, coal.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
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
            upgrades: this.getUpgradeOptions(),
            forgeUpgrade: this.getForgeUpgradeOption()
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
    
    getForgeUpgradeOption() {
        if (this.forgeLevel >= this.maxForgeLevel) {
            return null;
        }
        
        const nextLevel = this.forgeLevel + 1;
        let description = "Upgrade the forge itself to unlock new content and improve mine income.";
        let nextUnlock = "";
        
        switch(nextLevel) {
            case 2:
                nextUnlock = "Unlocks: Poison Tower + Poison Upgrades + 2x Mine Income";
                break;
            case 3:
                nextUnlock = "Unlocks: Cannon Tower + Explosive Upgrades + 2.5x Mine Income";
                break;
            case 4:
                nextUnlock = "Unlocks: Magic Academy + Magic Tower + Fire Arrows + 3x Mine Income";
                break;
            case 5:
                nextUnlock = "Unlocks: 2nd Gold Mine + 3.2x Mine Income";
                break;
            case 8:
                nextUnlock = "Unlocks: 3rd Gold Mine + 3.8x Mine Income";
                break;
            case 10:
                nextUnlock = "Unlocks: 4th Gold Mine + 4.2x Mine Income";
                break;
            default:
                if (nextLevel < 10) {
                    const multiplier = 3.0 + (nextLevel - 4) * 0.2;
                    nextUnlock = `Unlocks: ${multiplier.toFixed(1)}x Mine Income`;
                } else {
                    nextUnlock = "Max Level Reached";
                }
                break;
        }
        
        return {
            id: 'forge_level',
            name: `Forge Level ${nextLevel}`,
            description: description,
            nextUnlock: nextUnlock,
            level: this.forgeLevel,
            maxLevel: this.maxForgeLevel,
            cost: this.calculateForgeUpgradeCost(),
            icon: '🔨'
        };
    }
    
    calculateForgeUpgradeCost() {
        if (this.forgeLevel >= this.maxForgeLevel) return null;
        // Expensive forge upgrades: 400, 800, 1600, 3200, etc.
        return 400 * Math.pow(2, this.forgeLevel - 1);
    }
    
    calculateUpgradeCost(upgradeType) {
        const upgrade = this.upgrades[upgradeType];
        if (upgrade.level >= upgrade.maxLevel) return null;
        return Math.floor(upgrade.baseCost * Math.pow(1.5, upgrade.level));
    }
    
    purchaseUpgrade(upgradeType, gameState) {
        if (upgradeType === 'forge_level') {
            return this.purchaseForgeUpgrade(gameState);
        }
        
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
    
    purchaseForgeUpgrade(gameState) {
        const cost = this.calculateForgeUpgradeCost();
        
        if (!cost || gameState.gold < cost || this.forgeLevel >= this.maxForgeLevel) {
            return false;
        }
        
        gameState.gold -= cost;
        this.forgeLevel++;
        
        console.log(`TowerForge: Upgraded forge to level ${this.forgeLevel}`);
        return true;
    }
    
    getForgeLevel() {
        return this.forgeLevel;
    }
    
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
        // Base forge effect
        buildingManager.towerUpgrades.damage *= 1.25;
        buildingManager.towerUpgrades.range *= 1.15;
        
        // Apply forge upgrades
        if (this.upgrades.towerRange.level > 0) {
            buildingManager.towerUpgrades.range *= (1 + this.upgrades.towerRange.level * this.upgrades.towerRange.effect);
        }
        
        // Apply mine income multiplier based on forge level
        const mineIncomeMultiplier = this.getMineIncomeMultiplier();
        if (buildingManager.mineIncomeMultiplier) {
            buildingManager.mineIncomeMultiplier *= mineIncomeMultiplier;
        } else {
            buildingManager.mineIncomeMultiplier = mineIncomeMultiplier;
        }
    }
    
    getMineIncomeMultiplier() {
        if (this.forgeLevel === 1) return 1.5;
        if (this.forgeLevel === 2) return 2.0;
        if (this.forgeLevel === 3) return 2.5;
        return 3.0 + (this.forgeLevel - 4) * 0.2;
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
