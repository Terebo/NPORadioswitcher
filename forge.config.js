const path = require('path');
console.log(path.resolve(__dirname, "/build/icon.ico"));
module.exports = {
    packagerConfig: {},
    makers: [
        {
            name: '@electron-forge/maker-squirrel',
            config: {
              authors: "Terebo & NPO",
              iconUrl: __dirname + "/build/icon.ico",
              loadingGif: __dirname + "/build/NPO_Radio.gif",
              setupIcon: __dirname + "/build/icon.ico"
            }
        },
        {
            name: "@electron-forge/maker-zip",
            platforms: [
              "darwin"
            ]
          },
          {
            name: "@electron-forge/maker-deb",
            config: {}
          },
          {
            name: "@electron-forge/maker-rpm",
            config: {}
          }
    ]
}