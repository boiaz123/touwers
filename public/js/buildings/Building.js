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
    
    applyEffect(towerManager) {
        // Override in subclasses
    }
    
    isPointInside(x, y, cellSize) {
        // Default: building occupies 4x4 grid cells
        const buildingSize = cellSize * this.size;
        const halfSize = buildingSize / 2;
        return x >= this.x - halfSize && x <= this.x + halfSize &&
               y >= this.y - halfSize && y <= this.y + halfSize;
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
