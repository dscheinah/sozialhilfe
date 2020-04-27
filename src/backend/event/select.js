module.exports = class Select extends require('../lib/handler.js') {
    handle(payload, client) {
        if (!client) {
            return;
        }
        payload = payload.map(card => parseInt(card));
        let cardCheck = [];
        client.player.cards.forEach(card => cardCheck.push(card));
        for (let i = payload.length; i--;) {
            let index = cardCheck.indexOf(payload[i]);
            if (index >= 0) {
                cardCheck.splice(index, 1);
            } else {
                client.player.select(0);
                return;
            }
        }
        if (cardCheck.length) {
            client.player.select(0);
            return;
        }
        client.player.cards = payload;
        client.player.select(0);
    }
};
