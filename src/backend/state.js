const Player = require('./lib/player.js');
const Insurance = require('./state/insurance.js');
const fs = require('fs');

const noop = () => null;
const file = __dirname + '/../../data/state.json';

class State {
    players = {};
    requiredPlayers = 3;
    waitTimeout = 30;
    pool = new (require('./state/pool.js'))();
    openProfit = [];
    openTaxes = [];
    openInsurance;
    playerSelectLimit = 3;
    donation;
    savings;
    round = 1;
    insurances = {};
    insuranceToCreate;

    constructor() {
        if (!fs.existsSync(file)) {
            return;
        }
        let buffer = fs.readFileSync(file);
        if (!buffer) {
            return;
        }
        let data = JSON.parse(buffer.toString());
        this.round = data.round;
        Object.keys(data.players).forEach((name) => {
            let player = new Player(name), playerData = data.players[name];
            player.cards = playerData.cards;
            player.help = playerData.help;
            player.rounds = playerData.rounds;
            player.private = playerData.private;
            player.savings = playerData.savings;
            this.players[name] = player;
        });
        Object.keys(data.insurances).forEach((name) => {
            let insurance = new Insurance(name), insuranceData = data.insurances[name];
            insurance.help = insuranceData.help;
            insurance.taxes = insuranceData.taxes;
            insurance.members = insuranceData.members;
            this.insurances[name] = insurance;
        });
        this.pool.currentSet = data.pool.currentSet;
        this.pool.cards = data.pool.cards;
        this.pool.level = data.pool.level;
        this.pool.taxIncreased = data.pool.taxIncreased;
        this.pool.returnCards(data.openProfit);
        this.pool.returnCards(data.openTaxes);
    }

    createPlayer(name) {
        if (!this.players[name]) {
            let player = new Player(name);
            player.commit(this.pool.drawPlayerBase());
            this.players[name] = player;
        }
        this.players[name].reset();
        return this.players[name];
    }

    getPlayerCount() {
        return Object.keys(this.players).length;
    }

    getActivePlayers() {
        return this.filterPlayers('active', true);
    }

    getInactivePlayers() {
        return this.filterPlayers('active', false);
    }

    getAiPlayers() {
        return this.filterPlayers('ai', true);
    }

    getPreparedPlayers() {
        return this.filterPlayers('prepared', true);
    }

    getPrivatePlayers() {
        return this.filterPlayers('private', true);
    }

    getPlayerCountInsurance() {
        let members = 0, insurances = Object.keys(this.insurances);
        insurances.forEach((name) => {
            members += this.insurances[name].members.length;
        });
        return members;
    }

    isInsurancePossible() {
        let playerCount = this.getPlayerCount();
        playerCount -= Object.keys(this.insurances).length;
        playerCount -= this.getPrivatePlayers().length;
        playerCount -= this.getPlayerCountInsurance();
        return playerCount > 1 && this.openProfit.filter(card => [6, 7, 8].indexOf(card) >= 0).length;
    }

    filterPlayers(key, value) {
        let players = [];
        for (let name in this.players) {
            let player = this.players[name];
            if (player[key] === value) {
                players.push(player);
            }
        }
        return players;
    }

    setOpenCards(profit, taxes, insurance) {
        this.openProfit = profit;
        this.openTaxes = taxes;
        this.openInsurance = insurance;
    }

    donate(cards, player) {
        if (!this.players[player]) {
            return [];
        }
        let donation = this.removeFromProfit(cards);
        this.donation = {
            player: player,
            cards: donation,
            accepted: false,
        };
        return donation;
    }

    removeFromProfit(cards) {
        let removed = [];
        for (let i = cards.length; i--;) {
            let card = parseInt(cards[i]), index = this.openProfit.indexOf(card);
            if (index >= 0) {
                this.openProfit.splice(index, 1);
                removed.push(card);
            }
        }
        return removed;
    }

    acceptDonation() {
        if (this.donation) {
            this.donation.accepted = true;
        }
    }

    return() {
        let amount = this.getReturnAmount();
        for (let name in this.players) {
            this.players[name].give(this.pool.drawCards(amount));
        }
    }

    getReturnAmount() {
        return Math.floor(this.pool.cards.length / 2 / this.getPlayerCount());
    }

    save(cards) {
        return this.savings = this.removeFromProfit(cards);
    }

    createInsurance(name, configuration) {
        let player = this.players[name], help = parseInt(configuration.help);
        if (!player || player.private || help <= 0 || !this.isInsurancePossible()) {
            return false;
        }
        this.insuranceToCreate = new Insurance(name);
        this.insuranceToCreate.setHelp(help);
        this.insuranceToCreate.setTaxes(configuration);
        this.openTaxes.push(...this.openProfit);
        this.openProfit = [];
        return true;
    }

    removeInsurance(name) {
        delete this.insurances[name];
    }

    setInsurance(player, insurance) {
        if (!this.insurances[insurance]) {
            return;
        }
        this.removeFromInsurance(player);
        this.insurances[insurance].addPlayer(player);
    }

    removeFromInsurance(player) {
        Object.keys(this.insurances).forEach((insurance) => {
            this.insurances[insurance].removePlayer(player);
        });
    }

    getInsurance(player) {
        let names = Object.keys(this.insurances);
        for (let i = names.length; i--;) {
            let insurance = this.insurances[names[i]];
            if (insurance.members.indexOf(player) >= 0) {
                return insurance;
            }
        }
        return null;
    }

    commit() {
        for (let name in this.players) {
            let player = this.players[name];
            if (player.winner) {
                if (this.savings) {
                    if (player.private) {
                        player.save(this.savings);
                    } else {
                        this.pool.returnCards(this.savings);
                    }
                }
                player.commit(this.openProfit);
                if (this.donation && !this.donation.accepted) {
                    player.give(this.donation.cards);
                }
            } else if (this.openInsurance && this.openInsurance.name === player.name) {
                player.commit(this.openInsurance.cards);
            } else {
                player.commit();
            }
            if (this.donation && this.donation.accepted && this.donation.player === name) {
                player.give(this.donation.cards);
            }
            if (!player.private && player.savings.length) {
                this.pool.returnCards(player.savings);
                player.savings = [];
            }
        }
        this.donation = null;
        this.savings = null;
        this.pool.returnCards(this.openTaxes);
        this.openProfit = [];
        this.openTaxes = [];
        this.openInsurance = null;
        this.round++;
        if (this.insuranceToCreate) {
            this.insurances[this.insuranceToCreate.name] = this.insuranceToCreate;
            this.insuranceToCreate = null;
        }
        fs.writeFile(file, JSON.stringify(this), noop);
    }
}

module.exports = new State();
