import { randomBytes } from 'node:crypto';

export const newId = (prefix: string) => `${prefix}-${randomBytes(6).toString('hex')}`;

export const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9一-鿿]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'x';
