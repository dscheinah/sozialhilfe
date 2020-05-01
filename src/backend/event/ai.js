const state = require('../state.js');

module.exports = class Ai extends require('../lib/handler.js') {
    handle() {
        let required = state.requiredPlayers - state.getActivePlayers().length;
        ['Alpha', 'Omega', 'µν'].forEach((name) => {
            if (required <= 0) {
                return;
            }
            let player = state.createPlayer(name);
            if (!player.active) {
                required--;
                player.aiControlled();
            }
        });
    }

    events() {
        return ['players', 'statistics'];
    }
};
