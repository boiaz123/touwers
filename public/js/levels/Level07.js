export default {
    name: "The Cross",
    description: "Crossing paths in the middle",
    generatePath: (width, height) => [
        { x: 0, y: height * 0.5 },
        { x: width * 0.3, y: height * 0.5 },
        { x: width * 0.3, y: height * 0.2 },
        { x: width * 0.7, y: height * 0.2 },
        { x: width * 0.7, y: height * 0.8 },
        { x: width * 0.5, y: height * 0.8 },
        { x: width * 0.5, y: height * 0.5 },
        { x: width, y: height * 0.5 }
    ]
};
