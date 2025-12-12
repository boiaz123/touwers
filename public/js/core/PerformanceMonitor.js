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
        
        // Main background panel
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(x, y, 280, 80);
        
        // Border
        ctx.strokeStyle = fpsColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, 280, 80);
        
        // Title
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px monospace';
        ctx.fillText('PERFORMANCE MONITOR', x + 8, y + 16);
        
        // FPS line - prominent
        ctx.fillStyle = fpsColor;
        ctx.font = 'bold 14px monospace';
        ctx.fillText(`FPS: ${stats.fps}`, x + 8, y + 36);
        
        ctx.fillStyle = '#cccccc';
        ctx.font = '11px monospace';
        ctx.fillText(`Status: ${fpsStatus}`, x + 130, y + 36);
        
        // Frame timing details
        ctx.fillStyle = '#aaaaaa';
        ctx.font = '10px monospace';
        ctx.fillText(`Frame: ${stats.frameTime}ms | Avg: ${stats.avgFrameTime}ms`, x + 8, y + 52);
        ctx.fillText(`Update: ${stats.updateTime}ms | Render: ${stats.renderTime}ms`, x + 8, y + 66);
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
