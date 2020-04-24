const state = require('../state.js');

module.exports = class Client {
    player;

    register(name) {
        this.player = state.createPlayer(name);
        this.player.activate();
    }
};
