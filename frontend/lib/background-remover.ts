/**
 * Client-Side Image Background Removal Utility
 * 
 * Automatically strips white, off-white, scanned paper, and light photo backgrounds
 * from uploaded stamp and signature images using HTML5 Canvas pixel manipulation.
 * Preserves high-contrast ink (dark blue, black, purple, crimson, red) while converting
 * paper backdrops into 100% alpha transparency with anti-aliased edge smoothing.
 */

export interface BackgroundRemovalOptions {
  /**
   * Color distance tolerance from detected paper background (0 - 150).
   * Default: 50
   */
  tolerance?: number;
  /**
   * Smoothing transition range to prevent jagged edges (1 - 30).
   * Default: 18
   */
  feather?: number;
  /**
   * Target max width/height to keep payload size optimal for Base64 storage.
   * Default: 800
   */
  maxDimension?: number;
  /**
   * Force luminance-based white paper removal even if background color differs.
   * Default: true
   */
  removeLightPaper?: boolean;
  /**
   * High-luminance threshold for paper (0 - 255).
   * Default: 215
   */
  luminanceThreshold?: number;
}

/**
 * Removes background from an image file, blob, or URL, returning a transparent PNG Data URL.
 */
export async function removeImageBackground(
  imageSource: File | Blob | string,
  options: BackgroundRemovalOptions = {}
): Promise<string> {
  const {
    tolerance = 50,
    feather = 18,
    maxDimension = 800,
    removeLightPaper = true,
    luminanceThreshold = 215,
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Downscale oversized scans to keep storage lean and responsive
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
          reject(new Error('Failed to create 2D canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // 1. Detect dominant background color by sampling 4 corner regions
        const samplePoints = [
          [0, 0],
          [width - 1, 0],
          [0, height - 1],
          [width - 1, height - 1],
          [Math.floor(width / 2), 0],
          [Math.floor(width / 2), height - 1],
        ];

        let bgR = 255;
        let bgG = 255;
        let bgB = 255;
        let sampleCount = 0;

        for (const [sx, sy] of samplePoints) {
          const idx = (sy * width + sx) * 4;
          const alpha = data[idx + 3];
          if (alpha > 50) {
            bgR += data[idx];
            bgG += data[idx + 1];
            bgB += data[idx + 2];
            sampleCount++;
          }
        }

        if (sampleCount > 0) {
          bgR = Math.round(bgR / (sampleCount + 1));
          bgG = Math.round(bgG / (sampleCount + 1));
          bgB = Math.round(bgB / (sampleCount + 1));
        }

        const innerThreshold = Math.max(5, tolerance - feather);
        const outerThreshold = tolerance;

        // 2. Iterate pixels and apply adaptive alpha mask
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const existingAlpha = data[i + 3];

          if (existingAlpha === 0) continue;

          // Euclidean color distance from detected paper backdrop
          const distToBg = Math.sqrt(
            Math.pow(r - bgR, 2) + Math.pow(g - bgG, 2) + Math.pow(b - bgB, 2)
          );

          // Euclidean color distance from pure white (for paper scans)
          const distToWhite = Math.sqrt(
            Math.pow(r - 255, 2) + Math.pow(g - 255, 2) + Math.pow(b - 255, 2)
          );

          // Perceived luminance (ITU-R BT.709)
          const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

          // Neutral saturation check (paper is mostly grayscale/low-chroma)
          const maxChannel = Math.max(r, g, b);
          const minChannel = Math.min(r, g, b);
          const chroma = maxChannel - minChannel;

          let targetAlpha = existingAlpha;

          // Condition A: Close to sampled background
          if (distToBg < innerThreshold) {
            targetAlpha = 0;
          } else if (distToBg < outerThreshold) {
            const factor = (distToBg - innerThreshold) / (outerThreshold - innerThreshold);
            targetAlpha = Math.min(targetAlpha, Math.round(existingAlpha * factor));
          }

          // Condition B: High-luminance paper background with low chroma
          if (removeLightPaper && luminance >= luminanceThreshold && chroma < 35) {
            const lumOver = luminance - luminanceThreshold;
            const lumRange = 255 - luminanceThreshold;
            const factor = Math.max(0, 1 - (lumOver / lumRange));
            targetAlpha = Math.min(targetAlpha, Math.round(existingAlpha * factor));
          }

          // Condition C: Very close to pure white paper regardless of detected background
          if (distToWhite < innerThreshold) {
            targetAlpha = 0;
          } else if (distToWhite < outerThreshold) {
            const factor = (distToWhite - innerThreshold) / (outerThreshold - innerThreshold);
            targetAlpha = Math.min(targetAlpha, Math.round(existingAlpha * factor));
          }

          // Defringe: if semi-transparent, darken the RGB toward ink color to eliminate white fringes
          if (targetAlpha < existingAlpha && targetAlpha > 0) {
            const alphaRatio = targetAlpha / 255;
            // Contrast boost for ink visibility
            data[i] = Math.round(r * alphaRatio);
            data[i + 1] = Math.round(g * alphaRatio);
            data[i + 2] = Math.round(b * alphaRatio);
          }

          data[i + 3] = targetAlpha;
        }

        ctx.putImageData(imageData, 0, 0);
        const transparentPngUrl = canvas.toDataURL('image/png');
        resolve(transparentPngUrl);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for background removal processing'));
    };

    if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        img.src = reader.result as string;
      };
      reader.onerror = () => {
        reject(new Error('Failed to read image file'));
      };
      reader.readAsDataURL(imageSource);
    }
  });
}
