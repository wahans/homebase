/**
 * Generate app icon for Vectors
 *
 * Creates a gradient purple background with the vectors logo (two arrows)
 * Run with: node scripts/generate-icon.js
 */

const sharp = require('sharp');
const path = require('path');

const SIZE = 1024;
const ICON_SIZE = SIZE * 0.4; // Arrow size relative to icon

async function generateIcon() {
  // Create SVG with gradient background and arrows
  const svg = `
    <svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#8B5CF6;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#7C3AED;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#6D28D9;stop-opacity:1" />
        </linearGradient>
      </defs>

      <!-- Gradient background -->
      <rect width="${SIZE}" height="${SIZE}" fill="url(#bgGradient)" rx="180" ry="180"/>

      <!-- Arrow 1 (Purple/Violet - pointing down-left) -->
      <g transform="translate(${SIZE * 0.32}, ${SIZE * 0.32})">
        <path
          d="M ${ICON_SIZE * 0.7} 0
             L 0 ${ICON_SIZE * 0.7}
             L ${ICON_SIZE * 0.15} ${ICON_SIZE * 0.7}
             L ${ICON_SIZE * 0.15} ${ICON_SIZE * 0.85}
             L 0 ${ICON_SIZE * 0.85}
             L 0 ${ICON_SIZE * 0.7}
             L ${ICON_SIZE * 0.7} 0"
          fill="none"
          stroke="#C4B5FD"
          stroke-width="${SIZE * 0.06}"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </g>

      <!-- Arrow 2 (Pink - pointing up-right) -->
      <g transform="translate(${SIZE * 0.42}, ${SIZE * 0.42})">
        <path
          d="M 0 ${ICON_SIZE * 0.7}
             L ${ICON_SIZE * 0.7} 0"
          fill="none"
          stroke="#F472B6"
          stroke-width="${SIZE * 0.06}"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </g>
    </svg>
  `;

  // Simple version with cleaner arrows
  const simpleSvg = `
    <svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#A78BFA;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#8B5CF6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#7C3AED;stop-opacity:1" />
        </linearGradient>
      </defs>

      <!-- Gradient background with rounded corners for iOS -->
      <rect width="${SIZE}" height="${SIZE}" fill="url(#bgGradient)"/>

      <!-- Arrow 1 (Light Purple - pointing down-left) -->
      <polyline
        points="${SIZE * 0.55},${SIZE * 0.3} ${SIZE * 0.3},${SIZE * 0.55} ${SIZE * 0.3},${SIZE * 0.42}"
        fill="none"
        stroke="#DDD6FE"
        stroke-width="${SIZE * 0.055}"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <polyline
        points="${SIZE * 0.3},${SIZE * 0.55} ${SIZE * 0.43},${SIZE * 0.55}"
        fill="none"
        stroke="#DDD6FE"
        stroke-width="${SIZE * 0.055}"
        stroke-linecap="round"
        stroke-linejoin="round"
      />

      <!-- Arrow 2 (Pink - pointing up-right) -->
      <polyline
        points="${SIZE * 0.45},${SIZE * 0.7} ${SIZE * 0.7},${SIZE * 0.45} ${SIZE * 0.7},${SIZE * 0.58}"
        fill="none"
        stroke="#F9A8D4"
        stroke-width="${SIZE * 0.055}"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <polyline
        points="${SIZE * 0.7},${SIZE * 0.45} ${SIZE * 0.57},${SIZE * 0.45}"
        fill="none"
        stroke="#F9A8D4"
        stroke-width="${SIZE * 0.055}"
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
