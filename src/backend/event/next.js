module.exports = class Next extends require('../lib/handler.js') {
    handle(data, client) {
        if (client && client.player) {
            client.player.wait(0);
        }
    }
};
