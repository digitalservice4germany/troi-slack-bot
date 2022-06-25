// WELCOME

exports.welcome_text_short = "Welcome! Choose how to use BleibTroy.";

exports.welcome_text_intro = name => {
    return "Hey " + name + " :wave: nice to meet you! Allow me to introduce " +
        "myself. I am *BleibTroy*, your personal time booking assistant :robot_face: :hourglass_flowing_sand:";
}

exports.welcome_text_no_troi_username_error = username => {
    return "Oh no! :scream_cat: I could not find you on Troi with the username _" + username + "_ :zap: That could mean two things:" +
        "\n\n• You don't have an account in Troi. Maybe because you don't have to book time? If you think that's not " +
        "correct, please contact Lisa S." +
        "\n• You have a different username than the one I assumed. If that is the case, please raise an issue " +
        "<https://github.com/digitalservice4germany/troi-slack-bot/issues|here>." +
        "\n\nUnfortunately this means I won't be very useful to you :cry: You can of course use my reminder " +
        "function if that is helpful somehow :shrug:";
}

exports.welcome_text = onlyRemindersPossible => {
    if (onlyRemindersPossible) {
        return "Would you like to set up reminders now? :bell:";
    }
    return "But first things first, let's find out how you are planning on using me. " +
        "I can do two things for you:" +
        "\n\n• send you regular reminders to book your time :bell:" +
        "\n• let you book time right here from Slack :writing_hand:" +
        "\n\nNote that you can always also book time directly in Troi " +
        "or in our other in-house tool <https://track-your-time.dev.ds4g.net/|track-your-time>. " +
        "\nAlright, Please make your choice (you can always change this later on) :ballot_box_with_ballot: :drum_with_drumsticks:";
}

exports.welcome_text_post_choice = btnChoice => {
    return [{
        "type": "section",
        "text": {
            "type": "mrkdwn",
            "text": "\n\n:point_right: You chose: *" + btnIdToText[btnChoice] + "*"
        }
    }];
}

const btnIdToText = {
    btn_reminders_and_booking: "Both",
    btn_only_reminders: "Only reminders",
    btn_only_booking: "Only booking",
    btn_cancel: "No thanks, get me out of here"
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

exports.welcome_buttons = onlyRemindersPossible => {
    let buttonBlock = {
        "type": "actions",
        "elements": []
    };
    if (!onlyRemindersPossible) {
        buttonBlock.elements.push(buildBtnElement("btn_reminders_and_booking", "primary"));
        buttonBlock.elements.push(buildBtnElement("btn_only_booking"));
    }
    buttonBlock.elements.push(buildBtnElement("btn_only_reminders"));
    buttonBlock.elements.push(buildBtnElement("btn_cancel"));
    return [buttonBlock];
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

    const buildCheckboxElement = day => {
        return {
            "text": {
                "type": "plain_text",
                "text": day
            },
            "value": day
        }
    }

    for (let key of Object.keys(this.daysDef)) {
        elements[1].element.options.push(buildCheckboxElement(key))
        if (this.daysDef[key].default) elements[1].element.initial_options.push(buildCheckboxElement(key))
    }

    return elements;
}

// TROI

exports.troi_setup_text_short = "Set up Troi"

exports.troi_setup_text = () => {
    return "Alright, there is just one thing I need your help with before you can start booking your time in Troi " +
        "with me. And that is to find out which so called _position(s)_ you are booking onto. I need the IDs of those. " +
        "Unfortunately I can't access positions you might have marked as favorites directly in Troi. " +
        "I can guide you through a search process to identify those positions. However, before we resort to " +
        "that there is two things we can try that are a bit faster: " +
        "\n\n• I will check on which positions you booked previously" +
        "\n• You can see a position ID when hovering the mouse over a position title in the " +
        "<https://track-your-time.dev.ds4g.net/|track-your-time> tool or under _Stundenerfassung_ in Troi (it " +
        "says _Suchnummer: K123_ --> _123_ is the position ID in this case)";
}

const buildPreviousCPsChoiceBlock = previousCPs => {
    let previousCPsChoiceBlock = {
        "type": "input",
        "element": {
            "type": "checkboxes",
            "initial_options": [],
            "options": [],
            "action_id": "checkboxes_troi_setup_previous_cps"
        },
        "label": {
            "type": "plain_text",
            "text": "Which of your previously used booking positions are you still booking time on:"
        }
    };

    const buildCheckboxElement = (text, value) => {
        return {
            "text": {
                "type": "plain_text",
                "text": text
            },
            "value": value
        }
    }

    for (let cp of previousCPs) {
        let value = "cpID_" + cp.id;
        let text = "Position ID " + cp.id + ": " + cp.path;
        previousCPsChoiceBlock.element.options.push(buildCheckboxElement(text, value));
        previousCPsChoiceBlock.element.initial_options.push(buildCheckboxElement(text, value));
    }

    return previousCPsChoiceBlock;
}

exports.troi_setup_findings = previousCPs => {
    let blocks = [];

    // PREVIOUS CPs

    blocks.push({
        "type": "section",
        "text": {
            "type": "mrkdwn",
            "text": ""
        }
    });

    if (previousCPs.length === 0) {
        blocks[0].text.text = ":mag: :shrug: I couldn't find any positions that you previously booked on.";
    } else {
        blocks[0].text.text = ":mag: :thumbsup: I found "
            + (previousCPs.length > 1 ? previousCPs.length + " positions" : "one position")
            + " that you previously booked on.";
        blocks.push(buildPreviousCPsChoiceBlock(previousCPs));
    }

    // NEW CPs by manually providing cpIDs

    blocks.push({
        "type": "input",
        "dispatch_action": true,
        "element": {
            "type": "plain_text_input",
            "action_id": "textinput_additional_cpIDs",
            "dispatch_action_config": {
                // I wish this wasn't necessary on by-character-level, but the alternative by enter can't be expected from the user
                "trigger_actions_on": ["on_character_entered"]
            }
        },
        "label": {
            "type": "plain_text",
            "text": "Do you know the IDs of other positions you want to book time on? Add them here comma-separated (e.g. 16,42)"
        }
    });

    // SEARCH REQUIRED

    const buildOption = text => {
      return {
          "text": {
              "type": "plain_text",
              "text": text
          },
          "value": "troi_search_" + text
      }
    };

    let searchBlock = {
        "type": "input",
        "element": {
            "type": "radio_buttons",
            "initial_option": {},
            "options": [],
            "action_id": "radiobuttons_search_cpIDs"
        },
        "label": {
            "type": "plain_text",
            "text": "Do you need help identifying your (further) booking position(s)? I can help with that."
        }
    };

    searchBlock.element.options.push(buildOption("Yes"));
    searchBlock.element.options.push(buildOption("No"));
    searchBlock.element.initial_option = buildOption("No");
    blocks.push(searchBlock);

    // SAVE BUTTON

    blocks.push({
        "type": "actions",
        "elements": [
            {
                "type": "button",
                "text": {
                    "type": "plain_text",
                    "text": "Save"
                },
                "style": "primary",
                "action_id": "btn_save_troi_setup"
            }
        ]
    });

    return blocks;
}

exports.troi_setup_cp_choice = choice => {
    return [{
        "type": "section",
        "text": {
            "type": "mrkdwn",
            "text": ":point_right: You chose: " + choice
        }
    }]
}
