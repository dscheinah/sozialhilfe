const state = require('../state.js');

module.exports = class Private extends require('../lib/handler.js') {
    handle(payload, client) {
        if (!client || !client.player) {
            return;
        }
        if (payload) {
            if (state.getPrivatePlayers().length > state.getPlayerCount() / 2) {
                return false;
            }
            client.player.makePrivate();
        } else {
            client.player.resetPrivate();
        }
        return true;
    }

    events() {
        return ['statistics', 'players'];
    }
};
