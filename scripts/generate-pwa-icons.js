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
      background: { r: 0, g: 0, b: 0, alpha: 1 },
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
    // Generate regular icons
    await generateIcon(192, "RM\n192");
    await generateIcon(512, "RM\n512");

    // Generate maskable icons
    await generateIcon(192, "RM\n192", true);
    await generateIcon(512, "RM\n512", true);

    console.log("PWA icons generated successfully!");
  } catch (error) {
    console.error("Error generating icons:", error);
  }
}

main();
