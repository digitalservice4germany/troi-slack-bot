// WELCOME

exports.welcome_text_short = "Welcome! Choose how to use BleibTroy.";

exports.welcome_text = (name, btnChoice) => {
    return [{
        "type": "section",
        "text": {
            "type": "mrkdwn",
            "text": "Hey " + name + " :wave: nice to meet you! Allow me to introduce " +
                "myself. I am *BleibTroy*, your personal time booking assistant :robot_face:" +
                ":hourglass_flowing_sand: I am sure we will have a great time together. But first things first, " +
                "let's find out how you are planning on using me. I can do two things for you:\n\n• send you " +
                "reminders to book your time :bell:\n• let you actually book time right here, and I'll send " +
                "it to Troi for you :writing_hand:\n\nNote that you can always also book time directly in Troi " +
                "or in our other in-house tool <https://track-your-time.dev.ds4g.net/|track-your-time>. " +
                "Alright, please make your choice (you can always change this later on) :drum_with_drumsticks:" +
                (btnChoice ? "\n\n :point_right:  You chose: *" + btnIdToText[btnChoice] + "*" : "")
        }
    }]
}

const btnIdToText = {
    btn_reminders_and_booking: "Both reminders and booking",
    btn_only_reminders: "Only reminders",
    btn_only_booking: "Only booking",
}

const buildBtnElement = (btnId, style) => {
    let el = {
        "type": "button",
        "text": {
            "type": "plain_text",
            "text": btnIdToText[btnId],
        },
        "action_id": btnId
    };
    if (style) el.style = style;
    return el;
}

exports.welcome_buttons = () => {
    return [{
        "type": "actions",
        "elements": [
            buildBtnElement("btn_reminders_and_booking", "primary"),
            buildBtnElement("btn_only_reminders"),
            buildBtnElement("btn_only_booking")
        ]
    }]
}

// REMINDER

exports.reminder_setup_text_short = "Set up reminders"

exports.reminder_setup_text = choice => {
    return [{
        "type": "section",
        "text": {
            "type": "mrkdwn",
            "text": "Let's configure your reminders:" +
            (choice ? "\n\n :point_right:  You chose: *" + choice + "*" : "")
        }
    }]
}

const defaultTime = "17:00";

exports.daysDef = {
    Monday: {
        default: true,
        index: 1
    },
    Tuesday: {
        default: true,
        index: 2
    },
    Wednesday: {
        default: true,
        index: 3
    },
    Thursday: {
        default: true,
        index: 4
    },
    Friday: {
        default: true,
        index: 5
    },
    Saturday: {
        default: false,
        index: 6
    },
    Sunday: {
        default: false,
        index: 0
    }
}

const buildCheckboxElement = day => {
    return {
        "text": {
            "type": "plain_text",
            "text": day
        },
        "value": day
    }
}

exports.radioButtonValueToLabel = {
    english_and_german: "English and German",
    only_english: "Only English"
}

exports.reminder_setup_input_elements = () => {
    let elements = [
        {
            "type": "input",
            "element": {
                "type": "timepicker",
                "initial_time": defaultTime,
                "placeholder": {
                    "type": "plain_text",
                    "text": "Select time"
                },
                "action_id": "timepicker_reminder_setup"
            },
            "label": {
                "type": "plain_text",
                "text": "Remind me at"
            }
        },
        {
            "type": "input",
            "element": {
                "type": "checkboxes",
                "initial_options": [],
                "options": [],
                "action_id": "checkboxes_reminder_setup"
            },
            "label": {
                "type": "plain_text",
                "text": "on these days:"
            }
        },
        {
            "type": "input",
            "element": {
                "type": "radio_buttons",
                "initial_option": {
                    "text": {
                        "type": "plain_text",
                        "text": this.radioButtonValueToLabel.english_and_german
                    },
                    "value": "english_and_german"
                },
                "options": [
                    {
                        "text": {
                            "type": "plain_text",
                            "text": this.radioButtonValueToLabel.english_and_german
                        },
                        "value": "english_and_german"
                    },
                    {
                        "text": {
                            "type": "plain_text",
                            "text": this.radioButtonValueToLabel.only_english
                        },
                        "value": "only_english"
                    }
                ],
                "action_id": "radiobuttons_reminder_language"
            },
            "label": {
                "type": "plain_text",
                "text": "Language of reminders"
            }
        },
        {
            "type": "actions",
            "elements": [
                {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": "Save"
                    },
                    "style": "primary",
                    "action_id": "btn_save_reminder_setup"
                }
            ]
        }
    ];

    for (let key of Object.keys(this.daysDef)) {
        elements[1].element.options.push(buildCheckboxElement(key))
        if (this.daysDef[key].default) elements[1].element.initial_options.push(buildCheckboxElement(key))
    }

    return elements;
}

// TROI

exports.troi_setup_text_short = "Set up Troi"

exports.troi_setup_text = () => {
    return [{
        "type": "section",
        "text": {
            "type": "mrkdwn",
            "text": "Alright, there is just one thing I need your help with before you can start booking " +
                "your time in Troi with me. And that is to find out which so called _position(s)_ you are booking onto. I need " +
                "the IDs of those. Unfortunately I can't access positions you might have marked as favorites directly in Troi. " +
                "I can guide you through a search process to identify those positions. However, before we resort to " +
                " that there is two things we can try that are a bit faster: " +
                "\n\n• I can check on which positions you booked previously" +
                "\n• You can see a position ID when hovering the mouse over a position title in the " +
                "<https://track-your-time.dev.ds4g.net/|track-your-time> tool or under _Stundenerfassung_ in Troi (it " +
                "says _Suchnummer: K123_ --> _123_ is the position ID in this case)"
        }
    }]
}

exports.troi_setup_findings = user => {
    return [{
        "type": "section",
        "text": {
            "type": "mrkdwn",
            "text": "For your Troi username _" + user.troi.username + "_ I found..." // TODO
        }
    }]
}
