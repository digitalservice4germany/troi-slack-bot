const xstate = require("xstate");
const { users, registerNewUser } = require("./users");
const { welcome_text, welcome_buttons } = require("./blocks");

exports.handleMessage = async (message, client, say) => {
    let user = users[message.user];
    if (!user) user = await registerNewUser(message, client, say);
    startMachine(user, say, { type: "message", content: message });
    /*if (user && message.text.toLowerCase() === "reset") {
        schedule.cancelJob("reminder_" + user.user);
        users[message.user] = null;
        user = null;
    }
    let response = await dialog.handleMessage(user, message,
        () => schedule.rescheduleJob("reminder_" + user.user, buildRecurrenceRule(user.reminder.rule))
    );
    if (response) await say(response);*/
}

exports.handleButtonResponse = async (body, ack, say, client) => {
    let user = users[body.user.id];
    let actionId = body.actions[0].action_id; // actions array? how can there be more than one in there?
    let value = body.actions[0].value;
    console.log("user:", user.displayName, "actionId:", actionId, "value:", value);
    await ack();
    startMachine(user, say, { type: "button-response", content: body, client: client });
    // deactivate the buttons to avoid user being able to click on them later out of context? TODO
}

exports.handleAppHomeOpenedEvent = async (event, client, say) => {
    if (users[event.user]) return;
    let user = await registerNewUser(event, client, say);
    startMachine(user, say);
}

const startMachine = (user, say, payload) => {
    const service = xstate.interpret(machine.withContext({ user: user, say: say, payload: payload }))
        .onTransition((state) => {
            console.log("transition to: ", state.value);
        })
        .start(user.state.current);
    service.send("NEXT");
}

const machine = xstate.createMachine({
    id: "toggle",
    initial: "init",
    states: {
        init: { on: { NEXT: "welcome" } },
        welcome: {
            entry:
                context => {
                    console.log("in the WELCOME state with user " + context.user.displayName);
                    context.say({
                        blocks: [
                            welcome_text(context.user.displayName),
                            welcome_buttons()
                        ],
                        text: "Welcome! Choose how to use BleibTroy."
                    }).then(() => context.user.state.current = "welcome");
                },
            on: {
                NEXT: {
                    target: "setup"
                }
            }
        },
        setup: {
            entry:
                context => {
                    console.log("in the SETUP state with user " + context.user.displayName);

                    let btnChoice = context.payload.content.actions[0].action_id;
                    console.log("button clicked:", btnChoice);
                    // TODO

                    context.payload.client.chat.update({
                        channel: context.user.channel,
                        ts: context.payload.content.message.ts,
                        text: "updated message", // TODO
                        blocks: []
                    }).then(() => console.log("Message updated"));
                },
            on: {
                NEXT: [
                    {
                        target: "troi_setup",
                        cond: () => { return false }
                    },
                    {
                        target: "reminder_setup"
                    }
                ]
            }
        },
        troi_setup: {},
        reminder_setup: {}
    }
});

