import {action, helper, loader, state, PageStack, Page} from './lib/sx.js';
import Server from './lib/server.js';
import Store from './lib/store.js';

const stack = new PageStack(), server = new Server(), store = new Store();

state.set('player-name', store.load('player-name'));
state.handle('login', async (payload) => {
    if (await server.handle('login', payload)) {
        store.save('player-name', payload.name);
        state.set('player-name', payload.name);
        return true;
    }
    return false;
});

[
    'accept',
    'ai',
    'change',
    'chat',
    'create',
    'donate',
    'insurances',
    'join',
    'leave',
    'next',
    'players',
    'private',
    'return',
    'save',
    'select',
    'statistics',
].forEach((call) => {
    state.handle(call, payload => server.handle(call, payload));
});
[
    'accept',
    'actions',
    'calculate',
    'cards',
    'change',
    'chat',
    'commit',
    'create',
    'dead',
    'donate',
    'finish',
    'init',
    'insurances',
    'players',
    'reset',
    'return',
    'save',
    'selecting',
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
    'select',
    'accept',
    'changed',
    'donate',
    'donation',
    'help',
    'insurance',
    'join',
    'message',
    'return',
    'private',
    'save',
].forEach((id) => {
    let page = new Page(id);
    loader.add(page.load());
    stack.add(page);
});

state.handle('loading', (payload, next) => {
    if (payload) {
        if (payload === true) {
            helper.style('#sx-loading-details', 'opacity', null);
            helper.style('#sx-loading-details', 'visibility', null);
            helper.style('#sx-loading', 'opacity', 1);
            helper.style('#sx-loading', 'visibility', 'visible');
        } else {
            helper.style('#sx-loading', 'opacity', null);
            helper.style('#sx-loading', 'visibility', null);
            helper.set('#sx-loading-message', 'innerText', payload);
            helper.style('#sx-loading-details', 'opacity', 1);
            helper.style('#sx-loading-details', 'visibility', 'visible');
        }
    } else {
        helper.style('#sx-loading', 'opacity', null);
        helper.style('#sx-loading', 'visibility', null);
        helper.style('#sx-loading-details', 'opacity', null);
        helper.style('#sx-loading-details', 'visibility', null);
    }
    return next(payload);
});

state.handle('open', (page, next) => {
    stack.show(page);
    return next(page);
});
state.handle('close', (page, next) => {
    stack.hide(page);
    return next(page);
});
state.handle('message', message => message);
state.handle('donate-select', (type, next) => {
    stack.show('donate');
    return next(type);
});
state.handle('private-select', (payload, next) => {
    stack.show('private');
    return next(payload);
});
state.handle('save-select', (payload, next) => {
    stack.show('save');
    return next(payload);
});
state.handle('insurance-select', (payload, next) => {
    stack.show('insurance');
    return next(payload);
});
state.handle('join-select', (payload, next) => {
    stack.show('join');
    return next(payload);
});

state.listen('login', (success) => {
    if (success) {
        stack.hide('login');
        stack.show('main');
    }
});
state.listen('message', () => stack.show('message'));
state.listen('finish', () => {
    state.dispatch('loading', false);
    stack.show('finish');
});
state.listen('dead', (name) => {
    if (name === state.get('player-name')) {
        state.dispatch('loading', false);
        stack.show('dead');
    }
});
state.listen('cards', (payload) => {
    if (payload.player === state.get('player-name')) {
        stack.show('select');
    }
});
state.listen('selecting', (payload) => {
    if (!payload.length) {
        stack.hide('select');
    }
});
state.listen('select', () => stack.hide('select'));
state.listen('calculate', () => stack.hide('select'));
state.listen('commit', () => {
    ['donate', 'accept', 'return', 'insurance'].forEach(id => stack.hide(id));
});
state.listen('donate', (payload) => {
    let name = state.get('player-name');
    if (payload.player === name) {
        stack.hide('donate');
    }
    if (payload.target === name && payload.cards.length) {
        state.dispatch('loading', false);
        stack.show(payload.hidden ? 'donation' : 'accept');
    }
});
state.listen('accept', () => stack.hide('accept'));
state.listen('return', (data) => {
    if (data.closed) {
        stack.hide('return');
    } else {
        if (data.players.indexOf(state.get('player-name')) >= 0) {
            stack.show('return');
        } else {
            stack.hide('return');
        }
    }
});
state.listen('private', () => stack.hide('private'));
state.listen('save', () => stack.hide('save'));
state.listen('create', () => stack.hide('insurance'));
state.listen('change', (data) => {
    if (!data) {
        return;
    }
    let name = state.get('player-name');
    if (data.insurance === name) {
        stack.hide('insurance');
    }
    if (data.player === name || (data.members && data.members.indexOf(name) >= 0)) {
        stack.show('changed');
    }
});
state.listen('join', () => stack.hide('join'));

action.listen('[title]', 'click', (e) => {
    let target = e.target;
    while (target) {
        if (target.title) {
            state.dispatch('message', target.title);
            return;
        }
        target = target.parentNode;
    }
});

loader.run().then(() => {
    stack.enable(helper.element('#sx-stack'));
    stack.show('login');
});
