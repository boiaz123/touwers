import { BasicTower } from './BasicTower.js';
import { CannonTower } from './CannonTower.js';
import { ArcherTower } from './ArcherTower.js';
import { MagicTower } from './MagicTower.js';
import { BarricadeTower } from './BarricadeTower.js';
import { PoisonArcherTower } from './PoisonArcherTower.js';
import { BuildingManager } from '../buildings/BuildingManager.js';
import { UnlockSystem } from '../UnlockSystem.js';

export class TowerManager {
    constructor(gameState, level) {
        this.gameState = gameState;
        this.level = level;
        this.towers = [];
        this.towerTypes = {
            'basic': { class: BasicTower, cost: 50 },
            'cannon': { class: CannonTower, cost: 100 },
            'archer': { class: ArcherTower, cost: 75 },
            'magic': { class: MagicTower, cost: 150 },
            'barricade': { class: BarricadeTower, cost: 90 },
            'poison': { class: PoisonArcherTower, cost: 120 }
        };
        
        // Initialize unlock system and building manager
        this.unlockSystem = new UnlockSystem();
        this.buildingManager = new BuildingManager(gameState, level);
        
        // Track occupied grid positions by towers only
        this.occupiedPositions = new Set();
    }
    
    placeTower(type, x, y, gridX, gridY) {
        // Check if tower type is unlocked
        if (!this.unlockSystem.canBuildTower(type)) {
            console.log(`TowerManager: ${type} tower not yet unlocked`);
            return false;
        }
        
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
        // Check if building type is unlocked
        if (!this.unlockSystem.canBuildBuilding(type)) {
            console.log(`TowerManager: ${type} building not yet unlocked or limit reached`);
            return false;
        }
        
        const result = this.buildingManager.placeBuilding(type, x, y, gridX, gridY);
        
        // Handle forge building
        if (result && type === 'forge') {
            this.unlockSystem.onForgeBuilt();
            console.log('TowerManager: Forge built, new content unlocked');
        }
        
        return result;
    }
    
    isBuildingPositionOccupied(gridX, gridY, size) {
        return this.buildingManager.isBuildingPositionOccupied(gridX, gridY, size);
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
    
    markTowerPosition(gridX, gridY) {
        // Mark the 2x2 area as occupied
        for (let x = gridX; x < gridX + 2; x++) {
            for (let y = gridY; y < gridY + 2; y++) {
                this.occupiedPositions.add(`${x},${y}`);
            }
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
        // Check if any forge upgrades have changed
        const forges = this.buildingManager.buildings.filter(building => 
            building.constructor.name === 'TowerForge'
        );
        
        let upgradesChanged = false;
        forges.forEach(forge => {
            if (forge.upgradesChanged) {
                upgradesChanged = true;
                forge.upgradesChanged = false; // Reset flag
            }
        });
        
        // If upgrades changed, recalculate all tower stats
        if (upgradesChanged) {
            this.recalculateAllTowerStats();
        }
        
        // Apply building upgrades to towers
        const upgrades = this.buildingManager.towerUpgrades;
        
        this.towers.forEach(tower => {
            // Store original values if not already stored
            if (!tower.originalDamage) {
                tower.originalDamage = tower.damage;
                tower.originalRange = tower.range;
                tower.originalFireRate = tower.fireRate;
            }
            
            // Apply base building upgrades
            tower.damage = tower.originalDamage * upgrades.damage;
            tower.range = tower.originalRange * upgrades.range;
            tower.fireRate = tower.originalFireRate * upgrades.fireRate;
            
            // Apply forge-specific upgrades
            this.applyForgeUpgrades(tower);
            
            tower.update(deltaTime, enemies);
        });
        
        // Update building manager
        this.buildingManager.update(deltaTime);
    }
    
    recalculateAllTowerStats() {
        // Force recalculation of all tower stats when forge upgrades change
        this.towers.forEach(tower => {
            // Reset to original values first
            if (tower.originalDamage) {
                tower.damage = tower.originalDamage;
                tower.range = tower.originalRange;
                tower.fireRate = tower.originalFireRate;
            }
        });
        console.log('TowerManager: Recalculated all tower stats due to forge upgrade');
    }
    
    applyForgeUpgrades(tower) {
        // Get all forge upgrade multipliers
        const forges = this.buildingManager.buildings.filter(building => 
            building.constructor.name === 'TowerForge'
        );
        
        forges.forEach(forge => {
            const multipliers = forge.getUpgradeMultipliers();
            
            // Apply range upgrade to ALL towers
            tower.range *= multipliers.rangeMultiplier;
            
            // Apply specific upgrades based on tower type and unlock status
            const towerType = tower.constructor.name;
            
            switch (towerType) {
                case 'PoisonArcherTower':
                    if (this.unlockSystem.canUseUpgrade('poisonDamage')) {
                        tower.damage += multipliers.poisonDamageBonus;
                    }
                    if (this.unlockSystem.canUseUpgrade('fireArrows') && multipliers.fireArrowsEnabled) {
                        tower.hasFireArrows = true;
                    }
                    break;
                    
                case 'ArcherTower':
                    if (this.unlockSystem.canUseUpgrade('fireArrows') && multipliers.fireArrowsEnabled) {
                        tower.hasFireArrows = true;
                    }
                    break;
                    
                case 'BarricadeTower':
                case 'BasicTower':
                    if (this.unlockSystem.canUseUpgrade('barricadeDamage')) {
                        tower.damage += multipliers.barricadeDamageBonus;
                    }
                    break;
                    
                case 'CannonTower':
                    if (this.unlockSystem.canUseUpgrade('explosiveRadius') && tower.explosionRadius) {
                        tower.explosionRadius += multipliers.explosiveRadiusBonus;
                    }
                    break;
            }
        });
    }
    
    handleClick(x, y, canvasSize) {
        // First check building clicks (including forge)
        const buildingResult = this.buildingManager.handleClick(x, y, canvasSize);
        if (buildingResult && buildingResult.type === 'forge_menu') {
            // Pass unlock system to forge menu
            buildingResult.unlockSystem = this.unlockSystem;
        }
        return buildingResult;
    }
    
    render(ctx) {
        // Render all towers
        this.towers.forEach(tower => {
            tower.render(ctx);
        });
        
        // Render all buildings
        this.buildingManager.render(ctx);
    }
    
    getTowerInfo(type) {
        const towerType = this.towerTypes[type];
        if (!towerType || !towerType.class.getInfo) return null;
        
        const info = towerType.class.getInfo();
        // Add unlock status
        info.unlocked = this.unlockSystem.canBuildTower(type);
        return info;
    }
    
    getBuildingInfo(type) {
        const info = this.buildingManager.getBuildingInfo(type);
        if (info) {
            info.unlocked = this.unlockSystem.canBuildBuilding(type);
            if (type === 'forge' && this.unlockSystem.forgeCount >= this.unlockSystem.maxForges) {
                info.disabled = true;
                info.disableReason = "Only 1 forge allowed";
            }
        }
        return info;
    }
    
    getUnlockSystem() {
        return this.unlockSystem;
    }
}
