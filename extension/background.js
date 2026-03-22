// Install event
chrome.runtime.onInstalled.addListener(() => {
	setupContextMenus();
});

async function setupContextMenus() {
	try {
		// Remove old menus first
		await chrome.contextMenus.removeAll();

		// Video/Audio download context menu
		await chrome.contextMenus.create({
			id: "download-video",
			title: "Download as Video (MP4)",
			contexts: ["page", "link"],
		});

		await chrome.contextMenus.create({
			id: "download-audio",
			title: "Download as Audio (MP3)",
			contexts: ["page", "link"],
		});

		await chrome.contextMenus.create({
			id: "download-image",
			title: "Download Image",
			contexts: ["image"],
		});

		console.log("Context menus created successfully");
	} catch (error) {
		console.error("Error creating context menus:", error);
	}
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
	const url = info.linkUrl || info.pageUrl || info.srcUrl;
	let format = "video";

	if (info.menuItemId === "download-audio") {
		format = "audio";
	} else if (info.menuItemId === "download-image") {
		format = "image";
	}

	downloadFromContext(url, format);
});

function downloadFromContext(url, format) {
	// Open popup
	chrome.action.openPopup();

	// Store download request
	chrome.storage.local.set({
		pendingDownload: {
			url: url,
			format: format,
			timestamp: Date.now(),
		},
	});
}

// Handle message from content.js to open popup with URL
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === 'openPopupWithUrl') {
		// Store URL and open popup
		chrome.storage.local.set({ popupUrl: request.url }, () => {
			chrome.action.openPopup();
			sendResponse({ success: true });
		});
		return true; // Keep channel open for async response
	}
});

	// Send to server
	const API_URL = "http://localhost:7860/api";
	fetch(`${API_URL}/download`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			url: url,
			format: format,
		}),
	}).catch((err) => console.error("Download request failed:", err));
}
