/*
            Turtle Graphics

Version:    !!VERSION!!
Licences:   MIT
Copyright:  Peter Lager 2025
            <quark(at)lagers.org.uk> 
            http://www.lagers.org.uk
User guide: http://www.lagers.org.uk/tg/guide/guide.html
*/


// ###############################################################################
//      p5.js helper functions
// ###############################################################################

// Create a p5js Image from a turtle snaphot (OffscreenCanvas)
function getImageFromOsc(osc, p = p5.instance) {
    if (osc) {
        let ssdc = osc.getContext('2d');
        let buffer = ssdc.getImageData(0, 0, osc.width, osc.height).data;
        let array = new Uint32Array(buffer);
        let img = p.createImage(osc.width, osc.height);
        img.loadPixels();
        img.pixels.forEach((v, i, a) => a[i] = array[i]);
        img.updatePixels();
        return img;
    }
}

// create a turtle cursor from a p5.Image object. Commonly this image would have
// been loaded using the loadImage() method in preload()
function getCursorFromImage(p5image, fx = 0, fy = 0) {
    p5image.loadPixels();
    let w = p5image.width, h = p5image.height, pxl = p5image.pixels;
    let id = new ImageData(new Uint8ClampedArray(pxl), w, h);
    let osc = new OffscreenCanvas(w, h)
    let dc = osc.getContext('2d');
    dc.putImageData(id, 0, 0);
    return new Cursor(osc, fx, fy);
}



// ###############################################################################
//      js utility functions
// ###############################################################################

// Create and return a 2D array of size dim0 x dim1 and fill all elements
// with a defined value.
const getArray2D = function (dim0 = 1, dim1 = 1, ffillValue = 0) {
    let a = new Array(dim0);
    for (let i = 0; i < a.length; i++) a[i] = new Array(dim1);
    for (let i = 0; i < a.length; i++)
        for (let j = 0; j < a[i].length; j++)
            a[i][j] = ffillValue;
    return a;
}

const [rgb, hsl, hwb, rgb_hsl, hsl_rgb, rgb_hwb, hwb_rgb] = (function () {

    const rgb = (r = 255, g = 255, b = 255, a = 1) => {
        return `rgb(${r} ${g} ${b} / ${a})`;
    }

    const hsl = (h = 0, s = 100, l = 100, a = 1) => {
        return `hsl(${h} ${s} ${l} / ${a})`;
    }

    const hwb = (h = 0, w = 70, b = 20, a = 1) => {
        return `hwb(${h} ${w} ${b} / ${a})`;
    }

    // ###############################################################################
    //      color mode conversion from methods taken from
    //      https://www.w3.org/TR/css-color-4/#color-type 
    //      and then modified to suit this library
    // ###############################################################################

    /**
     * HSL > RGB
     * @param hue - Hue as degrees 0..360
     * @param sat - Saturation in reference range [0,100]
     * @param  light - Lightness in reference range [0,100]
     * @return Array of RGB components 0..255
     */
    const hsl_rgb = function (hue, sat, light) {
        function f(n) {
            let k = (n + hue / 30) % 12;
            let a = sat * Math.min(light, 1 - light);
            return light - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
        }
        hue = hue % 360;
        if (hue < 0) { hue += 360; }
        sat /= 100; light /= 100;
        let rgb = [f(0), f(8), f(4)];
        rgb.forEach(function (v, i, a) { a[i] = v == 1 ? 255 : Math.floor(v * 256); });
        return rgb;
    }

    /**
     * RGB > HSL
     * @param  red - Red component 0..255
     * @param  green - Green component 0..255
     * @param  blue - Blue component 0..255
     * @return  Array of HSL values: Hue as degrees 0..360, Saturation and Lightness in reference range [0,100]
     */
    const rgb_hsl = function (red, green, blue) {
        red /= 255; green /= 255; blue /= 255;
        let max = Math.max(red, green, blue);
        let min = Math.min(red, green, blue);
        let [hue, sat, light] = [NaN, 0, (min + max) / 2];
        let d = max - min;

        if (d !== 0) {
            sat = (light === 0 || light === 1)
                ? 0 : (max - light) / Math.min(light, 1 - light);
            switch (max) {
                case red: hue = (green - blue) / d + (green < blue ? 6 : 0); break;
                case green: hue = (blue - red) / d + 2; break;
                case blue: hue = (red - green) / d + 4;
            }
            hue = hue * 60;
        }

        // Very out of gamut colors can produce negative saturation
        // If so, just rotate the hue by 180 and use a positive saturation
        // see https://github.com/w3c/csswg-drafts/issues/9222
        if (sat < 0) {
            hue += 180;
            sat = Math.abs(sat);
        }

        if (hue >= 360) { hue -= 360; }

        return [hue, sat * 100, light * 100];
    }

    /**
     * HWB > RGB
     * @param  hue -  Hue as degrees 0..360
     * @param  white -  Whiteness in reference range [0,100]
     * @param  black -  Blackness in reference range [0,100]
     * @return  Array of RGB components 0..255
     */
    const hwb_rgb = function (hue, white, black) {
        white /= 100; black /= 100;
        if (white + black >= 1) {
            let gray = white / (white + black);
            return [gray, gray, gray];
        }

        let rgb = hsl_rgb(hue, 100, 50); rgb[1] /= 255; rgb[2] /= 255;
        for (let i = 0; i < 3; i++) {
            rgb[i] *= (1 - white - black);
            rgb[i] += white;
        }
        rgb.forEach(function (v, i, a) { a[i] = v == 1 ? 255 : Math.floor(v * 256); });
        return rgb;
    }

    /**
     * RGB > HWB
     * @param  red - Red component 0..255
     * @param  green - Green component 0..255
     * @param  blue - Blue component 0..255
     * @return  Array of HWB values: Hue as degrees 0..360, Whiteness and Blackness in reference range [0,100]
     */
    const rgb_hwb = function (red, green, blue) {
        red /= 255; green /= 255; blue /= 255;
        let hsl = rgb_hsl(red, green, blue);
        let white = Math.min(red, green, blue);
        let black = 1 - Math.max(red, green, blue);
        return ([hsl[0], white * 100, black * 100]);
    }

    return [rgb, hsl, hwb, rgb_hsl, hsl_rgb, rgb_hwb, hwb_rgb];
}());

// ###############################################################################
//      debug support functions
// ###############################################################################
const dp0$ = Intl.NumberFormat(undefined, {
    useGrouping: false,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
}).format;

const dp1$ = Intl.NumberFormat(undefined, {
    useGrouping: false,
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
}).format;

const dp3$ = Intl.NumberFormat(undefined, {
    useGrouping: false,
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
}).format;

const deg1$ = function (rads) {
    return dp1$(rads * 360 / Math.PI);
}

function printPoly(turtle, polyid) {
    let poly = turtle.getPoly(polyid);
    console.log('-----------------------------------------------------------------')
    console.log(`MODE: ${turtle.getMode()}         Nbr. Points ${poly?.length ?? 0}`);
    poly?.forEach(v => {
        console.log(`  [${dp0$(v[0])}, ${dp0$(v[1])}]`)
    });
}


