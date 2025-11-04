export default {
    name: "Double Back",
    description: "Path that doubles back on itself",
    generatePath: (width, height) => [
        { x: 0, y: height * 0.3 },
        { x: width * 0.6, y: height * 0.3 },
        { x: width * 0.6, y: height * 0.1 },
        { x: width * 0.2, y: height * 0.1 },
        { x: width * 0.2, y: height * 0.7 },
        { x: width * 0.8, y: height * 0.7 },
        { x: width * 0.8, y: height * 0.9 },
        { x: width, y: height * 0.9 }
    ]
};
