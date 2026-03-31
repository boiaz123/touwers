import { InputManager } from '../core/InputManager.js';

/**
 * ControlsScreen - Comprehensive controls/keybinding overlay
 * Shows tabbed interface for different control schemes:
 * Keyboard+Mouse, Controller, Touch Screen
 * Also has controller cursor speed setting.
 */
export class ControlsScreen {
    constructor(inputManager, audioManager) {
        this.inputManager = inputManager;
        this.audioManager = audioManager;
        this.overlay = null;
        this.currentListeningBtn = null;
        this.activeTab = 'keyboard'; // 'keyboard', 'controller', 'touch'
    }

    /**
     * Show the controls overlay
     */
    show() {
        if (this.overlay) this.hide();

        this.overlay = document.createElement('div');
        this.overlay.className = 'controls-overlay';
        this.overlay.id = 'controls-screen-overlay';

        const panel = document.createElement('div');
        panel.className = 'controls-panel';

        // Header
        const header = document.createElement('div');
        header.className = 'controls-header';
        header.innerHTML = `
            <div class="controls-title">Controls</div>
            <button class="controls-close-btn" id="controls-close-btn">x</button>
        `;
        panel.appendChild(header);

        // Tab bar
        const tabBar = document.createElement('div');
        tabBar.className = 'controls-tab-bar';
        tabBar.innerHTML = `
            <button class="controls-tab active" data-tab="keyboard">Keyboard + Mouse</button>
            <button class="controls-tab" data-tab="controller">Controller</button>
            <button class="controls-tab" data-tab="touch">Touch Screen</button>
        `;
        panel.appendChild(tabBar);

        // Body (tab content)
        const body = document.createElement('div');
        body.className = 'controls-body';
        body.id = 'controls-tab-content';
        panel.appendChild(body);

        // Footer
        const footer = document.createElement('div');
        footer.className = 'controls-footer';
        footer.innerHTML = `
            <button class="controls-reset-btn" id="controls-reset-btn">Reset to Defaults</button>
            <button class="controls-done-btn" id="controls-done-btn">Done</button>
        `;
        panel.appendChild(footer);

        this.overlay.appendChild(panel);
        document.body.appendChild(this.overlay);

        // Tab switching
        tabBar.querySelectorAll('.controls-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                if (this.audioManager) this.audioManager.playSFX('button-click');
                tabBar.querySelectorAll('.controls-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.activeTab = tab.dataset.tab;
                this._renderTabContent();
            });
        });

        // Event listeners
        const closeBtn = document.getElementById('controls-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }

        const doneBtn = document.getElementById('controls-done-btn');
        if (doneBtn) {
            doneBtn.addEventListener('click', () => this.hide());
        }

        const resetBtn = document.getElementById('controls-reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this._resetDefaults());
        }

        // Click overlay background to close
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.hide();
            }
        });

        // Render initial tab
        this._renderTabContent();
    }

    _renderTabContent() {
        const content = document.getElementById('controls-tab-content');
        if (!content) return;
        content.innerHTML = '';

        switch (this.activeTab) {
            case 'keyboard':
                this._renderKeyboardTab(content);
                break;
            case 'controller':
                this._renderControllerTab(content);
                break;
            case 'touch':
                this._renderTouchTab(content);
                break;
        }
    }

    _renderKeyboardTab(container) {
        // Mouse controls
        container.innerHTML += `
            <div class="controls-category">
                <div class="controls-category-title">Mouse Controls</div>
                <div class="controls-info-grid">
                    <div class="controls-info-row"><span class="controls-key-label">Left Click</span><span class="controls-key-desc">Select, place tower/building, interact</span></div>
                    <div class="controls-info-row"><span class="controls-key-label">Right Click</span><span class="controls-key-desc">Cancel placement</span></div>
                    <div class="controls-info-row"><span class="controls-key-label">Mouse Hover</span><span class="controls-key-desc">Preview tower/building info</span></div>
                </div>
            </div>
        `;

        // Keyboard bindings (editable)
        const categories = InputManager.ACTION_CATEGORIES;
        const bindings = this.inputManager.getAllBindings();

        for (const [categoryName, actions] of Object.entries(categories)) {
            const catDiv = document.createElement('div');
            catDiv.className = 'controls-category';

            const catTitle = document.createElement('div');
            catTitle.className = 'controls-category-title';
            catTitle.textContent = categoryName;
            catDiv.appendChild(catTitle);

            for (const action of actions) {
                const row = document.createElement('div');
                row.className = 'controls-row';

                const label = document.createElement('span');
                label.className = 'controls-action-name';
                label.textContent = InputManager.ACTION_LABELS[action] || action;

                const keyBtn = document.createElement('button');
                keyBtn.className = 'controls-key-btn';
                keyBtn.dataset.action = action;
                keyBtn.textContent = InputManager.getKeyDisplayName(bindings[action]);

                keyBtn.addEventListener('click', () => {
                    this._startRebind(keyBtn, action);
                });

                row.appendChild(label);
                row.appendChild(keyBtn);
                catDiv.appendChild(row);
            }

            container.appendChild(catDiv);
        }
    }

    _renderControllerTab(container) {
        // Controller navigation info
        container.innerHTML += `
            <div class="controls-category">
                <div class="controls-category-title">Navigation</div>
                <div class="controls-info-grid">
                    <div class="controls-info-row"><span class="controls-key-label">Left Stick</span><span class="controls-key-desc">Move cursor (in-game / settlement) or navigate buttons (menus)</span></div>
                    <div class="controls-info-row"><span class="controls-key-label">D-Pad</span><span class="controls-key-desc">Move cursor (in-game) or navigate buttons (menus)</span></div>
                    <div class="controls-info-row"><span class="controls-key-label">Right Stick</span><span class="controls-key-desc">Scroll sidebar</span></div>
                </div>
            </div>
        `;

        // Action buttons
        container.innerHTML += `
            <div class="controls-category">
                <div class="controls-category-title">Actions</div>
                <div class="controls-info-grid">
                    <div class="controls-info-row"><span class="controls-key-label">A Button</span><span class="controls-key-desc">Confirm / Place / Select</span></div>
                    <div class="controls-info-row"><span class="controls-key-label">B Button</span><span class="controls-key-desc">Cancel / Go Back</span></div>
                    <div class="controls-info-row"><span class="controls-key-label">X Button</span><span class="controls-key-desc">Collect nearest loot</span></div>
                    <div class="controls-info-row"><span class="controls-key-label">Y Button</span><span class="controls-key-desc">Start next wave</span></div>
                </div>
            </div>
        `;

        // Menu & speed
        container.innerHTML += `
            <div class="controls-category">
                <div class="controls-category-title">Menu & Speed</div>
                <div class="controls-info-grid">
                    <div class="controls-info-row"><span class="controls-key-label">Start</span><span class="controls-key-desc">Pause / Resume</span></div>
                    <div class="controls-info-row"><span class="controls-key-label">Back / Select</span><span class="controls-key-desc">Open menu</span></div>
                    <div class="controls-info-row"><span class="controls-key-label">LT (Left Trigger)</span><span class="controls-key-desc">Decrease game speed</span></div>
                    <div class="controls-info-row"><span class="controls-key-label">RT (Right Trigger)</span><span class="controls-key-desc">Increase game speed</span></div>
                    <div class="controls-info-row"><span class="controls-key-label">LB / RB</span><span class="controls-key-desc">Cycle tower/building selection</span></div>
                </div>
            </div>
        `;

        // Controller cursor speed setting
        const cursorSpeed = this.inputManager.getCursorSpeed();
        const speedSettingDiv = document.createElement('div');
        speedSettingDiv.className = 'controls-category';
        speedSettingDiv.innerHTML = `
            <div class="controls-category-title">Controller Settings</div>
            <div class="controls-setting-row">
                <label class="controls-setting-label">Cursor Speed</label>
                <div class="controls-slider-container">
                    <input type="range" id="cursor-speed-slider" class="controls-slider" min="4" max="30" value="${cursorSpeed}" step="1">
                    <span id="cursor-speed-value" class="controls-slider-value">${cursorSpeed}</span>
                </div>
            </div>
        `;
        container.appendChild(speedSettingDiv);

        // Wire up slider
        setTimeout(() => {
            const slider = document.getElementById('cursor-speed-slider');
            const valueDisplay = document.getElementById('cursor-speed-value');
            if (slider && valueDisplay) {
                slider.addEventListener('input', (e) => {
                    const val = parseInt(e.target.value);
                    valueDisplay.textContent = val;
                    this.inputManager.setCursorSpeed(val);
                });
            }
        }, 0);
    }

    _renderTouchTab(container) {
        container.innerHTML += `
            <div class="controls-category">
                <div class="controls-category-title">Basic Controls</div>
                <div class="controls-info-grid">
                    <div class="controls-info-row"><span class="controls-key-label">Tap</span><span class="controls-key-desc">Select, place tower/building, interact with buttons</span></div>
                    <div class="controls-info-row"><span class="controls-key-label">Long Press</span><span class="controls-key-desc">Cancel placement (same as right-click)</span></div>
                    <div class="controls-info-row"><span class="controls-key-label">Drag</span><span class="controls-key-desc">Drag tower/building from sidebar onto the map</span></div>
                </div>
            </div>
        `;

        container.innerHTML += `
            <div class="controls-category">
                <div class="controls-category-title">Gestures</div>
                <div class="controls-info-grid">
                    <div class="controls-info-row"><span class="controls-key-label">Swipe</span><span class="controls-key-desc">Scroll through sidebar items</span></div>
                    <div class="controls-info-row"><span class="controls-key-label">Pinch</span><span class="controls-key-desc">Zoom (where supported)</span></div>
                </div>
            </div>
        `;

        container.innerHTML += `
            <div class="controls-category">
                <div class="controls-category-title">Tips</div>
                <div class="controls-mouse-info" style="color: var(--text-secondary); line-height: 1.8;">
                    Touch controls work best on tablets and larger screens.<br>
                    Drag directly from sidebar buttons to place towers and buildings.<br>
                    Long press on the map cancels the current placement.<br>
                    All buttons and menus respond to tap.
                </div>
            </div>
        `;
    }

    /**
     * Hide and remove the controls overlay
     */
    hide() {
        // Cancel any active rebind
        if (this.currentListeningBtn) {
            this.inputManager.cancelRebind();
            this.currentListeningBtn.classList.remove('listening');
            this.currentListeningBtn = null;
        }

        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
    }

    /**
     * Check if the controls screen is currently visible
     */
    isVisible() {
        return this.overlay !== null;
    }

    _startRebind(btn, action) {
        if (this.audioManager) {
            this.audioManager.playSFX('button-click');
        }

        // Cancel previous rebind if any
        if (this.currentListeningBtn) {
            this.currentListeningBtn.classList.remove('listening');
            this.currentListeningBtn.textContent = InputManager.getKeyDisplayName(
                this.inputManager.getBinding(this.currentListeningBtn.dataset.action)
            );
            this.inputManager.cancelRebind();
        }

        btn.classList.add('listening');
        btn.textContent = 'Press a key...';
        this.currentListeningBtn = btn;

        this.inputManager.startRebind(action, (newKey) => {
            btn.classList.remove('listening');
            this.currentListeningBtn = null;

            if (newKey) {
                // Update this button
                btn.textContent = InputManager.getKeyDisplayName(newKey);
                // Update any other button that might have been swapped
                this._refreshAllKeyButtons();
            } else {
                // Cancelled
                btn.textContent = InputManager.getKeyDisplayName(this.inputManager.getBinding(action));
            }
        });
    }

    _resetDefaults() {
        if (this.audioManager) {
            this.audioManager.playSFX('button-click');
        }

        this.inputManager.resetToDefaults();
        this._refreshAllKeyButtons();
    }

    _refreshAllKeyButtons() {
        if (!this.overlay) return;
        const bindings = this.inputManager.getAllBindings();
        this.overlay.querySelectorAll('.controls-key-btn').forEach(btn => {
            const action = btn.dataset.action;
            if (action && bindings[action] !== undefined) {
                btn.textContent = InputManager.getKeyDisplayName(bindings[action]);
            }
        });
    }
}
