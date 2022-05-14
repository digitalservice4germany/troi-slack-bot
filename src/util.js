const schedule = require("node-schedule");
const de = require('../locale/de.json')
const en = require('../locale/en.json')

exports.lang = (user, key) => {
    let json = user.language.active === "en" ? en : de;
    user.language.lastUsedKey = key;
    let entries = json[key];
    // distinguish what type of entry it is, could be fix value or array (in that case pick random value) TODO
    let entry = entries[Math.floor(Math.random() * entries.length)];
    entry = entry.replace("<name>", user.displayName);
    entry = entry.replace("<weekday>", new Date().toLocaleString(user.language.active, { weekday:'long' }));
    return entry;
}

exports.buildDefaultUser = (message, userInfo) => {
    return {
        user: message.user,
        channel: message.channel,
        displayName: userInfo.user.profile.display_name.split(' ')[0],
        email: userInfo.user.profile.email,
        language: {
            active: "en", // "de"
            lastUsedKey: null // for sassy suggestions based on whatever the user saw previously :)
        },
        troi: {
            username: userInfo.user.profile.email.split('@')[0],
            password: null,
            projects: {}, // key: nickname, value: ID
            defaultProject: null // ID
        },
        reminder: {
            active: true,
            pausedUntil: null,
            rule: {
                dayOfWeek: {
                    fixDay: null,
                    range: {
                        start: 1,
                        end: 5, // 1-5 = weekdays, easy way to skip public holidays? TODO
                        step: null
                    }
                },
                hour: 17,
                minute: 0,
                second: 0
            }
        }
    };
}

exports.buildRecurrenceRule = ruleObj => {
    const rule = new schedule.RecurrenceRule();
    rule.dayOfWeek = new schedule.Range(ruleObj.dayOfWeek.range.start, ruleObj.dayOfWeek.range.end); // this needs some if-else etc. TODO
    rule.hour = ruleObj.hour;
    rule.minute = ruleObj.minute;
    rule.second = ruleObj.second;
    return rule;
}
