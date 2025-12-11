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
        
        // Get batch rendering stats if available
        let batchStats = '';
        try {
            const canvas = document.getElementById('gameCanvas');
            if (canvas && canvas._webglCtx && canvas._webglCtx.getBatchStats) {
                const batch = canvas._webglCtx.getBatchStats();
                if (batch) {
                    batchStats = ` | Batches: ${batch.totalBatches} | Ops: ${batch.totalOperations} | Avg: ${batch.avgBatchSize}`;
                }
            }
        } catch (e) {
            // Batch stats not available
        }
        
        const text = `FPS: ${stats.fps} | Frame: ${stats.frameTime}ms | Avg: ${stats.avgFrameTime}ms${batchStats}`;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x, y, Math.min(800, ctx.canvas.width - x - 5), 25);
        
        ctx.fillStyle = stats.fps < 30 ? '#ff0000' : stats.fps < 50 ? '#ffff00' : '#00ff00';
        ctx.font = '12px monospace';
        ctx.fillText(text, x + 5, y + 18);
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
