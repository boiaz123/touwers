import { drawSwordCursor } from './SwordRenderer.js';

// Small offscreen canvas used only to rasterize the sword once into a data-URI
// PNG - reused both as the page-rendered fallback element's image (below) and
// as the native `cursor: url()` image (see _createElement()'s CSS custom
// property write).
const CURSOR_SPRITE_SIZE = 100;
const CURSOR_SPRITE_CENTER = CURSOR_SPRITE_SIZE / 2;

// `cursor: url()`'s hotspot-image-must-fit-on-screen rule silently falls back
// to the OS arrow once the pointer gets this close to any edge (browsers need
// the full sprite, hotspot at CURSOR_SPRITE_CENTER, to fit on screen - see the
// class doc comment below). +6px safety margin over the exact 50px measured
// threshold so we switch to the page-rendered fallback slightly before the
// native cursor would actually vanish, never after.
const NATIVE_CURSOR_EDGE_MARGIN = CURSOR_SPRITE_CENTER + 6;

// Shows the sword cursor over the ENTIRE page - not just the game canvas - so
// it stays in use over HTML UI (sidebar buttons, stats bar, modals, disabled/
// "not-allowed" buttons, etc.) instead of falling back to the native system
// cursor.
//
// Hybrid of native `cursor: url()` and a page-rendered `position: fixed`
// element, switched between (via the `sword-cursor-native` class - see
// style.css) based on how close the pointer is to a screen edge:
//
// - Away from edges (the vast majority of the screen): native `cursor:
//   url()`. The OS/compositor draws this directly from raw pointer input,
//   with no JS round-trip - zero added input latency, unlike anything a page
//   element can achieve (a page element's position can only ever update
//   after a `mousemove` event is dispatched to JS, which is inherently at
//   least one event-loop turn behind the native cursor).
// - Within NATIVE_CURSOR_EDGE_MARGIN of any edge: `cursor: url()`'s
//   hotspot-image-must-fit-on-screen rule silently falls back to the OS arrow
//   here (the sword sprite's hotspot - the blade tip - sits at the CENTER of
//   a 100x100 image, but the art only extends down-right from the tip, see
//   SwordRenderer.js's CURSOR_ANGLE - so browsers reserve a full ~50px
//   clearance on all four sides, including the ~45px of top/left space the
//   art never even draws into). There's no `cursor: url()` fix for this that
//   reaches truly zero on every side without either clipping the art or
//   accepting some dead zone - so this narrow strip falls back to the
//   page-rendered `<img>` element instead, which has no such constraint (it
//   just clips like any other fixed-position content, so some part of the
//   sword stays visible even in a corner). This keeps the small added
//   latency confined to a thin edge strip instead of the whole screen.
//
// Both modes anchor on the blade TIP (the sprite's known center,
// CURSOR_SPRITE_CENTER - see SwordRenderer.js's contract that
// drawSwordCursor() always places the tip exactly there), so the tip is
// always the actual click point in either mode.
//
// The page-rendered fallback's own position is updated directly inside the
// `mousemove` handler itself (not deferred to this class's render(), which
// only runs as part of the game loop) via a cheap `transform` write, so it's
// a completely independent code path from game simulation/rendering and
// isn't delayed by either - the same reasoning that keeps it lag-free
// independently applies to the native mode, which has no code path through
// the game loop at all.
export class CursorOverlay {
    constructor(stateManager) {
        this.stateManager = stateManager;

        // Cached inputs recomputed on render()/mousemove, and the DOM state
        // last actually applied from them (see _applyVisibility) - kept
        // separate so DOM writes only happen on a real transition, not on
        // every render()/mousemove call.
        this._shouldShow = false;
        this._nearEdge = true; // conservative default: page-rendered until the first real mousemove positions things
        this._appliedPageVisible = null;
        this._appliedNativeActive = null;

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
        const dataUri = spriteCanvas.toDataURL('image/png');

        // Supplies the image for style.css's `.sword-cursor-native` rule (see
        // there) - kept as a custom property rather than a hardcoded CSS url()
        // since the sprite is only known once rasterized here at runtime.
        document.documentElement.style.setProperty(
            '--sword-cursor-native-value',
            `url("${dataUri}") ${CURSOR_SPRITE_CENTER} ${CURSOR_SPRITE_CENTER}, auto`
        );

        const el = document.createElement('img');
        el.id = 'sword-cursor-overlay';
        el.src = dataUri;
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

    _onMouseMove(e) {
        // Aligns the blade tip (always drawn at CURSOR_SPRITE_CENTER - see
        // SwordRenderer.js's drawSwordCursor contract) with the real pointer
        // position, so the tip is the click point. Only visible while the
        // page-rendered fallback is actually active (see _applyVisibility),
        // but cheap enough to keep unconditionally in sync either way.
        this._el.style.transform =
            `translate3d(${e.clientX - CURSOR_SPRITE_CENTER}px, ${e.clientY - CURSOR_SPRITE_CENTER}px, 0)`;

        this._nearEdge =
            e.clientX < NATIVE_CURSOR_EDGE_MARGIN ||
            e.clientY < NATIVE_CURSOR_EDGE_MARGIN ||
            e.clientX > window.innerWidth - NATIVE_CURSOR_EDGE_MARGIN ||
            e.clientY > window.innerHeight - NATIVE_CURSOR_EDGE_MARGIN;

        this._applyVisibility();
    }

    /** Reconciles which of the two cursor modes (if either) should be on screen
     *  right now, from the last-computed this._shouldShow (render(), once per
     *  frame) and this._nearEdge (mousemove, every move) - only touches the
     *  DOM (classList/display) when a mode actually changes, not on every call. */
    _applyVisibility() {
        const showPage = this._shouldShow && this._nearEdge;
        const showNative = this._shouldShow && !this._nearEdge;

        if (showPage !== this._appliedPageVisible) {
            this._el.style.display = showPage ? '' : 'none';
            this._appliedPageVisible = showPage;
        }
        if (showNative !== this._appliedNativeActive) {
            document.documentElement.classList.toggle('sword-cursor-native', showNative);
            this._appliedNativeActive = showNative;
        }
    }

    /** Recomputes whether the active state's cursorVisible flag or gamepad-driven
     *  input allows any cursor at all - cheap enough to call every frame, but (via
     *  _applyVisibility) only actually touches the DOM on an edge, not continuously. */
    render() {
        const currentState = this.stateManager.currentState;
        const stateAllowsCursor = !currentState || currentState.cursorVisible !== false;
        // InputManager toggles this while a gamepad drives its own on-canvas
        // crosshair cursor instead (see InputManager.js) - style.css no longer
        // has a cursor rule keyed off it now that there's no competing
        // `cursor: url()` to win back over, so it's read directly here instead.
        const gamepadActive = document.documentElement.classList.contains('gamepad-active');
        this._shouldShow = stateAllowsCursor && !gamepadActive;
        this._applyVisibility();
    }
}
