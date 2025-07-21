// Script for the sidebar webview (sidebarView.js)

(function () {
    // Get a reference to the VS Code API
    const vscode = acquireVsCodeApi();

    // Add event listeners to the cards
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', () => {
            const target = card.getAttribute('data-target');
            if (target) {
                // Send a message to the extension to navigate
                vscode.postMessage({
                    command: 'navigate',
                    payload: target
                });
            }
        });
    });

    // Optional: Handle messages *from* the extension (e.g., to highlight the active view)
    window.addEventListener('message', event => {
        const message = event.data; // The JSON data our extension sent
        switch (message.type) {
            case 'sidebarNavigate':
                // You could potentially highlight the active card here
                console.log("Sidebar received navigation: ", message.payload);
                document.querySelectorAll('.card').forEach(card => {
                    if (card.getAttribute('data-target') === message.payload) {
                        card.classList.add('active');
                    } else {
                        card.classList.remove('active');
                    }
                });
                break;
        }
    });

}());
