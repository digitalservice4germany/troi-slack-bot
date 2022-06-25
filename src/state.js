const xstate = require("xstate");
const schedule = require("node-schedule");
const { users, registerNewUser, deleteUser } = require("./users");
const { welcome_text, welcome_buttons, welcome_text_short, welcome_text_no_troi_username_error, welcome_text_post_choice,
    reminder_setup_text_short, reminder_setup_text, reminder_setup_input_elements, radioButtonValueToLabel, daysDef,
    troi_setup_text, troi_setup_text_short, troi_setup_findings, welcome_text_intro, troi_setup_cp_choice
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
                    context.say(welcome_text_intro(context.user.displayName));

                    const welcomeMsgs = onlyRemindersPossible => {
                        context.say(welcome_text(onlyRemindersPossible)).then(() => {
                            context.say({
                                blocks: [...welcome_buttons(onlyRemindersPossible)],
                                text: welcome_text_short
                            });
                        });
                    };

                    storeEmployeeId(context.user).then(() => {
                        let onlyRemindersPossible = context.user.troi.employeeId == null; // == catches also undefined, === would not
                        if (onlyRemindersPossible) {
                            context.say({
                                text: welcome_text_no_troi_username_error(context.user.troi.username),
                                unfurl_links: false
                            }).then(() => welcomeMsgs(onlyRemindersPossible));
                        } else {
                            welcomeMsgs(onlyRemindersPossible);
                        }
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
                        blocks: [...welcome_text_post_choice(btnChoice)],
                        text: welcome_text_short
                    }).then(() => {
                        if (btnChoice === "btn_cancel") {
                            deleteUser(context.user);
                            context.say("Ok, I scrubbed you from my memory  :floppy_disk: :recycle: Feel free to come back any time :wave:");
                            return;
                        }
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
                        case "timepicker-response":
                            user.state.reminder_staging.time = context.payload.content.actions[0].selected_time;
                            break;
                        case "checkbox-response":
                            let str = "";
                            for (let dayEl of context.payload.content.actions[0].selected_options) {
                                str += "," + dayEl.value;
                            }
                            user.state.reminder_staging.activeDays = str.substring(1);
                            break;
                        case "radiobutton-response":
                            user.state.reminder_staging.lang = context.payload.content.actions[0].selected_option.value;
                            break;
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
                    let user = context.user;
                    user.state.current = "troi_setup";
                    context.say(troi_setup_text());

                    fetchPreviousCalculationPositions(user).then(previousCPs => {
                        context.say({
                            blocks: [...troi_setup_findings(previousCPs)],
                            text: troi_setup_text_short
                        }).then(() => {
                            let str = "";
                            for (let cp of previousCPs) str += "," + cp.id;
                            user.state.troi_staging.previouslyUsedCPs = str.substring(1);
                            user.state.troi_staging.newCPsById = "";
                            user.state.troi_staging.doSearchCPs = false;
                            user.state.troi_staging.buttonWasClicked = false;
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

        // --------------- TROI_SETUP_RECEIVE_SETTINGS ---------------
        troi_setup_receive_settings: {
            entry:
                context => {
                    let user = context.user;
                    user.state.current = "troi_setup_receive_settings";
                    switch (context.payload.type) {
                        case "checkbox-response":
                            let str = "";
                            for (let cpEl of context.payload.content.actions[0].selected_options) {
                                str += "," + cpEl.value.substring(5);
                            }
                            user.state.troi_staging.previouslyUsedCPs = str.substring(1);
                            break;
                        case "textinput-response":
                            user.state.troi_staging.newCPsById = context.payload.content.actions[0].value;
                            break;
                        case "radiobutton-response":
                            user.state.troi_staging.doSearchCPs = context.payload.content.actions[0].selected_option.value === "troi_search_Yes";
                            break;
                        case "button-response":
                            user.state.troi_staging.buttonWasClicked = true;
                            let prevCPsRaw = user.state.troi_staging.previouslyUsedCPs;
                            let newCPsRaw = user.state.troi_staging.newCPsById;
                            let prevCPs = prevCPsRaw ? prevCPsRaw.split(",") : [];
                            let newCPs = newCPsRaw ? newCPsRaw.split(",") : [];
                            let choiceTxt = "";
                            if (prevCPs.length > 0 || newCPs.length > 0) {
                                choiceTxt = "\n*To book on the following position(s):* ";
                            }
                            if (prevCPs.length > 0) {
                                choiceTxt += "\n--> your previously used position" + (prevCPs.length > 1 ? "s" : "") + ": " + prevCPs;
                            }
                            if (newCPs.length > 0) {
                                choiceTxt += "\n--> the position" + (newCPs.length > 1 ? "s" : "") + " you added directly by Id" + ": " + newCPs;
                            }
                            [...prevCPs, ...newCPs].forEach(cpId => {
                                user.troi.positions.push({
                                    id: cpId,
                                    nickname: null
                                })
                            });
                            if (user.state.troi_staging.doSearchCPs) {
                                choiceTxt += "\n*To search for (more) position(s) in the next step.*";
                                user.state.troi_staging = {};
                                user.state.troi_staging.buttonWasClicked = true;
                                user.state.troi_staging.doSearchCPs = true; // flag for troi_setup_search_cps state
                            } else {
                                user.state.troi_staging = {};
                            }
                            if (!user.state.troi_staging.doSearchCPs && prevCPs.length === 0 && newCPs.length === 0) {
                                choiceTxt += "\n*You gave me no positions to work with unfortunately* :shrug:";
                                user.state.troi_staging.noCPs = true; // what else? TODO
                            }
                            context.payload.client.chat.update({
                                channel: user.channel,
                                ts: context.payload.content.message.ts,
                                blocks: [
                                    ...troi_setup_cp_choice(choiceTxt)
                                ],
                                text: troi_setup_text_short
                            }).then(() => context.getService().send("NEXT"))
                            break;
                        default:
                            context.say("Please click save first")
                            return;
                    }
                },
            on: {
                NEXT: [
                    {
                        target: "troi_setup_receive_settings",
                        cond: context => { return !context.user.state.troi_staging.buttonWasClicked}
                    },
                    {
                        target: "troi_setup_search_cps",
                        cond: context => { return context.user.state.troi_staging.buttonWasClicked && context.user.state.troi_staging.doSearchCPs }
                    },
                    {
                        target: "troi_setup_finalize",
                        cond: context => { return context.user.state.troi_staging.buttonWasClicked && !context.user.state.troi_staging.doSearchCPs && context.user.troi.positions.length > 1}
                    },
                    {
                        target: "setup_done",
                        cond: context => { return context.user.state.troi_staging.buttonWasClicked && !context.user.state.troi_staging.doSearchCPs && context.user.troi.positions.length === 1}
                    },
                ]
            }
        },

        // --------------- TROI_SETUP_SEARCH_CPS ---------------
        troi_setup_search_cps: {
            entry:
                context => {
                    context.user.state.current = "troi_setup_search_cps"
                    console.log("in troi_setup_search_cps")
                    // TODO
                },
            on: {
                NEXT: {
                    target: "setup_done"
                }
            }
        },

        // --------------- TROI_SETUP_FINALIZE ---------------
        troi_setup_finalize: {
            entry:
                context => {
                    context.user.state.current = "troi_setup_finalize"
                    console.log("in troi_setup_finalize")
                    // another search, give nicknames or done TODO

                    context.user.state.troi_staging = {};
                },
            on: {
                NEXT: {
                    target: "setup_done"
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

