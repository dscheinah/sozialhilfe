const average = require('average');
const state = require('../state.js');

module.exports = class Statistics extends require('../lib/handler.js') {
    broadcast() {
        return {
            players: {
                active: state.getActivePlayers().length,
                ai: state.getAiPlayers().length,
                inactive: state.getInactivePlayers().length,
                required: state.requiredPlayers,
            },
            pool: {
                cards: state.pool.cards.length,
                level: state.pool.level,
                average: state.pool.cards.length ? Math.round(average(state.pool.cards)) : 0,
            }
        };
    }
};
