const state = require('../state.js');

module.exports = class Join extends require('../lib/handler.js') {
    handle(payload, client) {
        if (!client || !client.player) {
            return;
        }
        state.removeFromInsurance(client.player.name);
    }

    events() {
        return ['insurances', 'players', 'statistics'];
    }
};
