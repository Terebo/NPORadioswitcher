var settings = require("electron-settings");
var ipcRenderer = require("electron").ipcRenderer;
const fs = require("fs");
const path = require("path");
var cron = require('node-cron');
var fetcha = require('node-fetch');
const stations: stations = JSON.parse(fs.readFileSync(__dirname + "/dat/stations.json", { encoding: "utf8" }));

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

interface playlist {
    "success": boolean,
    "message": string | null,
    "messages": string | null,
    "data": playlistSingle[]
}

interface guide {
    "success": boolean,
    "message": string | null,
    "messages": string | null,
    "data": guideSingle[]
}

interface playlistSingle {
    "startdatetime": string,
    "enddatetime": string,
    "stopdatetime": string,
    "title": string,
    "artist": string,
    "soloistsEnsemble": string,
    "image": string | null,
    "composer": string,
    "composer_name": string,
    "orchestra": string,
    "director": string,
    "labelcatalognr": string,
    "label": string,
    "external_id": string,
    "quicknote": string,
    "description": string,
    "extra_information": string,
    "image_url": string | null,
    "image_url_100x100": string | null,
    "image_url_200x200": string | null,
    "image_url_400x400": string | null,
    "spotify": null | string,
    "spotify_url": null | string
}

interface guideSingle {
    "startdatetime": string,
    "stopdatetime": string,
    "title": string,
    "broadcasters": [
        {
            "name": broadcasters,
            "alias": string
        }
    ],
    "broadcaster": broadcasters,
    "broadcaster_slug": string,
    "image": string,
    "presenters": string,
    "image_url": string,
    "image_url_100x100": string,
    "image_url_200x200": string,
    "image_url_400x400": string
}

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
    "font": string[],
    "fallbackProgImg": string
};

type stationNames = "NPORadio1" | "NPORadio2" | "NPO3FM" | "NPORadio4" | "NPORadio5" | "NPOFunX" | "2S&J" | "3FMalternative" | "3FMkx" | "4Concerten" | "5sterren";

type timeTableColouringstation = [boolean, stationNames | "none"]

type replaceColourCases = "waves-" | "-text" | "background" | "image"

type broadcasters = "Omroep MAX" | "VPRO" | "EO" | "KRO-NCRV" | "NPO" | "AVROTROS" | "NTR" | "WNL" | "BNNVARA" | "NOS" | "PowNed" | "HUMAN"

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
    elm.addEventListener('click', e => settingsTab(e));
});

//events for the buttons bar
window.addEventListener("resize", e => ResizeBar());
window.addEventListener("load", e => ResizeBar());

//event for initialising the station
window.addEventListener("load", e => changeStation(undefined));

//event for exiting out of the station selecting thingy
window.addEventListener("keyup", e => {
    if (e.key === "Escape" && timeTableColouringstationConfig[0]) {
        discardTimeTableSelectedStation();
    }
});

//event for the play/pause button
window.addEventListener("DOMContentLoaded", e => {
    document.querySelector("body > div.container-after-titlebar > main > div.current.row.col.s12.m12.l12.xl12 > div > div.npoRadioSwitcher.midGrey.controlPanel > a").addEventListener('click', e => playPause(e))
}
)


/* == sets up cron timers ==*/


cron.schedule('0,15,30,45 * * * *', () => {
    changeStation(undefined);
},
    { timezone: "Europe/Amsterdam" });

cron.schedule('*/2 * * * *', () => {
    changeSong(undefined);
},
    { timezone: "Europe/Amsterdam" });
    

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
    if (!station || station === undefined) {
        station = new selctedStation().name;
    }
    try {
    document.querySelector("audio").play();
    } catch(a){}
    getGuideJson(station).then(guidejson => {
        const guide: getGuideApi = new getGuideApi(guidejson);
        const prevStation: stationNames = settings.getSync("temp.station")||"startup";
        settings.setSync("temp.station", station);
        document.querySelector("audio").src = stations[station].audiostream;
        document.querySelectorAll('main [data-replaceColour="true"]').forEach((el: HTMLElement) => {
            var cases: replaceColourCases[] = <replaceColourCases[]>el.dataset.case.split(",");
            cases.forEach(e => {
                if (e === "waves-") {
                    el.classList.remove(e + stations[prevStation].sassName);
                    el.classList.add(e + stations[station].sassName);
                }
                else if (e === "-text") {
                    el.classList.remove(stations[prevStation].sassName + e);
                    el.classList.add(stations[station].sassName + e);
                }
                else if (e === "image") {
                }
                else {
                    el.classList.remove(stations[prevStation].sassName);
                    el.classList.add(stations[station].sassName);
                }
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
        var programContainer: Element = document.querySelector(".npoRadioSwitcher.lightGrey.infoScreen").children[0];
        var currentProgram: guideSingle = guide.getFetchedGuideByIndex();
        programContainer.children[0].innerHTML = currentProgram.title;
        programContainer.children[1].innerHTML = currentProgram.presenters;
        programContainer.children[2].children[0].className = "Ticon-" + currentProgram.broadcaster.replace("-", "").replace("Omroep ", "").toUpperCase();
        programContainer.children[2].children[1].innerHTML = currentProgram.broadcaster;
        programContainer.children[2].children[2].innerHTML = new Date(currentProgram.startdatetime).toLocaleTimeString([settings.getSync("lang"), "nl"], { hour: '2-digit', minute: '2-digit' }) + "-" + new Date(currentProgram.stopdatetime).toLocaleTimeString([settings.getSync("lang"), "nl"], { hour: '2-digit', minute: '2-digit' });
        (<HTMLImageElement>document.querySelector("#currentimg")).src = currentProgram.image_url_400x400===null?stations[station].fallbackProgImg:currentProgram.image_url_400x400;
        (<HTMLImageElement>programContainer.children[2].children[3]).src = "img/" + stations[station].img + ".svg";
        changeSong(station)
    })
}

/* = functions for changing current song = */

//changes songinfo

function changeSong(station?: stationNames): void {
    if (!station || station === undefined) {
        station = settings.getSync("temp.station");
    }
    getTracksJson(station).then(tracksjson => {
        const tracks: getTracksApi = new getTracksApi(tracksjson);
        var programContainer: Element = document.querySelector(".npoRadioSwitcher.lightGrey.infoScreen").children[1];
        var currentTrack: playlistSingle = tracks.getFetchedPlaylistByIndex();
        programContainer.children[0].innerHTML = currentTrack.title;
        programContainer.children[1].innerHTML = currentTrack.artist;
    })
}

/* = functions for the settings = */

//opens settings, takes event from the menu bar
ipcRenderer.on('openSettings', function (even: any, message: string) {
    document.querySelector("section.settings").classList.remove("scale-out");
    document.querySelector("section.settings").classList.add("scale-in");
    if (settings.getSync("temp.selectedTab") === "timetable" || !settings.hasSync("temp.selectedTab")) {
        loadTimetable(false);
        if (document.querySelector('.settings [data-coupledid="timetable"] .fixed-action-btn ul').childElementCount === 0) {
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
        if (element.children[0].id != target.id) {
            element.children[0].classList.remove("NPOOrange");
        }
    });
    target.classList.add("NPOOrange");
    settings.set("temp.selectedTab", target.id);
    Array.from(document.querySelector(`.settings>div`).children).forEach((element: HTMLDivElement) => {
        if(element.dataset.coupledid !== target.id) {
            element.classList.add("hide");
        }
    document.querySelector(`.settings>div>[data-coupledid="${target.id}"]`).classList.remove("hide");
    });
    switch (target.id) {
        case "timetable":
            loadTimetable(true);
            break;
        case "app":
            timeTableColouringstationConfig = [false, "none"];
            break;
        default:
            break;
    }
    if (target.id === "timetable") {
        loadTimetable(true);
    }

}

/* timetable tab */

//loads timetable
function loadTimetable(fromOtherTab: boolean): void {
    var table: stationNames[][] = settings.getSync("table");
    var container: HTMLElement = document.querySelector('.settings [data-coupledid="timetable"] .container');
    var tablehtml = fs.readFileSync(path.join(__dirname, "/dat/table.html"), { encoding: "utf8" });
    container.innerHTML = tablehtml;
    table.forEach((e: stationNames[], i: number) => {
        let previousStation: stationNames;
        let samestationCounter: number = 1;
        var list: Element = container.children[i];
        list.firstElementChild.innerHTML = list.firstElementChild.innerHTML.replace(/\${([^}]*)}/g, (r, k) => localisation[k]);
        e.forEach((f: stationNames, j: number) => {
            if (f === previousStation) {
                samestationCounter++;
                if (samestationCounter >= 4 && e[j + 1] !== f) {
                    let start: HTMLElement = <HTMLElement>list.children[j + 1];
                    const isEqual: boolean = samestationCounter % 2 === 0;
                    for (let k = 0; k < samestationCounter; k++) {
                        start.classList.add("img");
                        let offset: number = (k - 1 + (isEqual ? 0 : 0.5)) - (samestationCounter / 2);
                        start.style.backgroundPosition = "center " + offset + "rem";
                        let currentEl: HTMLElement = <HTMLElement>start.previousElementSibling;
                        start = currentEl;

                    }
                }
            }
            else {
                samestationCounter = 1;
            }
            if ((j + 1) % 4 === 1 && j !== 0) {
                list.children[j + 1].classList.add("hourTop");
            }
            if ((j + 1) % 4 === 0 && j !== 0) {
                list.children[j + 1].classList.add("hourBottom");
            }
            list.children[j + 1].classList.add(stations[f].sassName, "deSat", "pointer");
            list.children[j + 1].addEventListener("click", e => changeTimetable(<HTMLElement>e.target));
            list.children[j + 1].children[0].innerHTML = String(Math.floor(j / 4)) + ":" + String((j % 4) * 15) + " - " + stations[f].name;
            previousStation = f;
        })
    })
};

//creates buttons to interact with the timetable

function createTimeTableInteractionButtons(): void {
    var M = require('materialize-css/dist/js/materialize');
    var container: HTMLElement = document.querySelector('.settings [data-coupledid="timetable"] .fixed-action-btn ul');
    Object.keys(stations).forEach((e, i) => {
        console.log(i, Object.keys(stations).length-1, Object.keys(stations)[i]);
        if(i !== Object.keys(stations).length-1) {
        var name: stationNames = <stationNames>Object.keys(stations)[i];
        container.insertAdjacentHTML('beforeend', `<li><a class="btn-floating small ${stations[name].sassName} desat" onclick="changingTimetableSelectedStation('${name}')"><img src="img/${stations[name].img}.svg"></a></li>`)
        }
    });
    var elems = document.querySelectorAll('.fixed-action-btn');
    var instances = M.FloatingActionButton.init(elems, { hoverEnabled: false });
}

//sets selected colouring station

function changingTimetableSelectedStation(stationName: stationNames): void {
    timeTableColouringstationConfig = [true, stationName];
}

function discardTimeTableSelectedStation(): void {
    timeTableColouringstationConfig = [false, "none"];
}

//changes the station that's there

function changeTimetable(el: HTMLElement) {
    if (el.tagName == "SPAN") {
        el = el.parentElement;
    }
    if (timeTableColouringstationConfig[0]) {
        var column: number = Array.prototype.indexOf.call(el.parentElement.parentElement.children, el.parentElement);
        var row: number = Array.prototype.indexOf.call(el.parentElement.children, el) - 1;
        el.classList.remove(stations[<stationNames>settings.getSync("table")[column][row]].sassName);
        el.classList.add(stations[<stationNames>timeTableColouringstationConfig[1]].sassName);
        el.children[0].innerHTML = el.children[0].innerHTML.replace(stations[<stationNames>settings.getSync("table")[column][row]].name, stations[<stationNames>timeTableColouringstationConfig[1]].name);
        settings.setSync(`table[${column}][${row}]`, timeTableColouringstationConfig[1]);
    }
}

/* app settings */




/* = audio controls = */

//play/pasue audio

function playPause(e: Event) {
    var playing: boolean = settings.getSync("audioState");
    if(playing === undefined) {
        playing = true;
        settings.setSync("audioState", true);
        document.querySelector("audio").play();
    }
    playing = !document.querySelector("audio").paused;
    settings.setSync("audioState", !playing);
    if(!playing) {
        document.querySelector("audio").play();
        document.querySelector("body > div.container-after-titlebar > main > div.current.row.col.s12.m12.l12.xl12 > div > div.npoRadioSwitcher.midGrey.controlPanel > a:nth-child(1) > i").innerHTML = "pause";
    }
    if(playing) {
        document.querySelector("audio").pause();
        document.querySelector("body > div.container-after-titlebar > main > div.current.row.col.s12.m12.l12.xl12 > div > div.npoRadioSwitcher.midGrey.controlPanel > a:nth-child(1) > i").innerHTML = "play_arrow";
    }


}

/* == classes == */

//class that gets the station for the specified time
class selctedStation {
    name: stationNames;
    x: number;
    y: number;
    date: Date;
    InvokeDate: Date;
    constructor(public time: Date = new Date()) {
        this.InvokeDate = new Date();
        var row: number = Math.floor(((time.getHours() * 60) + time.getMinutes()) / 15);
        var column: number = (time.getDay() - 1) === -1 ? 6 : (time.getDay() - 1);
        this.name = settings.getSync(`table[${column}][${row}]`);
        this.x = column;
        this.y = row;
        this.date = time;
    }
    getY(): number {
        return (this.y);
    }
    getX(): number {
        return (this.x);
    }
    getDate(): Date {
        return (this.date);
    }
    getInvokedDate(): Date {
        return (this.InvokeDate);
    }
}

//class that gets the playlist API
class getPlaylistApi {
    playlist: playlist;
    InvokeDate: Date;
    constructor(public station: stationNames) {
        var parent: getPlaylistApi = this;
        this.InvokeDate = new Date();
        this.station = station;
        var XHR = new XMLHttpRequest();
        XHR.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                parent.playlist = JSON.parse(XHR.responseText);
            }
        }
        XHR.open("get", stations[station]["playlist-api"]);
        XHR.timeout = 3000;
        XHR.send();
    }
    getFetchedPlaylist(): playlist {
        return (this.playlist);
    }
    getFetchedPlaylistPart(index: number = 0): playlistSingle {
        return (this.playlist.data[index]);
    }
    getInvokedDate(): Date {
        return (this.InvokeDate);
    }
}

//class that gets the guide for a specified station

class getGuideApi {
    guide: guide;
    InvokeDate: Date;
    programmes: guideSingle[];
    constructor(public guideJson: guide) {
        let invoke: Date = new Date();
        this.InvokeDate = invoke;
        this.guide = guideJson;
    }
    getFetchedGuide(): guide {
        return (this.guide);
    }
    getFetchedGuideByIndex(index: number = 0): guideSingle {
        return (this.guide.data[index]);
    }
    getFetchedGuideByDate(ReqStartDate: DateCalc, ReqEndDate: DateCalc): guideSingle[] {
        this.guide.data.forEach((programme: guideSingle, i: number) => {
            var startDateTime: Date = new DateCalc(programme.startdatetime);
            var endDateTime: Date = new DateCalc(programme.stopdatetime);
            if (ReqStartDate.isBefore(endDateTime) && ReqEndDate.isAfter(startDateTime)) {
                this.programmes = [];
                this.programmes.push(programme);
                console.log("Request:" + [ReqEndDate, ReqStartDate] + "\nentered:" + [startDateTime, endDateTime] + "\nprogramme:", programme);
            }
        });
        return (this.programmes);
    }
    getInvokedDate(): Date {
        return (this.InvokeDate);
    }
}

//class that gets the tracks for a specified station

class getTracksApi {
    tracks: playlist;
    InvokeDate: Date;
    trackList: playlistSingle[];
    constructor(public guideJson: playlist) {
        let invoke: Date = new Date();
        this.InvokeDate = invoke;
        this.tracks = guideJson;
    }
    getFetchedPlaylist(): playlist {
        return (this.tracks);
    }
    getFetchedPlaylistByIndex(index: number = 0): playlistSingle {
        return (this.tracks.data[index]);
    }
    getFetchedPlaylistByDate(ReqStartDate: DateCalc, ReqEndDate: DateCalc): playlistSingle[] {
        this.tracks.data.forEach((track: playlistSingle, i: number) => {
            var startDateTime: Date = new DateCalc(track.startdatetime);
            var endDateTime: Date = new DateCalc(track.stopdatetime);
            if (ReqStartDate.isBefore(endDateTime) && ReqEndDate.isAfter(startDateTime)) {
                this.trackList = [];
                this.trackList.push(track);
                console.log("Request:" + [ReqEndDate, ReqStartDate] + "\nentered:" + [startDateTime, endDateTime] + "\nprogramme:", track);
            }
        });
        return (this.trackList);
    }
    getInvokedDate(): Date {
        return (this.InvokeDate);
    }
}

//class that extends date
interface Date {
    isAfter(secondDate: Date): boolean;
    isBefore(secondDate: Date): boolean;
    isEqual(secondDate: Date): boolean;
}
class DateCalc extends Date {
    isBefore(secondDate: Date): boolean {
        return (this.getTime() < secondDate.getTime());
    }
    isAfter(secondDate: Date): boolean {
        return (this.getTime() > secondDate.getTime());
    }
    isEqual(secondDate: Date): boolean {
        return (secondDate.getTime() === this.getTime());
    }
}



async function getGuideJson(station: stationNames): Promise<guide> {
    let url = stations[station]["guide-api"];
    var d: any = await fetcha(url);
    var json = await d.json();
    return (json);
}

async function getTracksJson(station: stationNames): Promise<playlist> {
    let url = stations[station]["playlist-api"];
    var d: any = await fetcha(url);
    var json = await d.json();
    return (json);
}
