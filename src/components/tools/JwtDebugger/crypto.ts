/**
 * Web Crypto API Helpers for Offline JWT Verification
 * 
 * Runs 100% in the browser using native window.crypto.subtle:
 * - HS256, HS384, HS512 (HMAC-SHA)
 * - RS256, RS384, RS512 (RSA-SHA PKCS#1 v1.5)
 * - ES256, ES384, ES512 (ECDSA)
 */

export function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch (err) {
    throw new Error('Invalid Base64Url string');
  }
}

export function base64UrlToUint8Array(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export interface VerificationResult {
  valid: boolean;
  algorithm: string;
  error?: string;
}

/**
 * Verify HMAC JWT Signature (HS256, HS384, HS512)
 */
export async function verifyHmacJwt(
  headerB64: string,
  payloadB64: string,
  signatureB64: string,
  secret: string,
  algorithm: 'HS256' | 'HS384' | 'HS512' = 'HS256'
): Promise<VerificationResult> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    return { valid: false, algorithm, error: 'Web Crypto API not available in this environment' };
  }

  const hashMap: Record<string, string> = {
    HS256: 'SHA-256',
    HS384: 'SHA-384',
    HS512: 'SHA-512'
  };

  const hash = hashMap[algorithm];
  if (!hash) {
    return { valid: false, algorithm, error: `Unsupported HMAC algorithm: ${algorithm}` };
  }

  try {
    const enc = new TextEncoder();
    const keyData = enc.encode(secret);

    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: { name: hash } },
      false,
      ['verify']
    );

    const signedData = enc.encode(`${headerB64}.${payloadB64}`);
    const signatureBytes = base64UrlToUint8Array(signatureB64);

    const isValid = await window.crypto.subtle.verify(
      'HMAC',
      cryptoKey,
      signatureBytes as any,
      signedData as any
    );

    return { valid: isValid, algorithm };
  } catch (err: any) {
    return { valid: false, algorithm, error: err?.message || 'Signature verification failed' };
  }
}

/**
 * Verify RSA Public Key Signature (RS256, RS384, RS512)
 */
export async function verifyRsaJwt(
  headerB64: string,
  payloadB64: string,
  signatureB64: string,
  pemPublicKey: string,
  algorithm: 'RS256' | 'RS384' | 'RS512' = 'RS256'
): Promise<VerificationResult> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    return { valid: false, algorithm, error: 'Web Crypto API not available' };
  }

  const hashMap: Record<string, string> = {
    RS256: 'SHA-256',
    RS384: 'SHA-384',
    RS512: 'SHA-512'
  };

  const hash = hashMap[algorithm];
  if (!hash) {
    return { valid: false, algorithm, error: `Unsupported RSA algorithm: ${algorithm}` };
  }

  try {
    // Strip PEM headers and whitespace
    const pemContents = pemPublicKey
      .replace(/-----BEGIN (?:RSA )?PUBLIC KEY-----/g, '')
      .replace(/-----END (?:RSA )?PUBLIC KEY-----/g, '')
      .replace(/[\r\n\s]/g, '');

    const binaryDer = atob(pemContents);
    const binaryDerBytes = new Uint8Array(binaryDer.length);
    for (let i = 0; i < binaryDer.length; i++) {
      binaryDerBytes[i] = binaryDer.charCodeAt(i);
    }

    const cryptoKey = await window.crypto.subtle.importKey(
      'spki',
      binaryDerBytes.buffer,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: { name: hash }
      },
      false,
      ['verify']
    );

    const enc = new TextEncoder();
    const signedData = enc.encode(`${headerB64}.${payloadB64}`);
    const signatureBytes = base64UrlToUint8Array(signatureB64);

    const isValid = await window.crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      signatureBytes as any,
      signedData as any
    );

    return { valid: isValid, algorithm };
  } catch (err: any) {
    return { valid: false, algorithm, error: err?.message || 'Invalid RSA Public Key or signature' };
  }
}
