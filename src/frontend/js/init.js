import {helper, loader, state, PageStack, Page} from './lib/sx.js';
import Server from './lib/server.js';
import Store from './lib/store.js';

const stack = new PageStack(), server = new Server(), store = new Store();

state.set('player-name', store.load('player-name'));
state.handle('login', (payload, next) => {
    store.save('player-name', payload.name);
    return next(payload);
});

[
    'ai',
    'chat',
    'login',
    'next',
    'players',
    'statistics',
].forEach((call) => {
    state.handle(call, payload => server.handle(call, payload));
});
[
    'actions',
    'calculate',
    'chat',
    'commit',
    'dead',
    'finish',
    'init',
    'players',
    'statistics',
    'version',
    'waiting',
].forEach((event) => {
    server.listen(event, payload => state.set(event, payload));
});
server.connect();

[
    'login',
    'main',
    'finish',
    'dead',
].forEach((id) => {
    let page = new Page(id);
    loader.add(page.load());
    stack.add(page);
});

state.handle('loading', (payload, next) => {
    if (payload) {
        helper.style('#sx-loading', 'opacity', 1);
        helper.style('#sx-loading', 'visibility', 'visible');
    } else {
        helper.style('#sx-loading', 'opacity', null);
        helper.style('#sx-loading', 'visibility', null);
    }
    return next(payload);
});

state.listen('login', (success) => {
    if (success) {
        stack.hide('login');
        stack.show('main');
    }
});
state.listen('finish', () => stack.show('finish'));
state.listen('dead', (name) => {
    if (name === state.get('player-name')) {
        stack.show('dead');
    }
});

loader.run(500).then(() => {
    stack.enable(helper.element('#sx-stack'));
    stack.show('login');
});
