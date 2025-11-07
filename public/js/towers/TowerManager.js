import { BasicTower } from './BasicTower.js';
import { CannonTower } from './CannonTower.js';
import { ArcherTower } from './ArcherTower.js';
import { MagicTower } from './MagicTower.js';

export class TowerManager {
    constructor(gameState, level) {
        this.gameState = gameState;
        this.level = level;
        this.towers = [];
        this.buildings = []; // Add buildings array
        this.towerTypes = {
            'basic': { class: BasicTower, cost: 50 },
            'cannon': { class: CannonTower, cost: 100 },
            'archer': { class: ArcherTower, cost: 75 },
            'magic': { class: MagicTower, cost: 150 }
        };
        this.buildingTypes = {
            'mine': { class: null, cost: 200, size: 4 },
            'forge': { class: null, cost: 300, size: 4 },
            'academy': { class: null, cost: 250, size: 4 },
            'superweapon': { class: null, cost: 500, size: 4 }
        };
        // Track occupied grid positions by towers and buildings
        this.occupiedPositions = new Set();
        
        // Building effects
        this.goldPerSecond = 0;
        this.towerUpgrades = {
            damage: 1.0,
            range: 1.0,
            fireRate: 1.0
        };
        this.availableSkills = [];
        this.superWeaponUnlocked = false;
    }
    
    placeTower(type, x, y, gridX, gridY) {
        const towerType = this.towerTypes[type];
        if (!towerType) return false;
        
        // Check if the position is already occupied by another tower
        if (this.isTowerPositionOccupied(gridX, gridY)) {
            console.log('TowerManager: Position already occupied by another tower');
            return false;
        }
        
        if (this.gameState.spend(towerType.cost)) {
            const tower = new towerType.class(x, y, gridX, gridY);
            this.towers.push(tower);
            
            // Mark the 2x2 area as occupied by this tower
            this.markTowerPosition(gridX, gridY);
            
            console.log(`TowerManager: Placed ${type} tower at grid (${gridX}, ${gridY})`);
            return true;
        }
        return false;
    }
    
    placeBuilding(type, x, y, gridX, gridY) {
        const buildingType = this.buildingTypes[type];
        if (!buildingType) return false;
        
        // Check if the 4x4 position is available
        if (this.isBuildingPositionOccupied(gridX, gridY, buildingType.size)) {
            console.log('TowerManager: Building position occupied');
            return false;
        }
        
        if (this.gameState.spend(buildingType.cost)) {
            const building = this.createBuilding(type, x, y, gridX, gridY);
            this.buildings.push(building);
            
            // Mark the 4x4 area as occupied
            this.markBuildingPosition(gridX, gridY, buildingType.size);
            
            // Apply building effects
            this.applyBuildingEffect(type);
            
            console.log(`TowerManager: Placed ${type} building at grid (${gridX}, ${gridY})`);
            return true;
        }
        return false;
    }
    
    createBuilding(type, x, y, gridX, gridY) {
        const baseBuilding = {
            type: type,
            x: x,
            y: y,
            gridX: gridX,
            gridY: gridY,
            size: 4,
            animationTime: 0
        };
        
        switch (type) {
            case 'mine':
                return {
                    ...baseBuilding,
                    goldPerSecond: 2,
                    smokePuffs: [],
                    nextSmokeTime: 0
                };
            case 'forge':
                return {
                    ...baseBuilding,
                    upgradeRadius: 200,
                    sparks: [],
                    nextSparkTime: 0
                };
            case 'academy':
                return {
                    ...baseBuilding,
                    manaRegenRate: 1,
                    currentMana: 100,
                    maxMana: 100,
                    magicParticles: []
                };
            case 'superweapon':
                return {
                    ...baseBuilding,
                    chargeLevel: 0,
                    maxCharge: 100,
                    isCharging: true,
                    energyBeams: []
                };
        }
        return baseBuilding;
    }
    
    isBuildingPositionOccupied(gridX, gridY, size) {
        // Check if any part of the building area is occupied
        for (let x = gridX; x < gridX + size; x++) {
            for (let y = gridY; y < gridY + size; y++) {
                if (this.occupiedPositions.has(`${x},${y}`)) {
                    return true;
                }
            }
        }
        return false;
    }
    
    isTowerPositionOccupied(gridX, gridY) {
        // Check if any part of the 2x2 tower area is occupied
        for (let x = gridX; x < gridX + 2; x++) {
            for (let y = gridY; y < gridY + 2; y++) {
                if (this.occupiedPositions.has(`${x},${y}`)) {
                    return true;
                }
            }
        }
        return false;
    }
    
    markBuildingPosition(gridX, gridY, size) {
        // Mark the building area as occupied
        for (let x = gridX; x < gridX + size; x++) {
            for (let y = gridY; y < gridY + size; y++) {
                this.occupiedPositions.add(`${x},${y}`);
            }
        }
    }
    
    markTowerPosition(gridX, gridY) {
        // Mark the 2x2 area as occupied
        for (let x = gridX; x < gridX + 2; x++) {
            for (let y = gridY; y < gridY + 2; y++) {
                this.occupiedPositions.add(`${x},${y}`);
            }
        }
    }
    
    applyBuildingEffect(type) {
        switch (type) {
            case 'mine':
                this.goldPerSecond += 2;
                break;
            case 'forge':
                this.towerUpgrades.damage *= 1.25;
                this.towerUpgrades.range *= 1.15;
                break;
            case 'academy':
                this.availableSkills.push('fireball', 'freeze', 'lightning');
                break;
            case 'superweapon':
                this.superWeaponUnlocked = true;
                this.buildingTypes.combo = { class: null, cost: 400, size: 2 };
                break;
        }
    }
    
    removeTower(tower) {
        const index = this.towers.indexOf(tower);
        if (index !== -1) {
            this.towers.splice(index, 1);
            
            // Free up the occupied positions
            for (let x = tower.gridX; x < tower.gridX + 2; x++) {
                for (let y = tower.gridY; y < tower.gridY + 2; y++) {
                    this.occupiedPositions.delete(`${x},${y}`);
                }
            }
        }
    }
    
    update(deltaTime, enemies) {
        this.towers.forEach(tower => tower.update(deltaTime, enemies));
        
        // Update buildings
        this.buildings.forEach(building => {
            building.animationTime += deltaTime;
            this.updateBuilding(building, deltaTime, enemies);
        });
        
        // Apply passive gold generation
        if (this.goldPerSecond > 0) {
            this.gameState.gold += this.goldPerSecond * deltaTime;
        }
    }
    
    updateBuilding(building, deltaTime, enemies) {
        switch (building.type) {
            case 'mine':
                // Generate smoke puffs
                building.nextSmokeTime -= deltaTime;
                if (building.nextSmokeTime <= 0) {
                    building.smokePuffs.push({
                        x: building.x + (Math.random() - 0.5) * 60,
                        y: building.y - 40,
                        vx: (Math.random() - 0.5) * 20,
                        vy: -30 - Math.random() * 20,
                        life: 3,
                        maxLife: 3,
                        size: Math.random() * 8 + 4
                    });
                    building.nextSmokeTime = 0.5 + Math.random() * 1.0;
                }
                
                // Update smoke
                building.smokePuffs = building.smokePuffs.filter(smoke => {
                    smoke.x += smoke.vx * deltaTime;
                    smoke.y += smoke.vy * deltaTime;
                    smoke.life -= deltaTime;
                    smoke.size += deltaTime * 2;
                    return smoke.life > 0;
                });
                break;
                
            case 'forge':
                // Generate sparks
                building.nextSparkTime -= deltaTime;
                if (building.nextSparkTime <= 0) {
                    for (let i = 0; i < 3; i++) {
                        building.sparks.push({
                            x: building.x + (Math.random() - 0.5) * 40,
                            y: building.y + (Math.random() - 0.5) * 40,
                            vx: (Math.random() - 0.5) * 100,
                            vy: (Math.random() - 0.5) * 100,
                            life: 0.5,
                            maxLife: 0.5
                        });
                    }
                    building.nextSparkTime = 0.2 + Math.random() * 0.3;
                }
                
                building.sparks = building.sparks.filter(spark => {
                    spark.x += spark.vx * deltaTime;
                    spark.y += spark.vy * deltaTime;
                    spark.life -= deltaTime;
                    return spark.life > 0;
                });
                break;
                
            case 'academy':
                // Generate magic particles and regenerate mana
                building.currentMana = Math.min(building.maxMana, building.currentMana + building.manaRegenRate * deltaTime);
                
                if (Math.random() < deltaTime * 2) {
                    building.magicParticles.push({
                        x: building.x + (Math.random() - 0.5) * 80,
                        y: building.y + (Math.random() - 0.5) * 80,
                        vx: (Math.random() - 0.5) * 30,
                        vy: (Math.random() - 0.5) * 30,
                        life: 2,
                        maxLife: 2,
                        color: `hsl(${Math.random() * 60 + 240}, 70%, 60%)`
                    });
                }
                
                building.magicParticles = building.magicParticles.filter(particle => {
                    particle.x += particle.vx * deltaTime;
                    particle.y += particle.vy * deltaTime;
                    particle.life -= deltaTime;
                    return particle.life > 0;
                });
                break;
                
            case 'superweapon':
                // Charge the super weapon
                if (building.isCharging && building.chargeLevel < building.maxCharge) {
                    building.chargeLevel += deltaTime * 2; // 50 seconds to full charge
                }
                
                // Generate energy beams
                if (Math.random() < deltaTime * 5) {
                    building.energyBeams.push({
                        startAngle: Math.random() * Math.PI * 2,
                        endAngle: Math.random() * Math.PI * 2,
                        life: 0.3,
                        maxLife: 0.3,
                        intensity: Math.random()
                    });
                }
                
                building.energyBeams = building.energyBeams.filter(beam => {
                    beam.life -= deltaTime;
                    return beam.life > 0;
                });
                break;
        }
    }
    
    render(ctx) {
        this.towers.forEach(tower => tower.render(ctx));
        this.buildings.forEach(building => this.renderBuilding(ctx, building));
    }
    
    renderBuilding(ctx, building) {
        const baseResolution = 1920;
        const scaleFactor = Math.max(0.5, Math.min(2.5, ctx.canvas.width / baseResolution));
        const cellSize = Math.floor(32 * scaleFactor);
        const buildingSize = cellSize * building.size;
        
        // Building shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(building.x - buildingSize/2 + 5, building.y - buildingSize/2 + 5, buildingSize, buildingSize);
        
        switch (building.type) {
            case 'mine':
                this.renderMine(ctx, building, buildingSize);
                break;
            case 'forge':
                this.renderForge(ctx, building, buildingSize);
                break;
            case 'academy':
                this.renderAcademy(ctx, building, buildingSize);
                break;
            case 'superweapon':
                this.renderSuperWeapon(ctx, building, buildingSize);
                break;
        }
    }
    
    renderMine(ctx, building, size) {
        // Mine structure with stone base
        const gradient = ctx.createLinearGradient(
            building.x - size/2, building.y - size/2,
            building.x + size/2, building.y + size/2
        );
        gradient.addColorStop(0, '#8B7355');
        gradient.addColorStop(0.5, '#696969');
        gradient.addColorStop(1, '#2F2F2F');
        
        ctx.fillStyle = gradient;
        ctx.strokeStyle = '#1A1A1A';
        ctx.lineWidth = 3;
        ctx.fillRect(building.x - size/2, building.y - size/2, size, size);
        ctx.strokeRect(building.x - size/2, building.y - size/2, size, size);
        
        // Mine entrance
        ctx.fillStyle = '#000000';
        ctx.fillRect(building.x - size/4, building.y - size/6, size/2, size/3);
        
        // Support beams
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(building.x - size/4, building.y - size/6);
        ctx.lineTo(building.x - size/4, building.y + size/6);
        ctx.moveTo(building.x + size/4, building.y - size/6);
        ctx.lineTo(building.x + size/4, building.y + size/6);
        ctx.moveTo(building.x - size/4, building.y - size/6);
        ctx.lineTo(building.x + size/4, building.y - size/6);
        ctx.stroke();
        
        // Render smoke
        building.smokePuffs.forEach(smoke => {
            const alpha = smoke.life / smoke.maxLife;
            ctx.fillStyle = `rgba(100, 100, 100, ${alpha * 0.5})`;
            ctx.beginPath();
            ctx.arc(smoke.x, smoke.y, smoke.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Gold indicator
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⛏️💰', building.x, building.y + size/2 + 20);
    }
    
    renderForge(ctx, building, size) {
        // Forge structure
        const gradient = ctx.createLinearGradient(
            building.x - size/2, building.y - size/2,
            building.x + size/2, building.y + size/2
        );
        gradient.addColorStop(0, '#CD853F');
        gradient.addColorStop(0.5, '#8B4513');
        gradient.addColorStop(1, '#654321');
        
        ctx.fillStyle = gradient;
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 3;
        ctx.fillRect(building.x - size/2, building.y - size/2, size, size);
        ctx.strokeRect(building.x - size/2, building.y - size/2, size, size);
        
        // Forge fire
        const fireGlow = Math.sin(building.animationTime * 6) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255, 100, 0, ${fireGlow})`;
        ctx.fillRect(building.x - size/3, building.y - size/6, size/1.5, size/3);
        
        // Anvil
        ctx.fillStyle = '#2F2F2F';
        ctx.fillRect(building.x - size/6, building.y + size/6, size/3, size/12);
        
        // Render sparks
        building.sparks.forEach(spark => {
            const alpha = spark.life / spark.maxLife;
            ctx.fillStyle = `rgba(255, 200, 0, ${alpha})`;
            ctx.beginPath();
            ctx.arc(spark.x, spark.y, 2, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Upgrade indicator
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🔨⬆️', building.x, building.y + size/2 + 20);
    }
    
    renderAcademy(ctx, building, size) {
        // Academy tower
        const gradient = ctx.createLinearGradient(
            building.x - size/2, building.y - size/2,
            building.x + size/2, building.y + size/2
        );
        gradient.addColorStop(0, '#9370DB');
        gradient.addColorStop(0.5, '#6A5ACD');
        gradient.addColorStop(1, '#483D8B');
        
        ctx.fillStyle = gradient;
        ctx.strokeStyle = '#2E0A4F';
        ctx.lineWidth = 3;
        
        // Main tower
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const x = building.x + Math.cos(angle) * size/2;
            const y = building.y + Math.sin(angle) * size/2;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Crystal on top
        const crystalPulse = Math.sin(building.animationTime * 4) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(138, 43, 226, ${crystalPulse})`;
        ctx.beginPath();
        ctx.arc(building.x, building.y - size/3, size/8, 0, Math.PI * 2);
        ctx.fill();
        
        // Render magic particles
        building.magicParticles.forEach(particle => {
            const alpha = particle.life / particle.maxLife;
            ctx.fillStyle = particle.color.replace(')', `, ${alpha})`).replace('hsl', 'hsla');
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Mana bar
        const barWidth = size * 0.8;
        const barHeight = 8;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(building.x - barWidth/2, building.y + size/2 + 10, barWidth, barHeight);
        ctx.fillStyle = '#4169E1';
        ctx.fillRect(building.x - barWidth/2, building.y + size/2 + 10, 
                     barWidth * (building.currentMana / building.maxMana), barHeight);
        
        // Skills indicator
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🎓⚡', building.x, building.y + size/2 + 35);
    }
    
    renderSuperWeapon(ctx, building, size) {
        // Super weapon facility
        const gradient = ctx.createLinearGradient(
            building.x - size/2, building.y - size/2,
            building.x + size/2, building.y + size/2
        );
        gradient.addColorStop(0, '#B0C4DE');
        gradient.addColorStop(0.5, '#708090');
        gradient.addColorStop(1, '#2F4F4F');
        
        ctx.fillStyle = gradient;
        ctx.strokeStyle = '#1C1C1C';
        ctx.lineWidth = 4;
        ctx.fillRect(building.x - size/2, building.y - size/2, size, size);
        ctx.strokeRect(building.x - size/2, building.y - size/2, size, size);
        
        // Energy core
        const energyPulse = Math.sin(building.animationTime * 8) * 0.4 + 0.6;
        const coreGradient = ctx.createRadialGradient(
            building.x, building.y, 0,
            building.x, building.y, size/4
        );
        coreGradient.addColorStop(0, `rgba(0, 255, 255, ${energyPulse})`);
        coreGradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
        
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(building.x, building.y, size/4, 0, Math.PI * 2);
        ctx.fill();
        
        // Render energy beams
        building.energyBeams.forEach(beam => {
            const alpha = beam.life / beam.maxLife;
            ctx.strokeStyle = `rgba(0, 255, 255, ${alpha * beam.intensity})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(building.x, building.y);
            ctx.lineTo(
                building.x + Math.cos(beam.startAngle) * size/2,
                building.y + Math.sin(beam.startAngle) * size/2
            );
            ctx.stroke();
        });
        
        // Charge bar
        const barWidth = size * 0.9;
        const barHeight = 12;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(building.x - barWidth/2, building.y + size/2 + 10, barWidth, barHeight);
        ctx.fillStyle = '#00FFFF';
        ctx.fillRect(building.x - barWidth/2, building.y + size/2 + 10, 
                     barWidth * (building.chargeLevel / building.maxCharge), barHeight);
        
        // Super weapon indicator
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⚡🚀', building.x, building.y + size/2 + 35);
    }
    
    getTowerInfo(type) {
        const towerType = this.towerTypes[type];
        if (towerType && towerType.class.getInfo) {
            return towerType.class.getInfo();
        }
        return null;
    }
    
    getBuildingInfo(type) {
        const buildingType = this.buildingTypes[type];
        if (!buildingType) return null;
        
        switch (type) {
            case 'mine':
                return {
                    name: 'Gold Mine',
                    description: 'Generates 2 gold per second passively.',
                    effect: '+2 gold/sec',
                    size: '4x4',
                    cost: buildingType.cost
                };
            case 'forge':
                return {
                    name: 'Tower Forge',
                    description: 'Upgrades all towers: +25% damage, +15% range.',
                    effect: 'Global tower boost',
                    size: '4x4',
                    cost: buildingType.cost
                };
            case 'academy':
                return {
                    name: 'Magic Academy',
                    description: 'Unlocks spells: Fireball, Freeze, Lightning.',
                    effect: 'Castable spells',
                    size: '4x4',
                    cost: buildingType.cost
                };
            case 'superweapon':
                return {
                    name: 'Super Weapon Lab',
                    description: 'Unlocks combo towers and ultimate abilities.',
                    effect: 'Advanced tech',
                    size: '4x4',
                    cost: buildingType.cost
                };
        }
        return null;
    }
}
