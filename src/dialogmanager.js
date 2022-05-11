
exports.handleMessage = async(user, msg) => {
    let parts = msg.text.split(' ');
    switch(parts[0]) {
        case "username":
            user.troi.username = parts[1];
            return "Thanks, username saved";
        case "password":
            user.troi.password = parts[1];
            return "Thanks, password saved";
        default:
            return "Got the message, thanks"; // say(`Hey there <@${message.user}>!`)
    }
}
