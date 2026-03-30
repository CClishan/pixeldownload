import { extension as extensionFromMime } from 'mime-types';

const unsafePattern = /[^a-zA-Z0-9._-]+/g;
const repeatedDashPattern = /-+/g;

export const sanitizeFileName = (value: string) => {
  const cleaned = value
    .trim()
    .replace(unsafePattern, '-')
    .replace(repeatedDashPattern, '-')
    .replace(/^-|-$/g, '');

  return cleaned || 'pixel-download';
};

export const ensureFileExtension = (fileName: string, mimeType?: string) => {
  if (/\.[a-z0-9]{2,5}$/i.test(fileName)) {
    return sanitizeFileName(fileName);
  }

  const ext = mimeType ? extensionFromMime(mimeType) : false;
  if (!ext) {
    return sanitizeFileName(fileName);
  }

  return `${sanitizeFileName(fileName)}.${ext}`;
};
