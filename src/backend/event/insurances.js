const state = require('../state.js');

module.exports = class Insurance extends require('../lib/handler.js') {
    broadcast() {
        let insurances = [];
        Object.keys(state.insurances).forEach((name) => {
            let insurance = state.insurances[name];
            insurances.push({
                name: name,
                help: insurance.help,
                taxes: insurance.taxes,
                members: insurance.members.length,
            });
        });
        return insurances;
    }
};
