import { InputManager } from '../core/InputManager.js';

/**
 * ControlsScreen - Reusable controls/keybinding overlay
 * Can be opened from the main Options menu or from in-game options.
 */
export class ControlsScreen {
    constructor(inputManager, audioManager) {
        this.inputManager = inputManager;
        this.audioManager = audioManager;
        this.overlay = null;
        this.currentListeningBtn = null;
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

        // Body
        const body = document.createElement('div');
        body.className = 'controls-body';

        // Mouse/Touch info section
        body.innerHTML += `
            <div class="controls-category">
                <div class="controls-category-title">Mouse / Touch</div>
                <div class="controls-mouse-info">
                    <span>Left Click</span> - Select tower/building, place on grid, interact with menus<br>
                    <span>Right Click</span> - Cancel tower/building placement<br>
                    <span>Mouse Hover</span> - Preview tower/building info on sidebar buttons<br>
                    <span>Tap</span> (Touch) - Same as left click<br>
                    <span>Long Press</span> (Touch) - Same as right click (cancel)<br>
                    <span>Swipe</span> (Touch) - Scroll sidebar
                </div>
            </div>
        `;

        // Gamepad info section
        body.innerHTML += `
            <div class="controls-category">
                <div class="controls-category-title">Controller</div>
                <div class="controls-mouse-info">
                    <span>Left Stick</span> - Move cursor<br>
                    <span>A Button</span> - Click / Place / Select<br>
                    <span>B Button</span> - Cancel<br>
                    <span>Start</span> - Pause<br>
                    <span>Back/Select</span> - Open Menu<br>
                    <span>Y Button</span> - Next Wave<br>
                    <span>LB / RB</span> - Cycle tower/building selection<br>
                    <span>D-Pad</span> - Fine cursor movement<br>
                    <span>Right Stick</span> - Scroll sidebar
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

            body.appendChild(catDiv);
        }

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
