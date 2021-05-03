const customTitlebar = require('custom-electron-titlebar');
var settings = require("electron-settings");

settings.configure({
    atomicSave: true,
    dir: "dat",
    fileName: "settings.json",
    numSpaces: 2,
    prettify: true
})
var settingsF = settings.getSync();
console.log(settingsF);

window.addEventListener('DOMContentLoaded', () => {
    if(settingsF.theme === "light") {
        document.querySelector('link[href="dist/css/materializedark.css"]').setAttribute("href", "dist/css/materializelight.css");
    };
    var Bar = new customTitlebar.Titlebar({
        backgroundColor: customTitlebar.Color.fromHex('#262d35'),
        icon: 'img/icon/icon.png'
    });
    Bar.updateTitle();
});