const shuffle = require('shuffle-array');

module.exports = class Pool {
    baseSet = {
        1: 24,
        2: 20,
        3: 28,
        4: 30,
        5: 29,
        6: 30,
        7: 23,
        8: 22,
    };
    currentSet = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        6: 0,
        7: 0,
        8: 0,
    };
    cardsPerPlayer = 40;
    helpAmount = 2;
    cards = [];
    level = 0;

    drawPlayerBase() {
        if (this.cards.length < this.cardsPerPlayer + this.level * 15) {
            let newCards = [];
            for (let card in this.baseSet) {
                let amount = this.baseSet[card];
                for (let i = 0; i < amount; i++) {
                    newCards.push(parseInt(card));
                }
                this.currentSet[card] += amount;
            }
            shuffle(newCards);
            this.cards = [...newCards, ...this.cards];
            this.level++;
        }
        return this.drawCards(this.cardsPerPlayer);
    }

    drawCards(amount) {
        let cards = this.cards.splice(-amount, amount);
        cards.forEach(card => this.currentSet[card]--);
        return cards;
    }

    returnCards(cards) {
        cards.forEach(card => this.currentSet[card]++);
        let removeLevel = true;
        for (let card in this.currentSet) {
            if (this.currentSet[card] < this.baseSet[card]) {
                removeLevel = false;
            }
        }
        if (removeLevel) {
            this.cards = [];
            for (let card in this.currentSet) {
                this.currentSet[card] -= this.baseSet[card];
                let amount = this.currentSet[card];
                for (let i = 0; i < amount; i++) {
                    this.cards.push(parseInt(card));
                }
            }
            shuffle(this.cards);
            this.level--;
        } else {
            this.cards = [...cards, ...this.cards];
        }
    }
};
