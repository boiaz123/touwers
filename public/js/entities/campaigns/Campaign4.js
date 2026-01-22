import { CampaignBase } from './CampaignBase.js';
import { LevelRegistry } from '../levels/LevelRegistry.js';
// Import level classes - they auto-register when imported
import { SpaceLevel1 } from '../levels/Space/SpaceLevel1.js';
import { SpaceLevel2 } from '../levels/Space/SpaceLevel2.js';

/**
 * Campaign4: The Space Campaign
 * Futuristic space stations and asteroid defense
 */
export class Campaign4 extends CampaignBase {
    constructor(stateManager) {
        super(stateManager);
        
        this.campaignId = 'campaign-4';
        this.campaignName = 'The Space Campaign';
        
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
         * Register all Space Campaign levels.
         * Metadata is read from static levelMetadata property in each level class.
         */
        const registerLevel = (levelId, levelClass) => {
            const metadata = levelClass.levelMetadata;
            if (!metadata) {
                throw new Error(`Level ${levelId} does not have static levelMetadata property`);
            }
            LevelRegistry.registerLevel('campaign-4', levelId, levelClass, metadata);
        };

        registerLevel('level1', SpaceLevel1);
        registerLevel('level2', SpaceLevel2);
    }
    
    enter() {
        // Get levels from registry for this campaign
        let registeredLevels = LevelRegistry.getLevelsByCampaign('campaign-4');
        
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
        
        // Space path - orbital trajectory
        this.pathPoints = [
            // Entry from left
            { x: -20, y: height * 0.5 },
            { x: width * 0.2, y: height * 0.35 },     // Level 1 area - high orbit
            
            // Orbital path
            { x: width * 0.35, y: height * 0.25 },
            { x: width * 0.5, y: height * 0.3 },
            { x: width * 0.65, y: height * 0.4 },     // Level 2 area - main station
            
            // Continue orbit
            { x: width * 0.8, y: height * 0.55 },
            { x: width * 0.9, y: height * 0.65 },
            
            // Exit to right
            { x: width + 20, y: height * 0.75 }
        ];
        
        // Generate level slots for space campaign
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
            pathColor: '#00ffff',
            stationColor: '#00ff00',
            asteroidColor: '#666666'
        };
    }

    update(deltaTime) {
        super.update(deltaTime);
        this.animationTime += deltaTime;
    }

    renderCampaignMap(ctx) {
        const canvas = this.stateManager.canvas;
        
        // Deep space background
        ctx.fillStyle = '#000814';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Starfield
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 100; i++) {
            const x = (Math.sin(i * 12.9898) * 43758.5453) % canvas.width;
            const y = (Math.sin(i * 78.233) * 43758.5453) % canvas.height;
            const size = (Math.sin(i * 45.164) * 0.5 + 0.5) * 2;
            ctx.globalAlpha = (Math.sin(i * 34.489) * 0.5 + 0.5);
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        
        // Nebula clouds
        ctx.fillStyle = 'rgba(200, 50, 200, 0.2)';
        ctx.beginPath();
        ctx.ellipse(canvas.width * 0.3, canvas.height * 0.3, 200, 150, 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(50, 150, 200, 0.2)';
        ctx.beginPath();
        ctx.ellipse(canvas.width * 0.7, canvas.height * 0.6, 180, 140, -0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Orbital path
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
        for (let i = 1; i < this.pathPoints.length; i++) {
            ctx.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw level slots
        this.renderLevelSlots(ctx);
    }
    
    renderLevelSlots(ctx) {
        // Render each level as a space station
        for (const slot of this.levelSlots) {
            if (!slot.level) continue;
            
            const x = slot.x;
            const y = slot.y;
            const size = 40;
            const isUnlocked = slot.level.unlocked;
            const isHovered = this.hoveredLevelSlot === slot;
            
            // Space station main body
            ctx.fillStyle = isUnlocked ? '#00ff00' : '#004400';
            ctx.beginPath();
            ctx.moveTo(x, y - size * 0.35);
            ctx.lineTo(x + size * 0.35, y - size * 0.1);
            ctx.lineTo(x + size * 0.35, y + size * 0.3);
            ctx.lineTo(x, y + size * 0.35);
            ctx.lineTo(x - size * 0.35, y + size * 0.3);
            ctx.lineTo(x - size * 0.35, y - size * 0.1);
            ctx.closePath();
            ctx.fill();
            
            // Station solar panels
            ctx.fillStyle = isUnlocked ? '#00ffff' : '#004466';
            ctx.fillRect(x - size * 0.4, y - size * 0.08, size * 0.15, size * 0.25);
            ctx.fillRect(x + size * 0.25, y - size * 0.08, size * 0.15, size * 0.25);
            
            // Station lights/windows
            ctx.fillStyle = '#ffff00';
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.arc(x - size * 0.1 + (i * size * 0.1), y, 2, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Level number/indicator
            ctx.fillStyle = isUnlocked ? '#ffff00' : '#888888';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(slot.levelIndex !== undefined ? (slot.levelIndex + 1) : '?', x, y + size * 0.45);
            
            // Hover effect
            if (isHovered && isUnlocked) {
                ctx.strokeStyle = '#00ffff';
                ctx.lineWidth = 3;
                ctx.strokeRect(x - size * 0.5 - 3, y - size * 0.4 - 3, size + 6, size * 0.8 + 6);
            }
        }
    }

    handleSpaceClick(mouseX, mouseY) {
        // Check if clicked on a level slot
        for (const slot of this.levelSlots) {
            if (!slot.level) continue;
            
            const size = 40;
            if (mouseX >= slot.x - size * 0.4 && mouseX <= slot.x + size * 0.4 &&
                mouseY >= slot.y - size * 0.35 && mouseY <= slot.y + size * 0.5) {
                
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
