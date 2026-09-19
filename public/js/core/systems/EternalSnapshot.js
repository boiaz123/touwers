import { TowerRegistry } from '../../entities/towers/TowerRegistry.js';
import { RubblePile } from '../../entities/towers/RubblePile.js';
import { TowerTransformRegistry } from '../../entities/towers/TowerTransformRegistry.js';
import { BuildingRegistry } from '../../entities/buildings/BuildingRegistry.js';
import { GuardPost } from '../../entities/towers/GuardPost.js';
import { PathDefender } from '../../entities/defenders/PathDefender.js';
import { CastleDefender } from '../../entities/defenders/CastleDefender.js';
import { normalizeEternalOptions, UNLIMITED_GOLD } from './EternalOptions.js';

/**
 * Saved Eternal Mode runs.
 *
 * A run is captured *between waves* - at the moment a wave is completed (see
 * GameplayState._checkWaveCompletion) or while waiting out the cooldown before the next
 * one - so there are never enemies, projectiles or half-finished spawns to reproduce. It's
 * restored into a freshly built level (see GameplayState.enter) and carries on from the
 * start of the following wave with everything the player built and bought intact.
 *
 * Only *progress* is saved - what's been built where, upgrade levels, gems, gold, the castle,
 * the wave reached, the run's RNG seed - never derived or cosmetic state (damage/range totals,
 * animation timers, particles, screen positions). Derived numbers are recalculated by the
 * normal per-frame passes once the upgrades that feed them are back, and positions are
 * rebuilt from grid cells, so a run saved at one resolution loads correctly at another.
 * Each building lists its progress fields explicitly below rather than being dumped wholesale,
 * so a later balance change to a cost table or effect value isn't frozen into old saves.
 */

export const ETERNAL_SNAPSHOT_VERSION = 1;

// ---- small helpers -----------------------------------------------------------------------

/** { key: { level, ...constants } } -> { key: level } (only the level is progress; the rest is tuning). */
function levelsOf(group) {
    const out = {};
    for (const key of Object.keys(group || {})) out[key] = group[key].level || 0;
    return out;
}

function applyLevels(group, saved) {
    if (!group || !saved) return;
    for (const key of Object.keys(saved)) {
        if (group[key]) group[key].level = saved[key];
    }
}

function findTransform(baseType, key) {
    const transform = TowerTransformRegistry.getTransform(baseType);
    return transform && transform.key === key ? transform : null;
}

// ---- per-building progress ---------------------------------------------------------------

const BUILDING_STATE = {
    forge: {
        capture: (b) => ({ forgeLevel: b.forgeLevel, upgrades: levelsOf(b.upgrades) }),
        apply: (b, s) => {
            b.forgeLevel = s.forgeLevel;
            applyLevels(b.upgrades, s.upgrades);
        }
    },

    mine: {
        capture: (b) => ({
            gemMode: !!b.gemMode,
            goldReady: !!b.goldReady,
            currentProduction: b.currentProduction || 0
        }),
        apply: (b, s) => {
            b.gemMode = !!s.gemMode;
            b.goldReady = !!s.goldReady;
            b.currentProduction = s.currentProduction || 0;
        }
    },

    academy: {
        capture: (b) => ({
            academyLevel: b.academyLevel,
            elementalUpgrades: levelsOf(b.elementalUpgrades),
            gems: { ...b.gems },
            gemMiningResearched: !!b.gemMiningResearched,
            superWeaponUnlocked: !!b.superWeaponUnlocked,
            combinationSpellsUnlocked: !!b.combinationSpellsUnlocked,
            diamondMiningUnlocked: !!b.diamondMiningUnlocked
        }),
        apply: (b, s) => {
            b.academyLevel = s.academyLevel;
            applyLevels(b.elementalUpgrades, s.elementalUpgrades);
            b.gems = { fire: 0, water: 0, air: 0, earth: 0, diamond: 0, ...s.gems };
            b.gemMiningResearched = !!s.gemMiningResearched;
            b.superWeaponUnlocked = !!s.superWeaponUnlocked;
            if (s.combinationSpellsUnlocked) b.combinationSpellsUnlocked = true;
            if (s.diamondMiningUnlocked) b.diamondMiningUnlocked = true;
        }
    },

    training: {
        capture: (b) => ({
            trainingLevel: b.trainingLevel,
            defenderUnlocked: !!b.defenderUnlocked,
            defenderMaxLevel: b.defenderMaxLevel,
            guardPostUnlocked: !!b.guardPostUnlocked,
            maxGuardPosts: b.maxGuardPosts,
            rangeUpgrades: levelsOf(b.rangeUpgrades),
            upgrades: levelsOf(b.upgrades)
        }),
        apply: (b, s) => {
            b.trainingLevel = s.trainingLevel;
            b.defenderUnlocked = !!s.defenderUnlocked;
            b.defenderMaxLevel = s.defenderMaxLevel;
            b.guardPostUnlocked = !!s.guardPostUnlocked;
            b.maxGuardPosts = s.maxGuardPosts;
            applyLevels(b.rangeUpgrades, s.rangeUpgrades);
            applyLevels(b.upgrades, s.upgrades);
        }
    },

    superweapon: {
        capture: (b) => {
            const spells = {};
            for (const id of Object.keys(b.spells)) {
                spells[id] = {
                    upgradeLevel: b.spells[id].upgradeLevel || 0,
                    currentCooldown: b.spells[id].currentCooldown || 0
                };
            }
            return {
                labLevel: b.labLevel,
                spells,
                cooldownReduction: b.cooldownReduction.level || 0,
                combinationSpells: b.combinationSpells.map(spell => ({ id: spell.id, upgradeLevel: spell.upgradeLevel || 0 }))
            };
        },
        apply: (b, s) => {
            b.labLevel = s.labLevel;
            b.syncSpellUnlocks(); // which spells the level unlocks is derived, not saved
            for (const id of Object.keys(s.spells || {})) {
                if (!b.spells[id]) continue;
                b.spells[id].upgradeLevel = s.spells[id].upgradeLevel;
                b.spells[id].currentCooldown = s.spells[id].currentCooldown;
            }
            b.cooldownReduction.level = s.cooldownReduction || 0;
            for (const saved of (s.combinationSpells || [])) {
                const spell = b.combinationSpells.find(c => c.id === saved.id);
                if (spell) spell.upgradeLevel = saved.upgradeLevel;
            }
        }
    },

    'diamond-press': {
        capture: () => ({}),
        apply: () => {}
    }
};

// ---- castle ------------------------------------------------------------------------------

function captureCastle(castle) {
    const defender = castle.defender && !castle.defender.isDead()
        ? { level: castle.defender.level, health: castle.defender.health }
        : null;
    return {
        health: castle.health,
        maxHealth: castle.maxHealth,
        fortificationLevel: castle.fortificationLevel,
        catapultLevel: castle.catapultLevel,
        reinforcementLevel: castle.reinforcementLevel,
        defenderDeadCooldown: castle.defenderDeadCooldown || 0,
        defender
    };
}

function restoreCastle(castle, s) {
    castle.health = s.health;
    castle.maxHealth = s.maxHealth;
    castle.fortificationLevel = s.fortificationLevel;
    castle.catapultLevel = s.catapultLevel;
    castle.reinforcementLevel = s.reinforcementLevel;
    castle.defenderDeadCooldown = s.defenderDeadCooldown || 0;
    if (s.defender) {
        const defender = new CastleDefender(s.defender.level);
        defender.health = Math.min(s.defender.health, defender.maxHealth); // runs saved before a max-HP change
        defender.x = castle.x - 60;
        defender.y = castle.y + 40;
        castle.defender = defender;
    }
}

// ---- towers ------------------------------------------------------------------------------

function captureTower(tower, cellSize) {
    if (tower.type === 'guard-post') {
        // Guard posts sit at free screen positions on the road rather than on grid cells, so
        // they're saved in cell units to survive a resolution change.
        const defender = tower.defender && !tower.defender.isDead()
            ? { level: tower.defender.level, health: tower.defender.health }
            : null;
        return {
            type: 'guard-post',
            cx: tower.x / cellSize,
            cy: tower.y / cellSize,
            defender,
            defenderDeadCooldown: tower.defenderDeadCooldown || 0
        };
    }

    const saved = { type: tower.type, gridX: tower.gridX, gridY: tower.gridY };
    // A Heavy Frog's wreckage outlives the wave that made it: the spot stays blocked until cleared
    if (tower.isRubble) saved.wreckedType = tower.wreckedType;
    if (tower.transformedType) saved.transformedType = tower.transformedType;
    if (typeof tower.selectedElement === 'string') saved.selectedElement = tower.selectedElement;
    if (typeof tower.selectedSpell === 'string') saved.selectedSpell = tower.selectedSpell;
    return saved;
}

function restoreGuardPost(gs, s) {
    const { level, towerManager } = gs;
    const cellSize = level.cellSize;
    const post = new GuardPost(s.cx * cellSize, s.cy * cellSize, 1);
    if (towerManager.audioManager) post.audioManager = towerManager.audioManager;
    post.setPath(level.path);

    if (s.defender) {
        const defender = new PathDefender(s.defender.level);
        defender.health = Math.min(s.defender.health, defender.maxHealth);
        defender.x = post.defenderSpawnX;
        defender.y = post.defenderSpawnY;
        if (post.pathIndex !== null && post.gamePath) {
            defender.stationedWaypoint = { x: post.defenderSpawnX, y: post.defenderSpawnY, pathIndex: post.pathIndex };
        }
        post.defender = defender;
    }
    post.defenderDeadCooldown = s.defenderDeadCooldown || 0;
    towerManager.towers.push(post);
}

function restoreTower(gs, s) {
    if (s.type === 'guard-post') {
        restoreGuardPost(gs, s);
        return;
    }

    const { level, towerManager } = gs;
    const { screenX, screenY } = level.gridToScreen(s.gridX, s.gridY);

    if (s.type === 'rubble') {
        const rubble = new RubblePile(screenX, screenY, s.gridX, s.gridY, s.wreckedType || null);
        rubble.age = Infinity; // it's old wreckage: no collapse dust on load
        towerManager.towers.push(rubble);
        towerManager.markTowerPosition(s.gridX, s.gridY);
        level.placeTower(s.gridX, s.gridY);
        return;
    }

    let tower = TowerRegistry.createTower(s.type, screenX, screenY, s.gridX, s.gridY);
    if (!tower) return;

    if (towerManager.audioManager) tower.audioManager = towerManager.audioManager;
    if (s.type === 'barricade' && level.path) tower.setPath(level.path, level.cellSize);

    towerManager.towers.push(tower);
    towerManager.markTowerPosition(s.gridX, s.gridY);
    level.placeTower(s.gridX, s.gridY);

    if (s.transformedType) {
        const transform = findTransform(s.type, s.transformedType);
        if (transform) tower = towerManager.applyTransform(tower, transform);
    }
    // Both of these also apply the chosen element's / spell's base damage and fire rate
    if (s.selectedElement && typeof tower.setElement === 'function') tower.setElement(s.selectedElement);
    if (typeof s.selectedSpell === 'string' && typeof tower.restoreSelectedSpell === 'function') {
        tower.restoreSelectedSpell(s.selectedSpell);
    }
}

// ---- buildings ---------------------------------------------------------------------------

function restoreBuildings(gs, savedBuildings) {
    const { level, towerManager } = gs;
    const bm = towerManager.buildingManager;
    const created = [];

    for (const s of savedBuildings) {
        const handler = BUILDING_STATE[s.type];
        const size = BuildingRegistry.getBuildingSize(s.type);
        if (!handler || !size) continue;

        const { screenX, screenY } = level.gridToScreen(s.gridX, s.gridY, size);
        const building = BuildingRegistry.createBuilding(s.type, screenX, screenY, s.gridX, s.gridY);
        if (!building) continue;

        // Same bookkeeping BuildingManager.placeBuilding does for a freshly placed one
        // (minus the cost, the unlock hooks and the statistics - it isn't being built now).
        if ('buildingManager' in building) building.buildingManager = bm;
        if (typeof building.getVisualYOffset === 'function') {
            building.y += building.getVisualYOffset(level.cellSize * building.size);
        }
        bm.buildings.push(building);
        bm._sortedBuildings.push(building);
        bm.markBuildingPosition(s.gridX, s.gridY, size);
        level.placeBuilding(s.gridX, s.gridY, size);

        handler.apply(building, s.state || {});
        created.push(building);
    }
    bm._sortedBuildings.sort((a, b) => a.y - b.y);

    // Cross-building references, which placeBuilding/TowerManager.placeBuilding wire up as
    // each building is placed - here they're all wired at once, once every building exists.
    const academy = created.find(b => b.type === 'academy');
    for (const building of created) {
        if (building.type === 'mine' && academy) {
            building.setAcademy(academy);
        } else if (building.type === 'superweapon') {
            if (academy) building.setAcademy(academy);
            building.unlockSystem = towerManager.unlockSystem;
            building.upgradeSystem = gs.stateManager.upgradeSystem;
            gs.superWeaponLab = building;
        }
    }

    // Forge / Academy / Training Grounds upgrade levels feed every tower's stats, mine income
    // and elemental bonuses - flag them so the very next update() rebuilds all of it.
    for (const building of created) {
        if (building.type === 'forge' || building.type === 'academy' || building.type === 'training') {
            building.upgradesChanged = true;
        }
    }
    bm._upgradesDirty = true;
    towerManager._towerStatsNeedUpdate = true;
    towerManager._lastTowerCount = -1;
}

// ---- public API --------------------------------------------------------------------------

/**
 * Captures a run as plain JSON. Call between waves only (nothing on the battlefield is saved).
 * @param {GameplayState} gs
 * @returns {Object} snapshot
 */
export function captureEternalSnapshot(gs) {
    const { level, towerManager, gameState } = gs;
    const bm = towerManager.buildingManager;

    return {
        version: ETERNAL_SNAPSHOT_VERSION,
        savedAt: Date.now(),
        options: normalizeEternalOptions(gs.eternalOptions),
        // The wave that comes next - a run is saved once a wave is complete, and resumes
        // at the start of the following one.
        wave: gameState.wave,
        seed: level._seed,
        elapsedTime: Math.max(0, (Date.now() / 1000) - gs.levelStartTime),
        gold: gameState.unlimitedGold ? UNLIMITED_GOLD : Math.floor(gameState.gold),
        stats: {
            enemiesDefeated: gs.enemiesDefeated,
            totalEnemiesSpawned: gs.totalEnemiesSpawned,
            goldEarnedThisLevel: gs.goldEarnedThisLevel,
            startingGold: gs.startingGold
        },
        castle: captureCastle(level.castle),
        unlock: towerManager.unlockSystem.serialize(),
        towers: towerManager.towers.map(tower => captureTower(tower, level.cellSize)),
        buildings: bm.buildings
            .filter(building => BUILDING_STATE[building.type])
            .map(building => ({
                type: building.type,
                gridX: building.gridX,
                gridY: building.gridY,
                state: BUILDING_STATE[building.type].capture(building)
            }))
    };
}

/**
 * Whether a stored value looks like a snapshot this build can load - checked before the
 * Campaigns screen offers to load it and again before actually restoring it.
 */
export function isValidEternalSnapshot(snapshot) {
    return !!snapshot &&
        snapshot.version === ETERNAL_SNAPSHOT_VERSION &&
        Number.isFinite(snapshot.wave) &&
        Number.isFinite(snapshot.seed) &&
        !!snapshot.castle && Array.isArray(snapshot.towers) && Array.isArray(snapshot.buildings);
}

/**
 * Rebuilds a captured run inside a freshly-entered GameplayState (level, managers and UI
 * already created, nothing built yet). Puts back the buildings, towers, unlocks, castle,
 * gold, statistics, wave number and the level's seed - the caller then restarts the wave
 * cooldown and refreshes the UI.
 * @param {GameplayState} gs
 * @param {Object} snapshot - a captureEternalSnapshot() result
 */
export function restoreEternalSnapshot(gs, snapshot) {
    const { level, towerManager, gameState } = gs;

    // Same seed -> the same escalating sequence of waves the run was already facing.
    level._seed = snapshot.seed;
    if (level._waveConfigCache) level._waveConfigCache.clear();

    gameState.wave = snapshot.wave;
    if (snapshot.gold === UNLIMITED_GOLD) {
        gameState.unlimitedGold = true;
    } else {
        gameState.gold = snapshot.gold;
    }

    gs.enemiesDefeated = snapshot.stats.enemiesDefeated;
    gs.totalEnemiesSpawned = snapshot.stats.totalEnemiesSpawned;
    gs.goldEarnedThisLevel = snapshot.stats.goldEarnedThisLevel;
    gs.startingGold = snapshot.stats.startingGold;
    // The clock only ever ran while the player was in the run - carry the elapsed time over.
    gs.levelStartTime = (Date.now() / 1000) - snapshot.elapsedTime;

    if (level.castle) restoreCastle(level.castle, snapshot.castle);
    towerManager.unlockSystem.restore(snapshot.unlock);

    restoreBuildings(gs, snapshot.buildings);
    for (const savedTower of snapshot.towers) restoreTower(gs, savedTower);

    // Guard posts add waypoints to the road enemies walk - rebuild it, exactly as placing one does.
    if (snapshot.towers.some(t => t.type === 'guard-post')) {
        const enhancedPath = level.buildEnhancedPathWithGuardPosts(towerManager.towers);
        gs.enemyManager.updatePath(enhancedPath);
    }
}
