export default {
    name: "Zigzag",
    description: "A zigzag pattern to confuse enemies",
    generatePath: (width, height) => [
        { x: 0, y: height * 0.5 },
        { x: width * 0.2, y: height * 0.2 },
        { x: width * 0.4, y: height * 0.8 },
        { x: width * 0.6, y: height * 0.2 },
        { x: width * 0.8, y: height * 0.8 },
        { x: width, y: height * 0.5 }
    ]
};
