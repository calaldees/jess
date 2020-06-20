// Utils -----------------------------------------------------------------------

// https://stackoverflow.com/a/1431113/3356840
function replaceAt(string, index, replacement) {
    return string.substr(0, index) + replacement + string.substr(index + replacement.length);
}

function all(iterable) {
    for (let i of iterable) {
        if (!i) {return false;}
    }
    return true;
}
function* zip(...iterables) {
    const iterators = [...iterables].map(iterable => iterable[Symbol.iterator]());
    while (true) {
        const iterable_items = iterators.map(iterator => iterator.next());
        if (all(iterable_items.map(i => i.done))) {break;}
        yield iterable_items.map(i => i.value);
    }
}
function* enumerate(iterable) {
    let count = 0;
    for (let item of iterable) {
        yield [count++, item];
    }
}

// this

function* diffStrIndexs(aa, bb) {
    console.assert(aa.length == bb.length, 'string length must match for diffStr to work');
    for (let i=0 ; i < aa.length ; i++) {
        if (aa.charAt(i) != bb.charAt(i)) {
            yield i;
        }
    }
}
function countChars(string, chars) {
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
const CHESS_PIECE_COLOR_INVERSION_LOOKUP = new Map(zip(
    CHESS_PIECES_WHITE + CHESS_PIECES_BLACK,
    CHESS_PIECES_BLACK + CHESS_PIECES_WHITE,
));


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

// Resize (could be put in function later)
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const tile_width = canvas.width / state.meta.width;
const tile_height = canvas.height / state.meta.height;
ctx.font = `${Math.min(tile_width, tile_height)}px serif`;


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
    //console.log("x: " + x + " y: " + y);
    updateState(x, y);
    sendState();
});


// Game Logic ------------------------------------------------------------------

function updateState(x, y) {
    const i2 = x + (y * state.meta.width);
    const blank_layer = BLANK_CHAR.repeat(state.meta.width * state.meta.height);
    const active_layer = state.layers[1];
    const active_count = countChars(active_layer, ACTIVE_CHAR);
    if (active_count == 0) {
        state.layers[1] = replaceAt(active_layer, i2, ACTIVE_CHAR);
    }
    if (active_count == 1) {
        const i1 = [...diffStrIndexs(blank_layer, active_layer)][0];
        const char = state.layers[2].charAt(i1);
        state.layers[2] = replaceAt(state.layers[2], i1, BLANK_CHAR);
        state.layers[2] = replaceAt(state.layers[2], i2, char);
        state.layers[1] = blank_layer;
    }
}


// Display/Rendering -----------------------------------------------------------

function drawTile(x, y, char) {
    x = x * tile_width;
    y = y * tile_height;
    ctx.lineWidth = tile_width / 64;

    if (char == '□') {
        ctx.fillStyle = CHESS_BOARD_COLOR_WHITE;
        ctx.fillRect(x, y, tile_width, tile_height);
    }
    else if (char == '■') {
        ctx.fillStyle = CHESS_BOARD_COLOR_BLACK;
        ctx.fillRect(x, y, tile_width, tile_height);
    }
    else if (char == ACTIVE_CHAR) {
        ctx.fillStyle = ACTIVE_CHAR_COLOR;
        ctx.fillRect(x, y, tile_width, tile_height);
        ctx.strokeStyle = ACTIVE_CHAR_COLOR_BORDER;
        ctx.strokeRect(x, y, tile_width, tile_height);

    }
    else if (char == ' ') {
        // nothing
    }
    else {
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';

        if (CHESS_PIECES_BLACK.indexOf(char) >= 0) {
            ctx.fillStyle = CHESS_PIECE_COLOR_BLACK;
        }
        if (CHESS_PIECES_WHITE.indexOf(char) >= 0) {
            ctx.fillStyle = CHESS_PIECE_COLOR_WHITE;
            char = CHESS_PIECE_COLOR_INVERSION_LOOKUP.get(char);
        }

        const xc = x + (tile_width/2);
        const yc = y + (tile_height/2);
        ctx.fillText(char, xc, yc);
        ctx.strokeStyle = 'black';
        ctx.strokeText(char, xc, yc);
    }
}

function drawDisplay() {
    for (let layer of state.layers) {
        for (var index=0; index<layer.length; index++) {
            let [x, y] = [index % state.meta.height, Math.floor(index/state.meta.height)];
            drawTile(x, y, layer[index]);
        }
    }
}


// Main ------------------------------------------------------------------------

drawDisplay();
