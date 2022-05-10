const { App } = require('@slack/bolt');
const Bree = require('bree');
const md5 = require("crypto-js/md5");
const fetch = require('node-fetch');

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

const baseUrl = "https://digitalservice.troi.software/api/v2/rest";
let userName = "";
let password = "";
let passwordMd5 = md5(password);
let authHeader = {
    Authorization: "Basic " + btoa(`${userName}:${passwordMd5}`),
};

async function makeRequest(options) {
    const defaultOptions = {
        method: "get",
        params: undefined,
        headers: {},
        body: undefined,
    };
    options = { ...defaultOptions, ...options };
    const { url, method, params, headers, body } = options;
    const requestUrl = `${baseUrl}${url}${
        params ? `?${new URLSearchParams(params)}` : ""
    }`;
    const requestOptions = {
        method: method,
        headers: { ...authHeader, ...headers },
        body: body,
    };
    // console.debug("Requesting", requestUrl, requestOptions);
    const response = await fetch(requestUrl, requestOptions);
    if ([401, 403].includes(response.status)) {
        console.log("AuthenticationFailed");
    }
    const responseObjects = await response.json();
    if (!("predicate" in options)) {
        return responseObjects;
    }
    for (const responseObject of responseObjects) {
        if (options.predicate(responseObject)) {
            return responseObject;
        }
    }
    console.log("predicate provided, but no responseObject fulfills it");
}

(async () => {
    const client = await makeRequest({
        url: "/clients",
        predicate: (obj) => obj.Name === "DigitalService4Germany GmbH",
    });
    const clientId = client.Id;
    const employees = await makeRequest({
        url: "/employees",
        params: {
            clientId: clientId,
            employeeLoginName: userName,
        },
    });
    const employeeId = employees[0].Id;
    console.log(clientId, employeeId);

    await app.start();
    bree.start();
    // await postMessage();
    console.log('BleibTroy is running');
})();
