const Game = require('../lib/game.js');
const state = require('../state.js');

module.exports = class Prepare extends Game.Base {
    run(broadcast, refresh) {
        if (state.pool.cards.length === 0) {
            broadcast({type: 'finish', payload: true});
            return Game.STATE_INIT;
        }
        let nextState = Game.STATE_CALCULATE;
        state.getActivePlayers().forEach((player) => {
            player.reset();
            if (player.needsHelp()) {
                let helpCards = state.pool.drawCards(state.pool.helpAmount);
                if (helpCards.length < state.pool.helpAmount) {
                    broadcast({type: 'finish', payload: true});
                }
                player.give(helpCards);
            }
            if (player.cards.length && player.cards.length <= state.playerSelectLimit && !player.ai) {
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
        });
        refresh(['statistics', 'players']);
        return nextState;
    }
};
