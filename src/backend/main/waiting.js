const Game = require('../lib/game.js');
const state = require('../state.js');

module.exports = class Waiting extends Game.Base {
    run(broadcast) {
        let nextState = Game.STATE_COMMIT, waiting = [];
        state.getActivePlayers().forEach((player) => {
            let timeout = player.waiting;
            if (timeout) {
                player.wait(timeout - 1);
                waiting.push({
                    player: player.name,
                    timeout: timeout,
                });
                if (!player.ai) {
                    nextState = Game.STATE_WAITING;
                }
            }
        });
        broadcast({
            type: 'waiting',
            payload: waiting,
        });
        return nextState;
    }
}
