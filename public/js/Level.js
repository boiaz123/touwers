export class Level {
    constructor(levelManager) {
        this.levelManager = levelManager;
        this.path = [];
        this.updateLevel();
    }
    
    updateLevel() {
        const currentLevelData = this.levelManager.getCurrentLevel();
        if (currentLevelData) {
            this.updatePathForSize(800, 600, currentLevelData);
        }
    }
    
    updatePathForSize(width, height, levelData = null) {
        const currentLevelData = levelData || this.levelManager.getCurrentLevel();
        if (currentLevelData && currentLevelData.generatePath) {
            this.path = currentLevelData.generatePath(width, height);
        } else {
            // Fallback to default path
            this.path = this.generateDefaultPath(width, height);
        }
    }
    
    generateDefaultPath(width, height) {
        const segmentLength = Math.min(width, height) * 0.25;
        return [
            { x: 0, y: height * 0.5 },
            { x: segmentLength, y: height * 0.5 },
            { x: segmentLength, y: height * 0.2 },
            { x: segmentLength * 2, y: height * 0.2 },
            { x: segmentLength * 2, y: height * 0.8 },
            { x: segmentLength * 3, y: height * 0.8 },
            { x: segmentLength * 3, y: height * 0.4 },
            { x: width - 50, y: height * 0.4 }
        ];
    }
    
    nextLevel() {
        if (this.levelManager.nextLevel()) {
            this.updateLevel();
            return true;
        }
        return false;
    }
    
    render(ctx) {
        const canvas = ctx.canvas;
        const lineWidth = Math.max(30, Math.min(canvas.width, canvas.height) * 0.05);
        
        ctx.strokeStyle = '#444';
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(this.path[0].x, this.path[0].y);
        for (let i = 1; i < this.path.length; i++) {
            ctx.lineTo(this.path[i].x, this.path[i].y);
        }
        ctx.lineTo(canvas.width / (window.devicePixelRatio || 1), this.path[this.path.length - 1].y);
        ctx.stroke();
    }
}
