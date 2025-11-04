export default {
    name: "The Maze Entry",
    description: "Multiple turns like a maze entrance",
    generatePath: (width, height) => [
        { x: 0, y: height * 0.2 },
        { x: width * 0.2, y: height * 0.2 },
        { x: width * 0.2, y: height * 0.6 },
        { x: width * 0.6, y: height * 0.6 },
        { x: width * 0.6, y: height * 0.3 },
        { x: width * 0.8, y: height * 0.3 },
        { x: width * 0.8, y: height * 0.8 },
        { x: width, y: height * 0.8 }
    ]
};
