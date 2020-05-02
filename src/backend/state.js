const Player = require('./lib/player.js');
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
    playerSelectLimit = 3;
    donation;
    savings;

    constructor() {
        if (!fs.existsSync(file)) {
            return;
        }
        let buffer = fs.readFileSync(file);
        if (!buffer) {
            return;
        }
        let data = JSON.parse(buffer.toString());
        Object.keys(data.players).forEach((name) => {
            let player = new Player(name), playerData = data.players[name];
            player.cards = playerData.cards;
            player.help = playerData.help;
            player.rounds = playerData.rounds;
            player.private = playerData.private;
            player.savings = playerData.savings;
            this.players[name] = player;
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

    setOpenCards(profit, taxes) {
        this.openProfit = profit;
        this.openTaxes = taxes;
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
        }
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
        fs.writeFile(file, JSON.stringify(this), noop);
    }
}

module.exports = new State();
