export default {
    name: "The Loop",
    description: "A circular loop in the middle",
    generatePath: (width, height) => [
        { x: 0, y: height * 0.5 },
        { x: width * 0.3, y: height * 0.5 },
        { x: width * 0.3, y: height * 0.3 },
        { x: width * 0.5, y: height * 0.3 },
        { x: width * 0.5, y: height * 0.7 },
        { x: width * 0.3, y: height * 0.7 },
        { x: width * 0.3, y: height * 0.5 },
        { x: width, y: height * 0.5 }
    ]
};
