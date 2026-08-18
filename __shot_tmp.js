const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('pageerror', err => errors.push('pageerror: ' + err.message));

    await page.goto('http://localhost:3000/?stresstest', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Try clicking through any "click to start" overlay
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
        return { ok: true, hasWorkshop: !!wb, x: wb && wb.building.x, y: wb && wb.building.y };
    });
    console.log('EVAL_RESULT', JSON.stringify(result));

    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'C:\\Users\\boiaz\\AppData\\Local\\Temp\\claude\\c--Users-boiaz-AppDev-touwers\\e9ae76de-955b-4a56-aa70-78e196bad3e4\\scratchpad\\full.png' });

    if (result.ok && result.hasWorkshop) {
        const clip = { x: Math.max(0, result.x - 250), y: Math.max(0, result.y - 300), width: 500, height: 450 };
        await page.screenshot({ path: 'C:\\Users\\boiaz\\AppData\\Local\\Temp\\claude\\c--Users-boiaz-AppDev-touwers\\e9ae76de-955b-4a56-aa70-78e196bad3e4\\scratchpad\\workshop_crop.png', clip });
    }

    console.log('ERRORS', JSON.stringify(errors.slice(0, 20)));
    await browser.close();
})();
