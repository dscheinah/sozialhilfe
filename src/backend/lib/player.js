const contractBase = {
    1: 0,
    2: 1,
    3: 1,
    4: 2,
    5: 2,
    6: 4,
    7: 4,
    8: 8,
};

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
    houses = [];
    contract = [];
    contracted = false;

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
        this.contracted = false;
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
        if (this.isContractCompleted()) {
            this.houses.push(this.contract.sort());
            this.contract = [];
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

    resetSavings() {
        this.savings = [];
    }

    sellHouses() {
        let cardsToReturn = [], cardsToGive = [];
        this.houses.forEach((house) => {
            house.sort();
            cardsToReturn.push(house.pop());
            cardsToGive.push(house.pop());
            if (house.length) {
                cardsToReturn.push(...house);
            }
        });
        this.houses = [];
        this.help = false;
        this.give(cardsToGive);
        return cardsToReturn;
    }

    sellHouse(id) {
        return this.houses.splice(id, 1).pop();
    }

    purchaseHouse(house) {
        this.houses.push(house);
    }

    canContract(card) {
        if (this.contracted || card <= 1 || this.isContractCompleted()) {
            return false;
        }
        let reserved = {1: 0, 2: 0, 4: 0, 8: 0}, has = {1: 1, 2: 1, 4: 1, 8: 0};
        [...this.contract, card].forEach((card) => {
            let base = contractBase[card];
            reserved[base]++;
            if (card % 2) {
                has[base] = 0;
            }
        });
        let expected = 0;
        for (let key in reserved) {
            let value = reserved[key];
            if (!value) {
                continue;
            }
            expected += key * (value + has[key]);
        }
        return expected <= 16;
    }

    addContract(card) {
        if (!this.canContract(card)) {
            return false;
        }
        this.contract.push(card);
        this.contracted = true;
        return true;
    }

    isContractCompleted() {
        if (this.contract.length < 2) {
            return false;
        }
        return this.contract.reduce((length, card) => length + contractBase[card], 0) === 16;
    }
};
