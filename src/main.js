const { startSlackApp } = require("./slack");
const { startTroi } = require("./troi");
const { initGoogleSheets } = require("./sayings");
// const nano = require("nano")("http://admin:admin@localhost:5984"); TODO
// const git = require("simple-git"); TODO
// nano.db.create("troi-slack-app");
// const db = nano.use("troi-slack-app");

(async () => {
    await startSlackApp();
    await startTroi();
    await initGoogleSheets();
    console.log("--> BleibTroy is running");
})();
