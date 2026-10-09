import { createHash, randomBytes, randomInt } from 'crypto';

export function sha256_hex(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function new_otp_code(): string {
  return String(randomInt(100000, 1000000));
}

export function new_token(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}
