/* 

Gamepad code: https://github.com/luser/gamepadtest
PTZ API code: https://codepen.io/selenecodes/full/JjRBXxb, https://dev.to/selenecodes/using-the-pan-tilt-zoom-camera-api-109c,


*/

const { contextBridge, ipcRenderer } = require('electron');

const cameraID =  ipcRenderer.sendSync('camera-ID');
const ptz_presets=[{}];
window.addEventListener('DOMContentLoaded', () => {

    /* Game Controls */
      var haveEvents = 'GamepadEvent' in window;
      var controllers = {};
      var rAF = window.requestAnimationFrame;
      var gpSelect = document.getElementById('gamepads')
      var gpIndex;
      var fps = 10;
      var now;
      var then = Date.now();
      var interval = 1000/fps;
      var delta;
      var buttonPressed = false;
      
      function connecthandler(e) {
          //add gamepad to drop down list
          var gp = document.getElementById("gamepads");
          var gpOption = document.createElement("option");
          gpOption.text = `${e.gamepad.index}: ${e.gamepad.id}`;
          gpOption.value = e.gamepad.index;
          gpOption.id = e.gamepad.id;
          gp.add(gpOption);
          controllers[e.gamepad.index] = e.gamepad;
          console.log(controllers[e.gamepad.index]) 
          
        //addgamepad(e.gamepad);
      }
      function addgamepad(gamepad) {
          var d = document.createElement("div");
          d.setAttribute("id", "controller" + gamepad.index);
          var t = document.createElement("h4");
          t.appendChild(document.createTextNode("gamepad: " + gamepad.id));
          d.appendChild(t);
          var b = document.createElement("div");
          b.className = "gpButtons";
          for (var i=0; i<gamepad.buttons.length; i++) {
              var e = document.createElement("span");
              e.className = "gpButton";
              //e.id = "b" + i;
              e.innerHTML = i;
              b.appendChild(e);
            }
            d.appendChild(b);
            var a = document.createElement("div");
            a.className = "axes";

            for (i=0; i<gamepad.axes.length; i++) {
                e = document.createElement("meter");
                e.className = "axis";
                //e.id = "a" + i;
                e.setAttribute("min", "-1");
                e.setAttribute("max", "1");
                e.setAttribute("value", "0");
                e.innerHTML = i;
                a.appendChild(e);
            }
            d.appendChild(a);
            document.getElementById("start").style.display = "none";
            document.body.insertBefore(d, window.document.body.firstChild);
            //document.body.appendChild(d);
            rAF(updateStatus);
        }
      
      function disconnecthandler(e) {
        removegamepad(e.gamepad);
      }
      
      function removegamepad(gamepad) {
        var d = document.getElementById("controller" + gamepad.index);
        document.body.removeChild(d);
        delete controllers[gamepad.index];
    }

    // #region gamepad input functions
    async function updateStatus() {
        rAF(updateStatus);
        now = Date.now();
        delta = now - then;
     
        if (delta > interval) {
            var zoomMin = cameraStream.getCapabilities().zoom.min, 
                zoomMax = cameraStream.getCapabilities().zoom.max, 
                zoomStep = cameraStream.getCapabilities().zoom.step, 
                tiltMin = cameraStream.getCapabilities().tilt.min,  
                tiltMax = cameraStream.getCapabilities().tilt.max, 
                tiltStep = cameraStream.getCapabilities().tilt.step, 
                panMin = cameraStream.getCapabilities().pan.min, 
                panMax = cameraStream.getCapabilities().pan.min,  
                panStep = cameraStream.getCapabilities().pan.step;

            then = now - (delta % interval);
            scangamepads();
            var controller = controllers[gpIndex];
            var d = document.getElementById("controller"+gpIndex);
            var buttons = d.getElementsByClassName("gpButton");
            var zoomChange = 0;
            for (var i=0; i<controller.buttons.length; i++) {
                var b = buttons[i];
                var val = controller.buttons[i];
                var pressed = val == 1.0;
                var touched = false;
                if (typeof(val) == "object") {
                pressed = val.pressed;
                if ('touched' in val) {
                    touched = val.touched;
                }
                val = val.value;
                }
                var pct = Math.round(val * 100) + "%";
                b.style.backgroundSize = pct + " " + pct;
                b.className = "gpButton";
                if (pressed) {
                b.className += " pressed";
                }
                if (touched) {
                b.className += " touched";
            }
            if(i == 6 || i == 7){
                switch (true) {
                    case (i == 6 && val > .9):
                    zoomChange = zoomStep * -25;
                    break;
                    case (i == 7 && val> .9):
                    zoomChange = zoomStep * 25;
                    console.log("zoom in ", buttonPressed)
                    break;
                }
            }

            if(i == 10 && controller.buttons[10].value == 1 && buttonPressed == false){ 
                buttonPressed = true;
                console.log("buttonPressed ", buttonPressed)
                if(document.getElementById("newPresetName").value){
                    updateButtons.addPresetOnClick();
                }
                await delay(500);
                buttonPressed = false;
                console.log("preset routine finished", buttonPressed)
            } 

            
            if(controller.buttons[i].value == 1 && buttonPressed == false && document.getElementById(i)){ 
                buttonPressed = true;
                console.log("buttonPressed ", buttonPressed)
                updateButtons.gotoPreset(i);
                await delay(500);
                buttonPressed = false;
                console.log("get preset finished? ", buttonPressed)
            } 

            if(controller.buttons[i].value == 1  && i !== 10){
                document.getElementById("newPresetName").value = i;
            }
        }
        
            
            var constraints = { advanced: [{}] };
            var panChange;
            var tiltChange;
            var axes = d.getElementsByClassName("axis");
            for (var i=0; i<controller.axes.length; i++) {
                var a = axes[i];
                /* console.log(a)
                console.log(i, a.value) */
                switch (true) {
                /* case (i == 0 && a.value > 0.9):
                    panChange = panStep * 2;
                    break;
                case (i == 0 && a.value < -0.9):
                    panChange = panStep * -2;
                    break; */
                /* case (i == 1 && a.value > 0.9):
                    tiltChange = tiltStep * -2;
                    break;
                case (i == 1 && a.value < -0.9):
                    tiltChange = tiltStep * 2;
                    break; */
                case (i == 0 && a.value > 0.5):
                    panChange = panStep;
                    break;
                case (i == 0 && a.value < -0.5):
                    panChange = panStep * -1;
                    break;    
                case (i == 1 && a.value > 0.5):
                    tiltChange = tiltStep * -1;
                    break;
                case (i == 1 && a.value < -0.5):
                    tiltChange = tiltStep ;
                    break;
                }
                a.innerHTML = i + ": " + controller.axes[i].toFixed(4);
                a.setAttribute("value", controller.axes[i]);

            }
                panChange = panChange ? panChange : 0;
                tiltChange = tiltChange ? tiltChange : 0;
                
                const panValue = cameraStream.getSettings().pan + panChange;
                const tiltValue = cameraStream.getSettings().tilt + tiltChange;
                const zoomValue = cameraStream.getSettings().zoom + zoomChange;
                
                
                if((panChange !== 0 || tiltChange !== 0 || zoomChange !== 0)){
                    constraint = { advanced: [{ pan: panValue, tilt: tiltValue, zoom: zoomValue}] };
                    await cameraStream.applyConstraints(constraint);
                    
                    //update range slider  and text boxes
                    const panRange = document.querySelector(`input[data-name="pan"]`);
                    document.getElementById(`panText`).value = panValue;
                    panRange.value = panValue;

                    const tiltRange = document.querySelector(`input[data-name="tilt"]`);
                    document.getElementById(`tiltText`).value = tiltValue;
                    tiltRange.value = tiltValue;

                    const zoomRange = document.querySelector(`input[data-name="zoom"]`);
                    document.getElementById(`zoomText`).value = zoomValue;
                    zoomRange.value = zoomValue;
                }           
        }
    }
 // #endregion   
      
      function scangamepads() {
        var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
        for (var i = 0; i < gamepads.length; i++) {
          if (gamepads[i] && (gamepads[i].index in controllers)) {
            controllers[gamepads[i].index] = gamepads[i];
          }
        }
      }
      
      if (haveEvents) {
        window.addEventListener("gamepadconnected", connecthandler);
        window.addEventListener("gamepaddisconnected", disconnecthandler);
      } else {
        setInterval(scangamepads, 500);
      }

      gpSelect.addEventListener('change', function (e) {
        gpIndex = document.getElementById('gamepads').value
        console.log(gpIndex);
        console.log(controllers[gpIndex])
        addgamepad(controllers[gpIndex]);
    });



//console.log("cameraID ", cameraID )

const dataElement = document.createElement(`data`);
dataElement.setAttribute("id", "cameraID");
dataElement.setAttribute("data-camera-Id", cameraID);

window.document.body.insertBefore(dataElement, window.document.body.firstChild);
//window.document.body.append(dataElem);

const video = document.querySelector("video");
var cameraStream;
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
    cameraStream = videoTracks[0];
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
    console.log("capabilities", capabilities)
    console.log("settings", settings)
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
        console.log(event)
        let prefix = "";  
      let constraints = { advanced: [{}] };
      const name = event.target.dataset.name;
      let constraint;
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
                  log(`videoTrack.getConstraints() -> ${JSON.stringify(
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
        preset.setAttribute("id",presetName);
        preset.setAttribute("data-preset","preset");
        preset.setAttribute("onClick","getPreset()");
        preset.textContent = `{"Preset": "${presetName}", "focusMode": "${focusMode}", "focusDistance":"${focusDistance}", "pan":"${pan}", "tilt":"${tilt}", "zoom":"${zoom}"}`;
        preset.onclick = getPreset;
        presets.insertBefore(preset, presets.firstChild);
        ptz_presets.push(`{"Preset": "${presetName}", "focusMode": "${focusMode}", "focusDistance":"${focusDistance}", "pan":"${pan}", "tilt":"${tilt}", "zoom":"${zoom}"}`)
        console.log(ptz_presets);
        await delay(1000);
        document.getElementById("newPresetName").value = "";
        //return event;

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
    
    async function gotoPreset(i) {
        
        console.log(document.getElementById(i))
        const presets = document.getElementById(i);
        let presetValue = presets.innerText;
        console.log(presetValue)
        
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
    updateButtons.addPresetOnClick = addPresetOnClick;
    updateButtons.gotoPreset = gotoPreset;
   // setTimeout(window.requestAnimationFrame(updateButtons),30);

   //keyboard hotkeys
   document.addEventListener("keydown", function(event) {
    if(event.key === "ArrowUp"){event.preventDefault(); document.getElementById("tiltUpButton").click();}
    if(event.key === "ArrowDown"){event.preventDefault(); document.getElementById("tiltDownButton").click();}
    if(event.key === "ArrowLeft"){event.preventDefault(); document.getElementById("panLeftButton").click();}
    if(event.key === "ArrowRight"){event.preventDefault(); document.getElementById("panRightButton").click();}
    if(event.key === "+"){event.preventDefault(); document.getElementById("zoomInButton").click();}
    if(event.key === "-"){event.preventDefault(); document.getElementById("zoomOutButton").click();}
    if(event.key === ">"){event.preventDefault(); document.getElementById("focusFarButton").click();}
    if(event.key === "<"){event.preventDefault(); document.getElementById("focusNearButton").click();}
    if(event.key === "."){event.preventDefault(); document.getElementById("focusModeButton").click();}
    if(event.key === "F1"){event.preventDefault(); document.getElementById("0").click();}
    if(event.key === "F2"){event.preventDefault(); document.getElementById("1").click();}
    if(event.key === "F3"){event.preventDefault(); document.getElementById("2").click();}
    if(event.key === "F4"){event.preventDefault(); document.getElementById("3").click();}
    if(event.key === "F5"){event.preventDefault(); document.getElementById("4").click();}
    if(event.key === "F1" && event.shiftKey){event.preventDefault(); document.getElementById("6").click();}
    if(event.key === "F2" && event.shiftKey){event.preventDefault(); document.getElementById("7").click();}
    if(event.key === "F3" && event.shiftKey){event.preventDefault(); document.getElementById("8").click();}
    if(event.key === "F4" && event.shiftKey){event.preventDefault(); document.getElementById("9").click();}
    if(event.key === "F5" && event.shiftKey){event.preventDefault(); document.getElementById("10").click();}
    }
);
}



/* utils */

const delay = ms => new Promise(res => setTimeout(res, ms));

function log(text) {
    /* logs.scrollTop = 0;
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
    } */
    return "";
  }