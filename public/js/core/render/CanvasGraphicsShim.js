import { FillGradient, Text } from 'pixi.js';

/**
 * Strategy B infrastructure: lets an *unmodified* Canvas2D render method (e.g.
 * Tower/Enemy/Building `renderDynamicParts(ctx, ...)`) draw directly into Pixi
 * display objects every frame, instead of hand-porting every draw call.
 *
 * Maintains a real 2D affine transform stack (save/restore/translate/rotate/scale),
 * matching Canvas2D semantics exactly, and applies the current matrix to every
 * coordinate before handing it to Pixi's Graphics path-building API. The wrapped
 * PIXI.Graphics object itself is always left at identity transform - all transform
 * math happens here, not on the display object - so arbitrarily nested
 * save()/translate()/rotate() call patterns (as seen in e.g. CannonTower's
 * trebuchet-arm-then-sling nested rotation) work correctly, not just the single
 * outer transform pattern a naive position/rotation passthrough would support.
 *
 * Also supports gradients (createLinearGradient/createRadialGradient - Pixi's
 * FillGradient class already implements the native CanvasGradient interface, i.e.
 * addColorStop(), so it's returned directly and used as a fill/stroke style exactly
 * like a real CanvasGradient) and fillText (via a small pooled PIXI.Text per shim,
 * reused across frames and hidden when unused that frame).
 *
 * Limitation: only uniform scale is supported (scale(s,s) or no scale), which is
 * the only kind this codebase's render methods use - non-uniform scale plus
 * rotation would require true matrix decomposition for arc()/ellipse(), which
 * Pixi's Graphics API doesn't accept directly.
 */
class Matrix2D {
    constructor(a = 1, b = 0, c = 0, d = 1, e = 0, f = 0) {
        this.a = a; this.b = b; this.c = c; this.d = d; this.e = e; this.f = f;
    }
    clone() { return new Matrix2D(this.a, this.b, this.c, this.d, this.e, this.f); }
    /** this = this * m (m applied in the current local frame, matching ctx semantics) */
    multiply(m) {
        return new Matrix2D(
            this.a * m.a + this.c * m.b,
            this.b * m.a + this.d * m.b,
            this.a * m.c + this.c * m.d,
            this.b * m.c + this.d * m.d,
            this.a * m.e + this.c * m.f + this.e,
            this.b * m.e + this.d * m.f + this.f
        );
    }
    /** In-place: this = this * translation(tx, ty). Zero allocation - only e and f change. */
    translateSelf(tx, ty) {
        this.e = this.a * tx + this.c * ty + this.e;
        this.f = this.b * tx + this.d * ty + this.f;
    }
    /** In-place: this = this * rotation(angle). Zero allocation - e and f are unchanged. */
    rotateSelf(angle) {
        const c = Math.cos(angle), s = Math.sin(angle);
        const a = this.a, b = this.b, cm = this.c, d = this.d;
        this.a = a * c + cm * s;
        this.b = b * c + d  * s;
        this.c = a * (-s)   + cm * c;
        this.d = b * (-s)   + d  * c;
    }
    /** In-place: this = this * scale(sx, sy). Zero allocation - e and f are unchanged. */
    scaleSelf(sx, sy) {
        this.a *= sx; this.b *= sx;
        this.c *= sy; this.d *= sy;
    }
    /** In-place: reset to identity. Zero allocation. */
    identity() { this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0; }
    /** In-place copy from another matrix. Zero allocation. */
    copyFrom(m) { this.a = m.a; this.b = m.b; this.c = m.c; this.d = m.d; this.e = m.e; this.f = m.f; }
    transformPoint(x, y) {
        return { x: this.a * x + this.c * y + this.e, y: this.b * x + this.d * y + this.f };
    }
    /** Uniform-scale assumption (see class doc) - rotation angle and scale factor of this matrix. */
    decompose() {
        return { rotation: Math.atan2(this.b, this.a), scale: Math.hypot(this.a, this.b) };
    }
}

export class CanvasGraphicsShim {
    /** @param {import('pixi.js').Graphics} graphics @param {import('pixi.js').Container} [textParent] - container to host pooled fillText() Text objects; defaults to graphics' own parent, set lazily on first fillText() call if omitted here. */
    constructor(graphics, textParent) {
        this.g = graphics;
        this._textParent = textParent || null;
        this._textPool = [];
        this._textPoolIndex = 0;
        this._fillStyle = '#000000';
        this._strokeStyle = '#000000';
        this._lineWidth = 1;
        this._font = '10px sans-serif';
        this._textAlign = 'left';
        this._textBaseline = 'alphabetic';
        this._matrix = new Matrix2D();
        // FillGradient builds a GPU texture internally and must be destroyed explicitly
        // (per Pixi's own docs) once an entity is done with it, or every fresh-recreated-
        // every-frame gradient call leaks one texture per frame. But several entities
        // (e.g. FrogEnemy.js's this._bodyGradient) deliberately cache a CanvasGradient
        // object across frames and skip recreating it on cache-hit frames - blindly
        // destroying "whatever was created last frame" would destroy that still-in-use
        // object one frame after creation, leaving the entity rendering with a destroyed
        // GPU resource forever after. Instead, track which gradients are *touched*
        // (assigned to fillStyle/strokeStyle) each frame via the setters below; a
        // gradient survives across reset() calls for as long as something keeps
        // referencing it, and is only destroyed once a frame goes by where nothing did.
        this._knownGradients = new Set();
        this._touchedGradients = new Set();
        // Pre-allocated stack pool: 16 slots covers any realistic save/restore nesting depth.
        // Avoids one `new Matrix2D()` (clone) per save() call - at 200 entities × ~4 saves
        // each per frame that's ~800 allocations/frame eliminated.
        this._stackPool = Array.from({ length: 16 }, () => new Matrix2D());
        this._stackDepth = 0;
    }

    /** Call once per frame before invoking the wrapped render method. */
    reset() {
        this.g.clear();
        this.g.alpha = 1;
        this._fillStyle = '#000000';
        this._strokeStyle = '#000000';
        this._lineWidth = 1;
        this._font = '10px sans-serif';
        this._textAlign = 'left';
        this._textBaseline = 'alphabetic';
        this._matrix.identity();
        this._stackDepth = 0;
        this._textPoolIndex = 0;
        for (let i = 0; i < this._textPool.length; i++) this._textPool[i].visible = false;

        // See constructor comment: destroy only gradients that weren't touched (created
        // or reused) during the frame that just completed - the survivors become the
        // baseline to check again after the upcoming frame.
        // Swap the two pre-allocated Sets (zero allocation) rather than constructing a
        // new one each frame - at 200 enemies that's 200 Set allocations/frame saved.
        for (const gradient of this._knownGradients) {
            if (!this._touchedGradients.has(gradient)) {
                gradient.destroy();
            }
        }
        const nextKnown = this._touchedGradients;
        this._touchedGradients = this._knownGradients;
        this._touchedGradients.clear();
        this._knownGradients = nextKnown;
    }

    /** Call when the owning entity is unregistered/torn down, so any gradient it was still holding a live reference to doesn't leak its GPU texture. */
    destroyGradients() {
        for (const gradient of this._knownGradients) gradient.destroy();
        this._knownGradients.clear();
        this._touchedGradients.clear();
    }

    // --- transform stack (pooled, zero-allocation) ---
    save() {
        this._stackPool[this._stackDepth].copyFrom(this._matrix);
        this._stackDepth++;
    }
    restore() {
        if (this._stackDepth > 0) {
            this._stackDepth--;
            this._matrix.copyFrom(this._stackPool[this._stackDepth]);
        }
    }
    // translate/rotate/scale use the zero-allocation in-place variants to avoid creating
    // temporary Matrix2D objects (2 per call in the original allocating version). These
    // are the hottest paths in the shim - called hundreds of times per frame across all
    // dynamic entities (save/translate/draw/restore per limb, per particle, etc.).
    translate(x, y) { this._matrix.translateSelf(x, y); }
    rotate(angle)   { this._matrix.rotateSelf(angle);   }
    scale(sx, sy)   { this._matrix.scaleSelf(sx, sy);   }

    // --- style ---
    set fillStyle(v) {
        if (typeof v === 'string') {
            // Pixi's color parser rejects scientific notation (e.g. rgba(x,y,z,1.32e-8))
            // that Canvas2D accepts silently - normalize near-zero alpha values.
            if (v.charCodeAt(0) === 114 && v.includes('e')) v = CanvasGraphicsShim._normalizeRgbaAlpha(v);
        } else if (v instanceof FillGradient) {
            this._touchedGradients.add(v);
        } else if (v !== null && v !== undefined) {
            // CanvasGradient object from a prior Canvas2D render - invalid for Pixi.
            // Null it out so fill() is a no-op; entity gradient caches that compare
            // `this._gradCtx !== ctx` will recreate via the shim on the next frame.
            v = null;
        }
        this._fillStyle = v;
    }
    get fillStyle() { return this._fillStyle; }
    set strokeStyle(v) {
        if (typeof v === 'string') {
            if (v.charCodeAt(0) === 114 && v.includes('e')) v = CanvasGraphicsShim._normalizeRgbaAlpha(v);
        } else if (v instanceof FillGradient) {
            this._touchedGradients.add(v);
        } else if (v !== null && v !== undefined) {
            v = null;
        }
        this._strokeStyle = v;
    }
    get strokeStyle() { return this._strokeStyle; }
    set lineWidth(v) { this._lineWidth = v; }
    get lineWidth() { return this._lineWidth; }
    set lineCap(v) { this._lineCap = v; }
    set globalAlpha(v) { this.g.alpha = v; }
    get globalAlpha() { return this.g.alpha; }
    set font(v) { this._font = v; }
    get font() { return this._font; }
    set textAlign(v) { this._textAlign = v; }
    get textAlign() { return this._textAlign; }
    set textBaseline(v) { this._textBaseline = v; }
    get textBaseline() { return this._textBaseline; }
    setLineDash() { /* not supported - no current Strategy B usage needs dashed lines */ }
    clip() { /* not supported - Pixi masking is a different mechanism; current Strategy B
                usage (MagicAcademy's moat ripples) only uses clip() as a polish safeguard
                for content already spatially constrained by its own spawn logic */ }

    // --- gradients: FillGradient already implements the native CanvasGradient
    // interface (addColorStop), so callers' existing `grad.addColorStop(...)` code
    // works completely unmodified - only the creation call is intercepted here.
    // Control points are transformed through the current matrix into world space,
    // matching textureSpace:'global' so they align with the already-world-space
    // path coordinates every other method here produces.
    createLinearGradient(x0, y0, x1, y1) {
        const p0 = this._matrix.transformPoint(x0, y0);
        const p1 = this._matrix.transformPoint(x1, y1);
        const gradient = new FillGradient({ type: 'linear', start: p0, end: p1, textureSpace: 'global', colorStops: [] });
        // Tentatively known as of this frame - must be touched (assigned to fillStyle/
        // strokeStyle) by the end of this frame or it's destroyed at the next reset().
        this._knownGradients.add(gradient);
        return gradient;
    }

    createRadialGradient(x0, y0, r0, x1, y1, r1) {
        const p0 = this._matrix.transformPoint(x0, y0);
        const p1 = this._matrix.transformPoint(x1, y1);
        const scale = this._matrix.decompose().scale;
        const gradient = new FillGradient({
            type: 'radial',
            center: p0, innerRadius: r0 * scale,
            outerCenter: p1, outerRadius: r1 * scale,
            textureSpace: 'global', colorStops: [],
        });
        this._knownGradients.add(gradient);
        return gradient;
    }

    // --- text: Graphics can't draw text, so fillText() is backed by a small pool of
    // PIXI.Text objects reused across frames (reset() hides them all; each fillText()
    // call this frame claims the next pooled one). Anchor approximates Canvas2D's
    // textAlign/textBaseline so position matches.
    fillText(text, x, y) {
        const parent = this._textParent || this.g.parent;
        if (!parent) return;

        let textObj = this._textPool[this._textPoolIndex];
        if (!textObj) {
            textObj = new Text({ text: '' });
            textObj.zIndex = this.g.zIndex; // sit at the same layer tier as the graphics it's drawn alongside
            parent.addChild(textObj);
            this._textPool.push(textObj);
        }
        this._textPoolIndex++;

        const { rotation, scale } = this._matrix.decompose();
        const p = this._matrix.transformPoint(x, y);

        const m = /(\d+(?:\.\d+)?)px/.exec(this._font);
        const fontSize = m ? parseFloat(m[1]) * scale : 10 * scale;
        const fontWeight = /bold/.test(this._font) ? 'bold' : 'normal';
        const fontFamilyMatch = /px\s+(.+)$/.exec(this._font);
        const fontFamily = fontFamilyMatch ? fontFamilyMatch[1] : 'sans-serif';

        textObj.visible = true;
        textObj.text = String(text);
        textObj.style = { fontFamily, fontSize, fontWeight, fill: this._fillStyle };
        textObj.position.set(p.x, p.y);
        textObj.rotation = rotation;
        textObj.anchor.set(
            this._textAlign === 'center' ? 0.5 : this._textAlign === 'right' ? 1 : 0,
            this._textBaseline === 'middle' ? 0.5 : this._textBaseline === 'bottom' ? 1 : 0
        );
    }

    // --- path building: every coordinate is run through the current matrix first ---
    beginPath() { this.g.beginPath(); }
    closePath() { this.g.closePath(); }
    moveTo(x, y) {
        const m = this._matrix;
        this.g.moveTo(m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f);
    }
    lineTo(x, y) {
        const m = this._matrix;
        this.g.lineTo(m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f);
    }

    arc(x, y, r, start, end, ccw) {
        const m = this._matrix;
        const px = m.a * x + m.c * y + m.e, py = m.b * x + m.d * y + m.f;
        if (m.b === 0 && m.c === 0) {
            this.g.arc(px, py, r * m.a, start, end, ccw);
        } else {
            const rot = Math.atan2(m.b, m.a);
            this.g.arc(px, py, r * Math.hypot(m.a, m.b), start + rot, end + rot, ccw);
        }
    }

    ellipse(x, y, rx, ry, rotation, start, end, ccw) {
        const m = this._matrix;
        const px = m.a * x + m.c * y + m.e, py = m.b * x + m.d * y + m.f;
        if (m.b === 0 && m.c === 0) {
            this.g.ellipse(px, py, rx * m.a, ry * m.a, rotation, start, end, ccw);
        } else {
            const mRot = Math.atan2(m.b, m.a), scale = Math.hypot(m.a, m.b);
            this.g.ellipse(px, py, rx * scale, ry * scale, rotation + mRot, start, end, ccw);
        }
    }

    quadraticCurveTo(cpx, cpy, x, y) {
        const m = this._matrix;
        this.g.quadraticCurveTo(
            m.a * cpx + m.c * cpy + m.e, m.b * cpx + m.d * cpy + m.f,
            m.a * x   + m.c * y   + m.e, m.b * x   + m.d * y   + m.f
        );
    }

    bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y) {
        const m = this._matrix;
        this.g.bezierCurveTo(
            m.a * cp1x + m.c * cp1y + m.e, m.b * cp1x + m.d * cp1y + m.f,
            m.a * cp2x + m.c * cp2y + m.e, m.b * cp2x + m.d * cp2y + m.f,
            m.a * x    + m.c * y    + m.e, m.b * x    + m.d * y    + m.f
        );
    }

    fillRect(x, y, w, h) {
        this.g.beginPath();
        this._rectPath(x, y, w, h);
        this.g.fill(this._fillStyle);
    }

    strokeRect(x, y, w, h) {
        this.g.beginPath();
        this._rectPath(x, y, w, h);
        this.g.stroke({ width: this._lineWidth, color: this._strokeStyle });
    }

    _rectPath(x, y, w, h) {
        const m = this._matrix;
        if (m.b === 0 && m.c === 0) {
            // Axis-aligned: no rotation, 1 rect cmd + ~6 ops instead of 5 path cmds + 16 matrix ops.
            this.g.rect(m.a * x + m.e, m.d * y + m.f, m.a * w, m.d * h);
            return;
        }
        const p0 = m.transformPoint(x, y);
        const p1 = m.transformPoint(x + w, y);
        const p2 = m.transformPoint(x + w, y + h);
        const p3 = m.transformPoint(x, y + h);
        this.g.moveTo(p0.x, p0.y).lineTo(p1.x, p1.y).lineTo(p2.x, p2.y).lineTo(p3.x, p3.y).closePath();
    }

    fill() { if (this._fillStyle !== null) this.g.fill(this._fillStyle); }
    stroke() { if (this._strokeStyle !== null) this.g.stroke({ width: this._lineWidth, color: this._strokeStyle }); }

    // Normalizes rgba alpha in scientific notation (e.g. 1.32e-8) to a fixed-decimal string
    // that Pixi's color parser can handle. Only called when 'e' is in the string.
    static _normalizeRgbaAlpha(str) {
        const lastComma = str.lastIndexOf(',');
        if (lastComma < 0) return str;
        const alpha = parseFloat(str.slice(lastComma + 1));
        if (isNaN(alpha) || alpha <= 0) return str.slice(0, lastComma) + ', 0)';
        if (alpha >= 1) return str.slice(0, lastComma) + ', 1)';
        return str.slice(0, lastComma) + ', ' + alpha.toFixed(4) + ')';
    }
}
