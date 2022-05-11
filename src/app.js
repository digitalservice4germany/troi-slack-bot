const { App } = require('@slack/bolt');
const dialog = require('./dialog.js')

const app = new App({
    token: process.env.BOT_USER_OAUTH_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    socketMode: true,
    appToken: process.env.SOCKET_MODE_TOKEN
});

const users = {};

app.message(async ({ message, say }) => {
    let user = users[message.user];
    if (!user) {
        // first time we hear from this user
        user = {
            user: message.user,
            channel: message.channel,
            troi: {
                username: null,
                password: null,
                projects: {}, // key: nickname, value: ID
                defaultProject: null // ID
            }
        };
        users[message.user] = user;
    }
    let response = await dialog.handleMessage(user, message);
    if (response) {
        await say(response);
    }
});

// via https://api.slack.com/messaging/sending#publishing
async function postMessage() {
    try {
        const result = await app.client.chat.postMessage({
            token: process.env.BOT_USER_OAUTH_TOKEN,
            channel: "",
            text: "..."
        });
        console.log(result);
    } catch (error) {
        console.error(error);
    }
}

(async () => {
    await app.start();
    console.log('BleibTroy is running');
})();
