const state = require('../state.js');

module.exports = class Bid extends require('../lib/handler.js') {
    broadcast(payload, client) {
        if (!client || !client.player || !state.bid) {
            return;
        }
        if (state.addBid(client.player.name, payload)) {
            state.players[state.bid.player].wait(state.waitTimeout);
            return {
                player: client.player.name,
                bid: state.bid,
                bids: state.getBestBids(),
            };
        }
        return false;
    }
};
