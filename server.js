const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const path = require("path");
const os = require("os");
const fs = require("fs");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const PORT = 7860;

// Create HTTP server and Socket.IO server
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, "public")));

// Main page route
app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Download directory (Windows)
const DOWNLOADS_DIR = path.join(os.homedir(), "Downloads");

// Ensure downloads folder exists
if (!fs.existsSync(DOWNLOADS_DIR)) {
	fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

console.log("📁 Download directory:", DOWNLOADS_DIR);

// Store active downloads
let activeDownloads = {};

// Socket.IO connection
io.on("connection", (socket) => {
	console.log("✅ Client connected via Socket.IO:", socket.id);

	// Send current active downloads to newly connected client
	socket.emit("download-list", activeDownloads);

	socket.on("disconnect", () => {
		console.log("❌ Client disconnected:", socket.id);
	});
});

// Broadcast helper
function broadcastToAll(event, data) {
	io.emit(event, data);
}

// Health check endpoint
app.get("/api/ping", (req, res) => {
	res.json({ status: "ok", message: "MediaFlow server is running" });
});

// TEST ENDPOINT - Check if yt-dlp and ffmpeg are installed
app.get("/api/test", (req, res) => {
	const results = {
		server: "running ✅",
		yt_dlp: { installed: false, version: null, error: null },
		ffmpeg: { installed: false, version: null, error: null },
		downloads_folder: DOWNLOADS_DIR,
		timestamp: new Date().toISOString(),
	};

	// Test yt-dlp
	exec("yt-dlp --version", (error, stdout, stderr) => {
		if (error) {
			results.yt_dlp.error = error.message || "yt-dlp not found";
			results.yt_dlp.installed = false;
		} else {
			results.yt_dlp.installed = true;
			results.yt_dlp.version = stdout.trim();
		}

		// Test ffmpeg
		exec("ffmpeg -version", (error2, stdout2, stderr2) => {
			if (error2) {
				results.ffmpeg.error = error2.message || "ffmpeg not found";
				results.ffmpeg.installed = false;
			} else {
				results.ffmpeg.installed = true;
				results.ffmpeg.version = stdout2.split("\n")[0];
			}

			// Return results
			res.json(results);
		});
	});
});

// Main download endpoint
app.post('/api/download', (req, res) => {
	const { url, format } = req.body;

	if (!url) {
		return res.status(400).json({
			success: false,
			error: 'URL is required'
		});
	}

	try {
		new URL(url);
	} catch (err) {
		return res.status(400).json({
			success: false,
			error: 'Invalid URL'
		});
	}

	const downloadId = Date.now().toString();

	// Create download entry
	activeDownloads[downloadId] = {
		id: downloadId,
		url: url,
		format: format,
		title: new URL(url).hostname,
		progress: 0,
		status: 'downloading',
		speed: '0 KB/s',
		size: 'Calculating...',
		timeRemaining: '-- : --',
		startTime: new Date()
	};

	// Broadcast to all clients
	broadcastToAll('download-started', activeDownloads[downloadId]);

	console.log(`\n⬇️  Starting ${format} download from: ${url}`);

	// Build command (respecting quality if provided)
	let command = '';
	const quality = req.body.quality || 'best';

	switch (format) {
		case 'video':
			// Map quality to yt-dlp format
			let videoFormat = 'best[ext=mp4]';
			if (quality === '1080p') videoFormat = 'best[height<=1080][ext=mp4]';
			else if (quality === '720p') videoFormat = 'best[height<=720][ext=mp4]';
			else if (quality === '480p') videoFormat = 'best[height<=480][ext=mp4]';
			else if (quality === '360p') videoFormat = 'best[height<=360][ext=mp4]';
			else if (quality === '240p') videoFormat = 'best[height<=240][ext=mp4]';

			command = `yt-dlp --no-playlist -f "${videoFormat}" -o "${path.join(DOWNLOADS_DIR, '%(title)s.%(ext)s')}" "${url}"`;
			break;
		case 'audio':
			// Map quality to audio bitrate
			let audioBitrate = '192K';
			if (quality === '320') audioBitrate = '320K';
			else if (quality === '256') audioBitrate = '256K';
			else if (quality === '192') audioBitrate = '192K';
			else if (quality === '128') audioBitrate = '128K';

			command = `yt-dlp --no-playlist -f bestaudio --extract-audio --audio-format mp3 --audio-quality ${audioBitrate} -o "${path.join(DOWNLOADS_DIR, '%(title)s.%(ext)s')}" "${url}"`;
			break;
		case 'webm':
			let webmFormat = 'best[ext=webm]';
			if (quality === '1080p') webmFormat = 'best[height<=1080][ext=webm]';
			else if (quality === '720p') webmFormat = 'best[height<=720][ext=webm]';
			else if (quality === '480p') webmFormat = 'best[height<=480][ext=webm]';
			else if (quality === '360p') webmFormat = 'best[height<=360][ext=webm]';

			command = `yt-dlp --no-playlist -f "${webmFormat}" -o "${path.join(DOWNLOADS_DIR, '%(title)s.%(ext)s')}" "${url}"`;
			break;
		case 'image':
			command = `yt-dlp --no-playlist --write-thumbnail -o "${path.join(DOWNLOADS_DIR, '%(title)s-%(id)s.%(ext)s')}" "${url}"`;
			break;
		default:
			return res.status(400).json({ success: false, error: 'Invalid format' });
	}

	const timeout = 300000; // 5 minutes

	console.log(`🔧 Command: ${command.replace(url, '[URL]')}`);

	const proc = exec(command, {
		timeout: timeout,
		maxBuffer: 10 * 1024 * 1024
	}, (error, stdout, stderr) => {
		if (error) {
			console.error('❌ Error:', error.message);

			activeDownloads[downloadId].status = 'failed';
			activeDownloads[downloadId].error = error.message;

			broadcastToAll('download-failed', activeDownloads[downloadId]);

			return res.status(500).json({ success: false, error: error.message || 'Download failed' });
		}

		console.log('✅ Download completed!');
		console.log('📊 Output:', stdout);

		activeDownloads[downloadId].status = 'completed';
		activeDownloads[downloadId].progress = 100;
		activeDownloads[downloadId].endTime = new Date();

		broadcastToAll('download-completed', activeDownloads[downloadId]);

		res.json({
			success: true,
			message: `${format} download completed!`,
			file: 'File saved to Downloads folder'
		});
	});

	// Log realtime progress
	proc.stdout?.on('data', (data) => {
		console.log('📊 Progress:', data.toString().trim());
		// Optionally parse progress from stdout and update activeDownloads
	});

	proc.stderr?.on('data', (data) => {
		console.log('⚠️  Info:', data.toString().trim());
	});
});

async function processDownload(url, format, quality = 'best') {
	return new Promise((resolve, reject) => {
		let command = "";

		switch (format) {
			case "video":
				let videoFormat = 'best[ext=mp4]';
				if (quality === '1080p') videoFormat = 'best[height<=1080][ext=mp4]';
				else if (quality === '720p') videoFormat = 'best[height<=720][ext=mp4]';
				else if (quality === '480p') videoFormat = 'best[height<=480][ext=mp4]';
				else if (quality === '360p') videoFormat = 'best[height<=360][ext=mp4]';
				else if (quality === '240p') videoFormat = 'best[height<=240][ext=mp4]';

				command = `yt-dlp --no-playlist -f "${videoFormat}" -o "${path.join(DOWNLOADS_DIR, "%(title)s.%(ext)s")}" "${url}"`;
				break;

			case "audio":
				let audioBitrate = '192K';
				if (quality === '320') audioBitrate = '320K';
				else if (quality === '256') audioBitrate = '256K';
				else if (quality === '192') audioBitrate = '192K';
				else if (quality === '128') audioBitrate = '128K';

				command = `yt-dlp --no-playlist -f bestaudio --extract-audio --audio-format mp3 --audio-quality ${audioBitrate} -o "${path.join(DOWNLOADS_DIR, "%(title)s.%(ext)s")}" "${url}"`;
				break;

			case "webm":
				let webmFormat = 'best[ext=webm]';
				if (quality === '1080p') webmFormat = 'best[height<=1080][ext=webm]';
				else if (quality === '720p') webmFormat = 'best[height<=720][ext=webm]';
				else if (quality === '480p') webmFormat = 'best[height<=480][ext=webm]';
				else if (quality === '360p') webmFormat = 'best[height<=360][ext=webm]';

				command = `yt-dlp --no-playlist -f "${webmFormat}" -o "${path.join(DOWNLOADS_DIR, "%(title)s.%(ext)s")}" "${url}"`;
				break;

			case "image":
				command = `yt-dlp --no-playlist --write-thumbnail -o "${path.join(DOWNLOADS_DIR, "%(title)s-%(id)s.%(ext)s")}" "${url}"`;
				break;

			default:
				reject(new Error("Invalid format"));
				return;
		}

		// Increase timeout for large downloads
		const timeout = 300000; // 5 minutes

		console.log(`⬇️  Starting ${format} download from: ${url}`);
		console.log(`🔧 Command: ${command.replace(url, "[URL]")}`);

		const process = exec(
			command,
			{
				timeout: timeout,
				maxBuffer: 10 * 1024 * 1024, // 10MB buffer
			},
			(error, stdout, stderr) => {
				if (error) {
					console.error("❌ Error:", error.message);

					if (error.message.includes("timeout")) {
						reject(new Error("Download timed out - file may be too large"));
					} else if (error.message.includes("not found")) {
						reject(
							new Error(
								"yt-dlp is not installed or not in PATH. Install: pip install yt-dlp",
							),
						);
					} else {
						reject(new Error(error.message || "Download failed"));
					}
					return;
				}

				console.log("✅ Download completed");
				console.log("📝 Output:", stdout);

				resolve({
					message: `${format} download completed successfully!`,
					file: "Check your Downloads folder",
				});
			},
		);

		// Log realtime output
		process.stdout?.on("data", (data) => {
			console.log("📊 Progress:", data.toString().trim());
		});

		process.stderr?.on("data", (data) => {
			console.log("⚠️  Info:", data.toString().trim());
		});
	});
}

// Start server (HTTP + Socket.IO)
server.listen(PORT, () => {
	console.log("\n");
	console.log("╔════════════════════════════════════════╗");
	console.log("║      🎬 MediaFlow Server Started 🎬      ║");
	console.log("╚════════════════════════════════════════╝");
	console.log(`\n✅ Server running on: http://localhost:${PORT}`);
	console.log(`✅ WebSocket: ws://localhost:${PORT}`);
	console.log(`📁 Files 