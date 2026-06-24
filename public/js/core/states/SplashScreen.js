// Generic skippable brand/credit splash screen, shown before the main menu.
// Any click, key press, or touch advances immediately; otherwise it advances
// on its own after autoAdvanceSeconds.
export class SplashScreen {
    constructor(stateManager, { lines, nextState, autoAdvanceSeconds = 3.5 }) {
        this.stateManager = stateManager;
        this.lines = lines;
        this.nextState = nextState;
        this.autoAdvanceSeconds = autoAdvanceSeconds;
        this.animationTime = 0;
        this.opacity = 0;
        this.advancing = false;
        this.cursorVisible = false;
    }

    enter() {
        this.animationTime = 0;
        this.opacity = 0;
        this.advancing = false;
        this.setupInputListeners();
    }

    exit() {
        this.removeInputListeners();
    }

    setupInputListeners() {
        // Mouse clicks are NOT bound here - game.js's global canvas 'click' listener
        // already routes through GameStateManager.handleClick() to this.handleClick().
        // Touch and keyboard aren't routed generically, so those are bound directly.
        this.advanceHandler = () => this.advance();
        this.stateManager.canvas.addEventListener('touchstart', this.advanceHandler);
        window.addEventListener('keydown', this.advanceHandler);
    }

    removeInputListeners() {
        if (this.advanceHandler) {
            this.stateManager.canvas.removeEventListener('touchstart', this.advanceHandler);
            window.removeEventListener('keydown', this.advanceHandler);
        }
    }

    handleClick() {
        this.advance();
    }

    advance() {
        if (this.advancing) return;
        this.advancing = true;
        this.stateManager.changeState(this.nextState);
    }

    update(deltaTime) {
        if (this.advancing) return;
        this.animationTime += deltaTime;
        this.opacity = Math.min(1, this.animationTime / 0.8);
        if (this.animationTime >= this.autoAdvanceSeconds) {
            this.advance();
        }
    }

    render(ctx) {
        const canvas = this.stateManager.canvas;
        if (!canvas || !canvas.width || !canvas.height) return;

        ctx.fillStyle = '#0a0505';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const pulse = 0.85 + 0.15 * Math.sin(this.animationTime * 2);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const lineHeight = 44;
        const startY = canvas.height / 2 - ((this.lines.length - 1) * lineHeight) / 2;

        this.lines.forEach((line, i) => {
            ctx.globalAlpha = this.opacity * (i === 0 ? pulse : 1);
            ctx.font = i === 0 ? 'bold italic 34px serif' : 'italic 22px serif';
            ctx.fillStyle = i === 0 ? '#d4af37' : '#c9a876';
            ctx.fillText(line, canvas.width / 2, startY + i * lineHeight);
        });

        ctx.globalAlpha = 1;
    }
}
