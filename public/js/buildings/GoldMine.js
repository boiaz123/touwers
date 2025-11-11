import { Building } from './Building.js';

export class GoldMine extends Building {
    constructor(x, y, gridX, gridY) {
        super(x, y, gridX, gridY, 4);
        this.goldReady = false; // FIXED: Start empty, not ready
        this.productionTime = 30; // 30 seconds to produce gold
        this.currentProduction = 0;
        this.sparks = [];
        this.nextSparkTime = 0;
        this.incomeMultiplier = 1;
        
        // New: Gem mining mode
        this.gemMode = false;
        this.gemMiningUnlocked = false; // Will be set by academy
        
        // Initialize missing properties
        this.smokePuffs = [];
        this.nextSmokeTime = 0;
        this.goldPiles = [];
        this.bobAnimations = [];
        this.isReady = false; // Different from goldReady - used for rendering logic
        this.currentProgress = 0;
        this.miningInterval = this.productionTime; // For compatibility with existing render code
        
        this.workers = [
            { x: -15, y: 15, animationOffset: 0, type: 'miner' },
            { x: 20, y: 10, animationOffset: Math.PI, type: 'cart' }
        ];
        this.mineshaft = {
            x: 0, y: -10,
            depth: 0,
            carts: []
        };
        
        // Mine cart animation - halved speed
        this.cartPosition = 0;
        this.cartDirection = 1;
        this.cartSpeed = 0.15; // Reduced from 0.3 to 0.15
        
        // Natural environment elements within the mine area
        this.trees = [];
        this.environmentRocks = [];
        this.bushes = [];
        
        // Generate dense pine forest - but avoid bottom right corner and track area
        const treePositions = [
            // Back row - taller trees (very dense)
            { x: -55, y: -45, height: 'tall' },
            { x: -45, y: -50, height: 'tall' },
            { x: -35, y: -47, height: 'medium' },
            { x: -25, y: -52, height: 'tall' },
            { x: -15, y: -48, height: 'medium' },
            { x: -5, y: -51, height: 'tall' },
            { x: 5, y: -49, height: 'medium' },
            { x: 15, y: -53, height: 'tall' },
            { x: 25, y: -46, height: 'medium' },
            { x: 35, y: -50, height: 'tall' },
            { x: 45, y: -48, height: 'medium' },
            { x: 55, y: -45, height: 'tall' },
            
            // Second back row
            { x: -50, y: -25, height: 'medium' },
            { x: -40, y: -28, height: 'small' },
            { x: -30, y: -22, height: 'medium' },
            { x: -20, y: -26, height: 'small' },
            { x: -10, y: -24, height: 'medium' },
            { x: 0, y: -20, height: 'small' },
            { x: 10, y: -23, height: 'medium' },
            { x: 20, y: -27, height: 'small' },
            { x: 30, y: -21, height: 'medium' },
            { x: 40, y: -25, height: 'small' },
            { x: 50, y: -23, height: 'medium' },
            
            // Side dense coverage (left side only to avoid clearing)
            { x: -58, y: -15, height: 'medium' },
            { x: -60, y: 0, height: 'small' },
            { x: -57, y: 15, height: 'medium' },
            { x: -55, y: 30, height: 'small' },
            
            // Front left area only (avoid bottom right clearing)
            { x: -45, y: 35, height: 'small' },
            { x: -35, y: 38, height: 'small' },
            { x: -25, y: 32, height: 'small' },
            { x: -15, y: 36, height: 'small' },
            
            // Fill in gaps on left side only
            { x: -42, y: -35, height: 'small' },
            { x: -32, y: -38, height: 'small' },
            { x: -22, y: -35, height: 'small' },
            { x: -12, y: -38, height: 'small' },
            { x: -2, y: -35, height: 'small' },
            { x: 8, y: -38, height: 'small' },
            { x: 18, y: -35, height: 'small' }
            // Removed trees from bottom right: 28, 35, 38, 42, 45, 55-60 on right side
        ];
        
        // Use fixed seed for consistent tree generation
        let seedCounter = 12345; // Fixed seed
        const seededRandom = () => {
            seedCounter = (seedCounter * 9301 + 49297) % 233280;
            return seedCounter / 233280;
        };
        
        treePositions.forEach((pos, i) => {
            let baseHeight, crownRadius, trunkWidth;
            
            // Set tree sizes based on height category
            switch (pos.height) {
                case 'tall':
                    baseHeight = 35 + (seededRandom() * 20);
                    crownRadius = 12 + (seededRandom() * 6);
                    trunkWidth = 4 + (seededRandom() * 2);
                    break;
                case 'medium':
                    baseHeight = 25 + (seededRandom() * 15);
                    crownRadius = 8 + (seededRandom() * 4);
                    trunkWidth = 3 + (seededRandom() * 1.5);
                    break;
                case 'small':
                    baseHeight = 15 + (seededRandom() * 10);
                    crownRadius = 6 + (seededRandom() * 3);
                    trunkWidth = 2 + (seededRandom() * 1);
                    break;
            }
            
            this.trees.push({
                x: pos.x,
                y: pos.y,
                height: baseHeight,
                trunkWidth: trunkWidth,
                crownRadius: crownRadius,
                type: 1, // All coniferous (pine) trees
                leafDensity: 0.8 + (seededRandom() * 0.2),
                heightCategory: pos.height,
                // Fixed layers for Christmas tree shape
                layers: pos.height === 'tall' ? 5 : (pos.height === 'medium' ? 4 : 3)
            });
        });
        
        // Generate rocks with fixed positions to prevent movement
        const rockPositions = [
            { x: -20, y: -20, large: true },
            { x: 30, y: -10, large: true },
            { x: -40, y: 20, large: false },
            { x: 15, y: 25, large: false },
            { x: -10, y: 40, large: false },
            { x: 35, y: -35, large: false }
        ];
        
        rockPositions.forEach((pos, i) => {
            const isLargeRock = pos.large;
            this.environmentRocks.push({
                x: pos.x,
                y: pos.y,
                size: isLargeRock ? 10 + (seededRandom() * 8) : 4 + (seededRandom() * 4),
                type: isLargeRock ? 2 : Math.floor(seededRandom() * 2),
                rotation: seededRandom() * Math.PI * 2,
                color: seededRandom() < 0.5 ? '#8B7355' : '#A0522D',
                layers: isLargeRock ? 2 + Math.floor(seededRandom() * 2) : 1
            });
        });
        
        // Generate fewer bushes with fixed positions
        const bushPositions = [
            { x: -30, y: 30 },
            { x: 20, y: 35 },
            { x: -15, y: -15 }
        ];
        
        bushPositions.forEach((pos, i) => {
            this.bushes.push({
                x: pos.x,
                y: pos.y,
                radius: 6 + (seededRandom() * 6),
                segments: 4 + Math.floor(seededRandom() * 3),
                color: seededRandom() < 0.3 ? '#228B22' : '#2E8B57',
                // Fixed segment positions to prevent movement
                segmentPositions: this.generateFixedBushSegments(6 + (seededRandom() * 6), 4 + Math.floor(seededRandom() * 3), seededRandom)
            });
        });
        
        // Initialize workers with repositioned positions (moved to left)
        for (let i = 0; i < 2; i++) {
            this.workers.push({
                x: i === 0 ? -5 : 5, // Moved further left from cave entrance
                y: i === 0 ? 10 : 15,
                animationOffset: i * Math.PI,
                pickaxeRaised: 0,
                miningCooldown: i * 1.5,
                direction: i === 0 ? -1 : 1
            });
        }
        
        // Generate excavated ground debris and rocks
        this.excavatedDebris = [];
        this.dirtMounds = [];
        
        // Create excavated area with scattered rocks and dirt
        const debrisPositions = [
            // Large rock piles from excavation
            { x: -25, y: -15, type: 'rockPile', size: 'large' },
            { x: 20, y: -10, type: 'rockPile', size: 'large' },
            { x: -35, y: 25, type: 'rockPile', size: 'medium' },
            { x: 30, y: 30, type: 'rockPile', size: 'medium' },
            { x: -10, y: 35, type: 'rockPile', size: 'small' },
            { x: 15, y: -25, type: 'rockPile', size: 'small' },
            
            // Dirt mounds from digging
            { x: -40, y: 15, type: 'dirtMound', size: 'large' },
            { x: 25, y: 20, type: 'dirtMound', size: 'medium' },
            { x: -15, y: 25, type: 'dirtMound', size: 'small' },
            { x: 35, y: -5, type: 'dirtMound', size: 'medium' },
            { x: -5, y: -20, type: 'dirtMound', size: 'small' },
            
            // Scattered individual rocks
            { x: -30, y: 5, type: 'scatteredRock', size: 'small' },
            { x: 10, y: 15, type: 'scatteredRock', size: 'small' },
            { x: -20, y: 30, type: 'scatteredRock', size: 'small' },
            { x: 40, y: 10, type: 'scatteredRock', size: 'small' },
            { x: 0, y: 25, type: 'scatteredRock', size: 'small' },
            { x: -45, y: 0, type: 'scatteredRock', size: 'small' },
            { x: 45, y: 5, type: 'scatteredRock', size: 'small' },
            { x: -8, y: 10, type: 'scatteredRock', size: 'small' },
            { x: 22, y: 35, type: 'scatteredRock', size: 'small' }
        ];
        
        debrisPositions.forEach((pos, i) => {
            let baseSize;
            switch (pos.size) {
                case 'large': baseSize = 12 + (seededRandom() * 6); break;
                case 'medium': baseSize = 8 + (seededRandom() * 4); break;
                case 'small': baseSize = 4 + (seededRandom() * 3); break;
            }
            
            this.excavatedDebris.push({
                x: pos.x,
                y: pos.y,
                type: pos.type,
                size: baseSize,
                rotation: seededRandom() * Math.PI * 2,
                color: seededRandom() < 0.5 ? '#8B7355' : '#A0522D',
                layers: pos.type === 'rockPile' && pos.size !== 'small' ? 2 + Math.floor(seededRandom() * 2) : 1
            });
        });
        
        // Add flash opacity for one-time flash effect
        this.flashOpacity = 0;
    }
    
    generateFixedBushSegments(radius, segments, randomFunc) {
        const positions = [];
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const distance = radius * (0.4 + randomFunc() * 0.2); // Reduced randomness
            positions.push({
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance,
                radius: radius * (0.25 + randomFunc() * 0.1) // Reduced randomness
            });
        }
        return positions;
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        // Only produce if not ready
        if (!this.goldReady) {
            this.currentProduction += deltaTime;
            
            if (this.currentProduction >= this.productionTime) {
                this.goldReady = true;
                this.currentProduction = 0;
                this.flashOpacity = 1; // Trigger one-time flash
                console.log(`GoldMine: ${this.gemMode ? 'Gem' : 'Gold'} production completed, ready to collect`);
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
            if (worker.miningCooldown <= 0 && !this.goldReady) { // Use goldReady instead of isReady
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
        if (this.nextSmokeTime <= 0 && !this.goldReady) { // Use goldReady instead of isReady
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
        if (this.goldReady) { // Use goldReady instead of isReady
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
        
        // Update flash opacity (fade out quickly over 0.1 seconds for one-time flash)
        this.flashOpacity = Math.max(0, this.flashOpacity - deltaTime * 5);
    }
    
    collectGold() {
        // Only allow collection if ready
        if (!this.goldReady) {
            console.log(`GoldMine: ${this.gemMode ? 'Gem' : 'Gold'} not ready yet. ${(this.productionTime - this.currentProduction).toFixed(1)}s remaining`);
            return 0;
        }
        
        // Reset production cycle
        this.goldReady = false;
        this.currentProduction = 0;
        
        // New: If in gem mode, produce a random gem instead of gold
        if (this.gemMode) {
            const gemTypes = ['fire', 'water', 'air', 'earth'];
            const randomGem = gemTypes[Math.floor(Math.random() * gemTypes.length)];
            
            // Assume academy reference is available (set by game state)
            if (this.academy) {
                this.academy.addGem(randomGem);
                console.log(`GoldMine: Collected 1 ${randomGem} gem`);
            }
            return 0; // No gold collected
        } else {
            // Original gold collection logic
            const income = Math.floor(this.getBaseIncome() * (this.incomeMultiplier || 1));
            
            // Create collection sparks
            this.sparks = [];
            for (let i = 0; i < 8; i++) {
                this.sparks.push({
                    x: this.x + (Math.random() - 0.5) * 30,
                    y: this.y + (Math.random() - 0.5) * 30,
                    vx: (Math.random() - 0.5) * 100,
                    vy: -Math.random() * 80 - 40,
                    life: 1.5,
                    maxLife: 1.5,
                    size: Math.random() * 3 + 2,
                    color: Math.random() > 0.5 ? 'gold' : 'yellow'
                });
            }
            
            console.log(`GoldMine: Collected ${income} gold (base: ${this.getBaseIncome()}, multiplier: ${this.incomeMultiplier || 1})`);
            return income;
        }
    }
    
    // New: Method to toggle gem mode
    toggleGemMode() {
        if (this.gemMiningUnlocked) {
            this.gemMode = !this.gemMode;
            console.log(`GoldMine: Gem mode ${this.gemMode ? 'enabled' : 'disabled'}`);
        }
    }
    
    // New: Set academy reference and check if gem mining is unlocked
    setAcademy(academy) {
        this.academy = academy;
        this.gemMiningUnlocked = academy && academy.gemMiningResearched;
    }
    
    render(ctx, size) {
        // Render excavated ground base first
        this.renderExcavatedGround(ctx, size);
        
        // Render trees (now much denser forest)
        this.trees.forEach(tree => {
            ctx.save();
            ctx.translate(this.x + tree.x, this.y + tree.y);
            
            // Tree shadow (fixed position)
            ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            ctx.beginPath();
            ctx.ellipse(3, tree.height * 0.1, tree.crownRadius * 0.8, tree.crownRadius * 0.3, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Tree trunk - more realistic brown colors
            const trunkGradient = ctx.createLinearGradient(-tree.trunkWidth/2, 0, tree.trunkWidth/2, 0);
            trunkGradient.addColorStop(0, '#4A4A4A'); // Dark bark
            trunkGradient.addColorStop(0.3, '#654321'); // Brown bark
            trunkGradient.addColorStop(0.7, '#8B4513'); // Lighter brown
            trunkGradient.addColorStop(1, '#5D4E37'); // Dark brown edge
            
            ctx.fillStyle = trunkGradient;
            ctx.fillRect(-tree.trunkWidth/2, 0, tree.trunkWidth, -tree.height * 0.3);
            
            // Trunk texture (fixed bark lines)
            ctx.strokeStyle = '#3A3A3A';
            ctx.lineWidth = 1;
            const barkLines = tree.heightCategory === 'tall' ? 4 : (tree.heightCategory === 'medium' ? 3 : 2);
            for (let i = 1; i <= barkLines; i++) {
                const lineY = -(tree.height * 0.3) * (i / barkLines);
                ctx.beginPath();
                ctx.moveTo(-tree.trunkWidth/2, lineY);
                ctx.lineTo(tree.trunkWidth/2, lineY);
                ctx.stroke();
            }
            
            // Christmas tree layered crown - proper coniferous shape
            const layerCount = tree.layers;
            const layerHeight = (tree.height * 0.8) / layerCount;
            
            for (let layer = 0; layer < layerCount; layer++) {
                const layerTop = -tree.height + (layer * layerHeight * 0.7); // Overlap layers
                const layerBottom = layerTop + layerHeight;
                
                // Each layer gets progressively larger towards bottom
                const layerRadius = tree.crownRadius * (0.4 + (layer / (layerCount - 1)) * 0.6);
                
                // Layer color - darker at bottom, lighter at top
                const layerLightness = 1 - (layer * 0.1);
                const greenBase = Math.floor(27 * layerLightness); // Dark forest green base
                const greenSecondary = Math.floor(67 * layerLightness); // Forest green
                ctx.fillStyle = `rgb(${greenBase}, ${greenSecondary}, ${greenBase + 10})`;
                
                // Draw triangular layer with slight curve
                ctx.beginPath();
                
                if (layer === 0) {
                    // Top layer - pointed
                    ctx.moveTo(0, layerTop);
                    ctx.lineTo(-layerRadius * 0.9, layerBottom);
                    ctx.lineTo(layerRadius * 0.9, layerBottom);
                } else {
                    // Lower layers - fuller
                    ctx.moveTo(0, layerTop + layerHeight * 0.2); // Start slightly down for overlap
                    ctx.lineTo(-layerRadius, layerBottom);
                    ctx.lineTo(layerRadius, layerBottom);
                }
                
                ctx.closePath();
                ctx.fill();
                
                // Add subtle layer outline for definition
                ctx.strokeStyle = `rgb(${Math.floor(greenBase * 0.7)}, ${Math.floor(greenSecondary * 0.7)}, ${Math.floor((greenBase + 10) * 0.7)})`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
                
                // Add needle texture to each layer
                ctx.strokeStyle = `rgb(${Math.floor(greenBase * 0.6)}, ${Math.floor(greenSecondary * 0.6)}, ${Math.floor((greenBase + 10) * 0.6)})`;
                ctx.lineWidth = 0.5;
                
                // Horizontal needle lines
                const needleLines = Math.floor(layerRadius / 4);
                for (let n = 1; n <= needleLines; n++) {
                    const needleY = layerTop + (layerHeight * n / (needleLines + 1));
                    const needleWidth = layerRadius * (1 - n / (needleLines + 2));
                    
                    ctx.beginPath();
                    ctx.moveTo(-needleWidth, needleY);
                    ctx.lineTo(needleWidth, needleY);
                    ctx.stroke();
                }
            }
            
            // Add snow highlights for winter forest look
            if (tree.heightCategory !== 'small') {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                for (let layer = 0; layer < layerCount; layer++) {
                    const snowY = -tree.height + (layer * layerHeight * 0.7) + layerHeight;
                    const snowWidth = tree.crownRadius * (0.4 + (layer / (layerCount - 1)) * 0.6) * 0.8;
                    
                    ctx.beginPath();
                    ctx.ellipse(0, snowY, snowWidth, snowWidth * 0.2, 0, 0, Math.PI);
                    ctx.fill();
                }
            }
            
            // Pine tree highlights for depth
            ctx.fillStyle = 'rgba(60, 120, 60, 0.4)';
            for (let layer = 0; layer < Math.min(3, layerCount); layer++) {
                const highlightY = -tree.height + (layer * layerHeight * 0.7) + layerHeight * 0.3;
                const highlightX = (layer % 2 === 0 ? -1 : 1) * tree.crownRadius * 0.4;
                
                ctx.beginPath();
                ctx.arc(highlightX, highlightY, tree.crownRadius * 0.08, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        });
        
        // Render excavated debris and rock piles
        this.excavatedDebris.forEach(debris => {
            ctx.save();
            ctx.translate(this.x + debris.x, this.y + debris.y);
            ctx.rotate(debris.rotation);
            
            // Debris shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.ellipse(2, 2, debris.size * 0.9, debris.size * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();
            
            switch (debris.type) {
                case 'rockPile':
                    // Pile of rocks from excavation
                    if (debris.layers > 1) {
                        for (let layer = 0; layer < debris.layers; layer++) {
                            const layerSize = debris.size * (1 - layer * 0.1);
                            const layerY = -layer * debris.size * 0.3;
                            const layerColor = layer === 0 ? debris.color : this.darkenColor(debris.color, 0.15 * layer);
                            
                            ctx.fillStyle = layerColor;
                            ctx.strokeStyle = '#654321';
                            ctx.lineWidth = 1;
                            
                            // Irregular rock pile shape
                            for (let rock = 0; rock < 3 + layer; rock++) {
                                const rockAngle = (rock / (3 + layer)) * Math.PI * 2;
                                const rockDist = layerSize * (0.6 + (rock % 2) * 0.3);
                                const rockX = Math.cos(rockAngle) * rockDist;
                                const rockY = Math.sin(rockAngle) * rockDist * 0.7 + layerY;
                                const rockSize = layerSize * (0.3 + (rock % 3) * 0.1);
                                
                                ctx.beginPath();
                                ctx.ellipse(rockX, rockY, rockSize, rockSize * 0.8, 0, 0, Math.PI * 2);
                                ctx.fill();
                                ctx.stroke();
                            }
                        }
                    } else {
                        // Single rock
                        ctx.fillStyle = debris.color;
                        ctx.strokeStyle = '#654321';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.ellipse(0, 0, debris.size, debris.size * 0.8, 0, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.stroke();
                    }
                    break;
                    
                case 'dirtMound':
                    // Mounds of excavated dirt
                    const dirtGradient = ctx.createRadialGradient(0, -debris.size * 0.3, 0, 0, 0, debris.size);
                    dirtGradient.addColorStop(0, '#D2B48C');
                    dirtGradient.addColorStop(0.6, '#CD853F');
                    dirtGradient.addColorStop(1, '#8B7355');
                    
                    ctx.fillStyle = dirtGradient;
                    ctx.beginPath();
                    ctx.ellipse(0, 0, debris.size, debris.size * 0.6, 0, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Dirt texture
                    ctx.strokeStyle = '#A0522D';
                    ctx.lineWidth = 1;
                    for (let i = 0; i < 3; i++) {
                        const lineAngle = (i / 3) * Math.PI * 2;
                        const lineStart = debris.size * 0.3;
                        const lineEnd = debris.size * 0.8;
                        ctx.beginPath();
                        ctx.moveTo(Math.cos(lineAngle) * lineStart, Math.sin(lineAngle) * lineStart);
                        ctx.lineTo(Math.cos(lineAngle) * lineEnd, Math.sin(lineAngle) * lineEnd * 0.6);
                        ctx.stroke();
                    }
                    break;
                    
                case 'scatteredRock':
                    // Individual scattered rocks
                    ctx.fillStyle = debris.color;
                    ctx.strokeStyle = '#654321';
                    ctx.lineWidth = 1;
                    
                    // Irregular rock shape
                    ctx.beginPath();
                    const points = 5 + Math.floor(debris.size / 3);
                    for (let i = 0; i < points; i++) {
                        const angle = (i / points) * Math.PI * 2;
                        const radius = debris.size * (0.7 + (i % 2) * 0.3);
                        const x = Math.cos(angle) * radius;
                        const y = Math.sin(angle) * radius * 0.8;
                        if (i === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    }
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                    break;
            }
            
            // Highlight for 3D effect
            ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
            ctx.beginPath();
            ctx.arc(-debris.size * 0.3, -debris.size * 0.3, debris.size * 0.15, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
        
        // Render bushes with fixed segment positions
        this.bushes.forEach(bush => {
            ctx.save();
            ctx.translate(this.x + bush.x, this.y + bush.y);
            
            // Bush shadow (fixed)
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.beginPath();
            ctx.ellipse(1, 1, bush.radius * 0.8, bush.radius * 0.2, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Main bush shape using fixed segment positions
            ctx.fillStyle = bush.color;
            bush.segmentPositions.forEach(segment => {
                ctx.beginPath();
                ctx.arc(segment.x, segment.y, segment.radius, 0, Math.PI * 2);
                ctx.fill();
            });
            
            // Fixed bush highlights
            ctx.fillStyle = 'rgba(144, 238, 144, 0.5)';
            const highlights = [
                {x: -bush.radius * 0.2, y: -bush.radius * 0.3},
                {x: bush.radius * 0.3, y: bush.radius * 0.2}
            ];
            highlights.forEach(highlight => {
                ctx.beginPath();
                ctx.arc(highlight.x, highlight.y, bush.radius * 0.1, 0, Math.PI * 2);
                ctx.fill();
            });
            
            ctx.restore();
        });
        
        // Render simplified cave entrance integrated into excavated ground
        this.renderCaveEntrance(ctx, size);
        
        // Render workers (updated position and blue shirts)
        this.workers.forEach(worker => {
            ctx.save();
            ctx.translate(this.x + worker.x, this.y + worker.y);
            
            // Worker body - blue shirt (different from water blue)
            ctx.fillStyle = '#1E3A8A'; // Dark blue, distinct from water colors
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
        if (this.goldReady) { // Use goldReady instead of isReady
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
        const progressRatio = this.currentProduction / this.productionTime;
        const barY = this.y + size/2 + 5;
        
        // NEW: Render toggle icon to the left of progress bar if unlocked
        if (this.gemMiningUnlocked) {
            const toggleSize = 20;
            const toggleX = this.x - barWidth/2 - toggleSize - 5; // Left of progress bar
            const toggleY = barY + barHeight/2; // Aligned with progress bar center
            
            // Store toggle position for click detection
            this.toggleIcon = { x: toggleX, y: toggleY, size: toggleSize };
            
            // Toggle background with mode-specific colors
            ctx.fillStyle = this.gemMode ? 'rgba(138, 43, 226, 0.9)' : 'rgba(255, 215, 0, 0.8)';
            ctx.fillRect(toggleX - toggleSize/2, toggleY - toggleSize/2, toggleSize, toggleSize);
            
            // Toggle border
            ctx.strokeStyle = this.gemMode ? '#4B0082' : '#B8860B';
            ctx.lineWidth = 2;
            ctx.strokeRect(toggleX - toggleSize/2, toggleY - toggleSize/2, toggleSize, toggleSize);
            
            // Toggle icon and mode indicator
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.gemMode ? '💎' : '⛏️', toggleX, toggleY - 1);
            
            // Small mode label below
            ctx.fillStyle = '#000';
            ctx.font = 'bold 7px Arial';
            ctx.fillText(this.gemMode ? 'GEM' : 'GOLD', toggleX, toggleY + toggleSize/2 + 8);
        }
        
        // Progress bar background
        ctx.fillStyle = 'rgba(101, 67, 33, 0.8)';
        ctx.fillRect(this.x - barWidth/2, barY, barWidth, barHeight);
        
        // Progress bar fill
        if (this.goldReady) {
            ctx.fillStyle = this.gemMode ? '#9932CC' : '#FFD700'; // Purple for gems, gold for gold
            ctx.fillRect(this.x - barWidth/2, barY, barWidth, barHeight);
        } else {
            ctx.fillStyle = this.gemMode ? '#8A2BE2' : '#D2691E'; // Different progress colors
            ctx.fillRect(this.x - barWidth/2, barY, barWidth * progressRatio, barHeight);
        }
        
        // Mine type indicator to the right of progress bar
        ctx.fillStyle = '#8B4513';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'left';
        const indicatorX = this.x + barWidth/2 + 5;
        ctx.fillText(this.gemMode ? '💎⛏️' : '⛏️💰', indicatorX, barY + barHeight/2 + 4);
        
        // Add production status indicator
        if (!this.goldReady) {
            const progress = this.currentProduction / this.productionTime;
            
            // Production timer bar
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(this.x - 25, this.y - size/2 - 15, 50, 8);
            
            ctx.fillStyle = this.gemMode ? '#9932CC' : '#4CAF50';
            ctx.fillRect(this.x - 25, this.y - size/2 - 15, 50 * progress, 8);
            
            ctx.strokeStyle = '#FFF';
            ctx.lineWidth = 1;
            ctx.strokeRect(this.x - 25, this.y - size/2 - 15, 50, 8);
            
            // Timer text
            const timeLeft = Math.ceil(this.productionTime - this.currentProduction);
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${timeLeft}s`, this.x, this.y - size/2 - 20);
        } else {
            // Ready indicator with appropriate icon
            ctx.fillStyle = this.gemMode ? '#9932CC' : '#FFD700';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.gemMode ? '💎 READY' : '💰 READY', this.x, this.y - size/2 - 10);
        }
        
        // Floating icon in bottom right of 4x4 grid
        const cellSize = size / 4; // Since size is buildingSize = cellSize * 4
        const iconSize = 35; // Increased size for better visibility
        const iconX = (this.gridX + 3.5) * cellSize;
        const iconY = (this.gridY + 3.5) * cellSize - 5; // Float up slightly
        
        // Render floating icon only when gold is ready
        if (this.goldReady) {
            // Dynamic pulse for medieval glow effect
            const pulseIntensity = 0.7 + 0.3 * Math.sin(this.animationTime * 4);
            
            // Enhanced shadow for floating effect with medieval depth
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(iconX - iconSize/2 + 3, iconY - iconSize/2 + 3, iconSize, iconSize);
            
            // Parchment-like background with medieval gradient
            const parchmentGradient = ctx.createRadialGradient(
                iconX - iconSize/4, iconY - iconSize/4, 0,
                iconX, iconY, iconSize
            );
            parchmentGradient.addColorStop(0, `rgba(255, 248, 220, ${pulseIntensity})`); // Cream parchment
            parchmentGradient.addColorStop(0.7, `rgba(245, 222, 179, ${pulseIntensity * 0.9})`); // Antique parchment
            parchmentGradient.addColorStop(1, `rgba(222, 184, 135, ${pulseIntensity * 0.8})`); // Aged parchment
            
            ctx.fillStyle = parchmentGradient;
            ctx.fillRect(iconX - iconSize/2, iconY - iconSize/2, iconSize, iconSize);
            
            // Ornate gold border with medieval styling
            ctx.strokeStyle = `rgba(184, 134, 11, ${pulseIntensity})`; // Dark goldenrod
            ctx.lineWidth = 2;
            ctx.strokeRect(iconX - iconSize/2, iconY - iconSize/2, iconSize, iconSize);
            
            // Inner gold accent border
            ctx.strokeStyle = `rgba(255, 215, 0, ${pulseIntensity * 0.8})`; // Gold
            ctx.lineWidth = 1;
            ctx.strokeRect(iconX - iconSize/2 + 2, iconY - iconSize/2 + 2, iconSize - 4, iconSize - 4);
            
            // Subtle medieval glow effect
            const glowGradient = ctx.createRadialGradient(iconX, iconY, 0, iconX, iconY, iconSize * 1.5);
            glowGradient.addColorStop(0, `rgba(255, 215, 0, ${pulseIntensity * 0.2})`);
            glowGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
            ctx.fillStyle = glowGradient;
            ctx.fillRect(iconX - iconSize/2 - 5, iconY - iconSize/2 - 5, iconSize + 10, iconSize + 10);
            
            // Symbol with enhanced medieval styling
            ctx.fillStyle = `rgba(101, 67, 33, ${pulseIntensity})`; // Dark brown for medieval text
            ctx.font = 'bold 18px serif'; // Serif font for medieval feel
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('💰', iconX, iconY);
            
            // Add subtle gold highlight on symbol
            ctx.fillStyle = `rgba(255, 215, 0, ${pulseIntensity * 0.3})`;
            ctx.fillText('💰', iconX, iconY);
        }
        
        // Add one-time flash effect when gold becomes ready (fades out quickly)
        if (this.flashOpacity > 0) {
            const flashGradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, size * 1.5);
            flashGradient.addColorStop(0, `rgba(255, 215, 0, ${this.flashOpacity * 0.6})`);
            flashGradient.addColorStop(0.5, `rgba(255, 215, 0, ${this.flashOpacity * 0.3})`);
            flashGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
            ctx.fillStyle = flashGradient;
            ctx.fillRect(this.x - size * 1.5, this.y - size * 1.5, size * 3, size * 3);
        }
        
        // New: Render toggle icon at the top if gem mining is unlocked
        if (this.gemMiningUnlocked) {
            const toggleIconSize = 25;
            const toggleX = this.x;
            const toggleY = this.y - size/2 - 15;
            
            // Toggle background
            ctx.fillStyle = this.gemMode ? 'rgba(138, 43, 226, 0.8)' : 'rgba(169, 169, 169, 0.8)';
            ctx.fillRect(toggleX - toggleIconSize/2, toggleY - toggleIconSize/2, toggleIconSize, toggleIconSize);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.strokeRect(toggleX - toggleIconSize/2, toggleY - toggleIconSize/2, toggleIconSize, toggleIconSize);
            
            // Toggle icon
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.gemMode ? '💎' : '⛏️', toggleX, toggleY);
            
            // Label
            ctx.fillStyle = '#000';
            ctx.font = 'bold 8px Arial';
            ctx.fillText(this.gemMode ? 'GEM' : 'GOLD', toggleX, toggleY + toggleIconSize/2 + 5);
        }
    }
    
    isPointInside(x, y, size) {
        // Check toggle icon area if unlocked
        if (this.gemMiningUnlocked && this.toggleIcon) {
            const dx = x - this.toggleIcon.x;
            const dy = y - this.toggleIcon.y;
            if (Math.abs(dx) <= this.toggleIcon.size/2 && Math.abs(dy) <= this.toggleIcon.size/2) {
                return 'toggle'; // Return special identifier for toggle
            }
        }
        
        // Check building area for collection
        const dx = x - this.x;
        const dy = y - this.y;
        if (Math.abs(dx) <= size/2 && Math.abs(dy) <= size/2) {
            return 'collect';
        }
        
        return false;
    }
    
    onClick(clickX, clickY, size) {
        const clickType = this.isPointInside(clickX, clickY, size);
        
        if (clickType === 'toggle' && this.gemMiningUnlocked) {
            // Toggle gem mode
            this.toggleGemMode();
            return { type: 'mine_toggle' };
        } else if (clickType === 'collect') {
            // Collect gold/gems
            return this.collectGold();
        }
        
        return 0;
    }
    
    getBaseIncome() {
        // Base income adjusted by forge level via building manager
        return 15; // This will be multiplied by forge bonus in BuildingManager
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
    
    applyEffect(towerManager) {
        // No passive gold generation anymore
    }
    
    static getInfo() {
        return {
            name: 'Gold Mine',
            description: 'Produces gold every 30 seconds. Click to collect. Income scales with forge level.',
            effect: 'Generates gold on timer',
            size: '4x4',
            cost: 200
        };
    }
    
    renderExcavatedGround(ctx, size) {
        // Render natural forest floor that blends excavated and grassy areas
        const maxArea = size * 0.45; // Keep within the 4x4 grid boundaries
        
        // Base forest floor - natural green-brown blend
        const baseGradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, maxArea * 1.2
        );
        baseGradient.addColorStop(0, '#A0522D'); // Brown center (excavated)
        baseGradient.addColorStop(0.4, '#8B7355'); // Tan-brown
        baseGradient.addColorStop(0.7, '#6B8E23'); // Olive green
        baseGradient.addColorStop(1, '#228B22'); // Forest green edge
        
        // Fill entire area with natural blend
        ctx.fillStyle = baseGradient;
        ctx.fillRect(this.x - maxArea * 1.1, this.y - maxArea * 1.1, maxArea * 2.2, maxArea * 2.2);
        
        // Add natural grass patches that blend organically (repositioned to avoid track area)
        const grassPatches = [
            { x: -maxArea * 0.8, y: -maxArea * 0.6, radius: 15, intensity: 0.6 },
            { x: -maxArea * 0.9, y: maxArea * 0.8, radius: 18, intensity: 0.7 }, // Moved to bottom left
            { x: -maxArea * 0.7, y: maxArea * 0.9, radius: 16, intensity: 0.6 }, // Moved to bottom left
            { x: maxArea * 0.9, y: maxArea * 0.4, radius: 14, intensity: 0.5 },
            { x: -maxArea * 1.0, y: maxArea * 0.1, radius: 20, intensity: 0.9 },
            { x: -maxArea * 0.6, y: maxArea * 1.0, radius: 14, intensity: 0.8 }, // Moved to bottom left
            { x: -maxArea * 0.2, y: -maxArea * 1.0, radius: 13, intensity: 0.7 }
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
        
        // Add dirt/excavated patches in the center
        const dirtPatches = [
            { x: -maxArea * 0.3, y: -maxArea * 0.2, radius: 12, intensity: 0.7 },
            { x: maxArea * 0.1, y: -maxArea * 0.4, radius: 10, intensity: 0.6 },
            { x: -maxArea * 0.1, y: maxArea * 0.3, radius: 14, intensity: 0.8 },
            { x: maxArea * 0.4, y: maxArea * 0.1, radius: 8, intensity: 0.5 },
            { x: 0, y: 0, radius: 16, intensity: 0.9 }
        ];
        
        dirtPatches.forEach(patch => {
            const dirtGradient = ctx.createRadialGradient(
                this.x + patch.x, this.y + patch.y, 0,
                this.x + patch.x, this.y + patch.y, patch.radius
            );
            dirtGradient.addColorStop(0, `rgba(160, 82, 45, ${patch.intensity})`);
            dirtGradient.addColorStop(0.6, `rgba(139, 115, 85, ${patch.intensity * 0.8})`);
            dirtGradient.addColorStop(1, `rgba(139, 69, 19, 0)`);
            
            ctx.fillStyle = dirtGradient;
            ctx.beginPath();
            ctx.arc(this.x + patch.x, this.y + patch.y, patch.radius, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Add small water pool repositioned to bottom left corner
        const poolX = this.x - maxArea * 0.7; // Moved to left
        const poolY = this.y + maxArea * 0.8;  // Moved to bottom
        const poolRadius = 16; // Slightly smaller
        
        // Water pool shadow/depth
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(poolX + 1, poolY + 1, poolRadius, poolRadius * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Water surface
        const waterGradient = ctx.createRadialGradient(
            poolX - poolRadius * 0.3, poolY - poolRadius * 0.3, 0,
            poolX, poolY, poolRadius
        );
        waterGradient.addColorStop(0, '#87CEEB'); // Light blue
        waterGradient.addColorStop(0.4, '#4682B4'); // Steel blue
        waterGradient.addColorStop(0.8, '#2F4F4F'); // Dark slate gray
        waterGradient.addColorStop(1, '#1C1C1C'); // Very dark edge
        
        ctx.fillStyle = waterGradient;
        ctx.beginPath();
        ctx.ellipse(poolX, poolY, poolRadius, poolRadius * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Water highlights/reflections
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.ellipse(poolX - poolRadius * 0.4, poolY - poolRadius * 0.3, poolRadius * 0.3, poolRadius * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.ellipse(poolX + poolRadius * 0.2, poolY + poolRadius * 0.1, poolRadius * 0.15, poolRadius * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Reeds around the water pool (fixed positions to prevent flickering)
        const reedPositions = [
            { x: poolX - poolRadius * 1.2, y: poolY - poolRadius * 0.5, height: 12 },
            { x: poolX - poolRadius * 0.9, y: poolY + poolRadius * 0.8, height: 15 },
            { x: poolX + poolRadius * 1.0, y: poolY - poolRadius * 0.4, height: 10 },
            { x: poolX + poolRadius * 0.7, y: poolY + poolRadius * 0.9, height: 14 },
            { x: poolX - poolRadius * 1.3, y: poolY + poolRadius * 0.1, height: 8 },
            { x: poolX + poolRadius * 1.1, y: poolY + poolRadius * 0.5, height: 11 }
        ];
        
        reedPositions.forEach((reed, index) => {
            // Fixed reed positions to prevent flickering
            const fixedBend = index % 2 === 0 ? 1 : -1; // Alternate bending direction
            
            // Reed stem
            ctx.strokeStyle = '#6B8E23'; // Olive green
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(reed.x, reed.y);
            ctx.lineTo(reed.x + fixedBend, reed.y - reed.height); // Fixed bend instead of random
            ctx.stroke();
            
            // Reed top
            ctx.fillStyle = '#8FBC8F'; // Dark sea green
            ctx.beginPath();
            ctx.ellipse(reed.x + fixedBend, reed.y - reed.height, 2, 4, 0, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Add cattails near water (repositioned)
        const cattailPositions = [
            { x: poolX - poolRadius * 1.0, y: poolY - poolRadius * 0.6 },
            { x: poolX + poolRadius * 0.8, y: poolY + poolRadius * 0.8 },
            { x: poolX - poolRadius * 1.1, y: poolY + poolRadius * 0.4 }
        ];
        
        cattailPositions.forEach(cattail => {
            // Cattail stem
            ctx.strokeStyle = '#228B22';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(cattail.x, cattail.y);
            ctx.lineTo(cattail.x, cattail.y - 16);
            ctx.stroke();
            
            // Cattail head (brown fuzzy part)
            ctx.fillStyle = '#8B4513';
            ctx.beginPath();
            ctx.ellipse(cattail.x, cattail.y - 14, 2, 6, 0, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Scattered grass blades (fixed positions, avoid bottom right clearing)
        const grassBlades = [
            { x: -maxArea * 0.9, y: -maxArea * 0.3, length: 6, bend: 1 },
            { x: -maxArea * 0.8, y: maxArea * 0.7, length: 4, bend: -1 },
            { x: -maxArea * 0.6, y: maxArea * 0.9, length: 5, bend: 1 },
            { x: -maxArea * 0.4, y: -maxArea * 0.9, length: 5, bend: -1 },
            { x: -maxArea * 0.5, y: maxArea * 0.8, length: 6, bend: 1 }
            // Removed grass blades from bottom right clearing area
        ];
        
        grassBlades.forEach(blade => {
            ctx.strokeStyle = 'rgba(34, 139, 34, 0.8)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(this.x + blade.x, this.y + blade.y);
            ctx.lineTo(this.x + blade.x + blade.bend, this.y + blade.y - blade.length); // Fixed bend
            ctx.stroke();
        });
        
        // Fixed excavation tool marks for realism
        ctx.strokeStyle = 'rgba(101, 67, 33, 0.3)';
        ctx.lineWidth = 2;
        
        const toolMarks = [
            { x1: -maxArea * 0.6, y1: -maxArea * 0.3, x2: -maxArea * 0.2, y2: -maxArea * 0.1 },
            { x1: maxArea * 0.1, y1: -maxArea * 0.5, x2: maxArea * 0.4, y2: -maxArea * 0.2 },
            { x1: -maxArea * 0.3, y1: maxArea * 0.2, x2: maxArea * 0.1, y2: maxArea * 0.4 },
            { x1: maxArea * 0.2, y1: 0, x2: maxArea * 0.5, y2: maxArea * 0.3 }
        ];
        
        toolMarks.forEach(mark => {
            ctx.beginPath();
            ctx.moveTo(this.x + mark.x1, this.y + mark.y1);
            ctx.lineTo(this.x + mark.x2, this.y + mark.y2);
            ctx.stroke();
        });
    }
    
    renderCaveEntrance(ctx, size) {
        // Rock formation around cave entrance - integrated into excavated ground
        const rockColor = '#8B7355';
        const darkRock = '#654321';
        const lightRock = '#A0522D';
        
        // Natural rock outcropping from excavated ground
        ctx.fillStyle = rockColor;
        ctx.strokeStyle = darkRock;
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(this.x - size * 0.35, this.y + size * 0.15);
        ctx.lineTo(this.x - size * 0.25, this.y - size * 0.15);
        ctx.lineTo(this.x - size * 0.05, this.y - size * 0.25);
        ctx.lineTo(this.x + size * 0.15, this.y - size * 0.2);
        ctx.lineTo(this.x + size * 0.3, this.y + size * 0.05);
        ctx.lineTo(this.x + size * 0.25, this.y + size * 0.15);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Cave entrance (dark oval opening)
        const caveGradient = ctx.createRadialGradient(
            this.x - size * 0.12, this.y - size * 0.05, 0,
            this.x - size * 0.12, this.y - size * 0.05, size * 0.12
        );
        caveGradient.addColorStop(0, '#000000');
        caveGradient.addColorStop(0.7, '#1a1a1a');
        caveGradient.addColorStop(1, '#2a2a2a');
        
        ctx.fillStyle = caveGradient;
        ctx.beginPath();
        ctx.ellipse(this.x - size * 0.12, this.y - size * 0.05, size * 0.12, size * 0.08, 0, 0, Math.PI * 2);
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
        ctx.fillRect(this.x - size * 0.22, this.y - size * 0.1, size * 0.03, size * 0.12);
        ctx.strokeRect(this.x - size * 0.22, this.y - size * 0.1, size * 0.03, size * 0.12);
        
        ctx.fillRect(this.x - size * 0.05, this.y - size * 0.1, size * 0.03, size * 0.12);
        ctx.strokeRect(this.x - size * 0.05, this.y - size * 0.1, size * 0.03, size * 0.12);
        
        // Horizontal beam
        ctx.fillRect(this.x - size * 0.22, this.y - size * 0.12, size * 0.2, size * 0.025);
        ctx.strokeRect(this.x - size * 0.22, this.y - size * 0.12, size * 0.2, size * 0.025);
        
        // Mine cart track on excavated ground
        const trackY = this.y + size * 0.2;
        const trackStartX = this.x - size * 0.08;
        const trackEndX = this.x + size * 0.35;
        
        // Track rails
        ctx.strokeStyle = '#696969';
        ctx.lineWidth = 3;
        
        // Left rail
        ctx.beginPath();
        ctx.moveTo(trackStartX, trackY - size * 0.015);
        ctx.lineTo(trackEndX, trackY - size * 0.015);
        ctx.stroke();
        
        // Right rail
        ctx.beginPath();
        ctx.moveTo(trackStartX, trackY + size * 0.015);
        ctx.lineTo(trackEndX, trackY + size * 0.015);
        ctx.stroke();
        
        // Railroad ties on excavated ground
        ctx.fillStyle = '#654321';
        for (let i = 0; i < 6; i++) {
            const tieX = trackStartX + (trackEndX - trackStartX) * (i / 5);
            ctx.fillRect(tieX - size * 0.015, trackY - size * 0.025, size * 0.03, size * 0.05);
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
        if (this.goldReady && this.cartPosition > 0.5) { // Use goldReady instead of isReady
            ctx.fillStyle = '#FFD700';
            for (let i = 0; i < 3; i++) {
                const oreX = cartX - size * 0.02 + (i * size * 0.013);
                const oreY = trackY - size * 0.07;
                ctx.beginPath();
                ctx.arc(oreX, oreY, size * 0.008, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}
