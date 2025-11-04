export default {
    name: "Parallel Lines",
    description: "Two parallel paths that merge",
    generatePath: (width, height) => [
        { x: 0, y: height * 0.3 },
        { x: width * 0.4, y: height * 0.3 },
        { x: width * 0.4, y: height * 0.7 },
        { x: width * 0.6, y: height * 0.7 },
        { x: width * 0.6, y: height * 0.5 },
        { x: width, y: height * 0.5 }
    ]
};
