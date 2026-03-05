# Shan Shui Wallpaper Generator

Generate beautiful procedural Chinese landscape wallpapers from [{Shan, Shui}*](https://lingdong-.github.io/shan-shui-inf/).

![Screenshot1](/screenshots/screen001.jpg?raw=true "")
![Screenshot2](/screenshots/screen002.jpg?raw=true "")

## Setup (one time only)

1. **Install Node.js** — go to https://nodejs.org and download the LTS version. Run the installer (just keep clicking Next).

2. **Download this folder** — click the green "Code" button on GitHub, then "Download ZIP". Unzip it somewhere on your computer.

## Generating wallpapers

1. Open the folder you unzipped.
2. Double-click the bat file for your monitor resolution:
   - **`generate.bat`** — 1920x1080 (Full HD)
   - **`generate-2k.bat`** — 2560x1440 (QHD)
   - **`generate-4k.bat`** — 3840x2160 (4K)
3. A black window will appear — the first time it will download some stuff, which takes a minute or two.
4. It will then generate your wallpapers. When it says "Done!", your images will be in the **`wallpapers`** folder.

## Customisation

Joe, if you want to change how many wallpapers are generated, open `generate-wallpapers.js` in Notepad and change the number at the top:

```js
const COUNT = 10; // How many wallpapers to generate
```

Save the file and run the bat file again.

## Setting as your Windows wallpaper

1. Open **Settings > Personalisation > Background**.
2. Set "Personalise your background" to **Slideshow**.
3. Click **Browse** and select the `wallpapers` folder.
4. Choose how often you want it to change (every minute, 10 minutes, hour, etc.).

## Credits

Landscape generation by [LingDong-](https://github.com/LingDong-/shan-shui-inf), inspired by [traditional Chinese landscape scrolls](https://en.wikipedia.org/wiki/Shan_shui).
