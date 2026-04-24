import { PlayerLevelDesigner } from '../../level-designer/PlayerLevelDesigner.js';

/**
 * LevelDesignerState
 * A game state that shows the level designer HTML overlay and hides the game canvas.
 * Entered from Commander's Workshop (campaign-5). The designer saves levels directly
 * to the current save slot via stateManager.
 */
export class LevelDesignerState {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.designer = null;
        this._backHandler = null;
        this._keyHandler = null;
        this._tabHandlers = null;
    }

    enter() {
        const overlay = document.getElementById('designer-overlay');
        const canvas = document.getElementById('gameCanvas');
        if (overlay) overlay.style.display = 'flex';
        if (canvas) canvas.style.display = 'none';

        // Also hide game UI elements
        const statsBar = document.getElementById('stats-bar');
        const sidebar = document.getElementById('tower-sidebar');
        if (statsBar) statsBar.style.display = 'none';
        if (sidebar) sidebar.style.display = 'none';

        // Instantiate the designer once on first enter
        if (!this.designer) {
            this.designer = new PlayerLevelDesigner('designCanvas', {
                gridWidth: 60,
                gridHeight: 33.75,
                cellSize: 32
            });
            window.levelDesigner = this.designer;
        }

        // Provide stateManager access to the designer so saveToSlot can persist correctly
        this.designer.setStateManager(this.stateManager);

        // Wire the "Back to Workshop" button
        this._backHandler = () => {
            this.stateManager.changeState('campaign-5');
        };
        const backBtn = document.getElementById('designerBackBtn');
        if (backBtn) backBtn.addEventListener('click', this._backHandler);

        // Wire tab switching
        this._tabHandlers = [];
        document.querySelectorAll('#designer-overlay .tab-btn').forEach(btn => {
            const handler = () => {
                const tab = btn.dataset.tab;
                document.querySelectorAll('#designer-overlay .dov-panel-tabs .tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('#designer-overlay .tab-panel').forEach(p => p.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById('tab-' + tab)?.classList.add('active');
            };
            btn.addEventListener('click', handler);
            this._tabHandlers.push({ btn, handler });
        });

        // Keyboard shortcuts (scoped to when designer is active)
        this._keyHandler = (e) => {
            if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
            if (!this.designer) return;
            if (e.key === 'u' || e.key === 'U') this.designer.undo();
            if (e.key === 'p' || e.key === 'P') this.designer.setMode('path');
            if (e.key === 'v' || e.key === 'V') this.designer.setTerrainMode('vegetation');
            if (e.key === 'r' || e.key === 'R') this.designer.setTerrainMode('rock');
            if (e.key === 'w' || e.key === 'W') this.designer.setTerrainMode('water');
            if (e.key === 'Escape') this.designer.setMode('path');
        };
        document.addEventListener('keydown', this._keyHandler);

        // Force a resize so the designer canvas fills its new container
        if (this.designer) {
            setTimeout(() => {
                if (this.designer && typeof this.designer.handleResize === 'function') {
                    this.designer.handleResize();
                }
            }, 50);
        }
    }

    exit() {
        const overlay = document.getElementById('designer-overlay');
        const canvas = document.getElementById('gameCanvas');
        if (overlay) overlay.style.display = 'none';
        if (canvas) canvas.style.display = 'block';

        // Remove back button handler
        if (this._backHandler) {
            const backBtn = document.getElementById('designerBackBtn');
            if (backBtn) backBtn.removeEventListener('click', this._backHandler);
            this._backHandler = null;
        }

        // Remove tab handlers
        if (this._tabHandlers) {
            this._tabHandlers.forEach(({ btn, handler }) => {
                btn.removeEventListener('click', handler);
            });
            this._tabHandlers = null;
        }

        // Remove keyboard handler
        if (this._keyHandler) {
            document.removeEventListener('keydown', this._keyHandler);
            this._keyHandler = null;
        }
    }

    // Rendering is handled entirely by the designer's own canvas — no-ops below
    render(ctx) {}
    update(deltaTime) {}
}
