export class GameStateManager {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.currentState = null; // Start with no state
        this.states = {};
        this.lastTime = 0;
        console.log('GameStateManager: initialized');
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
            console.error(`GameStateManager: State '${name}' not found or has no enter method`);
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
        }
    }
    
    handleClick(x, y) {
        if (this.states[this.currentState] && this.states[this.currentState].handleClick) {
            this.states[this.currentState].handleClick(x, y);
        }
    }
}
