export class MenuManager {
    constructor(gameInstance) {
        this.game = gameInstance;
        this.currentScreen = 'start'; // 'start', 'levelSelect', 'game'
        this.selectedLevel = 1;
        
        this.createMenuElements();
        this.setupEventListeners();
        this.showScreen('start');
    }
    
    createMenuElements() {
        this.createStartMenu();
        this.createLevelSelectMenu();
    }
    
    createStartMenu() {
        const startMenu = document.createElement('div');
        startMenu.id = 'startMenu';
        startMenu.className = 'menu-screen';
        startMenu.innerHTML = `
            <div class="menu-container">
                <h1 class="game-title">TOUWERS</h1>
                <p class="game-subtitle">Tower Defense</p>
                <div class="menu-buttons">
                    <button id="startGameBtn" class="menu-btn primary">Start Game</button>
                    <button id="levelSelectBtn" class="menu-btn">Level Select</button>
                </div>
            </div>
        `;
        document.body.appendChild(startMenu);
    }
    
    createLevelSelectMenu() {
        const levelSelectMenu = document.createElement('div');
        levelSelectMenu.id = 'levelSelectMenu';
        levelSelectMenu.className = 'menu-screen hidden';
        
        let levelsHTML = `
            <div class="menu-container">
                <h2 class="menu-title">Select Level</h2>
                <div class="level-grid">
        `;
        
        for (let i = 1; i <= 30; i++) {
            levelsHTML += `
                <button class="level-btn" data-level="${i}">
                    <span class="level-number">${i}</span>
                </button>
            `;
        }
        
        levelsHTML += `
                </div>
                <div class="menu-buttons">
                    <button id="backToMenuBtn" class="menu-btn">Back to Menu</button>
                </div>
            </div>
        `;
        
        levelSelectMenu.innerHTML = levelsHTML;
        document.body.appendChild(levelSelectMenu);
    }
    
    setupEventListeners() {
        // Start menu buttons
        document.getElementById('startGameBtn').addEventListener('click', () => {
            this.startGame(1);
        });
        
        document.getElementById('levelSelectBtn').addEventListener('click', () => {
            this.showScreen('levelSelect');
        });
        
        // Level select buttons
        document.querySelectorAll('.level-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const level = parseInt(e.target.closest('.level-btn').dataset.level);
                this.startGame(level);
            });
        });
        
        document.getElementById('backToMenuBtn').addEventListener('click', () => {
            this.showScreen('start');
        });
        
        // Touch events for mobile
        document.querySelectorAll('.menu-btn, .level-btn').forEach(btn => {
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                btn.click();
            });
        });
    }
    
    showScreen(screenName) {
        this.currentScreen = screenName;
        
        // Hide all screens
        document.querySelectorAll('.menu-screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        
        document.getElementById('game-container').classList.add('hidden');
        
        // Show selected screen
        switch (screenName) {
            case 'start':
                document.getElementById('startMenu').classList.remove('hidden');
                break;
            case 'levelSelect':
                document.getElementById('levelSelectMenu').classList.remove('hidden');
                break;
            case 'game':
                document.getElementById('game-container').classList.remove('hidden');
                break;
        }
    }
    
    startGame(level = 1) {
        this.selectedLevel = level;
        this.game.startLevel(level);
        this.showScreen('game');
    }
    
    returnToMenu() {
        this.showScreen('start');
        this.game.resetGame();
    }
}
