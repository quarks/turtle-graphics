/*
            Turtle Graphics

Version:    draft
Licences:   MIT
Copyright:  Peter Lager 2025
            <quark(at)lagers.org.uk> 
            http://www.lagers.org.uk
*/

"use strict";

const [DISPLAY, STANDARD, LOGO] =
    [Symbol.for('display'), Symbol.for('standard'), Symbol.for('logo')];
const [BUTT, SQUARE, ROUND] =
    [Symbol.for('butt'), Symbol.for('square'), Symbol.for('round')];
const [LT, RT] = [-1, 1]; // DO NOT CHANGE

const [TG] = (function () {
    const [abs, atan2, ceil, cos, floor, max, min, sign, sin, sqrt] =
        [Math.abs, Math.atan2, Math.ceil, Math.cos, Math.floor, Math.max,
        Math.min, Math.sign, Math.sin, Math.sqrt];
    const [PI, HALF_PI, TAU] = [Math.PI, Math.PI / 2, Math.PI * 2];

    const radToDeg = (rads) => (rads * 180 / PI);
    const degToRad = (degs) => (degs * PI / 180);
    const distance = (x0, y0, x1, y1) => Math.sqrt((x1 - x0) ** 2 + (y1 - y0) ** 2);
    const pt = (t, v0, v1) => v0 + t * (v1 - v0);
    const tp = (v, v0, v1) => (v - v0) / (v1 - v0);
    const normAngle = (a, modValue = TAU) => {
        while (a < 0) a += modValue;
        while (a >= modValue) a -= modValue;
        return a;
    }
    const perimeter = (a, b) => {
        let h = (a - b) ** 2 / (a + b) ** 2;
        return PI * (a + b) * (1 + 3 * h / (10 + sqrt(4 - 3 * h)));
    }
    const pointOnEllipse = (cx, cy, ra, rb, rotation, a) => {
        let px = ra * cos(a), py = rb * sin(a);
        let sinA = Math.sin(rotation), cosA = Math.cos(rotation);
        let x = cx + px * cosA - py * sinA;
        let y = cy + py * cosA + px * sinA;
        return [x, y];
    }

    const [FORWARD, BACKWARD, NEAREST] = [1, -1, 0];
    const [ABSOLUTE, RELATIVE] = [0, 1];
    const [PUSH, POP] = [1, -1];
    const FONT = '400 normal 14px sans-serif';

    const now = () => { return performance.now() }


    class Turtle {
        static LINEAR_SPEED = 160;        // Pixels per second (160)
        static ANGULAR_SPEED = 3 * PI;    // Radians per second (1.5 * TAU)
        static PEN_COLOR = 'black';
        static FILL_COLOR = 'white';
        static PEN_SIZE = 2;
        static UPDATE_INTERVAL = 25;      // ms interval between updates
        static TASK_LISTS = new Map();

        static clearRecords() { Turtle.TASK_LISTS.clear(); }
        static setRecord(id, record) { Turtle.TASK_LISTS.set(id, record); }
        static hasRecord(id) { return Turtle.TASK_LISTS.has(id); }
        static getRecord(id) {
            if (Turtle.hasRecord(id))
                return Turtle.TASK_LISTS.get(id).map(task => task.clone());
        }

        static getTurtle(sizeX, sizeY, mode) { return new Turtle(sizeX, sizeY, mode); }

        constructor(sizeX, sizeY, mode = DISPLAY, useDegrees = true) {
            this._b = new OffscreenCanvas(sizeX, sizeY);
            this._bdc = this._b.getContext('2d');
            this._interval = Turtle.UPDATE_INTERVAL;
            this._polygons = new Map();
            this._snapshots = new Map();
            this._set_mode(mode);
            this._degrees = useDegrees;
            this._timer = 0;
            this._earlier = 0;
            this._font = FONT;
            this.setTurtle(DART);
            this._reset();
        }

        draw(mdc, displayX = 0, displayY = 0) {
            let bw = this._b.width, bh = this._b.height;
            let bw2 = bw / 2, bh2 = bh / 2;
            mdc.save();
            mdc.translate(displayX, displayY);
            mdc.beginPath();
            mdc.moveTo(-bw2, -bh2); mdc.lineTo(bw2, -bh2);
            mdc.lineTo(bw2, bh2); mdc.lineTo(-bw2, bh2); mdc.closePath();
            mdc.clip();
            switch (this._mode) {
                case LOGO: mdc.rotate(-HALF_PI); break;
                case STANDARD: mdc.scale(1, -1); break;
            }
            // Draw completed tasks
            mdc.drawImage(this._b, 0, 0, bw, bh, -bw2, -bh2, bw, bh);
            // draw the part-completed task if the pen is down
            if (this._penDown && this._taskQueue[0] && this._taskQueue[0].render)
                this._taskQueue[0].render(mdc);
            if (this._csrVisible) {
                mdc.translate(this._penX, this._penY);
                mdc.rotate(isNaN(this._tilt) ? this._penA : this._tilt);
                mdc.drawImage(this._cursor.icon, -this._cursor.hitX, -this._cursor.hitY);
            }
            mdc.restore();
        }

        // ####  Pen Movement  ################################################
        x(nx, fill_gap = false) { return this._addTask(new Teleport(ABSOLUTE, nx, NaN, fill_gap)); }
        y(ny, fill_gap = false) { return this._addTask(new Teleport(ABSOLUTE, NaN, ny, fill_gap)); }
        xy(nx, ny, fill_gap = false) { return this._addTask(new Teleport(ABSOLUTE, nx, ny, fill_gap)); }
        dxy(dx, dy, fill_gap = false) { return this._addTask(new Teleport(RELATIVE, dx, dy, fill_gap)); }
        face(a) { return this._addTask(new Attribute('_penA', this._fix(a))); }

        fd(d) { return this._addTask(new Move(d, FORWARD)); }
        forward(d) { return this.fd(d); }

        bk(d) { return this._addTask(new Move(d, BACKWARD)); }
        backward(d) { return this.bk(d); }
        back(d) { return this.bk(d); }

        lt(a) { return this._addTask(new Turn(this._fix(a), LT)); }
        left(a) { return this.lt(a); }

        rt(a) { return this._addTask(new Turn(this._fix(a), RT)); }
        right(a) { return this.rt(a); }

        head(a) { return this._addTask(new Turn(this._fix(a), NEAREST)); }
        heading(a) { return this.head(a); }

        home() { return this._addTask(new Home()); }

        goto(x, y) { return this._addTask(new GoTo(ABSOLUTE, x, y)); }
        goby(x, y) { return this._addTask(new GoTo(RELATIVE, x, y)); }

        dot(size = 6, fill_color = 'current', bdr_weight = 0.5, bdr_color = 'current') {
            return this._addTask(new Dot(size, fill_color, bdr_weight, bdr_color));
        }

        arrow(size = 6, fill_color = 'current', bdr_weight = 0.5, bdr_color = 'current') {
            return this._addTask(new Arrow(size, fill_color, bdr_weight, bdr_color));
        }

        circle(rad, extent = 0, turnDir = RT, steps = 0) {
            return this.oval(rad, rad, extent, turnDir, steps);
        }

        oval(rad_a, rad_b, extent = 0, turnDir = RT, steps = 0) {
            extent = abs(extent === 0 ? TAU : this._degrees ? degToRad(extent) : extent);
            if (steps === 0)
                return this._addTask(new Arc(rad_a, rad_b, extent, turnDir));
            else
                return this._addTask(new Oval(rad_a, rad_b, extent, turnDir, ceil(steps)));
        }

        sleep(ms) { return this._addTask(new Sleep(ms)); }

        write(string, move = false, align = 'left', font = undefined) {
            return this._addTask(new Write(string, move, align, font));
        }

        font(style) { return this._addTask(new Attribute('_font', style)); }

        // ####  Pen Attributes  ##############################################
        up() { return this._addTask(new Attribute('_penDown', false)); }
        pu() { return this.up(); }
        penup() { return this.up(); }

        down() { return this._addTask(new Attribute('_penDown', true)); }
        pd() { return this.down(); }
        pendown() { return this.down(); }

        pensize(pw = 2) { return this._addTask(new Attribute('_penSize', pw)); }

        dash(ld = []) { this._addTask(new Attribute('_penDash', ld)); return this; }
        pendash(ld = []) { return this.dash(ld); }

        // 'butt' 'square 'round'
        cap(pc) { return this._addTask(new Attribute('_penCap', pc)); }
        pencap(pc) { return this.cap(pc); }

        pencolor(c) { return this._addTask(new Attribute('_penColor', c)); }

        fillcolor(c) { return this._addTask(new Attribute('_fillColor', c)); }

        push_style() { return this._addTask(new PenStyle(PUSH)); }
        pop_style() { return this._addTask(new PenStyle(POP)); }

        // ####  Turtle control  ##############################################
        turtle(cursor) {
            return (cursor?.constructor?.name === 'Cursor')
                ? this._addTask(new Attribute('_cursor', cursor)) : this;
        }

        st() {
            return this._addTask(new Attribute('_csrVisible', true));
        }
        showturtle() { return this.st(); }

        ht() { return this._addTask(new Attribute('_csrVisible', false)); }
        hideturtle() { return this.ht(); }

        tilt(a) {
            return this._addTask(new Attribute('_tilt', this._fix(a)));
        }

        speed(lnr, ang) {
            if (isFinite(lnr) && lnr > 0)
                this._addTask(new Attribute('_lnrSpeed', lnr));
            if (isFinite(ang) && ang > 0)
                this._addTask(new Attribute('_angSpeed',
                    this._degrees ? degToRad(ang) : ang));
            return this;
        }

        // ####  Filling and tracking  ##############################################
        begin_fill() { return this._addTask(new BeginFill()); }
        end_fill(close = false) { return this._addTask(new EndFill(close)); }

        begin_poly() { return this._addTask(new BeginPoly()); }
        end_poly(id) { return this._addTask(new EndPoly(id)); }

        begin_record() { return this._addTask(new BeginRecord()); }
        end_record(id) { return this._addTask(new EndRecord(id)); }

        do(action, ...data) {
            if (action.constructor.name === 'Function')
                return this._addTask(new DoFunction(action, data));
            if (typeof action === 'string')
                return this._addTask(new DoRecord(action));
            return this;
        }

        // ####  Turtle graphic methods  ######################################
        animateon() { return this._addTask(new Attribute('_animate', true)); }
        animateoff() { return this._addTask(new Attribute('_animate', false)); }
        clear() { return this._addTask(new Clear()); }
        reset() { return this._addTask(new Reset()); }
        snapshot(id) { return this._addTask(new Snapshot(id)); return this; }


        // ####################################################################
        // ####################################################################
        // The following tasks are executed immediately and are not queued
        start() { this._startTurtle(); this._autoStart = true; return this; }
        stop() { this._stopTurtle(); this._autoStart = false; return this; }
        degrees() { this._degrees = true; }
        radians() { this._degrees = false; }
        // Set the update interval for this turtle. The default is 25ms so the 
        // turtle graphics is updated ~40 time per second. It does not change
        // the animation speeds but increasing this will reduce CPU load if 
        // there are a large number of turtles active at the same time.
        setUpdateInterval(ms) { this._interval = ms; }

        showTurtle() { this._csrVisible = true; return this; }
        hideTurtle() { this._csrVisible = false; return this; }

        // Set and get pen position usinhg mode coordinates
        doClear() { return this._clear() }
        doReset() { return this._reset() }

        getXY() { return this._p_m_XY(this._penX, this._penY) }
        getX() { return this._p_m_XY(this._penX, this._penY)[0] }
        getY() { return this._p_m_XY(this._penX, this._penY)[1] }
        getH() { return this._degrees ? radToDeg(this._penA) : this._penA; }
        getHeading() { return this.getH(); }

        setXYH(x, y, a) {
            this.setXY(x, y);
            this.setH(a);
            return this;
        }

        setXY(x, y) {
            if (Number.isFinite(x) && Number.isFinite(y))
                if (this._mode === LOGO) { this._penX = y; this._penY = x; }
                else { this._penX = x; this._penY = y; }
            return this;
        }

        setX(x) {
            if (Number.isFinite(x))
                if (this._mode === LOGO) this._penY = x; else this._penX = x;
            return this;
        }

        setY(y) {
            if (Number.isFinite(y))
                if (this._mode === LOGO) this._penX = y; else this._penY = y;
            return this;
        }

        setH(a) { this._penA = this._degrees ? degToRad(a) : a; return this; }

        //  Turtle mode >>> screen conversions
        getScreenXY(cx = 0, cy = 0) {
            return this._m_s_XY(this._penX, this._penY, cx, cy);
        }
        getScreenH() { return this._m_s_Angle(this.getH()); }

        // Screen to turtle mode conversions
        getModeXY(x, y, cx = 0, cy = 0) { return this._s_m_XY(x, y, cx, cy) }
        getModeH(screenA) { return this._s_m_Angle(screenA); }

        setPenSize(s) { this._penSize = s; return this; }
        getPenSize() { return this._penSize; }

        setDash(dash = []) {
            if (Array.isArray(dash)) this._penDash = dash;
            // this._penDash = Array.isArray(dash) ? [...dash] : [];
            return this;
        }
        getDash() { return this._penDash; }

        setPenColor(col) { this._penColor = col; return this; }
        getPenColor() { return this._penColor; }

        setCap(cap) { this._penCap = cap; return this; }
        getCap() { return this._penCap; }

        setFillColor(col) { this._fillColor = col; return this; }
        getFillColor() { return this._fillColor; }

        // Movement
        setSpeed(lnr = NaN, ang = NaN) {
            if (!Number.isNaN(lnr))
                this._lnrSpeed = lnr;
            if (!Number.isNaN(ang))
                this._angSpeed = this.degrees ? degToRad(ang) : ang;
            return this;
        }
        getSpeed() {
            return [this._lnrSpeed, this._degrees
                ? radToDeg(this._angSpeed) : this._angSpeed];
        }

        getPoly(id) {
            return this._polygons.get(id);
        }

        getSnapshot(snapId) {
            return this._snapshots.get(snapId);
        }

        setTurtle(cursor) {
            if (cursor && typeof cursor === 'string' && CURSORS.has(cursor))
                this._cursor = CURSORS.get(cursor);
            else if (cursor?.constructor?.name === 'Cursor')
                this._cursor = cursor;
            return this;
        }

        // Query turtle state
        get hasTasks() { return this.nbrTasks > 0; }
        get isActive() { return this._timer != 0; }
        get isAnimating() { return this._animate; }
        get isVisible() { return this._csrVisible; }
        get isPenDown() { return this._penDown; }
        get isFilling() { return this._fill_track; }

        get nbrTasks() { return this._taskQueue.length; }
        get nbrStyles() { return this._styleStack.length; }

        get mode() { return this._mode; }
        get mode$() { return Symbol.keyFor(this._mode); }

        // ####  Turtle <> System  ############################################
        spawn() {
            let t = new Turtle(this._b.width, this._b.height, this._mode);
            // copy attributes
            for (let key of Object.keys(this))
                if (typeof this[key] != 'object')
                    t[key] = this[key];
            t._penDash = [... this._penDash];
            t._cursor = this._cursor;
            // reset some attributes
            t._poly_points = []; t._poly_track = false;
            t._fill_points = []; t._fill_track = false;
            t._timer = 0;
            return t;
        }

        // ####  Internal implementation methods  #############################
        // do not call these methods directly
        _set_mode(m) {
            switch (m) {
                case LOGO:
                    this._p_m_XY = function (x, y) { return [y, x] }
                    this._s_m_XY = function (x, y, cx = 0, cy = 0) { return [x - cx, cy - y] }
                    this._m_s_XY = function (x, y, cx = 0, cy = 0) { return [cx + y, cy - x] }
                    this._s_m_Angle = function (a) {
                        return this._norm(a + (this._degrees ? 90 : HALF_PI));
                    }
                    this._m_s_Angle = function (a) {
                        return this._norm(a + (this._degrees ? -90 : -HALF_PI));;
                    }
                    this._mode = m;
                    break;
                case STANDARD:
                    this._p_m_XY = function (x, y) { return [x, y] }
                    this._s_m_XY = function (x, y, cx = 0, cy = 0) { return [x - cx, cy - y] }
                    this._m_s_XY = function (x, y, cx = 0, cy = 0) { return [x + cx, -y + cy] }
                    this._s_m_Angle = this._m_s_Angle = function (a) {
                        return this._norm(-a + (this._degrees ? 360 : TAU));
                    }
                    this._mode = m;
                    break;
                default:
                    this._p_m_XY = function (x, y) { return [x, y] }
                    this._s_m_XY = function (x, y, cx = 0, cy = 0) { return [x - cx, y - cy] }
                    this._m_s_XY = function (x, y, cx = 0, cy = 0) { return [x + cx, y + cy] }
                    this._s_m_Angle = this._m_s_Angle = function (a) { return this._norm(a); }
                    this._mode = DISPLAY;
            }
            return this;
        }

        _reset() {
            this._stopTurtle();
            this._taskQueue = [];
            this._styleStack = [];
            this._clear();
            this._autoStart = false;
            this._lnrSpeed = Turtle.LINEAR_SPEED;
            this._angSpeed = Turtle.ANGULAR_SPEED;
            this._fillColor = Turtle.FILL_COLOR;
            this._penColor = Turtle.PEN_COLOR;
            this._penSize = Turtle.PEN_SIZE;
            this._penX = 0; this._penY = 0; this._penA = 0;
            this._penDown = true; this._penDash = [];
            this._penCap = ROUND;
            this._csrVisible = true;
            this._animate = true;
            this._fill_points = []; this._fill_track = false;
            this._poly_points = []; this._poly_track = false;
            this._record = []; this._recording = false;
            this._polygons.clear();
            this._snapshots.clear();
            this._tilt = NaN;
            return this;
        }

        _update() {
            console.log
            if (this.nbrTasks == 0) return this._stopTurtle();
            let present = now(), time = present - this._earlier;
            this._earlier = present;
            do {
                let task = this._taskQueue[0];
                time = task.perform(this, time);
                if (task.isDONE()) {
                    if (task.render)
                        task.render(this._bdc, this._b.width, this._b.height);
                    this._taskQueue.shift();
                }
            } while (this.nbrTasks > 0 && time > 0);
        }

        _addTask(task) {
            this._taskQueue.push(task);
            if (this._timer === 0 && this._autoStart) this._startTurtle();
            return this;
        }

        _injectTasks(tasks, at = 1) {
            this._taskQueue.splice(at, 0, ...tasks);
        }

        _clear() {
            this._bdc.clearRect(0, 0, this._b.width, this._b.height);
            return this;
        }

        _startTurtle() {
            if (this._timer === 0) {
                this._timer = setInterval(() =>
                    this._update.call(this), this._interval);
                this._earlier = now();
            }
        }

        _stopTurtle() {
            clearInterval(this._timer);
            this._timer = 0;
        }

        /**
         * Accpets an angle in degrees or radians based on current
         * units and returns the equivalent angle in radians in 
         * the range >= 0 to < 2.Pi
         */
        _fix(a) {
            if (this._degrees) a = degToRad(a);
            while (a < 0) a += TAU;
            while (a >= TAU) a -= TAU;
            return a;
        }

        /**
         * Accpets an angle in degrees or radians based on current
         * units and returns the equivalent angle in the same units.
         * Radians : returns angle in the range >= 0 to < 2.Pi
         * Degrees : returns angle in the range >= 0 to < 360
         */
        _norm(a) {
            let modValue = this._degrees ? 360 : TAU;
            while (a < 0) a += modValue;
            while (a >= modValue) a -= modValue;
            return a;
        }
    } // End of Turtle class


    /*
    ###########################################################################
    ###########################################################################
                        Turtle Tasks
    ###########################################################################
    ###########################################################################
    */
    class Task {
        static WAITING = 64;
        static READY = 65;
        static DONE = 128;

        constructor(...info) {
            this._info = info;
            this.setDONE();
        }

        setWAITING = () => this._status = Task.WAITING;
        setREADY = () => this._status = Task.READY;
        setDONE = () => this._status = Task.DONE;

        isWAITING = () => { return this._status === Task.WAITING; }
        isREADY = () => { return this._status === Task.READY; }
        isDONE = () => { return this._status === Task.DONE; }

        clone() { return new this.constructor(...this._info); }

        recordManager(turtle) {
            if (turtle._recording) turtle._record.push(this.clone());
        }
    }   // End of Task class

    class Turn extends Task {
        constructor(...info) {
            super(...info);
            this._ang = info[0];
            this._dir = info[1]; // 1 = Right : -1 = Left : 0 = Nearest
            this.setWAITING();
        }

        turnDir(sa, ea) {
            sa = normAngle(sa);
            ea = normAngle(ea);
            let ta, pa = ea - sa;
            if (pa > -  PI && pa <= PI)
                ta = pa;
            else if (pa > PI)
                ta = pa - TAU;
            else if (pa <= -PI)
                ta = pa + TAU;
            let dir = sign(ta);
            return dir;
        }

        init(turtle) {
            this.recordManager(turtle);
            let dir = this._dir, ang = this._ang;
            this._angSpeed = turtle._angSpeed;
            let sa = normAngle(turtle._penA);
            let ea = dir === 0 ? ang : normAngle(sa + dir * ang);
            // If direction if not specified then find shortest direction
            if (dir === 0) dir = this.turnDir(sa, ea);
            switch (dir) {
                case LT: if (ea > sa) sa += TAU; break;
                case RT: if (sa > ea) ea += TAU; break;
            }
            this._sa = sa; this._ea = ea; this._range = ea - sa; this._dir = dir;
            this._t = 0;
            this.setREADY();
        }

        perform(turtle, time) {
            if (this.isWAITING()) this.init(turtle);
            let timeLeft = 0;
            if (turtle._animate && this._range != 0) {
                let turnAngle = this._dir * this._angSpeed * time / 1000;
                this._t += abs(turnAngle / this._range);
                if (this._t >= 1) {
                    this.setDONE();
                    timeLeft = (this._t - 1) * this._range * 1000 / this._angSpeed;
                    turtle._penA = normAngle(this._ea);
                }
                else
                    turtle._penA = pt(this._t, this._sa, this._ea);
            }
            else {
                this.setDONE();
                timeLeft = time;
                turtle._penA = normAngle(this._ea);
            }
            return timeLeft;
        }
    }   // End of Turn class

    class Move extends Task {
        constructor(...info) {
            super(...info);
            this._length = info[0];     // total distance to move
            this._dir = info[1];        // 1 = FD : -1 = BK
            this.setWAITING();
        }

        init(turtle) {
            this.recordManager(turtle);
            [this._fillStyle, this._strokeStyle, this._lineWidth, this._penDown] =
                [turtle._fillColor, turtle._penColor, turtle._penSize, turtle._penDown];
            this._lineCap = Symbol.keyFor(turtle._penCap);
            this._lineDash = [] = [...turtle._penDash];
            [this._sx, this._sy, this._ang] = [turtle._penX, turtle._penY, turtle._penA];
            this._ex = this._sx + this._dir * this._length * cos(this._ang);
            this._ey = this._sy + this._dir * this._length * sin(this._ang);
            this._tx = this._sx; this._ty = this._sy;
            this._t = 0;
            this.setREADY();
        }

        perform(turtle, time) {
            if (this.isWAITING()) this.init(turtle);
            let timeLeft = 0;
            if (turtle._animate) {
                this._t += turtle._lnrSpeed * time * 0.001 / this._length;
                if (this._t >= 1) {
                    this.setDONE();
                    timeLeft = (this._t - 1) * this._length * 1000 / turtle._lnrSpeed;
                    this._tx = this._ex;
                    this._ty = this._ey;
                }
                else {
                    this._tx = pt(this._t, this._sx, this._ex);
                    this._ty = pt(this._t, this._sy, this._ey);
                }
            }
            else {
                this._tx = this._ex;
                this._ty = this._ey;
                timeLeft = time;
                this.setDONE();
            }
            turtle._penX = this._tx;
            turtle._penY = this._ty;
            if (this.isDONE()) {
                if (turtle._fill_track)       // Fill                   Stroke 
                    turtle._fill_points.push(['lineTo', turtle._penDown ? 'lineTo' : 'moveTo',
                        turtle._penX, turtle._penY]);
                if (turtle._poly_track)
                    turtle._poly_points.push(turtle._m_s_XY(turtle._penX, turtle._penY));
            }
            return timeLeft;
        }

        render(dc, offX = 0, offY = 0) {
            if (this.isWAITING() || !this._penDown) return;
            dc.save();
            dc.translate(offX / 2, offY / 2)
            dc.fillStyle = this._fillStyle;
            dc.strokeStyle = this._strokeStyle;
            dc.lineWidth = this._lineWidth;
            dc.lineCap = this._lineCap;
            dc.setLineDash(this._lineDash);
            dc.beginPath();
            dc.moveTo(this._sx, this._sy);
            dc.lineTo(this._tx, this._ty)
            dc.stroke();
            dc.restore();
        }
    }   // End of Move class

    class Oval extends Task {
        constructor(...info) {
            super(...info);
            this._a = abs(info[0]); // radius parallel to pen directiron
            this._b = abs(info[1]); // radius perpendicular to pen direction 
            this._ext = info[2];    // extent of the enclosing angle
            this._turn = info[3];   // LT or RT turn direction
            this._steps = info[4];  // nbr steps
            this.setWAITING();
        }

        init(turtle) {
            // Find centre of the arc / circle
            this._cx = turtle._penX - this._turn * this._b * sin(turtle._penA);
            this._cy = turtle._penY + this._turn * this._b * cos(turtle._penA);
            // Find angular speed to match linear speed
            this._angSpeed = turtle._lnrSpeed * TAU / perimeter(this._a, this._b);
            switch (this._turn) {
                case LT:  // -1
                    this._ccw = true;
                    this._sa = HALF_PI;
                    this._ea = this._sa - this._ext;
                    break;
                case RT:  // +1
                    this._ccw = false;
                    this._sa = TAU - HALF_PI
                    this._ea = this._sa + this._ext;
                    break;
                default:
                    console.log('ERROR illegal turn');
            }
            this._deltaAngle = this._ext / this._steps;

            this._era = turtle._penA;
            this._ca = this._sa;
            this._t = 0;
            this.setREADY();
        }

        perform(turtle, time) {
            if (this.isWAITING()) this.init(turtle);
            let tasks = [];
            for (let i = 1; i <= this._steps; i++) {
                this._ca = (this._sa + this._turn * this._deltaAngle * i);
                let [ex, ey] = pointOnEllipse(this._cx, this._cy, this._a, this._b, this._era, this._ca);
                if (turtle._mode === LOGO) {
                    let temp = ex; ex = ey; ey = temp;
                }
                tasks.push(new GoTo(ABSOLUTE, ex, ey));
            }
            tasks.push(new Turn(normAngle(turtle._penA + this._turn * this._ext), NEAREST));
            turtle._injectTasks(tasks);
            this.setDONE();
            return time;
        }
    }   // End of Oval class

    class Arc extends Task {
        static MAX_ARC_LEN = 20;

        constructor(...info) {
            super(...info);
            this._a = abs(info[0]); // radius parallel to pen directiron
            this._b = abs(info[1]); // radius perpendicular to pen direction 
            this._ext = info[2];    // extent of the enclosing angle
            this._turn = info[3];   // LT or RT turn directio
            this._lineDash = [];
            this.setWAITING();
        }

        init(turtle) {
            this.recordManager(turtle);
            [this._fillStyle, this._strokeStyle, this._lineWidth, this._penDown] =
                [turtle._fillColor, turtle._penColor, turtle._penSize, turtle._penDown];
            this._lineCap = Symbol.keyFor(turtle._penCap);
            [this._sx, this._sy, this._penA] = [turtle._penX, turtle._penY, turtle._penA];
            this._lineDash = [] = [...turtle._penDash];
            // Find centre of the arc / circle
            this._cx = this._sx - this._turn * this._b * sin(this._penA);
            this._cy = this._sy + this._turn * this._b * cos(this._penA);
            // Find angular speed to match linear speed
            this._angSpeed = turtle._lnrSpeed * TAU / perimeter(this._a, this._b);
            switch (this._turn) {
                case LT:  // -1
                    this._ccw = true;
                    this._sa = HALF_PI;
                    this._ea = this._sa - this._ext;
                    break;
                case RT:  // +1
                    this._ccw = false;
                    this._sa = TAU - HALF_PI
                    this._ea = this._sa + this._ext;
                    break;
                default:
                    console.log('ERROR illegal turn');
            }
            this._era = turtle._penA;
            this._ca = this._sa;
            this._t = 0;
            this.setREADY();
        }

        perform(turtle, time) {
            if (this.isWAITING()) this.init(turtle);
            let timeLeft = time;
            let deltaAng = time * this._angSpeed / 1000;
            this._ca = this._ca + deltaAng * this._turn;
            this._t = tp(this._ca, this._sa, this._ea);
            if (this._t >= 1 || !turtle._animate) {
                timeLeft = (this._t - 1) * this._ext * 1000 / this._angSpeed;
                this._t = 1;
                this._ca = this._ea;
            }
            else {
                timeLeft = time - deltaAng * 1000 / this._angSpeed;
            }
            let pos = pointOnEllipse(this._cx, this._cy, this._a, this._b, this._era, this._ca);
            turtle._penX = pos[0];
            turtle._penY = pos[1];
            turtle._penA = normAngle(this._ca + this._era + this._turn * HALF_PI);
            if (this._t >= 1) {
                this.setDONE();
                if (turtle._fill_track)    // Fill   Stroke 
                    turtle._fill_points.push(['ellipse', 'ellipse',
                        this._cx, this._cy, this._a, this._b, this._era, this._sa, this._ca, this._ccw]);
                if (turtle._poly_track) {
                    let nbrPts = ceil(perimeter(this._a, this._b) * this._ext / (Arc.MAX_ARC_LEN * TAU));
                    let da = this._ext / nbrPts;
                    for (let i = 1; i <= nbrPts; i++) {
                        let pa = this._sa + i * da * this._turn;
                        let pt = pointOnEllipse(this._cx, this._cy, this._a, this._b, this._era, pa);
                        turtle._poly_points.push(turtle._m_s_XY(pt[0], pt[1]));
                    }
                }
            }
            return timeLeft;
        }

        render(dc, offX = 0, offY = 0) {
            if (this.isWAITING() || !this._penDown) return;
            dc.save();
            dc.translate(offX / 2, offY / 2);
            dc.fillStyle = this._fillStyle;
            dc.strokeStyle = this._strokeStyle;
            dc.lineWidth = this._lineWidth;
            dc.lineCap = this._lineCap;
            dc.setLineDash(this._lineDash);
            dc.beginPath();
            dc.ellipse(this._cx, this._cy, this._a, this._b, this._era, this._sa, this._ca, this._ccw);
            dc.stroke();
            dc.closePath();
            dc.restore();
        }
    }   // End of Arc class

    class Dot extends Task {
        constructor(...info) {
            super(...info);
            this._rad = info[0];
            this._fcol = info[1];       // border color
            this._sw = info[2];         // border weight
            this._scol = info[3];       // border color
        }

        perform(turtle, time) {
            this.recordManager(turtle);
            [this._sx, this._sy, this._penDown] = [turtle._penX, turtle._penY, turtle._penDown];
            this._fcol = this._fcol == 'current' ? turtle._fillColor : this._fcol;
            this._scol = this._scol == 'current' ? turtle._penColor : this._scol;
            this._sw = this._sw > 0 ? Number(this._sw) : (this._sw == 0 ? turtle._penSize : 0);
            this._rad = this._rad <= 0
                ? max(2 * turtle._penSize, turtle._penSize + 4) : this._rad;
        }

        render(dc, offX = 0, offY = 0) {
            if (this.isWAITING() || !this._penDown) return;
            dc.save();
            dc.translate(offX / 2, offY / 2)
            if (this._sw > 0) {
                dc.strokeStyle = this._scol;
                dc.lineWidth = this._sw;
            }
            dc.fillStyle = this._fcol;
            dc.beginPath();
            dc.ellipse(this._sx, this._sy, this._rad, this._rad, 0, 0, TAU, true);
            dc.fill();
            if (this._sw > 0) dc.stroke();
            dc.closePath();
            dc.restore();
        }
    }   // End of Dot class

    class Arrow extends Task {
        constructor(...info) {
            super(...info);
            this._size = info[0];       // size
            this._fcol = info[1];       // border color
            this._sw = info[2];         // border weight
            this._scol = info[3];       // border color
        }

        perform(turtle, time) {
            this.recordManager(turtle);
            [this._sx, this._sy, this._penDown] = [turtle._penX, turtle._penY, turtle._penDown];
            this._angle = turtle._penA;
            this._fcol = this._fcol == 'current' ? turtle._fillColor : this._fcol;
            this._scol = this._scol == 'current' ? turtle._penColor : this._scol;
            this._sw = this._sw > 0 ? Number(this._sw) : (this._sw == 0 ? turtle._penSize : 0);
            this._xp = -this._size * cos(PI / 6);
            this._yp = this._size * sin(PI / 6);
        }

        render(dc, offX = 0, offY = 0) {
            if (this.isWAITING() || !this._penDown) return;
            dc.save();
            dc.translate(offX / 2, offY / 2);
            dc.translate(this._sx, this._sy);
            dc.rotate(this._angle);
            dc.fillStyle = this._fcol;
            if (this._sw > 0) {
                dc.strokeStyle = this._scol;
                dc.lineWidth = this._sw;
            }
            dc.beginPath();
            dc.moveTo(0, 0);
            dc.lineTo(this._xp, this._yp);
            dc.lineTo(this._xp, -this._yp);
            dc.lineTo(0, 0);
            dc.fill();
            if (this._sw > 0) dc.stroke();
            dc.closePath();
            dc.restore();
        }
    }   // End of Arrow class

    class Write extends Task {
        constructor(...info) {
            super(...info);
            this._text = info[0];
            this._move = info[1];
            this._align = info[2];
            this._font = info[3];
            this.setWAITING();
        }

        init(turtle) {
            this.recordManager(turtle);
            [this._sx, this._sy, this._fillColor, this._mode, this._penDown] =
                [turtle._penX, turtle._penY, turtle._fillColor, turtle._mode, turtle._penDown];
            this._align = this._align === 'center' || this._align === 'right'
                ? this._align : 'left';
            this._font = this._font ?? turtle._font;
            this.setREADY();
        }

        perform(turtle, time) {
            if (this.isWAITING()) this.init(turtle);
            // Move cursor if needed
            if (this._move && this._align !== 'right') {
                turtle._bdc.font = this._font;
                let tw = turtle._bdc.measureText(this._text).width;
                if (this._align === 'center') tw /= 2;
                let task = this._mode === LOGO
                    ? new GoTo(this._sy + tw, this._sx)
                    : new GoTo(this._sx + tw, this._sy);
                turtle._injectTasks([task]);
            }
            this.setDONE();
        }

        render(dc, offX = 0, offY = 0) {
            if (this.isWAITING() || !this._penDown) return;
            dc.save();
            dc.translate(this._sx + offX / 2, this._sy + offY / 2);
            dc.font = this._font
            dc.textAlign = this._align;
            dc.textBaseline = 'bottom'
            dc.fillStyle = this._fillColor;
            switch (this._mode) {
                case LOGO:
                    dc.rotate(HALF_PI);
                    break;
                case STANDARD:
                    dc.scale(1, -1);
                    break;
            }
            dc.fillText(this._text, 0, 0);
            dc.restore();
        }
    }   // End of Write class


    class PenStyle extends Task {
        constructor(...info) {
            super(...info);
            this._action = info[0];
        }

        perform(turtle, time) {
            this.recordManager(turtle);
            switch (this._action) {
                case PUSH:
                    let state = [
                        turtle._penDown,
                        turtle._penSize,
                        [...turtle._penDash],
                        turtle._penCap,
                        turtle._penColor,
                        turtle._fillColor,
                        turtle._animate,
                        turtle._csrVisible,
                        turtle._tilt
                    ]
                    turtle._sS.push(state);
                    break;
                case POP:
                    if (turtle.nbrStyles > 0) {
                        let state = turtle._sS.pop();
                        [
                            turtle._penDown,
                            turtle._penSize,
                            turtle._penDash,
                            turtle._penCap,
                            turtle._penColor,
                            turtle._fillColor,
                            turtle._animate,
                            turtle._csrVisible,
                            turtle._tilt
                        ] = state;
                    }
                    break;
            }
            return time;
        }

    }
    class BeginRecord extends Task {
        constructor(...info) {
            super(...info);
        }

        perform(turtle, time) {
            turtle._record = [];     //Start with empty list
            turtle._recording = true;
            return time;
        }
    }   // End of BeginRecord class

    class EndRecord extends Task {
        constructor(...info) {
            super(...info);
            this._id = String(info[0]);
        }

        perform(turtle, time) {
            if (this._id.length > 0 && !Turtle.hasRecord(this._id))
                Turtle.setRecord(this._id, turtle._record);
            turtle._recording = false;
            turtle._record = [];
            return time;
        }
    }   // End of EndRecord class

    class DoRecord extends Task {
        constructor(...info) {
            super(...info);
            this._id = info[0];
        }

        perform(turtle, time) {
            let tasks = Turtle.getRecord(this._id);
            if (tasks) turtle._injectTasks(tasks);
            return time;
        }
    }   // End of DoRecord class

    class BeginPoly extends Task {
        constructor(...info) {
            super(...info);
        }

        perform(turtle, time) {
            this.recordManager(turtle);
            turtle._poly_track = true; turtle._poly_points = [];
            turtle._poly_points.push(turtle._m_s_XY(turtle._penX, turtle._penY));
            return time;
        }
    }   // End of BeginPoly class


    class EndPoly extends Task {
        constructor(...info) {
            super(...info);
            this._id = info[0];
        }

        perform(turtle, time) {
            this.recordManager(turtle);
            if (typeof this._id === 'string' && this._id.length > 0) {
                turtle._polygons.set(this._id, turtle._poly_points);
                turtle._poly_track = false; turtle._poly_points = [];
            }
            this.setDONE();
            return time;
        }
    }   // End of EndPoly class


    class BeginFill extends Task {
        constructor(...info) {
            super(...info);
        }

        perform(turtle, time) {
            this.recordManager(turtle);
            turtle._fill_track = true; turtle._fill_points = [];
            turtle._fill_points.push(['moveTo', 'moveTo', turtle._penX, turtle._penY]);
            return time;
        }
    }   // End of BeginFill class


    class EndFill extends Task {
        constructor(...info) {
            super(...info);
            this._close = info[0];
            this._pts = [];
            this.setWAITING();
        }

        init(turtle) {
            this.recordManager(turtle);
            [this._fillStyle, this._strokeStyle, this._lineWidth, this._penDown] =
                [turtle._fillColor, turtle._penColor, turtle._penSize, turtle._penDown];
            [this._lineDash, this._lineCap] = [turtle._penDash, Symbol.keyFor(turtle._penCap)];
            this._pts = turtle._fill_points;
            if (this._close && this._pts.length > 0) {
                this._pts.push(['lineTo', turtle._penDown ? 'lineTo' : 'moveTo',
                    this._pts[0][2], this._pts[0][3]]);
            }
            this.setREADY();
        }

        perform(turtle, time) {
            if (this.isWAITING()) this.init(turtle);
            turtle._fill_track = false; turtle._fill_points = [];
            this.setDONE();
            return time;
        }

        render(dc, offX = 0, offY = 0) {
            if (this.isWAITING()) return;
            dc.save();
            dc.translate(offX / 2, offY / 2)
            dc.fillStyle = this._fillStyle;
            dc.strokeStyle = this._strokeStyle;
            dc.lineWidth = this._lineWidth;
            dc.lineCap = this._lineCap;
            let pts = [...this._pts];
            dc.beginPath();
            while (pts.length > 0) { // Fill
                let p = pts.shift();
                dc[p[0]](...p.slice(2));
            }
            dc.fill();
            if (this._penDown) {
                pts = [...this._pts];
                dc.beginPath();
                dc.setLineDash(this._lineDash);
                while (pts.length > 0) {
                    let p = pts.shift();
                    dc[p[1]](...p.slice(2));
                }
                dc.stroke();
            }
            dc.restore();
        }
    }   // End of EndFill class

    class Home extends Task {
        constructor(...info) {
            super(...info);
            this.setWAITING();
        }

        init(turtle) {
            [this._sx, this._sy] = [turtle._penX, turtle._penY];
            this._angle = atan2(-this._sy, -this._sx);
            this._angle = normAngle(this._angle);
            this._dist = distance(this._sx, this._sy, 0, 0);
            //console.log(`Distance home ${this._dist}   from  ${this._sx} ${this._sy} `)
            this.setREADY();
        }

        perform(turtle, time) {
            if (this.isWAITING()) this.init(turtle);
            let tasks = [
                new Turn(this._angle, NEAREST),
                new Move(this._dist, 1),
                new Turn(0, NEAREST)
            ];
            turtle._injectTasks(tasks);
            this.setDONE();
            return time;
        }
    }   // End of Home class

    class GoTo extends Task {
        constructor(...info) {
            super(...info);
            this._mt = info[0];         // ABSOLUTE (0) OR RELATIVE (1)
            this._x = info[1];          // x value or undefined
            this._y = info[2];          // y value or undefined
            this.setWAITING();
        }

        init(turtle) {
            // Swap x & y if logo mode
            let [sx, sy] = [turtle._penX, turtle._penY];
            let [ex, ey] = turtle._mode == LOGO
                ? [this._y, this._x] : [this._x, this._y];
            // Add in current position if relative move
            ex += this._mt * turtle._penX;
            ey += this._mt * turtle._penY;
            this._angle = normAngle(atan2(ey - sy, ex - sx));
            this._dist = distance(sx, sy, ex, ey);
            this.setREADY();
        }

        perform(turtle, time) {
            if (this.isWAITING()) this.init(turtle);
            let tasks = [
                new Turn(this._angle, NEAREST),
                new Move(this._dist, 1)
            ];
            turtle._injectTasks(tasks);
            this.setDONE();
            return time;
        }
    }   // End of Teleport class

    class Teleport extends Task {
        constructor(...info) {
            super(...info);
            this._mt = info[0];         // ABSOLUTE (0) OR RELATIVE (1)
            this._x = info[1];          // x value or undefined
            this._y = info[2];          // y value or undefined
            this._fill_gap = info[3]

        }

        perform(turtle, time) {
            // Swap x & y if logo mode
            let [ex, ey] = turtle._mode == LOGO
                ? [this._y, this._x] : [this._x, this._y];
            // Replace invalid coordinates with current pen coordinate 
            ex = isNaN(ex) ? turtle._penX : ex;
            ey = isNaN(ey) ? turtle._penY : ey;
            // Add in current position if relative move
            ex += this._mt * turtle._penX;
            ey += this._mt * turtle._penY;
            let tasks = [];
            if (turtle.isFilling && !this._fill_gap) {
                tasks.push(
                    new EndFill(),
                    new Attribute('_penX', ex),
                    new Attribute('_penY', ey),
                    new BeginFill()
                );
            }
            else {
                tasks.push(
                    new Attribute('_penX', ex),
                    new Attribute('_penY', ey),
                );
                if (turtle._fill_track)     //  Fill     Stroke 
                    turtle._fill_points.push(['lineTo', 'moveTo', ex, ey]);
                if (turtle._poly_track)
                    turtle._poly_points.push(turtle._m_s_XY(ex, ey));
            }
            turtle._injectTasks(tasks);
            return time;
        }
    }   // End of Location class

    class Attribute extends Task {
        constructor(...info) {
            super(...info);
            this._attr = info[0];   // name of turle atttribute 
            this._value = info[1];  // value
        }

        perform(turtle, time) {
            this.recordManager(turtle);
            turtle[`${this._attr}`] = this._value;
            return time;
        }
    }   // End of Attribute class

    class Clear extends Task {
        constructor(...info) {
            super(...info);
        }

        perform(turtle, time) {
            this.recordManager(turtle);
            turtle._clear();
            return time;
        }
    }   // End of Clear class

    class Reset extends Task {
        constructor(...info) {
            super(...info);
        }

        perform(turtle, time) {
            this.recordManager(turtle);
            turtle._reset();
            return time;
        }
    }   // End of Reset class


    class Snapshot extends Task {
        constructor(...info) {
            super(...info);
            this._id = info[0];
        }

        perform(turtle, time) {
            this.recordManager(turtle);
            if (typeof this._id === 'string' && this._id.length > 0) {
                let b = turtle._b;
                let bw = b.width, bh = b.height;
                let bw2 = bw / 2, bh2 = bh / 2;
                let s = new OffscreenCanvas(b.width, b.height);
                let sdc = s.getContext('2d');
                sdc.translate(b.width / 2, b.height / 2);
                switch (turtle._mode) {
                    case LOGO:
                        sdc.rotate(-HALF_PI);
                        break;
                    case STANDARD:
                        sdc.scale(1, -1);
                        break;
                }
                sdc.drawImage(b, 0, 0, bw, bh, -bw2, -bh2, bw, bh);
                turtle._snapshots.set(this._id, s);
            }
            this.setDONE();
            return time;
        }
    }   // End of Snapshot class


    class Sleep extends Task {
        constructor(...info) {
            super(...info);
            this._sleepTimeLeft = info[0];  // time in ms
            this.setREADY();
        }

        perform(turtle, time) {
            this.recordManager(turtle);
            if (turtle._animate) {
                if (time >= this._sleepTimeLeft) {
                    time -= this._sleepTimeLeft;
                    this.setDONE();
                }
                else {
                    this._sleepTimeLeft -= time;
                    time = 0;
                }
            }
            else
                this.setDONE();
            return time;
        }
    }   // End of Sleep class

    class DoFunction extends Task {
        constructor(...info) {
            super(...info);
            this._function = info[0];
            this._data = info.slice(1);
        }

        perform(turtle, time) {
            this.recordManager(turtle);
            this._function(turtle, ...this._data);
            return time;
        }
    }   // End of DoFunction class

    return [Turtle];
}());
