export default {
    name: "Snake Path",
    description: "Winding like a snake",
    generatePath: (width, height) => [
        { x: 0, y: height * 0.1 },
        { x: width * 0.3, y: height * 0.4 },
        { x: width * 0.1, y: height * 0.6 },
        { x: width * 0.5, y: height * 0.8 },
        { x: width * 0.7, y: height * 0.5 },
        { x: width * 0.9, y: height * 0.3 },
        { x: width, y: height * 0.7 }
    ]
};
