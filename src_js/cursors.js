/*
            Turtle Graphics

Version:    0.9.1
Licences:   MIT
Copyright:  Peter Lager 2025
            <quark(at)lagers.org.uk> 
            http://www.lagers.org.uk
User guide: http://www.lagers.org.uk/tg/guide/guide.html
*/

//  Simple class to hold an image to represent the turtle and the 
//  normalised position of the 'hotspot`
class Cursor {
    constructor(osc, fx, fy) {
        this._icon = osc; // OffscreenCanvas
        this._hx = fx * osc.width;
        this._hy = fy * osc.height;
    }
    get icon() { return this._icon; }
    get hitX() { return this._hx; }
    get hitY() { return this._hy; }
}

const [ARROW, BALL, DART, DIAMOND, HEXAGON, STAR, TRIANGLE, TURTLE] = (function () {
    let fc = 'greenyellow', sc = 'black', sw = 1, cursors = [];
    cursors.push(csrARROW(20));
    cursors.push(csrBALL(10));
    cursors.push(csrDART(20));
    cursors.push(csrDIAMOND(20));
    cursors.push(csrHEXAGON(20));
    cursors.push(csrSTAR(24));
    cursors.push(csrTRIANGLE(20));
    cursors.push(csrTURTLE(24, 'limegreen', 'burlywood', 1.5, 'saddlebrown'));
    return cursors;
})();

function csrARROW(size, fcol = 'greenyellow', sw = 1, scol = 'black') {
    let u = 0.1, c = [1, 4, 1, 6, 5, 6, 5, 8, 9, 5, 5, 2, 5, 4];
    let osc = __csrFromVertices(size, u, c, fcol, sw, scol);
    return new Cursor(osc, 0.5, 0.5);
}

function csrBALL(size, fcol = 'greenyellow', sw = 1, scol = 'black') {
    let s = size, s2 = s / 2;
    let osc = new OffscreenCanvas(size, size);
    let dc = osc.getContext('2d');
    dc.clearRect(0, 0, size, size);
    dc.fillStyle = fcol; dc.strokeStyle = scol; dc.lineWidth = sw;
    dc.beginPath(); // Rear then front legs
    dc.translate(s2, s2);
    dc.ellipse(0, 0, s2, s2, 0, 0, 2 * Math.PI);
    dc.fill();
    if (sw > 0) dc.stroke()
    dc.closePath();
    return new Cursor(osc, 0.5, 0.5);
}

function csrDART(size, fcol = 'greenyellow', sw = 1, scol = 'black') {
    let u = 0.1; c = [1, 1, 4, 5, 1, 9, 9, 5];
    let osc = __csrFromVertices(size, u, c, fcol, sw, scol);
    return new Cursor(osc, 0.5, 0.5);
}

function csrDIAMOND(size, fcol = 'greenyellow', sw = 1, scol = 'black') {
    let u = 0.05, c = [5, 10, 10, 19, 15, 10, 10, 1];
    let osc = __csrFromVertices(size, u, c, fcol, sw, scol);
    return new Cursor(osc, 0.5, 0.5);
}

function csrHEXAGON(size, fcol = 'greenyellow', sw = 1, scol = 'black') {
    nbrSides = 6;
    let r = 0.95, da = 2 * Math.PI / nbrSides;
    let c = [];
    for (let i = 0; i < nbrSides; i++) {
        c.push(r * Math.cos(i * da));
        c.push(r * Math.sin(i * da));
    }
    let osc = __csrFromVertices(size, 0.5, c, fcol, sw, scol, [0.5, 0.5]);
    return new Cursor(osc, 0.5, 0.5);
}

function csrSTAR(size, fcol = 'greenyellow', sw = 1, scol = 'black') {
    nbrPts = 5;
    let r0 = 0.25, r1 = 0.95, da = Math.PI / nbrPts, c = [];
    for (let i = 0; i < 2 * nbrPts; i++) {
        let r = i % 2 == 0 ? r1 : r0;
        c.push(r * Math.cos(i * da));
        c.push(r * Math.sin(i * da));
    }
    let osc = __csrFromVertices(size, 0.5, c, fcol, sw, scol, [0.5, 0.5]);
    return new Cursor(osc, 0.5, 0.5);
}


function csrTRIANGLE(size, fcol = 'greenyellow', sw = 1, scol = 'black') {
    let u = 0.1, c = [3, 2, 3, 8, 9, 5];
    let osc = __csrFromVertices(size, u, c, fcol, sw, scol);
    return new Cursor(osc, 0.5, 0.5);
}

function csrTURTLE(size, skin_col = 'limegreen', shell_col = 'burlywood', sw = 1, scol = 'saddlebrown') {
    function rads(deg) { return deg * Math.PI / 180; }
    let s = size, s2 = s / 2, sw2 = sw / 3;
    let osc = new OffscreenCanvas(size, size);
    let dc = osc.getContext('2d');
    dc.clearRect(0, 0, size, size);
    dc.translate(s2, s2);
    // Back legs
    let x = 0.27 * s, y = 0.2 * s, angle = rads(31);
    dc.fillStyle = skin_col; dc.strokeStyle = scol; dc.lineWidth = sw2;
    dc.beginPath(); // Rear then front legs
    dc.ellipse(-x, y, 0.2 * s, 0.08 * s, -angle, 0, 2 * Math.PI)
    dc.ellipse(-x, -y, 0.2 * s, 0.08 * s, angle, 0, 2 * Math.PI)
    dc.fill(); dc.stroke();
    // front legs
    x = 0.1 * s; y = 0.2 * s; angle = rads(0);
    dc.beginPath(); // Rear then front legs
    dc.ellipse(x, y, 0.08 * s, 0.2 * s, -angle, 0, 2 * Math.PI)
    dc.ellipse(x, -y, 0.08 * s, 0.2 * s, angle, 0, 2 * Math.PI)
    dc.fill(); dc.stroke();
    // Tail
    dc.beginPath();
    let cx = -0.37 * s, rx = 0.2 * s, ry = 0.05 * s;
    dc.ellipse(cx, 0, rx, ry, 0, 0, 2 * Math.PI);
    dc.fill(); dc.stroke();
    // Head
    dc.beginPath();
    cx = 0.3 * s; rx = 0.175 * s; ry = 0.125 * s;
    dc.ellipse(cx, 0, rx, ry, 0, 0, 2 * Math.PI);
    dc.fill(); dc.stroke();
    // Body
    cx = -0.05 * s, rx = 0.35 * s, ry = 0.25 * s;
    dc.fillStyle = shell_col; dc.strokeStyle = scol; dc.lineWidth = sw;
    dc.beginPath();
    dc.ellipse(cx, 0, rx, ry, 0, 0, 2 * Math.PI);
    dc.fill(); dc.stroke();
    // Body
    let inner = getArray2D(6, 2), outer = getArray2D(6, 2);
    let r = 0.13 * s;
    for (let i = 0; i < inner.length; i++) {
        let a = (rads(30 + i * 60));
        let sinA = Math.sin(a), cosA = Math.cos(a);
        inner[i][0] = cx + r * cosA;
        inner[i][1] = r * sinA;
        outer[i][0] = cx + rx * cosA;
        outer[i][1] = ry * sinA;
    }
    dc.lineWidth = sw2;
    dc.beginPath();
    for (let i = 0; i < inner.length; i++) {
        dc.moveTo(outer[i][0], outer[i][1]);
        dc.lineTo(inner[i][0], inner[i][1]);
    }
    for (let i = 0; i < inner.length; i++) {
        dc.lineTo(inner[i][0], inner[i][1]);
    }
    dc.stroke();
    return new Cursor(osc, 0.5, 0.5);
}

function __csrFromVertices(size, unit, coords, fcol, sw = 0, scol = 'transparent', coord_org = [0, 0]) {
    let pts = coords.map(v => v * unit * size);
    let osc = new OffscreenCanvas(size, size);
    let dc = osc.getContext('2d');
    dc.clearRect(0, 0, size, size);
    dc.translate(size * coord_org[0], size * coord_org[1]);
    dc.fillStyle = fcol; dc.strokeStyle = scol; dc.lineWidth = sw;
    let x0 = pts.shift(), y0 = pts.shift();
    dc.beginPath();
    dc.moveTo(x0, y0);
    while (pts.length >= 2) dc.lineTo(pts.shift(), pts.shift());
    dc.lineTo(x0, y0);
    dc.fill();
    if (sw > 0) dc.stroke();
    dc.closePath();
    return osc;
}


