import { LevelDesigner } from './LevelDesigner.js';

const LEGACY_STORAGE_KEY = 'touwers_player_levels';
const SLOT_COUNT = 6;

/**
 * Player Level Designer
 * Extends LevelDesigner with save-to-slot functionality.
 * Saves levels to the current save slot via stateManager when available,
 * falling back to localStorage for compatibility.
 */
export class PlayerLevelDesigner extends LevelDesigner {

    constructor(canvasId, options) {
        super(canvasId, options);
        this._stateManager = null;
    }

    /** Called by LevelDesignerState after instantiation to wire save-slot support. */
    setStateManager(sm) {
        this._stateManager = sm;
    }

    // No-op: player designer has no code output panel
    updateGeneratedCode() {}

    setupEventListeners() {
        super.setupEventListeners();

        // Save to slot button replaces export flow
        document.getElementById('saveToSlotBtn')?.addEventListener('click', () => this.openSaveModal());

        // Save slot modal controls
        document.getElementById('saveSlotCloseBtn')?.addEventListener('click', () => this.closeSaveModal());
        document.getElementById('saveSlotModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'saveSlotModal') this.closeSaveModal();
        });
    }

    // ---- Save modal ----

    openSaveModal() {
        const modal = document.getElementById('saveSlotModal');
        if (!modal) return;

        const list = document.getElementById('saveSlotList');
        if (!list) return;

        const existing = this._getCurrentPlayerLevels();

        // Build a select dropdown + confirm button
        list.innerHTML = '';

        const select = document.createElement('select');
        select.style.cssText = 'width:100%;padding:8px 10px;background:#333;color:#dedede;border:1px solid #3e3e3e;border-radius:3px;font-size:13px;font-family:inherit;margin-bottom:10px;';
        for (let i = 0; i < SLOT_COUNT; i++) {
            const data = existing[i];
            const opt = document.createElement('option');
            opt.value = String(i);
            opt.textContent = data
                ? `Slot ${i + 1} — ${data.name || 'Custom Level'}`
                : `Slot ${i + 1} — Empty`;
            select.appendChild(opt);
        }

        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'dov-btn btn-success';
        confirmBtn.style.cssText = 'width:100%;padding:8px;font-size:13px;';
        confirmBtn.textContent = 'Save to Selected Slot';
        confirmBtn.addEventListener('click', () => {
            this.saveToSlot(parseInt(select.value, 10));
            this.closeSaveModal();
        });

        list.appendChild(select);
        list.appendChild(confirmBtn);

        modal.style.display = 'flex';
    }

    closeSaveModal() {
        const modal = document.getElementById('saveSlotModal');
        if (modal) modal.style.display = 'none';
    }

    _getCurrentPlayerLevels() {
        // Prefer save slot data
        if (this._stateManager && this._stateManager.currentSaveData) {
            const pl = this._stateManager.currentSaveData.playerLevels;
            if (Array.isArray(pl)) {
                const result = pl.slice(0, SLOT_COUNT);
                while (result.length < SLOT_COUNT) result.push(null);
                return result;
            }
        }
        // Legacy localStorage fallback
        try {
            const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    const result = parsed.slice(0, SLOT_COUNT);
                    while (result.length < SLOT_COUNT) result.push(null);
                    return result;
                }
            }
        } catch (e) {}
        return Array(SLOT_COUNT).fill(null);
    }

    saveToSlot(index) {
        const name = document.getElementById('levelName')?.value?.trim() || `Custom Level ${index + 1}`;

        const levelData = {
            name,
            pathPoints: this.pathPoints.map(p => ({ gridX: p.gridX, gridY: p.gridY })),
            waves: this.waves.map(w => JSON.parse(JSON.stringify(w))),
            terrainElements: this.terrainElements.map(t => JSON.parse(JSON.stringify(t))),
            riverPaths: this.riverPaths.map(rp => rp.map(pt => ({ gridX: pt.gridX, gridY: pt.gridY }))),
            castlePosition: this.castlePosition
                ? { gridX: this.castlePosition.gridX, gridY: this.castlePosition.gridY }
                : null,
            campaign: this.currentCampaign || 'forest',
            savedAt: Date.now()
        };

        const existing = this._getCurrentPlayerLevels();
        existing[index] = levelData;

        // Save to current save slot via SaveSystem
        if (this._stateManager && this._stateManager.currentSaveSlot && this._stateManager.SaveSystem) {
            this._stateManager.SaveSystem.updateAndSaveSettlementData(
                this._stateManager.currentSaveSlot,
                { playerLevels: existing }
            );
            // Update in-memory save data so workshop picks it up immediately
            if (this._stateManager.currentSaveData) {
                this._stateManager.currentSaveData.playerLevels = existing;
            }
        } else {
            // Legacy localStorage fallback
            localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(existing));
        }

        // Brief visual confirmation
        const btn = document.getElementById('saveToSlotBtn');
        if (btn) {
            const orig = btn.textContent;
            btn.textContent = 'Saved!';
            setTimeout(() => { btn.textContent = orig; }, 1500);
        }
    }
}

