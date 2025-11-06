export class GameStateManager {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.currentState = null; // Start with null instead of 'start'
        this.states = {};
        this.lastTime = 0;
        console.log('GameStateManager: Initialized');
    }
    
    addState(name, state) {
        this.states[name] = state;
        console.log(`GameStateManager: Added state '${name}'`);
    }
    
    changeState(name) {
        console.log(`GameStateManager: Changing state from '${this.currentState}' to '${name}'`);
        
        if (this.states[this.currentState] && this.states[this.currentState].exit) {
            console.log(`GameStateManager: Exiting state '${this.currentState}'`);
            this.states[this.currentState].exit();
        }
        
        this.currentState = name;
        
        if (this.states[this.currentState] && this.states[this.currentState].enter) {
            console.log(`GameStateManager: Entering state '${this.currentState}'`);
            this.states[this.currentState].enter();
        } else {
            console.warn(`GameStateManager: State '${name}' has no enter method or doesn't exist`);
        }
    }
    
    update(deltaTime) {
        if (this.states[this.currentState] && this.states[this.currentState].update) {
            this.states[this.currentState].update(deltaTime);
        }
    }
    
    render() {
        if (this.states[this.currentState] && this.states[this.currentState].render) {
            this.states[this.currentState].render(this.ctx);
        } else {
            // Fallback rendering if state doesn't have render method
            this.ctx.fillStyle = '#FF0000';
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`State '${this.currentState}' has no render method`, this.canvas.width / 2, this.canvas.height / 2);
        }
    }
    
    handleClick(x, y) {
        if (this.states[this.currentState] && this.states[this.currentState].handleClick) {
            this.states[this.currentState].handleClick(x, y);
        }
    }
}
