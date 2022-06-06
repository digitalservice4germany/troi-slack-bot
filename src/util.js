const schedule = require("node-schedule");
const moment = require("moment");
const de = require("../locale/de.json");
const en = require("../locale/en.json");

const publicHolidaysBerlin = ["26.05.2022", "06.06.2022", "03.10.2022", "26.12.2022"];

exports.lang = (user, key) => {
    let json = user.language.active === "en" ? en : de;
    user.language.lastUsedKey = key;
    let entries = json[key];
    // distinguish what type of entry it is, could be fix value or array (in that case pick random value) TODO
    let entry = entries[Math.floor(Math.random() * entries.length)];
    entry = entry.replace("<name>", user.displayName);
    entry = entry.replace("<weekday>", new Date().toLocaleString(user.language.active, { weekday: "long" }));
    return entry;
}

exports.buildRecurrenceRule = scheduleDef => {
    const rule = new schedule.RecurrenceRule();
    rule.dayOfWeek = scheduleDef.dayOfWeek;
    rule.hour = scheduleDef.hour;
    rule.minute = scheduleDef.minute;
    return rule;
}

exports.todayIsPublicHoliday = () => {
    return isPublicHolidayToday(moment(new Date()));
}

const isPublicHolidayToday = moment => {
    return publicHolidaysBerlin.includes(moment.format("DD.MM.YYYY"));
}

const getAndUpdateLatestSubmissionDay = user => {
    if (!this.userSubmittedToday(user)) user.stats.totalSubmissionDays ++;
    let latestDayMoment = user.stats.latestSubmissionDay ? moment(user.stats.latestSubmissionDay, "YYYY-MM-DD") : moment();
    user.stats.latestSubmissionDay = moment().format("YYYY-MM-DD"); // = today
    return latestDayMoment;
}

exports.userSubmittedToday = user => {
    return user.stats.latestSubmissionDay &&
        moment(user.stats.latestSubmissionDay, "YYYY-MM-DD").isSame(moment(), "day");
}

exports.updateStreak = user => {
    let streakIntact = true;
    let countingToToday = getAndUpdateLatestSubmissionDay(user).add(1, "days");
    let today = moment();
    while (countingToToday.isBefore(today, "day")) {
        // the streak only stays intact if there is an "excuse" for not submitting for every day between the last submission
        // date and today - valid excuses for non-submission-days are that it was weekend or that it was a public holiday
        if (countingToToday.isoWeekday() < 6 && !isPublicHolidayToday(countingToToday)) {
            streakIntact = false;
            break;
        }
        countingToToday.add(1, "days");
    }
    user.stats.currentStreak = streakIntact ? user.stats.currentStreak + 1 : 0;
    return streakIntact;
}
