const handler = (error) => {
    let message = error;
    if (error instanceof Error) {
        message = error.message;
    } else if (error instanceof PromiseRejectionEvent) {
        message = error.reason;
    }
    if (message.replace) {
        message = message.replace(/^Error: /, '');
    }
    document.getElementById('sx-error').style.display = 'block';
    document.getElementById('sx-error-message').innerHTML = message;
};
window.onerror = handler;
window.onunhandledrejection = handler;
