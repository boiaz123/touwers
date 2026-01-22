import { CampaignBase } from './CampaignBase.js';
import { LevelRegistry } from '../levels/LevelRegistry.js';
// Import level classes - they auto-register when imported
import { MountainLevel1 } from '../levels/Mountain/MountainLevel1.js';
import { MountainLevel2 } from '../levels/Mountain/MountainLevel2.js';
import { MountainLevel3 } from '../levels/Mountain/MountainLevel3.js';

/**
 * Campaign2: The Mountain Campaign
 * Alpine peak landscape with snowy terrain and mountain fortifications
 */
export class Campaign2 extends CampaignBase {
    constructor(stateManager) {
        super(stateManager);
        
        this.campaignId = 'campaign-2';
        this.campaignName = 'The Mountain Campaign';
        
        // Castle rendering scale for campaign map
        this.castleScale = 0.5;
        
        // Animation time for castle flags
        this.animationTime = 0;
        
        // Terrain cache - generated once on enter to prevent flickering
        this.terrainDetails = null;
        this.pathPoints = [];
        
        // Register campaign levels once during construction
        this.registerLevels();
    }
    
    registerLevels() {
        /**
         * Register all Mountain Campaign levels.
         * Metadata is read from static levelMetadata property in each level class.
         */
        const registerLevel = (levelId, levelClass) => {
            const metadata = levelClass.levelMetadata;
            if (!metadata) {
                throw new Error(`Level ${levelId} does not have static levelMetadata property`);
            }
            LevelRegistry.registerLevel('campaign-2', levelId, levelClass, metadata);
        };

        registerLevel('level1', MountainLevel1);
        registerLevel('level2', MountainLevel2);
        registerLevel('level3', MountainLevel3);
    }
    
    enter() {
        // Get levels from registry for this campaign
        let registeredLevels = LevelRegistry.getLevelsByCampaign('campaign-2');
        
        // Apply unlock status from save data
        const saveData = this.stateManager.currentSaveData;
        this.levels = registeredLevels.map(level => ({
            id: level.id,
            name: level.name,
            difficulty: level.difficulty,
            unlocked: !saveData || !saveData.unlockedLevels || saveData.unlockedLevels.includes(level.id) || level.id === 'level1',
            type: 'campaign'
        }));

        
        // Generate level slot positions along a natural winding path
        this.generatePathAndSlots();
        
        // Generate static terrain cache once
        this.generateTerrainCache();
        
        // Call parent enter
        super.enter();
    }
    
    generatePathAndSlots() {
        const canvas = this.stateManager.canvas;
        const width = canvas.width;
        const height = canvas.height;
        
        // Mountain path - going upward with peaks and valleys
        this.pathPoints = [
            // Left entry
            { x: -20, y: height * 0.7 },
            { x: width * 0.12, y: height * 0.65 },    // Level 1 area - lower left
            
            // Climb first peak
            { x: width * 0.25, y: height * 0.50 },
            { x: width * 0.35, y: height * 0.35 },    // Level 2 area - mid mountain
            
            // Peak and descent
            { x: width * 0.50, y: height * 0.25 },
            { x: width * 0.65, y: height * 0.35 },    // Level 3 area - upper slope
            
            // Final descent to right
            { x: width * 0.80, y: height * 0.50 },
            { x: width * 0.90, y: height * 0.65 },
            
            // Right edge exit
            { x: width + 20, y: height * 0.70 }
        ];
        
        // Generate level slots for mountain campaign
        const totalSlots = Math.min(3, this.levels.length);
        this.levelSlots = [];
        
        // Define specific indices for level placement on the path
        const levelPathIndices = [1, 3, 5];
        
        for (let i = 0; i < totalSlots; i++) {
            const pathIndex = levelPathIndices[i];
            let pos;
            
            if (pathIndex < this.pathPoints.length) {
                pos = { ...this.pathPoints[pathIndex] };
            } else {
                const t = i / (totalSlots - 1);
                pos = this.getPointOnPath(t);
            }
            
            if (i < this.levels.length) {
                pos.level = this.levels[i];
                pos.levelIndex = i;
            } else {
                pos.level = {
                    id: `placeholder-${i}`,
                    name: `Level ${i + 1}`,
                    unlocked: false,
                    completed: false
                };
            }
            
            this.levelSlots.push(pos);
        }
    }
    
    getPointOnPath(t) {
        // Clamp t between 0 and 1
        t = Math.max(0, Math.min(1, t));
        
        // Use quadratic bezier to smoothly interpolate along path
        const n = this.pathPoints.length - 1;
        const i = Math.floor(t * n);
        const localT = (t * n) - i;
        
        if (i >= n) {
            return { ...this.pathPoints[n] };
        }
        
        const p0 = this.pathPoints[i];
        const p1 = this.pathPoints[i + 1];
        
        return {
            x: p0.x + (p1.x - p0.x) * localT,
            y: p0.y + (p1.y - p0.y) * localT
        };
    }
    
    generateTerrainCache() {
        // Cache terrain details for faster rendering
        this.terrainDetails = {
            pathColor: '#8a8a9a',
            grassColor: '#4a7a4a',
            snowColor: '#e5e5f5',
            rockColor: '#6a6a7a'
        };
    }

    update(deltaTime) {
        super.update(deltaTime);
        this.animationTime += deltaTime;
    }

    renderCampaignMap(ctx) {
        const canvas = this.stateManager.canvas;
        
        // Sky - mountain atmosphere
        const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        skyGradient.addColorStop(0, '#1a3a5a');
        skyGradient.addColorStop(1, '#4a7a9a');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Snow caps at top
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.3;
        for (let x = 0; x < canvas.width; x += 100) {
            ctx.beginPath();
            ctx.moveTo(x, canvas.height * 0.2);
            ctx.quadraticCurveTo(x + 50, canvas.height * 0.15, x + 100, canvas.height * 0.2);
            ctx.lineTo(x + 100, 0);
            ctx.lineTo(x, 0);
            ctx.closePath();
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        
        // Mountain ridges
        ctx.fillStyle = '#5a6a7a';
        for (let x = 0; x < canvas.width + 200; x += 150) {
            ctx.beginPath();
            ctx.moveTo(x - 100, canvas.height * 0.35);
            ctx.lineTo(x, canvas.height * 0.15);
            ctx.lineTo(x + 100, canvas.height * 0.35);
            ctx.closePath();
            ctx.fill();
        }
        
        // Path through mountains
        ctx.strokeStyle = '#8a8a9a';
        ctx.lineWidth = 30;
        ctx.beginPath();
        ctx.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
        for (let i = 1; i < this.pathPoints.length; i++) {
            ctx.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
        }
        ctx.stroke();
        
        // Draw level slots
        this.renderLevelSlots(ctx);
    }
    
    renderLevelSlots(ctx) {
        // Render each level as a fortress/stronghold
        for (const slot of this.levelSlots) {
            if (!slot.level) continue;
            
            const x = slot.x;
            const y = slot.y;
            const size = 40;
            const isUnlocked = slot.level.unlocked;
            const isHovered = this.hoveredLevelSlot === slot;
            
            // Fortress stone walls
            ctx.fillStyle = isUnlocked ? '#8a8a9a' : '#5a5a6a';
            ctx.fillRect(x - size * 0.6, y - size * 0.4, size * 1.2, size * 0.8);
            
            // Fortification corners
            const cornerSize = size * 0.25;
            ctx.fillRect(x - size * 0.6, y - size * 0.4, cornerSize, cornerSize);
            ctx.fillRect(x + size * 0.35, y - size * 0.4, cornerSize, cornerSize);
            ctx.fillRect(x - size * 0.6, y + size * 0.15, cornerSize, cornerSize);
            ctx.fillRect(x + size * 0.35, y + size * 0.15, cornerSize, cornerSize);
            
            // Snow on fortress
            ctx.fillStyle = '#f5f5ff';
            ctx.globalAlpha = 0.6;
            ctx.fillRect(x - size * 0.6, y - size * 0.42, size * 1.2, size * 0.15);
            ctx.globalAlpha = 1;
            
            // Level number/indicator
            ctx.fillStyle = isUnlocked ? '#ffff00' : '#888888';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(slot.levelIndex !== undefined ? (slot.levelIndex + 1) : '?', x, y);
            
            // Hover effect
            if (isHovered && isUnlocked) {
                ctx.strokeStyle = '#ffff00';
                ctx.lineWidth = 3;
                ctx.strokeRect(x - size * 0.6 - 3, y - size * 0.4 - 3, size * 1.2 + 6, size * 0.8 + 6);
            }
        }
    }

    handleMountainClick(mouseX, mouseY) {
        // Check if clicked on a level slot
        for (const slot of this.levelSlots) {
            if (!slot.level) continue;
            
            const size = 40;
            if (mouseX >= slot.x - size * 0.6 && mouseX <= slot.x + size * 0.6 &&
                mouseY >= slot.y - size * 0.4 && mouseY <= slot.y + size * 0.4) {
                
                if (slot.level.unlocked) {
                    return {
                        levelId: slot.level.id,
                        levelName: slot.level.name
                    };
                }
            }
        }
        return null;
    }

    exit() {
        super.exit();
    }
}
