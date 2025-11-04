export default {
    name: "Figure Eight",
    description: "Two loops forming a figure-8",
    generatePath: (width, height) => [
        { x: 0, y: height * 0.5 },
        { x: width * 0.2, y: height * 0.3 },
        { x: width * 0.3, y: height * 0.5 },
        { x: width * 0.2, y: height * 0.7 },
        { x: width * 0.5, y: height * 0.5 },
        { x: width * 0.7, y: height * 0.3 },
        { x: width * 0.8, y: height * 0.5 },
        { x: width * 0.7, y: height * 0.7 },
        { x: width, y: height * 0.5 }
    ]
};
