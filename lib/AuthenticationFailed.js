
module.exports = class AuthenticationFailed extends Error {
    constructor() {
        super("Troi Authentication Failed");
        this.name = this.constructor.name;
    }
}
