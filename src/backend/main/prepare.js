const Game = require('../lib/game.js');
const state = require('../state.js');

module.exports = class Prepare extends Game.Base {
    run(broadcast, refresh) {
        let nextState = Game.STATE_CALCULATE, players = state.getActivePlayers(), helpActive = false;
        for (let name in state.players) {
            state.players[name].reset();
        }
        for (let i = players.length; i--;) {
            let player = players[i];
            if (player.ai && !player.savings.length && player.cards.length < 10) {
                player.resetPrivate();
            }
            if (player.needsHelp()) {
                if (player.private) {
                    player.useSavings();
                } else {
                    let helpCards = state.pool.drawCards(state.pool.helpAmount);
                    if (helpCards.length < state.pool.helpAmount) {
                        broadcast({type: 'finish', payload: true});
                        return Game.STATE_INIT;
                    }
                    helpActive = true;
                    player.give(helpCards);
                }
            }
            if (player.cards.length > 1 && player.cards.length <= state.playerSelectLimit && !player.ai) {
                player.select(state.waitTimeout);
                broadcast({
                    type: 'cards',
                    payload: {
                        player: player.name,
                        cards: player.cards,
                    },
                });
                nextState = Game.STATE_SELECT;
            }
            player.setPrepared();
        }
        if (state.pool.cards.length < state.pool.taxLimitPerPlayer * players.length) {
            state.pool.increaseTaxes();
        } else if (!helpActive) {
            state.pool.restoreTaxes();
        }
        refresh(['statistics', 'players']);
        return nextState;
    }
};
