const state = require('../state.js');

module.exports = class Join extends require('../lib/handler.js') {
    handle(name, client) {
        if (!client || !client.player) {
            return;
        }
        state.setInsurance(client.player.name, name);
    }

    events() {
        return ['insurances', 'players', 'statistics'];
    }
};
