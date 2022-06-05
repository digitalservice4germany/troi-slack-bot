const xstate = require("xstate");
const { users, registerNewUser } = require("./users");
const { welcome_text, welcome_buttons, welcome_text_short,
    reminder_setup_text_short, reminder_setup_text, reminder_setup_input_elements } = require("./blocks");

exports.handleMessage = async (message, say, client) => {
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

exports.handleActionResponse = async (type, body, ack, say, client) => {
    let user = users[body.user.id];
    await ack();
    startMachine(user, say, { type: type, content: body, client: client });
}

exports.handleAppHomeOpenedEvent = async (event, say, client) => {
    if (users[event.user]) return;
    let user = await registerNewUser(event, client, say);
    startMachine(user, say);
}

const startMachine = (user, say, payload) => {
    let service = null;
    const getService = () => { return service; }
    // noinspection JSCheckFunctionSignatures
    service = xstate.interpret(machine.withContext({ user: user, say: say, payload: payload, getService }))
        .onTransition((state) => {
            console.log("transition to -->", state.value);
        })
        .start(user.state.current);
    service.send("NEXT");
}

const machine = xstate.createMachine({
    id: "BleibTroyStateMachine",
    initial: "init",
    states: {
        init: { on: { NEXT: "welcome" } },
        welcome: {
            entry:
                context => {
                    console.log("in the WELCOME state with user " + context.user.displayName);
                    context.say({
                        blocks: [
                            ...welcome_text(context.user.displayName),
                            ...welcome_buttons()
                        ],
                        text: welcome_text_short
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
                    if (context.payload.type !== "button-response") {
                        context.say("Please click a button first")
                        return;
                    }

                    let btnChoice = context.payload.content.actions[0].action_id;
                    context.user.state.choices.base_usage = btnChoice.substring(4);

                    context.payload.client.chat.update({
                        channel: context.user.channel,
                        ts: context.payload.content.message.ts,
                        blocks: [
                            ...welcome_text(context.user.displayName, btnChoice)
                        ],
                        text: welcome_text_short
                    }).then(() => {
                        context.user.state.current = "setup"
                        context.getService().send("NEXT"); // is that good style? Don't know how else to trigger the transition
                    })
                },
            on: {
                NEXT: [
                    {
                        target: "troi_setup",
                        cond: context => { return context.user.state.choices.base_usage === "only_booking" }
                    },
                    {
                        target: "reminder_setup",
                        // in case of reminders_and_booking we do reminder first
                        cond: context => { return context.user.state.choices.base_usage !== "only_booking" }
                    }
                ]
            }
        },
        troi_setup: {},
        reminder_setup:  {
            entry:
                context => {
                    context.say({
                        blocks: [
                            ...reminder_setup_text(),
                            ...reminder_setup_input_elements()
                        ],
                        text: reminder_setup_text_short
                    }).then(() => {
                        context.user.state.current = "reminder_setup";
                        context.user.state.reminder_staging.activeDays = "Monday,Tuesday,Wednesday,Thursday,Friday";
                        context.user.state.reminder_staging.time = "17:00";
                    });
                },
            on: {
                NEXT: {
                    target: "reminder_setup_receive_settings"
                }
            }
        },
        reminder_setup_receive_settings: {
            entry:
                context => {
                    switch (context.payload.type) {
                        case "button-response":
                            console.log("reminder_staging", context.user.state.reminder_staging)

                            context.payload.client.chat.update({
                                channel: context.user.channel,
                                ts: context.payload.content.message.ts,
                                blocks: [
                                    ...reminder_setup_text(JSON.stringify(context.user.state.reminder_staging)) // TODO
                                ],
                                text: reminder_setup_text_short
                            }).then(() => {
                                // context.user.state.current = ""
                            })

                            // write to user.reminder TODO

                            break;
                        case "checkbox-response":
                            let str = "";
                            for (let dayEl of context.payload.content.actions[0].selected_options) {
                                str += "," + dayEl.value;
                            }
                            context.user.state.reminder_staging.activeDays = str.substring(1);
                            break;
                        case "timepicker-response":
                            context.user.state.reminder_staging.time = context.payload.content.actions[0].selected_time;
                            break;
                        case "radiobutton-response":
                            context.user.state.reminder_staging.lang = context.payload.content.actions[0].selected_option.value;
                            break;
                        default:
                            context.say("Please click save first")
                            return;
                    }
                },
            on: {
                NEXT: {
                    target: "reminder_setup_receive_settings"
                }
            }
        }
    }
});

