export default {
    name: "Wave Pattern",
    description: "Smooth wave-like motion",
    generatePath: (width, height) => {
        const path = [];
        for (let i = 0; i <= 20; i++) {
            const x = (i / 20) * width;
            const y = height * 0.5 + Math.sin(i * 0.5) * height * 0.2;
            path.push({ x, y });
        }
        return path;
    }
};
