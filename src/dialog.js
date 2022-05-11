const TroiApiService = require('../lib/TroiApiService.js');

/*
let projects = await troiApi.getCalculationPositions();
console.log(projects, projects.length);
if (projects.length === 1) {
    // all good
} else {
    // ask users to give nicknames
}
let endDate = new Date();
let startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
let entries = await troiApi.getTimeEntries(
    projects[0].id,
    moment(startDate).format("YYYYMMDD"),
    moment(endDate).format("YYYYMMDD")
);
console.log("entries", entries);*/

let troiApi;

exports.handleMessage = async(user, msg) => {
    // msg.text is already encoded and "&" turns into "&amp;" for instance
    // that distorts passwords if they have special characters
    let rawText = msg.blocks[0].elements[0].elements[0].text; // is this path always existing/correct though?
    let parts = rawText.split(' ');

    let response = null;
    switch(parts[0]) {
        case "username":
            user.troi.username = parts[1].trim();
            response = "Thanks, username saved";
            break;
        case "password":
            user.troi.password = parts[1].trim();
            response = "Thanks, password saved";
            break;
        case "login":
            user.troi.username = parts[1].trim().split('/')[0].trim();
            user.troi.password = parts[1].trim().split('/')[1].trim();
            response = "Thanks, username & password saved";
            break;
    }

    if (!troiApi && user.troi.username && user.troi.password) {
        troiApi = new TroiApiService(user.troi.username, user.troi.password);
        try {
            await troiApi.initialize();
        } catch (err) {
            console.error("authentication failed", err);
        }
        console.log("clientId:", troiApi.clientId, "employeeId:", troiApi.employeeId);
    }

    if (parts[0].endsWith("h")) { // add here elaborated fail-safe parsing of all kinds of ways to specify a duration
        let hours = Number.parseFloat(parts[0].substring(0, parts[0].length - 1));
        let description = msg.text.substring(parts[0].length + 1);
        // ...
    }

    return response;
}
