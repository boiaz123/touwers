# Method Migration Reference

## Methods Moved from GameplayState → UIManager

### UI Setup & Teardown (2 methods)
| Method | Lines | Purpose |
|--------|-------|---------|
| setupUIEventListeners | ~80 | Initialize tower, building, spell button listeners |
| removeUIEventListeners | ~6 | Cleanup UI event handlers |

### UI Display Updates (3 methods)
| Method | Lines | Purpose |
|--------|-------|---------|
| updateUI | ~40 | Update HUD (health, gold, wave, gems) |
| updateUIAvailability | ~45 | Update button states (enabled/disabled) |
| updateSpellUI | ~60 | Update spell button cooldowns and states |

### Menu Systems (7 primary + 2 support methods)

#### Menus
| Method | Lines | Menus Shown |
|--------|-------|------------|
| showForgeUpgradeMenu | ~90 | 🔨 Tower Forge |
| showAcademyUpgradeMenu | ~180 | 🎓 Magic Academy |
| showCastleUpgradeMenu | ~70 | 🏰 Castle |
| showMagicTowerElementMenu | ~80 | ⚡ Magic Tower Elements |
| showCombinationTowerMenu | ~75 | ✨ Combination Tower Spells |
| showBasicTowerStatsMenu | ~50 | Basic Tower Stats |
| showSuperWeaponMenu | ~130 | 🗼 Super Weapon Lab |

#### Menu Support
| Method | Lines | Purpose |
|--------|-------|---------|
| clearActiveMenus | ~7 | Remove all active menus |
| getUpgradeCurrentEffect | ~15 | Format upgrade descriptions |

### Button Handlers (4 methods)
| Method | Lines | Purpose |
|--------|-------|---------|
| selectTower | ~20 | Handle tower button clicks |
| selectBuilding | ~20 | Handle building button clicks |
| showTowerInfo | ~12 | Display tower information |
| showBuildingInfo | ~20 | Display building information |

### Speed Control UI (1 method)
| Method | Lines | Purpose |
|--------|-------|---------|
| setGameSpeedButtonState | ~15 | Update speed button visuals |

---

## Methods Remaining in GameplayState

### Lifecycle (2 methods)
| Method | Lines | Purpose |
|--------|-------|---------|
| constructor | ~22 | Initialize game state |
| enter | ~70 | Initialize level and systems |

### Cleanup (2 methods)
| Method | Lines | Purpose |
|--------|-------|---------|
| exit | ~5 | Cleanup event listeners |
| resize | ~3 | Handle canvas resize |

### Event Handling (3 methods)
| Method | Lines | Purpose |
|--------|-------|---------|
| setupEventListeners | ~50 | Setup canvas click/move listeners |
| removeEventListeners | ~10 | Cleanup canvas listeners |
| handleMouseMove | ~15 | Preview placement |

### Game Logic - Core Loop (5 methods)
| Method | Lines | Purpose |
|--------|-------|---------|
| update | ~40 | Game loop updates |
| render | ~5 | Render game |
| handleClick | ~45 | Route clicks to placement or menus |
| startWave | ~35 | Start enemy wave |
| completeLevel | ~8 | Handle level completion |

### Game Logic - Spell System (3 methods)
| Method | Lines | Purpose |
|--------|-------|---------|
| activateSpellTargeting | ~20 | Spell targeting mode |
| cancelSpellTargeting | ~10 | Cancel targeting |
| castSpellAtPosition | ~60 | Execute spell effects |

### Game Logic - Support (5 methods)
| Method | Lines | Purpose |
|--------|-------|---------|
| createSpellEffect | ~2 | Spell visual effects |
| gameOver | ~4 | Handle game over |
| getWaveConfig | ~25 | Get wave parameters |
| getBuildingCost | ~5 | Lookup building cost |
| initializeSandboxGems | ~40 | Sandbox gem initialization |

### Speed Control - Core (2 methods)
| Method | Lines | Purpose |
|--------|-------|---------|
| setGameSpeed | ~20 | Set game speed state |
| getAdjustedDeltaTime | ~2 | Apply speed multiplier |

---

## Summary Statistics

### Moved to UIManager
- **Total Methods**: 18
- **Total Lines**: ~1,180
- **Categories**: Setup (2), Display (3), Menus (9), Buttons (4)

### Remaining in GameplayState
- **Total Methods**: 22
- **Total Lines**: ~419
- **Categories**: Lifecycle (2), Events (3), Core Game (8), Spells (3), Support (5), Speed (2)

### File Size Comparison
| File | Methods | Lines |
|------|---------|-------|
| GameplayState (before) | 40+ | 1,799 |
| GameplayState (after) | 22 | 619 |
| UIManager (new) | 18 | 1,195 |
| **Reduction in GameplayState** | -45% | -65% |

---

## Key Architectural Decisions

### Why UIManager?
1. **Single Responsibility**: All UI concerns in one place
2. **Easy to Extend**: New menus/UI features don't affect game logic
3. **Testability**: UI can be tested without game simulation
4. **Reusability**: UIManager could be reused in different game modes

### Why Keep in GameplayState?
1. **Core Logic**: Game loop and state management belong together
2. **Placement Logic**: Tower/building placement is game logic, not UI
3. **Spell System**: Spell effects are game mechanics, visual effects are UI
4. **Performance**: Game loop updates should stay in core

### Dependency Pattern
```
GameplayState (Core)
    ↓
    └─→ UIManager (UI)
    
Unidirectional: GameplayState creates and delegates to UIManager
Clean: No circular dependencies
```
