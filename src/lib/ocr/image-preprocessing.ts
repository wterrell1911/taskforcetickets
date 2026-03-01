'use client';

/**
 * Image Preprocessing for OCR
 *
 * Improves OCR accuracy by:
 * - Converting to grayscale
 * - Increasing contrast
 * - Applying adaptive thresholding
 * - Sharpening edges
 */

export interface PreprocessingOptions {
  grayscale?: boolean;
  contrast?: number; // 1.0 = normal, 1.5 = 50% more contrast
  brightness?: number; // 0 = normal, positive = brighter
  sharpen?: boolean;
  threshold?: boolean; // Convert to black/white
  thresholdValue?: number; // 0-255, default 128
}

const DEFAULT_OPTIONS: PreprocessingOptions = {
  grayscale: true,
  contrast: 1.4,
  brightness: 10,
  sharpen: true,
  threshold: false, // Only use for very poor quality images
};

/**
 * Preprocess an image for better OCR results
 */
export async function preprocessImage(
  imageSource: string | Blob,
  options: PreprocessingOptions = DEFAULT_OPTIONS
): Promise<string> {
  // Load image into canvas
  const img = await loadImage(imageSource);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  canvas.width = img.width;
  canvas.height = img.height;

  // Draw original image
  ctx.drawImage(img, 0, 0);

  // Get image data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Apply preprocessing steps
  if (options.grayscale) {
    applyGrayscale(data);
  }

  if (options.contrast && options.contrast !== 1.0) {
    applyContrast(data, options.contrast);
  }

  if (options.brightness && options.brightness !== 0) {
    applyBrightness(data, options.brightness);
  }

  if (options.sharpen) {
    // Sharpening requires convolution, do it separately
    const sharpened = applySharpen(ctx, canvas.width, canvas.height);
    ctx.putImageData(sharpened, 0, 0);
  } else {
    ctx.putImageData(imageData, 0, 0);
  }

  if (options.threshold) {
    const thresholdData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    applyThreshold(thresholdData.data, options.thresholdValue || 128);
    ctx.putImageData(thresholdData, 0, 0);
  }

  // Return as base64
  return canvas.toDataURL('image/png');
}

/**
 * Load image from various sources
 */
function loadImage(source: string | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;

    if (typeof source === 'string') {
      img.src = source;
    } else {
      img.src = URL.createObjectURL(source);
    }
  });
}

/**
 * Convert to grayscale using luminosity method
 */
function applyGrayscale(data: Uint8ClampedArray): void {
  for (let i = 0; i < data.length; i += 4) {
    // Use luminosity formula: 0.299*R + 0.587*G + 0.114*B
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    data[i] = gray;     // R
    data[i + 1] = gray; // G
    data[i + 2] = gray; // B
    // Alpha unchanged
  }
}

/**
 * Adjust contrast
 */
function applyContrast(data: Uint8ClampedArray, factor: number): void {
  const intercept = 128 * (1 - factor);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp(data[i] * factor + intercept);
    data[i + 1] = clamp(data[i + 1] * factor + intercept);
    data[i + 2] = clamp(data[i + 2] * factor + intercept);
  }
}

/**
 * Adjust brightness
 */
function applyBrightness(data: Uint8ClampedArray, amount: number): void {
  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp(data[i] + amount);
    data[i + 1] = clamp(data[i + 1] + amount);
    data[i + 2] = clamp(data[i + 2] + amount);
  }
}

/**
 * Apply binary threshold
 */
function applyThreshold(data: Uint8ClampedArray, threshold: number): void {
  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i]; // Assuming already grayscale
    const value = gray > threshold ? 255 : 0;
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
  }
}

/**
 * Apply sharpening using convolution
 */
function applySharpen(ctx: CanvasRenderingContext2D, width: number, height: number): ImageData {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const output = ctx.createImageData(width, height);
  const outData = output.data;

  // Sharpening kernel
  const kernel = [
    0, -1, 0,
    -1, 5, -1,
    0, -1, 0
  ];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) { // R, G, B channels
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
            const kernelIdx = (ky + 1) * 3 + (kx + 1);
            sum += data[idx] * kernel[kernelIdx];
          }
        }
        const outIdx = (y * width + x) * 4 + c;
        outData[outIdx] = clamp(sum);
      }
      // Copy alpha
      const idx = (y * width + x) * 4 + 3;
      outData[idx] = data[idx];
    }
  }

  // Copy edges (not processed by convolution)
  for (let x = 0; x < width; x++) {
    copyPixel(data, outData, x, width);
    copyPixel(data, outData, (height - 1) * width + x, width);
  }
  for (let y = 0; y < height; y++) {
    copyPixel(data, outData, y * width, width);
    copyPixel(data, outData, y * width + width - 1, width);
  }

  return output;
}

function copyPixel(src: Uint8ClampedArray, dst: Uint8ClampedArray, idx: number, _width: number): void {
  const i = idx * 4;
  dst[i] = src[i];
  dst[i + 1] = src[i + 1];
  dst[i + 2] = src[i + 2];
  dst[i + 3] = src[i + 3];
}

function clamp(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

/**
 * Auto-detect if image needs preprocessing
 * Returns recommended options based on image analysis
 */
export async function analyzeImage(imageSource: string | Blob): Promise<{
  needsPreprocessing: boolean;
  recommendedOptions: PreprocessingOptions;
  analysis: {
    averageBrightness: number;
    contrast: number;
    isLowQuality: boolean;
  };
}> {
  const img = await loadImage(imageSource);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return {
      needsPreprocessing: true,
      recommendedOptions: DEFAULT_OPTIONS,
      analysis: { averageBrightness: 128, contrast: 0.5, isLowQuality: true },
    };
  }

  // Use smaller size for analysis
  const maxDim = 500;
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Calculate statistics
  let totalBrightness = 0;
  const values: number[] = [];

  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    totalBrightness += gray;
    values.push(gray);
  }

  const pixelCount = data.length / 4;
  const averageBrightness = totalBrightness / pixelCount;

  // Calculate contrast (standard deviation)
  const variance = values.reduce((sum, v) => sum + Math.pow(v - averageBrightness, 2), 0) / pixelCount;
  const stdDev = Math.sqrt(variance);
  const contrast = stdDev / 128; // Normalize to 0-1 range

  const isLowQuality = contrast < 0.3 || averageBrightness < 80 || averageBrightness > 200;

  // Recommend options
  const options: PreprocessingOptions = {
    grayscale: true,
    contrast: contrast < 0.4 ? 1.6 : 1.3,
    brightness: averageBrightness < 100 ? 20 : averageBrightness > 180 ? -20 : 0,
    sharpen: true,
    threshold: contrast < 0.2, // Only for very low contrast
    thresholdValue: Math.round(averageBrightness),
  };

  return {
    needsPreprocessing: isLowQuality || contrast < 0.5,
    recommendedOptions: options,
    analysis: {
      averageBrightness,
      contrast,
      isLowQuality,
    },
  };
}
