export class Level {
    constructor() {
        this.path = [
            { x: 0, y: 300 },
            { x: 200, y: 300 },
            { x: 200, y: 100 },
            { x: 400, y: 100 },
            { x: 400, y: 400 },
            { x: 600, y: 400 },
            { x: 600, y: 200 },
            { x: 800, y: 200 }
        ];
    }
    
    render(ctx) {
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 60;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(this.path[0].x, this.path[0].y);
        for (let i = 1; i < this.path.length; i++) {
            ctx.lineTo(this.path[i].x, this.path[i].y);
        }
        ctx.lineTo(ctx.canvas.width, this.path[this.path.length - 1].y);
        ctx.stroke();
    }
}
