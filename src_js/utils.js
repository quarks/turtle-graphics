/*
            Turtle Graphics

Version:    draft
Licences:   MIT
Copyright:  Peter Lager 2025
            <quark(at)lagers.org.uk> 
            http://www.lagers.org.uk
*/


// ###############################################################################
//      p5.js helper functions
// ###############################################################################

// Create a p5js Image from a turtle snaphot (OffscreenCanvas)
function getImageFromOsc(osc, p = p5.instance) {
    let ssdc = osc.getContext('2d');
    let buffer = ssdc.getImageData(0, 0, osc.width, osc.height).data;
    let array = new Uint32Array(buffer);
    let img = p.createImage(osc.width, osc.height);
    img.loadPixels();
    img.pixels.forEach((v, i, a) => a[i] = array[i]);
    img.updatePixels();
    return img
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
const getArray2D = function (dim0 = 1, dim1 = 1, fv = 0) {
    let a = new Array(dim0);
    for (let i = 0; i < a.length; i++) a[i] = new Array(dim1);
    for (let i = 0; i < a.length; i++)
        for (let j = 0; j < a[i].length; j++)
            a[i][j] = fv;
    return a;
}


// ###############################################################################
//      color mode conversion methods 
//      (taken from  https://www.w3.org/TR/css-color-4/#color-type )
// ###############################################################################

/**
 * HSL > RGB
 * @param {number} hue - Hue as degrees 0..360
 * @param {number} sat - Saturation in reference range [0,100]
 * @param {number} light - Lightness in reference range [0,100]
 * @return {number[]} Array of RGB components 0..1
 */
function hslToRgb(hue, sat, light) {
    hue = hue % 360;

    if (hue < 0) {
        hue += 360;
    }

    sat /= 100;
    light /= 100;

    function f(n) {
        let k = (n + hue / 30) % 12;
        let a = sat * Math.min(light, 1 - light);
        return light - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    }

    return [f(0), f(8), f(4)];
}

/**
 * RGB > HSL
 * @param {number} red - Red component 0..1
 * @param {number} green - Green component 0..1
 * @param {number} blue - Blue component 0..1
 * @return {number[]} Array of HSL values: Hue as degrees 0..360, Saturation and Lightness in reference range [0,100]
 */
function rgbToHsl(red, green, blue) {
    let max = Math.max(red, green, blue);
    let min = Math.min(red, green, blue);
    let [hue, sat, light] = [NaN, 0, (min + max) / 2];
    let d = max - min;

    if (d !== 0) {
        sat = (light === 0 || light === 1)
            ? 0
            : (max - light) / Math.min(light, 1 - light);

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

    if (hue >= 360) {
        hue -= 360;
    }

    return [hue, sat * 100, light * 100];
}

/**
 * HWB > RGB
 * @param {number} hue -  Hue as degrees 0..360
 * @param {number} white -  Whiteness in reference range [0,100]
 * @param {number} black -  Blackness in reference range [0,100]
 * @return {number[]} Array of RGB components 0..1
 */
function hwbToRgb(hue, white, black) {
    white /= 100;
    black /= 100;
    if (white + black >= 1) {
        let gray = white / (white + black);
        return [gray, gray, gray];
    }
    let rgb = hslToRgb(hue, 100, 50);
    for (let i = 0; i < 3; i++) {
        rgb[i] *= (1 - white - black);
        rgb[i] += white;
    }
    return rgb;
}

/**
 * RGB > HWB
 * @param {number} red - Red component 0..1
 * @param {number} green - Green component 0..1
 * @param {number} blue - Blue component 0..1
 * @return {number[]} Array of HWB values: Hue as degrees 0..360, Whiteness and Blackness in reference range [0,100]
 */
function rgbToHwb(red, green, blue) {
    let hsl = rgbToHsl(red, green, blue);
    let white = Math.min(red, green, blue);
    let black = 1 - Math.max(red, green, blue);
    return ([hsl[0], white * 100, black * 100]);
}


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


/*
   When specifying colors use any W3C recommended format see
   https://www.w3.org/TR/css-color-4/#color-type
*/

/*
font_descriptor

The font descriptor is a string variable which contains 3 or 4
font attributes. The format is
"WEIGHT  STYLE  SIZE  FAMILY_NAME"

WEIGHT - 
    any value in the range 1 and 1000 inclusive is valid. Normal
    weight is 400 and bold 700.

STYLE -
    If not included in the descriptor then plain text is used. Valid
    values include 'italic' and ' oblique' both have the effect of 
    making the text lean to the right.

SIZE -
    This is the font size, examples include 12px 40em ...

FAMILY_NAME -
    There are two types of font family names:
    family-name -     The name of a font-family, like "times", "courier", 
                      "arial", etc.
    generic-family -  The name of a generic-family, like "serif", 
                      "sans-serif", "cursive", "fantasy", "monospace".

Font descriptor examples include:

'400 italic 12px serif'
'700 16px Arial'
'100 20px "Gill Sans MT"'

 If the family name includes spaces they they should be quoted as
 shown in last example.
*/