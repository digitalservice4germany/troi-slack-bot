const config = require("../config.json");
const { App } = require("@slack/bolt");
const { handleAppHomeOpenedEvent, handleButtonResponse, handleMessage } = require("./state");

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
    await handleAppHomeOpenedEvent(event, client, say);
});

slackApp.action(new RegExp('^btn', 'i'), async ({ body, ack, say }) => {
    await handleButtonResponse(body, ack, say);
});

slackApp.message(async ({ message, client, say }) => {
    await handleMessage(message, client, say);
});

// OUTGOING

async function postMessage(user, text) {
    try {
        const result = await slackApp.client.chat.postMessage({
            token: process.env.BOT_USER_OAUTH_TOKEN,
            channel: user.channel,
            text: text
        });
        console.log("Sent message to " + user.user);
    } catch (error) {
        console.error(error);
    }
}

async function dev(message, say) {
    await say({
        blocks: [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `:wave: *Hey there* <@${message.user}>!`
                },
            },
            {
                "type": "divider"
            },
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "text": "Button 1",
                        },
                        "value": "btn1",
                        "action_id": "btn1"
                    },
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "text": "Button 2",
                        },
                        "value": "btn2",
                        "action_id": "btn2"
                    }
                ]
            }
        ],
        text: "text to be shown in slack notification etc."
    });
}
