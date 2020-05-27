const state = require('../state.js');

module.exports = class Login extends require('../lib/handler.js') {
    handle(payload, client) {
        if (!client || payload.password !== process.env.PASSWORD) {
            return false;
        }
        let name = payload.name.replace(/<[^>]+>/g, '').substr(0, 12), player = state.players[name];
        if (player && player.active) {
            return '';
        }
        client.register(name);
        return name;
    }
};
