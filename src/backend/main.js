const Game = require('./lib/game.js');
const state = require('./state.js');

const handlers = {};
handlers[Game.STATE_INIT] = new (require('./main/init.js'))();
handlers[Game.STATE_PREPARE] = new (require('./main/prepare.js'))();
handlers[Game.STATE_SELECT] = new (require('./main/select.js'))();
handlers[Game.STATE_CALCULATE] = new (require('./main/calculate.js'))();
handlers[Game.STATE_WAITING] = new (require('./main/waiting.js'))();
handlers[Game.STATE_COMMIT] = new (require('./main/commit.js'))();

module.exports = class Main {
    broadcast;
    refresh;
    interval;
    gameState = Game.STATE_INIT;

    constructor(broadcast, refresh) {
        this.broadcast = broadcast;
        this.refresh = refresh;
    }

    start() {
        if (!this.interval) {
            this.gameState = Game.STATE_INIT;
            this.interval = setInterval(() => this.loop(), 1000);
        }
    }

    stop() {
        if (this.interval) {
            state.commit();
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    loop() {
        let playerCount = state.getActivePlayers().length;
        if (!playerCount) {
            return this.stop();
        } else if (playerCount < state.requiredPlayers) {
            let aiPlayers = state.getAiPlayers();
            if (playerCount === aiPlayers.length) {
                aiPlayers.forEach(player => player.deactivate());
                return this.stop();
            }
            state.commit();
            this.gameState = Game.STATE_INIT;
            return;
        }
        let handler = handlers[this.gameState];
        this.gameState = handler.run(this.broadcast, this.refresh);
    }
};
