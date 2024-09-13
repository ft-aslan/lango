import {
	app,
	BrowserWindow,
	session,
	ipcMain,
	Tray,
	Menu,
	globalShortcut,
	clipboard
} from "electron";
import { join } from "path";
import { readFileSync, writeFileSync } from "fs";

function isDev() {
	return !app.isPackaged;
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
	// eslint-disable-line global-require
	app.quit();
}

// if (isDev()) {
// 	try {
// 		require("electron-reloader")(module, { ignore: "lango-test-db.json" });
// 	} catch {}
// }

var mainWindow;

function createWindow() {
	mainWindow = new BrowserWindow({
		width: 490,
		height: 600,
		webPreferences: {
			preload: join(import.meta.dirname, "preload.js"),
			nodeIntegration: false,
			contextIsolation: true,
			webSecurity: false
		}
	});

	if (isDev()) {
		mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
		// Open the DevTools.
		mainWindow.webContents.openDevTools();
	} else {
		mainWindow.setAlwaysOnTop(true, "screen-saver");
		mainWindow.loadFile(join(import.meta.dirname, "../dist/index.html"));
	}

	//TRAY
	let tray = new Tray(join(import.meta.dirname, "../../static/favicon.png"));
	const contextMenu = Menu.buildFromTemplate([
		{ label: "Item1", type: "radio" },
		{ label: "Item2", type: "radio" },
		{ label: "Item3", type: "radio", checked: true },
		{ label: "Item4", type: "radio" }
	]);
	tray.on("click", () => mainWindow.show());
	tray.setToolTip("This is my application.");
	tray.setContextMenu(contextMenu);
}

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

const filter = {
	urls: ["*://*/*"]
};

app.on("ready", async () => {
	const corsDisabler = session.defaultSession.webRequest.onBeforeSendHeaders(
		filter,
		(details, callback) => {
			if (!details.url.includes("localhost")) {
				if (details.requestHeaders) {
					details.requestHeaders["Origin"] = "";
				}
				if (details.requestHeaders["Sec-Fetch-Mode"]) {
					details.requestHeaders["Sec-Fetch-Mode"] = "";
				}
				if (details.requestHeaders["Sec-Fetch-Site"]) {
					details.requestHeaders["Sec-Fetch-Site"] = "";
				}
				if (details.requestHeaders["Sec-Fetch-Dest"]) {
					details.requestHeaders["Sec-Fetch-Dest"] = "";
				}
				if (details.requestHeaders["Referer"]) {
					details.requestHeaders["Referer"] = "";
				}
				if (details.requestHeaders["Origin"]) {
					details.requestHeaders["Origin"] = "";
				}
				if (details.referrer) {
					details.referrer = "";
				}
				callback({ requestHeaders: details.requestHeaders });
			} else {
				callback({ requestHeaders: details.requestHeaders });
			}
		}
	);
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", () => {
	// On OS X it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== "darwin") {
		app.quit();
	}
});

app.on("activate", () => {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

app.whenReady().then(() => {
	globalShortcut.register("CommandOrControl+Alt+T", () => {
		mainWindow.show();
		mainWindow.webContents.send("focusedToTheMainWindow", clipboard.readText());
	});
});

ipcMain.on("set-token-in-settings", (event, arg) => {
	// settings.set(arg.targetSettings, arg.value).then((result) => {});
});

ipcMain.on("set-wordbook-json", (event, arg) => {
	writeFile("./lango-test-db.json", JSON.stringify(arg));
});
ipcMain.on("request-wordbook-json", (event, arg) => {
	//TODO(fatih): if initial load dont give error not its existance
	let file = readFile("./lango-test-db.json");
	if (file) {
		let convertedFile = JSON.parse(file);
		if (convertedFile) {
			mainWindow.webContents.send("request-wordbook-json", convertedFile);
		} else {
			console.error("Cannot convert Wordbook JSON to Object");
		}
	} else {
		//TODO(fatih): give error if it has to be exist
	}
});

const readFile = function (path) {
	return readFileSync(path, "utf8");
};

const writeFile = function (path, output) {
	writeFileSync(path, output);
};
