import { BadRequestException } from '@nestjs/common';

const DEFAULT_ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const;
const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;

export interface ImageValidationOptions {
  maxBytes?: number;
  maxCount?: number;
  allowedMimeTypes?: string[];
  context?: string;
}

export interface NormalizedImageAttachment {
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  caption?: string | null;
}

function formatLabel(context?: string, index?: number) {
  const base = context
    ? context.toLowerCase().includes('image')
      ? context
      : `${context} image`
    : 'Image';
  if (typeof index === 'number') {
    return `${base} ${index + 1}`;
  }
  return base;
}

function extensionForMime(mimeType: string) {
  switch (mimeType) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    default:
      return 'jpg';
  }
}

function normalizeFilename(name: unknown, mimeType: string, index: number) {
  const raw = typeof name === 'string' ? name.trim() : '';
  const ext = extensionForMime(mimeType);
  const fallback = `image-${index + 1}.${ext}`;
  const withoutPath = raw.replace(/[\\/]/g, '');
  if (!withoutPath) {
    return fallback;
  }
  if (withoutPath.toLowerCase().endsWith(`.${ext}`)) {
    return withoutPath;
  }
  const base = withoutPath.replace(/\.[^/.]+$/, '') || withoutPath;
  return `${base}.${ext}`;
}

function matchesSignature(buffer: Buffer, mimeType: string) {
  if (mimeType === 'image/jpeg') {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimeType === 'image/png') {
    return (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }
  if (mimeType === 'image/webp') {
    return (
      buffer.length >= 12 &&
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    );
  }
  return false;
}

export function validateDataUrlImage(
  dataUrl: string,
  options: ImageValidationOptions = {}
): { mimeType: string; size: number } {
  const allowedMimeTypes = options.allowedMimeTypes ?? [...DEFAULT_ALLOWED_MIME];
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const label = formatLabel(options.context);

  if (typeof dataUrl !== 'string' || !dataUrl.trim()) {
    throw new BadRequestException(`${label} must be a base64 data URL.`);
  }

  const match = dataUrl.trim().match(/^data:([^;,]+);base64,([\s\S]+)$/i);
  if (!match) {
    throw new BadRequestException(`${label} must be a base64 data URL.`);
  }

  const mimeType = match[1].toLowerCase();
  if (!allowedMimeTypes.includes(mimeType)) {
    throw new BadRequestException(`${label} type ${mimeType} is not allowed.`);
  }

  const base64 = match[2].replace(/\s/g, '');
  if (!base64 || !/^[A-Za-z0-9+/=]+$/.test(base64)) {
    throw new BadRequestException(`${label} data is not valid base64.`);
  }

  const estimatedBytes = Math.floor((base64.length * 3) / 4);
  if (estimatedBytes > maxBytes) {
    throw new BadRequestException(
      `${label} exceeds the ${Math.round(maxBytes / 1024 / 1024)}MB limit.`
    );
  }

  const buffer = Buffer.from(base64, 'base64');
  if (!buffer.length) {
    throw new BadRequestException(`${label} data is not valid base64.`);
  }
  if (buffer.length > maxBytes) {
    throw new BadRequestException(
      `${label} exceeds the ${Math.round(maxBytes / 1024 / 1024)}MB limit.`
    );
  }
  if (!matchesSignature(buffer, mimeType)) {
    throw new BadRequestException(`${label} content does not match its declared type.`);
  }

  return { mimeType, size: buffer.length };
}

export function normalizeImageAttachments(
  input: unknown,
  options: ImageValidationOptions = {}
): NormalizedImageAttachment[] {
  if (input === undefined || input === null) {
    return [];
  }
  if (!Array.isArray(input)) {
    throw new BadRequestException(`${formatLabel(options.context)}s must be an array.`);
  }

  const maxCount = options.maxCount ?? undefined;
  if (maxCount && input.length > maxCount) {
    throw new BadRequestException(
      `${formatLabel(options.context)}s cannot exceed ${maxCount} files.`
    );
  }

  return input.map((raw, index) => {
    if (!raw || typeof raw !== 'object') {
      throw new BadRequestException(`${formatLabel(options.context, index)} is invalid.`);
    }

    const record = raw as Record<string, unknown>;
    const dataUrl =
      (typeof record.data === 'string' && record.data.trim()) ||
      (typeof record.url === 'string' && record.url.trim()) ||
      '';

    if (!dataUrl.startsWith('data:')) {
      throw new BadRequestException(
        `${formatLabel(options.context, index)} must be provided as a base64 data URL.`
      );
    }

    const { mimeType, size } = validateDataUrlImage(dataUrl, {
      ...options,
      context: formatLabel(options.context, index),
    });

    return {
      filename: normalizeFilename(record.name ?? record.filename, mimeType, index),
      url: dataUrl,
      mimeType,
      size,
      caption: typeof record.caption === 'string' ? record.caption : null,
    };
  });
}

export function validateImageUrl(
  value: string,
  options: { allowData?: boolean; maxBytes?: number; context?: string } = {}
) {
  const label = options.context ?? 'Image URL';

  if (typeof value !== 'string' || !value.trim()) {
    throw new BadRequestException(`${label} is required.`);
  }

  const trimmed = value.trim();

  if (trimmed.startsWith('data:')) {
    if (!options.allowData) {
      throw new BadRequestException(`${label} must be an https URL.`);
    }
    validateDataUrlImage(trimmed, {
      maxBytes: options.maxBytes,
      context: label,
    });
    return trimmed;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new BadRequestException(`${label} must be a valid URL.`);
  }

  if (parsed.username || parsed.password) {
    throw new BadRequestException(`${label} must not include credentials.`);
  }
  if (parsed.protocol !== 'https:') {
    throw new BadRequestException(`${label} must use https.`);
  }

  return trimmed;
}
