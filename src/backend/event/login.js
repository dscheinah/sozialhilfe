module.exports = class Login extends require('../lib/handler.js') {
    handle(payload, client) {
        if (client && payload.password === process.env.PASSWORD) {
            let name = payload.name.replace(/<[^>]+>/g, '');
            client.register(name.substr(0, 12));
            return name;
        }
        return '';
    }
};
