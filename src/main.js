const { startSlackApp } = require("./slack");
const { users, registerNewUser } = require("./users");
const { startTroi } = require("./troi");
// const nano = require("nano")("http://admin:admin@localhost:5984"); TODO
// const { GoogleSpreadsheet } = require("google-spreadsheet"); TODO
// const git = require("simple-git"); TODO
// nano.db.create("troi-slack-app");
// const db = nano.use("troi-slack-app");

(async () => {
    await startSlackApp()
    await startTroi()
    console.log("Connection to the Troi API is initialized");
    console.log("BleibTroy is running");
})();
