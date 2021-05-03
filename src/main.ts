import { app, BrowserWindow, Menu } from "electron";
import * as path from "path";
var settings = require("electron-settings");

settings.configure({
    atomicSave: true,
    dir: "dat",
    fileName: "settings.json",
    numSpaces: 2,
    prettify: true
})

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 640,
    width: 930,
    minHeight: 640,
    minWidth: 930,
    icon: path.join(__dirname, "../img/icon/icon_large.png"),
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, "preload.js"),
      enableRemoteModule: true,
      contextIsolation: false
    },
    frame: false
  });

  const menu = Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        { type: 'radio', label: 'dark theme', checked: settings.getSync("theme")==="light"?false:true, click(menuItem, browserWindow, event) { switchThme(menuItem, browserWindow, event) }, id: 'ds' },
        { type: 'radio', label: 'light theme', checked: settings.getSync("theme")==="dark"?false:true, click(menuItem, browserWindow, event) { switchThme(menuItem, browserWindow, event) }, id: 'ls' },
        { type: 'separator' },
        { label: 'settings', accelerator: 'CommandOrControl+Shift+S', click(menuItem, browserWindow, event) { openSettings(menuItem, browserWindow, event) }, icon: __dirname + "/../img/icon/settings-small.png" }
      ]
    },
    {
      label: 'dev',
      submenu: [
        { label: 'devtools', role: 'toggleDevTools', accelerator: 'CommandOrControl+Shift+I', icon: __dirname + "/../img/icon/inspector-small.png" },
        { label: 'reload', role: 'forceReload', accelerator: 'CommandOrControl+Shift+R', icon: __dirname + "/../img/icon/reload-small.png" }
      ]
    }
  ])
  Menu.setApplicationMenu(menu);
  // load index.html of the app.
  mainWindow.loadFile(path.join(__dirname, "../index.html"));

  function switchThme(menuItem: Electron.MenuItem, browserWindow: BrowserWindow, event: Electron.KeyboardEvent) {
    mainWindow.webContents.send('changedTheme', menuItem.id);
  }
  function openSettings(menuItem: Electron.MenuItem, browserWindow: BrowserWindow, event: Electron.KeyboardEvent) {
  }
}

app.on("ready", () => {
  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
