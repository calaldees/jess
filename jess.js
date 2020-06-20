// Utils -----------------------------------------------------------------------

// https://stackoverflow.com/a/1431113/3356840
function strReplaceAt(string, index, replacement) {
    return string.substr(0, index) + replacement + string.substr(index + replacement.length);
}

function* strDiffIndexs(aa, bb) {
    console.assert(aa.length == bb.length, 'string length must match');
    for (let i=0 ; i < aa.length ; i++) {
        if (aa.charAt(i) != bb.charAt(i)) {
            yield i;
        }
    }
}

function strCountChars(string, chars) {
    let count = 0;
    for (let i=0 ; i<string.length ; i++) {
        if (chars.indexOf(string.charAt(i)) >= 0) {
            count++;
        }
    }
    return count;
}


// Constants -------------------------------------------------------------------

const BLANK_CHAR = ' ';

const ACTIVE_CHAR = '◎';
const ACTIVE_CHAR_COLOR = '#db587b';
const ACTIVE_CHAR_COLOR_BORDER = '#78001c';

const CHESS_BOARD_COLOR_WHITE = '#eeeeee';
const CHESS_BOARD_COLOR_BLACK = '#666666';
const CHESS_PIECE_COLOR_WHITE = '#eeee88';
const CHESS_PIECE_COLOR_BLACK = '#46468c';
const CHESS_PIECES_WHITE = '♖♘♗♕♔♙';
const CHESS_PIECES_BLACK = '♜♞♝♛♚♟';
const CHESS_PIECES = CHESS_PIECES_WHITE + CHESS_PIECES_BLACK;

function chess_piece_invert(char) {
//    const CHESS_PIECE_UNICODE = 0x2654;
//    char_int = char.codePointAt(0) - CHESS_PIECE_UNICODE;
//    console.assert(char_int >=0 && char_int < 12, 'not a chess unicode character');
//    return String.fromCharCode(
//        ((char_int + 6) % 12) + CHESS_PIECE_UNICODE
//    );
    return CHESS_PIECES.charAt(
        (CHESS_PIECES.indexOf(char) + CHESS_PIECES_WHITE.length) % CHESS_PIECES.length
    );
}
//const CHESS_PIECE_COLOR_INVERSION_LOOKUP = new Map(strZip(
//    CHESS_PIECES_WHITE + CHESS_PIECES_BLACK,
//    CHESS_PIECES_BLACK + CHESS_PIECES_WHITE,
//));


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
        '        ' +
        '        ' +
        '        ' +
        '        ' +
        '        ' +
        '        ' +
        '        ' +
        '        '
        ,
        '♜♞♝♛♚♝♞♜' +
        '♟♟♟♟♟♟♟♟' +
        '        ' +
        '        ' +
        '        ' +
        '        ' +
        '♙♙♙♙♙♙♙♙' +
        '♖♘♗♕♔♗♘♖'
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

let tile_width;
let tile_height;

function resizeWindow() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    tile_width = canvas.width / state.meta.width;
    tile_height = canvas.height / state.meta.height;
    ctx.font = `${Math.min(tile_width, tile_height)}px serif`;
    drawDisplay();
}
window.addEventListener('resize', resizeWindow);


// Websocket -------------------------------------------------------------------

window.addEventListener('hashchange', ()=>{window.location.reload()});
const channel = window.location.hash.replace('#','');
const ws_url = `ws://${window.location.hostname}:9800/${channel}.ws`;

let socket;
function socketConnect() {
    if (socket) {
        console.warn('socket already connected');
        return;
    }
    console.log('socket create', ws_url);
    socket = new WebSocket(ws_url);
    socket.addEventListener('open', function (event) {
        console.log('socket open');
    });
    socket.addEventListener('close', function (event) {
        console.log('socket close');
        socket = undefined;
    });
    socket.addEventListener('message', function (event) {
        console.debug('socket message');
        receiveMessage(JSON.parse(event.data));
    });
}

function receiveMessage(_state) {
    // we can receive different types of message
    if (_state.message == 'request_state') {
        sendMessage(state);
    }
    state = _state;
    drawDisplay();
}

function sendMessage(_state) {
    if (!socket || socket.readyState != 1) {
        console.warn('Not connected to websocket');
        socketConnect();  // attempt reconnect
        receiveMessage(_state);  // manually push state locally
        return;
    }
    socket.send(JSON.stringify(_state));
    // this will trigger socker.message -> receiveMessage -> drawDisplay
}


// Input -----------------------------------------------------------------------

canvas.addEventListener('mousedown', (event) => {
    let x = event.clientX - canvas.getBoundingClientRect().left;
    let y = event.clientY - canvas.getBoundingClientRect().top;
    x = Math.floor(x/tile_width);
    y = Math.floor(y/tile_height);
    //console.log("x: " + x + " y: " + y);
    updateState(x, y);
    sendMessage(state);
});


// Game Logic ------------------------------------------------------------------

function updateState(x, y) {
    const i2 = x + (y * state.meta.width);
    const blank_layer = BLANK_CHAR.repeat(state.meta.width * state.meta.height);
    const active_layer = state.layers[1];
    const active_count = strCountChars(active_layer, ACTIVE_CHAR);
    if (active_count == 0) {
        state.layers[1] = strReplaceAt(active_layer, i2, ACTIVE_CHAR);
    }
    if (active_count == 1) {
        const i1 = [...strDiffIndexs(blank_layer, active_layer)][0];
        const char = state.layers[2].charAt(i1);
        state.layers[2] = strReplaceAt(state.layers[2], i1, BLANK_CHAR);
        state.layers[2] = strReplaceAt(state.layers[2], i2, char);
        state.layers[1] = blank_layer;
    }
}


// Display/Rendering -----------------------------------------------------------

function drawTile(x, y, char) {
    x = x * tile_width;
    y = y * tile_height;
    const x_center = x + (tile_width/2);
    const y_center = y + (tile_height/2);
    ctx.lineWidth = tile_height / 64;

    if (char == BLANK_CHAR) {
    }
    else if (char == '□') {
        ctx.fillStyle = CHESS_BOARD_COLOR_WHITE;
        ctx.fillRect(x, y, tile_width, tile_height);
    }
    else if (char == '■') {
        ctx.fillStyle = CHESS_BOARD_COLOR_BLACK;
        ctx.fillRect(x, y, tile_width, tile_height);
    }
    else if (char == ACTIVE_CHAR) {
        ctx.fillStyle = ACTIVE_CHAR_COLOR;
        ctx.strokeStyle = ACTIVE_CHAR_COLOR_BORDER;
        ctx.fillRect(x, y, tile_width, tile_height);
        ctx.strokeRect(x, y, tile_width, tile_height);
    }
    else {  // All other chars
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.strokeStyle = 'black';

        if (CHESS_PIECES_BLACK.indexOf(char) >= 0) {
            ctx.fillStyle = CHESS_PIECE_COLOR_BLACK;
        }
        if (CHESS_PIECES_WHITE.indexOf(char) >= 0) {
            ctx.fillStyle = CHESS_PIECE_COLOR_WHITE;
            //char = CHESS_PIECE_COLOR_INVERSION_LOOKUP.get(char);
            char = chess_piece_invert(char);
        }

        ctx.fillText(char, x_center, y_center);
        ctx.strokeText(char, x_center, y_center);
    }
}

function drawDisplay() {
    for (let layer of state.layers) {
        for (var i=0; i<layer.length; i++) {
            let [x, y] = [i % state.meta.height, Math.floor(i/state.meta.height)];
            drawTile(x, y, layer[i]);
        }
    }
}


// Main ------------------------------------------------------------------------

socketConnect();
resizeWindow();
