'use client';

import { LocalImageAttachment } from '@/types';

export interface ImageProcessingOptions {
  maxSizeMB?: number;
  maxDimension?: number;
  maxPixels?: number;
  allowedMimeTypes?: string[];
  outputType?: 'image/jpeg' | 'image/png';
  quality?: number;
  cropSquare?: boolean;
}

export interface ImageProcessingResult {
  images: LocalImageAttachment[];
  errors: string[];
}

const DEFAULT_ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const DEFAULT_MAX_DIMENSION = 4096;
const DEFAULT_MAX_PIXELS = 16_000_000;

const MAX_HEADER_BYTES = 12;
const MAX_SVG_SNIFF_BYTES = 256;

function normalizeFileName(name: string, mimeType: string) {
  const base = name.replace(/\.[^/.]+$/, '') || 'image';
  const ext = mimeType === 'image/png' ? 'png' : 'jpg';
  return `${base}.${ext}`;
}

function estimateBase64Size(dataUrl: string) {
  const base64 = dataUrl.split(',')[1] || '';
  return Math.floor((base64.length * 3) / 4);
}

function hasSvgSignature(text: string) {
  const lower = text.toLowerCase();
  return lower.includes('<svg') || (lower.includes('<?xml') && lower.includes('svg'));
}

async function sniffMimeType(file: File) {
  const headerBuffer = await file.slice(0, MAX_HEADER_BYTES).arrayBuffer();
  const header = new Uint8Array(headerBuffer);

  if (header.length >= 3 && header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) {
    return 'image/jpeg';
  }

  if (
    header.length >= 8 &&
    header[0] === 0x89 &&
    header[1] === 0x50 &&
    header[2] === 0x4e &&
    header[3] === 0x47 &&
    header[4] === 0x0d &&
    header[5] === 0x0a &&
    header[6] === 0x1a &&
    header[7] === 0x0a
  ) {
    return 'image/png';
  }

  if (
    header.length >= 12 &&
    header[0] === 0x52 &&
    header[1] === 0x49 &&
    header[2] === 0x46 &&
    header[3] === 0x46 &&
    header[8] === 0x57 &&
    header[9] === 0x45 &&
    header[10] === 0x42 &&
    header[11] === 0x50
  ) {
    return 'image/webp';
  }

  const textSample = await file.slice(0, MAX_SVG_SNIFF_BYTES).text();
  if (hasSvgSignature(textSample)) {
    return 'image/svg+xml';
  }

  return null;
}

async function loadImage(file: File) {
  const objectUrl = URL.createObjectURL(file);
  const image = new Image();
  image.decoding = 'async';
  image.src = objectUrl;

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Unable to decode image.'));
  });

  URL.revokeObjectURL(objectUrl);
  return image;
}

export function isSafeImageUrl(url: string) {
  if (!url) return true;
  const trimmed = url.trim();

  if (trimmed.startsWith('data:')) {
    return /^data:image\/(jpeg|png|webp);base64,/i.test(trimmed);
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.username || parsed.password) return false;
    if (parsed.protocol !== 'https:') return false;
    return true;
  } catch {
    return false;
  }
}

export async function processImageFile(
  file: File,
  options: ImageProcessingOptions = {}
): Promise<{ image?: LocalImageAttachment; error?: string }> {
  const maxSizeMB = options.maxSizeMB ?? 5;
  const maxDimension = options.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const maxPixels = options.maxPixels ?? DEFAULT_MAX_PIXELS;
  const allowedMimeTypes = options.allowedMimeTypes ?? DEFAULT_ALLOWED_MIME;

  if (file.size > maxSizeMB * 1024 * 1024) {
    return { error: `${file.name} exceeds ${maxSizeMB}MB.` };
  }

  const sniffed = await sniffMimeType(file);
  if (!sniffed) {
    return { error: `${file.name} is not a supported image type.` };
  }
  if (sniffed === 'image/svg+xml') {
    return { error: `${file.name} is an SVG, which is not allowed.` };
  }
  if (file.type && file.type !== sniffed) {
    return { error: `${file.name} does not match its file type.` };
  }
  if (!allowedMimeTypes.includes(sniffed)) {
    return { error: `${file.name} must be a JPG, PNG, or WebP image.` };
  }

  const image = await loadImage(file);
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  if (!sourceWidth || !sourceHeight) {
    return { error: `${file.name} could not be decoded.` };
  }

  if (sourceWidth * sourceHeight > maxPixels) {
    return { error: `${file.name} is too large to process safely.` };
  }

  const cropSquare = options.cropSquare ?? false;
  const outputType = options.outputType ?? (sniffed === 'image/png' ? 'image/png' : 'image/jpeg');
  const quality = outputType === 'image/jpeg' ? (options.quality ?? 0.9) : undefined;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { error: `${file.name} could not be processed.` };
  }

  let sx = 0;
  let sy = 0;
  let sw = sourceWidth;
  let sh = sourceHeight;
  if (cropSquare) {
    const cropSize = Math.min(sourceWidth, sourceHeight);
    sx = Math.floor((sourceWidth - cropSize) / 2);
    sy = Math.floor((sourceHeight - cropSize) / 2);
    sw = cropSize;
    sh = cropSize;
  }

  const maxTarget = maxDimension > 0 ? maxDimension : Math.max(sw, sh);
  const scale = Math.min(1, maxTarget / Math.max(sw, sh));
  const targetWidth = Math.max(1, Math.round(sw * scale));
  const targetHeight = Math.max(1, Math.round(sh * scale));

  canvas.width = targetWidth;
  canvas.height = targetHeight;
  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);

  const dataUrl = canvas.toDataURL(outputType, quality);
  const estimatedSize = estimateBase64Size(dataUrl);
  if (estimatedSize > maxSizeMB * 1024 * 1024) {
    return { error: `${file.name} is still too large after processing.` };
  }

  return {
    image: {
      id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: normalizeFileName(file.name, outputType),
      data: dataUrl,
      type: outputType,
      size: estimatedSize,
      createdAt: new Date().toISOString(),
    },
  };
}

export async function processImageFiles(
  files: File[] | FileList,
  options: ImageProcessingOptions = {}
): Promise<ImageProcessingResult> {
  const fileArray = Array.from(files);
  const images: LocalImageAttachment[] = [];
  const errors: string[] = [];

  for (const file of fileArray) {
    const { image, error } = await processImageFile(file, options);
    if (error) {
      errors.push(error);
      continue;
    }
    if (image) {
      images.push(image);
    }
  }

  return { images, errors };
}
