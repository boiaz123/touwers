import { EnemyRegistry } from './EnemyRegistry.js';
import { HitSplatter } from '../effects/HitSplatter.js';

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
    
    spawnWave(waveNumber, count, health = 50, speed_multiplier = 1.0, spawnInterval = 1.0, enemyType = 'basic') {
        this.spawning = true;
        this.spawnQueue = [];
        this.spawnQueueIndex = 0;
        this.spawnInterval = spawnInterval;
        this.spawnTimer = this.spawnInterval; // First enemy spawns immediately
        this.waveStartSFXPlayed = false; // Reset flag for new wave
        
        // Play wave start SFX
        if (this.audioManager) {
            this.audioManager.playSFX('wave-start');
        }
        
        for (let i = 0; i < count; i++) {
            this.spawnQueue.push({
                type: enemyType,
                health: health,
                speed_multiplier: speed_multiplier
            });
        }
    }
    
    spawnWaveWithPattern(waveNumber, count, health_multiplier = 1, speed_multiplier = 1.0, spawnInterval = 1.0, pattern) {
        this.spawning = true;
        this.spawnQueue = [];
        this.spawnQueueIndex = 0;
        this.spawnInterval = spawnInterval;
        this.spawnTimer = this.spawnInterval; // First enemy spawns immediately
        this.waveStartSFXPlayed = false; // Reset flag for new wave
        
        // Play wave start SFX
        if (this.audioManager) {
            this.audioManager.playSFX('wave-start');
        }
        
        // Support both old format (array of strings) and new format (array of {type, count} objects)
        if (pattern.length > 0 && typeof pattern[0] === 'object') {
            for (const entry of pattern) {
                for (let i = 0; i < entry.count; i++) {
                    this.spawnQueue.push({
                        type: entry.type,
                        health_multiplier: entry.healthMultiplier !== undefined ? entry.healthMultiplier : health_multiplier,
                        speed_multiplier: entry.speedMultiplier !== undefined ? entry.speedMultiplier : speed_multiplier
                    });
                }
            }
        } else {
            for (let i = 0; i < count; i++) {
                const enemyType = pattern[i % pattern.length];
                this.spawnQueue.push({
                    type: enemyType,
                    health_multiplier: health_multiplier,
                    speed_multiplier: speed_multiplier
                });
            }
        }
    }
    
    update(deltaTime) {
        if (this.spawnQueueIndex < this.spawnQueue.length) {
            this.spawnTimer += deltaTime;
            
            if (this.spawnTimer >= this.spawnInterval) {
                // OPTIMIZATION: Use index pointer instead of shift() to avoid O(n) array re-indexing
                const enemyData = this.spawnQueue[this.spawnQueueIndex++];
                
                // Reset queue when fully consumed to free memory
                if (this.spawnQueueIndex >= this.spawnQueue.length) {
                    this.spawnQueue.length = 0;
                    this.spawnQueueIndex = 0;
                }

                // Normalize enemy data: handle both "health" (from spawnWave) and "health_multiplier" (from waves)
                let healthMultiplier = enemyData.health_multiplier;
                const speedMul = enemyData.speed_multiplier !== undefined ? enemyData.speed_multiplier : 1.0;
                const baseSpeed = EnemyRegistry.getDefaultSpeed(enemyData.type) || 50;
                const actualSpeed = baseSpeed * speedMul;
                
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
                    actualSpeed
                );
                
                if (enemy) {
                    // Assign audio manager to enemy for sound effects (e.g. spell casts)
                    if (this.audioManager) {
                        enemy.audioManager = this.audioManager;
                    }

                    // Apply campaign-specific base loot rates (set by GameplayState based on current campaign)
                    if (this.campaignLootConfig) {
                        enemy.lootDropChance = this.campaignLootConfig.normalChance;
                        enemy.rareLootDropChance = this.campaignLootConfig.rareChance;
                        if (this.campaignLootConfig.realmShardChance !== undefined) {
                            enemy.realmShardDropChance = this.campaignLootConfig.realmShardChance;
                        }
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
        } else if (this.spawnQueueIndex >= this.spawnQueue.length) {
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
                    } else {
                        HitSplatter.release(splatters[j]);
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
            } else {
                HitSplatter.release(this.orphanedSplatters[j]);
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

        const startCount = this.enemies.length;
        let writeIdx = 0;
        for (let i = 0; i < this.enemies.length; i++) {
            const enemy = this.enemies[i];
            if (enemy.isDead()) {
                totalGold += enemy.goldReward || 0;
                
                // Check for realm shard drop (independent of regular loot)
                if (enemy.shouldDropRealmShard && enemy.shouldDropRealmShard()) {
                    const shardId = enemy.getDroppedRealmShard ? enemy.getDroppedRealmShard() : 'realm-shard-bottom';
                    lootDrops.push({
                        x: enemy.x,
                        y: enemy.y,
                        lootId: shardId,
                        isRare: false,
                        isRealmShard: true
                    });
                }

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

        return { totalGold, lootDrops, killed: startCount - writeIdx };
    }
    
}
