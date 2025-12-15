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
        this.mode = 'path'; // 'path' or 'castle'
        this.waves = [];
        
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
        
        window.addEventListener('resize', () => this.handleResize());

        // Toolbar buttons
        document.getElementById('drawPathBtn').addEventListener('click', () => this.setMode('path'));
        document.getElementById('placeCastleBtn').addEventListener('click', () => this.setMode('castle'));
        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearPath());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportLevel());

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
        document.getElementById('addWaveBtn').addEventListener('click', () => this.addWave());

        // Input listeners for path info
        document.querySelectorAll('input, select').forEach(el => {
            el.addEventListener('change', () => this.render());
        });
    }

    setMode(newMode) {
        this.mode = newMode;
        document.getElementById('drawPathBtn').classList.toggle('active', newMode === 'path');
        document.getElementById('placeCastleBtn').classList.toggle('active', newMode === 'castle');
        
        const pathInfo = document.getElementById('pathInfo');
        if (newMode === 'path') {
            pathInfo.textContent = '🖌️ Click to add path points. Right-click to remove last point.';
        } else {
            pathInfo.textContent = '🏰 Click on canvas to place castle.';
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
        }

        this.updateGeneratedCode();
        this.render();
    }

    handleCanvasRightClick() {
        if (this.mode === 'path' && this.pathPoints.length > 0) {
            this.pathPoints.pop();
            this.updateGeneratedCode();
            this.render();
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

    updateWave(id, field, value) {
        const wave = this.waves.find(w => w.id === id);
        if (wave) {
            if (field === 'pattern-add') {
                wave.pattern.push('basic');
            } else if (field.startsWith('pattern-')) {
                const index = parseInt(field.split('-')[1]);
                wave.pattern[index] = value;
            } else if (field === 'pattern-remove') {
                const index = parseInt(value);
                wave.pattern.splice(index, 1);
            } else {
                wave[field] = isNaN(value) ? value : parseFloat(value);
            }
            this.renderWavesList();
            this.updateGeneratedCode();
        }
    }

    renderWavesList() {
        const container = document.getElementById('wavesContainer');
        container.innerHTML = '';

        this.waves.forEach(wave => {
            const waveDiv = document.createElement('div');
            waveDiv.className = 'wave-item';

            let html = `
                <div class="wave-item-header">
                    <span class="wave-item-title">Wave ${wave.id}</span>
                    <div class="wave-item-controls">
                        <button onclick="window.levelDesigner.removeWave(${wave.id})">✕</button>
                    </div>
                </div>
                <div class="wave-form">
                    <input type="number" 
                        value="${wave.enemyCount}" 
                        min="1" 
                        placeholder="Enemy Count"
                        onchange="window.levelDesigner.updateWave(${wave.id}, 'enemyCount', this.value)">
                    
                    <input type="number" 
                        value="${wave.enemyHealthMultiplier.toFixed(2)}" 
                        min="0.1" 
                        step="0.1"
                        placeholder="Health Multiplier"
                        onchange="window.levelDesigner.updateWave(${wave.id}, 'enemyHealthMultiplier', this.value)">
                    
                    <input type="number" 
                        value="${wave.enemySpeed}" 
                        min="10" 
                        step="1"
                        placeholder="Enemy Speed"
                        onchange="window.levelDesigner.updateWave(${wave.id}, 'enemySpeed', this.value)">
                    
                    <input type="number" 
                        value="${wave.spawnInterval.toFixed(2)}" 
                        min="0.1" 
                        step="0.1"
                        placeholder="Spawn Interval"
                        onchange="window.levelDesigner.updateWave(${wave.id}, 'spawnInterval', this.value)">
                    
                    <div class="enemy-pattern">
                        <label style="font-size: 11px; color: #90caf9;">Enemy Pattern:</label>
            `;

            wave.pattern.forEach((enemy, idx) => {
                html += `
                    <div class="enemy-pattern-item">
                        <select onchange="window.levelDesigner.updateWave(${wave.id}, 'pattern-${idx}', this.value)">
                            ${this.enemies.map(e => `<option value="${e}" ${e === enemy ? 'selected' : ''}>${e}</option>`).join('')}
                        </select>
                        <button onclick="window.levelDesigner.updateWave(${wave.id}, 'pattern-remove', '${idx}')" style="padding: 4px 6px;">✕</button>
                    </div>
                `;
            });

            html += `
                        <button onclick="window.levelDesigner.updateWave(${wave.id}, 'pattern-add', null)" style="margin-top: 4px;">+ Add Enemy</button>
                    </div>
                </div>
            `;

            waveDiv.innerHTML = html;
            container.appendChild(waveDiv);
        });
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#2a2a2a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        this.drawGrid();

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

    drawModeIndicator() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.ctx.fillRect(10, 10, 150, 30);

        this.ctx.fillStyle = '#90caf9';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(`Mode: ${this.mode.toUpperCase()}`, 15, 15);
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
