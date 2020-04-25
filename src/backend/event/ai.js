const state = require('../state.js');

module.exports = class Ai extends require('../lib/handler.js') {
    handle() {
        let required = state.requiredPlayers - state.getActivePlayers().length;
        ['Alpha', 'Omega'].forEach((name) => {
            let player = state.createPlayer(name);
            if (!player.active && required > 0) {
                required--;
                player.aiControlled();
            }
        });
    }

    events() {
        return ['players', 'statistics'];
    }
};
