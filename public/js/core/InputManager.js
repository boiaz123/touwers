/**
 * InputManager - Centralized input handling with rebindable controls
 * Manages keyboard, gamepad, and touch input across all game states.
 * Stores user bindings in localStorage for persistence.
 */
export class InputManager {
    static STORAGE_KEY = 'touwers_keybindings';

    // Default key bindings (action -> key)
    static DEFAULT_BINDINGS = {
        // Game controls
        'pause': ' ',           // Space
        'nextWave': 'n',        // N
        'speed1': '1',          // 1
        'speed2': '2',          // 2
        'speed3': '3',          // 3
        'cancel': 'Escape',     // ESC
        'menu': 'm',            // M

        // Tower hotkeys
        'tower_basic': 'q',
        'tower_cannon': 'w',
        'tower_archer': 'e',
        'tower_magic': 'r',
        'tower_barricade': 't',
        'tower_poison': 'y',
        'tower_combination': 'u',
        'tower_guard-post': 'i',

        // Building hotkeys
        'building_mine': 'z',
        'building_forge': 'x',
        'building_academy': 'c',
        'building_training': 'v',
        'building_superweapon': 'b',
        'building_diamond-press': 'g'
    };

    // Human-readable action names for the controls screen
    static ACTION_LABELS = {
        'pause': 'Pause / Resume',
        'nextWave': 'Next Wave',
        'speed1': 'Speed 1x',
        'speed2': 'Speed 2x',
        'speed3': 'Speed 3x',
        'cancel': 'Cancel / Close',
        'menu': 'Open Menu',
        'tower_basic': 'Watch Tower',
        'tower_cannon': 'Trebuchet Tower',
        'tower_archer': 'Archer Tower',
        'tower_magic': 'Magic Tower',
        'tower_barricade': 'Barricade Tower',
        'tower_poison': 'Poison Archer',
        'tower_combination': 'Combination Tower',
        'tower_guard-post': 'Guard Post',
        'building_mine': 'Gold Mine',
        'building_forge': 'Tower Forge',
        'building_academy': 'Magic Academy',
        'building_training': 'Training Grounds',
        'building_superweapon': 'Super Weapon Lab',
        'building_diamond-press': 'Diamond Press'
    };

    // Action categories for display grouping
    static ACTION_CATEGORIES = {
        'Game Controls': ['pause', 'nextWave', 'speed1', 'speed2', 'speed3', 'cancel', 'menu'],
        'Tower Hotkeys': ['tower_basic', 'tower_cannon', 'tower_archer', 'tower_magic', 'tower_barricade', 'tower_poison', 'tower_combination', 'tower_guard-post'],
        'Building Hotkeys': ['building_mine', 'building_forge', 'building_academy', 'building_training', 'building_superweapon', 'building_diamond-press']
    };

    // Default gamepad bindings (action -> button index)
    static DEFAULT_GAMEPAD_BINDINGS = {
        'pause': 9,             // Start button
        'nextWave': 3,          // Y button
        'cancel': 1,            // B button
        'menu': 8,              // Back/Select button
        'speed1': null,
        'speed2': null,
        'speed3': null
    };

    constructor() {
        this.bindings = {};
        this.gamepadBindings = {};
        this.reverseBindings = {};  // key -> action for fast lookup
        this.listeners = {};        // action -> [callback]
        this.isListeningForRebind = false;
        this.rebindAction = null;
        this.rebindCallback = null;

        // Gamepad state
        this.gamepadConnected = false;
        this.gamepadIndex = null;
        this.previousGamepadState = {};
        this.gamepadPollInterval = null;
        this.gamepadCursorX = 0;
        this.gamepadCursorY = 0;
        this.gamepadCursorSpeed = 8;
        this.gamepadCursorVisible = false;

        // Touch state
        this.touchEnabled = false;
        this.activeTouches = new Map();
        this.touchStartPos = null;
        this.touchStartTime = 0;
        this.pinchStartDist = 0;
        this.longPressTimer = null;
        this.longPressThreshold = 500; // ms

        // Load saved bindings or use defaults
        this.loadBindings();

        // Build reverse lookup
        this.buildReverseLookup();

        // Setup keyboard listener
        this._keydownHandler = (e) => this._handleKeydown(e);
        this._keyupHandler = (e) => this._handleKeyup(e);
        window.addEventListener('keydown', this._keydownHandler);
        window.addEventListener('keyup', this._keyupHandler);

        // Setup gamepad listeners
        this._gamepadConnectedHandler = (e) => this._onGamepadConnected(e);
        this._gamepadDisconnectedHandler = (e) => this._onGamepadDisconnected(e);
        window.addEventListener('gamepadconnected', this._gamepadConnectedHandler);
        window.addEventListener('gamepaddisconnected', this._gamepadDisconnectedHandler);

        // Detect touch capability
        this.touchEnabled = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    }

    // ============ BINDING MANAGEMENT ============

    loadBindings() {
        try {
            const saved = localStorage.getItem(InputManager.STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Merge with defaults so new actions added later get their defaults
                this.bindings = { ...InputManager.DEFAULT_BINDINGS, ...parsed };
            } else {
                this.bindings = { ...InputManager.DEFAULT_BINDINGS };
            }
        } catch (e) {
            this.bindings = { ...InputManager.DEFAULT_BINDINGS };
        }

        // Load gamepad bindings
        try {
            const savedGamepad = localStorage.getItem(InputManager.STORAGE_KEY + '_gamepad');
            if (savedGamepad) {
                this.gamepadBindings = { ...InputManager.DEFAULT_GAMEPAD_BINDINGS, ...JSON.parse(savedGamepad) };
            } else {
                this.gamepadBindings = { ...InputManager.DEFAULT_GAMEPAD_BINDINGS };
            }
        } catch (e) {
            this.gamepadBindings = { ...InputManager.DEFAULT_GAMEPAD_BINDINGS };
        }
    }

    saveBindings() {
        try {
            localStorage.setItem(InputManager.STORAGE_KEY, JSON.stringify(this.bindings));
            localStorage.setItem(InputManager.STORAGE_KEY + '_gamepad', JSON.stringify(this.gamepadBindings));
        } catch (e) {
            // Storage not available
        }
    }

    buildReverseLookup() {
        this.reverseBindings = {};
        for (const [action, key] of Object.entries(this.bindings)) {
            const normalizedKey = this._normalizeKey(key);
            this.reverseBindings[normalizedKey] = action;
        }
    }

    /**
     * Rebind an action to a new key
     */
    rebind(action, newKey) {
        if (!InputManager.ACTION_LABELS[action]) return false;

        // Remove any existing binding for this key (prevent duplicates)
        for (const [act, key] of Object.entries(this.bindings)) {
            if (this._normalizeKey(key) === this._normalizeKey(newKey) && act !== action) {
                // Swap: give the displaced action the old key of the rebound action
                this.bindings[act] = this.bindings[action];
                break;
            }
        }

        this.bindings[action] = newKey;
        this.buildReverseLookup();
        this.saveBindings();
        return true;
    }

    /**
     * Reset all bindings to defaults
     */
    resetToDefaults() {
        this.bindings = { ...InputManager.DEFAULT_BINDINGS };
        this.gamepadBindings = { ...InputManager.DEFAULT_GAMEPAD_BINDINGS };
        this.buildReverseLookup();
        this.saveBindings();
    }

    /**
     * Get the key assigned to an action
     */
    getBinding(action) {
        return this.bindings[action] || null;
    }

    /**
     * Get all bindings
     */
    getAllBindings() {
        return { ...this.bindings };
    }

    /**
     * Get display-friendly key name
     */
    static getKeyDisplayName(key) {
        if (!key) return 'None';
        switch (key) {
            case ' ': return 'Space';
            case 'Escape': return 'Esc';
            case 'ArrowUp': return 'Up';
            case 'ArrowDown': return 'Down';
            case 'ArrowLeft': return 'Left';
            case 'ArrowRight': return 'Right';
            case 'Control': return 'Ctrl';
            case 'Shift': return 'Shift';
            case 'Alt': return 'Alt';
            case 'Tab': return 'Tab';
            case 'Enter': return 'Enter';
            case 'Backspace': return 'Backspace';
            case 'Delete': return 'Delete';
            default: return key.length === 1 ? key.toUpperCase() : key;
        }
    }

    // ============ EVENT LISTENERS ============

    /**
     * Register a callback for an action
     */
    on(action, callback) {
        if (!this.listeners[action]) {
            this.listeners[action] = [];
        }
        this.listeners[action].push(callback);
    }

    /**
     * Remove a callback for an action
     */
    off(action, callback) {
        if (!this.listeners[action]) return;
        this.listeners[action] = this.listeners[action].filter(cb => cb !== callback);
    }

    /**
     * Remove all listeners for an action
     */
    offAll(action) {
        if (action) {
            delete this.listeners[action];
        } else {
            this.listeners = {};
        }
    }

    /**
     * Trigger an action
     */
    _triggerAction(action, eventData) {
        if (!this.listeners[action]) return;
        for (const cb of this.listeners[action]) {
            cb(eventData);
        }
    }

    // ============ REBIND MODE ============

    /**
     * Start listening for a key press to rebind an action
     */
    startRebind(action, callback) {
        this.isListeningForRebind = true;
        this.rebindAction = action;
        this.rebindCallback = callback;
    }

    /**
     * Cancel rebind mode
     */
    cancelRebind() {
        this.isListeningForRebind = false;
        this.rebindAction = null;
        this.rebindCallback = null;
    }

    // ============ KEYBOARD HANDLING ============

    _normalizeKey(key) {
        if (!key) return '';
        // Normalize to lowercase for single characters, keep special keys as-is
        if (key.length === 1) return key.toLowerCase();
        return key;
    }

    _handleKeydown(e) {
        // Rebind mode: capture the next key press
        if (this.isListeningForRebind) {
            e.preventDefault();
            e.stopPropagation();

            const key = e.key;
            if (key === 'Escape') {
                // Cancel rebind
                const cb = this.rebindCallback;
                this.cancelRebind();
                if (cb) cb(null);
                return;
            }

            const action = this.rebindAction;
            const cb = this.rebindCallback;
            this.cancelRebind();
            this.rebind(action, key);
            if (cb) cb(key);
            return;
        }

        // Normal mode: look up action for this key
        const normalizedKey = this._normalizeKey(e.key);
        const action = this.reverseBindings[normalizedKey];

        if (action) {
            e.preventDefault();
            this._triggerAction(action, { type: 'keyboard', key: e.key, originalEvent: e });
        }
    }

    _handleKeyup(e) {
        // Currently no keyup actions needed, but available for future use
    }

    // ============ GAMEPAD HANDLING ============

    _onGamepadConnected(e) {
        this.gamepadConnected = true;
        this.gamepadIndex = e.gamepad.index;
        this.gamepadCursorVisible = true;

        // Initialize cursor to center of canvas
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            this.gamepadCursorX = canvas.width / 2;
            this.gamepadCursorY = canvas.height / 2;
        }

        // Start polling gamepad state
        if (!this.gamepadPollInterval) {
            this.gamepadPollInterval = setInterval(() => this._pollGamepad(), 16); // ~60fps
        }
    }

    _onGamepadDisconnected(e) {
        if (e.gamepad.index === this.gamepadIndex) {
            this.gamepadConnected = false;
            this.gamepadIndex = null;
            this.gamepadCursorVisible = false;

            if (this.gamepadPollInterval) {
                clearInterval(this.gamepadPollInterval);
                this.gamepadPollInterval = null;
            }
        }
    }

    _pollGamepad() {
        if (!this.gamepadConnected || this.gamepadIndex === null) return;

        const gamepads = navigator.getGamepads();
        const gp = gamepads[this.gamepadIndex];
        if (!gp) return;

        const canvas = document.getElementById('gameCanvas');
        const deadzone = 0.15;
        let cursorMoved = false;

        // ---- Cursor movement via left stick ----
        const leftX = Math.abs(gp.axes[0]) > deadzone ? gp.axes[0] : 0;
        const leftY = Math.abs(gp.axes[1]) > deadzone ? gp.axes[1] : 0;

        if (canvas && (leftX !== 0 || leftY !== 0)) {
            this.gamepadCursorX = Math.max(0, Math.min(canvas.width, this.gamepadCursorX + leftX * this.gamepadCursorSpeed));
            this.gamepadCursorY = Math.max(0, Math.min(canvas.height, this.gamepadCursorY + leftY * this.gamepadCursorSpeed));
            this.gamepadCursorVisible = true;
            cursorMoved = true;
        }

        // ---- D-pad: cursor movement + edge-triggered nav events ----
        const dpadUp = gp.buttons[12] && gp.buttons[12].pressed;
        const dpadDown = gp.buttons[13] && gp.buttons[13].pressed;
        const dpadLeft = gp.buttons[14] && gp.buttons[14].pressed;
        const dpadRight = gp.buttons[15] && gp.buttons[15].pressed;

        if (dpadUp) { this.gamepadCursorY = Math.max(0, this.gamepadCursorY - this.gamepadCursorSpeed); cursorMoved = true; }
        if (dpadDown && canvas) { this.gamepadCursorY = Math.min(canvas.height, this.gamepadCursorY + this.gamepadCursorSpeed); cursorMoved = true; }
        if (dpadLeft) { this.gamepadCursorX = Math.max(0, this.gamepadCursorX - this.gamepadCursorSpeed); cursorMoved = true; }
        if (dpadRight && canvas) { this.gamepadCursorX = Math.min(canvas.width, this.gamepadCursorX + this.gamepadCursorSpeed); cursorMoved = true; }

        // Edge-triggered D-pad navigation events (for menu button cycling)
        const dpadUpWas = this.previousGamepadState['dpad_up'] || false;
        const dpadDownWas = this.previousGamepadState['dpad_down'] || false;
        const dpadLeftWas = this.previousGamepadState['dpad_left'] || false;
        const dpadRightWas = this.previousGamepadState['dpad_right'] || false;

        if (dpadUp && !dpadUpWas) this._triggerAction('gamepad_nav_up', { type: 'gamepad' });
        if (dpadDown && !dpadDownWas) this._triggerAction('gamepad_nav_down', { type: 'gamepad' });
        if (dpadLeft && !dpadLeftWas) this._triggerAction('gamepad_nav_left', { type: 'gamepad' });
        if (dpadRight && !dpadRightWas) this._triggerAction('gamepad_nav_right', { type: 'gamepad' });

        this.previousGamepadState['dpad_up'] = dpadUp;
        this.previousGamepadState['dpad_down'] = dpadDown;
        this.previousGamepadState['dpad_left'] = dpadLeft;
        this.previousGamepadState['dpad_right'] = dpadRight;

        // Fire cursor move event for hover state updates in menus
        if (cursorMoved) {
            this._triggerAction('gamepad_cursor_move', {
                type: 'gamepad',
                x: this.gamepadCursorX,
                y: this.gamepadCursorY
            });
        }

        // ---- Button presses (edge-triggered) ----
        for (let i = 0; i < gp.buttons.length; i++) {
            const pressed = gp.buttons[i].pressed;
            const wasPressed = this.previousGamepadState[i] || false;

            if (pressed && !wasPressed) {
                this._handleGamepadButton(i);
            }
            this.previousGamepadState[i] = pressed;
        }

        // ---- A button = click/confirm at cursor position ----
        const aPressed = gp.buttons[0] && gp.buttons[0].pressed;
        const aWasPressed = this.previousGamepadState['a_click'] || false;
        if (aPressed && !aWasPressed) {
            this._triggerAction('gamepad_click', {
                type: 'gamepad',
                x: this.gamepadCursorX,
                y: this.gamepadCursorY
            });
        }
        this.previousGamepadState['a_click'] = aPressed;

        // ---- X button (2) = collect nearest loot ----
        const xPressed = gp.buttons[2] && gp.buttons[2].pressed;
        const xWasPressed = this.previousGamepadState['x_loot'] || false;
        if (xPressed && !xWasPressed) {
            this._triggerAction('gamepad_collect_loot', { type: 'gamepad' });
        }
        this.previousGamepadState['x_loot'] = xPressed;

        // ---- Right stick = scroll sidebar ----
        const rightY = Math.abs(gp.axes[3]) > deadzone ? gp.axes[3] : 0;
        if (rightY !== 0) {
            const sidebar = document.getElementById('tower-sidebar');
            if (sidebar) {
                sidebar.scrollTop += rightY * 5;
            }
        }

        // ---- Shoulder buttons for tower/building cycling ----
        const lbPressed = gp.buttons[4] && gp.buttons[4].pressed;
        const rbPressed = gp.buttons[5] && gp.buttons[5].pressed;
        const lbWas = this.previousGamepadState['lb'] || false;
        const rbWas = this.previousGamepadState['rb'] || false;

        if (lbPressed && !lbWas) {
            this._triggerAction('gamepad_prev_item', { type: 'gamepad' });
        }
        if (rbPressed && !rbWas) {
            this._triggerAction('gamepad_next_item', { type: 'gamepad' });
        }
        this.previousGamepadState['lb'] = lbPressed;
        this.previousGamepadState['rb'] = rbPressed;
    }

    _handleGamepadButton(buttonIndex) {
        // Look up action for this gamepad button
        for (const [action, btn] of Object.entries(this.gamepadBindings)) {
            if (btn === buttonIndex) {
                this._triggerAction(action, { type: 'gamepad', buttonIndex });
                return;
            }
        }
    }

    /**
     * Render the gamepad cursor overlay
     */
    renderGamepadCursor(ctx) {
        if (!this.gamepadCursorVisible || !this.gamepadConnected) return;

        const x = this.gamepadCursorX;
        const y = this.gamepadCursorY;
        const size = 12;

        ctx.save();
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 4;

        // Crosshair
        ctx.beginPath();
        ctx.moveTo(x - size, y);
        ctx.lineTo(x - 4, y);
        ctx.moveTo(x + 4, y);
        ctx.lineTo(x + size, y);
        ctx.moveTo(x, y - size);
        ctx.lineTo(x, y - 4);
        ctx.moveTo(x, y + 4);
        ctx.lineTo(x, y + size);
        ctx.stroke();

        // Center dot
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // ============ TOUCH HANDLING ============

    /**
     * Setup touch handlers on a canvas element
     */
    setupTouchHandlers(canvas) {
        if (!canvas) return;

        this._touchStartHandler = (e) => this._handleTouchStart(e, canvas);
        this._touchMoveHandler = (e) => this._handleTouchMove(e, canvas);
        this._touchEndHandler = (e) => this._handleTouchEnd(e, canvas);

        canvas.addEventListener('touchstart', this._touchStartHandler, { passive: false });
        canvas.addEventListener('touchmove', this._touchMoveHandler, { passive: false });
        canvas.addEventListener('touchend', this._touchEndHandler, { passive: false });
        canvas.addEventListener('touchcancel', this._touchEndHandler, { passive: false });
    }

    /**
     * Remove touch handlers
     */
    removeTouchHandlers(canvas) {
        if (!canvas) return;
        if (this._touchStartHandler) canvas.removeEventListener('touchstart', this._touchStartHandler);
        if (this._touchMoveHandler) canvas.removeEventListener('touchmove', this._touchMoveHandler);
        if (this._touchEndHandler) {
            canvas.removeEventListener('touchend', this._touchEndHandler);
            canvas.removeEventListener('touchcancel', this._touchEndHandler);
        }
    }

    _getCanvasCoords(touch, canvas) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (touch.clientX - rect.left) * scaleX,
            y: (touch.clientY - rect.top) * scaleY
        };
    }

    _handleTouchStart(e, canvas) {
        e.preventDefault();

        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            const coords = this._getCanvasCoords(touch, canvas);
            this.activeTouches.set(touch.identifier, {
                startX: coords.x,
                startY: coords.y,
                currentX: coords.x,
                currentY: coords.y,
                startTime: Date.now()
            });
        }

        // Single touch = potential tap or long press
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const coords = this._getCanvasCoords(touch, canvas);
            this.touchStartPos = coords;
            this.touchStartTime = Date.now();

            // Start long press timer
            if (this.longPressTimer) clearTimeout(this.longPressTimer);
            this.longPressTimer = setTimeout(() => {
                this._triggerAction('touch_longpress', {
                    type: 'touch',
                    x: coords.x,
                    y: coords.y
                });
            }, this.longPressThreshold);
        }

        // Two finger touch = potential pinch
        if (e.touches.length === 2) {
            if (this.longPressTimer) {
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
            }
            const t1 = this._getCanvasCoords(e.touches[0], canvas);
            const t2 = this._getCanvasCoords(e.touches[1], canvas);
            this.pinchStartDist = Math.hypot(t2.x - t1.x, t2.y - t1.y);
        }
    }

    _handleTouchMove(e, canvas) {
        e.preventDefault();

        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            const coords = this._getCanvasCoords(touch, canvas);
            const data = this.activeTouches.get(touch.identifier);
            if (data) {
                data.currentX = coords.x;
                data.currentY = coords.y;
            }
        }

        // Cancel long press if finger moved too much
        if (this.longPressTimer && this.touchStartPos && e.touches.length === 1) {
            const coords = this._getCanvasCoords(e.touches[0], canvas);
            const dist = Math.hypot(coords.x - this.touchStartPos.x, coords.y - this.touchStartPos.y);
            if (dist > 15) {
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
            }
        }

        // Single finger drag
        if (e.touches.length === 1) {
            const coords = this._getCanvasCoords(e.touches[0], canvas);
            this._triggerAction('touch_move', {
                type: 'touch',
                x: coords.x,
                y: coords.y,
                startX: this.touchStartPos ? this.touchStartPos.x : coords.x,
                startY: this.touchStartPos ? this.touchStartPos.y : coords.y
            });
        }

        // Two finger pinch
        if (e.touches.length === 2 && this.pinchStartDist > 0) {
            const t1 = this._getCanvasCoords(e.touches[0], canvas);
            const t2 = this._getCanvasCoords(e.touches[1], canvas);
            const currentDist = Math.hypot(t2.x - t1.x, t2.y - t1.y);
            const scale = currentDist / this.pinchStartDist;
            this._triggerAction('touch_pinch', {
                type: 'touch',
                scale: scale,
                centerX: (t1.x + t2.x) / 2,
                centerY: (t1.y + t2.y) / 2
            });
        }
    }

    _handleTouchEnd(e, canvas) {
        e.preventDefault();

        // Cancel long press timer
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }

        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            const data = this.activeTouches.get(touch.identifier);

            if (data) {
                const duration = Date.now() - data.startTime;
                const dist = Math.hypot(data.currentX - data.startX, data.currentY - data.startY);

                // Tap detection: short duration and small movement
                if (duration < 300 && dist < 15) {
                    this._triggerAction('touch_tap', {
                        type: 'touch',
                        x: data.startX,
                        y: data.startY
                    });
                }

                // Swipe detection
                if (duration < 500 && dist > 50) {
                    const dx = data.currentX - data.startX;
                    const dy = data.currentY - data.startY;
                    let direction = 'right';
                    if (Math.abs(dx) > Math.abs(dy)) {
                        direction = dx > 0 ? 'right' : 'left';
                    } else {
                        direction = dy > 0 ? 'down' : 'up';
                    }
                    this._triggerAction('touch_swipe', {
                        type: 'touch',
                        direction: direction,
                        startX: data.startX,
                        startY: data.startY,
                        endX: data.currentX,
                        endY: data.currentY
                    });
                }

                this.activeTouches.delete(touch.identifier);
            }
        }

        // Reset pinch when all fingers lifted
        if (e.touches.length === 0) {
            this.pinchStartDist = 0;
            this.touchStartPos = null;
        }
    }

    // ============ CLEANUP ============

    destroy() {
        window.removeEventListener('keydown', this._keydownHandler);
        window.removeEventListener('keyup', this._keyupHandler);
        window.removeEventListener('gamepadconnected', this._gamepadConnectedHandler);
        window.removeEventListener('gamepaddisconnected', this._gamepadDisconnectedHandler);

        if (this.gamepadPollInterval) {
            clearInterval(this.gamepadPollInterval);
            this.gamepadPollInterval = null;
        }

        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }

        this.listeners = {};
        this.activeTouches.clear();
    }
}
