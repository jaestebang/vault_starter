import { Injectable } from '@angular/core';

function str2ab(str: string) { return new TextEncoder().encode(str); }
function ab2str(buf: ArrayBuffer) { return new TextDecoder().decode(buf); }
function ab2b64(buf: ArrayBuffer) {
  const u8 = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
  return btoa(s);
}
function b642ab(b64: string) {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr.buffer;
}

@Injectable({ providedIn: 'root' })
export class CryptoService {
  constructor() {}

  randomBytes(len = 16) {
    const a = new Uint8Array(len);
    crypto.getRandomValues(a);
    return a.buffer;
  }

  async deriveKey(masterPassword: string, saltB64: string, iterations = 250000) {
    const salt = b642ab(saltB64);
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      str2ab(masterPassword),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: salt, iterations, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
    return key;
  }

  async encryptWithMaster(masterPassword: string, plaintext: string) {
    const saltBuf = this.randomBytes(16);
    const saltB64 = ab2b64(saltBuf);
    const key = await this.deriveKey(masterPassword, saltB64);

    const ivBuf = this.randomBytes(12);
    const ivB64 = ab2b64(ivBuf);

    const enc = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: ivBuf },
      key,
      str2ab(plaintext)
    );
    const ciphertextB64 = ab2b64(enc);
    return { ciphertext: ciphertextB64, iv: ivB64, salt: saltB64 };
  }

  async decryptEntry(masterPassword: string, ciphertextB64: string, ivB64: string, saltB64: string) {
    const key = await this.deriveKey(masterPassword, saltB64);
    const ct = b642ab(ciphertextB64);
    const iv = b642ab(ivB64);
    try {
      const plainBuf = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        ct
      );
      return ab2str(plainBuf);
    } catch (e) {
      throw new Error('Decryption failed - wrong master password or corrupted data');
    }
  }

  generatePassword(length = 16, options = { upper: true, lower: true, digits: true, symbols: true }) {
    const sets: string[] = [];
    if (options.lower) sets.push('abcdefghijklmnopqrstuvwxyz');
    if (options.upper) sets.push('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    if (options.digits) sets.push('0123456789');
    if (options.symbols) sets.push('!@#$%^&*()-_=+[]{};:,.<>/?');
    const all = sets.join('');
    const rnd = new Uint32Array(length);
    crypto.getRandomValues(rnd);
    let pw = '';
    for (let i = 0; i < length; i++) pw += all[rnd[i] % all.length];
    return pw;
  }
}
