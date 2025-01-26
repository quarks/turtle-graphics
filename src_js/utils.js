/*
            Turtle Graphics

Version:    0.9.0
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
