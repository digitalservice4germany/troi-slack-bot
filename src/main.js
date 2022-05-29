const config = require('../config.json');
const { startSlackApp } = require("./slack");
const { users, registerNewUser } = require("./users");
// const nano = require("nano")("http://admin:admin@localhost:5984"); TODO
// const { GoogleSpreadsheet } = require("google-spreadsheet"); TODO
// const git = require("simple-git"); TODO

let troiApi;

// nano.db.create("troi-slack-app");
// const db = nano.use("troi-slack-app");

(async () => {
    await startSlackApp()
    const TroiApiService = await import("troi-library");
    troiApi = new TroiApiService.default(config.TROI_API_URL, config.TROI_USERNAME, config.TROI_PASSWORD);
    await troiApi.initialize();
    console.log("Connection to the Troi API is initialized");
    console.log("BleibTroy is running");
})();
