var settings = require("electron-settings");
var ipcRenderer = require("electron").ipcRenderer;
const fs = require("fs");
const path = require("path");
var cron = require('node-cron');
const stations: stations = JSON.parse(fs.readFileSync(__dirname + "/dat/stations.json", {encoding: "utf8"}));

/* == interfaces == */

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

type timeTableColouringstation = [boolean, stationNames|"none"]

type replaceColourCases = "waves"|"text"|"background"|"image"

/* == Global declarations == */

var timeTableColouringstationConfig: timeTableColouringstation = [false, "none"];

/* == Onload functions == */

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

//event for initialising the station
window.addEventListener("load", e=> changeStation(undefined));

//event for exiting out of the station selecting thingy
window.addEventListener("keyup", e => {
    if(e.key === "Escape" && timeTableColouringstationConfig[0]) {
        discardTimeTableSelectedStation();
    }
});

/* == sets up cron timers ==*/


cron.schedule('0,15,30,45 * * * *', () => {
    changeStation(undefined);
    console.log("15 mins!")
  },
  {timezone: "Europe/Amsterdam"});

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
});

/* = functions for changing channel = */

function changeStation(station?: stationNames): void {
    console.log(station, typeof station);
    if(!station || station === undefined) {
        station = new selctedStation().name;
    }
    console.log(station);
    const prevStation: stationNames = settings.getSync("temp.station");
    settings.setSync("temp.station", station);
    document.querySelector("audio").src = stations[station].audiostream;
    document.querySelectorAll('main [data-replaceColour="true"]').forEach((el: HTMLElement) => {
        var cases: replaceColourCases[] = <replaceColourCases[]>el.dataset.case.split(",");
        cases.forEach(e => {
            el.classList.remove(e + stations[prevStation].sassName);
            el.classList.add(e + stations[station].sassName);
        });
    });
    document.getElementById("fontDecleration").innerHTML = `@font-face {
        font-family: 'themeFont';
        src: url(font/${stations[station].font[0]}) format('truetype');
      }
  
      @font-face {
        font-family: 'themeFontBold';
        src: url(font/${stations[station].font[1]}) format('truetype');
      }`
    
}

class selctedStation {
    name: stationNames;
    x: number;
    y: number;
    constructor(public time: Date = new Date()) {
        var row: number = Math.floor(((time.getHours() * 60) + time.getMinutes()) / 15);
        var column: number = (time.getDay() - 1) === -1 ? 6 : (time.getDay() - 1);
        console.log(row, column, time.toLocaleString('en-GB', { timeZone: 'Europe/Amsterdam' }));
        this.name = settings.getSync(`table[${column}][${row}]`);
        this.x = column;
        this.y = row;
    }
    getY(): number {
        return(this.y);
    }
    getX(): number {
        return(this.x);
    }
}

/* = functions for the settings = */

//opens settings, takes event from the menu bar
ipcRenderer.on('openSettings', function (even: any, message: string) {
    document.querySelector("section.settings").classList.remove("scale-out");
    document.querySelector("section.settings").classList.add("scale-in");
    if(settings.getSync("temp.selectedTab") === "timetable") {
    loadTimetable(false);
    if(document.querySelector('.settings [data-coupledid="timetable"] .fixed-action-btn ul').childElementCount === 0) {
    createTimeTableInteractionButtons();
    }
    }
});

// closes the settings menu
document.querySelector("section.settings>.close").addEventListener("click", e => {
    document.querySelector("section.settings").classList.remove("scale-in");
    document.querySelector("section.settings").classList.add("scale-out");
    timeTableColouringstationConfig = [false, "none"];
});

//changes tabs
function settingsTab(e: Event): void {
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
    else {
        timeTableColouringstationConfig = [false, "none"];
    }

}

//loads timetable
function loadTimetable(fromOtherTab: boolean): void {
    var table: stationNames[][] = settings.getSync("table");
    var container: HTMLElement = document.querySelector('.settings [data-coupledid="timetable"] .container');
    var tablehtml = fs.readFileSync(path.join(__dirname, "/dat/table.html"), {encoding: "utf8"});
    container.innerHTML = tablehtml;
    table.forEach((e: stationNames[], i: number) => {
        let previousStation: stationNames;
        let samestationCounter: number = 1;
        var list: Element = container.children[i];
        list.firstElementChild.innerHTML = list.firstElementChild.innerHTML.replace(/\${([^}]*)}/g, (r, k) => localisation[k]);
        e.forEach((f: stationNames, j: number)=> {
            if(f === previousStation) {
                samestationCounter++;
                if(samestationCounter >= 4 && e[j+1] !== f) {
                    let start: HTMLElement = <HTMLElement>list.children[j + 1];
                    const isEqual: boolean = samestationCounter % 2 === 0;
                    for (let k = 0; k < samestationCounter; k++) {
                        start.classList.add("img");
                        let offset: number = (k-1 + (isEqual?0:0.5))-(samestationCounter/2);
                        start.style.backgroundPosition = "center " + offset + "rem";
                        let currentEl: HTMLElement = <HTMLElement>start.previousElementSibling;
                        start = currentEl;
                        
                    }
                }
            }
            else {
                samestationCounter = 1;
            }
            if((j+1)%4 === 1 && j !== 0) {
                list.children[j + 1].classList.add("hourTop");
                console.log(j, (j-1)%4, list.children[j + 1]);
            }
            if((j+1)%4 === 0 && j !== 0) {
                list.children[j + 1].classList.add("hourBottom");
                console.log(j, (j+1)%4, list.children[j + 1]);
            }
            list.children[j + 1].classList.add(stations[f].sassName, "deSat", "pointer");
            list.children[j + 1].addEventListener("click", e=>changeTimetable(<HTMLElement>e.target));
            list.children[j+1].children[0].innerHTML = String(Math.floor(j/4)) + ":" + String((j%4) * 15) + " - " + stations[f].name;
            previousStation = f;
        })
    })
};

//creates buttons to interact with the timetable

function createTimeTableInteractionButtons(): void {
    var M = require('materialize-css/dist/js/materialize');
    var container: HTMLElement = document.querySelector('.settings [data-coupledid="timetable"] .fixed-action-btn ul');
    Object.keys(stations).forEach((e, i) => {
        var name: stationNames = <stationNames>Object.keys(stations)[i];
        container.insertAdjacentHTML('beforeend', `<li><a class="btn-floating small ${stations[name].sassName} desat" onclick="changingTimetableSelectedStation('${name}')"><img src="img/${stations[name].img}.svg"></a></li>`)
        
    });   
    var elems = document.querySelectorAll('.fixed-action-btn');
    var instances = M.FloatingActionButton.init(elems, {hoverEnabled: false});
}

//sets selected colouring station

function changingTimetableSelectedStation(stationName: stationNames): void {
    timeTableColouringstationConfig = [true, stationName];
}

function discardTimeTableSelectedStation(): void {
    timeTableColouringstationConfig = [false, "none"];
    console.log(timeTableColouringstationConfig);
}

//changes the station that's there

function changeTimetable(el: HTMLElement) {
    if(el.tagName == "SPAN") {
        el = el.parentElement;
    }
    console.log(el ,el.tagName);
    if(timeTableColouringstationConfig[0]) {
    var column: number = Array.prototype.indexOf.call(el.parentElement.parentElement.children, el.parentElement);
    var row: number = Array.prototype.indexOf.call(el.parentElement.children, el) - 1;
    el.classList.remove(stations[<stationNames>settings.getSync("table")[column][row]].sassName);
    el.classList.add(stations[<stationNames>timeTableColouringstationConfig[1]].sassName);
    el.children[0].innerHTML = el.children[0].innerHTML.replace(stations[<stationNames>settings.getSync("table")[column][row]].name, stations[<stationNames>timeTableColouringstationConfig[1]].name);
    settings.setSync(`table[${column}][${row}]`, timeTableColouringstationConfig[1]);
    }
} 

