import { PoisonArcherTower } from './PoisonArcherTower.js';

/**
 * Transformed Poison Archer - the toxin now permanently saps an afflicted enemy's speed
 * in addition to the usual damage-over-time. Visually, the camouflage bushes read as
 * corrupted by the toxin itself - thorned vines and pulsing pods (see
 * renderCoverElements below) - plus the shared "transformed" red hue every transform
 * gets (see TowerRenderAdapter's tint block).
 */
export class SuperPoisonTower extends PoisonArcherTower {
    static TRANSFORM_COLOR = '#B22222';

    applyPoisonToEnemy(enemy, towerForgeBonus = 0) {
        super.applyPoisonToEnemy(enemy, towerForgeBonus);

        // Permanent 20% speed reduction - applied once per enemy (guarded by the flag
        // below) no matter how many Super Poison Towers hit it, by lowering the shared
        // originalSpeed baseline every slow effect (BarricadeTower's zone,
        // MagicTower's water/freeze) reads from and which TowerManager's per-frame
        // restore-to-baseline loop pulls enemy.speed back toward once other slows end.
        // Lowering the baseline itself, instead of just enemy.speed, is what makes this
        // reduction survive after any other slow effect expires or restores - a plain
        // enemy.speed *= 0.8 here would just get overwritten by that restore loop.
        if (!enemy._superPoisonSlowed) {
            enemy._superPoisonSlowed = true;
            if (!enemy.hasOwnProperty('originalSpeed')) {
                enemy.originalSpeed = enemy.speed;
            }
            enemy.originalSpeed *= 0.8;
            enemy.speed = Math.min(enemy.speed, enemy.originalSpeed);
        }
    }

    /** Reuses PoisonArcherTower's camouflage bushes unmodified (see renderCoverElements),
     *  then grafts thorned dark-red vines and a couple of pulsing toxic pods onto each one
     *  - the cover itself reads as corrupted by the toxin, instead of relying on a generic
     *  badge (see TowerRenderAdapter's tint block for the shared "transformed" red hue
     *  every transform also gets). PoisonArcherTower has no renderStaticBack/Front to
     *  begin with, so this transform still reuses whatever's baked for the base type
     *  (nothing) - see TowerRenderAdapter._bakeClassName's doc. */
    renderCoverElements(ctx) {
        super.renderCoverElements(ctx);

        for (let i = 0; i < this.coverElements.length; i++) {
            this._renderCorruption(ctx, this.coverElements[i]);
        }
    }

    /** Thorned vines + toxic pods grafted onto one bush (see renderCoverElements()) -
     *  rustles in sync with that bush's own animation instead of inventing a second,
     *  out-of-phase motion. */
    _renderCorruption(ctx, element) {
        ctx.save();
        ctx.translate(element.x, element.y);
        const rustle = Math.sin(this.animationTime * 1.5 + element.rustleOffset) * 0.02;
        ctx.rotate(rustle);

        const thornCount = 5;
        ctx.strokeStyle = '#3a0d0d';
        ctx.lineWidth = 1.6;
        ctx.lineCap = 'round';
        for (let t = 0; t < thornCount; t++) {
            const angle = (t / thornCount) * Math.PI * 2 + element.pattern * 1.7;
            const len = element.size * (0.55 + (t % 3) * 0.12);
            const baseX = Math.cos(angle) * element.size * 0.55;
            const baseY = Math.sin(angle) * element.size * 0.55;
            const tipX = Math.cos(angle) * (element.size * 0.55 + len);
            const tipY = Math.sin(angle) * (element.size * 0.55 + len);
            const curlX = Math.cos(angle + 0.3) * (element.size * 0.55 + len * 0.6);
            const curlY = Math.sin(angle + 0.3) * (element.size * 0.55 + len * 0.6);

            ctx.beginPath();
            ctx.moveTo(baseX, baseY);
            ctx.quadraticCurveTo(curlX, curlY, tipX, tipY);
            ctx.stroke();

            // Small barbs part-way along the vine
            for (let b = 1; b <= 2; b++) {
                const bt = b / 3;
                const bx = baseX + (tipX - baseX) * bt;
                const by = baseY + (tipY - baseY) * bt;
                const barbAngle = angle + Math.PI / 2;
                ctx.beginPath();
                ctx.moveTo(bx, by);
                ctx.lineTo(bx + Math.cos(barbAngle) * 2, by + Math.sin(barbAngle) * 2);
                ctx.stroke();
            }
        }

        // A couple of pulsing toxic pods nestled in the branches
        const podPulse = 0.5 + 0.5 * Math.sin(this.animationTime * 2.2 + element.pattern);
        ctx.fillStyle = `rgba(120, 20, 30, ${0.75 + podPulse * 0.2})`;
        for (let p = 0; p < 2; p++) {
            const angle = (p / 2) * Math.PI * 2 + element.branchPattern * 3 + 0.6;
            const dist = element.size * 0.4;
            const px = Math.cos(angle) * dist;
            const py = Math.sin(angle) * dist;
            const r = element.size * 0.09 * (0.9 + podPulse * 0.3);
            ctx.beginPath();
            ctx.arc(px, py, r, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    static getInfo() {
        return {
            name: 'Super Poison Tower',
            description: "A refined toxin that permanently saps 20% of a poisoned enemy's speed, on top of the usual damage over time.",
            cost: 600,
            icon: ''
        };
    }
}
