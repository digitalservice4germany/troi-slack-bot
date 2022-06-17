
exports.users = {};

exports.buildDefaultUser = (userID, channelID, userInfo) => {
    return {
        id: userID,
        channel: channelID,
        displayName: userInfo.user.profile.display_name.split(" ")[0],
        language: {
            active: "en", // no main language switch supported for now
            deOk: true // German is also ok
        },
        state: {
            current: "init",
            choices: {
                base_usage: null
            },
            reminder_staging: {},
            troi_staging: {}
        },
        troi: {
            active: null,
            username: userInfo.user.profile.email.split("@")[0],
            employeeId: null,
            positions: [], // { id: xy, nickname: null }
            defaultPosition: null,
            stats: {
                currentStreak: 0,
                latestSubmissionDay: null,
                totalSubmissionDays: 0
            },
        },
        reminder: {
            active: null,
            // pausedUntil: null, TODO
            schedule: {
                dayOfWeek: [1,2,3,4,5],
                hour: 17,
                minute: 0
            }
        }
    };
}

exports.registerNewUser = async (eventOrMessage, client, say) => {
    const userInfo = await client.users.info({ user: eventOrMessage.user });
    let user = this.buildDefaultUser(eventOrMessage.user, eventOrMessage.channel, userInfo);
    this.users[user.id] = user;
    console.log("New user registered: " + user.displayName);
    return user;
}

exports.deleteUser = user => {
    // cancel any scheduled reminders he might have TODO
    delete this.users[user.id];
}
