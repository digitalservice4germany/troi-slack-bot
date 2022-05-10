const { App } = require('@slack/bolt');
const Bree = require('bree');

const app = new App({
    token: process.env.BOT_USER_OAUTH_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    socketMode: true,
    appToken: process.env.SOCKET_MODE_TOKEN
});

const users = {};

app.message(async ({ message, say }) => {
    if (!users[message.user]) {
        users[message.user] = {
            userID: message.user,
            channelID: message.channel
        };
    }
    console.log("users", users);
    switch(message.text) {
        case "start reminders":
            break;
        case "stop reminders":
            break;
        default:
            await say("Got the message, thanks"); // say(`Hey there <@${message.user}>!`)
            break;
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

const bree = new Bree({
    jobs: [
        {
            name: 'reminder',
            interval: '10s',
            worker: {
                workerData: {
                    foo: 'bar'
                }
            }
        },
    ]
});

(async () => {
    await app.start();
    bree.start();
    // await postMessage();
    console.log('Troi Slack Bot app is running');
})();
