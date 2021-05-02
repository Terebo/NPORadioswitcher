import { app, BrowserWindow, Menu } from "electron";
import * as path from "path";

console.log("you're just dumb");
console.log(path.join(__dirname , "../img/icon/icon_large.png"));

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 640,
    width: 930,
    minHeight: 640,
    minWidth: 930,
    icon: path.join(__dirname , "../img/icon/icon_large.png"),
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, "preload.js"),
      enableRemoteModule: true
    },
    frame: false
  });

  const menu = Menu.buildFromTemplate([
    {
      label: 'dev',
      submenu: [
        {label:'devtools', role: 'toggleDevTools', accelerator: 'CommandOrControl+Shift+I', icon: __dirname + "/../img/icon/inspector-small.png"},
        {label: 'reload', role: 'forceReload', accelerator: 'CommandOrControl+Shift+R', icon: __dirname + "/../img/icon/reload-small.png"}
      ]
    }
])
Menu.setApplicationMenu(menu); 
  // load index.html of the app.
  mainWindow.loadFile(path.join(__dirname, "../index.html"));
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
