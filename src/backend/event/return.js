const state = require('../state.js');

module.exports = class Return extends require('../lib/handler.js') {
    broadcast(vote, client) {
        if (!client || !client.player) {
            return;
        }
        if (!vote) {
            return {closed: true};
        }
        client.player.voteReturn();
        let openVotes = [];
        state.getActivePlayers().forEach((player) => {
            if (!player.vote) {
                openVotes.push(player.name);
                player.wait(state.waitTimeout);
            }
        });
        return {players: openVotes};
    }
};
