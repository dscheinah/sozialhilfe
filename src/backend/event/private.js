const state = require('../state.js');

module.exports = class Private extends require('../lib/handler.js') {
    handle(payload, client) {
        if (!client || !client.player) {
            return;
        }
        if (payload) {
            if (state.getPrivatePlayers().length >= state.getPlayerCount() / 2) {
                let opponent = state.canReplacePrivate(client.player.name);
                if (opponent) {
                    client.player.makePrivate();
                    opponent.resetPrivate();
                    return true;
                }
                return false;
            }
            client.player.makePrivate();
        } else {
            if (!state.housesForPrivateSellOk(client.player.name)) {
                state.sellHouses(client.player.name);
            }
            client.player.resetPrivate();
        }
        return true;
    }

    events() {
        return ['statistics', 'players'];
    }
};
