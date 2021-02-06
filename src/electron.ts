import {
  app,
  BrowserWindow,
  ipcMain,
  globalShortcut,
  clipboard,
  Menu,
  Tray
} from "electron";

import settings from "electron-settings";
import * as path from "path";

// Live Reload
require("electron-reload")(__dirname, {
  electron: path.join(__dirname, "../../node_modules", ".bin", "electron"),
  awaitWriteFinish: true,
  hardResetMethod: 'exit'
});

var mainWindow: BrowserWindow;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  // eslint-disable-line global-require
  app.quit();
}

var tray : Tray = null;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    // frame: false,
    webPreferences: {
      preload: path.join(__dirname, "../../src/preload.js"),
      nodeIntegration: false,
      contextIsolation: true
    },
  });

  mainWindow.setAlwaysOnTop(true,"screen-saver");

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, "../index.html"));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  //TRAY
  tray = new Tray(path.join(__dirname, "../favicon.png"))
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Item1', type: 'radio' },
    { label: 'Item2', type: 'radio' },
    { label: 'Item3', type: 'radio', checked: true },
    { label: 'Item4', type: 'radio' }
  ])
  tray.on("click",() => mainWindow.show())
  tray.setToolTip('This is my application.')
  tray.setContextMenu(contextMenu)
};

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
    console.log(clipboard.readText());
    mainWindow.webContents.send("focusedToTheMainWindow", clipboard.readText());
  });
});

ipcMain.on("get-token-from-settings", (event, arg) => {
  settings.get(arg as string).then(result => {
    event.reply("get-token-from-settings-reply", result);
  });
});
ipcMain.on("set-token-in-settings", (event, arg) => {
  settings.set(arg.targetSettings, arg.value).then(result => {

  });

});
