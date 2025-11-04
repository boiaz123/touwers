export default {
    name: "Reverse L",
    description: "An upside-down L shape",
    generatePath: (width, height) => [
        { x: 0, y: height * 0.2 },
        { x: width * 0.3, y: height * 0.2 },
        { x: width * 0.3, y: height * 0.8 },
        { x: width, y: height * 0.8 }
    ]
};
