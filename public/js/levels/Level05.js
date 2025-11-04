export default {
    name: "Spiral Inward",
    description: "A spiral moving toward the center",
    generatePath: (width, height) => [
        { x: 0, y: height * 0.1 },
        { x: width * 0.9, y: height * 0.1 },
        { x: width * 0.9, y: height * 0.9 },
        { x: width * 0.1, y: height * 0.9 },
        { x: width * 0.1, y: height * 0.3 },
        { x: width * 0.7, y: height * 0.3 },
        { x: width * 0.7, y: height * 0.7 },
        { x: width * 0.3, y: height * 0.7 },
        { x: width * 0.3, y: height * 0.5 },
        { x: width, y: height * 0.5 }
    ]
};
