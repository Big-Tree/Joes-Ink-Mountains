const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

// ============================================
// SETTINGS - Change these to your liking, Joe!
// ============================================
// Two monitors, so Windows takes two images off the pile at a time. 200 gets
// Joe a hundred days out of the timeline before it repeats.
const COUNT = 200; // How many wallpapers to generate
const WIDTH = parseInt(process.argv[2]) || 1920;
const HEIGHT = parseInt(process.argv[3]) || 1080;

// How grim things get by the last wallpaper.
//   0   = pure serene mountains, no decay at all
//   0.5 = a bit built-up, some pylons, a Pizza Hut or two
//   1   = full late-capitalist collapse
const DYSTOPIA_MAX = 1.0;

// Where the rot starts. 0 means the very first wallpaper is still pristine.
const DYSTOPIA_MIN = 0.0;

// CHAPTER THREE. Tower blocks start going up at 50% and the city builds in
// daylight; at this level night falls and the ink painting inverts into a neon
// megacity. Set to null to stay in daylight for the whole run.
const NIGHT_FROM = 0.75;
// ============================================

const OUTPUT_DIR = path.join(__dirname, "wallpapers");
const PAGE_PATH = path.join(__dirname, "index.html");

// ---------------------------------------------------------------
// Overlay props. These are drawn on top of the finished landscape in
// the same washed-out ink greys, so they sit in the painting rather
// than on it.
// ---------------------------------------------------------------

const INK = "rgba(60,50,40,0.8)";

const CAT_DESIGNS = [
  // Loaf
  `<ellipse cx="0" cy="0" rx="10" ry="5" fill="${INK}"/>
   <ellipse cx="-7" cy="-5" rx="4.5" ry="4" fill="${INK}"/>
   <polygon points="-10,-8 -9,-14 -7,-8" fill="${INK}"/>
   <polygon points="-7,-8 -5,-14 -4,-8" fill="${INK}"/>
   <path d="M 9,-1 Q 13,-6 12,-11" stroke="${INK}" stroke-width="1.5" fill="none"/>`,
  // Walking
  `<ellipse cx="0" cy="0" rx="10" ry="4.5" fill="${INK}"/>
   <circle cx="10" cy="-3" r="4" fill="${INK}"/>
   <polygon points="8,-6 9,-12 11,-6" fill="${INK}"/>
   <polygon points="11,-6 12,-12 14,-6" fill="${INK}"/>
   <line x1="-6" y1="4" x2="-8" y2="10" stroke="${INK}" stroke-width="1.5"/>
   <line x1="-2" y1="4" x2="-1" y2="10" stroke="${INK}" stroke-width="1.5"/>
   <line x1="4" y1="4" x2="3" y2="10" stroke="${INK}" stroke-width="1.5"/>
   <line x1="8" y1="4" x2="10" y2="10" stroke="${INK}" stroke-width="1.5"/>
   <path d="M -10,0 Q -14,-4 -16,-8" stroke="${INK}" stroke-width="1.5" fill="none"/>`,
  // Curled up sleeping
  `<circle cx="0" cy="0" r="8" fill="${INK}"/>
   <circle cx="5" cy="-5" r="4" fill="${INK}"/>
   <polygon points="3,-8 4,-13 6,-8" fill="${INK}"/>
   <polygon points="6,-8 7,-13 9,-8" fill="${INK}"/>
   <path d="M -4,6 Q -9,4 -8,-1" stroke="${INK}" stroke-width="0.7" fill="none"/>`,
];

/**
 * Everything that gets painted on after the landscape is finished.
 * Runs inside the page. `d` is the dystopia level, 0..1.
 */
function decorate(d, catDesigns) {
  const svg = document.getElementById("SVG");
  if (!svg) return { cats: 0, wires: 0, drones: 0 };

  const g = svg.querySelector("g");
  const vb = svg.getAttribute("viewBox").split(" ").map(Number);
  const [vx, vy, vw, vh] = vb;

  const rnd = (a, b) => a + Math.random() * (b - a);
  const grey = (a) => `rgba(100,100,100,${a})`;

  const mkg = (markup) => {
    const el = document.createElementNS("http://www.w3.org/2000/svg", "g");
    el.innerHTML = markup;
    return el;
  };

  const add = (markup) => g.appendChild(mkg(markup));

  // The landscape is painted back to front, one group per chunk, each tagged
  // with its depth. Anything attached to something in the scene has to go in
  // at that same depth — otherwise a cable strung between two pylons draws
  // straight over the hill that is hiding one of them.
  const layers = Array.prototype.map
    .call(g.querySelectorAll(":scope > g.chunk"), (el) => ({
      el,
      z: Number(el.dataset.z),
    }))
    .filter((l) => Number.isFinite(l.z));

  const addAt = (markup, z) => {
    // Sit just behind the first layer that is nearer than z, so everything in
    // front of that depth still occludes it.
    const infront = layers.find((l) => l.z > z);
    if (infront) g.insertBefore(mkg(markup), infront.el);
    else g.appendChild(mkg(markup));
  };

  // For things that aren't attached to anything in the scene and only have a
  // sense of how far away they are. 0 is the far horizon, 1 is right overhead.
  // Biased towards the front: these are flying, so most of them are over the
  // landscape rather than in it. Only the genuinely distant ones sit far
  // enough back for a ridge to cut across them.
  const addByDepth = (markup, dep) => {
    const k = Math.floor((0.78 + 0.22 * dep) * layers.length);
    if (!layers.length || k >= layers.length) g.appendChild(mkg(markup));
    else g.insertBefore(mkg(markup), layers[k].el);
  };

  // --- Power lines -------------------------------------------------
  // The transmission towers registered themselves while the landscape was
  // being generated. Sling a sagging cable between any two neighbours that
  // are close enough and at a similar height.
  let wires = 0;
  const towers = (window.DYSTOPIA.towers || [])
    .filter((t) => t.x > vx - 200 && t.x < vx + vw + 200)
    .sort((a, b) => a.x - b.x);

  for (let i = 0; i < towers.length - 1; i++) {
    const a = towers[i];
    const b = towers[i + 1];
    const dx = b.x - a.x;
    // Towers are spaced widely apart now, so spans have to be allowed to
    // reach — a line crossing a whole valley is the point of them.
    if (dx < 12 || dx > 950) continue;
    if (Math.abs(b.top - a.top) > 260) continue;
    // Only string a line between towers standing in roughly the same layer.
    // Connecting a far ridge to a near one reads as a cable floating across
    // the whole valley at the wrong depth.
    const az = a.z == null ? 0 : a.z;
    const bz = b.z == null ? 0 : b.z;
    if (Math.abs(az - bz) > 120) continue;
    // Hang it at the depth of whichever tower is further back, so any hill in
    // front of that tower hides the cable along with it.
    const z = Math.min(az, bz);

    // Three cables at slightly different crossarm heights.
    for (let k = 0; k < 3; k++) {
      const off = k * 14;
      const ay = a.top + off;
      const by = b.top + off;
      const sag = dx * 0.13 + 6;
      const mx = (a.x + b.x) / 2;
      const my = (ay + by) / 2 + sag;
      addAt(
        `<path d="M ${a.x},${ay} Q ${mx},${my} ${b.x},${by}" ` +
          `stroke="${grey(0.35)}" stroke-width="0.9" fill="none"/>`,
        z,
      );
      // The odd bird sitting on the wire.
      if (Math.random() < 0.25 * d) {
        const t = rnd(0.25, 0.75);
        const bx = a.x + dx * t;
        const by2 =
          (1 - t) * (1 - t) * ay + 2 * (1 - t) * t * my + t * t * by;
        addAt(
          `<path d="M ${bx - 2},${by2} q 2,-4 4,0" stroke="${grey(0.7)}" ` +
            `stroke-width="1.4" fill="none"/>`,
          z,
        );
      }
      wires++;
    }
  }

  // --- Skybridges --------------------------------------------------
  // Walkways strung between neighbouring tower blocks, high up. Nothing says
  // "they built upwards and never came down" quite like these.
  let bridges = 0;
  const cyber = d <= 0.5 ? 0 : (d - 0.5) / 0.5;
  const blocks = (window.DYSTOPIA.blocks || [])
    .filter((b) => b.x > vx - 200 && b.x < vx + vw + 200)
    .sort((a, b) => a.x - b.x);

  for (let i = 0; i < blocks.length - 1; i++) {
    const a = blocks[i];
    const b = blocks[i + 1];
    const gap = b.x - a.x - (a.wid + b.wid) / 2;
    if (gap < 4 || gap > 120) continue;
    if (Math.random() > 0.25 + cyber * 0.4) continue;
    const az = a.z == null ? 0 : a.z;
    const bz = b.z == null ? 0 : b.z;
    if (Math.abs(az - bz) > 120) continue;

    // Sit the bridge somewhere in the overlap of the two towers' heights.
    const lo = Math.max(a.top, b.top) + 12;
    const hi = Math.min(a.y, b.y) - 25;
    if (hi <= lo) continue;
    const y = rnd(lo, hi);
    const x0 = a.x + a.wid * 0.4;
    const x1 = b.x - b.wid * 0.4;
    const h = rnd(4, 7);
    addAt(
      `<rect x="${x0}" y="${y}" width="${x1 - x0}" height="${h}" ` +
        `fill="rgba(255,255,255,0.85)" stroke="${grey(0.45)}" stroke-width="0.9"/>` +
        `<line x1="${x0}" y1="${y + h / 2}" x2="${x1}" y2="${y + h / 2}" ` +
        `stroke="${grey(0.3)}" stroke-width="0.5"/>`,
      Math.min(az, bz),
    );
    bridges++;
  }

  // --- Drones ------------------------------------------------------
  // Nothing says "the future went wrong" like something watching you.
  // Everything about one of these is driven by a single `dep` value: 0 is a
  // speck on the horizon, 1 is close enough to hear. Size, ink, stroke weight
  // and what can occlude it all follow from it, so distance actually reads
  // instead of the whole swarm looking stamped on at one scale.
  let drones = 0;

  const drone = (x, y, dep, rot) => {
    const s = 0.35 + dep * 1.35;
    const ink = 0.2 + dep * 0.45;
    // Divided by the scale so the rendered weight is what we asked for rather
    // than whatever the transform happens to leave. Far ones are hairlines.
    const sw = ((0.5 + dep * 0.9) / s).toFixed(2);
    const tw = ((0.42 + dep * 0.75) / s).toFixed(2);
    return (
      `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${s.toFixed(3)})">` +
      `<line x1="-9" y1="-3" x2="9" y2="-3" stroke="${grey(ink)}" stroke-width="${sw}"/>` +
      `<ellipse cx="0" cy="0" rx="4" ry="2.4" fill="${grey(ink)}"/>` +
      `<line x1="-9" y1="-3" x2="-9" y2="-6" stroke="${grey(ink)}" stroke-width="${tw}"/>` +
      `<line x1="9" y1="-3" x2="9" y2="-6" stroke="${grey(ink)}" stroke-width="${tw}"/>` +
      `<line x1="-13" y1="-6.5" x2="-5" y2="-6.5" stroke="${grey(ink * 0.75)}" stroke-width="${tw}"/>` +
      `<line x1="5" y1="-6.5" x2="13" y2="-6.5" stroke="${grey(ink * 0.75)}" stroke-width="${tw}"/>` +
      `<circle cx="0" cy="2.5" r="1.2" fill="${grey(Math.min(0.9, ink * 1.25))}"/>` +
      `</g>`
    );
  };

  // One drone, placed at whatever depth it claims to be at, so a ridge in
  // front of it hides it like anything else in the painting.
  const putDrone = (x, y, dep) => {
    addByDepth(drone(x, y, dep, rnd(-8, 8)), dep);
    drones++;
  };

  // Distant ones sit high and tight against the horizon; nearer ones drop
  // towards the ridge tops. Deliberately kept above the skyline — they are
  // aircraft, and anything flying down among the foreground peaks is simply
  // painted over by them and lost.
  const droneY = (dep) => vy + rnd(0.02 + 0.1 * dep, 0.13 + 0.26 * dep) * vh;

  // They hold off until the pylons and the power lines have had the frame to
  // themselves for a while — the sky is the last thing to go.
  if (d >= 0.22) {
    const t = (d - 0.22) / 0.78;

    // Loose singles, each at its own distance.
    const singles = Math.round(rnd(0, 2) + t * 10);
    for (let i = 0; i < singles; i++) {
      const dep = Math.random();
      putDrone(vx + rnd(0.04, 0.96) * vw, droneY(dep), dep);
    }

    // Later on they start moving together — but as a drifting skein rather
    // than a queue. The line bends, the spacing wanders, and each drone keeps
    // its own distance, so a group reads as a flock and not as a stamp
    // repeated at fixed intervals.
    const skeins = d < 0.5 ? 0 : Math.round(rnd(0, 0.7) + ((d - 0.5) / 0.5) * 2.2);
    for (let p = 0; p < skeins; p++) {
      const n = Math.round(rnd(4, 7));
      const base = rnd(0.2, 0.95);
      const ang = rnd(-0.3, 0.3); // near-horizontal heading
      const bend = rnd(-0.9, 0.9); // how much the skein curves
      const step = rnd(24, 50) * (0.55 + base);
      const x0 = vx + rnd(0.03, 0.72) * vw;
      const y0 = droneY(base);
      for (let i = 0; i < n; i++) {
        const u = i / (n - 1);
        const along = i * step * rnd(0.72, 1.28);
        const across = bend * step * (2 * u * u - u) + rnd(-13, 13);
        putDrone(
          x0 + along * Math.cos(ang) - across * Math.sin(ang),
          y0 + along * Math.sin(ang) + across * Math.cos(ang),
          Math.min(1, Math.max(0.03, base + rnd(-0.2, 0.2))),
        );
      }
    }
  }

  // --- Birds -------------------------------------------------------
  // A scattering of crows circling. They thin out at the very end.
  const flock = Math.round(rnd(0, 3) + d * 10 * (1 - d * 0.5));
  for (let i = 0; i < flock; i++) {
    const x = vx + rnd(0.05, 0.95) * vw;
    const y = vy + rnd(0.03, 0.35) * vh;
    const s = rnd(0.5, 1.4);
    add(
      `<path d="M ${x - 5 * s},${y} q ${2.5 * s},${-3 * s} ${5 * s},0 ` +
        `q ${2.5 * s},${-3 * s} ${5 * s},0" stroke="${grey(rnd(0.25, 0.5))}" ` +
        `stroke-width="${1.1 * s}" fill="none"/>`,
    );
  }

  // --- Cat ---------------------------------------------------------
  // Joe's cat: an easter egg, not an infestation. One in three wallpapers
  // hides exactly one, at every point on the timeline.
  let cats = 0;
  if (Math.random() < 1 / 3) {
    const x = vx + rnd(0.08, 0.92) * vw;
    const y = 480 + Math.random() * 190;
    const s = rnd(0.3, 0.55);
    const design = catDesigns[Math.floor(Math.random() * catDesigns.length)];
    add(`<g transform="translate(${x},${y}) scale(${s})">${design}</g>`);
    cats++;
  }

  return { cats, wires, drones, bridges };
}

/**
 * Smog haze over the whole page. Pure CSS, sits above the painting.
 * Chapter one is a warm particulate murk; chapter two cools it towards a
 * blue-green petrochemical dusk as the city takes over.
 *
 * Deliberately a single flat wash rather than a gradient: the original
 * artwork is one uniform paper colour with ink lines on top, and sky, water
 * and hills are only told apart by the drawing. A vertical gradient would
 * split them into bands and break that.
 */
function applySmog(d, night) {
  const old = document.getElementById("SMOG");
  if (old) old.remove();
  if (d <= 0.05) return;

  const cyber = d <= 0.5 ? 0 : (d - 0.5) / 0.5;
  const mix = (a, b) => Math.round(a + (b - a) * cyber);

  // Warm sepia -> cold teal as chapter two sets in.
  const hiR = mix(150, 70),
    hiG = mix(130, 105),
    hiB = mix(95, 130);

  const el = document.createElement("div");
  el.id = "SMOG";
  el.style.cssText = `
    position:fixed; inset:0; pointer-events:none; z-index:999;
    background: rgba(${hiR},${hiG},${hiB},${(0.19 * d + 0.08 * cyber).toFixed(3)});
  `;
  document.body.appendChild(el);

  // Wash the ink out a little too, like looking through bad air.
  const bg = document.getElementById("BG");
  if (bg) {
    bg.style.filter =
      `sepia(${(0.35 * d * (1 - cyber * 0.7)).toFixed(2)}) ` +
      `contrast(${(1 - 0.18 * d).toFixed(2)})`;
  }

  // Optional night flip for the deep cyberpunk end. Inverting only the
  // painting turns the cream paper to deep blue and the ink to pale neon;
  // the page behind it is set to match so the margins don't band.
  if (night && cyber > 0) {
    if (bg) bg.style.filter += ` invert(1) saturate(${(1 + cyber).toFixed(2)})`;
    document.documentElement.style.background = "#0a0f1c";
    document.body.style.background = "#0a0f1c";
    // Night falls all at once, so the very first night frame has to already
    // look like night — the neon then builds on top of that floor.
    const n = 0.3 + 0.7 * cyber;
    // Flat again, for the same reason as the daylight wash: the inverted
    // paper is one colour and the drawing is what separates sky from water.
    el.style.background = `rgba(10,18,42,${(0.34 * n).toFixed(3)})`;
  }
}

async function generateWallpapers() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
  }

  // Clear out the previous batch. The wallpapers are numbered in order so
  // that a desktop slideshow walks forwards through time — leaving stragglers
  // from an older run would jumble that sequence up.
  const stale = fs
    .readdirSync(OUTPUT_DIR)
    .filter((f) => /^shan-shui-.*\.png$/.test(f));
  stale.forEach((f) => fs.unlinkSync(path.join(OUTPUT_DIR, f)));
  if (stale.length) console.log(`Cleared ${stale.length} old wallpapers.`);

  console.log(`Generating ${COUNT} wallpapers at ${WIDTH}x${HEIGHT}...`);
  console.log(`Saving to: ${OUTPUT_DIR}`);
  console.log();

  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: WIDTH, height: HEIGHT },
  });

  const pad = String(COUNT).length;

  for (let i = 1; i <= COUNT; i++) {
    const seed = Date.now() + i * 12345;

    // Ramp the decay across the set. Because the files are numbered in
    // order, a desktop slideshow walks forwards through time.
    const t = COUNT === 1 ? 0 : (i - 1) / (COUNT - 1);
    const dyst = DYSTOPIA_MIN + (DYSTOPIA_MAX - DYSTOPIA_MIN) * t;

    const url =
      `file://${PAGE_PATH}?seed=${seed}&dyst=${dyst.toFixed(4)}`;

    console.log(
      `[${i}/${COUNT}] seed ${seed} — dystopia ${(dyst * 100).toFixed(0)}%`,
    );

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
      // Set the width only — do NOT replace the whole style attribute. The paper
      // texture is an inline background-image on #BG, and the painting is drawn
      // with mix-blend-mode:multiply against it. Wipe the texture and the smog
      // filter later turns #BG into a backdrop root with nothing behind it, so
      // the mountains' white fill stops being a no-op and they go bright white
      // while the sky and water stay paper-coloured.
      document.getElementById("BG").style.width = w + "px";
      // Hide UI elements
      ["SETTING", "SOURCE_BTN", "MENU", "L", "R"].forEach((id) => {
        var el = document.getElementById(id);
        if (el) el.style.display = "none";
      });
      update();
    }, nativeWidth);

    // Wait for the landscape to re-render
    await new Promise((r) => setTimeout(r, 3000));

    const night = NIGHT_FROM != null && dyst >= NIGHT_FROM;
    const tally = await page.evaluate(decorate, dyst, CAT_DESIGNS);
    await page.evaluate(applySmog, dyst, night);

    const bits = [];
    if (tally.cats) bits.push(`${tally.cats} cat${tally.cats > 1 ? "s" : ""}`);
    if (tally.wires) bits.push(`${tally.wires} cables`);
    if (tally.bridges) bits.push(`${tally.bridges} skybridges`);
    if (tally.drones) bits.push(`${tally.drones} drones`);
    if (night) bits.push("night");
    if (bits.length) console.log(`  ${bits.join(", ")}`);

    const num = String(i).padStart(pad, "0");
    const filePath = path.join(OUTPUT_DIR, `shan-shui-${num}.png`);
    await page.screenshot({ path: filePath, type: "png" });
    await page.close();

    console.log(`  Saved: ${filePath}`);
  }

  await browser.close();
  console.log();
  console.log(`Done! ${COUNT} wallpapers saved to the "wallpapers" folder.`);
}

// Shared with preview-dystopia.js, which reuses the same overlay props.
module.exports = { decorate, applySmog, CAT_DESIGNS };

if (require.main === module) {
  generateWallpapers().catch((err) => {
    console.error("Something went wrong:", err.message);
    process.exit(1);
  });
}
