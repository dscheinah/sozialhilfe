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
    running = false;
    gameState = Game.STATE_INIT;

    constructor(broadcast, refresh) {
        this.broadcast = broadcast;
        this.refresh = refresh;
    }

    start() {
        if (!this.running) {
            this.running = true;
            this.gameState = Game.STATE_INIT;
            this.loop();
        }
    }

    loop() {
        let lastState;
        do {
            if (this.gameState <= Game.STATE_PREPARE) {
                let playerCount = state.getActivePlayers().length;
                if (!playerCount) {
                    this.running = false;
                    return;
                } else if (playerCount < state.requiredPlayers) {
                    this.broadcast({type: 'reset', payload: true});
                    this.gameState = Game.STATE_INIT;
                }
            }
            lastState = this.gameState;
            this.gameState = handlers[this.gameState].run(this.broadcast, this.refresh);
            if (this.gameState === Game.STATE_FINISH) {
                state.commit();
                this.running = false;
                return;
            }
        } while (lastState !== this.gameState);
        setTimeout(() => this.loop(), 1000);
    }
};
