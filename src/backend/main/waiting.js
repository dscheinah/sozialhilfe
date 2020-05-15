const Game = require('../lib/game.js');
const state = require('../state.js');

module.exports = class Waiting extends Game.Base {
    run(broadcast) {
        let nextState = Game.STATE_COMMIT, waiting = [];
        let bid = null, playerCount = state.getActivePlayers().length;
        if (state.bid) {
            let house = state.players[state.bid.player].houses[state.bid.id];
            bid = Math.round(house.reduce((x, y) => x + y, 0) / house.length);
        }
        state.getPreparedPlayers().forEach((player) => {
            let timeout = player.waiting;
            if (timeout) {
                player.wait(timeout - 1);
                if (!player.ai && player.active) {
                    nextState = Game.STATE_WAITING;
                }
            }
            if (player.ai && bid && !state.bid.bots) {
                let cards = bid;
                if (player.cards.length - cards * 2 > 2 * playerCount) {
                    state.addBid(player.name, Math.round(Math.random() * cards + 1));
                    broadcast({
                        type: 'bid',
                        payload: {
                            player: player.name,
                            bid: state.bid,
                            bids: state.getBestBids(),
                        },
                    });
                }
            }
            waiting.push({
                player: player.name,
                timeout: timeout,
            });
        });
        if (state.bid) {
            broadcast({
                type: 'update',
                payload: {
                    bid: state.bid,
                    bids: state.getBestBids(),
                },
            });
            state.botsBid();
            state.reduceBidTimer();
            if (state.bid.timer === 1 && !Object.keys(state.bid.bids).length) {
                broadcast({
                    type: 'bid',
                    payload: {
                        bid: state.bid,
                        bids: state.getBestBids(),
                    },
                });
            }
        }
        broadcast({
            type: 'waiting',
            payload: waiting,
        });
        return nextState;
    }
};
