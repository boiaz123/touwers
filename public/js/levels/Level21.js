export default {
    name: "Star Pattern",
    description: "Five-pointed star path",
    generatePath: (width, height) => [
        { x: 0, y: height * 0.5 },
        { x: width * 0.2, y: height * 0.2 },
        { x: width * 0.5, y: height * 0.5 },
        { x: width * 0.3, y: height * 0.8 },
        { x: width * 0.7, y: height * 0.8 },
        { x: width * 0.5, y: height * 0.5 },
        { x: width * 0.8, y: height * 0.2 },
        { x: width, y: height * 0.5 }
    ]
};
