/**
 * Main Level Designer Class
 * Orchestrates the level design UI, canvas interactions, and code generation
 */
import { CampaignThemeConfig } from '../core/CampaignThemeConfig.js';

export class LevelDesigner {
    constructor(canvasId, config = {}) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
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
                if (this.terrainMode === 'vegetation') this.selectedTreeVariant = i;
                else if (this.terrainMode === 'rock') this.selectedRockVariant = i;
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
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        
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
        window.addEventListener('mouseup', () => { this.isDrawingRiver = false; this.lastRiverDragPos = null; });
        
        window.addEventListener('resize', () => this.handleResize());

        // Toolbar buttons
        document.getElementById('drawPathBtn').addEventListener('click', () => this.setMode('path'));
        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
        document.getElementById('clearBtn').addEventListener('click', () => this.onClearClick());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportLevel());
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
        
        // Water mode buttons
        document.getElementById('waterRiverBtn')?.addEventListener('click', () => this.setWaterMode('river'));
        document.getElementById('waterLakeBtn')?.addEventListener('click', () => this.setWaterMode('lake'));
        


        // Terrain size slider
        document.getElementById('terrainSizeSlider')?.addEventListener('input', (e) => {
            this.terrainElementSize = parseFloat(e.target.value);
            const label = document.getElementById('terrainSizeLabel');
            if (label) label.textContent = this.terrainElementSize.toFixed(1);
        });

        // Copy code button
        document.getElementById('copyCodeBtn').addEventListener('click', () => this.copyCode());

        // Load level button
        document.getElementById('loadLevelBtn').addEventListener('click', () => this.openLoadLevelModal());

        // Load level modal controls
        document.getElementById('loadLevelCloseBtn').addEventListener('click', () => this.closeLoadLevelModal());
        document.getElementById('loadLevelCancelBtn').addEventListener('click', () => this.closeLoadLevelModal());
        
        // Campaign selector change
        document.getElementById('campaignSelect')?.addEventListener('change', (e) => this.onCampaignSelectChange(e));
        
        // Level confirm button
        document.getElementById('loadLevelConfirmBtn').addEventListener('click', () => this.onLoadLevelConfirm());

        // Close load level modal on overlay click
        document.getElementById('loadLevelModal').addEventListener('click', (e) => {
            if (e.target.id === 'loadLevelModal') {
                this.closeLoadLevelModal();
            }
        });
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
        
        const pathInfo = document.getElementById('pathInfo');
        if (newMode === 'path') {
            pathInfo.textContent = 'Path mode -- Click to add waypoints. Right-click to remove last. Click "Finish Path" when done.';
        } else {
            pathInfo.textContent = 'Select a tool mode from the toolbar.';
        }
    }

    setTerrainMode(terrainType) {
        this.mode = 'terrain';
        this.terrainMode = terrainType;
        this.waterMode = null; // Reset water mode
        
        document.getElementById('drawPathBtn').classList.toggle('active', false);
        document.getElementById('drawVegetationBtn')?.classList.toggle('active', terrainType === 'vegetation');
        document.getElementById('drawRockBtn')?.classList.toggle('active', terrainType === 'rock');
        document.getElementById('drawWaterBtn')?.classList.toggle('active', terrainType === 'water');
        
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
        
        const pathInfo = document.getElementById('pathInfo');
        const names = { vegetation: 'Trees', rock: 'Rocks', water: 'Water' };
        pathInfo.textContent = `Click to place ${names[terrainType]}. Right-click to erase.`;
        this.updateVariantPicker();
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
        const activeVariant = isVeg ? this.selectedTreeVariant : this.selectedRockVariant;
        for (let i = 0; i < 4; i++) {
            const btn = document.getElementById(`variantBtn${i}`);
            if (btn) btn.classList.toggle('active', i === activeVariant);
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
        
        const pathInfo = document.getElementById('pathInfo');
        if (mode === 'river') {
            pathInfo.textContent = 'River mode -- Click and drag to draw freehand, or single-click for waypoints. Click "Finish River" when done.';
            this.riverPoints = []; // Always start fresh when entering river mode
        } else if (mode === 'lake') {
            pathInfo.textContent = 'Lake mode -- Click to place a lake. Use the Size slider to control lake size. Right-click to remove last element.';
            this.riverPoints = [];
        }
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
        if (this.mode === 'terrain' || (this.mode === 'path' && this.waterMode !== 'river') || this.mode === 'castle') {
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

        if (this.mode === 'path') {
            // Snap path points to grid
            const snapped = this.snapToGrid(gridCoords.gridX, gridCoords.gridY);
            this.pathPoints.push(snapped);
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
                // Regular terrain placement (snapped to grid)
                const snapped = this.snapToGrid(gridCoords.gridX, gridCoords.gridY);
                this.addTerrainElement(this.terrainMode, snapped.gridX, snapped.gridY);
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
        } else if (this.mode === 'terrain' && this.waterMode === 'lake') {
            // Lake placement is handled by handleCanvasClick, not mousedown drag
        }
    }

    handleCanvasMouseUp(e) {
        if (this.isDrawingRiver) {
            this.isDrawingRiver = false;
            this.lastRiverDragPos = null;
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
    }

    finishRiver() {
        // Store river as a waypoint array (not flattened to cells)
        // Cells are generated only on export so the river remains editable
        if (!this.riverPoints || this.riverPoints.length < 2) return;
        this.riverPaths.push([...this.riverPoints]);
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

    undo() {
        if (this.pathPoints.length > 0) {
            this.pathPoints.pop();
            this.updateGeneratedCode();
            this.render();
        }
    }

    clearPath() {
        this.pathPoints = [];
        this.pathLocked = false;
        this.terrainElements = [];
        this.riverPaths = [];
        this.riverPoints = [];
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
            enemyCount: 5,
            enemyHealthMultiplier: 1.0,
            enemySpeed: 35,
            spawnInterval: 1.5,
            pattern: ['basic']
        });
        this.renderWavesList();
    }

    addWave() {
        const newId = this.waves.length + 1;
        this.waves.push({
            id: newId,
            enemyCount: 5 + (newId * 3),
            enemyHealthMultiplier: 1.0 + ((newId - 1) * 0.1),
            enemySpeed: 35 + ((newId - 1) * 2),
            spawnInterval: Math.max(1.0, 1.5 - (newId * 0.1)),
            pattern: ['basic']
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
                enemyCount: waveToClone.enemyCount,
                enemyHealthMultiplier: waveToClone.enemyHealthMultiplier,
                enemySpeed: waveToClone.enemySpeed,
                spawnInterval: waveToClone.spawnInterval,
                pattern: [...waveToClone.pattern]
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
            document.getElementById('modalEnemyCount').value = wave.enemyCount;
            document.getElementById('modalHealthMultiplier').value = wave.enemyHealthMultiplier.toFixed(2);
            document.getElementById('modalEnemySpeed').value = wave.enemySpeed;
            document.getElementById('modalSpawnInterval').value = wave.spawnInterval.toFixed(2);
            
            // Load pattern
            this.refreshModalPattern(wave.pattern);
        } else {
            // Add new wave mode
            const newId = this.waves.length + 1;
            document.getElementById('modalTitle').textContent = 'Add New Wave';
            document.getElementById('modalEnemyCount').value = 5 + (newId * 3);
            document.getElementById('modalHealthMultiplier').value = (1.0 + ((newId - 1) * 0.1)).toFixed(2);
            document.getElementById('modalEnemySpeed').value = 35 + ((newId - 1) * 2);
            document.getElementById('modalSpawnInterval').value = Math.max(1.0, 1.5 - (newId * 0.1)).toFixed(2);
            
            this.refreshModalPattern(['basic']);
        }

        modal.classList.add('active');
    }

    closeWaveModal() {
        document.getElementById('waveModal').classList.remove('active');
        this.currentEditingWaveId = null;
    }

    refreshModalPattern(pattern = ['basic']) {
        const patternList = document.getElementById('modalPatternList');
        patternList.innerHTML = '';

        pattern.forEach((enemy, idx) => {
            const item = document.createElement('div');
            item.className = 'pattern-item';
            item.innerHTML = `
                <select onchange="window.levelDesigner.updateModalPattern(${idx}, this.value)">
                    ${this.enemies.map(e => `<option value="${e}" ${e === enemy ? 'selected' : ''}>${e}</option>`).join('')}
                </select>
                <button onclick="window.levelDesigner.removeModalPattern(${idx})">✕</button>
            `;
            patternList.appendChild(item);
        });
    }

    updateModalPattern(idx, enemy) {
        // Get current pattern from modal
        const selects = document.querySelectorAll('#modalPatternList select');
        const pattern = Array.from(selects).map(s => s.value);
        pattern[idx] = enemy;
        
        if (this.currentEditingWaveId) {
            const wave = this.waves.find(w => w.id === this.currentEditingWaveId);
            wave.pattern = pattern;
        }
    }

    removeModalPattern(idx) {
        const selects = document.querySelectorAll('#modalPatternList select');
        const pattern = Array.from(selects).map(s => s.value);
        pattern.splice(idx, 1);
        this.refreshModalPattern(pattern);
    }

    addPatternToModal() {
        const selects = document.querySelectorAll('#modalPatternList select');
        const pattern = Array.from(selects).map(s => s.value);
        pattern.push('basic');
        this.refreshModalPattern(pattern);
    }

    saveWaveFromModal() {
        const enemyCount = parseInt(document.getElementById('modalEnemyCount').value);
        const healthMultiplier = parseFloat(document.getElementById('modalHealthMultiplier').value);
        const enemySpeed = parseInt(document.getElementById('modalEnemySpeed').value);
        const spawnInterval = parseFloat(document.getElementById('modalSpawnInterval').value);
        const selects = document.querySelectorAll('#modalPatternList select');
        const pattern = Array.from(selects).map(s => s.value);

        if (this.currentEditingWaveId) {
            // Update existing wave
            const wave = this.waves.find(w => w.id === this.currentEditingWaveId);
            wave.enemyCount = enemyCount;
            wave.enemyHealthMultiplier = healthMultiplier;
            wave.enemySpeed = enemySpeed;
            wave.spawnInterval = spawnInterval;
            wave.pattern = pattern;
        } else {
            // Add new wave - use max ID to avoid conflicts when waves are deleted
            const newId = this.waves.length > 0 ? Math.max(...this.waves.map(w => w.id), 0) + 1 : 1;
            this.waves.push({
                id: newId,
                enemyCount,
                enemyHealthMultiplier: healthMultiplier,
                enemySpeed,
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

        this.waves.forEach(wave => {
            const waveCard = document.createElement('div');
            waveCard.className = 'wave-card';
            
            const patternStr = wave.pattern.join(' → ');
            
            waveCard.innerHTML = `
                <div class="wave-card-info">
                    <div class="wave-card-title">Wave ${wave.id}</div>
                    <div class="wave-card-meta">Count: ${wave.enemyCount} | Health: ${wave.enemyHealthMultiplier.toFixed(2)}x | Speed: ${wave.enemySpeed} | ${wave.spawnInterval.toFixed(2)}s</div>
                    <div class="wave-card-meta" style="color:#90b890">Pattern: ${patternStr}</div>
                </div>
                <div class="wave-card-actions">
                    <button onclick="window.levelDesigner.openWaveModal(${wave.id})" style="font-size:10px;padding:3px 7px">Edit</button>
                    <button onclick="window.levelDesigner.duplicateWave(${wave.id})" style="font-size:10px;padding:3px 7px" title="Duplicate">Copy</button>
                    <button onclick="window.levelDesigner.removeWave(${wave.id})" style="font-size:10px;padding:3px 7px;background:#c0392b">Del</button>
                </div>
            `;
            container.appendChild(waveCard);
        });
    }

    render() {
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

        // Draw unified mode and terrain info overlay
        this.drawModeOverlay();
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

    drawDesignerDirtPatches() {}
    drawDesignerGrassPatches() {}
    drawDesignerFlowers() {}

    drawModeOverlay() {
        // Coordinate display is handled by the DOM element (#coordDisplay)

        // Unified mode and terrain information overlay - consistent format across all modes
        
        // No mode selected
        if (this.mode === null) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(10, 10, 280, 50);
            
            this.ctx.fillStyle = '#ffa500';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'top';
            this.ctx.fillText('[T] Select a tool to begin', 15, 20);
            
            this.ctx.fillStyle = '#b0b0b0';
            this.ctx.font = '11px Arial';
            this.ctx.fillText('Choose Path, Terrain, or Water mode', 15, 38);
            return;
        }
        
        // Path mode
        if (this.mode === 'path') {
            // Main mode label
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(10, 10, 200, 40);
            
            this.ctx.fillStyle = '#58c4dc';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'top';
            this.ctx.fillText('>> Mode: PATH', 15, 15);
            
            // Waypoint counter box (if editing)
            if (this.pathPoints && !this.pathLocked) {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                this.ctx.fillRect(10, 55, 250, 70);
                
                this.ctx.fillStyle = '#58c4dc';
                this.ctx.font = 'bold 14px Arial';
                this.ctx.fillText(`Waypoints: ${this.pathPoints.length}`, 15, 60);
                
                this.ctx.fillStyle = '#90caf9';
                this.ctx.font = '11px Arial';
                this.ctx.fillText('Right-click to remove last', 15, 78);
                this.ctx.fillText('Click "Finish Path" button when done', 15, 92);
            }
            return;
        }
        
        // Terrain mode
        if (this.mode === 'terrain' && this.terrainMode) {
            const theme = CampaignThemeConfig.getTheme(this.currentCampaign);
            const terrainDefaults = theme.terrainDefaults;
            
            let modeLabel = '';
            let modeColor = '';
            let secondaryInfo = '';

            if (this.terrainMode === 'vegetation') {
                modeLabel = `Placing ${this.currentCampaign.toUpperCase()} Trees`;
                modeColor = terrainDefaults.treeColor;
            } else if (this.terrainMode === 'rock') {
                modeLabel = `Placing ${this.currentCampaign.toUpperCase()} Rocks`;
                modeColor = terrainDefaults.rockColor;
            } else if (this.terrainMode === 'water') {
                if (this.waterMode === 'river') {
                    modeLabel = 'Mode: RIVER';
                    modeColor = '#1e90ff';
                    const pts = this.riverPoints ? this.riverPoints.length : 0;
                    secondaryInfo = `Drawing: ${pts} pt${pts !== 1 ? 's' : ''} • ${this.riverPaths.length} saved`;
                } else if (this.waterMode === 'lake') {
                    modeLabel = 'Mode: LAKES';
                    modeColor = '#0277bd';
                } else {
                    modeLabel = 'Water (select type)';
                    modeColor = '#4a6ba6';
                }
            }
            
            // Main terrain label with icon
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(10, 10, 300, 45);
            
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'top';
            this.ctx.fillText(modeLabel, 15, 15);
            
            // Color preview circle for terrain types
            if (this.terrainMode !== 'water' || this.waterMode === 'lake') {
                this.ctx.fillStyle = modeColor;
                this.ctx.beginPath();
                this.ctx.arc(285, 28, 10, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }
            
            // Secondary info box for water modes with waypoints
            if (secondaryInfo) {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                this.ctx.fillRect(10, 60, 250, 70);
                
                this.ctx.fillStyle = modeColor;
                this.ctx.font = 'bold 14px Arial';
                this.ctx.fillText(secondaryInfo, 15, 65);
                
                this.ctx.fillStyle = '#90caf9';
                this.ctx.font = '11px Arial';
                this.ctx.fillText('Right-click to remove last', 15, 83);
                this.ctx.fillText('Click "Finish River" button when done', 15, 97);
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
        if (!this.hoveredGridCell) return;

        const cellWidthPixels = this.canvas.width / this.gridWidth;
        const cellHeightPixels = this.canvas.height / this.gridHeight;

        const { gridX, gridY } = this.hoveredGridCell;
        const x = gridX * cellWidthPixels;
        const y = gridY * cellHeightPixels;

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

    drawCastle() {
        const cW = this.canvas.width / this.gridWidth;
        const cH = this.canvas.height / this.gridHeight;
        const size = Math.min(cW, cH) * 2.8;

        // Show semi-transparent preview at last path point during editing
        if (!this.pathLocked && this.pathPoints.length > 0) {
            const last = this.pathPoints[this.pathPoints.length - 1];
            this._renderCastle(last.gridX * cW, last.gridY * cH, size, 0.38);
            return;
        }

        if (!this.castlePosition || !this.pathLocked) return;
        this._renderCastle(
            this.castlePosition.gridX * cW,
            this.castlePosition.gridY * cH,
            size,
            1.0
        );
    }

    _renderCastle(x, y, size, alpha) {
        const ctx = this.ctx;
        ctx.globalAlpha = alpha;
        ctx.save();
        ctx.translate(x, y);
        const scale = size / 200;
        ctx.scale(scale, scale);
        const wW = 120, wH = 80, tW = 35, tH = 66.5;

        // --- Main wall ---
        const wallGrad = ctx.createLinearGradient(-wW/2, -wH/2, wW/2, wH/2);
        wallGrad.addColorStop(0, '#8B7D6B');
        wallGrad.addColorStop(0.5, '#7A6D5D');
        wallGrad.addColorStop(1, '#6B5D4D');
        ctx.fillStyle = wallGrad;
        ctx.fillRect(-wW/2, -wH/2, wW, wH);
        ctx.strokeStyle = '#3D3830'; ctx.lineWidth = 2;
        ctx.strokeRect(-wW/2, -wH/2, wW, wH);
        ctx.strokeStyle = '#5D5247'; ctx.lineWidth = 0.7;
        const bkW = wW / 12, bkH = wH / 8;
        for (let wy = -wH/2; wy < wH/2; wy += bkH) {
            const ox = (Math.abs(wy + wH/2) / bkH) % 2 * bkW / 2;
            for (let wx = -wW/2; wx < wW/2; wx += bkW) {
                ctx.strokeRect(wx + ox, wy, bkW - 0.8, bkH - 0.8);
            }
        }
        ctx.fillStyle = 'rgba(255,255,255,0.10)';
        for (let wy = -wH/2 + 1.5; wy < wH/2; wy += bkH) {
            const ox = (Math.abs(wy + wH/2) / bkH) % 2 * bkW / 2;
            for (let wx = -wW/2 + 1.5; wx < wW/2; wx += bkW) {
                ctx.fillRect(wx + ox, wy, bkW / 3, bkH / 3);
            }
        }
        ctx.fillStyle = 'rgba(107,93,77,0.8)';
        ctx.beginPath();
        ctx.moveTo(wW/2, -wH/2); ctx.lineTo(wW/2+8, -wH/2-4);
        ctx.lineTo(wW/2+8, wH/2-4); ctx.lineTo(wW/2, wH/2);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(155,140,120,0.6)';
        ctx.beginPath();
        ctx.moveTo(-wW/2, -wH/2); ctx.lineTo(wW/2, -wH/2);
        ctx.lineTo(wW/2+8, -wH/2-4); ctx.lineTo(-wW/2+8, -wH/2-4);
        ctx.closePath(); ctx.fill();
        const ws = 4;
        [{ x: -30, y: -20 }, { x: 0, y: -20 }, { x: 30, y: -20 }].forEach(pos => {
            ctx.fillStyle = '#1A1815';
            ctx.fillRect(pos.x - ws/2, pos.y - ws/2, ws, ws);
            ctx.strokeStyle = '#3D3830'; ctx.lineWidth = 0.8;
            ctx.strokeRect(pos.x - ws/2, pos.y - ws/2, ws, ws);
            ctx.fillStyle = 'rgba(255,200,100,0.20)';
            ctx.fillRect(pos.x - ws/2 + 0.5, pos.y - ws/2 + 0.5, ws - 1, ws - 1);
            ctx.strokeStyle = '#3D3830'; ctx.lineWidth = 0.5;
            ctx.beginPath(); ctx.moveTo(pos.x, pos.y - ws/2); ctx.lineTo(pos.x, pos.y + ws/2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(pos.x - ws/2, pos.y); ctx.lineTo(pos.x + ws/2, pos.y); ctx.stroke();
        });

        // --- Tower renderer ---
        const drawTwr = (tx) => {
            ctx.save();
            ctx.translate(tx, 0);
            const tTW = tW * 0.85, baseY = wH/2, topY = -tH;
            const tGrad = ctx.createLinearGradient(0, topY, 0, baseY);
            tGrad.addColorStop(0, '#9A8B7B'); tGrad.addColorStop(0.5, '#8A7B6B'); tGrad.addColorStop(1, '#7A6B5B');
            ctx.fillStyle = tGrad;
            ctx.beginPath();
            ctx.moveTo(-tW/2, baseY); ctx.lineTo(-tTW/2, topY);
            ctx.lineTo(tTW/2, topY); ctx.lineTo(tW/2, baseY);
            ctx.closePath(); ctx.fill();
            ctx.strokeStyle = '#3D3830'; ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-tW/2, baseY); ctx.lineTo(-tTW/2, topY);
            ctx.lineTo(tTW/2, topY); ctx.lineTo(tW/2, baseY);
            ctx.closePath(); ctx.stroke();
            ctx.strokeStyle = '#5D5247'; ctx.lineWidth = 0.7;
            const tbW = tW / 6, tbH = 10.5;
            for (let ty = topY; ty < baseY; ty += tbH) {
                const rf = (ty - topY) / tH;
                const rW = tTW + (tW - tTW) * rf;
                const ox = (Math.abs(ty - topY) / tbH) % 2 * tbW / 2;
                const hW = rW / 2;
                for (let bi = 0; bi < 6; bi++) {
                    const bl = -rW/2 + bi * tbW + ox;
                    if (bl >= -hW && bl + tbW - 0.8 <= hW) ctx.strokeRect(bl, ty, tbW - 0.8, tbH - 0.8);
                }
            }
            ctx.fillStyle = 'rgba(255,255,255,0.10)';
            for (let ty = topY + 1.5; ty < baseY; ty += tbH) {
                const rf = (ty - topY) / tH;
                const rW = tTW + (tW - tTW) * rf;
                const ox = (Math.abs(ty - topY) / tbH) % 2 * tbW / 2;
                const hW = rW / 2;
                for (let bi = 0; bi < 6; bi++) {
                    const hl = -rW/2 + bi * tbW + ox + 1.5;
                    if (hl >= -hW && hl + tbW/3 <= hW) ctx.fillRect(hl, ty + 1.5, tbW / 3, tbH / 3);
                }
            }
            const tws = 3.5;
            [{ x: 0, y: -50 }, { x: 0, y: -30 }, { x: 0, y: -10 }].forEach(pos => {
                ctx.fillStyle = '#1A1815';
                ctx.fillRect(pos.x - tws/2, pos.y - tws/2, tws, tws);
                ctx.strokeStyle = '#3D3830'; ctx.lineWidth = 0.8;
                ctx.strokeRect(pos.x - tws/2, pos.y - tws/2, tws, tws);
                ctx.fillStyle = 'rgba(255,180,100,0.16)';
                ctx.fillRect(pos.x - tws/2 + 0.3, pos.y - tws/2 + 0.3, tws - 0.6, tws - 0.6);
                ctx.strokeStyle = '#3D3830'; ctx.lineWidth = 0.4;
                ctx.beginPath(); ctx.moveTo(pos.x, pos.y - tws/2); ctx.lineTo(pos.x, pos.y + tws/2); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(pos.x - tws/2, pos.y); ctx.lineTo(pos.x + tws/2, pos.y); ctx.stroke();
            });
            const crH = 10, mrH = 4, rfH = 12;
            ctx.fillStyle = '#7A6D5D';
            ctx.fillRect(-tTW/2, topY - crH, tTW, crH);
            ctx.strokeStyle = '#3D3830'; ctx.lineWidth = 0.8;
            ctx.strokeRect(-tTW/2, topY - crH, tTW, crH);
            const mrW = tTW / 4;
            ctx.fillStyle = '#7A6D5D';
            ctx.fillRect(-tTW/2 + 2, topY - crH - mrH, mrW - 3, mrH);
            ctx.strokeRect(-tTW/2 + 2, topY - crH - mrH, mrW - 3, mrH);
            ctx.fillRect(-mrW/2 + 2, topY - crH - mrH, mrW - 3, mrH);
            ctx.strokeRect(-mrW/2 + 2, topY - crH - mrH, mrW - 3, mrH);
            ctx.fillRect(tTW/2 - mrW + 1, topY - crH - mrH, mrW - 3, mrH);
            ctx.strokeRect(tTW/2 - mrW + 1, topY - crH - mrH, mrW - 3, mrH);
            const pkY = topY - crH - mrH - rfH;
            ctx.fillStyle = '#5A4A3A';
            ctx.beginPath();
            ctx.moveTo(-tTW/2, topY - crH - mrH); ctx.lineTo(0, pkY); ctx.lineTo(tTW/2, topY - crH - mrH);
            ctx.closePath(); ctx.fill();
            ctx.strokeStyle = '#3D2810'; ctx.lineWidth = 1; ctx.stroke();
            ctx.restore();
        };

        drawTwr(-wW/2 - tW/2);
        drawTwr(wW/2 + tW/2);

        // --- Castle base ---
        const cbW = wW + 100, cbH = 30, cbY = wH/2;
        const cbGrad = ctx.createLinearGradient(0, cbY, 0, cbY + cbH);
        cbGrad.addColorStop(0, '#6B5D4D'); cbGrad.addColorStop(0.3, '#5A4D3D'); cbGrad.addColorStop(1, '#4A3D2D');
        ctx.fillStyle = cbGrad;
        ctx.fillRect(-cbW/2, cbY, cbW, cbH);
        ctx.strokeStyle = '#2D1810'; ctx.lineWidth = 1.5;
        ctx.strokeRect(-cbW/2, cbY, cbW, cbH);
        ctx.strokeStyle = '#3D2810'; ctx.lineWidth = 0.6;
        const cbS = 20;
        for (let bx = -cbW/2; bx < cbW/2; bx += cbS) {
            ctx.beginPath(); ctx.moveTo(bx, cbY); ctx.lineTo(bx, cbY + cbH); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(bx, cbY + cbH/2); ctx.lineTo(bx + cbS, cbY + cbH/2); ctx.stroke();
        }
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        for (let bx = -cbW/2; bx < cbW/2; bx += cbS) ctx.fillRect(bx, cbY + cbH/2, cbS, cbH/2);
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        for (let bx = -cbW/2; bx < cbW/2; bx += cbS) ctx.fillRect(bx, cbY, cbS, cbH/2);

        // --- Gate ---
        const gW = 40, gH = 50;
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(-gW/2 + 2, wH/2 - gH + 1, gW, gH);
        ctx.fillStyle = '#4A3A2A';
        ctx.fillRect(-gW/2, wH/2 - gH, gW, gH);
        ctx.strokeStyle = '#2C1810'; ctx.lineWidth = 1.5;
        ctx.strokeRect(-gW/2, wH/2 - gH, gW, gH);
        ctx.beginPath(); ctx.moveTo(0, wH/2 - gH); ctx.lineTo(0, wH/2); ctx.stroke();
        ctx.strokeStyle = '#8B7355'; ctx.lineWidth = 2;
        for (let gi = 1; gi < 3; gi++) {
            ctx.beginPath();
            ctx.moveTo(-gW/2 + 2, wH/2 - gH + gi * gH/3);
            ctx.lineTo(gW/2 - 2, wH/2 - gH + gi * gH/3);
            ctx.stroke();
        }
        ctx.fillStyle = '#654321';
        for (let gi = 0; gi < 4; gi++) {
            for (let gj = 0; gj < 3; gj++) {
                ctx.beginPath();
                ctx.arc(-gW/4 + gi * gW/6, wH/2 - gH + gH/6 + gj * gH/4, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.fillStyle = '#D4AF37';
        ctx.beginPath(); ctx.arc(gW/2 - 6, wH/2 - gH/2, 2, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#8B7500'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(gW/2 - 6, wH/2 - gH/2, 2, 0, Math.PI * 2); ctx.stroke();

        // --- Crenellations on wall ---
        const crW = 12, crGap = 16, crHt = 14;
        ctx.fillStyle = '#7A6D5D'; ctx.strokeStyle = '#3D3830'; ctx.lineWidth = 0.8;
        for (let cx = -wW/2 + 8; cx < wW/2; cx += crGap) {
            ctx.fillRect(cx, -wH/2 - crHt, crW, crHt);
            ctx.strokeRect(cx, -wH/2 - crHt, crW, crHt);
        }

        ctx.restore();
        ctx.globalAlpha = 1;

        // CASTLE label
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.max(9, size * 0.13)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('CASTLE', x, y + size / 2 + 5);
    }

    drawTerrainElements() {
        const cellWidthPixels = this.canvas.width / this.gridWidth;
        const cellHeightPixels = this.canvas.height / this.gridHeight;

        this.terrainElements.forEach(element => {
            const x = element.gridX * cellWidthPixels;
            const y = element.gridY * cellHeightPixels;
            const baseSize = element.size * Math.min(cellWidthPixels, cellHeightPixels);
            const size = element.type === 'water' ? baseSize : baseSize * 0.75;

            switch (element.type) {
                case 'vegetation':
                    this.drawVegetation(x, y, size, element.variant);
                    break;
                case 'rock':
                    this.drawRock(x, y, size, element.variant);
                    break;
                case 'water':
                    if (element.waterType === 'river') {
                        this.drawRiver(x, y, size, element.flowAngle);
                    } else {
                        this.drawLake(x, y, size);
                    }
                    break;
            }
        });
    }

    drawTree(x, y, size, variant) {
        const terrainInfo = CampaignThemeConfig.getTerrainRenderingInfo(this.currentCampaign);
        const primaryColor = terrainInfo.primaryColor;
        const accentColor = terrainInfo.accentColor;
        const seed = (variant !== undefined && variant !== null) ? variant % 4 : Math.floor(x + y) % 4;
        switch(this.currentCampaign) {
            case 'mountain':
                this.drawSnowPineTree(x, y, size, primaryColor, accentColor, seed);
                break;
            case 'desert':
                this.drawCactusTree(x, y, size, primaryColor, accentColor, seed);
                break;
            case 'space':
                this.drawCrystalStructure(x, y, size, primaryColor, accentColor, seed);
                break;
            default: // forest
                switch(seed) {
                    case 0: this.drawTreeType1(x, y, size, primaryColor, accentColor); break;
                    case 1: this.drawTreeType2(x, y, size, primaryColor, accentColor); break;
                    case 2: this.drawTreeType3(x, y, size, primaryColor, accentColor); break;
                    default: this.drawTreeType4(x, y, size, primaryColor, accentColor);
                }
        }
    }

    drawSnowPineTree(x, y, size, primaryColor, accentColor, seed) {
        // Snowy pine trees for mountain campaign
        const trunkWidth = size * 0.16;
        const trunkHeight = size * 0.4;
        
        // Trunk with snow
        this.ctx.fillStyle = '#5a4a3a';
        this.ctx.fillRect(x - trunkWidth * 0.5, y, trunkWidth, trunkHeight);
        
        // Snow on trunk
        this.ctx.fillStyle = '#e8f4f8';
        this.ctx.beginPath();
        this.ctx.arc(x - trunkWidth * 0.25, y + trunkHeight * 0.3, trunkWidth * 0.3, 0, Math.PI * 2);
        this.ctx.fill();

        // Layered foliage (snowy pine style)
        // Bottom layer - widest
        this.ctx.fillStyle = primaryColor;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - size * 0.4);
        this.ctx.lineTo(x + size * 0.35, y);
        this.ctx.lineTo(x - size * 0.35, y);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Snow on bottom layer
        this.ctx.fillStyle = 'rgba(232, 244, 248, 0.7)';
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - size * 0.4);
        this.ctx.lineTo(x + size * 0.32, y - size * 0.1);
        this.ctx.lineTo(x - size * 0.32, y - size * 0.1);
        this.ctx.closePath();
        this.ctx.fill();

        // Middle layer
        this.ctx.fillStyle = accentColor;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - size * 0.2);
        this.ctx.lineTo(x + size * 0.25, y + size * 0.1);
        this.ctx.lineTo(x - size * 0.25, y + size * 0.1);
        this.ctx.closePath();
        this.ctx.fill();

        // Top point
        this.ctx.fillStyle = primaryColor;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - size * 0.5);
        this.ctx.lineTo(x + size * 0.12, y - size * 0.4);
        this.ctx.lineTo(x - size * 0.12, y - size * 0.4);
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawCactusTree(x, y, size, primaryColor, accentColor, seed) {
        const ctx = this.ctx;
        switch(seed % 4) {
            case 0: {
                // Saguaro — tall trunk with upward-curving arms, natural desert coloring
                const tw = size * 0.14, th = size * 0.55;
                ctx.fillStyle = '#5a8440';
                ctx.fillRect(x - tw, y - th, tw * 2, th);
                ctx.beginPath();
                ctx.arc(x, y - th, tw, Math.PI, 0);
                ctx.fill();
                ctx.fillStyle = '#3d6030';
                ctx.fillRect(x + tw * 0.35, y - th, tw * 0.3, th);
                // Left arm
                ctx.fillStyle = '#5a8440';
                ctx.beginPath();
                ctx.moveTo(x - tw * 0.8, y - th * 0.55);
                ctx.quadraticCurveTo(x - size * 0.32, y - th * 0.68, x - size * 0.30, y - th * 0.85);
                ctx.quadraticCurveTo(x - size * 0.28, y - th * 1.02, x - size * 0.16, y - th);
                ctx.quadraticCurveTo(x - size * 0.08, y - th * 0.90, x - tw * 1.15, y - th * 0.55 - tw);
                ctx.closePath(); ctx.fill();
                // Right arm
                ctx.beginPath();
                ctx.moveTo(x + tw * 0.8, y - th * 0.40);
                ctx.quadraticCurveTo(x + size * 0.30, y - th * 0.50, x + size * 0.28, y - th * 0.70);
                ctx.quadraticCurveTo(x + size * 0.26, y - th * 0.94, x + size * 0.14, y - th * 0.92);
                ctx.quadraticCurveTo(x + size * 0.06, y - th * 0.82, x + tw * 1.15, y - th * 0.40 - tw);
                ctx.closePath(); ctx.fill();
                // Spine dots
                ctx.fillStyle = '#c8b870';
                for (let i = 0; i < 5; i++) {
                    const sy = y - th * 0.12 * (i + 0.5);
                    ctx.beginPath(); ctx.arc(x + tw * 0.55, sy, 1.2, 0, Math.PI * 2); ctx.fill();
                    ctx.beginPath(); ctx.arc(x - tw * 0.55, sy, 1.2, 0, Math.PI * 2); ctx.fill();
                }
                break;
            }
            case 1: {
                // Dry desert bush — gnarled woody branches
                const baseR = size * 0.18;
                ctx.fillStyle = '#4a3012';
                ctx.beginPath();
                ctx.ellipse(x, y, baseR, baseR * 0.50, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#6a4a1c';
                ctx.beginPath();
                ctx.ellipse(x - baseR * 0.15, y - baseR * 0.1, baseR * 0.68, baseR * 0.32, -0.2, 0, Math.PI * 2);
                ctx.fill();
                const dryBranches = [
                    { ang: -2.36, len: size * 0.40, lw: 2.3, bend: -0.38 },
                    { ang: -1.88, len: size * 0.44, lw: 2.1, bend: 0.30 },
                    { ang: -1.26, len: size * 0.38, lw: 1.9, bend: -0.22 },
                    { ang: -0.62, len: size * 0.32, lw: 1.7, bend: 0.35 },
                    { ang: -2.76, len: size * 0.34, lw: 1.9, bend: 0.24 },
                    { ang:  3.40, len: size * 0.36, lw: 1.9, bend: -0.28 },
                    { ang:  2.90, len: size * 0.40, lw: 2.1, bend: 0.30 }
                ];
                ctx.lineCap = 'round';
                dryBranches.forEach(b => {
                    const ex = x + Math.cos(b.ang) * b.len;
                    const ey = y + Math.sin(b.ang) * b.len;
                    const mx = x + Math.cos(b.ang + b.bend) * b.len * 0.52;
                    const my = y + Math.sin(b.ang + b.bend) * b.len * 0.52;
                    ctx.strokeStyle = '#7a5522';
                    ctx.lineWidth = b.lw;
                    ctx.beginPath();
                    ctx.moveTo(x, y - baseR * 0.28);
                    ctx.quadraticCurveTo(mx, my, ex, ey);
                    ctx.stroke();
                    ctx.fillStyle = '#c4a040';
                    ctx.beginPath();
                    ctx.arc(ex, ey, b.lw * 1.4, 0, Math.PI * 2);
                    ctx.fill();
                });
                break;
            }
            case 2: {
                // Columnar — no arms, simple ribbed pillar
                const cw = size * 0.12, ch = size * 0.48;
                ctx.fillStyle = primaryColor;
                ctx.beginPath();
                ctx.moveTo(x - cw, y); ctx.lineTo(x - cw, y - ch);
                ctx.quadraticCurveTo(x, y - ch - cw * 0.8, x + cw, y - ch);
                ctx.lineTo(x + cw, y); ctx.closePath(); ctx.fill();
                ctx.fillStyle = accentColor;
                ctx.fillRect(x + cw * 0.38, y - ch, cw * 0.32, ch);
                // Rib marks
                ctx.strokeStyle = accentColor; ctx.lineWidth = 1;
                for (let ri = 0; ri < 4; ri++) {
                    const ry = y - ch + ch * ri * 0.25;
                    ctx.beginPath(); ctx.moveTo(x - cw * 0.88, ry); ctx.lineTo(x - cw * 0.88, ry + ch * 0.18); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(x + cw * 0.88, ry); ctx.lineTo(x + cw * 0.88, ry + ch * 0.18); ctx.stroke();
                }
                ctx.fillStyle = '#c4a140';
                for (let i = 0; i < 4; i++) {
                    const sy = y - ch * 0.20 * (i + 0.5);
                    ctx.beginPath(); ctx.arc(x + cw * 0.52, sy, 1.2, 0, Math.PI * 2); ctx.fill();
                    ctx.beginPath(); ctx.arc(x - cw * 0.52, sy, 1.2, 0, Math.PI * 2); ctx.fill();
                }
                break;
            }
            default: {
                // Prickly pear — stacked rounded pads at varied angles
                // Bottom pad (largest, upright)
                ctx.fillStyle = primaryColor;
                ctx.beginPath(); ctx.ellipse(x, y - size * 0.20, size * 0.18, size * 0.26, 0, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = accentColor;
                ctx.beginPath(); ctx.ellipse(x + size * 0.05, y - size * 0.14, size * 0.14, size * 0.20, 0.18, 0, Math.PI * 2); ctx.fill();
                // Left pad
                ctx.fillStyle = primaryColor;
                ctx.beginPath(); ctx.ellipse(x - size * 0.20, y - size * 0.38, size * 0.13, size * 0.19, -0.45, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = accentColor;
                ctx.beginPath(); ctx.ellipse(x - size * 0.18, y - size * 0.34, size * 0.09, size * 0.14, -0.35, 0, Math.PI * 2); ctx.fill();
                // Right pad (top)
                ctx.fillStyle = primaryColor;
                ctx.beginPath(); ctx.ellipse(x + size * 0.18, y - size * 0.42, size * 0.12, size * 0.17, 0.40, 0, Math.PI * 2); ctx.fill();
                // Spine dots on each pad
                ctx.fillStyle = '#c4a140';
                [[x, y - size * 0.18, 4], [x - size * 0.20, y - size * 0.38, 3], [x + size * 0.18, y - size * 0.42, 3]]
                .forEach(([px, py, cnt]) => {
                    for (let si = 0; si < cnt; si++) {
                        const ang = (si / cnt) * Math.PI * 2;
                        ctx.beginPath();
                        ctx.arc(px + Math.cos(ang) * size * 0.07, py + Math.sin(ang) * size * 0.07, 1.5, 0, Math.PI * 2);
                        ctx.fill();
                    }
                });
                break;
            }
        }
    }

    drawCrystalStructure(x, y, size, primaryColor, accentColor, seed) {
        // Alien crystalline structures for space campaign
        const crystalHeight = size * 0.55;
        
        // Main crystal shaft
        this.ctx.fillStyle = primaryColor;
        this.ctx.beginPath();
        this.ctx.moveTo(x - size * 0.15, y);
        this.ctx.lineTo(x - size * 0.08, y - crystalHeight);
        this.ctx.lineTo(x + size * 0.08, y - crystalHeight);
        this.ctx.lineTo(x + size * 0.15, y);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Crystal facet highlight
        this.ctx.fillStyle = accentColor;
        this.ctx.beginPath();
        this.ctx.moveTo(x - size * 0.08, y - crystalHeight);
        this.ctx.lineTo(x, y - crystalHeight * 0.7);
        this.ctx.lineTo(x + size * 0.08, y - crystalHeight);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Side crystal shards
        if (seed % 2 === 0) {
            this.ctx.fillStyle = primaryColor;
            this.ctx.globalAlpha = 0.7;
            this.ctx.beginPath();
            this.ctx.moveTo(x + size * 0.15, y - size * 0.2);
            this.ctx.lineTo(x + size * 0.3, y - size * 0.35);
            this.ctx.lineTo(x + size * 0.25, y);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        }
        
        // Glow effect
        this.ctx.fillStyle = 'rgba(138, 106, 170, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(x, y - crystalHeight * 0.5, size * 0.25, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawTreeType1(x, y, size, primaryColor, accentColor) {
        // Tall conifer-style tree
        const trunkWidth = size * 0.25;
        const trunkHeight = size * 0.5;
        
        // Trunk
        this.ctx.fillStyle = '#5D4037';
        this.ctx.fillRect(x - trunkWidth * 0.5, y, trunkWidth, trunkHeight);
        
        // Trunk shadow
        this.ctx.fillStyle = '#3E2723';
        this.ctx.fillRect(x, y, trunkWidth * 0.5, trunkHeight);

        // Main foliage cone shape (dark)
        this.ctx.fillStyle = primaryColor;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - size * 0.6);
        this.ctx.lineTo(x + size * 0.35, y - size * 0.1);
        this.ctx.lineTo(x - size * 0.35, y - size * 0.1);
        this.ctx.closePath();
        this.ctx.fill();

        // Mid foliage layer
        this.ctx.fillStyle = accentColor;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - size * 0.35);
        this.ctx.lineTo(x + size * 0.3, y + size * 0.05);
        this.ctx.lineTo(x - size * 0.3, y + size * 0.05);
        this.ctx.closePath();
        this.ctx.fill();

        // Light foliage layer
        this.ctx.fillStyle = primaryColor;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - size * 0.15);
        this.ctx.lineTo(x + size * 0.25, y + size * 0.2);
        this.ctx.lineTo(x - size * 0.25, y + size * 0.2);
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawTreeType2(x, y, size, primaryColor, accentColor) {
        // Deciduous round tree
        const trunkWidth = size * 0.2;
        const trunkHeight = size * 0.4;
        
        // Trunk
        this.ctx.fillStyle = '#6B4423';
        this.ctx.fillRect(x - trunkWidth * 0.5, y, trunkWidth, trunkHeight);
        
        // Trunk highlight
        this.ctx.fillStyle = '#8B5A3C';
        this.ctx.fillRect(x - trunkWidth * 0.5 + trunkWidth * 0.6, y, trunkWidth * 0.4, trunkHeight);

        // Lower foliage - round dark
        this.ctx.fillStyle = '#1B5E20';
        this.ctx.beginPath();
        this.ctx.arc(x, y - size * 0.1, size * 0.4, 0, Math.PI * 2);
        this.ctx.fill();

        // Upper foliage - round medium
        this.ctx.fillStyle = '#2E7D32';
        this.ctx.beginPath();
        this.ctx.arc(x, y - size * 0.35, size * 0.35, 0, Math.PI * 2);
        this.ctx.fill();

        // Top foliage - smaller
        this.ctx.fillStyle = '#43A047';
        this.ctx.beginPath();
        this.ctx.arc(x, y - size * 0.55, size * 0.2, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawTreeType3(x, y, size) {
        // Sparse tree with distinct branches
        const trunkWidth = size * 0.22;
        
        // Trunk
        this.ctx.fillStyle = '#795548';
        this.ctx.fillRect(x - trunkWidth * 0.5, y - size * 0.2, trunkWidth, size * 0.6);
        
        // Trunk shadow
        this.ctx.fillStyle = '#4E342E';
        this.ctx.beginPath();
        this.ctx.arc(x + trunkWidth * 0.25, y, trunkWidth * 0.25, 0, Math.PI * 2);
        this.ctx.fill();

        // Left foliage cluster
        this.ctx.fillStyle = '#1B5E20';
        this.ctx.beginPath();
        this.ctx.arc(x - size * 0.28, y - size * 0.35, size * 0.25, 0, Math.PI * 2);
        this.ctx.fill();

        // Right foliage cluster
        this.ctx.beginPath();
        this.ctx.arc(x + size * 0.28, y - size * 0.3, size * 0.25, 0, Math.PI * 2);
        this.ctx.fill();

        // Top foliage cluster
        this.ctx.fillStyle = '#2E7D32';
        this.ctx.beginPath();
        this.ctx.arc(x, y - size * 0.55, size * 0.3, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawTreeType4(x, y, size) {
        // Pine/Spruce style with layered triangles
        const trunkWidth = size * 0.18;
        
        // Trunk
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(x - trunkWidth * 0.5, y - size * 0.05, trunkWidth, size * 0.45);

        // Bottom foliage layer (widest)
        this.ctx.fillStyle = '#0D3817';
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - size * 0.05);
        this.ctx.lineTo(x + size * 0.38, y + size * 0.15);
        this.ctx.lineTo(x - size * 0.38, y + size * 0.15);
        this.ctx.closePath();
        this.ctx.fill();

        // Middle foliage layer
        this.ctx.fillStyle = '#1B5E20';
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - size * 0.25);
        this.ctx.lineTo(x + size * 0.3, y);
        this.ctx.lineTo(x - size * 0.3, y);
        this.ctx.closePath();
        this.ctx.fill();

        // Top foliage layer (narrow)
        this.ctx.fillStyle = '#2E7D32';
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - size * 0.45);
        this.ctx.lineTo(x + size * 0.2, y - size * 0.15);
        this.ctx.lineTo(x - size * 0.2, y - size * 0.15);
        this.ctx.closePath();
        this.ctx.fill();

        // Very top point
        this.ctx.fillStyle = '#43A047';
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - size * 0.6);
        this.ctx.lineTo(x + size * 0.12, y - size * 0.45);
        this.ctx.lineTo(x - size * 0.12, y - size * 0.45);
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawRock(x, y, size, variant) {
        const terrainInfo = CampaignThemeConfig.getTerrainRenderingInfo(this.currentCampaign);
        const rockColor = terrainInfo.rockColor;
        const rockAccent = terrainInfo.rockAccent;
        const seed = (variant !== undefined && variant !== null) ? variant % 4 : Math.floor(x * 0.5 + y * 0.7) % 4;
        switch(this.currentCampaign) {
            case 'mountain':
                this.drawSnowRock(x, y, size, rockColor, rockAccent, seed);
                break;
            case 'desert':
                this.drawSandstoneRock(x, y, size, rockColor, rockAccent, seed);
                break;
            case 'space':
                this.drawAlienRock(x, y, size, rockColor, rockAccent, seed);
                break;
            default: // forest
                switch(seed) {
                    case 0: this.drawRockType1(x, y, size, rockColor, rockAccent); break;
                    case 1: this.drawRockType2(x, y, size, rockColor, rockAccent); break;
                    case 2: this.drawRockType3(x, y, size, rockColor, rockAccent); break;
                    default: this.drawRockType4(x, y, size, rockColor, rockAccent);
                }
        }
    }

    drawSnowRock(x, y, size, rockColor, rockAccent, seed) {
        switch(seed % 4) {
            case 0: {
                // Rounded boulder with snow cap
                this.ctx.fillStyle = rockColor;
                this.ctx.beginPath(); this.ctx.arc(x, y, size * 0.30, 0, Math.PI * 2); this.ctx.fill();
                this.ctx.fillStyle = rockAccent;
                this.ctx.beginPath(); this.ctx.arc(x + size * 0.10, y + size * 0.10, size * 0.28, 0, Math.PI * 2); this.ctx.fill();
                this.ctx.fillStyle = '#e8f4f8';
                this.ctx.beginPath();
                this.ctx.moveTo(x - size * 0.28, y - size * 0.02);
                this.ctx.bezierCurveTo(x - size * 0.22, y - size * 0.26, x + size * 0.22, y - size * 0.26, x + size * 0.28, y - size * 0.02);
                this.ctx.lineTo(x + size * 0.24, y + size * 0.12);
                this.ctx.bezierCurveTo(x + size * 0.16, y + size * 0.18, x - size * 0.16, y + size * 0.18, x - size * 0.24, y + size * 0.12);
                this.ctx.closePath(); this.ctx.fill();
                this.ctx.fillStyle = 'rgba(232,244,248,0.65)';
                this.ctx.beginPath(); this.ctx.arc(x - size * 0.08, y - size * 0.12, size * 0.09, 0, Math.PI * 2); this.ctx.fill();
                break;
            }
            case 1: {
                // Angular flat slab with snow layer on top edge
                const hw = size * 0.32, hh = size * 0.20;
                this.ctx.fillStyle = rockColor;
                this.ctx.beginPath();
                this.ctx.moveTo(x - hw, y + hh * 0.5); this.ctx.lineTo(x - hw * 0.65, y - hh);
                this.ctx.lineTo(x + hw * 0.65, y - hh * 0.8); this.ctx.lineTo(x + hw, y + hh * 0.5);
                this.ctx.closePath(); this.ctx.fill();
                this.ctx.fillStyle = rockAccent;
                this.ctx.beginPath();
                this.ctx.moveTo(x + hw * 0.65, y - hh * 0.8); this.ctx.lineTo(x + hw, y + hh * 0.5);
                this.ctx.lineTo(x + hw * 0.45, y + hh * 0.5); this.ctx.lineTo(x + hw * 0.30, y - hh * 0.55);
                this.ctx.closePath(); this.ctx.fill();
                this.ctx.fillStyle = 'rgba(235,248,255,0.92)';
                this.ctx.beginPath();
                this.ctx.moveTo(x - hw * 0.72, y - hh * 0.82); this.ctx.lineTo(x - hw * 0.65, y - hh);
                this.ctx.lineTo(x + hw * 0.65, y - hh * 0.8); this.ctx.lineTo(x + hw * 0.52, y - hh * 0.52);
                this.ctx.closePath(); this.ctx.fill();
                break;
            }
            case 2: {
                // Two overlapping boulders with snow
                this.ctx.fillStyle = rockColor;
                this.ctx.beginPath(); this.ctx.arc(x - size * 0.12, y + size * 0.05, size * 0.22, 0, Math.PI * 2); this.ctx.fill();
                this.ctx.fillStyle = '#7a8e9c';
                this.ctx.beginPath(); this.ctx.arc(x + size * 0.12, y - size * 0.04, size * 0.18, 0, Math.PI * 2); this.ctx.fill();
                this.ctx.fillStyle = rockAccent;
                this.ctx.beginPath(); this.ctx.arc(x - size * 0.04, y + size * 0.12, size * 0.20, 0, Math.PI * 2); this.ctx.fill();
                this.ctx.fillStyle = 'rgba(240,248,255,0.78)';
                this.ctx.beginPath(); this.ctx.arc(x - size * 0.14, y - size * 0.10, size * 0.14, 0, Math.PI, true); this.ctx.fill();
                this.ctx.beginPath(); this.ctx.arc(x + size * 0.12, y - size * 0.14, size * 0.11, 0, Math.PI, true); this.ctx.fill();
                break;
            }
            default: {
                // Narrow ice column / pillar
                const pw = size * 0.16, ph = size * 0.38;
                this.ctx.fillStyle = '#8090a0';
                this.ctx.beginPath();
                this.ctx.moveTo(x - pw, y + ph * 0.5); this.ctx.lineTo(x - pw * 1.2, y - ph * 0.2);
                this.ctx.lineTo(x - pw * 0.5, y - ph); this.ctx.lineTo(x + pw * 0.5, y - ph);
                this.ctx.lineTo(x + pw * 1.2, y - ph * 0.2); this.ctx.lineTo(x + pw, y + ph * 0.5);
                this.ctx.closePath(); this.ctx.fill();
                this.ctx.fillStyle = rockAccent;
                this.ctx.beginPath();
                this.ctx.moveTo(x + pw * 0.5, y - ph); this.ctx.lineTo(x + pw * 1.2, y - ph * 0.2);
                this.ctx.lineTo(x + pw, y + ph * 0.5); this.ctx.lineTo(x + pw * 0.3, y + ph * 0.5);
                this.ctx.closePath(); this.ctx.fill();
                this.ctx.fillStyle = 'rgba(235,248,255,0.90)';
                this.ctx.beginPath();
                this.ctx.moveTo(x - pw, y - ph * 0.15); this.ctx.lineTo(x - pw * 0.5, y - ph);
                this.ctx.lineTo(x + pw * 0.5, y - ph); this.ctx.lineTo(x + pw, y - ph * 0.15);
                this.ctx.lineTo(x + pw * 0.5, y - ph * 0.40); this.ctx.lineTo(x - pw * 0.5, y - ph * 0.35);
                this.ctx.closePath(); this.ctx.fill();
                break;
            }
        }
    }

    drawSandstoneRock(x, y, size, rockColor, rockAccent, seed) {
        switch(seed % 4) {
            case 0: {
                // Smooth rounded sandstone boulder (port of renderDesertRock0)
                this.ctx.fillStyle = '#c8944a';
                this.ctx.beginPath(); this.ctx.ellipse(x, y, size*0.30, size*0.24, 0.15, 0, Math.PI*2); this.ctx.fill();
                this.ctx.fillStyle = 'rgba(90,55,12,0.50)';
                this.ctx.beginPath(); this.ctx.ellipse(x+size*0.10, y+size*0.08, size*0.26, size*0.20, 0.15, 0, Math.PI*2); this.ctx.fill();
                this.ctx.fillStyle = 'rgba(228,182,112,0.65)';
                this.ctx.beginPath(); this.ctx.ellipse(x-size*0.10, y-size*0.10, size*0.14, size*0.10, 0.15, 0, Math.PI*2); this.ctx.fill();
                this.ctx.strokeStyle = 'rgba(100,65,18,0.28)'; this.ctx.lineWidth = 1;
                this.ctx.beginPath(); this.ctx.ellipse(x, y, size*0.30, size*0.24, 0.15, 0, Math.PI*2); this.ctx.stroke();
                break;
            }
            case 1: {
                // Layered sandstone slab with visible strata (port of renderDesertRock1)
                const hw = size*0.32, hh = size*0.22;
                this.ctx.fillStyle = '#b88540';
                this.ctx.beginPath();
                this.ctx.moveTo(x-hw, y+hh*0.6); this.ctx.lineTo(x-hw*0.8, y-hh*0.6);
                this.ctx.lineTo(x+hw*0.8, y-hh*0.5); this.ctx.lineTo(x+hw, y+hh*0.6);
                this.ctx.closePath(); this.ctx.fill();
                this.ctx.strokeStyle = '#8a6020'; this.ctx.lineWidth = 1.5;
                for (let i = 0; i < 3; i++) {
                    const ly = y - hh*0.35 + i * hh*0.48;
                    this.ctx.beginPath(); this.ctx.moveTo(x-hw*0.78, ly); this.ctx.lineTo(x+hw*0.78, ly+hh*0.04); this.ctx.stroke();
                }
                this.ctx.fillStyle = 'rgba(208,162,86,0.62)';
                this.ctx.beginPath();
                this.ctx.moveTo(x-hw*0.8, y-hh*0.6); this.ctx.lineTo(x+hw*0.8, y-hh*0.5);
                this.ctx.lineTo(x+hw*0.72, y-hh*0.22); this.ctx.lineTo(x-hw*0.7, y-hh*0.25);
                this.ctx.closePath(); this.ctx.fill();
                this.ctx.fillStyle = 'rgba(80,45,8,0.38)';
                this.ctx.beginPath();
                this.ctx.moveTo(x+hw*0.8, y-hh*0.5); this.ctx.lineTo(x+hw, y+hh*0.6);
                this.ctx.lineTo(x+hw*0.6, y+hh*0.6); this.ctx.lineTo(x+hw*0.6, y-hh*0.32);
                this.ctx.closePath(); this.ctx.fill();
                break;
            }
            case 2: {
                // Angular faceted sandstone rock (port of renderDesertRock2)
                this.ctx.fillStyle = '#a87838';
                this.ctx.beginPath();
                this.ctx.moveTo(x-size*0.22, y-size*0.14); this.ctx.lineTo(x+size*0.16, y-size*0.22);
                this.ctx.lineTo(x+size*0.28, y+size*0.06); this.ctx.lineTo(x+size*0.12, y+size*0.26);
                this.ctx.lineTo(x-size*0.20, y+size*0.24); this.ctx.lineTo(x-size*0.30, y+size*0.04);
                this.ctx.closePath(); this.ctx.fill();
                this.ctx.fillStyle = 'rgba(210,162,80,0.60)';
                this.ctx.beginPath();
                this.ctx.moveTo(x-size*0.22, y-size*0.14); this.ctx.lineTo(x+size*0.16, y-size*0.22);
                this.ctx.lineTo(x+size*0.05, y-size*0.04); this.ctx.lineTo(x-size*0.15, y-size*0.02);
                this.ctx.closePath(); this.ctx.fill();
                this.ctx.fillStyle = 'rgba(70,40,8,0.42)';
                this.ctx.beginPath();
                this.ctx.moveTo(x+size*0.12, y+size*0.26); this.ctx.lineTo(x-size*0.20, y+size*0.24);
                this.ctx.lineTo(x-size*0.10, y+size*0.10); this.ctx.lineTo(x+size*0.08, y+size*0.12);
                this.ctx.closePath(); this.ctx.fill();
                break;
            }
            default: {
                // Cluster of warm sandstone pebbles (port of renderDesertRock3)
                [[-0.14,0.06,0.15,0.11,-0.2],[0.13,-0.05,0.13,0.09,0.3],[0.0,0.16,0.11,0.08,0.1]]
                .forEach(([ox,oy,sw,sh,ang]) => {
                    this.ctx.fillStyle = '#c49048';
                    this.ctx.beginPath(); this.ctx.ellipse(x+ox*size, y+oy*size, sw*size, sh*size, ang, 0, Math.PI*2); this.ctx.fill();
                    this.ctx.fillStyle = 'rgba(85,50,10,0.45)';
                    this.ctx.beginPath(); this.ctx.ellipse(x+ox*size+sw*size*0.25, y+oy*size+sh*size*0.25, sw*size*0.68, sh*size*0.68, ang, 0, Math.PI*2); this.ctx.fill();
                    this.ctx.fillStyle = 'rgba(212,170,92,0.58)';
                    this.ctx.beginPath(); this.ctx.ellipse(x+ox*size-sw*size*0.20, y+oy*size-sh*size*0.22, sw*size*0.38, sh*size*0.32, ang, 0, Math.PI*2); this.ctx.fill();
                });
                break;
            }
        }
    }

    drawAlienRock(x, y, size, rockColor, rockAccent, seed) {
        // Weird alien rocks - 5 abstract variations
        const typeIndex = seed % 5;
        
        switch(typeIndex) {
            case 0:
                this.drawSpaceRockFractal(x, y, size);
                break;
            case 1:
                this.drawSpaceRockSpiky(x, y, size);
                break;
            case 2:
                this.drawSpaceRockCrystalline(x, y, size);
                break;
            case 3:
                this.drawSpaceRockVoid(x, y, size);
                break;
            default:
                this.drawSpaceRockNonEuclidean(x, y, size);
        }
    }

    drawSpaceRockFractal(x, y, size) {
        // Asteroid with deterministic surface marks — no Math.random, no flicker
        const s = (a, b) => Math.abs(Math.sin(x * 0.43 + y * 0.17 + a * 2.3 + b * 1.7));

        // Main jagged body
        this.ctx.fillStyle = '#5a4a7a';
        const points = [
            {x: -0.25, y: -0.30}, {x: 0.15, y: -0.35},
            {x: 0.28, y: -0.10}, {x: 0.35, y: 0.15},
            {x: 0.20, y: 0.30},  {x: -0.10, y: 0.35},
            {x: -0.32, y: 0.10}, {x: -0.30, y: -0.15}
        ];
        this.ctx.beginPath();
        this.ctx.moveTo(x + points[0].x * size, y + points[0].y * size);
        for (let i = 1; i < points.length; i++) {
            this.ctx.lineTo(x + points[i].x * size, y + points[i].y * size);
        }
        this.ctx.closePath();
        this.ctx.fill();

        // Highlight face (top-left facet)
        this.ctx.fillStyle = 'rgba(120,88,180,0.55)';
        this.ctx.beginPath();
        this.ctx.moveTo(x + points[0].x * size, y + points[0].y * size);
        this.ctx.lineTo(x + points[1].x * size, y + points[1].y * size);
        this.ctx.lineTo(x, y);
        this.ctx.closePath();
        this.ctx.fill();

        // Deterministic surface veins — positions seeded from x,y
        this.ctx.strokeStyle = 'rgba(200,150,255,0.45)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < 6; i++) {
            const fx = (s(i, 0) - 0.5) * size * 0.38;
            const fy = (s(i, 1) - 0.5) * size * 0.38;
            const ang = s(i, 2) * Math.PI * 2;
            const len = size * (0.04 + s(i, 3) * 0.07);
            this.ctx.beginPath();
            this.ctx.moveTo(x + fx, y + fy);
            this.ctx.lineTo(x + fx + Math.cos(ang) * len, y + fy + Math.sin(ang) * len);
            this.ctx.stroke();
        }

        // Glowing edge outline
        this.ctx.strokeStyle = 'rgba(150,100,255,0.70)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x + points[0].x * size, y + points[0].y * size);
        for (let i = 1; i < points.length; i++) {
            this.ctx.lineTo(x + points[i].x * size, y + points[i].y * size);
        }
        this.ctx.closePath();
        this.ctx.stroke();

        // Dark void center
        this.ctx.fillStyle = 'rgba(40,20,60,0.80)';
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 0.12, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawSpaceRockSpiky(x, y, size) {
        // Jagged asteroid with bioluminescent spikes
        this.ctx.fillStyle = '#6a4a8a';
        
        // Main body
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 0.22, 0, Math.PI * 2);
        this.ctx.fill();

        // Spike protrusions in all directions
        const spikeCount = 12;
        for (let i = 0; i < spikeCount; i++) {
            const angle = (i / spikeCount) * Math.PI * 2;
            const baseX = x + Math.cos(angle) * size * 0.22;
            const baseY = y + Math.sin(angle) * size * 0.22;
            const tipX = x + Math.cos(angle) * size * 0.35;
            const tipY = y + Math.sin(angle) * size * 0.35;

            // Spike body
            this.ctx.fillStyle = '#5a3a7a';
            this.ctx.beginPath();
            this.ctx.moveTo(baseX, baseY);
            this.ctx.lineTo(tipX, tipY);
            this.ctx.lineTo(baseX + Math.cos(angle + 0.2) * size * 0.08, baseY + Math.sin(angle + 0.2) * size * 0.08);
            this.ctx.closePath();
            this.ctx.fill();

            // Bioluminescent glow on spike
            this.ctx.strokeStyle = `rgba(100, ${150 + Math.sin(i) * 50}, 255, 0.8)`;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(baseX, baseY);
            this.ctx.lineTo(tipX, tipY);
            this.ctx.stroke();
        }

        // Glow core
        this.ctx.fillStyle = 'rgba(100, 150, 255, 0.6)';
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 0.18, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawSpaceRockCrystalline(x, y, size) {
        // Crystalline hexagonal structure
        const hexagonSize = size * 0.25;
        
        // Main crystal body
        this.ctx.fillStyle = '#7a5aaa';
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const px = x + Math.cos(angle) * hexagonSize;
            const py = y + Math.sin(angle) * hexagonSize;
            if (i === 0) this.ctx.moveTo(px, py);
            else this.ctx.lineTo(px, py);
        }
        this.ctx.closePath();
        this.ctx.fill();

        // Inner crystal layers
        this.ctx.fillStyle = '#9a7aaa';
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const px = x + Math.cos(angle) * hexagonSize * 0.6;
            const py = y + Math.sin(angle) * hexagonSize * 0.6;
            if (i === 0) this.ctx.moveTo(px, py);
            else this.ctx.lineTo(px, py);
        }
        this.ctx.closePath();
        this.ctx.fill();

        // Radiating glow rays
        this.ctx.strokeStyle = 'rgba(200, 150, 255, 0.7)';
        this.ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const startX = x + Math.cos(angle) * hexagonSize;
            const startY = y + Math.sin(angle) * hexagonSize;
            const endX = x + Math.cos(angle) * hexagonSize * 1.4;
            const endY = y + Math.sin(angle) * hexagonSize * 1.4;
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
        }

        // Center glow
        this.ctx.fillStyle = 'rgba(200, 150, 255, 0.9)';
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 0.1, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawSpaceRockVoid(x, y, size) {
        // Floating chunk with impossible topology
        // Outer distorted form
        this.ctx.fillStyle = '#4a3a6a';
        this.ctx.beginPath();
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const distortion = 0.15 + Math.sin(angle * 3) * 0.1;
            const px = x + Math.cos(angle) * size * distortion;
            const py = y + Math.sin(angle) * size * distortion;
            if (i === 0) this.ctx.moveTo(px, py);
            else this.ctx.lineTo(px, py);
        }
        this.ctx.closePath();
        this.ctx.fill();

        // Energy field distortion ring
        this.ctx.strokeStyle = 'rgba(150, 100, 200, 0.5)';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const radius = size * (0.2 + Math.sin(angle * 4) * 0.08);
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            if (i === 0) this.ctx.moveTo(px, py);
            else this.ctx.lineTo(px, py);
        }
        this.ctx.closePath();
        this.ctx.stroke();

        // Void core - darker than surrounding space
        this.ctx.fillStyle = 'rgba(20, 10, 40, 0.9)';
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 0.12, 0, Math.PI * 2);
        this.ctx.fill();

        // Void event horizon
        this.ctx.strokeStyle = 'rgba(200, 100, 255, 0.8)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 0.12, 0, Math.PI * 2);
        this.ctx.stroke();
    }

    drawSpaceRockNonEuclidean(x, y, size) {
        // Non-euclidean geometry rock with bezier curves and energy field
        // Multiple overlapping surfaces at impossible angles
        
        // First impossible surface
        this.ctx.fillStyle = '#6a4a9a';
        this.ctx.beginPath();
        this.ctx.moveTo(x - size * 0.25, y - size * 0.2);
        this.ctx.bezierCurveTo(
            x - size * 0.3, y - size * 0.35,
            x + size * 0.1, y - size * 0.4,
            x + size * 0.3, y - size * 0.1
        );
        this.ctx.lineTo(x + size * 0.2, y + size * 0.15);
        this.ctx.bezierCurveTo(
            x + size * 0.05, y + size * 0.3,
            x - size * 0.15, y + size * 0.25,
            x - size * 0.25, y + size * 0.05
        );
        this.ctx.closePath();
        this.ctx.fill();

        // Second overlapping surface
        this.ctx.fillStyle = '#7a5aaa';
        this.ctx.globalAlpha = 0.7;
        this.ctx.beginPath();
        this.ctx.moveTo(x - size * 0.15, y - size * 0.25);
        this.ctx.bezierCurveTo(
            x - size * 0.05, y - size * 0.38,
            x + size * 0.25, y - size * 0.3,
            x + size * 0.25, y);
        this.ctx.lineTo(x + size * 0.1, y + size * 0.2);
        this.ctx.bezierCurveTo(
            x - size * 0.05, y + size * 0.2,
            x - size * 0.2, y + size * 0.1,
            x - size * 0.15, y - size * 0.1
        );
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.globalAlpha = 1;

        // Energy flowing between surfaces
        this.ctx.strokeStyle = 'rgba(150, 100, 255, 0.6)';
        this.ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            const progress = i / 5;
            const startX = x - size * 0.25 + size * 0.5 * progress;
            const startY = y - size * 0.2;
            const endX = x - size * 0.25 + size * 0.5 * progress;
            const endY = y + size * 0.2;
            
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.quadraticCurveTo(
                startX + Math.sin(progress * Math.PI * 4) * size * 0.1,
                (startY + endY) * 0.5,
                endX, endY
            );
            this.ctx.stroke();
        }

        // Edge glow
        this.ctx.strokeStyle = 'rgba(150, 100, 255, 0.9)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x - size * 0.25, y - size * 0.2);
        this.ctx.bezierCurveTo(
            x - size * 0.3, y - size * 0.35,
            x + size * 0.1, y - size * 0.4,
            x + size * 0.3, y - size * 0.1
        );
        this.ctx.stroke();
    }

    drawRockType1(x, y, size, primaryColor, accentColor) {
        // Jagged irregular rock — matches game renderRockType1
        const ctx = this.ctx;
        
        // Drop shadow
        ctx.fillStyle = '#1a1a18';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.34, y + size * 0.23);
        ctx.lineTo(x - size * 0.36, y - size * 0.22);
        ctx.lineTo(x - size * 0.21, y - size * 0.38);
        ctx.lineTo(x + size * 0.06, y - size * 0.43);
        ctx.lineTo(x + size * 0.36, y - size * 0.13);
        ctx.lineTo(x + size * 0.35, y + size * 0.28);
        ctx.lineTo(x + 1, y + size * 0.42);
        ctx.closePath();
        ctx.fill();
        
        // Main rock body
        ctx.fillStyle = '#5e5e5e';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.35, y - size * 0.25);
        ctx.lineTo(x - size * 0.2, y - size * 0.4);
        ctx.lineTo(x + size * 0.05, y - size * 0.45);
        ctx.lineTo(x + size * 0.35, y - size * 0.15);
        ctx.lineTo(x + size * 0.32, y + size * 0.25);
        ctx.lineTo(x, y + size * 0.38);
        ctx.lineTo(x - size * 0.35, y + size * 0.2);
        ctx.closePath();
        ctx.fill();
        
        // Right shadow face
        ctx.fillStyle = '#3a3a3a';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.32, y + size * 0.25);
        ctx.lineTo(x + size * 0.35, y - size * 0.15);
        ctx.lineTo(x + size * 0.05, y - size * 0.45);
        ctx.lineTo(x + size * 0.08, y - size * 0.3);
        ctx.lineTo(x + size * 0.02, y + size * 0.32);
        ctx.closePath();
        ctx.fill();
        
        // Light highlights on upper faces
        ctx.fillStyle = '#8a8a8a';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.2, y - size * 0.4);
        ctx.lineTo(x + size * 0.05, y - size * 0.45);
        ctx.lineTo(x - size * 0.05, y - size * 0.25);
        ctx.closePath();
        ctx.fill();
        
        // Weathering spots
        ctx.fillStyle = '#4a4440';
        for (let i = 0; i < 4; i++) {
            const offsetX = (Math.sin(i * 1.7 + x * 0.015) - 0.5) * size * 0.3;
            const offsetY = (Math.cos(i * 1.7 + y * 0.015) - 0.5) * size * 0.22;
            const spotSize = size * (0.06 + Math.abs(Math.sin(i * 0.7)) * 0.03);
            ctx.beginPath();
            ctx.arc(x + offsetX, y + offsetY, spotSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Rock cracks
        ctx.strokeStyle = '#2a2a28';
        ctx.lineWidth = 1.5;
        const crackCount = 2 + Math.floor(Math.abs(Math.sin(x * 0.02)) * 2);
        for (let i = 0; i < crackCount; i++) {
            const startX = (Math.sin(i * 0.7 + x * 0.01) - 0.5) * size * 0.3;
            const startY = (Math.cos(i * 0.7 + y * 0.01) - 0.5) * size * 0.2;
            const endX = startX + (Math.sin(i * 1.2 + x * 0.02) - 0.5) * size * 0.2;
            const endY = startY + (Math.cos(i * 1.2 + y * 0.02) - 0.5) * size * 0.15;
            ctx.beginPath();
            ctx.moveTo(x + startX, y + startY);
            ctx.lineTo(x + endX, y + endY);
            ctx.stroke();
        }
        
        // Outline
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x - size * 0.35, y - size * 0.25);
        ctx.lineTo(x - size * 0.2, y - size * 0.4);
        ctx.lineTo(x + size * 0.05, y - size * 0.45);
        ctx.lineTo(x + size * 0.35, y - size * 0.15);
        ctx.lineTo(x + size * 0.32, y + size * 0.25);
        ctx.lineTo(x, y + size * 0.38);
        ctx.lineTo(x - size * 0.35, y + size * 0.2);
        ctx.closePath();
        ctx.stroke();
    }

    drawRockType2(x, y, size, primaryColor, accentColor) {
        // Irregular boulder — matches game renderRockType2
        const ctx = this.ctx;
        
        // Drop shadow
        ctx.fillStyle = '#1a1a18';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.30, y + size * 0.22);
        ctx.lineTo(x - size * 0.36, y + size * 0.05);
        ctx.lineTo(x - size * 0.28, y - size * 0.22);
        ctx.lineTo(x - size * 0.08, y - size * 0.34);
        ctx.lineTo(x + size * 0.20, y - size * 0.30);
        ctx.lineTo(x + size * 0.36, y - size * 0.10);
        ctx.lineTo(x + size * 0.34, y + size * 0.18);
        ctx.lineTo(x + size * 0.18, y + size * 0.30);
        ctx.lineTo(x - size * 0.10, y + size * 0.32);
        ctx.closePath();
        ctx.fill();
        
        // Main boulder body — irregular polygon
        ctx.fillStyle = '#636363';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.32, y + size * 0.18);
        ctx.lineTo(x - size * 0.38, y + size * 0.02);
        ctx.lineTo(x - size * 0.30, y - size * 0.20);
        ctx.lineTo(x - size * 0.10, y - size * 0.36);
        ctx.lineTo(x + size * 0.18, y - size * 0.32);
        ctx.lineTo(x + size * 0.34, y - size * 0.12);
        ctx.lineTo(x + size * 0.32, y + size * 0.15);
        ctx.lineTo(x + size * 0.16, y + size * 0.28);
        ctx.lineTo(x - size * 0.12, y + size * 0.30);
        ctx.closePath();
        ctx.fill();
        
        // Darker right/bottom face
        ctx.fillStyle = '#444444';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.34, y - size * 0.12);
        ctx.lineTo(x + size * 0.32, y + size * 0.15);
        ctx.lineTo(x + size * 0.16, y + size * 0.28);
        ctx.lineTo(x - size * 0.12, y + size * 0.30);
        ctx.lineTo(x - size * 0.05, y + size * 0.10);
        ctx.lineTo(x + size * 0.15, y - size * 0.05);
        ctx.closePath();
        ctx.fill();
        
        // Light highlight on upper-left
        ctx.fillStyle = '#9a9a9a';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.30, y - size * 0.20);
        ctx.lineTo(x - size * 0.10, y - size * 0.36);
        ctx.lineTo(x + size * 0.08, y - size * 0.28);
        ctx.lineTo(x - size * 0.12, y - size * 0.10);
        ctx.closePath();
        ctx.fill();
        
        // Secondary highlight
        ctx.fillStyle = '#888888';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.38, y + size * 0.02);
        ctx.lineTo(x - size * 0.30, y - size * 0.15);
        ctx.lineTo(x - size * 0.18, y - size * 0.02);
        ctx.lineTo(x - size * 0.28, y + size * 0.08);
        ctx.closePath();
        ctx.fill();
        
        // Weathering spots
        ctx.fillStyle = '#4e4844';
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2 + 0.5;
            const distance = size * (0.12 + Math.abs(Math.sin(i * 0.5)) * 0.08);
            const vx = x + Math.cos(angle) * distance;
            const vy = y + Math.sin(angle) * distance;
            const spotSize = size * (0.05 + Math.abs(Math.cos(i * 0.7)) * 0.03);
            ctx.beginPath();
            ctx.arc(vx, vy, spotSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Subtle cracks
        ctx.strokeStyle = '#2e2e2c';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x - size * 0.10, y - size * 0.15);
        ctx.lineTo(x + size * 0.10, y + size * 0.12);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + size * 0.05, y - size * 0.20);
        ctx.lineTo(x + size * 0.20, y + size * 0.05);
        ctx.stroke();
        
        // Outline
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x - size * 0.32, y + size * 0.18);
        ctx.lineTo(x - size * 0.38, y + size * 0.02);
        ctx.lineTo(x - size * 0.30, y - size * 0.20);
        ctx.lineTo(x - size * 0.10, y - size * 0.36);
        ctx.lineTo(x + size * 0.18, y - size * 0.32);
        ctx.lineTo(x + size * 0.34, y - size * 0.12);
        ctx.lineTo(x + size * 0.32, y + size * 0.15);
        ctx.lineTo(x + size * 0.16, y + size * 0.28);
        ctx.lineTo(x - size * 0.12, y + size * 0.30);
        ctx.closePath();
        ctx.stroke();
    }

    drawRockType3(x, y, size, primaryColor, accentColor) {
        // Jagged angular rock — matches game renderRockType3
        const ctx = this.ctx;
        
        // Drop shadow
        ctx.fillStyle = '#1a1a18';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.34, y + size * 0.28);
        ctx.lineTo(x - size * 0.36, y - size * 0.09);
        ctx.lineTo(x - size * 0.1, y - size * 0.37);
        ctx.lineTo(x + size * 0.32, y - size * 0.17);
        ctx.lineTo(x + size * 0.36, y + size * 0.31);
        ctx.closePath();
        ctx.fill();
        
        // Main rock body
        ctx.fillStyle = '#585858';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.36, y - size * 0.12);
        ctx.lineTo(x - size * 0.1, y - size * 0.38);
        ctx.lineTo(x + size * 0.32, y - size * 0.18);
        ctx.lineTo(x + size * 0.35, y + size * 0.28);
        ctx.lineTo(x - size * 0.35, y + size * 0.25);
        ctx.closePath();
        ctx.fill();
        
        // Highlighted face (left side)
        ctx.fillStyle = '#8a8a8a';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.36, y - size * 0.12);
        ctx.lineTo(x - size * 0.1, y - size * 0.38);
        ctx.lineTo(x + size * 0.15, y - size * 0.1);
        ctx.closePath();
        ctx.fill();
        
        // Darker right side face
        ctx.fillStyle = '#3e3e3e';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.1, y - size * 0.38);
        ctx.lineTo(x + size * 0.32, y - size * 0.18);
        ctx.lineTo(x + size * 0.15, y - size * 0.1);
        ctx.closePath();
        ctx.fill();
        
        // Weathering spots
        ctx.fillStyle = '#4a4440';
        for (let i = 0; i < 4; i++) {
            const offsetX = (Math.sin(i * 1.5 + x * 0.01) - 0.5) * size * 0.28;
            const offsetY = (Math.cos(i * 1.5 + y * 0.01) - 0.5) * size * 0.20;
            const spotSize = size * (0.05 + Math.abs(Math.sin(i * 0.6)) * 0.03);
            ctx.beginPath();
            ctx.arc(x + offsetX, y + offsetY, spotSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Cracks
        ctx.strokeStyle = '#2a2a28';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(x - size * 0.1, y - size * 0.2);
        ctx.lineTo(x + size * 0.1, y + size * 0.12);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x - size * 0.05, y - size * 0.35);
        ctx.lineTo(x + size * 0.15, y - size * 0.05);
        ctx.stroke();
        
        // Outline
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x - size * 0.36, y - size * 0.12);
        ctx.lineTo(x - size * 0.1, y - size * 0.38);
        ctx.lineTo(x + size * 0.32, y - size * 0.18);
        ctx.lineTo(x + size * 0.35, y + size * 0.28);
        ctx.lineTo(x - size * 0.35, y + size * 0.25);
        ctx.closePath();
        ctx.stroke();
    }

    drawRockType4(x, y, size, primaryColor, accentColor) {
        // Jagged rocky formation — matches game renderRockType4
        const ctx = this.ctx;
        
        // Drop shadow
        ctx.fillStyle = '#1a1a18';
        ctx.beginPath();
        ctx.ellipse(x + size * 0.05, y + size * 0.24, size * 0.38, size * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Main rock body - irregular polygon
        ctx.fillStyle = '#5e5e5e';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.25, y + size * 0.2);
        ctx.lineTo(x - size * 0.35, y - size * 0.1);
        ctx.lineTo(x - size * 0.2, y - size * 0.32);
        ctx.lineTo(x + size * 0.05, y - size * 0.35);
        ctx.lineTo(x + size * 0.3, y - size * 0.15);
        ctx.lineTo(x + size * 0.32, y + size * 0.15);
        ctx.lineTo(x + size * 0.15, y + size * 0.22);
        ctx.closePath();
        ctx.fill();
        
        // Left highlighted face
        ctx.fillStyle = '#8a8a8a';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.25, y + size * 0.2);
        ctx.lineTo(x - size * 0.35, y - size * 0.1);
        ctx.lineTo(x - size * 0.2, y - size * 0.32);
        ctx.lineTo(x - size * 0.05, y - size * 0.1);
        ctx.closePath();
        ctx.fill();
        
        // Top bright face
        ctx.fillStyle = '#9a9a9a';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.2, y - size * 0.32);
        ctx.lineTo(x + size * 0.05, y - size * 0.35);
        ctx.lineTo(x + size * 0.15, y - size * 0.2);
        ctx.lineTo(x - size * 0.05, y - size * 0.15);
        ctx.closePath();
        ctx.fill();
        
        // Dark right face
        ctx.fillStyle = '#3a3a3a';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.05, y - size * 0.35);
        ctx.lineTo(x + size * 0.3, y - size * 0.15);
        ctx.lineTo(x + size * 0.2, y + size * 0.05);
        ctx.lineTo(x + size * 0.05, y - size * 0.1);
        ctx.closePath();
        ctx.fill();
        
        // Weathering stains
        ctx.fillStyle = '#4a4440';
        for (let i = 0; i < 5; i++) {
            const offsetX = (Math.sin(i * 1.2 + x * 0.01) - 0.5) * size * 0.3;
            const offsetY = (Math.cos(i * 1.2 + y * 0.01) - 0.5) * size * 0.25;
            const spotSize = size * (0.05 + Math.abs(Math.sin(i * 0.6)) * 0.03);
            ctx.beginPath();
            ctx.arc(x + offsetX, y + offsetY, spotSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Cracks
        ctx.strokeStyle = '#2a2a28';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x - size * 0.15, y - size * 0.15);
        ctx.lineTo(x + size * 0.1, y + size * 0.1);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.25);
        ctx.lineTo(x - size * 0.1, y + size * 0.15);
        ctx.stroke();
        
        // Outline
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x - size * 0.25, y + size * 0.2);
        ctx.lineTo(x - size * 0.35, y - size * 0.1);
        ctx.lineTo(x - size * 0.2, y - size * 0.32);
        ctx.lineTo(x + size * 0.05, y - size * 0.35);
        ctx.lineTo(x + size * 0.3, y - size * 0.15);
        ctx.lineTo(x + size * 0.32, y + size * 0.15);
        ctx.lineTo(x + size * 0.15, y + size * 0.22);
        ctx.closePath();
        ctx.stroke();
    }

    drawLake(x, y, size) {
        // Create organic water shape with rounded edges
        // Use 0.7 multiplier to match collision radius (size * 0.71 in markTerrainCells)
        const radius = size * 0.7;
        
        // Water gradient
        const gradient = this.ctx.createRadialGradient(x - size * 0.1, y - size * 0.1, 0, x, y, radius * 1.2);
        gradient.addColorStop(0, '#0277BD');
        gradient.addColorStop(0.6, '#01579B');
        gradient.addColorStop(1, '#004D7A');
        this.ctx.fillStyle = gradient;
        
        // Draw organic water shape with perlin-like noise using sine waves
        this.ctx.beginPath();
        const points = 16;
        for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2;
            // Add sine-based variation to radius for organic look
            const noise = Math.sin(angle * 3 + x * 0.1 + y * 0.1) * 0.15 + Math.sin(angle * 7 + x * 0.05) * 0.1;
            const currentRadius = radius * (0.8 + noise);
            const px = x + Math.cos(angle) * currentRadius;
            const py = y + Math.sin(angle) * currentRadius;
            
            if (i === 0) {
                this.ctx.moveTo(px, py);
            } else {
                this.ctx.lineTo(px, py);
            }
        }
        this.ctx.closePath();
        this.ctx.fill();
        
        // Water edge with soft border
        this.ctx.strokeStyle = '#0277BD';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        // Subtle wave reflections
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        this.ctx.lineWidth = 0.5;
        for (let i = 0; i < 2; i++) {
            const waveRadius = radius * (0.3 + i * 0.3);
            this.ctx.beginPath();
            const wavePoints = 12;
            for (let j = 0; j < wavePoints; j++) {
                const angle = (j / wavePoints) * Math.PI * 2;
                const waveNoise = Math.sin(angle * 2 + x * 0.1) * 0.1;
                const px = x + Math.cos(angle) * (waveRadius * (0.9 + waveNoise));
                const py = y + Math.sin(angle) * (waveRadius * (0.9 + waveNoise));
                if (j === 0) {
                    this.ctx.moveTo(px, py);
                } else {
                    this.ctx.lineTo(px, py);
                }
            }
            this.ctx.closePath();
            this.ctx.stroke();
        }
    }

    drawRiver(x, y, size, flowAngle) {
        // River rendering is handled entirely by drawRiversSmooth()
        // No cell-based rendering needed - smooth line rendering creates the complete visualization
    }

    drawVegetation(x, y, size, variant) {
        if (this.currentCampaign === 'mountain') {
            this.drawMountainVegetation(x, y, size, variant);
        } else if (this.currentCampaign === 'space') {
            this.drawSpaceVegetation(x, y, size, variant);
        } else if (this.currentCampaign === 'desert') {
            this.drawDesertVegetation(x, y, size, variant);
        } else {
            this.drawTree(x, y, size, variant);
        }
    }

    drawMountainVegetation(x, y, size, variant) {
        const seed = (variant !== undefined && variant !== null) ? variant % 3 : Math.floor(x * 0.5 + y * 0.7) % 3;
        switch(seed) {
            case 0: this.drawMountainPine1(x, y, size); break;
            case 1: this.drawMountainPine2(x, y, size); break;
            default: this.drawMountainPine3(x, y, size);
        }
    }

    drawMountainPine1(x, y, size) {
        // Tall pine with heavy snow
        const trunkWidth = size * 0.2;
        const trunkHeight = size * 0.45;

        // Trunk
        this.ctx.fillStyle = '#654321';
        this.ctx.fillRect(x - trunkWidth * 0.5, y, trunkWidth, trunkHeight);

        // Tree shape - dark green cone
        this.ctx.fillStyle = '#1a4d2e';
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - size * 0.65);
        this.ctx.lineTo(x + size * 0.4, y - size * 0.05);
        this.ctx.lineTo(x - size * 0.4, y - size * 0.05);
        this.ctx.closePath();
        this.ctx.fill();

        // Mid-layer
        this.ctx.fillStyle = '#2d5a3d';
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - size * 0.35);
        this.ctx.lineTo(x + size * 0.35, y + size * 0.15);
        this.ctx.lineTo(x - size * 0.35, y + size * 0.15);
        this.ctx.closePath();
        this.ctx.fill();

        // Snow cap - white frosting on top
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - size * 0.62);
        this.ctx.lineTo(x + size * 0.12, y - size * 0.4);
        this.ctx.lineTo(x - size * 0.12, y - size * 0.4);
        this.ctx.closePath();
        this.ctx.fill();

        // Snow on middle branches
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.beginPath();
        this.ctx.moveTo(x + size * 0.15, y - size * 0.2);
        this.ctx.lineTo(x + size * 0.28, y);
        this.ctx.lineTo(x + size * 0.08, y);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.moveTo(x - size * 0.15, y - size * 0.2);
        this.ctx.lineTo(x - size * 0.28, y);
        this.ctx.lineTo(x - size * 0.08, y);
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawMountainPine2(x, y, size) {
        // Medium pine, less snow
        const trunkWidth = size * 0.18;
        const trunkHeight = size * 0.4;

        // Trunk
        this.ctx.fillStyle = '#704020';
        this.ctx.fillRect(x - trunkWidth * 0.5, y, trunkWidth, trunkHeight);

        // Main tree cone
        this.ctx.fillStyle = '#2d5a3d';
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - size * 0.55);
        this.ctx.lineTo(x + size * 0.35, y);
        this.ctx.lineTo(x - size * 0.35, y);
        this.ctx.closePath();
        this.ctx.fill();

        // Darker accent
        this.ctx.fillStyle = '#1a3d28';
        this.ctx.beginPath();
        this.ctx.moveTo(x - size * 0.15, y - size * 0.3);
        this.ctx.lineTo(x + size * 0.15, y - size * 0.3);
        this.ctx.lineTo(x - size * 0.28, y + size * 0.1);
        this.ctx.closePath();
        this.ctx.fill();

        // Light snow cap
        this.ctx.fillStyle = '#f5f5f5';
        this.ctx.beginPath();
        this.ctx.arc(x, y - size * 0.5, size * 0.08, 0, Math.PI * 2);
        this.ctx.fill();

        // Snow on edges
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        for (let i = 0; i < 2; i++) {
            const angle = (i / 2) * Math.PI;
            const px = x + Math.cos(angle - Math.PI / 2) * size * 0.25;
            const py = y - size * 0.15;
            this.ctx.beginPath();
            this.ctx.arc(px, py, size * 0.06, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawMountainPine3(x, y, size) {
        // Small shrubby pine
        const trunkWidth = size * 0.15;
        const trunkHeight = size * 0.35;

        // Trunk
        this.ctx.fillStyle = '#8b5a3c';
        this.ctx.fillRect(x - trunkWidth * 0.5, y, trunkWidth, trunkHeight);

        // Bushy tree shape
        this.ctx.fillStyle = '#3d6d4d';
        this.ctx.beginPath();
        this.ctx.ellipse(x, y - size * 0.2, size * 0.3, size * 0.4, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Dark shadow side
        this.ctx.fillStyle = '#1a3d28';
        this.ctx.beginPath();
        this.ctx.ellipse(x + size * 0.1, y - size * 0.2, size * 0.2, size * 0.35, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Snow patches
        this.ctx.fillStyle = '#e8e8e8';
        this.ctx.beginPath();
        this.ctx.arc(x - size * 0.15, y - size * 0.35, size * 0.1, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.arc(x + size * 0.2, y - size * 0.15, size * 0.08, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawDesertVegetation(x, y, size, variant) {
        const seed = (variant !== undefined && variant !== null) ? variant % 6 : Math.floor(x * 0.5 + y * 0.7) % 6;
        switch(seed) {
            case 0: this.drawDesertCactusSaguaro(x, y, size); break;
            case 1: this.drawDesertCactusBarrel(x, y, size); break;
            case 2: this.drawDesertCactusPricklyPear(x, y, size); break;
            case 3: this.drawDesertCactusColumnar(x, y, size); break;
            case 4: this.drawDesertCactusCholla(x, y, size); break;
            default: this.drawDesertBush(x, y, size);
        }
    }

    drawDesertCactusSaguaro(x, y, size) {
        // Desert saguaro — muted sage-green with natural desert coloring
        const mainHeight = size * 0.58;
        const mainWidth = size * 0.22;

        // Ground shadow
        this.ctx.fillStyle = 'rgba(60,30,10,0.28)';
        this.ctx.beginPath();
        this.ctx.ellipse(x + 1, y + 2, mainWidth * 0.9, size * 0.10, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Main trunk — muted sage-green
        this.ctx.fillStyle = '#5a8440';
        this.ctx.beginPath();
        this.ctx.moveTo(x - mainWidth * 0.26, y);
        this.ctx.lineTo(x - mainWidth * 0.22, y - mainHeight * 0.72);
        this.ctx.quadraticCurveTo(x, y - mainHeight, x + mainWidth * 0.22, y - mainHeight * 0.72);
        this.ctx.lineTo(x + mainWidth * 0.26, y);
        this.ctx.closePath();
        this.ctx.fill();

        // Trunk shadow side
        this.ctx.fillStyle = '#3d6030';
        this.ctx.beginPath();
        this.ctx.moveTo(x + mainWidth * 0.04, y);
        this.ctx.lineTo(x + mainWidth * 0.06, y - mainHeight * 0.65);
        this.ctx.quadraticCurveTo(x + mainWidth * 0.18, y - mainHeight * 0.82, x + mainWidth * 0.22, y - mainHeight * 0.72);
        this.ctx.lineTo(x + mainWidth * 0.26, y);
        this.ctx.closePath();
        this.ctx.fill();

        // Left arm — curves upward naturally
        this.ctx.fillStyle = '#5a8440';
        this.ctx.beginPath();
        this.ctx.moveTo(x - mainWidth * 0.22, y - mainHeight * 0.38);
        this.ctx.quadraticCurveTo(x - mainWidth * 0.70, y - mainHeight * 0.44, x - mainWidth * 0.74, y - mainHeight * 0.62);
        this.ctx.quadraticCurveTo(x - mainWidth * 0.68, y - mainHeight * 0.80, x - mainWidth * 0.48, y - mainHeight * 0.80);
        this.ctx.quadraticCurveTo(x - mainWidth * 0.32, y - mainHeight * 0.80, x - mainWidth * 0.28, y - mainHeight * 0.38 + mainWidth * 0.12);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.fillStyle = '#3d6030';
        this.ctx.beginPath();
        this.ctx.moveTo(x - mainWidth * 0.22, y - mainHeight * 0.38);
        this.ctx.quadraticCurveTo(x - mainWidth * 0.56, y - mainHeight * 0.40, x - mainWidth * 0.60, y - mainHeight * 0.50);
        this.ctx.quadraticCurveTo(x - mainWidth * 0.54, y - mainHeight * 0.68, x - mainWidth * 0.48, y - mainHeight * 0.80);
        this.ctx.quadraticCurveTo(x - mainWidth * 0.38, y - mainHeight * 0.80, x - mainWidth * 0.28, y - mainHeight * 0.38 + mainWidth * 0.12);
        this.ctx.closePath();
        this.ctx.fill();

        // Right arm — curves upward naturally
        this.ctx.fillStyle = '#5a8440';
        this.ctx.beginPath();
        this.ctx.moveTo(x + mainWidth * 0.22, y - mainHeight * 0.30);
        this.ctx.quadraticCurveTo(x + mainWidth * 0.68, y - mainHeight * 0.36, x + mainWidth * 0.72, y - mainHeight * 0.55);
        this.ctx.quadraticCurveTo(x + mainWidth * 0.66, y - mainHeight * 0.74, x + mainWidth * 0.46, y - mainHeight * 0.74);
        this.ctx.quadraticCurveTo(x + mainWidth * 0.30, y - mainHeight * 0.74, x + mainWidth * 0.26, y - mainHeight * 0.30 + mainWidth * 0.10);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.fillStyle = '#3d6030';
        this.ctx.beginPath();
        this.ctx.moveTo(x + mainWidth * 0.22, y - mainHeight * 0.30);
        this.ctx.quadraticCurveTo(x + mainWidth * 0.52, y - mainHeight * 0.33, x + mainWidth * 0.56, y - mainHeight * 0.44);
        this.ctx.quadraticCurveTo(x + mainWidth * 0.50, y - mainHeight * 0.64, x + mainWidth * 0.46, y - mainHeight * 0.74);
        this.ctx.quadraticCurveTo(x + mainWidth * 0.32, y - mainHeight * 0.74, x + mainWidth * 0.26, y - mainHeight * 0.30 + mainWidth * 0.10);
        this.ctx.closePath();
        this.ctx.fill();

        // Spine dots — scattered naturally along trunk edges
        this.ctx.fillStyle = '#c8b870';
        for (let i = 0; i < 10; i++) {
            const sy = y - mainHeight * (0.08 + 0.075 * i);
            const side = (i % 2 === 0) ? 1 : -1;
            const xOff = mainWidth * (0.22 + (i % 3) * 0.04) * side;
            this.ctx.beginPath(); this.ctx.arc(x + xOff, sy, 1.1, 0, Math.PI * 2); this.ctx.fill();
            if (i % 3 !== 1) {
                this.ctx.beginPath(); this.ctx.arc(x - xOff * 0.7, sy - mainHeight * 0.025, 0.9, 0, Math.PI * 2); this.ctx.fill();
            }
        }
    }

    drawDesertCactusBarrel(x, y, size) {
        // Dry desert shrub — rounded crown of upward-spreading branches
        const ctx = this.ctx;
        const baseR = size * 0.13;

        // Ground shadow
        ctx.fillStyle = 'rgba(60,30,10,0.22)';
        ctx.beginPath();
        ctx.ellipse(x, y + baseR * 0.3, baseR * 1.6, baseR * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Woody base
        ctx.fillStyle = '#5a3a14';
        ctx.beginPath();
        ctx.ellipse(x, y, baseR * 0.7, baseR * 0.42, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#7a5020';
        ctx.beginPath();
        ctx.ellipse(x - baseR * 0.12, y - baseR * 0.06, baseR * 0.48, baseR * 0.24, -0.15, 0, Math.PI * 2);
        ctx.fill();

        // Main spreading branches — upward arc, varied angles
        const branches = [
            { ang: -1.96, len: size * 0.44, lw: 2.6 },
            { ang: -1.57, len: size * 0.50, lw: 2.8 },
            { ang: -1.18, len: size * 0.47, lw: 2.6 },
            { ang: -0.78, len: size * 0.38, lw: 2.2 },
            { ang: -2.36, len: size * 0.38, lw: 2.2 },
            { ang: -2.75, len: size * 0.30, lw: 1.8 },
            { ang: -0.40, len: size * 0.30, lw: 1.8 }
        ];
        ctx.lineCap = 'round';
        // Draw branches darkest first (back layer)
        branches.forEach(b => {
            const bx = x + Math.sin(b.ang - Math.PI/2 + 0.3) * b.len * 0.44;
            const by = y + Math.cos(b.ang - Math.PI/2 + 0.3) * b.len * 0.44;
            const ex = x + Math.cos(b.ang) * b.len;
            const ey = y + Math.sin(b.ang) * b.len;
            ctx.strokeStyle = '#6a4818';
            ctx.lineWidth = b.lw + 0.8;
            ctx.beginPath();
            ctx.moveTo(x, y - baseR * 0.2);
            ctx.quadraticCurveTo(bx, by, ex, ey);
            ctx.stroke();
        });
        branches.forEach(b => {
            const bx = x + Math.sin(b.ang - Math.PI/2 + 0.3) * b.len * 0.44;
            const by = y + Math.cos(b.ang - Math.PI/2 + 0.3) * b.len * 0.44;
            const ex = x + Math.cos(b.ang) * b.len;
            const ey = y + Math.sin(b.ang) * b.len;
            ctx.strokeStyle = '#8a601e';
            ctx.lineWidth = b.lw;
            ctx.beginPath();
            ctx.moveTo(x, y - baseR * 0.2);
            ctx.quadraticCurveTo(bx, by, ex, ey);
            ctx.stroke();
            // Pointed leaf shapes at branch tip — 3 leaves radiating from tip
            const lr = b.lw * 1.6;
            for (let li = 0; li < 3; li++) {
                const la = b.ang + (li - 1) * 0.55;
                const ltx = ex + Math.cos(la) * lr * 2.2;
                const lty = ey + Math.sin(la) * lr * 2.2;
                const lpx = ex + Math.cos(la + Math.PI / 2) * lr * 0.6;
                const lpy = ey + Math.sin(la + Math.PI / 2) * lr * 0.6;
                const lnx = ex + Math.cos(la - Math.PI / 2) * lr * 0.6;
                const lny = ey + Math.sin(la - Math.PI / 2) * lr * 0.6;
                ctx.fillStyle = li === 1 ? '#c49030' : '#a87828';
                ctx.beginPath();
                ctx.moveTo(ex, ey);
                ctx.quadraticCurveTo(lpx, lpy, ltx, lty);
                ctx.quadraticCurveTo(lnx, lny, ex, ey);
                ctx.closePath();
                ctx.fill();
            }
        });

        // Short inner twigs for density
        const twigs = [
            { ang: -1.78, len: size * 0.26, lw: 1.4 },
            { ang: -1.35, len: size * 0.24, lw: 1.4 },
            { ang: -2.15, len: size * 0.22, lw: 1.2 }
        ];
        twigs.forEach(b => {
            const bx = x + Math.sin(b.ang - Math.PI/2 + 0.2) * b.len * 0.4;
            const by = y + Math.cos(b.ang - Math.PI/2 + 0.2) * b.len * 0.4;
            const ex = x + Math.cos(b.ang) * b.len;
            const ey = y + Math.sin(b.ang) * b.len;
            ctx.strokeStyle = '#7a5218';
            ctx.lineWidth = b.lw;
            ctx.beginPath();
            ctx.moveTo(x, y - baseR * 0.1);
            ctx.quadraticCurveTo(bx, by, ex, ey);
            ctx.stroke();
            ctx.fillStyle = '#b07820';
            ctx.beginPath(); ctx.arc(ex, ey, b.lw * 1.1, 0, Math.PI * 2); ctx.fill();
        });
    }

    drawDesertCactusPricklyPear(x, y, size) {
        // Helper function to draw organic leaf pad
        const drawLeafPad = (x, y, width, height, rotation, color1, color2) => {
            this.ctx.save();
            this.ctx.translate(x, y);
            this.ctx.rotate(rotation);

            // Main organic leaf pad using bezier curves
            this.ctx.fillStyle = color1;
            this.ctx.beginPath();
            this.ctx.moveTo(0, -height * 0.5);
            this.ctx.quadraticCurveTo(width * 0.35, -height * 0.35, width * 0.4, 0);
            this.ctx.quadraticCurveTo(width * 0.3, height * 0.4, 0, height * 0.5);
            this.ctx.quadraticCurveTo(-width * 0.3, height * 0.4, -width * 0.4, 0);
            this.ctx.quadraticCurveTo(-width * 0.35, -height * 0.35, 0, -height * 0.5);
            this.ctx.closePath();
            this.ctx.fill();

            // Dark side shading
            this.ctx.fillStyle = color2;
            this.ctx.beginPath();
            this.ctx.moveTo(0, -height * 0.5);
            this.ctx.quadraticCurveTo(width * 0.35, -height * 0.35, width * 0.4, 0);
            this.ctx.quadraticCurveTo(width * 0.3, height * 0.4, width * 0.1, height * 0.5);
            this.ctx.quadraticCurveTo(width * 0.05, height * 0.2, 0, -height * 0.5);
            this.ctx.closePath();
            this.ctx.fill();

            // Spine clusters on pad
            this.ctx.fillStyle = '#1e8449';
            const spines = [
                {x: 0, y: -height * 0.35},
                {x: width * 0.15, y: -height * 0.15},
                {x: -width * 0.15, y: -height * 0.15},
                {x: width * 0.25, y: height * 0.15},
                {x: -width * 0.25, y: height * 0.15},
                {x: 0, y: height * 0.35}
            ];
            spines.forEach(spine => {
                this.ctx.beginPath();
                this.ctx.arc(spine.x, spine.y, 1.2, 0, Math.PI * 2);
                this.ctx.fill();
            });

            this.ctx.restore();
        };

        const padWidth = size * 0.22;
        const padHeight = size * 0.35;

        // Main central pad
        drawLeafPad(x, y - padHeight * 0.2, padWidth * 0.5, padHeight * 0.6, 0, '#3a8659', '#2d6b4f');

        // Right side pad
        drawLeafPad(x + padWidth * 0.42, y - padHeight * 0.1, padWidth * 0.45, padHeight * 0.5, Math.PI / 4.5, '#3a8659', '#2d6b4f');

        // Left side pad
        drawLeafPad(x - padWidth * 0.42, y + padHeight * 0.05, padWidth * 0.45, padHeight * 0.5, -Math.PI / 4.5, '#3a8659', '#2d6b4f');

        // Lower pad (base)
        drawLeafPad(x, y + padHeight * 0.3, padWidth * 0.48, padHeight * 0.5, Math.PI / 8, '#2d6b4f', '#1e4d35');

        // Highlight on main pad
        this.ctx.fillStyle = '#58d68d';
        this.ctx.globalAlpha = 0.6;
        this.ctx.beginPath();
        this.ctx.arc(x - padWidth * 0.15, y - padHeight * 0.35, padWidth * 0.12, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.globalAlpha = 1;
    }

    drawDesertCactusColumnar(x, y, size) {
        // Tall columnar organ pipe cactus - increased scale
        const height = size * 0.75;
        const width = size * 0.28;

        // Shadow
        this.ctx.fillStyle = 'rgba(20, 80, 20, 0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(x + 1, y + 1, width * 0.4, size * 0.15, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Main body
        this.ctx.fillStyle = '#2ecc71';
        this.ctx.fillRect(x - width * 0.3, y - height * 0.5, width * 0.6, height);

        // Dark side
        this.ctx.fillStyle = '#27ae60';
        this.ctx.fillRect(x + width * 0.05, y - height * 0.5, width * 0.25, height);

        // Vertical ridges
        this.ctx.strokeStyle = '#1e8449';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
            const px = x - width * 0.2 + (i * width * 0.15);
            this.ctx.beginPath();
            this.ctx.moveTo(px, y - height * 0.5);
            this.ctx.lineTo(px, y + height * 0.5);
            this.ctx.stroke();
        }

        // Spine clusters
        this.ctx.fillStyle = '#1e8449';
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 2; col++) {
                const px = x - width * 0.2 + (col * width * 0.4);
                const py = y - height * 0.4 + (row * height * 0.2);
                this.ctx.beginPath();
                this.ctx.arc(px, py, 1.5, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }

        // Highlight stripe
        this.ctx.fillStyle = '#58d68d';
        this.ctx.fillRect(x - width * 0.15, y - height * 0.4, width * 0.1, height * 0.8);
    }

    drawDesertCactusCholla(x, y, size) {
        // Cholla - spiky branching cactus - increased scale
        const height = size * 0.65;
        const width = size * 0.23;

        // Main trunk
        this.ctx.fillStyle = '#2ecc71';
        this.ctx.fillRect(x - width * 0.25, y - height * 0.4, width * 0.5, height * 0.8);

        // Dark side
        this.ctx.fillStyle = '#27ae60';
        this.ctx.fillRect(x + width * 0.05, y - height * 0.4, width * 0.2, height * 0.8);

        // Upper left branch
        this.ctx.fillStyle = '#2ecc71';
        this.ctx.save();
        this.ctx.translate(x - width * 0.4, y - height * 0.2);
        this.ctx.rotate(-Math.PI / 3);
        this.ctx.fillRect(-width * 0.2, -width * 0.15, width * 0.4, width * 0.3);
        this.ctx.restore();

        // Upper right branch
        this.ctx.save();
        this.ctx.translate(x + width * 0.4, y - height * 0.15);
        this.ctx.rotate(Math.PI / 3);
        this.ctx.fillRect(-width * 0.2, -width * 0.15, width * 0.4, width * 0.3);
        this.ctx.restore();

        // Lower branches
        this.ctx.save();
        this.ctx.translate(x - width * 0.35, y + height * 0.1);
        this.ctx.rotate(-Math.PI / 4);
        this.ctx.fillRect(-width * 0.15, -width * 0.12, width * 0.3, width * 0.24);
        this.ctx.restore();

        this.ctx.save();
        this.ctx.translate(x + width * 0.35, y + height * 0.1);
        this.ctx.rotate(Math.PI / 4);
        this.ctx.fillRect(-width * 0.15, -width * 0.12, width * 0.3, width * 0.24);
        this.ctx.restore();

        // Dense spines
        this.ctx.fillStyle = '#1e8449';
        for (let i = 0; i < 15; i++) {
            const angle = (i / 15) * Math.PI * 2;
            const radius = size * 0.15;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            this.ctx.beginPath();
            this.ctx.arc(px, py, 1.5, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Highlight
        this.ctx.fillStyle = '#58d68d';
        this.ctx.beginPath();
        this.ctx.arc(x - width * 0.12, y - height * 0.25, width * 0.1, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawDesertBush(x, y, size) {
        // Dry bush vegetation - irregular organic shape
        const radius = size * 0.28;

        // Main body with irregular outline
        this.ctx.fillStyle = '#9d7c54';
        this.ctx.beginPath();
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const variation = Math.sin(angle * 3) * 0.15 + Math.cos(angle * 5) * 0.1;
            const r = radius * (0.85 + variation);
            const px = x + Math.cos(angle) * r;
            const py = y + Math.sin(angle) * r * 0.8;
            if (i === 0) this.ctx.moveTo(px, py);
            else this.ctx.lineTo(px, py);
        }
        this.ctx.closePath();
        this.ctx.fill();

        // Darker inner layer for depth
        this.ctx.fillStyle = '#7a5c3f';
        this.ctx.beginPath();
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const variation = Math.sin(angle * 3) * 0.08;
            const r = radius * (0.5 + variation);
            const px = x + Math.cos(angle) * r;
            const py = y + Math.sin(angle) * r * 0.8;
            if (i === 0) this.ctx.moveTo(px, py);
            else this.ctx.lineTo(px, py);
        }
        this.ctx.closePath();
        this.ctx.fill();

        // Highlight on top
        this.ctx.fillStyle = '#bfa878';
        this.ctx.beginPath();
        this.ctx.moveTo(x - radius * 0.2, y - radius * 0.3);
        this.ctx.quadraticCurveTo(x, y - radius * 0.35, x + radius * 0.15, y - radius * 0.25);
        this.ctx.quadraticCurveTo(x + radius * 0.1, y - radius * 0.15, x - radius * 0.1, y - radius * 0.2);
        this.ctx.closePath();
        this.ctx.fill();

        // Branch structure - more realistic twigs
        this.ctx.strokeStyle = '#5c4630';
        this.ctx.lineWidth = 1.5;
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const startX = x + Math.cos(angle) * radius * 0.2;
            const startY = y + Math.sin(angle) * radius * 0.15;
            const midX = x + Math.cos(angle) * radius * 0.65;
            const midY = y + Math.sin(angle) * radius * 0.6;
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.quadraticCurveTo(midX, midY - size * 0.05, midX + Math.cos(angle + 0.3) * size * 0.08, midY + Math.sin(angle + 0.3) * size * 0.08);
            this.ctx.stroke();
        }
    }

    drawSpaceVegetation(x, y, size, variant) {
        const seed = (variant !== undefined && variant !== null) ? variant % 5 : Math.floor(x * 0.5 + y * 0.7) % 5;
        switch(seed) {
            case 0: this.drawSpaceVortexPlant(x, y, size); break;
            case 1: this.drawSpaceSpikeCoral(x, y, size); break;
            case 2: this.drawSpaceFractalGrowth(x, y, size); break;
            case 3: this.drawSpaceBiolumPlant(x, y, size); break;
            default: this.drawSpaceAlienMushroom(x, y, size);
        }
    }

    drawSpaceVortexPlant(x, y, size) {
        // Swirling vortex-like alien plant
        this.ctx.fillStyle = '#4a6a9a';
        
        // Spiral body
        const spirals = 3;
        for (let layer = 0; layer < spirals; layer++) {
            const radius = size * (0.08 + layer * 0.08);
            this.ctx.beginPath();
            for (let i = 0; i < 50; i++) {
                const angle = (i / 50) * Math.PI * 2 + layer * Math.PI / 2;
                const dist = radius * (i / 50);
                const px = x + Math.cos(angle) * dist;
                const py = y + Math.sin(angle) * dist;
                if (i === 0) this.ctx.moveTo(px, py);
                else this.ctx.lineTo(px, py);
            }
            this.ctx.strokeStyle = `rgba(100, 150, 255, ${0.6 - layer * 0.15})`;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }

        // Center glow
        this.ctx.fillStyle = 'rgba(200, 100, 255, 0.8)';
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 0.08, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawSpaceSpikeCoral(x, y, size) {
        // Spike coral formation
        this.ctx.fillStyle = '#5a7aaa';
        
        // Main body cluster
        const spikeCount = 8;
        for (let i = 0; i < spikeCount; i++) {
            const angle = (i / spikeCount) * Math.PI * 2;
            const baseX = x + Math.cos(angle) * size * 0.08;
            const baseY = y + Math.sin(angle) * size * 0.08;
            const tipX = x + Math.cos(angle) * size * 0.25;
            const tipY = y + Math.sin(angle) * size * 0.25;
            
            // Spike
            this.ctx.strokeStyle = `rgba(${100 + Math.cos(angle) * 50}, ${150}, ${200 + Math.sin(angle) * 50}, 0.9)`;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(baseX, baseY);
            this.ctx.quadraticCurveTo(
                (baseX + tipX) * 0.5 + Math.cos(angle + Math.PI/2) * size * 0.05,
                (baseY + tipY) * 0.5 + Math.sin(angle + Math.PI/2) * size * 0.05,
                tipX, tipY
            );
            this.ctx.stroke();
        }

        // Center sphere
        this.ctx.fillStyle = '#8aaacc';
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 0.1, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawSpaceFractalGrowth(x, y, size) {
        // Fractal branching alien structure
        const drawFractal = (cx, cy, length, angle, depth) => {
            if (depth === 0) return;
            
            const endX = cx + Math.cos(angle) * length;
            const endY = cy + Math.sin(angle) * length;
            
            this.ctx.strokeStyle = `rgba(${100 + depth * 30}, ${150 + depth * 20}, ${255 - depth * 30}, ${0.7 - depth * 0.1})`;
            this.ctx.lineWidth = Math.max(1, 3 - depth);
            this.ctx.beginPath();
            this.ctx.moveTo(cx, cy);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
            
            // Branch left and right
            drawFractal(endX, endY, length * 0.7, angle - Math.PI / 5, depth - 1);
            drawFractal(endX, endY, length * 0.7, angle + Math.PI / 5, depth - 1);
        };

        // Draw three main branches
        for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI * 2;
            drawFractal(x, y, size * 0.15, angle, 3);
        }

        // Core
        this.ctx.fillStyle = '#aabbdd';
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 0.05, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawSpaceBiolumPlant(x, y, size) {
        // Bioluminescent branching organism
        this.ctx.fillStyle = '#3a7a9a';
        
        // Main body
        this.ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const radius = size * (0.15 + Math.sin(i * 0.8) * 0.08);
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            if (i === 0) this.ctx.moveTo(px, py);
            else this.ctx.lineTo(px, py);
        }
        this.ctx.closePath();
        this.ctx.fill();

        // Bioluminescent tendrils
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const startX = x + Math.cos(angle) * size * 0.13;
            const startY = y + Math.sin(angle) * size * 0.13;
            
            this.ctx.strokeStyle = `rgba(100, ${200 + Math.sin(angle) * 50}, 255, 0.8)`;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            
            // Wavy tendril
            for (let j = 0; j < 5; j++) {
                const progress = (j + 1) / 5;
                const offsetX = Math.cos(angle) * size * 0.2 * progress;
                const offsetY = Math.sin(angle) * size * 0.2 * progress;
                const wiggleX = Math.sin(angle + j) * size * 0.05;
                const wiggleY = Math.cos(angle + j) * size * 0.05;
                this.ctx.lineTo(startX + offsetX + wiggleX, startY + offsetY + wiggleY);
            }
            this.ctx.stroke();
        }

        // Intense core glow
        this.ctx.fillStyle = 'rgba(150, 200, 255, 0.9)';
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 0.12, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawSpaceAlienMushroom(x, y, size) {
        // Impossible geometry alien mushroom
        // Cap with inverted perspective
        this.ctx.fillStyle = '#6a5aaa';
        this.ctx.beginPath();
        this.ctx.moveTo(x - size * 0.18, y - size * 0.08);
        this.ctx.bezierCurveTo(
            x - size * 0.18, y - size * 0.18,
            x + size * 0.18, y - size * 0.18,
            x + size * 0.18, y - size * 0.08
        );
        this.ctx.lineTo(x + size * 0.1, y + size * 0.08);
        this.ctx.lineTo(x - size * 0.1, y + size * 0.08);
        this.ctx.closePath();
        this.ctx.fill();

        // Inverted inner surface (different color)
        this.ctx.fillStyle = '#4a3aaa';
        this.ctx.beginPath();
        this.ctx.moveTo(x - size * 0.14, y - size * 0.05);
        this.ctx.bezierCurveTo(
            x - size * 0.14, y - size * 0.12,
            x + size * 0.14, y - size * 0.12,
            x + size * 0.14, y - size * 0.05
        );
        this.ctx.lineTo(x + size * 0.08, y + size * 0.04);
        this.ctx.lineTo(x - size * 0.08, y + size * 0.04);
        this.ctx.closePath();
        this.ctx.fill();

        // Stem
        this.ctx.fillStyle = '#5a6aaa';
        this.ctx.fillRect(x - size * 0.06, y + size * 0.08, size * 0.12, size * 0.16);

        // Bioluminescent gill-like structures
        this.ctx.strokeStyle = 'rgba(200, 100, 255, 0.6)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const py = y - size * 0.08 + (i * size * 0.035);
            this.ctx.beginPath();
            this.ctx.moveTo(x - size * 0.14, py);
            this.ctx.quadraticCurveTo(x, py - size * 0.02, x + size * 0.14, py);
            this.ctx.stroke();
        }

        // Glow aura
        this.ctx.fillStyle = 'rgba(200, 100, 255, 0.2)';
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 0.22, 0, Math.PI * 2);
        this.ctx.fill();
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
        const code = this.generateLevelCode();
        document.getElementById('outputCode').textContent = code;
    }

    generateLevelCode() {
        const levelName = document.getElementById('levelName').value;
        const levelNumber = document.getElementById('levelNumber').value;
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
            enemyCount: ${wave.enemyCount}, 
            enemyHealth_multiplier: ${wave.enemyHealthMultiplier}, 
            enemySpeed: ${wave.enemySpeed}, 
            spawnInterval: ${wave.spawnInterval}, 
            pattern: [${wave.pattern.map(e => `'${e}'`).join(', ')}] 
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
        const levelNumber = document.getElementById('levelNumber').value;
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

        // Level definitions per campaign
        const levelsByCampaign = {
            'Forest': Array.from({ length: 12 }, (_, i) => ({
                value: `Forest.ForestLevel${i + 1}`,
                label: `Forest Level ${i + 1}`
            })),
            'Mountain': Array.from({ length: 12 }, (_, i) => ({
                value: `Mountain.MountainLevel${i + 1}`,
                label: `Mountain Level ${i + 1}`
            })),
            'Desert': Array.from({ length: 10 }, (_, i) => ({
                value: `Desert.DesertLevel${i + 1}`,
                label: `Desert Level ${i + 1}`
            })),
            'Space': Array.from({ length: 8 }, (_, i) => ({
                value: `Space.SpaceLevel${i + 1}`,
                label: `Space Level ${i + 1}`
            }))
        };

        const levels = levelsByCampaign[campaignName] || [];
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
            if (level.levelNumber) document.getElementById('levelNumber').value = level.levelNumber;
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
                    this.waves.push({
                        id: waveIndex,
                        enemyCount: waveConfig.enemyCount || 5,
                        enemyHealthMultiplier: waveConfig.enemyHealth_multiplier || waveConfig.enemyHealthMultiplier || 1.0,
                        enemySpeed: waveConfig.enemySpeed || 35,
                        spawnInterval: waveConfig.spawnInterval || 1.5,
                        pattern: waveConfig.pattern || ['basic']
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
    }
}
