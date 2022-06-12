const xstate = require("xstate");
const schedule = require("node-schedule");
const { users, registerNewUser } = require("./users");
const { welcome_text, welcome_buttons, welcome_text_short,
    reminder_setup_text_short, reminder_setup_text, reminder_setup_input_elements, radioButtonValueToLabel, daysDef,
    troi_setup_text, troi_setup_text_short, troi_setup_findings, troi_setup_no_username_error
} = require("./blocks");
const { buildRecurrenceRule, todayIsPublicHoliday, userSubmittedToday } = require("./util");
const { storeEmployeeId, fetchPreviousCalculationPositions } = require("./troi");
const config = require("../config.json");

exports.handleMessage = async (message, say, client) => {
    let user = users[message.user];
    if (user && message.text.toLowerCase() === "reset") {
        // schedule.cancelJob("reminder_" + user.user);
        users[message.user] = null;
        user = null;
    }
    if (!user) user = await registerNewUser(message, client, say);
    startMachine(user, say, { type: "message", content: message });
    // schedule.rescheduleJob("reminder_" + user.user, buildRecurrenceRule(user.reminder.rule))
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

        // --------------- INIT ---------------
        init: { on: { NEXT: "welcome" } },

        // --------------- WELCOME ---------------
        welcome: {
            entry:
                context => {
                    context.user.state.current = "welcome";
                    context.say({
                        blocks: [
                            ...welcome_text(context.user.displayName),
                            ...welcome_buttons()
                        ],
                        text: welcome_text_short
                    });
                },
            on: {
                NEXT: {
                    target: "setup"
                }
            }
        },

        // --------------- SETUP ---------------
        setup: {
            entry:
                context => {
                    context.user.state.current = "setup"
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

        // --------------- REMINDER_SETUP ---------------
        reminder_setup:  {
            entry:
                context => {
                    context.user.state.current = "reminder_setup";
                    context.say({
                        blocks: [
                            // use context.say without blocks for the text parts to use full width https://stackoverflow.com/a/58805625 TODO
                            ...reminder_setup_text(),
                            ...reminder_setup_input_elements()
                        ],
                        text: reminder_setup_text_short
                    }).then(() => {
                        context.user.state.reminder_staging.activeDays = "Monday,Tuesday,Wednesday,Thursday,Friday";
                        context.user.state.reminder_staging.time = "17:00";
                        context.user.state.reminder_staging.lang = "english_and_german";
                    });
                },
            on: {
                NEXT: {
                    target: "reminder_setup_receive_settings"
                }
            }
        },

        // --------------- REMINDER_SETUP_RECEIVE_SETTINGS ---------------
        reminder_setup_receive_settings: {
            entry:
                context => {
                    let user = context.user;
                    user.state.current = "reminder_setup_receive_settings"
                    switch (context.payload.type) {
                        case "button-response":
                            let choiceTxt = "";
                            let days = user.state.reminder_staging.activeDays.split(",");
                            for (let i = 0; i < days.length - 1; i++) {
                                choiceTxt += ", " + days[i];
                            }
                            choiceTxt = "Every " + choiceTxt.substring(2) + (days.length === 1 ? "" : " and ") + days[days.length - 1];
                            choiceTxt += " at " + user.state.reminder_staging.time + ".";
                            choiceTxt += " Language is set to: " + radioButtonValueToLabel[user.state.reminder_staging.lang] + ".";

                            context.payload.client.chat.update({
                                channel: user.channel,
                                ts: context.payload.content.message.ts,
                                blocks: [
                                    ...reminder_setup_text(choiceTxt)
                                ],
                                text: reminder_setup_text_short
                            }).then(() => {
                                user.reminder.active = true;
                                context.getService().send("NEXT");
                            })

                            let arr = [];
                            for (let day of days) {
                                arr.push(daysDef[day].index);
                            }
                            user.reminder.schedule.dayOfWeek = arr;
                            let timeParts = user.state.reminder_staging.time.split(":");
                            user.reminder.schedule.hour = timeParts[0];
                            user.reminder.schedule.minute = timeParts[1];
                            schedule.scheduleJob("reminder_" + user.id, buildRecurrenceRule(user.reminder.schedule), () => {
                                if (!user.reminder.active || todayIsPublicHoliday() || userSubmittedToday(user)) return;
                                context.payload.client.chat.postMessage({
                                    token: config.SLACK_BOT_USER_OAUTH_TOKEN,
                                    channel: user.channel,
                                    text: ":bell: Reminder to book time in Troi" // source from google spreadsheet TODO
                                })
                                    .then(() => console.log("Sent reminder to " + user.id))
                                    .catch(e => console.error(e))
                            });
                            user.language.deOk = user.state.reminder_staging.lang === "english_and_german";
                            user.state.reminder_staging = {};
                            break;
                        case "checkbox-response":
                            let str = "";
                            for (let dayEl of context.payload.content.actions[0].selected_options) {
                                str += "," + dayEl.value;
                            }
                            user.state.reminder_staging.activeDays = str.substring(1);
                            break;
                        case "timepicker-response":
                            user.state.reminder_staging.time = context.payload.content.actions[0].selected_time;
                            break;
                        case "radiobutton-response":
                            user.state.reminder_staging.lang = context.payload.content.actions[0].selected_option.value;
                            break;
                        default:
                            context.say("Please click save first")
                            return;
                    }
                },
            on: {
                NEXT: [
                    {
                        target: "reminder_setup_receive_settings",
                        cond: context => { return !context.user.reminder.active }
                    },
                    {
                        target: "troi_setup",
                        cond: context => { return context.user.reminder.active && context.user.state.choices.base_usage !== "only_reminders" }
                    },
                    {
                        target: "setup_done",
                        cond: context => { return context.user.reminder.active && context.user.state.choices.base_usage === "only_reminders" }
                    }
                ]
            }
        },

        // --------------- TROI_SETUP ---------------
        troi_setup: {
            entry:
                context => {
                    context.user.state.current = "troi_setup";

                    storeEmployeeId(context.user).then(() => {
                        if (!context.user.troi.employeeId) {
                            context.say({
                                text: troi_setup_no_username_error(context.user.troi.username),
                                unfurl_links: false
                            })
                            context.getService().send("NEXT");
                            return;
                        }

                        context.say(troi_setup_text());

                        fetchPreviousCalculationPositions(context.user).then(previousCPs => {
                            console.log("previousCPs", previousCPs)

                            context.say({
                                blocks: [
                                    ...troi_setup_findings(context.user)
                                ],
                                text: troi_setup_text_short
                            }).then(() => {});
                        });
                    });
                },
            on: {
                NEXT: [
                    {
                        target: "troi_setup_receive_settings",
                        cond: context => { return context.user.troi.employeeId }
                    },
                    {
                        target: "default_listening_state",
                        cond: context => { return !context.user.troi.employeeId }
                    },
                ]
            }
        },
        troi_setup_receive_settings: {
            entry:
                context => {
                    context.user.state.current = "troi_setup_receive_settings";
                },
            on: {
                NEXT: {
                    target: "troi_setup_receive_settings"
                }
            }
        },

        // --------------- SETUP_DONE ---------------
        setup_done: {
            entry:
                context => {
                    context.user.state.current = "setup_done"
                    context.say("Great, you are done with setting up things!")
                },
            on: {
                NEXT: {
                    target: "default_listening_state"
                }
            }
        },

        // --------------- DEFAULT_LISTENING_STATE ---------------
        default_listening_state: {
            entry:
                context => {
                    context.user.state.current = "default_listening_state"
                },
            on: {
                NEXT: {
                    target: "default_listening_state"
                }
            }
        }
    }
});

