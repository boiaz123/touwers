import { TowerManager } from './towers/TowerManager.js';
import { EnemyManager } from './enemies/EnemyManager.js';
import { LevelFactory } from './LevelFactory.js';
import { GameState } from './GameState.js';
import { UIManager } from './UIManager.js';

export class GameplayState {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.gameState = new GameState();
        this.level = null;
        this.towerManager = null;
        this.enemyManager = null;
        this.uiManager = null;
        this.selectedTowerType = null;
        this.selectedBuildingType = null;
        this.currentLevel = 1;
        this.waveInProgress = false;
        this.waveCompleted = false;
        this.superWeaponLab = null;
        
        // NEW: Speed control (3 fixed speeds instead of cycling)
        this.gameSpeed = 1.0; // 1x, 2x, or 3x
        
        console.log('GameplayState constructor completed');
    }

    setGameSpeed(speed) {
        this.gameSpeed = speed;
        console.log(`GameplayState: Game speed set to ${speed}x`);
        this.uiManager.setGameSpeedButtonState(speed);
    }

    getAdjustedDeltaTime(deltaTime) {
        return deltaTime * this.gameSpeed;
    }
    
    async enter() {
        console.log('GameplayState: entering');
        
        // Get level info from state manager
        const levelInfo = this.stateManager.selectedLevelInfo || { id: 'level1', name: 'The King\'s Road', type: 'campaign' };
        
        // Create the level using LevelFactory
        try {
            this.level = await LevelFactory.createLevel(levelInfo.id);
            console.log(`GameplayState: Level created - ${this.level.levelName}`);
        } catch (error) {
            console.error('GameplayState: Failed to create level:', error);
            this.level = null;
            return;
        }
        
        // Reset game state for new level
        this.gameState = new GameState();
        this.currentLevel = levelInfo.id;
        this.levelType = levelInfo.type || 'campaign';
        this.levelName = levelInfo.name || 'Unknown Level';
        
        // Configure level-specific settings
        this.isSandbox = (this.levelType === 'sandbox');
        
        if (this.isSandbox) {
            this.gameState.gold = 100000;
            this.maxWavesForLevel = Infinity;
        } else {
            this.maxWavesForLevel = 100;
        }
        
        this.waveInProgress = false;
        this.waveCompleted = false;
        
        // Ensure UI is visible
        const statsBar = document.getElementById('stats-bar');
        const sidebar = document.getElementById('tower-sidebar');
        
        if (statsBar) {
            statsBar.style.display = 'flex';
            console.log('GameplayState: Stats bar shown');
        }
        if (sidebar) {
            sidebar.style.display = 'flex';
            console.log('GameplayState: Sidebar shown');
        }
        
        // Initialize level for current canvas size first
        console.log('GameplayState: Initializing level for canvas:', this.stateManager.canvas.width, 'x', this.stateManager.canvas.height);
        this.level.initializeForCanvas(this.stateManager.canvas.width, this.stateManager.canvas.height);
        
        // Create new enemy manager with the properly initialized path
        console.log('GameplayState: Creating enemy manager with path:', this.level.path);
        this.enemyManager = new EnemyManager(this.level.path);
        
        // Recreate tower manager to ensure it has the updated level reference
        this.towerManager = new TowerManager(this.gameState, this.level);
        
        // New: Initialize unlock system with superweapon unlocked in sandbox
        if (this.isSandbox) {
            const unlockSystem = this.towerManager.getUnlockSystem();
            unlockSystem.superweaponUnlocked = true;
            console.log('GameplayState: SANDBOX MODE - superweapon unlocked');
        }
        
        // SANDBOX: Force gem initialization IMMEDIATELY after tower manager creation
        if (this.isSandbox) {
            console.log('GameplayState: SANDBOX MODE - Initializing gems immediately');
            this.initializeSandboxGems();
        }
        
        // Initialize UI Manager
        this.uiManager = new UIManager(this);
        
        this.setupEventListeners();
        this.uiManager.setupSpellUI(); // Setup spell UI through UIManager
        this.uiManager.updateUI(); // Initial UI update through UIManager
        this.startWave();
        console.log(`GameplayState: Initialized ${this.levelName} (${this.levelType})`);
        console.log('GameplayState: enter completed');
    }
    
    initializeSandboxGems() {
        // Called ONLY in sandbox mode to force gem initialization
        console.log('GameplayState: initializeSandboxGems called');
        
        // Access building manager directly
        if (!this.towerManager || !this.towerManager.buildingManager) {
            console.error('GameplayState: Tower manager or building manager not available!');
            return;
        }
        
        const buildingManager = this.towerManager.buildingManager;
        console.log('GameplayState: Building manager found, buildings:', buildingManager.buildings.length);
        
        // Find academy
        let academy = buildingManager.buildings.find(b => b.constructor.name === 'MagicAcademy');
        
        if (academy) {
            console.log('GameplayState: Academy found! Initializing gems...');
            
            // Force initialize all gem values
            if (!academy.gems) {
                academy.gems = {};
            }
            
            academy.gems.fire = 100;
            academy.gems.water = 100;
            academy.gems.air = 100;
            academy.gems.earth = 100;
            academy.gems.diamond = 100;
            
            // Unlock diamond mining
            academy.diamondMiningUnlocked = true;
            
            // Do NOT set gemMiningResearched - keep it as an available research
            academy.gemMiningResearched = false;
            
            console.log('GameplayState: Sandbox gems initialized:', academy.gems);
            console.log('GameplayState: Diamond mining unlocked:', academy.diamondMiningUnlocked);
            
            // Enable gem toggle on all existing mines
            buildingManager.buildings.forEach(building => {
                if (building.constructor.name === 'GoldMine') {
                    building.setAcademy(academy);
                    building.gemMiningUnlocked = true; // Force enable toggle
                    console.log('GameplayState: Mine gem toggle enabled for sandbox');
                }
            });
            
            console.log('GameplayState: Sandbox gem initialization complete!');
        } else {
            console.error('GameplayState: Academy NOT FOUND in building manager!');
            console.log('GameplayState: Available buildings:', 
                buildingManager.buildings.map(b => b.constructor.name)
            );
            console.log('GameplayState: Will retry gem initialization when academy is built');
        }
    }
    
    exit() {
        // Clean up event listeners when leaving game state
        this.removeEventListeners();
        if (this.uiManager) {
            this.uiManager.removeUIEventListeners();
        }
    }
    
    setupEventListeners() {
        // Remove existing listeners first to avoid duplicates
        this.removeEventListeners();
        
        // Setup UI event listeners through UIManager
        if (this.uiManager) {
            this.uiManager.setupUIEventListeners();
        }
        
        // Mouse move listener for placement preview
        this.mouseMoveHandler = (e) => this.handleMouseMove(e);
        this.stateManager.canvas.addEventListener('mousemove', this.mouseMoveHandler);
        
        // FIXED: Unified click handler that properly routes all menu types
        this.clickHandler = (e) => {
            const rect = this.stateManager.canvas.getBoundingClientRect();
            const canvasX = e.clientX - rect.left;
            const canvasY = e.clientY - rect.top;
            
            // Check for building/tower clicks first
            const clickResult = this.towerManager.handleClick(canvasX, canvasY, rect);
            
            if (clickResult) {
                if (clickResult.type === 'forge_menu') {
                    this.uiManager.showForgeUpgradeMenu(clickResult);
                    return;
                } else if (clickResult.type === 'academy_menu') {
                    this.uiManager.showAcademyUpgradeMenu(clickResult);
                    return;
                } else if (clickResult.type === 'castle_menu') {
                    this.uiManager.showCastleUpgradeMenu(clickResult);
                    return;
                } else if (clickResult.type === 'magic_tower_menu') {
                    this.uiManager.showMagicTowerElementMenu(clickResult);
                    return;
                } else if (clickResult.type === 'combination_tower_menu') {
                    this.uiManager.showCombinationTowerMenu(clickResult);
                    return;
                } else if (clickResult.type === 'basic_tower_stats') {
                    this.uiManager.showBasicTowerStatsMenu(clickResult);
                    return;
                } else if (clickResult.type === 'superweapon_menu') {
                    this.uiManager.showSuperWeaponMenu(clickResult);
                    return;
                } else if (typeof clickResult === 'number') {
                    this.gameState.gold += clickResult;
                    this.uiManager.updateUI();
                    return;
                }
            }
            
            // Handle regular tower/building placement
            this.handleClick(canvasX, canvasY);
        };
        this.stateManager.canvas.addEventListener('click', this.clickHandler);
    }
    
    removeEventListeners() {
        // Clean up event listeners properly
        document.querySelectorAll('.tower-btn, .building-btn, .spell-btn').forEach(btn => {
            btn.replaceWith(btn.cloneNode(true));
        });
        
        if (this.mouseMoveHandler) {
            this.stateManager.canvas.removeEventListener('mousemove', this.mouseMoveHandler);
            this.mouseMoveHandler = null;
        }
        
        if (this.clickHandler) {
            this.stateManager.canvas.removeEventListener('click', this.clickHandler);
            this.clickHandler = null;
        }
    }
    
    handleMouseMove(e) {
        if (!this.selectedTowerType && !this.selectedBuildingType) {
            this.level.setPlacementPreview(0, 0, false);
            return;
        }
        
        const rect = this.stateManager.canvas.getBoundingClientRect();
        // Account for CSS scaling
        const scaleX = this.stateManager.canvas.width / rect.width;
        const scaleY = this.stateManager.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        const size = this.selectedBuildingType ? 4 : 2;
        this.level.setPlacementPreview(x, y, true, this.towerManager, size);
    }
    
    activateSpellTargeting(spellId) {
        this.selectedSpell = spellId;
        this.stateManager.canvas.style.cursor = 'crosshair';
        
        // Add temporary click handler for spell targeting
        this.spellTargetHandler = (e) => {
            const rect = this.stateManager.canvas.getBoundingClientRect();
            const scaleX = this.stateManager.canvas.width / rect.width;
            const scaleY = this.stateManager.canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            
            this.castSpellAtPosition(this.selectedSpell, x, y);
            this.cancelSpellTargeting();
        };
        
        this.stateManager.canvas.addEventListener('click', this.spellTargetHandler, { once: true });
        
        // Allow right-click to cancel
        this.spellCancelHandler = (e) => {
            e.preventDefault();
            this.cancelSpellTargeting();
        };
        this.stateManager.canvas.addEventListener('contextmenu', this.spellCancelHandler, { once: true });
    }
    
    cancelSpellTargeting() {
        this.selectedSpell = null;
        this.stateManager.canvas.style.cursor = 'default';
        
        if (this.spellTargetHandler) {
            this.stateManager.canvas.removeEventListener('click', this.spellTargetHandler);
            this.spellTargetHandler = null;
        }
        if (this.spellCancelHandler) {
            this.stateManager.canvas.removeEventListener('contextmenu', this.spellCancelHandler);
            this.spellCancelHandler = null;
        }
    }
    
    castSpellAtPosition(spellId, x, y) {
        if (!this.superWeaponLab) return;
        
        const result = this.superWeaponLab.castSpell(spellId, this.enemyManager.enemies, x, y);
        if (!result) return;
        
        const { spell } = result;
        
        // Apply spell effects to enemies
        switch(spellId) {
            case 'arcaneBlast':
                this.enemyManager.enemies.forEach(enemy => {
                    const dist = Math.hypot(enemy.x - x, enemy.y - y);
                    if (dist <= spell.radius) {
                        const damage = spell.damage * (1 - dist / spell.radius * 0.5);
                        enemy.takeDamage(damage);
                    }
                });
                this.createSpellEffect('arcaneBlast', x, y, spell);
                break;
                
            case 'frostNova':
                this.enemyManager.enemies.forEach(enemy => {
                    const dist = Math.hypot(enemy.x - x, enemy.y - y);
                    if (dist <= spell.radius) {
                        enemy.freezeTimer = spell.freezeDuration;
                        enemy.originalSpeed = enemy.originalSpeed || enemy.speed;
                        enemy.speed = 0;
                    }
                });
                this.createSpellEffect('frostNova', x, y, spell);
                break;
                
            case 'meteorStrike':
                // Delayed damage for meteor
                setTimeout(() => {
                    this.enemyManager.enemies.forEach(enemy => {
                        const dist = Math.hypot(enemy.x - x, enemy.y - y);
                        if (dist <= 80) {
                            enemy.takeDamage(spell.damage);
                            enemy.burnTimer = spell.burnDuration;
                            enemy.burnDamage = spell.burnDamage;
                        }
                    });
                }, 500);
                this.createSpellEffect('meteorStrike', x, y, spell);
                break;
                
            case 'chainLightning':
                let targets = [...this.enemyManager.enemies]
                    .sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))
                    .slice(0, spell.chainCount);
                
                targets.forEach((enemy, index) => {
                    setTimeout(() => {
                        enemy.takeDamage(spell.damage * Math.pow(0.8, index));
                    }, index * 100);
                });
                this.createSpellEffect('chainLightning', x, y, spell, targets);
                break;
        }
        
        this.updateSpellUI();
    }
    
    createSpellEffect(type, x, y, spell, targets) {
        // Visual spell effects would be rendered here
        // For now, just log
        console.log(`Spell effect: ${type} at (${x}, ${y})`);
    }
    
    handleClick(x, y) {
        const clickResult = this.towerManager.handleClick(x, y, { 
            width: this.stateManager.canvas.width, 
            height: this.stateManager.canvas.height 
        });
        
        if (clickResult) {
            if (clickResult.type === 'forge_menu') {
                this.uiManager.showForgeUpgradeMenu(clickResult);
                return;
            } else if (clickResult.type === 'academy_menu') {
                this.uiManager.showAcademyUpgradeMenu(clickResult);
                return;
            } else if (clickResult.type === 'castle_menu') {
                this.uiManager.showCastleUpgradeMenu(clickResult);
                return;
            } else if (clickResult.type === 'magic_tower_menu') {
                this.uiManager.showMagicTowerElementMenu(clickResult);
                return;
            } else if (clickResult.type === 'combination_tower_menu') {
                this.uiManager.showCombinationTowerMenu(clickResult);
                return;
            } else if (clickResult.type === 'basic_tower_stats') {
                this.uiManager.showBasicTowerStatsMenu(clickResult);
                return;
            } else if (clickResult.type === 'superweapon_menu') {
                this.uiManager.showSuperWeaponMenu(clickResult);
                return;
            } else if (typeof clickResult === 'number') {
                this.gameState.gold += clickResult;
                this.uiManager.updateUI();
                return;
            }
        }
        
        // Handle regular tower/building placement
        if (this.selectedTowerType) {
            const { gridX, gridY } = this.level.screenToGrid(x, y);
            
            if (this.level.canPlaceTower(gridX, gridY, this.towerManager)) {
                const { screenX, screenY } = this.level.gridToScreen(gridX, gridY);
                
                if (this.towerManager.placeTower(this.selectedTowerType, screenX, screenY, gridX, gridY)) {
                    this.level.placeTower(gridX, gridY);
                    this.uiManager.updateUI();
                    
                    this.selectedTowerType = null;
                    document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('selected'));
                    this.level.setPlacementPreview(0, 0, false);
                }
            }
        } else if (this.selectedBuildingType) {
            const { gridX, gridY } = this.level.screenToGrid(x, y);
            
            if (this.level.canPlaceBuilding(gridX, gridY, 4, this.towerManager)) {
                const { screenX, screenY } = this.level.gridToScreen(gridX, gridY, 4);
                
                if (this.towerManager.placeBuilding(this.selectedBuildingType, screenX, screenY, gridX, gridY)) {
                    this.level.placeBuilding(gridX, gridY, 4);
                    
                    // SANDBOX: If academy was just built, initialize gems immediately
                    if (this.isSandbox && this.selectedBuildingType === 'academy') {
                        console.log('GameplayState: Academy just built in sandbox, initializing gems...');
                        setTimeout(() => this.initializeSandboxGems(), 50); // Small delay to ensure building is registered
                    }
                    
                    this.uiManager.updateUI();
                    
                    this.selectedBuildingType = null;
                    document.querySelectorAll('.building-btn').forEach(b => b.classList.remove('selected'));
                    this.level.setPlacementPreview(0, 0, false);
                }
            }
        }
    }
    
    getBuildingCost(buildingType) {
        const costs = {
            'mine': 200,
            'forge': 300,
            'academy': 250,
            'superweapon': 500
        };
        return costs[buildingType] || 0;
    }
    
    getWaveConfig(level, wave) {
        if (this.levelType === 'sandbox') {
            // Sandbox mode: continuously increasing difficulty
            const baseEnemies = 8;
            const baseHealth_multiplier = 1.0;
            const baseSpeed = 40;
            
            return {
                enemyCount: baseEnemies + Math.floor(wave * 1.2),
                enemyHealth_multiplier: baseHealth_multiplier + (wave - 1) * 0.05,
                enemySpeed: Math.min(100, baseSpeed + (wave - 1) * 2),
                spawnInterval: Math.max(0.3, 1.0 - (wave - 1) * 0.03)
            };
        }
        
        // Get wave config from the level itself
        if (this.level && typeof this.level.getWaveConfig === 'function') {
            const config = this.level.getWaveConfig(wave);
            return {
                enemyCount: config.enemyCount,
                enemyHealth_multiplier: config.enemyHealth_multiplier,
                enemySpeed: config.enemySpeed,
                spawnInterval: config.spawnInterval,
                wavePattern: config.pattern
            };
        }
        
        // Fallback default
        return {
            enemyCount: 10,
            enemyHealth: 100,
            enemySpeed: 50,
            spawnInterval: 1.0
        };
    }
    
    startWave() {
        if (!this.isSandbox && this.gameState.wave > this.maxWavesForLevel) {
            this.completeLevel();
            return;
        }
        
        console.log(`Starting wave ${this.gameState.wave} of ${this.levelName}`);
        this.waveInProgress = true;
        this.waveCompleted = false;
        
        if (this.isSandbox) {
            // Sandbox mode: continuous spawning with all enemy types
            console.log('GameplayState: Starting sandbox continuous spawn mode');
            this.enemyManager.startContinuousSpawn(0.6, ['basic', 'villager', 'beefyenemy', 'archer', 'mage', 'knight', 'shieldknight', 'frog']);
        } else {
            // Campaign mode: traditional wave spawning
            const waveConfig = this.getWaveConfig(this.currentLevel, this.gameState.wave);
            
            if (waveConfig.wavePattern) {
                // Use custom pattern from level
                this.enemyManager.spawnWaveWithPattern(
                    this.gameState.wave,
                    waveConfig.enemyCount,
                    waveConfig.enemyHealth_multiplier,
                    waveConfig.enemySpeed,
                    waveConfig.spawnInterval,
                    waveConfig.wavePattern
                );
            } else {
                // Use standard spawning
                this.enemyManager.spawnWave(
                    this.gameState.wave, 
                    waveConfig.enemyCount,
                    waveConfig.enemyHealth_multiplier,
                    waveConfig.enemySpeed,
                    waveConfig.spawnInterval
                );
            }
        }
        
        this.uiManager.updateUI();
    }
    
    completeLevel() {
        if (this.isSandbox) {
            // Sandbox mode doesn't end, just continue
            return;
        }
        alert(`Congratulations! You completed Level ${this.currentLevel}!\n\nFinal Stats:\n- Waves Completed: ${this.maxWavesForLevel}\n- Health Remaining: ${this.gameState.health}\n- Gold Earned: ${this.gameState.gold}`);
        this.stateManager.changeState('levelSelect');
    }
    
    update(deltaTime) {
        this.enemyManager.update(deltaTime);
        this.towerManager.update(deltaTime, this.enemyManager.enemies);
        
        // Update freeze timers and handle castle attacks
        this.enemyManager.enemies.forEach(enemy => {
            if (enemy.freezeTimer > 0) {
                enemy.freezeTimer -= deltaTime;
                if (enemy.freezeTimer <= 0 && enemy.originalSpeed) {
                    enemy.speed = enemy.originalSpeed;
                }
            }
            
            // Have enemies attack the castle if they reached the end
            if (enemy.reachedEnd && this.level.castle) {
                enemy.isAttackingCastle = true;
                enemy.attackCastle(this.level.castle, deltaTime);
            }
        });
        
        // Check if castle is destroyed
        if (this.level.castle && this.level.castle.isDestroyed()) {
            this.gameOver();
            return;
        }
        
        const killedEnemies = this.enemyManager.removeDeadEnemies();
        if (killedEnemies > 0) {
            const goldPerEnemy = 10 + Math.floor(this.gameState.wave / 2);
            this.gameState.gold += killedEnemies * goldPerEnemy;
            this.uiManager.updateUI();
        }
        
        // Check if wave is completed
        if (this.waveInProgress && this.enemyManager.enemies.length === 0 && !this.enemyManager.spawning) {
            this.waveInProgress = false;
            this.waveCompleted = true;
            
            console.log(`Wave ${this.gameState.wave} completed`);
            
            setTimeout(() => {
                this.gameState.wave++;
                this.startWave();
            }, 2000);
        }
        
        // Update spell UI - only updates displays, doesn't recreate every frame
        this.uiManager.updateSpellUI();
    }
    
    gameOver() {
        console.log('Game Over! Castle destroyed.');
        this.waveInProgress = false;
        this.stateManager.changeState('levelSelect');
    }
    
    render(ctx) {
        this.level.render(ctx);
        this.towerManager.render(ctx);
        this.enemyManager.render(ctx);
    }
    
    resize() {
        this.level.initializeForCanvas(this.stateManager.canvas.width, this.stateManager.canvas.height);
        this.towerManager.updatePositions(this.level);
    }
}