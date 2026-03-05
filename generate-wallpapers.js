const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

// ============================================
// SETTINGS - Change these to your liking, Joe!
// ============================================
const COUNT = 10; // How many wallpapers to generate
const WIDTH = parseInt(process.argv[2]) || 1920;
const HEIGHT = parseInt(process.argv[3]) || 1080;
// ============================================

const OUTPUT_DIR = path.join(__dirname, "wallpapers");
const PAGE_URL = "https://lingdong-.github.io/shan-shui-inf/";

async function generateWallpapers() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
  }

  console.log(`Generating ${COUNT} wallpapers at ${WIDTH}x${HEIGHT}...`);
  console.log(`Saving to: ${OUTPUT_DIR}`);
  console.log();

  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: WIDTH, height: HEIGHT },
  });

  for (let i = 1; i <= COUNT; i++) {
    const seed = Date.now() + i * 12345;
    const url = `${PAGE_URL}?seed=${seed}`;

    console.log(`[${i}/${COUNT}] Generating wallpaper (seed: ${seed})...`);

    const page = await browser.newPage();

    // The landscape renders at a fixed ~800px height (scroll painting style).
    // We set the viewport to the right aspect ratio at a smaller size, then
    // use deviceScaleRatio to upscale to the target resolution.
    const NATIVE_HEIGHT = 800;
    const scale = HEIGHT / NATIVE_HEIGHT;
    const nativeWidth = Math.round(WIDTH / scale);
    await page.setViewport({
      width: nativeWidth,
      height: NATIVE_HEIGHT,
      deviceScaleFactor: scale,
    });

    await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });

    // Override windx to match native viewport width, hide UI, and re-render
    await page.evaluate((w) => {
      MEM.windx = w;
      document.getElementById("BG").setAttribute("style", "width:" + w + "px");
      // Hide UI elements
      ["SETTING", "SOURCE_BTN", "MENU", "L", "R"].forEach((id) => {
        var el = document.getElementById(id);
        if (el) el.style.display = "none";
      });
      update();
    }, nativeWidth);

    // Wait for the landscape to re-render
    await new Promise((r) => setTimeout(r, 3000));

    const filePath = path.join(OUTPUT_DIR, `shan-shui-${seed}.png`);
    await page.screenshot({ path: filePath, type: "png" });
    await page.close();

    console.log(`  Saved: ${filePath}`);
  }

  await browser.close();
  console.log();
  console.log(`Done! ${COUNT} wallpapers saved to the "wallpapers" folder.`);
}

generateWallpapers().catch((err) => {
  console.error("Something went wrong:", err.message);
  process.exit(1);
});
