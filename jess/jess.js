// QueryString -----------------------------------------------------------------
const urlParams = new URLSearchParams(window.location.search);
const WEBSOCKET_HOST =
    urlParams.get('WEBSOCKET_HOST') ||  // query string override
    // If we have a port specified, then we are probably on a dev/local server, so use separate port for websockets
    `${window.location.hostname}:${window.location.port ? '9800' : ''}`;

// Utils -----------------------------------------------------------------------

function index_to_coordinate(i, width, height) {
    return [
        i % width,
        Math.floor(i/width) % height,
        Math.floor(i/(width * height)),
    ]
}
console.assert(`${index_to_coordinate(0, 8, 8, 3)}` == '0,0,0', '0,0,0');
console.assert(`${index_to_coordinate(7, 8, 8, 3)}` == '7,0,0', '7,0,0');
console.assert(`${index_to_coordinate(8, 8, 8, 3)}` == '0,1,0', '0,1,0');
console.assert(`${index_to_coordinate(64, 8, 8, 3)}` == '0,0,1', '0,0,1');
console.assert(`${index_to_coordinate(73, 8, 8, 3)}` =='1,1,1', '1,1,1');
console.assert(`${index_to_coordinate(146, 8, 8, 3)}` == '2,2,2', '2,2,2');
console.assert(`${index_to_coordinate(46, 4, 8, 2)}` == '2,3,1', '2,3,1');
console.assert(`${index_to_coordinate(63, 4, 8, 2)}` == '3,7,1', '1,7,3');


// https://stackoverflow.com/a/53389398/3356840
function randomString(length=8) {
    return ((Math.random()+3*Number.MIN_VALUE)/Math.PI).toString(36).slice(-length);
}


// Constants -------------------------------------------------------------------
const CLIENT_ID = randomString();

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
    return CHESS_PIECES.charAt(
        (CHESS_PIECES.indexOf(char) + CHESS_PIECES_WHITE.length) % CHESS_PIECES.length
    );
//    const CHESS_PIECE_UNICODE = 0x2654;
//    char_int = char.codePointAt(0) - CHESS_PIECE_UNICODE;
//    console.assert(char_int >=0 && char_int < 12, 'not a chess unicode character');
//    return String.fromCharCode(
//        ((char_int + 6) % 12) + CHESS_PIECE_UNICODE
//    );
}
//const CHESS_PIECE_COLOR_INVERSION_LOOKUP = new Map(strZip(
//    CHESS_PIECES_WHITE + CHESS_PIECES_BLACK,
//    CHESS_PIECES_BLACK + CHESS_PIECES_WHITE,
//));


// State -----------------------------------------------------------------------

let state = {
    tiles:
        '□■□■□■□■' +
        '■□■□■□■□' +
        '□■□■□■□■' +
        '■□■□■□■□' +
        '□■□■□■□■' +
        '■□■□■□■□' +
        '□■□■□■□■' +
        '■□■□■□■□' +

        '        ' +
        '        ' +
        '        ' +
        '        ' +
        '        ' +
        '        ' +
        '        ' +
        '        ' +

        '♜♞♝♛♚♝♞♜' +
        '♟♟♟♟♟♟♟♟' +
        '        ' +
        '        ' +
        '        ' +
        '        ' +
        '♙♙♙♙♙♙♙♙' +
        '♖♘♗♕♔♗♘♖'
    ,
    meta: {
        width: 8,
        height: 8,
        layers: 3,
    },
}


// Canvas ----------------------------------------------------------------------

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext('2d', { alpha: false });

let tile_width;
let tile_height;

function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    tile_width = canvas.width / state.meta.width;
    tile_height = canvas.height / state.meta.height;
    ctx.font = `${Math.min(tile_width, tile_height)}px serif`;
    drawDisplay();
}
new ResizeObserver(resizeCanvas).observe(canvas);


// Websocket -------------------------------------------------------------------

// Channel name from url#hash or auto-generate
const channel = window.location.hash.replace('#','');
if (!channel) {window.location.hash = `#${randomString()}`;}
const ws_url = `ws://${WEBSOCKET_HOST}/${channel}.ws`;
window.addEventListener('hashchange', ()=>{window.location.reload()});

const SOCKET_RECONNECT_INTERVAL_MS = 5000;
let socket;
function socketConnect() {
    if (socket) {
        console.warn('socket already active');
        return;
    }
    console.log('socket create', ws_url);
    socket = new WebSocket(ws_url);
    socket.addEventListener('open', function (event) {
        onConnect();
    });
    socket.addEventListener('close', function (event) {
        socket = undefined;
        onDisconnect();
        setTimeout(socketConnect, SOCKET_RECONNECT_INTERVAL_MS);
    });
    socket.addEventListener('message', function (event) {
        //console.debug('socket message', event.data);
        onMessage(JSON.parse(event.data));
    });
}

function onConnect() {
    console.log('socket open');
    sendMessage({message_type: 'request_state', client_id: CLIENT_ID});
}

function onDisconnect() {
    console.log('socket close');
}

function onMessage(msg) {
    // we can receive different types of message
    if (msg.message_type == 'request_state') {
        if (msg.client_id != CLIENT_ID) {
            sendMessage(state);
        }
    }
    else if (msg.message_type == 'message') {
        appendChatMessage(msg.message);
    }
    else {
        state = msg;
        drawDisplay();
    }
}

function sendMessage(_state) {
    if (!socket || socket.readyState != 1) {
        console.warn('Not connected to websocket');
        socketConnect();  // attempt reconnect
        onMessage(_state);  // manually push state locally
        return;
    }
    socket.send(JSON.stringify(_state));
    // this will trigger socket.message -> onMessage -> drawDisplay
}


// Chat Client -----------------------------------------------------------------

const chat_textarea = document.getElementsByTagName('textarea')[0];
const chat_input = document.getElementsByTagName('input')[0];
function textEventKeyDown(event) {
    if (event.keyCode==13) {
        sendMessage({
            message_type: 'message',
            message: `name: ${chat_input.value}`,
        });
        chat_input.value = "";
    }
}
chat_input.addEventListener('keydown', textEventKeyDown, true);
function appendChatMessage(message) {
    chat_textarea.value += `${message}\n`;
    chat_textarea.scrollTop = chat_textarea.scrollHeight;
}

// Input -----------------------------------------------------------------------

canvas.addEventListener('mousedown', (event) => {
    let x = event.clientX - canvas.getBoundingClientRect().left;
    let y = event.clientY - canvas.getBoundingClientRect().top;
    x = Math.floor(x/tile_width);
    y = Math.floor(y/tile_height);
    updateState(x, y);
    sendMessage(state);
});


// Game Logic ------------------------------------------------------------------

function updateState(x, y) {
    const chars = state.tiles.split('');
    const layer_size = state.meta.width * state.meta.height;

    const i1 = chars.findIndex((c)=>c==ACTIVE_CHAR);
    const i2 = x + (y * state.meta.width) + (layer_size * 1);

    if (i1 == -1) {
        console.debug(`set index ${i2} as ACTIVE_CHAR=${ACTIVE_CHAR}`);
        chars[i2] = ACTIVE_CHAR;
    }
    else if (i1 == i2) {
        console.debug(`selected same index ${i1} - set index as BLANK_CHAR=${BLANK_CHAR}`);
        chars[i1] = BLANK_CHAR;
    }
    else {
        console.debug(`set index:${i2 + layer_size} current_char:${chars[i2 + layer_size]} = index:${i1 + layer_size} char:${chars[i1 + layer_size]}`);
        chars[i2 + layer_size] = chars[i1 + layer_size];
        chars[i1 + layer_size] = BLANK_CHAR;
        chars[i1] = BLANK_CHAR;
        chars[i2] = BLANK_CHAR;
    }
    state.tiles = chars.join('');
}


// Display/Rendering -----------------------------------------------------------

function drawTile(char, x, y) {
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
            char = chess_piece_invert(char);
        }

        ctx.fillText(char, x_center, y_center);
        ctx.strokeText(char, x_center, y_center);
    }
}

function drawDisplay() {
    const size = [state.meta.width, state.meta.height, state.meta.layers];
    for (var i=0; i<state.tiles.length; i++) {
        drawTile(state.tiles[i], ...index_to_coordinate(i, ...size));
    }
}


// Main ------------------------------------------------------------------------

socketConnect();
