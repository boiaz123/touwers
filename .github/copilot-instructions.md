# Touwers Tower Defense Game - AI Agent Instructions

Important prompt instructions you should ALWAYS follow:
When adding new code, follow the established architecture and patterns closely. Use the Registry pattern for all new entities.

Don't create summary documents or any .md files other than this one.

Make sure you run background and check powershell commands in a different powershell window than the one that runs Touwers. Because you keep putting commands in the active terminal window and that breaks Touwers, dont type messages and waits etc, just check the background console and logging.

You always keep overwriting the npm start terminal screen with sleep-commands, which makes it impossible to see logs and errors. Dont do that, use a different terminal window for testing powershell commands.

You always write a wait and sleep command for the npm start terminal, which breaks Touwers. Dont do that, just wait without telling the terminal you are waiting.

Make sure you check for syntax errors carefully, often you miss a comma or bracket and that breaks the whole app, do NOT deliver code with syntax errors.


## Project Overview

**Touwers** is a browser-based tower defense game built with vanilla JavaScript and Pixi.js, packaged as a desktop Tauri app. The game features a grid-based tower placement system, wave-based enemy progression, and a resolution-agnostic architecture that scales seamlessly across screen sizes.

## Architecture Overview

### Core Application Flow

```
Game (game.js)
  → GameStateManager (manages state transitions)
    → GameplayState (main game loop)
      → Level (LevelBase/Level1-5) - grid, path, waves
      → TowerManager - owns all towers
      → EnemyManager - owns all enemies
      → UIManager - input handling, HUD rendering
```

### Key Architectural Principles

1. **State Machine Pattern**: The game uses `GameStateManager` to control state transitions (mainMenu → gameplay → levelSelect, etc.). All states implement `enter()` and `exit()` lifecycle hooks.

2. **Registry Pattern for Content**: Towers and enemies are registered in `TowerRegistry` and `EnemyRegistry` (single source of truth). Do NOT import individual tower/enemy classes directly—always use registries. Example:
   ```javascript
   // ✓ Correct
   const towerType = TowerRegistry.getTowerType('cannon');
   // ✗ Wrong
   import { CannonTower } from './CannonTower.js';
   ```

3. **Resolution-Agnostic Design**: Game world is always a FIXED grid (60x33.75 cells). Canvas resolution changes the `cellSize` but never the grid dimensions. This ensures gameplay consistency across all screen sizes. See `ResolutionManager.js`.

4. **Canvas 2D API Abstraction**: `PixiRenderer` wraps Pixi.js to provide a Canvas 2D context-like API, allowing gradual migration from 2D to Pixi without rewriting game code.

## Critical Developer Workflows

### Development Server
- **Command**: `npm start` or `node server-dev.js`
- **Purpose**: Simple HTTP server serving `/public` on http://localhost:3000
- **For Tauri Dev**: Use `run-tauri-dev.ps1` (starts server + Tauri dev environment)

### Building Release
- **Command**: `npm run build` or use `build-release.ps1`
- **Output**: `src-tauri/target/release/bundle/msi/` contains the installer
- **Note**: Requires Visual Studio Build Tools; PowerShell script configures environment

### Debugging Tips
- Uncomment `console.log` calls throughout code (they're commented by default)
- Check `PerformanceMonitor` in GameplayState for FPS/performance metrics
- Use browser DevTools on `localhost:3000` to inspect state and rendering

## Module Organization & Patterns

### Entities (public/js/entities/)

**Towers**:
- Base: `Tower.js` - defines `range`, `damage`, `fireRate`, `cooldown`
- Subclasses: `BasicTower.js`, `CannonTower.js`, etc.
- Manager: `TowerManager.js` - handles placement, updates, rendering
- Registry: `TowerRegistry.js` - static registry of all tower types + costs
- Key method: `predictEnemyPosition()` for projectile leading calculations

**Enemies**:
- Base: `BaseEnemy.js` - health, speed, movement along path
- Subclasses: `BasicEnemy.js`, `KnightEnemy.js`, etc. (8 types total)
- Manager: `EnemyManager.js` - spawning, wave progression, updates
- Registry: `EnemyRegistry.js` - defines enemy types + default stats
- Path following: Enemies move along level path array with interpolation

**Buildings**:
- Base: `Building.js` - grid-based, size-aware
- Subclasses: `Castle.js`, `GoldMine.js`, `TowerForge.js` (provide passive benefits)
- Manager: `BuildingManager.js` - placement, collision detection
- Effects: Applied via `applyEffect(towerManager)` method

**Levels**:
- Base: `LevelBase.js` - grid config, path, visual generation, wave data
- Subclasses: `Level1.js` - `Level5.js` (define specific level layouts)
- Constructor accepts `resolutionManager` to scale visuals appropriately
- Key properties: `this.path` (array of waypoints), `this.waves` (enemy spawning data)

### Core Systems (public/js/core/)

**GameStateManager**: Manages state transitions with `changeState(name)`. All game states (menu, gameplay, etc.) inherit from this pattern.

**SaveSystem**: Static utility for localStorage-based saves (3 slots). Stores level progress, unlocked levels, timestamps.

**ResolutionManager**: Calculates `cellSize` to fit fixed grid into variable canvas. Provides coordinate conversion (screen ↔ grid).

**PerformanceMonitor**: Tracks FPS and performance metrics; can be toggled with `enable()`/`disable()`.

### Rendering (public/js/core/rendering/)

**PixiRenderer**: Provides Canvas 2D API wrapper around Pixi.js. Methods like `fillRect()`, `drawImage()`, `fillText()` work identically to native Canvas 2D. Handles sprite caching and graphics pooling.

**PixiRenderingSystem**: High-level rendering orchestrator for game entities.

## Essential Conventions & Patterns

### Position and Scale Units

- **Gameplay**: All positions use pixel coordinates (`x`, `y`)
- **Tower/Enemy range**: Measured in pixels (e.g., `range: 120`)
- **Grid cells**: Calculated from `cellSize` in ResolutionManager
- **Important**: Tower stats (`damage`, `range`, `fireRate`) are BASE units that stay constant; they don't scale with resolution

### Naming Conventions

- **Towers**: lowercase with hyphens for multi-word (e.g., `'poison-archer'`, registered in `TowerRegistry`)
- **Enemies**: lowercase, no hyphens (e.g., `'shieldknight'`, registered in `EnemyRegistry`)
- **Files**: PascalCase for classes (e.g., `BasicTower.js`, `EnemyManager.js`)
- **States**: camelCase references (e.g., `'mainMenu'`, `'gameplay'`)

### Common Patterns

**Rendering with Context**: Most render methods receive `ctx` (PixiRenderer instance). Always check for `ctx.resolutionManager`:
```javascript
getCellSize(ctx) {
    if (ctx && ctx.resolutionManager) {
        return ctx.resolutionManager.cellSize;
    }
    // Fallback for edge cases
    return 32;
}
```

**Wave Spawning**: Levels define `this.waves` as array of spawn events. `EnemyManager` reads this and spawns enemies on timers.

**Collision Detection**: Grid-based collision uses `occupiedCells` Set (stores grid coordinates as keys).

## Adding New Content

### New Tower Type
1. Create `public/js/entities/towers/NewTower.js` extending `Tower`
2. Register in `TowerRegistry.js` with cost
3. Implement `update(deltaTime, enemies)` and `shoot()` methods
4. Add rendering logic in manager or via Sprite

### New Enemy Type
1. Create `public/js/entities/enemies/NewEnemy.js` extending `BaseEnemy`
2. Register in `EnemyRegistry.js` with health/speed defaults
3. Implement movement/behavior in `update()`
4. Manager automatically handles spawning

### New Level
1. Create `public/js/entities/levels/Level6.js` extending `LevelBase`
2. Define `this.path` (waypoint array) and `this.waves` (spawn schedule)
3. Optionally override `this.visualConfig` for theme
4. Register in `LevelFactory.js`

## Important File References

| Purpose | File |
|---------|------|
| Entry point & initialization | [game/game.js](public/js/game/game.js) |
| State machine | [core/states/GameStateManager.js](public/js/core/states/GameStateManager.js) |
| Main game loop | [core/states/GameplayState.js](public/js/core/states/GameplayState.js) |
| Tower registry & management | [entities/towers/TowerRegistry.js](public/js/entities/towers/TowerRegistry.js), [TowerManager.js](public/js/entities/towers/TowerManager.js) |
| Enemy registry & management | [entities/enemies/EnemyRegistry.js](public/js/entities/enemies/EnemyRegistry.js), [EnemyManager.js](public/js/entities/enemies/EnemyManager.js) |
| Level base class | [entities/levels/LevelBase.js](public/js/entities/levels/LevelBase.js) |
| Resolution handling | [core/ResolutionManager.js](public/js/core/ResolutionManager.js) |
| Rendering abstraction | [core/rendering/PixiRenderer.js](public/js/core/rendering/PixiRenderer.js) |
| Persistence | [core/SaveSystem.js](public/js/core/SaveSystem.js) |

## Tauri Configuration

The app is packaged as a Tauri desktop application. Key config in [src-tauri/tauri.conf.json](src-tauri/tauri.conf.json):
- **Dev URL**: http://localhost:3000 (served by Node)
- **Frontend dist**: ../public (the web app files)
- **Bundle target**: MSI (Windows installer)
- **App window**: 1920x1080, fullscreen-enabled

## Common Troubleshooting

- **Towers/Enemies not showing**: Check if registered in respective Registry
- **Grid/collision issues**: Verify `resolutionManager` is passed to managers
- **Resolution scaling broken**: Ensure grid dimensions are FIXED, only cellSize changes
- **State not transitioning**: Check state name matches registry key in GameStateManager


