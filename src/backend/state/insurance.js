module.exports = class Insurance {
    name = '';
    help = 0;
    sell = false;
    taxes = {
        amount: 0.0,
        priority: [],
        cards: [],
    };
    members = [];

    constructor(name) {
        this.name = name;
    }

    setHelp(help) {
        this.help = help;
    }

    setSell(sell) {
        this.sell = !!sell;
    }

    setTaxes(taxes) {
        let amount = parseFloat(taxes.amount), priority = (taxes.priority || []).map(card => parseInt(card));
        [1, 2, 3, 4, 5, 6, 7, 8].forEach((card) => {
            if (priority.indexOf(card) < 0) {
                priority.push(card);
            }
        });
        this.taxes.amount = amount >= 0 ? amount : 0.0;
        this.taxes.priority = priority;
        this.taxes.cards = (taxes.cards || []).map(card => parseInt(card));
    }

    addPlayer(name) {
        this.members.push(name);
    }

    removePlayer(name) {
        let index = this.members.indexOf(name);
        if (index >= 0) {
            this.members.splice(index, 1);
        }
    }

    calculateTaxes(profit, reduction) {
        let taxes = [], priorityLength = this.taxes.priority.length;
        for (let i = 0; i < priorityLength; i++) {
            let card = this.taxes.priority[i];
            if (this.taxes.cards.indexOf(card) < 0) {
                continue;
            }
            let index = profit.indexOf(card);
            while (index >= 0) {
                taxes.push(card);
                profit.splice(index, 1);
                index = profit.indexOf(card);
            }
        }
        let taxCount = Math.round(profit.length * this.taxes.amount);
        for (let i = 0; i < priorityLength && taxes.length < taxCount; i++) {
            let card = this.taxes.priority[i], index = profit.indexOf(card);
            while (taxes.length < taxCount && index >= 0) {
                taxes.push(card);
                profit.splice(index, 1);
                index = profit.indexOf(card);
            }
        }
        while (reduction > 0 && taxes.length > 1) {
            taxes.pop();
            reduction--;
        }
        return taxes;
    }
};
