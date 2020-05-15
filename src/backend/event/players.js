const average = require('average');
const state = require('../state.js');

module.exports = class Players extends require('../lib/handler.js') {
    broadcast() {
        let players = [];
        state.getActivePlayers().forEach((player) => {
            let length = player.cards.length, savings = player.savings.length;
            let score = Math.round(player.rounds / 100) + length;
            if (length) {
                score += Math.round(average(player.cards)) * 10;
            }
            player.houses.forEach((house) => {
                score += Math.round(house.reduce((x, y) => x + y, 0) / house.length) * 2;
            });
            let owner = state.insurances[player.name], insurance = state.getInsurance(player.name);
            let balanced = Math.round(state.getRoundDifference(player.name) / 130 * 10) * 10;
            if (balanced < 10) {
                balanced = 0;
            } else if (balanced > 100) {
                balanced = 100;
            }
            players.push({
                name: player.name,
                cards: length < 10 ? length : Math.round(length / 10) * 10,
                score: score > 9999 ? 9999 : score,
                private: player.private,
                savings: savings < 10 ? savings : Math.round(savings / 10) * 10,
                insurance: insurance ? insurance.name : '',
                owner: !!owner,
                members: owner ? owner.members.length : 0,
                warnPrivate: !state.housesForPrivateOk(player.name, true),
                warnPrivateBalanced: !state.housesForPrivateOk(player.name, false),
                warnInsurance: !state.housesForInsuranceOk(player.name),
                houses: player.houses,
                contract: player.contract,
                balanced: balanced,
            });
        });
        return players;
    }
};
