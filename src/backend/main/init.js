const Game = require('../lib/game.js');
const state = require('../state.js');

module.exports = class Init extends Game.Base {
    run(broadcast) {
        let playerCount = state.getActivePlayers().length;
        if (playerCount >= state.requiredPlayers) {
            broadcast({type: 'init', payload: true});
            return Game.STATE_PREPARE;
        }
        let aiPlayers = state.getAiPlayers();
        if (playerCount === aiPlayers.length) {
            aiPlayers.forEach(player => player.deactivate());
        }
        return Game.STATE_INIT;
    }
};
