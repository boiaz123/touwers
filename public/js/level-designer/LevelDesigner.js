/**
 * Main Level Designer Class
 * Orchestrates the level design UI, canvas interactions, and code generation
 */
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
        this.mode = 'path'; // 'path', 'castle', 'terrain'
        this.terrainMode = null; // 'tree', 'rock', 'water' when in terrain mode
        this.waterMode = null; // 'river' or 'lake' when placing water
        this.waterSize = 2; // Size for lake mode
        this.waves = [];
        this.terrainElements = []; // Array of {type, gridX, gridY, size}
        this.currentEditingWaveId = null;
        
        // Enemies and towers for form
        this.enemies = ['basic', 'villager', 'archer', 'beefyenemy', 'knight', 'shieldknight', 'mage', 'frog'];
        
        // Initialize
        this.setupCanvas();
        this.setupEventListeners();
        this.setupFormHandlers();
        this.createDefaultWave();
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
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.handleCanvasRightClick();
        });
        this.canvas.addEventListener('dblclick', (e) => {
            if (this.waterMode === 'river' && this.riverPoints) {
                this.riverPoints = [];
                this.waterMode = null;
                document.getElementById('waterRiverBtn')?.classList.remove('active');
                this.setTerrainMode('water'); // Reset to base water mode
                this.render();
            }
        });
        
        window.addEventListener('resize', () => this.handleResize());

        // Toolbar buttons
        document.getElementById('drawPathBtn').addEventListener('click', () => this.setMode('path'));
        document.getElementById('placeCastleBtn').addEventListener('click', () => this.setMode('castle'));
        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearPath());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportLevel());

        // Terrain buttons
        document.getElementById('drawTreeBtn')?.addEventListener('click', () => this.setTerrainMode('tree'));
        document.getElementById('drawRockBtn')?.addEventListener('click', () => this.setTerrainMode('rock'));
        document.getElementById('drawWaterBtn')?.addEventListener('click', () => this.setTerrainMode('water'));
        
        // Water mode buttons
        document.getElementById('waterRiverBtn')?.addEventListener('click', () => this.setWaterMode('river'));
        document.getElementById('waterLakeBtn')?.addEventListener('click', () => this.setWaterMode('lake'));
        
        // Water size slider
        document.getElementById('waterSizeSlider')?.addEventListener('input', (e) => {
            this.waterSize = parseFloat(e.target.value);
            const label = document.getElementById('waterSizeLabel');
            if (label) label.textContent = `Size: ${this.waterSize.toFixed(1)}`;
        });

        // Copy code button
        document.getElementById('copyCodeBtn').addEventListener('click', () => this.copyCode());
    }

    setupFormHandlers() {
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
        document.getElementById('placeCastleBtn').classList.toggle('active', newMode === 'castle');
        document.getElementById('drawTreeBtn')?.classList.toggle('active', false);
        document.getElementById('drawRockBtn')?.classList.toggle('active', false);
        document.getElementById('drawWaterBtn')?.classList.toggle('active', false);
        
        const pathInfo = document.getElementById('pathInfo');
        if (newMode === 'path') {
            pathInfo.textContent = '🖌️ Click to add path points. Right-click to remove last point.';
        } else {
            pathInfo.textContent = '🏰 Click on canvas to place castle.';
        }
    }

    setTerrainMode(terrainType) {
        this.mode = 'terrain';
        this.terrainMode = terrainType;
        this.waterMode = null; // Reset water mode
        
        document.getElementById('drawPathBtn').classList.toggle('active', false);
        document.getElementById('placeCastleBtn').classList.toggle('active', false);
        document.getElementById('drawTreeBtn')?.classList.toggle('active', terrainType === 'tree');
        document.getElementById('drawRockBtn')?.classList.toggle('active', terrainType === 'rock');
        document.getElementById('drawWaterBtn')?.classList.toggle('active', terrainType === 'water');
        
        // Show water mode buttons when water is selected
        const waterRiverBtn = document.getElementById('waterRiverBtn');
        const waterLakeBtn = document.getElementById('waterLakeBtn');
        if (terrainType === 'water') {
            if (waterRiverBtn) waterRiverBtn.style.display = 'inline-block';
            if (waterLakeBtn) waterLakeBtn.style.display = 'inline-block';
        } else {
            if (waterRiverBtn) waterRiverBtn.style.display = 'none';
            if (waterLakeBtn) waterLakeBtn.style.display = 'none';
        }
        
        const pathInfo = document.getElementById('pathInfo');
        const names = { tree: '🌲 Trees', rock: '🪨 Rocks', water: '💧 Water' };
        pathInfo.textContent = `🎨 Click to place ${names[terrainType]}. Right-click to erase.`;
    }

    setWaterMode(mode) {
        this.waterMode = mode;
        document.getElementById('waterRiverBtn')?.classList.toggle('active', mode === 'river');
        document.getElementById('waterLakeBtn')?.classList.toggle('active', mode === 'lake');
        
        // Show/hide water size slider
        const sizeSlider = document.getElementById('waterSizeSlider');
        const sizeLabel = document.getElementById('waterSizeLabel');
        if (mode === 'lake') {
            if (sizeSlider) sizeSlider.style.display = 'inline-block';
            if (sizeLabel) {
                sizeLabel.style.display = 'inline-block';
                sizeLabel.textContent = `Size: ${this.waterSize.toFixed(1)}`;
            }
        } else {
            if (sizeSlider) sizeSlider.style.display = 'none';
            if (sizeLabel) sizeLabel.style.display = 'none';
        }
        
        const pathInfo = document.getElementById('pathInfo');
        if (mode === 'river') {
            pathInfo.textContent = '🌊 Click to add river waypoints. Right-click to finish river. Double-click to cancel.';
            if (!this.riverPoints) {
                this.riverPoints = [];
            }
        } else if (mode === 'lake') {
            pathInfo.textContent = `💧 Click to place circular lakes (size: ${this.waterSize.toFixed(1)}). Right-click to erase.`;
            this.riverPoints = [];
        }
    }

    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;

        // Convert to grid coordinates
        const gridX = (canvasX / this.canvas.width) * this.gridWidth;
        const gridY = (canvasY / this.canvas.height) * this.gridHeight;

        if (this.mode === 'path') {
            this.pathPoints.push({ gridX, gridY });
        } else if (this.mode === 'castle') {
            this.castlePosition = { gridX, gridY };
        } else if (this.mode === 'terrain' && this.terrainMode) {
            if (this.waterMode === 'river') {
                // Add point to river
                if (!this.riverPoints) this.riverPoints = [];
                this.riverPoints.push({ gridX, gridY });
            } else if (this.waterMode === 'lake') {
                // Add single lake circle with variable size
                this.addTerrainElement('water', gridX, gridY, this.waterSize);
            } else {
                // Regular terrain placement
                this.addTerrainElement(this.terrainMode, gridX, gridY);
            }
        }

        this.updateGeneratedCode();
        this.render();
    }

    handleCanvasRightClick() {
        if (this.mode === 'path' && this.pathPoints.length > 0) {
            this.pathPoints.pop();
            this.updateGeneratedCode();
            this.render();
        } else if (this.mode === 'terrain') {
            if (this.waterMode === 'river' && this.riverPoints && this.riverPoints.length > 0) {
                // Finish river - convert waypoints to water tiles
                this.finishRiver();
                this.riverPoints = [];
                this.waterMode = null;
                document.getElementById('waterRiverBtn')?.classList.remove('active');
            } else if (this.terrainElements.length > 0) {
                this.terrainElements.pop();
            }
            this.updateGeneratedCode();
            this.render();
        }
    }

    addTerrainElement(type, gridX, gridY, customSize = null) {
        // Determine size based on type
        let size = customSize;
        if (size === null) {
            if (type === 'tree') size = 1.5;
            else if (type === 'rock') size = 1.5;
            else if (type === 'water') size = 2;
        }

        this.terrainElements.push({
            type,
            gridX: Math.round(gridX),
            gridY: Math.round(gridY),
            size
        });
    }

    finishRiver() {
        // Convert river waypoints to water tiles along the path
        if (!this.riverPoints || this.riverPoints.length < 2) return;
        
        // Create water tiles along the river path with interpolation
        for (let i = 0; i < this.riverPoints.length - 1; i++) {
            const p1 = this.riverPoints[i];
            const p2 = this.riverPoints[i + 1];
            const distance = Math.hypot(p2.gridX - p1.gridX, p2.gridY - p1.gridY);
            const steps = Math.ceil(distance);
            
            for (let step = 0; step <= steps; step++) {
                const t = steps === 0 ? 0 : step / steps;
                const x = p1.gridX + (p2.gridX - p1.gridX) * t;
                const y = p1.gridY + (p2.gridY - p1.gridY) * t;
                
                // Add water tile with rounded coordinates
                this.terrainElements.push({
                    type: 'water',
                    gridX: Math.round(x),
                    gridY: Math.round(y),
                    size: 1.5
                });
            }
        }
    }

    undo() {
        if (this.pathPoints.length > 0) {
            this.pathPoints.pop();
            this.updateGeneratedCode();
            this.render();
        }
    }

    clearPath() {
        if (confirm('Clear all path points?')) {
            this.pathPoints = [];
            this.updateGeneratedCode();
            this.render();
        }
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
            item.className = 'modal-pattern-item';
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
                    <div class="wave-card-stats">
                        <div class="wave-card-stat"><strong>Count:</strong> ${wave.enemyCount}</div>
                        <div class="wave-card-stat"><strong>Health:</strong> ${wave.enemyHealthMultiplier.toFixed(2)}×</div>
                        <div class="wave-card-stat"><strong>Speed:</strong> ${wave.enemySpeed}</div>
                        <div class="wave-card-stat"><strong>Spawn:</strong> ${wave.spawnInterval.toFixed(2)}s</div>
                        <div style="grid-column: 1/3; color: #90caf9; font-size: 11px; margin-top: 4px;">
                            <strong>Pattern:</strong> ${patternStr}
                        </div>
                    </div>
                </div>
                <div class="wave-card-actions">
                    <button class="edit-btn" onclick="window.levelDesigner.openWaveModal(${wave.id})">Edit</button>
                    <button class="edit-btn" onclick="window.levelDesigner.duplicateWave(${wave.id})" title="Duplicate this wave">Duplicate</button>
                    <button class="delete-btn" onclick="window.levelDesigner.removeWave(${wave.id})">Delete</button>
                </div>
            `;
            container.appendChild(waveCard);
        });
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#2a2a2a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        this.drawGrid();

        // Draw terrain elements (before path/castle so they appear behind)
        this.drawTerrainElements();

        // Draw path
        this.drawPath();

        // Draw castle
        this.drawCastle();

        // Draw current mode indicator
        this.drawModeIndicator();
    }

    drawGrid() {
        this.ctx.strokeStyle = '#444444';
        this.ctx.lineWidth = 0.5;
        this.ctx.globalAlpha = 0.2;

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

    drawPath() {
        if (this.pathPoints.length === 0) return;

        const cellWidthPixels = this.canvas.width / this.gridWidth;
        const cellHeightPixels = this.canvas.height / this.gridHeight;

        // Draw path line
        this.ctx.strokeStyle = '#58c4dc';
        this.ctx.lineWidth = 6;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        this.ctx.beginPath();
        const firstPoint = this.pathPoints[0];
        this.ctx.moveTo(firstPoint.gridX * cellWidthPixels, firstPoint.gridY * cellHeightPixels);

        for (let i = 1; i < this.pathPoints.length; i++) {
            const point = this.pathPoints[i];
            this.ctx.lineTo(point.gridX * cellWidthPixels, point.gridY * cellHeightPixels);
        }
        this.ctx.stroke();

        // Draw points
        this.pathPoints.forEach((point, idx) => {
            const x = point.gridX * cellWidthPixels;
            const y = point.gridY * cellHeightPixels;

            // Point circle
            this.ctx.fillStyle = idx === 0 ? '#7ae881' : idx === this.pathPoints.length - 1 ? '#ff9999' : '#90caf9';
            this.ctx.beginPath();
            this.ctx.arc(x, y, 8, 0, Math.PI * 2);
            this.ctx.fill();

            // Index text
            this.ctx.fillStyle = '#1e1e1e';
            this.ctx.font = 'bold 11px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(idx + 1, x, y);
        });

        // Draw river points if in river mode
        if (this.mode === 'terrain' && this.waterMode === 'river' && this.riverPoints) {
            this.drawRiverPoints();
        }
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
        if (!this.castlePosition) return;

        const cellWidthPixels = this.canvas.width / this.gridWidth;
        const cellHeightPixels = this.canvas.height / this.gridHeight;

        const x = this.castlePosition.gridX * cellWidthPixels;
        const y = this.castlePosition.gridY * cellHeightPixels;
        const size = Math.min(cellWidthPixels, cellHeightPixels) * 2.5;

        // Castle body
        this.ctx.fillStyle = '#b8860b';
        this.ctx.fillRect(x - size / 2, y - size / 2, size, size);

        // Castle towers
        this.ctx.fillStyle = '#8b6914';
        const towerSize = size / 4;
        this.ctx.fillRect(x - size / 2, y - size / 2, towerSize, towerSize);
        this.ctx.fillRect(x + size / 2 - towerSize, y - size / 2, towerSize, towerSize);
        this.ctx.fillRect(x - size / 2, y + size / 2 - towerSize, towerSize, towerSize);
        this.ctx.fillRect(x + size / 2 - towerSize, y + size / 2 - towerSize, towerSize, towerSize);

        // Label
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText('CASTLE', x, y + size / 2 + 8);
    }

    drawTerrainElements() {
        const cellWidthPixels = this.canvas.width / this.gridWidth;
        const cellHeightPixels = this.canvas.height / this.gridHeight;

        this.terrainElements.forEach(element => {
            const x = element.gridX * cellWidthPixels;
            const y = element.gridY * cellHeightPixels;
            const size = element.size * Math.min(cellWidthPixels, cellHeightPixels);

            switch (element.type) {
                case 'tree':
                    this.drawTree(x, y, size);
                    break;
                case 'rock':
                    this.drawRock(x, y, size);
                    break;
                case 'water':
                    this.drawWater(x, y, size);
                    break;
            }
        });
    }

    drawTree(x, y, size) {
        // Determine tree type based on x,y coordinates (deterministic variation)
        const seed = Math.floor(x + y) % 4;
        
        switch(seed) {
            case 0:
                this.drawTreeType1(x, y, size);
                break;
            case 1:
                this.drawTreeType2(x, y, size);
                break;
            case 2:
                this.drawTreeType3(x, y, size);
                break;
            default:
                this.drawTreeType4(x, y, size);
        }
    }

    drawTreeType1(x, y, size) {
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
        this.ctx.fillStyle = '#0D3817';
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - size * 0.6);
        this.ctx.lineTo(x + size * 0.35, y - size * 0.1);
        this.ctx.lineTo(x - size * 0.35, y - size * 0.1);
        this.ctx.closePath();
        this.ctx.fill();

        // Mid foliage layer
        this.ctx.fillStyle = '#1B5E20';
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - size * 0.35);
        this.ctx.lineTo(x + size * 0.3, y + size * 0.05);
        this.ctx.lineTo(x - size * 0.3, y + size * 0.05);
        this.ctx.closePath();
        this.ctx.fill();

        // Light foliage layer
        this.ctx.fillStyle = '#2E7D32';
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - size * 0.15);
        this.ctx.lineTo(x + size * 0.25, y + size * 0.2);
        this.ctx.lineTo(x - size * 0.25, y + size * 0.2);
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawTreeType2(x, y, size) {
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

    drawRock(x, y, size) {
        // Determine rock type based on x,y coordinates (deterministic variation)
        const seed = Math.floor(x * 0.5 + y * 0.7) % 4;
        
        switch(seed) {
            case 0:
                this.drawRockType1(x, y, size);
                break;
            case 1:
                this.drawRockType2(x, y, size);
                break;
            case 2:
                this.drawRockType3(x, y, size);
                break;
            default:
                this.drawRockType4(x, y, size);
        }
    }

    drawRockType1(x, y, size) {
        // Jagged irregular rock
        this.ctx.fillStyle = '#455A64';
        this.ctx.beginPath();
        this.ctx.moveTo(x - size * 0.3, y - size * 0.15);
        this.ctx.lineTo(x - size * 0.25, y - size * 0.35);
        this.ctx.lineTo(x, y - size * 0.38);
        this.ctx.lineTo(x + size * 0.32, y - size * 0.18);
        this.ctx.lineTo(x + size * 0.28, y + size * 0.2);
        this.ctx.lineTo(x, y + size * 0.35);
        this.ctx.lineTo(x - size * 0.32, y + size * 0.18);
        this.ctx.closePath();
        this.ctx.fill();

        // Shadow
        this.ctx.fillStyle = '#263238';
        this.ctx.beginPath();
        this.ctx.moveTo(x + size * 0.28, y + size * 0.2);
        this.ctx.lineTo(x + size * 0.32, y - size * 0.18);
        this.ctx.lineTo(x + size * 0.12, y - size * 0.08);
        this.ctx.lineTo(x, y + size * 0.35);
        this.ctx.closePath();
        this.ctx.fill();

        // Highlight
        this.ctx.fillStyle = '#90A4AE';
        this.ctx.beginPath();
        this.ctx.arc(x - size * 0.15, y - size * 0.2, size * 0.1, 0, Math.PI * 2);
        this.ctx.fill();

        // Outline
        this.ctx.strokeStyle = '#1A1A1A';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.moveTo(x - size * 0.3, y - size * 0.15);
        this.ctx.lineTo(x - size * 0.25, y - size * 0.35);
        this.ctx.lineTo(x, y - size * 0.38);
        this.ctx.lineTo(x + size * 0.32, y - size * 0.18);
        this.ctx.lineTo(x + size * 0.28, y + size * 0.2);
        this.ctx.lineTo(x, y + size * 0.35);
        this.ctx.lineTo(x - size * 0.32, y + size * 0.18);
        this.ctx.closePath();
        this.ctx.stroke();
    }

    drawRockType2(x, y, size) {
        // Round boulder with bumps
        this.ctx.fillStyle = '#546E7A';
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 0.33, 0, Math.PI * 2);
        this.ctx.fill();

        // Shadow
        this.ctx.fillStyle = '#37474F';
        this.ctx.beginPath();
        this.ctx.arc(x + size * 0.15, y + size * 0.15, size * 0.33, 0, Math.PI * 2);
        this.ctx.fill();

        // Top light
        this.ctx.fillStyle = '#9E9E9E';
        this.ctx.beginPath();
        this.ctx.arc(x - size * 0.12, y - size * 0.15, size * 0.15, 0, Math.PI * 2);
        this.ctx.fill();

        // Bumps on surface
        this.ctx.fillStyle = '#9E9E9E';
        [
            {x: -0.18, y: 0.1, r: 0.08},
            {x: 0.22, y: -0.12, r: 0.07},
            {x: 0.08, y: 0.22, r: 0.06}
        ].forEach(bump => {
            this.ctx.beginPath();
            this.ctx.arc(x + bump.x * size, y + bump.y * size, size * bump.r, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Outline
        this.ctx.strokeStyle = '#1A1A1A';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 0.33, 0, Math.PI * 2);
        this.ctx.stroke();
    }

    drawRockType3(x, y, size) {
        // Flat angular rock
        this.ctx.fillStyle = '#37474F';
        this.ctx.beginPath();
        this.ctx.moveTo(x - size * 0.32, y - size * 0.15);
        this.ctx.lineTo(x + size * 0.35, y - size * 0.2);
        this.ctx.lineTo(x + size * 0.3, y + size * 0.25);
        this.ctx.lineTo(x - size * 0.35, y + size * 0.2);
        this.ctx.closePath();
        this.ctx.fill();

        // Highlight top
        this.ctx.fillStyle = '#78909C';
        this.ctx.beginPath();
        this.ctx.moveTo(x - size * 0.32, y - size * 0.15);
        this.ctx.lineTo(x + size * 0.35, y - size * 0.2);
        this.ctx.lineTo(x, y - size * 0.05);
        this.ctx.closePath();
        this.ctx.fill();

        // Cracks
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(x - size * 0.1, y - size * 0.15);
        this.ctx.lineTo(x + size * 0.1, y + size * 0.15);
        this.ctx.stroke();

        // Outline
        this.ctx.strokeStyle = '#1A1A1A';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.moveTo(x - size * 0.32, y - size * 0.15);
        this.ctx.lineTo(x + size * 0.35, y - size * 0.2);
        this.ctx.lineTo(x + size * 0.3, y + size * 0.25);
        this.ctx.lineTo(x - size * 0.35, y + size * 0.2);
        this.ctx.closePath();
        this.ctx.stroke();
    }

    drawRockType4(x, y, size) {
        // Triangular jagged rock
        this.ctx.fillStyle = '#455A64';
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - size * 0.35);
        this.ctx.lineTo(x + size * 0.33, y + size * 0.15);
        this.ctx.lineTo(x - size * 0.33, y + size * 0.15);
        this.ctx.closePath();
        this.ctx.fill();

        // Shadow right side
        this.ctx.fillStyle = '#263238';
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - size * 0.35);
        this.ctx.lineTo(x + size * 0.33, y + size * 0.15);
        this.ctx.lineTo(x, y + size * 0.08);
        this.ctx.closePath();
        this.ctx.fill();

        // Highlight
        this.ctx.fillStyle = '#90A4AE';
        this.ctx.beginPath();
        this.ctx.arc(x - size * 0.12, y - size * 0.15, size * 0.1, 0, Math.PI * 2);
        this.ctx.fill();

        // Surface texture
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(x - size * 0.15, y - size * 0.1);
        this.ctx.lineTo(x + size * 0.1, y + size * 0.12);
        this.ctx.stroke();

        // Outline
        this.ctx.strokeStyle = '#1A1A1A';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - size * 0.35);
        this.ctx.lineTo(x + size * 0.33, y + size * 0.15);
        this.ctx.lineTo(x - size * 0.33, y + size * 0.15);
        this.ctx.closePath();
        this.ctx.stroke();
    }

    drawWater(x, y, size) {
        // Water body base - gradient effect with subtle variation
        const gradient = this.ctx.createLinearGradient(x - size * 0.5, y - size * 0.5, x - size * 0.5, y + size * 0.5);
        gradient.addColorStop(0, '#0277BD');
        gradient.addColorStop(0.5, '#01579B');
        gradient.addColorStop(1, '#004D7A');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x - size * 0.5, y - size * 0.5, size, size);

        // Seamless wave pattern - using sine waves with varying frequencies
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 0.8;
        
        // Primary wave pattern (low frequency)
        for (let i = 0; i < 3; i++) {
            const waveY = y - size * 0.35 + (i * size * 0.35);
            this.ctx.beginPath();
            this.ctx.moveTo(x - size * 0.5, waveY);
            
            for (let j = 0; j <= 20; j++) {
                const segmentX = x - size * 0.5 + (j / 20) * size;
                const phase = (x + y) * 0.05; // Deterministic based on position
                const amplitude = size * 0.04;
                const frequency = 0.02;
                const offsetY = Math.sin(segmentX * frequency + phase + i) * amplitude;
                this.ctx.lineTo(segmentX, waveY + offsetY);
            }
            this.ctx.stroke();
        }

        // Secondary subtle wave pattern (higher frequency)
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 0.5;
        for (let i = 0; i < 5; i++) {
            const waveY = y - size * 0.4 + (i * size * 0.2);
            this.ctx.beginPath();
            this.ctx.moveTo(x - size * 0.5, waveY);
            
            for (let j = 0; j <= 30; j++) {
                const segmentX = x - size * 0.5 + (j / 30) * size;
                const phase = (x + y) * 0.1;
                const amplitude = size * 0.015;
                const frequency = 0.04;
                const offsetY = Math.sin(segmentX * frequency + phase + i * 0.5) * amplitude;
                this.ctx.lineTo(segmentX, waveY + offsetY);
            }
            this.ctx.stroke();
        }


        // Water border - subtle edge
        this.ctx.strokeStyle = '#01579B';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x - size * 0.5, y - size * 0.5, size, size);
    }

    drawModeIndicator() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.ctx.fillRect(10, 10, 150, 30);

        this.ctx.fillStyle = '#90caf9';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        const modeText = this.terrainMode ? `${this.mode.toUpperCase()}: ${this.terrainMode.toUpperCase()}` : this.mode.toUpperCase();
        this.ctx.fillText(`Mode: ${modeText}`, 15, 15);
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

        // Get visual config
        const visualConfig = {
            grassColors: {
                top: document.getElementById('grassTopColor').value,
                upper: document.getElementById('grassUpperColor').value,
                lower: document.getElementById('grassLowerColor').value,
                bottom: document.getElementById('grassBottomColor').value
            },
            grassPatchDensity: parseInt(document.getElementById('grassDensity').value),
            pathBaseColor: document.getElementById('pathColor').value,
            edgeBushColor: document.getElementById('bushColor').value,
            edgeRockColor: document.getElementById('rockColor').value,
            edgeGrassColor: document.getElementById('edgeGrassColor').value,
            flowerDensity: parseInt(document.getElementById('flowerDensity').value)
        };

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

        // Generate terrain elements
        const terrainCode = this.terrainElements.length > 0
            ? this.terrainElements.map((element, idx) =>
                `            { type: '${element.type}', gridX: ${element.gridX.toFixed(2)}, gridY: ${element.gridY.toFixed(2)}, size: ${element.size} }${idx < this.terrainElements.length - 1 ? ',' : ''}`
              ).join('\n')
            : '            // Add terrain elements using the designer';

        const code = `import { LevelBase } from './LevelBase.js';

export class Level${levelNumber} extends LevelBase {
    constructor() {
        super();
        this.levelName = '${levelName}';
        this.levelNumber = ${levelNumber};
        this.difficulty = '${difficulty}';
        this.maxWaves = ${maxWaves};
        
        // Customize visuals
        this.setVisualConfig({
            grassColors: {
                top: '${visualConfig.grassColors.top}',
                upper: '${visualConfig.grassColors.upper}',
                lower: '${visualConfig.grassColors.lower}',
                bottom: '${visualConfig.grassColors.bottom}'
            },
            grassPatchDensity: ${visualConfig.grassPatchDensity},
            pathBaseColor: '${visualConfig.pathBaseColor}',
            edgeBushColor: '${visualConfig.edgeBushColor}',
            edgeRockColor: '${visualConfig.edgeRockColor}',
            edgeGrassColor: '${visualConfig.edgeGrassColor}',
            flowerDensity: ${visualConfig.flowerDensity}
        });

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
            statusMsg.innerHTML = '<div class="status-message success">✓ Code copied to clipboard!</div>';
            setTimeout(() => {
                statusMsg.innerHTML = '';
            }, 2000);
        });
    }

    exportLevel() {
        if (this.pathPoints.length < 2) {
            alert('Path must have at least 2 points!');
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
        statusMsg.innerHTML = `<div class="status-message success">✓ Exported as Level${levelNumber}.js</div>`;
        setTimeout(() => {
            statusMsg.innerHTML = '';
        }, 3000);
    }
}
