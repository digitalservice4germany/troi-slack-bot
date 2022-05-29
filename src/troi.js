const config = require('../config.json');

let troiApi;

exports.startTroi = async () => {
    const TroiApiService = await import("troi-library");
    troiApi = new TroiApiService.default(config.TROI_API_URL, config.TROI_USERNAME, config.TROI_PASSWORD);
    await troiApi.initialize();
}
