# Save/Load System Testing Guide

## Overview
Enhanced save/load system with comprehensive logging to diagnose save issues.

## What Was Changed

### SaveSystem.js
- Added detailed console.log statements throughout save/load process
- Serialization methods now log each tower, enemy, and building being saved
- JSON stringification size is logged to verify data is persisted
- Error handling with try/catch for localStorage operations

### GameplayState.js
- Added logging when entering gameplay state
- Logs whether mid-game restore is happening
- Enhanced restoreMidGameState() with individual try/catch blocks per entity type
- Logs exactly what was restored at the end

### LoadGame.js
- Added logging when a save slot is clicked
- Logs the save data retrieved from localStorage
- Shows which type of save was found (mid-game vs simple)

### UIManager.js
- Save button already had the correct implementation
- Passes all needed data to SaveSystem.saveGame()

## Testing Steps

### Step 1: Start a New Game
1. Open http://localhost:3000
2. Click "New Game" button
3. Select a save slot (1, 2, or 3)
4. Choose a level (e.g., Level 1)
5. **Open Developer Console** (F12 or Right-click > Inspect > Console)

### Step 2: Save Mid-Game
1. Play for a bit (place some towers, defeat some enemies, etc.)
2. Open the in-game pause menu (click "Menu" button)
3. Click the "Save Game" button
4. **Watch the console** - you should see:
   ```
   SaveSystem: Saving mid-game state to slot X
   SaveSystem: Serializing tower: {type, x, y, level, health}
   SaveSystem: Serialized N towers
   SaveSystem: Serializing enemy: {type, x, y, pathIndex, health, maxHealth, speed}
   SaveSystem: Serialized N enemies
   SaveSystem: Serializing building: {type, gridX, gridY, level, ...}
   SaveSystem: Serialized N buildings
   SaveSystem: Serialized data: {towersCount, enemiesCount, buildingsCount, castleHealth, gold, health}
   SaveSystem: JSON size: XXXXX bytes
   SaveSystem: Successfully saved to localStorage
   ```
5. The save button should show "Game Saved!" for 2 seconds

### Step 3: Verify Save Data in localStorage
1. In Developer Console, type:
   ```javascript
   JSON.parse(localStorage.getItem('touwers_saves'))
   ```
2. Look for the slot you saved to (slot1, slot2, or slot3)
3. Verify it has:
   - `isMidGameSave: true`
   - `midGameState` object with:
     - `towers` array with your placed towers
     - `enemies` array with current enemies
     - `buildings` array
     - `gameState` with health and gold values

### Step 4: Reload and Load Save
1. **Refresh the page** (F5) - this clears the current game from memory
2. You should be back at the main menu
3. Click "Load Game"
4. Click the save slot you just saved to
5. **Watch the console** - you should see:
   ```
   LoadGame: Clicked slot X
   LoadGame: Save data: {...}
   LoadGame: Found mid-game save, restoring from progress
   LoadGame: midGameState: {...}
   GameplayState: Entering gameplay state
   GameplayState: isMidGameResume = true
   GameplayState: midGameState = {...}
   GameplayState: Restored: {health, gold, towers: N, buildings: N, enemies: N, waveInProgress}
   GameplayState: Mid-game state restored successfully
   ```

### Step 5: Verify Restoration
After loading, check that:
- **Castle health** is restored to what it was
- **Gold** matches what you had
- **Towers** are all in their original positions with correct types
- **Enemies** are in the same positions with correct health
- **Buildings** are all placed correctly

## Troubleshooting

### "Nothing saves" - Console shows no log messages
**Cause**: Save button click isn't triggering saveGame()
**Fix**: 
1. Check if pause menu opens (click "Menu" button)
2. Check if save button exists and is clickable
3. Add a console.log in UIManager.saveGame() at the very start

### "Serialization warnings" - Console shows "towerManager or towers array is missing"
**Cause**: Managers don't have expected structure
**Fix**:
1. Check what UIManager is passing to SaveSystem.saveGame()
2. Verify towerManager has `towers` array
3. Verify enemyManager has `enemies` array
4. Verify buildingManager exists and has `buildings` array

### "Save data isn't in localStorage"
**Cause**: JSON.stringify() is failing silently, or data is too large
**Fix**:
1. Check console for "Failed to save to localStorage" error
2. Check the "JSON size" logged - if it's huge, something is wrong with serialization
3. Verify localStorage quota isn't exceeded

### "Mid-game save exists but restore doesn't happen"
**Cause**: LoadGame isn't detecting it as mid-game save
**Fix**:
1. Check LoadGame console logs - should show "Found mid-game save"
2. If it says "Simple save found", then `isMidGameSave` isn't being set to true
3. Verify the `midGameState` object exists in the save data

### "Restore happens but nothing appears"
**Cause**: Restoration logic is failing silently
**Fix**:
1. Check console for "Error restoring mid-game state" messages
2. Check for individual errors: "Failed to restore tower", "Failed to restore enemy"
3. Verify tower/building placement methods exist and work

## Expected Behavior Summary

**When Saving:**
- Console shows detailed logs of serialization
- Button shows "Game Saved!" confirmation
- Save data appears in localStorage with size indicator

**When Loading:**
- Console shows detection of mid-game save
- Game state is restored (health, gold, wave index)
- Towers appear at saved positions with correct levels
- Enemies appear with correct health and positions
- Buildings appear with correct upgrades
- Game resumes from where it was paused

## Key Data to Verify

After loading a save, open console and check:

```javascript
// Check game state
gameplayState.gameState.health
gameplayState.gameState.gold
gameplayState.waveIndex

// Check towers
gameplayState.towerManager.towers.length
gameplayState.towerManager.towers[0]  // Should show type, x, y, level, health

// Check enemies  
gameplayState.enemyManager.enemies.length
gameplayState.enemyManager.enemies[0]  // Should show type, x, y, health

// Check buildings
gameplayState.towerManager.buildingManager.buildings.length
gameplayState.towerManager.buildingManager.buildings[0]  // Should show type, gridX, gridY

// Check unlock system
gameplayState.towerManager.unlockSystem.unlockedTowers
gameplayState.towerManager.unlockSystem.unlockedBuildings
```

