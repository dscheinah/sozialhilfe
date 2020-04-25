const Game = require('../lib/game.js');
const state = require('../state.js');

module.exports = class Calculate extends Game.Base {
    cards = [];
    profit = [];
    profitCards = [];
    taxes = [];
    taxCards = [];
    winner;

    run(broadcast, refresh) {
        let players = state.getActivePlayers(), actions = [];
        players.forEach((player) => {
            if (!player.cards.length) {
                broadcast({
                    type: 'dead',
                    payload: player.name,
                });
                player.deactivate();
            }
            if (!player.ai) {
                player.wait(state.waitTimeout);
                actions.push({
                    player: player.name,
                    actions: [],
                });
            }
        });

        this.reset();
        this.draw(players);
        this.calculateTaxes();

        broadcast({
            type: 'calculate',
            payload: {
                player: this.winner ? this.winner.name : '',
                profit: this.profit,
                taxes: this.taxes,
            },
        });
        refresh(['players']);
        broadcast({
            type: 'actions',
            payload: actions,
        });

        state.setOpenCards(this.profitCards, this.taxCards);
        return Game.STATE_WAITING;
    }

    reset() {
        this.cards = [];
        this.profit = [];
        this.profitCards = [];
        this.taxes = [];
        this.taxCards = [];
    }

    draw(players) {
        let current = [], bestCard = 0, toss = [];
        players.forEach((player) => {
            let card = this.createCard(player);
            if (!card) {
                return;
            }
            current.push(card);
            this.cards.push(card);
            if (card.card === bestCard) {
                toss.push(card);
            } else if (card.card > bestCard) {
                bestCard = card.card;
                toss = [card];
            }
        });
        if (toss.length > 1) {
            let tossingPlayers = [];
            toss.forEach((card) => {
                let tossCard = this.createCard(card.player);
                if (tossCard) {
                    this.cards.push(tossCard);
                    tossingPlayers.push(card.player);
                }
            });
            this.draw(tossingPlayers);
        } else {
            current.forEach((card) => {
                if (card.card === bestCard) {
                    card.player.won();
                    this.winner = card.player;
                }
            });
        }
    }

    calculateTaxes() {
        let calculations = {}, level = 0, taxCount = Math.floor((this.cards.length - 3) / 2) + 1;
        this.cards.forEach((card) => {
            if (!this.winner) {
                this.taxes.push(card);
                this.taxCards.push(card.card);
            } else if (calculations[card.card]) {
                let current = ++calculations[card.card];
                if (current > level) {
                    level = current;
                }
            } else {
                calculations[card.card] = 1;
                if (!level) {
                    level = 1;
                }
            }
        });
        while (level && this.taxes.length < taxCount) {
            let taxBase = [];
            for (let card in calculations) {
                if (calculations[card] === level) {
                    taxBase.push(card);
                    calculations[card]--;
                }
            }
            level--;
            if (!taxBase.length) {
                continue;
            }
            taxBase.sort();

            let middleCard = taxBase[Math.floor(taxBase.length / 2)];
            taxBase.splice(taxBase.indexOf(middleCard), 1);
            this.setTax(middleCard, taxCount);

            let topCard = taxBase.pop();

            let low = true;
            while (taxBase.length && this.taxes.length < taxCount) {
                this.setTax(low ? taxBase.shift() : taxBase.pop(), taxCount);
                low = !low;
            }

            this.setTax(topCard, taxCount);
        }
        this.cards.forEach((card) => {
            if (!card.tax) {
                this.profit.push({
                    card: card.card,
                    player: card.player.name,
                });
                this.profitCards.push(card.card);
            }
        });
    }

    createCard(player) {
        let card = player.drawCard();
        if (!card) {
            return null;
        }
        return {
            card: card,
            player: player,
            tax: false,
        };
    }

    setTax(tax, limit) {
        if (!tax || this.taxes.length >= limit) {
            return;
        }
        tax = parseInt(tax);
        for (let i = this.cards.length; i--;) {
            let card = this.cards[i];
            if (card.card === tax && !card.tax) {
                card.tax = true;
                this.taxes.push({
                    card: card.card,
                    player: card.player.name,
                });
                this.taxCards.push(tax);
                return;
            }
        }
    }
};
