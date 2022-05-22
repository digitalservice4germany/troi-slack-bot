const moment = require("moment");
const { updateStreak } = require("./util");

exports.handleMessage = async(user, msg, reschedule) => {
    // msg.text is already encoded and "&" turns into "&amp;" for instance
    // that distorts passwords if they have special characters
    let rawText = msg.blocks[0].elements[0].elements[0].text; // is this path always existing/correct though?
    let parts = rawText.trim().split(" ");
    // use a NLP tokenizer for parsing? Like npm wink-nlp (multilingual) TODO
    let response = null;
    // refactor this to command blocks that can also be iterated over to generate the help message TODO
    switch(parts[0]) {
        case "username":
            user.troi.username = parts[1].trim();
            response = "Thanks, username saved";
            break;
        case "pause":
            // after 2 weeks turn off and notify user about it?
            response = "Ok, your reminders are paused until XY"; // TODO
            break;
        case "getTimes":
            if (!user.troi.defaultPosition) {
                response = "I don't have information about your position(s) yet";
                break;
            }
            let endDate = new Date();
            let startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
            response = "TODO";
            /*let entries = await troiApi.getTimeEntries(
                user.troi.defaultPosition,
                moment(startDate).format("YYYYMMDD"),
                moment(endDate).format("YYYYMMDD")
            );
            console.log("entries", entries);
            response = "*Time entries from " + moment(startDate).format("YYYY-MM-DD") + " to " + moment(endDate).format("YYYY-MM-DD") + ":*\n";
            entries.forEach(entry => {
                response += entry.date + "\t" + entry.hours + "h\t" + entry.description + "\n";
            })*/
            break;
        case "reschedule":
            user.reminder.rule.hour = 16; // parse from input TODO
            reschedule();
            response = "What an absolute pleasure, your reminder is rescheduled"; // source from locale TODO
            break;
        case "setLanguage":
            user.language.active = parts[1].trim().toLowerCase(); // parse more solid TODO
            response = "You got it, language is set to " + user.language.active;
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
            // GitHub PR to locale files? https://github.com/digitalservice4germany/troi-slack-bot/pulls
            // Or collect these somewhere else? Would be cool to have them instantly available TODO
            break;
        case "startTracking":
            // start and stop tracking feature? TODO
            break;
        case "help":
            response = "This is what you can do with this bot..."; // TODO
            break;
        case "reset":
            // TODO
            response = "Your settings were completely reset";
            break;
        case "broadcast":
            // protect this functionality with a password coming from process.env.? TODO
            response = "Your message was sent to all BleibTroy users";
            break;
        case "export":
            response = "This is all I know about you:\n```" + JSON.stringify(user, null, 4) + "```";
            break;
        case "bug":
        case "suggestion":
            // TODO
            response = "Great, thanks, your issue was submitted to https://github.com/digitalservice4germany/troi-slack-bot/issues";
            break;
    }

    if (parts[0].endsWith("h")) { // add here elaborated fail-safe parsing of all kinds of ways to specify a duration, use https://github.com/agenda/human-interval? TODO
        let position = user.troi.defaultPosition; // deal with multiple positions/nicknames etc. TODO
        let date = moment(new Date()).format("YYYY-MM-DD");
        let hours = Number.parseFloat(parts[0].substring(0, parts[0].length - 1)); // expects 2.5 and not 2,5 --> support both TODO
        let description = msg.text.substring(parts[0].length + 1);
        // await troiApi.postTimeEntry(position, date, hours, description);
        let streakIntact = updateStreak(user);
        // include streak intact yes/no into response and tell leaderboard-position in company TODO
        response = "Sweet, your new time entry was added successfully"; // source from locale TODO
    }

    if (!response) {
        return "Sorry, not sure what you mean"; // source from locale TODO
    }

    return response;
}
