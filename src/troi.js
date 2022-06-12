const config = require('../config.json');

let troiApi;

exports.startTroi = async () => {
    const TroiApiService = await import("../../troi-library/index.js"); // temporary TODO
    troiApi = new TroiApiService.default({
        baseUrl: config.TROI_API_URL,
        clientName: config.TROI_CLIENT_NAME,
        username: config.TROI_USERNAME,
        password: config.TROI_PASSWORD
    });
    await troiApi.initialize();
    console.log("Connection to the Troi API is initialized");
}

exports.storeEmployeeId = async (user) => {
    user.troi.employeeId = await troiApi.getEmployeeIdForUsername(user.troi.username);
}

exports.fetchPreviousCalculationPositions = async (user) => {
    let response = await troiApi.getCalculationPositionsLastRecorded(user.troi.employeeId);
    if (!response.length) return [];
    let previousCPs = [];
    for (let cp of response) {
        previousCPs.push({
            id: cp.cpId,
            path: cp.cpPath
        });
    }
    return previousCPs;
}
