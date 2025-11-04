export default {
    name: "Final Challenge",
    description: "The ultimate test - complex multi-layered path",
    generatePath: (width, height) => [
        { x: 0, y: height * 0.1 },
        { x: width * 0.2, y: height * 0.1 },
        { x: width * 0.2, y: height * 0.3 },
        { x: width * 0.5, y: height * 0.3 },
        { x: width * 0.5, y: height * 0.1 },
        { x: width * 0.8, y: height * 0.1 },
        { x: width * 0.8, y: height * 0.5 },
        { x: width * 0.3, y: height * 0.5 },
        { x: width * 0.3, y: height * 0.7 },
        { x: width * 0.7, y: height * 0.7 },
        { x: width * 0.7, y: height * 0.9 },
        { x: width * 0.1, y: height * 0.9 },
        { x: width * 0.1, y: height * 0.6 },
        { x: width * 0.9, y: height * 0.6 },
        { x: width * 0.9, y: height * 0.4 },
        { x: width, y: height * 0.4 }
    ]
};
