import { drawSwordCursor } from './SwordRenderer.js';

// Small offscreen canvas used only to rasterize the sword once into a data-URI
// PNG - reused both as the page-rendered fallback element's image (below) and
// as the native `cursor: url()` image (see _createElement()'s CSS custom
// property write).
const CURSOR_SPRITE_SIZE = 100;
const CURSOR_SPRITE_CENTER = CURSOR_SPRITE_SIZE / 2;

// `cursor: url()`'s hotspot-image-must-fit-on-screen rule silently falls back
// to the OS arrow once the pointer gets this close to any edge (browsers need
// the full sprite, hotspot at its center, to fit on screen - see the class doc
// comment below). +6px safety margin over the exact measured threshold (half
// the sprite - 50px for the sword) so we switch to the page-rendered fallback
// slightly before the native cursor would actually vanish, never after.
const EDGE_MARGIN_SAFETY = 6;

// Icon cursors (see CursorOverlay.render()'s `cursorIcon`, used while a super weapon
// spell is armed): the icon on a dark, gold-rimmed disc so it stays legible over any
// terrain. Much smaller than the sword sprite - it's a pointer, not a weapon - with the
// hotspot at the disc's center, since that's also the center of the spell's casting area.
const ICON_SPRITE_SIZE = 48;
const ICON_SPRITE_CENTER = ICON_SPRITE_SIZE / 2;
const ICON_DISC_RADIUS = 21;
const ICON_DRAW_SIZE = 28;

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
// - Within an edge margin (half the active sprite + EDGE_MARGIN_SAFETY) of any
//   edge: `cursor: url()`'s
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

        // Which sprite is currently the cursor (see _applySprite): the sword by default, or a
        // state-requested icon (see render()). Icon sprites are rasterized asynchronously
        // (SVG decode) the first time each is asked for, then cached by id.
        this._sprite = null;
        this._swordSprite = null;
        this._iconSprites = new Map();
        this._iconLoading = new Set();
        this._wantedIconId = null;
        this._lastClientX = null;
        this._lastClientY = null;

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
        this._swordSprite = {
            dataUri: spriteCanvas.toDataURL('image/png'),
            size: CURSOR_SPRITE_SIZE,
            center: CURSOR_SPRITE_CENTER
        };

        const el = document.createElement('img');
        el.id = 'sword-cursor-overlay';
        el.alt = '';
        // Starts off-screen and hidden until the first mousemove/render() call
        // place and reveal it, so there's no stray sword sprite pinned at
        // (0, 0) for the one frame before real coordinates arrive.
        el.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            pointer-events: none;
            z-index: 2147483647;
            transform: translate3d(-9999px, -9999px, 0);
            display: none;
        `;
        document.body.appendChild(el);
        this._el = el;

        this._applySprite(this._swordSprite);
    }

    /** Makes `sprite` ({ dataUri, size, center }) the cursor in both modes: as the image
     *  behind style.css's `.sword-cursor-native` rule (the property keeps its original name
     *  though it may now hold an icon), and as the page-rendered fallback element's image.
     *  `center` is the sprite's hotspot - both modes anchor on it. */
    _applySprite(sprite) {
        if (this._sprite === sprite) return;
        this._sprite = sprite;

        // Supplies the image for style.css's `.sword-cursor-native` rule (see
        // there) - kept as a custom property rather than a hardcoded CSS url()
        // since the sprite is only known once rasterized here at runtime.
        document.documentElement.style.setProperty(
            '--sword-cursor-native-value',
            `url("${sprite.dataUri}") ${sprite.center} ${sprite.center}, auto`
        );

        this._el.src = sprite.dataUri;
        this._el.width = sprite.size;
        this._el.height = sprite.size;
        this._el.style.width = `${sprite.size}px`;
        this._el.style.height = `${sprite.size}px`;

        // The hotspot offset and edge margin both depend on the sprite, and no mousemove
        // is guaranteed to follow a swap (e.g. clicking a spell button doesn't move the
        // pointer), so re-derive them from the last known pointer position right away.
        if (this._lastClientX !== null) {
            this._updatePointer(this._lastClientX, this._lastClientY);
            this._applyVisibility();
        }
    }

    /** Positions the page-rendered element and recomputes _nearEdge for a pointer at (clientX, clientY), for whichever sprite is active. */
    _updatePointer(clientX, clientY) {
        this._lastClientX = clientX;
        this._lastClientY = clientY;

        // Aligns the sprite's hotspot (the sword's blade tip - always drawn at its
        // center, see SwordRenderer.js's drawSwordCursor contract) with the real pointer
        // position, so the hotspot is the click point. Only visible while the
        // page-rendered fallback is actually active (see _applyVisibility),
        // but cheap enough to keep unconditionally in sync either way.
        const center = this._sprite.center;
        this._el.style.transform = `translate3d(${clientX - center}px, ${clientY - center}px, 0)`;

        const edgeMargin = center + EDGE_MARGIN_SAFETY;
        this._nearEdge =
            clientX < edgeMargin ||
            clientY < edgeMargin ||
            clientX > window.innerWidth - edgeMargin ||
            clientY > window.innerHeight - edgeMargin;
    }

    _onMouseMove(e) {
        this._updatePointer(e.clientX, e.clientY);
        this._applyVisibility();
    }

    /** Swaps the cursor to the state-requested icon ({ id, svg } - see render()), or back to the sword for null. */
    _syncIcon(request) {
        if (!request) {
            this._wantedIconId = null;
            this._applySprite(this._swordSprite);
            return;
        }
        if (request.id === this._wantedIconId) return;
        this._wantedIconId = request.id;

        const cached = this._iconSprites.get(request.id);
        if (cached) {
            this._applySprite(cached);
            return;
        }
        if (this._iconLoading.has(request.id)) return;

        // Until the icon is ready (a few ms) the sword simply stays the cursor. It's
        // applied on arrival only if it's still the one being asked for by then.
        this._iconLoading.add(request.id);
        this._rasterizeIcon(request.svg).then(sprite => {
            this._iconSprites.set(request.id, sprite);
            if (this._wantedIconId === request.id) this._applySprite(sprite);
        }).catch(err => {
            console.error('CursorOverlay: failed to build icon cursor', request.id, err);
        }).finally(() => {
            this._iconLoading.delete(request.id);
        });
    }

    /** Rasterizes an SVG icon onto a gold-rimmed dark disc, hotspot at its center - see ICON_* constants. */
    async _rasterizeIcon(svg) {
        const img = new Image();
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
        await img.decode();

        const canvas = document.createElement('canvas');
        canvas.width = ICON_SPRITE_SIZE;
        canvas.height = ICON_SPRITE_SIZE;
        const ctx = canvas.getContext('2d');

        ctx.beginPath();
        ctx.arc(ICON_SPRITE_CENTER, ICON_SPRITE_CENTER, ICON_DISC_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(12, 10, 24, 0.85)';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#D4AF37';
        ctx.stroke();

        ctx.drawImage(
            img,
            ICON_SPRITE_CENTER - ICON_DRAW_SIZE / 2,
            ICON_SPRITE_CENTER - ICON_DRAW_SIZE / 2,
            ICON_DRAW_SIZE,
            ICON_DRAW_SIZE
        );

        return { dataUri: canvas.toDataURL('image/png'), size: ICON_SPRITE_SIZE, center: ICON_SPRITE_CENTER };
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

        // A state may ask for its own pointer icon in place of the sword by exposing
        // `cursorIcon` ({ id, svg }, or null for the sword) - GameplayState does this while
        // a super weapon spell is armed. Optional: states without it get the sword.
        this._syncIcon(currentState && currentState.cursorIcon ? currentState.cursorIcon : null);

        this._applyVisibility();
    }
}
