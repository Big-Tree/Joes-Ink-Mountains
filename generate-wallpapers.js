const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

// ============================================
// SETTINGS - Change these to your liking, Joe!
// ============================================
const COUNT = 100; // How many wallpapers to generate
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

    // 2% chance of a tiny cat sitting somewhere in the landscape
    const hasCat = Math.random() < 0.33;
    if (hasCat) {
      const catDesigns = [
        // Loaf
        `<ellipse cx="0" cy="0" rx="10" ry="5" fill="rgba(60,50,40,0.8)"/>
         <ellipse cx="-7" cy="-5" rx="4.5" ry="4" fill="rgba(60,50,40,0.8)"/>
         <polygon points="-10,-8 -9,-14 -7,-8" fill="rgba(60,50,40,0.8)"/>
         <polygon points="-7,-8 -5,-14 -4,-8" fill="rgba(60,50,40,0.8)"/>
         <path d="M 9,-1 Q 13,-6 12,-11" stroke="rgba(60,50,40,0.8)" stroke-width="1.5" fill="none"/>`,
        // Walking
        `<ellipse cx="0" cy="0" rx="10" ry="4.5" fill="rgba(60,50,40,0.8)"/>
         <circle cx="10" cy="-3" r="4" fill="rgba(60,50,40,0.8)"/>
         <polygon points="8,-6 9,-12 11,-6" fill="rgba(60,50,40,0.8)"/>
         <polygon points="11,-6 12,-12 14,-6" fill="rgba(60,50,40,0.8)"/>
         <line x1="-6" y1="4" x2="-8" y2="10" stroke="rgba(60,50,40,0.8)" stroke-width="1.5"/>
         <line x1="-2" y1="4" x2="-1" y2="10" stroke="rgba(60,50,40,0.8)" stroke-width="1.5"/>
         <line x1="4" y1="4" x2="3" y2="10" stroke="rgba(60,50,40,0.8)" stroke-width="1.5"/>
         <line x1="8" y1="4" x2="10" y2="10" stroke="rgba(60,50,40,0.8)" stroke-width="1.5"/>
         <path d="M -10,0 Q -14,-4 -16,-8" stroke="rgba(60,50,40,0.8)" stroke-width="1.5" fill="none"/>`,
        // Curled up sleeping
        `<circle cx="0" cy="0" r="8" fill="rgba(60,50,40,0.8)"/>
         <circle cx="5" cy="-5" r="4" fill="rgba(60,50,40,0.8)"/>
         <polygon points="3,-8 4,-13 6,-8" fill="rgba(60,50,40,0.8)"/>
         <polygon points="6,-8 7,-13 9,-8" fill="rgba(60,50,40,0.8)"/>
         <path d="M -4,6 Q -9,4 -8,-1" stroke="rgba(60,50,40,0.7)" stroke-width="1.5" fill="none"/>`,
      ];
      await page.evaluate((catSvg) => {
        const svg = document.getElementById("SVG");
        if (!svg) return;
        const vb = svg.getAttribute("viewBox").split(" ").map(Number);
        const x = vb[0] + vb[2] * (0.15 + Math.random() * 0.7);
        const y = 500 + Math.random() * 150;
        const cat = document.createElementNS("http://www.w3.org/2000/svg", "g");
        cat.setAttribute("transform", `translate(${x},${y}) scale(0.4)`);
        cat.innerHTML = catSvg;
        svg.querySelector("g").appendChild(cat);
      }, catDesigns[Math.floor(Math.random() * catDesigns.length)]);
      console.log(`  ~ a cat appeared ~`);
    }

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
