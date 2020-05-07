module.exports = class Player {
    name = '';
    active = false;
    ai = false;
    cards = [];
    prepared = false;
    waiting = 0;
    winner = false;
    help = false;
    rounds = 0;
    selectTimeout = 0;
    vote = false;
    private = false;
    savings = [];

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

    drawCards(amount) {
        return this.cards.splice(-amount, amount);
    }

    reset() {
        this.prepared = false;
        this.winner = false;
        this.vote = false;
        if (this.private) {
            this.help = false;
        }
    }

    setPrepared() {
        this.rounds++;
        this.prepared = true;
    }

    wait(timeout) {
        this.waiting = timeout < 0 ? 0 : timeout;
    }

    commit(profit) {
        if (profit && profit.length) {
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

    select(timeout) {
        this.selectTimeout = timeout < 0 ? 0 : timeout;
    }

    voteReturn() {
        this.vote = true;
    }

    makePrivate() {
        this.private = true;
    }

    resetPrivate() {
        this.private = false;
    }

    save(cards) {
        this.savings.push(...cards);
    }

    useSavings() {
        this.give(this.savings);
        this.savings = [];
    }
};
