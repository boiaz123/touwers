import { BasicEnemy } from './BasicEnemy.js';

export class EnemyManager {
    constructor(path) {
        this.path = path;
        this.enemies = [];
        this.spawning = false;
        this.spawnQueue = [];
        this.spawnTimer = 0;
        this.spawnInterval = 1; // seconds between spawns
    }
    
    spawnWave(waveNumber, count) {
        this.spawning = true;
        this.spawnQueue = [];
        
        for (let i = 0; i < count; i++) {
            this.spawnQueue.push({
                type: 'basic',
                health: 50 + waveNumber * 10,
                speed: 50 + waveNumber * 2
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
        const scale = ctx.canvas.levelScale;
        
        this.enemies.forEach(enemy => {
            if (scale) {
                // Convert enemy world coordinates to screen coordinates
                const screenX = enemy.x * scale.scaleX + scale.offsetX;
                const screenY = enemy.y * scale.scaleY + scale.offsetY;
                enemy.render(ctx, screenX, screenY, scale.scaleX);
            } else {
                enemy.render(ctx, enemy.x, enemy.y, 1);
            }
        });
    }
}
