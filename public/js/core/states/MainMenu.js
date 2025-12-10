export class MainMenu {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.animationTime = 0;
        this.showButtons = false;
        this.titleOpacity = 0;
        this.buttonsOpacity = 0;
        this.particles = [];
        this.particlesInitialized = false;

        // Button configuration
        this.buttons = [
            { label: 'NEW GAME', action: 'newGame', hovered: false },
            { label: 'LOAD GAME', action: 'loadGame', hovered: false },
            { label: 'OPTIONS', action: 'options', hovered: false },
            { label: 'QUIT GAME', action: 'quitGame', hovered: false }
        ];

        this.buttonWidth = 200;
        this.buttonHeight = 50;
        this.buttonGap = 20;

// console.log('MainMenu: constructor called');
    }

    initParticles() {
        // Ensure we have valid canvas dimensions before initializing particles
        if (!this.stateManager.canvas.width || !this.stateManager.canvas.height) {
            console.warn('MainMenu: Canvas dimensions not available, skipping particle initialization');
            return;
        }

        // Prevent multiple initializations
        if (this.particlesInitialized) {
            return;
        }

// console.log('MainMenu: Initializing particles');
        this.particles = [];

        for (let i = 0; i < 25; i++) {
            this.particles.push({
                x: Math.random() * this.stateManager.canvas.width,
                y: Math.random() * this.stateManager.canvas.height,
                size: Math.random() * 3 + 1,
                speed: Math.random() * 20 + 10,
                opacity: Math.random() * 0.5 + 0.1
            });
        }

        this.particlesInitialized = true;
    }

    enter() {
// console.log('MainMenu: enter called');

        // Hide game UI
        const statsBar = document.getElementById('stats-bar');
        const sidebar = document.getElementById('tower-sidebar');

        if (statsBar) {
            statsBar.style.display = 'none';
        }
        if (sidebar) {
            sidebar.style.display = 'none';
        }

        // Reset animation state
        this.animationTime = 0;
        this.showButtons = false;
        this.titleOpacity = 0;
        this.buttonsOpacity = 0;
        this.particles = [];
        this.particlesInitialized = false;

        // Initialize particles
        if (this.stateManager.canvas && this.stateManager.canvas.width > 0) {
            this.initParticles();
        }

        this.setupMouseListeners();
    }

    exit() {
        this.removeMouseListeners();
    }

    setupMouseListeners() {
        this.mouseMoveHandler = (e) => this.handleMouseMove(e);
        this.clickHandler = (e) => {
            const rect = this.stateManager.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.handleClick(x, y);
        };
        this.stateManager.canvas.addEventListener('mousemove', this.mouseMoveHandler);
        this.stateManager.canvas.addEventListener('click', this.clickHandler);
    }

    removeMouseListeners() {
        if (this.mouseMoveHandler) {
            this.stateManager.canvas.removeEventListener('mousemove', this.mouseMoveHandler);
        }
        if (this.clickHandler) {
            this.stateManager.canvas.removeEventListener('click', this.clickHandler);
        }
    }

    getButtonPosition(index) {
        const canvas = this.stateManager.canvas;
        const totalHeight = this.buttons.length * this.buttonHeight + (this.buttons.length - 1) * this.buttonGap;
        // Position buttons underneath the title with proper spacing
        const startY = canvas.height / 2 + 80; // 80px below title

        return {
            x: canvas.width / 2 - this.buttonWidth / 2,
            y: startY + index * (this.buttonHeight + this.buttonGap),
            width: this.buttonWidth,
            height: this.buttonHeight
        };
    }

    handleMouseMove(e) {
        const rect = this.stateManager.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this.buttons.forEach((button, index) => {
            const pos = this.getButtonPosition(index);
            button.hovered = x >= pos.x && x <= pos.x + pos.width &&
                           y >= pos.y && y <= pos.y + pos.height;
        });

        this.stateManager.canvas.style.cursor = 
            this.buttons.some(b => b.hovered) ? 'pointer' : 'default';
    }

    handleClick(x, y) {
        this.buttons.forEach((button, index) => {
            const pos = this.getButtonPosition(index);

            if (x >= pos.x && x <= pos.x + pos.width &&
                y >= pos.y && y <= pos.y + pos.height) {

// console.log(`MainMenu: Button clicked - ${button.action}`);

                switch (button.action) {
                    case 'newGame':
                        this.stateManager.startNewGame();
                        break;
                    case 'loadGame':
                        this.stateManager.changeState('loadGame');
                        break;
                    case 'options':
                        this.stateManager.previousState = 'mainMenu';
                        this.stateManager.changeState('options');
                        break;
                    case 'quitGame':
                        this.quitGame();
                        break;
                }
            }
        });
    }

    quitGame() {
        // Check if running in Tauri
        if (window.__TAURI__) {
            const { invoke } = window.__TAURI_CORE__;
            invoke('tauri', {
                __tauriModule: 'Core',
                message: {
                    cmd: 'exit',
                    exitCode: 0
                }
            }).catch(error => {
                console.error('Error closing application:', error);
                // Fallback: try alternative method
                if (window.__TAURI_CORE__?.window?.appWindow) {
                    window.__TAURI_CORE__.window.appWindow.close();
                }
            });
        } else {
            // Fallback for development environment
            console.log('Attempting to close window...');
            if (confirm('Close the application?')) {
                window.close();
            }
        }
    }

    update(deltaTime) {
        this.animationTime += deltaTime;

        // Title is immediately visible at full opacity (no fade-in)
        this.titleOpacity = 1;

        // Buttons fade in and slide up from underneath
        if (this.animationTime > 0.3) {
            this.showButtons = true;
            this.buttonsOpacity = Math.min(1, (this.animationTime - 0.3) / 0.6);
        }

        // Update particles
        if (this.particles.length > 0) {
            this.particles.forEach(particle => {
                particle.y += particle.speed * deltaTime;
                if (particle.y > this.stateManager.canvas.height) {
                    particle.y = -10;
                    particle.x = Math.random() * this.stateManager.canvas.width;
                }
            });
        }
    }

    render(ctx) {
        try {
            const canvas = this.stateManager.canvas;

            if (!canvas || !canvas.width || !canvas.height) {
                ctx.fillStyle = '#1a0f0a';
                ctx.fillRect(0, 0, 800, 600);
                return;
            }

            // Initialize particles on first render if needed
            if (!this.particlesInitialized) {
                this.initParticles();
            }

            // Background
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#1a0f0a');
            gradient.addColorStop(1, '#0a0505');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Render particles
            if (this.particles && this.particles.length > 0) {
                ctx.globalAlpha = 1;
                this.particles.forEach(particle => {
                    ctx.globalAlpha = particle.opacity;
                    ctx.fillStyle = 'rgba(255, 140, 0, 0.6)';
                    ctx.beginPath();
                    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                    ctx.fill();
                });
            }

            // Title - positioned at SAME height as StartScreen (middle of canvas)
            ctx.globalAlpha = this.titleOpacity;
            ctx.textAlign = 'center';
            ctx.font = 'bold 80px serif';
            ctx.fillStyle = '#000';
            ctx.fillText('TOUWERS', canvas.width / 2 + 3, canvas.height / 2 - 50 + 3);

            ctx.fillStyle = '#d4af37';
            ctx.strokeStyle = '#8b7355';
            ctx.lineWidth = 2;
            ctx.fillText('TOUWERS', canvas.width / 2, canvas.height / 2 - 50);
            ctx.strokeText('TOUWERS', canvas.width / 2, canvas.height / 2 - 50);

            // Buttons
            if (this.showButtons) {
                ctx.globalAlpha = this.buttonsOpacity;

                this.buttons.forEach((button, index) => {
                    const pos = this.getButtonPosition(index);

                    // Medieval stone button background with gradient
                    const gradient = ctx.createLinearGradient(pos.y, pos.y + pos.height, 0, 0);
                    if (button.hovered) {
                        gradient.addColorStop(0, '#8b7355');
                        gradient.addColorStop(0.5, '#a89968');
                        gradient.addColorStop(1, '#9a8960');
                    } else {
                        gradient.addColorStop(0, '#5a4a3a');
                        gradient.addColorStop(0.5, '#7a6a5a');
                        gradient.addColorStop(1, '#6a5a4a');
                    }
                    ctx.fillStyle = gradient;
                    ctx.fillRect(pos.x, pos.y, pos.width, pos.height);

                    // Inner shadow for depth
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                    ctx.fillRect(pos.x, pos.y, pos.width, 3);
                    ctx.fillRect(pos.x, pos.y + pos.height - 3, pos.width, 3);

                    // Golden border for medieval look
                    ctx.strokeStyle = button.hovered ? '#ffd700' : '#d4af37';
                    ctx.lineWidth = button.hovered ? 3 : 2;
                    ctx.strokeRect(pos.x, pos.y, pos.width, pos.height);

                    // Secondary decorative border (darker)
                    ctx.strokeStyle = button.hovered ? '#8b7355' : '#3a2a1f';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(pos.x + 1, pos.y + 1, pos.width - 2, pos.height - 2);

                    // Button text with shadow for medieval effect
                    ctx.font = 'bold 18px serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';

                    // Shadow text
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                    ctx.fillText(button.label, pos.x + pos.width / 2 + 1, pos.y + pos.height / 2 + 1);

                    // Main text with gold color
                    ctx.fillStyle = button.hovered ? '#ffe700' : '#d4af37';
                    ctx.fillText(button.label, pos.x + pos.width / 2, pos.y + pos.height / 2);
                });
            }

            ctx.globalAlpha = 1;

        } catch (error) {
            console.error('MainMenu render error:', error);
            ctx.fillStyle = '#1a0f0a';
            ctx.fillRect(0, 0, ctx.canvas.width || 800, ctx.canvas.height || 600);
            ctx.fillStyle = '#ff0000';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('MainMenu Error', (ctx.canvas.width || 800) / 2, (ctx.canvas.height || 600) / 2);
        }
    }
}
