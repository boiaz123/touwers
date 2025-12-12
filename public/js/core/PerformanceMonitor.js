/**
 * Performance Monitor - Tracks FPS and frame timing
 * Helps identify bottlenecks in the rendering pipeline
 */
export class PerformanceMonitor {
    constructor() {
        this.frameCount = 0;
        this.startTime = performance.now();
        this.lastSecondTime = this.startTime;
        this.fps = 0;
        this.frameTime = 0;
        this.updateTime = 0;
        this.renderTime = 0;
        this.maxFrameTime = 0;
        
        // Performance tracking
        this.frameTimings = [];
        this.targetFPS = 60;
        this.enabled = false; // Disabled by default to avoid overhead
    }

    startFrame() {
        if (!this.enabled) return;
        this.frameStartTime = performance.now();
    }

    endUpdate() {
        if (!this.enabled) return;
        this.updateEndTime = performance.now();
        this.updateTime = this.updateEndTime - this.frameStartTime;
    }

    endRender() {
        if (!this.enabled) return;
        const now = performance.now();
        this.renderTime = now - (this.updateEndTime || this.frameStartTime);
        this.frameTime = now - this.frameStartTime;
        
        // Track frame timing
        this.frameTimings.push(this.frameTime);
        if (this.frameTimings.length > 60) {
            this.frameTimings.shift();
        }
        
        // Update max frame time
        if (this.frameTime > this.maxFrameTime) {
            this.maxFrameTime = this.frameTime;
        }
        
        this.frameCount++;
        
        // Calculate FPS every second
        const currentTime = now;
        if (currentTime - this.lastSecondTime >= 1000) {
            this.fps = Math.round(this.frameCount * 1000 / (currentTime - this.lastSecondTime));
            this.frameCount = 0;
            this.lastSecondTime = currentTime;
        }
    }

    getStats() {
        const avgFrameTime = this.frameTimings.length > 0 
            ? this.frameTimings.reduce((a, b) => a + b, 0) / this.frameTimings.length 
            : 0;

        return {
            fps: this.fps,
            frameTime: this.frameTime.toFixed(2),
            updateTime: this.updateTime.toFixed(2),
            renderTime: this.renderTime.toFixed(2),
            avgFrameTime: avgFrameTime.toFixed(2),
            maxFrameTime: this.maxFrameTime.toFixed(2)
        };
    }

    render(ctx, x, y) {
        if (!this.enabled) return;
        
        const stats = this.getStats();
        
        // Determine color based on FPS
        let fpsColor = '#00ff00';  // Green for good FPS
        let fpsStatus = 'SMOOTH';
        if (stats.fps < 30) {
            fpsColor = '#ff0000';
            fpsStatus = 'POOR';
        } else if (stats.fps < 45) {
            fpsColor = '#ffaa00';
            fpsStatus = 'FAIR';
        } else if (stats.fps < 55) {
            fpsColor = '#ffff00';
            fpsStatus = 'GOOD';
        }
        
        // Main background panel - increased width for better text fit
        const panelWidth = 380;
        const panelHeight = 90;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(x, y, panelWidth, panelHeight);
        
        // Border
        ctx.strokeStyle = fpsColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, panelWidth, panelHeight);
        
        // Title
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('PERFORMANCE MONITOR', x + 10, y + 8);
        
        // FPS line - prominent
        ctx.fillStyle = fpsColor;
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`FPS: ${stats.fps}`, x + 10, y + 24);
        
        ctx.fillStyle = '#cccccc';
        ctx.font = '9px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`Status: ${fpsStatus}`, x + 140, y + 24);
        
        // Frame timing details - broken into two lines for better fit
        ctx.fillStyle = '#aaaaaa';
        ctx.font = '9px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`Frame: ${stats.frameTime}ms | Avg: ${stats.avgFrameTime}ms`, x + 10, y + 42);
        ctx.fillText(`Update: ${stats.updateTime}ms | Render: ${stats.renderTime}ms`, x + 10, y + 57);
    }

    enable() {
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
    }

    toggle() {
        this.enabled = !this.enabled;
    }
}
