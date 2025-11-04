export default {
    name: "The Square",
    description: "A square path around the center",
    generatePath: (width, height) => [
        { x: 0, y: height * 0.3 },
        { x: width * 0.3, y: height * 0.3 },
        { x: width * 0.3, y: height * 0.7 },
        { x: width * 0.7, y: height * 0.7 },
        { x: width * 0.7, y: height * 0.3 },
        { x: width, y: height * 0.3 }
    ]
};
