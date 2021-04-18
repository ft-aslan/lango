const { app, BrowserWindow, session } = require("electron");
const path = require("path");
const axios = require("axios");

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false,
        },
    });

    win.loadURL("http://localhost:3000");
}

app.whenReady().then(() => {
    createWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

const filter = {
    urls: ["*://*/*"],
};

app.on("ready", async () => {
    const corsDisabler = session.defaultSession.webRequest.onBeforeSendHeaders(
        filter,
        (details, callback) => {
            if (!details.url.includes("localhost")) {
                if (details.requestHeaders) {
                    details.requestHeaders["Origin"] = null;
                }
                if (details.requestHeaders["Sec-Fetch-Mode"]) {
                    details.requestHeaders["Sec-Fetch-Mode"] = null;
                }
                if (details.requestHeaders["Sec-Fetch-Site"]) {
                    details.requestHeaders["Sec-Fetch-Site"] = null;
                }
                if (details.requestHeaders["Sec-Fetch-Dest"]) {
                    details.requestHeaders["Sec-Fetch-Dest"] = null;
                }
                if (details.requestHeaders["Referer"]) {
                    details.requestHeaders["Referer"] = null;
                }
                if (details.headers) {
                    details.headers["Origin"] = null;
                }
                if (details.referrer) {
                    details.referrer = null;
                }
                callback({ requestHeaders: details.requestHeaders });
            } else {
                callback({ requestHeaders: details.requestHeaders });
            }
        }
    );
});
