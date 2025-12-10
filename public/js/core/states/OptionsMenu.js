export class OptionsMenu {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.animationTime = 0;
        this.titleOpacity = 0;
        this.contentOpacity = 0;
        this.showContent = false;
        this.backButtonHovered = false;

// console.log('OptionsMenu: constructor called');
    }

    enter() {
// console.log('OptionsMenu: enter called');

        // Keep current UI state
        const statsBar = document.getElementById('stats-bar');
        const sidebar = document.getElementById('tower-sidebar');
        
        if (statsBar) {
            statsBar.style.display = 'none';
        }
        if (sidebar) {
            sidebar.style.display = 'none';
        }

        // Reset animation
        this.animationTime = 0;
        this.showContent = false;
        this.titleOpacity = 0;
        this.contentOpacity = 0;
        this.backButtonHovered = false;

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

    getBackButtonPosition() {
        const canvas = this.stateManager.canvas;
        return {
            x: canvas.width - 150,
            y: 20,
            width: 130,
            height: 40
        };
    }

    handleMouseMove(e) {
        const rect = this.stateManager.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const buttonPos = this.getBackButtonPosition();
        this.backButtonHovered = x >= buttonPos.x && x <= buttonPos.x + buttonPos.width &&
                               y >= buttonPos.y && y <= buttonPos.y + buttonPos.height;

        this.stateManager.canvas.style.cursor = this.backButtonHovered ? 'pointer' : 'default';
    }

    handleClick(x, y) {
        const buttonPos = this.getBackButtonPosition();

        if (x >= buttonPos.x && x <= buttonPos.x + buttonPos.width &&
            y >= buttonPos.y && y <= buttonPos.y + buttonPos.height) {

// console.log('OptionsMenu: Back button clicked');
            const previousState = this.stateManager.previousState || 'mainMenu';
            this.stateManager.changeState(previousState);
        }
    }

    update(deltaTime) {
        this.animationTime += deltaTime;

        // Title fade in
        if (this.animationTime > 0.3) {
            this.titleOpacity = Math.min(1, (this.animationTime - 0.3) / 0.7);
        }

        // Content fade in
        if (this.animationTime > 1) {
            this.showContent = true;
            this.contentOpacity = Math.min(1, (this.animationTime - 1) / 0.7);
        }
    }

    render(ctx) {
        try {
            const canvas = this.stateManager.canvas;

            if (!canvas || !canvas.width || !canvas.height) {
                ctx.fillStyle = '#2a1a0f';
                ctx.fillRect(0, 0, 800, 600);
                return;
            }

            // Background
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#2a1a0f');
            gradient.addColorStop(1, '#1a0f0a');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Back button
            const buttonPos = this.getBackButtonPosition();
            ctx.fillStyle = this.backButtonHovered ? '#66BB6A' : '#4CAF50';
            ctx.fillRect(buttonPos.x, buttonPos.y, buttonPos.width, buttonPos.height);

            ctx.strokeStyle = this.backButtonHovered ? '#d4af37' : '#2E7D32';
            ctx.lineWidth = this.backButtonHovered ? 2 : 1;
            ctx.strokeRect(buttonPos.x, buttonPos.y, buttonPos.width, buttonPos.height);

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px serif';
            ctx.textAlign = 'center';
            ctx.fillText('BACK', buttonPos.x + buttonPos.width / 2, buttonPos.y + buttonPos.height / 2 + 4);

            // Title
            ctx.globalAlpha = Math.max(0.1, this.titleOpacity);
            ctx.textAlign = 'center';
            ctx.font = 'bold 64px serif';
            ctx.fillStyle = '#d4af37';
            ctx.strokeStyle = '#8b7355';
            ctx.lineWidth = 2;
            ctx.fillText('OPTIONS', canvas.width / 2, 100);
            ctx.strokeText('OPTIONS', canvas.width / 2, 100);

            // Content
            if (this.showContent) {
                ctx.globalAlpha = this.contentOpacity;

                ctx.textAlign = 'center';
                ctx.font = '24px serif';
                ctx.fillStyle = '#c9a876';

                ctx.fillText('Settings & preferences coming soon', canvas.width / 2, canvas.height / 2 - 100);
                ctx.fillText('', canvas.width / 2, canvas.height / 2);
                ctx.fillText('Volume control', canvas.width / 2, canvas.height / 2 + 50);
                ctx.fillText('Graphics options', canvas.width / 2, canvas.height / 2 + 100);
                ctx.fillText('Controls configuration', canvas.width / 2, canvas.height / 2 + 150);

                ctx.font = '16px serif';
                ctx.fillStyle = '#999';
                ctx.fillText('(Placeholder for future development)', canvas.width / 2, canvas.height - 100);
            }

            ctx.globalAlpha = 1;

        } catch (error) {
            console.error('OptionsMenu render error:', error);
            ctx.fillStyle = '#2a1a0f';
            ctx.fillRect(0, 0, ctx.canvas.width || 800, ctx.canvas.height || 600);
            ctx.fillStyle = '#ff0000';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('OptionsMenu Error', (ctx.canvas.width || 800) / 2, (ctx.canvas.height || 600) / 2);
        }
    }
}
