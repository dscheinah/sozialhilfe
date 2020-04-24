const Game = require('../lib/game.js');
const state = require('../state.js');

module.exports = class Commit extends Game.Base {
    run(broadcast, refresh) {
        state.commit();
        broadcast({type: 'commit', payload: true});
        refresh(['statistics', 'players']);
        return Game.STATE_PREPARE;
    }
}
