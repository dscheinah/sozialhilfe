const state = require('../state.js');

module.exports = class Change extends require('../lib/handler.js') {
    broadcast(payload, client) {
        if (!client || !client.player) {
            return;
        }
        if (!payload) {
            let insurance = state.getInsurance(client.player.name);
            if (insurance) {
                return {
                    player: client.player.name,
                    taxes: insurance.taxes,
                    members: insurance.members,
                };
            }
        } else {
            let insurance = state.insurances[client.player.name];
            if (insurance) {
                insurance.setTaxes(payload);
                return {
                    insurance: insurance.name,
                    taxes: insurance.taxes,
                    members: insurance.members,
                };
            }
        }
        return false;
    }

    events() {
        return ['insurances'];
    }
};
