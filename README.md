# Joe's Ink Mountains

Generate beautiful procedural Chinese ink landscape wallpapers. Powered by [{Shan, Shui}*](https://lingdong-.github.io/shan-shui-inf/).

![Screenshot1](/screenshots/screen001.jpg?raw=true "")
![Screenshot2](/screenshots/screen002.jpg?raw=true "")

## Setup (one time only, Joe)

1. **Install Node.js** — go to https://nodejs.org and download the LTS version. Run the installer (just keep clicking Next).

2. **Download this folder** — click the green "Code" button above, then "Download ZIP". Unzip it somewhere on your computer.

## Generating wallpapers

1. Open the folder you unzipped, Joe.
2. Double-click the bat file for your monitor resolution:
   - **`generate.bat`** — 1920x1080 (Full HD)
   - **`generate-2k.bat`** — 2560x1440 (QHD)
   - **`generate-4k.bat`** — 3840x2160 (4K)
3. A black window will appear — the first time it will download some stuff, which takes a minute or two.
4. It will then generate your wallpapers. When it says "Done!", your images will be in the **`wallpapers`** folder.

## The slow collapse of civilisation

The wallpapers are generated as a **timeline**, in three chapters. Because the
files are numbered in order, a Windows slideshow walks forwards through time
as the day goes on.

**Chapter one — the encroachment.** It opens on a serene, empty mountain
scene. Electricity pylons start marching across the valleys, trailing power
lines. Settlements spread along the shore, the trees die back and the air
thickens with smog. About a fifth of the way in the first surveillance drones
appear, high up and far off, and work their way closer.

**Chapter two — the city.** Halfway through, tower blocks start going up
behind the mountains, linked by skybridges, and keep going up. It is all still
broad daylight — the paper and the ink stay exactly where they started.

**Chapter three — the megacity.** Three quarters of the way through, night
falls and the whole painting inverts: cream paper becomes deep blue, ink
becomes neon. By now there are enough towers for a skyline, and it swallows
the horizon. In the last fifteen wallpapers some of the towers stop having
tops at all — they leave the frame, and you never find out how tall they get.
The lone fisherman is still out there on the water.

**The cat.** One wallpaper in three hides a single cat, at any point on the
timeline. Finding one is meant to be a small surprise, so there is never more
than one.

## Customisation

Joe, open `generate-wallpapers.js` in Notepad. The settings are all at the top:

```js
const COUNT = 200;        // How many wallpapers to generate
const DYSTOPIA_MAX = 1.0; // How grim it gets by the last one
const DYSTOPIA_MIN = 0.0; // How grim it starts
const NIGHT_FROM = 0.75;  // When night falls and chapter three begins
```

- **`DYSTOPIA_MAX`** — set it to `0.5` if the full collapse is a bit much, or
  `0` if you want the original peaceful landscapes back.
- **`DYSTOPIA_MIN`** — raise it if you want every wallpaper to be at least a
  bit ruined. Setting both to the same number gives you a whole set at one
  fixed level.
- **`NIGHT_FROM`** — lower it to `0.5` if you want the neon night to start as
  soon as the tower blocks do. Set it to `null` to stay in daylight the whole
  way through.

Save the file and run the bat file again. (It clears out the previous batch
first, so you always get a clean run of the timeline.)

## Seeing what each level looks like

Run `node preview-dystopia.js` to render the *same* landscape at eight rising
dystopia levels into a `dystopia-previews` folder — handy for picking settings
you like, since it holds the terrain still and changes only the decay.

## Setting as your Windows wallpaper, Joe

1. Open **Settings > Personalisation > Background**.
2. Set "Personalise your background" to **Slideshow**.
3. Click **Browse** and select the `wallpapers` folder.
4. Set "Change picture every" to **1 day**.
5. Leave **Shuffle off**. The files are numbered `001` to `200` and Windows
   plays them in that order, which is the order the story happens in. Shuffle
   would jump you between serene mountains and a neon megacity at random.

There are 200 wallpapers and you have two screens, so Windows takes two at a
time — one per monitor — and that works out at **100 days** before it starts
over. The two on screen at once are next to each other in the timeline, so
they will always look like the same moment.

## Credits

Landscape generation by [LingDong-](https://github.com/LingDong-/shan-shui-inf), inspired by [traditional Chinese landscape scrolls](https://en.wikipedia.org/wiki/Shan_shui).
