![Fancy gif](/build/NPO_Radio.gif)

# NPORadioswitcher
 an electron app to automagicly switch between NPO radio channels
 This is not in any way shape or form affiliated with NPO
 At the moment it's proof of concept, it isn't entirely done yet, but i just wanted something to be out here.

Have you ever felt like wanting to listen to NPO 3FM at 4, and NPO Radio 1 at 5. but felt too lazy to change chanels yourself? here's a handy program to do that automagicly!

 This Electron app can switch between NPO Radio stations automaticly, at the moment there's no GUI to set this up and you'll have to go into ```[your path to the isnallation (probaly user/appData/local/nporadioswitcher)]/app-1.0.0/resources/app/src/settings/settings.json``` here you'll find a timetable that should be quite self explanitory. This is very much a work in progress and at the moment there's only info about the current program displayed and all the devtools are still exposed. I hope to have the full functionality in the next commit i do to this git.

 You can download a precompiled installer .exe [here](/github/nporadioswitcher-1.0.0 Setup.exe)

# what's in the program at the moment and what i have planned
 - [x] audio stream for every station
 - [ ] audio streams for themechanels
 - [x] API info for current program
 - [ ] API info for next programs with dynamic changing of station api from timetable
 - [x] automagical switching of stations
 - [x] information about your timetable of stations
 - [ ] GUI for your timetable/settings
 - [ ] more options


I do not in any shape, way or form claim any of the imagary, logos and/or audio that's used in this project, they all belong to the NPO(Nederlandse Publieke Omroep). I also can't guarantee that all the data is up to date, as all the data is pulled directly from NPO's api.
This is just a personal project without any intention of making money/using it commercially.