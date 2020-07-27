const customTitlebar = require('custom-electron-titlebar');
const Electron = require('electron');
const $ = require('jquery');
const fs = require('fs');
const { start } = require('repl');
const { electron } = require('process');
var Bar;
var station = "NPORadio2";
const stations = require(__dirname + "/stations.json");
const settings = require(__dirname + "/settings/settings.json");
var prevVol;
var currentProgram;
var currentStation;
var currentStationI;
var day;
function bar() {
Bar = new customTitlebar.Titlebar({
    backgroundColor: customTitlebar.Color.fromHex('#262d35'),
    icon: 'img/icon/icon.png'
});
document.title = 'NPO Radio2 - Pauze';
Bar.updateTitle();
let newdate = new Date();
callEveryHour(newdate);
changevolume(settings.volume);
counter();
}

Electron.ipcRenderer.on('changedPlayState', function (even, message) {
    changedPlayState(message);
})

function changedPlayState(message) {
    switch (message) {
        case "play":
            document.title = currentStation + " - " + currentProgram;
            Bar.updateTitle();
            document.getElementById('soundplayer').volume = prevVol;
            document.getElementById('playbuttonimg').src = "img/icon/pause-small.svg";
            document.getElementById('playbuttonimg').classList.remove("spinning");
            document.getElementById('playbutton').onclick = function () { changedPlayState('pause') };
            break;
        case "pause":
            prevVol = document.getElementById('soundplayer').volume
            document.title = currentStation + " - " + 'Pauze';
            Bar.updateTitle();
            document.getElementById('soundplayer').volume = 0;
            document.getElementById('playbuttonimg').src = "img/icon/play-small.svg";
            document.getElementById('playbutton').onclick = function () { changedPlayState('play') };
            break;
        case "reconnect":
            prevVol = document.getElementById('soundplayer').volume
            document.title = currentStation + " - " + 'Herverbinden';
            Bar.updateTitle();
            document.getElementById('soundplayer').volume = 0;
            document.getElementById('playbuttonimg').src = "img/icon/recon-small.svg";
            document.getElementById('playbuttonimg').classList.add("spinning");
            document.getElementById('playbutton').onclick = function () {};
            break;
        default:
            break;
    }

}

function changeChanel(channel) {
            document.getElementById('soundplayer').src = stations[channel].audiostream;
            document.getElementById('soundplayer').play();
            station = channel;
            document.documentElement.style.setProperty('--themeColour', stations[channel].themeColour);
            document.documentElement.style.setProperty('--themeFilter', stations[channel].themeFilter);
            updateGuide(station);
}

setInterval(() => {
    updateGuide(station);
}, 300000);

function updateGuide(station) {
    $.ajax({
        type: "GET",
        url: stations[station]["guide-api"],
        dataType: "json",
        success: function (response) {
            console.log(response);
            document.getElementById('currentimg').src = response.data[0].image_url_400x400;
            document.getElementById('DJ').innerText = response.data[0].presenters;
            document.getElementById('programname').innerText = response.data[0].title;
            currentProgram = response.data[0].title;
            currentStation = stations[station].name;
            document.getElementById('broadcaster').innerText = response.data[0].broadcaster;
            var startTime = response.data[0].startdatetime.split('T');
            var endTime = response.data[0].stopdatetime.split('T');
            document.getElementById('time').innerText = startTime[1].substring(0, 5) + "-" + endTime[1].substring(0, 5);

            document.title = stations[station].name + " - " + response.data[0].title;
            Bar.updateTitle();
            const guideContainer = document.getElementById('guide');
            guideContainer.innerHTML = "";
            response.data.forEach((element, index) => {
                if (index !== 0) {
                    const startTime = parseInt((element.startdatetime).split('T')[1].split(':')[0]) * 60 + parseInt((element.startdatetime).split('T')[1].split(':')[1]);
                    const stationEndTime = parseInt(settings.timetable[day][currentStationI].endtime[0]) * 60 + parseInt(settings.timetable[day][currentStationI].endtime[1]);
                    const stationstartTime = parseInt(settings.timetable[day][currentStationI].starttime[0]) * 60 + parseInt(settings.timetable[day][currentStationI].starttime[1]);
                    if (startTime <= stationEndTime && startTime >= stationstartTime) {
                        var container = document.createElement('div');
                        container.className = "guide container";
                        var p = document.createElement('p');
                        var span1 = document.createElement('span');
                        var span2 = document.createElement('span');
                        var span3 = document.createElement('span');
                        span1.id = "ProgramNameGuide";
                        span2.id = "PresenterGuide";
                        span3.id = "BroadcasterGuide";
                        span1.innerText = element.title;
                        span2.innerText = element.presenters;
                        span3.innerText = element.broadcaster;
                        p.appendChild(span1);
                        p.appendChild(document.createElement('br'));
                        p.appendChild(span2);
                        p.appendChild(span3);
                        guideContainer.appendChild(p);
                    }
                }
            }); 
    }});
    $.ajax({
        type: "GET",
        url: stations[station]["playlist-api"],
        dataType: "json",
        success: function (response) {
            console.log(response.data)
            const songTitle = document.getElementById('songtitle');
            const songArtist = document.getElementById('songartist');
            console.log(songArtist, songTitle)
            songTitle.innerText = response.data[0].title;
            songArtist.innerText = response.data[0].artist;
        }
    });
}

function changeTab(element) {
    if (!element.classList.value.includes("active")) {
        const oldelement = document.querySelector('.active');
        oldelement.classList.remove('active')
        element.classList.add('active');
        const thisElement = document.getElementById(element.dataset.name);
        const otherElement = thisElement.nextElementSibling || thisElement.previousElementSibling;
        thisElement.classList.add("invisible");
        otherElement.classList.remove("invisible");
    }
}

function counter() {
var nextDate = new Date();
if (nextDate.getMinutes() === 00 || nextDate.getMinutes() === 15 || nextDate.getMinutes() === 30 || nextDate.getMinutes() === 45) { // You can check for seconds here too
    console.log(nextDate);
    callEveryHour(nextDate);
    setTimeout(() => {
        counter()
    }, 61000);
} else {
    if (nextDate.getMinutes() >= 45) {
        nextDate.setHours(nextDate.getHours() + 1);
        nextDate.setMinutes(0);
    }
    else {
    nextDate.setMinutes((Math.round((nextDate.getMinutes() + 15)/15) * 15) % 60);
    }
    nextDate.setSeconds(0);// I wouldn't do milliseconds too ;)
    var difference = nextDate - new Date();
    setTimeout(counter, difference);
}
}

function callEveryHour(date) {
    hour = date.getHours();
    minute = date.getMinutes();
    day = (date.getDay() + 6) % 7;
    var i = -1;
    const nowstuff = hour * 60 + minute;
    keepChecking();
    function keepChecking() {
        i++;
        thisstuffstart = settings.timetable[day][i].starttime[0] *60 + settings.timetable[day][i].starttime[1];
        thisstuffend = settings.timetable[day][i].endtime[0] *60 + settings.timetable[day][i].endtime[1];
        if (thisstuffstart <= nowstuff && thisstuffend > nowstuff) {
            const selStation = settings.timetable[day][i].station; 
            const nextStation = settings.timetable[day][i + 1].station;
            document.getElementById('currentStation').src = "img/" + stations[selStation].img + ".svg";
            document.getElementById('station').innerText = stations[selStation].name;
            document.getElementById('stationTime').innerText = (settings.timetable[day][i].starttime[0].toString()) + ":" + (settings.timetable[day][i].starttime[1] === 0?"00":settings.timetable[day][i].starttime[1]) + " - " + (settings.timetable[day][i].endtime[0].toString()) + ":" + (settings.timetable[day][i].endtime[1] === 0?"00":settings.timetable[day][i].endtime[1]);
            document.getElementById('nextStation').src = "img/" + stations[nextStation].img + ".svg";
            document.getElementById('nextStationName').innerText = stations[nextStation].name;
            document.getElementById('nextstationTime').innerText = (settings.timetable[day][i + 1].starttime[0].toString()) + ":" + (settings.timetable[day][i + 1].starttime[1] === 0?"00":settings.timetable[day][i + 1].starttime[1]) + " - " + (settings.timetable[day][i + 1].endtime[0].toString()) + ":" + (settings.timetable[day][i + 1].endtime[1] === 0?"00":settings.timetable[day][i + 1].endtime[1]);
            station = selStation;
            currentStationI = i;
            changeChanel(station);
        }
        else {
            keepChecking();
        }
    }
}

function changevolume(value) {
    document.getElementById('volumeSlider').value = parseInt(value);
    settings.volume = value;
    fs.writeFileSync(__dirname + '/settings/settings.json', JSON.stringify(settings, null, 2));
    value = value / 100;
    document.getElementById('soundplayer').volume = value;
    if (value == 0) {
        document.getElementById('volumebutton').src = "img/icon/volume-0-small.svg";
        document.getElementById('volumebuttoncontainer').onclick = function () { changevolume('100')};
    }
    else {
        document.getElementById('volumebutton').src = "img/icon/volume-1-small.svg";
        document.getElementById('volumebuttoncontainer').onclick = function () { changevolume('0')};
    }
}

const lineBinder = () => {
    const online = navigator.onLine ? 'play' : 'reconnect'
    changedPlayState(online);
}

window.addEventListener('offline', lineBinder);
window.addEventListener('online', lineBinder);

async function openAbout(reason) {
    var opacity;
    var changer;
    About = document.getElementById('aboutWindow');
    AboutInner = document.getElementById('aboutContainer');
    body = document.querySelector('.container-after-titlebar');
    body.scrollTo(0,0);
    if (reason === "open") {
        opacity = 0;
        changer = 1;
        body.style.overflow = "hidden";
        About.style.display = "block";
    }
    if (reason === "close") {
        opacity = 100;
        changer = -1;
    }
    var timer = setInterval(() => {
        opacity = opacity + changer;
        About.style.opacity = (opacity * 5) / 100;
        if(opacity === 100 || opacity === 0) {
            if (reason === "close") {
                About.style.display = "none";
                body.style.overflowY = "auto";
            }
            clearInterval(timer);
        }
    }, 3);
}

async function openSettings(reason) {
    window.scrollTo(0, 0);
    var opacity;
    var changer;
    Settings = document.getElementById('settingsWindow');
    SettingsInner = document.getElementById('settingsContainer');
    body = document.querySelector('.container-after-titlebar');
    if (reason === "open") {
        opacity = 0;
        changer = 1;

        body.style.overflow = "hidden";
        Settings.style.display = "block";
    }
    if (reason === "close") {
        opacity = 100;
        changer = -1;
    }
    var timer = setInterval(() => {
        opacity = opacity + changer;
        Settings.style.opacity = (opacity * 5) / 100;
        if(opacity === 100 || opacity === 0) {
            if (reason === "close") {
                Settings.style.display = "none";
                body.style.overflow = "auto";
            }
            clearInterval(timer);
        }
    }, 1);
}

function externalOpener(url) {
    Electron.shell.openExternal(url);
}