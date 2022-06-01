
exports.welcome_text_short = "Welcome! Choose how to use BleibTroy.";

exports.welcome_text = (name, btnChoice) => {
    return {
        "type": "section",
        "text": {
            "type": "mrkdwn",
            "text": "Hey " + name + " :wave: nice to meet you! Allow me to introduce " +
                "myself. I am *BleibTroy*, your personal time booking assistant :robot_face:" +
                ":hourglass_flowing_sand: I am sure we will have a great time together. But first things first, " +
                "let's find out how you are planning on using me. I can do two things for you:\n• send you " +
                "reminders to book your time :bell:\n• let you actually book time right here, and I'll send " +
                "it to Troi for you :writing_hand:\nNote that you can always also book time directly in Troi " +
                "or in our other in-house tool <https://track-your-time.dev.ds4g.net/|track-your-time>. " +
                "Alright, please make your choice (you can always change this later on) :drum_with_drumsticks:" +
                (btnChoice ? "\n\n :point_right:  You chose: *" + btnIdToText[btnChoice] + "*" : "")
        }
    }
}

const btnIdToText = {
    btn_both: "Both reminders and booking",
    btn_reminders: "Only reminders",
    btn_booking: "Only booking",
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
    return {
        "type": "actions",
        "elements": [
            buildBtnElement("btn_both", "primary"),
            buildBtnElement("btn_reminders"),
            buildBtnElement("btn_booking")
        ]
    }
}
