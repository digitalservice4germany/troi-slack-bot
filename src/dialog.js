const TroiApiService = require('../lib/TroiApiService');
const moment = require('moment');

let troiApi;

exports.handleMessage = async(user, msg, reschedule) => {
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
        case "pause":
            response = "Ok, your reminders are paused until XY"; // TODO
            break;
        case "getTimes":
            if (!user.troi.defaultProject) {
                response = "I don't have information about your project(s) yet, did you not login yet?";
                break;
            }
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
        case "reschedule":
            user.reminder.rule.hour = 16; // parse from input TODO
            reschedule();
            response = "What an absolute pleasure, your reminder is rescheduled"; // source from locale TODO
            break;
        case "setLanguage":
            user.language.active = parts[1].trim().toLowerCase(); // parse more solid TODO
            response = "You got it, language is set to " + user.language;
            break;
        case "sassy":
            if (!user.language.lastUsedKey) {
                response = "I am so sorry, I don't know what your phrase is meant for!"; // offer solution? like show all keys from .json? TODO
                break;
            }
            let lang = parts[2].trim(); // en or de
            let suggestion = rawText.substring(("sassy " + lang + " ").length);
            console.log("sassy", lang, suggestion);
            response = "You are a true hero, your sassy phrase for *" + user.language.lastUsedKey + "* was recorded";
            // GitHub PR to locale files? Or collect these somewhere else? Would be cool to have them instantly available TODO
            break;
        case "startTracking":
            // start and stop tracking feature? TODO
            break;
        case "help":
            response = "This is what you can do with this bot..."; // TODO
            break;
        case "dev":
            // ...
            response = "dev command";
            break;
    }

    if (!troiApi && user.troi.username && user.troi.password) {
        troiApi = new TroiApiService(user.troi.username, user.troi.password);
        try {
            await troiApi.initialize();
        } catch (err) {
            console.error("Authentication failed", err);
        }
        console.log("clientId:", troiApi.clientId, "employeeId:", troiApi.employeeId);
        let projects = await troiApi.getCalculationPositions();
        console.log("projects", projects);
        if (projects.length === 1) {
            user.troi.defaultProject = projects[0].id;
        } else {
            // ask users to give nicknames for projects TODO
        }
    }

    if (parts[0].endsWith("h")) { // add here elaborated fail-safe parsing of all kinds of ways to specify a duration, use https://github.com/agenda/human-interval? TODO
        let project = user.troi.defaultProject; // deal with multiple projects/nicknames etc. TODO
        let date = moment(new Date()).format("YYYY-MM-DD");
        let hours = Number.parseFloat(parts[0].substring(0, parts[0].length - 1)); // expects 2.5 and not 2,5 --> support both TODO
        let description = msg.text.substring(parts[0].length + 1);
        await troiApi.postTimeEntry(project, date, hours, description);
        response = "Sweet, your new time entry was added successfully"; // source from locale TODO
    }

    if (!response) {
        return "Sorry, not sure what you mean"; // source from locale TODO
    }

    return response;
}
