const config = require("../config.json");
const { App } = require("@slack/bolt");
const { handleAppHomeOpenedEvent, handleActionResponse, handleMessage } = require("./state");

exports.startSlackApp = async () => {
    await slackApp.start();
    console.log("Slack app has started");
}

const slackApp = new App({
    token: config.SLACK_BOT_USER_OAUTH_TOKEN,
    signingSecret: config.SLACK_SIGNING_SECRET,
    socketMode: true,
    appToken: config.SLACK_SOCKET_MODE_TOKEN
});

// INCOMING

slackApp.event("app_home_opened", async ({ event, client, say }) => {
    await handleAppHomeOpenedEvent(event, say, client);
});

slackApp.message(async ({ message, client, say }) => {
    if (message.subtype && message.subtype === "message_changed") return;
    await handleMessage(message, say, client);
});

// Actions

slackApp.action(new RegExp('^btn', 'i'), async ({ body, ack, say, client}) => {
    await handleActionResponse("button-response", body, ack, say, client);
});

slackApp.action(new RegExp('^timepicker', 'i'), async ({ body, ack, say, client}) => {
    await handleActionResponse("timepicker-response", body, ack, say, client);
});

slackApp.action(new RegExp('^checkboxes', 'i'), async ({ body, ack, say, client}) => {
    await handleActionResponse("checkbox-response", body, ack, say, client);
});

// OUTGOING

async function postMessage(user, text) {
    try {
        const result = await slackApp.client.chat.postMessage({
            token: config.SLACK_BOT_USER_OAUTH_TOKEN,
            channel: user.channel,
            text: text
        });
        console.log("Sent message to " + user.user);
    } catch (error) {
        console.error(error);
    }
}
