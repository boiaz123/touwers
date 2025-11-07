export class GameStateManager {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.states = {};
        this.currentState = null;
        this.currentStateObj = null;
        console.log('GameStateManager: Created with canvas size', canvas.width, 'x', canvas.height);
    }
    
    addState(name, state) {
        this.states[name] = state;
        console.log('GameStateManager: Added state', name);
    }
    
    changeState(stateName) {
        console.log('GameStateManager: Changing state from', this.currentState, 'to', stateName);
        
        if (this.currentStateObj && typeof this.currentStateObj.exit === 'function') {
            console.log('GameStateManager: Calling exit on', this.currentState);
            this.currentStateObj.exit();
        }
        
        if (this.states[stateName]) {
            this.currentState = stateName;
            this.currentStateObj = this.states[stateName];
            
            if (typeof this.currentStateObj.enter === 'function') {
                console.log('GameStateManager: Calling enter on', stateName);
                this.currentStateObj.enter();
            }
            console.log('GameStateManager: State changed to', stateName);
        } else {
            console.error('GameStateManager: State not found:', stateName);
        }
    }
    
    update(deltaTime) {
        if (this.currentStateObj && typeof this.currentStateObj.update === 'function') {
            this.currentStateObj.update(deltaTime);
        }
    }
    
    render() {
        if (this.currentStateObj && typeof this.currentStateObj.render === 'function') {
            this.currentStateObj.render(this.ctx);
        }
    }
    
    handleClick(x, y) {
        console.log('GameStateManager: Handling click at', x, y, 'in state', this.currentState);
        if (this.currentStateObj && typeof this.currentStateObj.handleClick === 'function') {
            this.currentStateObj.handleClick(x, y);
        } else {
            console.warn('GameStateManager: Current state does not handle clicks');
        }
    }
}
