const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const OUTPUT_DIR = path.join(__dirname, "cat-previews");

const CATS = [
  {
    name: "01-sitting",
    desc: "Simple sitting cat, round body",
    svg: `
      <ellipse cx="0" cy="0" rx="8" ry="6" fill="rgba(60,50,40,0.8)"/>
      <circle cx="0" cy="-10" r="5" fill="rgba(60,50,40,0.8)"/>
      <polygon points="-4,-14 -2,-19 0,-14" fill="rgba(60,50,40,0.8)"/>
      <polygon points="0,-14 2,-19 4,-14" fill="rgba(60,50,40,0.8)"/>
      <path d="M 7,-2 Q 14,-10 16,-14" stroke="rgba(60,50,40,0.8)" stroke-width="1.5" fill="none"/>
    `,
  },
  {
    name: "02-loaf",
    desc: "Cat loaf - tucked paws, compact",
    svg: `
      <ellipse cx="0" cy="0" rx="10" ry="5" fill="rgba(60,50,40,0.8)"/>
      <ellipse cx="-7" cy="-5" rx="4.5" ry="4" fill="rgba(60,50,40,0.8)"/>
      <polygon points="-10,-8 -9,-14 -7,-8" fill="rgba(60,50,40,0.8)"/>
      <polygon points="-7,-8 -5,-14 -4,-8" fill="rgba(60,50,40,0.8)"/>
      <path d="M 9,-1 Q 13,-6 12,-11" stroke="rgba(60,50,40,0.8)" stroke-width="1.5" fill="none"/>
    `,
  },
  {
    name: "03-stretching",
    desc: "Cat stretching forward, front paws out",
    svg: `
      <ellipse cx="5" cy="0" rx="8" ry="5" fill="rgba(60,50,40,0.8)"/>
      <ellipse cx="-8" cy="3" rx="12" ry="2" fill="rgba(60,50,40,0.8)"/>
      <circle cx="12" cy="-4" r="4" fill="rgba(60,50,40,0.8)"/>
      <polygon points="10,-7 11,-13 13,-7" fill="rgba(60,50,40,0.8)"/>
      <polygon points="13,-7 14,-13 16,-7" fill="rgba(60,50,40,0.8)"/>
      <path d="M -1,2 Q -5,-5 -3,-10" stroke="rgba(60,50,40,0.8)" stroke-width="1.5" fill="none"/>
    `,
  },
  {
    name: "04-walking",
    desc: "Cat walking, legs visible",
    svg: `
      <ellipse cx="0" cy="0" rx="10" ry="4.5" fill="rgba(60,50,40,0.8)"/>
      <circle cx="10" cy="-3" r="4" fill="rgba(60,50,40,0.8)"/>
      <polygon points="8,-6 9,-12 11,-6" fill="rgba(60,50,40,0.8)"/>
      <polygon points="11,-6 12,-12 14,-6" fill="rgba(60,50,40,0.8)"/>
      <line x1="-6" y1="4" x2="-8" y2="10" stroke="rgba(60,50,40,0.8)" stroke-width="1.5"/>
      <line x1="-2" y1="4" x2="-1" y2="10" stroke="rgba(60,50,40,0.8)" stroke-width="1.5"/>
      <line x1="4" y1="4" x2="3" y2="10" stroke="rgba(60,50,40,0.8)" stroke-width="1.5"/>
      <line x1="8" y1="4" x2="10" y2="10" stroke="rgba(60,50,40,0.8)" stroke-width="1.5"/>
      <path d="M -10,0 Q -14,-4 -16,-8" stroke="rgba(60,50,40,0.8)" stroke-width="1.5" fill="none"/>
    `,
  },
  {
    name: "05-curled",
    desc: "Curled up sleeping cat",
    svg: `
      <circle cx="0" cy="0" r="8" fill="rgba(60,50,40,0.8)"/>
      <circle cx="5" cy="-5" r="4" fill="rgba(60,50,40,0.8)"/>
      <polygon points="3,-8 4,-13 6,-8" fill="rgba(60,50,40,0.8)"/>
      <polygon points="6,-8 7,-13 9,-8" fill="rgba(60,50,40,0.8)"/>
      <path d="M -4,6 Q -9,4 -8,-1" stroke="rgba(60,50,40,0.7)" stroke-width="1.5" fill="none"/>
    `,
  },
  {
    name: "06-tall-sitting",
    desc: "Upright sitting cat, alert posture",
    svg: `
      <ellipse cx="0" cy="0" rx="6" ry="10" fill="rgba(60,50,40,0.8)"/>
      <circle cx="0" cy="-14" r="5" fill="rgba(60,50,40,0.8)"/>
      <polygon points="-4,-18 -3,-24 -1,-18" fill="rgba(60,50,40,0.8)"/>
      <polygon points="1,-18 3,-24 4,-18" fill="rgba(60,50,40,0.8)"/>
      <path d="M 5,5 Q 12,0 14,-5" stroke="rgba(60,50,40,0.8)" stroke-width="1.5" fill="none"/>
      <line x1="-4" y1="9" x2="-5" y2="12" stroke="rgba(60,50,40,0.8)" stroke-width="1.2"/>
      <line x1="4" y1="9" x2="5" y2="12" stroke="rgba(60,50,40,0.8)" stroke-width="1.2"/>
    `,
  },
  {
    name: "07-pouncing",
    desc: "Cat mid-pounce, arched back",
    svg: `
      <path d="M -10,2 Q 0,-10 10,2" fill="rgba(60,50,40,0.8)"/>
      <circle cx="10" cy="-1" r="4" fill="rgba(60,50,40,0.8)"/>
      <polygon points="8,-4 9,-10 11,-4" fill="rgba(60,50,40,0.8)"/>
      <polygon points="11,-4 12,-10 14,-4" fill="rgba(60,50,40,0.8)"/>
      <line x1="-8" y1="2" x2="-10" y2="8" stroke="rgba(60,50,40,0.8)" stroke-width="1.5"/>
      <line x1="-5" y1="3" x2="-4" y2="8" stroke="rgba(60,50,40,0.8)" stroke-width="1.5"/>
      <line x1="7" y1="3" x2="8" y2="8" stroke="rgba(60,50,40,0.8)" stroke-width="1.5"/>
      <path d="M -10,2 Q -15,0 -16,-5" stroke="rgba(60,50,40,0.8)" stroke-width="1.5" fill="none"/>
    `,
  },
  {
    name: "08-silhouette",
    desc: "Minimal side-on silhouette",
    svg: `
      <path d="M -12,5 L -12,0 Q -10,-5 -5,-5 L 5,-5 Q 10,-5 10,0 L 10,5 Z" fill="rgba(60,50,40,0.85)"/>
      <circle cx="-10" cy="-8" r="4" fill="rgba(60,50,40,0.85)"/>
      <polygon points="-13,-11 -12,-17 -10,-11" fill="rgba(60,50,40,0.85)"/>
      <polygon points="-10,-11 -8,-17 -7,-11" fill="rgba(60,50,40,0.85)"/>
      <path d="M 10,0 Q 16,-3 18,-8" stroke="rgba(60,50,40,0.85)" stroke-width="1.5" fill="none"/>
    `,
  },
  {
    name: "09-playing",
    desc: "Cat on back, paws up (playful)",
    svg: `
      <ellipse cx="0" cy="0" rx="10" ry="5" fill="rgba(60,50,40,0.8)"/>
      <circle cx="-9" cy="-2" r="4" fill="rgba(60,50,40,0.8)"/>
      <polygon points="-12,-5 -11,-11 -9,-5" fill="rgba(60,50,40,0.8)"/>
      <polygon points="-9,-5 -7,-11 -6,-5" fill="rgba(60,50,40,0.8)"/>
      <line x1="-3" y1="-4" x2="-5" y2="-10" stroke="rgba(60,50,40,0.8)" stroke-width="1.5"/>
      <line x1="2" y1="-4" x2="4" y2="-10" stroke="rgba(60,50,40,0.8)" stroke-width="1.5"/>
      <path d="M 9,0 Q 13,-2 14,-7" stroke="rgba(60,50,40,0.8)" stroke-width="1.5" fill="none"/>
    `,
  },
  {
    name: "10-brushstroke",
    desc: "Abstract ink brushstroke cat, minimal",
    svg: `
      <path d="M -8,4 Q -10,-2 -6,-6 Q -2,-10 2,-8 Q 6,-6 4,0 Q 2,4 -2,5 Z" fill="rgba(60,50,40,0.75)" stroke="rgba(60,50,40,0.9)" stroke-width="0.5"/>
      <path d="M -2,-8 Q -1,-14 1,-12 Q 3,-10 2,-8" fill="rgba(60,50,40,0.75)"/>
      <path d="M 2,-8 Q 4,-14 5,-11 Q 6,-9 4,-7" fill="rgba(60,50,40,0.75)"/>
      <path d="M 4,0 Q 10,-2 14,-8" stroke="rgba(60,50,40,0.8)" stroke-width="2" fill="none" stroke-linecap="round"/>
    `,
  },
];

async function previewCats() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
  }

  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1920, height: 1080 },
  });

  const NATIVE_HEIGHT = 800;
  const scale = 1080 / NATIVE_HEIGHT;
  const nativeWidth = Math.round(1920 / scale);

  for (let i = 0; i < CATS.length; i++) {
    const cat = CATS[i];
    const seed = 777777 + i; // Fixed seeds so landscapes are consistent
    const url = `https://lingdong-.github.io/shan-shui-inf/?seed=${seed}`;

    console.log(`[${i + 1}/${CATS.length}] ${cat.name}: ${cat.desc}`);

    const page = await browser.newPage();
    await page.setViewport({
      width: nativeWidth,
      height: NATIVE_HEIGHT,
      deviceScaleFactor: scale,
    });

    await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });

    await page.evaluate((w) => {
      MEM.windx = w;
      document.getElementById("BG").setAttribute("style", "width:" + w + "px");
      ["SETTING", "SOURCE_BTN", "MENU", "L", "R"].forEach((id) => {
        var el = document.getElementById(id);
        if (el) el.style.display = "none";
      });
      update();
    }, nativeWidth);

    await new Promise((r) => setTimeout(r, 3000));

    // Place cat in a visible spot, centre-bottom area
    await page.evaluate((catSvg) => {
      const svg = document.getElementById("SVG");
      if (!svg) return;
      const vb = svg.getAttribute("viewBox").split(" ").map(Number);
      const x = vb[0] + vb[2] * 0.5;
      const y = 620;
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("transform", `translate(${x},${y}) scale(1.5)`);
      g.innerHTML = catSvg;
      svg.querySelector("g").appendChild(g);
    }, cat.svg);

    const filePath = path.join(OUTPUT_DIR, `${cat.name}.png`);
    await page.screenshot({ path: filePath, type: "png" });
    await page.close();
  }

  await browser.close();
  console.log(`\nDone! Check the cat-previews folder.`);
}

previewCats().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
