import { BasicEnemy } from './BasicEnemy.js';

export class EnemyManager {
    constructor(path) {
        this.path = path;
        this.enemies = [];
        this.spawning = false;
        this.spawnQueue = [];
        this.spawnTimer = 0;
        this.spawnInterval = 1; // seconds between spawns - will be overridden by wave config
        
        // Debug: log path
        console.log('EnemyManager initialized with path:', this.path);
    }
    
    updatePath(newPath) {
        this.path = newPath;
        console.log('EnemyManager path updated:', this.path);
    }
    
    spawnWave(waveNumber, count, health = 50, speed = 50, spawnInterval = 1.0) {
        console.log(`Spawning wave ${waveNumber} with ${count} enemies (HP: ${health}, Speed: ${speed})`);
        this.spawning = true;
        this.spawnQueue = [];
        this.spawnInterval = spawnInterval;
        
        for (let i = 0; i < count; i++) {
            this.spawnQueue.push({
                type: 'basic',
                health: health,
                speed: speed
            });
        }
    }
    
    update(deltaTime) {
        if (this.spawnQueue.length > 0) {
            this.spawnTimer += deltaTime;
            
            if (this.spawnTimer >= this.spawnInterval) {
                const enemyData = this.spawnQueue.shift();
                const enemy = new BasicEnemy(this.path, enemyData.health, enemyData.speed);
                this.enemies.push(enemy);
                this.spawnTimer = 0;
                console.log(`Spawned enemy, total enemies: ${this.enemies.length}`);
            }
        } else {
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
