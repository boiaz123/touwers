import { BasicTower } from './BasicTower.js';
import { CannonTower } from './CannonTower.js';
import { ArcherTower } from './ArcherTower.js';
import { MagicTower } from './MagicTower.js';
import { BarricadeTower } from './BarricadeTower.js';
import { PoisonArcherTower } from './PoisonArcherTower.js';
import { BuildingManager } from '../buildings/BuildingManager.js';

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
        
        // Initialize building manager
        this.buildingManager = new BuildingManager(gameState, level);
        
        // Track occupied grid positions by towers only
        this.occupiedPositions = new Set();
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
        return this.buildingManager.placeBuilding(type, x, y, gridX, gridY);
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
    
    handleClick(x, y, canvasSize) {
        const result = this.buildingManager.handleClick(x, y, canvasSize);
        
        // Handle forge upgrade menu
        if (result && result.type === 'forge_menu') {
            this.showForgeUpgradeMenu(result);
        }
        
        return result;
    }
    
    showForgeUpgradeMenu(forgeData) {
        // Create and show forge upgrade menu
        const existingMenu = document.getElementById('forge-upgrade-menu');
        if (existingMenu) {
            existingMenu.remove();
        }
        
        const menuHtml = this.createForgeMenuHtml(forgeData);
        document.body.insertAdjacentHTML('beforeend', menuHtml);
        
        // Add event listeners for upgrade buttons
        this.setupForgeMenuEvents(forgeData.forge);
    }
    
    createForgeMenuHtml(forgeData) {
        const upgrades = forgeData.upgrades;
        
        let upgradesHtml = upgrades.map(upgrade => {
            const isMaxed = upgrade.level >= upgrade.maxLevel;
            const canAfford = upgrade.cost !== null && this.gameState.coins >= upgrade.cost;
            const buttonClass = isMaxed ? 'maxed' : (canAfford ? 'affordable' : 'expensive');
            const buttonText = isMaxed ? 'MAXED' : `$${upgrade.cost}`;
            
            return `
                <div class="upgrade-item">
                    <div class="upgrade-header">
                        <span class="upgrade-icon">${upgrade.icon}</span>
                        <span class="upgrade-name">${upgrade.name}</span>
                        <span class="upgrade-level">Lv. ${upgrade.level}/${upgrade.maxLevel}</span>
                    </div>
                    <div class="upgrade-description">${upgrade.description}</div>
                    <button class="upgrade-btn ${buttonClass}" 
                            data-upgrade="${upgrade.id}" 
                            ${isMaxed ? 'disabled' : ''}>
                        ${buttonText}
                    </button>
                </div>
            `;
        }).join('');
        
        return `
            <div id="forge-upgrade-menu" class="upgrade-menu">
                <div class="upgrade-menu-content">
                    <div class="upgrade-menu-header">
                        <h3>🔨 Tower Forge Upgrades</h3>
                        <button id="close-forge-menu" class="close-btn">✖</button>
                    </div>
                    <div class="upgrade-menu-body">
                        ${upgradesHtml}
                    </div>
                </div>
            </div>
        `;
    }
    
    setupForgeMenuEvents(forge) {
        const menu = document.getElementById('forge-upgrade-menu');
        
        // Close menu button
        menu.querySelector('#close-forge-menu').addEventListener('click', () => {
            menu.remove();
            forge.deselect();
        });
        
        // Click outside to close
        menu.addEventListener('click', (e) => {
            if (e.target === menu) {
                menu.remove();
                forge.deselect();
            }
        });
        
        // Upgrade buttons
        menu.querySelectorAll('.upgrade-btn:not([disabled])').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const upgradeType = e.target.dataset.upgrade;
                if (forge.purchaseUpgrade(upgradeType, this.gameState)) {
                    // Refresh menu with updated data
                    this.showForgeUpgradeMenu({
                        type: 'forge_menu',
                        forge: forge,
                        upgrades: forge.getUpgradeOptions()
                    });
                }
            });
        });
    }
    
    // Apply forge upgrades to towers
    applyForgeUpgrades(tower) {
        this.buildingManager.buildings.forEach(building => {
            if (building.constructor.name === 'TowerForge') {
                const forge = building;
                
                // Apply specific tower upgrades based on tower type
                if (tower.constructor.name === 'PoisonArcherTower' && forge.upgrades.poisonDamage.level > 0) {
                    tower.poisonDamageBonus = forge.upgrades.poisonDamage.level * forge.upgrades.poisonDamage.effect;
                }
                
                if (tower.constructor.name === 'BarricadeTower' && forge.upgrades.barricadeDamage.level > 0) {
                    tower.damageBonus = forge.upgrades.barricadeDamage.level * forge.upgrades.barricadeDamage.effect;
                }
                
                if (tower.constructor.name === 'ArcherTower' && forge.upgrades.fireArrows.level > 0) {
                    tower.fireArrowsLevel = forge.upgrades.fireArrows.level;
                }
                
                if (tower.constructor.name === 'CannonTower' && forge.upgrades.explosiveRadius.level > 0) {
                    tower.blastRadiusBonus = forge.upgrades.explosiveRadius.level * forge.upgrades.explosiveRadius.effect;
                }
            }
        });
    }
    
    update(deltaTime, enemies) {
        // Apply building upgrades to towers
        const upgrades = this.buildingManager.towerUpgrades;
        
        this.towers.forEach(tower => {
            // Store original values if not already stored
            if (!tower.originalDamage) {
                tower.originalDamage = tower.damage;
                tower.originalRange = tower.range;
                tower.originalFireRate = tower.fireRate;
            }
            
            // Apply upgrades
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
    
    render(ctx) {
        this.towers.forEach(tower => tower.render(ctx));
        this.buildingManager.render(ctx);
    }
    
    getTowerInfo(type) {
        const towerType = this.towerTypes[type];
        if (towerType && towerType.class.getInfo) {
            return towerType.class.getInfo();
        }
        return null;
    }
    
    getBuildingInfo(type) {
        return this.buildingManager.getBuildingInfo(type);
    }
    
    // Getter methods to access building manager properties
    get goldPerSecond() {
        return this.buildingManager.goldPerSecond;
    }
    
    get availableSkills() {
        return this.buildingManager.availableSkills;
    }
    
    get superWeaponUnlocked() {
        return this.buildingManager.superWeaponUnlocked;
    }
    
    get buildings() {
        return this.buildingManager.buildings;
    }
    
    get buildingTypes() {
        return this.buildingManager.buildingTypes;
    }
}
