/**
 * Generate app icon for Vectors
 *
 * Creates a gradient purple background with the vectors logo
 * Exactly matches the header logo in the app:
 * - headerLogoIcon: 28x28 container
 * - headerLogoArrow1: 14x14, borderLeft+borderBottom, purple #7C3AED, rotate 45deg, top:3 left:3
 * - headerLogoArrow2: 14x14, borderRight+borderTop, pink #EC4899, rotate 45deg, bottom:3 right:3
 *
 * Run with: node scripts/generate-icon.js
 */

const sharp = require('sharp');
const path = require('path');

const SIZE = 1024;

async function generateIcon() {
  // Exact match to header logo:
  // In the header, the two L-shaped arrows overlap diagonally
  // Arrow 1 (purple): upper-left, pointing down-left
  // Arrow 2 (pink): lower-right, pointing up-right

  const ARM = SIZE * 0.18;        // Length of each arm of chevron
  const STROKE = SIZE * 0.063;    // Stroke width (10% thinner)

  // Center of icon
  const cx = SIZE / 2;
  const cy = SIZE / 2;

  // Horizontal offset from center for each chevron
  const OFF_X = SIZE * 0.08;

  // Vertical offset - purple shifts up, pink shifts down
  // So bottom of purple aligns with middle of pink, and vice versa
  const OFF_Y = ARM * 0.5;

  const simpleSvg = `
    <svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#EDE9FE;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#E9E3FF;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#E4DEFF;stop-opacity:1" />
        </linearGradient>
      </defs>

      <!-- Light purple gradient background -->
      <rect width="${SIZE}" height="${SIZE}" fill="url(#bgGradient)"/>

      <!-- Arrow 1: Purple/Violet < pointing left, shifted UP -->
      <polyline
        points="${cx - OFF_X},${cy - OFF_Y - ARM} ${cx - OFF_X - ARM},${cy - OFF_Y} ${cx - OFF_X},${cy - OFF_Y + ARM}"
        fill="none"
        stroke="#7C3AED"
        stroke-width="${STROKE}"
        stroke-linecap="round"
        stroke-linejoin="round"
      />

      <!-- Arrow 2: Pink/Magenta > pointing right, shifted DOWN -->
      <polyline
        points="${cx + OFF_X},${cy + OFF_Y - ARM} ${cx + OFF_X + ARM},${cy + OFF_Y} ${cx + OFF_X},${cy + OFF_Y + ARM}"
        fill="none"
        stroke="#EC4899"
        stroke-width="${STROKE}"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  `;

  const assetsDir = path.join(__dirname, '..', 'assets');

  try {
    // Generate main icon
    await sharp(Buffer.from(simpleSvg))
      .png()
      .toFile(path.join(assetsDir, 'icon.png'));
    console.log('Generated icon.png');

    // Generate adaptive icon (same as main)
    await sharp(Buffer.from(simpleSvg))
      .png()
      .toFile(path.join(assetsDir, 'adaptive-icon.png'));
    console.log('Generated adaptive-icon.png');

    // Generate favicon (smaller)
    await sharp(Buffer.from(simpleSvg))
      .resize(32, 32)
      .png()
      .toFile(path.join(assetsDir, 'favicon.png'));
    console.log('Generated favicon.png');

    console.log('\nAll icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcon();
