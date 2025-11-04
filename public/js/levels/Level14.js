export default {
    name: "Corner Runner",
    description: "Hugging all four corners",
    generatePath: (width, height) => [
        { x: 0, y: height * 0.1 },
        { x: width * 0.9, y: height * 0.1 },
        { x: width * 0.9, y: height * 0.9 },
        { x: width * 0.1, y: height * 0.9 },
        { x: width * 0.1, y: height * 0.5 },
        { x: width, y: height * 0.5 }
    ]
};
