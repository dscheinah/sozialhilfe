const types = {
    accept: new (require('./event/accept.js'))(),
    ai: new (require('./event/ai.js'))(),
    bid: new (require('./event/bid.js'))(),
    change: new (require('./event/change.js'))(),
    chat: new (require('./event/chat.js'))(),
    confirm: new (require('./event/confirm.js'))(),
    contract: new (require('./event/contract.js'))(),
    create: new (require('./event/create.js'))(),
    donate: new (require('./event/donate.js'))(),
    insurances: new (require('./event/insurances.js'))(),
    join: new (require('./event/join.js'))(),
    leave: new (require('./event/leave.js'))(),
    login: new (require('./event/login.js'))(),
    next: new (require('./event/next.js'))(),
    players: new (require('./event/players.js'))(),
    private: new (require('./event/private.js'))(),
    return: new (require('./event/return.js'))(),
    save: new (require('./event/save.js'))(),
    select: new (require('./event/select.js'))(),
    sell: new (require('./event/sell.js'))(),
    statistics: new (require('./event/statistics.js'))(),
};

module.exports = class Event {
    ws;

    constructor(ws) {
        this.ws = ws;
    }

    handle(socket, data, client) {
        let handler = types[data.type];
        if (!handler) {
            return;
        }
        let broadcast = handler.broadcast(data.payload, client);
        if (broadcast) {
            this.broadcast({
                type: data.type,
                payload: broadcast,
            });
        } else {
            socket.send(JSON.stringify({
                type: data.type,
                payload: handler.handle(data.payload, client),
            }));
        }
        let events = handler.events();
        if (events) {
            this.refresh(events);
        }
    }

    broadcast(data) {
        let json = JSON.stringify(data);
        this.ws.clients.forEach(socket => socket.send(json));
    }

    refresh(events) {
        events.forEach((event) => {
            let type = types[event];
            if (type) {
                this.broadcast({
                    type: event,
                    payload: type.broadcast(),
                });
            }
        });
    }

    ping(socket, timeout) {
        let alive = true;
        let interval = setInterval(() => {
            if (alive) {
                alive = false;
                socket.ping();
            } else {
                socket.terminate();
            }
        }, timeout);
        socket.on('pong', () => alive = true);
        socket.on('close', () => clearInterval(interval));
    }
};
