const customTitlebar = require('custom-electron-titlebar');
var settings = require("electron-settings");

settings.configure({
    atomicSave: true,
    dir: "dat",
    fileName: "settings.json",
    numSpaces: 2,
    prettify: true
})

var localisation: { [k: string]: any } = {};
if (settings.getSync("lang") === undefined) {
  const osLocale = require('os-locale');

  const langcode: string = osLocale.sync();
  try {
    localisation = require("../dat/lang/" + langcode + ".json");
  }
  catch (error) {
    if (error.code === "MODULE_NOT_FOUND") {
      localisation = require("../dat/lang/" + "en-GB" + ".json");
    }
    else {
      console.error(error);
    }
  }
}
else {
  localisation = require("../dat/lang/" + settings.getSync("lang") + ".json");
}

var settingsF = settings.getSync();

window.addEventListener('DOMContentLoaded', () => {
    if(settingsF.theme === "light") {
        document.querySelector('link[href="dist/css/materializedark.css"]').setAttribute("href", "dist/css/materializelight.css");
    };
    var Bar = new customTitlebar.Titlebar({
        backgroundColor: customTitlebar.Color.fromHex('#262d35'),
        icon: 'img/icon/icon.png'
    });
    Bar.updateTitle();
    document.querySelectorAll('[data-translate]').forEach(elm => {
        elm.innerHTML = elm.innerHTML.replace(/\${([^}]*)}/g, (r, k) => localisation[k]);
    })
    
});