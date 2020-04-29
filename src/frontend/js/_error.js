const handler = (error) => {
    let message = error;
    if (error instanceof Error) {
        message = error.message;
    } else if (error instanceof PromiseRejectionEvent) {
        message = error.reason.message;
    }
    document.getElementById('sx-error').style.display = 'block';
    document.getElementById('sx-error-message').innerHTML = message.replace(/^(.*?)Error: /, '');
};
window.onerror = handler;
window.onunhandledrejection = handler;
