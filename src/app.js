const config = require('../config.json');
const { App } = require("@slack/bolt");
const { users, registerNewUser } = require("./users");
// const nano = require("nano")("http://admin:admin@localhost:5984"); TODO
// const { GoogleSpreadsheet } = require("google-spreadsheet"); TODO
// const git = require("simple-git"); TODO

let troiApi;

const slackApp = new App({
    token: config.SLACK_BOT_USER_OAUTH_TOKEN,
    signingSecret: config.SLACK_SIGNING_SECRET,
    socketMode: true,
    appToken: config.SLACK_SOCKET_MODE_TOKEN
});

// nano.db.create("troi-slack-app");
// const db = nano.use("troi-slack-app");

slackApp.event("app_home_opened", async ({ event, client, say }) => {
    if (!users[event.user]) await registerNewUser(event, client, say);
});

slackApp.action(new RegExp('^btn', 'i'), async ({ body, ack, say }) => {
    let user = users[body.user.id];
    let actionId = body.actions[0].action_id; // actions array? how can there be more than one in there?
    let value = body.actions[0].value;
    console.log("user:", user.displayName, "actionId:", actionId, "value:", value);
    await ack();
    await say(`<@${body.user.id}> clicked the button`);
    // deactivate the buttons to avoid user being able to click on them later out of context? TODO
});

// INCOMING messages from Slack
slackApp.message(async ({ message, client, say }) => {
    let user = users[message.user];
    if (user && message.text.toLowerCase() === "reset") {
        schedule.cancelJob("reminder_" + user.user);
        users[message.user] = null;
        user = null;
    }
    if (!user) {
        await registerNewUser(message, client, say);
        return;
    }
    if (message.text === "dev") {
        await dev(message, say);
        return;
    }
    // let response = await dialog.handleMessage(user, message,
    //     () => schedule.rescheduleJob("reminder_" + user.user, buildRecurrenceRule(user.reminder.rule))
    // );
    if (response) await say(response);
});

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

// OUTGOING messages to Slack
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

(async () => {
    await slackApp.start();
    const TroiApiService = await import("troi-library");
    troiApi = new TroiApiService.default(config.TROI_API_URL, config.TROI_USERNAME, config.TROI_PASSWORD);
    await troiApi.initialize();
    console.log("Connection to the Troi API is initialized");
    console.log("BleibTroy is running");
})();
