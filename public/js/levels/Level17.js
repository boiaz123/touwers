export default {
    name: "The Funnel",
    description: "Wide entry narrowing to a point",
    generatePath: (width, height) => [
        { x: 0, y: height * 0.1 },
        { x: width * 0.3, y: height * 0.3 },
        { x: width * 0.5, y: height * 0.5 },
        { x: width * 0.7, y: height * 0.5 },
        { x: width, y: height * 0.5 }
    ]
};
