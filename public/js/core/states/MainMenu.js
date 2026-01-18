import { ParticleSystem } from '../ParticleSystem.js';

export class MainMenu {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.animationTime = 0;
        this.showButtons = false;
        this.titleOpacity = 0;
        this.buttonsOpacity = 0;
        this.particleSystem = null;
        this.skipFadeIn = false;
        this.previousState = null;

        // Button configuration
        this.buttons = [
            { label: 'NEW GAME', action: 'newGame', hovered: false },
            { label: 'LOAD GAME', action: 'loadGame', hovered: false },
            { label: 'OPTIONS', action: 'options', hovered: false },
            { label: 'QUIT GAME', action: 'quitGame', hovered: false }
        ];

        this.buttonWidth = 220;
        this.buttonHeight = 50;
        this.buttonGap = 15;
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

        // Check if we're transitioning from StartScreen
        // If so, skip fade-in animations and start with full opacity
        // Also skip fade-in when returning from other menus (previousState is options, loadGame, etc)
        this.skipFadeIn = this.stateManager.previousState === 'startScreen' || 
                          this.stateManager.previousState === 'options' ||
                          this.stateManager.previousState === 'loadGame' ||
                          this.stateManager.previousState === 'saveSlotSelection';
        
        // Reset animation state
        this.animationTime = 0;
        this.showButtons = false;
        
        // Reset all button hover states when entering
        this.buttons.forEach(button => {
            button.hovered = false;
        });
        
        // If skipping fade-in (coming from StartScreen transition or other menus), start with full opacity
        if (this.skipFadeIn) {
            this.titleOpacity = 1;
            this.buttonsOpacity = 1;
            this.showButtons = true;
        } else {
            this.titleOpacity = 0;
            this.buttonsOpacity = 0;
        }

        // Get or initialize shared particle system
        if (this.stateManager.canvas && this.stateManager.canvas.width > 0) {
            this.particleSystem = ParticleSystem.getInstance(this.stateManager.canvas.width, this.stateManager.canvas.height);
        }

        // Play menu theme music
        if (this.stateManager.audioManager) {
            this.stateManager.audioManager.playMusic('menu-theme');
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
            // Account for CSS scaling
            const scaleX = this.stateManager.canvas.width / rect.width;
            const scaleY = this.stateManager.canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
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
        const startY = canvas.height / 2 + 100; // Position below title

        return {
            x: canvas.width / 2 - this.buttonWidth / 2,
            y: startY + index * (this.buttonHeight + this.buttonGap),
            width: this.buttonWidth,
            height: this.buttonHeight
        };
    }

    handleMouseMove(e) {
        const rect = this.stateManager.canvas.getBoundingClientRect();
        // Account for CSS scaling
        const scaleX = this.stateManager.canvas.width / rect.width;
        const scaleY = this.stateManager.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

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
                
                // Play button click SFX
                if (this.stateManager.audioManager) {
                    this.stateManager.audioManager.playSFX('button-click');
                }

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
        try {
            console.log('MainMenu: quitGame called');
            
            // Trigger game shutdown cleanup first
            if (this.stateManager && this.stateManager.game && this.stateManager.game.shutdown) {
                console.log('MainMenu: Calling game.shutdown()');
                this.stateManager.game.shutdown();
            }
            
            // Give a brief moment for cleanup to propagate
            await new Promise(resolve => setTimeout(resolve, 100));
            
            if (window.__TAURI__) {
                console.log('MainMenu: Invoking Tauri close_app');
                const { invoke } = window.__TAURI__.core;
                const result = await invoke('close_app');
                console.log('MainMenu: close_app invoked, result:', result);
            } else {
                // Non-Tauri (browser) - just close the window
                console.log('MainMenu: Closing via window.close()');
                window.close();
            }
        } catch (error) {
            console.error('MainMenu: Error closing application:', error);
            // Force close as fallback
            if (window.__TAURI__) {
                try {
                    console.log('MainMenu: Attempting fallback Tauri close');
                    const { invoke } = window.__TAURI__.core;
                    await invoke('close_app');
                } catch (fallbackError) {
                    console.error('MainMenu: Fallback close also failed:', fallbackError);
                    window.close();
                }
            } else {
                window.close();
            }
        }
    }

    renderStylizedTitle(ctx, x, y, opacity) {
        ctx.globalAlpha = opacity;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const fontSize = 120;
        ctx.font = `bold italic ${fontSize}px serif`;

        // Deep shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillText('TOUWERS', x + 4, y + 4);

        // Main golden text with gradient
        const gradient = ctx.createLinearGradient(x - 200, y - 60, x + 200, y + 60);
        gradient.addColorStop(0, '#ffd700');
        gradient.addColorStop(0.5, '#ffed4e');
        gradient.addColorStop(1, '#d4af37');
        ctx.fillStyle = gradient;
        ctx.fillText('TOUWERS', x, y);

        // Stroke for depth
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 3;
        ctx.strokeText('TOUWERS', x, y);

        // Top highlight edge
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.strokeText('TOUWERS', x, y);

        ctx.globalAlpha = 1;
    }

    update(deltaTime) {
        this.animationTime += deltaTime;

        // Skip fade-in animations if coming from StartScreen transition
        if (!this.skipFadeIn) {
            // Title fades in quickly
            if (this.animationTime > 0.2) {
                this.titleOpacity = Math.min(1, (this.animationTime - 0.2) / 0.4);
            }

            // Buttons fade in after title
            if (this.animationTime > 0.8) {
                this.showButtons = true;
                this.buttonsOpacity = Math.min(1, (this.animationTime - 0.8) / 0.5);
            }
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

            // Reset canvas shadow properties to prevent persistent glow effects
            ctx.shadowColor = 'rgba(0, 0, 0, 0)';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.globalAlpha = 1;

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

            // Render stylized title - positioned at same height as StartScreen
            this.renderStylizedTitle(ctx, canvas.width / 2, canvas.height / 2 - 50, this.titleOpacity);

            // Buttons
            if (this.showButtons) {
                ctx.globalAlpha = this.buttonsOpacity;

                this.buttons.forEach((button, index) => {
                    const pos = this.getButtonPosition(index);
                    this.renderControlButton(ctx, button, pos);
                });

                ctx.globalAlpha = 1;
            }

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

    renderControlButton(ctx, button, pos) {
        const isHovered = button.hovered;
        const adjustedY = isHovered ? pos.y - 3 : pos.y;  // Move up when hovered
        
        // Background gradient
        if (isHovered) {
            const bgGrad = ctx.createLinearGradient(0, adjustedY, 0, adjustedY + pos.height);
            bgGrad.addColorStop(0, 'rgba(90, 74, 63, 0.98)');
            bgGrad.addColorStop(0.5, 'rgba(74, 58, 47, 0.98)');
            bgGrad.addColorStop(1, 'rgba(64, 48, 37, 0.98)');
            ctx.fillStyle = bgGrad;
        } else {
            const bgGrad = ctx.createLinearGradient(0, adjustedY, 0, adjustedY + pos.height);
            bgGrad.addColorStop(0, 'rgba(68, 48, 28, 0.85)');
            bgGrad.addColorStop(0.5, 'rgba(48, 28, 8, 0.85)');
            bgGrad.addColorStop(1, 'rgba(38, 18, 0, 0.85)');
            ctx.fillStyle = bgGrad;
        }
        
        ctx.fillRect(pos.x, adjustedY, pos.width, pos.height);

        // Border - outset style with glow on hover
        if (isHovered) {
            ctx.shadowColor = 'rgba(212, 175, 55, 0.5)';
            ctx.shadowBlur = 20;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }
        
        ctx.strokeStyle = isHovered ? '#ffe700' : '#7a6038';
        ctx.lineWidth = isHovered ? 3 : 2;
        ctx.strokeRect(pos.x, adjustedY, pos.width, pos.height);

        // Top highlight
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pos.x + 1, adjustedY + 1);
        ctx.lineTo(pos.x + pos.width - 1, adjustedY + 1);
        ctx.stroke();

        // Inset shadow effect
        ctx.strokeStyle = isHovered ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.moveTo(pos.x + 1, adjustedY + pos.height - 1);
        ctx.lineTo(pos.x + pos.width - 1, adjustedY + pos.height - 1);
        ctx.stroke();

        // Shine effect on hover
        if (isHovered) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(pos.x + 1, adjustedY + 1);
            ctx.lineTo(pos.x + pos.width - 1, adjustedY + 1);
            ctx.stroke();
        }

        // Button text
        ctx.font = 'bold 20px Trebuchet MS, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Text shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillText(button.label, pos.x + pos.width / 2 + 1, adjustedY + pos.height / 2 + 1);

        // Main text
        ctx.fillStyle = isHovered ? '#ffe700' : '#d4af37';
        ctx.fillText(button.label, pos.x + pos.width / 2, adjustedY + pos.height / 2);

        // CRITICAL: Reset shadow properties to prevent persistent glow effects
        ctx.shadowColor = 'rgba(0, 0, 0, 0)';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }
}
