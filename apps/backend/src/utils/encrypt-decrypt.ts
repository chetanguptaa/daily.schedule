import * as crypto from 'crypto';
import * as zlib from 'zlib';

export function encrypt(text: string) {
  const algorithm = 'aes-256-ctr';
  const key = crypto
    .createHash('sha256')
    .update(String(process.env.ENCRYPTION_KEY))
    .digest()
    .slice(0, 32);
  const iv = crypto.randomBytes(16);
  const compressedText = zlib.deflateSync(text); // Compress the input
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(compressedText);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return Buffer.from(
    iv.toString('base64') + ':' + encrypted.toString('base64'),
  ).toString('base64');
}

export function decrypt(text: string) {
  const buffer = Buffer.from(text, 'base64');
  const textParts = buffer.toString('utf8').split(':');
  const iv = Buffer.from(textParts.shift(), 'base64');
  const encryptedText = Buffer.from(textParts.join(':'), 'base64');
  const algorithm = 'aes-256-ctr';
  const key = crypto
    .createHash('sha256')
    .update(String(process.env.ENCRYPTION_KEY))
    .digest()
    .slice(0, 32);
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return zlib.inflateSync(decrypted).toString(); // Decompress the output
}
