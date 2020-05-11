const state = require('../state.js');

module.exports = class Contract extends require('../lib/handler.js') {
    broadcast(card, client) {
        if (!client || !client.player) {
            return false;
        }
        card = parseInt(card);
        return {
            player: client.player.name,
            type: state.addContract(client.player.name, card),
            card: card,
        };
    }
};
