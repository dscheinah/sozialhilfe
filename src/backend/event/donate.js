const state = require('../state.js');

module.exports = class Donate extends require('../lib/handler.js') {
    broadcast(payload, client) {
        if (!client || !client.player) {
            return;
        }
        let target = state.players[payload.target];
        if (!target) {
            return;
        }
        target.wait(state.waitTimeout);
        if (payload.hidden) {
            let cards = client.player.drawCards(payload.amount);
            target.give(cards);
            return {
                hidden: true,
                player: client.player.name,
                target: target.name,
                cards: cards,
            };
        }
        if (!client.player.winner) {
            return;
        }
        return {
            player: client.player.name,
            target: target.name,
            cards: state.donate(payload.cards, target.name),
        };
    }

    events() {
        return ['players'];
    }
};
