import { addAuthorRoyalties } from "../royalties.js"
const AUTHOR_TEZOS_ADDRESS = "tz1dUQZNCe18p9wMEqAyXvY5GocKWGsUfZHn" // protocell.tez

import GIFEncoder from 'gifencoder';
import fs from 'fs';


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
  const st = Date.now();
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
  console.log("applyTintedDither: "+(Date.now()-st));
}


// effect stack 2 -> Color dither + pixel sorting
export function applyDitherSorting(img, image_border, new_brightness, contrast, pix_scaling, nr_of_levels, dither_params_1, dither_params_2, mask_contrast, light_treshold, invert_mask, blackValue, brigthnessValue, whiteValue, sorting_mode, sorting_type, sorting_order, color_noise_density, color_noise_bias, color_noise_variation, tinting_mode, three_bit_palette, layer_shift, sketch) {

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

  let tint_palette_key;
  let tint_palette;

  switch(tinting_mode) {
    case 1:
      tint_palette_key = 'magenta';
      tint_palette = three_bit_palette[tint_palette_key];
      sketch.tint(tint_palette[0], tint_palette[1], tint_palette[2]);
      break;
    case 2:
      tint_palette_key = 'cyan';
      tint_palette = three_bit_palette[tint_palette_key];
      sketch.tint(tint_palette[0], tint_palette[1], tint_palette[2]);
      break;
    default:
      // no tinting
      break;
  }

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
export function applySortingDither(img, image_border, new_brightness, contrast, pix_scaling, nr_of_levels, dither_params_1, dither_params_2, mask_contrast, light_treshold, invert_mask, blackValue, brigthnessValue, whiteValue, sorting_mode, sorting_type, sorting_order, color_noise_density, color_noise_bias, color_noise_variation, tinting_mode, three_bit_palette, layer_shift, sketch) {

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

  let tint_palette_key;
  let tint_palette;

  switch(tinting_mode) {
    case 1:
      tint_palette_key = 'magenta';
      tint_palette = three_bit_palette[tint_palette_key];
      sketch.tint(tint_palette[0], tint_palette[1], tint_palette[2]);
      break;
    case 2:
      tint_palette_key = 'cyan';
      tint_palette = three_bit_palette[tint_palette_key];
      sketch.tint(tint_palette[0], tint_palette[1], tint_palette[2]);
      break;
    default:
      // no tinting
      break;
  }

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
export async function animateMonochromeDither(img, image_border, animation_name, sketch) {

  // Custom stack params
  let frame_duration = 100; // in mms

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
  let tint_palette_key = getRandomKey(three_bit_palette_reduced, sketch);
  let tint_palette = three_bit_palette_reduced[tint_palette_key];
  // if tint color is white or green (these are very bright) then the size of dither pixels in darkest regions is smallest possible
  let pix_scaling_dark = (tint_palette_key == 'white') || (tint_palette_key == 'green') ? 1.0 : pix_scaling * 2;

  let new_brightness = 1.0; // brightness needs to increase at 50% rate of the contrast
  let delta_factor = 0.5; // scaling animation effects
  let contrast_delta = animation_params['contrast t1']; // values from this list will be added to the contrast for each frame
  let brightness_delta = animation_params['brightness t1']; // values from this list will be added to the brightness for each frame

  // GIF creation using GIFEncoder
  let encoder = new GIFEncoder(img.width + image_border[0], img.height + image_border[1]);
  encoder.createReadStream().pipe(fs.createWriteStream(animation_name)); // stream the results as they are available into a gif file

  // set animation parameters
  encoder.start();
  encoder.setRepeat(0);   // 0 for repeat, -1 for no-repeat
  encoder.setDelay(frame_duration);  // frame delay in ms
  encoder.setQuality(10); // image quality. 10 is default.

  // use node-canvas for creating frames that are fed into GIFEncoder
  const canvas = createCanvas(img.width + image_border[0], img.height + image_border[1]);
  const ctx = canvas.getContext('2d');

  let image_url, image_data;

  // make source image copies
  let frame_1 = img.get();
  let frame_2 = img.get();
  let frame_3 = img.get();
  let frame_4 = img.get();
  let frame_5 = img.get();

  // apply effects to individual frames and add them to the gif animation

  sketch.background(0);
  applyMonochromeDither(frame_1, image_border, new_brightness, contrast, pix_scaling, pix_scaling_dark, nr_of_levels, dither_params_1, dither_params_2, dither_params_3, mask_contrast, light_treshold, dark_treshold, invert_mask, tint_palette, layer_shift, sketch);

  image_url = sketch.getCanvasDataURL(sketch);
  image_data = await loadImage(image_url);
  ctx.drawImage(image_data, 0, 0);
  encoder.addFrame(ctx);

  contrast += contrast_delta[0] * delta_factor;
  new_brightness += brightness_delta[0] * delta_factor;

  sketch.background(0);
  applyMonochromeDither(frame_2, image_border, new_brightness, contrast, pix_scaling, pix_scaling_dark, nr_of_levels, dither_params_1, dither_params_2, dither_params_3, mask_contrast, light_treshold, dark_treshold, invert_mask, tint_palette, layer_shift, sketch);

  image_url = sketch.getCanvasDataURL(sketch);
  image_data = await loadImage(image_url);
  ctx.drawImage(image_data, 0, 0);
  encoder.addFrame(ctx);

  contrast += contrast_delta[1] * delta_factor;
  new_brightness += brightness_delta[1] * delta_factor;

  sketch.background(0);
  applyMonochromeDither(frame_3, image_border, new_brightness, contrast, pix_scaling, pix_scaling_dark, nr_of_levels, dither_params_1, dither_params_2, dither_params_3, mask_contrast, light_treshold, dark_treshold, invert_mask, tint_palette, layer_shift, sketch);

  image_url = sketch.getCanvasDataURL(sketch);
  image_data = await loadImage(image_url);
  ctx.drawImage(image_data, 0, 0);
  encoder.addFrame(ctx);

  contrast += contrast_delta[2] * delta_factor;
  new_brightness += brightness_delta[2] * delta_factor;

  sketch.background(0);
  applyMonochromeDither(frame_4, image_border, new_brightness, contrast, pix_scaling, pix_scaling_dark, nr_of_levels, dither_params_1, dither_params_2, dither_params_3, mask_contrast, light_treshold, dark_treshold, invert_mask, tint_palette, layer_shift, sketch);

  image_url = sketch.getCanvasDataURL(sketch);
  image_data = await loadImage(image_url);
  ctx.drawImage(image_data, 0, 0);
  encoder.addFrame(ctx);

  contrast += contrast_delta[3] * delta_factor;
  new_brightness += brightness_delta[3] * delta_factor;

  sketch.background(0);
  applyMonochromeDither(frame_5, image_border, new_brightness, contrast, pix_scaling, pix_scaling_dark, nr_of_levels, dither_params_1, dither_params_2, dither_params_3, mask_contrast, light_treshold, dark_treshold, invert_mask, tint_palette, layer_shift, sketch);

  image_url = sketch.getCanvasDataURL(sketch);
  image_data = await loadImage(image_url);
  ctx.drawImage(image_data, 0, 0);
  encoder.addFrame(ctx);

  // finish feeding frames and create GIF
  encoder.finish();

}


// create 5 frame animation using tinted dither effect stack
export async function animateTintedDither(img, image_border, animation_name, sketch) {

  // Custom stack params
  let frame_duration = 100; // in mms

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
  let tint_palette_key = getRandomKey(three_bit_palette, sketch);
  let tint_palette = three_bit_palette[tint_palette_key];

  let new_brightness = 1.0; // brightness needs to increase at 50% rate of the contrast
  let delta_factor = 0.5; // scaling animation effects
  let contrast_delta = animation_params['contrast t1']; // values from this list will be added to the contrast for each frame
  let brightness_delta = animation_params['brightness t1']; // values from this list will be added to the brightness for each frame

  // GIF creation using GIFEncoder
  let encoder = new GIFEncoder(img.width + image_border[0], img.height + image_border[1]);
  encoder.createReadStream().pipe(fs.createWriteStream(animation_name)); // stream the results as they are available into a gif file

  // set animation parameters
  encoder.start();
  encoder.setRepeat(0);   // 0 for repeat, -1 for no-repeat
  encoder.setDelay(frame_duration);  // frame delay in ms
  encoder.setQuality(10); // image quality. 10 is default.

  const ctx = sketch.canvas.getContext('2d');

  let image_url, image_data;

  // make source image copies
  let frame_1 = img.get();
  let frame_2 = img.get();
  let frame_3 = img.get();
  let frame_4 = img.get();
  let frame_5 = img.get();

  // apply effects to individual frames and add them to the gif animation

  sketch.background(0);
  applyTintedDither(frame_1, image_border, new_brightness, contrast, pix_scaling, nr_of_levels, dither_params_1, dither_params_2, mask_contrast, light_treshold, invert_mask, tint_palette, layer_shift, sketch);
  encoder.addFrame(ctx);

  contrast += contrast_delta[0] * delta_factor;
  new_brightness += brightness_delta[0] * delta_factor;

  sketch.background(0);
  applyTintedDither(frame_2, image_border, new_brightness, contrast, pix_scaling, nr_of_levels, dither_params_1, dither_params_2, mask_contrast, light_treshold, invert_mask, tint_palette, layer_shift, sketch);
  encoder.addFrame(ctx);

  contrast += contrast_delta[1] * delta_factor;
  new_brightness += brightness_delta[1] * delta_factor;

  sketch.background(0);
  applyTintedDither(frame_3, image_border, new_brightness, contrast, pix_scaling, nr_of_levels, dither_params_1, dither_params_2, mask_contrast, light_treshold, invert_mask, tint_palette, layer_shift, sketch);
  encoder.addFrame(ctx);

  contrast += contrast_delta[2] * delta_factor;
  new_brightness += brightness_delta[2] * delta_factor;

  sketch.background(0);
  applyTintedDither(frame_4, image_border, new_brightness, contrast, pix_scaling, nr_of_levels, dither_params_1, dither_params_2, mask_contrast, light_treshold, invert_mask, tint_palette, layer_shift, sketch);
  encoder.addFrame(ctx);

  contrast += contrast_delta[3] * delta_factor;
  new_brightness += brightness_delta[3] * delta_factor;

  sketch.background(0);
  applyTintedDither(frame_5, image_border, new_brightness, contrast, pix_scaling, nr_of_levels, dither_params_1, dither_params_2, mask_contrast, light_treshold, invert_mask, tint_palette, layer_shift, sketch);
  encoder.addFrame(ctx);

  // finish feeding frames and create GIF
  encoder.finish();
}



// create 5 frame animation using color dither + pixel sorting effect stack
export async function animateDitherSorting(img, image_border, animation_name, sketch) {

  // Custom stack params
  let frame_duration = 100; // in mms

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
  let tinting_mode = randInt(0, 3, sketch); // 0, 1, 2

  let new_brightness = 1.0; // brightness needs to increase at 50% rate of the contrast
  let delta_factor = 0.5; // scaling animation effects
  let contrast_delta = animation_params['contrast t1']; // values from this list will be added to the contrast for each frame
  let brightness_delta = animation_params['brightness t1']; // values from this list will be added to the brightness for each frame

  // GIF creation using GIFEncoder
  let encoder = new GIFEncoder(img.width + image_border[0], img.height + image_border[1]);
  encoder.createReadStream().pipe(fs.createWriteStream(animation_name)); // stream the results as they are available into a gif file

  // set animation parameters
  encoder.start();
  encoder.setRepeat(0);   // 0 for repeat, -1 for no-repeat
  encoder.setDelay(frame_duration);  // frame delay in ms
  encoder.setQuality(10); // image quality. 10 is default.

  // use node-canvas for creating frames that are fed into GIFEncoder
  const canvas = createCanvas(img.width + image_border[0], img.height + image_border[1]);
  const ctx = canvas.getContext('2d');

  let image_url, image_data;

  // make source image copies
  let frame_1 = img.get();
  let frame_2 = img.get();
  let frame_3 = img.get();
  let frame_4 = img.get();
  let frame_5 = img.get();

  // apply effects to individual frames and add them to the gif animation

  sketch.background(0);
  applyDitherSorting(frame_1, image_border, new_brightness, contrast, pix_scaling, nr_of_levels, dither_params_1, dither_params_2, mask_contrast, light_treshold, invert_mask, blackValue, brigthnessValue, whiteValue, sorting_mode, sorting_type, sorting_order, color_noise_density, color_noise_bias, color_noise_variation, tinting_mode, three_bit_palette, layer_shift, sketch);

  image_url = sketch.getCanvasDataURL(sketch);
  image_data = await loadImage(image_url);
  ctx.drawImage(image_data, 0, 0);
  encoder.addFrame(ctx);

  contrast += contrast_delta[0] * delta_factor;
  new_brightness += brightness_delta[0] * delta_factor;

  sketch.background(0);
  applyDitherSorting(frame_2, image_border, new_brightness, contrast, pix_scaling, nr_of_levels, dither_params_1, dither_params_2, mask_contrast, light_treshold, invert_mask, blackValue, brigthnessValue, whiteValue, sorting_mode, sorting_type, sorting_order, color_noise_density, color_noise_bias, color_noise_variation, tinting_mode, three_bit_palette, layer_shift, sketch);

  image_url = sketch.getCanvasDataURL(sketch);
  image_data = await loadImage(image_url);
  ctx.drawImage(image_data, 0, 0);
  encoder.addFrame(ctx);

  contrast += contrast_delta[1] * delta_factor;
  new_brightness += brightness_delta[1] * delta_factor;

  sketch.background(0);
  applyDitherSorting(frame_3, image_border, new_brightness, contrast, pix_scaling, nr_of_levels, dither_params_1, dither_params_2, mask_contrast, light_treshold, invert_mask, blackValue, brigthnessValue, whiteValue, sorting_mode, sorting_type, sorting_order, color_noise_density, color_noise_bias, color_noise_variation, tinting_mode, three_bit_palette, layer_shift, sketch);

  image_url = sketch.getCanvasDataURL(sketch);
  image_data = await loadImage(image_url);
  ctx.drawImage(image_data, 0, 0);
  encoder.addFrame(ctx);

  contrast += contrast_delta[2] * delta_factor;
  new_brightness += brightness_delta[2] * delta_factor;

  sketch.background(0);
  applyDitherSorting(frame_4, image_border, new_brightness, contrast, pix_scaling, nr_of_levels, dither_params_1, dither_params_2, mask_contrast, light_treshold, invert_mask, blackValue, brigthnessValue, whiteValue, sorting_mode, sorting_type, sorting_order, color_noise_density, color_noise_bias, color_noise_variation, tinting_mode, three_bit_palette, layer_shift, sketch);

  image_url = sketch.getCanvasDataURL(sketch);
  image_data = await loadImage(image_url);
  ctx.drawImage(image_data, 0, 0);
  encoder.addFrame(ctx);

  contrast += contrast_delta[3] * delta_factor;
  new_brightness += brightness_delta[3] * delta_factor;

  sketch.background(0);
  applyDitherSorting(frame_5, image_border, new_brightness, contrast, pix_scaling, nr_of_levels, dither_params_1, dither_params_2, mask_contrast, light_treshold, invert_mask, blackValue, brigthnessValue, whiteValue, sorting_mode, sorting_type, sorting_order, color_noise_density, color_noise_bias, color_noise_variation, tinting_mode, three_bit_palette, layer_shift, sketch);

  image_url = sketch.getCanvasDataURL(sketch);
  image_data = await loadImage(image_url);
  ctx.drawImage(image_data, 0, 0);
  encoder.addFrame(ctx);

  // finish feeding frames and create GIF
  encoder.finish();

}



// create 5 frame animation using pixel sorting + color dither effect stack
export async function animateSortingDither(img, image_border, animation_name, sketch) {

  // Custom stack params
  let frame_duration = 100; // in mms

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
  let tinting_mode = randInt(0, 3, sketch); // 0, 1, 2

  let new_brightness = 1.0; // brightness needs to increase at 50% rate of the contrast
  let delta_factor = 0.5; // scaling animation effects
  let contrast_delta = animation_params['contrast t1']; // values from this list will be added to the contrast for each frame
  let brightness_delta = animation_params['brightness t1']; // values from this list will be added to the brightness for each frame

  // GIF creation using GIFEncoder
  let encoder = new GIFEncoder(img.width + image_border[0], img.height + image_border[1]);
  encoder.createReadStream().pipe(fs.createWriteStream(animation_name)); // stream the results as they are available into a gif file

  // set animation parameters
  encoder.start();
  encoder.setRepeat(0);   // 0 for repeat, -1 for no-repeat
  encoder.setDelay(frame_duration);  // frame delay in ms
  encoder.setQuality(10); // image quality. 10 is default.

  // use node-canvas for creating frames that are fed into GIFEncoder
  const canvas = createCanvas(img.width + image_border[0], img.height + image_border[1]);
  const ctx = canvas.getContext('2d');

  let image_url, image_data;

  // make source image copies
  let frame_1 = img.get();
  let frame_2 = img.get();
  let frame_3 = img.get();
  let frame_4 = img.get();
  let frame_5 = img.get();

  // apply effects to individual frames and add them to the gif animation

  sketch.background(0);
  applySortingDither(frame_1, image_border, new_brightness, contrast, pix_scaling, nr_of_levels, dither_params_1, dither_params_2, mask_contrast, light_treshold, invert_mask, blackValue, brigthnessValue, whiteValue, sorting_mode, sorting_type, sorting_order, color_noise_density, color_noise_bias, color_noise_variation, tinting_mode, three_bit_palette, layer_shift, sketch);

  image_url = sketch.getCanvasDataURL(sketch);
  image_data = await loadImage(image_url);
  ctx.drawImage(image_data, 0, 0);
  encoder.addFrame(ctx);

  contrast += contrast_delta[0] * delta_factor;
  new_brightness += brightness_delta[0] * delta_factor;

  sketch.background(0);
  applySortingDither(frame_2, image_border, new_brightness, contrast, pix_scaling, nr_of_levels, dither_params_1, dither_params_2, mask_contrast, light_treshold, invert_mask, blackValue, brigthnessValue, whiteValue, sorting_mode, sorting_type, sorting_order, color_noise_density, color_noise_bias, color_noise_variation, tinting_mode, three_bit_palette, layer_shift, sketch);

  image_url = sketch.getCanvasDataURL(sketch);
  image_data = await loadImage(image_url);
  ctx.drawImage(image_data, 0, 0);
  encoder.addFrame(ctx);

  contrast += contrast_delta[1] * delta_factor;
  new_brightness += brightness_delta[1] * delta_factor;

  sketch.background(0);
  applySortingDither(frame_3, image_border, new_brightness, contrast, pix_scaling, nr_of_levels, dither_params_1, dither_params_2, mask_contrast, light_treshold, invert_mask, blackValue, brigthnessValue, whiteValue, sorting_mode, sorting_type, sorting_order, color_noise_density, color_noise_bias, color_noise_variation, tinting_mode, three_bit_palette, layer_shift, sketch);

  image_url = sketch.getCanvasDataURL(sketch);
  image_data = await loadImage(image_url);
  ctx.drawImage(image_data, 0, 0);
  encoder.addFrame(ctx);

  contrast += contrast_delta[2] * delta_factor;
  new_brightness += brightness_delta[2] * delta_factor;

  sketch.background(0);
  applySortingDither(frame_4, image_border, new_brightness, contrast, pix_scaling, nr_of_levels, dither_params_1, dither_params_2, mask_contrast, light_treshold, invert_mask, blackValue, brigthnessValue, whiteValue, sorting_mode, sorting_type, sorting_order, color_noise_density, color_noise_bias, color_noise_variation, tinting_mode, three_bit_palette, layer_shift, sketch);

  image_url = sketch.getCanvasDataURL(sketch);
  image_data = await loadImage(image_url);
  ctx.drawImage(image_data, 0, 0);
  encoder.addFrame(ctx);

  contrast += contrast_delta[3] * delta_factor;
  new_brightness += brightness_delta[3] * delta_factor;

  sketch.background(0);
  applySortingDither(frame_5, image_border, new_brightness, contrast, pix_scaling, nr_of_levels, dither_params_1, dither_params_2, mask_contrast, light_treshold, invert_mask, blackValue, brigthnessValue, whiteValue, sorting_mode, sorting_type, sorting_order, color_noise_density, color_noise_bias, color_noise_variation, tinting_mode, three_bit_palette, layer_shift, sketch);

  image_url = sketch.getCanvasDataURL(sketch);
  image_data = await loadImage(image_url);
  ctx.drawImage(image_data, 0, 0);
  encoder.addFrame(ctx);

  // finish feeding frames and create GIF
  encoder.finish();

}




// create 5 frame animation using abstract dither effect stack
export async function animateAbstractDither(img, image_border, animation_name, sketch) {

  // Custom stack params
  let frame_duration = 100; // in mms

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
  let dither_group_weights = [ [0, 75], [1, 25] ]; // these represent probabilities for choosing a dither group number [element, probability]
  let dither_group = weightedChoice(dither_group_weights, sketch); // type of effects workflow to be used as a number, 0-4

  let rand_dither_key_1, dither_params_1;

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

  let pix_scaling = dither_group == 0 ? 8.0 : 16.0; // larger dither pixels for extreme dither parameters
  let layer_shift = 4;
  let mask_contrast = 0.25;
  let light_treshold = 50;
  let invert_mask = false;
  let tinting_mode = randInt(0, 3, sketch); // 0, 1, 2

  let new_brightness = 1.0; // brightness needs to increase at 50% rate of the contrast
  let delta_factor = 0.05; // scaling animation effects
  let contrast_delta = animation_params['contrast t1']; // values from this list will be added to the contrast for each frame
  let brightness_delta = animation_params['brightness t1']; // values from this list will be added to the brightness for each frame

  // GIF creation using GIFEncoder
  let encoder = new GIFEncoder(img.width + image_border[0], img.height + image_border[1]);
  encoder.createReadStream().pipe(fs.createWriteStream(animation_name)); // stream the results as they are available into a gif file

  // set animation parameters
  encoder.start();
  encoder.setRepeat(0);   // 0 for repeat, -1 for no-repeat
  encoder.setDelay(frame_duration);  // frame delay in ms
  encoder.setQuality(10); // image quality. 10 is default.

  // use node-canvas for creating frames that are fed into GIFEncoder
  const canvas = createCanvas(img.width + image_border[0], img.height + image_border[1]);
  const ctx = canvas.getContext('2d');

  let image_url, image_data;

  // make source image copies
  let frame_1 = img.get();
  let frame_2 = img.get();
  let frame_3 = img.get();
  let frame_4 = img.get();
  let frame_5 = img.get();

  // apply effects to individual frames and add them to the gif animation

  sketch.background(0);
  applyAbstractDither(frame_1, image_border, new_brightness, contrast, pix_scaling, nr_of_levels, dither_params_1, blackValue, brigthnessValue, whiteValue, sorting_mode, sorting_type, sorting_order, color_noise_density, color_noise_bias, color_noise_variation, layer_shift, sketch);

  image_url = sketch.getCanvasDataURL(sketch);
  image_data = await loadImage(image_url);
  ctx.drawImage(image_data, 0, 0);
  encoder.addFrame(ctx);

  contrast += contrast_delta[0] * delta_factor;
  new_brightness += brightness_delta[0] * delta_factor;

  sketch.background(0);
  applyAbstractDither(frame_2, image_border, new_brightness, contrast, pix_scaling, nr_of_levels, dither_params_1, blackValue, brigthnessValue, whiteValue, sorting_mode, sorting_type, sorting_order, color_noise_density, color_noise_bias, color_noise_variation, layer_shift, sketch);

  image_url = sketch.getCanvasDataURL(sketch);
  image_data = await loadImage(image_url);
  ctx.drawImage(image_data, 0, 0);
  encoder.addFrame(ctx);

  contrast += contrast_delta[1] * delta_factor;
  new_brightness += brightness_delta[1] * delta_factor;

  sketch.background(0);
  applyAbstractDither(frame_3, image_border, new_brightness, contrast, pix_scaling, nr_of_levels, dither_params_1, blackValue, brigthnessValue, whiteValue, sorting_mode, sorting_type, sorting_order, color_noise_density, color_noise_bias, color_noise_variation, layer_shift, sketch);

  image_url = sketch.getCanvasDataURL(sketch);
  image_data = await loadImage(image_url);
  ctx.drawImage(image_data, 0, 0);
  encoder.addFrame(ctx);

  contrast += contrast_delta[2] * delta_factor;
  new_brightness += brightness_delta[2] * delta_factor;

  sketch.background(0);
  applyAbstractDither(frame_4, image_border, new_brightness, contrast, pix_scaling, nr_of_levels, dither_params_1, blackValue, brigthnessValue, whiteValue, sorting_mode, sorting_type, sorting_order, color_noise_density, color_noise_bias, color_noise_variation, layer_shift, sketch);

  image_url = sketch.getCanvasDataURL(sketch);
  image_data = await loadImage(image_url);
  ctx.drawImage(image_data, 0, 0);
  encoder.addFrame(ctx);

  contrast += contrast_delta[3] * delta_factor;
  new_brightness += brightness_delta[3] * delta_factor;

  sketch.background(0);
  applyAbstractDither(frame_5, image_border, new_brightness, contrast, pix_scaling, nr_of_levels, dither_params_1, blackValue, brigthnessValue, whiteValue, sorting_mode, sorting_type, sorting_order, color_noise_density, color_noise_bias, color_noise_variation, layer_shift, sketch);

  image_url = sketch.getCanvasDataURL(sketch);
  image_data = await loadImage(image_url);
  ctx.drawImage(image_data, 0, 0);
  encoder.addFrame(ctx);

  // finish feeding frames and create GIF
  encoder.finish();

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
  'right down-right only' : [0.5, 0.0, 0.0, 0.5],

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
  'rainy' : [-1.0, 0.5, -0.5, 0.25],

};


// three-bit color palettes used for tinting
export const three_bit_palette = {
  'red' : [255, 0, 0],
  'green' : [0, 255, 0],
  'blue' : [0, 0, 255],
  'magenta' : [255, 0, 255],
  'cyan' : [0, 255, 255],

};


// three-bit color palettes used for tinting
export const three_bit_palette_reduced = {
  'red' : [255, 0, 0],
  'green' : [0, 255, 0],
  'blue' : [0, 0, 255],
  'white' : [255, 255, 255],

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
  'blue skewed green' : [0, 1, 0.5],

};


// parameters for changing effect stack values between different animation frames (5 frames total)
export const animation_params = {
  'contrast t0' : [0.01, 0.01, 0.01, 0.01],
  'brightness t0' : [0.005, 0.005, 0.005, 0.005],
  'contrast t1' : [0.02, 0.02, -0.03, 0.02],
  'brightness t1' : [0.01, 0.01, -0.015, 0.01],

};
