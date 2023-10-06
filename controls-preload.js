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
    updateButtons();
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

function updateButtons() {
    const stream = video.srcObject;
    console.log("stream object:");
    console.log(stream);
    if (!stream) {
      document
        .querySelectorAll(`[data-name]`)
        .forEach((item) => (item.disabled = true));
      return;
    }
    const [videoTrack] = stream.getVideoTracks();
    const capabilities =
      "getCapabilities" in videoTrack ? videoTrack.getCapabilities() : {};
    const settings = videoTrack.getSettings();
  
    log(
      `videoTrack.getConstraints() -> ${JSON.stringify(
        videoTrack.getConstraints()
      )}`
    );
  
    if ("getCapabilities" in videoTrack) {
      log(`videoTrack.getCapabilities() -> ${JSON.stringify(capabilities)}`);
    } else {
      log(`⚠️ "getCapabilities" in videoTrack -> false`);
    }
  
    log(`videoTrack.getSettings() -> ${JSON.stringify(settings)}`);
  
    ["pan", "tilt", "zoom"].forEach((name) => {
      if (name in capabilities) {
        log(
          `videoTrack.getCapabilities().${name} -> { min: ${capabilities[name].min}, max: ${capabilities[name].max}, step: ${capabilities[name].step} }`
        );
        log(`videoTrack.getSettings().${name} -> ${settings[name]}`);
      } else {
        log(`⚠️ "${name}" in videoTrack.getCapabilities() -> false`);
      }
  
      const buttons = Array.from(
        document.querySelectorAll(`button[data-name="${name}"]`)
      );
      buttons.forEach((button) => {
        button.disabled = !(name in capabilities);
      });
  
      const ranges = Array.from(
        document.querySelectorAll(`input[data-name="${name}"]`)
      );
      ranges.forEach((range) => {
        range.disabled = !(name in capabilities);
      });
  
      if (name in capabilities) {
        buttons.forEach((button) => {
          button.onclick = onButtonClick;
        });
        ranges.forEach((range) => {
          range.oninput = onRangeChange;
        });
        if (name == "pan") {
          panLeftButton.dataset.step = -capabilities.pan.step;
          panRightButton.dataset.step = capabilities.pan.step;
          panRange.min = capabilities.pan.min;
          panRange.max = capabilities.pan.max;
          panRange.step = capabilities.pan.step;
          panRange.value = settings.pan;
        } else if (name == "tilt") {
          tiltUpButton.dataset.step = capabilities.tilt.step;
          tiltDownButton.dataset.step = -capabilities.tilt.step;
          tiltRange.min = capabilities.tilt.min;
          tiltRange.max = capabilities.tilt.max;
          tiltRange.step = capabilities.tilt.step;
          tiltRange.value = settings.tilt;
        } else if (name == "zoom") {
          zoomInButton.dataset.step = capabilities.zoom.step;
          zoomOutButton.dataset.step = -capabilities.zoom.step;
          zoomRange.min = capabilities.zoom.min;
          zoomRange.max = capabilities.zoom.max;
          zoomRange.step = capabilities.zoom.step;
          zoomRange.value = settings.zoom;
        }
      }
    });
  
    updateMediaSession();
  
    async function onButtonClick(event) {
      const name = event.target.dataset.name;
      if (!(name in videoTrack.getSettings())) {
        log(`⚠️ Argh! "${name}" is not in videoTrack.getSettings() anymore.`);
        return;
      }
      const constraint =
        videoTrack.getSettings()[name] + parseFloat(event.target.dataset.step);
      const constraints = { advanced: [{}] };
      constraints.advanced[0][name] = constraint.toFixed(1);
      const prefix = `videoTrack.applyConstraints({"advanced": [{"${name}": ${constraint.toFixed(
        1
      )}}]})`;
  
      event.target.disabled = true;
      try {
        await videoTrack.applyConstraints(constraints);
        log(`${prefix} -> success`);
        log(
          `videoTrack.getConstraints() -> ${JSON.stringify(
            videoTrack.getConstraints()
          )}`
        );
        const range = document.querySelector(`input[data-name="${name}"]`);
        range.value = videoTrack.getSettings()[name];
      } catch (error) {
        log(`⚠️ ${prefix} -> ${error.message}`);
      }
      event.target.disabled = false;
    }
  
    async function onRangeChange(event) {
      const name = event.target.dataset.name;
      const constraint = parseFloat(event.target.value);
      const constraints = { advanced: [{}] };
      constraints.advanced[0][name] = constraint.toFixed(1);
      const prefix = `videoTrack.applyConstraints({"advanced": [{"${name}": ${constraint.toFixed(
        1
      )}}]})`;
      try {
        await videoTrack.applyConstraints(constraints);
        log(`${prefix} -> success`);
        log(
          `videoTrack.getConstraints() -> ${JSON.stringify(
            videoTrack.getConstraints()
          )}`
        );
      } catch (error) {
        log(`⚠️ ${prefix} -> ${error.message}`);
      }
    }
  }

  /* utils */
  
  function log(text) {
    logs.scrollTop = 0;
    if (logs.firstChild && text == logs.firstChild.textContent) {
      logs.firstChild.classList.toggle("again", true);
      logs.firstChild.dataset.times =
        (parseInt(logs.firstChild.dataset.times) || 0) + 1;
      return;
    }
    const pre = document.createElement("pre");
    pre.textContent = `${maybeAddTimestamp()}${text}`;
    logs.insertBefore(pre, logs.firstChild);
  }
  
  function isDebug() {
    const params = new URLSearchParams(location.search);
    return params.has("debug");
  }
  
  function maybeAddTimestamp() {
    if (isDebug()) {
      return `${new Date().toISOString().slice(11, -1)} | `;
    }
    return "";
  }
  