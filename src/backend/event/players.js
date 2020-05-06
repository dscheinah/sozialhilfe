const average = require('average');
const state = require('../state.js');

module.exports = class Players extends require('../lib/handler.js') {
    broadcast() {
        let players = [];
        state.getActivePlayers().forEach((player) => {
            let length = player.cards.length, score = Math.round(player.rounds / 100) + length;
            if (length) {
                score += Math.round(average(player.cards)) * 10;
            }
            let owner = state.insurances[player.name], insurance = state.getInsurance(player.name);
            players.push({
                name: player.name,
                cards: length < 10 ? length : Math.round(length / 10) * 10,
                score: score > 9999 ? 9999 : score,
                private: player.private,
                savings: Math.round(player.savings.length / 10) * 10,
                insurance: insurance ? insurance.name : '',
                owner: !!owner,
                members: owner ? owner.members.length : 0,
            });
        });
        return players;
    }
};
