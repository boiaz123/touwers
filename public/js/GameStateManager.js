export class GameStateManager {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.currentState = 'start';
        this.states = {};
        this.lastTime = 0;
    }
    
    addState(name, state) {
        this.states[name] = state;
    }
    
    changeState(name) {
        if (this.states[this.currentState] && this.states[this.currentState].exit) {
            this.states[this.currentState].exit();
        }
        
        this.currentState = name;
        
        if (this.states[this.currentState] && this.states[this.currentState].enter) {
            this.states[this.currentState].enter();
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
