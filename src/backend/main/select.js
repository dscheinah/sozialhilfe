const Game = require('../lib/game.js');
const state = require('../state.js');

module.exports = class Select extends Game.Base {
    run(broadcast) {
        let players = state.getPreparedPlayers(), selectingPlayers = [], nextState = Game.STATE_CALCULATE;
        for (let i = players.length; i--;) {
            let player = players[i], timeout = player.selectTimeout;
            if (player.cards.length > state.playerSelectLimit) {
                timeout = 0;
            }
            if (timeout) {
                player.select(timeout - 1);
                selectingPlayers.push({
                    player: player.name,
                    timeout: timeout,
                });
                if (!player.ai && player.active) {
                    nextState = Game.STATE_SELECT;
                }
            }
        }
        broadcast({
            type: 'selecting',
            payload: selectingPlayers,
        });
        return nextState;
    }
};
