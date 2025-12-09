# Resolution System - Quick Reference Guide

## Using Resolution Management

### For Rendering Towers/Buildings
```javascript
// In render(ctx) method of any Tower or Building
const cellSize = this.getCellSize(ctx);
const towerSize = cellSize * 2;  // 2x2 grid cells
```

### For Converting Coordinates
```javascript
// Convert click position to grid coordinates
const { gridX, gridY } = level.screenToGrid(clickX, clickY);

// Convert grid coordinates to screen position
const { screenX, screenY } = level.gridToScreen(gridX, gridY);
```

### For Scaling Any Value
```javascript
// Scale a base value by resolution
if (ctx.resolutionManager) {
    const scaledValue = ctx.resolutionManager.scale(baseValue);
}
```

### For Grid Bounds Checking
```javascript
// Check if position is valid
if (level.resolutionManager.isValidGridPosition(gridX, gridY)) {
    // Safe to place
}
```

## Key Properties

### ResolutionManager Constants
- `BASE_WIDTH` = 1920
- `BASE_HEIGHT` = 1080  
- `BASE_CELL_SIZE` = 32

### ResolutionManager Runtime Values
- `scaleFactor` - Scale multiplier (0.5x to 2.5x)
- `cellSize` - Grid cell size in pixels
- `gridWidth` - Number of grid columns
- `gridHeight` - Number of grid rows
- `canvasWidth`, `canvasHeight` - Canvas dimensions

## Common Resolution Mappings

| Resolution | Scale | Cell Size | Grid Size |
|-----------|-------|-----------|-----------|
| 1920×1080 | 1.0x  | 32px      | 60×33     |
| 1280×720  | 0.67x | 21px      | 61×34     |
| 2560×1440 | 1.33x | 43px      | 59×33     |
| 3840×2160 | 2.0x  | 64px      | 60×33     |

## Troubleshooting

### Tower appears in wrong position
1. Check `screenToGrid()` calculation
2. Verify `cellSize` is being used, not hardcoded value
3. Ensure ResolutionManager is attached to ctx

### Grid shifts when resizing
1. Check `resizeCanvas()` updates ResolutionManager
2. Verify Level receives updated ResolutionManager
3. Check console for ResolutionManager logs

### Click detection off
1. Verify scaleX/scaleY in click handler
2. Check `screenToGrid()` uses correct cellSize
3. Ensure canvas getBoundingClientRect() is called

### Towers/buildings too small or large
1. Check `BASE_CELL_SIZE` is 32
2. Verify `scaleFactor` calculation: `(scaleWidth + scaleHeight) / 2`
3. Ensure all rendering uses `getCellSize()` or `cellSize`

## Adding New Scaling Support

When adding new entity types that need resolution scaling:

1. **Extend base class** - Inherit from Tower or Building
2. **Use getCellSize()** - Call `this.getCellSize(ctx)` in render
3. **Use grid coordinates** - Convert all positions through level
4. **Test multiple resolutions** - Verify at 1280x720, 1920x1080, 2560x1440

Example:
```javascript
class NewTower extends Tower {
    render(ctx) {
        const cellSize = this.getCellSize(ctx);  // ✓ Correct
        const size = cellSize * 2;                // ✓ Scales with resolution
        
        // Draw tower...
    }
}
```

## Files Using ResolutionManager

### Core
- `game/game.js` - Creates and manages ResolutionManager
- `core/ResolutionManager.js` - Resolution calculation logic
- `core/states/GameStateManager.js` - Stores reference
- `core/states/GameplayState.js` - Passes to level

### Rendering
- `entities/towers/Tower.js` - Base class with helpers
- `entities/towers/*Tower.js` - All tower types
- `entities/buildings/Building.js` - Base class with helpers
- `entities/buildings/BuildingManager.js` - Building rendering

### Level System
- `entities/levels/LevelBase.js` - Grid and coordinate conversion

## Performance Notes

- ResolutionManager is created once on init, not per frame
- Scale calculations cached in cellSize property
- No expensive calculations in render loops
- Fallback calculations available as backup

## Future Enhancements

Potential improvements (not currently implemented):
- Dynamic UI scaling based on resolutionManager.getUIScale()
- Font size scaling for text elements
- Animation speed adjustment by resolution
- Network sync of resolution for multiplayer
