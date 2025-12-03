import { BasicEnemy } from './BasicEnemy.js';
import { BeefyEnemy } from './BeefyEnemy.js';
import { ArcherEnemy } from './ArcherEnemy.js';
import { VillagerEnemy } from './VillagerEnemy.js';

export class EnemyManager {
    constructor(path) {
        this.path = path;
        this.enemies = [];
        this.spawning = true;
        this.spawnQueue = [];
        this.spawnTimer = 0;
        this.spawnInterval = 0.8; // seconds between spawns
        
        // Continuous spawn mode: alternates between enemy types
        this.continuousMode = true;
        this.spawnPatternIndex = 0;
        // Updated pattern: 1 basic, 1 beefy, 1 villager (cycles through all three)
        this.spawnPattern = ['basic', 'beefyenemy', 'villager', 'archer'];
        
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
    
    startContinuousSpawn(spawnInterval = 0.6, pattern = null) {
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
            
            let health = 100;
            let speed = 50;
            
            if (enemyType === 'beefyenemy') {
                health = 150;
                speed = 60;
            }
            
            this.spawnQueue.push({
                type: enemyType,
                health: health,
                speed: speed
            });
            this.spawnPatternIndex++;
            
            console.log(`EnemyManager: Queued ${enemyType} (index: ${this.spawnPatternIndex - 1})`);
        }
        
        if (this.spawnQueue.length > 0) {
            this.spawnTimer += deltaTime;
            
            if (this.spawnTimer >= this.spawnInterval) {
                const enemyData = this.spawnQueue.shift();
                let enemy;
                
                switch(enemyData.type) {
                    case 'beefyenemy':
                        enemy = new BeefyEnemy(this.path, enemyData.health, enemyData.speed);
                        break;
                    case 'villager':
                        enemy = new VillagerEnemy(this.path, enemyData.health, enemyData.speed);
                        break;
                    case 'archer':
                        enemy = new ArcherEnemy(this.path, enemyData.health, enemyData.speed);
                        break;
                    case 'basic':
                    default:
                        enemy = new BasicEnemy(this.path, enemyData.health, enemyData.speed);
                        break;
                }
                
                this.enemies.push(enemy);
                this.spawnTimer = 0;
                console.log(`✓ Spawned ${enemyData.type} enemy (total: ${this.enemies.length})`);
                console.log(`Next in pattern: ${this.spawnPattern[this.spawnPatternIndex % this.spawnPattern.length]}`);
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
