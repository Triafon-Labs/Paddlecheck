// Draws the colour and icon reference images for the club files
// (docs/club-yaml/colours.svg and icons.svg) from the lists the app itself
// uses: STATUS_COLORS / ON_STATUS_COLORS in lib/statusColors.ts and ICONS in
// lib/clubConfig.ts. Run it after changing either list:
//   node scripts/club-yaml-reference.mjs
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

const objectEntries = (source, name) => {
  const block = source.match(
    new RegExp(`${name}(?::[^=]*)? = \\{([\\s\\S]*?)\\n\\}`)
  );
  if (!block) throw new Error(`Couldn't find ${name}`);
  return [...block[1].matchAll(/^\s*(\w+):\s*"?([^",\s]+)"?,/gm)].map((m) => [
    m[1],
    m[2],
  ]);
};

const statusColors = read("lib/statusColors.ts");
const colours = objectEntries(statusColors, "STATUS_COLORS");
const onColours = Object.fromEntries(
  objectEntries(statusColors, "ON_STATUS_COLORS")
);
const icons = objectEntries(read("lib/clubConfig.ts"), "ICONS");

const iconPath = (component) => {
  const js = read(`node_modules/@mui/icons-material/${component}.js`);
  const d = [...js.matchAll(/d: "([^"]+)"/g)].map((m) => m[1]);
  if (d.length === 0) throw new Error(`No path in ${component}`);
  return d.join(" ");
};

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const font = `font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"`;
const mono = `font-family="ui-monospace, 'SF Mono', Menlo, Consolas, monospace"`;

// Colours: one swatch per name, in its own text colour, as the status panel
// shows it.
{
  const w = 440,
    rowH = 56,
    gap = 10,
    pad = 20;
  const h = pad * 2 + 28 + colours.length * (rowH + gap) - gap;
  const rows = colours
    .map(([name, hex], i) => {
      const y = pad + 28 + i * (rowH + gap);
      const on = onColours[name];
      return `
  <rect x="${pad}" y="${y}" width="${w - pad * 2}" height="${rowH}" rx="14" fill="${hex}"/>
  <text x="${pad + 18}" y="${y + 35}" ${mono} font-size="17" font-weight="600" fill="${on}">${esc(name)}</text>
  <text x="${w - pad - 18}" y="${y + 35}" ${mono} font-size="15" fill="${on}" text-anchor="end">${hex}</text>`;
    })
    .join("");
  fs.writeFileSync(
    path.join(root, "docs/club-yaml/colours.svg"),
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" rx="16" fill="#F7F9FA" stroke="#D5DDE1"/>
  <text x="${pad}" y="${pad + 14}" ${font} font-size="15" font-weight="600" fill="#1F2A30">colour: …</text>${rows}
</svg>
`
  );
}

// Icons: each name with the icon it draws.
{
  const cols = 5,
    cell = 112,
    cellH = 104,
    pad = 20,
    head = 28;
  const rowsN = Math.ceil(icons.length / cols);
  const w = pad * 2 + cols * cell,
    h = pad * 2 + head + rowsN * cellH;
  const cells = icons
    .map(([name, component], i) => {
      const x = pad + (i % cols) * cell,
        y = pad + head + Math.floor(i / cols) * cellH;
      return `
  <rect x="${x + 6}" y="${y}" width="${cell - 12}" height="${cellH - 12}" rx="12" fill="#FFFFFF" stroke="#D5DDE1"/>
  <g transform="translate(${x + cell / 2 - 18} ${y + 14}) scale(1.5)"><path d="${iconPath(component)}" fill="#1F2A30"/></g>
  <text x="${x + cell / 2}" y="${y + cellH - 26}" ${mono} font-size="13" fill="#1F2A30" text-anchor="middle">${esc(name)}</text>`;
    })
    .join("");
  fs.writeFileSync(
    path.join(root, "docs/club-yaml/icons.svg"),
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" rx="16" fill="#F7F9FA" stroke="#D5DDE1"/>
  <text x="${pad}" y="${pad + 14}" ${font} font-size="15" font-weight="600" fill="#1F2A30">icon: … / reasonIcon: …</text>${cells}
</svg>
`
  );
}

console.log(`Wrote ${colours.length} colours and ${icons.length} icons`);
