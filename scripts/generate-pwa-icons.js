const sharp = require("sharp");

// Create a simple placeholder icon with text
async function generateIcon(size, text, isMaskable = false) {
  const padding = isMaskable ? Math.floor(size * 0.1) : 0; // 10% padding for maskable icons
  const effectiveSize = size - padding * 2;

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 139, g: 92, b: 246, alpha: 1 }, // #8b5cf6 (matching theme color)
    },
  })
    .composite([
      {
        input: {
          text: {
            text: `RM\n${size}`,
            font: "sans-serif",
            fontSize: Math.floor(effectiveSize / 4),
            rgba: true,
          },
        },
        gravity: "center",
      },
    ])
    .png()
    .toFile(
      `public/icons/icon${isMaskable ? "-maskable" : ""}-${size}x${size}.png`
    );
}

async function main() {
  try {
    // Generate all icon sizes
    const sizes = [36, 48, 72, 96, 144, 152, 192, 384, 512];

    // Regular icons
    for (const size of sizes) {
      await generateIcon(size, `RM\n${size}`);
      console.log(`Generated ${size}x${size} icon`);
    }

    // Maskable icons (only for larger sizes)
    const maskableSizes = [192, 512];
    for (const size of maskableSizes) {
      await generateIcon(size, `RM\n${size}`, true);
      console.log(`Generated ${size}x${size} maskable icon`);
    }

    console.log("PWA icons generated successfully!");
  } catch (error) {
    console.error("Error generating icons:", error);
  }
}

main();
