const customTitlebar = require('custom-electron-titlebar');
import fs = require("fs");
import path = require("path");
var settings = require("electron-settings");
const osLocale = require('os-locale');

settings.configure({
    atomicSave: true,
    dir: "dat",
    fileName: "settings.json",
    numSpaces: 2,
    prettify: true
});


var langcode: string;

var localisation: { [k: string]: any } = {};
if (settings.getSync("lang") === undefined) {
  

  langcode = osLocale.sync();
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
    fs.readdirSync(path.join(__dirname, "../dat/lang")).forEach((element: string) => {
      element = element.replace(".json", "");
      let option: HTMLOptionElement = document.createElement("option");
      if(element === (settings.getSync("lang")||osLocale.sync())) {
        option.setAttribute("selected", "true");
      }
      let tempLang: any = require(path.resolve(__dirname, "../dat/lang", (element + ".json")));
      option.value = element;
      option.innerText = `${tempLang.LangName} ${tempLang.LangRegion===null?"":"("+tempLang.LangRegion+")"}`;
      document.querySelector('.settings>div>[data-coupledid="display"] #langSelector').appendChild(option);
    });
    
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
    var M = require('materialize-css/dist/js/materialize');
      var elems = document.querySelectorAll('select');
      var instances = M.FormSelect.init(elems, {classes: "npoRadioSwitcher-text text-text"});
});