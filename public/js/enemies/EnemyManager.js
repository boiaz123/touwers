import { BasicEnemy } from './BasicEnemy.js';

export class EnemyManager {
    constructor(path) {
        this.path = path || [];
        this.enemies = [];
        this.spawning = false;
        this.spawnQueue = [];
        this.spawnTimer = 0;
        this.spawnInterval = 1; // seconds between spawns
        
        console.log('EnemyManager initialized with path:', this.path);
    }
    
    updatePath(newPath) {
        console.log('Updating enemy path:', newPath);
        
        if (!newPath || newPath.length === 0) {
            console.warn('Invalid path provided to EnemyManager');
            return;
        }
        
        this.path = newPath;
        
        // Update existing enemies to use new path
        this.enemies.forEach(enemy => {
            enemy.updatePath(newPath);
        });
    }
    
    spawnWave(waveNumber, count) {
        console.log(`Spawning wave ${waveNumber} with ${count} enemies`);
        
        if (!this.path || this.path.length === 0) {
            console.error('Cannot spawn enemies: no path available');
            return;
        }
        
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
        if (this.spawnQueue.length > 0 && this.path.length > 0) {
            this.spawnTimer += deltaTime;
            
            if (this.spawnTimer >= this.spawnInterval) {
                const enemyData = this.spawnQueue.shift();
                const enemy = new BasicEnemy(this.path, enemyData.health, enemyData.speed);
                this.enemies.push(enemy);
                this.spawnTimer = 0;
                console.log('Spawned enemy:', enemy);
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
        this.enemies.forEach(enemy => enemy.render(ctx));
    }
}
