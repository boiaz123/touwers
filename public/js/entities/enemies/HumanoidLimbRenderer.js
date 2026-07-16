/**
 * Shared limb-drawing helper for humanoid enemies (Basic/Archer/Beefy/Villager/
 * Knight/ShieldKnight/Mage). Every humanoid used to hand-roll its own
 * shoulder->elbow->wrist / hip->knee->foot trig and stroke calls; factoring the
 * common two-segment-limb-with-shading pattern here means every humanoid gets
 * the same joint highlight/shadow treatment for free, and future tweaks to how
 * limbs read visually happen in one place instead of seven.
 *
 * These are pure functions operating on an already-positioned/rotated ctx
 * (or CanvasGraphicsShim, which implements the same drawing calls) - callers
 * pass hip/shoulder-relative coordinates exactly as before, so this is a drop-in
 * replacement for the old per-class copy-pasted trig, not a behavior change.
 */

/**
 * Draws a two-segment limb (upper + lower) as a single tapered stroke with a
 * soft ground/depth shadow offset behind it, plus an end-cap "hand"/"foot" pad.
 * Angle is measured from the positive X axis (standard atan2/cos/sin convention).
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} originX  hip/shoulder X
 * @param {number} originY  hip/shoulder Y
 * @param {number} upperAngle  angle of the first segment
 * @param {number} upperLength
 * @param {number} lowerAngle  angle of the second segment (absolute, not relative)
 * @param {number} lowerLength
 * @param {object} style
 * @param {string} style.limbColor      stroke color for both segments
 * @param {string} style.padColor       fill color for the end cap
 * @param {number} style.limbWidth      stroke width for both segments
 * @param {number} [style.padRadius]    end cap radius (defaults to limbWidth * 0.55)
 * @param {string} [style.shadowColor]  defaults to a soft translucent black
 * @param {number} [style.shadowOffset] defaults to limbWidth * 0.12
 * @returns {{elbowX:number, elbowY:number, endX:number, endY:number}} joint positions, for callers that need to attach a weapon/shield at the end point
 */
export function drawTwoSegmentLimb(ctx, originX, originY, upperAngle, upperLength, lowerAngle, lowerLength, style) {
    const {
        limbColor, padColor, limbWidth,
        padRadius = limbWidth * 0.55,
        shadowColor = 'rgba(0, 0, 0, 0.15)',
        shadowOffset = limbWidth * 0.12,
    } = style;

    const elbowX = originX + Math.cos(upperAngle) * upperLength;
    const elbowY = originY + Math.sin(upperAngle) * upperLength;
    const endX = elbowX + Math.cos(lowerAngle) * lowerLength;
    const endY = elbowY + Math.sin(lowerAngle) * lowerLength;

    // Depth shadow, offset slightly down-right
    ctx.strokeStyle = shadowColor;
    ctx.lineWidth = limbWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(originX + shadowOffset, originY + shadowOffset);
    ctx.lineTo(elbowX + shadowOffset, elbowY + shadowOffset);
    ctx.lineTo(endX + shadowOffset, endY + shadowOffset);
    ctx.stroke();

    // Main limb stroke
    ctx.strokeStyle = limbColor;
    ctx.lineWidth = limbWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(elbowX, elbowY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // End cap (hand/foot)
    ctx.fillStyle = padColor;
    ctx.beginPath();
    ctx.arc(endX, endY, padRadius, 0, Math.PI * 2);
    ctx.fill();

    return { elbowX, elbowY, endX, endY };
}

/**
 * Layered walk-cycle values shared across humanoid types: leg swing (drives foot
 * placement) and body bob (double-time - both feet land twice per full leg-swing
 * cycle, so the torso bobs up on every step). All humanoids can derive their
 * per-type character (heavier gait, faster swing) by scaling `frequency`/the
 * amplitude they multiply `legSwing` by.
 *
 * A whole-body rotation ("torso lean") and a separate head-bob offset used to be
 * computed here too, but rotating the entire figure (legs included) every frame
 * reads as the character wiggling/rocking in place rather than walking - a real
 * weight-shift lean would need to pivot the upper body only, which is more than
 * this flat-shape rendering style can pull off convincingly, so it's been dropped
 * in favor of a cleaner, more legible stride driven by limb swing + vertical bob
 * alone.
 *
 * @param {number} animationTime
 * @param {number} phaseOffset  per-instance desync offset (BaseEnemy.animationPhaseOffset)
 * @param {number} frequency    radians/sec (WALK_FREQ default is 8, matching EnemyRenderAdapter)
 */
export function computeWalkCycle(animationTime, phaseOffset, frequency = 8) {
    const t = animationTime * frequency + phaseOffset;
    const sinT = Math.sin(t);
    return {
        t,
        legSwing: sinT,
        bodyBob: Math.sin(t * 2) * 0.3,
    };
}

/**
 * Knee-bend amount (0..1) for one leg of a walking pair, properly phase-shifted
 * from the hip swing rather than directly proportional to it. A leg needs to bend
 * at the knee while it's recovering forward through the air (foot off the ground)
 * and stay near-straight while planted/pushing - that recovery moment is when the
 * hip swing is passing through its *vertical* midpoint (`legSwing` near 0), not
 * when the hip is at its most-swung extreme. Using `cos(t)` (90 degrees out of
 * phase with `sin(t)`) captures that directly, and the two legs' bends are exact
 * mirror images of each other (`cos(t)` vs `-cos(t)`), so only one leg bends at a
 * time, alternating - previously KnightEnemy had no knee bend at all (dead-straight
 * pendulum legs) and ShieldKnight/BeefyEnemy bent in the same phase as the hip
 * swing (bending most at the stride extremes instead of during recovery), both of
 * which read as a stiff/unnatural gait.
 *
 * @param {{t: number}} anim   the object returned by computeWalkCycle
 * @param {boolean} isRight
 */
export function kneeFlex(anim, isRight) {
    const c = Math.cos(anim.t);
    return Math.max(0, isRight ? -c : c);
}

/**
 * Computes the actual limb angle (measured from the +x axis, matching
 * drawTwoSegmentLimb's convention) for one side of a bilateral limb pair (arms or
 * legs) that hangs down and slightly toward the body's centerline at rest, and
 * swings in alternating (opposite) phase between left and right during the gait.
 *
 * `lean` is how far the LEFT limb's rest pose tilts from straight-down (Math.PI/2)
 * away from the body center: 0 for legs (hang straight down), positive for arms
 * (rest angle flaring slightly outward so the elbow protrudes away from the torso).
 *
 * The previous approach computed each side's angle independently (a separately
 * negated "rightSwing" value, then ALSO geometrically mirrored via `Math.PI - x`
 * at the call site) - negating twice cancels out, which is exactly why every
 * humanoid's arms ended up swinging in lockstep instead of alternating. Mirroring
 * the rest lean and the swing direction together in one `Math.PI - leftAngle`
 * step is what actually guarantees opposite-phase motion.
 *
 * @param {number} lean       left-side rest lean from vertical, in radians (0 for legs)
 * @param {number} swing      shared phase driver, typically `computeWalkCycle(...).legSwing`
 * @param {number} amplitude  how far `swing` moves the limb, in radians
 * @param {boolean} isRight
 */
export function mirroredLimbAngle(lean, swing, amplitude, isRight) {
    const leftAngle = (Math.PI / 2 + lean) + swing * amplitude;
    return isRight ? Math.PI - leftAngle : leftAngle;
}

/**
 * Two-link leg IK: given a hip and a desired foot world-position, returns the
 * {upperAngle, lowerAngle} pair that drawTwoSegmentLimb needs.
 *
 * kneeSign: +1 bends the knee outward-left  (left leg)
 *           -1 bends the knee outward-right (right leg)
 *
 * The distance from hip to foot is clamped to the reachable range so callers
 * don't need to guard against degenerate configurations.
 */
export function solveLegIK(hipX, hipY, footX, footY, upperLen, lowerLen, kneeSign) {
    const dx = footX - hipX;
    const dy = footY - hipY;
    const raw = Math.sqrt(dx * dx + dy * dy);
    const dist = Math.max(Math.abs(upperLen - lowerLen) + 0.01,
                          Math.min(upperLen + lowerLen - 0.01, raw));
    const hipToFoot = Math.atan2(dy, dx);
    const cosA = (upperLen * upperLen + dist * dist - lowerLen * lowerLen)
                 / (2 * upperLen * dist);
    const alpha = Math.acos(Math.max(-1, Math.min(1, cosA)));
    const upperAngle = hipToFoot + kneeSign * alpha;
    const elbowX = hipX + Math.cos(upperAngle) * upperLen;
    const elbowY = hipY + Math.sin(upperAngle) * upperLen;
    return {
        upperAngle,
        lowerAngle: Math.atan2(footY - elbowY, footX - elbowX),
    };
}
