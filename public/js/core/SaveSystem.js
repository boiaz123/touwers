export class SaveSystem {
    static STORAGE_KEY = 'touwers_saves';
    static NUM_SLOTS = 3;

    /**
     * Get all saves
     */
    static getAllSaves() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        if (!data) {
            return this.initializeSaves();
        }
        return JSON.parse(data);
    }

    /**
     * Initialize saves if they don't exist
     */
    static initializeSaves() {
        const saves = {
            slot1: null,
            slot2: null,
            slot3: null
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saves));
        return saves;
    }

    /**
     * Get a specific save by slot number (1-3)
     */
    static getSave(slotNumber) {
        if (slotNumber < 1 || slotNumber > this.NUM_SLOTS) {
            console.error(`Invalid save slot: ${slotNumber}`);
            return null;
        }

        const saves = this.getAllSaves();
        const slotKey = `slot${slotNumber}`;
        return saves[slotKey];
    }

    /**
     * Save game progress to a slot
     * Can save either quick level info or full mid-game state
     */
    static saveGame(slotNumber, gameData) {
        if (slotNumber < 1 || slotNumber > this.NUM_SLOTS) {
            console.error(`Invalid save slot: ${slotNumber}`);
            return false;
        }

        const saves = this.getAllSaves();
        const slotKey = `slot${slotNumber}`;

        // Check if this is a full mid-game save (has towerManager, enemyManager, etc)
        const hasGameState = gameData.gameState && typeof gameData.gameState === 'object';
        const hasTowerManager = gameData.towerManager && typeof gameData.towerManager === 'object';
        const hasEnemyManager = gameData.enemyManager && typeof gameData.enemyManager === 'object';
        const hasLevel = gameData.level && typeof gameData.level === 'object';
        
        const isMidGameSave = hasGameState && hasTowerManager && hasEnemyManager && hasLevel;

        if (isMidGameSave) {
            console.log('SaveSystem: Saving mid-game state to slot', slotNumber);
            console.log('SaveSystem: gameData.level exists:', !!gameData.level);
            console.log('SaveSystem: gameData.level.castle exists:', !!gameData.level?.castle);
            if (gameData.level?.castle) {
                console.log('SaveSystem: Castle health:', gameData.level.castle.health, 'maxHealth:', gameData.level.castle.maxHealth);
                console.log('SaveSystem: Castle defender:', gameData.level.castle.defender);
            }
            
            // Get castle health if available
            const castleHealth = gameData.level?.castle?.health || 100;
            const castleMaxHealth = gameData.level?.castle?.maxHealth || 100;
            
            // Serialize all entities
            const towers = this.serializeTowers(gameData.towerManager);
            const enemies = this.serializeEnemies(gameData.enemyManager);
            const buildings = this.serializeBuildings(gameData.buildingManager);
            
            console.log('SaveSystem: Serialized data:', {
                towersCount: towers.length,
                enemiesCount: enemies.length,
                buildingsCount: buildings.length,
                castleHealth: castleHealth,
                gold: gameData.gameState?.gold,
                health: gameData.gameState?.health,
                wave: gameData.gameState?.wave
            });
            
            // Full mid-game save with complete state
            saves[slotKey] = {
                timestamp: new Date().toISOString(),
                isMidGameSave: true,
                currentLevel: gameData.currentLevel,
                levelType: gameData.levelType || 'campaign',
                levelName: gameData.levelName || 'Unknown',
                
                // Game state
                health: gameData.gameState?.health || 0,
                gold: gameData.gameState?.gold || 0,
                wave: gameData.gameState?.wave || 0,
                
                // Castle state
                castleHealth: castleHealth,
                castleMaxHealth: castleMaxHealth,
                
                // Progress
                lastPlayedLevel: gameData.currentLevel,
                unlockedLevels: gameData.unlockedLevels || [],
                completedLevels: gameData.completedLevels || [],
                
                // Mid-game state - serialized for restoration
                midGameState: {
                    // Game state data - must include wave for proper restoration
                    gameState: {
                        health: gameData.gameState?.health || 0,
                        gold: gameData.gameState?.gold || 0,
                        wave: gameData.gameState?.wave || 0,
                        waveInProgress: gameData.gameState?.waveInProgress || false,
                        waveCompleted: gameData.gameState?.waveCompleted || false
                    },
                    // Castle state - complete with defender and health
                    castle: (() => {
                        const castle = this.serializeCastle(gameData.level?.castle);
                        console.log('SaveSystem: serializeCastle returned:', castle);
                        return castle;
                    })(),
                    // Managers and entities
                    towers: towers,
                    enemies: enemies,
                    buildings: buildings,
                    // Complete unlock system state for proper restoration
                    unlockSystem: gameData.unlockSystem || {
                        forgeLevel: 0,
                        hasForge: false,
                        forgeCount: 0,
                        mineCount: 0,
                        academyCount: 0,
                        trainingGroundsCount: 0,
                        superweaponCount: 0,
                        guardPostCount: 0,
                        maxGuardPosts: 0,
                        superweaponUnlocked: false,
                        gemMiningResearched: false,
                        unlockedTowers: [],
                        unlockedBuildings: [],
                        unlockedUpgrades: [],
                        unlockedCombinationSpells: []
                    },
                    // Unlock system (kept for compatibility)
                    unlockedTowers: gameData.unlockedTowers || [],
                    unlockedBuildings: gameData.unlockedBuildings || [],
                    // Wave progression - save the actual wave number and spawn queue
                    waveIndex: gameData.gameState?.wave || 1,
                    spawnedEnemyCount: enemies.length,
                    totalEnemiesInWave: gameData.totalEnemiesInWave || 0,
                    spawnQueue: this.serializeSpawnQueue(gameData.enemyManager)
                }
            };
        } else {
            console.log('SaveSystem: Saving level progress to slot', slotNumber);
            
            // Simple level progress save (used when transitioning between levels)
            saves[slotKey] = {
                timestamp: new Date().toISOString(),
                isMidGameSave: false,
                lastPlayedLevel: gameData.lastPlayedLevel,
                unlockedLevels: gameData.unlockedLevels,
                completedLevels: gameData.completedLevels,
                currentLevelProgress: gameData.currentLevelProgress || {}
            };
        }

        try {
            const jsonString = JSON.stringify(saves);
            console.log('SaveSystem: JSON size:', jsonString.length, 'bytes');
            localStorage.setItem(this.STORAGE_KEY, jsonString);
            console.log('SaveSystem: Successfully saved to localStorage');
            return true;
        } catch (error) {
            console.error('SaveSystem: Failed to save to localStorage:', error);
            return false;
        }
    }

    /**
     * Serialize tower data for saving
     * Saves grid coordinates for accurate restoration
     */
    static serializeTowers(towerManager) {
        if (!towerManager || !towerManager.towers) {
            console.warn('SaveSystem: towerManager or towers array is missing');
            return [];
        }
        
        const result = towerManager.towers.map(tower => {
            const serialized = {
                type: tower.type,
                x: tower.x,
                y: tower.y,
                gridX: tower.gridX !== undefined ? tower.gridX : null,
                gridY: tower.gridY !== undefined ? tower.gridY : null,
                level: tower.level || 1,
                health: tower.health || tower.maxHealth,
                // Additional tower properties
                targetingMode: tower.targetingMode || 'strongest',
                upgrades: tower.upgrades ? { ...tower.upgrades } : undefined,
                // GuardPost defender state
                defender: tower.constructor.name === 'GuardPost' ? this.serializeDefender(tower.defender) : undefined,
                defenderDeadCooldown: tower.defenderDeadCooldown !== undefined ? tower.defenderDeadCooldown : undefined
            };
            
            console.log('SaveSystem: Serializing tower:', serialized);
            return serialized;
        });
        
        console.log('SaveSystem: Serialized', result.length, 'towers');
        return result;
    }

    /**
     * Serialize enemy data for saving
     */
    static serializeEnemies(enemyManager) {
        if (!enemyManager || !enemyManager.enemies) {
            console.warn('SaveSystem: enemyManager or enemies array is missing');
            return [];
        }
        
        const result = enemyManager.enemies.map(enemy => {
            // Log individual enemy object to see structure
            console.log('SaveSystem: Raw enemy object:', {
                type: enemy.type,
                hasType: 'type' in enemy,
                typeValue: enemy.type,
                constructor: enemy.constructor.name,
                keys: Object.keys(enemy)
            });
            
            const serialized = {
                type: enemy.type,
                x: enemy.x,
                y: enemy.y,
                currentPathIndex: enemy.currentPathIndex || 0,
                health: enemy.health,
                maxHealth: enemy.maxHealth,
                speed: enemy.speed
            };
            
            // Debug: Log enemy being serialized
            console.log('SaveSystem: Serializing enemy:', serialized);
            return serialized;
        });
        
        console.log('SaveSystem: Serialized', result.length, 'enemies');
        console.log('SaveSystem: Enemies array for JSON:', JSON.stringify(result));
        return result;
    }

    /**
     * Serialize building data for saving
     */
    static serializeBuildings(buildingManager) {
        if (!buildingManager || !buildingManager.buildings) {
            console.warn('SaveSystem: buildingManager or buildings array is missing');
            return [];
        }
        
        const result = buildingManager.buildings.map(building => {
            const serialized = {
                type: building.type,
                gridX: building.gridX,
                gridY: building.gridY,
                width: building.width,
                height: building.height,
                level: building.level || 1,
                
                // GoldMine state
                gems: building.gems ? { ...building.gems } : undefined,
                researchProgress: building.researchProgress ? { ...building.researchProgress } : undefined,
                gemMiningUnlocked: building.gemMiningUnlocked || false,
                diamondMiningUnlocked: building.diamondMiningUnlocked || false,
                gemMiningResearched: building.gemMiningResearched || false,
                incomeMultiplier: building.incomeMultiplier !== undefined ? building.incomeMultiplier : 1,
                goldReady: building.goldReady !== undefined ? building.goldReady : false,
                currentProduction: building.currentProduction !== undefined ? building.currentProduction : 0,
                gemMode: building.gemMode !== undefined ? building.gemMode : false,
                currentGemType: building.currentGemType || null,
                
                // TowerForge state
                forgeLevel: building.forgeLevel || undefined,
                upgrades: building.upgrades ? JSON.parse(JSON.stringify(building.upgrades)) : undefined,
                
                // TrainingGrounds state
                trainingLevel: building.trainingLevel || undefined,
                defenderUnlocked: building.defenderUnlocked !== undefined ? building.defenderUnlocked : undefined,
                defenderMaxLevel: building.defenderMaxLevel !== undefined ? building.defenderMaxLevel : undefined,
                guardPostUnlocked: building.guardPostUnlocked !== undefined ? building.guardPostUnlocked : undefined,
                maxGuardPosts: building.maxGuardPosts !== undefined ? building.maxGuardPosts : undefined,
                rangeUpgrades: building.rangeUpgrades ? JSON.parse(JSON.stringify(building.rangeUpgrades)) : undefined,
                
                // MagicAcademy state
                manaRegenRate: building.manaRegenRate !== undefined ? building.manaRegenRate : undefined,
                currentMana: building.currentMana !== undefined ? building.currentMana : undefined,
                maxMana: building.maxMana !== undefined ? building.maxMana : undefined,
                academyLevel: building.academyLevel !== undefined ? building.academyLevel : undefined,
                elementalUpgrades: building.elementalUpgrades ? JSON.parse(JSON.stringify(building.elementalUpgrades)) : undefined,
                unlockedCombinations: building.unlockedCombinations instanceof Set ? Array.from(building.unlockedCombinations) : undefined,
                combinationSpellsUnlocked: building.combinationSpellsUnlocked !== undefined ? building.combinationSpellsUnlocked : undefined,
                
                // SuperWeaponLab state
                labLevel: building.labLevel || undefined,
                spells: building.spells ? JSON.parse(JSON.stringify(building.spells)) : undefined
            };
            
            // Debug: Log building being serialized
            console.log('SaveSystem: Serializing building:', serialized);
            return serialized;
        });
        
        console.log('SaveSystem: Serialized', result.length, 'buildings');
        return result;
    }

    /**
     * Serialize defender data
     */
    static serializeDefender(defender) {
        if (!defender) {
            return null;
        }
        
        const serialized = {
            level: defender.level,
            health: defender.health,
            maxHealth: defender.maxHealth,
            armor: defender.armor,
            x: defender.x,
            y: defender.y,
            attackDamage: defender.attackDamage,
            attackSpeed: defender.attackSpeed,
            attackCooldown: defender.attackCooldown,
            isAttacking: defender.isAttacking,
            animationTime: defender.animationTime
        };
        
        console.log('SaveSystem: Serialized defender level', defender.level, 'with health', defender.health);
        return serialized;
    }
    
    /**
     * Serialize castle state including health and defender
     */
    static serializeCastle(castle) {
        if (!castle) {
            console.log('SaveSystem: Castle is null/undefined, skipping serialization');
            return null;
        }
        
        const serialized = {
            health: castle.health,
            maxHealth: castle.maxHealth,
            defender: this.serializeDefender(castle.defender),
            defenderDeadCooldown: castle.defenderDeadCooldown || 0,
            maxDefenderCooldown: castle.maxDefenderCooldown || 10
        };
        
        console.log('SaveSystem: Serialized castle state:', {
            health: serialized.health,
            maxHealth: serialized.maxHealth,
            hasDefender: !!serialized.defender,
            defenderLevel: serialized.defender?.level
        });
        
        return serialized;
    }

    /**
     * Serialize enemy spawn queue data for saving
     */
    static serializeSpawnQueue(enemyManager) {
        if (!enemyManager || !enemyManager.spawnQueue) {
            return [];
        }
        
        // The spawn queue contains data about enemies yet to be spawned
        return Array.from(enemyManager.spawnQueue);
    }

    /**
     * Check if a save contains mid-game state
     */
    static hasMidGameState(slotNumber) {
        const save = this.getSave(slotNumber);
        return save && save.isMidGameSave === true && save.midGameState;
    }

    /**
     * Get mid-game state from save
     */
    static getMidGameState(slotNumber) {
        const save = this.getSave(slotNumber);
        if (save && save.isMidGameSave && save.midGameState) {
            return save.midGameState;
        }
        return null;
    }

    /**
     * Delete a save from a slot
     */
    static deleteSave(slotNumber) {
        if (slotNumber < 1 || slotNumber > this.NUM_SLOTS) {
            console.error(`Invalid save slot: ${slotNumber}`);
            return false;
        }

        const saves = this.getAllSaves();
        const slotKey = `slot${slotNumber}`;
        saves[slotKey] = null;

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saves));
        return true;
    }

    /**
     * Get level name by level ID
     */
    static getLevelName(levelId) {
        const levelNames = {
            'level1': 'The King\'s Road',
            'level2': 'Braab\'s Path',
            'level3': 'Crazy Frogs',
            'level4': 'Dave\'s Cave',
            'level5': 'Placeholder Level',
            'sandbox': 'Sandbox Mode'
        };
        return levelNames[levelId] || levelId;
    }

    /**
     * Get formatted level display (e.g., "Level 1: The King's Road")
     */
    static getFormattedLevelName(levelId) {
        const levelNumbers = {
            'level1': 1,
            'level2': 2,
            'level3': 3,
            'level4': 4,
            'level5': 5,
            'sandbox': '∞'
        };
        
        const number = levelNumbers[levelId] || '?';
        const name = this.getLevelName(levelId);
        
        if (levelId === 'sandbox') {
            return `${name}`;
        }
        return `Level ${number}: ${name}`;
    }

    /**
     * Get formatted save data for display
     */
    static getSaveInfo(slotNumber) {
        const save = this.getSave(slotNumber);

        if (!save) {
            return {
                isEmpty: true,
                slotNumber: slotNumber,
                displayText: 'Empty Save Slot'
            };
        }

        const date = new Date(save.timestamp);
        const dateString = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        
        // Check if this is a mid-game save
        const isMidGame = save.isMidGameSave === true && save.midGameState;
        
        // Count completed levels
        const completedCount = (save.completedLevels && save.completedLevels.length) || 0;
        
        // Get current level name for display
        const currentLevelId = save.currentLevel || save.lastPlayedLevel || 'level1';
        const formattedLevelName = this.getFormattedLevelName(currentLevelId);
        
        return {
            isEmpty: false,
            slotNumber: slotNumber,
            isMidGameSave: isMidGame,
            displayText: isMidGame 
                ? `Playing: ${formattedLevelName}` 
                : `Completed: ${completedCount} Level${completedCount !== 1 ? 's' : ''}`,
            detailText: isMidGame
                ? `Wave ${save.wave || 1}`
                : formattedLevelName,
            dateString: dateString,
            lastPlayedLevel: save.lastPlayedLevel,
            currentLevel: save.currentLevel,
            completedLevels: save.completedLevels || [],
            unlockedLevels: save.unlockedLevels,
            completedCount: completedCount
        };
    }

    /**
     * Create a new game save state (only level 1 unlocked)
     */
    static createNewGameState() {
        return {
            lastPlayedLevel: 'level1',
            unlockedLevels: ['level1'],
            completedLevels: [],
            currentLevelProgress: {}
        };
    }

    /**
     * Check if a level is unlocked in a save
     */
    static isLevelUnlocked(levelId, unlockedLevels) {
        return unlockedLevels.includes(levelId);
    }

    /**
     * Check if a level is completed in a save
     */
    static isLevelCompleted(levelId, completedLevels) {
        return completedLevels.includes(levelId);
    }

    /**
     * Unlock the next level after completing current one
     */
    static unlockNextLevel(levelId, unlockedLevels) {
        const levelMap = {
            'level1': 'level2',
            'level2': 'level3',
            'level3': 'level4',
            'level4': 'level5',
            'level5': null,
            'sandbox': null
        };

        const nextLevel = levelMap[levelId];
        if (nextLevel && !unlockedLevels.includes(nextLevel)) {
            unlockedLevels.push(nextLevel);
        }

        return unlockedLevels;
    }

    /**
     * Mark a level as completed
     */
    static markLevelCompleted(levelId, completedLevels) {
        if (!completedLevels.includes(levelId)) {
            completedLevels.push(levelId);
        }
        return completedLevels;
    }
}
