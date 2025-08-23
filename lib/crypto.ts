import crypto from 'crypto';
export const nowSec = () => Math.floor(Date.now()/1000);
export const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex');
export const randomOtp = () => String(Math.floor(100000 + Math.random()*900000));
export const randomId = (len=12) => crypto.randomBytes(len).toString('hex');