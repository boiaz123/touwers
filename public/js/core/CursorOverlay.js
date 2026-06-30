import { drawSwordCursor } from './SwordRenderer.js';

// Sprite size for the pre-rendered cursor (generous margin around the sword's
// ~40px reach from its tip so rotation + shadowBlur never clip).
const CURSOR_SPRITE_SIZE = 160;
const CURSOR_SPRITE_CENTER = CURSOR_SPRITE_SIZE / 2;

// Renders the sword cursor over the ENTIRE page - not just the game canvas -
// so it stays in use over HTML UI (sidebar buttons, stats bar, modals,
// disabled/"not-allowed" buttons, etc.) instead of falling back to the native
// system cursor. The native cursor is hidden everywhere via CSS (`cursor: none`
// on `*` in style.css); this is what replaces it.
export class CursorOverlay {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.mouseX = 0;
        this.mouseY = 0;
        this.hasMouse = false;

        this.canvas = document.createElement('canvas');
        this.canvas.id = 'sword-cursor-overlay';
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '999999';
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        // PRE-RENDER OPTIMIZATION: the cursor's shape, tilt and shadow are always
        // identical - only its screen position changes - so rasterize the ~15
        // shadowed vector draws once into a small sprite instead of redoing them
        // (with a fresh shadowBlur pass on every shape) on every single frame,
        // across every screen in the game, regardless of whether the mouse moved.
        this._spriteCanvas = document.createElement('canvas');
        this._spriteCanvas.width = CURSOR_SPRITE_SIZE;
        this._spriteCanvas.height = CURSOR_SPRITE_SIZE;
        drawSwordCursor(this._spriteCanvas.getContext('2d'), CURSOR_SPRITE_CENTER, CURSOR_SPRITE_CENTER);

        // Bounding box of the region drawn last frame, so render() only needs to
        // clear that (plus this frame's region) instead of the entire - potentially
        // 4K+ - page canvas every frame.
        this._lastDrawX = null;
        this._lastDrawY = null;

        this._resize();
        window.addEventListener('resize', () => this._resize());

        window.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
            this.hasMouse = true;
        });
        document.documentElement.addEventListener('mouseleave', () => {
            this.hasMouse = false;
        });
        window.addEventListener('blur', () => {
            this.hasMouse = false;
        });
    }

    _resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        // Resizing the canvas implicitly clears it, so there's nothing left to erase.
        this._lastDrawX = null;
        this._lastDrawY = null;
    }

    render() {
        const currentState = this.stateManager.currentState;
        const stateAllowsCursor = !currentState || currentState.cursorVisible !== false;
        const inputManager = this.stateManager.inputManager;
        const gamepadCursorActive = inputManager && inputManager.gamepadCursorVisible;
        const shouldDraw = this.hasMouse && stateAllowsCursor && !gamepadCursorActive;

        if (this._lastDrawX !== null) {
            this.ctx.clearRect(this._lastDrawX, this._lastDrawY, CURSOR_SPRITE_SIZE, CURSOR_SPRITE_SIZE);
            this._lastDrawX = null;
        }

        if (shouldDraw) {
            const drawX = this.mouseX - CURSOR_SPRITE_CENTER;
            const drawY = this.mouseY - CURSOR_SPRITE_CENTER;
            this.ctx.drawImage(this._spriteCanvas, drawX, drawY);
            this._lastDrawX = drawX;
            this._lastDrawY = drawY;
        }
    }
}
