import * as crypto from 'crypto';

export function encrypt(text: string) {
  const algorithm = 'aes-256-ctr';
  const key = crypto
    .createHash('sha256')
    .update(String(process.env.ENCRYPTION_KEY))
    .digest('base64')
    .slice(0, 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string) {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(
    this.algorithm,
    Buffer.from(this.key),
    iv,
  );
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}
