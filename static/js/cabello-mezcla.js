// Mantiene la variación luminosa de la imagen; la máscara controla cada píxel.
export function recolor(pixels, mask, hex, strength, original = false, debug = false) {
  if (original) return pixels;
  const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  const targetLuma = .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2];
  for (let i = 0; i < pixels.length; i += 4) {
    const alpha = mask[i + 3] / 255 * (debug ? .7 : strength);
    if (!alpha) continue;
    const luma = .2126 * pixels[i] + .7152 * pixels[i + 1] + .0722 * pixels[i + 2];
    const light = Math.max(0, Math.min(255, luma * .85 + targetLuma * .15));
    for (let c = 0; c < 3; c++) {
      const tint = debug ? [80, 240, 150][c] : Math.max(0, Math.min(255, rgb[c] * light / Math.max(targetLuma, 1)));
      pixels[i + c] = Math.round(pixels[i + c] * (1 - alpha) + tint * alpha);
    }
  }
  return pixels;
}
