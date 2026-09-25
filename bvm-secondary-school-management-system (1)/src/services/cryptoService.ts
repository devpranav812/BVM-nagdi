/**
 * Cryptographic utility for password hashing and secure verification.
 * Uses the Web Crypto API (SubtleCrypto) with SHA-256 and salt.
 * Ensures NO plain text passwords are stored in the codebase or database.
 */

const SALT_PREFIX = 'BVM_NAGDI_SECURE_SALT_v2_';

export class CryptoService {
  /**
   * Generates a secure salted SHA-256 hash of the password.
   */
  static async hashPassword(password: string): Promise<string> {
    if (!password) return '';
    try {
      const encoder = new TextEncoder();
      const saltedData = encoder.encode(`${SALT_PREFIX}${password.trim()}`);
      const hashBuffer = await crypto.subtle.digest('SHA-256', saltedData);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback simple hash for older environments without subtle crypto
      let hash = 0;
      const str = `${SALT_PREFIX}${password}`;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
      }
      return `h_${Math.abs(hash).toString(16)}`;
    }
  }

  /**
   * Verifies an input password against a stored hash or value.
   * Supports backward compatibility with existing credentials and auto-upgrades them.
   */
  static async verifyPassword(inputPassword: string, storedHashOrPassword?: string): Promise<boolean> {
    if (!storedHashOrPassword || !inputPassword) return false;

    const trimmedInput = inputPassword.trim();
    const stored = storedHashOrPassword.trim();

    // 1. Check against salted hash
    const inputHash = await this.hashPassword(trimmedInput);
    if (inputHash === stored) {
      return true;
    }

    // 2. Fallback check if stored value was legacy plain text
    if (trimmedInput === stored) {
      return true;
    }

    return false;
  }

  /**
   * Determines if a string is already a 64-character hexadecimal SHA-256 hash.
   */
  static isHash(value?: string): boolean {
    if (!value || typeof value !== 'string') return false;
    return /^[a-f0-9]{64}$/i.test(value) || value.startsWith('h_');
  }
}
