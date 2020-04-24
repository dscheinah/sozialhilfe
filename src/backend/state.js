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
            this.players[name] = player;
        });
        this.pool.currentSet = data.pool.currentSet;
        this.pool.cards = data.pool.cards;
        this.pool.level = data.pool.level;
        this.pool.returnCards(data.openProfit);
        this.pool.returnCards(data.openTaxes);
    }

    save() {
        fs.writeFile(file, JSON.stringify(this), noop);
    }

    createPlayer(name) {
        if (!this.players[name]) {
            let player = new Player(name);
            player.commit(this.pool.drawPlayerBase());
            this.players[name] = player;
            this.save();
        }
        this.players[name].reset();
        return this.players[name];
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
        this.save();
    }

    commit() {
        for (let name in this.players) {
            let player = this.players[name];
            player.commit(player.winner ? this.openProfit : []);
        }
        this.pool.returnCards(this.openTaxes);
        this.openProfit = [];
        this.openTaxes = [];
        this.save();
    }
}

module.exports = new State();
