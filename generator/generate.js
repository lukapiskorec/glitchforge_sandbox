/*

  ▄████  ██▓  ▄▄▄█████▓ ▄████▄   ██░ ██  ██▒   █▓ ██▀███    ██████
 ██▒ ▀█▒▓██▒  ▓  ██▒ ▓▒▒██▀ ▀█  ▓██░ ██▒▓██░   █▒▓██ ▒ ██▒▒██    ▒
▒██░▄▄▄░▒██░  ▒ ▓██░ ▒░▒▓█    ▄ ▒██▀▀██░ ▓██  █▒░▓██ ░▄█ ▒░ ▓██▄
░▓█  ██▓▒██░  ░ ▓██▓ ░ ▒▓▓▄ ▄██▒░▓█ ░██   ▒██ █░░▒██▀▀█▄    ▒   ██▒
░▒▓███▀▒░██████▒▒██▒ ░ ▒ ▓███▀ ░░▓█▒░██▓   ▒▀█░  ░██▓ ▒██▒▒██████▒▒
 ░▒   ▒ ░ ▒░▓  ░▒ ░░   ░ ░▒ ▒  ░ ▒ ░░▒░▒   ░ ▐░  ░ ▒▓ ░▒▓░▒ ▒▓▒ ▒ ░
  ░   ░ ░ ░ ▒  ░  ░      ░  ▒    ▒ ░▒░ ░   ░ ░░    ░▒ ░ ▒░░ ░▒  ░ ░
░ ░   ░   ░ ░   ░      ░         ░  ░░ ░     ░░    ░░   ░ ░  ░  ░
      ░     ░  ░       ░ ░       ░  ░  ░      ░     ░           ░
                       ░                     ░

code by {protocell:labs}, assets by jrdsctt
for Glitch Forge, 2022

*/

import { getRandomImagePath } from "./util.js";
import { calculateRoyalties } from "./royalties.js";
import { sliceFrame, init as eInit } from "./effects/tartaria.js";
import { weightedChoice, animateMonochromeDither, animateTintedDither, animateDitherSorting, animateSortingDither, animateAbstractDither } from "./effects/protocell_labs.js";

var r; //assign random hash access
var WIDTH; var HEIGHT;
var random = null;
var royalties;

// Guaranteed to be called first.
export function init(rnd, txn_hash) {
  Math.random = rnd;
  random = rnd;
  eInit(rnd);
}

// Guaranteed to be called after setup(), can build features during setup
// Add your rarity traits and attributes to the features object
export const features = {}; // export features so they can be used / filled in other files as well
export function getFeatures() {
  return features;
}

// export features so they can be used / filled in protocell_labs.js
// export { features };

export function getMetadata() {
  return {
    "features": features,
    "royalties": royalties
  };
}

export function getGeneratorConfig(assets) {

  // Looks like the only thing we're passing sketch around for is the random func...
  const fakeSketch = { random: (min, max) => {
      // Copied from p5js, just stubbing it here.
      const rand = random();
      if (typeof min === 'undefined') {
        return rand;
      } else if (typeof max === 'undefined') {
        if (min instanceof Array) {
          return min[Math.floor(rand * min.length)];
        } else {
          return rand * min;
        }
      } else {
        if (min > max) {
          const tmp = min;
          min = max;
          max = tmp;
        }
        return rand * (max - min) + min;
      }
    }
  };

  // SELECTION OF EFFECTS STACK
  // 0 -> mono - monochrome dither
  // 1 -> hi-fi - tinted dither
  // 2 -> noisy - color dither + pixel sorting
  // 3 -> corrupted - pixel sorting + color dither
  // 4 -> lo-fi - abstract dither

  let effects_stack_weights = [ [0, 15], [1, 15], [2, 30], [3, 30], [4, 10] ]; // these represent probabilities for choosing an effects stack number [element, probability]
  let effects_stack_type = weightedChoice(effects_stack_weights, fakeSketch); // type of effects workflow to be used as a number, 0-4
  // effects_stack_type = 0; // override for the type of effects workflow to be used as a number, 0-4
  let effects_stack_names = ['mono', 'hi-fi', 'noisy', 'corrupted', 'lo-fi'];
  let effects_stack_name = effects_stack_names[effects_stack_type];

  // SELECTION OF SOURCE THEME
  //let source_themes = ['citizen', 'cityscape', 'covers', 'encounters']; // lot nr. 000
  let source_themes = ['governor', 'organic', 'capital district', 'factory'];
  let source_theme_weights = [ [0, 25], [1, 25], [2, 25], [3, 25] ]; // these represent probabilities for choosing a source theme number [element, probability]
  let source_theme_nr = weightedChoice(source_theme_weights, fakeSketch); // 0 -> governors, 1 -> organics, 2 -> capital district, 3 -> factories
  // source_theme_nr = 1; // override for the source theme
  let source_theme = source_themes[source_theme_nr]; // 'governors', 'organics', 'capital district', 'factories'

  // EXCEPTIONS - these skew the choice probabilities from above
  //if (effects_stack_type == 4) {source_theme = 'citizen'}; // Abstract dither effect stack works only with citizen theme

  // select a random image from a certain theme in the assets folder
  let imagePath = getRandomImagePath(assets, source_theme);

  // add features
  features['lot nr.'] = '001'; // binary number 0-7, there will be 8 lots in total, 32*8 = 256, so the lot numbers will be 000, 001, 010, 011, 100, 101, 110, 111
  features['theme'] = source_theme;
  features['effect'] = effects_stack_name;

  return {
    type: 'gif',
    frames: 5,
    frameRate: 10,
    parallel: true,
    params: {
      effects_stack_type: effects_stack_type,
      image: imagePath,
    }
  };
}

/*
  Get a random number between a and b
*/
function rbtw(a, b, random) {
  return a + (b - a) * random();
}

function getMask(DIM) {
  var mask = sketch.createGraphics(DIM, DIM);
  mask.noStroke();
  mask.fill(255, 255, 255, 255);
  return mask;
}
/*
  Apply a mask, used for cutting shapes out of one canvas
  and pasting them onto another.
*/
function applyMask(source, target) {
  let clone;
  (clone = source.get()).mask(target.get());
  sketch.image(clone, 0, 0);
}


// Receives:
// sketch: a p5js instance
// txn_hash: the transaction hash that minted this nft (faked in sandbox)
// random: a function to replace Math.random() (based on txn_hash)
// assets: an object with preloaded image assets from `export getAssets`, keyname --> asset
export async function draw(sketch, assets, params) {
  let startmilli = Date.now();

  //Fixed Canvas Size, change as needed
  WIDTH = 900;
  HEIGHT = 900;
  let image_border = [100, 100];

  let royalty_tally = {}


  console.log("---Processing Starting---");
  let sketch_canvas = sketch.createCanvas(WIDTH + image_border[0], HEIGHT + image_border[1]);
  try {


    /*
     Make a copy of the raw image for reference.
     If the raw image is too large, a random section is chosen to match our fixed canvas size.
    */
    let referenceGraphic = sketch.createImage(WIDTH, HEIGHT);
    let imagePath = params.image;
    let image = await sketch.loadImage(imagePath);

    const copyStartX = Math.floor(random() * (image.width - WIDTH));
    const copyStartY = Math.floor(random() * (image.height - HEIGHT));

    referenceGraphic.copy(image, copyStartX, copyStartY, WIDTH, HEIGHT, 0, 0, WIDTH, HEIGHT);


    let effect_features;

    /***********IMAGE MANIPULATION GOES HERE**********/
    const effects = [ animateMonochromeDither, animateTintedDither, animateDitherSorting, animateSortingDither, animateAbstractDither ];
    const effects_stack_type = params.effects_stack_type;
    await effects[effects_stack_type](referenceGraphic, image_border, sketch, params.frame);

    /***********IMAGE MANIPULATION ENDS HERE**********/




    /* HELPFUL DEBUG CODE
      -Display original source image in top right,
      -Used to compare the original with added effects.
      -Comment this out before production.
    */
    // sk.copy(G["ref"], 0, 0, DIM, DIM, DIM - DIM / 5, 0, DIM / 5, DIM / 5,);


    //Saves the image for test review: Remove from production
    // sketch.saveCanvas(sketch, "frame-" + Math.floor(Math.random() * 10000), 'png');



    //Times how long the image takes to run
    console.log("---Processing Complete---");
    console.log("Time: " + (Date.now() - startmilli) / 1000 + " seconds");
    royalties = {
      "decimals": 3,
    }
    calculateRoyalties(royalties, royalty_tally);
    return sketch.getCanvasDataURL(sketch);
  } catch (e) {
    console.error(e);
  }
}
