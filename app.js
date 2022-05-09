const { App } = require('@slack/bolt');

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    socketMode: true,
    appToken: process.env.APP_TOKEN
});

app.message('hello', async ({ message, say }) => {
    console.log(message, say);
    await say(`Hey there <@${message.user}>!`);
});

async function publishMessage() {
    try {
        const result = await app.client.chat.postMessage({
            token: process.env.SLACK_BOT_TOKEN,
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
    // await publishMessage();
    console.log('⚡️ Bolt app is running!');
})();
