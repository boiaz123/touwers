import { CampaignBase } from './CampaignBase.js';
import { LevelRegistry } from '../levels/LevelRegistry.js';
// Import level classes - they auto-register when imported
import { DesertLevel1 } from '../levels/Desert/DesertLevel1.js';
import { DesertLevel2 } from '../levels/Desert/DesertLevel2.js';

/**
 * Campaign3: The Desert Campaign
 * Arid sandy terrain with oasis and dune fortifications
 */
export class Campaign3 extends CampaignBase {
    constructor(stateManager) {
        super(stateManager);
        
        this.campaignId = 'campaign-3';
        this.campaignName = 'The Desert Campaign';
        
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
         * Register all Desert Campaign levels.
         * Metadata is read from static levelMetadata property in each level class.
         */
        const registerLevel = (levelId, levelClass) => {
            const metadata = levelClass.levelMetadata;
            if (!metadata) {
                throw new Error(`Level ${levelId} does not have static levelMetadata property`);
            }
            LevelRegistry.registerLevel('campaign-3', levelId, levelClass, metadata);
        };

        registerLevel('level1', DesertLevel1);
        registerLevel('level2', DesertLevel2);
    }
    
    enter() {
        // Get levels from registry for this campaign
        let registeredLevels = LevelRegistry.getLevelsByCampaign('campaign-3');
        
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
        
        // Desert path - winding through dunes
        this.pathPoints = [
            // Left entry
            { x: -20, y: height * 0.6 },
            { x: width * 0.15, y: height * 0.65 },    // Level 1 area - left dunes
            
            // Wind through dunes
            { x: width * 0.35, y: height * 0.55 },
            { x: width * 0.50, y: height * 0.45 },    // Oasis area
            
            // Continue to right
            { x: width * 0.70, y: height * 0.55 },    // Level 2 area - right dunes
            { x: width * 0.85, y: height * 0.65 },
            
            // Right edge exit
            { x: width + 20, y: height * 0.70 }
        ];
        
        // Generate level slots for desert campaign
        const totalSlots = Math.min(2, this.levels.length);
        this.levelSlots = [];
        
        // Define specific indices for level placement on the path
        const levelPathIndices = [1, 4];
        
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
            pathColor: '#d4a574',
            dune1Color: '#c9a876',
            dune2Color: '#b9986a',
            oasisColor: '#2e7a4a'
        };
    }

    update(deltaTime) {
        super.update(deltaTime);
        this.animationTime += deltaTime;
    }

    renderCampaignMap(ctx) {
        const canvas = this.stateManager.canvas;
        
        // Sky - hot desert atmosphere
        const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        skyGradient.addColorStop(0, '#87ceeb');
        skyGradient.addColorStop(0.5, '#e0c9a0');
        skyGradient.addColorStop(1, '#d9a876');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Sand dunes background
        ctx.fillStyle = '#b9986a';
        for (let x = 0; x < canvas.width + 200; x += 200) {
            ctx.beginPath();
            ctx.moveTo(x - 100, canvas.height * 0.5);
            ctx.quadraticCurveTo(x, canvas.height * 0.3, x + 100, canvas.height * 0.5);
            ctx.lineTo(x + 100, canvas.height);
            ctx.lineTo(x - 100, canvas.height);
            ctx.closePath();
            ctx.fill();
        }
        
        // Foreground dunes - lighter
        ctx.fillStyle = '#c9a876';
        for (let x = 50; x < canvas.width + 200; x += 200) {
            ctx.beginPath();
            ctx.moveTo(x - 80, canvas.height * 0.55);
            ctx.quadraticCurveTo(x, canvas.height * 0.4, x + 80, canvas.height * 0.55);
            ctx.lineTo(x + 80, canvas.height);
            ctx.lineTo(x - 80, canvas.height);
            ctx.closePath();
            ctx.fill();
        }
        
        // Oasis area
        ctx.fillStyle = '#2e7a4a';
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.ellipse(canvas.width * 0.5, canvas.height * 0.45, 120, 80, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        
        // Oasis shimmer
        ctx.strokeStyle = 'rgba(46, 122, 74, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(canvas.width * 0.5, canvas.height * 0.45, 115, 75, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Path through dunes
        ctx.strokeStyle = '#d4a574';
        ctx.lineWidth = 35;
        ctx.lineCap = 'round';
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
        // Render each level as a desert fortress
        for (const slot of this.levelSlots) {
            if (!slot.level) continue;
            
            const x = slot.x;
            const y = slot.y;
            const size = 40;
            const isUnlocked = slot.level.unlocked;
            const isHovered = this.hoveredLevelSlot === slot;
            
            // Sand fortress walls
            ctx.fillStyle = isUnlocked ? '#c9a876' : '#a98a5a';
            ctx.fillRect(x - size * 0.5, y - size * 0.35, size, size * 0.7);
            
            // Fortress towers
            ctx.fillStyle = isUnlocked ? '#b9986a' : '#8a6a3a';
            const towerSize = size * 0.2;
            ctx.fillRect(x - size * 0.5, y - size * 0.35, towerSize, towerSize);
            ctx.fillRect(x + size * 0.3, y - size * 0.35, towerSize, towerSize);
            
            // Flag on fortress
            ctx.fillStyle = '#ff6b6b';
            ctx.fillRect(x - size * 0.05, y - size * 0.35 - 15, 3, 15);
            ctx.beginPath();
            ctx.moveTo(x + 2, y - size * 0.35);
            ctx.lineTo(x + 12, y - size * 0.35 - 5);
            ctx.lineTo(x + 2, y - size * 0.35 - 10);
            ctx.closePath();
            ctx.fill();
            
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
                ctx.strokeRect(x - size * 0.5 - 3, y - size * 0.35 - 3, size + 6, size * 0.7 + 6);
            }
        }
    }

    handleDesertClick(mouseX, mouseY) {
        // Check if clicked on a level slot
        for (const slot of this.levelSlots) {
            if (!slot.level) continue;
            
            const size = 40;
            if (mouseX >= slot.x - size * 0.5 && mouseX <= slot.x + size * 0.5 &&
                mouseY >= slot.y - size * 0.35 && mouseY <= slot.y + size * 0.35) {
                
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
