const state = require('../state.js');

module.exports = class Confirm extends require('../lib/handler.js') {
    broadcast(payload, client) {
        if (!client || !client.player || !state.bid || state.bid.player !== client.player.name) {
            return;
        }
        state.confirmBid(payload);
        return true;
    }
};
