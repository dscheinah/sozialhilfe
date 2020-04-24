module.exports = class Login extends require('../lib/handler.js') {
    handle(payload, client) {
        if (client && payload.password === process.env.PASSWORD) {
            client.register(payload.name);
            return true;
        }
        return false;
    }
};
