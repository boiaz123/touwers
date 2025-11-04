export default {
    name: "Triple Tier",
    description: "Three horizontal tiers connected",
    generatePath: (width, height) => [
        { x: 0, y: height * 0.2 },
        { x: width * 0.7, y: height * 0.2 },
        { x: width * 0.7, y: height * 0.5 },
        { x: width * 0.3, y: height * 0.5 },
        { x: width * 0.3, y: height * 0.8 },
        { x: width, y: height * 0.8 }
    ]
};
