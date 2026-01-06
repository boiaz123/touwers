import { EnemyRegistry } from './EnemyRegistry.js';

export class EnemyManager {
    constructor(path) {
        this.path = path;
        this.enemies = [];
        this.spawning = true;
        this.spawnQueue = [];
        this.spawnTimer = 0;
        this.spawnInterval = 1.2; // Increased from 0.8 for more spacing
        
        // Keep track of splatters from dead enemies to render them until they fade
        this.orphanedSplatters = [];
        
        // Continuous spawn mode: alternates between enemy types
        this.continuousMode = true;
        this.spawnPatternIndex = 0;
        // Updated pattern: 2 basic, 1 beefy, 1 knight, 1 shield knight, 1 mage, 1 villager, 1 archer, 1 frog
        this.spawnPattern = ['basic', 'basic', 'beefyenemy', 'knight', 'shieldknight', 'mage', 'villager', 'archer', 'frog'];
        
        // Audio manager reference (will be set by GameplayState)
        this.audioManager = null;
        
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
                    this.enemies.push(enemy);
                    this.spawnTimer = 0;
                }
            }
        } else if (!this.continuousMode) {
            this.spawning = false;
        }
        
        // Update all enemies (this no longer updates their splatters internally)
        for (let i = 0; i < this.enemies.length; i++) {
            this.enemies[i].update(deltaTime);
        }
        
        // OPTIMIZATION: Consolidate splatter updates into single loop
        // This prevents multiple forEach passes over enemies
        for (let i = 0; i < this.enemies.length; i++) {
            const enemy = this.enemies[i];
            if (enemy.hitSplatters && enemy.hitSplatters.length > 0) {
                let j = enemy.hitSplatters.length - 1;
                while (j >= 0) {
                    const splatter = enemy.hitSplatters[j];
                    splatter.update(deltaTime);
                    if (!splatter.isAlive()) {
                        enemy.hitSplatters.splice(j, 1);
                    }
                    j--;
                }
            }
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
        this.enemies = this.enemies.filter(enemy => {
            if (enemy.reachedEnd) {
                reachedCount++;
                return false;
            }
            return true;
        });
        return reachedCount;
    }
    
    removeDeadEnemies() {
        let totalGold = 0;
        this.enemies = this.enemies.filter(enemy => {
            if (enemy.isDead()) {
                totalGold += enemy.goldReward || 0;
                // Preserve splatters from dead enemies so they continue to animate and fade
                if (enemy.hitSplatters && enemy.hitSplatters.length > 0) {
                    this.orphanedSplatters.push(...enemy.hitSplatters);
                }
                return false;
            }
            return true;
        });
        return totalGold;
    }
    
    render(ctx) {
        // OPTIMIZATION: Consolidate rendering into single loop
        // Render all enemies and their splatters in one pass
        for (let i = 0; i < this.enemies.length; i++) {
            const enemy = this.enemies[i];
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
}
