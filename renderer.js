const button = document.getElementById('SubmitButton');

window.addEventListener('DOMContentLoaded', async() => {
  getCameras();
  //getGamepads();
})

async function getCameras(){ 
  console.log("list of cameras")
  navigator.mediaDevices
    .enumerateDevices()
    .then((devices) => {
      devices.forEach((device) => {
          if(device.kind == "videoinput"){    
            console.log(device)
            console.log(`${device.kind}: ${device.label} id = ${device.deviceId}`);
            var x = document.getElementById("cameras");
            var option = document.createElement("option");
            option.text = device.label;
            option.id = device.deviceId;
            x.add(option);    
          }
      });
    })
}



async function getGamepads(){
    console.log(navigator.getGamepads()) 
    console.log("list of gamepads")
    for (const gamepad of navigator.getGamepads()) {
        console.log(1)
        
    }
    console.log(navigator.getGamepads()) 
    
  }

button.addEventListener("click", newWindow);

function newWindow() {
  const IP = document.getElementById('IP').value;
  const Port = document.getElementById('Port').value;
  const PW = document.getElementById('PW').value;
  //const Link = document.getElementById('Link').value;
  const OpenCamera = document.getElementById('cameraWindow');
  console.log("OpenCamera",OpenCamera.checked)
  
  const OpenControls = document.getElementById('controlWindow');
  console.log("Open control", OpenControls.checked)


  var e = document.getElementById("cameras");
  console.log(e.value)
  console.log(e.options[e.selectedIndex].text)
  var value = e.value;
  var CameraID = e.options[e.selectedIndex].id;
  console.log(`${IP}, ${Port}, ${PW}, ${CameraID}`);  

  if(OpenCamera.checked){ 
    window.electronAPI.cameraWindow(CameraID);
  }

  if(OpenControls.checked){ 
  window.electronAPI.controlWindow(IP, Port, PW, CameraID);
  }
}