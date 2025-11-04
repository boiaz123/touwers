export class Level {
    constructor(levelManager) {
        this.levelManager = levelManager;
        this.path = [];
        // Don't call updateLevel here since levels might not be loaded yet
    }
    
    updateLevel() {
        console.log('Updating level...');
        const currentLevelData = this.levelManager.getCurrentLevel();
        console.log('Current level data:', currentLevelData);
        
        if (currentLevelData) {
            this.updatePathForSize(800, 600, currentLevelData);
        } else {
            console.warn('No level data found, using default path');
            this.path = this.generateDefaultPath(800, 600);
        }
        
        console.log('Updated path:', this.path);
    }
    
    updatePathForSize(width, height, levelData = null) {
        const currentLevelData = levelData || this.levelManager.getCurrentLevel();
        if (currentLevelData && currentLevelData.generatePath) {
            this.path = currentLevelData.generatePath(width, height);
            console.log('Generated path from level data:', this.path);
        } else {
            // Fallback to default path
            this.path = this.generateDefaultPath(width, height);
            console.log('Using default path:', this.path);
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
        if (!this.path || this.path.length === 0) {
            console.warn('No path to render');
            return;
        }
        
        const canvas = ctx.canvas;
        const dpr = window.devicePixelRatio || 1;
        const lineWidth = Math.max(30, Math.min(canvas.width / dpr, canvas.height / dpr) * 0.05);
        
        ctx.strokeStyle = '#444';
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(this.path[0].x, this.path[0].y);
        for (let i = 1; i < this.path.length; i++) {
            ctx.lineTo(this.path[i].x, this.path[i].y);
        }
        ctx.lineTo(canvas.width / dpr, this.path[this.path.length - 1].y);
        ctx.stroke();
    }
}
