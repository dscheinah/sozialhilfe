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
    bid;
    balanced = {};

    constructor() {
        if (!fs.existsSync(file)) {
            return;
        }
        let buffer = fs.readFileSync(file);
        if (!buffer) {
            return;
        }
        let data = JSON.parse(buffer.toString());
        if (!data) {
            return;
        }
        this.round = data.round;
        Object.keys(data.players).forEach((name) => {
            let player = new Player(name), playerData = data.players[name];
            player.cards = playerData.cards;
            player.help = playerData.help;
            player.rounds = playerData.rounds;
            player.private = playerData.private;
            player.savings = playerData.savings;
            player.houses = playerData.houses;
            player.contract = playerData.contract;
            this.players[name] = player;
        });
        Object.keys(data.insurances).forEach((name) => {
            let insurance = new Insurance(name), insuranceData = data.insurances[name];
            insurance.help = insuranceData.help;
            insurance.sell = insuranceData.sell;
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
        this.insuranceToCreate.setSell(configuration.sell);
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

    canReplacePrivate(name) {
        let check = this.players[name];
        if (!check) {
            return false;
        }
        let opponent = null, length = check.houses.length;
        this.getPrivatePlayers().forEach((player) => {
            let current = player.houses.length;
            if (current < length) {
                length = current;
                opponent = player;
            }
        });
        return opponent;
    }

    housesForPrivateOk(name, balance) {
        let check = this.players[name];
        if (!check || !check.private) {
            return true;
        }
        let ok = true, length = check.houses.length;
        this.getActivePlayers().forEach((player) => {
            let current = player.houses.length;
            if (player.private || current <= length) {
                return;
            }
            if (balance) {
                let diff = this.getRoundDifference(player.name);
                if (current - (diff / 45) > length) {
                    ok = false;
                }
                return;
            }
            ok = false;
        });
        return ok;
    }

    housesForInsuranceOk(name) {
        let check = this.players[name], insurance = this.insurances[name];
        if (!check || !insurance) {
            return true;
        }
        let ok = true, length = check.houses.length;
        insurance.members.forEach((playerName) => {
            let player = this.players[playerName];
            if (player && player.houses.length > length) {
                ok = false;
            }
        });
        return ok;
    }

    housesForPrivateSellOk(name) {
        let player = this.players[name];
        if (!player) {
            return false;
        }
        let reference = player.houses.length, over = 0;
        this.getActivePlayers().forEach((current) => {
            if (current.houses.length >= reference) {
                over++;
            }
        });
        return over >= 2;
    }

    addContract(name, card) {
        let player = this.players[name];
        if (!player || !player.canContract(card)) {
            return '';
        }
        if (this.openInsurance && this.openInsurance.name === name) {
            let index = this.openInsurance.cards.indexOf(card);
            if (index >= 0 && player.addContract(card)) {
                this.openInsurance.cards.splice(index, 1);
                return 'insurance';
            }
            return '';
        }
        if (!player.winner || !this.removeFromProfit([card]).length) {
            return '';
        }
        if (!player.addContract(card)) {
            this.openProfit.push(card);
            return '';
        }
        return 'profit';
    }

    sellHouses(name) {
        let player = this.players[name];
        if (!player) {
            return;
        }
        let cards = player.sellHouses();
        if (!cards.length) {
            return;
        }
        this.pool.returnCards(cards, true);
        player.give(this.pool.drawCards(Math.floor(cards.length / 2)));
    }

    startBid(name, id) {
        let player = this.players[name];
        if (!player || !player.houses[id]) {
            return false;
        }
        this.bid = {
            player: name,
            id: id,
            bids: {},
            confirmed: '',
            timer: Math.round(this.waitTimeout / 2),
            bots: false,
        };
        return true;
    }

    addBid(name, cards) {
        let player = this.players[name];
        if (!player || player.cards.length < cards || !this.bid || this.bid.confirmed) {
            return false;
        }
        this.bid.bids[name] = cards;
        return true;
    }

    reduceBidTimer() {
        if (!this.bid || !this.bid.timer) {
            return;
        }
        if (Object.keys(this.bid.bids).length >= this.getActivePlayers().length - 1) {
            this.bid.timer = 0;
            return;
        }
        this.bid.timer--;
        if (this.bid.timer < 0) {
            this.bid.timer = 0;
        }
    }

    botsBid() {
        if (!this.bid || this.bid.bots) {
            return;
        }
        this.bid.bots = true;
    }

    confirmBid(name) {
        if (!this.bid || !this.bid.bids[name]) {
            return;
        }
        this.bid.confirmed = name;
    }

    getBestBids() {
        let bids = [];
        if (!this.bid) {
            return [];
        }
        for (let player in this.bid.bids) {
            bids.push({
                player: player,
                cards: this.bid.bids[player],
            });
        }
        bids.sort((a, b) => a.cards - b.cards);
        if (bids.length <= 2) {
            return bids;
        }
        return bids.splice(-2, 2);
    }

    isBalanced(name) {
        if (this.balanced[name] !== undefined) {
            return this.balanced[name];
        }
        let current = this.players[name];
        if (!current || current.ai) {
            return this.balanced[name] = false;
        }
        let diff = this.getRoundDifference(name) / 130;
        if (diff < .1) {
            return this.balanced[name] = false;
        }
        return this.balanced[name] = Math.random() + diff > 1;
    }

    getRoundDifference(name) {
        let current = this.players[name];
        if (!current) {
            return 0;
        }
        let min = current.rounds, score = current.getScore();
        this.getActivePlayers().forEach((player) => {
            if (player.name !== name && player.rounds < min && player.getScore() < score) {
                min = player.rounds;
            }
        });
        return Math.max(0, current.rounds - min);
    }

    roundPlayed() {
        this.round++;
        this.getPreparedPlayers().forEach((player) => {
           if (!this.isBalanced(player.name)) {
               player.roundPlayed();
           }
        });
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
                player.resetSavings();
            }
        }
        if (this.bid && Object.keys(this.bid.bids).length) {
            let source = this.players[this.bid.player], house = source.sellHouse(this.bid.id);
            if (house) {
                let target;
                if (this.bid.confirmed) {
                    target = this.players[this.bid.confirmed];
                } else {
                    target = this.players[this.getBestBids().pop().player];
                }
                let amount = this.bid[target.name];
                target.purchaseHouse(house);
                let cards = target.drawCards(amount);
                if (cards.length < amount) {
                    cards.push(...this.pool.drawCards(amount - cards.length));
                }
                source.give(cards);
            }
        }
        this.bid = null;
        this.donation = null;
        this.savings = null;
        this.pool.returnCards(this.openTaxes);
        this.openProfit = [];
        this.openTaxes = [];
        this.openInsurance = null;
        if (this.insuranceToCreate) {
            this.insurances[this.insuranceToCreate.name] = this.insuranceToCreate;
            this.insuranceToCreate = null;
        }
        this.balanced = {};
        fs.writeFile(file, JSON.stringify(this), noop);
    }
}

module.exports = new State();
