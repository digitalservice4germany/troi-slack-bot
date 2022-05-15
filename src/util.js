const schedule = require("node-schedule");
const moment = require("moment");
const de = require('../locale/de.json');
const en = require('../locale/en.json');

const publicHolidaysBerlin = ["26.05.2022", "06.06.2022", "03.10.2022", "26.12.2022"];

exports.lang = (user, key) => {
    let json = user.language.active === "en" ? en : de;
    user.language.lastUsedKey = key;
    let entries = json[key];
    // distinguish what type of entry it is, could be fix value or array (in that case pick random value) TODO
    let entry = entries[Math.floor(Math.random() * entries.length)];
    entry = entry.replace("<name>", user.displayName);
    entry = entry.replace("<weekday>", new Date().toLocaleString(user.language.active, { weekday: 'long' }));
    return entry;
}

exports.buildDefaultUser = (userID, channelID, userInfo) => {
    return {
        user: userID,
        channel: channelID,
        displayName: userInfo.user.profile.display_name.split(' ')[0],
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
        stats: {
            currentStreak: 0,
            previousSubmissionDay: null
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

exports.todayIsPublicHoliday = () => {
    return isPublicToday(moment(new Date()));
}

const isPublicToday = moment => {
    return publicHolidaysBerlin.includes(moment.format("DD.MM.YYYY"));
}

const getAndUpdatePrevSubmissionDay = user => {
    let prevDayMoment = user.stats.previousSubmissionDay ? moment(user.stats.previousSubmissionDay, "YYYY-MM-DD") : moment();
    user.stats.previousSubmissionDay = moment().format("YYYY-MM-DD"); // = today
    return prevDayMoment;
}

exports.updateStreak = user => {
    let streakIntact = true;
    let countingToToday = getAndUpdatePrevSubmissionDay(user).add(1, "days");
    let today = moment();
    while (countingToToday.isBefore(today, "day")) {
        // the streak only stays intact if there is an "excuse" for not submitting for every day between the last submission
        // date and today - valid excuses for non-submission-days are that it was weekend or that it was a public holiday
        if (countingToToday.isoWeekday() < 6 && !isPublicToday(countingToToday)) {
            streakIntact = false;
            break;
        }
        countingToToday.add(1, 'days');
    }
    user.stats.currentStreak = streakIntact ? user.stats.currentStreak + 1 : 0;
    return streakIntact;
}
