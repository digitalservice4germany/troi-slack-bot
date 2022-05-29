const xstate = require("xstate");
const { users, registerNewUser } = require("./users");

exports.handleMessage = async (message, client, say) => {
    let user = users[message.user];
    if (!user) user = await registerNewUser(message, client, say);
    startMachine(user);
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

exports.handleButtonResponse = async (body, ack, say) => {
    let user = users[body.user.id];
    let actionId = body.actions[0].action_id; // actions array? how can there be more than one in there?
    let value = body.actions[0].value;
    console.log("user:", user.displayName, "actionId:", actionId, "value:", value);
    await ack();
    startMachine(user);
    // deactivate the buttons to avoid user being able to click on them later out of context? TODO
}

exports.handleAppHomeOpenedEvent = async (event, client, say) => {
    if (users[event.user]) return;
    let user = await registerNewUser(event, client, say);
    startMachine(user);
}

const startMachine = user => {
    const service = xstate.interpret(machine.withContext({ user: user })) // message: message, client: client, say: say
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
            entry: [
                (context, event) => {
                    console.log("in the welcome state with user " + context.user.displayName);
                }
            ],
            on: {
                NEXT: {
                    target: "setup"
                }
            }
        },
        setup: {
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

