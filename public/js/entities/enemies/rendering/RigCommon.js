/**
 * Engine-agnostic pieces of the "sprite rig" render path (EnemyRenderAdapter's Mode C).
 *
 * A rigged enemy describes itself as a *spec*:
 *   - atlas:  the drawables. Each is drawn once, with real Canvas2D, into a shared per-variant
 *             texture atlas - `draw(ctx)` paints at logical size with the origin at the part's
 *             pivot, inside a box of `w` x `h` logical px whose pivot sits at (`ox`, `oy`).
 *   - items:  the display tree, back-to-front. An item shows one atlas drawable (`tex`), or is a
 *             group (`group: true`) that its `parent`ed items are transformed inside of.
 *   - particles: a pool of tinted sprites drawn un-mirrored on top (sparkles etc.).
 * and every frame just writes numbers into one RigNode per item (`entity.updateRigPose()`).
 * Nothing here knows about Pixi: the adapter copies the nodes onto sprites (a handful of
 * transform writes per part instead of re-tessellating ~100 vector shapes, which is what made
 * the old per-frame Graphics redraw the most expensive thing a frog did), and drawRigFallback()
 * paints the very same spec + pose with plain Canvas2D when Pixi isn't active.
 */

/** A part's pose for the current frame: what the adapter (or fallback drawer) applies to it. */
export class RigNode {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.rotation = 0;
        this.scaleX = 1;
        this.scaleY = 1;
        this.alpha = 1;
        this.visible = true;
        /** Id of an alternate atlas drawable to show instead of the item's own (e.g. shut eyes). null = its own. */
        this.tex = null;
        /** Sprite tint - used by the particle pool. */
        this.tint = 0xFFFFFF;
        /** Group items only: the point the group's rotation/scale pivot around. */
        this.pivotX = 0;
        this.pivotY = 0;
    }
}

/** One RigNode per spec item (by id), plus `particles`: an array of nodes for the particle pool. */
export function createRigNodes(spec) {
    const nodes = {};
    for (const item of spec.items) nodes[item.id] = new RigNode();
    nodes.particles = [];
    if (spec.particles) {
        for (let i = 0; i < spec.particles.count; i++) nodes.particles.push(new RigNode());
    }
    return nodes;
}

/** Transparent gutter around every atlas cell so linear filtering never bleeds a neighbour in. */
const RIG_PAD = 2;

/**
 * Shelf-pack a spec's atlas drawables and bake them into ONE canvas with a real 2D context.
 * Returns { canvas, cells } where cells[id] = { x, y, w, h, ax, ay } - the drawable's pixel
 * rectangle in the atlas, and its pivot as a 0..1 anchor within that rectangle.
 */
export function bakeRigAtlas(spec, maxWidth = 512) {
    const bs = spec.bakeScale;
    const cells = {};
    let x = RIG_PAD, y = RIG_PAD, rowH = 0, usedW = 0;

    for (const part of spec.atlas) {
        const w = Math.ceil(part.w * bs), h = Math.ceil(part.h * bs);
        if (x + w + RIG_PAD > maxWidth) {
            x = RIG_PAD;
            y += rowH + RIG_PAD * 2;
            rowH = 0;
        }
        cells[part.id] = { x, y, w, h, ax: (part.ox * bs) / w, ay: (part.oy * bs) / h };
        x += w + RIG_PAD * 2;
        rowH = Math.max(rowH, h);
        usedW = Math.max(usedW, x);
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, usedW);
    canvas.height = Math.max(1, y + rowH + RIG_PAD);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    for (const part of spec.atlas) {
        const cell = cells[part.id];
        ctx.save();
        ctx.beginPath();
        ctx.rect(cell.x, cell.y, cell.w, cell.h);
        ctx.clip();
        ctx.translate(cell.x + part.ox * bs, cell.y + part.oy * bs);
        ctx.scale(bs, bs);
        // Drawables that leave the colour to the caller (the tinted particle dot) bake white.
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#fff';
        part.draw(ctx);
        ctx.restore();
    }

    return { canvas, cells };
}

/**
 * Canvas2D fallback: paint a rigged enemy's current pose straight onto `ctx`, in world space
 * around (ex, ey). Same spec and same node values the Pixi path uses, so the two look alike.
 * (Like every enemy's Canvas2D path this doesn't mirror for facing - only the Pixi container does.)
 */
export function drawRigFallback(ctx, spec, nodes, ex, ey) {
    const atlas = {};
    for (const part of spec.atlas) atlas[part.id] = part;

    const applyNode = (n) => {
        ctx.translate(n.x, n.y);
        if (n.rotation !== 0) ctx.rotate(n.rotation);
        if (n.scaleX !== 1 || n.scaleY !== 1) ctx.scale(n.scaleX, n.scaleY);
    };

    for (let i = 0; i < spec.items.length; i++) {
        const item = spec.items[i];
        if (item.group) continue;
        const n = nodes[item.id];
        if (!n.visible) continue;

        ctx.save();
        ctx.translate(ex, ey);
        if (item.parent) {
            const g = nodes[item.parent];
            ctx.translate(g.x, g.y);
            if (g.rotation !== 0) ctx.rotate(g.rotation);
            ctx.translate(-g.pivotX, -g.pivotY);
        }
        applyNode(n);
        ctx.globalAlpha = n.alpha;
        atlas[n.tex || item.tex].draw(ctx);
        ctx.restore();
    }

    if (spec.particles) {
        const dot = atlas[spec.particles.tex];
        for (let i = 0; i < nodes.particles.length; i++) {
            const n = nodes.particles[i];
            if (!n.visible) continue;
            ctx.save();
            ctx.translate(ex, ey);
            applyNode(n);
            ctx.globalAlpha = n.alpha;
            ctx.fillStyle = '#' + n.tint.toString(16).padStart(6, '0');
            dot.draw(ctx);
            ctx.restore();
        }
    }
}
