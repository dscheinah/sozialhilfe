const Game = require('../lib/game.js');
const state = require('../state.js');

module.exports = class Prepare extends Game.Base {
    run(broadcast, refresh) {
        if (state.pool.cards.length === 0) {
            broadcast({type: 'finish', payload: true});
            return Game.STATE_INIT;
        }
        let nextState = Game.STATE_CALCULATE, players = state.getActivePlayers(), helpActive = false;
        for (let i = players.length - 1; i--;) {
            let player = players[i];
            player.reset();
            if (player.needsHelp()) {
                let helpCards = state.pool.drawCards(state.pool.helpAmount);
                if (helpCards.length < state.pool.helpAmount) {
                    broadcast({type: 'finish', payload: true});
                    return Game.STATE_INIT;
                }
                helpActive = true;
                player.give(helpCards);
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
