const state = require('../state.js');

module.exports = class Sell extends require('../lib/handler.js') {
    broadcast(payload, client) {
        if (!client || !client.player || !client.player.houses[payload]) {
            return;
        }
        if (state.startBid(client.player.name, payload)) {
            state.getPreparedPlayers().forEach(player => player.wait(state.waitTimeout));
            return {
                player: client.player.name,
                house: client.player.houses[payload],
            };
        }
    }
};
