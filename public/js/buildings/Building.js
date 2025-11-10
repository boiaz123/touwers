export class Building {
    constructor(x, y, gridX, gridY, size = 4) {
        this.x = x;
        this.y = y;
        this.gridX = gridX;
        this.gridY = gridY;
        this.size = size;
        this.animationTime = 0;
    }
    
    update(deltaTime) {
        this.animationTime += deltaTime;
    }
    
    render(ctx, buildingSize) {
        // Override in subclasses
    }
    
    // Render clickable icon in bottom-right corner
    renderClickableIcon(ctx, buildingSize, icon = '⚙️') {
        const iconSize = Math.max(24, buildingSize * 0.18); // Increased from 20 and 0.15
        
        // Position at bottom-right corner of the building's grid area
        const iconX = this.x + (buildingSize / 2) - (iconSize * 0.7);
        const iconY = this.y + (buildingSize / 2) - (iconSize * 0.7);
        
        // Icon background with pulse effect
        const pulse = Math.sin(this.animationTime * 3) * 0.2 + 0.8;
        ctx.fillStyle = `rgba(139, 69, 19, ${pulse * 0.8})`;
        ctx.beginPath();
        ctx.arc(iconX, iconY, iconSize / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Icon border
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Icon symbol
        ctx.fillStyle = '#FFD700';
        ctx.font = `${iconSize * 0.6}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icon, iconX, iconY);
        
        // Store icon bounds for click detection - exact match to visual position
        this.iconBounds = {
            x: iconX - iconSize / 2,
            y: iconY - iconSize / 2,
            width: iconSize,
            height: iconSize
        };
    }
    
    // Check if click is on the icon
    isIconClicked(x, y) {
        if (!this.iconBounds) return false;
        
        return x >= this.iconBounds.x && 
               x <= this.iconBounds.x + this.iconBounds.width &&
               y >= this.iconBounds.y && 
               y <= this.iconBounds.y + this.iconBounds.height;
    }
    
    applyEffect(towerManager) {
        // Override in subclasses
    }
    
    static getInfo() {
        return {
            name: 'Base Building',
            description: 'Base building class',
            effect: 'None',
            size: '4x4',
            cost: 0
        };
    }
}
