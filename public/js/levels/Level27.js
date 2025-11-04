export default {
    name: "Infinity Loop",
    description: "Path resembling an infinity symbol",
    generatePath: (width, height) => [
        { x: 0, y: height * 0.5 },
        { x: width * 0.15, y: height * 0.3 },
        { x: width * 0.35, y: height * 0.5 },
        { x: width * 0.5, y: height * 0.7 },
        { x: width * 0.65, y: height * 0.5 },
        { x: width * 0.85, y: height * 0.3 },
        { x: width, y: height * 0.5 }
    ]
};
