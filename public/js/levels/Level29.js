export default {
    name: "The Gauntlet",
    description: "Narrow passages and tight turns",
    generatePath: (width, height) => [
        { x: 0, y: height * 0.1 },
        { x: width * 0.15, y: height * 0.1 },
        { x: width * 0.15, y: height * 0.4 },
        { x: width * 0.35, y: height * 0.4 },
        { x: width * 0.35, y: height * 0.15 },
        { x: width * 0.65, y: height * 0.15 },
        { x: width * 0.65, y: height * 0.6 },
        { x: width * 0.85, y: height * 0.6 },
        { x: width * 0.85, y: height * 0.3 },
        { x: width, y: height * 0.3 }
    ]
};
