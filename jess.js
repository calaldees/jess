// State -----------------------------------------------------------------------

let state = {
    layers: [
        '□■□■□■□■' +
        '■□■□■□■□' +
        '□■□■□■□■' +
        '■□■□■□■□' +
        '□■□■□■□■' +
        '■□■□■□■□' +
        '□■□■□■□■' +
        '■□■□■□■□'
        ,
        '♖♘♗♕♔♗♘♖' +
        '♙♙♙♙♙♙♙♙' +
        '        ' +
        '        ' +
        '        ' +
        '        ' +
        '♟♟♟♟♟♟♟♟' +
        '♜♞♝♛♚♝♞♜'
        ,
        '        ' +
        '        ' +
        '        ' +
        '        ' +
        '        ' +
        '        ' +
        '        ' +
        '        '
    ],
    meta: {
        width: 8,
        height: 8,
    },
}



// Canvas ----------------------------------------------------------------------
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext('2d', { alpha: false });
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;


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
    state = JSON.parse(event.data);
    drawDisplay();
});


// Input -----------------------------------------------------------------------

canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    console.log("x: " + x + " y: " + y);
})


// Game Logic ------------------------------------------------------------------

function drawDisplay() {
    const tile_width = canvas.width / state.meta.width;
    const tile_height = canvas.height / state.meta.height;

    ctx.font = `${Math.min(tile_width, tile_height)}px serif`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    function drawTile(x, y, char) {
        x = x * tile_width;
        y = y * tile_height;
        if (char == '□') {
            ctx.fillStyle = 'white';
            ctx.fillRect(x, y, tile_width, tile_height);
        }
        else if (char == '■') {
            ctx.fillStyle = 'black';
            ctx.fillRect(x, y, tile_width, tile_height);
        }
        else if (char == ' ') {
            // nothing
        }
        else {
            ctx.fillStyle = 'orange';
            ctx.fillText(char, x + (tile_width/2), y + (tile_height/2), tile_width);
        }
    }

    for (let layer of state.layers) {
        for (var index=0; index<layer.length; index++) {
            let [x, y] = [index % state.meta.height, Math.floor(index/state.meta.height)];
            drawTile(x, y, layer[index]);
        }
    }
}

drawDisplay();