export class GameStateManager {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.currentState = null; // Start with no state
        this.states = {};
        this.selectedLevelInfo = null; // Add this to store level selection
        console.log('GameStateManager: initialized');
    }
    
    addState(name, state) {
        this.states[name] = state;
        console.log(`GameStateManager: Added state '${name}'`);
    }
    
    changeState(stateName) {
        console.log(`StateManager: Attempting to change to state '${stateName}'`);
        
        if (!this.states[stateName]) {
            console.error(`StateManager: State '${stateName}' does not exist`);
            return false;
        }
        
        try {
            // Exit current state
            if (this.currentStateName && this.states[this.currentStateName]) {
                console.log(`StateManager: Exiting state '${this.currentStateName}'`);
                if (this.states[this.currentStateName].exit) {
                    this.states[this.currentStateName].exit();
                }
            }
            
            // Enter new state
            this.currentStateName = stateName;
            console.log(`StateManager: Entering state '${stateName}'`);
            if (this.states[stateName].enter) {
                this.states[stateName].enter();
            }
            
            console.log(`StateManager: Successfully changed to state '${stateName}'`);
            return true;
        } catch (error) {
            console.error(`StateManager: Error changing to state '${stateName}':`, error);
            return false;
        }
    }
    
    update(deltaTime) {
        try {
            if (this.currentStateName && this.states[this.currentStateName]) {
                const currentState = this.states[this.currentStateName];
                if (currentState.update) {
                    currentState.update(deltaTime);
                }
            }
        } catch (error) {
            console.error('StateManager: Error in update:', error);
        }
    }
    
    render() {
        try {
            if (this.currentStateName && this.states[this.currentStateName]) {
                const currentState = this.states[this.currentStateName];
                if (currentState.render) {
                    currentState.render(this.ctx);
                }
            }
        } catch (error) {
            console.error('StateManager: Error in render:', error);
        }
    }
    
    handleClick(x, y) {
        try {
            if (this.currentStateName && this.states[this.currentStateName]) {
                const currentState = this.states[this.currentStateName];
                if (currentState.handleClick) {
                    currentState.handleClick(x, y);
                }
            }
        } catch (error) {
            console.error('StateManager: Error handling click:', error);
        }
    }
}
