import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Resvg } from '@resvg/resvg-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.resolve(__dirname, '../public');
const PATH_DATA = "M50.4 78.5a75.1 75.1 0 0 0-28.5 6.9l24.2-65.7c.7-2 1.9-3.2 3.4-3.2h29c1.5 0 2.7 1.2 3.4 3.2l24.2 65.7s-11.6-7-28.5-7L67 45.5c-.4-1.7-1.6-2.8-2.9-2.8-1.3 0-2.5 1.1-2.9 2.7L50.4 78.5Zm-1.1 28.2Zm-4.2-20.2c-2 6.6-.6 15.8 4.2 20.2a17.5 17.5 0 0 1 .2-.7 5.5 5.5 0 0 1 5.7-4.5c2.8.1 4.3 1.5 4.7 4.7.2 1.1.2 2.3.2 3.5v.4c0 2.7.7 5.2 2.2 7.4a13 13 0 0 0 5.7 4.9v-.3l-.2-.3c-1.8-5.6-.5-9.5 4.4-12.8l1.5-1a73 73 0 0 0 3.2-2.2 16 16 0 0 0 6.8-11.4c.3-2 .1-4-.6-6l-.8.6-1.6 1a37 37 0 0 1-22.4 2.7c-5-.7-9.7-2-13.2-6.2Z";

// Generate transparent SVG icon
function makeTransparentSvg(size) {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 128 128" fill="none">
      <path d="${PATH_DATA}" fill="#0f172a" />
    </svg>
  `;
}

// Generate solid background SVG icon for devices (PWA / Apple touch icon)
function makeSolidSvg(size) {
  const innerSize = size * 0.6;
  const scale = innerSize / 128;
  const padding = (size - innerSize) / 2;
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="${size}" height="${size}" fill="#0f172a" />
      <g transform="translate(${padding}, ${padding}) scale(${scale})">
        <path d="${PATH_DATA}" fill="#f8fafc" />
      </g>
    </svg>
  `;
}

async function renderPng(svgString, size, outputPath) {
  const resvg = new Resvg(svgString, {
    fitTo: {
      mode: 'width',
      value: size,
    },
  });
  const pngData = resvg.render().asPng();
  await fs.promises.writeFile(outputPath, pngData);
  console.log(`✓ Rendered PNG (${size}x${size}): ${path.basename(outputPath)}`);
}

async function main() {
  try {
    // 1. Transparent Favicons
    const svg16 = makeTransparentSvg(16);
    await renderPng(svg16, 16, path.join(PUBLIC_DIR, 'favicon-16x16.png'));

    const svg32 = makeTransparentSvg(32);
    await renderPng(svg32, 32, path.join(PUBLIC_DIR, 'favicon-32x32.png'));

    // 2. Apple Touch Icon (180x180 solid background)
    const appleSvg = makeSolidSvg(180);
    await renderPng(appleSvg, 180, path.join(PUBLIC_DIR, 'apple-touch-icon.png'));

    // 3. Android PWA Icons (192x192 and 512x512 solid background)
    const icon192 = makeSolidSvg(192);
    await renderPng(icon192, 192, path.join(PUBLIC_DIR, 'icon-192.png'));

    const icon512 = makeSolidSvg(512);
    await renderPng(icon512, 512, path.join(PUBLIC_DIR, 'icon-512.png'));

    console.log('🎉 All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

main();
