module.exports = class Login extends require('../lib/handler.js') {
    handle(payload, client) {
        if (client && payload.password === process.env.PASSWORD) {
            client.register(payload.name.substr(0, 20));
            return true;
        }
        return false;
    }
};
