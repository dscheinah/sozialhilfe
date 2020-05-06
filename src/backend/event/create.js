const state = require('../state.js');

module.exports = class Create extends require('../lib/handler.js') {
    broadcast(payload, client) {
        if (!client || !client.player) {
            return false;
        }
        return state.createInsurance(client.player.name, payload);
    }
};
