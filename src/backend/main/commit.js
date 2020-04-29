const Game = require('../lib/game.js');
const state = require('../state.js');

module.exports = class Commit extends Game.Base {
    run(broadcast, refresh) {
        if (state.donation) {
            let player = state.players[state.donation.target];
            if (player && player.ai && Math.floor(Math.random() * Math.max(...state.donation.cards)) > 4) {
                state.acceptDonation();
            }
        }
        broadcast({type: 'commit', payload: true});
        if (state.donation && !state.donation.accepted) {
            broadcast({
                type: 'chat',
                payload: {
                    message: `Spieler ${state.donation.player} hat die Spende abgelehnt.`,
                },
            });
        }
        state.commit();
        refresh(['statistics', 'players']);
        return Game.STATE_PREPARE;
    }
};
