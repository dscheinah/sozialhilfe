const Game = require('../lib/game.js');
const state = require('../state.js');

module.exports = class Init extends Game.Base {
    run(broadcast) {
        if (state.getActivePlayers().length >= state.requiredPlayers) {
            broadcast({type: 'init', payload: true});
            return Game.STATE_PREPARE;
        }
        return Game.STATE_INIT;
    }
};
