# Touwers - Tower Defense Game

A modular tower defense game built with Node.js and HTML5 Canvas.

## Setup

```bash
npm install
npm start
```

Visit `http://localhost:3000`

## Deploy to Render

1. Push code to GitHub
2. Connect repository to Render
3. Render will auto-detect `render.yaml`

## Game Progression System

### Starting Content
- **Basic Tower** (🏰) - $50
- **Barricade Tower** (🛡️) - $90  
- **Tower Forge** (🔨) - $300

### Tower Forge Upgrades
The Tower Forge is the key to progression. Only 1 forge can be built per game.

**Forge Level 1** (Built)
- Unlocks: Gold Mine, Archer Tower, Basic Upgrades
- Mine Income: 1.5x

**Forge Level 2** ($400)
- Unlocks: Poison Tower, Poison Upgrades
- Mine Income: 2.0x

**Forge Level 3** ($800) 
- Unlocks: Cannon Tower, Explosive Upgrades
- Mine Income: 2.5x

**Forge Level 4** ($1600)
- Unlocks: Magic Academy, Fire Arrows
- Mine Income: 3.0x

**Forge Level 5+** ($3200+)
- Mine Income increases by 0.2x per level

### Magic Academy
Unlocked at Forge Level 4. Only 1 academy allowed per game.

**Magic Academy Features**
- Unlocks: Magic Tower (elemental damage)
- Provides: 4 elemental upgrade trees + Building upgrade system
- Elements: Fire (🔥), Water (💧), Air (💨), Earth (🌍)
- Visual: Magical fortress with moat, towers, and natural surroundings

**Elemental Upgrades** (5 levels each)
- **Fire Mastery**: +5 burn damage per level
- **Water Mastery**: +10% slow effect per level  
- **Air Mastery**: +20px chain range per level
- **Earth Mastery**: +3 armor piercing per level

**Academy Building Upgrades** (3 levels)

**Level 1: Combination Spells** ($1000)
- Unlocks Combination Tower building type
- Unlocks 4 combination spell investments using gems:
- **Steam** (Fire + Water): Burn + Slow effects with unique vapor animation
- **Magma** (Fire + Earth): Burn + Piercing effects with lava eruption animation  
- **Tempest** (Air + Water): Chain + Slow effects with lightning storm animation
- **Meteor** (Air + Earth): Chain + Piercing effects with meteor impact animation
- All combination spells deal 10-15% bonus damage
- Combination Tower features enhanced visual design with floating elemental orbs

**Level 2: Diamond Mining** ($1500)
- Unlocks diamond gem type in gold mines
- Diamonds appear in UI and can be used as currency
- Players can toggle mines between gold and diamond production

**Level 3: Super Weapon Lab** ($2000)
- Unlocks Super Weapon Lab building
- Enables access to advanced technologies

### Combination Tower System
**NEW: Combination Tower** (🏗️✨) - $200
- Available after unlocking any combination spell at Magic Academy Level 1
- Click placed Combination Towers to select active spell
- Each spell has unique visual effects and elemental combinations
- Enhanced appearance with floating elemental orbs, crystal structure, and energy rings
- Spell-specific animations: steam clouds, magma eruptions, lightning tempests, meteor impacts
- More visually impressive than regular Magic Tower

**Combination Spells** (Unlocked via Magic Academy gem investment)
- **Steam** (2🔥 + 2💧): Spiraling vapor effects, burn + enhanced slow
- **Magma** (2🔥 + 2🪨): Erupting lava effects, burn + armor piercing  
- **Tempest** (2💨 + 2💧): Lightning storm effects, chain + slow
- **Meteor** (2💨 + 2🪨): Falling meteor effects, chain + armor piercing

## Project Structure

- `/public/js/towers/` - Add new tower types here
- `/public/js/enemies/` - Add new enemy types here
- `/public/js/buildings/` - Add new building types here
- `/public/js/Level.js` - Modify or add levels
- `/public/js/UnlockSystem.js` - Manages content progression

## Expanding

### Add New Tower
Create new file in `towers/` extending base tower pattern, register in `TowerManager.js` and `UnlockSystem.js`

### Add New Enemy
Create new file in `enemies/` extending base enemy pattern, use in `EnemyManager.js`

### Add New Building
Create new file in `buildings/` extending Building class, register in `BuildingManager.js` and `UnlockSystem.js`

## Mobile/APK Conversion
Use Cordova or Capacitor to wrap the web app into an APK.
