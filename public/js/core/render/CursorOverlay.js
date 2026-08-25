import { drawSwordCursor } from './SwordRenderer.js';

// Small offscreen canvas used only to rasterize the sword once into a data-URI
// PNG - reused as the visible cursor element's image below.
const CURSOR_SPRITE_SIZE = 100;
const CURSOR_SPRITE_CENTER = CURSOR_SPRITE_SIZE / 2;

// Shows the sword cursor over the ENTIRE page - not just the game canvas - so
// it stays in use over HTML UI (sidebar buttons, stats bar, modals, disabled/
// "not-allowed" buttons, etc.) instead of falling back to the native system
// cursor.
//
// This is a `position: fixed` element tracked via its own `mousemove` listener,
// NOT a native CSS `cursor: url()`. Two things pushed it back to that ("that"
// being the same technique - a page-rendered cursor element - this file used
// before it was switched TO `cursor: url()`, for the lag reasons the git history
// of this comment used to describe):
//
// 1. `cursor: url()`'s hotspot-image-must-fit-on-screen rule creates a dead
//    zone around every edge of the window. The sword sprite's hotspot (the
//    blade tip) sits at the CENTER of a 100x100 image, but the art only extends
//    down-right from the tip (see SwordRenderer.js's CURSOR_ANGLE) - so browsers
//    were reserving a full 50px clearance on all four sides, including the
//    ~45px of top/left space the art never even draws into, and silently
//    falling back to the OS arrow whenever the real cursor got that close to
//    any edge. There's no `cursor: url()` fix for this that reaches truly zero
//    on every side without either clipping the art or accepting some dead zone
//    - a page-rendered element has no such constraint (it just clips like any
//    other fixed-position content), so this is the only way to guarantee the
//    sword is the ONLY cursor visible anywhere on screen, edge to edge.
//    That clipping is also why _createElement() anchors on the drawn art's
//    bounding-box CENTER (measured from actual pixel alpha, not the tip): the
//    art is lopsided, almost entirely down-right of the tip, so tip-anchoring
//    would put the whole visible sword off-screen at the bottom-right corner
//    (nothing clips into view there - the art simply never reaches the
//    on-screen side of the anchor). Center-anchoring instead means roughly
//    half the blade is within any corner's on-screen side, so some part of
//    the sword stays visible in every corner, not just some of them.
// 2. The lag the old version had came from redrawing the cursor from inside the
//    game's own render loop, so a heavy simulation frame delayed the cursor
//    along with everything else. This version updates position directly inside
//    the `mousemove` handler itself (not deferred to this class's render(),
//    which - like the old version - only runs as part of the game loop) via a
//    cheap `transform` write, so it's a completely independent code path from
//    game simulation/rendering and isn't delayed by either.
export class CursorOverlay {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this._lastShouldShow = null;
        // Overwritten with the art's real bounding-box center by _createElement()
        // below; this default only matters if that measurement ever fails.
        this._anchorX = CURSOR_SPRITE_CENTER;
        this._anchorY = CURSOR_SPRITE_CENTER;

        this._createElement();

        this._onMouseMove = this._onMouseMove.bind(this);
        window.addEventListener('mousemove', this._onMouseMove, { passive: true });
    }

    _createElement() {
        const spriteCanvas = document.createElement('canvas');
        spriteCanvas.width = CURSOR_SPRITE_SIZE;
        spriteCanvas.height = CURSOR_SPRITE_SIZE;
        const ctx = spriteCanvas.getContext('2d');
        drawSwordCursor(ctx, CURSOR_SPRITE_CENTER, CURSOR_SPRITE_CENTER);

        const bounds = this._measureOpaqueBounds(ctx);
        if (bounds) {
            this._anchorX = (bounds.minX + bounds.maxX) / 2;
            this._anchorY = (bounds.minY + bounds.maxY) / 2;
        }

        const el = document.createElement('img');
        el.id = 'sword-cursor-overlay';
        el.src = spriteCanvas.toDataURL('image/png');
        el.width = CURSOR_SPRITE_SIZE;
        el.height = CURSOR_SPRITE_SIZE;
        el.alt = '';
        // Starts off-screen and hidden until the first mousemove/render() call
        // place and reveal it, so there's no stray sword sprite pinned at
        // (0, 0) for the one frame before real coordinates arrive.
        el.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: ${CURSOR_SPRITE_SIZE}px;
            height: ${CURSOR_SPRITE_SIZE}px;
            pointer-events: none;
            z-index: 2147483647;
            transform: translate3d(-9999px, -9999px, 0);
            display: none;
        `;
        document.body.appendChild(el);
        this._el = el;
    }

    /** Scans the rasterized sprite for the bounding box of its non-transparent
     *  pixels (alpha > 5, to ignore the near-invisible fringe shadowBlur leaves
     *  around the edge) - see the class doc comment for why this, not the
     *  blade tip, is what gets anchored to the real pointer position. Re-derived
     *  from the actual pixels rather than hand-measured so it can't go stale if
     *  SwordRenderer.js's art ever changes. Returns null (falls back to
     *  CURSOR_SPRITE_CENTER) only if the canvas somehow rendered fully
     *  transparent. */
    _measureOpaqueBounds(ctx) {
        const { data } = ctx.getImageData(0, 0, CURSOR_SPRITE_SIZE, CURSOR_SPRITE_SIZE);
        let minX = CURSOR_SPRITE_SIZE, minY = CURSOR_SPRITE_SIZE, maxX = -1, maxY = -1;
        for (let y = 0; y < CURSOR_SPRITE_SIZE; y++) {
            for (let x = 0; x < CURSOR_SPRITE_SIZE; x++) {
                if (data[(y * CURSOR_SPRITE_SIZE + x) * 4 + 3] > 5) {
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                }
            }
        }
        return maxX >= minX ? { minX, minY, maxX, maxY } : null;
    }

    _onMouseMove(e) {
        // Aligns the art's bounding-box center (see _measureOpaqueBounds) with
        // the real pointer position, not the blade tip - see the class doc
        // comment for why.
        this._el.style.transform =
            `translate3d(${e.clientX - this._anchorX}px, ${e.clientY - this._anchorY}px, 0)`;
    }

    /** Toggles the element's visibility when the active state's cursorVisible
     *  flag or gamepad-driven input changes - cheap enough to call every frame,
     *  but only actually touches the DOM on an edge, not continuously. */
    render() {
        const currentState = this.stateManager.currentState;
        const stateAllowsCursor = !currentState || currentState.cursorVisible !== false;
        // InputManager toggles this while a gamepad drives its own on-canvas
        // crosshair cursor instead (see InputManager.js) - style.css no longer
        // has a cursor rule keyed off it now that there's no competing
        // `cursor: url()` to win back over, so it's read directly here instead.
        const gamepadActive = document.documentElement.classList.contains('gamepad-active');
        const shouldShow = stateAllowsCursor && !gamepadActive;

        if (shouldShow !== this._lastShouldShow) {
            this._el.style.display = shouldShow ? '' : 'none';
            this._lastShouldShow = shouldShow;
        }
    }
}
