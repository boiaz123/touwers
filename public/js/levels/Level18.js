export default {
    name: "Circular Arc",
    description: "A large circular arc across the screen",
    generatePath: (width, height) => {
        const centerX = width * 0.5;
        const centerY = height * 1.2;
        const radius = height * 0.8;
        const path = [];
        
        for (let i = 0; i <= 10; i++) {
            const angle = Math.PI * 0.6 + (i / 10) * Math.PI * 0.8;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            path.push({ x, y });
        }
        
        return path;
    }
};
