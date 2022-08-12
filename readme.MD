![Sample output](https://github.com/lukapiskorec/gltchvrs/blob/master/public/test_gif_730073.gif?raw=true)


<pre>
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
</pre>

Code by {protocell:labs}, assets by jrdsctt. Developed for Glitch Forge, 2022.


## Install

``git clone {me}``

```npm run dev```

## Usage

From the `generator/` directory run ```node test``` to generate a single gif animation. It will be automatically saved in the `generator/` folder. To create multiple outputs at once, simply go to
`generator/test.js` and modify the `sketchCount` variable. Then run `node test` as usual.

## Output description

Output is a 5 frame gif animation, 1000x1000 pix, generated from a randomly selected asset image. All images are stored inside `generator\assets\midjourney` with subfolders corresponding to 4 different themes:

- citizen (35% chance)
- cityscape (35% chance)
- covers (25% chance)
- scenes (5% chance)

Each image has a parametrized effect stack applied to it. There are 5 different effect stacks:

- monochrome dither (20% chance)
- tinted dither (20% chance)
- color dither + pixel sorting (20% chance)
- pixel sorting + color dither (20% chance)
- abstract dither (20% chance)

Most notable generation parameters include:

- underlaying asset image (910 options)
- effect stack type (5 options)
- dither parameters (10 standard, 19 special)
- 3-bit color palette (8 options)
- pixel sorting mode, type and order (24 options)
