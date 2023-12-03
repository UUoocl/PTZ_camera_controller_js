const { contextBridge, ipcRenderer } = require('electron')
var windowId;

contextBridge.exposeInMainWorld('electronAPI', {
  controlWindow: (IP, Port, PW, CameraID) => ipcRenderer.send('open-controls-window', IP, Port, PW, CameraID),
  cameraWindow: (CameraID) => ipcRenderer.send('open-camera-window', CameraID),
  getCameraId: () => ipcRenderer.send('get-cameras')
})

ipcRenderer.on('SET_CAMERA_SOURCE', async (event, deviceName, deviceID) => { 
  console.log(deviceID)
  var x = document.getElementById("cameras");
  var option = document.createElement("option");
  option.text = deviceName;
  option.id = deviceID;
  x.add(option);
  window.document.body.insertBefore(windowId, window.document.body.firstChild);
})