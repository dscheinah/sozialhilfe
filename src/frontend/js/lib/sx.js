class Action {
    listeners = {};

    listen(selector, type, callback) {
        if (!this.listeners[type]) {
            window.addEventListener(type, (event) => {
                let target = event.target, selectors = Object.keys(this.listeners[type]);
                while (target && target.matches) {
                    selectors.forEach((selector) => {
                        if (target.matches(selector)) {
                            this.listeners[type][selector].forEach(callback => callback(event));
                        }
                    });
                    target = target.parentNode;
                }
            });
            this.listeners[type] = {};
        }
        if (!this.listeners[type][selector]) {
            this.listeners[type][selector] = [];
        }
        this.listeners[type][selector].push(callback);
    }
}

class Helper {
    element(selector) {
        return document.querySelector(selector);
    }

    elements(selector) {
        return document.querySelectorAll(selector);
    }

    create(tag) {
        return document.createElement(tag);
    }

    import(template) {
        return document.importNode(template.content, true);
    }

    set(selector, key, value) {
        let element = this.element(selector);
        if (element) {
            element[key] = value;
        }
    }

    get(selector, key) {
        return this.element(selector)[key];
    }

    style(selector, property, value) {
        let element = this.element(selector);
        if (element) {
            element.style[property] = value;
        }
    }

    focus(selector) {
        this.element(selector).focus();
    }
}

class Loader {
    promises = [];

    add(promise) {
        this.promises.push(promise);
    }

    async run(min) {
        let start = Date.now();
        while (this.promises.length) {
            let promises = this.promises;
            this.promises = [];
            await Promise.all(promises);
        }
        return new Promise(resolve => setTimeout(resolve, min - Date.now() + start));
    }
}

class State {
    state = {};
    listeners = {};
    handlers = {};

    dispatch(name, payload) {
        if (!this.handlers[name]) {
            return;
        }
        let dispatch = (payload, step) => {
            let handler = this.handlers[name][step];
            if (handler) {
                return handler(payload, payload => dispatch(payload, step + 1));
            }
        };
        let handle = (result) => {
            this.state[name] = result;
            let listeners = this.listeners[name];
            if (listeners) {
                listeners.forEach(callback => callback(result));
            }
        };
        let result = dispatch(payload, 0);
        if (result instanceof Promise) {
            result.then(result => handle(result));
        } else {
            handle(result);
        }
    }

    listen(name, callback) {
        if (!this.listeners[name]) {
            this.listeners[name] = [];
        }
        this.listeners[name].push(callback);
    }

    handle(name, callback) {
        if (!this.handlers[name]) {
            this.handlers[name] = [];
        }
        this.handlers[name].push(callback);
    }

    get(name) {
        return this.state[name];
    }

    set(name, value) {
        this.state[name] = value;
        let listeners = this.listeners[name];
        if (listeners) {
            listeners.forEach(callback => callback(value));
        }
    }
}

export const action = new Action();
export const helper = new Helper();
export const loader = new Loader();
export const state = new State();

export class PageStack {
    pages = {};
    element;

    add(page) {
        this.pages[page.id] = page;
    }

    enable(element) {
        element.innerHTML = '';
        this.element = element;
    }

    show(id) {
        let page = helper.element('#' + id);
        if (!page) {
            page = helper.create('div');
            page.id = id;
            page.appendChild(this.pages[id].create());
        }
        this.element.appendChild(page);
        state.dispatch('sx-show-' + id);
    }

    hide(id) {
        let page = helper.element('#' + id);
        if (page) {
            state.dispatch('sx-hide-' + id);
            page.parentNode.removeChild(page);
        }
    }
}

export class Page {
    id;
    template;

    constructor(id) {
        this.id = id;
    }

    async load() {
        let nodes = helper.create('div'), scripts = [], styles = [];
        nodes.innerHTML = await (await fetch(`/pages/${this.id}.html`)).text();
        let children = nodes.children, length = children.length;
        for (let i = 0; i < length; i++) {
            let child = children[i];
            if (child instanceof HTMLTemplateElement) {
                this.template = child;
            } else if (child instanceof HTMLScriptElement) {
                scripts.push(child.text);
            } else if (child instanceof HTMLStyleElement) {
                styles.push(child);
            }
        }
        scripts.forEach((text) => {
            let script = helper.create('script');
            script.type = 'module';
            script.text = text;
            document.body.appendChild(script);
        });
        styles.forEach(style => document.head.appendChild(style));
    }

    create() {
        return helper.import(this.template);
    }
}
