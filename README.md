# 🤖 ⏳ BleibTroy
Slack bot to help you fill out Troi. Uses the [Bolt](https://github.com/SlackAPI/bolt-js) framework and the [Troi API](https://v2.troi.dev/).

#### 👉 Also check out our other in-house self-built client for Troi: [Achill](https://github.com/digitalservice4germany/achill)

*The first setup step both developers and users have to do. The two later ones are for developers only:*

## Setup Troi

Two things need to happen in your Troi account (it might already be set up correctly):
- your account needs write-access to the Troi-API, Lisa S. can make that happen as a Troi admin (test: if you can log into Achill you're good)
- you need to mark your project(s) as favourite, only those will be accessible within Achill and BleibTroy:

![Troi desk screenshot](https://user-images.githubusercontent.com/5141792/167609943-a83b3018-3e06-4a7e-8584-003531e56cbc.png)


## Setup the Slack app at api.slack.com

The following steps for setting up the Slack app are adapted from [this](https://slack.dev/bolt-js/tutorial/getting-started) tutorial. You need admin rights in your Slack workspace.

- *Create New App* on [api.slack.com/apps](https://api.slack.com/apps) --> *From scratch*
- On the *Basic Information* page you land, the **Signing Secret** under *App Credentials* is the `SIGNING_SECRET` we need
- *OAuth & Permissions* --> *Bot Token Scopes* --> click *Add an OAuth Scope* --> `chat:write`, `im:history`, `users:read`, `users:read.email`
- Scroll up to *OAuth Tokens for Your Workspace* and click *Install to Workspace*
- After that, a **Bot User OAuth Token** gets generated, that's the `BOT_USER_OAUTH_TOKEN` we need
- Under *Socket Mode* (left sidebar) turn on *Enable Socket Mode*, here you create the `SOCKET_MODE_TOKEN`
- Under *Event Subscriptions* (left sidebar) turn on *Enable Events* and add the *Bot User Events* `message.im`
- Under *App Home* (left sidebar) show bot as always online if you want to and set the checkmark below the turned on *Messages Tab* to active
- Under *App Manifest* (left sidebar) set `messages_tab_enabled` to `true` (as seen [here](https://stackoverflow.com/a/69937581)) --> *Save Changes*
- If you make changes to scopes/permissions etc., reinstall the your app to the Workspace (under *Basic Information*, *Install your app*)

## Setup the code locally

```js
npm i
```

## Run

```js
export TROI_API_URL=... // TODO
export BOT_USER_OAUTH_TOKEN=...
export SIGNING_SECRET=...
export SOCKET_MODE_TOKEN=...
node app.js
```
