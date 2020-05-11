const average = require('average');
const state = require('../state.js');

module.exports = class Statistics extends require('../lib/handler.js') {
    broadcast() {
        let property = 0;
        for (let name in state.players) {
            let player = state.players[name];
            player.houses.forEach(house => property += house.length);
            property += player.contract.length;
        }
        return {
            game: {
                round: state.round,
                property: property,
            },
            players: {
                active: state.getActivePlayers().length,
                ai: state.getAiPlayers().length,
                inactive: state.getInactivePlayers().length,
                required: state.requiredPlayers,
                private: state.getPrivatePlayers().length,
            },
            pool: {
                cards: state.pool.cards.length,
                level: state.pool.level,
                average: state.pool.cards.length ? Math.round(average(state.pool.cards)) : 0,
                increased: state.pool.taxIncreased,
            },
            insurances: {
                count: Object.keys(state.insurances).length,
                members: state.getPlayerCountInsurance(),
            },
        };
    }
};
