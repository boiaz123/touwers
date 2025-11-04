export default {
    name: "Diamond Shape",
    description: "Diamond-shaped path through the center",
    generatePath: (width, height) => [
        { x: 0, y: height * 0.5 },
        { x: width * 0.25, y: height * 0.2 },
        { x: width * 0.5, y: height * 0.5 },
        { x: width * 0.75, y: height * 0.8 },
        { x: width, y: height * 0.5 }
    ]
};
