import { Building } from './Building.js';

export class TrainingGrounds extends Building {
    constructor(x, y, gridX, gridY) {
        super(x, y, gridX, gridY, 4);
        this.isSelected = false;
        this.unlockSystem = null; // Will be set by TowerManager when clicked

        // Training Grounds building level - starts at 1 when built
        this.trainingLevel = 1;
        this.maxTrainingLevel = 5;

        // Defender system unlock and upgrade
        this.defenderUnlocked = false; // Unlocked at training level 3
        this.defenderMaxLevel = 1; // Upgraded to level 2 at training level 4, level 3 at training level 5

        // Guard Post system unlock and limits
        this.guardPostUnlocked = true; // Unlocked when training grounds is placed
        this.maxGuardPosts = 1; // 1 guard post allowed from placement

        // Range upgrades for manned towers - each tower has 5 levels
        // Towers: ArcherTower, BasicTower, CannonTower (PoisonArcherTower and BarricadeTower use fire rate instead)
        this.rangeUpgrades = {
            archerTower: { level: 0, maxLevel: 5, baseCost: 150, effect: 15 },
            basicTower: { level: 0, maxLevel: 5, baseCost: 150, effect: 15 },
            cannonTower: { level: 0, maxLevel: 5, baseCost: 150, effect: 15 }
        };

        // Tower-specific fire rate upgrades
        this.upgrades = {
            barricadeFireRate: { level: 0, maxLevel: 5, baseCost: 150, effect: 0.1 }, // Fire rate: 0.33 → 0.83 at level 5
            poisonArcherTowerFireRate: { level: 0, maxLevel: 5, baseCost: 140, effect: 0.05 } // Fire rate: 0.25 → 0.50 at level 5
        };

        this.trainingParticles = [];
        this.nextParticleTime = 0;

        // Transient impact sparks - arrows striking targets, weapons striking dummies
        this.impactEffects = [];

        // Left Archer Lane - organized firing line with row of targets
        // Each archer has its own target directly ahead of it (same x) so the range reads as
        // 4 straight lanes total (2 left + 2 right), not diagonal/fanned shooting lines.
        // Archers stand further back from groundY (the target-row baseline) than before, so the
        // lane itself reads as noticeably longer while archer + target stay lane-aligned.
        this.leftArcherLane = {
            groundY: -28,
            archers: [
                { x: -38, y: -18, angle: 0, drawback: 0, animationOffset: 0, targetIdx: 0 },
                { x: -22, y: -18, angle: 0, drawback: 0, animationOffset: 0.4, targetIdx: 1 }
            ],
            targets: [
                { x: -38, distance: 35, hits: 0 },
                { x: -22, distance: 35, hits: 0 }
            ]
        };

        // Right Archer Lane - organized firing line (mirrors left)
        this.rightArcherLane = {
            groundY: -28,
            archers: [
                { x: 38, y: -18, angle: 0, drawback: 0, animationOffset: 0.2, targetIdx: 0 },
                { x: 22, y: -18, angle: 0, drawback: 0, animationOffset: 0.6, targetIdx: 1 }
            ],
            targets: [
                { x: 38, distance: 35, hits: 0 },
                { x: 22, distance: 35, hits: 0 }
            ]
        };

        // Sword Fighting Area - two separate dueling circles with spacing
        this.swordFightArea = {
            duelCircles: [
                { x: -24, y: 20 },
                { x: 24, y: 20 }
            ],
            fighters: [
                { circleIdx: 0, x: -4, y: 0, direction: 1, color: '#8B0000' },
                { circleIdx: 0, x: 4, y: 0, direction: -1, color: '#000080' },
                { circleIdx: 1, x: -4, y: 0, direction: 1, color: '#000080' },
                { circleIdx: 1, x: 4, y: 0, direction: -1, color: '#8B0000' }
            ]
        };

        // Training dummies for solo practice - positioned away from main areas
        // y raised from the sword-duel area (circles centered y:20, r:8 -> top edge y:12) so the
        // dummy's post base has clearance from "the bottom fighters" below it.
        this.dummies = [
            { x: -38, y: 4, type: 'wood', rotation: 0, wobble: 0, wobbleVel: 0 },
            { x: 38, y: 4, type: 'wood', rotation: 0, wobble: 0, wobbleVel: 0 }
        ];

        // Recruits practicing melee strikes on the training dummies - their swing
        // timing drives the dummy hit reaction (wobble + wood-chip burst).
        this.dummyTrainees = [
            { dummyIdx: 0, offsetX: 7, phaseOffset: 0, lastCycle: -1, color: '#4A5D23' },
            { dummyIdx: 1, offsetX: -7, phaseOffset: 2.4, lastCycle: -1, color: '#5B3A29' }
        ];

        // Wooden hut in corner
        this.hut = {
            x: -42,
            y: -38,
            width: 10,
            height: 9
        };

        // Environmental decorations around fence - LARGER and OUTSIDE (but within grid).
        // The two corner trees nearest the hut (index 0/1) sit well above the fence line
        // (y well past -60) so their canopies never visually cross over the hut roof.
        this.fenceDecorations = {
            trees: [
                { x: -56, y: -60, size: 1.8, gridX: -1, gridY: -1 },
                { x: -42, y: -64, size: 2.0, gridX: -1, gridY: -2 },
                { x: 54, y: -52, size: 1.9, gridX: 1, gridY: -1 },
                { x: 56, y: -48, size: 1.7, gridX: 2, gridY: -1 },
                { x: -56, y: 52, size: 1.95, gridX: -2, gridY: 1 },
                { x: 54, y: 54, size: 1.8, gridX: 1, gridY: 2 }
            ],
            rocks: [
                { x: -60, y: -40, size: 1.75 },
                { x: 60, y: -42, size: 2.0 },
                { x: -60, y: 36, size: 1.9 },
                { x: 60, y: 32, size: 1.6 }
            ],
            bushes: [
                { x: -57, y: -32, size: 0.6 },
                { x: 58, y: -36, size: 0.65 },
                { x: -56, y: 48, size: 0.55 },
                { x: 57, y: 52, size: 0.7 }
            ]
        };

        // Supply props INSIDE the fence (mirrors the hut corner with a barrel stack, and
        // tucks crates into the two open corners by the sword-fight area) - keeps them
        // visually tied to the yard instead of scattered loose in the field outside.
        this.yardProps = {
            barrels: [
                { x: 33, y: -41 },
                { x: 29, y: -34 }
            ],
            crates: [
                { x: -43, y: 40 },
                { x: 43, y: 40 }
            ]
        };

        this.fencePerimeter = {
            segments: [
                { startX: -50, startY: -48, endX: 50, endY: -48, posts: 13 },
                { startX: 50, startY: -48, endX: 50, endY: 48, posts: 12 },
                { startX: 50, startY: 48, endX: -50, endY: 48, posts: 13 },
                { startX: -50, startY: 48, endX: -50, endY: -48, posts: 12 }
            ]
        };

        // Set by BuildingRenderAdapter once it has baked/synced this building's static
        // grounds via Pixi (particles still draw here regardless - not yet migrated).
        this.skipCanvas2DBodyRender = false;

        // When true, fence-decoration vegetation always uses the local generic tree/bush
        // renderer instead of ctx.level.renderVegetation - set by SettlementHub on its campaign-
        // select preview instance so it always shows forest-style trees regardless of whatever
        // campaign ctx.level happens to reflect (e.g. the last level actually played).
        this.forceLocalVegetation = false;
    }

    update(deltaTime) {
        super.update(deltaTime);

        // World-unit -> screen-pixel scale, matching the size/128 convention used by
        // renderStaticBack/renderDynamicParts (see those methods) and by sibling buildings like
        // MagicAcademy/TowerForge. _lastRenderSize is set every frame by whichever caller renders
        // this instance (BuildingRenderAdapter.sync() in real gameplay, SettlementHub's preview);
        // reused here so spawned particles land at the same screen position as the scaled visuals.
        const s = (this._lastRenderSize || 128) / 128;
        this._renderScale = s;

        // Update left archer lane animations - targeting specific targets
        this.leftArcherLane.archers.forEach(archer => {
            archer.drawback = (Math.sin(this.animationTime * 3 + archer.animationOffset) + 1) * 0.5;
            archer.angle = 0;
        });

        // Update right archer lane animations
        this.rightArcherLane.archers.forEach(archer => {
            archer.drawback = (Math.sin(this.animationTime * 3 + archer.animationOffset) + 1) * 0.5;
            archer.angle = 0;
        });

        // Update duel animations
        this.swordFightArea.fighters.forEach(fighter => {
            fighter.swingAngle = Math.sin(this.animationTime * 4 + fighter.direction) * 0.6;
            fighter.stance = Math.sin(this.animationTime * 2) * 0.3;
        });

        // Update dummy trainees - swing timing + strike-contact detection (edge-triggered
        // on the unwrapped swing angle so a hit fires exactly once per swing cycle).
        this.dummyTrainees.forEach(trainee => {
            const theta = this.animationTime * 1.8 + trainee.phaseOffset;
            trainee.swingAngle = Math.sin(theta);
            const cycle = Math.floor((theta - 1.2) / (Math.PI * 2));
            if (cycle > trainee.lastCycle) {
                trainee.lastCycle = cycle;
                this.triggerDummyHit(trainee);
            }
        });

        // Spring-damper decay for dummies rocked by a recent strike
        this.dummies.forEach(dummy => {
            const accel = -55 * dummy.wobble - 10 * dummy.wobbleVel;
            dummy.wobbleVel += accel * deltaTime;
            dummy.wobble += dummy.wobbleVel * deltaTime;
        });

        // Fade out impact flashes (compact-in-place to avoid allocation)
        let fxWriteIdx = 0;
        for (let i = 0; i < this.impactEffects.length; i++) {
            const fx = this.impactEffects[i];
            fx.life -= deltaTime;
            if (fx.life > 0) this.impactEffects[fxWriteIdx++] = fx;
        }
        this.impactEffects.length = fxWriteIdx;

        this.nextParticleTime -= deltaTime;
        if (this.nextParticleTime <= 0) {
            const particleType = Math.floor(Math.random() * 3);

            if (particleType === 0 && Math.random() > 0.3) {
                // Arrow from left archer lane toward specific target
                const archer = this.leftArcherLane.archers[Math.floor(Math.random() * this.leftArcherLane.archers.length)];
                const targetIdx = archer.targetIdx;
                const target = this.leftArcherLane.targets[targetIdx];

                const targetScreenX = this.x + target.x * s;
                const targetScreenY = this.y + (this.leftArcherLane.groundY - target.distance) * s;
                const archerScreenX = this.x + archer.x * s;
                const archerScreenY = this.y + archer.y * s;
                const startX = archerScreenX + 8 * s;
                const startY = archerScreenY;
                const dx = targetScreenX - startX;
                const dy = targetScreenY - startY;
                const distance = Math.hypot(dx, dy);
                const speed = 150 * s;

                this.trainingParticles.push({
                    x: startX,
                    y: startY,
                    vx: (dx / distance) * speed,
                    vy: (dy / distance) * speed,
                    life: distance / speed + 0.1,
                    maxLife: distance / speed + 0.1,
                    type: 'arrow',
                    size: 2,
                    renderScale: s,
                    targetX: targetScreenX,
                    targetY: targetScreenY,
                    hitRadius: 8 * s
                });
            } else if (particleType === 1 && Math.random() > 0.3) {
                // Arrow from right archer lane toward specific target
                const archer = this.rightArcherLane.archers[Math.floor(Math.random() * this.rightArcherLane.archers.length)];
                const targetIdx = archer.targetIdx;
                const target = this.rightArcherLane.targets[targetIdx];

                const targetScreenX = this.x + target.x * s;
                const targetScreenY = this.y + (this.rightArcherLane.groundY - target.distance) * s;
                const archerScreenX = this.x + archer.x * s;
                const archerScreenY = this.y + archer.y * s;
                const startX = archerScreenX - 8 * s;
                const startY = archerScreenY;
                const dx = targetScreenX - startX;
                const dy = targetScreenY - startY;
                const distance = Math.hypot(dx, dy);
                const speed = 150 * s;

                this.trainingParticles.push({
                    x: startX,
                    y: startY,
                    vx: (dx / distance) * speed,
                    vy: (dy / distance) * speed,
                    life: distance / speed + 0.1,
                    maxLife: distance / speed + 0.1,
                    type: 'arrow',
                    size: 2,
                    renderScale: s,
                    targetX: targetScreenX,
                    targetY: targetScreenY,
                    hitRadius: 8 * s
                });
            } else {
                // Dust from sword fight
                const circle = this.swordFightArea.duelCircles[Math.floor(Math.random() * this.swordFightArea.duelCircles.length)];
                this.trainingParticles.push({
                    x: this.x + circle.x * s + (Math.random() - 0.5) * 12 * s,
                    y: this.y + circle.y * s + (Math.random() - 0.5) * 12 * s,
                    vx: (Math.random() - 0.5) * 40 * s,
                    vy: (-Math.random() * 25 - 15) * s,
                    life: 2,
                    maxLife: 2,
                    type: 'dust',
                    size: Math.random() * 2.5 + 1
                });
            }

            this.nextParticleTime = 0.2 + Math.random() * 0.4;
        }

        // Update particles (compact-in-place to avoid allocation)
        const spawnedChips = [];
        let writeIdx = 0;
        for (let i = 0; i < this.trainingParticles.length; i++) {
            const particle = this.trainingParticles[i];
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.life -= deltaTime;
            // Dust and wood chips fall with gravity; arrows fly straight to their target
            if (particle.type === 'dust' || particle.type === 'chip') particle.vy += 120 * deltaTime;

            let keep = particle.life > 0;

            // Check if arrow hit its target
            if (keep && particle.type === 'arrow' && particle.targetX && particle.targetY) {
                const dx = particle.x - particle.targetX;
                const dy = particle.y - particle.targetY;
                const distance = Math.hypot(dx, dy);

                // If arrow is close to target, it hits and disappears, leaving a brief impact spark
                if (distance < particle.hitRadius) {
                    keep = false;
                    this.impactEffects.push({ x: particle.targetX, y: particle.targetY, life: 0.3, maxLife: 0.3 });
                    for (let c = 0; c < 3; c++) {
                        spawnedChips.push({
                            x: particle.targetX,
                            y: particle.targetY,
                            vx: (Math.random() - 0.5) * 30 * s,
                            vy: (-Math.random() * 20 - 5) * s,
                            life: 0.4,
                            maxLife: 0.4,
                            type: 'chip',
                            size: Math.random() * 1 + 0.4
                        });
                    }
                }
            }

            if (keep && (particle.type === 'dust' || particle.type === 'chip')) {
                particle.size = Math.max(0, particle.size * (particle.life / particle.maxLife));
            }

            if (keep) {
                this.trainingParticles[writeIdx++] = particle;
            }
        }
        this.trainingParticles.length = writeIdx;
        for (const chip of spawnedChips) {
            this.trainingParticles.push(chip);
        }
    }

    /** Applies a hit impulse to a trainee's dummy plus a wood-chip burst at the contact point.
     * Deliberately no impact-spark flash here (unlike arrow-on-target hits) - a flash repeating
     * every swing cycle at this scale reads as a distracting glimmer rather than a hit. */
    triggerDummyHit(trainee) {
        const dummy = this.dummies[trainee.dummyIdx];
        const side = Math.sign(trainee.offsetX) || 1;
        dummy.wobbleVel += -side * 0.85;

        const s = this._renderScale || 1;
        const hitX = this.x + (dummy.x - side * 3) * s;
        const hitY = this.y + (dummy.y - 3) * s;

        for (let i = 0; i < 4; i++) {
            this.trainingParticles.push({
                x: hitX,
                y: hitY,
                vx: (Math.random() - 0.5) * 50 * s,
                vy: (-Math.random() * 40 - 10) * s,
                life: 0.5,
                maxLife: 0.5,
                type: 'chip',
                size: Math.random() * 1.2 + 0.6
            });
        }
    }

    render(ctx, size) {
        if (!this.skipCanvas2DBodyRender) {
            this.renderStaticBack(ctx, size);
            this.renderDynamicParts(ctx, size);
        }

        // Not yet migrated (Phase 6-shaped ephemeral effects)
        this.renderParticles(ctx);
    }

    /** No front-of-building overlay for this type - present for BuildingRenderAdapter's uniform convention. */
    renderStaticFront(ctx, size) {
        // intentionally empty
    }

    /** Strategy A (baked once per campaign, shared across instances): grounds, fence, decorations, hut, lane markings, archery targets - everything without continuous per-instance animation.
     * All local geometry below is authored at a nominal 128-unit design size (matching MagicAcademy/
     * TowerForge's convention) and scaled here by size/128 to the actual on-screen footprint, instead
     * of rendering at a fixed absolute pixel size regardless of the building's real grid cell size. */
    renderStaticBack(ctx, size) {
        const s = size / 128;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(s, s);
        ctx.translate(-this.x, -this.y);

        this.renderDetailedGround(ctx, size);
        this.renderArcherLanePaths(ctx);
        this.renderFencePerimeter(ctx, size);
        this.renderFenceDecorations(ctx, size);
        this.renderHut(ctx, size);
        this.renderYardProps(ctx);
        this.renderLaneMarkings(ctx, size);
        this.renderArcherLaneTargets(ctx, this.leftArcherLane);
        this.renderArcherLaneTargets(ctx, this.rightArcherLane);

        ctx.restore();
    }

    /** Strategy B (per-instance Graphics, redrawn every frame): archers (bow draw-back), sword fighters (swing/stance), training dummies (post-hit wobble) and their trainees - all continuous per-instance state.
     * Scaled by size/128 for the same reason as renderStaticBack above. */
    renderDynamicParts(ctx, size) {
        const s = size / 128;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(s, s);
        ctx.translate(-this.x, -this.y);

        this.renderArcherLaneArchers(ctx, this.leftArcherLane, true);
        this.renderArcherLaneArchers(ctx, this.rightArcherLane, false);
        this.renderSwordFightArea(ctx, size);
        this.renderDummies(ctx, size);
        this.renderDummyTrainees(ctx);

        ctx.restore();
    }

    renderDetailedGround(ctx, size) {
        // Main grass base - only within fence
        const grassGradient = ctx.createLinearGradient(
            this.x - 50, this.y - 48,
            this.x - 50, this.y + 48
        );
        grassGradient.addColorStop(0, '#5A7A3A');
        grassGradient.addColorStop(0.5, '#6B8E3A');
        grassGradient.addColorStop(1, '#4A6A2A');

        ctx.fillStyle = grassGradient;
        ctx.fillRect(this.x - 50, this.y - 48, 100, 96);

        // Fine grass blade texture - deterministic pseudo-random via sine hashing so the
        // baked static texture stays identical across bakes/instances.
        ctx.lineWidth = 0.4;
        for (let i = 0; i < 70; i++) {
            const h1 = Math.sin(i * 12.9898) * 43758.5453;
            const f1 = h1 - Math.floor(h1);
            const h2 = Math.sin(i * 78.233) * 12345.678;
            const f2 = h2 - Math.floor(h2);
            const bx = this.x - 48 + f1 * 96;
            const by = this.y - 46 + f2 * 92;
            const bladeLen = 1.1 + f1 * 1.1;
            ctx.strokeStyle = i % 2 === 0 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.lineTo(bx + bladeLen * 0.3, by - bladeLen);
            ctx.stroke();
        }

        // Dirt paths and wear areas
        const wearPatches = [
            // Left archer lane
            { x: -38, y: -18, width: 27, height: 4, intensity: 0.5 },
            // Right archer lane
            { x: 38, y: -18, width: 27, height: 4, intensity: 0.5 },
            // Left sword fight area
            { x: -24, y: 20, width: 18, height: 18, intensity: 0.6 },
            // Right sword fight area
            { x: 24, y: 20, width: 18, height: 18, intensity: 0.6 },
            // Dummy areas
            { x: -38, y: 4, width: 13, height: 8, intensity: 0.4 },
            { x: 38, y: 4, width: 13, height: 8, intensity: 0.4 }
        ];

        wearPatches.forEach(patch => {
            const cx = this.x + patch.x;
            const cy = this.y + patch.y;
            const dirtGradient = ctx.createRadialGradient(
                cx, cy, 0,
                cx, cy, Math.max(patch.width, patch.height) * 0.65
            );
            dirtGradient.addColorStop(0, `rgba(139, 90, 43, ${patch.intensity})`);
            dirtGradient.addColorStop(0.7, `rgba(139, 90, 43, ${patch.intensity * 0.5})`);
            dirtGradient.addColorStop(1, `rgba(139, 90, 43, 0)`);

            ctx.fillStyle = dirtGradient;
            ctx.beginPath();
            ctx.ellipse(cx, cy, patch.width / 2, patch.height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
        });

        // Grass variations around perimeter
        const grassVariations = [
            { x: -42, y: -38, radius: 5, opacity: 0.25 },
            { x: 42, y: -38, radius: 5, opacity: 0.25 },
            { x: -42, y: 38, radius: 6, opacity: 0.3 },
            { x: 42, y: 38, radius: 6, opacity: 0.3 }
        ];

        grassVariations.forEach(area => {
            const grassVariationGradient = ctx.createRadialGradient(
                this.x + area.x, this.y + area.y, 0,
                this.x + area.x, this.y + area.y, area.radius
            );
            grassVariationGradient.addColorStop(0, `rgba(34, 139, 34, ${area.opacity})`);
            grassVariationGradient.addColorStop(1, `rgba(34, 139, 34, 0)`);

            ctx.fillStyle = grassVariationGradient;
            ctx.beginPath();
            ctx.arc(this.x + area.x, this.y + area.y, area.radius, 0, Math.PI * 2);
            ctx.fill();
        });

        // Scattered stones and rocks - inside fence
        const rocks = [
            { x: -47, y: -35, size: 1 },
            { x: 47, y: -35, size: 1 },
            { x: -47, y: 35, size: 1.1 },
            { x: 47, y: 35, size: 1 }
        ];

        rocks.forEach(rock => {
            ctx.fillStyle = '#8B8680';
            ctx.strokeStyle = '#696969';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.arc(this.x + rock.x, this.y + rock.y, rock.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });

        // Soft ambient-occlusion vignette along the inside of the fence line - gives the
        // ground plane a sense of depth and ties it visually to the perimeter.
        const vignette = ctx.createRadialGradient(this.x, this.y, 28, this.x, this.y, 70);
        vignette.addColorStop(0, 'rgba(0,0,0,0)');
        vignette.addColorStop(1, 'rgba(0,0,0,0.16)');
        ctx.fillStyle = vignette;
        ctx.fillRect(this.x - 50, this.y - 48, 100, 96);
    }

    /** Sand/dirt shooting lanes running from each archer to the specific target they're aimed
     * at - drawn before the fence so the rails read as passing over a gap in the paddock where
     * the lane exits toward the target row, matching how the arrows themselves actually fly. */
    renderArcherLanePaths(ctx) {
        const drawLane = (archer, target, laneGroundY) => {
            const ax = this.x + archer.x;
            const ay = this.y + archer.y;
            const tx = this.x + target.x;
            const ty = this.y + laneGroundY - target.distance;
            const dx = tx - ax;
            const dy = ty - ay;
            const len = Math.hypot(dx, dy) || 1;
            const nx = -dy / len;
            const ny = dx / len;
            const wStart = 5;
            const wEnd = 3.2;

            const p1x = ax + nx * wStart, p1y = ay + ny * wStart;
            const p2x = ax - nx * wStart, p2y = ay - ny * wStart;
            const p3x = tx - nx * wEnd, p3y = ty - ny * wEnd;
            const p4x = tx + nx * wEnd, p4y = ty + ny * wEnd;

            const laneGradient = ctx.createLinearGradient(ax, ay, tx, ty);
            laneGradient.addColorStop(0, 'rgba(200, 170, 120, 0.55)');
            laneGradient.addColorStop(1, 'rgba(200, 170, 120, 0.32)');
            ctx.fillStyle = laneGradient;
            ctx.beginPath();
            ctx.moveTo(p1x, p1y);
            ctx.lineTo(p4x, p4y);
            ctx.lineTo(p3x, p3y);
            ctx.lineTo(p2x, p2y);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = 'rgba(120, 90, 50, 0.5)';
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(p1x, p1y);
            ctx.lineTo(p4x, p4y);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(p2x, p2y);
            ctx.lineTo(p3x, p3y);
            ctx.stroke();
        };

        this.leftArcherLane.archers.forEach(archer => {
            drawLane(archer, this.leftArcherLane.targets[archer.targetIdx], this.leftArcherLane.groundY);
        });
        this.rightArcherLane.archers.forEach(archer => {
            drawLane(archer, this.rightArcherLane.targets[archer.targetIdx], this.rightArcherLane.groundY);
        });
    }

    renderLaneMarkings(ctx, size) {
        // Archer lane dividers
        ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([8, 8]);

        ctx.beginPath();
        ctx.moveTo(this.x - 48, this.y - 18);
        ctx.lineTo(this.x + 48, this.y - 18);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(this.x - 48, this.y + 8);
        ctx.lineTo(this.x + 48, this.y + 8);
        ctx.stroke();

        ctx.setLineDash([]);
    }

    renderFencePerimeter(ctx, size) {
        // Render fence perimeter with posts and rails
        this.fencePerimeter.segments.forEach(segment => {
            const startX = this.x + segment.startX;
            const startY = this.y + segment.startY;
            const endX = this.x + segment.endX;
            const endY = this.y + segment.endY;

            const angle = Math.atan2(endY - startY, endX - startX);
            const distance = Math.hypot(endX - startX, endY - startY);
            const postSpacing = distance / (segment.posts - 1);

            // Rails drawn first so posts and caps sit on top of them
            for (let i = 0; i < segment.posts - 1; i++) {
                const railStartX = startX + Math.cos(angle) * (i * postSpacing);
                const railStartY = startY + Math.sin(angle) * (i * postSpacing);
                const railEndX = startX + Math.cos(angle) * ((i + 1) * postSpacing);
                const railEndY = startY + Math.sin(angle) * ((i + 1) * postSpacing);

                [-5, -1.5].forEach(railOffset => {
                    const railGradient = ctx.createLinearGradient(
                        railStartX, railStartY + railOffset - 0.8,
                        railStartX, railStartY + railOffset + 0.8
                    );
                    railGradient.addColorStop(0, '#DDA15E');
                    railGradient.addColorStop(0.5, '#B5793A');
                    railGradient.addColorStop(1, '#7A4A22');
                    ctx.strokeStyle = railGradient;
                    ctx.lineWidth = 1.6;
                    ctx.lineCap = 'round';
                    ctx.beginPath();
                    ctx.moveTo(railStartX, railStartY + railOffset);
                    ctx.lineTo(railEndX, railEndY + railOffset);
                    ctx.stroke();
                });
            }

            for (let i = 0; i < segment.posts; i++) {
                const postX = startX + Math.cos(angle) * (i * postSpacing);
                const postY = startY + Math.sin(angle) * (i * postSpacing);

                // Ground contact shadow
                ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
                ctx.beginPath();
                ctx.ellipse(postX + 0.8, postY + 1.2, 2.1, 0.9, 0, 0, Math.PI * 2);
                ctx.fill();

                // Cylindrical post body with lit/shadow sides
                const postGradient = ctx.createLinearGradient(postX - 1.5, postY, postX + 1.5, postY);
                postGradient.addColorStop(0, '#A9784A');
                postGradient.addColorStop(0.45, '#8B6F47');
                postGradient.addColorStop(1, '#5E4020');
                ctx.fillStyle = postGradient;
                ctx.fillRect(postX - 1.4, postY - 11, 2.8, 12);

                ctx.strokeStyle = 'rgba(60, 38, 18, 0.5)';
                ctx.lineWidth = 0.4;
                for (let g = 0; g < 3; g++) {
                    ctx.beginPath();
                    ctx.moveTo(postX - 1.4, postY - 9.5 + (g * 3.5));
                    ctx.lineTo(postX + 1.4, postY - 9 + (g * 3.5));
                    ctx.stroke();
                }

                // Rounded weathered cap
                ctx.fillStyle = '#654321';
                ctx.beginPath();
                ctx.ellipse(postX, postY - 11, 1.6, 1, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'rgba(255,255,255,0.12)';
                ctx.beginPath();
                ctx.ellipse(postX - 0.4, postY - 11.3, 0.7, 0.4, 0, 0, Math.PI * 2);
                ctx.fill();

                // Nail marks where rails meet the post
                ctx.fillStyle = 'rgba(30, 20, 10, 0.6)';
                [-5, -1.5].forEach(railOffset => {
                    ctx.beginPath();
                    ctx.arc(postX, postY + railOffset, 0.35, 0, Math.PI * 2);
                    ctx.fill();
                });
            }
        });
    }

    renderFenceDecorations(ctx, size) {
        // Render trees around fence
        this.fenceDecorations.trees.forEach((tree) => {
            const treeX = this.x + tree.x;
            const treeY = this.y + tree.y;
            const treeSize = tree.size * 15;

            // Ground contact shadow ties the vegetation to the ground plane
            ctx.fillStyle = 'rgba(20, 30, 10, 0.25)';
            ctx.beginPath();
            ctx.ellipse(treeX, treeY + treeSize * 0.05, treeSize * 0.32, treeSize * 0.09, 0, 0, Math.PI * 2);
            ctx.fill();

            if (ctx.level && !this.forceLocalVegetation) {
                ctx.level.renderVegetation(ctx, treeX, treeY, treeSize, tree.gridX, tree.gridY, 0);
            } else {
                this.renderTree(ctx, treeX, treeY, treeSize, tree.gridX, tree.gridY);
            }
        });

        // Render rocks around fence
        this.fenceDecorations.rocks.forEach(rock => {
            const rockX = this.x + rock.x;
            const rockY = this.y + rock.y;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.beginPath();
            ctx.ellipse(rockX + 0.6, rockY + rock.size * 0.5, rock.size * 1.1, rock.size * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();

            const rockGradient = ctx.createRadialGradient(
                rockX - rock.size * 0.3, rockY - rock.size * 0.3, 0,
                rockX, rockY, rock.size
            );
            rockGradient.addColorStop(0, '#8C8C88');
            rockGradient.addColorStop(1, '#54544E');
            ctx.fillStyle = rockGradient;
            ctx.strokeStyle = '#2F2F2F';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.arc(rockX, rockY, rock.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });

        // Render bushes around fence
        this.fenceDecorations.bushes.forEach((bush, index) => {
            const bushX = this.x + bush.x;
            const bushY = this.y + bush.y;
            const scale = bush.size;

            ctx.fillStyle = 'rgba(20, 30, 10, 0.22)';
            ctx.beginPath();
            ctx.ellipse(bushX, bushY + 1.6 * scale, 2.6 * scale, 0.8 * scale, 0, 0, Math.PI * 2);
            ctx.fill();

            if (ctx.level && !this.forceLocalVegetation) {
                ctx.level.renderVegetation(ctx, bushX, bushY, scale * 15, 0, 0, index + 10);
            } else {
                ctx.fillStyle = '#1f6f1f';
                ctx.beginPath();
                ctx.arc(bushX, bushY, 2.5 * scale, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#28a028';
                ctx.beginPath();
                ctx.arc(bushX - 1 * scale, bushY - 1 * scale, 1.75 * scale, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(bushX + 1 * scale, bushY - 1 * scale, 1.75 * scale, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    // Tree rendering methods from LevelBase (adapted for scaled usage)
    renderTree(ctx, x, y, size, gridX, gridY) {
        // Normalize to a non-negative remainder - gridX/gridY here are often negative (fence
        // decorations sit at negative grid offsets), and JS's % keeps the sign of the dividend,
        // so an unguarded `% 4` on a negative sum always misses case 0/1/2 and collapses every
        // negative-offset tree onto the same default type instead of cycling through all four.
        const seed = ((Math.floor(gridX + gridY) % 4) + 4) % 4;
        switch(seed) {
            case 0:
                this.renderTreeType1(ctx, x, y, size);
                break;
            case 1:
                this.renderTreeType2(ctx, x, y, size);
                break;
            case 2:
                this.renderTreeType3(ctx, x, y, size);
                break;
            default:
                this.renderTreeType4(ctx, x, y, size);
        }
    }

    renderTreeType1(ctx, x, y, size) {
        const trunkWidth = size * 0.25;
        const trunkHeight = size * 0.5;
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(x - trunkWidth * 0.5, y, trunkWidth, trunkHeight);
        ctx.fillStyle = '#3E2723';
        ctx.fillRect(x, y, trunkWidth * 0.5, trunkHeight);
        ctx.fillStyle = '#0D3817';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.6);
        ctx.lineTo(x + size * 0.35, y - size * 0.1);
        ctx.lineTo(x - size * 0.35, y - size * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(6, 26, 10, 0.4)';
        ctx.lineWidth = size * 0.02;
        ctx.stroke();
        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.35);
        ctx.lineTo(x + size * 0.3, y + size * 0.05);
        ctx.lineTo(x - size * 0.3, y + size * 0.05);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.15);
        ctx.lineTo(x + size * 0.25, y + size * 0.2);
        ctx.lineTo(x - size * 0.25, y + size * 0.2);
        ctx.closePath();
        ctx.fill();
    }

    renderTreeType2(ctx, x, y, size) {
        const trunkWidth = size * 0.2;
        const trunkHeight = size * 0.4;
        ctx.fillStyle = '#6B4423';
        ctx.fillRect(x - trunkWidth * 0.5, y, trunkWidth, trunkHeight);
        ctx.fillStyle = '#8B5A3C';
        ctx.fillRect(x - trunkWidth * 0.5 + trunkWidth * 0.6, y, trunkWidth * 0.4, trunkHeight);
        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.1, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(6, 26, 10, 0.4)';
        ctx.lineWidth = size * 0.02;
        ctx.stroke();
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.35, size * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#43A047';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.55, size * 0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    renderTreeType3(ctx, x, y, size) {
        // Sparse tree with distinct branches
        const trunkWidth = size * 0.22;
        ctx.fillStyle = '#795548';
        ctx.fillRect(x - trunkWidth * 0.5, y - size * 0.2, trunkWidth, size * 0.6);
        ctx.fillStyle = '#4E342E';
        ctx.beginPath();
        ctx.arc(x + trunkWidth * 0.25, y, trunkWidth * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1B5E20';
        ctx.strokeStyle = 'rgba(6, 26, 10, 0.4)';
        ctx.lineWidth = size * 0.02;
        ctx.beginPath();
        ctx.arc(x - size * 0.28, y - size * 0.35, size * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x + size * 0.28, y - size * 0.3, size * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.55, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    renderTreeType4(ctx, x, y, size) {
        // Pine/Spruce style with layered triangles
        const trunkWidth = size * 0.18;
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x - trunkWidth * 0.5, y - size * 0.05, trunkWidth, size * 0.45);
        ctx.fillStyle = '#0D3817';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.05);
        ctx.lineTo(x + size * 0.38, y + size * 0.15);
        ctx.lineTo(x - size * 0.38, y + size * 0.15);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(6, 26, 10, 0.4)';
        ctx.lineWidth = size * 0.02;
        ctx.stroke();
        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.25);
        ctx.lineTo(x + size * 0.3, y);
        ctx.lineTo(x - size * 0.3, y);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.45);
        ctx.lineTo(x + size * 0.2, y - size * 0.15);
        ctx.lineTo(x - size * 0.2, y - size * 0.15);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#43A047';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.65);
        ctx.lineTo(x + size * 0.12, y - size * 0.35);
        ctx.lineTo(x - size * 0.12, y - size * 0.35);
        ctx.closePath();
        ctx.fill();
    }

    renderHut(ctx, size) {
        const hutX = this.x + this.hut.x;
        const hutY = this.y + this.hut.y;

        // Hut shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(hutX - this.hut.width/2 + 1, hutY + 1, this.hut.width, this.hut.height);

        // Hut main body - wooden walls
        ctx.fillStyle = '#8B6F47';
        ctx.fillRect(hutX - this.hut.width/2, hutY, this.hut.width, this.hut.height);

        // Hut wall outline
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        ctx.strokeRect(hutX - this.hut.width/2, hutY, this.hut.width, this.hut.height);

        // Wooden plank details on walls
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 0.25;
        for (let i = 1; i < 4; i++) {
            const plankY = hutY + (this.hut.height * i / 4);
            ctx.beginPath();
            ctx.moveTo(hutX - this.hut.width/2, plankY);
            ctx.lineTo(hutX + this.hut.width/2, plankY);
            ctx.stroke();
        }

        // Hut door
        const doorWidth = 2.5;
        const doorHeight = 5;
        ctx.fillStyle = '#654321';
        ctx.fillRect(hutX - doorWidth/2, hutY + this.hut.height - doorHeight, doorWidth, doorHeight);

        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 0.25;
        ctx.strokeRect(hutX - doorWidth/2, hutY + this.hut.height - doorHeight, doorWidth, doorHeight);

        // Door handle
        ctx.fillStyle = '#C0C0C0';
        ctx.beginPath();
        ctx.arc(hutX + doorWidth/2 - 0.5, hutY + this.hut.height - doorHeight/2, 0.25, 0, Math.PI * 2);
        ctx.fill();

        // Hut roof - peaked gable
        ctx.fillStyle = '#654321';
        ctx.beginPath();
        ctx.moveTo(hutX - this.hut.width/2, hutY);
        ctx.lineTo(hutX, hutY - 4);
        ctx.lineTo(hutX + this.hut.width/2, hutY);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Roof tiles (simple lines)
        ctx.strokeStyle = '#5D4E37';
        ctx.lineWidth = 0.25;
        for (let i = 0; i < 3; i++) {
            const roofY = hutY - (4 * (i + 1) / 3);
            ctx.beginPath();
            ctx.moveTo(hutX - this.hut.width/2 + (i * 1), roofY);
            ctx.lineTo(hutX + this.hut.width/2 - (i * 1), roofY);
            ctx.stroke();
        }

        // Small window
        ctx.fillStyle = '#4169E1';
        ctx.fillRect(hutX - 1.5, hutY + 2, 1.5, 1.5);
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 0.25;
        ctx.strokeRect(hutX - 1.5, hutY + 2, 1.5, 1.5);
    }

    /** Strategy A piece: supply barrels/crates INSIDE the fence (mirrors the hut corner and
     * tucks into the open corners by the sword ring) so props read as part of the yard rather
     * than scattered loose in the surrounding field. */
    renderYardProps(ctx) {
        this.yardProps.barrels.forEach(barrel => {
            const barrelX = this.x + barrel.x;
            const barrelY = this.y + barrel.y;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.ellipse(barrelX, barrelY + 2.2, 2.8, 1, 0, 0, Math.PI * 2);
            ctx.fill();

            const barrelGradient = ctx.createLinearGradient(barrelX - 2.5, barrelY, barrelX + 2.5, barrelY);
            barrelGradient.addColorStop(0, '#A5652E');
            barrelGradient.addColorStop(0.5, '#8B4513');
            barrelGradient.addColorStop(1, '#5C2E0C');
            ctx.fillStyle = barrelGradient;
            ctx.fillRect(barrelX - 2.5, barrelY - 5, 5, 6.5);

            ctx.strokeStyle = '#3E2712';
            ctx.lineWidth = 0.75;
            ctx.strokeRect(barrelX - 2.5, barrelY - 5, 5, 6.5);

            ctx.beginPath();
            ctx.moveTo(barrelX - 2.5, barrelY - 3);
            ctx.lineTo(barrelX + 2.5, barrelY - 3);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(barrelX - 2.5, barrelY - 1);
            ctx.lineTo(barrelX + 2.5, barrelY - 1);
            ctx.stroke();
        });

        this.yardProps.crates.forEach(crate => {
            const cx = this.x + crate.x;
            const cy = this.y + crate.y;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
            ctx.beginPath();
            ctx.ellipse(cx, cy + 2.6, 3.4, 1.1, 0, 0, Math.PI * 2);
            ctx.fill();

            const crateGradient = ctx.createLinearGradient(cx - 3, cy, cx + 3, cy);
            crateGradient.addColorStop(0, '#B98A4E');
            crateGradient.addColorStop(0.5, '#96652F');
            crateGradient.addColorStop(1, '#6B4420');
            ctx.fillStyle = crateGradient;
            ctx.fillRect(cx - 3, cy - 5.5, 6, 6);

            ctx.strokeStyle = '#4A2F16';
            ctx.lineWidth = 0.7;
            ctx.strokeRect(cx - 3, cy - 5.5, 6, 6);

            ctx.lineWidth = 0.4;
            ctx.beginPath();
            ctx.moveTo(cx - 3, cy - 5.5);
            ctx.lineTo(cx + 3, cy + 0.5);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx + 3, cy - 5.5);
            ctx.lineTo(cx - 3, cy + 0.5);
            ctx.stroke();

            ctx.strokeStyle = '#C0A050';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(cx - 3, cy - 2.5);
            ctx.lineTo(cx + 3, cy - 2.5);
            ctx.stroke();
        });
    }

    /** Strategy A piece: archery targets - fully static, no animation. */
    renderArcherLaneTargets(ctx, lane) {
        // Render targets in a row - EVENLY SPACED
        lane.targets.forEach((target) => {
            const targetX = this.x + target.x;
            const targetY = this.y + lane.groundY - target.distance;

            ctx.save();
            ctx.translate(targetX, targetY);

            // Ground shadow anchors the target to the lane
            ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            ctx.beginPath();
            ctx.ellipse(0.6, 10.8, 3.2, 1.1, 0, 0, Math.PI * 2);
            ctx.fill();

            // Rear support struts for a stable tripod stance
            ctx.strokeStyle = '#5D4E37';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-0.75, 8);
            ctx.lineTo(-4.5, 10.5);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0.75, 8);
            ctx.lineTo(4.5, 10.5);
            ctx.stroke();

            // Post with cylindrical shading
            const postGradient = ctx.createLinearGradient(-0.75, 0, 0.75, 0);
            postGradient.addColorStop(0, '#8A6238');
            postGradient.addColorStop(0.5, '#654321');
            postGradient.addColorStop(1, '#432D16');
            ctx.fillStyle = postGradient;
            ctx.fillRect(-0.75, 0, 1.5, 10);

            ctx.fillStyle = '#4A3218';
            ctx.fillRect(-2, 10, 4, 1);

            // Straw target face - base disc with a clipped radial fiber texture
            ctx.fillStyle = 'rgba(0,0,0,0.18)';
            ctx.beginPath();
            ctx.arc(0.4, 0.4, 6.2, 0, Math.PI * 2);
            ctx.fill();

            ctx.save();
            ctx.beginPath();
            ctx.arc(0, 0, 6, 0, Math.PI * 2);
            ctx.clip();
            ctx.fillStyle = '#D9C388';
            ctx.fillRect(-6, -6, 12, 12);

            ctx.strokeStyle = 'rgba(120, 95, 50, 0.35)';
            ctx.lineWidth = 0.35;
            for (let i = 0; i < 26; i++) {
                const a = (i / 26) * Math.PI * 2;
                const r1 = 1 + (i % 3);
                ctx.beginPath();
                ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
                ctx.lineTo(Math.cos(a) * 6, Math.sin(a) * 6);
                ctx.stroke();
            }
            ctx.restore();

            const rings = [
                { radius: 5.5, colorA: '#F1495B', colorB: '#A80F22' },
                { radius: 3.7, colorA: '#FFE066', colorB: '#D4A017' },
                { radius: 2, colorA: '#F1495B', colorB: '#A80F22' },
                { radius: 0.8, colorA: '#FFE066', colorB: '#D4A017' }
            ];

            rings.forEach(ring => {
                const ringGradient = ctx.createRadialGradient(-ring.radius * 0.3, -ring.radius * 0.3, 0, 0, 0, ring.radius);
                ringGradient.addColorStop(0, ring.colorA);
                ringGradient.addColorStop(1, ring.colorB);
                ctx.fillStyle = ringGradient;
                ctx.beginPath();
                ctx.arc(0, 0, ring.radius, 0, Math.PI * 2);
                ctx.fill();
            });

            // Frayed straw edge
            ctx.strokeStyle = '#B89A5E';
            ctx.lineWidth = 0.6;
            for (let i = 0; i < 24; i++) {
                const a = (i / 24) * Math.PI * 2;
                const fx = Math.cos(a) * 6;
                const fy = Math.sin(a) * 6;
                ctx.beginPath();
                ctx.moveTo(fx, fy);
                ctx.lineTo(fx + Math.cos(a) * 0.8, fy + Math.sin(a) * 0.8);
                ctx.stroke();
            }

            ctx.strokeStyle = '#5A3E1B';
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.arc(0, 0, 6, 0, Math.PI * 2);
            ctx.stroke();

            ctx.restore();
        });
    }

    /** Strategy B piece: archers - bow draw-back animation, not bakeable. */
    renderArcherLaneArchers(ctx, lane, isLeftLane) {
        lane.archers.forEach(archer => {
            ctx.save();
            ctx.translate(this.x + archer.x, this.y + archer.y);

            // Mirror archers on right side
            if (!isLeftLane) {
                ctx.scale(-1, 1);
            }

            // Archer shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.ellipse(0.5, 1.8, 2.3, 0.8, 0, 0, Math.PI * 2);
            ctx.fill();

            // Boots
            ctx.fillStyle = '#3B2A1A';
            ctx.fillRect(-2.1, 0.6, 1.6, 1.6);
            ctx.fillRect(0.5, 0.6, 1.6, 1.6);

            // Legs
            ctx.fillStyle = '#3E4A2A';
            ctx.fillRect(-1.8, -1.5, 1.4, 2.4);
            ctx.fillRect(0.4, -1.5, 1.4, 2.4);

            // Tunic (gradient for volume, tapered waist)
            const tunicGradient = ctx.createLinearGradient(-2.6, -6.5, 2.6, -6.5);
            tunicGradient.addColorStop(0, '#3C6B22');
            tunicGradient.addColorStop(0.5, '#2D5016');
            tunicGradient.addColorStop(1, '#1E3A0E');
            ctx.fillStyle = tunicGradient;
            ctx.beginPath();
            ctx.moveTo(-2.4, -6.6);
            ctx.lineTo(2.4, -6.6);
            ctx.lineTo(2.9, -0.4);
            ctx.lineTo(-2.9, -0.4);
            ctx.closePath();
            ctx.fill();

            // Belt
            ctx.fillStyle = '#4A3218';
            ctx.fillRect(-2.6, -1.6, 5.2, 1);
            ctx.fillStyle = '#C0A050';
            ctx.fillRect(-0.4, -1.5, 0.8, 0.8);

            // Chest strap for quiver
            ctx.strokeStyle = '#5C3B1E';
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(-2, -6.4);
            ctx.lineTo(1.8, -2);
            ctx.stroke();

            // Quiver on back with fletching peeking out
            ctx.save();
            ctx.translate(-2.6, -7);
            ctx.rotate(-0.25);
            ctx.fillStyle = '#5C3B1E';
            ctx.fillRect(-1, 0, 2, 5.5);
            ctx.strokeStyle = '#3B2410';
            ctx.lineWidth = 0.3;
            ctx.strokeRect(-1, 0, 2, 5.5);
            const fletchColors = ['#C0392B', '#D4AC0D', '#2E7D32'];
            fletchColors.forEach((c, i) => {
                ctx.strokeStyle = c;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(-0.6 + i * 0.6, 0.3);
                ctx.lineTo(-1 + i * 0.6, -1.6);
                ctx.stroke();
            });
            ctx.restore();

            // Neck
            ctx.fillStyle = '#C9A98A';
            ctx.fillRect(-0.7, -7, 1.4, 1.2);

            // Archer head
            ctx.fillStyle = '#DDBEA9';
            ctx.beginPath();
            ctx.arc(0, -7.7, 1.7, 0, Math.PI * 2);
            ctx.fill();

            // Jaw shading
            ctx.fillStyle = 'rgba(150, 110, 80, 0.35)';
            ctx.beginPath();
            ctx.arc(0.3, -6.9, 1.1, 0, Math.PI);
            ctx.fill();

            // Hair fringe
            ctx.fillStyle = '#5C3A1E';
            ctx.beginPath();
            ctx.arc(0, -8, 1.75, Math.PI * 1.05, Math.PI * 1.95);
            ctx.fill();

            // Archer hood/cap
            ctx.fillStyle = '#3E4A2A';
            ctx.beginPath();
            ctx.arc(0, -8, 2, Math.PI, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#1E2A12';
            ctx.lineWidth = 0.3;
            ctx.stroke();

            // Bow - continuous recurve limbs (belly bulge + tip flare) meeting at a proper
            // riser/grip, with the string running tip-to-tip through the draw hand for a more
            // realistic silhouette than a single flat arc per limb.
            const bowX = 2.5;
            const bowDrawAmount = archer.drawback * 2;
            const tipTopX = bowX + 1.7, tipTopY = -9.4;
            const tipBotX = bowX + 1.7, tipBotY = -0.6;

            const bowGradient = ctx.createLinearGradient(bowX, tipTopY, bowX, tipBotY);
            bowGradient.addColorStop(0, '#A9782E');
            bowGradient.addColorStop(0.5, '#8B6914');
            bowGradient.addColorStop(1, '#6B4E0E');
            ctx.strokeStyle = bowGradient;
            ctx.lineWidth = 1.1;
            ctx.lineCap = 'round';

            // Upper limb: grip -> outward belly bulge -> recurve tip flare
            ctx.beginPath();
            ctx.moveTo(bowX, -5);
            ctx.quadraticCurveTo(bowX + 2.6, -7.1, bowX + 1.85, -8.7);
            ctx.quadraticCurveTo(bowX + 1.3, -9.3, tipTopX, tipTopY);
            ctx.stroke();

            // Lower limb (mirrored)
            ctx.beginPath();
            ctx.moveTo(bowX, -5);
            ctx.quadraticCurveTo(bowX + 2.6, -2.9, bowX + 1.85, -1.3);
            ctx.quadraticCurveTo(bowX + 1.3, -0.7, tipBotX, tipBotY);
            ctx.stroke();

            // Nock notches at the tips where the string is strung
            ctx.strokeStyle = '#3B2410';
            ctx.lineWidth = 0.35;
            ctx.beginPath();
            ctx.moveTo(tipTopX - 0.4, tipTopY + 0.25);
            ctx.lineTo(tipTopX + 0.35, tipTopY - 0.25);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(tipBotX - 0.4, tipBotY - 0.25);
            ctx.lineTo(tipBotX + 0.35, tipBotY + 0.25);
            ctx.stroke();

            // Bow grip wrap (riser) - thicker handle section between the limbs
            ctx.fillStyle = '#4A3218';
            ctx.beginPath();
            ctx.ellipse(bowX - 0.1, -5, 0.5, 1.3, 0.1, 0, Math.PI * 2);
            ctx.fill();

            // Bowstring - taut from tip nock to tip nock via the draw hand
            ctx.strokeStyle = '#E8DCC0';
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(tipTopX, tipTopY);
            ctx.lineTo(bowX - bowDrawAmount, -5);
            ctx.lineTo(tipBotX, tipBotY);
            ctx.stroke();

            // Drawing arm (shoulder to string hand) and bow arm (shoulder to grip)
            ctx.strokeStyle = '#DDBEA9';
            ctx.lineWidth = 1.1;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(1, -6.3);
            ctx.lineTo(bowX - bowDrawAmount, -5);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(1, -6.3);
            ctx.lineTo(bowX, -5);
            ctx.stroke();

            // Arrow nocked
            if (archer.drawback > 0.3) {
                ctx.strokeStyle = '#8B4513';
                ctx.lineWidth = 0.7;
                ctx.beginPath();
                ctx.moveTo(bowX - bowDrawAmount, -5);
                ctx.lineTo(bowX - bowDrawAmount - 4, -5);
                ctx.stroke();

                ctx.strokeStyle = '#C0392B';
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(bowX - bowDrawAmount - 0.5, -5.4);
                ctx.lineTo(bowX - bowDrawAmount - 1.6, -5.7);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(bowX - bowDrawAmount - 0.5, -4.6);
                ctx.lineTo(bowX - bowDrawAmount - 1.6, -4.3);
                ctx.stroke();

                ctx.fillStyle = '#B0B0B0';
                ctx.beginPath();
                ctx.moveTo(bowX - bowDrawAmount - 4, -5);
                ctx.lineTo(bowX - bowDrawAmount - 5.2, -4.2);
                ctx.lineTo(bowX - bowDrawAmount - 5.2, -5.8);
                ctx.closePath();
                ctx.fill();
            }

            ctx.restore();
        });
    }

    renderSwordFightArea(ctx, size) {
        // Render duel circles with proper spacing
        this.swordFightArea.duelCircles.forEach((circle) => {
            // Ground shadow for the duel ring
            ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
            ctx.beginPath();
            ctx.ellipse(this.x + circle.x, this.y + circle.y + 1, 8, 3.4, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = 'rgba(139, 69, 19, 0.35)';
            ctx.lineWidth = 0.6;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(this.x + circle.x, this.y + circle.y, 8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        });

        // Render fighters bigger and closer together than their base circleIdx spacing so they
        // read as actually dueling rather than two isolated figures standing apart.
        const fighterScale = 1.3;
        const closeness = 0.7;
        const bladeTips = [];

        this.swordFightArea.fighters.forEach(fighter => {
            const circle = this.swordFightArea.duelCircles[fighter.circleIdx];
            const fighterX = this.x + circle.x + fighter.x * closeness;
            const fighterY = this.y + circle.y + fighter.y;

            ctx.save();
            ctx.translate(fighterX, fighterY);
            ctx.scale(fighterScale, fighterScale);

            // Fighter shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.ellipse(0, 3.2, 2.5, 0.8, 0, 0, Math.PI * 2);
            ctx.fill();

            const stanceShift = fighter.stance * 1.3;

            // Boots
            ctx.fillStyle = '#2B2B2B';
            ctx.beginPath();
            ctx.ellipse(-0.7 + stanceShift, 3.1, 1, 0.7, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(0.7 - stanceShift, 3.1, 1, 0.7, 0, 0, Math.PI * 2);
            ctx.fill();

            // Legs
            ctx.strokeStyle = '#2F2F2F';
            ctx.lineWidth = 1.4;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-0.8, 1.4);
            ctx.lineTo(-0.7 + stanceShift, 3);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0.8, 1.4);
            ctx.lineTo(0.7 - stanceShift, 3);
            ctx.stroke();

            // Fighter tunic underlayer
            ctx.fillStyle = fighter.color;
            ctx.beginPath();
            ctx.moveTo(-2.7, -8);
            ctx.lineTo(2.7, -8);
            ctx.lineTo(3.2, 1.5);
            ctx.lineTo(-3.2, 1.5);
            ctx.closePath();
            ctx.fill();

            // Fighter armor with gradient shading + rim highlight
            const armorGradient = ctx.createLinearGradient(-2.3, -6.5, 2.3, -1.2);
            armorGradient.addColorStop(0, '#8C8C8C');
            armorGradient.addColorStop(0.5, '#696969');
            armorGradient.addColorStop(1, '#454545');
            ctx.fillStyle = armorGradient;
            ctx.fillRect(-2.3, -6.5, 4.6, 5.3);
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.fillRect(-2.3, -6.5, 1.1, 5.3);

            ctx.strokeStyle = '#2F2F2F';
            ctx.lineWidth = 0.3;
            ctx.strokeRect(-2.3, -6.5, 4.6, 5.3);

            // Belt
            ctx.fillStyle = '#3B2410';
            ctx.fillRect(-2.4, -1.6, 4.8, 0.9);

            // Neck
            ctx.fillStyle = '#C9A98A';
            ctx.fillRect(-0.7, -9, 1.4, 1.3);

            // Fighter head
            ctx.fillStyle = '#DDBEA9';
            ctx.beginPath();
            ctx.arc(0, -8.5, 1.6, 0, Math.PI * 2);
            ctx.fill();

            // Fighter helmet with cheek guards and a small plume
            ctx.fillStyle = '#696969';
            ctx.beginPath();
            ctx.arc(0, -8.8, 1.95, Math.PI, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(-1.95, -8.8, 0.6, 1.7);
            ctx.fillRect(1.35, -8.8, 0.6, 1.7);
            ctx.fillStyle = fighter.color;
            ctx.beginPath();
            ctx.moveTo(0, -10.7);
            ctx.lineTo(0.6, -8.6);
            ctx.lineTo(-0.6, -8.6);
            ctx.closePath();
            ctx.fill();

            // Shield
            const shieldX = fighter.direction > 0 ? -3.2 : 3.2;
            const shieldGradient = ctx.createRadialGradient(shieldX - 0.6, -4.6, 0, shieldX, -4, 2);
            shieldGradient.addColorStop(0, '#E0A868');
            shieldGradient.addColorStop(1, '#B5793A');
            ctx.fillStyle = shieldGradient;
            ctx.beginPath();
            ctx.arc(shieldX, -4, 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.arc(shieldX, -4, 2, 0, Math.PI * 2);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 0.3;
            ctx.beginPath();
            ctx.arc(shieldX, -4, 1.5, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = '#DC143C';
            ctx.beginPath();
            ctx.arc(shieldX, -4, 0.8, 0, Math.PI * 2);
            ctx.fill();

            // Sword arm + blade with swing
            const swordX = fighter.direction > 0 ? 2.7 : -2.7;
            const swingAmount = fighter.swingAngle * fighter.direction;
            const tipX = swordX + (swingAmount * 3.3);
            const tipY = -5 - 5 + (Math.abs(swingAmount) * 2);

            ctx.strokeStyle = '#DDBEA9';
            ctx.lineWidth = 1.1;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(swordX * 0.5, -6.4);
            ctx.lineTo(swordX, -5);
            ctx.stroke();

            ctx.strokeStyle = '#D8D8D8';
            ctx.lineWidth = 1.3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(swordX, -5);
            ctx.lineTo(tipX, tipY);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(255,255,255,0.5)';
            ctx.lineWidth = 0.4;
            ctx.beginPath();
            ctx.moveTo(swordX, -5);
            ctx.lineTo(tipX, tipY);
            ctx.stroke();

            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(swordX, -5, 1, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#808080';
            ctx.beginPath();
            ctx.moveTo(tipX, tipY);
            ctx.lineTo(tipX + 0.7, tipY - 1.3);
            ctx.lineTo(tipX - 0.7, tipY - 1.3);
            ctx.closePath();
            ctx.fill();

            ctx.restore();

            // World-space blade-tip position (no rotation involved, just the translate+scale
            // already applied above) - used below to spark a clash where two blades meet.
            bladeTips.push({ circleIdx: fighter.circleIdx, x: fighterX + tipX * fighterScale, y: fighterY + tipY * fighterScale });
        });

        // Clash spark where two fighters' blades actually meet mid-swing
        this.swordFightArea.duelCircles.forEach((circle, circleIdx) => {
            const tips = bladeTips.filter(t => t.circleIdx === circleIdx);
            if (tips.length !== 2) return;
            const dx = tips[0].x - tips[1].x;
            const dy = tips[0].y - tips[1].y;
            const dist = Math.hypot(dx, dy);
            if (dist >= 5) return;

            const mx = (tips[0].x + tips[1].x) / 2;
            const my = (tips[0].y + tips[1].y) / 2;
            const intensity = 1 - dist / 5;
            ctx.strokeStyle = `rgba(255, 250, 220, ${0.8 * intensity})`;
            ctx.lineWidth = 0.6;
            for (let i = 0; i < 4; i++) {
                const a = (i / 4) * Math.PI * 2 + circleIdx;
                const len = 1.6 * intensity;
                ctx.beginPath();
                ctx.moveTo(mx, my);
                ctx.lineTo(mx + Math.cos(a) * len, my + Math.sin(a) * len);
                ctx.stroke();
            }
        });
    }

    /** Strategy B piece: training dummies - post-hit wobble is continuous per-instance state, not bakeable. */
    /** Proportioned to roughly match the archer/fighter human silhouettes (~11-12 units tall) plus
     * a short post to stand on - the original numbers here made these nearly 4x taller than a
     * human character, which read as a giant scarecrow rather than a training dummy. */
    renderDummies(ctx, size) {
        this.dummies.forEach(dummy => {
            const x = this.x + dummy.x;
            const y = this.y + dummy.y;

            ctx.save();
            ctx.translate(x, y);

            // Ground shadow - short stake driven straight into the ground right under the torso,
            // not a tall pole (the earlier long post put its base down next to the duel fighters).
            ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            ctx.beginPath();
            ctx.ellipse(0.4, 4, 2.3, 0.7, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.rotate(dummy.rotation + dummy.wobble);

            // Dummy post/stand with cylindrical shading
            const postGradient = ctx.createLinearGradient(-0.75, 0, 0.75, 0);
            postGradient.addColorStop(0, '#8A6238');
            postGradient.addColorStop(0.5, '#654321');
            postGradient.addColorStop(1, '#40290F');
            ctx.fillStyle = postGradient;
            ctx.fillRect(-0.75, 0, 1.5, 3);

            ctx.fillStyle = '#3F2C14';
            ctx.fillRect(-2, 3, 4, 1);

            // Rope binding at the neck
            ctx.strokeStyle = '#C0A050';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(-2, -3.3);
            ctx.lineTo(2, -3);
            ctx.stroke();

            // Head - straw sack
            const headGradient = ctx.createRadialGradient(-0.6, -8.5, 0, 0, -8, 2);
            headGradient.addColorStop(0, '#B79161');
            headGradient.addColorStop(1, '#7A5A34');
            ctx.fillStyle = headGradient;
            ctx.beginPath();
            ctx.arc(0, -8, 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 0.4;
            ctx.beginPath();
            ctx.arc(0, -8, 2, 0, Math.PI * 2);
            ctx.stroke();

            // Crude stitched face for character
            ctx.strokeStyle = 'rgba(60, 40, 20, 0.6)';
            ctx.lineWidth = 0.25;
            ctx.beginPath();
            ctx.moveTo(-0.75, -8.75); ctx.lineTo(-0.25, -8.25);
            ctx.moveTo(-0.75, -8.25); ctx.lineTo(-0.25, -8.75);
            ctx.moveTo(0.25, -8.75); ctx.lineTo(0.75, -8.25);
            ctx.moveTo(0.25, -8.25); ctx.lineTo(0.75, -8.75);
            ctx.stroke();

            // Torso - straw-stuffed sack with gradient + seams
            const torsoGradient = ctx.createLinearGradient(-2, 0, 2, 0);
            torsoGradient.addColorStop(0, '#C08650');
            torsoGradient.addColorStop(0.5, '#A0522D');
            torsoGradient.addColorStop(1, '#703A1C');
            ctx.fillStyle = torsoGradient;
            ctx.fillRect(-2, -5, 4, 4.5);

            ctx.strokeStyle = '#5C3418';
            ctx.lineWidth = 0.4;
            ctx.beginPath();
            ctx.moveTo(-2, -3.5);
            ctx.lineTo(2, -3.5);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(-2, -2);
            ctx.lineTo(2, -2);
            ctx.stroke();

            ctx.strokeStyle = '#8B6F47';
            ctx.lineWidth = 1.1;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-2, -3.5);
            ctx.lineTo(-4.25, -2.5);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(2, -3.5);
            ctx.lineTo(4.25, -2.5);
            ctx.stroke();

            // Battle-worn hit marks
            ctx.fillStyle = 'rgba(80, 40, 0, 0.5)';
            ctx.beginPath();
            ctx.arc(-0.65, -2.5, 0.65, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(1, -1.25, 0.5, 0, Math.PI * 2);
            ctx.fill();

            // Fresh gashes/splinters from repeated strikes
            ctx.strokeStyle = 'rgba(240, 230, 210, 0.5)';
            ctx.lineWidth = 0.25;
            ctx.beginPath();
            ctx.moveTo(-1, -4.25); ctx.lineTo(-0.25, -3.8);
            ctx.moveTo(0.5, -3); ctx.lineTo(1.3, -2.6);
            ctx.stroke();

            // Waist rope binding, matching the neck rope
            ctx.strokeStyle = '#C0A050';
            ctx.lineWidth = 0.45;
            ctx.beginPath();
            ctx.moveTo(-2, -1);
            ctx.lineTo(2, -0.8);
            ctx.stroke();

            // Patched burlap square - a mended tear from heavy use
            ctx.fillStyle = '#8A5F38';
            ctx.fillRect(-1.6, -3.15, 1.1, 1);
            ctx.strokeStyle = 'rgba(60, 40, 20, 0.7)';
            ctx.lineWidth = 0.2;
            ctx.setLineDash([0.3, 0.3]);
            ctx.strokeRect(-1.6, -3.15, 1.1, 1);
            ctx.setLineDash([]);

            // Loose straw wisps poking out at the seams for texture
            ctx.strokeStyle = 'rgba(210, 180, 120, 0.7)';
            ctx.lineWidth = 0.2;
            ctx.beginPath();
            ctx.moveTo(-2, -4.5); ctx.lineTo(-2.5, -4.9);
            ctx.moveTo(2, -4.25); ctx.lineTo(2.5, -4.7);
            ctx.moveTo(-1.75, -0.5); ctx.lineTo(-2.3, -0.3);
            ctx.moveTo(1.75, -0.4); ctx.lineTo(2.3, -0.15);
            ctx.stroke();

            ctx.restore();
        });
    }

    /** Strategy B piece: recruits practicing on the dummies - swing animation drives the dummy hit reaction. */
    renderDummyTrainees(ctx) {
        this.dummyTrainees.forEach(trainee => {
            const dummy = this.dummies[trainee.dummyIdx];
            const tx = this.x + dummy.x + trainee.offsetX;
            // Pulled up (away from the sword-duel circles below) so the recruit doesn't stand
            // inside the duelists' space - the dummies/duel circles are close together on this layout.
            const ty = this.y + dummy.y - 2;

            ctx.save();
            ctx.translate(tx, ty);
            if (trainee.offsetX > 0) ctx.scale(-1, 1);

            // Shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.ellipse(0, 1.6, 2.1, 0.7, 0, 0, Math.PI * 2);
            ctx.fill();

            // Legs
            ctx.strokeStyle = '#2F2F2F';
            ctx.lineWidth = 1.2;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-0.8, -0.5);
            ctx.lineTo(-1.3, 1.4);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0.8, -0.5);
            ctx.lineTo(1.1, 1.4);
            ctx.stroke();

            // Tunic
            const tunicGradient = ctx.createLinearGradient(-2.4, -7, 2.4, -7);
            tunicGradient.addColorStop(0, '#6E5236');
            tunicGradient.addColorStop(0.5, trainee.color);
            tunicGradient.addColorStop(1, '#2B2015');
            ctx.fillStyle = tunicGradient;
            ctx.beginPath();
            ctx.moveTo(-2.2, -7);
            ctx.lineTo(2.2, -7);
            ctx.lineTo(2.6, -0.5);
            ctx.lineTo(-2.6, -0.5);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#3B2410';
            ctx.fillRect(-2.4, -1.6, 4.8, 0.8);

            // Head
            ctx.fillStyle = '#DDBEA9';
            ctx.beginPath();
            ctx.arc(0, -7.7, 1.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#4A3218';
            ctx.beginPath();
            ctx.arc(0, -8.4, 1.6, Math.PI * 1.05, Math.PI * 1.95);
            ctx.fill();

            // Off arm
            ctx.strokeStyle = '#DDBEA9';
            ctx.lineWidth = 1;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-1.4, -6.2);
            ctx.lineTo(-2.6, -3.6);
            ctx.stroke();

            // Striking arm + wooden training sword, swings toward the dummy
            const swing = trainee.swingAngle;
            const shoulderX = 1.4;
            const shoulderY = -6.2;
            const strikeDir = swing * 0.9 - 0.6;
            const handX = shoulderX + Math.cos(strikeDir) * 3.2;
            const handY = shoulderY + Math.sin(strikeDir) * 3.2 - 1;
            const tipX = handX + Math.cos(strikeDir) * 3.5;
            const tipY = handY + Math.sin(strikeDir) * 3.5;

            ctx.strokeStyle = '#DDBEA9';
            ctx.lineWidth = 1;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(shoulderX, shoulderY);
            ctx.lineTo(handX, handY);
            ctx.stroke();

            ctx.strokeStyle = '#8B6F47';
            ctx.lineWidth = 1.4;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(handX, handY);
            ctx.lineTo(tipX, tipY);
            ctx.stroke();

            ctx.restore();
        });
    }

    renderParticles(ctx) {
        // Render training particles (arrows, dust and wood chips)
        this.trainingParticles.forEach(particle => {
            const alpha = particle.life / particle.maxLife;

            if (particle.type === 'arrow') {
                ctx.save();
                ctx.translate(particle.x, particle.y);
                const arrowAngle = Math.atan2(particle.vy, particle.vx);
                ctx.rotate(arrowAngle);
                ctx.scale(particle.renderScale || 1, particle.renderScale || 1);

                ctx.strokeStyle = `rgba(139, 69, 19, ${alpha})`;
                ctx.lineWidth = 0.75;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(5, 0);
                ctx.stroke();

                ctx.fillStyle = `rgba(192, 192, 192, ${alpha})`;
                ctx.beginPath();
                ctx.moveTo(5, 0);
                ctx.lineTo(6, -0.75);
                ctx.lineTo(6, 0.75);
                ctx.closePath();
                ctx.fill();

                ctx.strokeStyle = `rgba(220, 20, 60, ${alpha})`;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(0, -0.5);
                ctx.lineTo(-2, -1);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0, 0.5);
                ctx.lineTo(-2, 1);
                ctx.stroke();

                ctx.restore();
            } else if (particle.type === 'dust') {
                ctx.fillStyle = `rgba(160, 100, 50, ${alpha * 0.4})`;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = `rgba(200, 150, 100, ${alpha * 0.2})`;
                ctx.beginPath();
                ctx.arc(particle.x - particle.size * 0.3, particle.y - particle.size * 0.3, particle.size * 0.4, 0, Math.PI * 2);
                ctx.fill();
            } else if (particle.type === 'chip') {
                ctx.save();
                ctx.translate(particle.x, particle.y);
                const chipAngle = Math.atan2(particle.vy, particle.vx);
                ctx.rotate(chipAngle);
                ctx.fillStyle = `rgba(184, 148, 98, ${alpha})`;
                ctx.beginPath();
                ctx.moveTo(-particle.size, 0);
                ctx.lineTo(particle.size, -particle.size * 0.4);
                ctx.lineTo(particle.size, particle.size * 0.4);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }
        });

        // Transient impact sparks - arrows striking targets, weapons striking dummies
        this.impactEffects.forEach(fx => {
            const alpha = Math.max(0, fx.life / fx.maxLife);
            ctx.save();
            ctx.translate(fx.x, fx.y);
            ctx.strokeStyle = `rgba(255, 240, 200, ${alpha * 0.9})`;
            ctx.lineWidth = 0.8;
            for (let i = 0; i < 5; i++) {
                const a = (i / 5) * Math.PI * 2;
                const len = 2.2 * alpha + 0.6;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
                ctx.stroke();
            }
            ctx.restore();
        });
    }

    onClick() {
        this.isSelected = true;
        return {
            type: 'training_menu',
            trainingGrounds: this,
            upgrades: this.getUpgradeOptions(),
            trainingUpgrade: this.getTrainingLevelUpgradeOption()
        };
    }

    getUpgradeOptions() {
        const options = [];

        // Tower upgrade definitions in hotkey order (Q/W/E/R/T = basic/barricade/archer/poison/cannon)
        // to match Tower Forge's upgrade ordering. Each entry is either a 'range' upgrade
        // (manned towers) or a 'fireRate' upgrade (barricade/poison).
        const towerUpgradeOrder = [
            { kind: 'range', id: 'basicTower', registryId: 'basic', name: 'Watch Tower', icon: '<img src="assets/towers/basic.png" class="upgrade-tower-icon">' },
            {
                kind: 'fireRate', id: 'barricadeFireRate', registryId: 'barricade',
                name: 'Barricade Tower Fire Rate Training',
                description: `Increase Barricade Tower barrel rolling speed (0.33 → 0.83 at level 5)`,
                icon: '<img src="assets/towers/barricade.png" class="upgrade-tower-icon">'
            },
            { kind: 'range', id: 'archerTower', registryId: 'archer', name: 'Archer Tower', icon: '<img src="assets/towers/archer.png" class="upgrade-tower-icon">' },
            {
                kind: 'fireRate', id: 'poisonArcherTowerFireRate', registryId: 'poison',
                name: 'Poison Archer Tower Fire Rate Training',
                description: `Increase Poison Archer Tower fire rate (0.25 → 0.50 per second at level 5)`,
                icon: '<img src="assets/towers/poison.png" class="upgrade-tower-icon">'
            },
            { kind: 'range', id: 'cannonTower', registryId: 'cannon', name: 'Trebuchet Tower', icon: '<img src="assets/towers/cannon.png" class="upgrade-tower-icon">' }
        ];

        towerUpgradeOrder.forEach(entry => {
            // Only show the upgrade if the tower is unlocked
            const isTowerUnlocked = this.unlockSystem && this.unlockSystem.unlockedTowers.has(entry.registryId);
            if (!isTowerUnlocked) {
                return;
            }

            if (entry.kind === 'range') {
                const upgrade = this.rangeUpgrades[entry.id];
                const isUnlocked = this.trainingLevel > upgrade.level;

                options.push({
                    id: `range_${entry.id}`,
                    towerType: entry.id,
                    name: `${entry.name} Range Training`,
                    description: `Increase ${entry.name} range by ${upgrade.effect} per level`,
                    level: upgrade.level,
                    maxLevel: upgrade.maxLevel,
                    baseCost: upgrade.baseCost,
                    cost: this.calculateRangeUpgradeCost(entry.id),
                    icon: entry.icon,
                    isUnlocked: isUnlocked
                });
            } else {
                const upgrade = this.upgrades[entry.id];
                const isUnlocked = this.trainingLevel > upgrade.level;

                options.push({
                    id: entry.id,
                    name: entry.name,
                    description: entry.description,
                    level: upgrade.level,
                    maxLevel: upgrade.maxLevel,
                    baseCost: upgrade.baseCost,
                    cost: this.calculateUpgradeCost(entry.id),
                    icon: entry.icon,
                    isUnlocked: isUnlocked
                });
            }
        });

        return options;
    }

    getTrainingLevelUpgradeOption() {
        // Always return training upgrade info, even when maxed
        const isMaxed = this.trainingLevel >= this.maxTrainingLevel;
        const nextLevel = isMaxed ? this.trainingLevel : this.trainingLevel + 1;
        let description = "Upgrade the training grounds to unlock the next range training level for manned towers and unlock elite units.";
        let nextUnlock = "";

        if (isMaxed) {
            nextUnlock = "MAX LEVEL - All available upgrades unlocked!\nCastle Defender Level 3 Unlocked";
        } else {
            switch(nextLevel) {
                case 2:
                    nextUnlock = "Unlocks: Range Level 1 Upgrades for all manned towers";
                    break;
                case 3:
                    nextUnlock = "Unlocks: Range Level 2 Upgrades for all manned towers\nCastle Defender Level 1 Unlocked (hire elite knights)";
                    break;
                case 4:
                    nextUnlock = "Unlocks: Range Level 3 Upgrades for all manned towers\nCastle Defender Level 2 Unlocked (medium armor)";
                    break;
                case 5:
                    nextUnlock = "Unlocks: Range Level 4 Upgrades for all manned towers\nCastle Defender Level 3 Unlocked (heavy tank)\nMaximum Training Level";
                    break;
                default:
                    nextUnlock = "Max Level Reached";
                    break;
            }
        }

        return {
            id: 'training_level',
            name: isMaxed ? `Training Grounds Level ${this.trainingLevel} - MAXED` : `Training Grounds Level ${nextLevel}`,
            description: description,
            nextUnlock: nextUnlock,
            level: this.trainingLevel,
            maxLevel: this.maxTrainingLevel,
            cost: this.calculateTrainingLevelCost(),
            icon: '◈'
        };
    }

    calculateRangeUpgradeCost(towerType) {
        const upgrade = this.rangeUpgrades[towerType];
        if (upgrade.level >= upgrade.maxLevel) return null;
        const costs = [150, 250, 375, 550, 800];
        return costs[upgrade.level] || null;
    }

    calculateTrainingLevelCost() {
        if (this.trainingLevel >= this.maxTrainingLevel) return null;
        // Cost progression: 500, 1000, 1500, 2000
        return 500 * this.trainingLevel;
    }

    purchaseUpgrade(upgradeType, gameState) {
        if (upgradeType === 'training_level') {
            return this.purchaseTrainingLevelUpgrade(gameState);
        }

        // Handle range upgrades
        if (upgradeType.startsWith('range_')) {
            const towerType = upgradeType.substring(6); // Remove 'range_' prefix
            const upgrade = this.rangeUpgrades[towerType];
            if (!upgrade) return false;

            // Check if upgrade level is unlocked by training grounds level
            if (this.trainingLevel <= upgrade.level) {
                return false;
            }

            const cost = this.calculateRangeUpgradeCost(towerType);
            if (!cost || gameState.gold < cost || upgrade.level >= upgrade.maxLevel) {
                return false;
            }

            gameState.gold -= cost;
            upgrade.level++;
            this.notifyUpgradeChanged();
            return true;
        }

        // Handle fire rate upgrades
        const upgrade = this.upgrades[upgradeType];
        const cost = this.calculateUpgradeCost(upgradeType);

        if (!upgrade) return false;

        // Check if upgrade level is unlocked by training grounds level
        if (this.trainingLevel <= upgrade.level) {
            return false;
        }

        if (!cost || gameState.gold < cost || upgrade.level >= upgrade.maxLevel) {
            return false;
        }

        gameState.gold -= cost;
        upgrade.level++;
        this.notifyUpgradeChanged();
        return true;
    }

    purchaseTrainingLevelUpgrade(gameState) {
        if (this.trainingLevel >= this.maxTrainingLevel) {
            return false;
        }

        const cost = this.calculateTrainingLevelCost();

        if (!cost || gameState.gold < cost) {
            return false;
        }

        gameState.gold -= cost;
        this.trainingLevel++;

        // Check for defender unlock at level 3
        if (this.trainingLevel === 3) {
            this.defenderUnlocked = true;
            this.defenderMaxLevel = 1;
        }

        // Check for guard post unlock at level 4 - now unlocked at placement, just upgrade defender
        if (this.trainingLevel === 4) {
            this.defenderMaxLevel = 2;
        }

        // Check for defender level 3 unlock at level 5 (no additional guard posts)
        if (this.trainingLevel === 5) {
            this.defenderMaxLevel = 3;
            // maxGuardPosts stays at 1 - no additional guard posts
        }

        return true;
    }

    calculateUpgradeCost(upgradeType) {
        const upgrade = this.upgrades[upgradeType];
        if (upgrade.level >= upgrade.maxLevel) return null;
        const costs = [150, 225, 350, 525, 800];
        return costs[upgrade.level] || null;
    }

    notifyUpgradeChanged() {
        this.upgradesChanged = true;
    }

    getUpgradeMultipliers() {
        // Calculate range bonuses for manned towers
        return {
            archerTowerRangeBonus: this.rangeUpgrades.archerTower.level * this.rangeUpgrades.archerTower.effect,
            basicTowerRangeBonus: this.rangeUpgrades.basicTower.level * this.rangeUpgrades.basicTower.effect,
            cannonTowerRangeBonus: this.rangeUpgrades.cannonTower.level * this.rangeUpgrades.cannonTower.effect,
            barricadeFireRateBonus: this.upgrades.barricadeFireRate.level * this.upgrades.barricadeFireRate.effect,
            poisonArcherFireRateBonus: this.upgrades.poisonArcherTowerFireRate.level * this.upgrades.poisonArcherTowerFireRate.effect
        };
    }

    getDefenderOption() {
        // Only show if training level 3+ and not already at max
        if (this.trainingLevel < 3) {
            return null;
        }

        // Determine what to display based on training level
        let option = null;

        if (!this.defenderUnlocked) {
            // Should never happen if trainingLevel >= 3, but safety check
            return null;
        }

        // If training level 4, we can unlock level 2 defender
        if (this.trainingLevel === 4 && this.defenderMaxLevel < 2) {
            option = {
                id: 'defender_upgrade_2',
                name: 'Defender Level 2 Unlock',
                description: 'Unlock the Level 2 Defender - Medium armored knight with improved stats',
                type: 'defender_upgrade',
                level: 2,
                cost: 800,
                icon: '○'
            };
        }
        // If training level 5, we can unlock level 3 defender
        else if (this.trainingLevel === 5 && this.defenderMaxLevel < 3) {
            option = {
                id: 'defender_upgrade_3',
                name: 'Defender Level 3 Unlock',
                description: 'Unlock the Level 3 Defender - Heavy armored tank with maximum strength',
                type: 'defender_upgrade',
                level: 3,
                cost: 1200,
                icon: '○'
            };
        }

        return option;
    }

    purchaseDefenderUpgrade(level, gameState) {
        if (level === 2 && this.trainingLevel >= 4 && this.defenderMaxLevel < 2) {
            const cost = 800;
            if (gameState.gold < cost) {
                return false;
            }
            gameState.gold -= cost;
            this.defenderMaxLevel = 2;
            return true;
        }

        if (level === 3 && this.trainingLevel >= 5 && this.defenderMaxLevel < 3) {
            const cost = 1200;
            if (gameState.gold < cost) {
                return false;
            }
            gameState.gold -= cost;
            this.defenderMaxLevel = 3;
            return true;
        }

        return false;
    }

    getGuardPostOption() {
        // Only show if training level 4+ and not already at max
        if (this.trainingLevel < 4) {
            return null;
        }

        if (!this.guardPostUnlocked) {
            return null;
        }

        return {
            id: 'guard_post_unlock',
            name: 'Guard Post Tower',
            description: 'Build a Guard Post tower on the path. Hire level 1 defenders to guard key locations.',
            type: 'guard_post',
            cost: 150,
            icon: '▹',
            maxBuildings: this.maxGuardPosts
        };
    }

    getTrainingLevel() {
        return this.trainingLevel;
    }

    deselect() {
        this.isSelected = false;
    }

    applyEffect(buildingManager) {
        // Apply the building's range and fire rate bonuses to towers
        // The actual application is handled through the upgrade multipliers
    }

    static getInfo() {
        // Return static information about the building
        return {
            name: 'Training Grounds',
            description: 'Medieval training facility with archer lanes and sword fighting duels. Provides combat upgrades.',
            effect: 'Global tower combat bonuses',
            size: '4x4',
            cost: 400
        };
    }
}
