import { BadRequestException } from '@nestjs/common';

import {
  normalizeImageAttachments,
  validateDataUrlImage,
  validateImageUrl,
} from './image-validation';

const makeDataUrl = (mime: string, bytes: number[]) =>
  `data:${mime};base64,${Buffer.from(bytes).toString('base64')}`;

const JPEG_BYTES = [0xff, 0xd8, 0xff, 0xdb];
const PNG_BYTES = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const WEBP_BYTES = [0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50];

describe('image-validation', () => {
  describe('validateDataUrlImage', () => {
    it('accepts a valid jpeg data URL', () => {
      const dataUrl = makeDataUrl('image/jpeg', JPEG_BYTES);
      const result = validateDataUrlImage(dataUrl);
      expect(result.mimeType).toBe('image/jpeg');
      expect(result.size).toBe(Buffer.from(JPEG_BYTES).length);
    });

    it('accepts a valid png data URL', () => {
      const dataUrl = makeDataUrl('image/png', PNG_BYTES);
      const result = validateDataUrlImage(dataUrl);
      expect(result.mimeType).toBe('image/png');
      expect(result.size).toBe(Buffer.from(PNG_BYTES).length);
    });

    it('accepts a valid webp data URL', () => {
      const dataUrl = makeDataUrl('image/webp', WEBP_BYTES);
      const result = validateDataUrlImage(dataUrl);
      expect(result.mimeType).toBe('image/webp');
      expect(result.size).toBe(Buffer.from(WEBP_BYTES).length);
    });

    it('rejects unsupported mime types', () => {
      const dataUrl = makeDataUrl('image/gif', JPEG_BYTES);
      expect(() => validateDataUrlImage(dataUrl)).toThrow(BadRequestException);
    });

    it('rejects invalid base64', () => {
      expect(() => validateDataUrlImage('data:image/png;base64,@@@')).toThrow(BadRequestException);
    });

    it('rejects mismatched signatures', () => {
      const dataUrl = makeDataUrl('image/png', JPEG_BYTES);
      expect(() => validateDataUrlImage(dataUrl)).toThrow(BadRequestException);
    });
  });

  describe('normalizeImageAttachments', () => {
    it('normalizes attachments and filenames', () => {
      const dataUrl = makeDataUrl('image/png', PNG_BYTES);
      const result = normalizeImageAttachments(
        [
          {
            id: 'img-1',
            name: 'proof',
            data: dataUrl,
            type: 'image/png',
            size: 100,
            caption: 'Progress',
          },
        ],
        { context: 'Task' }
      );

      expect(result).toEqual([
        {
          filename: 'proof.png',
          url: dataUrl,
          mimeType: 'image/png',
          size: Buffer.from(PNG_BYTES).length,
          caption: 'Progress',
        },
      ]);
    });

    it('rejects non-array payloads', () => {
      expect(() => normalizeImageAttachments('nope' as any)).toThrow(BadRequestException);
    });

    it('rejects non-data URLs', () => {
      expect(() =>
        normalizeImageAttachments(
          [
            {
              id: 'img-1',
              name: 'proof',
              data: 'https://example.com/image.png',
              type: 'image/png',
              size: 100,
            },
          ],
          { context: 'Task' }
        )
      ).toThrow(BadRequestException);
    });

    it('rejects too many images', () => {
      const dataUrl = makeDataUrl('image/png', PNG_BYTES);
      const images = Array.from({ length: 3 }, (_, index) => ({
        id: `img-${index}`,
        name: `proof-${index}`,
        data: dataUrl,
        type: 'image/png',
        size: 100,
      }));
      expect(() => normalizeImageAttachments(images, { maxCount: 2 })).toThrow(BadRequestException);
    });
  });

  describe('validateImageUrl', () => {
    it('accepts https URLs', () => {
      expect(validateImageUrl('https://example.com/avatar.png')).toBe(
        'https://example.com/avatar.png'
      );
    });

    it('rejects http URLs', () => {
      expect(() => validateImageUrl('http://example.com/avatar.png')).toThrow(BadRequestException);
    });

    it('accepts data URLs when allowed', () => {
      const dataUrl = makeDataUrl('image/jpeg', JPEG_BYTES);
      expect(validateImageUrl(dataUrl, { allowData: true })).toBe(dataUrl);
    });

    it('rejects data URLs when not allowed', () => {
      const dataUrl = makeDataUrl('image/jpeg', JPEG_BYTES);
      expect(() => validateImageUrl(dataUrl)).toThrow(BadRequestException);
    });
  });
});
