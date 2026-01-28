import { EnemyRegistry } from './EnemyRegistry.js';

export class EnemyManager {
    constructor(path) {
        this.path = path;
        this.enemies = [];
        this.spawning = false;
        this.spawnQueue = [];
        this.spawnTimer = 0;
        this.spawnInterval = 1.2; // Increased from 0.8 for more spacing
        
        // Keep track of splatters from dead enemies to render them until they fade
        this.orphanedSplatters = [];
        
        // Continuous spawn mode: alternates between enemy types
        this.continuousMode = false;
        this.spawnPatternIndex = 0;
        // Updated pattern: 2 basic, 1 beefy, 1 knight, 1 shield knight, 1 mage, 1 villager, 1 archer, 1 frog
        this.spawnPattern = ['basic', 'basic', 'beefyenemy', 'knight', 'shieldknight', 'mage', 'villager', 'archer', 'frog'];
        
        // Audio manager reference (will be set by GameplayState)
        this.audioManager = null;
        
        // Marketplace system reference (will be set by GameplayState) for checking consumables on spawn
        this.marketplaceSystem = null;
        
        // Track whether wave start SFX has been played for current wave
        this.waveStartSFXPlayed = false;
    }
    
    updatePath(newPath) {
        this.path = newPath;
    }
    
    spawnWave(waveNumber, count, health = 50, speed = 50, spawnInterval = 1.0, enemyType = 'basic') {
        this.continuousMode = false;
        this.spawning = true;
        this.spawnQueue = [];
        this.spawnInterval = spawnInterval;
        this.waveStartSFXPlayed = false; // Reset flag for new wave
        
        // Play wave start SFX
        if (this.audioManager) {
            this.audioManager.playSFX('wave-start');
        }
        
        for (let i = 0; i < count; i++) {
            this.spawnQueue.push({
                type: enemyType,
                health: health,
                speed: speed
            });
        }
    }
    
    spawnWaveWithPattern(waveNumber, count, health_multiplier = 1, speed = 50, spawnInterval = 1.0, pattern) {
        this.continuousMode = false;
        this.spawning = true;
        this.spawnQueue = [];
        this.spawnInterval = spawnInterval;
        this.waveStartSFXPlayed = false; // Reset flag for new wave
        
        // Play wave start SFX
        if (this.audioManager) {
            this.audioManager.playSFX('wave-start');
        }
        
        for (let i = 0; i < count; i++) {
            const enemyType = pattern[i % pattern.length];
            this.spawnQueue.push({
                type: enemyType,
                health_multiplier: health_multiplier,
                speed: speed
            });
        }
    }
    
    startContinuousSpawn(spawnInterval = 0.8, pattern = null) {
        // Increased from 0.6 to 0.8 for sandbox mode
        this.continuousMode = true;
        this.spawning = true;
        this.spawnInterval = spawnInterval;
        this.spawnPatternIndex = 0;
        this.spawnQueue = [];
        this.spawnTimer = 0;
        
        if (pattern) {
            this.spawnPattern = pattern;
        }
        
    }
    
    update(deltaTime) {
        // In continuous mode, keep queue filled
        if (this.continuousMode && this.spawnQueue.length === 0) {
            const enemyType = this.spawnPattern[this.spawnPatternIndex % this.spawnPattern.length];
            const defaultSpeed = EnemyRegistry.getDefaultSpeed(enemyType);
            
            this.spawnQueue.push({
                type: enemyType,
                health_multiplier: 1,
                speed: defaultSpeed
            });
            this.spawnPatternIndex++;
            
        }
        
        if (this.spawnQueue.length > 0) {
            this.spawnTimer += deltaTime;
            
            if (this.spawnTimer >= this.spawnInterval) {
                const enemyData = this.spawnQueue.shift();
                
                // Normalize enemy data: handle both "health" (from spawnWave) and "health_multiplier" (from waves/continuous)
                let healthMultiplier = enemyData.health_multiplier;
                let speed = enemyData.speed;
                
                // If "health" is provided instead of "health_multiplier", convert it
                if (enemyData.health !== undefined && healthMultiplier === undefined) {
                    const baseHealth = EnemyRegistry.getDefaultHealth(enemyData.type);
                    if (baseHealth) {
                        healthMultiplier = enemyData.health / baseHealth;
                    } else {
                        healthMultiplier = 1;
                    }
                }
                
                const enemy = EnemyRegistry.createEnemy(
                    enemyData.type,
                    this.path,
                    healthMultiplier,
                    speed
                );
                
                if (enemy) {
                    // Apply Rabbit's Foot modifier if active in marketplace
                    if (this.marketplaceSystem && this.marketplaceSystem.rabbitFootActive) {
                        if (enemy.lootDropChance !== undefined) {
                            enemy.lootDropChance *= 2; // Double the base loot chance
                        }
                    }
                    this.enemies.push(enemy);
                    this.spawnTimer = 0;
                }
            }
        } else if (!this.continuousMode) {
            this.spawning = false;
        }
        
        // OPTIMIZATION: Cache enemies array length for loop
        const enemyCount = this.enemies.length;
        
        // OPTIMIZATION: Consolidate enemy update and splatter update into single loop
        // This prevents multiple loop passes over enemies array
        for (let i = 0; i < enemyCount; i++) {
            const enemy = this.enemies[i];
            enemy.update(deltaTime);
            
            // Update splatters for this enemy in same pass
            const splatters = enemy.hitSplatters;
            // OPTIMIZATION: Early continue if no splatters
            if (!splatters || splatters.length === 0) {
                continue;
            }
            
            // OPTIMIZATION: Single pass update and removal
            let j = splatters.length - 1;
            while (j >= 0) {
                const splatter = splatters[j];
                splatter.update(deltaTime);
                if (!splatter.isAlive()) {
                    splatters.splice(j, 1);
                }
                j--;
            }
        }
        
        // OPTIMIZATION: Early return if no orphaned splatters
        if (this.orphanedSplatters.length === 0) {
            return;
        }
        
        // Update orphaned splatters from dead enemies
        let j = this.orphanedSplatters.length - 1;
        while (j >= 0) {
            const splatter = this.orphanedSplatters[j];
            splatter.update(deltaTime);
            if (!splatter.isAlive()) {
                this.orphanedSplatters.splice(j, 1);
            }
            j--;
        }
    }
    
    checkReachedEnd() {
        let reachedCount = 0;
        // OPTIMIZATION: Use backward splice loop instead of filter to avoid array allocation
        let i = this.enemies.length - 1;
        while (i >= 0) {
            if (this.enemies[i].reachedEnd) {
                reachedCount++;
                this.enemies.splice(i, 1);
            }
            i--;
        }
        return reachedCount;
    }
    
    removeDeadEnemies() {
        let totalGold = 0;
        const lootDrops = []; // Array of { x, y, lootId, isRare }
        
        // OPTIMIZATION: Use backward splice loop instead of filter to avoid array allocation
        let i = this.enemies.length - 1;
        while (i >= 0) {
            const enemy = this.enemies[i];
            if (enemy.isDead()) {
                totalGold += enemy.goldReward || 0;
                
                // Check for rare legendary loot drops first (very rare)
                if (enemy.shouldDropRareLoot && enemy.shouldDropRareLoot()) {
                    const lootId = enemy.getDroppedRareLoot();
                    lootDrops.push({
                        x: enemy.x,
                        y: enemy.y,
                        lootId: lootId,
                        isRare: true
                    });
                } 
                // Then check for normal loot drops
                else if (enemy.shouldDropLoot()) {
                    const lootId = enemy.getDroppedLoot();
                    lootDrops.push({
                        x: enemy.x,
                        y: enemy.y,
                        lootId: lootId,
                        isRare: false
                    });
                }
                
                // Preserve splatters from dead enemies so they continue to animate and fade
                if (enemy.hitSplatters && enemy.hitSplatters.length > 0) {
                    this.orphanedSplatters.push(...enemy.hitSplatters);
                }
                this.enemies.splice(i, 1);
            }
            i--;
        }
        
        return { totalGold, lootDrops };
    }
    
    render(ctx) {
        const enemyCount = this.enemies.length;
        const orphanedCount = this.orphanedSplatters.length;
        
        // Early return if nothing to render
        if (enemyCount === 0 && orphanedCount === 0) {
            return;
        }
        
        // OPTIMIZATION: Render all enemies first, then all splatters
        // This groups similar rendering operations together
        
        // Pass 1: Render all enemies
        for (let i = 0; i < enemyCount; i++) {
            this.enemies[i].render(ctx);
        }
        
        // Pass 2: Render all active splatters from living enemies
        // Batch splatter rendering to minimize state changes
        for (let i = 0; i < enemyCount; i++) {
            const splatters = this.enemies[i].hitSplatters;
            if (splatters && splatters.length > 0) {
                const splatterCount = splatters.length;
                for (let j = 0; j < splatterCount; j++) {
                    splatters[j].render(ctx);
                }
            }
        }
        
        // Pass 3: Render orphaned splatters from dead enemies
        // These will continue to display and fade until their life reaches 0
        for (let i = 0; i < orphanedCount; i++) {
            this.orphanedSplatters[i].render(ctx);
        }
    }

    /**
     * Apply loot multiplier to all existing enemies
     * Used for Rabbit's Foot which doubles normal loot drop chance
     */
    applyLootMultiplier(multiplier = 2) {
        for (const enemy of this.enemies) {
            if (enemy.lootDropChance !== undefined) {
                enemy.lootDropChance *= multiplier;
            }
        }
    }
}
