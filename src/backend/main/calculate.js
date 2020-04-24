const Game = require('../lib/game.js');
const state = require('../state.js');

module.exports = class Calculate extends Game.Base {
    run(broadcast, refresh) {
        let cards = [], taxes, bestCard = 0, bestPlayer, actions = [];
        state.getActivePlayers().forEach((player) => {
            let card = player.drawCard();
            if (!card) {
                broadcast({
                    type: 'dead',
                    payload: player.name,
                });
                player.deactivate();
            }
            cards.push(card);
            if (card > bestCard) {
                bestCard = card;
                bestPlayer = player;
            }
            if (!player.ai) {
                player.wait(state.waitTimeout);
                actions.push({
                    player: player.name,
                    actions: [],
                });
            }
        });
        if (bestPlayer) {
            taxes = cards.splice(0, Math.floor((cards.length - 3) / 2) + 1);
            bestPlayer.won();
            broadcast({
                type: 'calculate',
                payload: {
                    player: bestPlayer.name,
                    profit: cards,
                    taxes: taxes,
                },
            });
        } else {
            taxes = cards;
            cards = [];
            broadcast({
                type: 'calculate',
                payload: {
                    player: '',
                    profit: cards,
                    taxes: taxes,
                },
            });
        }
        refresh(['players']);
        broadcast({
            type: 'actions',
            payload: actions,
        });
        state.setOpenCards(cards, taxes);
        return Game.STATE_WAITING;
    }
};
