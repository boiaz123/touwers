const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('pageerror', err => errors.push('pageerror: ' + err.message));

    await page.goto('http://localhost:3000/?stresstest', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await page.mouse.click(800, 450).catch(() => {});
    await page.waitForTimeout(1000);

    const result = await page.evaluate(() => {
        const game = window.__gameInstance;
        if (!game || !game.stateManager) return { ok: false, reason: 'no game instance' };
        const sm = game.stateManager;
        sm.currentSaveSlot = 1;
        sm.changeState('settlementHub');
        const sh = sm.states.settlementHub;
        if (sm.upgradeSystem && sm.upgradeSystem.purchasedUpgrades) {
            sm.upgradeSystem.purchasedUpgrades.add('commanders-workshop');
        }
        sh._addWorkshopBuilding();
        const wb = sh.settlementBuildings.find(i => i.action === 'workshop');
        const canvas = game.canvas;
        const rect = canvas.getBoundingClientRect();
        return {
            ok: true, hasWorkshop: !!wb,
            bx: wb.building.x, by: wb.building.y,
            cw: canvas.width, ch: canvas.height,
            rectLeft: rect.left, rectTop: rect.top, rectW: rect.width, rectH: rect.height
        };
    });
    console.log('EVAL_RESULT', JSON.stringify(result));

    await page.waitForTimeout(1500);

    if (result.ok && result.hasWorkshop) {
        const vx = result.rectLeft + (result.bx / result.cw) * result.rectW;
        const vy = result.rectTop + (result.by / result.ch) * result.rectH;
        console.log('VIEWPORT_POS', vx, vy);
        const half = 160;
        const clip = {
            x: Math.max(0, vx - half), y: Math.max(0, vy - half * 1.3),
            width: half * 2, height: half * 2.2
        };
        await page.screenshot({ path: './__workshop_crop2.png', clip });
    }

    console.log('ERRORS', JSON.stringify(errors.slice(0, 20)));
    await browser.close();
})();
