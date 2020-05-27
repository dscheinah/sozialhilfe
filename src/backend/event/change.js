const state = require('../state.js');

module.exports = class Change extends require('../lib/handler.js') {
    broadcast(payload, client) {
        if (!client || !client.player) {
            return;
        }
        if (!payload) {
            let insurance = state.getInsurance(client.player.name);
            if (insurance) {
                this.wait(insurance.members);
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
                this.wait(insurance.members);
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

    wait(players) {
        players.forEach((name) => {
            let player = state.players[name];
            if (!player) {
                return;
            }
            if (player.prepared) {
                player.wait(state.waitTimeout)
            }
        });
    }
};
