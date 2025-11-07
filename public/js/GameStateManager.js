export class GameStateManager {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.states = {};
        this.currentState = null;
        this.currentStateObj = null;
        this.selectedLevelInfo = null; // Store level info for transitions
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
            try {
                this.currentStateObj.exit();
            } catch (error) {
                console.error('GameStateManager: Error during state exit:', error);
            }
        }
        
        if (this.states[stateName]) {
            this.currentState = stateName;
            this.currentStateObj = this.states[stateName];
            
            if (typeof this.currentStateObj.enter === 'function') {
                console.log('GameStateManager: Calling enter on', stateName);
                try {
                    this.currentStateObj.enter();
                } catch (error) {
                    console.error('GameStateManager: Error during state enter:', error);
                }
            }
            console.log('GameStateManager: State changed to', stateName);
        } else {
            console.error('GameStateManager: State not found:', stateName);
        }
    }
    
    update(deltaTime) {
        if (this.currentStateObj && typeof this.currentStateObj.update === 'function') {
            try {
                this.currentStateObj.update(deltaTime);
            } catch (error) {
                console.error('GameStateManager: Error during update:', error);
            }
        }
    }
    
    render() {
        if (this.currentStateObj && typeof this.currentStateObj.render === 'function') {
            try {
                this.currentStateObj.render(this.ctx);
            } catch (error) {
                console.error('GameStateManager: Error during render:', error);
            }
        }
    }
    
    handleClick(x, y) {
        console.log('GameStateManager: Handling click at', x, y, 'in state', this.currentState);
        if (this.currentStateObj && typeof this.currentStateObj.handleClick === 'function') {
            try {
                this.currentStateObj.handleClick(x, y);
            } catch (error) {
                console.error('GameStateManager: Error during click handling:', error);
            }
        } else {
            console.warn('GameStateManager: Current state does not handle clicks');
        }
    }
}
