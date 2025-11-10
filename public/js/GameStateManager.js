export class GameStateManager {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.states = {};
        this.currentState = null;
        this.currentStateName = null;
        
        console.log('GameStateManager: Initialized with canvas:', canvas.width, 'x', canvas.height);
    }
    
    addState(name, state) {
        this.states[name] = state;
        console.log('GameStateManager: Added state:', name);
    }
    
    changeState(name) {
        if (!this.states[name]) {
            console.error('GameStateManager: State not found:', name);
            return false;
        }
        
        console.log('GameStateManager: Changing state from', this.currentStateName, 'to', name);
        
        // Exit current state if exists
        if (this.currentState && this.currentState.exit) {
            try {
                this.currentState.exit();
            } catch (error) {
                console.error('GameStateManager: Error exiting state:', error);
            }
        }
        
        // Change to new state
        this.currentState = this.states[name];
        this.currentStateName = name;
        
        // Enter new state
        if (this.currentState.enter) {
            try {
                this.currentState.enter();
            } catch (error) {
                console.error('GameStateManager: Error entering state:', error);
                return false;
            }
        }
        
        console.log('GameStateManager: State changed successfully to', name);
        return true;
    }
    
    update(deltaTime) {
        if (this.currentState && this.currentState.update) {
            try {
                this.currentState.update(deltaTime);
            } catch (error) {
                console.error('GameStateManager: Error updating state:', error);
            }
        }
    }
    
    render() {
        if (this.currentState && this.currentState.render) {
            try {
                this.currentState.render(this.ctx);
            } catch (error) {
                console.error('GameStateManager: Error rendering state:', error);
                
                // Fallback rendering
                this.ctx.fillStyle = '#000';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.fillStyle = '#f00';
                this.ctx.font = '20px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('Render Error', this.canvas.width / 2, this.canvas.height / 2);
            }
        }
    }
    
    handleClick(x, y) {
        if (this.currentState && this.currentState.handleClick) {
            try {
                this.currentState.handleClick(x, y);
            } catch (error) {
                console.error('GameStateManager: Error handling click:', error);
            }
        }
    }
}
