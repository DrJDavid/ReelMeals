const sharp = require("sharp");

// Create a simple placeholder icon with text
async function generateIcon(size, isMaskable = false) {
  // Create a solid background with the brand color
  const icon = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 139, g: 92, b: 246, alpha: 1 }, // #8b5cf6
    },
  })
    .composite([
      {
        input: Buffer.from(
          `<svg width="${size}" height="${size}">
            <style>
              text {
                font-family: system-ui, -apple-system, BlinkMacSystemFont;
                font-weight: 900;
                fill: white;
              }
            </style>
            <text
              x="50%"
              y="52%"
              font-size="${Math.floor(size * 0.7)}"
              text-anchor="middle"
              dominant-baseline="middle"
              letter-spacing="-${Math.floor(size * 0.05)}px"
            >RM</text>
          </svg>`
        ),
        top: 0,
        left: 0,
      },
    ])
    .png();

  // For non-maskable icons, save as both the regular name and test name
  if (!isMaskable) {
    await icon.toFile(`public/icons/icon-${size}x${size}.png`);
    if (size === 192) {
      await icon.toFile(`public/icons/test-icon-192.png`);
    }
  } else {
    // For maskable icons, only save with maskable name
    await icon.toFile(`public/icons/icon-maskable-${size}x${size}.png`);
  }
}

async function main() {
  try {
    // Only generate the sizes we actually use
    const sizes = [192, 512];

    // Regular icons
    for (const size of sizes) {
      await generateIcon(size);
      console.log(`Generated ${size}x${size} icon`);
    }

    // Maskable icons
    for (const size of sizes) {
      await generateIcon(size, true);
      console.log(`Generated ${size}x${size} maskable icon`);
    }

    console.log("PWA icons generated successfully!");
  } catch (error) {
    console.error("Error generating icons:", error);
  }
}

main();
