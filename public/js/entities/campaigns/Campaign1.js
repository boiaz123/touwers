import { CampaignBase } from './CampaignBase.js';
import { LevelFactory } from '../../game/LevelFactory.js';

/**
 * Campaign1: The Great Northern Campaign
 * Features a natural map landscape with terrain and a winding path
 */
export class Campaign1 extends CampaignBase {
    constructor(stateManager) {
        super(stateManager);
        
        this.campaignId = 'campaign-1';
        this.campaignName = 'The Great Northern Campaign';
        
        // Initialize terrain and path after levels are loaded
        this.terrainTiles = [];
        this.pathSegments = [];
    }
    
    enter() {
        // Load levels from factory
        const saveData = this.stateManager.currentSaveData;
        const allLevels = LevelFactory.getLevelList(saveData);
        this.levels = allLevels.filter(level => 
            ['level1', 'level2', 'level3', 'level4', 'level5'].includes(level.id)
        );
        
        // Generate level slot positions along a natural winding path
        this.generatePathAndSlots();
        
        // Call parent enter
        super.enter();
    }
    
    generatePathAndSlots() {
        const canvas = this.stateManager.canvas;
        const width = canvas.width;
        const height = canvas.height;
        
        // Define the winding path with key points
        this.pathPoints = [
            { x: width * 0.1, y: height * 0.7 },      // Start bottom left
            { x: width * 0.2, y: height * 0.6 },
            { x: width * 0.25, y: height * 0.4 },
            { x: width * 0.35, y: height * 0.3 },
            { x: width * 0.5, y: height * 0.25 },
            { x: width * 0.65, y: height * 0.3 },
            { x: width * 0.75, y: height * 0.45 },
            { x: width * 0.85, y: height * 0.55 },
            { x: width * 0.9, y: height * 0.7 }
        ];
        
        // Generate level slots evenly distributed along the path
        this.levelSlots = [];
        for (let i = 0; i < this.levels.length; i++) {
            const t = i / (this.levels.length - 1); // 0 to 1
            const pos = this.getPointOnPath(t);
            this.levelSlots.push(pos);
        }
    }
    
    getPointOnPath(t) {
        // Interpolate along the path based on parameter t (0 to 1)
        const points = this.pathPoints;
        const segmentLength = 1 / (points.length - 1);
        const segment = Math.floor(t / segmentLength);
        const localT = (t - segment * segmentLength) / segmentLength;
        
        if (segment >= points.length - 1) {
            return points[points.length - 1];
        }
        
        const p1 = points[segment];
        const p2 = points[segment + 1];
        
        return {
            x: p1.x + (p2.x - p1.x) * localT,
            y: p1.y + (p2.y - p1.y) * localT
        };
    }
    
    renderBackground(ctx, canvas) {
        // Sky gradient
        const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        skyGradient.addColorStop(0, '#87ceeb');
        skyGradient.addColorStop(0.4, '#e0f6ff');
        skyGradient.addColorStop(1, '#c8d7e8');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    renderTerrain(ctx) {
        const canvas = this.stateManager.canvas;
        
        // Grass areas
        ctx.fillStyle = '#2d8a2d';
        ctx.beginPath();
        ctx.rect(0, canvas.height * 0.5, canvas.width * 0.3, canvas.height * 0.5);
        ctx.fill();
        
        ctx.fillStyle = '#3a9c3a';
        ctx.beginPath();
        ctx.rect(canvas.width * 0.7, canvas.height * 0.6, canvas.width * 0.3, canvas.height * 0.4);
        ctx.fill();
        
        // Rocky mountain areas
        ctx.fillStyle = '#6b6b6b';
        ctx.beginPath();
        ctx.ellipse(canvas.width * 0.25, canvas.height * 0.35, 100, 80, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#5a5a5a';
        ctx.beginPath();
        ctx.ellipse(canvas.width * 0.7, canvas.height * 0.3, 90, 70, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Snow areas
        ctx.fillStyle = '#f0f8ff';
        ctx.beginPath();
        ctx.rect(canvas.width * 0.35, 0, canvas.width * 0.3, canvas.height * 0.25);
        ctx.fill();
        
        // Water areas (rivers)
        ctx.fillStyle = '#4da6ff';
        ctx.strokeStyle = '#2d7acc';
        ctx.lineWidth = 2;
        
        // River flowing
        ctx.beginPath();
        ctx.moveTo(canvas.width * 0.15, canvas.height * 0.1);
        ctx.quadraticCurveTo(
            canvas.width * 0.35, canvas.height * 0.2,
            canvas.width * 0.5, canvas.height * 0.35
        );
        ctx.quadraticCurveTo(
            canvas.width * 0.65, canvas.height * 0.5,
            canvas.width * 0.8, canvas.height * 0.8
        );
        
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Add some water area
        ctx.fillStyle = 'rgba(77, 166, 255, 0.4)';
        ctx.lineWidth = 40;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        
        // Decorative elements - trees
        this.drawTree(ctx, canvas.width * 0.15, canvas.height * 0.7);
        this.drawTree(ctx, canvas.width * 0.2, canvas.height * 0.75);
        this.drawTree(ctx, canvas.width * 0.75, canvas.height * 0.75);
        this.drawTree(ctx, canvas.width * 0.82, canvas.height * 0.78);
        
        // Snow trees
        this.drawSnowTree(ctx, canvas.width * 0.4, canvas.height * 0.15);
        this.drawSnowTree(ctx, canvas.width * 0.45, canvas.height * 0.18);
        this.drawSnowTree(ctx, canvas.width * 0.5, canvas.height * 0.12);
        this.drawSnowTree(ctx, canvas.width * 0.55, canvas.height * 0.17);
        
        // Decorative rocks
        this.drawRock(ctx, canvas.width * 0.3, canvas.height * 0.55);
        this.drawRock(ctx, canvas.width * 0.35, canvas.height * 0.5);
        this.drawRock(ctx, canvas.width * 0.65, canvas.height * 0.6);
    }
    
    drawTree(ctx, x, y) {
        // Tree trunk
        ctx.fillStyle = '#4a3228';
        ctx.fillRect(x - 5, y - 20, 10, 25);
        
        // Tree foliage
        ctx.fillStyle = '#1a5c1a';
        ctx.beginPath();
        ctx.ellipse(x, y - 15, 18, 20, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawSnowTree(ctx, x, y) {
        // Snow tree trunk
        ctx.fillStyle = '#8b7355';
        ctx.fillRect(x - 4, y - 15, 8, 18);
        
        // Snow tree foliage
        ctx.fillStyle = '#e8e8e8';
        ctx.beginPath();
        ctx.ellipse(x, y - 10, 14, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#f5f5f5';
        ctx.beginPath();
        ctx.ellipse(x, y - 8, 10, 10, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawRock(ctx, x, y) {
        ctx.fillStyle = '#7a7a7a';
        ctx.beginPath();
        ctx.ellipse(x, y, 12, 8, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
        ctx.beginPath();
        ctx.ellipse(x - 3, y - 2, 5, 3, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    renderPath(ctx) {
        // Draw the main path connecting slots
        ctx.strokeStyle = '#b8956b';
        ctx.lineWidth = 35;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
        
        // Draw smooth path through all points
        for (let i = 1; i < this.pathPoints.length; i++) {
            ctx.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
        }
        ctx.stroke();
        
        // Draw path border/shadow for depth
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.lineWidth = 40;
        ctx.beginPath();
        ctx.moveTo(this.pathPoints[0].x + 2, this.pathPoints[0].y + 2);
        for (let i = 1; i < this.pathPoints.length; i++) {
            ctx.lineTo(this.pathPoints[i].x + 2, this.pathPoints[i].y + 2);
        }
        ctx.stroke();
        
        // Draw path details (grass edges)
        ctx.strokeStyle = 'rgba(45, 138, 45, 0.4)';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        
        ctx.beginPath();
        ctx.moveTo(this.pathPoints[0].x - 18, this.pathPoints[0].y - 18);
        for (let i = 1; i < this.pathPoints.length; i++) {
            ctx.lineTo(this.pathPoints[i].x - 18, this.pathPoints[i].y - 18);
        }
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(this.pathPoints[0].x + 18, this.pathPoints[0].y + 18);
        for (let i = 1; i < this.pathPoints.length; i++) {
            ctx.lineTo(this.pathPoints[i].x + 18, this.pathPoints[i].y + 18);
        }
        ctx.stroke();
        
        ctx.setLineDash([]);
    }
    
    renderLevelSlot(ctx, index) {
        const level = this.levels[index];
        if (!level || !this.levelSlots[index]) return;
        
        const bounds = this.getLevelSlotBounds(index);
        const isHovered = index === this.hoveredLevel;
        const isLocked = !level.unlocked;
        
        // Draw connection indicator to path
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(bounds.centerX, bounds.centerY);
        
        // Find nearest path point
        let nearest = this.pathPoints[0];
        let minDist = Infinity;
        this.pathPoints.forEach(p => {
            const d = Math.hypot(p.x - bounds.centerX, p.y - bounds.centerY);
            if (d < minDist) {
                minDist = d;
                nearest = p;
            }
        });
        ctx.lineTo(nearest.x, nearest.y);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw slot circle with shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(bounds.centerX + 3, bounds.centerY + 3, 45, 0, Math.PI * 2);
        ctx.fill();
        
        let bgColor = '#8b5a2b';
        let borderColor = '#5a3a1a';
        let borderWidth = 2;
        
        if (isLocked) {
            bgColor = '#4a4a4a';
            borderColor = '#2a2a2a';
            borderWidth = 1;
        } else if (isHovered) {
            bgColor = '#c19a6b';
            borderColor = '#d4af37';
            borderWidth = 3;
        }
        
        ctx.fillStyle = bgColor;
        ctx.beginPath();
        ctx.arc(bounds.centerX, bounds.centerY, 45, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = borderWidth;
        ctx.beginPath();
        ctx.arc(bounds.centerX, bounds.centerY, 45, 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner highlight
        if (!isLocked) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(bounds.centerX - 15, bounds.centerY - 15, 30, 0, Math.PI * 1.5);
            ctx.stroke();
        }
        
        // Level number
        if (isLocked) {
            ctx.font = 'bold 20px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#666';
            ctx.fillText('🔒', bounds.centerX, bounds.centerY);
        } else {
            ctx.font = 'bold 32px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = isHovered ? '#ffd700' : '#ffffcc';
            ctx.fillText(index + 1, bounds.centerX, bounds.centerY);
            
            // Level name below slot
            ctx.font = '9px serif';
            ctx.fillStyle = '#c9a876';
            ctx.fillText(level.name, bounds.centerX, bounds.centerY + 50);
        }
    }
    
    update(deltaTime) {
        // Can add animations here later
    }
}
