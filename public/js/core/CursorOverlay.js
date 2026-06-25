import { drawSwordCursor } from './SwordRenderer.js';

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
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const currentState = this.stateManager.currentState;
        const stateAllowsCursor = !currentState || currentState.cursorVisible !== false;
        const inputManager = this.stateManager.inputManager;
        const gamepadCursorActive = inputManager && inputManager.gamepadCursorVisible;

        if (this.hasMouse && stateAllowsCursor && !gamepadCursorActive) {
            drawSwordCursor(this.ctx, this.mouseX, this.mouseY);
        }
    }
}
