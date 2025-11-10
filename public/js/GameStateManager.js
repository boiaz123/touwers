export class GameStateManager {
    constructor(canvas, ctx) {
        if (!canvas || !ctx) {
            throw new Error('GameStateManager: Canvas and context are required');
        }
        
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
                console.log('GameStateManager: Exited previous state');
            } catch (error) {
                console.error('GameStateManager: Error exiting state:', error);
            }
        }
        
        // Change to new state
        this.currentState = this.states[name];
        this.currentStateName = name;
        console.log('GameStateManager: Set currentState to', name);
        
        // Enter new state
        if (this.currentState && this.currentState.enter) {
            try {
                this.currentState.enter();
                console.log('GameStateManager: Entered new state successfully');
            } catch (error) {
                console.error('GameStateManager: Error entering state:', error);
                return false;
            }
        } else {
            console.warn('GameStateManager: State has no enter method');
        }
        
        // CRITICAL: Force TWO immediate renders to ensure canvas is drawn
        console.log('GameStateManager: Forcing immediate renders after state change');
        try {
            this.render();
            this.render(); // Second render to ensure everything is visible
        } catch (renderError) {
            console.error('GameStateManager: Error in immediate render:', renderError);
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
        if (!this.ctx || !this.canvas) {
            console.warn('GameStateManager: Canvas or context not available');
            return;
        }
        
        if (!this.currentState) {
            console.warn('GameStateManager: No current state to render');
            return;
        }
        
        if (this.currentState.render) {
            try {
                this.currentState.render(this.ctx);
            } catch (error) {
                console.error('GameStateManager: Error rendering state:', error);
                console.error('Error stack:', error.stack);
                
                // Fallback rendering
                this.ctx.fillStyle = '#000';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.fillStyle = '#f00';
                this.ctx.font = '20px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('Render Error: ' + error.message, this.canvas.width / 2, this.canvas.height / 2);
            }
        } else {
            console.warn('GameStateManager: Current state has no render method');
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
