function populateCameras() {
    if (!("mediaDevices" in navigator)) return;
    navigator.mediaDevices.enumerateDevices().then((mediaDevices) => {
      while (cameraSelect.options.length > 0) {
        cameraSelect.remove(0);
      }
      const defaultOption = document.createElement("option");
      defaultOption.id = "default";
      defaultOption.textContent = "(default camera) ";
      cameraSelect.appendChild(defaultOption);
  
      const videoInputDevices = mediaDevices.filter(
        (mediaDevice) => mediaDevice.kind == "videoinput"
      );
      if (videoInputDevices.length > 0) {
        cameraSelect.disabled = false;
      }
      videoInputDevices.forEach((videoInputDevice, index) => {
        if (!videoInputDevice.deviceId) {
          return;
        }
        const option = document.createElement("option");
        option.id = videoInputDevice.deviceId;
        option.textContent = videoInputDevice.label || `Camera ${index + 1}`;
        option.selected = deviceId == option.id;
        cameraSelect.appendChild(option);
      });
    });
  }
  
  window.addEventListener("DOMContentLoaded", populateCameras);
  if ("mediaDevices" in navigator) {
    navigator.mediaDevices.addEventListener("devicechange", populateCameras);
  }
  
  let deviceId = "default";
  cameraSelect.onchange = (_) => {
    deviceId = cameraSelect.selectedOptions[0].id;
  };
  
  if (
    navigator.userAgent.includes("Chrome") &&
    "mediaDevices" in navigator &&
    !`"pan" in navigator.mediaDevices.getSupportedConstraints()` &&
    !("tilt" in navigator.mediaDevices.getSupportedConstraints())
  ) {
    flagWarning.style.display = "block";
  }
  
  log(navigator.userAgent);
  
  ["pan", "tilt", "zoom"].forEach((name) => {
    const prefix = `"${name}" in navigator.mediaDevices.getSupportedConstraints()`;
    try {
      log(
        `${prefix} -> ${name in navigator.mediaDevices.getSupportedConstraints()}`
      );
    } catch (error) {
      log(`⚠️ ${prefix} -> ${error.message}`);
    }
  });
  
  const monitoredPermissionDescriptors = [
    { name: "camera" },
    { name: "camera", panTiltZoom: true },
    { name: "microphone" },
  ];
  
  monitoredPermissionDescriptors.forEach(async (permissionDescriptor) => {
    const prefix = `navigator.permissions.query(${JSON.stringify(
      permissionDescriptor
    )})`;
    function permissionStatusWithEmoji(status) {
      if (status.state === "denied") return "🔴 ";
      if (status.state === "granted") return "🟢 ";
      return "";
    }
    try {
      const status = await navigator.permissions.query(permissionDescriptor);
      log(`${prefix} -> ${permissionStatusWithEmoji(status)}"${status.state}"`);
      status.onchange = (_) => {
        log(
          `${prefix}.onchange -> ${permissionStatusWithEmoji(status)}"${
            status.state
          }"`
        );
        updateButtons();
      };
    } catch (error) {
      log(`⚠️ ${prefix} -> ${error.message}`);
    }
  });
  
  getUserMediaVideoButton.onclick = (_) => getUserMedia({ video: true });
  getUserMediaVideoPanUnconstrainedBasicButton.onclick = (_) =>
    getUserMedia({ video: { pan: true } });
  getUserMediaVideoPtzButton.onclick = (_) =>
    getUserMedia({ video: { zoom: 400 } });
  getUserMediaVideoPanUnconstrainedAudioButton.onclick = (_) =>
    getUserMedia({ audio: true, video: { tilt: true } });
  
  async function getUserMedia(constraints) {
    const sanitizedConstraints = { ...constraints };
    if (deviceId != "default" && deviceId != "") {
      constraints.video = {
        ...constraints.video,
        ...{ deviceId: { exact: deviceId } },
      };
      sanitizedConstraints.video = {
        ...constraints.video,
        ...{ deviceId: { exact: `${deviceId.substring(0, 4)}...` } },
      };
    }
    const prefix = `navigator.mediaDevices.getUserMedia(${JSON.stringify(
      sanitizedConstraints
    )})`;
    try {
      document.body.classList.toggle("hidden", true);
      if (video.srcObject) {
        video.srcObject.getTracks().forEach((track) => track.stop());
        video.srcObject = null;
      }
      if (isDebug()) log(`> Calling ${prefix}`);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const [videoTrack] = stream.getVideoTracks();
      log(`${prefix} -> "${videoTrack.label}"`);
  
      videoTrack.onmute = (_) => {
        log(`videoTrack.onmute -> source is temporarily unable to provide data.`);
      };
      videoTrack.onunmute = (_) => {
        log(`videoTrack.onunmute -> source is live again.`);
      };
  
      video.srcObject = stream;
      document.body.classList.toggle("hidden", false);
      populateCameras();
    } catch (error) {
      document.body.classList.toggle("hidden", false);
      log(
        `⚠️ ${prefix} -> ${error.name}${
          error.message ? ' "' + error.message + '"' : ""
        }`
      );
    }
  
    updateButtons();
  }
  
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
  
  /* permissions request/revoke */
  
  requestCameraPtzTrueButton.onclick = (_) =>
    request({ name: "camera", panTiltZoom: true });
  
  async function request(permissionDescriptor) {
    const prefix = `navigator.permissions.request(${JSON.stringify(
      permissionDescriptor
    )}`;
    try {
      await navigator.permissions.request(permissionDescriptor);
      log(`${prefix} -> success`);
    } catch (error) {
      log(`⚠️ ${prefix} -> ${error.message}`);
    }
    populateCameras();
  }
  
  revokeCameraPtzTrueButton.onclick = (_) =>
    revoke({ name: "camera", panTiltZoom: true });
  
  async function revoke(permissionDescriptor) {
    const prefix = `navigator.permissions.revoke(${JSON.stringify(
      permissionDescriptor
    )}`;
    try {
      await navigator.permissions.revoke(permissionDescriptor);
      log(`${prefix} -> success`);
    } catch (error) {
      log(`⚠️ ${prefix} -> ${error.message}`);
    }
    populateCameras();
  }
  
  /* picture-in-picture */
  
  video.onclick = async (event) => {
    if (!document.pictureInPictureEnabled) return;
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture();
    } else {
      video.requestPictureInPicture();
    }
  };
  
  /* fun hacks */
  
  function updateMediaSession() {
    navigator.mediaSession.setActionHandler(
      "previoustrack",
      panLeftButton.disabled
        ? null
        : (_) => {
            panLeftButton.click();
          }
    );
    navigator.mediaSession.setActionHandler(
      "nexttrack",
      panRightButton.disabled
        ? null
        : (_) => {
            panRightButton.click();
          }
    );
  }
  
  /* feature policy */
  
  if ("featurePolicy" in document) {
    cameraFeaturePolicy.checked = document.featurePolicy.allowsFeature("camera");
    microphoneFeaturePolicy.checked =
      document.featurePolicy.allowsFeature("microphone");
  
    cameraFeaturePolicy.onchange = (e) => toggleFeaturePolicy(e, "camera");
    microphoneFeaturePolicy.onchange = (e) =>
      toggleFeaturePolicy(e, "microphone");
  
    function toggleFeaturePolicy(event, featurePolicyName) {
      const params = new URLSearchParams(location.search);
      if (event.target.checked) {
        params.delete(featurePolicyName);
      } else {
        params.set(featurePolicyName, "none");
      }
      if (params.toString()) {
        location.href = `${location.pathname}?${params}`;
      } else {
        location.href = location.pathname;
      }
    }
  } else {
    cameraFeaturePolicy.disabled = true;
    microphoneFeaturePolicy.disabled = true;
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
  

