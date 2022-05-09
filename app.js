const { App } = require('@slack/bolt');

const app = new App({
    token: process.env.BOT_USER_OAUTH_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    socketMode: true,
    appToken: process.env.SOCKET_MODE_TOKEN
});

app.message(async ({ message, say }) => {
    console.log(message, say);
    // extract the channel-ID from the say-object
    await say(`Hey there <@${message.user}>!`);
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
};

(async () => {
    await app.start();
    // await postMessage();
    console.log('Troi Slack Bot app is running');
})();
