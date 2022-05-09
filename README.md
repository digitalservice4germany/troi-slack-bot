# 🤖 ⏳ Troi Slack Bot
Slack bot to help you fill out Troi.
Uses the [Bolt](https://github.com/SlackAPI/bolt-js) framework.

## Setup the Slack app at api.slack.com

The following steps for setting up the Slack app are adapted from [this](https://slack.dev/bolt-js/tutorial/getting-started) tutorial. You need admin rights in your Slack workspace.

- *Create New App* on [api.slack.com/apps](https://api.slack.com/apps) --> *From scratch*
- On the *Basic Information* page you land, the **Signing Secret** under *App Credentials* is the `SIGNING_SECRET` we need
- *OAuth & Permissions* --> *Bot Token Scopes* --> click *Add an OAuth Scope* --> `chat:write`
- Scroll up to *OAuth Tokens for Your Workspace* and click *Install to Workspace*
- After that, a **Bot User OAuth Token** gets generated, that's the `BOT_USER_OAUTH_TOKEN` we need
- Under *Socket Mode* (left sidebar) turn on *Enable Socket Mode*, here you create the `SOCKET_MODE_TOKEN`
- Under *Event Subscriptions* (left sidebar) turn on *Enable Events* and add the *Bot User Events* `message.im` (also *app_home_opened* if you want to react to that somehow)
- Under *App Home* (left sidebar) show bot as always online if you want to and turn on *Home Tab* and set the checkmark below the turned on *Messages Tab* to active
- Under *App Manifest* (left sidebar) set `messages_tab_enabled` to `true` (as seen [here](https://stackoverflow.com/a/69937581)) --> *Save Changes*
- If you make changes to scopes/permissions etc., reinstall the your app to the Workspace (under *Basic Information*, *Install your app*)

## Setup the code locally

```js
npm i
```

## Run

```js
export BOT_USER_OAUTH_TOKEN=...
export SIGNING_SECRET=...
export SOCKET_MODE_TOKEN=...
node app.js
```
