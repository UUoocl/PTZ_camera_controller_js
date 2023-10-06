/* PTZ Camera Control 
2023 by uuoocl🪵
MIT license
An app to control the insta360 Link (and other?) Pan, Tilt, Zoom camera
*/


// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain} = require('electron')
const path = require('path')

let controlsWindow;

var websocketIP, websocketPort, websocketPassword, winCamera;
 
 async function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    title: __dirname,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

ipcMain.on('wsConnect-IP', (event) => {
  console.log("sending websocket details to new window") 
  event.returnValue = websocketIP
})

ipcMain.on('wsConnect-Port', (event) => {
  console.log("sending websocket details to new window") 
  event.returnValue = websocketPort
})

ipcMain.on('wsConnect-PW', (event) => {
  console.log("sending websocket details to new window") 
  speakerViewWindow = event.sender;
  event.returnValue = websocketPassword
})

ipcMain.on('camera-ID', (event) => {
    console.log("sending camera ID to camera window") 
    event.returnValue = winCamera;
})

/* ipcMain.on('change-slide', (event, Direction) => {
    if(Direction == "Next"){
      console.log("sending next slide message to slide window") 
      slidesWindow.webContents.send('next-slide');
    }else{
      console.log("sending previous slide message to slide window") 
      slidesWindow.webContents.send('previous-slide');
    }
})
 */

  ipcMain.on('open-controls-window', (event, IP, Port, PW, cameraId) => {
    controlsWindow = new BrowserWindow({
      width: 800,
      height: 800,
      frame: true,
      movable: true,
      titleBarOverlay: false,
      backgroundThrottling: false,
      transparent: true,
      titleBarStyle: 'customButtonsOnHover',
      webPreferences: {
        preload: path.join(__dirname, 'controls-preload.js')
        }
      })

      websocketIP = IP;
      websocketPort = Port;
      websocketPassword = PW;
      winCamera = cameraId;

      controlsWindow.loadFile('controls.html');    
})
 
 ipcMain.on('open-camera-window', (event, cameraId) => {
   console.log(`camera ID = ${cameraId}`)
    cameraWindow = new BrowserWindow({
      width: 1920,
      height: 1080,
      frame: false,
      titleBarOverlay: false,
      backgroundThrottling: false,
      transparent: true,
      titleBarStyle: 'customButtonsOnHover',
      webPreferences: {
        preload: path.join(__dirname, 'camera-preload.js')
        }
      })
  winCamera = cameraId;
  cameraWindow.loadFile('camera.html');    
})


   // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})