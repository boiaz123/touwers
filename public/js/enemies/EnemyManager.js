import { EnemyRegistry } from './EnemyRegistry.js';

export class EnemyManager {
    constructor(path) {
        this.path = path;
        this.enemies = [];
        this.spawning = true;
        this.spawnQueue = [];
        this.spawnTimer = 0;
        this.spawnInterval = 1.2; // Increased from 0.8 for more spacing
        
        // Continuous spawn mode: alternates between enemy types
        this.continuousMode = true;
        this.spawnPatternIndex = 0;
        // Updated pattern: 2 basic, 1 beefy, 1 knight, 1 shield knight, 1 mage, 1 villager, 1 archer, 1 frog
        this.spawnPattern = ['basic', 'basic', 'beefyenemy', 'knight', 'shieldknight', 'mage', 'villager', 'archer', 'frog'];
        
        console.log('EnemyManager initialized with path:', this.path);
    }
    
    updatePath(newPath) {
        this.path = newPath;
        console.log('EnemyManager path updated:', this.path);
    }
    
    spawnWave(waveNumber, count, health = 50, speed = 50, spawnInterval = 1.0, enemyType = 'basic') {
        console.log(`Spawning wave ${waveNumber} with ${count} enemies (HP: ${health}, Speed: ${speed}, Type: ${enemyType})`);
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
        console.log(`Spawning wave ${waveNumber} with pattern`, pattern);
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
        
        console.log('EnemyManager: Started continuous spawn with interval:', this.spawnInterval, 'pattern:', this.spawnPattern);
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
            
            console.log(`EnemyManager: Queued ${enemyType} (index: ${this.spawnPatternIndex - 1})`);
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
                    console.log(`✓ Spawned ${enemyData.type} enemy (total: ${this.enemies.length})`);
                    console.log(`Next in pattern: ${this.spawnPattern[this.spawnPatternIndex % this.spawnPattern.length]}`);
                }
            }
        } else if (!this.continuousMode) {
            this.spawning = false;
        }
        
        this.enemies.forEach(enemy => enemy.update(deltaTime));
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
        let killedCount = 0;
        this.enemies = this.enemies.filter(enemy => {
            if (enemy.isDead()) {
                killedCount++;
                return false;
            }
            return true;
        });
        return killedCount;
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
        
        this.enemies.forEach(enemy => enemy.render(ctx));
    }
}
