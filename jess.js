// Utils -----------------------------------------------------------------------

// https://stackoverflow.com/a/1431113/3356840
function replaceAt(string, index, replacement) {
    return string.substr(0, index) + replacement + string.substr(index + replacement.length);
}


// State -----------------------------------------------------------------------

const CHAR_ACTIVE = '◎';

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
        '        ' +
        '        ' +
        '        ' +
        '        ' +
        '        ' +
        '        ' +
        '        ' +
        '        '
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
    ],
    meta: {
        width: 8,
        height: 8,
    },
}



// Canvas ----------------------------------------------------------------------
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext('2d', { alpha: false });

// Resize (could be put in function later)
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const tile_width = canvas.width / state.meta.width;
const tile_height = canvas.height / state.meta.height;


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
function sendState() {
    socket.send(JSON.stringify(state));
}

// Input -----------------------------------------------------------------------

canvas.addEventListener('mousedown', (event) => {
    let [x, y] = [
        event.clientX - canvas.getBoundingClientRect().left,
        event.clientY - canvas.getBoundingClientRect().top,
    ];
    x = Math.floor(x/tile_width);
    y = Math.floor(y/tile_height);
    console.log("x: " + x + " y: " + y);
    state.layers[1] = replaceAt(state.layers[1], x + (y * state.meta.width), CHAR_ACTIVE);
    sendState();
});


// Game Logic ------------------------------------------------------------------

function drawDisplay() {
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
            ctx.fillText(char, x + (tile_width/2), y + (tile_height/2));
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
