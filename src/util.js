const schedule = require("node-schedule");

exports.buildDefaultUser = message => {
    return {
        user: message.user,
        channel: message.channel,
        troi: {
            username: null,
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
