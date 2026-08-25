import { drawSwordCursor } from './SwordRenderer.js';

// Small offscreen canvas used only to rasterize the sword once into a data-URI
// PNG for a native CSS cursor - the sword's ~40px reach from its tip fits this
// with generous margin for rotation + shadowBlur.
const CURSOR_SPRITE_SIZE = 100;
const CURSOR_SPRITE_CENTER = CURSOR_SPRITE_SIZE / 2;

// Shows the sword cursor over the ENTIRE page - not just the game canvas - so
// it stays in use over HTML UI (sidebar buttons, stats bar, modals, disabled/
// "not-allowed" buttons, etc.) instead of falling back to the native system
// cursor. This used to be a full-page canvas redrawn from mousemove events
// inside the game's render loop - but that ties the cursor's on-screen position
// to the game loop's frame time, so a heavy simulation frame on a slower system
// made the cursor visibly lag behind the real mouse. A native CSS `cursor: url()`
// is positioned by the OS/browser compositor instead, completely independent of
// page JS, so it can never lag regardless of game performance. style.css's base
// `cursor: none` rule (see the comment there) stays as the pre-init/hidden-state
// value; this class injects a higher-priority rule with the generated sword
// image once ready, and the `.cursor-hidden` / `.gamepad-active` rules in
// style.css win back over it (via selector specificity) when the cursor should
// be suppressed.
export class CursorOverlay {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this._lastStateAllowsCursor = null;

        this._injectCursorStyle();
    }

    _injectCursorStyle() {
        const spriteCanvas = document.createElement('canvas');
        spriteCanvas.width = CURSOR_SPRITE_SIZE;
        spriteCanvas.height = CURSOR_SPRITE_SIZE;
        drawSwordCursor(spriteCanvas.getContext('2d'), CURSOR_SPRITE_CENTER, CURSOR_SPRITE_CENTER);
        const dataUrl = spriteCanvas.toDataURL('image/png');

        // Appended after style.css's <link> in document order, so for the equally-
        // specific `*, *::before, *::after` selector this rule wins (last one in
        // source order wins when specificity and importance are tied).
        const style = document.createElement('style');
        style.id = 'sword-cursor-style';
        style.textContent = `*, *::before, *::after { cursor: url("${dataUrl}") ${CURSOR_SPRITE_CENTER} ${CURSOR_SPRITE_CENTER}, auto !important; }`;
        document.head.appendChild(style);
    }

    /** Toggles the `cursor-hidden` class (see style.css) when the active state's
     *  cursorVisible flag changes - cheap enough to call every frame, but only
     *  actually touches the DOM on an edge, not continuously. */
    render() {
        const currentState = this.stateManager.currentState;
        const stateAllowsCursor = !currentState || currentState.cursorVisible !== false;

        if (stateAllowsCursor !== this._lastStateAllowsCursor) {
            document.documentElement.classList.toggle('cursor-hidden', !stateAllowsCursor);
            this._lastStateAllowsCursor = stateAllowsCursor;
        }
    }
}
