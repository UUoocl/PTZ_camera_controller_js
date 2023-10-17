const { contextBridge, ipcRenderer } = require('electron');

const cameraID =  ipcRenderer.sendSync('camera-ID');
const ptz_presets=[{}];
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
    console.log(capabilities)
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
  
    ["pan", "tilt", "zoom", "focusDistance", "focusMode"].forEach((name) => {
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
        } else if (name == "focusDistance") {
            focusFarButton.dataset.step = capabilities.focusDistance.step;
            focusNearButton.dataset.step = -capabilities.focusDistance.step;
            focusDistanceRange.min = capabilities.focusDistance.min;
            focusDistanceRange.max = capabilities.focusDistance.max;
            focusDistanceRange.step = capabilities.focusDistance.step;
            focusDistanceRange.value = settings.focusDistance;
          }else if (name == "focusMode") {
            focusModeButton.dataset.step = 1;
            focusModeRange.min = 0;
            focusModeRange.max = 1;
            focusModeRange.step = 1;
            focusModeRange.value = settings.focusMode;
          }
      }
    }); 
  
    //updateMediaSession();
  
    async function onButtonClick(event) {
      let prefix = "";  
      let constraints = { advanced: [{}] };
      const name = event.target.dataset.name;
      let constraint;
      console.log("hi ", name, videoTrack.getSettings())
      if (!(name in videoTrack.getSettings())) {
        log(`⚠️ Argh! "${name}" is not in videoTrack.getSettings() anymore.`);
        return;
      }
      if(name == "focusMode"){
        constraint = videoTrack.getSettings()["focusMode"];
        const focusDistance = videoTrack.getSettings()["focusDistance"];
        console.log("constraint = ", constraint, constraint == "manual")
        
        constraints.advanced[0]["focusMode"] = (constraint == "manual") ? "continuous" : "manual";
        constraints.advanced[0]["focusDistance"] = focusDistance;
        const distanceConstraints = { advanced: [{}] };
        distanceConstraints.advanced[0]["focusDistance"] = focusDistance ;
        console.log("constraints focusMode prop = ", constraints.advanced[0]["focusMode"])
        prefix = `videoTrack.applyConstraints({"advanced": [{"focusMode": ${constraint}}]})`;

        event.target.disabled = true;
        try {
          console.log(constraints)  
          await videoTrack.applyConstraints(constraints);
          //await videoTrack.applyConstraints(distanceConstraints);
          console.log("stringify", JSON.stringify(constraints))
          console.log(videoTrack.getSettings()[name])
          log(`${prefix} -> success`);
          log(
            `videoTrack.getConstraints() -> ${JSON.stringify(
              videoTrack.getConstraints()
            )}`
          );
          const range = document.querySelector(`input[data-name="${name}"]`);
          console.log("range = ", range)
          console.log("rangeValue = ", videoTrack.getSettings()[name])
          document.getElementById(`${name}Text`).value = (constraint == "manual") ? 0 : 1;
          range.value = document.getElementById(`${name}Text`).value;
        } catch (error) {
          log(`⚠️ ${prefix} -> ${error.message}`);
        }
        event.target.disabled = false;
    } else{
          constraint =
          videoTrack.getSettings()[name] + parseFloat(event.target.dataset.step);
          console.log("constraint = ", name)
          console.log(constraints)
          constraints.advanced[0][name] = constraint.toFixed(1);
          console.log("constraints prop = ", constraints.advanced[0][name])
          prefix = `videoTrack.applyConstraints({"advanced": [{"${name}": ${constraint.toFixed(
              1
              )}}]})`;
              
              event.target.disabled = true;
              try {
                  await videoTrack.applyConstraints(constraints);
                  console.log("stringify", JSON.stringify(constraints))
                  log(`${prefix} -> success`);
                  log(
                      `videoTrack.getConstraints() -> ${JSON.stringify(
                          videoTrack.getConstraints()
                          )}`
                          );
                          const range = document.querySelector(`input[data-name="${name}"]`);
                          console.log("range = ", range)
                          console.log("constraint = ", name)
                          document.getElementById(`${name}Text`).value = constraint;
                          range.value = videoTrack.getSettings()[name];
                        } catch (error) {
                            log(`⚠️ ${prefix} -> ${error.message}`);
                        }
                        event.target.disabled = false;
        }
    }

//////////////////////////////////////////////
  
    async function onRangeChange(event) {
      let prefix = "";
      const name = event.target.dataset.name;
      let constraint;
      console.log("event value, ", event.target.value)      
      console.log(name)
      
      let constraints = { advanced: [{}] };
      if(name == "focusMode"){
          constraint = videoTrack.getSettings()[name];
          console.log("range change ",constraint)
          constraints.advanced[0][name] = (constraint == "manual") ? "continuous" : "manual";
          prefix = `videoTrack.applyConstraints({"advanced": [{"${name}": ${constraint}}]})`;
          document.getElementById(`${name}Text`).value = (constraint == "manual") ? 0 : 1;
        }else{
            constraint = parseFloat(event.target.value);
            constraints.advanced[0][name] = constraint.toFixed(1);
            prefix = `videoTrack.applyConstraints({"advanced": [{"${name}": ${constraint.toFixed(
                1
                )}}]})`; 
            }
            document.getElementById(`${name}Text`).value = constraint
            
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


    const addPresetButton = document.getElementById("presetButton");
    addPresetButton.disabled = false;
    addPresetButton.onclick = addPresetOnClick;
    
    const downloadPresetButton = document.getElementById("downloadPresets");
    downloadPresetButton.disabled = false;
    downloadPresetButton.onclick = downloadPresetsOnClick;

    const loadPresetButton = document.getElementById("loadPresets");
    loadPresetButton.disabled = false;
    loadPresetButton.onclick = loadPresetsOnClick;

/*     const presetPositions = Array.from(document.querySelectorAll(`[data-preset]`));
    presetPositions.forEach((presetPostition) => {
        presetPostition.onclick = getPreset;
    }); */

    async function addPresetOnClick(event) {
        const presetName = document.getElementById("newPresetName").value;
        const focusMode = videoTrack.getSettings()["focusMode"];
        const focusDistance = videoTrack.getSettings()["focusDistance"];
        const pan = videoTrack.getSettings()["pan"];
        const tilt = videoTrack.getSettings()["tilt"];
        const zoom = videoTrack.getSettings()["zoom"];
        console.log("Preset ", focusMode, focusDistance, pan, tilt, zoom)
        presets.scrollTop = 0;
        const preset = document.createElement("p");
        preset.setAttribute("data-preset","preset");
        preset.setAttribute("onClick","getPreset()");
        preset.textContent = `{"Preset": "${presetName}", "focusMode": "${focusMode}", "focusDistance":"${focusDistance}", "pan":"${pan}", "tilt":"${tilt}", "zoom":"${zoom}"}`;
        preset.onclick = getPreset;
        presets.insertBefore(preset, presets.firstChild);
        ptz_presets.push(`{"Preset": "${presetName}", "focusMode": "${focusMode}", "focusDistance":"${focusDistance}", "pan":"${pan}", "tilt":"${tilt}", "zoom":"${zoom}"}`)
        console.log(ptz_presets);
    }

    async function getPreset(event) {
      console.log("clicked", event)
      let presetValue = event.srcElement.innerText;
      presetValue = JSON.parse(presetValue);
      console.log(presetValue)
      let constraints = { advanced: [{}] };
      constraints.advanced[0]["focusMode"] = presetValue.focusMode;
      constraints.advanced[0]["focusDistance"] = presetValue.focusDistance;
      constraints.advanced[0]["pan"] = presetValue.pan;
      constraints.advanced[0]["tilt"] = presetValue.tilt;
      constraints.advanced[0]["zoom"] = presetValue.zoom;
        
      await videoTrack.applyConstraints(constraints);
  }

    function downloadPresetsOnClick(){
        var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(ptz_presets));
        var downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href",     dataStr);
        downloadAnchorNode.setAttribute("download", "PTZ_Position_Presets.json");
        //document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }

    //https://stackoverflow.com/questions/31746837/reading-uploaded-text-file-contents-in-html
    function loadPresetsOnClick() {
        //const input = document.querySelector("input[type=file]");
        //const input = 
        document.getElementById('loadPresets')
        .addEventListener('change', getFile)
    }
    
    function getFile(event) {
        console.log("getfiles")
        const input = event.target
        if ('files' in input && input.files.length > 0) {
            console.log("file selected")
            placeFileContent(
                document.getElementById('presets'),
                input.files[0])
            }
    }
            
    function placeFileContent(target, file) {
        console.log("try to read file")
        readFileContent(file).then(content => {
            console.log(content)
            content = JSON.parse(content);
            content.splice(0,1);
            console.log(content)
            content.forEach(element => {
                console.log(element)
                //delete element.Blank;
              element = JSON.parse(element);
              let preset = document.createElement("p");
              preset.setAttribute("data-preset","preset");
              preset.setAttribute("onClick","getPreset()");
              preset.textContent = `{"Preset": "${element.Preset}", "focusMode": "${element.focusMode}", "focusDistance":"${element.focusDistance}", "pan":"${element.pan}", "tilt":"${element.tilt}", "zoom":"${element.zoom}"}`
              element.zoom;
              preset.onclick = getPreset;
              presets.insertBefore(preset, presets.firstChild);
              //target.innerText = element;
              //console.log(target.innerText)
            });    

        }).catch(error => console.log(error))
    }

    function readFileContent(file) {
        const reader = new FileReader()
        return new Promise((resolve, reject) => {
            reader.onload = event => resolve(event.target.result)
            reader.onerror = error => reject(error)
            reader.readAsText(file)
        })
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
  