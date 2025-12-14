import { ParticleSystem } from '../ParticleSystem.js';

export class MainMenu {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.animationTime = 0;
        this.showButtons = false;
        this.titleOpacity = 0;
        this.buttonsOpacity = 0;
        this.particleSystem = null;

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

    }

    enter() {

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

        // Get or initialize shared particle system
        if (this.stateManager.canvas && this.stateManager.canvas.width > 0) {
            this.particleSystem = ParticleSystem.getInstance(this.stateManager.canvas.width, this.stateManager.canvas.height);
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

    async quitGame() {
        // Check if running in Tauri
        if (window.__TAURI__) {
            try {
                // Use the custom Tauri command to close the app
                const { invoke } = window.__TAURI__.core;
                await invoke('close_app');
            } catch (error) {
                console.error('Error closing application:', error);
            }
        } else {
            // Fallback for development environment - just close silently
            console.log('Closing application...');
            window.close();
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

        // Update shared particle system
        if (this.particleSystem) {
            this.particleSystem.update(deltaTime);
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

            // Background
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#1a0f0a');
            gradient.addColorStop(1, '#0a0505');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Render particles from shared system
            if (this.particleSystem) {
                this.particleSystem.render(ctx);
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
