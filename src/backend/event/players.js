const average = require('average');
const state = require('../state.js');

module.exports = class Players extends require('../lib/handler.js') {
    broadcast() {
        let players = [];
        state.getActivePlayers().forEach((player) => {
            let length = player.cards.length;
            players.push({
                name: player.name,
                cards: length < 10 ? length : Math.round(length / 10) * 10,
                average: length ? Math.round(average(player.cards)) : 0,
            });
        });
        return players;
    }
};
