import { Building } from './Building.js';

export class GoldMine extends Building {
    constructor(x, y, gridX, gridY) {
        super(x, y, gridX, gridY, 4);
        this.goldReady = false;
        this.productionTime = 30;
        this.currentProduction = 0;
        this.sparks = [];
        this.nextSparkTime = 0;
        this.incomeMultiplier = 1;
        
        // Building manager reference for performance optimization
        this.buildingManager = null;
        
        // New: Gem mining mode
        this.gemMode = false;
        this.gemMiningUnlocked = false;
        this.currentGemType = null; // Track which gem is being mined
        
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
        
        // Performance optimization: Cache for static rendered elements
        this.staticBackgroundCanvas = null;
        this.staticBackgroundCacheSize = null;
        
        // PERF: Cache mine count to avoid recomputing every frame
        this.cachedMineCount = 1;
        this.mineCountCheckTimer = 0;
        this.MINE_COUNT_CHECK_INTERVAL = 1.0; // Check every 1 second
        
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
        this.floatingTexts = []; // For collection text
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
        
        // PERF: Update mine count cache periodically (every 1 second) instead of every frame
        this.mineCountCheckTimer -= deltaTime;
        if (this.mineCountCheckTimer <= 0) {
            if (this.buildingManager) {
                this.cachedMineCount = this.buildingManager.buildings.filter(
                    b => b.constructor.name === 'GoldMine'
                ).length;
            } else {
                this.cachedMineCount = 1;
            }
            this.mineCountCheckTimer = this.MINE_COUNT_CHECK_INTERVAL;
        }
        
        // Only produce if not ready
        if (!this.goldReady) {
            this.currentProduction += deltaTime;
            
            if (this.currentProduction >= this.productionTime) {
                this.goldReady = true;
                this.currentProduction = 0;
                this.flashOpacity = 1; // Trigger one-time flash
                
                // Pre-select gem type when production completes
                if (this.gemMode && this.gemMiningUnlocked) {
                    const gemTypes = ['fire', 'water', 'air', 'earth'];
                    this.currentGemType = gemTypes[Math.floor(Math.random() * gemTypes.length)];
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
        
        // PERF: Use cached mine count instead of filtering every frame
        const mineCount = this.cachedMineCount;
        
        // Update workers
        this.workers.forEach(worker => {
            worker.miningCooldown -= deltaTime;
            worker.pickaxeRaised = Math.max(0, worker.pickaxeRaised - deltaTime * 3);
            
            // Mining animation
            if (worker.miningCooldown <= 0 && !this.goldReady) { // Use goldReady instead of isReady
                worker.pickaxeRaised = 1;
                worker.miningCooldown = 2 + Math.random() * 2;
                
                // PERF OPTIMIZATION: Particle generation scales dramatically with mine count
                // Only generate particles with probability based on mine count to maintain frame rate
                // 1 mine: 50% chance, 2 mines: 25% chance, 3+ mines: 10% chance
                let particleChance = 0.5 / Math.max(1, mineCount - 0.5);
                if (Math.random() < particleChance) {
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
            }
        });
        
        // Generate ambient dust from cave
        this.nextSmokeTime -= deltaTime;
        if (this.nextSmokeTime <= 0 && !this.goldReady) { // Use goldReady instead of isReady
            // PERF OPTIMIZATION: Ambient dust heavily reduced with multiple mines
            // 1 mine: 30% chance, 2 mines: 15% chance, 3+ mines: 5% chance
            let ambientChance = 0.3 / Math.max(1, mineCount * 0.7);
            if (Math.random() < ambientChance) {
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
            }
            this.nextSmokeTime = 2.0 + Math.random() * 2.0;
        }
        
        // PERF: Update smoke/dust - filter is efficient
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
        
        // Update floating texts
        this.floatingTexts = this.floatingTexts.filter(text => {
            text.y -= deltaTime * 40; // Rise upward
            text.life -= deltaTime;
            return text.life > 0;
        });
        
        // Update flash opacity (very subtle fade)
        this.flashOpacity = Math.max(0, this.flashOpacity - deltaTime * 1.2);
    }
    
    collectGold() {
        // Only allow collection if ready
        if (!this.goldReady) {
            return 0;
        }
        
        // Reset production cycle
        this.goldReady = false;
        this.currentProduction = 0;
        
        // New: If in gem mode, collect gems and return the gem object
        if (this.gemMode) {
            const gemsCollected = this.collectGems(); // Return gems object instead of gold amount
            return gemsCollected;
        } else {
            // Original gold collection logic
            const income = Math.floor(this.getBaseIncome() * (this.incomeMultiplier || 1));
            
            // PERF: Reduce spark count based on how many mines exist
            // 1 mine: 5 sparks, 2 mines: 3 sparks, 3+ mines: 1 spark
            const sparkCount = Math.max(1, Math.ceil(5 / this.cachedMineCount));
            
            this.sparks = [];
            for (let i = 0; i < sparkCount; i++) {
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
            
            // Add floating text for gold collection
            this.floatingTexts.push({
                x: this.x,
                y: this.y,
                text: `+${income} GOLD`,
                life: 1.5,
                maxLife: 1.5,
                gemType: 'gold'
            });
            
            return income;
        }
    }
    
    // New: Collect gems (returns gem object instead of adding directly to academy)
    collectGems() {
        // Note: goldReady check is already done in collectGold() before calling this method
        // No need to check goldReady again here
        
        //console.log('[GoldMine.collectGems] Starting gem collection');
        
        // Randomized gem collection: 3-7 gems, each roll is random type
        const gemTypes = ['fire', 'water', 'air', 'earth'];
        const gemCount = 3 + Math.floor(Math.random() * 5); // Random 3-7 gems
        const collectedGems = { fire: 0, water: 0, air: 0, earth: 0, diamond: 0 };
        
        //console.log('[GoldMine.collectGems] Rolling for', gemCount, 'gems');
        
        for (let i = 0; i < gemCount; i++) {
            const randomGem = gemTypes[Math.floor(Math.random() * gemTypes.length)];
            collectedGems[randomGem]++;
        }
        
        //console.log('[GoldMine.collectGems] Collected gems:', collectedGems);
        
        // Add floating text for each gem type collected with better formatting
        let offsetY = -25; // Start above the mine for better visibility
        const gemNames = { fire: 'fire', water: 'water', air: 'air', earth: 'earth' };
        
        Object.entries(collectedGems).forEach(([gemType, amount]) => {
            if (amount > 0) {
                const gemName = gemNames[gemType];
                this.floatingTexts.push({
                    x: this.x,
                    y: this.y + offsetY,
                    text: `+${amount} ${gemName}`,
                    life: 2.0,
                    maxLife: 2.0,
                    gemType: gemType
                });
                offsetY += 18;
            }
        });
        
        // 15% chance to also get a diamond
        if (Math.random() < 0.15) {
            collectedGems.diamond = 1;
            
            this.floatingTexts.push({
                x: this.x,
                y: this.y + offsetY,
                text: '+1 diamond',
                life: 2.0,
                maxLife: 2.0,
                gemType: 'diamond'
            });
            //console.log('[GoldMine.collectGems] Diamond bonus awarded!');
        }
        
        this.currentGemType = null; // Reset for next cycle
        return collectedGems;
    }
    
    // New: Method to toggle gem mode
    toggleGemMode() {
        if (this.gemMiningUnlocked) {
            this.gemMode = !this.gemMode;
        }
    }
    
    // New: Set academy reference and check if gem mining is unlocked
    setAcademy(academy) {
        this.academy = academy;
        // Unlock gem mining if academy exists and has researched it (or in sandbox mode)
        if (academy) {
            this.gemMiningUnlocked = true;
            console.log('[GoldMine] Gem mining unlocked via setAcademy');
        }
    }
    
    render(ctx, size) {
        // Render excavated ground base first
        this.renderExcavatedGround(ctx, size);
        
        // Render static elements (trees, rocks, bushes, cave) - batch operations
        this.renderStaticEnvironment(ctx, size);
        
        // Render mine cart track and cart
        this.renderMineTrack(ctx, size);
        
        // Render workers (animated)
        this.renderWorkers(ctx, size);
        
        // Render gold piles when ready
        if (this.goldReady) {
            this.renderGoldPiles(ctx, size);
        }
        
        // Render dust clouds
        this.renderDustClouds(ctx);

        // Production timer shown above mine
        this.renderProductionStatus(ctx, size);
        
        // Toggle icon with medieval border
        this.renderToggleIcon(ctx, size);
        
        // Add subtle magical flash effect when gold becomes ready
        if (this.flashOpacity > 0) {
            this.renderFlashEffect(ctx, size);
        }
        
        // Render floating collection text
        this.renderFloatingTexts(ctx);
    }
    
    // ============ OPTIMIZED RENDERING METHODS ============
    
    renderStaticEnvironment(ctx, size) {
        // PERF: Skip rendering decorative trees/rocks if many mines exist
        // Trees are expensive to render - skip them when multiple mines present
        const shouldSimplify = this.cachedMineCount > 2;
        
        // Render trees only if not simplifying (trees are expensive)
        if (!shouldSimplify) {
            this.renderTrees(ctx);
        }
        
        // Render debris (simplified or full)
        if (!shouldSimplify) {
            this.renderDebris(ctx);
        } else {
            // Simplified debris - just basic shapes (much faster)
            this.excavatedDebris.forEach(debris => {
                ctx.fillStyle = debris.color;
                ctx.beginPath();
                ctx.ellipse(this.x + debris.x, this.y + debris.y, debris.size * 0.8, debris.size * 0.6, 0, 0, Math.PI * 2);
                ctx.fill();
            });
        }
        
        // Bushes - always render (lightweight)
        this.bushes.forEach(bush => {
            ctx.save();
            ctx.translate(this.x + bush.x, this.y + bush.y);
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            ctx.beginPath();
            ctx.ellipse(1, 1, bush.radius * 0.8, bush.radius * 0.2, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = bush.color;
            bush.segmentPositions.forEach(segment => {
                ctx.beginPath();
                ctx.arc(segment.x, segment.y, segment.radius, 0, Math.PI * 2);
                ctx.fill();
            });
            
            ctx.restore();
        });
        
        // Cave entrance
        this.renderCaveEntrance(ctx, size);
    }
    
    // PERF: Removed shouldSimplifyRendering method - now using cached mine count directly
    
    renderTrees(ctx) {
        // PERF: Skip individual tree rendering if too many mines exist
        // This avoids thousands of draw calls
        if (this.cachedMineCount > 3) {
            return; // Skip trees entirely when > 3 mines
        }
        
        this.trees.forEach((tree, index) => {
            ctx.save();
            ctx.translate(this.x + tree.x, this.y + tree.y);
            
            // Use different tree types like LevelBase does
            const treeType = (index + Math.floor(tree.x + tree.y)) % 4;
            switch(treeType) {
                case 0:
                    this.renderTreeType1(ctx, tree);
                    break;
                case 1:
                    this.renderTreeType2(ctx, tree);
                    break;
                case 2:
                    this.renderTreeType3(ctx, tree);
                    break;
                default:
                    this.renderTreeType4(ctx, tree);
            }
            ctx.restore();
        });
    }
    
    renderTreeType1(ctx, tree) {
        const size = tree.crownRadius * 1.5;
        const trunkWidth = size * 0.25;
        const trunkHeight = size * 0.5;
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(-trunkWidth * 0.5, 0, trunkWidth, trunkHeight);
        ctx.fillStyle = '#3E2723';
        ctx.fillRect(0, 0, trunkWidth * 0.5, trunkHeight);
        ctx.fillStyle = '#0D3817';
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.6);
        ctx.lineTo(size * 0.35, -size * 0.1);
        ctx.lineTo(-size * 0.35, -size * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.35);
        ctx.lineTo(size * 0.3, size * 0.05);
        ctx.lineTo(-size * 0.3, size * 0.05);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.15);
        ctx.lineTo(size * 0.25, size * 0.2);
        ctx.lineTo(-size * 0.25, size * 0.2);
        ctx.closePath();
        ctx.fill();
    }

    renderTreeType2(ctx, tree) {
        const size = tree.crownRadius * 1.5;
        const trunkWidth = size * 0.2;
        const trunkHeight = size * 0.4;
        ctx.fillStyle = '#6B4423';
        ctx.fillRect(-trunkWidth * 0.5, 0, trunkWidth, trunkHeight);
        ctx.fillStyle = '#8B5A3C';
        ctx.fillRect(-trunkWidth * 0.5 + trunkWidth * 0.6, 0, trunkWidth * 0.4, trunkHeight);
        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.arc(0, -size * 0.1, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.arc(0, -size * 0.35, size * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#43A047';
        ctx.beginPath();
        ctx.arc(0, -size * 0.55, size * 0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    renderTreeType3(ctx, tree) {
        const size = tree.crownRadius * 1.5;
        const trunkWidth = size * 0.22;
        ctx.fillStyle = '#795548';
        ctx.fillRect(-trunkWidth * 0.5, -size * 0.2, trunkWidth, size * 0.6);
        ctx.fillStyle = '#4E342E';
        ctx.beginPath();
        ctx.arc(trunkWidth * 0.25, 0, trunkWidth * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.arc(-size * 0.28, -size * 0.35, size * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(size * 0.28, -size * 0.3, size * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.arc(0, -size * 0.55, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    renderTreeType4(ctx, tree) {
        const size = tree.crownRadius * 1.5;
        const trunkWidth = size * 0.18;
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-trunkWidth * 0.5, -size * 0.05, trunkWidth, size * 0.45);
        ctx.fillStyle = '#0D3817';
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.05);
        ctx.lineTo(size * 0.38, size * 0.15);
        ctx.lineTo(-size * 0.38, size * 0.15);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.25);
        ctx.lineTo(size * 0.3, 0);
        ctx.lineTo(-size * 0.3, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.45);
        ctx.lineTo(size * 0.2, -size * 0.15);
        ctx.lineTo(-size * 0.2, -size * 0.15);
        ctx.closePath();
        ctx.fill();
    }
    
    renderDebris(ctx) {
        // PERF: Only render debris if not too many mines (avoid context state changes)
        if (this.cachedMineCount > 3) {
            // Ultra-simplified debris when many mines
            this.excavatedDebris.forEach(debris => {
                ctx.fillStyle = debris.color;
                ctx.beginPath();
                ctx.ellipse(this.x + debris.x, this.y + debris.y, debris.size * 0.9, debris.size * 0.6, 0, 0, Math.PI * 2);
                ctx.fill();
            });
            return;
        }
        
        this.excavatedDebris.forEach(debris => {
            ctx.save();
            ctx.translate(this.x + debris.x, this.y + debris.y);
            ctx.rotate(debris.rotation);
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            ctx.beginPath();
            ctx.ellipse(2, 2, debris.size * 0.8, debris.size * 0.35, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = debris.color;
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.ellipse(0, 0, debris.size, debris.size * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            ctx.restore();
        });
    }
    
    renderMineTrack(ctx, size) {
        const trackY = this.y + size * 0.2;
        const trackStartX = this.x - size * 0.08;
        const trackEndX = this.x + size * 0.35;
        
        // Track rails
        ctx.strokeStyle = '#696969';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(trackStartX, trackY - size * 0.015);
        ctx.lineTo(trackEndX, trackY - size * 0.015);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(trackStartX, trackY + size * 0.015);
        ctx.lineTo(trackEndX, trackY + size * 0.015);
        ctx.stroke();
        
        // Railroad ties
        ctx.fillStyle = '#654321';
        for (let i = 0; i < 6; i++) {
            const tieX = trackStartX + (trackEndX - trackStartX) * (i / 5);
            ctx.fillRect(tieX - size * 0.015, trackY - size * 0.025, size * 0.03, size * 0.05);
        }
        
        // Mine cart
        const cartX = trackStartX + (trackEndX - trackStartX) * this.cartPosition;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(cartX - size * 0.04 + 2, trackY - size * 0.08 + 2, size * 0.08, size * 0.06);
        
        ctx.fillStyle = '#8B4513';
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        ctx.fillRect(cartX - size * 0.04, trackY - size * 0.08, size * 0.08, size * 0.06);
        ctx.strokeRect(cartX - size * 0.04, trackY - size * 0.08, size * 0.08, size * 0.06);
        
        // Wheels
        ctx.fillStyle = '#2F2F2F';
        ctx.beginPath();
        ctx.arc(cartX - size * 0.025, trackY, size * 0.012, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(cartX + size * 0.025, trackY, size * 0.012, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Gold ore in cart
        if (this.goldReady && this.cartPosition > 0.5) {
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
    
    renderWorkers(ctx, size) {
        this.workers.forEach(worker => {
            ctx.save();
            ctx.translate(this.x + worker.x, this.y + worker.y);
            
            // Body
            ctx.fillStyle = '#1E3A8A';
            ctx.fillRect(-2, -4, 4, 8);
            
            // Head
            ctx.fillStyle = '#DDBEA9';
            ctx.beginPath();
            ctx.arc(0, -6, 2.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Helmet
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(0, -6, 3, Math.PI, Math.PI * 2);
            ctx.fill();
            
            // Lamp
            ctx.fillStyle = '#FFFF99';
            ctx.beginPath();
            ctx.arc(0, -8, 1, 0, Math.PI * 2);
            ctx.fill();
            
            // Pickaxe arm
            const armAngle = worker.pickaxeRaised > 0 ? -Math.PI/2 : Math.PI/6;
            ctx.strokeStyle = '#DDBEA9';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, -2);
            ctx.lineTo(Math.cos(armAngle) * 5, -2 + Math.sin(armAngle) * 5);
            ctx.stroke();
            
            if (worker.pickaxeRaised > 0.2) {
                const pickaxeX = Math.cos(armAngle) * 7;
                const pickaxeY = -2 + Math.sin(armAngle) * 7;
                
                ctx.strokeStyle = '#8B4513';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(pickaxeX, pickaxeY);
                ctx.lineTo(pickaxeX - Math.cos(armAngle) * 8, pickaxeY - Math.sin(armAngle) * 8);
                ctx.stroke();
                
                ctx.fillStyle = '#696969';
                ctx.fillRect(pickaxeX - 2, pickaxeY - 6, 4, 2);
            }
            
            ctx.restore();
        });
    }
    
    renderGoldPiles(ctx, size) {
        this.goldPiles.forEach((pile, index) => {
            const bob = this.bobAnimations[index];
            const bobOffset = bob ? Math.sin(bob.time) * 1.5 : 0;
            
            ctx.save();
            ctx.translate(this.x + pile.x, this.y + pile.y + bobOffset);
            
            // Glow
            const glimmerIntensity = Math.sin(pile.glimmer) * 0.3 + 0.7;
            const goldGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 8);
            goldGlow.addColorStop(0, `rgba(255, 215, 0, ${glimmerIntensity * 0.8})`);
            goldGlow.addColorStop(1, 'rgba(255, 215, 0, 0)');
            
            ctx.fillStyle = goldGlow;
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.fill();
            
            // Nuggets
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
    
    renderDustClouds(ctx) {
        this.smokePuffs.forEach(smoke => {
            const alpha = smoke.life / smoke.maxLife;
            ctx.fillStyle = `rgba(139, 115, 85, ${alpha * 0.4})`;
            ctx.beginPath();
            ctx.arc(smoke.x, smoke.y, smoke.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    renderProductionStatus(ctx, size) {
        if (!this.goldReady) {
            const progress = this.currentProduction / this.productionTime;
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(this.x - 25, this.y - size/2 - 15, 50, 8);
            
            ctx.fillStyle = '#4CAF50';
            ctx.fillRect(this.x - 25, this.y - size/2 - 15, 50 * progress, 8);
            
            ctx.strokeStyle = '#FFF';
            ctx.lineWidth = 1;
            ctx.strokeRect(this.x - 25, this.y - size/2 - 15, 50, 8);
            
            const timeLeft = Math.ceil(this.productionTime - this.currentProduction);
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${timeLeft}s`, this.x, this.y - size/2 - 20);
        } else {
            // Show "READY" text when gold is ready
            const readyText = this.gemMode ? '💎 READY' : '💰 READY';
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(readyText, this.x, this.y - size/2 - 15);
        }
    }
    
    renderToggleIcon(ctx, size) {
        const toggleIconSize = 25;
        const toggleX = this.x - size/2 + 12;
        const toggleY = this.y - size/2 + 12;
        const togglePulse = 0.7 + 0.3 * Math.sin(this.animationTime * 3);
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(toggleX - toggleIconSize/2 + 2, toggleY - toggleIconSize/2 + 2, toggleIconSize, toggleIconSize);
        
        let toggleBg = this.gemMode ? 'rgba(138, 43, 226, 0.8)' : 'rgba(169, 169, 169, 0.8)';
        ctx.fillStyle = toggleBg;
        ctx.fillRect(toggleX - toggleIconSize/2, toggleY - toggleIconSize/2, toggleIconSize, toggleIconSize);
        
        let toggleBorder = this.gemMode ? '#8A2BE2' : '#696969';
        ctx.strokeStyle = toggleBorder;
        ctx.lineWidth = 2;
        ctx.strokeRect(toggleX - toggleIconSize/2, toggleY - toggleIconSize/2, toggleIconSize, toggleIconSize);
        
        ctx.strokeStyle = this.gemMode ? '#DA70D6' : '#A9A9A9';
        ctx.lineWidth = 1;
        ctx.strokeRect(toggleX - toggleIconSize/2 + 2, toggleY - toggleIconSize/2 + 2, toggleIconSize - 4, toggleIconSize - 4);
        
        const cornSize = 2;
        ctx.fillStyle = toggleBorder;
        ctx.fillRect(toggleX - toggleIconSize/2 - 1, toggleY - toggleIconSize/2 - 1, cornSize, cornSize);
        ctx.fillRect(toggleX + toggleIconSize/2 - cornSize + 1, toggleY - toggleIconSize/2 - 1, cornSize, cornSize);
        ctx.fillRect(toggleX - toggleIconSize/2 - 1, toggleY + toggleIconSize/2 - cornSize + 1, cornSize, cornSize);
        ctx.fillRect(toggleX + toggleIconSize/2 - cornSize + 1, toggleY + toggleIconSize/2 - cornSize + 1, cornSize, cornSize);
        
        const toggleGlow = ctx.createRadialGradient(toggleX, toggleY, 0, toggleX, toggleY, toggleIconSize);
        const glowColor0 = this.gemMode ? `rgba(138, 43, 226, ${togglePulse * 0.2})` : `rgba(200, 200, 200, ${togglePulse * 0.2})`;
        const glowColor1 = this.gemMode ? 'rgba(138, 43, 226, 0)' : 'rgba(200, 200, 200, 0)';
        toggleGlow.addColorStop(0, glowColor0);
        toggleGlow.addColorStop(1, glowColor1);
        ctx.fillStyle = toggleGlow;
        ctx.fillRect(toggleX - toggleIconSize/2 - 3, toggleY - toggleIconSize/2 - 3, toggleIconSize + 6, toggleIconSize + 6);
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.gemMode ? '💎' : '⛏️', toggleX, toggleY);
        
        ctx.fillStyle = '#000';
        ctx.font = 'bold 8px Arial';
        ctx.fillText(this.gemMode ? 'GEM' : 'GOLD', toggleX, toggleY + toggleIconSize/2 + 5);
    }
    
    renderFlashEffect(ctx, size) {
        let flashColor = '#FFD700';
        
        if (this.gemMode && this.currentGemType) {
            switch(this.currentGemType) {
                case 'fire': flashColor = '#FF6B35'; break;
                case 'water': flashColor = '#4ECDC4'; break;
                case 'air': flashColor = '#FFE66D'; break;
                case 'earth': flashColor = '#8B6F47'; break;
            }
        }
        
        const maxRadius = size * 2;
        const pulseRadius = maxRadius * (1 - this.flashOpacity);
        
        const ringGradient = ctx.createRadialGradient(this.x, this.y, pulseRadius * 0.8, this.x, this.y, pulseRadius * 1.2);
        ringGradient.addColorStop(0, `${flashColor}00`);
        ringGradient.addColorStop(0.5, `${flashColor}${Math.floor(this.flashOpacity * 40).toString(16).padStart(2, '0')}`);
        ringGradient.addColorStop(1, `${flashColor}00`);
        
        ctx.fillStyle = ringGradient;
        ctx.fillRect(this.x - pulseRadius * 1.5, this.y - pulseRadius * 1.5, pulseRadius * 3, pulseRadius * 3);
        
        const glowGradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, size * 0.8);
        glowGradient.addColorStop(0, `${flashColor}${Math.floor(this.flashOpacity * 30).toString(16).padStart(2, '0')}`);
        glowGradient.addColorStop(0.5, `${flashColor}${Math.floor(this.flashOpacity * 15).toString(16).padStart(2, '0')}`);
        glowGradient.addColorStop(1, `${flashColor}00`);
        
        ctx.fillStyle = glowGradient;
        ctx.fillRect(this.x - size * 0.8, this.y - size * 0.8, size * 1.6, size * 1.6);
    }
    
    renderFloatingTexts(ctx) {
        this.floatingTexts.forEach(text => {
            const alpha = text.life / text.maxLife;
            const textSize = 18 + (1 - alpha) * 8;
            
            ctx.font = `bold ${textSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.lineWidth = 0; // No border/stroke
            
            // Set color based on gem type - vivid, distinct colors
            let fillColor = 'rgba(255, 215, 0, ' + alpha + ')'; // Default gold
            
            switch (text.gemType) {
                case 'fire':
                    fillColor = `rgba(255, 50, 0, ${alpha})`; // Bright red-orange
                    break;
                case 'water':
                    fillColor = `rgba(30, 180, 255, ${alpha})`; // Bright cyan-blue
                    break;
                case 'air':
                    fillColor = `rgba(255, 255, 100, ${alpha})`; // Bright yellow
                    break;
                case 'earth':
                    fillColor = `rgba(180, 100, 20, ${alpha})`; // Warm brown
                    break;
                case 'diamond':
                    fillColor = `rgba(100, 255, 255, ${alpha})`; // Bright cyan
                    break;
                case 'gold':
                    fillColor = `rgba(255, 215, 0, ${alpha})`; // Vivid gold
                    break;
            }
            
            ctx.fillStyle = fillColor;
            ctx.fillText(text.text, this.x, text.y);
        });
    }
    
    onClick() {
        // If ready, collect immediately without opening menu
        if (this.goldReady === true) {
            const collected = this.collectGold();
            // Return collection result directly - prevents menu opening in GameplayState
            return collected; // number (gold) or gem object
        }
        
        // Show menu only when not ready (for viewing details, toggling modes, etc.)
        this.isSelected = true;
        return {
            type: 'goldmine_menu',
            goldMine: this
        };
    }
    
    // New: Helper to check if click is on toggle (kept for compatibility)
    isClickOnToggle(x, y, size) {
        if (!this.gemMiningUnlocked) return false;
        
        const toggleIconSize = 25;
        const toggleX = this.x - size/2 + 12;
        const toggleY = this.y - size/2 + 12;
        
        return x >= toggleX - toggleIconSize/2 && x <= toggleX + toggleIconSize/2 &&
               y >= toggleY - toggleIconSize/2 && y <= toggleY + toggleIconSize/2;
    }
    
    getBaseIncome() {
        // Base income adjusted by forge level via building manager
        return 30; // This will be multiplied by forge bonus in BuildingManager
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
        // Create a natural grass ground base for the entire mine area
        const baseArea = size * 0.5; // Larger base area
        
        // First: Create a natural grass foundation for the whole mine clearing
        const grassGradient = ctx.createRadialGradient(
            this.x, this.y + baseArea * 0.1, 0,
            this.x, this.y + baseArea * 0.2, baseArea * 1.2
        );
        grassGradient.addColorStop(0, 'rgba(76, 175, 80, 0.7)'); // Bright grass in center
        grassGradient.addColorStop(0.4, 'rgba(56, 155, 60, 0.5)'); // Medium grass
        grassGradient.addColorStop(0.8, 'rgba(107, 142, 35, 0.3)'); // Darker grass fade
        grassGradient.addColorStop(1, 'rgba(107, 142, 35, 0)'); // Fade to transparent
        
        ctx.fillStyle = grassGradient;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + baseArea * 0.1, baseArea, baseArea * 0.8, 0.1, 0, Math.PI * 2);
        ctx.fill();
        
        // Add natural dirt/earth texture overlay (varied earth tones)
        const earthAreas = [
            { x: -baseArea * 0.4, y: -baseArea * 0.3, radiusX: baseArea * 0.4, radiusY: baseArea * 0.3, color: 'rgba(139, 115, 85, 0.3)' },
            { x: baseArea * 0.35, y: baseArea * 0.15, radiusX: baseArea * 0.35, radiusY: baseArea * 0.35, color: 'rgba(160, 82, 45, 0.25)' },
            { x: -baseArea * 0.1, y: baseArea * 0.45, radiusX: baseArea * 0.45, radiusY: baseArea * 0.25, color: 'rgba(139, 69, 19, 0.2)' }
        ];
        
        earthAreas.forEach(area => {
            ctx.fillStyle = area.color;
            ctx.beginPath();
            ctx.ellipse(this.x + area.x, this.y + area.y, area.radiusX, area.radiusY, 0, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Render WATER POOL - positioned naturally within the grass ground
        const poolX = this.x - baseArea * 0.65;
        const poolY = this.y + baseArea * 0.55;
        const poolRadius = 16;
        
        // Water pool shadow/depth
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(poolX + 1, poolY + 2, poolRadius, poolRadius * 0.75, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Water surface with gradient
        const waterGradient = ctx.createRadialGradient(
            poolX - poolRadius * 0.3, poolY - poolRadius * 0.3, 0,
            poolX, poolY, poolRadius
        );
        waterGradient.addColorStop(0, '#87CEEB');
        waterGradient.addColorStop(0.3, '#5FA8D3');
        waterGradient.addColorStop(0.6, '#4682B4');
        waterGradient.addColorStop(0.85, '#2F4F4F');
        waterGradient.addColorStop(1, '#1a3a3a');
        
        ctx.fillStyle = waterGradient;
        ctx.beginPath();
        ctx.ellipse(poolX, poolY, poolRadius, poolRadius * 0.75, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Water highlights/reflections
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.ellipse(poolX - poolRadius * 0.35, poolY - poolRadius * 0.35, poolRadius * 0.35, poolRadius * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.beginPath();
        ctx.ellipse(poolX + poolRadius * 0.25, poolY + poolRadius * 0.2, poolRadius * 0.2, poolRadius * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Reeds around water - natural integrated look
        const reedPositions = [
            { x: poolX - poolRadius * 1.15, y: poolY - poolRadius * 0.4, height: 14, bendDir: 1 },
            { x: poolX - poolRadius * 0.85, y: poolY + poolRadius * 0.75, height: 16, bendDir: -1 },
            { x: poolX + poolRadius * 0.65, y: poolY + poolRadius * 0.8, height: 13, bendDir: 1 },
            { x: poolX - poolRadius * 1.25, y: poolY + poolRadius * 0.15, height: 11, bendDir: -1 },
            { x: poolX + poolRadius * 0.4, y: poolY - poolRadius * 0.6, height: 9, bendDir: 1 }
        ];
        
        reedPositions.forEach((reed) => {
            // Reed stem
            ctx.strokeStyle = '#6B8E23';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(reed.x, reed.y);
            ctx.lineTo(reed.x + reed.bendDir * 1.5, reed.y - reed.height);
            ctx.stroke();
            
            // Reed head
            ctx.fillStyle = '#8FBC8F';
            ctx.beginPath();
            ctx.ellipse(reed.x + reed.bendDir * 1.5, reed.y - reed.height, 2.5, 4, 0, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Grass patches around water - seamless integration
        const poolGrassPatches = [
            { x: poolX - poolRadius * 0.8, y: poolY - poolRadius * 1.2, radius: 10, intensity: 0.4 },
            { x: poolX + poolRadius * 0.9, y: poolY - poolRadius * 0.5, radius: 8, intensity: 0.35 },
            { x: poolX - poolRadius * 1.4, y: poolY + poolRadius * 0.5, radius: 9, intensity: 0.45 },
            { x: poolX + poolRadius * 1.2, y: poolY + poolRadius * 0.9, radius: 8, intensity: 0.38 }
        ];
        
        poolGrassPatches.forEach(patch => {
            const grassGradient = ctx.createRadialGradient(
                patch.x, patch.y, 0,
                patch.x, patch.y, patch.radius
            );
            grassGradient.addColorStop(0, `rgba(76, 175, 80, ${patch.intensity})`);
            grassGradient.addColorStop(0.6, `rgba(107, 142, 35, ${patch.intensity * 0.7})`);
            grassGradient.addColorStop(1, `rgba(107, 142, 35, 0)`);
            
            ctx.fillStyle = grassGradient;
            ctx.beginPath();
            ctx.arc(patch.x, patch.y, patch.radius, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Rock formations scattered around the excavated area (OPTIMIZATION: simplified)
        const rockFormations = [
            { x: -baseArea * 0.5, y: -baseArea * 0.3, size: 6 },
            { x: baseArea * 0.4, y: -baseArea * 0.5, size: 5 },
            { x: -baseArea * 0.7, y: baseArea * 0.4, size: 7 },
            { x: baseArea * 0.6, y: baseArea * 0.3, size: 5 }
        ];
        
        rockFormations.forEach(formation => {
            ctx.fillStyle = '#8B7355';
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(this.x + formation.x, this.y + formation.y, formation.size, formation.size * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();
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
