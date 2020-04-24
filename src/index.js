require('dotenv').config();

const version = '0.1a';

const frontend = new (require('node-static').Server)(__dirname + '/frontend', {cache: false});

const server = require('http').createServer(function (request, response) {
    frontend.serve(request, response);
});

const backend = new (require('ws').Server)({server});
const event = new (require('./backend/event.js'))(backend);
const main = new (require('./backend/main.js'))(
    data => event.broadcast(data),
    events => event.refresh(events),
);

backend.on('connection', (socket) => {
    let client = new (require('./backend/lib/client.js'))();

    event.ping(socket, 5000);

    socket.send(JSON.stringify({type: 'version', payload: version}));

    socket.on('message', (data) => {
        main.start();
        if (client.player && !client.player.active) {
            socket.terminate();
            return;
        }
        event.handle(socket, JSON.parse(data), client);
    });
    socket.on('close', () => {
        if (client.player) {
            client.player.deactivate();
            event.refresh(['players', 'statistics']);
        }
        socket.removeAllListeners();
    });
});

server.listen(process.env.PORT || 8080);
