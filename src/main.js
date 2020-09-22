const { app, BrowserWindow, Menu } = require('electron')
const path = require('path')
const { Z_BEST_SPEED } = require('zlib');
const { ipcMain } = require('electron');
var settings = require(__dirname + '/settings/settings.json');
function createWindow () {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    },
    frame: false,
    icon: __dirname + '/img/icon/icon_large.png'
  })
  const menu = Menu.buildFromTemplate([
    {
      label: 'dev',
      submenu: [
        {label:'devtools', role: 'toggleDevTools', accelerator: 'CommandOrControl+Shift+I', icon: __dirname + "/img/icon/inspector-small.png"},
        {label: 'reload', role: 'forceReload', accelerator: 'CommandOrControl+Shift+R', icon: __dirname + "/img/icon/reload-small.png"}
      ]
    }
])
Menu.setApplicationMenu(menu); 
  // and load the index.html of the app.
  win.loadFile(__dirname + '/index.html');
  const tester = win.setThumbarButtons([
    {
      icon: path.join(__dirname, 'img', 'icon', 'pause-small.png'),
      click: () => {changePlayState('pause')},
      tooltip: 'Pauzeren'
    },
    {
      icon: path.join(__dirname, 'img', 'icon', 'play-small.png'),
      click: () => {changePlayState('play')},
      tooltip: 'Spelen',
    }
  ]);
  console.log(tester);
  function changePlayState(state) {
    if(state === "play") {
      win.webContents.send('changedPlayState', 'play');
    };
    if(state === "pause") {
      win.webContents.send('changedPlayState', 'pause');
    }
  }

  ipcMain.on('updateIcon', (event, arg) => {
    win.setOverlayIcon(
      __dirname + arg,
      "Test?");
  })
}

if(settings.startup) {
  console.log("aba");
}

console.log(settings)


console.log(app)
app.whenReady().then(createWindow);