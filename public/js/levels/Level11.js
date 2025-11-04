export default {
    name: "Staircase",
    description: "Step-like progression upward",
    generatePath: (width, height) => [
        { x: 0, y: height * 0.9 },
        { x: width * 0.2, y: height * 0.9 },
        { x: width * 0.2, y: height * 0.7 },
        { x: width * 0.4, y: height * 0.7 },
        { x: width * 0.4, y: height * 0.5 },
        { x: width * 0.6, y: height * 0.5 },
        { x: width * 0.6, y: height * 0.3 },
        { x: width * 0.8, y: height * 0.3 },
        { x: width * 0.8, y: height * 0.1 },
        { x: width, y: height * 0.1 }
    ]
};
