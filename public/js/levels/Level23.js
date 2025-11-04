export default {
    name: "Chevron",
    description: "Sharp angular turns like a chevron",
    generatePath: (width, height) => [
        { x: 0, y: height * 0.8 },
        { x: width * 0.25, y: height * 0.2 },
        { x: width * 0.5, y: height * 0.8 },
        { x: width * 0.75, y: height * 0.2 },
        { x: width, y: height * 0.8 }
    ]
};
