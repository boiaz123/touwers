export default {
    name: "The Labyrinth",
    description: "Complex maze-like path",
    generatePath: (width, height) => [
        { x: 0, y: height * 0.1 },
        { x: width * 0.1, y: height * 0.1 },
        { x: width * 0.1, y: height * 0.5 },
        { x: width * 0.4, y: height * 0.5 },
        { x: width * 0.4, y: height * 0.2 },
        { x: width * 0.7, y: height * 0.2 },
        { x: width * 0.7, y: height * 0.8 },
        { x: width * 0.3, y: height * 0.8 },
        { x: width * 0.3, y: height * 0.6 },
        { x: width * 0.9, y: height * 0.6 },
        { x: width * 0.9, y: height * 0.4 },
        { x: width, y: height * 0.4 }
    ]
};
