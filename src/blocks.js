
exports.welcome_text = name => {
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
                "Alright, please make your choice (you can always change this later on) :drum_with_drumsticks:"
        }
    }
}

exports.welcome_buttons = () => {
    return {
        "type": "actions",
        "elements": [
            {
                "type": "button",
                "text": {
                    "type": "plain_text",
                    "text": "Both reminders and booking",
                },
                style: "primary",
                "action_id": "btn_both"
            },
            {
                "type": "button",
                "text": {
                    "type": "plain_text",
                    "text": "Only reminders",
                },
                "action_id": "btn_reminders"
            },
            {
                "type": "button",
                "text": {
                    "type": "plain_text",
                    "text": "Only booking",
                },
                "action_id": "btn_booking"
            }
        ]
    }
}
