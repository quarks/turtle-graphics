/*
            Turtle Text

Version:    !!VERSION!!
Licences:   MIT
Copyright:  Peter Lager 2025
            <quark(at)lagers.org.uk> 
            http://www.lagers.org.uk
User guide: http://www.lagers.org.uk/tg/guide/guide.html
*/

"use strict";

const [format, addText, length] = (function () {
    const { PI, atan, min, sqrt } = Math;
    const r2d = 180 / PI;
    const m = new Map();

    // ##################################################################
    //  Turtle drawing code for ASCII characters
    // ##################################################################

    function initChar(t, ps, width, scale) {
        let w = ps * width * scale;
        t.pensize(ps).cap(BUTT).pu().dxy(w, 0).push_pen().dxy(-w, 0);
        return t;
    }

    m.set(' ', { w: 3, f: _32, isSpace: true });
    function _32(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).pop_pen();
    }

    m.set('!', { w: 2, f: _33 });
    function _33(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale)
            .dxy(1 * s, -6 * h).f(90).cap(SQUARE).pd()
            .fd(4 * h).pu().cap(BUTT).fd(1.5 * h).pd().fd(h).pop_pen();
    }

    m.set('"', { w: 3.5, f: _34 });
    function _34(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(s, -6.25 * h).f(90).cap(SQUARE).pd()
            .fd(1.5 * h).dxy(1.5 * s, -1.5 * h).pd().fd(1.5 * h).pop_pen();
    }

    m.set('#', { w: 6.5, f: _35 });
    function _35(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(3 * s, -6 * h).cap(SQUARE)
            .pd().goby(-1.5 * s, 6 * h).pu().dxy(3.5 * s, -6 * h)
            .pd().goby(-1.5 * s, 6 * h).pu().dxy(-2.5 * s, -4 * h).f(0)
            .pd().fd(5 * s).pu().dxy(-5.5 * s, 2 * h).pd().fd(5 * s)
            .pop_pen();
    }

    m.set('$', { w: 5, f: _36 });
    function _36(t, ps, h, width, scale, s) {
        let rx = 1.5 * s, ry = 1.25 * h;
        initChar(t, ps, width, scale).dxy(2.5 * s, -3 * h).push_pen()
            .f(0).pu().oval(rx, ry, 100, LT).pd().oval(ry, rx, 260, LT)
            .oval(rx, ry, 260, RT).pop_pen().dxy(0, -4 * h).f(90).pd()
            .fd(8 * h).pop_pen();
    }

    m.set('%', { w: 6, f: _37 });
    function _37(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(1.5 * s, -6 * h).pd().cap(SQUARE)
            .oval(0.8 * s, 1.5 * h, 360, RT).dxy(3 * s, 0)
            .goby(-3 * s, 6 * h).cap(BUTT).dxy(3 * s, -3 * h).f(0)
            .oval(0.8 * s, 1.5 * h, 360, RT).pop_pen();
    }

    m.set('&', { w: 5.5, f: _38 });
    function _38(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(4.5 * s, -3.5 * h).f(90).pd().fd(1.5 * h)
            .oval(1.5 * h, 2 * s, 90, RT).oval(2 * s, 1.5 * h, 180, RT)
            .oval(1.5 * s, 1.25 * h, 360, LT).oval(s, 2 * h, 45, RT)
            .goby(1.75 * s, 3 * h).pop_pen()
    }

    m.set('\'', { w: 2, f: _39 });
    function _39(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(s, -6.25 * h).f(90).cap(SQUARE).pd()
            .fd(1.5 * h).pop_pen();
    }

    m.set('(', { w: 3, f: _40 });
    function _40(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale)
            .dxy(2.5 * s, -6.5 * h).f(180).pd()
            .oval(1.5 * s, 4 * h, 180, LT).pop_pen();
    }

    m.set(')', { w: 3, f: _41 });
    function _41(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(0.5 * s, -6.5 * h).f(0).pd()
            .oval(1.5 * s, 4 * h, 180, RT).pop_pen();
    }

    m.set('*', { w: 5, f: _42 });
    function _42(t, ps, h, width, scale, s) {
        let d = 4 * s, dy = 7 * h - 3 * s;
        initChar(t, ps, width, scale)
            .dxy(2.5 * s, -dy).f(270)
            .push_pen().bk(d / 2).pd().fd(d).pu().pop_pen().rt(120)
            .push_pen().bk(d / 2).pd().fd(d).pu().pop_pen().rt(120)
            .push_pen().bk(d / 2).pd().fd(d).pu().pop_pen().pop_pen();
    }

    m.set('+', { w: 6, f: _43 });
    function _43(t, ps, h, width, scale, s) {
        let d = min(4.25 * s, 5 * h);
        initChar(t, ps, width, scale)
            .dxy(3 * s, (d - 7 * h) / 2).f(270)
            .pd().fd(d).dxy(-d / 2, d / 2).f(0).fd(d).pop_pen();
    }

    m.set(',', { w: 2, f: _44 });
    function _44(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(s, -s).f(90).pd().fd(s)
            .cap(ROUND).pensize(0.65 * ps).goby(-0.75 * s, 1.25 * h).pop_pen();
    }

    m.set('-', { w: 3.5, f: _45 });
    function _45(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(0.5 * s, - 3.5 * h).pd().fd(2.5 * s)
            .pop_pen();
    }

    m.set('.', { w: 2, f: _46 });
    function _46(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(s, -s).f(90).pd().fd(s)
            .pop_pen();
    }

    m.set('/', { w: 3.5, f: _47 });
    function _47(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(2.8 * s, -6 * h).cap(SQUARE).pd()
            .goby(-1.5 * s, 7.5 * h).pop_pen();
    }

    m.set('0', { w: 5, f: _48 });
    function _48(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(2.5 * s, -6 * h).pd().oval(1.5 * s, 3 * h)
            .pop_pen();
    }

    m.set('1', { w: 5, f: _49 });
    function _49(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(s, -5.3 * h)
            .pd().oval(1.5 * s, h, 90, LT).f(90).fd(6.3 * h)
            .dxy(-1.5 * s, 0).f(0).fd(3 * s).pop_pen();
    }

    m.set('2', { w: 5, f: _50 });
    function _50(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(s, -4 * h).f(270).pd()
            .oval(2 * h, 1.5 * s, 225, RT).cap(ROUND)
            .goby(-2.5 * s, 2.5 * h).cap(BUTT).f(0).fd(3.5 * s)
            .pop_pen();
    }

    m.set('3', { w: 5, f: _51 });
    function _51(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(s, -5 * h).f(270).pd()
            .oval(h, 1.5 * s, 180, RT).oval(1.5 * h, 2 * s, 90, RT).f(0)
            .oval(2 * s, 1.75 * h, 180, RT).oval(1.5 * s, 1.75 * h, 60, RT)
            .pop_pen();
    }

    m.set('4', { w: 5, f: _52 });
    function _52(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(4.5 * s, -2 * h).f(180).pd()
            .fd(1.5 * s).cap(ROUND).fd(2 * s).goby(2.5 * s, -4 * h)
            .cap(BUTT).goby(0, 6 * h).fd(0.5 * s).pop_pen();
    }

    m.set('5', { w: 5, f: _53 });
    function _53(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(3.5 * s, -6 * h).f(180).pd().cap(SQUARE)
            .fd(2 * s).lt(90).fd(2.5 * h).lt(90).fd(s)
            .oval(1.7 * s, 1.75 * h, 200, RT).pop_pen();
    }

    m.set('6', { w: 5, f: _54 });
    function _54(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(s, -1.75 * h).f(270).pd()
            .oval(1.75 * h, 1.5 * s, 360, RT).oval(4.25 * h, 1.2 * s, 90, RT)
            .oval(2 * s, 1.5 * h, 60, RT).pop_pen();
    }

    m.set('7', { w: 5, f: _55 });
    function _55(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(0.5 * s, -6 * h).pd()
            .fd(2 * s).cap(ROUND).fd(2 * s)
            .goby(-1.7 * s, 3 * h).cap(BUTT)
            .goby(-1.7 * s, 3.1 * h).pop_pen();
    }

    m.set('8', { w: 5, f: _56 });
    function _56(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(2.5 * s, -3 * h).f(180).pd()
            .oval(1.5 * s, 1.5 * h, 360, RT).oval(1.75 * s, 1.5 * h, 360, LT)
            .pop_pen();
    }

    m.set('9', { w: 5, f: _57 });
    function _57(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(4 * s, -4.25 * h).f(90).pd()
            .oval(1.75 * h, 1.5 * s, 360, RT)
            .oval(4.25 * h, 1.2 * s, 90, RT)
            .oval(2 * s, 1.5 * h, 60, RT).pop_pen();
    }

    m.set(':', { w: 2, f: _58 });
    function _58(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(1 * s, -4 * h).f(90)
            .pd().fd(s).dxy(0, -2 * s + 4 * h).fd(s).pop_pen();
    }

    m.set(';', { w: 2, f: _59 });
    function _59(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(s, -4 * h).f(90)
            .pd().fd(s).dxy(0, -2 * s + 4 * h).fd(s)
            .cap(ROUND).pensize(0.65 * ps).goby(-0.75 * s, 1.25 * h)
            .pop_pen();
    }

    m.set('<', { w: 5.5, f: _60 });
    function _60(t, ps, h, width, scale, s) {
        let dx = 4.5 * s, dy = 2 * h, hyp = sqrt(dx * dx + dy + dy);
        let a = atan(dy / dx); if (t._degrees) a = r2d * a;
        initChar(t, ps, width, scale).dxy(5 * s, -4.5 * h).f(180).pd().lt(a).fd(hyp / 2)
            .cap(ROUND).fd(hyp / 2).lt(180 - 2 * a).fd(hyp / 2).cap(BUTT)
            .fd(hyp / 2).pop_pen();
    }

    m.set('=', { w: 6, f: _61 });
    function _61(t, ps, h, width, scale, s) {
        let dx = 4 * s;
        initChar(t, ps, width, scale).dxy(s, -3.5 * h).f(0).pd().fd(dx)
            .dxy(-dx, 1.75 * h).fd(dx).pop_pen();
    }

    m.set('>', { w: 5.5, f: _62 });
    function _62(t, ps, h, width, scale, s) {
        let dx = 4.5 * s, dy = 2 * h, hyp = sqrt(dx * dx + dy + dy);
        let a = atan(dy / dx); if (t._degrees) a = r2d * a;
        initChar(t, ps, width, scale)
            .dxy(0.5 * s, -4.5 * h).f(0).pd()
            .rt(a).fd(hyp / 2).cap(ROUND).fd(hyp / 2)
            .rt(180 - 2 * a).fd(hyp / 2).cap(BUTT).fd(hyp / 2)
            .pop_pen();
    }

    m.set('?', { w: 5, f: _63 });
    function _63(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(s, -4.5 * h).f(270).pd()
            .oval(1.5 * h, 1.5 * s, 270, RT).cap(SQUARE).lt(90).fd(1.5 * h)
            .cap(BUTT).dxy(0, h).fd(h).pop_pen();
    }

    m.set('@', { w: 8, f: _64 });
    function _64(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale)
            .dxy(5.1 * s, -4.5 * h).f(90).pd().fd(2 * h)
            .oval(1.5 * h, 1.255 * s, 360, RT).fd(h)
            .oval(0.5 * h, s, 180, LT).fd(h)
            .oval(3.5 * h, 3.2 * s, 180, LT).oval(3 * h, 3.25 * s, 110, LT)
            .pop_pen();
    }

    m.set('A', { w: 5.9, f: _65 });
    function _65(t, ps, h, width, scale, s) {
        let dx = 2.2 * s, dy = 5.8 * h, s2 = 0.75 * s;
        let l13 = sqrt(dx * dx + dy * dy) / 3, l23 = 2 * l13;
        let a = atan(dy / dx), b = PI / 2 - a;
        if (t._degrees) { a = r2d * a; b = r2d * b; }
        initChar(t, ps, width, scale).dxy(s2, 0).f(0).cap(SQUARE).pd().lt(a).fd(l13)
            .cap(ROUND).fd(l23).rt(180 - 2 * b).fd(l23).cap(ROUND).fd(l13)
            .pu().bk(l13).rt(90 + b).pd().fd(4 * dx / 3).pop_pen();
    }

    m.set('B', { w: 6, f: _66 });
    function _66(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(s, 0).f(270).cap(SQUARE)
            .pd().fd(6 * h).rt(90).cap(BUTT).fd(2 * s)
            .oval(1.6 * s, 1.25 * h, 180, RT).fd(2 * s).f(0).dxy(2 * s, 0)
            .oval(1.9 * s, 1.75 * h, 180, RT).fd(2 * s)
            .pop_pen();
    }

    m.set('C', { w: 6.2, f: _67 });
    function _67(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(s, -3 * h).pd()
            .push_pen().f(270).oval(3 * h, 2.4 * s, 139, RT).pop_pen().f(90)
            .oval(3 * h, 2.4 * s, 135, LT).pop_pen()
    }

    m.set('D', { w: 6.5, f: _68 });
    function _68(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(s, 0).f(270).cap(SQUARE)
            .pd().fd(6 * h).rt(90).fd(2 * s).oval(2.5 * s, 3 * h, 180, RT)
            .fd(2 * s).pop_pen();
    }

    m.set('E', { w: 5, f: _69 });
    function _69(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(4 * s, -6 * h).f(180).pd().cap(SQUARE)
            .fd(3 * s).lt(90).fd(6 * h).lt(90).fd(3 * s)
            .dxy(-3 * s, -3.25 * h).f(0).fd(2.5 * s).pop_pen();
    }

    m.set('F', { w: 5, f: _70 });
    function _70(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(4 * s, -6 * h).f(180).pd().cap(SQUARE)
            .fd(3 * s).lt(90).fd(6 * h).lt(90).dxy(0, -3.25 * h).f(0)
            .fd(2.5 * s).pop_pen();
    }

    m.set('G', { w: 6, f: _71 });
    function _71(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(3.5 * s, -6 * h).pd()
            .push_pen().oval(2 * s, h, 60, RT).pop_pen().f(180)
            .oval(2.5 * s, 3 * h, 180, LT).oval(1.5 * s, 0.5 * h, 60, LT)
            .f(270).cap(SQUARE).fd(2 * h).lt(90).fd(s).pop_pen();
    }

    m.set('H', { w: 6, f: _72 });
    function _72(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(s, -6 * h).f(90).pd().cap(SQUARE)
            .fd(6 * h).dxy(4 * s, -6 * h).fd(6 * h).dxy(-4 * s, -3.3 * h)
            .f(0).cap(BUTT).fd(4 * s).pop_pen();
    }

    m.set('I', { w: 3, f: _73 });
    function _73(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(1.5 * s, -6 * h).f(90).pd().cap(SQUARE)
            .fd(6 * h).dxy(-s, -6 * h).cap(BUTT).f(0).fd(2 * s)
            .dxy(-2 * s, 6 * h).fd(2 * s)
            .pop_pen();
    }

    m.set('J', { w: 3.5, f: _74 });
    function _74(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(1.5 * s, -6 * h).pd().cap(SQUARE)
            .fd(s).rt(90).cap(BUTT).fd(5 * h).oval(h, 1.3 * s, 120, RT)
            .pop_pen();
    }

    m.set('K', { w: 5.5, f: _75 });
    function _75(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(s, -6 * h).f(90).pd().cap(SQUARE)
            .fd(6 * h).dxy(0, -2.2 * h).cap(BUTT).goby(3.5 * s, -3.9 * h)
            .dxy(-2.7 * s, 3 * h).goby(3 * s, 3.15 * h)
            .pop_pen();
    }

    m.set('L', { w: 5, f: _76 });
    function _76(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(s, -6 * h).f(90).pd().cap(SQUARE)
            .fd(6 * h).lt(90).fd(3 * s)
            .pop_pen();
    }

    m.set('M', { w: 7, f: _77 });
    function _77(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(s, 0).f(270).pd().cap(SQUARE)
            .fd(6 * h).cap(ROUND).goby(2.5 * s, 4 * h).goby(2.5 * s, -4 * h)
            .cap(SQUARE).f(90).fd(6 * h)
            .pop_pen();
    }

    m.set('N', { w: 6, f: _78 });
    function _78(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(s, 0).f(270).pd().cap(SQUARE)
            .fd(6 * h).cap(ROUND).goby(4 * s, 6 * h)
            .cap(SQUARE).f(270).fd(6 * h)
            .pop_pen();
    }

    m.set('O', { w: 7, f: _79 });
    function _79(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(3.5 * s, -6 * h).pd()
            .oval(2.5 * s, 3 * h, 360, RT)
            .pop_pen();
    }

    m.set('P', { w: 5.5, f: _80 });
    function _80(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(s, 0).f(270).cap(SQUARE)
            .pd().fd(6 * h).rt(90).cap(BUTT).fd(2 * s)
            .oval(1.6 * s, 1.8 * h, 180, RT).fd(2 * s).pop_pen();
    }

    m.set('Q', { w: 7, f: _81 });
    function _81(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(3.5 * s, -6 * h).pd()
            .oval(2.5 * s, 3 * h, 360, RT).dxy(0.5 * s, 6 * h).f(90)
            .cap(SQUARE).oval(1.5 * h, 1.8 * s, 90, LT)
            .pop_pen();
    }

    m.set('R', { w: 5.5, f: _82 });
    function _82(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(s, 0).f(270).cap(SQUARE)
            .pd().fd(6 * h).rt(90).cap(BUTT).fd(2 * s)
            .oval(1.6 * s, 1.8 * h, 180, RT).fd(2 * s).dxy(2 * s, 0)
            .goby(1.95 * s, 2.6 * h).pop_pen();
    }

    m.set('S', { w: 5, f: _83 });
    function _83(t, ps, h, width, scale, s) {
        let rx = 1.5 * s, ry = 1.5 * h;
        initChar(t, ps, width, scale).dxy(2.5 * s, -3 * h)
            .oval(rx, ry, 100, LT).pd().oval(ry, rx, 260, LT)
            .oval(rx, ry, 260, RT).pop_pen();
    }

    m.set('T', { w: 5, f: _84 });
    function _84(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(0.5 * s, -6 * h).pd()
            .fd(4 * s).dxy(-2 * s, 0).rt(90).cap(SQUARE).fd(6 * h)
            .pop_pen();
    }

    m.set('U', { w: 6, f: _85 });
    function _85(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(s, -6 * h).pd().f(90)
            .cap(SQUARE).fd(4.5 * h).oval(1.5 * h, 2 * s, 180, LT)
            .cap(SQUARE).fd(4.5 * h).pop_pen();
    }

    m.set('V', { w: 6, f: _86 });
    function _86(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(s, -6 * h).pd().cap(SQUARE)
            .goby(s, 3 * h).cap(ROUND).goby(s, 3 * h)
            .goby(s, -3 * h).cap(SQUARE).goby(s, -3 * h)
            .pop_pen();
    }

    m.set('W', { w: 8, f: _87 });
    function _87(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(s, -6 * h).pd().cap(SQUARE)
            .goby(0.75 * s, 3 * h).cap(ROUND)
            .goby(0.75 * s, 3 * h).goby(1.5 * s, -6 * h)
            .goby(1.5 * s, 6 * h).goby(0.75 * s, -3 * h).cap(SQUARE)
            .goby(0.75 * s, -3 * h).pop_pen();
    }

    m.set('X', { w: 5.5, f: _88 });
    function _88(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(s, -6 * h).pd().cap(SQUARE)
            .goby(3.5 * s, 6 * h).dxy(0, -6 * h).goby(-3.5 * s, 6 * h)
            .pop_pen();
    }

    m.set('Y', { w: 6, f: _89 });
    function _89(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(s, -6 * h).pd().cap(SQUARE)
            .goby(s, 1.75 * h).cap(ROUND).goby(s, 1.75 * h)
            .goby(s, -1.75 * h).cap(SQUARE).goby(s, -1.75 * h)
            .dxy(-2 * s, 3.5 * h).cap(ROUND).goby(0, 1.5 * h)
            .cap(SQUARE).goby(0, h)
            .pop_pen();
    }

    m.set('Z', { w: 5, f: _90 });
    function _90(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(s, -6 * h).pd().cap(SQUARE)
            .fd(1.5 * s).cap(ROUND).fd(1.5 * s).goby(-3 * s, 6 * h)
            .goby(1.5 * s, 0).cap(SQUARE).goby(1.5 * s, 0).pop_pen();
    }

    m.set('[', { w: 3.3, f: _91 });
    function _91(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(2.5 * s, -6 * h).f(180).cap(SQUARE).pd()
            .fd(1.5 * s).lt(90).fd(7.5 * h).lt(90).fd(1.5 * s).pop_pen();
    }

    m.set('\\', { w: 3.5, f: _92 });
    function _92(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(0.7 * s, -6 * h).cap(SQUARE).pd()
            .goby(1.5 * s, 7.5 * h).pop_pen();
    }

    m.set(']', { w: 3.3, f: _93 });
    function _93(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(s, -6 * h).f(0).cap(SQUARE).pd()
            .fd(1.5 * s).rt(90).fd(7.5 * h).rt(90).fd(1.5 * s).pop_pen();
    }

    m.set('^', { w: 5, f: _94 });
    function _94(t, ps, h, width, scale, s) {
        let dh = 1.5 * h;
        initChar(t, ps, width, scale).dxy(0.5 * s, -3 * h).pd()
            .goby(s, -dh).cap(ROUND).goby(s, -dh).goby(s, dh).cap(BUTT)
            .goby(s, dh).pop_pen();
    }

    m.set('_', { w: 5, f: _95 });
    function _95(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(0, 0.12 * h).pd().goby(5 * s, 0).pop_pen();
    }

    m.set('`', { w: 2, f: _96 });
    function _96(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(0.75 * s, -6.25 * h).f(90).cap(SQUARE).pd()
            .goby(0.25 * s, 1.5 * h).pop_pen();
    }

    m.set('a', { w: 5, f: _97 });
    function _97(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(s, -3.5 * h).f(270).pd().cap(SQUARE)
            .oval(0.5 * h, 1.5 * s, 180, RT).fd(h).cap(SQUARE)
            .fd(2.5 * h).cap(BUTT).dxy(0, -2.5 * h).f(180).fd(s)
            .oval(2 * s, 1.25 * h, 180, LT)
            .oval(s, h, 90, LT).pop_pen();
    }

    m.set('b', { w: 5.2, f: _98 });
    function _98(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(s, 0).push_pen()
            .dxy(0, -3.5 * h).f(270).pd().cap(BUTT)
            .oval(0.5 * h, 1.75 * s, 90, RT).oval(1.75 * s, 2 * h, 180, RT)
            .oval(1.75 * s, 0.5 * h, 90, RT).pop_pen().dxy(0, -6 * h).pd()
            .cap(SQUARE).f(90).fd(6 * h).pop_pen();
    }

    m.set('c', { w: 5.2, f: _99 });
    function _99(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(4.5 * s, -3.0 * h).f(270).pd().cap(BUTT)
            .fd(0.5 * h).oval(0.5 * h, 1.75 * s, 90, LT)
            .oval(1.75 * s, 2 * h, 180, LT).oval(1.75 * s, 0.5 * h, 90, LT)
            .fd(0.5 * h).pop_pen();
    }

    m.set('d', { w: 5.4, f: _100 });
    function _100(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(4.5 * s, 0).push_pen()
            .dxy(0, -3.5 * h).f(270).pd().cap(BUTT)
            .oval(0.5 * h, 1.75 * s, 90, LT).oval(1.75 * s, 2 * h, 180, LT)
            .oval(1.75 * s, 0.5 * h, 90, LT).pop_pen().dxy(0, -6 * h).pd()
            .cap(SQUARE).f(90).fd(6 * h).pop_pen();
    }

    m.set('e', { w: 5.4, f: _101 });
    function _101(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(s, -2 * h).pd().cap(SQUARE)
            .fd(3 * s).f(270).cap(BUTT).oval(2 * h, 1.5 * s, 270, LT)
            .oval(1.5 * s, -h, 90, LT).pop_pen();
    }

    m.set('f', { w: 4, f: _102 });
    function _102(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(3.5 * s, -6 * h).pd().f(180)
            .oval(-2 * s, 0.75 * h, 90, LT).cap(SQUARE)
            .fd(5.25 * h).cap(BUTT).dxy(-s, -4 * h).f(0).fd(3 * s)
            .pop_pen();
    }

    m.set('g', { w: 5.4, f: _103 });
    function _103(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(4.5 * s, 0).push_pen().dxy(0, -3.5 * h)
            .f(270).pd().cap(BUTT).oval(0.5 * h, 1.75 * s, 90, LT)
            .oval(1.75 * s, 2 * h, 180, LT).oval(1.75 * s, 0.5 * h, 90, LT)
            .pop_pen().dxy(0, -4 * h).pd().cap(SQUARE).f(90).fd(4 * h)
            .oval(2 * h, 2 * s, 90, RT).fd(s).pop_pen();
    }

    m.set('h', { w: 5.2, f: _104 });
    function _104(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(s, -6 * h).pd().f(90).cap(SQUARE)
            .fd(6 * h).dxy(0, -3 * h).f(270).cap(BUTT)
            .oval(h, 1.5 * s, 180, RT).cap(SQUARE).fd(3 * h)
            .pop_pen();
    }

    m.set('i', { w: 3, f: _105 });
    function _105(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(1.5 * s, -4 * h).pd().f(90).cap(SQUARE)
            .fd(4 * h).cap(BUTT).dxy(0, -6 * h).fd(h)
            .pop_pen();
    }

    m.set('j', { w: 3, f: _106 });
    function _106(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(1.5 * s, -4 * h).pd().f(90).cap(SQUARE)
            .fd(2 * h).cap(BUTT).fd(2 * h).oval(1.5 * h, -1.5 * s, 90, RT)
            .dxy(1.5 * s, -7.5 * h).f(90).fd(h).pop_pen();
    }

    m.set('k', { w: 5, f: _107 });
    function _107(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(s, -6 * h).pd().f(90).cap(SQUARE)
            .fd(6 * h).dxy(3 * s, -4.5 * h).cap(BUTT)
            .goby(-1.5 * s, 1.25 * h).cap(ROUND).goby(-1.5 * s, 1.25 * h)
            .dxy(0.67 * s, -0.5 * h).goby(1.3 * s, 1.25 * h)
            .cap(SQUARE).goby(1.3 * s, 1.25 * h).pop_pen();
    }

    m.set('l', { w: 3, f: _108 });
    function _108(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(1.5 * s, -6 * h).pd().f(90).cap(SQUARE)
            .fd(6 * h).pop_pen();
    }

    m.set('m', { w: 8, f: _109 });
    function _109(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(s, -4 * h).f(90).pd().cap(SQUARE).fd(4 * h)
        for (let i = 0; i < 2; i++)
            t.dxy(0, -3 * h).f(270).oval(h, 1.5 * s, 180, RT)
                .cap(ROUND).fd(1.5 * h).cap(SQUARE).fd(1.5 * h)
        t.pop_pen();
    }

    m.set('n', { w: 5, f: _110 });
    function _110(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(s, -4 * h).f(90).pd().cap(SQUARE).fd(4 * h)
            .dxy(0, -3 * h).f(270).oval(h, 1.5 * s, 180, RT).cap(ROUND)
            .fd(1.5 * h).cap(SQUARE).fd(1.5 * h).pop_pen();
    }

    m.set('o', { w: 5, f: _111 });
    function _111(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(2.5 * s, -4 * h).pd()
            .oval(1.65 * s, 2 * h, 360, RT).pop_pen();
    }

    m.set('p', { w: 5.2, f: _112 });
    function _112(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(s, 0).push_pen().dxy(0, -3.5 * h).f(270)
            .pd().cap(ROUND).oval(0.5 * h, 1.75 * s, 90, RT)
            .oval(1.75 * s, 2 * h, 180, RT).oval(1.75 * s, 0.5 * h, 90, RT)
            .pop_pen().dxy(0, -4 * h).pd().cap(SQUARE).f(90).fd(6 * h)
            .pop_pen();
    }

    m.set('q', { w: 5.4, f: _113 });
    function _113(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(4.5 * s, 0).push_pen().dxy(0, -3.5 * h)
            .f(270).pd().cap(BUTT).oval(0.5 * h, 1.75 * s, 90, LT)
            .oval(1.75 * s, 2 * h, 180, LT).oval(1.75 * s, 0.5 * h, 90, LT)
            .pop_pen().dxy(0, -4 * h).pd().cap(SQUARE).f(90).fd(6 * h)
            .pop_pen();
    }

    m.set('r', { w: 4, f: _114 });
    function _114(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(s, -4 * h).f(90).pd().cap(SQUARE).fd(4 * h)
            .dxy(0, -3 * h).f(270).oval(h, 2 * s, 90, RT).pop_pen();
    }

    m.set('s', { w: 5, f: _115 });
    function _115(t, ps, h, width, scale, s) {
        let rx = 1.5 * s;
        initChar(t, ps, width, scale).dxy(2.5 * s, -2 * h)
            .oval(rx, h, 100, LT).pd().oval(h, rx, 260, LT)
            .oval(rx, h, 260, RT).pop_pen();
    }

    m.set('t', { w: 5, f: _116 });
    function _116(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(1.5 * s, -5.5 * h).pd().f(90).cap(SQUARE)
            .fd(2.5 * h).cap(BUTT).fd(2 * h).oval(h, 2 * s, 90, LT)
            .dxy(-3 * s, -4 * h).f(0).fd(3 * s).pop_pen();
    }

    m.set('u', { w: 5, f: _117 });
    function _117(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(s, -4 * h).pd().f(90).cap(SQUARE)
            .fd(h).cap(ROUND).fd(2 * h).oval(h, 1.5 * s, 180, LT)
            .dxy(0, -3 * h).f(90).cap(SQUARE).fd(4 * h).pop_pen();
    }

    m.set('v', { w: 5, f: _118 });
    function _118(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(s, -4 * h).pd().cap(SQUARE)
            .goby(0.75 * s, 2 * h).cap(ROUND).goby(0.75 * s, 2 * h)
            .goby(0.75 * s, -2 * h).cap(SQUARE).goby(0.75 * s, -2 * h)
            .pop_pen();
    }

    m.set('w', { w: 8, f: _119 });
    function _119(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(s, -4 * h).pd().cap(SQUARE)
            .goby(0.75 * s, 2 * h).cap(ROUND).goby(0.75 * s, 2 * h)
            .goby(0.75 * s, -2 * h).goby(0.75 * s, -2 * h)
            .goby(0.75 * s, 2 * h).goby(0.75 * s, 2 * h)
            .goby(0.75 * s, -2 * h).cap(SQUARE).goby(0.75 * s, -2 * h)
            .pop_pen();
    }

    m.set('x', { w: 5, f: _120 });
    function _120(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(s, -4 * h).pd().cap(SQUARE)
            .goby(2.5 * s, 4 * h).dxy(0, -4 * h).goby(-2.5 * s, 4 * h)
            .pop_pen();
    }

    m.set('y', { w: 5.5, f: _121 });
    function _121(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(4 * s, -4 * h).pd().cap(SQUARE)
            .goby(-2 * s, 6 * h).dxy(-s, -6 * h).goby(0.888 * s, 2 * h)
            .cap(BUTT).goby(0.888 * s, 2 * h).pop_pen();
    }

    m.set('z', { w: 5, f: _122 });
    function _122(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(s, -4 * h).cap(SQUARE).pd()
            .fd(s).cap(ROUND).fd(2 * s).goby(-3 * s, 4 * h)
            .f(0).fd(s).cap(SQUARE).fd(2 * s).pop_pen();
    }


    m.set('{', { w: 4, f: _123 });
    function _123(t, ps, h, width, scale, s) {
        let dx = 1.5 * s, dy = 1.9 * h;
        initChar(t, ps, width, scale).dxy(3.5 * s, -6 * h).f(180).pd()
            .oval(-dx, dy, 90, LT).oval(dy, -dx, 90, RT).f(0)
            .oval(dx, dy, 90, RT).oval(dy, dx, 90, LT).pop_pen();
    }

    m.set('|', { w: 2, f: _124 });
    function _124(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(s, -6.5 * h).cap(BUTT).pd().f(90)
            .fd(8.5 * h)
            .pop_pen();
    }

    m.set('}', { w: 4, f: _125 });
    function _125(t, ps, h, width, scale, s) {
        let dx = 1.5 * s, dy = 1.9 * h;
        initChar(t, ps, width, scale).dxy(0.5 * s, -6 * h).pd()
            .oval(dx, dy, 90, RT).oval(dy, dx, 90, LT).f(180)
            .oval(-dx, dy, 90, LT).oval(dy, -dx, 90, RT).pop_pen();
    }

    m.set('~', { w: 4, f: _126 });
    function _126(t, ps, h, width, scale, s) {
        initChar(t, ps, width, scale).dxy(0.5 * s, -2.5 * h).f(270).pd()
            .oval(h, 0.75 * s, 180, RT).oval(h, 0.75 * s, 180, LT).pop_pen();
    }

    // ##################################################################
    //  Local functions for processing text ready for displaying
    // ##################################################################

    /* Convert user supplied text into an array of paragraphs */
    function getParagraphs(text) {
        let paras = [], temp = [];
        Array.isArray(text) ? temp.push(...text) : temp.push(text);
        temp.forEach(e => paras.push(...e.split('\n')));
        return paras;
    }

    /* Split a paragraph into lines based on maximum line width */
    function paraToLines(para, fmt) {
        let { pensize, scale, kerning, line_width } = fmt;
        para = para.trimEnd();
        let lines = [], line, len = 0, start = 0, idx = 0, spaceAt = 0;
        while (idx < para.length) {
            let ch = m.get(para.charAt(idx));
            if (ch) {
                len += (ch.w * pensize * scale) + kerning;
                if (len < line_width) {
                    if (ch.isSpace) spaceAt = idx;
                    idx++;
                }
                else {
                    if (start == spaceAt) {
                        line = para.substring(start, idx);
                        start = spaceAt = idx + 1;
                    }
                    else {
                        line = para.substring(start, spaceAt);
                        start = idx = ++spaceAt;
                    }
                    len = 0;
                    lines.push(line);
                }
            }
        }
        if (start < para.length)
            lines.push(para.substring(start, para.length));
        return lines;
    }

    // Get the line pixel length and the number of spaces
    function getAlignData(line, fmt) {
        let { pensize, scale, kerning } = fmt;
        let len = 0, spaces = 0;
        for (let i = 0; i < line.length; i++) {
            let ch = m.get(line.charAt(i));
            if (ch) {
                len += (ch.w * pensize * scale) + kerning;
                if (ch.isSpace) spaces++;
            }
        }
        return [len, spaces];
    }

    function addCharFrame(t, cw, fmt) {
        let { pensize, height, scale, frame_col } = fmt;
        let ah = 0.7 * height, ad = 0.3 * height, pw = pensize * cw * scale;
        t.push_pen().animateoff().pd().f(0).pensize(1).pencolor(frame_col)
            .fd(pw).lt(90).fd(ah).lt(90).fd(pw).lt(90).fd(height).lt(90)
            .fd(pw).lt(90).fd(ad).pop_pen();
        return t;
    }

    // ##################################################################
    //  User available functions
    // ##################################################################

    // Returns a 'format' object used to describe how the text is to
    // be displayed.
    function format(
        height = 80, pensize = 8, scale = 1, align = LT,
        kerning = 0, leading = 0, line_width = 0,
        frame_on = false, frame_col = 'pink') {
        return {
            height: height, pensize: pensize, scale: scale, align: align,
            kerning: kerning, leading: leading, line_width: line_width,
            frame_on: frame_on, frame_col: frame_col
        };
    }

    // Adds the tasks needed for the turtle to draw the text based on the 
    // fmt parameter.
    function addText(t, text, fmt = format()) {
        let { pensize, height, scale, leading, kerning, align, line_width,
            frame_on } = fmt;
        let paras = getParagraphs(text), lines = [];
        if (line_width > 0)
            paras.forEach(p => lines.push(...paraToLines(p, fmt)));
        else
            paras.forEach(p => lines.push(p.trimEnd()));
        for (let ln = 0; ln < lines.length; ln++) {
            let line = lines[ln], last = ln == lines.length - 1;
            let [len, nbr_spaces] = getAlignData(line, fmt);
            let inset = 0, inter = 0;
            switch (align) {
                case RT: inset = line_width - len; break;
                case CT: inset = (line_width - len) / 2; break;
                case JT: if (!last && (len / line_width >= 0.75 && nbr_spaces > 2))
                    inter = (line_width - len) / nbr_spaces;
                    break;
            }
            t.pu().dxy(0, height + leading).f(0).push_pen()
                .dxy(0, -height - leading).dxy(inset, 0);
            for (let i = 0; i < line.length; i++) {
                let ch = m.get(line.charAt(i));
                if (ch) {
                    if (frame_on) addCharFrame(t, ch.w, fmt);
                    ch.f(t, pensize, height / 10, ch.w, scale, pensize * scale);
                    t.dxy(kerning, 0);
                    if (ch.isSpace) t.dxy(inter, 0);
                }
            }
            t.pop_pen();
        }
        return t.pd();
    }

    function length(text, fmt) {
        return getAlignData(text.replaceAll('\n', ''), fmt)[0];
    }

    return [format, addText, length];
})();