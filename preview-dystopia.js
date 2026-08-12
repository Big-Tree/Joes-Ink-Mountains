// Renders the same landscape at rising dystopia levels so you can see
// exactly what each step does. Output goes to dystopia-previews/.
//
//   node preview-dystopia.js [seed] [width] [height]

const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const SEED = process.argv[2] || "joe";
const WIDTH = parseInt(process.argv[3]) || 1920;
const HEIGHT = parseInt(process.argv[4]) || 1080;

const LEVELS = [0, 0.15, 0.3, 0.45, 0.55, 0.7, 0.85, 1.0];

// Match the generator's chapter-two nightfall.
const NIGHT_FROM = 0.75;

const OUTPUT_DIR = path.join(__dirname, "dystopia-previews");
const PAGE_PATH = path.join(__dirname, "index.html");

const gen = require("./generate-wallpapers.js");

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: WIDTH, height: HEIGHT },
  });

  for (const d of LEVELS) {
    const page = await browser.newPage();
    const NATIVE_HEIGHT = 800;
    const scale = HEIGHT / NATIVE_HEIGHT;
    const nativeWidth = Math.round(WIDTH / scale);
    await page.setViewport({
      width: nativeWidth,
      height: NATIVE_HEIGHT,
      deviceScaleFactor: scale,
    });

    const url = `file://${PAGE_PATH}?seed=${SEED}&dyst=${d}`;
    await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });

    await page.evaluate((w) => {
      MEM.windx = w;
      // Width only — replacing the style attribute would drop the inline paper
      // texture the painting multiplies against. See generate-wallpapers.js.
      document.getElementById("BG").style.width = w + "px";
      ["SETTING", "SOURCE_BTN", "MENU", "L", "R"].forEach((id) => {
        var el = document.getElementById(id);
        if (el) el.style.display = "none";
      });
      update();
    }, nativeWidth);

    await new Promise((r) => setTimeout(r, 3000));

    const tally = await page.evaluate(gen.decorate, d, gen.CAT_DESIGNS);
    await page.evaluate(gen.applySmog, d, NIGHT_FROM != null && d >= NIGHT_FROM);

    const name = `dyst-${String(Math.round(d * 100)).padStart(3, "0")}.png`;
    await page.screenshot({ path: path.join(OUTPUT_DIR, name), type: "png" });
    await page.close();

    console.log(
      `${name}  cats:${tally.cats} cables:${tally.wires} drones:${tally.drones}`,
    );
  }

  await browser.close();
  console.log(`\nPreviews in ${OUTPUT_DIR}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
