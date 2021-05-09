var settings = require("electron-settings");
var ipcRenderer = require("electron").ipcRenderer;
const fs = require("fs");
const path = require("path");
const stations: stations = JSON.parse(fs.readFileSync(__dirname + "/dat/stations.json", {encoding: "utf8"}));

/* === interfaces === */

interface stations { 
    "NPORadio1": stationsType,
    "NPORadio2": stationsType,
    "NPO3FM": stationsType,
    "NPORadio4": stationsType,
    "NPORadio5": stationsType,
    "NPOFunX": stationsType,
    "2S&J": stationsType,
    "3FMalternative": stationsType,
    "3FMkx": stationsType,
    "4Concerten": stationsType,
    "5sterren": stationsType
};

type stationsType = {
    "name": string,
    "audiostream": string,
    "playlist-api": string,
    "guide-api": string,
    "img": string,
    "themeColour": string,
    "themeFilter": string,
    "discordImg": string,
    "modifier": number,
    "sassName": string,
    "font": string[]
};

type stationNames = "NPORadio1"|"NPORadio2"|"NPO3FM"|"NPORadio4"|"NPORadio5"|"NPOFunX"|"2S&J"|"3FMalternative"|"3FMkx"|"4Concerten"|"5sterren";
/* === Onload functions == */

//set up settings config
settings.configure({
    atomicSave: true,
    dir: "dat",
    fileName: "settings.json",
    numSpaces: 2,
    prettify: true
});

//load localisation file
var localisation: { [k: string]: any } = {};
if (settings.getSync("lang") === undefined) {
  const osLocale = require('os-locale');

  const langcode: string = osLocale.sync();
  try {
    localisation = require(__dirname + "/dat/lang/" + langcode + ".json");
  }
  catch (error) {
    if (error.code === "MODULE_NOT_FOUND") {
      localisation = require(__dirname + "/dat/lang/" + "en-GB" + ".json");
    }
    else {
      console.error(error);
    }
  }
}
else {
  localisation = require(__dirname + "/dat/lang/" + settings.getSync("lang") + ".json");
}

/* == eventsListeners == */

//event for switching tabs in the settings menu
document.querySelectorAll('.settings>.sidenav a').forEach(elm => {
    elm.addEventListener('click', e=>settingsTab(e));
});

//events for the buttons bar
window.addEventListener("resize", e => ResizeBar());
window.addEventListener("load", e => ResizeBar());

/* == functions in runtime == */

//buttons bar needs to be the same height as control panel, this ensures that
function ResizeBar() {
    var height: string = getComputedStyle(document.querySelector(".controlPanel")).height;
    document.getElementById("tabs").style.height = height;
}

//changes theme takes event from the menubar
ipcRenderer.on('changedTheme', function (even: any, message: string) {
    if (message === "ls") {
        document.body.classList.add("ColourAnimate");
        try {
            document.querySelector('link[href="dist/css/materializedark.css"]').setAttribute("href", "dist/css/materializelight.css");
        }
        catch (error) {
            if (!(error instanceof TypeError)) {
                console.error(error);
            }
        }
        settings.set('theme', 'light');
        setTimeout(() => {
            document.body.classList.remove("ColourAnimate");
        }, 302);
    }
    else if (message === "ds") {
        document.body.classList.add("ColourAnimate");
        try {
            document.querySelector('link[href="dist/css/materializelight.css"]').setAttribute("href", "dist/css/materializedark.css");
        }
        catch (error) {
            if (!(error instanceof TypeError)) {
                console.error(error);
            }
        }
        settings.set('theme', 'dark');
        setTimeout(() => {
            document.body.classList.remove("ColourAnimate");
        }, 302);
    }
})

//opens settings, takes event from the menu bar
ipcRenderer.on('openSettings', function (even: any, message: string) {
    document.querySelector("section.settings").classList.remove("scale-out");
    document.querySelector("section.settings").classList.add("scale-in");
    if(settings.getSync("temp.selectedTab") === "timetable") {
    loadTimetable(false);
    }
});

// closes the settings menu
document.querySelector("section.settings>.close").addEventListener("click", e => {
    document.querySelector("section.settings").classList.remove("scale-in");
    document.querySelector("section.settings").classList.add("scale-out");
});

//changes tabs
function settingsTab(e: Event) {
    const target: HTMLElement = e.target as HTMLElement;
    Array.from(target.parentElement.parentElement.children).forEach(element => {
        if(element.children[0].id != target.id) {
            element.children[0].classList.remove("NPOOrange");
        }
    });
    target.classList.add("NPOOrange");
    settings.set("temp.selectedTab", target.id);
    if(target.id === "timetable") {
        loadTimetable(true);
    }

}

//loads timetable
function loadTimetable(fromOtherTab: boolean) {
    var table: stationNames[][] = settings.getSync("table");
    var container: HTMLElement = document.querySelector('.settings [data-coupledid="timetable"] .container');
    var tablehtml = fs.readFileSync(path.join(__dirname, "/dat/table.html"), {encoding: "utf8"});
    container.innerHTML = tablehtml;
    table.forEach((e: stationNames[], i: number) => {
        let previousStation: stationNames;
        let samestationCounter: number = 0;
        var list: Element = container.children[i];
        e.forEach((f: stationNames, j: number)=> {
            if(f === previousStation) {
                samestationCounter++;
                if(samestationCounter >= 3) {
                    let start: HTMLElement = <HTMLElement>list.children[j + 1];
                    start.classList.add("img");
                    start.style.backgroundPosition = "center " + (4-((4/samestationCounter+1)*(0))*-1).toString + "rem";
                    for (let k = 0; k < samestationCounter; k++) {
                        let currentEl: HTMLElement = <HTMLElement>start.previousElementSibling;
                        start = currentEl;
                        start.classList.add("img");
                        let offset: number = 4-((4/samestationCounter+1)*(k+1))*-1;
                        start.style.backgroundPosition = "center " + offset + "rem";
                    }
                }
            }
            else {
                samestationCounter = 0;
            }
            list.children[j + 1].classList.add(stations[f].sassName, "deSat");
            previousStation = f;
        })
    })
};