
import crypto from 'crypto';

export function itemHash(title, link) {
  const key = `${title || ''}||${link || ''}`;
  return crypto.createHash('sha256').update(key).digest('hex');
}
