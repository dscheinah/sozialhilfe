module.exports = class Chat extends require('../lib/handler.js') {
    broadcast(message, client) {
        if (!client || !client.player) {
            return;
        }
        return {
            name: client.player.name,
            message: message,
        };
    }
};
