const API_URL = "http://localhost:7860/api";

let selectedFormat = "video";
const statusBox = document.getElementById("statusBox");
const serverCheck = document.getElementById("serverCheck");
const downloadBtn = document.getElementById("downloadBtn");
const urlInput = document.getElementById("urlInput");
const pasteBtn = document.getElementById("pasteBtn");

// Check server connection on load
window.addEventListener("load", () => {
	checkServerConnection();
	loadUrlFromStorage(); // Try loading from video player button first
});

// Format selection
document.querySelectorAll(".format-btn").forEach((btn) => {
	btn.addEventListener("click", () => {
		document
			.querySelectorAll(".format-btn")
			.forEach((b) => b.classList.remove("active"));
		btn.classList.add("active");
		selectedFormat = btn.dataset.format;
		// Show/hide quality selectors based on selected format
		const qualityGroup = document.getElementById("qualityGroup");
		const audioQualityGroup = document.getElementById("audioQualityGroup");

		if (selectedFormat === "video" || selectedFormat === "webm") {
			if (qualityGroup) qualityGroup.style.display = "block";
			if (audioQualityGroup) audioQualityGroup.style.display = "none";
		} else if (selectedFormat === "audio") {
			if (qualityGroup) qualityGroup.style.display = "none";
			if (audioQualityGroup) audioQualityGroup.style.display = "block";
		} else {
			if (qualityGroup) qualityGroup.style.display = "none";
			if (audioQualityGroup) audioQualityGroup.style.display = "none";
		}
	});
});

// Set initial format as active
document.querySelector('[data-format="video"]')?.classList.add("active");
// Ensure quality selectors visibility matches default
(function initQualityVisibility() {
	const qualityGroup = document.getElementById("qualityGroup");
	const audioQualityGroup = document.getElementById("audioQualityGroup");
	if (qualityGroup) qualityGroup.style.display = "block";
	if (audioQualityGroup) audioQualityGroup.style.display = "none";
})();

// Paste URL button
pasteBtn.addEventListener("click", async () => {
	try {
		const text = await navigator.clipboard.readText();
		urlInput.value = text;
		urlInput.focus();
	} catch (err) {
		showStatus("Failed to paste from clipboard", "error");
	}
});

// Download button
downloadBtn.addEventListener("click", () => {
	const url = urlInput.value.trim();
	if (!url) {
		showStatus("Please enter a URL", "error");
		return;
	}
	downloadMedia(url, selectedFormat);
});

// Enter key to download
urlInput.addEventListener("keypress", (e) => {
	if (e.key === "Enter") {
		downloadBtn.click();
	}
});

async function checkServerConnection() {
	try {
		const response = await fetch(`${API_URL}/ping`, { timeout: 3000 });
		if (response.ok) {
			serverCheck.classList.add("connected");
			serverCheck.innerHTML =
				'<div class="dot"></div><span>Server connected</span>';
			downloadBtn.disabled = false;
		}
	} catch (err) {
		serverCheck.classList.remove("connected");
		serverCheck.innerHTML = `<div class="dot"></div><span>Server not running on localhost:7860</span>`;
		downloadBtn.disabled = true;
		showStatus("Start the MediaFlow server to begin downloading", "warning");
	}
}

// Load URL from storage (set by video player button)
function loadUrlFromStorage() {
	chrome.storage.local.get('popupUrl', (result) => {
		if (result.popupUrl) {
			urlInput.value = result.popupUrl;
			// Clear it after loading
			chrome.storage.local.remove('popupUrl');
		} else {
			// Fallback: load from active tab if no stored URL
			loadUrlFromActiveTab();
		}
	});
}

async function loadUrlFromActiveTab() {
	try {
		const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
		if (tabs[0]) {
			const url = tabs[0].url;
			if (isValidMediaUrl(url)) {
				urlInput.value = url;
			}
		}
	} catch (err) {
		// Permission not granted, skip
	}
}

function isValidMediaUrl(url) {
	const mediaHosts = [
		"youtube.com",
		"youtu.be",
		"vimeo.com",
		"dailymotion.com",
		"facebook.com",
		"instagram.com",
		"tiktok.com",
		"twitter.com",
		"x.com",
		"reddit.com",
		"soundcloud.com",
		"spotify.com",
		"twitch.tv",
		"imgur.com",
		"flickr.com",
	];
	return mediaHosts.some((host) => url.includes(host));
}

async function downloadMedia(url, format) {
	downloadBtn.disabled = true;
	showStatus(
		`<span class="loading-spinner"></span>Processing download...`,
		"info",
	);

	try {
		// Get quality from dropdown
		let quality = "best";
		if (format === "video" || format === "webm") {
			const qualitySelect = document.getElementById("qualitySelect");
			if (qualitySelect) quality = qualitySelect.value;
		} else if (format === "audio") {
			const audioQualitySelect = document.getElementById("audioQualitySelect");
			if (audioQualitySelect) quality = audioQualitySelect.value;
		}

		// ✅ SEND QUALITY TO SERVER
		const response = await fetch(`${API_URL}/download`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				url: url,
				format: format,
				quality: quality, // ✅ ADD THIS!
			}),
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.error || "Download failed");
		}

		if (data.success) {
			showStatus(`✅ Download started! Quality: ${quality}`, "success");
			urlInput.value = "";

			setTimeout(() => {
				showStatus("", "");
			}, 4000);
		} else {
			throw new Error(data.error || "Unknown error");
		}
	} catch (err) {
		showStatus(`❌ ${err.message}`, "error");
	} finally {
		downloadBtn.disabled = false;
	}
}

function showStatus(message, type) {
	if (!message) {
		statusBox.classList.remove("show");
		return;
	}
	statusBox.textContent = "";
	statusBox.innerHTML = message;
	statusBox.className = `status-box show ${type}`;
}

// Re-check server connection every 5 seconds
setInterval(checkServerConnection, 5000);
