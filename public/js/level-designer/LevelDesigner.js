/**
 * Main Level Designer Class
 * Orchestrates the level design UI, canvas interactions, and code generation
 */
import { CampaignThemeConfig } from '../core/CampaignThemeConfig.js';
import { DesignerRenderAdapter } from '../core/render/adapters/DesignerRenderAdapter.js';
import * as TerrainRenderer from '../core/render/TerrainRenderer.js';

// Vite glob patterns must be literal strings (no variables), hence one call per
// campaign folder. This replaces a hardcoded per-campaign level count that would
// silently go stale whenever a level file was added or removed — the "Load
// Existing Level" dropdown now always reflects exactly what's on disk.
const LEVEL_FILE_GLOBS = {
    Forest: import.meta.glob('../entities/levels/Forest/*.js'),
    Mountain: import.meta.glob('../entities/levels/Mountain/*.js'),
    Desert: import.meta.glob('../entities/levels/Desert/*.js'),
    Space: import.meta.glob('../entities/levels/Space/*.js'),
};

// Player-mode save-to-slot: the 6 custom-level slots live inside the active
// game save file; LEGACY_STORAGE_KEY is a non-slot-scoped fallback used only
// when no stateManager is available (e.g. no save loaded yet).
const PLAYER_LEVEL_SLOT_COUNT = 6;
const PLAYER_LEVEL_LEGACY_STORAGE_KEY = 'touwers_player_levels';

export class LevelDesigner {
    constructor(canvasId, config = {}) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // 'dev' = standalone level-designer.html (Export/Load-Existing-Level tools).
        // 'player' = in-game Commander's Workshop overlay (Save-to-slot instead).
        // A single class serves both so the in-game designer is exactly the one
        // developers use, not a parallel reimplementation. Deliberately NOT named
        // `this.mode` - that field already means the current tool/interaction mode
        // ('path' | 'terrain' | 'deleteTerrain').
        this.designerMode = config.mode || 'dev';
        this._stateManager = null;

        // See DesignerRenderAdapter.js. Init is async, so the very first setupCanvas()/
        // render() below still happen against Canvas2D until it resolves.
        this.designerRenderAdapter = new DesignerRenderAdapter();

        // Configuration
        this.gridWidth = config.gridWidth || 60;
        this.gridHeight = config.gridHeight || 33.75;
        this.cellSize = config.cellSize || 32;
        
        // Game state
        this.pathPoints = [];
        this.castlePosition = null;
        this.currentCampaign = 'forest'; // Track selected campaign
        this.mode = 'path'; // Start in path mode, ready to draw immediately
        this.terrainMode = null; // 'vegetation', 'rock', 'water' when in terrain mode
        this.waterMode = null; // 'river' or 'lake' when placing water
        this.waves = [];
        this.terrainElements = []; // Array of {type, gridX, gridY, size}
        this.currentEditingWaveId = null;
        this.hoveredGridCell = null; // For visual feedback during mouse movement
        this.pathLocked = false; // Whether path editing is finished
        this.riverPaths = []; // Array of completed river waypoint arrays
        this.isDrawingRiver = false; // Freehand river drawing active
        this.lastRiverDragPos = null; // Last auto-added waypoint during drag
        this.terrainElementSize = 2.0; // Controlled by terrain size slider
        this.currentMouseGridPos = null; // Current mouse grid position for coordinate display
        this.selectedTreeVariant = 0;
        this.selectedRockVariant = 0;
        this.brushTreeVariants = new Set([0]); // Which tree variants are active in brush mode
        
        this.hoveredTerrainElementIndex = null; // For delete mode hover detection

        // Tree brush properties
        this.treeBrushActive = false;
        this.treeBrushSize = 3;
        this.treeBrushMinSize = 1.0;
        this.treeBrushMaxSize = 3.0;
        this.isBrushPainting = false;
        this.lastBrushPaintPos = null;
        // Wave drag-and-drop state
        this.draggedWaveIndex = null;

        // Undo stack: records path/terrain/river mutations so Undo can reverse
        // whichever action was most recent, not just path-point placement.
        this.undoStack = [];

        // Path texture cache (invalidated when path changes)
        this.designerPathTexture = [];
        this.designerPathLeaves = [];
        this.designerPathTextureGenerated = false;
        this.designerPathHash = '';
        
        // Confirmation system
        this.confirmationCallback = null;
        
        // Enemies and towers for form
        this.enemies = ['basic', 'villager', 'archer', 'beefyenemy', 'knight', 'shieldknight', 'mage', 'frog', 'earthfrog', 'waterfrog', 'firefrog', 'airfrog', 'frogking'];
        
        // Wire variant picker buttons
        for (let i = 0; i < 4; i++) {
            document.getElementById(`variantBtn${i}`)?.addEventListener('click', () => {
                if (this.terrainMode === 'vegetation' && this.treeBrushActive) {
                    // Brush mode: toggle multi-select, always keep at least one active
                    if (this.brushTreeVariants.has(i)) {
                        if (this.brushTreeVariants.size > 1) this.brushTreeVariants.delete(i);
                    } else {
                        this.brushTreeVariants.add(i);
                    }
                    this.selectedTreeVariant = i; // keep last clicked as primary for non-brush placement
                } else if (this.terrainMode === 'vegetation') {
                    this.selectedTreeVariant = i;
                    this.brushTreeVariants = new Set([i]); // sync brush set to match single selection
                } else if (this.terrainMode === 'rock') {
                    this.selectedRockVariant = i;
                }
                this.updateVariantPicker();
                this.render();
            });
        }

        // Initialize
        this.setupCanvas();
        this.setupEventListeners();
        this.setupFormHandlers();
        this.updateTerrainButtonsForCampaign();
        this.createDefaultWave();
        this.setMode('path');
        this.render();
    }

    setupCanvas() {
        if (this.designerMode === 'player') {
            // In-game overlay: fit the canvas to its wrapper while preserving the
            // designer's 16:9 grid aspect ratio (60 / 33.75), since the wrapper isn't
            // guaranteed to already be exactly 16:9 the way the standalone dev page is.
            const wrapper = this.canvas.parentElement;
            const maxW = wrapper ? wrapper.clientWidth : this.canvas.offsetWidth;
            const maxH = wrapper ? wrapper.clientHeight : this.canvas.offsetHeight;
            const ratio = this.gridWidth / this.gridHeight;
            let w, h;
            if (maxW / maxH > ratio) {
                h = maxH;
                w = Math.round(h * ratio);
            } else {
                w = maxW;
                h = Math.round(w / ratio);
            }
            this.canvas.width = w;
            this.canvas.height = h;
            this.canvas.style.width = w + 'px';
            this.canvas.style.height = h + 'px';
        } else {
            this.canvas.width = this.canvas.offsetWidth;
            this.canvas.height = this.canvas.offsetHeight;
        }

        if (this.designerRenderAdapter) {
            this.designerRenderAdapter.init(this.canvas).then(() => {
                this.designerRenderAdapter.resize(this.canvas.width, this.canvas.height);
                this.render();
            });
        }

        // Set default castle position
        if (!this.castlePosition) {
            this.castlePosition = {
                gridX: this.gridWidth - 2,
                gridY: this.gridHeight / 2
            };
        }
    }

    setupEventListeners() {
        // Canvas events
        this.canvas.addEventListener('mousedown', (e) => this.handleCanvasMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleCanvasMouseUp(e));
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.handleCanvasRightClick();
        });
        this.canvas.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));
        this.canvas.addEventListener('mouseleave', (e) => {
            this.hoveredGridCell = null;
            this.isDrawingRiver = false;
            this.render();
        });
        window.addEventListener('mouseup', () => { this.isDrawingRiver = false; this.lastRiverDragPos = null; this.isBrushPainting = false; this.lastBrushPaintPos = null; });
        
        window.addEventListener('resize', () => this.handleResize());

        // Toolbar buttons
        document.getElementById('drawPathBtn')?.addEventListener('click', () => this.setMode('path'));
        document.getElementById('undoBtn')?.addEventListener('click', () => this.undo());
        document.getElementById('clearBtn')?.addEventListener('click', () => this.onClearClick());
        document.getElementById('finishPathBtn')?.addEventListener('click', () => this.onFinishPathClick());
        document.getElementById('finishRiverBtn')?.addEventListener('click', () => this.onFinishRiverClick());
        
        // Confirmation modal controls
        document.getElementById('confirmationCancel')?.addEventListener('click', () => this.closeConfirmation());
        document.getElementById('confirmationOk')?.addEventListener('click', () => {
            if (this.confirmationCallback) {
                this.confirmationCallback();
            }
            this.closeConfirmation();
        });

        // Terrain buttons
        document.getElementById('drawVegetationBtn')?.addEventListener('click', () => this.setTerrainMode('vegetation'));
        document.getElementById('drawRockBtn')?.addEventListener('click', () => this.setTerrainMode('rock'));
        document.getElementById('drawWaterBtn')?.addEventListener('click', () => this.setTerrainMode('water'));
        document.getElementById('deleteTerrainBtn')?.addEventListener('click', () => this.setDeleteMode());
        
        // Water mode buttons
        document.getElementById('waterRiverBtn')?.addEventListener('click', () => this.setWaterMode('river'));
        document.getElementById('waterLakeBtn')?.addEventListener('click', () => this.setWaterMode('lake'));
        


        // Terrain size slider
        document.getElementById('terrainSizeSlider')?.addEventListener('input', (e) => {
            this.terrainElementSize = parseFloat(e.target.value);
            const label = document.getElementById('terrainSizeLabel');
            if (label) label.textContent = this.terrainElementSize.toFixed(1);
        });

        // Tree brush controls
        document.getElementById('treeBrushToggle')?.addEventListener('click', () => {
            this.treeBrushActive = !this.treeBrushActive;
            if (this.treeBrushActive) {
                // Sync brush set to current single selection when enabling brush
                this.brushTreeVariants = new Set([this.selectedTreeVariant]);
            }
            document.getElementById('treeBrushToggle')?.classList.toggle('active', this.treeBrushActive);
            this.updateVariantPicker();
            this.render();
        });
        document.getElementById('treeBrushRadius')?.addEventListener('input', (e) => {
            this.treeBrushSize = parseFloat(e.target.value);
            const lbl = document.getElementById('treeBrushRadiusLabel');
            if (lbl) lbl.textContent = this.treeBrushSize.toFixed(1);
        });
        document.getElementById('treeBrushMinSize')?.addEventListener('input', (e) => {
            this.treeBrushMinSize = parseFloat(e.target.value);
            const lbl = document.getElementById('treeBrushMinSizeLabel');
            if (lbl) lbl.textContent = this.treeBrushMinSize.toFixed(1);
        });
        document.getElementById('treeBrushMaxSize')?.addEventListener('input', (e) => {
            this.treeBrushMaxSize = parseFloat(e.target.value);
            const lbl = document.getElementById('treeBrushMaxSizeLabel');
            if (lbl) lbl.textContent = this.treeBrushMaxSize.toFixed(1);
        });

        if (this.designerMode === 'dev') {
            // Dev-only tools: export-to-.js-source and the campaign/level browser used
            // to load a shipped level for editing. Neither exists in the in-game overlay.
            document.getElementById('exportBtn')?.addEventListener('click', () => this.exportLevel());
            document.getElementById('copyCodeBtn')?.addEventListener('click', () => this.copyCode());

            document.getElementById('loadLevelBtn')?.addEventListener('click', () => this.openLoadLevelModal());
            document.getElementById('loadLevelCloseBtn')?.addEventListener('click', () => this.closeLoadLevelModal());
            document.getElementById('loadLevelCancelBtn')?.addEventListener('click', () => this.closeLoadLevelModal());
            document.getElementById('campaignSelect')?.addEventListener('change', (e) => this.onCampaignSelectChange(e));
            document.getElementById('loadLevelConfirmBtn')?.addEventListener('click', () => this.onLoadLevelConfirm());
            document.getElementById('loadLevelModal')?.addEventListener('click', (e) => {
                if (e.target.id === 'loadLevelModal') {
                    this.closeLoadLevelModal();
                }
            });
        }

        if (this.designerMode === 'player') {
            // Player-only: save the current design into one of the 6 level slots,
            // replacing the dev tool's export flow.
            document.getElementById('saveToSlotBtn')?.addEventListener('click', () => this.openSaveModal());
            document.getElementById('saveSlotCloseBtn')?.addEventListener('click', () => this.closeSaveModal());
            document.getElementById('saveSlotModal')?.addEventListener('click', (e) => {
                if (e.target.id === 'saveSlotModal') this.closeSaveModal();
            });
        }
    }

    setupFormHandlers() {
        // Campaign theme selector
        const campaignSelect = document.getElementById('campaignTheme');
        if (campaignSelect) {
            campaignSelect.addEventListener('change', (e) => {
                this.currentCampaign = e.target.value;
                this.updateTerrainButtonsForCampaign();
                this.updateGeneratedCode();
                this.render();
            });
        }

        // Auto-update code on form changes
        const inputs = document.querySelectorAll('.form-group input, .form-group select');
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                this.updateGeneratedCode();
            });
        });

        // Wave management
        document.getElementById('addWaveBtn').addEventListener('click', () => this.openWaveModal());

        // Modal controls
        document.getElementById('modalCloseBtn').addEventListener('click', () => this.closeWaveModal());
        document.getElementById('modalCancelBtn').addEventListener('click', () => this.closeWaveModal());
        document.getElementById('modalSaveBtn').addEventListener('click', () => this.saveWaveFromModal());
        document.getElementById('modalAddPatternBtn').addEventListener('click', () => this.addPatternToModal());

        // Close modal on overlay click
        document.getElementById('waveModal').addEventListener('click', (e) => {
            if (e.target.id === 'waveModal') {
                this.closeWaveModal();
            }
        });

        // Input listeners for path info
        document.querySelectorAll('input, select').forEach(el => {
            el.addEventListener('change', () => this.render());
        });
    }

    setMode(newMode) {
        this.mode = newMode;
        this.terrainMode = null;
        
        document.getElementById('drawPathBtn').classList.toggle('active', newMode === 'path');
        document.getElementById('drawVegetationBtn')?.classList.toggle('active', false);
        document.getElementById('drawRockBtn')?.classList.toggle('active', false);
        document.getElementById('drawWaterBtn')?.classList.toggle('active', false);
        document.getElementById('deleteTerrainBtn')?.classList.toggle('active', false);
        
        // Show/hide finish path button
        const finishPathControl = document.getElementById('finishPathControl');
        if (finishPathControl) {
            finishPathControl.style.display = newMode === 'path' ? 'flex' : 'none';
        }
        
        // Hide river finish and water controls when leaving terrain mode
        const finishRiverControl = document.getElementById('finishRiverControl');
        if (finishRiverControl) {
            finishRiverControl.style.display = 'none';
        }

        const waterControls = document.getElementById('waterControls');
        if (waterControls) waterControls.style.display = 'none';

        // Hide size group and brush controls when switching main mode
        const terrainSizeGroup = document.getElementById('terrainSizeGroup');
        if (terrainSizeGroup) terrainSizeGroup.style.display = 'none';
        const treeBrushControls = document.getElementById('treeBrushControls');
        if (treeBrushControls) treeBrushControls.style.display = 'none';
        this.treeBrushActive = false;
        document.getElementById('treeBrushToggle')?.classList.remove('active');

        this.updateStatusBar();
    }

    setTerrainMode(terrainType) {
        this.mode = 'terrain';
        this.terrainMode = terrainType;
        this.waterMode = null; // Reset water mode
        
        document.getElementById('drawPathBtn').classList.toggle('active', false);
        document.getElementById('drawVegetationBtn')?.classList.toggle('active', terrainType === 'vegetation');
        document.getElementById('drawRockBtn')?.classList.toggle('active', terrainType === 'rock');
        document.getElementById('drawWaterBtn')?.classList.toggle('active', terrainType === 'water');
        document.getElementById('deleteTerrainBtn')?.classList.toggle('active', false);
        
        // Hide all finish controls when entering terrain mode
        const finishPathControl = document.getElementById('finishPathControl');
        if (finishPathControl) {
            finishPathControl.style.display = 'none';
        }
        const finishRiverControl = document.getElementById('finishRiverControl');
        if (finishRiverControl) {
            finishRiverControl.style.display = 'none';
        }
        
        // Show water controls when water is selected
        const waterControls = document.getElementById('waterControls');
        if (waterControls) waterControls.style.display = terrainType === 'water' ? 'flex' : 'none';

        // Show size slider for vegetation and rock, hide for water
        const terrainSizeGroup = document.getElementById('terrainSizeGroup');
        if (terrainSizeGroup) terrainSizeGroup.style.display = (terrainType === 'vegetation' || terrainType === 'rock') ? 'flex' : 'none';

        // Show brush controls only for vegetation
        const treeBrushControls = document.getElementById('treeBrushControls');
        if (treeBrushControls) treeBrushControls.style.display = terrainType === 'vegetation' ? 'flex' : 'none';
        if (terrainType !== 'vegetation') {
            this.treeBrushActive = false;
            document.getElementById('treeBrushToggle')?.classList.remove('active');
        }

        this.updateVariantPicker();
        this.updateStatusBar();
    }

    setDeleteMode() {
        this.mode = 'deleteTerrain';
        this.terrainMode = null;

        document.getElementById('drawPathBtn').classList.toggle('active', false);
        document.getElementById('drawVegetationBtn')?.classList.toggle('active', false);
        document.getElementById('drawRockBtn')?.classList.toggle('active', false);
        document.getElementById('drawWaterBtn')?.classList.toggle('active', false);
        document.getElementById('deleteTerrainBtn')?.classList.toggle('active', true);

        const finishPathControl = document.getElementById('finishPathControl');
        if (finishPathControl) finishPathControl.style.display = 'none';
        const finishRiverControl = document.getElementById('finishRiverControl');
        if (finishRiverControl) finishRiverControl.style.display = 'none';
        const waterControls = document.getElementById('waterControls');
        if (waterControls) waterControls.style.display = 'none';
        const terrainSizeGroup = document.getElementById('terrainSizeGroup');
        if (terrainSizeGroup) terrainSizeGroup.style.display = 'none';
        const treeBrushControls = document.getElementById('treeBrushControls');
        if (treeBrushControls) treeBrushControls.style.display = 'none';
        const variantPickerRow = document.getElementById('variantPickerRow');
        if (variantPickerRow) variantPickerRow.style.display = 'none';

        this.hoveredTerrainElementIndex = null;
        this.updateStatusBar();
    }

    _findHoveredTerrainElement(gridX, gridY) {
        const threshold = 1.2;
        let bestIndex = null;
        let bestDist = Infinity;
        for (let i = 0; i < this.terrainElements.length; i++) {
            const el = this.terrainElements[i];
            if (el.type !== 'vegetation' && el.type !== 'rock') continue;
            const dx = el.gridX - gridX;
            const dy = el.gridY - gridY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < threshold && dist < bestDist) {
                bestDist = dist;
                bestIndex = i;
            }
        }
        this.hoveredTerrainElementIndex = bestIndex;
    }

    _drawDeleteHover() {
        if (this.hoveredTerrainElementIndex === null) return;
        const el = this.terrainElements[this.hoveredTerrainElementIndex];
        if (!el) return;
        const cellWidthPixels = this.canvas.width / this.gridWidth;
        const cellHeightPixels = this.canvas.height / this.gridHeight;
        const x = el.gridX * cellWidthPixels;
        const y = el.gridY * cellHeightPixels;
        const avgCell = (cellWidthPixels + cellHeightPixels) / 2;
        const r = el.size * avgCell * 0.55;

        this.ctx.strokeStyle = 'rgba(255, 60, 60, 0.9)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([4, 3]);
        this.ctx.beginPath();
        this.ctx.arc(x, y, r, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        this.ctx.fillStyle = 'rgba(255, 60, 60, 0.15)';
        this.ctx.beginPath();
        this.ctx.arc(x, y, r, 0, Math.PI * 2);
        this.ctx.fill();

        const hs = avgCell * 0.22;
        this.ctx.strokeStyle = 'rgba(255, 60, 60, 0.95)';
        this.ctx.lineWidth = 2.5;
        this.ctx.setLineDash([]);
        this.ctx.beginPath();
        this.ctx.moveTo(x - hs, y - hs);
        this.ctx.lineTo(x + hs, y + hs);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(x + hs, y - hs);
        this.ctx.lineTo(x - hs, y + hs);
        this.ctx.stroke();
    }

    updateVariantPicker() {
        const row = document.getElementById('variantPickerRow');
        if (!row) return;
        const isVeg = this.terrainMode === 'vegetation';
        const isRock = this.terrainMode === 'rock';
        if (!isVeg && !isRock) { row.style.display = 'none'; return; }
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.gap = '2px';
        for (let i = 0; i < 4; i++) {
            const btn = document.getElementById(`variantBtn${i}`);
            if (!btn) continue;
            if (isVeg && this.treeBrushActive) {
                btn.classList.toggle('active', this.brushTreeVariants.has(i));
            } else {
                const activeVariant = isVeg ? this.selectedTreeVariant : this.selectedRockVariant;
                btn.classList.toggle('active', i === activeVariant);
            }
        }
        const lbl = document.getElementById('variantPickerLabel');
        if (lbl) lbl.textContent = isVeg ? 'Tree' : 'Rock';
    }

    setWaterMode(mode) {
        this.waterMode = mode;
        document.getElementById('waterRiverBtn')?.classList.toggle('active', mode === 'river');
        document.getElementById('waterLakeBtn')?.classList.toggle('active', mode === 'lake');
        
        // Show/hide finish river button only for river mode
        const finishRiverControl = document.getElementById('finishRiverControl');
        if (finishRiverControl) {
            finishRiverControl.style.display = mode === 'river' ? 'flex' : 'none';
        }

        // Show size slider only for lake mode
        const terrainSizeGroup = document.getElementById('terrainSizeGroup');
        if (terrainSizeGroup) terrainSizeGroup.style.display = mode === 'lake' ? 'flex' : 'none';

        if (mode === 'river') {
            this.riverPoints = []; // Always start fresh when entering river mode
        } else if (mode === 'lake') {
            this.riverPoints = [];
        }
        this.updateStatusBar();
    }

    updateTerrainButtonsForCampaign() {
        // All campaigns now have vegetation and rock buttons
        // No need to hide/show buttons anymore - always available
        // Styling is handled by the campaign theme
        document.getElementById('drawVegetationBtn').style.display = 'inline-block';
        document.getElementById('drawRockBtn').style.display = 'inline-block';
        document.getElementById('drawWaterBtn').style.display = 'inline-block';
    }

    pixelToGrid(canvasX, canvasY) {
        const gridX = (canvasX / this.canvas.width) * this.gridWidth;
        const gridY = (canvasY / this.canvas.height) * this.gridHeight;
        return { gridX, gridY };
    }

    snapToGrid(gridX, gridY) {
        return {
            gridX: Math.round(gridX),
            gridY: Math.round(gridY)
        };
    }

    handleCanvasMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;

        // Get raw grid coordinates
        const gridCoords = this.pixelToGrid(canvasX, canvasY);
        this.currentMouseGridPos = gridCoords;

        // Update DOM coordinate display
        const coordEl = document.getElementById('coordDisplay');
        if (coordEl) coordEl.textContent = `x: ${gridCoords.gridX.toFixed(1)}  y: ${gridCoords.gridY.toFixed(1)}`;
        
        // Only snap for terrain and path modes
        if (this.mode === 'deleteTerrain') {
            this.hoveredGridCell = null;
            this._findHoveredTerrainElement(gridCoords.gridX, gridCoords.gridY);
        } else if (this.mode === 'terrain' || (this.mode === 'path' && this.waterMode !== 'river') || this.mode === 'castle') {
            this.hoveredGridCell = this.snapToGrid(gridCoords.gridX, gridCoords.gridY);
        } else if (this.mode === 'path' || (this.mode === 'terrain' && this.waterMode === 'river')) {
            // For path and river, show the unsnapped position
            this.hoveredGridCell = gridCoords;
        }

        // Freehand river drawing — add waypoints while mouse is held
        if (this.isDrawingRiver && this.mode === 'terrain' && this.waterMode === 'river') {
            if (this.lastRiverDragPos && this.riverPoints) {
                const dist = Math.hypot(
                    gridCoords.gridX - this.lastRiverDragPos.gridX,
                    gridCoords.gridY - this.lastRiverDragPos.gridY
                );
                if (dist >= 0.4) {
                    this.riverPoints.push({ gridX: gridCoords.gridX, gridY: gridCoords.gridY });
                    this.lastRiverDragPos = { gridX: gridCoords.gridX, gridY: gridCoords.gridY };
                }
            }
        }

        // Tree brush painting — place trees while mouse is held and dragged
        if (this.isBrushPainting && this.mode === 'terrain' && this.terrainMode === 'vegetation' && this.treeBrushActive) {
            if (this.lastBrushPaintPos) {
                const dist = Math.hypot(
                    gridCoords.gridX - this.lastBrushPaintPos.gridX,
                    gridCoords.gridY - this.lastBrushPaintPos.gridY
                );
                if (dist >= this.treeBrushSize * 0.5) {
                    this.paintBrush(gridCoords.gridX, gridCoords.gridY);
                    this.lastBrushPaintPos = { gridX: gridCoords.gridX, gridY: gridCoords.gridY };
                    this.updateGeneratedCode();
                }
            }
        }
        
        // Lake painting — no longer used (lakes are terrain elements)
        
        this.render();
    }

    handleCanvasClick(e) {
        // River mode is handled via mousedown + mousemove; skip click
        if (this.mode === 'terrain' && this.waterMode === 'river') return;

        const rect = this.canvas.getBoundingClientRect();
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;

        // Convert to grid coordinates
        const gridCoords = this.pixelToGrid(canvasX, canvasY);

        if (this.mode === 'deleteTerrain') {
            if (this.hoveredTerrainElementIndex !== null) {
                const idx = this.hoveredTerrainElementIndex;
                const removed = this.terrainElements[idx];
                this.terrainElements.splice(idx, 1);
                this._pushUndo({ type: 'terrainRemove', index: idx, element: removed });
                this.hoveredTerrainElementIndex = null;
            }
        } else if (this.mode === 'path') {
            // Snap path points to grid
            const snapped = this.snapToGrid(gridCoords.gridX, gridCoords.gridY);
            this.pathPoints.push(snapped);
            this._pushUndo({ type: 'pathPoint' });
        } else if (this.mode === 'terrain' && this.terrainMode) {
            if (this.waterMode === 'river') {
                // Add point to river (not snapped for smooth curves)
                if (!this.riverPoints) this.riverPoints = [];
                this.riverPoints.push(gridCoords);
            } else if (this.waterMode === 'lake') {
                // Place a lake element at the clicked position
                const snapped = this.snapToGrid(gridCoords.gridX, gridCoords.gridY);
                this.addTerrainElement(this.terrainMode, snapped.gridX, snapped.gridY, null, 'lake');
            } else {
                // Regular terrain placement (snapped to grid) — skip for brush mode (handled via mousedown)
                if (!(this.terrainMode === 'vegetation' && this.treeBrushActive)) {
                    const snapped = this.snapToGrid(gridCoords.gridX, gridCoords.gridY);
                    this.addTerrainElement(this.terrainMode, snapped.gridX, snapped.gridY);
                }
            }
        }

        this.updateGeneratedCode();
        this.render();
    }

    handleCanvasMouseDown(e) {
        if (e.button !== 0) return;
        if (this.mode === 'terrain' && this.waterMode === 'river') {
            const rect = this.canvas.getBoundingClientRect();
            const canvasX = e.clientX - rect.left;
            const canvasY = e.clientY - rect.top;
            const gridCoords = this.pixelToGrid(canvasX, canvasY);
            if (!this.riverPoints) this.riverPoints = [];
            this.riverPoints.push(gridCoords);
            this.isDrawingRiver = true;
            this.lastRiverDragPos = { gridX: gridCoords.gridX, gridY: gridCoords.gridY };
            this.updateGeneratedCode();
            this.render();
        } else if (this.mode === 'terrain' && this.terrainMode === 'vegetation' && this.treeBrushActive) {
            const rect = this.canvas.getBoundingClientRect();
            const canvasX = e.clientX - rect.left;
            const canvasY = e.clientY - rect.top;
            const gridCoords = this.pixelToGrid(canvasX, canvasY);
            this.isBrushPainting = true;
            this.lastBrushPaintPos = { gridX: gridCoords.gridX, gridY: gridCoords.gridY };
            this.paintBrush(gridCoords.gridX, gridCoords.gridY);
            this.updateGeneratedCode();
            this.render();
        } else if (this.mode === 'terrain' && this.waterMode === 'lake') {
            // Lake placement is handled by handleCanvasClick, not mousedown drag
        }
    }

    handleCanvasMouseUp(e) {
        if (this.isDrawingRiver) {
            this.isDrawingRiver = false;
            this.lastRiverDragPos = null;
        }
        if (this.isBrushPainting) {
            this.isBrushPainting = false;
            this.lastBrushPaintPos = null;
        }
    }

    handleCanvasRightClick() {
        if (this.mode === 'path' && this.pathPoints.length > 0) {
            this.pathPoints.pop();
            this.updateGeneratedCode();
            this.render();
        } else if (this.mode === 'terrain') {
            if (this.waterMode === 'river') {
                if (this.riverPoints && this.riverPoints.length > 0) {
                    // Remove last waypoint from current river being drawn
                    this.riverPoints.pop();
                } else if (this.riverPaths.length > 0) {
                    // Remove the last completed river path
                    this.riverPaths.pop();
                }
            } else if (this.waterMode === 'lake') {
                // Remove last lake terrain element
                for (let i = this.terrainElements.length - 1; i >= 0; i--) {
                    if (this.terrainElements[i].type === 'water' && this.terrainElements[i].waterType === 'lake') {
                        this.terrainElements.splice(i, 1);
                        break;
                    }
                }
            } else if (this.terrainElements.length > 0) {
                this.terrainElements.pop();
            }
            this.updateGeneratedCode();
            this.render();
        }
    }

    addTerrainElement(type, gridX, gridY, customSize = null, waterType = null) {
        // Determine size based on type
        let size = customSize;
        if (size === null) {
            size = this.terrainElementSize;
        }

        const element = {
            type,
            gridX: Math.round(gridX),
            gridY: Math.round(gridY),
            size
        };
        
        // Persist selected variant so the game renders the exact chosen type
        if (type === 'vegetation') element.variant = this.selectedTreeVariant;
        else if (type === 'rock') element.variant = this.selectedRockVariant;

        // Add waterType if this is water
        if (type === 'water' && waterType) {
            element.waterType = waterType;
        }
        
        this.terrainElements.push(element);
        this._pushUndo({ type: 'terrainAdd' });
    }

    finishRiver() {
        // Store river as a waypoint array (not flattened to cells)
        // Cells are generated only on export so the river remains editable
        if (!this.riverPoints || this.riverPoints.length < 2) return;
        this.riverPaths.push([...this.riverPoints]);
        this._pushUndo({ type: 'riverPath' });
    }

    finishPath() {
        if (this.pathPoints.length < 2) {
            this.showConfirmation(
                'Invalid Path',
                'Path must have at least 2 points! You currently have ' + this.pathPoints.length + ' point(s).',
                () => {} // No action on confirm
            );
            return;
        }
        
        // Place castle at the end of the path
        const lastPathPoint = this.pathPoints[this.pathPoints.length - 1];
        this.castlePosition = {
            gridX: lastPathPoint.gridX,
            gridY: lastPathPoint.gridY
        };
        
        // Lock path editing
        this.pathLocked = true;
        this.mode = 'path'; // Keep in path mode, just locked
        this.terrainMode = null;
        
        // Hide finish path button
        const finishPathControl = document.getElementById('finishPathControl');
        if (finishPathControl) {
            finishPathControl.style.display = 'none';
        }
        
        // Deselect path mode button
        document.getElementById('drawPathBtn').classList.remove('active');
        
        const pathInfo = document.getElementById('pathInfo');
        pathInfo.textContent = 'Path finished. Castle placed at path end. You can now add terrain and export.';
        
        this.updateGeneratedCode();
        this.render();
    }
    
    onFinishPathClick() {
        this.finishPath();
    }
    
    onFinishRiverClick() {
        if (!this.riverPoints || this.riverPoints.length < 2) {
            this.showConfirmation(
                'Invalid River',
                'River must have at least 2 waypoints! You currently have ' + (this.riverPoints ? this.riverPoints.length : 0) + ' waypoint(s).',
                () => {} // No action on confirm
            );
            return;
        }
        
        // Store river as a path (waypoints only — cells are generated on export)
        this.finishRiver();
        
        // Clear current river waypoints and keep in water mode for another river
        this.riverPoints = [];
        
        // Hide finish river button
        const finishRiverControl = document.getElementById('finishRiverControl');
        if (finishRiverControl) {
            finishRiverControl.style.display = 'none';
        }
        
        // Reset river mode button
        document.getElementById('waterRiverBtn')?.classList.remove('active');
        this.waterMode = null;
        
        const pathInfo = document.getElementById('pathInfo');
        pathInfo.textContent = `River saved (${this.riverPaths.length} river${this.riverPaths.length > 1 ? 's' : ''} total). Select River again to draw another.`;
        
        this.updateGeneratedCode();
        this.render();
    }
    
    onClearClick() {
        this.showConfirmation(
            'Clear All',
            'Are you sure you want to clear the entire level? This cannot be undone.',
            () => this.clearPath()
        );
    }

    /** Records a reversible action; capped so memory can't grow unbounded over a long session. */
    _pushUndo(action) {
        this.undoStack.push(action);
        if (this.undoStack.length > 50) this.undoStack.shift();
    }

    undo() {
        const action = this.undoStack.pop();
        if (!action) return;

        switch (action.type) {
            case 'pathPoint':
                this.pathPoints.pop();
                break;
            case 'terrainAdd':
                this.terrainElements.pop();
                break;
            case 'terrainRemove':
                this.terrainElements.splice(action.index, 0, action.element);
                break;
            case 'riverPath':
                this.riverPaths.pop();
                break;
        }

        this.updateGeneratedCode();
        this.render();
    }

    clearPath() {
        this.pathPoints = [];
        this.pathLocked = false;
        this.terrainElements = [];
        this.riverPaths = [];
        this.riverPoints = [];
        this.undoStack = [];
        this.updateGeneratedCode();
        this.render();
    }

    /**
     * Shows a confirmation modal with the given title and message
     * @param {string} title - The title of the confirmation dialog
     * @param {string} message - The message to display
     * @param {function} callback - Function to call if user confirms
     */
    showConfirmation(title, message, callback) {
        this.confirmationCallback = callback;
        
        const modal = document.getElementById('confirmationModal');
        const titleEl = document.getElementById('confirmationTitle');
        const messageEl = document.getElementById('confirmationMessage');
        
        if (titleEl) titleEl.textContent = title;
        if (messageEl) messageEl.textContent = message;
        
        if (modal) {
            modal.classList.add('active');
            // Focus OK button for better UX
            document.getElementById('confirmationOk')?.focus();
        }
    }

    /**
     * Closes the confirmation modal
     */
    closeConfirmation() {
        const modal = document.getElementById('confirmationModal');
        if (modal) {
            modal.classList.remove('active');
        }
        this.confirmationCallback = null;
    }

    handleResize() {
        this.setupCanvas();
        this.render();
    }

    createDefaultWave() {
        this.waves.push({
            id: 1,
            enemyHealthMultiplier: 1.0,
            speedMultiplier: 0.70,
            spawnInterval: 1.5,
            pattern: [{ type: 'basic', count: 5 }]
        });
        this.renderWavesList();
    }

    addWave() {
        const newId = this.waves.length + 1;
        this.waves.push({
            id: newId,
            enemyHealthMultiplier: 1.0 + ((newId - 1) * 0.1),
            speedMultiplier: parseFloat((0.70 + (newId - 1) * 0.04).toFixed(2)),
            spawnInterval: Math.max(1.0, 1.5 - (newId * 0.1)),
            pattern: [{ type: 'basic', count: 5 + (newId * 3) }]
        });
        this.renderWavesList();
        this.updateGeneratedCode();
    }

    removeWave(id) {
        this.waves = this.waves.filter(w => w.id !== id);
        this.renderWavesList();
        this.updateGeneratedCode();
    }

    duplicateWave(id) {
        const waveToClone = this.waves.find(w => w.id === id);
        if (waveToClone) {
            const newId = Math.max(...this.waves.map(w => w.id), 0) + 1;
            this.waves.push({
                id: newId,
                enemyHealthMultiplier: waveToClone.enemyHealthMultiplier,
                speedMultiplier: waveToClone.speedMultiplier,
                spawnInterval: waveToClone.spawnInterval,
                pattern: waveToClone.pattern.map(e => {
                    const copy = { type: e.type, count: e.count };
                    if (e.healthMultiplier !== undefined) copy.healthMultiplier = e.healthMultiplier;
                    if (e.speedMultiplier !== undefined) copy.speedMultiplier = e.speedMultiplier;
                    return copy;
                })
            });
            this.renderWavesList();
            this.updateGeneratedCode();
        }
    }

    // Modal wave management
    openWaveModal(waveId = null) {
        this.currentEditingWaveId = waveId;
        const modal = document.getElementById('waveModal');

        if (waveId) {
            // Edit mode
            const wave = this.waves.find(w => w.id === waveId);
            document.getElementById('modalTitle').textContent = `Edit Wave ${waveId}`;
            document.getElementById('modalHealthMultiplier').value = wave.enemyHealthMultiplier.toFixed(2);
            document.getElementById('modalEnemySpeed').value = wave.speedMultiplier;
            document.getElementById('modalSpawnInterval').value = wave.spawnInterval.toFixed(2);
            
            // Load pattern
            this.refreshModalPattern(wave.pattern);
        } else {
            // Add new wave mode
            const newId = this.waves.length + 1;
            document.getElementById('modalTitle').textContent = 'Add New Wave';
            document.getElementById('modalHealthMultiplier').value = (1.0 + ((newId - 1) * 0.1)).toFixed(2);
            document.getElementById('modalEnemySpeed').value = parseFloat((0.70 + (newId - 1) * 0.04).toFixed(2));
            document.getElementById('modalSpawnInterval').value = Math.max(1.0, 1.5 - (newId * 0.1)).toFixed(2);
            
            this.refreshModalPattern([{ type: 'basic', count: 5 + (newId * 3) }]);
        }

        modal.classList.add('active');
    }

    closeWaveModal() {
        document.getElementById('waveModal').classList.remove('active');
        this.currentEditingWaveId = null;
    }

    refreshModalPattern(pattern = [{ type: 'basic', count: 5 }]) {
        const patternList = document.getElementById('modalPatternList');
        patternList.innerHTML = '';

        pattern.forEach((entry, idx) => {
            const item = document.createElement('div');
            item.className = 'pattern-item';
            const hpVal = entry.healthMultiplier !== undefined ? entry.healthMultiplier : '';
            const spdVal = entry.speedMultiplier !== undefined ? entry.speedMultiplier : '';
            item.innerHTML = `
                <select onchange="window.levelDesigner.updateModalPatternType(${idx}, this.value)">
                    ${this.enemies.map(e => `<option value="${e}" ${e === entry.type ? 'selected' : ''}>${e}</option>`).join('')}
                </select>
                <input type="number" min="1" value="${entry.count}" style="width:60px;padding:4px;background:#1a1a2a;color:#c8c8d8;border:1px solid #444;border-radius:3px" title="Count" onchange="window.levelDesigner.updateModalPatternCount(${idx}, parseInt(this.value))">
                <label style="font-size:10px;color:#888;margin:0 2px">HP:</label>
                <input type="number" min="0.1" step="0.1" value="${hpVal}" placeholder="wave" style="width:55px;padding:4px;background:#1a1a2a;color:#c8c8d8;border:1px solid #444;border-radius:3px" title="Health multiplier (blank = use wave default)" onchange="window.levelDesigner.updateModalPatternHealthMul(${idx}, this.value)">
                <label style="font-size:10px;color:#888;margin:0 2px">SPD:</label>
                <input type="number" min="0.1" step="0.05" value="${spdVal}" placeholder="wave" style="width:55px;padding:4px;background:#1a1a2a;color:#c8c8d8;border:1px solid #444;border-radius:3px" title="Speed multiplier (blank = use wave default)" onchange="window.levelDesigner.updateModalPatternSpeedMul(${idx}, this.value)">
                <button onclick="window.levelDesigner.removeModalPattern(${idx})">x</button>
            `;
            patternList.appendChild(item);
        });
    }

    getModalPatternFromDOM() {
        const items = document.querySelectorAll('#modalPatternList .pattern-item');
        return Array.from(items).map(item => {
            const inputs = item.querySelectorAll('input[type=number]');
            const entry = {
                type: item.querySelector('select').value,
                count: parseInt(inputs[0].value) || 1
            };
            const hpVal = inputs[1] ? inputs[1].value.trim() : '';
            const spdVal = inputs[2] ? inputs[2].value.trim() : '';
            if (hpVal !== '') entry.healthMultiplier = parseFloat(hpVal);
            if (spdVal !== '') entry.speedMultiplier = parseFloat(spdVal);
            return entry;
        });
    }

    updateModalPatternType(idx, value) {
        if (this.currentEditingWaveId) {
            const wave = this.waves.find(w => w.id === this.currentEditingWaveId);
            const pattern = this.getModalPatternFromDOM();
            if (pattern[idx]) pattern[idx].type = value;
            wave.pattern = pattern;
        }
    }

    updateModalPatternCount(idx, count) {
        if (this.currentEditingWaveId) {
            const wave = this.waves.find(w => w.id === this.currentEditingWaveId);
            const pattern = this.getModalPatternFromDOM();
            if (pattern[idx]) pattern[idx].count = Math.max(1, count || 1);
            wave.pattern = pattern;
        }
    }

    updateModalPatternHealthMul(idx, value) {
        if (this.currentEditingWaveId) {
            const wave = this.waves.find(w => w.id === this.currentEditingWaveId);
            const pattern = this.getModalPatternFromDOM();
            if (pattern[idx]) {
                if (value.trim() === '') {
                    delete pattern[idx].healthMultiplier;
                } else {
                    pattern[idx].healthMultiplier = parseFloat(value);
                }
            }
            wave.pattern = pattern;
        }
    }

    updateModalPatternSpeedMul(idx, value) {
        if (this.currentEditingWaveId) {
            const wave = this.waves.find(w => w.id === this.currentEditingWaveId);
            const pattern = this.getModalPatternFromDOM();
            if (pattern[idx]) {
                if (value.trim() === '') {
                    delete pattern[idx].speedMultiplier;
                } else {
                    pattern[idx].speedMultiplier = parseFloat(value);
                }
            }
            wave.pattern = pattern;
        }
    }

    removeModalPattern(idx) {
        const pattern = this.getModalPatternFromDOM();
        pattern.splice(idx, 1);
        this.refreshModalPattern(pattern);
    }

    addPatternToModal() {
        const pattern = this.getModalPatternFromDOM();
        pattern.push({ type: 'basic', count: 1 });
        this.refreshModalPattern(pattern);
    }

    saveWaveFromModal() {
        const healthMultiplier = parseFloat(document.getElementById('modalHealthMultiplier').value);
        const speedMultiplier = parseFloat(document.getElementById('modalEnemySpeed').value);
        const spawnInterval = parseFloat(document.getElementById('modalSpawnInterval').value);
        const pattern = this.getModalPatternFromDOM();

        if (this.currentEditingWaveId) {
            // Update existing wave
            const wave = this.waves.find(w => w.id === this.currentEditingWaveId);
            wave.enemyHealthMultiplier = healthMultiplier;
            wave.speedMultiplier = speedMultiplier;
            wave.spawnInterval = spawnInterval;
            wave.pattern = pattern;
        } else {
            // Add new wave - use max ID to avoid conflicts when waves are deleted
            const newId = this.waves.length > 0 ? Math.max(...this.waves.map(w => w.id), 0) + 1 : 1;
            this.waves.push({
                id: newId,
                enemyHealthMultiplier: healthMultiplier,
                speedMultiplier,
                spawnInterval,
                pattern
            });
        }

        this.closeWaveModal();
        this.renderWavesList();
        this.updateGeneratedCode();
    }

    renderWavesList() {
        const container = document.getElementById('wavesList');
        container.innerHTML = '';
        this.draggedWaveIndex = null;

        const BASE_ENEMY_HEALTH = {
            'basic': 100, 'villager': 100, 'archer': 120, 'beefyenemy': 200,
            'knight': 1500, 'shieldknight': 780, 'mage': 750, 'frog': 85,
            'earthfrog': 340, 'waterfrog': 340, 'firefrog': 340, 'airfrog': 340, 'frogking': 500
        };
        let cumulativeGold = 100;

        this.waves.forEach((wave, index) => {
            const waveCard = document.createElement('div');
            waveCard.className = 'wave-card';
            waveCard.setAttribute('draggable', 'true');
            waveCard.dataset.index = index;

            const totalCount = wave.pattern.reduce((s, e) => s + e.count, 0);
            const patternStr = wave.pattern.map(e => {
                let s = `${e.type}x${e.count}`;
                if (e.healthMultiplier !== undefined) s += `[HP:${e.healthMultiplier}x]`;
                if (e.speedMultiplier !== undefined) s += `[SPD:${e.speedMultiplier}x]`;
                return s;
            }).join(' + ');

            const waveGold = wave.pattern.reduce((sum, entry) => {
                const baseHealth = BASE_ENEMY_HEALTH[entry.type] || 100;
                const effectiveHealthMul = entry.healthMultiplier !== undefined ? entry.healthMultiplier : wave.enemyHealthMultiplier;
                return sum + Math.ceil(baseHealth * effectiveHealthMul / 10) * entry.count;
            }, 0);
            cumulativeGold += waveGold;

            waveCard.innerHTML = `
                <div class="wave-drag-handle" title="Drag to reorder">&#9776;</div>
                <div class="wave-card-info">
                    <div class="wave-card-title">Wave ${wave.id}</div>
                    <div class="wave-card-meta">Count: ${totalCount} | Health: ${wave.enemyHealthMultiplier.toFixed(2)}x | Speed: ${wave.speedMultiplier.toFixed(2)}x | ${wave.spawnInterval.toFixed(2)}s</div>
                    <div class="wave-card-meta" style="color:#90b890">Pattern: ${patternStr}</div>
                    <div class="wave-card-meta" style="color:#d4a840">Gold: +${waveGold} this wave | Cumulative: ${cumulativeGold} (start: 100)</div>
                </div>
                <div class="wave-card-actions">
                    <button onclick="window.levelDesigner.openWaveModal(${wave.id})" style="font-size:10px;padding:3px 7px">Edit</button>
                    <button onclick="window.levelDesigner.duplicateWave(${wave.id})" style="font-size:10px;padding:3px 7px" title="Duplicate">Copy</button>
                    <button onclick="window.levelDesigner.removeWave(${wave.id})" style="font-size:10px;padding:3px 7px;background:#c0392b">Del</button>
                </div>
            `;

            waveCard.addEventListener('dragstart', (e) => {
                this.draggedWaveIndex = index;
                waveCard.classList.add('wave-dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', index);
            });
            waveCard.addEventListener('dragend', () => {
                waveCard.classList.remove('wave-dragging');
                container.querySelectorAll('.wave-card').forEach(c => c.classList.remove('wave-drop-target'));
                this.draggedWaveIndex = null;
            });
            waveCard.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (this.draggedWaveIndex !== null && this.draggedWaveIndex !== index) {
                    container.querySelectorAll('.wave-card').forEach(c => c.classList.remove('wave-drop-target'));
                    waveCard.classList.add('wave-drop-target');
                }
            });
            waveCard.addEventListener('dragleave', () => {
                waveCard.classList.remove('wave-drop-target');
            });
            waveCard.addEventListener('drop', (e) => {
                e.preventDefault();
                if (this.draggedWaveIndex !== null && this.draggedWaveIndex !== index) {
                    this.reorderWaves(this.draggedWaveIndex, index);
                }
            });

            container.appendChild(waveCard);
        });
    }

    reorderWaves(fromIndex, toIndex) {
        const waves = [...this.waves];
        const [moved] = waves.splice(fromIndex, 1);
        waves.splice(toIndex, 0, moved);
        waves.forEach((w, i) => { w.id = i + 1; });
        this.waves = waves;
        this.renderWavesList();
        this.updateGeneratedCode();
    }

    paintBrush(gridX, gridY) {
        const count = Math.max(2, Math.floor(this.treeBrushSize * 2));
        const variantPool = Array.from(this.brushTreeVariants);
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.sqrt(Math.random()) * this.treeBrushSize;
            const tx = gridX + Math.cos(angle) * dist;
            const ty = gridY + Math.sin(angle) * dist;
            const cx = Math.max(0, Math.min(this.gridWidth - 1, Math.round(tx)));
            const cy = Math.max(0, Math.min(this.gridHeight - 1, Math.round(ty)));
            const size = this.treeBrushMinSize + Math.random() * Math.max(0, this.treeBrushMaxSize - this.treeBrushMinSize);
            const variant = variantPool[Math.floor(Math.random() * variantPool.length)];
            this.terrainElements.push({ type: 'vegetation', gridX: cx, gridY: cy, size, variant });
        }
    }

    render() {
        if (this.designerRenderAdapter && this.designerRenderAdapter.shim) {
            // Every draw* method below reads this.ctx (not a parameter), so the
            // shim swap-in has to happen here, around the whole pass - same
            // unmodified draw* bodies run against either target.
            const realCtx = this.ctx;
            this.designerRenderAdapter.sync(() => {
                this.ctx = this.designerRenderAdapter.shim;
                this._renderToCtx();
                this.ctx = realCtx;
            });
            return;
        }
        this._renderToCtx();
    }

    _renderToCtx() {
        // Draw background based on campaign theme
        this.drawBackground();

        // Draw grid
        this.drawGrid();

        // Draw terrain elements (before path/castle so they appear behind)
        this.drawTerrainElements();

        // Draw smooth river overlays for blended corners
        this.drawRiversSmooth();

        // Draw hovered grid cell for snapping feedback
        this.drawHoveredCell();

        // Draw path
        this.drawPath();

        // Draw river waypoints if in river mode
        if (this.mode === 'terrain' && this.waterMode === 'river' && this.riverPoints) {
            this.drawRiverPoints();
        }

        // Draw castle
        this.drawCastle();

        // Update status bar with current mode info
        this.updateStatusBar();
    }

    drawBackground() {
        const campaign = this.currentCampaign || 'forest';
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Dispatch to the correct campaign backdrop
        if (campaign === 'forest') {
            this._drawForestBackground(ctx, w, h);
        } else if (campaign === 'mountain') {
            this._drawMountainBackground(ctx, w, h);
        } else if (campaign === 'desert') {
            this._drawDesertBackground(ctx, w, h);
        } else {
            this._drawSpaceBackground(ctx, w, h);
        }

        // Edge vignette
        const vW = Math.min(w * 0.07, 70);
        const vH = Math.min(h * 0.09, 60);
        for (const [x1, y1, x2, y2, rw, rh] of [
            [0,0,vW,0,vW,h], [w,0,w-vW,0,vW,h],
            [0,0,0,vH,w,vH], [0,h,0,h-vH,w,vH]
        ]) {
            const g = ctx.createLinearGradient(x1, y1, x2, y2);
            g.addColorStop(0, 'rgba(0,0,0,0.45)');
            g.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = g;
            ctx.fillRect(Math.min(x1,x2), Math.min(y1,y2), rw, rh);
        }
    }

    generateDesignerDecorations(campaign) {
    }

    _drawForestBackground(ctx, w, h) {
        // Forest backdrop — matches game _renderForestBackdrop exactly
        // Full forest floor — top-down, no sky. Rich layered greens, dark near camera.
        const ground = ctx.createLinearGradient(0, 0, 0, h);
        ground.addColorStop(0,    '#2a6012');
        ground.addColorStop(0.32, '#1c460a');
        ground.addColorStop(0.68, '#123206');
        ground.addColorStop(1,    '#081a02');
        ctx.fillStyle = ground;
        ctx.fillRect(0, 0, w, h);

        // Large ground colour variation
        [
            [0.25, 0.18, 0.22, 'rgba(10,30,4,0.18)'],
            [0.72, 0.24, 0.20, 'rgba(10,30,4,0.14)'],
            [0.48, 0.50, 0.26, 'rgba(8,26,2,0.16)'],
            [0.12, 0.64, 0.18, 'rgba(10,30,4,0.14)'],
            [0.84, 0.58, 0.20, 'rgba(10,30,4,0.18)'],
            [0.36, 0.80, 0.22, 'rgba(8,26,2,0.13)'],
        ].forEach(([fx, fy, frad, col]) => {
            const cx = w * fx, cy = h * fy, r = w * frad;
            const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
            grd.addColorStop(0, col);
            grd.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grd;
            ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
        });

        // Dappled canopy light — warm golden pools
        [
            [0.10, 0.09, 0.11, 0.13],
            [0.42, 0.06, 0.09, 0.12],
            [0.70, 0.12, 0.10, 0.11],
            [0.90, 0.07, 0.08, 0.12],
            [0.26, 0.32, 0.10, 0.11],
            [0.60, 0.26, 0.09, 0.10],
            [0.82, 0.36, 0.10, 0.12],
            [0.08, 0.54, 0.09, 0.10],
            [0.46, 0.50, 0.11, 0.13],
            [0.74, 0.56, 0.09, 0.11],
            [0.32, 0.72, 0.10, 0.11],
            [0.64, 0.76, 0.09, 0.10],
        ].forEach(([fx, fy, frad, alpha]) => {
            const cx = w * fx, cy = h * fy, r = w * frad;
            const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
            grd.addColorStop(0, `rgba(200,195,100,${alpha})`);
            grd.addColorStop(0.50, `rgba(140,160,50,${alpha * 0.38})`);
            grd.addColorStop(1,   'rgba(60,100,10,0)');
            ctx.fillStyle = grd;
            ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
        });

        // Sparse exposed dirt patches
        [
            [0.16, 0.20, 0.08, 0.18],
            [0.52, 0.16, 0.07, 0.16],
            [0.80, 0.28, 0.09, 0.17],
            [0.06, 0.42, 0.07, 0.15],
            [0.38, 0.44, 0.08, 0.17],
            [0.68, 0.48, 0.07, 0.15],
            [0.92, 0.52, 0.08, 0.16],
            [0.24, 0.68, 0.09, 0.18],
            [0.58, 0.70, 0.07, 0.15],
            [0.84, 0.74, 0.08, 0.17],
            [0.14, 0.84, 0.07, 0.14],
            [0.46, 0.86, 0.09, 0.16],
        ].forEach(([fx, fy, frad, alpha]) => {
            const cx = w * fx, cy = h * fy, r = w * frad;
            const t = Math.abs(Math.sin(fx * 19.1 + fy * 11.3));
            const rb = 100 + Math.floor(t * 30);
            const gb = 62 + Math.floor(t * 18);
            const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
            grd.addColorStop(0, `rgba(${rb},${gb},18,${alpha})`);
            grd.addColorStop(1, `rgba(${rb},${gb},18,0)`);
            ctx.fillStyle = grd;
            ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
        });

        // Leaf litter — scattered pixel-sized dots
        [
            [0.06,0.08],[0.14,0.13],[0.24,0.06],[0.35,0.11],[0.46,0.05],[0.57,0.10],[0.68,0.07],[0.79,0.12],[0.90,0.06],[0.97,0.10],
            [0.04,0.22],[0.13,0.28],[0.22,0.20],[0.32,0.26],[0.44,0.18],[0.54,0.25],[0.65,0.21],[0.76,0.27],[0.87,0.19],[0.95,0.24],
            [0.09,0.38],[0.20,0.34],[0.30,0.40],[0.41,0.36],[0.53,0.33],[0.62,0.39],[0.73,0.35],[0.83,0.41],[0.93,0.37],
            [0.07,0.55],[0.18,0.60],[0.28,0.52],[0.40,0.58],[0.51,0.54],[0.61,0.60],[0.72,0.53],[0.82,0.59],[0.92,0.55],
            [0.11,0.70],[0.23,0.75],[0.36,0.68],[0.48,0.73],[0.60,0.67],[0.71,0.74],[0.81,0.69],[0.94,0.72],
            [0.08,0.84],[0.20,0.88],[0.34,0.82],[0.47,0.87],[0.59,0.83],[0.72,0.89],[0.85,0.84],[0.96,0.86],
        ].forEach(([fx, fy]) => {
            const t = Math.abs(Math.sin(fx * 37.1 + fy * 23.9));
            let r, g, b;
            if (t < 0.33)      { r = 130; g = 78;  b = 20; }
            else if (t < 0.66) { r = 112; g = 58;  b = 12; }
            else               { r = 96;  g = 82;  b = 28; }
            const alpha = 0.22 + t * 0.18;
            const sz = t < 0.25 ? 2 : 1;
            ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
            ctx.fillRect(Math.floor(w * fx), Math.floor(h * fy), sz, sz);
        });

        // Foreground depth shadow
        const vgn = ctx.createLinearGradient(0, h * 0.78, 0, h);
        vgn.addColorStop(0, 'rgba(0,8,0,0)');
        vgn.addColorStop(1, 'rgba(0,8,0,0.46)');
        ctx.fillStyle = vgn;
        ctx.fillRect(0, h * 0.78, w, h * 0.22);

        // Side vignette
        const vigL = ctx.createLinearGradient(0, 0, w * 0.08, 0);
        vigL.addColorStop(0, 'rgba(0,12,0,0.28)');
        vigL.addColorStop(1, 'rgba(0,12,0,0)');
        ctx.fillStyle = vigL;
        ctx.fillRect(0, 0, w * 0.08, h);
        const vigR = ctx.createLinearGradient(w, 0, w * 0.92, 0);
        vigR.addColorStop(0, 'rgba(0,12,0,0.28)');
        vigR.addColorStop(1, 'rgba(0,12,0,0)');
        ctx.fillStyle = vigR;
        ctx.fillRect(w * 0.92, 0, w * 0.08, h);
    }

    _drawMountainBackground(ctx, w, h) {
        // Base: mixed exposed rock and compacted snow — deep blue-grey at bottom, pale icy at top
        const ground = ctx.createLinearGradient(0, 0, 0, h);
        ground.addColorStop(0,    '#dce8f0');
        ground.addColorStop(0.25, '#c2d2e2');
        ground.addColorStop(0.58, '#9aaec4');
        ground.addColorStop(1,    '#7890a8');
        ctx.fillStyle = ground;
        ctx.fillRect(0, 0, w, h);

        // Atmospheric light — pale haze at the far/top of the mountain
        const haze = ctx.createLinearGradient(0, 0, 0, h * 0.22);
        haze.addColorStop(0, 'rgba(240,248,255,0.55)');
        haze.addColorStop(1, 'rgba(240,248,255,0)');
        ctx.fillStyle = haze;
        ctx.fillRect(0, 0, w, h * 0.22);

        // Rock strata bands — jagged horizontal ledges that define mountain rockface layers.
        // Each band: a dark shadow underside + thin bright snow-dusted top edge.
        const strata = [
            // [fy, ampFrac, cycles, phase, shadowAlpha, lw]
            [0.18, 0.010, 2.1, 1.40, 0.18, h * 0.018],
            [0.28, 0.013, 2.4, 3.20, 0.17, h * 0.022],
            [0.38, 0.014, 1.9, 0.70, 0.18, h * 0.024],
            [0.48, 0.016, 2.3, 2.60, 0.19, h * 0.026],
            [0.58, 0.017, 2.0, 1.10, 0.18, h * 0.028],
            [0.68, 0.018, 2.2, 3.80, 0.19, h * 0.030],
            [0.80, 0.020, 1.8, 2.00, 0.18, h * 0.032],
        ];
        strata.forEach(([fy, ampFrac, cycles, phase, alpha, lw]) => {
            const baseY = h * fy;
            const amp = h * ampFrac;
            const freq = Math.PI * 2 * cycles;
            // Slightly jagged: mix two sine waves at non-harmonic frequencies
            const getY = (xf) =>
                baseY
                + Math.sin(xf * freq + phase) * amp
                + Math.sin(xf * freq * 0.73 + phase * 1.6) * amp * 0.44
                + Math.sin(xf * freq * 1.37 + phase * 0.9) * amp * 0.22;

            // Rock shadow beneath the ledge
            ctx.strokeStyle = `rgba(54,70,90,${alpha})`;
            ctx.lineWidth = lw;
            ctx.lineCap = 'round';
            ctx.beginPath();
            for (let i = 0; i <= w; i += 3) {
                const y = getY(i / w);
                if (i === 0) ctx.moveTo(i, y); else ctx.lineTo(i, y);
            }
            ctx.stroke();

            // Snow-dusted top of ledge — bright thin line just above the shadow
            ctx.strokeStyle = `rgba(225,238,250,${alpha * 0.65})`;
            ctx.lineWidth = lw * 0.38;
            ctx.beginPath();
            for (let i = 0; i <= w; i += 3) {
                const y = getY(i / w) - lw * 1.10;
                if (i === 0) ctx.moveTo(i, y); else ctx.lineTo(i, y);
            }
            ctx.stroke();
        });

        // Snow field fills — pale translucent wedges that pool above each strata line,
        // giving the impression of snow settling into rock hollows.
        ctx.lineCap = 'butt';
        strata.forEach(([fy, ampFrac, cycles, phase, , lw]) => {
            const baseY = h * fy;
            const amp = h * ampFrac;
            const freq = Math.PI * 2 * cycles;
            const getY = (xf) =>
                baseY
                + Math.sin(xf * freq + phase) * amp
                + Math.sin(xf * freq * 0.73 + phase * 1.6) * amp * 0.44
                + Math.sin(xf * freq * 1.37 + phase * 0.9) * amp * 0.22;
            const snowGrd = ctx.createLinearGradient(0, baseY - lw * 5, 0, baseY);
            snowGrd.addColorStop(0, 'rgba(228,242,255,0)');
            snowGrd.addColorStop(1, 'rgba(228,242,255,0.22)');
            ctx.fillStyle = snowGrd;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            for (let i = 0; i <= w; i += 3) {
                const y = getY(i / w);
                if (i === 0) ctx.lineTo(i, y); else ctx.lineTo(i, y);
            }
            ctx.lineTo(w, 0);
            ctx.closePath();
            ctx.fill();
        });

        // Wind-blown snow texture — fine pale horizontal ripples across the whole surface
        for (let row = 0; row < 28; row++) {
            const fy = 0.08 + row * 0.032;
            const baseY = h * fy;
            const phase = fy * 12.7 + 0.9;
            const amp = h * (0.002 + Math.abs(Math.sin(fy * 7.3)) * 0.0018);
            const alpha = 0.038 + Math.abs(Math.sin(fy * 4.9)) * 0.030;
            ctx.strokeStyle = `rgba(200,220,240,${alpha})`;
            ctx.lineWidth = 0.7;
            ctx.lineCap = 'butt';
            ctx.beginPath();
            for (let i = 0; i <= w; i += 4) {
                const y = baseY + Math.sin(i / w * Math.PI * 4.8 + phase) * amp;
                if (i === 0) ctx.moveTo(i, y); else ctx.lineTo(i, y);
            }
            ctx.stroke();
        }

        // Foreground depth shadow
        const vgn = ctx.createLinearGradient(0, h * 0.80, 0, h);
        vgn.addColorStop(0, 'rgba(30,50,80,0)');
        vgn.addColorStop(1, 'rgba(30,50,80,0.32)');
        ctx.fillStyle = vgn;
        ctx.fillRect(0, h * 0.80, w, h * 0.20);

        // Side vignette for painterly framing
        const vigL = ctx.createLinearGradient(0, 0, w * 0.09, 0);
        vigL.addColorStop(0, 'rgba(40,60,90,0.22)');
        vigL.addColorStop(1, 'rgba(40,60,90,0)');
        ctx.fillStyle = vigL;
        ctx.fillRect(0, 0, w * 0.09, h);
        const vigR = ctx.createLinearGradient(w, 0, w * 0.91, 0);
        vigR.addColorStop(0, 'rgba(40,60,90,0.22)');
        vigR.addColorStop(1, 'rgba(40,60,90,0)');
        ctx.fillStyle = vigR;
        ctx.fillRect(w * 0.91, 0, w * 0.09, h);
    }

    _drawDesertBackground(ctx, w, h) {
        // Base sand — muted dune palette: dusty cream at distant horizon, warm sienna near camera
        const ground = ctx.createLinearGradient(0, 0, 0, h);
        ground.addColorStop(0,    '#e0d0a2');
        ground.addColorStop(0.28, '#d0b46e');
        ground.addColorStop(0.60, '#bc9040');
        ground.addColorStop(1,    '#9e7228');
        ctx.fillStyle = ground;
        ctx.fillRect(0, 0, w, h);

        // Atmospheric haze lightens the distant horizon
        const haze = ctx.createLinearGradient(0, 0, 0, h * 0.24);
        haze.addColorStop(0, 'rgba(245,230,195,0.50)');
        haze.addColorStop(1, 'rgba(245,230,195,0)');
        ctx.fillStyle = haze;
        ctx.fillRect(0, 0, w, h * 0.24);

        // Dune ridge lines — sweeping sinusoidal stripes mimicking aerial dune topography.
        // Each ridge has a shadow trough and a lighter highlight crest just above it.
        const ridges = [
            // [fy, ampFrac, cycleCount, phase, shadowAlpha, lineWidth]
            [0.20, 0.012, 1.6, 2.30, 0.16, h * 0.016],
            [0.30, 0.015, 1.8, 1.70, 0.15, h * 0.018],
            [0.40, 0.016, 1.5, 3.10, 0.15, h * 0.020],
            [0.50, 0.018, 1.9, 0.80, 0.16, h * 0.022],
            [0.60, 0.020, 1.6, 2.80, 0.15, h * 0.024],
            [0.70, 0.022, 1.8, 1.40, 0.16, h * 0.026],
            [0.82, 0.024, 1.7, 3.50, 0.15, h * 0.028],
        ];
        ridges.forEach(([fy, ampFrac, cycles, phase, alpha, lw]) => {
            const baseY = h * fy;
            const amp = h * ampFrac;
            const freq = Math.PI * 2 * cycles;
            const getY = (xf) =>
                baseY
                + Math.sin(xf * freq + phase) * amp
                + Math.sin(xf * freq * 0.61 + phase * 1.9) * amp * 0.36;

            // Shadow trough
            ctx.strokeStyle = `rgba(132,82,10,${alpha})`;
            ctx.lineWidth = lw;
            ctx.lineCap = 'round';
            ctx.beginPath();
            for (let i = 0; i <= w; i += 3) {
                const y = getY(i / w);
                if (i === 0) ctx.moveTo(i, y); else ctx.lineTo(i, y);
            }
            ctx.stroke();

            // Highlight crest just above the shadow trough
            ctx.strokeStyle = `rgba(232,200,132,${alpha * 0.60})`;
            ctx.lineWidth = lw * 0.42;
            ctx.beginPath();
            for (let i = 0; i <= w; i += 3) {
                const y = getY(i / w) - lw * 1.15;
                if (i === 0) ctx.moveTo(i, y); else ctx.lineTo(i, y);
            }
            ctx.stroke();
        });

        // Fine wind ripple texture — closely spaced subtle wavy lines between ridges
        ctx.lineCap = 'butt';
        for (let row = 0; row < 30; row++) {
            const fy = 0.12 + row * 0.028;
            const baseY = h * fy;
            const phase = fy * 15.1 + 1.2;
            const amp = h * (0.003 + Math.abs(Math.sin(fy * 8.9)) * 0.0025);
            const alpha = 0.050 + Math.abs(Math.sin(fy * 5.7)) * 0.038;
            ctx.strokeStyle = `rgba(145,90,16,${alpha})`;
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            for (let i = 0; i <= w; i += 4) {
                const y = baseY + Math.sin(i / w * Math.PI * 5.4 + phase) * amp;
                if (i === 0) ctx.moveTo(i, y); else ctx.lineTo(i, y);
            }
            ctx.stroke();
        }

        // Foreground depth shadow
        const vgn = ctx.createLinearGradient(0, h * 0.80, 0, h);
        vgn.addColorStop(0, 'rgba(78,40,4,0)');
        vgn.addColorStop(1, 'rgba(78,40,4,0.30)');
        ctx.fillStyle = vgn;
        ctx.fillRect(0, h * 0.80, w, h * 0.20);

        // Side vignette for painterly framing
        const vigL = ctx.createLinearGradient(0, 0, w * 0.09, 0);
        vigL.addColorStop(0, 'rgba(105,62,12,0.24)');
        vigL.addColorStop(1, 'rgba(105,62,12,0)');
        ctx.fillStyle = vigL;
        ctx.fillRect(0, 0, w * 0.09, h);
        const vigR = ctx.createLinearGradient(w, 0, w * 0.91, 0);
        vigR.addColorStop(0, 'rgba(105,62,12,0.24)');
        vigR.addColorStop(1, 'rgba(105,62,12,0)');
        ctx.fillStyle = vigR;
        ctx.fillRect(w * 0.91, 0, w * 0.09, h);
    }

    _drawSpaceBackground(ctx, w, h) {
        // Base: near-void deep space ground — very dark indigo-black
        const ground = ctx.createLinearGradient(0, 0, 0, h);
        ground.addColorStop(0,    '#0e1428');
        ground.addColorStop(0.42, '#0a1020');
        ground.addColorStop(1,    '#060c18');
        ctx.fillStyle = ground;
        ctx.fillRect(0, 0, w, h);

        // Nebula gas clouds — 4 large radial gradient blobs, very faint and sparse.
        // These give the ground a sense of alien mineral luminescence without crowding the field.
        [
            [0.18, 0.24, 0.24, 'rgba(40,80,160,0.11)', 'rgba(40,80,160,0)'],
            [0.66, 0.36, 0.20, 'rgba(80,40,140,0.09)', 'rgba(80,40,140,0)'],
            [0.40, 0.70, 0.22, 'rgba(20,100,120,0.10)', 'rgba(20,100,120,0)'],
            [0.86, 0.58, 0.18, 'rgba(55,30,110,0.08)', 'rgba(55,30,110,0)'],
        ].forEach(([fx, fy, frad, inner, outer]) => {
            const cx = w * fx, cy = h * fy;
            const r = w * frad;
            const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
            grd.addColorStop(0, inner);
            grd.addColorStop(1, outer);
            ctx.fillStyle = grd;
            ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
        });

        // Crater rings — partial thin arcs suggesting ancient impact sites.
        // Sparse and low-opacity so they read as texture, not competing shapes.
        [
            [0.14, 0.16, 0.062, 0.10, Math.PI * 0.15, Math.PI * 1.45],
            [0.72, 0.30, 0.048, 0.09, Math.PI * 1.50, Math.PI * 2.80],
            [0.44, 0.54, 0.056, 0.09, Math.PI * 0.60, Math.PI * 1.80],
            [0.88, 0.68, 0.042, 0.08, Math.PI * 0.25, Math.PI * 1.60],
            [0.28, 0.80, 0.052, 0.08, Math.PI * 1.20, Math.PI * 2.50],
            [0.58, 0.12, 0.050, 0.09, Math.PI * 0.80, Math.PI * 2.00],
        ].forEach(([fx, fy, frad, alpha, startAng, endAng]) => {
            const cx = w * fx, cy = h * fy;
            const r  = w * frad;
            // Outer rim shadow
            ctx.strokeStyle = `rgba(20,50,100,${alpha})`;
            ctx.lineWidth = 2.0;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.arc(cx, cy, r, startAng, endAng);
            ctx.stroke();
            // Inner bright rim
            ctx.strokeStyle = `rgba(100,170,240,${alpha * 0.40})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.arc(cx, cy, r * 0.86, startAng, endAng);
            ctx.stroke();
        });

        // Distant star field (geological glints on the alien surface)
        // Pixel-sized dots only, concentrated in the distant top half, thinning toward camera.
        // No lines — purely pointillist.
        [
            [0.04,0.03],[0.13,0.07],[0.23,0.02],[0.33,0.09],[0.44,0.04],[0.55,0.08],[0.67,0.03],[0.77,0.07],[0.89,0.02],[0.97,0.08],
            [0.08,0.14],[0.20,0.18],[0.29,0.12],[0.39,0.20],[0.50,0.16],[0.61,0.19],[0.71,0.13],[0.81,0.20],[0.93,0.15],
            [0.06,0.27],[0.16,0.31],[0.27,0.25],[0.37,0.33],[0.48,0.28],[0.59,0.32],[0.69,0.26],[0.80,0.30],[0.91,0.24],
            [0.11,0.41],[0.25,0.45],[0.40,0.38],[0.54,0.44],[0.66,0.39],[0.79,0.43],[0.95,0.37],
        ].forEach(([fx, fy]) => {
            const bright = 150 + Math.floor(Math.abs(Math.sin(fx * 31 + fy * 17)) * 100);
            const sz = Math.abs(Math.sin(fx * 41 + fy * 23)) < 0.28 ? 1.5 : 0.9;
            ctx.fillStyle = `rgba(${bright},${Math.floor(bright * 0.88)},${Math.min(255, bright + 40)},0.62)`;
            ctx.fillRect(Math.floor(w * fx), Math.floor(h * fy), sz, sz);
        });

        // Foreground depth shadow
        const vgn = ctx.createLinearGradient(0, h * 0.78, 0, h);
        vgn.addColorStop(0, 'rgba(4,8,18,0)');
        vgn.addColorStop(1, 'rgba(4,8,18,0.44)');
        ctx.fillStyle = vgn;
        ctx.fillRect(0, h * 0.78, w, h * 0.22);

        // Side vignette
        const vigL = ctx.createLinearGradient(0, 0, w * 0.08, 0);
        vigL.addColorStop(0, 'rgba(6,10,24,0.30)');
        vigL.addColorStop(1, 'rgba(6,10,24,0)');
        ctx.fillStyle = vigL;
        ctx.fillRect(0, 0, w * 0.08, h);
        const vigR = ctx.createLinearGradient(w, 0, w * 0.92, 0);
        vigR.addColorStop(0, 'rgba(6,10,24,0.30)');
        vigR.addColorStop(1, 'rgba(6,10,24,0)');
        ctx.fillStyle = vigR;
        ctx.fillRect(w * 0.92, 0, w * 0.08, h);
    }

    getVisualConfigFromForm() {
        const theme = CampaignThemeConfig.getTheme(this.currentCampaign);
        return theme ? theme.pathColors : {};
    }

    updateStatusBar() {
        const pathInfo = document.getElementById('pathInfo');
        if (!pathInfo) return;

        if (this.mode === null) {
            pathInfo.textContent = 'Select a tool to begin.';
            return;
        }

        if (this.mode === 'deleteTerrain') {
            const count = this.terrainElements.filter(e => e.type === 'vegetation' || e.type === 'rock').length;
            pathInfo.textContent = `Delete mode — hover over a tree or rock and click to remove it. Total: ${count}`;
            return;
        }

        if (this.mode === 'path') {
            if (this.pathLocked) {
                pathInfo.textContent = `Path finished (${this.pathPoints.length} waypoints). Castle placed at path end. Add terrain then export.`;
            } else {
                const c = this.pathPoints.length;
                pathInfo.textContent = `Path mode — ${c} waypoint${c !== 1 ? 's' : ''} placed. Right-click to remove last. Click "Finish Path" when done.`;
            }
            return;
        }

        if (this.mode === 'terrain' && this.terrainMode) {
            if (this.terrainMode === 'vegetation') {
                const count = this.terrainElements.filter(e => e.type === 'vegetation').length;
                const brushStr = this.treeBrushActive ? ` | Brush on (radius: ${this.treeBrushSize})` : '';
                pathInfo.textContent = `Trees — Click to place${brushStr}. Right-click to erase. Placed: ${count}`;
            } else if (this.terrainMode === 'rock') {
                const count = this.terrainElements.filter(e => e.type === 'rock').length;
                pathInfo.textContent = `Rocks — Click to place. Right-click to erase. Placed: ${count}`;
            } else if (this.terrainMode === 'water') {
                if (this.waterMode === 'river') {
                    const pts = this.riverPoints ? this.riverPoints.length : 0;
                    pathInfo.textContent = `River — Drawing: ${pts} pt${pts !== 1 ? 's' : ''} \u2022 ${this.riverPaths.length} saved. Right-click to remove last. Click "Finish River" when done.`;
                } else if (this.waterMode === 'lake') {
                    const count = this.terrainElements.filter(e => e.type === 'water' && e.waterType === 'lake').length;
                    pathInfo.textContent = `Lakes — Click to place. Use Size slider to control lake size. Placed: ${count}`;
                } else {
                    pathInfo.textContent = 'Water — Select River or Lake sub-mode from toolbar.';
                }
            }
        }
    }

    drawGrid() {
        this.ctx.strokeStyle = '#444444';
        this.ctx.lineWidth = 0.5;
        this.ctx.globalAlpha = 0.07;

        const cellWidthPixels = this.canvas.width / this.gridWidth;
        const cellHeightPixels = this.canvas.height / this.gridHeight;

        for (let i = 0; i <= this.gridWidth; i++) {
            const x = i * cellWidthPixels;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        for (let i = 0; i <= this.gridHeight; i++) {
            const y = i * cellHeightPixels;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }

        this.ctx.globalAlpha = 1;
    }

    drawHoveredCell() {
        if (this.mode === 'deleteTerrain') {
            this._drawDeleteHover();
            return;
        }
        if (!this.hoveredGridCell) return;

        const cellWidthPixels = this.canvas.width / this.gridWidth;
        const cellHeightPixels = this.canvas.height / this.gridHeight;

        const { gridX, gridY } = this.hoveredGridCell;
        const x = gridX * cellWidthPixels;
        const y = gridY * cellHeightPixels;

        if (this.mode === 'terrain' && this.terrainMode === 'vegetation' && this.treeBrushActive) {
            // Draw brush radius circle preview
            const avgCell = (cellWidthPixels + cellHeightPixels) / 2;
            const brushRadiusPx = this.treeBrushSize * avgCell;
            this.ctx.strokeStyle = 'rgba(100, 220, 100, 0.8)';
            this.ctx.lineWidth = 1.5;
            this.ctx.setLineDash([4, 4]);
            this.ctx.beginPath();
            this.ctx.arc(x, y, brushRadiusPx, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
            this.ctx.fillStyle = 'rgba(100, 220, 100, 0.07)';
            this.ctx.beginPath();
            this.ctx.arc(x, y, brushRadiusPx, 0, Math.PI * 2);
            this.ctx.fill();
        } else {
            // Draw a highlight circle at the hovered cell position
            this.ctx.fillStyle = 'rgba(255, 200, 100, 0.6)';
            this.ctx.beginPath();
            this.ctx.arc(x, y, 12, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw a subtle cell outline
            this.ctx.strokeStyle = 'rgba(255, 200, 100, 0.8)';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x - cellWidthPixels / 2, y - cellHeightPixels / 2, cellWidthPixels, cellHeightPixels);
        }
    }

    drawPath() {
        if (this.pathPoints.length === 0) return;

        const cW = this.canvas.width / this.gridWidth;
        const cH = this.canvas.height / this.gridHeight;
        const config = this.getVisualConfigFromForm();
        const pathColor = config.pathBaseColor;
        const pathWidthPixels = Math.min(cW, cH) * 2.0; // 2 grid cells wide — matches in-game

        // Convert grid waypoints to canvas pixel coords
        const pixelPoints = this.pathPoints.map(p => ({
            x: p.gridX * cW,
            y: p.gridY * cH
        }));

        // Invalidate path texture cache when waypoints change
        const hash = this.pathPoints.map(p => `${p.gridX.toFixed(2)},${p.gridY.toFixed(2)}`).join('|');
        if (hash !== this.designerPathHash) {
            this.designerPathHash = hash;
            this.designerPathTextureGenerated = false;
        }
        if (!this.designerPathTextureGenerated) {
            this.generateDesignerPathTexture(pixelPoints, pathWidthPixels, config);
        }

        if (pixelPoints.length >= 2) {
            const ctx = this.ctx;

            // Clean path rendering: shadow, border, main fill

            // Layer 1: Drop shadow for depth
            ctx.strokeStyle = 'rgba(40,30,25,0.5)';
            ctx.lineWidth = pathWidthPixels + 8;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(pixelPoints[0].x + 3, pixelPoints[0].y + 3);
            for (let i = 1; i < pixelPoints.length; i++) ctx.lineTo(pixelPoints[i].x + 3, pixelPoints[i].y + 3);
            ctx.stroke();

            // Layer 2: Dark border edge — clearly defines path boundary
            const bc2 = this.designerHexToRgba(pathColor, 1);
            ctx.strokeStyle = `rgba(${Math.floor(bc2.r*0.52)},${Math.floor(bc2.g*0.52)},${Math.floor(bc2.b*0.52)},0.95)`;
            ctx.lineWidth = pathWidthPixels + 6;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(pixelPoints[0].x, pixelPoints[0].y);
            for (let i = 1; i < pixelPoints.length; i++) ctx.lineTo(pixelPoints[i].x, pixelPoints[i].y);
            ctx.stroke();

            // Layer 3: Main road surface
            ctx.strokeStyle = pathColor;
            ctx.lineWidth = pathWidthPixels;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(pixelPoints[0].x, pixelPoints[0].y);
            for (let i = 1; i < pixelPoints.length; i++) ctx.lineTo(pixelPoints[i].x, pixelPoints[i].y);
            ctx.stroke();
        }

        // Edge vegetation
        if (pixelPoints.length >= 2) {
            this.drawDesignerPathEdge(pixelPoints, pathWidthPixels, cW, cH, config);
        }

        // START marker (designer helper — kept for usability)
        const s = pixelPoints[0];
        this.ctx.fillStyle = '#7ae881';
        this.ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(s.x, s.y, 10, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        this.ctx.fillStyle = '#000';
        this.ctx.font = 'bold 10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('S', s.x, s.y);

        // During editing — show numbered waypoint dots so the designer can see/edit points
        if (!this.pathLocked) {
            this.pathPoints.forEach((point, idx) => {
                if (idx === 0) return;
                const x = point.gridX * cW;
                const y = point.gridY * cH;
                const isLast = idx === this.pathPoints.length - 1;
                this.ctx.fillStyle = isLast ? '#ffaa44' : 'rgba(255,255,255,0.75)';
                this.ctx.strokeStyle = 'rgba(0,0,0,0.7)';
                this.ctx.lineWidth = 1.5;
                this.ctx.beginPath();
                this.ctx.arc(x, y, 6, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
                this.ctx.fillStyle = '#000';
                this.ctx.font = 'bold 8px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(idx + 1, x, y);
            });

            // Live preview: dashed line from last waypoint to cursor
            if (this.pathPoints.length > 0 && this.currentMouseGridPos) {
                const last = this.pathPoints[this.pathPoints.length - 1];
                const lx = last.gridX * cW, ly = last.gridY * cH;
                const mx = this.currentMouseGridPos.gridX * cW;
                const my = this.currentMouseGridPos.gridY * cH;
                this.ctx.setLineDash([8, 5]);
                this.ctx.strokeStyle = 'rgba(88,196,220,0.70)';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath(); this.ctx.moveTo(lx, ly); this.ctx.lineTo(mx, my); this.ctx.stroke();
                this.ctx.setLineDash([]);
                this.ctx.fillStyle = 'rgba(88,196,220,0.45)';
                this.ctx.beginPath(); this.ctx.arc(mx, my, 8, 0, Math.PI * 2); this.ctx.fill();
                this.ctx.strokeStyle = 'rgba(88,196,220,0.85)';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath(); this.ctx.arc(mx, my, 8, 0, Math.PI * 2); this.ctx.stroke();
            }
        }
    }

    /**
     * Generate path texture elements (dirt clumps, stones, leaves) for the designer canvas.
     * Mirrors LevelBase.generatePathTexture() using canvas-pixel coords.
     */
    generateDesignerPathTexture(pixelPoints, pathWidthPixels, config) {
        this.designerPathTexture = [];
        this.designerPathLeaves = [];

        const spacing = 15; // same as LevelBase default pathTextureSpacing
        for (let i = 0; i < pixelPoints.length - 1; i++) {
            const start = pixelPoints[i], end = pixelPoints[i + 1];
            const dist = Math.hypot(end.x - start.x, end.y - start.y);
            const elements = Math.floor(dist / spacing);
            for (let j = 0; j < elements; j++) {
                const t = j / elements;
                const bx = start.x + (end.x - start.x) * t;
                const by = start.y + (end.y - start.y) * t;
                const count = Math.random() < 0.6 ? 1 : 2;
                for (let k = 0; k < count; k++) {
                    const ox = (Math.random() - 0.5) * pathWidthPixels * 0.8;
                    const oy = (Math.random() - 0.5) * pathWidthPixels * 0.8;
                    const sz = Math.random() * 6 + 2;
                    const shapeType = Math.floor(Math.random() * 4);
                    let stoneShape = null;
                    if (shapeType === 3) {
                        const sides = 5 + Math.floor(Math.random() * 3);
                        stoneShape = [];
                        for (let s2 = 0; s2 < sides; s2++) {
                            const angle = (s2 / sides) * Math.PI * 2;
                            stoneShape.push({ x: Math.cos(angle) * sz * (0.7 + Math.random() * 0.3), y: Math.sin(angle) * sz * (0.7 + Math.random() * 0.3) });
                        }
                    }
                    this.designerPathTexture.push({ x: bx + ox, y: by + oy, size: sz, type: shapeType, rotation: Math.random() * Math.PI * 2, shade: Math.random() * 0.5 + 0.5, stoneShape });
                }
            }
        }

        const leafCount = Math.floor(pixelPoints.length * 0.8);
        for (let i = 0; i < leafCount; i++) {
            const idx = Math.floor(Math.random() * (pixelPoints.length - 1));
            const t = Math.random();
            const ps = pixelPoints[idx], pe = pixelPoints[idx + 1];
            const x = ps.x + (pe.x - ps.x) * t + (Math.random() - 0.5) * pathWidthPixels * 0.6;
            const y = ps.y + (pe.y - ps.y) * t + (Math.random() - 0.5) * pathWidthPixels * 0.6;
            this.designerPathLeaves.push({
                x, y,
                size: Math.random() * 8 + 4,
                rotation: Math.random() * Math.PI * 2,
                color: Math.random() < 0.5 ? 'rgba(160,82,45,0.6)' : 'rgba(139,115,85,0.6)'
            });
        }

        this.designerPathTextureGenerated = true;
    }

    /**
     * Draw edge vegetation along the path boundary.
     * Mirrors LevelBase.renderPathEdge() using the designer coordinate system.
     */
    drawDesignerPathEdge(pixelPoints, pathWidthPixels, cW, cH, config) {
        const ctx = this.ctx;
        // Build a set of occupied path cells (grid coords)
        const pathCells = new Set();
        for (let i = 0; i < pixelPoints.length - 1; i++) {
            const ps = pixelPoints[i], pe = pixelPoints[i + 1];
            const dx = pe.x - ps.x, dy = pe.y - ps.y;
            const dist = Math.hypot(dx, dy);
            const steps = Math.ceil(dist / (cW / 2));
            for (let step = 0; step <= steps; step++) {
                const t = step / steps;
                const gx = Math.floor((ps.x + dx * t) / cW);
                const gy = Math.floor((ps.y + dy * t) / cH);
                for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) {
                    const cx = gx + ox, cy = gy + oy;
                    if (cx < 0 || cy < 0 || cx >= this.gridWidth || cy >= this.gridHeight) continue;
                    const ccx = (cx + 0.5) * cW, ccy = (cy + 0.5) * cH;
                    const pdx = pe.x - ps.x, pdy = pe.y - ps.y;
                    const plen = Math.hypot(pdx, pdy);
                    if (plen === 0) continue;
                    const t2 = Math.max(0, Math.min(1, ((ccx - ps.x) * pdx + (ccy - ps.y) * pdy) / (plen * plen)));
                    const clX = ps.x + t2 * pdx, clY = ps.y + t2 * pdy;
                    if (Math.hypot(ccx - clX, ccy - clY) <= pathWidthPixels * 0.35) pathCells.add(`${cx},${cy}`);
                }
            }
        }
        // Find edge cells
        const edgeCells = new Set();
        pathCells.forEach(key => {
            const [cx, cy] = key.split(',').map(Number);
            for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                if (!pathCells.has(`${cx+dx},${cy+dy}`)) { edgeCells.add(key); return; }
            }
        });
        // Place vegetation on edge cells
        const processed = new Set();
        edgeCells.forEach(key => {
            const [cx, cy] = key.split(',').map(Number);
            const ck = `${Math.floor(cx/2)},${Math.floor(cy/2)}`;
            if (processed.has(ck)) return;
            const seed = (cx * 73856093) ^ (cy * 19349663);
            if (Math.abs(Math.sin(seed * 0.007)) > 0.4) {
                processed.add(ck);
                const vx = (cx + 0.5) * cW + (Math.sin(seed * 0.01) - 0.5) * cW * 0.4;
                const vy = (cy + 0.5) * cH + (Math.cos(seed * 0.015) - 0.5) * cH * 0.3;
                const type = Math.floor(Math.abs(Math.sin(seed * 0.005)) * 3);
                switch (type) {
                    case 0: // Bush
                        ctx.fillStyle = config.edgeBushColor;
                        ctx.beginPath(); ctx.arc(vx, vy, 6, 0, Math.PI * 2); ctx.fill();
                        ctx.fillStyle = config.edgeBushColor.replace('#', '#') + 'aa'; // slightly lighter
                        ctx.fillStyle = 'rgba(40,160,40,0.7)';
                        ctx.beginPath(); ctx.arc(vx - 4, vy - 3, 4, 0, Math.PI * 2); ctx.fill();
                        ctx.beginPath(); ctx.arc(vx + 4, vy - 3, 4, 0, Math.PI * 2); ctx.fill();
                        break;
                    case 1: // Rock
                        ctx.fillStyle = config.edgeRockColor;
                        ctx.beginPath(); ctx.arc(vx, vy, 5, 0, Math.PI * 2); ctx.fill();
                        ctx.strokeStyle = '#696969'; ctx.lineWidth = 1; ctx.stroke();
                        ctx.fillStyle = '#969696';
                        ctx.beginPath(); ctx.arc(vx - 1.5, vy - 1.5, 2, 0, Math.PI * 2); ctx.fill();
                        break;
                    case 2: // Grass clumps — or pebbles for desert
                        if ((this.currentCampaign || 'forest') === 'desert') {
                            // Pebble cluster — no stars on desert path
                            ctx.fillStyle = config.edgeRockColor || '#b09060';
                            ctx.beginPath(); ctx.ellipse(vx - 3, vy + 1, 4.5, 2.8, 0.3, 0, Math.PI * 2); ctx.fill();
                            ctx.fillStyle = 'rgba(100,78,38,0.75)';
                            ctx.beginPath(); ctx.ellipse(vx + 4, vy - 1, 3.5, 2.2, -0.2, 0, Math.PI * 2); ctx.fill();
                            ctx.fillStyle = 'rgba(140,108,58,0.60)';
                            ctx.beginPath(); ctx.ellipse(vx + 0.5, vy + 3, 3, 1.8, 0.5, 0, Math.PI * 2); ctx.fill();
                            ctx.strokeStyle = 'rgba(70,50,20,0.35)'; ctx.lineWidth = 0.8;
                            ctx.beginPath(); ctx.ellipse(vx - 3, vy + 1, 4.5, 2.8, 0.3, 0, Math.PI * 2); ctx.stroke();
                            ctx.beginPath(); ctx.ellipse(vx + 4, vy - 1, 3.5, 2.2, -0.2, 0, Math.PI * 2); ctx.stroke();
                        } else {
                            ctx.strokeStyle = config.edgeGrassColor;
                            ctx.lineWidth = 1.5;
                            for (let j = 0; j < 5; j++) {
                                const angle = (j / 5) * Math.PI * 2 + seed * 0.01;
                                const len = 7 + Math.sin(seed * 0.02) * 2;
                                ctx.beginPath();
                                ctx.moveTo(vx, vy);
                                ctx.lineTo(vx + Math.cos(angle) * len, vy + Math.sin(angle) * len);
                                ctx.stroke();
                            }
                            if (Math.sin(seed * 0.005) > 0) {
                                const camp2 = this.currentCampaign || 'forest';
                                const dotC = camp2 === 'space' ? 'rgba(120,220,160,0.8)'
                                    : camp2 === 'mountain' ? 'rgba(220,228,255,0.55)'
                                    : 'rgba(195,175,75,0.50)';
                                ctx.fillStyle = dotC;
                                ctx.beginPath(); ctx.arc(vx, vy, 2, 0, Math.PI * 2); ctx.fill();
                            }
                        }
                        break;
                }
            }
        });
    }

    /** Lighten a hex colour by `amount` (0-255), returns rgba string. Mirrors LevelBase.lightenHexColor. */
    designerLightenHex(color, amount) {
        if (!color.startsWith('#')) return color;
        const hex = color.replace('#', '');
        const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + amount);
        const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + amount);
        const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + amount);
        return `rgba(${r},${g},${b},0.6)`;
    }

    /** Convert hex colour to {r,g,b,a} object. Mirrors LevelBase.hexToRgba. */
    designerHexToRgba(color, alpha) {
        if (!color.startsWith('#')) return { r: 100, g: 100, b: 100, a: alpha };
        const hex = color.replace('#', '');
        return { r: parseInt(hex.substr(0, 2), 16), g: parseInt(hex.substr(2, 2), 16), b: parseInt(hex.substr(4, 2), 16), a: alpha };
    }

    drawRiverPoints() {
        if (!this.riverPoints || this.riverPoints.length === 0) return;

        const cellWidthPixels = this.canvas.width / this.gridWidth;
        const cellHeightPixels = this.canvas.height / this.gridHeight;

        // Draw river line
        this.ctx.strokeStyle = '#1e90ff';
        this.ctx.lineWidth = 5;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.globalAlpha = 0.6;

        this.ctx.beginPath();
        const firstPoint = this.riverPoints[0];
        this.ctx.moveTo(firstPoint.gridX * cellWidthPixels, firstPoint.gridY * cellHeightPixels);

        for (let i = 1; i < this.riverPoints.length; i++) {
            const point = this.riverPoints[i];
            this.ctx.lineTo(point.gridX * cellWidthPixels, point.gridY * cellHeightPixels);
        }
        this.ctx.stroke();

        this.ctx.globalAlpha = 1;

        // Draw waypoints
        this.riverPoints.forEach((point, idx) => {
            const x = point.gridX * cellWidthPixels;
            const y = point.gridY * cellHeightPixels;

            // Point circle
            this.ctx.fillStyle = idx === 0 ? '#1e90ff' : '#4169e1';
            this.ctx.beginPath();
            this.ctx.arc(x, y, 7, 0, Math.PI * 2);
            this.ctx.fill();

            // Index text
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(idx + 1, x, y);
        });
    }

    /**
     * Lazily instantiates the real Castle class (public/js/entities/buildings/Castle.js)
     * so the designer's preview renders the exact same castle gameplay uses, instead of
     * a hand-drawn lookalike icon. Castle's fixed pixel dimensions (120x80 wall, etc.)
     * are authored against a 32px reference cell (matching gridWidth=60 -> a 1920px-wide
     * reference canvas); `scale` below reproduces that same ratio at the designer's
     * actual on-screen canvas size, the same way drawTerrainElements() already scales
     * trees/rocks relative to that reference cell.
     */
    async _ensureCastlePreview() {
        if (this._castlePreview || this._castlePreviewLoading) return;
        this._castlePreviewLoading = true;
        const { Castle } = await import('../entities/buildings/Castle.js');
        this._castlePreview = new Castle(0, 0, 0, 0);
        this._castlePreview.update(1); // one tick so window lights aren't frozen at their initial 0 intensity
        this._castlePreviewLoading = false;
        this.render();
    }

    drawCastle() {
        if (!this._castlePreview) {
            this._ensureCastlePreview();
            return; // draws once the async import above resolves and re-triggers render()
        }

        const cW = this.canvas.width / this.gridWidth;
        const cH = this.canvas.height / this.gridHeight;
        const scale = cW / 32;

        let gridX, gridY, alpha;
        if (!this.pathLocked && this.pathPoints.length > 0) {
            const last = this.pathPoints[this.pathPoints.length - 1];
            gridX = last.gridX;
            gridY = last.gridY;
            alpha = 0.38;
        } else if (this.castlePosition && this.pathLocked) {
            gridX = this.castlePosition.gridX;
            gridY = this.castlePosition.gridY;
            alpha = 1.0;
        } else {
            return;
        }

        // Gate (local y = +wallHeight/2 = +40 in Castle's own coordinate space) aligns
        // with the path end, matching LevelBase.createCastle()'s castleScreenY math.
        const castle = this._castlePreview;
        castle.x = gridX * cW;
        castle.y = gridY * cH - 40 * scale;
        castle.gateAngle = 0;

        const ctx = this.ctx;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(castle.x, castle.y);
        ctx.scale(scale, scale);
        ctx.translate(-castle.x, -castle.y);
        castle.render(ctx);
        ctx.restore();
        ctx.globalAlpha = 1;
    }

    drawTerrainElements() {
        const cellWidthPixels = this.canvas.width / this.gridWidth;
        const cellHeightPixels = this.canvas.height / this.gridHeight;
        const campaign = this.currentCampaign || 'forest';

        const sorted = [...this.terrainElements].sort((a, b) => a.gridY - b.gridY);
        sorted.forEach(element => {
            const x = element.gridX * cellWidthPixels;
            const y = element.gridY * cellHeightPixels;
            const baseSize = element.size * Math.min(cellWidthPixels, cellHeightPixels);
            const size = element.type === 'water' ? baseSize : baseSize * 0.75;

            // Delegates to TerrainRenderer so the preview here is drawn by the exact
            // same code as real gameplay (see TerrainRenderer.js header comment).
            switch (element.type) {
                case 'vegetation':
                    TerrainRenderer.renderVegetation(this.ctx, x, y - size * 0.45, size, element.gridX, element.gridY, element.variant, campaign);
                    break;
                case 'rock':
                    TerrainRenderer.renderRock(this.ctx, x, y, size, element.gridX, element.gridY, element.variant, campaign);
                    break;
                case 'water':
                    if (element.waterType === 'river') {
                        TerrainRenderer.renderRiver(this.ctx, x, y, size, element.flowAngle);
                    } else {
                        TerrainRenderer.renderLake(this.ctx, x, y, size);
                    }
                    break;
            }
        });
    }

    drawRiversSmooth() {
        // Draw from riverPaths (stored waypoint arrays) for smooth, editable rendering
        const cW = this.canvas.width / this.gridWidth;
        const cH = this.canvas.height / this.gridHeight;
        const pixelSize = Math.min(cW, cH);
        const riverWidthPixels = pixelSize * 1.8;
        
        this.riverPaths.forEach((waypoints, ridx) => {
            if (waypoints.length < 2) return;
            const path = waypoints.map(p => ({
                x: p.gridX * cW,
                y: p.gridY * cH
            }));
            
            // River shadow
            this.ctx.strokeStyle = 'rgba(0,0,0,0.4)';
            this.ctx.lineWidth = riverWidthPixels + 4;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.beginPath();
            this.ctx.moveTo(path[0].x, path[0].y);
            for (let i = 1; i < path.length; i++) this.ctx.lineTo(path[i].x, path[i].y);
            this.ctx.stroke();
            
            // Main river fill
            this.ctx.strokeStyle = '#0277BD';
            this.ctx.lineWidth = riverWidthPixels;
            this.ctx.globalAlpha = 0.9;
            this.ctx.beginPath();
            this.ctx.moveTo(path[0].x, path[0].y);
            for (let i = 1; i < path.length; i++) this.ctx.lineTo(path[i].x, path[i].y);
            this.ctx.stroke();
            
            // Center highlight
            this.ctx.strokeStyle = '#29B6F6';
            this.ctx.lineWidth = riverWidthPixels * 0.4;
            this.ctx.globalAlpha = 0.5;
            this.ctx.beginPath();
            this.ctx.moveTo(path[0].x, path[0].y);
            for (let i = 1; i < path.length; i++) this.ctx.lineTo(path[i].x, path[i].y);
            this.ctx.stroke();
            this.ctx.globalAlpha = 1;
        });
    }

    updateGeneratedCode() {
        if (this.designerMode === 'player') return; // no code-output panel in player mode
        const code = this.generateLevelCode();
        document.getElementById('outputCode').textContent = code;
    }

    generateLevelCode() {
        const levelName = document.getElementById('levelName').value;
        const levelNumber = document.getElementById('levelNumber')?.value || '1';
        const difficulty = document.getElementById('difficulty').value;
        const maxWaves = document.getElementById('maxWaves').value;
        const campaignTheme = document.getElementById('campaignTheme').value;

        // Capitalize campaign name for class naming (forest -> Forest, mountain -> Mountain, etc.)
        const capitalizedCampaign = campaignTheme.charAt(0).toUpperCase() + campaignTheme.slice(1);

        // Generate path points
        const pathCode = this.pathPoints.length > 0 
            ? this.pathPoints.map((p, i) => 
                `            { gridX: ${p.gridX.toFixed(2)}, gridY: ${p.gridY.toFixed(2)} }${i < this.pathPoints.length - 1 ? ',' : ''}`
              ).join('\n')
            : '            // Add path points using the designer';

        // Generate waves
        const wavesCode = this.waves.map((wave, idx) => `
        // Wave ${wave.id}
        ${idx > 0 ? ', ' : ''}{ 
            enemyHealth_multiplier: ${wave.enemyHealthMultiplier}, 
            speedMultiplier: ${wave.speedMultiplier}, 
            spawnInterval: ${wave.spawnInterval}, 
            pattern: [${wave.pattern.map(e => {
                let entry = `{ type: '${e.type}', count: ${e.count}`;
                if (e.healthMultiplier !== undefined) entry += `, healthMultiplier: ${e.healthMultiplier}`;
                if (e.speedMultiplier !== undefined) entry += `, speedMultiplier: ${e.speedMultiplier}`;
                entry += ' }';
                return entry;
            }).join(', ')}] 
        }`).join('');

        // Convert riverPaths to terrain cells for export (matching in-game format)
        const riverElements = [];
        this.riverPaths.forEach(waypoints => {
            for (let i = 0; i < waypoints.length - 1; i++) {
                const p1 = waypoints[i];
                const p2 = waypoints[i + 1];
                const distance = Math.hypot(p2.gridX - p1.gridX, p2.gridY - p1.gridY);
                const steps = Math.ceil(distance);
                for (let step = 0; step <= steps; step++) {
                    const t = steps === 0 ? 0 : step / steps;
                    const x = p1.gridX + (p2.gridX - p1.gridX) * t;
                    const y = p1.gridY + (p2.gridY - p1.gridY) * t;
                    const dx = p2.gridX - p1.gridX;
                    const dy = p2.gridY - p1.gridY;
                    riverElements.push({
                        type: 'water',
                        waterType: 'river',
                        gridX: Math.round(x),
                        gridY: Math.round(y),
                        size: 1.5,
                        flowAngle: Math.atan2(dy, dx)
                    });
                }
            }
        });
        // Convert lakeCells to terrain elements for export (legacy support)
        const allTerrainElements = [...riverElements, ...this.terrainElements];
        
        // Generate terrain elements
        const terrainCode = allTerrainElements.length > 0
            ? allTerrainElements.map((element, idx) => {
                let elementStr = `            { type: '${element.type}', gridX: ${element.gridX.toFixed(2)}, gridY: ${element.gridY.toFixed(2)}, size: ${element.size}`;
                // Add waterType for water elements
                if (element.type === 'water' && element.waterType) {
                    elementStr += `, waterType: '${element.waterType}'`;
                }
                // Add variant for vegetation and rock elements
                if (element.variant !== undefined && element.variant !== null) {
                    elementStr += `, variant: ${element.variant}`;
                }
                elementStr += ` }${idx < allTerrainElements.length - 1 ? ',' : ''}`;
                return elementStr;
              }).join('\n')
            : '            // Add terrain elements using the designer';

        const className = `${capitalizedCampaign}Level${levelNumber}`;
        const code = `import { LevelBase } from '../LevelBase.js';

export class ${className} extends LevelBase {
    static levelMetadata = {
        name: '${levelName}',
        difficulty: '${difficulty}',
        order: ${levelNumber},
        campaign: '${campaignTheme}'
    };

    constructor() {
        super();
        // Derive instance properties from static metadata
        this.levelName = ${className}.levelMetadata.name;
        this.levelNumber = ${className}.levelMetadata.order;
        this.difficulty = ${className}.levelMetadata.difficulty;
        this.campaign = ${className}.levelMetadata.campaign;
        this.maxWaves = ${maxWaves};

        // Set terrain elements (prevent tower placement on these areas)
        this.terrainElements = [
${terrainCode}
        ];
    }

    createMeanderingPath(canvasWidth, canvasHeight) {
        const gridWidth = this.gridWidth || 60;
        const gridHeight = this.gridHeight || 33.75;

        const pathInGridCoords = [
${pathCode}
        ];

        this.path = pathInGridCoords.map(point => ({
            x: Math.round(point.gridX * this.cellSize),
            y: Math.round(point.gridY * this.cellSize)
        }));
    }

    getWaveConfig(wave) {
        const waveConfigs = [${wavesCode}
        ];

        if (wave > 0 && wave <= waveConfigs.length) {
            return waveConfigs[wave - 1];
        }
        
        return null;
    }
}`;

        return code;
    }

    copyCode() {
        const code = this.generateLevelCode();
        navigator.clipboard.writeText(code).then(() => {
            const statusMsg = document.getElementById('statusMessage');
            statusMsg.innerHTML = '<div class="status-msg ok">Code copied to clipboard.</div>';
            setTimeout(() => {
                statusMsg.innerHTML = '';
            }, 2000);
        });
    }

    exportLevel() {
        if (this.pathPoints.length < 2) {
            this.showConfirmation(
                'Invalid Path',
                'Path must have at least 2 points! You currently have ' + this.pathPoints.length + ' point(s).',
                () => {} // No action on confirm
            );
            return;
        }

        const code = this.generateLevelCode();
        const levelNumber = document.getElementById('levelNumber')?.value || '1';
        const levelName = document.getElementById('levelName').value;

        // Create download
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(code));
        element.setAttribute('download', `Level${levelNumber}.js`);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);

        const statusMsg = document.getElementById('statusMessage');
        statusMsg.innerHTML = `<div class="status-msg ok">Exported as Level${levelNumber}.js</div>`;
        setTimeout(() => {
            statusMsg.innerHTML = '';
        }, 3000);
    }

    /**
     * Open the load level modal
     */
    openLoadLevelModal() {
        const modal = document.getElementById('loadLevelModal');
        modal.classList.add('active');
        
        // Populate campaign select dropdown first
        this.populateCampaignSelect();
        
        // Clear level select
        const levelSelect = document.getElementById('levelSelect');
        while (levelSelect.options.length > 1) {
            levelSelect.remove(1);
        }
    }

    /**
     * Close the load level modal
     */
    closeLoadLevelModal() {
        const modal = document.getElementById('loadLevelModal');
        modal.classList.remove('active');
    }

    /**
     * Populate the campaign select dropdown
     */
    populateCampaignSelect() {
        const select = document.getElementById('campaignSelect');
        if (!select) return;
        
        // Clear existing options except placeholder
        while (select.options.length > 1) {
            select.remove(1);
        }

        // Define available campaigns
        const campaigns = [
            { value: 'Forest',   label: 'Forest Campaign (12 levels)' },
            { value: 'Mountain', label: 'Mountain Campaign (12 levels)' },
            { value: 'Desert',   label: 'Desert Campaign (10 levels)' },
            { value: 'Space',    label: 'Space Campaign (8 levels)' }
        ];

        campaigns.forEach(campaign => {
            const option = document.createElement('option');
            option.value = campaign.value;
            option.textContent = campaign.label;
            select.appendChild(option);
        });
    }

    /**
     * Handle campaign selection change
     */
    onCampaignSelectChange(event) {
        const campaignName = event.target.value;
        if (!campaignName) {
            // Clear level select if no campaign chosen
            const levelSelect = document.getElementById('levelSelect');
            while (levelSelect.options.length > 1) {
                levelSelect.remove(1);
            }
            return;
        }
        
        // Populate levels for the selected campaign
        this.populateLevelsForCampaign(campaignName);
    }

    /**
     * Populate level select based on selected campaign
     */
    populateLevelsForCampaign(campaignName) {
        const select = document.getElementById('levelSelect');

        // Clear existing options except placeholder
        while (select.options.length > 1) {
            select.remove(1);
        }

        const glob = LEVEL_FILE_GLOBS[campaignName] || {};
        const levels = Object.keys(glob)
            .map(path => path.match(/([^/]+)\.js$/)[1])
            .filter(name => /Level\d+$/.test(name))
            .map(name => ({ name, num: parseInt(name.match(/(\d+)$/)[1], 10) }))
            .sort((a, b) => a.num - b.num)
            .map(({ name, num }) => ({
                value: `${campaignName}.${name}`,
                label: `${campaignName} Level ${num}`
            }));

        levels.forEach(level => {
            const option = document.createElement('option');
            option.value = level.value;
            option.textContent = level.label;
            select.appendChild(option);
        });
    }

    /**
     * Handle the load level confirm button click
     */
    onLoadLevelConfirm() {
        const levelSelect = document.getElementById('levelSelect');
        if (!levelSelect.value) {
            this.showConfirmation(
                'No Level Selected',
                'Please select a level to load.',
                () => {} // No action on confirm
            );
            return;
        }
        
        this.loadLevel(levelSelect.value);
    }

    /**
     * Load a level by its module path (e.g., 'Campaign1.Level1')
     */
    async loadLevel(modulePath) {
        try {
            // Dynamically import the level module
            const [campaignName, levelName] = modulePath.split('.');
            const module = await import(`../entities/levels/${campaignName}/${levelName}.js`);
            const LevelClass = module[levelName];
            
            // Create instance of the level (without resolution manager so it doesn't initialize)
            const level = new LevelClass();
            
            // Clear current state
            this.clearAll();
            
            // Load level metadata
            if (level.levelName) document.getElementById('levelName').value = level.levelName;
            const levelNumEl = document.getElementById('levelNumber'); if (level.levelNumber && levelNumEl) levelNumEl.value = level.levelNumber;
            if (level.difficulty) document.getElementById('difficulty').value = level.difficulty;
            if (level.maxWaves) document.getElementById('maxWaves').value = level.maxWaves;
            
            // Load campaign theme if available
            if (level.campaign) {
                document.getElementById('campaignTheme').value = level.campaign;
                this.currentCampaign = level.campaign;
            }
            
            // Load terrain elements — separate river cells from other terrain (lakes stay as terrain elements)
            if (level.terrainElements && Array.isArray(level.terrainElements)) {
                const nonRiverElems = [];
                const riverCells = [];
                for (const elem of level.terrainElements) {
                    if (elem.type === 'water' && elem.waterType === 'river') {
                        riverCells.push(elem);
                    } else {
                        nonRiverElems.push(elem);
                    }
                }
                this.terrainElements = JSON.parse(JSON.stringify(nonRiverElems));
                
                // Reconstruct riverPaths from connected river cell groups
                // Cells are stored in path order so we group by connectivity
                this.riverPaths = [];
                if (riverCells.length > 0) {
                    const processed = new Set();
                    for (let i = 0; i < riverCells.length; i++) {
                        if (processed.has(i)) continue;
                        const segment = [riverCells[i]];
                        processed.add(i);
                        let added = true;
                        while (added) {
                            added = false;
                            for (let j = 0; j < riverCells.length; j++) {
                                if (processed.has(j)) continue;
                                const last = segment[segment.length - 1];
                                const cand = riverCells[j];
                                const dist = Math.hypot(cand.gridX - last.gridX, cand.gridY - last.gridY);
                                if (dist <= 2.5) {
                                    segment.push(cand);
                                    processed.add(j);
                                    added = true;
                                }
                            }
                        }
                        // Convert cells to waypoints (deduplicated)
                        const waypoints = [];
                        segment.forEach(cell => {
                            const last = waypoints[waypoints.length - 1];
                            if (!last || last.gridX !== cell.gridX || last.gridY !== cell.gridY) {
                                waypoints.push({ gridX: cell.gridX, gridY: cell.gridY });
                            }
                        });
                        if (waypoints.length >= 2) {
                            this.riverPaths.push(waypoints);
                        }
                    }
                }
            }
            
            // Load path - the level.path is populated by the level's initialization
            // But since we didn't call initialize(), we need to manually call createMeanderingPath
            // with dummy parameters to populate the path
            if (typeof level.createMeanderingPath === 'function') {
                // Set temporary cellSize if not already set
                if (!level.cellSize) {
                    level.cellSize = this.cellSize;
                }
                // Call the method to generate the path
                level.createMeanderingPath(1920, 1080);
                
                // Now extract the path from pixels back to grid coordinates
                if (level.path && Array.isArray(level.path)) {
                    const cellSize = level.cellSize || this.cellSize;
                    this.pathPoints = level.path.map(point => ({
                        gridX: Math.round(point.x / cellSize),
                        gridY: Math.round(point.y / cellSize)
                    }));
                    this.pathLocked = true;
                    
                    // Place castle at the end of the loaded path
                    if (this.pathPoints.length > 0) {
                        const lastPoint = this.pathPoints[this.pathPoints.length - 1];
                        this.castlePosition = {
                            gridX: lastPoint.gridX,
                            gridY: lastPoint.gridY
                        };
                    }
                }
            }
            
            // Load waves
            this.waves = [];
            if (level.getWaveConfig) {
                let waveIndex = 1;
                let waveConfig = level.getWaveConfig(waveIndex);
                while (waveConfig) {
                    let pattern = waveConfig.pattern || [{ type: 'basic', count: 5 }];
                    // Convert old string-array pattern to new {type, count} format
                    if (pattern.length > 0 && typeof pattern[0] === 'string') {
                        const oldCount = waveConfig.enemyCount || 5;
                        const typeCounts = {};
                        const typeOrder = [];
                        for (let i = 0; i < oldCount; i++) {
                            const t = pattern[i % pattern.length];
                            if (!typeCounts[t]) { typeCounts[t] = 0; typeOrder.push(t); }
                            typeCounts[t]++;
                        }
                        pattern = typeOrder.map(t => ({ type: t, count: typeCounts[t] }));
                    } else {
                        // Preserve per-entry multipliers if present
                        pattern = pattern.map(e => {
                            const copy = { type: e.type, count: e.count };
                            if (e.healthMultiplier !== undefined) copy.healthMultiplier = e.healthMultiplier;
                            if (e.speedMultiplier !== undefined) copy.speedMultiplier = e.speedMultiplier;
                            return copy;
                        });
                    }
                    this.waves.push({
                        id: waveIndex,
                        enemyHealthMultiplier: waveConfig.enemyHealth_multiplier || waveConfig.enemyHealthMultiplier || 1.0,
                        speedMultiplier: waveConfig.speedMultiplier || 0.70,
                        spawnInterval: waveConfig.spawnInterval || 1.5,
                        pattern
                    });
                    waveIndex++;
                    waveConfig = level.getWaveConfig(waveIndex);
                }
            }
            
            // Update UI
            this.renderWavesList();
            this.updateGeneratedCode();
            this.render();
            
            // Close modal and show success message
            this.closeLoadLevelModal();
            const statusMsg = document.getElementById('statusMessage');
            statusMsg.innerHTML = `<div class="status-msg ok">Loaded ${modulePath}</div>`;
            setTimeout(() => {
                statusMsg.innerHTML = '';
            }, 3000);
            
        } catch (error) {
            console.error('Error loading level:', error);
            const statusMsg = document.getElementById('statusMessage');
            statusMsg.innerHTML = `<div class="status-msg err">Error loading level: ${error.message}</div>`;
            setTimeout(() => {
                statusMsg.innerHTML = '';
            }, 3000);
        }
    }

    /**
     * Clear all designer state
     */
    clearAll() {
        this.pathPoints = [];
        this.pathLocked = false;
        this.terrainElements = [];
        this.riverPaths = [];
        this.waves = [];
        this.castlePosition = {
            gridX: this.gridWidth - 2,
            gridY: this.gridHeight / 2
        };
        this.mode = 'path';
        this.terrainMode = null;
        this.waterMode = null;
        this.currentEditingWaveId = null;
        this.riverPoints = [];
        this.undoStack = [];
    }

    // ---- Player mode: save-to-slot (replaces the dev tool's export flow) ----

    /** Called by LevelDesignerState after instantiation to wire save-slot support. */
    setStateManager(sm) {
        this._stateManager = sm;
    }

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
        for (let i = 0; i < PLAYER_LEVEL_SLOT_COUNT; i++) {
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
                const result = pl.slice(0, PLAYER_LEVEL_SLOT_COUNT);
                while (result.length < PLAYER_LEVEL_SLOT_COUNT) result.push(null);
                return result;
            }
        }
        // Legacy localStorage fallback
        try {
            const raw = localStorage.getItem(PLAYER_LEVEL_LEGACY_STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    const result = parsed.slice(0, PLAYER_LEVEL_SLOT_COUNT);
                    while (result.length < PLAYER_LEVEL_SLOT_COUNT) result.push(null);
                    return result;
                }
            }
        } catch (e) {}
        return Array(PLAYER_LEVEL_SLOT_COUNT).fill(null);
    }

    async saveToSlot(index) {
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
            // Also persist to the on-disk .sav file (desktop/Tauri build) - without this,
            // a later app restart's syncAllSlotsFromFiles() would silently overwrite this
            // localStorage-only change from the stale file on disk.
            await this._stateManager.SaveSystem.persistToFile(this._stateManager.currentSaveSlot);
        } else {
            // Legacy localStorage fallback
            localStorage.setItem(PLAYER_LEVEL_LEGACY_STORAGE_KEY, JSON.stringify(existing));
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
