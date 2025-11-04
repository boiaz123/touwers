export default {
    name: "Mountain Path",
    description: "Up and down like a mountain range",
    generatePath: (width, height) => [
        { x: 0, y: height * 0.8 },
        { x: width * 0.15, y: height * 0.2 },
        { x: width * 0.3, y: height * 0.8 },
        { x: width * 0.45, y: height * 0.3 },
        { x: width * 0.6, y: height * 0.7 },
        { x: width * 0.75, y: height * 0.2 },
        { x: width * 0.9, y: height * 0.8 },
        { x: width, y: height * 0.5 }
    ]
};
