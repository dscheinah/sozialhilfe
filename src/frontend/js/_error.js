(function () {
    var handler = function (error) {
        var message = error;
        if (window.Error && error instanceof Error) {
            message = error.message;
        } else if (window.PromiseRejectionEvent && error instanceof PromiseRejectionEvent) {
            message = error.reason.message;
        }
        if (message.replace) {
            message = message.replace(/^(.*?)Error: /, '');
        }
        document.getElementById('sx-error').style.display = 'block';
        document.getElementById('sx-error-message').innerHTML = message;
    };
    window.onerror = handler;
    window.onunhandledrejection = handler;
})();
