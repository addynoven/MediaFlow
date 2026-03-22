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

// ================== MEDIAFLOW CONTROL BAR BUTTON ==================

// Add CSS for the download button in control bar
const mfControlStyle = document.createElement('style');
mfControlStyle.textContent = `
    .mediaflow-control-btn {
        background: none !important;
        border: none !important;
        color: #fff !important;
        cursor: pointer !important;
        padding: 0 8px !important;
        margin: 0 4px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-size: 14px !important;
        transition: all 0.12s ease !important;
        z-index: 99999 !important;
        position: relative !important;
        height: 100% !important;
    }

    .mediaflow-control-btn:hover {
        background: rgba(255, 255, 255, 0.14) !important;
        border-radius: 4px !important;
        transform: scale(1.06) !important;
    }

    .mediaflow-control-btn:active {
        transform: scale(0.98) !important;
    }

    .mediaflow-control-btn.downloading {
        animation: mediaflow-pulse 1s infinite !important;
    }

    @keyframes mediaflow-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
    }

    .mediaflow-tooltip {
        position: absolute;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 6px 10px;
        border-radius: 4px;
        font-size: 12px;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        white-space: nowrap;
        opacity: 0;
        visibility: hidden;
        transition: opacity 120ms ease, visibility 120ms ease;
        z-index: 100000;
        margin-bottom: 8px;
        pointer-events: none;
    }

    .mediaflow-control-btn:focus .mediaflow-tooltip,
    .mediaflow-control-btn:hover .mediaflow-tooltip {
        opacity: 1;
        visibility: visible;
    }
`;
document.head.appendChild(mfControlStyle);

// Helper to create a configured button element
function mfCreateButton(tooltipText) {
    const button = document.createElement('button');
    button.className = 'mediaflow-control-btn';
    button.setAttribute('aria-label', tooltipText);
    button.setAttribute('role', 'button');
    button.setAttribute('tabindex', '0');
    button.innerHTML = `📥<span class="mediaflow-tooltip">${tooltipText}</span>`;

    // keyboard support
    button.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
            ev.preventDefault();
            button.click();
        }
    });

    return button;
}

// Prevent duplicate injections for a given container
function mfMarkInjected(container) {
    try {
        container.dataset.mediaflowInjected = '1';
    } catch (e) {}
}

function mfIsInjected(container) {
    return container && container.dataset && container.dataset.mediaflowInjected === '1';
}

// Main function to inject button into video players
function mfInjectControlButton() {
    // YouTube
    if (window.location.hostname.includes('youtube.com')) {
        mfInjectYouTubeButton();
    }
    // Vimeo
    else if (window.location.hostname.includes('vimeo.com')) {
        mfInjectVimeoButton();
    }
    // Facebook
    else if (window.location.hostname.includes('facebook.com')) {
        mfInjectFacebookButton();
    }
    // TikTok
    else if (window.location.hostname.includes('tiktok.com')) {
        mfInjectTikTokButton();
    }
    // Generic video players
    else {
        mfInjectGenericButton();
    }
}

// YouTube button injection
function mfInjectYouTubeButton() {
    const checkInterval = setInterval(() => {
        const controlsContainer = document.querySelector('.ytp-right-controls');

        if (controlsContainer && !mfIsInjected(controlsContainer)) {
            const button = mfCreateButton('Download Video');
            button.title = 'Download Video';

            // Insert before fullscreen button when possible
            const fullscreenBtn = controlsContainer.querySelector('.ytp-fullscreen-button');
            if (fullscreenBtn) {
                controlsContainer.insertBefore(button, fullscreenBtn);
            } else {
                controlsContainer.appendChild(button);
            }

            button.addEventListener('click', (e) => {
                e.stopPropagation();
                mfDownloadCurrentPage('video', button);
            });

            mfMarkInjected(controlsContainer);
            clearInterval(checkInterval);
        }
    }, 600);

    setTimeout(() => clearInterval(checkInterval), 30000);
}

// Vimeo button injection
function mfInjectVimeoButton() {
    const checkInterval = setInterval(() => {
        const controlsContainer = document.querySelector('.player-controls-right');

        if (controlsContainer && !mfIsInjected(controlsContainer)) {
            const button = mfCreateButton('Download');
            button.title = 'Download Video';

            controlsContainer.appendChild(button);

            button.addEventListener('click', (e) => {
                e.stopPropagation();
                mfDownloadCurrentPage('video', button);
            });

            mfMarkInjected(controlsContainer);
            clearInterval(checkInterval);
        }
    }, 600);

    setTimeout(() => clearInterval(checkInterval), 30000);
}

// Facebook button injection
function mfInjectFacebookButton() {
    const checkInterval = setInterval(() => {
        const video = document.querySelector('video');
        const container = video?.closest('[role="presentation"]') || video?.parentElement;

        if (container && !mfIsInjected(container)) {
            const button = mfCreateButton('Download');
            button.title = 'Download Video';
            button.style.position = 'absolute';
            button.style.bottom = '50px';
            button.style.right = '20px';

            container.style.position = container.style.position || 'relative';
            container.appendChild(button);

            button.addEventListener('click', (e) => {
                e.stopPropagation();
                mfDownloadCurrentPage('video', button);
            });

            mfMarkInjected(container);
            clearInterval(checkInterval);
        }
    }, 600);

    setTimeout(() => clearInterval(checkInterval), 30000);
}

// TikTok button injection
function mfInjectTikTokButton() {
    const checkInterval = setInterval(() => {
        const controlsContainer = document.querySelector('[class*="DivPlayerControls"]');

        if (controlsContainer && !mfIsInjected(controlsContainer)) {
            const button = mfCreateButton('Download');
            button.title = 'Download Video';
            button.style.color = '#fff';

            controlsContainer.appendChild(button);

            button.addEventListener('click', (e) => {
                e.stopPropagation();
                mfDownloadCurrentPage('video', button);
            });

            mfMarkInjected(controlsContainer);
            clearInterval(checkInterval);
        }
    }, 600);

    setTimeout(() => clearInterval(checkInterval), 30000);
}

// Generic video player button injection
function mfInjectGenericButton() {
    const checkInterval = setInterval(() => {
        const videos = document.querySelectorAll('video');

        videos.forEach((video) => {
            const container = video.parentElement || video.closest('div') || document.body;
            if (mfIsInjected(container)) return;

            const button = mfCreateButton('Download');
            button.title = 'Download Video';
            button.style.position = 'absolute';
            button.style.bottom = '10px';
            button.style.right = '10px';
            button.style.background = 'rgba(0, 0, 0, 0.7)';
            button.style.borderRadius = '4px';
            button.style.padding = '8px 12px';

            container.style.position = container.style.position || 'relative';
            container.appendChild(button);

            button.addEventListener('click', (e) => {
                e.stopPropagation();
                mfDownloadCurrentPage('video', button);
            });

            mfMarkInjected(container);
        });

        if (document.querySelectorAll('video').length > 0) {
            clearInterval(checkInterval);
        }
    }, 700);

    setTimeout(() => clearInterval(checkInterval), 30000);
}

// Download handler - opens popup with current URL pre-filled
function mfDownloadCurrentPage(format, button) {
    const url = window.location.href;
    // Send message to background.js to open popup
    chrome.runtime.sendMessage({ 
        action: 'openPopupWithUrl', 
        url: url 
    }).catch(err => {
        console.error('Failed to open popup:', err);
    });
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mfInjectControlButton);
} else {
    mfInjectControlButton();
}

// Reinject if page changes (SPA)
const mfPageObserver = new MutationObserver(() => {
    mfInjectControlButton();
});

mfPageObserver.observe(document.body, { 
    childList: true, 
    subtree: true 
});

console.log('✅ MediaFlow control bar button loaded!');

// ======================================================================== atleast i can see something 
