import { EnemyRegistry } from './EnemyRegistry.js';

export class EnemyManager {
    constructor(path) {
        this.path = path;
        this.enemies = [];
        this.spawning = false;
        this.spawnQueue = [];
        this.spawnQueueIndex = 0; // OPTIMIZATION: Index pointer instead of Array.shift()
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
        this.spawnQueueIndex = 0;
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
        this.spawnQueueIndex = 0;
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
        this.spawnQueueIndex = 0;
        this.spawnTimer = 0;
        
        if (pattern) {
            this.spawnPattern = pattern;
        }
        
    }
    
    update(deltaTime) {
        // In continuous mode, keep queue filled
        if (this.continuousMode && this.spawnQueueIndex >= this.spawnQueue.length) {
            const enemyType = this.spawnPattern[this.spawnPatternIndex % this.spawnPattern.length];
            const defaultSpeed = EnemyRegistry.getDefaultSpeed(enemyType);
            
            this.spawnQueue.push({
                type: enemyType,
                health_multiplier: 1,
                speed: defaultSpeed
            });
            this.spawnPatternIndex++;
            
        }
        
        if (this.spawnQueueIndex < this.spawnQueue.length) {
            this.spawnTimer += deltaTime;
            
            if (this.spawnTimer >= this.spawnInterval) {
                // OPTIMIZATION: Use index pointer instead of shift() to avoid O(n) array re-indexing
                const enemyData = this.spawnQueue[this.spawnQueueIndex++];
                
                // Reset queue when fully consumed to free memory
                if (this.spawnQueueIndex >= this.spawnQueue.length && !this.continuousMode) {
                    this.spawnQueue.length = 0;
                    this.spawnQueueIndex = 0;
                }
                
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
                    // Apply campaign-specific base loot rates (set by GameplayState based on current campaign)
                    if (this.campaignLootConfig) {
                        enemy.lootDropChance = this.campaignLootConfig.normalChance;
                        enemy.rareLootDropChance = this.campaignLootConfig.rareChance;
                    }

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
        } else if (!this.continuousMode && this.spawnQueueIndex >= this.spawnQueue.length) {
            this.spawning = false;
        }
        
        // Update all enemies (this no longer updates their splatters internally)
        for (let i = 0; i < this.enemies.length; i++) {
            this.enemies[i].update(deltaTime);
        }
        
        // OPTIMIZATION: Consolidate splatter updates into single loop
        // Uses compact-in-place pattern (swap-with-last) for O(1) removal
        for (let i = 0; i < this.enemies.length; i++) {
            const enemy = this.enemies[i];
            const splatters = enemy.hitSplatters;
            if (splatters && splatters.length > 0) {
                let writeIdx = 0;
                for (let j = 0; j < splatters.length; j++) {
                    splatters[j].update(deltaTime);
                    if (splatters[j].isAlive()) {
                        splatters[writeIdx++] = splatters[j];
                    }
                }
                splatters.length = writeIdx;
            }
        }
        
        // Update orphaned splatters from dead enemies (compact-in-place)
        let writeIdx = 0;
        for (let j = 0; j < this.orphanedSplatters.length; j++) {
            this.orphanedSplatters[j].update(deltaTime);
            if (this.orphanedSplatters[j].isAlive()) {
                this.orphanedSplatters[writeIdx++] = this.orphanedSplatters[j];
            }
        }
        this.orphanedSplatters.length = writeIdx;
    }
    
    checkReachedEnd() {
        let reachedCount = 0;
        let writeIdx = 0;
        for (let i = 0; i < this.enemies.length; i++) {
            if (this.enemies[i].reachedEnd) {
                reachedCount++;
            } else {
                this.enemies[writeIdx] = this.enemies[i];
                writeIdx++;
            }
        }
        this.enemies.length = writeIdx;
        return reachedCount;
    }
    
    removeDeadEnemies() {
        let totalGold = 0;
        if (!this._lootDropBuffer) this._lootDropBuffer = [];
        const lootDrops = this._lootDropBuffer;
        lootDrops.length = 0;
        
        let writeIdx = 0;
        for (let i = 0; i < this.enemies.length; i++) {
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
                    for (let j = 0; j < enemy.hitSplatters.length; j++) {
                        this.orphanedSplatters.push(enemy.hitSplatters[j]);
                    }
                }
            } else {
                this.enemies[writeIdx] = enemy;
                writeIdx++;
            }
        }
        this.enemies.length = writeIdx;
        
        return { totalGold, lootDrops };
    }
    
    render(ctx) {
        // Sort enemies by Y position for proper depth ordering
        // OPTIMIZATION: Reuse buffer array instead of spreading into a new one each frame
        if (!this._renderBuffer) this._renderBuffer = [];
        const buf = this._renderBuffer;
        buf.length = this.enemies.length;
        for (let i = 0; i < this.enemies.length; i++) {
            buf[i] = this.enemies[i];
        }
        buf.sort((a, b) => a.y - b.y);
        
        for (let i = 0; i < buf.length; i++) {
            const enemy = buf[i];
            enemy.render(ctx);
            
            // Render splatters from this enemy
            if (enemy.hitSplatters && enemy.hitSplatters.length > 0) {
                for (let j = 0; j < enemy.hitSplatters.length; j++) {
                    enemy.hitSplatters[j].render(ctx);
                }
            }
        }
        
        // Render orphaned splatters from dead enemies
        // These will continue to display and fade until their life reaches 0
        for (let i = 0; i < this.orphanedSplatters.length; i++) {
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
