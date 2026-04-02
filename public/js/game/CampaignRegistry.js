/**
 * CampaignRegistry
 * Central registry for all campaigns.
 * Each campaign is a class that extends CampaignBase.
 * Easy to expand - just import new campaign classes and add to campaigns object.
 *
 * Campaign progression order:
 *   campaign-1 (Verdant Woodlands)  → campaign-2 (Ironstone Mountains)
 *   campaign-2                      → campaign-3 (Scorching Sands)
 *   campaign-3                      → campaign-4 (Frog King's Domain)
 *   campaign-5 (Testing)            — always unlocked
 */
export class CampaignRegistry {
    static campaigns = {};
    static campaignClasses = {};

    /** Maps each campaign to the one it unlocks on completion */
    static UNLOCK_CHAIN = {
        'campaign-1': 'campaign-2',
        'campaign-2': 'campaign-3',
        'campaign-3': 'campaign-4',
        'campaign-4': null
    };

    /**
     * Initialize the registry with campaign classes
     */
    static initialize(campaignClasses) {
        this.campaignClasses = campaignClasses;

        // Build campaigns metadata from classes
        this.campaigns = {
            'campaign-1': {
                id: 'campaign-1',
                name: 'The Verdant Woodlands',
                description: 'Defend the ancient woodland realm from an encroaching darkness.',
                icon: '▲',                levelCount: 12,
                drawIcon(ctx, x, y, size) {
                    const s = size * 0.45;
                    // Background pine silhouettes for depth
                    [x - s*0.72, x + s*0.64].forEach((tx, i) => {
                        ctx.fillStyle = i === 0 ? '#14301a' : '#0f2814';
                        ctx.beginPath();
                        ctx.moveTo(tx, y + s*0.14);
                        ctx.lineTo(tx + s*0.22, y + s*0.14);
                        ctx.lineTo(tx + s*0.11, y - s*0.26);
                        ctx.closePath(); ctx.fill();
                    });
                    // Ground line
                    ctx.fillStyle = '#243820';
                    ctx.fillRect(x - s*0.88, y + s*0.68, s*1.76, s*0.07);
                    // Trunk — curved and tapered
                    ctx.fillStyle = '#5B3A26';
                    ctx.beginPath();
                    ctx.moveTo(x - s*0.14, y + s*0.68);
                    ctx.lineTo(x - s*0.09, y + s*0.20);
                    ctx.bezierCurveTo(x - s*0.06, y + s*0.10, x + s*0.06, y + s*0.10, x + s*0.09, y + s*0.20);
                    ctx.lineTo(x + s*0.14, y + s*0.68);
                    ctx.closePath(); ctx.fill();
                    ctx.strokeStyle = '#3A2010'; ctx.lineWidth = 0.7; ctx.stroke();
                    // Spreading roots
                    ctx.strokeStyle = '#4a2c10'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
                    [[-s*0.26, s*0.76], [0, s*0.80], [s*0.26, s*0.74]].forEach(([dx, dy]) => {
                        ctx.beginPath();
                        ctx.moveTo(x + dx*0.3, y + s*0.56);
                        ctx.quadraticCurveTo(x + dx*0.65, y + dy*0.85, x + dx, y + dy);
                        ctx.stroke();
                    });
                    // Leaf clusters — layered back to front
                    [
                        { cx: x - s*0.30, cy: y + s*0.04, r: s*0.36, c1: '#1a481e', c2: '#3a8830' },
                        { cx: x + s*0.28, cy: y - s*0.02, r: s*0.32, c1: '#154018', c2: '#2d7828' },
                        { cx: x, cy: y - s*0.46, r: s*0.42, c1: '#1e5822', c2: '#4aaa38' },
                        { cx: x - s*0.14, cy: y + s*0.14, r: s*0.27, c1: '#154818', c2: '#267a22' },
                        { cx: x + s*0.16, cy: y - s*0.24, r: s*0.26, c1: '#1a5820', c2: '#389030' },
                    ].forEach(cl => {
                        const rg = ctx.createRadialGradient(cl.cx - cl.r*0.25, cl.cy - cl.r*0.3, 0, cl.cx, cl.cy, cl.r);
                        rg.addColorStop(0, cl.c2); rg.addColorStop(1, cl.c1);
                        ctx.fillStyle = rg;
                        ctx.beginPath(); ctx.arc(cl.cx, cl.cy, cl.r, 0, Math.PI*2); ctx.fill();
                        ctx.strokeStyle = '#0d2210'; ctx.lineWidth = 0.5; ctx.stroke();
                    });
                    // Small bird silhouette
                    ctx.strokeStyle = '#0e1808'; ctx.lineWidth = 1.2; ctx.lineCap = 'round';
                    const birdX = x + s*0.50, birdY = y - s*0.55;
                    ctx.beginPath();
                    ctx.moveTo(birdX - s*0.10, birdY - s*0.03);
                    ctx.quadraticCurveTo(birdX, birdY - s*0.12, birdX + s*0.10, birdY - s*0.03);
                    ctx.stroke();
                },                difficulty: 'Apprentice',
                class: campaignClasses.Campaign1,
                rewards: {
                    gold: 5000,
                    unlocks: ['Magic Academy Plans']
                },
                unlockText: null,
                story: 'Strange creatures have emerged from the depths of the ancient forest — twisted frog-like beings that march with an unnerving purpose. No one knows where they come from or why they suddenly attack. You take up arms to defend the woodland realm, but questions plague your mind... What are these creatures? Why do they feel so unnatural? The answers must lie deeper within the mystery that surrounds your world.',
                completionStory: 'The woodland realm is saved! As the last foe falls, you discover a clue: these creatures are not merely beasts. They are soldiers, and someone — or something — commands them from afar. The path forward leads into the mountains... where the answers surely lie.',
                lootStyle: { normalChance: 0.10, rareChance: 0.0 },
                progress: 0,
                locked: false
            },
            'campaign-2': {
                id: 'campaign-2',
                name: 'The Ironstone Mountains',
                description: 'Brave the treacherous peaks to pursue the enemy to the desert beyond.',
                icon: '▲',                levelCount: 12,
                drawIcon(ctx, x, y, size) {
                    const s = size * 0.45;
                    // Sky fill
                    const skyG2 = ctx.createLinearGradient(x, y - s, x, y + s*0.5);
                    skyG2.addColorStop(0, '#1c2838'); skyG2.addColorStop(1, '#141e2c');
                    ctx.fillStyle = skyG2;
                    ctx.fillRect(x - s, y - s, s*2, s*2);
                    // Cloud wisps near summit
                    ctx.fillStyle = 'rgba(190,200,215,0.14)';
                    [[x - s*0.38, y - s*0.72, s*0.22], [x + s*0.24, y - s*0.78, s*0.16]].forEach(([cx2, cy2, r]) => {
                        ctx.beginPath(); ctx.ellipse(cx2, cy2, r, r*0.5, 0, 0, Math.PI*2); ctx.fill();
                        ctx.beginPath(); ctx.ellipse(cx2 + r*0.7, cy2 + r*0.1, r*0.65, r*0.4, 0, 0, Math.PI*2); ctx.fill();
                        ctx.beginPath(); ctx.ellipse(cx2 - r*0.5, cy2 + r*0.08, r*0.55, r*0.35, 0, 0, Math.PI*2); ctx.fill();
                    });
                    // Distant background mountain
                    const bmtG = ctx.createLinearGradient(x, y - s*0.28, x, y + s*0.68);
                    bmtG.addColorStop(0, '#5a6878'); bmtG.addColorStop(1, '#3a4858');
                    ctx.fillStyle = bmtG;
                    ctx.beginPath();
                    ctx.moveTo(x - s*0.90, y + s*0.68); ctx.lineTo(x - s*0.04, y - s*0.26);
                    ctx.lineTo(x + s*0.44, y + s*0.10); ctx.lineTo(x + s*0.90, y + s*0.68);
                    ctx.closePath(); ctx.fill();
                    // Left main peak
                    const lpG = ctx.createLinearGradient(x - s*0.55, y - s*0.88, x - s*0.55, y + s*0.68);
                    lpG.addColorStop(0, '#DDE6EF'); lpG.addColorStop(0.24, '#8a9fb0'); lpG.addColorStop(1, '#445460');
                    ctx.fillStyle = lpG;
                    ctx.beginPath();
                    ctx.moveTo(x - s*0.96, y + s*0.68); ctx.lineTo(x - s*0.18, y + s*0.68);
                    ctx.lineTo(x - s*0.55, y - s*0.88); ctx.closePath(); ctx.fill();
                    ctx.strokeStyle = '#253040'; ctx.lineWidth = 0.8; ctx.stroke();
                    // Snow cap left
                    ctx.fillStyle = '#EBF0F5';
                    ctx.beginPath();
                    ctx.moveTo(x - s*0.55, y - s*0.88); ctx.lineTo(x - s*0.42, y - s*0.52);
                    ctx.lineTo(x - s*0.52, y - s*0.44); ctx.lineTo(x - s*0.65, y - s*0.52);
                    ctx.closePath(); ctx.fill();
                    // Right main peak
                    const rpG = ctx.createLinearGradient(x + s*0.48, y - s*0.72, x + s*0.48, y + s*0.68);
                    rpG.addColorStop(0, '#C8D8E8'); rpG.addColorStop(0.26, '#6e8ea8'); rpG.addColorStop(1, '#384858');
                    ctx.fillStyle = rpG;
                    ctx.beginPath();
                    ctx.moveTo(x - s*0.06, y + s*0.68); ctx.lineTo(x + s*0.96, y + s*0.68);
                    ctx.lineTo(x + s*0.48, y - s*0.72); ctx.closePath(); ctx.fill();
                    ctx.strokeStyle = '#253040'; ctx.lineWidth = 0.8; ctx.stroke();
                    // Snow cap right
                    ctx.fillStyle = '#E8EEF4';
                    ctx.beginPath();
                    ctx.moveTo(x + s*0.48, y - s*0.72); ctx.lineTo(x + s*0.60, y - s*0.40);
                    ctx.lineTo(x + s*0.48, y - s*0.32); ctx.lineTo(x + s*0.36, y - s*0.40);
                    ctx.closePath(); ctx.fill();
                    // Castle tower in valley
                    const cbY = y + s*0.26;
                    ctx.fillStyle = '#1e2838';
                    ctx.fillRect(x - s*0.18, cbY - s*0.28, s*0.36, s*0.58);
                    // Battlements
                    for (let bi = 0; bi < 3; bi++) {
                        ctx.fillRect(x - s*0.16 + bi * s*0.135, cbY - s*0.40, s*0.08, s*0.13);
                    }
                    // Gateway arch
                    ctx.fillStyle = '#0e1420';
                    ctx.beginPath(); ctx.arc(x, cbY + s*0.10, s*0.09, Math.PI, 0); ctx.fill();
                    ctx.fillRect(x - s*0.09, cbY + s*0.10, s*0.18, s*0.22);
                    // Side turrets
                    [-s*0.22, s*0.22].forEach(tx => {
                        ctx.fillStyle = '#1e2838';
                        ctx.fillRect(x + tx - s*0.07, cbY - s*0.30, s*0.14, s*0.50);
                        ctx.fillStyle = '#0e1420';
                        ctx.fillRect(x + tx - s*0.07, cbY - s*0.38, s*0.14, s*0.10);
                    });
                },                difficulty: 'Warrior',
                class: campaignClasses.Campaign2,
                rewards: {
                    gold: 7500,
                    unlocks: ['Super Weapon Lab Plans', 'Strange Talisman']
                },
                unlockText: 'Complete The Verdant Woodlands',
                story: 'The woodland triumph reveals a disturbing truth: these creatures are coordinated and purposeful. An ancient prophecy speaks of an artifact hidden in the desert that holds the key to understanding — and defeating — these magical beings. But the desert lies beyond the treacherous peaks. You must brave the high passes, survive the bitter cold, and press through to where answers await.',
                completionStory: 'The mountain passes are yours! Through the thinning air and falling snow you found proof — the frog creatures carry sigils, all bearing the same mark. Someone on the other side of the desert is pulling the strings. You descend toward the dunes, closer than ever to the truth.',
                lootStyle: { normalChance: 0.10, rareChance: 0.025 },
                progress: 0,
                locked: true
            },
            'campaign-3': {
                id: 'campaign-3',
                name: 'The Scorching Sands',
                description: 'Uncover the ancient artifact that holds the secret of the enemy.',
                icon: '▼',                levelCount: 10,
                drawIcon(ctx, x, y, size) {
                    const s = size * 0.45;
                    // Scorching sky
                    const skyC = ctx.createLinearGradient(x, y - s, x, y + s*0.35);
                    skyC.addColorStop(0, '#3a1a04'); skyC.addColorStop(0.55, '#7a3a08'); skyC.addColorStop(1, '#b86018');
                    ctx.fillStyle = skyC; ctx.fillRect(x - s, y - s, s*2, s*2);
                    // Sun rays
                    ctx.lineCap = 'round';
                    const sunY3 = y - s*0.44;
                    for (let i = 0; i < 10; i++) {
                        const a = (i / 10) * Math.PI * 2;
                        const r1 = s*0.36, r2 = s*0.62;
                        const rg3 = ctx.createLinearGradient(x + Math.cos(a)*r1, sunY3 + Math.sin(a)*r1, x + Math.cos(a)*r2, sunY3 + Math.sin(a)*r2);
                        rg3.addColorStop(0, 'rgba(255,190,30,0.75)'); rg3.addColorStop(1, 'rgba(255,100,0,0)');
                        ctx.strokeStyle = rg3; ctx.lineWidth = s * 0.08;
                        ctx.beginPath();
                        ctx.moveTo(x + Math.cos(a)*r1, sunY3 + Math.sin(a)*r1);
                        ctx.lineTo(x + Math.cos(a)*r2, sunY3 + Math.sin(a)*r2);
                        ctx.stroke();
                    }
                    // Sun disc
                    const sunD = ctx.createRadialGradient(x - s*0.08, sunY3 - s*0.08, 0, x, sunY3, s*0.30);
                    sunD.addColorStop(0, '#FFF8B0'); sunD.addColorStop(0.40, '#FFD326');
                    sunD.addColorStop(0.80, '#FF8800'); sunD.addColorStop(1, '#B84000');
                    ctx.fillStyle = sunD;
                    ctx.beginPath(); ctx.arc(x, sunY3, s*0.30, 0, Math.PI*2); ctx.fill();
                    ctx.strokeStyle = '#8a3200'; ctx.lineWidth = 0.8;
                    ctx.beginPath(); ctx.arc(x, sunY3, s*0.30, 0, Math.PI*2); ctx.stroke();
                    // Sand dune back
                    ctx.fillStyle = '#b87830';
                    ctx.beginPath();
                    ctx.moveTo(x - s, y + s*0.22);
                    ctx.quadraticCurveTo(x - s*0.48, y + s*0.02, x, y + s*0.24);
                    ctx.quadraticCurveTo(x + s*0.48, y + s*0.46, x + s, y + s*0.22);
                    ctx.lineTo(x + s, y + s); ctx.lineTo(x - s, y + s); ctx.closePath(); ctx.fill();
                    // Sand dune front
                    ctx.fillStyle = '#c88a40';
                    ctx.beginPath();
                    ctx.moveTo(x - s, y + s*0.50);
                    ctx.quadraticCurveTo(x - s*0.32, y + s*0.32, x + s*0.08, y + s*0.56);
                    ctx.quadraticCurveTo(x + s*0.52, y + s*0.78, x + s, y + s*0.58);
                    ctx.lineTo(x + s, y + s); ctx.lineTo(x - s, y + s); ctx.closePath(); ctx.fill();
                    // Pyramid
                    const pyBase = y + s*0.22;
                    const pyW = s*0.64, pyH = s*0.74;
                    const pyG = ctx.createLinearGradient(x - pyW*0.5, pyBase - pyH, x + pyW*0.5, pyBase);
                    pyG.addColorStop(0, '#d4a060'); pyG.addColorStop(0.5, '#8a5a28'); pyG.addColorStop(1, '#5a3010');
                    ctx.fillStyle = pyG;
                    ctx.beginPath(); ctx.moveTo(x, pyBase - pyH); ctx.lineTo(x + pyW*0.5, pyBase); ctx.lineTo(x - pyW*0.5, pyBase); ctx.closePath(); ctx.fill();
                    ctx.strokeStyle = '#3e1e08'; ctx.lineWidth = 0.8; ctx.stroke();
                    // Pyramid shadow side
                    ctx.fillStyle = 'rgba(0,0,0,0.28)';
                    ctx.beginPath(); ctx.moveTo(x, pyBase - pyH); ctx.lineTo(x + pyW*0.5, pyBase); ctx.lineTo(x, pyBase); ctx.closePath(); ctx.fill();
                    // Palm tree silhouette
                    const palmX3 = x - s*0.74, palmY3 = y + s*0.42;
                    ctx.strokeStyle = '#281808'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
                    ctx.beginPath(); ctx.moveTo(palmX3, palmY3); ctx.lineTo(palmX3 - s*0.04, palmY3 - s*0.48); ctx.stroke();
                    ctx.lineWidth = 1.0; ctx.strokeStyle = '#1a4818';
                    [[-s*0.20, -s*0.60], [s*0.17, -s*0.58], [-s*0.32, -s*0.50], [s*0.26, -s*0.48]].forEach(([dx2, dy2]) => {
                        ctx.beginPath();
                        ctx.moveTo(palmX3 - s*0.04, palmY3 - s*0.48);
                        ctx.quadraticCurveTo(palmX3 + dx2*0.55, palmY3 + dy2*0.55, palmX3 + dx2, palmY3 + dy2);
                        ctx.stroke();
                    });
                },                difficulty: 'Champion',
                class: campaignClasses.Campaign3,
                rewards: {
                    gold: 10000,
                    unlocks: ['Ancient Relics']
                },
                unlockText: 'Complete The Ironstone Mountains',
                story: 'The desert stretches endlessly before you, shimmering with heat. The frog creatures here are infused with elemental power — fire, sand, and ancient stone. They guard their secrets fiercely. Finally, buried beneath the dunes, you find it: a radiant crystal that pulses with otherworldly energy. Its inscriptions reveal a shocking truth. These magical frogs are not from your world — they are from another realm entirely, and their king commands them all.',
                completionStory: 'The artifact pulses in your hands — a key to another world. The inscriptions are clear: there exists a rift, a passage to the Frog King\'s own domain. Your allies urge caution, but you know the only path to peace is through the king\'s court itself. Onward, to what lies beyond the veil of reality.',
                lootStyle: { normalChance: 0.15, rareChance: 0.04 },
                progress: 0,
                locked: true
            },
            'campaign-4': {
                id: 'campaign-4',
                name: "The Frog King's Domain",
                description: 'Enter the otherworldly realm and face the Frog King himself.',
                icon: '◎',                levelCount: 8,
                drawIcon(ctx, x, y, size) {
                    const s = size * 0.42;
                    // Magical aura glow
                    const aura4 = ctx.createRadialGradient(x, y, 0, x, y, s*1.45);
                    aura4.addColorStop(0, 'rgba(140,60,200,0.28)');
                    aura4.addColorStop(0.7, 'rgba(60,10,110,0.12)');
                    aura4.addColorStop(1, 'rgba(0,0,0,0)');
                    ctx.fillStyle = aura4; ctx.beginPath(); ctx.arc(x, y, s*1.45, 0, Math.PI*2); ctx.fill();
                    // 5-pointed crown body
                    const cBase4 = y + s*0.52, cW4 = s*1.0;
                    const crownG4 = ctx.createLinearGradient(x, y - s*0.82, x, cBase4);
                    crownG4.addColorStop(0, '#9822B2'); crownG4.addColorStop(0.45, '#6A1080'); crownG4.addColorStop(1, '#380A58');
                    ctx.fillStyle = crownG4;
                    ctx.beginPath();
                    ctx.moveTo(x - cW4, cBase4);
                    ctx.lineTo(x - cW4, y - s*0.08);
                    ctx.lineTo(x - cW4*0.76, y - s*0.70);
                    ctx.lineTo(x - cW4*0.52, y - s*0.06);
                    ctx.lineTo(x - cW4*0.26, y - s*0.52);
                    ctx.lineTo(x, y - s*0.88);
                    ctx.lineTo(x + cW4*0.26, y - s*0.52);
                    ctx.lineTo(x + cW4*0.52, y - s*0.06);
                    ctx.lineTo(x + cW4*0.76, y - s*0.70);
                    ctx.lineTo(x + cW4, y - s*0.08);
                    ctx.lineTo(x + cW4, cBase4);
                    ctx.closePath(); ctx.fill();
                    ctx.strokeStyle = '#CC80E0'; ctx.lineWidth = 1.4; ctx.stroke();
                    // Crown band
                    const bandG4 = ctx.createLinearGradient(x - cW4, y - s*0.08, x - cW4, y + s*0.18);
                    bandG4.addColorStop(0, '#CC80E0'); bandG4.addColorStop(1, '#7A1FA0');
                    ctx.fillStyle = bandG4;
                    ctx.fillRect(x - cW4, y - s*0.08, cW4*2, s*0.26);
                    ctx.strokeStyle = '#E0B0F0'; ctx.lineWidth = 0.8;
                    ctx.beginPath(); ctx.moveTo(x - cW4, y - s*0.08); ctx.lineTo(x + cW4, y - s*0.08); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(x - cW4, y + s*0.18); ctx.lineTo(x + cW4, y + s*0.18); ctx.stroke();
                    // Gems on all 5 spire tips
                    [
                        { gx: x - cW4*0.76, gy: y - s*0.70, r: s*0.11, c: '#E080B0' },
                        { gx: x - cW4*0.26, gy: y - s*0.52, r: s*0.09, c: '#A878D8' },
                        { gx: x,           gy: y - s*0.88, r: s*0.13, c: '#CC90E8' },
                        { gx: x + cW4*0.26, gy: y - s*0.52, r: s*0.09, c: '#A878D8' },
                        { gx: x + cW4*0.76, gy: y - s*0.70, r: s*0.11, c: '#E080B0' },
                    ].forEach(gem => {
                        const gg = ctx.createRadialGradient(gem.gx - gem.r*0.3, gem.gy - gem.r*0.3, 0, gem.gx, gem.gy, gem.r);
                        gg.addColorStop(0, '#FFFFFF'); gg.addColorStop(0.3, gem.c); gg.addColorStop(1, '#48108A');
                        ctx.fillStyle = gg;
                        ctx.beginPath(); ctx.arc(gem.gx, gem.gy, gem.r, 0, Math.PI*2); ctx.fill();
                        ctx.strokeStyle = '#7A1FA0'; ctx.lineWidth = 0.6; ctx.stroke();
                    });
                    // Frog eyes at base
                    const eyeY4 = cBase4 + s*0.10;
                    [-s*0.30, s*0.30].forEach(ex => {
                        ctx.fillStyle = '#2e7028';
                        ctx.beginPath(); ctx.ellipse(x + ex, eyeY4, s*0.15, s*0.11, 0, 0, Math.PI*2); ctx.fill();
                        ctx.strokeStyle = '#1a4018'; ctx.lineWidth = 0.8; ctx.stroke();
                        ctx.fillStyle = '#0a1806';
                        ctx.beginPath(); ctx.ellipse(x + ex, eyeY4, s*0.05, s*0.09, 0, 0, Math.PI*2); ctx.fill();
                    });
                    // Floating magic particles
                    ctx.fillStyle = 'rgba(200,130,255,0.65)';
                    [[x - s*0.82, y - s*0.02], [x + s*0.88, y - s*0.14], [x - s*0.18, y + s*0.72]].forEach(([px, py]) => {
                        ctx.beginPath(); ctx.arc(px, py, s*0.05, 0, Math.PI*2); ctx.fill();
                    });
                },                difficulty: 'Legendary',
                class: campaignClasses.Campaign4,
                rewards: {
                    gold: 15000,
                    unlocks: ['Crown of Victory']
                },
                unlockText: 'Complete The Scorching Sands',
                story: 'Using the artifact\'s power, you tear open a rift to the Frog King\'s own realm. The dimension itself is hostile — its landscapes warped by ancient magic, its sky a sickly purple-green. The Frog King rules from his throne at the end of a perilous path, and his champions stand ready to defend him. The fate of your world depends on this final stand. The Frog King awaits...',
                completionStory: 'Victory! The Frog King\'s domain crumbles. With his defeat, the rifts seal shut and the invasions cease across every realm. The frog armies disband, returning to their once-peaceful lives. You have done it — not just as a commander, but as a hero whose legend will never fade. The world is safe... for now.',
                lootStyle: { normalChance: 0.20, rareChance: 0.05 },
                progress: 0,
                locked: true
            },
            'campaign-5': {
                id: 'campaign-5',
                name: 'Level Testing Sandbox',
                description: 'A sandbox for testing and experimentation — everything unlocked.',
                icon: '◈',
                drawIcon(ctx, x, y, size) {
                    const s = size * 0.44;
                    // Outer decorative ring
                    ctx.strokeStyle = '#b09060'; ctx.lineWidth = s * 0.07;
                    ctx.beginPath(); ctx.arc(x, y, s*0.92, 0, Math.PI*2); ctx.stroke();
                    // Inner ring
                    ctx.strokeStyle = '#806a40'; ctx.lineWidth = s * 0.035;
                    ctx.beginPath(); ctx.arc(x, y, s*0.70, 0, Math.PI*2); ctx.stroke();
                    // Tick marks around ring
                    for (let i = 0; i < 16; i++) {
                        const a = (i / 16) * Math.PI * 2;
                        const r1 = s*0.94;
                        const r2 = i % 4 === 0 ? s*0.73 : s*0.84;
                        ctx.strokeStyle = i % 4 === 0 ? '#d4b050' : '#908060';
                        ctx.lineWidth = i % 4 === 0 ? s*0.055 : s*0.035;
                        ctx.beginPath();
                        ctx.moveTo(x + Math.cos(a)*r1, y + Math.sin(a)*r1);
                        ctx.lineTo(x + Math.cos(a)*r2, y + Math.sin(a)*r2);
                        ctx.stroke();
                    }
                    // Cross-hair lines
                    ctx.strokeStyle = 'rgba(180,150,80,0.42)'; ctx.lineWidth = s*0.04;
                    ctx.beginPath(); ctx.moveTo(x, y - s*0.64); ctx.lineTo(x, y + s*0.64); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(x - s*0.64, y); ctx.lineTo(x + s*0.64, y); ctx.stroke();
                    // Diamond compass points
                    [
                        { a: -Math.PI/2, c: '#e8d080', r: s*0.14 },
                        { a: 0,          c: '#b09050', r: s*0.11 },
                        { a: Math.PI/2,  c: '#b09050', r: s*0.11 },
                        { a: Math.PI,    c: '#b09050', r: s*0.11 },
                    ].forEach(({ a, c, r }) => {
                        const px = x + Math.cos(a)*s*0.76, py = y + Math.sin(a)*s*0.76;
                        ctx.fillStyle = c;
                        ctx.beginPath();
                        ctx.moveTo(px + Math.cos(a)*r, py + Math.sin(a)*r);
                        ctx.lineTo(px + Math.cos(a + Math.PI/2)*r*0.45, py + Math.sin(a + Math.PI/2)*r*0.45);
                        ctx.lineTo(px - Math.cos(a)*r*0.55, py - Math.sin(a)*r*0.55);
                        ctx.lineTo(px + Math.cos(a - Math.PI/2)*r*0.45, py + Math.sin(a - Math.PI/2)*r*0.45);
                        ctx.closePath(); ctx.fill();
                        ctx.strokeStyle = '#60481c'; ctx.lineWidth = 0.6; ctx.stroke();
                    });
                    // Center alchemical disc
                    const cDisc5 = ctx.createRadialGradient(x - s*0.07, y - s*0.07, 0, x, y, s*0.20);
                    cDisc5.addColorStop(0, '#ffe88a'); cDisc5.addColorStop(0.5, '#d4a820'); cDisc5.addColorStop(1, '#7a5010');
                    ctx.fillStyle = cDisc5;
                    ctx.beginPath(); ctx.arc(x, y, s*0.20, 0, Math.PI*2); ctx.fill();
                    ctx.strokeStyle = '#e0c050'; ctx.lineWidth = s*0.045;
                    ctx.beginPath(); ctx.arc(x, y, s*0.20, 0, Math.PI*2); ctx.stroke();
                    // Center cross
                    ctx.strokeStyle = '#3a2400'; ctx.lineWidth = s*0.05; ctx.lineCap = 'round';
                    ctx.beginPath(); ctx.moveTo(x - s*0.11, y); ctx.lineTo(x + s*0.11, y); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(x, y - s*0.11); ctx.lineTo(x, y + s*0.11); ctx.stroke();
                },
                difficulty: 'Testing',
                class: campaignClasses.Campaign5,
                rewards: {
                    gold: 0,
                    unlocks: []
                },
                unlockText: null,
                story: 'A test environment for level design and gameplay mechanics. All buildings, towers, and upgrades are available. Campaign progression is not affected. Use this to experiment freely.',
                completionStory: '',
                lootStyle: { normalChance: 0.20, rareChance: 0.05 },
                progress: 0,
                locked: false
            }
        };
    }

    /**
     * Load campaign lock/unlock state from save data.
     * Call this every time a save is loaded or a campaign is completed.
     * @param {Object|null} saveData - The current save slot's data
     */
    static loadFromSaveData(saveData) {
        // Reset to default lock states
        this.campaigns['campaign-2'].locked = true;
        this.campaigns['campaign-3'].locked = true;
        this.campaigns['campaign-4'].locked = true;
        this.campaigns['campaign-5'].locked = false;
        this.campaigns['campaign-1'].locked = false;

        if (!saveData) return;

        const unlockedCampaigns = saveData.unlockedCampaigns || ['campaign-1', 'campaign-5'];
        const completedCampaigns = saveData.completedCampaigns || [];

        for (const id of unlockedCampaigns) {
            if (this.campaigns[id]) {
                this.campaigns[id].locked = false;
            }
        }
        // Completed campaigns are also unlocked
        for (const id of completedCampaigns) {
            if (this.campaigns[id]) {
                this.campaigns[id].locked = false;
            }
        }

        // Compute per-campaign progress from completed levels
        const completedLevels = saveData.completedLevels || [];
        for (const [id, campaign] of Object.entries(this.campaigns)) {
            if (completedCampaigns.includes(id)) {
                campaign.progress = 100;
            } else if (campaign.levelCount) {
                let count = 0;
                for (let i = 1; i <= campaign.levelCount; i++) {
                    if (completedLevels.includes(`level${i}`)) count++;
                }
                campaign.progress = Math.round((count / campaign.levelCount) * 100);
            } else {
                campaign.progress = 0;
            }
        }
    }

    /**
     * Unlock the campaign that follows the given completed campaign.
     * Returns the ID of the newly unlocked campaign, or null if none.
     * @param {string} completedCampaignId
     */
    static unlockNextCampaign(completedCampaignId) {
        const nextId = this.UNLOCK_CHAIN[completedCampaignId] || null;
        if (nextId && this.campaigns[nextId]) {
            this.campaigns[nextId].locked = false;
        }
        return nextId;
    }

    /**
     * Get a campaign by ID
     */
    static getCampaign(campaignId) {
        return this.campaigns[campaignId];
    }

    /**
     * Get the campaign class/state for a campaign ID
     */
    static getCampaignClass(campaignId) {
        const campaign = this.campaigns[campaignId];
        return campaign ? campaign.class : null;
    }

    /**
     * Get all campaigns
     */
    static getAllCampaigns() {
        return Object.values(this.campaigns);
    }

    /**
     * Get all campaign IDs
     */
    static getCampaignIds() {
        return Object.keys(this.campaigns);
    }

    /**
     * Get campaigns ordered by unlock status (unlocked first)
     */
    static getCampaignsOrdered() {
        const all = this.getAllCampaigns();
        return all.sort((a, b) => {
            const aLocked = a.locked ? 1 : 0;
            const bLocked = b.locked ? 1 : 0;
            return aLocked - bLocked;
        });
    }

    /**
     * Update campaign progress
     */
    static updateCampaignProgress(campaignId, progress) {
        const campaign = this.campaigns[campaignId];
        if (campaign) {
            campaign.progress = Math.min(100, Math.max(0, progress));
        }
    }

    /**
     * Check if campaign is unlocked
     */
    static isCampaignUnlocked(campaignId) {
        const campaign = this.campaigns[campaignId];
        return campaign && !campaign.locked;
    }
}
