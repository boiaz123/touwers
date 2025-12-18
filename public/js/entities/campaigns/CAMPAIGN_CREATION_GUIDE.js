// CAMPAIGNS FOLDER - Guide to Creating New Campaigns

// ARCHITECTURE:
// Each campaign is a class that extends CampaignBase
// CampaignBase provides all common functionality:
// - Level slot rendering (with castles, locks, hover effects)
// - Mouse interaction (click detection, cursor feedback)
// - Exit button and navigation
// Your campaign just needs to:
// 1. Load campaign-specific levels from save data
// 2. Generate path and slot positions
// 3. Render unique terrain and path visuals
// 4. Optionally customize level slot rendering

// KEY BENEFITS OF THIS ARCHITECTURE:
// - All campaigns reuse CampaignBase logic (click handling, UI, etc.)
// - Easy to create new campaigns by just adding terrain/path rendering
// - Automatic level unlocking via SaveSystem.unlockNextLevel()
// - Campaign levels automatically filtered from level list
// - All campaigns use single 'levelSelect' state (registered as Campaign1 in game.js)

// STEP-BY-STEP GUIDE TO CREATE A NEW CAMPAIGN:

/*
STEP 1: Create the Campaign Class File
--------------------------------------
Create: public/js/entities/campaigns/Campaign2.js

STEP 2: Import and Extend CampaignBase
--------------------------------------
import { CampaignBase } from './CampaignBase.js';
import { LevelFactory } from '../../game/LevelFactory.js';

export class Campaign2 extends CampaignBase {
    constructor(stateManager) {
        super(stateManager);
        this.campaignId = 'campaign-2';
        this.campaignName = 'The Eastern Expedition';
        this.castleScale = 0.5;  // Scale for castle rendering
    }

STEP 3: Implement enter() to Load Campaign Levels
--------------------------------------------------
    enter() {
        // Load and filter levels for this campaign
        const saveData = this.stateManager.currentSaveData;
        const allLevels = LevelFactory.getLevelList(saveData);
        
        // Filter to only levels belonging to this campaign
        this.levels = allLevels.filter(level => 
            ['level6', 'level7', 'level8', 'level9', 'level10'].includes(level.id)
        );
        
        // Generate positions and terrain
        this.generatePathAndSlots();
        this.generateTerrainCache();  // Optional: cache terrain to prevent flickering
        
        // Call parent enter() to setup mouse listeners, etc.
        super.enter();
    }

STEP 4: Generate Path and Level Slots
--------------------------------------
    generatePathAndSlots() {
        const canvas = this.stateManager.canvas;
        const width = canvas.width;
        const height = canvas.height;
        
        // Define path points (waypoints for the road/path)
        this.pathPoints = [
            { x: width * 0.1, y: height * 0.5 },
            { x: width * 0.3, y: height * 0.3 },
            { x: width * 0.5, y: height * 0.2 },
            { x: width * 0.7, y: height * 0.3 },
            { x: width * 0.9, y: height * 0.5 }
        ];
        
        // Generate level slots positioned along the path
        this.levelSlots = [];
        for (let i = 0; i < this.levels.length; i++) {
            // Interpolate position along path
            const t = i / (this.levels.length - 1);
            const pos = this.getPointOnPath(t);
            
            // Attach level info
            pos.level = this.levels[i];
            pos.levelIndex = i;
            this.levelSlots.push(pos);
        }
    }

STEP 5: Helper to Interpolate Along Path
------------------------------------------
    getPointOnPath(t) {
        const points = this.pathPoints;
        const segmentLength = 1 / (points.length - 1);
        const segment = Math.floor(t / segmentLength);
        const localT = (t - segment * segmentLength) / segmentLength;
        
        if (segment >= points.length - 1) {
            return { ...points[points.length - 1] };
        }
        
        const p1 = points[segment];
        const p2 = points[segment + 1];
        
        return {
            x: p1.x + (p2.x - p1.x) * localT,
            y: p1.y + (p2.y - p1.y) * localT
        };
    }

STEP 6: Render Terrain (Custom to Your Campaign)
--------------------------------------------------
    renderTerrain(ctx) {
        // Example: Desert terrain
        const canvas = this.stateManager.canvas;
        
        // Sand dunes
        ctx.fillStyle = '#e8d4a0';
        ctx.beginPath();
        ctx.ellipse(canvas.width * 0.2, canvas.height * 0.3, 200, 100, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Cacti, rocks, etc.
        // Use similar patterns to Campaign1.drawRock(), drawTree(), etc.
    }

STEP 7: Render Path (The Road/Trail)
-------------------------------------
    renderPath(ctx) {
        if (!this.pathPoints || this.pathPoints.length < 2) return;
        
        // Shadow path
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 40;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(this.pathPoints[0].x + 2, this.pathPoints[0].y + 2);
        for (let i = 1; i < this.pathPoints.length; i++) {
            ctx.lineTo(this.pathPoints[i].x + 2, this.pathPoints[i].y + 2);
        }
        ctx.stroke();
        
        // Main path color
        ctx.strokeStyle = '#d4a574';
        ctx.lineWidth = 36;
        ctx.beginPath();
        ctx.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
        for (let i = 1; i < this.pathPoints.length; i++) {
            ctx.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
        }
        ctx.stroke();
    }

STEP 8: Optional - Cache Terrain for Performance
---------------------------------------------------
    generateTerrainCache() {
        // Pre-compute terrain details to avoid recalculating each frame
        this.terrainDetails = {
            // Store rocks, trees, etc.
        };
    }

STEP 9: Optional - Override Title or Exit Button
--------------------------------------------------
    renderTitle(ctx, canvas) {
        ctx.font = 'bold 36px serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#1a0f05';
        ctx.fillText(this.campaignName.toUpperCase(), canvas.width / 2, 50);
    }
}

STEP 10: Register Campaign in CampaignRegistry
-----------------------------------------------
File: public/js/game/CampaignRegistry.js

1. Import at top:
   import { Campaign2 } from '../entities/campaigns/Campaign2.js';

2. Add to getCampaignsOrdered():
   return [
       { id: 'campaign-1', name: 'The Great Northern Campaign', locked: false, class: Campaign1 },
       { id: 'campaign-2', name: 'The Eastern Expedition', locked: false, class: Campaign2 },
   ];

3. Keep getClass() method to return the right class

STEP 11: Update game.js to Initialize Campaign
-----------------------------------------------
File: public/js/game/game.js

1. Import Campaign2:
   import { Campaign2 } from '../entities/campaigns/Campaign2.js';

2. In initializeStates(), update CampaignRegistry.initialize():
   CampaignRegistry.initialize({ Campaign1, Campaign2 });

NOTE: You don't need to add separate states for each campaign!
The 'levelSelect' state uses the campaign selected in CampaignMenu.
All campaigns extend CampaignBase so they all work the same way.

STEP 12: Test Your Campaign
----------------------------
1. Start the game (npm start)
2. Navigate to Settlement Hub
3. Click "Training Grounds" (or appropriate menu)
4. Select "CAMPAIGNS"
5. Click your new campaign
6. You should see your terrain and path with castle level slots!
7. Click a castle to start a level

LEVEL PROGRESSION WORKS AUTOMATICALLY:
- When you complete level 6, level 7 is unlocked
- SaveSystem.unlockNextLevel() handles this in GameplayState.completeLevel()
- Next time you enter campaign, LevelFactory.getLevelList(saveData) shows unlocked levels
- Campaign1.enter() filters levels and marks them as unlocked
- CampaignBase.renderLevelSlot() shows locked castles with 🔒 icon

EXAMPLE COMPLETE Campaign2:
--------------------------
See Campaign1.js for a complete, working example with all features:
- Multiple terrain elements (mountains, water, trees, rocks, shrubs)
- Smooth winding path
- Castle rendering (inherited from CampaignBase)
- Mouse hover effects
- Level naming and display

*/
// - exit() - Clean up when leaving
// - handleMouseMove() - Auto handles slot hover detection
// - handleClick() - Auto handles slot click and exit button
// - render() - Main render loop, calls all render methods
// - renderTerrain() - Override to draw terrain
// - renderPath() - Override to draw path
// - renderLevelSlots() - Renders all level slots (calls renderLevelSlot)
// - renderLevelSlot() - Override to customize slot appearance
// - renderTitle() - Renders campaign name (can override)
// - renderExitButton() - Renders exit button (can override)
// - getLevelSlotBounds() - Get position of a slot
// - getPointOnPath() - Interpolate point along path

// KEY PROPERTIES FROM CampaignBase:
// - this.levels - Array of level objects for this campaign
// - this.levelSlots - Array of {x, y} positions for each level
// - this.pathPoints - Array of path waypoints
// - this.hoveredLevel - Index of currently hovered level slot (-1 if none)
// - this.stateManager - Access to game state manager
