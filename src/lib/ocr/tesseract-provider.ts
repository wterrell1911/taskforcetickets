'use client';

import Tesseract, { createWorker, Worker, RecognizeResult } from 'tesseract.js';
import { OCRProvider, OCRResult, OCRProgressCallback, TextBlock } from './ocr-provider';
import { preprocessImage, analyzeImage } from './image-preprocessing';

/**
 * Tesseract.js OCR Provider
 *
 * Client-side OCR processing using Tesseract.js
 * Processes images in a web worker to avoid blocking the UI
 */
export class TesseractProvider implements OCRProvider {
  private worker: Worker | null = null;
  private initialized = false;

  getName(): string {
    return 'tesseract';
  }

  isAvailable(): boolean {
    return typeof window !== 'undefined';
  }

  async initialize(): Promise<void> {
    if (this.initialized && this.worker) {
      return;
    }

    this.worker = await createWorker('eng', 1, {
      logger: () => {}, // Suppress default logging
    });

    // Configure Tesseract parameters for ID card/document processing
    await this.worker.setParameters({
      tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK, // Treat as single block of text
      preserve_interword_spaces: '1',
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-/., ',
    });

    this.initialized = true;
  }

  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.initialized = false;
    }
  }

  async extractText(
    imageData: Buffer | Blob | string,
    onProgress?: OCRProgressCallback
  ): Promise<OCRResult> {
    const startTime = Date.now();

    // Initialize if needed
    if (!this.initialized) {
      onProgress?.(5, 'Initializing OCR engine...');
      await this.initialize();
    }

    if (!this.worker) {
      throw new Error('Tesseract worker not initialized');
    }

    // Convert to format Tesseract can process
    let imageSource: string | Blob;
    if (typeof imageData === 'string') {
      // Assume base64 or URL
      imageSource = imageData;
    } else if (imageData instanceof Blob) {
      imageSource = imageData;
    } else {
      // Buffer - convert to base64
      const base64 = Buffer.from(imageData).toString('base64');
      imageSource = `data:image/png;base64,${base64}`;
    }

    onProgress?.(10, 'Analyzing image quality...');

    // Analyze and preprocess image for better OCR results
    try {
      const analysis = await analyzeImage(imageSource);
      console.log('Image analysis:', analysis.analysis);

      if (analysis.needsPreprocessing) {
        onProgress?.(20, 'Enhancing image for OCR...');
        imageSource = await preprocessImage(imageSource, analysis.recommendedOptions);
        console.log('Image preprocessed with options:', analysis.recommendedOptions);
      }
    } catch (err) {
      console.warn('Image preprocessing failed, using original:', err);
    }

    onProgress?.(30, 'Processing image...');

    // Perform OCR with progress tracking
    const result = await this.worker.recognize(imageSource, {}, {
      text: true,
      blocks: true,
      hocr: false,
      tsv: false,
    });

    onProgress?.(90, 'Extracting text...');

    const ocrResult = this.transformResult(result, Date.now() - startTime);

    onProgress?.(100, 'Complete');

    return ocrResult;
  }

  private transformResult(result: RecognizeResult, processingTimeMs: number): OCRResult {
    const blocks: TextBlock[] = [];

    // Extract blocks with confidence scores
    if (result.data.blocks) {
      for (const block of result.data.blocks) {
        blocks.push({
          text: block.text,
          confidence: block.confidence,
          boundingBox: block.bbox ? {
            x: block.bbox.x0,
            y: block.bbox.y0,
            width: block.bbox.x1 - block.bbox.x0,
            height: block.bbox.y1 - block.bbox.y0,
          } : undefined,
        });
      }
    }

    return {
      rawText: result.data.text,
      confidence: result.data.confidence,
      blocks,
      processingTimeMs,
      provider: this.getName(),
    };
  }
}

/**
 * Create a singleton instance for reuse
 */
let tesseractInstance: TesseractProvider | null = null;

export function getTesseractProvider(): TesseractProvider {
  if (!tesseractInstance) {
    tesseractInstance = new TesseractProvider();
  }
  return tesseractInstance;
}
