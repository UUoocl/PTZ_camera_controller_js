const { contextBridge, ipcRenderer } = require('electron');

const cameraID =  ipcRenderer.sendSync('camera-ID');
window.addEventListener('DOMContentLoaded', () => {

//console.log("cameraID ", cameraID )

const dataElement = document.createElement(`data`);
dataElement.setAttribute("id", "cameraID");
dataElement.setAttribute("data-camera-Id", cameraID);

window.document.body.insertBefore(dataElement, window.document.body.firstChild);
//window.document.body.append(dataElem);

const video = document.querySelector("video");
console.log("cameraID ", cameraID )

const constraints = {
  audio: false,
  video: {
    deviceId: `${cameraID}`,
    aspectRatio: 1.7777777778, 
  },
};

navigator.mediaDevices
  .getUserMedia(constraints)
  .then((stream) => {
    const videoTracks = stream.getVideoTracks();
    console.log("Got stream with constraints:", constraints);
    console.log(`Using video device: ${videoTracks[0].label}`);
    stream.onremovetrack = () => {
      console.log("Stream ended");
    };
    video.srcObject = stream;
    video.play();
  })
  .catch((error) => {
    if (error.name === "OverconstrainedError") {
      console.error(
        `The resolution ${constraints.video.width.exact}x${constraints.video.height.exact} px is not supported by your device.`,
      );
    } else if (error.name === "NotAllowedError") {
      console.error(
        "You need to grant this page permission to access your camera and microphone.",
      );
    } else {
      console.error(`getUserMedia error: ${error.name}`, error);
    }
  });

})