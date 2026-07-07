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
        this.enabled = true;

        // Per-system timing slots, accumulated (+=) via beginSlot/endSlot so renderSync
        // can sum several per-entity _syncXPixi calls within one frame. towerUpdate,
        // enemyUpdate and renderSync are all produced and read within the same
        // update()+render() cycle, so they're cleared in startFrame() below.
        // pixiSubmit is a special case: it's measured in game.js *after* render() (and
        // its overlay draw) has already completed for this frame, so it can only ever
        // be displayed one frame late. It clears itself immediately before its own
        // begin/end bracket in game.js instead of here, so the value survives the gap
        // between this frame's startFrame() reset and next frame's overlay draw.
        this.slotTimes = { towerUpdate: 0, enemyUpdate: 0, renderSync: 0, pixiSubmit: 0 };
        this._slotStart = {};

        // Live entity counts, set once per frame by GameplayState alongside the slot
        // timings above - lets a timing spike be correlated to "N enemies" instead of
        // eyeballed against wave progress. Not reset in startFrame(): overwritten wholesale
        // every frame by whoever calls setEntityCounts(), same pattern as drawCalls below.
        this.entityCounts = { towers: 0, enemies: 0, buildings: 0, loot: 0 };
        // GPU draw calls for this frame, reported by PixiApp (see its _wrapGLDrawCalls) via
        // game.js after renderFrame() - like pixiSubmit, this lands one frame behind the
        // overlay draw since the GPU submit happens after this frame's render() completes.
        this.drawCalls = 0;

        // Rolling history of full per-frame snapshots, for the dump-to-console diagnostic
        // (see snapshotHistory()) used when stress-testing at scale - the live overlay only
        // shows the current instant, this lets a whole ramp-up be captured and compared.
        this._history = [];
        this._historyLimit = 300;
    }

    setEntityCounts(counts) {
        this.entityCounts.towers = counts.towers || 0;
        this.entityCounts.enemies = counts.enemies || 0;
        this.entityCounts.buildings = counts.buildings || 0;
        this.entityCounts.loot = counts.loot || 0;
    }

    setDrawCalls(count) {
        this.drawCalls = count;
    }

    /** Dumps the rolling history as a console.table and returns it, for capturing stress-test
     *  runs (see GameplayState's dev stress-test hotkeys). Clears the history afterward so
     *  consecutive dumps don't re-report old frames. */
    dumpHistory() {
        if (this._history.length === 0) {
            console.log('PerformanceMonitor: no history recorded yet.');
            return [];
        }
        console.table(this._history);
        const snapshot = this._history.slice();
        this._history = [];
        return snapshot;
    }

    startFrame() {
        if (!this.enabled) return;
        this.frameStartTime = performance.now();
        this.slotTimes.towerUpdate = 0;
        this.slotTimes.enemyUpdate = 0;
        this.slotTimes.renderSync = 0;
    }

    beginSlot(name) {
        if (!this.enabled) return;
        this._slotStart[name] = performance.now();
    }

    endSlot(name) {
        if (!this.enabled) return;
        const start = this._slotStart[name];
        if (start === undefined) return;
        this.slotTimes[name] = (this.slotTimes[name] || 0) + (performance.now() - start);
        this._slotStart[name] = undefined;
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

        // Record this frame into the rolling history for later dumpHistory() export.
        // drawCalls/pixiSubmit reflect the *previous* frame's GPU submit (see game.js) -
        // acceptable for stress-test analysis, which looks at sustained trends, not
        // single-frame precision.
        this._history.push({
            frame: this.frameCount,
            fps: this.fps,
            frameTime: +this.frameTime.toFixed(2),
            updateTime: +this.updateTime.toFixed(2),
            renderTime: +this.renderTime.toFixed(2),
            towerUpdate: +this.slotTimes.towerUpdate.toFixed(2),
            enemyUpdate: +this.slotTimes.enemyUpdate.toFixed(2),
            renderSync: +this.slotTimes.renderSync.toFixed(2),
            pixiSubmit: +this.slotTimes.pixiSubmit.toFixed(2),
            drawCalls: this.drawCalls,
            towers: this.entityCounts.towers,
            enemies: this.entityCounts.enemies,
            buildings: this.entityCounts.buildings,
            loot: this.entityCounts.loot,
        });
        if (this._history.length > this._historyLimit) {
            this._history.shift();
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
            maxFrameTime: this.maxFrameTime.toFixed(2),
            towerUpdateTime: this.slotTimes.towerUpdate.toFixed(2),
            enemyUpdateTime: this.slotTimes.enemyUpdate.toFixed(2),
            renderSyncTime: this.slotTimes.renderSync.toFixed(2),
            pixiSubmitTime: this.slotTimes.pixiSubmit.toFixed(2),
            drawCalls: this.drawCalls,
            entityCounts: this.entityCounts
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
        
        // Main background panel - increased width/height for better text fit
        const panelWidth = 380;
        const panelHeight = 132;
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

        // Per-system breakdown - added to distinguish tower/enemy update cost from
        // render-sync (Canvas2D->Pixi adapter) cost and the GPU submit call, which
        // previously happened outside endRender()'s measurement window entirely.
        ctx.fillText(`Tower: ${stats.towerUpdateTime}ms | Enemy: ${stats.enemyUpdateTime}ms`, x + 10, y + 72);
        ctx.fillText(`PixiSync: ${stats.renderSyncTime}ms | PixiSubmit: ${stats.pixiSubmitTime}ms`, x + 10, y + 87);

        // Entity counts + GPU draw calls - lets a timing spike above be correlated to
        // "N enemies" instead of eyeballed against wave progress during a stress test.
        const c = stats.entityCounts;
        ctx.fillText(`Towers: ${c.towers} | Enemies: ${c.enemies} | Buildings: ${c.buildings} | Loot: ${c.loot}`, x + 10, y + 102);
        ctx.fillText(`Draw calls: ${stats.drawCalls}`, x + 10, y + 117);
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
