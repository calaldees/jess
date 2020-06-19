// Websocket -------------------------------------------------------------------
window.addEventListener('hashchange', ()=>{window.location.reload()});
const channel = window.location.hash.replace('#','');
const ws_url = `ws://${window.location.hostname}:9800/${channel}.ws`;

const socket = new WebSocket(ws_url);
socket.addEventListener('open', function (event) {
    console.log('open');
});
socket.addEventListener('close', function (event) {
    console.log('close');
});
socket.addEventListener('message', function (event) {
    console.log('message');
});


// Canvas ----------------------------------------------------------------------
const htmlCanvas = document.getElementById("canvas");

htmlCanvas.addEventListener('mousedown', (event) => {
    const rect = htmlCanvas.getBoundingClientRect()
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    console.log("x: " + x + " y: " + y);
})

