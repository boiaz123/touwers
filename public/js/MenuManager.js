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
        // Delay event listener setup to ensure elements exist
        setTimeout(() => {
            // Start menu buttons
            const startBtn = document.getElementById('startGameBtn');
            const levelSelectBtn = document.getElementById('levelSelectBtn');
            const backBtn = document.getElementById('backToMenuBtn');
            
            if (startBtn) {
                startBtn.addEventListener('click', () => {
                    this.startGame(1);
                });
            }
            
            if (levelSelectBtn) {
                levelSelectBtn.addEventListener('click', () => {
                    this.showScreen('levelSelect');
                });
            }
            
            // Level select buttons
            document.querySelectorAll('.level-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const level = parseInt(e.target.closest('.level-btn').dataset.level);
                    this.startGame(level);
                });
            });
            
            if (backBtn) {
                backBtn.addEventListener('click', () => {
                    this.showScreen('start');
                });
            }
            
            // Touch events for mobile
            document.querySelectorAll('.menu-btn, .level-btn').forEach(btn => {
                btn.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    btn.click();
                });
            });
        }, 100);
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
    
    async startGame(level = 1) {
        console.log('MenuManager: Starting game with level:', level);
        
        // Show loading message
        this.showLoadingMessage();
        
        try {
            // Wait for levels to be loaded
            await this.game.levelManager.waitForLevelsLoaded();
            
            this.selectedLevel = level;
            await this.game.startLevel(level);
            this.showScreen('game');
        } catch (error) {
            console.error('Error starting game:', error);
            alert('Failed to start game. Please try again.');
            this.showScreen('start');
        }
    }
    
    showLoadingMessage() {
        // Hide all screens
        document.querySelectorAll('.menu-screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        document.getElementById('game-container').classList.add('hidden');
        
        // Create loading screen if it doesn't exist
        let loadingScreen = document.getElementById('loadingScreen');
        if (!loadingScreen) {
            loadingScreen = document.createElement('div');
            loadingScreen.id = 'loadingScreen';
            loadingScreen.className = 'menu-screen';
            loadingScreen.innerHTML = `
                <div class="menu-container">
                    <h2 class="menu-title">Loading...</h2>
                    <p>Preparing your game</p>
                </div>
            `;
            document.body.appendChild(loadingScreen);
        }
        
        loadingScreen.classList.remove('hidden');
    }
    
    returnToMenu() {
        this.showScreen('start');
        this.game.resetGame();
    }
}
