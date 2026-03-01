import { OCRProvider, OCRResult, OCRProgressCallback, TextBlock } from './ocr-provider';

/**
 * Google Cloud Vision OCR Provider
 *
 * Uses Google Cloud Vision API for high-accuracy document OCR.
 * Much better than Tesseract for real-world photos of documents.
 *
 * To enable:
 * 1. Create a Google Cloud project
 * 2. Enable the Cloud Vision API
 * 3. Create an API key with Vision API access
 * 4. Set GOOGLE_CLOUD_VISION_API_KEY in .env.local
 */
export class GoogleVisionProvider implements OCRProvider {
  private apiKey: string | null = null;

  constructor() {
    // Check both server and client env vars
    this.apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY ||
                  process.env.NEXT_PUBLIC_GOOGLE_VISION_API_KEY ||
                  null;
  }

  getName(): string {
    return 'google-vision';
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async initialize(): Promise<void> {
    if (!this.apiKey) {
      throw new Error(
        'Google Cloud Vision API key not configured. ' +
        'Set GOOGLE_CLOUD_VISION_API_KEY environment variable.'
      );
    }
  }

  async terminate(): Promise<void> {
    // No cleanup needed for REST API
  }

  async extractText(
    imageData: Buffer | Blob | string,
    onProgress?: OCRProgressCallback
  ): Promise<OCRResult> {
    if (!this.isAvailable()) {
      throw new Error('Google Cloud Vision provider is not configured');
    }

    onProgress?.(10, 'Preparing image for Google Vision API...');

    const startTime = Date.now();

    // Convert image to base64 if needed
    let base64Image: string;
    if (typeof imageData === 'string') {
      // If it's a data URL, extract the base64 part
      if (imageData.startsWith('data:')) {
        base64Image = imageData.split(',')[1];
      } else {
        base64Image = imageData;
      }
    } else if (imageData instanceof Blob) {
      const arrayBuffer = await imageData.arrayBuffer();
      base64Image = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
    } else {
      // Buffer
      base64Image = Buffer.from(imageData).toString('base64');
    }

    onProgress?.(30, 'Sending to Google Vision API...');

    try {
      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: [{
              image: { content: base64Image },
              features: [
                { type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }
              ]
            }]
          })
        }
      );

      onProgress?.(70, 'Processing response...');

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Google Vision API error:', errorText);
        throw new Error(`Google Vision API error: ${response.status}`);
      }

      const data = await response.json() as GoogleVisionResponse;

      onProgress?.(90, 'Extracting text...');

      const result = this.transformResponse(data, Date.now() - startTime);

      onProgress?.(100, 'Complete');

      console.log('Google Vision OCR result:', {
        textLength: result.rawText.length,
        confidence: result.confidence,
        provider: result.provider,
      });

      return result;
    } catch (error) {
      console.error('Google Vision API request failed:', error);
      throw error;
    }
  }

  /**
   * Transform Google Vision API response to our OCRResult format
   * This will be used when the actual API is integrated
   */
  private transformResponse(apiResponse: GoogleVisionResponse, processingTimeMs: number): OCRResult {
    const textAnnotations = apiResponse.responses?.[0]?.textAnnotations || [];
    const fullTextAnnotation = apiResponse.responses?.[0]?.fullTextAnnotation;

    const blocks: TextBlock[] = [];

    // Skip the first annotation (it's the full text)
    for (let i = 1; i < textAnnotations.length; i++) {
      const annotation = textAnnotations[i];
      const vertices = annotation.boundingPoly?.vertices || [];

      blocks.push({
        text: annotation.description || '',
        confidence: annotation.confidence || 0.9, // Vision API doesn't always provide confidence
        boundingBox: vertices.length >= 4 ? {
          x: vertices[0].x || 0,
          y: vertices[0].y || 0,
          width: (vertices[1].x || 0) - (vertices[0].x || 0),
          height: (vertices[2].y || 0) - (vertices[0].y || 0),
        } : undefined,
      });
    }

    // Calculate average confidence from full text annotation
    let confidence = 0.9; // Default high confidence for Vision API
    if (fullTextAnnotation?.pages) {
      const confidences: number[] = [];
      for (const page of fullTextAnnotation.pages) {
        for (const block of page.blocks || []) {
          if (block.confidence) {
            confidences.push(block.confidence);
          }
        }
      }
      if (confidences.length > 0) {
        confidence = confidences.reduce((a, b) => a + b, 0) / confidences.length * 100;
      }
    }

    return {
      rawText: textAnnotations[0]?.description || '',
      confidence,
      blocks,
      processingTimeMs,
      provider: this.getName(),
    };
  }
}

/**
 * Types for Google Vision API response (partial)
 */
interface GoogleVisionResponse {
  responses?: Array<{
    textAnnotations?: Array<{
      description?: string;
      confidence?: number;
      boundingPoly?: {
        vertices?: Array<{ x?: number; y?: number }>;
      };
    }>;
    fullTextAnnotation?: {
      text?: string;
      pages?: Array<{
        blocks?: Array<{
          confidence?: number;
        }>;
      }>;
    };
  }>;
}

/**
 * Create a singleton instance
 */
let googleVisionInstance: GoogleVisionProvider | null = null;

export function getGoogleVisionProvider(): GoogleVisionProvider {
  if (!googleVisionInstance) {
    googleVisionInstance = new GoogleVisionProvider();
  }
  return googleVisionInstance;
}
