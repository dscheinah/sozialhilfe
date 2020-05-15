const state = require('../state.js');

module.exports = class Accept extends require('../lib/handler.js') {
    handle(payload, client) {
        if (!client || !client.player || client.player.name !== state.donation.player) {
            return;
        }
        if (payload) {
            state.acceptDonation();
        }
    }
};
