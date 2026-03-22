// Content script - injected into web pages
// Listens for messages from popup/background

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getPageUrl') {
        sendResponse({ url: window.location.href });
    }
});

// Optional: Add download button to YouTube-like sites
if (shouldAddButton()) {
    addDownloadButton();
}

function shouldAddButton() {
    const url = window.location.href;
    return url.includes('youtube.com') || 
           url.includes('youtu.be') || 
           url.includes('vimeo.com');
}

function addDownloadButton() {
    // This could be expanded to add UI elements directly to pages
    // For now, we rely on the context menu
    console.log('MediaFlow extension loaded - use right-click menu to download');
}
