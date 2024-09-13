// import { contextBridge, ipcRenderer } from "electron";
let electron = require("electron")

// var Native = {
//   isRenderer: process.type === "renderer",
//   ipc: {
//     send: (event) => {
//       for (
//         var _len = arguments.length,
//           args = Array(_len > 1 ? _len - 1 : 0),
//           _key = 1;
//         _key < _len;
//         _key++
//       ) {
//         args[_key - 1] = arguments[_key];
//       }

//       ipcRenderer.send.apply(ipcRenderer, [event].concat(args));
//     },
//     on: (event, callback) => {
//       ipcRenderer.on(event, callback);
//     },
//   },
// };

// process.once("loaded", function () {
//   global.Native = Native;
// });

electron.contextBridge.exposeInMainWorld("api", {
  send: (channel, data) => {
    // whitelist channels
    let validChannels = ["get-token-from-settings", "set-token-in-settings", "request-wordbook-json", "set-wordbook-json"];
    if (validChannels.includes(channel)) {
      electron.ipcRenderer.send(channel, data);
    }
  },
  receive: (channel, func) => {
    let validChannels = ["get-token-from-settings-reply", "focusedToTheMainWindow", "request-wordbook-json"];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender`
      electron.ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
});
// const {
//     contextBridge,
//     ipcRenderer
// } = require("electron");

// // Expose protected methods that allow the renderer process to use
// // the ipcRenderer without exposing the entire object
// contextBridge.exposeInMainWorld(
//     "api", {
//         send: (channel, data) => {
//             // whitelist channels
//             let validChannels = ["toMain"];
//             if (validChannels.includes(channel)) {
//                 ipcRenderer.send(channel, data);
//             }
//         },
//         receive: (channel, func) => {
//             let validChannels = ["fromMain"];
//             if (validChannels.includes(channel)) {
//                 // Deliberately strip event as it includes `sender`
//                 ipcRenderer.on(channel, (event, ...args) => func(...args));
//             }
//         }
//     }
// );
