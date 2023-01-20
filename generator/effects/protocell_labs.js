import { addAuthorRoyalties } from "../royalties.js";
import { features } from "../generate.js";

const AUTHOR_TEZOS_ADDRESS = "tz1dUQZNCe18p9wMEqAyXvY5GocKWGsUfZHn"; // protocell.tez


/*
    My amazing effect
*/
// export function myAmazingEffect(parm1, parm2, sketch, options, royalties) {
//     //add the author of the effect's address to the royalties
//     addAuthorRoyalties(AUTHOR_TEZOS_ADDRESS, royalties);
//
//     //perform you effect.
// }



// EFFECT STACKS

// effect stack 0 -> Monochrome dither
export function applyMonochromeDither(img, image_border, new_brightness, contrast, pix_scaling, pix_scaling_dark, nr_of_levels, dither_params_1, dither_params_2, dither_params_3, mask_contrast, light_treshold, dark_treshold, invert_mask, tint_palette, layer_shift, sketch) {
  setBrightness(img, new_brightness, sketch);
  grayscale(img, contrast, sketch);

  let img_2 = img.get(); // copy image pixels
  let img_3 = img.get(); // copy image pixels

  // 1. Full image
  sketch.blendMode(sketch.BLEND); // make sure to set blendMode back to default one just in case
  sketch.noTint();
  img.resize(img.width / pix_scaling, 0);
  makeDithered(img, nr_of_levels, dither_params_1, sketch);
  resizeNN(img, img.width * pix_scaling, 0, sketch);
  sketch.image(img, image_border[0]/2, image_border[1]/2);

  // 2. Bright part of the image
  sketch.blendMode(sketch.BLEND);
  brightnessMask(img_2, mask_contrast, light_treshold, invert_mask, sketch);
  makeDithered(img_2, nr_of_levels, dither_params_2, sketch);
  sketch.image(img_2, image_border[0]/2 + layer_shift, image_border[1]/2 + layer_shift);

  // 3. Dark part of the image
  sketch.blendMode(sketch.ADD);
  img_3.resize(img_3.width / pix_scaling_dark, 0);
  brightnessMask(img_3, mask_contrast, dark_treshold, !invert_mask, sketch);
  makeDithered(img_3, nr_of_levels, dither_params_3, sketch);
  sketch.tint(tint_palette[0], tint_palette[1], tint_palette[2]);
  resizeNN(img_3, img_3.width * pix_scaling_dark, 0, sketch);
  sketch.image(img_3, image_border[0]/2 + layer_shift, image_border[1]/2 + layer_shift);

  sketch.blendMode(sketch.BLEND);
  sketch.noTint();
}


// effect stack 1 -> Tinted dither
export function applyTintedDither(img, image_border, new_brightness, contrast, pix_scaling, nr_of_levels, dither_params_1, dither_params_2, mask_contrast, light_treshold, invert_mask, tint_palette, layer_shift, sketch) {
  setBrightness(img, new_brightness, sketch);
  let img_2 = img.get(); // copy image pixels

  // 1. Full image
  sketch.blendMode(sketch.BLEND);
  setContrast(img, contrast, sketch);
  img.resize(img.width / pix_scaling, 0);
  makeDithered(img, nr_of_levels, dither_params_1, sketch);
  sketch.tint(tint_palette[0], tint_palette[1], tint_palette[2]);
  resizeNN(img, img.width * pix_scaling, 0, sketch);
  sketch.image(img, image_border[0]/2, image_border[1]/2);

  // 2. Bright part of the image
  sketch.blendMode(sketch.ADD);
  sketch.noTint();
  grayscale(img_2, contrast, sketch);
  img_2.resize(img_2.width / (pix_scaling / 2), 0);
  brightnessMask(img_2, mask_contrast, light_treshold, invert_mask, sketch);
  makeDithered(img_2, nr_of_levels, dither_params_2, sketch);
  resizeNN(img_2, img_2.width * pix_scaling / 2, 0, sketch);
  sketch.image(img_2, image_border[0]/2 + layer_shift, image_border[1]/2 + layer_shift);

  sketch.blendMode(sketch.BLEND);
  sketch.noTint();
}


// effect stack 2 -> Color dither + pixel sorting
export function applyDitherSorting(img, image_border, new_brightness, contrast, pix_scaling, nr_of_levels, dither_params_1, dither_params_2, mask_contrast, light_treshold, invert_mask, blackValue, brigthnessValue, whiteValue, sorting_mode, sorting_type, sorting_order, color_noise_density, color_noise_bias, color_noise_variation, tint_palette_key, tint_palette, layer_shift, sketch) {

  setBrightness(img, new_brightness, sketch);
  let img_2 = img.get(); // copy image pixels

  // 1. Full image
  sketch.blendMode(sketch.BLEND);
  setContrast(img, contrast, sketch);
  img.resize(img.width / pix_scaling, 0);
  makeDithered(img, nr_of_levels, dither_params_1, sketch);

  switch(sorting_order) {
    case 0:
      pixelSortColumn(img, blackValue, brigthnessValue, whiteValue, sorting_mode, sorting_type, color_noise_density, color_noise_bias, color_noise_variation, sketch);
      break;
    case 1:
      pixelSortRow(img, blackValue, brigthnessValue, whiteValue, sorting_mode, sorting_type, color_noise_density, color_noise_bias, color_noise_variation, sketch);
      break;
    case 2:
      pixelSortColumn(img, blackValue, brigthnessValue, whiteValue, sorting_mode, sorting_type, color_noise_density, color_noise_bias, color_noise_variation, sketch);
      pixelSortRow(img, blackValue, brigthnessValue, whiteValue, sorting_mode, sorting_type, color_noise_density, color_noise_bias, color_noise_variation, sketch);
      break;
    case 3:
      pixelSortRow(img, blackValue, brigthnessValue, whiteValue, sorting_mode, sorting_type, color_noise_density, color_noise_bias, color_noise_variation, sketch);
      pixelSortColumn(img, blackValue, brigthnessValue, whiteValue, sorting_mode, sorting_type, color_noise_density, color_noise_bias, color_noise_variation, sketch);
      break;
    default:
      break;
  }

  makeDithered(img, nr_of_levels, dither_params_1, sketch);

  if (tint_palette_key != 'rgb') { sketch.tint(tint_palette[0], tint_palette[1], tint_palette[2]); } // tint_palette_key 'rgb' has no tinting

  resizeNN(img, img.width * pix_scaling, 0, sketch);
  sketch.image(img, image_border[0]/2, image_border[1]/2);

  // 2. Bright part of the image
  sketch.blendMode(sketch.ADD);
  sketch.noTint();
  grayscale(img_2, contrast, sketch);
  img_2.resize(img_2.width / pix_scaling, 0);
  brightnessMask(img_2, mask_contrast, light_treshold, invert_mask, sketch);
  makeDithered(img_2, nr_of_levels, dither_params_2, sketch);
  resizeNN(img_2, img_2.width * pix_scaling, 0, sketch);
  sketch.image(img_2, image_border[0]/2 + layer_shift, image_border[1]/2 + layer_shift);

  sketch.blendMode(sketch.BLEND);
  sketch.noTint();
}


// effect stack 3 -> Pixel sorting + color dither
export function applySortingDither(img, image_border, new_brightness, contrast, pix_scaling, nr_of_levels, dither_params_1, dither_params_2, mask_contrast, light_treshold, invert_mask, blackValue, brigthnessValue, whiteValue, sorting_mode, sorting_type, sorting_order, color_noise_density, color_noise_bias, color_noise_variation, tint_palette_key, tint_palette, layer_shift, sketch) {

  setBrightness(img, new_brightness, sketch);
  let img_2 = img.get(); // copy image pixels

  // 1. Full image
  sketch.blendMode(sketch.BLEND);
  setContrast(img, contrast, sketch);
  img.resize(img.width / pix_scaling, 0);

  switch(sorting_order) {
    case 0:
      pixelSortColumn(img, blackValue, brigthnessValue, whiteValue, sorting_mode, sorting_type, color_noise_density, color_noise_bias, color_noise_variation, sketch);
      break;
    case 1:
      pixelSortRow(img, blackValue, brigthnessValue, whiteValue, sorting_mode, sorting_type, color_noise_density, color_noise_bias, color_noise_variation, sketch);
      break;
    case 2:
      pixelSortColumn(img, blackValue, brigthnessValue, whiteValue, sorting_mode, sorting_type, color_noise_density, color_noise_bias, color_noise_variation, sketch);
      pixelSortRow(img, blackValue, brigthnessValue, whiteValue, sorting_mode, sorting_type, color_noise_density, color_noise_bias, color_noise_variation, sketch);
      break;
    case 3:
      pixelSortRow(img, blackValue, brigthnessValue, whiteValue, sorting_mode, sorting_type, color_noise_density, color_noise_bias, color_noise_variation, sketch);
      pixelSortColumn(img, blackValue, brigthnessValue, whiteValue, sorting_mode, sorting_type, color_noise_density, color_noise_bias, color_noise_variation, sketch);
      break;
    default:
      break;
  }

  makeDithered(img, nr_of_levels, dither_params_1, sketch);

  if (tint_palette_key != 'rgb') { sketch.tint(tint_palette[0], tint_palette[1], tint_palette[2]); } // tint_palette_key 'rgb' has no tinting

  resizeNN(img, img.width * pix_scaling, 0, sketch);
  sketch.image(img, image_border[0]/2, image_border[1]/2);

  // 2. Bright part of the image
  sketch.blendMode(sketch.ADD);
  sketch.noTint();
  grayscale(img_2, contrast, sketch);
  img_2.resize(img_2.width / pix_scaling, 0);
  brightnessMask(img_2, mask_contrast, light_treshold, invert_mask, sketch);
  makeDithered(img_2, nr_of_levels, dither_params_2, sketch);
  resizeNN(img_2, img_2.width * pix_scaling, 0, sketch);
  sketch.image(img_2, image_border[0]/2 + layer_shift, image_border[1]/2 + layer_shift);

  sketch.blendMode(sketch.BLEND);
  sketch.noTint();
}


// effect stack 4 -> Abstract dither
export function applyAbstractDither(img, image_border, new_brightness, contrast, pix_scaling, nr_of_levels, dither_params_1, blackValue, brigthnessValue, whiteValue, sorting_mode, sorting_type, sorting_order, color_noise_density, color_noise_bias, color_noise_variation, layer_shift, sketch) {

  setBrightness(img, new_brightness, sketch);

  // 1. Full image
  sketch.blendMode(sketch.BLEND);
  grayscale(img, contrast, sketch);
  img.resize(img.width / pix_scaling, 0);
  makeDithered(img, nr_of_levels, dither_params_1, sketch);
  resizeNN(img, img.width * pix_scaling / 2.0, 0, sketch); // we resize back only half way
  let img_2 = img.get(); // copy image pixels, had to add this because of the bug with resizeNN which didn't work properly when applied twice on the same image

  // here we had to take out pixelSortRow option as it didn't produce nice results
  switch(sorting_order) {
    case 0:
      pixelSortColumn(img_2, blackValue, brigthnessValue, whiteValue, sorting_mode, sorting_type, color_noise_density, color_noise_bias, color_noise_variation, sketch);
      break;
    case 1:
      pixelSortColumn(img_2, blackValue, brigthnessValue, whiteValue, sorting_mode, sorting_type, color_noise_density, color_noise_bias, color_noise_variation, sketch);
      pixelSortRow(img_2, blackValue, brigthnessValue, whiteValue, sorting_mode, sorting_type, color_noise_density, color_noise_bias, color_noise_variation, sketch);
      break;
    case 2:
      pixelSortRow(img_2, blackValue, brigthnessValue, whiteValue, sorting_mode, sorting_type, color_noise_density, color_noise_bias, color_noise_variation, sketch);
      pixelSortColumn(img_2, blackValue, brigthnessValue, whiteValue, sorting_mode, sorting_type, color_noise_density, color_noise_bias, color_noise_variation, sketch);
      break;
    default:
      break;
  }

  makeDithered(img_2, nr_of_levels, dither_params_1, sketch);
  resizeNN(img_2, img_2.width * 2.0, 0, sketch); // we resize back double to get to the size of the original input image
  sketch.image(img_2, image_border[0]/2, image_border[1]/2);

  sketch.blendMode(sketch.BLEND);
  sketch.noTint();
}


// MAKE GIF ANIMATION

// create 5 frame animation using monochrome dither effect stack
export async function animateMonochromeDither(img, image_border, sketch, frameNum) {
  let nr_of_levels = 1;
  let contrast = 0.15;
  let rand_dither_key_1 = getRandomKey(dither_params_json, sketch);
  let rand_dither_key_2 = getRandomKey(extreme_dither_params_json, sketch);
  let rand_dither_key_3 = getRandomKey(dither_params_json, sketch);
  let dither_params_1 = dither_params_json[rand_dither_key_1];
  let dither_params_2 = extreme_dither_params_json[rand_dither_key_2];
  let dither_params_3 = dither_params_json[rand_dither_key_3];
  let pix_scaling = 2.0;
  let layer_shift = 4;
  let mask_contrast = 0.0;
  let dark_treshold = 20;
  let light_treshold = 80;
  let invert_mask = false;
  let tint_palette_weights = [ ['red', 15], ['green', 5], ['blue', 15], ['white', 65] ]; // these represent probabilities for choosing a tint palette [element, probability]
  let tint_palette_key = weightedChoice(tint_palette_weights, sketch);
  let tint_palette = three_bit_palette_reduced[tint_palette_key];
  // if tint color is white or green (these are very bright) then the size of dither pixels in darkest regions is smallest possible
  let pix_scaling_dark = (tint_palette_key == 'white') || (tint_palette_key == 'green') ? 1.0 : pix_scaling * 2;
  let rgb = false;
  let signal_recieved_weights = [ [true, 1], [false, 99] ]; // these represent probabilities for existance of 'signal' feature [element, probability]
  let signal_recieved = weightedChoice(signal_recieved_weights, sketch);

  let new_brightness = 1.0; // brightness needs to increase at 50% rate of the contrast
  let delta_factor = 0.5; // scaling animation effects
  let contrast_delta = animation_params['contrast t1']; // values from this list will be added to the contrast for each frame
  let brightness_delta = animation_params['brightness t1']; // values from this list will be added to the brightness for each frame

  let rand_quote_key = getRandomKey(neuromancer_quotes, sketch);
  let rand_quote_string = neuromancer_quotes[rand_quote_key];

  // add features
  features['tint'] = tint_palette_key;
  features['dither'] = dither_params_codes[rand_dither_key_1] + ' + ' + dither_params_codes[rand_dither_key_3];
  if (signal_recieved) { features['signal'] = rand_quote_key; }

  for (let i = 0; i < 5; i++) {
    // For parallelization. We run the contrast/new_brightness update each time to mimic original loop,
    // but only actually generate the requested frame
    if (frameNum == i) {
      const frame = img.get();
      sketch.background(0);
      applyMonochromeDither(frame, image_border, new_brightness, contrast, pix_scaling, pix_scaling_dark, nr_of_levels, dither_params_1, dither_params_2, dither_params_3, mask_contrast, light_treshold, dark_treshold, invert_mask, tint_palette, layer_shift, sketch);
      // draw lot nr. symbol in the bottom right corner of the image, based on Fu Xi Bagua trigrams, binary numbering
      addLotSymbol('001', frame, image_border, tint_palette, rgb, sketch);
      // draw quote from Neuromancer encoded in binary - only for those who have 'signal' feature
      if (signal_recieved) { addBinaryCode(rand_quote_string, img, image_border, tint_palette, rgb, frameNum, sketch); }
    }

    contrast += contrast_delta[i] * delta_factor;
    new_brightness += brightness_delta[i] * delta_factor;
  }
}


// create 5 frame animation using tinted dither effect stack
export async function animateTintedDither(img, image_border, sketch, frameNum) {
  let nr_of_levels = 1;
  let contrast = 0.25;
  let rand_dither_key_1 = getRandomKey(dither_params_json, sketch);
  let rand_dither_key_2 = getRandomKey(dither_params_json, sketch);
  let dither_params_1 = dither_params_json[rand_dither_key_1];
  let dither_params_2 = dither_params_json[rand_dither_key_2];
  let pix_scaling = 2.0;
  let layer_shift = 4;
  let mask_contrast = 0.25;
  let light_treshold = 50;
  let invert_mask = false;
  let tint_palette_weights = [ ['red', 25], ['green', 5], ['blue', 25], ['magenta', 25], ['cyan', 20] ]; // these represent probabilities for choosing a tint palette [element, probability]
  let tint_palette_key = weightedChoice(tint_palette_weights, sketch);
  let tint_palette = three_bit_palette[tint_palette_key];
  let rgb = false;
  let signal_recieved_weights = [ [true, 1], [false, 99] ]; // these represent probabilities for existance of 'signal' feature [element, probability]
  let signal_recieved = weightedChoice(signal_recieved_weights, sketch);

  let new_brightness = 1.0; // brightness needs to increase at 50% rate of the contrast
  let delta_factor = 0.5; // scaling animation effects
  let contrast_delta = animation_params['contrast t1']; // values from this list will be added to the contrast for each frame
  let brightness_delta = animation_params['brightness t1']; // values from this list will be added to the brightness for each frame

  let rand_quote_key = getRandomKey(neuromancer_quotes, sketch);
  let rand_quote_string = neuromancer_quotes[rand_quote_key];

  // add features
  features['tint'] = tint_palette_key;
  features['dither'] = dither_params_codes[rand_dither_key_1] + ' + ' + dither_params_codes[rand_dither_key_2];
  if (signal_recieved) { features['signal'] = rand_quote_key; }

  for (let i = 0; i < 5; i++) {
    // For parallelization. We run the contrast/new_brightness update each time to mimic original loop,
    // but only actually generate the requested frame
    if (frameNum == i) {
      const frame = img.get();
      sketch.background(0);
      applyTintedDither(frame, image_border, new_brightness, contrast, pix_scaling, nr_of_levels, dither_params_1, dither_params_2, mask_contrast, light_treshold, invert_mask, tint_palette, layer_shift, sketch);
      // draw lot nr. symbol in the bottom right corner of the image, based on Fu Xi Bagua trigrams, binary numbering
      addLotSymbol('001', frame, image_border, tint_palette, rgb, sketch);
      // draw quote from Neuromancer encoded in binary - only for those who have 'signal' feature
      if (signal_recieved) { addBinaryCode(rand_quote_string, img, image_border, tint_palette, rgb, frameNum, sketch); }
    }

    contrast += contrast_delta[i] * delta_factor;
    new_brightness += brightness_delta[i] * delta_factor;
  }
}



// create 5 frame animation using color dither + pixel sorting effect stack
export async function animateDitherSorting(img, image_border, sketch, frameNum) {
  let blackValue = 10;
  let brigthnessValue = 50;
  let whiteValue = 70;
  let sorting_mode = randInt(0, 3, sketch); // 0, 1, 2
  let sorting_type = randInt(0, 2, sketch); // 0, 1
  let sorting_order = randInt(0, 4, sketch); // 0, 1, 2, 3
  let color_noise_density = 5;
  let rand_color_bias_key = getRandomKey(color_bias_palette, sketch);
  let color_noise_bias = color_bias_palette[rand_color_bias_key];
  let color_noise_variation = 10000;

  let nr_of_levels = 1;
  let contrast = 0.15;
  let rand_dither_key_1 = getRandomKey(dither_params_json, sketch);
  let rand_dither_key_2 = getRandomKey(dither_params_json, sketch);
  let dither_params_1 = dither_params_json[rand_dither_key_1];
  let dither_params_2 = dither_params_json[rand_dither_key_2];
  let pix_scaling = 2.0;
  let layer_shift = 4;
  let mask_contrast = 0.25;
  let light_treshold = 50;
  let invert_mask = false;
  let tint_palette_weights = [ ['rgb', 10], ['magenta', 45], ['cyan', 45] ]; // these represent probabilities for choosing a tint palette [element, probability]
  let tint_palette_key = weightedChoice(tint_palette_weights, sketch);
  let tint_palette = three_bit_palette_sorting[tint_palette_key];
  let rgb = tint_palette_key == 'rgb' ? true : false;
  let signal_recieved_weights = [ [true, 1], [false, 99] ]; // these represent probabilities for existance of 'signal' feature [element, probability]
  let signal_recieved = weightedChoice(signal_recieved_weights, sketch);

  let new_brightness = 1.0; // brightness needs to increase at 50% rate of the contrast
  let delta_factor = 0.5; // scaling animation effects
  let contrast_delta = animation_params['contrast t1']; // values from this list will be added to the contrast for each frame
  let brightness_delta = animation_params['brightness t1']; // values from this list will be added to the brightness for each frame

  let rand_quote_key = getRandomKey(neuromancer_quotes, sketch);
  let rand_quote_string = neuromancer_quotes[rand_quote_key];

  // add features
  features['tint'] = tint_palette_key;
  features['dither'] = dither_params_codes[rand_dither_key_1] + ' + ' + dither_params_codes[rand_dither_key_2];
  if (signal_recieved) { features['signal'] = rand_quote_key; }

  for (let i = 0; i < 5; i++) {
    // For parallelization. We run the contrast/new_brightness update each time to mimic original loop,
    // but only actually generate the requested frame
    if (frameNum == i) {
      const frame = img.get();
      sketch.background(0);
      applyDitherSorting(frame, image_border, new_brightness, contrast, pix_scaling, nr_of_levels, dither_params_1, dither_params_2, mask_contrast, light_treshold, invert_mask, blackValue, brigthnessValue, whiteValue, sorting_mode, sorting_type, sorting_order, color_noise_density, color_noise_bias, color_noise_variation, tint_palette_key, tint_palette, layer_shift, sketch);
      // draw lot nr. symbol in the bottom right corner of the image, based on Fu Xi Bagua trigrams, binary numbering
      addLotSymbol('001', frame, image_border, tint_palette, rgb, sketch);
      // draw quote from Neuromancer encoded in binary - only for those who have 'signal' feature
      if (signal_recieved) { addBinaryCode(rand_quote_string, img, image_border, tint_palette, rgb, frameNum, sketch); }
    }

    contrast += contrast_delta[i] * delta_factor;
    new_brightness += brightness_delta[i] * delta_factor;
  }
}



// create 5 frame animation using pixel sorting + color dither effect stack
export async function animateSortingDither(img, image_border, sketch, frameNum) {
  let blackValue = 10;
  let brigthnessValue = 50;
  let whiteValue = 70;
  let sorting_mode = randInt(0, 3, sketch); // 0, 1, 2
  let sorting_type = randInt(0, 2, sketch); // 0, 1
  let sorting_order = randInt(0, 4, sketch); // 0, 1, 2, 3
  let color_noise_density = 5;
  let rand_color_bias_key = getRandomKey(color_bias_palette, sketch);
  let color_noise_bias = color_bias_palette[rand_color_bias_key];
  let color_noise_variation = 10000; //10000

  let nr_of_levels = 1;
  let contrast = 0.15; // 15
  let rand_dither_key_1 = getRandomKey(dither_params_json, sketch);
  let rand_dither_key_2 = getRandomKey(dither_params_json, sketch);
  let dither_params_1 = dither_params_json[rand_dither_key_1];
  let dither_params_2 = dither_params_json[rand_dither_key_2];
  let pix_scaling = 2.0;
  let layer_shift = 4;
  let mask_contrast = 0.25;
  let light_treshold = 50;
  let invert_mask = false;
  let tint_palette_weights = [ ['rgb', 10], ['magenta', 45], ['cyan', 45] ]; // these represent probabilities for choosing a tint palette [element, probability]
  let tint_palette_key = weightedChoice(tint_palette_weights, sketch);
  let tint_palette = three_bit_palette_sorting[tint_palette_key];
  let rgb = tint_palette_key == 'rgb' ? true : false;
  let signal_recieved_weights = [ [true, 1], [false, 99] ]; // these represent probabilities for existance of 'signal' feature [element, probability]
  let signal_recieved = weightedChoice(signal_recieved_weights, sketch);

  let new_brightness = 1.0; // brightness needs to increase at 50% rate of the contrast
  let delta_factor = 0.5; // scaling animation effects
  let contrast_delta = animation_params['contrast t1']; // values from this list will be added to the contrast for each frame
  let brightness_delta = animation_params['brightness t1']; // values from this list will be added to the brightness for each frame

  let rand_quote_key = getRandomKey(neuromancer_quotes, sketch);
  let rand_quote_string = neuromancer_quotes[rand_quote_key];

  // add features
  features['tint'] = tint_palette_key;
  features['dither'] = dither_params_codes[rand_dither_key_1] + ' + ' + dither_params_codes[rand_dither_key_2];
  if (signal_recieved) { features['signal'] = rand_quote_key; }

  for (let i = 0; i < 5; i++) {
    // For parallelization. We run the contrast/new_brightness update each time to mimic original loop,
    // but only actually generate the requested frame
    if (frameNum == i) {
      const frame = img.get();
      sketch.background(0);
      applySortingDither(frame, image_border, new_brightness, contrast, pix_scaling, nr_of_levels, dither_params_1, dither_params_2, mask_contrast, light_treshold, invert_mask, blackValue, brigthnessValue, whiteValue, sorting_mode, sorting_type, sorting_order, color_noise_density, color_noise_bias, color_noise_variation, tint_palette_key, tint_palette, layer_shift, sketch);
      // draw lot nr. symbol in the bottom right corner of the image, based on Fu Xi Bagua trigrams, binary numbering
      addLotSymbol('001', frame, image_border, tint_palette, rgb, sketch);
      // draw quote from Neuromancer encoded in binary - only for those who have 'signal' feature
      if (signal_recieved) { addBinaryCode(rand_quote_string, img, image_border, tint_palette, rgb, frameNum, sketch); }
    }

    contrast += contrast_delta[i] * delta_factor;
    new_brightness += brightness_delta[i] * delta_factor;
  }
}




// create 5 frame animation using abstract dither effect stack
export async function animateAbstractDither(img, image_border, sketch, frameNum) {
  let blackValue = 10;
  let brigthnessValue = 50;
  let whiteValue = 70;
  let sorting_mode = 2; // this mode works best for this workflow
  let sorting_type = randInt(0, 2, sketch); // 0, 1
  let sorting_order = randInt(0, 3, sketch); // 0, 1, 2
  let color_noise_density = 5;
  let rand_color_bias_key = getRandomKey(color_bias_palette, sketch);
  let color_noise_bias = color_bias_palette[rand_color_bias_key];
  let color_noise_variation = 10000;

  let nr_of_levels = 1;
  let contrast = 0.25;
  let dither_group_weights = [ [0, 80], [1, 20] ]; // these represent probabilities for choosing a dither group number [element, probability]
  let dither_group = weightedChoice(dither_group_weights, sketch); // type of effects workflow to be used as a number, 0-4

  let rand_dither_key_1, dither_params_1, dither_code;

  switch(dither_group) {
    case 0: // smaller pixels, less abstract, common
      rand_dither_key_1 = getRandomKey(dither_params_json, sketch);
      dither_params_1 = dither_params_json[rand_dither_key_1];
      dither_code = dither_params_codes[rand_dither_key_1];
      break;
    case 1: // larger pixels, more abstract, rare
      rand_dither_key_1 = getRandomKey(extreme_dither_params_json, sketch);
      dither_params_1 = extreme_dither_params_json[rand_dither_key_1];
      dither_code = rand_dither_key_1;
      break;
    default:
      break;
  }

  let pix_scaling = dither_group == 0 ? 8.0 : 16.0; // larger dither pixels for extreme dither parameters
  let layer_shift = 4;
  let mask_contrast = 0.25;
  let light_treshold = 50;
  let invert_mask = false;
  let tint_palette = [color_noise_bias[0] * 255, color_noise_bias[1] * 255, color_noise_bias[2] * 255];
  let rgb = false;
  let signal_recieved_weights = [ [true, 1], [false, 99] ]; // these represent probabilities for existance of 'signal' feature [element, probability]
  let signal_recieved = weightedChoice(signal_recieved_weights, sketch);

  let new_brightness = 1.0; // brightness needs to increase at 50% rate of the contrast
  let delta_factor = 0.05; // scaling animation effects
  let contrast_delta = animation_params['contrast t1']; // values from this list will be added to the contrast for each frame
  let brightness_delta = animation_params['brightness t1']; // values from this list will be added to the brightness for each frame

  let rand_quote_key = getRandomKey(neuromancer_quotes, sketch);
  let rand_quote_string = neuromancer_quotes[rand_quote_key];

  // add features
  features['tint'] = rand_color_bias_key;
  features['dither'] = dither_code;
  if (signal_recieved) { features['signal'] = rand_quote_key; }

  for (let i = 0; i < 5; i++) {
    // For parallelization. We run the contrast/new_brightness update each time to mimic original loop,
    // but only actually generate the requested frame
    if (frameNum == i) {
      const frame = img.get();
      sketch.background(0);
      applyAbstractDither(frame, image_border, new_brightness, contrast, pix_scaling, nr_of_levels, dither_params_1, blackValue, brigthnessValue, whiteValue, sorting_mode, sorting_type, sorting_order, color_noise_density, color_noise_bias, color_noise_variation, layer_shift, sketch);
      // looks like frame changes size after we run it through effects above, so we need to recreate a temp object just to hold original frame dimensions
      let fakeFrame = {width:900, height:900};
      // draw lot nr. symbol in the bottom right corner of the image, based on Fu Xi Bagua trigrams, binary numbering
      addLotSymbol('001', fakeFrame, image_border, tint_palette, rgb, sketch);
      // draw quote from Neuromancer encoded in binary - only for those who have 'signal' feature
      if (signal_recieved) { addBinaryCode(rand_quote_string, img, image_border, tint_palette, rgb, frameNum, sketch); }
    }

    contrast += contrast_delta[i] * delta_factor;
    new_brightness += brightness_delta[i] * delta_factor;
  }
}




// ASDFPixelSort_Color - rewritten from Java to JavaScript by @lukapiskorec
// original Java code downloaded from here
//https://github.com/shmam/ASDFPixelSort_Color

export function pixelSortColor(img, blackValue, brigthnessValue, whiteValue, sorting_mode, sorting_type, color_noise_density = 5, color_noise_bias = [1,1,1], color_noise_variation = 1000, sketch) {
  // reset row and column for each image!
  let row = 0;
  let column = 0;

  img.loadPixels();

  while(column < img.width-1) {
    sortColumn(img, column, blackValue, brigthnessValue, whiteValue, sorting_mode, sorting_type, color_noise_density, color_noise_bias, color_noise_variation, sketch);
    column++;
  }

  while(row < img.height-1) {
    sortRow(img, row, blackValue, brigthnessValue, whiteValue, sorting_mode, sorting_type, color_noise_density, color_noise_bias, color_noise_variation, sketch);
    row++;
  }

  img.updatePixels();
}


export function pixelSortColumn(img, blackValue, brigthnessValue, whiteValue, sorting_mode, sorting_type, color_noise_density = 5, color_noise_bias = [1,1,1], color_noise_variation = 1000, sketch) {
  // reset column for each image!
  let column = 0;

  img.loadPixels();

  while(column < img.width-1) {
    sortColumn(img, column, blackValue, brigthnessValue, whiteValue, sorting_mode, sorting_type, color_noise_density, color_noise_bias, color_noise_variation, sketch);
    column++;
  }

  img.updatePixels();
}


export function pixelSortRow(img, blackValue, brigthnessValue, whiteValue, sorting_mode, sorting_type, color_noise_density = 5, color_noise_bias = [1,1,1], color_noise_variation = 1000, sketch) {
  // reset row for each image!
  let row = 0;

  img.loadPixels();

  while(row < img.height-1) {
    sortRow(img, row, blackValue, brigthnessValue, whiteValue, sorting_mode, sorting_type, color_noise_density, color_noise_bias, color_noise_variation, sketch);
    row++;
  }

  img.updatePixels();
}


// used for pixel sorting
function sortRow(img, row, blackValue, brigthnessValue, whiteValue, sorting_mode, sorting_type, color_noise_density = 5, color_noise_bias = [1,1,1], color_noise_variation = 1000, sketch) {
  let x = 0;
  let y = row;
  let xend = 0;

  while(xend < img.width-1) {
    switch(sorting_mode) {
      case 0:
        x = getFirstNotBlackX(img, x, y, blackValue, sketch);
        xend = getNextBlackX(img, x, y, blackValue, sketch);
        break;
      case 1:
        x = getFirstBrightX(img, x, y, brigthnessValue, sketch);
        xend = getNextDarkX(img, x, y, brigthnessValue, sketch);
        break;
      case 2:
        x = getFirstNotWhiteX(img, x, y, whiteValue, sketch);
        xend = getNextWhiteX(img, x, y, whiteValue, sketch);
        break;
      default:
        break;
    }

    if(x < 0) {
      break;
    }

    let sortLength = xend-x;
    let unsorted = [];
    let sorted = [];

    //randomColor = color(random(255), random(255), random(255), 255);
    let randomColor = sketch.color(sketch.random(255)*color_noise_bias[0], sketch.random(255)*color_noise_bias[1], sketch.random(255)*color_noise_bias[2], 255);
    let d = 0;

    if(sketch.random(100) < color_noise_density){
         d = sketch.random(color_noise_variation);
    }

    for(let i=0; i<sortLength; i= i+1) {
      if (d > 0){
          let mixPercentage = 0.5 + sketch.random(50)/100;
          let pixelColor = getColorAtIndex(img, x + i, y, sketch);
          setColorAtIndex(img, x + i, y, sketch.lerpColor(pixelColor, randomColor, mixPercentage), sketch);
          d--;
      }

      switch(sorting_type) {
        case 0: // chaotic sorting
          unsorted[i] = getColorAtIndex(img, x + i, y, sketch);
          break;
        case 1: // proper sorting
          let colorHex = getColorAtIndex(img, x + i, y, sketch);
          unsorted[i] = rgbToHex(sketch.red(colorHex), sketch.green(colorHex), sketch.blue(colorHex), sketch);
          break;
        default:
          break;
      }
    }

    sorted = unsorted.sort();

    for(let i=0; i<sortLength; i=i+1) {
      switch(sorting_type) {
        case 0: // chaotic sorting
          setColorAtIndex(img, x + i, y, sorted[i], sketch);
          break;
        case 1: // proper sorting
          let pixelColor = hexToRgb(unsorted[i], sketch);
          setColorAtIndex(img, x + i, y, pixelColor, sketch);
          break;
        default:
          break;
      }
    }

    x = xend+1;
  }
}


// used for pixel sorting
function sortColumn(img, column, blackValue, brigthnessValue, whiteValue, sorting_mode, sorting_type, color_noise_density = 5, color_noise_bias = [1,1,1], color_noise_variation = 1000, sketch) {
  let x = column;
  let y = 0;
  let yend = 0;

  while(yend < img.height-1) {
    switch(sorting_mode) {
      case 0:
        y = getFirstNotBlackY(img, x, y, blackValue, sketch);
        yend = getNextBlackY(img, x, y, blackValue, sketch);
        break;
      case 1:
        y = getFirstBrightY(img, x, y, brigthnessValue, sketch);
        yend = getNextDarkY(img, x, y, brigthnessValue, sketch);
        break;
      case 2:
        y = getFirstNotWhiteY(img, x, y, whiteValue, sketch);
        yend = getNextWhiteY(img, x, y, whiteValue, sketch);
        break;
      default:
        break;
    }

    if(y < 0) {
      break;
    }

    let sortLength = yend-y;
    let unsorted = [];
    let sorted = [];

    //randomColor = color(random(255), random(255), random(255), 255);
    let randomColor = sketch.color(sketch.random(255)*color_noise_bias[0], sketch.random(255)*color_noise_bias[1], sketch.random(255)*color_noise_bias[2], 255);
    let d = 0;

    if(sketch.random(100) < color_noise_density){
         d = sketch.random(color_noise_variation);
    }

    for(let i=0; i<sortLength; i++) {
      if (d > 0){
          let mixPercentage = 0.5 + sketch.random(50)/100;
          let pixelColor = getColorAtIndex(img, x + i, y, sketch);
          setColorAtIndex(img, x + i, y, sketch.lerpColor(pixelColor, randomColor, mixPercentage), sketch);
          d--;
      }

      switch(sorting_type) {
        case 0: // chaotic sorting
          unsorted[i] = getColorAtIndex(img, x + i, y, sketch);
          break;
        case 1: // proper sorting
          let colorHex = getColorAtIndex(img, x + i, y, sketch);
          unsorted[i] = rgbToHex(sketch.red(colorHex), sketch.green(colorHex), sketch.blue(colorHex), sketch);
          break;
        default:
          break;
      }
    }

    sorted = unsorted.sort();

    for(let i=0; i<sortLength; i++) {
      switch(sorting_type) {
        case 0: // chaotic sorting
          setColorAtIndex(img, x, y + i, sorted[i], sketch);
          break;
        case 1: // proper sorting
          let pixelColor = hexToRgb(unsorted[i], sketch);
          setColorAtIndex(img, x, y + i, pixelColor, sketch);
          break;
        default:
          break;
      }
    }

    y = yend+1;
  }
}




//BLACK X
// used for pixel sorting
function getFirstNotBlackX(img, _x, _y, blackValue, sketch) {
  let x = _x;
  let y = _y;
  while(sketch.brightness(getColorAtIndex(img, x, y, sketch)) < blackValue) {
    x++;
    if(x >= img.width) return -1;
  }
  return x;
}

function getNextBlackX(img, _x, _y, blackValue, sketch) {
  let x = _x+1;
  let y = _y;
  while(sketch.brightness(getColorAtIndex(img, x, y, sketch)) > blackValue) {
    x++;
    if(x >= img.width) return img.width-1;
  }
  return x-1;
}

//BRIGHTNESS X
// used for pixel sorting
function getFirstBrightX(img, _x, _y, brigthnessValue, sketch) {
  let x = _x;
  let y = _y;
  while(sketch.brightness(getColorAtIndex(img, x, y, sketch)) < brigthnessValue) {
    x++;
    if(x >= img.width) return -1;
  }
  return x;
}

function getNextDarkX(img, _x, _y, brigthnessValue, sketch) {
  let x = _x+1;
  let y = _y;
  while(sketch.brightness(getColorAtIndex(img, x, y, sketch)) > brigthnessValue) {
    x++;
    if(x >= img.width) return img.width-1;
  }
  return x-1;
}

//WHITE X
// used for pixel sorting
function getFirstNotWhiteX(img, _x, _y, whiteValue, sketch) {
  let x = _x;
  let y = _y;
  while(sketch.brightness(getColorAtIndex(img, x, y, sketch)) > whiteValue) {
    x++;
    if(x >= img.width) return -1;
  }
  return x;
}

function getNextWhiteX(img, _x, _y, whiteValue, sketch) {
  let x = _x+1;
  let y = _y;
  while(sketch.brightness(getColorAtIndex(img, x, y, sketch)) < whiteValue) {
    x++;
    if(x >= img.width) return img.width-1;
  }
  return x-1;
}

//BLACK Y
// used for pixel sorting
function getFirstNotBlackY(img, _x, _y, blackValue, sketch) {
  let x = _x;
  let y = _y;
  if(y < img.height) {
    while(sketch.brightness(getColorAtIndex(img, x, y, sketch)) < blackValue) {
      y++;
      if(y >= img.height) return -1;
    }
  }
  return y;
}

function getNextBlackY(img, _x, _y, blackValue, sketch) {
  let x = _x;
  let y = _y+1;
  if(y < img.height) {
    while(sketch.brightness(getColorAtIndex(img, x, y, sketch)) > blackValue) {
      y++;
      if(y >= img.height) return img.height-1;
    }
  }
  return y-1;
}

//BRIGHTNESS Y
// used for pixel sorting
function getFirstBrightY(img, _x, _y, brigthnessValue, sketch) {
  let x = _x;
  let y = _y;
  if(y < img.height) {
    while(sketch.brightness(getColorAtIndex(img, x, y, sketch)) < brigthnessValue) {
      y++;
      if(y >= img.height) return -1;
    }
  }
  return y;
}

function getNextDarkY(img, _x, _y, brigthnessValue, sketch) {
  let x = _x;
  let y = _y+1;
  if(y < img.height) {
    while(sketch.brightness(getColorAtIndex(img, x, y, sketch)) > brigthnessValue) {
      y++;
      if(y >= img.height) return img.height-1;
    }
  }
  return y-1;
}

//WHITE Y
// used for pixel sorting
function getFirstNotWhiteY(img, _x, _y, whiteValue, sketch) {
  let x = _x;
  let y = _y;
  if(y < img.height) {
    while(sketch.brightness(getColorAtIndex(img, x, y, sketch)) > whiteValue) {
      y++;
      if(y >= img.height) return -1;
    }
  }
  return y;
}

function getNextWhiteY(img, _x, _y, whiteValue, sketch) {
  let x = _x;
  let y = _y+1;
  if(y < img.height) {
    while(sketch.brightness(getColorAtIndex(img, x, y, sketch)) < whiteValue) {
      y++;
    if(y >= img.height) return img.height-1;
    }
  }
  return y-1;
}




//Coding Challenge #90: Floyd-Steinberg dithering
//https://www.youtube.com/watch?v=0L2n8Tg2FwI
//code downloaded from here
//https://editor.p5js.org/codingtrain/sketches/-YkMaf9Ea

// Applies Floyd-Steinberg dithering with steps+1 number of levels on an image
export function makeDithered(img, steps, dither_params, sketch) {
  img.loadPixels();

  for (let y = 0; y < img.height; y += 1) {
    for (let x = 0; x < img.width; x += 1) {
      let [oldR, oldG, oldB, oldA] = getColorArrayAtIndex(img, x, y, sketch);

      let newR = closestStep(255, steps, oldR, sketch);
      let newG = closestStep(255, steps, oldG, sketch);
      let newB = closestStep(255, steps, oldB, sketch);
      let newA = closestStep(255, steps, oldA, sketch);

      const newClr = [newR, newG, newB, newA];
      setColorAtIndex(img, x, y, newClr, sketch);

      let errR = oldR - newR;
      let errG = oldG - newG;
      let errB = oldB - newB;
      let errA = oldA - newA;

      distributeError_params(img, x, y, errR, errG, errB, errA, dither_params, sketch);
    }
  }
  img.updatePixels();
}


//Floyd-Steinberg algorithm achieves dithering using error diffusion (formula from Wikipedia)
function distributeError(img, x, y, errR, errG, errB, errA, sketch) {
  addError(img, 7 / 16.0, x + 1, y, errR, errG, errB, errA, sketch);
  addError(img, 3 / 16.0, x - 1, y + 1, errR, errG, errB, errA, sketch);
  addError(img, 5 / 16.0, x, y + 1, errR, errG, errB, errA, sketch);
  addError(img, 1 / 16.0, x + 1, y + 1, errR, errG, errB, errA, sketch);
}


//Floyd-Steinberg dithering algorithm with varable parameters
function distributeError_params(img, x, y, errR, errG, errB, errA, params, sketch) {
  if (params[0] != 0) addError(img, params[0], x + 1, y, errR, errG, errB, errA, sketch);
  if (params[1] != 0) addError(img, params[1], x - 1, y + 1, errR, errG, errB, errA, sketch);
  if (params[2] != 0) addError(img, params[2], x, y + 1, errR, errG, errB, errA, sketch);
  if (params[3] != 0) addError(img, params[3], x + 1, y + 1, errR, errG, errB, errA, sketch);
}


//Floyd-Steinberg algorithm pushes (adds) the residual quantization error
//of a pixel onto its neighboring pixels
function addError(img, factor, x, y, errR, errG, errB, errA, sketch) {
  if (x < 0 || x >= img.width || y < 0 || y >= img.height) return;
  let [r, g, b, a] = getColorArrayAtIndex(img, x, y, sketch);
  r = r + errR * factor;
  g = g + errG * factor;
  b = b + errB * factor;
  a = a + errA * factor;
  setColorAtIndex(img, x, y, [r,g,b,a], sketch);
}


//experiment with different Floyd-Steinberg dithering variations using this online tool:
//https://kgjenkins.github.io/dither-dream/
//repository link:
//https://github.com/kgjenkins/dither-dream





//_____________________________________________________
// Custom functions
//_____________________________________________________



// Convert RGB to HEX
// from https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
function rgbToHex(r, g, b, sketch) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// Convert RGB to HEX
// from https://editor.p5js.org/Kubi/sketches/IJp2TXHNJ
function hexToRgb(hex, sketch) {
    hex = hex.replace('#', '');
    let bigint = parseInt(hex, 16);
    let r = (bigint >> 16) & 255;
    let g = (bigint >> 8) & 255;
    let b = bigint & 255;
    return sketch.color(r, g, b);
}

// return random integer from min to max number
export function randInt(min, max, sketch) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(sketch.random(min, max));
}

// return a random key from JSON dictionary
export function getRandomKey(json_dict, sketch){
    let obj_keys = Object.keys(json_dict);
    let ran_key = obj_keys[Math.floor(sketch.random(obj_keys.length))]; //let ran_key = obj_keys[sketch.int(sketch.random(obj_keys.length))];
    return ran_key;
}

// return random element from a list with set weights in form:
// data = [ ["a", 50], ["b", 25], ["c", 25] ]; numbers are not strict probabilities so don't have to add up to 100
export function weightedChoice(data, sketch){
  let total = 0;
  for (let i = 0; i < data.length; ++i) {
      total += data[i][1];
  }
  const threshold = sketch.random(total);
  total = 0;
  for (let i = 0; i < data.length - 1; ++i) {
      total += data[i][1];
      if (total >= threshold) {
          return data[i][0];
      }
  }
  return data[data.length - 1][0];
}


// returns an index location (i) for pixel coordinates (x,y)
function imageIndex(img, x, y) {
  return 4 * (x + y * img.width);
}

// returns color of a pixel at coordinates (x,y)
function getColorAtIndex(img, x, y, sketch) {
  let idx = imageIndex(img, x, y);
  let pix = img.pixels;
  let red = pix[idx];
  let green = pix[idx + 1];
  let blue = pix[idx + 2];
  let alpha = pix[idx + 3];
  return sketch.color(red, green, blue, alpha);
}

// returns color of a pixel at coordinates (x,y)
function getColorArrayAtIndex(img, x, y, sketch) {
  let idx = imageIndex(img, x, y);
  return img.pixels.slice(idx, idx+4);
}

// sets a color of a pixel at coordinates (x,y)
function setColorAtIndex(img, x, y, clr, sketch) {
  let idx = imageIndex(img, x, y);
  let pix = img.pixels;

  if (clr instanceof Array) {
    pix[idx]     = clr[0];
    pix[idx + 1] = clr[1];
    pix[idx + 2] = clr[2];
    pix[idx + 3] = clr[3];
  } else {
    pix[idx]     = sketch.red(clr);
    pix[idx + 1] = sketch.green(clr);
    pix[idx + 2] = sketch.blue(clr);
    pix[idx + 3] = sketch.alpha(clr);
  }
}

// Finds the closest step for a given value
// The step 0 is always included, so the number of steps is actually steps + 1
function closestStep(max, steps, value) {
  return Math.round(steps * value / max) * Math.floor(max / steps);
}

// make image grayscale
// adapted from https://github.com/kgjenkins/dither-dream
export function grayscale(img, contrast, sketch) {
  img.loadPixels();
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      let [r, g, b, a] = getColorArrayAtIndex(img, x, y, sketch);
      // calculate greyscale following Rec 601 luma
      let v = (0.3*r + 0.58*g + 0.11*b) * a/255;
      //stretch to increase contrast
      v = v + (v-128)*contrast;
      const newClr = [v,v,v,a];
      setColorAtIndex(img, x, y, newClr, sketch);
    }
  }
  img.updatePixels();
}


// change image contrast
export function setContrast(img, contrast, sketch) {
  img.loadPixels();
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      let [r, g, b, a] = getColorArrayAtIndex(img, x, y, sketch);
      //stretch to increase contrast
      r = r + (r-128)*contrast;
      g = g + (g-128)*contrast;
      b = b + (b-128)*contrast;
      let newClr = [r, g, b, a];
      setColorAtIndex(img, x, y, newClr, sketch);
    }
  }
  img.updatePixels();
}

// change image brightness
export function setBrightness(img, brightness, sketch) {
  img.loadPixels();
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      let [r, g, b, a] = getColorArrayAtIndex(img, x, y, sketch);
      //multiply by the constant to change the brightness
      r = r * brightness;
      g = g * brightness;
      b = b * brightness;
      //constrain RGB to make sure they are within 0-255 color range
      r = sketch.constrain(r, 0, 255);
      g = sketch.constrain(g, 0, 255);
      b = sketch.constrain(b, 0, 255);
      let newClr = [r,g,b,a];
      setColorAtIndex(img, x, y, newClr, sketch);
    }
  }
  img.updatePixels();
}

// stripes the image with black bands
export function makeStriped(img, stripe_width, stripe_offset = 0, invert = false, sketch) {
  img.loadPixels();
  for (let y = 0; y < img.height; y += 1) {
    for (let x = 0; x < img.width; x += 1) {
      let clr = getColorAtIndex(img, x, y, sketch);
      // here we use some smart boolean logic to quickly invert the black band pattern
      let r = y % stripe_width == stripe_offset ? sketch.red(clr)*!invert : sketch.red(clr)*invert ;
      let g = y % stripe_width == stripe_offset ? sketch.green(clr)*!invert : sketch.green(clr)*invert ;
      let b = y % stripe_width == stripe_offset ? sketch.blue(clr)*!invert : sketch.blue(clr)*invert ;
      let newClr = sketch.color(r, g, b, sketch.alpha(clr));
      setColorAtIndex(img, x, y, newClr, sketch);
    }
  }
  img.updatePixels();
}

// make parts of the image transparent based on brightness
export function brightnessMask(img, contrast, treshold, invert = false, sketch) {
  img.loadPixels();
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      let [r, g, b, a] = getColorArrayAtIndex(img, x, y, sketch);
      // calculate greyscale following Rec 601 luma
      let v = (0.3*r + 0.58*g + 0.11*b) * a/255;
      // stretch to increase contrast
      v = v + (v-128)*contrast;
      let brightness = v / 255 * 100;
      let newAlpha = brightness > treshold ? 255*!invert : 255*invert;;
      let newClr = [r,g,b,newAlpha];
      setColorAtIndex(img, x, y, newClr, sketch);
    }
  }
  img.updatePixels();
}

// flip image horizontally
export function flipHorizontal(img, sketch) {
  let img_temp = sketch.createImage(img.width, img.height);
  img_temp.loadPixels();
  img.loadPixels();
  // create a temporary image with flipped pixels
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      let clr = getColorAtIndex(img, img.width - x, y, sketch);
      let r = sketch.red(clr);
      let g = sketch.green(clr);
      let b = sketch.blue(clr);
      let a = sketch.alpha(clr);
      let newClr = sketch.color(r, g, b, a);
      setColorAtIndex(img_temp, x, y, newClr, sketch);
    }
  }
  // replace all pixels from the original image with the pixels from the flipped one
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      let clr = getColorAtIndex(img_temp, x, y, sketch);
      let r = sketch.red(clr);
      let g = sketch.green(clr);
      let b = sketch.blue(clr);
      let a = sketch.alpha(clr);
      let newClr = sketch.color(r, g, b, a);
      setColorAtIndex(img, x, y, newClr, sketch);
    }
  }
  img.updatePixels();
  img_temp.updatePixels();
}

// draw lot nr. symbol in the bottom right corner of the image, based on Fu Xi Bagua trigrams, binary numbering
function addLotSymbol(symbol_code, img, image_border, color, rgb = false, sketch) {
  let symbol_size = 18;
  let symbol_spacing = 6;
  let symbol_thickness = 2;
  let y_offset = 18;

  sketch.stroke(color[0], color[1], color[2]);
  sketch.strokeWeight(symbol_thickness);
  sketch.strokeCap(sketch.SQUARE);

  // first line (from the right)
  if (rgb) {sketch.stroke(0, 0, 255);} // blue
  if (symbol_code.charAt(2) == '0') {
    // gap line
    sketch.line(img.width + image_border[0]/2, img.height + image_border[1]/2 + symbol_size + y_offset, img.width + image_border[0]/2, img.height + image_border[1]/2 + 2*symbol_size/3 + y_offset);
    sketch.line(img.width + image_border[0]/2, img.height + image_border[1]/2 + symbol_size/3 + y_offset, img.width + image_border[0]/2, img.height + image_border[1]/2 + y_offset);
  } else {
    // solid line
    sketch.line(img.width + image_border[0]/2, img.height + image_border[1]/2 + symbol_size + y_offset, img.width + image_border[0]/2, img.height + image_border[1]/2 + y_offset);
  }

  // second line (from the right)
  if (rgb) {sketch.stroke(0, 255, 0);} // green
  if (symbol_code.charAt(1) == '0') {
    // gap line
    sketch.line(img.width + image_border[0]/2 - symbol_spacing, img.height + image_border[1]/2 + symbol_size + y_offset, img.width + image_border[0]/2 - symbol_spacing, img.height + image_border[1]/2 + 2*symbol_size/3 + y_offset);
    sketch.line(img.width + image_border[0]/2 - symbol_spacing, img.height + image_border[1]/2 + symbol_size/3 + y_offset, img.width + image_border[0]/2 - symbol_spacing, img.height + image_border[1]/2 + y_offset);
  } else {
    // solid line
    sketch.line(img.width + image_border[0]/2 - symbol_spacing, img.height + image_border[1]/2 + symbol_size + y_offset, img.width + image_border[0]/2 - symbol_spacing, img.height + image_border[1]/2 + y_offset);
  }

  // third line (from the right)
  if (rgb) {sketch.stroke(255, 0, 0);} // red
  if (symbol_code.charAt(0) == '0') {
    // gap line
    sketch.line(img.width + image_border[0]/2 - symbol_spacing*2, img.height + image_border[1]/2 + symbol_size + y_offset, img.width + image_border[0]/2 - symbol_spacing*2, img.height + image_border[1]/2 + 2*symbol_size/3 + y_offset);
    sketch.line(img.width + image_border[0]/2 - symbol_spacing*2, img.height + image_border[1]/2 + symbol_size/3 + y_offset, img.width + image_border[0]/2 - symbol_spacing*2, img.height + image_border[1]/2 + y_offset);
  } else {
    // solid line
    sketch.line(img.width + image_border[0]/2 - symbol_spacing*2, img.height + image_border[1]/2 + symbol_size + y_offset, img.width + image_border[0]/2 - symbol_spacing*2, img.height + image_border[1]/2 + y_offset);
  }
}

// draw binary encoding of a string
function addBinaryCode(code_string, img, image_border, color, rgb = false, frameNum, sketch) {
  let symbol_size = 9;
  let symbol_spacing = 3;
  let symbol_thickness = 2;
  let y_offset = 23;
  let x_offset = -20;
  let slice_length = 33; // this much fits on the image

  let start_slice = slice_length * frameNum;
  let end_slice = slice_length * (frameNum + 1);
  let sliced_code_string = code_string.slice(start_slice, end_slice);

  // console.log('frameNum ' + frameNum.toString());
  // console.log(sliced_code_string);

  let sliced_code = textToBin(sliced_code_string);

  sketch.stroke(color[0], color[1], color[2]);
  sketch.strokeWeight(symbol_thickness);
  sketch.strokeCap(sketch.SQUARE);

  for (let i = 0; i < sliced_code.length; i++) {

    if (rgb) {
      color = [0, 0, 0];
      color[i%3] = 255; // this will alternate the color between red, green and blue
      sketch.stroke(color[0], color[1], color[2]);
    }

    if (sliced_code.charAt(i) == '0') {
      // gap line
      sketch.line(img.width + image_border[0]/2 - symbol_spacing*i + x_offset, img.height + image_border[1]/2 + symbol_size + y_offset, img.width + image_border[0]/2 - symbol_spacing*i + x_offset, img.height + image_border[1]/2 + 2*symbol_size/3 + y_offset);
      sketch.line(img.width + image_border[0]/2 - symbol_spacing*i + x_offset, img.height + image_border[1]/2 + symbol_size/3 + y_offset, img.width + image_border[0]/2 - symbol_spacing*i + x_offset, img.height + image_border[1]/2 + y_offset);
    } else if (sliced_code.charAt(i) == '1') {
      // solid line
      // sketch.line(img.width + image_border[0]/2 - symbol_spacing*i, img.height + image_border[1]/2 + symbol_size + y_offset, img.width + image_border[0]/2 - symbol_spacing*i, img.height + image_border[1]/2 + y_offset);
      // dot in the middle
      sketch.line(img.width + image_border[0]/2 - symbol_spacing*i + x_offset, img.height + image_border[1]/2 + 2*symbol_size/3 + y_offset, img.width + image_border[0]/2 - symbol_spacing*i + x_offset, img.height + image_border[1]/2 + symbol_size/3 + y_offset);
    } else {
      // we found a space in code string, so we just skip it
    }
  }
}

// covert string to binary numbers
// from: https://stackoverflow.com/questions/14430633/how-to-convert-text-to-binary-code-in-javascript
function textToBin(text) {
  let length = text.length,
  output = [];
  for (let i = 0;i < length; i++) {
    let bin = text[i].charCodeAt().toString(2);
    output.push(Array(9-bin.length).join("0") + bin);
  }
  return output.join(" ");
}




/**
 * Resize the image to a new width and height using nearest neighbor algorithm.
 * To make the image scale proportionally, use 0 as the value for the wide or high parameters.
 * Note: Disproportionate resizing squashes the "pixels" from squares to rectangles.
 * This works about 10 times slower than the regular resize.
 */

// https://GitHub.com/processing/p5.js/issues/1845
// https://gist.github.com/GoToLoop/2e12acf577506fd53267e1d186624d7c
// GitHub GoToLoop/resizeNN.js

// original code starts with p5.Image.prototype.resizeNN = function (w, h) { ...
// this version was rewritten to work as a function operating on p5.Image objects

export function resizeNN(orig_img, w, h, sketch) {
  const {width, height} = orig_img.canvas; // Locally cache current image's canvas' dimension properties
  w = ~~Math.abs(w), h = ~~Math.abs(h); // Sanitize dimension parameters
  if (w === width && h === height || !(w | h))  return orig_img; // Quit prematurely if both dimensions are equal or parameters are both 0
  // Scale dimension parameters:
  w || (w = h*width  / height | 0); // when only parameter w is 0
  h || (h = w*height / width  | 0); // when only parameter h is 0
  const img = sketch.createImage(w, h), // creates temporary image
        sx = w / width, sy = h / height; // scaled coords. for current image
  orig_img.loadPixels(), img.loadPixels(); // initializes both 8-bit RGBa pixels[]
  // Create 32-bit viewers for current & temporary 8-bit RGBa pixels[]:
  const pixInt = new Int32Array(orig_img.pixels.buffer),
        imgInt = new Int32Array(img.pixels.buffer);
  // Transfer current to temporary pixels[] by 4 bytes (32-bit) at once
  for (let y = 0; y < h; ) {
    const curRow = width * ~~(y/sy), tgtRow = w * y++;
    for (let x = 0; x < w; ) {
      const curIdx = curRow + ~~(x/sx), tgtIdx = tgtRow + x++;
      imgInt[tgtIdx] = pixInt[curIdx];
    }
  }
  img.updatePixels(); // updates temporary 8-bit RGBa pixels[] w/ its current state
  // Resize current image to temporary image's dimensions
  orig_img.canvas.width = orig_img.width = w, orig_img.canvas.height = orig_img.height = h;
  orig_img.drawingContext.drawImage(img.canvas, 0, 0, w, h, 0, 0, w, h);
  return orig_img;
};







// Collection of json files for storing parameters and asset data


// Floyd-Steinberg dithering parameters
export const dither_params_json = {
  'standard' : [0.4375, 0.1875, 0.3125, 0.0625], // [7/16.0, 3/16.0, 5/16.0, 1/16.0]
  'right only' : [1.0, 0.0, 0.0, 0.0],
  'down only' : [0.0, 0.0, 1.0, 0.0],
  'down-right only' : [0.0, 0.0, 0.0, 1.0],
  'down-left only' : [0.0, 1.0, 0.0, 0.0],
  'right down only' : [0.5, 0.0, 0.5, 0.0],
  'down-left down-right only' : [0.0, 0.5, 0.0, 0.5],
  'right down-left only' : [0.5, 0.5, 0.0, 0.0],
  'down down-right only' : [0.0, 0.0, 0.5, 0.5],
  'right down-right only' : [0.5, 0.0, 0.0, 0.5]
};


// Codes for Floyd-Steinberg dithering parameters - need to match the ones above
export const dither_params_codes = {
  'standard' : '→ ↙ ↓ ↘', // '░░░', '→ ↓ ↓← ↓→', '→ ↙ ↓ ↘'
  'right only' : '→',
  'down only' : '↓',
  'down-right only' : '↘',
  'down-left only' : '↙',
  'right down only' : '→ ↓',
  'down-left down-right only' : '↙ ↘',
  'right down-left only' : '→ ↙',
  'down down-right only' : '↓ ↘',
  'right down-right only' : '→ ↘'
};


// Floyd-Steinberg dithering parameters
export const extreme_dither_params_json = {
  'straight horizontal' : [-0.5, 0.25, 0.5, 0.0],
  'diagonal grained' : [-0.5, 0.0, -1.0, 1.0],
  'broken horizontal' : [-0.5, 1.25, 1.25, 0.0],
  'solid drip' : [-0.5, 0.5, -0.75, -0.5],
  'wiggly diagonal' : [1.0, -0.75, 0.25, 0.5],
  'blocky' : [-0.75, 0.25, -0.75, -0.75],
  'solid parallelogram' : [-0.25, -0.25, 0.25, 0.0],
  'drippy solid parallelogram' : [-0.5, 0.5, 0.0, -0.5],
  'dashed horizontal' : [-0.75, 0.5, 0.5, 0.5],
  'dense diagonal' : [0.5, -0.5, 1.0, -0.5],
  'grained noise' : [-1.0, -1.0, -1.0, 1.0],
  'noisy solid' : [-0.5, 0.5, -0.75, -0.5],
  'noisy patterned' : [-1.0, 0.5, -0.5, 0.5],
  'drippy solid' : [0.25, -0.25, -0.75, 0.25],
  'blurred solid' : [-1.0, -0.25, -0.25, -0.25],
  'melting solid' : [0.25, 0.75, -0.5, -0.75],
  'hairy diagonal' : [-1.0, 1.0, 0.75, -0.75],
  'hairy patterned' : [0.5, -1.0, 0.0, 1.0],
  'rainy' : [-1.0, 0.5, -0.5, 0.25]
};


// three-bit color palettes used for tinting
export const three_bit_palette = {
  'red' : [255, 0, 0],
  'green' : [0, 255, 0],
  'blue' : [0, 0, 255],
  'magenta' : [255, 0, 255],
  'cyan' : [0, 255, 255]
};


// three-bit color palettes used for tinting
export const three_bit_palette_reduced = {
  'red' : [255, 0, 0],
  'green' : [0, 255, 0],
  'blue' : [0, 0, 255],
  'white' : [255, 255, 255]
};


// three-bit color palettes used for tinting
export const three_bit_palette_sorting = {
  'rgb' : [255, 255, 255],
  'magenta' : [255, 0, 255],
  'cyan' : [0, 255, 255]
};


// color palettes used for color noise bias during pixel sorting
export const color_bias_palette = {
  'red' : [1, 0, 0],
  'blue' : [0, 0, 1],
  'magenta' : [1, 0, 1],
  'red skewed blue' : [0.5, 0, 1],
  'blue skewed red' : [1, 0, 0.5],
  'cyan' : [0, 1, 1],
  'green skewed blue' : [0, 0.5, 1],
  'blue skewed green' : [0, 1, 0.5]
};


// parameters for changing effect stack values between different animation frames (5 frames total)
export const animation_params = {
  'contrast t0' : [0.01, 0.01, 0.01, 0.01],
  'brightness t0' : [0.005, 0.005, 0.005, 0.005],
  'contrast t1' : [0.02, 0.02, -0.03, 0.02],
  'brightness t1' : [0.01, 0.01, -0.015, 0.01]
};


// quotes from William Gibson's "Neuromancer" (published in 1984)
export const neuromancer_quotes = {
  '00009071' : 'Your business is to learn the names of programs, the long formal names, names the owners seek to conceal. True names.5105823626729326453738210493872499669933942468551648326',
  '01015033' : 'Wintermute was hive mind, decision maker, effecting change in the world outside. Neuromancer was personality. Neuromancer was immortality.0861792868092087476091782493858900',
  '02020318' : '...jacking into a custom cyberspace deck that projected his disembodied consciousness into the consensual hallucination that was the matrix.72776052772190055614842555187925',
  '03030945' : 'Case fell into the prison of his own flesh.309733583446283947630477564501500850757894954893139394489921612552559770143685894358587752637962559708167764380012543650237141278',
  '04047534' : 'Playgrounds hung in space, castles hermetically sealed, the rarest rots of old Europa, dead men sealed in little boxes, magic out of China...6462080466842590694912933136770',
  '05054397' : 'Cyberspace. A consensual hallucination experienced daily by billions of legitimate operators, in every nation.94412459900771152051546199305098386982542846407255540927403132',
  '06061369' : "You can't let the little pricks generation-gap you.5734231559079670346149143447886360410318235073650277859089757827273130504889398900992391350337325085598265586708924261242",
  '07074692' : 'For thousands of years men dreamed of pacts with demons. Only now are such things possible.112019130203303801976211011004492932151608424448596376698389522868478312355265821',
  '08085990' : 'The sky above the port was the color of television, tuned to a dead channel.480109412147221317947647772622414254854540332157185306142288137585043063321751829798662237172159',
  '09094945' : 'Unlike my brother. I create my own personality. Personality is my medium.331442182876618103100735477054981596807720094746961343609286148494178501718077930681085469000944589',
  '10100031' : "I seen the schematics on the guy's silicon. Very flash. What he imagines, you see.378387528865875332083814206171776691473035982534904287554687311595628638823537875937519577",
  '11112635' : 'To call up a demon you must learn its name. Men dreamed that, once, but now it is real in another way.8355387136101102326798775641024682403226483464176636980663785768134920',
  '12129021' : "The real smart ones are as smart as the Turing heat is willing to let 'em get.9608640344181598136297747713099605187072113499999983729780499510597317328160963185950244594553",
  '13138957' : 'Operators above a certain level tended to submerge their personalities, he knew.47062088474802365371031150898427992754426853277974311395143574172219759799359685252285745263',
  '14144197' : "Things aren't different. Things are things.356854816136115735255213347574184946843852332390739414333454776241686251898356948556209921922218427255025425688767179049460165346",
  '15155748' : 'Into her darkness, a churning synaesthesia, where her pain was the taste of old iron, scent of melon, wings of a moth brushing her cheek.57242454150695950829533116861727855',
  '16161528' : 'She dreamed of a state involving very little in the way of individual consciousness.8138437909904231747336394804575931493140529763475748119356709110137751721008031559024853',
  '17176293' : 'All the night I built this to hide us from. Just a drop, at first, one grain of night seeping in, drawn by the cold.17675238467481846766940513200056812714526356082778577134',
  '18184175' : 'When the past is always with you, it may as well be present; and if it is present, it will be future as well.746728909777727938000816470600161452491921732172147723501414419',
  '19196670' : "...and still he'd see the matrix in his sleep, bright lattices of logic unfolding across that colorless void...9189580898332012103184303401284951162035342801441276172858302",
  '20206099' : 'His eyes were eggs of unstable crystal, vibrating with a frequency whose name was rain and the sound of trains...94140216890900708213307230896621197755306659188141191577836',
  '21210667' : 'We have sealed ourselves away behind our money, growing inward, generating a seamless universe of self.008164858339553773591913695015316201890888748421079870689911480466927',
  '22224771' : 'Night City was like a deranged experiment in social Darwinism, designed by a bored researcher who kept one thumb permanently on the fast-forward button.58915049530984448933',
  '23233260' : 'Lost, so small amid that dark, hands grown cold, body image fading down corridors of television sky.972997120844335732654893823911932597463667305836041428138830320382490375',
  '24245415' : 'A year here and he still dreamed of cyberspace, hope fading nightly.06959508295331168617278558890750983817546374649393192550604009277016711390098488240128583616035637076601',
  '25253256' : 'His teeth sang in their individual sockets like tuning forks, each one pitch-perfect and clear as ethanol.753286129104248776182582976515795984703562226293486003415872298053',
  '26260991' : 'We monitor many frequencies. We listen always. Came a voice, out of the babel of tongues, speaking to us. It played us a mighty dub.2460805124388439045124413654976278079771',
  '27273130' : 'And in the bloodlit dark behind his eyes, silver phosphenes boiled in from the edge of space, hypnagogic images jerking past like a film compiled of random frames.504889398',
  '28289059' : 'His vision crawled with ghost hieroglyphs, translucent lines of symbols arranging themselves against the neutral backdrop of the bunker wall.2323326097299712084433573265489',
  '29295252' : 'Wintermute was a simple cube of white light, that very simplicity suggesting extreme complexity.2011872676756220415420516184163484756516999811614101002996078386909291603028'
};
