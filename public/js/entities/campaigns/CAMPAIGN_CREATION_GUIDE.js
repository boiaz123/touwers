// CAMPAIGNS FOLDER - Guide to Creating New Campaigns

// Each campaign is a TypeScript class that extends CampaignBase
// CampaignBase provides all the common functionality (rendering, interaction, UI)
// Your campaign class just needs to define:
// 1. Level selection and positioning
// 2. Terrain rendering
// 3. Path rendering

// STEP-BY-STEP GUIDE TO CREATE A NEW CAMPAIGN:

/*
1. Create a new file: Campaign2.js
2. Import CampaignBase:
   import { CampaignBase } from './CampaignBase.js';
   import { LevelFactory } from '../../game/LevelFactory.js';

3. Create class extending CampaignBase:
   export class Campaign2 extends CampaignBase {
       constructor(stateManager) {
           super(stateManager);
           this.campaignId = 'campaign-2';
           this.campaignName = 'The Eastern Expedition';
       }

       enter() {
           // Load levels for this campaign
           const saveData = this.stateManager.currentSaveData;
           const allLevels = LevelFactory.getLevelList(saveData);
           this.levels = allLevels.filter(level => 
               ['level6', 'level7', 'level8', 'level9', 'level10'].includes(level.id)
           );
           
           // Generate path and slots
           this.generatePathAndSlots();
           
           // Call parent enter
           super.enter();
       }

       generatePathAndSlots() {
           // Define path points
           this.pathPoints = [
               { x: 100, y: 500 },
               { x: 200, y: 450 },
               { x: 350, y: 400 },
               // ... etc
           ];
           
           // Generate level slots along path
           this.levelSlots = [];
           for (let i = 0; i < this.levels.length; i++) {
               const t = i / (this.levels.length - 1);
               const pos = this.getPointOnPath(t);
               this.levelSlots.push(pos);
           }
       }

       getPointOnPath(t) {
           // Interpolate along path - copy from Campaign1 or create your own
       }

       renderTerrain(ctx) {
           // Draw your unique terrain (grasslands, deserts, mountains, etc)
           // Use ctx.fillStyle, ctx.beginPath, ctx.fill, ctx.stroke, etc.
       }

       renderPath(ctx) {
           // Draw the path connecting level slots
           // Use ctx.strokeStyle, ctx.lineWidth, ctx.beginPath, ctx.stroke
       }

       // renderLevelSlot can be overridden if you want custom slot appearance
       // or leave it as-is to use the default from CampaignBase
   }

4. Register in CampaignRegistry.js:
   - Import the class at the top
   - Add entry to campaigns object with metadata (name, difficulty, rewards, etc)
   - Set class: campaignClasses.Campaign2
   - Unlock by setting locked: false (or leave locked: true initially)

5. Initialize in game.js:
   - Import Campaign2
   - Add to CampaignRegistry.initialize({ Campaign1, Campaign2 })
   - Create instance: const campaign2 = new Campaign2(this.stateManager)
   - Add state: this.stateManager.addState('campaign-2-state', campaign2)
   
   OR if you want to keep 'levelSelect' for all campaigns, just update the
   initialization to use the currently selected campaign.

6. Test:
   - Open game, go to Settlement Hub
   - Click Training Grounds
   - Select your new campaign
   - Level slots should appear along your custom path/terrain
*/

// KEY METHODS FROM CampaignBase:
// - enter() - Initialize campaign when entered
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
