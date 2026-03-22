// ================== MEDIAFLOW CONTROL BAR BUTTON ==================

// Add CSS for the download button in control bar
const mfControlStyle = document.createElement("style");
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
		transition: all 0.2s ease !important;
		z-index: 99999 !important;
		position: relative !important;
		height: 100% !important;
	}

	.mediaflow-control-btn:hover {
		background: rgba(255, 255, 255, 0.2) !important;
		border-radius: 4px !important;
		transform: scale(1.1) !important;
	}

	.mediaflow-control-btn:active {
		transform: scale(0.95) !important;
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
		display: none;
		z-index: 100000;
		margin-bottom: 8px;
	}

	.mediaflow-control-btn:hover .mediaflow-tooltip {
		display: block;
	}
`;
document.head.appendChild(mfControlStyle);

// Main function to inject button into video players
function mfInjectControlButton() {
	// YouTube
	if (window.location.hostname.includes("youtube.com")) {
		mfInjectYouTubeButton();
	}
	// Vimeo
	else if (window.location.hostname.includes("vimeo.com")) {
		mfInjectVimeoButton();
	}
	// Facebook
	else if (window.location.hostname.includes("facebook.com")) {
		mfInjectFacebookButton();
	}
	// TikTok
	else if (window.location.hostname.includes("tiktok.com")) {
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
		// Find the controls container (right-side buttons)
		const controlsContainer = document.querySelector(".ytp-right-controls");

		if (
			controlsContainer &&
			!controlsContainer.querySelector(".mediaflow-control-btn")
		) {
			const button = document.createElement("button");
			button.className = "mediaflow-control-btn";
			button.innerHTML = `📥<span class="mediaflow-tooltip">Download Video</span>`;
			button.title = "Download Video";

			// Insert before fullscreen button
			const fullscreenBtn = controlsContainer.querySelector(
				".ytp-fullscreen-button",
			);
			if (fullscreenBtn) {
				fullscreenBtn.parentNode.insertBefore(button, fullscreenBtn);
			} else {
				controlsContainer.appendChild(button);
			}

			button.addEventListener("click", (e) => {
				e.stopPropagation();
				mfDownloadCurrentPage("video", button);
			});

			clearInterval(checkInterval);
		}
	}, 500);

	// Clear interval after 30 seconds to avoid infinite loop
	setTimeout(() => clearInterval(checkInterval), 30000);
}

// Vimeo button injection
function mfInjectVimeoButton() {
	const checkInterval = setInterval(() => {
		const controlsContainer = document.querySelector(".player-controls-right");

		if (
			controlsContainer &&
			!controlsContainer.querySelector(".mediaflow-control-btn")
		) {
			const button = document.createElement("button");
			button.className = "mediaflow-control-btn";
			button.innerHTML = `📥<span class="mediaflow-tooltip">Download</span>`;
			button.title = "Download Video";

			controlsContainer.appendChild(button);

			button.addEventListener("click", (e) => {
				e.stopPropagation();
				mfDownloadCurrentPage("video", button);
			});

			clearInterval(checkInterval);
		}
	}, 500);

	setTimeout(() => clearInterval(checkInterval), 30000);
}

// Facebook button injection
function mfInjectFacebookButton() {
	const checkInterval = setInterval(() => {
		const video = document.querySelector("video");
		const container = video?.closest('[role="presentation"]');

		if (container && !container.querySelector(".mediaflow-control-btn")) {
			const button = document.createElement("button");
			button.className = "mediaflow-control-btn";
			button.innerHTML = `📥<span class="mediaflow-tooltip">Download</span>`;
			button.style.position = "absolute";
			button.style.bottom = "50px";
			button.style.right = "20px";
			button.title = "Download Video";

			container.style.position = "relative";
			container.appendChild(button);

			button.addEventListener("click", (e) => {
				e.stopPropagation();
				mfDownloadCurrentPage("video", button);
			});

			clearInterval(checkInterval);
		}
	}, 500);

	setTimeout(() => clearInterval(checkInterval), 30000);
}

// TikTok button injection
function mfInjectTikTokButton() {
	const checkInterval = setInterval(() => {
		const controlsContainer = document.querySelector(
			'[class*="DivPlayerControls"]',
		);

		if (
			controlsContainer &&
			!controlsContainer.querySelector(".mediaflow-control-btn")
		) {
			const button = document.createElement("button");
			button.className = "mediaflow-control-btn";
			button.innerHTML = `📥<span class="mediaflow-tooltip">Download</span>`;
			button.title = "Download Video";
			button.style.color = "#fff";

			controlsContainer.appendChild(button);

			button.addEventListener("click", (e) => {
				e.stopPropagation();
				mfDownloadCurrentPage("video", button);
			});

			clearInterval(checkInterval);
		}
	}, 500);

	setTimeout(() => clearInterval(checkInterval), 30000);
}

// Generic video player button injection
function mfInjectGenericButton() {
	const checkInterval = setInterval(() => {
		const videos = document.querySelectorAll("video");

		videos.forEach((video) => {
			if (video.querySelector(".mediaflow-control-btn")) return;

			// Find or create a controls container
			let controlsContainer = video.parentElement;
			controlsContainer.style.position = "relative";

			const button = document.createElement("button");
			button.className = "mediaflow-control-btn";
			button.innerHTML = `📥<span class="mediaflow-tooltip">Download</span>`;
			button.title = "Download Video";
			button.style.position = "absolute";
			button.style.bottom = "10px";
			button.style.right = "10px";
			button.style.background = "rgba(0, 0, 0, 0.7)";
			button.style.borderRadius = "4px";
			button.style.padding = "8px 12px";

			controlsContainer.appendChild(button);

			button.addEventListener("click", (e) => {
				e.stopPropagation();
				mfDownloadCurrentPage("video", button);
			});
		});

		if (document.querySelectorAll("video").length > 0) {
			clearInterval(checkInterval);
		}
	}, 500);

	setTimeout(() => clearInterval(checkInterval), 30000);
}

// Download handler
function mfDownloadCurrentPage(format, button) {
	const url = window.location.href;
	button.disabled = true;
	button.classList.add("downloading");
	button.innerHTML = `⏳<span class="mediaflow-tooltip">Starting...</span>`;

	fetch("http://localhost:7860/api/download", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ url, format }),
	})
		.then((res) => res.json())
		.then((data) => {
			if (data.success) {
				button.innerHTML = `✅<span class="mediaflow-tooltip">Download Started!</span>`;
				button.style.color = "#4CAF50";

				setTimeout(() => {
					button.innerHTML = `📥<span class="mediaflow-tooltip">Download</span>`;
					button.style.color = "#fff";
					button.disabled = false;
					button.classList.remove("downloading");
				}, 3000);
			} else {
				button.innerHTML = `❌<span class="mediaflow-tooltip">Failed</span>`;
				button.style.color = "#f44336";

				setTimeout(() => {
					button.innerHTML = `📥<span class="mediaflow-tooltip">Download</span>`;
					button.style.color = "#fff";
					button.disabled = false;
					button.classList.remove("downloading");
				}, 3000);
			}
		})
		.catch((err) => {
			console.error("Download error:", err);
			button.innerHTML = `❌<span class="mediaflow-tooltip">Error</span>`;
			button.disabled = false;
			button.classList.remove("downloading");

			setTimeout(() => {
				button.innerHTML = `📥<span class="mediaflow-tooltip">Download</span>`;
				button.disabled = false;
			}, 3000);
		});
}

// Initialize on page load
if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", mfInjectControlButton);
} else {
	mfInjectControlButton();
}

// Reinject if page changes (SPA)
const mfPageObserver = new MutationObserver(() => {
	mfInjectControlButton();
});

mfPageObserver.observe(document.body, {
	childList: true,
	subtree: true,
});

console.log("✅ MediaFlow control bar button loaded!");

// ========================================================================
