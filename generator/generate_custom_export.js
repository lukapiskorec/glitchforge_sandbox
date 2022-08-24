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

import { getRandomImage } from "./util.js";
import { calculateRoyalties } from "./royalties.js";
import { sliceFrame, init as eInit } from "./effects/tartaria.js";
import { weightedChoice, animateMonochromeDither, animateTintedDither, animateDitherSorting, animateSortingDither, animateAbstractDither } from "./effects/protocell_labs.js";
import { randInt, getRandomKey, applyMonochromeDither, applyTintedDither, applyDitherSorting, applySortingDither, applyAbstractDither, dither_params_json, extreme_dither_params_json, three_bit_palette_reduced, three_bit_palette, color_bias_palette } from "./effects/protocell_labs.js";


import GIFEncoder from 'gifencoder';
import fs from 'fs';
import pkg from 'canvas';
const { createCanvas, loadImage } = pkg;

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
const features = {};
export function getFeatures() {
  return features;
}

export function getMetadata() {
  return {
    "features": features,
    "royalties": royalties
  }
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
export async function draw(sketch, assets) {
  let startmilli = Date.now();

  //Fixed Canvas Size, change as needed
  WIDTH = 900;
  HEIGHT = 900;
  let image_border = [100, 100];

  let royalty_tally = {}
  //Populate the features object like so, it is automatically exported.
  features['Trait Name'] = "Trait Value";

  console.log("---Processing Starting---");
  let sketch_canvas = sketch.createCanvas(WIDTH + image_border[0], HEIGHT + image_border[1]);
  try {

    // SELECTION OF EFFECTS STACK
    // 0 -> Monochrome dither
    // 1 -> Tinted dither
    // 2 -> Color dither + pixel sorting
    // 3 -> Pixel sorting + color dither
    // 4 -> Abstract dither

    let animation_name = 'gltchvrs_' + Math.floor(Math.random() * 10000) + '.gif';

    let effects_stack_weights = [ [0, 20], [1, 20], [2, 20], [3, 20], [4, 20] ]; // these represent probabilities for choosing an effects stack number [element, probability]
    //let effects_stack_type = weightedChoice(effects_stack_weights, sketch); // type of effects workflow to be used as a number, 0-4
    let effects_stack_type = 3; // override for the type of effects workflow to be used as a number, 0-4
    let effects_stack_names = ['monochrome dither', 'tinted dither', 'color dither + pixel sorting', 'pixel sorting + color dither', 'abstract dither']; // type of effects workflow to be used as a string
    let effects_stack_name = effects_stack_names[effects_stack_type]; // type of effects workflow to be used as a string

    // SELECTION OF SOURCE THEME
    let source_themes = ['citizen', 'cityscape', 'covers', 'scenes'];
    let source_theme_weights = [ [0, 35], [1, 35], [2, 25], [3, 5] ]; // these represent probabilities for choosing a source theme number [element, probability]
    let source_theme_nr = weightedChoice(source_theme_weights, sketch); // 0 -> citizen, 1 -> cityscape, 2 -> covers, 3 -> scenes
    //let source_theme_nr = 1; // override for the source theme
    let source_theme = source_themes[source_theme_nr]; // 'citizen', 'cityscape', 'covers', 'scenes'

    // EXCEPTIONS - these skew the choice probabilities from above
    if (effects_stack_type == 4) {source_theme_nr = 0}; // Abstract dither effect stack works only with citizen theme

    /*
     Make a copy of the raw image for reference.
     If the raw image is too large, a random section is chosen to match our fixed canvas size.
    */
    let referenceGraphic = sketch.createImage(WIDTH, HEIGHT);

    //let image = await getRandomImage(assets, source_theme, sketch)
    let image = await sketch.loadImage('assets/sphere_shading_base_1.png');

    const copyStartX = Math.floor(random() * (image.width - WIDTH));
    const copyStartY = Math.floor(random() * (image.height - HEIGHT));

    referenceGraphic.copy(image, copyStartX, copyStartY, WIDTH, HEIGHT, 0, 0, WIDTH, HEIGHT);



    /***********IMAGE MANIPULATION GOES HERE**********/

    // Defining parameters

    let blackValue; // Pixels darker than this will not be sorted, max is 100
    let brigthnessValue; // Value for sorting pixels according to brightness
    let whiteValue; // Pixels lighter than this will not be sorted, max is 100
    let sorting_mode; // Pixel sorting color mode, 0 -> black, 1 -> bright, 2 -> white
    let sorting_type; // Pixel sorting type, 0 -> chaotic, 1 -> proper
    let sorting_order; // Determines order of sorting, 0 -> column, 1 -> row, 2 -> column-row, 3 -> row-column (there are exceptions to this notation, see Abstract workflow)
    let color_noise_density; // Density of color noise (0-100)
    let rand_color_bias_key; // JSON key for color noise bias parameters
    let color_noise_bias; // Array which skews the rgb color values of the noise using this factor (0-1)
    let color_noise_variation; // Variation of the color noise (10-10000)
    let nr_of_levels; // Number of color levels for FS dithering, standard is 1
    let contrast; // Set image contrast - 0.0 is no change
    let new_brightness; // Set image brightness - 1.0 is no change
    let dither_group, dither_group_weights; // Number for the group of dither parameters to choose from
    let rand_dither_key, rand_dither_key_1, rand_dither_key_2, rand_dither_key_3; // JSON key for dither error distribution parameters
    let dither_params, dither_params_1, dither_params_2, dither_params_3; // Read error distribution parameters from a JSON file
    let pix_scaling, pix_scaling_dark; // Scales the size of pixels when applying effects
    let layer_shift; // Shift in x and y direction for every consecutive layer
    let tint_palette_key; // JSON key for tint palette colors
    let tint_palette; // RGB array with values for tinting, example three_bit_palette['magenta']
    let tinting_mode; // Type of tinting selected, 0 is always no tinting
    let mask_contrast; // Contrast value for the image when taking brightnessMask
    let light_treshold; // Brightness treshold for the image when taking brightnessMask
    let dark_treshold; // Brightness treshold for the image when taking brightnessMask
    let invert_mask; // Invert brightnessMask


    // THE MAIN EFFECT STACK SWITCH

    switch(effects_stack_type) {

      case 0: // Monochrome dither
        nr_of_levels = 1;
        contrast = 0.15;
        rand_dither_key_1 = getRandomKey(dither_params_json, sketch);
        rand_dither_key_2 = getRandomKey(extreme_dither_params_json, sketch);
        rand_dither_key_3 = getRandomKey(dither_params_json, sketch);
        dither_params_1 = dither_params_json[rand_dither_key_1];
        dither_params_2 = extreme_dither_params_json[rand_dither_key_2];
        dither_params_3 = dither_params_json[rand_dither_key_3];
        pix_scaling = 2.0;
        layer_shift = 4;
        mask_contrast = 0.0;
        dark_treshold = 20;
        light_treshold = 80;
        invert_mask = false;
        tint_palette_key = getRandomKey(three_bit_palette_reduced, sketch);
        tint_palette = three_bit_palette_reduced[tint_palette_key];
        // if tint color is white or green (these are very bright) then the size of dither pixels in darkest regions is smallest possible
        pix_scaling_dark = (tint_palette_key == 'white') || (tint_palette_key == 'green') ? 1.0 : pix_scaling * 2;
        new_brightness = 1.0; // brightness needs to increase at 50% rate of the contrast

        sketch.background(0);
        applyMonochromeDither(referenceGraphic, image_border, new_brightness, contrast, pix_scaling, pix_scaling_dark, nr_of_levels, dither_params_1, dither_params_2, dither_params_3, mask_contrast, light_treshold, dark_treshold, invert_mask, tint_palette, layer_shift, sketch);
        break;

      case 1: // Tinted dither
        nr_of_levels = 1;
        contrast = 0.25;
        rand_dither_key_1 = getRandomKey(dither_params_json, sketch);
        rand_dither_key_2 = getRandomKey(dither_params_json, sketch);
        dither_params_1 = dither_params_json[rand_dither_key_1];
        dither_params_2 = dither_params_json[rand_dither_key_2];
        pix_scaling = 2.0;
        layer_shift = 4;
        mask_contrast = 0.25;
        light_treshold = 50;
        invert_mask = false;
        tint_palette_key = getRandomKey(three_bit_palette, sketch);
        tint_palette = three_bit_palette[tint_palette_key];
        new_brightness = 1.0; // brightness needs to increase at 50% rate of the contrast

        sketch.background(0);
        applyTintedDither(referenceGraphic, image_border, new_brightness, contrast, pix_scaling, nr_of_levels, dither_params_1, dither_params_2, mask_contrast, light_treshold, invert_mask, tint_palette, layer_shift, sketch);
        break;

      case 2: // Color dither + pixel sorting
        blackValue = 10;
        brigthnessValue = 50;
        whiteValue = 70;
        sorting_mode = randInt(0, 3, sketch); // 0, 1, 2
        sorting_type = randInt(0, 2, sketch); // 0, 1
        sorting_order = randInt(0, 4, sketch); // 0, 1, 2, 3
        color_noise_density = 5;
        rand_color_bias_key = getRandomKey(color_bias_palette, sketch);
        color_noise_bias = color_bias_palette[rand_color_bias_key];
        color_noise_variation = 10000;
        nr_of_levels = 1;
        contrast = 0.15;
        rand_dither_key_1 = getRandomKey(dither_params_json, sketch);
        rand_dither_key_2 = getRandomKey(dither_params_json, sketch);
        dither_params_1 = dither_params_json[rand_dither_key_1];
        dither_params_2 = dither_params_json[rand_dither_key_2];
        pix_scaling = 2.0;
        layer_shift = 4;
        mask_contrast = 0.25;
        light_treshold = 50;
        invert_mask = false;
        tinting_mode = randInt(0, 3, sketch); // 0, 1, 2
        new_brightness = 1.0; // brightness needs to increase at 50% rate of the contrast

        sketch.background(0);
        applyDitherSorting(referenceGraphic, image_border, new_brightness, contrast, pix_scaling, nr_of_levels, dither_params_1, dither_params_2, mask_contrast, light_treshold, invert_mask, blackValue, brigthnessValue, whiteValue, sorting_mode, sorting_type, sorting_order, color_noise_density, color_noise_bias, color_noise_variation, tinting_mode, three_bit_palette, layer_shift, sketch);
        break;

      case 3: // Pixel sorting + color dither
        blackValue = 10;
        brigthnessValue = 50;
        whiteValue = 70;
        sorting_mode = randInt(0, 3, sketch); // 0, 1, 2
        sorting_type = randInt(0, 2, sketch); // 0, 1
        sorting_order = randInt(0, 4, sketch); // 0, 1, 2, 3
        color_noise_density = 5;
        rand_color_bias_key = getRandomKey(color_bias_palette, sketch);
        color_noise_bias = color_bias_palette[rand_color_bias_key];
        color_noise_variation = 10000; //10000
        nr_of_levels = 1;
        contrast = 0.15; // 15
        rand_dither_key_1 = getRandomKey(dither_params_json, sketch);
        rand_dither_key_2 = getRandomKey(dither_params_json, sketch);
        dither_params_1 = dither_params_json[rand_dither_key_1];
        dither_params_2 = dither_params_json[rand_dither_key_2];
        pix_scaling = 2.0;
        layer_shift = 4;
        mask_contrast = 0.25;
        light_treshold = 50;
        invert_mask = false;
        tinting_mode = randInt(0, 3, sketch); // 0, 1, 2
        new_brightness = 1.0; // brightness needs to increase at 50% rate of the contrast

        sketch.background(0);
        applySortingDither(referenceGraphic, image_border, new_brightness, contrast, pix_scaling, nr_of_levels, dither_params_1, dither_params_2, mask_contrast, light_treshold, invert_mask, blackValue, brigthnessValue, whiteValue, sorting_mode, sorting_type, sorting_order, color_noise_density, color_noise_bias, color_noise_variation, tinting_mode, three_bit_palette, layer_shift, sketch);
        break;

      case 4: // Abstract dither
        blackValue = 10;
        brigthnessValue = 50;
        whiteValue = 70;
        sorting_mode = 2; // this mode works best for this workflow
        sorting_type = randInt(0, 2, sketch); // 0, 1
        sorting_order = randInt(0, 3, sketch); // 0, 1, 2
        color_noise_density = 5;
        rand_color_bias_key = getRandomKey(color_bias_palette, sketch);
        color_noise_bias = color_bias_palette[rand_color_bias_key];
        color_noise_variation = 10000;
        nr_of_levels = 1;
        contrast = 0.25;
        dither_group_weights = [ [0, 75], [1, 25] ]; // these represent probabilities for choosing a dither group number [element, probability]
        dither_group = weightedChoice(dither_group_weights, sketch); // type of effects workflow to be used as a number, 0-4
        rand_dither_key_1, dither_params_1;

        switch(dither_group) {
          case 0: // smaller pixels, less abstract, common
            rand_dither_key_1 = getRandomKey(dither_params_json, sketch);
            dither_params_1 = dither_params_json[rand_dither_key_1];
            break;
          case 1: // larger pixels, more abstract, rare
            rand_dither_key_1 = getRandomKey(extreme_dither_params_json, sketch);
            dither_params_1 = extreme_dither_params_json[rand_dither_key_1];
            break;
          default:
            break;
        }

        pix_scaling = dither_group == 0 ? 8.0 : 16.0; // larger dither pixels for extreme dither parameters
        layer_shift = 4;
        mask_contrast = 0.25;
        light_treshold = 50;
        invert_mask = false;
        tinting_mode = randInt(0, 3, sketch); // 0, 1, 2
        new_brightness = 1.0; // brightness needs to increase at 50% rate of the contrast

        sketch.background(0);
        applyAbstractDither(referenceGraphic, image_border, new_brightness, contrast, pix_scaling, nr_of_levels, dither_params_1, blackValue, brigthnessValue, whiteValue, sorting_mode, sorting_type, sorting_order, color_noise_density, color_noise_bias, color_noise_variation, layer_shift, sketch);
        break;

      default:
        break;

      }







    /***********IMAGE MANIPULATION ENDS HERE**********/




    /* HELPFUL DEBUG CODE
      -Display original source image in top right,
      -Used to compare the original with added effects.
      -Comment this out before production.
    */
    // sk.copy(G["ref"], 0, 0, DIM, DIM, DIM - DIM / 5, 0, DIM / 5, DIM / 5,);


    //Saves the image for test review: Remove from production
    //sketch.saveCanvas(sketch, "" + Math.floor(Math.random() * 10000), 'png');
    sketch.saveCanvas(sketch, effects_stack_name + " sphere " + Math.floor(Math.random() * 10000), 'png');



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
