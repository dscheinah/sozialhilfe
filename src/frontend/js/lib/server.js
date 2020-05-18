export default class Server {
    constructor() {
        this.waiting = {};
        this.handles = [];
        this.socket = null;
        this.open = false;
        this.listeners = {};
    }

    connect() {
        let url = new URL(window.location.href);
        url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
        this.socket = new WebSocket(url.toString());
        this.socket.onopen = () => {
            this.open = true;
            this.handles.forEach((data) => {
                this.socket.send(JSON.stringify({
                    type: data.name,
                    payload: data.payload,
                }));
            });
            this.handles = [];
        };
        this.socket.onmessage = (event) => {
            let data = JSON.parse(event.data), type = data.type;
            let resolve = this.waiting[type];
            if (resolve) {
                resolve(data.payload);
                this.waiting[type] = null;
            } else {
                let listeners = this.listeners[type];
                if (listeners) {
                    listeners.forEach(callback => callback(data.payload));
                }
            }
        };
        this.socket.onclose = () => {
            setTimeout(() => {
                let message = 'Der Server wurde beendet. Bitte lade die Seite neu, sobald der Server wieder gestartet wurde.';
                throw new Error(message);
            }, 1000);
        }
    }

    async handle(name, payload) {
        return new Promise((resolve) => {
            this.waiting[name] = resolve;
            if (!this.open) {
                this.handles.push({name: name, payload: payload});
            } else {
                this.socket.send(JSON.stringify({
                    type: name,
                    payload: payload,
                }));
            }
        });
    }

    listen(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }
}
