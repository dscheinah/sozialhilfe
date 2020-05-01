const state = require('../state.js');

module.exports = class Save extends require('../lib/handler.js') {
    broadcast(cards, client) {
        if (!client || !client.player || !client.player.winner || !client.player.private) {
            return;
        }
        return {
            player: client.player.name,
            cards: state.save(cards),
        };
    }
};
