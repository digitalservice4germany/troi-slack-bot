
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
            reminder_staging: {}
        },
        troi: {
            active: null,
            username: userInfo.user.profile.email.split("@")[0],
            employeeId: null,
            positions: [], // { id: xy, partOfProject: abc, nickname: null }
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
    /*user.troi.employeeId = await troiApi.getEmployeeIdForUserName(user.troi.username); TODO
    let projects = await troiApi.getCalculationPositions();
    if (projects.length === 1) {
        user.troi.defaultProject = projects[0].id;
    } else {
        // ask users to give nicknames for projects TODO
    }
    // don't allow changing of usernames? Instead verify email with Google OAuth? TODO
    // instead of API impersonation, use a PIN that people have to enter with each entry and encrypt the stored password with that? TODO
    await say("Hey there " + user.displayName + ", nice to meet you! I set up the default reminder for you:" +
        " _every weekday at 17:00_.\n" +
        "From your email-address I derived that your Troi username is *" + user.troi.username + "*. If this" +
        " is not correct, please change it by sending: _username: <your-Troi-username>_");*/
}

exports.deleteUser = user => {
    // cancel any scheduled reminders he might have TODO
    delete this.users[user.id];
}
