const TroiApiService = require('../lib/TroiApiService.js');
const moment = require('moment');

let troiApi;

exports.handleMessage = async(user, msg) => {
    // msg.text is already encoded and "&" turns into "&amp;" for instance
    // that distorts passwords if they have special characters
    let rawText = msg.blocks[0].elements[0].elements[0].text; // is this path always existing/correct though?
    let parts = rawText.trim().split(' ');

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
        case "gettimes":
            if (!user.troi.defaultProject) break;
            let endDate = new Date();
            let startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
            let entries = await troiApi.getTimeEntries(
                user.troi.defaultProject,
                moment(startDate).format("YYYYMMDD"),
                moment(endDate).format("YYYYMMDD")
            );
            console.log("entries", entries);
            response = "*Time entries from " + moment(startDate).format("YYYY-MM-DD") + " to " + moment(endDate).format("YYYY-MM-DD") + ":*\n";
            entries.forEach(entry => {
                response += entry.date + "\t" + entry.hours + "h\t" + entry.description + "\n";
            })
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
        let projects = await troiApi.getCalculationPositions();
        console.log("projects", projects);
        if (projects.length === 1) {
            user.troi.defaultProject = projects[0].id;
        } else {
            // ask users to give nicknames for projects
        }
    }

    if (parts[0].endsWith("h")) { // add here elaborated fail-safe parsing of all kinds of ways to specify a duration
        let project = user.troi.defaultProject; // deal with multiple projects/nicknames etc.
        let date = moment(new Date()).format("YYYY-MM-DD");
        let hours = Number.parseFloat(parts[0].substring(0, parts[0].length - 1)); // expects 2.5 and not 2,5 --> support both
        let description = msg.text.substring(parts[0].length + 1);
        await troiApi.postTimeEntry(project, date, hours, description);
    }

    return response;
}
