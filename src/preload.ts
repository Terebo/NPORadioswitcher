const customTitlebar = require('custom-electron-titlebar');

window.addEventListener('DOMContentLoaded', () => {
    var Bar = new customTitlebar.Titlebar({
        backgroundColor: customTitlebar.Color.fromHex('#262d35'),
        icon: 'img/icon/icon.png'
    });
    Bar.updateTitle();
});