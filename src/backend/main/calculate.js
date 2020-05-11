const Game = require('../lib/game.js');
const state = require('../state.js');

module.exports = class Calculate extends Game.Base {
    cards = [];
    profit = [];
    profitCards = [];
    taxes = [];
    taxCards = [];
    insurance;
    winner;

    run(broadcast, refresh) {
        let players = state.getPreparedPlayers();
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
            }
        });

        this.reset();
        this.draw(players, broadcast);
        this.calculateTaxes();
        this.calculateInsurance();
        this.calculateProfit();

        state.setOpenCards(this.profitCards, this.taxCards, this.insurance);

        broadcast({
            type: 'calculate',
            payload: {
                player: this.winner ? this.winner.name : '',
                profit: this.profit,
                taxes: this.taxes,
                owner: this.insurance ? this.insurance.name : null,
                insurance: this.insurance ? this.insurance.taxes : [],
            },
        });
        refresh(['players']);

        let actions = [], playerCount = state.getPlayerCount(), insuranceCount = Object.keys(state.insurances).length;
        let returnPossible = state.getReturnAmount();
        let privatePossible = state.getPrivatePlayers().length < playerCount / 2;
        players.forEach((player) => {
            let playerActions = [], insurance = state.insurances[player.name];
            if (player.cards.length) {
                playerActions.push('donate-hidden');
            }
            if (player === this.winner) {
                playerActions.push('donate-profit', 'contract');
                if (player.private) {
                    playerActions.push('save');
                } else if (!insurance && state.isInsurancePossible()) {
                    playerActions.push('create');
                }
            }
            if (returnPossible) {
                playerActions.push('return');
            }
            if (!player.private) {
                if (privatePossible || state.canReplacePrivate(player.name)) {
                    playerActions.push('private');
                }
                if (insurance) {
                    playerActions.push('change');
                    if (this.winner && insurance.members.indexOf(this.winner.name) >= 0) {
                        playerActions.push('contract');
                    }
                } else if (state.getInsurance(player.name)) {
                    playerActions.push('leave');
                } else if (insuranceCount) {
                    playerActions.push('join');
                }
            } else {
                playerActions.push('pool');
            }
            actions.push({
                player: player.name,
                actions: playerActions,
            });
        });
        broadcast({
            type: 'actions',
            payload: actions,
        });

        return Game.STATE_WAITING;
    }

    reset() {
        this.cards = [];
        this.profit = [];
        this.profitCards = [];
        this.taxes = [];
        this.taxCards = [];
        this.insurance = null;
        this.winner = null;
    }

    draw(players, broadcast) {
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
            let tossingPlayersText = toss[0].player.name, length = toss.length - 1;
            for (let i = 1; i < length; i++) {
                tossingPlayersText += ', ' + toss[i].player.name;
            }
            tossingPlayersText += ' und ' + toss[length].player.name;
            broadcast({
                type: 'chat',
                payload: {
                    message: 'Stechen zwischen ' + tossingPlayersText,
                },
            });
            this.draw(tossingPlayers, broadcast);
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
        if (!this.winner || state.getInsurance(this.winner.name)) {
            return;
        }
        let taxCount = state.pool.getTaxCount(this.cards.length);
        if (this.winner.private) {
            if (state.housesForPrivateOk(this.winner.name)) {
                return;
            }
            taxCount += 2;
        } else {
            taxCount -= this.winner.houses.length;
        }
        if (taxCount < 1) {
            taxCount = 1;
        }
        if (taxCount >= this.cards.length) {
            taxCount = this.cards.length - 1;
        }
        let calculations = {}, level = 0;
        this.cards.forEach((card) => {
            if (calculations[card.card]) {
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

            let middleCard = taxBase[Math.floor((taxBase.length - 1) / 2)];
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
    }

    calculateInsurance() {
        if (!this.winner || this.winner.private) {
            return;
        }
        let insurance = state.getInsurance(this.winner.name);
        if (!insurance) {
            return;
        }
        let owner = state.players[insurance.name];
        if (!owner) {
            return;
        }
        let houseDifference = this.winner.houses.length - owner.houses.length;
        let cards = [];
        this.insurance = {
            name: insurance.name,
            taxes: [],
            cards: [],
        };
        this.cards.forEach(card => cards.push(card.card));
        insurance.calculateTaxes(cards, houseDifference).forEach((tax) => {
            for (let i = this.cards.length; i--;) {
                let card = this.cards[i];
                if (card.card === tax && !card.tax) {
                    card.tax = true;
                    this.insurance.taxes.push({
                        card: card.card,
                        player: card.player.name,
                        contract: owner.canContract(card.card),
                    });
                    this.insurance.cards.push(card.card);
                    return;
                }
            }
        });
    }

    calculateProfit() {
        this.cards.forEach((card) => {
            if (!card.tax) {
                if (!this.winner) {
                    card.tax = true;
                    this.taxes.push({
                        card: card.card,
                        player: card.player.name,
                    });
                    this.taxCards.push(card.card);
                } else {
                    this.profit.push({
                        card: card.card,
                        player: card.player.name,
                        contract: this.winner.canContract(card.card),
                    });
                    this.profitCards.push(card.card);
                }
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
