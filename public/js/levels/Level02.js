export default {
    name: "The L Turn",
    description: "A simple L-shaped path",
    generatePath: (width, height) => [
        { x: 0, y: height * 0.8 },
        { x: width * 0.7, y: height * 0.8 },
        { x: width * 0.7, y: height * 0.2 },
        { x: width, y: height * 0.2 }
    ]
};
