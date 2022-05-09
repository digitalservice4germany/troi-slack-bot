# 🤖 ⏳ Troi Slack Bot
Slack bot to help you fill out Troi.

Follow [this](https://slack.dev/bolt-js/tutorial/getting-started) tutorial for the required Setup in Slack. You need admin rights in your Slack workspace. To be able to chat directly with the bot in Slack, the manifest has to be edited like [this](https://stackoverflow.com/a/69937581). Uses the [Bolt](https://github.com/SlackAPI/bolt-js) framework.

## Setup

```js
npm i
```

## Run

```js
export SLACK_BOT_TOKEN=...
export SLACK_SIGNING_SECRET=...
export APP_TOKEN=...
node app.js
```
