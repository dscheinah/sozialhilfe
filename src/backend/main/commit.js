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
        let vote = false, returnTaxes = true;
        state.getPreparedPlayers().forEach((player) => {
            if (player.vote) {
                vote = true;
            } else if (player.ai) {
                if (Math.round(Math.random())) {
                    returnTaxes = false;
                }
            } else {
                returnTaxes = false;
            }
        });
        if (vote) {
            if (returnTaxes) {
                broadcast({
                    type: 'chat',
                    payload: {
                        message: 'Die Steuerrückzahlung ist erfolgt.',
                    },
                });
                state.return();
            } else {
                broadcast({
                    type: 'chat',
                    payload: {
                        message: 'Die Abstimmung zur Steuerrückzahlung war nicht erfolgreich.',
                    },
                });
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
        refresh(['statistics', 'players', 'insurances']);
        return Game.STATE_PREPARE;
    }
};
