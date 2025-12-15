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
        
    }
    
    updatePath(newPath) {
        this.path = newPath;
    }
    
    spawnWave(waveNumber, count, health = 50, speed = 50, spawnInterval = 1.0, enemyType = 'basic') {
        this.continuousMode = false;
        this.spawning = true;
        this.spawnQueue = [];
        this.spawnInterval = spawnInterval;
        
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
        this.enemies.forEach(enemy => enemy.update(deltaTime));
        
        // IMPORTANT: Update ALL splatters (both from live enemies and dead enemies) in ONE place
        // This prevents double-updating and ensures consistent lifecycle management
        
        // Update splatters from live enemies
        this.enemies.forEach(enemy => {
            if (enemy.hitSplatters && enemy.hitSplatters.length > 0) {
                enemy.hitSplatters.forEach(splatter => splatter.update(deltaTime));
            }
        });
        
        // Update orphaned splatters from dead enemies
        this.orphanedSplatters.forEach(splatter => splatter.update(deltaTime));
        
        // Filter out dead splatters from both lists
        this.enemies.forEach(enemy => {
            if (enemy.hitSplatters) {
                enemy.hitSplatters = enemy.hitSplatters.filter(splatter => splatter.isAlive());
            }
        });
        this.orphanedSplatters = this.orphanedSplatters.filter(splatter => splatter.isAlive());
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
        // Debug: render path if no enemies to show
        if (this.enemies.length === 0 && this.path.length > 0) {
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            this.path.forEach((point, index) => {
                if (index === 0) {
                    ctx.moveTo(point.x, point.y);
                } else {
                    ctx.lineTo(point.x, point.y);
                }
            });
            ctx.stroke();
        }
        
        // Render all enemies
        this.enemies.forEach(enemy => enemy.render(ctx));
        
        // Render splatters from live enemies
        this.enemies.forEach(enemy => {
            if (enemy.hitSplatters && enemy.hitSplatters.length > 0) {
                enemy.hitSplatters.forEach(splatter => splatter.render(ctx));
            }
        });
        
        // Render orphaned splatters from dead enemies
        // These will continue to display and fade until their life reaches 0
        this.orphanedSplatters.forEach(splatter => splatter.render(ctx));
    }
}
