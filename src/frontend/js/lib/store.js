export default class Store {
    save(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch {
        }
    }

    load(key) {
        try {
            return localStorage.getItem(key);
        } catch {
        }
    }
}
