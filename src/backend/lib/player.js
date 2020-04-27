module.exports = class Player {
    name = '';
    active = false;
    ai = false;
    cards = [];
    waiting = 0;
    winner = false;
    help = false;
    rounds = 0;

    constructor(name) {
        this.name = name;
    }

    activate() {
        this.active = true;
        this.ai = false;
    }

    deactivate() {
        this.active = false;
        this.ai = false;
    }

    aiControlled() {
        this.active = true;
        this.ai = true;
    }

    drawCard() {
        return this.cards.pop();
    }

    reset() {
        this.winner = false;
    }

    wait(timeout) {
        this.waiting = timeout < 0 ? 0 : timeout;
    }

    commit(profit) {
        this.rounds++;
        if (profit.length) {
            this.help = false;
            this.give(profit);
        }
    }

    won() {
        this.winner = true;
    }

    needsHelp() {
        if (!this.cards.length) {
            this.help = true;
        }
        return this.help;
    }

    give(cards) {
        this.cards = [...cards, ...this.cards];
    }
};
